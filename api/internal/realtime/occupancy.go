package realtime

import (
	"context"
	"encoding/json"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/thulerjoao/voice-plataform/api/internal/db"
	"github.com/thulerjoao/voice-plataform/api/internal/db/sqlc"
	"github.com/thulerjoao/voice-plataform/api/internal/version"
)

const ChannelCap = 12

type Occupant struct {
	UID       string `json:"uid"`
	Nickname  string `json:"nickname"`
	Role      string `json:"role"`
	ChannelID string `json:"channelId"`
	JoinedAt  int64  `json:"joinedAt"`
	Muted     bool   `json:"muted"`
	Deafened  bool   `json:"deafened"`
	Status    string `json:"status"`
}

type Seat struct {
	UID       string
	Nickname  string
	Role      string
	RoomID    string
	ChannelID string
	JoinedAt  int64
	Muted     bool
	Deafened  bool
	Status    string
}

type occupancyEvent struct {
	Type      string     `json:"type"`
	RoomID    string     `json:"roomId,omitempty"`
	UID       string     `json:"uid,omitempty"`
	Nickname  string     `json:"nickname,omitempty"`
	Role      string     `json:"role,omitempty"`
	ChannelID string     `json:"channelId,omitempty"`
	JoinedAt  int64      `json:"joinedAt,omitempty"`
	Muted     bool       `json:"muted,omitempty"`
	Deafened  bool       `json:"deafened,omitempty"`
	Status    string     `json:"status,omitempty"`
	Min       string     `json:"min,omitempty"`
	Current   string     `json:"current,omitempty"`
	Occupants []Occupant `json:"occupants,omitempty"`
}

type Presence struct {
	hub     *Hub
	mu      sync.Mutex
	seats   map[string]*Seat
	offline map[string]*time.Timer
}

func NewPresence(hub *Hub) *Presence {
	return &Presence{
		hub:     hub,
		seats:   make(map[string]*Seat),
		offline: make(map[string]*time.Timer),
	}
}

func (p *Presence) SeatOf(uid string) *Seat {
	if p == nil || uid == "" {
		return nil
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	seat := p.seats[uid]
	if seat == nil {
		return nil
	}
	copy := *seat
	return &copy
}

func (p *Presence) UIDsInChannel(channelID string) []string {
	out := make([]string, 0)
	if p == nil || channelID == "" {
		return out
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	for _, seat := range p.seats {
		if seat.ChannelID == channelID {
			out = append(out, seat.UID)
		}
	}
	return out
}

func (p *Presence) Occupancy(roomID string) []Occupant {
	out := make([]Occupant, 0)
	if p == nil || roomID == "" {
		return out
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	for _, seat := range p.seats {
		if seat.RoomID != roomID {
			continue
		}
		out = append(out, Occupant{
			UID:       seat.UID,
			Nickname:  seat.Nickname,
			Role:      seat.Role,
			ChannelID: seat.ChannelID,
			JoinedAt:  seat.JoinedAt,
			Muted:     seat.Muted,
			Deafened:  seat.Deafened,
			Status:    normalizeStatus(seat.Status),
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

func (p *Presence) JoinSala(ctx context.Context, store *db.DB, uid, roomID, channelID string) {
	if p == nil || store == nil {
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
	if p.rejectOutdated(uid, roomID, channelID) {
		return
	}

	left, joined, full := p.place(uid, user.Nickname, member.Role, roomID, channelID)
	if full {
		p.hub.SendJSON([]string{uid}, occupancyEvent{
			Type:      "presence.full",
			RoomID:    roomID,
			ChannelID: channelID,
		})
		return
	}
	if left != nil {
		p.announce(ctx, store, left.RoomID, occupancyEvent{
			Type:      "presence.left",
			ChannelID: left.ChannelID,
			UID:       left.UID,
		})
	}
	if joined != nil {
		p.announce(ctx, store, joined.RoomID, occupancyEvent{
			Type:      "presence.joined",
			ChannelID: joined.ChannelID,
			UID:       joined.UID,
			Nickname:  joined.Nickname,
			Role:      joined.Role,
			JoinedAt:  joined.JoinedAt,
			Muted:     joined.Muted,
			Deafened:  joined.Deafened,
			Status:    normalizeStatus(joined.Status),
		})
	}
}

func (p *Presence) seatedHere(uid, roomID, channelID string) bool {
	seat := p.SeatOf(uid)
	return seat != nil && seat.RoomID == roomID && seat.ChannelID == channelID
}

func (p *Presence) allowsNewSeat(uid, roomID, channelID string) bool {
	if p == nil {
		return false
	}
	if p.seatedHere(uid, roomID, channelID) {
		return true
	}
	if p.hub == nil {
		return !version.BelowMin("")
	}
	return !version.BelowMin(p.hub.Version(uid))
}

func (p *Presence) rejectOutdated(uid, roomID, channelID string) bool {
	if p.allowsNewSeat(uid, roomID, channelID) {
		return false
	}
	if p.hub == nil {
		return true
	}
	p.hub.SendJSON([]string{uid}, occupancyEvent{
		Type:      "presence.outdated",
		RoomID:    roomID,
		ChannelID: channelID,
		Min:       version.Min(),
		Current:   version.Current(),
	})
	return true
}

func (p *Presence) LeaveSala(ctx context.Context, store *db.DB, uid string) {
	if p == nil {
		return
	}
	seat := p.DropSeat(strings.TrimSpace(uid))
	if seat == nil {
		return
	}
	p.announce(ctx, store, seat.RoomID, occupancyEvent{
		Type:      "presence.left",
		ChannelID: seat.ChannelID,
		UID:       seat.UID,
	})
}

func (p *Presence) MoveSala(ctx context.Context, store *db.DB, actorUID, targetUID, roomID, channelID string) {
	if p == nil || store == nil {
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
		p.JoinSala(ctx, store, actorUID, roomID, channelID)
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
	p.JoinSala(ctx, store, targetUID, roomID, channelID)
}

func (p *Presence) Sync(ctx context.Context, store *db.DB, uid, roomID string) {
	if p == nil || store == nil {
		return
	}
	uid = strings.TrimSpace(uid)
	roomID = strings.TrimSpace(roomID)
	if uid == "" || roomID == "" {
		return
	}
	roomUUID, err := uuid.Parse(roomID)
	if err != nil {
		return
	}
	if _, err := store.Queries.GetMember(ctx, sqlc.GetMemberParams{
		RoomID: roomUUID,
		Uid:    uid,
	}); err != nil {
		return
	}
	p.hub.SendJSON([]string{uid}, occupancyEvent{
		Type:      "presence.state",
		RoomID:    roomID,
		Occupants: p.Occupancy(roomID),
	})
}

func (p *Presence) LeaveIfOffline(_ context.Context, store *db.DB, uid string) {
	if p == nil || uid == "" {
		return
	}
	p.mu.Lock()
	if t := p.offline[uid]; t != nil {
		t.Stop()
	}
	p.offline[uid] = time.AfterFunc(1500*time.Millisecond, func() {
		p.mu.Lock()
		delete(p.offline, uid)
		p.mu.Unlock()
		seat := p.dropIfOffline(uid)
		if seat == nil {
			return
		}
		p.announce(context.Background(), store, seat.RoomID, occupancyEvent{
			Type:      "presence.left",
			ChannelID: seat.ChannelID,
			UID:       seat.UID,
		})
	})
	p.mu.Unlock()
}

func (p *Presence) DropSeat(uid string) *Seat {
	if p == nil || uid == "" {
		return nil
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	if t := p.offline[uid]; t != nil {
		t.Stop()
		delete(p.offline, uid)
	}
	return p.dropLocked(uid)
}

func (p *Presence) DropSeatInRoom(uid, roomID string) *Seat {
	if p == nil || uid == "" || roomID == "" {
		return nil
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	seat := p.seats[uid]
	if seat == nil || seat.RoomID != roomID {
		return nil
	}
	delete(p.seats, uid)
	copy := *seat
	return &copy
}

func (p *Presence) AnnounceLeft(ctx context.Context, store *db.DB, seat *Seat) {
	if seat == nil {
		return
	}
	p.announce(ctx, store, seat.RoomID, occupancyEvent{
		Type:      "presence.left",
		ChannelID: seat.ChannelID,
		UID:       seat.UID,
	})
}

func (p *Presence) DropChannel(channelID string) {
	if p == nil || channelID == "" {
		return
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	for uid, seat := range p.seats {
		if seat.ChannelID == channelID {
			delete(p.seats, uid)
		}
	}
}

func (p *Presence) RenameSeat(uid, nickname string) {
	if p == nil || uid == "" || nickname == "" {
		return
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	if seat := p.seats[uid]; seat != nil {
		seat.Nickname = nickname
	}
}

func (p *Presence) SetSeatRole(uid, roomID, role string) {
	if p == nil || uid == "" || roomID == "" {
		return
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	if seat := p.seats[uid]; seat != nil && seat.RoomID == roomID {
		seat.Role = role
	}
}

func (p *Presence) HandleMessage(ctx context.Context, store *db.DB, uid string, raw []byte) {
	if p == nil {
		return
	}
	var msg struct {
		Type      string `json:"type"`
		RoomID    string `json:"roomId"`
		ChannelID string `json:"channelId"`
		UID       string `json:"uid"`
		Muted     bool   `json:"muted"`
		Deafened  bool   `json:"deafened"`
		Status    string `json:"status"`
	}
	if json.Unmarshal(raw, &msg) != nil {
		return
	}
	switch msg.Type {
	case "presence.join":
		p.JoinSala(ctx, store, uid, msg.RoomID, msg.ChannelID)
	case "presence.leave":
		p.LeaveSala(ctx, store, uid)
	case "presence.move":
		p.MoveSala(ctx, store, uid, msg.UID, msg.RoomID, msg.ChannelID)
	case "presence.sync":
		p.Sync(ctx, store, uid, msg.RoomID)
	case "presence.media":
		p.SetMedia(ctx, store, uid, msg.Muted, msg.Deafened)
	case "presence.status":
		p.SetStatus(ctx, store, uid, msg.Status)
	}
}

func (p *Presence) place(uid, nickname, role, roomID, channelID string) (left *Seat, joined *Seat, full bool) {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.placeLocked(uid, nickname, role, roomID, channelID)
}

func (p *Presence) placeLocked(uid, nickname, role, roomID, channelID string) (left *Seat, joined *Seat, full bool) {
	current := p.seats[uid]
	if current != nil && current.RoomID == roomID && current.ChannelID == channelID {
		current.Nickname = nickname
		current.Role = role
		return nil, nil, false
	}

	occupied := 0
	for _, seat := range p.seats {
		if seat.ChannelID == channelID && seat.UID != uid {
			occupied++
		}
	}
	if occupied >= ChannelCap {
		return nil, nil, true
	}

	muted, deafened := false, false
	status := "online"
	if current != nil {
		muted, deafened = current.Muted, current.Deafened
		status = normalizeStatus(current.Status)
		copy := *current
		left = &copy
		delete(p.seats, uid)
	}

	next := &Seat{
		UID:       uid,
		Nickname:  nickname,
		Role:      role,
		RoomID:    roomID,
		ChannelID: channelID,
		JoinedAt:  time.Now().UnixMilli(),
		Muted:     muted,
		Deafened:  deafened,
		Status:    status,
	}
	p.seats[uid] = next
	copy := *next
	return left, &copy, false
}

func (p *Presence) SetMedia(ctx context.Context, store *db.DB, uid string, muted, deafened bool) {
	if p == nil {
		return
	}
	uid = strings.TrimSpace(uid)
	if uid == "" {
		return
	}
	p.mu.Lock()
	seat := p.seats[uid]
	if seat == nil {
		p.mu.Unlock()
		return
	}
	if seat.Muted == muted && seat.Deafened == deafened {
		p.mu.Unlock()
		return
	}
	seat.Muted = muted
	seat.Deafened = deafened
	roomID := seat.RoomID
	copy := *seat
	p.mu.Unlock()
	p.announce(ctx, store, roomID, occupancyEvent{
		Type:     "presence.media",
		UID:      copy.UID,
		Muted:    copy.Muted,
		Deafened: copy.Deafened,
	})
}

func normalizeStatus(status string) string {
	switch strings.TrimSpace(status) {
	case "busy", "brb":
		return strings.TrimSpace(status)
	default:
		return "online"
	}
}

func (p *Presence) SetStatus(ctx context.Context, store *db.DB, uid, status string) {
	if p == nil {
		return
	}
	uid = strings.TrimSpace(uid)
	if uid == "" {
		return
	}
	status = normalizeStatus(status)
	p.mu.Lock()
	seat := p.seats[uid]
	if seat == nil {
		p.mu.Unlock()
		return
	}
	if normalizeStatus(seat.Status) == status {
		p.mu.Unlock()
		return
	}
	seat.Status = status
	roomID := seat.RoomID
	copy := *seat
	p.mu.Unlock()
	p.announce(ctx, store, roomID, occupancyEvent{
		Type:   "presence.status",
		UID:    copy.UID,
		Status: normalizeStatus(copy.Status),
	})
}

func (p *Presence) dropIfOffline(uid string) *Seat {
	if p == nil || uid == "" {
		return nil
	}
	if p.hub.Online(uid) {
		return nil
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.dropLocked(uid)
}

func (p *Presence) dropLocked(uid string) *Seat {
	seat := p.seats[uid]
	if seat == nil {
		return nil
	}
	delete(p.seats, uid)
	copy := *seat
	return &copy
}

func (p *Presence) announce(ctx context.Context, store *db.DB, roomID string, ev occupancyEvent) {
	if p == nil || p.hub == nil {
		return
	}
	ev.RoomID = strings.TrimSpace(roomID)
	uids := []string{}
	id, err := uuid.Parse(ev.RoomID)
	if err == nil && store != nil {
		members, err := store.Queries.ListMemberUIDsByRoom(ctx, id)
		if err == nil {
			uids = append(uids, members...)
		}
	}
	p.hub.SendJSON(uids, ev)
}
