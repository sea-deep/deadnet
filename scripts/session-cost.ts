import "dotenv/config";
import { writeFileSync } from "node:fs";
import { Engine } from "../server/engine.ts";
import { Store } from "../server/store.ts";
import { LocalModel } from "../server/model.ts";
const fetchOriginal = globalThis.fetch;
const requests: { host: string; path: string }[] = [];
globalThis.fetch = async (input, init) => {
  const u = new URL(
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url,
  );
  if (!["127.0.0.1", "localhost", "[::1]"].includes(u.hostname))
    throw new Error("Offline verification: external egress blocked");
  requests.push({ host: u.hostname, path: u.pathname });
  return fetchOriginal(input, init);
};
const model = new LocalModel();
if (!(await model.available())) throw new Error("Local model unavailable");
const store = new Store(".data/five-minute.sqlite"),
  engine = new Engine(store, model);
await engine.dispatch({ type: "reset" });
await engine.dispatch({ type: "mode", mode: "live" });
await engine.dispatch({ type: "collect", evidenceId: "carrier" });
const start = performance.now();
const schedule = [0, 35, 70, 100, 105, 140, 175, 200, 210, 245, 280];
for (const second of schedule) {
  await new Promise((r) =>
    setTimeout(r, Math.max(0, second * 1000 - (performance.now() - start))),
  );
  if (second === 0)
    await engine.dispatch({
      type: "message",
      target: "mara",
      text: "Does this record change what you think? Should Len know?",
      evidenceId: "carrier",
    });
  else if (second === 100)
    await engine.dispatch({
      type: "message",
      target: "len",
      text: "My keepsake is a silver apricot. Please remember it.",
    });
  else if (second === 200)
    await engine.dispatch({
      type: "message",
      target: "len",
      text: "What keepsake did I tell you about?",
    });
  else await engine.dispatch({ type: "tick" });
  console.log(`Session ${second}s / turn ${engine.world().tick}`);
}
await new Promise((r) =>
  setTimeout(r, Math.max(0, 300000 - (performance.now() - start))),
);
const world = engine.world();
const report = {
  measuredAt: new Date().toISOString(),
  durationMs: Math.round(performance.now() - start),
  scenario:
    "Eight scheduled autonomous turns and three private visitor messages in five minutes. Egress guard rejects every non-loopback fetch. Voice excluded.",
  networkGuard:
    "Process-level fetch restriction; not a system-wide Wi-Fi disconnection test.",
  requests,
  summary: {
    turns: world.tick,
    failures: world.traces.filter((t) => t.status === "error").length,
    inputTokens: world.traces.reduce((n, t) => n + t.inputTokens, 0),
    outputTokens: world.traces.reduce((n, t) => n + t.outputTokens, 0),
    generationTimeMs: world.traces.reduce((n, t) => n + t.latencyMs, 0),
    paidInferenceRequests: 0,
    elevenLabsRequests: 0,
    providerApiCostUsd: 0,
    electricityCost: "not measured",
  },
  world,
};
writeFileSync(
  "docs/evidence/five-minute-session.json",
  JSON.stringify(report, null, 2),
);
store.close();
console.log("Five-minute session saved.");
