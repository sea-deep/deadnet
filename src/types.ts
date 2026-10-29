export type AgentId = 'mara' | 'len' | 'sysop';
export type Mode = 'live' | 'baseline';
export type Stance = 'accept' | 'deny' | 'question' | 'deflect';
export interface Memory { text: string; sourceId: string; tick: number; }
export interface Agent {
  id: AgentId; name: string; handle: string; role: string; bio: string; style: string; goal: string;
  color: string; initials: string; belief: string; knownFacts: string[]; memories: Memory[];
  relationships: Record<string, number>; seen: string[]; stance: Stance; lastActive: number;
}
export interface Event {
  id: string; tick: number; actor: AgentId | 'visitor' | 'system'; channel: 'feed' | 'mail' | 'system';
  to?: AgentId | 'visitor'; text: string; subject?: string; sourceId?: string; factIds: string[];
  origin: 'seed' | 'model' | 'visitor' | 'baseline' | 'system'; stance?: Stance;
}
export interface Evidence {
  id: string; title: string; filename: string; folder: string; date: string; excerpt: string;
  body: string; fact: string; locked?: boolean;
}
export interface Trace {
  id: string; tick: number; actor: string; provider: string; model: string; status: 'ok' | 'error';
  latencyMs: number; inputTokens: number; outputTokens: number; tokensPerSecond: number;
  sourceId?: string; attempts: number; error?: string; action?: string; promptHash?: string;
}
export interface World {
  version: 1; tick: number; revision: number; boots: number; mode: Mode; agents: Agent[];
  events: Event[]; collected: string[]; published: string[]; ending: 'open' | 'exposed' | 'sealed';
  remainingTurns: number; auto: boolean; traces: Trace[]; createdAt: string;
}
export interface Status { available: boolean; provider: string; model: string; message: string; voice: boolean; busy: boolean; }
export interface Snapshot { world: World; archive: Evidence[]; status: Status; }
export type Action =
 | {type:'tick'} | {type:'collect'; evidenceId:string}
 | {type:'message'; target:AgentId; text:string; evidenceId?:string}
 | {type:'publish'; evidenceId:string} | {type:'resolve'; choice:'exposed'|'sealed'}
 | {type:'mode'; mode:Mode} | {type:'auto'; enabled:boolean}
 | {type:'renew'} | {type:'reset'};
