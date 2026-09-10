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
  NICKNAME_MAX_LENGTH,
  persistNickname,
  saveIdentity,
  type Identity,
} from "../../identity";
import { getRoom, type CreatedRoom } from "../../api";
import type { ClientVersionInfo } from "../../version";
import {
  connectRealtime,
  subscribeRealtime,
  subscribeRealtimeOpen,
} from "../../realtime";
import {
  connectOccupancy,
  sendOccupancy,
  subscribeOccupancy,
} from "../../occupancy";
import {
  connectContactPresence,
  sendContactPresence,
} from "../../contacts-presence";
import { connectAvatarSignal } from "../../avatar-signal";
import { loadStatus } from "../../presence";
import { UpdateScreen } from "../update";
import { CreateRoomScreen } from "./components/create-room";
import { JoinRoomScreen } from "./components/join-room";
import { ServerCard } from "./card";
import serverGroup from "./icons/servergroup.svg";
import {
  CheckIcon,
  CloseIcon,
  EditIcon,
  EnterIcon,
  HomeIcon,
  MicIcon,
  PlusIcon,
} from "./icons/ui";
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
  HomePane,
  Main,
  NickButton,
  NickEdit,
  NickIconButton,
  NickInput,
  NickName,
  PrimaryButton,
  SalasIcon,
  SalasNav,
  SecondaryButton,
  ServerList,
  Shell,
  Sidebar,
  Subtitle,
  Title,
} from "./style";

type HomeScreenProps = {
  identity: Identity;
  onNicknameChange: (identity: Identity) => void;
  onOpenServer: (roomId: string) => void;
};

type View =
  | { type: "home" }
  | { type: "create"; created?: CreatedRoom }
  | { type: "join" };

function RoomActions({
  onCreate,
  onJoin,
  compact,
}: {
  onCreate: () => void;
  onJoin: () => void;
  compact?: boolean;
}) {
  return (
    <Actions
      $compact={compact}
      style={compact ? undefined : { justifyContent: "center" }}
    >
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
  onOpenServer,
}: HomeScreenProps) {
  const [rooms, setRooms] = useState(loadBookmarks);
  const [view, setView] = useState<View>({ type: "home" });
  const [outdated, setOutdated] = useState<ClientVersionInfo | null>(null);
  const [occupancyByRoom, setOccupancyByRoom] = useState<
    Record<string, string[]>
  >({});
  const [editing, setEditing] = useState(false);
  const [savingNick, setSavingNick] = useState(false);
  const [draft, setDraft] = useState(identity.nickname);
  const nickEditRef = useRef<HTMLFormElement>(null);
  const roomsRef = useRef(rooms);
  roomsRef.current = rooms;
  const created = view.type === "create" ? view.created : undefined;

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

  function rememberRoom(room: CreatedRoom) {
    return saveBookmark({
      roomId: room.id,
      name: room.name,
      code: room.code,
      role: room.role,
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

  function handleJoined(room: CreatedRoom) {
    setRooms(rememberRoom(room));
    onOpenServer(room.id);
  }

  function backToHome() {
    setView({ type: "home" });
  }

  function updateRoomBookmark(
    roomId: string,
    patch: Partial<Pick<Bookmark, "name" | "role">>,
  ) {
    setRooms((prev) => {
      const current = prev.find((room) => room.roomId === roomId);
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
  }

  function enterCreatedRoom() {
    if (created) onOpenServer(created.id);
    else backToHome();
  }

  function syncOccupancy() {
    for (const room of roomsRef.current) {
      sendOccupancy({ type: "presence.sync", roomId: room.roomId });
    }
  }

  useEffect(() => {
    const stopData = connectRealtime(identity.uid, {
      onOpen: syncOccupancy,
    });
    const stopOccupancy = connectOccupancy();
    const stopContacts = connectContactPresence();
    sendContactPresence({ type: "contacts.status", status: loadStatus() });
    const stopAvatar = connectAvatarSignal(identity.uid);
    return () => {
      stopAvatar();
      stopContacts();
      stopOccupancy();
      stopData();
    };
  }, [identity.uid]);

  useEffect(() => {
    return subscribeRealtimeOpen(syncOccupancy);
  }, []);

  useEffect(() => {
    syncOccupancy();
  }, [rooms]);

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
      if (event.type === "presence.state") {
        const uids = event.occupants.map((item) => item.uid);
        setOccupancyByRoom((prev) => ({ ...prev, [event.roomId]: uids }));
        return;
      }
      if (event.type === "presence.outdated") {
        setOutdated({ min: event.min, current: event.current });
      }
    });
  }, []);

  if (outdated) {
    return <UpdateScreen info={outdated} />;
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
            <NickIconButton
              type="submit"
              title="Salvar"
              disabled={!draft.trim() || savingNick}
            >
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
        <SalasNav>
          <SalasIcon>
            <HomeIcon />
          </SalasIcon>
          Salas
        </SalasNav>
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
        ) : null}
        {view.type === "join" ? (
          <JoinRoomScreen
            identity={identity}
            onCancel={backToHome}
            onJoined={handleJoined}
          />
        ) : null}
        {view.type === "home" ? (
          <HomePane>
            <Header>
              <HeaderCopy>
                <Title>Servidores</Title>
                <Subtitle>
                  Crie um servidor ou entre com um código para começar a
                  conversar com seu squad.
                </Subtitle>
              </HeaderCopy>
              {rooms.length > 0 ? (
                <RoomActions
                  compact
                  onCreate={() => setView({ type: "create" })}
                  onJoin={() => setView({ type: "join" })}
                />
              ) : null}
            </Header>
            {rooms.length === 0 ? (
              <Empty>
                <EmptyArt>
                  <img src={serverGroup} alt="" aria-hidden="true" />
                </EmptyArt>
                <EmptyTitle>Nenhum servidor ainda</EmptyTitle>
                <EmptyText>
                  Crie seu primeiro servidor ou entre em um existente para
                  começar.
                </EmptyText>
                <RoomActions
                  onCreate={() => setView({ type: "create" })}
                  onJoin={() => setView({ type: "join" })}
                />
              </Empty>
            ) : (
              <ServerList>
                {rooms.map((room) => (
                  <ServerCard
                    key={room.roomId}
                    room={room}
                    seated={occupancyByRoom[room.roomId]?.length ?? 0}
                    onOpen={onOpenServer}
                  />
                ))}
              </ServerList>
            )}
          </HomePane>
        ) : null}
      </Main>
    </Shell>
  );
}
