import styled, { css, keyframes } from "styled-components";

const linkPulseKeyframes = keyframes`
  0% {
    border-color: #4a4a4e;
    color: #4a4a4e;
  }
  100% {
    border-color: #e8e8ed;
    color: #e8e8ed;
  }
`;

const linkPulse = css`
  animation: ${linkPulseKeyframes} 0.45s ease-in-out infinite alternate;
`;

export const Aside = styled.aside<{ $width: number }>`
  position: relative;
  display: flex;
  flex-direction: column;
  width: ${(p) => p.$width}px;
  flex-shrink: 0;
  min-height: 0;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
`;

export const ResizeHandle = styled.div`
  position: absolute;
  top: 0;
  right: -3px;
  z-index: 6;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  touch-action: none;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 2px;
    width: 2px;
    border-radius: 1px;
    background: transparent;
    transition: background 0.12s ease;
  }

  &:hover::after,
  &:active::after {
    background: var(--border-hover);
  }
`;

export const ServerWrap = styled.div`
  position: relative;
  flex-shrink: 0;
  padding: 0.75rem 0.7rem 0.55rem;
`;

export const ServerButton = styled.button<{ $open?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.55rem 0.55rem 0.55rem 0.5rem;
  border: 1px solid
    ${(p) => (p.$open ? "var(--selection-border)" : "var(--border)")};
  border-radius: 0.75rem;
  background: ${(p) =>
    p.$open ? "var(--selection)" : "rgba(255, 255, 255, 0.03)"};
  color: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${(p) =>
      p.$open ? "var(--selection-strong)" : "var(--border-soft)"};
  }
`;

export const ServerMark = styled.span`
  display: grid;
  place-items: center;
  width: 2.15rem;
  height: 2.15rem;
  flex-shrink: 0;
  border-radius: 0.55rem;
  background: var(--blue);
  color: var(--text-on-accent);

  svg {
    display: block;
    width: 2rem;
    height: 2rem;
  }
`;

export const ServerCopy = styled.span`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

export const ServerName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.92rem;
  font-weight: 650;
  color: var(--text-primary);
`;

export const ServerCode = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-secondary);
`;

export const ServerChevron = styled.span<{ $open?: boolean }>`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: var(--text-tertiary);
  transform: rotate(${(p) => (p.$open ? "180deg" : "0deg")});
  transition: transform 0.15s ease;

  svg {
    width: 0.95rem;
    height: 0.95rem;
  }
`;

export const ServerMenu = styled.div`
  position: absolute;
  z-index: 20;
  top: calc(100% - 0.2rem);
  left: 0.7rem;
  right: 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.35rem;
  border: 1px solid var(--border);
  border-radius: 0.7rem;
  background: var(--bg-header);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
  
`;

export const ServerMenuItem = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
  padding: 0.45rem 0.5rem;
  border: 0;
  border-radius: 0.5rem;
  background: ${(p) => (p.$active ? "var(--selection)" : "transparent")};
  color: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${(p) =>
      p.$active ? "var(--selection-strong)" : "var(--border-soft)"};
  }
`;

export const MenuMark = styled.span`
  display: grid;
  place-items: center;
  width: 1.7rem;
  height: 1.7rem;
  flex-shrink: 0;
  border-radius: 0.4rem;
  background: var(--border);
  color: var(--text-secondary);

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`;

export const MenuCopy = styled.span`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
`;

export const MenuName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-primary);
`;

export const MenuCode = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-tertiary);
`;

export const MenuLive = styled.span`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.15rem;
  height: 1.15rem;
  color: var(--blue);

  svg {
    display: block;
    width: 1rem;
    height: 1rem;
  }
`;

export const SalaList = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0.25rem 0.55rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

export const SalaBlock = styled.div<{ $drop?: boolean }>`
  display: flex;
  flex-direction: column;
  border-radius: 0.5rem;
  background: ${(p) =>
    p.$drop ? "var(--selection)" : "transparent"};
  transition: background 80ms linear;
`;

export const SalaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.15rem;
  width: 100%;
  min-width: 0;
  cursor: pointer;
`;

export const SalaToggle = styled.span<{ $open?: boolean }>`
  display: grid;
  place-items: center;
  width: 1.35rem;
  height: 1.7rem;
  flex-shrink: 0;
  color: var(--text-tertiary);
  pointer-events: none;
  transform: rotate(${(p) => (p.$open ? "0deg" : "-90deg")});
  transition: transform 0.15s ease;

  svg {
    width: 0.9rem;
    height: 0.9rem;
  }
`;

export const SalaMain = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  flex: 1;
  padding: 0.38rem 0.4rem;
`;

export const SalaFolder = styled.span`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: var(--text-secondary);

  svg {
    display: block;
    width: 1.05rem;
    height: 1.05rem;
  }
`;

export const SalaName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
`;

export const SalaTitle = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
  flex: 1;
`;

export const SalaCount = styled.span`
  flex-shrink: 0;
  margin-left: 0.25rem;
  font-size: 0.70rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--text-tertiary);
`;

export const SalaBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-height: 0.35rem;
  padding: 0.12rem 0 0.3rem 1.55rem;
`;

export const SalaEmpty = styled.p`
  margin: 0;
  padding: 0.15rem 0.35rem 0.35rem;
  padding-left: 1.2rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
`;

export const UserRow = styled.div<{
  $you?: boolean;
  $active?: boolean;
  $dragging?: boolean;
  $movable?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  padding: 0.28rem 0.4rem;
  padding-left: 1.2rem;
  border-radius: 0.5rem;
  background: ${(p) => (p.$active ? "var(--selection)" : "transparent")};
  cursor: ${(p) => (p.$movable ? "grab" : "default")};
  opacity: ${(p) => (p.$dragging ? 0.4 : 1)};
  user-select: none;

  &:hover {
    background: ${(p) =>
      p.$active ? "var(--selection-strong)" : "var(--border-soft)"};
  }

  &:active {
    cursor: ${(p) => (p.$movable ? "grabbing" : "default")};
  }
`;

export const UserAvatar = styled.span<{
  $statusColor: string;
  $pending?: boolean;
}>`
  display: grid;
  place-items: center;
  width: 1.1rem;
  height: 1.1rem;
  flex-shrink: 0;
  border-radius: 999px;
  border: 1.5px solid
    ${(p) => (p.$pending ? "#8d8d93" : p.$statusColor)};
  background: var(--border);
  color: ${(p) => (p.$pending ? "#8d8d93" : p.$statusColor)};
  box-sizing: border-box;
  transition:
    border-color 80ms linear,
    color 80ms linear;
  ${(p) => (p.$pending ? linkPulse : "")}

  svg {
    width: 0.78rem;
    height: 0.78rem;
  }
`;

export const UserName = styled.span`
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-primary);
`;

export const UserFlag = styled.span<{ $tone?: "mute" | "talk" }>`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 999px;
  color: ${(p) =>
    p.$tone === "mute"
      ? "var(--red)"
      : p.$tone === "talk"
        ? "var(--blue)"
        : "var(--text-tertiary)"};
  transition: color 80ms linear;

  svg {
    display: block;
    width: 0.95rem;
    height: 0.95rem;
  }
`;

export const CreateSala = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  margin-top: 0.35rem;
  padding: 0.45rem 0.45rem;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;

  svg {
    width: 0.95rem;
    height: 0.95rem;
  }

  &:hover {
    background: var(--border-soft);
    color: var(--text-primary);
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

export const SalaError = styled.p`
  margin: 0.25rem 0.2rem 0;
  font-size: 0.75rem;
  color: var(--red);
`;
