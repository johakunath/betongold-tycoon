// ui/endgame.js — Screen 9: fünf Scores, Seed-Benchmarks und Timeline.

import { berechneEndauswertung } from '../endgame.js?v=60';
import {
  fmtEUR, fmtEURSigniert, fmtDatum, fmtProzent, euroModus, euroUmschalterHTML, inAnzeigeEuro,
} from './util.js?v=60';

const PHASEN_LABEL = {
  boom: 'Boom — Rückenwind für Märkte',
  seitwaerts: 'Seitwärtsmarkt — solide, aber unspektakulär',
  crash: 'Crash-Phase — schwieriges Marktumfeld',
};

const SCORE_META = {
  vermoegen: ['Nettovermögen', 'Vermögen am Lebensende, in heutigen Euro'],
  cashflow: ['Passiver Cashflow', 'Mieten nach Kosten und Steuer + sichere Entnahme'],
  resilienz: ['Resilienz', 'Beleihung und liquide Puffer'],
  stress: ['Stress', 'Zeitüberzug und Monate im Dispo'],
  familie: ['Familie', 'Schlussstand und Kampagnenschnitt'],
};

let ctx = null;
let letzteAuswertung = null;

export function initEndgame(context) {
  ctx = context;
  document.addEventListener('euromodus', () => {
    const state = ctx.getState();
    if (letzteAuswertung && state && !document.getElementById('screen-endgame').hidden) {
      renderEndgame(state, letzteAuswertung);
    }
  });
  document.getElementById('btn-endgame-dashboard').addEventListener('click', () => ctx.zeigeScreen('dashboard'));
  document.getElementById('btn-endgame-neu').addEventListener('click', () =>
    document.getElementById('btn-neu').click());
}

export function zeigeEnde(state) {
  ctx.setSpeed(0);
  const auswertung = berechneEndauswertung(state);
  letzteAuswertung = auswertung;
  renderEndgame(state, auswertung);
  ctx.zeigeScreen('endgame');
}

function renderEndgame(state, a) {
  // Alle Bestandsgrößen wahlweise nominal oder in heutigen Euro (Endpreisniveau).
  const eur = (wert) => inAnzeigeEuro(wert, a.preisniveau);
  const heute = euroModus() === 'heute';
  const einheit = heute ? ' (heutige Euro)' : '';
  const objekte = [...state.portfolio, ...(state.eigenheim ? [state.eigenheim] : [])];
  const schulden = eur(objekte.reduce((summe, o) => summe + (o.darlehen?.restschuld || 0), 0));
  const liquideMittel = eur(Math.max(0, state.cash) + state.etfDepot.wert);
  const ende = Object.fromEntries(Object.entries(a.endwerte).map(([id, wert]) => [id, eur(wert)]));
  const benchmarkSpanne = Math.max(ende.etf, ende.eigenheim, ende.invest) -
    Math.min(ende.etf, ende.eigenheim, ende.invest);
  document.getElementById('endgame-zusammenfassung').innerHTML =
    `<div><span class="eyebrow">Lebensbilanz · ${Math.floor(a.lebensalter)} Jahre</span>` +
    `<h1>${urteil(a.scores.gesamt)}</h1>` +
    `<p>Gesamtscore <b>${Math.round(a.scores.gesamt)}/100</b> · ` +
    `${PHASEN_LABEL[state.marktphase] || state.marktphase} · Seed ${state.seedText || state.seed}</p></div>` +
    `<div class="endgame-hauptwert"><span>Nettovermögen${einheit}</span><b>${fmtEUR(ende.spieler)}</b>` +
    `<small>${fmtEURSigniert(ende.spieler - ende.etf)} gegenüber reinem ETF</small>` +
    `<small>davon eure Entscheidungen ${fmtEURSigniert(eur(a.zerlegung.entscheidungen))} · ` +
    `Sparplan-Aufteilung Tagesgeld/ETF ${fmtEURSigniert(eur(a.zerlegung.sparaufteilung))}</small>` +
    `${euroUmschalterHTML()}</div>`;

  document.getElementById('endgame-scores').innerHTML = Object.entries(SCORE_META)
    .map(([id, [label, sub]]) => {
      const wert = Math.round(a.scores[id]);
      return `<article class="score-karte"><div class="score-ring" style="--score:${wert}"><b>${wert}</b></div>` +
        `<div><h3>${label}</h3><p>${sub}</p></div></article>`;
    }).join('');

  document.getElementById('endgame-details').innerHTML =
    `<div><span>Liquide Mittel</span><b>${fmtEUR(liquideMittel)}</b></div>` +
    `<div><span>Restschulden</span><b>${fmtEUR(schulden)}</b></div>` +
    `<div><span>Mietobjekte netto${einheit}</span><b>${fmtEURSigniert(eur(a.cashflow))}/Mon.</b></div>` +
    `<div><span>Sichere Entnahme ${fmtProzent((state.config.endgame.entnahmeRate || 0) * 100)}${einheit}</span><b>${fmtEURSigniert(eur(a.entnahme))}/Mon.</b></div>` +
    `<div><span>Finanzierungsquote</span><b>${Math.round(a.ltv * 100)} %</b></div>` +
    // Über zehn Jahre Deckung ist keine sinnvolle Monatsangabe mehr (vorher z. B. „955,2 Monate").
    `<div><span>Puffer für Objektpflichten</span><b>${a.deckungMonate > 120 ? 'über 10 Jahre' : `${a.deckungMonate.toFixed(1).replace('.', ',')} Monate`}</b></div>` +
    `<div><span>Ø Familie</span><b>${Math.round(a.familieSchnitt)}/100</b></div>` +
    `<div><span>Jahre im Ruhestand</span><b>${a.ruhestandsdauer.toFixed(1).replace('.', ',')}</b></div>` +
    `<div><span>Langzeit-Stress</span><b>${Math.round(a.lebensstress * 100)} %</b></div>` +
    `<div><span>Ø Zeitüberzug</span><b>${a.zeitUeberzugSchnitt.toFixed(1).replace('.', ',')} Std./Mon.</b></div>` +
    `<div><span>Monate im Dispo</span><b>${Math.round(a.negativCashAnteil * 100)} %</b></div>` +
    `<p class="endgame-einordnung"><b>Einordnung:</b> Die drei Referenzstrategien liegen in diesem Seed ` +
    `${fmtEUR(benchmarkSpanne)} auseinander. Vermögen ist deshalb nur eine von fünf Perspektiven; ` +
    `Liquidität, Schulden, verlässlicher Cashflow, Zeitstress und Familienalltag bleiben getrennt sichtbar. ` +
    `Der Abstand zum reinen ETF teilt sich in zwei Fragen: Was haben eure Käufe, Umschichtungen und ` +
    `Arbeitsentscheidungen gegenüber derselben Startlage ohne Käufe gebracht? Und was kostet oder bringt ` +
    `die Sparplan-Aufteilung zwischen Tagesgeld und ETF? Preisniveau am Ende: ` +
    `${a.preisniveau.toLocaleString('de-DE', { maximumFractionDigits: 2 })} × Spielstart.</p>`;

  const verlauf = a.preisniveauVerlauf || [];
  const linien = Object.fromEntries(Object.entries(a.linien).map(([id, punkte]) => [id,
    punkte.map((p) => ({ monat: p.monat, wert: inAnzeigeEuro(p.wert, verlauf[p.monat] ?? a.preisniveau) }))]));
  renderChart(linien);
  document.getElementById('endgame-vergleich').innerHTML = [
    ['Deine Entscheidungen', ende.spieler, 'spieler'],
    ['Ohne Käufe, gleiche Sparaufteilung', ende.ohneKaeufe, 'ohne'],
    ['Reiner ETF', ende.etf, 'etf'],
    ['Eigenheim-first', ende.eigenheim, 'eigenheim'],
    ['Invest-first', ende.invest, 'invest'],
  ].map(([name, wert, id]) => `<div class="vergleich-endwert"><i class="serie-${id}"></i>` +
    `<span>${name}</span><b>${fmtEUR(wert)}</b></div>`).join('');

  const z = state.config.zeit;
  document.getElementById('endgame-timeline').innerHTML = (state.log || []).length
    ? state.log.map((e) => {
      const d = new Date(z.startJahr, z.startMonat - 1 + e.monat, 1);
      return `<div class="timeline-eintrag"><time>${fmtDatum(d)}</time><span>${e.text}</span></div>`;
    }).join('')
    : '<p class="muted">Keine Entscheidungen protokolliert.</p>';
}

function urteil(score) {
  if (score >= 80) return 'Ein robustes Betongold-Leben.';
  if (score >= 60) return 'Vermögen aufgebaut — mit echten Kompromissen.';
  if (score >= 40) return 'Durchgekommen, aber nicht ohne Risse.';
  return 'Ein bewegtes Finanzleben mit offenen Baustellen.';
}

function renderChart(linien) {
  const svg = document.getElementById('endgame-chart');
  const alle = Object.values(linien).flat();
  const maxMonat = Math.max(1, ...alle.map((p) => p.monat));
  const minWert = Math.min(0, ...alle.map((p) => p.wert));
  const maxWert = Math.max(1, ...alle.map((p) => p.wert));
  const breite = 920;
  const hoehe = 350;
  const pad = { l: 72, r: 22, o: 20, u: 34 };
  const x = (m) => pad.l + m / maxMonat * (breite - pad.l - pad.r);
  const y = (v) => pad.o + (maxWert - v) / (maxWert - minWert || 1) * (hoehe - pad.o - pad.u);
  const serien = [
    ['ohneKaeufe', 'end-ohne'], ['spieler', 'end-spieler'], ['etf', 'end-etf'],
    ['eigenheim', 'end-eigenheim'], ['invest', 'end-invest'],
  ];
  let html = '';
  for (let i = 0; i <= 4; i++) {
    const wert = minWert + (maxWert - minWert) * i / 4;
    const py = y(wert);
    html += `<line x1="${pad.l}" y1="${py}" x2="${breite - pad.r}" y2="${py}" class="grid"/>` +
      `<text x="${pad.l - 8}" y="${py + 4}" class="achse" text-anchor="end">${kurz(wert)}</text>`;
  }
  for (const [id, klasse] of serien) {
    const punkte = linien[id].map((p) => `${x(p.monat).toFixed(1)},${y(p.wert).toFixed(1)}`).join(' ');
    html += `<polyline points="${punkte}" class="end-linie ${klasse}"/>`;
  }
  const endwerte = Object.fromEntries(
    Object.entries(linien).map(([id, punkte]) => [id, punkte.at(-1)?.wert || 0])
  );
  svg.setAttribute('aria-label',
    `Endvergleich: Spieler ${fmtEUR(endwerte.spieler)}, ohne Käufe ${fmtEUR(endwerte.ohneKaeufe)}, ` +
    `ETF ${fmtEUR(endwerte.etf)}, Eigenheim-first ${fmtEUR(endwerte.eigenheim)}, Invest-first ${fmtEUR(endwerte.invest)}.`
  );
  svg.innerHTML = html;
}

function kurz(wert) {
  const abs = Math.abs(wert);
  const vorzeichen = wert < 0 ? '−' : '';
  if (abs >= 1000000) return `${vorzeichen}${(abs / 1000000).toFixed(1).replace('.', ',')} Mio.`;
  if (abs >= 1000) return `${vorzeichen}${Math.round(abs / 1000)} Tsd.`;
  return `${Math.round(wert)} €`;
}

