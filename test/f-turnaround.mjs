// Arbeitspaket F: Der Schuldenberg wird als begrenzter 12-Monats-Turnaround
// spielbar. Beide Linien haben echte Kosten und bleiben RNG-neutral, solange
// keine Spielzeit vergeht.

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { newGame, exportString, importString } from '../js/state.js?v=58';
import { setzeInhalte } from '../js/content.js?v=58';
import { initialisiereMarkt } from '../js/market.js?v=58';
import { initialisiereStartbestand } from '../js/starter.js?v=58';
import { kannErhoehen, erhoeheMiete } from '../js/tenants.js?v=58';
import { advanceMonths } from '../js/engine.js?v=58';
import { resolveEvent } from '../js/events.js?v=58';
import { starteVerkauf } from '../js/verkauf.js?v=58';
import { haushaltsUeberschussMonat } from '../js/ui/kennzahlen.js?v=58';
import {
  bankAnpassungVorschau, objektCashflow, portfolioTriage,
  stabilisierungsLinien, wendeBankAnpassungAn,
} from '../js/turnaround.js?v=58';

const lade = async (name) => JSON.parse(await readFile(new URL(`../data/${name}`, import.meta.url), 'utf8'));
setzeInhalte({
  listings: await lade('listings.json'),
  tenants: await lade('tenants.json'),
  events: await lade('events.json'),
});

function schuldenberg(seed = 'arbeitspaket-f') {
  const state = newGame({ startPreset: 'schuldenberg', seedText: seed });
  initialisiereMarkt(state);
  initialisiereStartbestand(state);
  return state;
}

const auto = (state) => resolveEvent(state, 0);
const nahe = (wert, erwartet, toleranz = 1) => Math.abs(wert - erwartet) <= toleranz;

const start = schuldenberg();
const triage = portfolioTriage(start);
const linien = stabilisierungsLinien(start);
assert.equal(start.portfolio.length, 5);
assert.ok(nahe(triage.portfolioCashflow, -3302), `Start-Cashflow ${triage.portfolioCashflow}`);
assert.ok(nahe(haushaltsUeberschussMonat(start), -632), 'Der Haushalt startet sichtbar unter Wasser.');
assert.deepEqual(triage.objekte.map((o) => o.cashflow), [...triage.objekte.map((o) => o.cashflow)].sort((a, b) => a - b));
assert.equal(linien.length, 2);
assert.equal(linien[0].id, 'halten');
assert.ok(linien[0].wirkung >= start.config.turnaround.zwischenzielVerbesserungMonat);
assert.ok(linien[0].kosten > 0);
assert.equal(linien[1].id, 'verkleinern');
assert.equal(linien[1].dauer, 6);
assert.ok(linien[1].nettoerloes < 0, 'Der Exit des größten Verlustträgers darf Geld kosten.');
assert.ok(triage.objekte.filter((o) => o.chancen.length).length >= 2);

// Ein einzelner Banktermin ist weder gratis noch bereits die vollständige Rettung.
const bankProbe = schuldenberg();
const kandidat = portfolioTriage(bankProbe).objekte
  .filter((o) => o.bank.moeglich)
  .sort((a, b) => b.bank.entlastung - a.bank.entlastung)[0];
const cashVor = bankProbe.cash;
const rngVor = bankProbe.rngState;
const vorschau = bankAnpassungVorschau(bankProbe, kandidat.objekt);
const angewendet = wendeBankAnpassungAn(bankProbe, kandidat.objekt);
assert.equal(bankProbe.rngState, rngVor, 'Das Bankgespräch verbraucht keinen Zufall.');
assert.equal(bankProbe.cash, cashVor - vorschau.gebuehr);
assert.equal(angewendet.entlastung, vorschau.entlastung);
assert.ok(angewendet.restschuldMehr > 0);
assert.ok(haushaltsUeberschussMonat(bankProbe) < 0, 'Ein Termin kaschiert die Krise nicht.');
assert.throws(() => wendeBankAnpassungAn(bankProbe, kandidat.objekt), /bereits genutzt/);
const neuesDarlehen = structuredClone(bankProbe.portfolio[1]);
neuesDarlehen.gekauftMonat = 0;
assert.match(bankAnpassungVorschau(bankProbe, neuesDarlehen).grund, /Startdarlehen/);

// Halte-Linie: alle legalen Mietprüfungen plus die drei stärksten Banktermine.
const halten = schuldenberg();
const baseline = portfolioTriage(halten).portfolioCashflow;
let mietpruefungen = 0;
for (const objekt of halten.portfolio) {
  if (kannErhoehen(halten, objekt)) {
    erhoeheMiete(halten, objekt);
    mietpruefungen += 1;
  }
}
assert.ok(mietpruefungen >= 4, `Mindestens vier rechtssichere Mietprüfungen erwartet, erhalten: ${mietpruefungen}`);
for (let i = 0; i < halten.config.turnaround.bankMaxAnpassungen; i++) {
  const naechster = portfolioTriage(halten).objekte
    .filter((o) => o.bank.moeglich)
    .sort((a, b) => b.bank.entlastung - a.bank.entlastung)[0];
  assert.ok(naechster, `Bankkandidat ${i + 1} fehlt.`);
  wendeBankAnpassungAn(halten, naechster.objekt);
}
const nachHalten = portfolioTriage(halten);
assert.ok(nachHalten.portfolioCashflow - baseline >= 600);
assert.ok(haushaltsUeberschussMonat(halten) > 0);
assert.ok(nachHalten.portfolioCashflow < 0, 'Das Portfolio wird stabilisiert, aber nicht schöngerechnet.');
assert.equal(nachHalten.bankVerbraucht, 3);
assert.ok(!nachHalten.objekte.some((o) => o.bank.moeglich));
assert.match(nachHalten.objekte.find((o) => o.bank.grund)?.bank.grund || '', /Banktermine|bereits genutzt/);

const geladen = importString(exportString(halten));
assert.equal(geladen.turnaround.bankAnpassungen, 3);
assert.equal(geladen.turnaround.baselineCashflow, halten.turnaround.baselineCashflow);
assert.equal(geladen.portfolio.filter((o) => o.darlehen.turnaroundAngepasst).length, 3);

// Nichtstun schließt nach zwölf Monaten den Sonderhebel und kostet Liquidität.
const nichtsTun = schuldenberg('arbeitspaket-f-nichts-tun');
const cashStart = nichtsTun.cash;
advanceMonths(nichtsTun, 12, auto);
assert.equal(nichtsTun.monat, 12);
assert.ok(nichtsTun.cash < cashStart);
const geschlossen = bankAnpassungVorschau(nichtsTun, nichtsTun.portfolio[0]);
assert.equal(geschlossen.moeglich, false);
assert.match(geschlossen.grund, /Bankfenster.*geschlossen/);

// Verkleinerungs-Linie: Wirkung und tatsächlicher Exit treten erst nach sechs Monaten ein.
const verkleinern = schuldenberg('arbeitspaket-f-verkauf');
const schlechtestes = portfolioTriage(verkleinern).objekte[0];
const id = schlechtestes.objekt.listingId;
const cashflowEntfernt = objektCashflow(verkleinern, schlechtestes.objekt);
starteVerkauf(verkleinern, schlechtestes.objekt);
advanceMonths(verkleinern, 5, auto);
assert.ok(verkleinern.portfolio.some((o) => o.listingId === id), 'Vor Monat sechs bleibt das Risiko im Bestand.');
advanceMonths(verkleinern, 1, auto);
assert.ok(!verkleinern.portfolio.some((o) => o.listingId === id));
assert.ok(cashflowEntfernt < -1000);
assert.ok(verkleinern.entscheidungsHistorie.some((e) => e.typ === 'verkauft' && e.ziel === id));

console.log('F-TURNAROUND OK — Triage, zwei kostenpflichtige Linien, +600-€-Ziel, 12-Monats-Fenster und Save-Roundtrip');

