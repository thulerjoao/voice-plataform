-- name: CreateUser :one
INSERT INTO users (uid, nickname, recovery_code_hash)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetUserByUID :one
SELECT * FROM users
WHERE uid = $1;

-- name: GetUserByRecoveryHash :one
SELECT * FROM users
WHERE recovery_code_hash = $1;

-- name: UpdateUserNickname :one
UPDATE users
SET nickname = $2
WHERE uid = $1
RETURNING *;

-- name: ListRoomsByMemberUID :many
SELECT r.id, r.name, r.code, m.role
FROM members m
INNER JOIN rooms r ON r.id = m.room_id
WHERE m.uid = $1
ORDER BY m.created_at DESC;
