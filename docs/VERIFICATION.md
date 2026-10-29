# Verification record

All measurements below are from the actual Apple M5 / 16 GiB machine on October 29, 2026. Development and evidence timestamps are real. The fictional network’s clock is intentionally unrelated.

## Automated gates

- Sixteen Node engine/audio/quota/provider tests pass: multi-character evidence propagation and restart persistence; private-memory isolation; locked-file discovery; permanent public disclosure; finite budgets; invalid model output; provider failures without fallback; write serialization; protected-operator prompting; unknown evidence rejection; audio caching/concurrent deduplication; failed audio not poisoning cache.
- Four real Chrome browser scenarios pass across 1440×900 desktop and 390×844 mobile configurations: complete recovery/disclosure/ending, restart/reload persistence, window minimize/restore/maximize/keyboard moves, search, reduced motion, action validation and cross-origin-write rejection. The browser society uses a disclosed deterministic adapter, so CI needs no model or paid key.
- TypeScript and production/exhibition builds pass. npm audit reports zero vulnerabilities after removing unused hosting tooling. Browser errors were checked by the investigation scenario.
- First browser failures exposed a shared HMR port conflict, desktop-shortcut obstruction beneath maximized windows, and missing names on compact toolbar buttons. HMR ports are now distinct; tests navigate through the functioning Start menu; icon buttons have names.
- Visual captures cover boot, feed, mailbox, archive, monitor, and mobile feed/archive. Actual Yahoo 1998 and Netscape inbox screenshots informed the revision. Minimum text audit found a 9 px mail-count badge; it was raised to 13 px. Main story text is 17–18 px W95FA, with 18 px VT323 diagnostics. No modern serif fonts or handcrafted SVG artwork remain.

## Local inference benchmark

Model: `gemma4:e2b-it-q4_K_M`. Digest: `b37049369adfe3d2b653af0ab301a062ca5cbe96ace6aa0d3f2559ee9b563fc2`. GGUF Q4_K_M through Ollama 0.40.11 / llama.cpp runner. 4096 context, maximum 320 output tokens, thinking disabled, one request at a time, temperature 0.85.

An initial nine-request run measured **7.370 seconds on its first request**, **1.667 seconds median**, 9/9 successful structured responses, 6,423 input / 729 output tokens. The model had just been loaded; this is first-load evidence, not a repeated cold-start study.

A subsequent warm nine-request run measured **1.635 seconds median**, **2.280 seconds maximum**, 9/9 successes, **7,155 input / 677 output tokens**, and 48.8–71.4 generated tokens/sec as reported by the runner. These are small application-shaped samples, not a general quality/performance benchmark. Prompt revisions and additional eight-turn society tests are separately preserved. See benchmark-initial.json and benchmark.json.

`/api/ps` reported about 342 MB of allocation, which was not a credible total RAM figure. macOS `vmmap -summary` on the actual llama-server process measured **5.1 G physical footprint (5.1 G peak at observation)**. Its report also shows swapped pages under this machine’s actual multi-application workload. This is not whole-system memory or an isolated dedicated-machine peak. The downloaded package occupies about 4.6 GB. E4B/12B and alternate runtimes were researched, not benchmarked; there is no fabricated speed comparison.

## Live society and memory

The saved `live-society.json` contains eight genuine model turns and their traces. All eight validated successfully in the final checked run. A record privately given to Mara later appeared in her public post, with the model selecting the `carrier` evidence ID. Len and the operator could then receive that public record. The local engine tests separately force a private Mara→Len rumor path for reproducible causal/persistence assertions.

A private silver-apricot disclosure was present in Len’s prompt and absent from Mara’s and the operator’s prompts. Len recalled the item in his response. He sometimes reverses the speaker (“what I told you” rather than “what you told me”); the exact stored disclosure stays intact. This small model is not a perfect storyteller.

An earlier live run exposed two real faults. The operator volunteered a reconstruction secret before the visitor found it. Its protected administrative knowledge is now withheld from generation until confronted by a witnessed record. After explicit evidence IDs were added, the model sometimes selected IDs it had never seen. Actor-specific constrained schemas now restrict the available IDs at decoding time, and server validation rejects any invalid proposal. Earlier failure evidence is retained for transparency. Textual hallucination is still possible; schema validation is not a truth oracle.

## Voice evidence

One real ElevenLabs `eleven_flash_v2_5` request rendered the 192-character LINE03 voicemail using the premade Daniel library voice. First rendering took **1.062 seconds**; the cached replay took **0 ms at timer resolution**, with identical 238,697 bytes and **no second generation request**. Audio remains in the ignored cache; the local UI plays that same cached recording.

The immediate account billing counter did not change. That does **not** prove the request was free; reporting can lag and account-level concurrent use is possible. No precise dollar charge is claimed. Request/character counts and the observed counter values are in elevenlabs.json. No subscription price, key, or private account details are published. Provider timeout/error handling and cache deduplication are independently tested without spending credits.

## Offline and cost boundary

In Ollama mode, the core only calls the local runner. The five-minute verification process wraps fetch to reject every host except loopback and records all allowed requests. This proves local core operation under an application-level external-egress block, not a system-wide airplane-mode test. Dependencies/model/fonts/images are installed locally first. Optional ElevenLabs generation requires internet; already cached audio does not. The hosted exhibition uses localStorage rather than SQLite and deterministic fixtures rather than Gemma.

The five-minute-session.json artifact records the actual timed eight autonomous turns plus three visitor messages, token totals, generation time, failures, and zero paid LLM requests. Electrical energy, hardware depreciation, and exact voice invoice charges were not measured.

## Not tested / limits

No independent human usability study was conducted. The developer used fresh browser contexts and task-based tests as a simulated first-visit review. Linux and Windows hardware, Safari/Firefox, the local OpenAI-compatible adapter, and long-duration multi-day stability have not been independently tested. The application is single-user and loopback-only. No Sentry, Entire, Render, Ultramarine, or Mastra prize use is claimed.

## Final desktop/game pass

All four desktop/mobile investigation and shell tests were rerun against the ordinary Inbox/My Documents/Notepad UI: 4/4 passed. A separate real Chrome pass interacted with all six vendored games: Flappy reached playing state, Tetris started, 2048 spawned a third tile, Snake rendered its board, Phantomicus rendered two canvases, and Hocus advanced to level 2. No page errors were recorded. The original nested-OS bug was Vite’s SPA fallback at directory URLs; explicit index.html entrypoints and rewritten Hocus links fix it. This is a smoke test, not complete game-level coverage.

The wallpaper is a credited photograph. The CC0 horror loop is locally served, with boot/mail/disk/line cues and persisted mute. Hidden tabs pause ambience; the host bridge propagates mute to game audio. Some games still need a keyboard.

## Hosted inference boundary

The OpenRouter key authenticates. An earlier real three-turn Gemma 4 31B smoke test succeeded and reported $0.00043855 before the project was restricted to free routes. Its evidence is openrouter-paid-smoke.json. It is not a free-run result.

The final default is google/gemma-4-31b-it:free. A minimal credential-backed request returned HTTP 429 with limit_source=upstream_provider_shared_pool from Google AI Studio. No successful free Gemma run is claimed. The service returns a useful retry error, persists a cooldown of at least 60 seconds, counts attempts against daily/burst caps, and never routes to a paid model. Unit tests verify that a throttle makes one request and that reset/reopening quota state cannot bypass the cooldown. Public GitHub Pages remains an explicitly scripted exhibition; the local server supports the hosted adapter but is not a public multi-user deployment.

Final sound browser assertions pass: ambience starts after the power gesture, pauses for focused games, and the tray mute reaches active game audio and the ambient loop. Font audit across all seven app windows found no visible text smaller than 13 px. A production exhibition served under /deadnet/ loaded the wallpaper and Snake with no HTTP or page errors. Reproducible reports: font-audit.json, sound-check.json and games-check.json.
