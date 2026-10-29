import type { Action, Snapshot, World } from "./types";
export const exhibition = import.meta.env.MODE === "exhibition";
let exhibitionApi: Promise<typeof import("./exhibition")> | undefined;
export const OFFLINE_MESSAGE =
  location.protocol === "file:"
    ? "DEADNET needs its server. Run npm run dev, then open http://127.0.0.1:3000 instead of the file."
    : "Can’t reach the DEADNET server, so messages and games can’t load. It reconnects automatically when the server is back.";
/** fetch() rejects with a bare "Failed to fetch" when the server is unreachable. */
async function request(url: string, init?: RequestInit) {
  try {
    return await fetch(url, init);
  } catch {
    throw new Error(OFFLINE_MESSAGE);
  }
}
export async function readState(): Promise<Snapshot> {
  if (exhibition) {
    exhibitionApi ??= import("./exhibition");
    return (await exhibitionApi).read();
  }
  const r = await request("/api/state");
  if (!r.ok) throw new Error(OFFLINE_MESSAGE);
  return r.json();
}
export async function act(action: Action): Promise<Snapshot> {
  if (exhibition) {
    exhibitionApi ??= import("./exhibition");
    return (await exhibitionApi).act(action);
  }
  const r = await request("/api/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok)
    throw new Error(data.error || "That didn’t work. Please try again.");
  return data;
}
/** Put a saved world back on the server (or in the exhibition's browser store). */
export async function restore(world: World): Promise<Snapshot> {
  if (exhibition) {
    exhibitionApi ??= import("./exhibition");
    return (await exhibitionApi).restore(world);
  }
  const r = await request("/api/restore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ world }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok)
    throw new Error(data.error || "That save file couldn’t be loaded.");
  return data;
}

const SAVE_KEY = "deadnet-save-v1";
/** Validate the shape we actually depend on before trusting browser storage. */
export function isSavedWorld(value: unknown): value is World {
  if (!value || typeof value !== "object") return false;
  const w = value as Partial<World>;
  return (
    w.version === 1 &&
    typeof w.storyId === "string" &&
    typeof w.tick === "number" &&
    typeof w.revision === "number" &&
    Array.isArray(w.agents) &&
    Array.isArray(w.events) &&
    Array.isArray(w.collected) &&
    Array.isArray(w.published) &&
    Array.isArray(w.traces) &&
    (w.played === undefined || Array.isArray(w.played))
  );
}
/** The browser's copy of the case, written after every change. */
export function readSave(): World | undefined {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    return isSavedWorld(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}
export function writeSave(world: World) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(world));
    return true;
  } catch {
    return false;
  }
}
export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {}
}
/** A world worth restoring: the player has actually done something in it. */
export function hasProgress(w: World) {
  return (
    w.collected.length > 0 ||
    (w.played?.length ?? 0) > 0 ||
    w.events.some((e) => e.actor === "visitor") ||
    w.ending !== "open"
  );
}
