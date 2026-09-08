INSERT INTO users (uid, nickname, recovery_code_hash)
SELECT m.uid, MIN(m.nickname), 'orphan-' || m.uid
FROM members m
LEFT JOIN users u ON u.uid = m.uid
WHERE u.uid IS NULL
GROUP BY m.uid;

INSERT INTO users (uid, nickname, recovery_code_hash)
SELECT b.uid, MIN(b.nickname), 'orphan-blocked-' || b.uid
FROM blocked b
LEFT JOIN users u ON u.uid = b.uid
WHERE u.uid IS NULL
GROUP BY b.uid;

INSERT INTO users (uid, nickname, recovery_code_hash)
SELECT r.owner_uid, COALESCE(MIN(m.nickname), 'unknown'), 'orphan-owner-' || r.owner_uid
FROM rooms r
LEFT JOIN members m ON m.room_id = r.id AND m.uid = r.owner_uid
LEFT JOIN users u ON u.uid = r.owner_uid
WHERE u.uid IS NULL
GROUP BY r.owner_uid;

ALTER TABLE members DROP COLUMN IF EXISTS nickname;
ALTER TABLE blocked DROP COLUMN IF EXISTS nickname;

ALTER TABLE members
    ADD CONSTRAINT members_uid_fkey FOREIGN KEY (uid) REFERENCES users (uid);

ALTER TABLE blocked
    ADD CONSTRAINT blocked_uid_fkey FOREIGN KEY (uid) REFERENCES users (uid);

ALTER TABLE rooms
    ADD CONSTRAINT rooms_owner_uid_fkey FOREIGN KEY (owner_uid) REFERENCES users (uid);

ALTER TABLE channels
    ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
