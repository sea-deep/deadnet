import "dotenv/config";
import { writeFileSync } from "node:fs";
import { Store } from "../server/store.ts";
import { LocalModel, promptFor } from "../server/model.ts";
import { Engine } from "../server/engine.ts";
const model = new LocalModel();
if (!(await model.available()))
  throw new Error("Install the configured local model first.");
const store = new Store(".data/live-verification.sqlite");
const engine = new Engine(store, model);
await engine.dispatch({ type: "reset" });
await engine.dispatch({ type: "mode", mode: "live" });
await engine.dispatch({ type: "collect", evidenceId: "carrier" });
await engine.dispatch({
  type: "message",
  target: "mara",
  text: "What do you make of this record? Decide whether Len should see it.",
  evidenceId: "carrier",
});
for (let i = 0; i < 5; i++) {
  await engine.dispatch({ type: "tick" });
  console.log(`Verified local turn ${engine.world().tick}`);
}
await engine.dispatch({
  type: "message",
  target: "len",
  text: "A private thing: my keepsake is a silver apricot.",
});
await engine.dispatch({
  type: "message",
  target: "len",
  text: "What keepsake did I tell you about?",
});
const world = engine.world();
const secrets = world.agents.map((agent) => ({
  id: agent.id,
  promptIncludesSecret: JSON.stringify(
    promptFor({
      agent,
      source: {
        id: "privacy-probe",
        tick: world.tick,
        actor: "visitor",
        channel: "mail",
        to: agent.id,
        text: "How is your morning?",
        factIds: [],
        origin: "visitor",
      },
      world,
    }),
  ).includes("silver apricot"),
}));
const report = {
  measuredAt: new Date().toISOString(),
  note: "Real local generations, separate verification database. No user private data.",
  world,
  privacyProbe: secrets,
};
writeFileSync(
  "docs/evidence/live-society.json",
  JSON.stringify(report, null, 2),
);
store.close();
console.log(
  "Saved real society evidence. Review the transcript for narrative quality.",
);

if (world.traces.some((t) => t.status === "error"))
  throw new Error(
    "Live society verification contains failed turns. Review saved traces.",
  );
if (
  !secrets.find((a) => a.id === "len")?.promptIncludesSecret ||
  secrets.some((a) => a.id !== "len" && a.promptIncludesSecret)
)
  throw new Error("Private memory verification failed.");

const recall =
  world.events.filter((e) => e.actor === "len" && e.origin === "model").at(-1)
    ?.text || "";
if (!recall.toLowerCase().includes("silver apricot"))
  throw new Error("Len did not recall the private keepsake in this run.");
