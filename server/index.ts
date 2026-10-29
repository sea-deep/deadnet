import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import express from "express";
import { createServer as viteServer } from "vite";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { Store, VisitorStore } from "./store.ts";
import { LocalModel } from "./model.ts";
import { Quota } from "./quota.ts";
import { OpenRouterModel } from "./openrouter.ts";
import { Engine, RuleError } from "./engine.ts";
import { AudioService } from "./audio.ts";
import { ARCHIVE, STORY_ID, seedWorld } from "./seed.ts";
import { caseProgress } from "../src/rules.ts";
const port = Number(process.env.PORT) || 3000;
/** Public hosting: every browser gets its own private world; no autonomous turns. */
const hosted = process.env.DEADNET_PUBLIC === "1";
const useOpenRouter =
  process.env.MODEL_PROVIDER === "openrouter" ||
  Boolean(
    process.env.OPENROUTER_API_KEY && process.env.MODEL_PROVIDER !== "ollama",
  );
const store = new Store(),
  quota = new Quota(store),
  modelFor = (visitor: string) =>
    useOpenRouter
      ? new OpenRouterModel(
          undefined,
          undefined,
          () => quota.consume(visitor),
          (seconds) => quota.cooldown(seconds),
        )
      : new LocalModel(),
  model = modelFor("local"),
  engine = new Engine(store, model),
  audio = new AudioService(store);
const visitors = new Map<string, Engine>();
function visitorEngine(id: string) {
  let e = visitors.get(id);
  if (!e) {
    e = new Engine(new VisitorStore(store, id), modelFor(id));
    if (e.world().storyId !== STORY_ID) e.store.reset(seedWorld());
    visitors.set(id, e);
    // Keep memory bounded; worlds stay in SQLite.
    if (visitors.size > 500) {
      const oldest = visitors.keys().next().value!;
      if (!visitors.get(oldest)!.busy) visitors.delete(oldest);
    }
  }
  return e;
}
const VISITOR_COOKIE = "dn_visitor";
function visitorId(req: express.Request, res: express.Response) {
  const found = /(?:^|;\s*)dn_visitor=([0-9a-f-]{36})/.exec(
    req.get("cookie") || "",
  )?.[1];
  if (found) return found;
  const id = randomUUID();
  res.cookie(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: req.secure,
    maxAge: 30 * 86400000,
  });
  return id;
}
/** The world and quota bucket this request belongs to. */
function context(req: express.Request, res: express.Response) {
  if (!hosted) return { engine, visitor: "local" };
  const visitor = visitorId(req, res);
  return { engine: visitorEngine(visitor), visitor };
}
if (hosted) {
  VisitorStore.prune(store);
  setInterval(() => VisitorStore.prune(store), 3600000).unref();
}
if (engine.world().storyId !== STORY_ID) {
  mkdirSync(".data", { recursive: true });
  writeFileSync(
    `.data/pre-case-${Date.now()}.json`,
    JSON.stringify(engine.world(), null, 2),
  );
  store.reset(seedWorld(engine.world().mode));
}
engine.boot();
// Every process start pauses autonomous work. No unattended inference after a restart.
const startup = engine.world();
startup.auto = false;
startup.revision++;
store.save(startup, "startup-pause");
const app = express();
app.disable("x-powered-by");
if (hosted) app.set("trust proxy", 1);
// Health checks must not create visitor worlds.
app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});
app.use((req, res, next) => {
  const host = req.hostname;
  if (!hosted && !["localhost", "127.0.0.1", "[::1]"].includes(host)) {
    res.status(403).json({ error: "Local access only." });
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    const origin = req.get("origin");
    const allowed = hosted
      ? [`${req.protocol}://${req.get("host")}`]
      : ["http://localhost:" + port, "http://127.0.0.1:" + port];
    if (origin && !allowed.includes(origin)) {
      res.status(403).json({ error: "Cross-origin writes are not allowed." });
      return;
    }
  }
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});
const smallJson = express.json({ limit: "8kb" });
// Save files are larger than actions; only the restore route accepts them.
app.use((req, res, next) =>
  req.path === "/api/restore" ? next() : smallJson(req, res, next),
);
let lastClient = 0;
let statusCache: { at: number; available: boolean } | undefined;
async function status(engine: Engine, visitor: string) {
  if (!statusCache || Date.now() - statusCache.at > 10000)
    statusCache = { at: Date.now(), available: await model.available() };
  return {
    available: statusCache.available,
    provider: model.name,
    model: model.model,
    voice: audio.configured(),
    quota: model.name === "openrouter" ? quota.state(visitor) : undefined,
    busy: engine.busy,
    message: statusCache.available
      ? model.name === "openrouter"
        ? "Free AI route configured. Availability depends on the shared free pool."
        : "Local model connected."
      : "Local model unavailable. Start Ollama and install the configured model, or explicitly select the deterministic baseline.",
  };
}
async function snapshot(engine: Engine, visitor: string) {
  const world = engine.world();
  return {
    world,
    archive: ARCHIVE.map((e) =>
      e.locked && !caseProgress(world).unlocked
        ? {
            ...e,
            body: "Open the door log and saved conversation, and play two of Nora’s games, to reconstruct the backup.",
            fact: "",
            excerpt: "File fragments incomplete. Two earlier records required.",
          }
        : e,
    ),
    status: await status(engine, visitor),
  };
}
app.get("/api/state", async (req, res) => {
  lastClient = Date.now();
  const { engine, visitor } = context(req, res);
  res.setHeader("Cache-Control", "no-store");
  res.json(await snapshot(engine, visitor));
});
const agent = z.enum(["mara", "len", "sysop", "nora"]);
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
    suspect: z.enum(["mara", "len", "sysop"]).optional(),
  }),
  z.object({ type: z.literal("mode"), mode: z.enum(["live", "baseline"]) }),
  z.object({
    type: z.literal("played"),
    game: z.enum(["snake", "flappy", "tetris", "2048", "phantomicus"]),
  }),
  z.object({ type: z.literal("auto"), enabled: z.boolean() }),
  z.object({ type: z.literal("renew") }),
  z.object({ type: z.literal("reset") }),
]);
app.post("/api/action", async (req, res, next) => {
  try {
    const action = actionSchema.parse(req.body);
    const { engine, visitor } = context(req, res);
    // Hosted copies never run unattended turns.
    if (hosted && action.type === "auto")
      throw new RuleError("Autonomous turns are off on the hosted copy.", 403);
    await engine.dispatch(action);
    res.json(await snapshot(engine, visitor));
  } catch (e) {
    next(e);
  }
});
const gameId = z.enum([
  "snake",
  "flappy",
  "tetris",
  "2048",
  "phantomicus",
]);
/** A save must belong to this story and stay within the game's own limits. */
const saveSchema = z.object({
  world: z
    .object({
      version: z.literal(1),
      storyId: z.literal(STORY_ID),
      tick: z.number().int().min(0),
      revision: z.number().int().min(0),
      boots: z.number().int().min(0),
      mode: z.enum(["live", "baseline"]),
      agents: z.array(z.object({ id: agent }).passthrough()).length(4),
      events: z
        .array(
          z
            .object({ id: z.string(), text: z.string().max(4000) })
            .passthrough(),
        )
        .max(2000),
      collected: z.array(z.enum(["carrier", "birthday", "manifest"])).max(3),
      played: z.array(gameId).max(6).optional(),
      published: z.array(z.enum(["carrier", "birthday", "manifest"])).max(3),
      ending: z.enum(["open", "exposed", "sealed"]),
      accused: z.enum(["mara", "len", "sysop"]).optional(),
      remainingTurns: z.number().int().min(0).max(18),
      auto: z.boolean(),
      traces: z.array(z.object({}).passthrough()).max(500),
      createdAt: z.string(),
    })
    .passthrough(),
});
app.post(
  "/api/restore",
  express.json({ limit: "2mb" }),
  async (req, res, next) => {
    try {
      const { engine, visitor } = context(req, res);
      if (engine.busy)
        throw new RuleError("Wait for the current reply first.", 409);
      const parsed = saveSchema.safeParse(req.body);
      if (!parsed.success)
        throw new RuleError("That isn’t a save file for this case.");
      const { world } = parsed.data;
      const current = engine.world();
      // Never resume unattended turns from a file; keep the newest revision number.
      const restored = {
        ...world,
        auto: false,
        revision: Math.max(world.revision, current.revision) + 1,
      } as unknown as typeof current;
      engine.store.save(restored, "restore");
      res.json(await snapshot(engine, visitor));
    } catch (e) {
      next(e);
    }
  },
);
app.post("/api/audio/:id", async (req, res, next) => {
  try {
    const { engine } = context(req, res);
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
app.get("/api/export", (req, res) => {
  const { engine } = context(req, res);
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
const server = app.listen(port, hosted ? "0.0.0.0" : "127.0.0.1", () =>
  console.log(
    hosted
      ? `DEADNET (public, one private world per visitor) is listening on port ${port}`
      : `DEADNET is listening at http://127.0.0.1:${port}`,
  ),
);
// At most one generation every 35 seconds, and only while a client is polling.
const timer = setInterval(async () => {
  if (hosted) return;
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
