package realtime

import (
	"strconv"
	"testing"
)

func TestPlaceKeepsOneSeatAndEnforcesCap(t *testing.T) {
	presence := NewPresence(NewHub())

	_, joined, full := presence.place("u1", "Ana", "member", "room-a", "sala-1")
	if full || joined == nil {
		t.Fatalf("first join should succeed")
	}
	if _, _, full := presence.place("u1", "Ana", "member", "room-a", "sala-1"); full {
		t.Fatalf("same sala should be a no-op")
	}
	if n := len(presence.Occupancy("room-a")); n != 1 {
		t.Fatalf("got %d occupants, want 1", n)
	}

	left, joined, full := presence.place("u1", "Ana", "member", "room-a", "sala-2")
	if full || left == nil || joined == nil {
		t.Fatalf("move should leave previous sala and join the next")
	}
	if left.ChannelID != "sala-1" || joined.ChannelID != "sala-2" {
		t.Fatalf("move seats: left %s joined %s", left.ChannelID, joined.ChannelID)
	}

	for i := 0; i < ChannelCap; i++ {
		uid := "fill-" + strconv.Itoa(i)
		if _, _, full := presence.place(uid, uid, "member", "room-a", "sala-1"); full {
			t.Fatalf("filling sala-1 failed at %d", i)
		}
	}
	_, _, full = presence.place("overflow", "X", "member", "room-a", "sala-1")
	if !full {
		t.Fatalf("13th occupant should be rejected")
	}
	if seat := presence.seats["overflow"]; seat != nil {
		t.Fatalf("rejected join must not take a seat")
	}
	if n := len(presence.Occupancy("room-a")); n != ChannelCap+1 {
		t.Fatalf("got %d occupants, want %d", n, ChannelCap+1)
	}
}

func TestMediaFlagsPersistOnMove(t *testing.T) {
	presence := NewPresence(NewHub())
	_, joined, full := presence.place("u1", "Ana", "member", "room-a", "sala-1")
	if full || joined == nil {
		t.Fatal("join")
	}
	presence.seats["u1"].Muted = true
	presence.seats["u1"].Deafened = true

	_, moved, full := presence.place("u1", "Ana", "member", "room-a", "sala-2")
	if full || moved == nil {
		t.Fatal("move")
	}
	if !moved.Muted || !moved.Deafened {
		t.Fatalf("move dropped media flags: muted=%v deafened=%v", moved.Muted, moved.Deafened)
	}
	occ := presence.Occupancy("room-a")
	if len(occ) != 1 || !occ[0].Muted || !occ[0].Deafened {
		t.Fatalf("occupancy lost media flags: %+v", occ)
	}
}

func TestDropIfOfflineKeepsSeatWhileConnected(t *testing.T) {
	hub := NewHub()
	presence := NewPresence(hub)
	_, _, full := presence.place("u1", "Ana", "member", "room-a", "sala-1")
	if full {
		t.Fatal("join")
	}
	c := &client{uid: "u1", send: make(chan []byte, 1)}
	hub.add(c)
	if seat := presence.dropIfOffline("u1"); seat != nil {
		t.Fatalf("live connection must keep the seat")
	}
	hub.remove(c)
	if seat := presence.dropIfOffline("u1"); seat == nil || seat.ChannelID != "sala-1" {
		t.Fatalf("offline uid should drop the seat")
	}
}
