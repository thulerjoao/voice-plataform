package rooms

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/thulerjoao/voice-plataform/api/internal/db"
	"github.com/thulerjoao/voice-plataform/api/internal/db/sqlc"
	"github.com/thulerjoao/voice-plataform/api/internal/realtime"
)

func actorNick(ctx context.Context, store *db.DB, uid string) string {
	user, err := store.Queries.GetUserByUID(ctx, strings.TrimSpace(uid))
	if err != nil || strings.TrimSpace(user.Nickname) == "" {
		return "Alguém"
	}
	return user.Nickname
}

func peekRoomName(ctx context.Context, store *db.DB, roomID string) string {
	id, err := uuid.Parse(strings.TrimSpace(roomID))
	if err != nil {
		return ""
	}
	room, err := store.Queries.GetRoomByID(ctx, id)
	if err != nil {
		return ""
	}
	return room.Name
}

func peekChannel(ctx context.Context, store *db.DB, roomID, channelID string) (sqlc.Channel, bool) {
	roomUUID, err := uuid.Parse(strings.TrimSpace(roomID))
	if err != nil {
		return sqlc.Channel{}, false
	}
	id, err := uuid.Parse(strings.TrimSpace(channelID))
	if err != nil {
		return sqlc.Channel{}, false
	}
	channel, err := store.Queries.GetChannel(ctx, sqlc.GetChannelParams{
		ID:     id,
		RoomID: roomUUID,
	})
	if err != nil {
		return sqlc.Channel{}, false
	}
	return channel, true
}

func logServerRenamed(ctx context.Context, store *db.DB, activity *realtime.Activity, roomID, actorUID, oldName, newName string) {
	oldName = strings.TrimSpace(oldName)
	newName = strings.TrimSpace(newName)
	if oldName == "" || newName == "" || oldName == newName {
		return
	}
	activity.Server(ctx, store, roomID, fmt.Sprintf(
		"%s mudou o nome do servidor de %s para %s",
		actorNick(ctx, store, actorUID),
		oldName,
		newName,
	))
}

func logSalaCreated(ctx context.Context, store *db.DB, activity *realtime.Activity, roomID, actorUID, name string) {
	name = strings.TrimSpace(name)
	if name == "" {
		return
	}
	activity.Server(ctx, store, roomID, fmt.Sprintf(
		"%s criou a sala %s",
		actorNick(ctx, store, actorUID),
		name,
	))
}

func logSalaUpdated(ctx context.Context, store *db.DB, activity *realtime.Activity, roomID, channelID, actorUID string, prev sqlc.Channel, found bool, next RoomChannel) {
	if !found {
		return
	}
	actor := actorNick(ctx, store, actorUID)
	if prev.Name != next.Name {
		activity.Sala(ctx, store, roomID, channelID, fmt.Sprintf(
			"%s mudou o nome da sala de %s para %s",
			actor,
			prev.Name,
			next.Name,
		))
	}
	if prev.Description != next.Description {
		activity.Sala(ctx, store, roomID, channelID, fmt.Sprintf(
			"%s alterou a descrição da sala",
			actor,
		))
	}
}

func logSalaDeleted(ctx context.Context, store *db.DB, activity *realtime.Activity, roomID, actorUID, name string) {
	name = strings.TrimSpace(name)
	if name == "" {
		name = "uma sala"
	}
	activity.Server(ctx, store, roomID, fmt.Sprintf(
		"%s excluiu a sala %s",
		actorNick(ctx, store, actorUID),
		name,
	))
}

func logRoleChanged(ctx context.Context, store *db.DB, activity *realtime.Activity, roomID, actorUID, targetUID, role string) {
	actor := actorNick(ctx, store, actorUID)
	target := actorNick(ctx, store, targetUID)
	if role == "admin" {
		activity.Server(ctx, store, roomID, fmt.Sprintf("%s promoveu %s a admin", actor, target))
		return
	}
	activity.Server(ctx, store, roomID, fmt.Sprintf("%s rebaixou %s a membro", actor, target))
}

func logKicked(ctx context.Context, store *db.DB, activity *realtime.Activity, roomID, actorUID, targetUID string) {
	activity.Server(ctx, store, roomID, fmt.Sprintf(
		"%s excluiu %s do servidor",
		actorNick(ctx, store, actorUID),
		actorNick(ctx, store, targetUID),
	))
}

func logBlocked(ctx context.Context, store *db.DB, activity *realtime.Activity, roomID, actorUID, targetUID string) {
	activity.Server(ctx, store, roomID, fmt.Sprintf(
		"%s bloqueou %s",
		actorNick(ctx, store, actorUID),
		actorNick(ctx, store, targetUID),
	))
}

func logUnblocked(ctx context.Context, store *db.DB, activity *realtime.Activity, roomID, actorUID, targetUID string) {
	activity.Server(ctx, store, roomID, fmt.Sprintf(
		"%s desbloqueou %s",
		actorNick(ctx, store, actorUID),
		actorNick(ctx, store, targetUID),
	))
}
