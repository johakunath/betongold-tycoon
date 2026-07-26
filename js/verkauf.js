// verkauf.js — sechsmonatiger Verkauf von Kapitalanlage oder Eigenheim.
// Keine Zufälligkeit; der Marktwert am Abschluss bestimmt den Erlös.

import { fairerWert } from './market.js?v=58';
import { meldeWartemoment } from './signals.js?v=58';
import { protokolliereWirkung } from './gameplay.js?v=58';

export function verkaufsVorschau(state, objekt) {
  const cfg = state.config.verkauf;
  const verkaufspreis = fairerWert(state, objekt) * cfg.preisFaktor;
  const makler = verkaufspreis * cfg.maklerProvision;
  const haltedauer = state.monat - objekt.gekauftMonat;
  const gewinn = Math.max(0, verkaufspreis - makler - objekt.kaufpreis - objekt.nebenkosten);
  const spekulationssteuer = haltedauer < cfg.spekulationsfristMonate
    ? gewinn * state.steuer.grenzsatz
    : 0;
  const nettoerloes = verkaufspreis - makler - spekulationssteuer - objekt.darlehen.restschuld;
  return { verkaufspreis, makler, haltedauer, gewinn, spekulationssteuer, nettoerloes };
}

export function starteVerkauf(state, objekt) {
  if (!objekt) throw new Error('Objekt fehlt.');
  if (objekt.verkauf) return objekt.verkauf;
  const vorschau = verkaufsVorschau(state, objekt);
  objekt.verkauf = {
    gestartetMonat: state.monat,
    abschlussMonat: state.monat + state.config.verkauf.dauerMonate,
    startSchaetzung: vorschau.verkaufspreis,
  };
  state.log.push({
    monat: state.monat,
    text: `${objekt.titel}: Verkauf gestartet — geplanter Abschluss in ${state.config.verkauf.dauerMonate} Monaten.`,
  });
  protokolliereWirkung(state, {
    typ: 'verkauf-gestartet',
    titel: 'Portfolio wird verkleinert',
    text: `${objekt.titel}: sechsmonatiger Verkauf gestartet; heutiger Nettoerlös etwa ${Math.round(vorschau.nettoerloes).toLocaleString('de-DE')} €, laufende Wirkung erst beim Abschluss.`,
    ziel: objekt.listingId,
    route: 'objekt',
  });
  return objekt.verkauf;
}

// Wird nach dem Monatswechsel aufgerufen. Mutiert Cash/Portfolio erst, wenn die
// sechs Monate vollständig vergangen sind, und liefert den Einmal-Cashflow.
export function tickVerkaeufe(state) {
  let cashflow = 0;
  const verkauft = [];

  for (let i = state.portfolio.length - 1; i >= 0; i--) {
    const o = state.portfolio[i];
    if (!o.verkauf || state.monat < o.verkauf.abschlussMonat) continue;
    const abschluss = schliesseAb(state, o, false);
    cashflow += abschluss.nettoerloes;
    verkauft.push(abschluss);
    state.portfolio.splice(i, 1);
  }

  const heim = state.eigenheim;
  if (heim?.verkauf && state.monat >= heim.verkauf.abschlussMonat) {
    const abschluss = schliesseAb(state, heim, true);
    cashflow += abschluss.nettoerloes;
    verkauft.push(abschluss);
    state.eigenheim = null;
    state.familienzufriedenheit = Math.max(
      0,
      state.familienzufriedenheit - state.config.eigenheim.verkaufFamilieMalus
    );
  }

  return { cashflow, verkauft };
}

function schliesseAb(state, objekt, eigenheim) {
  const v = verkaufsVorschau(state, objekt);
  state.cash += v.nettoerloes;
  state.log.push({
    monat: state.monat,
    text: `${eigenheim ? 'Eigenheim' : 'Verkauft'}: ${objekt.titel} für ` +
      `${Math.round(v.verkaufspreis).toLocaleString('de-DE')} € — Nettoerlös ` +
      `${Math.round(v.nettoerloes).toLocaleString('de-DE')} €` +
      (v.haltedauer < state.config.verkauf.spekulationsfristMonate
        ? v.spekulationssteuer > 0
          ? `, davon ${Math.round(v.spekulationssteuer).toLocaleString('de-DE')} € Spekulationssteuer.`
          : ', innerhalb der Spekulationsfrist, aber ohne steuerpflichtigen Gewinn.'
        : ', außerhalb der Spekulationsfrist.')
  });
  protokolliereWirkung(state, {
    typ: 'verkauft',
    titel: 'Verkauf abgeschlossen',
    text: `${objekt.titel}: Restschuld abgelöst, ${Math.round(v.nettoerloes).toLocaleString('de-DE')} € Nettoerlös gebucht; der bisherige Objekt-Cashflow entfällt.`,
    ziel: objekt.listingId,
    route: 'portfolio',
  });
  meldeWartemoment(
    state,
    `${objekt.titel}: Verkauf abgeschlossen, Nettoerlös ${Math.round(v.nettoerloes).toLocaleString('de-DE')} €. Zeit pausiert.`,
    eigenheim ? 'eigenheim' : objekt.listingId
  );
  return { ...v, listingId: objekt.listingId, titel: objekt.titel, eigenheim };
}

