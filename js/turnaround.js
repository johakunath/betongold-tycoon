// turnaround.js — DOM- und RNG-freie Triage für „Viel Bestand, wenig Luft“.
// Der Sonderstart erhält keine Gratisrettung: Miete, Bank und Verkauf verwenden
// die regulären Fachwerte; nur das auf zwölf Monate begrenzte Bankgespräch ist
// ein eigener, kostenpflichtiger Hebel.

import { fairerWert } from './market.js?v=58';
import { kannErhoehen, maxMiete } from './tenants.js?v=58';
import { fixkostenMonat, instandhaltungMonat } from './immobilie.js?v=58';
import { verkaufsVorschau } from './verkauf.js?v=58';
import { protokolliereWirkung } from './gameplay.js?v=58';

export function turnaroundAktiv(state) {
  return state.startPreset === state.config.turnaround.preset && state.portfolio.length > 0;
}

export function objektCashflow(state, objekt) {
  const vermietet = objekt.vermietet && !objekt.renovierung;
  const miete = vermietet ? Number(objekt.kaltmiete) || 0 : 0;
  const verwaltung = objekt.hausverwaltung && vermietet
    ? miete * state.config.bewirtschaftung.hausverwaltungProzent
    : 0;
  const rate = objekt.darlehen?.restschuld > 0 ? Number(objekt.darlehen.rate) || 0 : 0;
  return miete - fixkostenMonat(state, objekt, vermietet) -
    verwaltung - instandhaltungMonat(state, objekt) - rate;
}

function restschuldNachMonaten(restschuld, zins, rate, monate) {
  let rest = restschuld;
  for (let i = 0; i < monate && rest > 0; i++) {
    const zinsanteil = rest * zins / 12;
    rest -= Math.max(0, Math.min(rest, rate - zinsanteil));
  }
  return Math.max(0, rest);
}

export function bankAnpassungVorschau(state, objekt) {
  const cfg = state.config.turnaround;
  const status = state.turnaround || { bankAnpassungen: 0 };
  const d = objekt.darlehen;
  const gebuehr = Math.round(Math.max(cfg.bankGebuehrMin, d.restschuld * cfg.bankGebuehrProzent));
  const rateNeu = d.restschuld * (d.zins + cfg.bankTilgungNeu) / 12;
  const entlastung = Math.max(0, d.rate - rateNeu);
  const restMonate = Math.max(0, d.zinsbindungBis - state.monat);
  const restAlt = restschuldNachMonaten(d.restschuld, d.zins, d.rate, restMonate);
  const restNeu = restschuldNachMonaten(d.restschuld, d.zins, rateNeu, restMonate);
  let grund = '';
  if (!turnaroundAktiv(state)) grund = 'Nur im Turnaround-Start verfügbar.';
  else if (state.monat >= cfg.bankFensterMonate) grund = 'Das zwölfmonatige Bankfenster ist geschlossen.';
  else if (objekt.gekauftMonat >= 0) grund = 'Nur für die übernommenen Startdarlehen verfügbar.';
  else if (objekt.verkauf) grund = 'Während des Verkaufs wird der Kredit nicht mehr angepasst.';
  else if (d.turnaroundAngepasst) grund = 'Für dieses Darlehen bereits genutzt.';
  else if (status.bankAnpassungen >= cfg.bankMaxAnpassungen) grund = 'Alle Banktermine sind vergeben.';
  else if (state.cash < gebuehr) grund = 'Nicht genug Tagesgeld für die Gebühr.';
  else if (entlastung < 1) grund = 'Keine monatliche Entlastung erreichbar.';
  return {
    moeglich: !grund,
    grund,
    gebuehr,
    rateAlt: d.rate,
    rateNeu,
    entlastung,
    tilgungAlt: d.tilgungssatz,
    tilgungNeu: cfg.bankTilgungNeu,
    restschuldMehr: Math.max(0, restNeu - restAlt),
    restMonate,
    zeit: cfg.bankZeit,
  };
}

export function wendeBankAnpassungAn(state, objekt) {
  const v = bankAnpassungVorschau(state, objekt);
  if (!v.moeglich) throw new Error(v.grund);
  state.cash -= v.gebuehr;
  state.zeitbudget.verbraucht += v.zeit;
  objekt.darlehen.rate = v.rateNeu;
  objekt.darlehen.tilgungssatz = v.tilgungNeu;
  objekt.darlehen.turnaroundAngepasst = {
    monat: state.monat,
    gebuehr: v.gebuehr,
    rateAlt: v.rateAlt,
    restschuldMehrBisBindung: v.restschuldMehr,
  };
  state.turnaround.bankAnpassungen += 1;
  state.log.push({
    monat: state.monat,
    text: `${objekt.titel}: Kreditrate neu verhandelt ${Math.round(v.rateAlt).toLocaleString('de-DE')} → ${Math.round(v.rateNeu).toLocaleString('de-DE')} €/Monat; Gebühr ${v.gebuehr.toLocaleString('de-DE')} €.`,
  });
  protokolliereWirkung(state, {
    typ: 'bank-anpassung',
    titel: 'Monatsdruck gesenkt',
    text: `${objekt.titel}: ${Math.round(v.entlastung).toLocaleString('de-DE')} €/Monat frei, dafür ${v.gebuehr.toLocaleString('de-DE')} € Gebühr und rund ${Math.round(v.restschuldMehr).toLocaleString('de-DE')} € mehr Restschuld zum Ende der Zinsbindung.`,
    ziel: objekt.listingId,
    route: 'objekt',
  });
  return v;
}

export function initialisiereTurnaround(state) {
  if (!turnaroundAktiv(state)) return null;
  if (!state.turnaround) state.turnaround = { bankAnpassungen: 0, baselineCashflow: null };
  if (!Number.isFinite(state.turnaround.baselineCashflow)) {
    state.turnaround.baselineCashflow = state.portfolio.reduce((summe, objekt) => summe + objektCashflow(state, objekt), 0);
  }
  return state.turnaround;
}

export function portfolioTriage(state) {
  initialisiereTurnaround(state);
  const cfg = state.config.turnaround;
  const objekte = state.portfolio.map((objekt) => {
    const wert = fairerWert(state, objekt);
    const cashflow = objektCashflow(state, objekt);
    const ltv = objekt.darlehen.restschuld / Math.max(1, wert);
    const bindung = Math.max(0, objekt.darlehen.zinsbindungBis - state.monat);
    const mieteNeu = kannErhoehen(state, objekt) ? maxMiete(state, objekt) : objekt.kaltmiete;
    const mietHebel = Math.max(0, mieteNeu - objekt.kaltmiete);
    const bank = bankAnpassungVorschau(state, objekt);
    const verkauf = verkaufsVorschau(state, objekt);
    const arbeitslast = objekt.hausverwaltung ? 0 : state.config.bewirtschaftung.zeitProObjekt;
    let risiko = 'kontrolliert';
    if (cashflow < -500 || ltv >= .95 || bindung <= 24) risiko = 'kritisch';
    else if (cashflow < -200 || ltv >= .9 || bindung <= 36) risiko = 'angespannt';
    const chancen = [];
    if (mietHebel > 0) chancen.push(`Mietprüfung +${Math.round(mietHebel)} €/Mon.`);
    if (bank.moeglich) chancen.push(`Bank +${Math.round(bank.entlastung)} €/Mon.`);
    if (objekt.verkauf) chancen.push(`Verkauf läuft: noch ${Math.max(0, objekt.verkauf.abschlussMonat - state.monat)} Mon.`);
    return {
      objekt, cashflow, wert, ltv, eigenkapital: wert - objekt.darlehen.restschuld,
      bindung, mietHebel, bank, verkauf, arbeitslast, risiko, chancen,
    };
  }).sort((a, b) => a.cashflow - b.cashflow);
  const portfolioCashflow = objekte.reduce((summe, o) => summe + o.cashflow, 0);
  const baseline = state.turnaround?.baselineCashflow ?? portfolioCashflow;
  const ruecklage = state.portfolio.reduce((summe, o) => summe + (o.ruecklage || 0), 0);
  const ruecklageZiel = state.portfolio.reduce(
    (summe, o) => summe + o.flaeche * state.config.bewirtschaftung.objektarten[o.objektart || 'wohnung'].instandhaltungM2Jahr,
    0
  ) * cfg.ruecklageZielJahre;
  return {
    objekte,
    portfolioCashflow,
    baseline,
    verbesserung: portfolioCashflow - baseline,
    ruecklage,
    ruecklageZiel,
    bankVerbraucht: state.turnaround?.bankAnpassungen || 0,
    bankMax: cfg.bankMaxAnpassungen,
    bankRestMonate: Math.max(0, cfg.bankFensterMonate - state.monat),
    bankOffen: state.monat < cfg.bankFensterMonate,
    arbeitslast: objekte.reduce((summe, o) => summe + o.arbeitslast, 0),
  };
}

export function stabilisierungsLinien(state) {
  const triage = portfolioTriage(state);
  const mietPlus = triage.objekte.reduce((summe, o) => summe + o.mietHebel, 0);
  const bankKandidaten = triage.objekte.filter((o) => o.bank.moeglich)
    .sort((a, b) => b.bank.entlastung - a.bank.entlastung)
    .slice(0, Math.max(0, triage.bankMax - triage.bankVerbraucht));
  const bankPlus = bankKandidaten.reduce((summe, o) => summe + o.bank.entlastung, 0);
  const bankKosten = bankKandidaten.reduce((summe, o) => summe + o.bank.gebuehr, 0);
  const schlechtestes = triage.objekte.find((o) => !o.objekt.verkauf);
  return [
    {
      id: 'halten',
      titel: 'Bestand halten & Rate strecken',
      text: `${triage.objekte.filter((o) => o.mietHebel > 0).length} Mietprüfungen plus ${bankKandidaten.length} begrenzte Banktermine.`,
      wirkung: mietPlus + bankPlus,
      kosten: bankKosten,
      dauer: 0,
      folge: 'Niedrigere Tilgung lässt am Ende der Zinsbindung mehr Restschuld stehen.',
    },
    {
      id: 'verkleinern',
      titel: 'Größten Verlustträger verkaufen',
      text: schlechtestes ? `${schlechtestes.objekt.titel} nach sechs Monaten aus dem Verbund lösen.` : 'Kein Objekt verfügbar.',
      wirkung: schlechtestes ? Math.max(0, -schlechtestes.cashflow) : 0,
      kosten: schlechtestes ? -schlechtestes.verkauf.nettoerloes : 0,
      nettoerloes: schlechtestes?.verkauf.nettoerloes || 0,
      dauer: state.config.verkauf.dauerMonate,
      ziel: schlechtestes?.objekt.listingId || null,
      folge: 'Bis zum Abschluss laufen Miete, Kredit und Risiken weiter; der Marktwert bleibt offen.',
    },
  ];
}

