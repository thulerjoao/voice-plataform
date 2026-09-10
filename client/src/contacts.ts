const CONTACTS_KEY = "voice.contacts";
const RECENT_KEY = "voice.contacts.recent";

export const CONTACT_NICK_MAX = 24;

export type Contact = {
  uid: string;
  nickname: string;
  addedAt: string;
  avatarHash?: string;
};

export type RecentSource = "dm" | "profile" | "call";

export type RecentContact = {
  uid: string;
  nickname: string;
  lastAt: string;
  source: RecentSource;
};

type ContactsListener = () => void;
const listeners = new Set<ContactsListener>();

function emitContactsChange() {
  for (const listener of listeners) listener();
}

export function subscribeContacts(listener: ContactsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function loadContacts(): Contact[] {
  const raw = localStorage.getItem(CONTACTS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isContact).sort((a, b) => {
      const byNick = a.nickname.localeCompare(b.nickname, "pt-BR", {
        sensitivity: "base",
      });
      if (byNick !== 0) return byNick;
      return a.uid.localeCompare(b.uid);
    });
  } catch {
    return [];
  }
}

export function findContact(uid: string): Contact | null {
  return loadContacts().find((item) => item.uid === uid) ?? null;
}

export function addContact(input: {
  uid: string;
  nickname: string;
  avatarHash?: string;
}): Contact[] {
  const uid = input.uid.trim();
  const nickname = input.nickname.trim().slice(0, CONTACT_NICK_MAX);
  if (!uid || !nickname) return loadContacts();

  const existing = loadContacts();
  const prev = existing.find((item) => item.uid === uid);
  const nextItem: Contact = {
    uid,
    nickname,
    addedAt: prev?.addedAt ?? new Date().toISOString(),
    avatarHash:
      input.avatarHash !== undefined
        ? input.avatarHash || undefined
        : prev?.avatarHash,
  };
  const next = [nextItem, ...existing.filter((item) => item.uid !== uid)];
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(next));
  emitContactsChange();
  return loadContacts();
}

export function updateContact(
  uid: string,
  patch: { nickname?: string; avatarHash?: string | null },
): Contact[] {
  const existing = loadContacts();
  const index = existing.findIndex((item) => item.uid === uid);
  if (index < 0) return existing;

  const current = existing[index];
  const nickname =
    patch.nickname !== undefined
      ? patch.nickname.trim().slice(0, CONTACT_NICK_MAX)
      : current.nickname;
  if (!nickname) return existing;

  const nextItem: Contact = {
    ...current,
    nickname,
  };
  if (patch.avatarHash !== undefined) {
    if (patch.avatarHash) nextItem.avatarHash = patch.avatarHash;
    else delete nextItem.avatarHash;
  }

  const next = existing.slice();
  next[index] = nextItem;
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(next));
  emitContactsChange();
  return loadContacts();
}

export function removeContact(uid: string): Contact[] {
  const next = loadContacts().filter((item) => item.uid !== uid);
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(next));
  emitContactsChange();
  return next;
}

export function clearContacts(): void {
  localStorage.removeItem(CONTACTS_KEY);
  localStorage.removeItem(RECENT_KEY);
  emitContactsChange();
}

export function loadRecentContacts(): RecentContact[] {
  const raw = localStorage.getItem(RECENT_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isRecentContact)
      .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  } catch {
    return [];
  }
}

export function touchRecentContact(input: {
  uid: string;
  nickname: string;
  source: RecentSource;
}): RecentContact[] {
  const uid = input.uid.trim();
  const nickname = input.nickname.trim().slice(0, CONTACT_NICK_MAX);
  if (!uid || !nickname) return loadRecentContacts();

  const nextItem: RecentContact = {
    uid,
    nickname,
    lastAt: new Date().toISOString(),
    source: input.source,
  };
  const next = [
    nextItem,
    ...loadRecentContacts().filter((item) => item.uid !== uid),
  ].slice(0, 40);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  emitContactsChange();
  return next;
}

export function removeRecentContact(uid: string): RecentContact[] {
  const next = loadRecentContacts().filter((item) => item.uid !== uid);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  emitContactsChange();
  return next;
}

function isContact(value: unknown): value is Contact {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Contact>;
  if (
    typeof item.uid !== "string" ||
    !item.uid ||
    typeof item.nickname !== "string" ||
    !item.nickname ||
    typeof item.addedAt !== "string" ||
    !item.addedAt
  ) {
    return false;
  }
  if (item.avatarHash !== undefined && typeof item.avatarHash !== "string") {
    return false;
  }
  return true;
}

function isRecentContact(value: unknown): value is RecentContact {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<RecentContact>;
  return (
    typeof item.uid === "string" &&
    Boolean(item.uid) &&
    typeof item.nickname === "string" &&
    Boolean(item.nickname) &&
    typeof item.lastAt === "string" &&
    Boolean(item.lastAt) &&
    (item.source === "dm" ||
      item.source === "profile" ||
      item.source === "call")
  );
}
