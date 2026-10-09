// Arbeitspaket E: Anlass → Prüfung → Entscheidung → Wirkung bleibt eine
// DOM-/RNG-neutrale, speicherbare Kernschleife. Ein Weggang zählt als Erfolg.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { newGame, exportString, importString } from '../js/state.js?v=60';
import { setzeInhalte } from '../js/content.js?v=60';
import {
  initialisiereMarkt, sichtbareListings, besichtigen, dokumenteAnfordern,
  gutachterBeauftragen, angebotBeobachten, angebotVerwerfen, angebotNeuPruefen,
} from '../js/market.js?v=60';
import {
  dealEntscheidung, letzteWirkung, monatsAnlass, pruefstand,
} from '../js/gameplay.js?v=60';

setzeInhalte({ listings: JSON.parse(fs.readFileSync(new URL('../data/listings.json', import.meta.url), 'utf8')) });

const state = newGame({ seedText: 'arbeitspaket-e' });
initialisiereMarkt(state);
const listing = sichtbareListings(state)[0].listing;
const id = listing.id;

assert.equal(monatsAnlass(state).typ, 'expose');
assert.match(monatsAnlass(state).text, /prüfen|Prüfung/i);
assert.deepEqual(pruefstand(state, id), {
  schritte: 0, gesamt: 3, zeit: 0, kosten: 0, funde: 0,
  restunsicherheit: 100, label: 'sehr hoch',
});

besichtigen(state, id);
assert.equal(pruefstand(state, id).schritte, 1);
assert.equal(pruefstand(state, id).restunsicherheit, 72);
dokumenteAnfordern(state, id);
assert.equal(pruefstand(state, id).schritte, 2);
assert.equal(pruefstand(state, id).restunsicherheit, 43);
const cashVorGutachten = state.cash;
gutachterBeauftragen(state, id);
const voll = pruefstand(state, id);
assert.equal(voll.schritte, 3);
assert.equal(voll.restunsicherheit, 15);
assert.equal(voll.label, 'niedrig, nie null');
assert.equal(state.cash, cashVorGutachten - state.config.dueDiligence.gutachterKosten);

const rngVorEntscheidung = state.rngState;
assert.equal(angebotBeobachten(state, id).ok, true);
assert.equal(dealEntscheidung(state, id).typ, 'beobachtet');
assert.ok(state.favoriten.includes(id));
assert.equal(state.rngState, rngVorEntscheidung, 'Beobachten verbraucht keinen RNG');
assert.match(letzteWirkung(state).text, /nächsten Chance|Beobachtung/i);
assert.equal(monatsAnlass(state).ziel, id);

angebotNeuPruefen(state, id);
assert.equal(dealEntscheidung(state, id), null);
assert.equal(angebotVerwerfen(state, id).ok, true);
assert.equal(dealEntscheidung(state, id).typ, 'verworfen');
assert.ok(!state.favoriten.includes(id));
assert.equal(state.rngState, rngVorEntscheidung, 'Weggehen verbraucht keinen RNG');
assert.equal(letzteWirkung(state).titel, 'Guter Weggang');
assert.match(letzteWirkung(state).text, /kein Kapital gebunden/i);

for (const eintrag of sichtbareListings(state)) {
  if (eintrag.listing.id !== id) angebotVerwerfen(state, eintrag.listing.id);
}
const warten = monatsAnlass(state);
assert.equal(warten.typ, 'marktplatz');
assert.match(warten.titel, /beobachten|Marktchance/i);
assert.match(warten.text, /Kein Kaufzwang|Puffer/i);

const geladen = importString(exportString(state));
assert.equal(dealEntscheidung(geladen, id).typ, 'verworfen');
assert.equal(letzteWirkung(geladen).typ, 'weggegangen');
assert.equal(pruefstand(geladen, id).schritte, 3);

console.log('E-GAMEPLAY OK — Anlass, 3 Prüfungen, Beobachten, guter Weggang, Monatsgrund und Save-Roundtrip');

