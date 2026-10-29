import "dotenv/config";
import { writeFileSync } from "node:fs";
import { OpenRouterModel } from "../server/openrouter.ts";
import { Engine } from "../server/engine.ts";
import { Store } from "../server/store.ts";
const model = new OpenRouterModel();
if (!(await model.available()))
  throw new Error("OpenRouter credential could not be verified.");
const store = new Store(".data/hosted-verification.sqlite"),
  engine = new Engine(store, model);
await engine.dispatch({ type: "reset" });
await engine.dispatch({ type: "collect", evidenceId: "carrier" });
await engine.dispatch({
  type: "message",
  target: "mara",
  text: "Have you seen this file before? What does it mean?",
  evidenceId: "carrier",
});
const world = engine.world();
const report = {
  measuredAt: new Date().toISOString(),
  model: model.model,
  provider: "OpenRouter (hosted open-weight model)",
  world,
  costUsd: world.traces.reduce((n, t) => n + (t.costUsd || 0), 0),
};
writeFileSync("docs/evidence/openrouter.json", JSON.stringify(report, null, 2));
store.close();
console.log(
  JSON.stringify({
    model: model.model,
    turns: world.traces.length,
    failures: world.traces.filter((t) => t.status === "error").length,
    costUsd: report.costUsd,
  }),
);
if (world.traces.some((t) => t.status === "error"))
  throw new Error("Hosted generation failed. Read sanitized traces.");
