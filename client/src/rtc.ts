import {
  sendRealtimePayload,
  subscribeRealtimeFrame,
  subscribeRealtimeOpen,
} from "./realtime";

export type RtcIceCandidate = {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
};

export type RtcEvent =
  | {
      type: "rtc.offer" | "rtc.answer";
      roomId: string;
      channelId: string;
      uid: string;
      to: string;
      sdp: string;
    }
  | {
      type: "rtc.ice";
      roomId: string;
      channelId: string;
      uid: string;
      to: string;
      candidate: RtcIceCandidate | null;
    };

export type RtcClientMessage =
  | {
      type: "rtc.offer" | "rtc.answer";
      roomId: string;
      channelId: string;
      to: string;
      sdp: string;
    }
  | {
      type: "rtc.ice";
      roomId: string;
      channelId: string;
      to: string;
      candidate: RtcIceCandidate | null;
    };

const EVENT_NAME = "voice-rtc";
const pending: RtcClientMessage[] = [];

type RtcListener = (event: RtcEvent) => void;

export function subscribeRtc(listener: RtcListener): () => void {
  const onEvent = (event: Event) => {
    listener((event as CustomEvent<RtcEvent>).detail);
  };
  window.addEventListener(EVENT_NAME, onEvent);
  return () => window.removeEventListener(EVENT_NAME, onEvent);
}

export function sendRtc(message: RtcClientMessage): void {
  logRtc("out", message);
  if (sendRealtimePayload(message)) return;
  pending.push(message);
}

export function connectRtc(): () => void {
  const stopOpen = subscribeRealtimeOpen(() => {
    if (pending.length === 0) return;
    for (const message of pending) {
      sendRealtimePayload(message);
    }
    pending.length = 0;
  });
  const stopFrame = subscribeRealtimeFrame((raw) => {
    const parsed = parseRtc(raw);
    if (!parsed) return;
    logRtc("in", parsed);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: parsed }));
  });
  return () => {
    stopOpen();
    stopFrame();
  };
}

function logRtc(
  direction: "in" | "out",
  message: RtcClientMessage | RtcEvent,
) {
  const arrow = direction === "in" ? "←" : "→";
  if (message.type === "rtc.ice") {
    const ice = message.candidate?.candidate || "end";
    console.info("[rtc]", arrow, message.type, message.to ?? "", ice);
    return;
  }
  console.info(
    "[rtc]",
    arrow,
    message.type,
    "to" in message ? message.to : "",
    `${message.sdp.length}b`,
  );
}

function parseIce(value: unknown): RtcIceCandidate | null {
  if (value == null) return null;
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<RtcIceCandidate>;
  if (typeof item.candidate !== "string" || item.candidate.trim() === "") {
    return null;
  }
  return {
    candidate: item.candidate,
    sdpMid: typeof item.sdpMid === "string" ? item.sdpMid : null,
    sdpMLineIndex:
      typeof item.sdpMLineIndex === "number" ? item.sdpMLineIndex : null,
  };
}

function parseRtc(raw: string): RtcEvent | null {
  try {
    const value = JSON.parse(raw) as Partial<RtcEvent> & { type?: string };
    if (!value || typeof value.type !== "string") return null;
    if (
      (value.type === "rtc.offer" || value.type === "rtc.answer") &&
      typeof value.roomId === "string" &&
      typeof value.channelId === "string" &&
      typeof value.uid === "string" &&
      typeof value.to === "string" &&
      typeof value.sdp === "string" &&
      value.sdp.trim() !== ""
    ) {
      return {
        type: value.type,
        roomId: value.roomId,
        channelId: value.channelId,
        uid: value.uid,
        to: value.to,
        sdp: value.sdp,
      };
    }
    if (
      value.type === "rtc.ice" &&
      typeof value.roomId === "string" &&
      typeof value.channelId === "string" &&
      typeof value.uid === "string" &&
      typeof value.to === "string"
    ) {
      return {
        type: "rtc.ice",
        roomId: value.roomId,
        channelId: value.channelId,
        uid: value.uid,
        to: value.to,
        candidate: parseIce(
          (value as { candidate?: unknown }).candidate,
        ),
      };
    }
    return null;
  } catch {
    return null;
  }
}
