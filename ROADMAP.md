# ROADMAP.md — aktive Entwicklung

Nur offene oder kommende Arbeit steht hier. Abgeschlossene Arbeit liegt datiert
in `DONE.md`. Die Reihenfolge ist Produktpriorität, keine Zusage, alle Punkte
eines Pakets gleichzeitig zu bauen.

## Leitentscheidung und Reihenfolge

> Der Spieler soll Lust bekommen, eine echte Wohnung zu suchen, zu prüfen und
> eine begründete Entscheidung zu treffen. Das Spiel belohnt Handeln, Lernen,
> sichtbare Verbesserung und kontrolliertes Risiko — nicht nur Tabellenanalyse
> oder garantiert steigendes Vermögen.

1. **P0 — den Kern spielerisch machen:** häufiger entscheiden, Wirkung erleben,
   Fortschritt feiern und reale Kaufschritte gefahrlos üben.
2. **P0 — „Viel Bestand, wenig Luft“ zum echten Turnaround-Spiel machen:**
   glaubwürdige Sanierungshebel statt passivem Pufferabbau.
3. **P1 — Cashflow-Balance nach korrekter Darstellung kalibrieren:** Kosten,
   Mieten und plausible Bewirtschaftungswege mit der 40er-Matrix prüfen.
4. **P1 — Einzelaktien-Code aus dem Kernstate entfernen:** Die UI ist seit v32
   scopekonform; Engine-, Save- und Testreste folgen als eigener Fachpass.
5. **P1 — langfristige Vielfalt und Familie vertiefen:** wenige starke,
   miteinander verknüpfte Systeme statt vieler kleiner Menüpunkte.
6. **P3 — Kapitel/Kampagnenrhythmus:** erst nach einem abwechslungsreichen und
   befriedigenden Monatskern.

## Arbeitspaket B0 — Balance nach korrekter Darstellung (P1)

Die UI trennt Haushaltsüberschuss, Objekt-Cashflow, Vermögensaufbau und die
Tagesgeld-Veränderung. Auf dieser Basis wird dieselbe 40-Listing-Matrix für
mehrere Eigenkapital-, Tilgungs-, Miet- und Vermietungswege erneut ausgewertet.

Zu prüfen:

- Preis-/Mietverhältnisse je Region und Objektart;
- Hausgeld pro m² und dessen reale Bestandteile;
- doppelte oder zu konservative Rücklagenannahmen;
- Bestandsmieten, Mietsteigerungswege und realistische Leerstandsphasen;
- mehrere glaubwürdige Investmentpfade je Markt, ohne positiven Cashflow für
  jedes Objekt zu garantieren;
- ein getrennter Economy-Entscheid zu Verlustverrechnung oder Verlustvortrag.

Ausgangsdiagnose vom 18.07.2026: Mit dem früher missverständlich benannten
20-%-Schnellwert, 2 % Anfangstilgung und regulärer Folgevermietung waren 0/40
Standardfälle positiv; Median −644 €/Monat. Selbst echte 80-%-Finanzierung
ergab nur 1/40 positive Fälle. `me-10` bleibt wegen 205 € Hausgeld bei 34 m² ein
besonders prüfpflichtiger Datensatz. Es wird weder pauschal die Miete erhöht
noch eine Renditegarantie eingebaut.

## Arbeitspaket B — Scope-Bereinigung (P1)

### B1. Verbliebenen Einzelaktien-Code aus dem Kern entfernen

- Einzelaktien-Screens und -Navigation sind seit UI v32 entfernt.
- Orders, Kurspfade, Depotstate, Content-Fetches und aktienspezifische Tests in
  einem getrennten State-/Save-Pass entfernen.
- ETF-Depot, Sparplan, Kauf/Verkauf, Opportunitätskosten und vereinfachte
  Kapitalertragsteuer vollständig erhalten.
- Das alte Konzept bleibt nur in `IDEEN.md` als möglicher, klar abtrennbarer
  Value-Investing-Ableger archiviert.

## Arbeitspaket E — Vom Analysieren zum Handeln (P0)

### E1. „Mut zum ersten Kauf“-Schleife

Eine Wohnungssuche wird als kurze, wiederholbare Handlungskette spielbar:

1. persönlicher Anlass oder plausibles Angebot;
2. zwei bis vier echte Prüfhandlungen mit begrenzter Zeit und Geld;
3. verständlicher Erkenntnisgewinn statt bloßer Prozentwerte;
4. begründete Entscheidung: bieten, verhandeln, beobachten oder weggehen;
5. sichtbare Wirkung auf Objekt, Haushalt, Wissen und nächste Chance.

Ein guter Weggang zählt als Erfolg. Unsicherheit wird reduziert, nicht durch
eine sichere Rendite ersetzt.

### E2. Mehr sinnvolle Monatszüge

- Pro Monat mindestens ein klarer Anlass oder bewusstes „weiter beobachten“.
- Stadt/Post als Einstieg in Situationen; Marktplatz für Suche und Vergleich;
  Objektansicht für Prüfung und Bewirtschaftung.
- Quartalsbericht und „Nächster kluger Zug“ verdichten Wirkung, ohne den Spieler
  zu einer bestimmten Anlage zu drängen.
- Wiederholte Routineaktionen bündeln, seltene Entscheidungen hervorheben.

### E3. Ehrliches Erfolgsfeedback

- Fortschritt an Wissen, Reserve, Zustand, Vermietbarkeit und reduzierter
  Unsicherheit zeigen, nicht nur am Nettovermögen.
- Vorher/Nachher bei Renovierung und Bewirtschaftung sichtbar machen.
- Kauf, Vermietung, gelöster Mangel und bewusst verworfener Deal bekommen kurze,
  nüchterne Abschlussmomente.

Abnahme: Ein neuer Spieler kann Anlass → Prüfung → Entscheidung → Wirkung ohne
Hilfe durchspielen und versteht, warum auch Nichtkaufen eine valide Aktion ist.

## Arbeitspaket F — „Viel Bestand, wenig Luft“ als Turnaround (P0)

Das Schuldenberg-Preset darf nicht nur Liquidität abbauen. Benötigt werden echte
Gegenhebel mit Kosten und Nebenwirkungen:

- Objekttriage nach Cashflow, Risiko, Arbeitslast und gebundenem Eigenkapital;
- Verkauf, Refinanzierung, Verwaltung, Renovierung und Vermietungsweg als
  unterscheidbare Sanierungsoptionen;
- begrenzte Bank-/Zeitfenster und sichtbare Konsequenzen des Nichtstuns;
- messbare Zwischenziele wie positiver Objektverbund, Reserveaufbau oder
  reduzierte Zinsbindungsrisiken;
- keine kostenlose Rettung und kein unvermeidbarer Abstieg.

## Arbeitspaket G — Langfristige Vielfalt (P1)

### G1. Objekt- und Portfolio-Arcs

- wenige mehrmonatige Objektgeschichten statt vieler isolierter Popups;
- Zustands-, Mieter-, Nachbarschafts- und Finanzierungsfolgen verbinden;
- Entscheidungen verändern spätere Optionen und Texte nachvollziehbar.

### G2. Mittelfristige Ziele

- freiwillige 3–8-Jahres-Ziele wie erstes stabiles Mietobjekt, Eigenheim oder
  Turnaround;
- Zielwechsel ohne versteckte Strafe;
- Fortschritt über bestehende Systeme, kein paralleler Quest-Apparat.

### G3. Ruf und Beziehungen (P2)

Nur weiterverfolgen, wenn Makler-, Bank-, Handwerker- oder Mieterbeziehungen
mehrere vorhandene Systeme sinnvoll verbinden. Kein separates Sammelsystem.

## Arbeitspaket H — Familie, Zeit und Arbeit (P1)

- wenige echte Familienentscheidungen mit Finanz-, Zeit- und Zufriedenheits-
  Trade-offs;
- Karriere-/Gehaltsoptionen nur mit gegenläufigem Zeitbudget;
- Eigenleistung als begrenzte Fähigkeit, nicht als kostenloser Rabatt;
- Lebensphasen verständlich ankündigen und im nächsten Zug berücksichtigen;
- private Annahmen weiterhin editierbar und klar als Spielmodell benennen.

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
