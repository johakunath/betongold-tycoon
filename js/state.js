// state.js — Spielzustand, Save-Slots (localStorage), JSON-Export/-Import, seeded RNG.
// Kein DOM-Zugriff auf Top-Level: das Modul läuft auch unter Node (Simulationstests).

import { DEFAULT_CONFIG, SAVE_VERSION, START_PRESETS } from './config.js?v=60';

// ---------------------------------------------------------------------------
// Seeded RNG (mulberry32). state.rngState treibt die allgemeine Spielwelt;
// state.etfRngState hält den exogenen ETF-Pfad von Spieleraktionen getrennt;
// state.lebensRngState würfelt einmalig den Lebenshorizont. Alle Ströme werden
// gespeichert, damit ein geladener Stand exakt weiterläuft.
// ---------------------------------------------------------------------------

function rngUint32Feld(state, feld) {
  let t = (state[feld] = (state[feld] + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (t ^ (t >>> 14)) >>> 0;
}

export function rngUint32(state) {
  return rngUint32Feld(state, 'rngState');
}

export function rngFloat(state) {
  return rngUint32(state) / 4294967296; // [0, 1)
}

// Getrennter Zufallsstrom für exogene Vergleichsreihen. Spieleraktionen dürfen
// insbesondere die ETF-Rendite desselben Seeds nicht verschieben.
export function rngFloatStrom(state, feld) {
  if (!Number.isFinite(state[feld])) throw new Error(`RNG-Strom fehlt: ${feld}`);
  return rngUint32Feld(state, feld) / 4294967296;
}

// Standardnormalverteilte Zufallszahl (Box-Muller). Zieht immer genau zwei
// Uniforms, damit der RNG-Verbrauch deterministisch bleibt.
export function rngNormal(state) {
  const u1 = 1 - rngFloat(state); // (0, 1] — vermeidet log(0)
  const u2 = rngFloat(state);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function rngNormalStrom(state, feld) {
  const u1 = 1 - rngFloatStrom(state, feld);
  const u2 = rngFloatStrom(state, feld);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Gewichtete Auswahl, z.B. Marktphase aus { boom: 0.3, ... }.
export function rngGewichtet(state, gewichte) {
  const summe = Object.values(gewichte).reduce((a, b) => a + b, 0);
  let r = rngFloat(state) * summe;
  for (const [schluessel, gewicht] of Object.entries(gewichte)) {
    r -= gewicht;
    if (r < 0) return schluessel;
  }
  return Object.keys(gewichte)[0];
}

// Text-Seed → uint32 (xmur3-Hash). Derselbe Text liefert immer denselben Run.
export function hashSeed(text) {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

// ---------------------------------------------------------------------------
// Neues Spiel
// ---------------------------------------------------------------------------

export function newGame({
  schwierigkeit = 'normal',
  startPreset = 'heute',
  startProfil = null,
  startAnpassung = null,
  seedText = '',
  seedWert = null,
} = {}) {
  const config = structuredClone(DEFAULT_CONFIG);
  const diff = config.schwierigkeiten[schwierigkeit];
  if (!diff) throw new Error(`Unbekannte Schwierigkeit: ${schwierigkeit}`);

  const preset = START_PRESETS[startPreset];
  const basis = startProfil || (() => {
    if (!preset) return null;
    const angepasst = structuredClone(preset);
    if (!startAnpassung) return angepasst;
    for (const feld of ['startAlter', 'cash', 'etf', 'kinder']) {
      if (startAnpassung[feld] !== undefined) angepasst[feld] = structuredClone(startAnpassung[feld]);
    }
    if (startAnpassung.haushalt) {
      angepasst.haushalt = { ...(angepasst.haushalt || {}), ...structuredClone(startAnpassung.haushalt) };
    }
    if (startAnpassung.kapital) {
      angepasst.kapital = { ...(angepasst.kapital || {}), ...structuredClone(startAnpassung.kapital) };
    }
    return angepasst;
  })();
  if (!basis) throw new Error(`Unbekanntes Startpreset: ${startPreset}`);
  const faktor = startProfil ? 1 : diff.kapitalFaktor;
  const profil = {
    id: basis.id || startPreset,
    label: basis.label,
    cash: Math.round(basis.cash * faktor),
    etf: Math.round((basis.etf || 0) * faktor),
    startAlter: basis.startAlter,
    kinder: structuredClone(basis.kinder),
    wohnort: basis.wohnort || 'berlin-rand',
    beruf: structuredClone(basis.beruf || null),
    haushalt: structuredClone(basis.haushalt || null),
    kapital: structuredClone(basis.kapital || null),
    kapitalsteuer: structuredClone(basis.kapitalsteuer || null),
    budget: structuredClone(basis.budget || null),
    renovierung: structuredClone(basis.renovierung || null),
    startbestand: structuredClone(basis.startbestand || []),
  };
  config.zeit.startAlter = profil.startAlter;
  config.haushalt.kinder = structuredClone(profil.kinder);
  config.haushalt.wohnort = profil.wohnort;
  if (profil.haushalt) Object.assign(config.haushalt, structuredClone(profil.haushalt));
  if (profil.kapital) Object.assign(config.kapital, structuredClone(profil.kapital));
  if (profil.kapitalsteuer) Object.assign(config.kapitalsteuer, structuredClone(profil.kapitalsteuer));
  if (profil.budget) Object.assign(config.budget, structuredClone(profil.budget));
  if (profil.renovierung) Object.assign(config.renovierung, structuredClone(profil.renovierung));
  const einkommensFaktor = diff.einkommensFaktor || 1;
  config.haushalt.nettoEinkommenPerson1 = Math.round(config.haushalt.nettoEinkommenPerson1 * einkommensFaktor);
  config.haushalt.nettoEinkommenPerson2 = Math.round(config.haushalt.nettoEinkommenPerson2 * einkommensFaktor);
  config.haushalt.nettoEinkommen = config.haushalt.nettoEinkommenPerson1 + config.haushalt.nettoEinkommenPerson2;

  const text = String(seedText || '').trim();
  const seed = Number.isFinite(seedWert)
    ? Number(seedWert) >>> 0
    : text
      ? hashSeed(text)
      : (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;

  const state = {
    saveVersion: SAVE_VERSION,
    erstellt: new Date().toISOString(),
    config,
    schwierigkeit,
    startPreset: profil.id,
    startProfil: profil,
    seedText: text,
    seed,
    rngState: seed,
    etfRngState: hashSeed(`etf:${seed}`),
    lebensRngState: hashSeed(`leben:${seed}`),

    monat: 0,            // gelebte Monate seit Start
    beendet: false,
    // Kumulativer Preisniveauindex, 1,0 = Euro des Spielstarts (preisniveau.js).
    preisniveau: 1,

    cash: profil.cash,
    letzterCashflow: 0,
    wohnort: profil.wohnort,
    einkommensRegionalfaktor: 1,
    ausstehenderEinkommensRegionalfaktor: null,

    // Tatsächlich gehaltenes Depot. Es läuft auf demselben exogenen
    // Renditepfad wie die Benchmark-Linie, kann aber für Eigenkapital verkauft
    // werden. Einstand und realisierte Gewinne werden für die Steuer getrennt.
    etfDepot: { wert: profil.etf, einstandGesamt: profil.etf },

    // Ein gemeinsamer Kalenderjahres-Freibetrag für Tagesgeld und ETF.
    kapitalsteuer: {
      jahr: config.zeit.startJahr,
      freibetragGenutzt: 0,
      steuernGesamt: 0,
      ertraegeBruttoGesamt: 0,
    },

    // Kontrafaktisches Depot: gleiches Startvermögen, gleiche monatliche
    // Sparrate — aber im Welt-ETF statt auf dem Tagesgeldkonto (Säule 4).
    etfVergleich: { wert: profil.cash + profil.etf },

    zeitbudget: { verfuegbar: config.budget.zeitProMonat, verbraucht: 0 },
    familienzufriedenheit: config.familie.startZufriedenheit,

    // --- Phase 2: Markt & Portfolio ---
    basiszins: config.kredit.basiszinsStart,
    markt: {
      // Preisindizes je Segment, Start 1,0 (ECONOMY_MODEL §7)
      indizes: Object.fromEntries(Object.keys(config.segmente).map((s) => [s, 1.0])),
      feed: {},              // listingId → Laufzeit-Zustand (Status, Preis-Aufschlag, Konkurrenz …)
      reihenfolge: [],       // seeded Erscheinungs-Reihenfolge (market.initialisiereMarkt)
      zeiger: 0,             // nächster Index in reihenfolge
      naechsteErscheinung: 0,
      initialisiert: false,  // main.js/Test rufen initialisiereMarkt(state) nach newGame/Load
    },
    portfolio: [],           // gekaufte Objekte inkl. Darlehen (finance.kaufeObjekt)
    startbestandInitialisiert: profil.startbestand.length === 0,
    favoriten: [],
    notizen: {},             // listingId → Text
    dd: {},                  // listingId → Due-Diligence-Stand
    maengelExistenz: {},     // listingId → pro Run gewürfelte Existenz verborgener Mängel
    dealEntscheidungen: {},  // listingId → aktuelle Wahl: beobachten oder verworfen
    entscheidungsHistorie: [], // strukturierte Anlass→Prüfung→Entscheidung→Wirkung-Momente
    turnaround: { bankAnpassungen: 0, baselineCashflow: null },
    entwicklung: {
      zielId: null,
      zielSeitMonat: 0,
      arbeitsmodellId: 'balance',
      arbeitsmodellSeitMonat: -config.entwicklung.arbeitsmodellBindungMonate,
      lebensphasenAngekundigt: [],
    },
    objektArcs: [],
    log: [],                 // [{monat, text}] — Anschlussfinanzierung, fällige Mängel …
    ratgeber: { letzterMonat: -10, gezeigt: [] }, // optionale Lernhinweise auf Leicht/Normal

    // --- Phase 3: Events ---
    aktivesEvent: null,      // {event, objektIndex} solange ein Dilemma offen ist → Zeit pausiert
    eventHistorie: {},       // eventId → letzter Feuer-Monat (Cooldown/einmalig)
    kinderEventsGezeigt: 0,  // Deckel: max 2 (config.events.maxKinderEvents)

    // --- Phase 4: Wohnen, Steuern, Endauswertung ---
    eigenheim: null,         // separat vom Mietportfolio, gleiche Objekt-/Darlehensstruktur
    steuer: {
      grenzsatz: config.steuer.grenzsatzDefault,
      verlustvortrag: 0,
      laufendesJahr: {
        jahr: config.zeit.startJahr,
        miete: 0,
        zinsen: 0,
        kosten: 0,
        afa: 0,
      },
      bescheide: [],
    },
    statistik: {
      zeitUeberzugSumme: 0,
      monateNegativCash: 0,
      familienSumme: config.familie.startZufriedenheit,
      monate: 0,
      eventsGesamt: 0,
    },
    lebensende: {
      zufallswert: 0,
      basisAlter: config.zeit.lebensendeMinAlter,
      stressIndex: 0,
      stressMalusJahre: 0,
      zielAlter: config.zeit.lebensendeMinAlter,
      verstorbenAlter: null,
      grund: null,
      rentenbeginnGeloggt: false,
    },
    adminPending: null,     // Phase 5: Configänderungen, wirksam zu Beginn des nächsten Ticks
    ruhestandsCheck: null,  // einmal zum Rentenbeginn: passives Einkommen vs. Rentenlücke
    adminVerlauf: [],       // [{monat, werte}] angewandte Einstellungsänderungen; Vergleichsläufe spielen sie nach

    // Verlauf für den Chart: ein Eintrag pro Monat, Eintrag 0 = Startzustand.
    historie: [],
  };

  // Ein eigener Strom hält Lebensdauer, Markt und ETF voneinander unabhängig.
  // Der eine gezogene Wert bleibt Teil des Save-Vertrags.
  state.lebensende.zufallswert = rngFloatStrom(state, 'lebensRngState');
  state.lebensende.basisAlter = config.zeit.lebensendeMinAlter +
    state.lebensende.zufallswert * (config.zeit.lebensendeMaxAlter - config.zeit.lebensendeMinAlter);
  state.lebensende.zielAlter = state.lebensende.basisAlter;

  // Marktphase pro Seed würfeln — versteckt bis zur Endauswertung.
  state.marktphase = rngGewichtet(state, config.marktphase.gewichte);

  state.historie.push({
    monat: 0,
    cash: state.cash,
    etfDepot: state.etfDepot.wert,
    nettovermoegen: state.cash + state.etfDepot.wert,
    etf: state.etfVergleich.wert,
    cashflow: 0,
    preisniveau: 1,
  });

  // Unveränderte Startannahmen: Vergleichsläufe der Endauswertung starten
  // hier statt bei der zuletzt gültigen Config (Events, Sparplan und
  // Einstellungen ändern sie im Lauf).
  state.startConfig = structuredClone(config);

  return state;
}

// ---------------------------------------------------------------------------
// Save-Slots (localStorage) + Export/Import.
// localStorage-Zugriffe sind gekapselt, damit Engine-Tests unter Node laufen.
// ---------------------------------------------------------------------------

const SLOT_PREFIX = 'betongold.save.';
export const AUTOSAVE_SLOT = 'autosave';

function storage() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

export function saveGame(state, slot) {
  const ls = storage();
  if (!ls) return false;
  const huelle = {
    saveVersion: state.saveVersion,
    gespeichert: new Date().toISOString(),
    state,
  };
  try {
    ls.setItem(SLOT_PREFIX + slot, JSON.stringify(huelle));
    return true;
  } catch (e) {
    console.error('Speichern fehlgeschlagen:', e);
    return false;
  }
}

export function loadGame(slot) {
  const ls = storage();
  if (!ls) return null;
  const roh = ls.getItem(SLOT_PREFIX + slot);
  if (!roh) return null;
  try {
    const state = requireCurrentSave(JSON.parse(roh)).state;
    validiereState(state);
    return state;
  } catch (e) {
    console.error(`Spielstand "${slot}" nicht lesbar:`, e);
    return null;
  }
}

export function deleteSave(slot) {
  const ls = storage();
  if (ls) ls.removeItem(SLOT_PREFIX + slot);
}

// Liste aller Slots mit Metadaten für den Lade-Dialog.
export function listSaves() {
  const ls = storage();
  if (!ls) return [];
  const slots = [];
  for (let i = 0; i < ls.length; i++) {
    const key = ls.key(i);
    if (!key || !key.startsWith(SLOT_PREFIX)) continue;
    const slot = key.slice(SLOT_PREFIX.length);
    try {
      const huelle = JSON.parse(ls.getItem(key));
      slots.push({
        slot,
        gespeichert: huelle.gespeichert,
        monat: huelle.state.monat,
        cash: huelle.state.cash,
        schwierigkeit: huelle.state.schwierigkeit,
        beendet: huelle.state.beendet,
      });
    } catch {
      slots.push({ slot, defekt: true });
    }
  }
  slots.sort((a, b) => String(b.gespeichert || '').localeCompare(String(a.gespeichert || '')));
  return slots;
}

// Export/Import als JSON-String — die UI macht daraus Datei-Download/-Upload.
export function exportString(state) {
  return JSON.stringify(
    { saveVersion: state.saveVersion, exportiert: new Date().toISOString(), state },
    null,
    2
  );
}

export function importString(json) {
  const huelle = JSON.parse(json);
  if (!huelle || typeof huelle !== 'object' || !huelle.state) {
    throw new Error('Kein Betongold-Spielstand (state fehlt).');
  }
  const state = requireCurrentSave(huelle).state;
  validiereState(state);
  return state;
}

// Vor dem Release sind Spielstände Wegwerf-Artefakte: Nur exakt die aktuelle
// SAVE_VERSION wird geladen. Bei Formatänderungen erhöhen wir die Version und
// lehnen ältere Stände bewusst ab, statt Migrationscode mitzuschleppen.
function requireCurrentSave(huelle) {
  const version = huelle?.saveVersion;
  const stateVersion = huelle?.state?.saveVersion;
  if (version === undefined || stateVersion === undefined) {
    throw new Error('saveVersion fehlt — Datei ist kein Spielstand.');
  }
  if (version !== SAVE_VERSION || stateVersion !== SAVE_VERSION) {
    throw new Error(
      `Spielstand-Version ${version}/${stateVersion} ist nicht kompatibel; benötigt wird Version ${SAVE_VERSION}.`
    );
  }
  return huelle;
}

// Aktuelle Saves werden strukturell geprüft. So scheitert
// ein beschädigter Import kontrolliert hier statt später mitten im UI-Render.
function validiereState(state) {
  if (!state || typeof state !== 'object') throw new Error('Spielzustand fehlt.');
  const zahlen = ['monat', 'cash', 'rngState', 'etfRngState', 'lebensRngState', 'familienzufriedenheit', 'einkommensRegionalfaktor', 'preisniveau'];
  for (const feld of zahlen) {
    if (!Number.isFinite(state[feld])) throw new Error(`Ungültiger Spielstand: ${feld} fehlt oder ist keine Zahl.`);
  }
  if (!state.config || typeof state.config !== 'object') throw new Error('Ungültiger Spielstand: config fehlt.');
  if (!state.markt || typeof state.markt !== 'object' || !state.markt.feed) {
    throw new Error('Ungültiger Spielstand: Marktstatus fehlt.');
  }
  for (const feld of ['portfolio', 'historie', 'log', 'favoriten', 'entscheidungsHistorie']) {
    if (!Array.isArray(state[feld])) throw new Error(`Ungültiger Spielstand: ${feld} ist keine Liste.`);
  }
  if (!state.dealEntscheidungen || typeof state.dealEntscheidungen !== 'object') {
    throw new Error('Ungültiger Spielstand: Deal-Entscheidungen fehlen.');
  }
  if (!state.etfVergleich || !Number.isFinite(state.etfVergleich.wert)) {
    throw new Error('Ungültiger Spielstand: ETF-Benchmark fehlt.');
  }
  if (!state.etfDepot || !Number.isFinite(state.etfDepot.wert) || state.etfDepot.wert < 0
      || !Number.isFinite(state.etfDepot.einstandGesamt) || state.etfDepot.einstandGesamt < 0) {
    throw new Error('Ungültiger Spielstand: ETF-Depot fehlt.');
  }
  if (!state.kapitalsteuer || !Number.isFinite(state.kapitalsteuer.freibetragGenutzt)
      || !Number.isFinite(state.kapitalsteuer.steuernGesamt)) {
    throw new Error('Ungültiger Spielstand: Kapitalsteuerstatus fehlt.');
  }
  if (typeof state.startbestandInitialisiert !== 'boolean') {
    throw new Error('Ungültiger Spielstand: Startbestand-Status fehlt.');
  }
  if (!state.startProfil || !Number.isFinite(state.startProfil.cash) ||
      !Number.isFinite(state.startProfil.etf) || !Array.isArray(state.startProfil.kinder)) {
    throw new Error('Ungültiger Spielstand: Startprofil fehlt.');
  }
  if (!state.steuer || !Number.isFinite(state.steuer.grenzsatz)) {
    throw new Error('Ungültiger Spielstand: Steuerstatus fehlt.');
  }
  if (!Number.isFinite(state.steuer.verlustvortrag) || typeof state.wohnort !== 'string'
      || (state.ausstehenderEinkommensRegionalfaktor !== null
        && !Number.isFinite(state.ausstehenderEinkommensRegionalfaktor))) {
    throw new Error('Ungültiger Spielstand: Wohnort- oder Verluststatus fehlt.');
  }
  if (!state.ratgeber || !Number.isFinite(state.ratgeber.letzterMonat) || !Array.isArray(state.ratgeber.gezeigt)) {
    throw new Error('Ungültiger Spielstand: Ratgeberstatus fehlt.');
  }
  if (!state.turnaround || !Number.isInteger(state.turnaround.bankAnpassungen)
      || state.turnaround.bankAnpassungen < 0
      || (state.turnaround.baselineCashflow !== null && !Number.isFinite(state.turnaround.baselineCashflow))) {
    throw new Error('Ungültiger Spielstand: Turnaround-Status fehlt.');
  }
  if (!state.entwicklung || !Array.isArray(state.entwicklung.lebensphasenAngekundigt)
      || !Number.isFinite(state.entwicklung.zielSeitMonat)
      || !Number.isFinite(state.entwicklung.arbeitsmodellSeitMonat)) {
    throw new Error('Ungültiger Spielstand: Entwicklungsplan fehlt.');
  }
  if (!Array.isArray(state.objektArcs)) {
    throw new Error('Ungültiger Spielstand: Objektgeschichten fehlen.');
  }
  if (!state.lebensende || !Number.isFinite(state.lebensende.zufallswert) ||
      !Number.isFinite(state.lebensende.basisAlter) || !Number.isFinite(state.lebensende.zielAlter)) {
    throw new Error('Ungültiger Spielstand: Lebensende-Modell fehlt.');
  }
  return true;
}

// Aus der Objekt-Rücklage entnehmen; gibt den ungedeckten Rest zurück, der aus
// Cash kommen muss. Mutiert NUR die Rücklage (kein Cash) — für Zahlungen im
// Tick, deren Cash-Anteil über den Immobilien-Cashflow verrechnet wird.
export function entnimmRuecklage(objekt, betrag) {
  if (!objekt || objekt.ruecklage <= 0) return betrag;
  const ausRuecklage = Math.min(objekt.ruecklage, betrag);
  objekt.ruecklage -= ausRuecklage;
  return betrag - ausRuecklage;
}

// Reparatur/Kosten sofort bezahlen: zuerst Rücklage, Rest aus Cash
// (ECONOMY_MODEL §19). Für Aktionen AUSSERHALB des Ticks (Renovierungsstart,
// Event-Auflösung). Cash darf negativ werden (→ Dispo-Zins im Tick).
export function zahleReparatur(state, objekt, betrag) {
  const ausCash = entnimmRuecklage(objekt, betrag);
  state.cash -= ausCash;
  return { ausRuecklage: betrag - ausCash, ausCash };
}

// Synthetischer Bestandsmieter für gekauft-vermietete Objekte (kein Dossier,
// aber solide Grundwerte). Auch von finance.kaufeObjekt genutzt.
export function bestandsMieter(kaltmiete) {
  return {
    id: 'bestand',
    name: 'Bestandsmieter/in',
    archetyp: 'Bestand',
    bestand: true,
    zahlungsmoral: 0.9,
    pflege: 0.85,
    bleibe: 0.82,
    konflikt: 0.15,
    zufriedenheit: 0,
    eingezogen: 0,
  };
}

