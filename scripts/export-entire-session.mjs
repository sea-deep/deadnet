// Export visible messages and test summaries from a real, locally stored checkpoint.
// Never publish the raw rollout: it also contains private setup and internal context.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parse } from "dotenv";

const [checkpoint, since] = process.argv.slice(2);
if (
  !/^[A-Z0-9]{26}$|^[a-f0-9]{12}$/.test(checkpoint || "") ||
  !Number.isFinite(Date.parse(since))
)
  throw new Error(
    "Usage: node scripts/export-entire-session.mjs CHECKPOINT SINCE_ISO_TIMESTAMP",
  );
const run = (command, args) =>
  execFileSync(command, args, {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
const metadata = JSON.parse(
  run("entire", ["checkpoint", "explain", checkpoint, "--json"]),
);
const transcript = run("entire", [
  "checkpoint",
  "explain",
  checkpoint,
  "--transcript",
]);
const commit = run("git", [
  "log",
  "-1",
  "--format=%H",
  `--grep=Entire-Checkpoint: ${checkpoint}`,
]).trim();
if (!commit)
  throw new Error("Checkpoint has no linked commit in the current branch.");
const rows = transcript
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));
const sourceRoot = rows.find((row) => row.type === "session_meta")?.payload
  ?.cwd;
if (!sourceRoot)
  throw new Error("Checkpoint is missing its original workspace path.");
const messages = [];
const edits = [];
const summaries = new Map();
function* strings(value) {
  if (typeof value === "string") {
    try {
      yield* strings(JSON.parse(value));
    } catch {
      yield value;
    }
  } else if (Array.isArray(value)) {
    for (const item of value) yield* strings(item);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) yield* strings(item);
  }
}
for (const row of rows) {
  if (!row.timestamp || Date.parse(row.timestamp) < Date.parse(since)) continue;
  const p = row.payload || {};
  if (
    row.type === "response_item" &&
    p.type === "custom_tool_call" &&
    ["exec", "functions.exec"].includes(p.name)
  ) {
    const match = p.input.match(/tools\.apply_patch\(("(?:[^"\\]|\\.)*")\)/);
    if (match) {
      const patch = JSON.parse(match[1]);
      if (
        patch.includes("server/seed.ts") &&
        patch.includes("Combined with Nora")
      ) {
        const start = patch.indexOf(
          `*** Update File: ${sourceRoot}/server/seed.ts`,
        );
        if (start < 0)
          throw new Error(
            "Could not identify the evidence-boundary patch hunks.",
          );
        edits.push({
          timestamp: row.timestamp,
          callId: p.call_id,
          patch: `*** Begin Patch\n${patch.slice(start)}`.replaceAll(
            `${sourceRoot}/`,
            "",
          ),
        });
      }
    }
  }
  if (
    row.type === "response_item" &&
    p.type === "message" &&
    ["user", "assistant"].includes(p.role)
  ) {
    const text = (p.content || [])
      .map((c) => c.text || "")
      .join("\n")
      .trim();
    if (
      text &&
      text.length < 1200 &&
      !text.startsWith("<") &&
      !text.startsWith("# Files")
    )
      messages.push({ timestamp: row.timestamp, role: p.role, text });
  }
  if (row.type === "response_item" && p.type === "custom_tool_call_output") {
    for (const text of strings(p.output)) {
      const lines = text.split("\n");
      if (/ℹ tests 39/.test(text)) {
        summaries.set("node", {
          timestamp: row.timestamp,
          callId: p.call_id,
          output: lines
            .filter(
              (line) =>
                /^ℹ (tests|pass|fail|cancelled|skipped) /.test(line) ||
                /^✔ (every Nora evidence subset|a late ungrounded memory|invented prose|hosted default)/.test(
                  line,
                ),
            )
            .join("\n"),
        });
      }
      if (/38 passed \(/.test(text))
        summaries.set("browser", {
          timestamp: row.timestamp,
          callId: p.call_id,
          output: lines.find((line) => /38 passed \(/.test(line)).trim(),
        });
    }
  }
}
if (
  !messages.some((m) => m.role === "user") ||
  summaries.size !== 2 ||
  !edits.length
)
  throw new Error(
    "Selected scope is missing the user request, actual edit or test summaries.",
  );
const result = {
  format: "deadnet-entire-session-excerpt-v1",
  checkpointId: checkpoint,
  sessionId: metadata.sessions[0].session_id,
  agent: "Codex",
  commit,
  commitUrl: `https://github.com/sea-deep/deadnet/commit/${commit}`,
  sourceTranscriptSha256: createHash("sha256").update(transcript).digest("hex"),
  scope: {
    since,
    editedForLength: true,
    omitted: [
      "Earlier conversation",
      "Private setup",
      "Internal reasoning and system context",
      "Unrelated tool output",
    ],
    note: "Visible messages, test-result lines and selected evidence-boundary edit hunks from Entire's redacted stored transcript. Patch file paths are normalized to repository-relative paths. No generated replacement dialogue or inferred provider measurements.",
  },
  files: run("git", [
    "diff-tree",
    "--no-commit-id",
    "--name-only",
    "-r",
    commit,
  ])
    .trim()
    .split("\n"),
  messages,
  edits,
  verification: Object.fromEntries(summaries),
};
const json = JSON.stringify(result, null, 2) + "\n";
if (existsSync(".env")) {
  const env = parse(readFileSync(".env"));
  for (const [key, value] of Object.entries(env))
    if (
      /KEY|TOKEN|SECRET|PASSWORD/i.test(key) &&
      value.length > 8 &&
      json.includes(value)
    )
      throw new Error("Secret detected in excerpt; nothing exported.");
}
if (/sk-or-v1-[a-f0-9]{20,}/i.test(json))
  throw new Error("Provider credential detected; nothing exported.");
writeFileSync("docs/evidence/entire-session.json", json);
const md = [
  "# Recorded Codex session excerpt",
  "",
  `Entire checkpoint: \`${checkpoint}\`. [Linked implementation commit](${result.commitUrl}).`,
  "",
  "These are visible messages and test-result lines exported from the native Entire checkpoint. Earlier conversation, private setup, internal reasoning and unrelated tool output are omitted. The complete checkpoint stays local; the JSON export includes its transcript digest.",
  "",
  ...messages.flatMap((m) => [
    `**${m.role === "user" ? "Dipak" : "Codex"} · ${m.timestamp}**`,
    "",
    ...m.text.split("\n").map((line) => (line ? `> ${line}` : ">")),
    "",
  ]),
  "## Actual edit preserved in the checkpoint",
  "",
  ...edits.flatMap((edit) => [
    `**Codex tool call · ${edit.timestamp}**`,
    "",
    "Selected evidence-boundary hunks from Entire's stored, redacted patch. Paths normalized to repository-relative paths.",
    "",
    "```diff",
    edit.patch,
    "```",
    "",
  ]),
  "## Test output preserved in the checkpoint",
  "",
  ...Object.entries(result.verification).flatMap(([name, entry]) => [
    `**${name} · ${entry.timestamp}**`,
    "",
    "```text",
    entry.output,
    "```",
    "",
  ]),
  "[Machine-readable excerpt](entire-session.json). Regenerate from the local checkpoint:",
  "",
  "```sh",
  `node scripts/export-entire-session.mjs ${checkpoint} ${since}`,
  "```",
  "",
].join("\n");
writeFileSync("docs/evidence/entire-session.md", md);
console.log(
  `Exported ${messages.length} actual messages and ${summaries.size} test summaries from ${checkpoint}.`,
);
