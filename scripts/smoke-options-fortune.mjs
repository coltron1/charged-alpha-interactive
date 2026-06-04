import { chromium } from "@playwright/test";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:5174/#options-fortune";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 740 } });

try {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Start Game/i }).click();
  await page.getByRole("button", { name: /^Play$/i }).click();
  await page.locator(".storybook-guide-overlay").waitFor({ state: "visible" });
  await page.mouse.click(18, 18);
  await page.locator(".storybook-guide-overlay").waitFor({ state: "hidden", timeout: 3000 });
  await page.locator(".storybook-dashboard-allocation-choice.calls.active").waitFor({ state: "visible" });
  await page.locator(".options-banner-play-button").click();
  await page.locator(".options-timing-coach").waitFor({ state: "visible" });
  await page.mouse.click(18, 18);
  await page.locator(".options-timing-coach").waitFor({ state: "hidden", timeout: 3000 });
  await page.locator(".storybook-time-reel-overlay.can-close-position").waitFor({ state: "visible" });
  await page.waitForTimeout(300);
  await page.mouse.click(18, 18);
  await page.locator(".storybook-time-reel-target-chart.closed-early").waitFor({ state: "visible" });
  await page.mouse.click(200, 700);
  await page.locator(".storybook-time-reel-overlay").waitFor({ state: "hidden", timeout: 3000 });
  await page.locator(".options-banner-play-button").click();
  await page.locator(".storybook-time-reel-overlay.can-close-position").waitFor({ state: "visible" });
  await page.waitForTimeout(900);
  await page.mouse.click(200, 360);
  await page.locator(".storybook-time-reel-target-chart.closed-early").waitFor({ state: "visible" });
  await page.mouse.click(200, 700);
  await page.locator(".storybook-time-reel-overlay").waitFor({ state: "hidden", timeout: 3000 });
  await page.setViewportSize({ width: 900, height: 740 });
  await page.waitForTimeout(150);
  const timelineTrack = page.locator(".options-timeline-rail .storybook-progress-track").first();
  await timelineTrack.waitFor({ state: "visible" });
  const box = await timelineTrack.boundingBox();
  if (!box) {
    throw new Error("Options timeline track was not measurable");
  }
  await page.mouse.click(box.x + box.width - 6, box.y + box.height / 2);
  await page.getByRole("button", { name: /^Play/i }).first().click();
  await page.waitForTimeout(4300);

  const finalHeading = page.getByRole("heading", { name: /Final Expiration/i });
  await finalHeading.waitFor({ state: "visible" });
  const bodyText = await page.locator("body").innerText();
  const score = bodyText.match(/MARA'S ACCOUNT\s+(\$[\d,]+)/i)?.[1] ?? "unknown";
  console.log(`Expiration Date smoke passed: Final Expiration ${score}`);
} finally {
  await browser.close();
}
