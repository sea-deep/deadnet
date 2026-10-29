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
      agent.id === "nora"
        ? evidence
          ? "i remember the scrape of the key now. it wasn’t len’s. i couldn’t see his face from the floor."
          : "there were two knocks. i thought it was mara. but the coat was wet, and she never went out that night."
        : agent.id === "len"
          ? evidence
            ? "That is my clock-out time. I told you I had gone home. Why is my name still in his statement?"
            : "I keep looking for that bus ticket. It was raining. The ink had already run."
          : agent.id === "mara"
            ? evidence
              ? "i saved a copy. that isn’t what owen told the police. len should see this."
              : "her scarf is still on my chair. i don’t know what to do with it."
            : evidence
              ? "That is an incomplete copy of a maintenance record. Send it to me before you circulate another accusation."
              : "Management has already provided a statement. Nora’s family deserves privacy.";
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
