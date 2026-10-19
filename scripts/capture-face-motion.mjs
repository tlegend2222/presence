import { chromium } from "playwright";
import { stat } from "node:fs/promises";

const BASE = "http://127.0.0.1:8080";
const OUT = "/workspace/presence/tmp";

async function sampleCanvas(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return null;
    const w = canvas.width;
    const h = canvas.height;
    if (w < 4 || h < 4) return { blank: true, w, h };
    const ctx = canvas.getContext("2d");
    if (!ctx) return { blank: true, w, h, noctx: true };
    const mid = ctx.getImageData(Math.floor(w / 2), Math.floor(h / 2), 1, 1).data;
    let hash = 0;
    for (let i = 0; i < 8; i++) {
      const x = Math.floor((w * (i + 1)) / 10);
      const y = Math.floor(h * 0.6);
      const d = ctx.getImageData(x, y, 1, 1).data;
      hash = (hash * 33 + d[0] + d[1] * 3 + d[2] * 7 + d[3]) >>> 0;
    }
    return { blank: mid[0] + mid[1] + mid[2] + mid[3] === 0, w, h, hash, mid: [...mid] };
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
try {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(400);

  const card = page.locator("article").filter({ hasText: "Moneymaka" }).first();
  if (await card.count()) await card.getByRole("link", { name: /call/i }).click();
  else await page.getByRole("link", { name: /call/i }).first().click();

  await page.waitForURL(/\/call\//, { timeout: 15000 });
  await page.waitForTimeout(1600);

  await page.screenshot({ path: `${OUT}/face-idle.png`, fullPage: true });
  const hashes = { idle: await sampleCanvas(page) };

  const box = page.getByPlaceholder(/type|say|message/i).or(page.locator("textarea, input[type=text]")).first();
  await box.waitFor({ state: "visible", timeout: 10000 });
  await box.fill("Say hi in one sentence");
  const send = page.getByRole("button", { name: /send/i }).or(page.locator('button[type="submit"]')).first();
  if (await send.count()) await send.click();
  else await box.press("Enter");

  for (const [i, delay] of [[1, 500], [2, 1000], [3, 1000]]) {
    await page.waitForTimeout(delay);
    await page.screenshot({ path: `${OUT}/face-talk-${i}.png`, fullPage: true });
    hashes[`talk${i}`] = await sampleCanvas(page);
  }

  const canvasSamples = Object.values(hashes).filter(Boolean);
  const hashValues = canvasSamples.map((sample) => sample.hash).filter((hash) => hash !== undefined);
  const motion = hashValues.length >= 2 && hashValues.some((hash, i) => i > 0 && hash !== hashValues[i - 1]);
  console.log(`CANVAS_SAMPLES ${JSON.stringify(hashes)}`);
  console.log(`MOTION ${motion ? "true" : "false"}`);

  for (const name of ["face-idle.png", "face-talk-1.png", "face-talk-2.png", "face-talk-3.png"]) {
    const path = `${OUT}/${name}`;
    const info = await stat(path);
    console.log(`PNG ${path} ${info.size} bytes`);
  }
} finally {
  await browser.close();
}
