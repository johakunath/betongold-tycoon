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
    laufend.kosten += pnl.hausgeld + pnl.hausverwaltung + (pnl.steuerInstandhaltung || 0);
    laufend.afa += (objekt.steuerBasisGebaeude || objekt.kaufpreis * cfg.gebaeudeAnteil)
      * cfg.afaSatz / 12;
  }

  const kalenderMonat = ((state.config.zeit.startMonat - 1 + state.monat) % 12) + 1;
  if (kalenderMonat !== 12) return 0;

  const ergebnisVorVortrag = laufend.miete - laufend.zinsen - laufend.kosten - laufend.afa;
  const verrechenbar = ergebnisVorVortrag - state.steuer.verlustvortrag;
  // Vereinfachung: Das Spiel kennt nur das Netto-Erwerbseinkommen. Ein
  // negatives Vermietungsergebnis wird deshalb im selben Jahr mit dem
  // sichtbaren Grenzsteuersatz gutgeschrieben. Ein Vortrag bleibt als
  // Datenvertrag erhalten, falls spätere Profile kein Erwerbseinkommen haben.
  const hatErwerbseinkommen = (state.config.haushalt.nettoEinkommenPerson1 || 0) +
    (state.config.haushalt.nettoEinkommenPerson2 || 0) > 0;
  const steuer = (hatErwerbseinkommen ? verrechenbar : Math.max(0, verrechenbar))
    * state.steuer.grenzsatz;
  state.steuer.verlustvortrag = hatErwerbseinkommen ? 0 : Math.max(0, -verrechenbar);
  const ergebnis = verrechenbar;
  const bescheid = {
    jahr: laufend.jahr,
    miete: laufend.miete,
    zinsen: laufend.zinsen,
    kosten: laufend.kosten,
    afa: laufend.afa,
    ergebnis,
    grenzsatz: state.steuer.grenzsatz,
    steuer,
    verlustvortrag: state.steuer.verlustvortrag,
  };
  state.steuer.bescheide.push(bescheid);
  // Nullbescheide ohne jede Vermietungsaktivität bleiben im Steuerarchiv,
  // verstopfen aber nicht die Entscheidungstimeline.
  if (laufend.miete || laufend.zinsen || laufend.kosten || laufend.afa) {
    state.log.push({
      monat: state.monat,
      text: steuer < 0
        ? `Steuerbescheid ${bescheid.jahr}: ${Math.round(-steuer).toLocaleString('de-DE')} € Gutschrift aus Vermietungsverlusten.`
        : `Steuerbescheid ${bescheid.jahr}: ${Math.round(steuer).toLocaleString('de-DE')} € auf ${Math.round(ergebnis).toLocaleString('de-DE')} € Vermietungsergebnis.`,
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
  const ergebnis = l.miete - l.zinsen - l.kosten - l.afa - state.steuer.verlustvortrag;
  return { ...l, ergebnis, steuer: ergebnis * state.steuer.grenzsatz, verlustvortrag: state.steuer.verlustvortrag };
}
