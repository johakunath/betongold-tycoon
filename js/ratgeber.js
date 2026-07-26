// ratgeber.js — seltene, zustandsabhängige Lernhinweise für Leicht/Normal.
// DOM-frei: Das Modul entscheidet nur, ob ein neuer Hinweis fällig ist.

import { monatsWerte } from './engine.js?v=55';

const MINDESTABSTAND = 10;

export function pruefeRatgeber(state) {
  if (!state || state.schwierigkeit === 'schwer' || state.monat < 1) return null;
  state.ratgeber ||= { letzterMonat: -MINDESTABSTAND, gezeigt: [] };
  if (state.monat - state.ratgeber.letzterMonat < MINDESTABSTAND) return null;

  const werte = state.letzteHaushaltswerte || monatsWerte(state);
  const grundkosten = Math.max(1, werte.miete + werte.lebenshaltung + werte.kinder);
  const puffer = Math.max(0, state.cash) / grundkosten;
  const tipps = [
    {
      id: 'erster-blick',
      wenn: state.monat >= 2 && state.portfolio.length === 0,
      text: 'Prüft auf dem Marktplatz nicht nur die Rendite: Kaufpreis, Eigenkapital, Kreditrate und Rücklage entscheiden gemeinsam über den Cashflow.',
    },
    {
      id: 'liquiditaet',
      wenn: puffer < 3,
      text: `Euer Tagesgeld deckt nur etwa ${puffer.toLocaleString('de-DE', { maximumFractionDigits: 1 })} Monatsausgaben. Ein größerer Puffer macht Reparaturen und Leerstand leichter beherrschbar.`,
    },
    {
      id: 'negativer-objektflow',
      wenn: state.portfolio.length > 0 && (state.letzterImmoCashflow || 0) < 0,
      text: 'Negativer Objekt-Cashflow ist kein Bedienfehler: Hohe Finanzierung und regulierte Mieten können ihn realistisch machen. Prüft mehr Eigenkapital, günstigere Käufe, Renovierung oder den Vermietungsweg.',
    },
    {
      id: 'hoher-ltv',
      wenn: state.portfolio.some((o) => o.darlehen?.restschuld / Math.max(1, o.kaufpreis || 1) > .9),
      text: 'Eine Finanzierungsquote über 90 % lässt wenig Sicherheitspuffer. Tilgung stärkt langsam das Eigenkapital; zusätzliche Käufe erhöhen vorher das Zins- und Liquiditätsrisiko.',
    },
    {
      id: 'leerstand',
      wenn: state.portfolio.some((o) => !o.vermietet && !o.renovierung),
      text: 'Ein leeres Objekt trägt Rate und Kosten ohne Miete. Öffnet es in der Zentrale und startet Vermietung oder eine geplante Renovierung.',
    },
    {
      id: 'sparplan-puffer',
      wenn: puffer < 6 && (state.config.haushalt.sparplanEtfAnteil || 0) >= .5,
      text: 'Der ETF-Sparplan ist flexibel. Bei knappem Tagesgeld kann ein geringerer Anteil vorübergehend Liquidität aufbauen, ohne vorhandene ETF-Anteile zu verkaufen.',
    },
  ];
  const tipp = tipps.find((eintrag) => eintrag.wenn && !state.ratgeber.gezeigt.includes(eintrag.id));
  if (!tipp) return null;
  state.ratgeber.gezeigt.push(tipp.id);
  state.ratgeber.letzterMonat = state.monat;
  return { titel: 'Tipp von Mara', text: tipp.text };
}

