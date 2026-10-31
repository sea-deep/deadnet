// Environment verification only: deterministic fixture adapter, no provider call.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { Engine } from "../server/engine.ts";
import { BaselineModel } from "../server/baseline.ts";
import { Store } from "../server/store.ts";
import { initTelemetry, Sentry } from "../server/telemetry-node.ts";

process.env.SENTRY_ENVIRONMENT = "verification";
const dsn =
  process.env.SENTRY_DSN ||
  readFileSync(".data/deadnet-sentry-dsn.txt", "utf8").trim();
initTelemetry(dsn);
class FixtureModel extends BaselineModel {
  constructor(private invalid: boolean) {
    super();
  }
  override async generate(input: Parameters<BaselineModel["generate"]>[0]) {
    const current = Sentry.getActiveSpan();
    if (current)
      console.log(
        `${this.invalid ? "rejected" : "accepted"} fixture trace: ${current.spanContext().traceId}`,
      );
    const result = await super.generate(input);
    if (this.invalid) result.decision.shareWith = "mara";
    return result;
  }
}
for (const invalid of [false, true]) {
  const store = new Store(":memory:");
  const engine = new Engine(store, new FixtureModel(invalid));
  await engine.dispatch({
    type: "message",
    target: "nora",
    text: "Verification fixture",
  });
  store.close();
}
if (!(await Sentry.flush(10000))) throw new Error("Sentry flush timed out");
await Sentry.close();
