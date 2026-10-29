import { test } from "node:test";
import assert from "node:assert/strict";
import { Store } from "../server/store.ts";
import { AudioService } from "../server/audio.ts";
import { seedWorld } from "../server/seed.ts";
import type { Event } from "../src/types.ts";
test("voicemail cache deduplicates concurrent requests, replays locally, and rejects ordinary mail", async () => {
  const oldFetch = globalThis.fetch,
    oldKey = process.env.ELEVENLABS_API_KEY,
    oldVoice = process.env.ELEVENLABS_VOICE_ID;
  process.env.ELEVENLABS_API_KEY = "test-only";
  process.env.ELEVENLABS_VOICE_ID = "licensed-test-voice";
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    await new Promise((r) => setTimeout(r, 10));
    return new Response(new Uint8Array(1024).fill(1), {
      status: 200,
      headers: { "Content-Type": "audio/mpeg" },
    });
  };
  const store = new Store(":memory:"),
    service = new AudioService(store);
  const event: Event = {
    id: "voice-test",
    tick: 1,
    actor: "sysop",
    channel: "mail",
    to: "visitor",
    text: "Routine status.",
    audioTranscript: "The line has been silent for fifty years.",
    factIds: [],
    origin: "system",
  };
  try {
    const [a, b] = await Promise.all([
      service.speech(event),
      service.speech(event),
    ]);
    assert.equal(calls, 1);
    assert.deepEqual(a, b);
    await service.speech(event);
    assert.equal(calls, 1);
    await assert.rejects(
      service.speech(seedWorld().events.find((e) => e.channel === "mail")!),
    );
    assert.equal(calls, 1);
    assert.equal(
      (
        store.db.prepare("SELECT count(*) n FROM voice_usage").get() as {
          n: number;
        }
      ).n,
      1,
    );
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.ELEVENLABS_API_KEY;
    else process.env.ELEVENLABS_API_KEY = oldKey;
    if (oldVoice === undefined) delete process.env.ELEVENLABS_VOICE_ID;
    else process.env.ELEVENLABS_VOICE_ID = oldVoice;
    store.close();
  }
});
test("voice-provider failure never poisons the audio cache", async () => {
  const previous = globalThis.fetch,
    oldKey = process.env.ELEVENLABS_API_KEY,
    oldVoice = process.env.ELEVENLABS_VOICE_ID;
  process.env.ELEVENLABS_API_KEY = "test-only";
  process.env.ELEVENLABS_VOICE_ID = "test";
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });
  const store = new Store(":memory:"),
    service = new AudioService(store);
  const event: Event = {
    id: "failure",
    tick: 1,
    actor: "sysop",
    channel: "mail",
    to: "visitor",
    text: "A recording.",
    audioTranscript: "A recovered message.",
    factIds: [],
    origin: "system",
  };
  try {
    await assert.rejects(service.speech(event));
    assert.equal(
      (store.db.prepare("SELECT count(*) n FROM audio").get() as { n: number })
        .n,
      0,
    );
  } finally {
    globalThis.fetch = previous;
    if (oldKey === undefined) delete process.env.ELEVENLABS_API_KEY;
    else process.env.ELEVENLABS_API_KEY = oldKey;
    if (oldVoice === undefined) delete process.env.ELEVENLABS_VOICE_ID;
    else process.env.ELEVENLABS_VOICE_ID = oldVoice;
    store.close();
  }
});
