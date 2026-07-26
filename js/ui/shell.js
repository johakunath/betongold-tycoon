// shell.js — Topbar (Datum, Geschwindigkeit, Menü), Dialoge (Neues Spiel,
// Spielstände, Kampagnenende) und Toasts. Spiel-Logik lebt in main.js.

import { DEFAULT_CONFIG, START_PRESETS } from '../config.js?v=55';
import { listSaves } from '../state.js?v=55';
import { datum, alter, gesamtMonate, istImRuhestand, monatsWerte } from '../engine.js?v=55';
import { fixkostenMonat, instandhaltungMonat } from '../immobilie.js?v=55';
import { fmtEUR, fmtDatum } from './util.js?v=55';
import { haushaltsUeberschussMonat } from './kennzahlen.js?v=55';
import { meldungMeta } from './meldungen.js?v=55';

let app = null; // Callbacks aus main.js

let screen = 'karte';
let cashflowHideTimer = null;
let cashflowGepinnt = false;
// Das Meldungsarchiv hat genau eine Quelle: state.log. Toasts sind flüchtige
// Bedienrückmeldung („Gespeichert als …") und gehören bewusst nicht hierher.
let gesehenLogLaenge = 0;
const dialogAusgangszustand = new WeakMap();
let tooltipElement = null;

function formularZustand(dialog) {
  const controls = [...dialog.querySelectorAll('input, select, textarea')]
    .filter((control) => !control.disabled && control.type !== 'file');
  return JSON.stringify(controls.map((control) => ({
    name: control.name || control.id,
    type: control.type,
    value: control.value,
    checked: control.checked,
  })));
}

function dialogTitel(dialog) {
  return dialog.querySelector('h1, h2, h3')?.textContent.trim() || 'diesem Dialog';
}

function dialogIstGeaendert(dialog) {
  const ausgang = dialogAusgangszustand.get(dialog);
  return ausgang !== undefined && ausgang !== formularZustand(dialog);
}

function versucheDialogZuSchliessen(dialog) {
  if (!dialog?.open || dialog.hasAttribute('data-schliessen-gesperrt')) return false;
  if (dialogIstGeaendert(dialog) && !window.confirm(
    `Ungespeicherte Änderungen in „${dialogTitel(dialog)}“ verwerfen?`
  )) return false;
  dialog.close();
  return true;
}

function initDialogVerhalten() {
  const merkeAusgang = (dialog) => requestAnimationFrame(() => {
    if (dialog.open) dialogAusgangszustand.set(dialog, formularZustand(dialog));
  });
  const observer = new MutationObserver((mutationen) => {
    for (const mutation of mutationen) {
      if (mutation.attributeName === 'open' && mutation.target.open) merkeAusgang(mutation.target);
    }
  });
  document.querySelectorAll('dialog').forEach((dialog) => {
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const ausserhalb = event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom;
      if (ausserhalb) versucheDialogZuSchliessen(dialog);
    });
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      versucheDialogZuSchliessen(dialog);
    });
  });
  document.addEventListener('click', (event) => {
    const schliessen = event.target.closest('[data-schliessen]');
    if (schliessen) versucheDialogZuSchliessen(schliessen.closest('dialog'));
  });
}

function initInfoTooltips() {
  tooltipElement = document.createElement('div');
  tooltipElement.className = 'floating-info-tooltip';
  tooltipElement.setAttribute('role', 'tooltip');
  tooltipElement.popover = 'manual';
  document.body.append(tooltipElement);

  const ausblenden = () => {
    if (tooltipElement.matches(':popover-open')) tooltipElement.hidePopover();
  };
  const anzeigen = (trigger) => {
    const text = trigger?.dataset.tooltip;
    if (!text) return ausblenden();
    tooltipElement.textContent = text;
    if (!tooltipElement.matches(':popover-open')) tooltipElement.showPopover();
    const triggerRect = trigger.getBoundingClientRect();
    const tipRect = tooltipElement.getBoundingClientRect();
    const rand = 10;
    const links = Math.min(
      window.innerWidth - tipRect.width - rand,
      Math.max(rand, triggerRect.left + triggerRect.width / 2 - tipRect.width / 2)
    );
    const platzOben = triggerRect.top - tipRect.height - 9;
    const oben = platzOben >= rand
      ? platzOben
      : Math.min(window.innerHeight - tipRect.height - rand, triggerRect.bottom + 9);
    tooltipElement.style.left = `${links}px`;
    tooltipElement.style.top = `${Math.max(rand, oben)}px`;
  };
  document.addEventListener('pointerover', (event) => {
    const trigger = event.target.closest('.info-tooltip[data-tooltip]');
    if (trigger) anzeigen(trigger);
  });
  document.addEventListener('pointerout', (event) => {
    if (event.target.closest('.info-tooltip[data-tooltip]')) ausblenden();
  });
  document.addEventListener('focusin', (event) => {
    const trigger = event.target.closest('.info-tooltip[data-tooltip]');
    if (trigger) anzeigen(trigger);
  });
  document.addEventListener('focusout', (event) => {
    if (event.target.closest('.info-tooltip[data-tooltip]')) ausblenden();
  });
  document.addEventListener('scroll', ausblenden, true);
  window.addEventListener('resize', ausblenden);
}

export function initShell(appApi) {
  app = appApi;
  initDialogVerhalten();
  initInfoTooltips();

  // Navigation zwischen Screens
  document.getElementById('nav-karte').addEventListener('click', () => zeigeScreen('karte'));
  document.getElementById('nav-marktplatz').addEventListener('click', () => zeigeScreen('marktplatz'));
  document.getElementById('nav-finanzen').addEventListener('click', oeffneFinanzen);
  document.querySelectorAll('[data-zentrale-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      if (screen !== 'dashboard') zeigeScreen('dashboard');
    });
  });

  // Geschwindigkeit
  document.querySelectorAll('#speed-group [data-speed]').forEach((btn) => {
    btn.addEventListener('click', () => app.setSpeed(Number(btn.dataset.speed)));
  });
  document.getElementById('btn-step-monat').addEventListener('click', () => app.schritt(1));
  document.getElementById('btn-step-jahr').addEventListener('click', () => app.schritt(12));

  // Kompaktes Spielmenü und wieder aufrufbare Benachrichtigungen.
  const menueButton = document.getElementById('btn-menue');
  const menuePopover = document.getElementById('spielmenue-popover');
  const schliesseMenue = () => {
    menuePopover.hidden = true;
    menueButton.setAttribute('aria-expanded', 'false');
  };
  menueButton.addEventListener('click', (event) => {
    event.stopPropagation();
    menuePopover.hidden = !menuePopover.hidden;
    menueButton.setAttribute('aria-expanded', String(!menuePopover.hidden));
    if (!menuePopover.hidden) menuePopover.querySelector('button')?.focus();
  });
  menuePopover.addEventListener('click', (event) => event.stopPropagation());
  document.addEventListener('click', schliesseMenue);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menuePopover.hidden) {
      schliesseMenue();
      menueButton.focus();
    }
  });
  document.querySelectorAll('#spielmenue-popover > button').forEach((button) =>
    button.addEventListener('click', schliesseMenue));
  document.getElementById('btn-neu').addEventListener('click', () => zeigeNeuesSpiel(false));
  document.getElementById('btn-saves').addEventListener('click', zeigeSaves);
  document.getElementById('btn-hilfe').addEventListener('click', () => {
    app.setSpeed(0);
    dlg('dlg-hilfe').showModal();
  });
  document.getElementById('hud-cash-aktion').addEventListener('click', oeffneFinanzen);
  document.getElementById('hud-etf-aktion').addEventListener('click', oeffneFinanzen);
  initCashflowPopover();
  initMeldungen();

  // Startlage: Familien- und Vermögensprofil unabhängig von der Schwierigkeit.
  document.getElementById('preset-optionen').innerHTML = Object.entries(START_PRESETS)
    .map(([id, p], i) =>
      `<label class="preset-option"><input type="radio" name="startPreset" value="${id}" ${i === 0 ? 'checked' : ''}>` +
      `<img class="preset-bild" src="${p.bild}" alt="">` +
      `<span><b>${p.label}</b><small>${p.kurz}</small><small>${p.beschreibung}</small></span></label>`)
    .join('');

  // Neues Spiel: Schwierigkeits-Optionen aus der Config bauen
  const optionen = Object.entries(DEFAULT_CONFIG.schwierigkeiten)
    .map(([id, d]) => {
      const eventText = d.eventFaktor < 1 ? 'weniger Ereignisse' : d.eventFaktor > 1 ? 'mehr Ereignisse' : 'normale Ereignisse';
      const marktText = d.volatilitaetsFaktor < 1 ? 'ruhiger Markt' : d.volatilitaetsFaktor > 1 ? 'volatiler Markt' : 'normaler Markt';
      const bankText = { kulant: 'Kulante Bank', standard: 'Standardbank', streng: 'Strenge Bank' }[d.bankPuffer];
      return (
      `<label class="diff-option"><input type="radio" name="schwierigkeit" value="${id}" ${id === 'normal' ? 'checked' : ''}>` +
      `<span><b>${d.label}</b><small>${Math.round(d.kapitalFaktor * 100)} % Startvermögen · ${Math.round((d.einkommensFaktor || 1) * 100)} % Einkommen</small>` +
      `<small>${bankText} · ${eventText} · ${marktText}</small></span></label>`
      );
    })
    .join('');
  document.getElementById('diff-optionen').innerHTML = optionen;
  const neuForm = document.getElementById('form-neu');
  const setzeStartFeld = (name, wert) => {
    neuForm.elements.namedItem(name).value = wert ?? '';
  };
  const startZahl = (name, fallback = 0) => {
    const roh = neuForm.elements.namedItem(name).value;
    return roh === '' ? fallback : Number(roh);
  };
  const startKinder = () => ['kind1Alter', 'kind2Alter']
    .map((name) => neuForm.elements.namedItem(name).value)
    .filter((wert) => wert !== '')
    .map((wert) => ({ alter: Number(wert) }));
  const direkteKinderkosten = (kinder) => kinder.reduce((summe, kind) => {
    const stufe = DEFAULT_CONFIG.haushalt.kinderKosten
      .find((eintrag) => kind.alter <= eintrag.bisAlter);
    return summe + (kind.alter < DEFAULT_CONFIG.haushalt.auszugsAlter
      ? (stufe || DEFAULT_CONFIG.haushalt.kinderKosten.at(-1)).kosten
      : 0);
  }, 0);
  const ladePresetZahlen = () => {
    const p = START_PRESETS[neuForm.elements.startPreset.value];
    const h = { ...DEFAULT_CONFIG.haushalt, ...(p.haushalt || {}) };
    const k = { ...DEFAULT_CONFIG.kapital, ...(p.kapital || {}) };
    setzeStartFeld('startAlter', p.startAlter);
    setzeStartFeld('kind1Alter', p.kinder?.[0]?.alter);
    setzeStartFeld('kind2Alter', p.kinder?.[1]?.alter);
    setzeStartFeld('cash', p.cash);
    setzeStartFeld('etf', p.etf || 0);
    setzeStartFeld('netto1', h.nettoEinkommenPerson1);
    setzeStartFeld('netto2', h.nettoEinkommenPerson2);
    setzeStartFeld('miete', h.miete);
    setzeStartFeld('mieteKalt', h.mieteKalt);
    setzeStartFeld('lebenOhneReisen', Math.max(0, h.lebenshaltung - h.reisen));
    setzeStartFeld('reisen', h.reisen);
    setzeStartFeld('autoAbMonat', h.autoAbMonat);
    setzeStartFeld('autoKostenMonat', h.autoKostenMonat);
    setzeStartFeld('kindergeldProKind', h.kindergeldProKind);
    setzeStartFeld('kindergeldBisAlter', h.kindergeldBisAlter);
    setzeStartFeld('sparplanEtfProzent', Math.round(h.sparplanEtfAnteil * 100));
    setzeStartFeld('tagesgeldZinsProzent', k.tagesgeldZins * 100);
  };
  const updateStartVorschau = () => {
    const p = START_PRESETS[neuForm.elements.startPreset.value];
    const d = DEFAULT_CONFIG.schwierigkeiten[neuForm.elements.schwierigkeit.value];
    const kinder = startKinder();
    const einkommen = Math.round((startZahl('netto1') + startZahl('netto2')) * (d.einkommensFaktor || 1));
    const kindergeld = kinder.filter((kind) => kind.alter < startZahl('kindergeldBisAlter')).length
      * startZahl('kindergeldProKind');
    const etfAnteil = startZahl('sparplanEtfProzent');
    const tagesgeldZins = startZahl('tagesgeldZinsProzent').toLocaleString('de-DE');
    const autoStart = startZahl('autoAbMonat');
    const autoKosten = startZahl('autoKostenMonat');
    const ausgaben = startZahl('miete') + startZahl('lebenOhneReisen') + startZahl('reisen')
      + direkteKinderkosten(kinder) + (autoStart === 0 ? autoKosten : 0);
    const sparrate = einkommen + kindergeld - ausgaben;
    const besonderheiten = [];
    if (p.startbestand?.length) {
      const ltvs = p.startbestand.map((objekt) => Math.round(objekt.ltv * 100));
      besonderheiten.push(`${p.startbestand.length} Mietobjekte · ${Math.min(...ltvs)}–${Math.max(...ltvs)} % finanziert`);
    }
    if (p.beruf?.handwerklich) besonderheiten.push('Handwerksbonus bei Renovierungen');
    if (autoKosten > 0) besonderheiten.push(`Auto ab Monat ${autoStart}: ${fmtEUR(autoKosten)}/Monat all-in`);
    const ersterSprung = p.haushalt?.einkommensSpruenge?.[0];
    if (ersterSprung) besonderheiten.push(`${ersterSprung.label} ab Jahr ${Math.round(ersterSprung.abMonat / 12) + 1}`);
    document.getElementById('start-vorschau').innerHTML =
      `<span>Startklar mit</span><ul>` +
      `<li>${fmtEUR(Math.round(startZahl('cash') * d.kapitalFaktor))} Tagesgeld</li>` +
      `<li>${fmtEUR(Math.round(startZahl('etf') * d.kapitalFaktor))} ETF-Depot</li>` +
      `<li>${fmtEUR(einkommen)} Netto${kindergeld ? ` + ${fmtEUR(kindergeld)} Kindergeld` : ''} · ${fmtEUR(ausgaben)} Ausgaben · ${fmtEUR(sparrate)} Sparrate</li>` +
      `<li>${etfAnteil} % ETF-Sparplan · ${tagesgeldZins} % Tagesgeld · Ruhestand ab ${DEFAULT_CONFIG.zeit.rentenAlter}: ${Math.round(DEFAULT_CONFIG.haushalt.rentenNettoFaktor * 100)} % · Lebensende ${DEFAULT_CONFIG.zeit.lebensendeMinAlter}–${DEFAULT_CONFIG.zeit.lebensendeMaxAlter}</li>` +
      (besonderheiten.length ? `<li class="start-besonderheit">${besonderheiten.join(' · ')}</li>` : '') +
      `</ul>`;
  };
  neuForm.addEventListener('change', (event) => {
    if (event.target.name === 'startPreset') {
      ladePresetZahlen();
      updateStartVorschau();
    }
  });
  neuForm.addEventListener('input', updateStartVorschau);
  ladePresetZahlen();
  updateStartVorschau();

  neuForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = ev.target;
    f.elements.mieteKalt.setCustomValidity(startZahl('mieteKalt') > startZahl('miete')
      ? 'Die Kaltmiete darf nicht über der Warmmiete liegen.'
      : '');
    if (!f.reportValidity()) return;
    const kinder = startKinder();
    const lebenshaltung = startZahl('lebenOhneReisen') + startZahl('reisen');
    const ausgabenGesamtStart = startZahl('miete') + lebenshaltung + direkteKinderkosten(kinder)
      + (startZahl('autoAbMonat') === 0 ? startZahl('autoKostenMonat') : 0);
    const startAnpassung = {
      startAlter: startZahl('startAlter'),
      cash: startZahl('cash'),
      etf: startZahl('etf'),
      kinder,
      haushalt: {
        nettoEinkommenPerson1: startZahl('netto1'),
        nettoEinkommenPerson2: startZahl('netto2'),
        nettoEinkommen: startZahl('netto1') + startZahl('netto2'),
        miete: startZahl('miete'),
        mieteKalt: startZahl('mieteKalt'),
        lebenshaltung,
        reisen: startZahl('reisen'),
        autoAbMonat: startZahl('autoAbMonat'),
        autoKostenMonat: startZahl('autoKostenMonat'),
        kindergeldProKind: startZahl('kindergeldProKind'),
        kindergeldBisAlter: startZahl('kindergeldBisAlter'),
        sparplanEtfAnteil: startZahl('sparplanEtfProzent') / 100,
        ausgabenGesamtStart,
        ausgabenOhneReisenStart: ausgabenGesamtStart - startZahl('reisen'),
      },
      kapital: { tagesgeldZins: startZahl('tagesgeldZinsProzent') / 100 },
    };
    dlg('dlg-neu').close();
    app.neuesSpiel({
      schwierigkeit: f.elements.schwierigkeit.value,
      startPreset: f.elements.startPreset.value,
      startAnpassung,
      seedText: f.elements.seed.value,
    });
  });

  // Spielstände-Dialog
  document.getElementById('form-speichern').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const eingabe = ev.target.elements.slotname;
    const name = eingabe.value.trim().replace(/[^\wäöüÄÖÜß \-]/g, '');
    if (!name) return;
    app.speichern(name);
    eingabe.value = '';
    renderSlotListe();
  });
  document.getElementById('btn-export').addEventListener('click', () => app.exportieren());
  document.getElementById('btn-import').addEventListener('click', () =>
    document.getElementById('import-datei').click());
  document.getElementById('import-datei').addEventListener('change', (ev) => {
    const datei = ev.target.files[0];
    ev.target.value = '';
    if (datei) app.importieren(datei);
  });

}

function dlg(id) {
  return document.getElementById(id);
}

// --- Screens ------------------------------------------------------------------

export function aktiverScreen() {
  return screen;
}

export function zeigeScreen(name) {
  screen = name;
  for (const s of ['dashboard', 'finanzen', 'karte', 'marktplatz', 'expose', 'objekt', 'endgame']) {
    document.getElementById(`screen-${s}`).hidden = s !== name;
  }
  aktualisiereNavMarkierung();
  document.body.dataset.screen = name;
  app.render();
  // Nach echter Screen-Navigation landet die Tastatur an einer eindeutigen
  // Stelle und der neue Bereich beginnt oben. Solange ein Dialog offen ist,
  // bleibt der Fokus im Modal.
  if (!document.querySelector('dialog[open]')) {
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => document.getElementById(`screen-${name}`)?.focus());
  }
}

// Der Bestand ist ein Tab der Zentrale, kein eigener Hauptscreen. Alle Wege
// dorthin (Objekt-Detail „zurück", Empfehlungen) laufen über diese eine Stelle.
export function zeigePortfolio() {
  zeigeScreen('dashboard');
  document.querySelector('[data-zentrale-tab="objekte"]')?.click();
}

// Genau ein Navigationspunkt ist aktiv. Exposé gehört zum Marktplatz;
// Objekt-Detail und der Objekte-Tab gehören zur Zentrale.
export function aktualisiereNavMarkierung() {
  const aktivId = {
    karte: 'nav-karte',
    marktplatz: 'nav-marktplatz',
    expose: 'nav-marktplatz',
    finanzen: 'nav-finanzen',
  }[screen];
  for (const id of ['nav-karte', 'nav-marktplatz', 'nav-finanzen']) {
    const button = document.getElementById(id);
    const aktiv = id === aktivId;
    button.classList.toggle('aktiv', aktiv);
    if (aktiv) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }

  // Die Zentrale-Tabs bleiben als direkte Ziele im Dock sichtbar. Außerhalb
  // der Zentrale darf ihre zuletzt gemerkte Auswahl aber nicht wie ein zweiter
  // aktiver Hauptbereich aussehen. aria-selected bewahrt den Tabzustand für
  // die Rückkehr; .aktiv und aria-current beschreiben nur den sichtbaren Screen.
  document.querySelectorAll('[data-zentrale-tab]').forEach((button) => {
    const sichtbarAktiv = screen === 'dashboard' && button.getAttribute('aria-selected') === 'true';
    button.classList.toggle('aktiv', sichtbarAktiv);
    if (sichtbarAktiv) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

function initCashflowPopover() {
  const button = document.getElementById('hud-cashflow-aktion');
  const panel = document.getElementById('cashflow-popover');
  const zeigen = () => {
    clearTimeout(cashflowHideTimer);
    if (!app.getState()) return;
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
  };
  const verbergen = () => {
    clearTimeout(cashflowHideTimer);
    cashflowGepinnt = false;
    panel.classList.remove('gepinnt');
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  };
  const spaeterVerbergen = () => {
    clearTimeout(cashflowHideTimer);
    cashflowHideTimer = setTimeout(() => {
      if (cashflowGepinnt) return;
      panel.hidden = true;
      button.setAttribute('aria-expanded', 'false');
    }, 220);
  };
  button.addEventListener('mouseenter', zeigen);
  button.addEventListener('mouseleave', spaeterVerbergen);
  button.addEventListener('focus', zeigen);
  button.addEventListener('blur', spaeterVerbergen);
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    verbergen();
    zeigeScreen('dashboard');
    document.querySelector('[data-zentrale-tab="haushalt"]')?.click();
  });
  panel.addEventListener('mouseenter', zeigen);
  panel.addEventListener('mouseleave', spaeterVerbergen);
  panel.addEventListener('focusin', zeigen);
  panel.addEventListener('focusout', spaeterVerbergen);
  panel.addEventListener('click', (event) => event.stopPropagation());
  document.addEventListener('click', () => {
    if (cashflowGepinnt) verbergen();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
      verbergen();
      button.focus();
    }
  });
}

function initMeldungen() {
  const panel = document.getElementById('meldungen-panel');
  const button = document.getElementById('btn-meldungen');
  const schliessen = () => {
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  };
  button.setAttribute('aria-expanded', 'false');
  button.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    button.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) {
      gesehenLogLaenge = (app?.getState?.()?.log || []).length;
      renderMeldungen();
    }
  });
  document.getElementById('btn-meldungen-schliessen').addEventListener('click', schliessen);
  document.getElementById('meldungen-liste').addEventListener('click', (event) => {
    const button = event.target.closest('[data-meldung-index]');
    if (!button) return;
    const state = app?.getState?.();
    const eintrag = state?.log?.[Number(button.dataset.meldungIndex)];
    if (!eintrag) return;
    schliessen();
    if (eintrag.aktion === 'bewerber' && eintrag.ziel) {
      app.oeffneBewerber?.(eintrag.ziel);
      return;
    }
    const meta = meldungMeta(eintrag, state);
    if (meta.zielTyp === 'objekt') app.oeffneObjekt?.(meta.ziel);
    else if (meta.zielTyp === 'expose') app.oeffneExpose?.(meta.ziel);
    else if (meta.zielTyp === 'haushalt') {
      zeigeScreen('dashboard');
      document.querySelector('[data-zentrale-tab="haushalt"]')?.click();
    } else if (meta.zielTyp === 'objekte') {
      zeigePortfolio();
    } else if (meta.zielTyp) zeigeScreen(meta.zielTyp);
  });
}

// Spielmonat eines Logeintrags als Datum — dieselbe Zeitrechnung wie der HUD.
function logDatum(state, monat) {
  const z = state.config.zeit;
  return new Date(z.startJahr, z.startMonat - 1 + monat, 1);
}

function renderMeldungen() {
  const state = app?.getState?.();
  const log = state?.log || [];
  const liste = document.getElementById('meldungen-liste');
  const start = Math.max(0, log.length - 40);
  const eintraege = log.slice(start).map((eintrag, offset) => ({ eintrag, index: start + offset })).reverse();
  liste.innerHTML = eintraege.length
    ? eintraege.map(({ eintrag, index }) => {
      const d = logDatum(state, eintrag.monat);
      const meta = meldungMeta(eintrag, state);
      return `<li class="meldung-${meta.klasse}${meta.aktion ? ' ist-aktion' : ''}"><button type="button" class="meldung-link" data-meldung-index="${index}" aria-label="${escapeHtml(meta.label)}: ${escapeHtml(eintrag.text)}">` +
        `<span class="meldung-symbol" aria-hidden="true">${meta.symbol}</span><span class="meldung-copy"><span>${escapeHtml(eintrag.text)}</span>` +
        `<time datetime="${d.toISOString().slice(0, 7)}">${fmtDatum(d)}</time></span><span class="meldung-pfeil" aria-hidden="true">→</span></button></li>`;
    }).join('')
    : '<li class="leer">Noch keine Meldungen. Der erste Marktmonat bringt neue Situationen.</li>';
  const ungelesen = Math.max(0, log.length - gesehenLogLaenge);
  const zaehler = document.getElementById('meldungen-zaehler');
  zaehler.hidden = ungelesen === 0;
  zaehler.textContent = ungelesen > 9 ? '9+' : String(ungelesen);
}

// --- Topbar / HUD -----------------------------------------------------------

export function updateHud(state, speed) {
  document.getElementById('hud-datum').textContent = state ? fmtDatum(datum(state)) : '—';
  document.getElementById('hud-alter').textContent = state
    ? `Jahr ${Math.floor(state.monat / 12) + 1}/${Math.ceil(gesamtMonate(state) / 12)} · Alter ${alter(state)}${istImRuhestand(state) ? ' · Ruhestand' : ''}`
    : '';
  const haushaltsUeberschuss = state ? haushaltsUeberschussMonat(state) : 0;
  const ressourcen = state ? {
    cash: fmtEUR(state.cash),
    etf: fmtEUR(state.etfDepot.wert),
    cashflow: `${haushaltsUeberschuss >= 0 ? '+' : ''}${fmtEUR(haushaltsUeberschuss)}`,
  } : { cash: '—', etf: '—', cashflow: '—' };
  for (const [id, wert] of Object.entries(ressourcen)) {
    document.getElementById(`hud-${id}`).textContent = wert;
  }
  document.getElementById('hud-cash').classList.toggle('wert-negativ', !!state && state.cash < 0);
  const cashflow = document.querySelector('.resource-cashflow');
  cashflow.classList.toggle('positiv', !!state && haushaltsUeberschuss >= 0);
  cashflow.classList.toggle('negativ', !!state && haushaltsUeberschuss < 0);
  cashflow.disabled = !state;
  renderCashflowDetails(state);
  // Archiv und Ungelesen-Zähler folgen dem Spiel-Log, also jedem Monatszug.
  renderMeldungen();
  document.getElementById('hud-cash-aktion').disabled = !state;
  document.getElementById('hud-etf-aktion').disabled = !state;
  document.querySelectorAll('#speed-group [data-speed]').forEach((btn) => {
    const aktiv = Number(btn.dataset.speed) === speed;
    btn.classList.toggle('aktiv', aktiv);
    btn.setAttribute('aria-pressed', String(aktiv));
  });
  const amMarkt = state
    ? Object.values(state.markt.feed).filter((e) => e.status === 'amMarkt').length
    : 0;
  document.getElementById('markt-zaehler').textContent = amMarkt > 0 ? amMarkt : '';
  document.getElementById('nav-marktplatz').setAttribute(
    'aria-label', amMarkt > 0 ? `Marktplatz, ${amMarkt} Angebote` : 'Marktplatz'
  );
}

function oeffneFinanzen() {
  if (!app.getState()) return;
  app.setSpeed(0);
  zeigeScreen('finanzen');
}

function renderCashflowDetails(state) {
  const panel = document.getElementById('cashflow-popover');
  if (!state) {
    panel.innerHTML = '';
    return;
  }
  const w = state.letzteHaushaltswerte || monatsWerte(state);
  const ueberschuss = haushaltsUeberschussMonat(state);
  const objektCashflow = state.portfolio.reduce((summe, objekt) => {
    const vermietet = objekt.vermietet && !objekt.renovierung;
    const miete = vermietet ? objekt.kaltmiete : 0;
    return summe + miete - fixkostenMonat(state, objekt, vermietet) - instandhaltungMonat(state, objekt) -
      (objekt.hausverwaltung && vermietet ? objekt.kaltmiete * state.config.bewirtschaftung.hausverwaltungProzent : 0) -
      (objekt.darlehen.restschuld > 0 ? objekt.darlehen.rate : 0);
  }, 0) + (state.letzterEigenheimCashflow || 0);
  const ausgaben = w.miete + w.lebenshaltung + w.kinder;
  const zeilen = [
    ['Einkommen inkl. Kindergeld', w.gesamteinkommen],
    ['Haushalt & Wohnen', -ausgaben],
    ['Immobilien-Cashflow', objektCashflow],
    ['Haushaltsüberschuss', ueberschuss],
  ];
  const html = zeilen.map(([label, wert], index) => `<tr class="${index === zeilen.length - 1 ? 'summe' : ''}"><td>${label}</td><td class="${wert < 0 ? 'negativ' : 'positiv'}">${wert >= 0 ? '+' : '−'}${fmtEUR(Math.abs(Math.round(wert)))}</td></tr>`).join('');
  panel.innerHTML = `<div class="cashflow-popover-kopf"><span class="eyebrow">Kurzüberblick</span><h2>Haushaltsüberschuss</h2>` +
    `<p>Klick öffnet die vollständige Haushaltsrechnung.</p></div><table class="cashflow-details"><tbody>${html}</tbody></table>`;
}

// --- Neues Spiel ------------------------------------------------------------

// erzwungen = true beim ersten Start: kein Abbrechen möglich.
export function zeigeNeuesSpiel(erzwungen) {
  const d = dlg('dlg-neu');
  d.querySelector('[data-schliessen]').hidden = erzwungen;
  d.toggleAttribute('data-schliessen-gesperrt', erzwungen);
  if (!d.open) d.showModal();
}

// --- Spielstände ------------------------------------------------------------

export function zeigeSaves() {
  renderSlotListe();
  dlg('dlg-saves').showModal();
}

function renderSlotListe() {
  const slots = listSaves();
  const ziel = document.getElementById('slot-liste');
  if (slots.length === 0) {
    ziel.innerHTML = '<p class="muted">Noch keine Spielstände.</p>';
    return;
  }
  ziel.innerHTML = slots
    .map((s) => {
      if (s.defekt) return `<div class="slot"><b>${s.slot}</b> <span class="muted">(defekt)</span></div>`;
      const wann = s.gespeichert ? new Date(s.gespeichert).toLocaleString('de-DE') : '';
      const jahre = Math.floor(s.monat / 12);
      return (
        `<div class="slot"><div class="slot-info"><b>${s.slot}</b>` +
        `<small>${wann} · Jahr ${jahre} · Cash ${fmtEUR(s.cash)}${s.beendet ? ' · beendet' : ''}</small></div>` +
        `<div class="slot-aktionen">` +
        `<button data-laden="${s.slot}">Laden</button>` +
        `<button data-loeschen="${s.slot}" class="gefahr" title="Löschen">✕</button>` +
        `</div></div>`
      );
    })
    .join('');
  ziel.querySelectorAll('[data-laden]').forEach((b) =>
    b.addEventListener('click', () => {
      dlg('dlg-saves').close();
      app.laden(b.dataset.laden);
    }));
  ziel.querySelectorAll('[data-loeschen]').forEach((b) =>
    b.addEventListener('click', () => {
      app.loeschen(b.dataset.loeschen);
      renderSlotListe();
    }));
}

// --- Toast ------------------------------------------------------------------

let toastTimer = null;

export function toast(text, { dauer = 5200, wichtig = false, typ = 'standard' } = {}) {
  const inhalt = String(text);
  const el = document.getElementById('toast');
  el.textContent = inhalt;
  el.classList.toggle('wichtig', wichtig);
  el.classList.toggle('ratgeber', typ === 'ratgeber');
  el.classList.add('sichtbar');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('sichtbar', 'wichtig', 'ratgeber');
  }, dauer);
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (zeichen) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[zeichen]);
}

