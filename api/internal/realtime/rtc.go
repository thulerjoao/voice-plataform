package realtime

import (
	"context"
	"encoding/json"
	"strings"
	"unicode/utf8"

	"github.com/thulerjoao/voice-plataform/api/internal/db"
)

const (
	RTCSdpMax       = 16384
	RTCCandidateMax = 1024
)

type rtcEvent struct {
	Type      string        `json:"type"`
	RoomID    string        `json:"roomId,omitempty"`
	ChannelID string        `json:"channelId,omitempty"`
	UID       string        `json:"uid,omitempty"`
	To        string        `json:"to,omitempty"`
	SDP       string        `json:"sdp,omitempty"`
	Candidate *rtcCandidate `json:"candidate,omitempty"`
}

type rtcCandidate struct {
	Candidate     string  `json:"candidate"`
	SDPMid        *string `json:"sdpMid"`
	SDPMLineIndex *int    `json:"sdpMLineIndex"`
}

type RTC struct {
	hub      *Hub
	presence *Presence
}

func NewRTC(hub *Hub, presence *Presence) *RTC {
	return &RTC{hub: hub, presence: presence}
}

func (r *RTC) HandleMessage(_ context.Context, _ *db.DB, uid string, raw []byte) {
	if r == nil || r.hub == nil || r.presence == nil {
		return
	}
	var msg struct {
		Type      string        `json:"type"`
		RoomID    string        `json:"roomId"`
		ChannelID string        `json:"channelId"`
		To        string        `json:"to"`
		SDP       string        `json:"sdp"`
		Candidate *rtcCandidate `json:"candidate"`
	}
	if json.Unmarshal(raw, &msg) != nil {
		return
	}
	switch msg.Type {
	case "rtc.offer", "rtc.answer":
		r.relaySDP(msg.Type, uid, msg.RoomID, msg.ChannelID, msg.To, msg.SDP)
	case "rtc.ice":
		r.relayICE(uid, msg.RoomID, msg.ChannelID, msg.To, msg.Candidate)
	}
}

func (r *RTC) relaySDP(kind, uid, roomID, channelID, to, sdp string) {
	uid = strings.TrimSpace(uid)
	to = strings.TrimSpace(to)
	roomID = strings.TrimSpace(roomID)
	channelID = strings.TrimSpace(channelID)
	sdp = clipBytes(sdp, RTCSdpMax)
	if uid == "" || to == "" || uid == to || roomID == "" || channelID == "" || sdp == "" {
		return
	}
	if !sameSala(r.presence.SeatOf(uid), r.presence.SeatOf(to), roomID, channelID) {
		return
	}
	r.hub.SendJSON([]string{to}, rtcEvent{
		Type:      kind,
		RoomID:    roomID,
		ChannelID: channelID,
		UID:       uid,
		To:        to,
		SDP:       sdp,
	})
}

func (r *RTC) relayICE(uid, roomID, channelID, to string, candidate *rtcCandidate) {
	uid = strings.TrimSpace(uid)
	to = strings.TrimSpace(to)
	roomID = strings.TrimSpace(roomID)
	channelID = strings.TrimSpace(channelID)
	if uid == "" || to == "" || uid == to || roomID == "" || channelID == "" {
		return
	}
	if !sameSala(r.presence.SeatOf(uid), r.presence.SeatOf(to), roomID, channelID) {
		return
	}
	if candidate != nil {
		candidate.Candidate = clipBytes(strings.TrimSpace(candidate.Candidate), RTCCandidateMax)
		if candidate.Candidate == "" {
			candidate = nil
		}
	}
	r.hub.SendJSON([]string{to}, rtcEvent{
		Type:      "rtc.ice",
		RoomID:    roomID,
		ChannelID: channelID,
		UID:       uid,
		To:        to,
		Candidate: candidate,
	})
}

func sameSala(from, to *Seat, roomID, channelID string) bool {
	return from != nil && to != nil &&
		from.RoomID == roomID && to.RoomID == roomID &&
		from.ChannelID == channelID && to.ChannelID == channelID
}

func clipBytes(value string, max int) string {
	if utf8.RuneCountInString(value) <= max {
		return value
	}
	runes := []rune(value)
	return string(runes[:max])
}
