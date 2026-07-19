# ASSET_MANIFEST.md — Asset-Vertrag

Verbindliche Liste aller Bild-Assets. **Dateinamen und Maße sind Vertrag** —
der Code lädt exakt diese Pfade; fehlt eine Datei, greift automatisch der
SVG-Platzhalter (js/iso.js). Stil und Qualität: siehe STYLE_GUIDE.md.
Der vollständige Batch ist der Owner-Style-Lock. Neue Bilder müssen dieselbe warme
hochwertige Brettspiel-/City-Builder-Isometrie, Kameralogik und Lichtstimmung
fortführen. Produktion und Promptbasis werden je Batch hier protokolliert.

**Bildformat:** WebP, sRGB. **Schriften:** WOFF2. Budget gesamt < 15 MB. Kein Text im Bild (auch keine
Hausnummern, Schilder mit Worten, Preise), keine Wasserzeichen. Listing-,
Szenario- und Personenassets zeigen keine identifizierbaren realen Gebäude;
die ausdrücklich ortsgebundenen Stadt-Hintergründe in §5 dürfen typische
Silhouetten abstrahiert aufnehmen.

## 1. Exposé-Renders — `assets/expose/{id}.webp` (40 final)

Außenansicht ¾-isometrisch (siehe STYLE_GUIDE §Kamera), Straßenniveau mit
etwas Umfeld (Gehweg, ein Baum, Himmel). Der `stil` bestimmt den
Fassaden-Archetyp; `zustand` (1–5) das Erscheinungsbild (5 = gepflegt,
1–2 = sichtbar mitgenommen: blätternde Farbe, müde Fenster — nie Ruine).

| ID | Stil | Zustand | Motiv-Beschreibung |
|---|---|---|---|
| bi-01 | altbau | 3 | Berliner Stuck-Altbau um 1908, 4 Geschosse, cremefarben, Erker/Stuckbänder, Prenzlauer-Berg-Flair |
| bi-02 | altbau | 2 | Kreuzberger Hinterhaus-Altbau 1899, schlichter, Hofdurchfahrt, abgenutzte Fassade |
| bi-03 | neubau | 5 | Glatter Neubau 2019 in Mitte, 6 Geschosse, weiß/Glas, Staffelgeschoss |
| bi-04 | zeile60 | 3 | Gepflegte 50er-Wohnanlage Charlottenburg, helle Putzfassade, Balkonzeilen |
| bi-05 | altbau | 4 | Altbau-Dachgeschoss Friedrichshain, Fokus aufs ausgebaute DG mit Süd-Terrasse |
| br-01 | klinker90 | 3 | 90er-Klinkeranlage Spandau, rotbraun, ruhige Wohnstraße |
| br-02 | neubau | 4 | Neubau 2016 Köpenick, 4 Geschosse, Balkone, grünes Wasser-Umfeld angedeutet |
| br-03 | zeile60 | 2 | Marzahner Plattenbau 1984, 11 Geschosse angeschnitten, sichtbar sanierungsbedürftig |
| br-04 | zeile60 | 3 | 60er-Zeile Reinickendorf, 4 Geschosse, original aber ordentlich |
| le-01 | altbau | 3 | Leipziger Gründerzeitler 1902 an der Karl-Heine-Straße, sanierte Fassade |
| le-02 | altbau | 3 | Connewitzer Altbau 1910, Hochparterre, etwas Street-Art-Umfeld (ohne Schrift!) |
| le-03 | zeile60 | 2 | Grünauer Platte 1981, lange Zeile, müdes Umfeld, viel Himmel |
| le-04 | klinker90 | 3 | 90er-Klinkerbau Zentrum-Süd, kompakt, unaufgeregt |
| le-05 | neubau | 5 | Neubau 2021 Leutzsch, Effizienz-Look, Holz/Weiß-Akzente, Balkone |
| br-05 | haus | 4 | Kompaktes Falkenseer Reihenhaus, kleiner Garten/Terrasse, solide 90er-Hülle |
| le-06 | haus | 3 | Doppelhaushälfte am Leipziger Auwald, großer Garten, ältere Fenster/Haustechnik |
| me-01 | neubau | 4 | Meißner Familienwohnung, barrierearmer Neubau, geschützte Loggia, Elbtal und Altstadtsilhouette |
| me-02 | haus | 3 | Reihenendhaus in Weinböhla, geschützter Garten, Hanglage und Weinberge |
| me-03 | haus | 2 | Großes 70er-Haus im Käbschütztal, eingewachsener Garten, energetischer Rückstand |

### Arbeitspaket E — Finalbatch 17.07.2026

Die 21 neuen IDs `bi-06`–`bi-09`, `br-06`–`br-11`, `le-07`–`le-10` und
`me-04`–`me-10` besitzen je eine eigene Außenansicht und zwei eigene Cutaways.
Die visuell geprüften 56 Motive wurden nach dem Designpass übernommen; sieben
fehlende Meißen-Cutaways (`me-05` bis `me-10`) wurden mit Imagegen ergänzt,
auf 1200×800 zugeschnitten und als WebP optimiert. Die vollständige
Produktionskopie bleibt unter `asset-drafts/arbeitspaket-e/`; live liegen alle
63 Dateien in `assets/expose` und `assets/cutaway`. Kein Listing trägt noch
`assetStatus:"placeholder"`.

Die Motivmatrix liefert ausdrücklich mehr Architekturvarianz: Berliner
Blockrand, Hof-/Seitenflügel, Eck- und Keilbauten mit Brandwänden; Leipziger
Hochhaus und L-Bau; im Umland Siedlungshaus, Reihen-/Doppelhaus, freistehendes
EFH, Dreiseithof und unterschiedlich gegliederte Neubauten. Unmöblierte Listings
bleiben auch im sanierten Cutaway leer.

Promptbasis für die sieben Ergänzungen: exakte Referenzkomposition und
Grundrisslogik erhalten; nur realistische Oberflächen, Haustechnik und bekannte
Mängel verändern; bewohnte Objekte behalten ihre Möblierung, unmöblierte bleiben
leer; warme ¾-Isometrie, Spätnachmittag, keine Personen, Schrift oder Marken.

### Korrektur- und Tür-QA — 17.07.2026

Ein Hash-Audit fand fünf ältere Paare mit identischem `unsaniert`-/`saniert`-
Inhalt. Zusätzlich zeigte der visuelle Grundrisspass mehrere falsche
Architekturzuordnungen sowie drei kritische Türfehler. Deshalb wurden folgende
Live-Cutaways ersetzt:

- `br-05`, `le-06`, `me-01` und `me-02`: beide Zustände komplett neu und an
  Außenansicht, Baujahr, Objektart und Raumzahl angepasst;
- `me-03_saniert`: als echte Sanierungsvariante des 70er-Jahre-Hauses neu;
- `br-02`, `bi-06` und `le-08`: beide Zustände wegen überlappender, doppelter
  oder frei im Raum stehender Türen komplett neu aufgebaut.

Die akzeptierten Türvarianten verwenden nur einzelne Türblätter in vollständigen
gerahmten Wandöffnungen, freie Schwenkbereiche und ansonsten offene Durchgänge.
Unmöblierte Objekte bleiben leer. Ein erster `le-08_saniert`-Versuch ohne Küche
wurde verworfen und nicht live übernommen. Die ausgewählten Original-PNGs
bleiben im lokalen Imagegen-Ordner unter
`C:/Users/Johannes/.codex/generated_images/019f6f5d-a3ba-7f30-bb6d-050a73dfb51d/`;
live liegen ausschließlich die geprüften 1200×800-WebPs.

## 2. Wohnungs-/Haus-Cutaways — `assets/cutaway/{id}_{zustand}.webp` (80 final)

Isometrischer Anschnitt (Puppenhaus-Blick) der jeweiligen Wohnung, Möblierung
neutral angedeutet, **ohne Bewohner**. Zwei Zustände pro Objekt
(PLAN §6, DECISIONS: 2 Zustände, nicht pro Renovierungsstufe):

- `{id}_unsaniert.webp` — Ausstattung wie im Exposé beschrieben (bei Zustand
  4–5 heißt "unsaniert" schlicht: aktueller, guter Zustand)
- `{id}_saniert.webp` — nach Renovierung: reparierte Oberflächen und Technik,
  gleiche Architektur und gleiche Kameraposition; unmöblierte Angebote bleiben
  leer, bewohnte behalten ihre plausible Einrichtung

Raumzahl/Grundriss-Logik muss zu `flaeche`/`zimmer` aus data/listings.json
passen (z. B. bi-01: 3 Zimmer, 72 m², Altbau-Raumhöhe). Verwendung ab Phase 3
(Objekt-Detail/Renovierungsplaner) — Produktion darf parallel laufen.

**Bestands- und Meißen-Korrekturbatch 17.07.2026:** Die Außenansichten für
`me-01` bis `me-03` bleiben die eigens erzeugten Motive für Meißen-Cölln,
Weinböhla und das Käbschütztal. Ihre Cutaways sind nun ebenfalls eindeutig an
Modernbauwohnung, Reihenendhaus und 70er-Jahre-EFH gekoppelt. `br-05` und
`le-06` zeigen passend zur Außenansicht Reihenhaus beziehungsweise
Doppelhaushälfte statt generischer Wohnungsgrundrisse.

## 3. Bewerber-Avatare — `assets/avatar/{id}.webp`, 512×512 (18 Stück)

Porträt-Illustrationen (Brust aufwärts), neutraler Hintergrund, freundlich-
realistische Alltagsmenschen, divers, keine Karikaturen. IDs und Archetypen
(Dossiers folgen in Phase 3 — Erscheinung jetzt schon fix):

| ID | Archetyp |
|---|---|
| t-01 | Beamtin, Ende 40, Verwaltung |
| t-02 | Junges Paar, sie schwanger — Doppelporträt |
| t-03 | Studenten-WG-Sprecher, Anfang 20 |
| t-04 | Selbstständiger Fotograf, Mitte 30 |
| t-05 | Frisch getrennte Mutter, Anfang 40 |
| t-06 | Rentnerpaar — Doppelporträt |
| t-07 | Krankenpfleger, Ende 20, Schichtdienst |
| t-08 | IT-Consultant, Mitte 30, viel unterwegs |
| t-09 | Lehrerin, Anfang 30, mit Kater auf dem Arm |
| t-10 | Handwerksmeister, Ende 30 |
| t-11 | Doktorandin, Mitte 20 |
| t-12 | Barista/Musiker, Mitte 20 |
| t-13 | Witwer, Ende 60, ruhig |
| t-14 | Familienvater in Elternzeit, Mitte 30 |
| t-15 | Ärztin in Weiterbildung, Ende 20 |
| t-16 | Ex-Expat zurück in Deutschland, Anfang 50 |
| t-17 | Berufseinsteigerin im Konzern, Anfang 20 |
| t-18 | Kleinunternehmerin (Kiosk), Mitte 50 |

## Abnahme-Checkliste (je Batch)

1. Dateiname exakt wie oben, WebP, richtige Maße.
2. Kein Text/Schrift im Bild, keine realen Marken/Gebäude.
3. Stil-Konsistenz zum gelockten Referenzbild (STYLE_GUIDE §Style-Lock).
4. Gesamtgröße im Rahmen (< 15 MB über alles; Exposés ≲ 150 KB, Cutaways ≲ 250 KB, Avatare ≲ 60 KB).
5. Im Spiel prüfen: alle drei Listingpfade laden; SVG bleibt nur technischer
   Fallback für künftig fehlende oder neue Assets.
6. Release-Hashcheck: keine zwei Listingbilder dürfen byte-identisch sein;
   insbesondere müssen `unsaniert` und `saniert` je Listing verschieden sein.

## 4. Startlagen — `assets/scenarios/{id}.webp` (4 Stück)

Breite Szenenbilder, 640×360, ohne Schrift oder Logos. Sie unterscheiden die
Startfantasie im Dialog „Neues Spiel“, ohne konkrete reale Personen abzubilden:

| Datei | Motiv |
|---|---|
| `familienstrategie.webp` | moderne Familienwohnung, Finanzunterlagen und ruhiger Puffer |
| `klassisch.webp` | kompakter Single-Haushalt am Beginn des Vermögensaufbaus |
| `schuldenberg.webp` | mehrere Mietshäuser, Akten und sichtbar hoher Finanzierungsdruck |
| `handwerker.webp` | junge Ausbildung im Handwerk, Werkzeug und frühe Aufbauchance |

Generiert am 17.07.2026 mit dem Imagegen-Workflow, anschließend auf 640×360
zugeschnitten und als WebP optimiert. Alttexte sind leer, weil Titel und
Beschreibung direkt daneben dieselbe Information zugänglich vermitteln.

## 5. Fullscreen-Stadtkulissen — `assets/ui/city-*-v1.webp` (4 Stück)

UI-freie, fullscreenfähige Stadtbühnen in gemeinsamer hoher Schrägaufsicht.
Alle vier Bilder verwenden spätes warmes Tageslicht, kühle Schatten und
atmosphärische Tiefe, unterscheiden sich aber bewusst in Dichte, Maßstab,
Topografie und Bautypen. Sie sind noch nicht an einen konkreten Screen
gekoppelt und können im Design-Revamp mit `background-size: cover` sowie einer
dunklen Overlay-/Blur-Ebene verwendet werden.

| Datei | Maße | Größe | Motiv |
|---|---:|---:|---|
| `city-berlin-innenstadt-v1.webp` | 1672×941 | 370.052 B | dichter, unregelmäßiger Berliner Blockrand mit Höfen, Brandwänden, Eckbauten, Nachverdichtung und einzelnem Hochpunkt |
| `city-berlin-aussenstadt-v1.webp` | 1672×941 | 399.518 B | grüner Übergang aus Altbau, Siedlung, Zeilenbau, Hochhäusern, EFH und Schienenachse |
| `city-leipzig-v1.webp` | 1672×941 | 337.364 B | Leipziger Gründerzeit, Backsteinindustrie, umgenutzte Höfe, Kanäle, Brücken und moderner Stadthochpunkt |
| `city-meissen-umland-v1.webp` | 1672×941 | 289.732 B | Elbtal mit historischer Hangstadt, Burg-/Dom-Silhouette, Weinbergen, Dörfern, Feldern und zwei plausiblen Brücken |

Generiert am 17.07.2026 im eingebauten Imagegen-Workflow mit dem vorhandenen
Claude-Designscreenshot ausschließlich als Kamera-/Stimmungsreferenz. Die
Prompts untersagten ausdrücklich UI, Text, Logos, Wasserzeichen, uniforme
Blockwiederholung sowie unplausible Türen, Fenster, Dächer, Straßen und Brücken.
Die vier Original-PNGs liegen im lokalen Imagegen-Ordner; die Live-WebPs wurden
mit Qualität 84 und voller 16:9-Quellauflösung übernommen. Gesamtbestand danach:
152 Assets, 14,13 MB und damit weiterhin unter dem 15-MB-Vertrag.

## 6. Lokale UI-Schriften — `assets/fonts/` (7 Dateien)

Die Handoff-Typografie ist vollständig selbst gehostet und benötigt kein CDN.
Die Latin-WOFF2-Dateien decken deutsche Umlaute, ß, Eurozeichen und die in der
UI verwendete Interpunktion ab. Beide Familien stehen unter der SIL Open Font
License 1.1; die jeweiligen Lizenztexte liegen daneben.

| Datei | Gewicht | Größe |
|---|---:|---:|
| `alegreya-sans-400-latin.woff2` | 400 | 23.708 B |
| `alegreya-sans-500-latin.woff2` | 500 | 23.928 B |
| `alegreya-sans-700-latin.woff2` | 700 | 23.976 B |
| `alegreya-sans-800-latin.woff2` | 800 | 23.956 B |
| `cormorant-garamond-600-700-latin.woff2` | 600–700 | 37.640 B |
| `OFL-Alegreya-Sans.txt` | Lizenz | 4.405 B |
| `OFL-Cormorant-Garamond.txt` | Lizenz | 4.387 B |

Quelle: offizielle Google-Fonts-Auslieferung; Lizenztexte aus dem offiziellen
Google-Fonts-Repository. Gesamtbestand danach: **159 Assets, 14,27 MB**.
