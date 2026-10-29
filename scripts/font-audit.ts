import { chromium } from "@playwright/test";
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:3000");
await p.getByRole("button", { name: "Establish connection" }).click();
console.log(
  await p.evaluate(() =>
    [...document.querySelectorAll("*")]
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
        text: e.textContent?.slice(0, 65),
        size: getComputedStyle(e).fontSize,
        selector: e.tagName + "." + e.className,
      })),
  ),
);
await b.close();
