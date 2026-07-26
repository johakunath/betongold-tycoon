// ui/verkaufen.js — kompakte, bestätigte Verkaufsentscheidung für Screen 7.

import { verkaufsVorschau, starteVerkauf } from '../verkauf.js?v=59';
import { fmtEUR } from './util.js?v=59';

let ctx = null;
let ziel = null;

export function initVerkaufen(context) {
  ctx = context;
  document.getElementById('btn-verkauf-starten').addEventListener('click', () => {
    if (!ziel) return;
    starteVerkauf(ctx.getState(), ziel);
    ctx.autosave();
    document.getElementById('dlg-verkauf').close();
    ctx.render();
    ctx.toast('Verkauf gestartet — Abschluss in sechs Monaten.');
    ziel = null;
  });
}

export function oeffneVerkauf(objekt) {
  ziel = objekt;
  ctx.setSpeed(0);
  const state = ctx.getState();
  const v = verkaufsVorschau(state, objekt);
  const innerhalb = v.haltedauer < state.config.verkauf.spekulationsfristMonate;
  document.getElementById('verkauf-inhalt').innerHTML =
    `<p><b>${objekt.titel}</b> wird sechs Monate weiter bewirtschaftet. Der tatsächliche ` +
    `Preis folgt dem Marktwert beim Abschluss.</p>` +
    `<table class="ende-tabelle">` +
    `<tr><td>Heutige Verkaufsschätzung</td><td>${fmtEUR(Math.round(v.verkaufspreis))}</td></tr>` +
    `<tr><td>Maklerkosten</td><td>− ${fmtEUR(Math.round(v.makler))}</td></tr>` +
    `<tr><td>Restschuld</td><td>− ${fmtEUR(Math.round(objekt.darlehen.restschuld))}</td></tr>` +
    `<tr><td>Spekulationssteuer</td><td>${innerhalb ? `− ${fmtEUR(Math.round(v.spekulationssteuer))}` : 'entfällt'}</td></tr>` +
    `<tr class="summe"><td>Geschätzter Nettoerlös</td><td>${fmtEUR(Math.round(v.nettoerloes))}</td></tr>` +
    `</table>` +
    `<p class="hinweis">Haltedauer ${Math.floor(v.haltedauer / 12)} J. ${v.haltedauer % 12} Mon. · ` +
    `${innerhalb ? 'innerhalb' : 'außerhalb'} der vereinfachten Zehnjahresfrist.</p>`;
  document.getElementById('dlg-verkauf').showModal();
}

