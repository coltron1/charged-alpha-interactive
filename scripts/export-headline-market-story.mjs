import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, "..");
const outputPath = path.join(root, "docs", "headline-market-story-review.md");

function formatDateLong(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function readStringConstant(source, name) {
  const declarationIndex = source.indexOf(`const ${name}`);
  if (declarationIndex === -1) {
    throw new Error(`Unable to find ${name}`);
  }

  const equalsIndex = source.indexOf("=", declarationIndex);
  let cursor = equalsIndex + 1;
  while (/\s/.test(source[cursor])) cursor += 1;

  const quote = source[cursor];
  if (quote !== '"' && quote !== "'" && quote !== "`") {
    throw new Error(`Expected ${name} to be a string literal`);
  }

  let literal = quote;
  cursor += 1;
  while (cursor < source.length) {
    const character = source[cursor];
    literal += character;
    if (character === "\\" && cursor + 1 < source.length) {
      cursor += 1;
      literal += source[cursor];
    } else if (character === quote) {
      break;
    }
    cursor += 1;
  }

  if (quote === "`") {
    return literal.slice(1, -1);
  }

  return JSON.parse(literal);
}

function normalizeStoryText(text) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .join("\n\n");
}

function buildOpeningChapter(startingBankroll) {
  return [
    "## Prologue: The Inheritance",
    "",
    "Grandpa is found dead under mysterious circumstances inside The Sentinel, the small town's historical press building.",
    "",
    `He leaves each of his five grandchildren ${startingBankroll} to invest over their lifetimes. Jonah also inherits Grandpa's gold Rolex and an old leather briefcase filled with newspaper clippings.`,
    "",
    "Impossibly, the clippings describe future events that have not happened yet. Jonah decides to use his inheritance and his knowledge of future headlines to maximize his investments over the next 20 years of his life.",
  ].join("\n");
}

function buildEventSection(event, index, total) {
  const labels = [`Front page ${index + 1} of ${total}`, event.era];
  if (event.major) labels.push("Ultra significant");

  return [
    `## ${formatDateLong(event.date)} — ${event.headline}`,
    "",
    `_${labels.join(" · ")}_`,
    "",
    normalizeStoryText(event.journalEntry ?? event.lifeNote),
  ].join("\n");
}

async function main() {
  const server = await createServer({
    root,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true },
  });

  try {
    const [{ headlineEvents }, gameSource] = await Promise.all([
      server.ssrLoadModule("/src/games/headline-market/content/events.ts"),
      readFile(path.join(root, "src/games/headline-market/HeadlineMarketGame.tsx"), "utf8"),
    ]);

    const finalChapterHeadline = readStringConstant(gameSource, "finalChapterHeadline");
    const finalChapterDeck = readStringConstant(gameSource, "finalChapterDeck");
    const finalChapterSummary = readStringConstant(gameSource, "finalChapterSummary");
    const finalChapterJournal = readStringConstant(gameSource, "finalChapterJournal");

    const sections = [
      "# The Mercer Inheritance",
      "",
      "_Story export for review. Generated from the current Headline Market game content._",
      "",
      buildOpeningChapter("$100,000"),
      "",
      "# Jonah's Journal",
      "",
      ...headlineEvents.map((event, index) => buildEventSection(event, index, headlineEvents.length).concat("\n")),
      `## October 26, 2007 — ${finalChapterHeadline}`,
      "",
      "_Final page · Twenty years later_",
      "",
      finalChapterDeck,
      "",
      finalChapterSummary,
      "",
      "### Jonah's Final Journal",
      "",
      normalizeStoryText(finalChapterJournal),
      "",
    ];

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, sections.join("\n"), "utf8");
    console.log(`Wrote ${path.relative(root, outputPath)} with ${headlineEvents.length} dated story entries.`);
  } finally {
    await server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
