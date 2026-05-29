import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:5173/#alpha-pit";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];

page.on("pageerror", (error) => errors.push(error.message));

await page.goto(baseUrl);
await page.getByRole("button", { name: /start/i }).click();

for (let round = 0; round < 5; round += 1) {
  if (round === 0) {
    await page.locator("button.scout-card-choice").click();
    await page.locator("button.charge-card-choice").click();
  }
  await page.locator('button.set-bar-cell[data-report="strong"][data-bar="fair"]').click();
  await page.locator("button.choice-button.hedge").click();
  await page.locator("button.led-tape-board").click();
  const nextButton = page.locator("button.primary-action").filter({ hasText: /^(Next Card|Finish Pit)/ });
  await nextButton.click();
  if ((await page.locator(".final-card").count()) > 0) {
    break;
  }
}

const finalTitle = await page.locator("h1").first().textContent();
await browser.close();

if (errors.length > 0) {
  throw new Error(`Browser smoke test saw page errors:\n${errors.join("\n")}`);
}

if (!finalTitle?.toLowerCase().includes("analyst") && !finalTitle?.toLowerCase().includes("wizard") && !finalTitle?.toLowerCase().includes("read") && !finalTitle?.toLowerCase().includes("game") && !finalTitle?.toLowerCase().includes("heat")) {
  throw new Error(`Unexpected final title: ${finalTitle}`);
}

console.log(`Alpha Pit smoke passed: ${finalTitle}`);
