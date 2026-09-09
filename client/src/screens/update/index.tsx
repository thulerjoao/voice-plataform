import { CLIENT_VERSION, type ClientVersionInfo } from "../../version";
import {
  Brand,
  BrandIcon,
  Card,
  Screen,
  Title,
  UpdateButton,
  VersionLabel,
  VersionRow,
  Versions,
  VersionValue,
} from "./style";

type UpdateScreenProps = {
  info: ClientVersionInfo;
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
      <path
        d="M12 16.8v3.2M8.8 20h6.4"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function UpdateScreen({ info }: UpdateScreenProps) {
  return (
    <Screen>
      <Card>
        <Brand>
          <BrandIcon>
            <MicIcon />
          </BrandIcon>
          The Voice Chat
        </Brand>
        <Title>Seu client precisa ser atualizado</Title>
        <Versions>
          <VersionRow>
            <VersionLabel>Sua versão</VersionLabel>
            <VersionValue>{CLIENT_VERSION}</VersionValue>
          </VersionRow>
          <VersionRow>
            <VersionLabel>Versão atual</VersionLabel>
            <VersionValue $accent>{info.current}</VersionValue>
          </VersionRow>
        </Versions>
        <UpdateButton type="button" onClick={() => window.location.reload()}>
          Atualizar
        </UpdateButton>
      </Card>
    </Screen>
  );
}
