-- name: CreateChannel :one
INSERT INTO channels (room_id, name, description)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetChannel :one
SELECT * FROM channels
WHERE id = $1 AND room_id = $2;

-- name: ListChannelsByRoom :many
SELECT * FROM channels
WHERE room_id = $1
ORDER BY created_at;

-- name: CountChannelsByRoom :one
SELECT COUNT(*)::bigint FROM channels
WHERE room_id = $1;

-- name: UpdateChannel :one
UPDATE channels
SET name = $3, description = $4
WHERE id = $1 AND room_id = $2
RETURNING *;

-- name: DeleteChannel :exec
DELETE FROM channels
WHERE id = $1 AND room_id = $2;
