import styled from "styled-components";

export const Frame = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100dvh;
  overflow: hidden;
  background: var(--bg-app);
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
`;
