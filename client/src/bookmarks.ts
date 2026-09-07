const STORAGE_KEY = "voice.bookmarks";

export type Bookmark = {
  roomId: string;
  name: string;
  code: string;
  role: "owner" | "admin" | "member";
};

export function normalizeRoomCode(raw: string): string {
  const chars = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (chars.length <= 3) return chars;
  return `${chars.slice(0, 3)}-${chars.slice(3)}`;
}

export function findBookmarkByCode(code: string): Bookmark | null {
  const normalized = normalizeRoomCode(code);
  return loadBookmarks().find((item) => normalizeRoomCode(item.code) === normalized) ?? null;
}

export function removeBookmark(roomId: string): Bookmark[] {
  const next = loadBookmarks().filter((item) => item.roomId !== roomId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function saveBookmark(bookmark: Bookmark): Bookmark[] {
  const next = [bookmark, ...loadBookmarks().filter((item) => item.roomId !== bookmark.roomId)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function loadBookmarks(): Bookmark[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isBookmark);
  } catch {
    return [];
  }
}

function isBookmark(value: unknown): value is Bookmark {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Bookmark>;
  return (
    typeof item.roomId === "string" &&
    typeof item.name === "string" &&
    typeof item.code === "string" &&
    (item.role === "owner" || item.role === "admin" || item.role === "member")
  );
}
