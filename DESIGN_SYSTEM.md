# DESIGN_SYSTEM.md — Betongold Tycoon Designbasis v36 / aktuelle UI v51

Verbindliche UI-Richtung nach dem konsolidierten Design-Handoff. Die
Handoff-HTML ist visuelle Referenz, keine zu kopierende Produktimplementierung.
Die visuelle Basis ist in v36 umgesetzt; Vereinfachung, native Elementtypen und
Responsive-Korrekturen dieses Dokuments sind das Ziel des offenen
ROADMAP-Pakets B1 und noch nicht vollständig im Spiel vorhanden.

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
- Feste Bottom-Navigation nach Priorität: Stadt, Marktplatz, die dauerhaft
  sichtbaren Zentrale-Bereiche Vermögen/Haushalt/Objekte und Finanzen.
- Genau ein Hauptscreen ist sichtbar.
- Stadt ist der Einstieg und zeigt Situationen; Zentrale erklärt; Marktplatz
  sucht und vergleicht; Objekt prüft/bewirtschaftet; Finanzen steuert Liquidität
  und ETF.
- Exposé gehört visuell zum Marktplatz, Objektdetail zum Objektbereich.
- Primäraktionen sind gold; Sekundäraktionen bleiben dunkel und konturiert.
- Hauptziele werden nicht als Tab eines anderen Hauptziels dupliziert. Objekte
  gehört ausschließlich zum Bottom-Navigationspunkt; die Zentrale erklärt
  Vermögen und Haushalt.
- Meldungen haben ein kanonisches Archiv. Stadt-Post ist nur dessen Vorschau,
  kein zweiter Datenbestand; ein weiteres Ereignislog wiederholt es nicht.

### 2.1 Native Elementtypen und Interaktionsvertrag

- Hauptscreenwechsel: `<nav>` mit nativen Buttons und `aria-current`.
- Ansichten innerhalb eines Screens: Tabs mit genau einem zugeordneten
  `<tabpanel>` je Tab. Filter-/Ansichtstoggles verwenden `aria-pressed`.
- Exklusive Formauswahl: `<fieldset>` + `<legend>` + Radios; unabhängige
  Optionen: Checkboxen; stetige Zahlen: Range/Number + `<output>`.
- Bezeichner/Wert: `<dl>`; mehrspaltiger Vergleich: `<table>` mit `<th>`;
  Chronologie: `<ol>` + `<time>`.
- Begrenzter Messwert: `<meter>`; laufender Prozess: `<progress>`;
  Offenlegung: `<details>/<summary>`.
- Dialoge verwenden `<dialog>` mit einer beschriftenden Überschrift und einer
  normalen Aktionsleiste. Interne Header/Footer werden nicht als zusätzliche
  Banner-/Contentinfo-Landmarks ausgegeben.
- Bildzoom ist ein nativer Button. Bei vorhandenem Rasterbild gibt es genau ein
  zugängliches Bild; ein SVG-Fallback ist dann dekorativ beziehungsweise
  `aria-hidden`.
- Inhaltskarten bleiben `<article>` und erhalten eine sichtbare echte
  Öffnen-Aktion. Keine `div role="button"`, keine buttonartig gestalteten
  `<span>` und keine unsichtbar vollflächig klickbare Karte.
- Berechnete Vorschauwerte verwenden `<output>`, binäre Iconaktionen wie
  Favoriten einen Toggle-Button mit `aria-pressed`.

## 3. Tokens

### Farbe

| Rolle | Wert |
|---|---|
| Seitenbasis | #0c141c bis #141b22 |
| Panel oben | rgba(30, 38, 48, .76) |
| Panel unten | rgba(19, 25, 33, .82) |
| Primärtext | #ece9e1 |
| Sekundärtext | #c7c9c5 |
| Gedimmt | #9ca7ad |
| Neutrale Struktur | #aebbc2 |
| Gold primär | #e6c264 |
| Gold dunkel | #c69a3f |
| Gold hell | #f4dd9b |
| Positiv | #9ed19e / #6fae7f |
| Negativ | #e0a084 |
| Information | #7ea8d8 |
| Unsicherheit | #d2a847 |

Gold bedeutet aktive Auswahl, Primäraktion oder einen einzelnen Schlüsselwert.
Gewöhnliche Überschriften, Icons, Rahmen und Trennlinien sind neutral. Grün/Rot
gilt nur für Ergebnisse und echte Verbesserung/Verschlechterung. Normale
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
- Fließtext standardmäßig mindestens 14 px. **Untergrenze für jeden sichtbaren
  Text ist 13 px** — auch für Badges, Zählerchen, Bildlabels und
  Zeitsteuerung. Die Untergrenze gilt als Basis; Breakpoint-Blöcke dürfen nur
  nach oben abweichen. Vorher lag sie nur im 1201-px-Block, wodurch auf Tablet
  und Telefon rund 30 Stellen bis hinab zu 9 px zurückblieben.
- Wert und Label eines Kennzahlenpaars sind nie gegenläufig gestaffelt: Steht
  das Label auf 14 px, steht der Wert nicht darunter.

### Form und Tiefe

- Hauptradius 14–17 px, Controls 8–12 px.
- Neutrale Hairlines mit geringer Deckkraft statt schwerer Rahmen; Goldkanten
  nur am aktiven Ziel oder an einer Primäraktion.
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
- Familie/Post links; rechts gewählter Ort und nächster Zug. Eine vollständige
  Ortsliste ist eine umschaltbare Alternative zur Bühne, nicht gleichzeitig
  eine zweite interaktive Navigation.
- Auf kleinen Viewports erscheint die eigentliche Stadtbühne vor den
  ausführlichen Familie-/Postbereichen.

### Zentrale

- Tabs Vermögen und Haushalt; der Bestand lebt ausschließlich unter Objekte.
- KPI-Gruppen Liquidität, Vermögen und Alltag.
- Charts und Tabellen bleiben erklärend, nicht primäre Aktion.
- Kein Einzelaktiendepot.
- HUD-Werte werden nur wiederholt, wenn die Zentrale zusätzliche Erklärung,
  Veränderung oder Vergleich liefert.
- Auf Desktop nutzt der Haushalt die Breite für Rechnung und Steuer, statt
  Inhalte links zu stapeln und rechts Leerraum zu lassen.
- Der Quartalsbericht ergänzt ein kompaktes Strategieboard: genau ein
  freiwilliges Ziel, natives `<meter>`, Horizont und kurze Ableitung. Zielwahl
  und „ohne Ziel“ sind echte Buttons; keine Quest-, Belohnungs- oder
  Punktesprache.
- Der Haushalt ergänzt den Lebensplan mit drei nativen Arbeitsmodell-Buttons,
  sichtbaren Geld-/Zeit-/Familien-Outputs, Restbindung und nächster
  angekündigter Lebensphase. Annahmen verlinken in die bestehende Werkstatt.

### Marktplatz und Exposé

- Dealzeile: Außenansicht, Innenansicht, Kernfakten, kurze Einordnung, Preis und
  getrennte Aktionen.
- Favorit und Vergleich sind sekundär.
- Gebot: Prozentslider, großer Live-Betrag, qualitative Annahmechance.
- Unsicherheit nie als exakte Annahmewahrscheinlichkeit vortäuschen.
- Das Exposé folgt Bild/Kernfakten → Due Diligence/Notizen → Szenario/Gebot.
  Vollständige Fakten sind gruppierte Details und verdrängen die Prüfschritte
  nicht unter den Fold.

### Objektdetail

- Innen/Außen umschaltbar.
- Primär: Wert, Restschuld, Objekt-Cashflow heute und nach Vermietung.
- Detailstatus in aufklappbaren Sektionen; Bewirtschaftungsaktionen bleiben
  sichtbar.
- Die aktuelle Hauptaufgabe steht neben den Hauptkennzahlen. Bildgröße darf
  Bewerber-, Vermietungs- oder Krisenaktion nicht vollständig unter den Fold
  drücken.
- Dieselbe Aktion erscheint nur einmal; insbesondere gibt es nicht getrennt
  „Renovieren“ und „Renovierungsplaner“ mit identischem Ziel.
- Laufende oder abgeschlossene Objekt-Arcs stehen als kurze chronologische
  Historie mit Status und verbleibenden Monaten im Detail, nicht als neue
  globale Navigation.
- Eigenleistung ist eine beschriftete Checkbox mit live aktualisierten Kosten,
  Zeit und Risiko; sie darf nie nur als Rabatt erscheinen.

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
- Vermögensmix verwendet entweder Nettoanteile oder zeigt eine vollständige
  Bruttobilanz mit Schulden. Netto-Headline und Brutto-Immobilienanteil werden
  nicht in derselben scheinbaren Summe vermischt.
- Visuelle und DOM-Reihenfolge stimmen überein; live berechnete Nachher-Stände
  sind Outputs, keine Artikel.

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
- Benachrichtigungspanel und Menüs verwenden dieselbe dunkle Panelhierarchie
  wie die App. Ausgeblendete sichtbare Menülabels behalten einen zugänglichen
  Namen.

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

Kein horizontaler Seiten-Overflow. Auf Mobil werden Stadtspalten gestapelt,
Marktkarten einspaltig, Finanzkonten, Zielwahl und Arbeitsmodelle untereinander
angeordnet; Diagramme dürfen intern scrollen.

**Genau ein Scroller pro Achse.** Die Bottom-Navigation darf intern horizontal
scrollen — dann aber als Ganzes. Ein Scroller im Scroller quetscht den inneren
Container auf Reste zusammen: Die Zentrale-Untergruppe landete so bei 390 px auf
124 px Breite, „Objekte" lag ohne sichtbaren Hinweis außerhalb des Viewports.
Unterhalb von 701 px hat das Dock deshalb vier feste Ziele; die drei
Zentrale-Unterseiten werden dort zum vollbreiten Streifen unter dem Kopf.

**Breakpoint-Paare ohne Lücke.** `max-width: N px` neben `min-width: N+1 px`
lässt bei fraktionalen Viewport-Breiten (Browserzoom, Geräte-Pixelratio) ein
Loch, in dem keine der beiden Regeln greift. Bei 700,4 px lief die Topbar
dadurch 24 px über. Neue Paare deshalb immer als `N.98px` / `N+1px` anlegen.

**Kopfhöhe und Screen-Inset haben eine gemeinsame Quelle.** Die Screens sind
`position: fixed`; ihr oberer Abstand kommt aus `--topbar-h`, aus der auch
`.topbar` ihre `min-height` bezieht. Wer den Kopf verändert, ändert die Variable
— nie nur eine der beiden Seiten.

## 7. Accessibility

- Jede Iconaktion hat sichtbaren Text oder aria-label.
- Aktive Navigation nutzt aria-current; Tabs aria-selected; Filter aria-pressed.
- Alle Bildassets besitzen sinnvollen Alt-Text oder alt="" wenn dekorativ.
- Fokus bleibt sichtbar; native Buttons tragen Marker- und Listenwege.
- Reduced Motion deaktiviert nicht notwendige Übergänge.
- Semantische Tabellen, Überschriften und Dialoge bleiben erhalten.
