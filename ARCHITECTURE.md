# ARCHITECTURE.md — Codebasis-Leitfaden

Wer den Code übernimmt, liest zuerst `CLAUDE.md`, dann `ROADMAP.md` und
`HANDOVER.md`. Dieses Dokument wird nur für technische Details benötigt.

**Stand: Owner-Annotationspass v46 abgeschlossen (21.07.2026).** Kampagne, vier Märkte,
Familienhäuser, freiwillige Ziele, Objekt-Arcs, Arbeitsmodelle, Lebensphasen,
Admin-Panel, Tutorial, 13 breite Balance-Gates, eigener Familienmarkt-Harness,
Accessibility-Basis und statischer Release-Check sind vorhanden. Die wichtigsten
Invarianten sind Determinismus, fairer ETF-Kontrafaktualvergleich, genau einmal
verbuchte Geldflüsse, klar versionierte und kontrolliert abgelehnte Alt-Saves
und eine DOM-freie Engine.

## 1. Modulkarte und Abhängigkeitsrichtung

```text
index.html ─ lädt ─▶ js/main.js (Spielschleife, Autosave, ctx-Verdrahtung)
                         │
Engine: DOM-frei            UI: nur js/ui/, DOM erlaubt
────────────────────────    ─────────────────────────────
config.js    alle Annahmen  dashboard.js     Übersicht + Steuer
admin.js     Config-Whitelist ui/admin.js    Admin-Panel
state.js     State/RNG/Save marktplatz.js    Feed
starter.js   Sonderbestand
content.js   JSON-Inhalte   expose.js        Exposé/DD/Angebot
engine.js    Monats-Tick    finanzierung.js Nutzung + Kauf
market.js    Feed/Werte/DD  renovieren.js   Maßnahmen
gameplay.js  Prüfstand/Wirkungen
turnaround.js Triage/Banklinien turnaround.js Bankdialog
goals.js     freiwillige Ziele strategy.js Ziel-/Lebensplan
life.js      Arbeit/Lebensphasen
arcs.js      terminierte Objektgeschichten
finance.js   Kredit/Objekt  bewerber.js     Mieterauswahl
immobilie.js Objektart/Kosten karte.js      drei getrennte Stadtkarten
etf.js       Depotbuchung   bildzoom.js     Bild-Lightbox
                            finanzen.js     Tagesgeld/ETF
tenants.js   Mieter         objekt.js       Objekt-/Eigenheim-Nabe
renovation.js Renovierung   event.js        Dilemma-Modal
events.js    Dilemmas       verkaufen.js    Verkaufsdialog
signals.js   Wartemomente   tutorial.js      Bildschirm-Tour
eigenheim.js Eigennutzung   endgame.js      Endauswertung
tax.js       Jahressteuer   shell.js        Navigation/Slots
verkauf.js   Exit-Prozess   util.js         Formatierung
endgame.js   Scores/Benchmarks
iso.js       SVG-Fallbacks
ratgeber.js  kontextuelle Tipps für Leicht/Normal
```

**Eiserne Regel:** Engine-Module greifen weder auf DOM noch auf `localStorage`
zu. Sie müssen direkt unter Node importierbar bleiben. DOM-Zugriffe liegen nur
unter `js/ui/`. `iso.js` erzeugt Strings und bleibt daher headless nutzbar.

**Import-Zyklen:** Zwischen `engine`, `finance`, `tenants`, `renovation` und
`market` gibt es bereits zyklische Bindungen. Sie funktionieren nur, weil die
Imports erst innerhalb von Funktionen ausgewertet werden. Keine importierte
Funktion auf Modulebene ausführen.

**ctx-Muster:** `main.js` erzeugt einen UI-Kontext mit State-Zugriff,
Navigation, Rendering, Autosave, Ticksteuerung und Toasts. Neue Screens werden
über diesen Kontext angebunden. Kaufaktionen verwenden stabile Listing-IDs;
keine Array-Indizes über einen Feed-Rerender hinweg speichern.

**Initialisierungsreihenfolge:** Nach Content-Load und `newGame()`/Import laufen
`initialisiereMarkt()` und danach `initialisiereStartbestand()`. `starter.js`
darf damit stabile Listingdaten und faire Startwerte verwenden. Beide Schritte
sind idempotent. Endgame-
Kontrafaktuale verwenden dieselbe Reihenfolge, damit Sonderstarts dieselbe
Ausgangsbilanz erhalten.

**Editierbarkeit:** `newGame({ startAnpassung })` überschreibt ausschließlich
vor dem Start Profilwerte. Startalter, Kinderalter, anfängliches Tagesgeld und
ETF werden danach als historische Ausgangslage nicht mehr mutiert. Laufende
Haushalts-, Alters-, Spar- und Kapitalannahmen liegen in `state.config`; das
Admin-Panel plant sie whitelist-basiert für den nächsten Tick vor. Summen wie
`nettoEinkommen`, Gesamtausgaben und Sparrate werden aus den Eingabefeldern
abgeleitet und nie als unabhängige zweite Wahrheit editiert.

## 2. Tick-Pipeline und Determinismus

Der allgemeine RNG-Zustand liegt als `uint32` in `state.rngState`. Der
ETF-Vergleich besitzt mit `state.etfRngState` einen eigenen exogenen Strom;
`state.lebensRngState` zieht einmalig den Basis-Lebenshorizont.
Dadurch verändern Gutachten, Gebote oder Mieterentscheidungen nicht die
ETF-Renditen desselben Seeds. Lebensdauer verschiebt keinen dieser Pfade. Alle
drei Ströme sind Teil des Saves. Zufälligkeit
läuft über die RNG-Funktionen aus `state.js` — niemals über `Math.random()`.

`engine.tick()` hält diese Reihenfolge ein:

0. Vorgemerkte Admin-Config atomar anwenden und bevorstehende Lebensphasen
   genau einmal ankündigen.
1. Einkommensmeilenstein beziehungsweise Ruhestandsbeginn loggen und
   Haushaltswerte einschließlich des gewählten Arbeitsmodells berechnen.
2. Basiszins-Random-Walk (`tickBasiszins`).
3. Segmentdrift und Feed-Lifecycle (`tickMarkt`).
4. Mietobjekte in stabiler Portfolio-Reihenfolge ticken.
5. Eigenheim ticken, danach Steuerkonto/Dezember-Bescheid aktualisieren.
6. Cash, Tagesgeld/Dispo, echtes ETF-Depot und ETF-Spiegel verbuchen.
7. Zeitbudget einschließlich Arbeit/Eigenleistung und Familienzufriedenheit
   einschließlich des Arbeitsmodellziels aktualisieren.
8. `monat++`, dann fällige Immobilienverkäufe abschließen.
9. Statistik und Monatshistorie schreiben.
10. Den gespeicherten Lebenshorizont aus Seed und kumuliertem Langzeitstress
    aktualisieren, gegebenenfalls Lebensende setzen; sonst zuerst einen fälligen
    Objekt-Arc aktivieren, dann den allgemeinen Event-Roll (`rolleEvent`, feste
    RNG-Position) und danach `rolleAuftakt` ausführen. `rolleAuftakt` setzt vor
    dem ersten Kauf terminierte Auftaktmomente (Monate 2/5/9), läuft bewusst
    NACH dem RNG-Roll und verbraucht selbst keinen seeded RNG.

Renovierungsabschluss, abgeschlossener Verkauf, Mieterauszug,
Zinsbindungsende und vollständig getilgter Kredit melden einen transienten
Wartemoment über `signals.js`. `advanceMonths()` bricht danach im UI-Lauf ab;
`main.js` pausiert, erzwingt ein Autosave und zeigt eine wichtige Meldung.
Headless-Läufe verwerfen diese UI-Signale, damit Balance-Policies weiterlaufen.
Die Queue ist nicht enumerierbar und wird daher nie gespeichert.

Eine neue RNG-Ziehung oder eine andere Reihenfolge ändert alle Folgezustände
eines Seeds. Vor Release ist ein Versionssprung vertretbar, innerhalb derselben
Version nicht. Änderungen im Entscheidungslog dokumentieren.

## 3. Geldfluss: Cashflow ist nicht Nettovermögen

- `state.cash` ist Liquidität.
- `state.etfDepot` ist echtes, verkaufbares Vermögen; `state.etfVergleich` ist
  ausschließlich die Kontrafaktual-Linie.
- `state.kapitalsteuer` hält den gemeinsam verbrauchten Pauschbetrag und die
  kumulierte Kapitalsteuer. Tagesgeld und ETF greifen ausschließlich über
  `kapitalsteuer.js` darauf zu.
- `state.dealEntscheidungen` hält je Listing nur die aktuelle Wahl
  „beobachtet“/„verworfen“; `state.entscheidungsHistorie` hält kurze,
  strukturierte Abschlusswirkungen. `gameplay.js` leitet Prüfstand und
  Monatsanlass DOM- und RNG-frei aus dem vorhandenen Fachstate ab. Es gibt
  keinen parallelen Quest- oder Belohnungsstate.
- `state.turnaround` hält für den Schuldenberg nur den unveränderten
  Portfolio-Baseline-Cashflow und die Zahl verbrauchter Banktermine. Die
  konkrete Darlehensfolge liegt am betroffenen Kredit. `turnaround.js` leitet
  Triage und beide Linien DOM-/RNG-frei ab; es gibt keinen zweiten
  Portfolio- oder Zielstate.
- `state.entwicklung` hält nur aktive freiwillige Zielwahl, Arbeitsmodell,
  Startmonate und bereits angekündigte Lebensphasen. `goals.js` berechnet
  Fortschritt aus realem Fachstate; Zielwechsel verändern weder Cash noch RNG.
- `state.objektArcs` hält terminierte, objektbezogene Folgen mit stabiler
  Listing-ID. `arcs.js` aktiviert sie bei Fälligkeit über den normalen
  Eventvertrag und beendet sie sauber, wenn das Objekt nicht mehr existiert.
- Nettovermögen ist Cash plus echtes ETF-Depot plus faire
  Immobilienwerte minus Restschulden plus objektspezifische Rücklagen. Das
  Eigenheim wird identisch bewertet.
- `tickObjekt` liefert genau eine liquide Cash-Änderung. `engine.tick` addiert
  sie genau einmal.
- `finanzierungsCashflowPfade(state, angebot)` bewertet ausschließlich
  abgeleitete Bestands-, Miet-, Vermietungs- und Renovierungsszenarien. Die
  Funktion zieht keinen RNG, mutiert keinen State und liefert Einmalkosten,
  Risiko sowie Objekt-Cashflow nach vereinfachter Steuerschätzung an die UI.
  `ui/finanzierung.js` rendert das Ergebnis semantisch als `<output>`.
- `entnimmRuecklage(objekt, betrag)` mutiert nur die Rücklage und liefert den
  ungedeckten Rest. Im Tick verwenden.
- `zahleReparatur(state, objekt, betrag)` zieht Rücklage und danach direkt Cash.
  Nur außerhalb des Ticks verwenden.
- Verkaufserlöse werden erst am Ende des sechsten Monats über
  `tickVerkaeufe` verbucht und in den letzten Monatscashflow aufgenommen.
- Der ETF-Spiegel erhält die externe Sparrate des Gegenfalls „weiter mieten“.
  Auch nach einem Eigenheimkauf läuft dort die hypothetische Wohnmiete weiter;
  die Linie bekommt keine ersparte Miete ohne die zugehörigen Eigentümerkosten.
  Mieten aus Anlagen, Cashzinsen und Kaufumschichtungen werden nie gespiegelt.
- Das echte ETF-Depot erhält im Default 50 % der positiven Haushaltssparrate;
  die drei anderen Presets sparen zunächst nur ins Tagesgeld. Der verbleibende
  Anteil plus Tagesgeldzins bildet den angezeigten Tagesgeld-Cashflow.
- `etf.js` bucht einmalige Beträge in beide Richtungen, führt den proportionalen
  Einstand und ändert den bereits vorhandenen `sparplanEtfAnteil`. Verkäufe
  verbrauchen 30-%-Teilfreistellung und Pauschbetrag, aber keinen Zufall;
  sie verändern den letzten Monatscashflow nicht und werden über `main.js`
  sofort gespeichert. `ui/finanzen.js` enthält ausschließlich DOM und Vorschauen.

## 4. Phase-4-Systeme

### Eigenheim

`eigenheim.js` wandelt nur ein gekauftes, freies Listing mit mindestens der
konfigurierten Familien-Zimmerzahl und dem erforderlichen `familienScore` in
Eigennutzung um. `immobilie.js` zentralisiert Eignung, artabhängige Fixkosten,
Instandhaltung und Gebäudeanteil für WEG-Wohnung und Haus.
Es liegt separat in `state.eigenheim`, erzeugt keine Miete, trägt aber Kredit,
Hausgeld, Instandhaltung, Wert und Rücklage. Es hebt das Familienziel und
dämpft negative Kinderevents. Weitere Immobilien bleiben im `portfolio`.

### Steuern

`tax.js` sammelt pro Kalenderjahr Mieteinnahmen, abzugsfähige Kosten inklusive
tatsächlich gebuchter Instandhaltung, Zinsen und lineare AfA. Im Dezember wird
das signed Ergebnis mit dem einstellbaren Grenzsteuersatz verrechnet: Gewinn
ist Zahlung, Verlust bei vorhandenem Erwerbseinkommen Gutschrift. Ohne
Erwerbseinkommen bleibt ein persistenter Verlustvortrag. Das System ist bewusst
stark vereinfacht; Vorschau, Satz und letzter Bescheid sind sichtbar.

`kapitalsteuer.js` ist davon getrennt: Es besteuert positive Kapitalerträge mit
einem gemeinsamen Kalenderjahres-Pauschbetrag, 26,375 % Satz und beim Welt-ETF
30 % Teilfreistellung. Die Domänenmodule übergeben nur ihre jeweilige
Steuerbasis; UI-Vorschauen dürfen den Tracker nicht mutieren.

### Verkauf

`verkauf.js` verwaltet einen sechsmonatigen Prozess pro Objekt. Nach Ablauf
werden Maklerkosten, Restschuld und gegebenenfalls Spekulationssteuer abgezogen.
Das Objekt wird erst dann aus Portfolio oder Eigenheim entfernt. Während eines
Verkaufs bleibt es über dieselbe Detail-Nabe sichtbar. Vor dem Entfernen werden
aktive objektbezogene Zustände sauber behandelt.

### Endgame

`endgame.js` berechnet fünf Scores: Nettovermögen, nachhaltiger Cashflow,
Resilienz, Stress und Familie. Es simuliert vom gleichen Seed drei feste
Vergleichspolitiken neu: reiner ETF, Eigenheim-first und invest-first. Die
Objektgrenze zählt Eigenheim plus Mietobjekte, damit beide Immobilien-Policies
dieselbe maximale Gesamtzahl halten. Zusammen
mit der Spielerhistorie entstehen vier Linien. Diese Benchmarks sind
deterministische Orientierung, keine behaupteten optimalen Strategien.
Alle Vergleichspolitiken laufen exakt bis zum tatsächlich erreichten
Lebensende des Spielers; unterschiedliche Todeszeitpunkte dürfen den
Strategievergleich nicht verzerren. Ruhestand ist zuvor lediglich der
Einkommenswechsel auf `rentenNettoFaktor`.

## 5. Event-Fluss

- Ein Treffer setzt `state.aktivesEvent = { eventId, objektIndex, monat }`.
- Jeder tatsächliche Treffer erhöht `state.statistik.eventsGesamt`; der
  Balance-Harness nutzt den Zähler zur Schwierigkeitstrennung.
- `advanceMonths` stoppt bei einem aktiven Event. Im Browser pausiert die Zeit;
  Headless-Tests geben eine `autoResolve`-Funktion mit.
- `resolveEvent` selbst zieht keinen Zufall. Seed plus Optionsfolge bleibt
  reproduzierbar.
- Hausverwaltung und Energieklasse reduzieren jetzt die tatsächliche Eventlast,
  nicht nur den Beschreibungstext.
- Events mit `bedingung.nurArc` haben Gewicht null und sind vom zufälligen Roll
  ausgeschlossen. Eine Optionsdefinition `arc` plant ihre Folge; beim Auflösen
  schließt `resolveEvent` den aktiven Arc. Der Effekt `sondertilgung` reduziert
  Cash und Restschuld direkt, ohne die laufende Rate neu zu berechnen.

## 6. Save-Format und Vorab-Release-Kompatibilität

- Aktuelle `SAVE_VERSION`: **21**.
- Vor dem ausdrücklich erklärten Release akzeptiert `state.js` nur exakt die
  aktuelle Version in Hülle und State. Ältere und neuere Versionen werden mit
  verständlicher Fehlermeldung abgelehnt; es gibt keinen Migrationspfad.
- Import prüft die tragende Struktur und lehnt auch formal aktuelle, aber
  beschädigte Saves ab.
- Markt- und Startbestandinitialisierung bleiben idempotent und laufen
  in dieser Reihenfolge nach Neu/Laden/Import.
- Bei jeder weiteren State-Strukturänderung: Version erhöhen und Ablehnungs-
  sowie Current-Save-Roundtrip testen. Migration nur nach ausdrücklichem
  Owner-Auftrag.

## 7. Content und Assets

`content.js` hält Listings, Mieter und Events, lädt sie aber nicht selbst:

- Browser: `main.js` lädt `data/*.json` per `fetch`.
- Node: `test/simtest.mjs` liest dieselben Dateien direkt.

`iso.js` hält SVG-Fallbacks für künftige oder versehentlich fehlende Bilder
bereit; der aktuelle 40er-Katalog besitzt gemäß `ASSET_MANIFEST.md` jedoch für
jede ID eine Außenansicht und zwei Cutaways. Spielcode bleibt trotzdem vom
Vorhandensein einzelner Rasterdateien entkoppelt. Der vollständige warme
WebP-Batch ist der gemeinsame Style-Lock für Berlin, Leipzig und Meißen +
Umland.
Außen- und Innenbilder teilen die delegierte Zoom-Lightbox in `ui/bildzoom.js`.

### Lokaler Ein-Klick-Start

`BETONGOLD_STARTEN.cmd` ist der Windows-Einstieg für einen Doppelklick. Die
Datei startet `tools/start-game.mjs` mit dem installierten Node.js unsichtbar;
der Launcher liefert das Projekt ausschließlich auf `127.0.0.1` aus, bevorzugt
Port 4173 und öffnet den Standardbrowser. Ein bereits laufendes Betongold auf
diesem Port wird wiederverwendet. Andernfalls werden freie Ports bis 4183
geprüft.

Nur die vom Launcher ausgelieferte `index.html` erhält einen kleinen
Keepalive-Ping. Bleibt er drei Minuten aus, beendet sich der versteckte Server
selbst. Der Spielcode und die statischen Dateien bleiben unverändert, ein
Build-Schritt oder eine Runtime-Abhängigkeit im Produkt entsteht nicht.
Direktes `file://` bleibt verboten: ES-Module und JSON-Fetches benötigen HTTP;
außerdem soll der Origin für `localStorage` stabil bei `127.0.0.1:4173` bleiben.

## 8. UI- und Navigationsinvarianten

- `[hidden]` muss Screens zuverlässig aus dem Layout nehmen: Zu jedem Zeitpunkt
  ist genau ein Hauptscreen sichtbar.
- Marktfeed und Exposé werden nach strukturellen Änderungen vollständig neu
  gerendert; keine alten Kaufen-/Bieten-Aktionen stehen lassen.
- Mietobjekt und Eigenheim verwenden dieselbe Detail-Nabe. Steuerzustand steht
  direkt auf dem Dashboard, Verkaufsstatus direkt am betroffenen Objekt.
- Nach Kauf erscheint das Dashboard; „Objekt ansehen“ führt in einem Klick zum
  neuen Objekt. Kernaktionen sollen höchstens zwei Klicks entfernt sein.
- Das Admin-Panel bearbeitet nur die Whitelist in `admin.js`. Werte werden erst
  beim Übernehmen als `state.adminPending` vorgemerkt, begrenzt und mit der
  Partie gespeichert; `engine.tick()` wendet sie zu Beginn des Folgemonats an.
  Reset lädt zunächst nur Standardwerte ins Formular.
- Alle Hauptscreens sind programmatisch fokussierbar. Markt-Karten funktionieren
  per Enter, Navigation setzt `aria-current`, Charts besitzen dynamische
  Textalternativen. Tooltips müssen per Tastatur oder als dauerhaft verknüpfter
  Hilfetext erreichbar sein. `prefers-reduced-motion` wird respektiert.
- Die Spielhilfe pausiert die Partie, zeigt alle Regelkapitel dauerhaft offen
  und enthält acht nummerierte Schritte. `ui/tutorial.js` steuert eine optionale
  Tour nur über `zeigeScreen`; sie verändert keinen State.
- Die Game-Shell darf den Dokument-Viewport nie horizontal verbreitern. Die
  Topbar wrappt als vollständige Funktionsgruppen; KPI-Raster verwenden
  `minmax(0, …)`. Bei 1280 px sind Topbaraktionen, sechs KPIs und drei
  Marktplatzkarten vollständig innerhalb des Viewports.
- `SAVE_VERSION` versioniert ausschließlich persistente Zustände. Reines
  UI-Polish erhöht `UI_VERSION`; CSS- und alle lokalen Modulimporte folgen
  dieser separaten Version und lösen keine unnötige Save-Migration aus. Beim
  Versionssprung den vollständigen Importgraphen gemeinsam aktualisieren.
- `css/style.css` ist ausschließlich der geordnete Entrypoint. Die Kaskade
  verläuft über `foundation.css`, drei klar begrenzte Legacy-/Feature-Schichten,
  `warm-theme.css`, `app-shell.css` und zuletzt `annotation-fixes.css`. Neue
  Overrides gehören in die fachlich passende Schicht; keine CSS-Datei darf
  wieder zum ungeteilten Mehrgenerationen-Monolithen anwachsen.
- Der Browser-Smoke prüft dynamische Textzustände über berechnete Farben und
  WCAG-Kontrastverhältnisse. Für breite Zeitreihen muss `.chart-wrap` der
  einzige horizontale Scrollcontainer bleiben; Panel, Screen und Dokument
  dürfen dadurch nicht wachsen.
- Portfolio-, Cashflow-, LTV-, Eigenkapital- und Rücklagenbalken sind nur
  abgeleitete DOM-Darstellungen. Die exakten Tabellen-/Enginewerte bleiben die
  Quelle; Visualisierungen dürfen den State nie mutieren.
- Das Ownership-Board verwendet stabile Objekt-/Listing-IDs und zeigt Status
  zusätzlich als Text. Ein Objekt bleibt über Marktplatz, Exposé, Besitzkarte
  und Detail-Nabe visuell wiedererkennbar.
- Die sticky Ressourcenleiste zeigt genau drei laufende Werte: Cash,
  farbcodierten letzten Cashflow und echtes ETF-Depot. Nettovermögen ist kein
  permanenter Header-KPI; es bleibt in Zentrale, Finanzscreen und Endbilanz.
- Der Finanzscreen zeigt Tagesgeld, Immobilienportfolio und ETF; eine
  Einzelaktien-Sandbox existiert nicht mehr (vollständig entfernt, Save v21).
  Tagesgeld→ETF bleibt vermögensneutral; ETF-Verkäufe zeigen mögliche Steuer vor
  Bestätigung und verändern das Nettovermögen nur um diese Reibung.
- `ui/karte.js` rendert drei getrennte, schematische Karten für Berlin,
  Leipzig und Meißen + Umland sowie eine gleichwertige Liste aus denselben 40
  Listings. Marker öffnen ausschließlich vorhandene
  Exposé-/Objektwege; es existiert keine zweite Objektdatenhaltung.
- Das kompakte Spielmenü bündelt Hilfe, Einstellungen, Spielstände und Neustart.
  Meldungen erscheinen rechts unten, verblassen und bleiben im wiederöffnbaren
  Archiv erhalten. Der Header-Cashflow zeigt bei Hover/Fokus vier Kategorien;
  Klick öffnet die vollständige Haushaltsseite in der Zentrale.
- Mietobjekte wählen explizit zwischen regulärer, möblierter und befristeter
  Vermietung; Stadtregulierung, Ertrag, Aufwand und Rechtsrisiko werden aus
  derselben Objektkonfiguration abgeleitet. Eigenbedarf ist ein zeitgebundener,
  seeded Prozess mit möglichem Konflikt und Abfindung, keine Sofortaktion.
- Neue ästhetische Umbauten folgen `DESIGN_SYSTEM.md`. Ownership-Board, exakte
  Tabellen, kurze Kernwege und Reduced Motion sind dabei Invarianten.

## 9. Testen

- `node test/simtest.mjs`: mehr als 90 Checks, einschließlich kompletter
  Kampagnenläufe aller vier Startprofile, Save-Determinismus, Versionsablehnung, exakter Renovierungs- und
  Verkaufsdauer, Eigenheim, Jahressteuer, fünf Endscores und vier Linien.
- `node test/b0-economy.mjs`: vollständige 40-Listing-Matrix bei 80 % LTV,
  2 % Tilgung und zehn Jahren Zinsbindung; prüft Rohökonomie, State-/RNG-
  Reinheit, zustandsabhängige Miete und positive Pfade je Segment mit höchstens
  zwei sichtbaren Handlungen.
- `node test/e-gameplay.mjs`: vollständige E-Kernschleife mit drei
  Prüfhandlungen, RNG-neutralem Beobachten/Weggehen, bewusstem Warten und
  Save-Roundtrip.
- `node test/f-turnaround.mjs`: reproduzierbarer Schuldenberg mit priorisierter
  Triage, zwei kostenpflichtigen Linien, Gebühren/Mehrschuld, +600-€-Ziel,
  geschlossenem Bankfenster nach zwölf Monaten und Save-Roundtrip.
- `node test/gh-development.mjs`: freiwillige Ziele, Schimmel-/Nachbarschafts-/
  Finanzierungs-Arcs, Arbeitsmodelle, Lebensphasen, Eigenleistung und
  Save-Roundtrip.
- `node test/chat-contracts.mjs`: statische Querschnittsprüfung der 32
  Owner-Verträge aus dem Arbeitschat, darunter Presets, Zeitsteuerung,
  Header-/Menüstruktur, Hilfen, Karten, Vermietungswege, Eigenbedarf,
  Steuern, Launcher und explizit vertagte Ideen.
- `node test/family-market.mjs --seeds=300`: gepaarte Miete-/Wohnung-/Hausläufe,
  Finanzierbarkeit, artabhängige laufende Kosten, Contentstruktur und
  Dominanzgrenze.
- `node test/balance.mjs --seeds=300 --check`: 6.300 vollständige Strategieläufe
  plus Gutachter-Matrix. 13 Gates prüfen Mindest-EK, Eigenheim-Timing, selektiven
  Gutachterwert, strategieunabhängige ETF-Pfade und die messbare Abstufung von
  Ereignissen, Mängeln, Vermögen und Score über alle Schwierigkeiten.
- `node test/balance-regressions.mjs --seeds=300`: fünf kleine Gates isolieren
  Möblierung, Renovierungsrenditen, Grundrissbonus und Energie-Exposure. Sie
  bleiben absichtlich getrennt vom breiten Kampagnen-Harness.
- `node test/browser-smoke.mjs`: startet Edge/Chrome ohne Zusatzpakete headless
  und bedient Dashboard → Finanzen → Markt → Exposé → Finanzierung → Kauf →
  Portfolio. Zusätzlich prüft er beidseitige ETF-Umschichtung, Sparplan,
  Owner-UI-Verträge, Tutorial, Admin-Hilfen, Stadtkarte, Chartlabel ≥14 px und
  Responsive/A11y für Dashboard, Finanzen und Karte bei 1024/700/390 px. Nach jeder
  Navigation muss genau ein Hauptscreen sichtbar sein.
- `node test/launcher-smoke.mjs`: startet den Ein-Klick-Server ohne Browser auf
  einem freien Port und prüft Launcher-Marker, HTML-Injektion, Keepalive sowie
  korrekte MIME-Typen.
- `node test/release-check.mjs`: lokale HTML-/Modulreferenzen, JSON und eindeutige
  Content-IDs, den vollständigen versionierten Modulgraph, 33 Events und die
  Runtime-Assets unter 15-MB-Budget, Merge-Marker, Cachebuster und
  `.nojekyll`.
- `node --check` über alle JS-Dateien für Syntaxfehler.
- Betroffene Abläufe zusätzlich über einen lokalen HTTP-Server im Browser
  spielen. Im aktuellen Pass wurden zusätzlich die Bewerbermappe, sichtbare
  Leerstandskosten und drei Dossiers nebeneinander bei 1280 px geprüft.

## 10. Checkliste beim Erweitern

1. Formel zuerst in `ECONOMY_MODEL.md`, Parameter in `DEFAULT_CONFIG`.
2. Zufälligkeit ausschließlich über den State-RNG.
3. Neue State-Struktur: Save-Version erhöhen; alte Version ablehnen und aktuellen
   Roundtrip testen. Migration nur auf ausdrücklichen Owner-Auftrag.
4. Engine DOM-frei; UI nur unter `js/ui/`.
5. Strukturänderungen vollständig rerendern; IDs statt Feed-Indizes.
6. Simtest und einen realen Browserflow ausführen.
7. `HANDOVER.md` überschreiben und `DECISIONS.md` ergänzen.
