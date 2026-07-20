# Betongold Tycoon

Ein deutsches Browser-Aufbauspiel über Immobilien, Familie und
Opportunitätskosten. Die vollständige Kampagne führt von Marktplatz, Prüfung,
Finanzierung und Vermietung bis Eigenheim, Steuer, Verkauf und Endauswertung.
Ein separater Finanzscreen stellt Tagesgeld, Immobilienportfolio und Welt-ETF
als unterschiedliche Vermögens- und Risikoformen nebeneinander. Freiwillige
3–8-Jahres-Ziele, mehrmonatige Objektgeschichten sowie Arbeits- und
Familienmodelle verbinden einzelne Monatsentscheidungen zu längeren Verläufen.

Das Standardprofil „Familienstrategie mit Puffer“ startet mit Alter 40,
zwei jungen Kindern, 4.300 € + 4.000 € Arbeitsnetto sowie je 90.000 € Tagesgeld
und verkaufbarem ETF-Depot. Die monatliche Sparrate wird hälftig auf Depot und
Tagesgeld verteilt; das Tagesgeld bringt 2 % p.a. Daneben gibt es den
deutlich schlankeren klassischen 30-Jahre-Einstieg, einen hoch verschuldeten Fünf-Objekte-
Stresstest und einen 17-jährigen Handwerker-Azubi mit Gesellenlohn-
  Meilenstein sowie Renovierungsbonus. Die drei Schwierigkeitsgrade bleiben
  davon getrennt wählbar.

Der Ruhestand ist eine eigene Lebensphase: standardmäßig sinkt das fortgeschriebene
Haushalts-Netto mit 67 auf 55 %. Das Spiel endet je Seed und langfristigem Stress
zwischen 90 und 100 Jahren; der genaue Zeitpunkt ist keine reale Prognose.
Kommende Lebensphasen werden rechtzeitig angekündigt. Karriere und Familienzeit
sind zwölf Monate gebunden und tauschen Einkommen gegen Zeit und
Familienzufriedenheit; Eigenleistung spart bei Renovierungen nur gedeckelt und
erhöht Aufwand und Kostenrisiko.

## Spielen

### Windows: ein Doppelklick

`BETONGOLD_STARTEN.cmd` doppelklicken. Die Datei startet den lokalen Server
unsichtbar, öffnet das Spiel im Standardbrowser und verwendet denselben festen
Startport `4173` wie die lokale Entwicklung. Nach dem Schließen des Spiel-Tabs
beendet sich der Launcher nach spätestens rund drei Minuten selbst. Es ist kein
manueller Terminal- oder Serverstart nötig; Node.js muss installiert sein.

### Manueller Start

Kein Build-Schritt. Im Projektordner einen HTTP-Server starten:

```text
npx http-server -p 4173 -c-1 .
# oder
python -m http.server 4173
```

Dann [http://127.0.0.1:4173](http://127.0.0.1:4173) öffnen. Gleicher Seed plus
gleiche Entscheidungen ergibt denselben Lauf. Autosave, benannte Slots und
JSON-Export/-Import sind eingebaut.

### Öffentlich hosten und Spielstände

Das Spiel ist vollständig statisch. Für die erste öffentliche Version ist
**GitHub Pages** die einfachste Standardwahl: kein Servercode, kein Build und
ein Deployment direkt aus dem Repository. **Vercel** ist sinnvoll, wenn private
Repositories, Vorschau-Deployments pro Änderung oder später serverseitige
Funktionen wichtiger werden.

Spielstände liegen ausschließlich im lokalen Browserspeicher (`localStorage`)
der jeweiligen Website. Sie werden nicht in GitHub, Vercel oder einer Cloud
gespeichert und sind weder zwischen Geräten noch zwischen Browsern synchron.
Auch ein Domainwechsel erzeugt aus Browsersicht einen neuen Speicherort. Für
Backups oder einen Umzug deshalb im Spiel **Export (JSON)** und anschließend
**Import (JSON)** verwenden.

Wichtige Bedienpunkte:

- Die Ressourcenleiste hält Tagesgeld, farbcodierten Monatscashflow und echtes
  ETF-Depot auf jedem Screen sichtbar. Nettovermögen bleibt bewusst in Zentrale,
  Charts, Finanzübersicht und Endbilanz statt als permanenter Header-KPI.
- Tagesgeld oder ETF in der Leiste sowie „Finanzen“ öffnen den gemeinsamen
  Konto-/Depot-Screen. Drei Karten trennen Tagesgeld, Immobilienportfolio und
  Welt-ETF; Puffer, Zinsannahmen, Vermögensmix und letzte
  Finanzbewegungen bleiben sichtbar.
- Der Monatscashflow im Header öffnet eine detaillierte Aufschlüsselung. Kurze
  Toasts verschwinden selbstständig; die Glocke zeigt die letzten Meldungen der
  Sitzung erneut.
- Tagesgeld lässt sich direkt in den ETF umschichten. Beim ETF-Verkauf können
  auf realisierte Gewinne nach Teilfreistellung und gemeinsamem Pauschbetrag
  Steuern anfallen; die Vorschau zeigt Brutto, Steuer und Netto. Der Anteil der positiven Haushaltssparrate für den monatlichen
  ETF-Sparplan ist von 0 bis 100 % einstellbar.
- In der Zentrale lassen sich drei freiwillige mittelfristige Ziele wählen oder
  jederzeit ohne versteckte Strafe pausieren. Fortschritt entsteht aus echten
  Objekt-, Eigenheim-, Cashflow- und Pufferwerten; es gibt keine Questprämie.
- Im Haushalt stehen Balance, Karriereschritt und Familienzeit mit ihren
  monatlichen Geld-, Zeit- und Familienwirkungen. Nach einer Wahl gilt eine
  zwölfmonatige Bindung.
- In der Finanzierung ergänzt 0/10/20/30 % Eigenkapital den freien Slider; die
  aktuelle EK-Quote bleibt prominent sichtbar.
- Marktplatz und Exposé zeigen Außen- und Innenansichten; alle Bilder sind
  zoombar.
- Drei separat anwählbare, schematische Detailkarten verbinden 19 Angebote und
  Bestandsobjekte in Berlin, Leipzig sowie Meißen + Umland. Straßen und
  Quartiersnamen dienen der Spielorientierung und sind nicht navigationsgetreu;
  Filter, Markerform und Liste teilen sich dieselben Listing-IDs.
- Berlin hat strengere Mietregeln als Leipzig; Meißen + Umland bildet einen
  preisgünstigeren sächsischen Heimatmarkt mit Mietspiegel und ohne
  Mietpreisbremse ab. Regulär, möbliert und Wohnen auf Zeit verbinden
  unterschiedliche Mieten mit Einrichtung, Aufwand, Wechsel und regionalem
  Prüf-/Rückzahlungsrisiko. Eigenbedarf für den Haushalt oder erwachsene Kinder
  kann Frist, Widerspruch und Abfindung auslösen.
- Die Spielhilfe zeigt alle Regeln dauerhaft offen und enthält eine optionale
  achtstufige Bildschirm-Tour. Auf Leicht und Normal gibt Mara seltene,
  zustandsabhängige Hinweise; Schwer bleibt ohne Ratgeber.
- Die Szenario-Werkstatt ändert freigegebene Annahmen ab dem Folgemonat und
  trennt Rentenalter, Renten-Netto sowie das variable Lebensende samt
  begrenztem Stress-Einfluss.
- Renovierungsabschluss und ähnliche erwartete Meilensteine pausieren den
  Zeitlauf automatisch und erscheinen als wichtige Meldung. Im Planer kann
  Eigenleistung mit vorab sichtbarer Ersparnis, Zeitlast und höherem Risiko
  gewählt werden.
- Schimmel-, Nachbarschafts- und Zinsentscheidungen können Monate später eine
  nachvollziehbare Folge am betroffenen Objekt auslösen.

## Dokumente

| Datei | Zweck |
|---|---|
| [CLAUDE.md](CLAUDE.md) | einziger operativer Einstieg und Kernregeln |
| [ROADMAP.md](ROADMAP.md) | nur offene, priorisierte Entwicklung |
| [DONE.md](DONE.md) | abgeschlossenes Arbeitslog |
| [PLAN.md](PLAN.md) | stabile Produktspezifikation |
| [HANDOVER.md](HANDOVER.md) | letzter technischer Stand |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Modul-, Tick-, State- und Save-Details |
| [ECONOMY_MODEL.md](ECONOMY_MODEL.md) | Formeln und Balanceannahmen |
| [CONTENT_SCHEMA.md](CONTENT_SCHEMA.md) | JSON-Verträge |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | UI und Art Direction |
| [IDEEN.md](IDEEN.md) | unverbindlicher Ideenspeicher |

## Tests

```text
node test/simtest.mjs
node test/b0-economy.mjs
node test/e-gameplay.mjs
node test/f-turnaround.mjs
node test/gh-development.mjs
node test/chat-contracts.mjs
node test/family-market.mjs --seeds=300
node test/balance.mjs --seeds=300 --check
node test/balance-regressions.mjs --seeds=300
node test/browser-smoke.mjs
node test/launcher-smoke.mjs
node test/release-check.mjs
```

Der Browser-Smoke-Test benötigt Edge oder Chrome; außerhalb der üblichen
Installationspfade kann das Binary über `BROWSER_BIN` angegeben werden.
