// finanzierung.js — Screen 4: Finanzierungsdialog. Slider für Eigenkapital,
// Tilgung, Zinsbindung; live berechnetes Angebot + Haushaltsrechnungs-Verdikt.
// Modus 'szenario' = reiner Rechner, Modus 'kauf' = mit Kaufabschluss.

import { getListing } from '../content.js?v=60';
import {
  finanzierungsCashflowPfade, finanzierungsCashflowVorschau, kreditAngebot, kaufeObjekt, nebenkostenFuer,
} from '../finance.js?v=60';
import { kaufeEigenheim, wohnortWechselVorschau } from '../eigenheim.js?v=60';
import { fmtEUR, fmtEURSigniert } from './util.js?v=60';
import { eigenheimEignung, fixkostenMonat, instandhaltungMonat } from '../immobilie.js?v=60';
import { etfVerkaufVorschau } from '../etf.js?v=60';
import { angesetzteMiete } from '../tenants.js?v=60';
import { fixkostenAufschluesselung } from '../immobilie.js?v=60';
import { angebotsBestandsmiete } from '../market.js?v=60';
import { aktuellerBetrag, preisniveau } from '../preisniveau.js?v=60';
import { haushaltsUeberschussMonat, liquiditaetsBasisMonat, liquiditaetsPufferMonate } from './kennzahlen.js?v=60';

let ctx = null;
let lage = null; // { listingId, kaufpreis, modus }
let nachKaufAuswahl = null;
let bankStep = 1;

export function initFinanzierung(context) {
  ctx = context;
  const dlg = document.getElementById('dlg-finanzierung');
  dlg.addEventListener('input', (ev) => {
    if (ev.target.id === 'fin-etf-betrag') {
      document.getElementById('fin-etf-betrag-zahl').value = ev.target.value;
      renderEtfVerkauf(ctx.getState());
    } else if (ev.target.id === 'fin-etf-betrag-zahl') {
      const slider = document.getElementById('fin-etf-betrag');
      slider.value = Math.max(0, Math.min(Number(slider.max), Number(ev.target.value) || 0));
      renderEtfVerkauf(ctx.getState());
    } else if (ev.target.matches('input')) render();
  });
  dlg.querySelectorAll('[data-ek-prozent]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!lage) return;
      const input = document.getElementById('form-finanzierung').elements.eigenkapital;
      input.value = ekSchnellZiel(ctx.getState(), Number(btn.dataset.ekProzent));
      render();
    });
  });
  dlg.querySelectorAll('[data-fin-step]').forEach((button) => {
    button.addEventListener('click', () => setzeBankStep(Number(button.dataset.finStep)));
  });
  document.getElementById('btn-fin-weiter').addEventListener('click', () => setzeBankStep(Math.min(2, bankStep + 1)));
  document.getElementById('btn-fin-zurueck').addEventListener('click', () => setzeBankStep(Math.max(1, bankStep - 1)));
  document.getElementById('btn-fin-etf').addEventListener('click', () => {
    const betrag = Number(document.getElementById('fin-etf-betrag').value) || 0;
    if (betrag <= 0 || !ctx.etfVerkaufen(betrag)) return;
    aktualisiereEkGrenzen(ctx.getState());
    render();
  });
  document.getElementById('btn-kaufen').addEventListener('click', abschliessen);
  document.getElementById('dlg-kauf-ok').addEventListener('click', () => {
    const dialog = document.getElementById('dlg-kauf');
    dialog.close();
    dialog.classList.remove('kauf-feier');
    if (nachKaufAuswahl) ctx.oeffneObjekt(nachKaufAuswahl);
    nachKaufAuswahl = null;
  });
}

export function oeffneFinanzierung({ listingId, kaufpreis, modus }) {
  const state = ctx.getState();
  lage = { listingId, kaufpreis, modus };
  const f = document.getElementById('form-finanzierung');
  const maxEk = aktualisiereEkGrenzen(state);
  f.elements.eigenkapital.value = ekVorschlag(state, maxEk);
  f.elements.tilgung.value = 2;
  f.elements.zinsbindung.value = '10';
  f.elements.nutzung.value = 'kapitalanlage';
  const listing = getListing(listingId);
  const eignung = eigenheimEignung(state, listing);
  const kannEigenheim = eignung.geeignet && !state.eigenheim;
  document.getElementById('fin-nutzung').hidden = false;
  const eigenheimRadio = f.querySelector('input[name="nutzung"][value="eigenheim"]');
  eigenheimRadio.disabled = !kannEigenheim;
  const grund = state.eigenheim
    ? 'Ihr besitzt bereits ein Eigenheim.'
    : !eignung.geeignet
      ? `Nicht als Familienheim geeignet: ${eignung.gruende.join(', ')}.`
      : 'Als Eigenheim entfallen die bisherigen Mietkosten; Kredit, laufende Eigentümerkosten und Rücklage treten an ihre Stelle.';
  const eigenheimOption = document.getElementById('fin-option-eigenheim');
  const eigenheimInfo = document.getElementById('fin-eigenheim-info');
  eigenheimOption.classList.toggle('gesperrt', !kannEigenheim);
  eigenheimOption.setAttribute('aria-disabled', String(!kannEigenheim));
  eigenheimOption.title = kannEigenheim ? 'Dieses Objekt als Eigenheim nutzen.' : grund;
  eigenheimInfo.hidden = kannEigenheim;
  eigenheimInfo.dataset.tooltip = grund;
  eigenheimInfo.setAttribute('aria-label', `Warum Eigenheim nicht möglich ist: ${grund}`);
  const nutzungHinweis = document.getElementById('fin-nutzung-hinweis');
  nutzungHinweis.textContent = grund;
  nutzungHinweis.classList.toggle('gesperrt', !kannEigenheim);
  document.getElementById('dlg-finanzierung').showModal();
  setzeBankStep(1);
  render();
}

// Startwert des Eigenkapital-Reglers: Nebenkosten + 20 %, aber nie so viel,
// dass weniger als `kredit.vorschlagRestpufferMonate` Monatsausgaben auf dem
// Tagesgeld bleiben. Reicht das nicht einmal für die Nebenkosten, schlägt der
// Regler genau diese vor (die Bank finanziert sie nicht). Der Spieler kann
// jederzeit frei höher oder niedriger gehen.
function ekVorschlag(state, maxEk) {
  const pufferMonate = state.config.kredit.vorschlagRestpufferMonate ?? 3;
  const freiNachPuffer = Math.floor(
    Math.max(0, state.cash - pufferMonate * liquiditaetsBasisMonat(state)) / 100) * 100;
  const nurNebenkosten = ekSchnellZiel(state, 0);
  return Math.min(maxEk, ekSchnellZiel(state, 20), Math.max(nurNebenkosten, freiNachPuffer));
}

function ekSchnellZiel(state, kaufpreisAnteil) {
  if (!lage) return 0;
  const listing = getListing(lage.listingId);
  const nk = nebenkostenFuer(state, listing, lage.kaufpreis);
  return Math.round((nk.summe + lage.kaufpreis * kaufpreisAnteil / 100) / 100) * 100;
}

function setzeBankStep(step) {
  bankStep = Math.max(1, Math.min(2, step));
  document.querySelectorAll('[data-fin-step]').forEach((button) => {
    const aktiv = Number(button.dataset.finStep) === bankStep;
    button.classList.toggle('aktiv', aktiv);
    if (aktiv) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  document.querySelectorAll('[data-fin-step-panel]').forEach((panel) => {
    panel.hidden = Number(panel.dataset.finStepPanel) !== bankStep;
  });
  document.getElementById('btn-fin-zurueck').hidden = bankStep === 1;
  document.getElementById('btn-fin-weiter').hidden = bankStep === 2;
  document.getElementById('btn-fin-schliessen').hidden = bankStep !== 1;
  const kaufen = document.getElementById('btn-kaufen');
  kaufen.hidden = bankStep !== 2 || lage?.modus !== 'kauf';
}

function infoTooltip(text, label = 'Erklärung anzeigen') {
  return `<button type="button" class="info-tooltip" aria-label="${label}" data-tooltip="${text}">?</button>`;
}

function werte() {
  const f = document.getElementById('form-finanzierung');
  return {
    eigenkapital: Number(f.elements.eigenkapital.value),
    tilgungssatz: Number(f.elements.tilgung.value) / 100,
    zinsbindungJahre: Number(f.elements.zinsbindung.value),
    nutzung: f.elements.nutzung.value || 'kapitalanlage',
  };
}

function aktualisiereEkGrenzen(state) {
  const maxEk = Math.max(0, Math.floor(state.cash / 100) * 100);
  const input = document.getElementById('form-finanzierung').elements.eigenkapital;
  input.max = maxEk;
  document.querySelectorAll('[data-ek-prozent]').forEach((btn) => {
    const ziel = lage ? ekSchnellZiel(state, Number(btn.dataset.ekProzent)) : 0;
    btn.disabled = ziel > maxEk;
    btn.title = btn.disabled ? `Dafür wären ${fmtEUR(ziel)} Tagesgeld nötig.` : `${fmtEUR(ziel)} insgesamt einsetzen`;
  });
  const etfInput = document.getElementById('fin-etf-betrag');
  etfInput.max = Math.floor(state.etfDepot.wert);
  etfInput.value = Math.min(Math.floor(state.etfDepot.wert), Math.max(0, Math.round(((lage?.kaufpreis || 0) * .2 - state.cash) / 100) * 100 || Math.floor(state.etfDepot.wert)));
  const etfZahl = document.getElementById('fin-etf-betrag-zahl');
  etfZahl.max = etfInput.max;
  etfZahl.value = etfInput.value;
  const liquidation = etfVerkaufVorschau(state, state.etfDepot.wert);
  document.getElementById('fin-etf-stand').textContent = `${fmtEUR(state.etfDepot.wert)} Marktwert · ` +
    `${fmtEUR(liquidation.ok ? liquidation.netto : 0)} nach aktueller Steuer verfügbar.`;
  document.getElementById('btn-fin-etf').disabled = state.etfDepot.wert < 1;
  renderEtfVerkauf(state);
  return maxEk;
}

function renderEtfVerkauf(state) {
  const betrag = Number(document.getElementById('fin-etf-betrag').value) || 0;
  const vorschau = etfVerkaufVorschau(state, betrag);
  document.getElementById('fin-etf-betrag-wert').textContent = fmtEUR(betrag);
  // etfVerkaufVorschau begrenzt auf den Depotwert; „nicht ok" heißt nur
  // 0 € oder kein Depot, nie „zu hoch".
  const depotWert = state.etfDepot?.wert || 0;
  document.getElementById('fin-etf-vorschau').textContent = vorschau.ok
    ? `${fmtEUR(vorschau.netto)} netto · ${fmtEUR(vorschau.steuer)} Steuer` +
      (betrag > depotWert ? ' · auf den Depotwert begrenzt' : '')
    : depotWert < 1 ? 'Kein ETF-Depot vorhanden.' : '0 € netto · 0 € Steuer';
}

function render() {
  if (!lage) return;
  const state = ctx.getState();
  const listing = getListing(lage.listingId);
  const { eigenkapital, tilgungssatz, zinsbindungJahre, nutzung } = werte();
  const a = kreditAngebot(state, {
    listingId: lage.listingId, kaufpreis: lage.kaufpreis,
    eigenkapital, tilgungssatz, zinsbindungJahre, nutzung,
  });

  document.getElementById('fin-titel').textContent =
    (lage.modus === 'kauf' ? 'Finanzierung: ' : 'Finanzierungsprüfung: ') + listing.titel +
    (nutzung === 'eigenheim' ? ' · Eigenheim' : '');
  const wohnort = wohnortWechselVorschau(state, listing);
  const nutzungHinweis = document.getElementById('fin-nutzung-hinweis');
  if (nutzung === 'eigenheim' && wohnort.wechsel) {
    nutzungHinweis.textContent = `Wohnortwechsel nach ${wohnort.zielLabel}: Das modellierte Haushaltsnetto ändert sich von ${fmtEUR(wohnort.aktuell)} auf ${fmtEUR(wohnort.danach)} pro Monat (${fmtEURSigniert(wohnort.differenz)}).`;
    nutzungHinweis.classList.add('warnung');
  } else {
    nutzungHinweis.textContent = nutzung === 'eigenheim'
      ? 'Das Objekt liegt am bisherigen Wohnort; das regionale Erwerbseinkommen bleibt unverändert.'
      : 'Als Kapitalanlage verändert das Objekt euren Wohn- und Arbeitsort nicht.';
    nutzungHinweis.classList.remove('warnung');
  }

  document.getElementById('fin-ek-quote').textContent = fmtEUR(eigenkapital);
  document.querySelectorAll('[data-ek-prozent]').forEach((btn) => {
    const ziel = ekSchnellZiel(state, Number(btn.dataset.ekProzent));
    const aktiv = Math.abs(eigenkapital - ziel) < 50;
    btn.classList.toggle('aktiv', aktiv);
    btn.setAttribute('aria-pressed', String(aktiv));
  });
  aktualisiereEkGrenzen(state);

  document.getElementById('fin-slider-werte').innerHTML =
    `<span>Eigenkapital gesamt <b>${fmtEUR(eigenkapital)}</b></span>` +
    `<span>Restpuffer <b>${fmtEUR(Math.max(0, state.cash - eigenkapital))}</b> · ${liquiditaetsPufferMonate({ ...state, cash: Math.max(0, state.cash - eigenkapital) }).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mon.</span>` +
    `<span>Anfangstilgung <b>${(tilgungssatz * 100).toFixed(2).replace('.', ',')} %</b></span>`;

  const ltvProzent = Math.max(0, a.ltv * 100);
  const ltvBreite = Math.min(100, ltvProzent);
  const ltvKlasse = ltvProzent <= 60 ? 'stabil' : ltvProzent <= 80 ? 'angespannt' : 'riskant';
  document.getElementById('fin-ltv-viz').innerHTML =
    `<div><span>Finanzierungsquote zum Kaufpreis ${infoTooltip('Darlehen ÷ Kaufpreis. Nach dem Kauf misst die Zentrale die Restschuld am heutigen Marktwert; liegt der Kaufpreis über dem Marktwert, ist jener Wert höher. Je höher die Quote, desto größer sind Hebel und Risiko.', 'Finanzierungsquote erklären')}</span><b>${ltvProzent.toFixed(0)} %</b></div>` +
    `<div class="ltv-track" aria-label="Finanzierungsquote ${ltvProzent.toFixed(0)} Prozent"><i class="${ltvKlasse}" style="width:${ltvBreite.toFixed(1)}%"></i></div>`;

  const nk = a.nebenkosten;
  const prozent = (wert) => `${(wert * 100).toFixed(2).replace('.', ',')} %`;
  const zinsErklaerung = a.zinsBestandteile
    ? `Markt-Basiszins ${prozent(a.zinsBestandteile.basiszins)} + ` +
      `Aufschlag für Finanzierungsquote ${prozent(a.zinsBestandteile.ltvSpread)} + ` +
      `Zinsbindungs-Aufschlag ${prozent(a.zinsBestandteile.bindungsaufschlag)}`
    : '';
  document.getElementById('fin-rechnung').innerHTML =
    `<tr class="fin-gruppe"><th colspan="2">Kauf</th></tr>` +
    `<tr><td>Kaufpreis</td><td>${fmtEUR(lage.kaufpreis)}</td></tr>` +
    `<tr><td>Nebenkosten · sofort weg</td><td>${fmtEUR(Math.round(nk.summe))}</td></tr>` +
    `<tr class="summe"><td>Eigenkapital gesamt</td><td>${fmtEUR(eigenkapital)}</td></tr>` +
    `<tr class="fin-gruppe"><th colspan="2">Kredit</th></tr>` +
    `<tr class="summe"><td>Darlehen ` +
      `<button type="button" class="info-tooltip" ` +
      `aria-label="Finanzierungsquote erklären" ` +
      `data-tooltip="Darlehen ÷ Kaufpreis. Nach dem Kauf misst die Zentrale die Restschuld am heutigen Marktwert; liegt der Kaufpreis über dem Marktwert, ist jener Wert höher. Je höher die Quote, desto größer sind Hebel und Risiko.">?</button></td>` +
      `<td>${fmtEUR(Math.round(a.darlehen))}</td></tr>` +
    (a.zins !== null
      ? `<tr><td>Sollzins <button type="button" class="info-tooltip" ` +
        `aria-label="Info: Der Sollzins setzt sich aus Markt-Basiszins, Beleihung und Zinsbindung zusammen." ` +
        `data-tooltip="Der Basiszins bewegt sich mit dem Markt. Mehr Eigenkapital senkt den Aufschlag für die Finanzierungsquote; eine andere Zinsbindung ändert den Bindungsaufschlag.">?</button></td>` +
        `<td>${prozent(a.zins)} p.a.</td></tr>` +
        `<tr class="fin-zins-erklaerung"><td colspan="2">${zinsErklaerung}</td></tr>` +
        `<tr class="summe"><td>Monatsrate</td><td>${fmtEUR(Math.round(a.rate))}</td></tr>` +
        `<tr><td>Restschuld nach ${a.zinsbindungJahre} J.</td><td>${fmtEUR(Math.round(a.restschuldNachBindung))}</td></tr>`
      : '');

  const verdikt = document.getElementById('fin-verdikt');
  const vorschau = finanzierungsCashflowVorschau(state, a);
  const klasse = (wert) => wert > .5 ? 'positiv' : wert < -.5 ? 'negativ' : 'neutral';
  const zeile = (label, wert, vorzeichen = '−') =>
    `<span class="fin-cashflow-zeile"><span><i>${vorzeichen}</i>${label}</span>` +
    `<b class="${klasse(wert)}">${fmtEURSigniert(Math.round(wert))}</b></span>`;
  let monatsbild = '';
  if (vorschau) {
    const istEigenheim = nutzung === 'eigenheim';
    const aktuellVermietet = !istEigenheim && !!listing.mietstatus?.vermietet;
    const fixLeer = fixkostenMonat(state, listing, false);
    const fixVermietet = fixkostenMonat(state, listing, true);
    const ruecklage = instandhaltungMonat(state, listing);
    const mieteGeplant = istEigenheim ? 0 : aktuellVermietet
      ? angebotsBestandsmiete(state, listing)
      : angesetzteMiete(state, listing, 'auf', 'regulaer');
    const objektJetzt = istEigenheim
      ? vorschau.mietersparnis - vorschau.rate - fixLeer - ruecklage
      : (aktuellVermietet ? mieteGeplant - fixVermietet : -fixLeer) - vorschau.rate - ruecklage;
    const objektGeplant = istEigenheim
      ? objektJetzt
      : mieteGeplant - fixVermietet - vorschau.rate - ruecklage;
    const steuerErgebnisGeplant = istEigenheim ? 0 : mieteGeplant - vorschau.zinsanteil - fixVermietet - vorschau.afa;
    const steuerGeplant = steuerErgebnisGeplant * state.steuer.grenzsatz;
    const haushaltBasis = haushaltsUeberschussMonat(state);
    const haushaltDanach = haushaltBasis + objektGeplant + vorschau.cashzinsAenderung - steuerGeplant;
    const wegGesamt = listing.objektart === 'wohnung'
      ? aktuellerBetrag(state, Number(listing.hausgeld)) || fixkostenAufschluesselung(listing, preisniveau(state)).reduce((summe, posten) => summe + posten.betrag, 0)
      : null;
    const wegAufteilung = wegGesamt === null ? '' :
      `<details class="weg-aufteilung"><summary>WEG-Kosten aufteilen</summary>` +
      zeile('Hausgeld gesamt an die WEG', -wegGesamt) +
      zeile('voraussichtlich umlagefähig', Math.max(0, wegGesamt - fixVermietet), '+') +
      zeile('nicht umlegbarer Owner-Anteil', -fixVermietet) +
      zeile('zusätzliche Objektrücklage', -ruecklage) +
      `${infoTooltip('Umlagefähigkeit und Rücklagen sind vereinfachte Spielannahmen; die zusätzliche Rücklage betrifft das Sondereigentum.', 'WEG-Kosten erklären')}</details>`;
    const steuerZeile = Math.abs(steuerGeplant) > .5
      ? zeile(steuerGeplant < 0
        ? `Steuergutschrift (${Math.round(state.steuer.grenzsatz * 100)} %, vereinfacht)`
        : `Steuerrückstellung (${Math.round(state.steuer.grenzsatz * 100)} %, geschätzt)`, -steuerGeplant, steuerGeplant < 0 ? '+' : '−')
      : `<span class="fin-cashflow-zeile steuer-null"><span>Keine Steuerwirkung in dieser Szenariorechnung.</span><b>0 €</b></span>`;
    const szenario = (titel, miete, kosten, objektCashflow, geplant = false) =>
      `<section class="fin-szenario ${geplant ? 'geplant' : ''}"><h4>${titel}</h4>` +
      (istEigenheim ? zeile('entfallende Warmmiete', vorschau.mietersparnis, '+') : zeile(miete ? 'Kaltmiete' : 'Miete im Leerstand', miete, '+')) +
      zeile(listing.objektart === 'haus' ? 'Owner-Kosten' : 'Owner-Anteil / Hausgeld', -kosten) +
      zeile('Objektrücklage', -ruecklage) +
      zeile('Kreditrate', -vorschau.rate) +
      `<strong class="fin-cashflow-summe haupt"><span>Objekt-Cashflow</span><b class="${klasse(objektCashflow)}">${fmtEURSigniert(Math.round(objektCashflow))}</b></strong></section>`;
    const perspektive = istEigenheim ? null : finanzierungsCashflowPfade(state, a);
    const pfad = perspektive?.empfehlung;
    let pfadUrteil = '';
    if (pfad) {
      const aktionen = pfad.aktionen.length ? pfad.aktionen.join(' → ') : pfad.label;
      const titel = pfad.cashflow >= 0
        ? `Tragfähiger Pfad: ${fmtEURSigniert(Math.round(pfad.cashflow))}/Monat nach Steuer`
        : pfad.cashflow >= -perspektive.naheNull
          ? `Nahe Break-even: ${fmtEURSigniert(Math.round(pfad.cashflow))}/Monat nach Steuer`
          : `Auch stabilisiert untragfähig: ${fmtEURSigniert(Math.round(pfad.cashflow))}/Monat nach Steuer`;
      const einmalig = pfad.einmalig > 0 ? ` Einmalig rund ${fmtEUR(Math.round(pfad.einmalig))}` + (pfad.dauer ? ` und ${pfad.dauer} Monate Umbau` : '') + '.' : '';
      pfadUrteil = `<output class="fin-pfad-urteil ${pfad.urteil}" aria-label="Bewertung des Bewirtschaftungspfads">` +
        `<b>${titel}</b><span>${aktionen}.${einmalig}</span>` +
        (pfad.risiko ? infoTooltip(pfad.risiko, 'Risiken dieses Bewirtschaftungspfads erklären') : '') + `</output>`;
    }
    const bruch = perspektive?.rechtsbruch;
    if (bruch) {
      pfadUrteil += `<output class="fin-pfad-urteil rechtsbruch" aria-label="Rechtswidriger Pfad">` +
        `<b>Nur mit Rechtsbruch: ${fmtEURSigniert(Math.round(bruch.cashflow))}/Monat nach Steuer</b>` +
        `<span>Miete ${fmtEUR(Math.round(bruch.miete))} statt gedeckelt; hält nur, solange niemand rügt.</span>` +
        infoTooltip(bruch.risiko, 'Risiken des Verstoßes gegen die Mietpreisbremse erklären') + `</output>`;
    }
    monatsbild = `<div class="fin-monatsvergleich"><header><b>Objekt pro Monat ${infoTooltip('Typische Monatswerte für dieses Szenario. Einmalige Kosten, Leerstand und spätere Änderungen sind nicht vollständig enthalten; die Miete ist keine Garantie.', 'Monatsvorschau erklären')}</b></header>` +
      `<div class="fin-szenarien">${szenario(vorschau.leerstand ? 'Bis zur Vermietung' : istEigenheim ? 'Als Eigenheim' : 'Mit Bestandsmiete', aktuellVermietet ? mieteGeplant : 0, aktuellVermietet ? fixVermietet : fixLeer, objektJetzt)}` +
      (vorschau.leerstand ? szenario('Nach geplanter Vermietung', mieteGeplant, fixVermietet, objektGeplant, true) : '') +
      `</div>${pfadUrteil}${wegAufteilung}${steuerZeile}` +
      `<div class="fin-haushalt-wirkung"><span><small>Cashflow heute</small><b>${fmtEURSigniert(Math.round(haushaltBasis))}</b></span>` +
      `<i>→</i><span><small>nach Kauf${vorschau.leerstand ? ' & Vermietung' : ''}</small><b class="${klasse(haushaltDanach)}">${fmtEURSigniert(Math.round(haushaltDanach))}</b></span></div></div>`;
  }
  if (a.zusage) {
    verdikt.className = 'verdikt ok';
    verdikt.innerHTML =
      `<b>Die Bank sagt zu.</b> Rate ${fmtEUR(Math.round(a.rate))} bei ` +
      `${fmtEUR(Math.round(a.spielraum))} Spielraum laut Haushaltsrechnung.${monatsbild}`;
  } else {
    verdikt.className = 'verdikt abgelehnt';
    verdikt.innerHTML =
      `<b>So finanziert die Bank nicht:</b><ul>` +
      a.gruende.map((g) => `<li>${g}</li>`).join('') + `</ul>${monatsbild}`;
  }

  const kaufen = document.getElementById('btn-kaufen');
  kaufen.hidden = bankStep !== 2 || lage.modus !== 'kauf';
  kaufen.disabled = !a.zusage;
  document.getElementById('fin-hinweis').textContent =
    lage.modus === 'szenario'
      ? 'Nur ein Rechenszenario — es wird nichts gekauft.'
      : '';
  setzeBankStep(bankStep);
}

function abschliessen() {
  const state = ctx.getState();
  const a = kreditAngebot(state, { listingId: lage.listingId, kaufpreis: lage.kaufpreis, ...werte() });
  if (!a.zusage) return;
  if (a.nutzung === 'eigenheim') {
    const wechsel = wohnortWechselVorschau(state, a.listing);
    if (wechsel.wechsel && !window.confirm(`Mit dem Eigenheim zieht ihr nach ${wechsel.zielLabel}. Das modellierte Haushaltsnetto ändert sich um ${fmtEURSigniert(wechsel.differenz)} pro Monat. Trotzdem kaufen?`)) return;
  }
  const objekt = a.nutzung === 'eigenheim' ? kaufeEigenheim(state, a) : kaufeObjekt(state, a);
  document.getElementById('dlg-finanzierung').close();

  // Der "dieses Geld ist weg"-Moment (PLAN §5.4)
  const nk = a.nebenkosten;
  document.getElementById('dlg-kauf-inhalt').innerHTML =
    `<p><b>${objekt.titel}</b> gehört euch${a.nutzung === 'eigenheim' ? ' — als neues Eigenheim' : ''}. Beim Notar sind geflossen:</p>` +
    `<table class="ende-tabelle">` +
    `<tr><td>Kaufpreis</td><td>${fmtEUR(a.kaufpreis)}</td></tr>` +
    `<tr><td>Grunderwerbsteuer</td><td>${fmtEUR(Math.round(nk.grESt))}</td></tr>` +
    `<tr><td>Notar & Grundbuch</td><td>${fmtEUR(Math.round(nk.notar))}</td></tr>` +
    (nk.makler > 0 ? `<tr><td>Makler</td><td>${fmtEUR(Math.round(nk.makler))}</td></tr>` : '') +
    `<tr class="summe"><td>Nebenkosten gesamt</td><td>${fmtEUR(Math.round(nk.summe))}</td></tr>` +
    `</table>` +
    `<p class="muted">Die ${fmtEUR(Math.round(nk.summe))} Nebenkosten sind weg — sie stecken in ` +
    `keinem Vermögenswert. ${a.nutzung === 'eigenheim'
      ? 'Eure bisherige Wohnmiete entfällt; Hausgeld, Rücklage und Kreditrate werden sichtbar gegenübergestellt.'
      : 'Das Objekt steht ab sofort mit Marktwert und Restschuld in eurem Portfolio.'}</p>`;
  const kaufDialog = document.getElementById('dlg-kauf');
  kaufDialog.classList.remove('kauf-feier');
  void kaufDialog.offsetWidth;
  kaufDialog.classList.add('kauf-feier');
  kaufDialog.showModal();

  nachKaufAuswahl = a.nutzung === 'eigenheim' ? 'eigenheim' : objekt.listingId;
  ctx.autosave();
  ctx.zeigeScreen('dashboard');
  ctx.toast(a.nutzung === 'eigenheim' ? 'Eigenheim gekauft — die Wohnkosten sind jetzt neu aufgeteilt.' : 'Objekt gekauft — als Nächstes bewirtschaften.');
  lage = null;
}

