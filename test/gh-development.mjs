// Arbeitspakete G/H: langfristige Folgen, freiwillige Ziele und echte
// Einkommen-/Zeit-/Familien-Trade-offs bleiben DOM- und RNG-frei testbar.

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { newGame, exportString, importString } from '../js/state.js?v=54';
import { setzeInhalte } from '../js/content.js?v=54';
import { initialisiereMarkt } from '../js/market.js?v=54';
import { initialisiereStartbestand } from '../js/starter.js?v=54';
import { advanceMonths, monatsWerte, zeitVerbrauch } from '../js/engine.js?v=54';
import { resolveEvent } from '../js/events.js?v=54';
import { objektArcsFuerObjekt } from '../js/arcs.js?v=54';
import { setzeEntwicklungsziel, zielStatus } from '../js/goals.js?v=54';
import {
  aktualisiereLebensphasen, arbeitsmodellRestbindung, naechsteLebensphase,
  setzeArbeitsmodell, zeitbudgetMonat,
} from '../js/life.js?v=54';
import { monatsAnlass } from '../js/gameplay.js?v=54';
import { renovierungsOptionen, starteRenovierung } from '../js/renovation.js?v=54';

const lade = async (name) => JSON.parse(await readFile(new URL(`../data/${name}`, import.meta.url), 'utf8'));
setzeInhalte({
  listings: await lade('listings.json'), tenants: await lade('tenants.json'),
  events: await lade('events.json'),
});

function start(seed = 'gh-entwicklung') {
  const state = newGame({ startPreset: 'schuldenberg', seedText: seed });
  initialisiereMarkt(state);
  initialisiereStartbestand(state);
  state.config.events.eventChanceBasis = 0;
  state.config.events.eventChanceJeObjekt = 0;
  return state;
}

// G2: Ziele verändern weder Geld noch RNG und beziehen Fortschritt aus Fachstate.
const ziele = start();
const cashVor = ziele.cash;
const rngVor = ziele.rngState;
setzeEntwicklungsziel(ziele, 'bestandStabilisieren');
assert.equal(ziele.cash, cashVor);
assert.equal(ziele.rngState, rngVor);
assert.equal(zielStatus(ziele).fristMonate, 60);
assert.ok(zielStatus(ziele).maximum === 2 && zielStatus(ziele).wert < 2);
setzeEntwicklungsziel(ziele, 'eigenheim');
assert.equal(ziele.entwicklung.zielSeitMonat, ziele.monat, 'Zielwechsel startet ohne versteckte Altfrist.');
setzeEntwicklungsziel(ziele, null);
assert.equal(zielStatus(ziele), null);

// G1: Eine Entscheidung plant eine deterministische Folge mit anderem späteren Text.
const arcA = start('gh-arc-a');
arcA.aktivesEvent = { eventId: 'schimmel-bad', objektIndex: 0, monat: 0 };
resolveEvent(arcA, 0);
const geplantA = objektArcsFuerObjekt(arcA, arcA.portfolio[0])[0];
assert.equal(geplantA.folgeEventId, 'arc-schimmel-pruefung');
assert.equal(geplantA.faelligMonat, 3);
advanceMonths(arcA, 3);
assert.equal(arcA.aktivesEvent.eventId, 'arc-schimmel-pruefung');
assert.equal(arcA.monat, 3);
const cashArcVor = arcA.cash;
resolveEvent(arcA, 0);
assert.equal(geplantA.status, 'abgeschlossen');
assert.ok(arcA.cash < cashArcVor);

const arcB = start('gh-arc-b');
arcB.aktivesEvent = { eventId: 'schimmel-bad', objektIndex: 0, monat: 0 };
resolveEvent(arcB, 1);
const geplantB = objektArcsFuerObjekt(arcB, arcB.portfolio[0])[0];
assert.equal(geplantB.folgeEventId, 'arc-schimmel-nachsorge');
assert.equal(geplantB.faelligMonat, 6);
assert.notEqual(geplantA.folgeEventId, geplantB.folgeEventId);

// Finanzierungs-Arc: Beratung führt erst ein Jahr später zur echten Reservewahl.
const zinsArc = start('gh-zins-arc');
zinsArc.aktivesEvent = { eventId: 'zins-anschluss-angebot', objektIndex: 0, monat: 0 };
resolveEvent(zinsArc, 0);
advanceMonths(zinsArc, 11, (state) => resolveEvent(state, 0));
advanceMonths(zinsArc, 1);
assert.equal(zinsArc.aktivesEvent.eventId, 'arc-zinsplanung');
const schuldVor = zinsArc.portfolio[0].darlehen.restschuld;
const cashZinsVor = zinsArc.cash;
resolveEvent(zinsArc, 0);
assert.equal(zinsArc.portfolio[0].darlehen.restschuld, schuldVor - 5000);
assert.equal(zinsArc.cash, cashZinsVor - 5000);

// H: Arbeitsmodelle verbinden dauerhaft Einkommen, Zeit und Familienziel.
const arbeit = newGame({ seedText: 'gh-arbeit' });
initialisiereMarkt(arbeit);
const einkommenBasis = monatsWerte(arbeit).einkommen;
const rngArbeit = arbeit.rngState;
assert.equal(setzeArbeitsmodell(arbeit, 'karriere'), true);
assert.equal(monatsWerte(arbeit).einkommen, einkommenBasis + 650);
assert.equal(zeitVerbrauch(arbeit), 6);
assert.equal(arbeitsmodellRestbindung(arbeit), 12);
assert.throws(() => setzeArbeitsmodell(arbeit, 'familienzeit'), /noch 12 Monate/);
assert.equal(arbeit.rngState, rngArbeit);
advanceMonths(arbeit, 12, (state) => resolveEvent(state, 0));
assert.equal(arbeitsmodellRestbindung(arbeit), 0);
setzeArbeitsmodell(arbeit, 'familienzeit');
assert.equal(monatsWerte(arbeit).arbeitsmodellDelta, -900);
assert.equal(zeitbudgetMonat(arbeit), arbeit.config.budget.zeitProMonat + 8);

// Lebensphasen werden einmal angekündigt und können den nächsten Zug begründen.
const phase = newGame({ seedText: 'gh-phase' });
initialisiereMarkt(phase);
assert.equal(naechsteLebensphase(phase).id, 'auto');
assert.ok(aktualisiereLebensphasen(phase));
assert.equal(aktualisiereLebensphasen(phase), null);
assert.equal(phase.entwicklung.lebensphasenAngekundigt.length, 1);
phase.markt.feed = {};
assert.equal(monatsAnlass(phase).typ, 'haushalt');

// Eigenleistung spart begrenzt Geld und erkauft dies mit Zeit plus höherem Risiko.
const eigen = start('gh-eigenleistung');
const objekt = eigen.portfolio[0];
objekt.vermietet = false;
objekt.mieter = null;
const basis = renovierungsOptionen(eigen, objekt).find((o) => o.id === 'kuecheBad');
const selbst = renovierungsOptionen(eigen, objekt, true).find((o) => o.id === 'kuecheBad');
assert.ok(selbst.schaetzung < basis.schaetzung);
assert.ok(selbst.eigenleistung.ersparnis <= eigen.config.renovierung.eigenleistung.ersparnisMax);
assert.ok(selbst.eigenleistung.zeitProMonat > 0);
assert.ok(selbst.risikoProzent > basis.risikoProzent);
starteRenovierung(eigen, objekt, 'kuecheBad', true);
assert.equal(objekt.renovierung.eigenleistung.zeitProMonat, selbst.eigenleistung.zeitProMonat);
assert.ok(zeitVerbrauch(eigen) > eigen.config.renovierung.zeitProRenovierung);

const geladen = importString(exportString(eigen));
assert.equal(geladen.entwicklung.arbeitsmodellId, 'balance');
assert.equal(geladen.objektArcs.length, 0);
assert.ok(geladen.portfolio[0].renovierung.eigenleistung);

console.log('G/H-DEVELOPMENT OK — Ziele, drei Arc-Typen, Arbeitsmodelle, Lebensphasen, Eigenleistung und Save-Roundtrip');

