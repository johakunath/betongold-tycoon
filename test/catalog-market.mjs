// Objektkatalog-/Feed-Gate für Arbeitspaket E.
// Prüft Startbreite, Erstumlauf und die langfristig sichtbare Angebotsmenge.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { setzeInhalte, getListing } from '../js/content.js?v=58';
import { newGame } from '../js/state.js?v=58';
import { initialisiereMarkt, tickMarkt, sichtbareListings } from '../js/market.js?v=58';

const root = fileURLToPath(new URL('../', import.meta.url));
const listings = JSON.parse(await readFile(`${root}data/listings.json`, 'utf8'));
setzeInhalte({ listings });

const arg = process.argv.find((wert) => wert.startsWith('--seeds='));
const seeds = arg ? Number(arg.split('=')[1]) : 300;
let fehler = 0;
const check = (ok, text) => {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${text}`);
  if (!ok) fehler++;
};

let breiteStarts = 0;
let hausStarts = 0;
let sanierungsStarts = 0;
let vollstaendigeErstumlaeufe = 0;
let hoechsteSichtbarkeit = 0;
let sichtbarkeitSumme = 0;
let sichtbarkeitMonate = 0;

for (let seed = 0; seed < seeds; seed++) {
  const state = newGame({ seedText: `katalog-${seed}` });
  initialisiereMarkt(state);
  const start = sichtbareListings(state).map(({ listing }) => listing);
  const staedte = new Set(start.map((listing) => state.config.segmente[listing.segment].stadt));
  breiteStarts += Number(staedte.size === 3);
  hausStarts += Number(start.some((listing) => listing.objektart === 'haus'));
  sanierungsStarts += Number(start.some((listing) => listing.zustand <= 2));

  for (let monat = 1; monat <= 240; monat++) {
    state.monat = monat;
    tickMarkt(state);
    const sichtbar = sichtbareListings(state).length;
    hoechsteSichtbarkeit = Math.max(hoechsteSichtbarkeit, sichtbar);
    if (monat > 72) {
      sichtbarkeitSumme += sichtbar;
      sichtbarkeitMonate++;
    }
  }
  vollstaendigeErstumlaeufe += Number(Object.keys(state.markt.feed).length === listings.length);
}

const mittelSichtbar = sichtbarkeitSumme / Math.max(1, sichtbarkeitMonate);
check(breiteStarts === seeds, `Alle ${seeds} Starts enthalten Berlin, Leipzig und Meißen`);
check(hausStarts === seeds, `Alle ${seeds} Starts enthalten mindestens ein Haus`);
check(sanierungsStarts === seeds, `Alle ${seeds} Starts enthalten mindestens einen Zustand 1–2`);
check(vollstaendigeErstumlaeufe === seeds, `Alle ${listings.length} Listings erscheinen in jedem Lauf`);
check(mittelSichtbar >= 6 && mittelSichtbar <= 12,
  `Langfristig im Mittel 6–12 Angebote sichtbar (ist ${mittelSichtbar.toFixed(1)})`);
check(hoechsteSichtbarkeit <= 18,
  `Auch in 300-Seed-Spitzen nie mehr als 18 gleichzeitig sichtbar (ist ${hoechsteSichtbarkeit})`);
check(listings.every((listing) => getListing(listing.id)), 'Alle Katalog-IDs sind über den Content-Index erreichbar');

console.log(fehler ? `\n${fehler} KATALOG-GATES FEHLGESCHLAGEN` : '\nALLE KATALOG-GATES OK');
process.exit(fehler ? 1 : 0);

