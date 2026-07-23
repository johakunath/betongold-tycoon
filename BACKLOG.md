# BACKLOG.md — gesammelte Owner-Annotationen

Diese Datei bewahrt die priorisierte und deduplizierte Owner-Annotationsrunde
vom 21.07.2026 als nachvollziehbare Checkliste. Der Block wurde vor der
bestehenden Roadmap umgesetzt; Abschluss und technische Details stehen in
`DONE.md`, `HANDOVER.md` und `ECONOMY_MODEL.md`.

## P0 — Owner-Annotationsrunde vom 21.07.2026

**Status:** vollständig umgesetzt und automatisiert abgenommen als
`SAVE_VERSION = 20`, `UI_VERSION = 48`.

## Code-Inspector-Nachlauf vom 21.07.2026

**Status:** vollständig abgeschlossen als UI v48. Der bereits in UI v47
behobene Chart-Containment-Fehler besitzt nun zusätzlich einen gezielten
Browser-Regressionsvertrag. Die beiden übrigen Berichtspunkte sind ebenfalls
geschlossen: dynamische Kontrastzustände werden anhand berechneter Farben nach
WCAG geprüft, und die frühere 4.018-Zeilen-CSS-Datei ist in sieben geordnete,
jeweils auf höchstens rund 1.200 Zeilen begrenzte Schichten zerlegt. Aus dem
Code-Inspector-Bericht bleibt kein offener Umsetzungspunkt.

## Ergänzender UI-Pass vom 21.07.2026

**Status:** alle 23 nachgereichten Browser-Annotationen sind als UI v47
umgesetzt und nach Navigation/Lesbarkeit, Exposé/Vergleich, Finanzierung/Bilder,
Kauf/Kredit sowie Meldungen/Bewerber dedupliziert. Die vollständige
Abschlussliste steht in `DONE.md`; hier verbleibt kein offener Punkt daraus.

### 1. Recherche und Modellentscheidungen

- [x] **Berliner Neuvertragsmieten neu kalibrieren.** Tatsächliche aktuelle
  Angebots- beziehungsweise Neuvertragsmieten für Berliner Bestands- und
  Neubauwohnungen recherchieren und daraus nachvollziehbare Ansätze für
  reguläre Vermietung, längerfristig möblierte Vermietung und Wohnen auf Zeit
  ableiten. Unterschiede nach Segment und Objektzustand berücksichtigen.
  Möblierung und Befristung dürfen real höhere Marktmieten abbilden, müssen aber
  Mietpreisbremse, Mietspiegel-, Befristungs- und Rückzahlungsrisiko deutlich
  als rechtliches Risiko zeigen. Quellen und Annahmen in `ECONOMY_MODEL.md`
  dokumentieren; keine versteckten Aufschläge.
- [x] **Berliner Mietnachfrage realistisch modellieren.** Belastbare Daten zu
  Wohnraumnachfrage, Leerstand, Kontakt-/Bewerberzahlen und Reaktion auf hohe
  Angebotsmieten recherchieren. Sucherfolg und Dossierzahl nach Stadtsegment,
  Vermietungsweg und Mietniveau kalibrieren. Auch teure Berliner Angebote
  sollen wegen der angespannten Nachfrage regelmäßig Bewerber erhalten, ohne
  Einkommensprüfung und Rechtsrisiko bedeutungslos zu machen. Seeded RNG und
  300-Seed-Balance-Gates beibehalten.
- [x] **Wohn- und Arbeitsort samt regionalem Einkommen definieren.** Jedes
  Startprofil erhält einen gespeicherten Wohn-/Arbeitsort; der Familienstart
  beginnt in Berlin-Außenstadt. Realistische Einkommensunterschiede zwischen
  Berlin, Leipzig und Meißen + Umland recherchieren. Vor dem Eigenheimkauf in
  einer anderen Region muss ein Umzug mit neuem Haushaltsnetto, Kostenwirkung
  und Bestätigung sichtbar werden. State- und Save-Vertrag vorab festlegen.
- [x] **Steuerliche Verluste aus Vermietung fachlich prüfen.** Ermitteln, welche
  negativen Ergebnisse aus Zinsen, umlageunfähigen Eigentümerkosten,
  Instandhaltung und AfA im Modell mit anderem Einkommen verrechnet oder
  vorgetragen werden sollen. Der aktuelle konservative MVP besteuert nur
  positive Mietüberschüsse und gewährt weder sofortige Erstattung noch
  Verlustvortrag. Eine Änderung nur als zusammenhängendes Steuerpaket mit
  Jahresbescheid, Verlusttopf, UI-Erklärung und Regressionstests umsetzen.
- [x] **Sondertilgung modellieren.** Pro Kredit und Kalenderjahr eine freiwillige
  Sondertilgung bis 5 % des ursprünglichen Kreditbetrags vorsehen. Verfügbaren
  Jahresrahmen, Liquiditätsabfluss, Restschuld, Zinsfolge und bereits genutzten
  Betrag eindeutig definieren; Wirkung und nächste Verfügbarkeit erklären.

### 2. Persistente Spielabläufe

- [x] **Mietersuche im Hintergrund fortführen.** Ein erfolgloser Suchmonat darf
  keinen blockierenden Dialog erzwingen. Der Dialog ist schließbar, andere
  Aktionen bleiben möglich und die bestehende Suche läuft objektbezogen weiter.
  In jedem Monatszug entsteht für jede leerstehende, nicht renovierte und nicht
  anderweitig blockierte Immobilie genau eine verständliche Erinnerung; bei
  neuen passenden Dossiers führt sie direkt zurück zur Auswahl. Keine doppelte
  Monatsbuchung und kein zusätzlicher RNG-Verbrauch durch bloßes Öffnen.
- [x] **Sondertilgung als Objekt-/Bankaktion anbieten.** Die unter 1 definierte
  Sondertilgung am Objekt oder im Bankbereich in höchstens zwei Klicks erreichbar
  machen. Vor Ausführung Betrag, verbleibende Liquidität, Restschuld und neue
  Monatsrate beziehungsweise Laufzeit zeigen; erst nach Bestätigung buchen.
- [x] **Regionalen Eigenheimumzug anwenden.** Die unter 1 definierte
  Wohnortänderung in Kaufprüfung und Kaufabschluss integrieren. Warnung und
  Vorschau dürfen nicht erst nach dem Kauf erscheinen; ab dem folgenden
  Haushaltsmonat gilt die bestätigte Einkommens-/Kostenänderung genau einmal.

### 3. Finanzierungs- und Objektbedienung

- [x] **ETF-Einsatz als Eigenkapital per Slider wählen.** Im Bankdialog neben
  der präzisen Zahleneingabe einen synchronisierten Range-Regler von 0 bis zum
  netto verfügbaren ETF-Verkaufswert anbieten. Steuerwirkung, tatsächlicher
  Verkaufserlös, eingesetztes Eigenkapital und Restpuffer live aktualisieren.
- [x] **Unpassenden Buttontext „Szenario rechnen“ ersetzen.** Aus der tatsächlichen
  Folgeaktion eine handlungsbezogene Beschriftung ableiten, beispielsweise
  „Finanzierung prüfen“. Exposé, Dialogtitel und reine Rechensimulation müssen
  begrifflich konsistent bleiben.

### 4. Informationsarchitektur und Navigation

- [x] **HUD-Haushaltsüberschuss neu ordnen.** Klick auf die HUD-Kachel öffnet
  direkt `Zentrale → Haushalt`. Der Hover-/Fokus-Popover zeigt nur eine kompakte
  Einnahmen-/Ausgabenübersicht nach Kategorien. Alle bisherigen Detailposten
  bleiben auf der Haushaltsseite auffindbar; keine Information darf durch die
  Vereinfachung verloren gehen.
- [x] **Zentrale-Unterseiten an die Bottom-Navigation verschieben.** Die drei
  Ziele Vermögen, Haushalt und Objekte als untergeordnete Navigation direkt bei
  den vier Hauptbuttons platzieren. Semantik, Tastatursteuerung,
  `aria-current`, responsive Verhalten und die Synchronisation mit dem
  Hauptpunkt „Zentrale“ erhalten. Die Kopfleiste wird entsprechend entlastet.
- [x] **Zentrale-Header und Tabs größenstabil halten.** Beim Wechsel zu „Objekte“
  dürfen Höhe, Schriftgröße, Padding und Position der Zentrale-Navigation nicht
  springen. Alle drei Panels bei identischer Viewportbreite vermessen.
- [x] **Vermögensdiagramm horizontal navigierbar machen.** Auf schmalen
  Viewports beziehungsweise bei langer Zeitreihe eine bewusst interne
  horizontale Scroll-/Pan-Fläche anbieten. Achsen und aktuelle Werte bleiben
  verständlich; der Seitenscreen selbst erhält keinen Horizontal-Overflow.
- [x] **Ereignisse nur noch im Benachrichtigungsarchiv zeigen.** Die redundante
  Ereigniskarte in `Zentrale → Haushalt` und die Ereigniswiederholung unter
  „Was passiert ist“ im Quartalsbericht entfernen. Das Glockenpanel bleibt die
  einzige vollständige chronologische Quelle. Der Quartalsbericht darf eine
  verdichtete Wirkung zusammenfassen, aber keine zweite Ereignisliste führen.

### 5. Visuelle Zustände und Lesbarkeit

- [x] **Helle Bewerber-Chips und -Flächen kontrastreich machen.** Textfarben
  heller Buttons, Statuschips, Zitatflächen und ähnlicher heller Komponenten in
  der gesamten Bewerberansicht prüfen und auf ausreichenden Kontrast bringen;
  Erfolg/Warnung/Ablehnung weiterhin unterscheidbar halten.
- [x] **Negatives Tagesgeld konsequent rot kennzeichnen.** Negative Werte im
  HUD und in allen dazugehörigen Konto-/Vorschaufeldern erhalten denselben
  semantischen Negativzustand. Positive und neutrale Werte bleiben grün
  beziehungsweise neutral; Vorzeichen allein ist nicht die einzige
  Unterscheidung.

## Danach: bestehende Roadmap-Reihenfolge

Nach diesem P0-Block gilt wieder die aktuelle Reihenfolge aus `ROADMAP.md`:
B2 Einzelaktien-Code aus dem Kernstate entfernen, E2 Eventdichte vor dem ersten
Kauf und anschließend der Kampagnenrhythmus. Der noch offene native
Elementvertrag aus B1.3 wird bei jeder betroffenen UI-Änderung mitgezogen.
