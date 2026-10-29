import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
const browser = await chromium.launch({ channel: "chrome" }),
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
mkdirSync("docs/evidence", { recursive: true });
await page.goto(process.env.CAPTURE_URL || "http://127.0.0.1:3000");
await page.getByRole("button", { name: "Power on", exact: true }).waitFor();
await page.screenshot({ path: "docs/evidence/boot.png" });
await page.getByRole("button", { name: "Power on", exact: true }).click();
await page
  .getByRole("dialog", { name: "Computer startup" })
  .waitFor({ state: "hidden" });
await page.screenshot({ path: "docs/evidence/desktop-new.png" });
async function app(name: string) {
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Start menu" })
    .getByRole("button", { name, exact: true })
    .click();
}
for (const [name, file] of [
  ["Chat Logs", "desktop"],
  ["Inbox", "mail"],
  ["Notepad", "notepad"],
  ["Games", "games"],
  ["My Documents", "archive"],
  ["System Monitor", "monitor"],
]) {
  await app(name);
  await page.screenshot({ path: "docs/evidence/" + file + ".png" });
}
await page.setViewportSize({ width: 390, height: 844 });
await app("Chat Logs");
await page.screenshot({ path: "docs/evidence/mobile.png" });
await app("My Documents");
await page.screenshot({ path: "docs/evidence/mobile-archive.png" });
await browser.close();
console.log("Captured nine actual desktop/mobile states.");
