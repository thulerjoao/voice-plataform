import type { RoomRole } from "./api";
import { CLIENT_VERSION } from "./version";

export type RealtimeEvent =
  | { type: "user.nickname"; uid: string; nickname: string }
  | { type: "room.renamed"; roomId: string; name: string }
  | {
      type: "channel.created";
      roomId: string;
      id: string;
      name: string;
      description: string;
    }
  | {
      type: "channel.updated";
      roomId: string;
      id: string;
      name: string;
      description: string;
    }
  | { type: "channel.deleted"; roomId: string; channelId: string }
  | {
      type: "member.joined";
      roomId: string;
      uid: string;
      nickname: string;
      role: RoomRole;
    }
  | { type: "member.left"; roomId: string; uid: string }
  | { type: "member.role"; roomId: string; uid: string; role: RoomRole }
  | { type: "member.kicked"; roomId: string; uid: string }
  | {
      type: "member.blocked";
      roomId: string;
      uid: string;
      nickname: string;
    }
  | { type: "member.unblocked"; roomId: string; uid: string };

const EVENT_NAME = "voice-realtime";

type RealtimeListener = (event: RealtimeEvent) => void;
type FrameListener = (raw: string) => void;

let activeSocket: WebSocket | null = null;
const openListeners = new Set<() => void>();
const frameListeners = new Set<FrameListener>();

export function subscribeRealtime(listener: RealtimeListener): () => void {
  const onEvent = (event: Event) => {
    listener((event as CustomEvent<RealtimeEvent>).detail);
  };
  window.addEventListener(EVENT_NAME, onEvent);
  return () => window.removeEventListener(EVENT_NAME, onEvent);
}

export function subscribeRealtimeOpen(listener: () => void): () => void {
  openListeners.add(listener);
  if (activeSocket?.readyState === WebSocket.OPEN) listener();
  return () => {
    openListeners.delete(listener);
  };
}

export function subscribeRealtimeFrame(listener: FrameListener): () => void {
  frameListeners.add(listener);
  return () => {
    frameListeners.delete(listener);
  };
}

export function sendRealtimePayload(value: unknown): boolean {
  if (activeSocket?.readyState !== WebSocket.OPEN) return false;
  activeSocket.send(JSON.stringify(value));
  return true;
}

type LiveSocket = {
  uid: string;
  refs: number;
  closed: boolean;
  socket: WebSocket | null;
  timer: number | null;
  delay: number;
  skipFirstOpen: boolean;
  onOpen?: () => void;
};

let live: LiveSocket | null = null;
let dropTimer: number | null = null;

function emitRealtime(event: RealtimeEvent) {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: event }));
}

function socketUrl(uid: string): string {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/ws?uid=${encodeURIComponent(uid)}&v=${encodeURIComponent(CLIENT_VERSION)}`;
}

function dropLive(session: LiveSocket) {
  session.closed = true;
  if (session.timer != null) window.clearTimeout(session.timer);
  session.timer = null;
  if (activeSocket === session.socket) activeSocket = null;
  session.socket?.close();
  session.socket = null;
  if (live === session) live = null;
}

function openLive(session: LiveSocket) {
  if (session.closed) return;
  const next = new WebSocket(socketUrl(session.uid));
  session.socket = next;

  next.onopen = () => {
    session.delay = 800;
    activeSocket = next;
    for (const listener of openListeners) listener();
    if (session.skipFirstOpen) {
      session.skipFirstOpen = false;
      return;
    }
    session.onOpen?.();
  };

  next.onmessage = (message) => {
    if (typeof message.data !== "string") return;
    const parsed = parseEvent(message.data);
    if (parsed) emitRealtime(parsed);
    for (const listener of frameListeners) listener(message.data);
  };

  next.onclose = () => {
    if (session.socket === next) session.socket = null;
    if (activeSocket === next) activeSocket = null;
    if (session.closed) return;
    session.timer = window.setTimeout(() => openLive(session), session.delay);
    session.delay = Math.min(8000, Math.round(session.delay * 1.6));
  };
}

export function connectRealtime(
  uid: string,
  options?: { onOpen?: () => void },
): () => void {
  if (dropTimer != null) {
    window.clearTimeout(dropTimer);
    dropTimer = null;
  }

  if (!live || live.uid !== uid || live.closed) {
    if (live && !live.closed) dropLive(live);
    live = {
      uid,
      refs: 0,
      closed: false,
      socket: null,
      timer: null,
      delay: 800,
      skipFirstOpen: true,
      onOpen: options?.onOpen,
    };
    openLive(live);
  } else if (options?.onOpen) {
    live.onOpen = options.onOpen;
  }

  live.refs += 1;
  const session = live;

  return () => {
    session.refs -= 1;
    if (session.refs > 0) return;
    dropTimer = window.setTimeout(() => {
      dropTimer = null;
      if (session.refs > 0 || live !== session) return;
      dropLive(session);
    }, 0);
  };
}

function isRole(value: unknown): value is RoomRole {
  return value === "owner" || value === "admin" || value === "member";
}

function parseEvent(raw: unknown): RealtimeEvent | null {
  if (typeof raw !== "string") return null;
  try {
    const value = JSON.parse(raw) as Partial<RealtimeEvent> & { type?: string };
    if (!value || typeof value.type !== "string") return null;
    switch (value.type) {
      case "user.nickname":
        return typeof value.uid === "string" && typeof value.nickname === "string"
          ? {
              type: "user.nickname",
              uid: value.uid,
              nickname: value.nickname,
            }
          : null;
      case "room.renamed":
        return typeof value.roomId === "string" && typeof value.name === "string"
          ? { type: "room.renamed", roomId: value.roomId, name: value.name }
          : null;
      case "channel.created":
      case "channel.updated":
        return typeof value.roomId === "string" &&
          typeof value.id === "string" &&
          typeof value.name === "string"
          ? {
              type: value.type,
              roomId: value.roomId,
              id: value.id,
              name: value.name,
              description:
                typeof value.description === "string" ? value.description : "",
            }
          : null;
      case "channel.deleted":
        return typeof value.roomId === "string" &&
          typeof value.channelId === "string"
          ? {
              type: "channel.deleted",
              roomId: value.roomId,
              channelId: value.channelId,
            }
          : null;
      case "member.joined":
        return typeof value.roomId === "string" &&
          typeof value.uid === "string" &&
          typeof value.nickname === "string" &&
          isRole(value.role)
          ? {
              type: "member.joined",
              roomId: value.roomId,
              uid: value.uid,
              nickname: value.nickname,
              role: value.role,
            }
          : null;
      case "member.left":
      case "member.kicked":
      case "member.unblocked":
        return typeof value.roomId === "string" && typeof value.uid === "string"
          ? { type: value.type, roomId: value.roomId, uid: value.uid }
          : null;
      case "member.role":
        return typeof value.roomId === "string" &&
          typeof value.uid === "string" &&
          (value.role === "admin" || value.role === "member")
          ? {
              type: "member.role",
              roomId: value.roomId,
              uid: value.uid,
              role: value.role,
            }
          : null;
      case "member.blocked":
        return typeof value.roomId === "string" &&
          typeof value.uid === "string" &&
          typeof value.nickname === "string"
          ? {
              type: "member.blocked",
              roomId: value.roomId,
              uid: value.uid,
              nickname: value.nickname,
            }
          : null;
      default:
        return null;
    }
  } catch {
    return null;
  }
}
