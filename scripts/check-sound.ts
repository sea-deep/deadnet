import { chromium, expect } from "@playwright/test";
const b = await chromium.launch({ channel: "chrome" }),
  p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => {
  const Base = window.Audio;
  const all: HTMLAudioElement[] = [];
  (window as any).__audios = all;
  window.Audio = function (src?: string) {
    const a = new Base(src);
    all.push(a);
    return a;
  } as any;
});
await p.goto(process.env.DEADNET_CHECK_URL || "http://127.0.0.1:3000");
await p.getByRole("button", { name: "Insert USB drive", exact: true }).click();
await p
  .getByRole("button", { name: /^(Power on|Return to the computer)$/ })
  .click();
await p.getByRole("button", { name: "Skip startup" }).click();
await expect
  .poll(() =>
    p.evaluate(() =>
      (window as any).__audios.some(
        (a: HTMLAudioElement) => a.src.includes("ambient-horror") && !a.paused,
      ),
    ),
  )
  .toBe(true);
await p.getByRole("button", { name: "Start", exact: true }).click();
await p
  .getByRole("navigation", { name: "Start menu" })
  .getByRole("button", { name: "Games", exact: true })
  .click();
const games = p.getByRole("region", { name: "Games" });
await games.getByRole("button", { name: "Flappy Bat", exact: false }).click();
await expect
  .poll(() =>
    p.evaluate(
      () =>
        (window as any).__audios
          .filter((a: HTMLAudioElement) => a.src.includes("ambient-horror"))
          .every((a: HTMLAudioElement) => a.paused || a.volume <= 0.03), // games duck the ambience
    ),
  )
  .toBe(true);
const f = p.frameLocator('iframe[title="Flappy Bat"]');
await f.locator("canvas").click();
await p.waitForTimeout(800);
await expect
  .poll(() =>
    f
      .locator("body")
      .evaluate(() =>
        (window as any).__audios.some((a: HTMLAudioElement) => !a.paused),
      ),
  )
  .toBe(true);
await p.getByRole("button", { name: "Mute sound", exact: true }).click();
await expect
  .poll(() =>
    f
      .locator("body")
      .evaluate(() =>
        (window as any).__audios
          .filter((a: HTMLAudioElement) => !a.paused)
          .every((a: HTMLAudioElement) => a.muted),
      ),
  )
  .toBe(true);
await expect
  .poll(() =>
    p.evaluate(() =>
      (window as any).__audios
        .filter((a: HTMLAudioElement) => a.src.includes("ambient-horror"))
        .every((a: HTMLAudioElement) => a.paused),
    ),
  )
  .toBe(true);
console.log(
  JSON.stringify({
    ambientPlayedAfterGesture: true,
    ambientQuietForGames: true,
    mutePropagatesToGame: true,
    muteStopsAmbient: true,
  }),
);
await b.close();
