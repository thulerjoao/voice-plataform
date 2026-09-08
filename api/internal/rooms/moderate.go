package rooms

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/thulerjoao/voice-plataform/api/internal/db"
	"github.com/thulerjoao/voice-plataform/api/internal/db/sqlc"
)

func SetRole(ctx context.Context, store *db.DB, roomID, actorUID, targetUID, role string) (RoomDetails, error) {
	if role != "admin" && role != "member" {
		return RoomDetails{}, ErrInvalidRole
	}

	room, actor, err := loadMemberRoom(ctx, store, roomID, actorUID)
	if err != nil {
		return RoomDetails{}, err
	}

	target, err := loadTargetMember(ctx, store, actor.RoomID, targetUID)
	if err != nil {
		return RoomDetails{}, err
	}
	if err := assertCanSetRole(actor, target, role); err != nil {
		return RoomDetails{}, err
	}

	if _, err := store.Queries.SetMemberRole(ctx, sqlc.SetMemberRoleParams{
		RoomID: actor.RoomID,
		Uid:    target.Uid,
		Role:   role,
	}); err != nil {
		return RoomDetails{}, err
	}
	return detailsOf(ctx, store, room, actor.Role)
}

func Kick(ctx context.Context, store *db.DB, roomID, actorUID, targetUID string) (RoomDetails, error) {
	room, actor, err := loadMemberRoom(ctx, store, roomID, actorUID)
	if err != nil {
		return RoomDetails{}, err
	}

	target, err := loadTargetMember(ctx, store, actor.RoomID, targetUID)
	if err != nil {
		return RoomDetails{}, err
	}
	if err := assertCanKickOrBlock(actor, target); err != nil {
		return RoomDetails{}, err
	}

	if err := store.Queries.DeleteMember(ctx, sqlc.DeleteMemberParams{
		RoomID: actor.RoomID,
		Uid:    target.Uid,
	}); err != nil {
		return RoomDetails{}, err
	}
	return detailsOf(ctx, store, room, actor.Role)
}

func Block(ctx context.Context, store *db.DB, roomID, actorUID, targetUID string) (RoomDetails, error) {
	targetUID = strings.TrimSpace(targetUID)
	if targetUID == "" {
		return RoomDetails{}, ErrMemberNotFound
	}

	room, actor, err := loadMemberRoom(ctx, store, roomID, actorUID)
	if err != nil {
		return RoomDetails{}, err
	}
	if !isModerator(actor.Role) {
		return RoomDetails{}, ErrForbidden
	}
	if targetUID == actor.Uid || targetUID == room.OwnerUid {
		return RoomDetails{}, ErrForbidden
	}
	if err := requireUser(ctx, store, targetUID); err != nil {
		return RoomDetails{}, ErrMemberNotFound
	}

	target, err := store.Queries.GetMember(ctx, sqlc.GetMemberParams{
		RoomID: actor.RoomID,
		Uid:    targetUID,
	})
	if err == nil {
		if err := assertCanKickOrBlock(actor, target); err != nil {
			return RoomDetails{}, err
		}
		if err := store.Queries.DeleteMember(ctx, sqlc.DeleteMemberParams{
			RoomID: actor.RoomID,
			Uid:    target.Uid,
		}); err != nil {
			return RoomDetails{}, err
		}
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return RoomDetails{}, err
	}

	if _, err := store.Queries.CreateBlocked(ctx, sqlc.CreateBlockedParams{
		RoomID: actor.RoomID,
		Uid:    targetUID,
	}); err != nil && !isUniqueViolation(err) {
		return RoomDetails{}, err
	}

	return detailsOf(ctx, store, room, actor.Role)
}

func Unblock(ctx context.Context, store *db.DB, roomID, actorUID, targetUID string) (RoomDetails, error) {
	room, actor, err := loadMemberRoom(ctx, store, roomID, actorUID)
	if err != nil {
		return RoomDetails{}, err
	}
	if !isModerator(actor.Role) {
		return RoomDetails{}, ErrForbidden
	}

	targetUID = strings.TrimSpace(targetUID)
	if targetUID == "" {
		return RoomDetails{}, ErrMemberNotFound
	}

	if err := store.Queries.DeleteBlocked(ctx, sqlc.DeleteBlockedParams{
		RoomID: actor.RoomID,
		Uid:    targetUID,
	}); err != nil {
		return RoomDetails{}, err
	}
	return detailsOf(ctx, store, room, actor.Role)
}

func loadTargetMember(ctx context.Context, store *db.DB, roomID uuid.UUID, targetUID string) (sqlc.Member, error) {
	targetUID = strings.TrimSpace(targetUID)
	if targetUID == "" {
		return sqlc.Member{}, ErrMemberNotFound
	}

	member, err := store.Queries.GetMember(ctx, sqlc.GetMemberParams{
		RoomID: roomID,
		Uid:    targetUID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return sqlc.Member{}, ErrMemberNotFound
	}
	return member, err
}

func assertCanKickOrBlock(actor, target sqlc.Member) error {
	if actor.Uid == target.Uid {
		return ErrForbidden
	}
	if target.Role == "owner" {
		return ErrForbidden
	}
	if actor.Role == "owner" {
		return nil
	}
	if actor.Role == "admin" && target.Role == "member" {
		return nil
	}
	return ErrForbidden
}

func assertCanSetRole(actor, target sqlc.Member, role string) error {
	if actor.Uid == target.Uid {
		return ErrForbidden
	}
	if target.Role == "owner" {
		return ErrForbidden
	}
	switch role {
	case "admin":
		if target.Role != "member" {
			return ErrForbidden
		}
		if isModerator(actor.Role) {
			return nil
		}
	case "member":
		if target.Role != "admin" {
			return ErrForbidden
		}
		if actor.Role == "owner" {
			return nil
		}
	}
	return ErrForbidden
}
