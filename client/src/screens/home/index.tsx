import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  loadBookmarks,
  removeBookmark,
  saveBookmark,
  type Bookmark,
} from "../../bookmarks";
import {
  loadStatus,
  saveStatus,
  STATUSES,
  statusMeta,
  type StatusId,
} from "../../presence";
import {
  NICKNAME_MAX_LENGTH,
  persistNickname,
  saveIdentity,
  type Identity,
} from "../../identity";
import { getRoom, type CreatedRoom } from "../../api";
import { connectRealtime, subscribeRealtime, subscribeRealtimeOpen } from "../../realtime";
import {
  connectOccupancy,
  sendOccupancy,
  subscribeOccupancy,
} from "../../occupancy";
import { connectChat } from "../../chat";
import { connectActivity } from "../../activity";
import { connectRtc } from "../../rtc";
import { startRtcSignaling, syncRtcSignaling } from "../../rtc-session";
import {
  isEditableTarget,
  loadAudioSettings,
  matchKeybind,
  matchMouseBind,
  saveOutputVolume,
  subscribeAudioSettings,
} from "../../audio-settings";
import { playMuteSound, playUnmuteSound } from "../../sounds";
import { useTalking } from "../../use-talking";
import { CreateRoomScreen } from "../create-room";
import { JoinRoomScreen } from "../join-room";
import { RoomScreen } from "../room";
import { ServerSettingsScreen } from "../server-settings";
import { SettingsScreen } from "../settings";
import {
  Actions,
  Brand,
  BrandIcon,
  Empty,
  EmptyArt,
  EmptyText,
  EmptyTitle,
  Header,
  HeaderCopy,
  Main,
  RoomMount,
  NavLabel,
  NickButton,
  NickEdit,
  NickIconButton,
  NickInput,
  NickName,
  PrimaryButton,
  SecondaryButton,
  Shell,
  Sidebar,
  SidebarDock,
  SidebarDash,
  SidebarRule,
  DockRow,
  DockVolume,
  DockSlider,
  DockVolumeValue,
  DockButton,
  SidebarRoom,
  SidebarRoomButton,
  SidebarAddMark,
  SidebarCallMark,
  SidebarRoomName,
  SidebarRooms,
  StatusButton,
  StatusDot,
  StatusLabel,
  StatusMenu,
  StatusOption,
  StatusWrap,
  Subtitle,
  Title,
} from "./style";

type HomeScreenProps = {
  identity: Identity;
  onNicknameChange: (identity: Identity) => void;
  onLogout: () => void;
};

type VoiceCall = {
  roomId: string;
  salaId: string;
};

type View =
  | { type: "home" }
  | { type: "create"; created?: CreatedRoom }
  | { type: "join" }
  | { type: "room"; roomId: string }
  | { type: "server-settings"; roomId: string }
  | { type: "settings" };

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="9"
        y="3"
        width="6"
        height="11"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7 11a5 5 0 0 0 10 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 16v3M9 19h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
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

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 11.5 12 5l8 6.5V20H4v-8.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyRoomsArt() {
  return (
    <svg viewBox="0 0 240 168" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="vpEmptyGlow" cx="50%" cy="46%" r="58%">
          <stop offset="0%" stopColor="#0a84ff" stopOpacity="0.3" />
          <stop offset="52%" stopColor="#0a84ff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0a84ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="vpEmptyDisc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3d3d42" />
          <stop offset="100%" stopColor="#27272a" />
        </linearGradient>
        <linearGradient id="vpEmptyHead" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f2f4f8" />
          <stop offset="100%" stopColor="#c5ccd8" />
        </linearGradient>
        <linearGradient id="vpEmptyBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d5dae4" />
          <stop offset="100%" stopColor="#8e97a8" />
        </linearGradient>
        <clipPath id="vpEmptyClipL">
          <circle cx="62" cy="96" r="34" />
        </clipPath>
        <clipPath id="vpEmptyClipC">
          <circle cx="120" cy="76" r="44" />
        </clipPath>
        <clipPath id="vpEmptyClipR">
          <circle cx="178" cy="96" r="34" />
        </clipPath>
      </defs>

      <ellipse cx="120" cy="92" rx="118" ry="72" fill="url(#vpEmptyGlow)" />
      <ellipse
        cx="120"
        cy="148"
        rx="72"
        ry="8"
        fill="#000"
        opacity="0.22"
      />

      <circle
        cx="120"
        cy="86"
        r="72"
        stroke="#0a84ff"
        strokeOpacity="0.16"
        strokeWidth="1.4"
      />
      <circle
        cx="120"
        cy="86"
        r="90"
        stroke="#0a84ff"
        strokeOpacity="0.07"
        strokeWidth="1.2"
      />

      <path
        d="M20 78c-11 8-11 26 0 34"
        stroke="#0a84ff"
        strokeOpacity="0.45"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M10 70c-14 12-14 38 0 50"
        stroke="#0a84ff"
        strokeOpacity="0.22"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M2 62c-16 16-16 50 0 66"
        stroke="#0a84ff"
        strokeOpacity="0.1"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M220 78c11 8 11 26 0 34"
        stroke="#0a84ff"
        strokeOpacity="0.45"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M230 70c14 12 14 38 0 50"
        stroke="#0a84ff"
        strokeOpacity="0.22"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M238 62c16 16 16 50 0 66"
        stroke="#0a84ff"
        strokeOpacity="0.1"
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      <circle cx="62" cy="96" r="34" fill="url(#vpEmptyDisc)" />
      <g clipPath="url(#vpEmptyClipL)">
        <circle cx="62" cy="86" r="12.4" fill="url(#vpEmptyHead)" />
        <path
          d="M38 132v-20c0-10 10-16 24-16s24 6 24 16v20z"
          fill="url(#vpEmptyBody)"
        />
      </g>
      <path
        d="M50 83.5Q62 71 74 83.5"
        stroke="#e8eaef"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <rect x="47.4" y="80.5" width="5.6" height="10.4" rx="2.6" fill="#d8dce4" />
      <rect x="71" y="80.5" width="5.6" height="10.4" rx="2.6" fill="#d8dce4" />
      <circle
        cx="62"
        cy="96"
        r="34"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1.6"
      />

      <circle cx="178" cy="96" r="34" fill="url(#vpEmptyDisc)" />
      <g clipPath="url(#vpEmptyClipR)">
        <circle cx="178" cy="86" r="12.4" fill="url(#vpEmptyHead)" />
        <path
          d="M154 132v-20c0-10 10-16 24-16s24 6 24 16v20z"
          fill="url(#vpEmptyBody)"
        />
      </g>
      <path
        d="M166 83.5Q178 71 190 83.5"
        stroke="#e8eaef"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <rect x="163.4" y="80.5" width="5.6" height="10.4" rx="2.6" fill="#d8dce4" />
      <rect x="187" y="80.5" width="5.6" height="10.4" rx="2.6" fill="#d8dce4" />
      <circle
        cx="178"
        cy="96"
        r="34"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1.6"
      />

      <circle
        cx="120"
        cy="76"
        r="48"
        stroke="#0a84ff"
        strokeOpacity="0.28"
        strokeWidth="2"
      />
      <circle cx="120" cy="76" r="44" fill="url(#vpEmptyDisc)" />
      <g clipPath="url(#vpEmptyClipC)">
        <circle cx="120" cy="62" r="15.4" fill="url(#vpEmptyHead)" />
        <path
          d="M88 124V96c0-12 13-20 32-20s32 8 32 20v28z"
          fill="url(#vpEmptyBody)"
        />
      </g>
      <path
        d="M105.4 61Q120 45.5 134.6 61"
        stroke="#f2f4f8"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
      <rect x="101.6" y="57.5" width="6.4" height="12.6" rx="3.1" fill="#0a84ff" />
      <rect x="132" y="57.5" width="6.4" height="12.6" rx="3.1" fill="#0a84ff" />
      <path
        d="M138.4 69.5c6.8 2.4 9 8.8 6.4 13.6"
        stroke="#0a84ff"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <circle cx="144" cy="85.4" r="2.5" fill="#64d2ff" />
      <circle cx="120" cy="76" r="44" stroke="#0a84ff" strokeWidth="2" />

      <g fill="#0a84ff" transform="translate(120 154)">
        <rect x="-26" y="-7" width="4.2" height="7" rx="2.1" opacity="0.28" />
        <rect x="-18" y="-13" width="4.2" height="13" rx="2.1" opacity="0.48" />
        <rect x="-10" y="-19" width="4.2" height="19" rx="2.1" opacity="0.9" />
        <rect x="-2" y="-11" width="4.2" height="11" rx="2.1" opacity="0.7" />
        <rect x="6" y="-16" width="4.2" height="16" rx="2.1" opacity="0.55" />
        <rect x="14" y="-8" width="4.2" height="8" rx="2.1" opacity="0.34" />
        <rect x="22" y="-5" width="4.2" height="5" rx="2.1" opacity="0.2" />
      </g>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 3.2v9.6M3.2 8h9.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="9"
        y="3"
        width="6"
        height="11"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M7 11a5 5 0 0 0 6.6 4.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M12 16v3M9 19h6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M5 5l14 14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeadsetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 13V11a7 7 0 0 1 14 0v2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <rect
        x="3.5"
        y="12.2"
        width="4.2"
        height="6.2"
        rx="1.4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <rect
        x="16.3"
        y="12.2"
        width="4.2"
        height="6.2"
        rx="1.4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function HeadsetOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 13V11a7 7 0 0 1 14 0v2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <rect
        x="3.5"
        y="12.2"
        width="4.2"
        height="6.2"
        rx="1.4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <rect
        x="16.3"
        y="12.2"
        width="4.2"
        height="6.2"
        rx="1.4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M5 5l14 14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 9.5h3.2L12 6v12l-4.3-3.5H4.5V9.5z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M15.2 9.4a3.2 3.2 0 0 1 0 5.2M17.6 7.2a6 6 0 0 1 0 9.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CallMarkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 9.5h3.2L12 6v12l-4.3-3.5H4.5V9.5z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M15.2 9.4a3.2 3.2 0 0 1 0 5.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M19.2 13.1a7.6 7.6 0 0 0 0-2.2l1.7-1.3-1.6-2.8-2 .8a7.7 7.7 0 0 0-1.9-1.1L15 4.2h-6l-.4 2.3a7.7 7.7 0 0 0-1.9 1.1l-2-.8-1.6 2.8 1.7 1.3a7.6 7.6 0 0 0 0 2.2L3.1 14.4l1.6 2.8 2-.8a7.7 7.7 0 0 0 1.9 1.1l.4 2.3h6l.4-2.3a7.7 7.7 0 0 0 1.9-1.1l2 .8 1.6-2.8-1.7-1.3z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EnterIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect
        x="2.4"
        y="2.4"
        width="11.2"
        height="11.2"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6.2 8h5.2M9.4 5.8 11.6 8 9.4 10.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RoomActions({
  onCreate,
  onJoin,
}: {
  onCreate: () => void;
  onJoin: () => void;
}) {
  return (
    <Actions style={{ justifyContent: "center" }}>
      <PrimaryButton type="button" onClick={onCreate}>
        <PlusIcon />
        Criar servidor
      </PrimaryButton>
      <SecondaryButton type="button" onClick={onJoin}>
        <EnterIcon />
        Entrar com código
      </SecondaryButton>
    </Actions>
  );
}

export function HomeScreen({
  identity,
  onNicknameChange,
  onLogout,
}: HomeScreenProps) {
  const [rooms, setRooms] = useState(loadBookmarks);
  const [view, setView] = useState<View>({ type: "home" });
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [status, setStatus] = useState(loadStatus);
  const [statusOpen, setStatusOpen] = useState(false);
  const [outputVolume, setOutputVolume] = useState(
    () => loadAudioSettings().outputVolume,
  );
  const [call, setCall] = useState<VoiceCall | null>(null);
  const callRef = useRef<VoiceCall | null>(null);
  const seatedRef = useRef(false);
  const skipPresenceSendRef = useRef(false);
  const [syncGen, setSyncGen] = useState(0);
  const [occupancyByRoom, setOccupancyByRoom] = useState<
    Record<string, string[]>
  >({});
  callRef.current = call;
  const talking = useTalking(Boolean(call) && !muted && !deafened);
  const [editing, setEditing] = useState(false);
  const [savingNick, setSavingNick] = useState(false);
  const [draft, setDraft] = useState(identity.nickname);
  const statusRef = useRef<HTMLDivElement>(null);
  const nickEditRef = useRef<HTMLFormElement>(null);
  const lastViewRef = useRef<View>({ type: "home" });
  const silencedRef = useRef<boolean | null>(null);
  const currentStatus = statusMeta(status);
  const created = view.type === "create" ? view.created : undefined;
  const visibleRoomId = view.type === "room" ? view.roomId : undefined;
  const viewingRoomId =
    view.type === "room" || view.type === "server-settings"
      ? view.roomId
      : view.type === "settings" &&
          (lastViewRef.current.type === "room" ||
            lastViewRef.current.type === "server-settings")
        ? lastViewRef.current.roomId
        : undefined;
  const settingsRoom =
    view.type === "server-settings"
      ? rooms.find((room) => room.roomId === view.roomId)
      : undefined;
  const mountedRooms = rooms;

  function openEdit() {
    setDraft(identity.nickname);
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(identity.nickname);
    setEditing(false);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nickname = draft.trim();
    if (!nickname || savingNick) return;

    setSavingNick(true);
    try {
      const next = await persistNickname(nickname);
      if (next) onNicknameChange(next);
      setEditing(false);
    } catch {
      /* API fora: o nick neste PC não muda */
    } finally {
      setSavingNick(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") cancelEdit();
  }

  function handleStatus(next: StatusId) {
    setStatus(next);
    saveStatus(next);
    setStatusOpen(false);
  }

  useEffect(() => {
    if (!editing) return;

    function handlePointer(event: MouseEvent) {
      if (
        nickEditRef.current &&
        !nickEditRef.current.contains(event.target as Node)
      ) {
        cancelEdit();
      }
    }

    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [editing]);

  useEffect(() => {
    if (!statusOpen) return;

    function handlePointer(event: MouseEvent) {
      if (
        statusRef.current &&
        !statusRef.current.contains(event.target as Node)
      ) {
        setStatusOpen(false);
      }
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setStatusOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [statusOpen]);

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

    function handleMuteHotkey(event: globalThis.KeyboardEvent) {
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

  function rememberRoom(room: CreatedRoom) {
    return saveBookmark({
      roomId: room.id,
      name: room.name,
      code: room.code,
      role: room.role,
    });
  }

  function followOwnSeat(roomId: string, salaId: string) {
    setCall((prev) => {
      if (prev?.roomId === roomId && prev?.salaId === salaId) return prev;
      skipPresenceSendRef.current = true;
      return { roomId, salaId };
    });
  }

  function followOwnLeave(roomId: string, salaId: string) {
    setCall((prev) => {
      if (prev?.roomId !== roomId || prev?.salaId !== salaId) return prev;
      skipPresenceSendRef.current = true;
      return null;
    });
  }

  async function rememberServer(roomId: string) {
    try {
      const details = await getRoom({ roomId, uid: identity.uid });
      setRooms((prev) => {
        if (prev.some((item) => item.roomId === details.id)) return prev;
        return rememberRoom(details);
      });
    } catch {
      /* servidor sumiu ou o uid não é mais membro */
    }
  }

  function handleCreated(room: CreatedRoom) {
    setRooms(rememberRoom(room));
    setView({ type: "create", created: room });
  }

  function enterRoom(roomId: string) {
    setView({ type: "room", roomId });
  }

  function handleJoined(room: CreatedRoom) {
    setRooms(rememberRoom(room));
    enterRoom(room.id);
  }

  function backToHome() {
    setView({ type: "home" });
  }

  function openSettings() {
    if (view.type !== "settings") lastViewRef.current = view;
    setView({ type: "settings" });
  }

  function closeSettings() {
    const previous = lastViewRef.current;
    setView(previous.type === "settings" ? { type: "home" } : previous);
  }

  function openServerSettings(roomId: string) {
    setView({ type: "server-settings", roomId });
  }

  function closeServerSettings(roomId: string) {
    setView({ type: "room", roomId });
  }

  function updateRoomBookmark(
    roomId: string,
    patch: Partial<Pick<Bookmark, "name" | "role">>,
  ) {
    setRooms((prev) => {
      const current = prev.find((item) => item.roomId === roomId);
      if (!current) return prev;
      const next = { ...current, ...patch };
      if (current.name === next.name && current.role === next.role) return prev;
      return saveBookmark(next);
    });
  }

  function leaveRoomList(roomId: string) {
    setRooms(removeBookmark(roomId));
    setOccupancyByRoom((prev) => {
      if (!(roomId in prev)) return prev;
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
    setCall((prev) => (prev?.roomId === roomId ? null : prev));
    setView({ type: "home" });
  }

  const reportOccupancy = useCallback((roomId: string, uids: string[]) => {
    setOccupancyByRoom((prev) => {
      const current = prev[roomId] ?? [];
      if (
        current.length === uids.length &&
        current.every((uid, index) => uid === uids[index])
      ) {
        return prev;
      }
      if (uids.length === 0) {
        if (!(roomId in prev)) return prev;
        const next = { ...prev };
        delete next[roomId];
        return next;
      }
      return { ...prev, [roomId]: uids };
    });
  }, []);

  function enterCreatedRoom() {
    if (created) enterRoom(created.id);
    else backToHome();
  }

  useEffect(() => {
    const stopData = connectRealtime(identity.uid, {
      onOpen: () => setSyncGen((value) => value + 1),
    });
    const stopOccupancy = connectOccupancy();
    const stopChat = connectChat();
    const stopActivity = connectActivity();
    const stopRtc = connectRtc();
    const stopSignal = startRtcSignaling(identity.uid, () => callRef.current);
    return () => {
      stopSignal();
      stopRtc();
      stopActivity();
      stopChat();
      stopOccupancy();
      stopData();
    };
  }, [identity.uid]);

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

  useEffect(() => {
    return subscribeRealtimeOpen(() => {
      const current = callRef.current;
      if (!current) return;
      sendOccupancy({
        type: "presence.join",
        roomId: current.roomId,
        channelId: current.salaId,
      });
    });
  }, []);

  useEffect(() => {
    return subscribeRealtime((event) => {
      if (event.type === "user.nickname" && event.uid === identity.uid) {
        if (event.nickname === identity.nickname) return;
        const next = { ...identity, nickname: event.nickname };
        saveIdentity(next);
        onNicknameChange(next);
        return;
      }

      if (event.type === "room.renamed") {
        updateRoomBookmark(event.roomId, { name: event.name });
        return;
      }

      if (event.type === "member.joined" && event.uid === identity.uid) {
        void rememberServer(event.roomId);
        return;
      }

      if (event.type === "member.role" && event.uid === identity.uid) {
        updateRoomBookmark(event.roomId, { role: event.role });
        return;
      }

      if (
        (event.type === "member.kicked" ||
          event.type === "member.left" ||
          event.type === "member.blocked") &&
        event.uid === identity.uid
      ) {
        leaveRoomList(event.roomId);
      }
    });
  }, [identity, onNicknameChange]);

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
      if (event.type === "presence.state") {
        if (callRef.current) return;
        const seat = event.occupants.find((item) => item.uid === identity.uid);
        if (seat) followOwnSeat(event.roomId, seat.channelId);
      }
    });
  }, [identity.uid]);

  return (
    <Shell>
      <Sidebar>
        <Brand>
          <BrandIcon>
            <MicIcon />
          </BrandIcon>
          The Voice Chat
        </Brand>
        {editing ? (
          <NickEdit ref={nickEditRef} onSubmit={handleSave}>
            <NickInput
              autoFocus
              maxLength={NICKNAME_MAX_LENGTH}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <NickIconButton type="submit" title="Salvar" disabled={!draft.trim() || savingNick}>
              <CheckIcon />
            </NickIconButton>
            <NickIconButton type="button" title="Cancelar" onClick={cancelEdit}>
              <CloseIcon />
            </NickIconButton>
          </NickEdit>
        ) : (
          <NickButton type="button" onClick={openEdit} title="Alterar nickname">
            <NickName>{identity.nickname}</NickName>
            <EditIcon />
          </NickButton>
        )}
        <NavLabel>
          <HomeIcon />
          Servidores
        </NavLabel>
        <SidebarRule />
        <SidebarRooms>
          <SidebarRoom>
            <SidebarRoomButton
              type="button"
              $active={
                view.type === "home" ||
                view.type === "create" ||
                view.type === "join"
              }
              onClick={backToHome}
              title="Criar ou entrar em um servidor"
            >
              <SidebarAddMark>
                <PlusIcon />
              </SidebarAddMark>
              <SidebarRoomName>Adicionar</SidebarRoomName>
            </SidebarRoomButton>
          </SidebarRoom>
          <SidebarDash aria-hidden="true" />
          {rooms.map((room: Bookmark) => {
            const live = call?.roomId === room.roomId;
            const busy = (occupancyByRoom[room.roomId] ?? []).some(
              (uid) => uid !== identity.uid,
            );
            const tone = live ? "live" : busy ? "busy" : null;
            const title = live
              ? `${room.name} · em uma sala`
              : busy
                ? `${room.name} · pessoas em sala`
                : room.name;
            return (
              <SidebarRoom key={room.roomId}>
                <SidebarRoomButton
                  type="button"
                  $active={viewingRoomId === room.roomId}
                  $live={live}
                  onClick={() => enterRoom(room.roomId)}
                  title={title}
                >
                  <SidebarRoomName>{room.name}</SidebarRoomName>
                  {tone ? (
                    <SidebarCallMark $tone={tone} aria-hidden="true">
                      <CallMarkIcon />
                    </SidebarCallMark>
                  ) : null}
                </SidebarRoomButton>
              </SidebarRoom>
            );
          })}
        </SidebarRooms>
        <SidebarDock>
          <DockRow>
            <DockButton
              type="button"
              $on={muted || deafened}
              title={
                muted || deafened ? "Ativar microfone" : "Silenciar microfone"
              }
              onClick={() => setMuted((value) => !value)}
            >
              {muted || deafened ? <MicOffIcon /> : <MicIcon />}
            </DockButton>
            <DockButton
              type="button"
              $on={deafened}
              title={deafened ? "Ouvir de novo" : "Ensurdecer"}
              onClick={() => {
                if (deafened) unmuteOutput();
                else muteOutput();
              }}
            >
              {deafened ? <HeadsetOffIcon /> : <HeadsetIcon />}
            </DockButton>
            <DockButton
              type="button"
              title="Configurações"
              onClick={openSettings}
            >
              <GearIcon />
            </DockButton>
            <StatusWrap ref={statusRef}>
              <StatusButton
                type="button"
                title="Alterar status"
                onClick={() => setStatusOpen((open) => !open)}
              >
                <StatusDot $color={currentStatus.color} />
                <StatusLabel>{currentStatus.label}</StatusLabel>
              </StatusButton>
              {statusOpen ? (
                <StatusMenu>
                  {STATUSES.map((item) => (
                    <StatusOption
                      key={item.id}
                      type="button"
                      $active={item.id === status}
                      onClick={() => handleStatus(item.id)}
                    >
                      <StatusDot $color={item.color} />
                      {item.label}
                    </StatusOption>
                  ))}
                </StatusMenu>
              ) : null}
            </StatusWrap>
          </DockRow>
          <DockVolume title="Volume geral">
            <VolumeIcon />
            <DockSlider
              type="range"
              min={0}
              max={100}
              value={deafened ? 0 : outputVolume}
              aria-label="Volume geral"
              onChange={(event) =>
                handleOutputVolume(Number(event.target.value))
              }
            />
            <DockVolumeValue>{deafened ? 0 : outputVolume}%</DockVolumeValue>
          </DockVolume>
        </SidebarDock>
      </Sidebar>

      <Main $flush={view.type === "room"}>
        {mountedRooms.map((room) => (
          <RoomMount key={room.roomId} $hidden={room.roomId !== visibleRoomId}>
            <RoomScreen
              room={room}
              identity={identity}
              syncGen={syncGen}
              muted={muted}
              deafened={deafened}
              currentId={call?.roomId === room.roomId ? call.salaId : null}
              talking={talking}
              presence={status}
              onOpenSettings={() => openServerSettings(room.roomId)}
              onJoinSala={(salaId) => setCall({ roomId: room.roomId, salaId })}
              onLeaveSala={() =>
                setCall((prev) => (prev?.roomId === room.roomId ? null : prev))
              }
              onOccupancyChange={reportOccupancy}
            />
          </RoomMount>
        ))}
        {view.type === "create" ? (
          <CreateRoomScreen
            identity={identity}
            created={created}
            onCancel={backToHome}
            onCreated={handleCreated}
            onEnter={enterCreatedRoom}
          />
        ) : null}
        {view.type === "join" ? (
          <JoinRoomScreen
            identity={identity}
            onCancel={backToHome}
            onJoined={handleJoined}
          />
        ) : null}
        {view.type === "settings" ? (
          <SettingsScreen
            identity={identity}
            onBack={closeSettings}
            onLogout={onLogout}
            onNicknameChange={onNicknameChange}
            deafened={deafened}
            onOutputVolume={handleOutputVolume}
          />
        ) : null}
        {view.type === "server-settings" && settingsRoom ? (
          <ServerSettingsScreen
            room={settingsRoom}
            uid={identity.uid}
            nickname={identity.nickname}
            syncGen={syncGen}
            onBack={() => closeServerSettings(settingsRoom.roomId)}
            onUpdated={(patch) =>
              updateRoomBookmark(settingsRoom.roomId, patch)
            }
            onLeft={() => leaveRoomList(settingsRoom.roomId)}
          />
        ) : null}
        {view.type === "home" ? (
          <>
            <Header>
              <HeaderCopy>
                <Title>Servidores</Title>
                <Subtitle>
                  Crie um servidor ou entre com um código para começar a
                  conversar com seu squad.
                </Subtitle>
              </HeaderCopy>
            </Header>
            <Empty>
              <EmptyArt>
                <EmptyRoomsArt />
              </EmptyArt>
              <EmptyTitle>
                {rooms.length === 0
                  ? "Nenhum servidor ainda"
                  : "Pronto para conversar"}
              </EmptyTitle>
              <EmptyText>
                {rooms.length === 0
                  ? "Crie seu primeiro servidor ou entre em um existente para começar."
                  : "Seus servidores estão à esquerda. Crie outro ou entre com um código."}
              </EmptyText>
              <RoomActions
                onCreate={() => setView({ type: "create" })}
                onJoin={() => setView({ type: "join" })}
              />
            </Empty>
          </>
        ) : null}
      </Main>
    </Shell>
  );
}
