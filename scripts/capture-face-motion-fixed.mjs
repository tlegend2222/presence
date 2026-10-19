import { chromium } from "playwright";
import { stat } from "node:fs/promises";

const BASE = "http://127.0.0.1:8080";
const OUT = "/workspace/presence/tmp";

async function sampleMouthRegion(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return null;
    const w = canvas.width;
    const h = canvas.height;
    if (w < 4 || h < 4) return { blank: true, w, h };
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { blank: true, w, h, noctx: true };

    // Sample mouth band ~0.52–0.66 height, center 40% width — count near-black pixels.
    const y0 = Math.floor(h * 0.52);
    const y1 = Math.floor(h * 0.66);
    const x0 = Math.floor(w * 0.3);
    const x1 = Math.floor(w * 0.7);
    const data = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
    let nearBlack = 0;
    let total = 0;
    let sum = 0;
    let hash = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      total += 1;
      sum += r + g + b;
      if (a > 200 && r + g + b < 18) nearBlack += 1;
      if ((i / 4) % 37 === 0) hash = (hash * 33 + r + g * 3 + b * 7) >>> 0;
    }
    const mid = ctx.getImageData(Math.floor(w / 2), Math.floor(h * 0.58), 1, 1).data;
    return {
      w,
      h,
      nearBlack,
      total,
      nearBlackPct: total ? +(100 * nearBlack / total).toFixed(2) : 0,
      avgLum: total ? +(sum / (total * 3)).toFixed(1) : 0,
      mid: [...mid],
      hash,
    };
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
try {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(500);

  const card = page.locator("article").filter({ hasText: "Moneymaka" }).first();
  if (await card.count()) await card.getByRole("link", { name: /call/i }).click();
  else await page.getByRole("link", { name: /call/i }).first().click();

  await page.waitForURL(/\/call\//, { timeout: 15000 });
  await page.waitForTimeout(1800);

  await page.screenshot({ path: `${OUT}/face-motion-fixed-idle.png`, fullPage: true });
  const samples = { idle: await sampleMouthRegion(page) };

  const box = page.getByPlaceholder(/type|say|message/i).or(page.locator("textarea, input[type=text]")).first();
  await box.waitFor({ state: "visible", timeout: 10000 });
  await box.fill("Say hi in one sentence");
  const send = page.getByRole("button", { name: /send/i }).or(page.locator('button[type="submit"]')).first();
  if (await send.count()) await send.click();
  else await box.press("Enter");

  for (const [i, delay] of [[1, 600], [2, 900], [3, 900]]) {
    await page.waitForTimeout(delay);
    await page.screenshot({ path: `${OUT}/face-motion-fixed-${i}.png`, fullPage: true });
    samples[`talk${i}`] = await sampleMouthRegion(page);
  }

  const hashes = Object.values(samples).map((s) => s?.hash).filter((h) => h !== undefined);
  const motion = hashes.length >= 2 && hashes.some((h, i) => i > 0 && h !== hashes[i - 1]);
  const worstBlack = Math.max(...Object.values(samples).map((s) => s?.nearBlackPct ?? 0));
  console.log(`SAMPLES ${JSON.stringify(samples)}`);
  console.log(`MOTION ${motion ? "true" : "false"}`);
  console.log(`WORST_NEAR_BLACK_PCT ${worstBlack}`);
  console.log(`PASS_NO_BLOTCH ${worstBlack < 2.5 ? "true" : "false"}`);

  for (const name of [
    "face-motion-fixed-idle.png",
    "face-motion-fixed-1.png",
    "face-motion-fixed-2.png",
    "face-motion-fixed-3.png",
  ]) {
    const path = `${OUT}/${name}`;
    const info = await stat(path);
    console.log(`PNG ${path} ${info.size} bytes`);
  }
} finally {
  await browser.close();
}
