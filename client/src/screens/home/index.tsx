import {
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
  updateNickname,
  type Identity,
} from "../../identity";
import type { CreatedRoom } from "../../api";
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
  NavItem,
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
  DockRow,
  DockVolume,
  DockSlider,
  DockVolumeValue,
  DockButton,
  SidebarRoom,
  SidebarRoomButton,
  SidebarCallMark,
  SidebarRoomIcon,
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

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M4.5 18c.8-2.4 2.4-3.6 4.5-3.6s3.7 1.2 4.5 3.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle
        cx="16.5"
        cy="9"
        r="2.1"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M19.5 18c-.4-1.6-1.4-2.6-2.8-3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EmptyRoomsArt() {
  return (
    <svg viewBox="0 0 168 96" fill="#8e95a3" aria-hidden="true">
      <circle cx="32" cy="34" r="12" />
      <rect x="14" y="50" width="36" height="24" rx="12" />
      <circle cx="136" cy="34" r="12" />
      <rect x="118" y="50" width="36" height="24" rx="12" />
      <circle cx="84" cy="26" r="16" />
      <rect x="58" y="46" width="52" height="34" rx="16" />
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

export function HomeScreen({ identity, onNicknameChange }: HomeScreenProps) {
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
  const talking = useTalking(Boolean(call) && !muted && !deafened);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(identity.nickname);
  const statusRef = useRef<HTMLDivElement>(null);
  const nickEditRef = useRef<HTMLFormElement>(null);
  const lastViewRef = useRef<View>({ type: "home" });
  const silencedRef = useRef<boolean | null>(null);
  const currentStatus = statusMeta(status);
  const created = view.type === "create" ? view.created : undefined;
  const visibleRoomId = view.type === "room" ? view.roomId : undefined;
  const viewingRoomId =
    visibleRoomId ??
    (view.type === "settings" && lastViewRef.current.type === "room"
      ? lastViewRef.current.roomId
      : undefined);
  const callRoom = call
    ? rooms.find((room) => room.roomId === call.roomId)
    : undefined;
  const mountedRooms = rooms.filter(
    (room) => room.roomId === visibleRoomId || room.roomId === call?.roomId,
  );

  function openEdit() {
    setDraft(identity.nickname);
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(identity.nickname);
    setEditing(false);
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nickname = draft.trim();
    if (!nickname) return;

    const next = updateNickname(nickname);
    if (next) onNicknameChange(next);
    setEditing(false);
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

  function rememberRoom(room: CreatedRoom) {
    return saveBookmark({
      roomId: room.id,
      name: room.name,
      code: room.code,
      role: room.role,
    });
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

  function leaveRoomList(roomId: string) {
    setRooms(removeBookmark(roomId));
    setCall((prev) => (prev?.roomId === roomId ? null : prev));
    setView({ type: "home" });
  }

  function enterCreatedRoom() {
    if (created) enterRoom(created.id);
    else backToHome();
  }

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
            <NickIconButton type="submit" title="Salvar">
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
        <NavItem type="button" onClick={backToHome}>
          <HomeIcon />
          Servidores
        </NavItem>
        {rooms.length > 0 ? (
          <SidebarRooms>
            {rooms.map((room: Bookmark) => {
              const live = call?.roomId === room.roomId;
              return (
                <SidebarRoom key={room.roomId}>
                  <SidebarRoomButton
                    type="button"
                    $active={viewingRoomId === room.roomId}
                    $live={live}
                    onClick={() => enterRoom(room.roomId)}
                    title={live ? `${room.name} · em uma sala` : room.name}
                  >
                    <SidebarRoomIcon $live={live}>
                      <PeopleIcon />
                    </SidebarRoomIcon>
                    <SidebarRoomName>{room.name}</SidebarRoomName>
                    {live ? (
                      <SidebarCallMark aria-hidden="true">
                        <CallMarkIcon />
                      </SidebarCallMark>
                    ) : null}
                  </SidebarRoomButton>
                </SidebarRoom>
              );
            })}
          </SidebarRooms>
        ) : null}
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
              muted={muted}
              deafened={deafened}
              currentId={call?.roomId === room.roomId ? call.salaId : null}
              talking={talking}
              presence={status}
              onLeave={() => leaveRoomList(room.roomId)}
              onJoinSala={(salaId) => setCall({ roomId: room.roomId, salaId })}
              onLeaveSala={() =>
                setCall((prev) =>
                  prev?.roomId === room.roomId ? null : prev,
                )
              }
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
            onBack={closeSettings}
            deafened={deafened}
            onOutputVolume={handleOutputVolume}
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
                  : call
                    ? "Você continua na call"
                    : "Pronto para conversar"}
              </EmptyTitle>
              <EmptyText>
                {rooms.length === 0
                  ? "Crie seu primeiro servidor ou entre em um existente para começar."
                  : call
                    ? `A marca azul na lista é ${callRoom?.name ?? "o servidor da call"}. Clique para voltar.`
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
