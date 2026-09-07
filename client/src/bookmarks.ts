const STORAGE_KEY = "voice.bookmarks";

export type Bookmark = {
  roomId: string;
  name: string;
  code: string;
  role: "owner" | "admin" | "member";
};

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
