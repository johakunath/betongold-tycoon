# STYLE_GUIDE.md — Visuelle Richtung (für Codex-Asset-Produktion)

Ziel-Gefühl: **warmes, einladendes Wirtschaftsspiel** — "isometrischer Charme",
nicht Architektur-Rendering, nicht Comic. Referenzklasse: hochwertige
Brettspiel-Illustration / moderne City-Builder-Art. Keine Fotos, kein
Fotorealismus.

## Kamera & Komposition

- **¾-Isometrie** (ca. 30–35° von oben, 45° gedreht) für Exposé-Renders und
  Cutaways. Eine Kamera, alle Assets — Konsistenz schlägt Einzelbild-Drama.
- Gebäude füllt ~70 % der Bildhöhe; etwas Straßenraum (Gehweg, 1 Baum,
  angedeutete Nachbarbebauung als Silhouette). Himmel sichtbar.
- Cutaways: Puppenhaus-Anschnitt derselben Iso-Kamera; Wände zur Kamera
  aufgeschnitten; `unsaniert`/`saniert` **pixelgenau gleiche Kamera**.
- Avatare: frontal bis leichtes ¾-Porträt, Brust aufwärts, Blick freundlich
  Richtung Betrachter.

## Licht & Stimmung

Spätnachmittagslicht, warm, weiche Schatten nach links. Keine Nachtszenen,
kein Regen. Zustand 1–2 wird über Fassadenmüdigkeit erzählt (Putzschäden,
verwitterte Farbe), nie über düstere Beleuchtung.

## Palette

Muss mit der UI harmonieren (css/style.css):

| Rolle | Hex |
|---|---|
| Warmer Sand (Grundton Umfeld) | `#f3efe7` / `#cfc5aa` |
| Petrol (Akzent dunkel, Details) | `#22303a` |
| Amber (Sonnen-/Lichtakzent) | `#eda100` |
| Himmel | `#dce8ef` |
| Grün (Vegetation) | `#9dbb85` |

Fassadenfarben pro Archetyp: Altbau creme/sandstein, 60er-Zeile gedecktes
Grau-Beige (Platte: heller Beton), 90er-Klinker rotbraun `#b06a4a`-Familie,
Neubau weiß/hellgrau mit Glas. Gesättigte Signalfarben nur sparsam.

## UI-Anschluss

Die Live-UI verwendet lokal eingebettetes **Cormorant Garamond 600/700** für
Titel und Großzahlen sowie **Alegreya Sans 400/500/700/800** für UI-Text. Die
dunklen Petrol-/Gold-Glasflächen lassen die gewählte Stadtbühne bewusst dezent,
aber erkennbar durchscheinen. Neue Bildassets müssen deshalb auch bei leichter
Entsättigung und moderatem Blur eine klare Silhouette behalten.

## Harte Regeln

1. **Kein Text im Bild** — keine Schilder mit Worten, Hausnummern, Graffiti-
   Schrift, Preise. (UI-Beschriftung kommt aus dem Spiel.)
2. Keine erkennbaren realen Gebäude/Orte, keine Marken, keine Fotos.
3. Keine Menschen in Exposé-Renders und Cutaways (Avatare sind separat).
4. Ein Stil für alles: nach dem Style-Lock keine Stilwechsel im Batch.
5. WebP, Maße exakt nach ASSET_MANIFEST.md, Budget < 15 MB gesamt.
6. Cutaway-Türen sind konstruktiv lesbar: genau ein Türblatt je vollständiger,
   gerahmter Öffnung in einer raumhohen Wand; keine schwebenden, doppelten oder
   überlappenden Türen und keine Kollision mit Treppen, Möbeln oder Sanitär.
   Wo eine Tür geometrisch unklar wäre, ist ein offener Durchgang vorzuziehen.

## Style-Lock

Der vollständige Live-Batch ist die verbindliche Referenz: 40 Exposés,
18 Avatare und 80 Cutaways. Neue Assets werden gegen mehrere passende
Bestandsbilder desselben Objekt- und Zustandsarchetyps geprüft; ein einzelnes
Gebäude darf die Architekturvarianz nicht wieder auf uniforme freistehende
Rechteckblöcke verengen. Produktions- und Motivdetails stehen im
`ASSET_MANIFEST.md`.

## Platzhalter-Verhalten (zur Info)

Das Spiel kann für künftig fehlende Assets einen SVG-Platzhalter rendern
(`js/iso.js`, Fassaden-/Haus-Archetypen). Im aktuellen 40er-Katalog sind jedoch
alle drei Bildpfade je Listing vollständig; der Release-Check erzwingt das.
