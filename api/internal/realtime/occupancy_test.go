package realtime

import (
	"strconv"
	"testing"
)

func TestPlaceKeepsOneSeatAndEnforcesCap(t *testing.T) {
	hub := NewHub()

	_, joined, full := hub.place("u1", "Ana", "member", "room-a", "sala-1")
	if full || joined == nil {
		t.Fatalf("first join should succeed")
	}
	if _, _, full := hub.place("u1", "Ana", "member", "room-a", "sala-1"); full {
		t.Fatalf("same sala should be a no-op")
	}
	if n := len(hub.Occupancy("room-a")); n != 1 {
		t.Fatalf("got %d occupants, want 1", n)
	}

	left, joined, full := hub.place("u1", "Ana", "member", "room-a", "sala-2")
	if full || left == nil || joined == nil {
		t.Fatalf("move should leave previous sala and join the next")
	}
	if left.ChannelID != "sala-1" || joined.ChannelID != "sala-2" {
		t.Fatalf("move seats: left %s joined %s", left.ChannelID, joined.ChannelID)
	}

	for i := 0; i < ChannelCap; i++ {
		uid := "fill-" + strconv.Itoa(i)
		if _, _, full := hub.place(uid, uid, "member", "room-a", "sala-1"); full {
			t.Fatalf("filling sala-1 failed at %d", i)
		}
	}
	_, _, full = hub.place("overflow", "X", "member", "room-a", "sala-1")
	if !full {
		t.Fatalf("13th occupant should be rejected")
	}
	if seat := hub.seats["overflow"]; seat != nil {
		t.Fatalf("rejected join must not take a seat")
	}
	if n := len(hub.Occupancy("room-a")); n != ChannelCap+1 {
		t.Fatalf("got %d occupants, want %d", n, ChannelCap+1)
	}
}

func TestDropIfOfflineKeepsSeatWhileConnected(t *testing.T) {
	hub := NewHub()
	_, _, full := hub.place("u1", "Ana", "member", "room-a", "sala-1")
	if full {
		t.Fatal("join")
	}
	c := &client{uid: "u1", send: make(chan []byte, 1)}
	hub.add(c)
	if seat := hub.dropIfOffline("u1"); seat != nil {
		t.Fatalf("live connection must keep the seat")
	}
	if !hub.remove(c) {
		t.Fatalf("last connection should report offline")
	}
	if seat := hub.dropIfOffline("u1"); seat == nil || seat.ChannelID != "sala-1" {
		t.Fatalf("offline uid should drop the seat")
	}
}
