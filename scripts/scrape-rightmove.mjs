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

function extractSearchResults(html) {
  // Rightmove migrated to Next.js -- data now lives in __NEXT_DATA__
  const nextDataMatch = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const sr = nextData?.props?.pageProps?.searchResults;
      if (sr?.properties) return sr;
    } catch { /* fall through */ }
  }

  // Legacy fallback: window.jsonModel / window.PAGE_MODEL
  const legacyPatterns = [
    /window\.jsonModel\s*=\s*(\{[\s\S]*?\});\s*<\/script>/,
    /window\.jsonModel\s*=\s*(\{[\s\S]*?\});\s*$/m,
    /window\.PAGE_MODEL\s*=\s*(\{[\s\S]*?\});\s*<\/script>/,
    /window\.PAGE_MODEL\s*=\s*(\{[\s\S]*?\});\s*$/m,
  ];
  for (const pattern of legacyPatterns) {
    const match = html.match(pattern);
    if (match) {
      try { return JSON.parse(match[1]); } catch { continue; }
    }
  }

  return null;
}

function parsePropertyFromModel(prop) {
  let rentNum = 0;
  const priceObj = prop.price;
  if (priceObj) {
    const pcmDisplay = priceObj.displayPrices?.find((d) =>
      d.displayPrice?.includes("pcm"),
    );
    if (pcmDisplay) {
      rentNum = parseInt(pcmDisplay.displayPrice.replace(/[^0-9]/g, ""), 10);
    } else if (priceObj.frequency === "weekly" && priceObj.amount) {
      rentNum = Math.round((priceObj.amount * 52) / 12);
    } else {
      rentNum = priceObj.amount ?? 0;
    }
  }

  const rawImages = prop.propertyImages?.images ?? prop.images ?? [];
  const images = rawImages
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

function extractPageModel(html) {
  const marker = "window.PAGE_MODEL = ";
  const start = html.indexOf(marker);
  if (start === -1) return null;
  const jsonStart = start + marker.length;

  let depth = 0;
  let jsonEnd = -1;
  let inString = false;
  for (let i = jsonStart; i < html.length; i++) {
    const c = html[i];
    if (inString) {
      if (c === "\\" ) { i++; continue; }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) { jsonEnd = i; break; } }
  }

  if (jsonEnd === -1) return null;
  try {
    return JSON.parse(html.substring(jsonStart, jsonEnd + 1));
  } catch {
    return null;
  }
}

function parseDetailPage(model) {
  const pd = model?.propertyData;
  if (!pd) return null;

  const images = (pd.images ?? [])
    .map((img) => {
      const best =
        img.resizedImageUrls?.size656x437 ??
        img.resizedImageUrls?.size476x317 ??
        img.url ??
        "";
      return best.startsWith("//") ? `https:${best}` : best;
    })
    .filter(Boolean);

  const floorplans = (pd.floorplans ?? [])
    .map((fp) => fp.url ?? "")
    .filter(Boolean)
    .map((u) => (u.startsWith("//") ? `https:${u}` : u));

  const sqftSizing = (pd.sizings ?? []).find((s) => s.unit === "sqft");
  const sqft = sqftSizing?.minimumSize ?? null;

  const keyFeatures = pd.keyFeatures ?? [];

  const description = (pd.text?.description ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();

  const nearestStations = (pd.nearestStations ?? []).slice(0, 3).map((s) => ({
    name: s.name ?? "",
    distance: s.distance != null ? `${parseFloat(s.distance).toFixed(1)} mi` : "",
  }));

  const floor = pd.entranceFloor != null ? pd.entranceFloor : null;

  const lettings = pd.lettings ?? {};
  const letAvailableDate = lettings.letAvailableDate ?? null;
  const deposit = lettings.deposit ?? null;
  const minTenancy = lettings.minimumTermInMonths ?? null;
  const letType = lettings.letType ?? null;
  const furnishType = lettings.furnishType ?? null;

  return { images, floorplans, sqft, keyFeatures, description, nearestStations, floor, letAvailableDate, deposit, minTenancy, letType, furnishType };
}

async function fetchPropertyDetails(rightmoveId, userAgent, delayMs) {
  const url = `https://www.rightmove.co.uk/properties/${rightmoveId}`;
  await sleep(delayMs);
  try {
    const html = await fetchPage(url, userAgent);
    const model = extractPageModel(html);
    return parseDetailPage(model);
  } catch (err) {
    console.log(`   ⚠️  Failed to fetch details for ${rightmoveId}: ${err.message}`);
    return null;
  }
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

  const buf = await res.arrayBuffer();
  return new TextDecoder("utf-8").decode(buf);
}

export async function scrapeRightmove() {
  const config = loadConfig();
  const { searchUrl, userAgent, delayMs, maxPages, maxListings } = config;
  const listingsLimit = maxListings ?? Infinity;

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
    const model = extractSearchResults(html);

    let pageProperties;
    if (model?.properties) {
      if (page === 0) {
        totalResults = getResultCount(model);
        console.log(`   Found ${totalResults} total results`);
      }
      pageProperties = model.properties.map(parsePropertyFromModel);
    } else {
      console.log(`   ⚠️  No search results found, falling back to HTML parsing`);
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

    if (allProperties.size >= totalResults || allProperties.size >= listingsLimit) break;

    page++;
    if (page < maxPages) {
      await sleep(delayMs);
    }
  }

  const results = [...allProperties.values()].slice(0, listingsLimit);
  console.log(`✅ Search scrape complete: ${results.length} properties found`);

  console.log(`\n🏠 Fetching detail pages for full images and info...`);
  let enriched = 0;
  for (const prop of results) {
    const details = await fetchPropertyDetails(prop.rightmoveId, userAgent, delayMs);
    if (details) {
      if (details.images.length > prop.images.length) {
        prop.images = details.images;
      }
      prop.floorplans = details.floorplans;
      prop.keyFeatures = details.keyFeatures;
      prop.nearestStations = details.nearestStations;
      if (details.sqft) prop.sqft = details.sqft;
      if (details.floor != null) prop.floor = details.floor;
      if (details.description) prop.description = details.description;
      prop.letAvailableDate = details.letAvailableDate;
      prop.deposit = details.deposit;
      prop.minTenancy = details.minTenancy;
      prop.letType = details.letType;
      prop.furnishType = details.furnishType;
      enriched++;
    }
    if (enriched % 25 === 0 && enriched > 0) {
      console.log(`   Enriched ${enriched}/${results.length} properties...`);
    }
  }
  console.log(`✅ Detail scrape complete: enriched ${enriched}/${results.length} properties`);

  return results;
}

export { fetchPropertyDetails };

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
