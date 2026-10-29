import type { Action, Agent, AgentId, Event, World } from "../src/types.ts";
import { disclosableFacts } from "./knowledge.ts";
import { ARCHIVE, seedWorld } from "./seed.ts";
import { BaselineModel } from "./baseline.ts";
import { DecisionSchema } from "./decision.ts";
import type { ModelAdapter } from "./model.ts";
export interface Persistence {
  load(): World;
  save(world: World, action: string): void;
  reset(world: World): void;
}
export class RuleError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const ids = ["mara", "len", "sysop"] as const;
export class Engine {
  busy = false;
  private baseline = new BaselineModel();
  constructor(
    public store: Persistence,
    public model: ModelAdapter,
  ) {}
  world() {
    return this.store.load();
  }
  boot() {
    const w = this.world();
    w.boots++;
    w.revision++;
    if (w.boots > 1)
      this.event(w, {
        actor: "system",
        channel: "system",
        text: `Investigator reconnected. Visit ${w.boots}. Previous discoveries and memories restored.`,
        origin: "system",
      });
    this.store.save(w, "boot");
  }
  private event(
    w: World,
    e: Omit<Event, "id" | "tick" | "factIds"> & { factIds?: string[] },
  ): Event {
    const event: Event = {
      ...e,
      id: crypto.randomUUID(),
      tick: w.tick,
      factIds: e.factIds || [],
    };
    w.events.push(event);
    return event;
  }
  private remember(a: Agent, e: Event, text = e.text) {
    a.memories.push({ text: text.slice(0, 180), sourceId: e.id, tick: e.tick });
    a.memories = a.memories.slice(-12);
    a.knownFacts = [...new Set([...a.knownFacts, ...e.factIds])];
    a.seen = [...new Set([...a.seen, e.id])].slice(-150);
  }
  private evidence(w: World, id: string) {
    const e = ARCHIVE.find((e) => e.id === id);
    if (!e) throw new RuleError("Unknown archive record.");
    if (e.locked && w.collected.filter((id) => id !== "manifest").length < 2)
      throw new RuleError(
        "Recover the two earlier records to reconstruct this file.",
      );
    return e;
  }
  private sourceFor(w: World, a: Agent): Event {
    const eligible = w.events.filter(
      (e) =>
        e.actor !== a.id &&
        !a.seen.includes(e.id) &&
        ((e.channel === "mail" && e.to === a.id) || e.channel === "feed"),
    );
    const mail = eligible.find((e) => e.channel === "mail");
    return (
      mail ||
      eligible.find((e) => e.factIds.some((f) => !a.knownFacts.includes(f))) ||
      eligible.at(-1) || {
        id: `routine-${w.tick}`,
        tick: w.tick,
        actor: "system",
        channel: "system",
        text: "The room is quiet. Continue your routine, or reflect on what you remember. Do not invent evidence.",
        factIds: [],
        origin: "system",
      }
    );
  }
  async turn(w: World, forced?: AgentId, source?: Event) {
    if (w.remainingTurns <= 0)
      throw new RuleError(
        "Turn allowance used. Renew 18 turns in System Monitor.",
        409,
      );
    const waiting = w.agents.find((a) =>
      w.events.some(
        (e) => e.channel === "mail" && e.to === a.id && !a.seen.includes(e.id),
      ),
    );
    const agent = w.agents.find(
      (a) =>
        a.id ===
        (forced ||
          waiting?.id ||
          [...w.agents].sort((a, b) => a.lastActive - b.lastActive)[0].id),
    )!;
    const incoming = source || this.sourceFor(w, agent);
    // Knowledge becomes available only when the addressed account actually reads it.
    if (!w.events.some((e) => e.id === incoming.id)) w.events.push(incoming);
    const draft = structuredClone(w);
    const reader = draft.agents.find((a) => a.id === agent.id)!;
    this.remember(reader, incoming);
    w.tick++;
    w.remainingTurns--;
    try {
      const generator = w.mode === "baseline" ? this.baseline : this.model;
      const generated = await generator.generate({
        agent: reader,
        source: incoming,
        world: draft,
      });
      const d = DecisionSchema.parse(generated.decision);
      if (d.shareWith === reader.id)
        throw new Error("Cannot deliver a message to self.");
      const allowed = disclosableFacts(reader, incoming, draft);
      if (d.factIds.some((id) => !allowed.includes(id)))
        throw new Error(
          "Model tried to disclose evidence it has not witnessed.",
        );
      agent.knownFacts = reader.knownFacts;
      agent.seen = reader.seen;
      agent.memories = reader.memories;
      agent.stance = d.stance;
      agent.factBeliefs ??= {};
      for (const id of [...incoming.factIds, ...d.factIds])
        agent.factBeliefs[id] = d.stance;
      agent.lastActive = w.tick;
      const old = agent.relationships[incoming.actor] || 0;
      if (incoming.actor !== "system")
        agent.relationships[incoming.actor] = Math.min(
          10,
          Math.max(-10, old + d.trustDelta),
        );
      const sharedFacts = [...new Set(d.factIds)];
      const privateTarget = ids.includes(d.shareWith as AgentId)
        ? (d.shareWith as AgentId)
        : undefined;
      // An agent may choose to publicize a private rumor. This is an explicit, traced model decision.
      const isPrivate =
        privateTarget ||
        (incoming.channel === "mail" && d.shareWith === "none");
      const target =
        privateTarget ||
        (incoming.actor === "visitor"
          ? "visitor"
          : ids.includes(incoming.actor as AgentId)
            ? (incoming.actor as AgentId)
            : undefined);
      const e = this.event(w, {
        actor: agent.id,
        channel: isPrivate && target ? "mail" : "feed",
        to: isPrivate ? target : undefined,
        text: d.text,
        subject: isPrivate
          ? "Re: " + (incoming.subject || "A quiet word")
          : undefined,
        sourceId: incoming.id,
        factIds: sharedFacts,
        origin: w.mode === "baseline" ? "baseline" : "model",
        stance: d.stance,
      });
      this.remember(agent, e, d.memory);
      w.traces.push({
        ...generated.trace,
        id: crypto.randomUUID(),
        actor: agent.id,
        tick: w.tick,
      });
      if (w.tick === 2)
        this.event(w, {
          actor: "sysop",
          channel: "mail",
          to: "visitor",
          text: "Your connection has been logged. Some recovered files describe the people who remain here. A record can be true and still do harm.\n\nIf you recover CONTINUITY.INI, the choice to release it is yours.",
          subject: "A note about recovered files",
          origin: "system",
        });
    } catch (error) {
      if (error instanceof RuleError && error.status === 429) {
        const saved = this.world();
        saved.auto = false;
        saved.revision++;
        this.store.save(saved, "quota-pause");
        throw error;
      }
      w.traces.push({
        ...((error as { trace?: object }).trace || {
          provider: this.model.name,
          model: this.model.model,
          status: "error" as const,
          latencyMs: 0,
          inputTokens: 0,
          outputTokens: 0,
          tokensPerSecond: 0,
          attempts: 1,
          error: error instanceof Error ? error.message : "Generation failed",
        }),
        id: crypto.randomUUID(),
        tick: w.tick,
        actor: agent.id,
        sourceId: incoming.id,
      } as World["traces"][number]);
      this.event(w, {
        actor: "system",
        channel: "system",
        text: `${agent.name} could not respond. Generation failed; incoming information remains unread. Retry a turn or check System Monitor.`,
        sourceId: incoming.id,
        origin: "system",
      });
    }
    w.traces = w.traces.slice(-200);
    // Finite scene history: SQLite revisions retain provenance; in-prompt memory stays bounded.
    if (w.remainingTurns === 0) w.auto = false;
  }
  async dispatch(action: Action): Promise<World> {
    if (this.busy)
      throw new RuleError(
        "A local generation is already in progress. Please wait.",
        409,
      );
    this.busy = true;
    try {
      let w = this.world();
      if (w.events.length >= 980 && action.type !== "reset")
        throw new RuleError(
          "Story history reached its limit. Export and start a new investigation.",
          409,
        );
      switch (action.type) {
        case "tick":
          await this.turn(w);
          break;
        case "collect": {
          const e = this.evidence(w, action.evidenceId);
          if (!w.collected.includes(e.id)) {
            w.collected.push(e.id);
            if (
              e.id === "birthday" &&
              !w.events.some((event) => event.audioTranscript)
            )
              this.event(w, {
                actor: "sysop",
                channel: "mail",
                to: "visitor",
                subject: "LINE03.WAV / recovered attachment",
                text: "Routine status report attached. Distribution: restricted.",
                audioTranscript:
                  "Len's mother did not call. There has not been a call in fifty years. I keep the line open because he still asks if someone is there. I don't know if it is crueler to answer, or to let it ring.",
                origin: "system",
              });
            this.event(w, {
              actor: "system",
              channel: "system",
              text: `Opened ${e.filename}. No accounts notified.`,
              origin: "system",
            });
          }
          break;
        }
        case "message": {
          if (w.remainingTurns <= 0)
            throw new RuleError(
              "Renew the turn allowance in System Monitor first.",
              409,
            );
          const text = action.text.trim();
          if (!text || text.length > 1000)
            throw new RuleError("Messages must contain 1–1000 characters.");
          let factIds: string[] = [];
          let attachment = "";
          if (action.evidenceId) {
            const e = this.evidence(w, action.evidenceId);
            if (!w.collected.includes(e.id))
              throw new RuleError("Recover this file before sharing it.");
            factIds = [e.id];
            attachment = `\n\n[Attached evidence: ${e.filename}] ${e.fact}`;
          }
          const source = this.event(w, {
            actor: "visitor",
            channel: "mail",
            to: action.target,
            text: text + attachment,
            subject: "A quiet word",
            factIds,
            origin: "visitor",
          });
          await this.turn(w, action.target, source);
          break;
        }
        case "publish": {
          const e = this.evidence(w, action.evidenceId);
          if (w.ending === "sealed")
            throw new RuleError(
              "The archive is sealed. Start a new investigation to choose differently.",
              409,
            );
          if (!w.collected.includes(e.id))
            throw new RuleError("Recover this file before publishing it.");
          if (!w.published.includes(e.id)) {
            w.published.push(e.id);
            this.event(w, {
              actor: "visitor",
              channel: "feed",
              text: `I recovered ${e.filename}. ${e.fact}`,
              factIds: [e.id],
              origin: "visitor",
            });
          }
          break;
        }
        case "resolve": {
          if (w.ending !== "open")
            throw new RuleError(
              "This investigation already has an ending.",
              409,
            );
          if (!w.collected.includes("manifest"))
            throw new RuleError(
              "Recover the continuity manifest before deciding.",
            );
          if (action.choice === "sealed" && w.published.length)
            throw new RuleError(
              "Evidence already entered the public record. It cannot be taken back.",
            );
          w.ending = action.choice;
          w.auto = false;
          if (action.choice === "exposed") {
            for (const e of ARCHIVE)
              if (!w.published.includes(e.id)) {
                w.published.push(e.id);
                this.event(w, {
                  actor: "visitor",
                  channel: "feed",
                  text: `Public record: ${e.fact}`,
                  factIds: [e.id],
                  origin: "visitor",
                });
              }
          }
          this.event(w, {
            actor: "system",
            channel: "system",
            text:
              action.choice === "exposed"
                ? "The correction is permanent. Everyone can read it now. What they believe is still their own."
                : "The archive is sealed against public release. Private memories remain. The morning continues.",
            origin: "system",
          });
          this.event(w, {
            actor: "mara",
            channel: "mail",
            to: "visitor",
            subject:
              action.choice === "exposed"
                ? "They are still answering"
                : "A copy, just in case",
            text:
              action.choice === "exposed"
                ? "you told them. i don’t know if it was kind.\n\nlen is still here. that has to count for something.\n\nadvance the network to hear what they make of it."
                : "i kept a copy. i think you knew i would.\n\nwe can let him have this morning.\n\n— m",
            origin: "system",
          });
          break;
        }
        case "mode":
          w.mode = action.mode;
          w.auto = false;
          this.event(w, {
            actor: "system",
            channel: "system",
            text:
              action.mode === "baseline"
                ? "Deterministic baseline selected. All new responses are authored fixtures; no AI generation."
                : "Live local model selected. No scripted replacement if inference fails.",
            origin: "system",
          });
          break;
        case "auto":
          w.auto = action.enabled && w.remainingTurns > 0;
          break;
        case "renew":
          w.remainingTurns = 18;
          break;
        case "reset":
          w = seedWorld(w.mode);
          this.store.reset(w);
          return w;
      }
      w.revision++;
      this.store.save(w, action.type);
      return w;
    } finally {
      this.busy = false;
    }
  }
}
