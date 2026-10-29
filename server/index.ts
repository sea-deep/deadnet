import "dotenv/config";
import express from "express";
import { createServer as viteServer } from "vite";
import { z } from "zod";
import { Store } from "./store.ts";
import { LocalModel } from "./model.ts";
import { Quota } from "./quota.ts";
import { OpenRouterModel } from "./openrouter.ts";
import { Engine, RuleError } from "./engine.ts";
import { AudioService } from "./audio.ts";
import { ARCHIVE } from "./seed.ts";
const port = Number(process.env.PORT) || 3000;
const store = new Store(),
  quota = new Quota(store),
  model =
    process.env.MODEL_PROVIDER === "openrouter" ||
    (process.env.OPENROUTER_API_KEY && process.env.MODEL_PROVIDER !== "ollama")
      ? new OpenRouterModel(
          undefined,
          undefined,
          () => quota.consume("local"),
          (seconds) => quota.cooldown(seconds),
        )
      : new LocalModel(),
  engine = new Engine(store, model),
  audio = new AudioService(store);
engine.boot();
// Every process start pauses autonomous work. No unattended inference after a restart.
const startup = engine.world();
startup.auto = false;
startup.revision++;
store.save(startup, "startup-pause");
const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  const host = req.hostname;
  if (!["localhost", "127.0.0.1", "[::1]"].includes(host)) {
    res.status(403).json({ error: "Local access only." });
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    const origin = req.get("origin");
    if (
      origin &&
      !["http://localhost:" + port, "http://127.0.0.1:" + port].includes(origin)
    ) {
      res.status(403).json({ error: "Cross-origin writes are not allowed." });
      return;
    }
  }
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});
app.use(express.json({ limit: "8kb" }));
let lastClient = 0;
let statusCache: { at: number; available: boolean } | undefined;
async function status() {
  if (!statusCache || Date.now() - statusCache.at > 10000)
    statusCache = { at: Date.now(), available: await model.available() };
  return {
    available: statusCache.available,
    provider: model.name,
    model: model.model,
    voice: audio.configured(),
    quota: model.name === "openrouter" ? quota.state("local") : undefined,
    busy: engine.busy,
    message: statusCache.available
      ? model.name === "openrouter"
        ? "Free OpenRouter route configured. Availability depends on the shared provider pool."
        : "Local model connected."
      : "Local model unavailable. Start Ollama and install the configured model, or explicitly select the deterministic baseline.",
  };
}
async function snapshot() {
  const world = engine.world();
  return {
    world,
    archive: ARCHIVE.map((e) =>
      e.locked && world.collected.filter((id) => id !== "manifest").length < 2
        ? {
            ...e,
            body: "Recover CARRIER.LOG and HAPPY_BIRTHDAY.EML to reconstruct this record.",
            fact: "",
            excerpt: "File fragments incomplete. Two earlier records required.",
          }
        : e,
    ),
    status: await status(),
  };
}
app.get("/api/state", async (_req, res) => {
  lastClient = Date.now();
  res.setHeader("Cache-Control", "no-store");
  res.json(await snapshot());
});
const agent = z.enum(["mara", "len", "sysop"]);
const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("tick") }),
  z.object({ type: z.literal("collect"), evidenceId: z.string().max(30) }),
  z.object({
    type: z.literal("message"),
    target: agent,
    text: z.string().min(1).max(1000),
    evidenceId: z.string().max(30).optional(),
  }),
  z.object({ type: z.literal("publish"), evidenceId: z.string().max(30) }),
  z.object({
    type: z.literal("resolve"),
    choice: z.enum(["exposed", "sealed"]),
  }),
  z.object({ type: z.literal("mode"), mode: z.enum(["live", "baseline"]) }),
  z.object({ type: z.literal("auto"), enabled: z.boolean() }),
  z.object({ type: z.literal("renew") }),
  z.object({ type: z.literal("reset") }),
]);
app.post("/api/action", async (req, res, next) => {
  try {
    const action = actionSchema.parse(req.body);
    await engine.dispatch(action);
    res.json(await snapshot());
  } catch (e) {
    next(e);
  }
});
app.post("/api/audio/:id", async (req, res, next) => {
  try {
    const event = engine.world().events.find((e) => e.id === req.params.id);
    if (!event) throw new RuleError("Message not found.", 404);
    const data = await audio.speech(event);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "private, max-age=86400");
    res.send(Buffer.from(data));
  } catch (e) {
    next(e);
  }
});
app.get("/api/export", (_req, res) => {
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="deadnet-investigation.json"',
  );
  res.json({
    notice:
      "Contains private fictional conversations you wrote. Review before sharing.",
    ...engine.world(),
  });
});
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Unknown API endpoint." });
});
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const err = error as Error;
    if (error instanceof RuleError && error.status === 429)
      res.setHeader(
        "Retry-After",
        String((error as RuleError & { retryAfter?: number }).retryAfter || 60),
      );
    res
      .status(
        error instanceof RuleError
          ? error.status
          : error instanceof z.ZodError
            ? 400
            : 500,
      )
      .json({
        error:
          error instanceof RuleError
            ? err.message
            : error instanceof z.ZodError
              ? "Invalid action. Check the selected account, file, and message length."
              : "The local service could not complete this action. Your saved investigation is intact.",
      });
    if (!(error instanceof RuleError) && !(error instanceof z.ZodError))
      console.error(err.message);
  },
);
if (process.env.NODE_ENV === "production") app.use(express.static("dist"));
else
  app.use(
    (
      await viteServer({
        server: { middlewareMode: true, hmr: { port: port + 20000 } },
        appType: "spa",
      })
    ).middlewares,
  );
const server = app.listen(port, "127.0.0.1", () =>
  console.log(`DEADNET is listening at http://127.0.0.1:${port}`),
);
// At most one generation every 35 seconds, and only while a client is polling.
const timer = setInterval(async () => {
  const w = engine.world();
  if (
    !w.auto ||
    !w.remainingTurns ||
    engine.busy ||
    Date.now() - lastClient > 12000
  )
    return;
  try {
    await engine.dispatch({ type: "tick" });
  } catch (e) {
    console.error("Autonomy paused:", (e as Error).message);
  }
}, 35000);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    clearInterval(timer);
    server.close();
    store.close();
    process.exit(0);
  });
