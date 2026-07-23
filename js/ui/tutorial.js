// tutorial.js — optionaler, nicht spielverändernder Rundgang durch die
// wichtigsten UI-Bereiche. Die Zeit bleibt während der Tour pausiert.

const SCHRITTE = [
  {
    screen: 'dashboard', tab: 'vermoegen', selector: '#tile-cash', titel: 'Verfügbares Tagesgeld',
    text: 'Hier steht euer sofort einsetzbarer Puffer. Käufe, Prüfungen, Reparaturen und ein negativer Monats-Cashflow gehen direkt davon ab.',
  },
  {
    screen: 'dashboard', tab: 'vermoegen', selector: '#tile-cashflow', titel: 'Haushaltsüberschuss',
    text: 'Diese Kennzahl zeigt einen typischen Planungsmonat mit Einkommen, Lebenshaltung und Objekt-Cashflows vor der freiwilligen ETF-Umschichtung. Die echte Tagesgeld-Veränderung steht separat in der Haushaltsrechnung.',
  },
  {
    screen: 'dashboard', tab: 'haushalt', selector: '.haushalt-karte', titel: 'Haushalt und Sparplan',
    text: 'Die Haushaltsrechnung erklärt den Cashflow Posten für Posten. Kinder werden als direkte Zusatzkosten gezeigt; Grundbedarf steckt bereits in der Lebenshaltung.',
  },
  {
    screen: 'dashboard', tab: 'vermoegen', selector: '.chart-karte', titel: 'Strategie im Vergleich',
    text: 'Die blaue Linie ist euer Nettovermögen, die gelbe der Gegenfall mit denselben externen Sparraten im Welt-ETF. Darunter seht ihr Mix, Finanzierungsquote und Liquiditätspuffer.',
  },
  {
    screen: 'karte', selector: '.stadtkarte', titel: 'Märkte auf der Stadtkarte',
    text: 'Auf der Karte liegen alle Angebote, pausierten Chancen und eigenen Objekte. Markerform und Listenstatus vermitteln dieselbe Information auch ohne Farbe.',
  },
  {
    screen: 'marktplatz', selector: '.filter-zeile', titel: 'Angebote auswählen',
    text: 'Filtert nach Segment, Status und Objektart. Öffnet dann ein Exposé und setzt Prüfzeit dort ein, wo Unsicherheit eure Entscheidung wirklich ändern kann.',
  },
  {
    screen: 'dashboard', selector: '#speed-group', titel: 'Zeit kontrolliert weiterschalten',
    text: 'Für die erste Partie ist +1 Monat der sicherste Takt. Laufende Zeit pausiert automatisch bei Entscheidungen, die nicht unbemerkt vorbeiziehen sollen.',
  },
  {
    screen: 'dashboard', tab: 'vermoegen', menu: true, selector: '#btn-saves', titel: 'Speichern und ausprobieren',
    text: 'Autosave schützt den laufenden Stand. Benannte Spielstände und JSON-Export helfen euch, verschiedene Finanzierungen oder Familienwege bewusst zu vergleichen.',
  },
];

let api = null;
let index = -1;
let fokus = null;

export function initTutorial(context) {
  api = context;
  document.getElementById('btn-tour-start').addEventListener('click', starten);
  document.getElementById('btn-tour-zurueck').addEventListener('click', () => zeigen(index - 1));
  document.getElementById('btn-tour-weiter').addEventListener('click', () => {
    if (index >= SCHRITTE.length - 1) beenden(true);
    else zeigen(index + 1);
  });
  document.getElementById('btn-tour-schliessen').addEventListener('click', () => beenden(false));
  document.addEventListener('keydown', (event) => {
    if (index < 0 || event.key !== 'Escape') return;
    event.preventDefault();
    beenden(false);
  });
}

function starten() {
  api.setSpeed(0);
  document.getElementById('dlg-hilfe').close();
  document.getElementById('tutorial-tour').hidden = false;
  zeigen(0);
}

function zeigen(neuerIndex) {
  index = Math.max(0, Math.min(SCHRITTE.length - 1, neuerIndex));
  fokus?.classList.remove('tutorial-fokus');
  fokus = null;
  const schritt = SCHRITTE[index];
  const menue = document.getElementById('btn-menue');
  if (menue.getAttribute('aria-expanded') === 'true') menue.click();
  api.zeigeScreen(schritt.screen);
  if (schritt.tab) document.querySelector(`[data-zentrale-tab="${schritt.tab}"]`)?.click();
  document.getElementById('tour-fortschritt').textContent = `Schritt ${index + 1} von ${SCHRITTE.length}`;
  document.getElementById('tour-titel').textContent = schritt.titel;
  document.getElementById('tour-text').textContent = schritt.text;
  document.getElementById('btn-tour-zurueck').disabled = index === 0;
  document.getElementById('btn-tour-weiter').textContent = index === SCHRITTE.length - 1 ? 'Tour beenden' : 'Weiter';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (schritt.menu && menue.getAttribute('aria-expanded') !== 'true') menue.click();
    fokus = document.querySelector(schritt.selector);
    fokus?.classList.add('tutorial-fokus');
    fokus?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    document.getElementById('btn-tour-weiter').focus({ preventScroll: true });
  }));
}

function beenden(zurZentrale) {
  fokus?.classList.remove('tutorial-fokus');
  fokus = null;
  index = -1;
  document.getElementById('tutorial-tour').hidden = true;
  if (zurZentrale) api.zeigeScreen('dashboard');
  document.getElementById('btn-hilfe').focus({ preventScroll: true });
}
