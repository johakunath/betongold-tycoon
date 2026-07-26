// ui/strategy.js — native Ziel- und Arbeitsmodellwahl für G/H.

import { alleZielStatus, setzeEntwicklungsziel, zielStatus } from '../goals.js?v=58';
import { arbeitsmodell, arbeitsmodellRestbindung, naechsteLebensphase, setzeArbeitsmodell } from '../life.js?v=58';
import { fmtEUR, fmtEURSigniert } from './util.js?v=58';

let ctx = null;

export function initStrategy(context) {
  ctx = context;
}

export function renderStrategy(state) {
  renderZiele(state);
  renderLebensplan(state);
}

function renderZiele(state) {
  const ziel = document.getElementById('strategie-board');
  if (!ziel) return;
  const aktiv = zielStatus(state);
  const optionen = alleZielStatus(state);
  ziel.innerHTML =
    `<header class="karten-kopf"><div><span class="eyebrow">Freiwilliger Horizont</span><h3>Woran arbeitet ihr die nächsten Jahre?</h3></div>` +
      `<span class="badge blau">Wechsel ohne Kosten</span></header>` +
    (aktiv
      ? `<div class="ziel-aktiv"><div><b>${aktiv.label}</b><span>${aktiv.detail}</span></div>` +
        `<meter min="0" max="${aktiv.maximum}" value="${Math.min(aktiv.maximum, aktiv.wert)}">${aktiv.wert}</meter>` +
        `<small>${aktiv.erreicht ? 'Ziel aus vorhandenem Spielstand erreicht — ohne Bonuszahlung.' : aktiv.ueberfaellig ? 'Eigene Frist verstrichen; Ziel bleibt freiwillig aktiv.' : `Noch ${aktiv.restMonate} Monate im selbst gewählten Horizont.`}</small></div>`
      : '') +
    `<div class="ziel-optionen">${optionen.map((option) => {
      const cfg = state.config.entwicklung.zielOptionen[option.id];
      const ausgewaehlt = aktiv?.id === option.id;
      return `<button type="button" data-entwicklungsziel="${option.id}" aria-pressed="${ausgewaehlt}" ${ausgewaehlt ? 'disabled' : ''}>` +
        `<b>${cfg.label}</b><small>${cfg.fristMonate / 12} Jahre · Fortschritt aus echten Bestandswerten</small></button>`;
    }).join('')}<button type="button" data-entwicklungsziel="" aria-pressed="${!aktiv}" ${!aktiv ? 'disabled' : ''}><b>Ohne Ziel spielen</b><small>Keine Kosten, Punkte oder versteckte Strafe</small></button></div>`;
  ziel.querySelectorAll('[data-entwicklungsziel]').forEach((button) => button.addEventListener('click', () => {
    setzeEntwicklungsziel(state, button.dataset.entwicklungsziel || null);
    ctx.autosave();
    ctx.render();
  }));
}

function renderLebensplan(state) {
  const ziel = document.getElementById('lebensplan-board');
  if (!ziel) return;
  const aktuell = arbeitsmodell(state);
  const rest = arbeitsmodellRestbindung(state);
  const phase = naechsteLebensphase(state);
  const modelle = state.config.entwicklung.arbeitsmodelle;
  ziel.innerHTML =
    `<header class="karten-kopf"><div><span class="eyebrow">Arbeit · Zeit · Familie</span><h2>Familienplan</h2></div><span class="badge">${rest ? `noch ${rest} Mon. gebunden` : 'neu wählbar'}</span></header>` +
    `<p>Arbeitsentscheidungen gelten zwölf Monate. Mehr Netto braucht mehr Zeit; weniger Arbeit schafft Immobilienzeit und hebt das langfristige Familienziel.</p>` +
    `<fieldset class="arbeitsmodelle"><legend>Arbeitsmodell</legend>${Object.entries(modelle).map(([id, modell]) => {
      const aktiv = id === aktuell.id;
      const zeitDelta = modell.zeitPlusMonat - modell.zeitBelastungMonat;
      return `<button type="button" data-arbeitsmodell="${id}" aria-pressed="${aktiv}" ${(aktiv || rest) ? 'disabled' : ''}>` +
        `<b>${modell.label}</b><output>${fmtEURSigniert(modell.einkommenDeltaMonat)}/Mon. · ${zeitDelta >= 0 ? '+' : ''}${zeitDelta} h</output>` +
        `<small>Familienziel ${modell.familieZielDelta >= 0 ? '+' : ''}${modell.familieZielDelta}</small></button>`;
    }).join('')}</fieldset>` +
    (phase ? `<aside class="lebensphase"><span class="eyebrow">Nächste Lebensphase · in ${phase.monat - state.monat} Monaten</span><b>${phase.titel}</b><p>${phase.text}</p></aside>` : '') +
    `<p class="hinweis">Alle Beträge sind editierbare Spielannahmen. <button type="button" id="btn-lebensplan-admin">Annahmen öffnen</button></p>`;
  ziel.querySelectorAll('[data-arbeitsmodell]').forEach((button) => button.addEventListener('click', () => {
    try {
      setzeArbeitsmodell(state, button.dataset.arbeitsmodell);
      ctx.autosave();
      ctx.render();
    } catch (fehler) {
      ctx.toast(fehler.message);
    }
  }));
  document.getElementById('btn-lebensplan-admin').addEventListener('click', () => document.getElementById('btn-admin').click());
}

