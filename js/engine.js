// engine.js — der monatliche Tick: Haushalts-Cashflow, Tagesgeld, Objekt-P&L,
// Segment-/Zins-Drift, Feed-Lifecycle, ETF-Benchmark. Formeln in
// ECONOMY_MODEL.md. Kein DOM-Zugriff (Node-testbar). Ab Phase 3: Event-Rolls.

import { rngNormalStrom } from './state.js?v=54';
import { tickMarkt, fairerWert } from './market.js?v=54';
import { sondertilgungRahmen, tickBasiszins, tickObjekt } from './finance.js?v=54';
import { rolleAuftakt, rolleEvent } from './events.js?v=54';
import { tickSteuer } from './tax.js?v=54';
import { tickVerkaeufe } from './verkauf.js?v=54';
import { wendeAdminPendingAn } from './admin.js?v=54';
import { hatWartemoment, verwerfeWartemomente } from './signals.js?v=54';
import { verbucheKapitalertrag } from './kapitalsteuer.js?v=54';
import { arbeitsmodell, aktualisiereLebensphasen, zeitbudgetMonat } from './life.js?v=54';
import { tickObjektArcs } from './arcs.js?v=54';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// Harte Obergrenze der Kampagne. Das tatsächliche Lebensende liegt — abhängig
// von Seed und Langzeitstress — innerhalb des konfigurierten Altersfensters.
export function gesamtMonate(state) {
  const z = state.config.zeit;
  return Math.max(0, Math.round((z.lebensendeMaxAlter - z.startAlter) * 12));
}

// Aktuelles Alter der Eltern (ganze Jahre).
export function alter(state) {
  return state.config.zeit.startAlter + Math.floor(state.monat / 12);
}

export function alterGenau(state) {
  return state.config.zeit.startAlter + state.monat / 12;
}

export function istImRuhestand(state) {
  return alterGenau(state) >= state.config.zeit.rentenAlter;
}

// Derselbe transparente Langzeit-Stressbegriff wie im Endscore: Zeitüberzug
// und Anteil der Monate mit negativem Tagesgeld, normiert auf 0…1.
export function lebensstressIndex(state) {
  const stat = state.statistik || {};
  const monate = Math.max(1, stat.monate || 0);
  const zeitUeberzugSchnitt = (stat.zeitUeberzugSumme || 0) / monate;
  const negativCashAnteil = (stat.monateNegativCash || 0) / monate;
  const cfg = state.config.endgame;
  const punkte = zeitUeberzugSchnitt * cfg.stressPunkteJeUeberzugStunde +
    negativCashAnteil * cfg.stressPunkteNegativCashAnteil;
  return clamp(punkte / 100, 0, 1);
}

// Reine Vorschau: mutiert den State nicht und ist damit direkt testbar. Der
// Seed wählt das Basisalter; Stress kann es höchstens bis zur Untergrenze und
// um den konfigurierten Maximalmalus verkürzen.
export function lebensendeVorschau(state) {
  const z = state.config.zeit;
  const minAlter = Number(z.lebensendeMinAlter);
  const maxAlter = Math.max(minAlter, Number(z.lebensendeMaxAlter));
  const zufallswert = clamp(Number(state.lebensende?.zufallswert) || 0, 0, 1);
  const basisAlter = minAlter + zufallswert * (maxAlter - minAlter);
  const stressIndex = lebensstressIndex(state);
  const stressMalusJahre = Math.min(
    Math.max(0, Number(z.stressMalusMaxJahre) || 0) * stressIndex,
    Math.max(0, basisAlter - minAlter)
  );
  return {
    minAlter,
    maxAlter,
    zufallswert,
    basisAlter,
    stressIndex,
    stressMalusJahre,
    zielAlter: clamp(basisAlter - stressMalusJahre, minAlter, maxAlter),
  };
}

// Anzeigedatum des aktuellen Monats.
export function datum(state) {
  const z = state.config.zeit;
  return new Date(z.startJahr, z.startMonat - 1 + state.monat, 1);
}

// Monatliche Kosten eines Kindes nach Alter (Staffel aus config).
function kinderKosten(kindAlter, haushalt) {
  if (kindAlter >= haushalt.auszugsAlter) return 0; // ausgezogen
  for (const stufe of haushalt.kinderKosten) {
    if (kindAlter <= stufe.bisAlter) return stufe.kosten;
  }
  // Älter als letzte Stufe, aber noch nicht ausgezogen → letzte Stufe gilt.
  return haushalt.kinderKosten[haushalt.kinderKosten.length - 1].kosten;
}

function kindergeld(kindAlter, haushalt) {
  return kindAlter < haushalt.kindergeldBisAlter
    ? (haushalt.kindergeldProKind || 0)
    : 0;
}

function altersFaktor(alter, stufen) {
  for (const stufe of stufen || []) {
    if (alter <= stufe.bisAlter) return stufe.faktor;
  }
  return stufen?.at(-1)?.faktor ?? 1;
}

// Haushaltsrechnung für den aktuellen Monat (state.monat). Wachstum wird
// monatlich stetig aufgezinst: wert = basis * (1 + p.a.)^(monat/12).
// Auch von der UI genutzt (Haushalts-Karte auf dem Dashboard).
export function monatsWerte(state) {
  const h = state.config.haushalt;
  const jahre = state.monat / 12;
  const elternAlter = state.config.zeit.startAlter + jahre;

  const aktiveEinkommensSpruenge = (h.einkommensSpruenge || [])
    .filter((sprung) => state.monat >= sprung.abMonat);
  const einkommensFaktor = aktiveEinkommensSpruenge
    .reduce((faktor, sprung) => faktor * sprung.faktor, 1);
  const einkommensAltersFaktor = altersFaktor(elternAlter, h.einkommensAltersFaktoren);
  const einkommensFortschreibung = Math.pow(1 + h.einkommensWachstum, jahre)
    * einkommensFaktor * einkommensAltersFaktor * (state.einkommensRegionalfaktor || 1);
  const erwerbsEinkommenPerson1 = h.nettoEinkommenPerson1 * einkommensFortschreibung;
  const erwerbsEinkommenPerson2 = h.nettoEinkommenPerson2 * einkommensFortschreibung;
  const erwerbsEinkommen = erwerbsEinkommenPerson1 + erwerbsEinkommenPerson2;
  const imRuhestand = istImRuhestand(state);
  const rentenFaktor = imRuhestand ? h.rentenNettoFaktor : 1;
  const arbeit = arbeitsmodell(state);
  const einkommenPerson1 = erwerbsEinkommenPerson1 * rentenFaktor + arbeit.einkommenDeltaMonat;
  const einkommenPerson2 = erwerbsEinkommenPerson2 * rentenFaktor;
  const einkommen = einkommenPerson1 + einkommenPerson2;
  const mieteVergleich = h.miete * Math.pow(1 + h.mietWachstum, jahre);
  const miete = state.eigenheim ? 0 : mieteVergleich;
  const kostenFaktor = Math.pow(1 + h.kostenWachstum, jahre);
  const lebenshaltungAltersFaktor = altersFaktor(elternAlter, h.lebenshaltungAltersFaktoren);
  const reisenAltersFaktor = altersFaktor(elternAlter, h.reisenAltersFaktoren);
  const autoAltersFaktor = altersFaktor(elternAlter, h.autoAltersFaktoren);
  const lebenshaltungOhneReisen = Math.max(0, h.lebenshaltung - (h.reisen || 0))
    * kostenFaktor * lebenshaltungAltersFaktor;
  const reisen = (h.reisen || 0) * kostenFaktor * reisenAltersFaktor;
  const auto = state.monat >= (h.autoAbMonat ?? Number.POSITIVE_INFINITY)
    ? (h.autoKostenMonat || 0) * kostenFaktor * autoAltersFaktor
    : 0;
  const lebenshaltung = lebenshaltungOhneReisen + reisen + auto;

  const wachstumKinder = Math.pow(1 + h.kostenWachstum, jahre);
  let kinder = 0;
  let kindergeldGesamt = 0;
  const kinderDetails = h.kinder.map((kind) => {
    const kindAlter = kind.alter + state.monat / 12;
    const kosten = kinderKosten(kindAlter, h) * wachstumKinder;
    const kindergeldBetrag = kindergeld(kindAlter, h);
    kinder += kosten;
    kindergeldGesamt += kindergeldBetrag;
    return { alter: kindAlter, kosten, kindergeld: kindergeldBetrag };
  });

  const gesamteinkommen = einkommen + kindergeldGesamt;
  const sparrate = gesamteinkommen - miete - lebenshaltung - kinder;
  const sparplanEtfAnteil = Math.max(0, Math.min(1, h.sparplanEtfAnteil || 0));
  const etfEinzahlung = Math.max(0, sparrate) * sparplanEtfAnteil;
  // Der ETF ist der Kontrafaktualfall „weiter mieten und dasselbe externe Geld
  // sparen“. Ein Eigenheim darf ihm nicht die gesparte Miete gutschreiben,
  // während Kredit und Eigentümerkosten nur beim Spieler landen.
  const etfSparrate = gesamteinkommen - mieteVergleich - lebenshaltung - kinder;
  return {
    einkommen, einkommenPerson1, einkommenPerson2, arbeitsmodellDelta: arbeit.einkommenDeltaMonat,
    erwerbsEinkommen, erwerbsEinkommenPerson1, erwerbsEinkommenPerson2,
    kindergeld: kindergeldGesamt, gesamteinkommen,
    elternAlter, einkommensAltersFaktor, lebenshaltungAltersFaktor, reisenAltersFaktor, autoAltersFaktor,
    imRuhestand, miete, mieteVergleich, lebenshaltung, lebenshaltungOhneReisen,
    reisen, auto, kinder, kinderDetails, sparrate, sparplanEtfAnteil,
    etfEinzahlung, etfSparrate,
    einkommensMeilenstein: aktiveEinkommensSpruenge.at(-1)?.label || null,
  };
}

// Nettovermögen = Cash + liquides ETF-Depot + faire Marktwerte − Restschulden
// + Rücklagen
// (ECONOMY_MODEL §14, §19).
export function nettovermoegen(state) {
  let immo = 0;
  for (const o of state.portfolio) {
    immo += fairerWert(state, o) - o.darlehen.restschuld + (o.ruecklage || 0);
  }
  if (state.eigenheim) {
    const o = state.eigenheim;
    immo += fairerWert(state, o) - o.darlehen.restschuld + (o.ruecklage || 0);
  }
  return state.cash + (state.etfDepot?.wert || 0) + immo;
}

// Monatlicher Zeitverbrauch: Selbstverwaltung je Objekt, Renovierung teurer,
// Hausverwaltung nimmt die Zeit ab (ECONOMY_MODEL §19).
export function zeitVerbrauch(state) {
  const bw = state.config.bewirtschaftung;
  let h = 0;
  for (const o of state.portfolio) {
    if (o.renovierung) h += state.config.renovierung.zeitProRenovierung + (o.renovierung.eigenleistung?.zeitProMonat || 0);
    else if (!o.hausverwaltung) h += bw.zeitProObjekt;
    if (o.vermietet) {
      const modell = state.config.mieter.vermietungsmodelle?.[o.vermietungsart || (o.moebliert ? 'moebliert' : 'regulaer')];
      h += (modell?.zeitProMonat || 0) * (o.hausverwaltung ? .35 : 1);
    }
  }
  return h + arbeitsmodell(state).zeitBelastungMonat;
}

// Monatliche ETF-Rendite: lognormal um die erwartete Drift, moduliert durch
// die versteckte Marktphase und den Volatilitätsfaktor der Schwierigkeit.
function etfMonatsRendite(state) {
  const k = state.config.kapital;
  const phaseMod = state.config.marktphase.etfDriftMod[state.marktphase] ?? 0;
  const volFaktor = state.config.schwierigkeiten[state.schwierigkeit].volatilitaetsFaktor;
  const mu = Math.log(1 + k.etfRendite + phaseMod) / 12;
  const sigma = (k.etfVolatilitaet * volFaktor) / Math.sqrt(12);
  return Math.expm1(mu - 0.5 * sigma * sigma + sigma * rngNormalStrom(state, 'etfRngState'));
}

// Ein Monat vergeht. RNG-Reihenfolge ist fix (Determinismus):
// Basiszins → Segment-Indizes/Feed → Objekt-Fälligkeiten → separater ETF-Strom.
export function tick(state) {
  if (state.beendet) return;

  // Ein bestätigter Eigenheimumzug verändert das Erwerbseinkommen erst im
  // folgenden Haushaltsmonat und genau einmal.
  if (Number.isFinite(state.ausstehenderEinkommensRegionalfaktor)) {
    state.einkommensRegionalfaktor = state.ausstehenderEinkommensRegionalfaktor;
    state.ausstehenderEinkommensRegionalfaktor = null;
  }

  const adminAenderungen = wendeAdminPendingAn(state);
  if (adminAenderungen > 0) {
    state.log.push({
      monat: state.monat,
      text: `Szenario angepasst: ${adminAenderungen} Admin-Wert${adminAenderungen === 1 ? '' : 'e'} gelten ab diesem Monat.`,
    });
  }
  aktualisiereLebensphasen(state);

  const einkommensSprung = (state.config.haushalt.einkommensSpruenge || [])
    .find((sprung) => sprung.abMonat === state.monat);
  if (einkommensSprung) {
    state.log.push({
      monat: state.monat,
      text: `${einkommensSprung.label}: Das Haushalts-Nettoeinkommen steigt planmäßig.`,
    });
  }

  if (istImRuhestand(state) && !state.lebensende.rentenbeginnGeloggt) {
    state.lebensende.rentenbeginnGeloggt = true;
    state.log.push({
      monat: state.monat,
      text: `Ruhestand: Das Haushalts-Netto sinkt auf ${Math.round(state.config.haushalt.rentenNettoFaktor * 100)} % des fortgeschriebenen Erwerbsnettos.`,
    });
  }

  const w = monatsWerte(state);

  // Zins- und Marktdrift zuerst (Konditionen/Werte gelten für diesen Monat)
  tickBasiszins(state);
  tickMarkt(state);

  // Objekt-P&L: Mieten, Bewirtschaftung, Annuitäten, fällige Mängel
  let immoCashflow = 0;
  const objektErgebnisse = [];
  for (const objekt of state.portfolio) {
    const pnl = tickObjekt(state, objekt);
    immoCashflow += pnl.cashflow;
    objektErgebnisse.push({ objekt, pnl });
  }
  const eigenheimPnl = state.eigenheim ? tickObjekt(state, state.eigenheim) : null;
  const eigenheimCashflow = eigenheimPnl?.cashflow || 0;
  const steuerZahlung = tickSteuer(state, objektErgebnisse);

  // Tagesgeldzinsen sind Anlageertrag auf positives Cash; negatives Cash zieht
  // Dispo-Zins (forced credit, §19). Beide fließen nicht in den ETF-Spiegel —
  // gespiegelt wird nur der externe Zufluss Sparrate (§4).
  const habenZinsBrutto = Math.max(0, state.cash) * (state.config.kapital.tagesgeldZins / 12);
  const zinsSteuer = habenZinsBrutto > 0
    ? verbucheKapitalertrag(state, habenZinsBrutto).steuer
    : 0;
  const habenZins = habenZinsBrutto - zinsSteuer;
  const dispoZins = Math.min(0, state.cash) * (state.config.bewirtschaftung.dispoZins / 12);
  const cashSparrate = w.sparrate - w.etfEinzahlung;
  state.cash += cashSparrate + habenZins + dispoZins + immoCashflow + eigenheimCashflow - steuerZahlung;
  state.letzterCashflow = cashSparrate + habenZins + dispoZins + immoCashflow + eigenheimCashflow - steuerZahlung;
  state.letzterImmoCashflow = immoCashflow;
  state.letzterEigenheimCashflow = eigenheimCashflow;
  state.letzteSteuerzahlung = steuerZahlung;
  state.letzteKapitalsteuerzahlung = zinsSteuer;
  state.letzterCashZins = habenZins + dispoZins;
  state.letzteHaushaltswerte = w;

  // Echtes Depot und Vergleichsdepot erleben exakt dieselbe Marktrendite. Das
  // echte Depot erhält den im Startprofil gewählten Sparplan-Anteil; der reine
  // ETF-Benchmark erhält zum fairen Vergleich die gesamte externe Sparrate.
  const etfRendite = etfMonatsRendite(state);
  state.etfDepot.wert = Math.max(0, state.etfDepot.wert * (1 + etfRendite) + w.etfEinzahlung);
  state.etfDepot.einstandGesamt += w.etfEinzahlung;
  const etf = state.etfVergleich;
  etf.wert = Math.max(0, etf.wert * (1 + etfRendite) + w.etfSparrate);

  // Zeitbudget monatlich frisch; Überzug erzeugt Familien-Stress (§19).
  state.zeitbudget.verfuegbar = zeitbudgetMonat(state);
  state.zeitbudget.verbraucht = zeitVerbrauch(state);
  const ueberzug = Math.max(0, state.zeitbudget.verbraucht - state.zeitbudget.verfuegbar);

  // Familienzufriedenheit: Drift zu Neutral, minus Zeitstress und Dispo-Druck.
  const f = state.config.familie;
  const familieZiel = f.neutral + (state.eigenheim ? state.config.eigenheim.familieNeutralBonus : 0) + arbeitsmodell(state).familieZielDelta;
  let fz = state.familienzufriedenheit + (familieZiel - state.familienzufriedenheit) * f.driftProMonat;
  fz -= ueberzug * f.proZeitUeberzug;
  if (state.cash < 0) fz -= f.dispoMalus;
  state.familienzufriedenheit = Math.max(0, Math.min(100, fz));

  state.monat += 1;
  // Zu Beginn jedes neuen Kalenderjahres erinnert die Bank einmal je offenem
  // Darlehen an das vertragliche Sondertilgungsfenster. Die Meldung verlinkt
  // direkt zum betreffenden Objekt und bleibt rein informativ.
  const kalenderMonat = (state.config.zeit.startMonat - 1 + state.monat) % 12;
  if (kalenderMonat === 0) {
    const kredite = [...state.portfolio, ...(state.eigenheim ? [state.eigenheim] : [])];
    for (const objekt of kredite) {
      if (!(objekt.darlehen?.restschuld > 0)) continue;
      const rahmen = sondertilgungRahmen(state, objekt);
      if (rahmen.verbleibend < 1) continue;
      state.log.push({
        monat: state.monat,
        ziel: objekt.listingId,
        kategorie: 'Finanzen',
        text: `${objekt.titel}: Bis zu ${Math.round(rahmen.verbleibend).toLocaleString('de-DE')} € Sondertilgung sind ${rahmen.jahr} noch möglich.`,
      });
    }
  }
  const verkaeufe = tickVerkaeufe(state);
  state.letzterVerkaufsCashflow = verkaeufe.cashflow;
  if (verkaeufe.cashflow) {
    state.letzterCashflow += verkaeufe.cashflow;
    state.letzterImmoCashflow += verkaeufe.cashflow;
  }

  state.statistik.zeitUeberzugSumme += ueberzug;
  if (state.cash < 0) state.statistik.monateNegativCash += 1;
  state.statistik.familienSumme += state.familienzufriedenheit;
  state.statistik.monate += 1;

  state.historie.push({
    monat: state.monat,
    // Der Marktpfad bleibt unabhängig von Spielerentscheidungen. Der
    // Benchmarkwert darf sich dagegen bewusst unterscheiden, wenn ein Umzug
    // das Einkommen und damit die gespiegelte Sparrate ändert.
    etfRendite,
    cash: state.cash,
    etfDepot: state.etfDepot.wert,
    nettovermoegen: nettovermoegen(state),
    etf: etf.wert,
    cashflow: state.letzterCashflow,
  });

  const lebensende = lebensendeVorschau(state);
  Object.assign(state.lebensende, lebensende);
  if (alterGenau(state) >= lebensende.zielAlter || alterGenau(state) >= lebensende.maxAlter) {
    state.beendet = true;
    state.lebensende.verstorbenAlter = alterGenau(state);
    state.lebensende.grund = 'lebensende';
    state.log.push({
      monat: state.monat,
      text: `Lebensende mit ${Math.floor(alterGenau(state))} Jahren: Zufall und langfristiger Stress bestimmten den Zeitpunkt in diesem Spielmodell.`,
    });
  } else {
    tickObjektArcs(state);
    // Dilemma-Event-Roll an fixer RNG-Position (§18); setzt ggf. state.aktivesEvent.
    rolleEvent(state);
    // Terminierte Auftaktmomente NACH dem RNG-Roll: füllen nur einen sonst
    // leeren Monat vor dem ersten Kauf, ohne RNG oder Ökonomie zu berühren.
    rolleAuftakt(state);
  }
}

// n Monate am Stück (Fast-Forward). Stoppt am Kampagnenende UND bei einem
// aktiven Dilemma-Event: Ohne autoResolve bricht die Schleife ab (die UI öffnet
// das Event-Modal); mit autoResolve(state) wird das Event sofort aufgelöst
// (Tests, kopfloser Durchlauf) und weitergelaufen.
export function advanceMonths(state, n, autoResolve) {
  for (let i = 0; i < n && !state.beendet; i++) {
    tick(state);
    if (hatWartemoment(state)) {
      if (autoResolve) verwerfeWartemomente(state);
      else break;
    }
    if (state.aktivesEvent) {
      if (autoResolve) autoResolve(state);
      else break;
    }
  }
}

