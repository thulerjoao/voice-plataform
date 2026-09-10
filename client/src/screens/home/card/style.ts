import styled from "styled-components";

export const Card = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid
    ${(p) =>
      p.$active ? "var(--selection-border)" : "var(--border)"};
  border-radius: 0.9rem;
  background: ${(p) =>
    p.$active ? "var(--selection)" : "var(--bg-surface)"};
  color: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${(p) =>
      p.$active ? "var(--selection-strong)" : "var(--bg-surface-hover)"};
  }

  &:active {
    transform: scale(0.997);
  }
`;

export const Mark = styled.span<{ $tone?: "owner" | "admin" }>`
  display: grid;
  place-items: center;
  width: 2.55rem;
  height: 2.55rem;
  flex-shrink: 0;
  border-radius: 0.7rem;
  background: var(--border);
  color: #c7c7cc;

  svg {
    width: 1.2rem;
    height: 1.2rem;
  }
`;

export const Copy = styled.span`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
`;

export const Name = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--text-primary);
`;

export const Code = styled.span`
  font-size: 0.82rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
`;

export const Occupancy = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
  color: var(--text-secondary);
  font-size: 0.88rem;
  font-weight: 600;

  svg {
    width: 0.95rem;
    height: 0.95rem;
  }
`;

export const Chevron = styled.span`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: var(--text-tertiary);

  svg {
    width: 1rem;
    height: 1rem;
  }
`;
