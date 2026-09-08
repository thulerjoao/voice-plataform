-- name: GetBlocked :one
SELECT * FROM blocked
WHERE room_id = $1 AND uid = $2;
