// finanzen.js — UI für Tagesgeldkonto, echtes ETF-Depot und Sparplan.
// Die vermögensneutralen Buchungen selbst bleiben DOM-frei in etf.js.

import { monatsWerte, nettovermoegen } from '../engine.js?v=58';
import { fmtEUR, fmtEURSigniert } from './util.js?v=58';
import { etfVerkaufVorschau } from '../etf.js?v=58';
import { kapitalertragVorschau, renditeNachSteuer } from '../kapitalsteuer.js?v=58';
import { fairerWert } from '../market.js?v=58';
import { haushaltsUeberschussMonat, liquiditaetsPufferMonate } from './kennzahlen.js?v=58';

let ctx;

export function initFinanzen(context) {
  ctx = context;
  const transfer = document.getElementById('fin-transfer');
  transfer.addEventListener('input', () => renderTransferVorschau(ctx.getState()));
  document.getElementById('form-etf-transfer').addEventListener('submit', (event) => {
    event.preventDefault();
    const betrag = Number(transfer.value);
    const erfolgreich = betrag > 0
      ? ctx.etfKaufen(betrag)
      : betrag < 0 && ctx.etfVerkaufen(Math.abs(betrag));
    if (!erfolgreich) return;
    transfer.value = '0';
    renderTransferVorschau(ctx.getState());
  });

  const sparplan = document.getElementById('fin-sparplan');
  sparplan.addEventListener('input', () => renderSparplanVorschau(ctx.getState()));
  document.getElementById('form-sparplan').addEventListener('submit', (event) => {
    event.preventDefault();
    ctx.sparplanSetzen(Number(sparplan.value) / 100);
  });

}

export function renderFinanzen(state) {
  const cash = Number(state.cash) || 0;
  const etf = Number(state.etfDepot?.wert) || 0;
  const liquideAnlagen = cash + etf;
  const werte = monatsWerte(state);
  const puffer = liquiditaetsPufferMonate(state);
  const haushaltsUeberschuss = haushaltsUeberschussMonat(state);
  const cashPositiv = Math.max(0, cash);
  const cashZins = cashPositiv * state.config.kapital.tagesgeldZins / 12;
  const cashZinsNetto = cash >= 0
    ? kapitalertragVorschau(state, cashZins).nettoErtrag
    : cash * state.config.bewirtschaftung.dispoZins / 12;
  const etfLiquidation = etfVerkaufVorschau(state, etf);
  const immobilien = [...state.portfolio, ...(state.eigenheim ? [state.eigenheim] : [])];
  const immoWert = immobilien.reduce((summe, objekt) => summe + fairerWert(state, objekt), 0);
  const immoSchuld = immobilien.reduce((summe, objekt) => summe + Math.max(0, objekt.darlehen?.restschuld || 0), 0);
  const immoRuecklagen = immobilien.reduce((summe, objekt) => summe + Math.max(0, objekt.ruecklage || 0), 0);
  const immoEigenkapital = immoWert - immoSchuld + immoRuecklagen;
  const immoCashflow = (state.letzterImmoCashflow || 0) + (state.letzterEigenheimCashflow || 0);
  // Der Mix gehört unter die Nettovermögens-Überschrift und zeigt deshalb das
  // gebundene Eigenkapital, nicht den Brutto-Marktwert. Sonst stünde eine
  // Nettosumme über einer Bruttoaufteilung.
  const mixWerte = [cashPositiv, Math.max(0, etf), Math.max(0, immoEigenkapital)];
  const mixGesamt = mixWerte.reduce((summe, wert) => summe + wert, 0);

  text('fin-liquid-gesamt', fmtEUR(liquideAnlagen));
  text('fin-cashflow', fmtEURSigniert(haushaltsUeberschuss));
  text('fin-puffer', `${puffer.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Monate`);
  text('fin-netto', fmtEUR(nettovermoegen(state)));
  signal(document.getElementById('fin-cashflow'), haushaltsUeberschuss);

  for (const [id, wert] of [['cash', mixWerte[0]], ['etf', mixWerte[1]], ['immo', mixWerte[2]]]) {
    document.getElementById(`fin-mix-${id}`).style.width = `${mixGesamt > 0 ? wert / mixGesamt * 100 : 0}%`;
    text(`fin-mix-${id}-wert`, fmtEUR(wert));
  }
  const mixText = `Tagesgeld ${fmtEUR(cash)} · Welt-ETF ${fmtEUR(etf)} · Immobilien ${fmtEUR(immoEigenkapital)} Eigenkapital`;
  text('fin-mix-label', mixText);
  document.querySelector('.finanz-mix').setAttribute('aria-label', `Aufteilung der Vermögenswerte: ${mixText}.`);

  text('fin-cash-wert', fmtEUR(cash));
  signal(document.getElementById('fin-cash-wert'), cash);
  text('fin-cash-zins', `${(state.config.kapital.tagesgeldZins * 100).toLocaleString('de-DE', { maximumFractionDigits: 2 })} % p.a.`);
  text('fin-cash-zins-naechster', fmtEURSigniert(cashZinsNetto));

  text('fin-immo-ek', fmtEUR(immoEigenkapital));
  text('fin-immo-anzahl', String(immobilien.length));
  text('fin-immo-wert', fmtEUR(immoWert));
  text('fin-immo-schuld', fmtEUR(immoSchuld));
  text('fin-immo-cashflow', fmtEURSigniert(immoCashflow));
  signal(document.getElementById('fin-immo-ek'), immoEigenkapital);
  signal(document.getElementById('fin-immo-cashflow'), immoCashflow);

  text('fin-etf-wert', fmtEUR(etf));
  text('fin-etf-rendite', `${(state.config.kapital.etfRendite * 100).toLocaleString('de-DE', { maximumFractionDigits: 2 })} % p.a.`);
  text('fin-etf-rendite-netto', `ca. ${(renditeNachSteuer(state, state.config.kapital.etfRendite, state.config.kapitalsteuer.etfTeilfreistellung) * 100).toLocaleString('de-DE', { maximumFractionDigits: 2 })} % p.a.`);
  text('fin-etf-liquidation', fmtEUR(etfLiquidation.ok ? etfLiquidation.netto : 0));
  text('fin-etf-rate', fmtEUR(werte.etfEinzahlung));
  renderTransferVorschau(state);

  const sparplan = document.getElementById('fin-sparplan');
  if (document.activeElement !== sparplan) {
    sparplan.value = String(Math.round((state.config.haushalt.sparplanEtfAnteil || 0) * 100));
  }
  renderSparplanVorschau(state);
  renderBewegungen(state);
}

function renderTransferVorschau(state) {
  if (!state) return;
  const regler = document.getElementById('fin-transfer');
  const betragSigniert = Number(regler.value) || 0;
  const betrag = Math.abs(betragSigniert);
  const cash = Number(state.cash) || 0;
  const etf = Number(state.etfDepot?.wert) || 0;
  const button = document.getElementById('fin-transfer-submit');
  const cashDelta = document.getElementById('fin-transfer-cash-delta');
  const etfDelta = document.getElementById('fin-transfer-etf-delta');
  let cashNachher = cash;
  let etfNachher = etf;
  let deltaCash = 0;
  let deltaEtf = 0;
  let gueltig = betragSigniert === 0;
  let info = 'Nichts verschieben — beide Konten bleiben unverändert.';
  let buttonText = 'Betrag am Slider wählen';

  if (betragSigniert > 0) {
    gueltig = cash >= betrag;
    if (gueltig) {
      cashNachher -= betrag;
      etfNachher += betrag;
      deltaCash = -betrag;
      deltaEtf = betrag;
      const rendite = (state.config.kapital.etfRendite * 100).toLocaleString('de-DE', { maximumFractionDigits: 1 });
      info = `${fmtEUR(betrag)} vom Tagesgeld in den Welt-ETF anlegen. Erwartungswert ${rendite} % p.a. brutto — Kurse schwanken.`;
      buttonText = `${fmtEUR(betrag)} im ETF anlegen`;
    } else {
      info = `Für diese Umbuchung fehlen ${fmtEUR(betrag - Math.max(0, cash))} verfügbares Tagesgeld.`;
    }
  } else if (betragSigniert < 0) {
    gueltig = etf >= betrag;
    const vorschau = gueltig ? etfVerkaufVorschau(state, betrag) : null;
    gueltig = Boolean(vorschau?.ok);
    if (gueltig) {
      cashNachher += vorschau.netto;
      etfNachher -= vorschau.brutto;
      deltaCash = vorschau.netto;
      deltaEtf = -vorschau.brutto;
      info = `${fmtEUR(vorschau.brutto)} ETF-Verkauf · voraussichtlich ${fmtEUR(vorschau.steuer)} Steuer · ${fmtEUR(vorschau.netto)} netto aufs Tagesgeld.`;
      buttonText = `${fmtEUR(vorschau.brutto)} ETF verkaufen`;
    } else {
      info = `Für diesen Verkauf fehlen ${fmtEUR(betrag - Math.max(0, etf))} im ETF-Depot.`;
    }
  }

  text('fin-transfer-betrag', betragSigniert === 0
    ? '0 € · halten'
    : `${betragSigniert > 0 ? '+' : '−'}${fmtEUR(betrag)} · ${betragSigniert > 0 ? 'in ETF' : 'in Tagesgeld'}`);
  text('fin-transfer-cash-nachher', fmtEUR(cashNachher));
  text('fin-transfer-etf-nachher', fmtEUR(etfNachher));
  text('fin-transfer-cash-delta', deltaCash === 0 ? 'unverändert' : fmtEURSigniert(deltaCash));
  text('fin-transfer-etf-delta', deltaEtf === 0 ? 'unverändert' : fmtEURSigniert(deltaEtf));
  text('fin-transfer-pfeil', betragSigniert > 0 ? '→' : betragSigniert < 0 ? '←' : '—');
  text('fin-transfer-vorschau', info);
  signal(cashDelta, deltaCash);
  signal(etfDelta, deltaEtf);
  signal(document.getElementById('fin-transfer-cash-nachher'), cashNachher);
  button.textContent = buttonText;
  button.disabled = betragSigniert === 0 || !gueltig;
  button.classList.toggle('primaer', betragSigniert > 0 && gueltig);
  button.classList.toggle('transfer-verkaufen', betragSigniert < 0 && gueltig);
  button.classList.toggle('transfer-neutral', betragSigniert === 0 || !gueltig);
  document.getElementById('form-etf-transfer').classList.toggle('is-verkauf', betragSigniert < 0);
  document.getElementById('form-etf-transfer').classList.toggle('is-anlage', betragSigniert > 0);
}

function renderSparplanVorschau(state) {
  if (!state) return;
  const anteil = begrenze(document.getElementById('fin-sparplan').value, 100) / 100;
  const sparrate = Math.max(0, monatsWerte(state).sparrate);
  const etfRate = sparrate * anteil;
  text('fin-sparplan-prozent', `${Math.round(anteil * 100)} %`);
  text('fin-sparplan-wert', `${fmtEUR(etfRate)} / Monat`);
  text('fin-sparplan-cash', `${fmtEUR(sparrate - etfRate)} aufs Tagesgeld`);
  text('fin-sparplan-etf', `${fmtEUR(etfRate)} ins ETF-Depot`);
}

function renderBewegungen(state) {
  const liste = document.getElementById('finanz-bewegungen');
  const eintraege = (state.log || [])
    .filter((eintrag) => /ETF|Tagesgeld|Balancekorrektur|Eigenkapital|Kauf abgeschlossen|Verkauf/i.test(eintrag.text))
    .slice(-6)
    .reverse();
  liste.replaceChildren();
  if (!eintraege.length) {
    const leer = document.createElement('li');
    leer.className = 'bewegung-leer';
    leer.textContent = 'Noch keine Finanzbewegungen.';
    liste.append(leer);
    return;
  }
  for (const eintrag of eintraege) {
    const li = document.createElement('li');
    const zeit = document.createElement('span');
    const textElement = document.createElement('span');
    zeit.textContent = eintrag.monat === 0 ? 'Start' : `Monat ${eintrag.monat}`;
    textElement.textContent = eintrag.text;
    li.append(zeit, textElement);
    liste.append(li);
  }
}

function begrenze(wert, maximum) {
  return Math.max(0, Math.min(maximum, Number(wert) || 0));
}

function text(id, wert) {
  document.getElementById(id).textContent = wert;
}

function signal(element, wert) {
  element.classList.toggle('positiv', wert > 0);
  element.classList.toggle('negativ', wert < 0);
}

