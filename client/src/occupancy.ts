import type { RoomRole } from "./api";
import {
  sendRealtimePayload,
  subscribeRealtimeFrame,
  subscribeRealtimeOpen,
} from "./realtime";

export type Occupant = {
  uid: string;
  nickname: string;
  role: RoomRole;
  channelId: string;
  joinedAt: number;
};

export type OccupancyEvent =
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
  | { type: "presence.full"; roomId: string; channelId: string }
  | { type: "presence.state"; roomId: string; occupants: Occupant[] };

export type OccupancyClientMessage =
  | { type: "presence.join"; roomId: string; channelId: string }
  | { type: "presence.leave" }
  | { type: "presence.move"; roomId: string; channelId: string; uid: string }
  | { type: "presence.sync"; roomId: string };

const EVENT_NAME = "voice-occupancy";

type OccupancyListener = (event: OccupancyEvent) => void;

const pending: OccupancyClientMessage[] = [];

export function subscribeOccupancy(listener: OccupancyListener): () => void {
  const onEvent = (event: Event) => {
    listener((event as CustomEvent<OccupancyEvent>).detail);
  };
  window.addEventListener(EVENT_NAME, onEvent);
  return () => window.removeEventListener(EVENT_NAME, onEvent);
}

export function sendOccupancy(message: OccupancyClientMessage): void {
  if (sendRealtimePayload(message)) return;
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

export function connectOccupancy(): () => void {
  const stopOpen = subscribeRealtimeOpen(() => {
    if (pending.length === 0) return;
    for (const message of pending) {
      sendRealtimePayload(message);
    }
    pending.length = 0;
  });
  const stopFrame = subscribeRealtimeFrame((raw) => {
    const parsed = parseOccupancy(raw);
    if (parsed) {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: parsed }));
    }
  });
  return () => {
    stopOpen();
    stopFrame();
  };
}

function isRole(value: unknown): value is RoomRole {
  return value === "owner" || value === "admin" || value === "member";
}

function parseOccupant(value: unknown): Occupant | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<Occupant>;
  if (
    typeof item.uid !== "string" ||
    typeof item.nickname !== "string" ||
    !isRole(item.role) ||
    typeof item.channelId !== "string"
  ) {
    return null;
  }
  return {
    uid: item.uid,
    nickname: item.nickname,
    role: item.role,
    channelId: item.channelId,
    joinedAt: typeof item.joinedAt === "number" ? item.joinedAt : Date.now(),
  };
}

function parseOccupancy(raw: string): OccupancyEvent | null {
  try {
    const value = JSON.parse(raw) as Partial<OccupancyEvent> & { type?: string };
    if (!value || typeof value.type !== "string") return null;
    switch (value.type) {
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
      case "presence.state": {
        if (typeof value.roomId !== "string" || !Array.isArray(value.occupants)) {
          return null;
        }
        const occupants: Occupant[] = [];
        for (const item of value.occupants) {
          const occupant = parseOccupant(item);
          if (!occupant) return null;
          occupants.push(occupant);
        }
        return { type: "presence.state", roomId: value.roomId, occupants };
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}
