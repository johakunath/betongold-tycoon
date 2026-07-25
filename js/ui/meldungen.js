// meldungen.js — gemeinsame visuelle und semantische Einordnung des Spiel-Logs.
// Stadtpost und Glockenarchiv verwenden absichtlich exakt dieselbe Zuordnung.

export function meldungMeta(eintrag, state) {
  const text = String(eintrag?.text || '');
  const klein = text.toLowerCase();
  const objekt = (state?.portfolio || []).find((o) =>
    o.listingId === eintrag?.ziel || (o.titel && text.includes(o.titel))) ||
    (state?.eigenheim && (state.eigenheim.listingId === eintrag?.ziel || text.includes(state.eigenheim.titel)) ? state.eigenheim : null);
  const ziel = eintrag?.ziel || objekt?.listingId;
  const markt = ziel && state?.markt?.feed?.[ziel];
  if (eintrag?.aktion === 'bewerber') return { klasse: 'mieter', symbol: '👥', label: 'Bewerber ansehen', zielTyp: 'objekt', ziel: eintrag.ziel, aktion: true };
  if (klein.includes('sondertilgung')) return { klasse: 'aktion', symbol: '↘', label: 'Objekt und Sondertilgung öffnen', zielTyp: objekt ? 'objekt' : 'objekte', ziel, aktion: true };
  if (klein.includes('renovier') || klein.includes('mangel') || klein.includes('reparatur')) return { klasse: 'arbeit', symbol: '🛠', label: 'Objekt öffnen', zielTyp: objekt ? 'objekt' : 'objekte', ziel, aktion: true };
  // Steuertexte können Wörter wie „Vermietungsverlust“ enthalten. Finanzen muss
  // deshalb vor der allgemeineren Vermietungsregel ausgewertet werden.
  if (klein.includes('steuer') || klein.includes('etf') || klein.includes('tagesgeld') || klein.includes('kapitalsteuer') || klein.includes('darlehen')) return { klasse: 'finanzen', symbol: '€', label: 'Finanzen öffnen', zielTyp: 'finanzen', aktion: false };
  if (klein.includes('mieter') || klein.includes('vermiet') || klein.includes('eingezogen') || klein.includes('leer')) return { klasse: 'mieter', symbol: '⌂', label: 'Objekt öffnen', zielTyp: objekt ? 'objekt' : 'objekte', ziel, aktion: !!objekt };
  if (klein.includes('einkommen') || klein.includes('familie') || klein.includes('lebensphase')) return { klasse: 'haushalt', symbol: '≋', label: 'Haushalt öffnen', zielTyp: 'haushalt', aktion: false };
  if (objekt) return { klasse: 'objekt', symbol: '⌂', label: 'Objekt öffnen', zielTyp: 'objekt', ziel, aktion: true };
  if (markt) return { klasse: 'markt', symbol: '◆', label: 'Angebot öffnen', zielTyp: 'expose', ziel, aktion: true };
  return { klasse: 'info', symbol: 'i', label: 'Zur Stadt', zielTyp: 'karte', aktion: false };
}

