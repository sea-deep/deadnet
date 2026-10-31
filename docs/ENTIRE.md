# Codex development, recorded with Entire

DEADNET uses [Entire CLI](https://github.com/entireio/cli) to preserve the actual Codex work behind the game. It is a development integration, not another service a player needs to sign into.

The October 31 session found an evidence-boundary bug: the spare-key photo's model-facing description also supplied the motive from a different conversation. The fix separates the records and removes a later memory hint that named the key's owner before Nora had seen the photograph. Regression tests exercise all eight combinations of witnessed evidence, the delayed memory, and invented dialogue that cannot alter the authored case. The same change pins hosted inference to free Gemma.

## What is captured

Entire CLI 0.12.2 is installed. `.entire/settings.json` enables checkpoint refs with telemetry and automatic transcript uploads disabled. `.codex/hooks.json` contains the official Codex hooks. Git hooks are installed in this checkout; a fresh clone must run `entire enable` to install its own Git hooks.

This Codex Desktop conversation began before hook installation, so its real rollout is attached using Entire's supported `session attach` command. The checkpoint links prompts, tools, file changes and the resulting commit. This is not a reconstructed chat or a claim that Entire recorded the earlier commits live.

The public session excerpt and exact checkpoint/commit identifiers are recorded below after capture. Raw checkpoints remain local because the long conversation also contains unrelated setup context. The excerpt omits private setup and internal reasoning; quoted dialogue and test output come from the actual session.

## Inspect or continue

```sh
brew install --cask entireio/tap/entire
entire enable --yes --agent codex --telemetry=false --skip-push-sessions
entire status
entire checkpoint list
entire checkpoint explain <checkpoint-id> --no-pager
```

New automatic Codex hooks require approval in Codex's `/hooks` interface. This checkout reports `trust_review_needed`; manual session attachment works without changing that trust setting. Checkpoint capture and inspection do not call OpenRouter or ElevenLabs. No AI-generated Entire summary is requested.

For a session that started before setup, commit its actual work first, then use `entire session attach <session-id> --agent codex`. Entire adds a checkpoint trailer to an unpublished commit; it can link an already-published commit without rewriting its history. Keep transcript uploads off while reviewing the result. See the official [Codex integration](https://docs.entire.com/agents/codex) and [session attachment guide](https://docs.entire.com/guides/sessions/attach-sessions).
