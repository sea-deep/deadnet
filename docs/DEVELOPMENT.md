# Development record

- October 29, 2026: started from an empty directory, no Git history. Verified Week 4 challenge, template, exact rules and deadline from official pages. GitHub CLI authenticated as sea-deep.
- Researched persistent-agent predecessors and retro desktops. Chose selective evidence routing as the differentiating mechanic; narrowed society to three accounts.
- Checked 16 GB ARM64 hardware. Found LM Studio serving an unrelated existing model; left it alone. Installed Ollama via Homebrew. The default Gemma 4 E2B tag chose a 7.5 GB MLX package, so explicitly selected Q4_K_M instead.
- Implemented schema-validated model proposals and typed hybrid engine; SQLite atomic snapshot and action journal; bounded memory, turn budgets, single-generation guard, recoverable failures.
- First engine regression pass found unfair rotation after a visitor-forced turn. Replaced raw tick-modulo scheduling with least-recently-active selection (addressed unread mail still takes precedence). Scoped private-memory test then passed.
- Implemented six applications reading one world; original pixel-grid assets and synthesized optional system tones; mobile single-window composition; inspectable provenance.
- Browser automation initially could read screenshots but could not write to the workspace through its server-side path policy. Local Playwright is used for reproducible on-disk captures; no path-policy bypass.

Further verification results and measured failures are recorded in evidence/ and benchmarks, not invented here.

- User feedback changed the visual direction: sourced W95FA/VT323, actual Yahoo/Netscape references, Fugue PNG icons, 98.css shell adaptation, plain editable Notepad, full BIOS/power sequence, forest photo and CC0 ambience. Removed repeated technical marketing copy and abandoned the demo video at the user’s request.
- Vendored six MIT games with pinned revisions and visible author credits. The initial iframe directory URL opened the desktop recursively through Vite’s SPA fallback. Explicit index.html URLs and rewritten Hocus routes fixed it. Verified real gameplay starts in Chrome.
- ElevenLabs configured from the explicitly authorized sibling project key; no key was logged or committed. One Daniel-voice render was measured and reused from SQLite cache; UI playback checked.
- Added OpenRouter open-weight transport and persistent free-account caps. Strict json_schema routing was unsupported by the chosen free Gemma endpoint, so hosted requests use JSON mode plus actor-specific prompt schema and authoritative server validation. Some alternative free endpoints require reasoning; removed the blanket reasoning-disable parameter. Gemma’s shared free provider pool nevertheless returned 429. Kept that failure visible instead of silently using a paid route.
- Added burst/day limits, upstream cooldown persistence, free-model-only validation, reset resistance and no-retry-on-429 tests. Changed development to tsx watch including .env so backend settings reload. Removed unused cloud-deployment tooling and its audit findings. Public hosted inference remains unshipped; existing Pages exhibition stays explicitly scripted.
