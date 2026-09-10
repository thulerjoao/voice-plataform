import { useState, type FormEvent } from "react";
import { registerIdentity, restoreIdentity } from "../../api";
import { clearBookmarks, saveBookmark } from "../../bookmarks";
import { clearContacts } from "../../contacts";
import {
  NICKNAME_MAX_LENGTH,
  formatRecoveryCode,
  saveIdentity,
  type Identity,
} from "../../identity";
import {
  Brand,
  BrandIcon,
  CodeBox,
  Content,
  ErrorText,
  Field,
  FieldIcon,
  Form,
  GhostLink,
  Input,
  RecoveryCode,
  Screen,
  Submit,
  Subtitle,
  Title,
  Warn,
} from "./style";

type NicknameScreenProps = {
  onReady: (identity: Identity) => void;
};

type Step = "create" | "code" | "restore";

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
      <path
        d="M12 16.8v3.2M8.8 20h6.4"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
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

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="8" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M11 12h9M17.2 12v2.4M19.4 12v2.4"
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
        d="M10.8 5.2V3.8A1.6 1.6 0 0 0 9.2 2.2H3.8A1.6 1.6 0 0 0 2.2 3.8v5.4A1.6 1.6 0 0 0 3.8 10.8h1.4"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function NicknameScreen({ onReady }: NicknameScreenProps) {
  const [step, setStep] = useState<Step>("create");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = nickname.trim();
    if (!value) {
      setError("Digite um nickname.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const created = await registerIdentity({ nickname: value });
      const next = {
        uid: created.uid,
        nickname: created.nickname,
        recoveryCode: created.recoveryCode,
      };
      saveIdentity(next);
      setIdentity(next);
      setStep("code");
    } catch (reason: unknown) {
      setError(
        reason instanceof Error ? reason.message : "Não foi possível continuar.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = code.trim();
    if (!value) {
      setError("Cole o código de recuperação.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const restored = await restoreIdentity(value);
      const next: Identity = {
        uid: restored.uid,
        nickname: restored.nickname,
        recoveryCode: formatRecoveryCode(value),
      };
      saveIdentity(next);
      clearBookmarks();
      clearContacts();
      for (const room of [...restored.rooms].reverse()) {
        saveBookmark({
          roomId: room.id,
          name: room.name,
          code: room.code,
          role: room.role,
        });
      }
      onReady(next);
    } catch (reason: unknown) {
      setError(
        reason instanceof Error ? reason.message : "Não foi possível entrar.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Content>
        <Brand>
          <BrandIcon>
            <MicIcon />
          </BrandIcon>
          The Voice Chat
        </Brand>
        {step === "code" && identity ? (
          <>
            <Title>Guarde este código</Title>
            <Subtitle>
              É a única forma de recuperar sua conta se formatar o computador.
            </Subtitle>
            <CodeBox>
              <RecoveryCode>{identity.recoveryCode}</RecoveryCode>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(identity.recoveryCode)
                    .then(() => {
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1600);
                    });
                }}
              >
                <CopyIcon />
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </CodeBox>
            <Warn>
              Não compartilhe com ninguém — quem tiver o código pode fazer login
              na sua conta.
            </Warn>
            <Form
              onSubmit={(event) => {
                event.preventDefault();
                onReady(identity);
              }}
            >
              <Submit type="submit">Continuar</Submit>
            </Form>
          </>
        ) : step === "restore" ? (
          <>
            <Title>Recuperação de conta</Title>
            <Subtitle>
             Informe o código de recuperação para entrar
            </Subtitle>
            <Form onSubmit={handleRestore} noValidate>
              <Field>
                <FieldIcon>
                  <KeyIcon />
                </FieldIcon>
                <Input
                  autoFocus
                  spellCheck={false}
                  placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value);
                    if (error) setError("");
                  }}
                />
              </Field>
              <Submit type="submit" disabled={busy}>
                {busy ? "Entrando…" : "Entrar"}
              </Submit>
              <GhostLink
                type="button"
                onClick={() => {
                  setStep("create");
                  setError("");
                }}
              >
                Criar nova conta
              </GhostLink>
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
        ) : (
          <>
            <Title>Como devemos te chamar?</Title>
            <Subtitle>Escolha um nickname para usar no app.</Subtitle>
            <Form onSubmit={handleCreate} noValidate>
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
                    if (error) setError("");
                  }}
                />
              </Field>
              <Submit type="submit" disabled={busy}>
                {busy ? "Criando…" : "Continuar"}
              </Submit>
              <GhostLink
                type="button"
                onClick={() => {
                  setStep("restore");
                  setError("");
                }}
              >
                Informar código de recuperação
              </GhostLink>
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
        )}
      </Content>
    </Screen>
  );
}
