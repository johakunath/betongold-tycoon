// event.js — Screen 8: Event-Modal. Zeigt das Dilemma mit 2–3 Optionen; nach
// der Wahl die Folge, dann weiter. Blockiert (die Zeit ist ohnehin pausiert).

import { aktivesEventInfo, optionWirkungen, resolveEvent } from '../events.js?v=61';
import { textInLaufendenEuro } from '../preisniveau.js?v=61';

let ctx = null;

const KATEGORIE_META = {
  objekt: { label: 'Objekt', icon: '⌂' },
  mieter: { label: 'Mieter', icon: '●' },
  haushalt: { label: 'Haushalt', icon: '€' },
  kind: { label: 'Familie', icon: '♥' },
  auftakt: { label: 'Auftakt', icon: '◆' },
};

export function initEvent(context) {
  ctx = context;
}

// Öffnet das Modal für das aktuell aktive Event (aus main.js aufgerufen).
export function zeigeEvent() {
  const state = ctx.getState();
  const info = aktivesEventInfo(state);
  if (!info) return;
  const { ev, objekt } = info;

  const meta = KATEGORIE_META[ev.kategorie] || { label: 'Ereignis', icon: '!' };
  document.getElementById('event-kategorie').innerHTML =
    `<span aria-hidden="true">${meta.icon}</span> ${meta.label}`;
  document.getElementById('event-titel').textContent = ev.titel;
  document.getElementById('event-text').textContent =
    textInLaufendenEuro(state, (objekt ? `${objekt.titel}: ` : '') + ev.text);

  // Jede Option zeigt ihre direkte Wirkung vor der Wahl; die Folge-Erzählung
  // kommt wie bisher erst danach.
  document.getElementById('event-optionen').innerHTML = ev.optionen
    .map((opt, i) => {
      const wirkung = optionWirkungen(state, opt)
        .map((w) => `<span class="event-wirkung-${w.ton}">${w.text}</span>`)
        .join('');
      return `<button class="event-option" data-opt="${i}">` +
        `<span class="event-option-text">${textInLaufendenEuro(state, opt.text)}</span>` +
        `<span class="event-wirkung">${wirkung}</span></button>`;
    })
    .join('');
  document.getElementById('event-optionen').hidden = false;
  document.getElementById('event-folge').hidden = true;

  document.querySelectorAll('#event-optionen [data-opt]').forEach((btn) =>
    btn.addEventListener('click', () => waehle(Number(btn.dataset.opt))));

  const d = document.getElementById('dlg-event');
  d.dataset.kategorie = ev.kategorie;
  d.classList.remove('event-aufgeloest');
  d.oncancel = (e) => e.preventDefault(); // Esc soll das Dilemma nicht wegklicken
  if (!d.open) d.showModal();
}

function waehle(optionIndex) {
  const state = ctx.getState();
  const ergebnis = resolveEvent(state, optionIndex);
  ctx.autosave();
  ctx.render();

  document.getElementById('event-optionen').hidden = true;
  const folge = document.getElementById('event-folge');
  document.getElementById('dlg-event').classList.add('event-aufgeloest');
  folge.querySelector('.event-folge-text').textContent =
    textInLaufendenEuro(state, ergebnis?.opt?.folge || 'Erledigt.');
  folge.hidden = false;
}

export function initEventWeiter() {
  document.getElementById('btn-event-weiter').addEventListener('click', () => {
    document.getElementById('dlg-event').close();
    ctx.render();
  });
}

