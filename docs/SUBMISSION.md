---
title: "Her last message was to you. You never answered it."
published: false
description: "DEADNET: a murder mystery on a dead friend's 1999 computer, where an open-weight model plays the ghost and the evidence never lies."
tags: devchallenge, hf26challenge, ai, opensource
cover_image: https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/screenshots/desktop/01-opening.png
---

_This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 4: Ghost in the Machine](https://dev.to/challenges/hacktoberfest-week4-2026-10-26)._

A note is taped to the computer:

> Adam,
>
> I couldn't keep her computer in my room anymore.
>
> They say she fell. You heard the message she left. Please look before they come to collect it.
>
> Her messages are still there.
>
> — Mara

You are Adam. Nora Vale was your friend. She died in room 317 of Westhaven House on Halloween night, 1999, and the police called it an accident. You plug in your recovery USB, press the power button, and open her Messenger. The last conversation on the screen is with you:

> **03:14 nora_v:** don't come through the lobby<br>
> **03:14 adam_m:** Nora?<br>
> **03:23 adam_m:** I'm coming up.<br>
> _No reply._

A minute later her account signs back in.

> adam? is that you? you're late for soup.

**▶ [Play DEADNET in your browser](https://room317.onrender.com).** No account, no download. About fifteen minutes. Every visitor gets a private copy of the case, and it saves as you go.

## What I Built

**DEADNET is a short murder mystery played entirely inside a dead woman's computer.** A late-90s desktop with a BIOS screen, a clock stuck at 03:17, a forest wallpaper and a Start button. Everything you need is in software she used every day:

- **Messenger:** her dated conversations with friends. Jokes about soup, a running argument about Mara's heater, plans for dinner. And the last night.
- **Mail:** an email from Len, the night porter, sent at 03:07 from home. A statement from Owen, the building manager, saying Len was upstairs at 03:17. Mara, still writing to her friend. And Nora's last voice message.
- **Photos:** a real photo album with Nora's captions. One of them matters more than the picture.
- **Calendar:** a meeting at 03:15 about some fire-inspection forms. And _20:00, dinner at Mara's. Bring bread. Stay for once._ She never got there.
- **My Computer and Trash Bin:** her files, and a letter to her mother that she deleted and never sent.
- **Unknown Signal:** Nora. Played live by an open-weight model.

Your recovery USB adds one thing that isn't hers: a **Casebook**. You save the messages, emails and photos that matter, show them to Nora, and finally answer three questions. **Who came into the room? Why did they come? How did they get in?**

> A name alone won't explain it. Connect what you found.

Get it right and Nora finally gets to rest. Mara writes to you one last time:

> i printed her name properly this time. NORA VALE. not "the woman in 317".

## Demo

**[room317.onrender.com](https://room317.onrender.com)**, live AI on free open-weight models, hosted on Render. The first visit after a quiet spell can take up to a minute while the server wakes up.

![Nora's computer before you plug in the USB, with Mara's note](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/screenshots/desktop/01-opening.png)

![Nora's Messenger: the last conversation with Adam](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/screenshots/desktop/07-last-conversation.png)

![The desktop: Messenger, Mail, Photos, Calendar, My Computer, Trash Bin and five small games](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/screenshots/desktop/05-desktop.png)

![The Casebook on the recovery USB, with three saved items](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/screenshots/desktop/20-casebook.png)

Things to try:

1. Read Mara's note, plug in the USB, power on.
2. In **Messenger**, change the history date to **31 Oct**.
3. Open **Mail** and compare Len's email with Owen's statement. Look at the times.
4. Go through **Photos** and **Calendar** like you're looking for something you don't know exists yet.
5. Open **Unknown Signal** and show Nora something you found.
6. Open the **Casebook** and answer the three questions. If you're wrong, nothing is lost: think again.

The desktop also has five small spooky games (Grave Snake, Flappy Bat, Crypt Blocks, 2048: Séance and Phantomicus). They're optional. A real 1999 computer would have them, and the person who owned this one was a person.

## Code

{% github sea-deep/deadnet %}

MIT licensed, built from an empty directory starting October 29, 2026. Borrowed code, fonts, photos, sounds and cursors keep their own licenses, listed in [CREDITS](https://github.com/sea-deep/deadnet/blob/main/docs/CREDITS.md) and [THIRD-PARTY](https://github.com/sea-deep/deadnet/blob/main/docs/THIRD-PARTY.md).

## How I Built It

React and [98.css](https://github.com/jdan/98.css) draw the desktop. A small Node server owns each case in SQLite and keeps every API key off the browser. One model plays Nora and the three residents, one at a time.

The rule that holds the whole thing together:

> **The evidence is written. The people aren't.**

The email, the timestamps, the photo caption and the solution are authored, and they're the same for every player. What the model controls is everything around them: what Nora remembers, how sure she is, what she asks you back. A mystery needs facts that stay still while people are unsure about them. Language models are good at being unsure and bad at keeping facts still, so I only gave them the first job.

Every reply follows the same contract:

1. Build the prompt only from what that character has actually seen, plus a few bounded memories.
2. Ask the model for strict JSON: a short message, a stance, one memory to keep, and which evidence IDs it refers to.
3. Validate it. A reply that cites evidence the character hasn't seen, or invents an ID, is rejected.
4. Save the new state in one transaction.

Nora never sees the answer. She doesn't get the photo, the email or the calendar until you show them to her, and she never acts unless you write to her first. A real reply from the hosted game today, after I showed her the last conversation and apologised for being late:

> Adam. I'm sorry too. Two knocks at the door. I thought it was Mara, but I'm not sure anymore. Did you see anyone in the lobby?

That came from `nvidia/nemotron-3.5-super-vl:free` through OpenRouter's free router: 22.8 s, 2,966 tokens in, 2,246 out, **$0**. She doesn't solve it. She can't. She's frightened and missing the last minutes of her life, and you have the photo.

### What I threw away

The first version of DEADNET worked, and it was the wrong game.

It was a file hunt: `DOOR_0317.LOG`, `OCT31_CHAT.TXT`, a damaged `CASE_14.BAK` that repaired itself once you had opened enough files. At one point you even had to play two mini-games to "recover sectors" before the case file would open. Every mechanic was justified on paper. Together they made Nora's computer feel like an escape room with her name on the door.

So I rebuilt it around a simple question: _what would actually be on this person's computer?_ Not access logs. A messenger full of in-jokes. An inbox where her neighbour keeps writing even though she's gone. A photo she kept because she was always locking herself out. The evidence didn't get easier to find. It got more human, and the moment you notice the timestamp on Len's email lands harder because you've just read him joking about the broken ticket machine.

What stayed is the part that worked from the start: a ghost who only knows what you show her.

### Mistakes that cost nothing

The final step asks for three answers: a person, a reason and a way in. Guessing a name isn't enough. A wrong theory doesn't end the game, doesn't publish anything and doesn't spend any AI quota. It just tells you what doesn't fit. Only a theory supported by things you've actually saved closes the case.

### Putting a single-player ghost online

DEADNET started as a local, single-player app. Put that on the internet as it was and every judge would read every other judge's messages to a dead woman.

On Render, each browser gets its own private case in SQLite. The case also autosaves in your browser. Render's free tier sleeps when nobody's playing and wipes its disk, so if you come back to an empty server, your case quietly restores itself. The Start menu has **Save game**, **Save to floppy…** (a `ROOM317.SAV` file), **Load game…** and **Start over…**, the last behind a proper Windows 98 "Are you sure?" dialog. Save files are checked on the server, so an edited file with 999 turns is refused.

Daily request caps sit under the free OpenRouter allowance and survive restarts. If the free models are busy, the game says so and offers clearly labelled scripted replies in one click, so nobody gets stuck halfway through. The whole deployment is one [`render.yaml`](https://github.com/sea-deep/deadnet/blob/main/render.yaml).

### Bugs worth admitting

- **A stray `"}`.** One free model leaked JSON punctuation into Nora's dialogue: _Who are you?"}_. Ghosts don't speak in curly braces. The reply schema strips it now, with a test.
- **"Failed to fetch," forever.** One failed status check (during a server restart, say) left that raw browser error on screen permanently. Now it explains what happened and clears itself when the server comes back.
- **Space didn't reach the games.** After you opened a game from the desktop, keyboard focus stayed on the desktop. Keys now follow the window in front.
- **Flappy Bat had no gravity.** The original fell at a constant speed and teleported 32 px up on each flap. It has real momentum now, and a bat that faces the way it flies.

### The voice

There's one recording in the game: Nora's last call, in Mail. _"Adam? It's Nora. Don't come through the lobby. He's still here..."_ It's ElevenLabs' premade Lily voice on `eleven_v3_conversational`, hushed and rushed. It isn't a clone of anyone. It was rendered once (1.9 s for an 11.8 s clip), then cached, so replaying it costs nothing. The transcript is always one click away. [Evidence](https://github.com/sea-deep/deadnet/blob/main/docs/evidence/elevenlabs-case.json).

### Tests

35 Node tests cover knowledge isolation, failed-generation rollback, corrupt saves, rate limits across restarts, the audio cache, wrong theories and the correct ending. 38 browser scenarios cover the whole case on desktop and phone sizes: wrong-theory recovery, My Computer, Trash restore, save failures, keyboard controls and all five games. They use fixtures, so CI never spends a free request. Details are in [VERIFICATION](https://github.com/sea-deep/deadnet/blob/main/docs/VERIFICATION-REVAMP.md).

## Why Does Open Innovation Matter?

**Because this is a story about a computer that keeps answering after its owner is gone.** It would be grim if the ghost went silent because a vendor retired a model. With open weights, Nora's behaviour is reproducible: the prompts, memory rules and validation are all in the repo, and any compatible open model can play her. On the hosted game, OpenRouter's free router already picks a different free model from one day to the next, and Nora is still Nora.

**Because the conversations are personal.** Players write apologies to a dead friend. Run locally with Gemma 4 through Ollama (`MODEL_PROVIDER=ollama`), those words never leave the machine. No account, no telemetry, nobody else's server.

**Because free has to mean free.** The hosted game runs on free open-weight models, and the local version costs nothing per message. A game that charges per sentence is a game you play carefully. This one you should be able to waste a few messages in, saying sorry.

**Where a closed model would win:** prose. A frontier model would write a creepier Nora on the first try. It would still need the same boundary, because a confident model allowed to change the evidence will happily solve the murder for you.

Día de los Muertos is about remembering people by name, and about the small things they leave behind: a joke about soup, a dinner plan, a photograph with a caption only they would write. DEADNET is a computer full of those things. The mystery is just the reason to look.

## Prize Categories

- **Best Use of Render:** the playable game is a Render web service deployed from `render.yaml`. One Node process serves the desktop and the API, keeps a private case per visitor, recovers cases after the free instance sleeps, and keeps the OpenRouter and ElevenLabs keys on the server.
- **Best Use of Gemma:** Gemma 4 E2B (Q4_K_M) through Ollama is a first-class local provider, with a JSON schema per character so it can only cite evidence that character has seen. On an earlier revision of the case it answered Nora's turns in 6.1 s and 1.8 s on an Apple M5 laptop ([evidence](https://github.com/sea-deep/deadnet/blob/main/docs/evidence/case-local-gemma-current.json)).
- **Best Use of ElevenLabs:** Nora's last call is a single cached ElevenLabs recording that carries a key clue, with the transcript always available and a hard cap on new renders.

All characters and events are fictional. _I used AI coding assistants while building DEADNET and while writing this post._
