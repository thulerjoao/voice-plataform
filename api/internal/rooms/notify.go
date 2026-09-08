package rooms

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/thulerjoao/voice-plataform/api/internal/db"
	"github.com/thulerjoao/voice-plataform/api/internal/realtime"
)

func publish(ctx context.Context, store *db.DB, hub *realtime.Hub, roomID string, extra []string, ev realtime.Event) {
	if hub == nil {
		return
	}
	ev.RoomID = strings.TrimSpace(roomID)
	uids := append([]string{}, extra...)
	id, err := uuid.Parse(ev.RoomID)
	if err == nil {
		members, err := store.Queries.ListMemberUIDsByRoom(ctx, id)
		if err == nil {
			uids = append(uids, members...)
		}
	}
	hub.Send(uids, ev)
}

func publishSeatLeft(ctx context.Context, store *db.DB, hub *realtime.Hub, seat *realtime.Seat) {
	if seat == nil {
		return
	}
	publish(ctx, store, hub, seat.RoomID, nil, realtime.Event{
		Type:      "presence.left",
		ChannelID: seat.ChannelID,
		UID:       seat.UID,
	})
}
