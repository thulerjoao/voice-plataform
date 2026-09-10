import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  getKnownAvatarHash,
  subscribeAvatarHash,
} from "../../../../avatar-signal";
import {
  avatarToObjectUrl,
  loadPeerAvatarForDisplay,
  subscribeAvatarCache,
} from "../../../../avatar-store";
import {
  CONTACT_NICK_MAX,
  addContact,
  findContact,
  loadContacts,
  loadRecentContacts,
  removeContact,
  subscribeContacts,
  updateContact,
  type Contact,
  type RecentContact,
  type RecentSource,
} from "../../../../contacts";
import {
  syncContactPresence,
  subscribeContactPresence,
  type ContactPresenceStatus,
} from "../../../../contacts-presence";
import { BackIcon, UserIcon } from "../../icons/ui";
import {
  AddActions,
  AddButton,
  AddCancel,
  AddError,
  AddField,
  AddForm,
  AddInput,
  AddSubmit,
  Aside,
  CollapseButton,
  CollapseRail,
  Empty,
  Head,
  HeadTitle,
  PersonAvatar,
  PersonCopy,
  PersonItem,
  PersonList,
  PersonMeta,
  PersonName,
  PersonRow,
  RemoveButton,
  Scroll,
  Section,
  SectionTitle,
  StatusDot,
  Tab,
  TabBar,
} from "./style";

const COLLAPSED_KEY = "voice.detailsCollapsed";
const UID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DetailsTab = "recent" | "contacts";

type ListPerson = {
  uid: string;
  nickname: string;
  meta?: string;
  avatarHash?: string;
};

const STATUS_COLOR: Record<ContactPresenceStatus, string> = {
  online: "#30d158",
  busy: "#ff453a",
  brb: "#ffd60a",
  offline: "#636366",
};

const STATUS_LABEL: Record<ContactPresenceStatus, string> = {
  online: "Online",
  busy: "Ocupado",
  brb: "Volto logo",
  offline: "Offline",
};

function loadCollapsed() {
  return window.localStorage.getItem(COLLAPSED_KEY) === "1";
}

function saveCollapsed(value: boolean) {
  window.localStorage.setItem(COLLAPSED_KEY, value ? "1" : "0");
}

function fromContacts(list: Contact[]): ListPerson[] {
  return list.map((item) => ({
    uid: item.uid,
    nickname: item.nickname,
    avatarHash: item.avatarHash ?? getKnownAvatarHash(item.uid) ?? undefined,
  }));
}

function recentMeta(source: RecentSource): string {
  if (source === "dm") return "Mensagem";
  if (source === "call") return "Em call";
  return "Perfil";
}

function fromRecent(list: RecentContact[]): ListPerson[] {
  return list.map((item) => ({
    uid: item.uid,
    nickname: item.nickname,
    meta: recentMeta(item.source),
    avatarHash: getKnownAvatarHash(item.uid) ?? undefined,
  }));
}

type WorkspaceDetailsProps = {
  selfUid: string;
  onSelectContact?: (user: { uid: string; nickname: string }) => void;
};

export function WorkspaceDetails({
  selfUid,
  onSelectContact,
}: WorkspaceDetailsProps) {
  const [collapsed, setCollapsed] = useState(loadCollapsed);
  const [tab, setTab] = useState<DetailsTab>("recent");
  const [contacts, setContacts] = useState(loadContacts);
  const [recent, setRecent] = useState(loadRecentContacts);
  const [adding, setAdding] = useState(false);
  const [uidDraft, setUidDraft] = useState("");
  const [nickDraft, setNickDraft] = useState("");
  const [addError, setAddError] = useState("");
  const [presence, setPresence] = useState<
    Record<string, ContactPresenceStatus>
  >({});
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const photoUrlsRef = useRef<string[]>([]);

  const contactPeople = useMemo(
    () => fromContacts(contacts),
    [contacts, hashes],
  );
  const recentPeople = useMemo(() => fromRecent(recent), [recent, hashes]);

  const watchUids = useMemo(() => {
    const ids = new Set<string>();
    for (const person of contactPeople) ids.add(person.uid);
    for (const person of recentPeople) ids.add(person.uid);
    return [...ids];
  }, [contactPeople, recentPeople]);

  useEffect(() => {
    setContacts(loadContacts());
    setRecent(loadRecentContacts());
    return subscribeContacts(() => {
      setContacts(loadContacts());
      setRecent(loadRecentContacts());
    });
  }, []);

  useEffect(() => {
    syncContactPresence(watchUids);
  }, [watchUids]);

  useEffect(() => {
    return subscribeContactPresence((event) => {
      if (event.type === "contacts.snapshot") {
        const nextPresence: Record<string, ContactPresenceStatus> = {};
        const nextHashes: Record<string, string> = {};
        for (const person of event.people) {
          nextPresence[person.uid] = person.status;
          if (person.avatarHash) {
            nextHashes[person.uid] = person.avatarHash;
            updateContact(person.uid, { avatarHash: person.avatarHash });
          }
        }
        setPresence(nextPresence);
        setHashes((prev) => ({ ...prev, ...nextHashes }));
        setContacts(loadContacts());
        return;
      }
      setPresence((prev) => ({ ...prev, [event.uid]: event.status }));
    });
  }, []);

  useEffect(() => {
    return subscribeAvatarHash((event) => {
      setHashes((prev) => {
        if (!event.hash) {
          const next = { ...prev };
          delete next[event.uid];
          return next;
        }
        return { ...prev, [event.uid]: event.hash };
      });
      if (event.hash) updateContact(event.uid, { avatarHash: event.hash });
      setContacts(loadContacts());
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const people = [...contactPeople, ...recentPeople];
      const next: Record<string, string> = {};
      const created: string[] = [];

      for (const person of people) {
        const hash = hashes[person.uid] ?? person.avatarHash;
        if (!hash) continue;
        const stored = await loadPeerAvatarForDisplay(person.uid, hash);
        if (cancelled) {
          for (const url of created) URL.revokeObjectURL(url);
          return;
        }
        if (!stored) continue;
        const url = avatarToObjectUrl(stored);
        created.push(url);
        next[person.uid] = url;
      }

      if (cancelled) {
        for (const url of created) URL.revokeObjectURL(url);
        return;
      }

      const previous = photoUrlsRef.current;
      photoUrlsRef.current = created;
      setPhotos(next);
      for (const url of previous) URL.revokeObjectURL(url);
    }

    void hydrate();
    const stopCache = subscribeAvatarCache(() => {
      void hydrate();
    });

    return () => {
      cancelled = true;
      stopCache();
    };
  }, [contactPeople, recentPeople, hashes]);

  useEffect(() => {
    return () => {
      for (const url of photoUrlsRef.current) URL.revokeObjectURL(url);
      photoUrlsRef.current = [];
    };
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      saveCollapsed(next);
      return next;
    });
  }

  function openAdd() {
    setAdding(true);
    setUidDraft("");
    setNickDraft("");
    setAddError("");
  }

  function cancelAdd() {
    setAdding(false);
    setUidDraft("");
    setNickDraft("");
    setAddError("");
  }

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const uid = uidDraft.trim();
    const nickname = nickDraft.trim().slice(0, CONTACT_NICK_MAX);
    if (!UID_RE.test(uid)) {
      setAddError("Informe um uid válido (UUID).");
      return;
    }
    if (uid === selfUid) {
      setAddError("Você não pode se adicionar.");
      return;
    }
    if (!nickname) {
      setAddError("Informe um apelido.");
      return;
    }
    const knownHash = getKnownAvatarHash(uid) ?? undefined;
    setContacts(addContact({ uid, nickname, avatarHash: knownHash }));
    setTab("contacts");
    cancelAdd();
  }

  function handleRemove(uid: string) {
    setContacts(removeContact(uid));
  }

  function handleAddFromRecent(person: ListPerson) {
    const knownHash = getKnownAvatarHash(person.uid) ?? undefined;
    setContacts(
      addContact({
        uid: person.uid,
        nickname: person.nickname,
        avatarHash: knownHash,
      }),
    );
    setTab("contacts");
  }

  function selectPerson(person: ListPerson) {
    onSelectContact?.({ uid: person.uid, nickname: person.nickname });
  }

  if (collapsed) {
    return (
      <Aside $collapsed aria-label="Contatos">
        <CollapseRail
          type="button"
          title="Expandir painel"
          aria-label="Expandir painel"
          aria-expanded={false}
          onClick={toggleCollapsed}
        >
          <BackIcon />
        </CollapseRail>
      </Aside>
    );
  }

  const people = tab === "recent" ? recentPeople : contactPeople;
  const sectionLabel =
    tab === "recent"
      ? `Recentes (${people.length})`
      : `Contatos (${people.length})`;

  return (
    <Aside aria-label="Contatos">
      <Head
        as="button"
        title="Ocultar painel"
        aria-label="Ocultar painel"
        aria-expanded
        onClick={toggleCollapsed}
      >
        <HeadTitle>Contatos</HeadTitle>
        <CollapseButton>
          <span style={{ display: "grid", transform: "scaleX(-1)" }}>
            <BackIcon />
          </span>
        </CollapseButton>
      </Head>

      <TabBar role="tablist" aria-label="Listas">
        <Tab
          type="button"
          role="tab"
          aria-selected={tab === "recent"}
          $active={tab === "recent"}
          onClick={() => setTab("recent")}
        >
          Recentes
        </Tab>
        <Tab
          type="button"
          role="tab"
          aria-selected={tab === "contacts"}
          $active={tab === "contacts"}
          onClick={() => setTab("contacts")}
        >
          Contatos
        </Tab>
      </TabBar>

      <Scroll>
        <Section>
          <SectionTitle>{sectionLabel}</SectionTitle>
          {people.length === 0 ? (
            <Empty>
              {tab === "recent"
                ? "Entre em uma sala com alguém para ver aqui."
                : "Nenhum contato ainda. Adicione a partir de Recentes ou pelo uid."}
            </Empty>
          ) : (
            <PersonList>
              {people.map((person) => {
                const status = presence[person.uid] ?? "offline";
                const photo = photos[person.uid];
                const saved = Boolean(findContact(person.uid));
                return (
                  <PersonItem key={person.uid}>
                    <PersonRow
                      type="button"
                      title={`Abrir ${person.nickname}`}
                      onClick={() => selectPerson(person)}
                    >
                      <PersonAvatar>
                        {photo ? (
                          <img
                            src={photo}
                            alt=""
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                              setPhotos((prev) => {
                                if (!(person.uid in prev)) return prev;
                                const next = { ...prev };
                                delete next[person.uid];
                                return next;
                              });
                            }}
                          />
                        ) : (
                          <UserIcon />
                        )}
                      </PersonAvatar>
                      <StatusDot
                        $color={STATUS_COLOR[status]}
                        $hollow={status === "brb"}
                        title={STATUS_LABEL[status]}
                        aria-label={STATUS_LABEL[status]}
                      />
                      <PersonCopy>
                        <PersonName>{person.nickname}</PersonName>
                        <PersonMeta>
                          {person.meta ?? STATUS_LABEL[status]}
                        </PersonMeta>
                      </PersonCopy>
                    </PersonRow>
                    {tab === "contacts" ? (
                      <RemoveButton
                        type="button"
                        title="Remover contato"
                        onClick={() => handleRemove(person.uid)}
                      >
                        Remover
                      </RemoveButton>
                    ) : null}
                    {tab === "recent" && !saved ? (
                      <RemoveButton
                        type="button"
                        title="Adicionar aos contatos"
                        onClick={() => handleAddFromRecent(person)}
                      >
                        Adicionar
                      </RemoveButton>
                    ) : null}
                  </PersonItem>
                );
              })}
            </PersonList>
          )}
        </Section>

        {tab === "contacts" ? (
          adding ? (
            <AddForm onSubmit={handleAdd}>
              <AddField>
                Uid
                <AddInput
                  autoFocus
                  value={uidDraft}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  spellCheck={false}
                  onChange={(event) => setUidDraft(event.target.value)}
                />
              </AddField>
              <AddField>
                Apelido
                <AddInput
                  value={nickDraft}
                  maxLength={CONTACT_NICK_MAX}
                  placeholder="Como você chama essa pessoa"
                  onChange={(event) => setNickDraft(event.target.value)}
                />
              </AddField>
              {addError ? <AddError>{addError}</AddError> : null}
              <AddActions>
                <AddSubmit type="submit">Salvar</AddSubmit>
                <AddCancel type="button" onClick={cancelAdd}>
                  Cancelar
                </AddCancel>
              </AddActions>
            </AddForm>
          ) : (
            <AddButton type="button" onClick={openAdd}>
              Adicionar contato
            </AddButton>
          )
        ) : null}
      </Scroll>
    </Aside>
  );
}
