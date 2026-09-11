import { subscribeAvatarHash } from "./avatar-signal";
import {
  hashBytes,
  loadPeerAvatar,
  putPeerAvatar,
  type StoredAvatar,
} from "./avatar-store";

const inflight = new Map<string, Promise<StoredAvatar | null>>();

/** Download a peer avatar from the API and store it in IndexedDB. */
export async function fetchPeerAvatar(
  viewerUid: string,
  peerUid: string,
  hash: string,
): Promise<StoredAvatar> {
  const params = new URLSearchParams({ uid: viewerUid });
  if (hash) params.set("hash", hash);
  const response = await fetch(
    `/api/avatars/${encodeURIComponent(peerUid)}?${params}`,
  );
  if (!response.ok) {
    throw new Error(await readError(response, "Não foi possível baixar a foto."));
  }
  const mime =
    response.headers.get("Content-Type")?.split(";")[0]?.trim() ||
    "application/octet-stream";
  const bytes = await response.arrayBuffer();
  const computed = await hashBytes(bytes);
  if (hash && computed !== hash) {
    throw new Error("Hash da foto não confere.");
  }
  const avatar: StoredAvatar = { hash: computed, mime, bytes };
  await putPeerAvatar(peerUid, avatar);
  return avatar;
}

/** Cache hit or one in-flight GET; returns null on failure. */
export async function ensurePeerAvatar(
  viewerUid: string,
  peerUid: string,
  hash: string,
): Promise<StoredAvatar | null> {
  const cleanHash = hash.trim();
  if (!viewerUid || !peerUid || !cleanHash || viewerUid === peerUid) {
    return null;
  }

  const cached = await loadPeerAvatar(peerUid, cleanHash);
  if (cached) return cached;

  const key = `${peerUid}:${cleanHash}`;
  const existing = inflight.get(key);
  if (existing) return existing;

  const job = (async () => {
    try {
      return await fetchPeerAvatar(viewerUid, peerUid, cleanHash);
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, job);
  return job;
}

/** On avatar.hash from WS, fetch via API when not cached. */
export function startAvatarFetch(viewerUid: string): () => void {
  return subscribeAvatarHash((event) => {
    if (!event.hash) return;
    void ensurePeerAvatar(viewerUid, event.uid, event.hash);
  });
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const payload: unknown = await response.json();
    if (
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof (payload as { error: unknown }).error === "string" &&
      (payload as { error: string }).error
    ) {
      return (payload as { error: string }).error;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}
