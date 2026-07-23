# HANDOVER.md — aktueller Projektstand

**Stand:** 22.07.2026, Codex (Desktop-Lesbarkeit abgeschlossen)

**Versionen:** SAVE_VERSION = 20, UI_VERSION = 51

UI v51 hebt auf breiten Desktops kompakte Haushalts-, Steuer-, Objekt-, Markt-
und Erklärungstexte um rund 1–2 px an. Grüne Statusbadges verwenden nun eine
kontrastreiche dunkle Schrift auf hellem Grün.

UI v50 ergänzt die Akzentdisziplin aus UI v49 um eine feste 44-px-Höhe der
drei Finanzwerte ab 701 px. Damit streckt die zweizeilige Topbar bei etwa
1081–1180 px die Finanzbuttons nicht mehr auf die volle Grid-Zeile. Stadtpost
und Glockenarchiv beziehen Kategorie, Symbol und Farbe aus derselben Funktion;
das Dock ist auf Desktop nicht mehr als unnötiger horizontaler Scroller aktiv.

UI v49 beruhigt die visuelle Hierarchie: gewöhnliche Überschriften, Icons,
Rahmen und Trennlinien verwenden neutrale kühle Strukturfarben; Gold bleibt
dem aktiven Dockziel, Primäraktionen und einzelnen Schlüsselwerten vorbehalten.
Die drei Finanzwerte im Desktop-HUD sind niedriger. Das Bottom-Dock zeigt seine
Zentrale-Unterseiten deckend, aber markiert auch nach einem Wechsel zu Stadt,
Marktplatz oder Finanzen nur genau ein Ziel als aktiv. Browser- und
Chat-Verträge sichern Kartenhöhe, Deckkraft und Exklusivität des Aktivzustands.

UI v48 schließt alle offenen Punkte des vorangegangenen Code-Inspector-Berichts.
`css/style.css` ist nur noch der geordnete Entrypoint für sieben thematische
CSS-Schichten; der vollständige visuelle Inhalt und seine Reihenfolge blieben
beim Split unverändert. `test/contrast-utils.mjs` prüft im echten Browser
berechnete Text-/Hintergrundfarben nach WCAG. `browser-smoke.mjs` deckt damit
die annotierten dynamischen Kontrastzustände ab und besitzt nun zusätzlich den
fehlenden Langchart-Vertrag: nur `.chart-wrap` darf horizontal wachsen, nicht
Panel, Screen oder Dokument.

UI v47 ergänzt den Save-v20-Stand um den vollständig abgeglichenen jüngsten
Browser-Annotationssatz. Tagesgeld und ETF sind als gemeinsames Finanzziel
gruppiert; die Zentrale-Unterseiten ersetzen den redundanten Bottom-Nav-Alias.
Exposé, Vergleich, Finanzierung und Mietrechtshinweise sind kompakter und
lesbarer, Besichtigungsbefunde semantisch markiert, und der breite Bildzoom
vermeidet unnötiges Querscrollen. Ein bebilderter Notartermin mit zurückhaltender
Kaufanimation stärkt den Abschlussmoment. Das Glockenarchiv kategorisiert alle
Meldungen farbig und verlinkt sie kontextuell; jährliche Sondertilgungs-Hinweise
erscheinen dort ebenfalls. Bewerberkarten besitzen größere Porträts und
illustrierte Steckbriefkategorien. Das Desktop-Dashboard nutzt seine Höhe besser,
ohne die beabsichtigte interne Chartnavigation für lange Runs zu verlieren.

Save v20/UI v46 setzt den priorisierten P0-Block aus `BACKLOG.md` vollständig
um. Berlin nutzt recherchierte Angebotsmieten und eine deutlich angespanntere
Bewerberlage. Jedes Profil besitzt einen Wohnort; ein Eigenheimkauf in einer
anderen Region warnt vor der modellierten Einkommensänderung und wendet sie im
Folgemonat einmalig an. Jahresverluste aus Vermietung erzeugen im vereinfachten
Modell eine Steuergutschrift, Kredite erlauben jährlich bis zu 5 %
Sondertilgung, und erfolglose Mietersuchen laufen im Hintergrund mit monatlicher
Benachrichtigung weiter. Der Bankdialog hat einen synchronen ETF-Slider; die
Zentrale-Untertabs liegen bei der Bottom-Navigation, das Vermögensdiagramm ist
intern horizontal navigierbar und das Glockenpanel bleibt das einzige
vollständige Ereignisarchiv. HUD-Haushalt, Bewerberkontrast und negatives
Tagesgeld wurden ebenfalls vereinheitlicht.

UI v45 schließt den zweiten gesammelten Owner-Annotationspass ab. Der
Familienstart nutzt 900 € Reisen und 300 € direkte Kleinkindkosten; die
Kinderstaffel steigt zu Schule und Ausbildung/Studium. „Finanzierungsquote“ und
„typischer Planungsmonat“ ersetzen unnötige Fachsprache. Der Bankdialog besitzt
nur noch Nutzung sowie Finanzierung & Urteil: Eigenkapital und Tilgung bleiben
oben sichtbar, Rechnung und Cashflow-Vorschau scrollen darunter. Vergleichswerte
zeigen farbige Abweichungen zur Basisspalte; technische Erklärtexte liegen in
unclippbaren Tooltips. Außerdem: dunkle Kontrastflächen, ruhige Favoritensterne,
Benachrichtigungsbadge am Marktplatz, Titelstatus am Objekt, Maus-Panning im
Bildzoom, korrigierte Tourziele, ausführlichere Vermietungshilfe und klar
gerahmte Mietniveaukarten.

UI v44 setzt den gebündelten Browser-Annotationspass um. Dialoge schließen per
Hintergrundklick oder Esc; geänderte Formulare fragen vor dem Verwerfen nach,
erzwungene Spielstarts und offene Ereignisentscheidungen bleiben geschützt.
Schriftgrößen, Dashboardkontrast, Iconzentrierung, Tababstände, Range-Regler und
unclippbare Viewport-Tooltips teilen sich nun zentrale Regeln. Die Stadtbühne
zeigt ihr Motiv scharf und in normaler Helligkeit, Marker bleiben beim Fokus
ortsfixiert und der rechte Index besitzt kompakte Bildvorschauen. Im Exposé ist
die Ablehnungsaktion idiomatisch beschriftet; der Bankdialog zeigt den Sollzins
sichtbar als Markt-Basiszins plus Aufschlag für Finanzierungsquote und Bindung. Browser-Smoke
sichert Dialogwarnung, Kartenbilder/-stabilität, Zinsaufschlüsselung und
begrenzte Sliderbreite.

UI v43 verbreitert den Startdialog ab 1100 px auf bis zu 1160 px und ordnet
alle vier Startlagen in einer Reihe an. Bei 1305 × 979 px ist der Dialog damit
breiter als hoch, vollständig sichtbar und ohne horizontalen Überlauf. Der
Browser-Smoke sichert Breite, Seitenverhältnis und die gemeinsame Kartenzeile.

UI v42 ordnet die zuvor in vier Auto-Spalten zerfallende Startvorschau neu:
eine kleine Überschrift, zwei gleich breite Vermögenswerte und volle Zeilen
für Monatsbild, Langfristannahmen und Presetbesonderheit. Der Browser-Smoke
misst diese Hierarchie jetzt zusätzlich. Bei der annotierten Größe 1305 ×
979 px ist der Block 413 px breit, ohne horizontalen Overflow; 390 px bleibt
über das bestehende Responsive-Gate abgedeckt.

UI v41 ist ein reiner UI-/CSS-Pass: kein Save-, State-, Engine- oder
Datenformat wurde angefasst, `SAVE_VERSION` bleibt deshalb bei 19. Grundlage war
ein vollständiger Spiel- und Layoutreview bei 390, 1280, 1440 und 2560 px.
Vollständige Befundliste in `DONE.md`; die wichtigsten Änderungen:

- **Exposé folgt der eigenen Handlungskette.** Vorher wurde „Gebot abgeben"
  (y≈1239 px) 535 px *vor* der Due Diligence (y≈1654 px) angeboten — die
  Kaufentscheidung stand vor den Prüfwerkzeugen. Neue Reihenfolge:
  Bild/Kernfakten → Due Diligence (y≈760) → Szenario/Gebot (y≈1026);
  Seitenhöhe 1829 → 1445 px.
- **Finanzen rechnet kohärent.** Der Vermögensmix nutzt jetzt
  `immoEigenkapital` statt des Brutto-Marktwerts und summiert sich exakt auf die
  Nettovermögens-Überschrift. `.finanz-ueberblick` steht im DOM dort, wo es
  visuell erscheint (`grid-column: 2`).
- **Je Inhalt eine Quelle.** Das Benachrichtigungspanel liest `state.log`
  (Spielmonat, reload-fest) statt eines sitzungsflüchtigen Toast-Archivs mit
  Wanduhrzeit. Renovieren, Bestandsweg und Stadt-Bühne/Liste existieren je
  einmal.
- **Navigation.** Der Alias-Navpunkt „Objekte" entfällt; `zeigePortfolio()` in
  `js/ui/shell.js` ist der eine Weg zum Bestand. Ein Tab steuert genau ein
  Tabpanel.
- **Breite.** Neues Token `--inhalt-max: 1600px` mit Gate ab 1680 px; bei
  390 px sind die letzten beiden horizontalen Scrollleisten weg.

Nächster Block: P1-B2 (Einzelaktien-Code aus Engine/State/Tests). Die
Eventdichte vor dem ersten Kauf ist als P2-E2 neu in der Roadmap — bewusst
nicht in diesem Pass geändert, weil sie RNG-Verbrauch und Balance verschiebt.

## Fallstricke für den nächsten Agenten

- **Zentrieren nie über `transform`.** `main:not([hidden])` trägt
  `animation: screen-in … both`; der Endkeyframe setzt `transform` und
  überschreibt jede eigene `transform`-Deklaration dauerhaft. Auto-Margins
  verwenden (siehe Gate ab 1680 px in `css/style.css`).
- **`css/style.css` sind drei gestapelte Epochen.** Nur die Redesign-Schicht ab
  ~2496 rendert; ältere `max-width`-Container sind bei 2686 mit
  `max-width: none` neutralisiert. Neue Breitenregeln gehören ans Dateiende.
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
- „Bestand halten & Rate strecken“ kombiniert vier heute legale
  Mietprüfungen mit den drei stärksten Bankterminen. Jeder Termin kostet 3 h
  und mindestens 500 € beziehungsweise 0,2 % der Restschuld. Die Anfangstilgung
  sinkt auf 0,5 %; Sollzins und Bindung bleiben gleich. Vor Bestätigung stehen
  Monatsentlastung, Gebühr und zusätzliche Restschuld bis zur Bindung.
- Im Startzustand verbessert diese Linie den Monat um rund 766 €, kostet rund
  2.214 € sofort und hebt den Haushalt auf etwa +134 €. Der Objektverbund bleibt
  mit rund −2.536 € bewusst negativ: Das ist Liquiditätsstabilisierung, keine
  behauptete Rendite.
- „Größten Verlustträger verkaufen“ startet den vorhandenen sechsmonatigen
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
  Auch vollständig geprüft bleibt das Risiko ausdrücklich „niedrig, nie null“.
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
stabilisiert untragfähig“. Freie Objekte verwenden jetzt dieselbe
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

## Gameplay-Neuanalyse 20.07.2026

Der vollständige v36-Weg wurde im laufenden Spiel geprüft: Stadt, Zentrale mit
Vermögen und Haushalt, Marktplatz/Exposé, Due Diligence, Szenario-Finanzierung,
Bestandsobjekt, Bewerberwahl und Finanzen. Ergebnis:

- Das Claude-Redesign ist als Basis kohärent und wesentlich spielnäher als der
  alte Dashboardstand. Cashflow ist per Klick pinbar, Finanzbegriffe sind
  getrennt, Zahlenblöcke gruppiert und LTV sinnvoll zurückgestuft.
- Die stärksten spielerischen Momente sind Bewerberdossiers mit konkreten
  Leerstandskosten, Due-Diligence-Entscheidungen und das bewusste Bieten oder
  Weggehen. Der Backlog soll dieses Muster ausweiten, nicht mehr Menüs ergänzen.
- Die Stadtbühne ist bei 1280×720 noch zu dicht: Ortskarten und rechte Liste
  kollidieren bzw. kürzen Texte, mehrere Panels scrollen ineinander. Zentrale →
  Haushalt lässt rechts viel Fläche frei, während die Steuersektion unter dem
  Fold liegt. Das ist ein fokussierter UI-Pass, kein neuer Design-Rework.
- Finanzen zeigt ausschließlich Tagesgeld, Welt-ETF und Immobilien; die
  Einzelaktien-UI ist vollständig aus dem sichtbaren Kern verschwunden.

Der reproduzierbare Start von „Viel Bestand, wenig Luft“ bestätigt den größeren
Blocker: Alle fünf bereits vermieteten Objekte sind negativ, zusammen rund
−3.302 € Objekt-Cashflow; der Haushaltsüberschuss startet bei rund −632 €. Im
geprüften fortgeschrittenen Spielstand führte ein Leerstand zu rund −1.574 €.
Paket F erhält diesen Stresstest, ergänzt aber zwei innerhalb der ersten zwölf
Monate wirksame, kostenbehaftete Turnaround-Wege.

## Layout- und UI-Neuanalyse — mit UI v41 abgearbeitet

Die Befunde des Audits vom 20.07.2026 sind umgesetzt; Details in `DONE.md`.
Drei damals gemeldete Punkte liessen sich im laufenden Spiel **nicht
reproduzieren** und gelten als erledigt bzw. gegenstandslos: doppelte
`+1 Monat`/`+1 M`-Labels (je genau ein `<span>`), fehlende zugaengliche Namen
bei kompaktem Menue (kein sichtbarer Button ohne Namen bei 390/1280/1440) und
kollidierende Stadtkarten bei 1280 px (kein Seiten-Overflow messbar).

Bewusst beibehalten: Die Stadtbuehne fuellt mit `kommend`-Vorschauen auf vier
Marker auf. Das ist laut `CLAUDE.md` gewollte ehrliche Vorschau — neu ist nur,
dass die Liste daneben diese inerten Eintraege nicht mehr wiederholt.

Der Chart behaelt bei <= 700 px seine eigene horizontale Scrollflaeche
(`#chart { min-width: 680px }`): Eine 920 breite Zeitreihe auf 314 px zu
stauchen waere unlesbar. Das Layout-Gate B1.4 nennt Seiten-, HUD-, Zeit- und
Filterleisten, nicht Diagramme.

## Änderungen in UI v36

- **Tote Einzelaktien-Reste entfernt:** `renderAktien`/`renderAktienVorschau`
  samt Helfern aus js/ui/finanzen.js, `aktieKaufen`/`aktieVerkaufen` aus
  main.js, ~110 Zeilen `aktien-*`-CSS, Icons `icon-stock`/`icon-flow`.
  Engine/State/Content der Aktien bleiben bewusst stehen (separater Pass laut
  ROADMAP.md).
- **Eine Darstellung pro Zahl:** Die Haushaltsrechnung (Zentrale → Haushalt)
  und die Objekt-Monatsrechnung rendern jede Position genau einmal als
  Balkenzeile mit Betrag; Zwischensummen sind abgesetzte `flow-summe`-Zeilen.
  Die parallelen Tabellen (`#haushalt-tabelle`, Objekt-P&L-Tabelle) sind weg.
- **Gemeinsamer „Nächster kluger Zug":** `naechsterZugEmpfehlung()` in
  js/ui/kennzahlen.js liefert die Empfehlung für Stadt und Zentrale; nur die
  Standardempfehlung bleibt screen-spezifisch (nie der eigene Screen).
- **Navigation kohärent:** `aktualisiereNavMarkierung()` in shell.js ist die
  einzige Quelle für die aktive Bottom-Navigation und folgt dem aktiven
  Zentrale-Tab („Objekte"-Tab ⇄ „Objekte"-Navpunkt, sonst „Zentrale").
  Post-Einträge der Stadt öffnen jetzt den Haushalt-Tab (Ereignislog).
- **Elementtypen:** Zentrale-Tabs mit vollem Tabs-Muster (`aria-controls`,
  `role="tabpanel"`-Panels, roving tabindex, Pfeil-/Home-/End-Tasten).
  Stadtauswahl ist ein `aria-pressed`-Filter wie die Statusfilter darüber.
  Info-Tooltips sind echte `<button class="info-tooltip">` (Optik unverändert,
  auch via `faktenLabel()`). Markt- und Bestandskarten tragen den Öffnen-Weg
  als echten Button im Titel (`.karte-titel`); `role="link"/"button"` und
  manuelle Keydown-Handler auf den Artikeln sind entfernt, der Kartenklick
  bleibt Zeigegeräte-Komfort. „Prüfen" auf der Marktkarte entfiel — Karte und
  Titel öffnen das Exposé, „Gebot abgeben" bleibt die Primäraktion.
- **Semantische Key-Value-Blöcke:** `finanz-kurzwerte`, `quartals-kpis` und
  `objekt-kennzahlen` sind `<dl>`; die Startvorschau ist eine Liste.
- **Kleinigkeiten:** Finanzen-H1 heißt „Finanzen" (Eyebrow „Konten & Depot"
  trägt den Rest); „Stadt" statt „Karte/Stadtkarte" in Nutzertexten;
  Export/Import ohne Pfeil-Glyphen.

## Zahlen- und Interaktionsverträge

js/ui/kennzahlen.js liefert gemeinsame Planungs-Ableitungen:

- Haushaltsüberschuss vor freiwilliger ETF-Umschichtung;
- Objekt-Cashflow nach Owner-Kosten, Rücklage, Verwaltung und Kreditrate;
- Vermögensaufbau aus ETF, Tilgung und Rücklagen;
- Liquiditätspuffer in Haushaltsmonaten;
- Empfehlung „Nächster kluger Zug" (Liquidität → Leerstand → Marktangebot).

Der HUD zeigt den Überschuss eines typischen Planungsmonats. Die tatsächliche
Tagesgeld-Veränderung des letzten Monats steht als Summenzeile in der
Haushaltsrechnung und im Cashflow-Popover. Das Cashflow-Popover öffnet auf
Hover/Fokus flüchtig, bleibt nach Klick gepinnt und schließt per zweitem
Klick, Außenklick oder Escape.

Die Finanzierung zeigt bei Leerstand „Bis zur Vermietung" und „Nach geplanter
Vermietung". Wohnungen erklären die WEG-Kosten aufklappbar. Eine Steuerwirkung
von null erscheint genau einmal mit Grund. Die Finanzierungsquote bleibt als sekundäre
„Finanzierungsquote" erhalten; Kauf, Kredit, Objektmonat und Haushaltswirkung
sind getrennt. Darunter bewertet ein natives `<output>` den risikoärmsten
ausreichenden aktiven Pfad nach vereinfachter Steuerschätzung.

## Unverändert

- Statische Vanilla-JS-App ohne Build oder Runtime-Dependency.
- 40 Listings: Berlin 20, Leipzig 10, Meißen + Umland 10; alle mit
  Außenansicht und zwei Zustands-Cutaways.
- 159 Assets, 14,27 MB; Assetbudget unter 15 MB. Cormorant Garamond und
  Alegreya Sans lokal als WOFF2 inklusive OFL-Lizenztexten.
- Der 40er-Katalog und die B0-Pfadlogik bleiben erhalten; Berliner Mietbasen,
  Nachfrage und signed Steuerschätzung sind mit Save v20 neu kalibriert.
- Lokaler Start über BETONGOLD_STARTEN.cmd beziehungsweise
  node tools/start-game.mjs; niemals file://.

## Verifikation 21.07.2026 (Save v20 / UI v48)

Grün: `simtest`, `b0-economy`, `chat-contracts` (31 Verträge), `e-gameplay`,
`f-turnaround`, `gh-development`, `catalog-market`, `launcher-smoke`,
`family-market --seeds=300`, `balance --seeds=300 --check`,
`balance-regressions --seeds=300`, `browser-smoke` und `release-check`.
Der Browser-Smoke prüft zusätzlich 41 dynamische Textzustände auf WCAG-Kontrast
sowie den erzwungen breiten Vermögens-Chart auf internen Horizontal-Scroll ohne
Seiten-Overflow. Der Release-Check validiert die sieben geordneten CSS-Schichten.

## Frühere Verifikation 21.07.2026 (Save v20 / UI v46)

Grün: `simtest`, `b0-economy`, `chat-contracts` (29 Verträge), `e-gameplay`,
`f-turnaround`, `gh-development`, `catalog-market`, `launcher-smoke`,
`family-market 300`, `balance --seeds=300 --check`,
`balance-regressions 300` und `release-check`. `browser-smoke.mjs` ist
syntaktisch gültig und auf die neuen Verträge erweitert; sein tatsächlicher
Browserlauf war in dieser Sitzung nicht möglich, weil die In-App-Browser-
Sicherheitsrichtlinie den lokalen `127.0.0.1`-Aufruf blockiert hat. Es wurde
keine alternative Browsersteuerung zur Umgehung verwendet.

## Frühere Verifikation 20.07.2026 (Save v19 / UI v43)

Nach den Owner-Annotationen grün: `simtest`, `chat-contracts` (27 Verträge),
`browser-smoke` und `release-check`. Der Browser-Smoke misst bei 1280 px den
breiten, einzeiligen Presetbereich und die geordnete Startvorschau sowie den
einspaltigen, überlauffreien 390-px-Zustand. Im In-App-Browser wurde der
annotierte Desktop-Zustand zusätzlich direkt geprüft.

### Frühere Vollverifikation (Save v19 / UI v41)

Alle zwölf Testskripte grün — vollständiger Lauf nach dem B1-Pass:
`simtest`, `b0-economy`, `chat-contracts` (27 Verträge), `e-gameplay`,
`f-turnaround`, `gh-development`, `catalog-market`, `launcher-smoke`,
`family-market --seeds=300`, `balance --seeds=300 --check`,
`balance-regressions --seeds=300`, `browser-smoke`, `release-check` (UI v41,
vollständiger Modulgraph auf `?v=41`).

Zwei Verträge wurden bewusst mitgezogen, weil sie den alten Zustand
festschrieben — nicht umgangen, sondern auf die neue Zusage umgestellt:

- `chat-contracts`: statt `meldungen.length > 50` (Toast-Archiv) jetzt
  `log.slice(-40)`, `<time datetime=` und `doesNotMatch(/meldungen\.unshift/)`.
- `browser-smoke`: statt `liste === marker` jetzt `liste === marker - kommend`;
  der Weg zum Bestand läuft über `#nav-dashboard` + `[data-zentrale-tab]`.

Zusätzlich im lokalen Browser gemessen (nicht nur betrachtet): Exposé-Reihenfolge
per `getBoundingClientRect`, Mix-Summe 18.000 + 5.000 + 80.521 = 103.521 €
gegen die Überschrift, Archiv nach Reload, DOM- gegen visuelle Reihenfolge auf
Finanzen und Stadt, Overflow-Sweep über alle vier Screens bei 390/1440/2560 px,
Zentrierung bei 2560 px (1600 px breit, links 480 / rechts 2080), keine
Konsolenfehler.

Frühere Verifikationsliste (v40) zur Nachvollziehbarkeit:

- JavaScript-Syntax: alle js/- und js/ui/-Dateien.
- test/simtest.mjs.
- test/b0-economy.mjs: 40er-Matrix, Pfade je Segment und State-/RNG-Reinheit.
- test/e-gameplay.mjs: Handlungskette, guter Weggang, Monatsgrund,
  RNG-Neutralität und Save-Roundtrip.
- test/f-turnaround.mjs: Triage, beide Linien, Gebühren/Mehrschuld,
  12-Monats-Fenster, +600-€-Ziel und Save-Roundtrip.
- test/gh-development.mjs: freiwillige Ziele, drei Arc-Typen, Arbeitsmodelle,
  Lebensphasen, Eigenleistung und Save-Roundtrip.
- test/chat-contracts.mjs: 27 Owner-Verträge.
- test/family-market.mjs --seeds=300.
- test/balance.mjs --seeds=300 --check: 13/13 Gates.
- test/balance-regressions.mjs --seeds=300: 5/5 Gates; Möblierung 140/300
  Siege und damit weiterhin Trade-off.
- test/browser-smoke.mjs: kompletter Kaufpfad, E-Handlungskette, F-Turnaround,
  G/H-Zielwahl und Arbeitsmodelle,
  Transfer-Slider, Stadtsegmente, Finanzierung, Accessibility und
  1440/1024/700/390 px. Selektoren für die
  vereinheitlichte Haushaltsrechnung (`#cashflow-viz .flow-zeile`) und die
  aria-pressed-Stadtauswahl angepasst. Hinweis: Nach „BROWSER-SMOKE OK" kann
  auf Windows ein EBUSY beim Aufräumen des Chrome-Tempprofils erscheinen;
  das ist kein Testfehler.
- test/release-check.mjs: UI v40, vollständiger Modulgraph auf ?v=40,
  30 eindeutige Events und Save v19.

Zusätzlich im lokalen In-App-Browser geprüft: Navigations-/Tab-Synchronisation
(Zentrale-Tab wechseln aktualisiert die Bottom-Navigation), vereinheitlichte
Haushaltszeilen inkl. Kinder-/Kindergeld-Posten, Tooltip-Buttons in alter
Optik, Marktkarten-Titelbutton öffnet das Exposé, kein horizontaler Overflow,
keine Konsolenfehler.

## Bewusst offen

1. **Unmittelbar:** Owner testet den Save-v20/UI-v46-Stand manuell und hält
   Unklarheiten oder unerwartete Zahlen in `PLAYTEST.md` fest. Besonders lohnend
   sind Berliner Vermietung, regionale Eigenheimumzüge, Hintergrundsuche,
   Sondertilgung und die verschobene Zentrale-Navigation.
2. **Rest B1.3:** Bildzoom als nativer `<button>`, `aria-hidden` für den
   SVG-Fallback bei vorhandenem WebP, echte `<meter>` statt Div-Messbalken. Der
   Elementvertrag gilt weiterhin sofort für neue UI.
3. **P1 B2:** Einzelaktien-Engine, Depotstate, Content-Fetch und Tests separat
   im Save-/State-Pass entfernen; die UI ist scopekonform und frei von totem
   Aktien-Code.
4. **P2 E2 — Eventdichte vor dem ersten Kauf.** `eventChanceBasis` = 0,035/Monat
   ohne Portfolio-Exposure; gemessen kam in ~78 Monaten ohne Objekt ein einziges
   Event. Bewusst nicht im UI-Pass geändert (RNG-Verbrauch/Balance). Entweder
   Basiswert anheben mit vollen 300-Seed-Gates oder gescriptete Anfangsmomente.
5. Danach erst Kapitel/Kampagnenrhythmus; reale Geräte und manueller
   Screenreadercheck bleiben ein separates Owner-Gate.
