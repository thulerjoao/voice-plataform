package avatars

import (
	"bytes"
	"io"
	"os"
	"path/filepath"
	"testing"
)

func TestSaveOpenAndPrune(t *testing.T) {
	root := t.TempDir()
	store, err := NewStore(root)
	if err != nil {
		t.Fatal(err)
	}

	body1 := bytes.Repeat([]byte("a"), 1200)
	meta1, err := store.Save("user-1", "image/webp", body1)
	if err != nil {
		t.Fatal(err)
	}
	if meta1.Hash == "" {
		t.Fatal("hash")
	}

	body2 := bytes.Repeat([]byte("b"), 1300)
	meta2, err := store.Save("user-1", "image/webp", body2)
	if err != nil {
		t.Fatal(err)
	}
	if meta2.Hash == meta1.Hash {
		t.Fatal("hashes should differ")
	}
	if store.findFile("user-1", meta1.Hash) != "" {
		t.Fatal("old hash should be pruned")
	}
	if store.findFile("user-1", meta2.Hash) == "" {
		t.Fatal("current hash missing")
	}

	f, meta, err := store.Open("user-1", "")
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	if meta.Hash != meta2.Hash {
		t.Fatalf("meta hash %s", meta.Hash)
	}
	got, err := io.ReadAll(f)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(got, body2) {
		t.Fatal("body mismatch")
	}

	byHash, metaHash, err := store.Open("user-1", meta2.Hash)
	if err != nil {
		t.Fatal(err)
	}
	byHash.Close()
	if metaHash.Hash != meta2.Hash {
		t.Fatal("open by hash")
	}

	if err := store.Delete("user-1"); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(root, "user-1")); !os.IsNotExist(err) {
		t.Fatalf("dir should be gone: %v", err)
	}
}

func TestLoadAllHashes(t *testing.T) {
	root := t.TempDir()
	store, err := NewStore(root)
	if err != nil {
		t.Fatal(err)
	}
	meta, err := store.Save("user-a", "image/webp", bytes.Repeat([]byte("x"), 800))
	if err != nil {
		t.Fatal(err)
	}
	_, err = store.Save("user-b", "image/webp", bytes.Repeat([]byte("y"), 900))
	if err != nil {
		t.Fatal(err)
	}
	all := store.LoadAllHashes()
	if all["user-a"] != meta.Hash {
		t.Fatalf("user-a: %#v", all)
	}
	if all["user-b"] == "" {
		t.Fatalf("user-b missing: %#v", all)
	}
}
