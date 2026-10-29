import { test, expect, type Page } from "@playwright/test";
async function boot(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Power on", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Computer startup" })
    .waitFor({ state: "hidden" });
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
  await openApp(page, "My Documents");
  let files = page.getByRole("region", { name: "My Documents" });
  await expect(
    files.getByText("External clients: 0", { exact: false }),
  ).toBeVisible();
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
  await openApp(page, "My Documents");
  files = page.getByRole("region", { name: "My Documents" });
  await files
    .getByRole("button", { name: "HAPPY_BIRTHDAY.EML", exact: false })
    .click();
  await expect(
    files.getByText("Delivery count: 50", { exact: false }),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const x = await (await request.get("/api/state")).json();
      return x.world.collected;
    })
    .toContain("birthday");
  await files
    .getByRole("button", { name: "CONTINUITY.INI", exact: false })
    .click();
  await expect(
    files.getByText("Purpose=Preserve the conversation", { exact: false }),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const x = await (await request.get("/api/state")).json();
      return x.world.collected;
    })
    .toContain("manifest");
  await files.getByRole("radio", { name: "Everyone on the network" }).check();
  await files.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(files.getByText("Permissions saved: public.")).toBeVisible();
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
  await openApp(page, "Internet");
  const browser = page.getByRole("region", { name: "Internet" });
  await browser.getByRole("button", { name: "Minimize Internet" }).click();
  await expect(browser).toBeHidden();
  await page
    .locator(".task-buttons")
    .getByRole("button", { name: "Internet", exact: true })
    .click();
  await expect(browser).toBeVisible();
  if (testInfo.project.name === "desktop") {
    const title = browser.getByLabel("Internet title bar.", { exact: false });
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
