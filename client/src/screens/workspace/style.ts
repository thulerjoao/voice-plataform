import styled from "styled-components";

export const Frame = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100dvh;
  overflow: hidden;
  background: transparent;
  color: var(--text-primary);
`;

export const Body = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  min-width: 0;
`;

export const Main = styled.main`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  gap: 0;
  overflow: hidden;
  background: transparent;
`;

export const Stage = styled.section`
  flex: 1;
  min-height: 0;
  min-width: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
`;
