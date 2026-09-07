import { useState } from "react";
import type { Bookmark } from "../../bookmarks";
import type { Identity } from "../../identity";
import {
  Channel,
  ChannelIcon,
  Copied,
  CopyButton,
  Invite,
  InviteCode,
  Member,
  MemberDot,
  MemberName,
  Members,
  OwnerBadge,
  RoomBody,
  RoomHeader,
  RoomRole,
  RoomShell,
  RoomTitle,
  Stage,
  StageChannel,
  StageHint,
  StageMeta,
  Tree,
  YouBadge,
} from "./style";

type RoomScreenProps = {
  room: Bookmark;
  identity: Identity;
};

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5.2" y="5.2" width="8" height="8" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.4 10.6V3.8A1.4 1.4 0 0 1 4.8 2.4h6.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6.2 8 10.2 12 6.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function roleLabel(role: Bookmark["role"]) {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return null;
}

function roleCopy(role: Bookmark["role"]) {
  if (role === "owner") return "Você é o dono desta sala.";
  if (role === "admin") return "Você é admin nesta sala.";
  return "Você está nesta sala.";
}

export function RoomScreen({ room, identity }: RoomScreenProps) {
  const [copied, setCopied] = useState(false);
  const badge = roleLabel(room.role);

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

  return (
    <RoomShell>
      <RoomHeader>
        <div>
          <RoomTitle>{room.name}</RoomTitle>
          <RoomRole>{roleCopy(room.role)}</RoomRole>
        </div>
        <Invite>
          <InviteCode>{room.code}</InviteCode>
          <CopyButton type="button" onClick={handleCopy}>
            <CopyIcon />
            Copiar
          </CopyButton>
          <Copied aria-live="polite">{copied ? "Copiado!" : ""}</Copied>
        </Invite>
      </RoomHeader>

      <RoomBody>
        <Tree>
          <Channel>
            <ChannelIcon>
              <ChevronIcon />
            </ChannelIcon>
            Geral
          </Channel>
          <Members>
            <Member>
              <MemberDot />
              <MemberName>{identity.nickname}</MemberName>
              <YouBadge>você</YouBadge>
              {badge ? <OwnerBadge>{badge}</OwnerBadge> : null}
            </Member>
          </Members>
        </Tree>

        <Stage>
          <StageChannel>Geral</StageChannel>
          <StageMeta>1 pessoa no canal</StageMeta>
          <StageHint>A voz entra depois. Por enquanto você já está na sala — o código acima chama o squad.</StageHint>
        </Stage>
      </RoomBody>
    </RoomShell>
  );
}
