import { useEffect, useRef, useState, type DragEvent, type FormEvent, type MouseEvent, type PointerEvent } from "react";
import type { Bookmark } from "../../bookmarks";
import type { Identity } from "../../identity";
import { playConnectSound, playPokeSound } from "../../sounds";
import {
  ChannelBlock,
  ChannelCount,
  ChannelDesc,
  ChannelEdit,
  ChannelHit,
  ChannelName,
  ChannelRow,
  Chat,
  ChatForm,
  ChatHead,
  ChatInput,
  ChatLine,
  ChatLog,
  ChatNick,
  ChatSend,
  Chevron,
  Copied,
  CopyButton,
  Invite,
  InviteCode,
  LeaveButton,
  PokeAlert,
  PokeAlertFrom,
  PokeAlertKicker,
  PokeAlertNote,
  PokeAlertText,
  PokeForm,
  PokeInput,
  PokeOverlay,
  PokeSend,
  ProfileActions,
  ProfileAdminLink,
  ProfileButton,
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
  RoomHeader,
  RoomShell,
  RoomTitle,
  SalaCreate,
  SalaCreateWrap,
  SalaDelete,
  SalaHint,
  SalaField,
  SalaLabel,
  SalaNameButton,
  SalaNameEdit,
  SalaNameIcon,
  SalaNameInput,
  Splitter,
  StatusDot,
  Tree,
  TreeBar,
  TreeWrap,
  UserFlag,
  UserList,
  UserName,
  UserRow,
} from "./style";

type Presence = "online" | "busy" | "brb";
type Role = "owner" | "admin" | "member";

type MockUser = {
  id: string;
  nick: string;
  presence: Presence;
  role?: Role;
  onlineSince: number;
  talking?: boolean;
  muted?: boolean;
  deafened?: boolean;
  you?: boolean;
};

type ProfileState = {
  userId: string;
  x: number;
  y: number;
};

type PokeAlertState = {
  from: string;
  text: string;
};

type MockChannel = {
  id: string;
  name: string;
  description?: string;
  users: MockUser[];
};

type ChatMessage = {
  id: string;
  nick: string;
  text: string;
};

type RoomScreenProps = {
  room: Bookmark;
  identity: Identity;
  muted?: boolean;
  deafened?: boolean;
  onLeave: () => void;
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
      <rect x="5.2" y="5.2" width="8" height="8" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.4 10.6V3.8A1.4 1.4 0 0 1 4.8 2.4h6.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
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
      <path d="M3.2 8.2 6.4 11.4 12.8 4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 11a5 5 0 0 0 6.6 4.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 16v3M9 19h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5 5l14 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function HeadsetOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 13V11a7 7 0 0 1 14 0v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <rect x="3.5" y="12.2" width="4.2" height="6.2" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
      <rect x="16.3" y="12.2" width="4.2" height="6.2" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 5l14 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
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

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6.2 8 10.2 12 6.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function minutesAgo(minutes: number) {
  return Date.now() - minutes * 60 * 1000;
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

function mockChannels(): MockChannel[] {
  return [
    {
      id: "espera",
      name: "Espera",
      description: "Todos mutados. Fila pra entrar.",
      users: [
        { id: "gui", nick: "Gui", presence: "online", muted: true, onlineSince: minutesAgo(2) },
        { id: "duda", nick: "Duda", presence: "brb", muted: true, onlineSince: minutesAgo(28) },
      ],
    },
    {
      id: "geral",
      name: "Geral",
      description: "Conversa da galera.",
      users: [
        { id: "joao", nick: "joaov", presence: "online", talking: true, onlineSince: minutesAgo(8) },
        { id: "maria", nick: "Maria", presence: "online", role: "admin", onlineSince: minutesAgo(74) },
        { id: "kadu", nick: "Kadu", presence: "online", muted: true, onlineSince: minutesAgo(21) },
        { id: "lipe", nick: "Lipe", presence: "busy", onlineSince: minutesAgo(3) },
      ],
    },
    {
      id: "jogando",
      name: "Jogando",
      description: "Quem está na partida.",
      users: [
        { id: "pedro", nick: "Pedro", presence: "online", talking: true, onlineSince: minutesAgo(41) },
        { id: "ana", nick: "Ana", presence: "online", onlineSince: minutesAgo(165) },
        { id: "rico", nick: "Rico", presence: "brb", onlineSince: minutesAgo(112) },
        { id: "bia", nick: "Bia", presence: "busy", muted: true, onlineSince: minutesAgo(9) },
        { id: "nando", nick: "Nando", presence: "online", deafened: true, onlineSince: minutesAgo(55) },
      ],
    },
    {
      id: "afk",
      name: "AFK",
      description: "Ausente. Sem pressa.",
      users: [
        { id: "silent", nick: "Silent", presence: "brb", deafened: true, onlineSince: minutesAgo(190) },
        { id: "cafe", nick: "Café", presence: "brb", onlineSince: minutesAgo(63) },
        { id: "afkjoe", nick: "Joe", presence: "busy", onlineSince: minutesAgo(14) },
      ],
    },
  ];
}

const SEED_CHAT: Record<string, ChatMessage[]> = {
  geral: [
    { id: "g1", nick: "Maria", text: "bora ranked?" },
    { id: "g2", nick: "joaov", text: "to na call" },
    { id: "g3", nick: "Kadu", text: "1 min, mutei o mic" },
  ],
  jogando: [
    { id: "j1", nick: "Pedro", text: "espera o round" },
    { id: "j2", nick: "Ana", text: "ok" },
  ],
  espera: [{ id: "e1", nick: "Gui", text: "tem vaga no Jogando?" }],
  afk: [],
};

const WAITING_ID = "espera";
const CHANNEL_CAP = 12;
const CHANNEL_NAME_MAX = 24;
const CHANNEL_DESC_MAX = 80;
const CHAT_MIN = 120;
const CHAT_TREE_MIN = 140;
const CHAT_HEIGHT_KEY = "voice.chatHeight";

function loadChatHeight() {
  const stored = Number(window.localStorage.getItem(CHAT_HEIGHT_KEY));
  if (Number.isFinite(stored) && stored >= CHAT_MIN) return stored;
  return null;
}

function saveChatHeight(height: number) {
  window.localStorage.setItem(CHAT_HEIGHT_KEY, String(Math.round(height)));
}

type SalaMeta = { id: string; name: string; description: string };

function salaMetaKey(roomId: string) {
  return `voice.salas.${roomId}`;
}

function loadSalaMeta(roomId: string): SalaMeta[] | null {
  const raw = window.localStorage.getItem(salaMetaKey(roomId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (item): item is SalaMeta =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as SalaMeta).id === "string" &&
        typeof (item as SalaMeta).name === "string" &&
        typeof (item as SalaMeta).description === "string",
    );
  } catch {
    return null;
  }
}

const DEFAULT_SALA_OPEN: Record<string, boolean> = {
  geral: true,
  jogando: true,
  espera: true,
  afk: false,
};

function salaOpenKey(roomId: string) {
  return `voice.salaOpen.${roomId}`;
}

function loadSalaOpen(roomId: string): Record<string, boolean> | null {
  const raw = window.localStorage.getItem(salaOpenKey(roomId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
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

function saveSalaMeta(roomId: string, roster: MockChannel[]) {
  const meta: SalaMeta[] = roster.map((channel) => ({
    id: channel.id,
    name: channel.name,
    description: channel.description ?? "",
  }));
  window.localStorage.setItem(salaMetaKey(roomId), JSON.stringify(meta));
}

function pinWaitingFirst(channels: MockChannel[]): MockChannel[] {
  const waiting = channels.find((channel) => channel.id === WAITING_ID) ?? {
    id: WAITING_ID,
    name: "Espera",
    description: "Todos mutados. Fila pra entrar.",
    users: [],
  };
  return [waiting, ...channels.filter((channel) => channel.id !== WAITING_ID)];
}

function applySalaMeta(channels: MockChannel[], meta: SalaMeta[] | null): MockChannel[] {
  if (!meta) return pinWaitingFirst(channels);
  const byId = new Map(meta.map((item) => [item.id, item]));
  const merged = channels.map((channel) => {
    const hit = byId.get(channel.id);
    return hit ? { ...channel, name: hit.name, description: hit.description } : channel;
  });
  const extras = meta
    .filter((item) => !channels.some((channel) => channel.id === item.id))
    .map((item) => ({ id: item.id, name: item.name, description: item.description, users: [] }));
  return pinWaitingFirst([...merged, ...extras]);
}

export function RoomScreen({ room, identity, muted, deafened, onLeave }: RoomScreenProps) {
  const [roster, setRoster] = useState(() => applySalaMeta(mockChannels(), loadSalaMeta(room.roomId)));
  const [currentId, setCurrentId] = useState("geral");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [pokeDraft, setPokeDraft] = useState("");
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [incoming, setIncoming] = useState<PokeAlertState | null>(null);
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
  const myRole: Role = room.role;
  const canMoveOthers = myRole === "owner" || myRole === "admin";
  const canManageChannels = myRole === "owner" || myRole === "admin";
  const canManageAdmins = myRole === "owner";
  const [open, setOpen] = useState<Record<string, boolean>>(
    () => loadSalaOpen(room.roomId) ?? DEFAULT_SALA_OPEN,
  );
  const [chats, setChats] = useState(SEED_CHAT);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [chatHeight, setChatHeight] = useState<number | null>(loadChatHeight);
  const shellRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLElement>(null);
  const chatHeightRef = useRef(chatHeight);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);
  chatHeightRef.current = chatHeight;

  useEffect(() => {
    saveSalaMeta(room.roomId, roster);
  }, [room.roomId, roster]);

  useEffect(() => {
    saveSalaOpen(room.roomId, open);
  }, [room.roomId, open]);

  const you: MockUser = {
    id: "you",
    nick: identity.nickname,
    presence: "online",
    role: myRole,
    onlineSince: youSince,
    muted: currentId === WAITING_ID || muted || deafened,
    deafened,
    talking: currentId === WAITING_ID ? false : undefined,
    you: true,
  };

  const channels = pinWaitingFirst(roster).map((channel) => {
    const users = channel.id === currentId ? [you, ...channel.users] : channel.users;
    if (channel.id !== WAITING_ID) return { ...channel, users };
    return {
      ...channel,
      users: users.map((user) => ({ ...user, muted: true, talking: false })),
    };
  });
  const current = channels.find((item) => item.id === currentId) ?? channels[0];
  const profileUser =
    profile == null
      ? null
      : profile.userId === "you"
        ? you
        : (roster.flatMap((channel) => channel.users).find((user) => user.id === profile.userId) ?? null);
  const salaChannel = salaCard ? (roster.find((channel) => channel.id === salaCard.userId) ?? null) : null;

  useEffect(() => {
    if (!profile) return;

    function handlePointer(event: globalThis.MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
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
      if (editingSala && salaEditRef.current && !salaEditRef.current.contains(target)) {
        setEditingSala(false);
        return;
      }
      if (editingDesc && salaDescRef.current && !salaDescRef.current.contains(target)) {
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

    setCurrentId(id);
    setDraft("");
    if (!deafened) playConnectSound();
  }

  function moveUser(userId: string, channelId: string) {
    if (userId === "you") {
      joinChannel(channelId);
      return;
    }

    if (!canMoveOthers) return;

    const alreadyThere = roster.find((channel) => channel.id === channelId)?.users.some((item) => item.id === userId);
    if (alreadyThere) return;

    setRoster((prev) => {
      const user = prev.flatMap((channel) => channel.users).find((item) => item.id === userId);
      if (!user) return prev;

      return prev.map((channel) => ({
        ...channel,
        users:
          channel.id === channelId
            ? [...channel.users, user]
            : channel.users.filter((item) => item.id !== userId),
      }));
    });
    setOpen((prev) => ({ ...prev, [channelId]: true }));
    if (channelId === currentId && !deafened) playConnectSound();
  }

  function handleUserDragStart(event: DragEvent<HTMLLIElement>, userId: string) {
    if (userId !== "you" && !canMoveOthers) {
      event.preventDefault();
      return;
    }

    draggedRef.current = true;
    setProfile(null);
    event.dataTransfer.setData("text/plain", userId);
    event.dataTransfer.effectAllowed = "move";
    setDraggingId(userId);
  }

  function openProfile(event: MouseEvent<HTMLLIElement>, user: MockUser) {
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

  function handleUserClick(event: MouseEvent<HTMLLIElement>, user: MockUser) {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    openProfile(event, user);
  }

  function toggleAdmin(userId: string, makeAdmin: boolean) {
    setRoster((prev) =>
      prev.map((channel) => ({
        ...channel,
        users: channel.users.map((user) =>
          user.id === userId ? { ...user, role: makeAdmin ? "admin" : "member" } : user,
        ),
      })),
    );
  }

  function handlePoke(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = pokeDraft.trim();
    if (!text || !profileUser || profileUser.you) return;

    setPokeDraft("");
    setProfile(null);
    setIncoming({ from: identity.nickname, text });
    if (!deafened) playPokeSound();
  }

  function closePoke() {
    setIncoming(null);
  }

  function handleUserDragEnd() {
    setDraggingId(null);
    setDropId(null);
  }

  function handleChannelDragOver(event: DragEvent<HTMLDivElement>, channelId: string) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropId(channelId);
  }

  function handleChannelDrop(event: DragEvent<HTMLDivElement>, channelId: string) {
    event.preventDefault();
    const userId = event.dataTransfer.getData("text/plain") || draggingId;
    setDropId(null);
    setDraggingId(null);
    if (userId) moveUser(userId, channelId);
  }

  function clampChatHeight(next: number) {
    const shell = shellRef.current;
    const header = shell?.querySelector("header")?.clientHeight ?? 56;
    const max = shell ? Math.max(CHAT_MIN, shell.clientHeight - header - CHAT_TREE_MIN - 24) : 420;
    return Math.min(max, Math.max(CHAT_MIN, next));
  }

  function handleSplitDown(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const startH = chatHeight ?? chatRef.current?.getBoundingClientRect().height ?? 184;
    dragRef.current = { startY: event.clientY, startH };
  }

  function handleSplitMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const next = clampChatHeight(dragRef.current.startH + (dragRef.current.startY - event.clientY));
    chatHeightRef.current = next;
    setChatHeight(next);
  }

  function handleSplitUp() {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (chatHeightRef.current != null) saveChatHeight(chatHeightRef.current);
  }

  function renameChannel(id: string, name: string) {
    setRoster((prev) => prev.map((channel) => (channel.id === id ? { ...channel, name } : channel)));
  }

  function openSalaCard(event: MouseEvent<HTMLButtonElement>, channelId: string) {
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

  function saveSalaName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!salaCard) return;
    const name = salaDraft.trim() || "Sala";
    renameChannel(salaCard.userId, name.slice(0, CHANNEL_NAME_MAX));
    setEditingSala(false);
  }

  function createChannel() {
    const id = `ch-${Date.now()}`;
    const name = `Sala ${roster.length + 1}`;
    setRoster((prev) => [...prev, { id, name, description: "", users: [] }]);
    setOpen((prev) => ({ ...prev, [id]: true }));
    setChats((prev) => ({ ...prev, [id]: [] }));
    setSalaDraft(name);
    setDescDraft("");
    setEditingSala(true);
    setEditingDesc(false);
    setSalaCard((prev) => (prev ? { ...prev, userId: id } : prev));
  }

  function deleteChannel(id: string) {
    if (id === WAITING_ID) return;

    const removed = roster.find((channel) => channel.id === id);
    const leftover = roster.filter((channel) => channel.id !== id);
    const target = leftover.find((channel) => channel.id === WAITING_ID) ?? leftover[0];
    if (!removed || !target) return;

    setRoster(
      leftover.map((channel) =>
        channel.id === target.id ? { ...channel, users: [...channel.users, ...removed.users] } : channel,
      ),
    );
    setChats((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setOpen((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (currentId === id) {
      setCurrentId(target.id);
      setDraft("");
      if (!deafened) playConnectSound();
    }
    setSalaCard(null);
    setEditingSala(false);
    setEditingDesc(false);
  }

  function saveSalaDesc(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!salaCard) return;
    const description = descDraft.trim().slice(0, CHANNEL_DESC_MAX);
    setRoster((prev) =>
      prev.map((channel) => (channel.id === salaCard.userId ? { ...channel, description } : channel)),
    );
    setDescDraft(description);
    setEditingDesc(false);
  }

  function handleChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    setChats((prev) => ({
      ...prev,
      [current.id]: [
        ...(prev[current.id] ?? []),
        { id: `${current.id}-${Date.now()}`, nick: identity.nickname, text },
      ],
    }));
    setDraft("");
  }

  return (
    <RoomShell ref={shellRef}>
      <RoomHeader>
        <RoomTitle>{room.name}</RoomTitle>
        <Invite>
          <InviteCode>{room.code}</InviteCode>
          <CopyButton type="button" onClick={handleCopy}>
            <CopyIcon />
            Copiar
          </CopyButton>
          <Copied aria-live="polite">{copied ? "Copiado!" : ""}</Copied>
          <LeaveButton type="button" onClick={onLeave} title="Só tira este servidor da sua lista">
            Remover da lista
          </LeaveButton>
        </Invite>
      </RoomHeader>

      <TreeWrap>
        <TreeBar>Salas</TreeBar>
        <Tree>
        {channels.map((channel) => {
          const expanded = open[channel.id] !== false;
          return (
            <ChannelBlock
              key={channel.id}
              $drop={dropId === channel.id}
              onDragOver={(event) => handleChannelDragOver(event, channel.id)}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropId(null);
              }}
              onDrop={(event) => handleChannelDrop(event, channel.id)}
            >
              <ChannelRow $current={channel.id === current.id}>
                <Chevron
                  type="button"
                  $open={expanded}
                  title={expanded ? "Recolher" : "Expandir"}
                  onClick={() => toggleChannel(channel.id)}
                >
                  <ChevronIcon />
                </Chevron>
                <ChannelHit type="button" onClick={() => joinChannel(channel.id)}>
                  <ChannelName>{channel.name}</ChannelName>
                  {channel.description?.trim() ? (
                    <ChannelDesc title={channel.description}>{channel.description}</ChannelDesc>
                  ) : null}
                  <ChannelCount>
                    {channel.users.length}/{CHANNEL_CAP}
                  </ChannelCount>
                </ChannelHit>
                {canManageChannels ? (
                  <ChannelEdit type="button" title="Configurar sala" onClick={(event) => openSalaCard(event, channel.id)}>
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
                      onDragStart={(event) => handleUserDragStart(event, user.id)}
                      onDragEnd={handleUserDragEnd}
                    >
                      <StatusDot $color={PRESENCE_COLOR[user.presence]} $talking={user.talking} />
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
                    </UserRow>
                  ))}
                </UserList>
              ) : null}
            </ChannelBlock>
          );
        })}
        {canManageChannels ? (
          <SalaCreateWrap>
            <SalaCreate type="button" onClick={createChannel}>
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
              <ProfileRole>{ROLE_LABEL[profileUser.role ?? "member"]}</ProfileRole>
              {canManageAdmins && !profileUser.you ? (
                profileUser.role === "admin" ? (
                  <ProfileAdminLink type="button" $tone="danger" onClick={() => toggleAdmin(profileUser.id, false)}>
                    Remover administrador
                  </ProfileAdminLink>
                ) : (
                  <ProfileAdminLink type="button" onClick={() => toggleAdmin(profileUser.id, true)}>
                    Tornar administrador
                  </ProfileAdminLink>
                )
              ) : null}
            </div>
            <ProfileStatus>
              <StatusDot $color={PRESENCE_COLOR[profileUser.presence]} $talking={profileUser.talking} />
              {PRESENCE_LABEL[profileUser.presence]}
            </ProfileStatus>
          </ProfileHead>
          <ProfileConnected>Conectado: {formatOnline(profileUser.onlineSince)}</ProfileConnected>
          <VolumeRow>
            <VolumeCaption>Volume</VolumeCaption>
            <VolumeSlider
              type="range"
              min={0}
              max={100}
              value={volumes[profileUser.id] ?? 100}
              onChange={(event) =>
                setVolumes((prev) => ({ ...prev, [profileUser.id]: Number(event.target.value) }))
              }
            />
            <VolumeValue>{volumes[profileUser.id] ?? 100}%</VolumeValue>
          </VolumeRow>
          {profileUser.you ? null : (
            <PokeForm onSubmit={handlePoke}>
              <PokeInput
                value={pokeDraft}
                maxLength={120}
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
                <SalaNameIcon type="button" title="Cancelar" onClick={() => setEditingSala(false)}>
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
          {salaChannel.id === WAITING_ID ? (
            <SalaHint>Sala fixa · todos mutados</SalaHint>
          ) : (
            <SalaDelete type="button" onClick={() => deleteChannel(salaChannel.id)}>
              Excluir sala
            </SalaDelete>
          )}
        </ProfileCard>
      ) : null}

      {incoming ? (
        <PokeOverlay onClick={closePoke}>
          <PokeAlert
            role="alertdialog"
            aria-label="Recado"
            onClick={(event) => event.stopPropagation()}
          >
            <PokeAlertKicker>Alguém quer falar com você</PokeAlertKicker>
            <PokeAlertFrom>{incoming.from}</PokeAlertFrom>
            <PokeAlertText>{incoming.text}</PokeAlertText>
            <PokeAlertNote>Visualização única · some ao fechar</PokeAlertNote>
            <ProfileActions>
              <ProfileButton type="button" onClick={closePoke}>
                Fechar
              </ProfileButton>
            </ProfileActions>
          </PokeAlert>
        </PokeOverlay>
      ) : null}

      <Splitter
        role="separator"
        aria-orientation="horizontal"
        aria-label="Redimensionar chat"
        onPointerDown={handleSplitDown}
        onPointerMove={handleSplitMove}
        onPointerUp={handleSplitUp}
        onPointerCancel={handleSplitUp}
      />

      <Chat ref={chatRef} $height={chatHeight ?? undefined}>
        <ChatHead>
          Chat · {current.name}
        </ChatHead>
        <ChatLog>
          {(chats[current.id] ?? []).length === 0 ? (
            <ChatLine style={{ color: "#8d8d93" }}>Nenhuma mensagem neste canal.</ChatLine>
          ) : (
            (chats[current.id] ?? []).map((line) => (
              <ChatLine key={line.id}>
                <ChatNick>{line.nick}:</ChatNick> {line.text}
              </ChatLine>
            ))
          )}
        </ChatLog>
        <ChatForm onSubmit={handleChat}>
          <ChatInput
            value={draft}
            placeholder={`Mensagem em ${current.name}`}
            onChange={(event) => setDraft(event.target.value)}
          />
          <ChatSend type="submit">Enviar</ChatSend>
        </ChatForm>
      </Chat>
    </RoomShell>
  );
}
