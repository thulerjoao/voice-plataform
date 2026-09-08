import { useState, type FormEvent } from "react";
import { joinRoom, type CreatedRoom } from "../../api";
import { findBookmarkByCode } from "../../bookmarks";
import type { Identity } from "../../identity";
import keyWebsiteIcon from "./key-website-svgrepo-com.svg";
import {
  BackButton,
  BackRow,
  Body,
  Cancel,
  ErrorText,
  Field,
  FieldBox,
  FieldIcon,
  FieldLabel,
  Form,
  HeroIcon,
  Input,
  Panel,
  Submit,
  Subtitle,
  Title,
} from "./style";

type JoinRoomScreenProps = {
  identity: Identity;
  onCancel: () => void;
  onJoined: (room: CreatedRoom) => void;
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

function HashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10 4 8.2 20M15.8 4 14 20M5 9.5h14M4.5 14.5h14"
        stroke="currentColor"
        strokeWidth="1.7"
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

export function JoinRoomScreen({
  identity,
  onCancel,
  onJoined,
}: JoinRoomScreenProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const canSubmit = code.trim().length > 0 && !joining;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setJoining(true);
    setError("");

    try {
      const known = findBookmarkByCode(code);
      if (known) {
        onJoined({
          id: known.roomId,
          name: known.name,
          code: known.code,
          role: known.role,
        });
        return;
      }

      const room = await joinRoom({
        code: code.trim(),
        uid: identity.uid,
        nickname: identity.nickname,
      });
      onJoined(room);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível entrar no servidor.",
      );
      setJoining(false);
    }
  }

  return (
    <Panel>
      <BackRow>
        <BackButton type="button" onClick={onCancel}>
          <BackIcon />
          <span>Voltar</span>
        </BackButton>
      </BackRow>
      <Body>
        <HeroIcon>
          <img src={keyWebsiteIcon} alt="" aria-hidden="true" />
        </HeroIcon>
        <Title>Encontrar servidor</Title>
        <Subtitle>Cole o código que alguém compartilhou com você.</Subtitle>
        <Form onSubmit={handleSubmit} noValidate>
          <Field>
            <FieldLabel>Código</FieldLabel>
            <FieldBox>
              <FieldIcon>
                <HashIcon />
              </FieldIcon>
              <Input
                autoFocus
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                maxLength={20}
                placeholder="K7P-TIGRE"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.toUpperCase());
                  if (error) setError("");
                }}
              />
            </FieldBox>
          </Field>
          <Submit type="submit" disabled={!canSubmit}>
            {joining ? "Entrando..." : "Entrar"}
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
      </Body>
    </Panel>
  );
}
