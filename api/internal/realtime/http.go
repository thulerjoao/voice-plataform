package realtime

import (
	"context"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/thulerjoao/voice-plataform/api/internal/db"
)

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = 50 * time.Second
	sendBuffer = 16
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

func HandleWS(store *db.DB, hub *Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		uid := strings.TrimSpace(r.URL.Query().Get("uid"))
		if uid == "" {
			http.Error(w, "uid ausente", http.StatusBadRequest)
			return
		}
		if _, err := store.Queries.GetUserByUID(r.Context(), uid); err != nil {
			http.Error(w, "identidade inválida", http.StatusBadRequest)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("ws upgrade: %v", err)
			return
		}

		c := &client{uid: uid, send: make(chan []byte, sendBuffer)}
		hub.add(c)

		go c.writePump(conn)
		c.readPump(conn, func(raw []byte) {
			hub.handleMessage(context.Background(), store, uid, raw)
		})
		offline := hub.remove(c)
		close(c.send)
		if offline {
			hub.LeaveIfOffline(context.Background(), store, uid)
		}
	}
}

func (c *client) readPump(conn *websocket.Conn, onMessage func([]byte)) {
	defer conn.Close()
	conn.SetReadLimit(4096)
	_ = conn.SetReadDeadline(time.Now().Add(pongWait))
	conn.SetPongHandler(func(string) error {
		return conn.SetReadDeadline(time.Now().Add(pongWait))
	})
	for {
		_, raw, err := conn.ReadMessage()
		if err != nil {
			return
		}
		if onMessage != nil {
			onMessage(raw)
		}
	}
}

func (c *client) writePump(conn *websocket.Conn) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		conn.Close()
	}()

	for {
		select {
		case payload, ok := <-c.send:
			_ = conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = conn.WriteMessage(websocket.CloseMessage, nil)
				return
			}
			if err := conn.WriteMessage(websocket.TextMessage, payload); err != nil {
				return
			}
		case <-ticker.C:
			_ = conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
