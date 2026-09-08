import { useEffect, useRef, useState } from "react";
import {
  analyserRms,
  dbToLinear,
  isEditableTarget,
  isMouseBind,
  loadAudioSettings,
  matchKeybind,
  matchMouseBind,
  rmsToMeter,
  subscribeAudioSettings,
  vadThreshold,
  type AudioSettings,
} from "./audio-settings";

export function useTalking(live: boolean): boolean {
  const [talking, setTalking] = useState(false);
  const [audio, setAudio] = useState(loadAudioSettings);
  const audioRef = useRef(audio);
  const pttHeldRef = useRef(false);
  audioRef.current = audio;

  useEffect(() => subscribeAudioSettings(setAudio), []);

  useEffect(() => {
    function holdPtt(held: boolean) {
      pttHeldRef.current = held;
    }

    function handleDown(event: KeyboardEvent) {
      if (event.repeat || isEditableTarget(event.target)) return;
      const bind = audioRef.current.ptt;
      if (!bind || !matchKeybind(event, bind)) return;
      event.preventDefault();
      holdPtt(true);
    }

    function handleUp(event: KeyboardEvent) {
      const bind = audioRef.current.ptt;
      if (!bind || isMouseBind(bind) || event.code !== bind.code) return;
      holdPtt(false);
    }

    function handleMouseDown(event: MouseEvent) {
      if (isEditableTarget(event.target)) return;
      const bind = audioRef.current.ptt;
      if (!bind || !matchMouseBind(event, bind)) return;
      holdPtt(true);
    }

    function handleMouseUp(event: MouseEvent) {
      const bind = audioRef.current.ptt;
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

  useEffect(() => {
    if (!live) {
      setTalking(false);
      return;
    }

    let cancelled = false;
    let context: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let frame = 0;
    let gain: GainNode | null = null;

    async function openMic(settings: AudioSettings) {
      const constraints: MediaTrackConstraints = {
        echoCancellation: settings.echoCancellation,
        noiseSuppression: settings.noiseSuppression,
        autoGainControl: settings.autoGainControl,
      };
      if (settings.inputDeviceId) {
        try {
          return await navigator.mediaDevices.getUserMedia({
            audio: { ...constraints, deviceId: { exact: settings.inputDeviceId } },
          });
        } catch {
          /* cai no padrão */
        }
      }
      return navigator.mediaDevices.getUserMedia({ audio: constraints });
    }

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) return;
      try {
        stream = await openMic(audioRef.current);
      } catch {
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      gain = context.createGain();
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      gain.gain.value = dbToLinear(audioRef.current.inputGainDb);
      source.connect(gain);
      gain.connect(analyser);

      const samples = new Float32Array(analyser.fftSize);
      let displayed = 0;
      let aboveFrames = 0;
      let hangUntil = 0;
      let last = false;

      const tick = () => {
        if (cancelled) return;
        const settings = audioRef.current;
        if (gain) gain.gain.value = dbToLinear(settings.inputGainDb);

        analyser.getFloatTimeDomainData(samples);
        const instant = rmsToMeter(analyserRms(samples));
        displayed = displayed * 0.72 + instant * 0.28;
        const cut = vadThreshold(settings.vadSensitivity);

        let voice = false;
        if (settings.inputMode === "vad") {
          if (displayed >= cut && displayed > 0) {
            aboveFrames += 1;
            if (aboveFrames >= 4) {
              voice = true;
              hangUntil = performance.now() + 160;
            }
          } else {
            aboveFrames = 0;
            voice = performance.now() < hangUntil;
          }
        } else if (pttHeldRef.current && settings.ptt) {
          voice = displayed >= cut && displayed > 0;
        }

        if (voice !== last) {
          last = voice;
          setTalking(voice);
        }
        frame = window.requestAnimationFrame(tick);
      };
      tick();
    }

    void start();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      void context?.close();
      setTalking(false);
    };
  }, [
    live,
    audio.inputDeviceId,
    audio.echoCancellation,
    audio.noiseSuppression,
    audio.autoGainControl,
  ]);

  return talking;
}
