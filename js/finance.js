// finance.js — Kreditangebot, Haushaltsrechnung der Bank, Kaufabwicklung,
// Annuitäten-Tick, Anschlussfinanzierung. Formeln: ECONOMY_MODEL.md §9–§12.
// DOM-frei; zirkulärer Import mit engine.js (monatsWerte) ist auf Funktions-
// ebene unkritisch.

import { rngFloat, rngNormal, bestandsMieter, entnimmRuecklage } from './state.js?v=59';
import { getListing } from './content.js?v=59';
import { monatsWerte } from './engine.js?v=59';
import { fairerWert } from './market.js?v=59';
import { angesetzteMiete, marktmiete, mieterMonat, neueBewerber } from './tenants.js?v=59';
import { renovierungAbschluss, renovierungsOptionen } from './renovation.js?v=59';
import { meldeWartemoment } from './signals.js?v=59';
import { protokolliereWirkung, pruefstand } from './gameplay.js?v=59';
import {
  eigenheimEignung, fixkostenMonat, instandhaltungMonat, gebaeudeAnteil,
} from './immobilie.js?v=59';

// ---------------------------------------------------------------------------
// Basiszins: mean-reverting Random Walk (monatlich, aus engine.tick)
// ---------------------------------------------------------------------------

export function tickBasiszins(state) {
  const k = state.config.kredit;
  state.basiszins +=
    k.reversion * (k.basiszinsMittel - state.basiszins) + k.volaMonat * rngNormal(state);
  state.basiszins = Math.max(k.basiszinsMin, Math.min(k.basiszinsMax, state.basiszins));
}

// ---------------------------------------------------------------------------
// Nebenkosten (ECONOMY_MODEL §12)
// ---------------------------------------------------------------------------

export function nebenkostenFuer(state, listing, kaufpreis) {
  const nk = state.config.nebenkosten;
  const stadt = state.config.segmente[listing.segment].stadt;
  const grESt = kaufpreis * nk.grunderwerbsteuer[stadt];
  const notar = kaufpreis * nk.notarGrundbuch;
  const makler = listing.provisionsfrei ? 0 : kaufpreis * nk.maklerProvision;
  return { grESt, notar, makler, summe: grESt + notar + makler };
}

// ---------------------------------------------------------------------------
// Kreditangebot + Haushaltsrechnung (ECONOMY_MODEL §9–10)
// ---------------------------------------------------------------------------

export function spreadFuerLtv(state, ltv) {
  for (const stufe of state.config.kredit.ltvSpreads) {
    if (ltv <= stufe.bisLtv + 1e-9) return stufe.spread;
  }
  return null; // > 100 % — kein Angebot
}

// Prüft eine Finanzierungsanfrage; liefert Konditionen + ggf. Ablehnungsgründe.
export function kreditAngebot(state, {
  listingId, kaufpreis, eigenkapital, tilgungssatz, zinsbindungJahre,
  nutzung = 'kapitalanlage',
}) {
  const k = state.config.kredit;
  const listing = getListing(listingId);
  const nk = nebenkostenFuer(state, listing, kaufpreis);
  const bank = k.bank[state.config.schwierigkeiten[state.schwierigkeit].bankPuffer];
  const gruende = [];
  const eigenheimKauf = nutzung === 'eigenheim';

  if (eigenheimKauf) {
    const eignung = eigenheimEignung(state, listing);
    if (!eignung.geeignet) {
      gruende.push(`Nicht als Familienheim geeignet: ${eignung.gruende.join(', ')}.`);
    }
  }
  if (eigenheimKauf && state.eigenheim) {
    gruende.push('Ihr besitzt bereits ein Eigenheim.');
  }

  const darlehen = Math.max(0, kaufpreis + nk.summe - eigenkapital);
  const ltv = darlehen / kaufpreis;

  // Check 2: EK deckt mindestens Nebenkosten + Mindestanteil
  const minEk = nk.summe + bank.minEkAnteil * kaufpreis;
  if (eigenkapital < minEk) {
    gruende.push(
      `Zu wenig Eigenkapital: Die Bank verlangt mindestens die Nebenkosten` +
      (bank.minEkAnteil > 0 ? ` plus ${Math.round(bank.minEkAnteil * 100)} % des Kaufpreises` : '') +
      ` (${Math.round(minEk).toLocaleString('de-DE')} €).`
    );
  }
  if (eigenkapital > state.cash + 1e-6) {
    gruende.push('So viel Cash habt ihr nicht.');
  }

  // Check 3: LTV
  const spread = spreadFuerLtv(state, ltv);
  if (spread === null) {
    gruende.push(`Eine Finanzierungsquote über 100 % (${(ltv * 100).toFixed(0)} %) finanziert die Bank nicht.`);
  }

  const bindung = k.zinsbindungen.find((z) => z.jahre === zinsbindungJahre) || k.zinsbindungen[1];
  const zins = spread === null ? null : state.basiszins + spread + bindung.aufschlag;
  const rate = zins === null ? null : (darlehen * (zins + tilgungssatz)) / 12;

  // Check 1: Haushaltsrechnung
  const w = monatsWerte(state);
  const mietenBestand = state.portfolio.reduce((s, o) => s + (o.vermietet ? o.kaltmiete : 0), 0);
  const mieteNeu = !eigenheimKauf && listing.mietstatus.vermietet ? listing.mietstatus.kaltmiete : 0;
  const ratenBestand = state.portfolio.reduce(
    (s, o) => s + (o.darlehen && o.darlehen.restschuld > 0 ? o.darlehen.rate : 0), 0) +
    (state.eigenheim?.darlehen?.restschuld > 0 ? state.eigenheim.darlehen.rate : 0);
  const anrechenbar = w.gesamteinkommen + bank.mietAnrechnung * (mietenBestand + mieteNeu);
  const bw = state.config.bewirtschaftung;
  const eigenheimNebenkosten = state.eigenheim
    ? fixkostenMonat(state, state.eigenheim) + instandhaltungMonat(state, state.eigenheim)
    : eigenheimKauf
      ? fixkostenMonat(state, listing) + instandhaltungMonat(state, listing)
      : 0;
  const belastung =
    (eigenheimKauf ? 0 : w.miete) + w.lebenshaltung + w.kinder + ratenBestand +
    eigenheimNebenkosten +
    k.bewirtschaftungsPauschale * (state.portfolio.length + (eigenheimKauf ? 0 : 1));
  const spielraum = Math.max(0, (anrechenbar - belastung) * bank.puffersatz);

  if (rate !== null && rate > spielraum) {
    gruende.push(
      `Rate zu hoch: ${Math.round(rate).toLocaleString('de-DE')} €/Monat bei ` +
      `${Math.round(spielraum).toLocaleString('de-DE')} € Spielraum laut Haushaltsrechnung. ` +
      `Mehr Eigenkapital, weniger Tilgung — oder ein kleineres Objekt.`
    );
  }

  return {
    listing, kaufpreis, eigenkapital, nebenkosten: nk, nutzung,
    darlehen, ltv, zins, rate, tilgungssatz, zinsbindungJahre: bindung.jahre,
    zinsBestandteile: spread === null ? null : {
      basiszins: state.basiszins,
      ltvSpread: spread,
      bindungsaufschlag: bindung.aufschlag,
    },
    spielraum, anrechenbar, belastung,
    restschuldNachBindung:
      zins === null ? null : restschuldNach(darlehen, zins, rate, bindung.jahre * 12),
    zusage: gruende.length === 0,
    gruende,
  };
}

// Restschuld nach n Monaten Annuität (iterativ, exakt wie der Tick rechnet).
export function restschuldNach(darlehen, zins, rate, monate) {
  let rest = darlehen;
  for (let i = 0; i < monate && rest > 0; i++) {
    rest -= rate - (rest * zins) / 12;
  }
  return Math.max(0, rest);
}

export function sondertilgungRahmen(state, objekt) {
  const d = objekt?.darlehen;
  if (!d) return { max: 0, verbleibend: 0, jahr: 0, genutzt: 0 };
  const datum = new Date(state.config.zeit.startJahr, state.config.zeit.startMonat - 1 + state.monat, 1);
  const jahr = datum.getFullYear();
  const genutzt = d.sondertilgungJahr === jahr ? Number(d.sondertilgungImJahr) || 0 : 0;
  const max = (Number(d.ursprungsbetrag) || Number(d.restschuld) || 0) * state.config.kredit.sondertilgungMaxAnteil;
  return { max, verbleibend: Math.max(0, Math.min(d.restschuld, max - genutzt)), jahr, genutzt };
}

function kreditlaufzeitMonate(restschuld, zins, rate) {
  let rest = Math.max(0, restschuld);
  let monate = 0;
  while (rest > .01 && monate < 1200) {
    const tilgung = rate - rest * zins / 12;
    if (tilgung <= 0) return Number.POSITIVE_INFINITY;
    rest = Math.max(0, rest - tilgung);
    monate += 1;
  }
  return monate;
}

export function sondertilgungVorschau(state, objekt, betrag) {
  const d = objekt.darlehen;
  const rahmen = sondertilgungRahmen(state, objekt);
  const zahlung = Math.round(Math.max(0, Math.min(Number(betrag) || 0, rahmen.verbleibend, state.cash)));
  return {
    zahlung,
    cashDanach: state.cash - zahlung,
    restschuldDanach: Math.max(0, d.restschuld - zahlung),
    laufzeitVorher: kreditlaufzeitMonate(d.restschuld, d.zins, d.rate),
    laufzeitDanach: kreditlaufzeitMonate(Math.max(0, d.restschuld - zahlung), d.zins, d.rate),
    rate: d.rate,
  };
}

export function sondertilgen(state, objekt, betrag) {
  const d = objekt?.darlehen;
  const rahmen = sondertilgungRahmen(state, objekt);
  const zahlung = Math.round(Math.max(0, Math.min(Number(betrag) || 0, rahmen.verbleibend, state.cash)));
  if (!d || zahlung < 1) throw new Error('Keine Sondertilgung in dieser Höhe möglich.');
  if (d.sondertilgungJahr !== rahmen.jahr) {
    d.sondertilgungJahr = rahmen.jahr;
    d.sondertilgungImJahr = 0;
  }
  state.cash -= zahlung;
  d.restschuld = Math.max(0, d.restschuld - zahlung);
  d.sondertilgungImJahr += zahlung;
  state.log.push({ monat: state.monat, text: `${objekt.titel}: ${zahlung.toLocaleString('de-DE')} € Sondertilgung geleistet.` });
  return zahlung;
}

// Erklärt die unmittelbare monatliche Cashflow-Wirkung eines Angebots, ohne
// den Spielstand zu verändern. Die Steuer wird als Monatsrückstellung gezeigt;
// tatsächlich bucht tickSteuer weiterhin gesammelt im Dezember.
export function finanzierungsCashflowVorschau(state, angebot) {
  if (!angebot || angebot.rate === null || angebot.zins === null) return null;

  const listing = angebot.listing;
  const eigenheim = angebot.nutzung === 'eigenheim';
  const vermietet = !eigenheim && !!listing.mietstatus?.vermietet;
  const mieteinnahmen = vermietet ? Number(listing.mietstatus.kaltmiete) || 0 : 0;
  const mietersparnis = eigenheim ? monatsWerte(state).miete : 0;
  const fixkosten = fixkostenMonat(state, listing, vermietet);
  const ruecklage = instandhaltungMonat(state, listing);
  const rate = Number(angebot.rate) || 0;
  const zinsanteil = (Number(angebot.darlehen) || 0) * (Number(angebot.zins) || 0) / 12;
  const afa = eigenheim
    ? 0
    : angebot.kaufpreis * gebaeudeAnteil(state, listing) * state.config.steuer.afaSatz / 12;
  const steuerErgebnis = eigenheim
    ? 0
    : mieteinnahmen - zinsanteil - fixkosten - afa;
  const steuerMonat = steuerErgebnis * state.steuer.grenzsatz;

  const cashzins = (cash) => cash >= 0
    ? cash * state.config.kapital.tagesgeldZins / 12
    : cash * state.config.bewirtschaftung.dispoZins / 12;
  const cashzinsAenderung = cashzins(state.cash - angebot.eigenkapital) - cashzins(state.cash);
  const objektVorSteuer = mieteinnahmen - rate - fixkosten - ruecklage;
  const aenderungVorSteuer = mietersparnis + objektVorSteuer + cashzinsAenderung;
  const aenderungNachSteuer = aenderungVorSteuer - steuerMonat;
  const aktuellerGesamtcashflow = Number(state.letzterCashflow) || 0;

  return {
    aktuellerGesamtcashflow,
    mieteinnahmen,
    mietersparnis,
    rate,
    fixkosten,
    ruecklage,
    cashzinsAenderung,
    zinsanteil,
    afa,
    steuerErgebnis,
    steuerMonat,
    objektVorSteuer,
    aenderungVorSteuer,
    aenderungNachSteuer,
    gesamtVorSteuer: aktuellerGesamtcashflow + aenderungVorSteuer,
    gesamtNachSteuer: aktuellerGesamtcashflow + aenderungNachSteuer,
    leerstand: !eigenheim && !vermietet,
  };
}

// Bewertet sichtbare Bewirtschaftungswege eines Kapitalanlage-Angebots, ohne
// State oder RNG anzufassen. Das ist bewusst keine Renditegarantie: Einmalige
// Kosten, Leerstands-/Wechselrisiko und regionale Rechtsrisiken bleiben am Pfad
// erhalten. Die UI kann damit zwischen "stabilisiert tragfähig", "nach einer
// Handlung nahe null" und "auch stabilisiert untragfähig" unterscheiden.
export function finanzierungsCashflowPfade(state, angebot) {
  if (!angebot || angebot.rate === null || angebot.nutzung === 'eigenheim') return null;

  const listing = angebot.listing;
  const stadt = state.config.segmente[listing.segment].stadt;
  const fixkosten = fixkostenMonat(state, listing, true);
  const ruecklage = instandhaltungMonat(state, listing);
  const rate = Number(angebot.rate) || 0;
  const zinsanteil = (Number(angebot.darlehen) || 0) * (Number(angebot.zins) || 0) / 12;
  const afa = angebot.kaufpreis * gebaeudeAnteil(state, listing) * state.config.steuer.afaSatz / 12;
  const naheNull = state.config.bewirtschaftung.cashflowNaheNullMonat;
  const urteil = (wert) => wert >= 0 ? 'positiv' : wert >= -naheNull ? 'nahe-null' : 'negativ';
  const pfade = [];
  const fuegePfadHinzu = ({ id, label, miete, aktionen, risiko = '', einmalig = 0, dauer = 0 }) => {
    const cashflowVorSteuer = miete - fixkosten - ruecklage - rate;
    const steuerErgebnis = miete - zinsanteil - fixkosten - afa;
    // Monatsäquivalent des vereinfachten Jahresbescheids: positive Ergebnisse
    // kosten Steuer, negative Ergebnisse erzeugen eine Gutschrift.
    const steuerMonat = steuerErgebnis * state.steuer.grenzsatz;
    const cashflow = cashflowVorSteuer - steuerMonat;
    pfade.push({
      id, label, miete, cashflowVorSteuer, steuerMonat, cashflow,
      urteil: urteil(cashflow), aktionen, risiko, einmalig, dauer,
    });
  };

  if (listing.mietstatus?.vermietet) {
    const bestandsmiete = Number(listing.mietstatus.kaltmiete) || 0;
    fuegePfadHinzu({
      id: 'bestand', label: 'Bestandsmiete fortführen', miete: bestandsmiete, aktionen: [],
    });
    const recht = state.config.mietrecht[stadt];
    const rechtssicher = Math.floor(Math.min(
      marktmiete(state, listing),
      bestandsmiete * (1 + recht.kappungProzent)
    ));
    if (rechtssicher > bestandsmiete + 1) {
      fuegePfadHinzu({
        id: 'miete-pruefen',
        label: 'Bestandsmiete rechtssicher prüfen',
        miete: rechtssicher,
        aktionen: [`Mietniveau nach ${recht.kurz} prüfen`],
        risiko: 'Eine Erhöhung kann die Mieterzufriedenheit und Bindung belasten.',
      });
    }
  } else {
    const modelle = ['regulaer', 'moebliert', 'wohnenAufZeit'];
    const modellRisiko = {
      regulaer: 'Keine Mietgarantie; bis zur Auswahl eines Bewerbers bleibt das Objekt leer.',
      moebliert: 'Einrichtungskosten und häufigere Mieterwechsel sind nicht im Monatswert enthalten.',
      wohnenAufZeit: 'Hoher Zeitbedarf, häufigere Wechsel und regionales Rechtsrisiko.',
    };
    const fuegeVermietungHinzu = (objekt, modellId, renovierung = null) => {
      const modell = state.config.mieter.vermietungsmodelle[modellId];
      const aktionen = [];
      if (renovierung) aktionen.push(`Kosmetisch renovieren (${renovierung.schaetzung.toLocaleString('de-DE')} €, ${renovierung.dauer} Mon.)`);
      aktionen.push(modell.label);
      fuegePfadHinzu({
        id: `${renovierung ? 'kosmetisch-' : ''}${modellId}`,
        label: renovierung ? `Nach Renovierung · ${modell.label}` : modell.label,
        miete: angesetzteMiete(state, objekt, 'auf', modellId),
        aktionen,
        risiko: modellRisiko[modellId],
        einmalig: (renovierung?.schaetzung || 0) + (modell.moebelKosten || 0),
        dauer: renovierung?.dauer || 0,
      });
    };

    for (const modellId of modelle) fuegeVermietungHinzu(listing, modellId);

    const kosmetisch = renovierungsOptionen(state, listing)
      .find((option) => option.id === 'kosmetisch' && option.moeglich);
    if (kosmetisch) {
      const nachRenovierung = { ...listing, zustand: kosmetisch.zielZustand };
      for (const modellId of modelle) fuegeVermietungHinzu(nachRenovierung, modellId, kosmetisch);
    }
  }

  const basis = pfade[0];
  const risikoRang = (pfad) => pfad.id.includes('wohnenAufZeit') ? 2 : pfad.id.includes('moebliert') ? 1 : 0;
  const sortiere = (a, b) =>
    a.aktionen.length - b.aktionen.length || risikoRang(a) - risikoRang(b) || b.cashflow - a.cashflow;
  const empfehlung = [...pfade].filter((pfad) => pfad.cashflow >= 0).sort(sortiere)[0]
    || [...pfade].filter((pfad) => pfad.cashflow >= -naheNull).sort(sortiere)[0]
    || [...pfade].sort((a, b) => b.cashflow - a.cashflow)[0];

  return {
    basis,
    empfehlung,
    pfade,
    naheNull,
    hatPositivenPfad: pfade.some((pfad) => pfad.cashflow >= 0),
    urteil: empfehlung?.urteil || 'negativ',
  };
}

// ---------------------------------------------------------------------------
// Kaufabwicklung (Notartermin)
// ---------------------------------------------------------------------------

// Voraussetzung: market.gebotAbgeben wurde angenommen (Feed-Status reserviert)
// und kreditAngebot(...).zusage === true. Zieht EK ab, legt das Objekt ins
// Portfolio, terminiert existierende verborgene Mängel/Sonderumlagen.
export function kaufeObjekt(state, angebot) {
  const { listing } = angebot;
  const id = listing.id;
  const e = state.markt.feed[id];
  if (!e || e.status !== 'reserviert') throw new Error('Kauf ohne angenommenes Gebot.');
  if (!angebot.zusage) throw new Error('Kauf ohne Kreditzusage.');

  const cashVorher = state.cash;
  state.cash -= angebot.eigenkapital;
  e.status = 'verkauft';
  const favorit = state.favoriten.indexOf(id);
  if (favorit >= 0) state.favoriten.splice(favorit, 1);

  const dd = state.dd[id] || { aufgedeckteMaengel: [] };
  const ddCfg = state.config.dueDiligence;
  const existenz = state.maengelExistenz[id];
  const faellig = [];

  (listing.maengel || []).forEach((m, i) => {
    if (!existenz.maengel[i]) return;
    const entdeckt = dd.aufgedeckteMaengel.includes(i);
    faellig.push({
      name: m.name,
      // Unentdeckte Mängel treffen als Notreparatur (Überraschungsfaktor)
      kosten: Math.round(m.kosten * (entdeckt ? 1 : ddCfg.ueberraschungsFaktor)),
      monat: state.monat + ddCfg.mangelFaelligMin +
        Math.floor(rngFloat(state) * (ddCfg.mangelFaelligMax - ddCfg.mangelFaelligMin + 1)),
      ueberraschung: !entdeckt,
    });
  });
  if (existenz.sonderumlage) {
    faellig.push({
      name: `Sonderumlage: ${listing.sonderumlage.anlass}`,
      kosten: listing.sonderumlage.betrag,
      monat: state.monat + ddCfg.sonderumlageFaelligMin +
        Math.floor(rngFloat(state) * (ddCfg.sonderumlageFaelligMax - ddCfg.sonderumlageFaelligMin + 1)),
      ueberraschung: !(state.dd[id]?.sonderumlageBekannt),
    });
  }

  const objekt = {
    listingId: id,
    titel: listing.titel,
    segment: listing.segment,
    flaeche: listing.flaeche,
    lageScore: listing.lageScore,
    zustand: listing.zustand,
    gekauftMonat: state.monat,
    kaufpreis: angebot.kaufpreis,
    nebenkosten: angebot.nebenkosten.summe,
    energieklasse: listing.energieklasse,
    objektart: listing.objektart || 'wohnung',
    eigentumsform: listing.eigentumsform || 'weg',
    grundstueck: listing.grundstueck || 0,
    aussenflaeche: listing.aussenflaeche || 0,
    familienScore: listing.familienScore || 0,
    barrierearm: !!listing.barrierearm,
    kartenposition: listing.kartenposition ? structuredClone(listing.kartenposition) : null,
    nutzung: angebot.nutzung || 'kapitalanlage',
    vermietet: listing.mietstatus.vermietet,
    kaltmiete: listing.mietstatus.vermietet ? listing.mietstatus.kaltmiete : 0,
    hausgeld: listing.hausgeld,
    laufendeKosten: listing.laufendeKosten ? structuredClone(listing.laufendeKosten) : null,
    faellig,
    // --- Phase 3 ---
    mieter: listing.mietstatus.vermietet ? bestandsMieter(listing.mietstatus.kaltmiete) : null,
    kappungFensterStart: state.monat,
    kappungBasis: listing.mietstatus.vermietet ? listing.mietstatus.kaltmiete : 0,
    vermietungsart: 'regulaer',
    moebliert: false,
    ruecklage: 0,
    ruecklageFaktor: 1,
    hausverwaltung: false,
    renovierung: null,   // {stufe, startMonat, endMonat, schaetzung}
    suche: null,         // aktive Bewerbersuche {niveau, modell, bewerber[], generiertMonat}
    wertBonus: 0,        // zusätzliche dauerhafte Wertaufschläge, z. B. Grundriss
    verkauf: null,       // Phase 4: {gestartetMonat, abschlussMonat, startSchaetzung}
    steuerBasisGebaeude: angebot.kaufpreis * gebaeudeAnteil(state, listing),
    darlehen: {
      ursprungsbetrag: angebot.darlehen,
      restschuld: angebot.darlehen,
      zins: angebot.zins,
      tilgungssatz: angebot.tilgungssatz,
      rate: angebot.rate,
      zinsbindungBis: state.monat + angebot.zinsbindungJahre * 12,
      sondertilgungJahr: state.config.zeit.startJahr,
      sondertilgungImJahr: 0,
    },
  };
  state.portfolio.push(objekt);
  state.log.push({
    monat: state.monat,
    text: `Gekauft: ${listing.titel} für ${Math.round(angebot.kaufpreis).toLocaleString('de-DE')} € ` +
      `(+ ${Math.round(angebot.nebenkosten.summe).toLocaleString('de-DE')} € Nebenkosten).`,
  });
  const stand = pruefstand(state, id);
  protokolliereWirkung(state, {
    typ: 'gekauft',
    titel: 'Kauf abgeschlossen',
    text: `${listing.titel}: ${stand.schritte}/3 Prüfungen, Tagesgeld ${Math.round(cashVorher).toLocaleString('de-DE')} € → ${Math.round(state.cash).toLocaleString('de-DE')} €, Objekt im Bestand.`,
    ziel: id,
    route: 'objekt',
  });
  return objekt;
}

// ---------------------------------------------------------------------------
// Monats-P&L eines Objekts (ECONOMY_MODEL §14, §17, §19) — von engine.tick
// genutzt. Reihenfolge fix (Determinismus): Renovierungsabschluss →
// Mieterverhalten → Geld (Miete, Bewirtschaftung, Annuität, fällige Kosten).
// Der zurückgegebene cashflow ist die liquide Cash-Änderung durch dieses
// Objekt; Rücklagenbeiträge verlassen Cash (aber bleiben Vermögen), aus der
// Rücklage bezahlte Reparaturen belasten Cash NICHT.
// ---------------------------------------------------------------------------

export function tickObjekt(state, objekt) {
  const bw = state.config.bewirtschaftung;
  let steuerInstandhaltung = 0;

  // 1. Renovierung abschließen? (RNG: Überziehung). Cash-Anteil der Überziehung.
  let reparaturCash = objekt.renovierung ? renovierungAbschluss(state, objekt) : 0;
  const imUmbau = !!objekt.renovierung; // läuft weiterhin, wenn noch nicht fertig

  // Eine laufende Mietersuche blockiert das Spiel nicht. Sobald ein neuer
  // Monat beginnt, wird im Hintergrund eine neue Runde erzeugt und landet im
  // gemeinsamen Benachrichtigungsarchiv.
  if (!imUmbau && !objekt.vermietet && objekt.suche && objekt.suche.generiertMonat <= state.monat) {
    neueBewerber(state, objekt);
    state.log.push({
      // tickObjekt rechnet den gerade zu Ende gehenden Monat. Die Meldung
      // erscheint deshalb im Folgemonat, den der Spieler nach dem Tick sieht.
      monat: state.monat + 1,
      ziel: objekt.listingId,
      aktion: 'bewerber',
      text: objekt.suche.bewerber.length
        ? `${objekt.titel}: ${objekt.suche.bewerber.length} neue passende Mietdossiers liegen vor.`
        : `${objekt.titel}: weiter leer; diesen Monat gab es kein passendes Mietdossier.`,
    });
  }

  // 2. Mieterverhalten (Zahlung, Pflege, Auszug) — nur vermietet, nicht im Umbau
  let ausfall = false;
  if (objekt.vermietet && objekt.mieter && !imUmbau) {
    ausfall = mieterMonat(state, objekt).ausfall;
  }

  // 3. Geld
  const vermietet = objekt.vermietet && !imUmbau;
  const miete = vermietet && !ausfall ? objekt.kaltmiete : 0;
  const laufendeKosten = fixkostenMonat(state, objekt, vermietet);
  const hausverwaltung = objekt.hausverwaltung && vermietet ? objekt.kaltmiete * bw.hausverwaltungProzent : 0;
  // Instandhaltungsbeitrag fließt in die Rücklage (verlässt Cash, bleibt Vermögen)
  const ruecklageBeitrag = instandhaltungMonat(state, objekt);
  objekt.ruecklage += ruecklageBeitrag;

  // Annuität
  const d = objekt.darlehen;
  let rate = 0;
  let zinsanteil = 0;
  if (d.restschuld > 0) {
    if (state.monat >= d.zinsbindungBis) {
      const ltv = d.restschuld / Math.max(1, fairerWert(state, objekt));
      const spread = spreadFuerLtv(state, Math.min(1, ltv)) ?? 0.01;
      d.zins = state.basiszins + spread;
      d.rate = (d.restschuld * (d.zins + d.tilgungssatz)) / 12;
      d.zinsbindungBis = state.monat + 120;
      state.log.push({
        monat: state.monat,
        text: `Anschlussfinanzierung ${objekt.titel}: neuer Zins ${(d.zins * 100).toFixed(2).replace('.', ',')} %, ` +
          `Rate ${Math.round(d.rate).toLocaleString('de-DE')} €/Monat.`,
      });
      meldeWartemoment(
        state,
        `${objekt.titel}: Zinsbindung beendet. Neue Rate ${Math.round(d.rate).toLocaleString('de-DE')} € — Zeit pausiert.`,
        objekt.listingId
      );
    }
    zinsanteil = (d.restschuld * d.zins) / 12;
    const tilgung = Math.min(d.rate - zinsanteil, d.restschuld);
    rate = zinsanteil + tilgung;
    d.restschuld -= tilgung;
    if (d.restschuld < 0.01) {
      d.restschuld = 0;
      state.log.push({ monat: state.monat, text: `${objekt.titel}: Darlehen vollständig getilgt.` });
      meldeWartemoment(state, `${objekt.titel}: Darlehen vollständig getilgt. Zeit pausiert.`, objekt.listingId);
    }
  }

  // 4. Fällige verborgene Mängel / Sonderumlagen (Rücklage zuerst)
  for (const f of objekt.faellig) {
    if (!f.bezahlt && state.monat >= f.monat) {
      f.bezahlt = true;
      steuerInstandhaltung += f.kosten;
      reparaturCash += entnimmRuecklage(objekt, f.kosten);
      state.log.push({
        monat: state.monat,
        text: `${objekt.titel}: ${f.name} — ${f.kosten.toLocaleString('de-DE')} €` +
          (f.ueberraschung ? ' (nicht entdeckt vor dem Kauf!)' : ''),
      });
      protokolliereWirkung(state, {
        typ: 'mangel-behoben',
        titel: 'Mangel behoben',
        text: `${objekt.titel}: ${f.name} erledigt; ${f.kosten.toLocaleString('de-DE')} € mit Rücklage/Tagesgeld finanziert.`,
        ziel: objekt.listingId,
        route: 'objekt',
      });
    }
  }

  return {
    miete, laufendeKosten, hausgeld: laufendeKosten, hausverwaltung, rate, zinsanteil,
    ruecklageBeitrag, reparaturCash, steuerInstandhaltung, imUmbau, ausfall,
    cashflow: miete - laufendeKosten - hausverwaltung - rate - ruecklageBeitrag - reparaturCash,
  };
}

