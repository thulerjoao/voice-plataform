import { useEffect, useMemo, useState } from "react";
import {
  getKnownAvatarHash,
  subscribeAvatarHash,
} from "../../../../avatar-signal";
import {
  avatarToObjectUrl,
  loadPeerAvatar,
  subscribeAvatarCache,
} from "../../../../avatar-store";
import {
  loadContacts,
  loadRecentContacts,
  updateContact,
  type Contact,
  type RecentContact,
} from "../../../../contacts";
import {
  syncContactPresence,
  subscribeContactPresence,
  type ContactPresenceStatus,
} from "../../../../contacts-presence";
import { BackIcon, UserIcon } from "../../icons/ui";
import {
  AddButton,
  Aside,
  CollapseButton,
  CollapseRail,
  Empty,
  Head,
  HeadTitle,
  PersonAvatar,
  PersonCopy,
  PersonList,
  PersonMeta,
  PersonName,
  PersonRow,
  Scroll,
  Section,
  SectionTitle,
  StatusDot,
  Tab,
  TabBar,
} from "./style";

const COLLAPSED_KEY = "voice.detailsCollapsed";

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

const MOCK_CONTACTS: ListPerson[] = [
  { uid: "c-joao", nickname: "João", meta: "Mock" },
  { uid: "c-lucas", nickname: "Lucas", meta: "Mock" },
  { uid: "c-bruno", nickname: "Bruno", meta: "Mock" },
  { uid: "c-gabriela", nickname: "Gabriela", meta: "Mock" },
  { uid: "c-mariana", nickname: "Mariana", meta: "Mock" },
  { uid: "c-rafael", nickname: "Rafael", meta: "Mock" },
  { uid: "c-diego", nickname: "Diego", meta: "Mock" },
];

const MOCK_RECENT: ListPerson[] = [
  { uid: "c-bruno", nickname: "Bruno", meta: "Há 2 min" },
  { uid: "c-mariana", nickname: "Mariana", meta: "Ontem" },
  { uid: "c-gabriela", nickname: "Gabriela", meta: "Há 3 h" },
  { uid: "c-diego", nickname: "Diego", meta: "Segunda" },
];

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
    avatarHash: item.avatarHash,
  }));
}

function fromRecent(list: RecentContact[]): ListPerson[] {
  return list.map((item) => ({
    uid: item.uid,
    nickname: item.nickname,
    meta: item.source === "dm" ? "Mensagem" : "Perfil",
    avatarHash: getKnownAvatarHash(item.uid) ?? undefined,
  }));
}

type WorkspaceDetailsProps = {
  onSelectContact?: (user: { uid: string; nickname: string }) => void;
};

export function WorkspaceDetails({ onSelectContact }: WorkspaceDetailsProps) {
  const [collapsed, setCollapsed] = useState(loadCollapsed);
  const [tab, setTab] = useState<DetailsTab>("contacts");
  const [contacts, setContacts] = useState(loadContacts);
  const [recent, setRecent] = useState(loadRecentContacts);
  const [presence, setPresence] = useState<
    Record<string, ContactPresenceStatus>
  >({});
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Record<string, string>>({});

  const contactPeople = useMemo(() => {
    const stored = fromContacts(contacts);
    return stored.length > 0 ? stored : MOCK_CONTACTS;
  }, [contacts]);

  const recentPeople = useMemo(() => {
    const stored = fromRecent(recent);
    return stored.length > 0 ? stored : MOCK_RECENT;
  }, [recent, hashes]);

  const watchUids = useMemo(() => {
    const ids = new Set<string>();
    for (const person of contactPeople) ids.add(person.uid);
    for (const person of recentPeople) ids.add(person.uid);
    return [...ids];
  }, [contactPeople, recentPeople]);

  useEffect(() => {
    setContacts(loadContacts());
    setRecent(loadRecentContacts());
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
    const urls: string[] = [];

    async function hydrate() {
      const next: Record<string, string> = {};
      const people = [...contactPeople, ...recentPeople];
      for (const person of people) {
        const hash = hashes[person.uid] ?? person.avatarHash;
        if (!hash) continue;
        const stored = await loadPeerAvatar(person.uid, hash);
        if (!stored || cancelled) continue;
        const url = avatarToObjectUrl(stored);
        urls.push(url);
        next[person.uid] = url;
      }
      if (!cancelled) setPhotos(next);
    }

    void hydrate();
    const stopCache = subscribeAvatarCache(() => {
      void hydrate();
    });

    return () => {
      cancelled = true;
      stopCache();
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [contactPeople, recentPeople, hashes]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      saveCollapsed(next);
      return next;
    });
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
                ? "Nenhuma conversa recente."
                : "Nenhum contato ainda."}
            </Empty>
          ) : (
            <PersonList>
              {people.map((person) => {
                const status = presence[person.uid] ?? "offline";
                const photo = photos[person.uid];
                return (
                  <PersonRow
                    key={person.uid}
                    type="button"
                    title={`Abrir ${person.nickname}`}
                    onClick={() => selectPerson(person)}
                  >
                    <PersonAvatar>
                      {photo ? (
                        <img src={photo} alt="" />
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
                );
              })}
            </PersonList>
          )}
        </Section>

        {tab === "contacts" ? (
          <AddButton
            type="button"
            title="Em breve"
            onClick={() => {
              /* adicionar contato: passo seguinte */
            }}
          >
            Adicionar contato
          </AddButton>
        ) : null}
      </Scroll>
    </Aside>
  );
}
