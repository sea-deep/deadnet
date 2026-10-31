# Room 317 personal-computer rebuild — verification

## October 31 submission update

- **39 Node tests pass**, up from 35. New coverage pins the OpenRouter request to `google/gemma-4-31b-it:free`, checks all eight Nora evidence subsets against prompt data and decoding, prevents a delayed memory from naming the key owner early, and verifies invented dialogue cannot create evidence or satisfy a report.
- Fixed two prompt leaks: the photo's fact no longer includes the final conversation's motive, and the fourth ungrounded memory no longer identifies Owen's spare key. The authored solution and investigation flow are unchanged.
- The hosted adapter default, `.env.example`, local `.env` and Render blueprint now select free Gemma explicitly. OpenRouter's public catalog listed the model with zero prompt/completion prices and JSON response support on October 31. No hosted generation was requested; metadata and an intercepted adapter request verify configuration, not upstream capacity.
- Entire CLI 0.12.2 is installed and project Codex hooks are configured. The real session is attached to its implementation commit; [session record](ENTIRE.md). Automatic uploads and telemetry are disabled. Future live hooks require Codex approval; attachment handles the already-running Desktop session.
- Production and scripted exhibition builds pass. Provider credentials are blanked in browser tests; model and audio unit tests intercept requests. These checks spend no OpenRouter or ElevenLabs generation credits.
- All **38 desktop/mobile browser scenarios pass** again, including evidence discovery, an attached item, a reversible wrong accusation and the correct ending. No new game mechanics were added.
- The deployed status endpoint confirmed hosted Gemma and voice configuration without generation. Older Render overrides still specified 45 global / 10 visitor requests per day; the quota parser now caps overrides at the documented 30 / 8. Tests cover stale values, lower limits, fractional and invalid settings. Environment settings may tighten, but cannot raise, the free-account ceilings.

The dated rebuild results below describe the preceding revision.

This records the `westhaven-personal-v5` revision, October 29, 2026. Earlier provider evidence and prototype benchmarks remain historical. The automated checks below make no model or voice generation requests. The main local case was explicitly changed from baseline to live; the quota snapshot remained 0/8 visitor, 0/30 global immediately after that change. Provider availability checks are not inference measurements.

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

The fixed case is short and authored; there is no randomized culprit. AI responses can be slow, unavailable, repetitive or mistaken, while the objective evidence and win condition remain fixed. The scripted mode/static exhibition disclose that they have no live inference. One live hosted reply was checked on October 30, 2026 (`nvidia/nemotron-3.5-super-vl:free`, 22.8 s, $0); the revised prompt has not been benchmarked beyond that. Previous measured provider results do not validate the new dialogue. Optional games are deliberately anachronistic. Restored drafts and Notepad are local browser state, rather than part of the case export.

Five-game interaction pass: all five loaded with no page errors; Flappy entered playing state, Tetris entered playing state, 2048 responded to moves and Phantomicus rendered its two canvases. Sound checks confirmed gesture-started ambience, game ducking, global mute reaching game audio and stopping ambience. Presentation captures and their manifest are in screenshots/.
