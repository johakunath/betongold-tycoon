# IDEEN.md — Layout-, Grafik- & UX-Ideenspeicher

Backlog aus dem Bau von Phase 1–3, damit gute Ideen nicht verloren gehen.
**Kein Auftrag** — PLAN.md und der Owner bestimmen Scope und Reihenfolge, die
Phasen-Disziplin gilt weiter (nichts aus späteren Phasen vorziehen). Vieles
hiervon ist explizit **Phase 5** („visual polish, tooltips" — PLAN §12).
Aufwand grob: S = klein, M = mittel, L = groß.

**Stand 20.07.2026:** Phase 5, der erste vollständige 0H-Designpass sowie die
Basis aus freiwilligen Zielen, Objekt-Arcs, Arbeitsmodellen, Lebensphasen und
begrenzter Eigenleistung sind umgesetzt. Erledigte Ideen sind unten markiert;
Sound, neue Event-Bitmaps, Dark Mode sowie echter Geräte-/Screenreader-Test
bleiben optional. Die
Abnahme steht in `DESIGN_ROADMAP.md`; dieser Speicher bleibt Detailquelle und
wird nicht als zweite Roadmap geführt.

## A. Grafik & Assets (Codex-Art-Track, STYLE_GUIDE.md)

Die SVG-Fallbacks (`iso.js`) sind bewusst schlichte Greyboxes; der vollständige
40er-Art-Batch ist live. Für spätere Grafikerweiterungen mitdenken:
- **Zustands-Overlay auf Cutaways (M):** Statt nur 2 Zuständen (unsaniert/
  saniert) einen leichten Verschleiß-Layer, der mit `zustand` 1–5 skaliert
  (Flecken/abblätternde Farbe per CSS-Filter über dem WebP) — billiger als 5
  gemalte Varianten, macht Renovierung sichtbar.
- **Baujahr-Varianz der Fassaden (M):** Die vier Stile (Altbau/60er/90er-
  Klinker/Neubau) dürfen pro Objekt leicht variieren (Farbe, Fensterraster),
  damit die 19 Exposés nicht uniform wirken. `iso.js` variiert schon per ID-Hash —
  die echten Renders sollten das aufgreifen.
- **Leere Innenansichten für unmöblierte Wohnungen (L, sehr spät):** Für
  bezugsfreie, unmöblierte Angebote zusätzliche Cutaway-/Innenbildvarianten
  ohne Möbel generieren. Architektur, Kameraposition, Zustand und Licht müssen
  exakt zur möblierten Variante passen; „leer“ darf nicht automatisch
  renovierungsbedürftig oder minderwertig aussehen. Vor dem Asset-Batch klären,
  ob nach einem Mietereinzug neutrale Mietermöbel erscheinen, welches sichtbare
  State-Feld die Variante steuert und welches Dateinamensschema ins
  `ASSET_MANIFEST.md` aufgenommen wird. Assetbudget < 15 MB bleibt verbindlich.
- **Event-Hero-Bilder (L, optional):** Ein kleines Vignetten-Bild je
  Event-Kategorie (Wasser, Heizung, WEG, Familie) würde das Event-Modal heben.
  Nur wenn Asset-Budget (<15 MB) es hergibt — sonst SVG-Icon je Kategorie (S).
- **Avatar-Vielfalt (S):** 18 Dossiers → 18 Avatare (ASSET_MANIFEST §3);
  auf echte Diversität achten, keine Karikaturen (STYLE_GUIDE).
- **Isometrische „Portfolio-Regal"-Vignette (L, V2):** Die eigenen Gebäude als
  kleine Iso-Reihe auf dem Dashboard — „visible ownership" (Säule 3) statt nur
  Tabellenzeilen. Schön, aber teuer; klar Phase-5/V2.

## B. Dashboard-Layout (Screen 1)

- **Event-Marker auf der Nettovermögen-Kurve (M):** kleine Punkte/Ticks an den
  Monaten mit Ereignissen; Hover zeigt den Log-Eintrag. Macht die Kurve zur
  Geschichte. (dataviz-Skill: sparsame Marks, Tooltip-Layer existiert schon.)
- **Portfolio-Zusammensetzung (M):** eine kleine gestapelte Fläche/Balken
  „Eigenkapital vs. Restschuld je Objekt" oder Segment-Verteilung — nutzt das
  vorhandene SVG-Chart-Muster, keine Bibliothek.
- **Cashflow-Aufschlüsselung (S, ✅):** signierte Balken zeigen Einkommen,
  Kosten, Immobilien und Monatsergebnis; die exakte Tabelle bleibt darunter.
- **KPI-Wertimpuls (S, ✅):** geänderte Kennzahlen bestätigen einen Tick mit
  einem kurzen, gedrosselten Impuls statt eines langen Count-ups.
- **Dichte entzerren (S):** Auf großen Screens wirkt die rechte Spalte
  (Haushalt/Portfolio/Ereignisse) gedrängt; ein 3-Spalten-Grid ab ~1400 px
  gäbe Luft.

## C. Objekt-Detail (Screen 7)

- **Cutaway als Held (S, ✅ Basis):** Cutaway ist die große Objektfläche und
  trägt Zustand/Energie direkt; ein optionaler Vorher/Nachher-Toggle bleibt
  eine spätere Verfeinerung.
- **P&L visuell (S, ✅):** horizontale Einnahmen-/Ausgabenbalken ergänzen die
  exakte Monats-Tabelle.
- **Mieter-Karte mit Avatar (S, ✅):** echte Dossiermieter nutzen den vorhandenen
  Avatar, synthetische Bestandsmieter einen neutralen Fallback; Stimmung steht
  als Text daneben.
- **Rücklage-Fortschritt (S, ✅):** Balken und Zahl vergleichen die Rücklage mit
  einem Jahr regulärer Instandhaltung.

## D. Bewerbermappe (Screen 6)

- **Fit-Hinweis ohne Score (S, ✅):** eine dezente qualitative Einordnung
  („Einkommen solide", „Bleibedauer unklar") aus den *sichtbaren* Feldern —
  niemals die versteckten Qualitäten! Hält die „kein perfekter Score"-Regel,
  hilft aber Einsteigern.
- **Nebeneinander-Vergleich (M):** 2–3 Bewerber wie beim Objektvergleich
  gegenüberstellen.
- **Leerstands-Kosten sichtbar (S, ✅):** beim „Weitersuchen" anzeigen, was ein
  weiterer Leerstandsmonat kostet (entgangene Miete + laufende Kosten).

## E. Event-Modal (Screen 8)

- **Kategorie-Icons (S, ✅):** code-native Symbole, Textlabel und Farbakzent je
  Kategorie (Objekt/Mieter/Haushalt/Familie).
- **Folgen-Vorschau dezent (S):** die Effekt-Richtung pro Option andeuten
  (±€, Stimmung) — ohne die Überraschung ganz zu nehmen. Balance-sensibel,
  erst nach Playtest entscheiden.
- **Sanfte Einblendung (S, ✅):** Dialog und Screen treten kurz ein; Reduced
  Motion schaltet die Bewegung ab.

## F. Marktplatz & Exposé (Screens 2–3)

- **Favoriten-Ansicht/-Reiter (S):** existiert als Filter; ein eigener Reiter
  wäre sichtbarer.
- **Szenario-Rechner inline (M):** die Mini-Wirtschaftlichkeit (Bruttorendite,
  grobe Monatsrate) direkt auf der Exposé-Karte, bevor man den Dialog öffnet.
- **„Deal-Ampel" bewusst NICHT (Design):** keine automatische Gut/Schlecht-
  Wertung der Objekte — der Reiz ist die eigene Analyse (PLAN §5.1). Nur Daten
  zeigen, nicht urteilen.

## G. Global / Feel

- **Mit wachsender Systemtiefe langsamer und ursächlicher spielen (L, langfristig):**
  Je mehr Karriere-, Vermietungs-, Finanz- und Familienentscheidungen hinzukommen,
  desto weniger darf die Simulation unbemerkt Monate überspringen. Noch keine
  festgelegte Lösung; zu prüfen sind adaptive Höchstgeschwindigkeit, automatisch
  längere Beobachtungsfenster nach Entscheidungen, deutlichere Vorher-/Nachher-
  Vergleiche, Ursache-Wirkungs-Markierungen im Verlauf und gezielte Pausen nur bei
  tatsächlich handlungsrelevanten Schwellen. Ziel ist nicht künstliche Langsamkeit:
  Spieler sollen erkennen, **was** sich warum verändert hat und wann Eingreifen
  sinnvoll ist. Seed-Determinismus und ein flotter Testmodus müssen erhalten bleiben.

- **Tooltips, die Mechaniken erklären (M, funktionale Basis ✅):**
  LTV, Kappungsgrenze, AfA, Spekulationsfrist, Bruttorendite, ETF-Linie — je
  ein Ein-Satz-Erklärer beim Hover. Zentral als kleines `title`/Popover-System.
- **Onboarding / erster Zug (M):** ein kurzer geführter Einstieg (2–3
  Hinweise) beim allerersten Spiel; danach nie wieder.
- **Leere Zustände (S, ✅ Kernflächen):** Portfolio, Feed und Ereignislog geben
  Klartext; das leere Portfolio führt direkt zum Marktplatz.
- **Dark Mode (M):** die Palette ist warm-hell; ein Dark-Theme über die
  CSS-Variablen wäre günstig nachrüstbar (nur `:root`-Werte + prefers-color-
  scheme). Chartfarben dann gegen die dunkle Fläche neu validieren (dataviz).
- **Responsiv/Tablet (S, CSS-Pass ✅):** Breakpoints bei 1440/1320/1080/700/
  480 px decken Shell, Objekt, Dialoge und Karten ab; echter Gerätetest bleibt.
- **Tastatur/A11y (S, Basis ✅):** Skip-Link, Screenfokus, Tastaturkarten,
  ARIA-Zustände und Charttexte sind umgesetzt; echter Screenreader-/Gerätetest
  bleibt vor öffentlichem Release sinnvoll (Event-Modal blockt Esc bewusst).
- **Sound (S, optional):** dezente Ticks/Confirm-Sounds; leicht abschaltbar.

## H. Daten-Viz-Leitplanken (dataviz-Skill)

Beim Bauen neuer Diagramme (Portfolio, Cashflow, **Endauswertung Phase 4**):
- Chartfarben sind validiert (Blau `#2a78d6` / Amber `#eda100`, CVD-sicher);
  bei neuen Serien den Validator laufen lassen, feste Kategorienreihenfolge,
  **nie** zweite Y-Achse.
- Die Endauswertung braucht die **Kontrafaktual-Linien** (reiner ETF /
  Eigenheim-first / invest-first) als Multi-Line über denselben Chart-Baukasten
  wie die Dashboard-Kurve — Muster wiederverwenden, Legende + Direktlabels.

## I. Bereits als V2/„später" beschlossen (siehe DECISIONS.md)

Nicht doppelt planen — nur zur Erinnerung: Reputation (Banken/Makler/Mieter),
Mieter-Raumpersonalisierung, animierte Nachbarschaftskarte, WG-
Einzelvermietung, zweite Bank/Angebotsvergleich, prozedurale Listing-/Mieter-
Generatoren, Räumung/Mahnkette, „schlechtere Event-Ausgänge bei Zeitstress".

- **Karriere-/Gehaltsentscheidungen mit Zeit-Trade-off (Basis ✅):** Balance,
  Karriereschritt und Familienzeit verändern Einkommen, Zeit und Familienziel
  transparent und sind zwölf Monate gebunden. Differenziertere Jobwechsel,
  Weiterbildung/Meisterschule oder Selbstständigkeit bleiben nur eine spätere
  Vertiefungsoption. Keine universell beste Karriere: mehr Gehalt verdrängt
  Immobilien- und Familienzeit, während freie Zeit Renovierungen erleichtert.
  Determinismus, Save v19 und verständliche Vorher-/Nachher-Vorschau sind
  abgesichert; vor dem Release
  genügt die kontrollierte Ablehnung alter Spielstände.

- **Ferienwohnung an der Ostsee (L/XL, langfristig):** Unabhängig vom
  Meißner Heimatmarkt eine eigene Nutzungsart für Ferienvermietung schaffen, beispielsweise
  in einem fiktiven Ostseebad. Das ist kein normales Mietobjekt mit anderem
  Etikett, sondern ein neuer operativer Usecase mit Saisonkalender,
  schwankender Auslastung und Preisen pro Übernachtung. Chancen: hohe Erlöse in
  Spitzenzeiten, regionale Diversifikation, optionale Eigennutzung und ein
  kleiner Familienzufriedenheitsbonus. Risiken und Kosten: lange Nebensaison,
  Einrichtung und regelmäßiger Ersatz, Reinigung/Übergaben, Plattform- und
  Verwaltungskosten, höherer Zeitbedarf, Gästeschäden, wetter- oder
  nachfrageabhängige Jahre sowie mögliche lokale Genehmigungs- und
  Steuerregeln. Eigennutzung blockiert bewusst vermietbare Hochsaisontage;
  professionelle Verwaltung tauscht Marge gegen Zeit und Stabilität. Vor einer
  Umsetzung braucht das System einen eigenen Monats-/Saison-Cashflow, passende
  Finanzierung, Feriengast-Events, transparente Auslastungsspannen und eine
  Recherche der dann verwendeten Rechts-/Steuerannahmen. Keine garantierte
  „Airbnb-Rendite“ und keine Live-Plattformdaten.

## J. Benchmark „Der Walter“ (Spieltest 16.07.2026)

Externe Referenz: <https://der-walter.de/spiel/>. Getestet wurden Marktplatz,
Finanzierungsstufen, Kauf, Mietersuche, fünf Quartale, Handwerker, Kredit,
Versicherung, Steuern und vorzeitiges Spielende.

**Übertragbare Stärken:** kompakter Saisonrhythmus; Ressourcen und letzte Folgen
ständig sichtbar; scanbarer Markt; Finanzierungsszenarien nebeneinander;
Objektkarte als Aktionszentrum; sofortige Ereignischronik; klare Vorher-/Nachher-
Darstellung bei Maßnahmen. Der Spieltest bestätigt außerdem die bereits
umgesetzten Betongold-Entscheidungen für permanente Ressourcen, EK-Shortcuts,
Wartemoment-Pausen und kurze Wege.

**Nur das Darstellungsmuster übernehmen:** Walters Renovierungen versprechen
deterministische Mietsteigerungen, die Mieterselbstauskunft zeigt keine Risiken,
und ein reiner Vermögens-Highscore fördert Modelloptimierung statt realer
Entscheidungsqualität. Die 60-%-Finanzierung erschien nach Kauf zudem als 49 %
Gesamtbeleihung, ohne den Unterschied gut zu erklären. Betongold braucht deshalb
Spannen, Ursachen und Opportunitätskosten statt garantiertem Plus oder Deal-Score.

**Bewusste Abgrenzung:** kein CRT-/Emoji-only-Look, kein bundesweit zufälliger
Kernmarkt und keine Kleingärten, Garagen oder Lagerboxen nur um der Vielfalt
willen. Für den Familienfokus bleiben Reihen-/Doppelhäuser sowie große Garten-
und Erdgeschosswohnungen relevanter; siehe `ROADMAP.md` Arbeitspaket E.

### Spielbare Vergleichsreferenzen

- [The Tenants](https://store.steampowered.com/app/1009560/The_Tenants/):
  Mieterpersönlichkeit, Ereignisse und sichtbare Wohnungsaufwertung beobachten;
  nicht als Referenz für deutsche Rechts- oder Renditeannahmen verwenden.
- [Project Highrise](https://store.steampowered.com/app/423580/Project_Highrise/):
  sichtbarer Besitz, Bewohnerbedürfnisse und lesbare Ausbauprogression; der
  Hochhausbau selbst liegt außerhalb des Betongold-Scope.
- [House Flipper 2](https://store.steampowered.com/app/1190970/House_Flipper_2/):
  direktes Renovierungsfeedback, Materialität und Vorher/Nachher-Befriedigung;
  kein Finanzierungsbenchmark.
- [Landlord's Super](https://store.steampowered.com/app/1127840/Landlords_Super/):
  Ortsgefühl, Tages-/Saisonrhythmus und Immobilien als begehbare Arbeit; Ton,
  britisches Setting und Ökonomie nicht übertragen.

Diese vier Spiele sind primär Anschauung für Spielgefühl und Darstellung.
„Der Walter“ bleibt wegen seiner kompakten browserbasierten Immobilien-Schleife
der direkteste Interaktionsbenchmark.

## K. Archiviertes Konzept — Einzelaktien-Sandbox

**Status 23.07.2026:** vollständig entfernt. Seit UI v32/v36 war die Sandbox aus
der sichtbaren UI verschwunden; mit Save v21 (23.07.2026) wurden auch Engine,
State, Save-Vertrag, `data/stocks.json`, `config.aktien` und die Tests entfernt
(Roadmap-Punkt B2 abgeschlossen). ETF-Kauf, ETF-Verkauf, Sparplan und
ETF-Vergleichslinie bleiben. Eine Wiederaufnahme startet auf grüner Wiese.

Der Entwurf wird nur konzeptionell bewahrt, damit er bei Bedarf neu und sauber
gebaut werden kann. Sein ursprüngliches Lernziel war der Unterschied zwischen
breit gestreutem Welt-ETF, Immobilienrisiko und konzentriertem Einzelwert-/
Sektorrisiko.

Archivierter Systementwurf:

- fünf fiktive, humorvolle, aber plausibel modellierte Unternehmen aus
  unterschiedlichen Sektoren; keine echten Marken, Livekurse oder Empfehlungen;
- nur ganze Stücke und maximal fünf Positionen gleichzeitig;
- sichtbarer Einstandskurs, realisierter Gewinn/Verlust, Dividenden und
  Performancevergleich gegen ETF und Immobilien;
- Orderkosten von 4,90 € plus 0,15 % des Volumens, gedeckelt auf 49,90 €;
- vereinfachte Kapitalertragsteuer mit gemeinsamem Sparer-Pauschbetrag,
  Verlusttopf und sichtbarer steuerlicher Wirkung beim Verkauf;
- vierteljährliche Dividenden sowie getrennte Markt-, Sektor- und
  Unternehmensereignisse;
- ein eigener deterministischer `aktienRngState`, der unabhängig von Orders,
  ETF und allgemeinem Ereignis-RNG jeden Monat eine feste Ziehfolge verbraucht;
- keine Mechanik, bei der Käufe oder Verkäufe künftige Zufallsverläufe
  verschieben oder der Spieler versteckte Kursinformationen ausnutzen kann.

Warum der Entwurf geparkt ist:

- Er erzeugt einen zweiten Finanzspielkern mit eigenem Depot, Events, Steuern,
  Screens und Balancing, während das zentrale Immobilienhandeln noch mehr
  Spielgefühl und Vielfalt braucht.
- Er erhöht Analyse- und Navigationslast genau dort, wo das Spiel spielerischer
  und mutmachender werden soll.
- Sektor- und Einzelwertrisiko ist interessant, trägt aber wenig zum Hauptziel
  bei, die Angst vor der ersten realen Wohnungssuche zu senken.

Eine Wiederaufnahme kommt frühestens als **optionales Value-Investing-Modul**
infrage, wenn die Immobilien-, Familien- und Turnaround-Schleifen nachweislich
tragen. Dann den Entwurf neu gegen das aktuelle Economy-, Steuer- und
Save-Modell spezifizieren; nicht alten Code ungeprüft reaktivieren.
