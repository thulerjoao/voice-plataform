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

export const Scroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  background: transparent;
`;

export const Placeholder = styled.p`
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--text-tertiary);
`;
