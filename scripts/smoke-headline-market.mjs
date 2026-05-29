import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:5173/#headline-market";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];

page.on("pageerror", (error) => errors.push(error.message));

await page.goto(baseUrl);
await page.locator(".storybook-intro-page.prologue").getByRole("button", { name: /start game/i }).click();
await page.locator(".storybook-intro-page.rules").getByRole("button", { name: /^play$/i }).click();
const dashboardGuide = page.locator(".dashboard-guide-live");
try {
  await dashboardGuide.waitFor({ state: "visible", timeout: 4000 });
  const dashboardStart = dashboardGuide.getByRole("button", { name: /^start$/i });
  if (await dashboardStart.isVisible()) {
    await dashboardStart.click();
  } else {
    await page.mouse.click(12, 12);
  }
  await dashboardGuide.waitFor({ state: "detached", timeout: 4000 });
} catch {
  // Some local runs may have already dismissed the first-time guide.
}

await page.getByRole("button", { name: /chapter index/i }).click();
await page.getByRole("button", { name: /^1990/i }).click();
await page.locator(".storybook-headline-list article", { hasText: "Iraq invades Kuwait" }).locator(".storybook-chapter-play-button").click();
await page.locator(".storybook-allocation-wheel").getByRole("option", { name: /^S&P 500/i }).click();
await page.getByRole("button", { name: /play with s&p 500/i }).click();
await page.getByText("August 2, 1990").first().waitFor();

await page.getByRole("button", { name: /chapter index/i }).click();
await page.getByRole("button", { name: /skip to the end/i }).click();
await page.locator(".storybook-allocation-wheel").getByRole("option", { name: /^Gold/i }).click();
await page.getByRole("button", { name: /play with gold/i }).click();
await page.getByRole("heading", { name: /the last edition/i }).waitFor();

const finalTitle = await page.locator("h1").first().textContent();
const finalBankroll = await page.locator(".storybook-final-player-score strong").textContent();
await browser.close();

if (errors.length > 0) {
  throw new Error(`Browser smoke test saw page errors:\n${errors.join("\n")}`);
}

if (!finalTitle || !finalBankroll?.includes("$")) {
  throw new Error(`Unexpected Front Page Fortune final state: ${finalTitle} / ${finalBankroll}`);
}

console.log(`Front Page Fortune smoke passed: ${finalTitle} ${finalBankroll}`);
