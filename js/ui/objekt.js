// objekt.js — Screen 7: Objekt-Detail. Cutaway, Monats-P&L, Mieter/Leerstand,
// Rücklage, Hausverwaltung, Mieterhöhung, Renovieren. Nabe der Phase-3-Loop.

import { getListing } from '../content.js?v=54';
import { fairerWert } from '../market.js?v=54';
import {
  marktmiete, kannErhoehen, maxMiete, erhoeheMiete, mietrechtFuer, vermietungsmodell,
  starteEigenbedarf, zieheEigenbedarfZurueck, zahleEigenbedarfAbfindung,
} from '../tenants.js?v=54';
import { bildHTML, cutawayHTML } from '../iso.js?v=54';
import { faktenLabel, fmtEUR, fmtEURSigniert } from './util.js?v=54';
import { oeffneBewerber } from './bewerber.js?v=54';
import { oeffneRenovieren } from './renovieren.js?v=54';
import { oeffneVerkauf } from './verkaufen.js?v=54';
import {
  fixkostenMonat, instandhaltungMonat, objektartConfig, fixkostenAufschluesselung,
} from '../immobilie.js?v=54';
import { bezieheBestandsobjekt } from '../eigenheim.js?v=54';
import { protokolliereWirkung } from '../gameplay.js?v=54';
import { bankAnpassungVorschau, turnaroundAktiv } from '../turnaround.js?v=54';
import { oeffneBankAnpassung } from './turnaround.js?v=54';
import { objektArcsFuerObjekt } from '../arcs.js?v=54';
import { sondertilgen, sondertilgungRahmen, sondertilgungVorschau } from '../finance.js?v=54';

let ctx = null;
let auswahl = null; // stabile listingId oder 'eigenheim'
let ansicht = 'innen';

const STIMMUNG = [
  { ab: 0.15, text: 'sehr zufrieden', kl: 'gut' },
  { ab: -0.15, text: 'zufrieden', kl: 'ok' },
  { ab: -1, text: 'unzufrieden', kl: 'schlecht' },
];

export function initObjekt(context) {
  ctx = context;
  document.getElementById('btn-objekt-zurueck').addEventListener('click', () => ctx.zeigePortfolio());
  document.querySelectorAll('[data-objekt-ansicht]').forEach((button) => {
    button.addEventListener('click', () => {
      ansicht = button.dataset.objektAnsicht;
      renderObjekt(ctx.getState());
    });
  });
}

export function oeffneObjekt(kennung) {
  if (kennung === 'eigenheim') auswahl = 'eigenheim';
  else if (typeof kennung === 'number') auswahl = ctx.getState().portfolio[kennung]?.listingId || null;
  else auswahl = kennung;
  ansicht = 'innen';
  ctx.zeigeScreen('objekt');
}

export function aktuellerObjektIndex() {
  return ctx.getState().portfolio.findIndex((o) => o.listingId === auswahl);
}

export function renderObjekt(state) {
  const istEigenheim = auswahl === 'eigenheim';
  const index = istEigenheim ? -1 : state.portfolio.findIndex((o) => o.listingId === auswahl);
  const objekt = istEigenheim ? state.eigenheim : state.portfolio[index];
  if (!objekt) {
    ctx.zeigeScreen('dashboard');
    return;
  }
  const listing = getListing(objekt.listingId);
  const bw = state.config.bewirtschaftung;
  const wert = fairerWert(state, objekt);
  const markt = marktmiete(state, objekt);
  const mietrecht = mietrechtFuer(state, objekt);
  const bank = turnaroundAktiv(state) ? bankAnpassungVorschau(state, objekt) : null;
  const arcs = objektArcsFuerObjekt(state, objekt).slice(-3).reverse();

  document.getElementById('objekt-titel').textContent = objekt.titel;
  document.getElementById('objekt-kopf-status').innerHTML = objektStatusBadges(state, objekt, istEigenheim);

  // Laufende Monats-Rechnung (Vorschau, ohne den Tick zu mutieren)
  const imUmbau = !!objekt.renovierung;
  const vermietet = !istEigenheim && objekt.vermietet && !imUmbau;
  const miete = vermietet ? objekt.kaltmiete : 0;
  const laufendeKosten = fixkostenMonat(state, objekt, vermietet);
  const hausverwaltung = objekt.hausverwaltung && vermietet ? objekt.kaltmiete * bw.hausverwaltungProzent : 0;
  const ruecklageBeitrag = instandhaltungMonat(state, objekt);
  const rate = objekt.darlehen.restschuld > 0 ? objekt.darlehen.rate : 0;
  const netto = miete - laufendeKosten - hausverwaltung - ruecklageBeitrag - rate;
  const mieteNachVermietung = istEigenheim ? 0 : (vermietet ? miete : Math.round(markt));
  const kostenNachVermietung = fixkostenMonat(state, objekt, !istEigenheim);
  const verwaltungNachVermietung = objekt.hausverwaltung && !istEigenheim
    ? mieteNachVermietung * bw.hausverwaltungProzent
    : 0;
  const nettoNachVermietung = istEigenheim
    ? netto
    : mieteNachVermietung - kostenNachVermietung - verwaltungNachVermietung - ruecklageBeitrag - rate;
  const kostenLabel = objekt.objektart === 'haus' ? 'Haus-Fixkosten' : 'WEG-Hausgeld';
  const sonder = sondertilgungRahmen(state, objekt);

  document.querySelectorAll('[data-objekt-ansicht]').forEach((button) => {
    const aktiv = button.dataset.objektAnsicht === ansicht;
    button.classList.toggle('aktiv', aktiv);
    button.setAttribute('aria-pressed', String(aktiv));
  });
  const objektBild = ansicht === 'aussen'
    ? bildHTML(listing, 'gross')
    : cutawayHTML(listing, objekt.zustand, 'gross');

  const pl = (istEigenheim
    ? [
      ['−', kostenLabel, -laufendeKosten],
      ['→', 'in die Rücklage', -ruecklageBeitrag],
      ['−', 'Kreditrate', -rate],
      ['=', 'monatliche Wohnkosten', netto, true],
    ]
    : [
      ['+', 'Kaltmiete', miete],
      ['−', `${kostenLabel} (Eigentümeranteil)`, -laufendeKosten],
      objekt.hausverwaltung ? ['−', 'Hausverwaltung', -hausverwaltung] : null,
      ['→', 'in die Rücklage', -ruecklageBeitrag],
      ['−', 'Kreditrate', -rate],
      ['=', 'liquider Cashflow', netto, true],
    ]).filter(Boolean);

  document.getElementById('objekt-inhalt').innerHTML =
    `<div class="objekt-oben">` +
    `<div class="objekt-visual">${objektBild}` +
    `<div class="objekt-visual-overlay"><span>Zustand ${objekt.zustand}/5</span>` +
    `<span>${objekt.energieklasse ? `Energie ${objekt.energieklasse}` : ''}</span><span>zum Zoomen klicken</span></div></div>` +
    `<div class="karte objekt-status">` +
    `<dl class="objekt-kennzahlen">` +
      `<div><dt>Wert heute</dt><dd class="wert-gold">${fmtEUR(Math.round(wert))}</dd></div>` +
      `<div><dt>Restschuld (Bank)</dt><dd class="wert-negativ">${fmtEUR(Math.round(objekt.darlehen.restschuld))}</dd></div>` +
      `<div><dt>${istEigenheim ? 'Wohnkosten jetzt' : 'Objekt-Cashflow jetzt'}</dt><dd class="${netto >= 0 ? 'wert-positiv' : 'wert-negativ'}">${fmtEURSigniert(Math.round(netto))}/Mon.</dd></div>` +
      (!istEigenheim ? `<div><dt>Cashflow nach Vermietung</dt><dd class="${nettoNachVermietung >= 0 ? 'wert-positiv' : 'wert-negativ'}">${fmtEURSigniert(Math.round(nettoNachVermietung))}/Mon.</dd></div>` : '') +
    `</dl><details class="objekt-daten"><summary>Objektdaten &amp; Finanzierung</summary>` +
    statusHTML(state, objekt, wert, markt, istEigenheim) + `</details>` +
    (!istEigenheim ? `<p class="mietrecht-hinweis"><b>${mietrecht.label}</b><br>${mietrecht.kurz}</p>` : '') +
    `</div></div>` +

    `<div class="objekt-spalten">` +
    // P&L
    `<div class="karte pnl-karte"><span class="eyebrow">Geldfluss</span><h3>Monats-Rechnung</h3>` +
    cashflowBars(pl) +
    (imUmbau || istEigenheim ? '' : `<p class="hinweis">Marktmiete für diesen Zustand: ${fmtEUR(Math.round(markt))} kalt.</p>`) +
    (!istEigenheim && !imUmbau && netto < 0 ? cashflowErklaerung(miete, netto, laufendeKosten, hausverwaltung, ruecklageBeitrag, rate) : '') +
    (sonder.verbleibend >= 1 ? `<div class="sondertilgung"><label><span>Sondertilgung ${sonder.jahr}</span><output id="sondertilgung-wert">${fmtEUR(0)}</output>` +
      `<input id="sondertilgung-slider" type="range" min="0" max="${Math.floor(Math.min(sonder.verbleibend, Math.max(0, state.cash)))}" step="100" value="0"></label>` +
      `<small>Bis zu 5 % des ursprünglichen Darlehens pro Jahr; die Monatsrate bleibt gleich, die Laufzeit sinkt.</small>` +
      `<output id="sondertilgung-vorschau" class="hinweis">Betrag wählen, um Restschuld und Laufzeit zu vergleichen.</output>` +
      `<button type="button" id="btn-sondertilgung" disabled>Sondertilgung leisten</button></div>` : '') +
    `</div>` +
    // Mieter / Vermietung
    `<div class="karte">${mieterHTML(state, objekt, istEigenheim)}</div>` +
    (arcs.length ? `<div class="karte objekt-arcs"><span class="eyebrow">Mehrmonatige Folgen</span><h3>Objektgeschichten</h3><ol>` +
      arcs.map((arc) => `<li><b>${arc.titel}</b><span>${arc.entscheidung}</span><small>${arc.status === 'laufend' ? `nächste Klärung in ${Math.max(0, arc.faelligMonat - state.monat)} Monaten` : arc.status}</small></li>`).join('') +
      `</ol></div>` : '') +
    // Bewirtschaftung
    `<div class="karte">${bewirtschaftungHTML(state, objekt, ruecklageBeitrag, istEigenheim, bank)}</div>` +
    `</div>`;

  wire(state, objekt, index, istEigenheim);
}

// Eine Darstellung pro Posten: Label, Balken und Betrag in derselben Zeile;
// die Summe als abgesetzte Zeile. Keine zweite Tabelle mit denselben Werten.
function cashflowBars(zeilen) {
  const posten = zeilen.filter(([, , , fett]) => !fett);
  const max = Math.max(1, ...posten.map(([, , betrag]) => Math.abs(betrag)));
  return `<div class="objekt-flow">${zeilen.map(([, name, betrag, fett]) => {
    const wert = fmtEURSigniert(Math.round(betrag));
    if (fett) {
      return `<div class="flow-summe ${betrag >= 0 ? 'positiv' : 'negativ'}"><span>${name}</span><b>${wert}</b></div>`;
    }
    const breite = Math.abs(betrag) < 0.5 ? 0 : Math.max(5, Math.round(Math.abs(betrag) / max * 100));
    return `<div class="objekt-flow-zeile" aria-label="${name}: ${wert}">` +
      `<span>${name}</span><div><i class="${betrag >= 0 ? 'rein' : 'raus'}" style="width:${breite}%"></i></div>` +
      `<b>${wert}</b></div>`;
  }).join('')}</div>`;
}

function statusHTML(state, objekt, wert, markt, istEigenheim) {
  const seg = state.config.segmente[objekt.segment];
  const schuld = Math.max(0, objekt.darlehen.restschuld);
  const eigenkapital = Math.max(0, wert - schuld);
  const ekQuote = wert > 0 ? Math.max(0, Math.min(100, eigenkapital / wert * 100)) : 0;
  const ltv = wert > 0 ? schuld / wert * 100 : 0;
  return (
    `<div class="objekt-wert"><span><small>Marktwert</small><b>${fmtEUR(Math.round(wert))}</b></span>` +
    `<span><small>Eigenkapital</small><b>${fmtEUR(Math.round(eigenkapital))}</b></span></div>` +
    `<div class="ownership-meter gross" aria-label="Eigenkapitalquote ${Math.round(ekQuote)} Prozent, Finanzierungsquote ${Math.round(ltv)} Prozent"><i style="width:${ekQuote.toFixed(1)}%"></i></div>` +
    `<div class="objekt-wert-legende"><span>Eigenkapital ${Math.round(ekQuote)} %</span><span>Finanzierungsquote ${Math.round(ltv)} %</span></div>` +
    `<table class="fakten">` +
    `<tr><td>${faktenLabel('Lage', 'Teilmarkt und Lagequalität. Beides beeinflusst Preis, Miete, Nachfrage und Wertentwicklung.')}</td><td>${seg.label} · ${objekt.lageScore}/10</td></tr>` +
    `<tr><td>${faktenLabel('Objekt / Eigentum', 'Objektart und Eigentumsform bestimmen laufende Kosten, Entscheidungsfreiheit und Instandhaltungsrisiko.')}</td><td>${objektartConfig(state, objekt).label} · ${objekt.eigentumsform === 'weg' ? 'WEG' : 'Alleineigentum'}</td></tr>` +
    `<tr><td>${faktenLabel('Fläche', 'Wohnfläche; sie beeinflusst Miete, Kaufpreis und laufende Instandhaltung.')}</td><td>${objekt.flaeche} m²</td></tr>` +
    (objekt.objektart === 'haus' ? `<tr><td>${faktenLabel('Grundstück / Außenraum', 'Grundstücksgröße und nutzbarer Außenraum; relevant für Wert und Familien-Eignung.')}</td><td>${objekt.grundstueck} / ${objekt.aussenflaeche} m²</td></tr>` : '') +
    fixkostenAufschluesselung(objekt).map((k) => `<tr><td>${faktenLabel(k.label, 'Monatlicher Eigentümeranteil an nicht auf den Mieter umlegbaren Objektkosten.')}</td><td>${fmtEUR(k.betrag)}/Monat</td></tr>`).join('') +
    `<tr><td>${faktenLabel('Zustand', 'Technischer und optischer Zustand von 1 bis 5. Wirkt auf Miete, Wert und Reparaturbedarf.')}</td><td>${objekt.zustand}/5</td></tr>` +
    `<tr><td>${faktenLabel('Energieklasse', 'Vereinfachter Effizienzindikator. Schlechtere Klassen erhöhen das Risiko künftiger Maßnahmen.')}</td><td>${objekt.energieklasse}</td></tr>` +
    `<tr><td>${faktenLabel('Restschuld', 'Noch offener Darlehensbetrag. Er sinkt durch den Tilgungsanteil der Kreditrate.')}</td><td>${fmtEUR(Math.round(objekt.darlehen.restschuld))}</td></tr>` +
    `<tr><td>${faktenLabel('Rücklage', 'Objektbezogener Geldpuffer für Reparaturen. Er gehört zum Vermögen, ist aber für das Objekt reserviert.')}</td><td>${fmtEUR(Math.round(objekt.ruecklage))}</td></tr>` +
    `</table>`
  );
}

function objektStatusBadges(state, objekt, istEigenheim) {
  let status;
  if (istEigenheim) {
    status = '<span class="badge blau">Eigenheim · selbst genutzt</span>';
  } else if (objekt.renovierung) {
    const rest = Math.max(0, objekt.renovierung.endMonat - state.monat);
    status = `<span class="badge blau">in Renovierung — noch ${rest} Mon.</span>`;
  } else if (objekt.vermietet) {
    status = `<span class="badge gruen">vermietet · ${vermietungsmodell(state, objekt.vermietungsart || objekt.moebliert).label}</span>`;
  } else {
    status = `<span class="badge orange">leer</span>`;
  }
  return (
    `<span class="karte-badges">${status}` +
    (objekt.verkauf ? `<span class="badge orange">Verkauf · noch ${Math.max(0, objekt.verkauf.abschlussMonat - state.monat)} Mon.</span>` : '') +
    `</span>`
  );
}

function mieterHTML(state, objekt, istEigenheim) {
  if (istEigenheim) {
    return `<h3>Wohnen</h3><p><b>Ihr wohnt selbst hier.</b></p>` +
      `<p class="muted">Die bisherige Warmmiete entfällt. Dafür tragt ihr laufende Eigentümerkosten, ` +
      `Instandhaltung und Kreditrate; das gebundene Eigenkapital bleibt Teil eures Vermögens.</p>` +
      `<div class="karte-badges"><span class="badge gruen">Familienziel +${state.config.eigenheim.familieNeutralBonus}</span>` +
      `<span class="badge blau">Kinder-Events abgemildert</span></div>`;
  }
  if (objekt.renovierung) {
    return `<h3>Mieter</h3><p class="muted">Während der Renovierung steht das Objekt leer.</p>`;
  }
  if (objekt.familienNutzung) {
    const index = Number(objekt.familienNutzung.slice(5));
    return `<h3>Familiennutzung</h3><p><b>Erwachsenes Kind ${index + 1} wohnt hier.</b></p>` +
      `<p class="muted">Es fließt keine Kaltmiete; Kosten, Rücklage und Kreditrate laufen weiter.</p>` +
      `<button id="btn-familiennutzung-enden">Familiennutzung beenden</button>`;
  }
  if (objekt.vermietet && objekt.mieter) {
    const m = objekt.mieter;
    const stimmung = STIMMUNG.find((s) => m.zufriedenheit >= s.ab) || STIMMUNG[2];
    const seit = state.monat - m.eingezogen;
    const erh = kannErhoehen(state, objekt);
    return (
      `<h3>Mieter</h3>` +
      `<div class="mieter-profil">` +
      (m.id && !m.bestand
        ? `<div class="mieter-avatar"><svg class="ui-icon" aria-hidden="true"><use href="#icon-family"></use></svg><img src="assets/avatar/${m.id}.webp" alt="" onerror="this.remove()"></div>`
        : `<div class="mieter-avatar" aria-hidden="true"><svg class="ui-icon"><use href="#icon-family"></use></svg></div>`) +
      `<div class="mieter-kopf"><b>${m.name}</b><span>${m.bestand ? 'Bestandsmieter' : m.archetyp}</span>` +
      `<span class="stimmung-${stimmung.kl}">${stimmung.text}</span></div></div>` +
      `<table class="fakten">` +
      `<tr><td>${faktenLabel('Kaltmiete', 'Miete ohne Betriebs- und Heizkosten; sie ist die Einnahme des Objekts.')}</td><td>${fmtEUR(objekt.kaltmiete)}/Monat</td></tr>` +
      `<tr><td>${faktenLabel('Wohnt hier seit', 'Die Mietdauer beeinflusst Bleibeerwartung und bei Eigenbedarf die gesetzliche Kündigungsfrist.')}</td><td>${seit} Monat${seit === 1 ? '' : 'en'}</td></tr>` +
      `</table>` +
      `<div class="expose-aktionen">` +
      `<button id="btn-erhoehen" ${erh ? '' : 'disabled'}>` +
      (erh ? `Miete erhöhen → ${fmtEUR(maxMiete(state, objekt))}` : 'Erhöhung ausgereizt') +
      `</button></div>` + eigenbedarfHTML(state, objekt)
    );
  }
  // Leer
  return (
    `<h3>Vermietung</h3>` +
    `<p class="muted">Das Objekt steht leer — keine Miete, volle laufende Eigentümerkosten.</p>` +
    `<div class="expose-aktionen">` +
    (objekt.eigenbedarfFreigabe === 'selbst' && !state.eigenheim ? `<button id="btn-eigenheim-beziehen" class="primaer">Als Eigenheim beziehen</button>` : '') +
    `<button id="btn-vermieten" class="primaer">${objekt.suche ? 'Bewerber ansehen' : 'Vermieten'}</button>` +
    `<button id="btn-renovieren">Renovieren</button>` +
    `</div>`
  );
}

function eigenbedarfHTML(state, objekt) {
  const vorgang = objekt.eigenbedarf;
  if (vorgang?.status === 'angekuendigt') {
    return `<aside class="eigenbedarf-status"><b>Eigenbedarf läuft</b><p>Ziel: ${vorgang.ziel === 'selbst' ? 'eigener Einzug' : 'erwachsenes Kind'} · Frist noch ${Math.max(0, vorgang.auszugMonat - state.monat)} Monate.</p><button id="btn-eigenbedarf-zurueck">Zurückziehen</button></aside>`;
  }
  if (vorgang?.status === 'klage') {
    return `<aside class="eigenbedarf-status konflikt"><b>Mieter widerspricht</b><p>Der Auszug ist blockiert. Eine simulierte Einigung kostet ${fmtEUR(vorgang.abfindung)}.</p><div><button id="btn-eigenbedarf-abfindung" class="primaer">Abfindung zahlen</button><button id="btn-eigenbedarf-zurueck">Eigenbedarf zurückziehen</button></div></aside>`;
  }
  const ziele = [];
  if (!state.eigenheim) ziele.push(['selbst', 'Für euch selbst']);
  state.config.haushalt.kinder.forEach((kind, index) => {
    if (kind.alter + state.monat / 12 >= 18) ziele.push([`kind-${index}`, `Für erwachsenes Kind ${index + 1}`]);
  });
  if (!ziele.length) return '';
  return `<aside class="eigenbedarf-status"><b>Eigenbedarf</b><p>Nur für tatsächliche Familiennutzung. Kündigungsfrist und ein möglicher Widerspruch werden simuliert.</p><div>${ziele.map(([id, label]) => `<button data-eigenbedarf="${id}">${label}</button>`).join('')}</div></aside>`;
}

function cashflowErklaerung(miete, netto, laufendeKosten, verwaltung, ruecklage, rate) {
  const deckung = laufendeKosten + verwaltung + ruecklage + rate;
  const luecke = Math.abs(Math.round(netto));
  return `<aside class="cashflow-erklaerung"><b>${miete > 0 ? `Monatliche Lücke: ${fmtEUR(luecke)}` : 'Leerstand: derzeit keine Mieteinnahme'}</b>` +
    `<p>Für einen liquiden Nullpunkt wären aktuell rund <strong>${fmtEUR(Math.round(deckung))}</strong> Kaltmiete nötig. ` +
    `Die Kreditrate enthält Tilgung: Sie belastet heute das Tagesgeld, senkt aber zugleich die Restschuld.</p>` +
    `<ul><li>Mehr Eigenkapital oder ein niedrigerer Kaufpreis senken die Rate.</li>` +
    `<li>Renovierung und ein passender Vermietungsweg können die erzielbare Miete erhöhen.</li>` +
    `<li>Rücklage nur bewusst reduzieren – sie schützt vor späteren Reparaturschocks.</li></ul></aside>`;
}

function bewirtschaftungHTML(state, objekt, ruecklageBeitrag, istEigenheim, bank) {
  const bw = state.config.bewirtschaftung;
  const faktor = objekt.ruecklageFaktor ?? 1;
  const ruecklageZiel = Math.max(1, objekt.flaeche * objektartConfig(state, objekt).instandhaltungM2Jahr);
  const ruecklageFortschritt = Math.max(0, Math.min(100, objekt.ruecklage / ruecklageZiel * 100));
  return (
    `<h3>Bewirtschaftung</h3>` +
    `<div class="reserve-status"><div><span>Rücklagenpuffer</span><b>${fmtEUR(Math.round(objekt.ruecklage))}</b></div>` +
    `<div class="reserve-track" aria-label="Rücklage ${Math.round(ruecklageFortschritt)} Prozent eines Jahresziels"><i style="width:${ruecklageFortschritt.toFixed(1)}%"></i></div>` +
    `<small>Orientierung: ein Jahr reguläre Instandhaltung (${fmtEUR(Math.round(ruecklageZiel))})</small></div>` +
    `<label class="slider-zeile">Rücklage sparen: <b>${faktor.toFixed(1).replace('.', ',')}×</b> ` +
    `(${fmtEUR(Math.round(ruecklageBeitrag))}/Monat)` +
    `<input type="range" id="ruecklage-slider" min="0" max="2" step="0.5" value="${faktor}"></label>` +
    (bank ? `<section class="turnaround-bank"><span class="eyebrow">Bankfenster</span><h4>Rate gegen längere Schuld senken</h4>` +
      `<output>+${fmtEUR(Math.round(bank.entlastung))}/Monat</output>` +
      `<p>${fmtEUR(bank.gebuehr)} Gebühr · ${bank.zeit} h · ca. ${fmtEUR(Math.round(bank.restschuldMehr))} mehr Restschuld bis Zinsbindung</p>` +
      `<button type="button" id="btn-banktermin" ${bank.moeglich ? '' : 'disabled'} title="${bank.grund}">${bank.moeglich ? 'Banktermin prüfen' : bank.grund}</button></section>` : '') +
    // Renovieren hat genau eine Stelle: die Vermietungssektion oben, wo das
    // Objekt leer steht. Hier stünde sonst dieselbe Aktion ein zweites Mal.
    (istEigenheim ? '' :
      `<label class="check-zeile"><input type="checkbox" id="hausverwaltung-check" ${objekt.hausverwaltung ? 'checked' : ''}> ` +
      `Hausverwaltung (${Math.round(bw.hausverwaltungProzent * 100)} % der Miete, spart Zeit &amp; dämpft Events)</label>`) +
    `<hr class="karten-trenner">` +
    (objekt.verkauf
      ? `<p><b>Verkauf läuft.</b><br><span class="muted">Abschluss ${restText(objekt.verkauf.abschlussMonat - state.monat)}; bis dahin laufen Kosten und Mieten weiter.</span></p>`
      : `<div class="expose-aktionen"><button id="btn-verkaufen">Verkauf planen</button></div>`)
  );
}

function restText(monate) {
  const n = Math.max(0, monate);
  return n === 1 ? 'in einem Monat' : `in ${n} Monaten`;
}

function wire(state, objekt, index, istEigenheim) {
  document.getElementById('btn-vermieten')?.addEventListener('click', () => oeffneBewerber(index));
  document.getElementById('btn-renovieren')?.addEventListener('click', () => oeffneRenovieren(index));
  document.getElementById('btn-verkaufen')?.addEventListener('click', () => oeffneVerkauf(objekt));
  const sonderSlider = document.getElementById('sondertilgung-slider');
  sonderSlider?.addEventListener('input', () => {
    const vorschau = sondertilgungVorschau(state, objekt, Number(sonderSlider.value));
    document.getElementById('sondertilgung-wert').textContent = fmtEUR(vorschau.zahlung);
    document.getElementById('sondertilgung-vorschau').textContent = vorschau.zahlung
      ? `Tagesgeld danach ${fmtEUR(vorschau.cashDanach)} · Restschuld ${fmtEUR(vorschau.restschuldDanach)} · Laufzeit etwa ${Math.max(0, vorschau.laufzeitVorher - vorschau.laufzeitDanach)} Monate kürzer.`
      : 'Betrag wählen, um Restschuld und Laufzeit zu vergleichen.';
    document.getElementById('btn-sondertilgung').disabled = vorschau.zahlung < 1;
  });
  document.getElementById('btn-sondertilgung')?.addEventListener('click', () => {
    try {
      const vorschau = sondertilgungVorschau(state, objekt, Number(sonderSlider?.value));
      if (!window.confirm(`${fmtEUR(vorschau.zahlung)} sondertilgen? Danach bleiben ${fmtEUR(vorschau.cashDanach)} Tagesgeld und ${fmtEUR(vorschau.restschuldDanach)} Restschuld.`)) return;
      const betrag = sondertilgen(state, objekt, vorschau.zahlung);
      ctx.toast(`${fmtEUR(betrag)} sondergetilgt.`);
      ctx.autosave();
      renderObjekt(state);
    } catch (fehler) { ctx.toast(fehler.message); }
  });
  document.getElementById('btn-banktermin')?.addEventListener('click', () => oeffneBankAnpassung(objekt));

  document.getElementById('btn-erhoehen')?.addEventListener('click', () => {
    if (erhoeheMiete(state, objekt)) {
      ctx.toast('Miete erhöht.');
      ctx.autosave();
      renderObjekt(state);
    }
  });

  document.querySelectorAll('[data-eigenbedarf]').forEach((button) => button.addEventListener('click', () => {
    try {
      const vorgang = starteEigenbedarf(state, objekt, button.dataset.eigenbedarf);
      ctx.toast(`Eigenbedarf angemeldet; Kündigungsfrist ${vorgang.frist} Monate.`);
      ctx.autosave();
      renderObjekt(state);
    } catch (fehler) { ctx.toast(fehler.message); }
  }));
  document.getElementById('btn-eigenbedarf-zurueck')?.addEventListener('click', () => {
    zieheEigenbedarfZurueck(state, objekt); ctx.autosave(); renderObjekt(state);
  });
  document.getElementById('btn-eigenbedarf-abfindung')?.addEventListener('click', () => {
    const betrag = zahleEigenbedarfAbfindung(state, objekt);
    ctx.toast(`${fmtEUR(betrag)} Abfindung gezahlt; die Wohnung ist frei.`);
    ctx.autosave(); renderObjekt(state);
  });
  document.getElementById('btn-eigenheim-beziehen')?.addEventListener('click', () => {
    try {
      bezieheBestandsobjekt(state, objekt);
      auswahl = 'eigenheim';
      ctx.toast('Ihr seid in das freigewordene Objekt eingezogen.');
      ctx.autosave(); renderObjekt(state);
    } catch (fehler) { ctx.toast(fehler.message); }
  });
  document.getElementById('btn-familiennutzung-enden')?.addEventListener('click', () => {
    objekt.familienNutzung = null; objekt.nutzung = 'kapitalanlage'; objekt.eigenbedarfFreigabe = null;
    ctx.autosave(); renderObjekt(state);
  });

  const slider = document.getElementById('ruecklage-slider');
  slider?.addEventListener('input', () => {
    objekt.ruecklageFaktor = Number(slider.value);
    renderObjekt(state);
  });
  slider?.addEventListener('change', () => ctx.autosave());

  document.getElementById('hausverwaltung-check')?.addEventListener('change', (ev) => {
    objekt.hausverwaltung = ev.target.checked;
    const kosten = Math.round((objekt.kaltmiete || 0) * state.config.bewirtschaftung.hausverwaltungProzent);
    const zeit = state.config.bewirtschaftung.zeitProObjekt;
    protokolliereWirkung(state, {
      typ: 'verwaltung',
      titel: 'Verwaltung neu geordnet',
      text: objekt.hausverwaltung
        ? `${objekt.titel}: Selbstverwaltung → Hausverwaltung; etwa ${zeit} h/Monat frei, ${kosten.toLocaleString('de-DE')} €/Monat Kosten.`
        : `${objekt.titel}: Hausverwaltung → Selbstverwaltung; ${kosten.toLocaleString('de-DE')} €/Monat gespart, etwa ${zeit} h/Monat mehr Aufwand.`,
      ziel: objekt.listingId,
      route: 'objekt',
    });
    ctx.toast(objekt.hausverwaltung ? 'Hausverwaltung übernimmt.' : 'Du verwaltest wieder selbst.');
    ctx.autosave();
    renderObjekt(state);
  });
}

