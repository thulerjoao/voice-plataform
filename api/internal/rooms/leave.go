package rooms

import (
	"context"
	"errors"

	"github.com/thulerjoao/voice-plataform/api/internal/db"
	"github.com/thulerjoao/voice-plataform/api/internal/db/sqlc"
)

var ErrOwnerCannotLeave = errors.New("owner cannot leave")

func Leave(ctx context.Context, store *db.DB, roomID, uid string) error {
	_, member, err := loadMemberRoom(ctx, store, roomID, uid)
	if err != nil {
		return err
	}
	if member.Role == "owner" {
		return ErrOwnerCannotLeave
	}

	return store.Queries.DeleteMember(ctx, sqlc.DeleteMemberParams{
		RoomID: member.RoomID,
		Uid:    member.Uid,
	})
}
