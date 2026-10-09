// preisniveau.js — kumulativer Preisniveauindex (ECONOMY_MODEL §1a). DOM-frei.
//
// Alle Eurobeträge aus Listings, Config und Events sind in Euro des
// Spielstarts (Januar 2026) angegeben. Was im Modell nicht bereits über eine
// eigene nominale Rate wächst (Haushalt, ETF, Segmentpreise), wird mit diesem
// Index in laufende Euro übersetzt: Marktmieten, Bestandsmieten von
// Angeboten, Hausgeld/Grundsteuer/Versicherung, Instandhaltung, Renovierung,
// Mängel, Sonderumlagen, Gutachter, Möblierung, Bankpauschale und Event-Beträge.
// Kredite bleiben nominal. Kein RNG.

export function preisniveau(state) {
  const wert = Number(state?.preisniveau);
  return Number.isFinite(wert) && wert > 0 ? wert : 1;
}

// Betrag in Euro des Spielstarts → laufende Euro dieses Monats.
export function aktuellerBetrag(state, betragStart) {
  return (Number(betragStart) || 0) * preisniveau(state);
}

// Laufende Euro → Kaufkraft in heutigen Euro (Spielstart).
export function inHeutigenEuro(state, betragNominal, index = preisniveau(state)) {
  return (Number(betragNominal) || 0) / (index > 0 ? index : 1);
}

// Ein Monat Inflation; im Tick genau einmal nach dem Monatswechsel.
export function tickPreisniveau(state) {
  const inflation = Number(state.config.preisniveau?.inflation) || 0;
  state.preisniveau = preisniveau(state) * Math.pow(1 + inflation, 1 / 12);
}

// Event- und Optionstexte nennen Beträge in Euro des Spielstarts
// („ca. 12.000 €"). Für die Anzeige werden sie in laufende Euro übersetzt und
// auf sinnvolle Stufen gerundet.
export function textInLaufendenEuro(state, text) {
  const faktor = preisniveau(state);
  if (!text || Math.abs(faktor - 1) < 0.005) return text;
  return String(text).replace(/(\d{1,3}(?:\.\d{3})+|\d+)(\s| )?€/g, (treffer, zahl, abstand = ' ') => {
    const wert = Number(zahl.replace(/\./g, '')) * faktor;
    const stufe = wert >= 10000 ? 500 : wert >= 1000 ? 100 : 10;
    return `${(Math.round(wert / stufe) * stufe).toLocaleString('de-DE')}${abstand}€`;
  });
}
