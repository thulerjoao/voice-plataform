package avatars

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

const (
	MaxBytes     = 256 << 10 // 256 KiB
	BytesPerSec  = 16 << 10  // ~16 KB/s
	hashHexLen   = 64
	metaFileName = "current.json"
)

var (
	ErrNotFound   = errors.New("avatar not found")
	ErrTooLarge   = errors.New("avatar too large")
	ErrBadMime    = errors.New("avatar mime unsupported")
	ErrBadPayload = errors.New("avatar payload invalid")
)

type Meta struct {
	Hash string `json:"hash"`
	Mime string `json:"mime"`
	Size int    `json:"size"`
}

type Store struct {
	root string
	mu   sync.Mutex
}

func NewStore(root string) (*Store, error) {
	root = strings.TrimSpace(root)
	if root == "" {
		root = filepath.Join("data", "avatars")
	}
	if err := os.MkdirAll(root, 0o755); err != nil {
		return nil, fmt.Errorf("avatars dir: %w", err)
	}
	return &Store{root: root}, nil
}

func (s *Store) Root() string {
	if s == nil {
		return ""
	}
	return s.root
}

// LoadAllHashes reads current.json under each uid directory (bootstrap).
func (s *Store) LoadAllHashes() map[string]string {
	out := make(map[string]string)
	if s == nil {
		return out
	}
	entries, err := os.ReadDir(s.root)
	if err != nil {
		return out
	}
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		uid := entry.Name()
		meta, err := s.LoadMeta(uid)
		if err != nil || meta.Hash == "" {
			continue
		}
		out[uid] = meta.Hash
	}
	return out
}

func (s *Store) LoadMeta(uid string) (*Meta, error) {
	uid = strings.TrimSpace(uid)
	if uid == "" {
		return nil, ErrNotFound
	}
	raw, err := os.ReadFile(s.metaPath(uid))
	if err != nil {
		if os.IsNotExist(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	var meta Meta
	if json.Unmarshal(raw, &meta) != nil || meta.Hash == "" {
		return nil, ErrNotFound
	}
	return &meta, nil
}

func (s *Store) Open(uid, hash string) (*os.File, *Meta, error) {
	uid = strings.TrimSpace(uid)
	hash = normalizeHash(hash)
	if uid == "" {
		return nil, nil, ErrNotFound
	}

	if hash != "" {
		path := s.findFile(uid, hash)
		if path == "" {
			return nil, nil, ErrNotFound
		}
		f, err := os.Open(path)
		if err != nil {
			if os.IsNotExist(err) {
				return nil, nil, ErrNotFound
			}
			return nil, nil, err
		}
		info, _ := f.Stat()
		size := 0
		if info != nil {
			size = int(info.Size())
		}
		return f, &Meta{Hash: hash, Mime: mimeFromPath(path), Size: size}, nil
	}

	meta, err := s.LoadMeta(uid)
	if err != nil {
		return nil, nil, err
	}
	path := s.findFile(uid, meta.Hash)
	if path == "" {
		path = s.filePath(uid, meta.Hash, meta.Mime)
	}
	f, err := os.Open(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil, ErrNotFound
		}
		return nil, nil, err
	}
	return f, meta, nil
}

func (s *Store) Save(uid, mime string, body []byte) (*Meta, error) {
	uid = strings.TrimSpace(uid)
	mime = normalizeMime(mime)
	if uid == "" || len(body) == 0 {
		return nil, ErrBadPayload
	}
	if len(body) > MaxBytes {
		return nil, ErrTooLarge
	}
	if mime == "" {
		return nil, ErrBadMime
	}
	sum := sha256.Sum256(body)
	hash := hex.EncodeToString(sum[:])

	s.mu.Lock()
	defer s.mu.Unlock()

	dir := s.userDir(uid)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}
	path := s.filePath(uid, hash, mime)
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, body, 0o644); err != nil {
		return nil, err
	}
	if err := os.Rename(tmp, path); err != nil {
		_ = os.Remove(tmp)
		return nil, err
	}

	meta := &Meta{Hash: hash, Mime: mime, Size: len(body)}
	raw, _ := json.Marshal(meta)
	metaPath := s.metaPath(uid)
	metaTmp := metaPath + ".tmp"
	if err := os.WriteFile(metaTmp, raw, 0o644); err != nil {
		return nil, err
	}
	if err := os.Rename(metaTmp, metaPath); err != nil {
		_ = os.Remove(metaTmp)
		return nil, err
	}

	s.pruneLocked(uid, hash)
	return meta, nil
}

func (s *Store) Delete(uid string) error {
	uid = strings.TrimSpace(uid)
	if uid == "" {
		return nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	dir := s.userDir(uid)
	if err := os.RemoveAll(dir); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

func (s *Store) pruneLocked(uid, keepHash string) {
	dir := s.userDir(uid)
	entries, err := os.ReadDir(dir)
	if err != nil {
		return
	}
	keepWebp := filepath.Base(s.filePath(uid, keepHash, "image/webp"))
	keepJpg := filepath.Base(s.filePath(uid, keepHash, "image/jpeg"))
	keepPng := filepath.Base(s.filePath(uid, keepHash, "image/png"))
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if name == metaFileName || name == keepWebp || name == keepJpg || name == keepPng {
			continue
		}
		_ = os.Remove(filepath.Join(dir, name))
	}
}

func (s *Store) userDir(uid string) string {
	return filepath.Join(s.root, uid)
}

func (s *Store) metaPath(uid string) string {
	return filepath.Join(s.userDir(uid), metaFileName)
}

func (s *Store) filePath(uid, hash, mime string) string {
	ext := ".webp"
	if strings.Contains(mime, "jpeg") || strings.Contains(mime, "jpg") {
		ext = ".jpg"
	} else if strings.Contains(mime, "png") {
		ext = ".png"
	}
	return filepath.Join(s.userDir(uid), hash+ext)
}

func (s *Store) findFile(uid, hash string) string {
	dir := s.userDir(uid)
	for _, ext := range []string{".webp", ".jpg", ".png"} {
		path := filepath.Join(dir, hash+ext)
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}
	return ""
}

func normalizeHash(hash string) string {
	hash = strings.ToLower(strings.TrimSpace(hash))
	if len(hash) != hashHexLen {
		return ""
	}
	for _, r := range hash {
		if (r < '0' || r > '9') && (r < 'a' || r > 'f') {
			return ""
		}
	}
	return hash
}

func normalizeMime(mime string) string {
	mime = strings.ToLower(strings.TrimSpace(strings.Split(mime, ";")[0]))
	switch mime {
	case "image/webp", "image/jpeg", "image/png":
		return mime
	case "image/jpg":
		return "image/jpeg"
	default:
		return ""
	}
}

func mimeFromPath(path string) string {
	switch strings.ToLower(filepath.Ext(path)) {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	default:
		return "image/webp"
	}
}

func HashBytes(body []byte) string {
	sum := sha256.Sum256(body)
	return hex.EncodeToString(sum[:])
}
