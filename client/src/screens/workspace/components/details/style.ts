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
  border-bottom: 1px solid var(--border);
`;

export const Tab = styled.button<{ $active?: boolean }>`
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 0.45rem 0.4rem;
  border: 0;
  border-radius: 0.4rem;
  background: ${(p) => (p.$active ? "var(--bg-surface-hover)" : "transparent")};
  color: ${(p) => (p.$active ? "var(--text-primary)" : "var(--text-tertiary)")};
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
  padding: 0.75rem 0.55rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  background: transparent;
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
`;

export const SectionTitle = styled.h3`
  margin: 0 0 0.15rem;
  padding: 0 0.35rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-primary);
`;

export const PersonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

export const PersonRow = styled.button`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
  min-width: 0;
  margin: 0;
  padding: 0.4rem 0.35rem;
  border: 0;
  border-radius: 0.45rem;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--border-soft);
  }
`;

export const PersonAvatar = styled.span`
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--border-soft);
  color: var(--text-secondary);

  svg {
    width: 1.05rem;
    height: 1.05rem;
  }
`;

export const StatusDot = styled.span<{ $color: string; $hollow?: boolean }>`
  width: 0.55rem;
  height: 0.55rem;
  flex-shrink: 0;
  border-radius: 999px;
  box-sizing: border-box;
  background: ${(p) => (p.$hollow ? "transparent" : p.$color)};
  border: 1.5px solid ${(p) => p.$color};
  opacity: ${(p) => (p.$hollow ? 0.85 : 1)};
`;

export const PersonCopy = styled.span`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
`;

export const PersonName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
`;

export const PersonMeta = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.72rem;
  color: var(--text-tertiary);
`;

export const Empty = styled.p`
  margin: 0;
  padding: 0.35rem;
  font-size: 0.82rem;
  line-height: 1.4;
  color: var(--text-tertiary);
`;

export const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  margin: 0;
  padding: 0.55rem 0.65rem;
  border: 1px dashed var(--border);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color: var(--text-primary);
    border-color: var(--border-hover);
    background: var(--border-soft);
  }
`;
