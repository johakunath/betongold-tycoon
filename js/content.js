// content.js — DOM-freier Zugriff auf Spielinhalte (data/*.json).
// Der Loader ist umgebungsneutral: der Browser (main.js) lädt per fetch,
// der Simtest (Node) per fs.readFile — beide rufen setzeInhalte().

let inhalte = { listings: [], tenants: [], events: [] };
let listingIndex = new Map();
let tenantIndex = new Map();
let eventIndex = new Map();

export function setzeInhalte(neu) {
  inhalte = { ...inhalte, ...neu };
  listingIndex = new Map(inhalte.listings.map((l) => [l.id, l]));
  tenantIndex = new Map(inhalte.tenants.map((t) => [t.id, t]));
  eventIndex = new Map(inhalte.events.map((e) => [e.id, e]));
}

export function alleListings() {
  return inhalte.listings;
}

export function getListing(id) {
  const l = listingIndex.get(id);
  if (!l) throw new Error(`Unbekanntes Listing: ${id}`);
  return l;
}

export function alleTenants() {
  return inhalte.tenants;
}

export function getTenant(id) {
  return tenantIndex.get(id);
}

export function alleEvents() {
  return inhalte.events;
}

export function getEvent(id) {
  const e = eventIndex.get(id);
  if (!e) throw new Error(`Unbekanntes Event: ${id}`);
  return e;
}

