import styled from "styled-components";

export const Shell = styled.div`
  display: flex;
  height: 100%;
  max-height: 100dvh;
  overflow: hidden;
  background: #1c1c1e;
  color: #f5f5f7;

  @media (max-width: 800px) {
    flex-direction: column;
  }
`;

export const Sidebar = styled.aside`
  width: 15.5rem;
  flex-shrink: 0;
  min-height: 0;
  overflow: hidden;
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

export const NavItem = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.65rem;
  border: 0;
  border-radius: 0.55rem;
  background: ${(p) =>
    p.$active ? "rgba(10, 132, 255, 0.18)" : "transparent"};
  color: ${(p) => (p.$active ? "#f5f5f7" : "#c7c7cc")};
  font-size: 0.9rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;

  svg {
    width: 1.05rem;
    height: 1.05rem;
    flex-shrink: 0;
    color: ${(p) => (p.$active ? "#0a84ff" : "#8d8d93")};
  }

  &:hover {
    color: #f5f5f7;
    background: ${(p) =>
      p.$active ? "rgba(10, 132, 255, 0.22)" : "rgba(255, 255, 255, 0.06)"};
  }
`;

export const SidebarRule = styled.div`
  height: 1px;
  margin: 0.55rem 0.45rem 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
`;

export const SidebarDock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.75rem;
`;

export const DockRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.35rem;
`;

export const DockVolume = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  height: 2.1rem;
  padding: 0 0.55rem;
  border-radius: 0.65rem;
  background: rgba(255, 255, 255, 0.06);
  color: #a1a1a6;

  svg {
    width: 0.95rem;
    height: 0.95rem;
    flex-shrink: 0;
  }
`;

export const DockSlider = styled.input`
  flex: 1;
  min-width: 0;
  height: 0.35rem;
  margin: 0;
  accent-color: #2f6fed;
  cursor: pointer;
`;

export const DockVolumeValue = styled.span`
  width: 2.3rem;
  flex-shrink: 0;
  color: #f5f5f7;
  font-size: 0.7rem;
  font-weight: 600;
  text-align: right;
`;

export const StatusWrap = styled.div`
  position: relative;
  min-width: 0;
  flex: 1;
  display: flex;
`;

export const StatusButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  min-width: 0;
  height: 2.4rem;
  padding: 0 0.6rem;
  border: 0;
  border-radius: 0.65rem;
  background: rgba(255, 255, 255, 0.06);
  color: #f5f5f7;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:active {
    transform: scale(0.99);
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

export const StatusLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StatusMenu = styled.div`
  position: absolute;
  right: 0;
  bottom: calc(100% + 0.4rem);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  width: max-content;
  min-width: 100%;
  padding: 0.3rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.7rem;
  background: #3a3a3c;
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
  background: ${(p) => (p.$active ? "rgba(255, 255, 255, 0.08)" : "transparent")};
  color: #f5f5f7;
  font-size: 0.82rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

export const DockButton = styled.button<{ $on?: boolean }>`
  display: grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  border: 0;
  border-radius: 0.65rem;
  background: ${(p) => (p.$on ? "rgba(255, 69, 58, 0.18)" : "rgba(255, 255, 255, 0.06)")};
  color: ${(p) => (p.$on ? "#ff453a" : "#f5f5f7")};
  cursor: pointer;

  svg {
    width: 1.15rem;
    height: 1.15rem;
  }

  &:hover {
    background: ${(p) => (p.$on ? "rgba(255, 69, 58, 0.26)" : "rgba(255, 255, 255, 0.1)")};
  }

  &:active {
    transform: scale(0.99);
  }
`;

export const SidebarRooms = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-height: 0;
  overflow: auto;
`;

export const SidebarRoom = styled.li`
  min-width: 0;
`;

export const SidebarRoomButton = styled.button<{
  $active?: boolean;
  $live?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-width: 0;
  padding: 0.5rem 0.65rem;
  border: 0;
  border-radius: 0.55rem;
  background: ${(p) =>
    p.$active ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.045)"};
  color: #f5f5f7;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${(p) =>
      p.$active ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.07)"};
  }
`;

export const SidebarRoomName = styled.span`
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
  font-weight: 600;
`;

export const SidebarCallMark = styled.span`
  display: grid;
  place-items: center;
  width: 1.05rem;
  height: 1.05rem;
  flex-shrink: 0;
  color: #0a84ff;

  svg {
    width: 0.9rem;
    height: 0.9rem;
  }
`;

export const Main = styled.main<{ $flush?: boolean }>`
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: ${(p) => (p.$flush ? "hidden" : "auto")};
  display: flex;
  flex-direction: column;
  padding: ${(p) => (p.$flush ? "0.95rem 1.1rem 0.9rem" : "2rem 2.25rem 1.5rem")};

  @media (max-width: 800px) {
    padding: 1.25rem 1rem 1.5rem;
  }
`;

export const RoomMount = styled.div<{ $hidden?: boolean }>`
  display: ${(p) => (p.$hidden ? "none" : "flex")};
  flex: 1;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
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
  margin-bottom: 1.15rem;

  svg {
    display: block;
    width: 14.5rem;
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
