# DONE.md — Abschlusslog

Kompaktes, chronologisches Log. Ältere Einträge sind verdichtet; Details
bleiben in `DECISIONS.md` und den Fachdocs nachvollziehbar.

## 2026-07-26 (3)

- **UI v57 — Tagesgeld und ETF-Depot reagieren als eine Schaltfläche.**
  Owner-Beobachtung: Beide HUD-Hälften öffnen denselben Finanzen-Screen, leuchten
  beim Zeigen aber einzeln auf — das las sich wie zwei verschiedene Ziele.
  Hover, Druckpunkt und Tastaturfokus hängen jetzt an
  `.resource-finanzgruppe` statt am einzelnen Button: Beide Hälften heben sich
  gemeinsam um 1 px, gehen gemeinsam 1 px runter und teilen Hintergrund und
  Textfarbe; beim Drücken verschwindet zusätzlich die Trennlinie, sodass die
  Gruppe für den Moment eine durchgehende Fläche ist. Nötig war dafür, den
  generischen `button:hover`-Hub aus `app-shell.css` zu überschreiben — er hob
  sonst nur die berührte Hälfte an. Der Fokusring bleibt bewusst am
  tatsächlich fokussierten Button. Der separate Haushaltsüberschuss-Button
  bleibt unberührt. Regel in `DESIGN_SYSTEM.md` §6. Reines CSS,
  `UI_VERSION` 56→57.

## 2026-07-26 (2)

- **UI v56 — REVIEW.md abgearbeitet.** Alle offenen Befunde des Layout-/
  UI-Reviews umgesetzt; `REVIEW.md` ist auf den Reststand eingedampft.
  (1) **Minimum-Font-Pass als Basis:** Die 13-px-Untergrenze lag bis v55 nur im
  1201-px-Block; auf Tablet und Telefon blieben rund 30 Stellen bis hinab zu
  9 px zurück. Die Basiswerte in `app-shell.css`, `legacy-gameplay.css`,
  `legacy-responsive-features.css` und `annotation-fixes.css` sind angehoben,
  `small` nutzt `max(13px, .875em)`, der 1201-px-Block ist reiner
  Vergrößerungs-Pass. Ein neues Gate im `browser-smoke` misst die kleinste
  gerenderte Schrift bei 1024/700/390 px — es fand sofort den erst mit der
  ersten Meldung sichtbaren `#meldungen-zaehler` (9 px).
  (2) **Toter Legacy-Kartenblock gelöscht** (~40 Zeilen Inline-SVG-Karte).
  (3) **Dock auf dem Telefon:** Die drei Zentrale-Unterseiten verlassen unter
  701 px das Dock und werden zum vollbreiten Streifen unter dem Kopf; ein neues
  Dockziel `#nav-zentrale` führt dorthin. Das Dock hat damit vier feste Ziele
  und braucht keinen internen Scroller mehr (319 px in 374 px).
  (4) **Kopfhöhe und Screen-Inset teilen sich `--topbar-h`** statt zweier
  getrennter Konstantensätze je Breakpoint. Bewusst rein in CSS: Eine
  JS-gemessene Höhe wäre exakter, macht das Kernlayout aber von einem Callback
  abhängig — bleibt der aus, liegt der halbe Screen unter dem Kopf.
  (5) **Elementvertrag B1.3 geschlossen:** Bildzoom ist ein nativer `<button>`
  (der eigene keydown-Zweig in `bildzoom.js` entfällt, sonst hätte
  `showModal()` doppelt gefeuert), der SVG-Platzhalter ist bei vorhandenem WebP
  `aria-hidden`, und die vier Zustandsbalken der Familie sind native `<meter>`.
  (6) **Trefferflächen:** `.info-tooltip` bekommt ein 24-px-Overlay, `.fav`
  32 px Mindestbreite, Checkboxen 17 px.
  (7) **Topbar auf Lesebreite** ab 1680 px — Kopf, Inhalt und Dock stehen jetzt
  in einer Spalte (vorher saß das HUD bei 2560 px rund 300 px rechts daneben).
  Regeln zu Schriftuntergrenze, Scroller-Verschachtelung, Breakpoint-Lücken und
  `--topbar-h` stehen in `DESIGN_SYSTEM.md`. `UI_VERSION` 55→56, `SAVE_VERSION`
  unverändert 21.

## 2026-07-26

- **UI v55 — Layout-/UI-Review: zehn Sofortkorrekturen.** Live-Audit im echten
  Chrome über 390/700/711/760/1024/1280/1440/2560 px, Ergebnis in `REVIEW.md`.
  Behoben: (1) `.stadtkarte svg` aus der alten Inline-SVG-Karte traf jedes
  `.ui-icon` in den Kartenmarkern und blies die Statussymbole auf 25 × 330 px
  (mobil 760 × 330 px) auf — Selektor auf `.stadtkarte > svg` verengt.
  (2) HUD-Finanzgruppe hatte `flex-shrink: 0` bei festen 252 + 126 px und lief
  bei 390 px 7 px über die Topbar. (3) Die Bottom-Navigation enthielt einen
  zweiten `overflow: auto`-Container; „Objekte" lag bei 390 px außerhalb des
  Viewports. (4) Breakpoint-Lücke `max-width: 700px` / `min-width: 701px` — bei
  fraktionalen Breiten griff keine Regel; jetzt `700.98px`. (5) Für 701–760 px
  fehlte ein Kopf-Layout: Spalte 1 ist `max-content` und wurde von der
  Ressourcenleiste auf 580 px gedehnt, die Topbar lief bis 27 px über und Datum
  und Menü kollidierten. (6–8) Deutsche Zahlenformatierung: neuer Helfer
  `fmtProzent()` ersetzt englische Dezimalpunkte bei Bruttorendite, Zinssatz
  und Liquiditätspuffer; der €/m²-Preis auf bezugsfreien Karten kam über
  `fmtEURKompakt` als „1 Tsd €/m²" statt „1.081 €/m²". (9) Kontokennzahlen
  hatten eine umgekehrte Typo-Hierarchie (Label 14 px, Wert 10,5 px).
  (10) `entzerreMarker()` lief nur beim Rendern — Resize-Handler ergänzt.
  Keine State- oder RNG-Wirkung; `SAVE_VERSION` bleibt 21, `UI_VERSION` 54→55.
  Offene Befunde (globaler Minimum-Font-Pass, toter Legacy-Kartenblock,
  Dockziele auf dem Telefon, Trefferflächen) stehen priorisiert in `REVIEW.md`.

## 2026-07-25

- **UI v54 — Encoding-Fix, HUD-Flex, Minimum-Pass, Marker-Timing:**
  Vier Bugfixes ohne State-Änderung. (1) PowerShell-5.1-Doppelkodierung
  (CP1252→UTF-8) in 63 JS/HTML/MJS-Quelldateien rückgängig gemacht — alle
  Umlaute und Sonderzeichen wieder korrekt. (2) HUD-Finanzgruppen-Buttons
  erhalten `display: flex; align-items: center` (statt `block`), das `b`-Element
  läuft nicht mehr über den Button-Rand. (3) Minimum-Font-Pass: alle sub-13-px-
  Selektoren bei 1201 px auf ≥ 13 px angehoben; `.stadtkarte { margin-top: 4 px }`
  kompensiert den Abstandsverlust durch größere Kontroll-Leiste. (4)
  `entzerreMarker()` in `js/ui/karte.js` per `requestAnimationFrame` verzögert
  — behebt Marker-Überlapp. Quartalsbericht-Scrollbalken visuell ausgeblendet.
  Alle fünf Testgates grün. `UI_VERSION` 53→54.

- **Desktop-Typografie um rund 15 % angehoben (UI v53):** Owner-Feedback am
  Startdialog („viele Schriften noch zu klein“) ausgeweitet zu einem
  vollständigen Desktop-Pass. Ab 1201 px steigt `html, body` von 16 auf 18 px;
  rund 80 zuvor kleine Selektoren über HUD/Topbar, Startdialog, Zentrale,
  Karte, Exposé, Finanzierung, Bewerber, Meldungen und Endauswertung sind im
  bestehenden `@media (min-width: 1201px)`-Block (`css/annotation-fixes.css`)
  gezielt angehoben; mobile und der kompakte zweizeilige Header bleiben
  unverändert. Reiner CSS-Pass ohne State-/Save-Änderung; `UI_VERSION` 52→53,
  Cachebuster `?v=53` in allen ~52 betroffenen Dateien. `chat-contracts.mjs`
  sichert drei konkrete Größen, `browser-smoke.mjs` bestätigt WCAG-Kontrast
  und Overflow-Freiheit bei 1440/1383/1143/1024/700/390 px unverändert grün.

- **Owner-Nachlauf zu UI v53 — zwei Regressionen behoben:** Der Root-Font-
  Bump quetschte die drei knappen HUD-Geldflächen (`.ressourcenleiste`):
  „Haushaltsüberschuss“ lief sichtbar über den Buttonrand. `.ressourcenleiste
  small` erhält jetzt `overflow: hidden; text-overflow: ellipsis; white-space:
  nowrap;` wie ihr `<b>`-Geschwister, statt zu überlaufen
  (`css/legacy-shell-dashboard.css`). Zweitens war die Stadtbühne
  (`js/ui/karte.js`) auf ein festes `staffel`-Zickzack pro Markerindex
  angewiesen; bei eng beieinanderliegenden `kartenposition`-Werten
  überlappten die 154-px-Objektkarten sichtbar. Ein neuer Nachlauf
  `entzerreMarker()` misst die real gerenderten Kartenboxen im
  `.stadt-markerfeld` und schiebt nur tatsächlich kollidierende Paare entlang
  der günstigeren Achse auseinander (mehrere Iterationen, an den Bühnenrand
  geklemmt) — reine Layoutkorrektur ohne State-/RNG-Wirkung. Geprüft: 0
  Kartenüberlappungen in allen vier Stadtsegmenten und beiden Kartenfiltern,
  bei 1613 px und 390 px. `chat-contracts`, `simtest` und `browser-smoke`
  bleiben grün.

## 2026-07-23

- **Auftaktmomente gegen den toten Spielbeginn (E2, UI v52):** Drei terminierte
  Momente in den Monaten 2/5/9 (`kategorie: "auftakt"` in `data/events.json`)
  füllen den vor dem ersten Kauf sonst ereignisarmen Beginn mit Orientierung
  und leichten Abwägungen. `rolleAuftakt()` in `js/events.js` läuft im Tick
  NACH `rolleEvent()`, verbraucht keinen seeded RNG und hat neutrale (leere)
  Effekte — empirisch bestätigt (`rngState`/`etfRngState`/`cash` mit und ohne
  Auftakt byte-identisch), alle 300-Seed-Balancegates unverändert grün. Die
  Momente feuern nur solange `portfolio` leer ist und kein Eigenheim besteht.

- **Einzelaktien-Code vollständig aus dem Kern entfernt (B2, Save v21):**
  `js/aktien.js` und `data/stocks.json` gelöscht. Depotstate, `aktienRngState`,
  Kurspfad, Dividenden, Order-/Gebührenlogik, Content-Loader
  (`alleAktien`/`getAktie`), der `config.aktien`-Block, der `initialisiereAktienmarkt`-
  Aufruf im Tick, die Save-Validierung und die aktienspezifischen Tests
  (simtest-Sandbox, release-check-Profilcheck) sind entfernt. ETF-Depot,
  Sparplan, Tagesgeld und der gemeinsame Kapitalsteuer-Freibetrag bleiben
  vollständig erhalten. `SAVE_VERSION` 20→21 (alte Saves werden ohne Migration
  abgelehnt). Der Value-Investing-Ableger bleibt nur in `IDEEN.md` archiviert.

- **Browser-Smoke real vollständig durchgelaufen:** Ein seit dem CSS-/UI-Pass
  fehlender `#nav-karte`-Klick vor dem Stadtpost-Legendencheck brach den Lauf
  ab; die frühere „grün"-Meldung war nie ein vollständiger Realbrowserlauf. Mit
  dem Fix läuft `browser-smoke.mjs` im echten Chrome komplett durch. Cachebuster
  global auf `?v=52`.

## 2026-07-22

- **Breite Desktop-Typografie als UI v51 lesbarer gemacht** (`SAVE_VERSION`
  bleibt 20): Grüne Statusbadges nutzen nun dunkle Schrift auf hellem Grün.
  Ab 1201 px wachsen Haushalts-, Steuer-, Objekt-, Markt-, Dialog- und
  Erklärungstexte gezielt um rund 1–2 px; mobile Ansichten und der kompakte
  zweizeilige Header behalten ihre bisherige Dichte.

- **Mittleren Desktop-HUD als UI v50 verdichtet** (`SAVE_VERSION` bleibt 20):
  Die drei Finanzbuttons besitzen nun ab 701 px eine feste kompakte Höhe statt
  im zweizeiligen 1081–1180-px-Header auf die gesamte Grid-Zeile zu wachsen.
  Der 1143-px-Zustand ist als Browser- und Querschnittsvertrag ergänzt. Die
  Stadtpost verwendet dieselbe zentrale Kategorie-, Symbol- und Farbzuordnung
  wie das Glockenarchiv. Das Desktop-Dock erzeugt bei langem Drücken keine
  unnötige horizontale Scrollsteuerung mehr; kleine Viewports bleiben scrollbar.
  Der Objektvergleich nutzt ab 701 px die verfügbare Dialogbreite ohne
  Querleiste. Der irreführende dunkle Flächenverlauf unter Objektbildern ist
  entfernt; die einzelnen Status-Pills behalten ihren eigenen Kontrast.

- **Akzentdisziplin und Shell-Klarheit als UI v49 abgeschlossen**
  (`SAVE_VERSION` bleibt 20): Gold ist aus gewöhnlichen Überschriften, Icons,
  Rahmen und Trennlinien entfernt und bleibt Primäraktionen, dem aktiven
  Navigationsziel sowie wenigen Schlüsselwerten vorbehalten. Die drei
  Finanzwerte im Desktop-HUD sind kompakter. Zentrale-Unterseiten besitzen im
  Bottom-Dock deckende Flächen; außerhalb der Zentrale verliert der zuletzt
  gewählte Unterbereich seinen visuellen Aktivzustand, sodass stets genau ein
  Dockziel hervorgehoben ist. Browser- und Vertragschecks sichern die Änderung.

## 2026-07-21

- **Save v20/UI v48:** CSS-Kaskade in sieben thematische Schichten aufgeteilt
  (`foundation.css` … `annotation-fixes.css`, je ≤ 1.300 Zeilen). Browser-Smoke
  misst 41 dynamische WCAG-Kontraste; Langchart-Containment als Vertrag ergänzt.
- **UI v47 (23-Punkte-Pass):** Tagesgeld/ETF-Finanzgruppe; Zentrale-Unterseiten
  in Bottom-Nav; Exposé/Vergleich/Finanzierung lesbarer, Besichtigungsbefunde
  semantisch markiert; breiter Bildzoom; bebilderter Notartermin mit
  zurückhaltender Kaufanimation; farbiges, verlinktes Glockenarchiv;
  Bewerberkarten mit Porträt und Steckbrief-Icons.
- **Save v20/UI v46:** Berliner Angebotsmieten + Bewerbernachfrage nach IBB 2025
  kalibriert; Wohnort/Regionaleinkommen; signed Jahressteuer (Verlustgutschrift
  bei Erwerbseinkommen); 5-%-Sondertilgung; Hintergrundmietersuche ohne
  Blockierung; ETF-Slider; Zentrale-Unterseiten bei Bottom-Nav; Glocke als
  einziges Ereignisarchiv; HUD/Kontrast/Negativzustand vereinheitlicht.

## 2026-07-20

- **UI v41–v45 (B1-Pass + Owner-Annotationen):** Exposé-Reihenfolge (DD vor
  Gebot), Finanzen-Mix rechnet netto, Meldungsarchiv liest `state.log`
  (reload-fest), Renovieren/Bestandsweg/Bühne je einmal; `--inhalt-max: 1600px`
  ab 1680 px; Familienpreset 900 € Reisen, 300 € Kleinkindkosten; farbige
  Vergleichs-Deltas, zweistufige Finanzierung, dunkle Kontrastflächen.
- **Save v19/UI v40 (G/H):** Drei freiwillige Ziele, fünf Objekt-Arcs (Schimmel,
  Nachbarschaft, Zinsplanung), drei Arbeitsmodelle, Lebensphasenankündigung,
  Eigenleistung (12 %/20 % Handwerker, gedeckelt 6.000 €).
- **Save v18/UI v39 (F):** Schuldenberg-Triage nach Cashflow-Verlust; Halten
  (rechtssichere Mietprüfungen + bis zu drei Banktermine) und Verkleinern als
  zwei kostenpflichtige Linien; 12-Monats-Bankfenster; +600-€-Ziel.
- **Save v17/UI v38 (E):** Anlass → Prüfung → Entscheidung → Wirkung;
  Beobachten und guter Weggang als RNG-neutrale, gespeicherte Entscheidungen;
  `monatsAnlass()` priorisiert Stadt und Quartalsbericht.
- **Save v16/UI v37 (B0):** `finanzierungsCashflowPfade()` ohne State-/RNG-Mutation;
  risikoärmster Pfad als natives `<output>`; 40-Listing-Matrix (7/40 positiv
  nach Steuerschätzung).

## 2026-07-19

- **UI v35/v36:** Tote Aktien-UI entfernt; jede Haushalt-/Objekt-Position einmal;
  gemeinsamer „Nächster kluger Zug" in `kennzahlen.js`; Navigation/Tabs
  semantisch bereinigt (Tabs-Muster, `aria-pressed`-Stadtfilter, `<dl>`-KPIs).

## 2026-07-18

- **UI v32–v34:** Konsolidiertes City-Builder-Handoff (dunkel, Goldakzent, Bottom-
  Nav); vier Stadtbilder; bidirektionaler ETF-Slider; lokale Schriften
  (Cormorant Garamond/Alegreya Sans WOFF2 + OFL); Finanzsprache (Cashflow vs.
  Nettovermögen) getrennt.

## 2026-07-17

- **Save v14–v15/UI v29–v31:** 40er-Katalog (Berlin 20/Leipzig 10/Meißen 10)
  mit je drei WebPs finalisiert; Meißen + Umland ersetzt Rostock als vierter
  Markt; reales Familienpreset (8.300 €, Kinder 3,5/0,6, 520 € Kindergeld);
  Eigenbedarf 3/6/9 Monate; drei Vermietungswege; Release-Check verbietet
  byte-identische Listingbilder.
- **Save v12–v13/UI v26–v28:** Kapitalsteuer-Freibetrag (1.000 €/Person,
  30 % ETF-Teilfreistellung); Windows-Launcher; drei Stadtschemas; Ratgeber
  für Leicht/Normal.

## 2026-07-16

- **Save v9–v11/UI v14–v25:** Ruhestand/Lebensende getrennt (55 % Renten-Netto,
  Lauf 90–100 per `lebensRngState`); Einzelaktien-Sandbox (später entfernt);
  Balance-Harness 13 Gates; 300-Seed-Möblierungsbalance (9.500 €); Stadtfilter-
  Fix; Zeitsteuerung monochrome SVGs; Header ohne Nettovermögen; Windows-
  Launcher; zwei Sonderstarts (Schuldenberg + Handwerker-Azubi).

## 2026-07-15

- **Phase 1–5 / Save v1–v8 / UI v1–v13:** Gesamtes Spielsystem:
  State/RNG/Saves, Markt, Due Diligence, Finanzierung/Kauf, Renovierung,
  Mieter, Events, Eigenheim, Jahressteuer, Verkauf, Endgame-Scores,
  Browser-Smoke, Release-Check, Admin-Panel, Accessibility-Basis,
  Balance-Harness. Vier Startprofile, seeded Determinismus (`mulberry32`).
