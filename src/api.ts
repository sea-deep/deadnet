import type { Action, Snapshot } from "./types";
export const exhibition = import.meta.env.MODE === "exhibition";
let exhibitionApi: Promise<typeof import("./exhibition")> | undefined;
export async function readState(): Promise<Snapshot> {
  if (exhibition) {
    exhibitionApi ??= import("./exhibition");
    return (await exhibitionApi).read();
  }
  const r = await fetch("/api/state");
  if (!r.ok)
    throw new Error("The local service is disconnected. Restart npm run dev.");
  return r.json();
}
export async function act(action: Action): Promise<Snapshot> {
  if (exhibition) {
    exhibitionApi ??= import("./exhibition");
    return (await exhibitionApi).act(action);
  }
  const r = await fetch("/api/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Action failed.");
  return data;
}
