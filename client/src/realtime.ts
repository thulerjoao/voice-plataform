import type { RoomRole } from "./api";

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
  | { type: "member.unblocked"; roomId: string; uid: string }
  | {
      type: "presence.joined";
      roomId: string;
      channelId: string;
      uid: string;
      nickname: string;
      role: RoomRole;
      joinedAt: number;
    }
  | { type: "presence.left"; roomId: string; channelId: string; uid: string }
  | { type: "presence.full"; roomId: string; channelId: string };

export type RealtimeClientMessage =
  | { type: "presence.join"; roomId: string; channelId: string }
  | { type: "presence.leave" }
  | {
      type: "presence.move";
      roomId: string;
      channelId: string;
      uid: string;
    };

const EVENT_NAME = "voice-realtime";

type RealtimeListener = (event: RealtimeEvent) => void;

let activeSocket: WebSocket | null = null;
const pending: RealtimeClientMessage[] = [];

export function subscribeRealtime(listener: RealtimeListener): () => void {
  const onEvent = (event: Event) => {
    listener((event as CustomEvent<RealtimeEvent>).detail);
  };
  window.addEventListener(EVENT_NAME, onEvent);
  return () => window.removeEventListener(EVENT_NAME, onEvent);
}

export function sendRealtime(message: RealtimeClientMessage): void {
  if (activeSocket?.readyState === WebSocket.OPEN) {
    activeSocket.send(JSON.stringify(message));
    return;
  }
  if (
    message.type === "presence.join" ||
    message.type === "presence.leave" ||
    message.type === "presence.move"
  ) {
    for (let i = pending.length - 1; i >= 0; i -= 1) {
      const type = pending[i].type;
      if (
        type === "presence.join" ||
        type === "presence.leave" ||
        type === "presence.move"
      ) {
        pending.splice(i, 1);
      }
    }
  }
  pending.push(message);
}

function flushPending() {
  if (activeSocket?.readyState !== WebSocket.OPEN || pending.length === 0) {
    return;
  }
  for (const message of pending) {
    activeSocket.send(JSON.stringify(message));
  }
  pending.length = 0;
}

export function connectRealtime(
  uid: string,
  options?: { onOpen?: () => void; onReady?: () => void },
): () => void {
  let closed = false;
  let socket: WebSocket | null = null;
  let timer: number | null = null;
  let delay = 800;
  let skipFirstOpen = true;

  function emit(event: RealtimeEvent) {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: event }));
  }

  function schedule() {
    if (closed) return;
    timer = window.setTimeout(open, delay);
    delay = Math.min(8000, Math.round(delay * 1.6));
  }

  function open() {
    if (closed) return;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const next = new WebSocket(
      `${protocol}://${window.location.host}/ws?uid=${encodeURIComponent(uid)}`,
    );
    socket = next;

    next.onopen = () => {
      delay = 800;
      activeSocket = next;
      flushPending();
      options?.onReady?.();
      if (skipFirstOpen) {
        skipFirstOpen = false;
        return;
      }
      options?.onOpen?.();
    };

    next.onmessage = (message) => {
      const parsed = parseEvent(message.data);
      if (parsed) emit(parsed);
    };

    next.onclose = () => {
      if (socket === next) socket = null;
      if (activeSocket === next) activeSocket = null;
      if (socket != null || closed) return;
      schedule();
    };

    next.onerror = () => {
      next.close();
    };
  }

  open();

  return () => {
    closed = true;
    if (timer != null) window.clearTimeout(timer);
    if (activeSocket === socket) activeSocket = null;
    socket?.close();
    socket = null;
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
      case "presence.joined":
        return typeof value.roomId === "string" &&
          typeof value.channelId === "string" &&
          typeof value.uid === "string" &&
          typeof value.nickname === "string" &&
          isRole(value.role)
          ? {
              type: "presence.joined",
              roomId: value.roomId,
              channelId: value.channelId,
              uid: value.uid,
              nickname: value.nickname,
              role: value.role,
              joinedAt:
                typeof value.joinedAt === "number" ? value.joinedAt : Date.now(),
            }
          : null;
      case "presence.left":
        return typeof value.roomId === "string" &&
          typeof value.channelId === "string" &&
          typeof value.uid === "string"
          ? {
              type: "presence.left",
              roomId: value.roomId,
              channelId: value.channelId,
              uid: value.uid,
            }
          : null;
      case "presence.full":
        return typeof value.roomId === "string" &&
          typeof value.channelId === "string"
          ? {
              type: "presence.full",
              roomId: value.roomId,
              channelId: value.channelId,
            }
          : null;
      default:
        return null;
    }
  } catch {
    return null;
  }
}
