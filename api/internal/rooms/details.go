package rooms

import (
	"context"
	"errors"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/thulerjoao/voice-plataform/api/internal/db"
	"github.com/thulerjoao/voice-plataform/api/internal/db/sqlc"
)

var ErrForbidden = errors.New("forbidden")

type RoomMember struct {
	UID      string `json:"uid"`
	Nickname string `json:"nickname"`
	Role     string `json:"role"`
}

type RoomDetails struct {
	ID        string       `json:"id"`
	Name      string       `json:"name"`
	Code      string       `json:"code"`
	Role      string       `json:"role"`
	CreatedAt string       `json:"createdAt"`
	Members   []RoomMember `json:"members"`
}

func Get(ctx context.Context, store *db.DB, roomID, uid string) (RoomDetails, error) {
	room, member, err := loadMemberRoom(ctx, store, roomID, uid)
	if err != nil {
		return RoomDetails{}, err
	}
	return detailsOf(ctx, store, room, member.Role)
}

func Rename(ctx context.Context, store *db.DB, roomID, uid, name string) (RoomDetails, error) {
	name = strings.TrimSpace(name)
	n := utf8.RuneCountInString(name)
	if n < NameMin || n > NameMax {
		return RoomDetails{}, ErrInvalidName
	}

	room, member, err := loadMemberRoom(ctx, store, roomID, uid)
	if err != nil {
		return RoomDetails{}, err
	}
	if member.Role != "owner" && member.Role != "admin" {
		return RoomDetails{}, ErrForbidden
	}

	updated, err := store.Queries.UpdateRoomName(ctx, sqlc.UpdateRoomNameParams{
		ID:   room.ID,
		Name: name,
	})
	if err != nil {
		return RoomDetails{}, err
	}
	return detailsOf(ctx, store, updated, member.Role)
}

func loadMemberRoom(ctx context.Context, store *db.DB, roomID, uid string) (sqlc.Room, sqlc.Member, error) {
	uid = strings.TrimSpace(uid)
	if uid == "" {
		return sqlc.Room{}, sqlc.Member{}, ErrMissingIdentity
	}

	id, err := uuid.Parse(strings.TrimSpace(roomID))
	if err != nil {
		return sqlc.Room{}, sqlc.Member{}, ErrRoomNotFound
	}

	room, err := store.Queries.GetRoomByID(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return sqlc.Room{}, sqlc.Member{}, ErrRoomNotFound
	}
	if err != nil {
		return sqlc.Room{}, sqlc.Member{}, err
	}

	member, err := store.Queries.GetMember(ctx, sqlc.GetMemberParams{
		RoomID: room.ID,
		Uid:    uid,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return sqlc.Room{}, sqlc.Member{}, ErrRoomNotFound
	}
	if err != nil {
		return sqlc.Room{}, sqlc.Member{}, err
	}

	return room, member, nil
}

func detailsOf(ctx context.Context, store *db.DB, room sqlc.Room, role string) (RoomDetails, error) {
	createdAt := ""
	if room.CreatedAt.Valid {
		createdAt = room.CreatedAt.Time.UTC().Format(time.RFC3339)
	}

	members, err := store.Queries.ListMembersByRoom(ctx, room.ID)
	if err != nil {
		return RoomDetails{}, err
	}

	list := make([]RoomMember, 0, len(members))
	for _, member := range members {
		list = append(list, RoomMember{
			UID:      member.Uid,
			Nickname: member.Nickname,
			Role:     member.Role,
		})
	}

	return RoomDetails{
		ID:        room.ID.String(),
		Name:      room.Name,
		Code:      room.Code,
		Role:      role,
		CreatedAt: createdAt,
		Members:   list,
	}, nil
}
