---
title: "DEADNET: The Last Message Was for You"
published: false
description: "A haunted personal computer, a recovery USB, and a friend who never made it to Sunday dinner."
tags: devchallenge, hf26challenge
---

<!-- Unpublished entrant-review draft. AI-assisted writing. No demo video. -->

## What I Built

You are Adam Moore. After Nora’s funeral, her neighbour Mara gives you Nora’s computer. The police say she fell. The last message on the machine is addressed to you.

DEADNET is a short murder investigation inside a late-1990s desktop. You insert your recovery USB, power on, and find the ordinary software somebody left behind. A messenger has old jokes and unanswered messages. A calendar still expects Sunday dinner. The trash contains a letter to her mother she never sent.

Then Nora’s account signs in.

You can talk to her through a hosted open-weight model, show her things you found, and question what she remembers. Physical evidence stays authored and fixed. Her uncertain interpretation is live. To finish, you connect a person, a motive and a way into the room. A wrong theory stays open so you can reconsider.

## Demo

[Play the full server edition](https://room317.onrender.com) · [Clearly scripted static exhibition](https://sea-deep.github.io/deadnet/).

![Nora’s Messenger](https://raw.githubusercontent.com/sea-deep/deadnet/main/docs/evidence/revamp-messenger-desktop.png)

The full edition supports live OpenRouter replies, private visitor cases and cached ElevenLabs voice. Free-model capacity can be unavailable. The static exhibition and explicit offline mode disclose their scripted dialogue; neither pretends to perform inference. No demo video is included.

## Code

[Public source](https://github.com/sea-deep/deadnet) · [Source credits](https://github.com/sea-deep/deadnet/blob/main/docs/CREDITS.md) · [Rebuild verification](https://github.com/sea-deep/deadnet/blob/main/docs/VERIFICATION-REVAMP.md).

## How I Built It

React and 98.css provide the familiar desktop. Node and SQLite own the case state. A model receives only the evidence its character has actually witnessed, bounded personal memories and the incoming message. Schema validation rejects invented evidence IDs and invalid recipients. Nora’s signal stays private and never runs unattended.

The USB makes the investigation utility believable without turning the victim’s computer into a folder full of conspicuously named clues. Messenger contains dated conversations, Mail contains personal correspondence, Photos has actual raster pictures and captions, and My Computer/Trash support normal exploration and restoration.

The evidence and win condition are deterministic. The player’s conversations are dynamic. A wrong accusation produces recoverable feedback and leaves the case open. Nothing requires beating a side game or waiting for a pretend file repair.

OpenRouter accepts only the free router or explicitly free model IDs. SQLite rate limits persist across restarts and case resets; upstream throttling creates a cooldown. Hosted visitors have private cases and no autonomous inference. The API key remains on the server.

Nora’s last call uses a licensed ElevenLabs Lily voice with a short, hushed delivery. The previously measured clip lasts 11.84 seconds and replays from cache. This rebuild made no new AI or voice generation requests at the owner’s request; historical provider measurements are labelled as earlier revisions rather than presented as new-prompt benchmarks.

The engine/audio/provider/save suites have 35 tests. Browser scenarios cover the complete case, wrong-theory recovery, private conversation, My Computer, restoration, keyboard controls, responsive layout, save failures, game controls, default CRT and the cursor pack. These tests use explicit fixtures rather than spending the free account’s quota.

## Why Open Innovation Matters

Borrowing a familiar interface gave me room to work on the part that matters: making Nora feel like someone who had friends and plans. Open-source 98.css supplies period controls; existing mini-games supply optional distractions. Those games retain their license notices and are not claimed as original mechanics. The photo, fonts, cursor pack and atmosphere also have documented origins.

Open-weight inference makes the voice on the other side of the screen flexible without letting a model rewrite the evidence. Local Gemma remains supported through Ollama; the public server can route to available free open-weight models. The game owns truth, and the model plays a frightened person trying to remember it.

AI assisted implementation and writing. The characters, case, screenshots and audio are fictional. The software, checks, limitations and borrowed contributions are documented so another developer can inspect or change them.

## Prize Categories

The project explores open-weight inference and ElevenLabs voice. Local Gemma support and historical measurements are documented separately from the current free-router configuration. Eligibility and category claims require entrant review against the official rules before publication. This draft has not been submitted.
