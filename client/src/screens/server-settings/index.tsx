import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  getRoom,
  renameRoom,
  ROOM_NAME_MAX,
  ROOM_NAME_MIN,
  type RoomMember,
} from "../../api";
import type { Bookmark } from "../../bookmarks";
import {
  BackButton,
  BackRow,
  Body,
  CodeRow,
  CodeValue,
  CopyButton,
  ErrorText,
  Field,
  FieldLabel,
  Heading,
  Lead,
  MetaValue,
  NameButton,
  NameEdit,
  NameIcon,
  NameInput,
  NameValue,
  Panel,
  Section,
  SectionTitle,
  StaffList,
  StaffMeta,
  StaffActions,
  StaffName,
  StaffRole,
  StaffRow,
  StaffAction,
  StaffIcon,
} from "./style";

type ServerSettingsScreenProps = {
  room: Bookmark;
  uid: string;
  nickname: string;
  onBack: () => void;
  onUpdated: (patch: Pick<Bookmark, "name" | "role">) => void;
};

const ROLE_LABEL: Record<RoomMember["role"], string> = {
  owner: "Dono",
  admin: "Admin",
  member: "Membro",
};

const ROLE_RANK: Record<RoomMember["role"], number> = {
  owner: 0,
  admin: 1,
  member: 2,
};

const MOCK_MEMBERS: RoomMember[] = [
  { uid: "mock-maria", nickname: "Maria", role: "admin" },
  { uid: "mock-kadu", nickname: "Kadu", role: "member" },
  { uid: "mock-lipe", nickname: "Lipe", role: "member" },
  { uid: "mock-gui", nickname: "Gui", role: "member" },
  { uid: "mock-duda", nickname: "Duda", role: "member" },
];

const MOCK_BLOCKED: RoomMember[] = [
  { uid: "mock-rico", nickname: "Rico", role: "member" },
];

function withMockMembers(list: RoomMember[], uid: string): RoomMember[] {
  const ids = new Set(list.map((item) => item.uid));
  return [
    ...list,
    ...MOCK_MEMBERS.filter((item) => item.uid !== uid && !ids.has(item.uid)),
  ];
}

function orderMembers(list: RoomMember[], uid: string): RoomMember[] {
  const you = list.filter((item) => item.uid === uid);
  const rest = list
    .filter((item) => item.uid !== uid)
    .slice()
    .sort((a, b) => ROLE_RANK[a.role] - ROLE_RANK[b.role]);
  return [...you, ...rest];
}

function BackIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M10 3.2 5.2 8 10 12.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
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

function BanIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.6" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4.15 11.85 11.85 4.15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExcludeIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ServerSettingsScreen({
  room,
  uid,
  nickname,
  onBack,
  onUpdated,
}: ServerSettingsScreenProps) {
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [members, setMembers] = useState<RoomMember[] | null>(null);
  const [blocked, setBlocked] = useState<RoomMember[]>(MOCK_BLOCKED);
  const canModerate = room.role === "owner" || room.role === "admin";
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(room.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const nameEditRef = useRef<HTMLFormElement>(null);
  const onUpdatedRef = useRef(onUpdated);
  onUpdatedRef.current = onUpdated;
  const canRename = room.role === "owner" || room.role === "admin";
  const trimmed = draft.trim();
  const canSave =
    trimmed.length >= ROOM_NAME_MIN &&
    trimmed.length <= ROOM_NAME_MAX &&
    trimmed !== room.name &&
    !saving;

  useEffect(() => {
    let cancelled = false;
    setCreatedAt(null);
    setMembers(null);
    setBlocked(MOCK_BLOCKED);
    setError("");

    void getRoom({ roomId: room.roomId, uid })
      .then((details) => {
        if (cancelled) return;
        setCreatedAt(details.createdAt);
        setMembers(
          withMockMembers(details.members, uid).filter(
            (item) => !MOCK_BLOCKED.some((person) => person.uid === item.uid),
          ),
        );
        onUpdatedRef.current({ name: details.name, role: details.role });
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setCreatedAt("");
        setMembers(
          withMockMembers([], uid).filter(
            (item) => !MOCK_BLOCKED.some((person) => person.uid === item.uid),
          ),
        );
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar o servidor.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [room.roomId, uid]);

  useEffect(() => {
    if (!editing) return;

    function handlePointer(event: MouseEvent) {
      if (!nameEditRef.current?.contains(event.target as Node)) {
        setEditing(false);
        setDraft(room.name);
      }
    }

    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [editing, room.name]);

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

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setError("");
    try {
      const details = await renameRoom({
        roomId: room.roomId,
        uid,
        name: trimmed,
      });
      onUpdated({ name: details.name, role: details.role });
      setCreatedAt(details.createdAt);
      setMembers(
        withMockMembers(details.members, uid).filter(
          (item) => !blocked.some((person) => person.uid === item.uid),
        ),
      );
      setEditing(false);
      setDraft(details.name);
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível alterar o nome.",
      );
    } finally {
      setSaving(false);
    }
  }

  function excludePerson(person: RoomMember) {
    setMembers((prev) =>
      (prev ?? []).filter((item) => item.uid !== person.uid),
    );
  }

  function blockPerson(person: RoomMember) {
    setMembers((prev) =>
      (prev ?? []).filter((item) => item.uid !== person.uid),
    );
    setBlocked((prev) =>
      prev.some((item) => item.uid === person.uid) ? prev : [...prev, person],
    );
  }

  function unblockPerson(person: RoomMember) {
    setBlocked((prev) => prev.filter((item) => item.uid !== person.uid));
    setMembers((prev) => {
      const list = prev ?? [];
      if (list.some((item) => item.uid === person.uid)) return list;
      return [...list, person];
    });
  }

  function cancelEdit() {
    setDraft(room.name);
    setEditing(false);
  }

  return (
    <Panel>
      <BackRow>
        <BackButton type="button" onClick={onBack}>
          <BackIcon />
          <span>Voltar</span>
        </BackButton>
      </BackRow>
      <Body>
        <Heading>Configurações do servidor</Heading>
        <Lead>Nome, código, data e membros deste servidor.</Lead>

        <Section>
          <SectionTitle>Informações</SectionTitle>
          <Field>
            <FieldLabel>Nome</FieldLabel>
            {canRename && editing ? (
              <NameEdit ref={nameEditRef} onSubmit={handleSave}>
                <NameInput
                  autoFocus
                  maxLength={ROOM_NAME_MAX}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <NameIcon type="submit" title="Salvar" disabled={!canSave}>
                  <CheckIcon />
                </NameIcon>
                <NameIcon type="button" title="Cancelar" onClick={cancelEdit}>
                  <CloseIcon />
                </NameIcon>
              </NameEdit>
            ) : canRename ? (
              <NameButton
                type="button"
                title="Alterar nome"
                onClick={() => {
                  setDraft(room.name);
                  setEditing(true);
                  setError("");
                }}
              >
                <span>{room.name}</span>
                <EditIcon />
              </NameButton>
            ) : (
              <NameValue>{room.name}</NameValue>
            )}
          </Field>
          <Field>
            <FieldLabel>Código</FieldLabel>
            <CodeRow>
              <CodeValue>{room.code}</CodeValue>
              <CopyButton type="button" onClick={handleCopy} aria-live="polite">
                <CopyIcon />
                {copied ? "Copiado!" : "Copiar"}
              </CopyButton>
            </CodeRow>
          </Field>
          <Field>
            <FieldLabel>Criado em</FieldLabel>
            <MetaValue>
              {createdAt
                ? formatCreatedAt(createdAt)
                : createdAt === ""
                  ? "—"
                  : "…"}
            </MetaValue>
          </Field>
          <Field>
            <FieldLabel>Membros</FieldLabel>
            {members === null ? (
              <MetaValue>…</MetaValue>
            ) : members.length === 0 ? (
              <MetaValue>—</MetaValue>
            ) : (
              <StaffList>
                {orderMembers(members, uid).map((person) => {
                  const you = person.uid === uid;
                  const showActions =
                    canModerate &&
                    !you &&
                    person.role !== "owner" &&
                    (room.role === "owner" || person.role === "member");
                  return (
                    <StaffRow key={person.uid} $you={you}>
                      <StaffName>{you ? nickname : person.nickname}</StaffName>
                      <StaffMeta>
                        {canModerate ? (
                          <StaffActions>
                            {showActions ? (
                              <>
                                <StaffIcon
                                  type="button"
                                  title="Excluir do servidor"
                                  onClick={() => excludePerson(person)}
                                >
                                  <ExcludeIcon />
                                </StaffIcon>
                                <StaffIcon
                                  type="button"
                                  $tone="danger"
                                  title="Bloquear"
                                  onClick={() => blockPerson(person)}
                                >
                                  <BanIcon />
                                </StaffIcon>
                              </>
                            ) : null}
                          </StaffActions>
                        ) : null}
                        <StaffRole>{ROLE_LABEL[person.role]}</StaffRole>
                      </StaffMeta>
                    </StaffRow>
                  );
                })}
              </StaffList>
            )}
          </Field>
          {canModerate ? (
            <Field>
              <FieldLabel>Bloqueados</FieldLabel>
              {blocked.length === 0 ? (
                <MetaValue>Ninguém bloqueado</MetaValue>
              ) : (
                <StaffList>
                  {blocked.map((person) => (
                    <StaffRow key={person.uid}>
                      <StaffName>{person.nickname}</StaffName>
                      <StaffMeta>
                        <StaffAction
                          type="button"
                          onClick={() => unblockPerson(person)}
                        >
                          Desbloquear
                        </StaffAction>
                      </StaffMeta>
                    </StaffRow>
                  ))}
                </StaffList>
              )}
            </Field>
          ) : null}
          {error ? <ErrorText>{error}</ErrorText> : null}
        </Section>
      </Body>
    </Panel>
  );
}
