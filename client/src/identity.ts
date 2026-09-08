import { renameIdentity } from "./api";

const STORAGE_KEY = "voice.identity";

export const NICKNAME_MAX_LENGTH = 24;

const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const RECOVERY_GROUPS = 5;
const RECOVERY_GROUP_LEN = 4;

export type Identity = {
  uid: string;
  nickname: string;
  recoveryCode: string;
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
      const recoveryCode =
        typeof parsed.recoveryCode === "string" && parsed.recoveryCode
          ? parsed.recoveryCode
          : generateRecoveryCode();
      const identity = {
        uid: parsed.uid,
        nickname: parsed.nickname,
        recoveryCode,
      };
      if (identity.recoveryCode !== parsed.recoveryCode) {
        saveIdentity(identity);
      }
      return identity;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return null;
}

export function saveIdentity(identity: Identity): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

export function clearIdentity(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function updateNickname(nickname: string): Identity | null {
  const current = loadIdentity();
  if (!current) return null;

  const next = { ...current, nickname };
  saveIdentity(next);
  return next;
}

export async function persistNickname(nickname: string): Promise<Identity | null> {
  const current = loadIdentity();
  if (!current) return null;

  const renamed = await renameIdentity({
    uid: current.uid,
    nickname: nickname.trim(),
  });
  return updateNickname(renamed.nickname);
}

export function createIdentity(nickname: string): Identity {
  const identity = {
    uid: crypto.randomUUID(),
    nickname,
    recoveryCode: generateRecoveryCode(),
  };
  saveIdentity(identity);
  return identity;
}

export function formatRecoveryCode(raw: string): string {
  const chars = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (chars.length !== RECOVERY_GROUPS * RECOVERY_GROUP_LEN) {
    return raw.trim().toUpperCase();
  }
  const groups: string[] = [];
  for (let i = 0; i < RECOVERY_GROUPS; i += 1) {
    groups.push(
      chars.slice(i * RECOVERY_GROUP_LEN, (i + 1) * RECOVERY_GROUP_LEN),
    );
  }
  return groups.join("-");
}

export function generateRecoveryCode(): string {
  const bytes = new Uint8Array(RECOVERY_GROUPS * RECOVERY_GROUP_LEN);
  crypto.getRandomValues(bytes);
  const chars = Array.from(
    bytes,
    (byte) => RECOVERY_ALPHABET[byte % RECOVERY_ALPHABET.length],
  );
  return formatRecoveryCode(chars.join(""));
}
