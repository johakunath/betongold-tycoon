# PLAN.md — Produktspezifikation

Die Entwicklungsreihenfolge steht ausschließlich in `ROADMAP.md`; abgeschlossene
Arbeit in `DONE.md`. Dieses Dokument beschreibt das stabile Zielbild.

## Spielidee

Ein Entscheidungs-Labor für Haushalte: über Erwerbsleben, Ruhestand und
Lebensende Immobilien-, ETF-, Liquiditäts- und Eigenheimwege in komprimierter
Zeit ausprobieren — einschließlich der bewussten Entscheidung, nicht zu kaufen.
Die vier Startlagen sind entworfene Szenarien und bilden keinen konkreten
Haushalt ab; alle Annahmen sind im Startdialog und in den Einstellungen
editierbar. Das wichtigste emotionale Ziel ist, die Angst vor
der ersten realen Wohnungssuche und der wahrscheinlich größten Kaufentscheidung
des Lebens zu senken. Der Spieler soll Prüfen, Bieten, Nachverhandeln, Absagen
und Stabilisieren gefahrlos üben und dadurch Lust auf umsichtiges Handeln
bekommen. Es ist kein Vermarktungsprodukt und keine Anlageberatung.

Designpfeiler:

1. Plausible Trade-offs in komprimierter Zeit; Nichtkaufen ist eine valide Aktion.
2. Spaß durch häufige sinnvolle Handlungen, erkundbare Konsequenzen, sichtbare
   Veränderung und wiederholbare Seeds; Zahlen, Risiken und Regeln bleiben
   nüchtern und realistisch.
3. Sichtbarer Besitz: Objekte sind Orte mit Außen- und Innenansicht, keine
   Tabellenzeilen.
4. Opportunitätskosten bleiben als Welt-ETF-Linie sichtbar. Das ETF-Depot kann
   gekauft, bespart und verkauft werden, ohne den Immobilienkern durch
   Einzelaktienhandel zu verwässern.
5. Annahmen sind zentral konfigurierbar, aber der Default bildet die reale
   Familiensituation ab und wird nicht zugunsten eines schöneren Ergebnisses
   optimiert.

## Start, Welt und Ziel

Startlage und Schwierigkeit werden getrennt gewählt.

| Startpreset | Alter | Netto/Monat | Ausgaben/Monat | Tagesgeld | ETF | Kinder | Besonderheit |
|---|---:|---:|---:|---:|---:|---|---|
| Familienstrategie mit Puffer (Default) | 40 | 8.300 € + 520 € Kindergeld | 6.210 € | 90.000 € | 90.000 € | 3,5 und 0,6 | reales 24-Monats-Familienprofil; Auto ab Monat 5 |
| Klassischer Einstieg | 30 | 3.200 € | 2.200 € | 35.000 € | 5.000 € | keine | alleinstehender Aufbau |
| Viel Bestand, wenig Luft | 45 | 7.200 € | 5.050 € | 18.000 € | 5.000 € | 12 und 9 | 5 vermietete Objekte, 93–97 % LTV |
| Junger Handwerker-Azubi | 17 | 1.100 € | 930 € | 2.500 € | 0 € | keine | Gesellenlohn nach 3 Jahren, Handwerksbonus |

Beim Default sind 1.970 € Warmmiete (1.570 € kalt) enthalten. Ohne den aus den
letzten 24 Monaten auf 1.950 €/Monat gemittelten Reiseblock liegen die
Brutto-Ausgaben bei 4.260 €. Die Kinder werden mit zusammen 600 € direkten
Zusatzkosten separat ausgewiesen; Wohnen und Grundbedarf stecken bereits im
Haushalt. Zusätzlich fließen 260 € Kindergeld je Kind bis zum 27. Geburtstag
als eigene Einnahme ein. Dadurch ergibt sich eine Start-Sparrate von 2.610 €.
Davon fließen im Default automatisch 50 % (anfangs 1.305 €) ins echte ETF-Depot
und 50 % aufs Tagesgeld; das Tagesgeld
wird im Preset mit 2 % p.a. verzinst. Der klassische Einstieg legt 25 % seiner
positiven Sparrate ins ETF-Depot und 75 % aufs Tagesgeld; sein Tagesgeld nutzt
den Basissatz von 1,5 % p.a.

Heute besteht kein Auto. Ab Spielmonat 5, wenn Kind 2 ein Jahr alt ist, werden
vorläufig 600 €/Monat all-in als zusätzlicher Cashflow angesetzt. Einkommen,
Alltag, Reisen und Auto folgen danach transparent dokumentierten Altersphasen;
ab 67 gilt zusätzlich der Rentenfaktor. Die Startdialog-Einstellungen trennen:

- **nur beim neuen Spiel:** Startalter, Kinderalter, Tagesgeld und ETF;
- **auch später ab dem nächsten Monat:** beide Arbeitsnettos, Warm-/Kaltmiete,
  Lebenshaltung, Reisen, Autozeitpunkt/-betrag, Kindergeld, Kinderstaffeln,
  Wachstums- und Altersfaktoren, Sparplan und Kapitalannahmen.

Abgeleitete Summen wie Gesamtausgaben und Sparrate sind nie eigenständig
editierbar; sie werden aus den sichtbaren Einzelannahmen berechnet.

Der Schuldenberg-Sonderstart übernimmt fünf echte, bereits vermietete
Marktobjekte mit gestaffelten Zinsbindungen und zusammen mehr als 1 Mio. €
Restschuld. Der knappe Puffer und 93–97 % Beleihung machen ihn zu einer
Turnaround-Herausforderung: Der Spieler soll Monatsverlust, Zinsrisiko und
Puffer mit mehreren glaubwürdigen Hebeln stabilisieren. Mietprüfung,
kostenpflichtige Ratenstreckung oder ein verzögerter Verkauf bilden dafür zwei
messbare Linien; ein freiwilliges Fünfjahresziel hält die Stabilisierung länger
sichtbar. Der Handwerker-Azubi beginnt mit 17 in Leipzig, geringem
Einkommen und 26 Stunden monatlichem Zeitbudget. Nach 36 Monaten steigt das
Basiseinkommen planmäßig um Faktor 1,75; Renovierungsschätzungen sind 30 %
günstiger, die Basisdauer 25 % kürzer und das Überziehungsrisiko reduziert.
Diese Profilvorteile sind im Startdialog und bei Renovierungen sichtbar.

Der Ruhestand beginnt standardmäßig mit 67 und senkt das Haushalts-Netto auf
55 % des bis dahin nominal fortgeschriebenen Erwerbsnettos. Er beendet die
Partie nicht. Das Lebensende liegt je Seed im Default zwischen 90 und 100;
langfristiger Zeitüberzug und negative Liquidität können den Zeitpunkt innerhalb
dieses Fensters um höchstens vier Jahre vorziehen. Das ist ein transparentes
Spielmodell, keine individuelle Lebenserwartungsprognose.

Das echte ETF-Depot kann für Eigenkapital verkauft werden. Leicht/Normal/Schwer
skalieren Startvermögen und Einkommen (105/100/95 %) und verändern Bankstrenge,
Eventlast sowie Volatilität. Normal bildet die obigen 8.300 € exakt ab.

Aktuelle Segmente: Berlin Innenstadt, Berlin Rand, Leipzig und Meißen + Umland. Berlin ist im
Modell besonders restriktiv und mieterfreundlich (10-%-Kappung/36 Monate,
stärkerer Konflikt bei Erhöhungen); Leipzig moderater (15 %/36 Monate). Meißen
ergänzt einen günstigeren Heimatmarkt mit Mietspiegel, allgemeiner
20-%-Kappungsgrenze und Haus-/Grundstücksangeboten. Werte sind plausible, tunbare Spielannahmen, keine
Rechts- oder Anlageberatung.

Am Kampagnenende werden fünf gleichwertige Dimensionen bewertet:
Nettovermögen, nachhaltiger Cashflow, Resilienz, Stress und Familie. Dazu kommen
deterministische Vergleichslinien für Welt-ETF, Eigenheim-first und
Invest-first auf demselben Seed.

## Kernschleife

1. Angebote entdecken, favorisieren und vergleichen.
2. Außen- und Innenansicht prüfen; Besichtigung, Dokumente oder Gutachter
   auswählen; bieten oder weggehen.
3. Finanzierung mit Eigenkapital, Tilgung, Bindung und Nutzungsart planen.
4. Kaufen, renovieren, vermieten und zwischen menschlichen Bewerbern wählen.
5. Monatliche Geld-, Zeit- und Familienfolgen sowie Dilemma-Events bewältigen;
   nach wichtigen Handlungen die konkrete Vorher-/Nachher-Wirkung erleben.
6. Miete anpassen, Verwaltung/Rücklagen steuern, Eigenheim kaufen oder Objekt
   mit sechs Monaten Friktion verkaufen.
7. Ein freiwilliges 3–8-Jahres-Ziel verfolgen, Folgen früherer
   Objektentscheidungen erleben und Arbeitsmodell oder Eigenleistung gegen
   Geld, Zeit und Familie abwägen.

Die spielerische Qualität entsteht nicht durch die Menge möglicher Menüpunkte,
sondern durch eine wiederkehrende Kette aus Anlass, begrenzter Prüfung,
menschlicher oder finanzieller Entscheidung und sichtbarer Wirkung. Die bereits
vorhandenen Bewerberdossiers, Leerstandskosten, Due-Diligence-Schritte und
Gebotsentscheidung sind das Referenzmuster: konkret, kontextgebunden und mit
einem verständlichen Verzicht. Dieses Muster soll auch Renovierung,
Refinanzierung, Familienzeit und Portfolio-Stabilisierung tragen.

## Langfristige Entwicklung, Familie und Arbeit

Drei optionale mittelfristige Ziele geben Orientierung, ohne eine zweite
Questökonomie zu eröffnen: erstes stabiles Mietobjekt (36 Monate), Eigenheim
(96 Monate) oder Bestand stabilisieren (60 Monate). Fortschritt wird aus echten
Bestands-, Haushalts- und Pufferwerten berechnet. Wechsel und Pause sind frei;
es gibt keine Geld-, Punkte- oder Zufallsbelohnung.

Wenige Objektgeschichten verbinden Entscheidungen über mehrere Monate.
Schimmel-, Nachbarschafts- und Finanzierungsereignisse können terminierte
Folgeevents erzeugen, deren Zustand und Wirkung am betroffenen Objekt sichtbar
bleiben. Ein separates Ruf- oder Beziehungssammelsystem gehört nicht zum MVP.

Arbeit verwendet drei verständliche Modelle mit zwölf Monaten Mindestbindung:
Balance, Karriere mit mehr Netto gegen weniger Zeit/Familie und Familienzeit
mit weniger Netto gegen mehr Zeit/Familie. Kommende Auto-, Einkommens-,
Ruhestands- und Kinderphasen werden rechtzeitig angekündigt. Eigenleistung bei
Renovierungen ist optional und spart nur gedeckelt; dafür bindet sie monatliche
Zeit und erhöht das Kostenrisiko. Alle Zahlen sind als editierbare
Spielannahmen ausgewiesen.

## Finanzsprache und Balanceziel

Alle Screens verwenden dieselben vier Ebenen und vermischen sie nicht:

- **Cashflow (Haushalt):** laufendes Einkommen und Alltag plus Objektwirkungen,
  vor freiwilliger ETF-Umschichtung;
- **Objekt-Cashflow:** Miete minus Owner-Kosten, Verwaltung, Rücklage und volle
  Kreditrate;
- **Vermögensaufbau:** ETF-Einzahlung, Tilgung und gebildete Rücklagen;
- **Tagesgeld-Veränderung:** tatsächliche Kontobewegung inklusive Transfers und
  Einmaleffekten.

Die Finanzierungsquote (LTV) bleibt ein sekundärer, aber wirksamer Risiko- und
Kreditwert. Handlungsnäher und deshalb prominenter sind Eigenkapital, Rate,
Restpuffer und stabilisierter Objekt-Cashflow. Vor und nach Steuer dürfen
identisch sein, wenn kein positives steuerliches Vermietungsergebnis entsteht;
das wird einmal begründet statt als zweite scheinbar andere Kennzahl gezeigt.

Realismus bedeutet nicht, dass jede Wohnung rentabel sein muss. Das Spiel muss
aber in jedem Markt mehrere auffindbare, plausible Wege bieten, auf denen
Prüfen, Verhandeln, Vermieten oder Verbessern einen schlechten Ausgang erkennbar
in Richtung Tragfähigkeit bewegt. Ein Markt, in dem fast jede Analyse nur
„nicht kaufen“ ergibt, verfehlt das Ziel ebenso wie eine Renditegarantie.

## UI-, Layout- und Elementprinzipien

Die v36-Gestaltung bleibt bestehen. Einfachheit bedeutet innerhalb dieses
Designs:

1. **Eine Quelle pro Inhalt:** Bestand hat einen Hauptscreen, Meldungen ein
   Archiv und jede Kennzahl eine definierte Bedeutung. Andere Orte dürfen
   zusammenfassen oder verlinken, aber keine abweichende zweite Version führen.
2. **Eine Aufgabe pro Screen:** Stadt orientiert, Marktplatz sucht, Exposé prüft,
   Objektdetail bewirtschaftet, Finanzen verschiebt Liquidität und Zentrale
   erklärt Vermögen/Haushalt. Die wichtigste nächste Handlung steht vor
   vollständigen Detailtabellen.
3. **Progressive Offenlegung:** Kernurteil, Risiko und Aktion zuerst; lange
   Faktenblöcke, Herleitungen und seltene Einstellungen in sinnvoll
   beschrifteten Detailsektionen.
4. **Native-first:** Das semantisch passende HTML-Element ist verbindlich und
   wird nicht durch ein nachgebautes `div` ersetzt.

Elementvertrag:

- Hauptnavigation: `<nav>` + Buttons mit `aria-current`; In-Screen-Ansichten:
  Tabs mit genau einem Panel pro Tab; binäre Ansichts-/Filterwahl:
  `aria-pressed`-Buttons.
- Exklusive Formwahl: `<fieldset>`/`<legend>` + Radios; unabhängige Option:
  Checkbox; Zahlenbereich: Range/Number + `<output>`.
- Faktenpaare: `<dl>`; mehrspaltiger Vergleich: `<table>` mit Headern;
  zeitliche Historie: `<ol>` + `<time>`; begrenzter Wert: `<meter>`; laufender
  Fortschritt: `<progress>`.
- Zusätzliche Details: `<details>/<summary>`; Overlays: natives `<dialog>`;
  Bildzoom: nativer Button mit genau einem zugänglichen Bild.
- Eine Karte ist ein `<article>` mit sichtbarer echter Aktion. Die ganze Karte
  wird nicht unsichtbar klickbar gemacht, wenn Titel und CTA bereits denselben
  Weg anbieten.

Die fünf Hauptziele bleiben Stadt, Zentrale, Marktplatz, Objekte und Finanzen.
„Objekte“ wird nicht zusätzlich als Zentrale-Tab geführt. Post ist eine Vorschau
des kanonischen Meldungsarchivs; ein drittes abweichendes Ereignislog entfällt.

## MVP-Systeme und Inhalt

- 40 handgefertigte Listings: 20 in Berlin sowie je 10 in Leipzig und Meißen +
  Umland, einschließlich Wohnungen, Reihen-/Doppelhäusern, freistehenden EFH,
  Neubauten, gutem Bestand und klaren Sanierungsfällen. 18 Mieterdossiers und
  25 zufällig ziehbare Events plus 5 ausschließlich terminierte Arc-Folgen
  liegen als JSON vor. Jedes Listing besitzt eine eigene
  Außenansicht und zwei passende Zustands-Cutaways.
- Seeded Markt-, Zins-, Event- und ETF-Pfade; Autosave, benannte Slots und
  JSON-Export/-Import.
- Annuitätendarlehen, Nebenkosten, Anschlussfinanzierung, vier
  Renovierungsstufen, Mieterfluktuation, Hausverwaltung und Rücklagen.
- Eigenheim mit Mindestgröße, vereinfachter Jahressteuerbescheid, Verkauf,
  fünf Endscores und Entscheidungstimeline.
- Admin-Panel mit Whitelist, sicherem Reset und Wirksamkeit ab Folgemonat.
- Eine atmosphärische Stadtbühne mit vier wählbaren Marktsegmenten — Berlin
  Innenstadt, Berlin Rand, Leipzig sowie Meißen + Umland. Eine gleichwertige
  Ortsliste darf als umschaltbare Alternative bestehen, wird aber nicht
  gleichzeitig als zweite vollständige interaktive Navigation daneben gezeigt.
- Desktop-first, tablet-/mobile-tauglich, tastaturbedienbar, Reduced Motion.

## Visuelles Ziel

Das umgesetzte UI-v36-Design ist die visuelle Basis: ein dunkles, warmes
City-Builder-Bild mit Goldakzenten, lokaler Cormorant-/Alegreya-Typografie,
atmosphärischer Stadtbühne, dauerhafter Ressourcenleiste und fünf klaren
Bottom-Navigationswegen. Sichtbarer Besitz, kurze Wege und reaktives Feedback
stehen vor Dashboard-Dichte. WebP-Heroart und Cutaways folgen
`STYLE_GUIDE.md`; UI, Charts und Fallbacks bleiben CSS/SVG.

Es ist kein weiterer vollständiger Design-Rework geplant. Offene visuelle
Arbeit ist ein fokussierter Kohärenz-, Dichte- und Responsive-Pass: keine
überlappenden Ortskarten, weniger verschachteltes Scrollen, wichtige Inhalte
nicht unnötig unterhalb des Folds und klare Priorität innerhalb jedes Screens.

## Technischer Rahmen und Scope-Grenze

Statische GitHub-Pages-Seite, Vanilla JS, kein Build. Fachdetails stehen in
`ARCHITECTURE.md`, `ECONOMY_MODEL.md` und `CONTENT_SCHEMA.md`.

Nicht Teil des aktuellen MVP: Einzelaktienhandel, echte Geodaten/exakte
Hauskoordinaten, Reputation, WG-Einzelvermietung, weitere Rechtsräume,
individuelle Zimmerdekoration und Audio. Der frühere
Einzelaktienentwurf ist in `IDEEN.md` archiviert und käme höchstens als späteres,
optionales Value-Investing-Modul infrage. Andere Kandidaten bleiben dort, bis
der Owner sie priorisiert.
