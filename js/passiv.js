// passiv.js — passive Monatseinkommen aus Mietobjekten und liquidem Vermögen.
// DOM-frei; genutzt vom Tick (Ruhestands-Check) und der Endauswertung.

import { fixkostenMonat, instandhaltungMonat } from './immobilie.js?v=61';
import { etfVerkaufVorschau } from './etf.js?v=61';

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

// Sichere Entnahme aus liquidem Vermögen (Tagesgeld + ETF netto nach
// Verkaufssteuer) als passives Monatseinkommen. So kann auch eine Strategie
// ohne Mietobjekt den Cashflow-Score erreichen (PLAN Säule 1).
export function entnahmeCashflow(state) {
  const rate = Number(state.config.endgame.entnahmeRate) || 0;
  if (rate <= 0) return 0;
  const depot = state.etfDepot?.wert || 0;
  const etfNetto = depot > 0 ? (etfVerkaufVorschau(state, depot).netto || 0) : 0;
  return rate * (Math.max(0, state.cash) + etfNetto) / 12;
}
