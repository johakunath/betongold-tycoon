// Headless-Simulationstest — läuft unter Node, ohne Browser:
//   node test/simtest.mjs
// Prüft: voller Lebenslauf, Ruhestand, variables Lebensende, Plausibilität, Seed-Determinismus,
// Export/Import-Roundtrip mitten im Run, Schwierigkeiten, Phasenverteilung.
// Bei neuen Systemen (Phase 2+) hier Checks ergänzen.

import { readFile } from 'node:fs/promises';
import { SAVE_VERSION, DEFAULT_CONFIG } from '../js/config.js?v=61';
import { newGame, exportString, importString, rngFloat } from '../js/state.js?v=61';
import {
  advanceMonths, alterGenau, gesamtMonate, istImRuhestand,
  lebensendeVorschau, monatsWerte, nettovermoegen,
} from '../js/engine.js?v=61';
import { setzeInhalte, getListing, getTenant, getEvent } from '../js/content.js?v=61';
import {
  initialisiereMarkt, sichtbareListings, gebotAbgeben, fairerWert,
  besichtigen, dokumenteAnfordern, gutachterBeauftragen,
} from '../js/market.js?v=61';
import {
  finanzierungsCashflowVorschau, kreditAngebot, kaufeObjekt, restschuldNach, nebenkostenFuer,
  sondertilgen, sondertilgungRahmen, sondertilgungVorschau,
} from '../js/finance.js?v=61';
import {
  starteVermietung, neueBewerber, waehleBewerber, kannErhoehen, erhoeheMiete, marktmiete,
  mietrechtFuer, angesetzteMiete, vermietungsmodell, starteEigenbedarf, mietpreisbremse, mietspiegelMiete,
  senkeAufZulaessigeMiete,
  zahleEigenbedarfAbfindung,
} from '../js/tenants.js?v=61';
import { etfVerkaufVorschau, kaufeEtf, setzeSparplanEtfAnteil, verkaufeEtf } from '../js/etf.js?v=61';
import { renovierungsOptionen, starteRenovierung } from '../js/renovation.js?v=61';
import { optionWirkungen, resolveEvent } from '../js/events.js?v=61';
import { kaufeEigenheim, wohnortWechselVorschau } from '../js/eigenheim.js?v=61';
import { starteVerkauf } from '../js/verkauf.js?v=61';
import { zieheWartemomente } from '../js/signals.js?v=61';
import { leerstandsKosten } from '../js/ui/bewerber.js?v=61';
import { berechneEndauswertung } from '../js/endgame.js?v=61';
import { initialisiereStartbestand } from '../js/starter.js?v=61';
import {
  aktuelleAdminWerte, standardAdminWerte, wendeAdminWerteAn, planeAdminWerte,
} from '../js/admin.js?v=61';
import { kapitalertragVorschau, kapitalsteuerStatus } from '../js/kapitalsteuer.js?v=61';

const lade = async (name) =>
  JSON.parse(await readFile(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const listings = await lade('listings.json');
const tenants = await lade('tenants.json');
const events = await lade('events.json');
setzeInhalte({ listings, tenants, events });

// Auto-Resolver: löst Dilemma-Events mit Option 0 auf → kopfloser Durchlauf.
const auto = (st) => resolveEvent(st, 0);

const eur = (n) => Math.round(n).toLocaleString('de-DE') + ' €';
let fehler = 0;
const check = (ok, msg) => {
  console.log((ok ? 'OK  ' : 'FAIL') + ' ' + msg);
  if (!ok) fehler++;
};

// --- Voller Run, Seed "test", Normal -------------------------------------
const s = newGame({ schwierigkeit: 'normal', seedText: 'test' });
check(s.cash === 90000 && s.etfDepot.wert === 90000,
  'Default-Startlage = je 90.000 Tagesgeld und ETF');
check(['boom', 'seitwaerts', 'crash'].includes(s.marktphase), 'Marktphase gewürfelt: ' + s.marktphase);

const w0 = monatsWerte(s);
console.log(`     Monat 0: Einkommen ${eur(w0.einkommen)} + Kindergeld ${eur(w0.kindergeld)}, Miete ${eur(w0.miete)}, Leben ${eur(w0.lebenshaltung)}, Kinder ${eur(w0.kinder)} → Sparrate ${eur(w0.sparrate)}`);
check(w0.einkommen === 8300 && w0.kindergeld === 520 && w0.gesamteinkommen === 8820
  && w0.miete === 1970 && w0.lebenshaltung === 2590 && w0.reisen === 900
  && w0.auto === 0 && w0.kinder === 300 && w0.sparrate === 3960 && w0.etfEinzahlung === 1980
  && s.config.haushalt.ausgabenGesamtStart === 4860
  && s.config.haushalt.ausgabenOhneReisenStart === 3960
  && s.config.kapital.tagesgeldZins === 0.02,
  'Default-Haushalt: 8.300 Netto + 520 Kindergeld, 4.860 Ausgaben inkl. 900 Reisen, 3.960 Sparrate 50/50');
const autoProbe = newGame({ seedText: 'auto-mit-kind-zwei' });
autoProbe.monat = 4;
check(monatsWerte(autoProbe).auto === 0, 'Vor dem ersten Geburtstag von Kind 2 besteht noch kein Auto-Cashflow');
autoProbe.monat = 5;
check(monatsWerte(autoProbe).auto > 600,
  'Ab dem ersten Geburtstag von Kind 2 greift die fortgeschriebene 600-Euro-Autopauschale');
const kindergeldProbe = newGame({ seedText: 'kindergeld-bis-25' });
kindergeldProbe.monat = 258;
check(monatsWerte(kindergeldProbe).kindergeld === 260,
  'Kindergeld endet je Kind monatsscharf mit dem 25. Geburtstag');
kindergeldProbe.monat = 293;
check(monatsWerte(kindergeldProbe).kindergeld === 0,
  'Nach dem 25. Geburtstag beider Kinder fließt kein Kindergeld mehr');

check(gesamtMonate(s) === 720, 'Default-Kampagne besitzt eine harte Obergrenze von 720 Monaten (40 bis 100)');
advanceMonths(s, 10000, auto); // stoppt selbst am Ende (Events werden auto-aufgelöst)
check(s.beendet === true, 'Run endet (beendet=true)');
check(alterGenau(s) >= 90 && alterGenau(s) <= 100 && s.lebensende.grund === 'lebensende',
  'Lebensende liegt seed- und stressabhängig zwischen 90 und 100 Jahren');
check(s.historie.length === s.monat + 1, 'Historie enthält Startwert plus jeden gelebten Monat');
console.log(`     Endstand: Cash ${eur(s.cash)}, Nettovermögen ${eur(nettovermoegen(s))}, ETF-Benchmark ${eur(s.etfVergleich.wert)}`);
check(s.cash > -2000000 && s.cash < 10000000,
  'Nominaler Cash-Endstand des aktionslosen Langlaufs bleibt trotz Ruhestandslücke begrenzt');
check(s.etfVergleich.wert > 0, 'ETF-Wert > 0');
check(s.historie.every((h) => Number.isFinite(h.cash) && Number.isFinite(h.etf)), 'alle Historie-Werte endlich');
check(monatsWerte(s).kinder === 0 && monatsWerte(s).kindergeld === 0,
  'Kinder am Ende ausgezogen (Kosten und Kindergeld 0)');
check(s.kinderEventsGezeigt <= 2, `Kinder-Events gedeckelt (${s.kinderEventsGezeigt} ≤ 2)`);

// --- Determinismus: gleicher Seed, gleicher Run ---------------------------
const a = newGame({ seedText: 'test' });
const b = newGame({ seedText: 'test' });
advanceMonths(a, gesamtMonate(a), auto);
advanceMonths(b, gesamtMonate(b), auto);
check(a.etfVergleich.wert === b.etfVergleich.wert, 'Determinismus: gleicher Seed → identischer ETF-Pfad');
check(a.marktphase === b.marktphase, 'Determinismus: gleiche Marktphase');
check(a.familienzufriedenheit === b.familienzufriedenheit, 'Determinismus: gleiche Familienzufriedenheit');
check(a.monat === b.monat && a.lebensende.zielAlter === b.lebensende.zielAlter,
  'Determinismus: gleicher Seed → identisches Lebensende');

const c = newGame({ seedText: 'anders' });
advanceMonths(c, gesamtMonate(c), auto);
check(c.etfVergleich.wert !== a.etfVergleich.wert, 'anderer Seed → anderer Pfad');
check(c.lebensende.zufallswert !== a.lebensende.zufallswert, 'anderer Seed → anderer Lebenshorizont');

// Ruhestand ist eine Lebensphase statt Kampagnenende. Das Haushalts-Netto fällt
// auf den konfigurierten Anteil; Langzeitstress verkürzt nur innerhalb 90–100.
{
  const rente = newGame({ seedText: 'rentenwechsel' });
  rente.monat = (rente.config.zeit.rentenAlter - rente.config.zeit.startAlter) * 12 - 1;
  const vorher = monatsWerte(rente);
  rente.monat += 1;
  const danach = monatsWerte(rente);
  check(!rente.beendet && istImRuhestand(rente) && !vorher.imRuhestand && danach.imRuhestand
    && Math.abs(danach.einkommen - danach.erwerbsEinkommen * rente.config.haushalt.rentenNettoFaktor) < 0.001,
    'Ruhestand mit 67 senkt das Netto auf 55 %, beendet die Partie aber nicht');
  check(danach.lebenshaltungAltersFaktor === 0.8 && danach.reisenAltersFaktor === 0.75
    && danach.autoAltersFaktor === 0.65 && danach.einkommensAltersFaktor === 0.9,
    'Ruhestand nutzt getrennte transparente Altersfaktoren für Einkommen, Alltag, Reisen und Auto');

  const entspannt = newGame({ seedText: 'lebensstress' });
  const gestresst = newGame({ seedText: 'lebensstress' });
  entspannt.lebensende.zufallswert = 0.9;
  gestresst.lebensende.zufallswert = 0.9;
  gestresst.statistik.monate = 120;
  gestresst.statistik.zeitUeberzugSumme = 600;
  gestresst.statistik.monateNegativCash = 60;
  const ohneStress = lebensendeVorschau(entspannt);
  const mitStress = lebensendeVorschau(gestresst);
  check(mitStress.zielAlter < ohneStress.zielAlter && mitStress.zielAlter >= 90
    && mitStress.stressMalusJahre <= gestresst.config.zeit.stressMalusMaxJahre,
    'Langzeitstress zieht das Lebensende begrenzt vor, nie unter die Alters-Untergrenze');
}

// Spieleraktionen dürfen den exogenen ETF-Renditepfad nicht verschieben.
{
  const etfA = newGame({ seedText: 'etf-strom' });
  const etfB = newGame({ seedText: 'etf-strom' });
  for (let i = 0; i < 17; i++) rngFloat(etfB); // simuliert zusätzliche Aktions-RNG-Ziehungen
  advanceMonths(etfA, 24, auto);
  advanceMonths(etfB, 24, auto);
  check(etfA.etfVergleich.wert === etfB.etfVergleich.wert,
    'ETF-Zufallspfad bleibt unabhängig von Spieleraktionen');
}

// --- Determinismus über Save/Load-Grenze (rngState) -----------------------
const d = newGame({ seedText: 'test' });
advanceMonths(d, 100, auto);
const mitte = importString(exportString(d)); // Export → Import = Save/Load
advanceMonths(d, 248, auto);
advanceMonths(mitte, 248, auto);
check(d.etfVergleich.wert === mitte.etfVergleich.wert, 'Export/Import mittendrin → identische Fortsetzung');

// --- Import-Validierung ----------------------------------------------------
try {
  importString('{"quatsch": 1}');
  check(false, 'Import von Müll wird abgelehnt');
} catch {
  check(true, 'Import von Müll wird abgelehnt');
}
try {
  importString(JSON.stringify({ saveVersion: SAVE_VERSION, state: {} }));
  check(false, 'strukturell beschädigter aktueller Save wird abgelehnt');
} catch {
  check(true, 'strukturell beschädigter aktueller Save wird abgelehnt');
}

// --- Schwierigkeiten --------------------------------------------------------
const leicht = newGame({ schwierigkeit: 'leicht' });
const schwer = newGame({ schwierigkeit: 'schwer' });
check(leicht.cash === 103500 && leicht.etfDepot.wert === 103500,
  'Leicht skaliert beide Vermoegensteile auf 115 %');
check(schwer.cash === 72000 && schwer.etfDepot.wert === 72000,
  'Schwer skaliert beide Vermoegensteile auf 80 %');
check(monatsWerte(leicht).einkommen === 8715 && monatsWerte(schwer).einkommen === 7885,
  'Schwierigkeit skaliert Einkommen sichtbar um plus/minus 5 %');
const angepasst = newGame({
  startPreset: 'heute',
  startAnpassung: {
    startAlter: 42,
    cash: 123000,
    etf: 87000,
    kinder: [{ alter: 4.2 }],
    haushalt: {
      nettoEinkommenPerson1: 5000,
      nettoEinkommenPerson2: 2500,
      nettoEinkommen: 7500,
      miete: 2100,
    },
  },
});
check(angepasst.cash === 123000 && angepasst.etfDepot.wert === 87000
  && angepasst.config.zeit.startAlter === 42 && angepasst.config.haushalt.kinder[0].alter === 4.2
  && monatsWerte(angepasst).einkommen === 7500 && angepasst.config.haushalt.miete === 2100,
  'Startzahlen lassen sich vor einem neuen Spiel gezielt überschreiben');
const klassisch = newGame({ startPreset: 'klassisch' });
check(klassisch.cash === 35000 && klassisch.etfDepot.wert === 5000 && gesamtMonate(klassisch) === 840,
  'Klassisches Preset ist ein klar eigener 30-Jahre-Einstieg');
check(monatsWerte(klassisch).einkommen === 3200 && monatsWerte(klassisch).etfEinzahlung > 0
  && klassisch.config.haushalt.kinder.length === 0,
  'Klassisches Preset unterscheidet sich als begrenzter Single-Aufbau mit kleinem ETF-Sparplan');

// --- Besondere Startpresets ------------------------------------------------
{
  const schuldenA = newGame({ startPreset: 'schuldenberg', seedText: 'schulden-start' });
  initialisiereMarkt(schuldenA);
  const startA = initialisiereStartbestand(schuldenA);
  const schuldenB = newGame({ startPreset: 'schuldenberg', seedText: 'schulden-start' });
  initialisiereMarkt(schuldenB);
  initialisiereStartbestand(schuldenB);
  const restschuld = schuldenA.portfolio.reduce((summe, objekt) => summe + objekt.darlehen.restschuld, 0);
  const ltvWerte = schuldenA.portfolio.map((objekt) => objekt.darlehen.restschuld / fairerWert(schuldenA, objekt));
  check(startA.angewendet && schuldenA.portfolio.length === 5 && restschuld > 1_000_000
    && ltvWerte.every((ltv) => ltv >= 0.9299 && ltv <= 0.9701),
    'Schuldenberg-Preset startet mit fünf echten Mietobjekten und 93–97 % Finanzierungsquote');
  check(schuldenA.startbestandInitialisiert &&
    Math.abs(schuldenA.historie[0].nettovermoegen - nettovermoegen(schuldenA)) < 0.001 &&
    Math.abs(schuldenA.etfVergleich.wert - nettovermoegen(schuldenA)) < 0.001,
    'Startbestand aktualisiert Nettovermögen, Historie und ETF-Gegenfall konsistent');
  check(JSON.stringify(schuldenA.portfolio) === JSON.stringify(schuldenB.portfolio)
    && schuldenA.rngState === schuldenB.rngState,
    'Schuldenberg-Startbestand ist bei gleichem Seed deterministisch');
  advanceMonths(schuldenA, 1, auto);
  check(schuldenA.letzterImmoCashflow < 0,
    'Hoch verschuldeter Vielbestand erzeugt unmittelbar spürbaren negativen Immobilien-Cashflow');

  const handwerker = newGame({ startPreset: 'handwerker', seedText: 'handwerk-start' });
  const standard = newGame({ startPreset: 'klassisch', seedText: 'handwerk-vergleich' });
  initialisiereMarkt(handwerker);
  initialisiereMarkt(standard);
  const listing = getListing('le-02');
  const handOpt = renovierungsOptionen(handwerker, listing).find((option) => option.id === 'kosmetisch');
  const standardOpt = renovierungsOptionen(standard, listing).find((option) => option.id === 'kosmetisch');
  check(gesamtMonate(handwerker) === 996 && Math.round(monatsWerte(handwerker).einkommen) === 1100
    && handwerker.cash === 2500 && handwerker.config.haushalt.kinder.length === 0,
    'Handwerker-Azubi startet mit 17, geringem Einkommen, wenig Cash und langem Zeithorizont');
  check(handOpt.schaetzung === Math.round(standardOpt.schaetzung * 0.70)
    && handOpt.dauer === Math.ceil(standardOpt.dauer * 0.75)
    && handOpt.risikoProzent < standardOpt.risikoProzent,
    'Handwerksbonus senkt Renovierungskosten, Dauer und Überziehungsrisiko sichtbar');
  advanceMonths(handwerker, 37, auto);
  check(monatsWerte(handwerker).einkommensMeilenstein === 'Gesellenabschluss'
    && monatsWerte(handwerker).einkommen > 1900
    && handwerker.log.some((eintrag) => eintrag.text.includes('Gesellenabschluss')),
    'Azubi-Preset erhält nach drei Jahren transparent den automatischen Gesellenlohn');
}

// Das reale Depot folgt dem exogenen ETF-Pfad und kann vermoegensneutral in
// Tagesgeld umgeschichtet werden.
{
  const depot = newGame({ seedText: 'depot' });
  const vor = nettovermoegen(depot);
  const cashVor = depot.cash;
  const result = verkaufeEtf(depot, 20000);
  check(result.ok && depot.cash === cashVor + 20000 && depot.etfDepot.wert === 70000,
    'ETF-Verkauf verschiebt exakt ins Tagesgeld');
  check(nettovermoegen(depot) === vor, 'ETF-Verkauf laesst das Nettovermoegen unveraendert');
  const rueckkauf = kaufeEtf(depot, 12500);
  check(rueckkauf.ok && depot.cash === cashVor + 7500 && depot.etfDepot.wert === 82500,
    'ETF-Kauf verschiebt exakt vom Tagesgeld ins Depot');
  check(nettovermoegen(depot) === vor, 'ETF-Kauf laesst das Nettovermoegen unveraendert');
  const sparplan = setzeSparplanEtfAnteil(depot, 0.65);
  check(sparplan.ok && sparplan.geaendert && depot.config.haushalt.sparplanEtfAnteil === 0.65
    && Math.abs(monatsWerte(depot).etfEinzahlung - monatsWerte(depot).sparrate * 0.65) < 0.001,
  'ETF-Sparplan gilt fuer die kuenftige positive Haushaltssparrate');
  check(!kaufeEtf(depot, -1).ok && !setzeSparplanEtfAnteil(depot, 1.1).ok,
    'Ungueltige ETF-Buchungen und Sparplan-Anteile werden abgelehnt');

  const steuerDepot = newGame({ seedText: 'etf-steuer' });
  steuerDepot.etfDepot.wert = 100000;
  steuerDepot.etfDepot.einstandGesamt = 50000;
  steuerDepot.kapitalsteuer.freibetragGenutzt = 2000;
  const steuerVorschau = etfVerkaufVorschau(steuerDepot, 20000);
  const steuerNvVor = nettovermoegen(steuerDepot);
  const steuerVerkauf = verkaufeEtf(steuerDepot, 20000);
  check(Math.abs(steuerVorschau.gewinn - 10000) < 0.01
    && Math.abs(steuerVorschau.teilfreistellung - 3000) < 0.01
    && Math.abs(steuerVerkauf.steuer - 1846.25) < 0.01
    && Math.abs(nettovermoegen(steuerDepot) - (steuerNvVor - steuerVerkauf.steuer)) < 0.01,
  'ETF-Verkauf besteuert nur realisierten Gewinn nach 30 % Teilfreistellung und verbucht Netto-Liquidität');

  const freibetrag = newGame({ seedText: 'freibetrag' });
  const innerhalb = kapitalertragVorschau(freibetrag, 1500);
  freibetrag.monat = 12;
  const neuesJahr = kapitalsteuerStatus(freibetrag);
  check(innerhalb.steuer === 0 && innerhalb.freibetrag === 1500
    && neuesJahr.jahr === 2027 && neuesJahr.verbleibend === 2000
    && newGame({ startPreset: 'handwerker' }).config.kapitalsteuer.personen === 1,
  'Sparer-Pauschbetrag gilt je Person und wird pro Kalenderjahr neu bereitgestellt');

  const rendite = newGame({ seedText: 'depot-rendite' });
  const werte = monatsWerte(rendite);
  const depotStart = rendite.etfDepot.wert;
  const benchmarkStart = rendite.etfVergleich.wert;
  advanceMonths(rendite, 1, auto);
  const faktor = (rendite.etfDepot.wert - werte.etfEinzahlung) / depotStart;
  check(Math.abs(rendite.etfDepot.wert - (depotStart * faktor + werte.etfEinzahlung)) < 0.0001
    && Math.abs(rendite.etfVergleich.wert - (benchmarkStart * faktor + werte.etfSparrate)) < 0.0001,
  'Echtes Depot und Benchmark erleben dieselbe Monatsrendite; Sparraten bleiben getrennt');
}

{
  const regional = newGame();
  const berlin = mietrechtFuer(regional, { segment: 'berlin-rand' });
  const leipzig = mietrechtFuer(regional, { segment: 'leipzig' });
  const meissen = mietrechtFuer(regional, { segment: 'meissen-umland' });
  check(berlin.kappungProzent === 0.15 && leipzig.kappungProzent === 0.15
    && meissen.kappungProzent === 0.20
    && berlin.mieterhoehungUnzufriedenheit > leipzig.mieterhoehungUnzufriedenheit,
  'Berlin und Leipzig nutzen die reale 15-%-Kappung, Meißen die allgemeine 20-%-Grenze');

  // Mietpreisbremse (§ 556d BGB): Altbau in Berlin gedeckelt, Neubau,
  // umfassende Modernisierung und Meißen nicht.
  const altbau = { ...getListing('bi-02'), zustand: 3 };
  const bremse = mietpreisbremse(regional, altbau);
  const angesetzt = angesetzteMiete(regional, altbau, 'auf', 'regulaer');
  check(bremse.gilt && Math.abs(angesetzt - Math.round(bremse.obergrenze)) <= 1
    && angesetzt < marktmiete(regional, altbau),
    `Berliner Altbau: Neuvermietung höchstens Mietspiegel + 10 % (${angesetzt} € statt ${Math.round(marktmiete(regional, altbau))} €)`);
  check(!mietpreisbremse(regional, getListing('bi-03')).gilt
    && !mietpreisbremse(regional, { ...altbau, modernisierungM2: 1400 }).gilt
    && !mietpreisbremse(regional, getListing('me-07')).gilt,
    'Ausnahmen: Neubau ab 2015, umfassend modernisiert, Markt ohne Mietpreisbremse');
  check(mietpreisbremse(regional, { ...altbau, kaltmiete: 2000, vermietungsart: 'regulaer' }).obergrenze === 2000,
    'Höhere Vormiete bleibt bei der Neuvermietung zulässig');
}

// --- Marktphasen-Verteilung über viele Seeds -------------------------------
const zaehler = { boom: 0, seitwaerts: 0, crash: 0 };
for (let i = 0; i < 300; i++) zaehler[newGame({ seedText: 'seed' + i }).marktphase]++;
console.log(`     Phasenverteilung über 300 Seeds: boom ${zaehler.boom}, seitwärts ${zaehler.seitwaerts}, crash ${zaehler.crash}`);
check(zaehler.boom > 50 && zaehler.crash > 50 && zaehler.seitwaerts > 70, 'Phasenverteilung ~ Gewichte');

// ===========================================================================
// Phase 2: Markt, Kredit, Kauf
// ===========================================================================

check(listings.length === 40, `Content: ${listings.length} Listings (Ziel 40)`);
const segZahl = new Set(listings.map((l) => l.segment)).size;
check(segZahl === 4, 'Listings decken 4 Segmente ab');
check(listings.filter((l) => l.objektart === 'haus').length >= 4,
  'Familienmarkt enthält mindestens vier Häuser');
check(listings.every((l) => l.kartenposition && Number.isFinite(l.kartenposition.x)
  && Number.isFinite(l.kartenposition.y)), 'Alle Listings haben stabile Kartenpositionen');

// --- Kreditmathematik gegen geschlossene Formel -----------------------------
{
  const D = 100000, zins = 0.03, tilgung = 0.02;
  const rate = (D * (zins + tilgung)) / 12;
  const i = zins / 12, n = 120;
  const geschlossen = D * Math.pow(1 + i, n) - rate * ((Math.pow(1 + i, n) - 1) / i);
  const iterativ = restschuldNach(D, zins, rate, n);
  check(Math.abs(geschlossen - iterativ) < 1,
    `Annuität: Restschuld nach 10 J. iterativ ${Math.round(iterativ)} ≈ geschlossen ${Math.round(geschlossen)}`);
}

// --- Geskripteter Kauf: DD → Gebot → Kredit → Kauf → 24 Monate halten -------
const k = newGame({ schwierigkeit: 'leicht', seedText: 'kauftest' });
initialisiereMarkt(k);
check(k.markt.initialisiert && Object.keys(k.markt.feed).length >= 4, 'Markt initialisiert, Start-Feed da');

// Günstigstes vermietetes Listing am Markt finden (ggf. Monate vorspulen) —
// wie ein Spieler mit 80k EK, der nicht den Neubau in Mitte anfasst.
function guenstigstesVermietetes(s) {
  return sichtbareListings(s)
    .filter((x) => x.listing.mietstatus.vermietet && x.eintrag.status === 'amMarkt')
    .sort((a, b) => a.preis - b.preis)[0] || null;
}
let ziel = null;
for (let i = 0; i < 36 && !ziel; i++) {
  ziel = guenstigstesVermietetes(k);
  if (!ziel) advanceMonths(k, 1, auto);
}
check(!!ziel, `vermietetes Listing am Markt gefunden: ${ziel?.listing.id}`);

besichtigen(k, ziel.listing.id);
dokumenteAnfordern(k, ziel.listing.id);
gutachterBeauftragen(k, ziel.listing.id);
check(k.dd[ziel.listing.id].besichtigt && k.dd[ziel.listing.id].gutachten, 'Due Diligence verbucht');
check(k.zeitbudget.verbraucht >= 7, 'DD kostet Zeitbudget');

// Gebot leicht über Angebotspreis, bis der Verkäufer annimmt (seeded, endlich)
let angenommen = false;
for (let i = 0; i < 24 && !angenommen; i++) {
  const preis = fairerWert(k, ziel.listing) * k.markt.feed[ziel.listing.id].aufschlag;
  const r = gebotAbgeben(k, ziel.listing.id, preis * 1.03);
  if (r.ok && r.angenommen) angenommen = true;
  else advanceMonths(k, 1, auto);
}
check(angenommen, 'Gebot angenommen (Feed reserviert)');

const kaufpreis = k.markt.feed[ziel.listing.id].reserviertPreis;
const nk = nebenkostenFuer(k, ziel.listing, kaufpreis);
check(nk.summe > kaufpreis * 0.05, `Nebenkosten ${Math.round(nk.summe).toLocaleString('de-DE')} € > 5 %`);

const angebot = kreditAngebot(k, {
  listingId: ziel.listing.id,
  kaufpreis,
  eigenkapital: Math.min(k.cash, nk.summe + kaufpreis * 0.2),
  tilgungssatz: 0.02,
  zinsbindungJahre: 10,
});
check(angebot.zusage, `Kreditzusage (Rate ${Math.round(angebot.rate)} € ≤ Spielraum ${Math.round(angebot.spielraum)} €)`);
check(angebot.zins > 0.01 && angebot.zins < 0.09, `Sollzins plausibel: ${(angebot.zins * 100).toFixed(2)} %`);
const cashflowVorschau = finanzierungsCashflowVorschau(k, angebot);
check(cashflowVorschau
    && cashflowVorschau.aktuellerGesamtcashflow === k.letzterCashflow
    && Math.abs(cashflowVorschau.gesamtNachSteuer
      - (k.letzterCashflow + cashflowVorschau.aenderungNachSteuer)) < 0.001,
  'Finanzierungsvorschau verbindet aktuellen Gesamtcashflow mit der Wirkung nach Kauf');
check(Number.isFinite(cashflowVorschau.steuerMonat)
    && Math.abs(cashflowVorschau.gesamtNachSteuer
      - (cashflowVorschau.gesamtVorSteuer - cashflowVorschau.steuerMonat)) < 0.001
    && cashflowVorschau.rate === angebot.rate
    && Math.abs(cashflowVorschau.gesamtVorSteuer - (
      cashflowVorschau.aktuellerGesamtcashflow + cashflowVorschau.mieteinnahmen
      + cashflowVorschau.mietersparnis - cashflowVorschau.rate
      - cashflowVorschau.fixkosten - cashflowVorschau.ruecklage
      + cashflowVorschau.cashzinsAenderung
    )) < 0.001,
  'Cashflow-Brücke zeigt alle Positionen, exakte Summe und konservative Steuerschätzung ohne State-Mutation');

// Ablehnung mit Grund: absurd wenig EK
const ablehnung = kreditAngebot(k, {
  listingId: ziel.listing.id, kaufpreis, eigenkapital: 1000, tilgungssatz: 0.02, zinsbindungJahre: 10,
});
check(!ablehnung.zusage && ablehnung.gruende.length > 0, 'Ablehnung nennt Gründe (zu wenig EK)');

const cashVorher = k.cash;
kaufeObjekt(k, angebot);
check(k.portfolio.length === 1, 'Objekt im Portfolio');
check(k.entscheidungsHistorie.at(-1)?.typ === 'gekauft' && k.entscheidungsHistorie.at(-1).text.includes('Tagesgeld'),
  'Kauf erzeugt einen strukturierten Abschlussmoment mit Reservewirkung');
check(Math.abs(cashVorher - k.cash - angebot.eigenkapital) < 0.01, 'Kauf zieht genau das EK ab');
check(k.markt.feed[ziel.listing.id].status === 'verkauft', 'Listing als verkauft markiert');

{
  const sonderState = structuredClone(k);
  const sonderObjekt = sonderState.portfolio[0];
  sonderState.cash = 100000;
  const rahmen = sondertilgungRahmen(sonderState, sonderObjekt);
  const zielBetrag = Math.floor(Math.min(rahmen.verbleibend, 5000));
  const vorschau = sondertilgungVorschau(sonderState, sonderObjekt, zielBetrag);
  const cashVorSonder = sonderState.cash;
  const schuldVorSonder = sonderObjekt.darlehen.restschuld;
  const gebucht = sondertilgen(sonderState, sonderObjekt, zielBetrag);
  check(rahmen.max <= sonderObjekt.darlehen.ursprungsbetrag * 0.05 + 0.01
      && gebucht === vorschau.zahlung
      && sonderState.cash === cashVorSonder - gebucht
      && sonderObjekt.darlehen.restschuld === schuldVorSonder - gebucht
      && vorschau.laufzeitDanach < vorschau.laufzeitVorher,
    'Sondertilgung ist auf 5 % des Ursprungskredits begrenzt und verkürzt bei gleicher Rate die Laufzeit');
}

const restschuldStart = k.portfolio[0].darlehen.restschuld;
advanceMonths(k, 24, auto);
check(k.log.some((l) => l.ziel === k.portfolio[0].listingId && l.text.includes('Sondertilgung') && l.text.includes('noch möglich')),
  'Jahresbeginn erinnert je offenem Darlehen an die mögliche Sondertilgung');
check(k.letzterImmoCashflow !== 0, `Immobilien-Cashflow läuft: ${Math.round(k.letzterImmoCashflow)} €/Monat`);
check(k.portfolio[0].darlehen.restschuld < restschuldStart, 'Tilgung reduziert Restschuld');
const o0 = k.portfolio[0];
const nvErwartet = k.cash + k.etfDepot.wert + fairerWert(k, o0) - o0.darlehen.restschuld + o0.ruecklage;
check(Math.abs(nettovermoegen(k) - nvErwartet) < 0.01,
  'Nettovermoegen enthaelt Cash, ETF, Immobilienwert, Schuld und Ruecklage');
console.log(`     Nach 24 Monaten: Cash ${eur(k.cash)}, Nettovermögen ${eur(nettovermoegen(k))}, Restschuld ${eur(o0.darlehen.restschuld)}, Rücklage ${eur(o0.ruecklage)}`);

// Save-Roundtrip mit Portfolio, dann Anschlussfinanzierung
const klon = importString(exportString(k));
advanceMonths(k, 120, auto);
advanceMonths(klon, 120, auto);
check(
  k.etfVergleich.wert === klon.etfVergleich.wert &&
  k.cash === klon.cash &&
  k.portfolio[0].darlehen.restschuld === klon.portfolio[0].darlehen.restschuld,
  'Save-Roundtrip mit Portfolio → identische Fortsetzung');
check(k.log.some((l) => l.text.includes('Anschlussfinanzierung')), 'Anschlussfinanzierung nach Zinsbindung geloggt');

// --- Determinismus des kompletten Kauf-Szenarios ----------------------------
function kaufSzenario() {
  const s2 = newGame({ schwierigkeit: 'leicht', seedText: 'kauftest' });
  initialisiereMarkt(s2);
  let z = null;
  for (let i = 0; i < 36 && !z; i++) {
    z = guenstigstesVermietetes(s2);
    if (!z) advanceMonths(s2, 1, auto);
  }
  gutachterBeauftragen(s2, z.listing.id);
  for (let i = 0; i < 24; i++) {
    const preis = fairerWert(s2, z.listing) * s2.markt.feed[z.listing.id].aufschlag;
    const r = gebotAbgeben(s2, z.listing.id, preis * 1.03);
    if (r.ok && r.angenommen) break;
    advanceMonths(s2, 1, auto);
  }
  const p = s2.markt.feed[z.listing.id].reserviertPreis;
  const a = kreditAngebot(s2, {
    listingId: z.listing.id, kaufpreis: p,
    eigenkapital: Math.min(s2.cash, nebenkostenFuer(s2, z.listing, p).summe + p * 0.2),
    tilgungssatz: 0.02, zinsbindungJahre: 10,
  });
  kaufeObjekt(s2, a);
  advanceMonths(s2, 60, auto);
  return nettovermoegen(s2);
}
check(kaufSzenario() === kaufSzenario(), 'Determinismus: identisches Kauf-Szenario → identisches Nettovermögen');

// --- Vorab-Release: ältere Spielstände bewusst ablehnen ---------------------
{
  const alt = newGame({ seedText: 'alter-save' });
  alt.saveVersion = SAVE_VERSION - 1;
  try {
    importString(JSON.stringify({ saveVersion: SAVE_VERSION - 1, state: alt }));
    check(false, 'älterer Spielstand wird ohne Migration abgelehnt');
  } catch {
    check(true, 'älterer Spielstand wird ohne Migration abgelehnt');
  }
}

// --- Admin-Config: Whitelist, Skalierung, Clamp und Defaults ----------------
{
  const admin = newGame({ seedText: 'admin' });
  const werte = aktuelleAdminWerte(admin.config);
  werte['budget.zeitProMonat'] = 31;
  werte['kapital.etfRendite'] = 8;
  werte['events.maxKinderEvents'] = 99; // wird am Feld-Maximum geklemmt
  werte['haushalt.nettoEinkommenPerson1'] = 4400;
  const geaendert = wendeAdminWerteAn(admin, werte);
  check(geaendert === 4 && admin.config.budget.zeitProMonat === 31
    && admin.config.kapital.etfRendite === 0.08 && admin.config.events.maxKinderEvents === 6
    && admin.config.haushalt.nettoEinkommen === 8400,
    'Admin-Werte werden skaliert, geklemmt und whitelist-basiert angewandt');
  wendeAdminWerteAn(admin, standardAdminWerte());
  check(admin.config.budget.zeitProMonat === DEFAULT_CONFIG.budget.zeitProMonat
    && admin.config.kapital.etfRendite === DEFAULT_CONFIG.kapital.etfRendite
    && admin.config.haushalt.nettoEinkommen === DEFAULT_CONFIG.haushalt.nettoEinkommen,
    'Admin-Reset stellt die freigegebenen Standardwerte wieder her');
  try {
    wendeAdminWerteAn(admin, { 'budget.zeitProMonat': '' });
    check(false, 'Admin lehnt leere Werte ab');
  } catch {
    check(true, 'Admin lehnt leere Werte ab');
  }
  try {
    wendeAdminWerteAn(admin, {
      'zeit.lebensendeMinAlter': 99,
      'zeit.lebensendeMaxAlter': 90,
    });
    check(false, 'Admin lehnt ein umgedrehtes Lebensende-Fenster ab');
  } catch {
    check(admin.config.zeit.lebensendeMinAlter === 90 && admin.config.zeit.lebensendeMaxAlter === 100,
      'Admin lehnt ein umgedrehtes Lebensende-Fenster ohne Teilmutation ab');
  }
  const geplant = newGame({ seedText: 'admin-pending' });
  initialisiereMarkt(geplant);
  planeAdminWerte(geplant, { 'budget.zeitProMonat': 31 });
  check(geplant.config.budget.zeitProMonat === 20 && geplant.adminPending,
    'Admin-Änderung bleibt bis zum nächsten Tick vorgemerkt');
  advanceMonths(geplant, 1, auto);
  check(geplant.config.budget.zeitProMonat === 31 && geplant.adminPending === null,
    'Vorgemerkte Admin-Änderung greift exakt zum nächsten Tick');
}

// ===========================================================================
// Phase 3: Renovierung, Vermietung, Mieterhöhung, Events
// ===========================================================================

// Kauft das günstigste am Markt sichtbare, BEZAHLBARE Objekt, das pred erfüllt.
// Prüft die Bankzusage schon am Angebotspreis, damit kein unbezahlbares Objekt
// blockiert (ein leeres Objekt bringt keine Mietanrechnung).
function eigenkapitalFuer(state, listing, preis) {
  return Math.min(state.cash, nebenkostenFuer(state, listing, preis).summe + preis * 0.25);
}
function kaufeGuenstiges(state, pred) {
  for (let monat = 0; monat < 120; monat++) {
    const kandidaten = sichtbareListings(state)
      .filter((x) => x.eintrag.status === 'amMarkt' && pred(x.listing))
      .sort((a, b) => a.preis - b.preis);
    const z = kandidaten.find((x) => kreditAngebot(state, {
      listingId: x.listing.id, kaufpreis: x.preis,
      eigenkapital: eigenkapitalFuer(state, x.listing, x.preis),
      tilgungssatz: 0.02, zinsbindungJahre: 10,
    }).zusage);
    if (z) {
      let ok = false;
      for (let i = 0; i < 24 && !ok; i++) {
        if (state.markt.feed[z.listing.id].status !== 'amMarkt') break;
        const preis = fairerWert(state, z.listing) * state.markt.feed[z.listing.id].aufschlag;
        const r = gebotAbgeben(state, z.listing.id, preis * 1.05);
        if (r.ok && r.angenommen) ok = true;
        else advanceMonths(state, 1, auto);
      }
      if (!ok) continue; // Gebot kam nicht durch → weiter suchen
      const p = state.markt.feed[z.listing.id].reserviertPreis;
      const a = kreditAngebot(state, {
        listingId: z.listing.id, kaufpreis: p,
        eigenkapital: eigenkapitalFuer(state, z.listing, p),
        tilgungssatz: 0.02, zinsbindungJahre: 10,
      });
      if (a.zusage) return kaufeObjekt(state, a);
    }
    advanceMonths(state, 1, auto);
  }
  return null;
}

const p3 = newGame({ schwierigkeit: 'leicht', seedText: 'phase3' });
initialisiereMarkt(p3);
const leer = kaufeGuenstiges(p3, (l) => !l.mietstatus.vermietet);
check(leer && !leer.vermietet && leer.mieter === null, `leeres Objekt gekauft: ${leer?.listingId}`);

// --- Renovierung ------------------------------------------------------------
const zustandVor = leer.zustand;
const optionen = renovierungsOptionen(p3, leer);
check(optionen.length === 5 && optionen.every((o) => o.schaetzung > 0), 'fünf Renovierungsstufen (inkl. umfassender Modernisierung) mit Schätzung');
const cashVorReno = p3.cash;
starteRenovierung(p3, leer, 'kuecheBad');
check(leer.renovierung && p3.cash < cashVorReno, 'Renovierung gestartet, Schätzsumme fällig');
check(p3.entscheidungsHistorie.at(-1)?.typ === 'renovierung-gestartet' && p3.entscheidungsHistorie.at(-1).text.includes('→ Ziel'),
  'Renovierungsstart zeigt Zustand vorher und Ziel');
const dauer = p3.config.renovierung.stufen.kuecheBad.dauer;
advanceMonths(p3, dauer - 1, auto);
check(leer.renovierung !== null, 'Renovierung läuft bis zum letzten ausgewiesenen Monat');
advanceMonths(p3, 1);
check(leer.renovierung === null, 'Renovierung nach exakt der ausgewiesenen Dauer abgeschlossen');
check(leer.zustand >= 4 && leer.zustand > zustandVor, `Zustand gestiegen: ${zustandVor} → ${leer.zustand}`);
check(p3.entscheidungsHistorie.at(-1)?.typ === 'renovierung-fertig' && p3.entscheidungsHistorie.at(-1).text.includes('→'),
  'Renovierungsabschluss hält Vorher/Nachher-Wirkung fest');
const renoSignale = zieheWartemomente(p3);
check(renoSignale.length === 1 && renoSignale[0].text.includes('Zeit pausiert'),
  'Renovierungsabschluss erzeugt einen Fast-Forward-Stopp mit Benachrichtigung');
if (p3.aktivesEvent) resolveEvent(p3, 0);

// --- Vermietung -------------------------------------------------------------
const regulaerMiete = angesetzteMiete(p3, leer, 'auf', 'regulaer');
const moebliertMiete = angesetzteMiete(p3, leer, 'auf', 'moebliert');
const zeitMiete = angesetzteMiete(p3, leer, 'auf', 'wohnenAufZeit');
check(regulaerMiete < moebliertMiete && moebliertMiete < zeitMiete,
  'Vermietungswege staffeln Mietansatz transparent');
check(vermietungsmodell(p3, 'wohnenAufZeit').rechtsrisiko.berlin
  > vermietungsmodell(p3, 'wohnenAufZeit').rechtsrisiko.leipzig
  && vermietungsmodell(p3, 'wohnenAufZeit').rechtsrisiko.leipzig
  > vermietungsmodell(p3, 'wohnenAufZeit').rechtsrisiko.meissen,
  'Prüf-/Rückzahlungsrisiko ist in Berlin höher als in Leipzig und Meißen');
starteVermietung(p3, leer, 'unter', false);
check(leer.suche && leer.suche.bewerber.length >= 3, `Bewerberpool: ${leer.suche?.bewerber.length}`);
{
  const hintergrund = structuredClone(p3);
  const objekt = hintergrund.portfolio.find((eintrag) => eintrag.listingId === leer.listingId);
  const rngVor = hintergrund.rngState;
  advanceMonths(hintergrund, 2, auto);
  const meldungen = hintergrund.log.filter((eintrag) => eintrag.aktion === 'bewerber');
  check(objekt.suche.generiertMonat === hintergrund.monat - 1
      && meldungen.length === 2
      && hintergrund.rngState !== rngVor,
    'Aktive Mietersuche erzeugt pro Monatszug genau eine neue Runde samt Benachrichtigung');
}
const marktM = marktmiete(p3, leer);
check(leer.suche.miete < marktM, 'unter Marktmiete angesetzt');
const leerstand = leerstandsKosten(p3, leer);
check(leerstand.entgangeneMiete === leer.suche.miete && leerstand.laufendeZahlungen > 0
  && leerstand.liquiditaetsDruck === leerstand.entgangeneMiete + leerstand.laufendeZahlungen,
  'Bewerbermappe beziffert entgangene Miete und laufende Leerstandszahlungen');
waehleBewerber(p3, leer, leer.suche.bewerber[0].id);
check(leer.vermietet && leer.mieter && leer.kaltmiete > 0, `vermietet an ${leer.mieter?.name}`);
check(p3.entscheidungsHistorie.at(-1)?.typ === 'vermietet' && p3.entscheidungsHistorie.at(-1).text.includes('Leerstand →'),
  'Vermietung erzeugt einen strukturierten Abschlussmoment');
check(leer.suche === null, 'Suche nach Einzug beendet');

const ruecklageVor = leer.ruecklage;
advanceMonths(p3, 12, auto);
check(leer.ruecklage > ruecklageVor, `Rücklage wächst: ${eur(ruecklageVor)} → ${eur(leer.ruecklage)}`);

// --- Mieterhöhung (Kappung) -------------------------------------------------
if (leer.vermietet) {
  const mieteVor = leer.kaltmiete;
  if (kannErhoehen(p3, leer)) {
    erhoeheMiete(p3, leer);
    check(leer.kaltmiete > mieteVor && leer.kaltmiete <= leer.kappungBasis * 1.15 + 1,
      `Miete erhöht auf ${eur(leer.kaltmiete)} (gekappt)`);
  } else {
    check(true, 'Mieterhöhung aktuell nicht möglich (bereits am Limit)');
  }
}

// --- Eigenbedarf: Frist, möglicher Konflikt und Freigabe -------------------
if (leer.vermietet) {
  const vorgang = starteEigenbedarf(p3, leer, 'selbst');
  check([3, 6, 9].includes(vorgang.frist) && vorgang.auszugMonat === p3.monat + vorgang.frist,
    'Eigenbedarf setzt eine nach Mietdauer gestaffelte Kündigungsfrist');
  advanceMonths(p3, vorgang.frist, auto);
  if (leer.eigenbedarf?.status === 'klage') {
    const cashVorAbfindung = p3.cash;
    const abfindung = zahleEigenbedarfAbfindung(p3, leer);
    check(abfindung > 0 && p3.cash === cashVorAbfindung - abfindung,
      'Eigenbedarfs-Widerspruch kann sichtbar per Abfindung gelöst werden');
  }
  check(!leer.vermietet && leer.eigenbedarfFreigabe === 'selbst',
    'Abgeschlossener Eigenbedarf gibt das Objekt für den eigenen Einzug frei');
}

// ===========================================================================
// Phase 4: Eigenheim, Steuer, Verkauf, Endauswertung
// ===========================================================================

function kaufeGuenstigesEigenheim(state) {
  for (let monat = 0; monat < 120; monat++) {
    const kandidaten = sichtbareListings(state)
      .filter((x) => x.eintrag.status === 'amMarkt' && !x.listing.mietstatus.vermietet
        && x.listing.zimmer >= state.config.eigenheim.minZimmer)
      .sort((a, b) => a.preis - b.preis);
    for (const z of kandidaten) {
      const ek = eigenkapitalFuer(state, z.listing, z.preis);
      const probe = kreditAngebot(state, {
        listingId: z.listing.id, kaufpreis: z.preis, eigenkapital: ek,
        tilgungssatz: 0.01, zinsbindungJahre: 10, nutzung: 'eigenheim',
      });
      if (!probe.zusage) continue;
      const r = gebotAbgeben(state, z.listing.id, z.preis * 1.05);
      if (!r.ok || !r.angenommen) break;
      const p = state.markt.feed[z.listing.id].reserviertPreis;
      const a = kreditAngebot(state, {
        listingId: z.listing.id, kaufpreis: p,
        eigenkapital: eigenkapitalFuer(state, z.listing, p),
        tilgungssatz: 0.01, zinsbindungJahre: 10, nutzung: 'eigenheim',
      });
      if (a.zusage) return kaufeEigenheim(state, a);
    }
    advanceMonths(state, 1, auto);
  }
  return null;
}

{
  const p4 = newGame({ schwierigkeit: 'leicht', seedText: 'phase4-home' });
  initialisiereMarkt(p4);
  const zuKlein = listings.find((listing) => !listing.mietstatus.vermietet
    && listing.zimmer < p4.config.eigenheim.minZimmer);
  const zuKleinAngebot = kreditAngebot(p4, {
    listingId: zuKlein.id, kaufpreis: fairerWert(p4, zuKlein), eigenkapital: p4.cash,
    tilgungssatz: 0.01, zinsbindungJahre: 10, nutzung: 'eigenheim',
  });
  check(!zuKleinAngebot.zusage && zuKleinAngebot.gruende.some((grund) => grund.includes('weniger als')),
    'Zu kleine Wohnung wird sichtbar als Familien-Eigenheim abgelehnt');
  const familieVor = p4.familienzufriedenheit;
  const heim = kaufeGuenstigesEigenheim(p4);
  check(heim && p4.eigenheim === heim && p4.portfolio.length === 0, 'Eigenheim separat vom Mietportfolio gekauft');
  check(monatsWerte(p4).miete === 0, 'Eigenheim ersetzt die bisherige Wohnmiete');
  const wohnen = monatsWerte(p4);
  check(Math.abs(wohnen.etfSparrate - (wohnen.sparrate - wohnen.mieteVergleich)) < 1e-6,
    'ETF-Kontrafaktual rechnet trotz Eigenheim mit weiterlaufender Mietzahlung');
  check(p4.familienzufriedenheit > familieVor, 'Eigenheim hebt Familienzufriedenheit');
  const heimListing = getListing(heim.listingId);
  const regional = wohnortWechselVorschau(newGame({ startPreset: 'heute' }), heimListing);
  if (heimListing.segment !== 'berlin-rand') {
    check(p4.wohnort === heimListing.segment
        && Number.isFinite(p4.ausstehenderEinkommensRegionalfaktor)
        && p4.einkommensRegionalfaktor === 1,
      'Eigenheimumzug speichert den Wohnort und stellt die regionale Einkommensänderung für den Folgemonat bereit');
  } else {
    check(!regional.wechsel, 'Eigenheim am bisherigen Wohnort verändert das regionale Einkommen nicht');
  }
  const schuldVor = heim.darlehen.restschuld;
  advanceMonths(p4, 1, auto);
  check(heim.darlehen.restschuld < schuldVor && p4.letzterEigenheimCashflow < 0,
    'Eigenheim verbucht Rate, Eigentümerkosten und Tilgung');

  starteVerkauf(p4, heim);
  advanceMonths(p4, p4.config.verkauf.dauerMonate - 1, auto);
  check(!!p4.eigenheim, 'Eigenheim bleibt während der ersten fünf Verkaufsmonate im Bestand');
  advanceMonths(p4, 1, auto);
  check(p4.eigenheim === null && p4.log.some((l) => l.text.startsWith('Eigenheim:')),
    'Eigenheimverkauf schließt nach exakt sechs Monaten ab');
}

{
  const tax = newGame({ schwierigkeit: 'leicht', seedText: 'phase4-tax' });
  initialisiereMarkt(tax);
  const objekt = kaufeGuenstiges(tax, (l) => l.mietstatus.vermietet);
  const vorher = tax.steuer.bescheide.length;
  for (let i = 0; i < 12 && tax.steuer.bescheide.length === vorher; i++) advanceMonths(tax, 1, auto);
  const bescheid = tax.steuer.bescheide.at(-1);
  check(objekt && bescheid && bescheid.miete > 0 && bescheid.afa > 0,
    'Jahressteuerbescheid enthält Miete und AfA');
  check(Number.isFinite(bescheid.steuer)
      && Math.abs(bescheid.steuer - bescheid.ergebnis * bescheid.grenzsatz) < 0.01,
    'Jahressteuerbescheid besteuert Gewinne und schreibt verrechenbare Vermietungsverluste gut');
}

{
  const ende = newGame({ schwierigkeit: 'normal', seedText: 'phase4-endgame' });
  initialisiereMarkt(ende);
  advanceMonths(ende, gesamtMonate(ende), auto);
  const auswertung = berechneEndauswertung(ende);
  check(Object.values(auswertung.scores).every((n) => Number.isFinite(n) && n >= 0 && n <= 100),
    'fünf Endgame-Scores + Gesamtscore liegen in [0,100]');
  check(Object.values(auswertung.linien).every((l) => l.length === ende.historie.length),
    'Spieler, ETF, Eigenheim-first und Invest-first haben vollständige Vergleichslinien');
  check(
    JSON.stringify(auswertung.endwerte) === JSON.stringify(berechneEndauswertung(ende).endwerte),
    'Endgame-Kontrafaktuale sind bei gleichem Seed deterministisch');
}

// --- Events feuern & sind deterministisch -----------------------------------
{
  const e1 = newGame({ schwierigkeit: 'schwer', seedText: 'events' });
  initialisiereMarkt(e1);
  kaufeGuenstiges(e1, () => true);
  const e2 = importString(exportString(e1));
  advanceMonths(e1, 120, auto);
  advanceMonths(e2, 120, auto);
  check(Object.keys(e1.eventHistorie).length > 0, `Events sind gefeuert: ${Object.keys(e1.eventHistorie).length}`);
  check(
    e1.cash === e2.cash && e1.familienzufriedenheit === e2.familienzufriedenheit &&
    Object.keys(e1.eventHistorie).length === Object.keys(e2.eventHistorie).length,
    'Event-Auflösung ist deterministisch (Seed + Optionsfolge)');
  check(e1.familienzufriedenheit >= 0 && e1.familienzufriedenheit <= 100, 'Familienzufriedenheit in [0,100]');
}

// --- Preisniveau (ECONOMY_MODEL §1a) und faire Endauswertung ---------------
{
  const p = newGame({ seedText: 'preisniveau' });
  initialisiereMarkt(p);
  const listing = getListing('bi-01');
  const miete0 = marktmiete(p, { ...listing, zustand: 3 });
  advanceMonths(p, 120, auto);
  const erwartet = Math.pow(1 + p.config.preisniveau.inflation, 10);
  check(Math.abs(p.preisniveau - erwartet) < 1e-9 && Math.abs(p.historie[120].preisniveau - erwartet) < 1e-9,
    `Preisniveau nach 10 Jahren = ${erwartet.toFixed(4)} (2 % p.a.) und steht in der Historie`);
  check(Math.abs(marktmiete(p, { ...listing, zustand: 3 }) / miete0 - erwartet) < 1e-9,
    'Marktmieten laufen mit dem Preisniveau statt eingefroren zu bleiben');
  const geladen = importString(exportString(p));
  check(geladen.preisniveau === p.preisniveau, 'Preisniveau übersteht Export/Import');

  const ohneKauf = newGame({ seedText: 'score-ohne-kauf' });
  initialisiereMarkt(ohneKauf);
  advanceMonths(ohneKauf, 10000, auto);
  const ende = berechneEndauswertung(ohneKauf);
  const m85 = (85 - ohneKauf.config.zeit.startAlter) * 12;
  check(ende.ruhestand && ende.ruhestand.lueckeReal > 0
    && Math.abs(ende.scores.cashflow - Math.min(100, ende.ruhestand.passivReal / ende.ruhestand.lueckeReal * 100)) < 1e-6
    && Math.abs(ende.vermoegenBewertungReal - ohneKauf.historie[m85].nettovermoegen / ohneKauf.historie[m85].preisniveau) < 1e-6
    && Math.abs(ende.vermoegenZiel - 40 * 12 * (ohneKauf.startConfig.haushalt.nettoEinkommenPerson1 + ohneKauf.startConfig.haushalt.nettoEinkommenPerson2)) < 1e-6,
    'Scores: Rentenlücke zum Rentenbeginn, Vermögen mit 85 gegen 40 Start-Jahresnettos');
  check(ohneKauf.portfolio.length === 0 && ende.scores.cashflow > 0 && ende.entnahme > 0,
    `Ohne Mietobjekt erreicht der Cashflow-Score über die sichere Entnahme ${Math.round(ende.scores.cashflow)}/100`);
  check(Math.abs(ende.zerlegung.entscheidungen + ende.zerlegung.sparaufteilung - (ende.endwerte.spieler - ende.endwerte.etf)) < 1
    && Math.abs(ende.zerlegung.entscheidungen) < 1,
    'Zerlegung des ETF-Abstands summiert sich; ohne eigene Käufe liegt der Spieler auf der Ohne-Käufe-Linie');

  // Sparplanwechsel mitten im Lauf: Die Ohne-Käufe-Linie spielt ihn nach.
  const wechsel = newGame({ seedText: 'score-sparplan-wechsel' });
  initialisiereMarkt(wechsel);
  advanceMonths(wechsel, 120, auto);
  setzeSparplanEtfAnteil(wechsel, 1);
  advanceMonths(wechsel, 10000, auto);
  const wechselEnde = berechneEndauswertung(wechsel);
  check(wechsel.portfolio.length === 0 && Math.abs(wechselEnde.zerlegung.entscheidungen) < 1,
    'Ohne Käufe, aber mit Sparplanwechsel bleiben „eure Entscheidungen" bei 0 €');

  // Spätere Mietersuche und Renovierung rechnen in denselben laufenden Euro.
  const spaet = newGame({ seedText: 'preisniveau-spaet' });
  initialisiereMarkt(spaet);
  kaufeGuenstiges(spaet, () => true);
  advanceMonths(spaet, 360, auto);
  const objekt = spaet.portfolio[0];
  const reno = renovierungsOptionen(spaet, objekt).find((o) => o.moeglich !== false);
  const pn = spaet.preisniveau;
  const basis = objekt.flaeche * spaet.config.segmente[objekt.segment].vergleichsmieteM2;
  const istNeubau = objekt.stil === 'neubau' || Number(objekt.baujahr) >= 2020;
  check(istNeubau || !reno || Math.abs(reno.mieteDelta - Math.round(basis * pn *
    (spaet.config.mieter.zustandMietFaktor[reno.zielZustand] - spaet.config.mieter.zustandMietFaktor[objekt.zustand]))) <= 1,
    'Renovierungs-Mietplus läuft mit dem Preisniveau wie die Kosten');
  objekt.vermietet = false;
  objekt.mieter = null;
  objekt.suche = null;
  starteVermietung(spaet, objekt, 'auf', false);
  neueBewerber(spaet, objekt);
  const quoten = objekt.suche.bewerber.map((b) => b.einkommensquote).filter((q) => q != null);
  const quotenStart = objekt.suche.bewerber.map((b) => {
    const t = getTenant(b.id);
    return t?.nettoEinkommen ? (b.miete / pn) / t.nettoEinkommen : null;
  }).filter((q) => q != null);
  check(quoten.length > 0 && quoten.every((q, i) => Math.abs(q - quotenStart[i]) < 1e-9),
    'Einkommensquote der Bewerber vergleicht Miete und Einkommen im selben Preisniveau');
}

// --- Häuser: eigene Vergleichsmiete statt Wohnungs-Mietspiegel ------------
{
  const g = newGame({ seedText: 'haus-mietspiegel' });
  const fehlerHaus = [];
  for (const id of ['br-06', 'br-10', 'le-07', 'me-05']) {
    const haus = { ...getListing(id) };
    const alsWohnung = { ...haus, objektart: 'wohnung' };
    const stadt = g.config.segmente[haus.segment].stadt;
    const faktor = mietspiegelMiete(g, haus) / mietspiegelMiete(g, alsWohnung);
    if (Math.abs(faktor - g.config.mietrecht[stadt].hausFaktor) > 1e-9 || faktor <= 1) fehlerHaus.push(`${id}: ${faktor}`);
  }
  check(fehlerHaus.length === 0, `Häuser bekommen den städtischen Hauszuschlag auf den Mietspiegel (${fehlerHaus.join(', ') || 'Berlin/Meißen 1,10, Leipzig 1,22'})`);
  const br06 = { ...getListing('br-06') };
  check(mietpreisbremse(g, br06).obergrenze > mietpreisbremse(g, { ...br06, objektart: 'wohnung' }).obergrenze,
    'Mietpreisbremse eines Berliner Hauses liegt über der Grenze einer gleich großen Wohnung');
}

// --- Bewusster Verstoß gegen die Mietpreisbremse ----------------------------
{
  const vermieteIllegal = (seed, ruegeMonat) => {
    const g = newGame({ seedText: seed });
    initialisiereMarkt(g);
    g.config.mietpreisbremse.verstoss.ruegeMonat = { berlin: ruegeMonat, leipzig: ruegeMonat };
    g.config.mietpreisbremse.verstoss.bussgeldMonat = { berlin: 0, leipzig: 0 };
    // Zufallsereignisse aus, damit kein Event die Miete im selben Monat verändert.
    g.config.events.eventChanceBasis = 0;
    g.config.events.eventChanceJeObjekt = 0;
    kaufeGuenstiges(g, (l) => l.segment.startsWith('berlin') && !l.mietstatus.vermietet && Number(l.baujahr) < 2015);
    const o = g.portfolio[0];
    o.renovierung = null;
    o.vermietet = false;
    o.mieter = null;
    o.kaltmiete = 0;
    starteVermietung(g, o, 'auf', 'regulaer', { bremseIgnorieren: true });
    if (!o.suche.bewerber.length) neueBewerber(g, o);
    waehleBewerber(g, o, o.suche.bewerber[0].id);
    return { g, o };
  };
  const { g: legalG, o: legalO } = (() => {
    const g = newGame({ seedText: 'bremse-legal' });
    initialisiereMarkt(g);
    kaufeGuenstiges(g, (l) => l.segment.startsWith('berlin') && !l.mietstatus.vermietet && Number(l.baujahr) < 2015);
    return { g, o: g.portfolio[0] };
  })();
  check(legalO && mietpreisbremse(legalG, { ...legalO, kaltmiete: 0 }).gilt, 'Testobjekt liegt unter der Mietpreisbremse');

  const { g: a, o: oa } = vermieteIllegal('bremse-ruege', 0);
  check(oa.bremseVerstoss && oa.kaltmiete > oa.bremseVerstoss.zulaessig,
    `Ignorierte Bremse: ${oa.kaltmiete} € statt zulässig ${oa.bremseVerstoss?.zulaessig} €`);
  check(mietpreisbremse(a, oa).obergrenze < oa.kaltmiete, 'Eine unzulässige Vormiete schützt bei der nächsten Vermietung nicht');
  // 12 Monate ohne Rüge, dann sicher rügen lassen: Erstattung seit Mietbeginn.
  for (let i = 0; i < 12; i++) advanceMonths(a, 1, auto);
  const mehr = oa.bremseVerstoss.mehrerloes;
  a.config.mietpreisbremse.verstoss.ruegeMonat = { berlin: 1, leipzig: 1 };
  const cashVor = a.cash;
  const zulaessig = oa.bremseVerstoss.zulaessig;
  if (oa.mieter) {
    const vorRuege = oa.kaltmiete - zulaessig;
    advanceMonths(a, 1, auto);
    check(oa.bremseVerstoss.geruegt && oa.kaltmiete === zulaessig
      && Math.abs(oa.bremseVerstoss.rueckzahlung - Math.round(mehr + vorRuege)) <= 1
      && oa.bremseVerstoss.kosten > oa.bremseVerstoss.rueckzahlung,
      `Rüge nach 13 Monaten: ${oa.bremseVerstoss.rueckzahlung} € Rückzahlung seit Mietbeginn plus Anwaltskosten, Miete auf ${zulaessig} €`);
    check(a.cash < cashVor, 'Rückzahlung belastet das Tagesgeld');
  }

  const { g: b, o: ob } = vermieteIllegal('bremse-spaet', 0);
  b.config.mieter.auszugBasisRisiko = 0;
  for (let i = 0; i < 31; i++) advanceMonths(b, 1, auto);
  b.config.mietpreisbremse.verstoss.ruegeMonat = { berlin: 1, leipzig: 1 };
  advanceMonths(b, 1, auto);
  check(!ob.mieter || (ob.bremseVerstoss.geruegt && ob.bremseVerstoss.rueckzahlung === 0),
    'Rüge nach 30 Monaten: keine Rückzahlung, nur Mietsenkung');

  const { g: c, o: oc } = vermieteIllegal('bremse-ausstieg', 0);
  c.config.mieter.auszugBasisRisiko = 0;
  advanceMonths(c, 6, auto);
  const aufgelaufen = oc.bremseVerstoss.mehrerloes;
  check(senkeAufZulaessigeMiete(c, oc) && oc.kaltmiete === oc.bremseVerstoss.zulaessig, 'Freiwilliger Ausstieg senkt die Miete');
  advanceMonths(c, 6, auto);
  check(oc.bremseVerstoss.mehrerloes === aufgelaufen, 'Nach dem Ausstieg läuft kein weiterer Mehrerlös auf');
  advanceMonths(c, 25, auto);
  check(!oc.mieter || oc.bremseVerstoss.beendet, 'Nach Ablauf der 30-Monats-Frist ist ein bereinigter Verstoß erledigt');

  const { g: d, o: od } = vermieteIllegal('bremse-sofort', 0);
  senkeAufZulaessigeMiete(d, od);
  advanceMonths(d, 1, auto);
  check(!od.mieter || od.bremseVerstoss.beendet, 'Sofortiger Ausstieg ohne Mehrerlös: kein Rüge-Risiko mehr');
}

// --- Entnahmeregel statt Dispo-Falle ----------------------------------------
{
  const lauf = (aktiv) => {
    const g = newGame({ seedText: 'balance-1' });
    initialisiereMarkt(g);
    setzeSparplanEtfAnteil(g, 1);
    kaufeEtf(g, g.cash - 30000);
    g.config.kapital.entnahme.aktiv = aktiv;
    advanceMonths(g, 10000, auto);
    return g;
  };
  const mitRegel = lauf(true);
  const ohneRegel = lauf(false);
  check(mitRegel.statistik.monateNegativCash === 0 && ohneRegel.statistik.monateNegativCash > 100,
    `Entnahmeregel verhindert die Dispo-Falle bei 100 % ETF (${mitRegel.statistik.monateNegativCash} statt ${ohneRegel.statistik.monateNegativCash} Dispo-Monate)`);
}

// --- Eigenbedarf trifft Mieter, nicht Eigentümer ---------------------------
{
  const mieter = newGame({ seedText: 'eigenbedarf-mieter' });
  initialisiereMarkt(mieter);
  const mieteVor = mieter.config.haushalt.miete;
  mieter.aktivesEvent = { eventId: 'eigenbedarf-vermieter', objektIndex: -1, monat: 0 };
  resolveEvent(mieter, 0);
  check(mieter.config.haushalt.miete === Math.round(mieteVor * 1.15) && mieter.config.eigenheim.familieNeutralBonus === 0,
    'Eigenbedarf erhöht die Familienmiete per neuem Vertrag; Eigentum hat keinen pauschalen Familien-Dauerbonus');
}

// --- Haushaltsbedingungen der Events (Kindesalter, Auto, Ruhestand) ---------
{
  const verstoesse = [];
  let kindEvents = 0;
  let autoEvents = 0;
  for (let i = 0; i < 24; i++) {
    for (const startPreset of ['heute', 'klassisch']) {
      const g = newGame({ schwierigkeit: 'schwer', startPreset, seedText: `event-bedingung-${i}` });
      initialisiereMarkt(g);
      const h = g.config.haushalt;
      const rente = (g.config.zeit.rentenAlter - g.config.zeit.startAlter) * 12;
      const kindAlter = (m) => h.kinder.map((k) => k.alter + m / 12).filter((a) => a < h.auszugsAlter);
      while (!g.beendet && g.monat < 420) {
        if (g.portfolio.length === 0) kaufeGuenstiges(g, () => true);
        advanceMonths(g, 1, (s) => {
          const id = s.aktivesEvent.eventId;
          const m = s.monat;
          const alter = kindAlter(m);
          if (id === 'kind-zahnspange' && !alter.some((a) => a >= 9 && a <= 15)) verstoesse.push(`${id}@${m}`);
          if (id === 'kind-klassenfahrt' && !alter.some((a) => a >= 12 && a <= 18)) verstoesse.push(`${id}@${m}`);
          if (id === 'elternzeit' && (!alter.some((a) => a <= 12) || m >= rente)) verstoesse.push(`${id}@${m}`);
          if (id === 'job-angebot' && m >= rente) verstoesse.push(`${id}@${m}`);
          if (id === 'auto-kaputt' && !((h.autoKostenMonat || 0) > 0 && m >= h.autoAbMonat)) verstoesse.push(`${id}@${m}`);
          if (id.startsWith('kind-')) kindEvents++;
          if (id === 'auto-kaputt') autoEvents++;
          resolveEvent(s, 0);
        });
      }
    }
  }
  check(verstoesse.length === 0 && kindEvents > 0 && autoEvents > 0,
    `Kinder-, Auto- und Erwerbs-Events respektieren den Haushalt (${kindEvents} Kinder-, ${autoEvents} Auto-Events; Verstöße: ${verstoesse.slice(0, 4).join(', ') || 'keine'})`);
}

// Ruhestands- und Eigenheim-Events respektieren ihre Haushaltsbedingung;
// das Stundungs-Arc kommt nach sechs Monaten zurück.
{
  const verstoesse = [];
  const gesehen = new Set();
  for (let i = 0; i < 16; i++) {
    const g = newGame({ schwierigkeit: 'schwer', seedText: `content-pack-${i}` });
    initialisiereMarkt(g);
    const rente = (g.config.zeit.rentenAlter - g.config.zeit.startAlter) * 12;
    if (i % 2 === 0) kaufeGuenstigesEigenheim(g);
    while (!g.beendet && g.monat < 720) {
      if (g.portfolio.length === 0 && g.monat < 400) kaufeGuenstiges(g, () => true);
      advanceMonths(g, 1, (st) => {
        const ev = getEvent(st.aktivesEvent.eventId);
        gesehen.add(ev.id);
        const b = ev.bedingung || {};
        if (b.nachRuhestand && st.monat < rente) verstoesse.push(`${ev.id}@${st.monat}`);
        if (b.mitEigenheim && !st.eigenheim) verstoesse.push(`${ev.id}@${st.monat}`);
        resolveEvent(st, 0);
      });
    }
  }
  const neu = ['familie-umzugshilfe', 'bad-barrierearm', 'reise-ruhestand', 'heizung-eigenheim',
    'grundsteuer-bescheid', 'untervermietung'];
  const fehlend = neu.filter((id) => !gesehen.has(id));
  check(verstoesse.length === 0 && fehlend.length === 0,
    `Content-Paket: Ruhestands-/Eigenheim-Bedingungen eingehalten (fehlend: ${fehlend.join(', ') || 'keine'}; Verstöße: ${verstoesse.slice(0, 3).join(', ') || 'keine'})`);

  // Stundung: 900 € Mietausfall direkt aus dem Tagesgeld (Rücklage bleibt),
  // nach sechs Monaten kommt die Rückzahlung als Arc – nur beim selben Mieter.
  const stundung = (seed) => {
    const g = newGame({ seedText: seed });
    initialisiereMarkt(g);
    g.config.events.eventChanceBasis = 0;
    g.config.events.eventChanceJeObjekt = 0;
    g.config.mieter.auszugBasisRisiko = 0;
    kaufeGuenstiges(g, (l) => l.mietstatus.vermietet);
    const o = g.portfolio[0];
    o.ruecklage = 5000;
    g.aktivesEvent = { eventId: 'mieter-jobverlust', objektIndex: 0, monat: g.monat };
    const cashVor = g.cash;
    resolveEvent(g, 0);
    return { g, o, ausfall: cashVor - g.cash };
  };
  const { g, o, ausfall } = stundung('stundung-arc');
  g.config.preisniveau.inflation = 0.5; // starke Teuerung: die Rückzahlung bleibt trotzdem nominal gleich
  const ruecklageNachher = o.ruecklage;
  for (let m = 0; m < 6 && !g.aktivesEvent; m++) advanceMonths(g, 1, () => {});
  const faellig = g.aktivesEvent?.eventId === 'arc-stundung-rueckzahlung';
  const cashArc = g.cash;
  const chip = faellig ? optionWirkungen(g, getEvent('arc-stundung-rueckzahlung').optionen[0], o)[0]?.text : '';
  if (faellig) resolveEvent(g, 0);
  check(o.mieter && ausfall === 900 && ruecklageNachher === 5000 && faellig && g.cash - cashArc === ausfall
    && chip === `+${ausfall.toLocaleString('de-DE')} € Rückzahlung`,
    `Stundung: ${ausfall} € Mietausfall aus dem Tagesgeld, Rücklage unberührt, nach sechs Monaten Rückzahlung von genau ${g.cash - cashArc} €`);

  const { g: g2, o: o2 } = stundung('stundung-nachmieter');
  o2.mieter = { ...o2.mieter, id: 'nachmieter', eingezogen: g2.monat + 1 };
  for (let m = 0; m < 8; m++) advanceMonths(g2, 1, () => {});
  const arc2 = g2.objektArcs.find((a) => a.typ === 'stundung');
  check(!g2.aktivesEvent && arc2?.status === 'beendet',
    'Stundungs-Arc endet still, wenn bis zur Fälligkeit ein anderer Mieter eingezogen ist');
}

// Wirkungs-Chips: zeigen die Effekte einer Option vor der Wahl, im laufenden Preisniveau.
{
  const g = newGame({ seedText: 'chips' });
  const jobverlust = getEvent('mieter-jobverlust');
  const texte = (opt) => optionWirkungen(g, opt).map((w) => `${w.ton}:${w.text}`);
  const stundung = texte(jobverlust.optionen[0]);
  const aufhebung = texte(jobverlust.optionen[2]);
  g.preisniveau = 1.5;
  const spaeter = texte(getEvent('erbschaft-klein').optionen[0]);
  check(stundung.join('|') === 'minus:−900 € Mietausfall|plus:Mieter zufriedener|neutral:Folge in 6 Monaten'
    && aufhebung.includes('minus:Mieter zieht aus')
    && spaeter.join('|') === 'plus:+13.500 €|minus:Familie −2'
    && texte({ effekt: {} }).join('') === 'neutral:keine direkte Wirkung'
    && optionWirkungen(g, { effekt: { zustand: 1 } }, { zustand: 5 }).every((w) => !w.text.startsWith('Zustand'))
    && optionWirkungen(g, { effekt: { zustand: -1 } }, { zustand: 1 }).every((w) => !w.text.startsWith('Zustand'))
    && optionWirkungen(g, { effekt: { zustand: 2 } }, { zustand: 4 })[0].text === 'Zustand +1'
    && optionWirkungen(g, { effekt: { sondertilgung: 5000 } }, { darlehen: { restschuld: 1200 } })[0].text === 'Sondertilgung 1.200 €'
    && optionWirkungen(g, { effekt: { sondertilgung: 5000 } }, { darlehen: { restschuld: 0 } })[0].text === 'keine direkte Wirkung'
    && optionWirkungen(g, { effekt: { sondertilgung: 5000 } }, { darlehen: null })[0].text === 'keine direkte Wirkung'
    && optionWirkungen({ ...g, familienzufriedenheit: 99 }, { effekt: { familie: 4 } }, null)[0].text === 'Familie +1'
    && optionWirkungen({ ...g, familienzufriedenheit: 0 }, { effekt: { familie: -2 } }, null)[0].text === 'keine direkte Wirkung'
    && optionWirkungen(g, { effekt: { mieterZufriedenheit: 0.3, auszug: true } }, { zustand: 3, mieter: null })[0].text === 'keine direkte Wirkung'
    && optionWirkungen(g, getEvent('hitzewelle').optionen[2], { zustand: 3, mieter: {} }).map((w) => w.text).join('|') === 'Mieter unzufriedener'
    && optionWirkungen(g, { effekt: { mieterZufriedenheit: 0.2, mieterKonflikt: 0.2 } }, { zustand: 3, mieter: {} })[0].text === 'keine direkte Wirkung',
  `Wirkungs-Chips: ${stundung.join(', ')} · später ${spaeter.join(', ')}`);
}

// Auto-Altersfaktor 0 % entfernt das Auto auch für Events.
{
  let autoEvents = 0;
  let monateMitAuto = 0;
  for (let i = 0; i < 12; i++) {
    const g = newGame({ schwierigkeit: 'schwer', seedText: `ohne-auto-${i}` });
    initialisiereMarkt(g);
    g.config.haushalt.autoAltersFaktoren.forEach((stufe) => { stufe.faktor = 0; });
    while (!g.beendet && g.monat < 420) {
      advanceMonths(g, 1, (st) => {
        if (st.aktivesEvent.eventId === 'auto-kaputt') autoEvents++;
        resolveEvent(st, 0);
      });
      if (monatsWerte(g).auto > 0) monateMitAuto++;
    }
  }
  check(autoEvents === 0 && monateMitAuto === 0, `Auto-Faktor 0 %: keine Autokosten und kein Auto-Event (${autoEvents})`);
}

console.log(fehler === 0 ? '\nALLE TESTS OK' : `\n${fehler} FEHLER`);
process.exit(fehler === 0 ? 0 : 1);

