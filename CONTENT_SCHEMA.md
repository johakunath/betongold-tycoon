# CONTENT_SCHEMA.md — Schemata für data/*.json

Inhalte sind **Daten, kein Code** (PLAN.md §9). Handgemacht für den Slice;
V2 generiert prozedural gegen dieselben Schemata. Alle Texte Deutsch.

## data/listings.json (Phase 2)

Array von derzeit 40 Listing-Objekten: 20 in Berlin sowie je 10 in Leipzig und
Meißen + Umland. Wohnungen und Häuser teilen denselben
Kauf-/Objektvertrag; artabhängige Kosten liegen in `js/immobilie.js`:

```jsonc
{
  "id": "bi-01",                  // eindeutig; Präfix bi/br/le/me = Segment; auch Asset-Dateiname
  "titel": "Stuck-Altbau am Kollwitzplatz",
  "segment": "berlin-innenstadt", // berlin-innenstadt | berlin-rand | leipzig | meissen-umland
  "adresse": "Prenzlauer Berg, Knaackstraße",   // Kiez/Straße, bewusst ohne Hausnummer
  "flaeche": 72,                  // m²
  "zimmer": 3,
  "etage": "3. OG, Altbau ohne Aufzug",
  "baujahr": 1908,
  "stil": "altbau",               // altbau | zeile60 | klinker90 | neubau | haus
  "objektart": "wohnung",         // wohnung | haus
  "eigentumsform": "weg",         // weg | alleineigentum
  "grundstueck": 0,                // m²; bei Wohnungen 0
  "aussenflaeche": 0,              // m² Balkon/Terrasse/Garten, sichtbare Nutzfläche
  "familienScore": 2,              // 0–5; zusätzlich zur Mindestzimmerzahl für Eigenheim
  "barrierearm": false,
  "kartenposition": { "x": 32, "y": 30 }, // stabil 0–100 innerhalb der Stadtebene
  "zustand": 3,                   // 1 sanierungsbedürftig … 5 neuwertig (sichtbarer Gesamteindruck)
  "energieklasse": "E",
  "hausgeld": 310,                // €/Monat gesamt; Haus = 0
  "laufendeKosten": null,          // Haus: {grundsteuer, versicherung, grundstueckspflege} €/Monat
  "lageScore": 8,                 // 1–10, treibt lageFaktor (ECONOMY_MODEL §8)
  "preisAufschlag": 1.12,         // Deal-Qualität: Angebotspreis = fairerWert · Aufschlag
  "provisionsfrei": false,        // false → Makler 3,57 % Nebenkosten
  "ausstattung": "bewohnt",       // bewohnt | unmoebliert | teilmoebliert; sichtbarer Übergabezustand
  "mietstatus": {                 // vermietet ODER leer
    "vermietet": true,
    "kaltmiete": 780,             // Bestandsmiete €/Monat (oft unter Markt)
    "mieterSeit": 2011,           // nur Anzeige/Flavor
    "hinweis": "langjährige Mieterin, zuverlässig"   // optional
  },
  "maklerText": "Charmanter Altbau …",  // 2–4 Sätze, mit verdächtigen Auslassungen
  "besichtigung": [               // aufgedeckt durch Besichtigung (sichtbarer Zustand)
    "Stuck gut erhalten, Dielen verzogen",
    "Bad aus den 90ern, funktional"
  ],
  "dokumente": [                  // aufgedeckt durch Dokumente (Protokolle, Wirtschaftsplan)
    "Instandhaltungsrücklage der WEG auffällig niedrig (12 €/m²)"
  ],
  "maengel": [                    // verborgen; Existenz pro Run: p · eventFaktor (ECONOMY_MODEL §13)
    {
      "name": "Feuchtigkeit in der Kellerwand",
      "kosten": 8500,             // Behebung €; unaufgedeckt nach Kauf × Überraschungsfaktor
      "p": 0.7                    // Basis-Existenzwahrscheinlichkeit
    }
  ],
  "sonderumlage": {               // optional; über Dokumente sicher aufdeckbar
    "anlass": "Dachsanierung beschlossen",
    "betrag": 9200,               // Anteil dieser Einheit
    "p": 0.8
  }
}
```

Regeln für Content-Autoren:
- **Kein perfekter Deal, kein wertloser Deal.** Mischung aus emotional
  attraktiven schlechten Käufen (schöner Altbau, Sonderumlage lauert) und
  langweiligen guten (90er-Klinker, vermietet, unspektakulär solide).
- `maklerText` lügt nie direkt — er lässt aus. Was er auffällig nicht
  erwähnt, sollte über Besichtigung/Dokumente/Gutachter findbar sein.
- Assets referenzieren die `id`: `assets/expose/{id}.webp`,
  `assets/cutaway/{id}_unsaniert.webp`, `assets/cutaway/{id}_saniert.webp`
  (siehe ASSET_MANIFEST.md). `stil` bestimmt den SVG-Platzhalter (js/iso.js).
- Für künftige Contentproduktion kann `assetStatus:"placeholder"` temporär
  gesetzt werden; dann dürfen die drei Rasterdateien absichtlich fehlen und der
  SVG-Fallback bleibt aktiv. Im aktuellen 40er-Katalog ist das Feld nirgends
  gesetzt und der Release-Check verlangt für jede ID alle drei Dateien.
- `kartenposition` bleibt nach Veröffentlichung stabil. Die Werte sind bewusst
  abstrakte Segmentkoordinaten, keine echten Hauskoordinaten.
- Eine WEG-Wohnung nutzt `hausgeld` und `eigentumsform:"weg"`. Ein Haus nutzt
  `hausgeld:0`, `eigentumsform:"alleineigentum"`, ein positives `grundstueck`
  und alle drei monatlichen `laufendeKosten`.
- Eigenheim-Eignung braucht Bezugsfreiheit, mindestens die konfigurierten Zimmer
  und `familienScore >= minFamilienScore`; bestehende Anlagewohnungen werden
  nicht bloß wegen ihrer Zimmerzahl als Familienheim umetikettiert.
- `ausstattung` beschreibt den aktuellen sichtbaren Übergabezustand, nicht den
  später gewählten Vermietungsweg. `unmoebliert` wird in beiden Cutaways ohne
  lose Möbel gezeigt; eine Renovierung ändert Oberflächen und Technik, nicht
  automatisch die Möblierung.

## data/tenants.json (Phase 3)

18 Bewerber-Dossiers. **Sichtbare Felder sind Hinweise, kein Score** — die
versteckten Qualitäten treiben das Verhalten (ECONOMY_MODEL §16), das Dossier
korreliert nur. Archetyp-IDs = Avatar-IDs (`assets/avatar/{id}.webp`,
ASSET_MANIFEST §3).

```jsonc
{
  "id": "t-01",
  "name": "Frau Kessler",              // Anzeigename
  "archetyp": "Beamtin",
  "haushalt": "alleinstehend, 47",     // Hinweis
  "beruf": "Verwaltungsangestellte, unbefristet",
  "nettoEinkommen": 3200,              // €/Monat — Basis für Einkommensquote (Miete/Einkommen)
  "haustiere": "keine",
  "bleibeAbsicht": "langfristig",      // Hinweis-Text (korreliert mit bleibe, nicht deckungsgleich)
  "referenzen": "lückenlos",
  "note": "wirkt penibel, fragt nach Ruhezeiten",  // Flavor + subtiler Hinweis
  // --- versteckt (nie in der UI zeigen) ---
  "zahlungsmoral": 0.95,               // 0..1 — hoch = zahlt zuverlässig
  "pflege": 0.9,                       // 0..1 — hoch = pfleglich, hält den Zustand
  "bleibe": 0.85,                      // 0..1 — hoch = bleibt lange
  "konflikt": 0.1                      // 0..1 — hoch = beschwert sich/mindert oft
}
```

Design: Manche Dossiers lesen sich besser als die versteckte Realität und
umgekehrt (der „langweilige" Bewerber ist oft der beste). Einkommensquote
(angesetzteMiete / nettoEinkommen) ist der ehrlichste sichtbare Anhaltspunkt;
alles andere ist Menschenkenntnis.

## data/events.json (Phase 3)

54 Events: 45 zufällig ziehbare Inhalte, 6 ausschließlich terminierte
Arc-Folgen und 3 Auftaktmomente. 2–3 Optionen, **keine strikt dominante** (PLAN §14).

```jsonc
{
  "id": "schimmel-bad",
  "titel": "Schwarze Flecken im Bad",
  "text": "Deine Mieterin schickt Fotos: Schimmel an der Badezimmerdecke …",
  "kategorie": "objekt",          // objekt | mieter | haushalt | kind
  "gewicht": 1.0,                 // relatives Ziehgewicht
  "bedingung": {
    "brauchtObjekt": true,        // braucht mind. ein Objekt (objekt/mieter)
    "vermietet": true,            // Zielobjekt muss vermietet sein
    "zustandMax": 3,              // nur bei Zielobjekt-Zustand ≤ 3
    "jahreszeit": null,           // null | "winter" | "sommer" (Monat-basiert)
    "einmalig": true,             // pro Run nur einmal
    "cooldownMonate": 24,         // Mindestabstand, falls nicht einmalig
    "kindAlterMin": 9,            // mind. ein Kind im Haushalt in diesem Alter …
    "kindAlterMax": 15,           // … (Jahre, inkl.; Auszugsalter beendet den Haushalt)
    "autoVorhanden": true,        // nur mit eingeplantem Auto (Pauschale > 0, ab autoAbMonat, Altersfaktor > 0)
    "vorRuhestand": true,         // nur vor dem Rentenalter
    "nachRuhestand": true,        // nur ab dem Rentenalter (Ruhestandsthemen)
    "nurMieter": true,            // nur ohne Eigenheim (z. B. Eigenbedarfskündigung)
    "mitEigenheim": true          // nur mit Eigenheim (z. B. Heizungsausfall zu Hause)
  },
  "optionen": [
    {
      "text": "Auf Lüften verweisen (Mieter-Ursache)",
      "effekt": { "familie": -2, "mieterKonflikt": 0.15, "mieterZufriedenheit": -0.1 },
      "arc": {
        "id": "schimmel-beobachtung",       // innerhalb des Objekts stabil
        "titel": "Schimmelursache klären",
        "nachMonaten": 3,
        "folgeEventId": "arc-schimmel-pruefung",
        "entscheidung": "Lüften"
      },
      "folge": "Die Mieterin ist verstimmt, aber es kostet nichts."
    },
    {
      "text": "Fachbetrieb beauftragen",
      "effekt": { "cash": -1800, "zustand": 1 },
      "folge": "Sauber saniert — und die Mieterin fühlt sich ernst genommen."
    }
  ]
}
```

Effekt-Schlüssel (alle optional, werden ohne RNG verrechnet):
`cash` (±€, aus Rücklage/Cash), `zustand` (± Stufe am Zielobjekt),
`miete` (± Kaltmiete am Zielobjekt), `mieterZufriedenheit` (±, beeinflusst
Auszug), `mieterKonflikt` (±), `auszug` (true → Mieter kündigt),
`familie` (± Punkte), `zeit` (± h einmalig), `ruecklage` (±€ direkt),
`sondertilgung` (+€; zieht denselben Betrag aus Cash und Restschuld),
`haushaltsMiete` (relative Änderung der eigenen Familienmiete, z. B. 0,15 =
neuer Vertrag +15 %). Eurobeträge stehen in Euro des Spielstarts und laufen
mit dem Preisniveau. Der Event-Dialog zeigt diese Effekte vor der Wahl als
Wirkungs-Chips (`optionWirkungen`); `zeit` wird derzeit nicht verrechnet und
daher nicht angezeigt.
`kategorie:"kind"` zählt gegen das Max-2-Kinder-Event-Limit (PLAN §5.9) und
braucht immer mindestens ein Kind im Haushalt; `kindAlterMin/-Max` grenzen das
zusätzlich ein. Die Haushaltsbedingungen filtern nur die Kandidatenliste nach dem
festen Event-Roll; die RNG-Position im Tick bleibt unverändert.
Zielobjekt-Wahl: seeded unter den passenden Objekten; ohne Zielbezug
(`haushalt`/`kind`) wirkt der Effekt auf den Haushalt.

`option.arc` plant eine persistente Objektgeschichte. `folgeEventId` muss auf
ein vorhandenes Event mit `gewicht: 0` und `bedingung.nurArc: true` zeigen.
Solche Folgeevents sind vom zufälligen Pool ausgeschlossen und werden nur im
gespeicherten Fälligkeitsmonat aktiviert. Arc-IDs, Folgeevent-IDs und
Listing-IDs bleiben save-stabil.

## data/stocks.json — entfernt (Save v21, 23.07.2026)

Die fiktive Einzelaktien-Sandbox wurde vollständig entfernt (`js/aktien.js` und
`data/stocks.json` gelöscht). Es gibt kein Wertpapier-Profilschema mehr. Das
Konzept bleibt nur in `IDEEN.md` als möglicher, klar abtrennbarer
Value-Investing-Ableger archiviert; ETF, Sparplan und Tagesgeld sind der
verbleibende Kapitalmarkt.
