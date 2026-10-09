// market.js — Feed-Lifecycle, Preisformel, Segment-Drift, Verhandlung,
// Due Diligence. Formeln: ECONOMY_MODEL.md §7–8, §11, §13. DOM-frei.

import { rngFloat, rngNormal } from './state.js?v=61';
import { alleListings, getListing } from './content.js?v=61';
import { aktuellerBetrag, preisniveau } from './preisniveau.js?v=61';
import {
  oeffneDealEntscheidung, setzeDealEntscheidung,
} from './gameplay.js?v=61';

// ---------------------------------------------------------------------------
// Initialisierung: einmal pro Spielstand (nach newGame bzw. aktuellem Save-Import).
// Würfelt seeded: Mangel-Existenz je Listing, Erscheinungs-Reihenfolge, Start-Feed.
// ---------------------------------------------------------------------------

export function initialisiereMarkt(state) {
  const listings = alleListings();
  const eventFaktor = state.config.schwierigkeiten[state.schwierigkeit].eventFaktor;

  // Noch nicht initialisierte Inhaltsobjekte werden im aktuellen Save ergänzt.
  // Bereits verkaufte/reservierte Feed-Einträge bleiben dabei unangetastet.
  if (state.markt.initialisiert) {
    for (const segId of Object.keys(state.config.segmente)) {
      if (!Number.isFinite(state.markt.indizes[segId])) state.markt.indizes[segId] = 1;
    }
    const bekannte = new Set(state.markt.reihenfolge);
    const neu = listings.filter((l) => !bekannte.has(l.id));
    for (const l of neu) {
      state.maengelExistenz[l.id] = mangelExistenz(state, l, eventFaktor);
      state.markt.reihenfolge.push(l.id);
    }
    if (neu.length && state.markt.zeiger >= state.markt.reihenfolge.length - neu.length) {
      state.markt.naechsteErscheinung = Math.min(state.markt.naechsteErscheinung, state.monat + 1);
    }
    return;
  }

  // Existenz verborgener Mängel/Sonderumlagen in diesem Run (ECONOMY_MODEL §13)
  for (const l of listings) {
    state.maengelExistenz[l.id] = mangelExistenz(state, l, eventFaktor);
  }

  // Erscheinungs-Reihenfolge: seeded Fisher-Yates
  const ids = listings.map((l) => l.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rngFloat(state) * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  state.markt.reihenfolge = priorisiereStartverteilung(state, ids, listings);
  state.markt.zeiger = 0;

  // Start-Feed
  const anzahl = Math.min(state.config.feed.startAnzahl, ids.length);
  for (let i = 0; i < anzahl; i++) erscheine(state, state.markt.reihenfolge[state.markt.zeiger++]);
  state.markt.naechsteErscheinung = state.monat + naechstesIntervall(state);
  state.markt.initialisiert = true;
}

// Der 40er-Katalog startet nicht mit einer zufälligen regionalen Blase. Die
// bereits seeded gemischte Reihenfolge wird ohne weitere RNG-Ziehung so
// umgeordnet, dass jede Stadt, ein Haus und ein Sanierungsfall vertreten sind.
// Danach bleibt die Fisher-Yates-Reihenfolge aller übrigen IDs erhalten.
function priorisiereStartverteilung(state, ids, listings) {
  const startAnzahl = Math.min(state.config.feed.startAnzahl, ids.length);
  const listingById = new Map(listings.map((listing) => [listing.id, listing]));
  const rest = [...ids];
  const start = [];
  const nimmErstes = (passt) => {
    if (start.length >= startAnzahl) return;
    const index = rest.findIndex((id) => passt(listingById.get(id)));
    if (index >= 0) start.push(rest.splice(index, 1)[0]);
  };

  const staedte = [...new Set(Object.values(state.config.segmente).map((segment) => segment.stadt))];
  for (const stadt of staedte) {
    nimmErstes((listing) => state.config.segmente[listing.segment]?.stadt === stadt);
  }
  if (!start.some((id) => listingById.get(id).objektart === 'haus')) {
    nimmErstes((listing) => listing.objektart === 'haus');
  }
  if (!start.some((id) => listingById.get(id).zustand <= 2)) {
    nimmErstes((listing) => listing.zustand <= 2);
  }
  while (start.length < startAnzahl && rest.length) start.push(rest.shift());
  return [...start, ...rest];
}

function mangelExistenz(state, listing, eventFaktor) {
  return {
    maengel: (listing.maengel || []).map((m) => rngFloat(state) < Math.min(1, m.p * eventFaktor)),
    sonderumlage: listing.sonderumlage
      ? rngFloat(state) < Math.min(1, listing.sonderumlage.p * eventFaktor)
      : false,
  };
}

function naechstesIntervall(state) {
  return state.config.feed.intervallMonate + Math.floor(rngFloat(state) * 2);
}

function erscheine(state, id) {
  const f = state.config.feed;
  const alt = state.markt.feed[id];
  const listing = getListing(id);
  const laufzeit = f.laufzeitMin + Math.floor(rngFloat(state) * (f.laufzeitMax - f.laufzeitMin + 1));
  state.markt.feed[id] = {
    status: 'amMarkt',
    erschienen: state.monat,
    endet: state.monat + laufzeit,
    // Erfolglose Runden drücken den Aufschlag (Verkäufer wird realistischer)
    aufschlag: alt
      ? alt.aufschlag * state.config.bewertung.wiederkehrNachlass
      : listing.preisAufschlag,
    konkurrenz: rngFloat(state), // 0…1, angezeigt als Interessenten
    runden: alt ? alt.runden + 1 : 0,
    letztesGebotMonat: -1,
  };
  // Eine neue Marktrunde ist eine echte neue Chance (mit geringerem
  // Aufschlag), nicht dieselbe bereits verworfene Entscheidung.
  oeffneDealEntscheidung(state, id);
}

// ---------------------------------------------------------------------------
// Preisformel (ECONOMY_MODEL §8)
// ---------------------------------------------------------------------------

// Fairer Marktwert; funktioniert für Listings UND Portfolio-Objekte
// (braucht flaeche, segment, zustand, lageScore).
export function fairerWert(state, objekt) {
  const seg = state.config.segmente[objekt.segment];
  const b = state.config.bewertung;
  const istHaus = objekt.objektart === 'haus';
  const gebaeude = objekt.flaeche * seg.preisM2 * (istHaus ? b.hausPreisFaktor : 1);
  const grundstueck = istHaus
    ? (objekt.grundstueck || 0) * (b.grundstueckPreisM2?.[objekt.segment] || 0)
    : 0;
  return (
    (gebaeude + grundstueck) *
    state.markt.indizes[objekt.segment] *
    b.zustandsFaktor[objekt.zustand] *
    (b.lageBasis + objekt.lageScore * b.lageJePunkt) *
    (1 + (objekt.wertBonus || 0))
  );
}

export function angebotsPreis(state, id) {
  const eintrag = state.markt.feed[id];
  return fairerWert(state, getListing(id)) * eintrag.aufschlag;
}

// Vergleichsmiete (kalt, €/Monat): Segmentanker in Euro des Spielstarts,
// fortgeschrieben mit dem Preisniveau (ECONOMY_MODEL §1a, §15).
// Stammdaten (Baujahr, Stil) eines Listings oder eines daraus gekauften
// Objekts; ältere Objekte ohne diese Felder lesen sie aus dem Katalog.
export function stammdaten(objekt) {
  if (objekt?.baujahr !== undefined) return objekt;
  const listing = objekt?.listingId ? getListing(objekt.listingId) : null;
  return listing ? { ...listing, ...objekt, baujahr: listing.baujahr, stil: listing.stil } : objekt;
}

export function vergleichsmiete(state, listing) {
  const segment = state.config.segmente[listing.segment];
  const daten = stammdaten(listing);
  const istNeubau = daten.stil === 'neubau' || Number(daten.baujahr) >= 2020;
  const mieteM2 = istNeubau && Number.isFinite(segment.neubauMieteM2)
    ? segment.neubauMieteM2
    : segment.vergleichsmieteM2;
  return listing.flaeche * mieteM2 * preisniveau(state);
}

// Bestandsmiete eines vermieteten Angebots in laufenden Euro (Listingdaten
// stehen in Euro des Spielstarts).
export function angebotsBestandsmiete(state, listing) {
  return listing.mietstatus?.vermietet
    ? Math.round((Number(listing.mietstatus.kaltmiete) || 0) * preisniveau(state))
    : 0;
}

// Listings, die aktuell am Markt sind (für Feed-UI), inkl. Laufzeitdaten.
export function sichtbareListings(state) {
  return Object.entries(state.markt.feed)
    .filter(([, e]) => e.status === 'amMarkt' || e.status === 'reserviert')
    .map(([id, e]) => ({
      listing: getListing(id),
      eintrag: e,
      preis: angebotsPreis(state, id),
      monateAmMarkt: state.monat - e.erschienen,
    }));
}

// ---------------------------------------------------------------------------
// Monats-Tick: Indizes driften, Feed lebt (aus engine.tick aufgerufen)
// ---------------------------------------------------------------------------

export function tickMarkt(state) {
  const volFaktor = state.config.schwierigkeiten[state.schwierigkeit].volatilitaetsFaktor;

  // Segment-Indizes (feste Iterationsreihenfolge = Config-Reihenfolge → deterministisch)
  for (const [segId, seg] of Object.entries(state.config.segmente)) {
    const drift = seg.drift[state.marktphase] / 12;
    const rauschen = seg.sigmaMonat * volFaktor * rngNormal(state);
    state.markt.indizes[segId] = Math.max(0.2, state.markt.indizes[segId] * (1 + drift + rauschen));
  }

  if (!state.markt.initialisiert) return;
  const f = state.config.feed;

  // Abgelaufene Listings verschwinden, pausierte kehren zurück
  for (const [id, e] of Object.entries(state.markt.feed)) {
    if (e.status === 'amMarkt' && state.monat >= e.endet) {
      e.status = 'pausiert';
      e.wiederkehrAb =
        state.monat + f.wiederkehrMin + Math.floor(rngFloat(state) * (f.wiederkehrMax - f.wiederkehrMin + 1));
    } else if (e.status === 'pausiert' && state.monat >= e.wiederkehrAb) {
      erscheine(state, id);
    }
  }

  // Neue Listings erscheinen gestaffelt
  while (state.markt.zeiger < state.markt.reihenfolge.length && state.monat >= state.markt.naechsteErscheinung) {
    erscheine(state, state.markt.reihenfolge[state.markt.zeiger++]);
    state.markt.naechsteErscheinung = state.monat + naechstesIntervall(state);
  }
}

// ---------------------------------------------------------------------------
// Verhandlung (ECONOMY_MODEL §11)
// ---------------------------------------------------------------------------

export function annahmeChance(state, id, gebot) {
  const v = state.config.verhandlung;
  const e = state.markt.feed[id];
  const preis = angebotsPreis(state, id);
  const d = gebot / preis - 1;
  const p =
    v.basis +
    d * v.elastizitaet +
    Math.min(v.zeitBonusMax, (state.monat - e.erschienen) * v.zeitBonus) -
    e.konkurrenz * v.konkurrenzGewicht +
    v.phasenBonus[state.marktphase];
  return Math.max(v.minChance, Math.min(v.maxChance, p));
}

// Ein Gebot pro Objekt und Monat. Bei Annahme: Listing reserviert (Preis fix),
// Finanzierung muss folgen (finance.kaufeObjekt) oder abgebrochen werden.
export function gebotAbgeben(state, id, gebot) {
  const e = state.markt.feed[id];
  if (!e || e.status !== 'amMarkt') return { ok: false, grund: 'Nicht am Markt.' };
  if (e.letztesGebotMonat === state.monat) {
    return { ok: false, grund: 'Diesen Monat wurde hier schon verhandelt — der Verkäufer braucht Abstand.' };
  }
  e.letztesGebotMonat = state.monat;
  const chance = annahmeChance(state, id, gebot);
  if (rngFloat(state) < chance) {
    e.status = 'reserviert';
    e.reserviertPreis = gebot;
    oeffneDealEntscheidung(state, id);
    return { ok: true, angenommen: true };
  }
  return { ok: true, angenommen: false };
}

export function kaufAbbrechen(state, id) {
  const e = state.markt.feed[id];
  if (e && e.status === 'reserviert') {
    e.status = 'amMarkt';
    delete e.reserviertPreis;
    setzeDealEntscheidung(state, id, 'verworfen', angebotsPreis(state, id));
  }
}

export function angebotBeobachten(state, id) {
  const e = state.markt.feed[id];
  if (!e || e.status !== 'amMarkt') return { ok: false, grund: 'Nicht am Markt.' };
  if (!state.favoriten.includes(id)) state.favoriten.push(id);
  return { ok: true, entscheidung: setzeDealEntscheidung(state, id, 'beobachtet', angebotsPreis(state, id)) };
}

export function angebotVerwerfen(state, id) {
  const e = state.markt.feed[id];
  if (!e || (e.status !== 'amMarkt' && e.status !== 'reserviert')) {
    return { ok: false, grund: 'Nicht mehr entscheidbar.' };
  }
  if (e.status === 'reserviert') {
    e.status = 'amMarkt';
    delete e.reserviertPreis;
  }
  const favorit = state.favoriten.indexOf(id);
  if (favorit >= 0) state.favoriten.splice(favorit, 1);
  return { ok: true, entscheidung: setzeDealEntscheidung(state, id, 'verworfen', angebotsPreis(state, id)) };
}

export function angebotNeuPruefen(state, id) {
  oeffneDealEntscheidung(state, id);
}

// ---------------------------------------------------------------------------
// Due Diligence (ECONOMY_MODEL §13)
// ---------------------------------------------------------------------------

function ddEintrag(state, id) {
  if (!state.dd[id]) {
    state.dd[id] = {
      besichtigt: false,
      dokumente: false,
      gutachten: false,
      aufgedeckteMaengel: [],
      sonderumlageBekannt: false,
    };
  }
  return state.dd[id];
}

export function besichtigen(state, id) {
  const dd = ddEintrag(state, id);
  if (dd.besichtigt) return dd;
  dd.besichtigt = true;
  state.zeitbudget.verbraucht += state.config.dueDiligence.besichtigungZeit;
  return dd;
}

export function dokumenteAnfordern(state, id) {
  const dd = ddEintrag(state, id);
  if (dd.dokumente) return dd;
  dd.dokumente = true;
  state.zeitbudget.verbraucht += state.config.dueDiligence.dokumenteZeit;
  // Beschlossene Sonderumlagen stehen in den Protokollen — sicher aufgedeckt.
  if (state.maengelExistenz[id]?.sonderumlage) dd.sonderumlageBekannt = true;
  return dd;
}

export function gutachterBeauftragen(state, id) {
  const dd = ddEintrag(state, id);
  const kosten = Math.round(aktuellerBetrag(state, state.config.dueDiligence.gutachterKosten));
  if (dd.gutachten) return { dd };
  if (state.cash < kosten) return { dd, fehler: 'Nicht genug Cash für den Gutachter.' };
  dd.gutachten = true;
  dd.gutachtenKosten = kosten;
  state.cash -= kosten;
  state.zeitbudget.verbraucht += state.config.dueDiligence.gutachterZeit;
  // Jeder existierende Mangel wird unabhängig mit Trefferquote entdeckt.
  // Der RNG läuft über ALLE Mängel (auch nicht existierende), damit der
  // Verbrauch deterministisch bleibt.
  const listing = getListing(id);
  const existenz = state.maengelExistenz[id];
  (listing.maengel || []).forEach((m, i) => {
    const treffer = rngFloat(state) < state.config.dueDiligence.gutachterTrefferquote;
    if (existenz.maengel[i] && treffer && !dd.aufgedeckteMaengel.includes(i)) {
      dd.aufgedeckteMaengel.push(i);
    }
  });
  return { dd };
}

