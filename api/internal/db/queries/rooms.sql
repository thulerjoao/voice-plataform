-- name: CreateRoom :one
INSERT INTO rooms (name, code, owner_uid)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetRoomByID :one
SELECT * FROM rooms
WHERE id = $1;

-- name: GetRoomByCode :one
SELECT * FROM rooms
WHERE code = $1;

-- name: UpdateRoomName :one
UPDATE rooms
SET name = $2
WHERE id = $1
RETURNING *;
