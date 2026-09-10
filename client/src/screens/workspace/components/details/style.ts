import styled from "styled-components";

export const DETAILS_WIDTH = 300;
export const DETAILS_COLLAPSED = 36;

export const Aside = styled.aside<{ $collapsed?: boolean }>`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: ${(p) => (p.$collapsed ? DETAILS_COLLAPSED : DETAILS_WIDTH)}px;
  min-height: 0;
  border-left: 1px solid var(--border);
  background: transparent;
  color: var(--text-primary);
  overflow: hidden;
  transition: width 0.15s ease;
`;

export const CollapseRail = styled.button`
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;

  svg {
    width: 0.9rem;
    height: 0.9rem;
  }

  &:hover {
    color: var(--text-primary);
    background: var(--border-soft);
  }
`;

export const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  min-height: 2.5rem;
  padding: 0 0.4rem 0 0.85rem;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border);
  cursor: pointer;

  &:hover {
    color: var(--text-primary);
    background: var(--border-soft);
  }
`;

export const HeadTitle = styled.p`
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-tertiary);
`;

export const CollapseButton = styled.button`
  display: grid;
  place-items: center;
  width: 1.85rem;
  height: 1.85rem;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0.35rem;
  background: transparent;
  color: var(--text-secondary);

  svg {
    width: 0.85rem;
    height: 0.85rem;
  }
`;

export const TabBar = styled.div`
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  gap: 0.3rem;
  padding: 0.35rem 0.45rem;
`;

export const Tab = styled.button<{ $active?: boolean }>`
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 0.45rem 0.4rem;
  border: 0;
  border-radius: 0.4rem;
  background: ${(p) => (p.$active ? "var(--bg-surface-hover)" : "transparent")};
  color: ${(p) =>
    p.$active ? "var(--text-primary)" : "var(--text-tertiary)"};
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    color: var(--text-primary);
    background: var(--bg-surface-hover);
  }
`;


export const Scroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  background: transparent;
`;

export const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  padding: 0.95rem 0.85rem 1.05rem;
  border: 0;
  border-radius: 0;
  background: transparent;
`;

export const PanelTitle = styled.h3`
  margin: 0;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-secondary);
`;

export const Empty = styled.p`
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.4;
  color: var(--text-secondary);
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
`;

export const TitleButton = styled.button<{ $empty?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  min-width: 0;
  margin: 0;
  padding: 0.55rem 0.65rem;
  border: 0;
  border-radius: 0.7rem;
  background: transparent;
  color: ${(p) =>
    p.$empty ? "var(--text-tertiary)" : "var(--text-primary)"};
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--border-soft);
  }

  svg {
    flex-shrink: 0;
    width: 1rem;
    height: 1rem;
    color: var(--text-secondary);
  }
`;

export const TitleText = styled.span`
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

export const TitleEdit = styled.form`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  width: 100%;
  min-width: 0;
  margin: 0;
  padding: 0.25rem 0.3rem;
  border-radius: 0.7rem;
  background: var(--bg-surface);
`;

export const TitleInput = styled.input`
  min-width: 0;
  flex: 1;
  height: 1.85rem;
  padding: 0 0.45rem;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 600;
  outline: none;

  &::placeholder {
    color: var(--text-tertiary);
    font-weight: 500;
  }
`;

export const IconButton = styled.button`
  display: grid;
  place-items: center;
  width: 1.7rem;
  height: 1.7rem;
  flex-shrink: 0;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0.4rem;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;

  svg {
    width: 0.95rem;
    height: 0.95rem;
  }

  &:hover:not(:disabled) {
    background: var(--border-hover);
    color: var(--text-primary);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

export const Meta = styled.p`
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--text-tertiary);
`;

export const Desc = styled.p<{ $empty?: boolean }>`
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: ${(p) =>
    p.$empty ? "var(--text-tertiary)" : "var(--text-secondary)"};
  font-style: ${(p) => (p.$empty ? "italic" : "normal")};
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
`;

export const FieldLabel = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-tertiary);
`;

export const Input = styled.input`
  width: 100%;
  height: 2rem;
  padding: 0 0.55rem;
  border: 1px solid var(--border);
  border-radius: 0.4rem;
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.85rem;
  outline: none;

  &:focus {
    border-color: var(--border-hover);
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  min-height: 3.6rem;
  padding: 0.45rem 0.55rem;
  border: 1px solid var(--border);
  border-radius: 0.4rem;
  background: var(--bg-surface);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.85rem;
  resize: vertical;
  outline: none;

  &:focus {
    border-color: var(--border-hover);
  }
`;

export const EditActions = styled.div`
  display: flex;
  gap: 0.4rem;
`;

export const ActionButton = styled.button<{ $tone?: "danger" | "ghost" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  min-height: 2.05rem;
  padding: 0 0.65rem;
  border: 1px solid
    ${(p) => (p.$tone === "danger" ? "transparent" : "var(--border)")};
  border-radius: 0.45rem;
  background: ${(p) =>
    p.$tone === "danger"
      ? "var(--red-soft)"
      : p.$tone === "ghost"
        ? "var(--bg-surface)"
        : "var(--bg-surface)"};
  color: ${(p) =>
    p.$tone === "danger" ? "var(--red)" : "var(--text-primary)"};
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;

  svg {
    width: 0.95rem;
    height: 0.95rem;
    flex-shrink: 0;
  }

  &:hover:not(:disabled) {
    background: ${(p) =>
      p.$tone === "danger"
        ? "var(--red-soft-hover)"
        : "var(--bg-surface-hover)"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ActionStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.15rem;
`;

export const Divider = styled.div`
  height: 1px;
  margin: 0.15rem 0;
  background: var(--border-soft);
`;

export const SubSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

export const SubTitle = styled.h4`
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--text-tertiary);
`;

export const PersonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

export const PersonRow = styled.div<{ $you?: boolean; $interactive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
  min-width: 0;
  margin: 0;
  padding: 0.4rem 0.35rem;
  border: 0;
  border-radius: 0.45rem;
  background: ${(p) => (p.$you ? "var(--border-soft)" : "transparent")};
  color: inherit;
  text-align: left;
  cursor: ${(p) => (p.$interactive ? "pointer" : "default")};

  ${(p) =>
    p.$interactive
      ? `
    &:hover {
      background: var(--border-soft);
    }
  `
      : ""}
`;

export const PersonMain = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;
`;

export const PersonAvatar = styled.span`
  display: grid;
  place-items: center;
  width: 1.85rem;
  height: 1.85rem;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--border-soft);
  color: var(--text-secondary);

  svg {
    width: 0.95rem;
    height: 0.95rem;
  }
`;

export const PersonCopy = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
`;

export const PersonName = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--text-primary);
`;

export const PersonMeta = styled.span`
  font-size: 0.72rem;
  color: var(--text-tertiary);
`;

export const PersonBadge = styled.span`
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  font-size: 0.72rem;
  line-height: 1;
`;

export const PersonAction = styled.button<{ $tone?: "danger" }>`
  flex-shrink: 0;
  margin: 0;
  padding: 0.2rem 0.4rem;
  border: 0;
  border-radius: 0.3rem;
  background: transparent;
  color: ${(p) => (p.$tone === "danger" ? "var(--red)" : "var(--text-secondary)")};
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${(p) =>
      p.$tone === "danger" ? "var(--red-soft)" : "var(--border-hover)"};
    color: ${(p) => (p.$tone === "danger" ? "var(--red)" : "var(--text-primary)")};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

export const CodeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
`;

export const CodeValue = styled.code`
  flex: 1;
  min-width: 0;
  padding: 0.45rem 0.55rem;
  border: 1px solid var(--border);
  border-radius: 0.4rem;
  color: var(--text-primary);
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
  height: 2rem;
  margin: 0;
  padding: 0 0.6rem;
  border: 1px solid var(--border);
  border-radius: 0.4rem;
  background: var(--bg-surface);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;

  svg {
    width: 0.85rem;
    height: 0.85rem;
  }

  &:hover {
    color: var(--text-primary);
    background: var(--bg-surface-hover);
  }
`;

export const Hint = styled.p`
  margin: 0;
  color: var(--text-tertiary);
  font-size: 0.75rem;
  line-height: 1.45;
  text-align: center;
`;

export const ErrorText = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: var(--red);
`;

export const SalaIcon = styled.span`
  display: grid;
  place-items: center;
  color: var(--text-secondary);

  svg {
    width: 1.05rem;
    height: 1.05rem;
  }
`;
