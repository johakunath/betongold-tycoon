// Kleine, gezielte Balance-Regressionen für frühere dominante Strategien.
//
//   node test/balance-regressions.mjs
//   node test/balance-regressions.mjs --seeds=300
//
// Der breite Harness in balance.mjs prüft vollständige Kampagnenstrategien.
// Diese Datei hält bewusst die zwei historischen Ausreißer separat und schnell:
// Renovierungsrenditen sowie möbliert gegen unmöbliert über zehn Jahre.

import { readFile } from 'node:fs/promises';
import { newGame } from '../js/state.js?v=52';
import { setzeInhalte, alleListings, getListing } from '../js/content.js?v=52';
import { initialisiereMarkt, fairerWert } from '../js/market.js?v=52';
import { kreditAngebot, kaufeObjekt } from '../js/finance.js?v=52';
import {
  starteVermietung, neueBewerber, waehleBewerber,
} from '../js/tenants.js?v=52';
import { advanceMonths, nettovermoegen } from '../js/engine.js?v=52';
import { resolveEvent } from '../js/events.js?v=52';

const lade = async (name) =>
  JSON.parse(await readFile(new URL(`../data/${name}`, import.meta.url), 'utf8'));

setzeInhalte({
  listings: await lade('listings.json'),
  tenants: await lade('tenants.json'),
  events: await lade('events.json'),
});

const seedArg = process.argv.find((arg) => arg.startsWith('--seeds='));
const seedAnzahl = Math.max(50, Number(seedArg?.split('=')[1] || 120));
const ergebnisse = [];

function gate(name, ok, detail) {
  ergebnisse.push({ name, ok, detail });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}

function zielZustand(stufe, start) {
  const ziel = stufe.zustandZiel === '+1' ? start + 1 : stufe.zustandZiel;
  return Math.max(start, Math.min(stufe.maxZustand, ziel));
}

function renovierungsMatrix() {
  const state = newGame({ seedText: 'reno-regression' });
  initialisiereMarkt(state);
  const matrix = {};

  for (const [id, stufe] of Object.entries(state.config.renovierung.stufen)) {
    const netto = [];
    for (const listing of alleListings()) {
      const ziel = zielZustand(stufe, listing.zustand);
      if (ziel <= listing.zustand && !stufe.energieBonus) continue;
      const vorher = fairerWert(state, listing);
      const nachher = fairerWert(state, {
        ...listing,
        zustand: ziel,
        wertBonus: (listing.wertBonus || 0) + (stufe.wertBonus || 0),
      });
      const risiko = Math.max(0,
        state.config.renovierung.ueberziehungBasis +
        (5 - listing.zustand) * state.config.renovierung.ueberziehungJeZustand
      );
      const erwarteteKosten = listing.flaeche * stufe.kostenM2 * (1 + risiko);
      netto.push(nachher - vorher - erwarteteKosten);
    }
    matrix[id] = {
      anzahl: netto.length,
      positiv: netto.filter((wert) => wert > 0).length,
      positivQuote: netto.filter((wert) => wert > 0).length / Math.max(1, netto.length),
      median: [...netto].sort((a, b) => a - b)[Math.floor(netto.length / 2)] || 0,
    };
  }
  return { state, matrix };
}

const { state: renoState, matrix: reno } = renovierungsMatrix();
gate(
  'Kosmetische Renovierung ist kein unmittelbarer Autopick',
  reno.kosmetisch.positivQuote < 0.75,
  `${reno.kosmetisch.positiv}/${reno.kosmetisch.anzahl} Objekte sofort positiv`
);
gate(
  'Teurere Renovierungsalternativen besitzen selektive Einsatzfälle',
  reno.kuecheBad.positiv >= 1 && reno.grundriss.positiv >= 1,
  `Küche/Bad ${reno.kuecheBad.positiv}, Grundriss ${reno.grundriss.positiv}`
);

const grundriss = renoState.config.renovierung.stufen.grundriss;
const grundrissListing = alleListings().find((listing) => listing.zustand < grundriss.maxZustand);
const grundrissZiel = zielZustand(grundriss, grundrissListing.zustand);
const wertOhneBonus = fairerWert(renoState, { ...grundrissListing, zustand: grundrissZiel });
const wertMitBonus = fairerWert(renoState, {
  ...grundrissListing,
  zustand: grundrissZiel,
  wertBonus: grundriss.wertBonus,
});
gate(
  'Grundriss-Wertbonus fließt in die Bewertung ein',
  wertMitBonus > wertOhneBonus,
  `+${Math.round(wertMitBonus - wertOhneBonus).toLocaleString('de-DE')} € im Prüffall`
);

const energieFaktoren = renoState.config.bewirtschaftung.energieEventFaktor;
const klassen = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const energieStufe = renoState.config.renovierung.stufen.energetisch;
const energieVerbessert = klassen.every((klasse, index) => {
  const ziel = klassen[Math.max(0, index - energieStufe.energieBonus)];
  return (energieFaktoren[ziel] ?? 1) <= (energieFaktoren[klasse] ?? 1);
});
const energieSenkt = klassen.some((klasse, index) => {
  const ziel = klassen[Math.max(0, index - energieStufe.energieBonus)];
  return (energieFaktoren[ziel] ?? 1) < (energieFaktoren[klasse] ?? 1);
});
gate(
  'Energetische Sanierung senkt die Objekt-Event-Exposure',
  energieVerbessert && energieSenkt,
  'Energieklasse +2 verschlechtert keinen Faktor und verbessert mindestens einen'
);

function basisObjekt(seedIndex) {
  const state = newGame({ schwierigkeit: 'normal', seedText: `moebliert-regression-${seedIndex}` });
  initialisiereMarkt(state);
  state.cash = 500000;
  // Mieterwechsel bleibt aktiv; allgemeine Dilemma-Events und verborgene Mängel
  // werden isoliert, damit dieses Gate nur die Möblierungsentscheidung misst.
  state.config.events.eventChanceBasis = 0;
  state.config.events.eventChanceJeObjekt = 0;

  const listing = getListing('bi-02');
  const kaufpreis = Math.round(fairerWert(state, listing));
  state.markt.feed[listing.id] = {
    status: 'reserviert',
    reserviertPreis: kaufpreis,
    aufschlag: 1,
    erschienen: 0,
    endet: 999,
    konkurrenz: 0,
  };
  const angebot = kreditAngebot(state, {
    listingId: listing.id,
    kaufpreis,
    eigenkapital: kaufpreis * 0.4,
    tilgungssatz: 0.02,
    zinsbindungJahre: 10,
    nutzung: 'kapitalanlage',
  });
  if (!angebot.zusage) throw new Error(`Regression-Setup nicht finanzierbar: ${angebot.gruende.join(', ')}`);
  kaufeObjekt(state, angebot);
  for (const existenz of Object.values(state.maengelExistenz)) {
    existenz.maengel = existenz.maengel.map(() => false);
    existenz.sonderumlage = false;
  }
  return state;
}

function vermieteWennLeer(state, moebliert) {
  const objekt = state.portfolio[0];
  if (objekt.vermietet || objekt.renovierung) return;
  if (!objekt.suche) starteVermietung(state, objekt, 'auf', moebliert);
  else if (objekt.suche.bewerber.length === 0) neueBewerber(state, objekt);
  const kandidat = objekt.suche?.bewerber?.[0];
  if (kandidat) waehleBewerber(state, objekt, kandidat.id);
}

let moebliertGewinnt = 0;
let differenzSumme = 0;
for (let index = 0; index < seedAnzahl; index++) {
  const basis = basisObjekt(index);
  const unmoebliert = structuredClone(basis);
  const moebliert = structuredClone(basis);
  vermieteWennLeer(unmoebliert, false);
  vermieteWennLeer(moebliert, true);

  for (let monat = 0; monat < 120; monat++) {
    vermieteWennLeer(unmoebliert, false);
    vermieteWennLeer(moebliert, true);
    advanceMonths(unmoebliert, 1, (state) => resolveEvent(state, 0));
    advanceMonths(moebliert, 1, (state) => resolveEvent(state, 0));
  }

  const differenz = nettovermoegen(moebliert) - nettovermoegen(unmoebliert);
  differenzSumme += differenz;
  if (differenz > 0) moebliertGewinnt++;
}

const moebliertQuote = moebliertGewinnt / seedAnzahl;
gate(
  'Möblierung bleibt über zehn Jahre ein Trade-off',
  moebliertQuote >= 0.25 && moebliertQuote <= 0.75,
  `${moebliertGewinnt}/${seedAnzahl} Siege, Ø ${Math.round(differenzSumme / seedAnzahl).toLocaleString('de-DE')} € Differenz`
);

if (ergebnisse.some((ergebnis) => !ergebnis.ok)) process.exitCode = 1;
else console.log(`\nALLE ${ergebnisse.length} GEZIELTEN BALANCE-REGRESSIONEN OK`);
