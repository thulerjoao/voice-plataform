import { useEffect, useRef, useState, type DragEvent, type FormEvent, type MouseEvent, type PointerEvent } from "react";
import type { Bookmark } from "../../bookmarks";
import type { Identity } from "../../identity";
import { playConnectSound, playPokeSound } from "../../sounds";
import {
  ChannelBlock,
  ChannelCount,
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
  Splitter,
  StatusDot,
  Tree,
  UserList,
  UserMeta,
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
      id: "geral",
      name: "Geral",
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
      users: [
        { id: "pedro", nick: "Pedro", presence: "online", talking: true, onlineSince: minutesAgo(41) },
        { id: "ana", nick: "Ana", presence: "online", onlineSince: minutesAgo(165) },
        { id: "rico", nick: "Rico", presence: "brb", onlineSince: minutesAgo(112) },
        { id: "bia", nick: "Bia", presence: "busy", muted: true, onlineSince: minutesAgo(9) },
        { id: "nando", nick: "Nando", presence: "online", deafened: true, onlineSince: minutesAgo(55) },
      ],
    },
    {
      id: "espera",
      name: "Espera",
      users: [
        { id: "gui", nick: "Gui", presence: "online", onlineSince: minutesAgo(2) },
        { id: "duda", nick: "Duda", presence: "brb", onlineSince: minutesAgo(28) },
      ],
    },
    {
      id: "afk",
      name: "AFK",
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

function userFlags(user: MockUser) {
  const bits = [PRESENCE_LABEL[user.presence]];
  if (user.muted) bits.push("mudo");
  if (user.deafened) bits.push("ensurdecido");
  return bits.join(" · ");
}

export function RoomScreen({ room, identity, deafened, onLeave }: RoomScreenProps) {
  const [roster, setRoster] = useState(mockChannels);
  const [currentId, setCurrentId] = useState("geral");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [pokeDraft, setPokeDraft] = useState("");
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [incoming, setIncoming] = useState<PokeAlertState | null>(null);
  const [youSince] = useState(() => Date.now());
  const profileRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const myRole: Role = room.role;
  const canMoveOthers = myRole === "owner" || myRole === "admin";
  const canManageAdmins = myRole === "owner";
  const [open, setOpen] = useState<Record<string, boolean>>({
    geral: true,
    jogando: true,
    espera: true,
    afk: false,
  });
  const [chats, setChats] = useState(SEED_CHAT);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [chatHeight, setChatHeight] = useState<number | null>(loadChatHeight);
  const shellRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLElement>(null);
  const chatHeightRef = useRef(chatHeight);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);
  chatHeightRef.current = chatHeight;

  const you: MockUser = {
    id: "you",
    nick: identity.nickname,
    presence: "online",
    role: myRole,
    onlineSince: youSince,
    you: true,
  };

  const channels = roster.map((channel) =>
    channel.id === currentId ? { ...channel, users: [you, ...channel.users] } : channel,
  );
  const current = channels.find((item) => item.id === currentId) ?? channels[0];
  const profileUser =
    profile == null
      ? null
      : profile.userId === "you"
        ? you
        : (roster.flatMap((channel) => channel.users).find((user) => user.id === profile.userId) ?? null);

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
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
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
          <LeaveButton type="button" onClick={onLeave} title="Só tira esta sala da sua lista">
            Remover da lista
          </LeaveButton>
        </Invite>
      </RoomHeader>

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
                  <ChannelCount>{channel.users.length}</ChannelCount>
                </ChannelHit>
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
                      <UserMeta>{userFlags(user)}</UserMeta>
                    </UserRow>
                  ))}
                </UserList>
              ) : null}
            </ChannelBlock>
          );
        })}
      </Tree>

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
