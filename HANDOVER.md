# HANDOVER.md — aktueller Projektstand

**Stand:** 08.10.2026 (Save v22 / UI v60 — Preisniveau, faire Endauswertung)

**Versionen:** SAVE_VERSION = 22, UI_VERSION = 60

Das Spiel ist öffentlich gehostet: <https://johakunath.github.io/betongold-tycoon/>
(GitHub Pages aus `main`/Wurzel, Deployment = `git push`).

## Save v22 — Preisniveau und faire Endauswertung (P1 aus dem Gameplay-Review)

**Warum.** Der Review fand zwei strukturelle Probleme: (1) Marktmieten,
Hausgeld, Instandhaltung, Renovierungs-, Mängel- und Eventbeträge waren 55
Jahre lang nominal eingefroren, während Haushalt, ETF und Kaufpreise wuchsen
(Bruttorendite bi-01: 3,75 % → 1,23 % nach 30 Jahren). (2) Der Cashflow-Score
zählte nur Mietobjekte; „Nur Miete/ETF" bekam dort immer 0 und lag im Schnitt
9 Punkte hinter Kaufstrategien, obwohl Nichtkaufen laut PLAN valide ist.

**Was.**
1. `js/preisniveau.js` + `state.preisniveau` + `config.preisniveau.inflation`
   (2 %, Admin „Inflation"). Tick: nach `monat++` (kein RNG). Indexiert sind
   alle in `ECONOMY_MODEL.md` §1a gelisteten Beträge; Haushalt, ETF,
   Segmentpreise und Kredite nicht (eigene nominale Raten). Event-Texte rechnen
   „ca. 12.000 €" für die Anzeige in laufende Euro um.
2. Endscores in heutigen Euro: `nettovermoegenZiel` 5 Mio. heutige Euro (statt
   15 Mio. nominal), `cashflowZiel` 2.000 heutige Euro, neu
   `endgame.entnahmeRate` 3,5 % aus Tagesgeld + ETF netto.
3. Fünfte Vergleichslinie „Ohne Käufe" und Zerlegung des ETF-Abstands in
   „eure Entscheidungen" und „Sparplan-Aufteilung Tagesgeld/ETF".
4. Umschalter „nominal / heutige €" in Zentrale-Chart und Endauswertung
   (`localStorage`-Vorliebe `betongold.euroModus`, nur UI).
5. Kleinfix: „19,3 Mon." im Familienpanel bricht nicht mehr um.
6. Review-Fixes (Codex auf PR #2): Bewerber-Einkommen laufen mit dem
   Preisniveau (Einkommensquote sonst nach 55 Jahren ~89 %), das Renovierungs-
   Mietplus nutzt die indexierte Vergleichsmiete, und alle Vergleichsläufe
   spielen den Sparplan-Anteil aus `historie[m].sparplanEtfAnteil` nach.

**Messung (Normal, 120 Seeds, vorher → nachher).** Score „Nur Miete/ETF"
64,5 → 84,5; „Invest 25 %" 73,6 → 85,4; „2 Investments, dann Heim"
75,1 → 88,0. Vermögen der Kaufstrategien +1–4 % (Harness erhöht keine
Mieten; mit Mietprüfung mehr). Alle 13 Balance-Gates, Familienmarkt und
5 Regressionen bei 300 Seeds grün.

**Owner-Delegation umgesetzt (08.10.2026, alle sechs offenen Punkte).**
1. Mietrecht: Berlin 15 % Kappung; Mietspiegel-Anker je Segment;
   Mietpreisbremse in Berlin/Leipzig (`tenants.mietpreisbremse`,
   `config.mietpreisbremse`), Erhöhungen bis Mietspiegel
   (`erhoehungsObergrenze`); neue Stufe „Umfassende Modernisierung" und ein
   entsprechender Finanzierungspfad. Gefundener Altfehler: Portfolio-Objekte
   trugen kein Baujahr/Stil, Neubauten zählten als Bestand
   (`market.stammdaten` + Felder in `kaufeObjekt`).
2. Familie: kein Dauerbonus/keine Kinder-Event-Dämpfung für Eigentum; neues
   Event `eigenbedarf-vermieter` (`nurMieter`, Effekt `haushaltsMiete`).
3. Entnahmeregel (`etf.wendeEntnahmeregelAn`, Finanzen-Formular,
   Ruhestands-Hinweis).
4. Score „Rentenlücke gedeckt" über `state.ruhestandsCheck` (`passiv.js`).
5. Vermögensscore mit 85 gegen 40 Start-Jahresnettos.
6. Vergleichsläufe starten bei `state.startConfig` und spielen
   Einstellungsänderungen (`state.adminVerlauf`) nach; sonst hätte ein
   Event-geänderter Config-Wert (Familienmiete) schon ab Monat 0 gewirkt.

Typische Gesamtscores (40 Seeds): Familie 81–84, Klassisch 74–83,
Azubi 77–90, Schuldenberg 62–76; Rentenlücken-Score P10 55–84.
Testanpassungen mit Begründung: B0 ≥ 5 statt ≥ 6 tragfähige Wohnungen,
F-Turnaround ≥ 1 statt ≥ 4 Mietprüfungen (Mietspiegel deckelt), fünf
Renovierungsstufen, Kappungs-Check auf 15 %/15 %/20 %.

**Mietpreisbremse bewusst ignorieren (Owner-Auftrag, 08.10.2026).**
Checkbox `bremse-ignorieren` in `ui/bewerber.js` → `starteVermietung(...,
{ bremseIgnorieren })` → `objekt.bremseVerstoss` in `waehleBewerber`.
`tenants.pruefeBremseVerstoss` läuft im Mieter-Tick vor der Zahlungsziehung
und zieht nur bei bestehendem Verstoß eine Zufallszahl; reguläre Spiele und
alle Balance-Gates sind davon unberührt. `bremseVerstossRisiko` liefert die
Monatsrisiken für die Statusbox in `ui/objekt.js`, `senkeAufZulaessigeMiete`
den legalen Ausstieg. Finanzierung zeigt `rechtsbruch` getrennt
(`finanzierungsCashflowPfade`). Formeln, Quellen und Grenzen: §15b.

## UI v60 — Bugfixes aus dem Gameplay-Review

Alles am Seed `review-1` (Familienstrategie, Normal) beobachtet und behoben.

1. **Events respektieren den Haushalt.** Neue `bedingung`-Felder
   `kindAlterMin/-Max`, `autoVorhanden`, `vorRuhestand` (`js/events.js`,
   `CONTENT_SCHEMA.md`). `kategorie:"kind"` braucht immer ein Kind im Haushalt.
   Vorher: „Der alte Kombi" in Monat 4 ohne Auto, Auslands-Klassenfahrt mit
   Kindern von 4,5/1,6 Jahren, Kinder-Events auch für kinderlose Presets.
   Zuordnung: Zahnspange 9–15, Klassenfahrt 12–18, Auszeit ≤ 12 und vor Rente,
   Jobangebot vor Rente. Die Filter wirken nach dem festen Event-Roll; die
   RNG-Position bleibt, nur die Kandidatenliste ändert sich (gezogene Events je
   Seed können sich deshalb ändern; alle Balance-Gates grün).
2. **Auto-Event ohne Doppelzählung.** Die 600-€-Pauschale bündelt laut
   `ECONOMY_MODEL.md` §2b Anschaffung und laufende Kosten. Das Event ist jetzt
   ein vorzeitiger Motorschaden: reparieren 3.500 € oder vorzeitig ersetzen
   7.000 € Mehrkosten (+1 Familie) statt 12.000/4.000 € Neukauf.
3. **Kindergeld bis zum 25. Geburtstag** (§ 32 Abs. 4 EStG) statt 27. Die
   direkten Kinderkosten laufen weiter bis `auszugsAlter = 27`.
4. **Finanzierungsdialog.** Startwert Eigenkapital lässt mindestens
   `kredit.vorschlagRestpufferMonate` (3) Monatsausgaben auf dem Tagesgeld
   (vorher: bei Nebenkosten + 20 % > Tagesgeld alles, „Restpuffer 0 €"). Die
   ETF-Vorschau meldet bei 0 € nicht mehr „Betrag liegt über dem verfügbaren
   ETF-Wert"; das ETF-Panel überlappt den Button „Ins Tagesgeld" nicht mehr.
   Die Quote im Dialog heißt „Finanzierungsquote zum Kaufpreis" und erklärt,
   warum die Zentrale (Restschuld ÷ Marktwert) danach höher sein kann.
5. **Marktplatz → Exposé.** „Prüfen & entscheiden" fokussierte das
   Gebotsfeld und sprang am Bild und an der Prüfung vorbei nach unten. Erst
   nach 3/3 Prüfungen heißt der Button „Gebot vorbereiten" und springt zum Gebot.
6. **Kleinigkeiten.** Toast liegt bis 1023 px über der Bottom-Navigation statt
   auf ihr (neues Smoke-Gate); „Puffer 18,5 M." → „Mon."; Endbilanz zeigt
   „über 10 Jahre" statt „955,2 Monate"; Objektkarte ohne doppelte
   Cashflow-Zeile bei laufender Vermietung; „0 Risikohinweise" heißt
   „0 bezifferte Risiken", weil nur Mängel/Sonderumlagen gezählt werden.
7. **Doku-Drift.** `PLAN.md` nennt jetzt die Konfigurationswerte (4.860 €
   Ausgaben, 3.960 € Sparrate, 300 € Kinder, 115/100/80 % Startvermögen).

Bewusst nicht geändert: Der Stadt-„Anlass" bleibt der globale Monatszug
(auch wenn er ein anderes Segment betrifft); Familienavatar und le-07-Cutaway
brauchen neue Bildassets (Roadmap J).

## UI v59 — Kopfzeilen-Breakpoint-Lücke bei ~1200 px

Owner-Screenshot vom echten Tablet (1200 CSS-px): Datum lag auf der
Cashflow-Kachel, Hamburger-Menü ragte rechts über den Viewport hinaus.

**Ursache.** `css/app-shell.css` stapelte den Kopf bis `max-width: 1180px`
(`--topbar-h: 128px`); `css/warm-theme.css` priorisierte die Finanzwerte erst ab
`min-width: 1201px`. Im **1181–1200-px-Band griff keine der beiden Regeln** —
der einreihige Basiskopf mit fünf Grid-Spalten (`brand resources date speed
menu`) musste dort in eine zu schmale Breite. Am echten Chromium gemessen:
Menü ragte bis zu 25 px über den rechten Rand hinaus.

**Fix.** Beide Grenzen auf das Paar `1200.98px`/`1201px` gezogen — die
projekteigene Regel gegen Breakpoint-Löcher (`DESIGN_SYSTEM.md` §6) galt bisher
nur für `700px`/`701px`. Betroffen: `app-shell.css` (`max-width: 1180px` →
`1200.98px`), `annotation-fixes.css` (`min-width: 1180px` → `1201px`,
Zentrale-Zweispaltenlayout), `warm-theme.css` (`max-width: 1200px` →
`1200.98px`, Finanzwerte-Priorisierung).

**Neues Gate.** `test/browser-smoke.mjs` prüft jetzt zusätzlich bei 1200 px,
ob `.hud`, `.ressourcenleiste`, `.speed-group` und `.menue` sich paarweise
überlappen oder aus dem Viewport laufen. Gegengeprüft: mit der alten Grenze
schlägt es an (`"kopfAusVieport":true`).

## UI v58 — Kopfüberlappungen, HUD-Kacheln, Umbenennung

Auslöser waren zwei Owner-Screenshots vom echten Telefon. Alles reines UI/Text;
kein State, keine Ökonomie, keine RNG- oder Tickreihenfolge berührt.

1. **Stadtbühne, ≤ 700.98 px.** Im Markup steht `.karten-filter` **vor**
   `.karten-staedte` (`index.html:281–287`). Der Mobilblock gab der Filterzeile
   trotzdem `position: sticky; top: 58px` — sticky schiebt ein Element nach
   unten, wenn seine natürliche Position über der Schwelle liegt, also schon bei
   `scrollTop: 0` um 58 px, mitten auf die Stadtleiste. `z-index: 13` gegen `12`
   ließ die Filterlabels obendrauf malen. Die 58 px unterstellten außerdem eine
   einzeilige Filterzeile; ab ≤ 480 px war sie zweizeilig (85 px). Jetzt:
   Stadtleiste sticky mit `z-index: 14`, Filterzeile `position: static`,
   `flex-wrap: nowrap`, Legacy-Margins neutralisiert.
2. **Stadtbühne, 921–1180 px.** Beide Leisten liegen dort absolut im selben
   Kopfband. `.karten-staedte` ist mittig und reservierte `calc(100% - 360px)`
   ⇒ 180 px Gasse je Seite; `.karten-filter` sitzt `right: 8px` mit bis zu
   320 px Breite ⇒ ~328 px Bedarf. Entzerrt wurde das nur im
   `@media (max-width: 920px)`. Die Entzerrung steht jetzt im 1180-px-Block und
   gilt damit lückenlos; der 920-px-Block enthält nur noch, was wirklich erst
   dort gilt.
3. **HUD-Kacheln.** `display: flex; flex-direction: row` für
   `.ressourcenleiste > button` und `.resource-finanzgruppe > button` steht
   jetzt in der Basis statt nur im 1201-px-Block. Preis davon: Unter 420 px
   kostet das Icon ~25 px neben dem Label — dort entfallen die HUD-Symbole
   (`.ressourcenleiste .hud-icon { display: none }`), sonst wurde „Tagesgeld"
   abgeschnitten (74 px Bedarf in 56 px).
4. **„Cashflow" statt „Haushaltsüberschuss"** an allen sichtbaren Stellen.
   IDs und Klassen hießen längst so. `ECONOMY_MODEL.md` behält bewusst
   „Haushalts-Cashflow", weil dort direkt daneben der Objekt-Cashflow steht.
5. **„Jahr 1/60" entfernt.** Eine Stelle (`js/ui/shell.js`); der Import von
   `gesamtMonate` wurde dort mit entfernt. `#hud-alter` bleibt bestehen.

**Neue Gates.** `test/browser-smoke.mjs` misst im Karte-Gate jetzt selbst, ob
`.karten-filter` und `.karten-staedte` sich schneiden und ob ein Text in der
`.ressourcenleiste` abgeschnitten ist. Die Viewportschleife läuft zusätzlich bei
**1100 px** — genau das Band, in dem der Desktopfehler unentdeckt blieb. Beide
Gates sind gegengeprüft: Mit der alten CSS-Regel schlagen sie an.

**Hinweis zur Testumgebung (Container).** Chromium verweigert als root den
Start ohne `--no-sandbox`; `browser-smoke.mjs` setzt den Flag bewusst nicht.
Hier lief der Test deshalb als Nicht-Root mit explizitem Node 22:
`su ubuntu -s /bin/bash -c "BROWSER_BIN=… HOME=/tmp/ubhome TMPDIR=/tmp/ubtmp
/opt/node22/bin/node test/browser-smoke.mjs"`. Auf einem normalen Arbeitsplatz
ist nichts davon nötig.

## UI v57 — HUD-Finanzgruppe als eine Schaltfläche

Tagesgeld und ETF-Depot öffnen beide den Finanzen-Screen, leuchteten beim Zeigen
aber einzeln auf. Hover, Druckpunkt und Tastaturfokus hängen jetzt an
`.resource-finanzgruppe` statt am einzelnen Button
(`css/annotation-fixes.css`, direkt nach `.resource-finanzgruppe > button`).

- Beide Hälften heben sich gemeinsam um 1 px, gehen gemeinsam 1 px runter und
  teilen Hintergrund und Textfarbe. Beim Drücken wird die Trennlinie
  transparent, sodass die Gruppe kurz eine durchgehende Fläche ist.
- Der generische `button:hover:not(:disabled)`-Hub aus `app-shell.css:95` musste
  dafür überschrieben werden — er hob sonst nur die berührte Hälfte an. Gleiche
  Spezifität (0,2,1), `annotation-fixes.css` gewinnt über die Schichtreihenfolge.
- `:active` greift auch am Elternteil, solange ein Kind gedrückt wird; die Regel
  trifft deshalb beide Buttons.
- Der Fokusring bleibt bewusst am tatsächlich fokussierten Button, damit
  Tastaturbedienung weiterhin zeigt, wo man steht.
- Der separate `#hud-cashflow-aktion` bleibt unberührt (eigenes Ziel: Popover).

**Messhinweis:** Im nicht rendernden Pane stehen auch Transitions auf ihrem
Startwert. Hover-Effekte deshalb mit `transition: none !important` messen, sonst
liest man den alten Zustand ab.

## UI v56 — Rest des Reviews

Vollständiger Befundbericht in `REVIEW.md`, inklusive der Punkte, die bewusst
offen bleiben, und ihrer Begründung.

1. **Minimum-Font-Pass als Basis statt Desktop-Sonderfall.** Die 13-px-Grenze
   lag nur im 1201-px-Block; darunter blieben rund 30 Stellen bis hinab zu 9 px.
   Basiswerte in `app-shell.css`, `legacy-gameplay.css`,
   `legacy-responsive-features.css` und `annotation-fixes.css` angehoben,
   `small` nutzt `max(13px, .875em)`. **Neues Gate** im `browser-smoke`
   (`winzigeSchrift`) misst die kleinste gerenderte Schrift bei 1024/700/390 px
   und hat direkt den erst mit der ersten Meldung sichtbaren
   `#meldungen-zaehler` (9 px) gefunden.
2. **Toter Legacy-Kartenblock gelöscht** (~40 Zeilen für die frühere
   Inline-SVG-Karte). Vorher einzeln gegen `js/`, `index.html` und `data/`
   geprüft: keine dieser Klassen wird noch erzeugt.
3. **Dock auf dem Telefon.** Unter 701 px verlassen die drei
   Zentrale-Unterseiten das Dock und werden zum vollbreiten Streifen unter dem
   Kopf; das neue Dockziel `#nav-zentrale` führt dorthin. Ohne diesen Button
   gäbe es keinen Weg mehr in die Zentrale — das war der Grund für das
   `display: flex !important` auf `.zentrale-tabs`. Dock jetzt: vier feste
   Ziele, 319 px in 374 px, kein interner Scroller.
4. **`--topbar-h` ist die gemeinsame Quelle** für `.topbar { min-height }` und
   den oberen Screen-Inset. Werte je Breakpoint gemessen: 72 / 128 / 200 / 220
   px. **Bewusst rein in CSS**: Ein ResizeObserver wäre exakter, macht das
   Kernlayout aber von einem Callback abhängig — im nicht rendernden Tab blieb
   der Wert stehen und ergab 125 px Überlappung.
5. **Elementvertrag B1.3 geschlossen.** Bildzoom ist ein nativer `<button>`;
   der eigene keydown-Zweig in `js/ui/bildzoom.js` ist entfallen, weil Enter und
   Leertaste sonst zusätzlich zum nativen Klick `showModal()` auf dem bereits
   offenen Dialog aufgerufen hätten. Der SVG-Platzhalter ist bei vorhandenem
   WebP `aria-hidden`. Die vier Familien-Zustandsbalken sind native `<meter>`.
6. **Trefferflächen:** `.info-tooltip` 24-px-Overlay über `::before` (`::after`
   trägt den Tooltip-Text), `.fav` `min-width: 32px`, Checkboxen 17 px.
7. **Topbar ab 1680 px auf Lesebreite** — Kopf, Inhalt und Dock stehen in einer
   Spalte.

Die dauerhaften Regeln daraus (Schriftuntergrenze, genau ein Scroller pro Achse,
Breakpoint-Paare ohne Lücke, gemeinsame Quelle für Kopfhöhe und Inset) stehen in
`DESIGN_SYSTEM.md` §3 und §6.

## UI v55 — Layout-/UI-Review

Vollständiger Befundbericht in `REVIEW.md`; offene Punkte sind dort priorisiert.
Behoben wurden zehn Layout-, Format- und Lesbarkeitsfehler ohne State-Wirkung:

1. **`.stadtkarte svg` traf jedes Marker-Icon.** Die Regel stammt aus der alten
   Inline-SVG-Karte und setzte `width: 100%; min-height: 330px` auf jedes
   `.ui-icon` in den Markern — 25 × 330 px auf dem Desktop, 760 × 330 px unter
   700 px. Selektor auf `.stadtkarte > svg` verengt
   (`css/legacy-responsive-features.css:223,397`). Der restliche Legacy-Block
   (`.karten-ebene`, `.stadt-strassen`, `.ebene-titel` …) ist nachweislich tot —
   siehe `REVIEW.md` 1.2.
2. **HUD-Finanzgruppe** hatte `flex: 2 0 252px` / `flex: 1 0 126px`; mit
   `flex-shrink: 0` lief die Leiste bei 390 px 7 px über die Topbar und wurde
   von deren `overflow: hidden` abgeschnitten. Jetzt `2 1 0` / `1 1 0`.
3. **Zwei verschachtelte Scroller im Dock.** `.zentrale-tabs` war ein eigener
   `overflow: auto`-Container und wurde bei 390 px auf 124 px gequetscht;
   „Objekte" lag außerhalb des Viewports. Jetzt scrollt das Dock als eine Reihe.
4. **Breakpoint-Lücke 700/701 px.** Bei fraktionalen Viewport-Breiten (Zoom,
   Geräte-Pixelratio) traf weder `max-width: 700px` noch `min-width: 701px`.
   Acht Vorkommen auf `max-width: 700.98px` gezogen.
5. **Kopf-Layout für 701–760 px ergänzt.** Spalte 1 der Topbar ist `max-content`
   und wurde von der Ressourcenleiste auf 580 px gedehnt: Überlauf bis 27 px,
   Datum und Menü kollidierten. In diesem Band stapelt der Kopf wie mobil; der
   Screen-Inset folgt mit 207 px.
6. **`fmtProzent()` in `js/ui/util.js`** ersetzt englische Dezimalpunkte in
   Exposé und Marktplatz („2.9 %" → „2,9 %"); `finance.js` und `dashboard.js`
   ziehen mit `.replace('.', ',')` nach.
7. **€/m² auf bezugsfreien Marktkarten** kam über `fmtEURKompakt` als
   „1 Tsd €/m²" heraus und ist jetzt voll ausgeschrieben.
8. **Kontokennzahlen** hatten Label 14 px über Wert 10,5 px (unter 1201 px sogar
   9 px / 10,5 px). Beide jetzt gleich groß.
9. **`entzerreMarker()`** lief nur beim Rendern; ein debounced Resize-Handler in
   `js/ui/karte.js` rendert die Karte neu, damit die Marker von den rohen
   `kartenposition`-Werten ausgehen und nicht über mehrere Resizes wegdriften.

Nachgemessen bei 390/700/711/760/1024/1280/1440/2560 px: kein Seiten-Overflow,
kein Topbar-Overflow, keine Kopf- oder Dock-Überlappung. Alle Gates grün.

**Wichtig für den nächsten Agenten:** Der Claude-Browser-Pane rendert nicht
sichtbar (`visibilityState: "hidden"`). `requestAnimationFrame` feuert dort nie
und CSS-Animationen stehen auf Keyframe 0. Dadurch sehen `entzerreMarker()` und
der eingeschobene `#dlg-finanzierung` (`translateX(28px)` aus
`@keyframes fin-panel-in`) wie Fehler aus, die keine sind. Layoutmessungen über
`getBoundingClientRect`/`getComputedStyle`/`matchMedia` bleiben korrekt.

## UI v54 — Encoding-Fix, HUD-Flex, Minimum-Pass

UI v54 enthält vier unabhängige Korrekturen:

1. **Encoding-Korruktion rückgängig (63 Dateien):** Eine PowerShell-5.1-Aktion
   im Vorgängersession hatte alle `.js`/`.html`/`.mjs`-Dateien als CP1252
   eingelesen und als UTF-8 zurückgeschrieben (Doppelkodierung). Das
   Node.js-Reparaturskript in `tools/fix-encoding.mjs` (temporär im Scratchpad)
   invertiert den Prozess: jedes Unicode-Zeichen wird per CP1252-Rücktabelle auf
   den ursprünglichen Byte-Wert gemappt und das Ergebnis als UTF-8 neu
   gespeichert. Alle 63 Dateien sind repariert; `test/chat-contracts.mjs`
   Z. 443–444 enthält korrekte UTF-8-Regexe.

2. **HUD-Finanzgruppe: flex-Layout (CSS).** Die Buttons in `.resource-finanzgruppe`
   haben `display: block` (kein Grid, wie erwartet). SVG und `.resource-copy`
   stapelten sich vertikal und das `b`-Element überlief den Button-Rand um ~20 px.
   Fix: am Ende von `css/annotation-fixes.css` (`@media (min-width: 1201px)`)
   `display: flex; align-items: center; gap: 8px; overflow: hidden` plus
   `.resource-copy { display: block }` gesetzt. Höhe auf 46 px (Smoke-Gate ≤ 46).

3. **Minimum-Pass sub-13-px (CSS).** Rund 20 Selektoren im 1201-px-Block von
   `css/annotation-fixes.css` waren nach UI v53 noch unter 13 px. Alle auf
   13–14 px angehoben; `.marker-copy b/small` erstmals explizit auf 13/12 px
   gesetzt. `.stadtkarte { margin-top: 4 px }` gleicht den durch größere
   Kontroll-Buttons verkleinerten Abstand zur Karte wieder aus.

4. **Karten-Marker / `entzerreMarker()` (JS).** `js/ui/karte.js` rief
   `entzerreMarker()` synchron auf — `getBoundingClientRect()` liefert vor dem
   Layout-Flush Nullen. Wrap in `requestAnimationFrame()` behebt das Überlapp.

Quartalsbericht-Scrollbalken wird visuell ausgeblendet (`scrollbar-width: none`);
internes Scrollen bleibt erhalten (Smoke-Gate `berichtIntern: true` ✓).

Alle fünf Testgates grün: `simtest`, `chat-contracts` (32), `release-check`,
`browser-smoke`, `launcher-smoke`.

Save v21 / UI v52 schließt zwei offene Roadmap-Punkte:

- **E2 — Auftaktmomente gegen den toten Spielbeginn.** Drei terminierte Momente
  (Monate 2/5/9, `kategorie: "auftakt"` in `data/events.json`) füllen den vor
  dem ersten Kauf ereignisarmen Beginn. `rolleAuftakt()` in `js/events.js` läuft
  im Tick **nach** `rolleEvent()`, damit dessen RNG-Roll an fester Position
  bleibt; es verbraucht selbst keinen seeded RNG und hat leere Effekte. Die
  Momente feuern nur, solange `portfolio` leer ist und kein Eigenheim besteht,
  und sind aus dem Zufallspool (`istErfuellbar`) ausgeschlossen. Empirisch
  neutral: `rngState`/`etfRngState`/`cash` mit und ohne Auftakt byte-identisch.
- **B2 — Einzelaktien-Code aus dem Kern entfernt.** `js/aktien.js` und
  `data/stocks.json` gelöscht; `aktienDepot`, `aktienRngState`, Kurspfad,
  Dividenden, `config.aktien`, Content-Loader und aktienspezifische Tests
  entfernt. ETF, Sparplan, Tagesgeld und `kapitalsteuer.js` (gemeinsamer
  Freibetrag für Tagesgeld + ETF) bleiben erhalten. `SAVE_VERSION` 20→21; alte
  Saves werden ohne Migration abgelehnt.

Achtung nächster Agent: `browser-smoke.mjs` lief zuvor real nie vollständig
durch (fehlender `#nav-karte`-Klick vor dem Stadtpost-Legendencheck, jetzt
gefixt). Vor „grün" behaupten immer den echten Chrome-Lauf abwarten.

## Fallstricke für den nächsten Agenten

- **Zentrieren nie über `transform`.** `main:not([hidden])` trägt
  `animation: screen-in … both`; der Endkeyframe setzt `transform` und
  überschreibt jede eigene `transform`-Deklaration dauerhaft. Auto-Margins
  verwenden (siehe Gate ab 1680 px in `css/style.css`).
- **`css/style.css` ist nur der Entrypoint für sieben thematische Schichten**
  (`foundation.css`, drei Feature-/Legacy-Schichten, `warm-theme.css`,
  `app-shell.css`, `annotation-fixes.css`). Neue Regeln in die thematisch
  passende Schicht einfügen, nicht an das Ende von `style.css`.
- **`test/chat-contracts.mjs` prüft Quelltext-Strings**, nicht nur Verhalten.
  Exakte CSS-Deklarationen und HTML-Fragmente sind dort festgeschrieben; bei
  Strukturänderungen den Vertrag mitziehen statt ihn zu umgehen.
- **Cachebuster sind manuell.** `?v=N` steht in ~275 Stellen über
  `index.html`, `js/**` und `test/**`; `release-check` erzwingt den vollständigen
  Modulgraph. Ohne Bump serviert der Browser altes CSS/JS — das kostet sonst
  eine Debugrunde.

## G/H — Langfristige Entwicklung, Familie und Arbeit

`js/goals.js`, `js/arcs.js` und `js/life.js` bleiben DOM- und RNG-frei. Die UI
liegt ausschließlich in `js/ui/strategy.js`, `js/ui/renovieren.js` und den
vorhandenen Renderern:

- In der Zentrale stehen drei freiwillige Ziele: erstes stabiles Mietobjekt
  über 36 Monate, Eigenheim über 96 Monate und Bestand stabilisieren über
  60 Monate. Fortschritt kommt aus realem Portfolio-, Eigenheim-, Cashflow- und
  Pufferstate. Wechsel oder Pause verändern weder Cash noch RNG und vergeben
  keine Belohnung.
- Schimmel-, Nachbarschafts- und Zinsentscheidungen können fünf Arc-only-
  Folgeevents terminieren. Sie erscheinen nicht im zufälligen Eventpool. Bei
  Fälligkeit laufen sie über das normale aktive Event; Auflösung und Verlauf
  bleiben am Objekt nachvollziehbar. Der Finanzierungspfad kann eine direkte,
  sichtbare Sondertilgung auslösen.
- Balance, Karriere und Familienzeit sind jeweils zwölf Monate gebunden.
  Karriere verändert den Default um +650 €/Monat, −6 h verfügbarer Zeit und
  −4 Punkte Familienziel; Familienzeit um −900 €, +8 h und +5 Punkte. Die
  Zentrale zeigt Wirkung, Restbindung und nächste Lebensphase vor der Wahl.
- Auto-, Einkommens-, Ruhestands- und Kinderphasen werden bis zu zwölf Monate
  vorher genau einmal angekündigt und können als nächster Monatszug erscheinen.
- Eigenleistung ist eine Checkbox im Renovierungsplaner: 12 % Ersparnis,
  Handwerkerprofil 20 %, gedeckelt auf 6.000 €. Sie bindet höchstens 6 h pro
  Monat und multipliziert das Kostenüberziehungsrisiko mit 1,30 beziehungsweise
  beim Handwerkerprofil 1,05. Ohne Auswahl bleibt die bisherige Renovierung
  unverändert.
- Sämtliche neuen Geld-, Zeit-, Risiko- und Horizontwerte liegen unter
  `DEFAULT_CONFIG.entwicklung` beziehungsweise `.renovierung.eigenleistung`.
  Die Arbeitsmodell-Annahmen sind im Einstellungsdialog editierbar. Ein
  separates Ruf-/Beziehungspunktesystem wurde bewusst nicht gebaut.

`test/gh-development.mjs` prüft Ziele, drei Arc-Typen, Arbeitsmodelle,
Lebensphasen, Eigenleistung und Save-Roundtrip. Der Browser-Smoke bedient die
Zielwahl, native Fortschrittsanzeige, alle Arbeitsmodelle, Restbindung und den
Einstellungsweg.

## F — Viel Bestand, wenig Luft

`js/turnaround.js` ist DOM- und RNG-frei. Es berechnet Objekt-Cashflow, Triage,
Bankvorschau und zwei Stabilisierungslinien aus dem tatsächlichen Bestand:

- Der reproduzierbare Start liegt mit fünf vermieteten Objekten bei rund
  −3.302 € Objekt-Cashflow und −632 € Haushaltsüberschuss. Die Triage sortiert
  nach größtem Verlust und zeigt Risiko, LTV/Zinsbindung, Eigenkapital,
  sechsmonatigen Exit, Arbeitslast sowie Miet-/Bankchancen.
- „Bestand halten & Rate strecken" kombiniert vier heute legale
  Mietprüfungen mit den drei stärksten Bankterminen. Jeder Termin kostet 3 h
  und mindestens 500 € beziehungsweise 0,2 % der Restschuld. Die Anfangstilgung
  sinkt auf 0,5 %; Sollzins und Bindung bleiben gleich. Vor Bestätigung stehen
  Monatsentlastung, Gebühr und zusätzliche Restschuld bis zur Bindung.
- Im Startzustand verbessert diese Linie den Monat um rund 766 €, kostet rund
  2.214 € sofort und hebt den Haushalt auf etwa +134 €. Der Objektverbund bleibt
  mit rund −2.536 € bewusst negativ: Das ist Liquiditätsstabilisierung, keine
  behauptete Rendite.
- „Größten Verlustträger verkaufen" startet den vorhandenen sechsmonatigen
  Verkaufsprozess. Beim schlechtesten Objekt entfallen nach Abschluss rund
  1.301 € Monatsverlust; der Start-Exit wird ehrlich mit rund −6.634 €
  Nettoerlös ausgewiesen. Bis dahin laufen Kredit, Miete und Marktrisiko weiter.
- Zwei native `<meter>` zeigen +600 € Monatsverbesserung und ein Planjahr
  Objektrücklagen. Nach zwölf Monaten schließt nur das besondere Bankfenster;
  normale Bewirtschaftung und Verkauf bleiben. `monatsAnlass()` hält die
  Turnaround-Aufgabe in diesem Zeitraum auf Stadt und Zentrale sichtbar.

`state.turnaround` speichert `bankAnpassungen` und den unveränderten
Baseline-Cashflow. Am Darlehen dokumentiert `turnaroundAngepasst` Gebühr,
Alt-Rate und spätere Mehrschuld. Mietprüfung, Verkaufsstart/-abschluss und
Banktermin schreiben strukturierte Wirkungen in `entscheidungsHistorie`.
`test/f-turnaround.mjs` sichert beide Linien, Kosten, RNG-Neutralität,
12-Monats-Fenster, +600-€-Ziel und Save-Roundtrip; der Browser-Smoke bedient
Triage und Bestätigungsdialog im echten Startweg.

## E — Vom Analysieren zum Handeln

`js/gameplay.js` ist DOM- und RNG-frei. Es leitet den Monatsanlass und den
Prüfstand aus realem State ab und protokolliert nur Entscheidungen/Wirkungen:

- Das Exposé zeigt Anlass → Prüfung → Entscheidung → Wirkung als vierstufige
  Kette. Besichtigung, Dokumente und Gutachter ergeben 0–3 Prüfschritte;
  `<progress>` zeigt den Ablauf, `<meter>` die Restunsicherheit 100/72/43/15 %.
  Auch vollständig geprüft bleibt das Risiko ausdrücklich „niedrig, nie null".
- Spieler können bieten/verhandeln, beobachten oder bewusst weggehen.
  Beobachten speichert Preis/Monat und Favorit. Ein guter Weggang entfernt den
  Favoriten, erhält DD-Wissen, bindet kein Kapital und zählt als sichtbarer
  Erfolg. Beide Entscheidungen verbrauchen keinen RNG. Neue Marktrunden öffnen
  eine neue Chance.
- `monatsAnlass()` priorisiert angenommene Gebote, Leerstand, beobachtete oder
  offene Angebote und zuletzt bewusstes Weiterbeobachten. Stadt und
  Quartalsbericht verwenden dieselbe Empfehlung.
- Kauf, Vermietung, Renovierungsstart/-abschluss, Wechsel der Hausverwaltung
  und behobene Mängel schreiben nüchterne Vorher/Nachher-Wirkungen in
  `state.entscheidungsHistorie`.

`test/e-gameplay.mjs` sichert die Schleife, RNG-Neutralität und den
Save-Roundtrip. Der Browser-Smoke bedient zusätzlich Anlass, native
Prüfanzeigen, Beobachten und sichtbare Wirkung im echten Exposé.

## B0 — wirtschaftlich spielbare Wege

`finanzierungsCashflowPfade()` in `js/finance.js` bewertet DOM-frei und ohne
State-/RNG-Mutation:

- laufende Bestandsmiete und regional gekappte Mietprüfung;
- reguläre, möblierte und Zeitvermietung freier Objekte;
- kosmetische Renovierung vor jedem dieser Vermietungswege;
- Einmalkosten, Umbauzeit, Wechsel-/Rechtsrisiko und vereinfachte signed
  Steuerschätzung inklusive Gutschrift auf verrechenbare Verluste.

Die Finanzierung rendert den risikoärmsten ausreichenden Weg als natives
`<output>`: positiver Pfad, nahe Break-even bis −100 €/Monat oder „auch
stabilisiert untragfähig". Freie Objekte verwenden jetzt dieselbe
zustandsabhängige Marktmiete wie die spätere Bewerbersuche.

Die neue `test/b0-economy.mjs`-Matrix isoliert bei allen 40 Angebotspreisen
80 % LTV, 2 % Anfangstilgung und zehn Jahre Zinsbindung. Ergebnis nach
vereinfachter Steuerschätzung:

| Sicht | positiv | bis höchstens −100 € | Median/Monat |
|---|---:|---:|---:|
| regulär stabilisierte Rohökonomie | 1/40 | 6/40 | −457 € |
| bester vorhandener Pfad, höchstens zwei Handlungen | 7/40 | 13/40 | — |

Jedes Segment hat mindestens einen positiven Pfad: `bi-06`; `br-03`/`br-10`;
`le-02`/`le-08`; `me-04`/`me-10`. Sechs davon sind Wohnungen. 33/40 bleiben
bewusst negativ. `me-10` verwendet nun korrekt 202 € zustandsabhängige
Marktmiete statt 218 € Durchschnitts-Vergleichsmiete; mit regulärer Vermietung
bleibt es bei 80 % LTV rund 64 € negativ. Das volle WEG-Hausgeld im Leerstand,
der 35-%-Owner-Anteil, die separate Objektrücklage und die höheren Hauskosten
bleiben nach dem B0-Kostenaudit unverändert.

## Unverändert

- Statische Vanilla-JS-App ohne Build oder Runtime-Dependency.
- 40 Listings: Berlin 20, Leipzig 10, Meißen + Umland 10; alle mit
  Außenansicht und zwei Zustands-Cutaways.
- 159 Assets, 14,27 MB; Assetbudget unter 15 MB. Cormorant Garamond und
  Alegreya Sans lokal als WOFF2 inklusive OFL-Lizenztexten.
- Der 40er-Katalog und die B0-Pfadlogik bleiben erhalten; Berliner Mietbasen,
  Nachfrage und signed Steuerschätzung sind mit Save v20 neu kalibriert.
- Lokaler Start über BETONGOLD_STARTEN.cmd beziehungsweise
  `node tools/start-game.mjs`; niemals `file://`.

## Verifikation 21.07.2026 (Save v20 / UI v48)

Grün: `simtest`, `b0-economy`, `chat-contracts` (31 Verträge), `e-gameplay`,
`f-turnaround`, `gh-development`, `catalog-market`, `launcher-smoke`,
`family-market --seeds=300`, `balance --seeds=300 --check`,
`balance-regressions --seeds=300`, `browser-smoke` und `release-check`.
Der Browser-Smoke prüft zusätzlich 41 dynamische Textzustände auf WCAG-Kontrast
sowie den erzwungen breiten Vermögens-Chart auf internen Horizontal-Scroll ohne
Seiten-Overflow. Der Release-Check validiert die sieben geordneten CSS-Schichten.

## Bewusst offen

1. **Unmittelbar (Owner-only-Gate, Arbeitspaket A):** vollständiger
   menschlicher Normal-/Schwer-Lauf nach dem Ablauf in `PLAYTEST.md`; die
   automatischen Gates ersetzen den Verständlichkeitsnachweis nicht. Neu
   abzunehmen: fühlen sich die drei Auftaktmomente (Monate 2/5/9) wie ein
   belebter Einstieg an oder wie Klickarbeit? Besonders lohnend bleiben Berliner
   Vermietung, regionale Eigenheimumzüge, Hintergrundsuche und Sondertilgung.
2. **Rest B1.3:** Bildzoom als nativer `<button>`, `aria-hidden` für den
   SVG-Fallback bei vorhandenem WebP, echte `<meter>` statt Div-Messbalken. Der
   Elementvertrag gilt weiterhin sofort für neue UI.
3. Danach erst Kapitel/Kampagnenrhythmus (Arbeitspaket I); reale Geräte und
   manueller Screenreadercheck bleiben ein separates Owner-Gate.
