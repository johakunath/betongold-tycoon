# ROADMAP.md — aktive Entwicklung

Nur offene oder kommende Arbeit steht hier. Abgeschlossene Arbeit liegt datiert
in `DONE.md`. Die Reihenfolge ist Produktpriorität, keine Zusage, alle Punkte
eines Pakets gleichzeitig zu bauen.

## Leitentscheidung und Reihenfolge

> Der Spieler soll Lust bekommen, eine echte Wohnung zu suchen, zu prüfen und
> eine begründete Entscheidung zu treffen. Das Spiel belohnt Handeln, Lernen,
> sichtbare Verbesserung und kontrolliertes Risiko — nicht nur Tabellenanalyse
> oder garantiert steigendes Vermögen.

## Neuanalyse nach dem Claude-Redesign (20.07.2026)

UI v36 wurde im laufenden Spiel entlang Stadt → Zentrale → Marktplatz →
Finanzierung → Objekt → Bewerber → Finanzen geprüft. Die neue Gestaltung ist
die verbindliche Basis; ein weiterer Vollumbau ist nicht geplant.

| Befund | Status nach v36 | Konsequenz |
|---|---|---|
| Cashflow nur per Hover verständlich | **gelöst:** Klick pinnt den erklärten typischen Planungsmonat | aus Gameplay-Backlog entfernen |
| Vor-/Nach-Steuer und Cashflow-Begriffe redundant | **gelöst:** Haushalt, Objekt, Vermögensaufbau und echte Kontobewegung sind getrennt; Gewinne und verrechenbare Verluste werden erklärt | Save v20 ergänzt die signed Jahressteuer samt Verlustvortrag-Vertrag |
| LTV zu dominant | **gelöst:** als sekundäre „Finanzierungsquote“ im Kredit-/Risikokontext | Modellwert behalten |
| Zahlen ungeordnet und textlastig | **gelöst in B1 (UI v41):** Exposé folgt der Handlungskette, Faktentabelle aufklappbar, Finanzen-Mix rechnet netto wie seine Überschrift | erledigt |
| Doppelte Wege und Meldungen | **gelöst in B1 (UI v41):** Meldungsarchiv liest `state.log`; Renovieren, Bestandsweg und Bühne/Liste haben je eine Stelle | erledigt |
| Passender Elementtyp | **teilweise gelöst in B1:** ein Tab steuert genau ein Tabpanel | Bildzoom (`div role="button"`), SVG/WebP-Doppelung und generische Messbalken bleiben offen |
| Responsive Layout | **gelöst in B1 (UI v41):** `--inhalt-max` ab 1680 px, 390 px ohne HUD-/Filter-Scrollbars; 1280-px-Kollision war nicht reproduzierbar | erledigt |
| Kern eher analytisch als spielerisch | **gelöst in E/G:** Anlass, drei Prüfungen, Entscheidung und länger sichtbare Wirkung bilden eine wiederholbare Schleife; guter Weggang und mehrmonatige Objektgeschichten zählen | Muster bei weiteren Inhalten beibehalten |
| „Viel Bestand, wenig Luft“ | **gelöst in F/G/H:** priorisierte Triage, zwei kostenpflichtige Linien, begrenztes Bankfenster, freiwilliges Stabilisierungsziel und Arbeitsmodell-Trade-offs | im Owner-Playtest abnehmen |

Aktuelle Reihenfolge:

1. **P1 — Einzelaktien-Code aus dem Kernstate entfernen (B2):** Die UI ist
   scopekonform; Engine-, Save- und Testreste folgen als eigener Fachpass.
2. **P2 — Eventdichte vor dem ersten Kauf (E2):** `eventChanceBasis` liegt bei
   0,035/Monat und skaliert erst mit Portfolio-Exposure. Ohne Objekt passiert
   damit rund 60 Monate lang fast nichts. Bewusst nicht im UI-Pass geändert,
   weil es RNG-Verbrauch und Balance verschiebt; eigener Block mit vollen
   300-Seed-Gates oder alternativ ein paar gescriptete Anfangsmomente.
3. **P3 — Kapitel/Kampagnenrhythmus (I):** erst nach einem abwechslungsreichen
   und befriedigenden Monatskern.

**B1 ist mit UI v41 abgeschlossen** (siehe `DONE.md`). Offen bleibt aus dem
Elementvertrag nur der Rest von B1.3: Bildzoom als nativer `<button>`,
`aria-hidden` für den SVG-Fallback bei vorhandenem WebP und echte `<meter>`
statt generischer Div-Messbalken.

## Arbeitspaket B — Qualitäts- und Scope-Pass (P1)

### B1. Nativer Elementvertrag (Rest) — die Umsetzung ist abgeschlossen

Der Vereinfachungspass B1.1/B1.2/B1.4 ist mit UI v41 erledigt und in `DONE.md`
protokolliert. Es bleibt der **verbindliche Elementvertrag**: Er gilt dauerhaft
für jede neue UI, unabhängig vom Arbeitspaket. Offen sind daraus noch Bildzoom,
SVG-/WebP-Doppelung und die generischen Messbalken.

#### B1.3 Verbindlicher nativer Elementvertrag

- Navigation zwischen Hauptscreens: `<nav>` mit echten Buttons und
  `aria-current`; Tabs nur innerhalb eines Screens und genau ein `<tabpanel>`
  je Tab.
- Bildzoom: nativer `<button>` statt `div role="button"`; bei vorhandenem WebP
  genau ein zugängliches Bild, der SVG-Fallback ist dann `aria-hidden`.
- Einzelobjektkarte: `<article>` bleibt Inhalt, eine sichtbare echte
  Öffnen-Schaltfläche ist die Aktion; keine unsichtbar vollflächig klickbare
  Karte und kein buttonartig gestaltetes `<span>`.
- Faktenpaare: `<dl>`; echte mehrspaltige Vergleiche: `<table>` mit `<th>`;
  chronologische Ereignisse: `<ol>` mit `<time>`.
- Exklusive Formularwahl: `<fieldset>` + `<legend>` + Radios; unabhängige Wahl:
  Checkbox; stetiger Zahlenwert: Range/Number mit `<output>`.
- Begrenzter Zustand wie Familie, Rücklage oder Eigenkapitalquote: `<meter>`;
  laufender Vorgang: `<progress>`; Auf-/Zuklappen: `<details>/<summary>`.
- Dialoge: natives `<dialog>` mit beschriftender Überschrift und normaler
  Aktionsleiste. Dialog-Header/-Footer erzeugen keine zusätzlichen
  Banner-/Contentinfo-Landmarks. Doppelte Schließen-Aktionen nur behalten, wenn
  eine davon inhaltlich „Abbrechen und verwerfen“ bedeutet.
- Favorit und andere binäre Toolbaraktionen: Toggle-Button mit
  `aria-pressed`; berechnete Nachher-Werte: `<output>` statt `<article>`.

#### B1.4 Dauerhaftes Layout-Gate (erfüllt, gilt weiter für neue UI)

- 2560/1440/1280/1024/700/390 px sowie kurze Viewports visuell abnehmen.
- Bei 390 px keine horizontalen Seiten-, HUD-, Zeit- oder Filter-Scrollbars;
  nur Bottom-Navigation und der bewusst breite Chart dürfen intern scrollen.
- Ab 1680 px begrenzt `--inhalt-max` die Bühnenbreite; Screens werden über
  auto-Margins zentriert, nie über `transform` (die `screen-in`-Animation
  überschreibt eigene `transform`-Deklarationen dauerhaft).
- Keine kollidierenden Karten oder Zeilen, keine abgeschnittene Hauptaktion und
  höchstens eine primäre Scrollrichtung pro Screen.

### B2. Verbliebenen Einzelaktien-Code aus dem Kern entfernen

- Einzelaktien-Screens und -Navigation sind seit UI v32 entfernt.
- Orders, Kurspfade, Depotstate, Content-Fetches und aktienspezifische Tests in
  einem getrennten State-/Save-Pass entfernen.
- ETF-Depot, Sparplan, Kauf/Verkauf, Opportunitätskosten und vereinfachte
  Kapitalertragsteuer vollständig erhalten.
- Das alte Konzept bleibt nur in `IDEEN.md` als möglicher, klar abtrennbarer
  Value-Investing-Ableger archiviert.

## Arbeitspaket I — Kampagnenrhythmus und Kapitel (P3)

Kapitel, Meilensteine oder stärker inszenierte Kampagnen erst bauen, wenn der
Monatskern über mehrere Stunden abwechslungsreich bleibt. Kapitel dürfen den
seeded Sandboxcharakter und freie Strategie nicht ersetzen.

## Arbeitspaket A — menschlicher Owner-Playtest und Release-Gate

- Owner spielt einen vollständigen repräsentativen Weg über Launcher/Hosting.
- Unklarheiten, tote Wege, Textüberlastung und überraschende Zahlen in
  `PLAYTEST.md` protokollieren.
- Kein eingeplanter zweiter Tester; der menschliche Release-Playtest bleibt ein
  Owner-only-Gate.

## Arbeitspaket C — reale Geräte und Accessibility (P2)

- physischer Desktop-/Mobiltest zusätzlich zu 1440/1024/700/390-Browsergates;
- Tastaturweg, Fokusreihenfolge, Dialoge und Screenreader-Namen manuell prüfen;
- Reduced Motion, Zoom und Touchziele auf realen Geräten abnehmen.

## Arbeitspaket D — explizite Inflation und heutige Euro (P3)

Wenn umgesetzt, dann als zusammenhängendes Economy-Paket: sichtbarer
2-%-Default, kumulativer Preisniveauindex, nominal/heutige-Euro-Umschaltung und
konsistente Wirkung auf Einkommen, Kosten, Mieten, Märkte, Kredite und Scores.
Keine isolierte zusätzliche Inflation auf bereits nominal wachsende Reihen.
Die vorgeschlagene Startannahme lautet ausdrücklich: `inflation = 2 % p.a.`
