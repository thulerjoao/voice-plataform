import { loadMasterGain } from "./audio-settings";

let ctx: AudioContext | null = null;

function audioContext() {
  if (!ctx) {
    ctx = new AudioContext();
  }

  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  return ctx;
}

function pluck(
  ctx: AudioContext,
  dest: AudioNode,
  time: number,
  freq: number,
  duration: number,
  gain: number,
) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, time);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, time);
  env.gain.exponentialRampToValueAtTime(gain, time + 0.014);
  env.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc.connect(env);
  env.connect(dest);
  osc.start(time);
  osc.stop(time + duration + 0.03);
}

function whoosh(ctx: AudioContext, dest: AudioNode, time: number) {
  const length = Math.floor(ctx.sampleRate * 0.14);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 5;
  filter.frequency.setValueAtTime(380, time);
  filter.frequency.exponentialRampToValueAtTime(2100, time + 0.11);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.2, time);
  env.gain.exponentialRampToValueAtTime(0.001, time + 0.13);

  source.connect(filter);
  filter.connect(env);
  env.connect(dest);
  source.start(time);
}

export function playPokeSound() {
  try {
    const ctx = audioContext();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.28 * loadMasterGain(), now);
    master.connect(ctx.destination);

    pluck(ctx, master, now, 880, 0.16, 0.7);
    pluck(ctx, master, now + 0.09, 1174.66, 0.22, 0.65);
    pluck(ctx, master, now + 0.2, 1396.91, 0.28, 0.45);
  } catch {
    // Autoplay bloqueado ou Web Audio indisponível — silêncio.
  }
}

export function playMuteSound() {
  try {
    const ctx = audioContext();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.09 * loadMasterGain(), now);
    master.connect(ctx.destination);

    pluck(ctx, master, now, 360, 0.1, 0.45);
    pluck(ctx, master, now + 0.05, 240, 0.14, 0.35);
  } catch {
    // Autoplay bloqueado ou Web Audio indisponível — silêncio.
  }
}

export function playUnmuteSound() {
  try {
    const ctx = audioContext();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.09 * loadMasterGain(), now);
    master.connect(ctx.destination);

    pluck(ctx, master, now, 420, 0.1, 0.4);
    pluck(ctx, master, now + 0.05, 620, 0.14, 0.38);
  } catch {
    // Autoplay bloqueado ou Web Audio indisponível — silêncio.
  }
}

export function playConnectSound() {
  try {
    const ctx = audioContext();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.22 * loadMasterGain(), now);
    master.connect(ctx.destination);

    whoosh(ctx, master, now);
    pluck(ctx, master, now + 0.04, 392, 0.22, 0.45);
    pluck(ctx, master, now + 0.12, 523.25, 0.3, 0.55);
    pluck(ctx, master, now + 0.21, 659.25, 0.36, 0.4);
  } catch {
    // Autoplay bloqueado ou Web Audio indisponível — silêncio.
  }
}
