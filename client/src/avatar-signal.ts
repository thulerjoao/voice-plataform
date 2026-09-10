import {
  sendRealtimePayload,
  subscribeRealtimeFrame,
  subscribeRealtimeOpen,
} from "./realtime";
import { loadOwnAvatarHash } from "./avatar-store";

export type AvatarHashEvent = {
  type: "avatar.hash";
  uid: string;
  hash: string;
};

const EVENT_NAME = "voice-avatar-hash";
const pending: { type: "avatar.hash"; hash: string }[] = [];
const hashes = new Map<string, string>();

type Listener = (event: AvatarHashEvent) => void;

export function getKnownAvatarHash(uid: string): string | null {
  return hashes.get(uid) ?? null;
}

export function subscribeAvatarHash(listener: Listener): () => void {
  const onEvent = (event: Event) => {
    listener((event as CustomEvent<AvatarHashEvent>).detail);
  };
  window.addEventListener(EVENT_NAME, onEvent);
  return () => window.removeEventListener(EVENT_NAME, onEvent);
}

export function announceAvatarHash(hash: string): void {
  const message = { type: "avatar.hash" as const, hash };
  if (sendRealtimePayload(message)) return;
  pending.length = 0;
  pending.push(message);
}

export function connectAvatarSignal(selfUid: string): () => void {
  const stopOpen = subscribeRealtimeOpen(() => {
    void loadOwnAvatarHash().then((hash) => {
      if (hash) announceAvatarHash(hash);
    });
    if (pending.length === 0) return;
    for (const message of pending) sendRealtimePayload(message);
    pending.length = 0;
  });
  const stopFrame = subscribeRealtimeFrame((raw) => {
    const parsed = parseAvatarHash(raw);
    if (!parsed) return;
    if (parsed.uid === selfUid) return;
    if (parsed.hash) hashes.set(parsed.uid, parsed.hash);
    else hashes.delete(parsed.uid);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: parsed }));
  });
  return () => {
    stopOpen();
    stopFrame();
  };
}

function parseAvatarHash(raw: string): AvatarHashEvent | null {
  try {
    const value = JSON.parse(raw) as {
      type?: unknown;
      uid?: unknown;
      hash?: unknown;
    };
    if (value.type !== "avatar.hash") return null;
    if (typeof value.uid !== "string" || !value.uid) return null;
    return {
      type: "avatar.hash",
      uid: value.uid,
      hash: typeof value.hash === "string" ? value.hash : "",
    };
  } catch {
    return null;
  }
}
