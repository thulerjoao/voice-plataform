const STORAGE_KEY = "voice.status";

export const STATUSES = [
  { id: "online", label: "Online", color: "#30d158" },
  { id: "busy", label: "Ocupado", color: "#ff453a" },
  { id: "brb", label: "Volto logo", color: "#ffd60a" },
] as const;

export type StatusId = (typeof STATUSES)[number]["id"];

export function isStatusId(value: unknown): value is StatusId {
  return value === "online" || value === "busy" || value === "brb";
}

export function parseStatusId(value: unknown): StatusId {
  return isStatusId(value) ? value : "online";
}

export function loadStatus(): StatusId {
  return parseStatusId(localStorage.getItem(STORAGE_KEY));
}

export function saveStatus(status: StatusId): void {
  localStorage.setItem(STORAGE_KEY, status);
}

export function statusMeta(id: StatusId) {
  return STATUSES.find((item) => item.id === id) ?? STATUSES[0];
}
