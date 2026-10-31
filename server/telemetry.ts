import type * as Sentry from "@sentry/node";

type Tracer = {
  span: typeof Sentry.startSpan;
  reject: () => void;
};
const noopSpan = ((_: unknown, callback: (span: unknown) => unknown) =>
  callback({ setAttribute() {}, setStatus() {} })) as typeof Sentry.startSpan;
let tracer: Tracer = { span: noopSpan, reject: () => {} };
export function installTracer(next: Tracer) {
  tracer = next;
}
export const span: typeof Sentry.startSpan = (options, callback) =>
  tracer.span(options, callback);
export function rejectActiveTrace() {
  tracer.reject();
}

export function safeModelName(model: string, fixture: boolean) {
  return model === "google/gemma-4-31b-it:free"
    ? model
    : fixture
      ? "fixture"
      : "configured-model";
}
export function modelAttributes(
  provider: string,
  model: string,
  fixture: boolean,
) {
  const safeProvider = ["openrouter", "ollama", "local"].includes(provider)
    ? provider
    : "fixture";
  return {
    "gen_ai.operation.name": fixture ? "execute_tool" : "chat",
    "gen_ai.system": safeProvider,
    "gen_ai.provider.name": safeProvider,
    "gen_ai.request.model": safeModelName(model, fixture),
    ...(fixture ? { "gen_ai.tool.name": "fixture_response" } : {}),
    "deadnet.source": fixture ? "fixture" : "live",
  };
}
