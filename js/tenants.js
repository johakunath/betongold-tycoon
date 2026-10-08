// tenants.js — Mieterwahl, Neuvermietung, monatliches Mieterverhalten,
// Mieterhöhung. Formeln: ECONOMY_MODEL §15–16. DOM-frei, RNG nur über state.js.

import { rngFloat, rngNormal } from './state.js?v=60';
import { vergleichsmiete } from './market.js?v=60';
import { alleTenants, getTenant } from './content.js?v=60';
import { meldeWartemoment } from './signals.js?v=60';
import { protokolliereWirkung } from './gameplay.js?v=60';
import { aktuellerBetrag } from './preisniveau.js?v=60';

// Erzielbare Marktmiete (kalt) für ein Objekt: Vergleichsmiete × Zustandsfaktor.
export function marktmiete(state, objekt) {
  const f = state.config.mieter.zustandMietFaktor[objekt.zustand] ?? 1;
  return vergleichsmiete(state, objekt) * f;
}

export function vermietungsmodell(state, modellId = 'regulaer') {
  const id = modellId === true ? 'moebliert' : modellId === false || !modellId ? 'regulaer' : modellId;
  return { id, ...(state.config.mieter.vermietungsmodelle?.[id] || state.config.mieter.vermietungsmodelle.regulaer) };
}

// Angesetzte Miete für eine geplante Vermietung (Mietniveau + Vermietungsweg).
export function angesetzteMiete(state, objekt, niveauId, modellId = 'regulaer') {
  const m = state.config.mieter;
  const niveau = m.mietNiveaus[niveauId];
  const basis = marktmiete(state, objekt) * niveau.faktor;
  return Math.round(basis * (1 + vermietungsmodell(state, modellId).aufschlag));
}

function qualiWert(t) {
  return (t.zahlungsmoral + t.pflege + t.bleibe + (1 - t.konflikt)) / 4;
}

// --- Bewerbersuche ----------------------------------------------------------

// Startet eine Suche am gewählten Mietniveau (Objekt muss leer sein).
export function starteVermietung(state, objekt, niveauId, modellId = 'regulaer') {
  const modell = vermietungsmodell(state, modellId);
  objekt.suche = {
    niveau: niveauId,
    modell: modell.id,
    moebliert: modell.id !== 'regulaer', // Rückwärtskompatibilität in Anzeigen/Tests
    miete: angesetzteMiete(state, objekt, niveauId, modell.id),
    bewerber: [],
    generiertMonat: -1,
  };
  neueBewerber(state, objekt);
  return objekt.suche;
}

// Zieht (seeded) eine neue Bewerberrunde. Bei „über Marktmiete" bleibt der
// Pool manchmal leer → ein weiterer Leerstandsmonat.
export function neueBewerber(state, objekt) {
  const m = state.config.mieter;
  const niveau = m.mietNiveaus[objekt.suche.niveau];
  const suche = objekt.suche;
  suche.generiertMonat = state.monat;

  const modell = vermietungsmodell(state, suche.modell || suche.moebliert);
  const stadt = state.config.segmente[objekt.segment]?.stadt || 'meissen';
  const nachfrageFaktor = stadt === 'berlin' ? .35 : stadt === 'leipzig' ? .75 : 1.15;
  if (rngFloat(state) < Math.min(.9, (niveau.leerstandsRisiko + modell.leerstandsRisiko) * nachfrageFaktor)) {
    suche.bewerber = [];
    return suche;
  }
  let n = niveau.poolBasis + (stadt === 'berlin' ? 2 : stadt === 'leipzig' ? 1 : 0) +
    (Math.floor(rngFloat(state) * 3) - 1); // ±1
  n = Math.max(m.poolMin, Math.min(m.poolMax, n));

  // Bewerber nach versteckter Qualität + Seed-Rauschen + Niveau-Skew sortieren.
  const bewertet = alleTenants().map((t) => ({
    t,
    s: qualiWert(t) + niveau.qualiSkew + rngNormal(state) * 0.2,
  }));
  bewertet.sort((a, b) => b.s - a.s);
  suche.bewerber = bewertet.slice(0, n).map(({ t }) => ({
    id: t.id,
    miete: suche.miete,
    einkommensquote: t.nettoEinkommen ? suche.miete / t.nettoEinkommen : null,
  }));
  return suche;
}

// Bewerber einziehen lassen.
export function waehleBewerber(state, objekt, tenantId) {
  const m = state.config.mieter;
  const suche = objekt.suche;
  const t = getTenant(tenantId);
  if (!t) throw new Error(`Unbekannter Bewerber: ${tenantId}`);

  const modell = vermietungsmodell(state, suche.modell || suche.moebliert);
  if (modell.moebelKosten > 0 && !objekt.moebliert) {
    const moebel = Math.round(aktuellerBetrag(state, modell.moebelKosten));
    state.cash -= moebel;
    state.log.push({
      monat: state.monat,
      text: `${objekt.titel}: für ${modell.label} mit ${moebel.toLocaleString('de-DE')} € eingerichtet.`,
    });
  }
  objekt.vermietungsart = modell.id;
  objekt.moebliert = modell.id !== 'regulaer';
  objekt.kaltmiete = suche.miete;
  objekt.vermietet = true;
  objekt.mieter = {
    id: t.id,
    name: t.name,
    archetyp: t.archetyp,
    zahlungsmoral: t.zahlungsmoral,
    pflege: t.pflege,
    bleibe: t.bleibe,
    konflikt: t.konflikt,
    zufriedenheit: 0,
    eingezogen: state.monat,
  };
  objekt.kappungFensterStart = state.monat;
  objekt.kappungBasis = suche.miete;
  objekt.suche = null;
  state.log.push({
    monat: state.monat,
    text: `${objekt.titel}: ${t.name} eingezogen (${suche.miete.toLocaleString('de-DE')} € kalt).`,
  });
  protokolliereWirkung(state, {
    typ: 'vermietet',
    titel: 'Vermietung abgeschlossen',
    text: `${objekt.titel}: Leerstand → ${t.name}, ${suche.miete.toLocaleString('de-DE')} € Kaltmiete pro Monat.`,
    ziel: objekt.listingId,
    route: 'objekt',
  });
}

// --- Mieterhöhung (Kappungsgrenze abstrahiert) ------------------------------

export function mietrechtFuer(state, objekt) {
  const segment = state.config.segmente[objekt.segment];
  return state.config.mietrecht?.[segment?.stadt] || {
    label: 'Standard-Mietrecht',
    kurz: 'Standardregeln',
    kappungProzent: state.config.mieter.kappungProzent,
    kappungMonate: state.config.mieter.kappungMonate,
    mieterhoehungUnzufriedenheit: state.config.mieter.mieterhoehungUnzufriedenheit,
  };
}

// Obergrenze: min(Marktmiete inkl. möbliert, Kappungsbasis × (1+Kappung)).
export function maxMiete(state, objekt) {
  const m = state.config.mieter;
  const recht = mietrechtFuer(state, objekt);
  // Kappungsfenster ggf. zurücksetzen
  if (state.monat - objekt.kappungFensterStart >= recht.kappungMonate) {
    objekt.kappungFensterStart = state.monat;
    objekt.kappungBasis = objekt.kaltmiete;
  }
  const markt = marktmiete(state, objekt) * (1 + vermietungsmodell(state, objekt.vermietungsart || objekt.moebliert).aufschlag);
  const kappe = objekt.kappungBasis * (1 + recht.kappungProzent);
  return Math.floor(Math.min(markt, kappe));
}

export function kannErhoehen(state, objekt) {
  return objekt.vermietet && objekt.mieter && maxMiete(state, objekt) > objekt.kaltmiete + 1;
}

export function erhoeheMiete(state, objekt) {
  if (!kannErhoehen(state, objekt)) return false;
  const neu = maxMiete(state, objekt);
  const alt = objekt.kaltmiete;
  objekt.kaltmiete = neu;
  objekt.mieter.zufriedenheit -= mietrechtFuer(state, objekt).mieterhoehungUnzufriedenheit;
  state.log.push({
    monat: state.monat,
    text: `${objekt.titel}: Miete erhöht ${Math.round(alt).toLocaleString('de-DE')} → ${neu.toLocaleString('de-DE')} €.`,
  });
  protokolliereWirkung(state, {
    typ: 'mietpruefung',
    titel: 'Mietprüfung umgesetzt',
    text: `${objekt.titel}: Kaltmiete ${Math.round(alt).toLocaleString('de-DE')} → ${neu.toLocaleString('de-DE')} €/Monat; Objekt-Cashflow verbessert sich um ${Math.round(neu - alt).toLocaleString('de-DE')} €/Monat, Mieterzufriedenheit sinkt.`,
    ziel: objekt.listingId,
    route: 'objekt',
  });
  return true;
}

// --- Eigenbedarf (vereinfachtes Spielmodell) --------------------------------

export function starteEigenbedarf(state, objekt, ziel = 'selbst') {
  if (!objekt.vermietet || !objekt.mieter) throw new Error('Eigenbedarf setzt ein laufendes Mietverhältnis voraus.');
  if (objekt.eigenbedarf) throw new Error('Für dieses Objekt läuft bereits Eigenbedarf.');
  if (ziel.startsWith('kind-')) {
    const index = Number(ziel.slice(5));
    const kind = state.config.haushalt.kinder[index];
    if (!kind || kind.alter + state.monat / 12 < 18) throw new Error('Dieses Kind ist noch nicht volljährig.');
  }
  const mietdauer = Math.max(0, state.monat - (objekt.mieter.eingezogen || 0));
  const frist = mietdauer < 60 ? 3 : mietdauer < 96 ? 6 : 9;
  objekt.eigenbedarf = { ziel, status: 'angekuendigt', startMonat: state.monat, auszugMonat: state.monat + frist, frist };
  state.log.push({ monat: state.monat, text: `${objekt.titel}: Eigenbedarf für ${ziel === 'selbst' ? 'euch selbst' : 'ein erwachsenes Kind'} angemeldet; Frist ${frist} Monate.` });
  return objekt.eigenbedarf;
}

export function zieheEigenbedarfZurueck(state, objekt) {
  if (!objekt.eigenbedarf) return false;
  objekt.eigenbedarf = null;
  state.log.push({ monat: state.monat, text: `${objekt.titel}: Eigenbedarf zurückgezogen.` });
  return true;
}

export function zahleEigenbedarfAbfindung(state, objekt) {
  const vorgang = objekt.eigenbedarf;
  if (!vorgang || vorgang.status !== 'klage') throw new Error('Aktuell gibt es keinen offenen Eigenbedarfs-Konflikt.');
  state.cash -= vorgang.abfindung;
  const betrag = vorgang.abfindung;
  eigenbedarfAuszug(state, objekt, vorgang.ziel, `Einigung nach Konflikt; ${betrag.toLocaleString('de-DE')} € Abfindung`);
  return betrag;
}

function eigenbedarfAuszug(state, objekt, ziel, grund) {
  objekt.vermietet = false;
  objekt.mieter = null;
  objekt.kaltmiete = 0;
  objekt.suche = null;
  objekt.eigenbedarf = null;
  objekt.eigenbedarfFreigabe = ziel;
  if (ziel.startsWith('kind-')) {
    objekt.familienNutzung = ziel;
    objekt.nutzung = 'familie';
  }
  state.log.push({ monat: state.monat, text: `${objekt.titel}: Wohnung wegen Eigenbedarfs frei (${grund}).` });
  meldeWartemoment(state, `${objekt.titel}: Eigenbedarf abgeschlossen. Die Wohnung ist jetzt frei.`, objekt.listingId);
}

function tickEigenbedarf(state, objekt) {
  const vorgang = objekt.eigenbedarf;
  // Der Tick verbucht den kommenden Monat; am Ende der ausgewiesenen Frist
  // soll die Entscheidung bereits gefallen sein, nicht erst einen Monat später.
  if (!vorgang || vorgang.status !== 'angekuendigt' || state.monat + 1 < vorgang.auszugMonat) return false;
  const stadt = state.config.segmente[objekt.segment]?.stadt;
  const regional = stadt === 'berlin' ? .10 : stadt === 'leipzig' ? .04 : 0;
  const konflikt = Math.min(.55, .12 + (objekt.mieter?.konflikt || .15) * .25 + regional);
  if (rngFloat(state) < konflikt) {
    vorgang.status = 'klage';
    const eb = state.config.mieter.eigenbedarf || {};
    vorgang.abfindung = Math.round(Math.max(aktuellerBetrag(state, eb.abfindungMin ?? 6000),
      objekt.kaltmiete * (eb.abfindungMonatsmieten ?? 6) + aktuellerBetrag(state, eb.abfindungSockel ?? 2000)));
    state.log.push({ monat: state.monat, text: `${objekt.titel}: Widerspruch gegen Eigenbedarf; eine Einigung würde ${vorgang.abfindung.toLocaleString('de-DE')} € kosten.` });
    meldeWartemoment(state, `${objekt.titel}: Mieter widerspricht dem Eigenbedarf. Entscheidet über Abfindung oder Rückzug.`, objekt.listingId);
    return false;
  }
  eigenbedarfAuszug(state, objekt, vorgang.ziel, 'Kündigungsfrist abgelaufen');
  return true;
}

// --- Monatliches Verhalten (aus finance.tickObjekt, feste RNG-Reihenfolge) ---
// Reihenfolge: Zahlung → Pflege/Zustand → Zufriedenheits-Drift → Auszug.
// Gibt zurück, ob die Miete diesen Monat ausfällt.
export function mieterMonat(state, objekt) {
  const m = state.config.mieter;
  const mieter = objekt.mieter;
  if (tickEigenbedarf(state, objekt)) return { ausfall: true };
  const modell = vermietungsmodell(state, objekt.vermietungsart || objekt.moebliert);

  // Nur die riskanteren freiwillig gewählten Modelle ziehen diesen zusätzlichen
  // RNG-Wert. Reguläre Vermietung behält damit ihre bisherige Deterministik.
  const stadt = state.config.segmente[objekt.segment]?.stadt || 'leipzig';
  const rechtsrisiko = modell.rechtsrisiko?.[stadt] || 0;
  if (rechtsrisiko > 0 && rngFloat(state) < rechtsrisiko) {
    const rueckzahlung = Math.round(objekt.kaltmiete * modell.rueckzahlungMonate);
    state.cash -= rueckzahlung;
    objekt.vermietungsart = 'regulaer';
    objekt.moebliert = false;
    objekt.kaltmiete = Math.min(objekt.kaltmiete, Math.round(marktmiete(state, objekt)));
    state.log.push({ monat: state.monat, text: `${objekt.titel}: Mietmodell wurde geprüft; ${rueckzahlung.toLocaleString('de-DE')} € Rückzahlung/Kosten und Umstellung auf reguläre Vermietung.` });
    meldeWartemoment(state, `${objekt.titel}: Prüfung des Mietmodells. Rückzahlung fällig; Vermietung läuft regulär weiter.`, objekt.listingId);
  }

  const ausfall = rngFloat(state) < (1 - mieter.zahlungsmoral) * m.zahlungsausfallBasis;
  if (ausfall) {
    state.log.push({ monat: state.monat, text: `${objekt.titel}: Miete blieb diesen Monat aus.` });
  }

  // Pflege: schlechte Mieter kosten über die Jahre Zustand
  if (objekt.zustand > 1 && rngFloat(state) < (1 - mieter.pflege) / m.pflegeZustandsMonate) {
    objekt.zustand -= 1;
    state.log.push({ monat: state.monat, text: `${objekt.titel}: Zustand hat unter Abnutzung gelitten.` });
  }

  // Zufriedenheit driftet zurück zu 0
  mieter.zufriedenheit += (0 - mieter.zufriedenheit) * m.zufriedenheitErholung;

  // Auszug erst nach Mindestbleibe
  if (state.monat - mieter.eingezogen >= m.mindestBleibe) {
    const satF = 1 + Math.max(0, -mieter.zufriedenheit) * m.unzufriedenheitHebel;
    const pOut = m.auszugBasisRisiko * (1 + modell.churn) * satF;
    if (rngFloat(state) < pOut) {
      state.log.push({ monat: state.monat, text: `${objekt.titel}: ${mieter.name} ist ausgezogen — das Objekt steht leer.` });
      objekt.vermietet = false;
      objekt.mieter = null;
      meldeWartemoment(
        state,
        `${objekt.titel}: Mieter ausgezogen. Zeit pausiert — eine neue Vermietung ist nötig.`,
        objekt.listingId
      );
    }
  }
  return { ausfall };
}

