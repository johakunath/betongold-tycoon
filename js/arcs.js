// arcs.js — terminierte, RNG-freie Folgekapitel zu echten Evententscheidungen.

import { getEvent } from './content.js?v=61';

export function planeObjektArc(state, objekt, plan) {
  if (!plan?.id || !plan.folgeEventId || !objekt) return null;
  const arc = {
    id: `${plan.id}:${objekt.listingId}:${state.monat}`,
    typ: plan.id,
    titel: plan.titel || 'Objektgeschichte',
    listingId: objekt.listingId,
    startMonat: state.monat,
    faelligMonat: state.monat + Math.max(1, Math.round(plan.nachMonaten || 1)),
    folgeEventId: plan.folgeEventId,
    entscheidung: plan.entscheidung || '',
    status: 'laufend',
  };
  state.objektArcs.push(arc);
  state.log.push({ monat: state.monat, text: `${objekt.titel}: „${arc.titel}“ läuft weiter; nächste Klärung in ${arc.faelligMonat - state.monat} Monaten.` });
  return arc;
}

export function schliesseAktivenArc(state, arcId) {
  const arc = state.objektArcs.find((eintrag) => eintrag.id === arcId);
  if (!arc) return null;
  arc.status = 'abgeschlossen';
  arc.abgeschlossenMonat = state.monat;
  return arc;
}

export function tickObjektArcs(state) {
  if (state.aktivesEvent) return null;
  const arc = state.objektArcs.find((eintrag) => eintrag.status === 'laufend' && eintrag.faelligMonat <= state.monat);
  if (!arc) return null;
  const index = state.portfolio.findIndex((objekt) => objekt.listingId === arc.listingId);
  if (index < 0) {
    arc.status = 'beendet';
    arc.abgeschlossenMonat = state.monat;
    state.log.push({ monat: state.monat, text: `Objektgeschichte „${arc.titel}“ endet, weil das Objekt nicht mehr im Bestand ist.` });
    return tickObjektArcs(state);
  }
  if (!getEvent(arc.folgeEventId)) {
    arc.status = 'fehler';
    state.log.push({ monat: state.monat, text: `Objektgeschichte „${arc.titel}“ konnte nicht fortgesetzt werden.` });
    return null;
  }
  arc.status = 'entscheidung';
  state.aktivesEvent = { eventId: arc.folgeEventId, objektIndex: index, monat: state.monat, arcId: arc.id };
  state.log.push({ monat: state.monat, text: `${state.portfolio[index].titel}: Folgeentscheidung „${arc.titel}“ ist fällig.` });
  return arc;
}

export function aktiveArcsFuerObjekt(state, objekt) {
  return state.objektArcs.filter((arc) => arc.listingId === objekt.listingId && ['laufend', 'entscheidung'].includes(arc.status));
}

export function objektArcsFuerObjekt(state, objekt) {
  return state.objektArcs.filter((arc) => arc.listingId === objekt.listingId);
}

