# DESIGN_SYSTEM.md — Betongold Tycoon UI v36

Verbindliche UI-Richtung nach dem konsolidierten Design-Handoff. Die
Handoff-HTML ist visuelle Referenz, keine zu kopierende Produktimplementierung.

## 1. Charakter

**Dunkle, warme City-Builder-Leitstelle.** Die Spielwelt wirkt wertig und
atmosphärisch, die Finanzinformation nüchtern und prüfbar. Dunkle Glasflächen,
dezente Goldkanten, echte Immobilienbilder und sparsame Farbsignale ersetzen
das frühere helle Dashboardgefühl.

Vermeiden:

- helle Office- oder Banking-Dashboards;
- Gold auf jeder Zahl oder jeder Fläche;
- dekorative Emojis als Funktionsicon;
- reine Farbcodierung ohne Text, Form oder Symbol;
- Anlagewerbung, Renditeversprechen und künstliche Dringlichkeit.

## 2. Hierarchie und Navigation

- Fester Top-HUD: Datum/Alter, Tagesgeld, Haushaltsüberschuss, ETF, Zeitsteuerung
  und kompaktes Menü.
- Feste Bottom-Navigation: Stadt, Zentrale, Marktplatz, Objekte, Finanzen.
- Genau ein Hauptscreen ist sichtbar.
- Stadt ist der Einstieg und zeigt Situationen; Zentrale erklärt; Marktplatz
  sucht und vergleicht; Objekt prüft/bewirtschaftet; Finanzen steuert Liquidität
  und ETF.
- Exposé gehört visuell zum Marktplatz, Objektdetail zum Objektbereich.
- Primäraktionen sind gold; Sekundäraktionen bleiben dunkel und konturiert.

## 3. Tokens

### Farbe

| Rolle | Wert |
|---|---|
| Seitenbasis | #0c141c bis #141b22 |
| Panel oben | rgba(30, 38, 48, .76) |
| Panel unten | rgba(19, 25, 33, .82) |
| Primärtext | #efe7d5 |
| Sekundärtext | #b9b09d |
| Gedimmt | #8f8879 |
| Gold primär | #e6c264 |
| Gold dunkel | #c69a3f |
| Gold hell | #f4dd9b |
| Positiv | #9ed19e / #6fae7f |
| Negativ | #e0a084 |
| Information | #7ea8d8 |
| Unsicherheit | #d2a847 |

Gold bedeutet Auswahl, Primäraktion oder wichtige Überschrift. Grün/Rot gilt
nur für Ergebnisse und echte Verbesserung/Verschlechterung. Normale
Einzelpositionen sind farbneutral.

### Typografie

- Überschriften und große Werte: lokal selbst gehostetes Cormorant Garamond
  600/700; Georgia bleibt reiner Fallback.
- UI, Tabellen und Steuerung: lokal selbst gehostetes Alegreya Sans
  400/500/700/800; system-ui bleibt reiner Fallback.
- Alle Fonts liegen als WOFF2 unter assets/fonts mit OFL-Lizenztexten; die App
  bleibt vollständig offline nutzbar.
- Eyebrows: Versalien, eng, klein und gedimmt.
- Geldwerte tabellarisch; Beträge rechtsbündig, Vorzeichen konsistent.
- Fließtext standardmäßig mindestens 14 px, kompakte Metadaten mindestens 10 px.

### Form und Tiefe

- Hauptradius 14–17 px, Controls 8–12 px.
- Goldene Hairlines mit geringer Deckkraft statt schwerer Rahmen.
- Panel-Schatten 0 15px 48px rgba(0,0,0,.48).
- Backdrop-Blur nur auf großen, stabilen Flächen.
- Bewegung 120–180 ms; keine federnden oder spielzeughaften Animationen.

## 4. Kernkomponenten

### Stadtbühne

- Hintergrund je Segment weich und leicht entsättigt, aber als Stadtsilhouette
  klar erkennbar (Bühne brightness .84, globaler Backdrop .86).
- Das zuletzt gewählte Segment liefert zugleich die bildfüllende Kulisse der
  gesamten App; die Auswahl bleibt über Screenwechsel und Reload erhalten.
- Scharfe Listingkarten verwenden ausschließlich assets/expose.
- Vier Segmente: Berlin Innenstadt, Berlin Außenstadt, Leipzig, Meißen + Umland.
- Marker und Liste teilen dieselbe Listing-ID und denselben ausgeschriebenen
  Status.
- In einem dünnen aktuellen Markt darf „Alle“ die Bühne mit höchstens drei
  echten, deaktivierten Katalogvorschauen bis auf vier Orte ergänzen. Diese
  tragen ausgeschrieben „noch nicht erschienen“ und öffnen kein Exposé.
- Familie/Post links, Orte/Legende/nächster Zug rechts; auf kleinen Viewports
  untereinander.

### Zentrale

- Tabs Vermögen, Haushalt und Objekte.
- KPI-Gruppen Liquidität, Vermögen und Alltag.
- Charts und Tabellen bleiben erklärend, nicht primäre Aktion.
- Kein Einzelaktiendepot.

### Marktplatz und Exposé

- Dealzeile: Außenansicht, Innenansicht, Kernfakten, kurze Einordnung, Preis und
  getrennte Aktionen.
- Favorit und Vergleich sind sekundär.
- Gebot: Prozentslider, großer Live-Betrag, qualitative Annahmechance.
- Unsicherheit nie als exakte Annahmewahrscheinlichkeit vortäuschen.

### Objektdetail

- Innen/Außen umschaltbar.
- Primär: Wert, Restschuld, Objekt-Cashflow heute und nach Vermietung.
- Detailstatus in aufklappbaren Sektionen; Bewirtschaftungsaktionen bleiben
  sichtbar.

### Finanzen

- Drei Konten: Tagesgeld, Immobilienportfolio, Welt-ETF.
- Desktop-Hierarchie: kompakte Kontenkarten in der ersten Inhaltszeile;
  Umschichtung links und Vermögensmix rechts direkt darunter. Der Sparplan ist
  Bestandteil des Umschichtungsbereichs, nicht eine lose nachgelagerte Karte.
- Ein bidirektionaler Slider von −20.000 bis +20.000 Euro (500-Euro-Schritte)
  steuert Tagesgeld ↔ ETF. Beide Nachher-Konten, Deltas, Richtung und beim
  Verkauf Steuer/Netto reagieren live vor der Bestätigung.
- Haushaltsüberschuss und Liquiditätspuffer stehen vor Depotdetails.
- Einzelaktien gehören nicht in die Kern-UI.

### Finanzierung

- Dreistufig: Nutzung → Eigenkapital → Rate & Urteil.
- Schnellwerte: nur Nebenkosten sowie Nebenkosten + 10/20/30 % Kaufpreis.
- Gruppen: Kauf, Kredit, Objekt pro Monat, Auswirkung auf den Haushalt.
- Leerstand und geplante Vermietung getrennt; Folgemiete ist keine Garantie.
- WEG-Aufteilung aufklappbar, Nullsteuer einmal mit Grund.
- Finanzierungsquote (LTV) sekundär und genau einmal erklärt.

### Overlays

- Dialoge folgen demselben dunklen Panelstil.
- Cashflow-Details: Hover/Fokus flüchtig, Klick gepinnt, Außenklick/Escape zu.
- Focus Trap und Rückkehr zum Auslöser bei nativen Dialogen erhalten.
- Toasts kurz, Meldungen dauerhaft wiederaufrufbar.

## 5. Bildsprache

Listingassets bleiben der verbindliche Architektur- und Zustandslock:

- Außenbilder: warme Schräg-/Straßenansicht ohne UI oder Schrift.
- Cutaways: gleiche Architektur in unsaniert/saniert; Zustand muss lesbar sein.
- Unmöblierte Objekte bleiben in beiden Zuständen unmöbliert.
- Stadt-Hintergründe sind atmosphärische Kulisse, keine navigationsgetreue Karte.
- SVG ist technischer Fallback, nicht Zieloptik.

## 6. Responsive Gates

- Desktop: 1440 px.
- Kompakt: 1024 px.
- Tablet/klein: 700 px.
- Mobil: 390 px.

Kein horizontaler Seiten-Overflow. Bottom-Navigation darf intern horizontal
scrollen. Auf Mobil werden Stadtspalten gestapelt, Marktkarten einspaltig,
Finanzkonten untereinander und Diagramme intern scrollbar.

## 7. Accessibility

- Jede Iconaktion hat sichtbaren Text oder aria-label.
- Aktive Navigation nutzt aria-current; Tabs aria-selected; Filter aria-pressed.
- Alle Bildassets besitzen sinnvollen Alt-Text oder alt="" wenn dekorativ.
- Fokus bleibt sichtbar; native Buttons tragen Marker- und Listenwege.
- Reduced Motion deaktiviert nicht notwendige Übergänge.
- Semantische Tabellen, Überschriften und Dialoge bleiben erhalten.
