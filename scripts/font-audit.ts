import { chromium } from "@playwright/test";
const b = await chromium.launch({ channel: "chrome" }),
  p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:3000");
await p.getByRole("button", { name: "Power on", exact: true }).click();
await p.getByRole("button", { name: "Skip startup" }).click();
const results: unknown[] = [];
for (const name of [
  "Internet",
  "Inbox",
  "My Documents",
  "Address Book",
  "Notepad",
  "System Monitor",
  "Games",
]) {
  await p.getByRole("button", { name: "Start", exact: true }).click();
  await p
    .getByRole("navigation", { name: "Start menu" })
    .getByRole("button", { name, exact: true })
    .click();
  const small = await p
    .getByRole("region", { name, exact: true })
    .evaluate((root) =>
      [...root.querySelectorAll("*")]
        .filter(
          (e) =>
            [...e.childNodes].some(
              (n) => n.nodeType === 3 && n.textContent?.trim(),
            ) &&
            e.getBoundingClientRect().height > 0 &&
            getComputedStyle(e).visibility !== "hidden" &&
            parseFloat(getComputedStyle(e).fontSize) < 13,
        )
        .map((e) => ({
          text: e.textContent?.slice(0, 60),
          size: getComputedStyle(e).fontSize,
          selector: e.tagName + "." + e.className,
        })),
    );
  results.push({ name, small });
}
console.log(JSON.stringify(results, null, 2));
await b.close();
