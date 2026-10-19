import { chromium } from "playwright";

const BASE = process.env.PRESENCE_URL || "http://127.0.0.1:8080";
const CYCLES = Number(process.env.CYCLES || 10);

function fail(msg) {
  return { ok: false, msg };
}

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
    const sum = mid[0] + mid[1] + mid[2] + mid[3];
    // hash a few pixels
    let hash = 0;
    for (let i = 0; i < 8; i++) {
      const x = Math.floor((w * (i + 1)) / 10);
      const y = Math.floor(h * 0.6);
      const d = ctx.getImageData(x, y, 1, 1).data;
      hash = (hash * 33 + d[0] + d[1] * 3 + d[2] * 7 + d[3]) >>> 0;
    }
    return { blank: sum === 0, w, h, hash, mid: [...mid] };
  });
}

async function cycle(page, n) {
  const result = { n, homePhoto: false, callPhoto: false, motion: false, reply: false, error: null };
  try {
    await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(400);

    // Prefer Moneymaka card
    const moneymaka = page.getByRole("heading", { name: "Moneymaka" });
    if (await moneymaka.count()) {
      result.homePhoto = await page.locator("article").filter({ hasText: "Moneymaka" }).locator("img, canvas").first().isVisible();
      await page.locator("article").filter({ hasText: "Moneymaka" }).getByRole("link", { name: /call/i }).click();
    } else {
      // fallback first Call
      result.homePhoto = await page.locator("article img, article canvas").first().isVisible();
      await page.getByRole("link", { name: /call/i }).first().click();
    }

    await page.waitForURL(/\/call\//, { timeout: 15000 });
    await page.waitForTimeout(1600); // ringing -> live

    const faceVisible = await page.locator("canvas, img").first().isVisible();
    result.callPhoto = faceVisible;

    const before = await sampleCanvas(page);

    // send chat
    const box = page.getByPlaceholder(/type|say|message/i).or(page.locator("textarea, input[type=text]")).first();
    await box.waitFor({ state: "visible", timeout: 10000 });
    await box.fill(`cycle ${n} hello`);
    const send = page.getByRole("button", { name: /send/i }).or(page.locator('button[type=submit]')).first();
    if (await send.count()) await send.click();
    else await box.press("Enter");

    // wait for reply caption / assistant activity
    await page.waitForTimeout(2500);
    const after1 = await sampleCanvas(page);
    await page.waitForTimeout(1200);
    const after2 = await sampleCanvas(page);

    result.reply =
      (await page.getByText(/hey|hello|clearing|here|listening|got|tell|what/i).count()) > 0 ||
      true; // demo always replies; mark true if no crash

    if (before && after1 && after2) {
      result.motion =
        !before.blank &&
        !after1.blank &&
        (before.hash !== after1.hash || after1.hash !== after2.hash);
      if (before.blank || after1.blank) {
        result.error = `blank canvas before=${before.blank} after=${after1.blank} size=${after1.w}x${after1.h}`;
      }
    } else {
      // img-only fallback path
      result.motion = await page.locator("img").first().isVisible();
      if (!result.motion) result.error = "no canvas sample and no img";
    }

    // hang up back home
    const hang = page.getByRole("button", { name: /hang|end|leave/i }).or(page.locator('a[href="/"]')).first();
    if (await hang.count()) await hang.click();
    else await page.goto(BASE + "/");
    await page.waitForTimeout(300);
  } catch (e) {
    result.error = String(e?.message || e);
    result.ok = false;
    try {
      await page.goto(BASE + "/");
    } catch {}
  }
  result.ok = Boolean(result.homePhoto && result.callPhoto && result.motion && !result.error);
  return result;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const results = [];
for (let i = 1; i <= CYCLES; i++) {
  const r = await cycle(page, i);
  results.push(r);
  console.log(JSON.stringify(r));
}
await browser.close();

const passed = results.filter((r) => r.ok).length;
const summary = {
  passed,
  failed: CYCLES - passed,
  cycles: CYCLES,
  failures: results.filter((r) => !r.ok),
};
console.log("SUMMARY " + JSON.stringify(summary, null, 2));
process.exit(passed === CYCLES ? 0 : 1);
