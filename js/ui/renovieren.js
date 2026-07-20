// renovieren.js — Screen 5: Renovierungsplaner. Vier Stufen mit Kosten, Dauer,
// Zustandsziel und Überziehungsrisiko. Start nur bei leerem Objekt (Umbau =
// Leerstand). Formeln: ECONOMY_MODEL §17.

import { renovierungsOptionen, starteRenovierung } from '../renovation.js?v=41';
import { fmtEUR } from './util.js?v=41';

let ctx = null;
let index = -1;
let eigenleistung = false;

export function initRenovieren(context) {
  ctx = context;
  document.getElementById('dlg-renovieren').querySelector('[data-schliessen]')
    .addEventListener('click', () => document.getElementById('dlg-renovieren').close());
}

export function oeffneRenovieren(objektIndex) {
  index = objektIndex;
  eigenleistung = false;
  ctx.setSpeed(0);
  render();
  const d = document.getElementById('dlg-renovieren');
  if (!d.open) d.showModal();
}

function render() {
  const state = ctx.getState();
  const o = state.portfolio[index];
  document.getElementById('renovieren-titel').textContent = `Renovieren: ${o.titel}`;

  if (o.vermietet) {
    document.getElementById('renovieren-inhalt').innerHTML =
      `<p class="muted">Renovieren geht nur bei leerem Objekt — während des Umbaus steht die Wohnung leer. ` +
      `Warte, bis der Mieter auszieht, oder vermiete erst gar nicht neu.</p>`;
    return;
  }
  if (o.renovierung) {
    const rest = o.renovierung.endMonat - state.monat;
    document.getElementById('renovieren-inhalt').innerHTML =
      `<p class="muted">Es läuft bereits eine Renovierung — noch ${rest} Monat${rest === 1 ? '' : 'e'}.</p>`;
    return;
  }

  const optionen = renovierungsOptionen(state, o, eigenleistung);
  const genugCash = (schaetzung) => state.cash + o.ruecklage >= schaetzung;
  const reno = state.config.renovierung;
  const handwerksbonus = reno.kostenFaktor < 1 || reno.dauerFaktor < 1 || reno.ueberziehungFaktor < 1
    ? `<p class="hinweis"><b>Handwerksbonus aktiv:</b> ` +
      `${Math.round((1 - reno.kostenFaktor) * 100)} % geringere Schätzkosten, ` +
      `${Math.round((1 - reno.dauerFaktor) * 100)} % kürzere Basisdauer und weniger Überziehungsrisiko.</p>`
    : '';

  document.getElementById('renovieren-inhalt').innerHTML =
    `<p class="muted">Aktueller Zustand: <b>${o.zustand}/5</b>, Energieklasse ${o.energieklasse}. ` +
    `Die Schätzsumme wird sofort fällig (Rücklage zuerst), Überziehungen bei Abschluss. ` +
    `Schlechter Zustand = höheres Überziehungsrisiko.</p>` +
    handwerksbonus +
    `<label class="check-zeile eigenleistung-wahl"><input type="checkbox" id="reno-eigenleistung" ${eigenleistung ? 'checked' : ''}> ` +
      `<span><b>Begrenzte Eigenleistung einplanen</b><small>Senkt die Schätzung, bindet aber jeden Baumonat zusätzliche Zeit und erhöht das Überziehungsrisiko.</small></span></label>` +
    `<div class="reno-liste">` +
    optionen.map((opt) => renoKarte(opt, genugCash(opt.schaetzung))).join('') +
    `</div>`;

  document.getElementById('reno-eigenleistung').addEventListener('change', (event) => {
    eigenleistung = event.target.checked;
    render();
  });
  document.querySelectorAll('[data-reno]').forEach((btn) =>
    btn.addEventListener('click', () => {
      starteRenovierung(ctx.getState(), ctx.getState().portfolio[index], btn.dataset.reno, eigenleistung);
      ctx.autosave();
      document.getElementById('dlg-renovieren').close();
      ctx.render();
      ctx.toast('Renovierung gestartet — das Objekt steht jetzt leer.');
    }));
}

function renoKarte(opt, genugCash) {
  const machbar = opt.moeglich && genugCash;
  const grund = !opt.moeglich ? 'bringt hier keinen Zustandsgewinn' : !genugCash ? 'zu wenig Mittel' : '';
  return (
    `<div class="reno-karte ${machbar ? '' : 'gesperrt'}">` +
    `<div class="reno-kopf"><b>${opt.label}</b><span class="reno-preis">${fmtEUR(opt.schaetzung)}</span></div>` +
    `<div class="reno-fakten">` +
    `<span>Dauer: ${opt.dauer} Mon. Leerstand</span>` +
    `<span>Zustand → ${opt.zielZustand}/5${opt.energieBonus ? `, Energie +${opt.energieBonus}` : ''}</span>` +
    `<span>Schätzwert danach: ${opt.wertDelta >= 0 ? '+' : ''}${fmtEUR(opt.wertDelta)}</span>` +
    `<span>Marktmiete danach: ${opt.mieteDelta >= 0 ? '+' : ''}${fmtEUR(opt.mieteDelta)}/Mon.</span>` +
    `<span>Ø erwartete Überziehung: ~${opt.risikoProzent} % der Schätzung</span>` +
    (opt.eigenleistung ? `<span>Eigenleistung: −${fmtEUR(opt.eigenleistung.ersparnis)}, +${opt.eigenleistung.zeitProMonat} h/Monat</span>` : '') +
    `</div>` +
    (machbar
      ? `<button class="primaer" data-reno="${opt.id}">Starten</button>`
      : `<button disabled>${grund}</button>`) +
    `</div>`
  );
}
