// goals.js — freiwillige mittelfristige Ziele ohne Belohnungs- oder Queststate.
// Fortschritt wird ausschließlich aus Portfolio, Eigenheim und Liquidität abgeleitet.

import { monatsWerte } from './engine.js?v=41';
import { objektCashflow } from './turnaround.js?v=41';

export function setzeEntwicklungsziel(state, id) {
  if (id !== null && !state.config.entwicklung.zielOptionen[id]) throw new Error('Unbekanntes Entwicklungsziel.');
  state.entwicklung.zielId = id;
  state.entwicklung.zielSeitMonat = state.monat;
  state.log.push({ monat: state.monat, text: id ? `Freiwilliges Ziel gesetzt: ${state.config.entwicklung.zielOptionen[id].label}.` : 'Freiwilliges Ziel pausiert — ohne Kosten oder Punktabzug.' });
  return id;
}

function haushaltsUeberschuss(state) {
  const w = monatsWerte(state);
  const portfolio = state.portfolio.reduce((summe, objekt) => summe + objektCashflow(state, objekt), 0);
  const eigenheim = state.eigenheim ? objektCashflow(state, state.eigenheim) : 0;
  return w.sparrate + portfolio + eigenheim;
}

function pufferMonate(state) {
  const w = monatsWerte(state);
  return Math.max(0, state.cash) / Math.max(1, w.miete + w.lebenshaltung + w.kinder);
}

export function zielStatus(state, id = state.entwicklung?.zielId) {
  if (!id) return null;
  const cfg = state.config.entwicklung.zielOptionen[id];
  const seit = state.entwicklung.zielSeitMonat;
  const vergangen = Math.max(0, state.monat - seit);
  let wert = 0;
  let maximum = 1;
  let detail = '';
  if (id === 'erstesStabilesObjekt') {
    wert = state.portfolio.filter((o) => o.vermietet && objektCashflow(state, o) >= state.config.entwicklung.stabilerCashflowGrenze).length;
    detail = `${wert} vermietete Objekte bei mindestens −${state.config.entwicklung.stabilerCashflowGrenze * -1} €/Monat`;
  } else if (id === 'eigenheim') {
    wert = state.eigenheim ? 1 : 0;
    detail = state.eigenheim ? state.eigenheim.titel : 'Noch kein passendes Eigenheim';
  } else {
    const ueber = haushaltsUeberschuss(state);
    const puffer = pufferMonate(state);
    wert = Math.min(2, (ueber >= 0 ? 1 : 0) + Math.min(1, puffer / state.config.entwicklung.pufferZielMonate));
    maximum = 2;
    detail = `${Math.round(ueber).toLocaleString('de-DE')} €/Monat · ${puffer.toLocaleString('de-DE', { maximumFractionDigits: 1 })} Puffermonate`;
  }
  return {
    id, label: cfg.label, wert, maximum, detail,
    erreicht: wert >= maximum,
    fristMonate: cfg.fristMonate,
    restMonate: Math.max(0, cfg.fristMonate - vergangen),
    ueberfaellig: vergangen > cfg.fristMonate && wert < maximum,
  };
}

export function alleZielStatus(state) {
  return Object.keys(state.config.entwicklung.zielOptionen).map((id) => zielStatus(state, id));
}
