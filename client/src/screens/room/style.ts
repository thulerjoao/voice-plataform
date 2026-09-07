import styled from "styled-components";

export const RoomShell = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const RoomHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

export const RoomTitle = styled.h1`
  margin: 0 0 0.25rem;
  font-size: clamp(1.5rem, 2.6vw, 1.95rem);
  font-weight: 700;
  letter-spacing: -0.04em;
`;

export const RoomRole = styled.span`
  color: #a1a1a6;
  font-size: 0.88rem;
`;

export const Invite = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-shrink: 0;
`;

export const InviteCode = styled.span`
  padding: 0.4rem 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.6rem;
  background: #3a3a3c;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.05em;
`;

export const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  height: 2.25rem;
  padding: 0 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0.6rem;
  background: transparent;
  color: #f5f5f7;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;

  svg {
    width: 0.9rem;
    height: 0.9rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  &:active {
    transform: scale(0.99);
  }
`;

export const Copied = styled.span`
  color: #30d158;
  font-size: 0.82rem;
  font-weight: 600;
  min-width: 4.5rem;
`;

export const RoomBody = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 1.25rem;

  @media (max-width: 800px) {
    flex-direction: column;
  }
`;

export const Tree = styled.aside`
  width: 16.5rem;
  flex-shrink: 0;
  padding: 0.85rem 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.9rem;
  background: #2c2c2e;
  overflow: auto;

  @media (max-width: 800px) {
    width: 100%;
  }
`;

export const Channel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.45rem;
  color: #f5f5f7;
  font-size: 0.92rem;
  font-weight: 600;
`;

export const ChannelIcon = styled.span`
  display: grid;
  place-items: center;
  color: #a1a1a6;

  svg {
    width: 0.85rem;
    height: 0.85rem;
  }
`;

export const Members = styled.ul`
  list-style: none;
  margin: 0.15rem 0 0;
  padding: 0 0 0 1.35rem;
`;

export const Member = styled.li`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  padding: 0.4rem 0.45rem;
  color: #f5f5f7;
  font-size: 0.9rem;
  font-weight: 600;
`;

export const MemberDot = styled.span`
  width: 0.45rem;
  height: 0.45rem;
  flex-shrink: 0;
  border-radius: 999px;
  background: #30d158;
`;

export const MemberName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const YouBadge = styled.span`
  color: #8d8d93;
  font-size: 0.72rem;
  font-weight: 600;
`;

export const OwnerBadge = styled.span`
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: rgba(47, 111, 237, 0.2);
  color: #7eb0ff;
  font-size: 0.68rem;
  font-weight: 600;
`;

export const Stage = styled.section`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 1.5rem 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.9rem;
  background: #252528;
`;

export const StageChannel = styled.h2`
  margin: 0 0 0.4rem;
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: -0.03em;
`;

export const StageMeta = styled.p`
  margin: 0 0 0.85rem;
  color: #a1a1a6;
  font-size: 0.92rem;
`;

export const StageHint = styled.p`
  margin: 0;
  color: #8d8d93;
  font-size: 0.9rem;
  line-height: 1.45;
  max-width: 22rem;
`;
