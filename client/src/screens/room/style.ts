import styled, { css, keyframes } from "styled-components";

const linkPulse = keyframes`
  0% {
    background: #4a4a4e;
    border-color: #4a4a4e;
    opacity: 0.35;
  }
  100% {
    background: #e8e8ed;
    border-color: #e8e8ed;
    opacity: 1;
  }
`;

const pendingPulse = css`
  animation: ${linkPulse} 0.45s ease-in-out infinite alternate;
`;

export const RoomShell = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

export const RoomHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.9rem;
  flex-wrap: wrap;
  flex-shrink: 0;
`;

export const RoomHeading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;
`;

export const RoomTitle = styled.h1`
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.03em;
`;

export const RoomMeta = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
  min-width: 0;
`;

export const RoomRole = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  height: 1.85rem;
  padding: 0 0.55rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.45rem;
  background: #3a3a3c;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.02em;
`;

export const RoomRoleLabel = styled.span`
  color: #8d8d93;
`;

export const RoomRoleValue = styled.span`
  color: #0a84ff;
`;

export const RoomGear = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  height: 1.85rem;
  padding: 0 0.65rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0.45rem;
  background: transparent;
  color: #f5f5f7;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;

  svg {
    width: 0.88rem;
    height: 0.88rem;
    color: #8d8d93;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  &:hover svg {
    color: #c7c7cc;
  }

  &:active {
    transform: scale(0.99);
  }
`;

export const Invite = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  padding-bottom: 0.82rem;
`;

export const InviteRow = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

export const Copied = styled.span<{ $show: boolean }>`
  position: absolute;
  top: calc(100% + 0.1rem);
  left: 50%;
  transform: translateX(-50%);
  color: #30d158;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
  opacity: ${(p) => (p.$show ? 1 : 0)};
  transition: opacity 140ms linear;
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
  padding: 0.45rem 0.6rem 0.4rem 0.75rem;
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
  width: 1.5rem;
  height: 1.5rem;
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
  padding: 0.55rem 0.42rem 0.55rem;
  font-size: 0.88rem;
`;

export const ChannelBlock = styled.div<{ $drop?: boolean }>`
  position: relative;
  border-radius: 0.35rem;
  background: ${(p) => (p.$drop ? "rgba(10, 132, 255, 0.14)" : "transparent")};

  & + & {
    margin-top: 0.45rem;
    padding-top: 0.45rem;
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
`;

export const ChannelRow = styled.div<{ $current?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.22rem;
  width: 100%;
  padding: 0.06rem 0.12rem 0.06rem 0.08rem;
  border-radius: 0.35rem;
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
  width: 1.4rem;
  height: 1.65rem;
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
  height: 1.65rem;
  padding: 0 0.45rem 0 0;
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
  display: flex;
  flex-direction: column;
  gap: 0.06rem;
  margin: 0.32rem 0 0.2rem;
  padding: 0 0.1rem 0 1.45rem;
`;

export const UserRow = styled.li<{
  $you?: boolean;
  $dragging?: boolean;
  $movable?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 0.42rem;
  min-width: 0;
  padding: 0.22rem 0.4rem;
  border-radius: 0.3rem;
  color: #f5f5f7;
  font-weight: ${(p) => (p.$you ? 600 : 500)};
  background: ${(p) => (p.$you ? "rgba(255, 255, 255, 0.05)" : "transparent")};
  cursor: ${(p) => (p.$movable ? "grab" : "default")};
  opacity: ${(p) => (p.$dragging ? 0.4 : 1)};
  user-select: none;

  &:hover {
    background: ${(p) =>
      p.$you ? "rgba(255, 255, 255, 0.07)" : "rgba(255, 255, 255, 0.04)"};
  }

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
  margin-top: 0.5rem;
  padding-top: 0.5rem;

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
  margin: 0.25rem auto 0.1rem;
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
  border: 1px solid
    ${(p) => (p.$tone === "danger" ? "rgba(255, 69, 58, 0.35)" : "rgba(255, 255, 255, 0.16)")};
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

export const StatusDot = styled.span<{
  $color: string;
  $talking?: boolean;
  $pending?: boolean;
}>`
  box-sizing: border-box;
  width: 0.5rem;
  height: 0.5rem;
  flex-shrink: 0;
  border-radius: 999px;
  border: 1.5px solid ${(p) => (p.$pending ? "#8d8d93" : p.$color)};
  background: ${(p) =>
    p.$pending ? "#8d8d93" : p.$talking ? p.$color : "transparent"};
  ${(p) => (p.$pending ? pendingPulse : "")};
  transition: background-color 80ms linear, border-color 80ms linear;
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

export const UserLeave = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
  flex-shrink: 0;
  height: 1.25rem;
  margin-left: auto;
  padding: 0 0.22rem 0 0.32rem;
  border: 0;
  border-radius: 0.28rem;
  background: transparent;
  color: #8d8d93;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.02em;
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

export const UserName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
