import { test } from "node:test";
import assert from "node:assert/strict";
import { seedWorld } from "../server/seed.ts";
import { isSavedWorld } from "../src/saved-world.ts";
import type { World } from "../src/types.ts";

function damaged(change: (world: World) => void): unknown {
  const world = structuredClone(seedWorld());
  change(world);
  return world;
}

test("a complete world passes save validation", () => {
  assert.equal(isSavedWorld(seedWorld()), true);
  assert.equal(isSavedWorld(structuredClone(seedWorld())), true);
});

test("non-world values are rejected before they reach the interface", () => {
  for (const value of [null, undefined, 42, "save", [], {}])
    assert.equal(isSavedWorld(value), false);
});

test("damaged accounts, events, and counters are rejected", () => {
  const badAgent = damaged((world) => {
    delete (world.agents[0] as Partial<World["agents"][number]>).name;
  });
  assert.equal(isSavedWorld(badAgent), false);

  const duplicateAgent = damaged((world) => {
    world.agents[1] = structuredClone(world.agents[0]);
  });
  assert.equal(isSavedWorld(duplicateAgent), false);

  const badMemory = damaged((world) => {
    world.agents[0].memories.push({ text: 42 } as never);
  });
  assert.equal(isSavedWorld(badMemory), false);

  const badEvent = damaged((world) => {
    world.events[0].factIds = "carrier" as never;
  });
  assert.equal(isSavedWorld(badEvent), false);

  const badActor = damaged((world) => {
    world.events[0].actor = "intruder" as never;
  });
  assert.equal(isSavedWorld(badActor), false);

  const badTurns = damaged((world) => {
    world.remainingTurns = 19;
  });
  assert.equal(isSavedWorld(badTurns), false);

  const badEnding = damaged((world) => {
    world.ending = "forgotten" as never;
  });
  assert.equal(isSavedWorld(badEnding), false);

  const badGame = damaged((world) => {
    world.played = ["minesweeper"];
  });
  assert.equal(isSavedWorld(badGame), false);
});

test("optional fields stay backward compatible", () => {
  const oldSave = damaged((world) => {
    delete world.played;
    delete world.accused;
  });
  assert.equal(isSavedWorld(oldSave), true);
});
