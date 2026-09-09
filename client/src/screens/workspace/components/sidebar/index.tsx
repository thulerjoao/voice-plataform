import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  createChannel,
  type RoomChannel,
  type RoomRole,
} from "../../../../api";
import { loadBookmarks, type Bookmark } from "../../../../bookmarks";
import type { Identity } from "../../../../identity";
import {
  sendOccupancy,
  type Occupant,
} from "../../../../occupancy";
import { statusMeta, type StatusId } from "../../../../presence";
import {
  rtcLinkReady,
  rtcPeerTalking,
  subscribeRtcLinks,
  subscribeRtcTalking,
} from "../../../../rtc-session";
import {
  ChevronDownIcon,
  FolderClosedIcon,
  FolderOpenedIcon,
  GroupIcon,
  HeadsetOffIcon,
  MicOffIcon,
  PlusIcon,
  UserIcon,
  VolumeIcon,
} from "../../icons/ui";
import {
  Aside,
  CreateSala,
  MenuCode,
  MenuCopy,
  MenuMark,
  MenuName,
  ResizeHandle,
  SalaBody,
  SalaBlock,
  SalaCount,
  SalaError,
  SalaFolder,
  SalaList,
  SalaMain,
  SalaName,
  SalaRow,
  SalaTitle,
  SalaToggle,
  ServerButton,
  ServerChevron,
  ServerCode,
  ServerCopy,
  ServerMark,
  ServerMenu,
  ServerMenuItem,
  ServerName,
  ServerWrap,
  UserAvatar,
  UserFlag,
  UserName,
  UserRow,
} from "./style";

export const CHANNEL_CAP = 12;
export const SIDEBAR_WIDTH_MIN = 220;
export const SIDEBAR_WIDTH_MAX = 420;
export const SIDEBAR_WIDTH_DEFAULT = 280;
const SIDEBAR_WIDTH_KEY = "voice.sidebarWidth";

export function loadSidebarWidth() {
  const raw = localStorage.getItem(SIDEBAR_WIDTH_KEY);
  const value = raw ? Number(raw) : SIDEBAR_WIDTH_DEFAULT;
  if (!Number.isFinite(value)) return SIDEBAR_WIDTH_DEFAULT;
  return Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, value));
}

export function saveSidebarWidth(width: number) {
  localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width));
  return width;
}

type SalaUser = {
  id: string;
  nick: string;
  statusColor: string;
  muted: boolean;
  deafened: boolean;
  talking: boolean;
  linking: boolean;
  you: boolean;
};

type WorkspaceSidebarProps = {
  roomId: string;
  name: string;
  code: string;
  role?: RoomRole;
  identity: Identity;
  channels: RoomChannel[];
  occupants: Occupant[];
  activeSalaId: string | null;
  status: StatusId;
  muted: boolean;
  deafened: boolean;
  talking: boolean;
  width: number;
  onWidthChange: (width: number) => void;
  onChannelsChange: (channels: RoomChannel[]) => void;
  onEnterSala: (channelId: string) => void;
  onSwitchServer: (roomId: string) => void;
};

function nextSalaName(channels: RoomChannel[]) {
  const used = new Set(channels.map((item) => item.name));
  let index = 1;
  while (used.has(`Sala ${index}`)) index += 1;
  return `Sala ${index}`;
}

function salaIsFull(occupants: Occupant[], channelId: string, uid: string) {
  return (
    occupants.filter(
      (item) => item.channelId === channelId && item.uid !== uid,
    ).length >= CHANNEL_CAP
  );
}

function salaLinking(input: {
  userId: string;
  joinedAt: number;
  myUid: string;
  myJoined: number;
  activeSalaId: string | null;
  occupants: Occupant[];
}) {
  if (!input.activeSalaId) return false;
  if (input.userId === input.myUid) {
    return input.occupants.some(
      (item) =>
        item.channelId === input.activeSalaId &&
        item.uid !== input.myUid &&
        item.joinedAt < input.myJoined &&
        !rtcLinkReady(item.uid),
    );
  }
  return input.joinedAt > input.myJoined && !rtcLinkReady(input.userId);
}

function usersForSala(input: {
  channelId: string;
  occupants: Occupant[];
  activeSalaId: string | null;
  identity: Identity;
  status: StatusId;
  muted: boolean;
  deafened: boolean;
  talking: boolean;
  youSince: number;
}): SalaUser[] {
  const youColor = statusMeta(input.status).color;
  const inCall = input.activeSalaId === input.channelId;
  const myJoined =
    input.occupants.find(
      (item) =>
        item.channelId === input.activeSalaId &&
        item.uid === input.identity.uid,
    )?.joinedAt ?? input.youSince;

  const users = input.occupants
    .filter((item) => item.channelId === input.channelId)
    .map((item) => {
      const you = item.uid === input.identity.uid;
      const muted = you ? input.muted || input.deafened : item.muted;
      const deafened = you ? input.deafened : item.deafened;
      const linking = inCall
        ? salaLinking({
            userId: item.uid,
            joinedAt: item.joinedAt,
            myUid: input.identity.uid,
            myJoined,
            activeSalaId: input.activeSalaId,
            occupants: input.occupants,
          })
        : false;
      return {
        id: item.uid,
        nick: you ? input.identity.nickname : item.nickname,
        statusColor: you ? youColor : statusMeta(item.status).color,
        muted,
        deafened,
        linking,
        talking:
          inCall &&
          !linking &&
          !muted &&
          !deafened &&
          (you ? input.talking : rtcPeerTalking(item.uid)),
        you,
      } satisfies SalaUser;
    });

  if (inCall && !users.some((user) => user.you)) {
    const muted = input.muted || input.deafened;
    const linking = salaLinking({
      userId: input.identity.uid,
      joinedAt: input.youSince,
      myUid: input.identity.uid,
      myJoined,
      activeSalaId: input.activeSalaId,
      occupants: input.occupants,
    });
    users.unshift({
      id: input.identity.uid,
      nick: input.identity.nickname,
      statusColor: youColor,
      muted,
      deafened: input.deafened,
      linking,
      talking: !linking && !muted && !input.deafened && input.talking,
      you: true,
    });
  }

  return users;
}

export function WorkspaceSidebar({
  roomId,
  name,
  code,
  role,
  identity,
  channels,
  occupants,
  activeSalaId,
  status,
  muted,
  deafened,
  talking,
  width,
  onWidthChange,
  onChannelsChange,
  onEnterSala,
  onSwitchServer,
}: WorkspaceSidebarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => loadBookmarks());
  const [youSince] = useState(() => Date.now());
  const [, setLinkTick] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const widthRef = useRef(width);
  widthRef.current = width;

  const canManage = role === "owner" || role === "admin";
  const canMoveOthers = canManage;

  useEffect(() => {
    const bump = () => setLinkTick((value) => value + 1);
    const stopLinks = subscribeRtcLinks(bump);
    const stopTalk = subscribeRtcTalking(bump);
    return () => {
      stopLinks();
      stopTalk();
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointer(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    function handleMove(event: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const next = Math.min(
        SIDEBAR_WIDTH_MAX,
        Math.max(
          SIDEBAR_WIDTH_MIN,
          drag.startWidth + (event.clientX - drag.startX),
        ),
      );
      onWidthChange(next);
    }

    function handleUp() {
      if (!dragRef.current) return;
      dragRef.current = null;
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
      saveSidebarWidth(widthRef.current);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [onWidthChange]);

  function toggleMenu() {
    if (!menuOpen) setBookmarks(loadBookmarks());
    setMenuOpen((value) => !value);
  }

  function startResize(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    dragRef.current = { startX: event.clientX, startWidth: width };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  function moveUser(userId: string, channelId: string) {
    if (userId === identity.uid) {
      onEnterSala(channelId);
      return;
    }

    if (!canMoveOthers) return;
    if (
      occupants.some(
        (item) => item.uid === userId && item.channelId === channelId,
      )
    ) {
      return;
    }
    if (salaIsFull(occupants, channelId, userId)) return;

    sendOccupancy({
      type: "presence.move",
      roomId,
      channelId,
      uid: userId,
    });
  }

  function handleUserDragStart(event: DragEvent<HTMLDivElement>, userId: string) {
    if (userId !== identity.uid && !canMoveOthers) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData("text/plain", userId);
    event.dataTransfer.effectAllowed = "move";
    setDraggingId(userId);
  }

  function handleUserDragEnd() {
    setDraggingId(null);
    setDropId(null);
  }

  function handleSalaDragOver(event: DragEvent<HTMLDivElement>, channelId: string) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropId(channelId);
  }

  function handleSalaDrop(event: DragEvent<HTMLDivElement>, channelId: string) {
    event.preventDefault();
    const userId = event.dataTransfer.getData("text/plain") || draggingId;
    setDropId(null);
    setDraggingId(null);
    if (userId) moveUser(userId, channelId);
  }

  async function handleCreateSala() {
    if (!canManage || creating) return;
    setCreating(true);
    setError("");
    try {
      const created = await createChannel({
        roomId,
        uid: identity.uid,
        name: nextSalaName(channels),
      });
      onChannelsChange([...channels, created]);
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível criar a sala.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <Aside $width={width}>
      <ServerWrap ref={wrapRef}>
        <ServerButton
          type="button"
          $open={menuOpen}
          title="Trocar servidor"
          aria-expanded={menuOpen}
          onClick={toggleMenu}
        >
          <ServerMark>
            <GroupIcon />
          </ServerMark>
          <ServerCopy>
            <ServerName>{name}</ServerName>
            <ServerCode>{code}</ServerCode>
          </ServerCopy>
          <ServerChevron $open={menuOpen}>
            <ChevronDownIcon />
          </ServerChevron>
        </ServerButton>

        {menuOpen ? (
          <ServerMenu role="listbox" aria-label="Servidores">
            {bookmarks.map((item) => (
              <ServerMenuItem
                key={item.roomId}
                type="button"
                role="option"
                $active={item.roomId === roomId}
                aria-selected={item.roomId === roomId}
                onClick={() => {
                  setMenuOpen(false);
                  if (item.roomId !== roomId) onSwitchServer(item.roomId);
                }}
              >
                <MenuMark>
                  <GroupIcon />
                </MenuMark>
                <MenuCopy>
                  <MenuName>{item.name}</MenuName>
                  <MenuCode>{item.code}</MenuCode>
                </MenuCopy>
              </ServerMenuItem>
            ))}
          </ServerMenu>
        ) : null}
      </ServerWrap>

      <SalaList>
        {channels.map((channel) => {
          const active = channel.id === activeSalaId;
          const users = usersForSala({
            channelId: channel.id,
            occupants,
            activeSalaId,
            identity,
            status,
            muted,
            deafened,
            talking,
            youSince,
          });
          const open = users.length > 0;
          return (
            <SalaBlock
              key={channel.id}
              $drop={dropId === channel.id}
              onDragOver={(event) => handleSalaDragOver(event, channel.id)}
              onDragLeave={(event) => {
                if (
                  !event.currentTarget.contains(event.relatedTarget as Node)
                ) {
                  setDropId(null);
                }
              }}
              onDrop={(event) => handleSalaDrop(event, channel.id)}
            >
              <SalaRow
                role="button"
                tabIndex={0}
                title={`Entrar em ${channel.name}`}
                onClick={() => onEnterSala(channel.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onEnterSala(channel.id);
                  }
                }}
              >
                <SalaToggle $open={open} aria-hidden="true">
                  <ChevronDownIcon />
                </SalaToggle>
                <SalaMain>
                  <SalaFolder>
                    {open ? <FolderOpenedIcon /> : <FolderClosedIcon />}
                  </SalaFolder>
                  <SalaTitle>
                    <SalaName>{channel.name}</SalaName>
                  </SalaTitle>
                  <SalaCount>
                    {users.length}/{CHANNEL_CAP}
                  </SalaCount>
                </SalaMain>
              </SalaRow>
              {open ? (
                <SalaBody>
                  {users.map((user) => {
                    const movable = Boolean(user.you || canMoveOthers);
                    return (
                      <UserRow
                        key={user.id}
                        $you={user.you}
                        $active={user.you && active}
                        $dragging={draggingId === user.id}
                        $movable={movable}
                        draggable={movable}
                        title={
                          movable
                            ? "Arraste para outra sala"
                            : undefined
                        }
                        onDragStart={(event) =>
                          handleUserDragStart(event, user.id)
                        }
                        onDragEnd={handleUserDragEnd}
                      >
                        <UserAvatar
                          $statusColor={user.statusColor}
                          $pending={user.linking}
                          title={user.linking ? "Conectando…" : undefined}
                        >
                          <UserIcon />
                        </UserAvatar>
                        <UserName>{user.nick}</UserName>
                        {user.deafened ? (
                          <UserFlag title="Ensurdecido" $tone="mute">
                            <HeadsetOffIcon />
                          </UserFlag>
                        ) : user.muted ? (
                          <UserFlag title="Mudo" $tone="mute">
                            <MicOffIcon />
                          </UserFlag>
                        ) : (
                          <UserFlag
                            title={user.talking ? "Falando" : "Na sala"}
                            $tone={user.talking ? "talk" : undefined}
                          >
                            <VolumeIcon />
                          </UserFlag>
                        )}
                      </UserRow>
                    );
                  })}
                </SalaBody>
              ) : null}
            </SalaBlock>
          );
        })}

        {canManage ? (
          <CreateSala
            type="button"
            disabled={creating}
            onClick={() => void handleCreateSala()}
          >
            <PlusIcon />
            Criar sala
          </CreateSala>
        ) : null}
        {error ? <SalaError>{error}</SalaError> : null}
      </SalaList>

      <ResizeHandle
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionar painel"
        title="Arraste para redimensionar"
        onPointerDown={startResize}
      />
    </Aside>
  );
}
