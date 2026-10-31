---
title: "DEADNET: a murder mystery on a dead friend's old computer"
published: true
description: "Nora's last message was to you. Her computer is still answering."
tags: devchallenge, hf26challenge, ai, opensource
cover_image: https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/screenshots/desktop/01-opening.png
---

_This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 4: Ghost in the Machine](https://dev.to/challenges/hacktoberfest-week4-2026-10-26)._

## What I Built

**DEADNET** is a short murder mystery that takes place on a dead woman's computer.

Nora Vale died in her room on Halloween night, 1999. The police called it an accident. You play Adam, her friend. Her neighbour Mara leaves you Nora's old computer with a note asking you to take a look before it's collected.

![Mara's note and Nora's computer](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/screenshots/desktop/01-opening.png)

The computer is a late-90s desktop with ordinary apps: Messenger, Mail, Photos, a Calendar, My Computer, a Trash Bin and a few games. There are no clue files or puzzles. You learn what happened by reading her messages, emails and photos, and noticing where people's stories don't line up.

Her last conversation in Messenger is with you. You didn't answer it in time.

![Nora's Messenger](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/screenshots/desktop/07-last-conversation.png)

Then her account comes back online, in a window called **Unknown Signal**. You can talk to her and show her what you've found. She's played by an open-weight model, and she only knows what you've shown her, so she can't just tell you the answer.

When you think you've worked it out, you open the **Casebook** on your recovery USB and answer three questions: who came into the room, why, and how they got in. A wrong answer doesn't end the game. It just tells you something doesn't fit.

## Demo

**[Play it in your browser](https://room317.onrender.com)**. It takes about 15 minutes. Each visitor gets their own copy of the case, and progress saves automatically. If nobody has played for a while, the first load can take up to a minute while the server starts.

![The desktop](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/screenshots/desktop/05-desktop.png)

If you get stuck: compare the times in Mail, and look closely at the photo captions.

For example, Len's email says he was already home; management puts him upstairs later that night. Save the email, then show it to Nora in Unknown Signal. Her response changes with what she's seen. The photograph's caption gives you another piece to compare with her last conversation. Those are the items you connect in the Casebook. You don't need to win a mini-game to finish.

![The Casebook after saving three personal items](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/screenshots/desktop/20-casebook.png)

## Code

{% github sea-deep/deadnet %}

MIT licensed. Borrowed code, fonts, images and sounds are credited in [CREDITS](https://github.com/sea-deep/deadnet/blob/main/docs/CREDITS.md).

## How I Built It

The desktop is React with [98.css](https://github.com/jdan/98.css). A small Node server stores each player's case and talks to the model, so no API keys reach the browser.

The main design decision was splitting what's fixed from what's live:

- **Fixed:** the evidence and the solution. Every player gets the same messages, timestamps and photos, and the same answer.
- **Live:** the characters. The model decides what Nora remembers, how sure she is and what she asks you.

I did this because language models are good at sounding unsure and bad at keeping facts straight. If the model could change the evidence, it could also accidentally solve the case for you, or make it unsolvable.

So each character only sees what they've actually been shown. Replies come back in a fixed format and get checked before they're saved. A reply that cites an invented or unwitnessed evidence ID is rejected. Dialogue can still be mistaken, but it cannot create a collectable clue, change the evidence or decide whether your theory wins.

One bug made that distinction concrete. The model-facing description of the spare-key photo also explained the motive from a different conversation. Nora could receive the answer before you'd shown her the chat. I removed that inference from the photograph and a later memory hint that named the key's owner too early. The tests now check all eight combinations of the three items Nora can have seen.

**The model.** The browser version now uses Gemma 4 31B through OpenRouter, pinned to `google/gemma-4-31b-it:free`. It runs on a hosted provider, not inside your browser. The local option is Gemma 4 E2B through Ollama. Both use the same character prompts and evidence rules; System Monitor records the actual model and request trace.

**What I changed along the way.** My first version was a file hunt: log files, a damaged backup you had to unlock, and at one point you had to play mini-games to recover it. It worked, but it felt like an escape room rather than someone's computer. I rebuilt it around what a real person would actually have on their PC: chats with friends, emails, a photo album, a calendar. The clues are in there, mixed in with ordinary life.

**Hosting.** It runs on Render. Each browser gets its own private case, so players never see each other's conversations. The game autosaves, and you can save to a file, load it back or start over from the Start menu. If the free model is busy, it tells you and lets you explicitly switch to labelled scripted replies. It never silently replaces a failed live response. Requests are capped at eight per visitor and thirty globally per day, with burst limits and cooldowns; resetting the case doesn't reset the allowance.

There's also one voice clip: Nora's last voicemail, recorded with ElevenLabs' premade Lily voice, hushed and hurried. She warns Adam not to come through the lobby and says Len wasn't in the building. It's something to compare with the email and management's statement, rather than a narrator explaining the solution.

![Nora's last call, in Mail](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/screenshots/desktop/11-last-call.png)

The 11.84-second clip is cached, so replaying it doesn't generate more audio. There's a transcript next to it. Voice, model, transcript and delivery settings identify the cache entry; concurrent playback requests share a single render. The existing [render record](https://github.com/sea-deep/deadnet/blob/main/docs/evidence/elevenlabs-case.json) took 1.927 seconds to generate.

**Checking the case.** There are 39 Node tests for knowledge boundaries, invented evidence, wrong theories, the ending, saves, request limits and the audio cache. Another 38 browser scenarios cover desktop and phone layouts, including a complete investigation with a wrong accusation and recovery. They use fixtures, so these checks don't spend model or voice credits. [Verification](https://github.com/sea-deep/deadnet/blob/main/docs/VERIFICATION-REVAMP.md).

## Why Does Open Innovation Matter?

**It keeps the game playable.** The story is about a computer that keeps answering after its owner is gone. With open-weight models, Nora doesn't depend on one company keeping one model available. The prompts and rules are in the repo, and any compatible open model can play her.

**It can run privately.** You can run the whole thing locally with Gemma through Ollama, so your conversations never leave your machine.

**It's free to play.** The hosted version uses a free Gemma route with a small daily request budget to protect the account. Running Gemma locally removes that shared API allowance; there is no per-message provider charge.

A closed frontier model would probably write better dialogue. But it would still need the same limits, because the hard part was never the writing. It was stopping the model from changing the facts.

## My Agent Session

I used Entire to capture the actual Codex session behind the evidence fix. The checkpoint links the conversation and tool work to [the implementation commit](https://github.com/sea-deep/deadnet/commit/b98c419a3383c6fe680520ff4237ed478425360d).

[The session excerpt](https://github.com/sea-deep/deadnet/blob/main/docs/evidence/entire-session.md) includes the edit that removed the premature clue and the test results that followed. It was exported from checkpoint `01M682MCRY0YFDMAADPPK7ETN8`; private setup and internal reasoning are omitted. The native checkpoint stays local, and the public excerpt can be read without an account. [Entire setup and capture details](https://github.com/sea-deep/deadnet/blob/main/docs/ENTIRE.md).

## Prize Categories

- **Best Use of Render:** the game is hosted on Render as a web service, with a private case per visitor, automatic saving, and API keys kept on the server.
- **Best Use of Gemma:** Gemma drives the characters through the pinned OpenRouter route online, or through Ollama for private local play.
- **Best Use of ElevenLabs:** Nora's last voicemail, an important clue, is an ElevenLabs recording, cached and shown with a transcript.
- **Best Use of Entire:** the actual Codex development session is linked to its commit, with the debugging edit and test output shared above.

All characters and events are fictional. _I used AI coding assistants while building DEADNET and while writing this post._
