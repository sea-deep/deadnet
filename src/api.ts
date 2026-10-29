import type { Action, Snapshot } from "./types";
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
