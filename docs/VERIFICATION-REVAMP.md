# Room 317 personal-computer rebuild — verification

This records the `westhaven-personal-v5` revision, October 29, 2026. Earlier provider evidence and prototype benchmarks remain historical. No model or voice generation requests were made for this revision, per the user’s instruction. The main local case was explicitly changed from baseline to live; the quota snapshot remained 0/8 visitor, 0/30 global immediately after that change. Provider availability checks are not inference measurements.

## Scope

Preserved: SQLite persistence, per-visitor hosting, actor-scoped knowledge, generation locking, free-only OpenRouter route, durable quota/cooldown, audio cache and cap, save validation, blocked-autosave errors, poll suppression, desktop keyboard controls and game sound/pause bridges.

Replaced: technical evidence-file hunting and self-repairing game-save gate, web-feed chat UI, first-run instruction manual and conspicuous clue sticky note. New game opening mounts a USB casebook. Native personal applications carry the evidence. Photos/calendar add ordinary context; deleted letters can be restored through My Computer. Three-part deductions require actual collected evidence and Nora’s witnessed memory. Wrong deductions do not close the case, publish evidence or consume inference quota. A correct supported deduction yields the authored release and aftermath.

## Checks

- Node test suite: 35 tests passing, including knowledge isolation, failed-generation rollback, corrupt saves, rate limiting across resets/restarts, audio-cache deduplication, supported resolution and reversible wrong theories.
- Full final desktop/mobile run: 38 scenarios passed, including the complete case, wrong-theory recovery, My Computer/Trash, save errors, keyboard navigation, games, default CRT, cursor coverage across window descendants/text fields/game frames, and voice transport with a bundled audio fixture. The voice UI test intercepts the request locally; it does not call ElevenLabs.
- Browser screenshots are actual Playwright captures under `docs/evidence/revamp-*.png`, not generated mockups. Desktop 1440×900; phone iPhone 13 profile. Photos, My Computer, opening, Messenger, desktop and ending were inspected.
- Build and static exhibition compile with the existing engine and the five-game public assets. Hocus source/runtime removed; old save IDs remain recognized only for compatibility.
- No regenerated voice, new hosted inference, deployment-generated dialogue or fabricated provider measurements.

## Practical limits

The fixed case is short and authored; there is no randomized culprit. AI responses can be slow, unavailable, repetitive or mistaken, while the objective evidence and win condition remain fixed. The scripted mode/static exhibition disclose that they have no live inference. The revised prompt has not been measured against the real provider, at the user’s request. Previous measured provider results do not validate the new dialogue. Optional games are deliberately anachronistic. Restored drafts and Notepad are local browser state, rather than part of the case export.

Five-game interaction pass: all five loaded with no page errors; Flappy entered playing state, Tetris entered playing state, 2048 responded to moves and Phantomicus rendered its two canvases. Sound checks confirmed gesture-started ambience, game ducking, global mute reaching game audio and stopping ambience. Presentation captures and their manifest are in screenshots/.
