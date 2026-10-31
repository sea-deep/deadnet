import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_OPENROUTER_MODEL,
  OpenRouterModel,
} from "../server/openrouter.ts";
import { seedWorld } from "../server/seed.ts";
import { RuleError } from "../server/engine.ts";
test("hosted default is a pinned free Gemma route, with no router or paid fallback", async () => {
  assert.equal(DEFAULT_OPENROUTER_MODEL, "google/gemma-4-31b-it:free");
  assert.equal(
    new OpenRouterModel("fixture-key", "openrouter/free").model,
    DEFAULT_OPENROUTER_MODEL,
  );
  const old = globalThis.fetch;
  let request: Record<string, any> | undefined;
  globalThis.fetch = async (_url, init) => {
    request = JSON.parse(String(init?.body));
    return Response.json({
      model: DEFAULT_OPENROUTER_MODEL,
      choices: [
        {
          message: {
            content: JSON.stringify({
              text: "Adam? I remember the knocks, not the face.",
              factIds: [],
              stance: "question",
              shareWith: "none",
              trustDelta: 0,
              memory: "Adam asked what I remember.",
            }),
          },
        },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 40, cost: 0 },
    });
  };
  try {
    const w = seedWorld();
    const result = await new OpenRouterModel(
      "fixture-key",
      DEFAULT_OPENROUTER_MODEL,
    ).generate({
      agent: w.agents.find((a) => a.id === "nora")!,
      world: w,
      source: w.events[0],
    });
    assert.equal(request?.model, DEFAULT_OPENROUTER_MODEL);
    assert.equal(request?.models, undefined);
    assert.deepEqual(request?.reasoning, { enabled: false });
    assert.equal(request?.max_tokens, 320);
    assert.equal(result.trace.model, DEFAULT_OPENROUTER_MODEL);
    assert.equal(result.trace.attempts, 1);
  } finally {
    globalThis.fetch = old;
  }
});
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
