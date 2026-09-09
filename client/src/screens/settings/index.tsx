import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  INPUT_GAIN_MAX,
  INPUT_GAIN_MIN,
  clampInputGain,
  dbToLinear,
  formatGain,
  isMouseBind,
  keybindFromEvent,
  loadAudioSettings,
  subscribeAudioSettings,
  matchKeybind,
  matchMouseBind,
  mouseBindFromEvent,
  saveAudioSettings,
  sameKeybind,
  analyserRms,
  rmsToMeter,
  vadThreshold,
  type AudioSettings,
  type InputMode,
  type Keybind,
} from "../../audio-settings";
import {
  AppVersion,
  BackButton,
  BackRow,
  BindActions,
  BindButton,
  BindLabel,
  BindRow,
  Body,
  ClearBind,
  CodeBox,
  DangerButton,
  ErrorText,
  Field,
  FieldLabel,
  GhostButton,
  Heading,
  Hint,
  Lead,
  MeterBar,
  MeterClip,
  MeterMark,
  MeterRow,
  MeterTrack,
  ModeButton,
  ModeRow,
  NameButton,
  NameEdit,
  NameIcon,
  NameInput,
  Panel,
  RecoveryCode,
  DeviceButton,
  DeviceChevron,
  DeviceField,
  DeviceMenu,
  DeviceName,
  DeviceOption,
  DeviceWrap,
  Section,
  SectionTitle,
  Slider,
  SliderRow,
  StepButton,
  Switch,
  Tab,
  Tabs,
  ToggleCopy,
  ToggleHint,
  ToggleRow,
  ToggleTitle,
  Value,
  Warn,
} from "./style";
import type { Identity } from "../../identity";
import { NICKNAME_MAX_LENGTH, persistNickname } from "../../identity";
import { CLIENT_VERSION } from "../../version";

type SettingsScreenProps = {
  identity: Identity;
  onBack: () => void;
  onLogout: () => void;
  onNicknameChange: (identity: Identity) => void;
  deafened: boolean;
  onOutputVolume: (value: number) => void;
};

type SettingsTab = "audio" | "account";

type DeviceLists = {
  inputs: MediaDeviceInfo[];
  outputs: MediaDeviceInfo[];
};

type CaptureTarget = "ptt" | "muteToggle" | null;

async function setAudioSink(ctx: AudioContext, deviceId: string) {
  const setSinkId = ctx.setSinkId;
  if (!setSinkId) return;
  await setSinkId.call(ctx, deviceId);
}

function BackIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M10 3.2 5.2 8 10 12.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20h4l10.5-10.5a1.8 1.8 0 0 0 0-2.5L16 4.5a1.8 1.8 0 0 0-2.5 0L3.5 14.5V20z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.2 8.2 6.4 11.4 12.8 4.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect
        x="5.2"
        y="5.2"
        width="8"
        height="8"
        rx="1.4"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M10.8 5.2V3.8A1.6 1.6 0 0 0 9.2 2.2H3.8A1.6 1.6 0 0 0 2.2 3.8v5.4A1.6 1.6 0 0 0 3.8 10.8h1.4"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function uniqueDevices(list: MediaDeviceInfo[]): MediaDeviceInfo[] {
  const seen = new Set<string>();
  return list.filter((item) => {
    if (!item.deviceId || seen.has(item.deviceId)) return false;
    seen.add(item.deviceId);
    return true;
  });
}

function deviceLabel(
  device: MediaDeviceInfo | undefined,
  fallback: string,
  index?: number,
): string {
  if (device?.label) return device.label;
  if (index != null) return `${fallback} ${index + 1}`;
  return fallback;
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 6.2 8 10.2 12 6.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeviceSelect({
  label,
  value,
  devices,
  fallback,
  emptyHint,
  onChange,
}: {
  label: string;
  value: string;
  devices: MediaDeviceInfo[];
  fallback: string;
  emptyHint?: string;
  onChange: (deviceId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = devices.find((item) => item.deviceId === value);
  const currentIndex = devices.findIndex((item) => item.deviceId === value);
  const title = value
    ? deviceLabel(
        current,
        fallback,
        currentIndex >= 0 ? currentIndex : undefined,
      )
    : "Padrão do sistema";

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <DeviceField>
      <FieldLabel>{label}</FieldLabel>
      <DeviceWrap ref={wrapRef}>
        <DeviceButton
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          <DeviceName>{title}</DeviceName>
          <DeviceChevron>
            <ChevronIcon />
          </DeviceChevron>
        </DeviceButton>
        {open ? (
          <DeviceMenu role="listbox">
            <DeviceOption
              type="button"
              $active={!value}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Padrão do sistema
            </DeviceOption>
            {devices.map((device, index) => (
              <DeviceOption
                key={device.deviceId}
                type="button"
                $active={device.deviceId === value}
                onClick={() => {
                  onChange(device.deviceId);
                  setOpen(false);
                }}
              >
                {deviceLabel(device, fallback, index)}
              </DeviceOption>
            ))}
            {devices.length === 0 && emptyHint ? (
              <DeviceOption type="button" disabled>
                {emptyHint}
              </DeviceOption>
            ) : null}
          </DeviceMenu>
        ) : null}
      </DeviceWrap>
    </DeviceField>
  );
}

export function SettingsScreen({
  identity,
  onBack,
  onLogout,
  onNicknameChange,
  deafened,
  onOutputVolume,
}: SettingsScreenProps) {
  const [tab, setTab] = useState<SettingsTab>("audio");
  const [copied, setCopied] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [editingNick, setEditingNick] = useState(false);
  const [savingNick, setSavingNick] = useState(false);
  const [nickError, setNickError] = useState("");
  const [nickDraft, setNickDraft] = useState(identity.nickname);
  const nickEditRef = useRef<HTMLFormElement>(null);
  const [settings, setSettings] = useState(loadAudioSettings);
  const [devices, setDevices] = useState<DeviceLists>({
    inputs: [],
    outputs: [],
  });
  const [level, setLevel] = useState(0);
  const [listening, setListening] = useState(false);
  const [pttHeld, setPttHeld] = useState(false);
  const [capturing, setCapturing] = useState<CaptureTarget>(null);
  const [error, setError] = useState("");
  const settingsRef = useRef(settings);
  const listenRef = useRef(false);
  const pttHeldRef = useRef(false);
  const capturingRef = useRef<CaptureTarget>(null);
  const deafenedRef = useRef(deafened);
  const gainRef = useRef<GainNode | null>(null);
  const outGainRef = useRef<GainNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  settingsRef.current = settings;
  listenRef.current = listening;
  capturingRef.current = capturing;
  deafenedRef.current = deafened;

  function commit(patch: Partial<AudioSettings>) {
    const next = saveAudioSettings({ ...settingsRef.current, ...patch });
    settingsRef.current = next;
    setSettings(next);
  }

  function cancelNickEdit() {
    setNickDraft(identity.nickname);
    setNickError("");
    setEditingNick(false);
  }

  async function handleSaveNick(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nickname = nickDraft.trim();
    if (!nickname || savingNick) return;

    setSavingNick(true);
    setNickError("");
    try {
      const next = await persistNickname(nickname);
      if (next) onNicknameChange(next);
      setEditingNick(false);
    } catch (reason: unknown) {
      setNickError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível alterar o nickname.",
      );
    } finally {
      setSavingNick(false);
    }
  }

  useEffect(() => {
    if (!editingNick) return;

    function handlePointer(event: MouseEvent) {
      if (!nickEditRef.current?.contains(event.target as Node)) {
        cancelNickEdit();
      }
    }

    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [editingNick, identity.nickname]);

  useEffect(() => subscribeAudioSettings(setSettings), []);

  async function refreshDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const list = await navigator.mediaDevices.enumerateDevices();
    setDevices({
      inputs: uniqueDevices(list.filter((item) => item.kind === "audioinput")),
      outputs: uniqueDevices(
        list.filter((item) => item.kind === "audiooutput"),
      ),
    });
  }

  async function requestMic() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      await refreshDevices();
    } catch {
      setError("O microfone está bloqueado. Libere o acesso e tente de novo.");
    }
  }

  useEffect(() => {
    void refreshDevices();
    const media = navigator.mediaDevices;
    if (!media?.addEventListener) return;
    media.addEventListener("devicechange", refreshDevices);
    return () => media.removeEventListener("devicechange", refreshDevices);
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) return;

    let cancelled = false;
    let context: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let frame = 0;

    async function start() {
      const current = settingsRef.current;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: current.inputDeviceId
              ? { exact: current.inputDeviceId }
              : undefined,
            echoCancellation: current.echoCancellation && !listenRef.current,
            noiseSuppression: current.noiseSuppression,
            autoGainControl: current.autoGainControl,
          },
        });
        streamRef.current = stream;
      } catch {
        if (cancelled) return;
        setError(
          "Não deu para abrir este microfone. Tente o padrão do sistema.",
        );
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      setError("");
      context = new AudioContext();
      const ctx = context;
      if (current.outputDeviceId) {
        try {
          await setAudioSink(ctx, current.outputDeviceId);
        } catch {
          /* saída fica no padrão */
        }
      }

      const source = ctx.createMediaStreamSource(stream);
      const gain = context.createGain();
      const analyser = context.createAnalyser();
      const output = context.createGain();
      analyser.fftSize = 512;
      gain.gain.value = dbToLinear(current.inputGainDb);
      output.gain.value = 0;
      source.connect(gain);
      gain.connect(analyser);
      gain.connect(output);
      output.connect(context.destination);
      gainRef.current = gain;
      outGainRef.current = output;

      const samples = new Float32Array(analyser.fftSize);
      let displayed = 0;
      let aboveFrames = 0;
      let hangUntil = 0;
      const tick = () => {
        if (!listenRef.current) {
          if (displayed !== 0) {
            displayed = 0;
            aboveFrames = 0;
            hangUntil = 0;
            setLevel(0);
          }
          output.gain.setTargetAtTime(0, ctx.currentTime, 0.012);
          frame = window.requestAnimationFrame(tick);
          return;
        }

        analyser.getFloatTimeDomainData(samples);
        const instant = rmsToMeter(analyserRms(samples));
        displayed = displayed * 0.72 + instant * 0.28;
        setLevel(displayed);

        const audio = settingsRef.current;
        const cut = vadThreshold(audio.vadSensitivity);
        let open = false;
        if (audio.inputMode === "vad") {
          if (displayed >= cut && displayed > 0) {
            aboveFrames += 1;
            if (aboveFrames >= 4) {
              open = true;
              hangUntil = performance.now() + 160;
            }
          } else {
            aboveFrames = 0;
            open = performance.now() < hangUntil;
          }
        } else {
          open = pttHeldRef.current && Boolean(audio.ptt);
        }

        const live =
          listenRef.current && open && !deafenedRef.current
            ? audio.outputVolume / 100
            : 0;
        output.gain.setTargetAtTime(live, ctx.currentTime, 0.012);
        frame = window.requestAnimationFrame(tick);
      };
      tick();
      await refreshDevices();
    }

    void start();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      gainRef.current = null;
      outGainRef.current = null;
      streamRef.current = null;
      stream?.getTracks().forEach((track) => track.stop());
      void context?.close();
    };
  }, [
    settings.inputDeviceId,
    settings.echoCancellation,
    settings.noiseSuppression,
    settings.autoGainControl,
    settings.outputDeviceId,
  ]);

  useEffect(() => {
    if (gainRef.current)
      gainRef.current.gain.value = dbToLinear(settings.inputGainDb);
  }, [settings.inputGainDb]);

  useEffect(() => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (!track) return;
    void track.applyConstraints({
      echoCancellation: settings.echoCancellation && !listening,
    });
  }, [listening, settings.echoCancellation]);

  useEffect(() => {
    if (!capturing) return;

    function handleKey(event: KeyboardEvent) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.key === "Escape") {
        setCapturing(null);
        return;
      }
      if (event.key === "Backspace" || event.key === "Delete") {
        commit({ [capturing === "ptt" ? "ptt" : "muteToggle"]: null });
        setCapturing(null);
        return;
      }

      applyBind(keybindFromEvent(event));
    }

    function applyBind(bind: ReturnType<typeof keybindFromEvent>) {
      if (!bind) return;
      const next: Partial<AudioSettings> =
        capturing === "ptt" ? { ptt: bind } : { muteToggle: bind };
      if (
        capturing === "ptt" &&
        sameKeybind(bind, settingsRef.current.muteToggle)
      )
        next.muteToggle = null;
      if (
        capturing === "muteToggle" &&
        sameKeybind(bind, settingsRef.current.ptt)
      )
        next.ptt = null;
      commit(next);
      setCapturing(null);
    }

    function handleMouse(event: MouseEvent) {
      event.preventDefault();
      event.stopImmediatePropagation();
      applyBind(mouseBindFromEvent(event));
    }

    function handleMenu(event: MouseEvent) {
      event.preventDefault();
    }

    window.addEventListener("keydown", handleKey, true);
    window.addEventListener("mousedown", handleMouse, true);
    window.addEventListener("contextmenu", handleMenu, true);
    return () => {
      window.removeEventListener("keydown", handleKey, true);
      window.removeEventListener("mousedown", handleMouse, true);
      window.removeEventListener("contextmenu", handleMenu, true);
    };
  }, [capturing]);

  useEffect(() => {
    function holdPtt(held: boolean) {
      pttHeldRef.current = held;
      setPttHeld(held);
    }

    function handleDown(event: KeyboardEvent) {
      if (capturingRef.current || event.repeat) return;
      const bind = settingsRef.current.ptt;
      if (!bind || !matchKeybind(event, bind)) return;
      event.preventDefault();
      holdPtt(true);
    }

    function handleUp(event: KeyboardEvent) {
      const bind = settingsRef.current.ptt;
      if (!bind || isMouseBind(bind) || event.code !== bind.code) return;
      holdPtt(false);
    }

    function handleMouseDown(event: MouseEvent) {
      if (capturingRef.current) return;
      const bind = settingsRef.current.ptt;
      if (!bind || !matchMouseBind(event, bind)) return;
      holdPtt(true);
    }

    function handleMouseUp(event: MouseEvent) {
      const bind = settingsRef.current.ptt;
      if (!bind || !isMouseBind(bind) || event.button !== (bind.button ?? -1))
        return;
      holdPtt(false);
    }

    function handleBlur() {
      holdPtt(false);
    }

    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  async function playOutputTest() {
    const context = new AudioContext();
    try {
      if (settings.outputDeviceId) {
        await setAudioSink(context, settings.outputDeviceId);
      }
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 440;
      gain.gain.value = (deafened ? 0 : settings.outputVolume / 100) * 0.12;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.28);
      oscillator.onended = () => void context.close();
    } catch {
      void context.close();
    }
  }

  function setMode(inputMode: InputMode) {
    commit({ inputMode });
  }

  function setGain(next: number) {
    commit({ inputGainDb: clampInputGain(next) });
  }

  function bindLabel(bind: Keybind | null, listeningBind: boolean): string {
    if (listeningBind) return "Tecla ou clique…";
    return bind?.label ?? "Definir";
  }

  const threshold = vadThreshold(settings.vadSensitivity);
  const hasDeviceNames = devices.inputs.some((item) => item.label);

  return (
    <Panel>
      <BackRow>
        <BackButton type="button" onClick={onBack}>
          <BackIcon />
          <span>Voltar</span>
        </BackButton>
      </BackRow>
      <Body>
        <Heading>Configurações</Heading>
        <Tabs>
          <Tab
            type="button"
            $active={tab === "audio"}
            onClick={() => {
              setTab("audio");
              setConfirmLogout(false);
              setEditingNick(false);
            }}
          >
            Áudio
          </Tab>
          <Tab
            type="button"
            $active={tab === "account"}
            onClick={() => {
              setTab("account");
              setListening(false);
              setCapturing(null);
              setCopied(false);
              setEditingNick(false);
              setNickDraft(identity.nickname);
            }}
          >
            Conta
          </Tab>
        </Tabs>
        <Lead>
          {tab === "audio"
            ? "Áudio - válido em todos os servidores."
            : "Identidade da conta"}
        </Lead>

        {tab === "account" ? (
          <>
            <Section>
              <SectionTitle>Nickname</SectionTitle>
              <Field>
                <FieldLabel>Como você aparece</FieldLabel>
                {editingNick ? (
                  <NameEdit
                    ref={nickEditRef}
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                      void handleSaveNick(event);
                    }}
                  >
                    <NameInput
                      autoFocus
                      maxLength={NICKNAME_MAX_LENGTH}
                      value={nickDraft}
                      onChange={(event) => setNickDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") cancelNickEdit();
                      }}
                    />
                    <NameIcon
                      type="submit"
                      title="Salvar"
                      disabled={!nickDraft.trim() || savingNick}
                    >
                      <CheckIcon />
                    </NameIcon>
                    <NameIcon
                      type="button"
                      title="Cancelar"
                      onClick={cancelNickEdit}
                    >
                      <CloseIcon />
                    </NameIcon>
                  </NameEdit>
                ) : (
                  <NameButton
                    type="button"
                    title="Alterar nickname"
                    onClick={() => {
                      setNickDraft(identity.nickname);
                      setEditingNick(true);
                    }}
                  >
                    <span>{identity.nickname}</span>
                    <EditIcon />
                  </NameButton>
                )}
              </Field>
              {nickError ? <ErrorText>{nickError}</ErrorText> : null}
            </Section>
            <Section>
              <SectionTitle>Código de recuperação</SectionTitle>
              <CodeBox>
                <RecoveryCode>{identity.recoveryCode}</RecoveryCode>
                <GhostButton
                  type="button"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(identity.recoveryCode)
                      .then(() => {
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1600);
                      });
                  }}
                >
                  <CopyIcon />
                  {copied ? "Copiado!" : "Copiar"}
                </GhostButton>
              </CodeBox>
              <Warn>
                Guarde este código em um lugar seguro. Ele é a única forma de
                recuperar sua identidade. Não o compartilhe com ninguém.
              </Warn>
              <DangerButton
                type="button"
                onClick={() => {
                  if (!confirmLogout) {
                    setConfirmLogout(true);
                    return;
                  }
                  onLogout();
                }}
              >
                {confirmLogout ? "Confirmar saída deste PC" : "Sair deste PC"}
              </DangerButton>
              {confirmLogout ? (
                <Hint style={{ textAlign: "center" }}>
                  Isto apagará seus dados neste computador.
                  <br /> Você conseguirá entrar novamente com o código de
                  recuperação.
                </Hint>
              ) : null}
            </Section>
            <AppVersion>Versão {CLIENT_VERSION}</AppVersion>
          </>
        ) : (
          <>
            <Section>
              <SectionTitle>Entrada e saída</SectionTitle>
              <DeviceSelect
                label="Microfone (entrada)"
                value={settings.inputDeviceId}
                devices={devices.inputs}
                fallback="Microfone"
                emptyHint="Nenhum microfone listado ainda"
                onChange={(inputDeviceId) => commit({ inputDeviceId })}
              />
              <DeviceSelect
                label="Fone / alto-falante (saída)"
                value={settings.outputDeviceId}
                devices={devices.outputs}
                fallback="Saída"
                emptyHint="Nenhuma saída encontrada"
                onChange={(outputDeviceId) => commit({ outputDeviceId })}
              />
              <MeterRow>
                <MeterTrack>
                  <MeterClip>
                    <MeterBar
                      $level={level}
                      $cut={
                        settings.inputMode === "vad"
                          ? threshold
                          : pttHeld
                            ? 0
                            : 1
                      }
                    />
                  </MeterClip>
                  {settings.inputMode === "vad" ? (
                    <MeterMark $pct={threshold * 100} />
                  ) : null}
                </MeterTrack>
                <GhostButton
                  type="button"
                  data-on={listening ? "true" : "false"}
                  onClick={() => setListening((value) => !value)}
                >
                  {listening ? "Parar teste" : "Ouvir mic"}
                </GhostButton>
                <GhostButton
                  type="button"
                  onClick={() => void playOutputTest()}
                >
                  Testar fone
                </GhostButton>
              </MeterRow>
              {!hasDeviceNames ? (
                <>
                  <Hint>Sem nomes dos aparelhos ainda.</Hint>
                  <MeterRow>
                    <GhostButton
                      type="button"
                      onClick={() => void requestMic()}
                    >
                      Liberar microfone
                    </GhostButton>
                  </MeterRow>
                </>
              ) : (
                <Hint>
                  A marca é o corte. Azul fica mudo; verde é o que você ouve no
                  teste.
                </Hint>
              )}
              {error ? <ErrorText>{error}</ErrorText> : null}
            </Section>

            <Section>
              <SectionTitle>Como você fala</SectionTitle>
              <ModeRow>
                <ModeButton
                  type="button"
                  $active={settings.inputMode === "vad"}
                  onClick={() => setMode("vad")}
                >
                  Automático
                </ModeButton>
                <ModeButton
                  type="button"
                  $active={settings.inputMode === "ptt"}
                  onClick={() => setMode("ptt")}
                >
                  Push-to-talk
                </ModeButton>
              </ModeRow>
              {settings.inputMode === "vad" ? (
                <Field>
                  <FieldLabel>Sensibilidade</FieldLabel>
                  <SliderRow>
                    <Slider
                      type="range"
                      min={0}
                      max={100}
                      value={settings.vadSensitivity}
                      onChange={(event) =>
                        commit({ vadSensitivity: Number(event.target.value) })
                      }
                    />
                    <Value>{settings.vadSensitivity}%</Value>
                  </SliderRow>
                  <Hint>
                    Mais alto pega voz mais baixa. Só passa o que cruzar a
                    marca.
                  </Hint>
                </Field>
              ) : (
                <Hint>
                  {settings.ptt
                    ? "Segure a tecla do push-to-talk para abrir o mic. Só vale com o app em foco."
                    : "Defina a tecla do push-to-talk. Sem ela o mic fica fechado."}
                </Hint>
              )}
              <BindRow>
                <BindLabel>Tecla do push-to-talk</BindLabel>
                <BindActions>
                  {settings.ptt ? (
                    <ClearBind
                      type="button"
                      onClick={() => commit({ ptt: null })}
                    >
                      Limpar
                    </ClearBind>
                  ) : null}
                  <BindButton
                    type="button"
                    $listening={capturing === "ptt"}
                    onClick={() =>
                      setCapturing((value) => (value === "ptt" ? null : "ptt"))
                    }
                  >
                    {bindLabel(settings.ptt, capturing === "ptt")}
                  </BindButton>
                </BindActions>
              </BindRow>
              <BindRow>
                <BindLabel>Atalho para mutar mic e fone</BindLabel>
                <BindActions>
                  {settings.muteToggle ? (
                    <ClearBind
                      type="button"
                      onClick={() => commit({ muteToggle: null })}
                    >
                      Limpar
                    </ClearBind>
                  ) : null}
                  <BindButton
                    type="button"
                    $listening={capturing === "muteToggle"}
                    onClick={() =>
                      setCapturing((value) =>
                        value === "muteToggle" ? null : "muteToggle",
                      )
                    }
                  >
                    {bindLabel(settings.muteToggle, capturing === "muteToggle")}
                  </BindButton>
                </BindActions>
              </BindRow>
              <Hint>
                Tecla ou botão do mouse. O mesmo atalho não serve para os dois.
                Esc cancela; Delete apaga.
              </Hint>
            </Section>

            <Section>
              <SectionTitle>Ganho</SectionTitle>
              <Field>
                <FieldLabel>Entrada</FieldLabel>
                <SliderRow>
                  <StepButton
                    type="button"
                    onClick={() => setGain(settings.inputGainDb - 1)}
                  >
                    −
                  </StepButton>
                  <Slider
                    type="range"
                    min={INPUT_GAIN_MIN}
                    max={INPUT_GAIN_MAX}
                    value={settings.inputGainDb}
                    onChange={(event) => setGain(Number(event.target.value))}
                  />
                  <StepButton
                    type="button"
                    onClick={() => setGain(settings.inputGainDb + 1)}
                  >
                    +
                  </StepButton>
                  <Value>{formatGain(settings.inputGainDb)}</Value>
                </SliderRow>
              </Field>
              <Field>
                <FieldLabel>Saída - Volume geral</FieldLabel>
                <SliderRow>
                  <Slider
                    type="range"
                    min={0}
                    max={100}
                    value={deafened ? 0 : settings.outputVolume}
                    onChange={(event) =>
                      onOutputVolume(Number(event.target.value))
                    }
                  />
                  <Value>{deafened ? 0 : settings.outputVolume}%</Value>
                </SliderRow>
              </Field>
            </Section>

            <Section>
              <SectionTitle>Processamento</SectionTitle>
              <ToggleRow>
                <ToggleCopy>
                  <ToggleTitle>Cancelar eco</ToggleTitle>
                  <ToggleHint>
                    Útil com alto-falante. No teste do mic desliga sozinho,
                    senão come a própria voz.
                  </ToggleHint>
                </ToggleCopy>
                <Switch
                  type="button"
                  role="switch"
                  aria-checked={settings.echoCancellation}
                  $on={settings.echoCancellation}
                  onClick={() =>
                    commit({ echoCancellation: !settings.echoCancellation })
                  }
                />
              </ToggleRow>
              <ToggleRow>
                <ToggleCopy>
                  <ToggleTitle>Tirar ruído</ToggleTitle>
                  <ToggleHint>
                    Corta ventilador e teclado no que der.
                  </ToggleHint>
                </ToggleCopy>
                <Switch
                  type="button"
                  role="switch"
                  aria-checked={settings.noiseSuppression}
                  $on={settings.noiseSuppression}
                  onClick={() =>
                    commit({ noiseSuppression: !settings.noiseSuppression })
                  }
                />
              </ToggleRow>
              <ToggleRow>
                <ToggleCopy>
                  <ToggleTitle>Ganho automático do sistema</ToggleTitle>
                  <ToggleHint>
                    Se ligar, o ganho da seção acima vira só um extra.
                  </ToggleHint>
                </ToggleCopy>
                <Switch
                  type="button"
                  role="switch"
                  aria-checked={settings.autoGainControl}
                  $on={settings.autoGainControl}
                  onClick={() =>
                    commit({ autoGainControl: !settings.autoGainControl })
                  }
                />
              </ToggleRow>
            </Section>
          </>
        )}
      </Body>
    </Panel>
  );
}
