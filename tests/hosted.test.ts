import { test } from "node:test";
import assert from "node:assert/strict";
import { Store, VisitorStore } from "../server/store.ts";
import { Engine } from "../server/engine.ts";
import { BaselineModel } from "../server/baseline.ts";
import { DecisionSchema } from "../server/decision.ts";

test("hosted visitors get private worlds that survive a new engine", async () => {
  const store = new Store(":memory:");
  const a = new Engine(new VisitorStore(store, "a"), new BaselineModel());
  const b = new Engine(new VisitorStore(store, "b"), new BaselineModel());
  await a.dispatch({ type: "mode", mode: "baseline" });
  await a.dispatch({ type: "message", target: "nora", text: "hello?" });
  const said = (e: Engine) =>
    e.world().events.filter((x) => x.actor === "visitor").length;
  assert.equal(said(a), 1);
  assert.equal(said(b), 0);
  const again = new Engine(new VisitorStore(store, "a"), new BaselineModel());
  assert.equal(said(again), 1);
  store.close();
});

test("a pruned visitor world is recreated instead of crashing its cached engine", async () => {
  const store = new Store(":memory:");
  const engine = new Engine(
    new VisitorStore(store, "pruned"),
    new BaselineModel(),
  );
  await engine.dispatch({ type: "collect", evidenceId: "carrier" });
  assert.equal(engine.world().collected.length, 1);
  // Force the cutoff into the future so the just-written row is pruned.
  VisitorStore.prune(store, -1);
  const recreated = engine.world();
  assert.equal(recreated.collected.length, 0);
  assert.equal(
    recreated.events.some((e) => e.actor === "mara"),
    true,
  );
  store.close();
});

test("a damaged visitor world is replaced instead of crashing its account", () => {
  const store = new Store(":memory:");
  const visitor = new VisitorStore(store, "damaged");
  for (const snapshot of ["{not json", '{"version":1,"agents":[]}']) {
    store.db
      .prepare("UPDATE visitor_world SET snapshot=? WHERE visitor=?")
      .run(snapshot, "damaged");
    const loaded = visitor.load();
    assert.equal(loaded.version, 1);
    assert.equal(loaded.agents.length, 4);
    assert.equal(
      loaded.events.some((event) => event.actor === "mara"),
      true,
    );
  }
  store.close();
});

test("leaked JSON punctuation is stripped from model replies", () => {
  const d = DecisionSchema.parse({
    text: 'who are you?"}',
    factIds: [],
    stance: "question",
    shareWith: "none",
    trustDelta: 0,
    memory: "asked",
  });
  assert.equal(d.text, "who are you?");
});
