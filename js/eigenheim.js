// eigenheim.js — Kauf eines bezugsfreien Marktobjekts zur Eigennutzung.
// Die laufenden Kosten nutzt engine.tick über finance.tickObjekt; das Modul
// kapselt den Nutzungswechsel und die Familienwirkung. DOM-frei.

import { kaufeObjekt } from './finance.js?v=56';
import { eigenheimEignung, fixkostenMonat, instandhaltungMonat } from './immobilie.js?v=56';
import { getListing } from './content.js?v=56';

export function wohnortWechselVorschau(state, listing) {
  const ziel = listing.segment;
  const quelle = state.wohnort || state.startProfil.wohnort;
  const faktoren = state.config.haushalt.regionalEinkommen || {};
  const start = faktoren[state.startProfil.wohnort] || 1;
  const zielFaktor = (faktoren[ziel] || 1) / start;
  const aktuellFaktor = state.einkommensRegionalfaktor || 1;
  const basisNetto = (state.config.haushalt.nettoEinkommenPerson1 || 0) + (state.config.haushalt.nettoEinkommenPerson2 || 0);
  return {
    quelle,
    ziel,
    wechsel: quelle !== ziel,
    aktuell: Math.round(basisNetto * aktuellFaktor),
    danach: Math.round(basisNetto * zielFaktor),
    differenz: Math.round(basisNetto * (zielFaktor - aktuellFaktor)),
    faktor: zielFaktor,
    zielLabel: state.config.segmente[ziel]?.label || ziel,
  };
}

function vollzieheWohnortwechsel(state, listing) {
  const wechsel = wohnortWechselVorschau(state, listing);
  state.wohnort = wechsel.ziel;
  if (wechsel.wechsel) {
    state.ausstehenderEinkommensRegionalfaktor = wechsel.faktor;
    state.log.push({ monat: state.monat, text: `Umzug nach ${wechsel.zielLabel}: Ab dem nächsten Haushaltsmonat ändert sich das regionale Haushaltsnetto um ${wechsel.differenz >= 0 ? '+' : ''}${wechsel.differenz.toLocaleString('de-DE')} €/Monat.` });
  }
  return wechsel;
}

export function kaufeEigenheim(state, angebot) {
  if (state.eigenheim) throw new Error('Ihr besitzt bereits ein Eigenheim.');
  const eignung = eigenheimEignung(state, angebot.listing);
  if (!eignung.geeignet) throw new Error(`Nicht als Familienheim geeignet: ${eignung.gruende.join(', ')}.`);

  const objekt = kaufeObjekt(state, angebot);
  state.portfolio.pop();
  objekt.nutzung = 'eigenheim';
  objekt.vermietet = false;
  objekt.mieter = null;
  objekt.kaltmiete = 0;
  objekt.suche = null;
  objekt.hausverwaltung = false;
  state.eigenheim = objekt;
  vollzieheWohnortwechsel(state, angebot.listing);
  state.familienzufriedenheit = Math.min(
    100,
    state.familienzufriedenheit + state.config.eigenheim.familieSofortBonus
  );
  state.log.push({
    monat: state.monat,
    text: `Eigenheim bezogen: ${objekt.titel}. Die bisherige Wohnmiete entfällt.`,
  });
  return objekt;
}

export function eigenheimMonatskosten(state) {
  const o = state.eigenheim;
  if (!o) return 0;
  const ruecklage = instandhaltungMonat(state, o);
  const rate = o.darlehen.restschuld > 0 ? o.darlehen.rate : 0;
  return fixkostenMonat(state, o) + ruecklage + rate;
}

export function bezieheBestandsobjekt(state, objekt) {
  if (state.eigenheim) throw new Error('Ihr besitzt bereits ein Eigenheim.');
  if (objekt.vermietet || objekt.eigenbedarfFreigabe !== 'selbst') {
    throw new Error('Das Objekt ist noch nicht für euren eigenen Einzug frei.');
  }
  const listing = getListing(objekt.listingId);
  const eignung = eigenheimEignung(state, { ...listing, mietstatus: { ...listing.mietstatus, vermietet: false } });
  if (!eignung.geeignet) throw new Error(`Nicht als Familienheim geeignet: ${eignung.gruende.join(', ')}.`);
  const index = state.portfolio.indexOf(objekt);
  if (index < 0) throw new Error('Objekt gehört nicht zum Mietportfolio.');
  state.portfolio.splice(index, 1);
  objekt.nutzung = 'eigenheim';
  objekt.eigenbedarfFreigabe = null;
  objekt.familienNutzung = null;
  objekt.hausverwaltung = false;
  state.eigenheim = objekt;
  vollzieheWohnortwechsel(state, listing);
  state.familienzufriedenheit = Math.min(100, state.familienzufriedenheit + state.config.eigenheim.familieSofortBonus);
  state.log.push({ monat: state.monat, text: `Eigenheim bezogen: ${objekt.titel}. Die bisherige Wohnmiete entfällt.` });
  return objekt;
}

