// config.js — DEFAULT_CONFIG: jede Annahme des Spiels, kommentiert und tunbar.
// Das Admin-Panel (Phase 5) editiert eine Kopie dieser Struktur in state.config.
// Änderungen greifen zum nächsten Tick. Werte sind plausible Defaults, keine Fakten —
// vor Release gegen reale Daten prüfen (siehe PLAN.md §4).

export const SAVE_VERSION = 22;
// UI-/Cache-Version ist unabhängig vom Save-Format. Bei reinen CSS-/UI-Reworks
// erhöhen, ohne unnötig Spielstände zu migrieren.
export const UI_VERSION = 60;

// Startlage und Schwierigkeit sind bewusst getrennt. Das Preset beschreibt
// Haushalt, Vermögensaufteilung und optionale besondere Startbedingungen;
// die Schwierigkeit skaliert Vermögen,
// Bankstrenge, Ereignisse und Volatilität. Das Familienprofil ist ein
// plausibles Spielszenario; der interne Schlüssel bleibt aus Kompatibilität kurz.
export const START_PRESETS = {
  heute: {
    label: 'Familienstrategie mit Puffer',
    bild: 'assets/scenarios/familienstrategie.webp',
    kurz: '40 Jahre · Berlin Rand · zwei kleine Kinder',
    beschreibung: '8.300 € netto + 520 € Kindergeld · 4.860 € Ausgaben inkl. Reisen · 1.970 € warm; je 90.000 € Tagesgeld und ETF.',
    startAlter: 40,
    cash: 90000,
    etf: 90000,
    kinder: [{ alter: 3.5 }, { alter: 0.6 }],
    wohnort: 'berlin-rand',
    haushalt: {
      nettoEinkommenPerson1: 4300,
      nettoEinkommenPerson2: 4000,
      nettoEinkommen: 8300,
      miete: 1970,              // warm
      mieteKalt: 1570,
      lebenshaltung: 2590,      // davon 900 € Reisen; Kinder separat: 300 €
      reisen: 900,
      autoAbMonat: 5,          // Kind 2 ist dann erstmals mindestens 1 Jahr alt
      autoKostenMonat: 600,    // editierbare All-in-Pauschale ab Aktivierung
      sparplanEtfAnteil: 0.50, // 1.980 € von 3.960 € Start-Sparrate ins echte Depot
      ausgabenGesamtStart: 4860,
      ausgabenOhneReisenStart: 3960,
    },
    kapital: {
      tagesgeldZins: 0.02,
    },
  },
  klassisch: {
    label: 'Klassischer Einstieg',
    bild: 'assets/scenarios/klassisch.webp',
    kurz: '30 Jahre · Berlin Rand · alleinstehend',
    beschreibung: '3.200 € netto, 35.000 € Tagesgeld und 5.000 € ETF. Solider, aber noch klar begrenzter Aufbau.',
    startAlter: 30,
    cash: 35000,
    etf: 5000,
    kinder: [],
    wohnort: 'berlin-rand',
    haushalt: {
      nettoEinkommenPerson1: 3200,
      nettoEinkommenPerson2: 0,
      nettoEinkommen: 3200,
      miete: 1050,
      mieteKalt: 820,
      lebenshaltung: 1150,
      reisen: 250,
      sparplanEtfAnteil: 0.25,
      ausgabenGesamtStart: 2200,
      ausgabenOhneReisenStart: 1950,
    },
  },
  schuldenberg: {
    label: 'Viel Bestand, wenig Luft',
    bild: 'assets/scenarios/schuldenberg.webp',
    kurz: '45 Jahre · 5 Mietobjekte · 93–97 % finanziert',
    beschreibung: 'Fünf vermietete Wohnungen, mehr als 1 Mio. € Restschuld und nur 18.000 € Puffer. Für Stresstests und Spaß.',
    startAlter: 45,
    cash: 18000,
    etf: 5000,
    kinder: [{ alter: 12 }, { alter: 9 }],
    wohnort: 'berlin-rand',
    haushalt: {
      nettoEinkommenPerson1: 7200,
      nettoEinkommenPerson2: 0,
      nettoEinkommen: 7200,
      miete: 1900,
      mieteKalt: 1500,
      // Stress-Preset: hoher laufender Familien-/Bestandsaufwand hält den
      // Haushalt trotz der neuen altersgerechten Kinderstaffel unter Wasser.
      lebenshaltung: 2600,
      reisen: 400,
      sparplanEtfAnteil: 0,
      ausgabenGesamtStart: 5650,
      ausgabenOhneReisenStart: 5250,
    },
    startbestand: [
      { listingId: 'bi-01', ltv: 0.96, zins: 0.044, zinsbindungRestJahre: 3 },
      { listingId: 'bi-03', ltv: 0.94, zins: 0.041, zinsbindungRestJahre: 5 },
      { listingId: 'br-01', ltv: 0.97, zins: 0.046, zinsbindungRestJahre: 2 },
      { listingId: 'br-04', ltv: 0.93, zins: 0.039, zinsbindungRestJahre: 6 },
      { listingId: 'le-01', ltv: 0.95, zins: 0.043, zinsbindungRestJahre: 4 },
    ],
  },
  handwerker: {
    label: 'Junger Handwerker-Azubi',
    bild: 'assets/scenarios/handwerker.webp',
    kurz: '17 Jahre · Leipzig · Ausbildung',
    beschreibung: '1.100 € netto, 2.500 € Tagesgeld und viel Zeit. Nach 3 Jahren Gesellenlohn; Renovierungen gelingen günstiger und schneller.',
    startAlter: 17,
    cash: 2500,
    etf: 0,
    kinder: [],
    wohnort: 'leipzig',
    beruf: { label: 'Handwerker-Azubi', handwerklich: true },
    haushalt: {
      nettoEinkommenPerson1: 1100,
      nettoEinkommenPerson2: 0,
      nettoEinkommen: 1100,
      miete: 480,
      mieteKalt: 360,
      lebenshaltung: 450,
      reisen: 0,
      sparplanEtfAnteil: 0,
      ausgabenGesamtStart: 930,
      ausgabenOhneReisenStart: 930,
      einkommensSpruenge: [
        { abMonat: 36, faktor: 1.75, label: 'Gesellenabschluss' },
      ],
    },
    budget: { zeitProMonat: 26 },
    kapitalsteuer: { personen: 1 },
    renovierung: {
      kostenFaktor: 0.70,
      dauerFaktor: 0.75,
      ueberziehungFaktor: 0.65,
    },
  },
};

export const DEFAULT_CONFIG = {
  meta: {
    configVersion: 1,
  },

  zeit: {
    startJahr: 2026,      // Kalenderjahr beim Spielstart (nur Anzeige)
    startMonat: 1,        // 1 = Januar
    startAlter: 38,       // Alter der Eltern beim Start
    rentenAlter: 67,      // Ruhestand: Erwerbsnetto wird durch Renten-Netto ersetzt
    lebensendeMinAlter: 90, // frühestes Lebensende im vereinfachten Spielmodell
    lebensendeMaxAlter: 100,// spätestes Lebensende; Seed wählt den Basiszeitpunkt
    stressMalusMaxJahre: 4, // langfristiger Zeit-/Liquiditätsstress verkürzt höchstens so stark
  },

  haushalt: {
    nettoEinkommenPerson1: 2600,
    nettoEinkommenPerson2: 2600,
    nettoEinkommen: 5200,     // €/Monat, Haushalts-Netto (Doppelverdiener)
    einkommensWachstum: 0.02, // p.a. nominal (Gehaltsrunden, Karriere langsam)
    rentenNettoFaktor: 0.55,  // Anteil des bis dahin nominal gewachsenen Erwerbsnettos im Ruhestand
    miete: 1500,              // €/Monat warm, Familienwohnung (Berlin Rand)
    mieteKalt: 1200,          // nur Transparenz im Haushaltsprofil
    mietWachstum: 0.02,       // p.a. — Bestandsmiete steigt gedämpft
    lebenshaltung: 1800,      // €/Monat ohne Miete, ohne Kinder (Essen, Versicherung, Mobilität, Freizeit)
    reisen: 0,                // darin enthaltenes Reisebudget als Monatsdurchschnitt
    autoAbMonat: 24,          // Spielmonat, ab dem die zusätzliche Auto-Pauschale gilt
    autoKostenMonat: 0,       // €/Monat all-in; 0 = in diesem Profil kein Auto eingeplant
    // Altersprofile sind dimensionslose, sichtbare Szenariofaktoren. Sie
    // ergänzen die nominalen Wachstumsraten, statt sie zu ersetzen.
    einkommensAltersFaktoren: [
      { bisAlter: 54, faktor: 1.00 },
      { bisAlter: 200, faktor: 0.90 },
    ],
    lebenshaltungAltersFaktoren: [
      { bisAlter: 54, faktor: 1.00 },
      { bisAlter: 64, faktor: 0.90 },
      { bisAlter: 79, faktor: 0.80 },
      { bisAlter: 200, faktor: 0.70 },
    ],
    reisenAltersFaktoren: [
      { bisAlter: 54, faktor: 1.00 },
      { bisAlter: 64, faktor: 0.90 },
      { bisAlter: 79, faktor: 0.75 },
      { bisAlter: 200, faktor: 0.55 },
    ],
    autoAltersFaktoren: [
      { bisAlter: 54, faktor: 1.00 },
      { bisAlter: 64, faktor: 0.90 },
      { bisAlter: 79, faktor: 0.65 },
      { bisAlter: 200, faktor: 0.40 },
    ],
    sparplanEtfAnteil: 0,     // Anteil positiver Sparrate, der automatisch ins echte ETF-Depot fließt
    ausgabenGesamtStart: 4100,// Miete + Lebenshaltung + Kinder zum klassischen Start
    ausgabenOhneReisenStart: 4100,
    kostenWachstum: 0.02,     // p.a. (Inflation auf Lebenshaltung)
    einkommensSpruenge: [],   // optionale feste Profil-Meilensteine, z. B. Ausbildungsabschluss
    kinder: [                 // Alter der Kinder beim Spielstart
      { alter: 5 },
      { alter: 8 },
    ],
    // Kosten pro Kind pro Monat, gestaffelt nach Alter (aufsteigend nach bisAlter).
    // Ab auszugsAlter: 0 € (Kind zieht aus). Kindergeld wird als eigene
    // Einnahme gezeigt und nicht mit diesen Bruttokosten verrechnet.
    kinderKosten: [
      { bisAlter: 5,  kosten: 150 },  // zwei kleine Kinder kosten im Familienpreset zusammen rund 300 €
      { bisAlter: 11, kosten: 250 },  // Schulalter: steigender direkter Bedarf
      { bisAlter: 17, kosten: 300 },  // Teenager
      { bisAlter: 26, kosten: 400 },  // Ausbildung/Studium: höherer Unterstützungsbedarf
    ],
    auszugsAlter: 27,
    kindergeldProKind: 260,       // €/Monat je Kind, feste Owner-Szenarioannahme
    kindergeldBisAlter: 25,       // bis zum 25. Geburtstag (§ 32 Abs. 4 EStG, Kind in Ausbildung), danach 0 €
    // Relative Medianlohn-Struktur der Regionen. Das Startprofil bildet den
    // aktuellen Wohn-/Arbeitsort ab; ein Eigenheim-Umzug skaliert beide
    // Erwerbseinkommen relativ zu diesem Ausgangsort.
    regionalEinkommen: {
      'berlin-innenstadt': 1.00,
      'berlin-rand': 1.00,
      // Die veröffentlichten Medianentgelte liegen brutto rund 10 %
      // (Leipzig) beziehungsweise 27 % (Meißen) unter Berlin. Für das hier
      // modellierte Haushaltsnetto fällt der Abstand wegen Progression,
      // Pendel-/Remote-Optionen und zweier Einkommen etwas kleiner aus.
      leipzig: 0.93,
      'meissen-umland': 0.84,
    },
  },

  // Explizite Inflation (ECONOMY_MODEL §1a, DECISIONS 2026-07-16): kumulativer
  // Index für alle Beträge, die sonst in Euro des Spielstarts eingefroren wären.
  // Haushalt, ETF und Segmentpreise wachsen über ihre eigenen nominalen Raten
  // (Default jeweils ≈ Inflation) und werden nicht doppelt indexiert.
  preisniveau: {
    inflation: 0.02,        // p.a.; mittelfristiges EZB-Ziel
  },

  kapital: {
    tagesgeldZins: 0.015,   // p.a.; Default-Preset „heute“ überschreibt auf 2 %
    etfRendite: 0.065,      // p.a. nominal erwartet, Welt-ETF (Benchmark-Linie, Design-Säule 4)
    etfVolatilitaet: 0.15,  // p.a. Standardabweichung Welt-ETF
    // Entnahmeregel (ECONOMY_MODEL §4b): Sicherheitsnetz gegen den Dispo. Unter
    // dieser Untergrenze verkauft das Spiel ETF-Anteile (mit Steuer). In
    // Finanzen einstellbar; 0 Monate oder aus = kein automatischer Verkauf.
    entnahme: { aktiv: true, mindestpufferMonate: 1 },
  },

  // Gemeinsamer deutscher Kapitalertragsteuer-Topf. Der Pauschbetrag gilt
  // pro Person und Kalenderjahr; ETF-Erträge erhalten 30 % Teilfreistellung.
  // Kirchensteuer und eine Vorabpauschale werden bewusst nicht simuliert.
  kapitalsteuer: {
    pauschbetragProPerson: 1000,
    personen: 2,
    steuersatz: 0.26375,      // 25 % Abgeltungsteuer + Solidaritätszuschlag
    etfTeilfreistellung: 0.30,
  },

  // Wertpapier-Sandbox: bewusst vereinfachter deutscher Brokervertrag.
  // Ganze Stücke, quartalsweise Dividenden und sofort einbehaltene Steuer.
  // Versteckte Marktphase, pro Seed einmal gewürfelt, erst in der Endauswertung
  // aufgedeckt (Lektion: Markt-Timing ist Glück). Ab Phase 2 treibt sie auch
  // die Immobilien-Segmente; in Phase 1 moduliert sie nur die ETF-Drift.
  marktphase: {
    gewichte: { boom: 0.30, seitwaerts: 0.40, crash: 0.30 },
    etfDriftMod: { boom: 0.010, seitwaerts: 0.0, crash: -0.015 }, // Zuschlag auf etfRendite p.a.
  },

  budget: {
    zeitProMonat: 20,  // h/Monat für Immobilien-Aktivitäten neben Job + Familie
  },

  // --- Phase 2: Markt --------------------------------------------------------
  // Vier Segmente (PLAN.md §4). Preise plausibel, nicht faktisch — vor Release
  // prüfen. drift: Wertentwicklung p.a. je versteckter Marktphase; die Spanne
  // aus PLAN §4 wird durch die Phase aufgelöst (Boom = oberes Ende usw.).
  segmente: {
    'berlin-innenstadt': {
      label: 'Berlin Innenstadt',
      stadt: 'berlin',
      preisM2: 5800,           // €/m² Bestand, Index-Start
      vergleichsmieteM2: 19.22, // Angebotsmiete 2025; innerer Stadtraum
      neubauMieteM2: 19.97,     // Berliner Angebotsmiete Neubau 2025
      mietspiegelM2: 8.0,       // ortsübliche Vergleichsmiete (Näherung; Berliner Mietspiegel 2024 Ø 7,21 €/m², Innenstadt darüber)
      drift: { boom: 0.04, seitwaerts: 0.025, crash: -0.01 },
      sigmaMonat: 0.004,       // Monats-Rauschen auf den Index
    },
    'berlin-rand': {
      label: 'Berlin Rand',
      stadt: 'berlin',
      preisM2: 3800,
      vergleichsmieteM2: 13.01, // Angebotsmiete 2025; äußerer Stadtraum
      neubauMieteM2: 19.97,     // Berliner Angebotsmiete Neubau 2025
      mietspiegelM2: 7.0,       // ortsübliche Vergleichsmiete (Näherung; Berliner Mietspiegel 2024 Ø 7,21 €/m²)
      drift: { boom: 0.03, seitwaerts: 0.02, crash: -0.015 },
      sigmaMonat: 0.005,
    },
    leipzig: {
      label: 'Leipzig',
      stadt: 'leipzig',
      preisM2: 2500,
      vergleichsmieteM2: 10.4, // ~5 % Bruttorendite
      mietspiegelM2: 6.8,      // ortsübliche Vergleichsmiete (Näherung; Mieterverein Ø 6,56 €/m², Spanne 6,50–10 €/m²)
      drift: { boom: 0.03, seitwaerts: 0.015, crash: -0.025 },
      sigmaMonat: 0.006,       // mehr Streuung, mehr Risiko
    },
    'meissen-umland': {
      label: 'Meißen + Umland',
      stadt: 'meissen',
      preisM2: 1900,
      vergleichsmieteM2: 6.4,
      mietspiegelM2: 6.4,      // Meißner Mietspiegel 2025–2027; hier entspricht die Marktmiete dem Mietspiegel
      drift: { boom: 0.025, seitwaerts: 0.01, crash: -0.025 },
      sigmaMonat: 0.006,
    },
  },

  // Objektpreisformel (ECONOMY_MODEL §8)
  bewertung: {
    zustandsFaktor: { 1: 0.78, 2: 0.88, 3: 1.0, 4: 1.08, 5: 1.15 },
    lageBasis: 0.9,            // lageFaktor = lageBasis + lageScore · lageJePunkt
    lageJePunkt: 0.02,
    wiederkehrNachlass: 0.97,  // Preis-Aufschlag sinkt je erfolgloser Marktrunde
    hausPreisFaktor: 0.82,      // Gebäudefläche ist bei Häusern günstiger als ETW-m²; Grundstück kommt separat hinzu
    grundstueckPreisM2: {
      'berlin-innenstadt': 900,
      'berlin-rand': 520,
      leipzig: 260,
      'meissen-umland': 140,
    },
  },

  // Feed-Lifecycle: Listings erscheinen gestaffelt, laufen aus, kehren zurück.
  feed: {
    startAnzahl: 5,            // je Stadt mindestens eins, dazu Haus/Sanierungsfall soweit noch nötig
    intervallMonate: 1,        // alle 1–2 Monate erscheint das nächste; Katalog einmal in <= 70 Monaten
    laufzeitMin: 4,            // Monate am Markt, bevor es verschwindet …
    laufzeitMax: 7,
    wiederkehrMin: 20,         // … und nach längerer Pause wiederkommt; hält den 40er-Feed übersichtlich
    wiederkehrMax: 34,
  },

  // Verhandlung (ECONOMY_MODEL §11)
  verhandlung: {
    basis: 0.55,
    elastizitaet: 6,           // 5 % unter Angebot ≈ −0,30 Annahmechance
    zeitBonus: 0.06,           // je Monat am Markt
    zeitBonusMax: 0.3,
    konkurrenzGewicht: 0.4,
    phasenBonus: { boom: -0.12, seitwaerts: 0, crash: 0.18 },
    minChance: 0.03,
    maxChance: 0.97,
  },

  // Due Diligence (ECONOMY_MODEL §13)
  dueDiligence: {
    besichtigungZeit: 3,       // h
    dokumenteZeit: 2,          // h
    gutachterKosten: 1400,     // €
    gutachterZeit: 2,          // h
    gutachterTrefferquote: 0.75, // p, je existierendem Mangel unabhängig
    ueberraschungsFaktor: 1.35,  // unaufgedeckte Mängel: Eilauftrag + Folgeschaden; macht selektive Gutachten wertvoll
    mangelFaelligMin: 2,       // Monate nach Kauf (uniform)
    mangelFaelligMax: 14,
    sonderumlageFaelligMin: 3,
    sonderumlageFaelligMax: 9,
  },

  // --- Phase 2: Finanzierung ---------------------------------------------------
  kredit: {
    basiszinsStart: 0.032,     // Sollzins-Basis p.a. bei Spielstart
    basiszinsMittel: 0.032,    // Mean-Reversion-Ziel
    reversion: 0.03,           // monatliche Rückzugskraft zum Mittel
    volaMonat: 0.0012,         // Monats-Rauschen des Basiszinses
    basiszinsMin: 0.005,
    basiszinsMax: 0.08,
    // Spread nach LTV (Pp. auf Basiszins); > 100 % kein Angebot
    ltvSpreads: [
      { bisLtv: 0.6, spread: 0.0 },
      { bisLtv: 0.8, spread: 0.003 },
      { bisLtv: 0.9, spread: 0.006 },
      { bisLtv: 1.0, spread: 0.01 },
    ],
    zinsbindungen: [           // Jahre + Zinsauf-/-abschlag
      { jahre: 5, aufschlag: -0.0015 },
      { jahre: 10, aufschlag: 0 },
      { jahre: 15, aufschlag: 0.0025 },
    ],
    tilgungMin: 0.01,          // Tilgungssatz-Slider p.a.
    tilgungMax: 0.04,
    // Haushaltsrechnung der Bank je bankPuffer-Stufe (ECONOMY_MODEL §10)
    bank: {
      kulant: { mietAnrechnung: 0.75, puffersatz: 1.0, minEkAnteil: 0.0 },
      standard: { mietAnrechnung: 0.7, puffersatz: 0.85, minEkAnteil: 0.05 },
      streng: { mietAnrechnung: 0.6, puffersatz: 0.7, minEkAnteil: 0.1 },
    },
    bewirtschaftungsPauschale: 150, // €/Monat je Objekt in der Bankrechnung
    sondertilgungMaxAnteil: 0.05, // pro Kalenderjahr, bezogen auf den Ursprungsbetrag
    vorschlagRestpufferMonate: 3, // Startwert im Finanzierungsdialog lässt mind. so viele Monatsausgaben auf dem Tagesgeld
  },

  // Kaufnebenkosten (ECONOMY_MODEL §12) — "dieses Geld ist weg"
  nebenkosten: {
    grunderwerbsteuer: { berlin: 0.06, leipzig: 0.055, meissen: 0.055 }, // je Stadt, tunbar
    notarGrundbuch: 0.02,
    maklerProvision: 0.0357,   // nur wenn Listing nicht provisionsfrei
  },

  // Laufende Bewirtschaftung (ECONOMY_MODEL §14, §19)
  bewirtschaftung: {
    hausgeldNichtUmlegbar: 0.35, // Anteil des Hausgelds, der am Eigentümer hängt (vermietet)
    instandhaltungM2Jahr: 10,    // €/m²/Jahr → fließt in die Objekt-Rücklage
    cashflowNaheNullMonat: 100,  // bis −100 €/Monat gilt ein aktiver Pfad als nahe Break-even
    zeitProObjekt: 3,            // h/Monat Selbstverwaltung je Objekt
    hausverwaltungProzent: 0.05, // Anteil der Kaltmiete an die Hausverwaltung
    hausverwaltungEventDaempfung: 0.5, // multipliziert die Event-Wahrscheinlichkeit des Objekts
    // Gute Energieklassen senken die Exposure für objektbezogene Störungen;
    // dadurch hat die energetische Renovierung einen laufenden Nutzen (§20).
    energieEventFaktor: { A: 0.55, B: 0.62, C: 0.70, D: 0.80, E: 0.90, F: 1.0, G: 1.1, H: 1.2 },
    dispoZins: 0.11,             // p.a. auf negatives Cash (forced credit, ECONOMY_MODEL §19)
    objektarten: {
      wohnung: {
        label: 'Eigentumswohnung',
        instandhaltungM2Jahr: 10,
        nichtUmlegbarFaktor: 0.35,
        gebaeudeAnteil: 0.80,
      },
      haus: {
        label: 'Haus mit Grundstück',
        instandhaltungM2Jahr: 32,
        nichtUmlegbarFaktor: 0.55,
        gebaeudeAnteil: 0.70,
      },
    },
  },

  // Sonderstart „Viel Bestand, wenig Luft“: begrenzte, kostenpflichtige
  // Stabilisierung statt automatischer Rettung (ECONOMY_MODEL §14a).
  turnaround: {
    preset: 'schuldenberg',
    bankFensterMonate: 12,
    bankMaxAnpassungen: 3,
    bankTilgungNeu: 0.005,
    bankGebuehrProzent: 0.002,
    bankGebuehrMin: 500,
    bankZeit: 3,
    ruecklageZielJahre: 1,
    zwischenzielVerbesserungMonat: 600,
  },

  // --- Phase 3: Mieter & Vermietung (ECONOMY_MODEL §15–16) ---------------------
  mieter: {
    // Erzielbare Miete = Vergleichsmiete · zustandMietFaktor (§15)
    zustandMietFaktor: { 1: 0.85, 2: 0.93, 3: 1.0, 4: 1.06, 5: 1.12 },
    mietNiveaus: {
      unter: { label: 'unter Marktmiete', faktor: 0.92, poolBasis: 7, qualiSkew: 0.15, leerstandsRisiko: 0.0 },
      auf:   { label: 'zur Marktmiete',   faktor: 1.0,  poolBasis: 6, qualiSkew: 0.0,  leerstandsRisiko: 0.04 },
      ueber: { label: 'über Marktmiete',  faktor: 1.08, poolBasis: 4, qualiSkew: -0.15, leerstandsRisiko: 0.18 },
    },
    poolMin: 3,
    poolMax: 8,
    moebliertAufschlag: 0.12,    // +12 % Kaltmiete möbliert; kein Langfrist-Autopick
    moebliertMoebelKosten: 9500, // € Einrichtung (einmalig beim Möblieren)
    moebliertChurn: 1.2,         // Aufschlag aufs Auszugsrisiko möbliert
    // Drei bewusst vereinfachte Vermietungswege. Aufschlag ist keine Aussage
    // über rechtliche Zulässigkeit; das regionale Prüf-/Rückzahlungsrisiko
    // bildet gerade in Berlin die Unsicherheit möblierter Zeitmodelle ab.
    vermietungsmodelle: {
      regulaer: {
        label: 'Regulär nach Vergleichsmiete', kurz: 'stabil · wenig Aufwand',
        aufschlag: 0, moebelKosten: 0, churn: 0, zeitProMonat: 0, leerstandsRisiko: 0,
        rechtsrisiko: { berlin: 0, leipzig: 0, meissen: 0 }, rueckzahlungMonate: 0,
      },
      moebliert: {
        label: 'Möbliert, längerfristig', kurz: 'mehr Miete · Einrichtung & Wechsel',
        aufschlag: 0.18, moebelKosten: 9500, churn: 1.2, zeitProMonat: 1, leerstandsRisiko: .02,
        rechtsrisiko: { berlin: .0025, leipzig: .0008, meissen: .0003 }, rueckzahlungMonate: 4,
      },
      wohnenAufZeit: {
        label: 'Wohnen auf Zeit', kurz: 'hohe Miete · viel Aufwand & Rechtsrisiko',
        aufschlag: 0.26, moebelKosten: 11000, churn: 3, zeitProMonat: 3, leerstandsRisiko: .04,
        rechtsrisiko: { berlin: .012, leipzig: .003, meissen: .001 }, rueckzahlungMonate: 8,
      },
    },

    zahlungsausfallBasis: 0.04,  // p = (1−zahlungsmoral) · Basis pro Monat
    auszugBasisRisiko: 0.006,    // Basis-Auszugswahrscheinlichkeit/Monat
    mindestBleibe: 6,            // Monate, bevor überhaupt ausgezogen wird
    unzufriedenheitHebel: 2.0,   // multipliziert Auszugsrisiko bei Unzufriedenheit
    zufriedenheitErholung: 0.03, // Zufriedenheit driftet monatlich zurück zu 0
    pflegeZustandsMonate: 240,   // Erwartungswert: schlechte Pflege kostet über ~20 J. 1 Stufe

    // Eigenbedarf mit Widerspruch: Einigung kostet mind. abfindungMin, sonst
    // Monatsmieten + Sockel (Euro des Spielstarts, mit Preisniveau fortgeschrieben).
    eigenbedarf: { abfindungMin: 6000, abfindungMonatsmieten: 6, abfindungSockel: 2000 },

    kappungProzent: 0.15,        // max. Mieterhöhung …
    kappungMonate: 36,           // … in 36 Monaten (abstrahierte Kappungsgrenze)
    mieterhoehungUnzufriedenheit: 0.25, // Zufriedenheits-Malus je Erhöhung
  },

  // Regionale Mietrechts-Abstraktion. Berlin ist im Spiel sehr restriktiv und
  // mieterfreundlich; Leipzig bleibt reguliert, aber etwas beweglicher.
  mietrecht: {
    berlin: {
      label: 'Berlin · Mietpreisbremse und 15-%-Kappung',
      kurz: 'strenge Mietregeln',
      kappungProzent: 0.15,     // Berliner Kappungsgrenzen-Verordnung, gültig bis 10.05.2028
      kappungMonate: 36,
      mieterhoehungUnzufriedenheit: 0.35,
    },
    leipzig: {
      label: 'Leipzig · Mietpreisbremse und 15-%-Kappung',
      kurz: 'moderate Mietregeln',
      kappungProzent: 0.15,
      kappungMonate: 36,
      mieterhoehungUnzufriedenheit: 0.22,
    },
    meissen: {
      label: 'Meißen · Mietspiegel, keine Mietpreisbremse',
      kurz: 'Mietspiegel',
      kappungProzent: 0.20,
      kappungMonate: 36,
      mieterhoehungUnzufriedenheit: 0.18,
    },
  },

  // Mietpreisbremse bei Neuvermietung (§ 556d BGB, ECONOMY_MODEL §15a): höchstens
  // ortsübliche Vergleichsmiete + 10 %. Ausgenommen sind Erstvermietungen nach
  // Oktober 2014 (vereinfacht: Baujahr ab 2015), umfassend modernisierte Objekte
  // und eine höhere Vormiete. Annahme: Die Regel gilt über die ganze Spielzeit
  // fort (rechtlich derzeit Berlin bis längstens Ende 2029, Leipzig bis 30.06.2027).
  mietpreisbremse: {
    staedte: { berlin: true, leipzig: true, meissen: false },
    aufschlag: 0.10,
    neubauAbBaujahr: 2015,
    umfassendModernisiertM2: 1000, // € Renovierungsvolumen/m² (Euro des Spielstarts) ≈ ⅓ Neubaukosten
    // Bewusster Verstoß: über der Grenze vermieten und hoffen, dass niemand
    // rügt (ECONOMY_MODEL §15b). Ein RNG-Wert je Monat und betroffenem Objekt.
    verstoss: {
      ruegeMonat: { berlin: 0.006, leipzig: 0.004 }, // Grundchance pro Monat, dass der Mieter rügt
      konfliktHebel: 1.5,         // × (1 + Konfliktneigung · Hebel)
      ueberschussHebel: 2,        // × (1 + Überschreitung in % der Grenze · Hebel)
      rueckforderungMonate: 30,   // Rüge in den ersten 30 Monaten: Erstattung ab Mietbeginn (§ 556g Abs. 2 BGB)
      zufriedenheitMalus: 0.4,
      bussgeldMonat: { berlin: 0.0008, leipzig: 0.0003 }, // Prüfung durch das Amt (§ 5 WiStG)
      bussgeldSchwelle: 0.20,     // nur über 120 % der ortsüblichen Vergleichsmiete
      bussgeld: 10000,            // Euro des Spielstarts; dazu Abschöpfung des Mehrerlöses
    },
  },

  // --- Phase 3: Renovierung (ECONOMY_MODEL §17) -------------------------------
  renovierung: {
    kostenFaktor: 1,           // profilspezifische handwerkliche Eigenleistung
    dauerFaktor: 1,
    ueberziehungFaktor: 1,
    stufen: {
      kosmetisch:  { label: 'Kosmetisch', kostenM2: 250, dauer: 2, zustandZiel: '+1', maxZustand: 4, wertBonus: 0, energieBonus: 0 },
      kuecheBad:   { label: 'Küche & Bad', kostenM2: 450, dauer: 4, zustandZiel: 4, maxZustand: 5, wertBonus: 0, energieBonus: 0 },
      grundriss:   { label: 'Grundriss', kostenM2: 800, dauer: 6, zustandZiel: 5, maxZustand: 5, wertBonus: 0.05, energieBonus: 0 },
      energetisch: { label: 'Energetisch', kostenM2: 600, dauer: 5, zustandZiel: '+1', maxZustand: 5, wertBonus: 0, energieBonus: 2 },
      // Grundriss + Energetik in einem Paket; überschreitet allein die Schwelle
      // der umfassenden Modernisierung und hebt damit die Mietpreisbremse auf.
      umfassend:   { label: 'Umfassende Modernisierung', kostenM2: 1400, dauer: 9, zustandZiel: 5, maxZustand: 5, wertBonus: 0.05, energieBonus: 2 },
    },
    ueberziehungBasis: 0.1,      // Grund-Überziehungsrisiko
    ueberziehungJeZustand: 0.06, // je Stufe unter 5 mehr Risiko (schlechter Zustand → mehr Überraschungen)
    zeitProRenovierung: 6,       // h/Monat während der Bauzeit
    eigenleistung: {
      rabatt: 0.12,              // begrenzter Anteil der Schätzsumme
      rabattHandwerklich: 0.20,
      ersparnisMax: 6000,
      zeitJe1000Euro: 0.6,       // zusätzliche h/Monat, aus Basisvolumen und Dauer abgeleitet
      zeitMonatMax: 6,
      risikoFaktor: 1.30,        // ohne Handwerksprofil mehr Überziehungsrisiko
      risikoFaktorHandwerklich: 1.05,
    },
  },

  // --- Phase 3: Events (ECONOMY_MODEL §18) ------------------------------------
  events: {
    eventChanceBasis: 0.035,     // Grund-Wahrscheinlichkeit/Monat (auch als Mieter)
    eventChanceJeObjekt: 0.03,   // Zuschlag je Objekt
    eventChanceMax: 0.25,
    maxKinderEvents: 2,          // PLAN §5.9
  },

  familie: {
    startZufriedenheit: 70,      // 0–100
    neutral: 65,                 // Drift-Ziel ohne Stress
    driftProMonat: 0.15,         // Erholung/Monat Richtung Neutral
    proZeitUeberzug: 0.5,        // Malus je Stunde Zeitüberzug/Monat
    dispoMalus: 1.5,             // Malus/Monat bei negativem Cash
  },

  // G/H: Ziele bleiben reine Ableitungen vorhandener Systeme. Arbeitsmodelle
  // verändern Einkommen, verfügbare Immobilienzeit und Familien-Drift zugleich.
  entwicklung: {
    zielOptionen: {
      erstesStabilesObjekt: { label: 'Erstes stabiles Mietobjekt', fristMonate: 36 },
      eigenheim: { label: 'Passendes Eigenheim', fristMonate: 96 },
      bestandStabilisieren: { label: 'Bestand und Puffer stabilisieren', fristMonate: 60 },
    },
    arbeitsmodellBindungMonate: 12,
    arbeitsmodelle: {
      balance: { label: 'Balance halten', einkommenDeltaMonat: 0, zeitPlusMonat: 0, zeitBelastungMonat: 0, familieZielDelta: 0 },
      karriere: { label: 'Karriereschritt', einkommenDeltaMonat: 650, zeitPlusMonat: 0, zeitBelastungMonat: 6, familieZielDelta: -4 },
      familienzeit: { label: 'Familienzeit', einkommenDeltaMonat: -900, zeitPlusMonat: 8, zeitBelastungMonat: 0, familieZielDelta: 5 },
    },
    lebensphaseVorlaufMonate: 12,
    stabilerCashflowGrenze: -100,
    pufferZielMonate: 6,
  },

  // --- Phase 4: Eigenheim, Steuern, Verkauf, Endauswertung -------------------
  eigenheim: {
    minZimmer: 3,                // vierköpfige Familie: 1-/2-Zimmer-Wohnungen sind kein Eigenheim-Ausweg
    minFamilienScore: 3,         // nur ausdrücklich familiengeeignete Objekte sind als Eigenheim wählbar
    familieSofortBonus: 6,       // einmaliger Stabilitäts-/Ankommensbonus beim Einzug
    familieNeutralBonus: 0,      // kein pauschaler Dauerbonus mehr: Mieten trägt eigene Risiken (Eigenbedarf), Eigentum eigene Lasten
    kinderEventMalusFaktor: 1.0, // Eigentum mildert Kinder-Events nicht pauschal ab
    verkaufFamilieMalus: 6,      // Eigenheimverkauf kostet Stabilität
  },

  steuer: {
    grenzsatzDefault: 0.35,      // Slider-Startwert; bewusst vereinfachter Grenzsteuersatz
    grenzsatzMin: 0.20,
    grenzsatzMax: 0.45,
    afaSatz: 0.02,               // lineare AfA p.a.
    gebaeudeAnteil: 0.80,        // Anteil des Kaufpreises, der als Gebäude gilt
  },

  verkauf: {
    dauerMonate: 6,              // Verkaufsfriktion: Abschluss nach sechs Monats-Ticks
    preisFaktor: 0.98,           // kleine Vermarktungs-/Verhandlungsfriktion auf den Marktwert
    maklerProvision: 0.0357,     // Verkäufer-Maklerkosten
    spekulationsfristMonate: 120,
  },

  endgame: {
    vermoegenBewertungAlter: 85, // Vermögensscore an festem Alter, nicht am zufälligen Lebensende
    vermoegenZielJahresnetto: 40, // Vermögensziel = 40 × Start-Jahresnetto (inkl. geplanter Einkommenssprünge), heutige Euro
    nettovermoegenZiel: 5000000, // Rückfall, falls kein Starteinkommen vorliegt
    cashflowZiel: 2000,          // heutige Euro/Monat; Primärziel aus PLAN §2
    entnahmeRate: 0.035,         // sichere Entnahme p.a. aus Tagesgeld + ETF (netto) zählt als passiver Cashflow; 0 = nur Mietobjekte
    ltvVollScore: 0.40,          // bis 40 % LTV volle Resilienz-Punkte
    ltvNullScore: 1.00,          // bei 100 % LTV keine LTV-Punkte
    ruecklageZielMonate: 6,      // sechs Monate laufende Objektpflichten
    stressPunkteJeUeberzugStunde: 4,
    stressPunkteNegativCashAnteil: 40,
    benchmarkMaxObjekte: 4,      // gescriptete Vergleichsstrategie bleibt kompakt
  },

  // Drei Schwierigkeiten (PLAN.md §2). eventFaktor und bankPuffer werden ab
  // Phase 2/3 verwendet, sind aber Teil des Vertragswerks von Anfang an.
  schwierigkeiten: {
    leicht: {
      label: 'Leicht',
      kapitalFaktor: 1.15,
      einkommensFaktor: 1.05,
      volatilitaetsFaktor: 0.7,   // multipliziert Markt-/ETF-Volatilität
      eventFaktor: 0.7,           // Event-Frequenz & versteckte Mängel (Phase 3)
      bankPuffer: 'kulant',       // Haushaltsrechnung der Bank (Phase 2)
    },
    normal: {
      label: 'Normal',
      kapitalFaktor: 1.0,
      einkommensFaktor: 1.0,
      volatilitaetsFaktor: 1.0,
      eventFaktor: 1.0,
      bankPuffer: 'standard',
    },
    schwer: {
      label: 'Schwer',
      kapitalFaktor: 0.8,
      einkommensFaktor: 0.95,
      volatilitaetsFaktor: 1.3,
      eventFaktor: 1.3,
      bankPuffer: 'streng',
    },
  },
};

