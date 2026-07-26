// bewerber.js — Screen 6: Bewerbermappe. Mietniveau + möbliert wählen,
// Dossierkarten sichten, einziehen lassen oder weitersuchen (kostet einen
// Leerstandsmonat). Dossiers sind Hinweise, kein Score (PLAN §5.6).

import { getTenant } from '../content.js?v=58';
import {
  angesetzteMiete, marktmiete, starteVermietung, waehleBewerber,
  vermietungsmodell,
} from '../tenants.js?v=58';
import { fmtEUR } from './util.js?v=58';
import { fixkostenMonat, instandhaltungMonat } from '../immobilie.js?v=58';

let ctx = null;
let index = -1;

export function initBewerber(context) {
  ctx = context;
}

export function oeffneBewerber(objektIndex) {
  index = objektIndex;
  ctx.setSpeed(0);
  render();
  const d = document.getElementById('dlg-bewerber');
  if (!d.open) d.showModal();
}

function objekt() {
  return ctx.getState().portfolio[index];
}

function render() {
  const state = ctx.getState();
  const o = objekt();
  document.getElementById('bewerber-titel').textContent = `Vermieten: ${o.titel}`;

  if (!o.suche) {
    renderNiveauWahl(state, o);
  } else {
    renderBewerberListe(state, o);
  }
}

// Schritt 1: Mietniveau + Vermietungsweg
function renderNiveauWahl(state, o) {
  const m = state.config.mieter;
  const markt = Math.round(marktmiete(state, o));
  const optionen = Object.entries(m.mietNiveaus)
    .map(([id, n], i) => {
      const miete = angesetzteMiete(state, o, id, 'regulaer');
      return (
        `<label class="niveau-option"><input type="radio" name="niveau" value="${id}" ${i === 1 ? 'checked' : ''}>` +
        `<span><b>${n.label}</b><small><strong data-niveau-miete="${id}">${fmtEUR(miete)}</strong> kalt · ${erwartung(n)}</small></span></label>`
      );
    })
    .join('');
  const stadt = state.config.segmente[o.segment]?.stadt || 'leipzig';
  const modelle = Object.entries(m.vermietungsmodelle).map(([id, modell], i) => {
    const risiko = modell.rechtsrisiko?.[stadt] || 0;
    const risikoText = risiko === 0 ? 'kein zusätzliches Modellrisiko' : risiko >= .01 ? 'hohes Prüf-/Rückzahlungsrisiko' : risiko >= .002 ? 'erhöhtes Prüf-/Rückzahlungsrisiko' : 'geringes Prüf-/Rückzahlungsrisiko';
    return `<label class="modell-option"><input type="radio" name="modell" value="${id}" ${i === 0 ? 'checked' : ''}>` +
      `<span><b>${modell.label}</b><small>${modell.kurz}</small><small>${modell.aufschlag ? `+${Math.round(modell.aufschlag * 100)} % Mietansatz · ` : ''}${modell.moebelKosten ? `${fmtEUR(modell.moebelKosten)} Einrichtung · ` : ''}${risikoText}</small></span></label>`;
  }).join('');

  document.getElementById('bewerber-inhalt').innerHTML =
    `<p class="muted">Reguläre Vergleichsmiete für diesen Zustand: <b>${fmtEUR(markt)}</b> kalt. ` +
    `Mietniveau steuert Nachfrage; der Vermietungsweg verändert Ertrag, Aufwand, Wechsel und Rechtsrisiko.</p>` +
    `<h3 class="dialog-zwischentitel">1. Vermietungsweg</h3><div class="modell-optionen">${modelle}</div>` +
    `<p class="mietmodell-recht"><b>${state.config.mietrecht?.[stadt]?.label || 'Standard-Mietrecht'}:</b> ` +
    `${stadt === 'berlin' ? 'Möblierung und Befristung sind kein automatischer Ausweg aus dem Mietrecht; Prüfungen können teuer werden.' : stadt === 'leipzig' ? 'Reguliert, aber im Spiel weniger restriktiv als Berlin.' : 'Geringerer Nachfragedruck und weniger Restriktion, dafür schwächere Mietaufschläge und Nachfrage.'}</p>` +
    `<h3 class="dialog-zwischentitel">2. Mietniveau</h3>` +
    `<div class="niveau-optionen">${optionen}</div>` +
    `<div class="dialog-fuss"><button id="btn-suche-start" class="primaer">Bewerber suchen</button></div>`;

  const aktualisiereMieten = () => {
    const modellId = document.querySelector('input[name="modell"]:checked').value;
    document.querySelectorAll('[data-niveau-miete]').forEach((ziel) => {
      ziel.textContent = fmtEUR(angesetzteMiete(state, o, ziel.dataset.niveauMiete, modellId));
    });
  };
  document.querySelectorAll('input[name="modell"]').forEach((input) => input.addEventListener('change', aktualisiereMieten));

  document.getElementById('btn-suche-start').addEventListener('click', () => {
    const niveau = document.querySelector('input[name="niveau"]:checked').value;
    const modell = document.querySelector('input[name="modell"]:checked').value;
    starteVermietung(state, o, niveau, modell);
    ctx.autosave();
    render();
  });
}

function erwartung(n) {
  if (n.faktor < 1) return 'große Auswahl';
  if (n.faktor > 1) return 'wenige Bewerber, Leerstandsrisiko';
  return 'solide Auswahl';
}

// Schritt 2: Bewerberkarten
function renderBewerberListe(state, o) {
  const suche = o.suche;
  const karten = suche.bewerber.map((b) => bewerberKarte(state, b)).join('');
  const leerstand = leerstandsKosten(state, o);
  document.getElementById('bewerber-inhalt').innerHTML =
    `<div class="bewerber-suche-kopf"><div><span class="eyebrow">Aktuelle Suche</span>` +
    `<p>Angesetzte Miete: <b>${fmtEUR(suche.miete)}</b> kalt` +
    ` · ${vermietungsmodell(state, suche.modell || suche.moebliert).label} (${state.config.mieter.mietNiveaus[suche.niveau].label}).</p></div>` +
    `<span class="badge">${suche.bewerber.length} passende Dossiers</span></div>` +
    (suche.bewerber.length
      ? `<div class="bewerber-liste">${karten}</div>`
      : `<p class="leer-hinweis muted">Diesen Monat hat sich niemand Passendes gemeldet. Die Suche läuft im Hintergrund weiter.</p>`) +
    `<aside class="leerstand-kosten" aria-label="Kosten eines weiteren Leerstandsmonats">` +
    `<div><span class="eyebrow">Wenn ihr weitersucht</span><b>Ein weiterer Leerstandsmonat</b></div>` +
    `<dl><div><dt>Entgangene Kaltmiete</dt><dd>${fmtEUR(leerstand.entgangeneMiete)}</dd></div>` +
    `<div><dt>Rate, Hausgeld und Rücklage</dt><dd>${fmtEUR(leerstand.laufendeZahlungen)}</dd></div></dl>` +
    `<p>Im nächsten Monat fehlen damit rund <b>${fmtEUR(leerstand.liquiditaetsDruck)}</b> Liquidität. ` +
    `Ungeplante Reparaturen sind darin nicht enthalten.</p></aside>` +
    `<div class="dialog-fuss">` +
    `<button id="btn-weiter-suchen">Im Hintergrund weitersuchen</button>` +
    `<button id="btn-niveau-aendern">Mietniveau ändern</button>` +
    `</div>`;

  document.querySelectorAll('[data-einziehen]').forEach((btn) =>
    btn.addEventListener('click', () => {
      waehleBewerber(state, o, btn.dataset.einziehen);
      ctx.autosave();
      document.getElementById('dlg-bewerber').close();
      ctx.render();
      ctx.toast('Neuer Mieter eingezogen.');
    }));

  document.getElementById('btn-weiter-suchen').addEventListener('click', () => {
    ctx.autosave();
    document.getElementById('dlg-bewerber').close();
    ctx.toast('Die Mietersuche läuft weiter; neue Dossiers erscheinen in den Benachrichtigungen.');
  });

  document.getElementById('btn-niveau-aendern').addEventListener('click', () => {
    o.suche = null;
    render();
  });
}

// Sichtbare Entscheidungshilfe, keine versteckte Qualitätswertung: Die Zahlen
// entsprechen genau dem nächsten Leerstands-Tick des Objekts.
export function leerstandsKosten(state, o) {
  const entgangeneMiete = Math.round(o.suche?.miete || marktmiete(state, o));
  const rate = o.darlehen?.restschuld > 0 ? o.darlehen.rate : 0;
  const ruecklage = instandhaltungMonat(state, o);
  const laufendeZahlungen = Math.round(rate + fixkostenMonat(state, o) + ruecklage);
  return {
    entgangeneMiete,
    laufendeZahlungen,
    liquiditaetsDruck: entgangeneMiete + laufendeZahlungen,
  };
}

function bewerberKarte(state, b) {
  const t = getTenant(b.id);
  const quote = b.einkommensquote;
  const quoteKl = quote == null ? '' : quote > 0.4 ? 'schlecht' : quote > 0.33 ? 'ok' : 'gut';
  const quoteText = quote == null ? '—' : `${Math.round(quote * 100)} % vom Netto`;
  const einkommenHinweis = quote == null
    ? 'Einkommen nicht beziffert'
    : quote > 0.4
      ? 'Einkommen stark beansprucht'
      : quote > 0.33 ? 'Einkommen knapp tragfähig' : 'Einkommen mit Puffer';
  const fakt = (symbol, label, wert, klasse = '') =>
    `<div><dt><svg class="steckbrief-icon" aria-hidden="true"><use href="#icon-${symbol}"></use></svg>${label}</dt><dd class="${klasse}">${wert}</dd></div>`;
  return (
    `<article class="bewerber-karte">` +
    `<header class="bewerber-kopf"><div class="bewerber-avatar"><img src="assets/avatar/${t.id}.webp" alt="" onerror="this.replaceWith(document.createTextNode('👤'))"></div>` +
    `<div class="bewerber-name"><b>${t.name}</b><span>${t.archetyp}</span></div></header>` +
    `<dl class="bewerber-fakten">` +
    fakt('family', 'Haushalt', t.haushalt) +
    fakt('landmark', 'Beruf', t.beruf) +
    fakt('wallet', 'Einkommensquote', quoteText, `quote-${quoteKl}`) +
    fakt('home', 'Haustiere', t.haustiere) +
    fakt('heart', 'Bleibeabsicht', t.bleibeAbsicht) +
    fakt('shield', 'Referenzen', t.referenzen) +
    `</dl>` +
    `<div class="bewerber-hinweise" aria-label="Hinweise aus den sichtbaren Angaben">` +
    `<span class="hinweis-chip quote-${quoteKl}">${einkommenHinweis}</span>` +
    `<span class="hinweis-chip">Bleibeabsicht selbst einschätzen</span></div>` +
    `<blockquote class="bewerber-note">„${t.note}"</blockquote>` +
    `<button class="primaer" data-einziehen="${t.id}">Einziehen</button>` +
    `</article>`
  );
}

