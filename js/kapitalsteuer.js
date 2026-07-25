// kapitalsteuer.js — gemeinsamer, DOM-freier Jahresfreibetrag für Tagesgeld
// und ETF. Das Modell bildet Abgeltungsteuer + Soli ab, aber keine
// Kirchensteuer oder ETF-Vorabpauschale.

export function kalenderJahr(state) {
  const startJahr = Number(state.config?.zeit?.startJahr) || 2026;
  const startMonat = Number(state.config?.zeit?.startMonat) || 1;
  return startJahr + Math.floor((startMonat - 1 + Math.max(0, Number(state.monat) || 0)) / 12);
}

export function kapitalsteuerStatus(state) {
  const cfg = state.config.kapitalsteuer;
  const jahr = kalenderJahr(state);
  const tracker = state.kapitalsteuer || {};
  const genutzt = tracker.jahr === jahr ? positiveZahl(tracker.freibetragGenutzt) : 0;
  const gesamt = positiveZahl(cfg.pauschbetragProPerson) * Math.max(1, Math.floor(cfg.personen || 1));
  return {
    jahr,
    gesamt,
    genutzt: Math.min(gesamt, genutzt),
    verbleibend: Math.max(0, gesamt - genutzt),
    steuernGesamt: positiveZahl(tracker.steuernGesamt),
  };
}

export function kapitalertragVorschau(state, bruttoErtrag, teilfreistellung = 0) {
  const brutto = positiveZahl(bruttoErtrag);
  const freiAnteil = Math.max(0, Math.min(1, Number(teilfreistellung) || 0));
  const steuerbasis = brutto * (1 - freiAnteil);
  const status = kapitalsteuerStatus(state);
  const freibetrag = Math.min(steuerbasis, status.verbleibend);
  const zuVersteuern = Math.max(0, steuerbasis - freibetrag);
  const steuer = zuVersteuern * positiveZahl(state.config.kapitalsteuer.steuersatz);
  return {
    bruttoErtrag: brutto,
    teilfreistellung: brutto * freiAnteil,
    steuerbasis,
    freibetrag,
    zuVersteuern,
    steuer,
    nettoErtrag: brutto - steuer,
    jahr: status.jahr,
  };
}

export function verbucheKapitalertrag(state, bruttoErtrag, teilfreistellung = 0) {
  const ergebnis = kapitalertragVorschau(state, bruttoErtrag, teilfreistellung);
  const vorher = state.kapitalsteuer || {};
  if (vorher.jahr !== ergebnis.jahr) {
    state.kapitalsteuer = {
      jahr: ergebnis.jahr,
      freibetragGenutzt: 0,
      steuernGesamt: positiveZahl(vorher.steuernGesamt),
      ertraegeBruttoGesamt: positiveZahl(vorher.ertraegeBruttoGesamt),
    };
  }
  state.kapitalsteuer.freibetragGenutzt += ergebnis.freibetrag;
  state.kapitalsteuer.steuernGesamt += ergebnis.steuer;
  state.kapitalsteuer.ertraegeBruttoGesamt += ergebnis.bruttoErtrag;
  return ergebnis;
}

export function renditeNachSteuer(state, bruttoRendite, teilfreistellung = 0) {
  const brutto = Number(bruttoRendite) || 0;
  const steueranteil = (1 - Math.max(0, Math.min(1, Number(teilfreistellung) || 0)))
    * positiveZahl(state.config.kapitalsteuer.steuersatz);
  return brutto > 0 ? brutto * (1 - steueranteil) : brutto;
}

function positiveZahl(wert) {
  const zahl = Number(wert);
  return Number.isFinite(zahl) ? Math.max(0, zahl) : 0;
}

