import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
mkdirSync("docs/evidence", { recursive: true });
await page.goto("http://127.0.0.1:3200");
await page.getByRole("button", { name: "Establish connection" }).waitFor();
await page.screenshot({ path: "docs/evidence/boot.png" });
await page.getByRole("button", { name: "Establish connection" }).click();
await page.screenshot({ path: "docs/evidence/desktop.png" });
async function app(name: string) {
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Start menu" })
    .getByRole("button", { name, exact: true })
    .click();
}
await app("GhostMail");
await page.screenshot({ path: "docs/evidence/mail.png" });
await app("Archive.exe");
await page.screenshot({ path: "docs/evidence/archive.png" });
await app("System Monitor");
await page.screenshot({ path: "docs/evidence/monitor.png" });
await page.setViewportSize({ width: 390, height: 844 });
await app("DeadBrowser");
await page.screenshot({ path: "docs/evidence/mobile.png" });
await app("Archive.exe");
await page.screenshot({ path: "docs/evidence/mobile-archive.png" });
await browser.close();
console.log("Captured six real interface states.");
