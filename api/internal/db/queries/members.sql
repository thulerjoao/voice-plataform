-- name: CreateMember :one
INSERT INTO members (room_id, uid, role)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetMember :one
SELECT * FROM members
WHERE room_id = $1 AND uid = $2;

-- name: ListMembersByRoom :many
SELECT m.room_id, m.uid, u.nickname, m.role, m.created_at
FROM members m
INNER JOIN users u ON u.uid = m.uid
WHERE m.room_id = $1
ORDER BY m.created_at;

-- name: SetMemberRole :one
UPDATE members
SET role = $3
WHERE room_id = $1 AND uid = $2 AND role <> 'owner'
RETURNING *;

-- name: DeleteMember :exec
DELETE FROM members
WHERE room_id = $1 AND uid = $2 AND role <> 'owner';

-- name: ListMemberUIDsByRoom :many
SELECT uid FROM members
WHERE room_id = $1;

-- name: ListPeerUIDsByMember :many
SELECT DISTINCT m2.uid
FROM members m1
INNER JOIN members m2 ON m2.room_id = m1.room_id
WHERE m1.uid = $1;
