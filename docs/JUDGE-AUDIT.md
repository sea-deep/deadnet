# Judge walkthrough — Room 317

Start with the USB gesture and Mara’s letter. You are Adam Moore, using Nora’s computer after her funeral. The desktop is her personal space; your casebook lives on the removable drive.

## A short route through the experience

1. Open **Messenger**. Read the earlier exchanges, then Adam’s conversation on **31 Oct**. Save it to the casebook.
2. Open **Mail**. Compare **Home, somehow.** with **Statement for residents**. Nora’s missed call and its transcript are here too. Save Len’s email.
3. Open **Photos** and look at **The spare key**. Read Nora’s caption and save the picture. **Calendar** supplies the context for that night; **Trash Bin** contains the plans she never finished. Restore a letter and find it in **My Computer → Documents**.
4. Open **Unknown Signal**, show Nora one of the saved items, and ask what she remembers. Live play uses the configured open-weight model through OpenRouter; the server keeps private memories and evidence boundaries.
5. Open the USB **Casebook → What happened?** Connect the person, motive and means of entry. Try a wrong theory: the case stays open and you can revise it. A supported report reaches the ending.

There is no game-time repair gate. The five desktop mini-games are optional. Hocus was removed. 2048 and Phantomicus use their original project artwork, and Phantomicus retains its on-screen creator link. Source license notices remain packaged with the borrowed code.

## Presentation assets

[Browse the screenshots](screenshots/index.html) · [Scene manifest](screenshots/manifest.json).

The set includes the opening/USB/boot, personal conversations, correspondence, photo album, calendar, deleted letter, file manager, casebook, ghost contact, all five running games and the ending. Phone captures cover the same readable interface. Later images contain spoilers. Presentation checkpoints and capture methods are recorded separately in the asset folder; no provider measurements are inferred from screenshots.

## Engineering to inspect

- **Persistence:** atomic SQLite world/revision storage, per-visitor hosted worlds, save validation, autosave/export and error handling.
- **AI:** actor-scoped witnessed evidence, bounded memories, schema-validated decisions, serialized requests and persistent free-account limits. Nora never runs unattended.
- **Game rules:** three saved personal artifacts and Nora’s witnessed memory are needed for the final deduction. Incorrect answers do not publish evidence or end the game.
- **Sound:** muted until a gesture, shared mute/background handling, cached short ElevenLabs call and custom playback controls.
- **Controls:** keyboard/drag/resize/minimize/maximize, responsive windows, default CRT with an off switch and a complete classic cursor pack shared by game frames.
- **Checks:** 35 unit tests, 38 desktop/mobile scenarios, five-game interaction checks and sound-state checks. The build tests do not require live provider calls.

The story and physical evidence are authored. The open-weight model supplies the conversation during live play. Actual historical provider measurements are kept separately from the current release checks in [Verification](VERIFICATION-REVAMP.md).
