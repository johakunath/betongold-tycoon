# ECONOMY_MODEL.md — Formeln

Alle Parameter kommen aus `js/config.js` (`DEFAULT_CONFIG`), pro Spielstand als
Kopie in `state.config` (das Admin-Panel ab Phase 5 editiert diese Kopie;
Änderungen greifen zum nächsten Tick). Implementierung: `js/engine.js`.

**Konvention:** Alle Größen nominal (keine Inflationsbereinigung im Modell —
Inflation steckt implizit in den Wachstumsraten). Ein Tick = ein Monat. Das ist
für relative Strategie-Vergleiche intern konsistent, macht langfristige
Endbeträge aber nicht als heutige Kaufkraft lesbar. Der geplante Umbau auf
explizite Inflation, Preisniveauindex und Nominal-/Realwertanzeige steht als
Arbeitspaket D in `ROADMAP.md`; bis dahin darf kein zusätzlicher Inflationssatz
auf die bestehenden nominalen Raten aufgeschlagen werden.

## 1. Zeit

- Harte Kampagnenobergrenze: `(lebensendeMaxAlter − startAlter) · 12` Monate.
  Default heute: höchstens 720 Monate (40→100); klassisch 744, Schuldenberg
  660 und Handwerker-Azubi 996 Monate. Das tatsächliche Ende liegt monatsscharf
  am seed- und stressabhängigen `zielAlter`, standardmäßig zwischen 90 und 100.
- `state.monat` = gelebte Monate seit Start, 0-basiert. `historie[i]` = Zustand
  nach `i` Monaten (Eintrag 0 = Start); am Ende gilt immer
  `historie.length = monat + 1`.

Lebenshorizont und Langzeitstress sind ein vereinfachtes, transparentes
Spielmodell, keine individuelle Lebenserwartungsprognose:

```
basisAlter       = minAlter + lebensZufall · (maxAlter − minAlter)
stressIndex      = clamp((Ø Zeitüberzug · 4 + DispoMonatsanteil · 40) / 100, 0, 1)
stressMalus      = min(stressMalusMaxJahre · stressIndex, basisAlter − minAlter)
zielAlter        = clamp(basisAlter − stressMalus, minAlter, maxAlter)
```

`lebensZufall` wird einmalig aus `lebensRngState` gezogen. Der separate Strom
verändert keine Markt-, ETF-, Aktien- oder Eventfolge. Default: 90–100 Jahre,
höchstens vier Jahre Stressmalus und nie ein Ende vor 90.

## 2. Haushalt (Phase 1)

Monatliche Wachstumsanwendung stetig: `wert(m) = basis · (1 + p.a.)^(m/12)`.

```
erwerbsnetto(m)  = (nettoPersonA + nettoPersonB)
                    · (1+einkommensWachstum)^(m/12)
                    · altersfaktorEinkommen(elternAlter)
                    · Π sprung.faktor  für alle sprung mit m ≥ sprung.abMonat
einkommen(m)     = erwerbsnetto(m)                                  vor rentenAlter
                  = erwerbsnetto(m) · rentenNettoFaktor             ab rentenAlter
kindergeld(m)    = Σ pro Kind: 260 €, solange kindAlter < 27
miete(m)         = miete           · (1+mietWachstum)^(m/12)
alltag(m)        = (lebenshaltung − reisen) · kostenwachstum
                    · altersfaktorAlltag(elternAlter)
reisen(m)        = reisen · kostenwachstum · altersfaktorReisen(elternAlter)
auto(m)          = 0 vor autoAbMonat
                  = autoKostenMonat · kostenwachstum · altersfaktorAuto danach
lebenshaltung(m) = alltag + reisen + auto
kinder(m)        = Σ pro Kind: staffel(alter) · (1+kostenWachstum)^(m/12)
sparrate(m)      = einkommen + kindergeld − miete − lebenshaltung − kinder
```

Kinderkosten-Staffel nach Alter (`kinderKosten`, letzte Stufe gilt bis
`auszugsAlter`, danach 0). Das Alter läuft ab dem Dezimal-Startalter
monatsscharf weiter. `kindergeldProKind = 260 €` und
`kindergeldBisAlter = 27` sind feste Owner-Szenarioannahmen: Das Kindergeld
wächst nicht nominal und endet mit dem 27. Geburtstag. Es wird als eigene
Einnahme ausgewiesen, nie still von den Brutto-Kinderkosten abgezogen.

Default-Start: 8.300 € Einkommen (4.300 € + 4.000 €), 1.970 € Warmmiete
(1.570 € kalt),
3.640 € sonstige Lebenshaltung inklusive 1.950 € gemitteltem Reisebudget und
600 € direkte Kinder-Zusatzkosten (300 €/Kind für Alter 0–5). Somit 6.210 €
Brutto-Ausgaben. Für die Kinder im Alter 3,5 und 0,6 Jahre kommen 520 €
Kindergeld als Einnahme hinzu; die Start-Sparrate beträgt 2.610 €. Ohne Reisen
liegen die Brutto-Ausgaben bei 4.260 €. Das Reisebudget ist eine transparente
Teilmenge der Lebenshaltung und wird nicht doppelt abgezogen.

Kalibrierung aus den vom Owner gelieferten 24-Monats-Auswertungen: Der
Mittelwert der Familienkosten ohne Reisen beträgt `(3.547 + 3.729) / 2 =
3.638 €`. Nach Ersatz der dort gemittelten Wohnkosten von 2.050,50 € durch die
bekannte Warmmiete von 1.970 € und zuzüglich 2 × 350 € persönlicher Kosten
ergeben sich 4.257,50 €, gerundet 4.260 €. Die Ansicht inklusive Reisen weist
bei Wohnen und den gemeinsamen Kategorien jeweils ungefähr den halben
Familienanteil aus; deshalb wird ihr Mittelwert `(2.689 + 2.737) / 2 = 2.713 €`
für den Haushalt verdoppelt. Nach 2 × 430 € persönlichen Kosten und demselben
Mietersatz ergeben sich 6.207 €, gerundet 6.210 €. Die Differenz von 1.950 €
ist das gemittelte Reisebudget. Die 600 € direkten Kinderkosten sind eine
bewusste Brutto-Aufteilung innerhalb dieser Gesamtsumme; Grundbedarf steckt
weiterhin in der Lebenshaltung.

### 2a. Auto und Altersphasen

Das Familienpreset startet ohne Auto. Sobald Kind 2 erstmals mindestens ein
Jahr alt ist, also ab Spielmonat 5, greift eine vorläufige All-in-Pauschale von
600 €/Monat. Sie bündelt Anschaffung/Finanzierung und laufende Kosten, weil
Fahrzeugklasse und Kaufweg noch nicht festgelegt sind. Monat und Betrag sind im
Startdialog sowie während der Partie in den Einstellungen änderbar.

Die Altersprofile sind Spielannahmen, keine individuelle Prognose:

| Alter Eltern | Erwerbsfaktor vor Rente | Alltag | Reisen | Auto |
|---|---:|---:|---:|---:|
| bis 54 | 100 % | 100 % | 100 % | 100 % |
| 55–64 | 90 % | 90 % | 90 % | 90 % |
| 65–66 | 90 % | 80 % | 75 % | 65 % |
| 67–79 | 90 % × 55 % Rente = 49,5 % | 80 % | 75 % | 65 % |
| ab 80 | 90 % × 55 % Rente = 49,5 % | 70 % | 55 % | 40 % |

Als Richtungsanker dient die Destatis-Auswertung 2021 nach Alter der
Haupteinkommensperson: private Konsumausgaben lagen im Mittel bei 3.027 €
(35–44), 2.959 € (45–54), 2.646 € (55–64), 2.306 € (65–69), 2.368 €
(70–79) und 2.079 € (80+). Verkehr sowie Übernachtungen gehen in den älteren
Gruppen stärker zurück. Haushaltsgröße und Zusammensetzung unterscheiden sich;
deshalb übernimmt das Spiel nur die grobe Kurvenform, nicht die Eurobeträge
([Destatis, LWR 2021, Tabellen 1.4/2.4](https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Einkommen-Konsum-Lebensbedingungen/Konsumausgaben-Lebenshaltungskosten/Publikationen/Downloads-Konsumausgaben/einnahmen-ausgaben-privater-haushalte-2150100217004.pdf?__blob=publicationFile&v=5)).

Der Rentenfaktor bleibt bewusst vorsichtig bei 55 % des zuvor alters- und
nominal fortgeschriebenen Erwerbsnettos. Das gesetzliche Sicherungsniveau vor
Steuern liegt bei 48 %, ist laut Deutscher Rentenversicherung aber ausdrücklich
keine Aussage „48 % des letzten Gehalts“. Der Spielwert ist daher eine
editierbare Haushaltsannahme, keine Rentenauskunft
([Deutsche Rentenversicherung: Rentenpaket 2025](https://www.deutsche-rentenversicherung.de/SharedDocs/FAQ/Gesetzesaenderungen/rentenpaket-2025/Rentenpaket-2025.html)).

Das Endgame-Vermögensziel liegt bei nominal 15 Mio. €. Der frühere Wert von
2,6 Mio. € war auf das alte Ende mit 67 kalibriert und wäre über einen Lauf bis
90–100 bei fast allen Strategien früh ausgeschöpft. Der neue Wert erhält im
300-Seed-Gate die Trennschärfe zwischen Schwierigkeiten; die spätere Anzeige in
heutigen Euro bleibt Teil des expliziten Inflationspakets.

Das Handwerker-Azubi-Profil startet mit 1.100 € netto. Ab Monat 36 wirkt der
feste Einkommensmeilenstein `Gesellenabschluss` mit Faktor 1,75 zusätzlich zum
normalen nominalen Einkommenswachstum. Der Sprung wird im Log angekündigt. Er
ist eine Startprofil-Annahme, keine Spielerwahl; ein interaktives Karriere-
system bleibt eine spätere Idee in `IDEEN.md`.

Default `rentenAlter = 67`, `rentenNettoFaktor = 0,55`. Der Ruhestand ist ein
Einkommenswechsel und kein Kampagnenende. Auch das Renten-Netto bleibt danach
nominal mit `einkommensWachstum` fortgeschrieben; das bestehende Modell ist bis
zum späteren Inflationspaket vollständig nominal.

### 2b. Historischer Sonderbestand

Das Schuldenberg-Preset erzeugt nach der seeded Marktinitialisierung fünf
reale Portfolioobjekte aus stabilen Listing-IDs. Kaufpreis ist jeweils der
faire Startwert; die Restschuld wird auf volle Euro gerundet:

```
restschuld = round(fairerStartwert · presetLTV)   // 93–97 %
rate        = restschuld · (presetZins + 1 % Tilgung) / 12
```

Die Käufe liegen modellseitig fünf Jahre zurück und belasten deshalb beim
Spielstart weder Cash noch Nebenkosten ein zweites Mal. Der Startwert von
Nettovermögen, Historie und ETF-Gegenfall wird nach Übernahme des Bestands neu
gesetzt. Die Initialisierung ist idempotent. Vorab-Release-Altspielstände werden
kontrolliert abgelehnt und erhalten niemals rückwirkend Sonderobjekte.

## 3. Cash / Tagesgeld

```
etfEinzahlung = max(0, sparrate) · sparplanEtfAnteil
zinsBrutto(m) = cash · tagesgeldZins / 12       (einfache Monatsverzinsung)
zinsNetto(m)  = zinsBrutto − kapitalsteuer(zinsBrutto)
cash         += sparrate − etfEinzahlung + zinsNetto
cashflow      = sparrate − etfEinzahlung + zinsNetto  (Anzeige Tagesgeld/Monat)
```

Im Default fließen 50 % der positiven Sparrate ins echte ETF-Depot und 50 %
ins Tagesgeld; dessen Zins beträgt 2 % p.a. Das klassische Preset beginnt mit
25 % ETF-Sparplan und 1,5 % Tagesgeldzins. Bei negativer Sparrate werden keine
ETF-Anteile automatisch verkauft.

## 4. Echtes ETF-Depot und Benchmark

`state.etfDepot` ist reales Spielervermögen. Es startet je nach Preset, erhält
den konfigurierten Anteil der positiven Haushaltssparrate und erlebt denselben
exogenen Monatsreturn `r` wie der Benchmark. Käufe erhöhen den gespeicherten
ETF-Einstand. Beim Verkauf wird der Einstand proportional ausgebucht; nur ein
positiver realisierter Kursgewinn ist nach Teilfreistellung und verbleibendem
Pauschbetrag steuerpflichtig. Deshalb ist ein Kauf vermögensneutral, ein
steuerpflichtiger Verkauf aber nicht. Letzter Monatscashflow, Benchmark und
RNG-Pfad bleiben bei manuellen Buchungen unverändert. Der Spieler kann
`sparplanEtfAnteil` von 0 bis 100 %
ändern; der neue Anteil greift bei der nächsten Monatsbuchung und nur auf eine
positive Haushaltssparrate.

Kontrafaktisches Depot: startet mit demselben Eigenkapital und erhält jeden
Monat die externe Sparrate des Gegenfalls **„weiter mieten“** — auch wenn der
Spieler ein Eigenheim besitzt. Die ETF-Linie bekommt also weder die gesparte
Wohnmiete kostenlos gutgeschrieben noch trägt sie Kredit-/Eigentümerkosten.
**Nicht** gespiegelt werden Anlageerträge (Tagesgeldzinsen, Mieterträge): die
sind Rendite der jeweiligen Strategie, nicht externer Zufluss.

Monatliche Rendite lognormal (geometrische Brownsche Bewegung, diskretisiert):

```
mu     = ln(1 + etfRendite + phasenMod) / 12
sigma  = etfVolatilitaet · volFaktor(schwierigkeit) / √12
r      = exp(mu − sigma²/2 + sigma · Z) − 1,   Z ~ N(0,1) (Box-Muller, seeded)
etfSparrate = einkommen − hypothetische Wohnmiete − leben − kinder
wert         = max(0, wert · (1 + r) + etfSparrate)
echtesDepot  = max(0, echtesDepot · (1 + r) + etfEinzahlung)
```

`phasenMod` kommt aus der versteckten Marktphase (`etfDriftMod`):
Boom +1,0 %, Seitwärts 0, Crash −1,5 % p.a. auf die erwartete Rendite.

Die 6,5-%-Annahme ist eine **Brutto-Marktrendite**, keine Nachsteuerzusage. Der
Finanzscreen zeigt zusätzlich konservativ etwa 5,3 % nach 30 %
ETF-Teilfreistellung und 26,375 % Steuer, dabei bewusst ohne Pauschbetrag und
ohne Steuerstundung. Der echte Depotwert und die gelbe Benchmark bleiben
Brutto-Marktwerte; „Netto bei Verkauf“ zeigt für das echte Depot die aktuell
verfügbare Liquidität nach realisierter Steuer.

### 4a. Gemeinsamer Kapitalsteuervertrag

Tagesgeldzinsen, realisierte ETF-Gewinne, Aktiengewinne nach Verlusttopf und
Aktien-Dividenden teilen sich einen gespeicherten Jahresfreibetrag:

```
pauschbetrag = personen · 1.000 € pro Kalenderjahr
steuerbasis  = positiverErtrag · (1 − teilfreistellung)
freibetrag   = min(steuerbasis, nochVerfügbarerPauschbetrag)
steuer       = max(0, steuerbasis − freibetrag) · 26,375 %
```

Familienprofile starten mit zwei Personen und damit 2.000 €, der alleinige
Handwerker-Azubi mit 1.000 €. Für einen Welt-Aktien-ETF gelten 30 %
Teilfreistellung; für Tagesgeld und die fiktiven Einzelaktien 0 %. Rechtsanker
sind [§ 20 Abs. 9 EStG](https://www.gesetze-im-internet.de/estg/__20.html) und
[§ 20 InvStG](https://www.gesetze-im-internet.de/invstg_2018/__20.html).
Kirchensteuer und ETF-Vorabpauschale bleiben ausdrücklich außerhalb des
Modells. Die Buchung ist eine transparente Spielabstraktion, keine Steuerberatung.

### 4b. Fiktive Einzelaktien-Sandbox

`state.aktienDepot` ist reales Spielervermögen, aber wirtschaftlich und
technisch strikt vom Welt-ETF und dessen Benchmark getrennt. Es gibt fünf
fiktive Unternehmen aus `data/stocks.json`; keine Livekurse und keine
Kaufempfehlung. Gehandelt werden nur ganze Stücke gegen Tagesgeld. Maximal fünf
verschiedene Positionen sind gleichzeitig erlaubt.

```
handelswert = stueck · kurs
orderkosten = min(49,90 €, 4,90 € + 0,15 % · handelswert)
kaufabfluss = handelswert + orderkosten
verkaufsgewinn = handelswert − orderkosten − anteiligerEinstand
steuerbasis = max(0, verkaufsgewinn − vorhandenerVerlusttopf)
steuer = kapitalsteuer(steuerbasis, 0 % teilfreistellung)
verkaufszufluss = handelswert − orderkosten − steuer
```

Der Einstand enthält die Kaufkosten und wird bei Zukäufen gewichtet
fortgeschrieben. Realisierte Verluste erhöhen einen vereinfachten
Aktien-Verlusttopf; positive realisierte Gewinne verrechnen ihn zuerst. Danach
greift derselbe Pauschbetrag wie bei Tagesgeld und ETF. Kirchensteuer bleibt
Modellgrenze.

Jede Aktie definiert erwartete nominale Kursrendite, Volatilität, Beta und
Dividendenrendite. Der Monatskurs kombiniert einen gemeinsamen Marktimpuls mit
einem Unternehmensimpuls. Die Korrelation ist 0,45; Schwierigkeit skaliert die
Volatilität. Die versteckte Marktphase verändert die Jahresdrift um +0,8 %
(Boom), 0 % (seitwärts) oder −1,2 % (Crash). Zusätzlich wird pro Aktie und Monat
mit 0,6 % Wahrscheinlichkeit eines von zwei gewichteten Firmenereignissen
ausgelöst. Der Kurs hat eine technische Untergrenze von 0,50 €.

```
sigmaMarkt = volatilitaet · korrelation · beta · schwierigkeitsFaktor / √12
sigmaFirma = volatilitaet · √(1 − korrelation²) · schwierigkeitsFaktor / √12
mu = ln(1 + kursRendite + phasenMod) / 12
r = exp(mu − (sigmaMarkt² + sigmaFirma²)/2
        + sigmaMarkt · Z_markt + sigmaFirma · Z_firma) − 1
kursNeu = max(0,50 €, kursAlt · (1+r) · (1+eventEffekt))
```

Dividenden werden in März, Juni, September und Dezember anteilig auf Basis des
aktuellen Kurses ausgezahlt und nach verbleibendem Pauschbetrag mit 26,375 %
besteuert. Nur Netto-Dividenden fließen in Tagesgeld und Monatscashflow. Kursbewegungen und
Orders selbst sind kein Cashflow. Gebühren und Steuern mindern das
Nettovermögen genau dann, wenn sie anfallen.

## 5. Marktphase

Einmal pro Seed gewichtet gezogen (`gewichte`: 30/40/30), im State gespeichert,
in der UI erst bei der Endauswertung aufgedeckt. Ab Phase 2 treibt sie zusätzlich
  die Preisdrift der vier Immobiliensegmente.

## 6. RNG & Determinismus

mulberry32; der allgemeine Spielstrom liegt in `state.rngState`. Der exogene
ETF-Pfad besitzt zusätzlich `state.etfRngState`, damit Due Diligence,
Verhandlungen und andere Spieleraktionen die ETF-Renditen desselben Seeds nicht
verschieben. Einzelaktien besitzen analog `state.aktienRngState`; jeder Monat
verbraucht unabhängig von gehaltenen Positionen dieselben Markt-, Firmen- und
Eventziehungen. Deshalb ändern Orders weder spätere Aktienkurse noch ETF oder
Benchmark. Alle drei Zustände werden gespeichert. Normalziehungen laufen per
Box-Muller mit fixem Verbrauch (immer 2 Uniforms). **Regel:** Jede neue
Zufallsquelle zieht über die State-RNG-Funktionen, nie über `Math.random()`.

## 7. Segment-Preisindizes (Phase 2)

Vier Segmente (Berlin Innenstadt, Berlin Rand, Leipzig, Meißen + Umland), je ein Index,
Start 1,0. Monatlich:

```
index *= 1 + drift(phase)/12 + sigmaMonat · Z · volFaktor(schwierigkeit)
```

`drift(phase)` steht pro Segment explizit in der Config (`drift.boom /
seitwaerts / crash`, p.a.) — die versteckte Marktphase wählt die Spalte.
`sigmaMonat` ist Monats-Rauschen pro Segment. Indizes sind im State und
treiben Angebotspreise UND Marktwerte gekaufter Objekte.
Meißen + Umland nutzt als tunbaren Startanker 1.900 €/m², 6,40 €/m²
Vergleichsmiete und 140 €/m² Grundstück. Die niedrige Vergleichsmiete ist an
den [Meißner Mietspiegel 2025–2027](https://www.stadt-meissen.de/de/mietspiegel.html)
angelehnt; Preisniveau und regionale Streuung orientieren sich am
[Grundstücksmarktbericht Landkreis Meißen 2025](https://www.kreis-meissen.de/PDF/Marktinformation_2025.PDF?Ext=PDF&ObjID=3281&ObjLa=1&ObjSvrID=3697&WTR=1&_ts=1746696640).
Meißen gehört im Spiel nicht zu den sächsischen Mietpreisbremsen-Gebieten; die
[aktuelle Landesverordnung](https://www.revosax.sachsen.de/vorschrift/21416-Saechsische-Mietpreisbegrenzungsverordnung)
nennt nur Dresden und Leipzig. Alle Spielwerte bleiben vereinfachte
Startannahmen, keine Bewertung konkreter Objekte.

## 8. Objektpreis

```
basisWohnung = flaeche · preisM2(segment)
basisHaus     = flaeche · preisM2(segment) · hausPreisFaktor
                + grundstueck · grundstueckPreisM2(segment)
fairerWert = basis(Objektart) · index(segment)
           · zustandsFaktor(zustand 1–5)        // 0,78 … 1,15
           · lageFaktor(lageScore 1–10)         // 0,9 + score·0,02
angebotspreis = fairerWert · preisAufschlag(listing)   // 0,90 … 1,18
```

`preisAufschlag` ist der handgemachte Deal-Qualitäts-Knopf des Listings
(überteuert/fair/unterbewertet). **Marktwert im Portfolio = fairerWert**
(Aufschlag 1,0) — wer überteuert kauft, sieht sofort Buchverlust.
Kehrt ein unverkauftes Listing in den Feed zurück, sinkt sein Aufschlag um
Faktor `wiederkehrNachlass` (Default 0,97).

Der 40er-Katalog startet mit fünf Angeboten. Die seeded gemischte Reihenfolge
wird ohne zusätzliche Zufallsziehung so priorisiert, dass Berlin, Leipzig und
Meißen + Umland sowie mindestens ein Haus und ein Zustand-1/2-Objekt vertreten
sind. Danach erscheint alle 1–2 Monate ein noch nicht gezeigtes Angebot; damit
war jedes Listing spätestens nach 70 Monaten einmal im Feed. Angebote laufen
4–7 Monate und pausieren anschließend 20–34 Monate. Die längere Wiederkehr hält
langfristig nur einen Ausschnitt des Katalogs gleichzeitig sichtbar.

## 9. Basiszins & Annuitätendarlehen

Basiszins: mean-reverting Random Walk, monatlich, geclampt [0,5 %, 8 %]:

```
z += reversion · (mittel − z) + volaMonat · Z
```

Sollzins eines Angebots:

```
zins = basiszins + spreadLTV + aufschlagZinsbindung
LTV  = darlehen / kaufpreis
spreadLTV:  ≤60 %: +0,0 · ≤80 %: +0,3 · ≤90 %: +0,6 · ≤100 %: +1,0 (Pp.)
Zinsbindung: 5 J: −0,15 · 10 J: 0 · 15 J: +0,25 (Pp.)   LTV > 100 %: kein Angebot
```

Annuität (monatlich): `rate = darlehen₀ · (zins + tilgungssatz) / 12`;
pro Monat `zinsanteil = restschuld · zins/12`, `tilgung = rate − zinsanteil`,
Restschuld sinkt entsprechend. Letzte Rate = Restschuld + Zins.

**Anschlussfinanzierung (Phase-2-Lite):** Am Ende der Zinsbindung wird
automatisch zum dann gültigen `basiszins + spreadLTV(aktuell)` verlängert,
gleicher Tilgungssatz, neue Rate von der Restschuld — mit Log-Hinweis.
Ein echtes Entscheidungs-Event daraus wird in Phase 3/4 gebaut.

## 10. Haushaltsrechnung der Bank

```
anrechenbar = nettoEinkommen + mietAnrechnung · Σ Kaltmieten (inkl. neues Objekt, falls vermietet)
belastung   = eigeneMiete + lebenshaltung + kinderkosten
            + Σ bestehende Raten + bewirtschaftungsPauschale · Objektzahl (inkl. neues)
spielraum   = (anrechenbar − belastung) · puffersatz
```

Kredit-Zusage nur wenn **alle** Checks bestehen (Ablehnung nennt den Grund):
1. `rate ≤ spielraum`
2. `eigenkapital ≥ nebenkosten + minEkAnteil · kaufpreis` (Bank finanziert keine NK)
3. `LTV ≤ 100 %`

`mietAnrechnung`, `puffersatz`, `minEkAnteil` kommen aus der bankPuffer-Stufe
der Schwierigkeit (kulant/standard/streng), z. B. Anrechnung 75/70/60 %,
Puffer 1,0/0,85/0,7, min. EK 0/5/10 %.

Der Finanzierungsdialog ergänzt die Bankprüfung um eine nicht mutierende
Cashflow-Brücke. Sie startet beim tatsächlichen Gesamtcashflow des letzten
Spielmonats und rechnet die unmittelbare Wirkung des Angebots hinzu:

```
Änderung vor Steuer = aktuelle Kaltmiete oder entfallende Wohnmiete
                    − Rate − artabhängige Fixkosten − Instandhaltungsrücklage
                    + Veränderung des Tagesgeld-/Dispozinses durch das Eigenkapital
Steuerschätzung     = max(0, Miete − Zinsanteil − Fixkosten − AfA)
                      × Grenzsteuersatz       // alle Eingaben sind Monatswerte
Gesamt nach Steuer  = letzter Gesamtcashflow + Änderung vor Steuer − Steuerschätzung
```

Leerstand wird konservativ mit 0 € Miete gerechnet. Die Steuerschätzung dient
nur dem Vergleich; die tatsächliche Spielbuchung bleibt der Jahresbescheid im
Dezember (§21). Einmalige Kaufkosten, Reparaturen und spätere Miet-/Zinswechsel
sind ausdrücklich nicht Teil dieser Monatsprognose.

## 11. Verhandlung

Ein Gebot pro Objekt und Monat. Annahmewahrscheinlichkeit:

```
d = gebot/angebotspreis − 1                       // Rabatt negativ
p = clamp(0,03 … 0,97,
      basis                                       // 0,55
    + d · elastizitaet                            // 6 → 5 % unter Preis ≈ −0,30
    + min(zeitBonusMax, monateAmMarkt · zeitBonus)  // +0,06/Monat, max +0,30
    − konkurrenz · konkurrenzGewicht              // 0…1 · 0,40
    + phasenBonus)                                // boom −0,12 · seitw. 0 · crash +0,18
```

Ablehnung: Listing bleibt am Markt, nächster Versuch ab Folgemonat.
Weggehen ist immer erlaubt und manchmal optimal.

## 12. Kaufnebenkosten ("dieses Geld ist weg")

```
nebenkosten = kaufpreis · (grESt(stadt) + notarGrundbuch + ggf. makler)
```

Defaults: GrESt Berlin 6,0 %, Leipzig/Meißen in Sachsen 5,5 %;
Notar+Grundbuch 2,0 %;
Makler 3,57 % nur wenn Listing nicht provisionsfrei. Nebenkosten sind
Cash-Abfluss ohne Gegenwert im Nettovermögen (Objekt zählt zum fairen Wert).

## 13. Due Diligence

Jedes Listing kann verborgene Mängel und WEG-Risiken tragen (CONTENT_SCHEMA).
Bei Spielstart wird pro Mangel gewürfelt, ob er in diesem Run existiert:
`p_existenz = mangel.p · eventFaktor(schwierigkeit)`.

| Aktion | Kosten | Zeit | Effekt |
|---|---|---|---|
| Besichtigung | 0 € | 3 h | deckt `besichtigung`-Infos auf (sichtbarer Zustand) |
| Dokumente | 0 € | 2 h | deckt `dokumente`-Infos auf, inkl. beschlossene Sonderumlagen — sicher |
| Gutachter | 1.400 € | 2 h | deckt jeden existierenden verborgenen Mangel unabhängig mit p = 0,75 auf |

Vorbereitung reduziert Unsicherheit, eliminiert sie nie: Nicht aufgedeckte
existierende Mängel werden nach dem Kauf fällig — im Monat
`kauf + uniform(2 … 14)`, Kosten × `ueberraschungsFaktor` (1,35 für
Eilauftrag/Folgeschaden). Nicht entdeckte Sonderumlagen: fällig
`kauf + uniform(3 … 9)`. In der 300-Seed-Matrix ist der Gutachter dadurch bei
den riskantesten Objekten positiv, bei sicheren Objekten weiter klar negativ.

## 14. Objekt-P&L (monatlich, Phase 2)

```
+ kaltmiete                        // nur mietstatus "vermietet"; statisch bis Phase 3
− artabhängige Fixkosten           // Wohnung: Hausgeld; Haus: Grundsteuer,
                                   // Versicherung, Grundstück/Betrieb
− instandhaltung                   // flaeche · €/m²/Jahr ÷ 12
− rate                             // Annuität, bis Darlehen getilgt
− fällige Mängel/Sonderumlagen     // einmalig, s. §13
```

Zeitbudget: selbstverwaltetes Objekt kostet 3 h/Monat; DD-Aktionen einmalig.
Wohnungen verwenden 10 €/m²/Jahr Instandhaltung und bei Vermietung 35 % des
Hausgelds als Eigentümeranteil. Häuser verwenden 32 €/m²/Jahr sowie 55 % ihrer
separat ausgewiesenen Fixkosten bei Vermietung; bei Leerstand/Eigennutzung
fallen die Fixkosten vollständig an. Diese Beiträge sind tunbare
Spielannahmen, keine individuelle Kostenprognose.
Nettovermögen = Cash + echtes ETF-Depot + Aktiendepot + Σ fairerWert(Objekt) − Σ Restschuld
+ Σ Rücklage. Der ETF-Spiegel
bleibt unverändert (§4): Immobilien-Cashflows und Kaufabflüsse sind interne
Umschichtung bzw. Anlageertrag, keine externen Zuflüsse.

## 15. Erzielbare Miete & Zustand (Phase 3)

Die Vergleichsmiete (§ Phase 2) ist die Marktmiete für einen Durchschnitts-
zustand. Der tatsächliche Zustand hebt/senkt die erzielbare Miete:

```
marktmiete(objekt) = vergleichsmiete(segment, flaeche) · zustandMietFaktor(zustand)
```

`zustandMietFaktor` (config `mieter.zustandMietFaktor`): 1→0,85 … 3→1,0 …
5→1,12. Renovierung hebt den Zustand → mehr Miete UND (über `zustandsFaktor`,
§8) mehr Wert. Möbliert legt `moebliertAufschlag` (Default +12 %) obendrauf;
die einmalige Einrichtung kostet im Default 9.500 € und erhöht den Churn.

## 16. Mieterwahl & Vermietung (Phase 3)

**Vermietung starten** (leeres Objekt): Spieler wählt Mietniveau relativ zur
Marktmiete — `unter` / `auf` / `ueber` (Faktoren 0,92 / 1,0 / 1,08). Daraus:

```
angesetzteMiete = round(marktmiete · niveauFaktor · (moebliert ? 1+moebliertAufschlag : 1))
bewerberzahl    = clamp(poolMin … poolMax, poolBasis(niveau) + rng{-1,0,1})
```

Bei `ueber` erscheinen manchmal 0 Bewerber im Monat (`leerstandsRisiko`) →
ein weiterer Leerstandsmonat. Die 3–5 Bewerber werden seeded aus dem Pool von
18 gezogen: Sortierung nach versteckter Qualität + Seed-Rauschen, moduliert um
`qualiSkew(niveau)` (unter Marktmiete zieht bessere Bewerber an, über
Marktmiete schlechtere). **Kein sichtbarer Score** — das Dossier liefert
Hinweise, die versteckten Qualitäten (`zahlungsmoral`, `pflege`, `bleibe`,
`konflikt`) treiben das Verhalten.

Vor „Weitersuchen“ zeigt die UI die unmittelbare Liquiditätswirkung eines
weiteren Leerstandsmonats: entgangene angesetzte Kaltmiete sowie die weiterhin
fällige Darlehensrate, das volle Hausgeld und den Rücklagenbeitrag. Reparaturen
sind ausdrücklich nicht Teil dieser Vorschau.

**Monatliches Mieterverhalten** (in tickObjekt, seeded):
- Zahlungsausfall mit `p = (1−zahlungsmoral)·zahlungsausfallBasis` → Miete des
  Monats entfällt, Log-Eintrag. (Eskalation/Räumung: vereinfacht, V2.)
- Auszug mit `p = auszugBasisRisiko · (1 + churn) · unzufriedenheitsFaktor`,
  erst nach `mindestBleibe` Monaten. Möbliert erhöht churn. Auszug → Objekt
  wird leer (Log), Spieler vermietet neu.
- Pflege senkt/hebt langsam den Zustand: schlechte Mieter (`pflege` niedrig)
  können über Jahre 1 Zustandsstufe kosten (kleiner Monats-Erwartungswert).

**Mieterhöhung** (Kappungsgrenze abstrahiert): höchstens `kappungProzent`
(Default 15 %) in `kappungMonate` (36) und nie über die Marktmiete. Erhöhung
senkt die Mieterzufriedenheit (höheres Auszugsrisiko temporär).

## 17. Renovierung (Phase 3)

Vier Stufen (config `renovierung.stufen`), nur bei leerem Objekt startbar
(Umbau = Leerstand):

| Stufe | Kosten €/m² | Dauer (Mon.) | Zustandsziel | Miet-Uplift | Effekt |
|---|---|---|---|---|---|
| kosmetisch | 250 | 2 | +1 (max 4) | via Zustand | — |
| kuecheBad | 450 | 4 | ≥4 | via Zustand | — |
| grundriss | 800 | 6 | 5 | via Zustand | zusätzlicher Wert-Bonus |
| energetisch | 600 | 5 | +1 | via Zustand | Energieklasse +2 Stufen, senkt Kosten-Events |

```
kostenSchaetzung = flaeche · kostenM2 · kostenFaktor
dauer             = max(1, ceil(basisDauer · dauerFaktor))
ueberziehung     = kostenSchaetzung · max(0, ueberziehungBasis
                     + (5 − startZustand) · ueberziehungJeZustand)
                     · ueberziehungFaktor · rng[0..1]·2
endkosten        = kostenSchaetzung + ueberziehung        // bei Abschluss abgerechnet
```

Kostenschätzung wird bei Start bezahlt, die Überziehung bei Abschluss
(schlechter Startzustand → höheres Überziehungsrisiko). Während der Dauer:
Leerstand (keine Miete), Zeitbudget-Verbrauch `zeitProRenovierung`. Bei
Abschluss: Zustand steigt, erzielbare Miete/Wert steigen (§15/§8), energetisch
verbessert die Energieklasse und dämpft laufende Kosten-Events.
Alle drei Profilfaktoren sind standardmäßig 1. Beim Handwerker-Azubi gelten
`kostenFaktor = 0,70`, `dauerFaktor = 0,75` und
`ueberziehungFaktor = 0,65`.

## 18. Dilemma-Events (Phase 3)

Monatlicher Roll an fixer RNG-Position (nach ETF, vor Monatsende), damit der
Determinismus erhalten bleibt:

```
p_event = clamp(0 … eventChanceMax,
             (eventChanceBasis + eventChanceJeObjekt · objektzahl) · eventFaktor)
```

Feuert ein Event, wird aus den **erfüllbaren** Events (Bedingungen: braucht
Objekt/vermietet/Zustand/Jahreszeit/Kategorie-Cap, `einmalig`, Cooldown)
gewichtet eines gezogen, ein Zielobjekt bestimmt und `state.aktivesEvent`
gesetzt; die Zeit stoppt (`advanceMonths` bricht ab). Kinder-Events sind auf
`max 2` gedeckelt (PLAN §5.9). Der Spieler wählt eine von 2–3 Optionen; die
Auflösung (`resolveEvent`) verrechnet die Effekte (Cash, Zustand, Miete,
Mieter-Zufriedenheit/Auszug, Familie, Zeit, Rücklage) **ohne RNG** — damit ist
ein Run bei gleichem Seed und gleicher Optionsfolge reproduzierbar. Design:
keine strikt dominante Option (PLAN §14).

## 19. Rücklage, Hausverwaltung, Zeit & Familie (Phase 3)

**Rücklage je Objekt:** Der Instandhaltungsbeitrag (§14) fließt monatlich in
eine Objekt-Rücklage statt sofort verbrannt zu werden; ein Slider
(`ruecklageFaktor` 0…2, Default 1) skaliert den Beitrag. Reparaturen (fällige
Mängel §13, Kosten-Events) werden zuerst aus der Rücklage bezahlt, der Rest aus
Cash. Leere Rücklage + Cash-Deckungslücke → Cash wird negativ und zieht
**Dispo-Zins** (`dispoZins` p.a. auf negatives Cash) plus einen
Familienzufriedenheits-Malus — das ist die „forced credit"-Bremse aus §5.7.

**Hausverwaltung** je Objekt (Toggle): kostet `hausverwaltungProzent` der
Kaltmiete, setzt den Zeitbedarf des Objekts auf ~0 und senkt dessen
Event-Wahrscheinlichkeit (`hausverwaltungEventDaempfung`).

**Zeitbudget → Stress → Familie:**
```
verbraucht = Σ (hausverwaltung ? 0 : zeitProObjekt) + aktiveRenovierungen · zeitProRenovierung
ueberzug   = max(0, verbraucht − verfuegbar)
```
Überzug senkt die Familienzufriedenheit (`familieProZeitUeberzug` je Stunde)
und verschlechtert Event-Ausgänge (Stress-Flag). Ohne Überzug driftet die
Familienzufriedenheit sanft zum Neutralwert `familieNeutral`. Negatives Cash
und bestimmte Events bewegen den Wert zusätzlich. Clamp 0–100. So kostet
„passives" Einkommen ehrlich Zeit und Nerven (PLAN §5.9). Eigenheim-Bonus:
Phase 4.

## 20. Eigenheim (Phase 4)

Ein bezugsfreies Marktobjekt mit mindestens `eigenheim.minZimmer` (Default 3)
und `familienScore >= eigenheim.minFamilienScore`
kann im Finanzierungsdialog als Eigenheim statt als Kapitalanlage gekauft
werden. Damit ist die günstige Zweizimmerwohnung kein tragfähiger Ausweg für
die vierköpfige Familie. Das Eigenheim liegt separat in `state.eigenheim`, nutzt
aber dieselbe Objekt-/Darlehensstruktur und dieselbe Marktwertformel.

Ab dem Kauf gilt:

```
Wohnmiete       = 0
Eigenheim-Kosten = volle WEG-Kosten + Instandhaltungsrücklage + Kreditrate
Nettovermögen   += Marktwert Eigenheim − Restschuld + Rücklage
```

Die Bankrechnung ersetzt bei einem Eigenheimkauf die bisherige Wohnmiete durch
artabhängige Fixkosten, Instandhaltung und die neue Rate. Ein bestehendes Eigenheim zählt
bei späteren Kapitalanlage-Krediten vollständig als Belastung. Der Kauf gibt
einmalig `familieSofortBonus`; solange das Eigenheim gehalten wird, driftet die
Familienzufriedenheit zu `neutral + familieNeutralBonus`. Negative Folgen von
Kinder-Events werden mit `kinderEventMalusFaktor` multipliziert.

## 21. Jahressteuerbescheid (Phase 4, bewusst stark vereinfacht)

Je Kalenderjahr werden nur vermietete Kapitalanlagen erfasst:

```
Gebäudeanteil       = Kaufpreis × gebaeudeAnteil
AfA pro Monat       = Gebäudeanteil × afaSatz / 12
steuerliches Ergebnis = Mieteinnahmen
                       − Schuldzinsen
                       − nicht umlegbares Hausgeld
                       − Hausverwaltung
                       − AfA
Steuer              = max(0, steuerliches Ergebnis) × Grenzsteuersatz
```

Rücklagenbeiträge und Tilgung sind nicht abzugsfähig. Verluste erzeugen im MVP
keine Erstattung und keinen Verlustvortrag. Der Grenzsteuersatz ist ein
sichtbarer Slider (`grenzsatzMin` bis `grenzsatzMax`); der Bescheid wird im
Dezember als eine Zahlung verbucht und im Dashboard erklärt.

## 22. Verkauf (Phase 4)

Ein Verkauf läuft sechs Monate weiter, während Objekt und laufender Cashflow
bestehen bleiben. Zum Abschluss:

```
Verkaufspreis        = fairer Marktwert am Abschluss × preisFaktor
Maklerkosten         = Verkaufspreis × maklerProvision
Gewinn               = max(0, Verkaufspreis − Maklerkosten
                               − Kaufpreis − damalige Kaufnebenkosten)
Spekulationssteuer   = Gewinn × Grenzsteuersatz, falls Haltedauer < 120 Monate
Nettoerlös            = Verkaufspreis − Maklerkosten
                       − Spekulationssteuer − Restschuld
```

Die Spekulationssteuer ist eine didaktische Vereinfachung und gilt im MVP auch
für das Eigenheim. Das verkaufte Objekt verlässt Portfolio/Eigenheim; aktive
UI-Auswahl erfolgt deshalb über die stabile Listing-ID, nicht über Array-Indizes.

## 23. Endauswertung (Phase 4)

Fünf Scores, jeweils 0–100:

1. **Nettovermögen:** linear bis `nettovermoegenZiel`.
2. **Nachhaltiger Cashflow:** aktuelle vermietete Objekt-P&Ls abzüglich einer
   monatlichen Steuer-Schätzung, linear bis 2.000 €/Monat.
3. **Resilienz:** Mittel aus LTV-Score und Rücklagenabdeckung in Monaten.
4. **Stresshistorie:** Abzug für durchschnittlichen Zeitüberzug und Anteil der
   Monate mit negativem Cash.
5. **Familie:** Mittel aus Schlussstand und Kampagnen-Durchschnitt.

Der Gesamtscore ist der ungewichtete Mittelwert. Die Endauswertung zeigt die
Spielerhistorie sowie drei deterministische, gescriptete Vergleichsläufe mit
demselben Seed und derselben Schwierigkeit: reiner ETF, Eigenheim-first und
Invest-first. `benchmarkMaxObjekte` begrenzt die **Gesamtzahl** aus Eigenheim
plus Mietobjekten, damit Eigenheim-first nicht automatisch ein zusätzliches
Objekt halten darf. Diese Linien sind Lern-Benchmarks, keine Aussage über die
einzig richtige Strategie; ihre Regeln stehen in `js/endgame.js`.

## 24. Familienmarkt-Gate

`test/family-market.mjs` spielt pro Seed drei gepaarte Normal-Strategien mit
derselben exogenen Welt: weiter mieten, eine familientaugliche WEG-Wohnung oder
ein Haus kaufen. Das Gate verlangt:

- Vergleichswohnung und -haus in jedem Seed finanzierbar;
- Haus mit höheren laufenden Eigentümer-/Instandhaltungskosten als Wohnung;
- strukturell verschiedene Eigentums- und Grundstücksdaten;
- keine Strategie gewinnt Nettovermögen **und** Gesamtscore in ≥90 % der
  Paarungen;
- mittlere Endvermögen bleiben in derselben Größenordnung.

Der 300-Seed-Stand vom 16.07.2026 ist in `PLAYTEST.md` protokolliert. Das Gate
verhindert grobe Dominanz; es ersetzt nicht das menschliche Urteil über
Familiennutzen, Wohngefühl und Entscheidungsklarheit.

## 25. Vermietungswege und regionales Rechtsrisiko

Bei einer Neuvermietung werden Mietniveau und Vermietungsweg getrennt gewählt:

| Weg | Mietansatz | Einmalkosten | Wechsel/Aufwand | zusätzliches Modellrisiko |
|---|---:|---:|---|---|
| regulär | 0 % | 0 € | niedrig | keines |
| möbliert, längerfristig | +12 % | 9.500 € | erhöht | regional niedrig bis erhöht |
| Wohnen auf Zeit | +32 % | 11.000 € | hoch | regional deutlich erhöht |

Die Aufschläge sind **Spielannahmen, keine Aussage über rechtlich zulässige
Miethöhen**. Das monatliche Prüf-/Rückzahlungsrisiko ist in Berlin am höchsten,
in Leipzig niedriger und in Meißen am niedrigsten. Bei Eintritt zahlt der
Spieler mehrere Monatsmieten als vereinfachte Rückzahlung/Kosten und das Objekt
wird auf reguläre Vermietung zurückgesetzt. Professionelle Hausverwaltung senkt
den zusätzlichen Zeitbedarf, beseitigt aber kein Rechtsrisiko.

Recherchegrundlage (Stand 17.07.2026): Der offizielle Berliner Mietspiegel
beschreibt die ortsübliche Vergleichsmiete; die Senatsseite bündelt Mieterschutz
und Mietpreisbremse. Berlin regelt Zweckentfremdung und Ferien-/Kurzzeitnutzung
gesondert. Friedrichshain-Kreuzberg meldete 2025 ausdrücklich Prüfungen von
möbliertem Wohnraum und vermeintlich vorübergehendem Gebrauch. Daraus folgt im
Spiel bewusst ein Risiko-Trade-off statt eines garantierten Schlupflochs:

- <https://mietspiegel.berlin.de/>
- <https://www.berlin.de/sen/wohnen/mieterschutz/>
- <https://www.berlin.de/sen/wohnen/rechtliches/zweckentfremdungsverbot/rechtsvorschriften-und-vordrucke/>
- <https://www.berlin.de/ba-friedrichshain-kreuzberg/aktuelles/pressemitteilungen/2025/pressemitteilung.1538458.php>

## 26. Eigenbedarf (vereinfachtes Prozessmodell)

Bei einem vermieteten Bestandsobjekt kann Eigenbedarf für den eigenen Haushalt
oder ein volljähriges Kind angemeldet werden. Die simulierte Kündigungsfrist ist
nach bisheriger Mietdauer 3, 6 oder 9 Monate. Nach Fristende zieht der Mieter
meist aus; regionales Mietrecht und Konfliktneigung erzeugen manchmal einen
Widerspruch. Dann bleibt das Objekt zunächst vermietet. Der Spieler kann den
Vorgang zurückziehen oder eine sichtbare Abfindung zahlen. Erst danach ist die
Wohnung für Eigenheim-/Familiennutzung frei.

Das ist eine didaktische Abstraktion, keine Rechtsberatung. Reale berechtigte
Interessen, Begründung, Fristen und Härtefallwidersprüche sind fallabhängig.
Gesetzliche Orientierung: § 573 BGB (berechtigtes Interesse), § 573c BGB
(Kündigungsfristen) und § 574 BGB (Härtewiderspruch):

- <https://www.gesetze-im-internet.de/bgb/__573.html>
- <https://www.gesetze-im-internet.de/bgb/__573c.html>
- <https://www.gesetze-im-internet.de/bgb/__574.html>
