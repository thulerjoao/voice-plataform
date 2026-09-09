import styled from "styled-components";

export const Header = styled.header<{ $sideWidth: number }>`
  display: grid;
  grid-template-columns: ${(p) => p.$sideWidth}px minmax(0, 1fr) auto;
  align-items: center;
  height: 3.8rem;
  flex-shrink: 0;
  background: var(--bg-header);
  border-bottom: 1px solid var(--border);

  @media (max-width: 900px) {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }
`;

export const BrandSide = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  width: 100%;
  height: 100%;
  padding: 0 0.75rem 0 0.65rem;
  border-right: 1px solid var(--border);
`;

export const IconButton = styled.button`
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;

  svg {
    display: block;
    width: 1.3rem;
    height: 1.3rem;
  }

  &:hover {
    background: var(--border-soft);
    color: var(--text-primary);
  }
`;

export const BrandMark = styled.span`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: var(--blue);

  svg {
    display: block;
    width: 1.35rem;
    height: 1.35rem;
  }
`;

export const BrandName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--text-primary);
`;

export const Center = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  height: 100%;
  padding: 0 1.5rem;
`;

export const ServerMark = styled.span`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: var(--text-secondary);

  svg {
    display: block;
    width: 1.35rem;
    height: 1.35rem;
  }
`;

export const ServerName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.98rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin-right: 24px;
  margin-left: 12px;
`;

export const CodeContainer = styled.button`
  background: var(--bg-app);
  color: var(--text-secondary);
  border-radius: 0.45rem;
  overflow: hidden;
  border: 1px solid var(--border);
  cursor: pointer;
  display: flex;
  align-items: center;
  text-align: center;
`;

export const CodePill = styled.span`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  height: 1.7rem;
  padding: 0 0.65rem;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  border-right: 1px solid var(--border);
`;

export const CopyButton = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  height: 1.7rem;
  padding: 0 0.7rem;
  border: 0;
  font-size: 0.8rem;
  font-weight: 600;

  svg {
    display: block;
    width: 0.9rem;
    height: 0.9rem;
  }
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  height: 100%;
  padding: 0 0.75rem 0 0.5rem;
`;
