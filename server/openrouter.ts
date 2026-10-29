import { RuleError } from "./engine.ts";

import { DecisionSchema } from "./decision.ts";
import {
  promptFor,
  hashPrompt,
  schemaFor,
  type ModelAdapter,
  type ModelInput,
  type Generation,
} from "./model.ts";
export class OpenRouterModel implements ModelAdapter {
  name = "openrouter";
  model: string;
  private key: string;
  constructor(
    key = process.env.OPENROUTER_API_KEY || "",
    model = process.env.OPENROUTER_MODEL || "openrouter/free",
    private rateGate: () => void | Promise<void> = () => {},
    private onThrottle: (seconds: number) => void | Promise<void> = () => {},
  ) {
    this.key = key;
    this.model = model;
    if (!model.endsWith(":free") && model !== "openrouter/free")
      throw new Error("Only explicitly free OpenRouter routes are enabled.");
  }
  async available() {
    if (!this.key) return false;
    try {
      const r = await fetch("https://openrouter.ai/api/v1/key", {
        headers: { Authorization: `Bearer ${this.key}` },
        signal: AbortSignal.timeout(5000),
      });
      return r.ok;
    } catch {
      return false;
    }
  }
  async generate(input: ModelInput): Promise<Generation> {
    const start = performance.now(),
      messages = promptFor(input),
      promptHash = await hashPrompt(messages);
    let attempts = 0,
      inputTokens = 0,
      outputTokens = 0,
      costUsd = 0,
      lastError: unknown;
    for (let attempt = 1; attempt <= 2; attempt++) {
      attempts = attempt;
      try {
        if (!this.key) throw new Error("OpenRouter key is not configured.");
        await this.rateGate();
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.key}`,
            "Content-Type": "application/json",
            "X-OpenRouter-Title": "DEADNET",
          },
          body: JSON.stringify({
            model: this.model,
            messages,
            temperature: 0.85,
            ...(/^google\/gemma/.test(this.model)
              ? { reasoning: { enabled: false } }
              : { reasoning: { max_tokens: 1024, exclude: true } }),
            max_tokens: /^google\/gemma/.test(this.model) ? 320 : 4096,
            response_format: { type: "json_object" },
            provider: { require_parameters: true },
          }),
          signal: AbortSignal.timeout(45000),
        });
        if (r.status === 429) {
          await this.onThrottle(
            Math.max(60, Number(r.headers.get("retry-after")) || 60),
          );
          const e = new RuleError(
            "The free model is busy. Please try again in a minute.",
            429,
          );
          Object.assign(e, {
            retryAfter: Math.max(
              60,
              Number(r.headers.get("retry-after")) || 60,
            ),
          });
          throw e;
        }
        if (!r.ok) {
          const info = await r.json().catch(() => ({}));
          throw new Error(
            `OpenRouter HTTP ${r.status}: ${String(info.error?.message || "Provider unavailable").slice(0, 220)}`,
          );
        }
        const data = await r.json();
        inputTokens += Number(data.usage?.prompt_tokens || 0);
        outputTokens += Number(data.usage?.completion_tokens || 0);
        costUsd += Number(data.usage?.cost || 0);
        const decision = DecisionSchema.parse(
          JSON.parse(data.choices?.[0]?.message?.content || ""),
        );
        if (decision.shareWith === input.agent.id)
          throw new Error("Model selected itself as recipient.");
        const ms = Math.round(performance.now() - start);
        return {
          decision,
          trace: {
            provider: this.name,
            model: data.model || this.model,
            status: "ok",
            latencyMs: ms,
            inputTokens,
            outputTokens,
            tokensPerSecond: ms
              ? Math.round((outputTokens / ms) * 10000) / 10
              : 0,
            costUsd,
            attempts,
            sourceId: input.source.id,
            action: `${decision.stance} → ${decision.shareWith}`,
            promptHash,
          },
        };
      } catch (e) {
        lastError = e;
        if (e instanceof RuleError) throw e;
        if (
          e instanceof Error &&
          /HTTP|fetch|timeout|configured/i.test(e.message)
        )
          break;
      }
    }
    const e = new Error(
      lastError instanceof Error
        ? lastError.message
        : "Hosted generation failed.",
    );
    Object.assign(e, {
      trace: {
        provider: this.name,
        model: this.model,
        status: "error",
        latencyMs: Math.round(performance.now() - start),
        inputTokens,
        outputTokens,
        tokensPerSecond: 0,
        costUsd,
        attempts,
        sourceId: input.source.id,
        error: e.message.slice(0, 200),
        promptHash,
      },
    });
    throw e;
  }
}
