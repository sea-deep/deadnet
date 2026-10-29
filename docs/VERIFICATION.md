# Verification record

Measured on an Apple M5 / 16 GiB Mac on October 29, 2026. The fictional case dates are unrelated to real development dates. Current Room 317 evidence is distinguished from the earlier continuity/birthday prototype.

## Current case

- **30 Node tests:** evidence propagation and restart persistence, private memories, record access, irreversible publication, budgets, invalid proposals, recoverable provider failure, serialization, operator secrets, invented evidence rejection, Nora’s private scope/autonomy exclusion, suspect-report persistence and closing the released signal, voice cache/deduplication/failure, free-only routes, throttle handling and persistent quota/reset boundaries, case-progress thresholds and caps, the six-game registry, recovered-game saves, archive consistency, nested save-file validation, and recreation of a pruned visitor world.
- **9 Chrome scenarios (desktop and mobile):** desktop and mobile investigation/disclosure, reload persistence, shell/notes/mute/wallpaper/validation, direct game launch, pause control and private Nora exchange, Hocus :focus keyboard play, explorer search selection, corrupt-save recovery, the collapsed mobile note, unread-mail badges, and Inbox/Sent isolation. These use the explicitly scripted adapter, with no provider key or model download in CI. The mobile-only note scenario is skipped on desktop.
- Separate game checks interact with all six themed games. Sound checks prove ambience starts after a gesture, pauses for games, and tray mute reaches active game audio. Custom recording Play/Pause/Stop/seek controls are checked against real cached audio, with native browser media controls hidden to preserve the period interface. Browser screenshots are actual captures.
- TypeScript, local and exhibition builds pass. Main UI text uses W95FA/VT323 with a minimum-13-px font audit; the newly added messenger’s initially undersized labels/buttons were corrected. npm audit reports zero vulnerabilities.

## Actual OpenRouter response

**case-openrouter.json** records a request through the Node API using the final one-fragment prompt. Actual selected model: **dots-studio/dots-3-note-preview:free**. One attempt, **13,820 ms**, **1,027 input / 697 output tokens**, provider-reported **$0**. Nora recalled two knocks, expressed uncertainty about Mara and asked who found her. She did not identify the killer. This is a real provider reply, not a scripted fixture.

The default is OpenRouter’s documented **openrouter/free** router. It selects compatible free models; actual identity is recorded in the trace. Fixed free Gemma endpoints returned upstream 429s during development. Smaller token limits on thinking routes exhausted reasoning before producing JSON. Hosted thinking output is bounded at 4096 total tokens, with a requested 1024 reasoning budget; fixed Gemma routes request thinking off and 320 tokens. Provider support and latency vary. No paid fallback is enabled.

The earlier openrouter.json experiment contains a successful but slower 44.449-second reply after retries. case-openrouter.json is the later, current-boundary API check. openrouter-paid-smoke.json is a separate earlier three-turn paid Gemma test reporting $0.00043855 before the project adopted free-only routes. Do not describe that as free inference.

## Current local model check

**case-local-gemma-current.json** verifies the final one-fragment policy: two actual turns, 6.089 s and 1.788 s, both validated. The first recalled the knocks; after the door-log attachment, the second recalled a wet coat. Neither named the killer.

**case-local-gemma.json** contains two real murder-case Nora turns using `gemma4:e2b-it-q4_K_M`: **5.360 s and 1.996 s**, both validated. They preceded the final one-fragment prompt refinement; the output listed too many clues, prompting narrower grounding. They are not a benchmark of the final hint policy. Deterministic tests separately prove the private-state/report mechanics.

## Current voice

**elevenlabs-case.json** supersedes the earlier broadcaster recording for the game. Premade **Lily — Velvety Actress**, `eleven_v3_conversational`, hushed/rushed delivery, speed **1.14**, stability **0.5**. One real **150-character** render took **1.927 s**. The audio is **11.84 s**, **190,632 bytes**. Cached replay returned identical bytes and made no second generation request.

The immediate account billing counter was unchanged. Reporting can lag and the account can be used elsewhere; this does not establish a zero invoice charge. No human naturalness rating is claimed. The MP3 remains in ignored local storage. Transcript, voice, model and delivery settings participate in its cache key. The old Daniel/192-character evidence remains historical and is no longer the game’s call.

## Earlier prototype hardware benchmark

Model: `gemma4:e2b-it-q4_K_M`, digest `b37049369adfe3d2b653af0ab301a062ca5cbe96ace6aa0d3f2559ee9b563fc2`. Ollama 0.40.11 / llama.cpp, Q4_K_M, 4096 context, 320 output tokens, thinking off, temperature 0.85, one request at a time.

An initial nine-request run had 9/9 successes: first request **7.370 s**, median **1.667 s**, 6,423 input / 729 output tokens. A subsequent warm run had 9/9 successes: median **1.635 s**, maximum **2.280 s**, 7,155 input / 677 output, runner-reported 48.8–71.4 generated tokens/s. Small application-shaped samples, not model-wide throughput claims.

macOS vmmap measured about **5.1 GiB physical process footprint**. The runner’s allocation metadata underreported it; that metadata is not a RAM measurement. The evidence files preserve both the actual model configuration and OS report.

The timed five-minute prototype check lasted 300,002 ms: eleven turns (eight autonomous, three visitor messages), 12,712 input / 865 output tokens, no failed turns, zero paid LLM requests, no ElevenLabs calls. It used a process-level fetch guard rejecting external hosts. This was not a system-wide Wi-Fi-off experiment. Electricity, hardware depreciation and precise voice invoice charges were not measured. Those records are not a five-minute Room 317 study.

## Bugs and limits

The operator once volunteered protected facts too early; prompting now withholds them until witnessed evidence introduces them. The local model once selected unseen record IDs; actor-specific decoding plus authoritative validation now rejects those proposals. Earlier failed transcripts are retained. Model text can still hallucinate, repeat or reverse speakers.

Games originally opened a nested desktop through Vite’s directory-URL SPA fallback. Explicit index.html entrypoints and rewritten Hocus navigation fixed it. Game audio initially escaped tray mute because detached Audio objects were not tracked; the host bridge now tracks played media. Synthetic Tab events do not perform native focus navigation, so Hocus’s host buttons implement the uncancelled focus/activation default explicitly.

No independent human study, Safari/Firefox coverage, Windows/Linux hardware benchmark, long-duration stability test or public multi-user live backend is claimed. The public Pages edition is explicitly scripted. The Node server is single-user and loopback-only. No Sentry, Entire, Render, Ultramarine or Mastra partner use is claimed.
