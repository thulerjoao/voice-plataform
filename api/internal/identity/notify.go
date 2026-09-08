package identity

import (
	"context"

	"github.com/thulerjoao/voice-plataform/api/internal/db"
	"github.com/thulerjoao/voice-plataform/api/internal/realtime"
)

func emitNickname(ctx context.Context, store *db.DB, hub *realtime.Hub, presence *realtime.Presence, uid, nickname string) {
	if hub == nil || uid == "" {
		return
	}
	presence.RenameSeat(uid, nickname)
	peers, err := store.Queries.ListPeerUIDsByMember(ctx, uid)
	if err != nil {
		peers = nil
	}
	hub.Send(append(peers, uid), realtime.Event{
		Type:     "user.nickname",
		UID:      uid,
		Nickname: nickname,
	})
}
