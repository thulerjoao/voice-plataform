package rooms

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/thulerjoao/voice-plataform/api/internal/db"
	"github.com/thulerjoao/voice-plataform/api/internal/db/sqlc"
)

type JoinInput struct {
	Code     string
	UID      string
	Nickname string
}

func Join(ctx context.Context, store *db.DB, input JoinInput) (CreatedRoom, error) {
	code := normalizeCode(input.Code)
	uid := strings.TrimSpace(input.UID)

	if !strings.Contains(code, "-") {
		return CreatedRoom{}, ErrInvalidCode
	}
	if err := requireUser(ctx, store, uid); err != nil {
		return CreatedRoom{}, err
	}

	room, err := store.Queries.GetRoomByCode(ctx, code)
	if errors.Is(err, pgx.ErrNoRows) {
		return CreatedRoom{}, ErrRoomNotFound
	}
	if err != nil {
		return CreatedRoom{}, err
	}

	_, err = store.Queries.GetBlocked(ctx, sqlc.GetBlockedParams{
		RoomID: room.ID,
		Uid:    uid,
	})
	if err == nil {
		return CreatedRoom{}, ErrBlocked
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return CreatedRoom{}, err
	}

	member, err := store.Queries.GetMember(ctx, sqlc.GetMemberParams{
		RoomID: room.ID,
		Uid:    uid,
	})
	if err == nil {
		return CreatedRoom{
			ID:   room.ID.String(),
			Name: room.Name,
			Code: room.Code,
			Role: member.Role,
		}, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return CreatedRoom{}, err
	}

	created, err := store.Queries.CreateMember(ctx, sqlc.CreateMemberParams{
		RoomID: room.ID,
		Uid:    uid,
		Role:   "member",
	})
	if err != nil {
		if !isUniqueViolation(err) {
			return CreatedRoom{}, err
		}
		member, err := store.Queries.GetMember(ctx, sqlc.GetMemberParams{RoomID: room.ID, Uid: uid})
		if err != nil {
			return CreatedRoom{}, err
		}
		return CreatedRoom{
			ID:   room.ID.String(),
			Name: room.Name,
			Code: room.Code,
			Role: member.Role,
		}, nil
	}

	return CreatedRoom{
		ID:   room.ID.String(),
		Name: room.Name,
		Code: room.Code,
		Role: created.Role,
	}, nil
}
