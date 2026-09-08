import styled from "styled-components";

export const Panel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

export const BackRow = styled.div`
  display: flex;
  justify-content: flex-start;
`;

export const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.45rem;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: #f5f5f7;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;

  svg {
    display: block;
    width: 1.05rem;
    height: 1.05rem;
    flex-shrink: 0;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
`;

export const Body = styled.div`
  width: 100%;
  max-width: 36rem;
  margin: 0 auto;
  padding: 0.4rem 0 2.5rem;
`;

export const Heading = styled.h1`
  margin: 0 0 0.35rem;
  font-size: 1.7rem;
  font-weight: 700;
  letter-spacing: -0.04em;
`;

export const Lead = styled.p`
  margin: 0 0 1.4rem;
  color: #a1a1a6;
  font-size: 0.9rem;
  line-height: 1.45;
`;

export const Tabs = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
  margin: 0 0 1rem;
`;

export const Tab = styled.button<{ $active?: boolean }>`
  height: 2.05rem;
  border: 1px solid
    ${(p) => (p.$active ? "rgba(10, 132, 255, 0.5)" : "rgba(255, 255, 255, 0.1)")};
  border-radius: 0.5rem;
  background: ${(p) => (p.$active ? "rgba(10, 132, 255, 0.18)" : "#1c1c1e")};
  color: #f5f5f7;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: ${(p) =>
      p.$active ? "rgba(10, 132, 255, 0.24)" : "rgba(255, 255, 255, 0.05)"};
  }
`;

export const Section = styled.section`
  padding: 1.15rem 1.2rem 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.85rem;
  background: #2c2c2e;

  & + & {
    margin-top: 0.9rem;
  }
`;

export const SectionTitle = styled.h2`
  margin: 0 0 1rem;
  color: #f5f5f7;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  & + & {
    margin-top: 1rem;
  }
`;

export const FieldLabel = styled.span`
  color: #a1a1a6;
  font-size: 0.75rem;
  font-weight: 600;
`;

export const DeviceField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  & + & {
    margin-top: 1rem;
  }
`;

export const DeviceWrap = styled.div`
  position: relative;
`;

export const DeviceButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  width: 100%;
  min-height: 2.35rem;
  padding: 0.4rem 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 0.55rem;
  background: #1c1c1e;
  color: #f5f5f7;
  font-size: 0.88rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #242426;
    border-color: rgba(255, 255, 255, 0.24);
  }
`;

export const DeviceName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const DeviceChevron = styled.span`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: #8d8d93;

  svg {
    width: 0.75rem;
    height: 0.75rem;
  }
`;

export const DeviceMenu = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 0.3rem);
  z-index: 8;
  max-height: 14rem;
  overflow: auto;
  padding: 0.3rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.65rem;
  background: #3a3a3c;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
`;

export const DeviceOption = styled.button<{ $active?: boolean }>`
  display: block;
  width: 100%;
  padding: 0.55rem 0.65rem;
  border: 0;
  border-radius: 0.45rem;
  background: ${(p) => (p.$active ? "rgba(10, 132, 255, 0.2)" : "transparent")};
  color: #f5f5f7;
  font-size: 0.84rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${(p) => (p.$active ? "rgba(10, 132, 255, 0.26)" : "rgba(255, 255, 255, 0.06)")};
  }

  &:disabled {
    color: #8d8d93;
    cursor: default;
    font-weight: 500;
  }
`;

export const Hint = styled.p`
  margin: 0.75rem 0 0;
  color: #8d8d93;
  font-size: 0.75rem;
  line-height: 1.45;
`;

export const ErrorText = styled.p`
  margin: 0.55rem 0 0;
  color: #ff8a80;
  font-size: 0.78rem;
`;

export const MeterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-top: 1.1rem;
`;

export const MeterTrack = styled.div`
  position: relative;
  flex: 1;
  height: 0.45rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
`;

export const MeterClip = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
`;

export const MeterBar = styled.div<{ $level: number; $cut: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${(p) => `${Math.min(100, Math.max(0, p.$level * 100))}%`};
  background: ${(p) => {
    const level = Math.max(p.$level, 0.0001);
    const at = `${Math.min(100, Math.max(0, (p.$cut / level) * 100)).toFixed(2)}%`;
    return `linear-gradient(to right, #0a84ff 0, #0a84ff ${at}, #30d158 ${at}, #30d158 100%)`;
  }};
`;

export const MeterMark = styled.div<{ $pct: number }>`
  position: absolute;
  top: -3px;
  bottom: -3px;
  left: ${(p) =>
    p.$pct <= 0
      ? "1px"
      : p.$pct >= 100
        ? "calc(100% - 3px)"
        : `calc(${p.$pct}% - 1px)`};
  z-index: 2;
  width: 2px;
  border-radius: 1px;
  background: #f5f5f7;
  pointer-events: none;
`;

export const GhostButton = styled.button`
  flex-shrink: 0;
  height: 1.9rem;
  padding: 0 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.45rem;
  background: transparent;
  color: #f5f5f7;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  &[data-on="true"] {
    border-color: rgba(10, 132, 255, 0.45);
    background: rgba(10, 132, 255, 0.16);
  }
`;

export const ModeRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.45rem;

  & + ${Field} {
    margin-top: 1.25rem;
  }

  & + ${Hint} {
    margin-top: 1rem;
  }
`;

export const ModeButton = styled.button<{ $active?: boolean }>`
  height: 2.15rem;
  border: 1px solid
    ${(p) => (p.$active ? "rgba(10, 132, 255, 0.5)" : "rgba(255, 255, 255, 0.1)")};
  border-radius: 0.5rem;
  background: ${(p) => (p.$active ? "rgba(10, 132, 255, 0.18)" : "#1c1c1e")};
  color: #f5f5f7;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: ${(p) => (p.$active ? "rgba(10, 132, 255, 0.24)" : "rgba(255, 255, 255, 0.05)")};
  }
`;

export const SliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
`;

export const Slider = styled.input`
  flex: 1;
  min-width: 0;
  height: 0.35rem;
  margin: 0;
  accent-color: #2f6fed;
  cursor: pointer;
`;

export const StepButton = styled.button`
  display: grid;
  place-items: center;
  width: 1.7rem;
  height: 1.7rem;
  flex-shrink: 0;
  border: 0;
  border-radius: 0.4rem;
  background: rgba(255, 255, 255, 0.06);
  color: #f5f5f7;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

export const Value = styled.span`
  width: 3.7rem;
  flex-shrink: 0;
  color: #f5f5f7;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: right;
`;

export const BindRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin-top: 0.35rem;
  padding-top: 0.9rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

export const BindLabel = styled.div`
  min-width: 0;
  color: #d1d1d6;
  font-size: 0.84rem;
  font-weight: 600;
`;

export const BindActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
`;

export const BindButton = styled.button<{ $listening?: boolean }>`
  min-width: 6.4rem;
  height: 1.9rem;
  padding: 0 0.65rem;
  border: 1px solid
    ${(p) => (p.$listening ? "rgba(10, 132, 255, 0.55)" : "rgba(255, 255, 255, 0.14)")};
  border-radius: 0.45rem;
  background: ${(p) => (p.$listening ? "rgba(10, 132, 255, 0.16)" : "#1c1c1e")};
  color: ${(p) => (p.$listening ? "#f5f5f7" : "#d1d1d6")};
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: ${(p) => (p.$listening ? "rgba(10, 132, 255, 0.22)" : "rgba(255, 255, 255, 0.05)")};
  }
`;

export const ClearBind = styled.button`
  height: 1.9rem;
  padding: 0 0.5rem;
  border: 0;
  border-radius: 0.4rem;
  background: transparent;
  color: #8d8d93;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color: #f5f5f7;
    background: rgba(255, 255, 255, 0.06);
  }
`;

export const ToggleRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0;

  & + & {
    margin-top: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
`;

export const ToggleCopy = styled.div`
  min-width: 0;
`;

export const ToggleTitle = styled.div`
  color: #f5f5f7;
  font-size: 0.86rem;
  font-weight: 600;
`;

export const ToggleHint = styled.div`
  margin-top: 0.15rem;
  color: #8d8d93;
  font-size: 0.72rem;
  line-height: 1.35;
`;

export const Switch = styled.button<{ $on?: boolean }>`
  position: relative;
  width: 2.3rem;
  height: 1.25rem;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: ${(p) => (p.$on ? "#2f6fed" : "rgba(255, 255, 255, 0.18)")};
  cursor: pointer;

  &::after {
    content: "";
    position: absolute;
    top: 0.12rem;
    left: ${(p) => (p.$on ? "1.15rem" : "0.12rem")};
    width: 1.01rem;
    height: 1.01rem;
    border-radius: 999px;
    background: #fff;
  }
`;

export const NameButton = styled.button`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  height: 2.35rem;
  padding: 0 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 0.55rem;
  background: #1c1c1e;
  color: #f5f5f7;
  text-align: left;
  cursor: pointer;

  span {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.2;
  }

  svg {
    flex-shrink: 0;
    width: 1rem;
    height: 1rem;
    color: #a1a1a6;
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.28);
  }
`;

export const NameEdit = styled.form`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
  height: 2.35rem;
  padding: 0 0.35rem 0 0.7rem;
  border: 1px solid rgba(10, 132, 255, 0.55);
  border-radius: 0.55rem;
  background: #1c1c1e;
`;

export const NameInput = styled.input`
  box-sizing: border-box;
  min-width: 0;
  flex: 1;
  height: 1.7rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f5f5f7;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.7rem;
  outline: none;
`;

export const NameIcon = styled.button`
  display: grid;
  place-items: center;
  width: 1.7rem;
  height: 1.7rem;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  border-radius: 0.4rem;
  background: transparent;
  color: #a1a1a6;
  cursor: pointer;

  svg {
    width: 0.9rem;
    height: 0.9rem;
  }

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    color: #f5f5f7;
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
`;

export const CodeBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.7rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.55rem;
  background: #1c1c1e;

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  svg {
    width: 0.8rem;
    height: 0.8rem;
  }
`;

export const RecoveryCode = styled.code`
  min-width: 0;
  flex: 1;
  color: #f5f5f7;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  word-break: break-all;
`;

export const Warn = styled.p`
  margin: 0.85rem 0 0;
  color: #c7c7cc;
  font-size: 0.8rem;
  line-height: 1.5;
`;

export const DangerButton = styled.button`
  display: block;
  height: 2.05rem;
  padding: 0 0.85rem;
  margin: 1.15rem auto 0;
  border: 1px solid rgba(255, 69, 58, 0.38);
  border-radius: 0.5rem;
  background: rgba(255, 69, 58, 0.12);
  color: #ff8a80;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: rgba(255, 69, 58, 0.2);
  }
`;
