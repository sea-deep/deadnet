# DEADNET

Three accounts still use a network that lost its last outside connection fifty years ago. Read their mail, open old files, and decide who should learn what happened. A character can pass your private discovery to somebody else.

![DEADNET desktop](docs/evidence/desktop-new.png)

[Play the exhibition](https://sea-deep.github.io/deadnet/) · [Submission article](docs/SUBMISSION.md) · [Measurements](docs/VERIFICATION.md) · [Credits](docs/CREDITS.md)

**The public exhibition is explicitly scripted.** The full Node application supports hosted open-weight Gemma through OpenRouter, or Gemma running locally through Ollama. Failed live requests never become scripted dialogue automatically.

## Run

Node 22.13+ and npm are required. Tested on an Apple M5 / 16 GiB Mac.

```sh
git clone https://github.com/sea-deep/deadnet.git
cd deadnet
npm ci
cp .env.example .env
npm run dev
```

Open http://127.0.0.1:3000 and press **Power on**. Start → System Monitor lets you select the clearly labeled deterministic baseline without a key.

For hosted inference, set `MODEL_PROVIDER=openrouter`, `OPENROUTER_API_KEY`, and `OPENROUTER_MODEL=google/gemma-4-31b-it:free` in `.env`. Keep the key server-side. The adapter rejects model IDs without `:free`, with **no paid fallback**. Free-provider capacity can be unavailable even with valid credentials; a provider 429 pauses requests for at least a minute. On October 29, the Gemma free pool was returning upstream capacity limits. This is documented rather than presented as a successful free inference run.

For fully local inference:

```sh
ollama serve
# In another terminal:
ollama pull gemma4:e2b-it-q4_K_M
```

Set `MODEL_PROVIDER=ollama` and `OLLAMA_MODEL=gemma4:e2b-it-q4_K_M` in `.env`. This explicit 4.6 GB Q4_K_M package was measured, unlike the generic tag that can select another distribution. No weights ship in Git. A local OpenAI-compatible server adapter is also implemented (`MODEL_PROVIDER=local`, `LOCAL_MODEL_URL`, `LOCAL_MODEL`), but it has not been independently benchmarked.

The development server reloads backend code and `.env`. For production locally: `npm run build && npm start`.

## The computer

- Internet: an early-web neighborhood feed and directory.
- Inbox: private correspondence, attachments, and an ElevenLabs voicemail with a readable transcript.
- My Documents: three recovered files, ordinary Send To controls, and lasting sharing permissions.
- Address Book: the three people who still answer.
- Notepad: editable, persistent scraps left by a previous visitor. No investigation checklist.
- Games: **Snake, Flappy Bird, Tetris, 2048, Phantomicus, and Hocus :focus**, adapted from credited MIT projects. They open directly inside this desktop.
- System Monitor: live model identity, request allowance, actual inference traces, export/reset and bounded autonomy.

The BIOS/startup animation, frozen 03:17 clock, dark forest photograph, quiet sourced horror ambience, disk/line sounds, and recovered notes carry the atmosphere. Sound starts after the power-button gesture; disable it before boot or use the tray mute. Mute persists. Hidden tabs pause ambience, and games take over the soundscape while focused. Reduced motion is available in Start. No flashing overlays.

Windows drag, resize, maximize, minimize and close. Title-bar arrow keys move a window; Enter maximizes it. Small screens use one maximized window and single-tap shortcuts. Games retain their original input requirements; Snake and Flappy support touch, while some games work best with a keyboard.

## Simulation

One shared model serves three independently scoped accounts. SQLite commits the world and revision atomically. The engine controls scheduling, record access, delivery, budgets and endings. The model proposes words, stance, a bounded trust change, a subjective memory, disclosed known records and a recipient. Validated output becomes another account’s input.

A file you open does not inform every character. Only addressed mail or a public post can carry it. Twelve memories are retained per character; eight recent memories and three exact private visitor notes enter a bounded prompt. Objective facts and subjective beliefs remain distinct. The operator’s protected records stay out of ordinary prompts until witnessed evidence introduces them.

One request runs at a time. Local requests use 4096 context / 320 output tokens and a 45-second timeout. Live output gets at most two attempts. Eighteen story turns require explicit renewal; autonomous turns run at most once every 35 seconds while a visitor is connected. Hosted requests additionally have persistent caps: **2/minute and 8/day for the local visitor; 5/minute and 30/day account-wide**, counted per provider attempt. Resetting the world does not reset provider quotas or cooldowns. Days reset at 00:00 UTC. These are installation-level limits, not a multi-tenant identity system.

The model has no shell, filesystem, browser or external messaging tools. Server validation rejects unknown evidence IDs and invalid recipients. Text may still hallucinate, repeat, or confuse speakers; validation is not a truth oracle.

## ElevenLabs

Set `ELEVENLABS_API_KEY`, a licensed `ELEVENLABS_VOICE_ID`, and optionally `ELEVENLABS_MODEL=eleven_flash_v2_5` in `.env`. The verified configuration uses the premade Daniel voice. Opening HAPPY_BIRTHDAY.EML restores the attachment. Then open **Inbox → LINE03.WAV → Listen as voicemail**. Its transcript is always accessible.

The recording is authored fiction, rendered by ElevenLabs, not live voice chat. Cache keys include transcript/voice/model. Concurrent duplicates share a request; cached playback makes no further provider call. Ten fresh renders per installation, 900 characters maximum each. Real evidence: [one 192-character render, 1.062s, cached identical replay](docs/evidence/elevenlabs.json). The immediate billing counter was unchanged; that is not proof of a zero charge. No generated recording or credential is in the public repository.

## Verify and rebuild

```sh
npm test                      # 16 simulation/audio/quota/provider tests
npm run build                 # type check + production frontend
npm run demo:build            # explicit scripted exhibition
npx playwright install chrome
npm run test:e2e              # desktop/mobile investigation and shell
npm run games:build           # rebuild all credited games from third_party/
npx tsx scripts/check-games.ts # needs local server; real game interactions
npm run benchmark             # explicit real Ollama generations
npm run verify:live            # explicit real society/memory verification
```

[Verification](docs/VERIFICATION.md) includes the real local model digest, token/latency results, 5.1 GiB process footprint, five-minute session, privacy checks, voice measurements, browser results and honest limits. CI needs no paid key or downloaded weights. npm audit reports zero vulnerabilities at this revision.

## Data and release

The full app is **single-user and loopback-only**. `.data/deadnet.sqlite` holds world state, quotas and cached audio. Exports may contain messages you wrote. Do not expose this installation through a public tunnel. The public GitHub Pages exhibition stores its scripted world in the visitor’s browser and has no server keys or live AI. Public hosted inference is not deployed.

The repository began October 29, 2026. Code is MIT; borrowed software, fonts, imagery and sound retain their own licenses. [Third-party code](docs/THIRD-PARTY.md) · [visual references](docs/research/VISUAL-REFERENCES.md) · [judge audit](docs/JUDGE-AUDIT.md).

Built and written with Codex assistance. The [DEV article](docs/SUBMISSION.md) is ready for entrant review and remains unpublished. Final publication needs the entrant’s approval because only the first entry is considered. Deadline: October 31, 2026, 23:59 PDT / November 1, 12:29 IST. No demo video is required or included.
