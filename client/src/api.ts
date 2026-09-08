export const ROOM_NAME_MIN = 3;
export const ROOM_NAME_MAX = 24;

export type CreatedRoom = {
  id: string;
  name: string;
  code: string;
  role: "owner" | "admin" | "member";
};

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

  const payload = (await response.json().catch(() => null)) as
    CreatedRoom | { error?: string } | null;

  if (!response.ok || !payload || !("id" in payload)) {
    throw new Error(
      payload && "error" in payload && payload.error
        ? payload.error
        : "Não foi possível criar o servidor.",
    );
  }

  return payload;
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

  const payload = (await response.json().catch(() => null)) as
    CreatedRoom | { error?: string } | null;

  if (!response.ok || !payload || !("id" in payload)) {
    throw new Error(
      payload && "error" in payload && payload.error
        ? payload.error
        : "Não foi possível entrar no servidor.",
    );
  }

  return payload;
}
