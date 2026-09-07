import styled, { css, keyframes } from "styled-components";

export const RoomShell = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

export const RoomHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  flex-wrap: wrap;
  flex-shrink: 0;
`;

export const RoomTitle = styled.h1`
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.03em;
`;

export const Invite = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;
`;

export const InviteCode = styled.span`
  padding: 0.3rem 0.55rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.45rem;
  background: #3a3a3c;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.05em;
`;

export const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  height: 1.85rem;
  padding: 0 0.6rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0.45rem;
  background: transparent;
  color: #f5f5f7;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;

  svg {
    width: 0.8rem;
    height: 0.8rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  &:active {
    transform: scale(0.99);
  }
`;

export const Copied = styled.span`
  color: #30d158;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 4rem;
`;

export const LeaveButton = styled.button`
  height: 1.85rem;
  padding: 0 0.6rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0.45rem;
  background: transparent;
  color: #a1a1a6;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #f5f5f7;
  }

  &:active {
    transform: scale(0.99);
  }
`;

export const TreeWrap = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.55rem;
  background: #242426;
`;

export const TreeBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-shrink: 0;
  padding: 0.35rem 0.5rem 0.3rem 0.65rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: #8d8d93;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

export const ChannelEdit = styled.button`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.45rem;
  height: 1.45rem;
  padding: 0;
  border: 0;
  border-radius: 0.3rem;
  background: transparent;
  color: #8d8d93;
  cursor: pointer;

  svg {
    width: 0.78rem;
    height: 0.78rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #f5f5f7;
  }
`;

export const Tree = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0.45rem 0.35rem;
  font-size: 0.88rem;
`;

export const ChannelBlock = styled.div<{ $drop?: boolean; $waiting?: boolean }>`
  position: relative;
  border-radius: 0.35rem;
  background: ${(p) => (p.$drop ? "rgba(10, 132, 255, 0.14)" : "transparent")};

  & + & {
    margin-top: 0.35rem;
    padding-top: 0.4rem;
  }

  & + &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.07);
  }

  ${(p) =>
    p.$waiting &&
    css`
      margin-bottom: 0.15rem;
      padding-bottom: 0.55rem;

      &::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 4px;
        background:
          linear-gradient(rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.07)) 0 0 / 100% 1px no-repeat,
          linear-gradient(rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.07)) 0 100% / 100% 1px no-repeat;
      }
    `}
`;

export const ChannelRow = styled.div<{ $current?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  width: 100%;
  border-radius: 0.3rem;
  background: ${(p) => (p.$current ? "rgba(10, 132, 255, 0.16)" : "transparent")};
  color: ${(p) => (p.$current ? "#f5f5f7" : "#d1d1d6")};

  &:hover {
    background: ${(p) => (p.$current ? "rgba(10, 132, 255, 0.2)" : "rgba(255, 255, 255, 0.05)")};
  }
`;

export const Chevron = styled.button<{ $open?: boolean }>`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.35rem;
  height: 1.55rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #8d8d93;
  cursor: pointer;
  transform: rotate(${(p) => (p.$open ? "0deg" : "-90deg")});

  svg {
    width: 0.7rem;
    height: 0.7rem;
  }

  &:hover {
    color: #f5f5f7;
  }
`;

export const ChannelHit = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  height: 1.55rem;
  padding: 0 0.4rem 0 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
`;

export const ChannelName = styled.span`
  flex: 0 0 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ChannelDesc = styled.span`
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #8d8d93;
  font-size: 0.75rem;
  font-weight: 500;
`;

export const ChannelCount = styled.span`
  flex-shrink: 0;
  margin-left: auto;
  color: #8d8d93;
  font-size: 0.72rem;
  font-weight: 600;
`;

export const UserList = styled.ul`
  list-style: none;
  margin: 0.3rem 0 0.25rem;
  padding: 0 0 0 1.35rem;
`;

const talkPulse = keyframes`
  0%, 100% { background-color: var(--dot); }
  50% { background-color: transparent; }
`;

export const UserRow = styled.li<{ $you?: boolean; $dragging?: boolean; $movable?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  padding: 0.18rem 0.35rem;
  border-radius: 0.28rem;
  color: #f5f5f7;
  font-weight: ${(p) => (p.$you ? 600 : 500)};
  background: ${(p) => (p.$you ? "rgba(255, 255, 255, 0.05)" : "transparent")};
  cursor: ${(p) => (p.$movable ? "grab" : "default")};
  opacity: ${(p) => (p.$dragging ? 0.4 : 1)};
  user-select: none;

  &:active {
    cursor: ${(p) => (p.$movable ? "grabbing" : "default")};
  }
`;

export const ProfileCard = styled.div<{ $x: number; $y: number }>`
  position: fixed;
  top: ${(p) => p.$y}px;
  left: ${(p) => p.$x}px;
  z-index: 20;
  width: 26rem;
  padding: 0.9rem 1rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  background: #3a3a3c;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
`;

export const ProfileHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

export const ProfileName = styled.div`
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

export const SalaField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;

  & + & {
    margin-top: 0.7rem;
  }
`;

export const SalaLabel = styled.div`
  padding: 0 0.45rem;
  color: #8d8d93;
  font-size: 0.7rem;
  font-weight: 700;
`;

export const SalaLocked = styled.div<{ $empty?: boolean }>`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: 2rem;
  padding: 0 0.45rem;
  color: ${(p) => (p.$empty ? "#8d8d93" : "#f5f5f7")};
  font-size: 0.95rem;
  font-weight: 600;
`;

export const SalaNameButton = styled.button<{ $empty?: boolean }>`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  height: 2rem;
  padding: 0 0.45rem;
  border: 0;
  border-radius: 0.7rem;
  background: transparent;
  color: ${(p) => (p.$empty ? "#8d8d93" : "#f5f5f7")};
  text-align: left;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  span {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 2rem;
  }

  svg {
    flex-shrink: 0;
    width: 1rem;
    height: 1rem;
    color: #a1a1a6;
  }
`;

export const SalaNameEdit = styled.form`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  width: 100%;
  height: 2rem;
  padding: 0 0.2rem 0 0.45rem;
  border-radius: 0.7rem;
  background: #1c1c1e;
`;

export const SalaNameInput = styled.input`
  box-sizing: border-box;
  min-width: 0;
  flex: 1;
  height: 2rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f5f5f7;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 2rem;
  outline: none;

  &::placeholder {
    color: #8d8d93;
  }
`;

export const SalaNameIcon = styled.button`
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  border-radius: 0.35rem;
  background: transparent;
  color: #a1a1a6;
  cursor: pointer;

  svg {
    width: 0.85rem;
    height: 0.85rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #f5f5f7;
  }
`;

export const SalaCreateWrap = styled.div`
  position: relative;
  margin-top: 0.35rem;
  padding-top: 0.4rem;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.07);
  }
`;

export const SalaCreate = styled.button`
  display: block;
  width: 100%;
  max-width: 8.5rem;
  margin: 0.35rem auto 0;
  height: 2rem;
  border: 1px dashed rgba(255, 255, 255, 0.16);
  border-radius: 0.45rem;
  background: transparent;
  color: #a1a1a6;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #f5f5f7;
  }
`;

export const ProfileRole = styled.div`
  margin-top: 0.15rem;
  color: #a1a1a6;
  font-size: 0.75rem;
  font-weight: 600;
`;

export const ProfileAdminLink = styled.button<{ $tone?: "default" | "danger" }>`
  display: block;
  margin-top: 0.28rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${(p) => (p.$tone === "danger" ? "#c98989" : "#8d8d93")};
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color: ${(p) => (p.$tone === "danger" ? "#ff8a80" : "#d1d1d6")};
    text-decoration: underline;
  }
`;

export const SalaHint = styled.div`
  margin-top: 0.55rem;
  padding: 0 0.45rem;
  color: #8d8d93;
  font-size: 0.72rem;
  font-weight: 600;
`;

export const SalaDelete = styled.button`
  display: block;
  width: 100%;
  margin-top: 0.85rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #ff8a80;
  font-size: 0.78rem;
  font-weight: 600;
  text-align: center;
  cursor: pointer;

  &:hover {
    color: #ff453a;
    text-decoration: underline;
  }
`;

export const ProfileStatus = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  padding: 0.28rem 0.55rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: #f5f5f7;
  font-size: 0.75rem;
  font-weight: 600;
`;

export const ProfileConnected = styled.div`
  margin-top: 0.7rem;
  color: #d1d1d6;
  font-size: 0.8rem;
  font-weight: 600;
`;

export const VolumeRow = styled.label`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-top: 0.75rem;
`;

export const VolumeCaption = styled.span`
  width: 3.6rem;
  color: #8d8d93;
  font-size: 0.72rem;
  font-weight: 600;
`;

export const VolumeSlider = styled.input`
  flex: 1;
  min-width: 0;
  height: 0.35rem;
  margin: 0;
  accent-color: #2f6fed;
  cursor: pointer;
`;

export const VolumeValue = styled.span`
  width: 2.2rem;
  color: #f5f5f7;
  font-size: 0.72rem;
  font-weight: 700;
  text-align: right;
`;

export const ProfileActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.85rem;
`;

export const ProfileButton = styled.button<{ $tone?: "default" | "danger" }>`
  height: 2rem;
  padding: 0 0.75rem;
  flex-shrink: 0;
  border: 1px solid ${(p) => (p.$tone === "danger" ? "rgba(255, 69, 58, 0.35)" : "rgba(255, 255, 255, 0.16)")};
  border-radius: 0.45rem;
  background: ${(p) => (p.$tone === "danger" ? "rgba(255, 69, 58, 0.12)" : "rgba(255, 255, 255, 0.06)")};
  color: ${(p) => (p.$tone === "danger" ? "#ff8a80" : "#f5f5f7")};
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: ${(p) => (p.$tone === "danger" ? "rgba(255, 69, 58, 0.2)" : "rgba(255, 255, 255, 0.1)")};
  }
`;

export const PokeForm = styled.form`
  display: flex;
  width: 100%;
  margin-top: 0.85rem;
  gap: 0.35rem;
`;

export const PokeInput = styled.input`
  flex: 1;
  min-width: 0;
  height: 2rem;
  padding: 0 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.4rem;
  background: #2c2c2e;
  color: #f5f5f7;
  font-size: 0.75rem;
  outline: none;

  &::placeholder {
    color: #8d8d93;
  }

  &:focus {
    border-color: #3b82f6;
  }
`;

export const PokeSend = styled.button`
  height: 2rem;
  padding: 0 0.6rem;
  border: 0;
  border-radius: 0.4rem;
  background: #2f6fed;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #3b7cff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export const PokeOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background: rgba(0, 0, 0, 0.45);
`;

export const PokeAlert = styled.div`
  width: min(22rem, 100%);
  padding: 1rem 1.05rem 1.05rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.75rem;
  background: #2c2c2e;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
`;

export const PokeAlertKicker = styled.div`
  color: #7eb0ff;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

export const PokeAlertFrom = styled.div`
  margin-top: 0.35rem;
  font-size: 1.05rem;
  font-weight: 700;
`;

export const PokeAlertText = styled.p`
  margin: 0.7rem 0 0;
  color: #f5f5f7;
  font-size: 0.92rem;
  line-height: 1.4;
`;

export const PokeAlertNote = styled.p`
  margin: 0.55rem 0 0;
  color: #8d8d93;
  font-size: 0.7rem;
`;

export const StatusDot = styled.span<{ $color: string; $talking?: boolean }>`
  box-sizing: border-box;
  width: 0.5rem;
  height: 0.5rem;
  flex-shrink: 0;
  border-radius: 999px;
  border: 1.5px solid ${(p) => p.$color};
  background: transparent;
  --dot: ${(p) => p.$color};
  ${(p) =>
    p.$talking &&
    css`
      animation: ${talkPulse} 1s ease-in-out infinite;
    `}
`;

export const UserFlag = styled.span`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: #0a84ff;

  svg {
    width: 0.85rem;
    height: 0.85rem;
  }
`;

export const UserName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Splitter = styled.div`
  flex-shrink: 0;
  height: 0.55rem;
  margin: 0.05rem 0;
  cursor: ns-resize;
  touch-action: none;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    left: 28%;
    right: 28%;
    top: 50%;
    height: 2px;
    border-radius: 99px;
    background: rgba(255, 255, 255, 0.16);
    transform: translateY(-50%);
  }

  &:hover::after,
  &:active::after {
    background: rgba(255, 255, 255, 0.38);
  }
`;

export const Chat = styled.section<{ $height?: number }>`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: ${(p) => (p.$height == null ? "11.5rem" : `${p.$height}px`)};
  min-height: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.55rem;
  background: #1c1c1e;
`;

export const ChatHead = styled.div`
  padding: 0.4rem 0.7rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: #a1a1a6;
  font-size: 0.75rem;
  font-weight: 600;
`;

export const ChatLog = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0.45rem 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
`;

export const ChatLine = styled.p`
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.35;
  color: #f5f5f7;
`;

export const ChatNick = styled.span`
  color: #7eb0ff;
  font-weight: 600;
`;

export const ChatForm = styled.form`
  display: flex;
  gap: 0.4rem;
  padding: 0.45rem 0.55rem 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

export const ChatInput = styled.input`
  flex: 1;
  min-width: 0;
  height: 2rem;
  padding: 0 0.65rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.4rem;
  background: #2c2c2e;
  color: #f5f5f7;
  outline: none;

  &::placeholder {
    color: #8d8d93;
  }

  &:focus {
    border-color: #3b82f6;
  }
`;

export const ChatSend = styled.button`
  height: 2rem;
  padding: 0 0.75rem;
  border: 0;
  border-radius: 0.4rem;
  background: #2f6fed;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #3b7cff;
  }

  &:active {
    transform: scale(0.99);
  }
`;
