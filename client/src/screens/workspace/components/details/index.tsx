import { useState } from "react";
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

type PresenceTone = "online" | "busy" | "brb" | "offline";

type MockPerson = {
  uid: string;
  nickname: string;
  status: PresenceTone;
  meta?: string;
};

const STATUS_COLOR: Record<PresenceTone, string> = {
  online: "#30d158",
  busy: "#ff453a",
  brb: "#ffd60a",
  offline: "#636366",
};

const STATUS_LABEL: Record<PresenceTone, string> = {
  online: "Online",
  busy: "Ocupado",
  brb: "Volto logo",
  offline: "Offline",
};

const MOCK_CONTACTS: MockPerson[] = [
  { uid: "c-joao", nickname: "João", status: "online", meta: "No servidor Alpha" },
  { uid: "c-lucas", nickname: "Lucas", status: "brb" },
  { uid: "c-bruno", nickname: "Bruno", status: "online" },
  { uid: "c-gabriela", nickname: "Gabriela", status: "busy" },
  { uid: "c-mariana", nickname: "Mariana", status: "offline" },
  { uid: "c-rafael", nickname: "Rafael", status: "offline" },
  { uid: "c-diego", nickname: "Diego", status: "online" },
];

const MOCK_RECENT: MockPerson[] = [
  { uid: "c-bruno", nickname: "Bruno", status: "online", meta: "Há 2 min" },
  { uid: "c-mariana", nickname: "Mariana", status: "offline", meta: "Ontem" },
  { uid: "c-gabriela", nickname: "Gabriela", status: "busy", meta: "Há 3 h" },
  { uid: "c-diego", nickname: "Diego", status: "online", meta: "Segunda" },
];

function loadCollapsed() {
  return window.localStorage.getItem(COLLAPSED_KEY) === "1";
}

function saveCollapsed(value: boolean) {
  window.localStorage.setItem(COLLAPSED_KEY, value ? "1" : "0");
}

type WorkspaceDetailsProps = {
  /** Futuro: abre perfil / DM no Stage. */
  onSelectContact?: (user: { uid: string; nickname: string }) => void;
};

export function WorkspaceDetails({ onSelectContact }: WorkspaceDetailsProps) {
  const [collapsed, setCollapsed] = useState(loadCollapsed);
  const [tab, setTab] = useState<DetailsTab>("contacts");

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      saveCollapsed(next);
      return next;
    });
  }

  function selectPerson(person: MockPerson) {
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

  const people = tab === "recent" ? MOCK_RECENT : MOCK_CONTACTS;
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
              {people.map((person) => (
                <PersonRow
                  key={person.uid}
                  type="button"
                  title={`Abrir ${person.nickname}`}
                  onClick={() => selectPerson(person)}
                >
                  <PersonAvatar>
                    <UserIcon />
                  </PersonAvatar>
                  <StatusDot
                    $color={STATUS_COLOR[person.status]}
                    $hollow={person.status === "brb"}
                    title={STATUS_LABEL[person.status]}
                    aria-label={STATUS_LABEL[person.status]}
                  />
                  <PersonCopy>
                    <PersonName>{person.nickname}</PersonName>
                    {person.meta ? (
                      <PersonMeta>{person.meta}</PersonMeta>
                    ) : (
                      <PersonMeta>{STATUS_LABEL[person.status]}</PersonMeta>
                    )}
                  </PersonCopy>
                </PersonRow>
              ))}
            </PersonList>
          )}
        </Section>

        {tab === "contacts" ? (
          <AddButton
            type="button"
            title="Em breve"
            onClick={() => {
              /* Fase 2: só visual; adicionar contato vem depois */
            }}
          >
            Adicionar contato
          </AddButton>
        ) : null}
      </Scroll>
    </Aside>
  );
}
