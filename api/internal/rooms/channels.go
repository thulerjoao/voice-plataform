package rooms

import (
	"context"
	"errors"
	"strings"
	"unicode/utf8"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/thulerjoao/voice-plataform/api/internal/db"
	"github.com/thulerjoao/voice-plataform/api/internal/db/sqlc"
)

const (
	ChannelNameMin = 1
	ChannelNameMax = 24
	ChannelDescMax = 80
)

func CreateSala(ctx context.Context, store *db.DB, roomID, uid, name, description string) (RoomChannel, error) {
	name, description, err := normalizeChannel(name, description)
	if err != nil {
		return RoomChannel{}, err
	}

	_, member, err := loadMemberRoom(ctx, store, roomID, uid)
	if err != nil {
		return RoomChannel{}, err
	}
	if !isModerator(member.Role) {
		return RoomChannel{}, ErrForbidden
	}

	created, err := store.Queries.CreateChannel(ctx, sqlc.CreateChannelParams{
		RoomID:      member.RoomID,
		Name:        name,
		Description: description,
	})
	if err != nil {
		return RoomChannel{}, err
	}
	return roomChannelOf(created), nil
}

func UpdateSala(ctx context.Context, store *db.DB, roomID, channelID, uid, name, description string) (RoomChannel, error) {
	name, description, err := normalizeChannel(name, description)
	if err != nil {
		return RoomChannel{}, err
	}

	channel, member, err := loadModeratedChannel(ctx, store, roomID, channelID, uid)
	if err != nil {
		return RoomChannel{}, err
	}

	updated, err := store.Queries.UpdateChannel(ctx, sqlc.UpdateChannelParams{
		ID:          channel.ID,
		RoomID:      member.RoomID,
		Name:        name,
		Description: description,
	})
	if err != nil {
		return RoomChannel{}, err
	}
	return roomChannelOf(updated), nil
}

func DeleteSala(ctx context.Context, store *db.DB, roomID, channelID, uid string) error {
	channel, member, err := loadModeratedChannel(ctx, store, roomID, channelID, uid)
	if err != nil {
		return err
	}

	count, err := store.Queries.CountChannelsByRoom(ctx, member.RoomID)
	if err != nil {
		return err
	}
	if count <= 1 {
		return ErrLastChannel
	}

	return store.Queries.DeleteChannel(ctx, sqlc.DeleteChannelParams{
		ID:     channel.ID,
		RoomID: member.RoomID,
	})
}

func loadModeratedChannel(ctx context.Context, store *db.DB, roomID, channelID, uid string) (sqlc.Channel, sqlc.Member, error) {
	_, member, err := loadMemberRoom(ctx, store, roomID, uid)
	if err != nil {
		return sqlc.Channel{}, sqlc.Member{}, err
	}
	if !isModerator(member.Role) {
		return sqlc.Channel{}, sqlc.Member{}, ErrForbidden
	}

	id, err := uuid.Parse(strings.TrimSpace(channelID))
	if err != nil {
		return sqlc.Channel{}, sqlc.Member{}, ErrChannelNotFound
	}

	channel, err := store.Queries.GetChannel(ctx, sqlc.GetChannelParams{
		ID:     id,
		RoomID: member.RoomID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return sqlc.Channel{}, sqlc.Member{}, ErrChannelNotFound
	}
	if err != nil {
		return sqlc.Channel{}, sqlc.Member{}, err
	}
	return channel, member, nil
}

func normalizeChannel(name, description string) (string, string, error) {
	name = strings.TrimSpace(name)
	n := utf8.RuneCountInString(name)
	if n < ChannelNameMin || n > ChannelNameMax {
		return "", "", ErrInvalidName
	}

	description = strings.TrimSpace(description)
	if utf8.RuneCountInString(description) > ChannelDescMax {
		return "", "", ErrInvalidName
	}
	return name, description, nil
}
