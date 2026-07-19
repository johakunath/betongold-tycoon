// Dependency-freier Browser-Smoke-Test über das Chrome DevTools Protocol.
// Startet Edge/Chrome headless und bedient den echten UI-Weg:
// Dashboard → Markt → Exposé → Gebot → Finanzierung → Kauf → Portfolio.
//
//   node test/browser-smoke.mjs
//   BROWSER_BIN=/pfad/zu/chrome node test/browser-smoke.mjs

// Keine Playwright-/Puppeteer-Abhängigkeit: Node >= 22 stellt fetch und
// WebSocket bereit. Unter Windows werden Edge und Chrome automatisch gesucht.

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const warten = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

async function findeBrowser() {
  const kandidaten = [
    process.env.BROWSER_BIN,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  for (const kandidat of kandidaten) {
    try {
      await access(kandidat);
      return kandidat;
    } catch {
      // nächsten bekannten Pfad probieren
    }
  }
  throw new Error('Kein Edge/Chrome gefunden. Optional BROWSER_BIN setzen.');
}

function statischerServer() {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      let pfad = decodeURIComponent(url.pathname);
      if (pfad.endsWith('/')) pfad += 'index.html';
      const datei = resolve(root, `.${pfad}`);
      if (datei !== root && !datei.startsWith(`${root}${sep}`)) throw new Error('Pfad außerhalb des Projekts');
      const inhalt = await readFile(datei);
      res.writeHead(200, {
        'content-type': mime[extname(datei).toLowerCase()] || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(inhalt);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Nicht gefunden');
    }
  });
}

async function cdpClient(webSocketUrl, browserFehler) {
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolvePromise, reject) => {
    socket.addEventListener('open', resolvePromise, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let id = 0;
  const offen = new Map();
  socket.addEventListener('message', (event) => {
    const nachricht = JSON.parse(String(event.data));
    if (nachricht.id) {
      const wartend = offen.get(nachricht.id);
      if (!wartend) return;
      offen.delete(nachricht.id);
      if (nachricht.error) wartend.reject(new Error(nachricht.error.message));
      else wartend.resolve(nachricht.result);
      return;
    }
    if (nachricht.method === 'Runtime.exceptionThrown') {
      const detail = nachricht.params.exceptionDetails;
      browserFehler.push(detail.exception?.description || detail.text || 'Unbekannte Browser-Ausnahme');
    }
    if (nachricht.method === 'Runtime.consoleAPICalled' && nachricht.params.type === 'error') {
      browserFehler.push(nachricht.params.args.map((arg) => arg.value || arg.description).join(' '));
    }
    if (nachricht.method === 'Log.entryAdded' && nachricht.params.entry.level === 'error') {
      const eintrag = nachricht.params.entry;
      browserFehler.push(`${eintrag.text}${eintrag.url ? ` @ ${eintrag.url}` : ''}`);
    }
  });

  function sende(method, params = {}) {
    const anfrageId = ++id;
    return new Promise((resolvePromise, reject) => {
      offen.set(anfrageId, { resolve: resolvePromise, reject });
      socket.send(JSON.stringify({ id: anfrageId, method, params }));
    });
  }

  await sende('Runtime.enable');
  await sende('Log.enable');
  await sende('Page.enable');

  async function auswerten(expression) {
    const antwort = await sende('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (antwort.exceptionDetails) {
      throw new Error(antwort.exceptionDetails.exception?.description || antwort.exceptionDetails.text);
    }
    return antwort.result.value;
  }

  return { socket, auswerten, sende };
}

async function main() {
  const browserPfad = await findeBrowser();
  const server = statischerServer();
  await new Promise((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise));
  const port = server.address().port;
  const profil = await mkdtemp(resolve(tmpdir(), 'betongold-browser-smoke-'));
  const zielUrl = `http://127.0.0.1:${port}/?browser-smoke=1`;
  const browser = spawn(browserPfad, [
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=0',
    `--user-data-dir=${profil}`,
    '--window-size=1280,900',
    zielUrl,
  ], { stdio: 'ignore' });

  let client;
  try {
    const portDatei = resolve(profil, 'DevToolsActivePort');
    let debugPort;
    for (let versuch = 0; versuch < 100; versuch++) {
      try {
        debugPort = Number((await readFile(portDatei, 'utf8')).split(/\r?\n/)[0]);
        if (debugPort) break;
      } catch {
        await warten(50);
      }
    }
    if (!debugPort) throw new Error('Browser-Debug-Port wurde nicht bereitgestellt.');

    let ziel;
    for (let versuch = 0; versuch < 100; versuch++) {
      const ziele = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((r) => r.json());
      ziel = ziele.find((eintrag) => eintrag.type === 'page' && eintrag.url.startsWith(zielUrl));
      if (ziel) break;
      await warten(50);
    }
    if (!ziel) throw new Error('Spiel-Tab wurde im Headless-Browser nicht gefunden.');

    const browserFehler = [];
    client = await cdpClient(ziel.webSocketDebuggerUrl, browserFehler);
    const { auswerten, sende } = client;

    async function bis(expression, label, timeout = 8000) {
      const ende = Date.now() + timeout;
      while (Date.now() < ende) {
        if (await auswerten(`Boolean(${expression})`)) return;
        await warten(50);
      }
      throw new Error(`Timeout: ${label}`);
    }

    async function screen(expected) {
      const stand = await auswerten(`(() => {
        const sichtbar = [...document.querySelectorAll('main')].filter((el) => !el.hidden);
        return {
          ids: sichtbar.map((el) => el.id),
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      })()`);
      if (stand.ids.length !== 1 || stand.ids[0] !== `screen-${expected}`) {
        throw new Error(`Screen-Invariante verletzt: erwartet ${expected}, sichtbar ${stand.ids.join(', ')}`);
      }
      if (stand.overflow) throw new Error(`Horizontaler Overflow auf Screen ${expected}`);
      console.log(`OK   genau ein Hauptscreen sichtbar: ${expected}`);
    }

    async function eventAufloesen() {
      const offen = await auswerten(`document.querySelector('#dlg-event')?.open || false`);
      if (!offen) return;
      await auswerten(`document.querySelector('#event-optionen button')?.click()`);
      await bis(`!document.querySelector('#event-folge').hidden`, 'Eventfolge sichtbar');
      await auswerten(`document.querySelector('#btn-event-weiter')?.click()`);
      await bis(`!document.querySelector('#dlg-event').open`, 'Event geschlossen');
    }

    await bis(`document.readyState === 'complete' && document.querySelector('#dlg-neu')?.open`, 'Startdialog');
    await bis(`[...document.querySelectorAll('#preset-optionen .preset-bild')]
      .every((bild) => bild.complete && bild.naturalWidth >= 600)`, 'Presetbilder');
    const presetVertrag = await auswerten(`(() => {
      const inputs = [...document.querySelectorAll('#preset-optionen input[name="startPreset"]')];
      const handwerker = inputs.find((input) => input.value === 'handwerker');
      handwerker.click();
      const handwerkerVorschau = document.querySelector('#start-vorschau').textContent;
      const schulden = inputs.find((input) => input.value === 'schuldenberg');
      schulden.click();
      const schuldenVorschau = document.querySelector('#start-vorschau').textContent;
      const karten = [...document.querySelectorAll('#preset-optionen .preset-option')];
      return {
        anzahl: inputs.length,
        werte: inputs.map((input) => input.value),
        bilder: [...document.querySelectorAll('#preset-optionen .preset-bild')]
          .filter((bild) => bild.complete && bild.naturalWidth >= 600).length,
        neutralerName: document.querySelector('#preset-optionen input[value="heute"]')
          .closest('label').textContent.includes('Familienstrategie mit Puffer'),
        schwierigkeit: document.querySelector('#form-neu input[name="schwierigkeit"]:checked')?.value,
        handwerker: handwerkerVorschau.includes('Handwerksbonus') && handwerkerVorschau.includes('Gesellenabschluss'),
        schulden: schuldenVorschau.includes('5 Mietobjekte') && schuldenVorschau.includes('93–97 % LTV'),
        lebensphasen: schuldenVorschau.includes('Ruhestand ab 67') && schuldenVorschau.includes('Lebensende 90–100'),
        startfelder: document.querySelectorAll('#start-anpassen input').length,
        startTrennung: document.querySelector('#start-anpassen').textContent.includes('Nur beim Spielstart') &&
          document.querySelector('#start-anpassen').textContent.includes('Auch später änderbar'),
        vertikalesLayout: karten.every((karte) => {
          const bild = karte.querySelector('.preset-bild').getBoundingClientRect();
          const text = karte.querySelector(':scope > span').getBoundingClientRect();
          return bild.width > 0 && bild.height > 0 && text.width > 0 && text.top >= bild.bottom - 1;
        }),
        dialogOhneQuerScroll: document.querySelector('#dlg-neu').scrollWidth <= document.querySelector('#dlg-neu').clientWidth + 1,
      };
    })()`);
    if (presetVertrag.anzahl !== 4 ||
        JSON.stringify(presetVertrag.werte) !== JSON.stringify(['heute', 'klassisch', 'schuldenberg', 'handwerker']) ||
        presetVertrag.bilder !== 4 || !presetVertrag.neutralerName ||
        presetVertrag.schwierigkeit !== 'normal' || !presetVertrag.handwerker || !presetVertrag.schulden ||
        !presetVertrag.lebensphasen || presetVertrag.startfelder !== 17 || !presetVertrag.startTrennung ||
        !presetVertrag.vertikalesLayout || !presetVertrag.dialogOhneQuerScroll) {
      throw new Error(`Startpreset-Vertrag verletzt: ${JSON.stringify(presetVertrag)}`);
    }
    console.log('OK   Startdialog: vier Presets und 17 getrennte Start-/Laufzeit-Annahmen verständlich sichtbar');
    await auswerten(`(() => {
      const form = document.querySelector('#form-neu');
      form.elements.seed.value = 'browser-schuldenberg';
      form.requestSubmit();
    })()`);
    await bis(`!document.querySelector('#dlg-neu').open`, 'Schuldenberg-Spielstart');
    await auswerten(`document.querySelector('#nav-objekte').click()`);
    await bis(`document.querySelector('#portfolio-liste').children.length === 5`, 'Schuldenberg-Portfolio');
    await screen('dashboard');
    const sonderstartVertrag = await auswerten(`(() => ({
      objekte: document.querySelector('#portfolio-liste').children.length,
      zusammenfassung: document.querySelector('#portfolio-summary').textContent,
      schulden: document.querySelector('#chart-schulden-puffer')?.getAttribute('aria-label') || '',
    }))()`);
    if (sonderstartVertrag.objekte !== 5 || !sonderstartVertrag.zusammenfassung.includes('5 Immobilien')) {
      throw new Error(`Schuldenberg-Startbestand fehlt im UI: ${JSON.stringify(sonderstartVertrag)}`);
    }
    console.log('OK   Schuldenberg startet im echten UI-Weg mit fünf Portfolioobjekten');
    await auswerten(`document.querySelector('#btn-neu').click()`);
    await bis(`document.querySelector('#dlg-neu')?.open`, 'Startdialog für Default-Reset');
    await auswerten(`(() => {
      const form = document.querySelector('#form-neu');
      form.querySelector('input[name="startPreset"][value="heute"]').click();
      form.elements.seed.value = 'browser-smoke';
      form.requestSubmit();
    })()`);
    await bis(`!document.querySelector('#dlg-neu').open && document.querySelector('#hud-cash').textContent !== '—'`, 'Spielstart');
    await screen('karte');

    await sende('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
    });
    const desktopHeader = await auswerten(`(() => ({
      zeitraum: document.querySelector('#hud-alter').textContent,
      abgeschnitten: [...document.querySelectorAll('.ressourcenleiste b')]
        .filter((wert) => wert.scrollWidth > wert.clientWidth + 1)
        .map((wert) => ({ id: wert.id, text: wert.textContent, client: wert.clientWidth, scroll: wert.scrollWidth })),
      ressourcenBreite: document.querySelector('.ressourcenleiste').getBoundingClientRect().width,
      ressourcenAnzahl: document.querySelector('.ressourcenleiste').children.length,
      nettoImHeader: !!document.querySelector('#hud-netto'),
      zeitBreite: document.querySelector('#speed-group').getBoundingClientRect().width,
      breite: innerWidth,
    }))()`);
    if (!desktopHeader.zeitraum.includes('Jahr 1/') || !desktopHeader.zeitraum.includes('Alter 40') || desktopHeader.abgeschnitten.length ||
        desktopHeader.ressourcenBreite < 420 || desktopHeader.ressourcenAnzahl !== 3 ||
        desktopHeader.nettoImHeader || desktopHeader.zeitBreite > 360) {
      throw new Error(`Desktop-Header 1440 px verletzt: ${JSON.stringify(desktopHeader)}`);
    }
    await sende('Emulation.clearDeviceMetricsOverride');
    console.log('OK   Desktop-Header 1440px: drei laufende Finanzwerte, Spieljahr und Alter vollständig; Zeitsteuerung kompakt');

    await auswerten(`document.querySelector('#nav-dashboard').click()`);
    await screen('dashboard');

    // Owner-Feedback-Verträge: zentrale Liquidität, kompakte KPI-Gruppen,
    // erklärte Steuer, Kindergeld, direkte Kinderkosten und hilfreiche Zusatzcharts.
    const dashboardVertrag = await auswerten(`(() => {
      const kinderZeile = [...document.querySelectorAll('#cashflow-viz .flow-zeile')]
        .find((zeile) => zeile.textContent.includes('direkte Kosten'));
      const kindergeldZeile = [...document.querySelectorAll('#cashflow-viz .flow-zeile')]
        .find((zeile) => zeile.textContent.includes('Kindergeld'));
      return {
        hudReihenfolge: [...document.querySelector('.ressourcenleiste').children]
          .map((element) => element.querySelector('b')?.id),
        cashflowSignal: document.querySelector('.resource-cashflow').classList.contains('positiv') ||
          document.querySelector('.resource-cashflow').classList.contains('negativ'),
        kpiGruppen: document.querySelectorAll('.kpi-gruppe').length,
        kpiPaare: document.querySelectorAll('.kpi-gruppe .kpi-paar').length,
        kpiIcons: document.querySelectorAll('.kpi-gruppe .metric-icon').length,
        kinderText: kinderZeile?.textContent.replace(/\\s+/g, ' ').trim(),
        kindergeldText: kindergeldZeile?.textContent.replace(/\\s+/g, ' ').trim(),
        steuerErklaert: document.querySelector('.steuer-regel').textContent.includes('Haushalts-Nettoeinkommen') &&
          document.querySelector('.steuer-regel').textContent.includes('Kreditzinsen'),
        steuerFormel: document.querySelector('#steuer-vorschau small').textContent.includes('AfA') &&
          document.querySelector('#steuer-vorschau small').textContent.includes('Ergebnis'),
        zusatzcharts: document.querySelectorAll('#chart-zusatz .mini-chart').length,
      };
    })()`);
    const erwartetesHud = ['hud-cash', 'hud-cashflow', 'hud-etf'];
    if (JSON.stringify(dashboardVertrag.hudReihenfolge) !== JSON.stringify(erwartetesHud) ||
        !dashboardVertrag.cashflowSignal || dashboardVertrag.kpiGruppen !== 3 ||
        dashboardVertrag.kpiPaare !== 3 || dashboardVertrag.kpiIcons !== 6 ||
        !dashboardVertrag.kinderText?.includes('direkte Kosten') ||
        !dashboardVertrag.kinderText?.includes('600') ||
        !dashboardVertrag.kindergeldText?.includes('520') || !dashboardVertrag.steuerErklaert ||
        !dashboardVertrag.steuerFormel || dashboardVertrag.zusatzcharts !== 2) {
      throw new Error(`Dashboard-Owner-Vertrag verletzt: ${JSON.stringify(dashboardVertrag)}`);
    }
    console.log('OK   Owner-Dashboard: Cashflow neben Tagesgeld, 520 € Kindergeld, 600 € Kinderkosten, Steuerformel und 2 Zusatzcharts');

    const globaleUi = await auswerten(`(() => {
      const cashflow = document.querySelector('#hud-cashflow-aktion');
      cashflow.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      const cashflowDetails = !document.querySelector('#cashflow-popover').hidden &&
        document.querySelector('#cashflow-popover').textContent.includes('Nettoeinkommen') &&
        document.querySelector('#cashflow-popover').textContent.includes('Vermietungssteuer');
      document.querySelector('#btn-menue').click();
      const menue = !document.querySelector('#spielmenue-popover').hidden &&
        [...document.querySelectorAll('#spielmenue-popover button b')].map((e) => e.textContent.trim()).join('|') ===
          'Spielhilfe|Einstellungen|Spielstände|Neues Spiel';
      document.querySelector('#btn-menue').click();
      document.querySelector('#btn-meldungen').click();
      const meldungen = !document.querySelector('#meldungen-panel').hidden &&
        document.querySelectorAll('#meldungen-liste li').length >= 1;
      document.querySelector('#btn-meldungen-schliessen').click();
      return { cashflowDetails, menue, meldungen };
    })()`);
    if (!globaleUi.cashflowDetails || !globaleUi.menue || !globaleUi.meldungen) {
      throw new Error(`Globale UI-Verträge verletzt: ${JSON.stringify(globaleUi)}`);
    }
    console.log('OK   Globale UI: Cashflow-Details, kompaktes Spielmenü und wiederaufrufbare Meldungen');

    const zeitVertrag = await auswerten(`(() => ({
      tempo: [...document.querySelectorAll('#speed-group [data-speed]')].map((b) => b.textContent.trim()),
      werte: [...document.querySelectorAll('#speed-group [data-speed]')].map((b) => Number(b.dataset.speed)),
      schritte: [document.querySelector('#btn-step-monat').textContent.trim(), document.querySelector('#btn-step-jahr').textContent.trim()],
      gruppen: document.querySelectorAll('#speed-group .speed-lauf[role="group"], #speed-group .speed-schritte[role="group"]').length,
      icons: document.querySelectorAll('#speed-group .speed-icon').length,
      emojiTurbo: document.querySelector('#speed-group').textContent.includes('⏩'),
      alleGedrueckt: [...document.querySelectorAll('#speed-group [data-speed]')].every((b) => b.hasAttribute('aria-pressed')),
    }))()`);
    if (JSON.stringify(zeitVertrag.tempo) !== JSON.stringify(['Pause', '0,5 M/s', '1 M/s', '3 M/s']) ||
        JSON.stringify(zeitVertrag.werte) !== JSON.stringify([0, 0.5, 1, 3]) ||
        JSON.stringify(zeitVertrag.schritte) !== JSON.stringify(['+1 Monat', '+1 Jahr']) ||
        zeitVertrag.gruppen !== 2 || zeitVertrag.icons !== 4 || zeitVertrag.emojiTurbo || !zeitVertrag.alleGedrueckt) {
      throw new Error(`Zeitsteuerungs-Vertrag verletzt: ${JSON.stringify(zeitVertrag)}`);
    }
    const zeitAktion = await auswerten(`(() => {
      const turbo = document.querySelector('[data-speed="3"]');
      const pause = document.querySelector('[data-speed="0"]');
      turbo.click();
      const turboAktiv = turbo.classList.contains('aktiv') && turbo.getAttribute('aria-pressed') === 'true';
      pause.click();
      return { turboAktiv, pauseAktiv: pause.classList.contains('aktiv') && pause.getAttribute('aria-pressed') === 'true' };
    })()`);
    if (!zeitAktion.turboAktiv || !zeitAktion.pauseAktiv) {
      throw new Error(`Zeitsteuerung schaltet nicht konsistent: ${JSON.stringify(zeitAktion)}`);
    }
    console.log('OK   Zeitsteuerung: einheitliche Segmente, monochrome SVGs, klare Tempo- und Schrittlabels');

    // Spielhilfe bleibt vollständig aufgeklappt; die optionale Bildschirm-Tour
    // bewegt nur die UI und verändert keinen Spielstand.
    await auswerten(`document.querySelector('#btn-hilfe').click()`);
    await bis(`document.querySelector('#dlg-hilfe').open`, 'Spielhilfe');
    const hilfeVertrag = await auswerten(`(() => ({
      details: document.querySelectorAll('#dlg-hilfe details').length,
      abschnitte: document.querySelectorAll('#dlg-hilfe .hilfe-abschnitt').length,
      schritte: document.querySelectorAll('#dlg-hilfe .tutorial-ablauf li').length,
      alleSichtbar: [...document.querySelectorAll('#dlg-hilfe .hilfe-abschnitt')]
        .every((element) => element.getBoundingClientRect().height > 0),
      lebensphasen: document.querySelector('#dlg-hilfe').textContent.includes('Einkommen sinkt ab 67') &&
        document.querySelector('#dlg-hilfe').textContent.includes('je Seed 90–100') &&
        document.querySelector('#dlg-hilfe').textContent.includes('Stress kann verkürzen'),
    }))()`);
    if (hilfeVertrag.details !== 0 || hilfeVertrag.abschnitte !== 6 ||
        hilfeVertrag.schritte !== 8 || !hilfeVertrag.alleSichtbar || !hilfeVertrag.lebensphasen) {
      throw new Error(`Hilfe-Vertrag verletzt: ${JSON.stringify(hilfeVertrag)}`);
    }
    await auswerten(`document.querySelector('#btn-tour-start').click()`);
    await bis(`!document.querySelector('#tutorial-tour').hidden && document.querySelector('#tile-cash').classList.contains('tutorial-fokus')`, 'Tutorial Schritt 1');
    await auswerten(`document.querySelector('#btn-tour-weiter').click()`);
    await bis(`document.querySelector('#tour-fortschritt').textContent.includes('2 von 8') && document.querySelector('#tile-cashflow').classList.contains('tutorial-fokus')`, 'Tutorial Schritt 2');
    await auswerten(`document.querySelector('#btn-tour-schliessen').click()`);
    await bis(`document.querySelector('#tutorial-tour').hidden && !document.querySelector('.tutorial-fokus')`, 'Tutorial geschlossen');
    console.log('OK   Spielhilfe ohne Toggles: 6 offene Kapitel, 8 Schritte und funktionale Bildschirm-Tour');

    await auswerten(`document.querySelector('#btn-admin').click()`);
    await bis(`document.querySelector('#dlg-admin').open && document.querySelectorAll('.admin-feld').length > 0`, 'Admin-Panel');
    const adminVertrag = await auswerten(`(() => ({
      tooltips: document.querySelectorAll('#dlg-admin .info-tooltip').length,
      hilfen: document.querySelectorAll('#dlg-admin .admin-feld small').length,
      sichtbar: [...document.querySelectorAll('#dlg-admin .admin-feld small')].every((e) => e.textContent.trim().length > 0),
      lebensfelder: [...document.querySelectorAll('#dlg-admin .admin-feld > span:first-child')]
        .map((e) => e.textContent.trim())
        .filter((text) => ['Rentenalter', 'Renten-Netto', 'Lebensende frühestens', 'Lebensende spätestens', 'Stress-Einfluss'].includes(text)).length,
      gruppentext: [...document.querySelectorAll('#dlg-admin .admin-gruppe > p')]
        .some((e) => e.textContent.includes('variables Lebensende')),
    }))()`);
    if (adminVertrag.tooltips !== 0 || adminVertrag.hilfen < 1 || !adminVertrag.sichtbar ||
        adminVertrag.lebensfelder !== 5 || !adminVertrag.gruppentext) {
      throw new Error(`Admin-Hilfe nicht konsolidiert: ${JSON.stringify(adminVertrag)}`);
    }
    await auswerten(`document.querySelector('#dlg-admin [data-schliessen]').click()`);
    console.log('OK   Admin-Panel: Ruhestand und variables Lebensende mit fünf erklärten Stellschrauben sichtbar');

    // Mehr Liquidität schafft einen stabilen Kaufpfad und prüft zugleich die
    // echte ETF→Tagesgeld-Umschichtung.
    await auswerten(`document.querySelector('#hud-etf-aktion').click()`);
    await bis(`!document.querySelector('#screen-finanzen').hidden`, 'Finanz-Screen');
    await screen('finanzen');
    const finanzVertrag = await auswerten(`(() => ({
      konten: document.querySelectorAll('.konto-karte').length,
      immobilien: !!document.querySelector('#fin-konto-immo') &&
        document.querySelector('#fin-konto-immo').textContent.includes('Marktwert') &&
        document.querySelector('#fin-konto-immo').textContent.includes('Restschuld'),
      transferKonten: document.querySelectorAll('.transfer-konto').length,
      transferFormulare: document.querySelectorAll('#form-etf-transfer').length,
      transferSkala: (() => {
        const regler = document.querySelector('#fin-transfer');
        return [regler.min, regler.max, regler.step].join('/');
      })(),
      mixSegmente: document.querySelectorAll('.finanz-mix-balken i').length,
      sparplanEingebettet: !!document.querySelector('#form-sparplan')?.closest('.finanz-aktionen'),
      hauptspalten: getComputedStyle(document.querySelector('#screen-finanzen')).gridTemplateColumns.split(' ').length,
      aktien: document.querySelectorAll('.aktien-karte').length,
      sparplan: !!document.querySelector('#form-sparplan'),
      bewegungen: !!document.querySelector('#finanz-bewegungen'),
      altesModal: !!document.querySelector('#dlg-etf'),
      pausiert: document.querySelector('[data-speed="0"]').classList.contains('aktiv'),
    }))()`);
    if (finanzVertrag.konten !== 3 || !finanzVertrag.immobilien || finanzVertrag.transferKonten !== 2 ||
        finanzVertrag.transferFormulare !== 1 || finanzVertrag.transferSkala !== '-20000/20000/500' ||
        finanzVertrag.mixSegmente !== 3 || !finanzVertrag.sparplanEingebettet || finanzVertrag.hauptspalten !== 2 ||
        finanzVertrag.aktien !== 0 || !finanzVertrag.sparplan ||
        !finanzVertrag.bewegungen || finanzVertrag.altesModal || !finanzVertrag.pausiert) {
      throw new Error(`Finanz-Screen-Vertrag verletzt: ${JSON.stringify(finanzVertrag)}`);
    }
    const fontVertrag = await auswerten(`document.fonts.ready.then(() => ({
      alegreya: document.fonts.check('16px "Alegreya Sans"'),
      cormorant: document.fonts.check('700 20px "Cormorant Garamond"'),
      body: getComputedStyle(document.body).fontFamily,
      titel: getComputedStyle(document.querySelector('#finanzen-titel')).fontFamily,
    }))`);
    if (!fontVertrag.alegreya || !fontVertrag.cormorant || !fontVertrag.body.includes('Alegreya Sans') ||
        !fontVertrag.titel.includes('Cormorant Garamond')) {
      throw new Error(`Lokale Handoff-Schriften fehlen: ${JSON.stringify(fontVertrag)}`);
    }
    const stickyFinanzen = await auswerten(`(() => {
      const screen = document.querySelector('#screen-finanzen');
      const header = screen.querySelector('.screen-heading');
      screen.scrollTop = 260;
      const stand = {
        hintergrund: getComputedStyle(header).backgroundColor,
        oben: header.getBoundingClientRect().top,
        screenOben: screen.getBoundingClientRect().top,
      };
      screen.scrollTop = 0;
      return stand;
    })()`);
    if (stickyFinanzen.hintergrund.startsWith('rgba') || stickyFinanzen.oben < stickyFinanzen.screenOben - 2) {
      throw new Error(`Sticky-Finanzheader bleibt transparent oder verrutscht: ${JSON.stringify(stickyFinanzen)}`);
    }
    const finanzVor = await auswerten(`(() => {
      const euro = (id) => Number(document.querySelector(id).textContent.replace(/[^0-9-]/g, ''));
      return { cash: euro('#fin-cash-wert'), etf: euro('#fin-etf-wert'), liquide: euro('#fin-liquid-gesamt') };
    })()`);
    await auswerten(`(() => {
      const input = document.querySelector('#fin-transfer');
      input.value = 1000;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      if (!document.querySelector('#fin-transfer-etf-delta').textContent.includes('+1.000') ||
          !document.querySelector('#fin-transfer-submit').textContent.includes('im ETF anlegen')) {
        throw new Error('Anlagevorschau des Transfer-Sliders fehlt.');
      }
      document.querySelector('#form-etf-transfer').requestSubmit();
    })()`);
    await bis(`document.querySelector('#finanz-bewegungen').textContent.includes('vom Tagesgeld ins ETF-Depot')`, 'Tagesgeld zu ETF');
    const finanzNach = await auswerten(`(() => {
      const euro = (id) => Number(document.querySelector(id).textContent.replace(/[^0-9-]/g, ''));
      return { cash: euro('#fin-cash-wert'), etf: euro('#fin-etf-wert'), liquide: euro('#fin-liquid-gesamt') };
    })()`);
    if (finanzNach.cash !== finanzVor.cash - 1000 || finanzNach.etf !== finanzVor.etf + 1000 ||
        finanzNach.liquide !== finanzVor.liquide) {
      throw new Error(`Tagesgeld zu ETF nicht vermoegensneutral: ${JSON.stringify({ finanzVor, finanzNach })}`);
    }
    await auswerten(`(() => {
      const slider = document.querySelector('#fin-sparplan');
      slider.value = 65;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('#form-sparplan').requestSubmit();
    })()`);
    await bis(`document.querySelector('#fin-sparplan-prozent').textContent.includes('65') && document.querySelector('#finanz-bewegungen').textContent.includes('65 %')`, 'ETF-Sparplan');
    await auswerten(`(() => {
      const slider = document.querySelector('#fin-sparplan');
      slider.value = 50;
      document.querySelector('#form-sparplan').requestSubmit();
      const transfer = document.querySelector('#fin-transfer');
      for (const betrag of [-20000, -20000, -20000, -20000, -11000]) {
        transfer.value = betrag;
        transfer.dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('#form-etf-transfer').requestSubmit();
      }
    })()`);
    await bis(`document.querySelector('#fin-etf-wert').textContent.replace(/[^0-9-]/g, '') === '0'`, 'ETF zu Tagesgeld');
    console.log('OK   Finanzen: Tagesgeld, Immobilien und ETF; beide ETF-Umschichtungen und Kontohistorie');

    await auswerten(`document.querySelector('#nav-marktplatz').click()`);
    await bis(`document.querySelectorAll('.markt-karte').length > 0`, 'Marktkarten');
    await screen('marktplatz');
    const marktLayout = await auswerten(`(() => {
      const screen = document.querySelector('#screen-marktplatz');
      const header = screen.querySelector('.screen-heading');
      const filter = document.querySelector('#markt-filter');
      const vergleich = document.querySelector('#btn-vergleich');
      const erste = document.querySelector('.markt-karte');
      const filterRect = filter.getBoundingClientRect();
      const vergleichRect = vergleich.getBoundingClientRect();
      const initial = {
        abstand: erste.getBoundingClientRect().top - filterRect.bottom,
        vergleichImFilter: vergleichRect.left >= filterRect.left - 1 && vergleichRect.right <= filterRect.right + 1,
      };
      screen.scrollTop = 360;
      const sticky = {
        headerBg: getComputedStyle(header).backgroundColor,
        filterBg: getComputedStyle(filter).backgroundColor,
      };
      screen.scrollTop = 0;
      return { ...initial, ...sticky };
    })()`);
    if (marktLayout.abstand < 2 || !marktLayout.vergleichImFilter ||
        marktLayout.headerBg.startsWith('rgba') || marktLayout.filterBg.startsWith('rgba')) {
      throw new Error(`Markt-Header/Filter überlagern Inhalt: ${JSON.stringify(marktLayout)}`);
    }

    let finanzierungOffen = false;
    for (let versuch = 0; versuch < 8 && !finanzierungOffen; versuch++) {
      await auswerten(`(() => {
        const sortierung = document.querySelector('#markt-filter [name="sortierung"]');
        sortierung.value = 'preisAuf';
        sortierung.dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('.markt-karte').click();
      })()`);
      await bis(`!document.querySelector('#screen-expose').hidden`, 'Exposé');
      await screen('expose');
      await auswerten(`(() => {
        const input = document.querySelector('#gebot-input');
        input.value = Math.ceil(Number(input.value) * 1.12 / 1000) * 1000;
        document.querySelector('#btn-gebot').click();
      })()`);
      await warten(100);
      finanzierungOffen = await auswerten(`document.querySelector('#dlg-finanzierung').open`);
      if (finanzierungOffen) break;

      await auswerten(`document.querySelector('#btn-expose-zurueck').click()`);
      await auswerten(`document.querySelector('#btn-step-monat').click()`);
      await eventAufloesen();
      await auswerten(`document.querySelector('#nav-marktplatz').click()`);
      await bis(`document.querySelectorAll('.markt-karte').length > 0`, 'Markt nach abgelehntem Gebot');
    }
    if (!finanzierungOffen) throw new Error('Kein Gebot wurde in acht reproduzierbaren Versuchen angenommen.');
    console.log('OK   Exposé und angenommenes Gebot');

    const finanzierungsErklaerung = await auswerten(`(() => {
      const euro = (text) => {
        const negativ = /[-−]/.test(text);
        const ziffern = Number(text.replace(/\\./g, '').replace(/[^0-9]/g, '')) || 0;
        return negativ ? -ziffern : ziffern;
      };
      const radio = document.querySelector('#fin-option-eigenheim input');
      const label = document.querySelector('#fin-option-eigenheim');
      const info = document.querySelector('#fin-eigenheim-info');
      const hinweis = document.querySelector('#fin-nutzung-hinweis');
      const haushalt = document.querySelector('.fin-haushalt-wirkung');
      const steuerZeilen = [...document.querySelectorAll('.fin-cashflow-zeile')]
        .filter((zeile) => /Steuerrückstellung|Steuerwirkung im aktuellen Modell/.test(zeile.textContent));
      return {
        eigenheimGesperrt: radio.disabled,
        sperreErklaert: !radio.disabled || (
          label.classList.contains('gesperrt') && label.title === hinweis.textContent &&
          !info.hidden && info.dataset.tooltip === hinweis.textContent &&
          radio.getAttribute('aria-describedby') === 'fin-nutzung-hinweis' &&
          hinweis.classList.contains('gesperrt') && hinweis.textContent.trim().length > 20
        ),
        schritte: document.querySelectorAll('[data-fin-step]').length,
        szenarien: document.querySelectorAll('.fin-szenario').length,
        objektSummen: document.querySelectorAll('.fin-cashflow-summe.haupt').length,
        aktuell: euro(haushalt?.querySelector('b')?.textContent || ''),
        hud: euro(document.querySelector('#hud-cashflow').textContent),
        steuerZeilen: steuerZeilen.length,
        steuerErklaert: steuerZeilen.every((zeile) => zeile.textContent.includes('geschätzt') || zeile.textContent.includes('0 €')),
        gruppen: [...document.querySelectorAll('#fin-rechnung .fin-gruppe')].map((zeile) => zeile.textContent.trim()),
      };
    })()`);
    if (!finanzierungsErklaerung.sperreErklaert) {
      throw new Error(`Gesperrte Eigenheimwahl bleibt unerklärt: ${JSON.stringify(finanzierungsErklaerung)}`);
    }
    if (finanzierungsErklaerung.schritte !== 3 || finanzierungsErklaerung.szenarien < 1 ||
        finanzierungsErklaerung.objektSummen !== finanzierungsErklaerung.szenarien ||
        finanzierungsErklaerung.aktuell !== finanzierungsErklaerung.hud ||
        finanzierungsErklaerung.steuerZeilen !== 1 || !finanzierungsErklaerung.steuerErklaert ||
        JSON.stringify(finanzierungsErklaerung.gruppen) !== JSON.stringify(['Kauf', 'Kredit'])) {
      throw new Error(`Finanzierungs-Cashflow nicht vollständig erklärt: ${JSON.stringify(finanzierungsErklaerung)}`);
    }
    console.log(`OK   Finanzierung erklärt Eigenheim-Sperre (${finanzierungsErklaerung.eigenheimGesperrt ? 'gesperrt' : 'verfügbar'}), Objektszenario, Steuer und Haushaltswirkung`);

    await auswerten(`document.querySelector('#btn-fin-weiter').click()`);
    await auswerten(`document.querySelector('[data-ek-prozent="30"]').click()`);
    const ekShortcut = await auswerten(`(() => ({
      wert: document.querySelector('#fin-ek-quote').textContent.trim(),
      aktiv: document.querySelector('[data-ek-prozent="30"]').classList.contains('aktiv'),
      label: document.querySelector('[data-ek-prozent="30"]').textContent.trim(),
    }))()`);
    if (!ekShortcut.aktiv || !ekShortcut.wert.includes('€') || !ekShortcut.label.includes('Nebenkosten + 30')) {
      throw new Error(`NK+30-Shortcut inkonsistent: ${JSON.stringify(ekShortcut)}`);
    }
    const kaufMoeglich = await auswerten(`!document.querySelector('#btn-kaufen').disabled`);
    if (!kaufMoeglich) {
      await auswerten(`(() => {
        const input = document.querySelector('#form-finanzierung').elements.eigenkapital;
        input.value = input.max;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
    }
    if (!(await auswerten(`!document.querySelector('#btn-kaufen').disabled`))) {
      throw new Error('Smoke-Test-Objekt bleibt trotz maximalem Eigenkapital nicht finanzierbar.');
    }
    await auswerten(`document.querySelector('#btn-fin-weiter').click()`);
    await bis(`!document.querySelector('[data-fin-step-panel="3"]').hidden && !document.querySelector('#btn-kaufen').hidden`, 'Finanzierung Schritt 3');
    await auswerten(`document.querySelector('#btn-kaufen').click()`);
    await bis(`document.querySelector('#dlg-kauf').open`, 'Kaufabschluss');
    await screen('dashboard');
    const vermoegenKachel = await auswerten(`document.querySelector('#tile-vermoegen .wert').textContent.trim()`);
    const chartLabel = await auswerten(`document.querySelector('#chart').getAttribute('aria-label')`);
    if (!chartLabel.includes(vermoegenKachel)) {
      throw new Error(`Chart zeigt nach Kauf nicht das aktuelle Nettovermögen (${vermoegenKachel}): ${chartLabel}`);
    }
    const labelSchrift = await auswerten(`(() => {
      const vorhanden = document.querySelector('#chart .endlabel-name');
      const probe = vorhanden || document.createElementNS('http://www.w3.org/2000/svg', 'text');
      if (!vorhanden) {
        probe.classList.add('endlabel-name');
        document.querySelector('#chart').append(probe);
      }
      const groesse = parseFloat(getComputedStyle(probe).fontSize);
      if (!vorhanden) probe.remove();
      return groesse;
    })()`);
    if (labelSchrift < 14) throw new Error(`Chart-Direktlabel bleibt zu klein: ${labelSchrift}px`);
    console.log('OK   Chart folgt dem Nettovermögen unmittelbar nach dem Kauf');
    console.log(`OK   Chart-Direktlabel ist mit ${labelSchrift}px gut lesbar`);
    console.log('OK   Finanzierung und Kaufabschluss');

    await auswerten(`document.querySelector('#dlg-kauf-ok').click()`);
    await bis(`!document.querySelector('#screen-objekt').hidden`, 'Objektdetail');
    await screen('objekt');
    await auswerten(`document.querySelector('#nav-dashboard').click()`);
    await screen('dashboard');
    const portfolioAnzahl = await auswerten(`document.querySelector('#portfolio-liste').children.length`);
    if (portfolioAnzahl < 1) throw new Error('Gekauftes Objekt fehlt im Portfolio.');
    console.log(`OK   Portfolio zeigt ${portfolioAnzahl} Objekt(e)`);

    // Stadtbühne: vier visuell getrennte Segmente, Status nicht nur über Farbe
    // und native Buttons für Marker/Liste als gleichwertige Wege.
    await auswerten(`document.querySelector('#nav-karte').click()`);
    await bis(`document.querySelectorAll('#karten-staedte [data-stadt]').length === 4 && document.querySelector('.karten-marker')`, 'Stadtbühne');
    await screen('karte');
    const stadtKulisse = await auswerten(`(() => {
      const steuerungUnten = Math.max(
        document.querySelector('#karten-staedte').getBoundingClientRect().bottom,
        document.querySelector('.karten-filter').getBoundingClientRect().bottom,
      );
      return {
        buehneAbstand: document.querySelector('.stadtkarte').getBoundingClientRect().top - steuerungUnten,
        globalEbene: getComputedStyle(document.querySelector('.game-backdrop')).zIndex,
        globalFilter: getComputedStyle(document.querySelector('.game-backdrop')).filter,
        buehneFilter: getComputedStyle(document.querySelector('.stadt-buehne-bg')).filter,
        bild: getComputedStyle(document.querySelector('.stadt-buehne-bg')).backgroundImage,
        markerAnzahl: document.querySelectorAll('.karten-marker').length,
        kommendDeaktiviert: [...document.querySelectorAll('.karten-marker.is-kommend')].every((marker) => marker.disabled),
      };
    })()`);
    if (stadtKulisse.buehneAbstand < 4 || stadtKulisse.globalEbene !== '0' ||
        stadtKulisse.markerAnzahl < 4 || !stadtKulisse.kommendDeaktiviert ||
        !stadtKulisse.globalFilter.includes('brightness(0.86)') ||
        !stadtKulisse.buehneFilter.includes('brightness(0.84)') || !stadtKulisse.bild.includes('assets/ui/city-')) {
      throw new Error(`Stadtbild bleibt zu dunkel oder von Steuerungen überlagert: ${JSON.stringify(stadtKulisse)}`);
    }
    const filterKontrast = await auswerten(`(() => {
      const button = document.querySelector('[data-kartenfilter="favoriten"]');
      button.click();
      const stil = getComputedStyle(button);
      const stand = {
        text: button.textContent.trim(),
        aktiv: button.classList.contains('aktiv'),
        gedrueckt: button.getAttribute('aria-pressed'),
        farbe: stil.color,
        hintergrund: stil.backgroundColor,
        hintergrundBild: stil.backgroundImage,
        petrol: stil.getPropertyValue('--petrol').trim(),
        sichtbarkeit: stil.visibility,
        opacity: stil.opacity,
      };
      document.querySelector('[data-kartenfilter="alle"]').click();
      return stand;
    })()`);
    if (filterKontrast.text !== 'Favoriten' || !filterKontrast.aktiv ||
        filterKontrast.gedrueckt !== 'true' || filterKontrast.farbe === filterKontrast.hintergrund ||
        (filterKontrast.hintergrund === 'rgba(0, 0, 0, 0)' && filterKontrast.hintergrundBild === 'none') ||
        filterKontrast.sichtbarkeit !== 'visible' || filterKontrast.opacity === '0') {
      throw new Error(`Aktiver Kartenfilter nicht lesbar: ${JSON.stringify(filterKontrast)}`);
    }
    console.log('OK   Aktiver Kartenfilter bleibt mit Goldsignal und lesbarem Text sichtbar');
    const kartenStand = await auswerten(`(() => {
      const ids = new Set();
      const staedte = [];
      for (const id of ['berlin-innenstadt', 'berlin-rand', 'leipzig', 'meissen-umland']) {
        const button = document.querySelector('#karten-staedte [data-stadt="' + id + '"]');
        button.click();
        const marker = [...document.querySelectorAll('.karten-marker')];
        marker.forEach((e) => ids.add(e.dataset.karteId));
        staedte.push({
          id: button.dataset.stadt,
          marker: marker.length,
          liste: document.querySelectorAll('.karten-listenpunkt').length,
          hintergrund: document.querySelector('.stadt-buehne-bg')?.style.getPropertyValue('--stadtbild') || '',
          alleBilderEcht: marker.every((e) => e.querySelector('img')?.getAttribute('src')?.startsWith('assets/expose/')),
        });
      }
      document.querySelector('#karten-staedte [data-stadt="berlin-innenstadt"]').click();
      return {
        tabs: document.querySelectorAll('#karten-staedte [data-stadt][aria-pressed]').length,
        ids: ids.size,
        staedte,
        nativeButtons: [...document.querySelectorAll('.karten-marker, .karten-listenpunkt')].every((element) => element.tagName === 'BUTTON'),
        statusText: [...document.querySelectorAll('.karten-listenpunkt small')].every((e) => e.textContent.trim().length > 0),
      };
    })()`);
    if (kartenStand.tabs !== 4 || kartenStand.ids < 1 ||
        kartenStand.staedte.some((s) => s.liste !== s.marker || !s.hintergrund.includes('assets/ui/city-') || !s.alleBilderEcht) ||
        !kartenStand.nativeButtons || !kartenStand.statusText) {
      throw new Error(`Kartenvertrag verletzt: ${JSON.stringify(kartenStand)}`);
    }
    await auswerten(`document.querySelector('#karten-staedte [data-stadt="leipzig"]').click()`);
    await auswerten(`document.querySelector('#nav-finanzen').click()`);
    await screen('finanzen');
    const globaleKulisse = await auswerten(`(() => ({
      gespeichert: localStorage.getItem('betongold-letzte-stadt'),
      hintergrund: getComputedStyle(document.querySelector('.game-backdrop')).backgroundImage,
      bodyKlasse: document.body.dataset.stadt,
    }))()`);
    if (globaleKulisse.gespeichert !== 'leipzig' ||
        !globaleKulisse.hintergrund.includes('city-leipzig-v1.webp') ||
        globaleKulisse.bodyKlasse !== 'stadt-leipzig') {
      throw new Error(`Globale Stadtkulisse nicht übernommen: ${JSON.stringify(globaleKulisse)}`);
    }
    await sende('Page.reload', { ignoreCache: true });
    await bis(`document.readyState === 'complete' &&
      getComputedStyle(document.querySelector('.game-backdrop')).backgroundImage.includes('city-leipzig-v1.webp') &&
      document.querySelectorAll('#karten-staedte [data-stadt]').length === 4`, 'gespeicherte Stadtkulisse nach Reload');
    await auswerten(`document.querySelector('#nav-karte').click()`);
    await bis(`document.querySelector('.karten-marker')`, 'Stadtmarker nach Reload');
    await screen('karte');
    console.log('OK   Leipzig bleibt auf anderen Screens und nach Reload die globale App-Kulisse');
    await auswerten(`(() => {
      const marker = document.querySelector('.karten-marker');
      marker.focus();
      marker.click();
    })()`);
    await bis(`document.querySelector('#screen-expose:not([hidden]), #screen-objekt:not([hidden])')`, 'Stadtmarker geöffnet');
    console.log('OK   Stadtbühne: 4 Segmente, echte Listingbilder, sichtbare Status und native Button-Routen');

    // Reproduzierbare Responsive-/A11y-Gates. Ein echter Screenreader- und
    // physischer Gerätecheck bleibt ein manueller Release-Schritt.
    for (const [breite, hoehe] of [[1024, 768], [700, 900], [390, 844]]) {
      await sende('Emulation.setDeviceMetricsOverride', {
        width: breite, height: hoehe, deviceScaleFactor: 1, mobile: breite <= 700,
      });
      await auswerten(`document.querySelector('#nav-finanzen').click()`);
      await screen('finanzen');
      const finanzResponsive = await auswerten(`(() => {
        const sichtbar = (e) => {
          const r = e.getBoundingClientRect();
          const s = getComputedStyle(e);
          return !e.hidden && s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
        };
        return {
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          unbeschriftet: [...document.querySelectorAll('#screen-finanzen input')].filter((i) => sichtbar(i) &&
            !(i.getAttribute('aria-label') || i.closest('label') || document.querySelector('label[for="' + i.id + '"]'))).length,
        };
      })()`);
      if (finanzResponsive.overflow || finanzResponsive.unbeschriftet) {
        throw new Error(`Finanzen responsive ${breite}px: ${JSON.stringify(finanzResponsive)}`);
      }
      await auswerten(`document.querySelector('#nav-dashboard').click()`);
      await screen('dashboard');
      const dashboardResponsive = await auswerten(`(() => {
        const chart = document.querySelector('.chart-karte');
        const speed = document.querySelector('.speed-group');
        const speedRect = speed.getBoundingClientRect();
        const alleZeitaktionenSichtbar = [...speed.querySelectorAll('button')].every((button) => {
          const r = button.getBoundingClientRect();
          return r.width >= 28 && r.height >= 28 && r.left >= speedRect.left - 1 && r.right <= speedRect.right + 1;
        });
        return {
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          chartEnthaelt: chart.scrollWidth <= chart.clientWidth + 1,
          zeitaktionenSichtbar: ${breite} !== 390 || alleZeitaktionenSichtbar,
        };
      })()`);
      if (dashboardResponsive.overflow || !dashboardResponsive.chartEnthaelt || !dashboardResponsive.zeitaktionenSichtbar) {
        throw new Error(`Dashboard responsive ${breite}px: ${JSON.stringify(dashboardResponsive)}`);
      }
      await auswerten(`document.querySelector('#nav-karte').click()`);
      await screen('karte');
      const gate = await auswerten(`(() => {
        const sichtbar = (e) => {
          const r = e.getBoundingClientRect();
          const s = getComputedStyle(e);
          return !e.hidden && s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
        };
        const namenlos = [...document.querySelectorAll('button')].filter((b) => sichtbar(b) && !(b.getAttribute('aria-label') || b.textContent.trim())).length;
        const unbeschriftet = [...document.querySelectorAll('input,select,textarea')].filter((i) => sichtbar(i) &&
          !(i.getAttribute('aria-label') || i.closest('label') || document.querySelector('label[for="' + i.id + '"]'))).length;
        const bilderOhneAlt = [...document.querySelectorAll('img')].filter((i) => sichtbar(i) && !i.hasAttribute('alt')).length;
        const kleineNav = [...document.querySelectorAll('.screens-nav button')].filter((b) => {
          const r = b.getBoundingClientRect(); return r.height < 28 || r.width < 28;
        }).length;
        const fokus = document.querySelector('.karten-listenpunkt');
        fokus?.focus();
        return {
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          namenlos, unbeschriftet, bilderOhneAlt, kleineNav,
          fokusSichtbar: fokus ? getComputedStyle(fokus).outlineStyle !== 'none' || fokus.classList.contains('is-focus') : false,
        };
      })()`);
      if (gate.overflow || gate.namenlos || gate.unbeschriftet || gate.bilderOhneAlt || gate.kleineNav || !gate.fokusSichtbar) {
        throw new Error(`Responsive/A11y ${breite}px: ${JSON.stringify(gate)}`);
      }
      console.log(`OK   Responsive/A11y ${breite}px: Dashboard, Finanzen und Karte ohne Seiten-Overflow; Namen/Labels/Alt/Fokus vorhanden`);
    }
    await sende('Emulation.clearDeviceMetricsOverride');

    // Lebensphasen auch im echten Renderpfad: Ruhestands-HUD und private
    // Endbilanz werden mit einem isolierten deterministischen Teststate gezeigt.
    const lebensphasenUi = await auswerten(`(async () => {
      const { newGame } = await import('/js/state.js?v=36');
      const { initialisiereMarkt } = await import('/js/market.js?v=36');
      const { advanceMonths } = await import('/js/engine.js?v=36');
      const { resolveEvent } = await import('/js/events.js?v=36');
      const { updateHud } = await import('/js/ui/shell.js?v=36');
      const { zeigeEnde } = await import('/js/ui/endgame.js?v=36');
      const rente = newGame({ seedText: 'browser-rente' });
      rente.monat = (rente.config.zeit.rentenAlter - rente.config.zeit.startAlter) * 12;
      updateHud(rente, 0);
      const hud = document.querySelector('#hud-alter').textContent;
      const ende = newGame({ seedText: 'browser-lebensende' });
      initialisiereMarkt(ende);
      advanceMonths(ende, 10000, (state) => resolveEvent(state, 0));
      zeigeEnde(ende);
      return {
        beendet: ende.beendet,
        alter: ende.lebensende.verstorbenAlter,
        hud,
        screen: !document.querySelector('#screen-endgame').hidden,
        hero: document.querySelector('#endgame-zusammenfassung').textContent,
        details: document.querySelector('#endgame-details').textContent,
        score: document.querySelector('#endgame-scores').textContent,
      };
    })()`);
    if (!lebensphasenUi.beendet || lebensphasenUi.alter < 90 || lebensphasenUi.alter > 100 ||
        !lebensphasenUi.hud.includes('Ruhestand') || !lebensphasenUi.screen ||
        !lebensphasenUi.hero.includes('Lebensbilanz') ||
        !lebensphasenUi.details.includes('Jahre im Ruhestand') ||
        !lebensphasenUi.details.includes('Langzeit-Stress') ||
        !lebensphasenUi.score.includes('Vermögen am Lebensende')) {
      throw new Error(`Lebensphasen-UI verletzt: ${JSON.stringify(lebensphasenUi)}`);
    }
    console.log('OK   Lebensphasen: Ruhestands-HUD und Endbilanz zwischen 90–100 im echten Renderpfad');

    if (browserFehler.length) throw new Error(`Browserfehler: ${browserFehler.join(' | ')}`);
    console.log('\nBROWSER-SMOKE OK');
  } finally {
    client?.socket.close();
    browser.kill();
    await Promise.race([
      new Promise((resolvePromise) => browser.once('exit', resolvePromise)),
      warten(3000),
    ]);
    await new Promise((resolvePromise) => server.close(resolvePromise));
    for (let versuch = 0; versuch < 20; versuch++) {
      try {
        await rm(profil, { recursive: true, force: true, maxRetries: 2, retryDelay: 100 });
        break;
      } catch (fehler) {
        if (versuch === 19) throw fehler;
        await warten(100);
      }
    }
  }
}

await main();
