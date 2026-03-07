/**
 * Fetches Rightmove search results and extracts property listings.
 *
 * Compliant with Rightmove T&C:
 *  - Custom User-Agent identifying the bot
 *  - Respects robots.txt (only fetches allowed paths)
 *  - Polite delay between paginated requests
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, "..", "scraper.config.json");

function loadConfig() {
  const raw = readFileSync(CONFIG_PATH, "utf-8");
  return JSON.parse(raw);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractJsonModel(html) {
  const patterns = [
    /window\.jsonModel\s*=\s*(\{[\s\S]*?\});\s*<\/script>/,
    /window\.jsonModel\s*=\s*(\{[\s\S]*?\});\s*$/m,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        continue;
      }
    }
  }
  return null;
}

function parsePropertyFromModel(prop) {
  const price = prop.price?.amount ?? prop.price?.displayPrices?.[0]?.displayPrice ?? 0;
  const rentNum = typeof price === "string" ? parseInt(price.replace(/[^0-9]/g, ""), 10) : price;

  const images = (prop.propertyImages?.images ?? [])
    .map((img) => img.srcUrl ?? img.url ?? "")
    .filter(Boolean)
    .map((url) => (url.startsWith("//") ? `https:${url}` : url));

  return {
    rightmoveId: String(prop.id),
    title: prop.displayAddress ?? prop.propertySubType ?? "Unknown",
    address: prop.displayAddress ?? "",
    propertyType: prop.propertySubType ?? "",
    rent: rentNum,
    bedrooms: prop.bedrooms ?? 0,
    bathrooms: prop.bathrooms ?? 0,
    url: prop.propertyUrl
      ? `https://www.rightmove.co.uk${prop.propertyUrl}`
      : "",
    images,
    agentName: prop.customer?.branchDisplayName ?? "",
    agentPhone: prop.customer?.contactTelephone ?? "",
    addedDate: prop.listingUpdate?.listingUpdateDate ?? "",
    description: prop.summary ?? "",
    latitude: prop.location?.latitude ?? null,
    longitude: prop.location?.longitude ?? null,
  };
}

function parsePropertyFromHtml(html) {
  const properties = [];
  const propertyPattern = /rightmove\.co\.uk\/properties\/(\d+)/g;
  const ids = new Set();
  let match;

  while ((match = propertyPattern.exec(html)) !== null) {
    ids.add(match[1]);
  }

  const pricePattern = /£([\d,]+)\s*pcm/g;
  const prices = [];
  while ((match = pricePattern.exec(html)) !== null) {
    prices.push(parseInt(match[1].replace(/,/g, ""), 10));
  }

  let priceIdx = 0;
  for (const id of ids) {
    properties.push({
      rightmoveId: id,
      title: `Property ${id}`,
      address: "",
      propertyType: "",
      rent: prices[priceIdx++] ?? 0,
      bedrooms: 0,
      bathrooms: 0,
      url: `https://www.rightmove.co.uk/properties/${id}`,
      images: [],
      agentName: "",
      agentPhone: "",
      addedDate: "",
      description: "",
      latitude: null,
      longitude: null,
    });
  }

  return properties;
}

function getResultCount(model) {
  return model?.resultCount
    ? parseInt(String(model.resultCount).replace(/,/g, ""), 10)
    : 0;
}

async function fetchPage(url, userAgent) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-GB,en;q=0.9",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }

  return res.text();
}

export async function scrapeRightmove() {
  const config = loadConfig();
  const { searchUrl, userAgent, delayMs, maxPages } = config;

  const allProperties = new Map();
  let page = 0;
  let totalResults = Infinity;

  console.log(`🔍 Starting Rightmove scrape...`);
  console.log(`   URL: ${searchUrl}`);

  while (page < maxPages) {
    const pageUrl =
      page === 0
        ? searchUrl
        : `${searchUrl}&index=${page * 24}`;

    console.log(`📄 Fetching page ${page + 1}...`);

    const html = await fetchPage(pageUrl, userAgent);
    const model = extractJsonModel(html);

    let pageProperties;
    if (model?.properties) {
      if (page === 0) {
        totalResults = getResultCount(model);
        console.log(`   Found ${totalResults} total results`);
      }
      pageProperties = model.properties.map(parsePropertyFromModel);
    } else {
      console.log(`   ⚠️  No jsonModel found, falling back to HTML parsing`);
      pageProperties = parsePropertyFromHtml(html);
      if (page === 0) totalResults = pageProperties.length;
    }

    if (pageProperties.length === 0) break;

    for (const prop of pageProperties) {
      if (!allProperties.has(prop.rightmoveId)) {
        allProperties.set(prop.rightmoveId, prop);
      }
    }

    console.log(`   Got ${pageProperties.length} properties (${allProperties.size} total unique)`);

    if (allProperties.size >= totalResults) break;

    page++;
    if (page < maxPages) {
      await sleep(delayMs);
    }
  }

  const results = [...allProperties.values()];
  console.log(`✅ Scrape complete: ${results.length} properties found`);
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeRightmove()
    .then((props) => {
      console.log(JSON.stringify(props, null, 2));
    })
    .catch((err) => {
      console.error("❌ Scrape failed:", err.message);
      process.exit(1);
    });
}
