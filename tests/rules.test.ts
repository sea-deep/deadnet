import { test } from "node:test";
import assert from "node:assert/strict";
import {
  caseProgress,
  FILES_TO_RECOVER,
  GAME_NAMES,
  GAMES_TO_RECOVER,
} from "../src/rules.ts";
import { GAME_LIST } from "../src/games.tsx";
import { ARCHIVE, STORY_ID, seedWorld } from "../server/seed.ts";
import { Store } from "../server/store.ts";
import { Engine } from "../server/engine.ts";
import { BaselineModel } from "../server/baseline.ts";

test("personal items never require game saves or other items to open", () => {
  assert.deepEqual(caseProgress({ collected: [], played: [] }), {
    files: 0,
    games: 0,
    unlocked: true,
  });
  assert.equal(
    caseProgress({ collected: ["carrier", "birthday"], played: [] }).unlocked,
    true,
  );
});

test("progress counters cap instead of growing past the case requirement", () => {
  const progress = caseProgress({
    collected: ["carrier", "birthday", "manifest", "extra"],
    played: ["snake", "flappy", "tetris", "2048", "phantomicus", "hocus"],
  });
  assert.equal(progress.files, FILES_TO_RECOVER);
  assert.equal(progress.games, GAMES_TO_RECOVER);
});

test("every desktop game is playable, named, and unique", () => {
  const ids = GAME_LIST.map((g) => g.id);
  assert.equal(new Set(ids).size, ids.length);
  assert(
    !ids.includes("hocus" as never),
    "removed game never appears in the playable library",
  );
  for (const id of ids) {
    assert.ok(GAME_NAMES[id], `missing display name for ${id}`);
  }
  assert(GAMES_TO_RECOVER <= GAME_LIST.length);
});

test("the recovered case archive is internally consistent", () => {
  assert.equal(STORY_ID, "westhaven-personal-v5");
  const ids = ARCHIVE.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids, ["carrier", "birthday", "manifest"]);
  for (const record of ARCHIVE) {
    assert(
      !/\.(TXT|LOG|BAK)$/.test(record.filename),
      "a personal item has a native app, not a technical-file wrapper",
    );
    assert(
      record.fact.length > 40,
      `${record.id} needs a usable fact for the model`,
    );
    assert(record.body.length > 100);
  }
  const world = seedWorld("baseline");
  assert.equal(world.storyId, STORY_ID);
  assert.equal(world.agents.length, 4);
  assert(world.events.some((e) => e.channel === "mail" && e.to === "visitor"));
});

test("optional play never blocks the photograph", async () => {
  const store = new Store(":memory:");
  const engine = new Engine(store, new BaselineModel());
  await engine.dispatch({ type: "collect", evidenceId: "carrier" });
  await engine.dispatch({ type: "collect", evidenceId: "birthday" });
  await engine.dispatch({ type: "played", game: "snake" });
  await engine.dispatch({ type: "played", game: "snake" });
  await engine.dispatch({ type: "collect", evidenceId: "manifest" });
  const world = engine.world();
  assert(world.played?.includes("snake"));
  assert(world.collected.includes("manifest"));
  assert(
    world.events.some(
      (e) => e.channel === "system" && e.text.includes("Grave Snake"),
    ),
  );
  store.close();
});
