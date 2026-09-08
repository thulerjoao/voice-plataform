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
	"github.com/thulerjoao/voice-plataform/api/internal/rooms"
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
	mux.HandleFunc("POST /api/rooms", rooms.HandleCreate(store))
	mux.HandleFunc("POST /api/rooms/join", rooms.HandleJoin(store))
	mux.HandleFunc("GET /api/rooms/{id}", rooms.HandleGet(store))
	mux.HandleFunc("PATCH /api/rooms/{id}", rooms.HandleRename(store))

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
