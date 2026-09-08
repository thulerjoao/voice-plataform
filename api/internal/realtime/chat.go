package realtime

import (
	"context"
	"encoding/json"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"
	"github.com/thulerjoao/voice-plataform/api/internal/db"
	"github.com/thulerjoao/voice-plataform/api/internal/db/sqlc"
)

const ChatTextMax = 120

type chatEvent struct {
	Type       string `json:"type"`
	RoomID     string `json:"roomId,omitempty"`
	ChannelID  string `json:"channelId,omitempty"`
	UID        string `json:"uid,omitempty"`
	To         string `json:"to,omitempty"`
	Nickname   string `json:"nickname,omitempty"`
	ToNickname string `json:"toNickname,omitempty"`
	ID         string `json:"id,omitempty"`
	Text       string `json:"text,omitempty"`
	At         int64  `json:"at,omitempty"`
}

type Chat struct {
	hub      *Hub
	presence *Presence
}

func NewChat(hub *Hub, presence *Presence) *Chat {
	return &Chat{hub: hub, presence: presence}
}

func (c *Chat) HandleMessage(ctx context.Context, store *db.DB, uid string, raw []byte) {
	if c == nil || store == nil {
		return
	}
	var msg struct {
		Type      string `json:"type"`
		RoomID    string `json:"roomId"`
		ChannelID string `json:"channelId"`
		UID       string `json:"uid"`
		ID        string `json:"id"`
		Text      string `json:"text"`
	}
	if json.Unmarshal(raw, &msg) != nil {
		return
	}
	switch msg.Type {
	case "chat.sala":
		c.sendSala(ctx, store, uid, msg.RoomID, msg.ChannelID, msg.ID, msg.Text)
	case "chat.direct":
		c.sendDirect(ctx, store, uid, msg.RoomID, msg.UID, msg.ID, msg.Text)
	}
}

func (c *Chat) sendSala(ctx context.Context, store *db.DB, uid, roomID, channelID, id, text string) {
	uid = strings.TrimSpace(uid)
	roomID = strings.TrimSpace(roomID)
	channelID = strings.TrimSpace(channelID)
	text = clipRunes(text, ChatTextMax)
	id = chatID(id)
	if uid == "" || roomID == "" || channelID == "" || text == "" || id == "" {
		return
	}

	seat := c.presence.SeatOf(uid)
	if seat == nil || seat.RoomID != roomID || seat.ChannelID != channelID {
		return
	}

	roomUUID, err := uuid.Parse(roomID)
	if err != nil {
		return
	}
	channelUUID, err := uuid.Parse(channelID)
	if err != nil {
		return
	}
	if _, err := store.Queries.GetChannel(ctx, sqlc.GetChannelParams{
		ID:     channelUUID,
		RoomID: roomUUID,
	}); err != nil {
		return
	}

	user, err := store.Queries.GetUserByUID(ctx, uid)
	if err != nil {
		return
	}

	targets := c.presence.UIDsInChannel(channelID)
	c.hub.SendJSON(targets, chatEvent{
		Type:      "chat.sala",
		RoomID:    roomID,
		ChannelID: channelID,
		UID:       uid,
		Nickname:  user.Nickname,
		ID:        id,
		Text:      text,
		At:        time.Now().UnixMilli(),
	})
}

func (c *Chat) sendDirect(ctx context.Context, store *db.DB, fromUID, roomID, toUID, id, text string) {
	fromUID = strings.TrimSpace(fromUID)
	toUID = strings.TrimSpace(toUID)
	roomID = strings.TrimSpace(roomID)
	text = clipRunes(text, ChatTextMax)
	id = chatID(id)
	if fromUID == "" || toUID == "" || fromUID == toUID || roomID == "" || text == "" || id == "" {
		return
	}

	roomUUID, err := uuid.Parse(roomID)
	if err != nil {
		return
	}
	if _, err := store.Queries.GetMember(ctx, sqlc.GetMemberParams{
		RoomID: roomUUID,
		Uid:    fromUID,
	}); err != nil {
		return
	}
	if _, err := store.Queries.GetMember(ctx, sqlc.GetMemberParams{
		RoomID: roomUUID,
		Uid:    toUID,
	}); err != nil {
		return
	}

	from, err := store.Queries.GetUserByUID(ctx, fromUID)
	if err != nil {
		return
	}
	to, err := store.Queries.GetUserByUID(ctx, toUID)
	if err != nil {
		return
	}

	c.hub.SendJSON([]string{fromUID, toUID}, chatEvent{
		Type:       "chat.direct",
		RoomID:     roomID,
		UID:        fromUID,
		To:         toUID,
		Nickname:   from.Nickname,
		ToNickname: to.Nickname,
		ID:         id,
		Text:       text,
		At:         time.Now().UnixMilli(),
	})
}

func clipRunes(value string, max int) string {
	value = strings.TrimSpace(value)
	if utf8.RuneCountInString(value) <= max {
		return value
	}
	runes := []rune(value)
	return string(runes[:max])
}

func chatID(value string) string {
	value = strings.TrimSpace(value)
	if value == "" || len(value) > 64 {
		return uuid.NewString()
	}
	return value
}
