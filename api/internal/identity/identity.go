package identity

import (
	"context"
	"errors"
	"strings"
	"unicode/utf8"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/thulerjoao/voice-plataform/api/internal/db"
	"github.com/thulerjoao/voice-plataform/api/internal/db/sqlc"
)

const (
	NicknameMax  = 24
	codeAttempts = 8
)

var (
	ErrInvalidNickname = errors.New("invalid nickname")
	ErrInvalidCode     = errors.New("invalid recovery code")
	ErrNotFound        = errors.New("identity not found")
	ErrCodeCollision   = errors.New("could not generate a unique recovery code")
	ErrUIDTaken        = errors.New("uid already registered")
)

type RegisterInput struct {
	Nickname     string
	UID          string
	RecoveryCode string
}

type Identity struct {
	UID          string `json:"uid"`
	Nickname     string `json:"nickname"`
	RecoveryCode string `json:"recoveryCode,omitempty"`
}

type RestoredRoom struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Code string `json:"code"`
	Role string `json:"role"`
}

type RestoredIdentity struct {
	UID      string         `json:"uid"`
	Nickname string         `json:"nickname"`
	Rooms    []RestoredRoom `json:"rooms"`
}

func Register(ctx context.Context, store *db.DB, input RegisterInput) (Identity, error) {
	nickname := strings.TrimSpace(input.Nickname)
	if nickname == "" || utf8.RuneCountInString(nickname) > NicknameMax {
		return Identity{}, ErrInvalidNickname
	}

	uid := strings.TrimSpace(input.UID)
	if uid == "" {
		return createNew(ctx, store, nickname)
	}

	code := strings.TrimSpace(input.RecoveryCode)
	hash, err := hashRecoveryCode(code)
	if err != nil {
		return Identity{}, ErrInvalidCode
	}

	existing, err := store.Queries.GetUserByUID(ctx, uid)
	if err == nil {
		if existing.RecoveryCodeHash != hash {
			return Identity{}, ErrUIDTaken
		}
		if existing.Nickname != nickname {
			existing, err = store.Queries.UpdateUserNickname(ctx, sqlc.UpdateUserNicknameParams{
				Uid:      uid,
				Nickname: nickname,
			})
			if err != nil {
				return Identity{}, err
			}
		}
		return Identity{
			UID:          existing.Uid,
			Nickname:     existing.Nickname,
			RecoveryCode: formatRecoveryCode(code),
		}, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return Identity{}, err
	}

	user, err := store.Queries.CreateUser(ctx, sqlc.CreateUserParams{
		Uid:              uid,
		Nickname:         nickname,
		RecoveryCodeHash: hash,
	})
	if err != nil {
		if isUniqueViolation(err) {
			return Identity{}, ErrCodeCollision
		}
		return Identity{}, err
	}

	return Identity{
		UID:          user.Uid,
		Nickname:     user.Nickname,
		RecoveryCode: formatRecoveryCode(code),
	}, nil
}

func createNew(ctx context.Context, store *db.DB, nickname string) (Identity, error) {
	for attempt := 0; attempt < codeAttempts; attempt++ {
		uid := uuid.NewString()
		code, err := generateRecoveryCode()
		if err != nil {
			return Identity{}, err
		}
		hash, err := hashRecoveryCode(code)
		if err != nil {
			return Identity{}, err
		}

		user, err := store.Queries.CreateUser(ctx, sqlc.CreateUserParams{
			Uid:              uid,
			Nickname:         nickname,
			RecoveryCodeHash: hash,
		})
		if err == nil {
			return Identity{
				UID:          user.Uid,
				Nickname:     user.Nickname,
				RecoveryCode: code,
			}, nil
		}
		if isUniqueViolation(err) {
			continue
		}
		return Identity{}, err
	}
	return Identity{}, ErrCodeCollision
}

func Restore(ctx context.Context, store *db.DB, code string) (RestoredIdentity, error) {
	hash, err := hashRecoveryCode(code)
	if err != nil {
		return RestoredIdentity{}, ErrInvalidCode
	}

	user, err := store.Queries.GetUserByRecoveryHash(ctx, hash)
	if errors.Is(err, pgx.ErrNoRows) {
		return RestoredIdentity{}, ErrNotFound
	}
	if err != nil {
		return RestoredIdentity{}, err
	}

	rows, err := store.Queries.ListRoomsByMemberUID(ctx, user.Uid)
	if err != nil {
		return RestoredIdentity{}, err
	}

	restored := RestoredIdentity{
		UID:      user.Uid,
		Nickname: user.Nickname,
		Rooms:    make([]RestoredRoom, 0, len(rows)),
	}
	for _, row := range rows {
		restored.Rooms = append(restored.Rooms, RestoredRoom{
			ID:   row.ID.String(),
			Name: row.Name,
			Code: row.Code,
			Role: row.Role,
		})
	}
	return restored, nil
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
