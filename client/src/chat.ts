import {
  sendRealtimePayload,
  subscribeRealtimeFrame,
  subscribeRealtimeOpen,
} from "./realtime";

export const CHAT_TEXT_MAX = 120;
const SALA_LOG_CAP = 200;
const SALA_LOG_KEY = "voice.salaChat";

export type ChatLine = {
  id: string;
  uid: string;
  nick: string;
  text: string;
  at: number;
};

export type ChatEvent =
  | {
      type: "chat.sala";
      roomId: string;
      channelId: string;
      uid: string;
      nickname: string;
      id: string;
      text: string;
      at: number;
    }
  | {
      type: "chat.direct";
      roomId: string;
      uid: string;
      to: string;
      nickname: string;
      toNickname: string;
      id: string;
      text: string;
      at: number;
    };

export type ChatClientMessage =
  | {
      type: "chat.sala";
      roomId: string;
      channelId: string;
      id: string;
      text: string;
    }
  | { type: "chat.direct"; roomId: string; uid: string; id: string; text: string };

const EVENT_NAME = "voice-chat";
const pending: ChatClientMessage[] = [];
const salaLogs = loadSalaLogs();

type ChatListener = (event: ChatEvent) => void;

export function subscribeChat(listener: ChatListener): () => void {
  const onEvent = (event: Event) => {
    listener((event as CustomEvent<ChatEvent>).detail);
  };
  window.addEventListener(EVENT_NAME, onEvent);
  return () => window.removeEventListener(EVENT_NAME, onEvent);
}

export function sendChat(message: ChatClientMessage): void {
  if (sendRealtimePayload(message)) return;
  pending.push(message);
}

export function connectChat(): () => void {
  const stopOpen = subscribeRealtimeOpen(() => {
    if (pending.length === 0) return;
    for (const message of pending) {
      sendRealtimePayload(message);
    }
    pending.length = 0;
  });
  const stopFrame = subscribeRealtimeFrame((raw) => {
    const parsed = parseChat(raw);
    if (!parsed) return;
    if (parsed.type === "chat.sala") {
      rememberSalaLine(parsed.roomId, parsed.channelId, {
        id: parsed.id,
        uid: parsed.uid,
        nick: parsed.nickname,
        text: parsed.text,
        at: parsed.at,
      });
    }
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: parsed }));
  });
  return () => {
    stopOpen();
    stopFrame();
  };
}

export function salaLog(roomId: string, channelId: string): ChatLine[] {
  return salaLogs[roomKey(roomId, channelId)] ?? [];
}

export function clearSalaLog(roomId: string, channelId: string): void {
  delete salaLogs[roomKey(roomId, channelId)];
  persistSalaLogs();
}

function rememberSalaLine(roomId: string, channelId: string, line: ChatLine) {
  const key = roomKey(roomId, channelId);
  const current = salaLogs[key] ?? [];
  if (current.some((item) => item.id === line.id)) return;
  const next = [...current, line];
  salaLogs[key] =
    next.length > SALA_LOG_CAP ? next.slice(next.length - SALA_LOG_CAP) : next;
  persistSalaLogs();
}

function roomKey(roomId: string, channelId: string) {
  return `${roomId}:${channelId}`;
}

function loadSalaLogs(): Record<string, ChatLine[]> {
  try {
    const raw = window.localStorage.getItem(SALA_LOG_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const next: Record<string, ChatLine[]> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!Array.isArray(value)) continue;
      const lines: ChatLine[] = [];
      for (const item of value) {
        if (!item || typeof item !== "object") continue;
        const line = item as Partial<ChatLine>;
        if (
          typeof line.id !== "string" ||
          typeof line.uid !== "string" ||
          typeof line.nick !== "string" ||
          typeof line.text !== "string"
        ) {
          continue;
        }
        lines.push({
          id: line.id,
          uid: line.uid,
          nick: line.nick,
          text: line.text,
          at: typeof line.at === "number" && Number.isFinite(line.at) ? line.at : 0,
        });
      }
      if (lines.length) next[key] = lines.slice(-SALA_LOG_CAP);
    }
    return next;
  } catch {
    return {};
  }
}

function persistSalaLogs() {
  try {
    window.localStorage.setItem(SALA_LOG_KEY, JSON.stringify(salaLogs));
  } catch {
    /* quota */
  }
}

function parseChat(raw: string): ChatEvent | null {
  try {
    const value = JSON.parse(raw) as Partial<ChatEvent> & { type?: string };
    if (!value || typeof value.type !== "string") return null;
    if (
      value.type === "chat.sala" &&
      typeof value.roomId === "string" &&
      typeof value.channelId === "string" &&
      typeof value.uid === "string" &&
      typeof value.nickname === "string" &&
      typeof value.id === "string" &&
      typeof value.text === "string"
    ) {
      return {
        type: "chat.sala",
        roomId: value.roomId,
        channelId: value.channelId,
        uid: value.uid,
        nickname: value.nickname,
        id: value.id,
        text: value.text,
        at: eventAt(value.at),
      };
    }
    if (
      value.type === "chat.direct" &&
      typeof value.roomId === "string" &&
      typeof value.uid === "string" &&
      typeof value.to === "string" &&
      typeof value.nickname === "string" &&
      typeof value.toNickname === "string" &&
      typeof value.id === "string" &&
      typeof value.text === "string"
    ) {
      return {
        type: "chat.direct",
        roomId: value.roomId,
        uid: value.uid,
        to: value.to,
        nickname: value.nickname,
        toNickname: value.toNickname,
        id: value.id,
        text: value.text,
        at: eventAt(value.at),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function eventAt(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : Date.now();
}
