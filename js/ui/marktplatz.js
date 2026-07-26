// marktplatz.js — Screen 2: Exposé-Feed mit Filtern, Favoriten, Vergleich.

import { sichtbareListings, vergleichsmiete, fairerWert } from '../market.js?v=59';
import { getListing } from '../content.js?v=59';
import { bildHTML, cutawayHTML } from '../iso.js?v=59';
import { fmtEUR, fmtEURSigniert, fmtProzent } from './util.js?v=59';
import { eigenheimEignung, fixkostenAufschluesselung, instandhaltungMonat, objektartConfig } from '../immobilie.js?v=59';
import { dealEntscheidung, pruefstand } from '../gameplay.js?v=59';

let ctx = null;
let filter = { segment: 'alle', mietstatus: 'alle', nurFavoriten: false, sortierung: 'neu' };
const vergleich = new Set(); // Listing-IDs für Side-by-Side
let letzterRenderMonat = -1;
const icon = (name) => `<svg class="ui-icon" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
const AUSSTATTUNG = { unmoebliert: 'unmöbliert', teilmoebliert: 'teilmöbliert', bewohnt: 'bewohnt' };

export function initMarktplatz(context) {
  ctx = context;
  const form = document.getElementById('markt-filter');
  form.addEventListener('input', () => {
    filter = {
      segment: form.elements.segment.value,
      mietstatus: form.elements.mietstatus.value,
      nurFavoriten: form.elements.nurFavoriten.checked,
      sortierung: form.elements.sortierung.value,
    };
    letzterRenderMonat = -1;
    renderMarktplatz(ctx.getState());
  });
  document.getElementById('btn-vergleich').addEventListener('click', zeigeVergleich);
}

export function renderMarktplatz(state, erzwungen = false) {
  // Bei laufender Zeit nur neu bauen, wenn sich der Monat geändert hat
  if (!erzwungen && state.monat === letzterRenderMonat) return;
  letzterRenderMonat = state.monat;

  let eintraege = sichtbareListings(state);
  if (filter.segment !== 'alle') eintraege = eintraege.filter((e) => e.listing.segment === filter.segment);
  if (filter.mietstatus === 'vermietet') eintraege = eintraege.filter((e) => e.listing.mietstatus.vermietet);
  if (filter.mietstatus === 'frei') eintraege = eintraege.filter((e) => !e.listing.mietstatus.vermietet);
  if (filter.nurFavoriten) eintraege = eintraege.filter((e) => state.favoriten.includes(e.listing.id));

  const rendite = (e) =>
    e.listing.mietstatus.vermietet ? (e.listing.mietstatus.kaltmiete * 12) / e.preis : 0;
  const sortierer = {
    neu: (a, b) => a.monateAmMarkt - b.monateAmMarkt,
    preisAuf: (a, b) => a.preis - b.preis,
    preisAb: (a, b) => b.preis - a.preis,
    rendite: (a, b) => rendite(b) - rendite(a),
  };
  eintraege.sort(sortierer[filter.sortierung] || sortierer.neu);

  const ziel = document.getElementById('markt-liste');
  if (eintraege.length === 0) {
    ziel.innerHTML =
      '<p class="muted leer-hinweis">Gerade nichts am Markt, das zu den Filtern passt — ' +
      'der Feed füllt sich alle paar Monate.</p>';
  } else {
    ziel.innerHTML = eintraege.map((e) => karte(state, e)).join('');
    wireKarten(ziel, state);
  }
  document.getElementById('btn-vergleich').disabled = vergleich.size < 2;
}

function karte(state, { listing: l, eintrag, preis, monateAmMarkt }) {
  const seg = state.config.segmente[l.segment];
  const fav = state.favoriten.includes(l.id);
  const interessenten = Math.round(eintrag.konkurrenz * 5);
  const bruttorendite = l.mietstatus.vermietet ? ((l.mietstatus.kaltmiete * 12) / preis) * 100 : null;
  const reserviert = eintrag.status === 'reserviert';
  const eignung = eigenheimEignung(state, l);
  const entscheidung = dealEntscheidung(state, l.id);
  const stand = pruefstand(state, l.id);

  return (
    `<article class="markt-karte ${reserviert ? 'reserviert' : ''}" data-id="${l.id}">` +
    `<div class="markt-gallery"><div class="markt-ansicht">${bildHTML(l)}<span>Außen</span></div>` +
    `<div class="markt-ansicht">${cutawayHTML(l, l.zustand)}<span>Innen</span></div></div>` +
    `<div class="karte-inhalt">` +
    `<div class="karte-kopfzeile">` +
    `<h3><button type="button" class="karte-titel" aria-label="Exposé öffnen: ${l.titel}, ${fmtEUR(Math.round(preis))}">${l.titel}</button></h3>` +
    `<button type="button" class="fav ${fav ? 'aktiv' : ''}" data-fav="${l.id}" ` +
    `aria-label="${fav ? 'Aus Favoriten entfernen' : 'Als Favorit speichern'}: ${l.titel}" ` +
    `aria-pressed="${fav}">★</button>` +
    `</div>` +
    `<div class="karte-ort muted">${icon('map')}<span>${seg.label} · ${l.adresse} · Lage ${l.lageScore}/10</span></div>` +
    `<div class="karte-fakten"><span>${icon('ruler')}${l.flaeche} m²</span><span>${icon('door')}${l.zimmer} Zi.</span><span>${icon('hammer')}Bj. ${l.baujahr}</span><span>${icon('trending')}Kl. ${l.energieklasse}</span></div>` +
    `<div class="karte-badges">` +
    (l.mietstatus.vermietet
      ? `<span class="badge gruen">vermietet · ${fmtProzent(bruttorendite)} brutto</span>`
      : `<span class="badge">bezugsfrei</span>`) +
    (l.ausstattung ? `<span class="badge">${AUSSTATTUNG[l.ausstattung] || l.ausstattung}</span>` : '') +
    (monateAmMarkt === 0 ? '<span class="badge neu">NEU</span>' : `<span class="badge">seit ${monateAmMarkt} Mon.</span>`) +
    (interessenten > 0 ? `<span class="badge orange">${interessenten} Interessent${interessenten > 1 ? 'en' : ''}</span>` : '') +
    (reserviert ? '<span class="badge blau">Gebot angenommen</span>' : '') +
    (entscheidung?.typ === 'beobachtet' ? '<span class="badge blau">bewusst beobachten</span>' : '') +
    (entscheidung?.typ === 'verworfen' ? '<span class="badge">bewusst verworfen</span>' : '') +
    (stand.schritte ? `<span class="badge">Prüfung ${stand.schritte}/3</span>` : '') +
    (eignung.geeignet ? `<span class="badge familie">Familienheim ${eignung.score}/5</span>` : '') +
    `<span class="badge mietrecht">${state.config.mietrecht?.[seg.stadt]?.kurz || 'Standard-Mietrecht'}</span>` +
    `</div>` +
    `<blockquote class="markt-zitat">„${l.maklerText}“</blockquote>` +
    `</div><div class="markt-deal"><div class="karte-preis">${fmtEUR(Math.round(preis))}` +
    // Kompaktformat rundet auf volle Tausender und machte aus 1.450 €/m²
    // ein nichtssagendes „1 Tsd €/m²". Der Quadratmeterpreis wird wie im
    // Exposé voll ausgeschrieben.
    `<small>${bruttorendite === null ? `${Math.round(preis / l.flaeche).toLocaleString('de-DE')} €/m²` : `${fmtProzent(bruttorendite)} brutto`}</small></div>` +
    `<div class="markt-aktionen"><button type="button" class="primaer" data-markt-aktion="${entscheidung?.typ === 'verworfen' ? 'neu' : 'gebot'}" data-id="${l.id}">${entscheidung?.typ === 'verworfen' ? 'Entscheidung ansehen' : stand.schritte ? 'Prüfung fortsetzen' : 'Prüfen & entscheiden'}</button></div>` +
    `<label class="vergleich-check"><input type="checkbox" data-vergleich="${l.id}" ` +
    `${vergleich.has(l.id) ? 'checked' : ''}> vergleichen</label></div></article>`
  );
}

function wireKarten(ziel, state) {
  // Der Titel-Button ist der Tastaturweg ins Exposé; sein Klick läuft per
  // Bubbling über denselben Kartenhandler. Der Kartenklick bleibt
  // Zeigegeräte-Komfort und ignoriert eigenständige Aktionen.
  ziel.querySelectorAll('.markt-karte').forEach((k) => {
    k.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-fav],[data-vergleich],[data-markt-aktion],.vergleich-check,.bild-zoom')) return;
      ctx.oeffneExpose(k.dataset.id);
    });
  });
  ziel.querySelectorAll('[data-markt-aktion]').forEach((button) => {
    button.addEventListener('click', () => {
      ctx.oeffneExpose(button.dataset.id);
      if (button.dataset.marktAktion === 'gebot') {
        requestAnimationFrame(() => document.getElementById('gebot-input')?.focus());
      }
    });
  });
  ziel.querySelectorAll('[data-fav]').forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.fav;
      const i = state.favoriten.indexOf(id);
      if (i >= 0) state.favoriten.splice(i, 1);
      else state.favoriten.push(id);
      ctx.autosave();
      renderMarktplatz(state, true);
    }));
  ziel.querySelectorAll('[data-vergleich]').forEach((c) =>
    c.addEventListener('change', () => {
      if (c.checked) {
        if (vergleich.size >= 3) {
          c.checked = false;
          ctx.toast('Maximal drei Objekte vergleichen.');
          return;
        }
        vergleich.add(c.dataset.vergleich);
      } else {
        vergleich.delete(c.dataset.vergleich);
      }
      document.getElementById('btn-vergleich').disabled = vergleich.size < 2;
    }));
}

// --- Vergleichs-Dialog --------------------------------------------------------

function zeigeVergleich() {
  const state = ctx.getState();
  const ids = [...vergleich].filter((id) => state.markt.feed[id]?.status === 'amMarkt' || state.markt.feed[id]?.status === 'reserviert');
  if (ids.length < 2) return;
  const spalten = ids.map((id) => {
    const l = getListing(id);
    const e = state.markt.feed[id];
    const preis = Math.round(e.aufschlag * fairerWert(state, l));
    return { l, e, preis };
  });

  const zeile = (name, wert) =>
    `<tr><th scope="row">${name}</th>${spalten.map((s) => `<td>${wert(s)}</td>`).join('')}</tr>`;
  const vergleichsZeile = (name, wert, format, deltaFormat, niedrigerIstBesser = false) => {
    const basis = wert(spalten[0]);
    return `<tr class="vergleich-zahlenzeile"><th scope="row">${name}</th>${spalten.map((s, index) => {
      const aktuell = wert(s);
      if (index === 0 || !Number.isFinite(aktuell) || !Number.isFinite(basis)) {
        return `<td><b>${format(aktuell)}</b></td>`;
      }
      const delta = aktuell - basis;
      const richtung = Math.abs(delta) < .0001 ? 'gleich' : ((delta < 0) === niedrigerIstBesser ? 'besser' : 'schlechter');
      return `<td class="vergleich-${richtung}"><b>${format(aktuell)}</b><small class="vergleich-delta">${deltaFormat(delta)}</small></td>`;
    }).join('')}</tr>`;
  };
  const zahl = (wert, stellen = 0) => Number(wert).toLocaleString('de-DE', { minimumFractionDigits: stellen, maximumFractionDigits: stellen });

  document.getElementById('vergleich-inhalt').innerHTML =
    `<table class="vergleich-tabelle"><colgroup><col class="vergleich-merkmal">${spalten.map(() => '<col class="vergleich-objekt">').join('')}</colgroup><tr><td></td>${spalten
      .map((s) => `<th>${s.l.titel}</th>`)
      .join('')}</tr>` +
    vergleichsZeile('Preis', (s) => s.preis, fmtEUR, fmtEURSigniert, true) +
    vergleichsZeile('€/m²', (s) => s.preis / s.l.flaeche, (v) => `${zahl(Math.round(v))} €`, (d) => `${d >= 0 ? '+' : '−'}${zahl(Math.abs(Math.round(d)))} €`, true) +
    zeile('Fläche / Zimmer', (s) => `${s.l.flaeche} m² / ${s.l.zimmer}`) +
    zeile('Objekt / Eigentum', (s) => `${objektartConfig(state, s.l).label} / ${s.l.eigentumsform === 'weg' ? 'WEG' : 'Alleineigentum'}`) +
    zeile('Grundstück / Außenraum', (s) => s.l.objektart === 'haus' ? `${s.l.grundstueck} / ${s.l.aussenflaeche} m²` : `— / ${s.l.aussenflaeche || 0} m²`) +
    vergleichsZeile('Baujahr', (s) => s.l.baujahr, (v) => String(v), (d) => `${d >= 0 ? '+' : '−'}${zahl(Math.abs(d))} J.`) +
    zeile('Energieklasse', (s) => s.l.energieklasse) +
    vergleichsZeile('Laufende Fixkosten', (s) => fixkostenAufschluesselung(s.l).reduce((summe, k) => summe + k.betrag, 0), (v) => `${fmtEUR(v)}/Mon.`, (d) => `${fmtEURSigniert(Math.round(d))}/Mon.`, true) +
    vergleichsZeile('Instandhaltungs-Planwert', (s) => instandhaltungMonat(state, s.l), (v) => `${fmtEUR(Math.round(v))}/Mon.`, (d) => `${fmtEURSigniert(Math.round(d))}/Mon.`, true) +
    vergleichsZeile('Familien-Eignung', (s) => s.l.familienScore || 0, (v) => `${v}/5`, (d) => `${d >= 0 ? '+' : '−'}${zahl(Math.abs(d))}`) +
    zeile('Ausstattung', (s) => AUSSTATTUNG[s.l.ausstattung] || (s.l.mietstatus.vermietet ? 'bewohnt' : 'nicht angegeben')) +
    zeile('Kaltmiete', (s) => (s.l.mietstatus.vermietet ? fmtEUR(s.l.mietstatus.kaltmiete) + '/Mon.' : 'bezugsfrei')) +
    vergleichsZeile('Bruttorendite', (s) => s.l.mietstatus.vermietet ? (s.l.mietstatus.kaltmiete * 12) / s.preis * 100 : NaN, (v) => Number.isFinite(v) ? `${zahl(v, 1)} %` : '—', (d) => `${d >= 0 ? '+' : '−'}${zahl(Math.abs(d), 2)} Pp.`) +
    vergleichsZeile('Vergleichsmiete (Schätzung)', (s) => vergleichsmiete(state, s.l), (v) => `${fmtEUR(Math.round(v))}/Mon.`, (d) => `${fmtEURSigniert(Math.round(d))}/Mon.`) +
    vergleichsZeile('Lage', (s) => s.l.lageScore, (v) => `${v}/10`, (d) => `${d >= 0 ? '+' : '−'}${zahl(Math.abs(d))}`) +
    vergleichsZeile('Interessenten', (s) => Math.round(s.e.konkurrenz * 5), (v) => String(v), (d) => `${d >= 0 ? '+' : '−'}${zahl(Math.abs(d))}`) +
    `</table>`;
  document.getElementById('dlg-vergleich').showModal();
}

