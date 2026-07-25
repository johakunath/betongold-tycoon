// Reproduzierbarer Multi-Seed-Balance-Harness für Phase 5.
//
//   node test/balance.mjs                 # 120 Seeds je Schwierigkeit
//   node test/balance.mjs --seeds=300     # breiter Release-Lauf
//   node test/balance.mjs --json          # maschinenlesbare Ausgabe
//
// Die Strategien sind bewusst einfache, feste Policies. Sie behaupten keine
// optimale Spielweise; sie zeigen robuste Ausreißer und Richtungen.

import { readFile } from 'node:fs/promises';
import { newGame } from '../js/state.js?v=54';
import { setzeInhalte, alleListings } from '../js/content.js?v=54';
import {
  initialisiereMarkt, sichtbareListings, gebotAbgeben, vergleichsmiete,
  gutachterBeauftragen,
} from '../js/market.js?v=54';
import { kreditAngebot, kaufeObjekt, nebenkostenFuer } from '../js/finance.js?v=54';
import { kaufeEigenheim } from '../js/eigenheim.js?v=54';
import { starteVermietung, neueBewerber, waehleBewerber } from '../js/tenants.js?v=54';
import { resolveEvent } from '../js/events.js?v=54';
import { advanceMonths, gesamtMonate, nettovermoegen } from '../js/engine.js?v=54';
import { berechneScores } from '../js/endgame.js?v=54';

const lade = async (name) =>
  JSON.parse(await readFile(new URL(`../data/${name}`, import.meta.url), 'utf8'));
setzeInhalte({
  listings: await lade('listings.json'),
  tenants: await lade('tenants.json'),
  events: await lade('events.json'),
});

const seedArg = process.argv.find((a) => a.startsWith('--seeds='));
const seedAnzahl = Math.max(10, Number(seedArg?.split('=')[1] || 120));
const jsonAusgabe = process.argv.includes('--json');
const gatesPruefen = process.argv.includes('--check');
const schwierigkeiten = ['leicht', 'normal', 'schwer'];
const auto = (state) => resolveEvent(state, 0);

const STRATEGIEN = [
  { id: 'miete', label: 'Nur Miete/ETF', art: 'keine' },
  { id: 'hebel-min', label: 'Invest: Mindest-EK', art: 'invest', ekAnteil: 'minimum' },
  { id: 'hebel-25', label: 'Invest: 25 % EK', art: 'invest', ekAnteil: 0.25 },
  { id: 'hebel-40', label: 'Invest: 40 % EK', art: 'invest', ekAnteil: 0.40 },
  { id: 'heim-frueh', label: 'Heim zuerst, dann Invest', art: 'kombiniert', abMonat: 0, investVorher: 0 },
  { id: 'heim-mitte', label: '2 Investments, dann Heim', art: 'kombiniert', abMonat: 96, investVorher: 2 },
  { id: 'heim-spaet', label: '3 Investments, dann Heim', art: 'kombiniert', abMonat: 192, investVorher: 3 },
];

function vermieteLeerstaende(state) {
  for (const objekt of state.portfolio) {
    if (objekt.vermietet || objekt.renovierung) continue;
    if (!objekt.suche) starteVermietung(state, objekt, 'auf', false);
    else if (objekt.suche.generiertMonat < state.monat && objekt.suche.bewerber.length === 0) {
      neueBewerber(state, objekt);
    }
    const kandidat = objekt.suche?.bewerber?.[0];
    if (kandidat) waehleBewerber(state, objekt, kandidat.id);
  }
}

function zielEigenkapital(state, listing, kaufpreis, policy) {
  const nk = nebenkostenFuer(state, listing, kaufpreis);
  const bank = state.config.kredit.bank[
    state.config.schwierigkeiten[state.schwierigkeit].bankPuffer
  ];
  const minimum = Math.ceil((nk.summe + bank.minEkAnteil * kaufpreis) / 1000) * 1000;
  if (policy === 'minimum') return minimum;
  return Math.ceil((nk.summe + Number(policy) * kaufpreis) / 1000) * 1000;
}

function versucheKauf(state, nutzung, ekPolicy) {
  const minZimmer = state.config.eigenheim.minZimmer || 1;
  const kandidaten = sichtbareListings(state)
    .filter(({ listing, eintrag }) => eintrag.status === 'amMarkt' && (
      nutzung !== 'eigenheim' || (!listing.mietstatus.vermietet && listing.zimmer >= minZimmer)
    ))
    .sort((a, b) => {
      if (nutzung === 'eigenheim') return a.preis - b.preis;
      const mieteA = a.listing.mietstatus.vermietet
        ? a.listing.mietstatus.kaltmiete : vergleichsmiete(state, a.listing);
      const mieteB = b.listing.mietstatus.vermietet
        ? b.listing.mietstatus.kaltmiete : vergleichsmiete(state, b.listing);
      return (mieteB * 12 / b.preis) - (mieteA * 12 / a.preis) || a.preis - b.preis;
    });

  for (const { listing, preis } of kandidaten) {
    const kaufpreis = Math.round(preis);
    const eigenkapital = zielEigenkapital(state, listing, kaufpreis, ekPolicy);
    // 5.000 € bleiben als minimale Handlungsreserve; die Policy wartet sonst.
    if (eigenkapital > state.cash - 5000) continue;
    const angebot = kreditAngebot(state, {
      listingId: listing.id,
      kaufpreis,
      eigenkapital,
      tilgungssatz: 0.02,
      zinsbindungJahre: 10,
      nutzung,
    });
    if (!angebot.zusage) continue;
    const gebot = gebotAbgeben(state, listing.id, kaufpreis);
    if (!gebot.ok || !gebot.angenommen) return false; // eine Entscheidung pro Monat
    if (nutzung === 'eigenheim') kaufeEigenheim(state, angebot);
    else kaufeObjekt(state, angebot);
    return true;
  }
  return false;
}

function simuliere(schwierigkeit, seedIndex, strategie) {
  const state = newGame({ schwierigkeit, seedText: `balance-${seedIndex}` });
  initialisiereMarkt(state);
  let minCash = state.cash;

  while (!state.beendet && state.monat < gesamtMonate(state)) {
    vermieteLeerstaende(state);
    if (strategie.art === 'invest' && state.portfolio.length < state.config.endgame.benchmarkMaxObjekte) {
      versucheKauf(state, 'kapitalanlage', strategie.ekAnteil);
    } else if (strategie.art === 'kombiniert') {
      if (!state.eigenheim && state.monat >= strategie.abMonat) {
        versucheKauf(state, 'eigenheim', 0.25);
      } else if (!state.eigenheim && state.portfolio.length < strategie.investVorher) {
        versucheKauf(state, 'kapitalanlage', 0.25);
      } else if (state.eigenheim &&
        state.portfolio.length + 1 < state.config.endgame.benchmarkMaxObjekte) {
        versucheKauf(state, 'kapitalanlage', 0.25);
      }
    }
    advanceMonths(state, 1, auto);
    minCash = Math.min(minCash, state.cash);
  }

  const ende = berechneScores(state);
  return {
    vermoegen: nettovermoegen(state),
    etf: state.etfVergleich.wert,
    // Feste Proben vor dem frühestmöglichen Lebensende trennen die exogene
    // Pfadgleichheit von legitimen, stressbedingt verschiedenen Endmonaten.
    etfProbe: [120, 240, 360, 480, 600].map((monat) => state.historie[monat]?.etfRendite),
    score: ende.scores.gesamt,
    cashflow: ende.cashflow,
    familie: ende.scores.familie,
    resilienz: ende.scores.resilienz,
    ltv: ende.ltv,
    negativCashAnteil: ende.negativCashAnteil,
    minCash,
    objekte: state.portfolio.length,
    eigenheim: state.eigenheim ? 1 : 0,
    events: state.statistik.eventsGesamt,
    maengel: Object.values(state.maengelExistenz).reduce((summe, eintrag) =>
      summe + (eintrag.maengel || []).filter(Boolean).length + (eintrag.sonderumlage ? 1 : 0), 0),
  };
}

function mittel(werte) {
  return werte.reduce((summe, wert) => summe + wert, 0) / Math.max(1, werte.length);
}

function quantil(werte, q) {
  const sortiert = [...werte].sort((a, b) => a - b);
  return sortiert[Math.min(sortiert.length - 1, Math.floor((sortiert.length - 1) * q))];
}

function zusammenfassung(laeufe) {
  const feld = (name) => laeufe.map((lauf) => lauf[name]);
  return {
    n: laeufe.length,
    vermoegenMittel: mittel(feld('vermoegen')),
    vermoegenP10: quantil(feld('vermoegen'), 0.1),
    etfMittel: mittel(feld('etf')),
    scoreMittel: mittel(feld('score')),
    cashflowMittel: mittel(feld('cashflow')),
    familieMittel: mittel(feld('familie')),
    resilienzMittel: mittel(feld('resilienz')),
    ltvMittel: mittel(feld('ltv')),
    negativCashAnteil: mittel(feld('negativCashAnteil')),
    objekteMittel: mittel(feld('objekte')),
    eigenheimQuote: mittel(feld('eigenheim')),
    eventsMittel: mittel(feld('events')),
    maengelMittel: mittel(feld('maengel')),
  };
}

function paarVergleich(a, b) {
  let vermoegenA = 0;
  let scoreA = 0;
  let beideA = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i].vermoegen > b[i].vermoegen) vermoegenA++;
    if (a[i].score > b[i].score) scoreA++;
    if (a[i].vermoegen > b[i].vermoegen && a[i].score > b[i].score) beideA++;
  }
  return {
    vermoegenGewinnquoteA: vermoegenA / a.length,
    scoreGewinnquoteA: scoreA / a.length,
    beideGewinnquoteA: beideA / a.length,
  };
}

function gutachterMatrix() {
  const ergebnis = {};
  for (const schwierigkeit of schwierigkeiten) {
    ergebnis[schwierigkeit] = {};
    for (const listing of alleListings()) {
      const netto = [];
      const entdeckterSchaden = [];
      let warnungen = 0;
      for (let i = 0; i < seedAnzahl; i++) {
        const state = newGame({ schwierigkeit, seedText: `gutachter-${listing.id}-${i}` });
        initialisiereMarkt(state);
        const vorher = state.cash;
        const r = gutachterBeauftragen(state, listing.id);
        const erkannt = (r.dd.aufgedeckteMaengel || [])
          .reduce((summe, index) => summe + listing.maengel[index].kosten, 0);
        if (erkannt > 0) warnungen++;
        entdeckterSchaden.push(erkannt);
        const ersparnis = erkannt * (state.config.dueDiligence.ueberraschungsFaktor - 1);
        netto.push(ersparnis - (vorher - state.cash));
      }
      ergebnis[schwierigkeit][listing.id] = {
        nettoDirektMittel: mittel(netto),
        warnquote: warnungen / seedAnzahl,
        entdeckterSchadenMittel: mittel(entdeckterSchaden),
      };
    }
  }
  return ergebnis;
}

const laeufe = {};
for (const schwierigkeit of schwierigkeiten) {
  laeufe[schwierigkeit] = {};
  for (const strategie of STRATEGIEN) {
    laeufe[schwierigkeit][strategie.id] = [];
    for (let i = 0; i < seedAnzahl; i++) {
      laeufe[schwierigkeit][strategie.id].push(simuliere(schwierigkeit, i, strategie));
    }
  }
}

const bericht = {
  seedsJeSchwierigkeit: seedAnzahl,
  zusammenfassung: {},
  paarvergleiche: {},
  gutachter: gutachterMatrix(),
};

for (const schwierigkeit of schwierigkeiten) {
  bericht.zusammenfassung[schwierigkeit] = Object.fromEntries(
    STRATEGIEN.map((strategie) => [strategie.id, zusammenfassung(laeufe[schwierigkeit][strategie.id])])
  );
  bericht.paarvergleiche[schwierigkeit] = {
    minGegen25: paarVergleich(
      laeufe[schwierigkeit]['hebel-min'], laeufe[schwierigkeit]['hebel-25']
    ),
    minGegen40: paarVergleich(
      laeufe[schwierigkeit]['hebel-min'], laeufe[schwierigkeit]['hebel-40']
    ),
    heimFruehGegenMitte: paarVergleich(
      laeufe[schwierigkeit]['heim-frueh'], laeufe[schwierigkeit]['heim-mitte']
    ),
    heimFruehGegenMiete: paarVergleich(
      laeufe[schwierigkeit]['heim-frueh'], laeufe[schwierigkeit].miete
    ),
  };
}

const gateErgebnisse = [];
for (const schwierigkeit of schwierigkeiten) {
  const paar = bericht.paarvergleiche[schwierigkeit];
  gateErgebnisse.push({
    name: `${schwierigkeit}: Mindest-EK nicht dominant`,
    ok: paar.minGegen25.beideGewinnquoteA < 0.75 && paar.minGegen40.beideGewinnquoteA < 0.75,
  });
  gateErgebnisse.push({
    name: `${schwierigkeit}: Eigenheim-Timing bleibt Trade-off`,
    // Ein regionaler Eigenheimumzug darf klar nachteilig sein, aber kein
    // Totalausfall: Mindestens jeder zehnte Seed muss Vermögen und Score
    // zugleich gewinnen, zugleich darf keine Seite praktisch dominieren.
    ok: paar.heimFruehGegenMitte.beideGewinnquoteA > 0.10 &&
      paar.heimFruehGegenMitte.beideGewinnquoteA < 0.85,
  });
  const etfReferenz = laeufe[schwierigkeit].miete.map((lauf) => lauf.etfProbe);
  gateErgebnisse.push({
    name: `${schwierigkeit}: ETF-Marktrendite strategieunabhängig`,
    ok: STRATEGIEN.every((strategie) =>
      laeufe[schwierigkeit][strategie.id].every((lauf, index) =>
        JSON.stringify(lauf.etfProbe) === JSON.stringify(etfReferenz[index]))),
  });
}
const gutachterNormal = Object.values(bericht.gutachter.normal).map((wert) => wert.nettoDirektMittel);
gateErgebnisse.push({
  name: 'Gutachter ist selektiv statt immer/nie sinnvoll',
  ok: gutachterNormal.some((wert) => wert > 0) && gutachterNormal.some((wert) => wert < 0),
});
const diffLeicht = bericht.zusammenfassung.leicht['hebel-25'];
const diffNormal = bericht.zusammenfassung.normal['hebel-25'];
const diffSchwer = bericht.zusammenfassung.schwer['hebel-25'];
gateErgebnisse.push({
  name: 'Schwierigkeit: Ereignisse steigen leicht < normal < schwer',
  ok: diffLeicht.eventsMittel < diffNormal.eventsMittel && diffNormal.eventsMittel < diffSchwer.eventsMittel,
});
gateErgebnisse.push({
  name: 'Schwierigkeit: Mängel steigen leicht < normal < schwer',
  ok: diffLeicht.maengelMittel < diffNormal.maengelMittel && diffNormal.maengelMittel < diffSchwer.maengelMittel,
});
gateErgebnisse.push({
  name: 'Schwierigkeit: Vermögen und Score sinken leicht > normal > schwer',
  ok: diffLeicht.vermoegenMittel > diffNormal.vermoegenMittel &&
    diffNormal.vermoegenMittel > diffSchwer.vermoegenMittel &&
    diffLeicht.scoreMittel > diffNormal.scoreMittel && diffNormal.scoreMittel > diffSchwer.scoreMittel,
});
bericht.gates = gateErgebnisse;

if (jsonAusgabe) {
  console.log(JSON.stringify(bericht, null, 2));
} else {
  const euro = (n) => `${Math.round(n / 1000).toLocaleString('de-DE')} T€`;
  const prozent = (n) => `${(n * 100).toFixed(0)} %`;
  console.log(`Balance-Matrix: ${seedAnzahl} Seeds × 3 Schwierigkeiten × ${STRATEGIEN.length} Strategien`);
  for (const schwierigkeit of schwierigkeiten) {
    console.log(`\n${schwierigkeit.toUpperCase()}`);
    console.table(STRATEGIEN.map((strategie) => {
      const z = bericht.zusammenfassung[schwierigkeit][strategie.id];
      return {
        Strategie: strategie.label,
        'Ø Vermögen': euro(z.vermoegenMittel),
        'P10 Vermögen': euro(z.vermoegenP10),
        'Ø ETF-Linie': euro(z.etfMittel),
        'Ø Score': z.scoreMittel.toFixed(1),
        'Ø CF': `${Math.round(z.cashflowMittel)} €`,
        'Ø Familie': z.familieMittel.toFixed(1),
        'Ø Resilienz': z.resilienzMittel.toFixed(1),
        'Negativ-Cash': prozent(z.negativCashAnteil),
        'Ø Objekte': z.objekteMittel.toFixed(1),
        'Eigenheim': prozent(z.eigenheimQuote),
        'Ø Events': z.eventsMittel.toFixed(1),
        'Ø Mängel': z.maengelMittel.toFixed(1),
      };
    }));
    console.log('Paarvergleiche (Gewinnquote zuerst genannter Strategie):');
    console.table(bericht.paarvergleiche[schwierigkeit]);
  }

  console.log('\nGUTACHTER — direkter vermiedener Überraschungsaufschlag minus Honorar');
  for (const schwierigkeit of schwierigkeiten) {
    const zeilen = Object.entries(bericht.gutachter[schwierigkeit])
      .map(([id, wert]) => ({ id, ...wert }))
      .sort((a, b) => b.nettoDirektMittel - a.nettoDirektMittel);
    console.log(`\n${schwierigkeit.toUpperCase()} — beste/schlechteste Listings`);
    console.table([...zeilen.slice(0, 4), ...zeilen.slice(-2)].map((z) => ({
      Listing: z.id,
      'Ø Direktwert': `${Math.round(z.nettoDirektMittel)} €`,
      Warnquote: prozent(z.warnquote),
      'Ø erkannter Schaden': `${Math.round(z.entdeckterSchadenMittel)} €`,
    })));
  }
  console.log('\nBALANCE-GATES');
  console.table(gateErgebnisse.map((gate) => ({ Gate: gate.name, Stand: gate.ok ? 'OK' : 'FEHLER' })));
}

if (gatesPruefen && gateErgebnisse.some((gate) => !gate.ok)) process.exitCode = 1;

