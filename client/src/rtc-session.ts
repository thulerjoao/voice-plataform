import {
  subscribeOccupancy,
  type OccupancyEvent,
  type Occupant,
} from "./occupancy";
import { sendRtc, subscribeRtc, type RtcEvent } from "./rtc";

const STUN = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

type Call = { roomId: string; salaId: string };

type Peer = {
  pc: RTCPeerConnection;
  ice: RTCIceCandidateInit[];
  offered: boolean;
};

const peers = new Map<string, Peer>();
let seats: Occupant[] = [];
let getCall: () => Call | null = () => null;
let selfUid = "";
let signalRefs = 0;
let dropSignal: number | null = null;
let stopOccupancy: (() => void) | null = null;
let stopRtc: (() => void) | null = null;

function onOccupancy(event: OccupancyEvent) {
  const call = getCall();
  if (!call || !("roomId" in event) || event.roomId !== call.roomId) return;

  if (event.type === "presence.state") {
    seats = event.occupants;
    void reconcile();
    return;
  }
  if (event.type === "presence.joined") {
    seats = upsertSeat(seats, {
      uid: event.uid,
      nickname: event.nickname,
      role: event.role,
      channelId: event.channelId,
      joinedAt: event.joinedAt,
    });
    void reconcile();
    return;
  }
  if (event.type === "presence.left") {
    seats = seats.filter((item) => item.uid !== event.uid);
    closePeer(event.uid);
    void reconcile();
  }
}

export function startRtcSignaling(
  uid: string,
  readCall: () => Call | null,
): () => void {
  if (dropSignal != null) {
    window.clearTimeout(dropSignal);
    dropSignal = null;
  }
  selfUid = uid;
  getCall = readCall;
  if (!stopRtc) {
    stopOccupancy = subscribeOccupancy(onOccupancy);
    stopRtc = subscribeRtc((event) => {
      void onRtc(event);
    });
  }
  signalRefs += 1;
  void reconcile();
  return () => {
    signalRefs -= 1;
    if (signalRefs > 0) return;
    dropSignal = window.setTimeout(() => {
      dropSignal = null;
      if (signalRefs > 0) return;
      stopOccupancy?.();
      stopRtc?.();
      stopOccupancy = null;
      stopRtc = null;
      closeAll();
      seats = [];
      getCall = () => null;
      selfUid = "";
    }, 0);
  };
}

export function syncRtcSignaling(nextSeats?: Occupant[]): void {
  if (nextSeats) seats = nextSeats;
  if (!getCall()) {
    closeAll();
    seats = [];
    return;
  }
  void reconcile();
}

function salaSeats(call: Call): Occupant[] {
  return seats.filter((item) => item.channelId === call.salaId);
}

function hostUid(call: Call): string | null {
  const seated = salaSeats(call);
  if (seated.length === 0) return null;
  return seated.reduce((a, b) =>
    a.joinedAt < b.joinedAt || (a.joinedAt === b.joinedAt && a.uid < b.uid)
      ? a
      : b,
  ).uid;
}

async function reconcile(): Promise<void> {
  const call = getCall();
  if (!call || !selfUid) {
    closeAll();
    return;
  }

  const seated = new Set(salaSeats(call).map((item) => item.uid));
  for (const uid of [...peers.keys()]) {
    if (!seated.has(uid) || uid === selfUid) closePeer(uid);
  }

  const host = hostUid(call);
  const seatedCount = seated.size;
  if (seatedCount > 0) {
    console.info(
      "[rtc] sala",
      seatedCount,
      host === selfUid ? "host=me" : `host=${host ?? "?"}`,
    );
  }
  if (!host || host === selfUid) return;
  const existing = peers.get(host);
  if (existing && peerAlive(existing)) return;
  if (existing) closePeer(host);
  await offerTo(call, host);
}

async function offerTo(call: Call, peerUid: string): Promise<void> {
  const peer = peerOf(peerUid);
  if (peer.offered) return;
  peer.offered = true;
  try {
    const offer = await peer.pc.createOffer();
    await peer.pc.setLocalDescription(offer);
    await waitIce(peer.pc);
    const sdp = peer.pc.localDescription?.sdp;
    if (!sdp) return;
    sendRtc({
      type: "rtc.offer",
      roomId: call.roomId,
      channelId: call.salaId,
      to: peerUid,
      sdp,
    });
  } catch (reason) {
    console.info("[rtc] offer failed", reason);
    closePeer(peerUid);
  }
}

function sanitizeSdp(sdp: string): string {
  return sdp.replace(/cname:\{([^}]+)\}/g, "cname:$1");
}

async function onRtc(event: RtcEvent): Promise<void> {
  const call = getCall();
  if (!call || event.roomId !== call.roomId || event.channelId !== call.salaId) {
    return;
  }
  if (event.to !== selfUid) return;

  try {
    await applyRtc(call, event);
  } catch (reason) {
    console.info("[rtc] signal failed", reason);
  }
}

async function applyRtc(call: Call, event: RtcEvent): Promise<void> {
  if (event.type === "rtc.offer") {
    closePeer(event.uid);
    const peer = peerOf(event.uid);
    await peer.pc.setRemoteDescription({
      type: "offer",
      sdp: sanitizeSdp(event.sdp),
    });
    await flushIce(peer);
    const answer = await peer.pc.createAnswer();
    await peer.pc.setLocalDescription(answer);
    await waitIce(peer.pc);
    const sdp = peer.pc.localDescription?.sdp;
    if (!sdp) return;
    sendRtc({
      type: "rtc.answer",
      roomId: call.roomId,
      channelId: call.salaId,
      to: event.uid,
      sdp,
    });
    return;
  }

  if (event.type === "rtc.answer") {
    const peer = peers.get(event.uid);
    if (!peer || peer.pc.signalingState !== "have-local-offer") return;
    await peer.pc.setRemoteDescription({
      type: "answer",
      sdp: sanitizeSdp(event.sdp),
    });
    await flushIce(peer);
    return;
  }

  const peer = peers.get(event.uid);
  if (!peer) return;
  const init = event.candidate
    ? {
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid,
        sdpMLineIndex: event.candidate.sdpMLineIndex ?? undefined,
      }
    : null;
  if (!peer.pc.remoteDescription) {
    if (init) peer.ice.push(init);
    return;
  }
  await peer.pc.addIceCandidate(init);
}

function peerAlive(peer: Peer): boolean {
  const state = peer.pc.connectionState;
  return state !== "failed" && state !== "closed" && state !== "disconnected";
}

function peerOf(peerUid: string): Peer {
  const existing = peers.get(peerUid);
  if (existing) return existing;

  const pc = new RTCPeerConnection(STUN);
  pc.addTransceiver("audio", { direction: "sendrecv" });
  const peer: Peer = { pc, ice: [], offered: false };
  peers.set(peerUid, peer);
  pc.onconnectionstatechange = () => {
    console.info("[rtc] pc", peerUid, pc.connectionState);
  };
  return peer;
}

function waitIce(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const finish = () => {
      pc.removeEventListener("icegatheringstatechange", onChange);
      resolve();
    };
    const onChange = () => {
      if (pc.iceGatheringState === "complete") finish();
    };
    pc.addEventListener("icegatheringstatechange", onChange);
    window.setTimeout(finish, 2500);
  });
}

async function flushIce(peer: Peer): Promise<void> {
  const queued = peer.ice.splice(0);
  for (const candidate of queued) {
    await peer.pc.addIceCandidate(candidate);
  }
}

function closePeer(uid: string): void {
  const peer = peers.get(uid);
  if (!peer) return;
  peers.delete(uid);
  peer.pc.onconnectionstatechange = null;
  peer.pc.close();
}

function closeAll(): void {
  for (const uid of [...peers.keys()]) closePeer(uid);
}

function upsertSeat(list: Occupant[], occupant: Occupant): Occupant[] {
  const next = [...list.filter((item) => item.uid !== occupant.uid), occupant];
  next.sort((a, b) => a.joinedAt - b.joinedAt || a.uid.localeCompare(b.uid));
  return next;
}
