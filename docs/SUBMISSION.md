---
title: "DEADNET: Three Accounts Are Still Waiting for Someone to Come Back"
published: false
tags: devchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 4: Ghost in the Machine](https://dev.to/challenges/hacktoberfest-week4-2026-10-26).*

## What I Built

Len says his mother called this morning. It is his twenty-ninth birthday. He has coffee, a night shift, and friends to talk to.

The network log says the last outside connection ended fifty years ago.

**DEADNET is a fictional abandoned computer with three persistent AI characters.** Mara keeps an archive. Len keeps an ordinary routine. The operator keeps both of them connected. You can read their correspondence, recover old records, and decide whom to tell. Each character can interpret what you send, doubt it, remember it, or pass it to somebody else.

That last part is the project’s center. Sending a file privately changes who can know it. What happens after that depends partly on the recipient. Your careful disclosure can become somebody else’s rumor.

I interpreted the theme through a network that preserved conversations after losing the people who made them. All characters are fictional. This project does not imitate a real deceased person or claim to recreate a consciousness.

## Demo

[Open the interactive exhibition](https://sea-deep.github.io/deadnet/).

**The public exhibition is explicitly labeled as scripted.** It uses the same state engine with deterministic responses, so anyone can explore the computer without installing weights or spending API credit. It is not evidence of live inference.

The [full local application](https://github.com/sea-deep/deadnet#run) runs real Gemma through Ollama and also supports server-side OpenRouter. The repository contains actual model transcripts, timing results and request evidence. The free OpenRouter pool was throttled during the final check, so I am not presenting it as a reliable public live-AI deployment.

![The abandoned desktop, with the forest photograph and ordinary shortcuts](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/evidence/desktop-new.png)

Power on, open Inbox, and read Mara’s message. My Documents has an ordinary Send To menu. Try sending CARRIER.LOG privately before deciding whether to share anything publicly. Notepad contains someone’s unfinished scraps; it also saves whatever you write.

![The mailbox uses an ordinary folder list, message table and reading pane](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/evidence/mail.png)

The desktop has a BIOS startup, a clock stuck at 03:17, a sourced forest wallpaper, quiet horror ambience, and six credited games. The computer should feel usable before it starts feeling wrong. There is no demo video; the interactive build, screenshots and reproducible evidence are the demonstration.

## Code

[sea-deep/deadnet on GitHub](https://github.com/sea-deep/deadnet) — new repository started October 29, 2026. Application code is MIT. Third-party code and media retain their own licenses.

The interface adapts [98.css](https://github.com/jdan/98.css). The games are existing MIT projects, separately credited in the game window and [pinned-source inventory](https://github.com/sea-deep/deadnet/blob/main/docs/THIRD-PARTY.md). I did not build Snake, Tetris, 2048, Flappy Bird, Phantomicus or Hocus :focus from scratch. They are the distractions on this computer, not the AI contribution.

Visual references included actual Yahoo 1998 and Netscape Communicator mailbox screenshots. W95FA/VT323, Fugue PNG icons, Sebastian Unrau’s forest photograph and techiew’s CC0 horror ambience are all [credited](https://github.com/sea-deep/deadnet/blob/main/docs/CREDITS.md). No generated illustration stands in for the wallpaper.

Hypnospace Outlaw, 98.js, Generative Agents and AI Town are precedents. DEADNET does not claim to invent haunted desktops or persistent agent societies. Its particular question is smaller: **what happens when you decide who gets to know that their own memory is false?**

## How I Built It

React and Vite render the computer. A Node service owns a SQLite world. Three character records share one model, while keeping separate memories, relationships and knowledge.

A turn has a deliberately narrow shape:

1. The engine selects an account and a message that account can actually read.
2. A bounded prompt supplies its memories, relationships and witnessed records.
3. Gemma proposes a reply, stance, trust change, subjective memory, disclosed record IDs and destination.
4. The engine validates the proposal and commits the resulting events atomically.
5. A later recipient can read that event and respond in its own turn.

The model does not write SQL, browse the real internet, run commands, or rewrite the objective history. Those boundaries keep the investigation coherent. The archived catastrophe and final choice are authored; the interpretations and disclosure path can vary.

### The bug that made the mystery too easy

The operator initially knew protected administrative facts and volunteered a secret before the visitor had found the relevant file. A valid JSON response had still ruined the story.

I changed the prompt boundary. Protected records are withheld until witnessed evidence introduces them. Local constrained decoding limits available record IDs for each account; server validation rejects anything outside that account’s actual knowledge. The earlier failed transcript remains alongside the corrected run.

This distinction matters: schema validity is not narrative validity. The model can still misunderstand a sentence or reverse who said something. Tests cover the state boundaries rather than claiming to eliminate every hallucination.

### Memory with a limit

Each account stores twelve recent subjective memories. Eight enter the prompt, alongside three exact recent visitor disclosures for recall. Objective known facts and relationships persist separately. The whole conversation does not grow into an unlimited prompt.

A [developer’s account of bounded SQLite agent memory](https://dev.to/jnocode/i-built-a-memory-system-for-ai-agents-that-actually-forgets-2i20) was a useful community reference. My application measurements below are my own; I am not adopting that article’s results as a benchmark.

In the real society check, a private silver-apricot disclosure appeared in Len’s prompt and stayed out of the others’. Len recalled the item, although he sometimes reversed the speaker. A deterministic engine test separately forces a Mara-to-Len rumor path and verifies that the consequence survives reopening the database. That repeatable test and an unconstrained live model run answer different questions.

### What it actually cost to run

Measured on an Apple M5 with 16 GiB unified memory, using `gemma4:e2b-it-q4_K_M` through Ollama:

| Measurement | Observed result |
| --- | --- |
| Initial nine generations | 9 successful; first request 7.370 s |
| Warm nine generations | 9 successful; median 1.635 s, maximum 2.280 s |
| Warm token totals | 7,155 input / 677 output |
| Model process physical footprint | About 5.1 GiB, measured with macOS vmmap |
| Actual five-minute session | 11 model turns, 12,712 input / 865 output, zero failed turns |
| Paid LLM requests in that local session | Zero |

The runner’s allocation metadata underreported the process footprint; the OS measurement is the useful number. The five-minute check blocked external fetches in its process. It was not a system-wide Wi-Fi-off experiment. Electricity and hardware costs were not measured.

Hosted inference has a different boundary. An earlier three-turn paid Gemma 4 31B smoke test reported **$0.00043855** in usage fields. After restricting the adapter to free routes, Gemma’s shared upstream pool returned HTTP 429. That is not a successful free inference result. The service now persists a cooldown, caps attempts per minute/day and rejects paid model IDs. Resetting the fictional world cannot reset those limits.

The [verification record](https://github.com/sea-deep/deadnet/blob/main/docs/VERIFICATION.md) links the actual JSON evidence, digest and memory report. Sixteen Node tests and four desktop/mobile browser scenarios pass. A separate browser pass starts all six games and checks Hocus reaching level two, with no page errors. That last check caught a surprisingly ordinary horror: a game iframe had been falling through the app server’s routing and opening another copy of the desktop. Explicit game entrypoints fixed it.

### A voice that changes the record

The operator’s written attachment is a routine status report. The ElevenLabs recording admits that no one has called Len in fifty years, and that the operator keeps the line open because Len still asks whether someone is there.

This is a specific authored voicemail rendered with the premade Daniel voice, not improvised voice chat. Its full transcript remains readable. One real 192-character render took **1.062 seconds**; replay returned identical cached bytes without another generation request. The immediate billing counter was unchanged, which does not establish a zero invoice charge. Cache keys include text, voice and model; concurrent duplicates share one request.

## Why Does Open Innovation Matter?

The project is about a service that outlived the people who depended on it. Requiring an irreplaceable remote model to keep its inhabitants alive would be an awkward foundation.

With open weights, the measured version runs on the laptop after setup. Its private conversations and memories can remain there. The model, prompt, validation rules and memory policy can be inspected or changed independently. The optional hosted transport is a convenience for a different deployment, while the local route remains reproducible when a shared free provider is busy.

This does not mean all inference is free, that the model is flawless, or that an offline laptop makes a character a person. It means the project can preserve its behavior without being entirely dependent on one remote service’s continued availability.

There has not been an independent audience study. I cannot claim that the project moved someone or gave them chills. What I can show is the working mechanism, its failures, and the small ordinary routines it protects: a birthday, a photograph, a line someone keeps answering.

## Prize Categories

- **Best Use of Gemma:** actual local Gemma generations drive the characters’ interpretations, memories, stance and disclosure decisions. Installed-model and behavioral evidence is in the repository.
- **Best Use of ElevenLabs:** a verified, cached fictional voicemail gives the operator’s account a voice and supplies a contrasting archival record. Text access and failure handling remain available.

Implementation, debugging and this article were assisted by OpenAI Codex. No other partner integration is claimed.
