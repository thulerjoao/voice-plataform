package realtime

import (
	"context"
	"encoding/json"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/thulerjoao/voice-plataform/api/internal/db"
	"github.com/thulerjoao/voice-plataform/api/internal/db/sqlc"
)

const ChannelCap = 12

type Occupant struct {
	UID       string `json:"uid"`
	Nickname  string `json:"nickname"`
	Role      string `json:"role"`
	ChannelID string `json:"channelId"`
	JoinedAt  int64  `json:"joinedAt"`
}

type Seat struct {
	UID       string
	Nickname  string
	Role      string
	RoomID    string
	ChannelID string
	JoinedAt  int64
}

func (h *Hub) Occupancy(roomID string) []Occupant {
	out := make([]Occupant, 0)
	if h == nil || roomID == "" {
		return out
	}
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, seat := range h.seats {
		if seat.RoomID != roomID {
			continue
		}
		out = append(out, Occupant{
			UID:       seat.UID,
			Nickname:  seat.Nickname,
			Role:      seat.Role,
			ChannelID: seat.ChannelID,
			JoinedAt:  seat.JoinedAt,
		})
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].JoinedAt != out[j].JoinedAt {
			return out[i].JoinedAt < out[j].JoinedAt
		}
		return out[i].UID < out[j].UID
	})
	return out
}

func (h *Hub) JoinSala(ctx context.Context, store *db.DB, uid, roomID, channelID string) {
	if h == nil || store == nil {
		return
	}
	uid = strings.TrimSpace(uid)
	roomID = strings.TrimSpace(roomID)
	channelID = strings.TrimSpace(channelID)
	if uid == "" || roomID == "" || channelID == "" {
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

	member, err := store.Queries.GetMember(ctx, sqlc.GetMemberParams{
		RoomID: roomUUID,
		Uid:    uid,
	})
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

	left, joined, full := h.place(uid, user.Nickname, member.Role, roomID, channelID)
	if full {
		h.Send([]string{uid}, Event{
			Type:      "presence.full",
			RoomID:    roomID,
			ChannelID: channelID,
		})
		return
	}
	if left != nil {
		publishRoom(ctx, store, h, left.RoomID, nil, Event{
			Type:      "presence.left",
			ChannelID: left.ChannelID,
			UID:       left.UID,
		})
	}
	if joined != nil {
		publishRoom(ctx, store, h, joined.RoomID, nil, Event{
			Type:      "presence.joined",
			ChannelID: joined.ChannelID,
			UID:       joined.UID,
			Nickname:  joined.Nickname,
			Role:      joined.Role,
			JoinedAt:  joined.JoinedAt,
		})
	}
}

func (h *Hub) LeaveSala(ctx context.Context, store *db.DB, uid string) {
	if h == nil {
		return
	}
	seat := h.DropSeat(strings.TrimSpace(uid))
	if seat == nil {
		return
	}
	publishRoom(ctx, store, h, seat.RoomID, nil, Event{
		Type:      "presence.left",
		ChannelID: seat.ChannelID,
		UID:       seat.UID,
	})
}

func (h *Hub) MoveSala(ctx context.Context, store *db.DB, actorUID, targetUID, roomID, channelID string) {
	if h == nil || store == nil {
		return
	}
	actorUID = strings.TrimSpace(actorUID)
	targetUID = strings.TrimSpace(targetUID)
	roomID = strings.TrimSpace(roomID)
	channelID = strings.TrimSpace(channelID)
	if actorUID == "" || targetUID == "" || roomID == "" || channelID == "" {
		return
	}
	if actorUID == targetUID {
		h.JoinSala(ctx, store, actorUID, roomID, channelID)
		return
	}

	roomUUID, err := uuid.Parse(roomID)
	if err != nil {
		return
	}
	actor, err := store.Queries.GetMember(ctx, sqlc.GetMemberParams{
		RoomID: roomUUID,
		Uid:    actorUID,
	})
	if err != nil {
		return
	}
	if actor.Role != "owner" && actor.Role != "admin" {
		return
	}
	if _, err := store.Queries.GetMember(ctx, sqlc.GetMemberParams{
		RoomID: roomUUID,
		Uid:    targetUID,
	}); err != nil {
		return
	}
	h.JoinSala(ctx, store, targetUID, roomID, channelID)
}

func (h *Hub) LeaveIfOffline(_ context.Context, store *db.DB, uid string) {
	if h == nil || uid == "" {
		return
	}
	h.mu.Lock()
	if t := h.offline[uid]; t != nil {
		t.Stop()
	}
	h.offline[uid] = time.AfterFunc(1500*time.Millisecond, func() {
		h.mu.Lock()
		delete(h.offline, uid)
		h.mu.Unlock()
		seat := h.dropIfOffline(uid)
		if seat == nil {
			return
		}
		publishRoom(context.Background(), store, h, seat.RoomID, nil, Event{
			Type:      "presence.left",
			ChannelID: seat.ChannelID,
			UID:       seat.UID,
		})
	})
	h.mu.Unlock()
}

func (h *Hub) DropSeat(uid string) *Seat {
	if h == nil || uid == "" {
		return nil
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	return h.dropLocked(uid)
}

func (h *Hub) DropSeatInRoom(uid, roomID string) *Seat {
	if h == nil || uid == "" || roomID == "" {
		return nil
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	seat := h.seats[uid]
	if seat == nil || seat.RoomID != roomID {
		return nil
	}
	delete(h.seats, uid)
	copy := *seat
	return &copy
}

func (h *Hub) DropChannel(channelID string) []Seat {
	dropped := make([]Seat, 0)
	if h == nil || channelID == "" {
		return dropped
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	for uid, seat := range h.seats {
		if seat.ChannelID != channelID {
			continue
		}
		dropped = append(dropped, *seat)
		delete(h.seats, uid)
	}
	return dropped
}

func (h *Hub) RenameSeat(uid, nickname string) {
	if h == nil || uid == "" || nickname == "" {
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	if seat := h.seats[uid]; seat != nil {
		seat.Nickname = nickname
	}
}

func (h *Hub) SetSeatRole(uid, roomID, role string) {
	if h == nil || uid == "" || roomID == "" {
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	if seat := h.seats[uid]; seat != nil && seat.RoomID == roomID {
		seat.Role = role
	}
}

func (h *Hub) handleMessage(ctx context.Context, store *db.DB, uid string, raw []byte) {
	var msg struct {
		Type      string `json:"type"`
		RoomID    string `json:"roomId"`
		ChannelID string `json:"channelId"`
		UID       string `json:"uid"`
	}
	if json.Unmarshal(raw, &msg) != nil {
		return
	}
	switch msg.Type {
	case "presence.join":
		h.JoinSala(ctx, store, uid, msg.RoomID, msg.ChannelID)
	case "presence.leave":
		h.LeaveSala(ctx, store, uid)
	case "presence.move":
		h.MoveSala(ctx, store, uid, msg.UID, msg.RoomID, msg.ChannelID)
	}
}

func (h *Hub) place(uid, nickname, role, roomID, channelID string) (left *Seat, joined *Seat, full bool) {
	h.mu.Lock()
	defer h.mu.Unlock()
	return h.placeLocked(uid, nickname, role, roomID, channelID)
}

func (h *Hub) placeLocked(uid, nickname, role, roomID, channelID string) (left *Seat, joined *Seat, full bool) {
	current := h.seats[uid]
	if current != nil && current.RoomID == roomID && current.ChannelID == channelID {
		current.Nickname = nickname
		current.Role = role
		return nil, nil, false
	}

	occupied := 0
	for _, seat := range h.seats {
		if seat.ChannelID == channelID && seat.UID != uid {
			occupied++
		}
	}
	if occupied >= ChannelCap {
		return nil, nil, true
	}

	if current != nil {
		copy := *current
		left = &copy
		delete(h.seats, uid)
	}

	next := &Seat{
		UID:       uid,
		Nickname:  nickname,
		Role:      role,
		RoomID:    roomID,
		ChannelID: channelID,
		JoinedAt:  time.Now().UnixMilli(),
	}
	h.seats[uid] = next
	copy := *next
	return left, &copy, false
}

func (h *Hub) dropIfOffline(uid string) *Seat {
	if h == nil || uid == "" {
		return nil
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	if len(h.clients[uid]) > 0 {
		return nil
	}
	return h.dropLocked(uid)
}

func (h *Hub) dropLocked(uid string) *Seat {
	seat := h.seats[uid]
	if seat == nil {
		return nil
	}
	delete(h.seats, uid)
	copy := *seat
	return &copy
}

func publishRoom(ctx context.Context, store *db.DB, hub *Hub, roomID string, extra []string, ev Event) {
	if hub == nil {
		return
	}
	ev.RoomID = strings.TrimSpace(roomID)
	uids := append([]string{}, extra...)
	id, err := uuid.Parse(ev.RoomID)
	if err == nil && store != nil {
		members, err := store.Queries.ListMemberUIDsByRoom(ctx, id)
		if err == nil {
			uids = append(uids, members...)
		}
	}
	hub.Send(uids, ev)
}
