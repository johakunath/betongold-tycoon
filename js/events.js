// events.js — Dilemma-Events: monatlicher Roll (feste RNG-Position im Tick)
// und Auflösung ohne RNG. Formeln: ECONOMY_MODEL §18. DOM-frei.

import { rngFloat, zahleReparatur } from './state.js?v=52';
import { alleEvents, getEvent } from './content.js?v=52';
import { planeObjektArc, schliesseAktivenArc } from './arcs.js?v=52';

function kalendermonat(state) {
  return ((state.config.zeit.startMonat - 1 + state.monat) % 12) + 1;
}
function jahreszeit(state) {
  const m = kalendermonat(state);
  if (m === 12 || m <= 2) return 'winter';
  if (m >= 6 && m <= 8) return 'sommer';
  return 'uebergang';
}

// Passt ein Event gerade? (Bedingungen aus dem Schema, CONTENT_SCHEMA)
function passendeObjekte(state, ev) {
  const b = ev.bedingung || {};
  return state.portfolio.filter((o) => {
    if (o.renovierung) return false;               // im Umbau kein Objekt-Event
    if (b.vermietet && !(o.vermietet && o.mieter)) return false;
    if (b.zustandMax != null && o.zustand > b.zustandMax) return false;
    return true;
  });
}

function istErfuellbar(state, ev) {
  const b = ev.bedingung || {};
  if (b.nurArc) return false;
  if (ev.kategorie === 'auftakt') return false; // deterministische Auftaktmomente, kein Zufallspool
  const hist = state.eventHistorie[ev.id];
  if (b.einmalig && hist !== undefined) return false;
  if (b.cooldownMonate && hist !== undefined && state.monat - hist < b.cooldownMonate) return false;
  if (ev.kategorie === 'kind' && state.kinderEventsGezeigt >= state.config.events.maxKinderEvents) return false;
  if (b.jahreszeit && b.jahreszeit !== jahreszeit(state)) return false;

  const brauchtObjekt = b.brauchtObjekt || ev.kategorie === 'objekt' || ev.kategorie === 'mieter';
  if (brauchtObjekt && passendeObjekte(state, ev).length === 0) return false;
  return true;
}

// Gewichtete Auswahl aus einer Liste [{gewicht}] mit einem rngFloat.
function ziehe(state, liste, gewicht) {
  const summe = liste.reduce((s, x) => s + gewicht(x), 0);
  if (summe <= 0) return null;
  let r = rngFloat(state) * summe;
  for (const x of liste) {
    r -= gewicht(x);
    if (r < 0) return x;
  }
  return liste[liste.length - 1];
}

function objektExposure(state, objekt) {
  const bw = state.config.bewirtschaftung;
  const verwaltung = objekt.hausverwaltung ? bw.hausverwaltungEventDaempfung : 1;
  const energie = bw.energieEventFaktor[objekt.energieklasse] ?? 1;
  return verwaltung * energie;
}

// Monatlicher Event-Roll. Setzt bei Treffer state.aktivesEvent und stoppt so
// die Zeit (advanceMonths bricht ab). Feste Position im Tick → deterministisch.
export function rolleEvent(state) {
  if (state.aktivesEvent || state.beendet) return;
  const cfg = state.config.events;
  const eventFaktor = state.config.schwierigkeiten[state.schwierigkeit].eventFaktor;
  const exposure = state.portfolio.reduce((summe, objekt) => summe + objektExposure(state, objekt), 0);
  const p = Math.min(
    cfg.eventChanceMax,
    (cfg.eventChanceBasis + cfg.eventChanceJeObjekt * exposure) * eventFaktor
  );
  if (rngFloat(state) >= p) return;

  const kandidaten = alleEvents().filter((e) => istErfuellbar(state, e));
  if (kandidaten.length === 0) return;

  const ev = ziehe(state, kandidaten, (e) => e.gewicht ?? 1);
  if (!ev) return;

  // Zielobjekt bestimmen (falls objektbezogen), Hausverwaltung dämpft Exposure.
  let objektIndex = -1;
  const brauchtObjekt = ev.bedingung?.brauchtObjekt || ev.kategorie === 'objekt' || ev.kategorie === 'mieter';
  if (brauchtObjekt) {
    const passend = passendeObjekte(state, ev);
    const ziel = ziehe(state, passend, (o) => objektExposure(state, o));
    if (!ziel) return;
    objektIndex = state.portfolio.indexOf(ziel);
  }

  state.aktivesEvent = { eventId: ev.id, objektIndex, monat: state.monat };
  state.eventHistorie[ev.id] = state.monat;
  state.statistik.eventsGesamt = (state.statistik.eventsGesamt || 0) + 1;
  if (ev.kategorie === 'kind') state.kinderEventsGezeigt += 1;
}

// Deterministische Auftaktmomente: Der sonst ereignisarme Spielbeginn vor dem
// ersten Objektkauf (eventChanceBasis ist bewusst niedrig) bekommt drei
// terminierte, wirkungslose Orientierungsmomente. Sie verbrauchen KEINEN
// seeded RNG und verändern weder Cash noch State — deshalb bleiben alle
// 300-Seed-Balancegates identisch. Läuft NACH rolleEvent, damit dessen
// RNG-Roll unverändert an seiner festen Tick-Position bleibt.
export function rolleAuftakt(state) {
  if (state.aktivesEvent || state.beendet) return;
  if (state.portfolio.length > 0 || state.eigenheim) return; // nur bis zum ersten eigenen Objekt
  const faellig = alleEvents()
    .filter((e) => e.kategorie === 'auftakt'
      && state.eventHistorie[e.id] === undefined
      && state.monat >= (e.bedingung?.auftaktMonat ?? 0))
    .sort((a, b) => (a.bedingung?.auftaktMonat ?? 0) - (b.bedingung?.auftaktMonat ?? 0));
  const ev = faellig[0];
  if (!ev) return;
  state.aktivesEvent = { eventId: ev.id, objektIndex: -1, monat: state.monat };
  state.eventHistorie[ev.id] = state.monat;
}

// Auflösung einer Option (ohne RNG → reproduzierbar bei fixer Optionsfolge).
export function resolveEvent(state, optionIndex) {
  const aktiv = state.aktivesEvent;
  if (!aktiv) return null;
  const ev = getEvent(aktiv.eventId);
  const opt = ev.optionen[optionIndex] || ev.optionen[0];
  const objekt = aktiv.objektIndex >= 0 ? state.portfolio[aktiv.objektIndex] : null;
  const eff = opt.effekt || {};

  if (aktiv.arcId) schliesseAktivenArc(state, aktiv.arcId);

  if (typeof eff.cash === 'number') {
    if (eff.cash < 0) zahleReparatur(state, objekt, -eff.cash);
    else state.cash += eff.cash;
  }
  if (typeof eff.ruecklage === 'number' && objekt) {
    objekt.ruecklage = Math.max(0, objekt.ruecklage + eff.ruecklage);
  }
  if (typeof eff.sondertilgung === 'number' && objekt?.darlehen) {
    const betrag = Math.min(objekt.darlehen.restschuld, Math.max(0, eff.sondertilgung));
    state.cash -= betrag;
    objekt.darlehen.restschuld -= betrag;
    if (objekt.darlehen.restschuld <= 0) objekt.darlehen.rate = 0;
  }
  if (typeof eff.zustand === 'number' && objekt) {
    objekt.zustand = Math.max(1, Math.min(5, objekt.zustand + eff.zustand));
  }
  if (typeof eff.miete === 'number' && objekt) {
    objekt.kaltmiete = Math.max(0, objekt.kaltmiete + eff.miete);
  }
  if (objekt && objekt.mieter) {
    if (typeof eff.mieterZufriedenheit === 'number') objekt.mieter.zufriedenheit += eff.mieterZufriedenheit;
    if (typeof eff.mieterKonflikt === 'number') objekt.mieter.zufriedenheit -= eff.mieterKonflikt;
    if (eff.auszug) {
      state.log.push({ monat: state.monat, text: `${objekt.titel}: ${objekt.mieter.name} kündigt.` });
      objekt.vermietet = false;
      objekt.mieter = null;
    }
  }
  if (typeof eff.familie === 'number') {
    const familienEffekt = ev.kategorie === 'kind' && state.eigenheim && eff.familie < 0
      ? eff.familie * state.config.eigenheim.kinderEventMalusFaktor
      : eff.familie;
    state.familienzufriedenheit = Math.max(0, Math.min(100, state.familienzufriedenheit + familienEffekt));
  }
  if (opt.arc && objekt) planeObjektArc(state, objekt, opt.arc);

  state.log.push({
    monat: state.monat,
    text: `${ev.titel}: ${opt.text}${opt.folge ? ' — ' + opt.folge : ''}`,
  });
  state.aktivesEvent = null;
  return { ev, opt, objekt };
}

// Für die UI: das aktive Event mit aufgelöstem Objekt-Titel.
export function aktivesEventInfo(state) {
  if (!state.aktivesEvent) return null;
  const ev = getEvent(state.aktivesEvent.eventId);
  const objekt = state.aktivesEvent.objektIndex >= 0 ? state.portfolio[state.aktivesEvent.objektIndex] : null;
  return { ev, objekt };
}
