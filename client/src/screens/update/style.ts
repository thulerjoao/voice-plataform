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

export const Card = styled.div`
  width: 22.5rem;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1.6rem 1.6rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  background: #1c1c1f;
  text-align: center;
`;

export const Brand = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  margin-bottom: 1.6rem;
  color: #ffffff;
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1;
`;

export const BrandIcon = styled.span`
  display: grid;
  place-items: center;
  color: #3b82f6;

  svg {
    display: block;
    width: 1.35rem;
    height: 1.35rem;
  }
`;

export const Title = styled.h1`
  margin: 0 0 1.25rem;
  font-size: 1.35rem;
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1.25;
  color: #f5f5f7;
`;

export const Versions = styled.dl`
  width: 100%;
  margin: 0 0 1.45rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

export const VersionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  height: 2.35rem;
  padding: 0 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.55rem;
  background: #242426;
`;

export const VersionLabel = styled.dt`
  margin: 0;
  color: #8d8d93;
  font-size: 0.78rem;
  font-weight: 600;
`;

export const VersionValue = styled.dd<{ $accent?: boolean }>`
  margin: 0;
  color: ${(p) => (p.$accent ? "#0a84ff" : "#f5f5f7")};
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.02em;
`;

export const UpdateButton = styled.button`
  width: 100%;
  height: 2.7rem;
  border: 0;
  border-radius: 0.55rem;
  background: #2f6fed;
  color: #fff;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 650;
  cursor: pointer;

  &:hover {
    background: #3b7cff;
  }

  &:active {
    transform: scale(0.99);
  }
`;
