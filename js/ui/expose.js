// expose.js — Screen 3: Exposé-Detail mit Due Diligence, Notizen,
// Szenariorechner, Gebot / Weggehen.

import { getListing } from '../content.js?v=59';
import {
  angebotsPreis, vergleichsmiete, gebotAbgeben, kaufAbbrechen,
  besichtigen, dokumenteAnfordern, gutachterBeauftragen,
  angebotBeobachten, angebotVerwerfen, angebotNeuPruefen,
} from '../market.js?v=59';
import { dealEntscheidung, pruefstand } from '../gameplay.js?v=59';
import { bildHTML, cutawayHTML } from '../iso.js?v=59';
import { fmtEUR, fmtProzent } from './util.js?v=59';
import { oeffneFinanzierung } from './finanzierung.js?v=59';
import { eigenheimEignung, fixkostenAufschluesselung, instandhaltungMonat, objektartConfig } from '../immobilie.js?v=59';

let ctx = null;
let aktuelleId = null;
let letzterStatus = null;

const ZUSTAND_TEXT = {
  1: 'sanierungsbedürftig', 2: 'stark renovierungsbedürftig', 3: 'gepflegt',
  4: 'gut', 5: 'neuwertig',
};
const AUSSTATTUNG = { unmoebliert: 'unmöbliert', teilmoebliert: 'teilmöbliert', bewohnt: 'bewohnt' };

export function initExpose(context) {
  ctx = context;
  document.getElementById('btn-expose-zurueck').addEventListener('click', () =>
    ctx.zeigeScreen('marktplatz'));
}

export function oeffneExpose(id) {
  aktuelleId = id;
  ctx.zeigeScreen('expose');
  renderExpose(ctx.getState(), true);
}

export function aktuellesExpose() {
  return aktuelleId;
}

// Voll-Render bei Aktionen; bei laufender Zeit nur Live-Werte aktualisieren,
// damit Gebots-Eingabe und Notizen nicht zurückgesetzt werden.
export function renderExpose(state, voll = false) {
  if (!aktuelleId) return;
  const eintrag = state.markt.feed[aktuelleId];
  if (!voll) {
    if ((eintrag?.status || null) !== letzterStatus) {
      renderExpose(state, true);
      return;
    }
    updateLive(state, eintrag);
    return;
  }

  const l = getListing(aktuelleId);
  const seg = state.config.segmente[l.segment];
  const dd = state.dd[aktuelleId] || {};
  const stand = pruefstand(state, aktuelleId);
  const entscheidung = dealEntscheidung(state, aktuelleId);
  const preis = eintrag ? Math.round(angebotsPreis(state, aktuelleId)) : null;
  const amMarkt = eintrag && eintrag.status === 'amMarkt';
  const reserviert = eintrag && eintrag.status === 'reserviert';
  letzterStatus = eintrag?.status || null;
  const vm = Math.round(vergleichsmiete(state, l));
  const interessenten = eintrag ? Math.round(eintrag.konkurrenz * 5) : 0;
  const eignung = eigenheimEignung(state, l);
  const kosten = fixkostenAufschluesselung(l);

  document.getElementById('expose-titel').textContent = l.titel;

  // Reihenfolge folgt der Handlungskette: Anlass (Bild/Kernfakten) → Prüfung
  // (Due Diligence) → Entscheidung (Szenario/Gebot/Weggehen). Die ausführliche
  // Faktensammlung liegt aufklappbar unter den Kernfakten, damit Prüfen und
  // Entscheiden nicht unter den Fold rutschen.
  document.getElementById('expose-inhalt').innerHTML =
    handlungsketteHTML(state, l, stand, entscheidung) +
    `<div class="expose-oben">` +
    `<div class="expose-gallery">${bildHTML(l, 'gross')}${cutawayHTML(l, l.zustand, 'gross')}</div>` +
    `<div class="expose-preisbox karte">` +
    `<div class="preis-gross" data-live="preis">${preis ? fmtEUR(preis) : '—'}</div>` +
    `<div class="muted" data-live="preism2">${preis ? Math.round(preis / l.flaeche).toLocaleString('de-DE') + ' €/m²' : ''}</div>` +
    `<table class="fakten">` +
    `<tr><td>Segment</td><td>${seg.label} · Lage ${l.lageScore}/10</td></tr>` +
    `<tr><td>Fläche / Zimmer</td><td>${l.flaeche} m² / ${l.zimmer}</td></tr>` +
    `<tr><td>Baujahr</td><td>${l.baujahr}</td></tr>` +
    `<tr><td>Zustand (Eindruck)</td><td>${ZUSTAND_TEXT[l.zustand]}</td></tr>` +
    `<tr><td>Mietstatus</td><td>${mietstatusText(l)}</td></tr>` +
    `<tr><td>Vergleichsmiete (Schätzung)</td><td>${fmtEUR(vm)}/Monat</td></tr>` +
    (l.mietstatus.vermietet && preis
      ? `<tr><td>Bruttorendite</td><td data-live="rendite">${fmtProzent(((l.mietstatus.kaltmiete * 12) / preis) * 100)}</td></tr>`
      : '') +
    `<tr><td>Markt</td><td data-live="markt">${marktText(state, eintrag, interessenten)}</td></tr>` +
    `</table>` +
    `<details class="objekt-daten"><summary>Alle Objektdaten</summary>` +
    `<table class="fakten">` +
    `<tr><td>Objekt / Eigentum</td><td>${objektartConfig(state, l).label} · ${l.eigentumsform === 'weg' ? 'WEG-Miteigentum' : 'Alleineigentum'}</td></tr>` +
    `<tr><td>Mietrecht</td><td>${state.config.mietrecht?.[seg.stadt]?.label || 'Standardregeln'}</td></tr>` +
    `<tr><td>Etage</td><td>${l.etage}</td></tr>` +
    `<tr><td>Energieklasse</td><td>${l.energieklasse}</td></tr>` +
    kosten.map((k) => `<tr><td>${k.label}</td><td>${fmtEUR(k.betrag)}/Monat</td></tr>`).join('') +
    `<tr><td>Instandhaltung (Planwert)</td><td>${fmtEUR(Math.round(instandhaltungMonat(state, l)))}/Monat</td></tr>` +
    (l.objektart === 'haus' ? `<tr><td>Grundstück / Außenraum</td><td>${l.grundstueck} m² / ${l.aussenflaeche} m² nutzbar</td></tr>` : `<tr><td>Außenraum</td><td>${l.aussenflaeche || 0} m²</td></tr>`) +
    `<tr><td>Familienheim</td><td>${eignung.geeignet ? `geeignet · ${eignung.score}/5` : `${eignung.score}/5 · ${eignung.gruende.join(', ')}`}${l.barrierearm ? ' · barrierearm' : ''}</td></tr>` +
    `<tr><td>Ausstattung</td><td>${AUSSTATTUNG[l.ausstattung] || (l.mietstatus.vermietet ? 'bewohnt' : 'nicht näher angegeben')}</td></tr>` +
    `</table></details>` +
    `</div></div>` +

    `<blockquote class="maklertext">„${l.maklerText}"<footer>— Maklerexposé</footer></blockquote>` +

    `<div class="expose-unten">` +
    ddHTML(state, l, dd) +
    `<div class="karte notizen-karte"><h3>Eure Notizen</h3>` +
    `<textarea id="expose-notizen" rows="5" aria-label="Notizen zu diesem Exposé" placeholder="z. B. maximal 190.000 bieten; nach der WEG-Rücklage fragen">${state.notizen[aktuelleId] || ''}</textarea>` +
    `</div></div>` +

    `<section class="expose-entscheidung karte" aria-label="Entscheidung zu diesem Angebot">` +
    `<div class="expose-aktionen">` +
      `<button id="btn-szenario">Finanzierung prüfen</button>` +
    (reserviert
      ? `<button id="btn-finanzieren" class="primaer">Finanzierung anfragen</button>` +
        `<button id="btn-kauf-abbrechen" class="gefahr">Doch nicht kaufen</button>`
      : '') +
    `</div>` +
    (amMarkt && entscheidung?.typ !== 'verworfen' ? gebotHTML(state, preis) : '') +
    (amMarkt || reserviert ? entscheidungsHTML(entscheidung, reserviert) : '') +
    `</section>`;

  wireAktionen(state, l, eintrag);
}

function handlungsketteHTML(state, listing, stand, entscheidung) {
  const wirkung = (state.entscheidungsHistorie || []).findLast((e) => e.ziel === listing.id);
  const eigeneWirkung = wirkung ? wirkung.text : 'Noch keine Wirkung festgehalten.';
  const entschieden = entscheidung || state.markt.feed[listing.id]?.status === 'reserviert';
  return `<section class="handlungskette" aria-label="Handlungskette für dieses Angebot">` +
    `<ol>` +
      `<li class="erledigt"><span>1</span><b>Anlass</b><small>reales Angebot</small></li>` +
      `<li class="${stand.schritte ? 'aktiv' : ''}"><span>2</span><b>Prüfung</b><small>${stand.schritte}/3 Schritte</small></li>` +
      `<li class="${entschieden ? 'aktiv' : ''}"><span>3</span><b>Entscheidung</b><small>${entscheidung?.typ === 'verworfen' ? 'weggegangen' : entscheidung?.typ === 'beobachtet' ? 'beobachten' : state.markt.feed[listing.id]?.status === 'reserviert' ? 'Gebot angenommen' : 'noch offen'}</small></li>` +
      `<li class="${wirkung ? 'aktiv' : ''}"><span>4</span><b>Wirkung</b><small>${eigeneWirkung}</small></li>` +
    `</ol></section>`;
}

function entscheidungsHTML(entscheidung, reserviert) {
  if (entscheidung?.typ === 'verworfen') {
    return `<section class="deal-entscheidung weg" aria-live="polite"><span class="eyebrow">Angebot abgelehnt</span>` +
      `<h3>Bewusst nicht gekauft</h3><p>Kein Kapital gebunden. Eure Prüfkenntnis bleibt erhalten; bei einer neuen Marktrunde entsteht eine neue Chance.</p>` +
      `<button type="button" id="btn-neu-pruefen">Entscheidung neu öffnen</button></section>`;
  }
  return `<section class="deal-entscheidung"><span class="eyebrow">Entscheidung</span>` +
    `<div>` +
      `<button type="button" id="btn-beobachten" aria-pressed="${entscheidung?.typ === 'beobachtet'}" ${reserviert || entscheidung?.typ === 'beobachtet' ? 'disabled' : ''}>${entscheidung?.typ === 'beobachtet' ? 'Wird beobachtet' : 'Beobachten'}</button>` +
      `<button type="button" id="btn-verwerfen" class="gefahr">Angebot ablehnen</button>` +
    `</div></section>`;
}

function befundDarstellung(text) {
  if (/⚠|fehlt|gerissen|überholt|fällig|marode|sonderumlage|mangel|problem|nicht vorhanden/i.test(text)) {
    return { klasse: 'schlecht', symbol: '!', label: 'Kritischer Befund' };
  }
  if (/gut|solide|unauffällig|keine verborgenen|ruhig|tadellos|gepflegt|funktional|erneuert|licht/i.test(text)) {
    return { klasse: 'gut', symbol: '✓', label: 'Positiver Befund' };
  }
  if (/wirkt|scheint|unklar|vermutlich|könnte/i.test(text)) {
    return { klasse: 'unklar', symbol: '?', label: 'Unklarer Befund' };
  }
  return { klasse: 'neutral', symbol: '•', label: 'Neutraler Befund' };
}

function mietstatusText(l) {
  if (!l.mietstatus.vermietet) {
    return `bezugsfrei${l.mietstatus.hinweis ? ` — ${l.mietstatus.hinweis}` : ''}`;
  }
  let t = `vermietet, ${fmtEUR(l.mietstatus.kaltmiete)} kalt`;
  if (l.mietstatus.mieterSeit) t += ` (seit ${l.mietstatus.mieterSeit})`;
  if (l.mietstatus.hinweis) t += ` — ${l.mietstatus.hinweis}`;
  return t;
}

function marktText(state, eintrag, interessenten) {
  if (!eintrag || eintrag.status === 'pausiert' || eintrag.status === 'verkauft') {
    return 'nicht mehr am Markt';
  }
  if (eintrag.status === 'reserviert') {
    return `Gebot angenommen: ${fmtEUR(eintrag.reserviertPreis)}`;
  }
  const monate = state.monat - eintrag.erschienen;
  return `seit ${monate} Mon. am Markt · ${interessenten} Interessent${interessenten === 1 ? '' : 'en'}`;
}

function gebotHTML(state, preis) {
  const gebotGesperrt = state.markt.feed[aktuelleId].letztesGebotMonat === state.monat;
  return (
    `<div class="gebot-zeile" data-angebot="${preis}">` +
    `<span class="eyebrow">Euer Gebot</span><output id="gebot-live">${fmtEUR(Math.round(preis / 100) * 100)}</output>` +
    `<p id="gebot-delta">entspricht dem Angebotspreis</p>` +
    `<input id="gebot-prozent" type="range" min="88" max="112" step="1" value="100" aria-label="Gebot in Prozent des Angebotspreises">` +
    `<input id="gebot-input" class="sr-only" type="number" step="100" min="1000" aria-label="Gebot in Euro" value="${Math.round(preis / 100) * 100}">` +
    `<div class="gebot-chance"><span>Annahme-Chance <b id="gebot-chance-label">denkbar</b></span><div><i id="gebot-chance-balken"></i></div>` +
    `<small id="gebot-chance-note">Marktlage und Konkurrenz bleiben unsicher.</small></div>` +
    `<button id="btn-gebot" class="primaer" ${gebotGesperrt ? 'disabled' : ''}>Gebot abgeben → Finanzierung</button>` +
    `</div>` +
    (gebotGesperrt
      ? '<p class="hinweis" id="gebot-hinweis">Der Verkäufer hat diesen Monat schon abgelehnt — wartet einen Monat.</p>'
      : '<p class="hinweis" id="gebot-hinweis">Unter Angebotspreis bieten spart Geld, riskiert aber die Absage. Weggehen ist auch eine Entscheidung.</p>')
  );
}

function ddHTML(state, l, dd) {
  const cfg = state.config.dueDiligence;
  const stand = pruefstand(state, l.id);
  const erkenntnisse = [];
  if (dd.besichtigt) l.besichtigung.forEach((t) => erkenntnisse.push(['Besichtigung', t]));
  if (dd.dokumente) {
    l.dokumente.forEach((t) => erkenntnisse.push(['Dokumente', t]));
    if (dd.sonderumlageBekannt && l.sonderumlage) {
      erkenntnisse.push(['Dokumente', `⚠ Sonderumlage steht an: ${l.sonderumlage.anlass} — ca. ${fmtEUR(l.sonderumlage.betrag)}`]);
    }
  }
  if (dd.gutachten) {
    if (dd.aufgedeckteMaengel.length === 0) {
      erkenntnisse.push(['Gutachten', 'Keine verborgenen Mängel gefunden. (Das ist keine Garantie.)']);
    }
    dd.aufgedeckteMaengel.forEach((i) => {
      const m = l.maengel[i];
      erkenntnisse.push(['Gutachten', `⚠ ${m.name} — Behebung ca. ${fmtEUR(m.kosten)}`]);
    });
  }

  return (
    `<div class="karte dd-karte"><h3>Due Diligence ` +
    `<button type="button" class="info-tooltip" ` +
    `aria-label="Info: Vorbereitung deckt Hinweise und manche Risiken auf. Kein Schritt garantiert ein mangelfreies Objekt." ` +
    `data-tooltip="Vorbereitung deckt Hinweise und manche Risiken auf. Kein Schritt garantiert ein mangelfreies Objekt.">?</button></h3>` +
    `<div class="pruefstand"><label>Prüffortschritt <progress value="${stand.schritte}" max="${stand.gesamt}">${stand.schritte} von ${stand.gesamt}</progress><b>${stand.schritte}/${stand.gesamt}</b></label>` +
    `<label>Restunsicherheit <meter min="0" max="100" low="25" high="70" optimum="0" value="${stand.restunsicherheit}">${stand.restunsicherheit} %</meter><b>${stand.label}</b></label>` +
    `<p>${stand.funde} Risikohinweis${stand.funde === 1 ? '' : 'e'} · ${stand.zeit} h eingesetzt · ${fmtEUR(stand.kosten)} Kosten</p></div>` +
    `<div class="dd-buttons">` +
    `<button id="btn-besichtigen" ${dd.besichtigt ? 'disabled' : ''}>Besichtigung <small>kostenlos · ${cfg.besichtigungZeit} h</small></button>` +
    `<button id="btn-dokumente" ${dd.dokumente ? 'disabled' : ''}>Dokumente anfordern <small>kostenlos · ${cfg.dokumenteZeit} h</small></button>` +
    `<button id="btn-gutachter" title="${Math.round(cfg.gutachterTrefferquote * 100)} % Trefferchance je vorhandenem Mangel" ${dd.gutachten ? 'disabled' : ''}>Gutachter <small>${fmtEUR(cfg.gutachterKosten)} · ${cfg.gutachterZeit} h</small></button>` +
    `</div>` +
    (erkenntnisse.length
      ? `<ul class="dd-liste">${erkenntnisse
          .map(([q, t]) => {
            const art = befundDarstellung(t);
            return `<li class="dd-befund dd-${art.klasse}"><span class="dd-symbol" role="img" aria-label="${art.label}">${art.symbol}</span><span class="dd-quelle">${q}</span><span>${t}</span></li>`;
          })
          .join('')}</ul>`
      : '') +
    `</div>`
  );
}

function wireAktionen(state, l, eintrag) {
  const neu = () => {
    ctx.autosave();
    renderExpose(ctx.getState(), true);
  };

  document.getElementById('btn-besichtigen')?.addEventListener('click', () => {
    const vorher = pruefstand(state, aktuelleId);
    besichtigen(state, aktuelleId);
    const nachher = pruefstand(state, aktuelleId);
    ctx.toast(`Besichtigt: Restunsicherheit ${vorher.restunsicherheit} % → ${nachher.restunsicherheit} %.`);
    neu();
  });
  document.getElementById('btn-dokumente')?.addEventListener('click', () => {
    const vorher = pruefstand(state, aktuelleId);
    dokumenteAnfordern(state, aktuelleId);
    const nachher = pruefstand(state, aktuelleId);
    ctx.toast(`Dokumente geprüft: ${nachher.funde - vorher.funde} neue Hinweise, Restunsicherheit ${nachher.restunsicherheit} %.`);
    neu();
  });
  document.getElementById('btn-gutachter')?.addEventListener('click', () => {
    const vorher = pruefstand(state, aktuelleId);
    const r = gutachterBeauftragen(state, aktuelleId);
    const nachher = pruefstand(state, aktuelleId);
    ctx.toast(r.fehler || `Gutachten: ${nachher.funde - vorher.funde} neue Hinweise, Restunsicherheit ${nachher.restunsicherheit} % (nie null).`);
    neu();
  });

  document.getElementById('gebot-prozent')?.addEventListener('input', updateGebotVorschau);
  updateGebotVorschau();

  document.getElementById('btn-gebot')?.addEventListener('click', () => {
    const gebot = Number(document.getElementById('gebot-input').value);
    if (!Number.isFinite(gebot) || gebot <= 0) return;
    const r = gebotAbgeben(state, aktuelleId, gebot);
    if (!r.ok) {
      ctx.toast(r.grund);
    } else if (r.angenommen) {
      ctx.toast('Der Verkäufer nimmt an! Jetzt die Finanzierung klären.');
      ctx.setSpeed(0);
      neu();
      oeffneFinanzierung({ listingId: aktuelleId, kaufpreis: gebot, modus: 'kauf' });
      return;
    } else {
      ctx.toast('Der Verkäufer lehnt ab.');
    }
    neu();
  });

  document.getElementById('btn-szenario')?.addEventListener('click', () => {
    const basis = eintrag?.reserviertPreis || Math.round(angebotsPreis(state, aktuelleId));
    ctx.setSpeed(0);
    oeffneFinanzierung({ listingId: aktuelleId, kaufpreis: basis, modus: 'szenario' });
  });
  document.getElementById('btn-finanzieren')?.addEventListener('click', () => {
    ctx.setSpeed(0);
    oeffneFinanzierung({ listingId: aktuelleId, kaufpreis: eintrag.reserviertPreis, modus: 'kauf' });
  });
  document.getElementById('btn-kauf-abbrechen')?.addEventListener('click', () => {
    kaufAbbrechen(state, aktuelleId);
    ctx.toast('Vom Kauf zurückgetreten.');
    neu();
  });

  document.getElementById('btn-beobachten')?.addEventListener('click', () => {
    const r = angebotBeobachten(state, aktuelleId);
    ctx.toast(r.grund || 'Beobachtung gespeichert — Preis und Marktzeit werden zur nächsten Chance vergleichbar.');
    neu();
  });
  document.getElementById('btn-verwerfen')?.addEventListener('click', () => {
    const r = angebotVerwerfen(state, aktuelleId);
    ctx.toast(r.grund || 'Angebot abgelehnt: Wissen gewonnen, kein Kapital gebunden.');
    neu();
  });
  document.getElementById('btn-neu-pruefen')?.addEventListener('click', () => {
    angebotNeuPruefen(state, aktuelleId);
    ctx.toast('Entscheidung wieder geöffnet. Eure Prüfkenntnis bleibt erhalten.');
    neu();
  });

  document.getElementById('expose-notizen').addEventListener('input', (ev) => {
    state.notizen[aktuelleId] = ev.target.value;
  });
  document.getElementById('expose-notizen').addEventListener('change', () => ctx.autosave());
}

function updateGebotVorschau() {
  const slider = document.getElementById('gebot-prozent');
  const panel = document.querySelector('.gebot-zeile[data-angebot]');
  if (!slider || !panel) return;
  const prozent = Number(slider.value);
  const angebot = Number(panel.dataset.angebot);
  const gebot = Math.round(angebot * prozent / 100 / 100) * 100;
  document.getElementById('gebot-input').value = String(gebot);
  document.getElementById('gebot-live').textContent = fmtEUR(gebot);
  const delta = gebot - angebot;
  document.getElementById('gebot-delta').textContent = Math.abs(delta) < 50
    ? 'entspricht dem Angebotspreis'
    : `${delta > 0 ? '+' : '−'}${fmtEUR(Math.abs(Math.round(delta)))} · ${Math.abs(100 - prozent)} % ${delta > 0 ? 'darüber' : 'darunter'}`;
  const chance = prozent < 93
    ? ['unwahrscheinlich', 24, 'Ein niedriger Preis spart Geld, erhöht aber das Absagerisiko.', 'niedrig']
    : prozent < 100
      ? ['denkbar', 48, 'Ein Abschlag ist möglich; Konkurrenz und Verkäuferdruck entscheiden mit.', 'mittel']
      : prozent < 106
        ? ['wahrscheinlich', 72, 'Marktnahes Gebot, trotzdem keine Zusage.', 'hoch']
        : ['sehr wahrscheinlich', 90, 'Ein Aufschlag erhöht die Chance, bindet aber mehr Kapital.', 'hoch'];
  document.getElementById('gebot-chance-label').textContent = chance[0];
  document.getElementById('gebot-chance-note').textContent = chance[2];
  const balken = document.getElementById('gebot-chance-balken');
  balken.style.width = `${chance[1]}%`;
  balken.dataset.stufe = chance[3];
}

// Live-Updates bei laufender Zeit (Preis driftet, Markt-Status ändert sich)
function updateLive(state, eintrag) {
  const l = getListing(aktuelleId);
  const preisEl = document.querySelector('[data-live="preis"]');
  if (!preisEl) return;
  const amMarkt = eintrag && (eintrag.status === 'amMarkt' || eintrag.status === 'reserviert');
  const preis = amMarkt ? Math.round(angebotsPreis(state, aktuelleId)) : null;
  preisEl.textContent = preis ? fmtEUR(preis) : '— (nicht am Markt)';
  const m2 = document.querySelector('[data-live="preism2"]');
  if (m2) m2.textContent = preis ? Math.round(preis / l.flaeche).toLocaleString('de-DE') + ' €/m²' : '';
  const rendite = document.querySelector('[data-live="rendite"]');
  if (rendite && preis) rendite.textContent = fmtProzent(((l.mietstatus.kaltmiete * 12) / preis) * 100);
  const markt = document.querySelector('[data-live="markt"]');
  if (markt) markt.textContent = marktText(state, eintrag, eintrag ? Math.round(eintrag.konkurrenz * 5) : 0);
  const gebotPanel = document.querySelector('.gebot-zeile[data-angebot]');
  if (gebotPanel && preis) {
    gebotPanel.dataset.angebot = String(preis);
    updateGebotVorschau();
  }

  // Gebots-Sperre gilt nur für den Monat der Ablehnung — beim Tick freigeben
  const gebotKnopf = document.getElementById('btn-gebot');
  if (gebotKnopf) {
    const gesperrt = !eintrag || eintrag.status !== 'amMarkt' || eintrag.letztesGebotMonat === state.monat;
    gebotKnopf.disabled = gesperrt;
    const hinweis = document.getElementById('gebot-hinweis');
    if (hinweis && eintrag?.status === 'amMarkt') {
      hinweis.textContent = gesperrt
        ? 'Der Verkäufer hat diesen Monat schon abgelehnt — wartet einen Monat.'
        : 'Unter Angebotspreis bieten spart Geld, riskiert aber die Absage. Weggehen ist auch eine Entscheidung.';
    }
  }
}

