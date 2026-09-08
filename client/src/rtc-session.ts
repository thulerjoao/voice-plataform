import {
  analyserRms,
  loadAudioSettings,
  rmsToMeter,
  subscribeAudioSettings,
  type AudioSettings,
} from "./audio-settings";
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
const remotes = new Map<string, HTMLAudioElement>();
const links = new Map<string, "connecting" | "connected">();
const linkListeners = new Set<() => void>();
const talking = new Map<string, boolean>();
const talkWatch = new Map<string, { context: AudioContext; frame: number }>();
const talkListeners = new Set<() => void>();
let seats: Occupant[] = [];
let getCall: () => Call | null = () => null;
let selfUid = "";
let signalRefs = 0;
let dropSignal: number | null = null;
let stopOccupancy: (() => void) | null = null;
let stopRtc: (() => void) | null = null;
let stopAudio: (() => void) | null = null;
let localStream: MediaStream | null = null;
let micJob: Promise<MediaStreamTrack | null> | null = null;
let sendEnabled = false;
let listenEnabled = true;
let outputVolume = loadAudioSettings().outputVolume;
let outputDeviceId = loadAudioSettings().outputDeviceId;
let liveSala: string | null = null;

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
      muted: event.muted,
      deafened: event.deafened,
    });
    void reconcile();
    return;
  }
  if (event.type === "presence.left") {
    const wasHere = seats.some(
      (item) => item.uid === event.uid && item.channelId === call.salaId,
    );
    seats = seats.filter((item) => item.uid !== event.uid);
    if (wasHere) closePeer(event.uid);
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
    stopAudio = subscribeAudioSettings(onAudioSettings);
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
      stopAudio?.();
      stopOccupancy = null;
      stopRtc = null;
      stopAudio = null;
      closeAll();
      releaseMic();
      seats = [];
      liveSala = null;
      getCall = () => null;
      selfUid = "";
    }, 0);
  };
}

export function syncRtcSignaling(nextSeats?: Occupant[]): void {
  if (nextSeats) seats = nextSeats;
  if (!getCall()) {
    closeAll();
    releaseMic();
    seats = [];
    liveSala = null;
    return;
  }
  void ensureMic();
  void reconcile();
}

export function subscribeRtcLinks(listener: () => void): () => void {
  linkListeners.add(listener);
  return () => {
    linkListeners.delete(listener);
  };
}

export function rtcLinkReady(peerUid: string): boolean {
  return links.get(peerUid) === "connected";
}

export function subscribeRtcTalking(listener: () => void): () => void {
  talkListeners.add(listener);
  return () => {
    talkListeners.delete(listener);
  };
}

export function rtcPeerTalking(peerUid: string): boolean {
  return talking.get(peerUid) === true;
}

function notifyLinks() {
  for (const listener of linkListeners) listener();
}

function setLink(uid: string, state: "connecting" | "connected") {
  if (links.get(uid) === state) return;
  links.set(uid, state);
  notifyLinks();
}

function clearLink(uid: string) {
  if (!links.has(uid)) return;
  links.delete(uid);
  notifyLinks();
}

export function setRtcMedia(next: {
  send: boolean;
  listen: boolean;
  volume: number;
}): void {
  sendEnabled = next.send;
  listenEnabled = next.listen;
  outputVolume = next.volume;
  applyLocalSend();
  applyRemoteListen();
}

function salaSeats(call: Call): Occupant[] {
  return seats.filter((item) => item.channelId === call.salaId);
}

function sameCall(call: Call): boolean {
  const current = getCall();
  return Boolean(
    current &&
      current.roomId === call.roomId &&
      current.salaId === call.salaId &&
      liveSala === callKey(call),
  );
}

function callKey(call: Call): string {
  return `${call.roomId}:${call.salaId}`;
}

async function reconcile(): Promise<void> {
  const call = getCall();
  if (!call || !selfUid) {
    closeAll();
    liveSala = null;
    return;
  }

  const key = callKey(call);
  if (liveSala !== key) {
    closeAll();
    liveSala = key;
  }

  const seated = new Set(salaSeats(call).map((item) => item.uid));
  for (const uid of [...peers.keys()]) {
    if (!seated.has(uid) || uid === selfUid) closePeer(uid);
  }

  await Promise.all(
    [...seated]
      .filter((uid) => uid !== selfUid && selfUid < uid)
      .map(async (uid) => {
        const existing = peers.get(uid);
        if (existing && peerAlive(existing)) return;
        if (existing) closePeer(uid);
        await offerTo(call, uid);
      }),
  );
}

async function offerTo(call: Call, peerUid: string): Promise<void> {
  const peer = peerOf(peerUid);
  if (peer.offered) return;
  peer.offered = true;
  try {
    await addLocalAudio(peer.pc);
    const offer = await peer.pc.createOffer();
    await peer.pc.setLocalDescription(offer);
    applyLocalSend();
    await waitIce(peer.pc);
    if (!sameCall(call) || !peers.has(peerUid)) return;
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
    await addLocalAudio(peer.pc);
    await flushIce(peer);
    const answer = await peer.pc.createAnswer();
    await peer.pc.setLocalDescription(answer);
    applyLocalSend();
    await waitIce(peer.pc);
    if (!sameCall(call) || !peers.has(event.uid)) return;
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
  const peer: Peer = { pc, ice: [], offered: false };
  peers.set(peerUid, peer);
  pc.ontrack = (event) => {
    if (peerUid === selfUid) return;
    playRemote(peerUid, event.track, event.streams[0]);
  };
  setLink(peerUid, "connecting");
  pc.onconnectionstatechange = () => {
    console.info("[rtc] pc", peerUid, pc.connectionState);
    if (pc.connectionState === "connected") setLink(peerUid, "connected");
    else if (pc.connectionState !== "closed") setLink(peerUid, "connecting");
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
  peer.pc.ontrack = null;
  peer.pc.onconnectionstatechange = null;
  peer.pc.close();
  stopRemote(uid);
  clearLink(uid);
}

function closeAll(): void {
  for (const uid of [...peers.keys()]) closePeer(uid);
}

function upsertSeat(list: Occupant[], occupant: Occupant): Occupant[] {
  const next = [...list.filter((item) => item.uid !== occupant.uid), occupant];
  next.sort((a, b) => a.joinedAt - b.joinedAt || a.uid.localeCompare(b.uid));
  return next;
}

function onAudioSettings(settings: AudioSettings): void {
  outputVolume = settings.outputVolume;
  const deviceChanged = outputDeviceId !== settings.outputDeviceId;
  outputDeviceId = settings.outputDeviceId;
  applyRemoteListen();
  if (deviceChanged) applyRemoteSink();
  if (!getCall()) return;
  const current = localStream?.getAudioTracks()[0];
  const sameDevice =
    !settings.inputDeviceId ||
    current?.getSettings().deviceId === settings.inputDeviceId;
  if (sameDevice && localStream) return;
  void refreshMic(settings);
}

async function refreshMic(settings: AudioSettings): Promise<void> {
  const next = await openMic(settings);
  if (!next) return;
  localStream?.getTracks().forEach((track) => track.stop());
  localStream = next;
  applyLocalSend();
  for (const peer of peers.values()) {
    await addLocalAudio(peer.pc);
  }
}

async function ensureMic(): Promise<MediaStreamTrack | null> {
  if (localStream) {
    applyLocalSend();
    return localStream.getAudioTracks()[0] ?? null;
  }
  if (!micJob) {
    micJob = openMic(loadAudioSettings())
      .then((stream) => {
        if (!stream) return null;
        localStream = stream;
        console.info("[rtc] mic", "on");
        applyLocalSend();
        return stream.getAudioTracks()[0] ?? null;
      })
      .finally(() => {
        micJob = null;
      });
  }
  return micJob;
}

async function openMic(settings: AudioSettings): Promise<MediaStream | null> {
  if (!navigator.mediaDevices?.getUserMedia) {
    console.info("[rtc] mic", "unavailable");
    return null;
  }
  const constraints: MediaTrackConstraints = {
    echoCancellation: settings.echoCancellation,
    noiseSuppression: settings.noiseSuppression,
    autoGainControl: settings.autoGainControl,
  };
  try {
    if (settings.inputDeviceId) {
      try {
        return await navigator.mediaDevices.getUserMedia({
          audio: { ...constraints, deviceId: { exact: settings.inputDeviceId } },
        });
      } catch {
        /* cai no padrão */
      }
    }
    return await navigator.mediaDevices.getUserMedia({ audio: constraints });
  } catch {
    console.info("[rtc] mic", "denied");
    return null;
  }
}

async function addLocalAudio(pc: RTCPeerConnection): Promise<void> {
  const track = await ensureMic();
  if (!track || !localStream) return;
  track.enabled = true;

  const transceiver = pc.getTransceivers().find((item) => {
    const kind = item.receiver.track?.kind ?? item.sender.track?.kind;
    return kind === "audio";
  });
  if (transceiver) {
    transceiver.direction = "sendrecv";
    await transceiver.sender.replaceTrack(track);
    return;
  }
  if (pc.getSenders().some((item) => item.track?.id === track.id)) return;
  pc.addTrack(track, localStream);
}

function applyLocalSend(): void {
  const track = localStream?.getAudioTracks()[0];
  if (track) track.enabled = sendEnabled;
}

function playRemote(
  peerUid: string,
  track: MediaStreamTrack,
  stream?: MediaStream,
): void {
  if (track.kind !== "audio") return;
  if (localStream?.getTracks().some((item) => item.id === track.id)) return;
  const media = stream ?? new MediaStream([track]);
  let audio = remotes.get(peerUid);
  if (!audio) {
    audio = new Audio();
    audio.autoplay = true;
    remotes.set(peerUid, audio);
  }
  audio.srcObject = media;
  applyRemoteListen();
  applyRemoteSink();
  void audio.play().catch((reason) => {
    console.info("[rtc] hear blocked", reason);
  });
  console.info("[rtc] hear", peerUid);
  watchTalk(peerUid, media);
}

function stopRemote(uid: string): void {
  stopTalk(uid);
  const audio = remotes.get(uid);
  if (!audio) return;
  remotes.delete(uid);
  audio.pause();
  audio.srcObject = null;
}

function notifyTalk() {
  for (const listener of talkListeners) listener();
}

function setTalking(uid: string, next: boolean) {
  if (talking.get(uid) === next) return;
  talking.set(uid, next);
  notifyTalk();
}

function watchTalk(uid: string, stream: MediaStream) {
  stopTalk(uid);
  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  void context.resume();
  const samples = new Float32Array(analyser.fftSize);
  let displayed = 0;
  let above = 0;
  let hangUntil = 0;
  let last = false;
  const watch = { context, frame: 0 };
  talkWatch.set(uid, watch);
  const tick = () => {
    if (!talkWatch.has(uid)) return;
    analyser.getFloatTimeDomainData(samples);
    const instant = rmsToMeter(analyserRms(samples));
    displayed = displayed * 0.72 + instant * 0.28;
    let voice = false;
    if (displayed >= 0.14 && displayed > 0) {
      above += 1;
      if (above >= 4) {
        voice = true;
        hangUntil = performance.now() + 160;
      }
    } else {
      above = 0;
      voice = performance.now() < hangUntil;
    }
    if (voice !== last) {
      last = voice;
      setTalking(uid, voice);
    }
    watch.frame = window.requestAnimationFrame(tick);
  };
  tick();
}

function stopTalk(uid: string) {
  const watch = talkWatch.get(uid);
  if (watch) {
    window.cancelAnimationFrame(watch.frame);
    void watch.context.close();
    talkWatch.delete(uid);
  }
  if (talking.delete(uid)) notifyTalk();
}

function applyRemoteListen(): void {
  const volume = listenEnabled
    ? Math.min(1, Math.max(0, outputVolume / 100))
    : 0;
  for (const audio of remotes.values()) {
    audio.muted = !listenEnabled;
    audio.volume = volume;
  }
}

function applyRemoteSink(): void {
  for (const audio of remotes.values()) {
    if (!outputDeviceId || !("setSinkId" in audio)) continue;
    void audio.setSinkId(outputDeviceId).catch(() => {
      /* fone padrão */
    });
  }
}

function releaseMic(): void {
  localStream?.getTracks().forEach((track) => track.stop());
  localStream = null;
  micJob = null;
}
