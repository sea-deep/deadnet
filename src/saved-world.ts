import type { Agent, Event, Trace, World } from "./types";

const AGENT_IDS = ["mara", "len", "sysop", "nora"] as const;
const EVENT_ACTORS = [
  "mara",
  "len",
  "sysop",
  "nora",
  "visitor",
  "system",
] as const;
const CHANNELS = ["feed", "mail", "system"] as const;
const ORIGINS = ["seed", "model", "visitor", "baseline", "system"] as const;
const STANCES = ["accept", "deny", "question", "deflect"] as const;
const ENDINGS = ["open", "exposed", "sealed"] as const;
const FACTS = ["carrier", "birthday", "manifest"] as const;
const GAMES = [
  "snake",
  "flappy",
  "tetris",
  "2048",
  "phantomicus",
  "hocus",
] as const;

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function has<T extends string>(
  values: readonly T[],
  value: unknown,
): value is T {
  return (
    typeof value === "string" && (values as readonly string[]).includes(value)
  );
}
function strings(value: unknown, max: number): string[] | undefined {
  if (!Array.isArray(value) || value.length > max) return undefined;
  return value.every((v): v is string => typeof v === "string")
    ? value
    : undefined;
}
/** A bounded list of known IDs that may not repeat. */
function ids(value: unknown, max: number, allowed: readonly string[]) {
  if (!Array.isArray(value) || value.length > max) return undefined;
  const out: string[] = [];
  for (const item of value) {
    if (!has(allowed, item) || out.includes(item)) return undefined;
    out.push(item);
  }
  return out;
}
function isTrace(value: unknown): value is Trace {
  if (!record(value)) return false;
  if (typeof value.id !== "string" || !value.id) return false;
  if (!Number.isInteger(value.tick) || (value.tick as number) < 0) return false;
  for (const key of ["actor", "provider", "model"])
    if (typeof value[key] !== "string") return false;
  if (value.status !== "ok" && value.status !== "error") return false;
  if (typeof value.latencyMs !== "number" || value.latencyMs < 0) return false;
  for (const key of [
    "inputTokens",
    "outputTokens",
    "tokensPerSecond",
    "attempts",
  ])
    if (
      typeof value[key] !== "number" ||
      !Number.isFinite(value[key] as number) ||
      (value[key] as number) < 0
    )
      return false;
  if (!Number.isInteger(value.attempts)) return false;
  if (
    value.costUsd !== undefined &&
    (typeof value.costUsd !== "number" ||
      !Number.isFinite(value.costUsd) ||
      value.costUsd < 0)
  )
    return false;
  for (const key of ["sourceId", "error", "action", "promptHash"])
    if (value[key] !== undefined && typeof value[key] !== "string") return false;
  return true;
}
function isAgent(value: unknown): value is Agent {
  if (!record(value)) return false;
  if (!has(AGENT_IDS, value.id)) return false;
  for (const key of [
    "name",
    "handle",
    "role",
    "bio",
    "style",
    "goal",
    "color",
    "initials",
    "belief",
  ])
    if (typeof value[key] !== "string") return false;
  if (!strings(value.knownFacts, 50)) return false;
  if (!strings(value.seen, 150)) return false;
  if (!has(STANCES, value.stance)) return false;
  if (!Number.isInteger(value.lastActive) || (value.lastActive as number) < 0)
    return false;
  if (!record(value.factBeliefs)) return false;
  if (
    !Object.entries(value.factBeliefs).every(
      ([key, stance]) => key.length <= 30 && has(STANCES, stance),
    )
  )
    return false;
  if (!record(value.relationships)) return false;
  if (
    !Object.values(value.relationships).every(
      (trust) => typeof trust === "number" && Number.isFinite(trust),
    )
  )
    return false;
  if (!Array.isArray(value.memories) || value.memories.length > 12)
    return false;
  return value.memories.every(
    (memory) =>
      record(memory) &&
      typeof memory.text === "string" &&
      memory.text.length <= 400 &&
      typeof memory.sourceId === "string" &&
      Number.isInteger(memory.tick) &&
      (memory.tick as number) >= 0,
  );
}
function isEvent(value: unknown): value is Event {
  if (!record(value)) return false;
  if (typeof value.id !== "string" || !value.id) return false;
  if (!Number.isInteger(value.tick) || (value.tick as number) < 0) return false;
  if (!has(EVENT_ACTORS, value.actor)) return false;
  if (!has(CHANNELS, value.channel)) return false;
  if (typeof value.text !== "string" || value.text.length > 4000) return false;
  if (!strings(value.factIds, 3)) return false;
  if (!has(ORIGINS, value.origin)) return false;
  if (value.stance !== undefined && !has(STANCES, value.stance)) return false;
  for (const key of [
    "to",
    "subject",
    "audioTranscript",
    "archivedAt",
    "sourceId",
  ]) {
    if (value[key] !== undefined && typeof value[key] !== "string")
      return false;
  }
  return !value.to || has([...AGENT_IDS, "visitor"] as const, value.to);
}

/**
 * Validate a world we are about to trust. Browser saves and uploaded save
 * files are untrusted input: one malformed account or event would otherwise
 * crash every window that reads it.
 */
export function isSavedWorld(value: unknown): value is World {
  if (!record(value)) return false;
  if (
    value.version !== 1 ||
    typeof value.storyId !== "string" ||
    !Number.isInteger(value.tick) ||
    (value.tick as number) < 0 ||
    !Number.isInteger(value.revision) ||
    (value.revision as number) < 0 ||
    !Number.isInteger(value.boots) ||
    (value.boots as number) < 0 ||
    (value.mode !== "live" && value.mode !== "baseline")
  )
    return false;
  if (!Array.isArray(value.agents) || value.agents.length !== AGENT_IDS.length)
    return false;
  if (!value.agents.every(isAgent)) return false;
  const agentIds = new Set((value.agents as Agent[]).map((agent) => agent.id));
  if (agentIds.size !== AGENT_IDS.length) return false;
  if (!Array.isArray(value.events) || value.events.length > 2000) return false;
  if (!value.events.every(isEvent)) return false;
  if (!ids(value.collected, 3, FACTS)) return false;
  if (!ids(value.published, 3, FACTS)) return false;
  if (value.played !== undefined && !ids(value.played, GAMES.length, GAMES))
    return false;
  if (!has(ENDINGS, value.ending)) return false;
  if (
    value.accused !== undefined &&
    !has(["mara", "len", "sysop"] as const, value.accused)
  )
    return false;
  // An exposed report always names someone; other endings must not imply one.
  if (value.ending === "exposed" && value.accused === undefined) return false;
  if (
    !Number.isInteger(value.remainingTurns) ||
    (value.remainingTurns as number) < 0 ||
    (value.remainingTurns as number) > 18
  )
    return false;
  if (typeof value.auto !== "boolean") return false;
  if (!Array.isArray(value.traces) || value.traces.length > 500) return false;
  if (!value.traces.every(isTrace)) return false;
  return typeof value.createdAt === "string";
}
