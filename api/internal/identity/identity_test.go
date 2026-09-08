package identity

import (
	"context"
	"testing"

	"github.com/thulerjoao/voice-plataform/api/internal/db"
)

func TestRegisterAndRestoreRoundTrip(t *testing.T) {
	ctx := context.Background()
	store, err := db.Connect(ctx)
	if err != nil {
		t.Skip(err)
	}
	defer store.Close()

	created, err := Register(ctx, store, RegisterInput{Nickname: "smoke-restore"})
	if err != nil {
		t.Fatal(err)
	}
	if created.UID == "" || created.RecoveryCode == "" {
		t.Fatalf("empty identity: %+v", created)
	}

	restored, err := Restore(ctx, store, created.RecoveryCode)
	if err != nil {
		t.Fatal(err)
	}
	if restored.UID != created.UID || restored.Nickname != created.Nickname {
		t.Fatalf("restored %+v want uid=%s nick=%s", restored, created.UID, created.Nickname)
	}

	compact := normalizeRecoveryCode(created.RecoveryCode)
	again, err := Restore(ctx, store, compact)
	if err != nil {
		t.Fatal(err)
	}
	if again.UID != created.UID {
		t.Fatalf("compact restore uid=%s", again.UID)
	}

	if _, err := Restore(ctx, store, "AAAA-BBBB-CCCC-DDDD-EEEE"); err != ErrNotFound {
		t.Fatalf("unknown code: %v", err)
	}

	if _, err := store.Pool.Exec(ctx, `DELETE FROM users WHERE uid = $1`, created.UID); err != nil {
		t.Fatal(err)
	}
}
