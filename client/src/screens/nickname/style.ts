import styled from "styled-components";

export const Screen = styled.main`
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1.5rem;
  background: #121214;
`;

export const Content = styled.div`
  width: 22.5rem;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

export const Brand = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2.35rem;
  color: #ffffff;
  font-size: 2.35rem;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1;
`;

export const BrandIcon = styled.span`
  display: grid;
  place-items: center;
  color: #3b82f6;

  svg {
    display: block;
    width: 2.5rem;
    height: 2.5rem;
  }
`;

export const Title = styled.h1`
  margin: 0 0 0.7rem;
  font-size: 1.85rem;
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.15;
  color: #ffffff;
`;

export const Subtitle = styled.p`
  margin: 0;
  color: #9a9aa0;
  font-size: 0.92rem;
  font-weight: 400;
  line-height: 1.45;
`;

export const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.75rem;
`;

export const Field = styled.label`
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
  border: 1px solid #3a3a3e;
  border-radius: 0.7rem;
  background: #1e1e22;
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
  border: 0;
  border-radius: 0.7rem;
  background: #2f6fed;
  color: #fff;
  font: inherit;
  font-size: 1.02rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #3b7cff;
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }

  &:active:not(:disabled) {
    transform: scale(0.99);
  }
`;

export const GhostLink = styled.button`
  width: 100%;
  margin-top: 0.15rem;
  padding: 0.2rem;
  border: 0;
  background: transparent;
  color: #8d8d93;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color:rgb(172, 172, 177);
  }
`;

export const CodeBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  margin-top: 1.5rem;
  padding: 0.75rem 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.7rem;
  background: #1e1e22;
  text-align: left;

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    flex-shrink: 0;
    height: 1.9rem;
    padding: 0 0.65rem;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 0.45rem;
    background: transparent;
    color: #f5f5f7;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
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
  margin: 0.9rem 0 0;
  max-width: 22rem;
  color: #c7c7cc;
  font-size: 0.8rem;
  line-height: 1.5;
`;

export const ErrorText = styled.p`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0;
  height: 1.25rem;
  min-height: 1.25rem;
  overflow: hidden;
  color: #e54d4d;
  font-size: 0.88rem;
  line-height: 1.25rem;
  flex-shrink: 0;
`;
