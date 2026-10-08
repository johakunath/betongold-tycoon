# CLAUDE.md — operative Projektbasis

Diese Datei ist der Einstieg für jeden Entwicklungsagenten. Vor Änderungen hier
beginnen; `AGENTS.md` enthält bewusst keine duplizierten Regeln.

## Produkt und Stand

**Betongold Tycoon** ist ein Entscheidungs-Labor für Haushalte: Immobilien-,
ETF-, Liquiditäts- und Eigenheimoptionen in komprimierter Zeit verstehen und
gefahrlos erleben. Die vier Startlagen sind entworfene Szenarien und bilden
keinen konkreten Haushalt ab; alle Annahmen sind im Startdialog und in den
Einstellungen editierbar. Es soll Mut zum Entscheiden
machen und Overplanning abbauen, ohne Renditen, Risiken oder Regulierung zu
beschönigen. Der Spaß entsteht aus verständlichen Konsequenzen und sichtbarem
Fortschritt, nicht aus Marketingversprechen. Die Kampagne ist vollständig
spielbar; Meißen + Umland, Familienhäuser, zentrale Karte, Quartalsbericht und Tutorial
sind integriert. Der eigene Finanzbereich bündelt Tagesgeld, Immobilienportfolio,
echtes ETF-Depot, beidseitige Umschichtungen und Sparplan. Einzelaktien sind
vollständig aus UI, Engine, State und Save entfernt; `data/stocks.json` und
`js/aktien.js` existieren nicht mehr. Eine atmosphärische Stadtbühne mit vier Segmenten,
regional unterschiedliche Vermietungswege, Eigenbedarf, ein Meldungsarchiv und
ein optionaler Ratgeber machen langfristige Konsequenzen besser sichtbar. Vier
bebilderte Startprofile decken Familienstrategie, klassischen Aufbau, hoch
verschuldeten Vielbestand und einen jungen Handwerker-Azubi ab. Ruhestand und
Lebensende sind getrennt: standardmäßig sinkt das Einkommen ab 67, der Run endet
seed- und stressabhängig zwischen 90 und 100. Der Objektkatalog umfasst jetzt
40 vollständige Angebote: 20 in Berlin sowie je 10 in Leipzig und Meißen +
Umland. Alle 40 IDs besitzen eine eigene Außenansicht und zwei passende
Zustands-Cutaways; SVG bleibt nur technischer Fallback. UI v36 setzt das
konsolidierte dunkle City-Builder-Handoff mit Goldakzent, Bottom-Navigation und
klar getrennten Finanzkennzahlen um. Die zuletzt gewählte Stadt bestimmt die
globale, klar erkennbare App-Kulisse und bleibt lokal über Screenwechsel und
Reloads erhalten. Cormorant Garamond und Alegreya Sans liegen lokal vor;
Tagesgeld und ETF werden über einen bidirektionalen Slider umgeschichtet. Die
Finanzseite zeigt Konten, Umschichtung und Vermögensmix in einer gemeinsamen
Desktop-Hierarchie; die Stadtbühne ergänzt leere Zustände um deaktivierte,
ehrlich als künftig markierte Katalogvorschauen. B0 bewertet in der
Finanzierung nun konkrete Bewirtschaftungspfade nach Steuer und sichert den
Abnahmekorridor mit einer reproduzierbaren 40-Listing-Matrix. Arbeitspaket E
verbindet reale Angebote jetzt zu Anlass → drei Prüfungen → Entscheidung →
Wirkung; Beobachten und ein guter Weggang sind gespeicherte, RNG-neutrale
Erfolge. Stadt und Quartalsbericht leiten daraus denselben Monatszug ab.
Arbeitspaket F macht den hoch verschuldeten Vielbestand zu einem echten
12-Monats-Turnaround: priorisierte Objekttriage, zwei kostenbehaftete
Stabilisierungslinien, höchstens drei Banktermine und sichtbare
Restschuld-/Exitfolgen ersetzen passiven Pufferabbau. Arbeitspakete G und H
ergänzen freiwillige, aus echtem State abgeleitete 3–8-Jahres-Ziele,
mehrmonatige Objektgeschichten sowie drei für jeweils zwölf Monate gebundene
Arbeitsmodelle. Lebensphasen werden rechtzeitig angekündigt; Eigenleistung
tauscht begrenzte Kostenersparnis gegen Zeit und zusätzliches Risiko. UI v45
ergänzt zum B1-Vereinfachungspass eine klar gegliederte Startvorschau, einen
breiten, kurzen Desktop-Startdialog sowie den gebündelten Owner-Annotationspass:
Dialogschutz bei ungespeicherten Änderungen, lesbarere Typografie/Kontraste,
stabile Stadtmarker mit Bildindex, begrenzte Range-Regler, unclippbare Tooltips
und eine sichtbare Sollzinsaufschlüsselung. Der Folgepass macht Vergleiche
visuell, vereint Eigenkapital und Tilgung in einem festen Finanzierungskopf,
vereinfacht Finanzbegriffe und ergänzt Bild-Panning sowie konsistente dunkle
Formularflächen. Das Exposé folgt der Handlungskette
Anlass → Prüfung → Entscheidung auch im Layout, jede Zahl und jede Aktion hat
genau eine Stelle, das Meldungsarchiv genau eine Quelle, und breite Viewports
bekommen eine Lesebreite statt Vollbildstreckung. Save v20/UI v46 ergänzt den
darauffolgenden Owner-Pass: aktuelle Berliner Angebotsmieten und Nachfrage,
gespeicherter Wohnort mit regionaler Einkommenswirkung, verrechenbare
Vermietungsverluste, Sondertilgung, nicht blockierende Mietersuche sowie eine
entwirrte Zentrale mit kompakter HUD-Erklärung. UI v47 schließt den anschließenden
23-Punkte-Annotationspass: Finanz-HUD und Bottom-Navigation sind gebündelt,
Exposé/Objektvergleich/Finanzierung lesbarer, Bildzoom und Kaufabschluss deutlich
visueller, und das Glockenpanel ist ein kategorisiertes, verlinktes Aktionsarchiv.
UI v48 schließt die offenen Befunde des Code-Inspector-Berichts: Die unveränderte
CSS-Kaskade ist in sieben geordnete Wartungsschichten zerlegt, der reale
Browser-Smoke misst nun die relevanten dynamischen Textkontraste nach WCAG und
erzwingt Chart-Containment samt internem Scrollen. Aktuell:
UI v49 reduziert dekoratives Gold zugunsten neutraler Strukturfarben und
erzwingt im deckenden Bottom-Dock genau einen aktiven Bereich. UI v50 hält die
drei Finanzwerte auch im zweizeiligen mittleren Desktop-HUD kompakt. UI v51
hebt auf breiten Desktops erklärende Kleinsttexte und Statuskontraste an.
UI v52 / Save v21: Drei terminierte, RNG- und ökonomisch neutrale Auftaktmomente
(Monate 2/5/9) beleben den Spielbeginn vor dem ersten Kauf (E2); der verbliebene
Einzelaktien-Code ist vollständig aus Engine, State, Save und Tests entfernt (B2).
UI v53 hebt auf breiten Desktops (ab 1201 px) die gesamte Kleinschrift —
HUD/Topbar, Startdialog, Zentrale, Karte, Exposé, Finanzierung, Bewerber,
Meldungen und Endauswertung — um rund 15 % gegenüber UI v51/v52 an.
UI v54 sichert alle sub-13-px-Stellen auf ≥ 13 px (Minimum-Pass), korrigiert
den HUD-Finanzgruppen-Überlauf mit explizitem flex-Layout (SVG + resource-copy
nebeneinander statt übereinander), behebt das Karten-Marker-Überlapp durch
`requestAnimationFrame`-Deferral in `entzerreMarker()`, blendet den
Quartalsbericht-Scrollbalken visuell aus und stellt eine
PowerShell-5.1-Encoding-Korruption (CP1252-→-UTF-8-Doppelkodierung) in
63 JS/HTML/MJS-Quelldateien rück.
UI v55 schließt einen Layout-/UI-Review ab (`REVIEW.md`): verengter
`.stadtkarte > svg`-Selektor gegen aufgeblasene Marker-Icons, schrumpffähige
HUD-Finanzgruppe, genau ein Scroller im Dock, geschlossene Breakpoint-Lücke bei
700 px, gestapelter Kopf für 701–760 px, durchgängig deutsche Dezimalkommata
über `fmtProzent()`, lesbare Kontokennzahlen und ein Resize-Handler für die
Kartenmarker.
UI v56 arbeitet den Rest des Reviews ab: 13 px sind die Schriftuntergrenze als
Basis (nicht nur ab 1201 px, per Smoke-Gate abgesichert), der tote
Inline-SVG-Kartenblock ist gelöscht, die Zentrale-Unterseiten verlassen unter
701 px das Dock zugunsten eines Streifens unter dem Kopf, Kopfhöhe und
Screen-Inset teilen sich `--topbar-h`, und der native Elementvertrag B1.3 ist
mit Button-Bildzoom, `aria-hidden`-SVG-Fallback und `<meter>` geschlossen.
UI v58 behebt zwei am echten Telefon gemeldete Kopfüberlappungen: Filterzeile
und Stadtleiste der Stadtbühne standen unter 701 px und im bis dahin
ungeprüften Band 921–1180 px übereinander. Alle drei HUD-Kacheln haben jetzt
dasselbe Zeilenlayout, „Haushaltsüberschuss" heißt überall „Cashflow", und der
Jahreszähler „Jahr 1/60" ist aus dem Kopf entfernt (Alter genügt). Der
Browser-Smoke misst Kopfüberlappung und abgeschnittene HUD-Texte jetzt selbst
und prüft zusätzlich 1100 px.
UI v59 schließt die letzte ungeprüfte Kopfzeilen-Lücke: Zwischen
`max-width: 1180px` und `min-width: 1201px` klaffte ein 20-px-Band (z. B.
1200 px, ein reales Tablet), in dem der einreihige Basiskopf nicht mehr passte
— Menü ragte über den Viewport, Datum lag auf der Cashflow-Kachel. Beide
Grenzen sind auf das Paar `1200.98px`/`1201px` gezogen; der Browser-Smoke
prüft jetzt zusätzlich bei 1200 px, ob Datum, HUD, Zeitsteuerung und Menü sich
weder überlappen noch aus dem Viewport laufen.
UI v60 behebt die Befunde des Gameplay-Reviews: Events prüfen Kindesalter,
Auto und Ruhestand, Kindergeld endet mit 25, der Finanzierungsdialog lässt
einen Restpuffer, und das Exposé beginnt wieder bei der Prüfung.
Save v22 setzt Arbeitspaket D um: ein Preisniveauindex (2 %) schreibt Mieten,
Objektkosten und Eventbeträge fort, Scores rechnen in heutigen Euro, sichere
Entnahme zählt als passiver Cashflow, und die Endauswertung zerlegt den
ETF-Abstand über eine Linie „Ohne Käufe". Dazu kommen reale Mietregeln
(15-%-Kappung, Mietpreisbremse in Berlin/Leipzig mit Modernisierungsausnahme),
ein Eigenbedarfsrisiko für Mieter statt eines Eigentums-Familienbonus, eine
Entnahmeregel gegen die Dispo-Falle sowie die Scores „Rentenlücke gedeckt"
und „Kaufkraft mit 85".
Aktuell: `SAVE_VERSION = 22`, `UI_VERSION = 60`.

Das Spiel ist öffentlich gehostet:
<https://johakunath.github.io/betongold-tycoon/> (GitHub Pages aus `main`).

Unter Windows startet `BETONGOLD_STARTEN.cmd` das unveränderte statische Spiel
per Doppelklick über einen unsichtbaren Loopback-HTTP-Server. `file://` bleibt
wegen ES-Modulen, JSON-Fetches und Origin-gebundenem Autosave ausdrücklich
unzulässig.

Autorität bei Widersprüchen: aktueller Owner-Auftrag → diese Datei →
`ROADMAP.md` → `PLAN.md` → Fachdocs. Entscheidungen werden in `DECISIONS.md`
protokolliert.

## Unverhandelbare Invarianten

- Vanilla-JS-ES-Module, statische Seite, kein Build-Schritt, keine Runtime-
  Dependencies. Lokal über HTTP starten, nie über `file://`.
- Engine bleibt DOM-frei. UI lebt in `js/ui/`; Engine-Module dürfen weder DOM
  noch `localStorage` auf Modulebene berühren.
- Spiellogik nutzt ausschließlich den gespeicherten, seeded RNG aus `state.js`.
  Kein `Math.random()` außer zur Erzeugung eines neuen, nicht angegebenen Seeds.
  Tick- und RNG-Reihenfolge nicht beiläufig ändern.
- Jede wirtschaftliche Annahme liegt in `DEFAULT_CONFIG`; Formeln und Bedeutung
  stehen in `ECONOMY_MODEL.md`. Keine versteckten Magic Numbers.
- Defaults bleiben plausibel, nüchtern beschriftet und als Annahmen erkennbar.
  Grafik darf warm und motivierend sein; Wirtschaftstexte dürfen nie blumig,
  drängend oder wie Anlagewerbung klingen.
- Bis zum ausdrücklich erklärten Release sind Spielstände Wegwerfstände:
  Persistente State-Änderungen erhöhen `SAVE_VERSION`, dürfen alte Saves aber
  kontrolliert ablehnen. Keine neue Migration ohne ausdrücklichen Owner-Auftrag.
  Reines UI/CSS erhöht nur `UI_VERSION`; Cachebuster in HTML und allen lokalen
  Imports angleichen.
- Listings, Mieter und Events bleiben Daten unter `data/`; IDs und Assetnamen
  sind stabil. `assets/` folgt `ASSET_MANIFEST.md` und bleibt insgesamt < 15 MB.
- Kernzustände und Hauptaktionen müssen sichtbar, tastaturzugänglich und in
  höchstens zwei sinnvollen Klicks erreichbar sein. Responsive und Reduced
  Motion bei UI-Arbeit mitprüfen.
- Bestehende User-Änderungen erhalten; kein Git-Reset und keine unnötigen
  Framework-/Architekturwechsel.

## Arbeitsablauf

1. `ROADMAP.md` und `HANDOVER.md` lesen, dann nur die betroffenen Fachstellen in
   `ARCHITECTURE.md` / `ECONOMY_MODEL.md`.
2. Einen klaren Arbeitsblock umsetzen. Neue Features oder V2-Ideen nicht aus
   dem aktuellen Auftrag ableiten; sie gehören nach `IDEEN.md` oder in die
   Roadmap nach Owner-Entscheidung.
3. Proportional testen. Mindestgate vor Übergabe:

```text
node test/simtest.mjs
node test/b0-economy.mjs                     # bei Objektökonomie/Finanzierung
node test/chat-contracts.mjs                  # querschnittliche Owner-/Chat-Verträge
node test/family-market.mjs --seeds=300       # bei Eigenheim/Objektarten
node test/balance.mjs --seeds=300 --check   # bei Ökonomie/Events/Strategien
node test/balance-regressions.mjs --seeds=300
node test/browser-smoke.mjs
node test/release-check.mjs
```

   Betroffenen Nutzerweg zusätzlich über lokalen HTTP-Server im Browser spielen.
4. Abgeschlossene Roadmap-Punkte aus `ROADMAP.md` entfernen und datiert nach
   `DONE.md` verschieben. `HANDOVER.md` auf den aktuellen Stand überschreiben;
   nur dauerhafte Entscheidungen nach `DECISIONS.md`.

## Dokumentkarte

| Datei | Ein Zweck |
|---|---|
| `ROADMAP.md` | nur aktive und kommende Arbeit, priorisiert |
| `DONE.md` | datiertes, kompaktes Abschlusslog |
| `PLAN.md` | stabile Produkt- und Scope-Spezifikation |
| `HANDOVER.md` | letzter technischer Übergabestand |
| `ARCHITECTURE.md` | Modulgrenzen, Tick, State und Save-Flüsse |
| `ECONOMY_MODEL.md` | Formeln und Balanceannahmen |
| `CONTENT_SCHEMA.md` | JSON-Verträge |
| `DESIGN_SYSTEM.md` | UI-Tokens, Komponenten, Art Direction |
| `IDEEN.md` | unverbindlicher V2-/Design-Ideenspeicher |
| `DECISIONS.md` | dauerhaftes Entscheidungslog |
| `PLAYTEST.md` | menschliches Testprotokoll |
