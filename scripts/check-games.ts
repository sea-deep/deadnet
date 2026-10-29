import { chromium, expect } from "@playwright/test";
const b = await chromium.launch({
  channel: "chrome",
  args: ["--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader"],
});
const p = await b.newPage({ viewport: { width: 1440, height: 900 } }),
  errors: string[] = [],
  results: Record<string, unknown> = {};
p.on("pageerror", (e) => errors.push(e.message));
await p.goto("http://127.0.0.1:3000");
await p.getByRole("button", { name: "Power on", exact: true }).click();
await p.getByRole("button", { name: "Skip startup" }).click();
await p.getByRole("button", { name: "Start", exact: true }).click();
await p
  .getByRole("navigation", { name: "Start menu" })
  .getByRole("button", { name: "Games", exact: true })
  .click();
const games = p.getByRole("region", { name: "Games" });
await p.screenshot({ path: "docs/evidence/games.png" });
for (const name of [
  "Grave Snake",
  "Flappy Bat",
  "Crypt Blocks",
  "2048: Séance",
  "Phantomicus",
]) {
  await games.getByRole("button", { name, exact: false }).click();
  const f = p.frameLocator('iframe[title="' + name + '"]');
  await expect(f.locator("body")).toBeVisible();
  await expect(
    f.getByRole("button", { name: "Power on", exact: true }),
  ).toHaveCount(0);
  if (name === "Grave Snake") {
    await expect(f.locator("#game-area")).toBeVisible();
    await f.getByText("Play Game", { exact: true }).click();
    await p.keyboard.press("ArrowRight");
    await p.waitForTimeout(300);
    results[name] = await f.locator("#game-area").evaluate((e) => ({
      children: e.childElementCount,
      gameReady: e.textContent,
    }));
  }
  if (name === "Flappy Bat") {
    await expect(f.locator("canvas")).toBeVisible();
    await f.locator("canvas").click();
    await p.waitForTimeout(3500);
    await p.keyboard.press("Space");
    results[name] = await f.locator("canvas").evaluate(() => ({
      state: (window as any).state,
      score: (window as any).score,
    }));
  }
  if (name === "Crypt Blocks") {
    await f.locator("#canvas").click();
    await p.keyboard.press("Space");
    await p.waitForTimeout(500);
    results[name] = await f.locator("#canvas").evaluate(() => ({
      playing: (window as any).playing,
      canvases: document.querySelectorAll("canvas").length,
    }));
  }
  if (name === "2048: Séance") {
    await expect(f.locator(".tile")).toHaveCount(2);
    await f.locator("body").click();
    await p.keyboard.press("ArrowDown");
    await p.waitForTimeout(250);
    results[name] = { tiles: await f.locator(".tile").count() };
  }
  if (name === "Phantomicus") {
    await expect(f.locator("canvas")).toHaveCount(2);
    await p.waitForTimeout(1200);
    await f.locator("canvas").last().click();
    await p.keyboard.press("Enter");
    await p.waitForTimeout(400);
    await p.keyboard.press("Enter");
    await p.waitForTimeout(700);
    await p.screenshot({ path: "docs/evidence/phantomicus.png" });
    results[name] = { canvases: 2 };
  }

  await games.getByRole("button", { name: "Games", exact: true }).click();
}
console.log(JSON.stringify({ results, errors }, null, 2));
await b.close();
if (errors.length) process.exitCode = 1;
