# Partner decisions and proof required

The official Week 4 page lists all of these tracks. Selection is based on the finished implementation, not the number of SDKs installed.

| Track | Contribution / decision | Complexity, running cost, risk | Required evidence |
| --- | --- | --- | --- |
| Gemma | Primary: local model decides social interpretations, disclosure recipients, stance, memories, trust | Low integration; no inference fee; laptop RAM/latency and story fidelity are the risks | Real output with installed tag/digest/quantization, timing/token results, society/restart tests, prompts and limits |
| ElevenLabs | Verified: one recovered fictional voicemail rendered by ElevenLabs; textual denial and an intimate spoken record can be compared | Server-only POST, cached by text+voice+model; max 10 fresh requests per installation, 900 chars each; provider credits and network needed; failure preserves transcript | One actual 192-character request, 1.062 s render, identical cached replay, Daniel premade voice; immediate billing counter unchanged, precise charge unmeasured |
| Sentry Agent Tracing | Deferred. Local traces already measure tokens/latency/actions/source IDs | Adds cloud telemetry and user-content privacy decisions; free/paid plan depending on usage | Actual Sentry agent spans and debugging evidence. Local traces do not qualify. |
| Entire | Deferred; development work recorded in Git and a factual development log | CLI/session capture could expose private session content and requires setup | Actual Entire session; do not claim Git alone qualifies |
| Ultramarine | Rejected for core; a remote archive analyst would duplicate the investigator’s reasoning and weaken the local premise | Additional key, API cost and cloud dependency; high narrative dilution | Real analysis of records and measured cost; none claimed |
| Mastra | Rejected: bounded three-agent engine needs no extra orchestrator | Runtime and persistence abstraction complexity; no necessary runtime fee | Meaningful orchestration use, not a package import |
| Render | Rejected for core inference: local Ollama is on the visitor’s laptop | GPU hosting costs / connection complexity | A functioning Render-hosted component; GitHub Pages does not qualify |
| TabPFN | No meaningful tabular prediction task | Extra model and unneeded feature | Real prediction problem, not fabricated metrics |
| Tinker | No model training needed | Training credit and scope | Actual training run and useful improvement |
| Arduino | No physical hardware requirement | Hardware and time | Real hardware interaction |
| DigitalOcean | No necessary hosted runtime | Hosting bill and extra deployment path | Working deployment on provider |
| Auth0 for AI Agents | Local single-user world has no external authenticated tools | Identity complexity | Actual protected agent authorization |
| Backboard | Local SQLite intentionally owns the tiny memories | Hosted dependency | Meaningful provider memory/tool use |
| Browserbase | Fictional web, not an agent controlling real websites | Hosted browsing expense | Real useful browser workflow |
| GitHub Copilot | Build uses Codex; do not claim another coding agent | Tool availability | Actual Copilot development evidence |
| MongoDB Atlas | Three agents do not need a cloud database | Free tier possible, connectivity/key risk | Real Atlas persistence |
| SerpApi | Real search would break the fictional closed-world archive | API key and search bill | Useful live search within app |
| .tech domain | Optional future address; not necessary | Renewal/payment/ownership | Claimed domain live and linked |
| Temporal | Atomic turns and deliberate retry cover current scope | Service/worker overhead | Real durable workflow beyond existing local transaction |
| Tiger Data | No embeddings at this scale | Hosted DB and key | Actual hybrid/vector search problem |

No partner skill gateway was connected. No third-party sponsor skills were installed. Official primary API/model docs were used instead. No promo codes were claimed or inventory consumed.

OpenRouter is an optional hosted transport for open-weight models, not an additional claimed partner category. A three-turn paid Gemma smoke test before the free-only restriction reported $0.00043855 in usage fields. The current adapter rejects paid IDs and has persistent quota/cooldown protection. Free Gemma generation was blocked by the upstream shared pool during the final check; key authentication alone is not a successful model test. Public hosted inference is not deployed.

Room 317: local Gemma is verified for Nora’s private dialogue. The default hosted route is now OpenRouter’s free-only router, with an actual Dots3-Note Preview response recorded in case-openrouter.json (13.820 s, one attempt, provider-reported $0). Current ElevenLabs evidence is elevenlabs-case.json: Lily premade voice, eleven_v3_conversational, 150 characters, 1.927 s render, 11.84 s clip and identical cached replay. The earlier Daniel/Gemma paid/free-failure artifacts remain historical, not claims about this current recording/request.
