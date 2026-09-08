package realtime

import "testing"

func TestSameSala(t *testing.T) {
	a := &Seat{UID: "a", RoomID: "r", ChannelID: "c"}
	b := &Seat{UID: "b", RoomID: "r", ChannelID: "c"}
	if !sameSala(a, b, "r", "c") {
		t.Fatal("same sala should pass")
	}
	if sameSala(a, b, "r", "other") {
		t.Fatal("wrong channel")
	}
	if sameSala(a, nil, "r", "c") {
		t.Fatal("missing seat")
	}
	other := &Seat{UID: "b", RoomID: "r", ChannelID: "x"}
	if sameSala(a, other, "r", "c") {
		t.Fatal("different channel seats")
	}
}

func TestClipBytes(t *testing.T) {
	if got := clipBytes("  ok  ", 10); got != "  ok  " {
		t.Fatalf("got %q", got)
	}
	long := stringsRepeat("x", RTCSdpMax+20)
	if n := len([]rune(clipBytes(long, RTCSdpMax))); n != RTCSdpMax {
		t.Fatalf("got %d", n)
	}
}
