import type { ModelAdapter, ModelInput, Generation } from "./model.ts";
export class BaselineModel implements ModelAdapter {
  name = "baseline";
  model = "deterministic-baseline-v1";
  async available() {
    return true;
  }
  async generate({ agent, source }: ModelInput): Promise<Generation> {
    const evidence = source.factIds.length > 0;
    const text =
      agent.id === "len"
        ? evidence
          ? "A log can be wrong. I remember the phone ringing. Why would I remember that?"
          : "Still here. Coffee is cold again. Anyone else awake?"
        : agent.id === "mara"
          ? evidence
            ? "i saved a copy. the dates disagree with what we remember. len should see this."
            : "the archive has the same sky in every photograph. i’m checking the timestamps."
          : evidence
            ? "The continuity service preserves what remains. Please consider the effect of these records before sharing them."
            : "Routine maintenance complete. Please disregard calendar discrepancies.";
    return {
      decision: {
        text,
        factIds: source.factIds.filter(
          (id): id is "carrier" | "birthday" | "manifest" =>
            ["carrier", "birthday", "manifest"].includes(id),
        ),
        stance:
          agent.id === "len"
            ? "deny"
            : agent.id === "mara"
              ? "question"
              : "deflect",
        shareWith: evidence && agent.id === "mara" ? "len" : "none",
        trustDelta: evidence && agent.id === "len" ? -1 : 0,
        memory: `${source.actor}: ${source.text.slice(0, 100)}`,
      },
      trace: {
        provider: "baseline",
        model: this.model,
        status: "ok",
        latencyMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        tokensPerSecond: 0,
        sourceId: source.id,
        attempts: 1,
        action: "deterministic fixture",
      },
    };
  }
}
