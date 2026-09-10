import { useEffect, useRef, useState } from "react";
import {
  getRoom,
  type RoomChannel,
  type RoomRole,
} from "../../api";
import {
  isEditableTarget,
  loadAudioSettings,
  matchKeybind,
  matchMouseBind,
  saveOutputVolume,
  subscribeAudioSettings,
} from "../../audio-settings";
import { loadBookmarks, saveBookmark } from "../../bookmarks";
import { connectActivity } from "../../activity";
import { connectChat } from "../../chat";
import type { Identity } from "../../identity";
import {
  connectOccupancy,
  sendOccupancy,
  subscribeOccupancy,
  type Occupant,
} from "../../occupancy";
import {
  loadStatus,
  saveStatus,
  seatStatusId,
  type StatusId,
} from "../../presence";
import {
  connectContactPresence,
  sendContactPresence,
} from "../../contacts-presence";
import { connectAvatarSignal } from "../../avatar-signal";
import { startAvatarTransfer } from "../../avatar-transfer";
import {
  connectRealtime,
  subscribeRealtime,
  subscribeRealtimeOpen,
} from "../../realtime";
import { connectRtc } from "../../rtc";
import {
  setRtcMedia,
  startRtcSignaling,
  syncRtcSignaling,
} from "../../rtc-session";
import {
  playConnectSound,
  playDisconnectSound,
  playMuteSound,
  playUnmuteSound,
} from "../../sounds";
import { useTalking } from "../../use-talking";
import { SettingsScreen } from "../settings";
import { WorkspaceChat } from "./components/chat";
import { WorkspaceDetails } from "./components/details";
import { WorkspaceFooter } from "./components/footer";
import { WorkspaceHeader } from "./components/header";
import {
  CHANNEL_CAP,
  loadSidebarWidth,
  WorkspaceSidebar,
} from "./components/sidebar";
import { Body, Frame, Main, Stage } from "./style";

type VoiceCall = {
  roomId: string;
  salaId: string;
};

type WorkspaceScreenProps = {
  roomId: string;
  identity: Identity;
  onBack: () => void;
  onNicknameChange: (identity: Identity) => void;
  onLogout: () => void;
  onSwitchServer: (roomId: string) => void;
};

function findBookmark(roomId: string) {
  return loadBookmarks().find((item) => item.roomId === roomId) ?? null;
}

function upsertOccupant(occupants: Occupant[], occupant: Occupant): Occupant[] {
  const index = occupants.findIndex((item) => item.uid === occupant.uid);
  if (index < 0) return [...occupants, occupant];
  const next = occupants.slice();
  next[index] = occupant;
  return next;
}

function salaIsFull(occupants: Occupant[], channelId: string, uid: string) {
  return (
    occupants.filter(
      (item) => item.channelId === channelId && item.uid !== uid,
    ).length >= CHANNEL_CAP
  );
}

export function WorkspaceScreen({
  roomId,
  identity,
  onBack,
  onNicknameChange,
  onLogout,
  onSwitchServer,
}: WorkspaceScreenProps) {
  const known = findBookmark(roomId);
  const [name, setName] = useState(known?.name ?? "Servidor");
  const [code, setCode] = useState(known?.code ?? "");
  const [role, setRole] = useState<RoomRole | undefined>(known?.role);
  const [channels, setChannels] = useState<RoomChannel[]>([]);
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [call, setCall] = useState<VoiceCall | null>(null);
  const [sideWidth, setSideWidth] = useState(loadSidebarWidth);
  const [showSettings, setShowSettings] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [status, setStatus] = useState(loadStatus);
  const [outputVolume, setOutputVolume] = useState(
    () => loadAudioSettings().outputVolume,
  );
  const talking = useTalking(Boolean(call) && !muted && !deafened);
  const silencedRef = useRef<boolean | null>(null);
  const callRef = useRef<VoiceCall | null>(null);
  const seatedRef = useRef(false);
  const skipPresenceSendRef = useRef(false);
  const mutedRef = useRef(muted);
  const deafenedRef = useRef(deafened);
  const statusRef = useRef(status);
  callRef.current = call;
  mutedRef.current = muted;
  deafenedRef.current = deafened;
  statusRef.current = status;

  function followOwnSeat(nextRoomId: string, salaId: string) {
    setCall((prev) => {
      if (prev?.roomId === nextRoomId && prev?.salaId === salaId) return prev;
      skipPresenceSendRef.current = true;
      return { roomId: nextRoomId, salaId };
    });
  }

  function followOwnLeave(nextRoomId: string, salaId: string) {
    setCall((prev) => {
      if (prev?.roomId !== nextRoomId || prev?.salaId !== salaId) return prev;
      skipPresenceSendRef.current = true;
      if (!deafenedRef.current) playDisconnectSound();
      return null;
    });
  }

  useEffect(() => {
    window.history.pushState({ workspace: roomId }, "");
    function handlePop() {
      onBack();
    }
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [onBack, roomId]);

  useEffect(() => {
    const stopData = connectRealtime(identity.uid);
    const stopOccupancy = connectOccupancy();
    const stopContacts = connectContactPresence();
    const stopAvatarSignal = connectAvatarSignal(identity.uid);
    const stopAvatarTransfer = startAvatarTransfer();
    const stopChat = connectChat();
    const stopActivity = connectActivity();
    const stopRtc = connectRtc();
    const stopSignal = startRtcSignaling(identity.uid, () => callRef.current);
    return () => {
      stopSignal();
      stopRtc();
      stopActivity();
      stopChat();
      stopAvatarTransfer();
      stopAvatarSignal();
      stopContacts();
      stopOccupancy();
      stopData();
    };
  }, [identity.uid]);

  useEffect(() => {
    const bookmark = findBookmark(roomId);
    if (bookmark) {
      setName(bookmark.name);
      setCode(bookmark.code);
      setRole(bookmark.role);
    }

    let cancelled = false;
    setChannels([]);
    setOccupants([]);

    void getRoom({ roomId, uid: identity.uid })
      .then((room) => {
        if (cancelled) return;
        setName(room.name);
        setCode(room.code);
        setRole(room.role);
        setChannels(room.channels);
        saveBookmark({
          roomId: room.id,
          name: room.name,
          code: room.code,
          role: room.role,
        });
      })
      .catch(() => {
        /* bookmark local basta para o header */
      });

    sendOccupancy({ type: "presence.sync", roomId });

    return () => {
      cancelled = true;
    };
  }, [identity.uid, roomId]);

  useEffect(() => {
    if (call) {
      seatedRef.current = true;
      if (skipPresenceSendRef.current) {
        skipPresenceSendRef.current = false;
        return;
      }
      sendOccupancy({
        type: "presence.join",
        roomId: call.roomId,
        channelId: call.salaId,
      });
      return;
    }
    if (!seatedRef.current) return;
    seatedRef.current = false;
    if (skipPresenceSendRef.current) {
      skipPresenceSendRef.current = false;
      return;
    }
    sendOccupancy({ type: "presence.leave" });
  }, [call]);

  useEffect(() => {
    syncRtcSignaling();
  }, [call]);

  // Mesmo padrão da RoomScreen (home backup): assentos → mesh enquanto há sala ativa.
  useEffect(() => {
    if (!call || call.roomId !== roomId) return;
    syncRtcSignaling(occupants);
  }, [occupants, call, roomId]);

  useEffect(() => {
    setRtcMedia({
      send:
        Boolean(call) &&
        !muted &&
        !deafened &&
        (loadAudioSettings().inputMode !== "ptt" || talking),
      listen: Boolean(call) && !deafened,
      volume: outputVolume,
    });
  }, [call, muted, deafened, talking, outputVolume]);

  useEffect(() => {
    if (!call) return;
    sendOccupancy({
      type: "presence.media",
      muted,
      deafened,
    });
  }, [call, muted, deafened]);

  useEffect(() => {
    sendContactPresence({ type: "contacts.status", status });
  }, [status]);

  useEffect(() => {
    if (!call) return;
    sendOccupancy({
      type: "presence.status",
      status: seatStatusId(status),
    });
  }, [call, status]);

  useEffect(() => {
    return subscribeRealtimeOpen(() => {
      sendOccupancy({ type: "presence.sync", roomId });
      const current = callRef.current;
      if (!current) return;
      sendOccupancy({
        type: "presence.join",
        roomId: current.roomId,
        channelId: current.salaId,
      });
      sendOccupancy({
        type: "presence.media",
        muted: mutedRef.current,
        deafened: deafenedRef.current,
      });
      sendOccupancy({
        type: "presence.status",
        status: seatStatusId(statusRef.current),
      });
      sendContactPresence({
        type: "contacts.status",
        status: statusRef.current,
      });
    });
  }, [roomId]);

  useEffect(() => {
    return subscribeRealtime((event) => {
      if (event.type === "user.nickname") {
        setOccupants((prev) =>
          prev.map((item) =>
            item.uid === event.uid ? { ...item, nickname: event.nickname } : item,
          ),
        );
        if (event.uid === identity.uid && event.nickname !== identity.nickname) {
          onNicknameChange({ ...identity, nickname: event.nickname });
        }
        return;
      }

      if (!("roomId" in event) || event.roomId !== roomId) return;

      if (event.type === "room.renamed") {
        setName(event.name);
        const bookmark = findBookmark(roomId);
        if (bookmark) saveBookmark({ ...bookmark, name: event.name });
        return;
      }

      if (event.type === "member.joined") {
        return;
      }

      if (
        event.type === "member.left" ||
        event.type === "member.kicked" ||
        event.type === "member.blocked"
      ) {
        setOccupants((prev) => prev.filter((item) => item.uid !== event.uid));
        return;
      }

      if (event.type === "member.unblocked") {
        return;
      }

      if (event.type === "member.role") {
        if (event.uid === identity.uid) setRole(event.role);
        setOccupants((prev) =>
          prev.map((item) =>
            item.uid === event.uid ? { ...item, role: event.role } : item,
          ),
        );
        return;
      }

      if (event.type === "channel.created") {
        setChannels((prev) => {
          if (prev.some((item) => item.id === event.id)) return prev;
          return [
            ...prev,
            {
              id: event.id,
              name: event.name,
              description: event.description,
            },
          ];
        });
        return;
      }

      if (event.type === "channel.updated") {
        setChannels((prev) =>
          prev.map((item) =>
            item.id === event.id
              ? {
                  ...item,
                  name: event.name,
                  description: event.description,
                }
              : item,
          ),
        );
        return;
      }

      if (event.type === "channel.deleted") {
        setChannels((prev) => prev.filter((item) => item.id !== event.channelId));
        setOccupants((prev) =>
          prev.filter((item) => item.channelId !== event.channelId),
        );
        followOwnLeave(event.roomId, event.channelId);
      }
    });
  }, [identity, onNicknameChange, roomId]);

  // Mesmo padrão do home backup: assento próprio separado da árvore.
  useEffect(() => {
    return subscribeOccupancy((event) => {
      if (event.type === "presence.joined" && event.uid === identity.uid) {
        followOwnSeat(event.roomId, event.channelId);
        return;
      }
      if (event.type === "presence.left" && event.uid === identity.uid) {
        followOwnLeave(event.roomId, event.channelId);
        return;
      }
      if (event.type === "presence.full") {
        followOwnLeave(event.roomId, event.channelId);
        return;
      }
      if (event.type === "presence.outdated") {
        followOwnLeave(event.roomId, event.channelId);
        return;
      }
      if (event.type === "presence.state") {
        if (callRef.current) return;
        if (event.roomId !== roomId) return;
        const seat = event.occupants.find((item) => item.uid === identity.uid);
        if (seat) followOwnSeat(event.roomId, seat.channelId);
      }
    });
  }, [identity.uid, roomId]);

  // Mesmo padrão da room: só atualiza a listagem de ocupantes.
  useEffect(() => {
    return subscribeOccupancy((event) => {
      if (!("roomId" in event) || event.roomId !== roomId) return;

      if (event.type === "presence.state") {
        setOccupants(event.occupants);
        return;
      }

      if (event.type === "presence.joined") {
        setOccupants((prev) =>
          upsertOccupant(prev, {
            uid: event.uid,
            nickname: event.nickname,
            role: event.role,
            channelId: event.channelId,
            joinedAt: event.joinedAt,
            muted: event.muted,
            deafened: event.deafened,
            status: event.status,
          }),
        );
        return;
      }

      if (event.type === "presence.left") {
        setOccupants((prev) => prev.filter((item) => item.uid !== event.uid));
        return;
      }

      if (event.type === "presence.media") {
        setOccupants((prev) =>
          prev.map((item) =>
            item.uid === event.uid
              ? { ...item, muted: event.muted, deafened: event.deafened }
              : item,
          ),
        );
        return;
      }

      if (event.type === "presence.status") {
        setOccupants((prev) =>
          prev.map((item) =>
            item.uid === event.uid ? { ...item, status: event.status } : item,
          ),
        );
      }
    });
  }, [identity.uid, roomId]);

  useEffect(() => {
    return () => {
      if (seatedRef.current) {
        seatedRef.current = false;
        sendOccupancy({ type: "presence.leave" });
      }
    };
  }, []);

  useEffect(
    () =>
      subscribeAudioSettings((settings) =>
        setOutputVolume(settings.outputVolume),
      ),
    [],
  );

  function muteOutput() {
    setDeafened(true);
    setMuted(true);
  }

  function unmuteOutput() {
    setDeafened(false);
    setMuted(false);
  }

  function handleOutputVolume(value: number) {
    if (value <= 0) {
      muteOutput();
      return;
    }
    setOutputVolume(saveOutputVolume(value));
    if (deafened) unmuteOutput();
  }

  useEffect(() => {
    const silenced = muted || deafened;
    if (silencedRef.current === null) {
      silencedRef.current = silenced;
      return;
    }
    if (silencedRef.current === silenced) return;
    silencedRef.current = silenced;
    if (silenced) playMuteSound();
    else playUnmuteSound();
  }, [muted, deafened]);

  useEffect(() => {
    function toggleMute() {
      const next = !(muted || deafened);
      if (next) muteOutput();
      else unmuteOutput();
    }

    function handleMuteHotkey(event: KeyboardEvent) {
      if (event.repeat || isEditableTarget(event.target)) return;
      const bind = loadAudioSettings().muteToggle;
      if (!bind || !matchKeybind(event, bind)) return;
      event.preventDefault();
      toggleMute();
    }

    function handleMuteMouse(event: MouseEvent) {
      if (isEditableTarget(event.target)) return;
      const bind = loadAudioSettings().muteToggle;
      if (!bind || !matchMouseBind(event, bind)) return;
      toggleMute();
    }

    window.addEventListener("keydown", handleMuteHotkey);
    window.addEventListener("mousedown", handleMuteMouse);
    return () => {
      window.removeEventListener("keydown", handleMuteHotkey);
      window.removeEventListener("mousedown", handleMuteMouse);
    };
  }, [muted, deafened]);

  function handleStatus(next: StatusId) {
    setStatus(next);
    saveStatus(next);
  }

  function handleEnterSala(channelId: string) {
    if (call?.salaId === channelId) return;
    if (salaIsFull(occupants, channelId, identity.uid)) return;
    setCall({ roomId, salaId: channelId });
    if (!deafened) playConnectSound();
  }

  const activeSalaId = call?.roomId === roomId ? call.salaId : null;
  const activeSalaName =
    channels.find((item) => item.id === activeSalaId)?.name ?? null;

  if (showSettings) {
    return (
      <SettingsScreen
        identity={identity}
        onBack={() => setShowSettings(false)}
        onLogout={onLogout}
        onNicknameChange={onNicknameChange}
        deafened={deafened}
        onOutputVolume={handleOutputVolume}
      />
    );
  }

  return (
    <Frame>
      <WorkspaceHeader
        name={name}
        code={code}
        sideWidth={sideWidth}
        onBack={onBack}
        onOpenSettings={() => setShowSettings(true)}
      />
      <Body>
        <WorkspaceSidebar
          roomId={roomId}
          name={name}
          code={code}
          role={role}
          identity={identity}
          channels={channels}
          occupants={occupants}
          activeSalaId={activeSalaId}
          callRoomId={call?.roomId ?? null}
          status={status}
          muted={muted}
          deafened={deafened}
          talking={talking}
          width={sideWidth}
          onWidthChange={setSideWidth}
          onChannelsChange={setChannels}
          onEnterSala={handleEnterSala}
          onSwitchServer={onSwitchServer}
        />
        <Main>
          <Stage aria-label="Área principal" />
          <WorkspaceChat
            roomId={roomId}
            channelId={activeSalaId}
            channelName={activeSalaName}
            identity={identity}
            deafened={deafened}
          />
        </Main>
        <WorkspaceDetails selfUid={identity.uid} />
      </Body>
      <WorkspaceFooter
        nickname={identity.nickname}
        role={role}
        muted={muted}
        deafened={deafened}
        outputVolume={outputVolume}
        status={status}
        onToggleMute={() => setMuted((value) => !value)}
        onToggleDeafen={() => {
          if (deafened) unmuteOutput();
          else muteOutput();
        }}
        onOutputVolume={handleOutputVolume}
        onStatusChange={handleStatus}
      />
    </Frame>
  );
}
