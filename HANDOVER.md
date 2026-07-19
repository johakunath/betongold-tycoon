# HANDOVER.md — aktueller Projektstand

**Stand:** 19.07.2026, Claude (UI-Review-Bereinigung)  
**Versionen:** SAVE_VERSION = 15, UI_VERSION = 36

UI v36 ist ein reiner Redundanz-, Kohärenz- und Semantikpass über das
konsolidierte v35-Handoff. Ökonomie, Saveformat und Screens sind unverändert;
geändert wurden Markup-Semantik, doppelte Darstellungen und toter UI-Code.

## Änderungen in UI v36

- **Tote Einzelaktien-Reste entfernt:** `renderAktien`/`renderAktienVorschau`
  samt Helfern aus js/ui/finanzen.js, `aktieKaufen`/`aktieVerkaufen` aus
  main.js, ~110 Zeilen `aktien-*`-CSS, Icons `icon-stock`/`icon-flow`.
  Engine/State/Content der Aktien bleiben bewusst stehen (separater Pass laut
  ROADMAP.md).
- **Eine Darstellung pro Zahl:** Die Haushaltsrechnung (Zentrale → Haushalt)
  und die Objekt-Monatsrechnung rendern jede Position genau einmal als
  Balkenzeile mit Betrag; Zwischensummen sind abgesetzte `flow-summe`-Zeilen.
  Die parallelen Tabellen (`#haushalt-tabelle`, Objekt-P&L-Tabelle) sind weg.
- **Gemeinsamer „Nächster kluger Zug":** `naechsterZugEmpfehlung()` in
  js/ui/kennzahlen.js liefert die Empfehlung für Stadt und Zentrale; nur die
  Standardempfehlung bleibt screen-spezifisch (nie der eigene Screen).
- **Navigation kohärent:** `aktualisiereNavMarkierung()` in shell.js ist die
  einzige Quelle für die aktive Bottom-Navigation und folgt dem aktiven
  Zentrale-Tab („Objekte"-Tab ⇄ „Objekte"-Navpunkt, sonst „Zentrale").
  Post-Einträge der Stadt öffnen jetzt den Haushalt-Tab (Ereignislog).
- **Elementtypen:** Zentrale-Tabs mit vollem Tabs-Muster (`aria-controls`,
  `role="tabpanel"`-Panels, roving tabindex, Pfeil-/Home-/End-Tasten).
  Stadtauswahl ist ein `aria-pressed`-Filter wie die Statusfilter darüber.
  Info-Tooltips sind echte `<button class="info-tooltip">` (Optik unverändert,
  auch via `faktenLabel()`). Markt- und Bestandskarten tragen den Öffnen-Weg
  als echten Button im Titel (`.karte-titel`); `role="link"/"button"` und
  manuelle Keydown-Handler auf den Artikeln sind entfernt, der Kartenklick
  bleibt Zeigegeräte-Komfort. „Prüfen" auf der Marktkarte entfiel — Karte und
  Titel öffnen das Exposé, „Gebot abgeben" bleibt die Primäraktion.
- **Semantische Key-Value-Blöcke:** `finanz-kurzwerte`, `quartals-kpis` und
  `objekt-kennzahlen` sind `<dl>`; die Startvorschau ist eine Liste.
- **Kleinigkeiten:** Finanzen-H1 heißt „Finanzen" (Eyebrow „Konten & Depot"
  trägt den Rest); „Stadt" statt „Karte/Stadtkarte" in Nutzertexten;
  Export/Import ohne Pfeil-Glyphen.

## Zahlen- und Interaktionsverträge

js/ui/kennzahlen.js liefert gemeinsame normalisierte Ableitungen:

- Haushaltsüberschuss vor freiwilliger ETF-Umschichtung;
- Objekt-Cashflow nach Owner-Kosten, Rücklage, Verwaltung und Kreditrate;
- Vermögensaufbau aus ETF, Tilgung und Rücklagen;
- Liquiditätspuffer in Haushaltsmonaten;
- Empfehlung „Nächster kluger Zug" (Liquidität → Leerstand → Marktangebot).

Der HUD zeigt den normalisierten Haushaltsüberschuss. Die tatsächliche
Tagesgeld-Veränderung des letzten Monats steht als Summenzeile in der
Haushaltsrechnung und im Cashflow-Popover. Das Cashflow-Popover öffnet auf
Hover/Fokus flüchtig, bleibt nach Klick gepinnt und schließt per zweitem
Klick, Außenklick oder Escape.

Die Finanzierung zeigt bei Leerstand „Bis zur Vermietung" und „Nach geplanter
Vermietung". Wohnungen erklären die WEG-Kosten aufklappbar. Eine Steuerwirkung
von null erscheint genau einmal mit Grund. LTV bleibt als sekundäre
„Finanzierungsquote" erhalten; Kauf, Kredit, Objektmonat und Haushaltswirkung
sind getrennt.

## Unverändert

- Statische Vanilla-JS-App ohne Build oder Runtime-Dependency.
- 40 Listings: Berlin 20, Leipzig 10, Meißen + Umland 10; alle mit
  Außenansicht und zwei Zustands-Cutaways.
- 159 Assets, 14,27 MB; Assetbudget unter 15 MB. Cormorant Garamond und
  Alegreya Sans lokal als WOFF2 inklusive OFL-Lizenztexten.
- Saveformat und Ökonomie unverändert: SAVE_VERSION = 15.
- Lokaler Start über BETONGOLD_STARTEN.cmd beziehungsweise
  node tools/start-game.mjs; niemals file://.

## Verifikation 19.07.2026 (UI v36)

Grün:

- JavaScript-Syntax: alle js/- und js/ui/-Dateien.
- test/simtest.mjs.
- test/chat-contracts.mjs: 24 Owner-Verträge (Finanzen-Titel- und
  UI-Versionsvertrag auf v36 nachgezogen).
- test/balance.mjs / balance-regressions.mjs: nicht erneut gelaufen — keine
  Ökonomieänderung in diesem Pass.
- test/browser-smoke.mjs: kompletter Kaufpfad, Transfer-Slider, Stadtsegmente,
  Finanzierung, Accessibility und 1440/1024/700/390 px. Selektoren für die
  vereinheitlichte Haushaltsrechnung (`#cashflow-viz .flow-zeile`) und die
  aria-pressed-Stadtauswahl angepasst. Hinweis: Nach „BROWSER-SMOKE OK" kann
  auf Windows ein EBUSY beim Aufräumen des Chrome-Tempprofils erscheinen;
  das ist kein Testfehler.
- test/release-check.mjs: UI v36, vollständiger Modulgraph auf ?v=36.

Zusätzlich im lokalen In-App-Browser geprüft: Navigations-/Tab-Synchronisation
(Zentrale-Tab wechseln aktualisiert die Bottom-Navigation), vereinheitlichte
Haushaltszeilen inkl. Kinder-/Kindergeld-Posten, Tooltip-Buttons in alter
Optik, Marktkarten-Titelbutton öffnet das Exposé, kein horizontaler Overflow,
keine Konsolenfehler.

## Bewusst offen

1. Balancepass B0: Preis/Miete, Hausgeld/Rücklagen und plausible positive
   Investmentpfade nach der nun korrekten Darstellung kalibrieren.
2. Einzelaktien-Engine, Depotstate, Content-Fetch und Tests in einem separaten
   Save-/State-Pass entfernen; die UI ist scopekonform und frei von totem
   Aktien-Code.
3. Gameplaypakete E/F aus ROADMAP.md: Handlungsschleife und Turnaround.
4. Owner-only-Playtest, reale Geräte und manueller Screenreadercheck.
