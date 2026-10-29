import type { World } from "./types";
/** Games whose saves share CASE_14.BAK's damaged sectors. */
export const GAMES_TO_RECOVER = 2;
export const FILES_TO_RECOVER = 2;
export function caseProgress(w: Pick<World, "collected" | "played">) {
  const files = w.collected.filter((id) => id !== "manifest").length;
  const games = (w.played || []).length;
  return {
    files: Math.min(files, FILES_TO_RECOVER),
    games: Math.min(games, GAMES_TO_RECOVER),
    unlocked: files >= FILES_TO_RECOVER && games >= GAMES_TO_RECOVER,
  };
}
export const GAME_NAMES: Record<string, string> = {
  snake: "Grave Snake",
  flappy: "Flappy Bat",
  tetris: "Crypt Blocks",
  "2048": "2048: Séance",
  phantomicus: "Phantomicus",
};
