// gameplay.js — DOM- und RNG-freier Vertrag für Handlungsketten und Wirkungen.
// Fachmodule protokollieren hier bewusst getroffene Entscheidungen; die UI
// leitet daraus Monatsanlass, Prüfstand und kurze Vorher/Nachher-Momente ab.

import { getListing } from './content.js?v=41';
import { naechsteLebensphase } from './life.js?v=41';

function historie(state) {
  if (!Array.isArray(state.entscheidungsHistorie)) state.entscheidungsHistorie = [];
  return state.entscheidungsHistorie;
}

function dealMap(state) {
  if (!state.dealEntscheidungen || typeof state.dealEntscheidungen !== 'object') {
    state.dealEntscheidungen = {};
  }
  return state.dealEntscheidungen;
}

export function protokolliereWirkung(state, eintrag) {
  const gespeichert = {
    monat: state.monat,
    typ: eintrag.typ || 'entscheidung',
    titel: eintrag.titel || 'Entscheidung getroffen',
    text: eintrag.text || '',
    ziel: eintrag.ziel || null,
    route: eintrag.route || null,
  };
  historie(state).push(gespeichert);
  return gespeichert;
}

export function letzteWirkung(state) {
  return historie(state).at(-1) || null;
}

export function pruefstand(state, id) {
  const dd = state.dd[id] || {};
  const schritte = [dd.besichtigt, dd.dokumente, dd.gutachten].filter(Boolean).length;
  const cfg = state.config.dueDiligence;
  const zeit = (dd.besichtigt ? cfg.besichtigungZeit : 0) +
    (dd.dokumente ? cfg.dokumenteZeit : 0) + (dd.gutachten ? cfg.gutachterZeit : 0);
  const kosten = dd.gutachten ? cfg.gutachterKosten : 0;
  const funde = (dd.aufgedeckteMaengel || []).length + (dd.sonderumlageBekannt ? 1 : 0);
  // DD reduziert Unsicherheit sichtbar, verspricht aber auch vollständig nie
  // Mangelfreiheit. Die Stufen sind UI-Sprache, keine Kaufwahrscheinlichkeit.
  const restunsicherheit = [100, 72, 43, 15][schritte];
  const label = restunsicherheit <= 15 ? 'niedrig, nie null'
    : restunsicherheit <= 43 ? 'mittel' : restunsicherheit <= 72 ? 'hoch' : 'sehr hoch';
  return { schritte, gesamt: 3, zeit, kosten, funde, restunsicherheit, label };
}

export function dealEntscheidung(state, id) {
  return dealMap(state)[id] || null;
}

export function setzeDealEntscheidung(state, id, typ, preis) {
  const listing = getListing(id);
  const stand = pruefstand(state, id);
  const entscheidung = {
    typ,
    monat: state.monat,
    preis: Math.round(preis || 0),
    pruefungen: stand.schritte,
    funde: stand.funde,
  };
  dealMap(state)[id] = entscheidung;
  const verworfen = typ === 'verworfen';
  protokolliereWirkung(state, {
    typ: verworfen ? 'weggegangen' : 'beobachtet',
    titel: verworfen ? 'Guter Weggang' : 'Bewusst beobachten',
    text: verworfen
      ? `${listing.titel} verworfen: ${stand.schritte}/3 Prüfungen, ${stand.funde} Risikohinweise; kein Kapital gebunden.`
      : `${listing.titel} auf Beobachtung: Preis und Marktzeit werden zur nächsten Chance vergleichbar.`,
    ziel: id,
    route: 'expose',
  });
  return entscheidung;
}

export function oeffneDealEntscheidung(state, id) {
  delete dealMap(state)[id];
}

export function monatsAnlass(state) {
  const feed = Object.entries(state.markt?.feed || {});
  const reserviert = feed.find(([, e]) => e.status === 'reserviert');
  if (reserviert) {
    const listing = getListing(reserviert[0]);
    return {
      typ: 'expose', ziel: listing.id, phase: 'Entscheidung',
      titel: `${listing.titel}: Zusage klären`,
      text: 'Das Gebot ist angenommen. Finanzierung abschließen oder bewusst zurücktreten.',
      button: 'Entscheidung öffnen',
    };
  }

  const leer = state.portfolio.find((o) => !o.vermietet && !o.renovierung && !o.verkauf);
  if (leer) {
    return {
      typ: 'objekt', ziel: leer.listingId, phase: 'Wirkung',
      titel: `${leer.titel} produktiv machen`,
      text: 'Leerstand ist sichtbar wirksam. Vermieten oder gezielt renovieren ist der nächste Zug.',
      button: 'Objekt öffnen',
    };
  }

  if (state.startPreset === state.config.turnaround?.preset && state.portfolio.length >= 4 &&
      state.monat < state.config.turnaround.bankFensterMonate) {
    const genutzt = state.turnaround?.bankAnpassungen || 0;
    return {
      typ: 'portfolio', phase: 'Turnaround',
      titel: 'Verlustträger zuerst triagieren',
      text: `Das Bankfenster läuft noch ${state.config.turnaround.bankFensterMonate - state.monat} Monate; ${genutzt}/${state.config.turnaround.bankMaxAnpassungen} begrenzten Terminen sind genutzt. Miete, Rate und Exit objektweise vergleichen.`,
      button: 'Triage öffnen',
    };
  }

  const amMarkt = feed.filter(([, e]) => e.status === 'amMarkt');
  const beobachtet = amMarkt.find(([id]) => dealEntscheidung(state, id)?.typ === 'beobachtet');
  if (beobachtet) {
    const [id] = beobachtet;
    const listing = getListing(id);
    const alt = dealEntscheidung(state, id);
    return {
      typ: 'expose', ziel: id, phase: 'Nächste Chance',
      titel: `${listing.titel} erneut einordnen`,
      text: state.monat > alt.monat
        ? `Seit eurer Beobachtung sind ${state.monat - alt.monat} Monat${state.monat - alt.monat === 1 ? '' : 'e'} vergangen. Preis, Konkurrenz und Prüfstand neu abgleichen.`
        : 'Ihr beobachtet dieses Angebot bewusst. Beim nächsten Monat werden Marktzeit und Preis neu eingeordnet.',
      button: 'Beobachtung öffnen',
    };
  }

  const offen = amMarkt.find(([id]) => dealEntscheidung(state, id)?.typ !== 'verworfen');
  if (offen) {
    const listing = getListing(offen[0]);
    const stand = pruefstand(state, listing.id);
    return {
      typ: 'expose', ziel: listing.id, phase: stand.schritte ? 'Prüfung' : 'Anlass',
      titel: stand.schritte ? `${listing.titel}: Prüfung fortsetzen` : `${listing.titel} bewusst prüfen`,
      text: stand.schritte
        ? `${stand.schritte}/3 Prüfungen erledigt. Wissen sichern, dann bieten, beobachten oder weggehen.`
        : 'Ein reales Angebot ist der Anlass: erst Substanz und Unterlagen prüfen, dann begründet entscheiden.',
      button: 'Exposé öffnen',
    };
  }

  const lebensphase = naechsteLebensphase(state);
  if (amMarkt.length === 0 && lebensphase && lebensphase.monat - state.monat <= state.config.entwicklung.lebensphaseVorlaufMonate) {
    const rest = lebensphase.monat - state.monat;
    return {
      typ: 'haushalt', phase: `Lebensphase in ${rest} Monaten`,
      titel: lebensphase.titel,
      text: `${lebensphase.text} Arbeitsmodell, Puffer und Monatsplan jetzt gemeinsam prüfen.`,
      button: 'Familienplan öffnen',
    };
  }

  return {
    typ: 'marktplatz', phase: 'Beobachten',
    titel: amMarkt.length ? 'Bewusst weiter beobachten' : 'Auf die nächste Marktchance warten',
    text: amMarkt.length
      ? `${amMarkt.length} Angebot${amMarkt.length === 1 ? '' : 'e'} bewusst verworfen. Kein Kaufzwang: Puffer schützen und neue Chancen abwarten.`
      : 'Gerade ist kein offenes Angebot da. Der Markt bewegt sich weiter; euer Puffer bleibt ungebunden.',
    button: 'Marktplatz öffnen',
  };
}
