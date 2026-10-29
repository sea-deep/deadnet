import { test } from "node:test";
import assert from "node:assert/strict";
import { OpenRouterModel } from "../server/openrouter.ts";
import { seedWorld } from "../server/seed.ts";
import { RuleError } from "../server/engine.ts";
test("hosted adapter rejects paid routes and handles provider throttle without retries or scripted output", async () => {
  assert.throws(() => new OpenRouterModel("test", "google/gemma-4-31b-it"));
  const old = globalThis.fetch;
  let calls = 0,
    charged = 0,
    cooldown = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response("{}", { status: 429, headers: { "Retry-After": "1" } });
  };
  try {
    const model = new OpenRouterModel(
      "test",
      "google/gemma-4-31b-it:free",
      () => {
        charged++;
      },
      (n) => {
        cooldown = n;
      },
    );
    const w = seedWorld();
    await assert.rejects(
      () =>
        model.generate({ agent: w.agents[0], world: w, source: w.events[0] }),
      (e) => e instanceof RuleError && e.status === 429,
    );
    assert.equal(calls, 1);
    assert.equal(charged, 1);
    assert.equal(cooldown, 60);
  } finally {
    globalThis.fetch = old;
  }
});
