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

// Einheitliche, tastaturbedienbare Erklärhilfe für kompakte Faktentabellen.
// Ein echter Button: nativ fokussierbar, korrekt als Bedienelement angekündigt.
export function faktenLabel(label, erklaerung) {
  const sicher = (wert) => String(wert).replace(/[&<>"']/g, (zeichen) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[zeichen]);
  return `${sicher(label)} <button type="button" class="info-tooltip" ` +
    `aria-label="Info: ${sicher(erklaerung)}" data-tooltip="${sicher(erklaerung)}">?</button>`;
}
