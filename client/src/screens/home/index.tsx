import { useState, type FormEvent, type KeyboardEvent } from "react";
import { loadBookmarks, type Bookmark } from "../../bookmarks";
import {
  NICKNAME_MAX_LENGTH,
  updateNickname,
  type Identity,
} from "../../identity";
import {
  Actions,
  AdminBadge,
  Brand,
  BrandIcon,
  Chevron,
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
  RoomCard,
  RoomCode,
  RoomIcon,
  RoomList,
  RoomMeta,
  RoomName,
  SecondaryButton,
  Shell,
  Sidebar,
  Subtitle,
  Title,
} from "./style";

type HomeScreenProps = {
  identity: Identity;
  onNicknameChange: (identity: Identity) => void;
};

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

function EnterIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.4" y="2.4" width="11.2" height="11.2" rx="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.2 8h5.2M9.4 5.8 11.6 8 9.4 10.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RoomActions({ stacked }: { stacked?: boolean }) {
  return (
    <Actions style={stacked ? { justifyContent: "center" } : undefined}>
      <PrimaryButton type="button">
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

function Rooms({ rooms }: { rooms: Bookmark[] }) {
  if (rooms.length === 0) {
    return (
      <Empty>
        <EmptyArt>
          <EmptyRoomsArt />
        </EmptyArt>
        <EmptyTitle>Nenhuma sala ainda</EmptyTitle>
        <EmptyText>Crie sua primeira sala ou entre em uma existente para começar.</EmptyText>
        <RoomActions stacked />
      </Empty>
    );
  }

  return (
    <RoomList>
      {rooms.map((room) => (
        <li key={room.roomId}>
          <RoomCard type="button">
            <RoomIcon>
              <PeopleIcon />
            </RoomIcon>
            <RoomMeta>
              <RoomName>
                {room.name}
                {room.role !== "member" ? <AdminBadge>Você é admin</AdminBadge> : null}
              </RoomName>
              <RoomCode>{room.code}</RoomCode>
            </RoomMeta>
            <Chevron aria-hidden>›</Chevron>
          </RoomCard>
        </li>
      ))}
    </RoomList>
  );
}

export function HomeScreen({ identity, onNicknameChange }: HomeScreenProps) {
  const [rooms] = useState(loadBookmarks);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(identity.nickname);

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
          <NickEdit onSubmit={handleSave}>
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
        <NavItem>
          <HomeIcon />
          Salas
        </NavItem>
      </Sidebar>

      <Main>
        <Header>
          <HeaderCopy>
            <Title>Salas</Title>
            <Subtitle>Crie uma sala ou entre com um código para começar a conversar com seu squad.</Subtitle>
          </HeaderCopy>
          {rooms.length > 0 ? <RoomActions /> : null}
        </Header>
        <Rooms rooms={rooms} />
      </Main>
    </Shell>
  );
}
