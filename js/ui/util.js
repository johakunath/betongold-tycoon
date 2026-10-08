// util.js — deutsche Formatierung für Geld, Daten, Vorzeichen.

const eurFmt = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const datumFmt = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });

export function fmtEUR(n) {
  return eurFmt.format(n);
}

// Kompakt für Achsen: 1.250.000 → "1,25 Mio €", 250.000 → "250 Tsd €".
export function fmtEURKompakt(n) {
  const abs = Math.abs(n);
  if (abs >= 1e6) {
    return (n / 1e6).toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ' Mio €';
  }
  if (abs >= 1e3) return Math.round(n / 1e3).toLocaleString('de-DE') + ' Tsd €';
  return Math.round(n).toLocaleString('de-DE') + ' €';
}

// Mit Vorzeichen: +1.000 € / −250 €.
export function fmtEURSigniert(n) {
  const kern = eurFmt.format(Math.abs(n));
  if (Math.round(n) === 0) return '±' + kern;
  return (n > 0 ? '+' : '−') + kern;
}

export function fmtDatum(d) {
  return datumFmt.format(d);
}

// Prozentwerte mit deutschem Dezimalkomma: 2.9 → "2,9 %". Ohne diesen Helfer
// stand in Exposé und Marktplatz als einzige Stelle im Spiel ein Punkt.
export function fmtProzent(n, stellen = 1) {
  return `${Number(n).toLocaleString('de-DE', {
    minimumFractionDigits: stellen,
    maximumFractionDigits: stellen,
  })} %`;
}

// Einheitliche, tastaturbedienbare Erklärhilfe für kompakte Faktentabellen.
// Ein echter Button: nativ fokussierbar, korrekt als Bedienelement angekündigt.
export function faktenLabel(label, erklaerung) {
  const sicher = (wert) => String(wert).replace(/[&<>"']/g, (zeichen) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[zeichen]);
  return `${sicher(label)} <button type="button" class="info-tooltip" ` +
    `aria-label="Info: ${sicher(erklaerung)}" data-tooltip="${sicher(erklaerung)}">?</button>`;
}


// Anzeige nominal oder in heutigen Euro (Kaufkraft des Spielstarts). Reine
// Anzeigevorliebe je Browser; die Engine rechnet immer nominal.
const EURO_MODUS_SCHLUESSEL = 'betongold.euroModus';

export function euroModus() {
  try {
    return localStorage.getItem(EURO_MODUS_SCHLUESSEL) === 'heute' ? 'heute' : 'nominal';
  } catch {
    return 'nominal';
  }
}

export function setzeEuroModus(modus) {
  try {
    localStorage.setItem(EURO_MODUS_SCHLUESSEL, modus === 'heute' ? 'heute' : 'nominal');
  } catch {
    // ohne Speicher bleibt die Wahl nur für diese Sitzung bis zum Reload sichtbar
  }
  document.dispatchEvent(new CustomEvent('euromodus'));
}

// Teilt einen nominalen Wert durch das Preisniveau, wenn heutige Euro gewählt sind.
export function inAnzeigeEuro(wert, preisniveau = 1) {
  return euroModus() === 'heute' && preisniveau > 0 ? wert / preisniveau : wert;
}

export function euroUmschalterHTML() {
  const modus = euroModus();
  return `<div class="euro-umschalter" role="group" aria-label="Beträge anzeigen als">` +
    `<button type="button" data-euro-modus="nominal" aria-pressed="${modus === 'nominal'}">nominal</button>` +
    `<button type="button" data-euro-modus="heute" aria-pressed="${modus === 'heute'}" ` +
    `title="Kaufkraft in Euro des Spielstarts (2 % Inflation p.a. als Default-Annahme)">heutige €</button></div>`;
}

// Ein delegierter Handler für alle Umschalter; Node-Tests importieren util.js
// ohne DOM.
if (typeof document !== 'undefined') {
  document.addEventListener('click', (ev) => {
    const knopf = ev.target.closest?.('[data-euro-modus]');
    if (knopf) setzeEuroModus(knopf.dataset.euroModus);
  });
}
