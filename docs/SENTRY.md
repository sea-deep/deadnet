# Following Nora's reply

Sentry Agent Tracing follows the boundary between Nora's conversation and the fixed case. The dedicated project is `deadnet` in the `dipak-2o` organization. `SENTRY_DSN` is server-only; omit it to disable telemetry.

The integration uses `@sentry/node` 10.78.0 and Sentry's [manual agent instrumentation](https://docs.sentry.io/platforms/javascript/guides/node/agent-tracing/manual-instrumentation/). No agent framework or provider change is required.

Each message/tick trace contains:

1. `invoke_agent nora` (or the addressed resident).
2. `scope_evidence`, covering the witnessed-record calculation.
3. `gen_ai.chat` for a live provider, or `fixture_response` for an authored fixture.
4. `validate_reply`, covering the JSON contract, private target and cited evidence.
5. `persist`, covering the saved state.

A rejected generation marks the root trace rejected even when the engine handles the failure and returns a recoverable case. Model spans carry the provider, configured/returned model and token counts. Unknown custom model names use a fixed label to avoid leaking arbitrary configuration.

## Captured evidence

The [manifest](evidence/sentry/manifest.json) records two actual traces and screenshots captured from the signed-in Sentry dashboard in Safari:

- [Accepted fixture](evidence/sentry/verification-accepted-trace.png), trace `b820c135b6e94b10ac07989fdc81105c`.
- [Rejected fixture](evidence/sentry/verification-rejected-trace.png), trace `df343ffd05fa4d2782efa65d4eaa2f51`.
- [Validation detail](evidence/sentry/verification-rejected-detail.png), the same rejected trace with `validate_reply` selected and status `error` visible.

These runs use a deterministic adapter in environment `verification`. The rejected reply attempts to send Nora's private signal to another resident; the validator blocks it. The captures verify Sentry ingestion and the actual application boundary. Their sub-millisecond/millisecond durations do not measure hosted inference. No model or voice provider was called to produce them.

Reproduce the verification after configuring a project DSN:

```sh
SENTRY_ENVIRONMENT=verification npx tsx scripts/check-sentry.ts
```

This sends two verification traces to Sentry. Ordinary unit and browser tests use a memory transport or leave Sentry disabled.

## Data boundaries

Default automatic integrations are disabled. An explicit attribute allowlist permits fixed operation labels, model/provider identity, token counters and outcome. Input/output recording, request bodies, headers, cookies, user information, query strings, database values, local variables and source context are disabled. Error events are not exported; errors are represented by span status and a fixed rejection label.

The privacy test serializes complete transport envelopes and checks that input/output sentinels, provider error text, private paths, cookies and authorization headers are absent. The hosted game uses the Node initializer. The static exhibition uses a browser-safe no-op facade and does not import the Node SDK.

## Deployment

The existing Render `room317` service has `SENTRY_DSN` and `SENTRY_ENVIRONMENT=production` configured. `render.yaml` declares the same server-only settings. Player-triggered live turns will create production model spans; the judge screenshots above remain explicitly verification traces.
