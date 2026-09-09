import styled from "styled-components";

export const Splitter = styled.div`
  flex-shrink: 0;
  height: 1px;
  margin: 0;
  cursor: ns-resize;
  touch-action: none;
  position: relative;
  background: var(--bg-app);

  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 1px;
    border-top: 1px solid var(--border);
    transform: translateY(-50%);
  }

  &:hover::after,
  &:active::after {
    background: var(--border-hover);
    border-top: 1px solid var(--border-hover);
  }
`;

export const Chat = styled.section<{ $height?: number; $collapsed?: boolean }>`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: ${(p) =>
    p.$collapsed
      ? "auto"
      : p.$height == null
        ? "11.5rem"
        : `${p.$height}px`};
  min-height: 0;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: var(--bg-secondary);
  color: var(--text-primary);
`;

export const ChatHead = styled.div<{ $collapsed?: boolean }>`
  display: flex;
  align-items: stretch;
  min-width: 0;
  border-bottom: ${(p) =>
    p.$collapsed ? "0" : "1px solid var(--border-soft)"};
  background: var(--bg-);
`;

export const ChatTabs = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
`;

export const ChatCollapse = styled.button<{ $collapsed?: boolean }>`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.85rem;
  height: 1.85rem;
  margin: 0;
  padding: 0;
  border: 0;
  border-left: 1px solid var(--border-soft);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;

  svg {
    width: 0.85rem;
    height: 0.85rem;
    transform: rotate(${(p) => (p.$collapsed ? "180deg" : "0deg")});
    transition: transform 0.15s ease;
  }

  &:hover {
    color: var(--text-primary);
    background: var(--border-soft);
  }
`;

export const ChatTab = styled.div<{ $active?: boolean; $unread?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  box-sizing: border-box;
  flex-shrink: 0;
  width: 100%;
  min-width: 7rem;
  max-width: 11rem;
  height: 2rem;
  padding: 0 0.4rem 0 0.55rem;
  border: 0;
  border-radius: 0 0 0.5rem;
  border-right: 1px solid var(--border);
  border-bottom: 2px solid
    ${(p) => (p.$active ? "var(--blue)" : "transparent")};
  background: ${(p) =>
    p.$unread
      ? "var(--selection-strong)"
      : p.$active
        ? "var(--bg-secondary)"
        : "transparent"};
  color: ${(p) =>
    p.$active || p.$unread ? "var(--text-primary)" : "var(--text-secondary)"};
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color: var(--text-primary);
    background: ${(p) =>
      p.$unread ? "var(--selection)" : "var(--border-soft)"};
  }
`;

export const ChatTabLabel = styled.span`
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ChatClose = styled.button`
  display: grid;
  place-items: center;
  width: 1.05rem;
  height: 1.05rem;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  border-radius: 0.25rem;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;

  svg {
    width: 0.7rem;
    height: 0.7rem;
  }

  &:hover {
    background: var(--border-hover);
    color: var(--text-primary);
  }
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

export const ChatLine = styled.p<{ $log?: boolean }>`
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.35;
  color: ${(p) => (p.$log ? "var(--text-secondary)" : "var(--text-primary)")};
`;

export const ChatDay = styled.p`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.35rem 0 0.05rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--border);
  }
`;

export const ChatTime = styled.span`
  color: var(--text-tertiary);
`;

export const ChatNick = styled.span<{ $you?: boolean }>`
  color: ${(p) => (p.$you ? "var(--green)" : "var(--blue)")};
  font-weight: 600;
`;

export const ChatForm = styled.form`
  display: flex;
  gap: 0.4rem;
  padding: 0.45rem 0.55rem 0.5rem;
  border-top: 1px solid var(--border-soft);
  background: var(--bg-header);
`;

export const ChatInput = styled.input`
  flex: 1;
  min-width: 0;
  height: 2rem;
  padding: 0 0.65rem;
  border: 1px solid var(--border);
  border-radius: 0.4rem;
  background: var(--bg-surface);
  color: var(--text-primary);
  outline: none;
  font-size: 0.9rem;

  &::placeholder {
    color: var(--text-tertiary);
  }

  &:focus {
    border-color: var(--border-hover);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export const ChatSend = styled.button`
  height: 2rem;
  padding: 0 0.75rem;
  border: 0;
  border-radius: 0.4rem;
  background: var(--blue);
  color: var(--text-on-accent);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--blue-hover);
  }

  &:active:not(:disabled) {
    transform: scale(0.99);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
