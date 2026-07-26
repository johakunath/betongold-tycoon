// main.js — Einstiegspunkt: Spielschleife (Fast-Forward), Autosave,
// Verdrahtung von Engine, State und UI.

import {
  newGame, saveGame, loadGame, deleteSave, exportString, importString, AUTOSAVE_SLOT,
} from './state.js?v=59';
import { advanceMonths } from './engine.js?v=59';
import { setzeInhalte } from './content.js?v=59';
import { initialisiereMarkt } from './market.js?v=59';
import { initDashboard, renderDashboard } from './ui/dashboard.js?v=59';
import {
  initShell, updateHud, zeigeNeuesSpiel, zeigeScreen, aktiverScreen, toast,
  zeigePortfolio,
} from './ui/shell.js?v=59';
import { initMarktplatz, renderMarktplatz } from './ui/marktplatz.js?v=59';
import { initExpose, renderExpose, oeffneExpose } from './ui/expose.js?v=59';
import { initFinanzierung } from './ui/finanzierung.js?v=59';
import { initObjekt, renderObjekt, oeffneObjekt } from './ui/objekt.js?v=59';
import { initBewerber, oeffneBewerber } from './ui/bewerber.js?v=59';
import { initRenovieren } from './ui/renovieren.js?v=59';
import { initEvent, initEventWeiter, zeigeEvent } from './ui/event.js?v=59';
import { initVerkaufen } from './ui/verkaufen.js?v=59';
import { initEndgame, zeigeEnde } from './ui/endgame.js?v=59';
import { initAdmin } from './ui/admin.js?v=59';
import { initBildzoom } from './ui/bildzoom.js?v=59';
import { initTurnaround } from './ui/turnaround.js?v=59';
import { initStrategy } from './ui/strategy.js?v=59';
import { initKarte, renderKarte } from './ui/karte.js?v=59';
import { initTutorial } from './ui/tutorial.js?v=59';
import { initFinanzen, renderFinanzen } from './ui/finanzen.js?v=59';
import { kaufeEtf, setzeSparplanEtfAnteil, verkaufeEtf } from './etf.js?v=59';
import { zieheWartemomente } from './signals.js?v=59';
import { initialisiereStartbestand } from './starter.js?v=59';
import { pruefeRatgeber } from './ratgeber.js?v=59';
import { UI_VERSION } from './config.js?v=59';

// Inhalte laden, bevor irgendein State angefasst wird (Markt/Mieter/Events).
const [listings, tenants, events] = await Promise.all([
  fetch(`data/listings.json?v=${UI_VERSION}`).then((r) => r.json()),
  fetch(`data/tenants.json?v=${UI_VERSION}`).then((r) => r.json()),
  fetch(`data/events.json?v=${UI_VERSION}`).then((r) => r.json()),
]);
setzeInhalte({ listings, tenants, events });

let state = null;
let speed = 0;           // Monate pro Sekunde (0 = Pause)
let rest = 0;            // angesammelte Teilmonate
let zuletzt = performance.now();
let letztesAutosave = 0;
let endeGezeigt = false;

// Geschwindigkeiten: 1, 2 oder 6 Monate/s. 30 finanzielle Jahre dauern damit
// rund 6, 3 oder 1 Minute. Pausiert automatisch am Kampagnenende sowie bei
// Events und wichtigen Wartemomenten.

function render() {
  if (!state) return;
  const s = aktiverScreen();
  if (s === 'dashboard') renderDashboard(state);
  else if (s === 'finanzen') renderFinanzen(state);
  else if (s === 'karte') renderKarte(state);
  else if (s === 'marktplatz') renderMarktplatz(state);
  else if (s === 'expose') renderExpose(state); // Live-Update, kein Voll-Render
  else if (s === 'objekt') renderObjekt(state);
  updateHud(state, speed);
}

function setSpeed(v) {
  if (!state || (state.beendet && v > 0)) v = 0;
  speed = v;
  rest = 0;
  zuletzt = performance.now();
  if (state) {
    updateHud(state, speed);
    if (v === 0) autosave(true);
  }
}

function schritt(monate) {
  if (!state || state.beendet) return;
  advanceMonths(state, monate);
  nachTick();
}

function nachTick() {
  render();
  const ratgeberTipp = pruefeRatgeber(state);
  if (ratgeberTipp) {
    toast(`${ratgeberTipp.titel}: ${ratgeberTipp.text}`, { dauer: 9500, typ: 'ratgeber' });
  }
  autosave(false);
  const wartemomente = zieheWartemomente(state);
  if (wartemomente.length) {
    setSpeed(0);
    autosave(true);
    toast(wartemomente.map((m) => m.text).join(' · '), { wichtig: true, dauer: 7000 });
  }
  // Dilemma-Event feuert → Zeit anhalten und Modal öffnen (ECONOMY_MODEL §18)
  if (state.aktivesEvent) {
    setSpeed(0);
    autosave(true);
    zeigeEvent();
    return;
  }
  if (state.beendet && !endeGezeigt) {
    endeGezeigt = true;
    setSpeed(0);
    autosave(true);
    zeigeEnde(state);
  }
}

// Autosave: jeder Tick zählt, Schreibvorgänge werden aber auf höchstens einen
// alle 2 s gedrosselt; erzwungen bei Pause, Ende und Tab-Wechsel.
function autosave(erzwungen) {
  if (!state) return;
  const jetzt = Date.now();
  if (!erzwungen && jetzt - letztesAutosave < 2000) return;
  letztesAutosave = jetzt;
  saveGame(state, AUTOSAVE_SLOT);
}

// --- Spielschleife ----------------------------------------------------------

setInterval(() => {
  if (!state || speed === 0 || state.beendet) return;
  const jetzt = performance.now();
  rest += ((jetzt - zuletzt) / 1000) * speed;
  zuletzt = jetzt;
  const n = Math.floor(rest);
  if (n > 0) {
    rest -= n;
    advanceMonths(state, n);
    nachTick();
  }
}, 100);

// --- App-API für die Shell ----------------------------------------------------

const app = {
  setSpeed,
  schritt,
  getState: () => state,
  render,
  zeigeScreen,
  oeffneExpose,
  oeffneObjekt,
  oeffneBewerber: (listingId) => {
    const index = state?.portfolio.findIndex((objekt) => objekt.listingId === listingId) ?? -1;
    if (index >= 0) oeffneBewerber(index);
  },

  neuesSpiel({ schwierigkeit, startPreset, startAnpassung, seedText }) {
    state = newGame({ schwierigkeit, startPreset, startAnpassung, seedText });
    initialisiereMarkt(state);
    const startbestand = initialisiereStartbestand(state);
    endeGezeigt = false;
    setSpeed(0);
    autosave(true);
    zeigeScreen('karte');
    toast(startbestand.angewendet
      ? `Sonderstart: ${startbestand.anzahl} Mietobjekte übernommen.`
      : `Neues Spiel (${state.startProfil.label}, ${state.config.schwierigkeiten[schwierigkeit].label}).`);
  },

  etfVerkaufen(betrag) {
    if (!state) return false;
    const ergebnis = verkaufeEtf(state, betrag);
    if (!ergebnis.ok) {
      toast('Bitte einen gültigen Verkaufsbetrag wählen.');
      return false;
    }
    autosave(true);
    render();
    toast(`${Math.round(ergebnis.netto).toLocaleString('de-DE')} € aus dem ETF ins Tagesgeld umgeschichtet` +
      (ergebnis.steuer > 0 ? `; ${Math.round(ergebnis.steuer).toLocaleString('de-DE')} € Steuer.` : '.'));
    return true;
  },

  etfKaufen(betrag) {
    if (!state) return false;
    const ergebnis = kaufeEtf(state, betrag);
    if (!ergebnis.ok) {
      toast('Bitte einen gültigen Anlagebetrag wählen.');
      return false;
    }
    autosave(true);
    render();
    toast(`${Math.round(ergebnis.betrag).toLocaleString('de-DE')} € vom Tagesgeld ins ETF-Depot umgeschichtet.`);
    return true;
  },

  sparplanSetzen(anteil) {
    if (!state) return false;
    const ergebnis = setzeSparplanEtfAnteil(state, anteil);
    if (!ergebnis.ok) {
      toast('Bitte einen gültigen Sparplan-Anteil wählen.');
      return false;
    }
    autosave(true);
    render();
    toast(`ETF-Sparplan: ${Math.round(ergebnis.anteil * 100)} % der positiven Haushaltssparrate.`);
    return true;
  },

  speichern(slot) {
    if (!state) return;
    toast(saveGame(state, slot) ? `Gespeichert als „${slot}".` : 'Speichern fehlgeschlagen.');
  },

  laden(slot) {
    const geladen = loadGame(slot);
    if (!geladen) {
      toast(`Spielstand „${slot}" konnte nicht geladen werden.`);
      return;
    }
    state = geladen;
    initialisiereMarkt(state); // migrierte v1-Spielstände starten den Feed hier
    initialisiereStartbestand(state);
    endeGezeigt = false;
    setSpeed(0);
    if (state.beendet) {
      endeGezeigt = true;
      zeigeEnde(state);
    } else {
      zeigeScreen('karte');
    }
    toast(`„${slot}" geladen.`);
  },

  loeschen(slot) {
    deleteSave(slot);
    toast(`„${slot}" gelöscht.`);
  },

  exportieren() {
    if (!state) return;
    const blob = new Blob([exportString(state)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const stempel = new Date().toISOString().slice(0, 10);
    a.download = `betongold-spielstand-${stempel}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  async importieren(datei) {
    try {
      state = importString(await datei.text());
      initialisiereMarkt(state);
      initialisiereStartbestand(state);
      endeGezeigt = state.beendet;
      setSpeed(0);
      autosave(true);
      zeigeScreen('karte');
      document.getElementById('dlg-saves').close();
      toast('Spielstand importiert.');
    } catch (e) {
      toast(`Import fehlgeschlagen: ${e.message}`);
    }
  },
};

// Kontext für die UI-Module (Marktplatz, Exposé, Finanzierung, Phase 3)
const ctx = {
  getState: () => state,
  render,
  setSpeed,
  schritt,
  toast,
  autosave: () => autosave(true),
  zeigeScreen,
  zeigePortfolio,
  oeffneExpose,
  oeffneObjekt,
  oeffneBewerber: (listingId) => {
    const index = state?.portfolio.findIndex((objekt) => objekt.listingId === listingId) ?? -1;
    if (index >= 0) oeffneBewerber(index);
  },
  etfVerkaufen: (betrag) => app.etfVerkaufen(betrag),
  etfKaufen: (betrag) => app.etfKaufen(betrag),
  sparplanSetzen: (anteil) => app.sparplanSetzen(anteil),
};

initShell(app);
initDashboard(() => state, oeffneObjekt, () => autosave(true), oeffneExpose);
initMarktplatz(ctx);
initKarte(ctx);
initTutorial(ctx);
initFinanzen(ctx);
initExpose(ctx);
initFinanzierung(ctx);
initObjekt(ctx);
initBewerber(ctx);
initRenovieren(ctx);
initEvent(ctx);
initEventWeiter();
initVerkaufen(ctx);
initTurnaround(ctx);
initStrategy(ctx);
initEndgame(ctx);
initAdmin(ctx);
initBildzoom();
document.getElementById('btn-zur-karte').addEventListener('click', () => zeigeScreen('karte'));

// Beim Verlassen sichern.
window.addEventListener('beforeunload', () => autosave(true));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) autosave(true);
});

// --- Start: Autosave laden oder neues Spiel ----------------------------------

state = loadGame(AUTOSAVE_SLOT);
if (state) {
  initialisiereMarkt(state); // no-op, falls schon initialisiert (v2-Save)
  initialisiereStartbestand(state);
  endeGezeigt = state.beendet;
  if (state.beendet) zeigeEnde(state);
  else render();
} else {
  zeigeNeuesSpiel(true);
}

