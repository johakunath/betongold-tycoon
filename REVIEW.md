# REVIEW.md — Layout-, UI- und Usability-Review

Gegenstand: Layout, UI, Einfachheit, Bedienbarkeit, Gestaltung. Grundlage ist ein
Live-Audit im echten Chrome über die Gates 390 / 700 / 711 / 730 / 760 / 1024 /
1280 / 1440 / 2560 px plus Quelltextreview von `css/**` und `js/ui/**`.

**Stand: UI v56 (26.07.2026) — alle Befunde abgearbeitet.** Was offen bleibt,
steht unter „Bewusst nicht gemacht"; es sind keine Defekte, sondern
Abwägungen und Owner-Gates.

---

## Methodischer Hinweis für den nächsten Agenten

Der Claude-Browser-Pane rendert nicht sichtbar (`document.visibilityState ===
"hidden"`). Das verfälscht Messungen auf drei Arten:

- **`requestAnimationFrame` feuert nie.** `entzerreMarker()` in
  `js/ui/karte.js` sah dadurch aus wie ein Totalausfall (5 von 6 Markerpaaren
  überlappten) — im echten Browser läuft es korrekt.
- **CSS-Animationen stehen auf Keyframe 0.** `#dlg-finanzierung` schien 28 px
  aus dem Viewport zu ragen; das war `@keyframes fin-panel-in`
  (`transform: translateX(28px)`). Aus demselben Grund misst jeder Screen 7 px
  tiefer als sein CSS-Inset (`screen-in` startet mit einem Versatz).
- **`ResizeObserver` und `window.resize` feuern nicht.** Das ist der Grund,
  warum `--topbar-h` bewusst rein in CSS gesetzt wird statt aus einer
  JS-Messung. Ein Versuch mit ResizeObserver hinterließ hier einen veralteten
  Wert und 125 px Überlappung.

**Was zuverlässig funktioniert:** `resize_window`, `getBoundingClientRect`,
`getComputedStyle`, `matchMedia`, Klicks, Konsole und Netzwerk. Layoutmessungen
sind also belastbar — nur alles Bewegungsabhängige nicht. Vor „ist kaputt"
immer prüfen, ob eine Animation, ein rAF oder ein Observer im Spiel ist.

Zweiter Hinweis: Das Grep-Werkzeug stellt in Kontextzeilen gelegentlich `/` als
`\` dar. Das sah zweimal nach Encoding-Schaden in CSS und JS aus, war aber
keiner. Verdachtsfälle mit `Read` oder `sed -n 'Np' | cat -A` gegenprüfen.

---

## Behoben in UI v55

| # | Befund | Wirkung |
|---|---|---|
| 1 | `.stadtkarte svg` traf jedes `.ui-icon` in den Markern | Statussymbole 25 × 330 px, mobil 760 × 330 px — auf **jedem** Viewport sichtbar defekt |
| 2 | HUD-Finanzgruppe mit `flex-shrink: 0` und festen 252 + 126 px | Bei 390 px lief „Haushaltsüberschuss" 7 px über die Topbar und wurde abgeschnitten |
| 3 | Zweiter Scroller im Dock | „Objekte" bei 390 px außerhalb des Viewports |
| 4 | Breakpoint-Lücke 700 / 701 px | Bei fraktionaler Breite griff keine Regel, Topbar lief 24 px über |
| 5 | Kein Kopf-Layout für 701–760 px | Topbar lief bis 27 px über, Datum und Menü kollidierten |
| 6–8 | Englische Dezimalpunkte, `fmtEURKompakt` für €/m² | „2.9 %" statt „2,9 %"; „1 Tsd €/m²" statt „1.081 €/m²" |
| 9 | Kontokennzahlen mit umgekehrter Hierarchie | Label 14 px, Wert 10,5 px |
| 10 | `entzerreMarker()` ohne Resize-Handler | Marker überlappten nach jeder Fenstergrößenänderung |

## Behoben in UI v56

| # | Befund | Umsetzung |
|---|---|---|
| 1.1 | Schrift unter 13 px außerhalb ≥ 1201 px (~30 Stellen, bis 9 px) | Basiswerte in vier Schichten angehoben, `small: max(13px, .875em)`; der 1201-px-Block ist jetzt reiner Vergrößerungs-Pass. **Neues Gate** im `browser-smoke` misst die kleinste gerenderte Schrift bei 1024/700/390 px |
| 1.2 | Toter Legacy-Block der Inline-SVG-Karte | ~40 Zeilen gelöscht (`.karten-ebene`, `.stadt-strassen`, `.ebene-*`, `.marker-strich`, `fill`/`stroke` auf `.karten-marker > :first-child`) |
| 1.3 | Sechs Dockziele auf dem Telefon | Unter 701 px verlassen die Zentrale-Unterseiten das Dock und werden zum vollbreiten Streifen unter dem Kopf; neues Dockziel `#nav-zentrale`. Dock: vier feste Ziele, 319 px in 374 px, **kein interner Scroller mehr** |
| 2.3 | Breakpoint-Lücken | Regel in `DESIGN_SYSTEM.md` §6 festgehalten |
| 3.1 | Trefferflächen | `.info-tooltip` 24-px-Overlay (optisch weiter 17 px), `.fav` `min-width: 32px`, Checkboxen 17 px |
| 3.2 | Screen-Inset als geratene Konstante | Kopfhöhe und Inset teilen sich `--topbar-h`; an jedem Breakpoint gemessen und exakt deckungsgleich |
| 3.3 | Rest des Elementvertrags B1.3 | Bildzoom nativer `<button>` (eigener keydown-Zweig entfällt — er hätte `showModal()` doppelt gefeuert), SVG-Platzhalter `aria-hidden` bei vorhandenem WebP, vier Familien-Zustandsbalken als native `<meter>` |
| 3.4 | Topbar spannte über die volle Fensterbreite | Ab 1680 px auf Lesebreite begrenzt; Kopf, Inhalt und Dock stehen in einer Spalte |

Nachgemessen bei 390 / 700 / 730 / 1024 / 1280 / 1440 / 2560 px: kein
Seiten-Overflow, kein Topbar-Overflow, keine Kopf- oder Dock-Überlappung, keine
Schrift unter 13 px.

Gates grün: `simtest`, `chat-contracts` (33), `release-check`, `browser-smoke`,
`b0-economy`, `e-gameplay`, `f-turnaround`, `gh-development`, `catalog-market`,
`launcher-smoke`, `balance --seeds=300 --check`.

---

## Bewusst nicht gemacht

### CSS-Konsolidierung der Top-Selektoren (war 2.1)

Unverändert tief: `.ressourcenleiste` wird an 48 Stellen über sechs Schichten
angefasst, `.screens-nav` an 42, `.konto-karte` an 33, `.speed-group` an 27.
Praktische Folge: Um zu klären, warum die HUD-Gruppe bei 390 px überlief,
mussten sechs konkurrierende Regeln aus vier Dateien verglichen werden.

**Warum nicht jetzt:** Ein Umzug dieser Regeln wäre ein großer Diff quer durch
alle Schichten — ausgerechnet an den Selektoren, deren responsives Verhalten in
diesem Durchgang frisch nachgemessen wurde. Das Risiko, dabei still etwas zu
brechen, steht in keinem Verhältnis zum Nutzen; sichtbar ist davon für Spieler
nichts.

**Empfehlung:** Beim nächsten größeren UI-Paket komponentenweise angehen — je
Selektor eine zuständige Schicht festlegen und die Duplikate dorthin ziehen.
`test/chat-contracts.mjs` schreibt einzelne CSS-Strings fest; die Verträge beim
Verschieben mitziehen. `!important` ist von 51 auf 44 gesunken (durch das
gelöschte Legacy-CSS), sollte aber weiter fallen.

### Regeln ohne Treffer (war 2.2)

Die Momentaufnahme meldet weiterhin hohe Anteile nicht greifender Regeln
(`legacy-gameplay.css` 266/351). **Diese Zahl überzeichnet stark:** Sie misst
einen Zustand ohne offene Dialoge, ohne Portfolio, ohne Mietersuche, Renovierung
oder Endauswertung. Belastbar war nur der einzeln nachgewiesene Kartenblock —
der ist gelöscht. Kein Massenlöschen; beim nächsten Anfassen eines Screens
dessen Legacy-Regeln mitprüfen.

### Restliche Div-Messbalken

`ownership-meter`, `ltv-track`, `reserve-track` und `risiko-track` sind weiter
`<div>` mit Innen-`<i>`. Anders als die vier Familienbalken tragen sie
mehrstufige Farbsemantik (`risiko-kritisch` / `-angespannt` / `-kontrolliert`),
die ein `<meter>` zwar über `low`/`high`/`optimum` ausdrücken könnte — dann aber
mit Engine-eigenen Pseudoelementen neu gestylt werden müsste. Ohne die
Möglichkeit, das Ergebnis hier visuell abzunehmen (siehe Methodik oben), wäre
das eine Änderung auf Verdacht in vier dichten Finanzkarten.

**Empfehlung:** Beim nächsten Durchgang mit sichtbarem Browser nachziehen.

### Nicht Gegenstand dieses Reviews

- **Menschliche Verständlichkeit.** Ob Regeln, Zahlen und Konsequenzen ohne
  Erklärung tragen, bleibt das Owner-Gate aus `PLAYTEST.md` (Arbeitspaket A).
- **Reale Geräte, Screenreader, Tastaturweg von Hand.** Arbeitspaket C.
- **Ökonomische Balance.** Unverändert; die Seed-Matrizen laufen durch.
