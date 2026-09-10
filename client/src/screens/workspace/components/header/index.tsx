import { useState } from "react";
import { normalizeRoomCode } from "../../../../bookmarks";
import {
  BackIcon,
  CopyIcon,
  GearIcon,
  MicIcon,
  PeopleIcon,
} from "../../icons/ui";
import {
  Actions,
  BrandMark,
  BrandName,
  BrandSide,
  Center,
  CodeContainer,
  CodePill,
  CopyButton,
  Header,
  IconButton,
  ServerMark,
  ServerName,
} from "./style";

type WorkspaceHeaderProps = {
  name: string;
  code: string;
  sideWidth: number;
  onBack: () => void;
  onOpenSettings: () => void;
};

export function WorkspaceHeader({
  name,
  code,
  sideWidth,
  onBack,
  onOpenSettings,
}: WorkspaceHeaderProps) {
  const [copied, setCopied] = useState(false);
  const displayCode = normalizeRoomCode(code) || code;

  async function handleCopy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const field = document.createElement("textarea");
      field.value = code;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Header $sideWidth={sideWidth}>
      <BrandSide>
        <IconButton
          type="button"
          onClick={onBack}
          title="Voltar"
          aria-label="Voltar"
        >
          <BackIcon />
        </IconButton>
        <BrandMark>
          <MicIcon />
        </BrandMark>
        <BrandName>The Voice Chat</BrandName>
      </BrandSide>

      <Center>
        <ServerMark>
          <PeopleIcon />
        </ServerMark>
        <ServerName title={name}>{name}</ServerName>
      </Center>

      <Actions>
        <IconButton
          type="button"
          title="Configurações"
          aria-label="Configurações"
          onClick={onOpenSettings}
        >
          <GearIcon />
        </IconButton>
      </Actions>
    </Header>
  );
}
