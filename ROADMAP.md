# ROADMAP.md — aktive Entwicklung

Nur offene oder kommende Arbeit steht hier. Abgeschlossene Arbeit liegt datiert
in `DONE.md`. Die Reihenfolge ist Produktpriorität, keine Zusage, alle Punkte
eines Pakets gleichzeitig zu bauen.

## Leitentscheidung und Reihenfolge

> Der Spieler soll Lust bekommen, eine echte Wohnung zu suchen, zu prüfen und
> eine begründete Entscheidung zu treffen. Das Spiel belohnt Handeln, Lernen,
> sichtbare Verbesserung und kontrolliertes Risiko — nicht nur Tabellenanalyse
> oder garantiert steigendes Vermögen.

Die Neuanalyse nach dem Claude-Redesign (20.07.2026) ist vollständig
abgearbeitet; Details in `DONE.md`. Nächste offene Priorität: **P3 — Kapitel/
Kampagnenrhythmus (I)**, erst nach einem abwechslungsreichen und befriedigenden
Monatskern.

**B1 ist abgeschlossen** (siehe `DONE.md`). Der Rest von B1.3 — Bildzoom als
nativer `<button>`, `aria-hidden` für den SVG-Fallback bei vorhandenem WebP und
echte `<meter>` — ist mit UI v56 umgesetzt. Die vier Finanz-Messbalken
(`ownership-meter`, `ltv-track`, `reserve-track`, `risiko-track`) bleiben
bewusst `<div>`; Begründung in `REVIEW.md` unter „Bewusst nicht gemacht".

## Arbeitspaket B — Qualitäts- und Scope-Pass (P1)

### B1. Nativer Elementvertrag — umgesetzt

Der Vereinfachungspass B1.1/B1.2/B1.4 ist mit UI v41 erledigt, B1.3 mit UI v56.
Es bleibt der **verbindliche Elementvertrag**: Er gilt dauerhaft für jede neue
UI, unabhängig vom Arbeitspaket.

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
  eine davon inhaltlich „Abbrechen und verwerfen" bedeutet.
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

### B2 — erledigt (Save v21, 23.07.2026)

`js/aktien.js` und `data/stocks.json` gelöscht; Depotstate, `aktienRngState`,
Kurspfad, Dividenden, Content-Loader und aktienspezifische Tests entfernt. Das
alte Konzept bleibt nur in `IDEEN.md`. Details in `DONE.md`.

## Arbeitspaket J — echtes Familienbild für das Standard-Preset (P2)

Die Familienkarte auf der Stadtbühne (`index.html:291`) zeigt
`assets/avatar/t-05.webp` — einen **Mieter**-Avatar aus dem `t-*`-Satz mit einer
einzelnen Frau. Das Standard-Preset „Familienstrategie mit Puffer"
(`js/config.js`) beschreibt aber zwei Erwachsene und zwei kleine Kinder; Bild
und Spielstand widersprechen sich.

- Eigenes Familienbild anlegen: beide Erwachsene plus zwei kleine Kinder,
  warme Anmutung, keine UI und keine Schrift (Art Direction nach
  `DESIGN_SYSTEM.md` §5).
- Eigener Name außerhalb des Mieter-Namensraums (nicht `t-*`), damit Mieter-
  und Haushaltsbilder nicht verwechselt werden können.
- In `ASSET_MANIFEST.md` eintragen; das Gesamtbudget bleibt < 15 MB.
- Prüfen, ob die übrigen drei Startprofile dasselbe Problem haben.

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
