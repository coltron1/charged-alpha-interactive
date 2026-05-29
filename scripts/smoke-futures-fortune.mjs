import { chromium } from "@playwright/test";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:5174/#futures-fortune";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 740 } });

try {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Start Game/i }).click();
  await page.getByRole("button", { name: /^Play$/i }).click();
  await page.waitForTimeout(600);
  await page.mouse.click(200, 360);
  await page.getByRole("button", { name: /Open harvest index/i }).click();
  await page.getByRole("button", { name: /Skip to final harvest/i }).click();
  await page.getByRole("button", { name: /^Play/i }).first().click();
  await page.waitForTimeout(4300);

  const finalHeading = page.getByRole("heading", { name: /Final Harvest/i });
  await finalHeading.waitFor({ state: "visible" });
  const bodyText = await page.locator("body").innerText();
  const score = bodyText.match(/RILEY'S ACCOUNT\s+(\$[\d,]+)/i)?.[1] ?? "unknown";
  console.log(`Harvest Ledger smoke passed: Final Harvest ${score}`);
} finally {
  await browser.close();
}
