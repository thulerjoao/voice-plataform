CREATE TABLE IF NOT EXISTS users (
    uid TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    recovery_code_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
