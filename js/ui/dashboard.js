// dashboard.js — Screen 1: Kennzahlen-Kacheln, Haushaltsrechnung,
// Nettovermögen-vs-ETF-Chart (Design-Säule 4: die ETF-Linie bleibt sichtbar).

import { monatsWerte, nettovermoegen, datum } from '../engine.js?v=52';
import { fairerWert } from '../market.js?v=52';
import { getListing } from '../content.js?v=52';
import { bildHTML } from '../iso.js?v=52';
import { eigenheimMonatskosten } from '../eigenheim.js?v=52';
import { setzeGrenzsteuersatz, steuerVorschau } from '../tax.js?v=52';
import { fmtEUR, fmtEURKompakt, fmtEURSigniert, fmtDatum } from './util.js?v=52';
import { fixkostenMonat, instandhaltungMonat } from '../immobilie.js?v=52';
import { vermietungsmodell } from '../tenants.js?v=52';
import { haushaltsUeberschussMonat, naechsterZugEmpfehlung } from './kennzahlen.js?v=52';
import { aktualisiereNavMarkierung } from './shell.js?v=52';
import { portfolioTriage, stabilisierungsLinien, turnaroundAktiv } from '../turnaround.js?v=52';
import { renderStrategy } from './strategy.js?v=52';

let getState = null;
let onObjekt = null;   // Callback: Portfolio-Objekt anklicken → Objekt-Detail
let onAenderung = null;
let onExpose = null;
let hoverMonat = null; // Monatsindex unter dem Cursor, null = kein Hover
const letzteKpiWerte = new Map();
const letzteKpiPulse = new Map();
let zentraleTab = 'vermoegen';

export function initDashboard(stateAccessor, objektHandler, aenderungsHandler, exposeHandler = null) {
  getState = stateAccessor;
  onObjekt = objektHandler;
  onAenderung = aenderungsHandler;
  onExpose = exposeHandler;
  const svg = document.getElementById('chart');
  svg.addEventListener('mousemove', onHover);
  svg.addEventListener('mouseleave', () => {
    hoverMonat = null;
    const state = getState();
    if (state) renderChart(state);
  });
  const steuerSlider = document.getElementById('steuer-slider');
  steuerSlider.addEventListener('input', () => {
    const state = getState();
    if (!state) return;
    setzeGrenzsteuersatz(state, Number(steuerSlider.value) / 100);
    renderSteuer(state);
  });
  steuerSlider.addEventListener('change', () => onAenderung?.());
  document.querySelectorAll('[data-zentrale-tab]').forEach((button) => {
    button.addEventListener('click', () => setzeZentraleTab(button.dataset.zentraleTab));
  });
  // Vollständiges Tabs-Muster: Pfeiltasten wandern, genau ein Tab ist im
  // Tab-Zyklus (roving tabindex in setzeZentraleTab).
  document.querySelector('.zentrale-tabs').addEventListener('keydown', (event) => {
    const tabs = [...document.querySelectorAll('[data-zentrale-tab]')];
    const index = tabs.indexOf(document.activeElement);
    if (index < 0) return;
    const ziel = event.key === 'ArrowRight' ? (index + 1) % tabs.length
      : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
        : event.key === 'Home' ? 0
          : event.key === 'End' ? tabs.length - 1 : null;
    if (ziel === null) return;
    event.preventDefault();
    tabs[ziel].focus();
    tabs[ziel].click();
  });
  setzeZentraleTab(zentraleTab);
}

function setzeZentraleTab(tab) {
  zentraleTab = tab;
  document.querySelectorAll('[data-zentrale-tab]').forEach((button) => {
    const aktiv = button.dataset.zentraleTab === tab;
    button.classList.toggle('aktiv', aktiv);
    button.setAttribute('aria-selected', String(aktiv));
    if (aktiv) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
    button.tabIndex = aktiv ? 0 : -1;
  });
  document.querySelectorAll('[data-zentrale-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.zentralePanel !== tab;
  });
  aktualisiereNavMarkierung();
}

export function renderDashboard(state) {
  renderKacheln(state);
  renderHaushalt(state);
  renderPortfolio(state);
  renderQuartalsbericht(state);
  renderStrategy(state);
  renderSteuer(state);
  renderChart(state);
  renderZusatzCharts(state);
}

// --- Kennzahlen-Kacheln -----------------------------------------------------

function setKachel(id, wert, sub, klasse = '') {
  const el = document.getElementById(id);
  const wertEl = el.querySelector('.wert');
  const vorher = letzteKpiWerte.get(id);
  wertEl.textContent = wert;
  wertEl.className = 'wert ' + klasse;
  const jetzt = performance.now();
  if (vorher !== undefined && vorher !== wert && jetzt - (letzteKpiPulse.get(id) || 0) > 450) {
    wertEl.classList.remove('wert-update');
    void wertEl.offsetWidth;
    wertEl.classList.add('wert-update');
    letzteKpiPulse.set(id, jetzt);
  }
  letzteKpiWerte.set(id, wert);
  el.querySelector('.sub').textContent = sub;
}

function renderKacheln(state) {
  const netto = nettovermoegen(state);
  const etf = state.etfVergleich.wert;
  const diff = netto - etf;
  const haushaltsUeberschuss = haushaltsUeberschussMonat(state);

  setKachel('tile-cash', fmtEUR(state.cash),
    `Tagesgeld ${(state.config.kapital.tagesgeldZins * 100).toLocaleString('de-DE')} % p.a.`);

  setKachel('tile-cashflow', fmtEURSigniert(haushaltsUeberschuss), 'typischer Planungsmonat · vor ETF-Sparplan',
    haushaltsUeberschuss >= 0 ? 'positiv' : 'negativ');

  setKachel('tile-vermoegen', fmtEUR(netto),
    state.eigenheim || state.portfolio.length
      ? `Cash + ${state.eigenheim ? 'Eigenheim' : ''}` +
        `${state.eigenheim && state.portfolio.length ? ' + ' : ''}` +
        `${state.portfolio.length ? `${state.portfolio.length} Mietobjekt${state.portfolio.length > 1 ? 'e' : ''}` : ''} − Schulden`
      : 'Tagesgeld + ETF-Depot — noch keine Immobilien');

  setKachel('tile-etf', fmtEUR(etf),
    diff >= 0 ? `Du liegst ${fmtEUR(diff)} vorn` : `ETF liegt ${fmtEUR(-diff)} vorn`,
    diff >= 0 ? 'positiv' : 'negativ');

  const zb = state.zeitbudget;
  setKachel('tile-zeit', `${zb.verfuegbar - zb.verbraucht} h frei`,
    `von ${state.config.budget.zeitProMonat} h/Monat für Immobilien`);

  setKachel('tile-familie', `${Math.round(state.familienzufriedenheit)} / 100`, 'Familienzufriedenheit');
  document.getElementById('familie-balken').style.width = `${state.familienzufriedenheit}%`;
}

// --- Haushaltsrechnung ------------------------------------------------------

function renderHaushalt(state) {
  const w = state.monat > 0 && state.letzteHaushaltswerte
    ? state.letzteHaushaltswerte
    : monatsWerte(state);
  const zinsen = state.monat > 0
    ? (state.letzterCashZins || 0)
    : state.cash * (state.config.kapital.tagesgeldZins / 12);
  const kinderInfo = w.kinderDetails
    .map((k) => {
      const alter = k.alter.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
      return k.kosten > 0 ? `${alter} J.` : `${alter} J. (ausgezogen)`;
    })
    .join(', ');

  const immo = state.letzterImmoCashflow || 0;
  const eigenheim = state.monat > 0
    ? (state.letzterEigenheimCashflow || 0)
    : state.eigenheim ? -eigenheimMonatskosten(state) : 0;
  const steuer = state.letzteSteuerzahlung || 0;
  const verkauf = state.letzterVerkaufsCashflow || 0;
  const zeilen = [
    w.einkommenPerson2 > 0 ? ['+', 'Nettoeinkommen Person A', w.einkommenPerson1] : ['+', 'Nettoeinkommen', w.einkommen],
    w.einkommenPerson2 > 0 ? ['+', 'Nettoeinkommen Person B', w.einkommenPerson2] : null,
    w.kindergeld > 0 ? ['+', 'Kindergeld', w.kindergeld] : null,
    w.miete > 0 ? ['−', 'Miete (warm)', -w.miete] : null,
    w.reisen > 0 ? ['−', 'Lebenshaltung ohne Reisen', -w.lebenshaltungOhneReisen] : ['−', 'Lebenshaltung', -w.lebenshaltung],
    w.reisen > 0 ? ['−', 'Reisen (Monatsdurchschnitt)', -w.reisen] : null,
    w.auto > 0 ? ['−', 'Auto (All-in-Pauschale)', -w.auto] : null,
    ['−', `Kinder – direkte Kosten (${kinderInfo})`, -w.kinder],
    ['=', w.miete === 0 ? 'Haushalt vor Eigenheim' : 'Haushalt vor Immobilien', w.sparrate, true],
    w.etfEinzahlung > 0 ? ['−', `ETF-Sparplan (${Math.round(w.sparplanEtfAnteil * 100)} %)`, -w.etfEinzahlung] : null,
    ['+', 'Tagesgeldzinsen netto', zinsen],
  ].filter(Boolean);
  if (eigenheim) zeilen.push(['−', state.eigenheim ? 'Eigenheim' : 'Eigenheim bis Verkaufsabschluss', eigenheim]);
  if (state.portfolio.length) {
    zeilen.push([immo >= 0 ? '+' : '−', 'Immobilien (letzter Monat)', immo]);
  }
  if (steuer) zeilen.push([steuer < 0 ? '+' : '−', steuer < 0 ? 'Steuergutschrift Vermietung' : 'Jahressteuerbescheid', -steuer]);
  if (verkauf) zeilen.push(['+', 'Verkaufserlös (netto)', verkauf]);
  zeilen.push(['=', 'Haushaltsüberschuss (typischer Monat, vor ETF)', haushaltsUeberschussMonat(state), true]);
  const gesamt = state.monat > 0
    ? state.letzterCashflow
    : w.sparrate - w.etfEinzahlung + zinsen + eigenheim + immo - steuer + verkauf;
  zeilen.push(['=', 'Tagesgeld-Veränderung (letzter Monat)', gesamt, true]);

  renderCashflowViz(zeilen);
}

// Eine Darstellung pro Posten: Label, Balken und Betrag in derselben Zeile;
// Zwischensummen als abgesetzte Summenzeilen. Es gibt keine zweite Tabelle
// mit denselben Werten mehr.
function renderCashflowViz(zeilen) {
  const posten = zeilen.filter(([, , betrag, fett]) => !fett);
  const max = Math.max(1, ...posten.map(([, , betrag]) => Math.abs(betrag)));
  document.getElementById('cashflow-viz').innerHTML = zeilen
    .map(([, name, betrag, fett]) => {
      const wert = fmtEURSigniert(Math.abs(betrag) < 0.005 ? 0 : betrag);
      const gruppenkopf = name.startsWith('ETF-Sparplan')
        ? '<div class="flow-gruppe">Sparen &amp; Investieren im letzten Monat</div>'
        : '';
      if (fett) {
        return `${gruppenkopf}<div class="flow-summe ${betrag >= 0 ? 'positiv' : 'negativ'}"><span>${name}</span><b>${wert}</b></div>`;
      }
      const breite = Math.abs(betrag) < 0.5 ? 0 : Math.max(4, Math.round(Math.abs(betrag) / max * 100));
      return `${gruppenkopf}<div class="flow-zeile" aria-label="${name}: ${wert}">` +
        `<span>${name}</span><div class="flow-track"><i class="${betrag >= 0 ? 'rein' : 'raus'}" style="width:${breite}%"></i></div>` +
        `<b class="${betrag >= 0 ? 'plus-text' : 'minus-text'}">${wert}</b></div>`;
    }).join('');
}

// --- Portfolio & Ereignisse ---------------------------------------------------

function renderPortfolio(state) {
  const ziel = document.getElementById('portfolio-liste');
  renderTurnaroundBoard(state);
  const summary = document.getElementById('portfolio-summary');
  const anzahl = state.portfolio.length + (state.eigenheim ? 1 : 0);
  summary.textContent = anzahl
    ? `${anzahl} Immobilie${anzahl === 1 ? '' : 'n'}`
    : 'Noch kein Objekt';
  if (state.portfolio.length === 0 && !state.eigenheim) {
    ziel.innerHTML =
      `<div class="portfolio-empty"><div class="empty-illustration" aria-hidden="true">${icon('building', 'empty-icon')}</div>` +
      `<div><b>Noch kein Betongold.</b><p>Auf dem Marktplatz wartet das erste Objekt – prüfen vor kaufen.</p></div>` +
      `<button type="button" id="link-marktplatz" class="primaer">${icon('map')}Marktplatz öffnen</button></div>`;
    document.getElementById('link-marktplatz')?.addEventListener('click', (ev) => {
      document.getElementById('nav-marktplatz').click();
    });
    return;
  }
  const eigenheim = state.eigenheim
    ? portfolioKarte(state, state.eigenheim, -eigenheimMonatskosten(state), true)
    : '';
  ziel.innerHTML = eigenheim + state.portfolio
    .map((o) => {
      const wert = fairerWert(state, o);
      const d = o.darlehen;
      const imUmbau = !!o.renovierung;
      const vermietet = o.vermietet && !imUmbau;
      const laufend =
        (vermietet ? o.kaltmiete : 0) -
        fixkostenMonat(state, o, vermietet) -
        instandhaltungMonat(state, o) -
        (d.restschuld > 0 ? d.rate : 0);
      return portfolioKarte(state, o, laufend, false, wert);
    })
    .join('');
  // Der Titel ist der echte Button (Tastaturweg); der Klick auf die restliche
  // Karte bleibt als Zeigegeräte-Komfort erhalten und läuft über Bubbling.
  ziel.querySelectorAll('[data-objekt]').forEach((el) => {
    el.addEventListener('click', () => onObjekt && onObjekt(el.dataset.objekt));
  });
}

function renderTurnaroundBoard(state) {
  const ziel = document.getElementById('turnaround-board');
  if (!ziel) return;
  if (!turnaroundAktiv(state)) {
    ziel.hidden = true;
    ziel.innerHTML = '';
    return;
  }
  ziel.hidden = false;
  const triage = portfolioTriage(state);
  const linien = stabilisierungsLinien(state);
  const haushalt = haushaltsUeberschussMonat(state);
  const zielPlus = state.config.turnaround.zwischenzielVerbesserungMonat;
  const verbesserungWert = Math.max(0, Math.min(zielPlus, triage.verbesserung));
  const reserveWert = Math.max(0, Math.min(triage.ruecklageZiel, triage.ruecklage));
  const fenster = triage.bankOffen
    ? `noch ${triage.bankRestMonate} Monat${triage.bankRestMonate === 1 ? '' : 'e'}`
    : 'geschlossen — Verkauf und Bewirtschaftung bleiben';
  ziel.innerHTML =
    `<section class="turnaround-kopf" aria-labelledby="turnaround-titel">` +
      `<div><span class="eyebrow">12-Monats-Turnaround</span><h3 id="turnaround-titel">Bestand triagieren, nicht blind retten</h3>` +
      `<p>Bankfenster ${fenster}. Höchstens ${triage.bankMax} Darlehen lassen sich kostenpflichtig strecken.</p></div>` +
      `<dl class="turnaround-kpis">` +
        `<div><dt>Objektverbund</dt><dd class="${triage.portfolioCashflow >= 0 ? 'plus-text' : 'minus-text'}">${fmtEURSigniert(Math.round(triage.portfolioCashflow))}/Mon.</dd></div>` +
        `<div><dt>Haushalt danach</dt><dd class="${haushalt >= 0 ? 'plus-text' : 'minus-text'}">${fmtEURSigniert(Math.round(haushalt))}/Mon.</dd></div>` +
        `<div><dt>Arbeitslast</dt><dd>${triage.arbeitslast} h/Mon.</dd></div>` +
        `<div><dt>Banktermine</dt><dd>${triage.bankVerbraucht}/${triage.bankMax}</dd></div>` +
      `</dl>` +
      `<div class="turnaround-ziele">` +
        `<label><span>Zwischenziel: +${fmtEUR(zielPlus)}/Monat</span><meter min="0" max="${zielPlus}" value="${verbesserungWert}">${verbesserungWert}</meter><b>${fmtEURSigniert(Math.round(triage.verbesserung))}</b></label>` +
        `<label><span>Objektrücklagen: ein Planjahr</span><meter min="0" max="${Math.max(1,triage.ruecklageZiel)}" value="${reserveWert}">${reserveWert}</meter><b>${fmtEUR(Math.round(triage.ruecklage))}</b></label>` +
      `</div>` +
    `</section>` +
    `<section class="turnaround-linien" aria-label="Stabilisierungslinien">${linien.map((linie) =>
      `<article><span class="eyebrow">${linie.dauer ? `${linie.dauer} Monate` : 'sofort möglich'}</span><h4>${linie.titel}</h4><p>${linie.text}</p>` +
      `<output>Cashflow-Wirkung bis zu +${fmtEUR(Math.round(linie.wirkung))}/Monat</output>` +
      `<small>${linie.id === 'halten'
        ? `${fmtEUR(Math.round(linie.kosten))} Gebühren heute.`
        : linie.nettoerloes < 0
          ? `Voraussichtlich negativer Nettoerlös: ${fmtEUR(Math.round(linie.nettoerloes))}.`
          : `Geschätzter Nettoerlös ${fmtEUR(Math.round(linie.nettoerloes))}.`} ${linie.folge}</small>` +
      (linie.ziel ? `<button type="button" data-triage-objekt="${linie.ziel}">Objekt prüfen</button>` : '') +
      `</article>`).join('')}</section>` +
    `<div class="turnaround-tabelle-wrap"><table class="turnaround-tabelle"><thead><tr><th>Priorität</th><th>Cashflow</th><th>Risiko</th><th>Finanzierungsquote / Bindung</th><th>Eigenkapital</th><th>Arbeit</th><th>Kurzfristige Chancen</th></tr></thead><tbody>` +
    triage.objekte.map((o, index) => `<tr><th><button type="button" data-triage-objekt="${o.objekt.listingId}">${index + 1}. ${o.objekt.titel}</button></th>` +
      `<td class="${o.cashflow >= 0 ? 'plus-text' : 'minus-text'}">${fmtEURSigniert(Math.round(o.cashflow))}</td>` +
      `<td><span class="badge risiko-${o.risiko}">${o.risiko}</span></td>` +
      `<td>${Math.round(o.ltv * 100)} % · ${o.bindung} Mon.</td>` +
      `<td>${fmtEUR(Math.round(o.eigenkapital))}<small>Exit: ${fmtEUR(Math.round(o.verkauf.nettoerloes))}</small></td>` +
      `<td>${o.arbeitslast} h/Mon.</td><td>${o.chancen.length ? o.chancen.join('<br>') : 'nur halten/verkaufen'}</td></tr>`).join('') +
    `</tbody></table></div>`;
  ziel.querySelectorAll('[data-triage-objekt]').forEach((button) => {
    button.addEventListener('click', () => onObjekt?.(button.dataset.triageObjekt));
  });
}

function portfolioKarte(state, objekt, cashflow, istEigenheim, wert = fairerWert(state, objekt)) {
  const listing = getListing(objekt.listingId);
  const schuld = objekt.darlehen.restschuld;
  const eigenkapital = Math.max(0, wert - schuld);
  const ekQuote = wert > 0 ? Math.max(0, Math.min(100, eigenkapital / wert * 100)) : 0;
  let status;
  let statusKlasse;
  if (istEigenheim) {
    status = objekt.verkauf ? 'Eigenheim · Verkauf läuft' : 'Eigenheim · selbst genutzt';
    statusKlasse = 'blau';
  } else if (objekt.renovierung) {
    status = `Renovierung · noch ${Math.max(0, objekt.renovierung.endMonat - state.monat)} Mon.`;
    statusKlasse = 'blau';
  } else if (objekt.vermietet) {
    status = `Vermietet · ${vermietungsmodell(state, objekt.vermietungsart || objekt.moebliert).label}`;
    statusKlasse = 'gruen';
  } else {
    status = objekt.suche ? 'Leer · Bewerber ausstehend' : 'Leer · Aktion nötig';
    statusKlasse = 'orange';
  }
  return (
    `<article class="owned-card" data-objekt="${istEigenheim ? 'eigenheim' : objekt.listingId}">` +
    `<div class="owned-visual">${bildHTML(listing, 'owned-image')}<span class="badge ${statusKlasse}">${status}</span></div>` +
    `<div class="owned-body"><h3><button type="button" class="karte-titel" aria-label="${objekt.titel} öffnen, ${status}">${objekt.titel}</button></h3>` +
    `<div class="owned-primary"><span>laufend</span><b class="${cashflow >= 0 ? 'plus-text' : 'minus-text'}">${fmtEURSigniert(Math.round(cashflow))}/Mon.</b></div>` +
    `<div class="ownership-meter" aria-label="Eigenkapital ${fmtEUR(Math.round(eigenkapital))}, Restschuld ${fmtEUR(Math.round(schuld))}">` +
    `<i style="width:${ekQuote.toFixed(1)}%"></i></div>` +
    `<div class="owned-split"><span><small>Eigenkapital</small><b>${fmtEURKompakt(eigenkapital)}</b></span>` +
    `<span><small>Restschuld</small><b>${fmtEURKompakt(schuld)}</b></span></div>` +
    `<span class="owned-open">Objekt führen <b>→</b></span></div></article>`
  );
}

function renderSteuer(state) {
  const cfg = state.config.steuer;
  const slider = document.getElementById('steuer-slider');
  slider.min = Math.round(cfg.grenzsatzMin * 100);
  slider.max = Math.round(cfg.grenzsatzMax * 100);
  slider.value = Math.round(state.steuer.grenzsatz * 100);
  document.getElementById('steuer-satz-wert').textContent = `${slider.value} %`;
  const v = steuerVorschau(state);
  document.getElementById('steuer-vorschau').innerHTML =
    `<span>Bescheid ${v.jahr}</span><b class="${v.steuer < 0 ? 'plus-text' : ''}">${v.steuer < 0 ? `${fmtEUR(Math.round(-v.steuer))} Gutschrift` : fmtEUR(Math.round(v.steuer))}</b>` +
    `<small>${fmtEUR(Math.round(v.miete))} Miete − ${fmtEUR(Math.round(v.kosten))} Kosten − ` +
    `${fmtEUR(Math.round(v.zinsen))} Zinsen − ${fmtEUR(Math.round(v.afa))} AfA = ` +
    `${fmtEUR(Math.round(v.ergebnis))} Ergebnis</small>`;
  const letzter = state.steuer.bescheide.at(-1);
  document.getElementById('steuer-letzter').textContent = letzter
    ? `Letzter Bescheid ${letzter.jahr}: ${letzter.steuer < 0 ? `${fmtEUR(Math.round(-letzter.steuer))} Gutschrift` : fmtEUR(Math.round(letzter.steuer))}`
    : 'Erster Bescheid kommt im Dezember.';
}

function renderQuartalsbericht(state) {
  const ziel = document.getElementById('quartalsbericht-inhalt');
  if (!ziel) return;
  const seitMonat = Math.max(0, state.monat - 3);
  const aktuell = state.historie.findLast((h) => h.monat <= state.monat) || {
    nettovermoegen: nettovermoegen(state), etf: state.etfVergleich.wert, cash: state.cash,
  };
  const vorher = state.historie.findLast((h) => h.monat <= seitMonat) || state.historie[0] || aktuell;
  const empfehlung = naechsterZug(state);
  document.getElementById('quartalsbericht-zeitraum').textContent = state.monat === 0 ? 'Startlage' : `letzte ${Math.min(3, state.monat)} Monate`;
  ziel.innerHTML =
    `<dl class="quartals-kpis">` +
    `<div><dt>Nettovermögen</dt><dd>${fmtEURSigniert((aktuell.nettovermoegen ?? nettovermoegen(state)) - (vorher.nettovermoegen ?? 0))}</dd></div>` +
    `<div><dt>ETF-Benchmark brutto</dt><dd>${fmtEURSigniert((aktuell.etf ?? state.etfVergleich.wert) - (vorher.etf ?? 0))}</dd></div>` +
    `<div><dt>Tagesgeld</dt><dd>${fmtEURSigniert((aktuell.cash ?? state.cash) - (vorher.cash ?? 0))}</dd></div></dl>` +
    `<div class="quartals-naechster"><span class="eyebrow">${empfehlung.phase || 'Empfehlung'}</span><h3>${empfehlung.titel}</h3><p>${empfehlung.text}</p>` +
    `<button type="button" id="quartal-cta" class="primaer">${empfehlung.button}</button></div>`;
  document.getElementById('quartal-cta').addEventListener('click', empfehlung.aktion);
}

function naechsterZug(state) {
  // Gemeinsame Empfehlungslogik mit der Stadt; nur die Standardempfehlung
  // ist screen-spezifisch (die Zentrale schickt zur Stadt, nie zu sich selbst).
  const empfehlung = naechsterZugEmpfehlung(state);
  if (empfehlung) {
    const aktionen = {
      finanzen: () => document.getElementById('nav-finanzen').click(),
      objekt: () => onObjekt?.(empfehlung.ziel),
      expose: () => onExpose ? onExpose(empfehlung.ziel) : document.getElementById('nav-marktplatz').click(),
      marktplatz: () => document.getElementById('nav-marktplatz').click(),
      portfolio: () => setzeZentraleTab('objekte'),
      haushalt: () => setzeZentraleTab('haushalt'),
    };
    return { ...empfehlung, aktion: aktionen[empfehlung.typ] };
  }
  return {
    titel: state.portfolio.length || state.eigenheim ? 'Märkte und Puffer vergleichen' : 'Erste Chance bewusst auswählen',
    text: 'Die Stadt zeigt Angebote, Familienoptionen und euren Bestand mit demselben Statussystem.',
    button: 'Stadt öffnen', aktion: () => document.getElementById('nav-karte').click(),
  };
}

// --- Chart: Nettovermögen vs. ETF -------------------------------------------
// SVG von Hand, keine Bibliothek. 2px-Linien, Hairline-Grid, Legende +
// Direktlabels an den Linienenden (Relief-Regel: Amber hat < 3:1 Kontrast).

const VB = { w: 920, h: 340 };
const PAD = { top: 16, right: 190, bottom: 32, left: 70 };
const FARBEN = { netto: 'var(--serie-netto)', etf: 'var(--serie-etf)' };
const icon = (name, klasse = 'ui-icon') =>
  `<svg class="${klasse}" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;

function nettoObergrenze(maxWert) {
  const roh = maxWert * 1.06;
  const zehner = Math.pow(10, Math.floor(Math.log10(roh)));
  for (const f of [1, 1.5, 2, 2.5, 4, 5, 7.5, 10]) {
    if (f * zehner >= roh) return f * zehner;
  }
  return 10 * zehner;
}

function chartHistorie(state) {
  const historie = state.historie || [];
  const letzter = historie.at(-1);
  const aktuell = {
    ...(letzter || {}),
    monat: state.monat,
    nettovermoegen: nettovermoegen(state),
    etf: state.etfVergleich.wert,
    cashflow: state.letzterCashflow,
  };
  if (!letzter) return [aktuell];
  if (letzter.monat === state.monat) return [...historie.slice(0, -1), aktuell];
  return [...historie, aktuell];
}

function renderChart(state) {
  const svg = document.getElementById('chart');
  const hist = chartHistorie(state);
  // Die Zeitachse wächst mit der tatsächlich gespielten Historie. So bleibt
  // der aktuelle Verlauf lesbar und wird nach einigen Jahren innerhalb der
  // Karte horizontal scrollbar, statt 60 leere Zukunftsjahre zu zeichnen.
  const xMax = Math.max(state.monat, 60);
  const breite = Math.max(VB.w, Math.ceil(xMax / 12) * 110);
  const yMax = nettoObergrenze(Math.max(1000, ...hist.map((h) => Math.max(h.nettovermoegen, h.etf))));

  const iw = breite - PAD.left - PAD.right;
  const ih = VB.h - PAD.top - PAD.bottom;
  const x = (monat) => PAD.left + (monat / xMax) * iw;
  const y = (wert) => PAD.top + ih - (wert / yMax) * ih;

  let s = '';

  // Y-Grid + Labels (Hairlines, zurückhaltend)
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const wert = (yMax / yTicks) * i;
    const py = y(wert);
    s += `<line x1="${PAD.left}" y1="${py}" x2="${PAD.left + iw}" y2="${py}" class="grid"/>`;
    s += `<text x="${PAD.left - 8}" y="${py + 4}" class="achse" text-anchor="end">${fmtEURKompakt(wert)}</text>`;
  }

  // X-Labels: alle 5 Jahre das Kalenderjahr
  const startJahr = state.config.zeit.startJahr;
  for (let m = 0; m <= xMax; m += 60) {
    s += `<text x="${x(m)}" y="${VB.h - 10}" class="achse" text-anchor="middle">${startJahr + m / 12}</text>`;
  }

  // Linien
  const pfad = (schluessel) => hist.map((h) => `${x(h.monat).toFixed(1)},${y(h[schluessel]).toFixed(1)}`).join(' ');
  if (hist.length >= 2) {
    s += `<polyline points="${pfad('etf')}" class="linie" style="stroke:${FARBEN.etf}"/>`;
    s += `<polyline points="${pfad('nettovermoegen')}" class="linie" style="stroke:${FARBEN.netto}"/>`;
  }

  // Direktlabels am Linienende (Text in Tinte, Farbe nur am Punkt)
  if (hist.length >= 2) {
    const letzte = hist[hist.length - 1];
    let yNetto = y(letzte.nettovermoegen);
    let yEtf = y(letzte.etf);
    if (Math.abs(yNetto - yEtf) < 38) {
      const mitte = (yNetto + yEtf) / 2;
      const nettoUnten = yNetto >= yEtf;
      yNetto = mitte + (nettoUnten ? 19 : -19);
      yEtf = mitte + (nettoUnten ? -19 : 19);
    }
    const px = x(letzte.monat);
    s += endLabel(px, y(letzte.nettovermoegen), yNetto, FARBEN.netto, 'Nettovermögen', letzte.nettovermoegen);
    s += endLabel(px, y(letzte.etf), yEtf, FARBEN.etf, 'ETF-Benchmark brutto', letzte.etf);
  }

  // Hover: Fadenkreuz
  if (hoverMonat !== null && hist.length >= 2) {
    const idx = Math.min(hoverMonat, hist.length - 1);
    const h = hist[idx];
    const px = x(h.monat);
    s += `<line x1="${px}" y1="${PAD.top}" x2="${px}" y2="${PAD.top + ih}" class="fadenkreuz"/>`;
    s += `<circle cx="${px}" cy="${y(h.nettovermoegen)}" r="4" fill="${FARBEN.netto}" class="ring"/>`;
    s += `<circle cx="${px}" cy="${y(h.etf)}" r="4" fill="${FARBEN.etf}" class="ring"/>`;
  }

  svg.setAttribute('viewBox', `0 0 ${breite} ${VB.h}`);
  svg.style.width = `${breite}px`;
  const letzte = hist.at(-1);
  svg.setAttribute('aria-label', letzte
    ? `Vermögensverlauf. Aktuell Nettovermögen ${fmtEUR(letzte.nettovermoegen)}, ETF-Benchmark brutto ${fmtEUR(letzte.etf)}.`
    : 'Verlauf von Nettovermögen und Brutto-ETF-Benchmark.');
  svg.innerHTML = s;
  renderTooltip(state, x, y);
}

function endLabel(px, punktY, labelY, farbe, name, wert) {
  return (
    `<circle cx="${px}" cy="${punktY}" r="4" fill="${farbe}" class="ring"/>` +
    `<text x="${px + 11}" y="${labelY - 3}" class="endlabel-name">${name}</text>` +
    `<text x="${px + 11}" y="${labelY + 15}" class="endlabel-wert">${fmtEURKompakt(wert)}</text>`
  );
}

function renderZusatzCharts(state) {
  const objekte = [...state.portfolio, ...(state.eigenheim ? [state.eigenheim] : [])];
  const immobilien = objekte.reduce((summe, objekt) => summe + fairerWert(state, objekt), 0);
  const ruecklagen = objekte.reduce((summe, objekt) => summe + (objekt.ruecklage || 0), 0);
  const schulden = objekte.reduce((summe, objekt) => summe + (objekt.darlehen?.restschuld || 0), 0);
  const cash = Math.max(0, state.cash);
  const etf = Math.max(0, state.etfDepot?.wert || 0);
  const teile = [
    ['Tagesgeld', cash, 'mix-cash'],
    ['ETF-Depot', etf, 'mix-etf'],
    ['Immobilien', immobilien, 'mix-immo'],
    ['Rücklagen', ruecklagen, 'mix-ruecklage'],
  ];
  const brutto = Math.max(1, teile.reduce((summe, [, wert]) => summe + wert, 0));
  const mix = teile
    .filter(([, wert]) => wert > 0)
    .map(([name, wert, klasse]) => `<i class="${klasse}" style="width:${(wert / brutto * 100).toFixed(2)}%" title="${name}: ${fmtEUR(Math.round(wert))}"></i>`)
    .join('');
  const legende = teile
    .filter(([, wert]) => wert > 0)
    .map(([name, wert, klasse]) => `<span><i class="${klasse}"></i>${name} ${fmtEURKompakt(wert)}</span>`)
    .join('');

  const haushalt = monatsWerte(state);
  const grundkosten = Math.max(1, haushalt.miete + haushalt.lebenshaltung + haushalt.kinder +
    (state.eigenheim ? eigenheimMonatskosten(state) : 0));
  const pufferMonate = Math.max(0, state.cash / grundkosten);
  const ltv = immobilien > 0 ? schulden / immobilien * 100 : 0;
  const ltvBreite = Math.max(0, Math.min(100, ltv));
  const pufferBreite = Math.max(0, Math.min(100, pufferMonate / 6 * 100));

  document.getElementById('chart-zusatz').innerHTML =
    `<section class="mini-chart" aria-label="Vermögensmix: Bruttovermögen ${fmtEUR(Math.round(brutto))}">` +
      `<header><h3>Vermögensmix</h3><b>${fmtEURKompakt(brutto)} brutto</b></header>` +
      `<div class="mix-balken">${mix}</div><div class="mini-legende">${legende}</div></section>` +
    `<section class="mini-chart" aria-label="Schuldenquote ${Math.round(ltv)} Prozent, Liquiditätspuffer ${pufferMonate.toFixed(1)} Monate">` +
      `<header><h3>Schulden &amp; Puffer</h3><b>${fmtEURKompakt(schulden)} Restschuld</b></header>` +
      `<div class="risiko-zeilen">` +
        `<div class="risiko-zeile"><span>Finanzierungsquote</span><div class="risiko-track"><i style="width:${ltvBreite.toFixed(1)}%"></i></div><b>${immobilien ? `${Math.round(ltv)} %` : '—'}</b></div>` +
        `<div class="risiko-zeile"><span>Liquidität</span><div class="risiko-track"><i class="puffer" style="width:${pufferBreite.toFixed(1)}%"></i></div><b>${pufferMonate.toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mon.</b></div>` +
      `</div></section>`;
}

function renderTooltip(state, x, y) {
  const tip = document.getElementById('chart-tooltip');
  const hist = chartHistorie(state);
  if (hoverMonat === null || hist.length < 2) {
    tip.hidden = true;
    return;
  }
  const idx = Math.min(hoverMonat, hist.length - 1);
  const h = hist[idx];
  const d = new Date(state.config.zeit.startJahr, state.config.zeit.startMonat - 1 + h.monat, 1);

  tip.innerHTML =
    `<div class="tip-titel">${fmtDatum(d)}</div>` +
    `<div class="tip-zeile"><span class="punkt" style="background:${FARBEN.netto}"></span>Nettovermögen <b>${fmtEUR(h.nettovermoegen)}</b></div>` +
    `<div class="tip-zeile"><span class="punkt" style="background:${FARBEN.etf}"></span>ETF-Benchmark brutto <b>${fmtEUR(h.etf)}</b></div>` +
    `<div class="tip-zeile muted">Cashflow ${fmtEURSigniert(h.cashflow)}</div>`;
  tip.hidden = false;

  // Position: rechts vom Cursor, am Rand nach links klappen.
  const wrap = tip.parentElement.getBoundingClientRect();
  const svgEl = document.getElementById('chart');
  const r = svgEl.getBoundingClientRect();
  const chartBreite = svgEl.viewBox.baseVal.width || VB.w;
  const px = (x(h.monat) / chartBreite) * r.width + (r.left - wrap.left);
  const py = (y(Math.max(h.nettovermoegen, h.etf)) / VB.h) * r.height + (r.top - wrap.top);
  const links = px > wrap.width * 0.62;
  tip.style.left = links ? `${px - tip.offsetWidth - 14}px` : `${px + 14}px`;
  tip.style.top = `${Math.max(4, py - 10)}px`;
}

function onHover(ev) {
  const state = getState && getState();
  if (!state) return;
  const hist = chartHistorie(state);
  if (hist.length < 2) return;
  const svg = document.getElementById('chart');
  const r = svg.getBoundingClientRect();
  const chartBreite = svg.viewBox.baseVal.width || VB.w;
  const vx = ((ev.clientX - r.left) / r.width) * chartBreite;
  const xMax = Math.max(state.monat, 60);
  const iw = chartBreite - PAD.left - PAD.right;
  const monat = Math.round(((vx - PAD.left) / iw) * xMax);
  hoverMonat = Math.max(0, Math.min(monat, hist.length - 1));
  renderChart(state);
}
