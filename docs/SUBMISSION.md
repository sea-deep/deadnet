---
title: "DEADNET: a murder mystery on a dead friend's old computer"
published: false
description: "Nora's last message was to you. Her computer is still answering."
tags: devchallenge, hf26challenge, ai, opensource
cover_image: https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/screenshots/desktop/01-opening.png
---

_This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 4: Ghost in the Machine](https://dev.to/challenges/hacktoberfest-week4-2026-10-26)._

## What I Built

Nora Vale died in room 317 on Halloween night, 1999. The police called it an accident. You play Adam, her friend. Her neighbour Mara leaves you Nora's computer with a note asking you to look before it is collected.

![Mara's letter, before the computer starts](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/screenshots/desktop/01-opening.png)

You insert a recovery USB and power it on. There are boot sounds, a forest wallpaper, a Start button, and the software she used every day: Messenger, Mail, Photos, Calendar. My Computer opens her disk. The Trash Bin holds a letter she never sent.

**DEADNET is a murder mystery inside someone's personal computer.** You find clues among dinner plans and jokes, rather than conveniently named evidence files. The last Messenger conversation is with you. You did not answer it in time.

Then her account signs in again.

![Nora's last conversation with Adam](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/screenshots/desktop/07-last-conversation.png)

In **Unknown Signal**, an open-weight model plays Nora's trapped spirit. You can apologise, ask what she remembers, or show her something you found. Her memory is incomplete. She has not read her entire computer simply because you opened it.

Your USB adds the **Casebook**, where you collect relevant items and eventually connect a person, a motive and a way into the room. Wrong theories remain reversible. A supported conclusion releases Nora and leaves an aftermath from the people still living.

## Demo

**[Play in your browser](https://room317.onrender.com)** — no account or download. Allow about fifteen minutes. Render's free service may take a minute to wake up. Each visitor gets a separate case, with automatic saving.

![The desktop and its everyday applications](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/screenshots/desktop/05-desktop.png)

A short route through the investigation:

1. Insert the USB, power on, and open Nora's **last conversation** in Messenger. Save it to the Casebook.
2. In **Mail**, compare Len's “Home, somehow.” email with the management statement. They disagree about where he was. Save the email.
3. Listen to **Nora's last call**, or read its transcript. Her warning gives those timestamps a personal urgency.
4. In **Photos**, open “The spare key.” Read Nora's caption and save the photograph. **Calendar** supplies context for the night's appointment.
5. Open **Unknown Signal**, select a saved item, and ask Nora about it. This is the live model interaction.
6. Open **Casebook → What happened?** Connect the three answers. Revise a wrong theory, then follow the supported report to the ending.

![The Casebook gathers items from their original apps](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/screenshots/desktop/20-casebook.png)

The [gallery](https://github.com/sea-deep/deadnet/tree/main/docs/screenshots) includes the full investigation and mobile views. Signal presentation images contain authored scene dialogue; provider measurements are separate. Five spooky mini-games are optional distractions, never gates to the evidence.

## Code

{% github sea-deep/deadnet %}

MIT licensed. Reused game code, 98.css, fonts, photographs, sounds, icons and cursors retain their licenses in [Credits](https://github.com/sea-deep/deadnet/blob/main/docs/CREDITS.md). DEADNET's investigation, case engine and desktop adaptation are the work added here.

## How I Built It

React and 98.css draw the desktop. A Node/Express server owns the case in SQLite and calls the model. Browser code never receives provider keys.

```text
Player reads a personal item
          ↓
Save to Casebook → Show Nora the item
                          ↓
             Character-scoped prompt
                          ↓
             Gemma / OpenRouter or Ollama
                          ↓
             Validate reply + evidence IDs
                          ↓
             Persist memory and conversation

Casebook theory → Authored rules → Ending
```

**The evidence is fixed; the conversation is live.** Gemma chooses Nora's words, uncertainty, stance and subjective memory. It cannot replace an email, create a collectable clue, change the culprit or decide whether an accusation wins. The server owns those decisions.

Each turn starts with only the evidence that character has witnessed. The reply must match a strict JSON contract. Unknown or unwitnessed evidence IDs are rejected before relationships or memories are saved. Nora cannot broadcast or message other residents, and no unattended inference is scheduled for her. A failed generation leaves the message unread and refunds the narrative turn.

This boundary matters more than a scary prompt. In this revision I found that the spare-key record's description also explained the motive from the final chat. Even a perfectly obedient model was receiving information too early. I removed that inference from the photograph and a later memory hint that named the key's owner prematurely. Tests now check every combination of Nora's three witnessed records.

That does not prove every sentence a language model writes is true. A character can still be mistaken. It proves invented dialogue cannot become objective evidence or rewrite the solution.

### Hosted Gemma, local Gemma

The hosted adapter and Render blueprint now pin **`google/gemma-4-31b-it:free`** through OpenRouter, rather than letting a generic free router choose another family. This is hosted inference, not a model running in the browser. The trace records the model actually returned. There is no paid fallback; free-provider capacity can vary.

For private local play, the same engine supports **Gemma 4 E2B**, `gemma4:e2b-it-q4_K_M`, through Ollama. Its quantized package is about 4.6 GB. Earlier recorded local turns took 6.1 s and 1.8 s on an Apple M5; those are [measurements of an earlier case revision](https://github.com/sea-deep/deadnet/blob/main/docs/evidence/case-local-gemma-current.json), not a fresh benchmark of this update.

The hosted model pin was checked against OpenRouter's model catalog and an intercepted request test. I did not spend inference credits for this submission update.

### One call that belongs in the case

Nora's final voicemail is generated with ElevenLabs' premade Lily voice using `eleven_v3_conversational`, with hushed, rushed delivery. It is a fictional performance, not a clone of a real person.

“Len wasn't in the building” is something to compare with the email and management's statement. Hearing Nora hurry through the warning also changes the tone of the ordinary messages around it. The clip serves both the investigation and the character.

![Nora's last call in Mail](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/screenshots/desktop/11-last-call.png)

The existing [recorded render](https://github.com/sea-deep/deadnet/blob/main/docs/evidence/elevenlabs-case.json) took 1.927 s for an 11.84 s clip. Replays use cached bytes. Voice, model, transcript and delivery settings identify the cache entry; concurrent requests share one render. A transcript and custom playback controls keep the information accessible. The update generated no new audio.

### Hosting a private investigation

Render serves the interface and API together. Each visitor has a private SQLite world, and browser autosaves can restore a case after the free instance loses its ephemeral disk. Start also offers file export and import.

Free requests need a budget: two per minute and eight per day per visitor, with a shared ceiling of five per minute and thirty per day. Attempts count, including retries. Provider throttling sets a persisted cooldown. Resetting a case cannot bypass it. Live failures are shown; switching to the labelled scripted mode is the player's choice.

### Verification

**39 Node tests** cover knowledge isolation, all eight evidence subsets, invented IDs, invented dialogue, wrong theories, endings, failed-generation rollback, quota persistence, save validation and audio caching. **38 browser scenarios** cover desktop and phone layouts, the complete evidence-to-accusation path, wrong-theory recovery, My Computer, Trash, save errors, cursor states, voice controls and games. These checks use explicit fixtures and blank provider credentials. Both builds pass. [Verification record](https://github.com/sea-deep/deadnet/blob/main/docs/VERIFICATION-REVAMP.md).

## Why Does Open Innovation Matter?

Players can ask Nora a question I never wrote, without giving a model control of the murder. Open weights make that role portable: the same prompts, evidence permissions and validation work with hosted Gemma or a local Ollama instance. The story is not tied to one closed conversational service staying available.

Local play also gives the player a real privacy choice. Their messages stay on their own machine. Hosted play trades that for an easy browser link; requests go through OpenRouter. Those are different modes, and the game does not pretend otherwise.

I started with a much more technical file hunt. Replacing logs and damaged backups with someone's correspondence made the mystery better. Nora's missed dinner and unsent letter matter because she had a life beyond the crime. Halloween supplies the haunting; remembering that life supplies the reason to keep looking.

## My Agent Session

I integrated Entire with Codex and linked the actual development session to [the commit that fixed the evidence leak and pinned Gemma](https://github.com/sea-deep/deadnet/commit/b98c419a3383c6fe680520ff4237ed478425360d). The useful record is the sequence: inspect the prompt, find the unintended disclosure, change the boundary, then run regression tests. It explains why those lines exist.

**[Read the recorded session excerpt](https://github.com/sea-deep/deadnet/blob/main/docs/evidence/entire-session.md)**. It includes the real edit and test output from checkpoint `01M682MCRY0YFDMAADPPK7ETN8`. Entire retains the native checkpoint locally; the public excerpt removes private setup and internal reasoning. Project hooks, settings and the export command are checked in. [Integration details](https://github.com/sea-deep/deadnet/blob/main/docs/ENTIRE.md).

## Prize Categories

- **Best Use of Render:** deployed game and API, isolated visitor worlds, save recovery and server-side credentials.
- **Best Use of Gemma:** the pinned hosted Gemma route and local Gemma provider drive evidence-scoped character dialogue.
- **Best Use of ElevenLabs:** Nora's final voicemail carries a corroborating clue, with cached playback and an accessible transcript.
- **Best Use of Entire:** a real Codex session linked to the evidence-boundary commit, with a public session excerpt explaining the debugging work.

All characters and events are fictional. _I used AI coding assistants while building DEADNET and preparing this post._
