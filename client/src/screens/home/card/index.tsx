import type { Bookmark } from "../../../bookmarks";
import { normalizeRoomCode } from "../../../bookmarks";
import { Card, Chevron, Code, Copy, Mark, Name, Occupancy } from "./style";

type ServerCardProps = {
  room: Bookmark;
  seated: number;
  onOpen: (roomId: string) => void;
};

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3.8 19.2c.7-3.1 3.1-4.8 5.2-4.8s4.5 1.7 5.2 4.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="16.4" cy="9.2" r="2.4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M15.6 14.6c1.8.2 3.5 1.5 4.6 4.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M2.2 11.2 3.4 5.6l2.6 2.4L8 4.2l2 3.8 2.6-2.4 1.2 5.6H2.2zM2 12.4h12v1.2H2z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.4 19.2 6v5.4c0 4.3-2.9 7.4-7.2 9.2-4.3-1.8-7.2-4.9-7.2-9.2V6L12 3.4z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OccupancyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5.2 19.2c.8-3.3 3.4-5 6.8-5s6 1.7 6.8 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6 3.2 10.8 8 6 12.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ServerCard({ room, seated, onOpen }: ServerCardProps) {
  const mark =
    room.role === "owner"
      ? "owner"
      : room.role === "admin"
        ? "admin"
        : undefined;

  return (
    <Card type="button" onClick={() => onOpen(room.roomId)}>
      <Mark $tone={mark}>
        {room.role === "owner" ? (
          <CrownIcon />
        ) : room.role === "admin" ? (
          <ShieldIcon />
        ) : (
          <PeopleIcon />
        )}
      </Mark>
      <Copy>
        <Name>{room.name}</Name>
        <Code>{normalizeRoomCode(room.code) || room.code}</Code>
      </Copy>
      <Occupancy>
        <OccupancyIcon />
        {seated}
      </Occupancy>
      <Chevron>
        <ChevronIcon />
      </Chevron>
    </Card>
  );
}
