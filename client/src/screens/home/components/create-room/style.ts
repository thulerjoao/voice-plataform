import styled from "styled-components";

export const Panel = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

export const BackRow = styled.div`
  position: relative;
  z-index: 1;
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

  span {
    line-height: 1;
    transform: translateY(-0.06em);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
`;

export const Body = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 26rem;
  margin: 0 auto;
  padding: 1rem 0 2.5rem;
  text-align: center;
`;

export const HeroIcon = styled.div`
  display: grid;
  place-items: center;
  width: 6.2rem;
  height: 6.2rem;
  margin-bottom: 1.15rem;
  color: #a1a1a6;

  svg,
  img {
    display: block;
    width: 5.4rem;
    height: 5.4rem;
  }
`;

export const SuccessIcon = styled.div`
  display: grid;
  place-items: center;
  width: 3.4rem;
  height: 3.4rem;
  margin-bottom: 1.15rem;
  border-radius: 999px;
  background: #30d158;
  color: #fff;

  svg {
    width: 1.7rem;
    height: 1.7rem;
  }
`;

export const Title = styled.h1`
  margin: 0 0 0.55rem;
  font-size: 2rem;
  font-weight: 600;
  letter-spacing: -0.04em;
  color: #ffffff;
`;

export const Subtitle = styled.p`
  margin: 0 0 1.5rem;
  color: #a1a1a6;
  font-size: 0.95rem;
  line-height: 1.45;
`;

export const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;

export const Field = styled.label`
  display: block;
  text-align: left;
`;

export const FieldLabel = styled.span`
  display: block;
  margin-bottom: 0.45rem;
  color: #a1a1a6;
  font-size: 0.88rem;
  font-weight: 600;
`;

export const FieldBox = styled.span`
  position: relative;
  display: block;
`;

export const FieldIcon = styled.span`
  position: absolute;
  top: 50%;
  left: 0.95rem;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  color: #8d8d93;
  pointer-events: none;

  svg {
    width: 1.2rem;
    height: 1.2rem;
  }
`;

export const Input = styled.input`
  width: 100%;
  height: 3rem;
  padding: 0 1rem 0 2.7rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.7rem;
  background: #3a3a3c;
  color: #f5f5f7;
  font: inherit;
  font-size: 0.98rem;
  outline: none;

  &::placeholder {
    color: #8d8d93;
  }

  &:focus {
    border-color: #3b82f6;
  }
`;

export const Submit = styled.button`
  width: 100%;
  height: 3rem;
  margin-top: 1.15rem;
  border: 0;
  border-radius: 0.75rem;
  background: #2f6fed;
  color: #fff;
  font: inherit;
  font-size: 1.02rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #3b7cff;
  }

  &:active:not(:disabled) {
    transform: scale(0.99);
  }

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }
`;

export const Cancel = styled.button`
  margin-top: 0.85rem;
  border: 0;
  background: transparent;
  color: #f5f5f7;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color: #ffffff;
  }
`;

export const ErrorText = styled.p`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0.75rem 0 0;
  height: 1.25rem;
  color: #ff453a;
  font-size: 0.88rem;
  line-height: 1.25rem;
`;

export const RoomLine = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0 0 1.35rem;
  color: #f5f5f7;
  font-size: 1rem;
  font-weight: 600;

  svg {
    width: 1.15rem;
    height: 1.15rem;
    color: #8d8d93;
  }
`;

export const AdminBadge = styled.span`
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: rgba(47, 111, 237, 0.2);
  color: #7eb0ff;
  font-size: 0.72rem;
  font-weight: 600;
`;

export const CodeBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  min-height: 4.4rem;
  padding: 0.7rem 0.75rem 0.7rem 1.15rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.85rem;
  background: #3a3a3c;
`;

export const Code = styled.span`
  font-size: 1.45rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #ffffff;
`;

export const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2.4rem;
  padding: 0 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0.65rem;
  background: transparent;
  color: #f5f5f7;
  font-size: 0.88rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;

  svg {
    width: 0.95rem;
    height: 0.95rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  &:active {
    transform: scale(0.99);
  }
`;

export const CodeHint = styled.p`
  margin: 0.85rem 0 0;
  color: #a1a1a6;
  font-size: 0.92rem;
`;

export const Copied = styled.p`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0.85rem 0 0;
  height: 1.25rem;
  color: #30d158;
  font-size: 0.9rem;
  font-weight: 600;

  svg {
    width: 0.95rem;
    height: 0.95rem;
  }
`;
