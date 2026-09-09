import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type MouseEvent,
} from "react";
import type { Bookmark } from "../../bookmarks";
import type { Identity } from "../../identity";
import {
  createChannel as createSala,
  deleteChannel as deleteSala,
  getRoom,
  setMemberRole,
  updateChannel as patchSala,
  type RoomDetails,
} from "../../api";
import { subscribeRealtime } from "../../realtime";
import {
  sendOccupancy,
  subscribeOccupancy,
  type Occupant,
} from "../../occupancy";
import { CHAT_TEXT_MAX, clearSalaLog, sendChat } from "../../chat";
import { clearSalaActivity } from "../../activity";
import { playConnectSound, playDisconnectSound } from "../../sounds";
import {
  rtcLinkReady,
  rtcPeerTalking,
  subscribeRtcLinks,
  subscribeRtcTalking,
  syncRtcSignaling,
} from "../../rtc-session";
import {
  WorkspaceChat,
  type WorkspaceChatHandle,
} from "../workspace/components/chat";
import { ChatLine } from "../workspace/components/chat/style";
import {
  ChannelBlock,
  ChannelCount,
  ChannelDesc,
  ChannelEdit,
  ChannelHit,
  ChannelName,
  ChannelRow,
  Chevron,
  Copied,
  CopyButton,
  Invite,
  InviteCode,
  InviteRow,
  PokeForm,
  PokeInput,
  PokeSend,
  ProfileAdminLink,
  ProfileCard,
  ProfileConnected,
  ProfileHead,
  ProfileName,
  ProfileRole,
  ProfileStatus,
  VolumeCaption,
  VolumeRow,
  VolumeSlider,
  VolumeValue,
  RoomGear,
  RoomHeader,
  RoomHeading,
  RoomMeta,
  RoomRole,
  RoomRoleLabel,
  RoomRoleValue,
  RoomShell,
  RoomTitle,
  SalaCreate,
  SalaCreateWrap,
  SalaDelete,
  SalaField,
  SalaLabel,
  SalaNameButton,
  SalaNameEdit,
  SalaNameIcon,
  SalaNameInput,
  StatusDot,
  Tree,
  TreeBar,
  TreeWrap,
  UserFlag,
  UserLeave,
  UserList,
  UserName,
  UserRow,
} from "./style";

type Presence = "online" | "busy" | "brb";
type Role = "owner" | "admin" | "member";

type TreeUser = {
  id: string;
  nick: string;
  presence: Presence;
  role?: Role;
  onlineSince: number;
  talking?: boolean;
  linking?: boolean;
  muted?: boolean;
  deafened?: boolean;
  you?: boolean;
};

type ProfileState = {
  userId: string;
  x: number;
  y: number;
};

type TreeChannel = {
  id: string;
  name: string;
  description?: string;
  users: TreeUser[];
};

type RoomScreenProps = {
  room: Bookmark;
  identity: Identity;
  syncGen?: number;
  muted?: boolean;
  deafened?: boolean;
  currentId: string | null;
  talking?: boolean;
  presence: Presence;
  onOpenSettings: () => void;
  onJoinSala: (salaId: string) => void;
  onLeaveSala: () => void;
  onOccupancyChange?: (roomId: string, uids: string[]) => void;
};

const PRESENCE_COLOR: Record<Presence, string> = {
  online: "#30d158",
  busy: "#ff453a",
  brb: "#ffd60a",
};

const PRESENCE_LABEL: Record<Presence, string> = {
  online: "Online",
  busy: "Ocupado",
  brb: "Volto logo",
};

const ROLE_LABEL: Record<Role, string> = {
  owner: "Dono",
  admin: "Administrador",
  member: "Membro",
};

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
        d="M3.4 10.6V3.8A1.4 1.4 0 0 1 4.8 2.4h6.8"
        stroke="currentColor"
        strokeWidth="1.4"
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

function LeaveSalaIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6.4 3.2H4.2A1.2 1.2 0 0 0 3 4.4v7.2c0 .66.54 1.2 1.2 1.2h2.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M7 8h6.1M10.7 5.5 13.3 8l-2.6 2.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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

function formatOnline(since: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - since) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0 && minutes > 0) return `${hours} h e ${minutes} min`;
  if (hours > 0) return `${hours} h`;
  if (minutes > 0) return `${minutes} min`;
  return `${seconds}s`;
}

const CHANNEL_CAP = 12;

function rosterFromDetails(details: RoomDetails): TreeChannel[] {
  return details.channels.map((channel) => ({
    id: channel.id,
    name: channel.name,
    description: channel.description,
    users: [],
  }));
}

function occupantUser(occupant: Occupant): TreeUser {
  return {
    id: occupant.uid,
    nick: occupant.nickname,
    presence: occupant.status,
    role: occupant.role,
    onlineSince: occupant.joinedAt,
    muted: occupant.muted || occupant.deafened,
    deafened: occupant.deafened,
  };
}

function upsertOccupant(occupants: Occupant[], occupant: Occupant): Occupant[] {
  const next = [
    ...occupants.filter((item) => item.uid !== occupant.uid),
    occupant,
  ];
  next.sort(
    (a, b) => a.joinedAt - b.joinedAt || a.uid.localeCompare(b.uid),
  );
  return next;
}

function upsertChannel(
  roster: TreeChannel[],
  channel: Omit<TreeChannel, "users"> & { users?: TreeUser[] },
): TreeChannel[] {
  if (roster.some((item) => item.id === channel.id)) {
    return roster.map((item) =>
      item.id === channel.id
        ? {
            ...item,
            name: channel.name,
            description: channel.description,
          }
        : item,
    );
  }
  return [
    ...roster,
    {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      users: channel.users ?? [],
    },
  ];
}

function salaIsFull(occupants: Occupant[], channelId: string, uid: string): boolean {
  return occupants.filter((item) => item.channelId === channelId && item.uid !== uid).length >= CHANNEL_CAP;
}
const CHANNEL_NAME_MAX = 24;
const CHANNEL_DESC_MAX = 80;
const PEER_VOLUME_KEY = "voice.peerVolumes";

function salaOpenKey(roomId: string) {
  return `voice.salaOpen.${roomId}`;
}

function loadSalaOpen(roomId: string): Record<string, boolean> | null {
  const raw = window.localStorage.getItem(salaOpenKey(roomId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return null;
    const next: Record<string, boolean> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (typeof value === "boolean") next[id] = value;
    }
    return Object.keys(next).length ? next : null;
  } catch {
    return null;
  }
}

function saveSalaOpen(roomId: string, open: Record<string, boolean>) {
  window.localStorage.setItem(salaOpenKey(roomId), JSON.stringify(open));
}

function clampPeerVolume(value: number): number {
  if (!Number.isFinite(value)) return 100;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function loadPeerVolumes(): Record<string, number> {
  const raw = window.localStorage.getItem(PEER_VOLUME_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const next: Record<string, number> = {};
    for (const [uid, value] of Object.entries(parsed)) {
      if (typeof value === "number") next[uid] = clampPeerVolume(value);
    }
    return next;
  } catch {
    return {};
  }
}

function savePeerVolumes(volumes: Record<string, number>) {
  window.localStorage.setItem(PEER_VOLUME_KEY, JSON.stringify(volumes));
}

function nextSalaName(roster: TreeChannel[]) {
  const used = new Set(roster.map((item) => item.name.toLowerCase()));
  let n = roster.length + 1;
  while (used.has(`sala ${n}`)) n += 1;
  return `Sala ${n}`;
}

export function RoomScreen({
  room,
  identity,
  syncGen = 0,
  muted,
  deafened,
  currentId,
  talking,
  presence,
  onOpenSettings,
  onJoinSala,
  onLeaveSala,
  onOccupancyChange,
}: RoomScreenProps) {
  const [roster, setRoster] = useState<TreeChannel[]>([]);
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [linkGen, setLinkGen] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [pokeDraft, setPokeDraft] = useState("");
  const [volumes, setVolumes] = useState<Record<string, number>>(loadPeerVolumes);
  const [salaCard, setSalaCard] = useState<ProfileState | null>(null);
  const [editingSala, setEditingSala] = useState(false);
  const [salaDraft, setSalaDraft] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const salaCardRef = useRef<HTMLDivElement>(null);
  const salaEditRef = useRef<HTMLFormElement>(null);
  const salaDescRef = useRef<HTMLFormElement>(null);
  const [youSince] = useState(() => Date.now());
  const profileRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const chatRef = useRef<WorkspaceChatHandle>(null);
  const myRole: Role = room.role;
  const canMoveOthers = myRole === "owner" || myRole === "admin";
  const canManageChannels = myRole === "owner" || myRole === "admin";
  const canPromote = myRole === "owner" || myRole === "admin";
  const canDemoteAdmins = myRole === "owner";
  const [open, setOpen] = useState<Record<string, boolean>>(
    () => loadSalaOpen(room.roomId) ?? {},
  );
  const [copied, setCopied] = useState(false);
  const [salaError, setSalaError] = useState("");
  const currentIdRef = useRef(currentId);
  const deafenedRef = useRef(deafened);
  const onLeaveSalaRef = useRef(onLeaveSala);
  currentIdRef.current = currentId;
  deafenedRef.current = deafened;
  onLeaveSalaRef.current = onLeaveSala;

  useEffect(() => {
    setRoster([]);
    setOccupants([]);
  }, [room.roomId]);

  useEffect(() => {
    let cancelled = false;
    setSalaError("");
    sendOccupancy({ type: "presence.sync", roomId: room.roomId });

    void getRoom({ roomId: room.roomId, uid: identity.uid })
      .then((details) => {
        if (cancelled) return;
        setRoster(rosterFromDetails(details));
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setSalaError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar as salas.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [room.roomId, identity.uid, syncGen]);

  useEffect(() => {
    return subscribeRealtime((event) => {
      if (event.type === "user.nickname") {
        setOccupants((prev) =>
          prev.map((item) =>
            item.uid === event.uid ? { ...item, nickname: event.nickname } : item,
          ),
        );
        return;
      }

      if (!("roomId" in event) || event.roomId !== room.roomId) return;

      if (
        event.type === "member.left" ||
        event.type === "member.kicked" ||
        event.type === "member.blocked"
      ) {
        setOccupants((prev) => prev.filter((item) => item.uid !== event.uid));
        return;
      }

      if (event.type === "member.role") {
        setOccupants((prev) =>
          prev.map((item) =>
            item.uid === event.uid ? { ...item, role: event.role } : item,
          ),
        );
        return;
      }

      if (event.type === "channel.created") {
        setRoster((prev) =>
          upsertChannel(prev, {
            id: event.id,
            name: event.name,
            description: event.description,
          }),
        );
        return;
      }

      if (event.type === "channel.updated") {
        setRoster((prev) =>
          prev.map((channel) =>
            channel.id === event.id
              ? {
                  ...channel,
                  name: event.name,
                  description: event.description,
                }
              : channel,
          ),
        );
        return;
      }

      if (event.type === "channel.deleted") {
        setRoster((prev) =>
          prev.filter((channel) => channel.id !== event.channelId),
        );
        setOccupants((prev) =>
          prev.filter((item) => item.channelId !== event.channelId),
        );
        clearSalaLog(room.roomId, event.channelId);
        clearSalaActivity(room.roomId, event.channelId);
        setOpen((prev) => {
          const next = { ...prev };
          delete next[event.channelId];
          return next;
        });
        if (currentIdRef.current === event.channelId) {
          onLeaveSalaRef.current();
          if (!deafenedRef.current) playDisconnectSound();
        }
        setSalaCard((prev) =>
          prev?.userId === event.channelId ? null : prev,
        );
      }
    });
  }, [room.roomId, identity.uid]);

  useEffect(() => {
    return subscribeOccupancy((event) => {
      if (!("roomId" in event) || event.roomId !== room.roomId) return;

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
        if (
          event.uid !== identity.uid &&
          event.channelId === currentIdRef.current &&
          !deafenedRef.current
        ) {
          playConnectSound();
        }
        return;
      }

      if (event.type === "presence.left") {
        const wasHere = event.channelId === currentIdRef.current;
        setOccupants((prev) => prev.filter((item) => item.uid !== event.uid));
        if (event.uid !== identity.uid && wasHere && !deafenedRef.current) {
          playDisconnectSound();
        }
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
        return;
      }

      if (event.type === "presence.full") {
        if (currentIdRef.current === event.channelId) {
          onLeaveSalaRef.current();
        }
      }
    });
  }, [room.roomId, identity.uid]);

  useEffect(() => {
    saveSalaOpen(room.roomId, open);
  }, [room.roomId, open]);

  useEffect(() => {
    const uids = [...new Set(occupants.map((item) => item.uid))];
    onOccupancyChange?.(room.roomId, uids);
  }, [occupants, room.roomId, onOccupancyChange]);

  useEffect(() => {
    if (!currentId) return;
    syncRtcSignaling(occupants);
  }, [occupants, currentId]);

  useEffect(() => {
    const bump = () => setLinkGen((value) => value + 1);
    const stopLinks = subscribeRtcLinks(bump);
    const stopTalk = subscribeRtcTalking(bump);
    return () => {
      stopLinks();
      stopTalk();
    };
  }, []);

  useEffect(() => {
    const roomId = room.roomId;
    return () => onOccupancyChange?.(roomId, []);
  }, [room.roomId, onOccupancyChange]);

  const you: TreeUser = {
    id: identity.uid,
    nick: identity.nickname,
    presence,
    role: myRole,
    onlineSince: youSince,
    muted: muted || deafened,
    deafened,
    talking,
    you: true,
  };

  const myJoined =
    occupants.find(
      (item) => item.channelId === currentId && item.uid === identity.uid,
    )?.joinedAt ?? youSince;

  function salaLinking(userId: string, joinedAt: number): boolean {
    if (!currentId || linkGen < 0) return false;
    if (userId === identity.uid) {
      return occupants.some(
        (item) =>
          item.channelId === currentId &&
          item.uid !== identity.uid &&
          item.joinedAt < myJoined &&
          !rtcLinkReady(item.uid),
      );
    }
    return joinedAt > myJoined && !rtcLinkReady(userId);
  }

  const channels = roster.map((channel) => {
    const inCall = channel.id === currentId;
    const users = occupants
      .filter((item) => item.channelId === channel.id)
      .map((item) => occupantUser(item))
      .map((user) => {
        const row =
          user.id === identity.uid
            ? { ...you, onlineSince: user.onlineSince }
            : user;
        if (!inCall) return row;
        const linking = salaLinking(row.id, row.onlineSince);
        return {
          ...row,
          linking,
          talking: linking
            ? false
            : row.you
              ? row.talking
              : rtcPeerTalking(row.id),
        };
      });
    if (inCall && !users.some((user) => user.id === identity.uid)) {
      const linking = salaLinking(identity.uid, you.onlineSince);
      return {
        ...channel,
        users: [{ ...you, linking, talking: linking ? false : you.talking }, ...users],
      };
    }
    return { ...channel, users };
  });
  const current = channels.find((item) => item.id === currentId) ?? null;
  const profileUser =
    profile == null
      ? null
      : profile.userId === identity.uid
        ? you
        : (channels
            .flatMap((channel) => channel.users)
            .find((user) => user.id === profile.userId) ?? null);
  const profileRole = profileUser?.role ?? "member";
  const canPromoteThis = Boolean(
    profileUser &&
      !profileUser.you &&
      profileRole === "member" &&
      canPromote,
  );
  const canDemoteThis = Boolean(
    profileUser &&
      !profileUser.you &&
      profileRole === "admin" &&
      canDemoteAdmins,
  );
  const salaChannel = salaCard
    ? (roster.find((channel) => channel.id === salaCard.userId) ?? null)
    : null;

  useEffect(() => {
    if (!profile) return;

    function handlePointer(event: globalThis.MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfile(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setProfile(null);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profile]);

  useEffect(() => {
    if (!salaCard) return;

    function handlePointer(event: globalThis.MouseEvent) {
      const target = event.target as Node;
      if (
        editingSala &&
        salaEditRef.current &&
        !salaEditRef.current.contains(target)
      ) {
        setEditingSala(false);
        return;
      }
      if (
        editingDesc &&
        salaDescRef.current &&
        !salaDescRef.current.contains(target)
      ) {
        setEditingDesc(false);
        return;
      }
      if (salaCardRef.current && !salaCardRef.current.contains(target)) {
        setSalaCard(null);
        setEditingSala(false);
        setEditingDesc(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (editingSala) setEditingSala(false);
        else if (editingDesc) setEditingDesc(false);
        else setSalaCard(null);
      }
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [salaCard, editingSala, editingDesc]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(room.code);
    } catch {
      const field = document.createElement("textarea");
      field.value = room.code;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function toggleChannel(id: string) {
    setOpen((prev) => ({ ...prev, [id]: prev[id] === false }));
  }

  function joinChannel(id: string) {
    setOpen((prev) => ({ ...prev, [id]: true }));
    if (id === currentId) return;
    if (salaIsFull(occupants, id, identity.uid)) {
      return;
    }

    onJoinSala(id);
    if (!deafened) playConnectSound();
  }

  function leaveChannel(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!currentId) return;
    onLeaveSala();
    if (!deafened) playDisconnectSound();
  }

  function moveUser(userId: string, channelId: string) {
    if (userId === identity.uid) {
      joinChannel(channelId);
      return;
    }

    if (!canMoveOthers) return;

    if (occupants.some((item) => item.uid === userId && item.channelId === channelId)) {
      return;
    }
    if (salaIsFull(occupants, channelId, userId)) return;

    sendOccupancy({
      type: "presence.move",
      roomId: room.roomId,
      channelId,
      uid: userId,
    });
    setOpen((prev) => ({ ...prev, [channelId]: true }));
  }

  function handleUserDragStart(
    event: DragEvent<HTMLLIElement>,
    userId: string,
  ) {
    if (userId !== identity.uid && !canMoveOthers) {
      event.preventDefault();
      return;
    }

    draggedRef.current = true;
    setProfile(null);
    event.dataTransfer.setData("text/plain", userId);
    event.dataTransfer.effectAllowed = "move";
    setDraggingId(userId);
  }

  function openProfile(event: MouseEvent<HTMLLIElement>, user: TreeUser) {
    event.preventDefault();
    const maxX = window.innerWidth - 440;
    const maxY = window.innerHeight - 260;
    setPokeDraft("");
    setSalaCard(null);
    setEditingSala(false);
    setProfile({
      userId: user.id,
      x: Math.min(event.clientX + 8, maxX),
      y: Math.min(event.clientY + 8, maxY),
    });
  }

  function handleUserClick(event: MouseEvent<HTMLLIElement>, user: TreeUser) {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    openProfile(event, user);
  }

  async function toggleAdmin(userId: string, makeAdmin: boolean) {
    try {
      await setMemberRole({
        roomId: room.roomId,
        uid: identity.uid,
        memberUid: userId,
        role: makeAdmin ? "admin" : "member",
      });
      setOccupants((prev) =>
        prev.map((item) =>
          item.uid === userId
            ? { ...item, role: makeAdmin ? "admin" : "member" }
            : item,
        ),
      );
    } catch {
      /* cargo na árvore volta no próximo passo de presença */
    }
  }

  function handlePoke(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = pokeDraft.trim().slice(0, CHAT_TEXT_MAX);
    if (!text || !profileUser || profileUser.you) return;

    sendChat({
      type: "chat.direct",
      roomId: room.roomId,
      uid: profileUser.id,
      id: crypto.randomUUID(),
      text,
    });
    chatRef.current?.openDirect({ userId: profileUser.id, nick: profileUser.nick });
    setPokeDraft("");
    setProfile(null);
  }

  function handleUserDragEnd() {
    setDraggingId(null);
    setDropId(null);
  }

  function handleChannelDragOver(
    event: DragEvent<HTMLDivElement>,
    channelId: string,
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropId(channelId);
  }

  function handleChannelDrop(
    event: DragEvent<HTMLDivElement>,
    channelId: string,
  ) {
    event.preventDefault();
    const userId = event.dataTransfer.getData("text/plain") || draggingId;
    setDropId(null);
    setDraggingId(null);
    if (userId) moveUser(userId, channelId);
  }

  function openSalaCard(
    event: MouseEvent<HTMLButtonElement>,
    channelId: string,
  ) {
    event.preventDefault();
    event.stopPropagation();
    setProfile(null);
    const maxX = window.innerWidth - 440;
    const maxY = window.innerHeight - 320;
    setEditingSala(false);
    setEditingDesc(false);
    const channel = roster.find((item) => item.id === channelId);
    setSalaDraft(channel?.name ?? "");
    setDescDraft(channel?.description ?? "");
    setSalaCard({
      userId: channelId,
      x: Math.min(event.clientX + 8, maxX),
      y: Math.min(event.clientY + 8, maxY),
    });
  }

  async function saveSalaName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!salaCard || !salaChannel) return;
    const name = (salaDraft.trim() || "Sala").slice(0, CHANNEL_NAME_MAX);
    setSalaError("");
    try {
      const updated = await patchSala({
        roomId: room.roomId,
        channelId: salaCard.userId,
        uid: identity.uid,
        name,
        description: salaChannel.description ?? "",
      });
      setRoster((prev) =>
        prev.map((channel) =>
          channel.id === updated.id
            ? {
                ...channel,
                name: updated.name,
                description: updated.description,
              }
            : channel,
        ),
      );
      setSalaDraft(updated.name);
      setEditingSala(false);
    } catch (reason: unknown) {
      setSalaError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível alterar o nome.",
      );
    }
  }

  async function createChannel() {
    const name = nextSalaName(roster);
    setSalaError("");
    try {
      const created = await createSala({
        roomId: room.roomId,
        uid: identity.uid,
        name,
      });
      setRoster((prev) =>
        upsertChannel(prev, {
          id: created.id,
          name: created.name,
          description: created.description,
        }),
      );
      setOpen((prev) => ({ ...prev, [created.id]: true }));
      setSalaDraft(created.name);
      setDescDraft(created.description);
      setEditingSala(true);
      setEditingDesc(false);
      setSalaCard((prev) => (prev ? { ...prev, userId: created.id } : prev));
    } catch (reason: unknown) {
      setSalaError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível criar a sala.",
      );
    }
  }

  async function deleteChannel(id: string) {
    if (roster.length < 2) return;
    setSalaError("");
    try {
      await deleteSala({
        roomId: room.roomId,
        channelId: id,
        uid: identity.uid,
      });
    } catch (reason: unknown) {
      setSalaError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível apagar a sala.",
      );
      return;
    }

    const leftover = roster.filter((channel) => channel.id !== id);
    setRoster(leftover);
    clearSalaLog(room.roomId, id);
    clearSalaActivity(room.roomId, id);
    setOpen((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (currentId === id) {
      onLeaveSala();
      if (!deafened) playDisconnectSound();
    }
    setSalaCard(null);
    setEditingSala(false);
    setEditingDesc(false);
  }

  async function saveSalaDesc(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!salaCard || !salaChannel) return;
    const description = descDraft.trim().slice(0, CHANNEL_DESC_MAX);
    setSalaError("");
    try {
      const updated = await patchSala({
        roomId: room.roomId,
        channelId: salaCard.userId,
        uid: identity.uid,
        name: salaChannel.name,
        description,
      });
      setRoster((prev) =>
        prev.map((channel) =>
          channel.id === updated.id
            ? {
                ...channel,
                name: updated.name,
                description: updated.description,
              }
            : channel,
        ),
      );
      setDescDraft(updated.description);
      setEditingDesc(false);
    } catch (reason: unknown) {
      setSalaError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível alterar a descrição.",
      );
    }
  }

  return (
    <RoomShell>
      <RoomHeader>
        <RoomHeading>
          <RoomTitle>{room.name}</RoomTitle>
          <RoomMeta>
            <RoomRole>
              <RoomRoleLabel>Cargo:</RoomRoleLabel>
              <RoomRoleValue>{ROLE_LABEL[myRole]}</RoomRoleValue>
            </RoomRole>
            <RoomGear
              type="button"
              title="Configurações do servidor"
              onClick={onOpenSettings}
            >
              <GearIcon />
              Configurações
            </RoomGear>
          </RoomMeta>
        </RoomHeading>
        <Invite>
          <InviteRow>
            <InviteCode>{room.code}</InviteCode>
            <CopyButton type="button" onClick={handleCopy}>
              <CopyIcon />
              Copiar
            </CopyButton>
            <Copied $show={copied} aria-live="polite">
              Copiado!
            </Copied>
          </InviteRow>
        </Invite>
      </RoomHeader>

      <TreeWrap>
        <TreeBar>Salas</TreeBar>
        {salaError ? (
          <ChatLine style={{ color: "#ff8a80", padding: "0 0.85rem 0.4rem" }}>
            {salaError}
          </ChatLine>
        ) : null}
        <Tree>
          {channels.map((channel) => {
            const expanded = open[channel.id] !== false;
            return (
              <ChannelBlock
                key={channel.id}
                $drop={dropId === channel.id}
                onDragOver={(event) => handleChannelDragOver(event, channel.id)}
                onDragLeave={(event) => {
                  if (
                    !event.currentTarget.contains(event.relatedTarget as Node)
                  )
                    setDropId(null);
                }}
                onDrop={(event) => handleChannelDrop(event, channel.id)}
              >
                <ChannelRow $current={channel.id === currentId}>
                  <Chevron
                    type="button"
                    $open={expanded}
                    title={expanded ? "Recolher" : "Expandir"}
                    onClick={() => toggleChannel(channel.id)}
                  >
                    <ChevronIcon />
                  </Chevron>
                  <ChannelHit
                    type="button"
                    onClick={() => joinChannel(channel.id)}
                  >
                    <ChannelName>{channel.name}</ChannelName>
                    {channel.description?.trim() ? (
                      <ChannelDesc title={channel.description}>
                        {channel.description}
                      </ChannelDesc>
                    ) : null}
                    <ChannelCount>
                      {channel.users.length}/{CHANNEL_CAP}
                    </ChannelCount>
                  </ChannelHit>
                  {canManageChannels ? (
                    <ChannelEdit
                      type="button"
                      title="Configurar sala"
                      onClick={(event) => openSalaCard(event, channel.id)}
                    >
                      <GearIcon />
                    </ChannelEdit>
                  ) : null}
                </ChannelRow>
                {expanded ? (
                  <UserList>
                    {channel.users.map((user) => (
                      <UserRow
                        key={user.id}
                        $you={user.you}
                        $dragging={draggingId === user.id}
                        $movable={Boolean(user.you || canMoveOthers)}
                        draggable={Boolean(user.you || canMoveOthers)}
                        title="Ver informações"
                        onClick={(event) => handleUserClick(event, user)}
                        onContextMenu={(event) => openProfile(event, user)}
                        onDragStart={(event) =>
                          handleUserDragStart(event, user.id)
                        }
                        onDragEnd={handleUserDragEnd}
                      >
                        <StatusDot
                          $color={PRESENCE_COLOR[user.presence]}
                          $talking={user.talking}
                          $pending={user.linking}
                        />
                        <UserName>{user.nick}</UserName>
                        {user.muted ? (
                          <UserFlag title="Mudo">
                            <MicOffIcon />
                          </UserFlag>
                        ) : null}
                        {user.deafened ? (
                          <UserFlag title="Ensurdecido">
                            <HeadsetOffIcon />
                          </UserFlag>
                        ) : null}
                        {user.you ? (
                          <UserLeave
                            type="button"
                            title="Sair da sala"
                            onMouseDown={(event) => event.stopPropagation()}
                            onClick={leaveChannel}
                          >
                            Sair
                            <LeaveSalaIcon />
                          </UserLeave>
                        ) : null}
                      </UserRow>
                    ))}
                  </UserList>
                ) : null}
              </ChannelBlock>
            );
          })}
          {canManageChannels ? (
            <SalaCreateWrap>
              <SalaCreate type="button" onClick={() => void createChannel()}>
                Nova sala
              </SalaCreate>
            </SalaCreateWrap>
          ) : null}
        </Tree>
      </TreeWrap>

      {profile && profileUser ? (
        <ProfileCard ref={profileRef} $x={profile.x} $y={profile.y}>
          <ProfileHead>
            <div>
              <ProfileName>{profileUser.nick}</ProfileName>
              <ProfileRole>
                {ROLE_LABEL[profileUser.role ?? "member"]}
              </ProfileRole>
              {canPromoteThis ? (
                <ProfileAdminLink
                  type="button"
                  onClick={() => void toggleAdmin(profileUser.id, true)}
                >
                  Tornar administrador
                </ProfileAdminLink>
              ) : canDemoteThis ? (
                <ProfileAdminLink
                  type="button"
                  $tone="danger"
                  onClick={() => void toggleAdmin(profileUser.id, false)}
                >
                  Remover administrador
                </ProfileAdminLink>
              ) : null}
            </div>
            <ProfileStatus>
              <StatusDot
                $color={PRESENCE_COLOR[profileUser.presence]}
                $talking={profileUser.talking}
                $pending={profileUser.linking}
              />
              {PRESENCE_LABEL[profileUser.presence]}
            </ProfileStatus>
          </ProfileHead>
          <ProfileConnected>
            Conectado: {formatOnline(profileUser.onlineSince)}
          </ProfileConnected>
          {profileUser.you ? null : (
            <VolumeRow>
              <VolumeCaption>Volume</VolumeCaption>
              <VolumeSlider
                type="range"
                min={0}
                max={100}
                value={volumes[profileUser.id] ?? 100}
                onChange={(event) => {
                  const value = clampPeerVolume(Number(event.target.value));
                  setVolumes((prev) => {
                    const next = { ...prev, [profileUser.id]: value };
                    savePeerVolumes(next);
                    return next;
                  });
                }}
              />
              <VolumeValue>{volumes[profileUser.id] ?? 100}%</VolumeValue>
            </VolumeRow>
          )}
          {profileUser.you ? null : (
            <PokeForm onSubmit={handlePoke}>
              <PokeInput
                value={pokeDraft}
                maxLength={CHAT_TEXT_MAX}
                placeholder="Recado rápido"
                onChange={(event) => setPokeDraft(event.target.value)}
              />
              <PokeSend type="submit" disabled={!pokeDraft.trim()}>
                Enviar
              </PokeSend>
            </PokeForm>
          )}
        </ProfileCard>
      ) : null}

      {salaCard && salaChannel && canManageChannels ? (
        <ProfileCard ref={salaCardRef} $x={salaCard.x} $y={salaCard.y}>
          <SalaField>
            <SalaLabel>Nome</SalaLabel>
            {editingSala ? (
              <SalaNameEdit ref={salaEditRef} onSubmit={saveSalaName}>
                <SalaNameInput
                  autoFocus
                  maxLength={CHANNEL_NAME_MAX}
                  value={salaDraft}
                  onChange={(event) => setSalaDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setEditingSala(false);
                  }}
                />
                <SalaNameIcon type="submit" title="Salvar">
                  <CheckIcon />
                </SalaNameIcon>
                <SalaNameIcon
                  type="button"
                  title="Cancelar"
                  onClick={() => setEditingSala(false)}
                >
                  <CloseIcon />
                </SalaNameIcon>
              </SalaNameEdit>
            ) : (
              <SalaNameButton
                type="button"
                title="Alterar nome"
                onClick={() => {
                  setSalaDraft(salaChannel.name);
                  setEditingSala(true);
                }}
              >
                <span>{salaChannel.name}</span>
                <EditIcon />
              </SalaNameButton>
            )}
          </SalaField>
          <SalaField>
            <SalaLabel>Descrição</SalaLabel>
            {editingDesc ? (
              <SalaNameEdit ref={salaDescRef} onSubmit={saveSalaDesc}>
                <SalaNameInput
                  autoFocus
                  maxLength={CHANNEL_DESC_MAX}
                  placeholder="Opcional"
                  value={descDraft}
                  onChange={(event) => setDescDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setDescDraft(salaChannel.description ?? "");
                      setEditingDesc(false);
                    }
                  }}
                />
                <SalaNameIcon type="submit" title="Salvar">
                  <CheckIcon />
                </SalaNameIcon>
                <SalaNameIcon
                  type="button"
                  title="Cancelar"
                  onClick={() => {
                    setDescDraft(salaChannel.description ?? "");
                    setEditingDesc(false);
                  }}
                >
                  <CloseIcon />
                </SalaNameIcon>
              </SalaNameEdit>
            ) : (
              <SalaNameButton
                type="button"
                $empty={!salaChannel.description?.trim()}
                title="Alterar descrição"
                onClick={() => {
                  setDescDraft(salaChannel.description ?? "");
                  setEditingDesc(true);
                }}
              >
                <span>{salaChannel.description?.trim() || "Opcional"}</span>
                <EditIcon />
              </SalaNameButton>
            )}
          </SalaField>
          {roster.length > 1 ? (
            <SalaDelete
              type="button"
              onClick={() => void deleteChannel(salaChannel.id)}
            >
              Excluir sala
            </SalaDelete>
          ) : null}
        </ProfileCard>
      ) : null}

      <WorkspaceChat
        ref={chatRef}
        roomId={room.roomId}
        channelId={currentId}
        channelName={current?.name ?? null}
        identity={identity}
        deafened={Boolean(deafened)}
      />
    </RoomShell>
  );
}
