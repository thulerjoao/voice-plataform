package realtime

import (
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
		c.readPump(conn)
		hub.remove(c)
		close(c.send)
	}
}

func (c *client) readPump(conn *websocket.Conn) {
	defer conn.Close()
	conn.SetReadLimit(512)
	_ = conn.SetReadDeadline(time.Now().Add(pongWait))
	conn.SetPongHandler(func(string) error {
		return conn.SetReadDeadline(time.Now().Add(pongWait))
	})
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			return
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
