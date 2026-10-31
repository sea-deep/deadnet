import { test } from "node:test";
import assert from "node:assert/strict";
import { Engine } from "../server/engine.ts";
import { Store } from "../server/store.ts";
import { BaselineModel } from "../server/baseline.ts";
import { initTelemetry, Sentry } from "../server/telemetry-node.ts";

class InvalidModel extends BaselineModel {
  override async generate(input: Parameters<BaselineModel["generate"]>[0]) {
    const result = await super.generate(input);
    result.decision.shareWith = "mara";
    result.decision.text = "SECRET_OUTPUT_SENTINEL";
    return result;
  }
}

class MockLiveModel extends BaselineModel {
  override name = "openrouter";
  override model = "google/gemma-4-31b-it:free";
  constructor(private fail: boolean) {
    super();
  }
  override async generate(input: Parameters<BaselineModel["generate"]>[0]) {
    const active = Sentry.getActiveSpan();
    active?.setAttribute("http.request.header.cookie", "COOKIE_SENTINEL");
    active?.setAttribute("file.path", "/PRIVATE_PATH_SENTINEL");
    active?.setAttribute(
      "http.request.header.authorization",
      "HEADER_SENTINEL",
    );
    if (this.fail) throw new Error("RAW_PROVIDER_ERROR_SENTINEL");
    const result = await super.generate(input);
    result.trace.model = this.model;
    return result;
  }
}

test("agent traces contain useful spans and reject invalid replies without exporting private content", async () => {
  const envelopes: unknown[] = [];
  initTelemetry("https://public@example.invalid/1", () => ({
    send: async (envelope) => {
      envelopes.push(envelope);
      return { statusCode: 200 };
    },
    flush: async () => true,
  }));
  const store = new Store(":memory:");
  const engine = new Engine(store, new InvalidModel());
  await engine.dispatch({
    type: "message",
    target: "nora",
    text: "SECRET_INPUT_SENTINEL",
  });
  const successStore = new Store(":memory:");
  await new Engine(successStore, new MockLiveModel(false)).dispatch({
    type: "message",
    target: "nora",
    text: "SECRET_INPUT_SENTINEL",
  });
  const failureStore = new Store(":memory:");
  await new Engine(failureStore, new MockLiveModel(true)).dispatch({
    type: "message",
    target: "nora",
    text: "SECRET_INPUT_SENTINEL",
  });
  await Sentry.flush(5000);
  const serialized = JSON.stringify(envelopes);
  assert.match(serialized, /invoke_agent nora/);
  assert.match(serialized, /scope_evidence/);
  assert.match(serialized, /validate_reply/);
  assert.match(serialized, /persist/);
  assert.match(serialized, /rejected/);
  assert.match(serialized, /gen_ai.provider.name/);
  assert.match(serialized, /gen_ai.response.model/);
  assert.match(serialized, /google\/gemma-4-31b-it:free/);
  assert.doesNotMatch(
    serialized,
    /SECRET_INPUT_SENTINEL|SECRET_OUTPUT_SENTINEL|COOKIE_SENTINEL|PRIVATE_PATH_SENTINEL|HEADER_SENTINEL|RAW_PROVIDER_ERROR_SENTINEL/,
  );
  store.close();
  successStore.close();
  failureStore.close();
  await Sentry.close();
});
