import { chromium } from "@playwright/test";
const b = await chromium.launch({ channel: "chrome" }),
  p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:3000");
await p.getByRole("button", { name: "Power on", exact: true }).click();
await p
  .getByRole("dialog", { name: "Computer startup" })
  .waitFor({ state: "hidden" });
await p.getByRole("button", { name: "Start", exact: true }).click();
await p
  .getByRole("navigation", { name: "Start menu" })
  .getByRole("button", { name: "Inbox", exact: true })
  .click();
const inbox = p.getByRole("region", { name: "Inbox" });
await inbox
  .locator(".mail-list button")
  .filter({ hasText: "LINE03.WAV" })
  .click();
await inbox.getByRole("button", { name: "Listen as voicemail" }).click();
await inbox.getByLabel("Voicemail playback").waitFor();
console.log(
  await inbox
    .getByLabel("Voicemail playback")
    .evaluate((el: HTMLAudioElement) => ({
      sourceReady: Boolean(el.src),
      controls: el.controls,
    })),
);
await p.screenshot({ path: "docs/evidence/voice-ui.png" });
await b.close();
