import type { World } from "./types";
/** Legacy constants remain for integrations; games no longer gate the story. */
export const GAMES_TO_RECOVER = 0;
export const FILES_TO_RECOVER = 2;
export function caseProgress(w: Pick<World, "collected" | "played">) {
  const files = new Set(
    w.collected.filter((id) => id === "carrier" || id === "birthday"),
  ).size;
  return { files, games: 0, unlocked: true };
}
export function readyToReport(w: World) {
  return (
    ["carrier", "birthday", "manifest"].every((id) =>
      w.collected.includes(id),
    ) && Boolean(w.agents.find((a) => a.id === "nora")?.knownFacts.length)
  );
}
export const GAME_NAMES: Record<string, string> = {
  snake: "Grave Snake",
  flappy: "Flappy Bat",
  tetris: "Crypt Blocks",
  "2048": "2048: Séance",
  phantomicus: "Phantomicus",
  hocus: "Hocus :focus",
};
