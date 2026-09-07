import styled from "styled-components";

export const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  background: #1c1c1e;
  color: #f5f5f7;

  @media (max-width: 800px) {
    flex-direction: column;
  }
`;

export const Sidebar = styled.aside`
  width: 15.5rem;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1.25rem 0.85rem;
  background: #2c2c2e;
  border-right: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 800px) {
    width: 100%;
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 1rem;
  }
`;

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.65rem 0.85rem;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.03em;
`;

export const BrandIcon = styled.span`
  display: grid;
  place-items: center;
  color: #0a84ff;

  svg {
    width: 1.35rem;
    height: 1.35rem;
  }
`;

export const NickButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  margin: 0 0 0.55rem;
  padding: 0.55rem 0.65rem;
  border: 0;
  border-radius: 0.7rem;
  background: transparent;
  color: #f5f5f7;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  svg {
    flex-shrink: 0;
    width: 1rem;
    height: 1rem;
    color: #a1a1a6;
  }
`;

export const NickName = styled.span`
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.95rem;
  font-weight: 600;
`;

export const NavItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.75rem;
  border-radius: 0.75rem;
  background: #0a84ff;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;

  svg {
    width: 1.1rem;
    height: 1.1rem;
  }
`;

export const Main = styled.main`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 2rem 2.25rem 1.5rem;

  @media (max-width: 800px) {
    padding: 1.25rem 1rem 1.5rem;
  }
`;

export const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 800px) {
    flex-direction: column;
  }
`;

export const HeaderCopy = styled.div`
  min-width: 0;
`;

export const Title = styled.h1`
  margin: 0 0 0.4rem;
  font-size: clamp(1.75rem, 3vw, 2.15rem);
  font-weight: 700;
  letter-spacing: -0.04em;
`;

export const Subtitle = styled.p`
  margin: 0;
  max-width: 28rem;
  color: #a1a1a6;
  font-size: 0.95rem;
  line-height: 1.45;
`;

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  flex-shrink: 0;

  & > button {
    min-width: 13.5rem;
  }
`;

export const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  height: 3rem;
  padding: 0 1.85rem;
  border: 0;
  border-radius: 0.75rem;
  background: #2f6fed;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;

  svg {
    width: 1rem;
    height: 1rem;
  }

  &:hover {
    background: #3b7cff;
  }

  &:active {
    transform: scale(0.99);
  }
`;

export const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  height: 3rem;
  padding: 0 1.85rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0.75rem;
  background: transparent;
  color: #f5f5f7;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;

  svg {
    width: 1rem;
    height: 1rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
  &:active {
    transform: scale(0.99);
  }
`;

export const RoomList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

export const RoomCard = styled.button`
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.9rem;
  background: #3a3a3c;
  color: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #444446;
  }
`;

export const RoomIcon = styled.span`
  display: grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.7rem;
  background: #2c2c2e;
  color: #0a84ff;
  flex-shrink: 0;

  svg {
    width: 1.2rem;
    height: 1.2rem;
  }
`;

export const RoomMeta = styled.span`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

export const RoomName = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
`;

export const RoomCode = styled.span`
  color: #a1a1a6;
  font-size: 0.82rem;
  letter-spacing: 0.04em;
`;

export const AdminBadge = styled.span`
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  background: rgba(10, 132, 255, 0.18);
  color: #64b5ff;
  font-size: 0.7rem;
  font-weight: 600;
`;

export const Chevron = styled.span`
  color: #8e8e93;
  flex-shrink: 0;
`;

export const Empty = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem 1rem 3rem;
`;

export const EmptyArt = styled.div`
  margin-bottom: 1.4rem;

  svg {
    display: block;
    width: 10.5rem;
    height: auto;
  }
`;

export const EmptyTitle = styled.h2`
  margin: 0 0 0.5rem;
  font-size: 1.4rem;
  font-weight: 600;
  color: #ffffff;
`;

export const EmptyText = styled.p`
  margin: 0 0 1.5rem;
  max-width: 18.5rem;
  color: #8a8a8a;
  font-size: 0.9rem;
  line-height: 1.45;
`;

export const NickEdit = styled.form`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  width: 100%;
  margin: 0 0 0.55rem;
  padding: 0.25rem 0.3rem;
  border-radius: 0.7rem;
  background: #1c1c1e;
`;

export const NickInput = styled.input`
  min-width: 0;
  flex: 1;
  height: 1.85rem;
  padding: 0 0.45rem;
  border: 0;
  background: transparent;
  color: #f5f5f7;
  font-size: 0.95rem;
  font-weight: 600;
  outline: none;
`;

export const NickIconButton = styled.button`
  display: grid;
  place-items: center;
  width: 1.7rem;
  height: 1.7rem;
  flex-shrink: 0;
  border: 0;
  border-radius: 0.4rem;
  background: transparent;
  color: #a1a1a6;
  cursor: pointer;

  svg {
    width: 0.95rem;
    height: 0.95rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #f5f5f7;
  }
`;
