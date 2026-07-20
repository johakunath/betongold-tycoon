# DONE.md — Abschlusslog

Kompaktes, chronologisches Log. Details älterer Sessions bleiben in
`DECISIONS.md` und den Fachdocs nachvollziehbar.

## 2026-07-20

- **B1-Vereinfachungspass als UI v41 abgeschlossen** (reines UI/CSS,
  `SAVE_VERSION` bleibt 19). Ausgangspunkt war ein vollständiger Spiel- und
  Layoutreview bei 390, 1280, 1440 und 2560 px:
  - **Exposé folgt der eigenen Handlungskette.** Vorher stand „Gebot abgeben"
    bei y≈1239 px, die Due Diligence aber erst bei y≈1654 px — die
    Kaufentscheidung wurde 535 px *vor* den Prüfwerkzeugen angeboten. Jetzt:
    Bild/Kernfakten → Due Diligence (y≈760) → Szenario/Gebot (y≈1026). Die
    18-zeilige Faktentabelle liegt aufklappbar unter den Kernfakten
    (`<details class="objekt-daten">`); die Seite ist von 1829 auf 1445 px
    gekürzt.
  - **Finanzen ist wieder in sich stimmig.** Der Vermögensmix rechnete mit dem
    Brutto-Marktwert (1.622.418 €) unter einer Nettovermögens-Überschrift
    (103.521 €). Er nutzt jetzt das bereits vorhandene `immoEigenkapital`; die
    drei Segmente summieren sich exakt auf die Überschrift. Zusätzlich folgt die
    DOM-Reihenfolge der visuellen (`.finanz-ueberblick` steht in `grid-column: 2`
    und jetzt auch an dieser Stelle im Markup).
  - **Eine Quelle je Inhalt.** Das Benachrichtigungspanel las bisher ein
    sitzungsflüchtiges Toast-Archiv mit Wanduhrzeit — inklusive „Gespeichert
    als …". Es liest nun `state.log` mit Spielmonat und übersteht Reloads.
    „Renovieren"/„Renovierungsplaner" öffneten denselben Dialog; die Aktion
    steht jetzt einmal kontextuell am leeren Objekt. Stadtbühne und „Orte hier"
    rendern nicht mehr dasselbe Array: Die Bühne bleibt räumlich inklusive
    „noch nicht erschienener" Vorschauen, die Liste ist der handlungsfähige
    Index.
  - **Navigation ehrlich.** Der Bottom-Nav-Punkt „Objekte" war ein Alias, der
    die Zentrale öffnete und deren Objekte-Tab klickte — fünf Einträge, vier
    Ziele. Der Punkt entfällt; `zeigePortfolio()` in `shell.js` ist der eine Weg
    zum Bestand, die Sonderfallverzweigung in `aktualisiereNavMarkierung()` ist
    weg. Ein Tab steuert nun genau ein Tabpanel
    (`#zentrale-panel-vermoegen` fasst Kacheln, Chart und Quartalsbericht).
  - **Breite und schmale Viewports.** Es gab nirgends eine Breitenbegrenzung:
    bei 2560 px lief `main` auf 2520 px, die Stadtbühne auf 1896 × 1193 px mit
    3,2 % Füllung. Neues Token `--inhalt-max: 1600px` plus Gate ab 1680 px
    zentriert die Screens (Füllung jetzt 6,3 %); zentriert wird über
    auto-Margins, weil `animation: screen-in … both` jede eigene
    `transform`-Deklaration dauerhaft überschreiben würde. Bei 390 px sind die
    beiden verbliebenen horizontalen Scrollleisten weg
    (`.ressourcenleiste` hatte `flex-shrink: 0`, `.karten-staedte button` eine
    Mindestbreite von 122 px). Der Chart behält seine bewusste Innenscrollfläche.
  - Als stale geschlossen, weil nicht reproduzierbar: doppelte
    `+1 Monat`/`+1 M`-Labels, fehlende zugängliche Namen bei kompaktem Menü,
    Kartenkollisionen bei 1280 px.
  - Verträge mitgeführt statt umgangen: `chat-contracts` prüft jetzt die neue
    Meldungsquelle (`log.slice(-40)`, `<time datetime=`, kein
    `meldungen.unshift`), `browser-smoke` die neue Bühne/Liste-Beziehung
    (`liste === marker - kommend`) und den Weg zum Bestand über den Zentrale-Tab.

- **Arbeitspakete G und H als Save v19/UI v40 abgeschlossen:** Drei freiwillige
  3–8-Jahres-Ziele — erstes stabiles Mietobjekt, Eigenheim und Bestand
  stabilisieren — leiten ihren Fortschritt ausschließlich aus Portfolio,
  Haushalt und Puffer ab. Zielwechsel und Pause kosten nichts, vergeben keine
  Belohnung und erzeugen keinen parallelen Queststate.
- **Mehrmonatige Objektgeschichten statt isolierter Popups:** Schimmel,
  Nachbarschaft und Zinsplanung können fünf planbare Folgetermine auslösen.
  Entscheidungen bestimmen Zeitpunkt und Folge; Zustand, Miete,
  Mieterzufriedenheit oder Restschuld ändern sich erst über den normalen
  Eventvertrag. Zufällige Events ziehen diese Arc-only-Inhalte nie direkt.
- **Arbeit, Familie und Eigenleistung mit echten Gegenwerten:** Balance,
  Karriere und Familienzeit sind für zwölf Monate gebunden und verändern
  Einkommen, verfügbares Zeitbudget und Familienziel gegensätzlich.
  Automatische Lebensphasen werden bis zu zwölf Monate vorher einmalig
  angekündigt. Eigenleistung spart gedeckelt 12 % beziehungsweise 20 % beim
  Handwerkerprofil, bindet monatlich Zeit und erhöht das Überziehungsrisiko.
  Alle Annahmen bleiben im Einstellungsdialog editierbar.
- **G/H-Abnahme grün:** `test/gh-development.mjs` sichert Ziele, drei Arc-Typen,
  Arbeitsmodelle, Lebensphasen, Eigenleistung und Save-Roundtrip. Browser-Smoke,
  Simulation, 27 Querschnittsverträge und Release-Check decken die native
  Strategie-/Haushalts-UI und UI-v40-Importe ab. Ein separates Ruf- oder
  Beziehungspunktesystem wurde bewusst nicht eingeführt.

- **Arbeitspaket F als Save v18/UI v39 abgeschlossen:** Der Schuldenberg zeigt
  auf dem Bestandsscreen eine nach Cashflow priorisierte Triage aller fünf
  Objekte mit Risiko, LTV/Zinsbindung, Eigenkapital/Exit, Arbeitslast und
  kurzfristigen Chancen. Zwei native Zielanzeigen messen mindestens +600 €
  Monatsentlastung und ein Planjahr Objektrücklagen.
- **Zwei echte Turnaround-Linien statt Gratisrettung:** „Bestand halten“
  kombiniert vier rechtssichere Mietprüfungen mit höchstens drei
  kostenpflichtigen Bankterminen innerhalb der ersten zwölf Monate. Die
  Anfangstilgung sinkt auf 0,5 %, Gebühren und Zeit fallen sofort an, die
  höhere Restschuld am Ende der Zinsbindung wird vor Bestätigung beziffert.
  „Verkleinern“ verkauft den größten Verlustträger erst nach sechs Monaten und
  weist beim Startfall den negativen Nettoerlös offen aus.
- **Abnahmekorridor reproduzierbar erfüllt:** Der Start liegt bei rund −3.302 €
  Objekt-Cashflow und −632 € Haushaltsüberschuss. Die Halte-Linie verbessert
  den Monat um rund 766 € bei rund 2.214 € Gebühren und hebt den Haushalt auf
  etwa +134 €, ohne den Objektverbund künstlich positiv zu rechnen. Nichtstun
  schließt nach Monat zwölf das Bankfenster. `test/f-turnaround.mjs`,
  Browser-Smoke, Save-Roundtrip und 26 Querschnittsverträge sichern den Pfad.

- **Arbeitspaket E als Save v17/UI v38 abgeschlossen:** Jedes offene Angebot
  führt nun sichtbar durch Anlass → drei reale Prüfungen → Entscheidung →
  Wirkung. Besichtigung, Dokumente und Gutachter zeigen Zeit, Kosten,
  Risikohinweise und sinkende Restunsicherheit mit nativen `<progress>`- und
  `<meter>`-Elementen; vollständige Prüfung verspricht ausdrücklich nie null
  Risiko.
- **Beobachten und guter Weggang sind echte, gespeicherte Entscheidungen:**
  Angebote lassen sich bewusst beobachten, begründet verwerfen oder erneut
  öffnen. Verwerfen entfernt den Favoriten, bindet kein Kapital, erhält das
  erworbene DD-Wissen und wird als Erfolg protokolliert; eine neue Marktrunde
  öffnet mit reduziertem Aufschlag wieder eine neue Chance. Diese Aktionen
  verbrauchen keinen RNG.
- **Monatsrhythmus und Abschlusswirkung verbunden:** Stadt und Quartalsbericht
  leiten aus Reservierung, Leerstand, Prüfung, Beobachtung oder bewusstem Warten
  denselben nächsten Zug ab. Kauf, Vermietung, Renovierungsstart/-abschluss,
  Hausverwaltungswechsel und behobene Mängel protokollieren kurze
  Vorher/Nachher-Wirkungen. `test/e-gameplay.mjs`, Browser-Smoke und
  Querschnittsvertrag sichern die neue Schleife und den Save-Roundtrip.

- **Arbeitspaket B0 als Save v16/UI v37 abgeschlossen:** Die Finanzierung
  bewertet nun ohne State-/RNG-Mutation Bestandsmiete, rechtssichere
  Mietprüfung, reguläre/möblierte/Zeitvermietung und eine kosmetische
  Renovierung. Ein natives `<output>` nennt den risikoärmsten Pfad zu positivem
  Objekt-Cashflow oder höchstens −100 €/Monat nach vereinfachter
  Steuerschätzung; sonst urteilt es ausdrücklich „auch stabilisiert
  untragfähig“. Einmalkosten, Umbauzeit, Wechsel- und Rechtsrisiko bleiben
  sichtbar.
- **40er-Matrix reproduzierbar gemacht:** `test/b0-economy.mjs` prüft alle
  Angebote bei 80 % LTV, 2 % Anfangstilgung und zehn Jahren Zinsbindung. Roh
  bleiben 1/40 positiv (Median −457 €/Monat); mit höchstens zwei vorhandenen
  Handlungen sind 7/40 nach Steuerschätzung positiv und 13/40 höchstens 100 €
  negativ. Jedes Segment besitzt mindestens einen positiven Pfad, darunter
  sechs Wohnungen; nicht jedes Objekt wird tragfähig.
- **Kosten- und Mietlogik korrigiert statt schöngerechnet:** WEG-Hausgeld,
  nicht umlagefähiger Owner-Anteil, separate Objektrücklage und höhere
  Hausinstandhaltung bleiben unverändert. Die Finanzierung verwendet für freie
  Objekte jetzt dieselbe zustandsabhängige Marktmiete wie die spätere
  Vermietung; `me-10` rechnet dadurch mit 202 statt fälschlich 218 €.
  Verlustverrechnung/-vortrag bleibt bewusst außerhalb des MVP; es gibt keine
  sofortige Steuererstattung auf negative Vermietungsergebnisse.
- **Vollständige Gates grün:** B0-Matrix, Simulation, 24 Chat-Verträge,
  300-Seed-Familienmarkt, 6.300 Strategie-Langläufe mit 13 Balance-Gates, fünf
  gezielte Regressionen, Browser-Kaufpfad/Responsive-A11y und Release-Check.

## 2026-07-19

- **UI-Review-Bereinigung als UI v36:** Tote Einzelaktien-UI (Renderer,
  ~110 Zeilen CSS, ungenutzte Icons, main.js-Callbacks) entfernt. Haushalts-
  und Objekt-Monatsrechnung zeigen jede Position nur noch einmal (Balken +
  Betrag statt Balken plus identischer Tabelle). „Nächster kluger Zug" hat
  eine gemeinsame Logik in kennzahlen.js; Bottom-Navigation folgt jetzt dem
  aktiven Zentrale-Tab (kein festhängendes „Objekte" mehr), Post öffnet den
  Haushalt-Tab. Zentrale-Tabs mit vollem Tabs-Muster (aria-controls,
  Tabpanels, Pfeiltasten), Stadtauswahl als aria-pressed-Filter,
  Info-Tooltips als echte Buttons, Kartentitel als echte Buttons statt
  role="link"/"button"-Artikeln; „Prüfen" entfiel (Karte selbst öffnet das
  Exposé). Key-Value-Blöcke (Kurzwerte, Quartals-KPIs, Objekt-Kennzahlen,
  Startvorschau) semantisch als dl/ul. Finanzen-Titel ohne Eyebrow-Dopplung;
  Stadt-Terminologie vereinheitlicht.

- **Referenzhierarchie als UI v35 nachgezogen:** Finanzkonten auf kompakte
  Karten reduziert; Umschichtung, eingebetteter Sparplan und Vermögensmix in
  den ersten Blickbereich gebracht. Die Stadtbühne zeigt bei nur einem aktiven
  Ort zusätzlich bis zu drei deaktivierte, klar als künftig markierte echte
  Katalogobjekte und verliert damit die ungewollte große Leerfläche.

## 2026-07-18

- **Handoff-Korrekturpaket als UI v34:** Cormorant Garamond und Alegreya Sans
  lokal inklusive OFL eingebunden; zwei ETF-Formulare durch einen
  bidirektionalen Live-Slider ersetzt; Sticky-Header und Markt-/Stadtabstände
  bereinigt; Emoji-Mieterfallback durch Linien-SVG ersetzt. Globaler Backdrop
  und Stadt-Washes sind deutlich heller, Hauptpanels lassen die gewählte Stadt
  appweit dezent durchscheinen.
- **Stadtauswahl steuert die gesamte App-Kulisse (UI v33):** Das zuletzt
  gewählte der vier Stadtbilder liegt nun bildfüllend hinter allen Screens und
  bleibt über Navigation sowie Reload lokal erhalten. Die Kartenbühne und der
  globale Hintergrund verwenden immer dieselbe Auswahl.
- **Konsolidiertes UI-Handoff als UI v32 umgesetzt:** Dunkle City-Builder-
  Leitstelle mit Goldakzent, festem Finanz-HUD und Bottom-Navigation auf die
  vorhandene Vanilla-JS-App übertragen. Stadt, Zentrale, Marktplatz, Exposé,
  Objektdetail, Finanzen und Bankdialog folgen der visuellen Referenz, ohne die
  Handoff-HTML zu kopieren oder Engine/Saveformat zu verändern.
- **Vier Stadtsegmente als echte Spielbühne integriert:** Berlin Innenstadt,
  Berlin Außenstadt, Leipzig und Meißen + Umland nutzen die vier Fullscreen-
  Hintergründe. Scharfe Marker verwenden reale Exposébilder; Familie, Post,
  Statusliste und nächster Zug bleiben zustandsgebunden und zugänglich.
- **Finanzsprache und Finanzierung geklärt:** Gemeinsame UI-Kennzahlen trennen
  normalisierten Haushaltsüberschuss, Objekt-Cashflow, Vermögensaufbau,
  Liquiditätspuffer und tatsächliche Tagesgeldänderung. Leerstand/Folgevermietung,
  WEG-Aufteilung, Nullsteuergrund sowie NK+0/10/20/30-%-Schnellwerte sind im
  dreistufigen Bankdialog sichtbar; der Cashflow-Klick bleibt stabil gepinnt.
- **Einzelaktien aus der Kern-UI entfernt:** Finanzen zeigt Tagesgeld,
  Immobilienportfolio und Welt-ETF. Engine-/State-Aufräumung bleibt als eigener
  Save-relevanter Roadmap-Pass bestehen.
- **Vollständige Verifikation grün:** 51 Syntaxchecks, Simulation,
  Chat-Verträge, 300-Seed-Katalog, Familienmarkt, 13/13 Balance-Gates, 5/5
  Regressionen, Browser-Kaufpfad und Responsive/A11y bei 1440/1024/700/390 px,
  Launcher sowie Release-Check. Stadt, Zentrale, Markt und Finanzen zusätzlich
  visuell im In-App-Browser ohne Konsolenfehler geprüft.

## 2026-07-17

- **Vier Fullscreen-Stadtkulissen für den späteren Design-Revamp:** Berlin
  Innenstadt, Berlin Außenstadt, Leipzig und Meißen + Umland besitzen nun je
  einen UI-freien 1672×941-Hintergrund in gemeinsamer hoher Schrägaufsicht.
  Blockrand, Siedlung/Hochhaus, Gründerzeit/Industriekanal und Elbtal/Hangstadt
  unterscheiden die Orte klar. Gebäudeanschlüsse, Straßen und Brücken wurden
  visuell geprüft; die vier WebPs belegen zusammen 1,33 MB. Noch keine
  Screen-Integration vorgenommen, damit der vollständige Claude-Entwurf die
  endgültige Komposition bestimmen kann.
- **Design-/Grafikreview und Arbeitspaket E abgeschlossen:** Der vorhandene
  warme Brettspiel-/City-Builder-Pass ist als verbindliches Designsystem
  bestätigt. Alle 21 neuen Listings besitzen jetzt je eine eigene
  Außenansicht sowie `unsaniert`-/`saniert`-Cutaways. Die Architekturmatrix
  umfasst unter anderem Blockrand, Hof-/Seitenflügel, Eckbau, Hochhaus,
  Reihen-/Doppelhaus, EFH, Siedlungshaus und Dreiseithof; unmöblierte Objekte
  bleiben in beiden Zuständen leer. Sieben fehlende Meißen-Cutaways wurden mit
  Imagegen ergänzt. Alle Platzhaltermarker sind entfernt; 148 Live-Assets
  belegen 12,80 MB. Daten-Fetches und kompletter Modulgraph nutzen UI v31.
- **Gezielter Cutaway-/Tür-QA abgeschlossen:** `br-02`, `bi-06` und `le-08`
  wurden in beiden Zuständen wegen überlappender, doppelter oder schwebender
  Türen neu erzeugt. Fünf ältere identische Zustandspaare wurden gefunden;
  `br-05`, `le-06`, `me-01` und `me-02` erhielten architektonisch passende
  Paare, `me-03` eine echte sanierte Variante. Der Release-Check vergleicht
  jetzt die Dateiinhalte aller 120 Listingbilder und lehnt Duplikate ab.
- **Reales Familienbudget und editierbare Lebensphasen:** Die beiden 24-Monats-Auswertungen
  plus persönliche Kosten beider Eltern ergeben gerundet 6.210 € Ausgaben
  inklusive bzw. 4.260 € ohne Reisen. Das Preset startet mit Kindern 3,5/0,6,
  520 € separat sichtbarem Kindergeld bis 27, 8.300 € Arbeitsnetto,
  je 90.000 € Tagesgeld/ETF, 2.610 € Sparrate und 50/50-Sparplan. Ab Monat 5
  greift eine editierbare 600-€-Autopauschale. Arbeitsnetto, Alltag, Reisen und
  Auto besitzen sichtbare Alters-/Rentenfaktoren; der Startdialog trennt 17
  Start- und Laufzeitfelder. Save v15, UI v30.
- **40er-Objektkatalog funktional bereit für Design:** 21 neue vollständige
  Angebote ergänzen den Markt auf Berlin 20, Leipzig 10 und Meißen + Umland 10.
  Berlin enthält 7 Häuser; Zustände 1–5, EG/Souterrain, Neubau, guter Bestand,
  vermietete und unmöblierte Fälle sind breit verteilt. Ein nach Städten,
  Haus und Sanierungsfall balancierter Fünfer-Start, 1–2-Monats-Erstumlauf und
  längere Wiederkehr halten im 300-Seed-Test langfristig Ø 6,8 Angebote
  sichtbar. Save v14, UI v29. Der finale 63-Bilder-Batch bleibt gemäß
  Owner-Auftrag bis nach dem Design-Revamp offen; 21 SVG-Platzhalter sind
  explizit und 56 Bildentwürfe separat gesichert.
- **Vollständiger Chat-/Layout-Abschlussaudit:** 22 aktuelle Owner-Verträge in
  einem eigenen Gate gebündelt und gegen Code, Dokumentation und vertagte Ideen
  geprüft. Presetkarten wieder als kompakte Bild-über-Text-Karten gerastert;
  mobile Chart-Überbreite beseitigt und alle sechs Zeitaktionen bei 390 px
  erreichbar gemacht. Syntax, Simulation, 300-Seed-Balance, Browser bei
  1440/1024/700/390 px, Release und Ein-Klick-Launcher grün. UI v28.
- **14-Annotationen-Paket abgeschlossen:** Wiederaufrufbare Meldungen und
  langsame Toasts, vollständiger Cashflow-Hover, kompaktes Spielmenü,
  stichpunktartige Hilfe, Spielstand-Erklärung, zugängliche Objektfakten sowie
  negative-Cashflow-Hilfe als ein konsistenter Verständlichkeitspass umgesetzt.
- **Neue Entscheidungswege:** Drei regional differenzierte Vermietungsmodelle
  mit Mehrertrag/Aufwand/Rechtsrisiko und vereinfachter Eigenbedarf für den
  eigenen Haushalt oder erwachsene Kinder samt 3/6/9-Monatsfrist,
  Widerspruchs- und Abfindungspfad. Save v13.
- **Orientierung und Start:** Vier eigene Presetbilder, neutral benannte
  Familienstrategie, deutlich anderer klassischer Einstieg, seltener
  Easy/Normal-Ratgeber sowie eigenständige schematische Detailkarten für Berlin,
  Leipzig und Meißen + Umland ergänzt.
- **Finanzen vervollständigt:** Immobilienportfolio als zweite Kontokarte neben
  Tagesgeld mit gebundenem Eigenkapital, Wert, Restschuld und Monatscashflow.
  Gemeinsamer Browser-, 300-Seed-, Release- und Launcher-Lauf grün; UI v27.
- **Header auf laufende KPIs fokussiert:** Nettovermögen aus der permanenten
  Ressourcenleiste entfernt. Tagesgeld, farbcodierter Monats-Cashflow und
  ETF-Depot erhalten den frei gewordenen Raum; Nettovermögen bleibt vollständig
  in Zentrale, Charts, Finanzübersicht und Endbilanz. Desktop- und Responsive-
  Browserverträge wurden auf drei Werte umgestellt. UI v25.
- **Pre-Release-Saves sind Wegwerfstände:** Künftige State-Änderungen müssen
  keine alten Spielstände migrieren. Save-Versionen dürfen bewusst brechen;
  Migration nur noch nach ausdrücklichem Owner-Auftrag. Der bisherige
  v1–v11-Migrationspfad samt Tests wurde entfernt und durch eine klare
  Versionsablehnung ersetzt.

## 2026-07-16

- **Ruhestand und variables Lebensende:** Das feste Kampagnenende mit 67 ist
  durch einen Einkommenswechsel auf 55 % Renten-Netto ersetzt. Ein eigener
  deterministischer Lebens-RNG setzt das Basisende zwischen 90 und 100;
  langfristiger Zeit-/Liquiditätsstress kann es begrenzt vorziehen, nie unter
  90. Admin, Hilfe, Startvorschau, HUD und Endbilanz erklären die Lebensphasen.
  Das nominale Vermögensziel wurde für den langen Horizont von 2,6 auf 15 Mio. €
  neu kalibriert; 13/13 Balance-Gates bleiben grün. Save v11 öffnet alte
  Renten-Endstände ohne Historienänderung; UI v24.
- **Finanzierung erklärt die Monatswirkung:** Eine Cashflow-Brücke beginnt beim
  aktuellen HUD-Gesamtcashflow und zeigt Miete/Mietersparnis, Rate, laufende
  Kosten, Rücklage, veränderten Tagesgeldzins sowie den Gesamtwert vor und nach
  geschätzter Vermietungssteuer. Leerstand wird mit 0 € Miete gerechnet. Eine
  gesperrte Eigenheimwahl nennt ihren konkreten Grund sichtbar und barrierearm.
  DOM-freie Rechen- und Browser-Gates decken beide Owner-Funde ab. UI v23.
- **Desktop-Header priorisiert Finanzwerte:** Zwischen 1.201 und 1.500 px wird
  die leere Brand-Spalte begrenzt, die Ressourcenleiste auf mindestens 500 px
  gestärkt und die Zeitsteuerung auf Icons sowie `+1 M`/`+1 J` verdichtet.
  Browser-Gate bei 1.440 px verbietet abgeschnittene Geldwerte und bestätigt
  `Normal` als expliziten Standard eines neuen Spiels. UI v22.
- **Stadtkarte: aktiver Filter bleibt lesbar:** Fehlenden semantischen
  `--petrol`-Token ergänzt. Dadurch behalten ausgewählte Kartenfilter ihren
  dunklen Hintergrund statt weißer Schrift auf heller Fläche; Marker- und
  Statusfarben verwenden denselben gültigen Token. Browser-Gate prüft Text,
  Aktiv-/ARIA-Zustand und sichtbaren Hintergrund. UI v21.
- **Zwei spielbare Sonderstarts:** „Viel Bestand, wenig Luft“ übernimmt fünf
  echte vermietete Objekte mit rund 1,54 Mio. € Restschuld, 93–97 % LTV und
  knappem Puffer. „Junger Handwerker-Azubi“ startet mit 17, 1.100 € netto,
  hohem Zeitbudget, planmäßigem Gesellenlohn ab Monat 36 sowie günstigeren,
  kürzeren und risikoärmeren Renovierungen. Save v10 verhindert rückwirkende
  Bestände in Altspielständen; UI v20 erklärt beide Profile im Startdialog.
- **Karriere-Idee gesichert:** Interaktive Weiterbildung, Meisterschule,
  Jobwechsel, Überstunden, Teilzeit und Selbstständigkeit mit transparentem
  Gehalts-/Zeit-/Familien-Trade-off stehen als spätes Konzept in `IDEEN.md`.
- **Lesbare Kampagnengeschwindigkeit:** Automatik von 2/12/60 auf 1/2/6
  Monate pro Sekunde reduziert. Dreißig finanzielle Jahre dauern damit etwa
  6/3/1 Minuten; +1 Monat und +1 Jahr bleiben bewusste Einzelschritte. UI v19.
- **Owner-only-Playtest:** Release-Gate, Ablauf, Seed-Beispiel, UI-Platzhalter
  und Übergabedokumente auf einen alleinigen Owner-Test bereinigt. UI v18;
  Save und Ökonomie bleiben unverändert.
- **Wertpapier-Sandbox (ehemals Arbeitspaket D):** Fünf fiktive Unternehmen,
  eigenes Depot, ganze Stücke, Orderkosten, Einstand, vereinfachte Steuer mit
  Verlusttopf, Quartalsdividenden und Firmenereignisse umgesetzt. Separater
  Aktien-RNG, Save-v9-Migration ohne erfundenes Altvermögen und vollständige
  Engine-/Browser-/Content-Gates sichern die Abgrenzung zum Welt-ETF.
- **Bewahrter Owner-Designpass:** Der bereits gute warme UI-v19-Stand bleibt mit
  klaren Finanzkonten, Karten-/Dialogtiefe und sauber umbrechender Topbar
  erhalten. Der vollständige Claude-Design-/Grafik-Review bleibt auf Wunsch
  offen und wird nicht fälschlich als abgeschlossen protokolliert.
- **Balance-Nachlauf:** Ein gezieltes Gate deckte die zu häufig dominante
  Möblierung auf. Einmalige Einrichtungskosten wurden auf 9.500 € kalibriert;
  der 300-Seed-Zehnjahresvergleich liegt nun bei 112/300 Siegen und alle fünf gezielten
  Regressionen sind grün.
- **Windows-Ein-Klick-Start:** `BETONGOLD_STARTEN.cmd` startet einen
  unsichtbaren Loopback-HTTP-Server, öffnet den Standardbrowser, verwendet nach
  Möglichkeit den bestehenden Autosave-Origin auf Port 4173 und beendet sich
  nach geschlossenem Tab selbst. Eigenes Launcher-Smoke-Gate ergänzt.
- **Owner-Folgefund Zeitsteuerung:** Emoji-/Textmix durch zwei konsistente
  Segmentgruppen ersetzt: monochrome SVGs für Pause/2 M/s/1 J/s/5 J/s und
  ausgeschriebene +1-Monat-/+1-Jahr-Schritte. Engine-Geschwindigkeiten bleiben
  unverändert; Browser-Gate sichert Struktur und Labels. UI v15.
- **Owner-Folgefund Bank & Depot:** Das kleine ETF-Verkaufsmodal wurde durch
  einen eigenen Finanzscreen ersetzt. Tagesgeldkonto, ETF-Depot, liquider
  Vermögensmix, Puffer, Zins-/Renditeannahmen, Kontohistorie, beidseitige
  vermögensneutrale Umschichtung und ein 0–100-%-ETF-Sparplan sind in höchstens
  einem Klick erreichbar. Navigation startet oben; UI v14.
- **Restbacklog vor Design abgeschlossen:** Rostock als vierter Markt,
  19 Listings, vier echte Häuser, artabhängige Kosten/Bewertung,
  Familien-Eignung, fünf neue Außenansichten, zehn Cutaways und eigenes
  300-Seed-Familienmarkt-Gate umgesetzt.
- **Zentrale Stadtkarte und Walter-Muster:** abstrakte Drei-Ebenen-Karte mit
  stabilen IDs/Listenalternative, Quartalsbericht, strukturierte Chronik,
  kontextabhängige Objektführung, erweiterte Finanzierungs-/Renovierungswerte
  und private Endbilanz funktional integriert.
- **Sieben Owner-Browserfunde:** Hilfe dauerhaft offen plus achtstufiges
  Tutorial, Kinderkosten 600 €, kompakte erklärte Steuer, 14/15-px-Chartlabels,
  Vermögensmix und Schulden/Puffer, Cashflow neben Cash, kompakte KPI-Gruppen
  mit Symbolen und konsolidierte Admin-Hilfen. Bestehende V7-Owner-Saves
  migrieren über Save v8; UI v13.
- **Vollständige Verifikation:** Simtest, 300-Seed-Familienmarkt, 13/13 breite
  Balance-Gates, 5/5 gezielte Regressionen, erweiterter Browser-Smoke inklusive
  1024/700/390 px sowie Release-Check mit 116 Importen und 81 Assets grün.
- **Arbeitspaket A, erster bestätigter UI-Fund:** Der Vermögenschart verwendet
  nach Kauf, ETF-Umschichtung oder Ereignisentscheidung nun sofort den aktuellen
  Zustand statt den letzten Monatssnapshot irreführend als „aktuell“ zu
  bezeichnen. Browser-Smoke sichert die Kauf-Synchronität ab; `UI_VERSION = 10`.
- **Externer Spielbenchmark „Der Walter“:** Marktplatz, Finanzierung, Kauf,
  Mietersuche, fünf Quartale, Renovierungs-, Kredit-, Versicherungs- und
  Steueransichten praktisch getestet. Übertragbare Muster und bewusste
  Abgrenzungen stehen in `IDEEN.md`; die priorisierten UX-Prüfpunkte sind in
  `ROADMAP.md` Arbeitspaket B und `PLAYTEST.md` verankert. Keine Spielmechanik
  oder fremde Ökonomie ungeprüft übernommen.
- **Session-Abgleich:** Alle umsetzbaren Wünsche des langen Arbeitschats gegen
  Code, Tests, `DONE.md`, `HANDOVER.md` und `ROADMAP.md` geprüft. Offene Punkte
  sind bewusst geplante Folgearbeit und keine vergessenen Implementierungen.
  Alle fünf Projekt-Gates wurden erneut ausgeführt und bestanden.

## 2026-07-15

- **Phase 1–3:** State/Tick/Saves, Markt, Due Diligence, Finanzierung, Kauf,
  Renovierung, Mieter, Bewirtschaftung und Events als spielbarer Vertical Slice.
- **Stabilisierung 0A–0C:** gestapelte Screens und veraltete Exposé-Aktionen
  behoben; Renovierungsdauer korrigiert; Save-Import gehärtet; Grundriss-
  Wertbonus, Energiesanierung und Hausverwaltung wirksam gemacht; Möblierung,
  Renovierungen und dominante Eventantworten ausbalanciert.
- **Phase 4:** Eigenheim, vereinfachte Jahressteuer, sechsmonatiger Verkauf,
  fünf Endscores, drei Seed-Kontrafaktuale und Entscheidungstimeline.
- **Phase 5:** Admin-Panel, drei Schwierigkeiten, Spielhilfe, Tooltips,
  Accessibility-Basis, Balance-Harness mit 13 Gates und statischer Release-Check.
- **Designpass 0H:** responsive Game-Shell, Ownership-Board, Geldfluss-/LTV-/
  Rücklagenvisualisierung, Eventfeedback, Designsystem und Asset-Style-Lock.
- **Initialer Code-Inspector-Befund:** alle zehn Hauptprobleme bearbeitet;
  Save-Metadaten/-Validierung, UI-Rerender, Renovierungsdauer/-Wirkungen,
  Möblierung, Verwaltung, Events und Strategie-Extremfälle durch Tests abgesichert.
- **Startlagen, Spiel-Look und Bildzugriff:** Default auf Alter 40, 90.000 €
  Tagesgeld, 50.000 € verkaufbares ETF-Depot und Kinder 3/0 umgestellt; klassisches
  Preset erhalten; Default-Haushalt mit 8.000 € Netto, 4.600 € Ausgaben,
  1.970/1.570 € Warm-/Kaltmiete, Reiseblock, 50/50-ETF-/Tagesgeld-Sparplan und
  2 % Tagesgeld abgebildet; Berlin/Leipzig regional differenziert; permanente
  Ressourcenleiste, Icon-System, zwei generierte Spielkulissen, Innenbilder im
  Markt und gemeinsame Zoom-Lightbox umgesetzt. Save v6, UI v9.
- **Klickwege und Wartemomente:** Finanzierung um 0/10/20/30-%-EK-Shortcuts
  mit prominenter Quote ergänzt. Renovierungsabschluss, Verkauf, Mieterauszug,
  Zinsbindungsende und Tilgung pausieren automatisch, speichern und melden sich.
- **Produktziel geschärft:** privates, realistisches Entscheidungslabor statt
  Vermarktungsprodukt; motivierende Spielgrafik bei nüchternen Annahmen und
  Konsequenztexten.
- **Dokumenthygiene:** operative Regeln in `CLAUDE.md` zentralisiert,
  `AGENTS.md` auf Verweis reduziert, stabile Produktspezifikation von aktiver
  `ROADMAP.md` und abgeschlossenem `DONE.md` getrennt.
- **Prioritized Improvement Backlog abgeschlossen:** dependency-freier
  Browser-Smoke deckt Ein-Screen-Invariante und Kaufweg ab; fünf gezielte
  300-Seed-Gates sichern Möblierung und Renovierung; Bewerber-Dossiers sind
  entzerrt und beziffern Leerstandskosten; nicht modellierte Dauerwirkungen aus
  Eventtexten entfernt. Dabei Bestandsmieter-Avatar-404 behoben.
