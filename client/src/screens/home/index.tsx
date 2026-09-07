import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { loadBookmarks, saveBookmark, type Bookmark } from "../../bookmarks";
import { loadStatus, saveStatus, STATUSES, statusMeta, type StatusId } from "../../presence";
import {
  NICKNAME_MAX_LENGTH,
  updateNickname,
  type Identity,
} from "../../identity";
import type { CreatedRoom } from "../../api";
import { CreateRoomScreen } from "../create-room";
import { RoomScreen } from "../room";
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
  DockButton,
  SidebarRoom,
  SidebarRoomButton,
  SidebarRoomCode,
  SidebarRoomIcon,
  SidebarRoomMeta,
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

type View =
  | { type: "home" }
  | { type: "create"; created?: CreatedRoom }
  | { type: "room"; roomId: string }
  | { type: "settings" };

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 11a5 5 0 0 0 10 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 16v3M9 19h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 11.5 12 5l8 6.5V20H4v-8.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.5 18c.8-2.4 2.4-3.6 4.5-3.6s3.7 1.2 4.5 3.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="16.5" cy="9" r="2.1" stroke="currentColor" strokeWidth="1.7" />
      <path d="M19.5 18c-.4-1.6-1.4-2.6-2.8-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
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
      <path d="M8 3.2v9.6M3.2 8h9.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function HeadsetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 13V11a7 7 0 0 1 14 0v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <rect x="3.5" y="12.2" width="4.2" height="6.2" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
      <rect x="16.3" y="12.2" width="4.2" height="6.2" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
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
      <rect x="2.4" y="2.4" width="11.2" height="11.2" rx="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.2 8h5.2M9.4 5.8 11.6 8 9.4 10.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RoomActions({ onCreate }: { onCreate: () => void }) {
  return (
    <Actions style={{ justifyContent: "center" }}>
      <PrimaryButton type="button" onClick={onCreate}>
        <PlusIcon />
        Criar sala
      </PrimaryButton>
      <SecondaryButton type="button">
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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(identity.nickname);
  const statusRef = useRef<HTMLDivElement>(null);
  const nickEditRef = useRef<HTMLFormElement>(null);
  const currentStatus = statusMeta(status);
  const created = view.type === "create" ? view.created : undefined;
  const openRoom = view.type === "room" ? rooms.find((room) => room.roomId === view.roomId) : undefined;

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
      if (nickEditRef.current && !nickEditRef.current.contains(event.target as Node)) {
        cancelEdit();
      }
    }

    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [editing]);

  useEffect(() => {
    if (!statusOpen) return;

    function handlePointer(event: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
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

  function handleCreated(room: CreatedRoom) {
    setRooms(
      saveBookmark({
        roomId: room.id,
        name: room.name,
        code: room.code,
        role: room.role,
      }),
    );
    setView({ type: "create", created: room });
  }

  function backToHome() {
    setView({ type: "home" });
  }

  function enterCreatedRoom() {
    if (created) setView({ type: "room", roomId: created.id });
    else backToHome();
  }

  return (
    <Shell>
      <Sidebar>
        <Brand>
          <BrandIcon>
            <MicIcon />
          </BrandIcon>
          Voice
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
          Salas
        </NavItem>
        {rooms.length > 0 ? (
          <SidebarRooms>
            {rooms.map((room: Bookmark) => (
              <SidebarRoom key={room.roomId}>
                <SidebarRoomButton
                  type="button"
                  $active={openRoom?.roomId === room.roomId}
                  onClick={() => setView({ type: "room", roomId: room.roomId })}
                >
                  <SidebarRoomIcon>
                    <PeopleIcon />
                  </SidebarRoomIcon>
                  <SidebarRoomMeta>
                    <SidebarRoomName>{room.name}</SidebarRoomName>
                    <SidebarRoomCode>{room.code}</SidebarRoomCode>
                  </SidebarRoomMeta>
                </SidebarRoomButton>
              </SidebarRoom>
            ))}
          </SidebarRooms>
        ) : null}
        <SidebarDock>
          <DockButton
            type="button"
            $on={muted || deafened}
            title={muted || deafened ? "Ativar microfone" : "Silenciar microfone"}
            onClick={() => setMuted((value) => !value)}
          >
            {muted || deafened ? <MicOffIcon /> : <MicIcon />}
          </DockButton>
          <DockButton
            type="button"
            $on={deafened}
            title={deafened ? "Ouvir de novo" : "Ensurdecer"}
            onClick={() => {
              setDeafened((value) => {
                const next = !value;
                setMuted(next);
                return next;
              });
            }}
          >
            <HeadsetIcon />
          </DockButton>
          <DockButton type="button" title="Configurações" onClick={() => setView({ type: "settings" })}>
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
        </SidebarDock>
      </Sidebar>

      <Main>
        {view.type === "create" ? (
          <CreateRoomScreen
            identity={identity}
            created={created}
            onCancel={backToHome}
            onCreated={handleCreated}
            onEnter={enterCreatedRoom}
          />
        ) : view.type === "settings" ? (
          <>
            <Header>
              <HeaderCopy>
                <Title>Configurações</Title>
                <Subtitle>Ajustes do app entram aqui. Por enquanto o nickname se edita na barra à esquerda.</Subtitle>
              </HeaderCopy>
            </Header>
          </>
        ) : openRoom ? (
          <RoomScreen room={openRoom} identity={identity} />
        ) : (
          <>
            <Header>
              <HeaderCopy>
                <Title>Salas</Title>
                <Subtitle>Crie uma sala ou entre com um código para começar a conversar com seu squad.</Subtitle>
              </HeaderCopy>
            </Header>
            <Empty>
              <EmptyArt>
                <EmptyRoomsArt />
              </EmptyArt>
              <EmptyTitle>{rooms.length === 0 ? "Nenhuma sala ainda" : "Pronto para conversar"}</EmptyTitle>
              <EmptyText>
                {rooms.length === 0
                  ? "Crie sua primeira sala ou entre em uma existente para começar."
                  : "Suas salas estão à esquerda. Crie outra ou entre com um código."}
              </EmptyText>
              <RoomActions onCreate={() => setView({ type: "create" })} />
            </Empty>
          </>
        )}
      </Main>
    </Shell>
  );
}
