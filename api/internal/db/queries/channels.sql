-- name: CreateChannel :one
INSERT INTO channels (room_id, name)
VALUES ($1, $2)
RETURNING *;

-- name: ListChannelsByRoom :many
SELECT * FROM channels
WHERE room_id = $1
ORDER BY created_at;

-- name: DeleteChannel :exec
DELETE FROM channels
WHERE id = $1 AND room_id = $2;
