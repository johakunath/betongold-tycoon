// immobilie.js — gemeinsamer Vertrag für Wohnung, Haus und Eigenheim-Eignung.
// DOM-frei; UI und Engine verwenden dieselben laufenden Kosten.

import { preisniveau } from './preisniveau.js?v=61';

export function objektartVon(objekt) {
  return objekt?.objektart === 'haus' ? 'haus' : 'wohnung';
}

export function objektartConfig(state, objekt) {
  const art = objektartVon(objekt);
  return state.config.bewirtschaftung.objektarten?.[art] || {
    label: art === 'haus' ? 'Haus mit Grundstück' : 'Eigentumswohnung',
    instandhaltungM2Jahr: state.config.bewirtschaftung.instandhaltungM2Jahr,
    nichtUmlegbarFaktor: state.config.bewirtschaftung.hausgeldNichtUmlegbar,
    gebaeudeAnteil: state.config.steuer.gebaeudeAnteil,
  };
}

// Listingwerte stehen in Euro des Spielstarts; `faktor` ist das aktuelle
// Preisniveau (preisniveau.js), damit Hausgeld & Co. mit der Inflation laufen.
export function fixkostenAufschluesselung(objekt, faktor = 1) {
  if (objektartVon(objekt) !== 'haus') {
    return [{ id: 'hausgeld', label: 'WEG-Hausgeld', betrag: (Number(objekt.hausgeld) || 0) * faktor }];
  }
  const k = objekt.laufendeKosten || {};
  return [
    { id: 'grundsteuer', label: 'Grundsteuer', betrag: (Number(k.grundsteuer) || 0) * faktor },
    { id: 'versicherung', label: 'Gebäudeversicherung', betrag: (Number(k.versicherung) || 0) * faktor },
    { id: 'grundstueckspflege', label: 'Grundstück & Betrieb', betrag: (Number(k.grundstueckspflege) || 0) * faktor },
  ];
}

export function fixkostenMonat(state, objekt, vermietet = false) {
  const brutto = fixkostenAufschluesselung(objekt, preisniveau(state)).reduce((summe, e) => summe + e.betrag, 0);
  return vermietet ? brutto * objektartConfig(state, objekt).nichtUmlegbarFaktor : brutto;
}

export function instandhaltungMonat(state, objekt) {
  const proM2Jahr = objektartConfig(state, objekt).instandhaltungM2Jahr;
  return ((Number(objekt.flaeche) || 0) * proM2Jahr / 12) * (objekt.ruecklageFaktor ?? 1) * preisniveau(state);
}

export function gebaeudeAnteil(state, objekt) {
  return objektartConfig(state, objekt).gebaeudeAnteil;
}

export function eigenheimEignung(state, listing) {
  const score = Number(listing.familienScore) || 0;
  const gruende = [];
  if (listing.mietstatus?.vermietet) gruende.push('nicht bezugsfrei');
  if ((Number(listing.zimmer) || 0) < state.config.eigenheim.minZimmer) {
    gruende.push(`weniger als ${state.config.eigenheim.minZimmer} Zimmer`);
  }
  if (score < state.config.eigenheim.minFamilienScore) {
    gruende.push('Grundriss oder Außenraum nicht als Familienheim geeignet');
  }
  return {
    geeignet: gruende.length === 0,
    score,
    gruende,
  };
}

