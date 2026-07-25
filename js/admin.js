// admin.js — whitelist-basierte Config-Bearbeitung für das Phase-5-Adminpanel.
// DOM-frei und headless testbar. Angezeigte Prozentwerte werden hier sicher in
// Dezimalwerte zurückgerechnet; unbekannte Pfade können nicht verändert werden.

import { DEFAULT_CONFIG } from './config.js?v=54';

export const ADMIN_GRUPPEN = {
  wirtschaft: {
    label: 'Wirtschaft',
    beschreibung: 'Ab dem nächsten Monat: Einkommen, laufender Haushalt, Sparen, Renditen und Marktannahmen.',
  },
  spiel: {
    label: 'Spielgefühl',
    beschreibung: 'Risiko, Zeitdruck, Events und operative Kosten.',
  },
  regeln: {
    label: 'Regeln',
    beschreibung: 'Ruhestand, variables Lebensende, Steuern, Verkauf und Eigenheim-Grenzen.',
  },
};

// min/max/step beziehen sich auf den im Panel angezeigten Wert. scale=100
// zeigt einen gespeicherten Dezimalwert als Prozentzahl an.
export const ADMIN_FELDER = [
  { gruppe: 'wirtschaft', pfad: 'haushalt.nettoEinkommenPerson1', label: 'Arbeitsnetto Person A', min: 0, max: 12000, step: 100, suffix: '€/Monat', hilfe: 'Laufendes Netto der ersten Person; beide Arbeitsnettos werden für den Haushalt addiert.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.nettoEinkommenPerson2', label: 'Arbeitsnetto Person B', min: 0, max: 12000, step: 100, suffix: '€/Monat', hilfe: 'Laufendes Netto der zweiten Person; 0 € ist für Einpersonen-Profile zulässig.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.miete', label: 'Familienmiete', min: 700, max: 3000, step: 10, suffix: '€/Monat', hilfe: 'Wohnkosten als Mieter; entfällt nach Einzug ins Eigenheim.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.mieteKalt', label: 'Davon Kaltmiete', min: 0, max: 2800, step: 10, suffix: '€/Monat', hilfe: 'Transparente Aufteilung der Familienmiete; darf nicht über der Warmmiete liegen.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.lebenshaltung', label: 'Lebenshaltung inkl. Reisen', min: 300, max: 8000, step: 10, suffix: '€/Monat', hilfe: 'Laufender Grundbedarf ohne Miete, direkte Kinderkosten und die separat geplante Auto-Pauschale.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.reisen', label: 'Davon Reisen', min: 0, max: 5000, step: 50, suffix: '€/Monat', hilfe: 'Monatlicher Durchschnitt innerhalb der Lebenshaltung; wird nicht doppelt abgezogen.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.autoAbMonat', label: 'Auto ab Spielmonat', min: 0, max: 240, step: 1, suffix: 'Monat', hilfe: 'Ab diesem zukünftigen Monat greift die Auto-Pauschale; 0 bedeutet sofort.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.autoKostenMonat', label: 'Auto-Pauschale', min: 0, max: 2000, step: 50, suffix: '€/Monat', hilfe: 'Editierbare All-in-Annahme für Anschaffung/Finanzierung und laufende Kosten; 0 € deaktiviert sie.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.kindergeldProKind', label: 'Kindergeld je Kind', min: 0, max: 1000, step: 10, suffix: '€/Monat', hilfe: 'Separate Einnahme pro Kind, nicht mit den Brutto-Kinderkosten verrechnet.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.kindergeldBisAlter', label: 'Kindergeld bis Alter', min: 0, max: 35, step: 1, suffix: 'Jahre', hilfe: 'Mit diesem Geburtstag endet die Einnahme monatsscharf.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.kinderKosten.0.kosten', label: 'Kinderkosten 0–5', min: 0, max: 2000, step: 50, suffix: '€/Kind/Monat', hilfe: 'Direkte Bruttokosten je Kind; Grundbedarf kann zusätzlich in der Lebenshaltung stecken.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.kinderKosten.1.kosten', label: 'Kinderkosten 6–11', min: 0, max: 2500, step: 50, suffix: '€/Kind/Monat', hilfe: 'Direkte Bruttokosten je Kind in der Grundschulphase.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.kinderKosten.2.kosten', label: 'Kinderkosten 12–17', min: 0, max: 3000, step: 50, suffix: '€/Kind/Monat', hilfe: 'Direkte Bruttokosten je Kind in der Teenagerphase.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.kinderKosten.3.kosten', label: 'Kinderkosten 18–26', min: 0, max: 3500, step: 50, suffix: '€/Kind/Monat', hilfe: 'Unterstützung während Ausbildung oder Studium.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.sparplanEtfAnteil', label: 'ETF-Sparplan', min: 0, max: 100, step: 5, scale: 100, suffix: '% der Sparrate', hilfe: 'Anteil der positiven Haushaltssparrate, der automatisch ins echte ETF-Depot fließt.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.einkommensWachstum', label: 'Einkommenswachstum', min: -5, max: 10, step: 0.25, scale: 100, suffix: '% p.a.', hilfe: 'Nominale jährliche Fortschreibung beider Arbeitsnettos.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.mietWachstum', label: 'Mietwachstum', min: -5, max: 10, step: 0.25, scale: 100, suffix: '% p.a.', hilfe: 'Nominale jährliche Fortschreibung der Familienmiete.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.kostenWachstum', label: 'Kostenwachstum', min: -5, max: 10, step: 0.25, scale: 100, suffix: '% p.a.', hilfe: 'Nominale jährliche Fortschreibung von Lebenshaltung, Auto und direkten Kinderkosten.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.einkommensAltersFaktoren.1.faktor', label: 'Arbeitsnetto ab 55', min: 50, max: 130, step: 5, scale: 100, suffix: '%', hilfe: 'Altersfaktor vor der Rente relativ zur fortgeschriebenen Erwerbsbasis; im Default 90 %.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.lebenshaltungAltersFaktoren.1.faktor', label: 'Lebenshaltung 55–64', min: 40, max: 130, step: 5, scale: 100, suffix: '%', hilfe: 'Altersfaktor für Lebenshaltung ohne Reisen, Auto und direkte Kinderkosten.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.lebenshaltungAltersFaktoren.2.faktor', label: 'Lebenshaltung 65–79', min: 40, max: 130, step: 5, scale: 100, suffix: '%', hilfe: 'Default 80 % der fortgeschriebenen Basis; Miete und Kinderkosten bleiben separat.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.lebenshaltungAltersFaktoren.3.faktor', label: 'Lebenshaltung ab 80', min: 30, max: 130, step: 5, scale: 100, suffix: '%', hilfe: 'Default 70 %; Gesundheit ist nicht separat prognostiziert, sondern Teil der Basis.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.reisenAltersFaktoren.1.faktor', label: 'Reisen 55–64', min: 0, max: 150, step: 5, scale: 100, suffix: '%', hilfe: 'Spätkarrierefaktor für den gemittelten Reiseblock.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.reisenAltersFaktoren.2.faktor', label: 'Reisen 65–79', min: 0, max: 150, step: 5, scale: 100, suffix: '%', hilfe: 'Ruhestandsfaktor für den gemittelten Reiseblock.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.reisenAltersFaktoren.3.faktor', label: 'Reisen ab 80', min: 0, max: 150, step: 5, scale: 100, suffix: '%', hilfe: 'Späte Altersphase des Reisebudgets; Default 55 %.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.autoAltersFaktoren.1.faktor', label: 'Auto 55–64', min: 0, max: 150, step: 5, scale: 100, suffix: '%', hilfe: 'Spätkarrierefaktor der All-in-Autopauschale.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.autoAltersFaktoren.2.faktor', label: 'Auto 65–79', min: 0, max: 150, step: 5, scale: 100, suffix: '%', hilfe: 'Altersfaktor der All-in-Autopauschale im Ruhestand.' },
  { gruppe: 'wirtschaft', pfad: 'haushalt.autoAltersFaktoren.3.faktor', label: 'Auto ab 80', min: 0, max: 150, step: 5, scale: 100, suffix: '%', hilfe: 'Späte Altersphase der Auto-Pauschale; 0 % würde das Auto ab dann vollständig entfernen.' },
  { gruppe: 'wirtschaft', pfad: 'kapital.etfRendite', label: 'ETF-Erwartungsrendite (brutto)', min: 2, max: 10, step: 0.25, scale: 100, suffix: '% p.a.', hilfe: 'Langfristige nominale Brutto-Drift des Vergleichsdepots vor Marktphase und persönlicher Kapitalsteuer.' },
  { gruppe: 'wirtschaft', pfad: 'kapital.tagesgeldZins', label: 'Tagesgeldzins', min: 0, max: 5, step: 0.25, scale: 100, suffix: '% p.a.', hilfe: 'Rendite auf positives, nicht investiertes Cash.' },
  { gruppe: 'wirtschaft', pfad: 'entwicklung.arbeitsmodelle.karriere.einkommenDeltaMonat', label: 'Karriereschritt Nettoeffekt', min: 0, max: 3000, step: 50, suffix: '€/Monat', hilfe: 'Zusätzliches Haushaltsnetto im gewählten Karrieremodell; endet im Ruhestand.' },
  { gruppe: 'wirtschaft', pfad: 'entwicklung.arbeitsmodelle.familienzeit.einkommenDeltaMonat', label: 'Familienzeit Nettoeffekt', min: -4000, max: 0, step: 50, suffix: '€/Monat', hilfe: 'Nettoverlust durch reduzierte Erwerbsarbeit im Familienzeit-Modell.' },
  { gruppe: 'wirtschaft', pfad: 'segmente.berlin-innenstadt.preisM2', label: 'Preis Berlin Innenstadt', min: 2500, max: 10000, step: 100, suffix: '€/m²', hilfe: 'Startwert des Segmentindex; bestehende Objektwerte reagieren ab dem nächsten Tick.' },
  { gruppe: 'wirtschaft', pfad: 'segmente.berlin-rand.preisM2', label: 'Preis Berlin Rand', min: 1800, max: 7000, step: 100, suffix: '€/m²', hilfe: 'Startwert für Berliner Randlagen.' },
  { gruppe: 'wirtschaft', pfad: 'segmente.leipzig.preisM2', label: 'Preis Leipzig', min: 1200, max: 5000, step: 100, suffix: '€/m²', hilfe: 'Startwert für das renditestärkere, volatilere Segment.' },
  { gruppe: 'wirtschaft', pfad: 'segmente.berlin-innenstadt.vergleichsmieteM2', label: 'Miete Berlin Innenstadt', min: 7, max: 25, step: 0.25, suffix: '€/m²', hilfe: 'Vergleichsmiete für Neuvermietung und Szenariorechnung.' },
  { gruppe: 'wirtschaft', pfad: 'segmente.berlin-rand.vergleichsmieteM2', label: 'Miete Berlin Rand', min: 6, max: 22, step: 0.25, suffix: '€/m²', hilfe: 'Vergleichsmiete für Neuvermietung und Szenariorechnung.' },
  { gruppe: 'wirtschaft', pfad: 'segmente.leipzig.vergleichsmieteM2', label: 'Miete Leipzig', min: 5, max: 18, step: 0.25, suffix: '€/m²', hilfe: 'Vergleichsmiete für Neuvermietung und Szenariorechnung.' },

  { gruppe: 'spiel', pfad: 'budget.zeitProMonat', label: 'Zeitbudget', min: 5, max: 50, step: 1, suffix: 'h/Monat', hilfe: 'Zeit für Selbstverwaltung und Renovierungen, bevor Familienstress entsteht.' },
  { gruppe: 'spiel', pfad: 'dueDiligence.gutachterKosten', label: 'Gutachter-Honorar', min: 300, max: 4000, step: 100, suffix: '€', hilfe: 'Einmalige Prüfungskosten. Der Gutachter reduziert Unsicherheit, garantiert aber nichts.' },
  { gruppe: 'spiel', pfad: 'dueDiligence.gutachterTrefferquote', label: 'Gutachter-Trefferquote', min: 40, max: 95, step: 1, scale: 100, suffix: '%', hilfe: 'Chance, einen tatsächlich vorhandenen versteckten Mangel zu erkennen.' },
  { gruppe: 'spiel', pfad: 'dueDiligence.ueberraschungsFaktor', label: 'Notreparatur-Faktor', min: 100, max: 180, step: 5, scale: 100, suffix: '%', hilfe: 'Kostenfaktor für nicht entdeckte Mängel durch Eilauftrag und Folgeschäden.' },
  { gruppe: 'spiel', pfad: 'events.eventChanceBasis', label: 'Eventchance ohne Objekt', min: 0.5, max: 12, step: 0.25, scale: 100, suffix: '%/Monat', hilfe: 'Grundrisiko für ein Dilemma pro Monat.' },
  { gruppe: 'spiel', pfad: 'events.eventChanceJeObjekt', label: 'Eventchance je Objekt', min: 0.5, max: 10, step: 0.25, scale: 100, suffix: '%/Monat', hilfe: 'Zusätzliche Ereignislast pro Mietobjekt.' },
  { gruppe: 'spiel', pfad: 'bewirtschaftung.instandhaltungM2Jahr', label: 'Instandhaltung', min: 5, max: 30, step: 1, suffix: '€/m²/Jahr', hilfe: 'Monatlicher Rücklagenbeitrag je Objekt.' },
  { gruppe: 'spiel', pfad: 'mieter.moebliertAufschlag', label: 'Möbliert-Aufschlag', min: 0, max: 25, step: 1, scale: 100, suffix: '%', hilfe: 'Mietaufschlag bei möblierter Vermietung.' },
  { gruppe: 'spiel', pfad: 'mieter.moebliertMoebelKosten', label: 'Möblierungskosten', min: 2000, max: 20000, step: 500, suffix: '€', hilfe: 'Einmalige Einrichtungskosten beim Wechsel auf möblierte Vermietung.' },
  { gruppe: 'spiel', pfad: 'familie.proZeitUeberzug', label: 'Zeitstress-Malus', min: 0.1, max: 2, step: 0.1, suffix: 'Punkte/h', hilfe: 'Monatlicher Familienmalus je Stunde über dem Zeitbudget.' },
  { gruppe: 'spiel', pfad: 'entwicklung.arbeitsmodelle.karriere.zeitBelastungMonat', label: 'Karriereschritt Zeitbelastung', min: 0, max: 20, step: 1, suffix: 'h/Monat', hilfe: 'Zusätzliche monatliche Belastung gegen das Immobilien-Zeitbudget.' },
  { gruppe: 'spiel', pfad: 'entwicklung.arbeitsmodelle.familienzeit.zeitPlusMonat', label: 'Familienzeit Freiraum', min: 0, max: 25, step: 1, suffix: 'h/Monat', hilfe: 'Zusätzliche verfügbare Zeit für Immobilienarbeit im Familienzeit-Modell.' },

  { gruppe: 'regeln', pfad: 'zeit.rentenAlter', label: 'Rentenalter', min: 55, max: 75, step: 1, suffix: 'Jahre', hilfe: 'Ab diesem Alter ersetzt das Renten-Netto das Erwerbsnetto. Die Partie läuft bis zum variablen Lebensende weiter.' },
  { gruppe: 'regeln', pfad: 'haushalt.rentenNettoFaktor', label: 'Renten-Netto', min: 30, max: 100, step: 5, scale: 100, suffix: '%', hilfe: 'Anteil des bis dahin nominal fortgeschriebenen Haushalts-Erwerbsnettos im Ruhestand.' },
  { gruppe: 'regeln', pfad: 'zeit.lebensendeMinAlter', label: 'Lebensende frühestens', min: 85, max: 99, step: 1, suffix: 'Jahre', hilfe: 'Untere Grenze des Lebensendes. Der tatsächliche Zeitpunkt wird je Seed bestimmt und kann durch Langzeitstress früher ausfallen.' },
  { gruppe: 'regeln', pfad: 'zeit.lebensendeMaxAlter', label: 'Lebensende spätestens', min: 90, max: 105, step: 1, suffix: 'Jahre', hilfe: 'Harte obere Grenze des Lebensendes. Im Standard endet die Partie spätestens mit 100.' },
  { gruppe: 'regeln', pfad: 'zeit.stressMalusMaxJahre', label: 'Stress-Einfluss', min: 0, max: 10, step: 1, suffix: 'Jahre', hilfe: 'Maximale Verkürzung durch langfristigen Zeitüberzug und Monate mit negativem Tagesgeld; nie unter die Untergrenze.' },
  { gruppe: 'regeln', pfad: 'eigenheim.minZimmer', label: 'Eigenheim Mindestzimmer', min: 2, max: 5, step: 1, suffix: 'Zimmer', hilfe: 'Kleinere Wohnungen gelten für die vierköpfige Familie nicht als tragfähiges Eigenheim.' },
  { gruppe: 'regeln', pfad: 'steuer.afaSatz', label: 'AfA-Satz', min: 0, max: 5, step: 0.25, scale: 100, suffix: '% p.a.', hilfe: 'Vereinfachte lineare Abschreibung des Gebäudeanteils.' },
  { gruppe: 'regeln', pfad: 'verkauf.dauerMonate', label: 'Verkaufsdauer', min: 1, max: 18, step: 1, suffix: 'Monate', hilfe: 'Zeit zwischen Verkaufsstart und Abschluss.' },
  { gruppe: 'regeln', pfad: 'verkauf.spekulationsfristMonate', label: 'Spekulationsfrist', min: 0, max: 180, step: 12, suffix: 'Monate', hilfe: 'Innerhalb dieser Haltedauer wird positiver Verkaufsgewinn vereinfacht besteuert.' },
  { gruppe: 'regeln', pfad: 'events.maxKinderEvents', label: 'Maximale Kinder-Events', min: 0, max: 6, step: 1, suffix: '', hilfe: 'Deckel für besondere Kinderereignisse pro Kampagne.' },
];

function holePfad(objekt, pfad) {
  return pfad.split('.').reduce((wert, teil) => wert?.[teil], objekt);
}

function setzePfad(objekt, pfad, wert) {
  const teile = pfad.split('.');
  const letzter = teile.pop();
  const ziel = teile.reduce((wert, teil) => wert[teil], objekt);
  ziel[letzter] = wert;
}

export function adminAnzeigeWert(config, feld) {
  const wert = holePfad(config, feld.pfad) * (feld.scale || 1);
  const nachkommastellen = String(feld.step).split('.')[1]?.length || 0;
  return Number(wert.toFixed(nachkommastellen));
}

export function standardAdminWerte() {
  return Object.fromEntries(
    ADMIN_FELDER.map((feld) => [feld.pfad, adminAnzeigeWert(DEFAULT_CONFIG, feld)])
  );
}

export function aktuelleAdminWerte(config) {
  return Object.fromEntries(
    ADMIN_FELDER.map((feld) => [feld.pfad, adminAnzeigeWert(config, feld)])
  );
}

export function wendeAdminWerteAn(state, anzeigeWerte) {
  const naechsteConfig = structuredClone(state.config);
  let geaendert = 0;
  for (const feld of ADMIN_FELDER) {
    if (!(feld.pfad in anzeigeWerte)) continue;
    const rohEingabe = anzeigeWerte[feld.pfad];
    if (typeof rohEingabe === 'string' && rohEingabe.trim() === '') {
      throw new Error(`Wert für ${feld.label} fehlt.`);
    }
    const eingabe = Number(rohEingabe);
    if (!Number.isFinite(eingabe)) throw new Error(`Ungültiger Wert für ${feld.label}.`);
    const geklemmt = Math.max(feld.min, Math.min(feld.max, eingabe));
    const roh = geklemmt / (feld.scale || 1);
    if (holePfad(naechsteConfig, feld.pfad) !== roh) {
      setzePfad(naechsteConfig, feld.pfad, roh);
      geaendert++;
    }
  }
  if (naechsteConfig.zeit.lebensendeMinAlter >= naechsteConfig.zeit.lebensendeMaxAlter) {
    throw new Error('„Lebensende frühestens“ muss vor „Lebensende spätestens“ liegen.');
  }
  if (naechsteConfig.zeit.rentenAlter >= naechsteConfig.zeit.lebensendeMinAlter) {
    throw new Error('Das Rentenalter muss vor dem frühesten Lebensende liegen.');
  }
  if (naechsteConfig.haushalt.mieteKalt > naechsteConfig.haushalt.miete) {
    throw new Error('Die Kaltmiete darf nicht über der Warmmiete liegen.');
  }
  if (naechsteConfig.haushalt.reisen > naechsteConfig.haushalt.lebenshaltung) {
    throw new Error('Das Reisebudget muss Teil der gesamten Lebenshaltung bleiben.');
  }
  naechsteConfig.haushalt.nettoEinkommen =
    naechsteConfig.haushalt.nettoEinkommenPerson1 + naechsteConfig.haushalt.nettoEinkommenPerson2;
  if (geaendert > 0) {
    for (const feld of ADMIN_FELDER) {
      setzePfad(state.config, feld.pfad, holePfad(naechsteConfig, feld.pfad));
    }
    state.config.haushalt.nettoEinkommen = naechsteConfig.haushalt.nettoEinkommen;
    state.config.meta.configVersion = (state.config.meta.configVersion || 1) + 1;
  }
  return geaendert;
}

// UI-Pfad: Änderungen werden gespeichert, aber erst am Anfang des nächsten
// Monats-Ticks wirksam. So bleiben aktuelle Vorschauen und Aktionen bis dahin
// konsistent. Die Engine ruft wendeAdminPendingAn genau einmal auf.
export function planeAdminWerte(state, anzeigeWerte) {
  const pruefState = { config: structuredClone(state.config) };
  wendeAdminWerteAn(pruefState, anzeigeWerte); // validiert, skaliert und klemmt
  const normalisiert = aktuelleAdminWerte(pruefState.config);
  const aktuell = aktuelleAdminWerte(state.config);
  const werte = Object.fromEntries(
    ADMIN_FELDER
      .filter((feld) => normalisiert[feld.pfad] !== aktuell[feld.pfad])
      .map((feld) => [feld.pfad, normalisiert[feld.pfad]])
  );
  const anzahl = Object.keys(werte).length;
  state.adminPending = anzahl > 0 ? { werte } : null;
  return anzahl;
}

export function wendeAdminPendingAn(state) {
  if (!state.adminPending?.werte) return 0;
  const pending = state.adminPending;
  state.adminPending = null;
  return wendeAdminWerteAn(state, pending.werte);
}

