package realtime

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/thulerjoao/voice-plataform/api/internal/db"
)

type activityEvent struct {
	Type      string `json:"type"`
	RoomID    string `json:"roomId,omitempty"`
	ChannelID string `json:"channelId,omitempty"`
	ID        string `json:"id"`
	Text      string `json:"text"`
	At        int64  `json:"at"`
}

type Activity struct {
	hub *Hub
}

func NewActivity(hub *Hub) *Activity {
	return &Activity{hub: hub}
}

func (a *Activity) Sala(ctx context.Context, store *db.DB, roomID, channelID, text string) {
	channelID = strings.TrimSpace(channelID)
	if channelID == "" {
		return
	}
	a.send(ctx, store, activityEvent{
		Type:      "log.sala",
		RoomID:    strings.TrimSpace(roomID),
		ChannelID: strings.TrimSpace(channelID),
		ID:        uuid.NewString(),
		Text:      strings.TrimSpace(text),
		At:        time.Now().UnixMilli(),
	})
}

func (a *Activity) Server(ctx context.Context, store *db.DB, roomID, text string) {
	a.send(ctx, store, activityEvent{
		Type:   "log.server",
		RoomID: strings.TrimSpace(roomID),
		ID:     uuid.NewString(),
		Text:   strings.TrimSpace(text),
		At:     time.Now().UnixMilli(),
	})
}

func (a *Activity) send(ctx context.Context, store *db.DB, ev activityEvent) {
	if a == nil || a.hub == nil || ev.RoomID == "" || ev.Text == "" {
		return
	}
	uids := []string{}
	id, err := uuid.Parse(ev.RoomID)
	if err == nil && store != nil {
		members, err := store.Queries.ListMemberUIDsByRoom(ctx, id)
		if err == nil {
			uids = append(uids, members...)
		}
	}
	a.hub.SendJSON(uids, ev)
}
