import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { Engine } from "../server/engine.ts";
import { Store } from "../server/store.ts";
import { BaselineModel } from "../server/baseline.ts";
import { AudioService } from "../server/audio.ts";
const store = new Store(".data/voice-verification.sqlite");
const engine = new Engine(store, new BaselineModel());
await engine.dispatch({ type: "reset" });
await engine.dispatch({ type: "collect", evidenceId: "birthday" });
const event = engine.world().events.find((e) => e.audioTranscript)!;
if (!event) throw new Error("Recovered voicemail missing.");
async function usage() {
  try {
    const r = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j.character_count as number;
  } catch {
    return null;
  }
}
const before = await usage();
const audio = new AudioService(store);
const n1 = (
  store.db.prepare("SELECT count(*) n FROM voice_usage").get() as { n: number }
).n;
const start = performance.now();
const bytes = await audio.speech(event);
const ms = Math.round(performance.now() - start);
const after = await usage();
const repeat = performance.now();
const bytes2 = await audio.speech(event);
const repeatMs = Math.round(performance.now() - repeat);
const n2 = (
  store.db.prepare("SELECT count(*) n FROM voice_usage").get() as { n: number }
).n;
mkdirSync(".data", { recursive: true });
writeFileSync(".data/line03.mp3", bytes);
const report = {
  measuredAt: new Date().toISOString(),
  provider: "ElevenLabs",
  model: process.env.ELEVENLABS_MODEL || "eleven_flash_v2_5",
  voice: "Daniel — Steady Broadcaster (premade licensed library voice)",
  voiceId: process.env.ELEVENLABS_VOICE_ID,
  transcript: event.audioTranscript,
  characters: event.audioTranscript!.length,
  firstPlaybackMs: ms,
  cachedPlaybackMs: repeatMs,
  bytes: bytes.length,
  cacheBytesMatch: Buffer.from(bytes).equals(Buffer.from(bytes2)),
  generationRequests: n2 - n1,
  subscriptionCharacterCountBefore: before,
  subscriptionCharacterCountAfter: after,
  observedCreditDelta:
    before !== null && after !== null ? after - before : null,
  notes: [
    "Billing counter delta is observed account-wide usage, not a dollar invoice. Concurrent use can affect it.",
    "The second playback uses SQLite audio cache. No second generation is sent.",
    "Generated MP3 remains in ignored .data; not redistributed as a standalone asset.",
    "Narrative: a recovered operator voicemail contradicts the routine written status report. The complete transcript is accessible without paid voice.",
  ],
};
writeFileSync("docs/evidence/elevenlabs.json", JSON.stringify(report, null, 2));
store.close();
console.log(JSON.stringify(report, null, 2));
