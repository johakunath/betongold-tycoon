// endgame.js — fünf Endscores und deterministische Vergleichsstrategien.
// DOM-frei; die UI rendert das Ergebnis in ui/endgame.js.

import { newGame } from './state.js?v=60';
import { initialisiereMarkt, sichtbareListings } from './market.js?v=60';
import { nebenkostenFuer, kreditAngebot, kaufeObjekt } from './finance.js?v=60';
import { gebotAbgeben, fairerWert } from './market.js?v=60';
import { kaufeEigenheim } from './eigenheim.js?v=60';
import { starteVermietung, neueBewerber, waehleBewerber } from './tenants.js?v=60';
import { resolveEvent } from './events.js?v=60';
import { advanceMonths, alterGenau, lebensstressIndex, nettovermoegen } from './engine.js?v=60';
import { eigenheimEignung, fixkostenMonat, instandhaltungMonat } from './immobilie.js?v=60';
import { initialisiereStartbestand } from './starter.js?v=60';

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));

export function nachhaltigerCashflow(state) {
  const bw = state.config.bewirtschaftung;
  const steuer = state.config.steuer;
  let gesamt = 0;
  for (const o of state.portfolio) {
    if (!o.vermietet || o.renovierung) continue;
    const miete = o.kaltmiete;
    const hausgeld = fixkostenMonat(state, o, true);
    const verwaltung = o.hausverwaltung ? o.kaltmiete * bw.hausverwaltungProzent : 0;
    const ruecklage = instandhaltungMonat(state, o);
    const rate = o.darlehen.restschuld > 0 ? o.darlehen.rate : 0;
    const zins = o.darlehen.restschuld * o.darlehen.zins / 12;
    const afa = (o.steuerBasisGebaeude || o.kaufpreis * steuer.gebaeudeAnteil) * steuer.afaSatz / 12;
    const steuerMonat = Math.max(0, miete - hausgeld - verwaltung - zins - afa) * state.steuer.grenzsatz;
    gesamt += miete - hausgeld - verwaltung - ruecklage - rate - steuerMonat;
  }
  return gesamt;
}

export function berechneScores(state) {
  const cfg = state.config.endgame;
  const vermoegen = nettovermoegen(state);
  const cashflow = nachhaltigerCashflow(state);
  const objekte = [...state.portfolio, ...(state.eigenheim ? [state.eigenheim] : [])];
  const wert = objekte.reduce((s, o) => s + fairerWert(state, o), 0);
  const schuld = objekte.reduce((s, o) => s + o.darlehen.restschuld, 0);
  const ltv = wert > 0 ? schuld / wert : 0;
  const ltvScore = ltv <= cfg.ltvVollScore
    ? 100
    : clamp(100 * (cfg.ltvNullScore - ltv) / (cfg.ltvNullScore - cfg.ltvVollScore));

  const bw = state.config.bewirtschaftung;
  const pflichten = objekte.reduce((s, o) => s + fixkostenMonat(state, o) +
    instandhaltungMonat(state, o) +
    (o.darlehen.restschuld > 0 ? o.darlehen.rate : 0), 0);
  const liquidePuffer = Math.max(0, state.cash) + objekte.reduce((s, o) => s + (o.ruecklage || 0), 0);
  const deckungMonate = pflichten > 0 ? liquidePuffer / pflichten : cfg.ruecklageZielMonate;
  const reserveScore = clamp(deckungMonate / cfg.ruecklageZielMonate * 100);

  const stat = state.statistik;
  const monate = Math.max(1, stat.monate);
  const zeitUeberzugSchnitt = stat.zeitUeberzugSumme / monate;
  const negativCashAnteil = stat.monateNegativCash / monate;
  const stressScore = clamp(100
    - zeitUeberzugSchnitt * cfg.stressPunkteJeUeberzugStunde
    - negativCashAnteil * cfg.stressPunkteNegativCashAnteil);
  const familieSchnitt = stat.familienSumme / Math.max(1, stat.monate + 1);
  const lebensalter = alterGenau(state);
  const ruhestandsdauer = Math.max(0, lebensalter - state.config.zeit.rentenAlter);

  const scores = {
    vermoegen: clamp(vermoegen / cfg.nettovermoegenZiel * 100),
    cashflow: clamp(cashflow / cfg.cashflowZiel * 100),
    resilienz: (ltvScore + reserveScore) / 2,
    stress: stressScore,
    familie: clamp((state.familienzufriedenheit + familieSchnitt) / 2),
  };
  scores.gesamt = Object.values(scores).reduce((a, b) => a + b, 0) / 5;
  return {
    scores,
    vermoegen,
    cashflow,
    ltv,
    deckungMonate,
    zeitUeberzugSchnitt,
    negativCashAnteil,
    familieSchnitt,
    lebensalter,
    ruhestandsdauer,
    lebensstress: lebensstressIndex(state),
  };
}

export function berechneEndauswertung(state) {
  const scores = berechneScores(state);
  const eigenheim = simuliereStrategie(state, 'eigenheim-first');
  const invest = simuliereStrategie(state, 'invest-first');
  const spieler = state.historie.map((h) => ({ monat: h.monat, wert: h.nettovermoegen }));
  const etf = state.historie.map((h) => ({ monat: h.monat, wert: h.etf }));
  return {
    ...scores,
    linien: { spieler, etf, eigenheim, invest },
    endwerte: {
      spieler: spieler.at(-1)?.wert || 0,
      etf: etf.at(-1)?.wert || 0,
      eigenheim: eigenheim.at(-1)?.wert || 0,
      invest: invest.at(-1)?.wert || 0,
    },
  };
}

// Gescriptete Benchmarks: gleiche Schwierigkeit, Config und numerischer Seed.
// Eigenheim-first sucht zuerst das günstigste bezugsfreie Objekt und investiert
// danach; Invest-first priorisiert Bruttorendite. Beide bieten den Angebotspreis,
// wählen 2 % Tilgung und vermieten leer gekaufte Objekte zur Marktmiete.
function simuliereStrategie(original, strategie) {
  const sim = newGame({
    schwierigkeit: original.schwierigkeit,
    startPreset: original.startPreset,
    startProfil: original.startProfil,
    seedText: original.seedText,
    seedWert: original.seed,
  });
  sim.config = structuredClone(original.config);
  // Alle Referenzstrategien laufen exakt bis zum Lebensende des Spielers. So
  // vergleicht der Chart Entscheidungen statt unterschiedlicher Todeszeitpunkte.
  const vergleichsEndAlter = sim.config.zeit.startAlter + original.monat / 12;
  sim.config.zeit.lebensendeMinAlter = vergleichsEndAlter;
  sim.config.zeit.lebensendeMaxAlter = vergleichsEndAlter + 1 / 12;
  sim.config.zeit.stressMalusMaxJahre = 0;
  sim.lebensende.zufallswert = 0;
  sim.marktphase = original.marktphase;
  initialisiereMarkt(sim);
  initialisiereStartbestand(sim);
  const linie = [{ monat: 0, wert: nettovermoegen(sim) }];
  const auto = (s) => resolveEvent(s, 0);
  const ende = original.monat;

  while (!sim.beendet && sim.monat < ende) {
    vermieteLeerstaende(sim);
    if (strategie === 'eigenheim-first' && !sim.eigenheim) {
      versucheKauf(sim, 'eigenheim');
    } else if (
      sim.portfolio.length + (sim.eigenheim ? 1 : 0) < sim.config.endgame.benchmarkMaxObjekte
    ) {
      versucheKauf(sim, 'kapitalanlage');
    }
    advanceMonths(sim, 1, auto);
    linie.push({ monat: sim.monat, wert: nettovermoegen(sim) });
  }
  return linie;
}

function versucheKauf(state, nutzung) {
  const sichtbar = sichtbareListings(state)
    .filter(({ listing }) => nutzung !== 'eigenheim' || eigenheimEignung(state, listing).geeignet)
    .sort((a, b) => {
      if (nutzung === 'eigenheim') return a.preis - b.preis;
      const ra = (a.listing.mietstatus.kaltmiete || 0) * 12 / a.preis;
      const rb = (b.listing.mietstatus.kaltmiete || 0) * 12 / b.preis;
      return rb - ra || a.preis - b.preis;
    });

  for (const { listing, preis } of sichtbar) {
    const kaufpreis = Math.round(preis);
    const nk = nebenkostenFuer(state, listing, kaufpreis);
    const bank = state.config.kredit.bank[
      state.config.schwierigkeiten[state.schwierigkeit].bankPuffer
    ];
    const minimum = Math.ceil((nk.summe + bank.minEkAnteil * kaufpreis) / 1000) * 1000;
    if (minimum > state.cash) continue;
    const eigenkapital = Math.min(
      Math.floor(state.cash / 1000) * 1000,
      Math.max(minimum, Math.round((nk.summe + kaufpreis * 0.2) / 1000) * 1000)
    );
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
    if (!gebot.ok || !gebot.angenommen) return false;
    if (nutzung === 'eigenheim') kaufeEigenheim(state, angebot);
    else kaufeObjekt(state, angebot);
    return true;
  }
  return false;
}

function vermieteLeerstaende(state) {
  for (const o of state.portfolio) {
    if (o.vermietet || o.renovierung) continue;
    if (!o.suche) starteVermietung(state, o, 'auf', false);
    else if (o.suche.generiertMonat < state.monat && o.suche.bewerber.length === 0) neueBewerber(state, o);
    const kandidat = o.suche?.bewerber?.[0];
    if (kandidat) waehleBewerber(state, o, kandidat.id);
  }
}

