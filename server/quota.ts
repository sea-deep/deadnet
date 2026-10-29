import type { Store } from "./store.ts";
import { RuleError } from "./engine.ts";
export interface QuotaState {
  globalUsed: number;
  globalLimit: number;
  visitorUsed: number;
  visitorLimit: number;
}
const limit = (name: string, fallback: number) =>
  Math.max(1, Number(process.env[name]) || fallback);
/** Request caps, configurable so a hosted copy stays under the provider's free allowance. */
export const LIMITS = {
  globalMinute: limit("DEADNET_GLOBAL_PER_MINUTE", 5),
  globalDay: limit("DEADNET_GLOBAL_PER_DAY", 30),
  visitorMinute: limit("DEADNET_VISITOR_PER_MINUTE", 2),
  visitorDay: limit("DEADNET_VISITOR_PER_DAY", 8),
};
export class Quota {
  constructor(private store: Store) {
    store.db.exec(
      "CREATE TABLE IF NOT EXISTS inference_quota(scope TEXT NOT NULL,bucket TEXT NOT NULL,used INTEGER NOT NULL,PRIMARY KEY(scope,bucket))",
    );
  }
  cooldown(seconds: number) {
    this.store.db.exec(
      "CREATE TABLE IF NOT EXISTS inference_cooldown(id INTEGER PRIMARY KEY,until_ms INTEGER NOT NULL)",
    );
    this.store.db
      .prepare(
        "INSERT INTO inference_cooldown VALUES(1,?) ON CONFLICT(id) DO UPDATE SET until_ms=max(until_ms,excluded.until_ms)",
      )
      .run(Date.now() + seconds * 1000);
  }
  consume(visitor: string, now = Date.now()) {
    this.store.db.exec(
      "CREATE TABLE IF NOT EXISTS inference_cooldown(id INTEGER PRIMARY KEY,until_ms INTEGER NOT NULL)",
    );
    const blocked = this.store.db
      .prepare("SELECT until_ms FROM inference_cooldown WHERE id=1")
      .get() as { until_ms: number } | undefined;
    if (blocked && blocked.until_ms > now) {
      const seconds = Math.ceil((blocked.until_ms - now) / 1000);
      const e = new RuleError(
        `The free network is busy. Try again in ${seconds} seconds.`,
        429,
      );
      Object.assign(e, { retryAfter: seconds });
      throw e;
    }
    const minute = Math.floor(now / 60000),
      day = Math.floor(now / 86400000);
    const rules = [
      {
        scope: "global-minute",
        bucket: String(minute),
        limit: LIMITS.globalMinute,
        until: (minute + 1) * 60000,
      },
      {
        scope: "global-day",
        bucket: String(day),
        limit: LIMITS.globalDay,
        until: (day + 1) * 86400000,
      },
      {
        scope: "visitor-minute:" + visitor,
        bucket: String(minute),
        limit: LIMITS.visitorMinute,
        until: (minute + 1) * 60000,
      },
      {
        scope: "visitor-day:" + visitor,
        bucket: String(day),
        limit: LIMITS.visitorDay,
        until: (day + 1) * 86400000,
      },
    ];
    this.store.db.exec("BEGIN IMMEDIATE");
    try {
      for (const r of rules) {
        const row = this.store.db
          .prepare(
            "SELECT used FROM inference_quota WHERE scope=? AND bucket=?",
          )
          .get(r.scope, r.bucket) as { used: number } | undefined;
        if ((row?.used || 0) >= r.limit) {
          const seconds = Math.max(1, Math.ceil((r.until - now) / 1000));
          const e = new RuleError(
            `The network’s free allowance is busy. Try again in ${seconds < 120 ? `${seconds} seconds` : "the next daily allowance"}.`,
            429,
          );
          Object.assign(e, { retryAfter: seconds });
          throw e;
        }
      }
      for (const r of rules)
        this.store.db
          .prepare(
            "INSERT INTO inference_quota VALUES(?,?,1) ON CONFLICT(scope,bucket) DO UPDATE SET used=used+1",
          )
          .run(r.scope, r.bucket);
      this.store.db.exec("COMMIT");
    } catch (e) {
      this.store.db.exec("ROLLBACK");
      throw e;
    }
  }
  state(visitor: string, now = Date.now()): QuotaState {
    const bucket = String(Math.floor(now / 86400000));
    const used = (scope: string) =>
      (
        this.store.db
          .prepare(
            "SELECT used FROM inference_quota WHERE scope=? AND bucket=?",
          )
          .get(scope, bucket) as { used: number } | undefined
      )?.used || 0;
    return {
      globalUsed: used("global-day"),
      globalLimit: LIMITS.globalDay,
      visitorUsed: used("visitor-day:" + visitor),
      visitorLimit: LIMITS.visitorDay,
    };
  }
}
