/**
 * Syncs scraped Rightmove listings with data/properties.json.
 *
 * - New listings: added with status "new", source "rightmove"
 * - Disappeared listings: marked "let_agreed" (only if status is "new" or "interested")
 * - Price changes: updated with an auto-comment
 * - Manually added properties: never touched
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { scrapeRightmove } from "./scrape-rightmove.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "..", "data", "properties.json");

const AUTO_DEMOTE_STATUSES = new Set(["new", "interested"]);

const EMPTY_DATA = { properties: [], users: [] };

function loadData() {
  if (!existsSync(DATA_PATH)) {
    console.log("📁 properties.json not found, creating empty file...");
    const dir = dirname(DATA_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(DATA_PATH, JSON.stringify(EMPTY_DATA, null, 2) + "\n");
    return EMPTY_DATA;
  }
  const raw = readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

function saveData(data) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");
}

function makeProperty(scraped) {
  return {
    id: randomUUID(),
    title: scraped.title,
    address: scraped.address,
    tower: "",
    rent: scraped.rent,
    bedrooms: scraped.bedrooms,
    bathrooms: scraped.bathrooms,
    sqft: scraped.sqft ?? null,
    floor: scraped.floor ?? null,
    url: scraped.url,
    images: scraped.images,
    floorplans: scraped.floorplans ?? [],
    description: scraped.description ?? "",
    keyFeatures: scraped.keyFeatures ?? [],
    nearestStations: scraped.nearestStations ?? [],
    agentName: scraped.agentName,
    agentPhone: scraped.agentPhone,
    status: "new",
    rating: null,
    pros: [],
    cons: [],
    visitDate: null,
    addedBy: "RightmoveBot",
    addedAt: new Date().toISOString(),
    comments: [],
    rightmoveId: scraped.rightmoveId,
    source: "rightmove",
    lastSeen: new Date().toISOString(),
    latitude: scraped.latitude,
    longitude: scraped.longitude,
    letAvailableDate: scraped.letAvailableDate ?? null,
    deposit: scraped.deposit ?? null,
    minTenancy: scraped.minTenancy ?? null,
    letType: scraped.letType ?? null,
    furnishType: scraped.furnishType ?? null,
  };
}

function makeAutoComment(text) {
  return {
    id: randomUUID(),
    author: "RightmoveBot",
    text,
    createdAt: new Date().toISOString(),
  };
}

async function sync() {
  console.log("🔄 Starting sync...\n");

  const scraped = await scrapeRightmove();
  const scrapedMap = new Map(scraped.map((s) => [s.rightmoveId, s]));

  const data = loadData();
  const existingByRmId = new Map();
  for (const p of data.properties) {
    if (p.rightmoveId) {
      existingByRmId.set(p.rightmoveId, p);
    }
  }

  let added = 0;
  let demoted = 0;
  let priceChanged = 0;
  let updated = 0;

  for (const [rmId, scrapedProp] of scrapedMap) {
    const existing = existingByRmId.get(rmId);

    if (!existing) {
      data.properties.push(makeProperty(scrapedProp));
      added++;
    } else {
      existing.lastSeen = new Date().toISOString();
      updated++;

      if (scrapedProp.rent && existing.rent !== scrapedProp.rent) {
        const oldRent = existing.rent;
        existing.rent = scrapedProp.rent;
        existing.comments.push(
          makeAutoComment(
            `Price changed: £${oldRent.toLocaleString()} → £${scrapedProp.rent.toLocaleString()} pcm`,
          ),
        );
        priceChanged++;
      }

      if (scrapedProp.images.length > existing.images.length) {
        existing.images = scrapedProp.images;
      }

      if (scrapedProp.latitude != null && existing.latitude == null) {
        existing.latitude = scrapedProp.latitude;
        existing.longitude = scrapedProp.longitude;
      }

      if (scrapedProp.floorplans?.length && !existing.floorplans?.length) {
        existing.floorplans = scrapedProp.floorplans;
      }
      if (scrapedProp.description && !existing.description) {
        existing.description = scrapedProp.description;
      }
      if (scrapedProp.keyFeatures?.length && !existing.keyFeatures?.length) {
        existing.keyFeatures = scrapedProp.keyFeatures;
      }
      if (scrapedProp.nearestStations?.length && !existing.nearestStations?.length) {
        existing.nearestStations = scrapedProp.nearestStations;
      }
      if (scrapedProp.sqft && !existing.sqft) {
        existing.sqft = scrapedProp.sqft;
      }
      if (scrapedProp.floor != null && existing.floor == null) {
        existing.floor = scrapedProp.floor;
      }
      if (scrapedProp.letAvailableDate && !existing.letAvailableDate) {
        existing.letAvailableDate = scrapedProp.letAvailableDate;
      }
      if (scrapedProp.deposit != null && existing.deposit == null) {
        existing.deposit = scrapedProp.deposit;
      }
      if (scrapedProp.minTenancy != null && existing.minTenancy == null) {
        existing.minTenancy = scrapedProp.minTenancy;
      }
      if (scrapedProp.letType && !existing.letType) {
        existing.letType = scrapedProp.letType;
      }
      if (scrapedProp.furnishType && !existing.furnishType) {
        existing.furnishType = scrapedProp.furnishType;
      }
    }
  }

  for (const prop of data.properties) {
    if (
      prop.source === "rightmove" &&
      prop.rightmoveId &&
      !scrapedMap.has(prop.rightmoveId) &&
      AUTO_DEMOTE_STATUSES.has(prop.status)
    ) {
      prop.status = "let_agreed";
      prop.comments.push(
        makeAutoComment("Listing no longer found on Rightmove — likely let agreed or removed."),
      );
      demoted++;
    }
  }

  if (!data.users.includes("RightmoveBot")) {
    data.users.push("RightmoveBot");
  }

  saveData(data);

  console.log("\n📊 Sync summary:");
  console.log(`   ✅ New listings added:    ${added}`);
  console.log(`   🔄 Existing updated:      ${updated}`);
  console.log(`   💰 Price changes:         ${priceChanged}`);
  console.log(`   🚫 Marked let agreed:     ${demoted}`);
  console.log(`   📦 Total properties:      ${data.properties.length}`);

  return { added, updated, priceChanged, demoted };
}

sync().catch((err) => {
  console.error("❌ Sync failed:", err.message);
  process.exit(1);
});
