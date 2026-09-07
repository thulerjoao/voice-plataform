package db

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thulerjoao/voice-plataform/api/internal/db/sqlc"
)

type DB struct {
	Pool    *pgxpool.Pool
	Queries *sqlc.Queries
}

func Connect(ctx context.Context) (*DB, error) {
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		url = "postgres://voice:voice@localhost:5432/voice?sslmode=disable"
	}

	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping db: %w", err)
	}

	if err := migrate(ctx, pool); err != nil {
		pool.Close()
		return nil, fmt.Errorf("migrate: %w", err)
	}

	return &DB{
		Pool:    pool,
		Queries: sqlc.New(pool),
	}, nil
}

func (d *DB) Close() {
	d.Pool.Close()
}
