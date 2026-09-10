import {
  getKnownAvatarHash,
  subscribeAvatarHash,
} from "./avatar-signal";
import {
  hashBytes,
  loadOwnAvatar,
  loadPeerAvatar,
  putPeerAvatar,
  type StoredAvatar,
} from "./avatar-store";

const CHANNEL = "avatar";
const CHUNK = 4 * 1024;
const BYTES_PER_SEC = 16 * 1024;

type BeginMsg = {
  type: "avatar.begin";
  hash: string;
  size: number;
  mime: string;
};

type NeedMsg = { type: "avatar.need"; hash: string };
type EndMsg = { type: "avatar.end"; hash: string };
type NoneMsg = { type: "avatar.none"; hash?: string };

type Incoming = {
  hash: string;
  mime: string;
  size: number;
  parts: Uint8Array[];
  received: number;
};

const channels = new Map<string, RTCDataChannel>();
const incoming = new Map<string, Incoming>();
const sending = new Set<string>();

export function attachAvatarChannel(
  pc: RTCPeerConnection,
  peerUid: string,
  create: boolean,
): void {
  if (create) {
    const dc = pc.createDataChannel(CHANNEL, { ordered: true });
    bindChannel(peerUid, dc);
  }
  pc.ondatachannel = (event) => {
    if (event.channel.label !== CHANNEL) return;
    bindChannel(peerUid, event.channel);
  };
}

export function detachAvatarChannel(peerUid: string): void {
  const dc = channels.get(peerUid);
  channels.delete(peerUid);
  incoming.delete(peerUid);
  sending.delete(peerUid);
  if (dc) {
    dc.onopen = null;
    dc.onmessage = null;
    dc.onclose = null;
    try {
      dc.close();
    } catch {
      /* ignore */
    }
  }
}

export function startAvatarTransfer(): () => void {
  const stopHash = subscribeAvatarHash(() => {
    for (const uid of channels.keys()) {
      void maybeRequest(uid);
    }
  });
  return () => stopHash();
}

export function onAvatarPeerReady(peerUid: string): void {
  void maybeRequest(peerUid);
}

function bindChannel(peerUid: string, dc: RTCDataChannel) {
  const prev = channels.get(peerUid);
  if (prev && prev !== dc) {
    try {
      prev.close();
    } catch {
      /* ignore */
    }
  }
  channels.set(peerUid, dc);
  dc.binaryType = "arraybuffer";
  dc.onopen = () => {
    void maybeRequest(peerUid);
  };
  dc.onclose = () => {
    if (channels.get(peerUid) === dc) channels.delete(peerUid);
  };
  dc.onmessage = (event) => {
    void onMessage(peerUid, event.data);
  };
}

async function maybeRequest(peerUid: string) {
  const dc = channels.get(peerUid);
  if (!dc || dc.readyState !== "open") return;
  const hash = getKnownAvatarHash(peerUid);
  if (!hash) return;
  const cached = await loadPeerAvatar(peerUid, hash);
  if (cached) return;
  sendJson(dc, { type: "avatar.need", hash } satisfies NeedMsg);
}

async function onMessage(peerUid: string, data: unknown) {
  if (typeof data === "string") {
    let msg: { type?: string; hash?: string; size?: number; mime?: string };
    try {
      msg = JSON.parse(data) as typeof msg;
    } catch {
      return;
    }
    if (msg.type === "avatar.need" && typeof msg.hash === "string") {
      void sendAvatar(peerUid, msg.hash);
      return;
    }
    if (msg.type === "avatar.begin" && typeof msg.hash === "string") {
      incoming.set(peerUid, {
        hash: msg.hash,
        mime: typeof msg.mime === "string" ? msg.mime : "image/webp",
        size: typeof msg.size === "number" ? msg.size : 0,
        parts: [],
        received: 0,
      });
      return;
    }
    if (msg.type === "avatar.end" && typeof msg.hash === "string") {
      await finishIncoming(peerUid, msg.hash);
      return;
    }
    if (msg.type === "avatar.none") {
      incoming.delete(peerUid);
    }
    return;
  }

  if (data instanceof ArrayBuffer) {
    const state = incoming.get(peerUid);
    if (!state) return;
    state.parts.push(new Uint8Array(data));
    state.received += data.byteLength;
  }
}

async function finishIncoming(peerUid: string, hash: string) {
  const state = incoming.get(peerUid);
  incoming.delete(peerUid);
  if (!state || state.hash !== hash) return;
  const bytes = concat(state.parts, state.received);
  if (state.size > 0 && bytes.byteLength !== state.size) return;
  const digest = await hashBytes(bytes);
  if (digest !== hash) return;
  await putPeerAvatar(peerUid, {
    hash,
    mime: state.mime,
    bytes,
  });
}

async function sendAvatar(peerUid: string, wantHash: string) {
  const dc = channels.get(peerUid);
  if (!dc || dc.readyState !== "open") return;
  if (sending.has(peerUid)) return;
  const own = await loadOwnAvatar();
  if (!own || own.hash !== wantHash) {
    sendJson(dc, { type: "avatar.none", hash: wantHash } satisfies NoneMsg);
    return;
  }
  sending.add(peerUid);
  try {
    sendJson(dc, {
      type: "avatar.begin",
      hash: own.hash,
      size: own.bytes.byteLength,
      mime: own.mime,
    } satisfies BeginMsg);
    const view = new Uint8Array(own.bytes);
    let offset = 0;
    while (offset < view.byteLength) {
      if (!channels.has(peerUid) || dc.readyState !== "open") return;
      const end = Math.min(offset + CHUNK, view.byteLength);
      const slice = view.slice(offset, end);
      dc.send(slice.buffer);
      offset = end;
      await sleep((slice.byteLength / BYTES_PER_SEC) * 1000);
    }
    sendJson(dc, { type: "avatar.end", hash: own.hash } satisfies EndMsg);
  } finally {
    sending.delete(peerUid);
  }
}

function sendJson(dc: RTCDataChannel, value: object) {
  if (dc.readyState !== "open") return;
  dc.send(JSON.stringify(value));
}

function concat(parts: Uint8Array[], size: number): ArrayBuffer {
  const out = new Uint8Array(size || parts.reduce((n, p) => n + p.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out.buffer;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, Math.max(8, ms));
  });
}

// silence unused StoredAvatar import warning if any
export type { StoredAvatar };
