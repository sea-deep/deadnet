import type { Agent, Event, World } from "../src/types.ts";
/** Secrets exist in the world, but are supplied to the actor only when relevant to a witnessed record. */
export function disclosableFacts(
  agent: Agent,
  source: Event,
  world: World,
): string[] {
  if (agent.id !== "sysop") return agent.knownFacts;
  return agent.knownFacts.filter(
    (id) =>
      source.factIds.includes(id) ||
      world.events.some(
        (e) => agent.seen.includes(e.id) && e.factIds.includes(id),
      ),
  );
}
