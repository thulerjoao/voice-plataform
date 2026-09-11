import { useEffect, useRef, useState } from "react";
import type { RoomRole } from "../../../../api";
import {
  avatarToObjectUrl,
  loadOwnAvatar,
  subscribeAvatarCache,
} from "../../../../avatar-store";
import { STATUSES, statusMeta, type StatusId } from "../../../../presence";
import {
  ChevronUpIcon,
  GearIcon,
  HeadsetIcon,
  HeadsetOffIcon,
  MicIcon,
  MicOffIcon,
  UserIcon,
  VolumeIcon,
} from "../../icons/ui";
import {
  ControlButton,
  Footer,
  FooterCenter,
  FooterLeft,
  FooterRight,
  StatusDot,
  StatusMenu,
  StatusOption,
  UserAvatar,
  UserCard,
  UserChevron,
  UserCopy,
  UserMeta,
  UserName,
  UserWrap,
  VolumeBar,
  VolumeSlider,
  VolumeValue,
} from "./style";

type WorkspaceFooterProps = {
  nickname: string;
  role?: RoomRole;
  muted: boolean;
  deafened: boolean;
  outputVolume: number;
  status: StatusId;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onOutputVolume: (value: number) => void;
  onStatusChange: (status: StatusId) => void;
  onOpenSettings: () => void;
};

function roleLabel(role: RoomRole | undefined) {
  if (role === "owner") return "Dono";
  if (role === "admin") return "Admin";
  return "Membro";
}

export function WorkspaceFooter({
  nickname,
  role,
  muted,
  deafened,
  outputVolume,
  status,
  onToggleMute,
  onToggleDeafen,
  onOutputVolume,
  onStatusChange,
  onOpenSettings,
}: WorkspaceFooterProps) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const micOff = muted || deafened;
  const currentStatus = statusMeta(status);

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;

    async function load() {
      const own = await loadOwnAvatar();
      if (cancelled) return;
      if (url) URL.revokeObjectURL(url);
      if (!own) {
        setAvatarUrl(null);
        return;
      }
      url = avatarToObjectUrl(own);
      setAvatarUrl(url);
    }

    void load();
    const stop = subscribeAvatarCache(() => {
      void load();
    });
    return () => {
      cancelled = true;
      stop();
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  useEffect(() => {
    if (!statusOpen) return;

    function handlePointer(event: MouseEvent) {
      if (
        statusRef.current &&
        !statusRef.current.contains(event.target as Node)
      ) {
        setStatusOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setStatusOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [statusOpen]);

  return (
    <Footer>
      <FooterLeft>
        <ControlButton
          type="button"
          $on={micOff}
          title={micOff ? "Ativar microfone" : "Silenciar microfone"}
          aria-label={micOff ? "Ativar microfone" : "Silenciar microfone"}
          onClick={onToggleMute}
        >
          {micOff ? <MicOffIcon /> : <MicIcon />}
        </ControlButton>
        <ControlButton
          type="button"
          $on={deafened}
          title={deafened ? "Ouvir de novo" : "Ensurdecer"}
          aria-label={deafened ? "Ouvir de novo" : "Ensurdecer"}
          onClick={onToggleDeafen}
        >
          {deafened ? <HeadsetOffIcon /> : <HeadsetIcon />}
        </ControlButton>
        <ControlButton
          type="button"
          title="Configurações"
          aria-label="Configurações"
          onClick={onOpenSettings}
        >
          <GearIcon />
        </ControlButton>
      </FooterLeft>

      <FooterCenter>
        <VolumeBar title="Volume geral">
          <VolumeIcon />
          <VolumeSlider
            type="range"
            min={0}
            max={100}
            $value={deafened ? 0 : outputVolume}
            value={deafened ? 0 : outputVolume}
            aria-label="Volume geral"
            onChange={(event) => onOutputVolume(Number(event.target.value))}
          />
          <VolumeValue>{deafened ? 0 : outputVolume}%</VolumeValue>
        </VolumeBar>
      </FooterCenter>

      <FooterRight>
        <UserWrap ref={statusRef}>
          <UserCard
            type="button"
            title="Alterar status"
            onClick={() => setStatusOpen((open) => !open)}
          >
            <UserAvatar>
              {avatarUrl ? <img src={avatarUrl} alt="" /> : <UserIcon />}
            </UserAvatar>
            <UserCopy>
              <UserName>{nickname}</UserName>
              <UserMeta>
                <StatusDot $color={currentStatus.color} /> {roleLabel(role)}
              </UserMeta>
            </UserCopy>
            <UserChevron>
              <ChevronUpIcon />
            </UserChevron>
          </UserCard>
          {statusOpen ? (
            <StatusMenu>
              {STATUSES.map((item) => (
                <StatusOption
                  key={item.id}
                  type="button"
                  $active={item.id === status}
                  onClick={() => {
                    onStatusChange(item.id);
                    setStatusOpen(false);
                  }}
                >
                  <StatusDot $color={item.color} />
                  {item.label}
                </StatusOption>
              ))}
            </StatusMenu>
          ) : null}
        </UserWrap>
      </FooterRight>
    </Footer>
  );
}
