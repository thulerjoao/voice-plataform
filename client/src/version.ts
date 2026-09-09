export const CLIENT_VERSION = "0.0.1";

export type ClientVersionInfo = {
  min: string;
  current: string;
};

export function versionBelow(left: string, right: string): boolean {
  return compareVersion(left, right) < 0;
}

export function compareVersion(left: string, right: string): number {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (let i = 0; i < 3; i += 1) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}

function parseVersion(value: string): [number, number, number] {
  const parts = value.trim().split(".");
  const out: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < 3 && i < parts.length; i += 1) {
    const n = Number(parts[i]);
    if (!Number.isInteger(n) || n < 0) return [0, 0, 0];
    out[i] = n;
  }
  return out;
}
