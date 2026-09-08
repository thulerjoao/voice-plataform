const STORAGE_KEY = "voice.identity";

export const NICKNAME_MAX_LENGTH = 24;

export type Identity = {
  uid: string;
  nickname: string;
};

export function loadIdentity(): Identity | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<Identity>;
    if (
      typeof parsed.uid === "string" &&
      typeof parsed.nickname === "string" &&
      parsed.uid &&
      parsed.nickname
    ) {
      return { uid: parsed.uid, nickname: parsed.nickname };
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return null;
}

export function saveIdentity(identity: Identity): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

export function updateNickname(nickname: string): Identity | null {
  const current = loadIdentity();
  if (!current) return null;

  const next = { ...current, nickname };
  saveIdentity(next);
  return next;
}

export function createIdentity(nickname: string): Identity {
  const identity = { uid: crypto.randomUUID(), nickname };
  saveIdentity(identity);
  return identity;
}
