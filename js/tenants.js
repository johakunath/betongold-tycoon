// tenants.js — Mieterwahl, Neuvermietung, monatliches Mieterverhalten,
// Mieterhöhung. Formeln: ECONOMY_MODEL §15–16. DOM-frei, RNG nur über state.js.

import { rngFloat, rngNormal } from './state.js?v=61';
import { stammdaten, vergleichsmiete } from './market.js?v=61';
import { alleTenants, getTenant } from './content.js?v=61';
import { meldeWartemoment } from './signals.js?v=61';
import { protokolliereWirkung } from './gameplay.js?v=61';
import { aktuellerBetrag, preisniveau } from './preisniveau.js?v=61';

// Erzielbare Marktmiete (kalt) für ein Objekt: Vergleichsmiete × Zustandsfaktor.
export function marktmiete(state, objekt) {
  const f = state.config.mieter.zustandMietFaktor[objekt.zustand] ?? 1;
  return vergleichsmiete(state, objekt) * f;
}

export function vermietungsmodell(state, modellId = 'regulaer') {
  const id = modellId === true ? 'moebliert' : modellId === false || !modellId ? 'regulaer' : modellId;
  return { id, ...(state.config.mieter.vermietungsmodelle?.[id] || state.config.mieter.vermietungsmodelle.regulaer) };
}

function istNeubau(objekt) {
  const daten = stammdaten(objekt);
  return daten.stil === 'neubau' || Number(daten.baujahr) >= 2020;
}

function lageFaktor(state, objekt) {
  const b = state.config.bewertung;
  const referenz = b.lageBasis + 5 * b.lageJePunkt;
  return (b.lageBasis + (Number(objekt.lageScore) || 5) * b.lageJePunkt) / referenz;
}

// Ortsübliche Vergleichsmiete laut Mietspiegel (kalt, €/Monat, laufende Euro):
// Segmentanker × Zustand × Lage, bei Häusern × hausFaktor der Stadt.
// Grundlage für Mieterhöhungen (§ 558 BGB) und die Mietpreisbremse
// (§ 556d BGB). ECONOMY_MODEL §15a.
export function mietspiegelMiete(state, objekt) {
  const segment = state.config.segmente[objekt.segment];
  if (!Number.isFinite(segment?.mietspiegelM2)) return marktmiete(state, objekt);
  const f = state.config.mieter.zustandMietFaktor[objekt.zustand] ?? 1;
  const haus = stammdaten(objekt).objektart === 'haus'
    ? (state.config.mietrecht?.[segment.stadt]?.hausFaktor ?? 1)
    : 1;
  return objekt.flaeche * segment.mietspiegelM2 * haus * f * lageFaktor(state, objekt) * preisniveau(state);
}

// Zuletzt vereinbarte Kaltmiete ohne Möblierungsaufschlag (Vormiete). Für ein
// noch nicht gekauftes, vermietetes Angebot ist es dessen Bestandsmiete.
function vormieteBasis(state, objekt) {
  if (objekt.mietstatus?.vermietet && objekt.kaltmiete === undefined) {
    return (Number(objekt.mietstatus.kaltmiete) || 0) * preisniveau(state);
  }
  // Eine selbst unzulässige Vormiete schützt nicht (§ 556e BGB): Es zählt die
  // damals zulässige Miete.
  const verstoss = objekt.bremseVerstoss;
  const vorher = verstoss && !verstoss.geruegt ? verstoss.zulaessig : Number(objekt.kaltmiete) || 0;
  if (!vorher) return 0;
  return vorher / (1 + (vermietungsmodell(state, objekt.vermietungsart || objekt.moebliert).aufschlag || 0));
}

// Gilt bei einer Neuvermietung die Mietpreisbremse, und bis zu welcher
// Kaltmiete (ohne Möblierungsaufschlag)?
export function mietpreisbremse(state, objekt) {
  const cfg = state.config.mietpreisbremse;
  const stadt = state.config.segmente[objekt.segment]?.stadt;
  if (!cfg?.staedte?.[stadt]) return { gilt: false, grund: 'keine Mietpreisbremse in diesem Markt' };
  if (Number(stammdaten(objekt).baujahr) >= cfg.neubauAbBaujahr) return { gilt: false, grund: 'Neubau, Erstvermietung nach 2014' };
  if ((objekt.modernisierungM2 || 0) >= cfg.umfassendModernisiertM2) {
    return { gilt: false, grund: 'umfassend modernisiert' };
  }
  const mietspiegel = mietspiegelMiete(state, objekt);
  const grenze = mietspiegel * (1 + cfg.aufschlag);
  const vormiete = vormieteBasis(state, objekt);
  return {
    gilt: true,
    mietspiegel,
    vormiete,
    obergrenze: Math.max(grenze, vormiete),
    grund: vormiete > grenze ? 'höhere Vormiete bleibt zulässig' : `Mietspiegel + ${Math.round(cfg.aufschlag * 100)} %`,
  };
}

// Angesetzte Miete für eine geplante Vermietung (Mietniveau + Vermietungsweg).
// Unter der Mietpreisbremse ist „über Marktmiete" nicht mehr als die
// Obergrenze; der Möblierungsaufschlag kommt wie bisher obendrauf und trägt
// das regionale Rechtsrisiko (§25).
export function angesetzteMiete(state, objekt, niveauId, modellId = 'regulaer', { bremseIgnorieren = false } = {}) {
  const m = state.config.mieter;
  const niveau = m.mietNiveaus[niveauId];
  const bremse = bremseIgnorieren ? { gilt: false } : mietpreisbremse(state, objekt);
  const markt = bremse.gilt ? Math.min(marktmiete(state, objekt), bremse.obergrenze) : marktmiete(state, objekt);
  const basis = bremse.gilt ? Math.min(markt * niveau.faktor, bremse.obergrenze) : markt * niveau.faktor;
  return Math.round(basis * (1 + vermietungsmodell(state, modellId).aufschlag));
}

// Obergrenze einer Mieterhöhung im Bestand: ortsübliche Vergleichsmiete
// (§ 558 BGB). Neubauten haben im Modell keine eigene Mietspiegelstufe und
// orientieren sich an der Marktmiete.
export function erhoehungsObergrenze(state, objekt) {
  const basis = istNeubau(objekt) ? marktmiete(state, objekt) : mietspiegelMiete(state, objekt);
  return basis * (1 + vermietungsmodell(state, objekt.vermietungsart || objekt.moebliert).aufschlag);
}

function qualiWert(t) {
  return (t.zahlungsmoral + t.pflege + t.bleibe + (1 - t.konflikt)) / 4;
}

// --- Bewerbersuche ----------------------------------------------------------

// Startet eine Suche am gewählten Mietniveau (Objekt muss leer sein).
export function starteVermietung(state, objekt, niveauId, modellId = 'regulaer', { bremseIgnorieren = false } = {}) {
  const modell = vermietungsmodell(state, modellId);
  const ignoriert = !!bremseIgnorieren && mietpreisbremse(state, objekt).gilt;
  objekt.suche = {
    niveau: niveauId,
    modell: modell.id,
    moebliert: modell.id !== 'regulaer', // Rückwärtskompatibilität in Anzeigen/Tests
    bremseIgnoriert: ignoriert,
    miete: angesetzteMiete(state, objekt, niveauId, modell.id, { bremseIgnorieren: ignoriert }),
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
    // Dossier-Einkommen stehen wie die Mieten in Euro des Spielstarts.
    einkommensquote: t.nettoEinkommen ? suche.miete / aktuellerBetrag(state, t.nettoEinkommen) : null,
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
  // Verstoß gegen die Mietpreisbremse festhalten, bevor die neue Miete die
  // Vormiete überschreibt. Zulässig ist die Grenze inklusive Möblierungsaufschlag.
  const bremse = suche.bremseIgnoriert ? mietpreisbremse(state, objekt) : null;
  const zulaessig = bremse?.gilt ? Math.round(bremse.obergrenze * (1 + (modell.aufschlag || 0))) : null;
  objekt.bremseVerstoss = zulaessig !== null && suche.miete > zulaessig
    ? { beginn: state.monat, zulaessig, vereinbart: suche.miete, mietspiegel: Math.round(bremse.mietspiegel), geruegt: false }
    : null;
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

// Obergrenze: min(ortsübliche Vergleichsmiete inkl. möbliert, Kappungsbasis × (1+Kappung)).
export function maxMiete(state, objekt) {
  const m = state.config.mieter;
  const recht = mietrechtFuer(state, objekt);
  // Kappungsfenster ggf. zurücksetzen
  if (state.monat - objekt.kappungFensterStart >= recht.kappungMonate) {
    objekt.kappungFensterStart = state.monat;
    objekt.kappungBasis = objekt.kaltmiete;
  }
  const markt = erhoehungsObergrenze(state, objekt);
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
    const bremse = mietpreisbremse(state, { ...objekt, kaltmiete: 0 });
    const regulaer = bremse.gilt ? bremse.obergrenze : marktmiete(state, objekt);
    objekt.vermietungsart = 'regulaer';
    objekt.moebliert = false;
    objekt.kaltmiete = Math.min(objekt.kaltmiete, Math.round(regulaer));
    state.log.push({ monat: state.monat, text: `${objekt.titel}: Mietmodell wurde geprüft; ${rueckzahlung.toLocaleString('de-DE')} € Rückzahlung/Kosten und Umstellung auf reguläre Vermietung.` });
    meldeWartemoment(state, `${objekt.titel}: Prüfung des Mietmodells. Rückzahlung fällig; Vermietung läuft regulär weiter.`, objekt.listingId);
  }

  // Nur wer die Mietpreisbremse bewusst ignoriert, zieht diesen RNG-Wert.
  pruefeBremseVerstoss(state, objekt);

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

// --- Bewusster Verstoß gegen die Mietpreisbremse (ECONOMY_MODEL §15b) -------

// Monatliche Chancen, dass der Mieter rügt oder das Amt ein Bußgeld verhängt.
export function bremseVerstossRisiko(state, objekt) {
  const verstoss = objekt.bremseVerstoss;
  const cfg = state.config.mietpreisbremse?.verstoss;
  if (!verstoss || verstoss.geruegt || verstoss.beendet || !cfg || !objekt.mieter) return null;
  const stadt = state.config.segmente[objekt.segment]?.stadt;
  const ueberschuss = Math.max(0, objekt.kaltmiete / Math.max(1, verstoss.zulaessig) - 1);
  const monate = Math.max(0, state.monat - verstoss.beginn);
  const zeitFaktor = monate < 12 ? (cfg.fruehFaktor ?? 1)
    : monate >= cfg.rueckforderungMonate - 3 && monate <= cfg.rueckforderungMonate ? (cfg.fristFaktor ?? 1) : 1;
  const ruege = Math.min(1, (cfg.ruegeMonat?.[stadt] || 0)
    * (1 + (objekt.mieter.konflikt || 0) * cfg.konfliktHebel)
    * (1 + ueberschuss * cfg.ueberschussHebel)
    * zeitFaktor);
  const ueberVergleichsmiete = verstoss.mietspiegel > 0 ? objekt.kaltmiete / verstoss.mietspiegel - 1 : 0;
  const bussgeld = ueberVergleichsmiete > cfg.bussgeldSchwelle
    ? (cfg.bussgeldMonat?.[stadt] || 0) * (ueberVergleichsmiete > (cfg.wucherSchwelle ?? Infinity) ? (cfg.wucherFaktor ?? 1) : 1)
    : 0;
  const rueckforderbar = monate <= cfg.rueckforderungMonate ? (verstoss.mehrerloes || 0) : 0;
  const mehrMonat = Math.max(0, objekt.kaltmiete - verstoss.zulaessig);
  // Zulässige Miete und nichts mehr rückforderbar: Eine Rüge brächte dem
  // Mieter nichts, also auch kein Risiko mehr.
  const offen = mehrMonat > 0 || rueckforderbar > 0;
  return {
    ruege: offen ? ruege : 0, bussgeld, ueberschuss, monate, rueckforderbar, mehrMonat,
  };
}

// Legaler Ausstieg: Miete freiwillig auf die zulässige Höhe senken. Bereits
// zu viel gezahlte Miete bleibt bis zum Ende des 30-Monats-Fensters
// rückforderbar.
export function senkeAufZulaessigeMiete(state, objekt) {
  const verstoss = objekt.bremseVerstoss;
  if (!verstoss || verstoss.geruegt || verstoss.beendet || objekt.kaltmiete <= verstoss.zulaessig) return false;
  const alt = objekt.kaltmiete;
  objekt.kaltmiete = verstoss.zulaessig;
  objekt.kappungBasis = verstoss.zulaessig;
  objekt.kappungFensterStart = state.monat;
  state.log.push({
    monat: state.monat,
    ziel: objekt.listingId,
    text: `${objekt.titel}: Miete freiwillig auf die zulässige Höhe gesenkt (${Math.round(alt).toLocaleString('de-DE')} → ${verstoss.zulaessig.toLocaleString('de-DE')} €).`,
  });
  return true;
}

function pruefeBremseVerstoss(state, objekt) {
  const risiko = bremseVerstossRisiko(state, objekt);
  if (!risiko) return;
  const cfg = state.config.mietpreisbremse.verstoss;
  const verstoss = objekt.bremseVerstoss;
  // Mehrerlös dieses Monats aufsummieren (kein RNG).
  verstoss.mehrerloes = (verstoss.mehrerloes || 0) + risiko.mehrMonat;
  // Miete wieder zulässig und nichts mehr rückforderbar: Fall ist erledigt.
  if (risiko.mehrMonat <= 0 && (risiko.monate > cfg.rueckforderungMonate || verstoss.mehrerloes <= 0)) {
    verstoss.beendet = true;
    return;
  }
  const r = rngFloat(state);
  if (r >= risiko.ruege + risiko.bussgeld) return;

  const durchAmt = r >= risiko.ruege;
  const rueckforderbar = risiko.monate <= cfg.rueckforderungMonate ? verstoss.mehrerloes : 0;
  let kosten;
  let rueckzahlung;
  let text;
  if (durchAmt) {
    // § 5 WiStG: Bußgeld; in etwa jedem zweiten Fall zusätzlich Abschöpfung
    // des Mehrerlöses (§§ 8/9 WiStG). Dieselbe Zufallszahl entscheidet über
    // die Hälfte, damit kein weiterer RNG-Wert nötig ist.
    const mitAbschoepfung = r < risiko.ruege + risiko.bussgeld / 2;
    const bussgeld = aktuellerBetrag(state, cfg.bussgeld);
    rueckzahlung = mitAbschoepfung ? Math.round(verstoss.mehrerloes) : 0;
    kosten = Math.round(bussgeld) + rueckzahlung;
    text = `${objekt.titel}: Das Wohnungsamt ahndet eine Mietpreisüberhöhung. ` +
      `Bußgeld ${Math.round(bussgeld).toLocaleString('de-DE')} €` +
      (mitAbschoepfung ? ` und Rückzahlung des Mehrerlöses, zusammen ${kosten.toLocaleString('de-DE')} €` : '') +
      `; die Miete sinkt auf ${verstoss.zulaessig.toLocaleString('de-DE')} €.`;
  } else {
    // § 556g BGB: Rüge in den ersten 30 Monaten → Erstattung ab Mietbeginn,
    // sonst nur künftig; dazu vorgerichtliche Kosten des Mieters.
    const rechtskosten = aktuellerBetrag(state, cfg.rechtskosten || 0);
    rueckzahlung = Math.round(rueckforderbar);
    kosten = rueckzahlung + Math.round(rechtskosten);
    text = `${objekt.titel}: ${objekt.mieter.name} rügt die Miete (Mietpreisbremse). ` +
      (rueckforderbar > 0
        ? `Rückzahlung seit Mietbeginn ${Math.round(rueckforderbar).toLocaleString('de-DE')} € plus ${Math.round(rechtskosten).toLocaleString('de-DE')} € Anwaltskosten; `
        : `Keine Rückzahlung, weil die Rüge nach ${cfg.rueckforderungMonate} Monaten kam, aber ${Math.round(rechtskosten).toLocaleString('de-DE')} € Anwaltskosten; `) +
      `die Miete ${objekt.kaltmiete > verstoss.zulaessig ? 'sinkt auf' : 'bleibt bei'} ${verstoss.zulaessig.toLocaleString('de-DE')} €.`;
  }
  state.cash -= kosten;
  objekt.kaltmiete = verstoss.zulaessig;
  objekt.kappungBasis = verstoss.zulaessig;
  objekt.kappungFensterStart = state.monat;
  objekt.mieter.zufriedenheit -= cfg.zufriedenheitMalus;
  verstoss.geruegt = true;
  verstoss.geruegtMonat = state.monat;
  verstoss.kosten = kosten;
  verstoss.rueckzahlung = rueckzahlung;
  verstoss.durchAmt = durchAmt;
  state.statistik.bremseRuegen = (state.statistik.bremseRuegen || 0) + 1;
  state.log.push({ monat: state.monat, ziel: objekt.listingId, kategorie: 'Objekt', text });
  meldeWartemoment(state, text, objekt.listingId);
  protokolliereWirkung(state, {
    typ: 'mietpreisbremse-ruege',
    titel: durchAmt ? 'Bußgeld wegen Mietpreisüberhöhung' : 'Rüge der Mietpreisbremse',
    text,
    ziel: objekt.listingId,
    route: 'objekt',
  });
}

