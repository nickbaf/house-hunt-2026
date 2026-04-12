/**
 * Listings the scraper/sync must never ingest (user preference).
 * SIROCCO TOWER / OSTRO TOWER — Wardian, Harbour Way E14 9ZP.
 */
export const EXCLUDED_TITLE_OR_ADDRESS_SUBSTRINGS = [
  "sirocco tower",
  "ostro tower",
];

export function isExcludedScrapedListing(prop) {
  const blob = `${prop.title ?? ""} ${prop.address ?? ""}`.toLowerCase();
  return EXCLUDED_TITLE_OR_ADDRESS_SUBSTRINGS.some((s) => blob.includes(s));
}
