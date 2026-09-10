package realtime

import (
	"encoding/json"
	"strings"
	"sync"
)

type contactEvent struct {
	Type   string         `json:"type"`
	People []contactPerson `json:"people,omitempty"`
	UID    string         `json:"uid,omitempty"`
	Status string         `json:"status,omitempty"`
}

type contactPerson struct {
	UID        string `json:"uid"`
	Status     string `json:"status"`
	AvatarHash string `json:"avatarHash,omitempty"`
}

// Contacts tracks who watches whom and each uid's contact-visible status.
type Contacts struct {
	mu        sync.Mutex
	hub       *Hub
	avatars   *Avatars
	status    map[string]string              // uid → online|busy|brb|invisible
	watching  map[string]map[string]struct{} // watcher → targets
	watchedBy map[string]map[string]struct{} // target → watchers
}

func NewContacts(hub *Hub) *Contacts {
	return &Contacts{
		hub:       hub,
		status:    make(map[string]string),
		watching:  make(map[string]map[string]struct{}),
		watchedBy: make(map[string]map[string]struct{}),
	}
}

func (c *Contacts) SetAvatars(avatars *Avatars) {
	if c == nil {
		return
	}
	c.avatars = avatars
}

func (c *Contacts) WatchersOf(uid string) []string {
	if c == nil {
		return nil
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.copyWatchersLocked(uid)
}

func normalizeContactStatus(status string) string {
	switch strings.TrimSpace(status) {
	case "busy", "brb", "invisible":
		return strings.TrimSpace(status)
	default:
		return "online"
	}
}

func (c *Contacts) visibleStatus(uid string) string {
	if c == nil || c.hub == nil || !c.hub.Online(uid) {
		return "offline"
	}
	status := normalizeContactStatus(c.status[uid])
	if status == "invisible" {
		return "offline"
	}
	return status
}

func (c *Contacts) SetStatus(uid, status string) {
	if c == nil {
		return
	}
	uid = strings.TrimSpace(uid)
	if uid == "" {
		return
	}
	status = normalizeContactStatus(status)
	c.mu.Lock()
	prev := c.status[uid]
	if prev == status {
		c.mu.Unlock()
		return
	}
	c.status[uid] = status
	watchers := c.copyWatchersLocked(uid)
	c.mu.Unlock()
	c.pushPresence(watchers, uid)
}

func (c *Contacts) Announce(uid string) {
	if c == nil {
		return
	}
	uid = strings.TrimSpace(uid)
	if uid == "" {
		return
	}
	c.mu.Lock()
	if _, ok := c.status[uid]; !ok {
		c.status[uid] = "online"
	}
	watchers := c.copyWatchersLocked(uid)
	c.mu.Unlock()
	c.pushPresence(watchers, uid)
}

func (c *Contacts) HandleMessage(uid string, raw []byte) {
	if c == nil {
		return
	}
	var msg struct {
		Type   string   `json:"type"`
		UIDs   []string `json:"uids"`
		Status string   `json:"status"`
	}
	if json.Unmarshal(raw, &msg) != nil {
		return
	}
	switch msg.Type {
	case "contacts.sync":
		c.Sync(uid, msg.UIDs)
	case "contacts.status":
		c.SetStatus(uid, msg.Status)
	}
}

func (c *Contacts) Sync(watcher string, uids []string) {
	if c == nil {
		return
	}
	watcher = strings.TrimSpace(watcher)
	if watcher == "" {
		return
	}

	clean := make([]string, 0, len(uids))
	seen := make(map[string]struct{}, len(uids))
	for _, raw := range uids {
		uid := strings.TrimSpace(raw)
		if uid == "" || uid == watcher {
			continue
		}
		if _, ok := seen[uid]; ok {
			continue
		}
		seen[uid] = struct{}{}
		clean = append(clean, uid)
	}

	c.mu.Lock()
	prev := c.watching[watcher]
	for target := range prev {
		if set := c.watchedBy[target]; set != nil {
			delete(set, watcher)
			if len(set) == 0 {
				delete(c.watchedBy, target)
			}
		}
	}
	nextWatch := make(map[string]struct{}, len(clean))
	for _, target := range clean {
		nextWatch[target] = struct{}{}
		set := c.watchedBy[target]
		if set == nil {
			set = make(map[string]struct{})
			c.watchedBy[target] = set
		}
		set[watcher] = struct{}{}
	}
	if len(nextWatch) == 0 {
		delete(c.watching, watcher)
	} else {
		c.watching[watcher] = nextWatch
	}

	people := make([]contactPerson, 0, len(clean))
	for _, target := range clean {
		person := contactPerson{
			UID:    target,
			Status: c.visibleStatusLocked(target),
		}
		if c.avatars != nil {
			person.AvatarHash = c.avatars.Hash(target)
		}
		people = append(people, person)
	}
	c.mu.Unlock()

	c.hub.SendJSON([]string{watcher}, contactEvent{
		Type:   "contacts.snapshot",
		People: people,
	})
}

func (c *Contacts) visibleStatusLocked(uid string) string {
	if c.hub == nil || !c.hub.Online(uid) {
		return "offline"
	}
	status := normalizeContactStatus(c.status[uid])
	if status == "invisible" {
		return "offline"
	}
	return status
}

func (c *Contacts) copyWatchersLocked(uid string) []string {
	set := c.watchedBy[uid]
	if len(set) == 0 {
		return nil
	}
	out := make([]string, 0, len(set))
	for watcher := range set {
		out = append(out, watcher)
	}
	return out
}

func (c *Contacts) pushPresence(watchers []string, uid string) {
	if len(watchers) == 0 {
		return
	}
	c.mu.Lock()
	status := c.visibleStatusLocked(uid)
	c.mu.Unlock()
	c.hub.SendJSON(watchers, contactEvent{
		Type:   "contacts.presence",
		UID:    uid,
		Status: status,
	})
}
