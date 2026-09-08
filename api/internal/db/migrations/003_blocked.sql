CREATE TABLE IF NOT EXISTS blocked (
    room_id UUID NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
    uid TEXT NOT NULL,
    nickname TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (room_id, uid)
);
