// aktien.js — DOM-freie Wertpapier-Sandbox mit eigenem deterministischem
// Kursstrom. Einzelaktien bleiben strikt vom Welt-ETF und Benchmark getrennt.

import { alleAktien, getAktie } from './content.js?v=36';
import { rngFloatStrom, rngNormalStrom } from './state.js?v=36';
import { kapitalertragVorschau, verbucheKapitalertrag } from './kapitalsteuer.js?v=36';

export function initialisiereAktienmarkt(state) {
  if (!state.aktienDepot || typeof state.aktienDepot !== 'object') {
    state.aktienDepot = leeresDepot();
  }
  const depot = state.aktienDepot;
  depot.positionen ||= {};
  depot.kurse ||= {};
  depot.letzteRenditen ||= {};
  depot.letzteEvents ||= [];
  depot.verlusttopf = positiveZahl(depot.verlusttopf);
  depot.gebuehrenGesamt = positiveZahl(depot.gebuehrenGesamt);
  depot.steuernGesamt = positiveZahl(depot.steuernGesamt);
  depot.dividendenNettoGesamt = positiveZahl(depot.dividendenNettoGesamt);

  for (const aktie of alleAktien()) {
    if (!Number.isFinite(depot.kurse[aktie.id]) || depot.kurse[aktie.id] <= 0) {
      depot.kurse[aktie.id] = aktie.startKurs;
    }
    if (!Number.isFinite(depot.letzteRenditen[aktie.id])) depot.letzteRenditen[aktie.id] = 0;
  }
  return depot;
}

export function leeresDepot() {
  return {
    positionen: {},
    kurse: {},
    letzteRenditen: {},
    letzteEvents: [],
    verlusttopf: 0,
    gebuehrenGesamt: 0,
    steuernGesamt: 0,
    dividendenNettoGesamt: 0,
  };
}

export function aktienDepotWert(state) {
  const depot = initialisiereAktienmarkt(state);
  return Object.entries(depot.positionen).reduce((summe, [id, position]) => {
    const kurs = depot.kurse[id] || 0;
    return summe + positiveZahl(position.stueck) * kurs;
  }, 0);
}

export function orderGebuehr(state, handelswert) {
  const wert = positiveZahl(handelswert);
  if (wert <= 0) return 0;
  const cfg = state.config.aktien;
  return Math.min(cfg.orderGebuehrMax, cfg.orderGebuehrFix + wert * cfg.orderGebuehrProzent);
}

export function aktienKaufVorschau(state, aktienId, stueck) {
  const depot = initialisiereAktienmarkt(state);
  const aktie = getAktie(aktienId);
  const menge = ganzeStueck(stueck);
  const kurs = depot.kurse[aktie.id];
  const handelswert = menge * kurs;
  const gebuehr = orderGebuehr(state, handelswert);
  const gesamt = handelswert + gebuehr;
  const istNeu = !depot.positionen[aktie.id]?.stueck;
  const anzahlPositionen = aktivePositionen(depot).length;
  let grund = '';
  if (menge <= 0) grund = 'Mindestens ein ganzes Stück wählen.';
  else if (istNeu && anzahlPositionen >= state.config.aktien.maxPositionen) grund = 'Maximale Positionszahl erreicht.';
  else if (gesamt > Math.max(0, state.cash)) grund = 'Tagesgeld reicht für Kurswert und Orderkosten nicht aus.';
  return { ok: !grund, grund, aktie, stueck: menge, kurs, handelswert, gebuehr, gesamt };
}

export function kaufeAktie(state, aktienId, stueck) {
  const vorschau = aktienKaufVorschau(state, aktienId, stueck);
  if (!vorschau.ok) return vorschau;
  const depot = state.aktienDepot;
  const position = depot.positionen[aktienId] || { stueck: 0, einstandGesamt: 0 };
  position.stueck += vorschau.stueck;
  position.einstandGesamt += vorschau.gesamt;
  depot.positionen[aktienId] = position;
  depot.gebuehrenGesamt += vorschau.gebuehr;
  state.cash -= vorschau.gesamt;
  state.log.push({
    monat: state.monat,
    text: `${vorschau.stueck} ${vorschau.aktie.ticker} zu ${euroKurz(vorschau.kurs)} gekauft; ${euroKurz(vorschau.gebuehr)} Orderkosten.`,
  });
  return vorschau;
}

export function aktienVerkaufVorschau(state, aktienId, stueck) {
  const depot = initialisiereAktienmarkt(state);
  const aktie = getAktie(aktienId);
  const position = depot.positionen[aktienId] || { stueck: 0, einstandGesamt: 0 };
  const menge = ganzeStueck(stueck);
  const kurs = depot.kurse[aktie.id];
  const handelswert = menge * kurs;
  const gebuehr = orderGebuehr(state, handelswert);
  const anteil = position.stueck > 0 ? menge / position.stueck : 0;
  const einstand = position.einstandGesamt * anteil;
  const gewinnVorSteuer = handelswert - gebuehr - einstand;
  const verrechnet = Math.min(Math.max(0, gewinnVorSteuer), depot.verlusttopf);
  const steuerbasis = Math.max(0, gewinnVorSteuer - verrechnet);
  const steuerErgebnis = kapitalertragVorschau(state, steuerbasis);
  const steuer = steuerErgebnis.steuer;
  const netto = handelswert - gebuehr - steuer;
  let grund = '';
  if (menge <= 0) grund = 'Mindestens ein ganzes Stück wählen.';
  else if (menge > position.stueck) grund = 'So viele Stücke liegen nicht im Depot.';
  return {
    ok: !grund, grund, aktie, stueck: menge, kurs, handelswert, gebuehr,
    einstand, gewinnVorSteuer, verrechnet, steuerbasis,
    freibetrag: steuerErgebnis.freibetrag, steuer, netto,
  };
}

export function verkaufeAktie(state, aktienId, stueck) {
  const vorschau = aktienVerkaufVorschau(state, aktienId, stueck);
  if (!vorschau.ok) return vorschau;
  const depot = state.aktienDepot;
  const position = depot.positionen[aktienId];
  position.stueck -= vorschau.stueck;
  position.einstandGesamt -= vorschau.einstand;
  if (vorschau.gewinnVorSteuer < 0) depot.verlusttopf += -vorschau.gewinnVorSteuer;
  else {
    depot.verlusttopf -= vorschau.verrechnet;
    verbucheKapitalertrag(state, vorschau.steuerbasis);
  }
  depot.gebuehrenGesamt += vorschau.gebuehr;
  depot.steuernGesamt += vorschau.steuer;
  state.cash += vorschau.netto;
  if (position.stueck <= 0) delete depot.positionen[aktienId];
  state.log.push({
    monat: state.monat,
    text: `${vorschau.stueck} ${vorschau.aktie.ticker} verkauft; ${euroKurz(vorschau.gebuehr)} Kosten, ${euroKurz(vorschau.steuer)} Steuer.`,
  });
  return vorschau;
}

export function tickAktienmarkt(state) {
  const depot = initialisiereAktienmarkt(state);
  const cfg = state.config.aktien;
  const diff = state.config.schwierigkeiten[state.schwierigkeit];
  const volFaktor = diff.volatilitaetsFaktor;
  const marktNormal = rngNormalStrom(state, 'aktienRngState');
  const phaseDrift = cfg.marktDriftMod[state.marktphase] || 0;
  const neueEvents = [];

  for (const aktie of alleAktien()) {
    const unternehmenNormal = rngNormalStrom(state, 'aktienRngState');
    const eventRoll = rngFloatStrom(state, 'aktienRngState');
    const eventWahl = rngFloatStrom(state, 'aktienRngState');
    const rho = cfg.marktKorrelation;
    const sigmaMarkt = aktie.volatilitaet * rho * aktie.beta * volFaktor / Math.sqrt(12);
    const sigmaFirma = aktie.volatilitaet * Math.sqrt(1 - rho * rho) * volFaktor / Math.sqrt(12);
    const mu = Math.log(1 + aktie.kursRendite + phaseDrift) / 12;
    const marktRendite = Math.expm1(
      mu - 0.5 * (sigmaMarkt * sigmaMarkt + sigmaFirma * sigmaFirma)
      + sigmaMarkt * marktNormal + sigmaFirma * unternehmenNormal
    );
    const event = eventRoll < cfg.eventChanceMonat ? waehleEvent(aktie.events, eventWahl) : null;
    const eventEffekt = event?.returnEffekt || 0;
    const kursVorher = depot.kurse[aktie.id];
    const kurs = Math.max(0.5, kursVorher * (1 + marktRendite) * (1 + eventEffekt));
    depot.kurse[aktie.id] = kurs;
    depot.letzteRenditen[aktie.id] = kurs / kursVorher - 1;
    if (event) {
      neueEvents.push({ aktienId: aktie.id, titel: event.titel, text: event.text, effekt: event.returnEffekt });
      state.log.push({ monat: state.monat, text: `${aktie.ticker}: ${event.titel} — ${event.text}` });
    }
  }
  depot.letzteEvents = neueEvents;

  const kalenderMonat = ((state.config.zeit.startMonat - 1 + state.monat) % 12) + 1;
  let dividendenBrutto = 0;
  if (cfg.dividendenMonate.includes(kalenderMonat)) {
    for (const aktie of alleAktien()) {
      const stueck = depot.positionen[aktie.id]?.stueck || 0;
      dividendenBrutto += stueck * depot.kurse[aktie.id] * aktie.dividendenRendite / cfg.dividendenMonate.length;
    }
  }
  const steuerErgebnis = dividendenBrutto > 0
    ? verbucheKapitalertrag(state, dividendenBrutto)
    : { steuer: 0 };
  const steuer = steuerErgebnis.steuer;
  const dividendenNetto = dividendenBrutto - steuer;
  if (dividendenNetto > 0) {
    state.cash += dividendenNetto;
    depot.steuernGesamt += steuer;
    depot.dividendenNettoGesamt += dividendenNetto;
    state.log.push({
      monat: state.monat,
      text: `Aktien-Dividenden: ${euroKurz(dividendenBrutto)} brutto, ${euroKurz(dividendenNetto)} nach vereinfachter Steuer.`,
    });
  }
  return { dividendenBrutto, steuer, dividendenNetto, events: neueEvents };
}

function aktivePositionen(depot) {
  return Object.entries(depot.positionen).filter(([, position]) => position.stueck > 0);
}

function waehleEvent(events, zufall) {
  if (!events?.length) return null;
  const summe = events.reduce((wert, event) => wert + event.gewicht, 0);
  let rest = zufall * summe;
  for (const event of events) {
    rest -= event.gewicht;
    if (rest < 0) return event;
  }
  return events[events.length - 1];
}

function ganzeStueck(wert) {
  const zahl = Number(wert);
  return Number.isFinite(zahl) ? Math.max(0, Math.floor(zahl)) : 0;
}

function positiveZahl(wert) {
  return Number.isFinite(Number(wert)) ? Math.max(0, Number(wert)) : 0;
}

function euroKurz(wert) {
  return `${Number(wert).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
