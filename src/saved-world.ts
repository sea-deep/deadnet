import type { Agent, Event, World } from "./types";

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
  if (typeof value.text !== "string") return false;
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
  if (!strings(value.collected, 3)) return false;
  if (!strings(value.published, 3)) return false;
  if (value.played !== undefined) {
    const played = strings(value.played, GAMES.length);
    if (!played || !played.every((game) => has(GAMES, game))) return false;
  }
  if (!has(ENDINGS, value.ending)) return false;
  if (
    value.accused !== undefined &&
    !has(["mara", "len", "sysop"] as const, value.accused)
  )
    return false;
  if (
    !Number.isInteger(value.remainingTurns) ||
    (value.remainingTurns as number) < 0 ||
    (value.remainingTurns as number) > 18
  )
    return false;
  if (typeof value.auto !== "boolean") return false;
  if (!Array.isArray(value.traces) || value.traces.length > 500) return false;
  if (!value.traces.every(record)) return false;
  return typeof value.createdAt === "string";
}
