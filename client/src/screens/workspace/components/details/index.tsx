import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  ROOM_NAME_MAX,
  ROOM_NAME_MIN,
  SALA_DESC_MAX,
  SALA_NAME_MAX,
  deleteChannel,
  leaveRoom,
  renameRoom,
  unblockMember,
  updateChannel,
  type RoomBlocked,
  type RoomChannel,
  type RoomMember,
  type RoomRole,
} from "../../../../api";
import type { Identity } from "../../../../identity";
import { BackIcon, CopyIcon, UserIcon } from "../../icons/ui";
import {
  ActionButton,
  ActionStack,
  Aside,
  CodeRow,
  CodeValue,
  CollapseButton,
  CollapseRail,
  CopyButton,
  Desc,
  Divider,
  Empty,
  ErrorText,
  Field,
  FieldLabel,
  Head,
  HeadTitle,
  Hint,
  IconButton,
  Meta,
  Panel,
  PersonAction,
  PersonAvatar,
  PersonBadge,
  PersonCopy,
  PersonList,
  PersonMain,
  PersonMeta,
  PersonName,
  PersonRow,
  Scroll,
  SubSection,
  SubTitle,
  Tab,
  TabBar,
  TitleButton,
  TitleEdit,
  TitleInput,
  TitleText,
} from "./style";

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

const COLLAPSED_KEY = "voice.detailsCollapsed";

type DetailsTab = "server" | "sala";

const ROLE_LABEL: Record<RoomRole, string> = {
  owner: "Dono",
  admin: "Admin",
  member: "Membro",
};

const ROLE_RANK: Record<RoomRole, number> = {
  owner: 0,
  admin: 1,
  member: 2,
};

function loadCollapsed() {
  return window.localStorage.getItem(COLLAPSED_KEY) === "1";
}

function saveCollapsed(value: boolean) {
  window.localStorage.setItem(COLLAPSED_KEY, value ? "1" : "0");
}

function orderMembers(list: RoomMember[], uid: string) {
  const you = list.filter((item) => item.uid === uid);
  const rest = list
    .filter((item) => item.uid !== uid)
    .slice()
    .sort((a, b) => ROLE_RANK[a.role] - ROLE_RANK[b.role]);
  return [...you, ...rest];
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type WorkspaceDetailsProps = {
  roomId: string;
  serverName: string;
  serverCode: string;
  createdAt: string | null;
  identity: Identity;
  role?: RoomRole;
  sala: RoomChannel | null;
  salaCount: number;
  salaCap: number;
  channelCount: number;
  members: RoomMember[];
  blocked: RoomBlocked[];
  onLeaveSala: () => void;
  onPatchChannel: (channel: RoomChannel) => void;
  onRemoveChannel: (channelId: string) => void;
  onServerUpdated: (patch: { name?: string; role?: RoomRole }) => void;
  onMembersChange: (members: RoomMember[]) => void;
  onBlockedChange: (blocked: RoomBlocked[]) => void;
  onLeftServer: () => void;
  /** Futuro: abre inspect no Stage central. */
  onSelectUser?: (user: { uid: string; nickname: string }) => void;
};

export function WorkspaceDetails({
  roomId,
  serverName,
  serverCode,
  createdAt,
  identity,
  role,
  sala,
  salaCount,
  salaCap,
  channelCount,
  members,
  blocked,
  onLeaveSala,
  onPatchChannel,
  onRemoveChannel,
  onServerUpdated,
  onMembersChange,
  onBlockedChange,
  onLeftServer,
  onSelectUser,
}: WorkspaceDetailsProps) {
  const [collapsed, setCollapsed] = useState(loadCollapsed);
  const [tab, setTab] = useState<DetailsTab>("server");
  const [editingSala, setEditingSala] = useState(false);
  const [editingSalaDesc, setEditingSalaDesc] = useState(false);
  const [editingServer, setEditingServer] = useState(false);
  const [salaNameDraft, setSalaNameDraft] = useState("");
  const [salaDescDraft, setSalaDescDraft] = useState("");
  const [serverNameDraft, setServerNameDraft] = useState(serverName);
  const [busy, setBusy] = useState(false);
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDeleteSala, setConfirmDeleteSala] = useState(false);
  const [error, setError] = useState("");
  const serverEditRef = useRef<HTMLFormElement>(null);
  const salaEditRef = useRef<HTMLFormElement>(null);
  const salaDescRef = useRef<HTMLFormElement>(null);
  const deleteSalaRef = useRef<HTMLDivElement>(null);
  const leaveServerRef = useRef<HTMLDivElement>(null);

  const canManage = role === "owner" || role === "admin";
  const canLeave = role === "member" || role === "admin";

  useEffect(() => {
    setTab("server");
    setCollapsed(false);
    saveCollapsed(false);
    setEditingServer(false);
    setConfirmLeave(false);
    setError("");
  }, [roomId]);

  useEffect(() => {
    if (!sala?.id) return;
    setTab("sala");
    setCollapsed(false);
    saveCollapsed(false);
  }, [sala?.id]);

  useEffect(() => {
    setEditingSala(false);
    setEditingSalaDesc(false);
    setConfirmDeleteSala(false);
    setError("");
  }, [sala?.id]);

  useEffect(() => {
    if (!editingServer) setServerNameDraft(serverName);
  }, [serverName, editingServer]);

  useEffect(() => {
    if (!editingSala && sala) setSalaNameDraft(sala.name);
  }, [sala, editingSala]);

  useEffect(() => {
    if (!editingSalaDesc && sala) setSalaDescDraft(sala.description ?? "");
  }, [sala, editingSalaDesc]);

  useEffect(() => {
    if (!editingServer) return;

    function handlePointer(event: MouseEvent) {
      if (
        serverEditRef.current &&
        !serverEditRef.current.contains(event.target as Node)
      ) {
        cancelServerEdit();
      }
    }

    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [editingServer, serverName]);

  useEffect(() => {
    if (!editingSala && !editingSalaDesc) return;

    function handlePointer(event: MouseEvent) {
      const target = event.target as Node;
      if (
        editingSala &&
        salaEditRef.current &&
        !salaEditRef.current.contains(target)
      ) {
        cancelSalaEdit();
      }
      if (
        editingSalaDesc &&
        salaDescRef.current &&
        !salaDescRef.current.contains(target)
      ) {
        cancelSalaDescEdit();
      }
    }

    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [editingSala, editingSalaDesc, sala]);

  useEffect(() => {
    if (!confirmDeleteSala) return;

    function handlePointer(event: MouseEvent) {
      if (
        deleteSalaRef.current &&
        !deleteSalaRef.current.contains(event.target as Node)
      ) {
        setConfirmDeleteSala(false);
      }
    }

    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [confirmDeleteSala]);

  useEffect(() => {
    if (!confirmLeave) return;

    function handlePointer(event: MouseEvent) {
      if (
        leaveServerRef.current &&
        !leaveServerRef.current.contains(event.target as Node)
      ) {
        setConfirmLeave(false);
      }
    }

    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [confirmLeave]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      saveCollapsed(next);
      return next;
    });
  }

  function openServerEdit() {
    setServerNameDraft(serverName);
    setEditingServer(true);
    setError("");
  }

  function cancelServerEdit() {
    setServerNameDraft(serverName);
    setEditingServer(false);
    setError("");
  }

  function handleServerKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") cancelServerEdit();
  }

  function openSalaEdit() {
    if (!sala || !canManage) return;
    setEditingSalaDesc(false);
    setSalaNameDraft(sala.name);
    setEditingSala(true);
    setError("");
  }

  function cancelSalaEdit() {
    if (sala) setSalaNameDraft(sala.name);
    setEditingSala(false);
    setError("");
  }

  function handleSalaKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") cancelSalaEdit();
  }

  function openSalaDescEdit() {
    if (!sala || !canManage) return;
    setEditingSala(false);
    setSalaDescDraft(sala.description ?? "");
    setEditingSalaDesc(true);
    setError("");
  }

  function cancelSalaDescEdit() {
    if (sala) setSalaDescDraft(sala.description ?? "");
    setEditingSalaDesc(false);
    setError("");
  }

  function handleSalaDescKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") cancelSalaDescEdit();
  }

  async function saveSalaName(event: FormEvent) {
    event.preventDefault();
    if (!sala || !canManage || busy) return;
    const name = (salaNameDraft.trim() || "Sala").slice(0, SALA_NAME_MAX);
    if (name === sala.name) {
      setEditingSala(false);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const updated = await updateChannel({
        roomId,
        channelId: sala.id,
        uid: identity.uid,
        name,
        description: sala.description ?? "",
      });
      onPatchChannel(updated);
      setEditingSala(false);
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível alterar o nome.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveSalaDesc(event: FormEvent) {
    event.preventDefault();
    if (!sala || !canManage || busy) return;
    const description = salaDescDraft.trim().slice(0, SALA_DESC_MAX);
    if (description === (sala.description ?? "").trim()) {
      setEditingSalaDesc(false);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const updated = await updateChannel({
        roomId,
        channelId: sala.id,
        uid: identity.uid,
        name: sala.name,
        description,
      });
      onPatchChannel(updated);
      setSalaDescDraft(updated.description ?? "");
      setEditingSalaDesc(false);
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível alterar a descrição.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeSala() {
    if (!sala || !canManage || busy || channelCount <= 1) return;
    if (!confirmDeleteSala) {
      setConfirmDeleteSala(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await deleteChannel({
        roomId,
        channelId: sala.id,
        uid: identity.uid,
      });
      onRemoveChannel(sala.id);
      setEditingSala(false);
      setConfirmDeleteSala(false);
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível excluir a sala.",
      );
      setConfirmDeleteSala(false);
    } finally {
      setBusy(false);
    }
  }

  async function saveServerName(event: FormEvent) {
    event.preventDefault();
    if (!canManage || busy) return;
    const trimmed = serverNameDraft.trim();
    if (
      trimmed.length < ROOM_NAME_MIN ||
      trimmed.length > ROOM_NAME_MAX ||
      trimmed === serverName
    ) {
      setEditingServer(false);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const details = await renameRoom({
        roomId,
        uid: identity.uid,
        name: trimmed,
      });
      onServerUpdated({ name: details.name, role: details.role });
      onMembersChange(details.members);
      onBlockedChange(details.blocked ?? []);
      setEditingServer(false);
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível alterar o nome.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(serverCode);
    } catch {
      const field = document.createElement("textarea");
      field.value = serverCode;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function handleUnblock(person: RoomBlocked) {
    if (busyUid) return;
    setBusyUid(person.uid);
    setError("");
    try {
      const details = await unblockMember({
        roomId,
        uid: identity.uid,
        memberUid: person.uid,
      });
      onMembersChange(details.members);
      onBlockedChange(details.blocked ?? []);
      onServerUpdated({ name: details.name, role: details.role });
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível desbloquear.",
      );
    } finally {
      setBusyUid(null);
    }
  }

  async function handleLeaveServer() {
    if (!canLeave || busy) return;
    if (!confirmLeave) {
      setConfirmLeave(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await leaveRoom({ roomId, uid: identity.uid });
      onLeftServer();
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível sair do servidor.",
      );
      setBusy(false);
      setConfirmLeave(false);
    }
  }

  function selectUser(uid: string, nickname: string) {
    onSelectUser?.({ uid, nickname });
  }

  if (collapsed) {
    return (
      <Aside $collapsed aria-label="Detalhes">
        <CollapseRail
          type="button"
          title="Expandir detalhes"
          aria-label="Expandir detalhes"
          aria-expanded={false}
          onClick={toggleCollapsed}
        >
          <BackIcon />
        </CollapseRail>
      </Aside>
    );
  }

  return (
    <Aside aria-label="Detalhes">
      <Head
        as="button"
        title="Ocultar detalhes"
        aria-label="Ocultar detalhes"
        aria-expanded
        onClick={toggleCollapsed}
      >
        <HeadTitle>Detalhes</HeadTitle>
        <CollapseButton>
          <span style={{ display: "grid", transform: "scaleX(-1)" }}>
            <BackIcon />
          </span>
        </CollapseButton>
      </Head>

      <TabBar role="tablist" aria-label="Detalhes">
        <Tab
          type="button"
          role="tab"
          aria-selected={tab === "server"}
          $active={tab === "server"}
          onClick={() => setTab("server")}
        >
          Servidor
        </Tab>
        <Tab
          type="button"
          role="tab"
          aria-selected={tab === "sala"}
          $active={tab === "sala"}
          onClick={() => setTab("sala")}
        >
          Sala
        </Tab>
      </TabBar>

      <Scroll>
        {tab === "server" ? (
          <Panel role="tabpanel">
            <Field>
              <FieldLabel>Nome</FieldLabel>
              {editingServer && canManage ? (
                <TitleEdit
                  ref={serverEditRef}
                  onSubmit={(event) => void saveServerName(event)}
                >
                  <TitleInput
                    autoFocus
                    maxLength={ROOM_NAME_MAX}
                    value={serverNameDraft}
                    onChange={(event) => setServerNameDraft(event.target.value)}
                    onKeyDown={handleServerKeyDown}
                  />
                  <IconButton
                    type="submit"
                    title="Salvar"
                    disabled={busy || !serverNameDraft.trim()}
                  >
                    <CheckIcon />
                  </IconButton>
                  <IconButton
                    type="button"
                    title="Cancelar"
                    disabled={busy}
                    onClick={cancelServerEdit}
                  >
                    <CloseIcon />
                  </IconButton>
                </TitleEdit>
              ) : canManage ? (
                <TitleButton
                  type="button"
                  title="Alterar nome"
                  onClick={openServerEdit}
                >
                  <TitleText>{serverName}</TitleText>
                  <EditIcon />
                </TitleButton>
              ) : (
                <TitleText as="h2" title={serverName}>
                  {serverName}
                </TitleText>
              )}
            </Field>

            <Field>
              <FieldLabel>Código de acesso</FieldLabel>
              <CodeRow>
                <CodeValue>{serverCode}</CodeValue>
                <CopyButton type="button" onClick={() => void copyCode()}>
                  <CopyIcon />
                  {copied ? "Copiado!" : "Copiar"}
                </CopyButton>
              </CodeRow>
            </Field>

            <Meta>
              {createdAt ? `Criado em ${formatCreatedAt(createdAt)}.` : "-"}
            </Meta>

            {canManage ? (
              <>
                <Divider />
                <SubSection>
                  <SubTitle>Membros ({members.length})</SubTitle>
                  {members.length === 0 ? (
                    <Empty>Nenhum membro.</Empty>
                  ) : (
                    <PersonList>
                      {orderMembers(members, identity.uid).map((person) => {
                        const you = person.uid === identity.uid;
                        const displayName = you
                          ? identity.nickname
                          : person.nickname;
                        return (
                          <PersonRow
                            key={person.uid}
                            $you={you}
                            $interactive
                            role="button"
                            tabIndex={0}
                            title={`Ver ${displayName}`}
                            onClick={() => selectUser(person.uid, displayName)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                selectUser(person.uid, displayName);
                              }
                            }}
                          >
                            <PersonMain>
                              <PersonAvatar>
                                <UserIcon />
                              </PersonAvatar>
                              <PersonCopy>
                                <PersonName>
                                  {displayName}
                                  {person.role === "owner" ? (
                                    <PersonBadge title="Dono">👑</PersonBadge>
                                  ) : null}
                                  {person.role === "admin" ? (
                                    <PersonBadge title="Admin">🛡️</PersonBadge>
                                  ) : null}
                                  {person.role === "member" ? (
                                    <PersonBadge title="Membro">🪵</PersonBadge>
                                  ) : null}
                                </PersonName>
                                <PersonMeta>
                                  {you
                                    ? `Você · ${ROLE_LABEL[person.role]}`
                                    : ROLE_LABEL[person.role]}
                                </PersonMeta>
                              </PersonCopy>
                            </PersonMain>
                          </PersonRow>
                        );
                      })}
                    </PersonList>
                  )}
                </SubSection>

                <SubSection>
                  <SubTitle>Bloqueados ({blocked.length})</SubTitle>
                  {blocked.length === 0 ? (
                    <Empty>Ninguém bloqueado.</Empty>
                  ) : (
                    <PersonList>
                      {blocked.map((person) => (
                        <PersonRow key={person.uid}>
                          <PersonMain>
                            <PersonAvatar>
                              <UserIcon />
                            </PersonAvatar>
                            <PersonCopy>
                              <PersonName>{person.nickname}</PersonName>
                              <PersonMeta>Bloqueado</PersonMeta>
                            </PersonCopy>
                          </PersonMain>
                          <PersonAction
                            type="button"
                            disabled={busyUid === person.uid}
                            onClick={() => void handleUnblock(person)}
                          >
                            Desbloquear
                          </PersonAction>
                        </PersonRow>
                      ))}
                    </PersonList>
                  )}
                </SubSection>
              </>
            ) : null}

            {canLeave ? (
              <ActionStack>
                <div
                  ref={leaveServerRef}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                  }}
                >
                  <ActionButton
                    type="button"
                    $tone="danger"
                    disabled={busy}
                    onClick={() => void handleLeaveServer()}
                  >
                    {confirmLeave
                      ? "Confirmar saída"
                      : "Sair do servidor"}
                  </ActionButton>
                  {confirmLeave ? (
                    <Hint>
                      Isto remove seu acesso a este servidor. Para entrar novamente, você precisará do código de acesso.
                    </Hint>
                  ) : null}
                </div>
              </ActionStack>
            ) : null}
          </Panel>
        ) : (
          <Panel role="tabpanel">
            {!sala ? (
              <Empty>Entre em uma sala para ver detalhes.</Empty>
            ) : (
              <>
                <Field>
                  <FieldLabel>Nome</FieldLabel>
                  {editingSala && canManage ? (
                    <TitleEdit
                      ref={salaEditRef}
                      onSubmit={(event) => void saveSalaName(event)}
                    >
                      <TitleInput
                        autoFocus
                        maxLength={SALA_NAME_MAX}
                        value={salaNameDraft}
                        onChange={(event) =>
                          setSalaNameDraft(event.target.value)
                        }
                        onKeyDown={handleSalaKeyDown}
                      />
                      <IconButton
                        type="submit"
                        title="Salvar"
                        disabled={busy || !salaNameDraft.trim()}
                      >
                        <CheckIcon />
                      </IconButton>
                      <IconButton
                        type="button"
                        title="Cancelar"
                        disabled={busy}
                        onClick={cancelSalaEdit}
                      >
                        <CloseIcon />
                      </IconButton>
                    </TitleEdit>
                  ) : canManage ? (
                    <TitleButton
                      type="button"
                      title="Alterar nome"
                      onClick={openSalaEdit}
                    >
                      <TitleText>{sala.name}</TitleText>
                      <EditIcon />
                    </TitleButton>
                  ) : (
                    <TitleText title={sala.name}>{sala.name}</TitleText>
                  )}
                </Field>

                <Field>
                  <FieldLabel>Descrição</FieldLabel>
                  {editingSalaDesc && canManage ? (
                    <TitleEdit
                      ref={salaDescRef}
                      onSubmit={(event) => void saveSalaDesc(event)}
                    >
                      <TitleInput
                        autoFocus
                        maxLength={SALA_DESC_MAX}
                        placeholder="Opcional"
                        value={salaDescDraft}
                        onChange={(event) =>
                          setSalaDescDraft(event.target.value)
                        }
                        onKeyDown={handleSalaDescKeyDown}
                      />
                      <IconButton type="submit" title="Salvar" disabled={busy}>
                        <CheckIcon />
                      </IconButton>
                      <IconButton
                        type="button"
                        title="Cancelar"
                        disabled={busy}
                        onClick={cancelSalaDescEdit}
                      >
                        <CloseIcon />
                      </IconButton>
                    </TitleEdit>
                  ) : canManage ? (
                    <TitleButton
                      type="button"
                      $empty={!sala.description?.trim()}
                      title="Alterar descrição"
                      onClick={openSalaDescEdit}
                    >
                      <TitleText>
                        {sala.description?.trim() || "Sem descrição"}
                      </TitleText>
                      <EditIcon />
                    </TitleButton>
                  ) : (
                    <Desc $empty={!sala.description?.trim()}>
                      {sala.description?.trim() || "Sem descrição"}
                    </Desc>
                  )}
                </Field>

                <Meta>
                  {salaCount}/{salaCap} na sala
                </Meta>

                <ActionStack>
                  <ActionButton
                    type="button"
                    $tone="ghost"
                    onClick={onLeaveSala}
                  >
                    Sair da sala
                  </ActionButton>
                  {canManage && channelCount > 1 ? (
                    <div
                      ref={deleteSalaRef}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                      }}
                    >
                      <ActionButton
                        type="button"
                        $tone="danger"
                        disabled={busy}
                        onClick={() => void removeSala()}
                      >
                        {confirmDeleteSala
                          ? "Confirmar exclusão"
                          : "Excluir sala"}
                      </ActionButton>
                      {confirmDeleteSala ? (
                        <Hint>
                          Isto remove permanentemente a sala “{sala.name}”
                        </Hint>
                      ) : null}
                    </div>
                  ) : null}
                </ActionStack>
              </>
            )}
          </Panel>
        )}

        {error ? <ErrorText>{error}</ErrorText> : null}
      </Scroll>
    </Aside>
  );
}
