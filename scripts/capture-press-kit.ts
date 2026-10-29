/** Presentation captures, never provider evidence. No external API requests. */
import { chromium, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { seedWorld } from "../server/seed.ts";
import type { World } from "../src/types.ts";
const url = process.env.DEADNET_CAPTURE_URL || "http://127.0.0.1:3307/";
const directory = "docs/screenshots";
mkdirSync(directory + "/desktop", { recursive: true });
mkdirSync(directory + "/mobile", { recursive: true });
const browser = await chromium.launch({
  channel: "chrome",
  args: ["--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader"],
});
const files: { file: string; scene: string; stagedDialogue: boolean }[] = [];
const failures: string[] = [];
const context = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  reducedMotion: "reduce",
});
// Hard block third-party requests. A capture cannot accidentally spend API quota.
await context.route("**/*", (route) =>
  new URL(route.request().url()).origin === new URL(url).origin
    ? route.continue()
    : route.abort(),
);
const page = await context.newPage();
page.on("pageerror", (e) => failures.push(e.message));
let device = "desktop";
async function clean(p = page) {
  await p.addStyleTag({
    content:
      ".exhibition-banner,.entrance-disclosure,.model-indicator,.provenance,.spirit-count{display:none!important}.exhibition .taskbar{bottom:0}.exhibition .windows-area{top:0}.spirit-app .window-status,.casebook-app>.window-status{visibility:hidden}.signal-message small{display:none}.exhibition .desktop-icons{top:0}",
  });
}
async function capture(name: string, scene: string, stagedDialogue = false) {
  await page
    .locator(".error-toast")
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
  await page.mouse.move(1590, 990);
  await page.screenshot({ path: `${directory}/${device}/${name}.png` });
  files.push({ file: `${device}/${name}.png`, scene, stagedDialogue });
}
async function app(name: string) {
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Start menu" })
    .getByRole("button", { name, exact: true })
    .click();
}
async function boot(world?: World) {
  await page.goto(url);
  await page.evaluate((w) => {
    localStorage.clear();
    localStorage.setItem("deadnet-muted", "true");
    if (w) localStorage.setItem("deadnet-case-westhaven-v5", JSON.stringify(w));
  }, world);
  await page.reload();
  await page
    .getByRole("button", { name: "Insert USB drive", exact: true })
    .click();
  await page
    .getByRole("button", { name: /^(Power on|Return to the computer)$/ })
    .click();
  await page
    .getByRole("dialog", { name: "Computer startup" })
    .waitFor({ state: "hidden" });
  await clean();
}
await page.goto(url);
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem("deadnet-muted", "true");
});
await page.reload();
await clean();
await expect(
  page.getByRole("heading", { name: "DEADNET", exact: true }),
).toBeVisible();
await capture(
  "01-opening",
  "Mara’s letter and the computer before the USB is inserted.",
);
await page
  .getByRole("button", { name: "Insert USB drive", exact: true })
  .click();
await capture("02-usb-connected", "Recovery drive mounted, ready to power on.");
await page.getByRole("button", { name: "Power on", exact: true }).click();
await expect(page.locator(".post-screen")).toBeVisible();
await capture("03-boot", "The actual BIOS startup.");
await page
  .getByRole("dialog", { name: "Computer startup" })
  .waitFor({ state: "hidden" });
await clean();
await capture(
  "04-messenger",
  "Nora and Adam’s ordinary conversation before the murder.",
);
await page
  .getByRole("button", { name: "Close Messenger", exact: true })
  .click();
await capture(
  "05-desktop",
  "The whole desktop, sourced wallpaper, restored system icons and five games.",
);
await app("Messenger");
let messenger = page.getByRole("region", { name: "Messenger" });
await messenger.getByRole("button", { name: /Mara Voss/ }).click();
await messenger.getByLabel("Conversation date").selectOption("24 Oct");
await capture(
  "06-mara",
  "The friendship: scarf, soup and an ordinary evening.",
);
await messenger.getByRole("button", { name: /Adam Moore/ }).click();
await messenger.getByLabel("Conversation date").selectOption("31 Oct");
await messenger
  .getByRole("log")
  .evaluate((e) => (e.scrollTop = e.scrollHeight));
await capture(
  "07-last-conversation",
  "The last exchange, including Adam’s unanswered messages.",
);
await app("Mail");
const mail = page.getByRole("region", { name: "Mail" });
await capture("08-maras-mail", "Mara still writes to her dead friend.");
await mail
  .locator(".mail-list")
  .getByRole("button", { name: /Home, somehow/ })
  .click();
await capture(
  "09-lens-email",
  "Len’s ordinary bus-home email and its timestamp.",
);
await mail
  .locator(".mail-list")
  .getByRole("button", { name: /Statement for residents/ })
  .click();
await capture("10-management-statement", "Owen’s account of the night.");
await mail
  .locator(".mail-list")
  .getByRole("button", { name: /Your missed call/ })
  .click();
await mail.locator("summary").click();
await capture(
  "11-last-call",
  "The original authored call transcript; no voice request was made.",
);
await app("Photos");
const photos = page.getByRole("region", { name: "Photos" });
await capture("12-photo-album", "Nora’s Sunday out of town.");
await photos
  .getByRole("button", { name: "The spare key", exact: true })
  .click();
await capture(
  "13-spare-key",
  "A sourced photograph and Nora’s personal caption.",
);
await app("Calendar");
await capture(
  "14-calendar",
  "The night’s appointment and a dinner she never attended.",
);
await app("Trash Bin");
await capture("15-deleted-letter", "Nora’s unsent letter to her mother.");
await page
  .getByRole("region", { name: "Trash Bin" })
  .getByRole("button", { name: "Restore selected item" })
  .click();
await app("My Computer");
await capture("16-my-computer", "Nora’s disk and the recovery USB.");
await page
  .getByRole("region", { name: "My Computer" })
  .locator(".file-tree")
  .getByRole("button", { name: "Recovery USB (E:)" })
  .click();
await capture(
  "17-usb-casebook",
  "The investigation utility lives on the external drive.",
);
await app("Notepad");
await capture("18-notepad", "Ordinary unfinished personal notes.");
// Authored presentation checkpoint: never marked as a model/provider result.
const checkpoint = seedWorld("baseline");
checkpoint.collected = ["carrier", "birthday", "manifest"];
checkpoint.revision = 6;
checkpoint.tick = 3;
checkpoint.agents.find((a) => a.id === "nora")!.knownFacts = [
  ...checkpoint.collected,
];
for (const [actor, text] of [
  ["nora", "adam? you’re late for soup."],
  [
    "visitor",
    "Mara gave me your computer. I found the messages. I’m sorry I didn’t answer.",
  ],
  [
    "nora",
    "don’t do that. you always say sorry before you tell me something bad.",
  ],
  ["visitor", "You said Len had gone home. His email was sent at 3:07."],
  [
    "nora",
    "he was going to fix mara’s heater on monday. i remember him saying that. i don’t think it was him at the door.",
  ],
  ["visitor", "I found your photograph of the spare key."],
  ["nora", "the scrape on the desk. yes. i didn’t open the door, adam."],
] as const)
  checkpoint.events.push({
    id: crypto.randomUUID(),
    tick: 3,
    actor,
    to: actor === "nora" ? "visitor" : "nora",
    channel: "mail",
    origin: "seed",
    text,
    factIds: [],
  });
await boot(checkpoint);
await app("Unknown Signal");
await page
  .getByRole("log", { name: "Nora conversation" })
  .evaluate((el) => (el.scrollTop = 0));
await capture("19-first-contact", "Nora recognizes Adam.", true);
await page
  .getByRole("log", { name: "Nora conversation" })
  .evaluate((el) => (el.scrollTop = el.scrollHeight));
await capture("19-noras-signal", "Nora remembers the sound at her door.", true);
await app("Casebook");
await capture("20-casebook", "Three saved personal items, ready to compare.");
const casebook = page.getByRole("region", { name: "Casebook" });
await casebook
  .getByRole("button", { name: "What happened?", exact: true })
  .click();
await casebook.getByLabel("Report suspect").selectOption("sysop");
await casebook.getByLabel("Report motive").selectOption("inspections");
await casebook.getByLabel("Report method").selectOption("spare-key");
await capture(
  "21-reconstruction",
  "The player connects person, motive and means. Contains solution spoilers.",
);
await casebook.getByRole("button", { name: "Send the report" }).click();
await expect(
  page.getByRole("dialog", { name: "Investigation complete" }),
).toBeVisible();
await capture(
  "22-ending",
  "The actual authored ending reached through the report action. Contains spoilers.",
);
await page
  .getByRole("button", { name: "Return to the computer", exact: true })
  .click();
await app("Games");
await page.getByRole("button", { name: "Maximize Games", exact: true }).click();
const games = page.getByRole("region", { name: "Games" });
for (const [id, name] of [
  ["snake", "Grave Snake"],
  ["flappy", "Flappy Bat"],
  ["tetris", "Crypt Blocks"],
  ["2048", "2048: Séance"],
  ["phantomicus", "Phantomicus"],
]) {
  await games.getByRole("button", { name, exact: false }).click();
  const frame = page.frameLocator(`iframe[title="${name}"]`);
  await expect(frame.locator("body")).toBeVisible();
  if (id === "snake") {
    await frame.getByText("Play Game", { exact: true }).click();
    await games
      .getByRole("button", { name: "ArrowRight", exact: true })
      .click();
  }
  if (id === "flappy") {
    await frame.locator("canvas").click();
    await page.waitForTimeout(3200);
    await games.getByRole("button", { name: "Space", exact: true }).click();
  }
  if (id === "tetris") {
    await frame.locator("#canvas").click();
    await games.getByRole("button", { name: "Space", exact: true }).click();
  }
  if (id === "2048") {
    await frame.locator("body").click();
    for (const key of [
      "ArrowLeft",
      "ArrowUp",
      "ArrowRight",
      "ArrowDown",
      "ArrowLeft",
      "ArrowUp",
    ])
      await page.keyboard.press(key);
  }
  if (id === "phantomicus") {
    await expect(frame.locator("canvas")).toHaveCount(2);
    await frame.locator("canvas").last().click();
    await games.getByRole("button", { name: "Enter", exact: true }).click();
    await page.waitForTimeout(600);
  }
  await capture(
    `23-game-${id}`,
    `${name}, captured from the running game after real controls.`,
  );
  await games.getByRole("button", { name: "Games", exact: true }).click();
}
device = "mobile";
await page.setViewportSize({ width: 390, height: 844 });
await boot();
await capture(
  "01-messenger",
  "Phone layout: readable personal Messenger history.",
);
await app("My Computer");
await capture("02-my-computer", "Phone file manager.");
await app("Trash Bin");
await capture("03-letter", "Phone layout: the unsent letter.");
await app("Photos");
await page
  .getByRole("region", { name: "Photos" })
  .getByRole("button", { name: "The spare key", exact: true })
  .click();
await capture("04-photo", "Phone photo and caption.");
const phoneCheckpoint = structuredClone(checkpoint);
phoneCheckpoint.events = phoneCheckpoint.events.filter(
  (e) =>
    e.id.startsWith("seed-") ||
    e.id.startsWith("personal-") ||
    e.text === "adam? you’re late for soup." ||
    e.text ===
      "Mara gave me your computer. I found the messages. I’m sorry I didn’t answer." ||
    e.text ===
      "don’t do that. you always say sorry before you tell me something bad.",
);
await boot(phoneCheckpoint);
await app("Unknown Signal");
await page
  .getByRole("log", { name: "Nora conversation" })
  .evaluate((el) => (el.scrollTop = 0));
await capture("05-signal", "First contact with Nora on a phone.", true);
await app("Casebook");
await capture("06-casebook", "Phone casebook, all three items.");
await page.goto(url);
await page.evaluate(() => localStorage.clear());
await page.reload();
await clean();
await capture("07-opening", "Phone opening before the USB gesture.");
await page
  .getByRole("button", { name: "Insert USB drive", exact: true })
  .click();
await capture(
  "08-usb",
  "Phone USB gesture brings the power control into view.",
);
await browser.close();
writeFileSync(
  directory + "/manifest.json",
  JSON.stringify(
    {
      captureMode:
        "Actual running production exhibition with authored presentation checkpoints. No provider calls. Debug badges hidden for press images only; application modes unchanged.",
      viewport: { desktop: "1600x1000", mobile: "390x844" },
      files,
      errors: failures,
    },
    null,
    2,
  ),
);
writeFileSync(
  directory + "/README.md",
  `# DEADNET screenshots\n\n${files.length} real browser captures of the packaged game, at desktop 1600×1000 and phone 390×844. No generated mockups or image composites.\n\nPresentation-only checkpoints use authored dialogue; screenshots 19/05 of Nora’s signal are staged story writing, not provider-inference evidence. Technical/debug badges are hidden in these press images only. The shipped app still identifies its response mode. No API calls, traces or measurements were fabricated. The ending is the actual authored game state, reached through the report action from a prepared checkpoint.\n\nImages 21/22 contain solution/ending spoilers. [Manifest](manifest.json) records every scene.\n\n${files.map((f) => `- [${f.scene}](${f.file})`).join("\n")}\n`,
);
console.log(
  JSON.stringify({
    screenshots: files.length,
    errors: failures,
    providerRequestsAllowed: false,
  }),
);
if (failures.length) process.exitCode = 1;
