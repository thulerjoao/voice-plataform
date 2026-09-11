import type { ClientVersionInfo } from "./version";

export const ROOM_NAME_MIN = 3;
export const ROOM_NAME_MAX = 24;

export type RoomRole = "owner" | "admin" | "member";

export type CreatedRoom = {
  id: string;
  name: string;
  code: string;
  role: RoomRole;
};

export type RoomMember = {
  uid: string;
  nickname: string;
  role: RoomRole;
};

export type RoomChannel = {
  id: string;
  name: string;
  description: string;
};

export type RoomBlocked = {
  uid: string;
  nickname: string;
};

export type RoomDetails = CreatedRoom & {
  createdAt: string;
  members: RoomMember[];
  channels: RoomChannel[];
  blocked?: RoomBlocked[];
};

export const SALA_NAME_MAX = 24;
export const SALA_DESC_MAX = 80;

export async function createRoom(input: {
  name: string;
  uid: string;
  nickname: string;
}): Promise<CreatedRoom> {
  const response = await fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readCreatedRoom(response, "Não foi possível criar o servidor.");
}

export async function joinRoom(input: {
  code: string;
  uid: string;
  nickname: string;
}): Promise<CreatedRoom> {
  const response = await fetch("/api/rooms/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readCreatedRoom(response, "Não foi possível entrar no servidor.");
}

export async function getRoom(input: {
  roomId: string;
  uid: string;
}): Promise<RoomDetails> {
  const params = new URLSearchParams({ uid: input.uid });
  const response = await fetch(`/api/rooms/${input.roomId}?${params}`);
  return readRoomDetails(response, "Não foi possível carregar o servidor.");
}

export async function renameRoom(input: {
  roomId: string;
  uid: string;
  name: string;
}): Promise<RoomDetails> {
  const response = await fetch(`/api/rooms/${input.roomId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid: input.uid, name: input.name }),
  });
  return readRoomDetails(response, "Não foi possível alterar o nome.");
}

export async function leaveRoom(input: {
  roomId: string;
  uid: string;
}): Promise<void> {
  const response = await fetch(`/api/rooms/${input.roomId}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid: input.uid }),
  });
  if (response.ok) return;
  const payload = await readPayload(response);
  throw new Error(errorMessage(payload, "Não foi possível sair do servidor."));
}

export async function createChannel(input: {
  roomId: string;
  uid: string;
  name: string;
  description?: string;
}): Promise<RoomChannel> {
  const response = await fetch(`/api/rooms/${input.roomId}/channels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: input.uid,
      name: input.name,
      description: input.description ?? "",
    }),
  });
  return readChannel(response, "Não foi possível criar a sala.");
}

export async function updateChannel(input: {
  roomId: string;
  channelId: string;
  uid: string;
  name: string;
  description: string;
}): Promise<RoomChannel> {
  const response = await fetch(
    `/api/rooms/${input.roomId}/channels/${input.channelId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: input.uid,
        name: input.name,
        description: input.description,
      }),
    },
  );
  return readChannel(response, "Não foi possível alterar a sala.");
}

export async function deleteChannel(input: {
  roomId: string;
  channelId: string;
  uid: string;
}): Promise<void> {
  const params = new URLSearchParams({ uid: input.uid });
  const response = await fetch(
    `/api/rooms/${input.roomId}/channels/${input.channelId}?${params}`,
    { method: "DELETE" },
  );
  if (response.ok) return;
  const payload = await readPayload(response);
  throw new Error(errorMessage(payload, "Não foi possível apagar a sala."));
}

export async function setMemberRole(input: {
  roomId: string;
  uid: string;
  memberUid: string;
  role: Exclude<RoomRole, "owner">;
}): Promise<RoomDetails> {
  const response = await fetch(
    `/api/rooms/${input.roomId}/members/${input.memberUid}/role`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: input.uid, role: input.role }),
    },
  );
  return readRoomDetails(response, "Não foi possível alterar o cargo.");
}

export async function kickMember(input: {
  roomId: string;
  uid: string;
  memberUid: string;
}): Promise<RoomDetails> {
  const response = await fetch(
    `/api/rooms/${input.roomId}/members/${input.memberUid}/kick`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: input.uid }),
    },
  );
  return readRoomDetails(response, "Não foi possível excluir do servidor.");
}

export async function blockMember(input: {
  roomId: string;
  uid: string;
  targetUid: string;
}): Promise<RoomDetails> {
  const response = await fetch(`/api/rooms/${input.roomId}/blocked`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid: input.uid, targetUid: input.targetUid }),
  });
  return readRoomDetails(response, "Não foi possível bloquear.");
}

export async function unblockMember(input: {
  roomId: string;
  uid: string;
  memberUid: string;
}): Promise<RoomDetails> {
  const params = new URLSearchParams({ uid: input.uid });
  const response = await fetch(
    `/api/rooms/${input.roomId}/blocked/${input.memberUid}?${params}`,
    { method: "DELETE" },
  );
  return readRoomDetails(response, "Não foi possível desbloquear.");
}

export type RegisteredIdentity = {
  uid: string;
  nickname: string;
  recoveryCode: string;
};

export type RestoredRoom = {
  id: string;
  name: string;
  code: string;
  role: RoomRole;
};

export type RestoredIdentity = {
  uid: string;
  nickname: string;
  rooms: RestoredRoom[];
};

export async function fetchClientVersion(): Promise<ClientVersionInfo> {
  const response = await fetch("/api/version");
  const payload = await readPayload(response);
  if (!response.ok || !isClientVersion(payload)) {
    throw new Error(errorMessage(payload, "Não foi possível ler a versão."));
  }
  return payload;
}

export async function registerIdentity(input: {
  nickname: string;
  uid?: string;
  recoveryCode?: string;
}): Promise<RegisteredIdentity> {
  const response = await fetch("/api/identity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await readPayload(response);
  if (!response.ok || !isRegisteredIdentity(payload)) {
    throw new Error(errorMessage(payload, "Não foi possível criar a identidade."));
  }
  return payload;
}

export async function renameIdentity(input: {
  uid: string;
  nickname: string;
}): Promise<{ uid: string; nickname: string }> {
  const response = await fetch("/api/identity", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await readPayload(response);
  if (
    !response.ok ||
    !payload ||
    typeof payload !== "object" ||
    typeof (payload as { uid?: unknown }).uid !== "string" ||
    typeof (payload as { nickname?: unknown }).nickname !== "string"
  ) {
    throw new Error(errorMessage(payload, "Não foi possível alterar o nickname."));
  }
  return payload as { uid: string; nickname: string };
}

export async function restoreIdentity(code: string): Promise<RestoredIdentity> {
  const response = await fetch("/api/identity/restore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const payload = await readPayload(response);
  if (!response.ok || !isRestoredIdentity(payload)) {
    throw new Error(errorMessage(payload, "Não foi possível recuperar a conta."));
  }
  return payload;
}

export type UploadedAvatar = {
  uid: string;
  hash: string;
  mime: string;
  size: number;
};

export async function uploadOwnAvatar(input: {
  uid: string;
  bytes: ArrayBuffer;
  mime: string;
}): Promise<UploadedAvatar> {
  const params = new URLSearchParams({ uid: input.uid });
  const response = await fetch(`/api/avatars?${params}`, {
    method: "PUT",
    headers: { "Content-Type": input.mime || "application/octet-stream" },
    body: input.bytes,
  });
  const payload = await readPayload(response);
  if (!response.ok || !isUploadedAvatar(payload)) {
    throw new Error(errorMessage(payload, "Não foi possível enviar a foto."));
  }
  return payload;
}

export async function deleteOwnAvatar(uid: string): Promise<void> {
  const params = new URLSearchParams({ uid });
  const response = await fetch(`/api/avatars?${params}`, {
    method: "DELETE",
  });
  if (response.status === 204 || response.ok) return;
  const payload = await readPayload(response);
  throw new Error(errorMessage(payload, "Não foi possível remover a foto."));
}

async function readCreatedRoom(
  response: Response,
  fallback: string,
): Promise<CreatedRoom> {
  const payload = await readPayload(response);
  if (!response.ok || !isCreatedRoom(payload)) {
    throw new Error(errorMessage(payload, fallback));
  }
  return payload;
}

async function readRoomDetails(
  response: Response,
  fallback: string,
): Promise<RoomDetails> {
  const payload = await readPayload(response);
  if (!response.ok || !isRoomDetails(payload)) {
    throw new Error(errorMessage(payload, fallback));
  }
  return payload;
}

async function readChannel(
  response: Response,
  fallback: string,
): Promise<RoomChannel> {
  const payload = await readPayload(response);
  if (!response.ok || !isRoomChannel(payload)) {
    throw new Error(errorMessage(payload, fallback));
  }
  return payload;
}

async function readPayload(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function errorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string" &&
    payload.error
  ) {
    return payload.error;
  }
  return fallback;
}

function isClientVersion(value: unknown): value is ClientVersionInfo {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ClientVersionInfo>;
  return typeof item.min === "string" && typeof item.current === "string";
}

function isRole(value: unknown): value is RoomRole {
  return value === "owner" || value === "admin" || value === "member";
}

function isCreatedRoom(value: unknown): value is CreatedRoom {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CreatedRoom>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.code === "string" &&
    isRole(item.role)
  );
}

function isRoomMember(value: unknown): value is RoomMember {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<RoomMember>;
  return (
    typeof item.uid === "string" &&
    typeof item.nickname === "string" &&
    isRole(item.role)
  );
}

function isRoomBlocked(value: unknown): value is RoomBlocked {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<RoomBlocked>;
  return typeof item.uid === "string" && typeof item.nickname === "string";
}

function isRoomChannel(value: unknown): value is RoomChannel {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<RoomChannel>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.description === "string"
  );
}

function isRoomDetails(value: unknown): value is RoomDetails {
  if (
    !isCreatedRoom(value) ||
    typeof (value as RoomDetails).createdAt !== "string"
  ) {
    return false;
  }
  const details = value as RoomDetails;
  if (!Array.isArray(details.members) || !details.members.every(isRoomMember)) {
    return false;
  }
  if (!Array.isArray(details.channels) || !details.channels.every(isRoomChannel)) {
    return false;
  }
  if (details.blocked === undefined) return true;
  return Array.isArray(details.blocked) && details.blocked.every(isRoomBlocked);
}

function isRegisteredIdentity(value: unknown): value is RegisteredIdentity {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<RegisteredIdentity>;
  return (
    typeof item.uid === "string" &&
    typeof item.nickname === "string" &&
    typeof item.recoveryCode === "string" &&
    Boolean(item.uid && item.nickname && item.recoveryCode)
  );
}

function isRestoredRoom(value: unknown): value is RestoredRoom {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<RestoredRoom>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.code === "string" &&
    isRole(item.role)
  );
}

function isRestoredIdentity(value: unknown): value is RestoredIdentity {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<RestoredIdentity>;
  return (
    typeof item.uid === "string" &&
    typeof item.nickname === "string" &&
    Boolean(item.uid && item.nickname) &&
    Array.isArray(item.rooms) &&
    item.rooms.every(isRestoredRoom)
  );
}

function isUploadedAvatar(value: unknown): value is UploadedAvatar {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<UploadedAvatar>;
  return (
    typeof item.uid === "string" &&
    typeof item.hash === "string" &&
    typeof item.mime === "string" &&
    typeof item.size === "number" &&
    Boolean(item.uid && item.hash && item.mime)
  );
}
