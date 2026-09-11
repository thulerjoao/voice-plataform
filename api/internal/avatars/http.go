package avatars

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/thulerjoao/voice-plataform/api/internal/db"
)

// HashPublisher notifies peers after a profile photo changes on disk.
type HashPublisher interface {
	Publish(uid, hash string)
}

type Service struct {
	store *Store
	db    *db.DB
	live  HashPublisher
}

func NewService(store *Store, database *db.DB, live HashPublisher) *Service {
	return &Service{store: store, db: database, live: live}
}

func (s *Service) HandlePut() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		uid := strings.TrimSpace(r.URL.Query().Get("uid"))
		if err := s.requireUser(r, uid); err != nil {
			writeError(w, http.StatusBadRequest, "Identidade inválida.")
			return
		}
		body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, MaxBytes+1))
		if err != nil {
			var maxErr *http.MaxBytesError
			if errors.As(err, &maxErr) {
				writeError(w, http.StatusRequestEntityTooLarge, "A foto é grande demais.")
				return
			}
			writeError(w, http.StatusBadRequest, "Não foi possível ler a foto.")
			return
		}
		if len(body) > MaxBytes {
			writeError(w, http.StatusRequestEntityTooLarge, "A foto é grande demais.")
			return
		}
		meta, err := s.store.Save(uid, r.Header.Get("Content-Type"), body)
		if err != nil {
			switch {
			case errors.Is(err, ErrTooLarge):
				writeError(w, http.StatusRequestEntityTooLarge, "A foto é grande demais.")
			case errors.Is(err, ErrBadMime):
				writeError(w, http.StatusBadRequest, "Formato de imagem não suportado.")
			default:
				writeError(w, http.StatusBadRequest, "Não foi possível salvar a foto.")
			}
			return
		}
		if s.live != nil {
			s.live.Publish(uid, meta.Hash)
		}
		writeJSON(w, http.StatusOK, map[string]any{
			"uid":  uid,
			"hash": meta.Hash,
			"mime": meta.Mime,
			"size": meta.Size,
		})
	}
}

func (s *Service) HandleDelete() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		uid := strings.TrimSpace(r.URL.Query().Get("uid"))
		if err := s.requireUser(r, uid); err != nil {
			writeError(w, http.StatusBadRequest, "Identidade inválida.")
			return
		}
		if err := s.store.Delete(uid); err != nil {
			writeError(w, http.StatusInternalServerError, "Não foi possível remover a foto.")
			return
		}
		if s.live != nil {
			s.live.Publish(uid, "")
		}
		w.WriteHeader(http.StatusNoContent)
	}
}

func (s *Service) HandleGet() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		viewer := strings.TrimSpace(r.URL.Query().Get("uid"))
		if err := s.requireUser(r, viewer); err != nil {
			writeError(w, http.StatusBadRequest, "Identidade inválida.")
			return
		}
		target := strings.TrimSpace(r.PathValue("targetUid"))
		if target == "" {
			writeError(w, http.StatusBadRequest, "Usuário inválido.")
			return
		}
		if err := s.requireUser(r, target); err != nil {
			writeError(w, http.StatusNotFound, "Foto não encontrada.")
			return
		}
		hash := strings.TrimSpace(r.URL.Query().Get("hash"))
		file, meta, err := s.store.Open(target, hash)
		if err != nil {
			writeError(w, http.StatusNotFound, "Foto não encontrada.")
			return
		}
		defer file.Close()

		w.Header().Set("Content-Type", meta.Mime)
		if hash != "" {
			w.Header().Set("Cache-Control", "private, max-age=31536000, immutable")
		} else {
			w.Header().Set("Cache-Control", "no-store")
		}
		w.Header().Set("X-Avatar-Hash", meta.Hash)
		_ = throttleCopy(w, file)
	}
}

func (s *Service) requireUser(r *http.Request, uid string) error {
	uid = strings.TrimSpace(uid)
	if uid == "" || s.db == nil {
		return ErrNotFound
	}
	_, err := s.db.Queries.GetUserByUID(r.Context(), uid)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	return err
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
