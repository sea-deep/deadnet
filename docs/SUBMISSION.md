---
title: "DEADNET: The Victim’s Computer Is Still Answering"
published: false
tags: devchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 4: Ghost in the Machine](https://dev.to/challenges/hacktoberfest-week4-2026-10-26).*

## What I Built

Mara keeps emailing her dead neighbour.

“i keep writing this as if you’ll read it. your scarf is still on my chair.”

On Nora Vale’s recovered computer, those messages are still waiting in Inbox. The police called her death an accident. A door log disagrees with a witness statement. Her last call ends before she can finish explaining. Then an unknown contact starts answering you.

**DEADNET — Room 317 is a fictional murder investigation inside an old desktop.** Read the residents’ messages, inspect recovered records, question three accounts, and talk privately to the soul trapped in the computer. Show Nora what you find. Her memory arrives in fragments; your job is to decide what those fragments actually establish.

The AI does not invent the solution. The objective case is authored. Open-weight models supply the uncertain conversations around it: what somebody believes, what they remember, whether they trust you, and whether they pass a private discovery to someone else.

All people and events are fictional. This is not a recreation of a real deceased person.

## Demo

[Open the interactive exhibition](https://sea-deep.github.io/deadnet/).

**The public exhibition is explicitly scripted.** It shares the state engine and lets anyone explore without a key or model installation. It cannot prove live inference. The [full Node application](https://github.com/sea-deep/deadnet#run) runs the actual model calls; reproducible transcripts and measurements are linked below.

![Nora’s computer, with individual game shortcuts and an unknown signal](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/evidence/desktop-new.png)

Power on. Read Inbox. Open Unknown Signal and ask what she remembers. My Documents contains a key log, a saved chat and Adam Moore’s earlier case backup. You can attach opened files to private conversations. The final report records the suspect you choose; the closing signal changes with that choice.

![The private messenger window](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/evidence/spirit.png)

The BIOS sequence, clock stuck at 03:17, unfinished Notepad, forest wallpaper and quiet horror audio make the machine a place to investigate. Six credited games are ordinary distractions on its desktop. Each opens directly, with shared pause, restart, sound and keyboard controls. There is no demo video: the working exhibition, local installation and actual evidence are the demonstration.

## Code

[sea-deep/deadnet on GitHub](https://github.com/sea-deep/deadnet). New project and repository begun October 29, 2026. Application code is MIT.

The shell adapts [98.css](https://github.com/jdan/98.css). Actual Yahoo 1998 and Netscape mailbox screenshots informed navigation and density. Fonts, Fugue PNG icons, Sebastian Unrau’s forest photograph, Vander96’s animated bat and techiew’s CC0 ambience are [credited](https://github.com/sea-deep/deadnet/blob/main/docs/CREDITS.md).

Grave Snake, Flappy Bat, Crypt Blocks and 2048: Séance adapt existing MIT games; Phantomicus and Hocus :focus retain their original titles. Their creators remain visible in the game window. [Pinned sources and modifications](https://github.com/sea-deep/deadnet/blob/main/docs/THIRD-PARTY.md) separate borrowed gameplay from new work. I did not build those games from scratch.

Hypnospace Outlaw, 98.js, Generative Agents and AI Town are precedents. The specific hook here is evidence moving through a small society while a private ghost tries to reconstruct a memory.

## How I Built It

React/Vite renders the desktop. A Node backend owns a SQLite world and keeps provider keys off the client. One model serves three resident accounts and Nora’s separate private state.

A turn follows a narrow contract:

1. Select an account and an event it can actually read.
2. Build context from its scoped memories, relationships and witnessed records.
3. Request a short message, stance, bounded trust change, subjective memory, disclosed record IDs and recipient.
4. Validate the proposal, then commit the resulting world atomically.
5. Let a later account read the resulting post or addressed message.

A file you open does not inform everyone. Mara can choose to tell Len. Len can doubt her. Subjective beliefs stay separate from objective records. The model has no shell, filesystem, browser or external messaging tools.

### Keeping the ghost uncertain

A first prompt gave Nora four sensory details. She listed all four at once. It sounded like an explanation of a puzzle.

I narrowed the grounding: one fragment enters each turn, alongside only records she has actually seen. The current live reply was:

> Yes, I hear you. Two knocks... I thought it was Mara. But I'm not sure anymore. Who found me? What time is it?

That is an actual OpenRouter response, not the exhibition’s scripted opening. It does not identify the murderer. Her next reply can react to the visitor’s question or an attached record, while the server controls which facts are available.

Nora cannot broadcast or message another resident, and unattended scheduling excludes her. Correctly reporting the responsible suspect produces an authored final signal and closes her connection. Further requests to that released signal are rejected before inference.

### The secret that escaped too early

In the earlier prototype, the operator volunteered protected information before the visitor found it. Valid JSON had still spoiled the story.

I changed the information boundary. Protected administrative facts stay out of normal prompts until witnessed evidence introduces them. Actor-specific local decoding schemas limit record IDs and recipients; server validation remains authoritative for every provider. Tests exercise the rumor path, private-memory isolation, failures, persistence and invalid proposals.

This does not make every sentence true. A small model can still repeat itself, infer too much or confuse who said something. The engine validates state changes, not the truth of every sentence.

### Real models, real limits

The default hosted route is `openrouter/free`. OpenRouter selects a compatible free model and the trace records its actual identity. A credential-backed request through the current Node API used **dots-studio/dots-3-note-preview:free**, took **13.820 seconds**, used **1,027 input / 697 output tokens**, succeeded in one attempt and reported **$0**. [Current-case evidence](https://github.com/sea-deep/deadnet/blob/main/docs/evidence/case-openrouter.json).

Fixed free Gemma endpoints were returning upstream capacity errors. Some thinking models also exhausted a small token budget before producing their JSON. The hosted adapter now budgets reasoning separately within a finite output allowance, validates the eventual response and never selects a paid fallback. Free inference can still be slow or unavailable.

For local execution, Gemma 4 E2B Q4_K_M runs through Ollama. Two actual current-case Nora turns validated at **6.089 s and 1.788 s**. Earlier prototype measurements on this Apple M5 / 16 GiB Mac provide the broader hardware baseline: nine warm generations, median **1.635 s**; about **5.1 GiB** model-process physical footprint measured with macOS vmmap; and an actual five-minute session with eleven successful model turns. Those earlier measurements are labeled as prototype results, not a final murder-case session.

One generation runs at a time. Eighteen story turns need explicit renewal. Hosted requests additionally have persistent minute/day caps and a cooldown after provider 429s. Resetting the mystery cannot reset the API allowance. Twelve memories are stored per account, eight enter context, and three exact recent visitor disclosures support recall.

A [developer’s bounded SQLite memory write-up](https://dev.to/jnocode/i-built-a-memory-system-for-ai-agents-that-actually-forgets-2i20) was a useful community reference. My timings are my own measurements, not that article’s results.

The [verification record](https://github.com/sea-deep/deadnet/blob/main/docs/VERIFICATION.md) distinguishes each experiment. Eighteen Node tests and six desktop/mobile browser scenarios cover the current revision. Separate browser checks exercise all six games and the audio controls. No independent audience study or broad cross-platform benchmark is claimed.

### A call, rather than a narrator

The original voice sounded like a broadcaster explaining the premise. I replaced its script and delivery.

Nora’s outgoing call is short: someone is still in the building; a tape is under Adam’s keyboard; Len was not there. It supplies an alibi clue without naming the killer. It uses ElevenLabs’ premade Lily voice with hushed/rushed delivery at 1.14× speed, rather than impersonating a real person.

One real **150-character** render using `eleven_v3_conversational` took **1.927 seconds**. The clip is **11.84 seconds** long. Replay returned identical cached bytes with no additional generation. The immediate billing counter did not change; that does not prove a zero invoice charge. The transcript remains accessible, and cache keys include the delivery settings. [Voice evidence](https://github.com/sea-deep/deadnet/blob/main/docs/evidence/elevenlabs-case.json).

## Why Does Open Innovation Matter?

This is a story about a computer continuing to answer after its owner is gone. Open weights let its behaviour remain reproducible without one irreplaceable model service.

The local route can keep the player’s private conversations and character memories on their machine after setup. The hosted route makes another deployment possible without requiring a GPU in the browser. Prompts, memory policy, validation rules and the selected model are inspectable. If a shared free endpoint is unavailable, the measured local option still exists.

The archive and final outcome are authored. The model changes the conversations and information path, not the objective murderer. That boundary is deliberate: an investigation needs facts that stay put while people disagree about them.

I cannot claim an audience felt frightened or moved; there has not been a human study. What I can show is the working mechanism and its limits: a friend emailing an empty room, a witness defending a small ordinary detail, and an uncertain voice asking who found her computer.

## Prize Categories

- **Best Use of Gemma:** actual local Gemma generations drive scoped characters and Nora’s private responses; current-case and hardware evidence are in the repository.
- **Best Use of ElevenLabs:** a verified, cached final call supplies an important contrasting record, with text access and bounded generation.

Implementation, debugging and this article were assisted by OpenAI Codex. No other partner integration is claimed.
