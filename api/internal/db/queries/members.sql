-- name: CreateMember :one
INSERT INTO members (room_id, uid, nickname, role)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetMember :one
SELECT * FROM members
WHERE room_id = $1 AND uid = $2;

-- name: ListMembersByRoom :many
SELECT * FROM members
WHERE room_id = $1
ORDER BY created_at;

-- name: SetMemberRole :one
UPDATE members
SET role = $3
WHERE room_id = $1 AND uid = $2 AND role <> 'owner'
RETURNING *;
