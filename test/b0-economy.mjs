// Reproduzierbare B0-Matrix: 40 Listings, 80 % LTV, 2 % Anfangstilgung,
// zehn Jahre Zinsbindung. Geprüft werden Rohökonomie und höchstens zwei
// bereits sichtbare Bewirtschaftungsschritte; Kreditzusage/Haushalt bleiben
// zusätzliche Hürden und sind nicht Teil dieser isolierten Objektmatrix.

import { readFile } from 'node:fs/promises';
import { newGame } from '../js/state.js?v=41';
import { setzeInhalte } from '../js/content.js?v=41';
import { fairerWert } from '../js/market.js?v=41';
import {
  finanzierungsCashflowPfade, kreditAngebot, nebenkostenFuer,
} from '../js/finance.js?v=41';
import { fixkostenMonat, instandhaltungMonat } from '../js/immobilie.js?v=41';

const listings = JSON.parse(await readFile(new URL('../data/listings.json', import.meta.url), 'utf8'));
setzeInhalte({ listings });

const state = newGame({ schwierigkeit: 'normal', seedText: 'b0-matrix' });
// Die Matrix isoliert die Objektökonomie. Der hohe Cashwert verhindert nur,
// dass die persönliche Liquidität die nicht mutierende Kreditrechnung deckelt.
state.cash = 1_000_000_000;

let fehler = 0;
const check = (ok, text) => {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${text}`);
  if (!ok) fehler++;
};
const median = (werte) => {
  const sortiert = [...werte].sort((a, b) => a - b);
  const mitte = Math.floor(sortiert.length / 2);
  return sortiert.length % 2
    ? sortiert[mitte]
    : (sortiert[mitte - 1] + sortiert[mitte]) / 2;
};

let unveraendert = true;
const matrix = listings.map((listing) => {
  const kaufpreis = fairerWert(state, listing) * listing.preisAufschlag;
  const nebenkosten = nebenkostenFuer(state, listing, kaufpreis);
  const angebot = kreditAngebot(state, {
    listingId: listing.id,
    kaufpreis,
    eigenkapital: nebenkosten.summe + kaufpreis * 0.20,
    tilgungssatz: 0.02,
    zinsbindungJahre: 10,
  });
  const vorher = JSON.stringify(state);
  const analyse = finanzierungsCashflowPfade(state, angebot);
  unveraendert &&= JSON.stringify(state) === vorher;
  const sichtbarePfade = analyse.pfade.filter((pfad) => pfad.aktionen.length <= 2);
  return {
    listing,
    angebot,
    analyse,
    basis: analyse.basis.cashflow,
    besterPfad: Math.max(...sichtbarePfade.map((pfad) => pfad.cashflow)),
  };
});

check(matrix.length === 40, 'vollständige 40-Listing-Matrix');
check(matrix.every(({ angebot }) => Math.abs(angebot.ltv - 0.80) < 1e-9), 'alle Fälle rechnen mit exakt 80 % LTV');
check(unveraendert, 'Pfadanalysen mutieren weder State noch RNG');

const basisPositiv = matrix.filter((zeile) => zeile.basis >= 0).length;
const basisNaheNull = matrix.filter((zeile) => zeile.basis >= -state.config.bewirtschaftung.cashflowNaheNullMonat).length;
const pfadPositiv = matrix.filter((zeile) => zeile.besterPfad >= 0).length;
const pfadNaheNull = matrix.filter((zeile) => zeile.besterPfad >= -state.config.bewirtschaftung.cashflowNaheNullMonat).length;
console.log(`     Roh: ${basisPositiv}/40 positiv, Median ${Math.round(median(matrix.map((z) => z.basis)))} €/Mon., ${basisNaheNull}/40 bis −100 €`);
console.log(`     Aktive Pfade: ${pfadPositiv}/40 positiv, ${pfadNaheNull}/40 bis −100 €`);

for (const segment of Object.keys(state.config.segmente)) {
  const zeilen = matrix.filter(({ listing }) => listing.segment === segment);
  const positiv = zeilen.filter((zeile) => zeile.besterPfad >= 0);
  check(positiv.length >= 1,
    `${segment}: mindestens ein positiver Pfad mit höchstens zwei sichtbaren Handlungen (${positiv.map((z) => z.listing.id).join(', ')})`);
}

const positiveWohnungen = matrix.filter(({ listing, besterPfad }) => listing.objektart === 'wohnung' && besterPfad >= 0);
check(positiveWohnungen.length >= 6,
  `mehrere Investmentwohnungen erreichen aktiv Break-even (${positiveWohnungen.map((z) => z.listing.id).join(', ')})`);
check(pfadPositiv < matrix.length, 'keine Renditegarantie: nicht jedes Objekt wird positiv');

const wohnungen = listings.filter((listing) => listing.objektart === 'wohnung');
check(wohnungen.every((listing) => fixkostenMonat(state, listing, true) < fixkostenMonat(state, listing, false)),
  'vermietete Wohnungen tragen nur den Owner-Anteil des vollen WEG-Hausgelds');
check(wohnungen.every((listing) => instandhaltungMonat(state, listing) > 0),
  'separate Objektrücklage bleibt für Sondereigentum/Reparaturen sichtbar');

const me10 = matrix.find(({ listing }) => listing.id === 'me-10');
check(Math.round(me10.analyse.basis.miete) === 202,
  'me-10 nutzt in der Finanzierung dieselbe zustandsabhängige Marktmiete wie die spätere Vermietung');

if (fehler) {
  console.error(`\n${fehler} B0-Checks fehlgeschlagen.`);
  process.exit(1);
}
console.log('\nB0-ECONOMY OK');
