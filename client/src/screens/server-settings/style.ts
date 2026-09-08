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

export const Section = styled.section`
  padding: 1.15rem 1.2rem 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.85rem;
  background: #2c2c2e;
`;

export const SectionTitle = styled.h2`
  margin: 0 0 1rem;
  color: #f5f5f7;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const Field = styled.div`
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

export const NameButton = styled.button`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  min-height: 2.35rem;
  padding: 0.4rem 0.7rem;
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

export const NameValue = styled.div`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 2.35rem;
  padding: 0.4rem 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.55rem;
  background: #1c1c1e;
  color: #f5f5f7;
  font-size: 0.95rem;
  font-weight: 600;
`;

export const NameEdit = styled.form`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
  min-height: 2.35rem;
  padding: 0.2rem 0.35rem 0.2rem 0.7rem;
  border: 1px solid rgba(10, 132, 255, 0.55);
  border-radius: 0.55rem;
  background: #1c1c1e;
`;

export const NameInput = styled.input`
  box-sizing: border-box;
  min-width: 0;
  flex: 1;
  height: 1.9rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f5f5f7;
  font-size: 0.95rem;
  font-weight: 600;
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

export const CodeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
`;

export const CodeValue = styled.span`
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  min-height: 2.35rem;
  padding: 0.4rem 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.55rem;
  background: #1c1c1e;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.05em;
`;

export const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  flex-shrink: 0;
  height: 2.35rem;
  min-width: 6.5rem;
  padding: 0 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0.55rem;
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
`;

export const StaffList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.55rem;
  background: #1c1c1e;
  overflow: hidden;
`;

export const StaffRow = styled.li<{ $you?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  min-height: 2.35rem;
  padding: 0.4rem 0.7rem;
  background: ${(p) => (p.$you ? "rgba(255, 255, 255, 0.05)" : "transparent")};

  & + & {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
`;

export const StaffName = styled.span`
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #f5f5f7;
  font-size: 0.95rem;
  font-weight: 600;
`;

export const StaffMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-shrink: 0;
`;

export const StaffActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.1rem;
  width: 2.9rem;
  flex-shrink: 0;
`;

export const StaffRole = styled.span`
  box-sizing: border-box;
  flex-shrink: 0;
  width: 3.1rem;
  color: #8d8d93;
  font-size: 0.75rem;
  font-weight: 700;
  text-align: right;
`;

export const StaffIcon = styled.button<{ $tone?: "danger" }>`
  display: grid;
  place-items: center;
  width: 1.4rem;
  height: 1.4rem;
  padding: 0;
  border: 0;
  border-radius: 0.3rem;
  background: transparent;
  color: ${(p) => (p.$tone === "danger" ? "#ff453a" : "#8d8d93")};
  cursor: pointer;

  svg {
    display: block;
    width: 0.95rem;
    height: 0.95rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: ${(p) => (p.$tone === "danger" ? "#ff6b63" : "#f5f5f7")};
  }

  &:disabled {
    opacity: 0.45;
    cursor: default;
    pointer-events: none;
  }
`;

export const StaffAction = styled.button<{ $tone?: "default" | "danger" }>`
  padding: 0;
  border: 0;
  background: transparent;
  color: ${(p) => (p.$tone === "danger" ? "#c98989" : "#8d8d93")};
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color: ${(p) => (p.$tone === "danger" ? "#ff8a80" : "#d1d1d6")};
    text-decoration: underline;
  }

  &:disabled {
    opacity: 0.45;
    cursor: default;
    pointer-events: none;
    text-decoration: none;
  }
`;

export const MetaValue = styled.div`
  min-height: 1.2rem;
  color: #f5f5f7;
  font-size: 0.95rem;
  font-weight: 600;
`;

export const ErrorText = styled.p`
  margin: 0.7rem 0 0;
  color: #ff8a80;
  font-size: 0.78rem;
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

  &:hover:not(:disabled) {
    background: rgba(255, 69, 58, 0.2);
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

export const Hint = styled.p`
  margin: 0.75rem 0 0;
  color: #8d8d93;
  font-size: 0.75rem;
  line-height: 1.45;
  text-align: center;
`;
