// kennzahlen.js — einheitliche, normalisierte UI-Kennzahlen.
// Die Engine bleibt DOM-frei; diese Ableitungen benennen dieselben Beträge auf
// HUD, Zentrale, Finanzen, Stadt und Finanzierung identisch.

import { monatsWerte } from '../engine.js?v=36';
import { fixkostenMonat, instandhaltungMonat } from '../immobilie.js?v=36';

export function objektCashflowMonat(state, objekt, vermietet = objekt.vermietet && !objekt.renovierung) {
  const miete = vermietet ? Number(objekt.kaltmiete) || 0 : 0;
  const ownerKosten = fixkostenMonat(state, objekt, vermietet);
  const verwaltung = objekt.hausverwaltung && vermietet
    ? miete * state.config.bewirtschaftung.hausverwaltungProzent
    : 0;
  const ruecklage = instandhaltungMonat(state, objekt);
  const rate = objekt.darlehen?.restschuld > 0 ? Number(objekt.darlehen.rate) || 0 : 0;
  return miete - ownerKosten - verwaltung - ruecklage - rate;
}

export function haushaltsUeberschussMonat(state) {
  const haushalt = monatsWerte(state);
  const vermietung = state.portfolio.reduce(
    (summe, objekt) => summe + objektCashflowMonat(state, objekt),
    0
  );
  const eigenheim = state.eigenheim ? objektCashflowMonat(state, state.eigenheim, false) : 0;
  return haushalt.sparrate + vermietung + eigenheim;
}

export function vermoegensaufbauMonat(state) {
  const haushalt = monatsWerte(state);
  const objekte = [...state.portfolio, ...(state.eigenheim ? [state.eigenheim] : [])];
  const ruecklagen = objekte.reduce((summe, objekt) => summe + instandhaltungMonat(state, objekt), 0);
  const tilgung = objekte.reduce((summe, objekt) => {
    const darlehen = objekt.darlehen;
    if (!darlehen?.restschuld || !darlehen.rate) return summe;
    const zins = Number(darlehen.zins) || 0;
    return summe + Math.max(0, darlehen.rate - darlehen.restschuld * zins / 12);
  }, 0);
  return { etf: haushalt.etfEinzahlung, tilgung, ruecklagen, gesamt: haushalt.etfEinzahlung + tilgung + ruecklagen };
}

export function liquiditaetsPufferMonate(state) {
  const haushalt = monatsWerte(state);
  const basis = Math.max(1, haushalt.miete + haushalt.lebenshaltung + haushalt.kinder +
    (state.eigenheim ? Math.max(0, -objektCashflowMonat(state, state.eigenheim, false)) : 0));
  return Math.max(0, state.cash) / basis;
}

// Gemeinsame Empfehlung für den „nächsten klugen Zug" auf Stadt und Zentrale.
// Liefert null, wenn kein dringender Zug ansteht; der Aufrufer ergänzt dann
// seine screen-spezifische Standardempfehlung.
export function naechsterZugEmpfehlung(state, marktEintrag = null) {
  if (state.cash < 0) {
    return {
      typ: 'finanzen',
      titel: 'Liquidität zuerst stabilisieren',
      text: 'Negatives Tagesgeld kostet Dispozins. Prüft ETF-Umschichtung und Konten, bevor ihr neue Käufe bindend macht.',
      button: 'Finanzen öffnen',
    };
  }
  const leer = state.portfolio.find((objekt) => !objekt.vermietet && !objekt.renovierung && !objekt.verkauf);
  if (leer) {
    return {
      typ: 'objekt',
      ziel: leer.listingId,
      titel: `${leer.titel} produktiv machen`,
      text: 'Leerstand kostet laufend. Vermieten oder gezielt renovieren ist jetzt der klarste nächste Zug.',
      button: 'Objekt öffnen',
    };
  }
  if (marktEintrag) {
    return {
      typ: 'expose',
      ziel: marktEintrag.listing.id,
      titel: 'Ein Angebot bewusst prüfen',
      text: `${marktEintrag.listing.titel}: Erst Substanz und Unterlagen prüfen, dann bieten oder begründet weggehen.`,
      button: 'Exposé öffnen',
    };
  }
  return null;
}
