# Research and architecture decisions — October 29, 2026

## Competition verification

Read the [live challenge](https://dev.to/challenges/hacktoberfest-week4-2026-10-26), [specific rules](https://dev.to/page/hacktoberfest-week4-2026-10-26-contest-rules), [general rules](https://dev.to/page/official-hackathon-rules), and linked submission template on October 29. The required template headings are What I Built, Demo, Code, How I Built It, Why Does Open Innovation Matter?, optional My Agent Session / The Spirit of It, and Prize Categories. Tags: `devchallenge`, `hf26challenge`. Writing quality has the highest weight. New project and repository must originate within October 26, 09:00 PDT–October 31, 23:59 PDT. Only the first entry is judged; user approval is required before publishing it. In India the deadline is November 1, 12:29 IST. Age/account/territorial eligibility belongs to the entrant; we do not assert it on their behalf. General rules govern in conflicts.

There are 20 partner tracks. Detailed comparisons appear in PARTNERS.md. No gateway tools for DevRelay were connected in this environment, so the live official pages and the [DevRelay challenge knowledge guide](https://devrelay.com/knowledge/dev-challenges) were used. Shell fetches of DEV HTML returned 403; the browser research tool could read the live pages. A DEV API list query ignored its unsupported slug filter; that result was discarded. It was not evidence for the challenge.

## Implementation precedents and derivative risk

| Precedent (inspected repository/docs) | What exists | Pattern useful here | DEADNET distinction / risk |
| --- | --- | --- | --- |
| [Generative Agents / Smallville](https://github.com/joonspk-research/generative_agents) | Agent memory, retrieval/reflection/planning, town interactions; research implementation with saved replay | Give agents scoped memories and motivations | DEADNET does not originate persistent-agent societies. Its mechanism is recoverable conflicting records, selective disclosure, finite rumor propagation, and a consequential ending. A town reskin would be derivative. No source code copied. |
| [AI Town](https://github.com/AITownFun/ai-town) | Persistent shared-world conversation engine using Convex and a game simulation | Separate simulation clock and transactional world updates from rendering | Three accounts share one SQLite world and one local model. Investigator controls disclosure, not every conversation. Not a general-purpose scalable town. No code copied. |
| [98.js](https://github.com/1j01/98) | Web desktop recreation, windows, menus, applications | Familiar overlapping-window grammar and taskbar restoration | A retro shell alone is not originality. DEADNET’s apps expose one causal society and evidence graph. Original drawings, styles, and sound; no Microsoft assets or copied OS code. |
| [React95](https://github.com/react95-io/React95) | Retro React components and themes | Authentic bevel/inset affordances | Evaluated, not installed: system-font/artwork provenance and theme coupling were unnecessary for this small authored interface. |
| [react-rnd](https://github.com/bokuweb/react-rnd) | MIT drag/resize primitive built on react-draggable and re-resizable | Reuse tested pointer/window behavior | Installed and credited. DEADNET implements focus, taskbar, keyboard moves, clamp, maximize, mobile mode, and application state above it. |
| [Hypnospace Outlaw](https://www.hypnospace.net/) | Authored alternate-internet investigation | A believable network can carry a mystery through documents and relationships | Important creative influence; no claim to invent haunted web archaeology. DEADNET differs in live local generative interpretations, model-selected disclosure, and inspectable causal records. No game content reused. |

Dead Internet Theory is a cultural premise, not an established factual account of the real web. The project makes no claim about actual deceased people, actual network populations, or a real catastrophe. All identities are original fiction.

## Diagnostic: why this needs a simulation

A roleplay prompt can produce eerie text. It does not by itself provide inspectable records, knowledge isolation, bounded causal propagation, restart persistence, or an irreversible public correction. DEADNET owns these in code.

Without messages from the visitor, explicit bounded autonomy rotates accounts and reacts to unseen public events or addressed mail. The model chooses acceptance/denial/deflection/questioning, a bounded trust change, a subjective memory, and a public/private destination. These outputs become the next event. One character can therefore affect another without another visitor message.

The durable change is the public record: publishing is irreversible within the story, and removes the option to pretend the evidence never appeared. A character can disbelieve a verified record. Knowing a fact and believing it are separate.

The memorable beat is Len rejecting a carrier log after Mara chose to pass it to him: an external record says nobody called; his memory says his mother did. This is a designed possibility, not a guaranteed model performance. A deterministic baseline gives a reproducible comparison and is labeled as scripted.

Repeat sessions can differ through chosen recipients, timing, model destinations, stance, trust changes, and the ending. This is bounded emergence, not an unbounded or scientifically validated society. With mediocre model text, archive comparison and consequences still work, but the dramatic quality can suffer.

## Stack and model decision

TypeScript throughout; React/Vite presentation; Node >=22.13 server; built-in node:sqlite with a versioned schema; Zod validates decisions and incoming actions. One process, one serial generation. No orchestration framework or vector database is needed for three agents with eight in-prompt memories each. SQLite snapshot commits are atomic, and revisions capture action provenance. A full event log is capped rather than silently growing forever.

[Gemma 4 model card](https://ai.google.dev/gemma/docs/core/model_card_4) identifies E2B as 2.3B effective / 5.1B total with embeddings, Apache-2.0 licensed, with native system prompts. [Ollama tags](https://ollama.com/library/gemma4/tags) expose explicit quantizations. The generic E2B tag on this Mac selected a 7.5 GB MLX download; we canceled it and chose `gemma4:e2b-it-q4_K_M` explicitly. Model identity and actual metadata must come from the installed runner. E4B/12B leave less 16 GB headroom; 26B/31B are not a sensible default here. Gemma 3 4B remains a compatible alternative, not the current family.

Ollama was selected for JSON-schema constrained output, local HTTP, hardware integration, metadata/token timings, and a straightforward installer. LM Studio was already installed and serving a different model; it was left alone. A local OpenAI-compatible adapter supports LM Studio/llama.cpp as alternatives. MLX is attractive for Apple Silicon but adds model-format specific concerns; it was not independently benchmarked. No invented comparisons between runtimes.

4096 configured context; 320 generated tokens per request; two attempts max for invalid output; 45-second request timeout; one in-flight turn; 18 turns per explicit allowance. Core inference has no paid API calls. Prompt contains one account’s personality, eight recent subjective memories, known records, peer trust, three seen public posts, and one incoming event. No global private conversation history or objective hidden archive is supplied.

## Community experience consulted

[Recall-sqlite’s author](https://dev.to/jnocode/i-built-a-memory-system-for-ai-agents-that-actually-forgets-2i20) describes the problems of indefinite memory accumulation and a SQLite-based alternative. This is first-person implementation experience, not a benchmark we reproduced. It supported keeping the small society’s memory bounded and explicit rather than adding a cloud memory service. DEADNET uses a simpler recent-memory window, not that project’s tiering algorithm or code.

## Scope intentionally cut

No autonomous tool execution, live real internet, 100-agent swarm, cloud inference proxy, user registration, arbitrary filesystem access, external messaging, vector database, or copied creepypasta. The static public exhibition runs the same rules with a clearly labeled deterministic adapter; it must never be called live local AI. The local build is the full generative experience. A genuine local recording supplies evidence for judges who do not install a model.
