import { test, expect, type Page } from "@playwright/test";
async function boot(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Insert USB drive", exact: true })
    .click();
  await page
    .getByRole("button", { name: /^(Power on|Return to the computer)$/ })
    .click();
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
test("the personal computer supports a complete investigation and a reversible wrong theory", async ({
  page,
  request,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page);
  const messenger = page.getByRole("region", { name: "Messenger" });
  await expect(messenger.getByRole("log")).toContainText("two bowls");
  await messenger.getByRole("button", { name: /Last conversation/ }).click();
  await expect(messenger.getByRole("log")).toContainText("I’m coming up.");
  await messenger
    .getByRole("button", { name: "Save to casebook", exact: true })
    .click();
  await expect(
    messenger.getByRole("button", { name: "Saved to casebook" }),
  ).toBeDisabled();
  await openApp(page, "Mail");
  const mail = page.getByRole("region", { name: "Mail" });
  await mail
    .locator(".mail-list")
    .getByRole("button", { name: /Home, somehow/ })
    .click();
  await expect(
    mail.getByRole("heading", { name: "Home, somehow." }),
  ).toBeVisible();
  await expect(mail.getByText("Received: 31 Oct · 03:07")).toBeVisible();
  await mail
    .getByRole("button", { name: "Save to casebook", exact: true })
    .click();
  await openApp(page, "Photos");
  const photos = page.getByRole("region", { name: "Photos" });
  await photos
    .getByRole("button", { name: "The spare key", exact: true })
    .click();
  await expect(
    photos.getByText(/watched me borrow his office spare/),
  ).toBeVisible();
  await photos
    .getByRole("button", { name: "Save to casebook", exact: true })
    .click();
  await photos.screenshot({
    path: `docs/evidence/revamp-photos-${testInfo.project.name}.png`,
  });
  await openApp(page, "Unknown Signal");
  const signal = page.getByRole("region", { name: "Unknown Signal" });
  await signal.getByLabel("Show Nora a file").selectOption("manifest");
  await signal
    .getByLabel("Message Nora")
    .fill("Nora, it’s Adam. Do you recognize this key?");
  await signal.getByRole("button", { name: "Send", exact: true }).click();
  await expect(signal.getByRole("log")).toContainText("you kept it");
  await openApp(page, "Casebook");
  const casebook = page.getByRole("region", { name: "Casebook" });
  await casebook
    .getByRole("button", { name: "What happened?", exact: true })
    .click();
  await casebook.getByLabel("Report suspect").selectOption("len");
  await casebook.getByLabel("Report motive").selectOption("inspections");
  await casebook.getByLabel("Report method").selectOption("spare-key");
  await casebook.getByRole("button", { name: "Send the report" }).click();
  await expect(casebook.getByText(/revise your theory/)).toBeVisible();
  let state = await (await request.get("/api/state")).json();
  expect(state.world.ending).toBe("open");
  expect(state.world.published).toEqual([]);
  expect(state.world.played || []).toEqual([]);
  await casebook.getByLabel("Report suspect").selectOption("sysop");
  await casebook.getByRole("button", { name: "Send the report" }).click();
  await expect(
    page.getByRole("dialog", { name: "Investigation complete" }),
  ).toContainText("The line is quiet.");
  await page.screenshot({
    path: `docs/evidence/revamp-ending-${testInfo.project.name}.png`,
  });
  state = await (await request.get("/api/state")).json();
  expect(state.world.ending).toBe("exposed");
  expect(state.world.accused).toBe("sysop");
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
  await openApp(page, "Messenger");
  const browser = page.getByRole("region", { name: "Messenger" });
  await browser.getByRole("button", { name: "Minimize Messenger" }).click();
  await expect(browser).toBeHidden();
  await page
    .locator(".task-buttons")
    .getByRole("button", { name: "Messenger", exact: true })
    .click();
  await expect(browser).toBeVisible();
  if (testInfo.project.name === "desktop") {
    const title = browser.getByLabel("Messenger title bar.", { exact: false });
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

test("the library excludes Hocus and keeps attribution on the 3D game only", async ({
  page,
}) => {
  await boot(page);
  await openApp(page, "Games");
  const games = page.getByRole("region", { name: "Games" });
  await expect(games.getByRole("button", { name: /Hocus/ })).toHaveCount(0);
  await games.getByRole("button", { name: /Grave Snake/ }).click();
  await expect(games.locator(".game-credits a")).toHaveCount(0);
  await games.getByRole("button", { name: "Games", exact: true }).click();
  await games.getByRole("button", { name: /Phantomicus/ }).click();
  await expect(games.locator(".game-credits a")).toContainText("Cody Ebberson");
});

test("a corrupt browser save is ignored instead of blanking the desktop", async ({
  page,
}) => {
  await boot(page);
  await page.evaluate(() => {
    localStorage.setItem(
      "deadnet-save-v1",
      JSON.stringify({ version: 1, storyId: 42 }),
    );
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Insert USB drive", exact: true })
    .click();
  await page
    .getByRole("button", { name: /^(Power on|Return to the computer)$/ })
    .click();
  await page.getByRole("button", { name: "Skip startup" }).click();
  await expect(
    page.getByRole("navigation", { name: "Desktop applications" }),
  ).toBeVisible();
});

test("Nora’s calendar contains ordinary plans and a contextual meeting", async ({
  page,
}) => {
  await boot(page);
  await openApp(page, "Calendar");
  const calendar = page.getByRole("region", { name: "Calendar" });
  await expect(
    calendar.getByRole("heading", { name: "Talk to Owen" }),
  ).toBeVisible();
  await calendar.getByRole("button", { name: "24", exact: false }).click();
  await expect(
    calendar.getByRole("heading", { name: "Mara’s soup" }),
  ).toBeVisible();
});

test("the desktop opens a selected game directly and the private signal accepts an attached clue", async ({
  page,
  request,
}) => {
  await boot(page);
  await page
    .getByRole("button", { name: "Close Messenger", exact: true })
    .click();
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

test("the mail badge counts unread letters and clears once the inbox is opened", async ({
  page,
}) => {
  await boot(page);
  await page
    .getByRole("button", { name: "Close Messenger", exact: true })
    .click();
  const desktop = page.getByRole("navigation", {
    name: "Desktop applications",
  });
  const icon = desktop.getByRole("button", { name: /^Mail/ });
  const badge = icon.locator("b");
  await expect(badge).toBeVisible();
  const count = Number(await badge.textContent());
  expect(count).toBeGreaterThan(0);
  if (await page.evaluate(() => innerWidth < 740)) await icon.click();
  else await icon.dblclick();
  const inbox = page.getByRole("region", { name: "Mail" });
  await expect(inbox).toBeVisible();
  await inbox.getByRole("button", { name: "Close Mail" }).click();
  await expect(inbox).toBeHidden();
  await expect(badge).toBeHidden();
  // Read receipts survive a reload, so old mail is not counted again.
  await page.reload();
  await page
    .getByRole("button", { name: "Insert USB drive", exact: true })
    .click();
  await page
    .getByRole("button", { name: /^(Power on|Return to the computer)$/ })
    .click();
  await page.getByRole("button", { name: "Skip startup" }).click();
  await expect(
    page
      .getByRole("navigation", { name: "Desktop applications" })
      .getByRole("button", { name: "Mail", exact: true })
      .locator("b"),
  ).toBeHidden();
});

test("switching to Sent never leaves an inbox letter in the reader", async ({
  page,
}) => {
  await boot(page);
  await openApp(page, "Mail");
  const inbox = page.getByRole("region", { name: "Mail" });
  await expect(
    inbox.getByRole("heading", { name: "They think you fell" }),
  ).toBeVisible();
  await inbox.getByRole("button", { name: "Sent", exact: true }).click();
  await expect(inbox.getByText("No correspondence yet.")).toBeVisible();
  await expect(
    inbox.getByRole("heading", { name: "They think you fell" }),
  ).toBeHidden();
  await inbox
    .getByRole("button", { name: /^Inbox \(/ })
    .first()
    .click();
  await expect(
    inbox.getByRole("heading", { name: "They think you fell" }),
  ).toBeVisible();
});

test("Address Book opens a compose window addressed to the chosen account", async ({
  page,
}) => {
  await boot(page);
  await openApp(page, "Address Book");
  const people = page.getByRole("region", { name: "Address Book" });
  await people.getByRole("button", { name: /Len Mercer/ }).click();
  await people.getByRole("button", { name: "Write to Len" }).click();
  const inbox = page.getByRole("region", { name: "Mail" });
  await expect(
    inbox.getByRole("heading", { name: "New message" }),
  ).toBeVisible();
  await expect(inbox.getByRole("combobox", { name: "Recipient" })).toHaveValue(
    "len",
  );
});

test("Notepad asks before clearing notes and Cmd/Ctrl+S exports a copy", async ({
  page,
}) => {
  await boot(page);
  await openApp(page, "Notepad");
  const notepad = page.getByRole("region", { name: "Notepad" });
  const notes = notepad.getByRole("textbox", { name: "Notepad document" });
  await notes.fill("first clue\nsecond clue");
  await expect(notepad.getByText("2 lines · 4 words")).toBeVisible();
  const download = page.waitForEvent("download");
  await notes.press("ControlOrMeta+s");
  expect((await download).suggestedFilename()).toBe("notes.txt");
  await notepad.getByRole("button", { name: "New", exact: true }).click();
  const warning = notepad.getByRole("alert", { name: "Clear notes" });
  await expect(warning).toBeVisible();
  await warning.getByRole("button", { name: "Cancel" }).click();
  await expect(notes).toHaveValue("first clue\nsecond clue");
  await notepad.getByRole("button", { name: "New", exact: true }).click();
  await warning.getByRole("button", { name: "Clear notes" }).click();
  await expect(notes).toHaveValue("");
  await expect(notepad.getByText("1 line · 0 words")).toBeVisible();
});

test("the service reports malformed and oversized request bodies as client errors", async ({
  page,
}) => {
  await page.goto("/");
  const malformed = await page.evaluate(async () => {
    const r = await fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    return { status: r.status, error: (await r.json()).error as string };
  });
  expect(malformed.status).toBe(400);
  expect(malformed.error).toContain("JSON");
  const oversized = await page.evaluate(async () => {
    const r = await fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "message",
        target: "mara",
        text: "x".repeat(9000),
      }),
    });
    return { status: r.status, error: (await r.json()).error as string };
  });
  expect(oversized.status).toBe(413);
  expect(oversized.error).toContain("too large");
});

test("the private signal explains an exhausted allowance and links to the monitor", async ({
  page,
  request,
}) => {
  const state = await (await request.get("/api/state")).json();
  const restored = await request.post("/api/restore", {
    data: { world: { ...state.world, remainingTurns: 0 } },
  });
  expect(restored.ok()).toBe(true);
  await boot(page);
  await openApp(page, "Unknown Signal");
  const signal = page.getByRole("region", { name: "Unknown Signal" });
  await expect(signal.getByText("No turns remain.")).toBeVisible();
  await signal.getByRole("button", { name: "Renew the allowance" }).click();
  await expect(
    page.getByRole("region", { name: "System Monitor" }),
  ).toBeVisible();
});

test("a blocked browser save is surfaced instead of failing silently", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "deadnet-save-v1")
        throw new DOMException("Storage is full", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await boot(page);
  const messenger = page.getByRole("region", { name: "Messenger" });
  await messenger.getByRole("button", { name: /Last conversation/ }).click();
  await messenger
    .getByRole("button", { name: "Save to casebook", exact: true })
    .click();
  await expect(
    page.getByText("Autosave is blocked in this browser", { exact: false }),
  ).toBeVisible();
});

test("Start is keyboard-navigable and returns focus when dismissed", async ({
  page,
}) => {
  await boot(page);
  const start = page.getByRole("button", { name: "Start", exact: true });
  await start.click();
  const menu = page.getByRole("navigation", { name: "Start menu" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("button").first()).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("button").nth(1)).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(start).toBeFocused();
});

test("My Computer browses both drives and Trash restores a personal letter", async ({
  page,
}, testInfo) => {
  await boot(page);
  await openApp(page, "My Computer");
  const computer = page.getByRole("region", { name: "My Computer" });
  await expect(
    computer.getByText("Nora’s disk (C:)", { exact: true }).first(),
  ).toBeVisible();
  await computer
    .locator(".file-tree")
    .getByRole("button", { name: "Recovery USB (E:)" })
    .click();
  await expect(
    computer.locator(".file-entries").getByRole("button", { name: /Casebook/ }),
  ).toBeVisible();
  await computer.screenshot({
    path: `docs/evidence/revamp-computer-${testInfo.project.name}.png`,
  });
  await openApp(page, "Trash Bin");
  const trash = page.getByRole("region", { name: "Trash Bin" });
  await expect(
    trash.getByRole("heading", { name: "Letter to Mum" }),
  ).toBeVisible();
  await trash.getByRole("button", { name: "Restore selected item" }).click();
  await expect(
    trash.getByRole("heading", { name: "Letter to Mum" }),
  ).toHaveCount(0);
  await openApp(page, "My Computer");
  await computer
    .locator(".file-tree")
    .getByRole("button", { name: "Documents", exact: true })
    .click();
  const restored = computer
    .locator(".file-entries")
    .getByRole("button", { name: /Letter to Mum/ });
  if (testInfo.project.name === "mobile") await restored.click();
  else await restored.dblclick();
  await expect(
    computer.getByText(/I wanted you to stop worrying/),
  ).toBeVisible();
});

test("the opening, desktop icons and Messenger render as one readable experience", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "DEADNET", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `docs/evidence/revamp-opening-${testInfo.project.name}.png`,
  });
  await boot(page);
  await page.screenshot({
    path: `docs/evidence/revamp-messenger-${testInfo.project.name}.png`,
  });
  await page
    .getByRole("button", { name: "Close Messenger", exact: true })
    .click();
  const desktop = page.getByRole("navigation", {
    name: "Desktop applications",
  });
  await expect(desktop.getByRole("button", { name: /Hocus/ })).toHaveCount(0);
  await expect(
    desktop
      .getByRole("button", { name: "2048: Séance", exact: true })
      .locator("img"),
  ).toHaveAttribute("src", /2048-game.png/);
  await expect(
    desktop
      .getByRole("button", { name: "Phantomicus", exact: true })
      .locator("img"),
  ).toHaveAttribute("src", /phantomicus-game.png/);
  await expect(
    desktop.getByRole("button", { name: "My Computer", exact: true }),
  ).toBeVisible();
  await expect(
    desktop.getByRole("button", { name: "Trash Bin", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `docs/evidence/revamp-desktop-${testInfo.project.name}.png`,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("CRT defaults on, stays switchable, and the desktop uses the period raster cursor", async ({
  page,
}) => {
  await boot(page);
  await expect(page.locator(".crt-overlay")).toHaveCount(1);
  expect(
    await page.locator(".desktop").evaluate((e) => getComputedStyle(e).cursor),
  ).toContain("cursors/chicago95/Arrow.png");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("button", { name: "Turn off CRT scanlines" }).click();
  await expect(page.locator(".crt-overlay")).toHaveCount(0);
  await boot(page);
  await expect(page.locator(".crt-overlay")).toHaveCount(0);
});

test("the same cursor pack covers window descendants, text fields and game frames", async ({
  page,
}) => {
  await boot(page);
  const messenger = page.getByRole("region", { name: "Messenger" });
  expect(
    await messenger
      .locator(".title-drag span")
      .evaluate((e) => getComputedStyle(e).cursor),
  ).toContain("chicago95/Arrow.png");
  expect(
    await messenger
      .getByRole("button", { name: "Unknown signal", exact: true })
      .evaluate((e) => getComputedStyle(e).cursor),
  ).toContain("chicago95/HandPointer.png");
  await openApp(page, "Unknown Signal");
  expect(
    await page
      .getByLabel("Message Nora")
      .evaluate((e) => getComputedStyle(e).cursor),
  ).toContain("chicago95/IBeam.png");
  await openApp(page, "Games");
  const games = page.getByRole("region", { name: "Games" });
  await games.getByRole("button", { name: /Grave Snake/ }).click();
  const child = page.frameLocator('iframe[title="Grave Snake"]');
  await expect
    .poll(() =>
      child.locator("body").evaluate((e) => getComputedStyle(e).cursor),
    )
    .toContain("chicago95/Arrow.png");
  await expect
    .poll(() =>
      child
        .getByText("Play Game", { exact: true })
        .evaluate((e) => getComputedStyle(e).cursor),
    )
    .toContain("chicago95/HandPointer.png");
});

test("recording controls play, pause, stop and mute without contacting a voice provider", async ({
  page,
}) => {
  // Exercise the real transport with a bundled CC0 audio fixture; never call TTS.
  await page.route("**/api/state", async (route) => {
    const response = await route.fetch();
    const snapshot = await response.json();
    snapshot.status.voice = true;
    await route.fulfill({ response, json: snapshot });
  });
  await page.route("**/api/audio/**", (route) =>
    route.fulfill({
      path: "public/assets/audio/ambient-horror.ogg",
      contentType: "audio/ogg",
    }),
  );
  await boot(page);
  await openApp(page, "Mail");
  const mail = page.getByRole("region", { name: "Mail" });
  await mail
    .locator(".mail-list")
    .getByRole("button", { name: /Your missed call/ })
    .click();
  await mail
    .getByRole("button", { name: "Play recording", exact: true })
    .click();
  const audio = mail.locator("audio");
  await expect
    .poll(() =>
      audio.evaluate((a: HTMLAudioElement) => !a.paused && a.duration > 0),
    )
    .toBe(true);
  await expect(
    mail.getByRole("group", { name: "Recording controls" }),
  ).toBeVisible();
  await mail.getByRole("button", { name: "Pause recording" }).click();
  await expect
    .poll(() => audio.evaluate((a: HTMLAudioElement) => a.paused))
    .toBe(true);
  await mail.getByRole("button", { name: "Resume recording" }).click();
  await expect
    .poll(() => audio.evaluate((a: HTMLAudioElement) => !a.paused))
    .toBe(true);
  await page.getByRole("button", { name: "Mute sound", exact: true }).click();
  await expect
    .poll(() => audio.evaluate((a: HTMLAudioElement) => a.muted))
    .toBe(true);
  await mail.getByRole("button", { name: "Stop", exact: true }).click();
  await expect
    .poll(() =>
      audio.evaluate((a: HTMLAudioElement) => a.paused && a.currentTime < 0.1),
    )
    .toBe(true);
});
