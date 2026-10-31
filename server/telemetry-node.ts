import * as Sentry from "@sentry/node";
import { installTracer } from "./telemetry.ts";

// Only fixed labels and numeric counters leave the process. No story text,
// provider errors, request data, identities, or file paths are exported.
const allowed = new Set([
  "sentry.op",
  "sentry.origin",
  "gen_ai.operation.name",
  "gen_ai.agent.name",
  "gen_ai.tool.name",
  "gen_ai.system",
  "gen_ai.provider.name",
  "gen_ai.response.model",
  "gen_ai.request.model",
  "gen_ai.usage.input_tokens",
  "gen_ai.usage.output_tokens",
  "deadnet.source",
  "deadnet.result",
]);
export function initTelemetry(
  dsn = process.env.SENTRY_DSN,
  transport?: NonNullable<Parameters<typeof Sentry.init>[0]>["transport"],
) {
  if (!dsn) return;
  Sentry.init({
    dsn,
    transport,
    environment:
      process.env.SENTRY_ENVIRONMENT === "verification"
        ? "verification"
        : "production",
    defaultIntegrations: false,
    tracesSampleRate: 1,
    traceLifecycle: "stream",
    sendDefaultPii: false,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      stackFrameVariables: false,
      frameContextLines: 0,
    },
    beforeSend: () => null,
    beforeSendSpan: Sentry.withStreamedSpan((span) => {
      span.attributes = Object.fromEntries(
        Object.entries(span.attributes || {}).filter(([key]) =>
          allowed.has(key),
        ),
      );
      return span;
    }),
  });
  installTracer({
    span: Sentry.startSpan,
    reject: () => {
      const active = Sentry.getActiveSpan();
      if (!active) return;
      const root = Sentry.getRootSpan(active);
      root.setAttribute("deadnet.result", "rejected");
      root.setStatus({ code: 2, message: "rejected" });
    },
  });
}

export { Sentry };
