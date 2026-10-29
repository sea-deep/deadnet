# Development record

- October 29, 2026: started from an empty directory, no Git history. Verified Week 4 challenge, template, exact rules and deadline from official pages. GitHub CLI authenticated as sea-deep.
- Researched persistent-agent predecessors and retro desktops. Chose selective evidence routing as the differentiating mechanic; narrowed society to three accounts.
- Checked 16 GB ARM64 hardware. Found LM Studio serving an unrelated existing model; left it alone. Installed Ollama via Homebrew. The default Gemma 4 E2B tag chose a 7.5 GB MLX package, so explicitly selected Q4_K_M instead.
- Implemented schema-validated model proposals and typed hybrid engine; SQLite atomic snapshot and action journal; bounded memory, turn budgets, single-generation guard, recoverable failures.
- First engine regression pass found unfair rotation after a visitor-forced turn. Replaced raw tick-modulo scheduling with least-recently-active selection (addressed unread mail still takes precedence). Scoped private-memory test then passed.
- Implemented six applications reading one world; original pixel-grid assets and synthesized optional system tones; mobile single-window composition; inspectable provenance.
- Browser automation initially could read screenshots but could not write to the workspace through its server-side path policy. Local Playwright is used for reproducible on-disk captures; no path-policy bypass.

Further verification results and measured failures are recorded in evidence/ and benchmarks, not invented here.
