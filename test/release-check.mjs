// Technischer Release-Check für die statische GitHub-Pages-Auslieferung.
// Prüft Abhängigkeiten und Content, ohne Browser oder Build-Schritt.

import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DEFAULT_CONFIG, SAVE_VERSION, UI_VERSION, START_PRESETS } from '../js/config.js?v=56';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
let fehler = 0;

function check(ok, text) {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${text}`);
  if (!ok) fehler++;
}

async function existiert(pfad) {
  try { return (await stat(pfad)).isFile(); } catch { return false; }
}

async function dateienUnter(ordner) {
  const result = [];
  for (const eintrag of await readdir(ordner, { withFileTypes: true })) {
    const pfad = join(ordner, eintrag.name);
    if (eintrag.isDirectory()) result.push(...await dateienUnter(pfad));
    else result.push(pfad);
  }
  return result;
}

const htmlPfad = join(root, 'index.html');
const html = await readFile(htmlPfad, 'utf8');
check(/<html\s+lang="de">/.test(html) && /name="viewport"/.test(html), 'HTML hat Sprache und Viewport');
check(html.includes('type="module"') && !html.includes('file://'), 'ES-Modul-Einstieg ohne file://-Abhängigkeit');

const refs = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
  .map((treffer) => treffer[1])
  .filter((ref) => !/^(?:https?:|data:|mailto:)/.test(ref));
for (const ref of refs) {
  const lokal = ref.split('?')[0];
  check(await existiert(join(root, lokal)), `HTML-Referenz existiert: ${lokal}`);
}
const cacheVersionen = refs.map((ref) => ref.match(/[?&]v=(\d+)/)?.[1]).filter(Boolean);
check(cacheVersionen.length >= 2 && cacheVersionen.every((v) => Number(v) === UI_VERSION),
  `Cachebuster entspricht UI-Version ${UI_VERSION}`);

const cssEntrypoint = await readFile(join(root, 'css', 'style.css'), 'utf8');
const cssImports = [...cssEntrypoint.matchAll(/@import url\("\.\/(.+?\.css)\?v=(\d+)"\);/g)];
check(cssImports.length === 7, 'CSS-Entrypoint lädt sieben geordnete Wartungsschichten');
for (const [, datei, version] of cssImports) {
  check(Number(version) === UI_VERSION, `CSS-Import ${datei} verwendet UI-Version ${UI_VERSION}`);
  check(await existiert(join(root, 'css', datei)), `CSS-Import existiert: ${datei}`);
}

const codeDateien = (await dateienUnter(join(root, 'js'))).filter((p) => ['.js', '.mjs'].includes(extname(p)));
let importAnzahl = 0;
let versionierteImports = 0;
for (const datei of codeDateien) {
  const code = await readFile(datei, 'utf8');
  const imports = [...code.matchAll(/(?:from\s+|import\s*)['"](\.[^'"]+)['"]/g)].map((m) => m[1]);
  for (const imp of imports) {
    importAnzahl++;
    const lokal = imp.split('?')[0];
    if (Number(imp.match(/[?&]v=(\d+)/)?.[1]) === UI_VERSION) versionierteImports++;
    check(await existiert(resolve(datei, '..', lokal)), `Import existiert: ${lokal}`);
  }
}
check(importAnzahl > 20, `${importAnzahl} lokale Modulimporte geprüft`);
check(versionierteImports === importAnzahl,
  `gesamter Modulgraph verwendet UI-Version ${UI_VERSION}`);

const daten = {};
for (const name of ['listings', 'tenants', 'events']) {
  try {
    daten[name] = JSON.parse(await readFile(join(root, 'data', `${name}.json`), 'utf8'));
    const ids = daten[name].map((eintrag) => eintrag.id);
    check(ids.length > 0 && new Set(ids).size === ids.length, `${name}.json: gültig, IDs eindeutig (${ids.length})`);
  } catch (error) {
    check(false, `${name}.json lesbar: ${error.message}`);
  }
}

const presetIds = Object.keys(START_PRESETS);
const listingIds = new Set((daten.listings || []).map((listing) => listing.id));
check(JSON.stringify(presetIds) === JSON.stringify(['heute', 'klassisch', 'schuldenberg', 'handwerker'])
  && START_PRESETS.schuldenberg.startbestand.length === 5
  && START_PRESETS.schuldenberg.startbestand.every((objekt) => listingIds.has(objekt.listingId))
  && START_PRESETS.handwerker.beruf.handwerklich
  && START_PRESETS.handwerker.haushalt.einkommensSpruenge.length === 1,
'Vier Startpresets inklusive gültigem Schuldenberg-Bestand und Handwerkerprofil');
for (const [id, preset] of Object.entries(START_PRESETS)) {
  check(typeof preset.bild === 'string' && await existiert(join(root, preset.bild)),
    `Startpreset-Bild existiert: ${id}`);
}
check(SAVE_VERSION === 21
  && DEFAULT_CONFIG.kapitalsteuer.pauschbetragProPerson === 1000
  && DEFAULT_CONFIG.kapitalsteuer.personen === 2
  && DEFAULT_CONFIG.kapitalsteuer.etfTeilfreistellung === 0.30
  && Object.keys(DEFAULT_CONFIG.mieter.vermietungsmodelle).length === 3
  && DEFAULT_CONFIG.bewirtschaftung.cashflowNaheNullMonat === 100,
'Save v21, Kapitalsteuer, Cashflow-Korridor und drei Vermietungswege vollständig');
check((daten.listings || []).some((listing) => listing.segment === 'meissen-umland')
  && !(daten.listings || []).some((listing) => /rostock/i.test(`${listing.segment} ${listing.adresse} ${listing.titel}`))
  && ['me-01', 'me-02', 'me-03'].every((id) => listingIds.has(id)),
'Meißen + Umland ersetzt den früheren Küstenmarkt in Content und IDs');

const berlinListings = (daten.listings || []).filter((listing) => listing.segment.startsWith('berlin-'));
const leipzigListings = (daten.listings || []).filter((listing) => listing.segment === 'leipzig');
const meissenListings = (daten.listings || []).filter((listing) => listing.segment === 'meissen-umland');
check((daten.listings || []).length >= 40
  && berlinListings.length >= 20 && leipzigListings.length >= 10 && meissenListings.length >= 10,
'Objektkatalog: mindestens 20 Berlin sowie je 10 Leipzig und Meißen + Umland');
check(berlinListings.filter((listing) => listing.objektart === 'haus').length >= 6
  && berlinListings.filter((listing) => listing.objektart === 'haus').length <= 8
  && berlinListings.some((listing) => listing.stil === 'neubau' && listing.zustand >= 4)
  && berlinListings.some((listing) => listing.zustand === 1),
'Berlin: ungefähr ein Drittel Häuser sowie Neubau, guter Bestand und Sanierungsfälle');
check((daten.listings || []).filter((listing) => listing.zustand <= 2).length >= 10
  && (daten.listings || []).filter((listing) => listing.ausstattung === 'unmoebliert').length >= 10
  && (daten.listings || []).some((listing) => /^(?:EG|Souterrain)/.test(listing.etage)),
'Katalog enthält breite Zustandsvarianz, mindestens 10 unmöblierte und Erdgeschossangebote');

const listingPflichtfelder = [
  'id', 'titel', 'segment', 'adresse', 'flaeche', 'zimmer', 'etage', 'baujahr', 'stil',
  'objektart', 'eigentumsform', 'grundstueck', 'aussenflaeche', 'familienScore',
  'barrierearm', 'kartenposition', 'zustand', 'energieklasse', 'hausgeld', 'lageScore',
  'preisAufschlag', 'provisionsfrei', 'mietstatus', 'maklerText', 'besichtigung',
  'dokumente', 'maengel',
];
check((daten.listings || []).every((listing) => listingPflichtfelder.every((feld) => listing[feld] !== undefined)
  && Array.isArray(listing.besichtigung) && listing.besichtigung.length > 0
  && Array.isArray(listing.dokumente) && listing.dokumente.length > 0
  && Array.isArray(listing.maengel)
  && Number.isFinite(listing.kartenposition?.x) && Number.isFinite(listing.kartenposition?.y)
  && (listing.objektart === 'wohnung' || (listing.grundstueck > 0 && listing.laufendeKosten))),
'Alle Listings besitzen vollständige Kauf-, DD-, Risiko-, Nutzungs- und Kartendaten');

const assetHashes = new Map();
let assetWiederverwendung = null;
let placeholderListings = 0;
for (const listing of daten.listings || []) {
  const istPlaceholder = listing.assetStatus === 'placeholder';
  placeholderListings += Number(istPlaceholder);
  for (const rel of [
    `assets/expose/${listing.id}.webp`,
    `assets/cutaway/${listing.id}_unsaniert.webp`,
    `assets/cutaway/${listing.id}_saniert.webp`,
  ]) {
    const pfad = join(root, rel);
    const vorhanden = await existiert(pfad);
    if (istPlaceholder) {
      check(!vorhanden, `Bewusster SVG-Platzhalter aktiv: ${rel}`);
      continue;
    }
    check(vorhanden, `Asset existiert: ${rel}`);
    if (vorhanden) {
      const hash = createHash('sha256').update(await readFile(pfad)).digest('hex');
      const anderesAsset = assetHashes.get(hash);
      if (anderesAsset && anderesAsset !== rel) assetWiederverwendung = `${anderesAsset} / ${rel}`;
      else assetHashes.set(hash, rel);
    }
  }
}
check((daten.listings || []).every((listing) => listing.assetStatus === undefined || listing.assetStatus === 'placeholder'),
  `${placeholderListings} Listings mit gültigem temporärem Asset-Platzhalterstatus`);
check(!assetWiederverwendung, assetWiederverwendung
  ? `Listing-Bilder byte-identisch: ${assetWiederverwendung}`
  : 'Keine Listing-Bilder sind byte-identisch');
for (const tenant of daten.tenants || []) {
  const rel = `assets/avatar/${tenant.id}.webp`;
  check(await existiert(join(root, rel)), `Asset existiert: ${rel}`);
}

const assetDateien = await dateienUnter(join(root, 'assets'));
const assetBytes = (await Promise.all(assetDateien.map(async (p) => (await stat(p)).size)))
  .reduce((summe, bytes) => summe + bytes, 0);
check(assetBytes < 15 * 1024 * 1024,
  `Assetbudget: ${assetDateien.length} Dateien, ${(assetBytes / 1024 / 1024).toFixed(2)} MB < 15 MB`);

const pruefDateien = (await dateienUnter(root)).filter((p) =>
  !p.includes(`${join(root, 'assets')}\\`) &&
  ['.js', '.mjs', '.json', '.html', '.css', '.md'].includes(extname(p)));
let konflikt = null;
for (const datei of pruefDateien) {
  if (/^<{7} |^={7}$|^>{7} /m.test(await readFile(datei, 'utf8'))) { konflikt = datei; break; }
}
check(!konflikt, konflikt ? `Merge-Marker in ${konflikt}` : 'Keine ungelösten Merge-Marker');
check(await existiert(join(root, '.nojekyll')), '.nojekyll für GitHub Pages vorhanden');

if (fehler) {
  console.error(`\nRELEASE CHECK: ${fehler} Fehler`);
  process.exitCode = 1;
} else {
  console.log('\nRELEASE CHECK OK');
}

