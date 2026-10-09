// etf.js — das echte, liquide ETF-Depot des Spielers. Der Vergleichs-ETF in
// state.etfVergleich bleibt davon getrennt und dient nur als Benchmark.

import { kapitalertragVorschau, verbucheKapitalertrag } from './kapitalsteuer.js?v=60';

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

// Bucht einen geprüften Verkauf: Steuer auf den realisierten Gewinn, Depot
// und Einstand anteilig reduzieren, Netto aufs Tagesgeld.
function bucheVerkauf(state, vorschau) {
  const depot = state.etfDepot;
  const steuerErgebnis = verbucheKapitalertrag(
    state, vorschau.gewinn, state.config.kapitalsteuer.etfTeilfreistellung
  );
  depot.wert = Math.max(0, depot.wert - vorschau.brutto);
  depot.einstandGesamt = Math.max(0, depot.einstandGesamt - vorschau.einstand);
  state.cash += vorschau.netto;
  return steuerErgebnis;
}

export function verkaufeEtf(state, betrag) {
  const vorschau = etfVerkaufVorschau(state, betrag);
  if (!vorschau.ok) return vorschau;
  const steuerErgebnis = bucheVerkauf(state, vorschau);
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

// Entnahmeregel (ECONOMY_MODEL §4b): Fällt das Tagesgeld unter
// `mindestpufferMonate` Monatsausgaben, werden ETF-Anteile verkauft, statt in
// den Dispo zu rutschen. Realisierte Gewinne werden versteuert. Kein RNG;
// ein Transfer, kein Cashflow. Gibt den Nettobetrag zurück.
export function wendeEntnahmeregelAn(state, monatsausgaben) {
  const regel = state.config.kapital?.entnahme;
  const depot = state.etfDepot;
  if (!regel?.aktiv || !(depot?.wert > 1)) return 0;
  const fehlt = Math.max(0, Number(regel.mindestpufferMonate) || 0) * Math.max(0, monatsausgaben) - state.cash;
  if (fehlt <= 1) return 0;
  // Brutto so wählen, dass nach Steuer ungefähr der Fehlbetrag ankommt.
  let brutto = Math.min(depot.wert, fehlt);
  for (let i = 0; i < 3; i++) {
    const probe = etfVerkaufVorschau(state, brutto);
    if (!probe.ok || probe.netto <= 0) break;
    brutto = Math.min(depot.wert, brutto * fehlt / probe.netto);
  }
  const vorschau = etfVerkaufVorschau(state, brutto);
  if (!vorschau.ok) return 0;
  bucheVerkauf(state, vorschau);
  return vorschau.netto;
}

export function setzeEntnahmeregel(state, aktiv, monate) {
  const wert = Number(monate);
  if (!state.config?.kapital || !Number.isFinite(wert) || wert < 0 || wert > 24) {
    return { ok: false };
  }
  state.config.kapital.entnahme = { aktiv: !!aktiv, mindestpufferMonate: Math.round(wert * 2) / 2 };
  state.log.push({
    monat: state.monat,
    text: aktiv
      ? `Entnahmeregel: Tagesgeld bleibt über ${state.config.kapital.entnahme.mindestpufferMonate.toLocaleString('de-DE')} Monatsausgaben; darunter werden ETF-Anteile verkauft.`
      : 'Entnahmeregel ausgeschaltet: Bei leerem Tagesgeld greift der Dispo.',
  });
  return { ok: true, ...state.config.kapital.entnahme };
}

