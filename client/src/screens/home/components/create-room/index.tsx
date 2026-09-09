import { useState, type FormEvent } from "react";
import {
  createRoom,
  ROOM_NAME_MAX,
  ROOM_NAME_MIN,
  type CreatedRoom,
} from "../../../../api";
import type { Identity } from "../../../../identity";
import addServerIcon from "../../icons/addserver.svg";
import {
  AdminBadge,
  BackButton,
  BackRow,
  Body,
  Cancel,
  Code,
  CodeBox,
  CodeHint,
  Copied,
  CopyButton,
  ErrorText,
  Field,
  FieldBox,
  FieldIcon,
  FieldLabel,
  Form,
  HeroIcon,
  Input,
  Panel,
  RoomLine,
  Submit,
  Subtitle,
  SuccessIcon,
  Title,
} from "./style";

type CreateRoomScreenProps = {
  identity: Identity;
  onCancel: () => void;
  onCreated: (room: CreatedRoom) => void;
  created?: CreatedRoom;
  onEnter: () => void;
};

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

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M4.5 18c.8-2.4 2.4-3.6 4.5-3.6s3.7 1.2 4.5 3.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle
        cx="16.5"
        cy="9"
        r="2.1"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M19.5 18c-.4-1.6-1.4-2.6-2.8-3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
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

function AlertIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 5v3.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11" r="0.7" fill="currentColor" />
    </svg>
  );
}

function CreateStep({
  identity,
  onCancel,
  onCreated,
}: {
  identity: Identity;
  onCancel: () => void;
  onCreated: (room: CreatedRoom) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const trimmed = name.trim();
  const canSubmit =
    trimmed.length >= ROOM_NAME_MIN &&
    trimmed.length <= ROOM_NAME_MAX &&
    !creating;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setCreating(true);
    setError("");

    try {
      const room = await createRoom({
        name: trimmed,
        uid: identity.uid,
        nickname: identity.nickname,
      });
      onCreated(room);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível criar o servidor.",
      );
      setCreating(false);
    }
  }

  return (
    <>
      <HeroIcon>
        <img src={addServerIcon} alt="" aria-hidden="true" />
      </HeroIcon>
      <Title>Novo servidor</Title>
      <Subtitle>
        Escolha um nome para seu servidor. Depois disso geraremos um código para
        você compartilhar.
      </Subtitle>
      <Form onSubmit={handleSubmit} noValidate>
        <Field>
          <FieldLabel>Nome do servidor</FieldLabel>
          <FieldBox>
            <FieldIcon>
              <PeopleIcon />
            </FieldIcon>
            <Input
              autoFocus
              maxLength={ROOM_NAME_MAX}
              placeholder="Ex.: Squad Principal"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError("");
              }}
            />
          </FieldBox>
        </Field>
        <Submit type="submit" disabled={!canSubmit}>
          {creating ? "Criando..." : "Criar"}
        </Submit>
        <Cancel type="button" onClick={onCancel}>
          Cancelar
        </Cancel>
        <ErrorText aria-live="polite">
          {error ? (
            <>
              <AlertIcon />
              {error}
            </>
          ) : null}
        </ErrorText>
      </Form>
    </>
  );
}

function CreatedStep({
  room,
  onEnter,
}: {
  room: CreatedRoom;
  onEnter: () => void;
}) {
  const [copied, setCopied] = useState(false);

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
    <>
      <SuccessIcon>
        <CheckIcon />
      </SuccessIcon>
      <Title>Servidor criado</Title>
      <RoomLine>
        <PeopleIcon />
        {room.name}
        <AdminBadge>Owner</AdminBadge>
      </RoomLine>
      <CodeBox>
        <Code>{room.code}</Code>
        <CopyButton type="button" onClick={handleCopy}>
          <CopyIcon />
          Copiar código
        </CopyButton>
      </CodeBox>
      <CodeHint>Quem tiver o código poderá entrar neste servidor.</CodeHint>
      <Submit type="button" onClick={onEnter}>
        Entrar no servidor
      </Submit>
      <Copied aria-live="polite">
        {copied ? (
          <>
            <CheckIcon />
            Código copiado!
          </>
        ) : null}
      </Copied>
    </>
  );
}

export function CreateRoomScreen({
  identity,
  onCancel,
  onCreated,
  created,
  onEnter,
}: CreateRoomScreenProps) {
  return (
    <Panel>
      <BackRow>
        <BackButton type="button" onClick={onCancel}>
          <BackIcon />
          <span>Voltar</span>
        </BackButton>
      </BackRow>
      <Body>
        {created ? (
          <CreatedStep room={created} onEnter={onEnter} />
        ) : (
          <CreateStep
            identity={identity}
            onCancel={onCancel}
            onCreated={onCreated}
          />
        )}
      </Body>
    </Panel>
  );
}
