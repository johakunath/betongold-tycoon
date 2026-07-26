// ui/turnaround.js — bestätigter Banktermin für das Turnaround-Paket.

import { bankAnpassungVorschau, wendeBankAnpassungAn } from '../turnaround.js?v=55';
import { fmtEUR } from './util.js?v=55';

let ctx = null;
let ziel = null;

export function initTurnaround(context) {
  ctx = context;
  document.getElementById('btn-bank-anpassen').addEventListener('click', () => {
    if (!ziel) return;
    try {
      const v = wendeBankAnpassungAn(ctx.getState(), ziel);
      ctx.autosave();
      document.getElementById('dlg-bank').close();
      ctx.render();
      ctx.toast(`Kreditrate um ${fmtEUR(Math.round(v.entlastung))}/Monat gesenkt.`);
      ziel = null;
    } catch (fehler) {
      ctx.toast(fehler.message);
    }
  });
}

export function oeffneBankAnpassung(objekt) {
  ziel = objekt;
  ctx.setSpeed(0);
  const state = ctx.getState();
  const v = bankAnpassungVorschau(state, objekt);
  document.getElementById('bank-inhalt').innerHTML =
    `<p><b>${objekt.titel}</b>: Die Bank senkt den anfänglichen Tilgungssatz ` +
    `gegen Gebühr. Der Sollzins und die Zinsbindung bleiben unverändert.</p>` +
    `<dl class="bank-vergleich">` +
      `<div><dt>Kreditrate</dt><dd>${fmtEUR(Math.round(v.rateAlt))} → <b>${fmtEUR(Math.round(v.rateNeu))}/Mon.</b></dd></div>` +
      `<div><dt>Monatlich frei</dt><dd class="plus-text">+${fmtEUR(Math.round(v.entlastung))}</dd></div>` +
      `<div><dt>Gebühr heute</dt><dd class="minus-text">−${fmtEUR(v.gebuehr)}</dd></div>` +
      `<div><dt>Mehr Restschuld bis Zinsbindung</dt><dd class="minus-text">ca. +${fmtEUR(Math.round(v.restschuldMehr))}</dd></div>` +
      `<div><dt>Zeitbedarf</dt><dd>${v.zeit} h</dd></div>` +
    `</dl><p class="hinweis">Die Entlastung ist kein Ertrag: Ihr tilgt langsamer und tragt das Anschlusszinsrisiko länger.</p>`;
  const bestaetigen = document.getElementById('btn-bank-anpassen');
  bestaetigen.disabled = !v.moeglich;
  bestaetigen.title = v.grund;
  document.getElementById('dlg-bank').showModal();
}

