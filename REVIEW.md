# REVIEW.md — Layout-, UI- und Usability-Review (26.07.2026)

Gegenstand: Layout, UI, Einfachheit, Bedienbarkeit, Gestaltung. Grundlage ist ein
Live-Audit im echten Chrome über die Gates 390 / 700 / 711 / 760 / 1024 / 1280 /
1440 / 2560 px plus Quelltextreview von `css/**` und `js/ui/**`.

**Stand nach diesem Durchgang:** UI v55. Die unter „Bereits behoben" gelisteten
Punkte sind umgesetzt und über alle Gates nachgemessen; alle Testgates grün.
Dieses Dokument enthält die **offenen** Befunde, priorisiert.

## Methodischer Hinweis für den nächsten Agenten

Der Claude-Browser-Pane rendert nicht sichtbar (`document.visibilityState ===
"hidden"`). Folgen, die Messungen verfälschen:

- **`requestAnimationFrame` feuert nie.** Alles rAF-Gesteuerte wirkt „kaputt".
  Konkret sah `entzerreMarker()` in `js/ui/karte.js` wie ein Totalausfall aus
  (5 von 6 Markerpaaren überlappten) — im echten Browser läuft es korrekt.
- **CSS-Animationen stehen auf Keyframe 0.** `#dlg-finanzierung` schien 28 px
  aus dem Viewport zu ragen; das war `@keyframes fin-panel-in`
  (`transform: translateX(28px)`), kein Layoutfehler.
- **`resize_window`, `getBoundingClientRect`, `getComputedStyle` und
  `matchMedia` arbeiten korrekt.** Layoutmessungen sind also belastbar,
  Animations- und rAF-Effekte nicht.

Vor „ist kaputt" bei bewegungsabhängigem Verhalten immer prüfen, ob eine
Animation oder ein rAF im Spiel ist.

Zweiter Hinweis: Das Grep-Werkzeug stellt in Kontextzeilen gelegentlich `/` als
`\` dar. Das sah zweimal nach Encoding-Schaden in CSS und JS aus, war aber
keiner. Verdachtsfälle mit `Read` oder `sed -n 'Np' | cat -A` gegenprüfen, nicht
aus Grep-Ausgabe schließen.

---

## P1 — Vor dem Hosting entscheiden

### 1.1 Kleinschrift unter 13 px ist außerhalb ≥ 1201 px nicht saniert

Der Minimum-Pass aus UI v54 liegt vollständig in `@media (min-width: 1201px)`.
Auf Tablet und Telefon — und teils auch auf dem Desktop — bleiben Texte deutlich
darunter. Gemessen bei 1280 px, also im angeblich sanierten Bereich:

| Stelle | Größe | Datei |
|---|---:|---|
| `.markt-ansicht span` („Außen"/„Innen") | 9 px | `app-shell.css` |
| `#markt-zaehler` (Badge im Dock) | 10 px | `annotation-fixes.css:156` |
| `.speed-lauf button span` | 10 px | `app-shell.css` |
| `.badge`, `.badge.neu`, `.badge.orange` … | 11,5 px | `app-shell.css` |
| `.resource-copy small` (HUD-Labels) | 11 px | `annotation-fixes.css:4` |
| `.marker-copy small` | 12 px | `annotation-fixes.css` |
| `#fin-mix-label`, `#fin-sparplan-*`, `#fin-transfer-*-delta` | 12 px | `app-shell.css` |

Bei 1024 px und darunter kommen `#hud-alter` (12 px) und die Zeitsteuerung
(10 px) dazu.

**Empfehlung:** einen Pass analog zum 1201-px-Block als *Basis* führen, nicht als
Desktop-Sonderfall — also `≥ 13 px` global setzen und nur nach oben abweichen.
Der 1201-px-Block wird dann zum reinen Vergrößerungs-Pass. Achtung: Die
Marktkarten-Badges und die Zeitsteuerung brauchen dabei einen Layoutcheck, weil
sie in feste Breiten laufen.

**Aufwand:** ein halber Tag inkl. Nachmessen über alle Gates.

### 1.2 Verifiziert toter CSS-Block der alten Inline-SVG-Karte

`css/legacy-responsive-features.css` Z. 226–265 stylt eine Stadtkarte, die es
nicht mehr gibt. Keine der Klassen wird noch erzeugt — geprüft gegen `js/`,
`index.html` und `data/`:

`.karten-ebene`, `.ebene-titel`, `.ebene-sub`, `.karten-wasser`, `.stadt-grund`,
`.stadt-park`, `.stadt-wasser`, `.stadt-strassen`, `.stadt-orte`, `.stadt-titel`,
`.marker-strich` sowie die `fill`/`stroke`-Regeln auf
`.karten-marker > :first-child`.

Das ist nicht nur Ballast: Eine Zeile desselben Blocks (`.stadtkarte svg`) hat
bis UI v54 **aktiv jedes Marker-Icon zerstört** (25 × 330 px statt 16 × 16 px,
mobil 760 × 330 px). Der Rest kann weg.

**Empfehlung:** Block ersatzlos löschen. Risiko praktisch null, ~40 Zeilen.

### 1.3 „Objekte"-Tab war auf dem Telefon unerreichbar — Muster prüfen

Behoben (siehe unten), aber die Ursache ist strukturell: Die Bottom-Navigation
enthielt einen **zweiten** `overflow: auto`-Container. Bei 390 px wurde die
Zentrale-Gruppe auf 124 px gequetscht, „Objekte" lag außerhalb des Viewports,
ohne sichtbaren Scrollhinweis.

Jetzt scrollt das Dock als eine Reihe (501 px Inhalt in 374 px). Das erfüllt das
Layout-Gate, ist aber immer noch **horizontales Scrollen für ein Hauptziel**.

**Empfehlung zur Entscheidung:** Auf dem Telefon sechs Dockziele
(Stadt · Marktplatz · Vermögen · Haushalt · Objekte · Finanzen) sind zu viele.
Die sauberere Lösung ist, die drei Zentrale-Unterseiten auf schmalen Viewports
**nicht** ins Dock zu heben, sondern als Tabs im Screenkopf der Zentrale zu
zeigen. Dann hat das Dock vier feste Ziele ohne Scrollen. Das CSS für den
Screenkopf existiert bereits (`.screen-heading--dashboard .zentrale-tabs`),
gerendert wird die Gruppe aber nur einmal — im Dock.

---

## P2 — Wartbarkeit, vor dem nächsten größeren UI-Paket

### 2.1 Überschreibungsketten sind zu tief

Selektoren, die über die sieben Schichten verteilt immer wieder angefasst werden:

| Selektor | Vorkommen |
|---|---:|
| `.ressourcenleiste` | 48 |
| `.screens-nav` | 41 |
| `.konto-karte` | 31 |
| `.speed-group` | 27 |
| `.finanz-aktionen` | 25 |
| `.topbar` | 18 |

Praktische Folge in diesem Review: Um herauszufinden, warum die HUD-Gruppe bei
390 px überläuft, mussten sechs konkurrierende Regeln aus vier Dateien
verglichen werden. Die gewinnende Deklaration (`flex: 2 0 252px`) stand in der
obersten Schicht und widersprach der Absicht der darunterliegenden
(`flex: 1 1 0; min-width: 0`).

**Empfehlung:** Für die fünf Top-Selektoren je eine **eine** zuständige Schicht
festlegen und die Duplikate dorthin zusammenziehen. Kein Rewrite — nur
Konsolidierung pro Komponente. `test/chat-contracts.mjs` schreibt einzelne
CSS-Strings fest; die Verträge beim Verschieben mitziehen.

### 2.2 Anteil nicht greifender Regeln

Gemessen an einer Momentaufnahme (Stadtbühne, leeres Portfolio, keine Dialoge):

| Datei | Regeln | ohne Treffer |
|---|---:|---:|
| `legacy-gameplay.css` | 351 | 266 |
| `annotation-fixes.css` | 312 | 136 |
| `app-shell.css` | 582 | 136 |
| `legacy-responsive-features.css` | 272 | 104 |
| `legacy-shell-dashboard.css` | 293 | 108 |

**Diese Zahlen überzeichnen.** Viele Regeln gelten Zuständen, die im Snapshot
nicht offen waren: Dialoge, Endauswertung, Portfolio mit Objekten, Mietersuche,
Renovierung, Turnaround. Belastbar ist nur der unter 1.2 einzeln nachgewiesene
Block. Der Rest ist ein **Hinweis**, wo sich eine gezielte Prüfung lohnt — allen
voran `legacy-gameplay.css`.

**Empfehlung:** Kein Massenlöschen. Stattdessen beim nächsten Anfassen eines
Screens dessen Legacy-Regeln mitprüfen.

### 2.3 Breakpoint-Paare ohne Lücke halten

`max-width: 700px` neben `min-width: 701px` lässt bei fraktionalen
Viewport-Breiten (Zoom, Geräte-Pixelratio) ein Loch: Bei 700,4 px traf **keine**
der beiden Regeln, und die Topbar lief 24 px über. Jetzt `max-width: 700.98px`.

**Empfehlung:** Neue Breakpoint-Paare immer als `N.98px` / `N+1px` anlegen. Als
Regel in `DESIGN_SYSTEM.md` aufnehmen.

---

## P3 — Feinschliff

### 3.1 Trefferflächen

| Element | Größe | Bewertung |
|---|---|---|
| `.filter-check input`, `.vergleich-check input` | 13 × 13 px | Das umgebende `<label>` ist 158 × 37 px und ist die echte Trefferfläche. Kein Bedienproblem, aber optisch die kleinste Checkbox im Spiel. |
| `.fav` (★) | 19 × 38 px | Unter 24 px Breite; auf Touch schwer zu treffen. |
| `.info-tooltip` (?) | 17 × 17 px | Unter der 24-px-Empfehlung (WCAG 2.2 AA 2.5.8). |
| `.karte-titel` | ×  25 px hoch | Grenzwertig. |
| `input[type=range]` | 24 px hoch | Der Daumen ist 20 px; auf Touch knapp. |

**Empfehlung:** `.fav` und `.info-tooltip` auf mindestens 24 × 24 px
Trefferfläche bringen (Padding, nicht Schriftgröße). Die Checkboxen optisch auf
16–18 px anheben.

### 3.2 Topbar überlappt den Screenkopf um 3 px (390 px)

`.topbar` wird ~201 px hoch, die Screens starten laut Inset bei 198 px. Die
obersten 3 px des Screens liegen hinter der Topbar. Optisch unauffällig, weil
die Screens dort Innenabstand haben — aber der Inset ist eine geratene Konstante.

**Empfehlung:** Screen-Inset aus der tatsächlichen Topbar-Höhe ableiten
(CSS-Variable, die die Topbar setzt), statt vier Breakpoints von Hand zu pflegen.

### 3.3 Bildzoom-Auslöser ist noch kein nativer Button

Offener Rest aus B1.3: `.expose-bild.bild-zoom` ist ein `div`, der Auslöser
erscheint als nacktes `⌕`-Zeichen. Ebenso offen: `aria-hidden` für den
SVG-Fallback bei vorhandenem WebP und echte `<meter>` statt Div-Messbalken.
Steht bereits in `ROADMAP.md`; hier nur zur Vollständigkeit.

### 3.4 Ultrabreite Fenster

Ab 1680 px begrenzt `--inhalt-max` den Inhalt auf 1600 px und zentriert über
Auto-Margins — das funktioniert. Die Topbar spannt jedoch über die volle Breite
(bei 2560 px sitzt das HUD bei x ≈ 1916–2032, weit rechts vom Inhalt bei
480–2080). Das Dock ist korrekt an der linken Inhaltskante.

**Empfehlung:** Topbar-Inhalt auf dieselbe Lesebreite begrenzen, damit Kopf,
Inhalt und Dock eine Spalte bilden. Rein optisch, kein Fehler.

---

## Bereits behoben (UI v55, in diesem Durchgang)

| # | Befund | Wirkung | Ort |
|---|---|---|---|
| 1 | `.stadtkarte svg` traf jedes `.ui-icon` in den Markern | Statussymbole 25 × 330 px, mobil 760 × 330 px — auf **jedem** Viewport sichtbar defekt | `legacy-responsive-features.css:223,397` → `.stadtkarte > svg` |
| 2 | HUD-Finanzgruppe mit `flex-shrink: 0` und festen 252 + 126 px | Bei 390 px lief „Haushaltsüberschuss" 7 px über die Topbar und wurde abgeschnitten | `annotation-fixes.css:613` |
| 3 | Zweiter Scroller im Dock | „Objekte" bei 390 px außerhalb des Viewports, ohne Scrollhinweis | `annotation-fixes.css` (700,98-px-Block) |
| 4 | Breakpoint-Lücke 700 / 701 px | Bei fraktionaler Breite griff keine Regel, Topbar lief 24 px über | 8 × `max-width: 700.98px` |
| 5 | Kein Kopf-Layout für 701–760 px | Spalte 1 ist `max-content` und wurde von der Ressourcenleiste auf 580 px gedehnt: Topbar lief bis 27 px über, Datum und Menü kollidierten | neuer Block in `annotation-fixes.css` |
| 6 | Bruttorendite mit englischem Dezimalpunkt | „2.9 %" statt „2,9 %" — einzige Stelle im Spiel mit Punkt | neuer Helfer `fmtProzent()` in `js/ui/util.js`, verwendet in `expose.js`, `marktplatz.js` |
| 7 | Zinssatz und Liquiditätspuffer ebenso | „3.45 %" in der Meldung, „18.5 Monate" im Screenreader-Label | `finance.js:535`, `dashboard.js:563` |
| 8 | €/m² über `fmtEURKompakt` | „1 Tsd €/m²" statt „1.081 €/m²" auf bezugsfreien Karten | `marktplatz.js:105` |
| 9 | Kontokennzahlen mit umgekehrter Hierarchie | Label 14 px, Wert 10,5 px (unter 1201 px: 9 px / 10,5 px) — betrifft Habenzins, Marktwert, Restschuld, Cashflow | `annotation-fixes.css` |
| 10 | `entzerreMarker()` lief nur beim Rendern | Nach jeder Fenstergrößenänderung überlappten die Marker bis zum nächsten zufälligen Render | Resize-Handler in `js/ui/karte.js` |

Nachgemessen bei 390 / 700 / 711 / 760 / 1024 / 1280 / 1440 / 2560 px: kein
Seiten-Overflow, kein Topbar-Overflow, keine Kopf- oder Dock-Überlappung.

Gates grün: `simtest`, `chat-contracts` (32), `release-check`, `browser-smoke`,
`b0-economy`, `e-gameplay`, `f-turnaround`, `gh-development`, `catalog-market`,
`launcher-smoke`.

## Was dieses Review nicht abdeckt

- **Menschliche Verständlichkeit.** Ob Regeln, Zahlen und Konsequenzen ohne
  Erklärung tragen, bleibt das Owner-Gate aus `PLAYTEST.md` (Arbeitspaket A).
  Dieses Review prüft Layout und Bedienbarkeit, nicht Spielverständnis.
- **Reale Geräte, Screenreader, Tastaturweg von Hand.** Arbeitspaket C.
- **Ökonomische Balance.** Unverändert; die Seed-Matrizen laufen durch.
