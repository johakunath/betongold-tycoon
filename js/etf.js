// etf.js — das echte, liquide ETF-Depot des Spielers. Der Vergleichs-ETF in
// state.etfVergleich bleibt davon getrennt und dient nur als Benchmark.

import { kapitalertragVorschau, verbucheKapitalertrag } from './kapitalsteuer.js?v=59';

export function etfVerkaufVorschau(state, betrag) {
  const depot = state.etfDepot;
  const gewuenscht = Number(betrag);
  if (!depot || !Number.isFinite(depot.wert) || !Number.isFinite(depot.einstandGesamt)
      || !Number.isFinite(gewuenscht) || gewuenscht <= 0) {
    return { ok: false, betrag: 0, brutto: 0, netto: 0, steuer: 0 };
  }
  const brutto = Math.min(depot.wert, Math.round(gewuenscht * 100) / 100);
  if (brutto <= 0) return { ok: false, betrag: 0, brutto: 0, netto: 0, steuer: 0 };
  const anteil = depot.wert > 0 ? brutto / depot.wert : 0;
  const einstand = depot.einstandGesamt * anteil;
  const gewinn = Math.max(0, brutto - einstand);
  const steuerErgebnis = kapitalertragVorschau(
    state, gewinn, state.config.kapitalsteuer.etfTeilfreistellung
  );
  const netto = brutto - steuerErgebnis.steuer;
  return {
    ok: true,
    betrag: netto,
    brutto,
    netto,
    einstand,
    gewinn,
    steuer: steuerErgebnis.steuer,
    freibetrag: steuerErgebnis.freibetrag,
    teilfreistellung: steuerErgebnis.teilfreistellung,
  };
}

export function verkaufeEtf(state, betrag) {
  const vorschau = etfVerkaufVorschau(state, betrag);
  if (!vorschau.ok) return vorschau;
  const depot = state.etfDepot;
  const steuerErgebnis = verbucheKapitalertrag(
    state, vorschau.gewinn, state.config.kapitalsteuer.etfTeilfreistellung
  );
  depot.wert = Math.max(0, depot.wert - vorschau.brutto);
  depot.einstandGesamt = Math.max(0, depot.einstandGesamt - vorschau.einstand);
  state.cash += vorschau.netto;
  state.log.push({
    monat: state.monat,
    text: `ETF-Anteile für ${Math.round(vorschau.brutto).toLocaleString('de-DE')} € verkauft; ` +
      `${Math.round(steuerErgebnis.steuer).toLocaleString('de-DE')} € Kapitalsteuer, ` +
      `${Math.round(vorschau.netto).toLocaleString('de-DE')} € aufs Tagesgeld.`,
  });
  return vorschau;
}

export function kaufeEtf(state, betrag) {
  const depot = state.etfDepot;
  const gewuenscht = Number(betrag);
  if (!depot || !Number.isFinite(depot.wert) || !Number.isFinite(state.cash)
      || !Number.isFinite(gewuenscht) || gewuenscht <= 0) {
    return { ok: false, betrag: 0 };
  }

  const investiert = Math.min(Math.max(0, state.cash), Math.round(gewuenscht * 100) / 100);
  if (investiert <= 0) return { ok: false, betrag: 0 };

  state.cash -= investiert;
  depot.wert += investiert;
  depot.einstandGesamt += investiert;
  state.log.push({
    monat: state.monat,
    text: `${Math.round(investiert).toLocaleString('de-DE')} € vom Tagesgeld ins ETF-Depot umgeschichtet.`,
  });
  return { ok: true, betrag: investiert };
}

export function setzeSparplanEtfAnteil(state, anteil) {
  const gewuenscht = Number(anteil);
  if (!state.config?.haushalt || !Number.isFinite(gewuenscht)
      || gewuenscht < 0 || gewuenscht > 1) {
    return { ok: false, anteil: 0, geaendert: false };
  }

  const gerundet = Math.round(gewuenscht * 100) / 100;
  const vorher = Math.max(0, Math.min(1, state.config.haushalt.sparplanEtfAnteil || 0));
  state.config.haushalt.sparplanEtfAnteil = gerundet;
  const geaendert = vorher !== gerundet;
  if (geaendert) {
    state.log.push({
      monat: state.monat,
      text: `ETF-Sparplan auf ${Math.round(gerundet * 100)} % der positiven Haushaltssparrate gesetzt.`,
    });
  }
  return { ok: true, anteil: gerundet, geaendert };
}

