-- name: GetBlocked :one
SELECT * FROM blocked
WHERE room_id = $1 AND uid = $2;

-- name: ListBlockedByRoom :many
SELECT b.room_id, b.uid, u.nickname, b.created_at
FROM blocked b
INNER JOIN users u ON u.uid = b.uid
WHERE b.room_id = $1
ORDER BY b.created_at;

-- name: CreateBlocked :one
INSERT INTO blocked (room_id, uid)
VALUES ($1, $2)
RETURNING *;

-- name: DeleteBlocked :exec
DELETE FROM blocked
WHERE room_id = $1 AND uid = $2;
