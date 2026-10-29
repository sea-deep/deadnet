export type AgentId = "mara" | "len" | "sysop" | "nora";
export type Mode = "live" | "baseline";
export type Stance = "accept" | "deny" | "question" | "deflect";
export interface Memory {
  text: string;
  sourceId: string;
  tick: number;
}
export interface Agent {
  id: AgentId;
  name: string;
  handle: string;
  role: string;
  bio: string;
  style: string;
  goal: string;
  color: string;
  initials: string;
  belief: string;
  knownFacts: string[];
  factBeliefs: Record<string, Stance>;
  memories: Memory[];
  relationships: Record<string, number>;
  seen: string[];
  stance: Stance;
  lastActive: number;
}
export interface Event {
  id: string;
  tick: number;
  actor: AgentId | "visitor" | "system";
  channel: "feed" | "mail" | "system";
  to?: AgentId | "visitor";
  text: string;
  subject?: string;
  audioTranscript?: string;
  archivedAt?: string;
  sourceId?: string;
  factIds: string[];
  origin: "seed" | "model" | "visitor" | "baseline" | "system";
  stance?: Stance;
}
export interface Evidence {
  id: string;
  title: string;
  filename: string;
  folder: string;
  date: string;
  excerpt: string;
  body: string;
  fact: string;
  locked?: boolean;
}
export interface Trace {
  id: string;
  tick: number;
  actor: string;
  provider: string;
  model: string;
  status: "ok" | "error";
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  tokensPerSecond: number;
  costUsd?: number;
  sourceId?: string;
  attempts: number;
  error?: string;
  action?: string;
  promptHash?: string;
}
export interface World {
  version: 1;
  storyId?: string;
  tick: number;
  revision: number;
  boots: number;
  mode: Mode;
  agents: Agent[];
  events: Event[];
  collected: string[];
  /** Nora's games the visitor has played; their saves repair CASE_14.BAK. */
  played?: string[];
  published: string[];
  ending: "open" | "exposed" | "sealed";
  accused?: Exclude<AgentId, "nora">;
  remainingTurns: number;
  auto: boolean;
  traces: Trace[];
  createdAt: string;
}
export interface Status {
  available: boolean;
  provider: string;
  model: string;
  message: string;
  quota?: {
    globalUsed: number;
    globalLimit: number;
    visitorUsed: number;
    visitorLimit: number;
  };
  voice: boolean;
  busy: boolean;
}
export interface Snapshot {
  world: World;
  archive: Evidence[];
  status: Status;
}
export type Action =
  | { type: "tick" }
  | { type: "collect"; evidenceId: string }
  | { type: "message"; target: AgentId; text: string; evidenceId?: string }
  | { type: "publish"; evidenceId: string }
  | {
      type: "resolve";
      choice: "exposed" | "sealed";
      suspect?: Exclude<AgentId, "nora">;
    }
  | { type: "mode"; mode: Mode }
  | { type: "played"; game: string }
  | { type: "auto"; enabled: boolean }
  | { type: "renew" }
  | { type: "reset" };
