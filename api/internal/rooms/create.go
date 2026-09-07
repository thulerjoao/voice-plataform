package rooms

import (
	"context"
	"errors"
	"strings"
	"unicode/utf8"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/thulerjoao/voice-plataform/api/internal/db"
	"github.com/thulerjoao/voice-plataform/api/internal/db/sqlc"
)

const (
	NameMin      = 3;
	NameMax      = 24
	codeAttempts = 8
)

var (
	ErrInvalidName     = errors.New("invalid name")
	ErrMissingIdentity = errors.New("missing identity")
	ErrCodeCollision   = errors.New("could not generate a unique code")
)

type CreateInput struct {
	Name     string
	UID      string
	Nickname string
}

type CreatedRoom struct {
	ID   string
	Name string
	Code string
	Role string
}

func Create(ctx context.Context, store *db.DB, input CreateInput) (CreatedRoom, error) {
	name := strings.TrimSpace(input.Name)
	uid := strings.TrimSpace(input.UID)
	nickname := strings.TrimSpace(input.Nickname)
	n := utf8.RuneCountInString(name)

	if n < NameMin || n > NameMax {
		return CreatedRoom{}, ErrInvalidName
	}
	if uid == "" || nickname == "" {
		return CreatedRoom{}, ErrMissingIdentity
	}

	for attempt := 0; attempt < codeAttempts; attempt++ {
		code, err := generateCode()
		if err != nil {
			return CreatedRoom{}, err
		}

		created, err := createOnce(ctx, store, name, code, uid, nickname)
		if err == nil {
			return created, nil
		}
		if isUniqueViolation(err) {
			continue
		}
		return CreatedRoom{}, err
	}

	return CreatedRoom{}, ErrCodeCollision
}

func createOnce(ctx context.Context, store *db.DB, name, code, uid, nickname string) (CreatedRoom, error) {
	tx, err := store.Pool.Begin(ctx)
	if err != nil {
		return CreatedRoom{}, err
	}
	defer tx.Rollback(ctx)

	q := store.Queries.WithTx(tx)

	room, err := q.CreateRoom(ctx, sqlc.CreateRoomParams{
		Name:     name,
		Code:     code,
		OwnerUid: uid,
	})
	if err != nil {
		return CreatedRoom{}, err
	}

	if _, err := q.CreateMember(ctx, sqlc.CreateMemberParams{
		RoomID:   room.ID,
		Uid:      uid,
		Nickname: nickname,
		Role:     "owner",
	}); err != nil {
		return CreatedRoom{}, err
	}

	if _, err := q.CreateChannel(ctx, sqlc.CreateChannelParams{
		RoomID: room.ID,
		Name:   "Geral",
	}); err != nil {
		return CreatedRoom{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return CreatedRoom{}, err
	}

	return CreatedRoom{
		ID:   room.ID.String(),
		Name: room.Name,
		Code: room.Code,
		Role: "owner",
	}, nil
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
