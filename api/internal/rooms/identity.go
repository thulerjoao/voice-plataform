package rooms

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/thulerjoao/voice-plataform/api/internal/db"
)

func requireUser(ctx context.Context, store *db.DB, uid string) error {
	uid = strings.TrimSpace(uid)
	if uid == "" {
		return ErrMissingIdentity
	}
	_, err := store.Queries.GetUserByUID(ctx, uid)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrMissingIdentity
	}
	return err
}

func isModerator(role string) bool {
	return role == "owner" || role == "admin"
}
