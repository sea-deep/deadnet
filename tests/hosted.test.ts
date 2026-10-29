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
