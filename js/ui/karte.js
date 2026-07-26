// karte.js — Stadt als atmosphärische Bühne mit echten Exposé-Kacheln.
// Die Stadtmotive bleiben scharf und normal belichtet; anklickbar sind nur
// Listing-Assets aus dem tatsächlichen Katalog.

import { alleListings } from '../content.js?v=59';
import { fairerWert } from '../market.js?v=59';
import { fmtEURKompakt } from './util.js?v=59';
import { liquiditaetsPufferMonate, naechsterZugEmpfehlung } from './kennzahlen.js?v=59';
import { meldungMeta } from './meldungen.js?v=59';

let ctx = null;
let filter = 'alle';
let stadt = 'berlin-innenstadt';
let naechsterAktion = () => {};

const STADT_SPEICHER = 'betongold-letzte-stadt';

const STAEDTE = {
  'berlin-innenstadt': {
    label: 'Berlin', sub: 'Innenstadt', klasse: 'stadt-berlin-innen',
    hintergrund: 'assets/ui/city-berlin-innenstadt-v1.webp',
  },
  'berlin-rand': {
    label: 'Berlin', sub: 'Außenstadt', klasse: 'stadt-berlin-aussen',
    hintergrund: 'assets/ui/city-berlin-aussenstadt-v1.webp',
  },
  leipzig: {
    label: 'Leipzig', sub: 'Stadt & Umland', klasse: 'stadt-leipzig',
    hintergrund: 'assets/ui/city-leipzig-v1.webp',
  },
  'meissen-umland': {
    label: 'Meißen', sub: '+ Umland', klasse: 'stadt-meissen',
    hintergrund: 'assets/ui/city-meissen-umland-v1.webp',
  },
};

const STATUS = {
  amMarkt: { label: 'zu verkaufen', klasse: 'markt', icon: 'scale' },
  reserviert: { label: 'Gebot angenommen', klasse: 'reserviert', icon: 'clock' },
  bestand: { label: 'im Bestand', klasse: 'bestand', icon: 'home' },
  eigenheim: { label: 'Eigenheim', klasse: 'eigenheim', icon: 'home' },
  pausiert: { label: 'pausiert', klasse: 'pausiert', icon: 'pause' },
  kommend: { label: 'noch nicht erschienen', klasse: 'pausiert', icon: 'pause' },
};

const icon = (name, klasse = 'ui-icon') =>
  `<svg class="${klasse}" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;

export function initKarte(context) {
  ctx = context;
  stadt = ladeLetzteStadt();
  setzeStadtkulisse(stadt, false);
  document.querySelectorAll('[data-kartenfilter]').forEach((button) => {
    button.addEventListener('click', () => {
      filter = button.dataset.kartenfilter;
      renderKarte(ctx.getState());
    });
  });
  document.getElementById('karten-staedte').addEventListener('click', (event) => {
    const button = event.target.closest('[data-stadt]');
    if (!button) return;
    setzeStadtkulisse(button.dataset.stadt);
    renderKarte(ctx.getState());
  });
  document.getElementById('karte-zum-markt').addEventListener('click', () => naechsterAktion());
  // Die Entzerrung rechnet in Pixeln der aktuellen Bühne. Ohne diesen Pass
  // überlappen die Marker nach jeder Größenänderung wieder, bis zufällig neu
  // gerendert wird. Neu rendern statt nachschieben, damit die Marker von den
  // rohen kartenposition-Werten ausgehen und nicht über mehrere Resizes
  // wegdriften. Reine Layoutkorrektur: kein State, kein RNG.
  let entzerrTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(entzerrTimer);
    entzerrTimer = setTimeout(() => {
      if (document.getElementById('screen-karte')?.hidden) return;
      renderKarte(ctx.getState());
    }, 120);
  });
}

export function renderKarte(state) {
  const eintraege = alleListings().map((listing) => statusFuer(state, listing));
  const imSegment = eintraege.filter((eintrag) => eintrag.listing.segment === stadt);
  const sichtbar = filter === 'alle'
    ? ergaenzeBuehne(imSegment)
    : imSegment.filter((eintrag) => passtFilter(state, eintrag));

  document.querySelectorAll('[data-kartenfilter]').forEach((button) => {
    const aktiv = button.dataset.kartenfilter === filter;
    button.classList.toggle('aktiv', aktiv);
    button.setAttribute('aria-pressed', String(aktiv));
  });
  // Die Stadtauswahl ist ein Filter wie die Statusleiste darüber — gleiche
  // aria-pressed-Semantik, keine unvollständigen Tab-Rollen.
  document.getElementById('karten-staedte').innerHTML = Object.entries(STAEDTE).map(([id, plan]) =>
    `<button type="button" data-stadt="${id}" class="${id === stadt ? 'aktiv' : ''}" aria-pressed="${id === stadt}">` +
    `<b>${plan.label}</b><small>${plan.sub}</small></button>`).join('');

  const plan = STAEDTE[stadt];
  setzeStadtkulisse(stadt, false);
  document.getElementById('karten-stadt-label').textContent = `${plan.label} · ${plan.sub}`;
  document.getElementById('stadtkarte').innerHTML =
    `<div class="stadt-buehne-bg" style="--stadtbild:url('${stadtbildUrl(plan)}')"></div>` +
    `<div class="stadt-wash ${plan.klasse}"></div>` +
    `<div class="stadt-markerfeld">${sichtbar.map((eintrag) => markerHTML(state, eintrag)).join('')}</div>`;
  requestAnimationFrame(() => entzerreMarker(document.querySelector('.stadt-markerfeld')));

  // Bühne und Liste sind nicht dieselbe Darstellung zweimal: Die Bühne zeigt
  // den Ort räumlich inklusive noch nicht erschienener Vorschauen, die Liste
  // ist der handlungsfähige Index — nur Orte, an denen jetzt etwas geht.
  const handelbar = sichtbar.filter((eintrag) => eintrag.status !== 'kommend');
  document.getElementById('karten-liste').innerHTML = handelbar.length
    ? handelbar.map((eintrag) => listenEintrag(eintrag)).join('')
    : `<p class="muted">In ${plan.label} ist gerade kein Ort offen. Die Bühne zeigt, was hier noch entstehen kann.</p>`;
  renderFamilie(state);
  renderPost(state);
  renderNaechstenZug(state, sichtbar);
  verdrahte(sichtbar);
}

function ladeLetzteStadt() {
  try {
    const gespeichert = localStorage.getItem(STADT_SPEICHER);
    if (gespeichert && STAEDTE[gespeichert]) return gespeichert;
  } catch {
    // Private/gesperrte Browserkontexte dürfen die UI nicht blockieren.
  }
  return 'berlin-innenstadt';
}

function stadtbildUrl(plan) {
  return new URL(plan.hintergrund, document.baseURI).href;
}

function setzeStadtkulisse(id, speichern = true) {
  if (!STAEDTE[id]) return;
  stadt = id;
  const plan = STAEDTE[id];
  document.body.dataset.stadt = plan.klasse;
  document.querySelector('.game-backdrop')?.style.setProperty(
    '--app-stadtbild',
    `url("${stadtbildUrl(plan)}")`,
  );
  if (!speichern) return;
  try {
    localStorage.setItem(STADT_SPEICHER, id);
  } catch {
    // Die aktuelle Sitzung funktioniert auch ohne verfügbaren UI-Speicher.
  }
}

function statusFuer(state, listing) {
  if (state.eigenheim?.listingId === listing.id) {
    return { listing, status: 'eigenheim', objektKennung: 'eigenheim', preis: fairerWert(state, state.eigenheim) };
  }
  const objekt = state.portfolio.find((eintrag) => eintrag.listingId === listing.id);
  if (objekt) return { listing, status: 'bestand', objektKennung: listing.id, preis: fairerWert(state, objekt) };
  const feed = state.markt.feed[listing.id];
  return {
    listing,
    status: feed?.status || 'kommend',
    objektKennung: null,
    preis: feed ? fairerWert(state, listing) * feed.aufschlag : null,
  };
}

function passtFilter(state, eintrag) {
  if (filter === 'markt') return eintrag.status === 'amMarkt' || eintrag.status === 'reserviert';
  if (filter === 'bestand') return eintrag.status === 'bestand' || eintrag.status === 'eigenheim';
  if (filter === 'favoriten') return state.favoriten.includes(eintrag.listing.id);
  return eintrag.status !== 'verkauft' && eintrag.status !== 'kommend';
}

function ergaenzeBuehne(eintraege) {
  const aktiv = eintraege.filter((eintrag) => eintrag.status !== 'verkauft' && eintrag.status !== 'kommend');
  const vorschau = eintraege
    .filter((eintrag) => eintrag.status === 'kommend')
    .slice(0, Math.max(0, 4 - aktiv.length));
  return [...aktiv, ...vorschau];
}

function markerPosition(listing) {
  const pos = listing.kartenposition || { x: 50, y: 50 };
  return {
    x: 10 + Math.max(0, Math.min(100, pos.x)) * .72,
    y: 11 + Math.max(0, Math.min(100, pos.y)) * .64,
  };
}

// Nahe beieinanderliegende kartenposition-Werte ergeben bei fester
// Kartenbreite (154/138/124px) leicht überlappende Marker. Statt die
// Rohposition zu verfälschen, schiebt dieser Pass nach dem Rendern nur
// tatsächlich kollidierende Kartenpaare entlang der günstigeren Achse
// auseinander — reine Layoutkorrektur, keine Zustands- oder RNG-Wirkung.
function entzerreMarker(feld) {
  const karten = [...feld.querySelectorAll('.karten-marker')];
  if (karten.length < 2) return;
  const feldRect = feld.getBoundingClientRect();
  if (!feldRect.width || !feldRect.height) return;
  const spalt = 10;
  const boxen = karten.map((el) => {
    const r = el.getBoundingClientRect();
    return {
      el, w: r.width, h: r.height,
      cx: r.left - feldRect.left + r.width / 2,
      cy: r.top - feldRect.top + r.height / 2,
    };
  });
  for (let iteration = 0; iteration < 24; iteration += 1) {
    let bewegt = false;
    for (let i = 0; i < boxen.length; i += 1) {
      for (let j = i + 1; j < boxen.length; j += 1) {
        const a = boxen[i];
        const b = boxen[j];
        const minDx = (a.w + b.w) / 2 + spalt;
        const minDy = (a.h + b.h) / 2 + spalt;
        const dx = b.cx - a.cx;
        const dy = b.cy - a.cy;
        const ueberlappX = minDx - Math.abs(dx);
        const ueberlappY = minDy - Math.abs(dy);
        if (ueberlappX > 0 && ueberlappY > 0) {
          bewegt = true;
          if (ueberlappX < ueberlappY) {
            const schub = ueberlappX / 2 + .5;
            const richtung = dx < 0 ? -1 : 1;
            a.cx -= schub * richtung;
            b.cx += schub * richtung;
          } else {
            const schub = ueberlappY / 2 + .5;
            const richtung = dy < 0 ? -1 : 1;
            a.cy -= schub * richtung;
            b.cy += schub * richtung;
          }
        }
      }
    }
    if (!bewegt) break;
  }
  boxen.forEach((box) => {
    const minX = box.w / 2 + 4;
    const maxX = Math.max(minX, feldRect.width - box.w / 2 - 4);
    const minY = box.h / 2 + 4;
    const maxY = Math.max(minY, feldRect.height - box.h / 2 - 4);
    const cx = Math.min(Math.max(box.cx, minX), maxX);
    const cy = Math.min(Math.max(box.cy, minY), maxY);
    box.el.style.left = `${(cx / feldRect.width * 100).toFixed(2)}%`;
    box.el.style.top = `${(cy / feldRect.height * 100).toFixed(2)}%`;
  });
}

function markerHTML(state, eintrag) {
  const { listing, status, preis } = eintrag;
  const meta = STATUS[status] || STATUS.pausiert;
  const { x, y } = markerPosition(listing);
  const favorit = state.favoriten.includes(listing.id) ? ' favorit' : '';
  const kommend = status === 'kommend' ? ' is-kommend' : '';
  const deaktiviert = status === 'kommend' ? ' disabled aria-disabled="true"' : '';
  return `<button type="button" class="karten-marker status-${meta.klasse}${favorit}${kommend}" data-karte-id="${listing.id}"${deaktiviert} ` +
    `style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%" aria-label="${listing.titel}: ${meta.label}">` +
    `<span class="marker-bild"><img src="assets/expose/${listing.id}.webp" alt="" loading="lazy">` +
    `<i class="marker-status">${icon(meta.icon)}</i></span>` +
    `<span class="marker-copy"><b>${listing.titel}</b><small>${meta.label}${preis ? ` · ${fmtEURKompakt(preis)}` : ''}</small></span>` +
    `<span class="marker-stiel" aria-hidden="true"></span></button>`;
}

function listenEintrag({ listing, status, preis }) {
  const meta = STATUS[status] || STATUS.pausiert;
  const kommend = status === 'kommend' ? ' is-kommend' : '';
  const deaktiviert = status === 'kommend' ? ' disabled aria-disabled="true"' : '';
  return `<button type="button" class="karten-listenpunkt status-${meta.klasse}${kommend}" data-karte-id="${listing.id}"${deaktiviert}>` +
    `<span class="listenbild"><img src="assets/expose/${listing.id}.webp" alt="" loading="lazy">` +
    `<i class="marker-symbol ${meta.klasse}" aria-hidden="true"></i></span><span><b>${listing.titel}</b>` +
    `<small>${meta.label}${preis ? ` · ${fmtEURKompakt(preis)}` : ''}</small></span></button>`;
}

function renderFamilie(state) {
  const familie = Math.max(0, Math.min(100, state.familienzufriedenheit));
  const frei = Math.max(0, state.zeitbudget.verfuegbar - state.zeitbudget.verbraucht);
  const zeit = state.zeitbudget.verfuegbar > 0 ? frei / state.zeitbudget.verfuegbar * 100 : 0;
  const ueberzug = Math.max(0, state.zeitbudget.verbraucht - state.zeitbudget.verfuegbar);
  const nerven = Math.max(0, Math.min(100, familie - ueberzug * 4 - (state.cash < 0 ? 25 : 0) + 12));
  const puffer = liquiditaetsPufferMonate(state);
  const werte = {
    familie: [familie, `${Math.round(familie)}`],
    zeit: [zeit, `${frei.toLocaleString('de-DE', { maximumFractionDigits: 1 })} h`],
    nerven: [nerven, `${Math.round(nerven)}`],
    puffer: [Math.min(100, puffer / 12 * 100), `${puffer.toLocaleString('de-DE', { maximumFractionDigits: 1 })} M.`],
  };
  for (const [id, [anteil, text]] of Object.entries(werte)) {
    const meter = document.getElementById(`stadt-${id}-meter`);
    meter.value = Math.round(anteil);
    // Der sichtbare Wert steht daneben; im Accessibility-Baum ersetzt er die
    // nackte Prozentzahl des Meters.
    meter.textContent = text;
    document.getElementById(`stadt-${id}-wert`).textContent = text;
  }
}

function renderPost(state) {
  const eintraege = (state.log || []).slice(-4).reverse();
  document.getElementById('stadt-post').innerHTML = eintraege.length
    ? eintraege.map((eintrag) => {
      const meta = meldungMeta(eintrag, state);
      return `<button type="button" class="meldung-${meta.klasse}${meta.aktion ? ' ist-aktion' : ''}" data-post-monat="${eintrag.monat}">` +
        `<span class="meldung-symbol" aria-hidden="true">${meta.symbol}</span><span>${eintrag.text}</span></button>`;
    }).join('')
    : `<p class="muted">Noch keine Post. Der erste Marktmonat bringt neue Situationen.</p>`;
  // Post-Einträge stammen aus dem Ereignislog; das vollständige Log wohnt im
  // Haushalt-Tab der Zentrale.
  document.querySelectorAll('[data-post-monat]').forEach((button) => {
    button.addEventListener('click', () => {
      ctx.zeigeScreen('dashboard');
      document.querySelector('[data-zentrale-tab="haushalt"]')?.click();
    });
  });
}

function renderNaechstenZug(state, sichtbar) {
  // Gemeinsame Empfehlungslogik mit der Zentrale; nur die Standardempfehlung
  // ist screen-spezifisch (die Stadt schickt zum Marktplatz, nie zu sich selbst).
  const markt = sichtbar.find((eintrag) => eintrag.status === 'amMarkt');
  const empfehlung = naechsterZugEmpfehlung(state, markt) || {
    titel: 'Markt und Puffer vergleichen',
    text: 'Im Marktplatz könnt ihr alle aktuellen Kandidaten filtern und nebeneinander prüfen.',
    button: 'Marktplatz öffnen',
    typ: 'marktplatz',
  };
  const aktionen = {
    finanzen: () => document.getElementById('nav-finanzen').click(),
    objekt: () => ctx.oeffneObjekt(empfehlung.ziel),
    expose: () => ctx.oeffneExpose(empfehlung.ziel),
    marktplatz: () => ctx.zeigeScreen('marktplatz'),
    portfolio: () => ctx.zeigePortfolio(),
    haushalt: () => {
      ctx.zeigeScreen('dashboard');
      document.querySelector('[data-zentrale-tab="haushalt"]')?.click();
    },
  };
  naechsterAktion = aktionen[empfehlung.typ];
  document.getElementById('stadt-naechster-phase').textContent = empfehlung.phase || 'Nächster kluger Zug';
  document.getElementById('stadt-naechster-titel').textContent = empfehlung.titel;
  document.getElementById('stadt-naechster-text').textContent = empfehlung.text;
  document.getElementById('karte-zum-markt').textContent = empfehlung.button;
}

function verdrahte(eintraege) {
  const nachId = new Map(eintraege.map((eintrag) => [eintrag.listing.id, eintrag]));
  document.querySelectorAll('[data-karte-id]').forEach((element) => {
    const id = element.dataset.karteId;
    const gekoppelt = () => document.querySelectorAll(`[data-karte-id="${id}"]`);
    for (const [ereignis, aktiv] of [['mouseenter', true], ['mouseleave', false], ['focus', true], ['blur', false]]) {
      element.addEventListener(ereignis, () => gekoppelt().forEach((ziel) => ziel.classList.toggle('is-focus', aktiv)));
    }
    element.addEventListener('click', () => oeffne(nachId.get(id)));
  });
}

function oeffne(eintrag) {
  if (!eintrag) return;
  if (eintrag.objektKennung) ctx.oeffneObjekt(eintrag.objektKennung);
  else ctx.oeffneExpose(eintrag.listing.id);
}

