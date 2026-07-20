// Dauerhafte Abschlussprüfung der im Owner-Chat festgelegten Produktverträge.
// Der Test prüft bewusst Querschnittsanforderungen, die sonst über mehrere
// Fachtests und Dokumente verteilt wären.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_CONFIG, SAVE_VERSION, START_PRESETS, UI_VERSION } from '../js/config.js?v=41';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lies = (datei) => fs.readFileSync(path.join(root, datei), 'utf8');
const html = lies('index.html');
const css = lies('css/style.css');
const shell = lies('js/ui/shell.js');
const karte = lies('js/ui/karte.js');
const objektUi = lies('js/ui/objekt.js');
const finanzierungUi = lies('js/ui/finanzierung.js');
const finanzenUi = lies('js/ui/finanzen.js');
const tenants = lies('js/tenants.js');
const ratgeber = lies('js/ratgeber.js');
const state = lies('js/state.js');
const gameplay = lies('js/gameplay.js');
const turnaround = lies('js/turnaround.js');
const turnaroundUi = lies('js/ui/turnaround.js');
const goals = lies('js/goals.js');
const life = lies('js/life.js');
const arcs = lies('js/arcs.js');
const strategyUi = lies('js/ui/strategy.js');
const renovation = lies('js/renovation.js');
const expose = lies('js/ui/expose.js');
const market = lies('js/market.js');
const roadmap = lies('ROADMAP.md');
const ideen = lies('IDEEN.md');
const plan = lies('PLAN.md');
const architektur = lies('ARCHITECTURE.md');
const readme = lies('README.md');
const handover = lies('HANDOVER.md');
const listings = JSON.parse(lies('data/listings.json'));

let anzahl = 0;
function vertrag(name, pruefung) {
  pruefung();
  anzahl += 1;
  console.log(`OK   ${name}`);
}

vertrag('Versionen und Wegwerf-Saves', () => {
  assert.equal(SAVE_VERSION, 19);
  assert.equal(UI_VERSION, 41);
  assert.match(state, /Versionskonflikt|Version/);
  assert.doesNotMatch(state, /(?:export\s+)?function\s+migrier/i);
  assert.match(state, /statt Migrationscode mitzuschleppen/);
  assert.match(architektur, /es gibt keinen Migrationspfad/);
});

vertrag('Handlungskette belohnt Prüfung, Beobachten und guten Weggang', () => {
  assert.match(state, /dealEntscheidungen/);
  assert.match(state, /entscheidungsHistorie/);
  assert.match(gameplay, /Anlass/);
  assert.match(gameplay, /restunsicherheit/);
  assert.match(gameplay, /Guter Weggang/);
  assert.match(gameplay, /kein Kapital gebunden/i);
  assert.match(market, /angebotBeobachten/);
  assert.match(market, /angebotVerwerfen/);
  assert.match(expose, /<progress/);
  assert.match(expose, /<meter/);
  assert.match(expose, /Bewusst weggehen/);
});

vertrag('Vier getrennte Startlagen mit neutralem Familiennamen', () => {
  assert.deepEqual(Object.keys(START_PRESETS), ['heute', 'klassisch', 'schuldenberg', 'handwerker']);
  assert.equal(START_PRESETS.heute.label, 'Familienstrategie mit Puffer');
  assert.equal(START_PRESETS.heute.startAlter, 40);
  assert.equal(START_PRESETS.heute.cash, 90000);
  assert.equal(START_PRESETS.heute.etf, 90000);
  assert.equal(START_PRESETS.heute.haushalt.nettoEinkommenPerson1, 4300);
  assert.equal(START_PRESETS.heute.haushalt.nettoEinkommenPerson2, 4000);
  assert.equal(START_PRESETS.heute.haushalt.nettoEinkommen, 8300);
  assert.equal(START_PRESETS.heute.haushalt.sparplanEtfAnteil, 0.5);
  assert.deepEqual(START_PRESETS.heute.kinder, [{ alter: 3.5 }, { alter: 0.6 }]);
  assert.equal(START_PRESETS.heute.haushalt.ausgabenGesamtStart, 6210);
  assert.equal(START_PRESETS.heute.haushalt.ausgabenOhneReisenStart, 4260);
  assert.equal(DEFAULT_CONFIG.haushalt.kindergeldProKind, 260);
  assert.equal(DEFAULT_CONFIG.haushalt.kindergeldBisAlter, 27);
  assert.equal(START_PRESETS.heute.haushalt.autoAbMonat, 5);
  assert.equal(START_PRESETS.heute.haushalt.autoKostenMonat, 600);
  assert.equal(DEFAULT_CONFIG.haushalt.lebenshaltungAltersFaktoren[2].faktor, 0.8);
  assert.equal(DEFAULT_CONFIG.haushalt.reisenAltersFaktoren[3].faktor, 0.55);
  assert.equal(START_PRESETS.klassisch.startAlter, 30);
  assert.equal(START_PRESETS.klassisch.haushalt.nettoEinkommen, 3200);
  assert.equal(START_PRESETS.klassisch.haushalt.sparplanEtfAnteil, 0.25);
  assert.equal(START_PRESETS.schuldenberg.startbestand.length, 5);
  assert.ok(START_PRESETS.handwerker.beruf.handwerklich);
  assert.equal(START_PRESETS.handwerker.haushalt.einkommensSpruenge[0].abMonat, 36);
});

vertrag('Vier echte Presetbilder und Normal als Standardschwierigkeit', () => {
  for (const preset of Object.values(START_PRESETS)) {
    const datei = path.join(root, preset.bild);
    assert.ok(fs.existsSync(datei), `${preset.bild} fehlt`);
    assert.ok(fs.statSync(datei).size > 20000, `${preset.bild} ist kein belastbares Bildasset`);
  }
  assert.match(shell, /id === 'normal' \? 'checked'/);
  assert.match(state, /schwierigkeit = 'normal'/);
  for (const name of ['startAlter', 'kind1Alter', 'kind2Alter', 'cash', 'etf', 'netto1', 'netto2',
    'miete', 'mieteKalt', 'lebenOhneReisen', 'reisen', 'autoAbMonat', 'autoKostenMonat']) {
    assert.match(html, new RegExp(`name="${name}"`));
  }
  assert.match(shell, /startAnpassung/);
  assert.match(css, /\.preset-option\s*\{[\s\S]*?display:\s*grid/);
});

vertrag('Plausible Familienkosten und transparente Lebensphasen', () => {
  assert.equal(DEFAULT_CONFIG.haushalt.kinderKosten[0].kosten, 300);
  assert.equal(DEFAULT_CONFIG.zeit.rentenAlter, 67);
  assert.equal(DEFAULT_CONFIG.zeit.lebensendeMinAlter, 90);
  assert.equal(DEFAULT_CONFIG.zeit.lebensendeMaxAlter, 100);
  assert.ok(DEFAULT_CONFIG.zeit.stressMalusMaxJahre > 0);
  assert.match(shell, /Lebensende.*lebensendeMinAlter.*lebensendeMaxAlter/s);
});

vertrag('Bewusst langsame und vollständig erreichbare Zeitsteuerung', () => {
  const speeds = [...html.matchAll(/data-speed="([0-9.]+)"/g)].map((m) => Number(m[1]));
  assert.deepEqual(speeds, [0, 0.5, 1, 3]);
  assert.match(html, /Einen Monat weiter/);
  assert.match(html, /Ein Jahr weiter/);
  assert.match(css, /@media \(max-width: 480px\)[\s\S]*?#btn-step-monat::after/);
});

vertrag('Header priorisiert Tagesgeld, Cashflow und ETF statt Nettovermögen', () => {
  assert.match(html, /id="hud-cash-aktion"/);
  assert.match(html, /id="hud-cashflow-aktion"/);
  assert.match(html, /id="hud-etf-aktion"/);
  assert.doesNotMatch(html, /id="hud-(?:netto|vermoegen)/);
});

vertrag('Cashflow-Details, Benachrichtigungen und kompaktes Spielmenü', () => {
  for (const id of ['cashflow-popover', 'meldungen-panel', 'btn-meldungen', 'btn-menue', 'spielmenue-popover']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(shell, /renderCashflowDetails/);
  // Das Meldungsarchiv hat genau eine Quelle: die gespeicherte Spielhistorie
  // state.log (begrenzt und mit Spielmonat), nicht die flüchtigen Toasts.
  assert.match(shell, /log\.slice\(-40\)/);
  assert.match(shell, /<time datetime=/);
  assert.doesNotMatch(shell, /meldungen\.unshift/);
  assert.match(shell, /dauer = 5200/);
  assert.match(html, /<b>Einstellungen<\/b>/);
});

vertrag('Spielhilfe ist kurz, offen und besitzt Tour plus acht Schritte', () => {
  const hilfe = html.slice(html.indexOf('<dialog id="dlg-hilfe"'), html.indexOf('<aside id="tutorial-tour"'));
  assert.doesNotMatch(hilfe, /<details|<summary/);
  assert.equal((hilfe.match(/<li>/g) || []).length, 28);
  assert.equal((hilfe.match(/<ol class="tutorial-ablauf">[\s\S]*?<\/ol>/)?.[0].match(/<li>/g) || []).length, 8);
  assert.match(hilfe, /Bildschirm-Tour starten/);
});

vertrag('Mara-Ratgeber bleibt auf Leicht und Normal begrenzt', () => {
  assert.match(ratgeber, /Tipp von Mara/);
  assert.match(ratgeber, /schwer/);
  assert.match(ratgeber, /leicht|normal/);
});

vertrag('Finanzbereich fokussiert Tagesgeld, Immobilien und ETF', () => {
  for (const id of ['fin-konto-cash', 'fin-konto-immo', 'fin-konto-etf']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.doesNotMatch(html, /id="fin-konto-aktien"|data-aktien-order|aktien-karte/);
  assert.match(html, /id="fin-transfer"[^>]*type="range"[^>]*min="-20000"[^>]*max="20000"[^>]*step="500"/);
  assert.match(html, /id="form-etf-transfer"/);
  assert.doesNotMatch(html, /id="form-etf-(?:kauf|verkauf)"/);
  // Eyebrow und H1 teilen sich die Arbeit, statt denselben Text zu doppeln.
  assert.match(html, /<span class="eyebrow">Konten &amp; Depot<\/span><h1 id="finanzen-titel"[^>]*>.*?Finanzen<\/h1>/);
  assert.doesNotMatch(html, /Finanzen — Konten/);
  for (const id of ['fin-mix-cash', 'fin-mix-etf', 'fin-mix-immo']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /class="finanz-aktionen[\s\S]*class="sparplan-karte"/);
  assert.match(css, /\.finanzen\s*\{\s*grid-template-columns:minmax\(0,1fr\) minmax\(280px,340px\)/);
  assert.match(finanzenUi, /betrag > 0[\s\S]*ctx\.etfKaufen\(betrag\)[\s\S]*betrag < 0[\s\S]*ctx\.etfVerkaufen\(Math\.abs\(betrag\)\)/);
  assert.match(finanzenUi, /voraussichtlich.*Steuer.*netto aufs Tagesgeld/);
  assert.match(finanzenUi, /fin-immo-ek/);
});

vertrag('Handoff-Typografie ist lokal und offline verfügbar', () => {
  for (const datei of [
    'alegreya-sans-400-latin.woff2', 'alegreya-sans-500-latin.woff2',
    'alegreya-sans-700-latin.woff2', 'alegreya-sans-800-latin.woff2',
    'cormorant-garamond-600-700-latin.woff2',
    'OFL-Alegreya-Sans.txt', 'OFL-Cormorant-Garamond.txt',
  ]) assert.ok(fs.existsSync(path.join(root, 'assets/fonts', datei)), `${datei} fehlt`);
  assert.match(css, /@font-face[\s\S]*?"Alegreya Sans"[\s\S]*?font-display:\s*swap/);
  assert.match(css, /@font-face[\s\S]*?"Cormorant Garamond"[\s\S]*?font-display:\s*swap/);
  assert.doesNotMatch(css, /font-family:\s*Georgia/);
});

vertrag('Kapitalertragsteuer berücksichtigt Personen, Pauschbetrag und ETF-Teilfreistellung', () => {
  assert.equal(DEFAULT_CONFIG.kapitalsteuer.pauschbetragProPerson, 1000);
  assert.equal(DEFAULT_CONFIG.kapitalsteuer.personen, 2);
  assert.equal(DEFAULT_CONFIG.kapitalsteuer.etfTeilfreistellung, 0.3);
  assert.match(html, /Konservative Vergleichsgröße ohne Pauschbetrag/);
});

vertrag('Finanzierung trennt Objekt-, Steuer- und Haushaltswirkung', () => {
  assert.match(finanzierungUi, /fin-nutzung-hinweis/);
  assert.match(finanzierungUi, /Bis zur Vermietung/);
  assert.match(finanzierungUi, /Nach geplanter Vermietung/);
  assert.match(finanzierungUi, /Steuerwirkung im aktuellen Modell/);
  assert.match(finanzierungUi, /Haushaltsüberschuss heute/);
  assert.match(finanzierungUi, /WEG-Kosten aufteilen/);
});

vertrag('Vier eigenständige Stadtsegmente und vollständiger 40er-Katalog', () => {
  for (const id of ['berlin-innenstadt', 'berlin-rand', 'leipzig', 'meissen-umland']) {
    assert.match(karte, new RegExp(`['"]?${id}['"]?\\s*:`));
  }
  for (const bild of ['city-berlin-innenstadt-v1.webp', 'city-berlin-aussenstadt-v1.webp', 'city-leipzig-v1.webp', 'city-meissen-umland-v1.webp']) {
    assert.match(karte, new RegExp(bild.replace('.', '\\.')));
  }
  assert.equal(listings.length, 40);
  assert.equal(listings.filter((l) => l.segment.startsWith('berlin-')).length, 20);
  assert.equal(listings.filter((l) => l.segment === 'leipzig').length, 10);
  assert.equal(listings.filter((l) => l.segment === 'meissen-umland').length, 10);
  assert.match(karte, /function ergaenzeBuehne[\s\S]*4 - aktiv\.length/);
  assert.match(karte, /status === 'kommend'[\s\S]*disabled aria-disabled="true"/);
  const aktuell = [html, karte, plan, roadmap, handover, ...listings.map(JSON.stringify)].join('\n');
  assert.doesNotMatch(aktuell, /Rostock/i);
});

vertrag('Die zuletzt gewählte Stadt bleibt die globale App-Kulisse', () => {
  assert.match(html, /class="game-backdrop"/);
  assert.match(karte, /betongold-letzte-stadt/);
  assert.match(karte, /localStorage\.getItem\(STADT_SPEICHER\)/);
  assert.match(karte, /localStorage\.setItem\(STADT_SPEICHER, id\)/);
  assert.match(karte, /--app-stadtbild/);
  assert.match(css, /var\(--app-stadtbild,\s*url\("\.\.\/assets\/ui\/city-berlin-innenstadt-v1\.webp"\)\)/);
  assert.match(css, /\.game-backdrop\s*\{[\s\S]*?brightness\(\.86\)/);
  assert.match(css, /\.game-backdrop\s*\{\s*inset:\s*-4%;\s*z-index:\s*0;/);
  assert.match(css, /\.stadt-buehne-bg\s*\{[^}]*brightness\(\.84\)/);
});

vertrag('Aktiver Favoritenfilter bleibt sichtbar', () => {
  assert.match(css, /\.karten-filter button\.aktiv\s*\{[^}]*color:\s*#21190b;[^}]*background:\s*linear-gradient\([^}]*#c69a3f/s);
  assert.match(karte, /setAttribute\('aria-pressed'/);
});

vertrag('Alle Objektdaten werden über erklärende Faktenlabels ausgegeben', () => {
  assert.ok((objektUi.match(/faktenLabel\(/g) || []).length >= 10);
  assert.match(objektUi, /faktenLabel\('Rücklage'/);
  assert.match(objektUi, /faktenLabel\('Restschuld'/);
  assert.doesNotMatch(objektUi, /👤/u);
  assert.match(objektUi, /#icon-family/);
});

vertrag('Drei Vermietungswege bilden Ertrag, Aufwand und regionales Rechtsrisiko ab', () => {
  const modelle = DEFAULT_CONFIG.mieter.vermietungsmodelle;
  assert.deepEqual(Object.keys(modelle), ['regulaer', 'moebliert', 'wohnenAufZeit']);
  assert.ok(modelle.wohnenAufZeit.aufschlag > modelle.moebliert.aufschlag);
  assert.ok(modelle.wohnenAufZeit.zeitProMonat > modelle.moebliert.zeitProMonat);
  assert.ok(modelle.wohnenAufZeit.rechtsrisiko.berlin > modelle.wohnenAufZeit.rechtsrisiko.leipzig);
  assert.match(tenants, /vermietungsmodell/);
});

vertrag('Negativer Objekt-Cashflow wird erklärt und mitigierbar gemacht', () => {
  assert.match(objektUi, /Monatliche Lücke/);
  assert.match(objektUi, /Mehr Eigenkapital oder ein niedrigerer Kaufpreis senken die Rate/);
  assert.match(html, /Rate plus Eigentümerkosten können die Miete übersteigen/);
  assert.match(finanzierungUi, /finanzierungsCashflowPfade/);
  assert.match(finanzierungUi, /Tragfähiger Pfad/);
  assert.match(finanzierungUi, /Auch stabilisiert untragfähig/);
  assert.match(finanzierungUi, /<output class="fin-pfad-urteil/);
});

vertrag('Schuldenberg besitzt einen begrenzten und kostenpflichtigen Turnaround', () => {
  assert.equal(DEFAULT_CONFIG.turnaround.preset, 'schuldenberg');
  assert.equal(DEFAULT_CONFIG.turnaround.bankFensterMonate, 12);
  assert.equal(DEFAULT_CONFIG.turnaround.bankMaxAnpassungen, 3);
  assert.equal(DEFAULT_CONFIG.turnaround.zwischenzielVerbesserungMonat, 600);
  assert.match(turnaround, /portfolioTriage/);
  assert.match(turnaround, /stabilisierungsLinien/);
  assert.match(turnaround, /restschuldMehr/);
  assert.match(turnaround, /state\.monat >= cfg\.bankFensterMonate/);
  assert.match(turnaroundUi, /Gebühr heute/);
  assert.match(turnaroundUi, /Mehr Restschuld bis Zinsbindung/);
  assert.match(html, /id="turnaround-board"/);
  assert.match(html, /id="dlg-bank"/);
});

vertrag('G/H verbindet Ziele, Folgen, Arbeit, Lebensphasen und Eigenleistung', () => {
  assert.deepEqual(Object.keys(DEFAULT_CONFIG.entwicklung.zielOptionen), ['erstesStabilesObjekt', 'eigenheim', 'bestandStabilisieren']);
  assert.equal(DEFAULT_CONFIG.entwicklung.arbeitsmodellBindungMonate, 12);
  assert.equal(DEFAULT_CONFIG.entwicklung.lebensphaseVorlaufMonate, 12);
  assert.equal(DEFAULT_CONFIG.renovierung.eigenleistung.ersparnisMax, 6000);
  assert.match(goals, /ohne Belohnungs- oder Queststate/);
  assert.match(goals, /objektCashflow/);
  assert.match(life, /setzeArbeitsmodell/);
  assert.match(life, /naechsteLebensphase/);
  assert.match(arcs, /faelligMonat/);
  assert.match(arcs, /folgeEventId/);
  assert.match(renovation, /eigenleistung.*risikoFaktor/s);
  assert.match(strategyUi, /Wechsel ohne Kosten/);
  assert.match(strategyUi, /Alle Beträge sind editierbare Spielannahmen/);
  assert.match(html, /id="strategie-board"/);
  assert.match(html, /id="lebensplan-board"/);
});

vertrag('Eigenbedarf ist ein zeitlicher Prozess mit möglicher Abfindung', () => {
  assert.match(tenants, /starteEigenbedarf/);
  assert.match(tenants, /zahleEigenbedarfAbfindung/);
  assert.match(tenants, /Widerspruch gegen Eigenbedarf/);
  assert.match(objektUi, /eigener Einzug/);
  assert.match(objektUi, /erwachsenes Kind/);
});

vertrag('Spielstände erklären lokalen Browser-Speicher und Hostingwahl', () => {
  assert.match(html, /Automatisch in diesem Browser, auf diesem Gerät/);
  assert.match(html, /kein Benutzerkonto und keine Cloud-Synchronisierung/i);
  assert.match(readme, /GitHub Pages/);
  assert.match(readme, /Vercel/);
  assert.match(readme, /nicht in GitHub, Vercel oder einer Cloud/);
});

vertrag('Doppelklick-Start ist vorhanden und bleibt HTTP-basiert', () => {
  assert.ok(fs.existsSync(path.join(root, 'BETONGOLD_STARTEN.cmd')));
  assert.ok(fs.existsSync(path.join(root, 'tools/start-game.mjs')));
  assert.match(readme, /BETONGOLD_STARTEN\.cmd/);
  assert.match(readme, /127\.0\.0\.1/);
});

vertrag('Langfristige Ideen bleiben vertagt; Katalog und Finalassets sind abgeschlossen', () => {
  assert.match(ideen, /Leere Innenansichten für unmöblierte Wohnungen/);
  assert.match(ideen, /Mit wachsender Systemtiefe langsamer und ursächlicher spielen/);
  assert.match(ideen, /Karriere-\/Gehaltsentscheidungen mit Zeit-Trade-off/);
  assert.match(ideen, /Ferienwohnung an der Ostsee/);
  assert.match(roadmap, /inflation = 2 % p\.a\./);
  assert.equal(listings.length, 40);
  assert.ok(listings.every((listing) => listing.assetStatus === undefined));
  for (const listing of listings) {
    assert.ok(fs.existsSync(path.join(root, 'assets', 'expose', `${listing.id}.webp`)));
    assert.ok(fs.existsSync(path.join(root, 'assets', 'cutaway', `${listing.id}_unsaniert.webp`)));
    assert.ok(fs.existsSync(path.join(root, 'assets', 'cutaway', `${listing.id}_saniert.webp`)));
  }
});

vertrag('Aktuelle Unterlagen enthalten weder Marina noch private Presetbenennung', () => {
  const aktuell = [plan, roadmap, handover, readme, architektur, html, shell].join('\n');
  assert.doesNotMatch(aktuell, /Marina/);
  assert.doesNotMatch(aktuell, /Unsere Lage heute/);
});

console.log(`CHAT-CONTRACTS OK — ${anzahl} querschnittliche Owner-Verträge`);
