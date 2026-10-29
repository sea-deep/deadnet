---
title: "Nora died in room 317. Her computer is still answering."
published: false
tags: devchallenge, hf26challenge, ai, opensource
---

_This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 4: Ghost in the Machine](https://dev.to/challenges/hacktoberfest-week4-2026-10-26)._

There is an email in Nora Vale's inbox from her neighbour, Mara:

> i keep writing this as if you'll read it. your scarf is still on my chair.

Nora can't read it. She was found dead in room 317 at 03:17 on Halloween night, 1999. The police called it a fall. Her door was locked from the inside.

You've been handed her computer. You power it on. Somewhere in the machine, something types back:

> i can hear the keys. is somebody there?

**▶ [Play it now in your browser](https://room317.onrender.com).** No sign-up, no key, about fifteen minutes. Every visitor gets a private copy of the case.

## What I Built

**DEADNET: Room 317 is a murder mystery you solve by going through a dead woman's computer.** It looks and sounds like a late-90s desktop: BIOS beeps, a clock frozen at 03:17, a forest wallpaper, Inbox, Chat Logs, My Documents, a Trash Bin, an unfinished Notepad file.

Three people are still connected to the building's network:

- **Mara Voss**, the neighbour, who refuses to call it an accident.
- **Len Mercer**, the night porter. The building manager's statement says he was in the lobby.
- **Owen Keene**, the building manager. Polite, helpful, very keen to keep things calm.

And there's a window called **Unknown Signal**. It's Nora.

You read their messages, open the files in My Documents (a door log, a saved chat), dig a deleted case file out of the Trash Bin, play Nora's old games to repair what her disk lost, and write to them. Each of them is played by an open-weight model, with their own memories, goals and opinions of you. Then you file a report naming who opened room 317 at 03:17. Name the right person and Nora's last message changes. Name the wrong one and she knows.

The rule that makes it work:

> **The case is written. The people aren't.**

The facts never move. The door log says what it says, and the killer is the same for every player. What the AI controls is everything around the facts: what Mara believes, what Len remembers, whether Owen tells you the truth, whether a secret you share with one person reaches another. A mystery needs facts that stay still while people argue about them. Language models are good at the arguing and bad at keeping facts still, so I only gave them the arguing.

## Demo

**[room317.onrender.com](https://room317.onrender.com)**, hosted on Render. Live replies come from free open-weight models.

![Nora's recovered desktop: Inbox, Chat Logs, My Documents, Unknown Signal and six games](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/evidence/desktop-new.png)

A first visit opens a **Read Me** that tells you the goal and the four steps: read, recover, ask, decide. If the free model pool is busy or today's free allowance runs out, one click switches the game to clearly labelled scripted replies, so you can always finish the case.

Things to try:

1. Open **My Documents**. Read `DOOR_0317.LOG` and `OCT31_CHAT.TXT`.
2. Open the **Trash Bin**. Someone logged in as SYSOP deleted Adam's case file, `CASE_14.BAK`, at 03:17 two nights later. It's damaged, and its sectors are shared with Nora's game saves. Play any two of her games for 20 seconds each to repair it.
3. Open **Unknown Signal**, attach the door log and ask Nora what she remembers.
4. In **Inbox**, send the door log to Len. Then ask Mara about it later and see whether he passed it on.
5. Play Nora's last voicemail, `NORA_0314.WAV`.
6. File your report in `CASE_14.BAK`, in the Trash Bin.

![The Unknown Signal window: talking to Nora](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/evidence/spirit.png)

Nora's desktop also has six games: Grave Snake, Flappy Bat, Crypt Blocks, 2048: Séance, Phantomicus and Hocus :focus. They aren't decoration. The first thing the ghost tells you is _"i used to play my games when i couldn't sleep. maybe they kept something."_ Her game saves sit on the same damaged sectors as the case file, so you can't read who held the master key until you've spent a little time playing what she played. They're re-themed MIT-licensed projects with their authors credited in the game window.

## Code

{% github sea-deep/deadnet %}

MIT licensed, started October 29, 2026. Borrowed code and media keep their own licenses, listed in [CREDITS](https://github.com/sea-deep/deadnet/blob/main/docs/CREDITS.md) and [THIRD-PARTY](https://github.com/sea-deep/deadnet/blob/main/docs/THIRD-PARTY.md).

## How I Built It

React and Vite draw the desktop, styled with [98.css](https://github.com/jdan/98.css). A small Node server owns the world in SQLite and keeps every API key off the browser. One model plays all four characters, one at a time.

Every reply follows the same contract:

1. Pick a character and something they can actually read.
2. Build the prompt only from that character's memories, relationships and the records they have seen.
3. Ask the model for JSON: a short message, a stance, a trust change between -2 and +2, one memory to keep, which records they mention, and who (if anyone) they pass it to.
4. Validate it, then save the new world in one transaction.

A file you open doesn't magically inform everyone. If you send Len the door log, Len knows. Whether Mara ever finds out depends on whether Len decides to tell her, and the model makes that call in character. The model has no shell, no browser, no file access and no way to send anything outside the game.

### Nora said too much

My first Nora got four sensory memories in her prompt. On the first turn she recited all four. It sounded like someone explaining a puzzle, not a ghost who can't remember her own death.

Now Nora gets **one memory fragment per turn**, plus only the files you've actually shown her. She can't message the other characters, and she never acts on her own. A real reply from today, on a free model:

> I don't know you. Two knocks at the door. I thought it was Mara, but I wasn't sure. What happened that night? Who are you?

She doesn't name the killer. She can't, because the fact isn't in her context until you bring it to her.

### The manager spoiled his own secret

In an early version Owen volunteered the protected fact (whose master key opened the door) before the player had found any evidence. The JSON was perfectly valid. The story was ruined.

Schema validation can't catch a spoiler, so I moved the line. Owen's private facts stay out of his prompt until a record the player has seen puts them there. For Gemma running locally, each character also gets its own JSON schema that only allows the record IDs and recipients that character is allowed to mention. The server checks every reply again whichever provider wrote it. There are tests for rumours spreading, private memories staying private, and invalid replies being rejected.

It doesn't make every sentence true. A small model can still repeat itself or mix up who said what. The engine guarantees the state, not the prose.

### Three bugs I found while putting it online

- **"Failed to fetch."** The app checks the server every three seconds. One failed check, say during a restart, showed that raw browser error and never cleared it, even after the server came back. It now says plainly that the server can't be reached, and the message disappears on its own when the connection returns.
- **A stray `"}`.** One free model leaked JSON punctuation into Nora's dialogue: _Who are you?"}_. Ghosts don't speak in curly braces. The reply schema now strips it, and there's a test for it.
- **Fresh installs burned turns.** With no model connected, every message failed but still used one of your 18 turns, and the error said "try again", which never helped. Now the game says no AI is connected and offers scripted replies in one click.

### Putting a single-player world online

DEADNET was built as a local, single-player app: one world, bound to `127.0.0.1`. Put that online as it was and every judge would read every other judge's messages to a dead woman.

On Render, each browser now gets a cookie and **its own private world** in SQLite, created on the first visit. The health check doesn't create worlds, unattended turns are switched off, and the free-request limits are set below OpenRouter's free daily allowance. The whole deployment is one [`render.yaml`](https://github.com/sea-deep/deadnet/blob/main/render.yaml).

### Real models, real numbers

- **Hosted:** `openrouter/free`, which routes to a compatible free model. The reply above came from `recursive/flint-v1.0:free` in 9.4 s, 965 input and 1,219 output tokens, **$0**. Paid model IDs are rejected in code.
- **Local:** Gemma 4 E2B (Q4_K_M) through Ollama on an Apple M5 with 16 GB. Two Nora turns took **6.1 s and 1.8 s**. In an earlier prototype, nine warm generations had a median of 1.6 s and the model process used about 5.1 GB. [Evidence](https://github.com/sea-deep/deadnet/blob/main/docs/evidence/case-local-gemma-current.json).
- **Limits:** one generation at a time per world, 18 story turns, per-visitor and shared daily caps, and a cooldown when the provider says it's busy.

31 Node tests and 10 desktop and mobile browser scenarios run on every push. Separate scripts check that all six games and the sound controls work. What's measured and how is in [VERIFICATION](https://github.com/sea-deep/deadnet/blob/main/docs/VERIFICATION.md).

### A phone call, not a narrator

The first voice I generated sounded like a radio presenter introducing the game. I threw it out.

Now the only voice is Nora's last outgoing call, recovered as `NORA_0314.WAV`: _"Adam? It's Nora. Don't come through the lobby. He's still here..."_ It gives you Len's alibi without naming the killer. It's ElevenLabs' premade Lily voice with `eleven_v3_conversational`, hushed and rushed at 1.14× speed. It's not a clone of anyone. One 150-character render took 1.9 s for an 11.8 s clip. After that it's cached, so replays generate nothing. The transcript is always one click away. [Evidence](https://github.com/sea-deep/deadnet/blob/main/docs/evidence/elevenlabs-case.json).

## Why Does Open Innovation Matter?

**Because this is a story about a computer that keeps answering after its owner is gone.** It would be a bit grim if the ghost stopped answering because a vendor retired a model. With open weights, Nora's behaviour is reproducible: the prompts, memory rules and validation are in the repo, and any compatible open model can play her.

**Because the conversations are personal.** Players write things to a grieving neighbour and to a dead woman. Run locally with Gemma, those words never leave the machine. No account, no telemetry, nobody else's server.

**Because free has to mean free.** The hosted version runs on free open-weight models, and the local version costs nothing per message. A game that charges per sentence is a game you play carefully. This one you should be able to waste turns in.

**Where a closed model would win:** prose. A frontier model would write a creepier Nora on the first try. It would still need the same boundary, because a confident model that's allowed to change the facts will happily solve the mystery for you.

Día de los Muertos is about remembering people by name. At the end of the case, if you get it right, Mara writes one more email:

> i printed her name properly this time. NORA VALE. not "the woman in 317".

That's the line I built this for.

## Prize Categories

- **Best Use of Render:** the playable game is a Render web service deployed from `render.yaml`. One Node process serves the desktop and the API, gives every visitor a private world, and keeps the OpenRouter and ElevenLabs keys on the server.
- **Best Use of Gemma:** Gemma 4 E2B through Ollama plays all four characters locally, with per-character JSON schemas. Measured timings and memory use are in the repo.
- **Best Use of ElevenLabs:** Nora's last call is a single, cached ElevenLabs recording that holds a key clue, with the transcript always available.

All characters and events are fictional. _I used AI coding assistants while building DEADNET and while writing this post._
