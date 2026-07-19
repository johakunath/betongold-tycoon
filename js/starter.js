// starter.js — idempotente Initialisierung besonderer Startbestände.
// Läuft nach market.initialisiereMarkt(), damit Listingdaten, Mängel und
// Feedstatus existieren. DOM-frei und vollständig im Save abbildbar.

import { getListing } from './content.js?v=36';
import { fairerWert } from './market.js?v=36';
import { kaufeObjekt, nebenkostenFuer } from './finance.js?v=36';
import { aktienDepotWert } from './aktien.js?v=36';

export function initialisiereStartbestand(state) {
  if (state.startbestandInitialisiert) return { angewendet: false, anzahl: 0 };
  const plan = state.startProfil?.startbestand || [];
  if (!plan.length) {
    state.startbestandInitialisiert = true;
    return { angewendet: false, anzahl: 0 };
  }

  let anzahl = 0;
  for (const eintrag of plan) {
    if (state.portfolio.some((objekt) => objekt.listingId === eintrag.listingId)) continue;
    const listing = getListing(eintrag.listingId);
    if (!listing) throw new Error(`Startbestand verweist auf unbekanntes Listing: ${eintrag.listingId}`);

    const kaufpreis = Math.round(fairerWert(state, listing));
    const ltv = Math.max(0, Math.min(1, Number(eintrag.ltv) || 0));
    const darlehen = Math.round(kaufpreis * ltv);
    const zins = Number(eintrag.zins) || state.basiszins;
    const tilgungssatz = Number(eintrag.tilgungssatz) || 0.01;
    const rate = (darlehen * (zins + tilgungssatz)) / 12;
    const zinsbindungRestJahre = Math.max(1, Math.round(eintrag.zinsbindungRestJahre || 5));

    state.markt.feed[listing.id] = {
      status: 'reserviert',
      reserviertPreis: kaufpreis,
      erschienen: state.monat,
      endet: state.monat,
      aufschlag: 1,
      konkurrenz: 0,
      runden: 0,
      letztesGebotMonat: -1,
    };

    const objekt = kaufeObjekt(state, {
      listing,
      kaufpreis,
      eigenkapital: 0,
      nebenkosten: nebenkostenFuer(state, listing, kaufpreis),
      nutzung: 'kapitalanlage',
      darlehen,
      ltv,
      zins,
      rate,
      tilgungssatz,
      zinsbindungJahre: zinsbindungRestJahre,
      restschuldNachBindung: null,
      zusage: true,
      gruende: [],
    });
    objekt.gekauftMonat = -60;
    objekt.kappungFensterStart = -36;
    objekt.darlehen.zinsbindungBis = state.monat + zinsbindungRestJahre * 12;
    objekt.ruecklage = Math.max(0, Number(eintrag.ruecklage) || 0);
    objekt.hausverwaltung = !!eintrag.hausverwaltung;
    const log = state.log.at(-1);
    if (log) {
      log.text = `Startbestand: ${listing.titel}, ${Math.round(ltv * 100)} % LTV, ` +
        `${Math.round(darlehen).toLocaleString('de-DE')} € Restschuld.`;
    }
    anzahl++;
  }

  state.startbestandInitialisiert = true;
  const netto = aktuellesNettovermoegen(state);
  state.etfVergleich.wert = Math.max(0, netto);
  if (state.historie?.[0]?.monat === 0) {
    Object.assign(state.historie[0], {
      cash: state.cash,
      etfDepot: state.etfDepot?.wert || 0,
      aktienDepot: aktienDepotWert(state),
      nettovermoegen: netto,
      etf: state.etfVergleich.wert,
    });
  }

  const restschuld = state.portfolio.reduce((summe, objekt) => summe + objekt.darlehen.restschuld, 0);
  state.log.push({
    monat: state.monat,
    text: `Sonderstart: ${anzahl} Mietobjekte mit ${Math.round(restschuld).toLocaleString('de-DE')} € Restschuld übernommen.`,
  });
  return { angewendet: true, anzahl, restschuld, nettovermoegen: netto };
}

function aktuellesNettovermoegen(state) {
  const immobilien = state.portfolio.reduce((summe, objekt) =>
    summe + fairerWert(state, objekt) - objekt.darlehen.restschuld + (objekt.ruecklage || 0), 0);
  return state.cash + (state.etfDepot?.wert || 0) + aktienDepotWert(state) + immobilien;
}
