import { test } from "node:test";
import assert from "node:assert/strict";
import { Store } from "../server/store.ts";
import { Quota } from "../server/quota.ts";
import { seedWorld } from "../server/seed.ts";
test("free quota counts attempts, throttles bursts, survives reset, and recovers at the boundary", () => {
  const store = new Store(":memory:"),
    q = new Quota(store),
    now = 86400000 * 100 + 1000;
  q.consume("alice", now);
  q.consume("alice", now);
  assert.throws(() => q.consume("alice", now));
  assert.equal(q.state("alice", now).globalUsed, 2);
  store.reset(seedWorld());
  assert.equal(q.state("alice", now).visitorUsed, 2);
  q.consume("alice", now + 60000);
  assert.equal(q.state("alice", now).visitorUsed, 3);
  store.close();
});
test("shared ceiling prevents visitor IDs or new investigations from bypassing account protection", () => {
  const store = new Store(":memory:"),
    q = new Quota(store),
    day = 86400000 * 100;
  for (let i = 0; i < 30; i++) q.consume("visitor-" + i, day + i * 60000);
  assert.throws(() => q.consume("fresh-visitor", day + 31 * 60000));
  assert.equal(q.state("new", day).globalUsed, 30);
  q.consume("new", day + 86400000);
  assert.equal(q.state("new", day + 86400000).globalUsed, 1);
  store.close();
});
test("provider cooldown survives a new Quota instance and is checked before charging an attempt", () => {
  const store = new Store(":memory:"),
    q = new Quota(store),
    now = Date.now();
  q.cooldown(60);
  const reopened = new Quota(store);
  assert.throws(
    () => reopened.consume("alice", now),
    (e) => e instanceof Error && "status" in e && e.status === 429,
  );
  assert.equal(reopened.state("alice", now).globalUsed, 0);
  reopened.consume("alice", now + 61000);
  assert.equal(reopened.state("alice", now + 61000).globalUsed, 1);
  store.close();
});
