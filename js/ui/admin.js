// ui/admin.js — gruppiertes Phase-5-Adminpanel. Änderungen werden erst beim
// Übernehmen in state.config geschrieben und greifen damit ab dem nächsten Tick.

import {
  ADMIN_FELDER, ADMIN_GRUPPEN, aktuelleAdminWerte, standardAdminWerte,
  planeAdminWerte,
} from '../admin.js?v=59';

let ctx = null;
let formularWerte = null;

export function initAdmin(context) {
  ctx = context;
  const dialog = document.getElementById('dlg-admin');
  const form = document.getElementById('form-admin');

  document.getElementById('btn-admin').addEventListener('click', () => {
    ctx.setSpeed(0);
    const state = ctx.getState();
    formularWerte = {
      ...aktuelleAdminWerte(state.config),
      ...(state.adminPending?.werte || {}),
    };
    renderFormular(formularWerte);
    if (state.adminPending) {
      document.getElementById('admin-status').textContent =
        'Diese Änderungen sind bereits für den nächsten Monat vorgemerkt.';
    }
    dialog.showModal();
  });

  document.getElementById('btn-admin-reset').addEventListener('click', () => {
    formularWerte = standardAdminWerte();
    renderFormular(formularWerte);
    const status = document.getElementById('admin-status');
    status.textContent = 'Standardwerte geladen — noch nicht übernommen.';
    form.querySelector('input')?.focus();
  });

  form.addEventListener('input', () => {
    document.getElementById('admin-status').textContent = 'Nicht übernommene Änderungen.';
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const werte = Object.fromEntries(ADMIN_FELDER.map((feld) => [
      feld.pfad,
      form.elements.namedItem(feld.pfad).value,
    ]));
    try {
      const anzahl = planeAdminWerte(ctx.getState(), werte);
      ctx.autosave();
      dialog.close();
      ctx.toast(anzahl > 0
        ? `${anzahl} Admin-Werte vorgemerkt — wirksam im nächsten Monat.`
        : 'Keine Admin-Änderung vorgemerkt.');
    } catch (fehler) {
      document.getElementById('admin-status').textContent = fehler.message;
    }
  });
}

function renderFormular(werte) {
  const ziel = document.getElementById('admin-gruppen');
  ziel.innerHTML = Object.entries(ADMIN_GRUPPEN).map(([id, gruppe]) => {
    const felder = ADMIN_FELDER.filter((feld) => feld.gruppe === id);
    return `<fieldset class="admin-gruppe"><legend>${gruppe.label}</legend>` +
      `<p>${gruppe.beschreibung}</p><div class="admin-felder">` +
      felder.map((feld, index) => {
        const hilfeId = `admin-hilfe-${id}-${index}`;
        return `<label class="admin-feld">` +
          `<span>${feld.label}</span>` +
          `<span class="admin-eingabe"><input type="number" name="${feld.pfad}" ` +
            `value="${werte[feld.pfad]}" min="${feld.min}" max="${feld.max}" ` +
            `step="${feld.step}" aria-describedby="${hilfeId}">` +
            (feld.suffix ? `<span aria-hidden="true">${feld.suffix}</span>` : '') +
          `</span><small id="${hilfeId}">${feld.hilfe}</small></label>`;
      }).join('') +
      `</div></fieldset>`;
  }).join('');
  document.getElementById('admin-status').textContent =
    'Änderungen greifen ab dem nächsten Monat. Bereits verbuchte Monate bleiben unverändert.';
}

