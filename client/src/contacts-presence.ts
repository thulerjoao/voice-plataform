import {
  sendRealtimePayload,
  subscribeRealtimeFrame,
  subscribeRealtimeOpen,
} from "./realtime";

export type ContactPresenceStatus =
  | "online"
  | "busy"
  | "brb"
  | "offline";

export type ContactPresenceEvent =
  | {
      type: "contacts.snapshot";
      people: { uid: string; status: ContactPresenceStatus }[];
    }
  | {
      type: "contacts.presence";
      uid: string;
      status: ContactPresenceStatus;
    };

export type ContactPresenceClientMessage =
  | { type: "contacts.sync"; uids: string[] }
  | {
      type: "contacts.status";
      status: "online" | "busy" | "brb" | "invisible";
    };

const EVENT_NAME = "voice-contacts-presence";

type Listener = (event: ContactPresenceEvent) => void;

const pending: ContactPresenceClientMessage[] = [];
let watched: string[] = [];

export function subscribeContactPresence(listener: Listener): () => void {
  const onEvent = (event: Event) => {
    listener((event as CustomEvent<ContactPresenceEvent>).detail);
  };
  window.addEventListener(EVENT_NAME, onEvent);
  return () => window.removeEventListener(EVENT_NAME, onEvent);
}

export function sendContactPresence(message: ContactPresenceClientMessage): void {
  if (message.type === "contacts.sync") {
    watched = message.uids.slice();
  }
  if (sendRealtimePayload(message)) return;
  if (message.type === "contacts.status") {
    for (let i = pending.length - 1; i >= 0; i -= 1) {
      if (pending[i].type === "contacts.status") pending.splice(i, 1);
    }
  } else if (message.type === "contacts.sync") {
    for (let i = pending.length - 1; i >= 0; i -= 1) {
      if (pending[i].type === "contacts.sync") pending.splice(i, 1);
    }
  }
  pending.push(message);
}

export function syncContactPresence(uids: string[]): void {
  sendContactPresence({ type: "contacts.sync", uids });
}

export function connectContactPresence(): () => void {
  const stopOpen = subscribeRealtimeOpen(() => {
    if (watched.length > 0) {
      sendRealtimePayload({ type: "contacts.sync", uids: watched });
    }
    if (pending.length === 0) return;
    for (const message of pending) {
      sendRealtimePayload(message);
    }
    pending.length = 0;
  });
  const stopFrame = subscribeRealtimeFrame((raw) => {
    const parsed = parseContactPresence(raw);
    if (parsed) {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: parsed }));
    }
  });
  return () => {
    stopOpen();
    stopFrame();
  };
}

function parseContactPresence(raw: string): ContactPresenceEvent | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const item = value as { type?: unknown };
  if (item.type === "contacts.snapshot") {
    const peopleRaw = (value as { people?: unknown }).people;
    if (!Array.isArray(peopleRaw)) return null;
    const people: { uid: string; status: ContactPresenceStatus }[] = [];
    for (const entry of peopleRaw) {
      if (!entry || typeof entry !== "object") continue;
      const row = entry as { uid?: unknown; status?: unknown };
      if (typeof row.uid !== "string" || !row.uid) continue;
      people.push({ uid: row.uid, status: parseVisibleStatus(row.status) });
    }
    return { type: "contacts.snapshot", people };
  }
  if (item.type === "contacts.presence") {
    const row = value as { uid?: unknown; status?: unknown };
    if (typeof row.uid !== "string" || !row.uid) return null;
    return {
      type: "contacts.presence",
      uid: row.uid,
      status: parseVisibleStatus(row.status),
    };
  }
  return null;
}

function parseVisibleStatus(value: unknown): ContactPresenceStatus {
  if (value === "online" || value === "busy" || value === "brb" || value === "offline") {
    return value;
  }
  return "offline";
}
