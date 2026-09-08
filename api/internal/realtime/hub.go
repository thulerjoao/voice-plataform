package realtime

import (
	"encoding/json"
	"sync"
	"time"
)

type Event struct {
	Type        string `json:"type"`
	RoomID      string `json:"roomId,omitempty"`
	UID         string `json:"uid,omitempty"`
	Nickname    string `json:"nickname,omitempty"`
	Name        string `json:"name,omitempty"`
	Role        string `json:"role,omitempty"`
	ID          string `json:"id,omitempty"`
	ChannelID   string `json:"channelId,omitempty"`
	Description string `json:"description,omitempty"`
	JoinedAt    int64  `json:"joinedAt,omitempty"`
}

type client struct {
	uid  string
	send chan []byte
}

type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[*client]struct{}
	seats   map[string]*Seat
	offline map[string]*time.Timer
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[string]map[*client]struct{}),
		seats:   make(map[string]*Seat),
		offline: make(map[string]*time.Timer),
	}
}

func (h *Hub) add(c *client) {
	if h == nil {
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	if t := h.offline[c.uid]; t != nil {
		t.Stop()
		delete(h.offline, c.uid)
	}
	set := h.clients[c.uid]
	if set == nil {
		set = make(map[*client]struct{})
		h.clients[c.uid] = set
	}
	set[c] = struct{}{}
}

func (h *Hub) remove(c *client) (offline bool) {
	if h == nil {
		return false
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	set := h.clients[c.uid]
	if set == nil {
		return true
	}
	delete(set, c)
	if len(set) == 0 {
		delete(h.clients, c.uid)
		return true
	}
	return false
}

func (h *Hub) Send(uids []string, ev Event) {
	if h == nil || len(uids) == 0 {
		return
	}
	payload, err := json.Marshal(ev)
	if err != nil {
		return
	}

	seen := make(map[string]struct{}, len(uids))
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, uid := range uids {
		if uid == "" {
			continue
		}
		if _, ok := seen[uid]; ok {
			continue
		}
		seen[uid] = struct{}{}
		for c := range h.clients[uid] {
			select {
			case c.send <- payload:
			default:
			}
		}
	}
}
