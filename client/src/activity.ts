import { subscribeRealtimeFrame } from "./realtime";

const LOG_CAP = 200;
const SALA_KEY = "voice.salaActivity";
const SERVER_KEY = "voice.serverActivity";

export type ActivityLine = {
  id: string;
  at: number;
  text: string;
};

export type ActivityEvent =
  | {
      type: "log.sala";
      roomId: string;
      channelId: string;
      id: string;
      text: string;
      at: number;
    }
  | {
      type: "log.server";
      roomId: string;
      id: string;
      text: string;
      at: number;
    };

const EVENT_NAME = "voice-activity";
const salaLogs = loadBucket(SALA_KEY);
const serverLogs = loadBucket(SERVER_KEY);

type ActivityListener = (event: ActivityEvent) => void;

export function subscribeActivity(listener: ActivityListener): () => void {
  const onEvent = (event: Event) => {
    listener((event as CustomEvent<ActivityEvent>).detail);
  };
  window.addEventListener(EVENT_NAME, onEvent);
  return () => window.removeEventListener(EVENT_NAME, onEvent);
}

export function connectActivity(): () => void {
  return subscribeRealtimeFrame((raw) => {
    const parsed = parseActivity(raw);
    if (!parsed) return;
    remember(parsed);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: parsed }));
  });
}

export function salaActivity(roomId: string, channelId: string): ActivityLine[] {
  const sala = salaLogs[salaKey(roomId, channelId)] ?? [];
  const server = serverLogs[roomId] ?? [];
  return [...server, ...sala].sort(byTime);
}

export function clearSalaActivity(roomId: string, channelId: string): void {
  delete salaLogs[salaKey(roomId, channelId)];
  persistBucket(SALA_KEY, salaLogs);
}

function remember(event: ActivityEvent) {
  if (event.type === "log.sala") {
    pushLine(salaLogs, salaKey(event.roomId, event.channelId), {
      id: event.id,
      at: event.at,
      text: event.text,
    });
    persistBucket(SALA_KEY, salaLogs);
    return;
  }
  pushLine(serverLogs, event.roomId, {
    id: event.id,
    at: event.at,
    text: event.text,
  });
  persistBucket(SERVER_KEY, serverLogs);
}

function pushLine(
  bucket: Record<string, ActivityLine[]>,
  key: string,
  line: ActivityLine,
) {
  const current = bucket[key] ?? [];
  if (current.some((item) => item.id === line.id)) return;
  const next = [...current, line];
  bucket[key] =
    next.length > LOG_CAP ? next.slice(next.length - LOG_CAP) : next;
}

function salaKey(roomId: string, channelId: string) {
  return `${roomId}:${channelId}`;
}

function byTime(a: ActivityLine, b: ActivityLine) {
  if (a.at !== b.at) return a.at - b.at;
  return a.id.localeCompare(b.id);
}

function loadBucket(storageKey: string): Record<string, ActivityLine[]> {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const next: Record<string, ActivityLine[]> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!Array.isArray(value)) continue;
      const lines: ActivityLine[] = [];
      for (const item of value) {
        if (!item || typeof item !== "object") continue;
        const line = item as Partial<ActivityLine>;
        if (
          typeof line.id !== "string" ||
          typeof line.text !== "string" ||
          typeof line.at !== "number" ||
          !Number.isFinite(line.at)
        ) {
          continue;
        }
        lines.push({ id: line.id, at: line.at, text: line.text });
      }
      if (lines.length) next[key] = lines.slice(-LOG_CAP);
    }
    return next;
  } catch {
    return {};
  }
}

function persistBucket(
  storageKey: string,
  bucket: Record<string, ActivityLine[]>,
) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(bucket));
  } catch {
    /* quota */
  }
}

function parseActivity(raw: string): ActivityEvent | null {
  try {
    const value = JSON.parse(raw) as Partial<ActivityEvent> & { type?: string };
    if (!value || typeof value.type !== "string") return null;
    const at =
      typeof value.at === "number" && Number.isFinite(value.at)
        ? value.at
        : Date.now();
    if (
      value.type === "log.sala" &&
      typeof value.roomId === "string" &&
      typeof value.channelId === "string" &&
      typeof value.id === "string" &&
      typeof value.text === "string" &&
      value.text.trim() !== ""
    ) {
      return {
        type: "log.sala",
        roomId: value.roomId,
        channelId: value.channelId,
        id: value.id,
        text: value.text,
        at,
      };
    }
    if (
      value.type === "log.server" &&
      typeof value.roomId === "string" &&
      typeof value.id === "string" &&
      typeof value.text === "string" &&
      value.text.trim() !== ""
    ) {
      return {
        type: "log.server",
        roomId: value.roomId,
        id: value.id,
        text: value.text,
        at,
      };
    }
    return null;
  } catch {
    return null;
  }
}
