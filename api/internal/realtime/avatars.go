package realtime

import (
	"encoding/json"
	"strings"
	"sync"
)

type avatarEvent struct {
	Type string `json:"type"`
	UID  string `json:"uid,omitempty"`
	Hash string `json:"hash,omitempty"`
}

// Avatars keeps in-memory profile image hashes (never image bytes).
type Avatars struct {
	mu       sync.Mutex
	hub      *Hub
	presence *Presence
	contacts *Contacts
	hash     map[string]string
}

func NewAvatars(hub *Hub, presence *Presence, contacts *Contacts) *Avatars {
	return &Avatars{
		hub:      hub,
		presence: presence,
		contacts: contacts,
		hash:     make(map[string]string),
	}
}

func (a *Avatars) Hash(uid string) string {
	if a == nil {
		return ""
	}
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.hash[uid]
}

func (a *Avatars) HandleMessage(uid string, raw []byte) {
	if a == nil {
		return
	}
	var msg struct {
		Type string `json:"type"`
		Hash string `json:"hash"`
	}
	if json.Unmarshal(raw, &msg) != nil {
		return
	}
	if msg.Type != "avatar.hash" {
		return
	}
	a.SetHash(uid, msg.Hash)
}

func (a *Avatars) SetHash(uid, hash string) {
	if a == nil {
		return
	}
	uid = strings.TrimSpace(uid)
	if uid == "" {
		return
	}
	hash = strings.TrimSpace(hash)
	a.mu.Lock()
	prev := a.hash[uid]
	if hash == "" {
		delete(a.hash, uid)
	} else {
		a.hash[uid] = hash
	}
	same := prev == hash
	a.mu.Unlock()
	if same {
		return
	}
	a.fanout(uid, hash)
}

func (a *Avatars) fanout(uid, hash string) {
	targets := make(map[string]struct{})
	if a.contacts != nil {
		for _, watcher := range a.contacts.WatchersOf(uid) {
			targets[watcher] = struct{}{}
		}
	}
	if a.presence != nil {
		for _, peer := range a.presence.PeersInSameSalas(uid) {
			targets[peer] = struct{}{}
		}
	}
	delete(targets, uid)
	if len(targets) == 0 {
		return
	}
	uids := make([]string, 0, len(targets))
	for id := range targets {
		uids = append(uids, id)
	}
	a.hub.SendJSON(uids, avatarEvent{
		Type: "avatar.hash",
		UID:  uid,
		Hash: hash,
	})
}
