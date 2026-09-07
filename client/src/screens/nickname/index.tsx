import { useState, type FormEvent } from "react";
import { createIdentity, NICKNAME_MAX_LENGTH } from "../../identity";
import {
  Brand,
  BrandIcon,
  Content,
  ErrorText,
  Field,
  FieldIcon,
  Form,
  Input,
  Screen,
  Submit,
  Subtitle,
  Title,
} from "./style";

type NicknameScreenProps = {
  onCreated: (nickname: string) => void;
};

function MicIcon() {
  return (
    <svg viewBox="5 1.5 14 20" fill="none" aria-hidden="true">
      <path
        d="M12 2.5c-1.8 0-3.2 1.4-3.2 3.2v6.1a3.2 3.2 0 1 0 6.4 0V5.7c0-1.8-1.4-3.2-3.2-3.2Z"
        fill="currentColor"
      />
      <path
        d="M6.4 11.2a5.6 5.6 0 0 0 11.2 0"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
      <path d="M12 16.8v3.2M8.8 20h6.4" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5.5 18.5c1.3-3 3.6-4.5 6.5-4.5s5.2 1.5 6.5 4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 5v3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.7" fill="currentColor" />
    </svg>
  );
}

export function NicknameScreen({ onCreated }: NicknameScreenProps) {
  const [nickname, setNickname] = useState("");
  const [showError, setShowError] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = nickname.trim();

    if (!value) {
      setShowError(true);
      return;
    }

    createIdentity(value);
    onCreated(value);
  }

  return (
    <Screen>
      <Content>
        <Brand>
          <BrandIcon>
            <MicIcon />
          </BrandIcon>
          Voice
        </Brand>
        <Title>Como devemos te chamar?</Title>
        <Subtitle>Escolha um nickname para usar no app.</Subtitle>
        <Form onSubmit={handleSubmit} noValidate>
          <Field>
            <FieldIcon>
              <PersonIcon />
            </FieldIcon>
            <Input
              autoFocus
              maxLength={NICKNAME_MAX_LENGTH}
              placeholder="Seu nome"
              value={nickname}
              onChange={(event) => {
                setNickname(event.target.value);
                if (showError) setShowError(false);
              }}
            />
          </Field>
          <Submit type="submit">Continuar</Submit>
            <ErrorText aria-live="polite">
              {showError ? (
                <>
                  <AlertIcon />
                  Digite um nickname.
                </>
              ) : null}
            </ErrorText>
        </Form>
      </Content>
    </Screen>
  );
}
