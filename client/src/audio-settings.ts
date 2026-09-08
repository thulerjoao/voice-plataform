const STORAGE_KEY = "voice.audio";

export const INPUT_GAIN_MIN = -30;
export const INPUT_GAIN_MAX = 30;

export type InputMode = "vad" | "ptt";

export type Keybind = {
  code: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  label: string;
  button?: number;
};

export type AudioSettings = {
  inputDeviceId: string;
  outputDeviceId: string;
  inputGainDb: number;
  outputVolume: number;
  inputMode: InputMode;
  vadSensitivity: number;
  ptt: Keybind | null;
  muteToggle: Keybind | null;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  inputDeviceId: "",
  outputDeviceId: "",
  inputGainDb: 0,
  outputVolume: 100,
  inputMode: "vad",
  vadSensitivity: 94,
  ptt: null,
  muteToggle: null,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: false,
};

export function loadAudioSettings(): AudioSettings {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_AUDIO_SETTINGS };

  try {
    const parsed = JSON.parse(raw) as Partial<AudioSettings>;
    return {
      ...DEFAULT_AUDIO_SETTINGS,
      ...pickSettings(parsed),
    };
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

const AUDIO_CHANGE_EVENT = "voice-audio";

export function saveAudioSettings(settings: AudioSettings): AudioSettings {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(
    new CustomEvent(AUDIO_CHANGE_EVENT, { detail: settings }),
  );
  return settings;
}

export function saveOutputVolume(value: number): number {
  const outputVolume = clampVolume(value);
  saveAudioSettings({ ...loadAudioSettings(), outputVolume });
  return outputVolume;
}

export function loadMasterGain(): number {
  return clampVolume(loadAudioSettings().outputVolume) / 100;
}

export function subscribeAudioSettings(
  listener: (settings: AudioSettings) => void,
): () => void {
  const onChange = (event: Event) => {
    listener((event as CustomEvent<AudioSettings>).detail);
  };
  window.addEventListener(AUDIO_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(AUDIO_CHANGE_EVENT, onChange);
}

export function clampInputGain(value: number): number {
  return Math.min(INPUT_GAIN_MAX, Math.max(INPUT_GAIN_MIN, Math.round(value)));
}

export function dbToLinear(db: number): number {
  return 10 ** (db / 20);
}

const METER_MIN_DB = -52;
const METER_MAX_DB = -8;

export function analyserRms(samples: Float32Array): number {
  let sum = 0;
  for (const sample of samples) {
    sum += sample * sample;
  }
  return Math.sqrt(sum / samples.length);
}

export function rmsToMeter(rms: number): number {
  if (rms <= 0) return 0;
  const db = 20 * Math.log10(rms);
  return Math.min(
    1,
    Math.max(0, (db - METER_MIN_DB) / (METER_MAX_DB - METER_MIN_DB)),
  );
}

export function vadThreshold(sensitivity: number): number {
  const t = Math.min(100, Math.max(0, sensitivity)) / 100;
  return 1 - t;
}

export function formatGain(db: number): string {
  if (db > 0) return `+${db} dB`;
  return `${db} dB`;
}

export function keybindFromEvent(event: KeyboardEvent): Keybind | null {
  if (event.key === "Escape" || event.key === "Tab") return null;
  if (["Control", "Shift", "Alt", "Meta"].includes(event.key)) return null;

  return {
    code: event.code,
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    label: bindLabel(
      event.ctrlKey,
      event.altKey,
      event.shiftKey,
      keyLabel(event),
    ),
  };
}

export function mouseBindFromEvent(event: MouseEvent): Keybind {
  return {
    code: `Mouse${event.button}`,
    button: event.button,
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    label: bindLabel(
      event.ctrlKey,
      event.altKey,
      event.shiftKey,
      mouseButtonLabel(event.button),
    ),
  };
}

export function isMouseBind(bind: Keybind | null): boolean {
  return bind?.button != null || Boolean(bind?.code.startsWith("Mouse"));
}

export function mouseBindButton(bind: Keybind): number | null {
  if (typeof bind.button === "number" && Number.isFinite(bind.button))
    return bind.button;
  if (bind.code.startsWith("Mouse")) {
    const n = Number(bind.code.slice(5));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function matchKeybind(event: KeyboardEvent, bind: Keybind): boolean {
  if (isMouseBind(bind)) return false;
  return (
    event.code === bind.code &&
    event.ctrlKey === bind.ctrl &&
    event.altKey === bind.alt &&
    event.shiftKey === bind.shift
  );
}

export function matchMouseBind(event: MouseEvent, bind: Keybind): boolean {
  const button = mouseBindButton(bind);
  if (button == null) return false;
  return (
    event.button === button &&
    event.ctrlKey === bind.ctrl &&
    event.altKey === bind.alt &&
    event.shiftKey === bind.shift
  );
}

export function sameKeybind(a: Keybind | null, b: Keybind | null): boolean {
  if (!a || !b) return false;
  return (
    a.code === b.code &&
    a.ctrl === b.ctrl &&
    a.alt === b.alt &&
    a.shift === b.shift &&
    (a.button ?? null) === (b.button ?? null)
  );
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function bindLabel(
  ctrl: boolean,
  alt: boolean,
  shift: boolean,
  name: string,
): string {
  return [ctrl ? "Ctrl" : "", alt ? "Alt" : "", shift ? "Shift" : "", name]
    .filter(Boolean)
    .join(" + ");
}

function keyLabel(event: KeyboardEvent): string {
  if (event.code === "Space" || event.key === " ") return "Espaço";
  if (event.key.length === 1) return event.key.toUpperCase();
  return event.key;
}

function mouseButtonLabel(button: number): string {
  if (button === 0) return "Botão esquerdo";
  if (button === 1) return "Botão do meio";
  if (button === 2) return "Botão direito";
  if (button === 3) return "Voltar";
  if (button === 4) return "Avançar";
  return `Botão ${button}`;
}

function pickSettings(parsed: Partial<AudioSettings>): Partial<AudioSettings> {
  return {
    inputDeviceId: asString(parsed.inputDeviceId),
    outputDeviceId: asString(parsed.outputDeviceId),
    inputGainDb: clampInputGain(
      asNumber(parsed.inputGainDb, DEFAULT_AUDIO_SETTINGS.inputGainDb),
    ),
    outputVolume: clampVolume(
      asNumber(parsed.outputVolume, DEFAULT_AUDIO_SETTINGS.outputVolume),
    ),
    inputMode: parsed.inputMode === "ptt" ? "ptt" : "vad",
    vadSensitivity: clampVolume(
      asNumber(parsed.vadSensitivity, DEFAULT_AUDIO_SETTINGS.vadSensitivity),
    ),
    ptt: asKeybind(parsed.ptt),
    muteToggle: asKeybind(parsed.muteToggle),
    echoCancellation: asBool(parsed.echoCancellation, true),
    noiseSuppression: asBool(parsed.noiseSuppression, true),
    autoGainControl: asBool(parsed.autoGainControl, false),
  };
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asKeybind(value: unknown): Keybind | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<Keybind>;
  if (typeof item.code !== "string" || typeof item.label !== "string")
    return null;
  return {
    code: item.code,
    ctrl: Boolean(item.ctrl),
    alt: Boolean(item.alt),
    shift: Boolean(item.shift),
    label: item.label,
    button:
      typeof item.button === "number"
        ? item.button
        : item.code.startsWith("Mouse")
          ? Number(item.code.slice(5))
          : undefined,
  };
}

function clampVolume(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}
