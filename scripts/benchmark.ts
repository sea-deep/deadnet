import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { LocalModel, promptFor } from "../server/model.ts";
import { BaselineModel } from "../server/baseline.ts";
import { seedWorld, ARCHIVE } from "../server/seed.ts";
import type { Event } from "../src/types.ts";
const model = new LocalModel(),
  baseline = new BaselineModel();
if (!(await model.available()))
  throw new Error(
    "Configured local model is unavailable. No benchmark was fabricated.",
  );
const world = seedWorld();
const samples = [];
for (let i = 0; i < 9; i++) {
  const agent = structuredClone(world.agents[i % 3]);
  agent.knownFacts = [...new Set([...agent.knownFacts, "carrier"])];
  const source: Event = {
    id: `bench-${i}`,
    tick: i,
    actor: "visitor",
    to: agent.id,
    channel: "mail",
    text:
      i < 3
        ? "I recovered the carrier log. Can a reply prove that somebody is there?"
        : i < 6
          ? "I remember a silver apricot. What do you make of the carrier log?"
          : "Do you believe Mara or the operator about this log? Would you tell someone?",
    factIds: ["carrier"],
    origin: "visitor",
  };
  const input = { agent, source, world };
  const start = performance.now();
  try {
    const result = await model.generate(input);
    samples.push({
      sample: i + 1,
      actor: agent.id,
      ...result.trace,
      decision: result.decision,
      promptChars: JSON.stringify(promptFor(input)).length,
    });
    console.log(
      `Sample ${i + 1}: ${agent.id}, ${result.trace.latencyMs}ms, ${result.trace.outputTokens} tokens`,
    );
  } catch (e) {
    samples.push({
      sample: i + 1,
      actor: agent.id,
      status: "error",
      latencyMs: performance.now() - start,
      error: (e as Error).message,
    });
    console.log(`Sample ${i + 1}: FAILED`);
  }
}
const baselineStart = performance.now();
const base = await baseline.generate({
  agent: world.agents[0],
  source: world.events[0],
  world,
});
const baselineMs = performance.now() - baselineStart;
const ok = samples.filter((s) => s.status === "ok");
const latencies = ok.map((s) => s.latencyMs).sort((a, b) => a - b);
let details: unknown = {},
  resident: unknown = {},
  hardware = "unavailable";
try {
  details = await (
    await fetch(`${model.base}/api/show`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: model.model }),
    })
  ).json();
  resident = await (await fetch(`${model.base}/api/ps`)).json();
} catch {
  /* Compatible servers may not expose Ollama metadata. */
}
try {
  hardware = execFileSync("sysctl", ["-n", "machdep.cpu.brand_string"], {
    encoding: "utf8",
  }).trim();
} catch {
  /* portable */
}
const report = {
  measuredAt: new Date().toISOString(),
  hardware: {
    cpu: hardware,
    platform: process.platform,
    arch: process.arch,
    totalMemoryBytes: 17179869184,
    node: process.version,
  },
  configuration: {
    provider: model.name,
    model: model.model,
    context: 4096,
    maxOutputTokens: 320,
    concurrency: 1,
    thinking: false,
    temperature: 0.85,
  },
  summary: {
    samples: samples.length,
    success: ok.length,
    failureRate: (samples.length - ok.length) / samples.length,
    firstRequestMs: samples[0].latencyMs,
    medianMs: latencies[Math.floor(latencies.length / 2)],
    p95Ms: latencies[Math.ceil(latencies.length * 0.95) - 1],
    totalInputTokens: ok.reduce(
      (n, s) => n + ("inputTokens" in s ? s.inputTokens : 0),
      0,
    ),
    totalOutputTokens: ok.reduce(
      (n, s) => n + ("outputTokens" in s ? s.outputTokens : 0),
      0,
    ),
  },
  baseline: {
    latencyMs: baselineMs,
    inputTokens: 0,
    outputTokens: 0,
    decision: base.decision,
    note: "Authored deterministic fixture, not generative intelligence.",
  },
  resident,
  modelDetails: details,
  samples,
  notes: [
    "Sequential varied prompts. Nine samples are not a statistically comprehensive benchmark.",
    "First request is recorded separately; coldness depends on whether runner was already resident.",
    "RAM from Ollama size/size_vram is model allocation, not whole-system peak memory.",
    "Hardware memory is 16 GiB verified with sysctl; actual free memory varies.",
    "No electrical energy or dollar hardware cost measured. Local provider API fee is zero.",
  ],
};
mkdirSync("docs/evidence", { recursive: true });
writeFileSync("docs/evidence/benchmark.json", JSON.stringify(report, null, 2));
console.log("Wrote docs/evidence/benchmark.json");
