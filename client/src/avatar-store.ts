const DB_NAME = "voice.avatars";
const DB_VERSION = 1;
const OWN_KEY = "self";
const AVATAR_SIZE = 256;
const EVENT_NAME = "voice-avatar-cache";

export type StoredAvatar = {
  hash: string;
  mime: string;
  bytes: ArrayBuffer;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("avatar db"));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("own")) {
        db.createObjectStore("own");
      }
      if (!db.objectStoreNames.contains("peers")) {
        db.createObjectStore("peers");
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

function storeGet<T>(store: string, key: string): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const req = tx.objectStore(store).get(key);
        req.onerror = () => reject(req.error ?? new Error("avatar get"));
        req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
      }),
  );
}

function storePut(store: string, key: string, value: unknown): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        const req = tx.objectStore(store).put(value, key);
        req.onerror = () => reject(req.error ?? new Error("avatar put"));
        tx.oncomplete = () => resolve();
      }),
  );
}

function storeDelete(store: string, key: string): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        const req = tx.objectStore(store).delete(key);
        req.onerror = () => reject(req.error ?? new Error("avatar delete"));
        tx.oncomplete = () => resolve();
      }),
  );
}

function peerKey(uid: string, hash: string) {
  return `${uid}:${hash}`;
}

export async function hashBytes(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function resizeImageFile(file: File): Promise<StoredAvatar> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  const scale = Math.max(AVATAR_SIZE / bitmap.width, AVATAR_SIZE / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (AVATAR_SIZE - w) / 2, (AVATAR_SIZE - h) / 2, w, h);
  bitmap.close();

  const mime = "image/webp";
  const blob =
    (await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mime, 0.82),
    )) ??
    (await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    ));
  if (!blob) throw new Error("encode");
  const bytes = await blob.arrayBuffer();
  const hash = await hashBytes(bytes);
  return { hash, mime: blob.type || mime, bytes };
}

export async function saveOwnAvatar(file: File): Promise<StoredAvatar> {
  const avatar = await resizeImageFile(file);
  await storePut("own", OWN_KEY, avatar);
  notifyCache();
  return avatar;
}

export async function clearOwnAvatar(): Promise<void> {
  await storeDelete("own", OWN_KEY);
  notifyCache();
}

export async function loadOwnAvatar(): Promise<StoredAvatar | null> {
  return storeGet<StoredAvatar>("own", OWN_KEY);
}

export async function loadOwnAvatarHash(): Promise<string | null> {
  const own = await loadOwnAvatar();
  return own?.hash ?? null;
}

export async function putPeerAvatar(
  uid: string,
  avatar: StoredAvatar,
): Promise<void> {
  await storePut("peers", peerKey(uid, avatar.hash), avatar);
  notifyCache();
}

export async function loadPeerAvatar(
  uid: string,
  hash: string,
): Promise<StoredAvatar | null> {
  return storeGet<StoredAvatar>("peers", peerKey(uid, hash));
}

export async function clearAvatarCache(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["own", "peers"], "readwrite");
    tx.objectStore("own").clear();
    tx.objectStore("peers").clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("avatar clear"));
  });
  notifyCache();
}

export function avatarToObjectUrl(avatar: StoredAvatar): string {
  return URL.createObjectURL(
    new Blob([new Uint8Array(avatar.bytes)], { type: avatar.mime }),
  );
}

export function subscribeAvatarCache(listener: () => void): () => void {
  const onEvent = () => listener();
  window.addEventListener(EVENT_NAME, onEvent);
  return () => window.removeEventListener(EVENT_NAME, onEvent);
}

function notifyCache() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}
