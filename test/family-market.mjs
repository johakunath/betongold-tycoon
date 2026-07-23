// Familienmarkt-Gate: Mieten vs. Meißner Familienwohnung vs. Haus.
// Prüft 300 gepaarte Seeds und die strukturellen Unterschiede der Kostenmodelle.
//
//   node test/family-market.mjs --seeds=300

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { setzeInhalte, getListing } from '../js/content.js?v=51';
import { newGame } from '../js/state.js?v=51';
import { initialisiereMarkt, fairerWert } from '../js/market.js?v=51';
import { nebenkostenFuer, kreditAngebot } from '../js/finance.js?v=51';
import { kaufeEigenheim } from '../js/eigenheim.js?v=51';
import { verkaufeEtf } from '../js/etf.js?v=51';
import { advanceMonths, gesamtMonate } from '../js/engine.js?v=51';
import { resolveEvent } from '../js/events.js?v=51';
import { berechneScores } from '../js/endgame.js?v=51';
import { fixkostenMonat, instandhaltungMonat } from '../js/immobilie.js?v=51';

const root = fileURLToPath(new URL('../', import.meta.url));
const [listings, tenants, events] = await Promise.all(['listings', 'tenants', 'events'].map(async (name) =>
  JSON.parse(await readFile(`${root}data/${name}.json`, 'utf8'))));
setzeInhalte({ listings, tenants, events });

const arg = process.argv.find((a) => a.startsWith('--seeds='));
const seeds = arg ? Number(arg.split('=')[1]) : 300;
let fehler = 0;
const check = (ok, text) => {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${text}`);
  if (!ok) fehler++;
};

function kaufeVergleichsheim(state, listingId) {
  const listing = getListing(listingId);
  const kaufpreis = Math.round(fairerWert(state, listing));
  const nk = nebenkostenFuer(state, listing, kaufpreis);
  const bank = state.config.kredit.bank[state.config.schwierigkeiten.normal.bankPuffer];
  const min = nk.summe + bank.minEkAnteil * kaufpreis;
  const zielquote = listing.objektart === 'haus' ? 0.15 : 0.20;
  const eigenkapital = Math.floor(Math.min(
    state.cash + state.etfDepot.wert,
    Math.max(min, nk.summe + zielquote * kaufpreis)
  ) / 100) * 100;
  if (eigenkapital > state.cash) verkaufeEtf(state, eigenkapital - state.cash);
  state.markt.feed[listingId] = {
    status: 'reserviert', erschienen: 0, endet: 8, aufschlag: 1,
    konkurrenz: 0, runden: 0, letztesGebotMonat: 0, reserviertPreis: kaufpreis,
  };
  const angebot = kreditAngebot(state, {
    listingId, kaufpreis, eigenkapital,
    tilgungssatz: 0.01, zinsbindungJahre: 10, nutzung: 'eigenheim',
  });
  if (!angebot.zusage) return false;
  kaufeEigenheim(state, angebot);
  return true;
}

function run(seed, listingId = null) {
  const state = newGame({ schwierigkeit: 'normal', seedText: `familie-${seed}` });
  initialisiereMarkt(state);
  const gekauft = listingId ? kaufeVergleichsheim(state, listingId) : true;
  const auto = (s) => resolveEvent(s, 0);
  advanceMonths(state, gesamtMonate(state), auto);
  return { gekauft, ...berechneScores(state) };
}

const paar = {
  wohnungGegenMiete: { vermoegen: 0, score: 0, beide: 0 },
  hausGegenMiete: { vermoegen: 0, score: 0, beide: 0 },
  hausGegenWohnung: { vermoegen: 0, score: 0, beide: 0 },
};
let wohnungKaeufe = 0;
let hausKaeufe = 0;
const mittel = { miete: 0, wohnung: 0, haus: 0, scoreMiete: 0, scoreWohnung: 0, scoreHaus: 0 };

function werte(a, b, ziel) {
  const v = a.vermoegen > b.vermoegen;
  const s = a.scores.gesamt > b.scores.gesamt;
  ziel.vermoegen += Number(v);
  ziel.score += Number(s);
  ziel.beide += Number(v && s);
}

for (let i = 0; i < seeds; i++) {
  const miete = run(i);
  const wohnung = run(i, 'me-01');
  const haus = run(i, 'me-02');
  wohnungKaeufe += Number(wohnung.gekauft);
  hausKaeufe += Number(haus.gekauft);
  mittel.miete += miete.vermoegen;
  mittel.wohnung += wohnung.vermoegen;
  mittel.haus += haus.vermoegen;
  mittel.scoreMiete += miete.scores.gesamt;
  mittel.scoreWohnung += wohnung.scores.gesamt;
  mittel.scoreHaus += haus.scores.gesamt;
  werte(wohnung, miete, paar.wohnungGegenMiete);
  werte(haus, miete, paar.hausGegenMiete);
  werte(haus, wohnung, paar.hausGegenWohnung);
}

for (const objekt of Object.values(paar)) {
  for (const key of Object.keys(objekt)) objekt[key] /= seeds;
}
for (const key of Object.keys(mittel)) mittel[key] /= seeds;

console.table(Object.entries(paar).map(([vergleich, v]) => ({
  vergleich,
  vermoegenGewinnquote: `${Math.round(v.vermoegen * 100)} %`,
  scoreGewinnquote: `${Math.round(v.score * 100)} %`,
  beidesGewinnquote: `${Math.round(v.beide * 100)} %`,
})));
console.table({
  miete: { vermoegen: Math.round(mittel.miete), score: mittel.scoreMiete.toFixed(1) },
  wohnung: { vermoegen: Math.round(mittel.wohnung), score: mittel.scoreWohnung.toFixed(1) },
  haus: { vermoegen: Math.round(mittel.haus), score: mittel.scoreHaus.toFixed(1) },
});

const probe = newGame({ seedText: 'familienmarkt-kosten' });
const wohnung = getListing('me-01');
const haus = getListing('me-02');
console.log(`Käufe: Wohnung ${wohnungKaeufe}/${seeds}, Haus ${hausKaeufe}/${seeds}`);
console.log(`Laufend inkl. Instandhaltung: Wohnung ${Math.round(fixkostenMonat(probe, wohnung) + instandhaltungMonat(probe, wohnung))} €, Haus ${Math.round(fixkostenMonat(probe, haus) + instandhaltungMonat(probe, haus))} €`);
check(wohnungKaeufe === seeds && hausKaeufe === seeds,
  `Vergleichsobjekte sind in ${seeds}/${seeds} gepaarten Seeds finanzierbar`);
check(fixkostenMonat(probe, haus) + instandhaltungMonat(probe, haus) >
  fixkostenMonat(probe, wohnung) + instandhaltungMonat(probe, wohnung),
  'Haus trägt höhere laufende Eigentümer- und Instandhaltungskosten als die Wohnung');
check(haus.grundstueck > 0 && wohnung.grundstueck === 0 && haus.eigentumsform === 'alleineigentum' && wohnung.eigentumsform === 'weg',
  'Grundstück/Alleineigentum und WEG-Wohnung sind im Content strukturell verschieden');
check(Math.max(paar.wohnungGegenMiete.beide, paar.hausGegenMiete.beide,
  paar.hausGegenWohnung.beide, 1 - paar.hausGegenWohnung.beide) < 0.90,
  'Keine der drei Wohnstrategien gewinnt Vermögen und Gesamtscore in mindestens 90 % aller Paarungen');
check(Math.max(mittel.miete, mittel.wohnung, mittel.haus) /
  Math.max(1, Math.min(mittel.miete, mittel.wohnung, mittel.haus)) < 2.5,
  'Mieten, Wohnung und Haus bleiben beim mittleren Endvermögen in derselben Größenordnung');

console.log(fehler ? `\n${fehler} FAMILIENMARKT-GATES FEHLGESCHLAGEN` : '\nALLE FAMILIENMARKT-GATES OK');
process.exit(fehler ? 1 : 0);
