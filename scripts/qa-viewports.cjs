// Quick responsive check: renders pages at phone / tablet / desktop widths,
// reports horizontal overflow and writes screenshots to ../shots/.
const { chromium } = require("playwright-core");
const path = require("path");

const OUT = "C:\\Users\\Lenovo\\Documents\\deepseek-harness\\default-workspace\\shots";
const BASE = "http://localhost:3000";
const PAGES = ["/", "/pursuits", "/pursuits/film-and-light", "/pursuits/city-sound"];
const SIZES = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  for (const size of SIZES) {
    const ctx = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    for (const p of PAGES) {
      await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 30000 });
      const info = await page.evaluate(() => {
        const de = document.documentElement;
        const wide = [...document.querySelectorAll("*")]
          .filter((el) => el.getBoundingClientRect().right > de.clientWidth + 1)
          .slice(0, 5)
          .map((el) => ({
            tag: el.tagName,
            cls: (el.className || "").toString().slice(0, 80),
            right: Math.round(el.getBoundingClientRect().right),
          }));
        return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, wide };
      });
      const slug = p.replace(/\//g, "_") || "_home";
      await page.screenshot({
        path: path.join(OUT, `qa-${size.name}${slug}.png`),
        fullPage: false,
      });
      console.log(size.name, p, "scrollWidth", info.scrollWidth, "clientWidth", info.clientWidth, "overflow", info.scrollWidth > info.clientWidth, JSON.stringify(info.wide));
    }
    await ctx.close();
  }
  await browser.close();
})();
