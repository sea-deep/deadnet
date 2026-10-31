import {
  span,
  rejectActiveTrace,
  modelAttributes,
  safeModelName,
} from "./telemetry.ts";
import type { Action, Agent, AgentId, Event, World } from "../src/types.ts";
import { disclosableFacts } from "./knowledge.ts";
import { ARCHIVE, seedWorld, VOICEMAIL } from "./seed.ts";
import { BaselineModel } from "./baseline.ts";
import { DecisionSchema } from "./decision.ts";
import { caseProgress, GAME_NAMES, readyToReport } from "../src/rules.ts";
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
const ids: readonly AgentId[] = ["mara", "len", "sysop", "nora"];
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
    if (e.locked && !caseProgress(w).unlocked)
      throw new RuleError("This item is not available.");
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
    const waiting = w.agents
      .filter((a) => a.id !== "nora")
      .find((a) =>
        w.events.some(
          (e) =>
            e.channel === "mail" && e.to === a.id && !a.seen.includes(e.id),
        ),
      );
    const agent = w.agents.find(
      (a) =>
        a.id ===
        (forced ||
          waiting?.id ||
          w.agents
            .filter((a) => a.id !== "nora")
            .sort((a, b) => a.lastActive - b.lastActive)[0].id),
    )!;
    const incoming = source || this.sourceFor(w, agent);
    // Knowledge becomes available only when the addressed account actually reads it.
    if (!w.events.some((e) => e.id === incoming.id)) w.events.push(incoming);
    const draft = structuredClone(w);
    const reader = draft.agents.find((a) => a.id === agent.id)!;
    this.remember(reader, incoming);
    const before = { tick: w.tick, remainingTurns: w.remainingTurns };
    w.tick++;
    w.remainingTurns--;
    try {
      const allowed = span(
        {
          name: "scope_evidence",
          op: "gen_ai.execute_tool",
          attributes: {
            "gen_ai.operation.name": "execute_tool",
            "gen_ai.tool.name": "scope_evidence",
            "gen_ai.agent.name": agent.id,
          },
        },
        () => disclosableFacts(reader, incoming, draft),
      );
      const generator = w.mode === "baseline" ? this.baseline : this.model;
      const fixture =
        w.mode === "baseline" ||
        !["openrouter", "ollama", "local"].includes(generator.name);
      const generated = await span(
        {
          name: fixture ? "fixture_response" : "chat model",
          op: fixture ? "gen_ai.execute_tool" : "gen_ai.chat",
          attributes: {
            ...modelAttributes(generator.name, generator.model, fixture),
            "gen_ai.agent.name": agent.id,
          },
        },
        async (modelSpan) => {
          const result = await generator.generate({
            agent: reader,
            source: incoming,
            world: draft,
          });
          modelSpan.setAttribute(
            "gen_ai.response.model",
            safeModelName(result.trace.model, fixture),
          );
          modelSpan.setAttribute(
            "gen_ai.usage.input_tokens",
            result.trace.inputTokens,
          );
          modelSpan.setAttribute(
            "gen_ai.usage.output_tokens",
            result.trace.outputTokens,
          );
          return result;
        },
      );
      const d = span(
        {
          name: "validate_reply",
          op: "gen_ai.execute_tool",
          attributes: {
            "gen_ai.operation.name": "execute_tool",
            "gen_ai.tool.name": "validate_reply",
            "gen_ai.agent.name": agent.id,
          },
        },
        () => {
          const decision = DecisionSchema.parse(generated.decision);
          if (agent.id === "nora" && decision.shareWith !== "none")
            throw new Error(
              "The private signal cannot broadcast or contact other accounts.",
            );
          if (decision.shareWith === reader.id)
            throw new Error("Cannot deliver a message to self.");
          if (decision.factIds.some((id) => !allowed.includes(id)))
            throw new Error(
              "Model tried to disclose evidence it has not witnessed.",
            );
          return decision;
        },
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
          text: "Adam. Mara tells me she gave you the computer. Please leave Nora’s things with her family. There is nothing to be gained by going through her messages.",
          subject: "A note about recovered files",
          origin: "system",
        });
    } catch (error) {
      rejectActiveTrace();
      if (error instanceof RuleError && error.status === 429) {
        const saved = this.world();
        saved.auto = false;
        saved.revision++;
        this.store.save(saved, "quota-pause");
        throw error;
      }
      // A failed generation did not advance the story. Refund the turn so a
      // flaky provider does not silently eat the visitor's allowance.
      w.tick = before.tick;
      w.remainingTurns = before.remainingTurns;
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
    if (action.type !== "message" && action.type !== "tick")
      return this.dispatchInternal(action);
    const agent =
      action.type === "message" && ids.includes(action.target)
        ? action.target
        : "resident";
    return span(
      {
        name: `invoke_agent ${agent}`,
        op: "gen_ai.invoke_agent",
        attributes: {
          "gen_ai.operation.name": "invoke_agent",
          "gen_ai.agent.name": agent,
        },
      },
      () => this.dispatchInternal(action),
    );
  }
  private async dispatchInternal(action: Action): Promise<World> {
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
                actor: "system",
                channel: "mail",
                to: "visitor",
                subject: "Your missed call · Nora",
                text: "Recovered outgoing call: Nora Vale to Adam Moore. 31 October, 03:14. The last three seconds are missing.",
                audioTranscript: VOICEMAIL,
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
          if (
            action.target === "nora" &&
            w.ending === "exposed" &&
            w.accused === "sysop"
          )
            throw new RuleError("This connection has closed.", 410);
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
          if (!readyToReport(w))
            throw new RuleError(
              "Save the three items in the USB casebook and show Nora one of them before drawing a conclusion.",
            );
          if (action.choice === "exposed") {
            if (!action.suspect || !action.motive || !action.method)
              throw new RuleError(
                "Choose a person, a motive and a way into the room.",
              );
            if (
              action.suspect !== "sysop" ||
              action.motive !== "inspections" ||
              action.method !== "spare-key"
            ) {
              this.event(w, {
                actor: "nora",
                channel: "mail",
                to: "visitor",
                subject: "The pieces don’t fit",
                text:
                  action.suspect !== "sysop"
                    ? "that doesn’t fit what you found. who asked to come to my room? and who had already gone home?"
                    : action.motive !== "inspections"
                      ? "it wasn’t the rent. think about what i wanted to send in the morning."
                      : "i didn’t open the door. the photograph... i wrote something under it. read it again?",
                origin: "system",
              });
              this.event(w, {
                actor: "system",
                channel: "system",
                text: "Theory incomplete. The case remains open; you can revise your conclusion.",
                origin: "system",
              });
              break;
            }
          }
          if (action.choice === "sealed" && w.published.length)
            throw new RuleError(
              "Evidence already entered the public record. It cannot be taken back.",
            );
          w.ending = action.choice;
          if (action.choice === "exposed") w.accused = action.suspect!;
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
                ? `Case 14 evidence published. Report names ${w.agents.find((a) => a.id === w.accused)?.name} as suspect. The record is permanent; the resident accounts can now read it.`
                : "Case 14 kept private. The public record still calls Nora’s death an accident.",
            origin: "system",
          });
          this.event(w, {
            actor: "mara",
            channel: "mail",
            to: "visitor",
            subject:
              action.choice === "exposed"
                ? "Nora’s name"
                : "A copy, just in case",
            text:
              action.choice === "exposed"
                ? "i printed her name properly this time. NORA VALE. not “the woman in 317”.\n\nlen has stopped checking the bus timetable. i think that’s something.\n\n— m"
                : "i kept a copy. i think you knew i would.\n\nsomebody still has to remember what happened in that room.\n\n— m",
            origin: "system",
          });
          this.event(w, {
            actor: "nora",
            channel: "mail",
            to: "visitor",
            subject: "",
            text:
              action.choice === "exposed"
                ? w.accused === "sysop"
                  ? "the green lamp went out.\n\ni can hear the rain now.\n\nthank you."
                  : "that wasn’t the hand i remember.\n\ni’m still here."
                : "please don’t turn it off.",
            origin: "system",
          });
          break;
        }
        case "played": {
          const played = (w.played ||= []);
          if (!played.includes(action.game)) {
            played.push(action.game);
            this.event(w, {
              actor: "system",
              channel: "system",
              text: `Played ${GAME_NAMES[action.game] ?? action.game}.`,
              origin: "system",
            });
          }
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
      if (action.type === "message" || action.type === "tick") {
        span(
          {
            name: "persist",
            op: "gen_ai.execute_tool",
            attributes: {
              "gen_ai.operation.name": "execute_tool",
              "gen_ai.tool.name": "persist",
              "gen_ai.agent.name":
                action.type === "message" && ids.includes(action.target)
                  ? action.target
                  : "resident",
            },
          },
          () => this.store.save(w, action.type),
        );
      } else this.store.save(w, action.type);
      return w;
    } finally {
      this.busy = false;
    }
  }
}
