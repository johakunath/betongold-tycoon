// life.js — DOM-/RNG-freie Familien-, Arbeits- und Lebensphasenverträge.

function modell(state) {
  const id = state.entwicklung?.arbeitsmodellId || 'balance';
  return { id, ...(state.config.entwicklung.arbeitsmodelle[id] || state.config.entwicklung.arbeitsmodelle.balance) };
}

export function arbeitsmodell(state) {
  const m = modell(state);
  const ruhestand = state.config.zeit.startAlter + state.monat / 12 >= state.config.zeit.rentenAlter;
  return {
    ...m,
    einkommenDeltaMonat: ruhestand ? 0 : m.einkommenDeltaMonat,
    zeitPlusMonat: ruhestand ? 0 : m.zeitPlusMonat,
    zeitBelastungMonat: ruhestand ? 0 : m.zeitBelastungMonat,
    familieZielDelta: ruhestand ? 0 : m.familieZielDelta,
  };
}

export function arbeitsmodellRestbindung(state) {
  const seit = state.entwicklung?.arbeitsmodellSeitMonat ?? 0;
  return Math.max(0, state.config.entwicklung.arbeitsmodellBindungMonate - (state.monat - seit));
}

export function setzeArbeitsmodell(state, id) {
  const option = state.config.entwicklung.arbeitsmodelle[id];
  if (!option) throw new Error('Unbekanntes Arbeitsmodell.');
  if (id === state.entwicklung.arbeitsmodellId) return false;
  const rest = arbeitsmodellRestbindung(state);
  if (rest > 0) throw new Error(`Das aktuelle Arbeitsmodell läuft noch ${rest} Monate.`);
  const vorher = arbeitsmodell(state);
  state.entwicklung.arbeitsmodellId = id;
  state.entwicklung.arbeitsmodellSeitMonat = state.monat;
  state.log.push({ monat: state.monat, text: `Familienentscheidung: ${vorher.label} → ${option.label}; für zwölf Monate festgelegt.` });
  state.entscheidungsHistorie.push({
    monat: state.monat, typ: 'arbeitsmodell', titel: 'Arbeit und Familie neu gewichtet',
    text: `${option.label}: ${option.einkommenDeltaMonat >= 0 ? '+' : ''}${option.einkommenDeltaMonat} € Netto/Monat, ` +
      `${option.zeitPlusMonat - option.zeitBelastungMonat >= 0 ? '+' : ''}${option.zeitPlusMonat - option.zeitBelastungMonat} h Immobilienzeit/Monat, Familienziel ${option.familieZielDelta >= 0 ? '+' : ''}${option.familieZielDelta}.`,
    ziel: null, route: 'haushalt',
  });
  return true;
}

export function zeitbudgetMonat(state) {
  return Math.max(0, state.config.budget.zeitProMonat + arbeitsmodell(state).zeitPlusMonat);
}

function kandidat(id, monat, titel, text) {
  return { id, monat, titel, text };
}

export function naechsteLebensphase(state) {
  const h = state.config.haushalt;
  const kandidaten = [];
  if ((h.autoKostenMonat || 0) > 0 && h.autoAbMonat > state.monat) {
    kandidaten.push(kandidat('auto', h.autoAbMonat, 'Auto-Pauschale beginnt', `${Math.round(h.autoKostenMonat).toLocaleString('de-DE')} € zusätzliche Monatskosten einplanen.`));
  }
  for (const sprung of h.einkommensSpruenge || []) {
    if (sprung.abMonat > state.monat) kandidaten.push(kandidat(`einkommen-${sprung.abMonat}`, sprung.abMonat, sprung.label, `Das Erwerbsnetto verändert sich planmäßig um Faktor ${sprung.faktor.toLocaleString('de-DE')}.`));
  }
  const renteMonat = Math.round((state.config.zeit.rentenAlter - state.config.zeit.startAlter) * 12);
  if (renteMonat > state.monat) kandidaten.push(kandidat('ruhestand', renteMonat, 'Ruhestand', `Das fortgeschriebene Erwerbsnetto sinkt auf ${Math.round(h.rentenNettoFaktor * 100)} %.`));
  h.kinder.forEach((kind, index) => {
    const auszug = Math.round((h.auszugsAlter - kind.alter) * 12);
    if (auszug > state.monat) kandidaten.push(kandidat(`kind-${index}-auszug`, auszug, `Kind ${index + 1}: Auszug`, 'Kinderkosten und Kindergeld enden im Modell monatsscharf.'));
    for (const stufe of h.kinderKosten.slice(0, -1)) {
      const monat = Math.round((stufe.bisAlter + 1 - kind.alter) * 12);
      if (monat > state.monat) kandidaten.push(kandidat(`kind-${index}-stufe-${stufe.bisAlter}`, monat, `Kind ${index + 1}: neue Kostenphase`, 'Die transparente Kinderkostenstaffel wechselt.'));
    }
  });
  return kandidaten.sort((a, b) => a.monat - b.monat)[0] || null;
}

export function aktualisiereLebensphasen(state) {
  const phase = naechsteLebensphase(state);
  if (!phase) return null;
  const rest = phase.monat - state.monat;
  const gezeigt = state.entwicklung.lebensphasenAngekundigt;
  if (rest > state.config.entwicklung.lebensphaseVorlaufMonate || gezeigt.includes(phase.id)) return null;
  gezeigt.push(phase.id);
  state.log.push({ monat: state.monat, text: `Lebensphase in ${rest} Monaten: ${phase.titel}. ${phase.text}` });
  return phase;
}

