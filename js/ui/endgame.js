// ui/endgame.js — Screen 9: fünf Scores, Seed-Benchmarks und Timeline.

import { berechneEndauswertung } from '../endgame.js?v=59';
import { fmtEUR, fmtEURSigniert, fmtDatum } from './util.js?v=59';

const PHASEN_LABEL = {
  boom: 'Boom — Rückenwind für Märkte',
  seitwaerts: 'Seitwärtsmarkt — solide, aber unspektakulär',
  crash: 'Crash-Phase — schwieriges Marktumfeld',
};

const SCORE_META = {
  vermoegen: ['Nettovermögen', 'Vermögen am Lebensende'],
  cashflow: ['Passiver Cashflow', 'nach Kosten und Steuer-Schätzung'],
  resilienz: ['Resilienz', 'Beleihung und liquide Puffer'],
  stress: ['Stress', 'Zeitüberzug und Monate im Dispo'],
  familie: ['Familie', 'Schlussstand und Kampagnenschnitt'],
};

let ctx = null;

export function initEndgame(context) {
  ctx = context;
  document.getElementById('btn-endgame-dashboard').addEventListener('click', () => ctx.zeigeScreen('dashboard'));
  document.getElementById('btn-endgame-neu').addEventListener('click', () =>
    document.getElementById('btn-neu').click());
}

export function zeigeEnde(state) {
  ctx.setSpeed(0);
  const auswertung = berechneEndauswertung(state);
  renderEndgame(state, auswertung);
  ctx.zeigeScreen('endgame');
}

function renderEndgame(state, a) {
  const objekte = [...state.portfolio, ...(state.eigenheim ? [state.eigenheim] : [])];
  const schulden = objekte.reduce((summe, o) => summe + (o.darlehen?.restschuld || 0), 0);
  const liquideMittel = Math.max(0, state.cash) + state.etfDepot.wert;
  const benchmarkSpanne = Math.max(a.endwerte.etf, a.endwerte.eigenheim, a.endwerte.invest) -
    Math.min(a.endwerte.etf, a.endwerte.eigenheim, a.endwerte.invest);
  document.getElementById('endgame-zusammenfassung').innerHTML =
    `<div><span class="eyebrow">Lebensbilanz · ${Math.floor(a.lebensalter)} Jahre</span>` +
    `<h1>${urteil(a.scores.gesamt)}</h1>` +
    `<p>Gesamtscore <b>${Math.round(a.scores.gesamt)}/100</b> · ` +
    `${PHASEN_LABEL[state.marktphase] || state.marktphase} · Seed ${state.seedText || state.seed}</p></div>` +
    `<div class="endgame-hauptwert"><span>Nettovermögen</span><b>${fmtEUR(a.vermoegen)}</b>` +
    `<small>${fmtEURSigniert(a.vermoegen - a.endwerte.etf)} gegenüber reinem ETF</small></div>`;

  document.getElementById('endgame-scores').innerHTML = Object.entries(SCORE_META)
    .map(([id, [label, sub]]) => {
      const wert = Math.round(a.scores[id]);
      return `<article class="score-karte"><div class="score-ring" style="--score:${wert}"><b>${wert}</b></div>` +
        `<div><h3>${label}</h3><p>${sub}</p></div></article>`;
    }).join('');

  document.getElementById('endgame-details').innerHTML =
    `<div><span>Liquide Mittel</span><b>${fmtEUR(liquideMittel)}</b></div>` +
    `<div><span>Restschulden</span><b>${fmtEUR(schulden)}</b></div>` +
    `<div><span>Nachhaltiger Cashflow</span><b>${fmtEURSigniert(a.cashflow)}/Mon.</b></div>` +
    `<div><span>Finanzierungsquote</span><b>${Math.round(a.ltv * 100)} %</b></div>` +
    `<div><span>Puffer</span><b>${a.deckungMonate.toFixed(1).replace('.', ',')} Monate</b></div>` +
    `<div><span>Ø Familie</span><b>${Math.round(a.familieSchnitt)}/100</b></div>` +
    `<div><span>Jahre im Ruhestand</span><b>${a.ruhestandsdauer.toFixed(1).replace('.', ',')}</b></div>` +
    `<div><span>Langzeit-Stress</span><b>${Math.round(a.lebensstress * 100)} %</b></div>` +
    `<div><span>Ø Zeitüberzug</span><b>${a.zeitUeberzugSchnitt.toFixed(1).replace('.', ',')} Std./Mon.</b></div>` +
    `<div><span>Monate im Dispo</span><b>${Math.round(a.negativCashAnteil * 100)} %</b></div>` +
    `<p class="endgame-einordnung"><b>Einordnung:</b> Die drei Referenzstrategien liegen in diesem Seed ` +
    `${fmtEUR(benchmarkSpanne)} auseinander. Vermögen ist deshalb nur eine von fünf Perspektiven; ` +
    `Liquidität, Schulden, verlässlicher Cashflow, Zeitstress und Familienalltag bleiben getrennt sichtbar.</p>`;

  renderChart(a.linien);
  document.getElementById('endgame-vergleich').innerHTML = [
    ['Deine Entscheidungen', a.endwerte.spieler, 'spieler'],
    ['Reiner ETF', a.endwerte.etf, 'etf'],
    ['Eigenheim-first', a.endwerte.eigenheim, 'eigenheim'],
    ['Invest-first', a.endwerte.invest, 'invest'],
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
    ['spieler', 'end-spieler'], ['etf', 'end-etf'],
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
    `Endvergleich: Spieler ${fmtEUR(endwerte.spieler)}, ETF ${fmtEUR(endwerte.etf)}, ` +
    `Eigenheim-first ${fmtEUR(endwerte.eigenheim)}, Invest-first ${fmtEUR(endwerte.invest)}.`
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

