# PLAYTEST.md — menschliches Release-Gate

Ziel: Vor dem finalen Release prüfen, ob Regeln, Entscheidungen und Klickwege
ohne Erklärung von außen funktionieren. Seed-Matrizen prüfen Zahlen; dieser
Test prüft Verständnis und Spielgefühl. Technische oder automatisierte Läufe
werden klar von menschlicher Beobachtung getrennt.

## Laufende Owner-Annotationen 20.07.2026

| Stelle | Fund | Umsetzung / Abnahme |
|---|---|---|
| Dialoge | Hintergrundklick soll schließen, bei ungespeicherten Änderungen aber zuerst warnen | UI v44: zentraler Close-Guard für Hintergrund, Esc und Abbrechen; erzwungener Start und ungelöstes Ereignis bleiben geschützt |
| Stadtbühne und Ortsindex | Hintergrund unscharf/dunkel, Marker springen, Listenpunkte ohne Bild und zu hoch | UI v44: kein Bühnenfilter, ortsfester Fokus/Hover, kompakte 72 × 50-px-Vorschauen |
| Globale Lesbarkeit | Schrift, KPI-Kontrast, Header-Icons, Tabs, Slider und Tooltips schwer lesbar bzw. abgeschnitten | UI v44: größere Basis-/KPI-Schriften, höhere Kontraste, zentrierte Icons, Tab-Gaps, goldene 720-px-Regler und Top-Layer-Tooltips |
| Exposé und Finanzierung | Unnatürliche Ablehnungscopy, helle/Grün-Kontrastfehler und unklarer Sollzins | UI v44/45: „Angebot ablehnen“, dunkle Hinweisflächen, helles Verdikt und sichtbare Basiszins + Finanzierungsquote + Bindung-Zerlegung |
| Zweiter Annotationspass | Vergleich zu textlastig; Bankdialog zergliedert; Fachsprache, helle Inseln und mehrere Positions-/Interaktionsfehler | UI v45: farbige Abweichungen, zweistufige Finanzierung mit fixen Reglern, „Finanzierungsquote“/„typischer Planungsmonat“, dunkle Formflächen, Bild-Panning, Status-/Zeit-/Badge-Korrekturen und reparierte Tour |
| Familienpreset | Reisen und Kleinkindkosten zu hoch | 900 € Reisen, zusammen 300 € direkte Kosten für zwei Kleinkinder; steigende Staffel für Schule, Teenager und Ausbildung/Studium |
| Gesamter Startdialog bei 1305 × 979 px | Dialog ist zu schmal und dadurch unnötig hoch und lang | UI v43: bis zu 1160 px breit, vier Startlagen in einer Zeile; breiter als hoch, vollständig sichtbar und ohne horizontalen Überlauf |
| Startdialog, Startvorschau bei 1305 × 979 px | Vier konkurrierende Spalten zerlegen Werte in schmale, unruhige Textfragmente | UI v42: Überschrift, zwei gleich breite Vermögenswerte und volle Folgezeilen; kein horizontaler Overflow, Browser-Vertrag ergänzt |

## Technische Abnahme 22.07.2026 — Save v20 / UI v51

Bei mindestens 1201 px müssen Geldflusszeilen und die Steuerregel mindestens
13 px groß sein. Grüne Statusbadges verwenden dunkle Schrift auf einer hellen
Grünfläche; insbesondere „vermietet · Wohnen auf Zeit“ muss sofort lesbar sein.

Bei 1143 px zusätzlich prüfen: Keine der drei HUD-Finanzflächen wird höher als
44 px. Der zweizeilige Header darf seine Ressourcenzeile nicht mehr unnötig
strecken. Die letzten vier Stadtpost-Einträge müssen dieselben Symbole und
Farben wie ihre Pendants im Glockenarchiv besitzen. Langes Drücken eines
Dockbuttons darf bei Desktopbreite keine Scrollsteuerung einblenden.
Der Objektvergleich muss ab 701 px ohne horizontale Querleiste auskommen und
lange Titel umbrechen. Objektbilder dürfen am unteren Rand keinen durchgehenden
schwarzen Verlauf mehr zeigen; die drei Status-Pills bleiben lesbar.

### Vorheriger UI-v49-Pass

Im visuellen Shell-Sweep besonders prüfen: Auf Stadt, Marktplatz, jeder der drei
Zentrale-Unterseiten und Finanzen ist immer genau ein Bottom-Dockziel golden
aktiv. Die übrigen Dockflächen bleiben deckend und gut lesbar. Bei 1440 px sind
die drei Finanzwerte im Kopf höchstens 46 px hoch; gewöhnliche Überschriften,
Icons und Rahmen erscheinen neutral statt dekorativ golden. Primäraktionen und
der aktive Bereich bleiben als Goldakzent eindeutig erkennbar.

## Technische Abnahme 21.07.2026 — Save v20 / UI v48

Der Code-Inspector-Nachlauf ist automatisiert geschlossen. Der Browser-Smoke
prüft 41 konkrete dynamische Textzustände in HUD/Zentrale, Bewerberdossier,
Benachrichtigungen, Einstellungen, Marktplatz und Finanzierung gegen die
WCAG-Kontrastschwelle. Bei 1383 × 979 px erzwingt ein künstlich langer Chart,
dass ausschließlich `.chart-wrap` horizontal scrollt, während Chartkarte,
Zentrale-Screen und Dokument innerhalb ihrer Breite bleiben. Der CSS-Split ist
rein strukturell; im manuellen Lauf genügt daher ein kurzer visueller Sweep auf
ungewollte Kaskadenabweichungen.

## Frühere technische Abnahme 21.07.2026 — Save v20 / UI v47

UI v47 deckt den jüngsten 23-Punkte-Pass ab. Im nächsten manuellen Lauf
besonders prüfen: gemeinsame Tagesgeld-/ETF-Gruppe und permanente Zentrale-Tabs,
gleich breite Vergleichsspalten, Befundsymbole, großen Bildzoom, Notartermin-
Celebration, farbige/verlinkte Meldungen, jährliche Sondertilgungserinnerung und
die größere Bewerberkarte. Bei 1383–1408 × 979 px soll die Vermögens-Zentrale
ohne Seitenscrollen auskommen; bei langen Runs darf ausschließlich das Diagramm
intern horizontal navigieren.

## Technische Abnahme 21.07.2026 — Save v20 / UI v46

Der dritte gesammelte Annotationspass ist automatisiert umgesetzt. Im nächsten
menschlichen Lauf besonders prüfen: Berliner Mietersuche bei allen drei
Vermietungswegen, Schließen und Wiederfinden einer laufenden Suche,
Wohnortwarnung beim regionalen Eigenheim, ETF-Einsatz per Slider,
Sondertilgungs-Vorschau sowie die neue Zentrale-Navigation. Technische Gates
prüfen deterministische Bewerberrunden, einmalige regionale Einkommenswirkung,
signed Jahressteuer, 5-%-Jahresrahmen und die eine Ereignisquelle.

## Ablauf (45–60 Minuten)

1. Neues Spiel auf **Normal**, Seed `owner-normal`. Der Owner bedient
   selbst; nur bei einem echten Blocker helfen.
2. Mindestens zwei Exposés prüfen, ein Gebot abgeben und eine Finanzierung
   vergleichen. Slider sowie 0/10/20/30-%-EK-Schritte ausprobieren und dabei
   laut denken lassen.
3. Ein Objekt kaufen, vermieten und bis zum ersten Objekt-Event vorspulen.
4. In der Zentrale ein mittelfristiges Ziel setzen, im Haushalt ein
   Arbeitsmodell wählen und bei einer Renovierung die Eigenleistung vergleichen.
5. Eigenheim-Option für eine Wohnung und ein Haus sowie Verkauf öffnen.
6. Den Übergang in den Ruhestand beobachten, anschließend mit Turbo bis zur
   Endauswertung laufen und fünf Scores sowie vier Vergleichslinien erklären lassen.
7. Danach mindestens 15 Minuten auf **Schwer**, Seed `phase5-hard`, um die
   sichtbare Schwierigkeitsabstufung zu prüfen.

## Beobachtung statt Coaching

Je Fund notieren: Stelle/Monat, erwartete Wirkung, tatsächlich verstandene
Wirkung, benötigte Klicks und Schwere (Blocker / irreführend / Reibung / Wunsch).

Besonders beobachten:

- Wird innerhalb von 30 Sekunden ein sinnvoller nächster Schritt erkannt?
- Sind Tagesgeld, Cashflow, Zeit, Familie, Nettovermögen und ETF auffindbar?
- Werden Prüfung, Eigenkapital, Finanzierungsquote und laufende Kosten vor dem Kauf verstanden?
- Ist die 50/50-Aufteilung auf echtes ETF-Depot und Tagesgeld klar?
- Wird der Finanzbereich über Tagesgeld, ETF oder Hauptnavigation gefunden und
  werden einmalige Umschichtung und künftiger Sparplan unterschieden?
- Wird verstanden, dass das mittelfristige Ziel freiwillig ist, aus echtem
  Spielstand fortschreitet und keine Questprämie vergibt?
- Sind Geld-, Zeit- und Familienwirkung sowie die zwölfmonatige Bindung des
  Arbeitsmodells vor der Wahl klar?
- Wird Eigenleistung als Ersparnis mit zusätzlicher Zeit und höherem Risiko
  verstanden?
- Wird das Objekt über Karte/Zentrale wiedergefunden und in höchstens zwei
  Klicks geführt?
- Werden Kinderkosten als direkte Zusatzkosten und die Steuer nur als
  vereinfachte Vermietungssteuer verstanden?
- Fühlt sich der Monatsfortschritt wie eine Runde mit Folgen an?
- Sind Wartemomente, Ereignisursache, Objektbezug und Folgeaktion klar?
- Ist bei einer mehrmonatigen Objektgeschichte erkennbar, welche frühere
  Entscheidung die Folge ausgelöst hat?
- Kann die Person mindestens vier Endscores und den ETF-Gegenfall erklären?
- Wirken Mieten, Familienwohnung und Haus wie echte Abwägungen oder gibt es
  einen offensichtlichen Autopick?

## Bestehensgrenze

- Kein Blocker und kein verlorener Spielzustand.
- Kernaktionen in höchstens zwei Klicks ab der passenden Übersicht.
- Höchstens zwei irreführende Regeltexte; vor Release korrigieren.
- Mindestens vier der fünf Endgame-Scores werden ohne Hilfe richtig gedeutet.
- Normal und Schwer werden im Startdialog und im Spiel als verschieden erkannt.

Grafikstil und „Juiciness“ separat sammeln; die v36-Designbasis bleibt bestehen
und visuelle Wünsche dürfen Verständnisfunde nicht verdecken.

## Vorbereitung 20.07.2026 — Owner-Test Save v19 / UI v40

**Status:** Automatische Abnahme abgeschlossen; menschlicher Lauf noch offen.
Der nächste Owner-Test startet wegen des neuen Saveformats als neue Partie.
Besonders abzunehmen sind freiwillige Zielwahl, zwölfmonatige Arbeitsbindung,
Lebensphasenankündigung, Eigenleistungsabwägung und eine zeitversetzte
Objektfolge. Technische Gates für diese Wege sind grün, gelten aber nicht als
menschlicher Verständlichkeitsnachweis.

## Protokoll 16.07.2026 — technischer Moderationslauf

**Status:** Technische Wege abgeschlossen. Diese Beobachtungen belegen sichtbare
Zustände und Klickpfade, nicht menschliches Verständnis.

- Technischer Normal-Lauf: Exposés, Zoom, Gebot, alle EK-Shortcuts,
  ETF→Tagesgeld, Kauf, Objekt-Nabe, Verkauf und erstes Objekt-Event praktisch
  durchlaufen. ETF-Umschichtung blieb vermögensneutral.
- Schwer, Seed `phase5-hard`: 80 % Startvermögen, 95 % Einkommen, strengere
  Bank, höhere Eventlast und volatilere Welt sind im Startdialog und den
  Ressourcen sichtbar.
- Browser-Smoke bedient den Finanzbereich mit Tagesgeld→ETF, ETF→Tagesgeld,
  Sparplan und einer Aktienkauforder inklusive Gebühren, danach den vollständigen
  Immobilienkaufweg, Portfolio, Karte und einen Markerweg per Tastatur.
- 1024/700/390 px: Dashboard, Finanzen und Karte ohne Seitenoverflow; sichtbare Buttons
  besitzen Namen, Formfelder Labels, Bilder Alttexte und Kartenliste
  Fokusindikator.
- Ein echter Screenreader und physische Geräte wurden nicht simuliert.

## Direkter Owner-Browserreview 16.07.2026

**Rolle:** Owner  
**Form:** sieben annotierte Kommentare direkt auf der laufenden lokalen Seite  
**Gerät/Dauer:** vom Owner nicht angegeben  
**Einordnung:** echte menschliche UI-Rückmeldung, aber kein vollständiger
Normal-/Schwer-Run nach dem obigen 45–60-Minuten-Ablauf.

| Stelle | Owner-Fund | Schwere | Umsetzung / Nachweis |
|---|---|---|---|
| Spielhilfe | Keine Toggles; alles offen; Schritt-für-Schritt-Tutorial | Wunsch mit Verständlichkeitswirkung | 0 `details`, 6 dauerhaft offene Kapitel, 8 Schritte und funktionale Bildschirm-Tour; Browser-Gate grün |
| Haushalt, Kinder 3/0 | 800 € wirkt zu hoch | irreführende Annahme | 300 €/Kind direkte Zusatzkosten = 600 €; Grundbedarf bleibt in Lebenshaltung; Save-v8-Korrektur für V7-Owner-Save |
| Steuerkarte | Zu groß, Wirkung unklar | irreführend | kompakte Karte; Formel Miete − Kosten − Zinsen − AfA, nur positiver Überschuss, Dezember, Haushaltsnetto ausgeschlossen |
| Vermögenschart | Direktlabel zu klein; mehr hilfreiche Charts | Reibung/Wunsch | 14/15-px-Direktlabels; Vermögensmix und Schulden/LTV/Liquiditätspuffer ergänzt |
| Topbar-Cashflow | zentrale KPI gehört neben Tagesgeld und braucht Signal | Reibung | direkte Nachbarschaft; positiver Wert grün, negativer rot; DOM-Reihenfolge abgesichert |
| KPI-Fläche | Karten zu groß, nicht gruppiert, Icons fehlen | Reibung/Wunsch | drei kompakte Gruppen Liquidität/Vermögen/Alltag, sechs Symbole, responsive geprüft |
| Admin-Panel | Fragezeichen redundant zu sichtbaren Hilfen | Reibung | alle Admin-Tooltips entfernt; direkte Hilfetexte und `aria-describedby` bleiben |

Visuelle Nachkontrolle am damaligen Owner-Spielstand nach einmaliger
Save-Korrektur; der aktuelle Stand besitzt bewusst keinen Migrationspfad:
Kinderzeile `−600 €`, Sparrate `3.200 €` auf Schwer, ETF-Sparplan `−1.600 €`,
Tagesgeld-Cashflow `+1.720 €`; Korrektur von 200 € wird im Ereignislog genannt.

## Nachgereichter Owner-Browserreview 16.07.2026 — Bank & Depot

**Rolle:** Owner  
**Form:** ein annotierter Kommentar auf dem bisherigen ETF-Verkaufsmodal  
**Gerät/Dauer:** vom Owner nicht angegeben  
**Fund:** Aus dem reinen Verkaufsmodal soll ein „proper bank account and depot
screen“ mit Finanzaktionen werden.  
**Einordnung:** echter menschlicher Wunsch zur Informationsarchitektur; weiterhin
kein vollständiger Normal-/Schwer-Lauf.

Umsetzung und technischer Nachweis:

- Eigenständiger, pausierender Hauptscreen `Finanzen`, erreichbar über
  Tagesgeld, ETF-Depot oder Hauptnavigation in einem Klick.
- Tagesgeldkonto und Welt-ETF mit exakten Beständen, Zins-/Renditeannahme,
  Monatsrate, Liquiditätspuffer und gemeinsamem Vermögensmix.
- Einmalige Umschichtung Tagesgeld↔ETF mit Schnellwahlen und Vorschau; beide
  Richtungen verändern Nettovermögen, Benchmark, letzten Monatscashflow und
  RNG-Pfad nicht.
- Monatlicher ETF-Sparplan von 0 bis 100 % der positiven Haushaltssparrate;
  Änderung gilt ab der nächsten Monatsbuchung. Kontohistorie erklärt die
  ausgeführten Aktionen.
- Headless-Browserweg bucht 1.000 € hin, prüft konstantes liquides Vermögen,
  ändert und stellt den Sparplan zurück und bucht das Depot vollständig zurück.
  Visuelle Browserkontrolle am bestehenden Schwer-Save zeigt beide Konten,
  Vorschauen und die einspaltige 390-px-Fassung ohne Seitenüberlauf.

## Weiterer Owner-Browserreview 16.07.2026 — Cache & Zeitsteuerung

**Rolle:** Owner  
**Form:** fortlaufende annotierte Kommentare auf der laufenden lokalen Seite  
**Gerät/Dauer:** vom Owner nicht angegeben  
**Einordnung:** echte menschliche UI-Rückmeldung, weiterhin kein vollständiger
Normal-/Schwer-Run.

| Stelle | Owner-Fund | Einordnung | Umsetzung / Nachweis |
|---|---|---|---|
| altes ETF-Verkaufsmodal | Tagesgeld→ETF ergänzen; Aktien als späteres Epic | umgesetzt | Screenshot zeigt gecachtes Modal, das im aktuellen DOM nicht mehr existiert. `screen-finanzen` bucht bereits in beide ETF-Richtungen und enthält inzwischen die separat modellierte Aktien-Sandbox; Browser-Smoke prüft Transfer und echte Aktienkauforder. |
| Turbo und +1 M/+1 J | wirkt gestalterisch inkonsistent und deplatziert | Reibung | Zeitsteuerung in Automatik- und Schrittsegment geteilt; monochrome SVGs statt farbig gerendertem `⏩`, sichtbare Labels Pause/1 M/s/2 M/s/6 M/s sowie +1 Monat/+1 Jahr. Dreißig finanzielle Jahre dauern je nach Automatikstufe ungefähr 6, 3 oder 1 Minute; Browser-DOM-Vertrag aktualisiert. |
| Stadtkarte, Filter „Favoriten“ | ausgewählter Buttontext verschwindet beim Anklicken | Reibung | Fehlenden `--petrol`-Token ergänzt und den Farbwechsel des Auswahlzustands sofort statt zeitversetzt gemacht. UI v21; Browser-Smoke prüft sichtbaren Text, dunklen Hintergrund sowie Klasse und `aria-pressed`. |
| Topbar bei ca. 1.440 px | vier Finanzwerte abgeschnitten; Zeitsteuerung darf kleiner sein | Reibung | Brand-Spalte begrenzt, Ressourcenleiste auf mindestens 500 px priorisiert und Zeitautomatik auf Icons sowie `+1 M`/`+1 J` verdichtet. Browser-Smoke prüft bei 1.440 px alle vier Werte auf echte Textbreite. UI v22. |
| HUD zeigt „Schwer“ | Standardschwierigkeit soll Normal sein | Erwartungsklärung + Absicherung | Laufende Altpartie bleibt unverändert Schwer. `newGame()` nutzt bereits Normal; der Startdialog markiert nun ausdrücklich die ID `normal` statt die zweite Listenposition. Browser-Smoke prüft Auswahl und neuen HUD-Stand. |
| Finanzierung: deaktiviertes Eigenheim | beim gesperrten Feld fehlt der Grund | Blocker im Entscheidungsmoment | Gesperrte Option zeigt sichtbaren Begründungstext, Fokus-/Hover-Info, `title`, `aria-disabled` und `aria-describedby`; der Text nennt konkret Belegung, Zimmerzahl, Familieneignung oder bestehendes Eigenheim. |
| Finanzierung: Monatsbelastung | aktueller Gesamtcashflow und Wirkung nach Steuer fehlen | Blocker im Entscheidungsmoment | Neue Cashflow-Brücke startet beim HUD-Wert, zeigt Miete bzw. Mietersparnis, Rate, Fixkosten, Rücklage, entgangenen Tagesgeldzins sowie Gesamt vor und nach monatlicher Steuerschätzung. Leerstand und Grenzen der Prognose werden genannt; DOM- und Simtest sichern die Rechnung. |

`UI_VERSION = 23` erzwang für diesen Reviewstand frische HTML-/CSS-/Modulressourcen.
Nach Aktualisierung darf `dlg-etf` nicht mehr existieren; Tagesgeld oder ETF in
der Topbar führt stattdessen direkt zu `screen-finanzen`.

## Weiterer Owner-Browserreview 16.07.2026 — Lebensphasen

**Rolle:** Owner  
**Form:** annotierter Kommentar im laufenden Admin-Panel  
**Gerät/Dauer:** vom Owner nicht angegeben  
**Einordnung:** echte menschliche Regelrückmeldung, kein vollständiger
Normal-/Schwer-Lauf. Eine weitere Testperson ist nicht vorgesehen.

| Stelle | Owner-Fund | Einordnung | Umsetzung / Nachweis |
|---|---|---|---|
| Szenario-Werkstatt, Regeln | Kampagnenende erst mit 90–100; Todeszeitpunkt variabel nach Zufall und Stress | grundlegender Regelvertrag | Ruhestand ab 67 ist nun ein sichtbarer Einkommenswechsel auf 55 % statt Spielende. Eigener deterministischer Lebens-RNG wählt das Basisalter 90–100; kumulierter Zeitüberzug und negative Liquidität können es um höchstens vier Jahre innerhalb des Fensters vorziehen. Admin bietet Rentenalter, Renten-Netto, beide Lebensende-Grenzen und Stress-Einfluss. Simtest deckt Grenzen, Determinismus, Stresswirkung, Current-Save-Roundtrip und Ablehnung älterer Saves ab; Browser-Smoke prüft Startvorschau, Hilfe und Adminfelder. |

`UI_VERSION = 24` und `SAVE_VERSION = 11` kennzeichnen diesen Stand. Der
Owner-Volltest aus Arbeitspaket A bleibt offen; es wird kein menschlicher
End-to-End-Nachweis behauptet.

## Owner-Browserreview 17.07.2026 — Header-Hierarchie

**Rolle:** Owner  
**Form:** annotierter Kommentar auf dem laufenden Finanzscreen  
**Gerät/Dauer:** Browser-Viewport ca. 1.411 × 979 px; Dauer nicht angegeben  
**Einordnung:** echte menschliche Priorisierungsrückmeldung, kein vollständiger
Normal-/Schwer-Lauf.

| Stelle | Owner-Fund | Einordnung | Umsetzung / Nachweis |
|---|---|---|---|
| Topbar, Nettovermögen | Layout-technisch den laufenden vier Finanzkacheln gleichgestellt, für ständigen Einblick aber nicht relevant; KPI muss nicht im Header stehen | Informationshierarchie / Reibung | Nettovermögen vollständig aus der Topbar entfernt. Die Ressourcenleiste zeigt nun genau Tagesgeld, Monats-Cashflow und ETF-Depot; Nettovermögen bleibt in Zentrale, Quartalsbericht, Charts, Finanzscreen und Endbilanz. Browser-Smoke prüft Reihenfolge, Abwesenheit von `hud-netto`, volle Lesbarkeit bei 1.440 px sowie 1024/700/390 px ohne Seitenoverflow. UI v25. |

Zusatzentscheidung desselben Owner-Turns: Vor Release müssen alte Spielstände
nicht gerettet oder migriert werden. Diese Arbeitsregel ist in `CLAUDE.md` und
`DECISIONS.md` festgehalten. Der frühere v1–v11-Migrationspfad ist entfernt;
Import und Laden akzeptieren nur noch exakt die aktuelle `SAVE_VERSION`, was ein
neuer Simtest ausdrücklich absichert.

## Owner-Annotationen 17.07.2026 — Heimatmarkt, Kapitalsteuer und Tempo

**Rolle:** Owner  
**Form:** fortlaufende Browserkommentare und direkte Folgeaufträge  
**Gerät/Dauer:** Browser-Viewport ca. 1.382 × 979 px; Dauer nicht angegeben  
**Einordnung:** echter menschlicher Inhalts-/Regelreview, weiterhin kein
vollständiger unbeeinflusster Normal-/Schwer-Lauf. Eine weitere Testperson ist
nicht vorgesehen.

| Stelle | Owner-Fund | Einordnung | Umsetzung / Nachweis |
|---|---|---|---|
| Stadtkarte und vierter Markt | Statt des Küstenmarkts soll Meißen + Umland als reale Heimatregion dienen | grundlegender Contentvertrag | Segment, drei Listing-IDs, Adressen, Markt-/Mietrechtsannahmen, Karte, Filter, Tutorial und Assets auf Meißen-Cölln, Weinböhla und Käbschütztal umgestellt. Die Außenbilder wurden neu erzeugt; neutrale Cutaways erhielten die neuen stabilen IDs. |
| ETF-Karte „6,5 % p.a.“ | Nach Steuer ist die Rendite geringer; jährlicher Freibetrag pro Person fehlt | irreführende Annahme | 6,5 % heißt nun ausdrücklich Brutto-Marktrendite. Gemeinsamer Jahrespauschbetrag für Tagesgeld, ETF und Aktien, 30-%-ETF-Teilfreistellung, proportionaler ETF-Einstand sowie Brutto-/Steuer-/Netto-Vorschau und Netto-Liquidation sind modelliert. Familienprofile erhalten 2.000 €, der alleinige Azubi 1.000 €. |
| Zeitsteuerung | 1/2/6 Monate pro Sekunde sind für rund 30 relevante Finanzjahre weiterhin zu schnell | Spielgefühl / Lesbarkeit | Automatik auf 0,5/1/3 Monate pro Sekunde reduziert; 30 Jahre dauern damit ungefähr 12, 6 oder 2 Minuten. Einzelschritte bleiben +1 Monat/+1 Jahr. |
| Objektbreite | 19 mögliche Objekte sind langfristig zu wenig; mindestens 30 samt Bildern | vollständig umgesetzt | 40 stabile vollständige Listings: Berlin 20, Leipzig 10, Meißen 10; Feed/Lifecycle und komplette Balancematrix grün. Alle 21 neuen IDs besitzen je drei finale Bilder; Architektur-, Zustands- und Möblierungsvarianz wurden visuell geprüft. |

`SAVE_VERSION = 12` kennzeichnet ETF-Einstand und gemeinsamen
Kapitalsteuertracker; `UI_VERSION = 26` kennzeichnet Meißen, Nettoanzeigen und
die langsameren Zeitlabels. Der technische Nachweis wird gemeinsam über
Simtest, Familienmarkt, 300-Seed-Balance, Browser-Smoke, Release- und
Launcher-Gate geführt. Der Owner-Volltest bleibt davon getrennt offen.

## Technischer Nachlauf 16.07.2026 — Wertpapier-Sandbox und UI v19

**Status:** Vollständig automatisiert und visuell geprüft; kein Ersatz für das
Lautdenken des Owners.

- Drei Kontokarten zeigen Tagesgeld, Welt-ETF und Einzelaktien als getrennte
  Vermögensteile. Fünf fiktive Profile erklären Branche, Schwankung, Dividende
  und je eine Lernfrage ohne Empfehlung oder Livekursbezug.
- Kauf und Verkauf gegen Tagesgeld zeigen Orderkosten sowie beim Verkauf
  Einstand, Gewinn/Verlust und vereinfachte Steuer vor Bestätigung.
- Der Simtest belegt Gebührenwirkung aufs Nettovermögen, Steuer und Verlusttopf,
  Quartalsdividenden, den strategieunabhängigen eigenen Kurspfad und die
  vermögensneutrale v8→v9-Migration.
- Browser-Smoke führt eine reale Drei-Stück-Kauforder für MUM aus und prüft, dass
  Cash fällt, der Depotwert steigt und nur rund 5 € Orderkosten Vermögen
  vernichten. 1024/700/390 px bleiben ohne Seitenoverflow.
- Visuelle Kontrolle am bestehenden Owner-Save zeigt alle drei Konten und fünf
  Firmenkarten im erhaltenen warmen UI-v19-Pass. Kein neuer menschlicher
  Verständnisnachweis wurde behauptet.

## Technischer Nachlauf 16.07.2026 — zwei Sonderstartlagen

**Status:** Automatisiert verifiziert; kein menschlicher Preset-Playtest und
kein Ersatz für Arbeitspaket A.

- Der Startdialog zeigt vier getrennte Startlagen. Die Schuldenberg-Vorschau
  nennt fünf Mietobjekte und 93–97 % Finanzierungsquote; der Azubi nennt Handwerksbonus und
  Gesellenabschluss ab Jahr 4.
- Der Simtest übernimmt für den Schuldenberg fünf echte Listings mit rund
  1,54 Mio. € Restschuld, prüft identische Portfolios bei identischem Seed und
  einen unmittelbar negativen Immobiliencashflow.
- Beim Handwerker-Azubi sind Alter 17, 1.100 € netto, 2.500 € Tagesgeld,
  26 h Zeitbudget, geringere Renovierungskosten/-dauer/-risiken und der
  Einkommenssprung nach 36 Monaten abgesichert.
- Der damalige v9→v10-Pfad ergänzte fehlende Profilfaktoren, ohne
  Bestandsobjekte zu erfinden. Er wurde nach der Owner-Entscheidung für
  Wegwerf-Saves vollständig entfernt; aktuelle Saves müssen exakt v13 sein.

## Automatisierte Entscheidungsreferenzen nach den Owner-Fixes

### Familienmarkt — 300 gepaarte Seeds, Normal

| Vergleich | Vermögenssieg erstgenannt | Scoresieg | beides |
|---|---:|---:|---:|
| Wohnung gegen Miete | 100 % | 66 % | 66 % |
| Haus gegen Miete | 100 % | 66 % | 66 % |
| Haus gegen Wohnung | 59 % | 54 % | 42 % |

- Vergleichswohnung und -haus waren in 300/300 Seeds finanzierbar.
- Laufende Eigentümer-/Instandhaltungskosten: Wohnung 442 €/Monat, Haus
  499 €/Monat.
- Mittleres Endvermögen über den verlängerten Lebenshorizont: Miete
  13,294 Mio. €, Wohnung 21,933 Mio. €, Haus 21,977 Mio. €. Keine Strategie
  gewinnt Vermögen **und** Score in ≥90 % aller
  Paarungen; das Gate gegen einen vollständigen Autopick ist grün.

### Breite 300-Seed-Matrix

Auf Normal gewinnt „Heim zuerst, dann Invest“ beim Endvermögen in 95,7 % gegen
„2 Investments, dann Heim“, beim Gesamtscore in 57,0 % und in beiden Größen
gemeinsam in 56,3 %. Damit ist frühes Eigenheim vermögensstark, aber kein
Score-Autopick. Das menschliche Urteil darf diese Referenz bestätigen oder
widerlegen; noch keine weitere Balanceänderung ableiten.

### Gezielte Möblierungsregression

Im isolierten Zehnjahresvergleich gewinnt möbliert 129/300 Seeds; die mittlere
Differenz beträgt −4.587 €. Das 25–75-%-Trade-off-Gate ist damit grün.

## Für den Owner noch menschlich zu protokollieren

- Owner: vollständiger Normal-/Schwer-Lauf nach dem Ablauf oben; die sieben
  Browserkommentare ersetzen ihn nicht.
- Erster sinnvoller Schritt innerhalb von 30 Sekunden ohne Coaching.
- Vermietung/Leerstand/Renovierung und je ein Wohnungs-/Haus-Eigenheimweg.
- Monatsgefühl, Wartemomente, vier richtig erklärte Endscores und Vergleichslinien.
- Abgrenzung Tagesgeld vs. Welt-ETF vs. fiktive Einzelaktie sowie Wirkung von
  Orderkosten, Steuer und Einzelwertrisiko in eigenen Worten.
- Subjektives Urteil Wohnung vs. Haus vs. Miete mit Begründung.

Diese offenen Beobachtungen blockieren den finalen Release; Design- und
Assetarbeit sind davon unabhängig abgeschlossen.

## Owner-Annotationen 17.07.2026 — zusammenhängender 14-Punkte-Pass

**Rolle:** Owner  
**Form:** Browserannotation und direkte Folgeaufträge auf dem laufenden Spiel  
**Einordnung:** echte menschliche Rückmeldung an konkreten Screens; kein
vollständiger unbeeinflusster Kampagnenlauf. Eine weitere Testperson ist nicht
vorgesehen und deshalb weder Rolle noch offenes Gate.

| # | Owner-Fund | Umsetzung / Abnahme |
|---:|---|---|
| 1 | Meldungen sollen langsam verschwinden und erneut aufrufbar sein | Toastdauer verlängert; Glocke, Ungelesen-Zähler und Verlauf der letzten 50 Sitzungsmeldungen ergänzt |
| 2 | Alle Daten der Objektfakten brauchen Erklärungen | Zugängliche Fokus-/Hover-Tooltips für Lage, Eigentum, Fläche, Kosten, Zustand, Energie, Restschuld, Rücklage und Mieterdaten |
| 3 | Header-Cashflow soll Einnahmen und Ausgaben aufklappen | Hover/Fokus/Klick-Popover mit Haushalt, Objekten, Kapital, Steuer und Gesamtsumme |
| 4 | Spielstände für Nichttechniker erklären; Hostingwahl klären | Dialog erklärt Browser-/Geräte-/Domainbindung und JSON-Backup; README empfiehlt GitHub Pages als statischen Standard, Vercel für private/Preview-/Serveranforderungen |
| 5 | Mehr Features brauchen langfristig langsameren Takt und klarere Wirkung | Als offene, noch nicht vorentschiedene Systemidee in `IDEEN.md` aufgenommen |
| 6 | Presetbilder, stärker anderer klassischer Start, reales Profil neutral benennen | Vier eigene Bilder; „Familienstrategie mit Puffer“; klassischer 30-jähriger Single mit 35.000 € Cash, 5.000 € ETF und 25-%-Sparplan |
| 7 | Auf Leicht/Normal gelegentlich ein freundlicher Experte | „Mara“ gibt seltene zustandsabhängige Tipps mit mindestens zehn Monaten Abstand; Schwer bleibt ohne Tipps |
| 8 | Hilfe ist zu textlastig | Sechs dauerhaft offene Stichpunktkapitel und acht kurze Tutorials; Bildschirmtour bleibt |
| 9 | Hilfe, Spielstände, Neues Spiel und Szenario logisch gruppieren | Kompaktes Spielmenü; Szenario heißt „Einstellungen“; Meldungen bleiben separat |
| 10 | Separate detaillierte Stadtkarten fehlen | Eigenständige schematische Karten für Berlin, Leipzig und Meißen + Umland mit Straßen, Wasser, Parks, Quartieren, Markern und Liste |
| 11 | Reguläre, möblierte und befristete Vermietung regional realistisch abwägen | Drei Wege mit Mietansatz, Kosten, Aufwand, Wechsel, Leerstand und regionalem Prüf-/Rückzahlungsrisiko; Primärquellen in `ECONOMY_MODEL.md` |
| 12 | Negativer Objekt-Cashflow wirkt hart und braucht Erklärung/Minderung | Nullpunktmiete, Tilgungswirkung, Liquiditätslücke und Stellhebel direkt unter jeder negativen Monatsrechnung |
| 13 | Eigenbedarf für Spieler oder erwachsene Kinder | 3/6/9-Monatsfrist, möglicher Widerspruch, Abfindung/Rückzug und Eigenheim-/Familiennutzung umgesetzt |
| 14 | Immobilienportfolio braucht eine Finanzkontokarte | Zweite Karte nach Tagesgeld mit Eigenkapital, Objektzahl, Marktwert, Restschuld und Monatscashflow |

### Gemeinsame technische Testmatrix

- Syntax: 49/49 JS-/MJS-Dateien.
- Chat-Verträge: 22/22 aktuelle Owner-Anforderungen und bewusst vertagte Ideen
  statisch gegen Code und Dokumentation geprüft.
- Simtest: gesamte Kampagne einschließlich drei Vermietungswegen und
  Eigenbedarfsfreigabe grün.
- Familienmarkt: 300 gepaarte Seeds, alle Gates grün; Wohnung/Haus bleiben ein
  Trade-off, keine Strategie gewinnt Vermögen und Score in mindestens 90 %.
- Breite Balance: 300 Seeds × 3 Schwierigkeiten × 7 Strategien, 13/13 Gates.
- Gezielte Regressionen: 5/5; Möblierung 140/300 Siege.
- Browser-Smoke: vollständiger Kaufweg, 1440/1024/700/390 px, vier Presetbilder,
  Menü, Meldungsarchiv, Cashflow-Popover, vier Finanzkonten, drei Stadtkarten und
  Tastaturroute grün.
- Release/Launcher: 144 Modulimporte mit UI v31; 148 Live-Assets, 12,80 MB,
  keine Platzhalter und keine byte-identischen Listingbilder; Startdatei und
  MIME-/Keepalive-Verträge grün.

Die automatisierte Matrix belegt Funktion und Regressionen, aber nicht das
subjektive Verständnis eines vollständigen Owner-Laufs. Dieser bleibt als
einziges menschliches Playtest-Gate in Arbeitspaket A offen.
