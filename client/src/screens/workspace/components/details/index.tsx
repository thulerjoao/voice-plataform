import { useState } from "react";
import { BackIcon } from "../../icons/ui";
import {
  Aside,
  CollapseButton,
  CollapseRail,
  Head,
  HeadTitle,
  Placeholder,
  Scroll,
} from "./style";

const COLLAPSED_KEY = "voice.detailsCollapsed";

function loadCollapsed() {
  return window.localStorage.getItem(COLLAPSED_KEY) === "1";
}

function saveCollapsed(value: boolean) {
  window.localStorage.setItem(COLLAPSED_KEY, value ? "1" : "0");
}

export function WorkspaceDetails() {
  const [collapsed, setCollapsed] = useState(loadCollapsed);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      saveCollapsed(next);
      return next;
    });
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
      <Scroll>
        <Placeholder>Em breve: contatos e recentes.</Placeholder>
      </Scroll>
    </Aside>
  );
}
