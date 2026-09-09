import styled from "styled-components";

export const Footer = styled.footer`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  height: 4.5rem;
  flex-shrink: 0;
  padding: 0 1.2rem;
  background: var(--bg-footer);
  border-top: 1px solid var(--border);

  @media (max-width: 900px) {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.75rem;
    height: auto;
    min-height: 4.1rem;
    padding: 0.65rem 0.75rem;
  }
`;

export const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
`;

export const FooterCenter = styled.div`
  display: flex;
  justify-content: center;
  min-width: 0;
`;

export const FooterRight = styled.div`
  display: flex;
  justify-content: flex-end;
  min-width: 0;
  height: 100%;
`;

export const ControlButton = styled.button<{ $on?: boolean }>`
  display: grid;
  place-items: center;
  width: 2.85rem;
  height: 2.85rem;
  border: 0;
  border-radius: 999px;
  background: ${(p) => (p.$on ? "var(--red-soft)" : "var(--border-soft)")};
  color: ${(p) => (p.$on ? "var(--red)" : "var(--text-primary)")};
  cursor: pointer;

  svg {
    display: block;
    width: 1.25rem;
    height: 1.25rem;
  }

  &:hover {
    background: ${(p) =>
      p.$on ? "var(--red-soft-hover)" : "var(--border-hover)"};
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const VolumeBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: min(22rem, 42vw);
  min-width: 11rem;
  height: 2.1rem;
  padding: 0 0.55rem;
  color: var(--text-secondary);

  svg {
    width: 1.4rem;
    height: 1.4rem;
    flex-shrink: 0;
  }

  @media (max-width: 900px) {
    width: 100%;
    min-width: 0;
  }
`;

export const VolumeSlider = styled.input<{ $value: number }>`
  flex: 1;
  min-width: 0;
  height: 1.6rem;
  margin: 0;
  border: 0;
  outline: none;
  appearance: none;
  background: transparent;
  cursor: pointer;

  &::-webkit-slider-runnable-track {
    height: 0.35rem;
    border: 0;
    border-radius: 999px;
    background: linear-gradient(
      to right,
      var(--blue) 0%,
      var(--blue) ${(p) => p.$value}%,
      var(--border) ${(p) => p.$value}%,
      var(--border) 100%
    );
  }

  &::-webkit-slider-thumb {
    appearance: none;
    width: 0.85rem;
    height: 0.85rem;
    margin-top: -0.25rem;
    border: 0;
    border-radius: 999px;
    background: var(--blue);
    box-shadow: none;
  }

  &::-moz-range-track {
    height: 0.35rem;
    border: 0;
    border-radius: 999px;
    background: var(--border);
  }

  &::-moz-range-progress {
    height: 0.35rem;
    border: 0;
    border-radius: 999px;
    background: var(--blue);
  }

  &::-moz-range-thumb {
    width: 0.85rem;
    height: 0.85rem;
    border: 0;
    border-radius: 999px;
    background: var(--blue);
    box-shadow: none;
  }

  &:focus,
  &:focus-visible {
    outline: none;
  }
`;

export const VolumeValue = styled.span`
  width: 2.3rem;
  flex-shrink: 0;
  color: var(--text-primary);
  font-size: 0.7rem;
  font-weight: 600;
  text-align: right;
  `;

export const UserWrap = styled.div`
  position: relative;
  min-width: 0;
  height: 100%;
  border-left: 1px solid var(--border);
  padding-left: 1rem;
  `;

export const UserCard = styled.button`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  max-width: 16rem;
  min-width: 0;
  /* padding: 0.5rem 1rem 0.5rem 1rem; */
  border: 0;
  /* border-radius: 0.85rem; */
  background: var(--bg--footer);
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  height: 100%;

  /* &:hover {
    background: var(--bg-surface-hover);
  }

  &:active {
    transform: scale(0.99);
  } */
`;

export const UserAvatar = styled.span`
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--border);
  color: var(--text-secondary);
  box-sizing: border-box;

  svg {
    width: 1.05rem;
    height: 1.05rem;
  }
`;

export const UserCopy = styled.span`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
  min-width: 6rem;
`;

export const UserName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.88rem;
  font-weight: 700;
`;

export const UserMeta = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 500;
`;

export const UserChevron = styled.span`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: var(--text-tertiary);

  svg {
    width: 0.85rem;
    height: 0.85rem;
  }
`;

export const StatusMenu = styled.div`
  position: absolute;
  right: 0;
  bottom: calc(100% + 0.45rem);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  width: max-content;
  min-width: 100%;
  padding: 0.3rem;
  border: 1px solid var(--border);
  border-radius: 0.7rem;
  background: var(--bg-surface);
  z-index: 5;
`;

export const StatusOption = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.7rem;
  white-space: nowrap;
  border: 0;
  border-radius: 0.5rem;
  background: ${(p) => (p.$active ? "var(--border)" : "transparent")};
  color: var(--text-primary);
  font-size: 0.82rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--border-hover);
  }
`;

export const StatusDot = styled.span<{ $color: string }>`
  box-sizing: border-box;
  width: 0.5rem;
  height: 0.5rem;
  flex-shrink: 0;
  border-radius: 999px;
  border: 1.5px solid ${(p) => p.$color};
  background: transparent;
`;
