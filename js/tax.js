// tax.js — stark vereinfachter Jahres-Steuerbescheid für vermietete Objekte.
// DOM-frei; Formeln in ECONOMY_MODEL.md §21.

// Sammelt die steuerlich relevanten Monatswerte aller Kapitalanlagen und
// erstellt im Dezember genau einen Bescheid. Gibt die Zahlung dieses Monats
// zurück (sonst 0), damit engine.tick den Gesamt-Cashflow korrekt ausweist.
export function tickSteuer(state, objektErgebnisse) {
  const laufend = state.steuer.laufendesJahr;
  const cfg = state.config.steuer;

  for (const { objekt, pnl } of objektErgebnisse) {
    laufend.miete += pnl.miete;
    laufend.zinsen += pnl.zinsanteil;
    laufend.kosten += pnl.hausgeld + pnl.hausverwaltung;
    laufend.afa += (objekt.steuerBasisGebaeude || objekt.kaufpreis * cfg.gebaeudeAnteil)
      * cfg.afaSatz / 12;
  }

  const kalenderMonat = ((state.config.zeit.startMonat - 1 + state.monat) % 12) + 1;
  if (kalenderMonat !== 12) return 0;

  const ergebnis = laufend.miete - laufend.zinsen - laufend.kosten - laufend.afa;
  const steuer = Math.max(0, ergebnis) * state.steuer.grenzsatz;
  const bescheid = {
    jahr: laufend.jahr,
    miete: laufend.miete,
    zinsen: laufend.zinsen,
    kosten: laufend.kosten,
    afa: laufend.afa,
    ergebnis,
    grenzsatz: state.steuer.grenzsatz,
    steuer,
  };
  state.steuer.bescheide.push(bescheid);
  // Nullbescheide ohne jede Vermietungsaktivität bleiben im Steuerarchiv,
  // verstopfen aber nicht die Entscheidungstimeline.
  if (laufend.miete || laufend.zinsen || laufend.kosten || laufend.afa) {
    state.log.push({
      monat: state.monat,
      text: `Steuerbescheid ${bescheid.jahr}: ${Math.round(steuer).toLocaleString('de-DE')} € ` +
        `auf ${Math.round(Math.max(0, ergebnis)).toLocaleString('de-DE')} € Vermietungsergebnis.`,
    });
  }
  state.steuer.laufendesJahr = {
    jahr: laufend.jahr + 1,
    miete: 0,
    zinsen: 0,
    kosten: 0,
    afa: 0,
  };
  return steuer;
}

export function setzeGrenzsteuersatz(state, wert) {
  const cfg = state.config.steuer;
  state.steuer.grenzsatz = Math.max(cfg.grenzsatzMin, Math.min(cfg.grenzsatzMax, Number(wert)));
  return state.steuer.grenzsatz;
}

export function steuerVorschau(state) {
  const l = state.steuer.laufendesJahr;
  const ergebnis = l.miete - l.zinsen - l.kosten - l.afa;
  return { ...l, ergebnis, steuer: Math.max(0, ergebnis) * state.steuer.grenzsatz };
}
