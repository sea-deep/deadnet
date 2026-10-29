import { test, expect, type Page } from "@playwright/test";
async function boot(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Power on", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Computer startup" })
    .waitFor({ state: "hidden" });
  // The Read Me explains the case on the first visit only.
  const readme = page.getByRole("region", { name: "Read Me" });
  if (await readme.isVisible()) {
    await expect(readme).toContainText("Your goal");
    await page.getByRole("button", { name: "Close Read Me" }).click();
  }
}
async function openApp(page: Page, name: string) {
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Start menu" })
    .getByRole("button", { name, exact: true })
    .click();
}
test.beforeEach(async ({ request }) => {
  await request.post("/api/action", {
    data: { type: "mode", mode: "baseline" },
  });
  await request.post("/api/action", { data: { type: "reset" } });
});
test("a file shared privately changes another account and persists across a reload", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page);
  await openApp(page, "File Explorer");
  let files = page.getByRole("region", { name: "File Explorer" });
  await expect(files.getByText("MASTER-01", { exact: false })).toBeVisible();
  await files.getByRole("button", { name: "Send To…" }).click();
  await files.getByRole("button", { name: "Mara Voss", exact: true }).click();
  let inbox = page.getByRole("region", { name: "Inbox" });
  await inbox
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Have you seen this log?");
  await inbox.getByRole("button", { name: "Send privately" }).click();
  await expect(
    inbox.getByRole("heading", { name: "A quiet word", exact: false }),
  ).toBeVisible();
  await request.post("/api/action", { data: { type: "tick" } });
  let state = await (await request.get("/api/state")).json();
  expect(
    state.world.agents.find((a: { id: string }) => a.id === "len").knownFacts,
  ).toContain("carrier");
  await boot(page);
  await openApp(page, "File Explorer");
  files = page.getByRole("region", { name: "File Explorer" });
  await files
    .getByRole("button", { name: "OCT31_CHAT.TXT", exact: false })
    .click();
  await expect(
    files.getByText("No further messages", { exact: false }),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const x = await (await request.get("/api/state")).json();
      return x.world.collected;
    })
    .toContain("birthday");
  await files
    .getByRole("button", { name: "CASE_14.BAK", exact: false })
    .click();
  // Still locked until two of Nora's game saves are recovered.
  await expect(
    files.getByText("Play 2 of Nora’s games", { exact: false }),
  ).toBeVisible();
  for (const game of ["snake", "flappy"])
    await request.post("/api/action", { data: { type: "played", game } });
  await expect(
    files.getByText("MASTER-01 = OWEN KEENE", { exact: false }),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const x = await (await request.get("/api/state")).json();
      return x.world.collected;
    })
    .toContain("manifest");
  await files.getByRole("radio", { name: "Publish case evidence" }).check();
  await files
    .getByRole("combobox", { name: "Report suspect" })
    .selectOption("sysop");
  await files.getByRole("button", { name: "File report", exact: true }).click();
  await expect(
    files.getByText("Report filed. You named Owen Keene.", { exact: false }),
  ).toBeVisible();
  state = await (await request.get("/api/state")).json();
  expect(state.world.ending).toBe("exposed");
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("desktop controls, saved notes, wallpaper, mute and service validation", async ({
  page,
  request,
}, testInfo) => {
  await boot(page);
  await openApp(page, "Chat Logs");
  const browser = page.getByRole("region", { name: "Chat Logs" });
  await browser.getByRole("button", { name: "Minimize Chat Logs" }).click();
  await expect(browser).toBeHidden();
  await page
    .locator(".task-buttons")
    .getByRole("button", { name: "Chat Logs", exact: true })
    .click();
  await expect(browser).toBeVisible();
  if (testInfo.project.name === "desktop") {
    const title = browser.getByLabel("Chat Logs title bar.", { exact: false });
    await title.focus();
    await title.press("ArrowRight");
  }
  await openApp(page, "Notepad");
  const notes = page.getByRole("textbox", { name: "Notepad document" });
  await notes.fill("milk\nbatteries\nwho left the line open?");
  await boot(page);
  await openApp(page, "Notepad");
  await expect(
    page.getByRole("textbox", { name: "Notepad document" }),
  ).toHaveValue("milk\nbatteries\nwho left the line open?");
  await page.getByRole("button", { name: "Mute sound", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Enable sound", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("button", { name: "Use plain wallpaper" }).click();
  await expect(page.locator(".desktop")).toHaveClass(/wallpaper-plain/);
  expect(
    (
      await request.post("/api/action", {
        data: { type: "message", target: "unknown", text: "x" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/action", {
        data: { type: "reset" },
        headers: { Origin: "https://unrelated.invalid" },
      })
    ).status(),
  ).toBe(403);
});

test("the desktop opens a selected game directly and the private signal accepts an attached clue", async ({
  page,
  request,
}) => {
  await boot(page);
  const desktop = page.getByRole("navigation", {
    name: "Desktop applications",
  });
  await expect(
    desktop.getByRole("button", { name: "Flappy Bat", exact: true }),
  ).toBeVisible();
  if (await page.evaluate(() => innerWidth < 740))
    await desktop
      .getByRole("button", { name: "Flappy Bat", exact: true })
      .click();
  else
    await desktop
      .getByRole("button", { name: "Flappy Bat", exact: true })
      .dblclick();
  await expect(
    page.frameLocator('iframe[title="Flappy Bat"]').locator("canvas"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Space", exact: true }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toBeVisible();
  await openApp(page, "Unknown Signal");
  const signal = page.getByRole("region", { name: "Unknown Signal" });
  await signal
    .getByRole("textbox", { name: "Message Nora" })
    .fill("Can you hear me?");
  await signal.getByRole("button", { name: "Send", exact: true }).click();
  await expect(signal.getByRole("log")).toContainText("two knocks");
  const state = await (await request.get("/api/state")).json();
  expect(
    state.world.events
      .filter((e: { actor: string }) => e.actor === "nora")
      .at(-1).to,
  ).toBe("visitor");
});
