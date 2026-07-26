// renovation.js — Renovierungsstufen: Optionen, Start, Abschluss (mit
// Kostenüberziehung). Formeln: ECONOMY_MODEL §17. DOM-frei, RNG über state.js.

import { rngFloat, zahleReparatur, entnimmRuecklage } from './state.js?v=58';
import { meldeWartemoment } from './signals.js?v=58';
import { fairerWert } from './market.js?v=58';
import { protokolliereWirkung } from './gameplay.js?v=58';

const ENERGIEKLASSEN = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function zielZustand(stufe, startZustand) {
  const z = stufe.zustandZiel === '+1' ? startZustand + 1 : stufe.zustandZiel;
  return Math.max(startZustand, Math.min(stufe.maxZustand, z));
}

// Erwartetes Überziehungsrisiko (Anteil der Schätzung) für die Anzeige.
function ueberziehungsRisiko(state, startZustand, eigenleistung = null) {
  const r = state.config.renovierung;
  return Math.max(0,
    (r.ueberziehungBasis + (5 - startZustand) * r.ueberziehungJeZustand) *
    (r.ueberziehungFaktor ?? 1) * (eigenleistung?.risikoFaktor || 1)
  );
}

function eigenleistungsPlan(state, basisSchaetzung, dauer, aktiv) {
  if (!aktiv) return null;
  const cfg = state.config.renovierung.eigenleistung;
  const handwerklich = !!state.startProfil?.beruf?.handwerklich;
  const rabatt = handwerklich ? cfg.rabattHandwerklich : cfg.rabatt;
  const ersparnis = Math.min(cfg.ersparnisMax, Math.round(basisSchaetzung * rabatt));
  const zeitProMonat = Math.min(cfg.zeitMonatMax, Math.max(1,
    Math.ceil(basisSchaetzung / 1000 * cfg.zeitJe1000Euro / dauer)
  ));
  return {
    ersparnis,
    zeitProMonat,
    risikoFaktor: handwerklich ? cfg.risikoFaktorHandwerklich : cfg.risikoFaktor,
    handwerklich,
  };
}

// Renovierungsoptionen für ein Objekt (mit Schätzung, Dauer, Ziel, Risiko).
// `moeglich=false`, wenn die Stufe keinen Zustandsgewinn brächte.
export function renovierungsOptionen(state, objekt, eigenleistungAktiv = false) {
  const r = state.config.renovierung;
  return Object.entries(r.stufen).map(([id, stufe]) => {
    const basisSchaetzung = Math.round(objekt.flaeche * stufe.kostenM2 * (r.kostenFaktor ?? 1));
    const dauer = Math.max(1, Math.ceil(stufe.dauer * (r.dauerFaktor ?? 1)));
    const eigenleistung = eigenleistungsPlan(state, basisSchaetzung, dauer, eigenleistungAktiv);
    const schaetzung = basisSchaetzung - (eigenleistung?.ersparnis || 0);
    const ziel = zielZustand(stufe, objekt.zustand);
    const nachher = {
      ...objekt,
      zustand: ziel,
      wertBonus: (objekt.wertBonus || 0) + (stufe.wertBonus || 0),
    };
    const wertHeute = fairerWert(state, objekt);
    const wertDanach = fairerWert(state, nachher);
    const mieteBasis = objekt.flaeche * state.config.segmente[objekt.segment].vergleichsmieteM2;
    const mieteHeute = mieteBasis * state.config.mieter.zustandMietFaktor[objekt.zustand];
    const mieteDanach = mieteBasis * state.config.mieter.zustandMietFaktor[ziel];
    return {
      id,
      label: stufe.label,
      schaetzung,
      dauer,
      zielZustand: ziel,
      energieBonus: stufe.energieBonus,
      risikoProzent: Math.round(ueberziehungsRisiko(state, objekt.zustand, eigenleistung) * 100),
      wertDelta: Math.round(wertDanach - wertHeute),
      mieteDelta: Math.round(mieteDanach - mieteHeute),
      moeglich: ziel > objekt.zustand || stufe.energieBonus > 0,
      eigenleistung,
    };
  });
}

// Startet eine Renovierung (nur bei leerem Objekt, keine laufende Reno).
// Die Schätzsumme wird sofort fällig (Rücklage zuerst), die Überziehung bei
// Abschluss.
export function starteRenovierung(state, objekt, stufeId, eigenleistungAktiv = false) {
  const r = state.config.renovierung;
  const stufe = r.stufen[stufeId];
  if (!stufe) throw new Error(`Unbekannte Renovierungsstufe: ${stufeId}`);
  if (objekt.vermietet) throw new Error('Renovierung nur bei leerem Objekt.');
  if (objekt.renovierung) throw new Error('Es läuft bereits eine Renovierung.');

  const option = renovierungsOptionen(state, objekt, eigenleistungAktiv).find((eintrag) => eintrag.id === stufeId);
  const schaetzung = option.schaetzung;
  const dauer = option.dauer;
  zahleReparatur(state, objekt, schaetzung);
  objekt.renovierung = {
    stufe: stufeId,
    startMonat: state.monat,
    endMonat: state.monat + dauer,
    schaetzung,
    startZustand: objekt.zustand,
    eigenleistung: option.eigenleistung,
  };
  state.log.push({
    monat: state.monat,
    text: `${objekt.titel}: Renovierung „${stufe.label}" gestartet ` +
      `(${schaetzung.toLocaleString('de-DE')} €, ${dauer} Monate Leerstand).`,
  });
  protokolliereWirkung(state, {
    typ: 'renovierung-gestartet',
    titel: 'Verbesserung gestartet',
    text: `${objekt.titel}: Zustand ${objekt.zustand}/5 → Ziel ${zielZustand(stufe, objekt.zustand)}/5; ${schaetzung.toLocaleString('de-DE')} € geplant, ${dauer} Monate` +
      (option.eigenleistung ? `, ${option.eigenleistung.zeitProMonat} h Eigenleistung/Monat und höheres Überziehungsrisiko.` : '.'),
    ziel: objekt.listingId,
    route: 'objekt',
  });
}

// Prüft/vollzieht den Abschluss (aus finance.tickObjekt). Gibt die aus Cash
// bezahlte Überziehung zurück (für die Cashflow-Anzeige) oder 0.
export function renovierungAbschluss(state, objekt) {
  const reno = objekt.renovierung;
  // tickObjekt läuft vor dem Monatszähler. `+1` sorgt dafür, dass eine
  // ausgewiesene Dauer von zwei Monaten nach exakt zwei Ticks endet.
  if (!reno || state.monat + 1 < reno.endMonat) return 0;

  const stufe = state.config.renovierung.stufen[reno.stufe];
  const zustandVorher = reno.startZustand;
  objekt.zustand = zielZustand(stufe, reno.startZustand);
  if (stufe.energieBonus > 0) {
    const i = ENERGIEKLASSEN.indexOf(objekt.energieklasse);
    if (i >= 0) objekt.energieklasse = ENERGIEKLASSEN[Math.max(0, i - stufe.energieBonus)];
  }
  if (stufe.wertBonus > 0) objekt.wertBonus = (objekt.wertBonus || 0) + stufe.wertBonus;

  const risiko = Math.max(0,
    (state.config.renovierung.ueberziehungBasis +
      (5 - reno.startZustand) * state.config.renovierung.ueberziehungJeZustand) *
    (state.config.renovierung.ueberziehungFaktor ?? 1) * (reno.eigenleistung?.risikoFaktor || 1)
  );
  const ueberziehung = Math.round(reno.schaetzung * risiko * rngFloat(state) * 2);
  // In-Tick: nur Rücklage mutieren, Cash-Anteil an den Cashflow zurückgeben.
  const ausCash = entnimmRuecklage(objekt, ueberziehung);

  objekt.renovierung = null;
  state.log.push({
    monat: state.monat,
    text: `${objekt.titel}: Renovierung fertig — Zustand ${objekt.zustand}/5` +
      (ueberziehung > 0 ? `, Überziehung ${ueberziehung.toLocaleString('de-DE')} €.` : ', im Budget.'),
  });
  meldeWartemoment(
    state,
    `${objekt.titel}: Renovierung abgeschlossen. Zeit pausiert — jetzt könnt ihr vermieten oder weiter planen.`,
    objekt.listingId
  );
  protokolliereWirkung(state, {
    typ: 'renovierung-fertig',
    titel: 'Verbesserung sichtbar',
    text: `${objekt.titel}: Zustand ${zustandVorher}/5 → ${objekt.zustand}/5; ` +
      (ueberziehung > 0 ? `${ueberziehung.toLocaleString('de-DE')} € über Plan.` : 'im geplanten Budget.'),
    ziel: objekt.listingId,
    route: 'objekt',
  });
  return ausCash;
}

