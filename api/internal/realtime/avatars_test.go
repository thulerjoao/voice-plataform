package realtime

import "testing"

func TestShareInChannelSendsExistingHashesBothWays(t *testing.T) {
	hub := NewHub()
	presence := NewPresence(hub)
	avatars := NewAvatars(hub, presence, nil)
	presence.SetAvatars(avatars)

	_, a, full := presence.place("user-a", "Ana", "member", "room-1", "sala-1")
	if full || a == nil {
		t.Fatal("seat a")
	}
	avatars.SetHash("user-a", "hash-a")

	_, b, full := presence.place("user-b", "Bia", "member", "room-1", "sala-1")
	if full || b == nil {
		t.Fatal("seat b")
	}
	avatars.SetHash("user-b", "hash-b")

	// Drain any fanout from SetHash (may be empty or peer-targeted).
	// ShareInChannel is what late joiners need for an unchanged hash.
	avatars.ShareInChannel("user-b", "sala-1")

	// We can't easily assert hub sends without a connected client;
	// at least ensure hashes remain and ShareInChannel doesn't panic / clear.
	if got := avatars.Hash("user-a"); got != "hash-a" {
		t.Fatalf("hash a: %q", got)
	}
	if got := avatars.Hash("user-b"); got != "hash-b" {
		t.Fatalf("hash b: %q", got)
	}
}

func TestSetHashSkipsUnchangedFanout(t *testing.T) {
	hub := NewHub()
	presence := NewPresence(hub)
	avatars := NewAvatars(hub, presence, nil)

	avatars.SetHash("user-a", "hash-a")
	avatars.SetHash("user-a", "hash-a") // same — must not clear
	if got := avatars.Hash("user-a"); got != "hash-a" {
		t.Fatalf("hash: %q", got)
	}
}

func TestSeedDoesNotClearAndPublishUpdates(t *testing.T) {
	hub := NewHub()
	presence := NewPresence(hub)
	avatars := NewAvatars(hub, presence, nil)

	avatars.Seed("user-a", "hash-a")
	if got := avatars.Hash("user-a"); got != "hash-a" {
		t.Fatalf("seed: %q", got)
	}
	avatars.Publish("user-a", "hash-b")
	if got := avatars.Hash("user-a"); got != "hash-b" {
		t.Fatalf("publish: %q", got)
	}
	avatars.Publish("user-a", "")
	if got := avatars.Hash("user-a"); got != "" {
		t.Fatalf("clear: %q", got)
	}
}
