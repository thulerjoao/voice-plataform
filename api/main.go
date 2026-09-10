package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/thulerjoao/voice-plataform/api/internal/db"
	"github.com/thulerjoao/voice-plataform/api/internal/identity"
	"github.com/thulerjoao/voice-plataform/api/internal/realtime"
	"github.com/thulerjoao/voice-plataform/api/internal/rooms"
	"github.com/thulerjoao/voice-plataform/api/internal/version"
)

//go:generate sqlc generate

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	store, err := db.Connect(ctx)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer store.Close()

	hub := realtime.NewHub()
	contacts := realtime.NewContacts(hub)
	presence := realtime.NewPresence(hub)
	presence.SetContacts(contacts)
	avatars := realtime.NewAvatars(hub, presence, contacts)
	contacts.SetAvatars(avatars)
	presence.SetAvatars(avatars)
	chat := realtime.NewChat(hub, presence)
	activity := realtime.NewActivity(hub)
	rtc := realtime.NewRTC(hub, presence)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		status := "ok"
		dbStatus := "ok"
		if err := store.Pool.Ping(r.Context()); err != nil {
			status = "degraded"
			dbStatus = "down"
			w.WriteHeader(http.StatusServiceUnavailable)
		}

		_ = json.NewEncoder(w).Encode(map[string]string{
			"status": status,
			"db":     dbStatus,
		})
	})
	mux.HandleFunc("GET /api/version", version.HandleGet())
	mux.HandleFunc("POST /api/identity", identity.HandleRegister(store))
	mux.HandleFunc("PATCH /api/identity", identity.HandleRename(store, hub, presence))
	mux.HandleFunc("POST /api/identity/restore", identity.HandleRestore(store))
	mux.HandleFunc("GET /ws", realtime.HandleWS(store, hub, presence, contacts, avatars, chat, rtc))
	mux.HandleFunc("POST /api/rooms", rooms.HandleCreate(store))
	mux.HandleFunc("POST /api/rooms/join", rooms.HandleJoin(store, hub))
	mux.HandleFunc("GET /api/rooms/{id}", rooms.HandleGet(store))
	mux.HandleFunc("PATCH /api/rooms/{id}", rooms.HandleRename(store, hub, activity))
	mux.HandleFunc("POST /api/rooms/{id}/leave", rooms.HandleLeave(store, hub, presence))
	mux.HandleFunc("POST /api/rooms/{id}/channels", rooms.HandleCreateChannel(store, hub, activity))
	mux.HandleFunc("PATCH /api/rooms/{id}/channels/{channelId}", rooms.HandleUpdateChannel(store, hub, activity))
	mux.HandleFunc("DELETE /api/rooms/{id}/channels/{channelId}", rooms.HandleDeleteChannel(store, hub, presence, activity))
	mux.HandleFunc("POST /api/rooms/{id}/members/{memberUid}/role", rooms.HandleSetRole(store, hub, presence, activity))
	mux.HandleFunc("POST /api/rooms/{id}/members/{memberUid}/kick", rooms.HandleKick(store, hub, presence, activity))
	mux.HandleFunc("POST /api/rooms/{id}/blocked", rooms.HandleBlock(store, hub, presence, activity))
	mux.HandleFunc("DELETE /api/rooms/{id}/blocked/{memberUid}", rooms.HandleUnblock(store, hub, activity))

	server := &http.Server{Addr: ":8080", Handler: mux}

	go func() {
		log.Printf("api listening on %s", server.Addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = server.Shutdown(shutdownCtx)
}
