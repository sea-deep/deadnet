import { chromium, expect } from "@playwright/test";
const b = await chromium.launch({ channel: "chrome" }),
  p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:3000");
await p.request.post("http://127.0.0.1:3000/api/action", {
  data: { type: "collect", evidenceId: "birthday" },
});
await p.getByRole("button", { name: "Power on", exact: true }).click();
await p.getByRole("button", { name: "Skip startup" }).click();
await p.getByRole("button", { name: "Start", exact: true }).click();
await p
  .getByRole("navigation", { name: "Start menu" })
  .getByRole("button", { name: "Inbox", exact: true })
  .click();
const inbox = p.getByRole("region", { name: "Inbox" });
await inbox
  .locator(".mail-list button")
  .filter({ hasText: "NORA_0314.WAV" })
  .click();
await inbox.getByRole("button", { name: "Play recording" }).click();
const audio = inbox.locator("audio");
await audio.waitFor({ state: "attached" });
await expect
  .poll(() =>
    audio.evaluate(
      (el: HTMLAudioElement) => Number.isFinite(el.duration) && el.duration > 0,
    ),
  )
  .toBe(true);
await expect(
  inbox.getByRole("group", { name: "Recording controls" }),
).toBeVisible();
await inbox.getByRole("button", { name: "Stop", exact: true }).click();
await expect
  .poll(() =>
    audio.evaluate((el: HTMLAudioElement) => el.paused && el.currentTime < 0.1),
  )
  .toBe(true);
await inbox.getByRole("button", { name: "Resume recording" }).click();
await expect
  .poll(() => audio.evaluate((el: HTMLAudioElement) => !el.paused))
  .toBe(true);
await inbox.getByRole("button", { name: "Pause recording" }).click();
await expect
  .poll(() => audio.evaluate((el: HTMLAudioElement) => el.paused))
  .toBe(true);
console.log(
  JSON.stringify(
    await audio.evaluate((el: HTMLAudioElement) => ({
      sourceReady: Boolean(el.src),
      duration: el.duration,
      customControls: true,
      playPauseWorks: true,
      nativeControls: el.controls,
      stopWorks: el.paused && el.currentTime < 0.1,
    })),
  ),
);
await p.screenshot({ path: "docs/evidence/voice-ui.png" });
await b.close();
