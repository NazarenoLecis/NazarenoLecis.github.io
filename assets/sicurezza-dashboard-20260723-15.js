(function () {
  "use strict";

  var VERSION = "20260723-14";
  var PAYLOAD_GLOBALS = {
    metadata: "SICUREZZA_DASHBOARD_METADATA",
    reported: "SICUREZZA_REPORTED_CRIMES",
    reportedNational: "SICUREZZA_REPORTED_CRIMES_NATIONAL",
    reportedRegional: "SICUREZZA_REPORTED_CRIMES_REGIONAL",
    reportedProvincial: "SICUREZZA_REPORTED_CRIMES_PROVINCIAL",
    reportedCapital: "SICUREZZA_REPORTED_CRIMES_CAPITAL",
    people: "SICUREZZA_PEOPLE",
    population: "SICUREZZA_POPULATION",
    survey: "SICUREZZA_SURVEY"
  };
  var DATA_BASES = [
    "https://data.nazarenolecis.com/sicurezza/"
  ];
  var POPULATION_DATA_BASES = DATA_BASES;

  var COLORS = ["#ff5a1f", "#4f8bc9", "#3aa6a1", "#d4a348", "#d96363", "#8d7ad8", "#6ea66f", "#b36a4a"];
  var LEVEL_LABELS = { national: "Italia", regional: "Regioni", provincial: "Province", capital: "Comuni capoluogo" };
  var ROLE_LABELS = { offender: "Autori / denunciati", victim: "Vittime", unknown: "Ruolo non classificato" };
  var REPORTED_LEVEL_PAYLOADS = {
    national: { file: "dashboard_reported_crimes_national.js", global: PAYLOAD_GLOBALS.reportedNational },
    regional: { file: "dashboard_reported_crimes_regional.js", global: PAYLOAD_GLOBALS.reportedRegional },
    provincial: { file: "dashboard_reported_crimes_provincial.js", global: PAYLOAD_GLOBALS.reportedProvincial },
    capital: { file: "dashboard_reported_crimes_capital.js", global: PAYLOAD_GLOBALS.reportedCapital }
  };
  var CITIZENSHIP_LABELS = {
    totale_cittadinanza: "Totale cittadinanza",
    immigrati_o_stranieri: "Stranieri / immigrati",
    italiani_o_non_immigrati: "Italiani / non immigrati",
    non_residenti: "Non residenti",
    non_classificato: "Non classificato"
  };
  var CITIZENSHIP_ORDER = ["totale_cittadinanza", "immigrati_o_stranieri", "italiani_o_non_immigrati", "non_residenti", "non_classificato"];

  var CRIME_LABELS = {
    TOT: "Totale reati denunciati",
    THEFT: "Furti",
    BAGTHEF: "Scippi",
    PICKTHEF: "Borseggi",
    BURGTHEF: "Furti in abitazione",
    SHOPTHEF: "Furti in esercizi commerciali",
    ARTTHEF: "Furti di opere d'arte",
    CARTHEF: "Furti di autovetture",
    MOPETHEF: "Furti di ciclomotori",
    MOTORTHEF: "Furti di motocicli",
    TRUCKTHEF: "Furti di autocarri",
    VEHITHEF: "Furti su veicoli",
    ROBBER: "Rapine",
    BANKROB: "Rapine in banca",
    POSTROB: "Rapine in uffici postali",
    SHOPROB: "Rapine in esercizi commerciali",
    STREETROB: "Rapine in pubblica via",
    HOUSEROB: "Rapine in abitazione",
    ROBBHOM: "Omicidi per rapina",
    INTENHOM: "Omicidi volontari",
    ATTEMPHOM: "Tentati omicidi",
    MAFIAHOM: "Omicidi di tipo mafioso",
    ROADHOM: "Omicidi stradali",
    UNINTHOM: "Omicidi colposi",
    MANSHOM: "Omicidi preterintenzionali",
    MASSMURD: "Stragi",
    TERRORHOM: "Omicidi con finalità terroristica",
    INFANTHOM: "Infanticidi",
    RAPE: "Violenze sessuali",
    RAPEUN18: "Violenze sessuali su minori",
    KIDNAPP: "Sequestri di persona",
    ATTACK: "Attentati",
    CULPINJU: "Lesioni colpose",
    EXTORT: "Estorsioni",
    DRUG: "Stupefacenti",
    CYBERCRIM: "Delitti informatici",
    SWINCYB: "Truffe e frodi informatiche",
    MONEYLAU: "Riciclaggio",
    USURY: "Usura",
    DAMAGE: "Danneggiamenti",
    DAMARS: "Danneggiamenti seguiti da incendio",
    ARSON: "Incendi",
    FOREARS: "Incendi boschivi",
    MENACE: "Minacce",
    BLOWS: "Percosse",
    PROSTI: "Prostituzione",
    PORNO: "Pornografia",
    CORRUPUN18: "Corruzione di minorenni",
    COUNTER: "Contraffazione",
    SMUGGL: "Contrabbando",
    INTPROP: "Violazioni della proprietà intellettuale",
    RECEIV: "Ricettazione",
    CRIMASS: "Associazione per delinquere",
    MAFIASS: "Associazione mafiosa",
    OTHCRIM: "Altri reati"
  };

  var CRIME_THEMES = {
    all: { label: "Tutte le categorie", codes: [] },
    violent_person: {
      label: "Violenza contro la persona",
      codes: ["INTENHOM", "ATTEMPHOM", "MAFIAHOM", "INFANTHOM", "ROADHOM", "ROBBHOM", "TERRORHOM", "UNINTHOM", "MANSHOM", "MASSMURD", "RAPE", "RAPEUN18", "CORRUPUN18", "BLOWS", "CULPINJU", "MENACE", "KIDNAPP", "ATTACK"]
    },
    property: {
      label: "Patrimonio",
      codes: ["THEFT", "BURGTHEF", "SHOPTHEF", "CARTHEF", "MOPETHEF", "MOTORTHEF", "TRUCKTHEF", "VEHITHEF", "DAMAGE", "DAMARS", "RECEIV", "ARSON", "FOREARS"]
    },
    predatory: {
      label: "Reati predatori",
      codes: ["BAGTHEF", "PICKTHEF", "ROBBER", "BANKROB", "POSTROB", "SHOPROB", "STREETROB", "HOUSEROB", "CARTHEF", "BURGTHEF"]
    },
    economic_digital: {
      label: "Economici e digitali",
      codes: ["SWINCYB", "CYBERCRIM", "MONEYLAU", "USURY", "COUNTER", "SMUGGL", "INTPROP"]
    },
    drugs: { label: "Stupefacenti", codes: ["DRUG"] },
    organized: { label: "Criminalità organizzata", codes: ["MAFIASS", "MAFIAHOM", "CRIMASS", "EXTORT", "USURY", "MONEYLAU", "ARSON"] },
    other: { label: "Altri reati", codes: ["OTHCRIM"] }
  };

  var VIOLENT_CODES = new Set(CRIME_THEMES.violent_person.codes.concat(["ROBBER", "BANKROB", "POSTROB", "SHOPROB", "STREETROB", "HOUSEROB", "EXTORT"]));
  var MEASURE_OPTIONS = [
    { value: "absolute", label: "Valori assoluti" },
    { value: "rate", label: "Tassi per 100.000 abitanti" },
    { value: "rate_1000", label: "Tassi per 1.000 abitanti" },
    { value: "index", label: "Indice primo anno = 100" },
    { value: "moving_average", label: "Media mobile triennale" },
    { value: "yoy", label: "Variazione % annua" }
  ];
  var POINT_MEASURE_VALUES = ["absolute", "rate", "rate_1000"];
  var CROSS_SECTION_MEASURE_VALUES = ["absolute", "rate", "rate_1000", "yoy"];
  var PEOPLE_MEASURE_OPTIONS = [
    { value: "absolute", label: "Valori assoluti" },
    { value: "share", label: "Quota % del grafico" },
    { value: "rate", label: "Tasso per 100.000 abitanti" },
    { value: "rate_1000", label: "Tasso per 1.000 abitanti" }
  ];
  var COUNTER_OPTIONS = [
    { value: "all", label: "Tutte le controtendenze" },
    { value: "worse", label: "Peggiora mentre Italia migliora" },
    { value: "better", label: "Migliora mentre Italia peggiora" }
  ];
  var COMPOSITION_MODE_OPTIONS = [
    { value: "themes", label: "Categorie di reato" },
    { value: "crimes", label: "Singoli reati" }
  ];
  var COMPOSITION_METRIC_OPTIONS = [
    { value: "share", label: "Quota percentuale" },
    { value: "absolute", label: "Valori assoluti" }
  ];
  var CONTRIBUTION_DIRECTION_OPTIONS = [
    { value: "all", label: "Aumenti e diminuzioni" },
    { value: "increase", label: "Solo aumenti" },
    { value: "decrease", label: "Solo diminuzioni" }
  ];
  var CONTRIBUTION_THRESHOLD_OPTIONS = [
    { value: "0", label: "Tutte" },
    { value: "5", label: "Almeno 5%" },
    { value: "10", label: "Almeno 10%" },
    { value: "20", label: "Almeno 20%" },
    { value: "50", label: "Almeno 50%" }
  ];
  var HOMICIDE_CODES = ["INTENHOM", "UNINTHOM", "MANSHOM", "ROADHOM", "ATTEMPHOM", "MAFIAHOM", "ROBBHOM", "INFANTHOM", "MASSMURD", "TERRORHOM"];
  var HOMICIDE_MAIN_CODES = ["INTENHOM", "UNINTHOM", "MANSHOM"];
  var HOMICIDE_SHORT_LABELS = {
    INTENHOM: "Volontari",
    UNINTHOM: "Colposi",
    MANSHOM: "Preterintenzionali",
    ROADHOM: "Stradali",
    ATTEMPHOM: "Tentati",
    MAFIAHOM: "Tipo mafioso",
    ROBBHOM: "Per rapina",
    INFANTHOM: "Infanticidi",
    MASSMURD: "Stragi",
    TERRORHOM: "Finalità terroristica"
  };
  var HOMICIDE_OPTIONS = [
    { value: "INTENHOM", label: "Omicidi volontari", codes: ["INTENHOM"] },
    { value: "UNINTHOM", label: "Omicidi colposi (aggregato)", codes: ["UNINTHOM"] },
    { value: "ROADHOM", label: "Omicidi stradali (voce specifica)", codes: ["ROADHOM"] },
    { value: "MANSHOM", label: "Omicidi preterintenzionali", codes: ["MANSHOM"] },
    { value: "ATTEMPHOM", label: "Tentati omicidi", codes: ["ATTEMPHOM"] },
    { value: "MAFIAHOM", label: "Omicidi di tipo mafioso", codes: ["MAFIAHOM"] },
    { value: "ROBBHOM", label: "Omicidi per rapina", codes: ["ROBBHOM"] },
    { value: "INFANTHOM", label: "Infanticidi", codes: ["INFANTHOM"] },
    { value: "MASSMURD", label: "Stragi", codes: ["MASSMURD"] },
    { value: "TERRORHOM", label: "Omicidi con finalità terroristica", codes: ["TERRORHOM"] }
  ];
  var HOMICIDE_STRUCTURE_VIEW_OPTIONS = [
    { value: "breakdown", label: "Suddivisione per tipo" },
    { value: "territories", label: "Ranking territoriale" }
  ];
  var HOMICIDE_PEOPLE_BREAKDOWN_OPTIONS = [
    { value: "citizenship", label: "Cittadinanza" },
    { value: "sex", label: "Sesso" },
    { value: "age", label: "Età" },
    { value: "sex_age", label: "Sesso ed età" },
    { value: "crime", label: "Tipo di omicidio" }
  ];
  var SURVEY_TOPIC_LABELS = {
    perception: "Percezione della sicurezza",
    victimization: "Vittimizzazione dichiarata",
    reporting_propensity: "Propensione alla denuncia"
  };
  var SURVEY_DIMENSION_LABELS = {
    all: "Tutti i dettagli",
    "totale": "Totale",
    "serie storica nazionale": "Serie storica nazionale",
    "regione": "Regione",
    "ripartizione geografica": "Ripartizione geografica",
    "ampiezza del comune": "Ampiezza del comune",
    "sesso": "Sesso",
    "età": "Età",
    "sesso ed età": "Sesso ed età",
    "titolo di studio": "Titolo di studio",
    "reato": "Reato",
    "luogo": "Luogo",
    "motivo": "Motivo",
    "caratteristiche attribuite agli autori": "Caratteristiche attribuite agli autori",
    "altra dimensione": "Altra dimensione"
  };
  var SURVEY_DEFAULTS = {
    perception: {
      indicator: "Molto/ Abbastanza sicuro camminando da soli al buio nella zona in cui si vive",
      dimension: "serie storica nazionale",
      response: "Quota",
      period: "all"
    },
    victimization: {
      indicator: "Vittimizzazione dichiarata per reato",
      dimension: "reato",
      crime: "all",
      response: "Quota",
      unit: "% popolazione o famiglie di riferimento",
      period: "2022-2023"
    },
    reporting_propensity: {
      indicator: "Propensione alla denuncia per reato",
      dimension: "reato",
      crime: "all",
      response: "Denunciato alle forze dell'ordine",
      period: "2022-2023"
    }
  };

  var TEXT_EN = {
    "Sicurezza in Italia": "Security in Italy",
    "Criminalità registrata, vittime, percezione e sistema di sicurezza": "Reported crime, victims, perception and the security system",
    "Criminalita registrata, vittime, percezione e sistema di sicurezza": "Reported crime, victims, perception and the security system",
    "Una dashboard per leggere serie storiche nazionali, regionali, provinciali e dei comuni capoluogo, distinguendo reati, territori, autori e vittime senza confondere denunce, vittimizzazione e percezione.": "A dashboard for reading national, regional, provincial and provincial-capital time series while separating offences, territories, offenders and victims without confusing police reports, victimization and perception.",
    "Fonti: ISTAT e Ministero dell'Interno": "Sources: ISTAT and Ministry of the Interior",
    "Serie sui delitti denunciati in caricamento...": "Reported-crime series loading...",
    "Elaborazione di Nazareno Lecis.": "Processing by Nazareno Lecis.",
    "Apri repository sicurezza": "Open the sicurezza repository",
    "Quadro": "Overview",
    "Andamento": "Trends",
    "Territori": "Territories",
    "Patrimonio": "Property",
    "Persona": "People",
    "Omicidi": "Homicides",
    "Autori/vittime": "Offenders/victims",
    "Controtendenze": "Countertrends",
    "Percezione": "Perception",
    "Metodo": "Method",
    "Regola di lettura:": "Reading rule:",
    "qui i reati sono delitti denunciati o accertati dalle Forze di polizia e trasmessi all'autorità giudiziaria, non tutti i reati effettivamente commessi. Vittimizzazione e percezione sono fenomeni diversi e vanno tenuti separati.": "offences shown here are crimes reported to or detected by police forces and forwarded to the judicial authority, not all offences actually committed. Victimization and perception are different phenomena and must be kept separate.",
    "qui i reati sono delitti denunciati o accertati dalle Forze di polizia e trasmessi all'autorita giudiziaria, non tutti i reati effettivamente commessi. Vittimizzazione e percezione sono fenomeni diversi e vanno tenuti separati.": "offences shown here are crimes reported to or detected by police forces and forwarded to the judicial authority, not all offences actually committed. Victimization and perception are different phenomena and must be kept separate.",
    "Filtri": "Filters",
    "Quadro generale del territorio selezionato": "Overview of the selected territory",
    "I filtri governano tutta la pagina. La serie storica mantiene sempre l'Italia come benchmark, poi permette il dettaglio regionale, provinciale o dei comuni capoluogo.": "The filters control the whole page. The time series always keeps Italy as a benchmark, then allows regional, provincial or provincial-capital detail.",
    "Come leggere la dashboard": "How to read the dashboard",
    "Ogni grafico ha i propri filtri: l'utente può scegliere anno, territorio, reato e misura direttamente nel punto in cui sta leggendo il dato. Il livello comunale disponibile nei dati è quello dei comuni capoluogo.": "Each chart has its own filters: users can choose year, territory, offence and measure directly where they are reading the data. The municipal level available in the data is provincial capitals.",
    "Ogni grafico ha i propri filtri, cosi l'utente puo scegliere anno, territorio, reato e misura direttamente nel punto in cui sta leggendo il dato. Il livello comunale disponibile nei dati e quello dei comuni capoluogo.": "Each chart has its own filters, so users can choose year, territory, offence and measure directly where they are reading the data. The municipal level available in the data is provincial capitals.",
    "Anno": "Year",
    "Anno finale": "Final year",
    "Livello": "Level",
    "Regione": "Region",
    "Provincia": "Province",
    "Territorio": "Territory",
    "Categoria": "Category",
    "Reato": "Offence",
    "Misura": "Measure",
    "Ruolo persona": "Person role",
    "Ruolo": "Role",
    "Cittadinanza": "Citizenship",
    "Scostamenti": "Divergences",
    "Ricerca tabella": "Table search",
    "Reset": "Reset",
    "Per confronti territoriali usa i tassi quando disponibili. I valori assoluti restano utili per capire il volume amministrativo del fenomeno.": "Use rates for territorial comparisons when available. Absolute values remain useful for understanding the administrative volume of the phenomenon.",
    "per confronti territoriali usa i tassi quando disponibili. I valori assoluti restano utili per capire il volume amministrativo del fenomeno. Per Roma, Milano, Cagliari, Venezia e gli altri capoluoghi seleziona il livello \"Comuni capoluogo\" nei filtri dei grafici.": "use rates for territorial comparisons when available. Absolute values remain useful for understanding the administrative volume of the phenomenon. For Rome, Milan, Cagliari, Venice and the other provincial capitals, select the \"Provincial capitals\" level in the chart filters.",
    "Serie storiche": "Time series",
    "Andamento della criminalità registrata": "Trend in reported crime",
    "Andamento della criminalita registrata": "Trend in reported crime",
    "Il punto di partenza è nazionale. Se scegli un territorio, il grafico mostra solo quel territorio; usa \"Confronta con\" per aggiungere una seconda serie.": "The starting point is national. If you choose a territory, the chart shows only that territory; use \"Compare with\" to add a second series.",
    "Il punto di partenza e sempre nazionale. Se scegli un territorio, la dashboard lo confronta con l'Italia.": "The starting point is always national. If you choose a territory, the dashboard compares it with Italy.",
    "Serie storica": "Time series",
    "confronto territoriale": "territorial comparison",
    "Confronta con": "Compare with",
    "Composizione dei reati": "Offence composition",
    "ultimo anno selezionato": "latest selected year",
    "Vista": "View",
    "Cosa aumenta e cosa diminuisce": "What is increasing and decreasing",
    "confronto tra anni": "year comparison",
    "Confronto con": "Compared with",
    "Direzione": "Direction",
    "Soglia %": "% threshold",
    "Nazionale, regioni, province e comuni capoluogo": "National, regional, provincial and provincial-capital detail",
    "La granularità dipende dalla fonte: per i reati denunciati arriva fino ai comuni capoluogo, non a tutti i comuni italiani.": "Granularity depends on the source: for reported offences it reaches provincial capitals, not every Italian municipality.",
    "La granularita dipende dalla fonte: per i reati denunciati arriva fino ai comuni capoluogo, non a tutti i comuni italiani.": "Granularity depends on the source: for reported offences it reaches provincial capitals, not every Italian municipality.",
    "Ranking territoriale": "Territorial ranking",
    "filtri correnti": "current filters",
    "Valore e variazione annua": "Level and annual change",
    "scostamenti": "divergences",
    "Distribuzione territoriale": "Territorial distribution",
    "territori selezionati": "selected territories",
    "Tabella filtrabile": "Filterable table",
    "dati pubblici": "public data",
    "Focus patrimonio": "Property focus",
    "Reati contro il patrimonio": "Property offences",
    "Furti, rapine, danneggiamenti e altri reati patrimoniali vanno letti separando volume, trend e territorio.": "Thefts, robberies, damages and other property offences should be read by separating volume, trend and territory.",
    "Principali reati patrimoniali": "Main property offences",
    "Italia e territorio": "Italy and territory",
    "Focus persona": "People focus",
    "Reati contro la persona e reati violenti": "Offences against the person and violent offences",
    "La sezione separa violenza contro la persona, rapine ed estorsioni dagli altri reati, senza sommare fenomeni non comparabili.": "This section separates violence against the person, robberies and extortion from other offences, without adding non-comparable phenomena.",
    "Violenti vs altri reati": "Violent vs other offences",
    "classificazione operativa": "operational classification",
    "Principali reati contro la persona": "Main offences against the person",
    "Scheda reato selezionato": "Selected offence profile",
    "territorio selezionato": "selected territory",
    "Focus omicidi": "Homicide focus",
    "Omicidi e categorie collegate": "Homicides and related categories",
    "La sezione separa omicidi volontari, colposi, stradali, preterintenzionali, tentati omicidi e altre voci disponibili, evitando somme improprie tra aggregati e sottocategorie.": "This section separates intentional, negligent, road and preterintentional homicides, attempted homicides and other available items, avoiding improper sums across aggregates and subcategories.",
    "Nota metodologica:": "Methodological note:",
    "il dato sugli omicidi volontari va letto come voce specifica della classificazione ISTAT. Le altre voci, come omicidi colposi, stradali, per rapina, di tipo mafioso, stragi e tentati omicidi, vanno lette affiancate: alcune possono essere aggregati, dettagli o fattispecie specifiche e non vanno sommate automaticamente per costruire un totale.": "the value for intentional homicides must be read as a specific ISTAT classification item. Other items, such as negligent homicides, road homicides, robbery-related homicides, mafia-type homicides, mass killings and attempted homicides, should be read side by side: some may be aggregates, details or specific legal categories and should not be automatically summed to build a total.",
    "Serie storica omicidi": "Homicide time series",
    "tipo selezionato": "selected type",
    "Tipo": "Type",
    "Suddivisione e geografia": "Breakdown and geography",
    "tipi o territori": "types or territories",
    "Tipo per ranking": "Type for ranking",
    "Vittime e autori registrati": "Registered victims and offenders",
    "Sesso": "Sex",
    "Età": "Age",
    "Eta": "Age",
    "Vista persone": "People view",
    "Autori, vittime e cittadinanza": "Offenders, victims and citizenship",
    "Chi commette i reati e chi sono le vittime": "Who commits offences and who the victims are",
    "Qui si distinguono autori registrati e vittime registrate. Il dettaglio caricato ora e nazionale; i livelli territoriali verranno mostrati quando saranno disponibili nel payload persone.": "This section separates registered offenders and registered victims. The currently loaded detail is national; territorial levels will be shown when available in the people payload.",
    "Caricamento dei dati persone...": "People data loading...",
    "Autori o vittime per cittadinanza": "Offenders or victims by citizenship",
    "ruolo selezionato": "selected role",
    "Identikit per sesso ed età": "Profile by sex and age",
    "Identikit per sesso ed eta": "Profile by sex and age",
    "quando disponibile": "when available",
    "Aree e reati in controtendenza": "Areas and offences moving against the trend",
    "Il filtro \"Scostamenti\" distingue territori che peggiorano mentre l'Italia migliora da territori che migliorano mentre l'Italia peggiora.": "The \"Divergences\" filter separates territories worsening while Italy improves from territories improving while Italy worsens.",
    "Controtendenze rispetto all'Italia": "Countertrends versus Italy",
    "variazioni annue": "annual changes",
    "Percezione e vittimizzazione": "Perception and victimization",
    "Percezione, vittimizzazione e denunce misurano cose diverse": "Perception, victimization and police reports measure different things",
    "La sezione chiarisce come leggere insieme fonti amministrative e indagini campionarie, senza trasformarle in un unico numero.": "This section explains how to read administrative sources and sample surveys together without turning them into a single number.",
    "Denunce registrate": "Registered reports",
    "Serie per anno, reato e territorio fino ai comuni capoluogo.": "Series by year, offence and territory down to provincial capitals.",
    "Confronti espliciti": "Explicit comparisons",
    "Il grafico aggiunge una seconda serie solo quando usi il filtro Confronta con.": "The chart adds a second series only when you use the Compare with filter.",
    "Benchmark Italia": "Italy benchmark",
    "Il confronto nazionale resta disponibile nelle serie principali quando scegli un territorio.": "The national comparison remains available in the main series when you choose a territory.",
    "Tassi per 100.000": "Rates per 100,000",
    "Usali per confrontare territori; i valori assoluti descrivono il volume registrato.": "Use them to compare territories; absolute values describe the registered volume.",
    "Autori e vittime": "Offenders and victims",
    "Sono persone registrate nelle fonti disponibili; quote e tassi su popolazione residente dipendono dalla misura scelta.": "These are people registered in the available sources; shares and resident-population rates depend on the selected measure.",
    "Italiani e stranieri vanno confrontati solo con denominatori coerenti per età, sesso e territorio.": "Italians and foreign nationals should be compared only with consistent denominators by age, sex and territory.",
    "Italiani e stranieri vanno confrontati solo con denominatori coerenti per eta, sesso e territorio.": "Italians and foreign nationals should be compared only with consistent denominators by age, sex and territory.",
    "Sono fenomeni diversi dalle denunce e vanno letti con fonti campionarie dedicate.": "These are phenomena different from police reports and should be read with dedicated survey sources.",
    "Delitti denunciati o accertati dalle Forze di polizia e trasmessi all'autorità giudiziaria. Sono la fonte più granulare per territorio, anno e tipo di reato.": "Crimes reported to or detected by police forces and forwarded to the judicial authority. This is the most granular source by territory, year and offence type.",
    "Delitti denunciati o accertati dalle Forze di polizia e trasmessi all'autorita giudiziaria. Sono la fonte piu granulare per territorio, anno e tipo di reato.": "Crimes reported to or detected by police forces and forwarded to the judicial authority. This is the most granular source by territory, year and offence type.",
    "Vittimizzazione": "Victimization",
    "Persone o famiglie che dichiarano di aver subito reati, comprese situazioni non denunciate. Aiuta a stimare il sommerso e la propensione alla denuncia.": "People or households reporting that they experienced offences, including unreported situations. It helps estimate hidden crime and reporting propensity.",
    "Sicurezza percepita": "Perceived safety",
    "Paura del crimine, rischio percepito e comportamenti di evitamento. Può muoversi in modo diverso rispetto alle denunce registrate.": "Fear of crime, perceived risk and avoidance behaviour. It can move differently from registered reports.",
    "Paura del crimine, rischio percepito e comportamenti di evitamento. Puo muoversi in modo diverso rispetto alle denunce registrate.": "Fear of crime, perceived risk and avoidance behaviour. It can move differently from registered reports.",
    "indagine campionaria": "sample survey",
    "Indicatore": "Indicator",
    "Dettaglio": "Detail",
    "Voce": "Item",
    "Voce / motivo": "Item / reason",
    "Periodo": "Period",
    "Reato dichiarato": "Reported offence",
    "Unità": "Unit",
    "Tutti i dettagli": "All details",
    "Tutti i periodi": "All periods",
    "Tutte le voci": "All items",
    "Tutte le unità": "All units",
    "Tutti i reati": "All offences",
    "Vittimizzazione dichiarata": "Reported victimization",
    "Indicatore / reato dichiarato": "Indicator / reported offence",
    "Come leggere questa parte": "How to read this section",
    "Domanda": "Question",
    "Quanti delitti risultano registrati?": "How many crimes are registered?",
    "Quante persone dichiarano di averne subiti?": "How many people say they experienced them?",
    "Quanto le persone si sentono insicure?": "How unsafe do people feel?",
    "Unità": "Unit",
    "Unita": "Unit",
    "Denunce o delitti registrati": "Reports or registered crimes",
    "Persone/famiglie intervistate": "Interviewed people/households",
    "Opinioni e comportamenti dichiarati": "Stated opinions and behaviours",
    "Uso corretto": "Correct use",
    "Serie territoriali e confronto tra reati": "Territorial series and comparison across offences",
    "Sommerso e profilo delle vittime": "Hidden crime and victim profiles",
    "Paura, evitamento e fiducia nello spazio pubblico": "Fear, avoidance and confidence in public space",
    "Fonti di contesto": "Context sources",
    "Propensione alla denuncia": "Reporting propensity",
    "Dati e metodologia": "Data and methodology",
    "Fonti, definizioni e limiti": "Sources, definitions and limits",
    "Note rapide per leggere correttamente denunce, territori, autori, vittime e confronti per cittadinanza.": "Quick notes for correctly reading reports, territories, offenders, victims and citizenship comparisons.",
    "Note metodologiche": "Methodological notes",
    "Fonti": "Sources",
    "Note rapide di lettura": "Quick reading notes",
    "Nota su truffe e frodi:": "Note on scams and fraud:",
    "Nota sugli omicidi:": "Note on homicides:",
    "Italia": "Italy",
    "Regioni": "Regions",
    "Province": "Provinces",
    "Comuni capoluogo": "Provincial capitals",
    "Autori / denunciati": "Offenders / reported persons",
    "Vittime": "Victims",
    "Ruolo non classificato": "Unclassified role",
    "Totale cittadinanza": "Total citizenship",
    "Stranieri / immigrati": "Foreign nationals / immigrants",
    "Italiani / non immigrati": "Italians / non-immigrants",
    "Non residenti": "Non-residents",
    "Non classificato": "Unclassified",
    "Totale reati denunciati": "Total reported offences",
    "Furti": "Thefts",
    "Scippi": "Snatch thefts",
    "Borseggi": "Pickpocketing",
    "Furti in abitazione": "Residential burglaries",
    "Furti in esercizi commerciali": "Shop thefts",
    "Furti di opere d'arte": "Art thefts",
    "Furti di autovetture": "Car thefts",
    "Furti di ciclomotori": "Moped thefts",
    "Furti di motocicli": "Motorcycle thefts",
    "Furti di autocarri": "Truck thefts",
    "Furti su veicoli": "Thefts from vehicles",
    "Rapine": "Robberies",
    "Rapine in banca": "Bank robberies",
    "Rapine in uffici postali": "Post-office robberies",
    "Rapine in esercizi commerciali": "Commercial robberies",
    "Rapine in pubblica via": "Street robberies",
    "Rapine in abitazione": "Home robberies",
    "Omicidi per rapina": "Robbery-related homicides",
    "Omicidi volontari": "Intentional homicides",
    "Tentati omicidi": "Attempted homicides",
    "Omicidi di tipo mafioso": "Mafia-type homicides",
    "Omicidi stradali": "Road homicides",
    "Omicidi colposi": "Negligent homicides",
    "Omicidi preterintenzionali": "Preterintentional homicides",
    "Stragi": "Mass killings",
    "Omicidi con finalita terroristica": "Terrorism-related homicides",
    "Omicidi con finalità terroristica": "Terrorism-related homicides",
    "Infanticidi": "Infanticides",
    "Violenze sessuali": "Sexual violence",
    "Violenze sessuali su minori": "Sexual violence against minors",
    "Sequestri di persona": "Kidnappings",
    "Attentati": "Attacks",
    "Lesioni colpose": "Negligent injuries",
    "Estorsioni": "Extortion",
    "Stupefacenti": "Drug offences",
    "Delitti informatici": "Cybercrime",
    "Truffe e frodi informatiche": "Scams and computer fraud",
    "Riciclaggio": "Money laundering",
    "Usura": "Usury",
    "Danneggiamenti": "Damage",
    "Danneggiamenti seguiti da incendio": "Damage followed by fire",
    "Incendi": "Fires",
    "Incendi boschivi": "Forest fires",
    "Minacce": "Threats",
    "Percosse": "Assaults",
    "Prostituzione": "Prostitution",
    "Pornografia": "Pornography",
    "Corruzione di minorenni": "Corruption of minors",
    "Contraffazione": "Counterfeiting",
    "Contrabbando": "Smuggling",
    "Violazioni della proprieta intellettuale": "Intellectual-property violations",
    "Violazioni della proprietà intellettuale": "Intellectual-property violations",
    "Ricettazione": "Receiving stolen goods",
    "Associazione per delinquere": "Criminal association",
    "Associazione mafiosa": "Mafia association",
    "Altri reati": "Other offences",
    "Tutte le categorie": "All categories",
    "Violenza contro la persona": "Violence against the person",
    "Reati predatori": "Predatory offences",
    "Economici e digitali": "Economic and digital offences",
    "Criminalita organizzata": "Organized crime",
    "Criminalità organizzata": "Organized crime",
    "Valori assoluti": "Absolute values",
    "Tassi per 100.000 abitanti": "Rates per 100,000 inhabitants",
    "Tassi per 1.000 abitanti": "Rates per 1,000 inhabitants",
    "Tasso per 100.000 abitanti": "Rate per 100,000 inhabitants",
    "Tasso per 1.000 abitanti": "Rate per 1,000 inhabitants",
    "Indice primo anno = 100": "Index, first year = 100",
    "Media mobile triennale": "Three-year moving average",
    "Variazione % annua": "Annual % change",
    "Quota % del grafico": "Share of chart (%)",
    "Tutte le controtendenze": "All countertrends",
    "Peggiora mentre Italia migliora": "Worsens while Italy improves",
    "Migliora mentre Italia peggiora": "Improves while Italy worsens",
    "Categorie di reato": "Offence categories",
    "Singoli reati": "Individual offences",
    "Quota percentuale": "Percentage share",
    "Aumenti e diminuzioni": "Increases and decreases",
    "Solo aumenti": "Increases only",
    "Solo diminuzioni": "Decreases only",
    "Tutte": "All",
    "Tutti": "All",
    "Almeno 5%": "At least 5%",
    "Almeno 10%": "At least 10%",
    "Almeno 20%": "At least 20%",
    "Almeno 50%": "At least 50%",
    "Volontari": "Intentional",
    "Colposi": "Negligent",
    "Preterintenzionali": "Preterintentional",
    "Stradali": "Road",
    "Tentati": "Attempted",
    "Tipo mafioso": "Mafia-type",
    "Per rapina": "Robbery-related",
    "Finalita terroristica": "Terrorism-related",
    "Omicidi colposi (aggregato)": "Negligent homicides (aggregate)",
    "Omicidi stradali (voce specifica)": "Road homicides (specific item)",
    "Suddivisione per tipo": "Breakdown by type",
    "Cittadinanza": "Citizenship",
    "Eta": "Age",
    "Sesso ed eta": "Sex and age",
    "Sesso ed età": "Sex and age",
    "Tipo di omicidio": "Type of homicide",
    "Si sente sicuro uscendo al buio": "Feels safe going out after dark",
    "Evita luoghi ritenuti a rischio": "Avoids places perceived as risky",
    "Non esce per paura": "Does not go out because of fear",
    "Reati personali contro la proprieta": "Personal property offences",
    "Reati personali contro la proprietà": "Personal property offences",
    "Furti in abitazione principale": "Main-home burglaries",
    "Tutti i reati della categoria": "All offences in the category",
    "Nessun confronto": "No comparison",
    "Nessun anno precedente": "No previous year",
    "Tutti gli indicatori": "All indicators",
    "Delitti denunciati": "Reported crimes",
    "Tasso per 100.000": "Rate per 100,000",
    "Tasso per 1.000": "Rate per 1,000",
    "Indice": "Index",
    "Quota": "Share",
    "Valore": "Value",
    "Valore assoluto": "Absolute value",
    "Anno confronto": "Comparison year",
    "Anno finale": "Final year",
    "Variazione assoluta": "Absolute change",
    "Variazione %": "% change",
    "Var. annua": "Annual change",
    "Reato/categoria": "Offence/category",
    "Codice": "Code",
    "Nota:": "Note:",
    "Fonte": "Source",
    "Uomini": "Men",
    "Donne": "Women",
    "Totale": "Total",
    "Tutte le età": "All ages",
    "Tutte le eta": "All ages",
    "sesso ed età": "sex and age",
    "Sesso ed età non risultano nel perimetro selezionato.": "Sex and age are not available in the selected scope.",
    "Il grafico verrà caricato quando arrivi a questa sezione.": "This chart will load when you reach this section.",
    "Non riesco a calcolare il tasso per i filtri selezionati perché manca la popolazione del territorio e anno corrispondenti. Usa valori assoluti o quota %.": "The selected rate cannot be calculated because the matching population for territory and year is missing. Use absolute values or chart share.",
    " perché manca la popolazione del territorio e anno corrispondenti.": " because the matching population for territory and year is missing.",
    "voce specifica: può non essere sommabile agli aggregati": "specific item: it may not be additive with aggregates",
    "Fino a 13 anni": "Up to 13 years",
    "65 anni e oltre": "65 years and over",
    "eta n.d.": "age n/a",
    "ruolo n.d.": "role n/a",
    "cittadinanza n.d.": "citizenship n/a",
    "n.d.": "n/a"
  };
  var originalDashboardText = new WeakMap();
  var CHART_IDS = [
    "siTrendChart", "siCompositionChart", "siContributionChart", "siRankingChart", "siScatterChart",
    "siTreemapChart", "siPropertyFocusChart", "siViolentChart", "siPersonFocusChart", "siCrimeChart",
    "siHomicideTrendChart", "siHomicideStructureChart", "siHomicidePeopleChart",
    "siPeopleChart", "siDemographyChart", "siCounterChart", "siPerceptionChart", "siVictimizationChart", "siReportingChart"
  ];
  var CONTROL_BLOCK_IDS = CHART_IDS.concat(["siTerritoryTable"]);
  var CHART_FILTER_KEYS = [
    "year", "level", "region", "province", "territory", "compareTerritory", "theme", "crime", "measure",
    "peopleMeasure", "role", "citizenship", "counterDirection", "compositionMode", "compositionMetric",
    "comparisonYear", "contributionDirection", "contributionThreshold",
    "surveyPerceptionIndicator", "surveyPerceptionDimension", "surveyPerceptionResponse", "surveyPerceptionPeriod",
    "surveyVictimizationIndicator", "surveyVictimizationDimension", "surveyVictimizationCrime",
    "surveyVictimizationResponse", "surveyVictimizationUnit", "surveyVictimizationPeriod",
    "surveyReportingIndicator", "surveyReportingDimension", "surveyReportingCrime", "surveyReportingResponse",
    "surveyReportingPeriod", "homicideType", "homicideStructureView", "homicidePeopleBreakdown",
    "homicideSex", "homicideAgeGroup", "search"
  ];

  var STATE = {
    meta: {},
    records: [],
    populationRecords: [],
    surveyRecords: [],
    chartStates: {},
    year: null,
    level: "regional",
    region: "all",
    province: "all",
    territory: "all",
    compareTerritory: "all",
    theme: "all",
    crime: "TOT",
    measure: "absolute",
    peopleMeasure: "absolute",
    role: "offender",
    citizenship: "totale_cittadinanza",
    counterDirection: "all",
    compositionMode: "themes",
    compositionMetric: "share",
    comparisonYear: null,
    contributionDirection: "all",
    contributionThreshold: 5,
    surveyPerceptionIndicator: SURVEY_DEFAULTS.perception.indicator,
    surveyPerceptionDimension: SURVEY_DEFAULTS.perception.dimension,
    surveyPerceptionResponse: SURVEY_DEFAULTS.perception.response,
    surveyPerceptionPeriod: "all",
    surveyVictimizationIndicator: SURVEY_DEFAULTS.victimization.indicator,
    surveyVictimizationDimension: SURVEY_DEFAULTS.victimization.dimension,
    surveyVictimizationCrime: "all",
    surveyVictimizationResponse: SURVEY_DEFAULTS.victimization.response,
    surveyVictimizationUnit: SURVEY_DEFAULTS.victimization.unit,
    surveyVictimizationPeriod: SURVEY_DEFAULTS.victimization.period,
    surveyReportingIndicator: SURVEY_DEFAULTS.reporting_propensity.indicator,
    surveyReportingDimension: SURVEY_DEFAULTS.reporting_propensity.dimension,
    surveyReportingCrime: "all",
    surveyReportingResponse: SURVEY_DEFAULTS.reporting_propensity.response,
    surveyReportingPeriod: SURVEY_DEFAULTS.reporting_propensity.period,
    homicideType: "INTENHOM",
    homicideStructureView: "breakdown",
    homicidePeopleBreakdown: "sex_age",
    homicideSex: "all",
    homicideAgeGroup: "all",
    search: "",
    populationLoaded: false,
    peopleLoaded: false,
    surveyLoaded: false,
    fullReportedLoaded: false,
    loadedReportedLevels: {},
    loadingReportedLevels: {},
    visibleCharts: {}
  };

  var MAIN_CONTROL_BY_NAME = {
    year: "siYear",
    level: "siLevel",
    region: "siRegion",
    province: "siProvince",
    territory: "siTerritory",
    theme: "siTheme",
    crime: "siCrime",
    measure: "siMeasure",
    role: "siRole",
    citizenship: "siCitizenship",
    counterDirection: "siCounterDirection"
  };

  var els = {};

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("resize", debounce(renderCharts, 180));
  window.addEventListener("themechange", renderCharts);
  window.addEventListener("site-language-change", function () {
    translateDashboardStatic();
    if (STATE.records.length) {
      renderMetaBlocks();
      renderAll();
    }
  });

  function init() {
    [
      "siStatus", "siTopRecap", "siYear", "siLevel", "siRegion", "siProvince", "siTerritory", "siTheme", "siCrime",
      "siMeasure", "siRole", "siCitizenship", "siCounterDirection", "siSearch", "siReset", "siCoverage",
      "siTrendTag", "siCompositionTag", "siContributionTag", "siRankingTag", "siScatterTag",
      "siTreemapTag", "siTableTag", "siPropertyTag", "siViolentTag", "siPersonFocusTag", "siCrimeTag", "siPeopleTag",
      "siDemographyTag", "siCounterTag", "siTerritoryTable", "siCounterTable", "siPeopleNotice",
      "siMethodNotes", "siSourceList", "siPlannedSourceList", "siPropertyFocusChart", "siPersonFocusChart",
      "siHomicideTrendTag", "siHomicideStructureTag", "siHomicidePeopleTag",
      "siPerceptionTag", "siVictimizationTag", "siReportingTag"
    ].forEach(function (id) {
      els[id] = document.getElementById(id);
    });

    bindControls();
    setupLazyCharts();
    translateDashboardStatic();
    loadData();
  }

  function currentLanguage() {
    if (window.SiteLanguage && window.SiteLanguage.get) return window.SiteLanguage.get();
    try {
      var language = new URLSearchParams(window.location.search).get("lang");
      if (language === "en") return "en";
      language = localStorage.getItem("siteLanguage");
      if (language === "en") return "en";
    } catch (error) {}
    return document.documentElement.lang === "en" ? "en" : "it";
  }

  function isEnglish() {
    return currentLanguage() === "en";
  }

  function ui(italian, english) {
    return isEnglish() ? english : italian;
  }

  function tr(value) {
    if (!isEnglish()) return value;
    var key = String(value === null || value === undefined ? "" : value).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
    if (!key) return value;
    if (TEXT_EN[key]) return preserveSpacing(value, TEXT_EN[key]);
    if (window.SiteLanguage && window.SiteLanguage.t) return window.SiteLanguage.t(value);
    return value;
  }

  function preserveSpacing(original, translated) {
    var text = String(original);
    var leading = (text.match(/^\s*/) || [""])[0];
    var trailing = (text.match(/\s*$/) || [""])[0];
    return leading + translated + trailing;
  }

  function translateDashboardStatic() {
    var root = document.querySelector(".si-dashboard");
    if (!root || !window.NodeFilter) return;
    document.title = ui("Sicurezza in Italia | Nazareno Lecis", "Security in Italy | Nazareno Lecis");
    var meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", ui(
        "Dashboard sulla sicurezza in Italia: criminalità registrata, territori, reati, autori, vittime, cittadinanza, trend, fonti e metodologia.",
        "Dashboard on security in Italy: reported crime, territories, offences, offenders, victims, citizenship, trends, sources and methodology."
      ));
    }
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentElement;
        if (!parent || parent.closest("script,style,noscript,svg,canvas,.js-plotly-plot,.plot-container,.svg-container")) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (!originalDashboardText.has(node)) originalDashboardText.set(node, node.nodeValue);
      var original = originalDashboardText.get(node);
      var next = isEnglish() ? tr(original) : original;
      if (node.nodeValue !== next) node.nodeValue = next;
    });
    if (els.siSearch) {
      els.siSearch.setAttribute("placeholder", ui("Reato, codice o territorio", "Offence, code or territory"));
    }
  }

  function bindControls() {
    onChange(els.siYear, function () { STATE.year = numberOrNull(els.siYear.value); renderAll(); });
    onChange(els.siLevel, function () {
      setLevel(els.siLevel.value);
    });
    onChange(els.siRegion, function () { setRegion(els.siRegion.value); });
    onChange(els.siProvince, function () { setProvince(els.siProvince.value); });
    onChange(els.siTerritory, function () { STATE.territory = els.siTerritory.value; renderAll(); });
    onChange(els.siTheme, function () {
      setTheme(els.siTheme.value);
    });
    onChange(els.siCrime, function () { STATE.crime = els.siCrime.value; renderAll(); });
    onChange(els.siMeasure, function () { STATE.measure = els.siMeasure.value; renderAll(); });
    onChange(els.siRole, function () { STATE.role = els.siRole.value; renderAll(); });
    onChange(els.siCitizenship, function () { STATE.citizenship = els.siCitizenship.value; renderAll(); });
    onChange(els.siCounterDirection, function () { STATE.counterDirection = els.siCounterDirection.value; renderAll(); });
    if (els.siSearch) {
      els.siSearch.addEventListener("input", function () {
        var tableState = getChartState("siTerritoryTable");
        tableState.search = els.siSearch.value.trim().toLowerCase();
        renderTerritoryTableBlock();
      });
    }
    bindChartControls();
    if (els.siReset) els.siReset.addEventListener("click", function () {
      STATE.year = latestYear();
      STATE.level = "regional";
      STATE.region = "all";
      STATE.province = "all";
      STATE.territory = "all";
      STATE.compareTerritory = "all";
      STATE.theme = "all";
      STATE.crime = "TOT";
      STATE.measure = "absolute";
      STATE.peopleMeasure = "absolute";
      STATE.role = "offender";
      STATE.citizenship = "totale_cittadinanza";
      STATE.counterDirection = "all";
      STATE.compositionMode = "themes";
      STATE.compositionMetric = "share";
      STATE.comparisonYear = null;
      STATE.contributionDirection = "all";
      STATE.contributionThreshold = 5;
      STATE.surveyPerceptionIndicator = SURVEY_DEFAULTS.perception.indicator;
      STATE.surveyPerceptionDimension = SURVEY_DEFAULTS.perception.dimension;
      STATE.surveyPerceptionResponse = SURVEY_DEFAULTS.perception.response;
      STATE.surveyPerceptionPeriod = "all";
      STATE.surveyVictimizationIndicator = SURVEY_DEFAULTS.victimization.indicator;
      STATE.surveyVictimizationDimension = SURVEY_DEFAULTS.victimization.dimension;
      STATE.surveyVictimizationCrime = "all";
      STATE.surveyVictimizationResponse = SURVEY_DEFAULTS.victimization.response;
      STATE.surveyVictimizationUnit = SURVEY_DEFAULTS.victimization.unit;
      STATE.surveyVictimizationPeriod = SURVEY_DEFAULTS.victimization.period;
      STATE.surveyReportingIndicator = SURVEY_DEFAULTS.reporting_propensity.indicator;
      STATE.surveyReportingDimension = SURVEY_DEFAULTS.reporting_propensity.dimension;
      STATE.surveyReportingCrime = "all";
      STATE.surveyReportingResponse = SURVEY_DEFAULTS.reporting_propensity.response;
      STATE.surveyReportingPeriod = SURVEY_DEFAULTS.reporting_propensity.period;
      STATE.homicideType = "INTENHOM";
      STATE.homicideStructureView = "breakdown";
      STATE.homicidePeopleBreakdown = "sex_age";
      STATE.homicideSex = "all";
      STATE.homicideAgeGroup = "all";
      STATE.search = "";
      STATE.chartStates = {};
      if (els.siSearch) els.siSearch.value = "";
      renderAll();
    });
  }

  function defaultChartState(chartId) {
    var defaults = {
      year: latestYear(),
      level: "regional",
      region: "all",
      province: "all",
      territory: "all",
      compareTerritory: "all",
      theme: "all",
      crime: "TOT",
      measure: "absolute",
      peopleMeasure: "absolute",
      role: "offender",
      citizenship: "totale_cittadinanza",
      counterDirection: "all",
      compositionMode: "themes",
      compositionMetric: "share",
      comparisonYear: null,
      contributionDirection: "all",
      contributionThreshold: 5,
      surveyPerceptionIndicator: SURVEY_DEFAULTS.perception.indicator,
      surveyPerceptionDimension: SURVEY_DEFAULTS.perception.dimension,
      surveyPerceptionResponse: SURVEY_DEFAULTS.perception.response,
      surveyPerceptionPeriod: "all",
      surveyVictimizationIndicator: SURVEY_DEFAULTS.victimization.indicator,
      surveyVictimizationDimension: SURVEY_DEFAULTS.victimization.dimension,
      surveyVictimizationCrime: "all",
      surveyVictimizationResponse: SURVEY_DEFAULTS.victimization.response,
      surveyVictimizationUnit: SURVEY_DEFAULTS.victimization.unit,
      surveyVictimizationPeriod: SURVEY_DEFAULTS.victimization.period,
      surveyReportingIndicator: SURVEY_DEFAULTS.reporting_propensity.indicator,
      surveyReportingDimension: SURVEY_DEFAULTS.reporting_propensity.dimension,
      surveyReportingCrime: "all",
      surveyReportingResponse: SURVEY_DEFAULTS.reporting_propensity.response,
      surveyReportingPeriod: SURVEY_DEFAULTS.reporting_propensity.period,
      homicideType: "INTENHOM",
      homicideStructureView: "breakdown",
      homicidePeopleBreakdown: "sex_age",
      homicideSex: "all",
      homicideAgeGroup: "all",
      search: ""
    };
    if (chartId === "siTrendChart" || chartId === "siHomicideTrendChart") defaults.level = "national";
    if (chartId === "siHomicideStructureChart") {
      defaults.level = "national";
      defaults.homicideStructureView = "breakdown";
    }
    if (chartId === "siCounterChart") {
      defaults.level = "regional";
      defaults.counterDirection = "all";
    }
    return defaults;
  }

  function getChartState(chartId) {
    var id = chartId || "global";
    if (!STATE.chartStates[id]) STATE.chartStates[id] = defaultChartState(id);
    if (!isFiniteNumber(STATE.chartStates[id].year)) STATE.chartStates[id].year = latestYear();
    return STATE.chartStates[id];
  }

  function snapshotChartFilterState() {
    var snapshot = {};
    CHART_FILTER_KEYS.forEach(function (key) {
      snapshot[key] = STATE[key];
    });
    return snapshot;
  }

  function applyFilterStateToGlobal(filterState) {
    CHART_FILTER_KEYS.forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(filterState, key)) STATE[key] = filterState[key];
    });
  }

  function captureGlobalFilterState(filterState) {
    CHART_FILTER_KEYS.forEach(function (key) {
      filterState[key] = STATE[key];
    });
  }

  function withChartState(chartId, fn) {
    var state = getChartState(chartId);
    var original = snapshotChartFilterState();
    applyFilterStateToGlobal(state);
    try {
      var result = fn(state);
      captureGlobalFilterState(state);
      return result;
    } finally {
      applyFilterStateToGlobal(original);
    }
  }

  function setupLazyCharts() {
    if (!("IntersectionObserver" in window)) {
      CHART_IDS.forEach(function (id) { STATE.visibleCharts[id] = true; });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        STATE.visibleCharts[entry.target.id] = true;
        renderChartById(entry.target.id);
      });
    }, { rootMargin: "700px 0px" });
    CHART_IDS.forEach(function (id) {
      var chart = document.getElementById(id);
      if (chart) observer.observe(chart);
    });
  }

  function setLevel(value) {
    STATE.level = value;
    STATE.territory = "all";
    STATE.compareTerritory = "all";
    if (STATE.level === "national") {
      STATE.region = "all";
      STATE.province = "all";
    }
    if (STATE.level === "regional") STATE.province = "all";
    renderAll();
  }

  function setRegion(value) {
    STATE.region = value;
    STATE.province = "all";
    STATE.territory = "all";
    STATE.compareTerritory = "all";
    renderAll();
  }

  function setProvince(value) {
    STATE.province = value;
    STATE.territory = "all";
    STATE.compareTerritory = "all";
    renderAll();
  }

  function setTheme(value) {
    STATE.theme = value;
    STATE.crime = STATE.theme === "all" ? "TOT" : "all";
    renderAll();
  }

  function bindChartControls() {
    document.querySelectorAll("[data-si-control]").forEach(function (control) {
      control.addEventListener("change", function () {
        var blockId = chartIdForControl(control);
        withChartState(blockId, function () {
          applyControlValue(control.getAttribute("data-si-control"), control.value);
        });
        renderControlBlock(blockId);
      });
    });
  }

  function applyControlValue(name, value) {
    if (name === "year") STATE.year = numberOrNull(value);
    if (name === "level") {
      STATE.level = value;
      STATE.territory = "all";
      STATE.compareTerritory = "all";
      if (STATE.level === "national") {
        STATE.region = "all";
        STATE.province = "all";
      }
      if (STATE.level === "regional") STATE.province = "all";
      return;
    }
    if (name === "region") {
      STATE.region = value;
      STATE.province = "all";
      STATE.territory = "all";
      STATE.compareTerritory = "all";
      return;
    }
    if (name === "province") {
      STATE.province = value;
      STATE.territory = "all";
      STATE.compareTerritory = "all";
      return;
    }
    if (name === "territory") STATE.territory = value;
    if (name === "compareTerritory") STATE.compareTerritory = value;
    if (name === "theme") {
      STATE.theme = value;
      STATE.crime = STATE.theme === "all" ? "TOT" : "all";
      return;
    }
    if (name === "crime") STATE.crime = value;
    if (name === "measure") STATE.measure = value;
    if (name === "peopleMeasure") STATE.peopleMeasure = value;
    if (name === "role") STATE.role = value;
    if (name === "citizenship") STATE.citizenship = value;
    if (name === "counterDirection") STATE.counterDirection = value;
    if (name === "compositionMode") STATE.compositionMode = value;
    if (name === "compositionMetric") STATE.compositionMetric = value;
    if (name === "comparisonYear") STATE.comparisonYear = numberOrNull(value);
    if (name === "contributionDirection") STATE.contributionDirection = value;
    if (name === "contributionThreshold") STATE.contributionThreshold = numberOrNull(value);
    if (name === "surveyPerceptionIndicator") STATE.surveyPerceptionIndicator = value;
    if (name === "surveyPerceptionDimension") STATE.surveyPerceptionDimension = value;
    if (name === "surveyPerceptionResponse") STATE.surveyPerceptionResponse = value;
    if (name === "surveyPerceptionPeriod") STATE.surveyPerceptionPeriod = value;
    if (name === "surveyVictimizationIndicator") STATE.surveyVictimizationIndicator = value;
    if (name === "surveyVictimizationDimension") STATE.surveyVictimizationDimension = value;
    if (name === "surveyVictimizationCrime") STATE.surveyVictimizationCrime = value;
    if (name === "surveyVictimizationResponse") STATE.surveyVictimizationResponse = value;
    if (name === "surveyVictimizationUnit") STATE.surveyVictimizationUnit = value;
    if (name === "surveyVictimizationPeriod") STATE.surveyVictimizationPeriod = value;
    if (name === "surveyReportingIndicator") STATE.surveyReportingIndicator = value;
    if (name === "surveyReportingDimension") STATE.surveyReportingDimension = value;
    if (name === "surveyReportingCrime") STATE.surveyReportingCrime = value;
    if (name === "surveyReportingResponse") STATE.surveyReportingResponse = value;
    if (name === "surveyReportingPeriod") STATE.surveyReportingPeriod = value;
    if (name === "homicideType") STATE.homicideType = value;
    if (name === "homicideStructureView") STATE.homicideStructureView = value;
    if (name === "homicidePeopleBreakdown") STATE.homicidePeopleBreakdown = value;
    if (name === "homicideSex") STATE.homicideSex = value;
    if (name === "homicideAgeGroup") STATE.homicideAgeGroup = value;
  }

  function loadData() {
    setStatus(ui("Caricamento metadati sicurezza ...", "Loading security metadata ..."));
    loadJavascriptPayload("dashboard_metadata.js", PAYLOAD_GLOBALS.metadata).then(function (payload) {
      STATE.meta = (payload && payload.meta) || {};
      STATE.year = latestYear();
      STATE.chartStates = {};
      renderMetaBlocks();
      populateAllControlBlocks();
      setStatus(ui("Caricamento dati nazionali e regionali ...", "Loading national and regional data ..."));
      return Promise.all([ensureReportedLevels(["national", "regional"]), loadPopulationData()]);
    }).then(function () {
      renderAll();
      setStatus(ui(
        "Dati reati caricati: " + formatInteger(reportedRows().length) + " righe iniziali, anni " + yearRangeLabel() + ". Province e capoluoghi si caricano quando selezionati; profili persone in caricamento...",
        "Crime data loaded: " + formatInteger(reportedRows().length) + " initial rows, years " + yearRangeLabel() + ". Provinces and provincial capitals load when selected; people profiles are loading..."
      ));
      loadPeopleData();
      loadSurveyData();
    }).catch(function (error) {
      setStatus(ui("Errore nel caricamento dati: ", "Error loading data: ") + error.message, "error");
      renderError();
    });
  }

  function loadPeopleData() {
    loadJavascriptPayload("dashboard_people.js", PAYLOAD_GLOBALS.people).then(function (payload) {
      var people = decodeColumnPayload(payload, "people");
      STATE.records = reportedRows().concat(people);
      STATE.peopleLoaded = true;
      populateAllControlBlocks();
      renderCoverage();
      renderPeopleNotice();
      renderCharts();
      setStatus(ui(
        "Dati caricati: " + formatInteger(reportedRows().length) + " righe reati e " + formatInteger(peopleRows().length) + " righe persone, anni " + yearRangeLabel() + ".",
        "Data loaded: " + formatInteger(reportedRows().length) + " crime rows and " + formatInteger(peopleRows().length) + " people rows, years " + yearRangeLabel() + "."
      ));
    }).catch(function () {
      STATE.peopleLoaded = false;
      renderCoverage();
      renderPeopleNotice();
      emptyChart("siPeopleChart", ui("Dati persone non disponibili in questo momento.", "People data are not available at the moment."));
      emptyChart("siDemographyChart", ui("Dati persone non disponibili in questo momento.", "People data are not available at the moment."));
      emptyChart("siHomicidePeopleChart", ui("Dati autori/vittime non disponibili in questo momento.", "Offender/victim data are not available at the moment."));
      setStatus(ui(
        "Dati reati caricati: " + formatInteger(reportedRows().length) + " righe, anni " + yearRangeLabel() + ". Profili persone non disponibili.",
        "Crime data loaded: " + formatInteger(reportedRows().length) + " rows, years " + yearRangeLabel() + ". People profiles are not available."
      ));
    });
  }

  function loadSurveyData() {
    loadJavascriptPayload("dashboard_survey.js", PAYLOAD_GLOBALS.survey).then(function (payload) {
      STATE.surveyRecords = decodeColumnPayload(payload, "survey");
      STATE.surveyLoaded = true;
      populateAllControlBlocks();
      renderCharts();
    }).catch(function () {
      STATE.surveyRecords = [];
      STATE.surveyLoaded = false;
      emptyChart("siPerceptionChart", ui("Dati campionari non disponibili in questo momento.", "Sample-survey data are not available at the moment."));
      emptyChart("siVictimizationChart", ui("Dati campionari non disponibili in questo momento.", "Sample-survey data are not available at the moment."));
      emptyChart("siReportingChart", ui("Dati sulla propensione alla denuncia non disponibili in questo momento.", "Reporting-propensity data are not available at the moment."));
    });
  }

  function loadPopulationData() {
    return loadJavascriptPayload("dashboard_population.js", PAYLOAD_GLOBALS.population, POPULATION_DATA_BASES).then(function (payload) {
      STATE.populationRecords = decodeColumnPayload(payload, "population");
      STATE.populationLoaded = true;
      return true;
    }).catch(function () {
      STATE.populationRecords = [];
      STATE.populationLoaded = false;
      return true;
    });
  }

  function loadJavascriptPayload(fileName, globalName, bases) {
    var index = 0;
    var sourceBases = bases || DATA_BASES;
    function tryNext() {
      if (index >= sourceBases.length) return Promise.reject(new Error(ui("payload non disponibile: ", "payload unavailable: ") + fileName));
      var url = sourceBases[index] + fileName + "?v=" + VERSION;
      index += 1;
      window[globalName] = null;
      return new Promise(function (resolve, reject) {
        var script = document.createElement("script");
        script.async = true;
        script.src = url;
        script.onload = function () {
          script.remove();
          if (window[globalName]) {
            resolve(window[globalName]);
            return;
          }
          reject(new Error(ui("payload JavaScript senza dati", "JavaScript payload has no data")));
        };
        script.onerror = function () {
          script.remove();
          reject(new Error(ui("script non disponibile", "script unavailable")));
        };
        document.head.appendChild(script);
      }).catch(tryNext);
    }
    return tryNext();
  }

  function ensureReportedLevels(levels) {
    var wanted = unique(["national"].concat(levels || [])).filter(function (level) {
      return Boolean(REPORTED_LEVEL_PAYLOADS[level]);
    });
    return Promise.all(wanted.map(loadReportedLevel)).then(function () {
      return true;
    });
  }

  function loadReportedLevel(level) {
    if (STATE.loadedReportedLevels[level]) return Promise.resolve(true);
    if (STATE.loadingReportedLevels[level]) return STATE.loadingReportedLevels[level];
    var payload = REPORTED_LEVEL_PAYLOADS[level];
    if (!payload) return Promise.reject(new Error(ui("livello territoriale non gestito: ", "unsupported territorial level: ") + level));

    STATE.loadingReportedLevels[level] = loadJavascriptPayload(payload.file, payload.global).then(function (data) {
      var rows = decodeColumnPayload(data, "reported_crimes");
      STATE.records = STATE.records.concat(rows);
      STATE.loadedReportedLevels[level] = true;
      delete STATE.loadingReportedLevels[level];
      return true;
    }).catch(function (error) {
      delete STATE.loadingReportedLevels[level];
      if (STATE.fullReportedLoaded) throw error;
      return loadFullReportedPayload();
    });
    return STATE.loadingReportedLevels[level];
  }

  function loadFullReportedPayload() {
    if (STATE.fullReportedLoaded) return Promise.resolve(true);
    return loadJavascriptPayload("dashboard_reported_crimes.js", PAYLOAD_GLOBALS.reported).then(function (payload) {
      var rows = decodeColumnPayload(payload, "reported_crimes");
      STATE.records = STATE.records.filter(function (row) {
        return row.indicator_group !== "reported_crimes";
      }).concat(rows);
      unique(rows.map(function (row) { return row.territory_level; })).forEach(function (level) {
        STATE.loadedReportedLevels[level] = true;
      });
      STATE.fullReportedLoaded = true;
      return true;
    });
  }

  function missingReportedLevelsForCurrentView() {
    return requiredReportedLevels().filter(function (level) {
      return !STATE.loadedReportedLevels[level];
    });
  }

  function requiredReportedLevels() {
    return unique(["national", STATE.level]).filter(function (level) {
      return Boolean(REPORTED_LEVEL_PAYLOADS[level]);
    });
  }

  function missingReportedLevelsForAllControlBlocks() {
    var levels = [];
    CONTROL_BLOCK_IDS.forEach(function (blockId) {
      var state = getChartState(blockId);
      levels.push("national");
      levels.push(state.level);
    });
    return unique(levels).filter(function (level) {
      return Boolean(REPORTED_LEVEL_PAYLOADS[level]) && !STATE.loadedReportedLevels[level];
    });
  }

  function renderDeferredLevelLoading(missing) {
    setStatus(ui("Caricamento dati ", "Loading ") + missing.map(levelLabel).join(", ") + " ...");
  }

  function decodeColumnPayload(payload, groupName) {
    if (!payload) return [];
    if (payload.records) return payload.records.map(normalizeRecord);
    var columns = payload.columns || [];
    return (payload.rows || []).map(function (values) {
      var row = { indicator_group: groupName || payload.indicator_group || "" };
      columns.forEach(function (column, index) {
        row[column] = values[index];
      });
      return normalizeRecord(row);
    });
  }

  function normalizeRecord(row) {
    row.year = numberOrNull(row.year);
    row.value = numberOrNull(row.value);
    row.population = numberOrNull(row.population);
    row.value_rate_per_100k = numberOrNull(row.value_rate_per_100k);
    row.change_abs_yoy = numberOrNull(row.change_abs_yoy);
    row.change_pct_yoy = numberOrNull(row.change_pct_yoy);
    row.national_change_pct_yoy = numberOrNull(row.national_change_pct_yoy);
    row.pct_diff_from_national_rate = numberOrNull(row.pct_diff_from_national_rate);
    row.crime_code = crimeCode(row);
    row._theme = themeForCrime(row.crime_code);
    row._violent = row.violent_crime === true || VIOLENT_CODES.has(row.crime_code);
    return row;
  }

  function populateStaticFilters(chartId) {
    populateControlGroup("year", years().map(optionFromValue), String(STATE.year), chartId);
    populateControlGroup("level", ["national", "regional", "provincial", "capital"].map(function (value) {
      return { value: value, label: levelLabel(value) };
    }), STATE.level, chartId);
    populateControlGroup("theme", Object.keys(CRIME_THEMES).map(function (key) {
      return { value: key, label: themeLabel(key) };
    }), STATE.theme, chartId);
    populateControlGroup("measure", MEASURE_OPTIONS, STATE.measure, chartId);
    populateControlGroup("peopleMeasure", PEOPLE_MEASURE_OPTIONS, STATE.peopleMeasure, chartId);
    populateControlGroup("counterDirection", COUNTER_OPTIONS, STATE.counterDirection, chartId);
    populateControlGroup("compositionMode", COMPOSITION_MODE_OPTIONS, STATE.compositionMode, chartId);
    populateControlGroup("compositionMetric", COMPOSITION_METRIC_OPTIONS, STATE.compositionMetric, chartId);
    populateControlGroup("contributionDirection", CONTRIBUTION_DIRECTION_OPTIONS, STATE.contributionDirection, chartId);
    populateControlGroup("contributionThreshold", CONTRIBUTION_THRESHOLD_OPTIONS, String(STATE.contributionThreshold), chartId);
    populateControlGroup("homicideType", HOMICIDE_OPTIONS.map(function (option) {
      return { value: option.value, label: option.label };
    }), STATE.homicideType, chartId);
    populateControlGroup("homicideStructureView", HOMICIDE_STRUCTURE_VIEW_OPTIONS, STATE.homicideStructureView, chartId);
    populateControlGroup("homicidePeopleBreakdown", HOMICIDE_PEOPLE_BREAKDOWN_OPTIONS, STATE.homicidePeopleBreakdown, chartId);
    var homicideSex = homicideSexOptions();
    var homicideAge = homicideAgeOptions();
    if (!homicideSex.some(function (option) { return option.value === STATE.homicideSex; })) STATE.homicideSex = "all";
    if (!homicideAge.some(function (option) { return option.value === STATE.homicideAgeGroup; })) STATE.homicideAgeGroup = "all";
    populateControlGroup("homicideSex", homicideSex, STATE.homicideSex, chartId);
    populateControlGroup("homicideAgeGroup", homicideAge, STATE.homicideAgeGroup, chartId);
    populatePeopleFilters(chartId);
    populateSurveyFilters(chartId);
  }

  function populatePeopleFilters(chartId) {
    var people = peopleRows();
    var roles = unique(people.map(function (row) { return row.person_role; })).sort();
    var citizenship = unique(people.map(normalizedCitizenshipGroup)).filter(Boolean).sort(sortCitizenshipGroup);
    var roleOptions = roles.map(function (value) {
      return { value: value, label: roleLabel(value) };
    });
    if (!roleOptions.length) roleOptions = [{ value: "offender", label: roleLabel("offender") }];
    if (!roleOptions.some(function (option) { return option.value === STATE.role; })) {
      STATE.role = roles.indexOf("offender") >= 0 ? "offender" : roleOptions[0].value;
    }
    populateControlGroup("role", roleOptions, STATE.role, chartId);
    if (!citizenship.length) citizenship = ["totale_cittadinanza"];
    if (!citizenship.some(function (value) { return value === STATE.citizenship; })) {
      STATE.citizenship = citizenship.indexOf("totale_cittadinanza") >= 0 ? "totale_cittadinanza" : citizenship[0];
    }
    populateControlGroup("citizenship", citizenship.map(function (value) {
      return { value: value, label: citizenshipLabel(value) };
    }), STATE.citizenship, chartId);
    setControlDisabled("role", roles.length === 0, chartId);
    setControlDisabled("citizenship", citizenship.length === 0, chartId);
  }

  function populateSurveyFilters(chartId) {
    if (!STATE.surveyLoaded) {
      [
        "surveyPerceptionIndicator", "surveyPerceptionDimension", "surveyPerceptionResponse", "surveyPerceptionPeriod",
        "surveyVictimizationIndicator", "surveyVictimizationDimension", "surveyVictimizationCrime", "surveyVictimizationResponse", "surveyVictimizationUnit", "surveyVictimizationPeriod",
        "surveyReportingIndicator", "surveyReportingDimension", "surveyReportingCrime", "surveyReportingResponse", "surveyReportingPeriod"
      ].forEach(function (name) {
        populateControlGroup(name, [{ value: "all", label: ui("Caricamento dati", "Loading data") }], "all", chartId);
        setControlDisabled(name, true, chartId);
      });
      return;
    }
    populateSurveyTopicFilters("perception", {
      indicator: "surveyPerceptionIndicator",
      dimension: "surveyPerceptionDimension",
      response: "surveyPerceptionResponse",
      period: "surveyPerceptionPeriod"
    }, chartId);
    populateSurveyTopicFilters("victimization", {
      indicator: "surveyVictimizationIndicator",
      dimension: "surveyVictimizationDimension",
      crime: "surveyVictimizationCrime",
      response: "surveyVictimizationResponse",
      unit: "surveyVictimizationUnit",
      period: "surveyVictimizationPeriod"
    }, chartId);
    populateSurveyTopicFilters("reporting_propensity", {
      indicator: "surveyReportingIndicator",
      dimension: "surveyReportingDimension",
      crime: "surveyReportingCrime",
      response: "surveyReportingResponse",
      period: "surveyReportingPeriod"
    }, chartId);
  }

  function populateSurveyTopicFilters(topic, keys, chartId) {
    var rows = surveyRows(topic);
    var enabled = rows.length > 0;
    var defaults = SURVEY_DEFAULTS[topic] || {};
    var indicatorOptions = [{ value: "all", label: ui("Tutti gli indicatori", "All indicators") }].concat(
      unique(rows.map(function (row) { return row.indicator; })).filter(Boolean).sort(sortItalian).map(optionFromValue)
    );
    keepValidSelection(keys.indicator, indicatorOptions, "all");
    populateControlGroup(keys.indicator, indicatorOptions, STATE[keys.indicator], chartId);

    var scoped = filterSurveyRows(rows, keys, { skip: ["dimension", "response"] });
    var dimensionValues = unique(scoped.map(function (row) { return row.dimension_type; })).filter(Boolean).sort(sortItalian);
    var dimensionOptions = dimensionValues.length > 1 ? [{ value: "all", label: ui("Tutti i dettagli", "All details") }].concat(
      dimensionValues.map(function (value) {
        return { value: value, label: surveyDimensionLabel(value) };
      })
    ) : dimensionValues.map(function (value) {
      return { value: value, label: surveyDimensionLabel(value) };
    });
    if (!dimensionOptions.length) dimensionOptions = [{ value: "all", label: ui("Dettaglio non disponibile", "Detail not available") }];
    keepValidSelection(keys.dimension, dimensionOptions, dimensionValues.length === 1 ? dimensionValues[0] : "all");
    populateControlGroup(keys.dimension, dimensionOptions, STATE[keys.dimension], chartId);
    setControlAutoHidden(keys.dimension, dimensionValues.length <= 1, chartId);

    if (keys.crime) {
      scoped = filterSurveyRows(rows, keys, { skip: ["crime", "response"] });
      var crimeOptions = [{ value: "all", label: ui("Tutti i reati", "All offences") }].concat(
        unique(scoped.map(function (row) { return row.crime_name; })).filter(Boolean).sort(sortItalian).map(optionFromValue)
      );
      keepValidSelection(keys.crime, crimeOptions, "all");
      populateControlGroup(keys.crime, crimeOptions, STATE[keys.crime], chartId);
    }

    scoped = filterSurveyRows(rows, keys, { skip: "response" });
    var responseValues = unique(scoped.map(surveyResponseValue)).filter(Boolean).sort(sortItalian);
    var responseOptions = responseValues.length > 1 ? [{ value: "all", label: ui("Tutte le voci", "All items") }].concat(responseValues.map(optionFromValue)) : responseValues.map(optionFromValue);
    if (!responseOptions.length) responseOptions = [{ value: "all", label: ui("Voce non disponibile", "Item not available") }];
    keepValidSelection(keys.response, responseOptions, responseOptions[0].value);
    populateControlGroup(keys.response, responseOptions, STATE[keys.response], chartId);
    setControlAutoHidden(keys.response, responseValues.length <= 1, chartId);

    if (keys.unit) {
      scoped = filterSurveyRows(rows, keys, { skip: "unit" });
      var unitValues = unique(scoped.map(function (row) { return row.unit; })).filter(Boolean).sort(sortItalian);
      var unitOptions = unitValues.map(function (value) {
        return { value: value, label: surveyUnitDisplayLabel(value) };
      });
      if (!unitOptions.length) unitOptions = [{ value: "all", label: ui("Unità non disponibile", "Unit not available") }];
      var unitFallback = unitOptions.some(function (option) { return option.value === defaults.unit; }) ? defaults.unit : unitOptions[0].value;
      keepValidSelection(keys.unit, unitOptions, unitFallback);
      populateControlGroup(keys.unit, unitOptions, STATE[keys.unit], chartId);
      setControlAutoHidden(keys.unit, unitValues.length <= 1, chartId);
    }

    scoped = filterSurveyRows(rows, keys, { skip: "period" });
    var periodValues = unique(scoped.map(function (row) { return row.period; })).filter(Boolean).sort(compareSurveyPeriodsDesc);
    var allowAllPeriods = allowAllSurveyPeriods(topic, keys);
    var periodOptions = allowAllPeriods ? [{ value: "all", label: ui("Tutti i periodi", "All periods") }].concat(periodValues.map(optionFromValue)) : periodValues.map(optionFromValue);
    if (!periodOptions.length) periodOptions = [{ value: "all", label: ui("Periodo non disponibile", "Period not available") }];
    var periodFallback = allowAllPeriods ? (defaults.period || "all") : (periodValues[0] || defaults.period || "all");
    keepValidSelection(keys.period, periodOptions, periodFallback);
    populateControlGroup(keys.period, periodOptions, STATE[keys.period], chartId);

    Object.keys(keys).forEach(function (key) {
      setControlDisabled(keys[key], !enabled, chartId);
    });
  }

  function renderAll() {
    populateAllControlBlocks();
    var missing = missingReportedLevelsForAllControlBlocks();
    if (missing.length) {
      renderDeferredLevelLoading(missing);
      ensureReportedLevels(missing).then(renderAll).catch(function (error) {
        setStatus(ui("Errore nel caricamento del livello territoriale: ", "Error loading territorial level: ") + error.message, "error");
      });
      return;
    }
    populateAllControlBlocks();
    renderTopRecap();
    renderCoverage();
    renderPeopleNotice();
    renderCharts();
    renderTerritoryTableBlock();
  }

  function renderMetaBlocks() {
    renderTopRecap();
    renderMethodNotes();
    renderSources();
  }

  function renderTopRecap() {
    if (!els.siTopRecap) return;
    var latest = latestYear();
    var total = aggregateNationalForCrime("TOT", latest);
    var counts = STATE.meta.territory_counts || {};
    els.siTopRecap.innerHTML = [
      ui("Anni ", "Years ") + escapeHtml(yearRangeLabel()) + ".",
      ui("Ultimo dato Italia: ", "Latest Italy value: ") + "<strong>" + formatInteger(total) + "</strong> " + ui("delitti denunciati nel ", "reported crimes in ") + escapeHtml(String(latest || ui("n.d.", "n/a"))) + ".",
      ui("Copertura: ", "Coverage: ") + formatInteger(counts.regional || 0) + " " + ui("regioni", "regions") + ", " + formatInteger(counts.provincial || 0) + " " + ui("province", "provinces") + ", " + formatInteger(counts.capital || 0) + " " + ui("comuni capoluogo", "provincial capitals") + "."
    ].join(" ");
  }

  function renderMethodNotes() {
    if (!els.siMethodNotes) return;
    var notes = STATE.meta.notes || [];
    if (!notes.length) {
      notes = [
        ui("I conteggi sono delitti denunciati, non tutti i reati effettivamente commessi.", "Counts are reported crimes, not every offence actually committed."),
        ui("Le dimensioni persone richiedono fonti e denominatori dedicati per letture corrette.", "People dimensions require dedicated sources and denominators for correct interpretation.")
      ];
    }
    els.siMethodNotes.innerHTML = notes.map(function (note) {
      return "<li>" + escapeHtml(tr(note)) + "</li>";
    }).join("");
  }

  function renderSources() {
    renderSourceList(els.siSourceList, STATE.meta.sources || []);
    renderSourceList(els.siPlannedSourceList, STATE.meta.planned_sources || []);
  }

  function renderSourceList(target, sources) {
    if (!target) return;
    if (!sources.length) {
      target.innerHTML = "<li>" + escapeHtml(ui("Fonti non disponibili nei metadati caricati.", "Sources are not available in the loaded metadata.")) + "</li>";
      return;
    }
    target.innerHTML = sources.map(function (source) {
      return '<li><a href="' + escapeHtml(source.url || "#") + '" target="_blank" rel="noopener">' + escapeHtml(tr(source.label || "Fonte")) + '</a><span>' + escapeHtml(tr(source.role || "")) + '</span></li>';
    }).join("");
  }

  function renderPeopleNotice() {
    if (!els.siPeopleNotice) return;
    var people = peopleRows();
    if (!STATE.peopleLoaded && !people.length) {
      els.siPeopleNotice.innerHTML = "<strong>" + escapeHtml(ui("Copertura persone:", "People coverage:")) + "</strong> " + escapeHtml(ui("caricamento in corso. I grafici principali sui reati sono già disponibili.", "loading. The main crime charts are already available."));
      return;
    }
    if (!people.length) {
      els.siPeopleNotice.innerHTML = "<strong>" + escapeHtml(ui("Copertura persone:", "People coverage:")) + "</strong> " + escapeHtml(ui("non disponibile nei payload correnti.", "not available in the current payloads."));
      return;
    }
    var levels = unique(people.map(function (row) { return row.territory_level; })).filter(Boolean);
    var scope = levels.length === 1 && levels[0] === "national" ? levelLabel("national") : levels.map(levelLabel).join(", ");
    var territoryNote = levels.length === 1 && levels[0] === "national" ? ui(" Il payload persone caricato ora è nazionale: i filtri territoriali agiscono sui grafici dei reati denunciati, non su autori/vittime e identikit.", " The currently loaded people payload is national: territorial filters affect reported-crime charts, not offender/victim and profile charts.") : "";
    els.siPeopleNotice.innerHTML = "<strong>" + escapeHtml(ui("Copertura persone:", "People coverage:")) + "</strong> " + escapeHtml(scope) + "." + escapeHtml(territoryNote) + " " + escapeHtml(ui("I grafici separano sempre autori e vittime. Il filtro Misura permette conteggi, quote e tassi calcolati sulla popolazione residente totale.", "Charts always separate offenders and victims. The Measure filter allows counts, shares and rates calculated on total resident population."));
  }

  function populateAllControlBlocks() {
    CONTROL_BLOCK_IDS.forEach(function (blockId) {
      if (!document.getElementById(blockId)) return;
      withChartState(blockId, function () {
        populateStaticFilters(blockId);
        refreshDependentFilters(blockId);
        syncControlVisibility(blockId);
      });
    });
  }

  function renderControlBlock(blockId) {
    if (blockId === "siTerritoryTable" || blockId === "global") return renderTerritoryTableBlock();
    return renderChartById(blockId);
  }

  function refreshDependentFilters(chartId) {
    var regions = unique(reportedRows().map(function (row) { return row.region; })).sort(sortItalian);
    populateControlGroup("region", [{ value: "all", label: ui("Tutte", "All") }].concat(regions.map(optionFromValue)), STATE.region, chartId);

    var provinceSource = reportedRows().filter(function (row) {
      return row.province && (STATE.region === "all" || row.region === STATE.region);
    });
    var provinces = unique(provinceSource.map(function (row) { return row.province; })).sort(sortItalian);
    if (STATE.province !== "all" && provinces.indexOf(STATE.province) < 0) STATE.province = "all";
    populateControlGroup("province", [{ value: "all", label: ui("Tutte", "All") }].concat(provinces.map(function (value) {
      return { value: value, label: territoryShort(value) };
    })), STATE.province, chartId);

    var territoryOptions = territoryRowsForControls().map(function (row) {
      return { value: row.territory_code, label: territoryLabel(row) };
    }).sort(function (a, b) { return sortItalian(a.label, b.label); });
    if (STATE.territory !== "all" && !territoryOptions.some(function (option) { return option.value === STATE.territory; })) {
      STATE.territory = "all";
    }
    populateControlGroup("territory", [{ value: "all", label: ui("Tutti", "All") }].concat(territoryOptions), STATE.territory, chartId);
    if (STATE.compareTerritory !== "all" && !territoryOptions.some(function (option) { return option.value === STATE.compareTerritory; })) {
      STATE.compareTerritory = "all";
    }
    populateControlGroup("compareTerritory", [{ value: "all", label: ui("Nessun confronto", "No comparison") }].concat(territoryOptions), STATE.compareTerritory, chartId);

    var crimeOptions = crimeOptionsForTheme();
    if (!crimeOptions.some(function (option) { return option.value === STATE.crime; })) {
      STATE.crime = STATE.theme === "all" ? "TOT" : "all";
    }
    populateControlGroup("crime", crimeOptions, STATE.crime, chartId);
    populateControlGroup("measure", MEASURE_OPTIONS, STATE.measure, chartId);
    populateControlGroup("counterDirection", COUNTER_OPTIONS, STATE.counterDirection, chartId);
    populateComparisonYearFilters(chartId);

    setControlDisabled("region", STATE.level === "national", chartId);
    setControlDisabled("province", STATE.level === "national" || STATE.level === "regional", chartId);
    setControlDisabled("compareTerritory", STATE.level === "national" || territoryOptions.length < 2, chartId);
    syncControlVisibility(chartId);
  }

  function populateComparisonYearFilters(chartId) {
    var options = comparisonYearOptions();
    var selected = normalizedComparisonYear();
    populateControlGroup("comparisonYear", options, selected === null ? "" : String(selected), chartId);
    setControlDisabled("comparisonYear", selected === null, chartId);
  }

  function renderCoverage() {
    els.siCoverage.innerHTML = [
      coverageItem("Denunce registrate", "Serie per anno, reato e territorio fino ai comuni capoluogo."),
      coverageItem("Confronti espliciti", "Il grafico aggiunge una seconda serie solo quando usi il filtro Confronta con."),
      coverageItem("Tassi per 100.000", "Usali per confrontare territori; i valori assoluti descrivono il volume registrato."),
      coverageItem("Autori e vittime", "Sono persone registrate nelle fonti disponibili; quote e tassi su popolazione residente dipendono dalla misura scelta."),
      coverageItem("Cittadinanza", "Italiani e stranieri vanno confrontati solo con denominatori coerenti per età, sesso e territorio."),
      coverageItem("Percezione e vittimizzazione", "Sono fenomeni diversi dalle denunce e vanno letti con fonti campionarie dedicate.")
    ].join("");
  }

  function renderCharts() {
    CHART_IDS.forEach(function (id) {
      if (shouldRenderChart(id)) renderChartById(id);
      else markDeferredChart(id);
    });
  }

  function shouldRenderChart(id) {
    return !("IntersectionObserver" in window) || Boolean(STATE.visibleCharts[id]);
  }

  function markDeferredChart(id) {
    var chart = document.getElementById(id);
    if (chart && !chart.dataset.deferred) {
      chart.dataset.deferred = "true";
      chart.innerHTML = '<div class="si-chart-empty">' + escapeHtml(ui("Il grafico verrà caricato quando arrivi a questa sezione.", "This chart will load when you reach this section.")) + "</div>";
    }
  }

  function renderChartById(id) {
    var chart = document.getElementById(id);
    if (chart) delete chart.dataset.deferred;
    return withChartState(id, function () {
      var missing = missingReportedLevelsForCurrentView();
      if (missing.length) {
        renderDeferredLevelLoading(missing);
        ensureReportedLevels(missing).then(function () { renderControlBlock(id); }).catch(function (error) {
          setStatus(ui("Errore nel caricamento del livello territoriale: ", "Error loading territorial level: ") + error.message, "error");
        });
        return;
      }
      populateStaticFilters(id);
      refreshDependentFilters(id);
      syncControlVisibility(id);
      return withChartMeasure(id, function () {
        updateChartNarrative(id);
        if (id === "siTrendChart") return renderTrendChart();
        if (id === "siCompositionChart") return renderCompositionChart();
        if (id === "siContributionChart") return renderContributionChart();
        if (id === "siRankingChart") return renderRankingChart();
        if (id === "siScatterChart") return renderScatterChart();
        if (id === "siTreemapChart") return renderTreemapChart();
        if (id === "siPropertyFocusChart") return renderPropertyFocusChart();
        if (id === "siViolentChart") return renderViolentChart();
        if (id === "siPersonFocusChart") return renderPersonFocusChart();
        if (id === "siCrimeChart") return renderCrimeChart();
        if (id === "siHomicideTrendChart") return renderHomicideTrendChart();
        if (id === "siHomicideStructureChart") return renderHomicideStructureChart();
        if (id === "siHomicidePeopleChart") return renderHomicidePeopleChart();
        if (id === "siPeopleChart") return renderPeopleChart();
        if (id === "siDemographyChart") return renderDemographyChart();
        if (id === "siCounterChart") return renderCounterChart();
        if (id === "siPerceptionChart") return renderSurveyChart("perception", "siPerceptionChart", "siPerceptionTag");
        if (id === "siVictimizationChart") return renderSurveyChart("victimization", "siVictimizationChart", "siVictimizationTag");
        if (id === "siReportingChart") return renderSurveyChart("reporting_propensity", "siReportingChart", "siReportingTag");
      });
    });
  }

  function renderTrendChart() {
    var series = trendSeries();
    els.siTrendTag.textContent = measureLabel();
    if (!series.length) return emptyChart("siTrendChart", ui("Nessuna serie nel perimetro selezionato.", "No series in the selected scope."));
    plot("siTrendChart", series.map(function (serie, index) {
      return {
        type: "scatter",
        mode: "lines+markers",
        name: serie.name,
        x: serie.points.map(function (point) { return yearLabel(point.year); }),
        y: transformSeriesValues(serie.points).map(function (point) { return point.value; }),
        line: { color: COLORS[index % COLORS.length], width: 3 },
        marker: { size: 7 },
        hovertemplate: "<b>%{fullData.name}</b><br>" + ui("Anno", "Year") + ": %{x}<br>" + measureLabel() + ": %{y:,.2f}<extra></extra>"
      };
    }), { yTitle: measureLabel(), legend: true, yearAxis: true });
  }

  function renderCompositionChart() {
    var rows = selectedTerritoryRows(STATE.year).filter(selectedNonTotalCrimeFilter);
    var total = sum(rows, function (row) { return row.value; });
    var grouped = aggregateBy(rows, function (row) {
      return STATE.compositionMode === "crimes" ? crimeLabel(row) : themeLabel(row._theme);
    });
    var data = grouped.map(function (row) {
      return {
        key: row.key,
        value: STATE.compositionMetric === "share" && total ? row.value / total * 100 : row.value,
        rawValue: row.value,
        share: total ? row.value / total * 100 : null
      };
    }).sort(descValue).slice(0, STATE.compositionMode === "crimes" ? 18 : 12).reverse();
    els.siCompositionTag.textContent = String(STATE.year) + " - " + (STATE.compositionMode === "crimes" ? ui("reati", "offences") : ui("categorie", "categories")) + " - " + metricScopeLabel();
    if (!data.length) return emptyChart("siCompositionChart", ui("Nessun dettaglio per composizione.", "No composition detail available."));
    plot("siCompositionChart", [{
      type: "bar",
      orientation: "h",
      x: data.map(function (row) { return row.value; }),
      y: data.map(function (row) { return row.key; }),
      customdata: data.map(function (row) { return [formatInteger(row.rawValue), formatPercent(row.share)]; }),
      marker: { color: data.map(function (_, index) { return COLORS[index % COLORS.length]; }) },
      hovertemplate: "%{y}<br>" + ui("Valore", "Value") + ": %{customdata[0]}<br>" + ui("Quota", "Share") + ": %{customdata[1]}<extra></extra>"
    }], {
      yTitle: "",
      xTitle: STATE.compositionMetric === "share" ? ui("% del totale selezionato", "% of selected total") : measureLabel(),
      marginLeft: STATE.compositionMode === "crimes" ? 220 : 170
    });
  }

  function renderContributionChart() {
    var comparison = normalizedComparisonYear();
    if (comparison === null) {
      els.siContributionTag.textContent = ui("confronto non disponibile", "comparison unavailable");
      return emptyChart("siContributionChart", ui("Scegli un anno finale successivo al primo anno disponibile.", "Choose a final year after the first available year."));
    }
    var threshold = isFiniteNumber(STATE.contributionThreshold) ? STATE.contributionThreshold : 0;
    var currentRows = selectedTerritoryRows(STATE.year).filter(contributionCrimeFilter);
    var prevRows = selectedTerritoryRows(comparison).filter(contributionCrimeFilter);
    var current = aggregateBy(currentRows, function (row) { return row.crime_code; });
    var previous = mapByKey(aggregateBy(prevRows, function (row) { return row.crime_code; }));
    var data = current.map(function (row) {
      var base = (previous[row.key] || {}).value || 0;
      var changeAbs = row.value - base;
      var changePct = base ? changeAbs / base * 100 : null;
      var sample = row.rows && row.rows[0] || { crime_code: row.key };
      return { key: crimeLabel(sample), code: row.key, value: changeAbs, changePct: changePct, current: row.value, base: base };
    }).filter(function (row) {
      if (STATE.contributionDirection === "increase") return row.value > 0;
      if (STATE.contributionDirection === "decrease") return row.value < 0;
      return row.value !== 0;
    }).filter(function (row) {
      if (!threshold) return true;
      return isFiniteNumber(row.changePct) && Math.abs(row.changePct) >= threshold;
    }).sort(function (a, b) { return Math.abs(b.changePct || 0) - Math.abs(a.changePct || 0); }).slice(0, 30).reverse();
    els.siContributionTag.textContent = comparison + "-" + STATE.year + " - " + contributionDirectionLabel() + " - " + ui("soglia ", "threshold ") + threshold + "%";
    if (!data.length) return emptyChart("siContributionChart", ui("Nessuna variazione calcolabile.", "No computable change."));
    var yLabels = data.map(function (row) { return row.key; });
    var dynamicHeight = Math.max(420, data.length * 34 + 150);
    plot("siContributionChart", [{
      type: "bar",
      orientation: "h",
      x: data.map(function (row) { return row.changePct; }),
      y: yLabels,
      customdata: data.map(function (row) { return [formatInteger(row.base), formatInteger(row.current), formatInteger(row.value), row.code]; }),
      marker: { color: data.map(function (row) { return row.value >= 0 ? "#d96363" : "#5e9f65"; }) },
      hovertemplate: "%{y}<br>" + ui("Codice", "Code") + ": %{customdata[3]}<br>" + ui("Anno confronto", "Comparison year") + ": %{customdata[0]}<br>" + ui("Anno finale", "Final year") + ": %{customdata[1]}<br>" + ui("Variazione assoluta", "Absolute change") + ": %{customdata[2]}<br>" + ui("Variazione %", "% change") + ": %{x:.1f}%<extra></extra>"
    }], {
      xTitle: ui("Variazione % ", "% change ") + comparison + "-" + STATE.year,
      marginLeft: 280,
      height: dynamicHeight,
      yTickVals: yLabels,
      yTickText: yLabels
    });
  }

  function renderRankingChart() {
    var rows = territoryMetricRows().sort(descMetric).slice(0, 25).reverse();
    els.siRankingTag.textContent = levelLabel(STATE.level) + " - " + metricScopeLabel();
    if (!rows.length) return emptyChart("siRankingChart", ui("Nessun territorio nel perimetro selezionato.", "No territory in the selected scope."));
    var yLabels = rows.map(function (row) { return territoryLabel(row); });
    plot("siRankingChart", [{
      type: "bar",
      orientation: "h",
      x: rows.map(metricValueForRow),
      y: yLabels,
      marker: { color: rows.map(function (_, index) { return COLORS[index % COLORS.length]; }) },
      hovertemplate: "%{y}<br>" + measureLabel() + ": %{x:,.2f}<extra></extra>"
    }], {
      xTitle: measureLabel(),
      marginLeft: marginForYLabels(yLabels, 180, 300),
      height: barChartHeight(rows.length),
      yTickVals: yLabels,
      yTickText: yLabels
    });
  }

  function renderScatterChart() {
    if (STATE.measure === "index" || STATE.measure === "moving_average" || STATE.measure === "yoy") {
      els.siScatterTag.textContent = levelLabel(STATE.level) + " - " + metricScopeLabel();
      return emptyChart("siScatterChart", ui("Questo grafico confronta il livello del fenomeno con la variazione annua: scegli valori assoluti o tassi per l'asse orizzontale.", "This chart compares the level of the phenomenon with annual change: choose absolute values or rates for the horizontal axis."));
    }
    var rows = territoryMetricRows().map(function (row) {
      row._plotValue = metricValueForRow(row);
      return row;
    }).filter(function (row) { return isFiniteNumber(row.change_pct_yoy) && isFiniteNumber(row._plotValue); });
    els.siScatterTag.textContent = levelLabel(STATE.level) + " - " + metricScopeLabel() + " - " + measureLabel();
    if (!rows.length) return emptyChart("siScatterChart", ui("Servono almeno due anni per calcolare la variazione.", "At least two years are needed to compute the change."));
    plot("siScatterChart", [{
      type: "scatter",
      mode: "markers",
      x: rows.map(function (row) { return row._plotValue; }),
      y: rows.map(function (row) { return row.change_pct_yoy; }),
      text: rows.map(territoryLabel),
      marker: {
        size: rows.map(function (row) { return Math.max(7, Math.min(24, Math.sqrt(Math.max(row._plotValue, 0)) / 20)); }),
        color: rows.map(function (row) { return row.change_pct_yoy >= 0 ? "#d96363" : "#5e9f65"; }),
        opacity: .78
      },
      hovertemplate: "<b>%{text}</b><br>" + measureLabel() + ": %{x:,.2f}<br>" + ui("Var. annua", "Annual change") + ": %{y:.1f}%<extra></extra>"
    }], { xTitle: measureLabel(), yTitle: ui("Variazione % annua", "Annual % change") });
  }

  function renderTreemapChart() {
    var rows = territoryMetricRows()
      .filter(function (row) { return row.territory_level !== "national"; })
      .sort(descMetric)
      .slice(0, 25)
      .reverse();
    els.siTreemapTag.textContent = levelLabel(STATE.level) + " - " + String(STATE.year);
    if (!rows.length) return emptyChart("siTreemapChart", ui("Seleziona un livello territoriale locale per vedere la distribuzione.", "Select a local territorial level to see the distribution."));
    var yLabels = rows.map(territoryLabel);
    plot("siTreemapChart", [{
      type: "bar",
      orientation: "h",
      x: rows.map(metricValueForRow),
      y: yLabels,
      marker: { color: rows.map(function (row) { return row.change_pct_yoy >= 0 ? "#d96363" : "#5e9f65"; }) },
      customdata: rows.map(function (row) { return [metricScopeLabel(), formatPercent(row.change_pct_yoy), territoryContext(row)]; }),
      hovertemplate: "<b>%{y}</b><br>" + measureLabel() + ": %{x:,.2f}<br>" + ui("Reato/categoria", "Offence/category") + ": %{customdata[0]}<br>" + ui("Var. annua", "Annual change") + ": %{customdata[1]}<br>%{customdata[2]}<extra></extra>"
    }], {
      xTitle: measureLabel(),
      marginLeft: marginForYLabels(yLabels, 180, 300),
      height: barChartHeight(rows.length),
      yTickVals: yLabels,
      yTickText: yLabels
    });
  }

  function renderPropertyFocusChart() {
    renderThemeFocusChart(
      "siPropertyFocusChart",
      els.siPropertyTag,
      ["property", "predatory"],
      ui("Principali reati patrimoniali", "Main property offences")
    );
  }

  function renderPersonFocusChart() {
    renderThemeFocusChart(
      "siPersonFocusChart",
      els.siPersonFocusTag,
      ["violent_person"],
      ui("Principali reati contro la persona", "Main offences against the person")
    );
  }

  function renderThemeFocusChart(chartId, tagEl, themeKeys, emptyLabel) {
    var rows = selectedTerritoryRows(null)
      .filter(selectedNonTotalCrimeFilter)
      .filter(function (row) { return themeKeys.indexOf(row._theme) >= 0; });
    if (tagEl) tagEl.textContent = territoryScopeLabel() + " - " + metricScopeLabel();
    if (!rows.length) return emptyChart(chartId, ui("Nessun dato disponibile per ", "No data available for ") + emptyLabel.toLowerCase() + ui(" nel perimetro selezionato.", " in the selected scope."));
    var topCodes = aggregateBy(rows.filter(function (row) { return row.year === STATE.year; }), function (row) {
      return row.crime_code;
    }).sort(descValue).slice(0, 6).map(function (row) { return row.key; });
    if (!topCodes.length) return emptyChart(chartId, ui("Nessun reato selezionabile per questo focus.", "No selectable offence for this focus."));
    plot(chartId, topCodes.map(function (code, index) {
      var points = years().map(function (year) {
        return {
          year: year,
          value: sumMetricRows(rows.filter(function (row) { return row.year === year && row.crime_code === code; }))
        };
      });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: crimeLabel({ crime_code: code }),
        x: points.map(function (point) { return yearLabel(point.year); }),
        y: transformSeriesValues(points).map(function (point) { return point.value; }),
        line: { color: COLORS[index % COLORS.length], width: 3 },
        marker: { size: 7 },
        hovertemplate: "<b>%{fullData.name}</b><br>" + ui("Anno", "Year") + ": %{x}<br>" + measureLabel() + ": %{y:,.2f}<extra></extra>"
      };
    }), { yTitle: measureLabel(), legend: true, yearAxis: true });
  }

  function renderViolentChart() {
    var rows = selectedTerritoryRows(null).filter(selectedNonTotalCrimeFilter);
    var yearsList = years();
    var violentPoints = yearsList.map(function (year) {
      return { year: year, value: sumMetricRows(rows.filter(function (row) { return row.year === year && row._violent; })) };
    });
    var otherPoints = yearsList.map(function (year) {
      return { year: year, value: sumMetricRows(rows.filter(function (row) { return row.year === year && !row._violent; })) };
    });
    els.siViolentTag.textContent = territoryScopeLabel() + " - " + metricScopeLabel() + " - " + measureLabel();
    if (!rows.length) return emptyChart("siViolentChart", ui("Nessun dato per classificazione violenti/altri.", "No data for the violent/other classification."));
    if (!violentPoints.concat(otherPoints).some(function (point) { return isFiniteNumber(point.value); })) return emptyChart("siViolentChart", measureUnavailableMessage("questo perimetro"));
    plot("siViolentChart", [
      { type: "bar", name: ui("Reati violenti", "Violent offences"), x: yearsList.map(yearLabel), y: transformSeriesValues(violentPoints).map(function (point) { return point.value; }), marker: { color: "#d96363" } },
      { type: "bar", name: ui("Altri reati", "Other offences"), x: yearsList.map(yearLabel), y: transformSeriesValues(otherPoints).map(function (point) { return point.value; }), marker: { color: "#4f8bc9" } }
    ], {
      barmode: (STATE.measure === "index" || STATE.measure === "yoy") ? "group" : "stack",
      yTitle: measureLabel(),
      legend: true,
      yearAxis: true
    });
  }

  function renderCrimeChart() {
    var selected = STATE.crime === "all" ? topCrimeCodeForSelection() : STATE.crime;
    var rows = selectedTerritoryRows(null).filter(function (row) {
      return row.indicator_group === "reported_crimes" && row.crime_code === selected;
    }).sort(sortYear);
    els.siCrimeTag.textContent = crimeLabel({ crime_code: selected }) + " - " + measureLabel();
    if (!rows.length) return emptyChart("siCrimeChart", ui("Seleziona un reato specifico per vedere la scheda.", "Select a specific offence to see the profile."));
    var points = rows.map(function (row) {
      return { year: row.year, value: valueForMeasureBase(row), raw: [row] };
    });
    if (!points.some(function (point) { return isFiniteNumber(point.value); })) return emptyChart("siCrimeChart", measureUnavailableMessage("questo reato"));
    plot("siCrimeChart", [{
      type: "scatter",
      mode: "lines+markers",
      x: points.map(function (point) { return yearLabel(point.year); }),
      y: transformSeriesValues(points).map(function (point) { return point.value; }),
      fill: "tozeroy",
      line: { color: "#ff5a1f", width: 3 },
      marker: { size: 8 },
      hovertemplate: ui("Anno", "Year") + ": %{x}<br>" + measureLabel() + ": %{y:,.2f}<extra></extra>"
    }], { yTitle: measureLabel(), yearAxis: true });
  }

  function renderHomicideTrendChart() {
    var codes = homicideSelectedCodes();
    var entities = homicideSeriesEntities();
    if (els.siHomicideTrendTag) els.siHomicideTrendTag.textContent = homicideTypeLabel() + " - " + measureLabel();
    plot("siHomicideTrendChart", entities.map(function (entity, index) {
      var points = years().map(function (year) {
        var rows = reportedRows().filter(function (row) {
          return row.year === year && row.territory_level === entity.level && row.territory_code === entity.code && codes.indexOf(row.crime_code) >= 0;
        });
        return {
          year: year,
          value: sumMetricRows(rows),
          raw: rows
        };
      });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: entity.label,
        x: points.map(function (point) { return yearLabel(point.year); }),
        y: transformSeriesValues(points).map(function (point) { return point.value; }),
        line: { color: COLORS[index % COLORS.length], width: 3 },
        marker: { size: 7 },
        hovertemplate: "<b>%{fullData.name}</b><br>" + ui("Anno", "Year") + ": %{x}<br>" + measureLabel() + ": %{y:,.2f}<extra></extra>"
      };
    }), { yTitle: measureLabel(), legend: true, yearAxis: true });
  }

  function renderHomicideStructureChart() {
    if (STATE.homicideStructureView === "territories") return renderHomicideTerritoryView();
    return renderHomicideBreakdownView();
  }

  function renderHomicideBreakdownView() {
    if (STATE.measure === "index" || STATE.measure === "moving_average") {
      return emptyChart("siHomicideStructureChart", ui("Questa vista usa valori assoluti, tassi o variazione % annua. Indice e media mobile restano nella serie storica.", "This view uses absolute values, rates or annual % change. Index and moving average remain in the time series."));
    }
    var rows = selectedTerritoryRows(STATE.year).filter(function (row) {
      return row.indicator_group === "reported_crimes" && HOMICIDE_CODES.indexOf(row.crime_code) >= 0;
    });
    var previous = previousYear();
    var previousRows = isFiniteNumber(previous) ? selectedTerritoryRows(previous).filter(function (row) {
      return row.indicator_group === "reported_crimes" && HOMICIDE_CODES.indexOf(row.crime_code) >= 0;
    }) : [];
    var previousMap = mapByKey(aggregateBy(previousRows, function (row) { return row.crime_code; }));
    if (els.siHomicideStructureTag) els.siHomicideStructureTag.textContent = String(STATE.year) + " - " + territoryScopeLabel();
    if (!rows.length) return emptyChart("siHomicideStructureChart", ui("Nessun codice omicidio nel perimetro selezionato.", "No homicide code in the selected scope."));
    var grouped = aggregateBy(rows, function (row) { return row.crime_code; }).map(function (row) {
      var code = row.key;
      var previous = previousMap[code] ? previousMap[code].value : null;
      var change = percentChange(row.value, previous);
      var metricValue = STATE.measure === "yoy" ? change : metricValueForGroupedRows(row.rows, row.value);
      return {
        key: homicideShortLabel(code),
        fullLabel: crimeLabel({ crime_code: code }),
        code: code,
        kind: homicideCodeKind(code),
        rawValue: row.value,
        change_pct_yoy: change,
        value: metricValue
      };
    }).filter(function (row) {
      return isFiniteNumber(row.value);
    }).sort(descValue).reverse();
    var yLabels = grouped.map(function (row) { return row.key; });
    if (!grouped.length) return emptyChart("siHomicideStructureChart", ui("Nessuna variazione annua calcolabile per il perimetro selezionato.", "No computable annual change for the selected scope."));
    plot("siHomicideStructureChart", [{
      type: "bar",
      orientation: "h",
      x: grouped.map(function (row) { return row.value; }),
      y: yLabels,
      customdata: grouped.map(function (row) { return [row.fullLabel, row.code, row.kind, formatInteger(row.rawValue), formatPercent(row.change_pct_yoy)]; }),
      marker: { color: grouped.map(function (row) {
        if (STATE.measure === "yoy") return row.value >= 0 ? "#d96363" : "#5e9f65";
        if (row.code === "ATTEMPHOM") return "#8d7ad8";
        if (HOMICIDE_MAIN_CODES.indexOf(row.code) >= 0) return "#d96363";
        return "#d4a348";
      }) },
      hovertemplate: "<b>%{customdata[0]}</b><br>" + ui("Codice", "Code") + ": %{customdata[1]}<br>" + ui("Tipo", "Type") + ": %{customdata[2]}<br>" + ui("Valore", "Value") + ": %{customdata[3]}<br>" + ui("Var. annua", "Annual change") + ": %{customdata[4]}<extra></extra>"
    }], {
      xTitle: measureLabel(),
      marginLeft: marginForYLabels(yLabels, 220, 320),
      height: barChartHeight(grouped.length),
      yTickVals: yLabels,
      yTickText: yLabels
    });
  }

  function renderHomicideTerritoryView() {
    if (STATE.measure === "index" || STATE.measure === "moving_average") {
      return emptyChart("siHomicideStructureChart", ui("Questa vista usa valori assoluti, tassi o variazione % annua. Indice e media mobile restano nella serie storica.", "This view uses absolute values, rates or annual % change. Index and moving average remain in the time series."));
    }
    var rows = homicideTerritoryRows().sort(function (a, b) {
      return (homicideTerritoryMetric(b) || 0) - (homicideTerritoryMetric(a) || 0);
    }).slice(0, 25).reverse();
    if (els.siHomicideStructureTag) els.siHomicideStructureTag.textContent = levelLabel(STATE.level) + " - " + homicideTypeLabel();
    if (!rows.length) return emptyChart("siHomicideStructureChart", ui("Nessun territorio nel perimetro selezionato.", "No territory in the selected scope."));
    var yLabels = rows.map(function (row) { return territoryLabel(row); });
    plot("siHomicideStructureChart", [{
      type: "bar",
      orientation: "h",
      x: rows.map(homicideTerritoryMetric),
      y: yLabels,
      customdata: rows.map(function (row) { return [formatPercent(row.change_pct_yoy), territoryContext(row)]; }),
      marker: { color: rows.map(function (row) { return row.change_pct_yoy >= 0 ? "#d96363" : "#5e9f65"; }) },
      hovertemplate: "<b>%{y}</b><br>" + measureLabel() + ": %{x:,.2f}<br>" + ui("Var. annua", "Annual change") + ": %{customdata[0]}<br>%{customdata[1]}<extra></extra>"
    }], {
      xTitle: measureLabel(),
      marginLeft: marginForYLabels(yLabels, 180, 300),
      height: barChartHeight(rows.length),
      yTickVals: yLabels,
      yTickText: yLabels
    });
  }

  function renderHomicidePeopleChart() {
    var rows = homicidePeopleRows();
    if (els.siHomicidePeopleTag) els.siHomicidePeopleTag.textContent = roleLabel(STATE.role) + " - " + levelLabel("national") + " - " + homicideTypeLabel() + " - " + peopleMeasureLabel();
    if (!STATE.peopleLoaded && !peopleRows().length) return emptyChart("siHomicidePeopleChart", ui("Dati autori/vittime in caricamento.", "Offender/victim data loading."));
    if (!rows.length) return emptyChart("siHomicidePeopleChart", ui("Nessun dato autori/vittime per i filtri selezionati.", "No offender/victim data for the selected filters."));
    var grouped = peopleMetricGroups(rows, homicidePeopleBreakdownKey).sort(descValue).slice(0, 24).reverse();
    if (!grouped.length) return emptyChart("siHomicidePeopleChart", peopleRateUnavailableMessage());
    var yLabels = grouped.map(function (row) { return row.key; });
    plot("siHomicidePeopleChart", [{
      type: "bar",
      orientation: "h",
      x: grouped.map(function (row) { return row.value; }),
      y: yLabels,
      customdata: grouped.map(function (row) { return [formatInteger(row.rawValue)]; }),
      marker: { color: grouped.map(function (_, index) { return COLORS[index % COLORS.length]; }) },
      hovertemplate: peopleHoverTemplate()
    }], {
      xTitle: peopleValueAxisLabel(),
      marginLeft: marginForYLabels(yLabels, 190, 340),
      height: barChartHeight(grouped.length),
      yTickVals: yLabels,
      yTickText: yLabels
    });
  }

  function renderPeopleChart() {
    var rows = peopleSelectionRows();
    els.siPeopleTag.textContent = rows.length ? roleLabel(STATE.role) + " - " + peopleBreakdownLabel() + " - " + peopleMeasureLabel() : ui("nessun dato", "no data");
    if (!rows.length) return emptyChart("siPeopleChart", ui("I dati autori/vittime non sono ancora presenti nel payload selezionato.", "Offender/victim data are not yet present in the selected payload."));
    var grouped = peopleMetricGroups(rows, function (row) {
      return peopleBreakdownKey(row);
    }).sort(descValue).slice(0, 24).reverse();
    if (!grouped.length) return emptyChart("siPeopleChart", peopleRateUnavailableMessage());
    var yLabels = grouped.map(function (row) { return row.key; });
    plot("siPeopleChart", [{
      type: "bar",
      orientation: "h",
      x: grouped.map(function (row) { return row.value; }),
      y: yLabels,
      customdata: grouped.map(function (row) { return [formatInteger(row.rawValue)]; }),
      marker: { color: grouped.map(function (row, index) { return COLORS[index % COLORS.length]; }) },
      hovertemplate: peopleHoverTemplate()
    }], {
      xTitle: peopleValueAxisLabel(),
      marginLeft: marginForYLabels(yLabels, 210, 340),
      height: barChartHeight(grouped.length),
      yTickVals: yLabels,
      yTickText: yLabels
    });
  }

  function renderDemographyChart() {
    var rows = peopleSelectionRows().filter(function (row) { return row.age_group || row.sex; });
    els.siDemographyTag.textContent = rows.length ? roleLabel(STATE.role) + " - " + ui("sesso ed età", "sex and age") + " - " + peopleMeasureLabel() : ui("nessun dato", "no data");
    if (!rows.length) return emptyChart("siDemographyChart", ui("Sesso ed età non risultano nel perimetro selezionato.", "Sex and age are not available in the selected scope."));
    var grouped = peopleMetricGroups(rows, function (row) {
      return sexLabel(row.sex) + " - " + ageLabel(row.age_group);
    }).sort(descValue).slice(0, 20).reverse();
    if (!grouped.length) return emptyChart("siDemographyChart", peopleRateUnavailableMessage());
    var yLabels = grouped.map(function (row) { return row.key; });
    plot("siDemographyChart", [{
      type: "bar",
      orientation: "h",
      x: grouped.map(function (row) { return row.value; }),
      y: yLabels,
      customdata: grouped.map(function (row) { return [formatInteger(row.rawValue)]; }),
      marker: { color: "#d4a348" },
      hovertemplate: peopleHoverTemplate()
    }], {
      xTitle: peopleValueAxisLabel(),
      marginLeft: marginForYLabels(yLabels, 170, 340),
      height: barChartHeight(grouped.length),
      yTickVals: yLabels,
      yTickText: yLabels
    });
  }

  function renderSurveyChart(topic, chartId, tagId) {
    var tag = els[tagId];
    var keys = surveyControlKeys(topic);
    if (!STATE.surveyLoaded) return emptyChart(chartId, ui("Dati campionari in caricamento.", "Sample-survey data are loading."));
    var rows = filterSurveyRows(surveyRows(topic), keys, {});
    var topicLabel = surveyTopicLabel(topic);
    if (tag) tag.textContent = surveyChartTag(topic, rows);
    if (!rows.length) return emptyChart(chartId, ui("Nessun dato campionario per i filtri selezionati.", "No sample-survey data for the selected filters."));

    if (shouldRenderSurveyTimeline(rows, keys)) {
      return renderSurveyTimeline(chartId, rows);
    }
    return renderSurveyBars(chartId, rows, keys, topicLabel);
  }

  function renderSurveyTimeline(chartId, rows) {
    var grouped = aggregateSurveyRows(rows, function (row) { return row.period; }).sort(function (a, b) {
      return sortItalian(a.key, b.key);
    });
    plot(chartId, [{
      type: "scatter",
      mode: "lines+markers",
      name: ui("Serie storica", "Time series"),
      x: grouped.map(function (row) { return row.key; }),
      y: grouped.map(function (row) { return row.value; }),
      line: { color: "#ff5a1f", width: 3 },
      marker: { size: 7 },
      hovertemplate: "%{x}<br>%{y:.1f}<extra></extra>"
    }], {
      xTitle: ui("Periodo", "Period"),
      yTitle: surveyUnitLabel(rows),
      legend: false,
      height: 430
    });
  }

  function renderSurveyBars(chartId, rows, keys) {
    var grouped = aggregateSurveyRows(rows, function (row) { return surveyBarLabel(row, keys); })
      .sort(descValue)
      .slice(0, 28)
      .reverse();
    if (!grouped.length) return emptyChart(chartId, ui("Nessun dato campionario per i filtri selezionati.", "No sample-survey data for the selected filters."));
    var yLabels = grouped.map(function (row) { return tr(row.key); });
    plot(chartId, [{
      type: "bar",
      orientation: "h",
      x: grouped.map(function (row) { return row.value; }),
      y: yLabels,
      customdata: grouped.map(function (row) { return [row.count, row.unit]; }),
      marker: { color: grouped.map(function (_, index) { return COLORS[index % COLORS.length]; }) },
      hovertemplate: "%{y}<br>%{x:.1f}<extra></extra>"
    }], {
      xTitle: surveyUnitLabel(rows),
      marginLeft: marginForYLabels(yLabels, 220, 380),
      height: barChartHeight(grouped.length),
      yTickVals: yLabels,
      yTickText: yLabels
    });
  }

  function shouldRenderSurveyTimeline(rows, keys) {
    if ((STATE[keys.period] || "all") !== "all") return false;
    var periods = unique(rows.map(function (row) { return row.period; })).filter(Boolean);
    return periods.length > 1 && (STATE[keys.dimension] === "serie storica nazionale" || rows.length <= periods.length * 3);
  }

  function aggregateSurveyRows(rows, keyFn) {
    var buckets = {};
    rows.forEach(function (row) {
      var key = keyFn(row) || ui("Non classificato", "Unclassified");
      if (!buckets[key]) buckets[key] = { key: key, values: [], unit: row.unit || "" };
      if (isFiniteNumber(row.value)) buckets[key].values.push(Number(row.value));
      if (!buckets[key].unit && row.unit) buckets[key].unit = row.unit;
    });
    return Object.keys(buckets).map(function (key) {
      var values = buckets[key].values;
      return {
        key: key,
        value: values.length ? sumNumbers(values) / values.length : null,
        count: values.length,
        unit: buckets[key].unit
      };
    }).filter(function (row) {
      return isFiniteNumber(row.value);
    });
  }

  function peopleBreakdownKey(row) {
    var parts = [];
    if (STATE.crime === "TOT" && STATE.theme === "all") {
      parts.push(themeLabel(row._theme));
    } else if (STATE.crime === "all") {
      parts.push(crimeLabel(row));
    } else {
      parts.push(metricScopeLabel());
    }
    if (STATE.role === "all") parts.push(roleLabel(row.person_role));
    if (STATE.citizenship === "all") parts.push(citizenshipLabel(row.citizenship_group));
    return parts.filter(Boolean).join(" - ");
  }

  function peopleBreakdownLabel() {
    if (STATE.crime === "TOT" && STATE.theme === "all") return ui("categorie di reato", "offence categories");
    if (STATE.crime === "all") return themeLabel(STATE.theme);
    return crimeLabel({ crime_code: STATE.crime });
  }

  function roleLabel(value) {
    return tr(ROLE_LABELS[value] || labelize(value || "ruolo n.d."));
  }

  function roleValueAxisLabel() {
    if (STATE.role === "victim") return ui("Vittime registrate", "Registered victims");
    if (STATE.role === "offender") return ui("Autori / denunciati registrati", "Registered offenders / reported persons");
    return ui("Persone registrate", "Registered people");
  }

  function peopleMeasureLabel() {
    if (STATE.peopleMeasure === "share") return ui("Quota % del grafico", "Share of chart (%)");
    if (STATE.peopleMeasure === "rate") return ui("Tasso per 100.000 abitanti", "Rate per 100,000 inhabitants");
    if (STATE.peopleMeasure === "rate_1000") return ui("Tasso per 1.000 abitanti", "Rate per 1,000 inhabitants");
    return ui("Valori assoluti", "Absolute values");
  }

  function peopleValueAxisLabel() {
    return STATE.peopleMeasure === "absolute" ? roleValueAxisLabel() : peopleMeasureLabel();
  }

  function peopleMetricGroups(rows, keyFn) {
    var grouped = aggregateBy(rows, keyFn);
    var total = sum(grouped, function (row) { return row.value; });
    return grouped.map(function (group) {
      return {
        key: group.key,
        value: peopleMetricValueForGroup(group, total),
        rawValue: group.value,
        rows: group.rows
      };
    }).filter(function (group) {
      return isFiniteNumber(group.value);
    });
  }

  function peopleMetricValueForGroup(group, total) {
    if (STATE.peopleMeasure === "share") return total ? group.value / total * 100 : null;
    if (STATE.peopleMeasure === "rate" || STATE.peopleMeasure === "rate_1000") {
      var rows = group.rows || [];
      var population = populationForRows(rows);
      if (!isFiniteNumber(population) || population <= 0) return null;
      return group.value / population * (STATE.peopleMeasure === "rate_1000" ? 1000 : 100000);
    }
    return group.value;
  }

  function peopleHoverTemplate() {
    if (STATE.peopleMeasure === "share") {
      return "%{y}<br>" + ui("Quota", "Share") + ": %{x:.1f}%<br>" + ui("Valore assoluto", "Absolute value") + ": %{customdata[0]}<extra></extra>";
    }
    if (STATE.peopleMeasure === "rate" || STATE.peopleMeasure === "rate_1000") {
      return "%{y}<br>" + peopleMeasureLabel() + ": %{x:,.2f}<br>" + ui("Valore assoluto", "Absolute value") + ": %{customdata[0]}<extra></extra>";
    }
    return "%{y}<br>" + ui("Valore", "Value") + ": %{x:,.0f}<extra></extra>";
  }

  function peopleRateUnavailableMessage() {
    if (STATE.peopleMeasure === "rate" || STATE.peopleMeasure === "rate_1000") {
      return ui(
        "Non riesco a calcolare il tasso per i filtri selezionati perché manca la popolazione del territorio e anno corrispondenti. Usa valori assoluti o quota %.",
        "The selected rate cannot be calculated because the matching population for territory and year is missing. Use absolute values or percentage share."
      );
    }
    return ui("Nessun dato autori/vittime per i filtri selezionati.", "No offender/victim data for the selected filters.");
  }

  function measureUnavailableMessage(scope) {
    if (STATE.measure === "rate" || STATE.measure === "rate_1000") {
      return ui("Non riesco a calcolare il tasso per ", "The selected rate cannot be calculated for ") + scope + ui(" perché manca la popolazione del territorio e anno corrispondenti.", " because the matching population for territory and year is missing.");
    }
    return ui("La misura selezionata non e calcolabile per ", "The selected measure cannot be calculated for ") + scope + ".";
  }

  function renderCounterChart() {
    var rows = counterRows().sort(function (a, b) {
      return Math.abs(b.change_pct_yoy || 0) - Math.abs(a.change_pct_yoy || 0);
    }).slice(0, 20).reverse();
    els.siCounterTag.textContent = STATE.year + " - " + counterDirectionLabel();
    if (!rows.length) {
      emptyChart("siCounterChart", ui("Nessuna controtendenza nel perimetro selezionato.", "No countertrend in the selected scope."));
      els.siCounterTable.innerHTML = emptyMessage(ui("Nessuna controtendenza nel perimetro selezionato.", "No countertrend in the selected scope."));
      return;
    }
    plot("siCounterChart", [{
      type: "bar",
      orientation: "h",
      x: rows.map(function (row) { return row.change_pct_yoy; }),
      y: rows.map(function (row) { return territoryLabel(row) + " - " + crimeLabel(row); }),
      marker: { color: rows.map(function (row) { return row.change_pct_yoy >= 0 ? "#d96363" : "#5e9f65"; }) },
      hovertemplate: "%{y}<br>" + ui("Territorio", "Territory") + ": %{x:.1f}%<extra></extra>"
    }], { xTitle: ui("Variazione % annua", "Annual % change"), marginLeft: 220 });
  }

  function renderTables() {
    renderTerritoryTableBlock();
  }

  function renderTerritoryTableBlock() {
    return withChartState("siTerritoryTable", function () {
      var missing = missingReportedLevelsForCurrentView();
      if (missing.length) {
        renderDeferredLevelLoading(missing);
        ensureReportedLevels(missing).then(renderTerritoryTableBlock).catch(function (error) {
          setStatus(ui("Errore nel caricamento del livello territoriale: ", "Error loading territorial level: ") + error.message, "error");
        });
        return;
      }
      populateStaticFilters("siTerritoryTable");
      refreshDependentFilters("siTerritoryTable");
      syncControlVisibility("siTerritoryTable");
      if (els.siSearch) els.siSearch.value = STATE.search || "";
      renderTerritoryTable();
    });
  }

  function renderTerritoryTable() {
    var rows = territoryMetricRows().filter(matchesSearch).sort(descMetric).slice(0, 80);
    els.siTableTag.textContent = formatInteger(rows.length) + " " + ui("righe", "rows");
    if (!rows.length) {
      els.siTerritoryTable.innerHTML = emptyMessage(ui("Nessun territorio nel perimetro selezionato.", "No territory in the selected scope."));
      return;
    }
    els.siTerritoryTable.innerHTML = table([
      ["Territorio", "left"],
      ["Valore", "right"],
      ["Var. annua", "right"],
      ["Italia", "right"],
      ["Reato/categoria", "left"]
    ], rows.map(function (row) {
      return [
        territoryLabel(row) + codeLine(territoryContext(row)),
        formatNumber(metricValueForRow(row)),
        formatPercent(row.change_pct_yoy),
        formatPercent(row.national_change_pct_yoy),
        metricScopeLabelForRow(row)
      ];
    }));
  }

  function renderCounterTable() {
    var rows = counterRows().filter(matchesSearch).slice(0, 60);
    if (!rows.length) {
      els.siCounterTable.innerHTML = emptyMessage(ui("Nessuna controtendenza nel perimetro selezionato.", "No countertrend in the selected scope."));
      return;
    }
    els.siCounterTable.innerHTML = table([
      ["Territorio", "left"],
      ["Reato", "left"],
      ["Valore", "right"],
      ["Territorio", "right"],
      ["Italia", "right"]
    ], rows.map(function (row) {
      return [
        territoryLabel(row) + codeLine(territoryContext(row)),
        crimeLabel(row),
        formatInteger(row.value),
        formatPercent(row.change_pct_yoy),
        formatPercent(row.national_change_pct_yoy)
      ];
    }));
  }

  function trendSeries() {
    var base = reportedRows().filter(areaFilter).filter(metricCrimeFilter);
    var entities = selectedSeriesEntities(base);
    return entities.map(function (entity) {
      var points = years().map(function (year) {
        var rows = base.filter(function (row) {
          return row.year === year && row.territory_level === entity.level && row.territory_code === entity.code;
        });
        return { year: year, value: sumMetricRows(rows), raw: rows };
      });
      return { name: entity.label, points: points };
    }).filter(function (serie) {
      return serie.points.some(function (point) { return isFiniteNumber(point.value) && point.value !== 0; });
    });
  }

  function selectedSeriesEntities(base) {
    var entities = [];
    if (STATE.level === "national") {
      entities.push({ level: "national", code: "IT", label: levelLabel("national") });
      return entities;
    }
    if (STATE.territory !== "all") {
      var selected = base.find(function (row) {
        return row.territory_level === STATE.level && row.territory_code === STATE.territory;
      });
      if (selected && selected.territory_code !== "IT") {
        entities.push({ level: selected.territory_level, code: selected.territory_code, label: territoryLabel(selected) });
      }
    }
    if (STATE.compareTerritory !== "all") {
      var compared = base.find(function (row) {
        return row.territory_level === STATE.level && row.territory_code === STATE.compareTerritory;
      });
      if (compared && compared.territory_code !== "IT") {
        entities.push({ level: compared.territory_level, code: compared.territory_code, label: territoryLabel(compared) });
      }
      return uniqueEntities(entities);
    }
    if (STATE.territory !== "all") return uniqueEntities(entities);
    if (STATE.region === "all" && STATE.province === "all") {
      entities.push({ level: "national", code: "IT", label: levelLabel("national") });
      return uniqueEntities(entities);
    }
    if (STATE.region !== "all" || STATE.province !== "all") {
      var filtered = territoryMetricRows().sort(descMetric)[0];
      if (filtered && filtered.territory_code !== "IT") {
        entities.push({ level: filtered.territory_level, code: filtered.territory_code, label: territoryLabel(filtered) });
      }
    }
    return uniqueEntities(entities);
  }

  function territoryMetricRows() {
    var current = reportedRows()
      .filter(function (row) { return row.year === STATE.year; })
      .filter(areaFilter)
      .filter(metricCrimeFilter);
    var grouped = aggregateRows(current, ["territory_level", "territory_code"], function (row) {
      return {
        territory_level: row.territory_level,
        territory_code: row.territory_code,
        territory_name: row.territory_name,
        region: row.region,
        province: row.province,
        capital: row.capital,
        crime_code: row.crime_code,
        _theme: row._theme,
        value: 0,
        population: populationForRecord(row),
        value_rate_per_100k: row.value_rate_per_100k,
        change_pct_yoy: row.change_pct_yoy,
        national_change_pct_yoy: row.national_change_pct_yoy
      };
    });
    return grouped.filter(function (row) {
      return row.territory_level === STATE.level && (STATE.territory === "all" || row.territory_code === STATE.territory);
    });
  }

  function selectedTerritoryRows(year) {
    return reportedRows().filter(function (row) {
      if (year !== null && year !== undefined && row.year !== year) return false;
      if (STATE.territory !== "all") return row.territory_level === STATE.level && row.territory_code === STATE.territory;
      if (STATE.level === "national") return row.territory_level === "national";
      if (STATE.region !== "all" || STATE.province !== "all") return row.territory_level === STATE.level && areaFilter(row);
      return row.territory_level === "national";
    });
  }

  function peopleSelectionRows() {
    var base = peopleRows()
      .filter(function (row) { return row.year === STATE.year; })
      .filter(function (row) { return STATE.role === "all" || row.person_role === STATE.role; })
      .filter(function (row) {
        return normalizedCitizenshipGroup(row) === STATE.citizenship;
      });
    var local = base.filter(peopleAreaFilter).filter(peopleCrimeFilter);
    if (local.length) return local;
    var national = base.filter(function (row) { return row.territory_level === "national"; }).filter(peopleCrimeFilter);
    if (national.length) return national;
    return base.filter(function (row) { return row.territory_level === "national"; });
  }

  function homicideSelectedOption() {
    return HOMICIDE_OPTIONS.find(function (option) { return option.value === STATE.homicideType; }) || HOMICIDE_OPTIONS[0];
  }

  function homicideSelectedCodes() {
    return homicideSelectedOption().codes.slice();
  }

  function homicideTypeLabel() {
    return tr(homicideSelectedOption().label);
  }

  function homicideShortLabel(code) {
    code = String(code || "").toUpperCase();
    return tr(HOMICIDE_SHORT_LABELS[code] || crimeLabel({ crime_code: code }));
  }

  function homicideCodeKind(code) {
    if (code === "ATTEMPHOM") return ui("tentato, non consumato", "attempted, not completed");
    if (code === "ROADHOM") return ui("voce specifica: può non essere sommabile agli aggregati", "specific item: it may not be additive with aggregates");
    if (HOMICIDE_MAIN_CODES.indexOf(code) >= 0) return ui("aggregato principale", "main aggregate");
    return ui("dettaglio o sottocategoria: non sommare automaticamente agli aggregati", "detail or subcategory: do not automatically add it to aggregates");
  }

  function homicideSeriesEntities() {
    var codes = homicideSelectedCodes();
    var entities = [];
    if (STATE.level === "national") {
      entities.push({ level: "national", code: "IT", label: levelLabel("national") });
      return entities;
    }
    var rows = reportedRows().filter(function (row) {
      return row.year === STATE.year && row.territory_level === STATE.level && codes.indexOf(row.crime_code) >= 0 && areaFilter(row);
    });
    if (STATE.territory !== "all") {
      var selected = rows.find(function (row) { return row.territory_code === STATE.territory; });
      if (selected && selected.territory_code !== "IT") entities.push({ level: selected.territory_level, code: selected.territory_code, label: territoryLabel(selected) });
    }
    if (STATE.compareTerritory !== "all") {
      var compared = rows.find(function (row) { return row.territory_code === STATE.compareTerritory; });
      if (compared && compared.territory_code !== "IT") entities.push({ level: compared.territory_level, code: compared.territory_code, label: territoryLabel(compared) });
    }
    if (entities.length) return uniqueEntities(entities);
    if (STATE.region === "all" && STATE.province === "all") {
      entities.push({ level: "national", code: "IT", label: levelLabel("national") });
      return uniqueEntities(entities);
    }
    if (STATE.territory === "all" && STATE.compareTerritory === "all" && STATE.level !== "national" && (STATE.region !== "all" || STATE.province !== "all")) {
      var top = homicideTerritoryRows().sort(function (a, b) {
        return (homicideTerritoryMetric(b) || 0) - (homicideTerritoryMetric(a) || 0);
      })[0];
      if (top && top.territory_code !== "IT") entities.push({ level: top.territory_level, code: top.territory_code, label: territoryLabel(top) });
    }
    return uniqueEntities(entities);
  }

  function homicideTerritoryRows() {
    var codes = homicideSelectedCodes();
    var current = reportedRows().filter(function (row) {
      return row.year === STATE.year && row.territory_level === STATE.level && codes.indexOf(row.crime_code) >= 0 && areaFilter(row) && (STATE.territory === "all" || row.territory_code === STATE.territory);
    });
    var previous = reportedRows().filter(function (row) {
      return row.year === previousYear() && row.territory_level === STATE.level && codes.indexOf(row.crime_code) >= 0 && areaFilter(row) && (STATE.territory === "all" || row.territory_code === STATE.territory);
    });
    var previousMap = {};
    aggregateHomicideTerritories(previous).forEach(function (row) {
      previousMap[row.territory_level + "||" + row.territory_code] = row.value;
    });
    return aggregateHomicideTerritories(current).map(function (row) {
      row.change_pct_yoy = percentChange(row.value, previousMap[row.territory_level + "||" + row.territory_code]);
      return row;
    });
  }

  function aggregateHomicideTerritories(rows) {
    return aggregateRows(rows, ["territory_level", "territory_code"], function (row) {
      return {
        territory_level: row.territory_level,
        territory_code: row.territory_code,
        territory_name: row.territory_name,
        region: row.region,
        province: row.province,
        capital: row.capital,
        crime_code: row.crime_code,
        _theme: row._theme,
        value: 0,
        population: populationForRecord(row),
        value_rate_per_100k: row.value_rate_per_100k
      };
    });
  }

  function homicideTerritoryMetric(row) {
    if (STATE.measure === "yoy") return row.change_pct_yoy;
    return metricValueForRow(row);
  }

  function homicidePeopleRows() {
    var codes = homicideSelectedCodes();
    var rows = peopleRows().filter(function (row) {
      return row.year === STATE.year && row.territory_level === "national" && codes.indexOf(row.crime_code) >= 0 && (STATE.role === "all" || row.person_role === STATE.role);
    });
    if (STATE.homicidePeopleBreakdown === "citizenship") {
      if (STATE.citizenship !== "totale_cittadinanza") {
        rows = rows.filter(function (row) { return normalizedCitizenshipGroup(row) === STATE.citizenship; });
      }
    } else {
      rows = rows.filter(function (row) { return normalizedCitizenshipGroup(row) === STATE.citizenship; });
    }

    var detailedRows = rows.filter(function (row) {
      if (STATE.homicideSex !== "all" && String(row.sex) !== String(STATE.homicideSex)) return false;
      if (STATE.homicideAgeGroup !== "all" && String(row.age_group) !== String(STATE.homicideAgeGroup)) return false;
      return !isTotalSex(row.sex) && !isTotalAgeGroup(row.age_group);
    });
    if (detailedRows.length) return detailedRows;

    return rows.filter(function (row) {
      var sexMatches = STATE.homicideSex === "all" ? isTotalSex(row.sex) : String(row.sex) === String(STATE.homicideSex);
      var ageMatches = STATE.homicideAgeGroup === "all" ? isTotalAgeGroup(row.age_group) : String(row.age_group) === String(STATE.homicideAgeGroup);
      return sexMatches && ageMatches;
    });
  }

  function homicidePeopleBreakdownKey(row) {
    if (STATE.homicidePeopleBreakdown === "citizenship") return citizenshipLabel(normalizedCitizenshipGroup(row));
    if (STATE.homicidePeopleBreakdown === "sex") return sexLabel(row.sex);
    if (STATE.homicidePeopleBreakdown === "age") return ageLabel(row.age_group);
    if (STATE.homicidePeopleBreakdown === "crime") return crimeLabel(row);
    return sexLabel(row.sex) + " - " + ageLabel(row.age_group);
  }

  function homicideSexOptions() {
    var values = unique(peopleRows().filter(function (row) {
      return HOMICIDE_CODES.indexOf(row.crime_code) >= 0 && !isTotalSex(row.sex);
    }).map(function (row) { return String(row.sex); })).sort(sortItalian);
    return [{ value: "all", label: ui("Tutti", "All") }].concat(values.map(function (value) {
      return { value: value, label: sexLabel(value) };
    }));
  }

  function homicideAgeOptions() {
    var values = unique(peopleRows().filter(function (row) {
      return HOMICIDE_CODES.indexOf(row.crime_code) >= 0 && !isTotalAgeGroup(row.age_group);
    }).map(function (row) { return String(row.age_group); })).sort(sortItalian);
    return [{ value: "all", label: ui("Tutte le età", "All ages") }].concat(values.map(function (value) {
      return { value: value, label: ageLabel(value) };
    }));
  }

  function isTotalSex(value) {
    value = String(value || "").toUpperCase();
    return value === "" || value === "9" || value === "T" || value === "TOTAL";
  }

  function isTotalAgeGroup(value) {
    value = String(value || "").toUpperCase();
    return value === "" || value === "TOTAL" || value === "Y_TOTAL" || value === "9" || value === "T";
  }

  function counterRows() {
    return reportedRows()
      .filter(function (row) { return row.year === STATE.year && row.is_countertrend_vs_national === true; })
      .filter(areaFilter)
      .filter(metricCrimeFilter)
      .filter(function (row) { return row.territory_level === STATE.level; })
      .filter(function (row) { return STATE.territory === "all" || row.territory_code === STATE.territory; })
      .filter(function (row) { return STATE.counterDirection === "all" || counterDirection(row) === STATE.counterDirection; })
      .sort(function (a, b) { return Math.abs(b.change_pct_yoy || 0) - Math.abs(a.change_pct_yoy || 0); });
  }

  function counterDirection(row) {
    if ((row.change_pct_yoy || 0) > 0 && (row.national_change_pct_yoy || 0) < 0) return "worse";
    if ((row.change_pct_yoy || 0) < 0 && (row.national_change_pct_yoy || 0) > 0) return "better";
    return "other";
  }

  function counterDirectionLabel() {
    if (STATE.counterDirection === "worse") return ui("peggiora mentre Italia migliora", "worsens while Italy improves");
    if (STATE.counterDirection === "better") return ui("migliora mentre Italia peggiora", "improves while Italy worsens");
    return ui("tutte le controtendenze", "all countertrends");
  }

  function aggregateNationalForCrime(code, year) {
    if (!year) return null;
    return sum(reportedRows().filter(function (row) {
      return row.year === year && row.territory_level === "national" && row.crime_code === code;
    }), function (row) { return row.value; });
  }

  function metricCrimeFilter(row) {
    if (STATE.crime !== "all") return row.crime_code === STATE.crime;
    if (STATE.theme === "all") return row.crime_code === "TOT";
    return row.crime_code !== "TOT" && row._theme === STATE.theme;
  }

  function contributionCrimeFilter(row) {
    return selectedNonTotalCrimeFilter(row);
  }

  function peopleCrimeFilter(row) {
    if (STATE.crime !== "all" && STATE.crime !== "TOT") return row.crime_code === STATE.crime;
    if (STATE.theme !== "all") return row.crime_code !== "TOT" && row._theme === STATE.theme;
    return row.crime_code !== "TOT";
  }

  function nonTotalReported(row) {
    return row.indicator_group === "reported_crimes" && row.crime_code !== "TOT";
  }

  function selectedNonTotalCrimeFilter(row) {
    if (!nonTotalReported(row)) return false;
    if (STATE.crime !== "all" && STATE.crime !== "TOT") return row.crime_code === STATE.crime;
    if (STATE.theme !== "all") return row._theme === STATE.theme;
    return true;
  }

  function areaFilter(row) {
    if (row.territory_level === "national") return true;
    if (STATE.region !== "all" && row.region !== STATE.region) return false;
    if (STATE.province !== "all" && row.province !== STATE.province) return false;
    return true;
  }

  function peopleAreaFilter(row) {
    if (row.territory_level === STATE.level && areaFilter(row)) return true;
    return row.territory_level === "national" && STATE.territory === "all";
  }

  function matchesSearch(row) {
    if (!STATE.search) return true;
    return [
      territoryLabel(row), territoryContext(row), crimeLabel(row), row.crime_code, row.region, row.province
    ].join(" ").toLowerCase().indexOf(STATE.search) >= 0;
  }

  function reportedRows() {
    return STATE.records.filter(function (row) {
      return row.indicator_group === "reported_crimes" && isAllowedTerritoryRow(row);
    });
  }

  function isAllowedTerritoryRow(row) {
    if (!row || row.territory_level !== "capital") return true;
    var labels = (STATE.meta && STATE.meta.territory_labels && STATE.meta.territory_labels.capital) || {};
    var keys = Object.keys(labels);
    if (!keys.length) return true;
    return Boolean(labels[String(row.territory_code || "")]);
  }

  function peopleRows() {
    return STATE.records.filter(function (row) { return row.indicator_group === "people"; });
  }

  function populationRows() {
    return STATE.populationRecords || [];
  }

  function surveyRows(topic) {
    return (STATE.surveyRecords || []).filter(function (row) {
      return row.indicator_group === "survey" && (!topic || row.topic === topic);
    });
  }

  function surveyControlKeys(topic) {
    if (topic === "victimization") {
      return {
        indicator: "surveyVictimizationIndicator",
        dimension: "surveyVictimizationDimension",
        crime: "surveyVictimizationCrime",
        response: "surveyVictimizationResponse",
        unit: "surveyVictimizationUnit",
        period: "surveyVictimizationPeriod"
      };
    }
    if (topic === "reporting_propensity") {
      return {
        indicator: "surveyReportingIndicator",
        dimension: "surveyReportingDimension",
        crime: "surveyReportingCrime",
        response: "surveyReportingResponse",
        period: "surveyReportingPeriod"
      };
    }
    return {
      indicator: "surveyPerceptionIndicator",
      dimension: "surveyPerceptionDimension",
      response: "surveyPerceptionResponse",
      period: "surveyPerceptionPeriod"
    };
  }

  function allowAllSurveyPeriods(topic, keys) {
    return topic === "perception" && STATE[keys.dimension] === "serie storica nazionale";
  }

  function compareSurveyPeriodsDesc(a, b) {
    var diff = surveyPeriodSortValue(b) - surveyPeriodSortValue(a);
    return diff || sortItalian(b, a);
  }

  function surveyPeriodSortValue(period) {
    var matches = String(period || "").match(/(?:19|20)\d{2}/g) || [];
    return matches.length ? Number(matches[matches.length - 1]) : -Infinity;
  }

  function filterSurveyRows(rows, keys, options) {
    options = options || {};
    return (rows || []).filter(function (row) {
      if (!surveyFilterSkips(options, "indicator") && STATE[keys.indicator] && STATE[keys.indicator] !== "all" && row.indicator !== STATE[keys.indicator]) return false;
      if (!surveyFilterSkips(options, "dimension") && STATE[keys.dimension] && STATE[keys.dimension] !== "all" && row.dimension_type !== STATE[keys.dimension]) return false;
      if (keys.crime && !surveyFilterSkips(options, "crime") && STATE[keys.crime] && STATE[keys.crime] !== "all" && row.crime_name !== STATE[keys.crime]) return false;
      if (keys.unit && !surveyFilterSkips(options, "unit") && STATE[keys.unit] && STATE[keys.unit] !== "all" && row.unit !== STATE[keys.unit]) return false;
      if (!surveyFilterSkips(options, "response") && STATE[keys.response] && STATE[keys.response] !== "all" && surveyResponseValue(row) !== STATE[keys.response]) return false;
      if (!surveyFilterSkips(options, "period") && STATE[keys.period] && STATE[keys.period] !== "all" && row.period !== STATE[keys.period]) return false;
      return true;
    });
  }

  function surveyFilterSkips(options, name) {
    var skip = options && options.skip;
    return Array.isArray(skip) ? skip.indexOf(name) >= 0 : skip === name;
  }

  function surveyResponseValue(row) {
    return row.reason || row.location || row.response || row.crime_status || "";
  }

  function surveyBarLabel(row, keys) {
    var pieces = [];
    var dimensionValue = surveyDimensionValue(row);
    if (dimensionValue) pieces.push(dimensionValue);
    else if (row.indicator) pieces.push(row.indicator);
    appendUniquePiece(pieces, keys.crime && STATE[keys.crime] === "all" ? row.crime_name : "");
    appendUniquePiece(pieces, STATE[keys.response] === "all" ? surveyResponseValue(row) : "");
    appendUniquePiece(pieces, STATE[keys.period] === "all" ? row.period : "");
    return pieces.filter(Boolean).join(" - ");
  }

  function appendUniquePiece(pieces, value) {
    value = String(value || "").trim();
    if (value && pieces.indexOf(value) < 0) pieces.push(value);
  }

  function surveyDimensionValue(row) {
    if (!row) return "";
    if (row.dimension_type === "sesso ed età") return [sexLabel(row.sex), ageLabel(row.age_group)].filter(Boolean).join(" - ");
    if (row.dimension_type === "sesso") return sexLabel(row.sex);
    if (row.dimension_type === "età") return ageLabel(row.age_group);
    if (row.dimension_type === "ampiezza del comune") return row.municipality_size || row.territory_name;
    if (row.dimension_type === "ripartizione geografica") return row.macro_area || row.territory_name;
    if (row.dimension_type === "regione") return row.region || row.territory_name;
    if (row.dimension_type === "titolo di studio") return row.education;
    if (row.dimension_type === "reato") return row.crime_name || row.response;
    if (row.dimension_type === "motivo") return row.reason;
    if (row.dimension_type === "luogo") return row.location;
    if (row.dimension_type === "caratteristiche attribuite agli autori") return row.response;
    if (row.dimension_type === "serie storica nazionale") return row.indicator;
    if (row.dimension_type === "totale") return row.territory_name || row.response || row.indicator;
    return row.territory_name || row.macro_area || row.municipality_size || row.response || row.indicator;
  }

  function surveyUnitLabel(rows) {
    var units = unique((rows || []).map(function (row) { return row.unit; })).filter(Boolean);
    if (!units.length) return ui("Valore", "Value");
    if (units.length === 1) return surveyUnitDisplayLabel(units[0]);
    return ui("Valore percentuale", "Percentage value");
  }

  function surveyUnitDisplayLabel(unit) {
    if (unit === "% persone di 14 anni e più") return ui("% persone di 14 anni e più", "% people aged 14+");
    if (unit === "% famiglie") return ui("% famiglie", "% households");
    if (unit === "% popolazione o famiglie di riferimento") return ui("% sul riferimento del reato", "% of the relevant population/households");
    if (unit === "migliaia di persone o famiglie") return ui("migliaia, secondo il riferimento del reato", "thousands, based on the offence reference unit");
    if (unit === "% vittime dello stesso reato") return ui("% vittime dello stesso reato", "% victims of the same offence");
    if (unit === "% vittime dello stesso reato e della stessa zona") return ui("% vittime dello stesso reato e zona", "% victims of the same offence and area");
    if (unit === "% vittime dello stesso reato che hanno denunciato") return ui("% vittime che hanno denunciato", "% victims who reported");
    if (unit === "% vittime dello stesso reato che non hanno denunciato") return ui("% vittime che non hanno denunciato", "% victims who did not report");
    return tr(unit);
  }

  function surveyChartTag(topic, rows) {
    var keys = surveyControlKeys(topic);
    var period = STATE[keys.period] && STATE[keys.period] !== "all" ? STATE[keys.period] : surveyRowsPeriodLabel(rows);
    var dimension = STATE[keys.dimension] && STATE[keys.dimension] !== "all" ? surveyDimensionLabel(STATE[keys.dimension]) : ui("tutti i dettagli", "all details");
    return surveyTopicLabel(topic) + " - " + dimension + " - " + period;
  }

  function surveyRowsPeriodLabel(rows) {
    var periods = unique((rows || []).map(function (row) { return row.period; })).filter(Boolean).sort(compareSurveyPeriodsDesc);
    if (periods.length === 1) return periods[0];
    return ui("tutti i periodi", "all periods");
  }

  function surveyTopicLabel(topic) {
    return tr(SURVEY_TOPIC_LABELS[topic] || labelize(topic || "survey"));
  }

  function surveyDimensionLabel(value) {
    return tr(SURVEY_DIMENSION_LABELS[value] || labelize(value || "dettaglio n.d."));
  }

  function keepValidSelection(stateKey, options, fallback) {
    if (!stateKey) return;
    if (!options.some(function (option) { return String(option.value) === String(STATE[stateKey]); })) {
      STATE[stateKey] = fallback;
    }
  }

  function normalizedCitizenshipGroup(row) {
    var raw = String(row && row.citizenship_group || "").trim();
    var text = String(row && (row.citizenship || row.person_category || row.person_code || "") || "").toLowerCase();
    if (raw === "immigrati_o_stranieri") return raw;
    if (raw === "italiani_o_non_immigrati") return raw;
    if (raw === "totale_cittadinanza") return raw;
    if (raw === "non_residenti") return raw;
    if (text.indexOf("non resident") >= 0) return "non_residenti";
    return raw || "non_classificato";
  }

  function sortCitizenshipGroup(a, b) {
    var left = CITIZENSHIP_ORDER.indexOf(a);
    var right = CITIZENSHIP_ORDER.indexOf(b);
    left = left >= 0 ? left : 999;
    right = right >= 0 ? right : 999;
    return left === right ? sortItalian(citizenshipLabel(a), citizenshipLabel(b)) : left - right;
  }

  function territoryRowsForControls() {
    var seen = {};
    return reportedRows().filter(function (row) {
      if (row.year !== STATE.year || row.territory_level !== STATE.level || row.crime_code !== "TOT") return false;
      if (!areaFilter(row)) return false;
      if (seen[row.territory_code]) return false;
      seen[row.territory_code] = true;
      return true;
    });
  }

  function crimeOptionsForTheme() {
    var codes = unique(reportedRows().map(function (row) { return row.crime_code; })).filter(Boolean);
    if (STATE.theme !== "all") {
      codes = codes.filter(function (code) { return code !== "TOT" && themeForCrime(code) === STATE.theme; });
      return [{ value: "all", label: ui("Tutti i reati della categoria", "All offences in the category") }].concat(codes.sort(sortCrimeLabel).map(crimeOption));
    }
    codes = codes.sort(sortCrimeLabel);
    return codes.map(crimeOption);
  }

  function topCrimeCodeForSelection() {
    var rows = selectedTerritoryRows(STATE.year).filter(nonTotalReported).sort(descValue);
    return rows.length ? rows[0].crime_code : "TOT";
  }

  function transformSeriesValues(points) {
    var values = points.map(function (point) { return { year: point.year, value: point.value }; });
    if (STATE.measure === "index") {
      var first = values.find(function (point) { return point.value && point.value !== 0; });
      return values.map(function (point) {
        return { year: point.year, value: first ? point.value / first.value * 100 : null };
      });
    }
    if (STATE.measure === "moving_average") {
      return values.map(function (point, index) {
        var windowValues = values.slice(Math.max(0, index - 2), index + 1).map(function (item) { return item.value; }).filter(isFiniteNumber);
        return { year: point.year, value: windowValues.length ? sumNumbers(windowValues) / windowValues.length : null };
      });
    }
    if (STATE.measure === "yoy") {
      return points.map(function (point) {
        var firstRow = point.raw && point.raw[0];
        if (firstRow) return { year: point.year, value: firstRow.change_pct_yoy };
        var previous = values.find(function (item) { return item.year === point.year - 1; });
        return { year: point.year, value: previous ? percentChange(point.value, previous.value) : null };
      });
    }
    return values;
  }

  function valueForMeasureBase(row) {
    if (STATE.measure === "rate") return rateValueForRow(row, 100000);
    if (STATE.measure === "rate_1000") return rateValueForRow(row, 1000);
    return row.value;
  }

  function sumMetricRows(rows) {
    if (STATE.measure === "rate" || STATE.measure === "rate_1000") {
      return metricValueForGroupedRows(rows, sumNumbers(rows.map(function (row) { return row.value; })));
    }
    var values = rows.map(valueForMeasureBase);
    var finiteValues = values.filter(isFiniteNumber);
    return finiteValues.length ? sumNumbers(finiteValues) : null;
  }

  function metricValueForGroupedRows(rows, value) {
    if (STATE.measure === "rate" || STATE.measure === "rate_1000") {
      var population = populationForRows(rows);
      if (!isFiniteNumber(population) || population <= 0 || !isFiniteNumber(value)) return null;
      return Number(value) / Number(population) * (STATE.measure === "rate_1000" ? 1000 : 100000);
    }
    return value;
  }

  function metricValueForRow(row) {
    if (STATE.measure === "rate") return rateValueForRow(row, 100000);
    if (STATE.measure === "rate_1000") return rateValueForRow(row, 1000);
    if (STATE.measure === "yoy") return row.change_pct_yoy;
    return row.value;
  }

  function rateValueForRow(row, per) {
    var population = populationForRecord(row);
    if (isFiniteNumber(population) && population > 0 && isFiniteNumber(row.value)) {
      return Number(row.value) / Number(population) * per;
    }
    if (per === 100000 && isFiniteNumber(row.value_rate_per_100k)) return row.value_rate_per_100k;
    if (per === 1000 && isFiniteNumber(row.value_rate_per_100k)) return row.value_rate_per_100k / 100;
    return null;
  }

  function populationForRows(rows) {
    var expected = {};
    var populations = {};
    (rows || []).forEach(function (row) {
      var key = populationKey(row);
      if (!key) return;
      expected[key] = true;
      var population = populationForRecord(row);
      if (isFiniteNumber(population) && population > 0) populations[key] = Number(population);
    });
    var keys = Object.keys(expected);
    if (!keys.length || keys.some(function (key) { return !isFiniteNumber(populations[key]); })) return null;
    return sumNumbers(keys.map(function (key) { return populations[key]; }));
  }

  function populationForRecord(row) {
    if (!row) return null;
    if (isFiniteNumber(row.population) && row.population > 0) return Number(row.population);
    var inferred = populationFromRate(row);
    if (isFiniteNumber(inferred) && inferred > 0) return inferred;
    var key = populationKeyParts(row);
    if (!key) return null;
    var loaded = populationFromLoadedRows(row, key);
    if (isFiniteNumber(loaded) && loaded > 0) return loaded;
    return populationFromReportedRows(key.year, key.level, key.code);
  }

  function populationFromLoadedRows(sourceRow, key) {
    var sourceName = String(sourceRow.territory_name || sourceRow.region || sourceRow.province || sourceRow.capital || "").trim();
    var candidates = populationRows().filter(function (row) {
      if (row.year !== key.year || row.territory_level !== key.level) return false;
      if (row.territory_code === key.code) return true;
      if (sourceName && row.territory_name === sourceName) return true;
      if (sourceRow.region && row.region === sourceRow.region) return true;
      if (sourceRow.province && row.province === sourceRow.province) return true;
      if (sourceRow.capital && row.capital === sourceRow.capital) return true;
      return false;
    });
    return candidates.length ? candidates[0].population : null;
  }

  function populationFromReportedRows(year, level, code) {
    var candidates = reportedRows().filter(function (row) {
      return row.year === year && row.territory_level === level && row.territory_code === code && row.crime_code === "TOT";
    });
    if (!candidates.length) {
      candidates = reportedRows().filter(function (row) {
        return row.year === year && row.territory_level === level && row.territory_code === code;
      });
    }
    for (var i = 0; i < candidates.length; i += 1) {
      var population = populationFromRate(candidates[i]);
      if (isFiniteNumber(population) && population > 0) return population;
    }
    return null;
  }

  function populationFromRate(row) {
    if (!row || !isFiniteNumber(row.value) || !isFiniteNumber(row.value_rate_per_100k) || Number(row.value_rate_per_100k) <= 0) return null;
    return Number(row.value) / Number(row.value_rate_per_100k) * 100000;
  }

  function populationKey(row) {
    var parts = populationKeyParts(row);
    return parts ? [parts.year, parts.level, parts.code].join("||") : "";
  }

  function populationKeyParts(row) {
    if (!row || !isFiniteNumber(row.year)) return null;
    var level = row.territory_level || "national";
    var code = row.territory_code || (level === "national" ? "IT" : "");
    return code ? { year: row.year, level: level, code: code } : null;
  }

  function aggregateRows(rows, keys, makeBase) {
    var buckets = {};
    rows.forEach(function (row) {
      var key = keys.map(function (column) { return row[column] || ""; }).join("||");
      if (!buckets[key]) {
        buckets[key] = makeBase(row);
        buckets[key].value = 0;
        if ("value_rate_per_100k" in buckets[key]) buckets[key].value_rate_per_100k = 0;
      }
      buckets[key].value += row.value || 0;
      if ("value_rate_per_100k" in buckets[key] && !buckets[key]._missingRate) {
        if (isFiniteNumber(row.value_rate_per_100k)) {
          buckets[key].value_rate_per_100k += Number(row.value_rate_per_100k);
        } else {
          buckets[key].value_rate_per_100k = null;
          buckets[key]._missingRate = true;
        }
      }
    });
    return Object.keys(buckets).map(function (key) {
      delete buckets[key]._missingRate;
      return buckets[key];
    });
  }

  function aggregateBy(rows, keyFn) {
    var buckets = {};
    rows.forEach(function (row) {
      var key = keyFn(row) || "Non classificato";
      if (!buckets[key]) buckets[key] = { key: key, value: 0, rows: [] };
      buckets[key].value += row.value || 0;
      buckets[key].rows.push(row);
    });
    return Object.keys(buckets).map(function (key) { return buckets[key]; });
  }

  function mapByKey(rows) {
    var out = {};
    rows.forEach(function (row) { out[row.key] = row; });
    return out;
  }

  function barChartHeight(rowCount) {
    return Math.max(440, rowCount * 34 + 150);
  }

  function marginForYLabels(labels, minWidth, maxWidth) {
    var longest = labels.reduce(function (max, label) {
      return Math.max(max, String(label || "").length);
    }, 0);
    return Math.max(minWidth, Math.min(maxWidth, longest * 8 + 36));
  }

  function plot(id, traces, options) {
    var el = document.getElementById(id);
    if (!el) return;
    if (!window.Plotly) {
      el.innerHTML = '<div class="si-chart-empty">Libreria grafici non caricata.</div>';
      return;
    }
    el.innerHTML = "";
    var theme = currentTheme();
    var chartWidth = el.clientWidth || window.innerWidth || 900;
    var leftMargin = (options && options.marginLeft) || 64;
    if (chartWidth < 520) leftMargin = Math.min(leftMargin, 138);
    else if (chartWidth < 760) leftMargin = Math.min(leftMargin, 180);
    var layout = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: cssVar("--text", theme === "light" ? "#17120f" : "#f5f2ed"), family: "system-ui, -apple-system, Segoe UI, sans-serif" },
      margin: { t: 24, r: 18, b: 56, l: leftMargin },
      xaxis: { title: options && options.xTitle || "", gridcolor: cssVar("--line", "#303030"), zerolinecolor: cssVar("--line", "#303030") },
      yaxis: { title: options && options.yTitle || "", gridcolor: cssVar("--line", "#303030"), zerolinecolor: cssVar("--line", "#303030"), automargin: true },
      showlegend: Boolean(options && options.legend),
      legend: { orientation: "h", y: 1.08 },
      barmode: options && options.barmode || undefined,
      hoverlabel: { bgcolor: cssVar("--panel", "#090909"), bordercolor: cssVar("--line", "#303030"), font: { color: cssVar("--text", "#f5f2ed") } }
    };
    if (options && options.noAxes) {
      delete layout.xaxis;
      delete layout.yaxis;
      layout.margin = { t: 8, r: 8, b: 8, l: 8 };
    }
    if (options && options.height) {
      layout.height = options.height;
      el.style.minHeight = String(options.height) + "px";
    } else {
      el.style.minHeight = "";
    }
    if (options && options.yTickVals && layout.yaxis) {
      layout.yaxis.tickmode = "array";
      layout.yaxis.tickvals = options.yTickVals;
      layout.yaxis.ticktext = options.yTickText || options.yTickVals;
      layout.yaxis.tickfont = { size: 12 };
      layout.yaxis.categoryorder = "array";
      layout.yaxis.categoryarray = options.yTickVals;
    }
    if (options && options.yearAxis) {
      var axisYears = years().map(yearLabel);
      var yearStep = chartWidth < 520 ? 3 : chartWidth < 780 ? 2 : 1;
      var tickYears = axisYears.filter(function (_, index) {
        return index % yearStep === 0 || index === axisYears.length - 1;
      });
      layout.xaxis.type = "category";
      layout.xaxis.tickmode = "array";
      layout.xaxis.tickvals = tickYears;
      layout.xaxis.ticktext = tickYears;
      layout.xaxis.categoryorder = "array";
      layout.xaxis.categoryarray = axisYears;
    }
    el.innerHTML = "";
    Plotly.newPlot(el, traces, layout, { responsive: true, displayModeBar: false });
  }

  function emptyChart(id, message) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = '<div class="si-chart-empty">' + escapeHtml(tr(message)) + "</div>";
  }

  function updateChartNarrative(id) {
    var chart = document.getElementById(id);
    if (!chart) return;
    var block = chart.closest(".si-chart-block");
    if (!block) return;
    var narrative = chartNarrative(id);
    var title = block.querySelector(".si-chart-dynamic-title");
    if (!title) {
      title = document.createElement("p");
      title.className = "si-chart-dynamic-title";
      block.insertBefore(title, chart);
    }
    title.textContent = narrative.title;
    var credit = block.querySelector(".si-chart-credit");
    if (credit) {
      credit.innerHTML = "<strong>" + escapeHtml(ui("Nota:", "Note:")) + "</strong> " + escapeHtml(narrative.note) + " " + escapeHtml(ui("Fonte: ISTAT. Elaborazione di Nazareno Lecis.", "Source: ISTAT. Processing by Nazareno Lecis."));
    }
  }

  function chartNarrative(id) {
    var scope = territoryContextLabel();
    var metric = metricScopeLabel();
    var measure = measureLabel();
    if (id === "siTrendChart") {
      return {
        title: ui("Serie storica: ", "Time series: ") + metric + " - " + scope + " - " + measure,
        note: measureNote() + comparisonNote()
      };
    }
    if (id === "siCompositionChart") {
      return {
          title: ui("Composizione dei reati nel ", "Offence composition in ") + STATE.year + " - " + scope,
        note: ui("Mostra il peso di categorie o singoli reati nel perimetro selezionato; la quota percentuale è calcolata sul totale visualizzato.", "Shows the weight of categories or individual offences within the selected scope; the percentage share is calculated on the displayed total.")
      };
    }
    if (id === "siContributionChart") {
      return {
        title: ui("Variazioni ", "Changes ") + normalizedComparisonYear() + "-" + STATE.year + ": " + metric + " - " + scope,
        note: ui("Include i reati che superano la soglia scelta e rispetta il filtro direzione; usa la variazione percentuale rispetto all'anno di confronto.", "Includes offences above the selected threshold and respects the direction filter; it uses percentage change against the comparison year.")
      };
    }
    if (id === "siRankingChart") {
      return {
        title: ui("Ranking territoriale nel ", "Territorial ranking in ") + STATE.year + ": " + metric + " - " + measure,
        note: measureNote() + ui(" Il ranking ordina i territori del livello selezionato e rispetta i filtri geografici attivi.", " The ranking orders territories at the selected level and respects the active geography filters.")
      };
    }
    if (id === "siScatterChart") {
      return {
        title: ui("Valore e variazione annua nel ", "Level and annual change in ") + STATE.year + ": " + metric + " - " + scope,
        note: ui("L'asse orizzontale mostra ", "The horizontal axis shows ") + measure.toLowerCase() + ui("; l'asse verticale mostra la variazione percentuale annua.", "; the vertical axis shows annual percentage change.")
      };
    }
    if (id === "siTreemapChart") {
      return {
        title: ui("Distribuzione territoriale nel ", "Territorial distribution in ") + STATE.year + ": " + metric + " - " + measure,
        note: measureNote() + ui(" Mostra i territori con valore più alto nel perimetro geografico selezionato.", " Shows the territories with the highest value within the selected geographic scope.")
      };
    }
    if (id === "siPropertyFocusChart") {
      return {
        title: ui("Reati patrimoniali: serie storica - ", "Property offences: time series - ") + scope + " - " + measure,
        note: measureNote() + ui(" Il focus usa solo le voci classificate come patrimonio o reati predatori.", " The focus uses only items classified as property or predatory offences.")
      };
    }
    if (id === "siViolentChart") {
      return {
        title: ui("Reati violenti e altri reati: serie storica - ", "Violent and other offences: time series - ") + scope + " - " + measure,
        note: measureNote() + ui(" La separazione è operativa sui codici reato e non sostituisce una classificazione giuridica esaustiva.", " The split is operational on offence codes and does not replace an exhaustive legal classification.")
      };
    }
    if (id === "siPersonFocusChart") {
      return {
        title: ui("Reati contro la persona: serie storica - ", "Offences against the person: time series - ") + scope + " - " + measure,
        note: measureNote() + ui(" Il focus confronta le principali voci contro la persona disponibili nel perimetro selezionato.", " The focus compares the main offences against the person available within the selected scope.")
      };
    }
    if (id === "siCrimeChart") {
      return {
        title: ui("Scheda reato: ", "Offence profile: ") + (STATE.crime === "all" ? topCrimeLabelForNarrative() : metric) + " - " + scope + " - " + measure,
        note: measureNote() + ui(" La serie usa il reato specifico selezionato; se il filtro è su tutti, viene mostrata la voce più rilevante nel perimetro.", " The series uses the selected individual offence; if the filter is set to all, it shows the most relevant item in the selected scope.")
      };
    }
    if (id === "siHomicideTrendChart") {
      return {
        title: ui("Omicidi: serie storica ", "Homicides: time series ") + homicideTypeLabel() + " - " + scope + " - " + measure,
        note: measureNote() + comparisonNote()
      };
    }
    if (id === "siHomicideStructureChart") {
      if (STATE.homicideStructureView === "territories") {
        return {
          title: ui("Omicidi: ranking territoriale ", "Homicides: territorial ranking ") + homicideTypeLabel() + ui(" nel ", " in ") + STATE.year + " - " + measure,
          note: measureNote() + ui(" In vista ranking il filtro Territorio non viene mostrato per mantenere il confronto tra territori.", " In ranking view the Territory filter is hidden to preserve comparison across territories.")
        };
      }
      return {
        title: ui("Omicidi: suddivisione per tipo nel ", "Homicides: breakdown by type in ") + STATE.year + " - " + scope + " - " + measure,
        note: measureNote() + ui(" In vista suddivisione vengono mostrate le voci omicidio disponibili nel territorio selezionato; non sono sommate automaticamente.", " Breakdown view shows the homicide items available in the selected territory; they are not automatically summed.")
      };
    }
    if (id === "siHomicidePeopleChart") {
      return {
        title: ui("Omicidi: ", "Homicides: ") + roleLabel(STATE.role) + ui(" per ", " by ") + homicidePeopleBreakdownLabel() + " - " + homicideTypeLabel(),
        note: peopleMeasureNote() + ui(" Il payload autori/vittime caricato ora è nazionale.", " The currently loaded offender/victim payload is national.")
      };
    }
    if (id === "siPeopleChart") {
      return {
        title: roleLabel(STATE.role) + ui(" per cittadinanza e reato - ", " by citizenship and offence - ") + peopleMeasureLabel(),
        note: peopleMeasureNote() + ui(" Autori e vittime restano separati dal filtro Ruolo; il payload persone caricato ora è nazionale.", " Offenders and victims remain separated by the Role filter; the currently loaded people payload is national.")
      };
    }
    if (id === "siDemographyChart") {
      return {
        title: ui("Identikit ", "Profile ") + roleLabel(STATE.role).toLowerCase() + ui(": sesso ed età - ", ": sex and age - ") + peopleMeasureLabel(),
        note: peopleMeasureNote() + ui(" Il dettaglio per sesso ed età dipende dalle dimensioni disponibili nel payload persone.", " Sex and age detail depends on the dimensions available in the people payload.")
      };
    }
    if (id === "siCounterChart") {
      return {
        title: ui("Controtendenze nel ", "Countertrends in ") + STATE.year + ": " + metric + " - " + scope,
        note: ui("Mostra territori e reati che si muovono in direzione opposta rispetto all'Italia, secondo il filtro Scostamenti selezionato.", "Shows territories and offences moving in the opposite direction from Italy, according to the selected Divergences filter.")
      };
    }
    if (id === "siPerceptionChart") {
      return {
        title: surveyNarrativeTitle("perception"),
        note: surveyNarrativeNote("perception")
      };
    }
    if (id === "siVictimizationChart") {
      return {
        title: surveyNarrativeTitle("victimization"),
        note: surveyNarrativeNote("victimization")
      };
    }
    if (id === "siReportingChart") {
      return {
        title: surveyNarrativeTitle("reporting_propensity"),
        note: surveyNarrativeNote("reporting_propensity")
      };
    }
    return { title: metric + " - " + scope, note: measureNote() };
  }

  function measureNote() {
    if (STATE.measure === "rate") return ui("Tasso per 100.000 abitanti: valore rapportato alla popolazione residente del territorio e anno selezionati.", "Rate per 100,000 inhabitants: value divided by resident population for the selected territory and year.");
    if (STATE.measure === "rate_1000") return ui("Tasso per 1.000 abitanti: valore rapportato alla popolazione residente del territorio e anno selezionati.", "Rate per 1,000 inhabitants: value divided by resident population for the selected territory and year.");
    if (STATE.measure === "index") return ui("Indice con primo anno uguale a 100: evidenzia la dinamica relativa della serie, non il volume assoluto.", "Index with first year equal to 100: highlights the relative dynamics of the series, not the absolute volume.");
    if (STATE.measure === "moving_average") return ui("Media mobile triennale: attenua oscillazioni annuali e va letta come andamento smussato.", "Three-year moving average: smooths yearly fluctuations and should be read as a smoothed trend.");
    if (STATE.measure === "yoy") return ui("Variazione percentuale annua: confronto con l'anno precedente nello stesso perimetro.", "Annual percentage change: comparison with the previous year in the same scope.");
    return ui("Valori assoluti: conteggio dei delitti denunciati nel perimetro selezionato.", "Absolute values: count of reported crimes within the selected scope.");
  }

  function comparisonNote() {
    if (STATE.compareTerritory !== "all") {
      return ui(" Il filtro Confronta con aggiunge la seconda serie selezionata.", " The Compare with filter adds the selected second series.");
    }
    if (STATE.territory !== "all") {
      return ui(" Con Nessun confronto il grafico mostra solo il territorio selezionato.", " With No comparison the chart shows only the selected territory.");
    }
    return ui(" Quando non selezioni un territorio specifico, la serie di partenza è nazionale.", " When no specific territory is selected, the starting series is national.");
  }

  function peopleMeasureNote() {
    if (STATE.peopleMeasure === "share") return ui("Quota percentuale: peso della categoria sul totale visualizzato nel grafico.", "Percentage share: weight of the category within the chart total.");
    if (STATE.peopleMeasure === "rate") return ui("Tasso per 100.000 abitanti: conteggio rapportato alla popolazione residente totale dell'anno selezionato.", "Rate per 100,000 inhabitants: count divided by total resident population in the selected year.");
    if (STATE.peopleMeasure === "rate_1000") return ui("Tasso per 1.000 abitanti: conteggio rapportato alla popolazione residente totale dell'anno selezionato.", "Rate per 1,000 inhabitants: count divided by total resident population in the selected year.");
    return ui("Valori assoluti: conteggi di autori/denunciati o vittime registrati nella fonte disponibile.", "Absolute values: counts of offenders/reported persons or victims registered in the available source.");
  }

  function surveyNarrativeTitle(topic) {
    var keys = surveyControlKeys(topic);
    var parts = [surveyTopicLabel(topic)];
    var responseRows = filterSurveyRows(surveyRows(topic), keys, { skip: "response" });
    var responseValues = unique(responseRows.map(surveyResponseValue)).filter(Boolean);
    if (STATE[keys.indicator] && STATE[keys.indicator] !== "all") parts.push(STATE[keys.indicator]);
    if (STATE[keys.dimension] && STATE[keys.dimension] !== "all") parts.push(surveyDimensionLabel(STATE[keys.dimension]));
    if (keys.crime && STATE[keys.crime] && STATE[keys.crime] !== "all") parts.push(STATE[keys.crime]);
    if (responseValues.length > 1 && STATE[keys.response] && STATE[keys.response] !== "all") parts.push(STATE[keys.response]);
    if (STATE[keys.period] && STATE[keys.period] !== "all") parts.push(STATE[keys.period]);
    return parts.map(tr).join(" - ");
  }

  function surveyNarrativeNote(topic) {
    var rows = filterSurveyRows(surveyRows(topic), surveyControlKeys(topic), {});
    var unit = surveyUnitLabel(rows);
    var universe = surveyReferenceUniverseNote(rows);
    if (topic === "reporting_propensity") {
      return ui("Propensione alla denuncia da indagine campionaria: ", "Reporting propensity from sample survey: ") + unit + ui(". I periodi sono edizioni dell'indagine, non anni di una serie annuale; il grafico non somma periodi diversi. ", ". Periods are survey editions, not annual time-series years; the chart does not add different periods together. ") + universe + ui(" Le tavole aggregate caricate non includono la propensione alla denuncia per cittadinanza o status migratorio: per quella domanda servono microdati o tavole dedicate.", " The loaded aggregate tables do not include reporting propensity by citizenship or migration status: that question requires microdata or dedicated tables.");
    }
    if (topic === "victimization") {
      return ui("Vittimizzazione dichiarata da indagine campionaria: ", "Reported victimization from sample survey: ") + unit + ui(". Include anche fenomeni non denunciati e non va sommata ai delitti registrati. ", ". It also includes unreported events and should not be added to registered crimes. ") + universe;
    }
    return ui("Percezione della sicurezza da indagine campionaria: ", "Perceived safety from sample survey: ") + unit + ui(". Misura opinioni, rischio percepito e comportamenti dichiarati, non denunce registrate. ", ". It measures opinions, perceived risk and stated behaviours, not registered reports. ") + universe;
  }

  function surveyReferenceUniverseNote(rows) {
    var units = unique((rows || []).map(function (row) { return row.unit; })).filter(Boolean);
    if (!units.length) return "";
    if (units.some(function (unit) { return unit.indexOf("vittime dello stesso reato") >= 0; })) {
      return ui("La base è l'insieme delle vittime dello stesso reato.", "The reference base is victims of the same offence.");
    }
    if (units.some(function (unit) { return unit.indexOf("famiglie") >= 0; }) && units.some(function (unit) { return unit.indexOf("persone") >= 0 || unit.indexOf("popolazione") >= 0; })) {
      return ui("La base cambia con il reato: alcuni fenomeni sono riferiti alle famiglie, altri alle persone.", "The base changes by offence: some phenomena refer to households, others to people.");
    }
    if (units.some(function (unit) { return unit.indexOf("famiglie") >= 0; })) {
      return ui("La base è la famiglia.", "The reference base is the household.");
    }
    if (units.some(function (unit) { return unit.indexOf("persone") >= 0 || unit.indexOf("popolazione") >= 0; })) {
      return ui("La base è la popolazione di riferimento indicata dall'indagine.", "The reference base is the survey's stated reference population.");
    }
    return "";
  }

  function territoryContextLabel() {
    if (STATE.level === "national") return levelLabel("national");
    if (STATE.territory !== "all") return territoryScopeLabel();
    var label = levelLabel(STATE.level);
    if (STATE.province !== "all") return label + " - " + territoryShort(STATE.province);
    if (STATE.region !== "all") return label + " - " + STATE.region;
    return label;
  }

  function topCrimeLabelForNarrative() {
    return crimeLabel({ crime_code: topCrimeCodeForSelection() });
  }

  function homicidePeopleBreakdownLabel() {
    if (STATE.homicidePeopleBreakdown === "citizenship") return ui("cittadinanza", "citizenship");
    if (STATE.homicidePeopleBreakdown === "sex") return ui("sesso", "sex");
    if (STATE.homicidePeopleBreakdown === "age") return ui("eta", "age");
    if (STATE.homicidePeopleBreakdown === "crime") return ui("tipo di omicidio", "type of homicide");
    return ui("sesso ed età", "sex and age");
  }

  function renderError() {
    CHART_IDS.forEach(function (id) {
      emptyChart(id, ui("Dati non caricati.", "Data not loaded."));
    });
  }

  function table(headers, rows) {
    return '<table class="si-table"><thead><tr>' + headers.map(function (header) {
      return '<th class="' + (header[1] === "right" ? "si-number" : "si-name") + '">' + escapeHtml(tr(header[0])) + "</th>";
    }).join("") + "</tr></thead><tbody>" + rows.map(function (row) {
      return "<tr>" + row.map(function (cell, index) {
        return '<td class="' + (headers[index][1] === "right" ? "si-number" : "si-name") + '">' + cell + "</td>";
      }).join("") + "</tr>";
    }).join("") + "</tbody></table>";
  }

  function coverageItem(label, note) {
    return '<article class="si-coverage-item"><strong>' + escapeHtml(tr(label)) + "</strong><span>" + escapeHtml(tr(note)) + "</span></article>";
  }

  function populateSelect(select, options, value) {
    if (!select) return;
    select.innerHTML = options.map(function (option) {
      return '<option value="' + escapeHtml(String(option.value)) + '">' + escapeHtml(String(tr(option.label))) + "</option>";
    }).join("");
    select.value = options.some(function (option) { return String(option.value) === String(value); }) ? String(value) : (options[0] ? String(options[0].value) : "");
  }

  function populateControlGroup(name, options, value, chartId) {
    controlsFor(name, chartId).forEach(function (select) {
      var scopedOptions = controlOptionsForSelect(name, select, options);
      populateSelect(select, scopedOptions, controlValueForSelect(name, select, value, scopedOptions));
    });
  }

  function setControlDisabled(name, disabled, chartId) {
    controlsFor(name, chartId).forEach(function (select) {
      select.disabled = disabled;
    });
  }

  function setControlAutoHidden(name, hidden, chartId) {
    controlsFor(name, chartId).forEach(function (select) {
      select.dataset.siAutoHidden = hidden ? "true" : "false";
    });
  }

  function controlsFor(name, chartId) {
    var root = chartId ? controlRootForId(chartId) : document;
    var controls = root ? Array.prototype.slice.call(root.querySelectorAll('[data-si-control="' + name + '"]')) : [];
    var mainId = !chartId && MAIN_CONTROL_BY_NAME[name];
    if (mainId && els[mainId]) controls.unshift(els[mainId]);
    return controls.filter(Boolean);
  }

  function controlOptionsForSelect(name, select, options) {
    if (name === "measure") return measureOptionsForChart(chartIdForControl(select));
    return options;
  }

  function controlValueForSelect(name, select, value, options) {
    if (name === "measure") return effectiveMeasureForChart(chartIdForControl(select), value);
    return value;
  }

  function withChartMeasure(chartId, fn) {
    var original = STATE.measure;
    STATE.measure = effectiveMeasureForChart(chartId, STATE.measure);
    try {
      return fn();
    } finally {
      STATE.measure = original;
    }
  }

  function effectiveMeasureForChart(chartId, value) {
    var options = measureOptionsForChart(chartId);
    var selected = String(value || STATE.measure || "");
    if (options.some(function (option) { return option.value === selected; })) return selected;
    return options[0] ? options[0].value : "absolute";
  }

  function measureOptionsForChart(chartId) {
    var values = null;
    if (chartId === "siScatterChart") values = POINT_MEASURE_VALUES;
    if (chartId === "siRankingChart" || chartId === "siTreemapChart" || chartId === "siHomicideStructureChart") values = CROSS_SECTION_MEASURE_VALUES;
    if (!values) return MEASURE_OPTIONS;
    return MEASURE_OPTIONS.filter(function (option) { return values.indexOf(option.value) >= 0; });
  }

  function syncControlVisibility(chartId) {
    var root = chartId ? controlRootForId(chartId) : document;
    if (!root) return;
    root.querySelectorAll("[data-si-control]").forEach(function (select) {
      var label = select.closest("label");
      if (!label) return;
      var name = select.getAttribute("data-si-control");
      var chartId = chartIdForControl(select);
      var hidden = false;
      if (name === "region") hidden = STATE.level === "national";
      if (name === "province") hidden = STATE.level !== "capital";
      if (name === "territory" || name === "compareTerritory") hidden = STATE.level === "national";
      if (chartId === "siHomicideStructureChart" && name === "homicideType") {
        hidden = STATE.homicideStructureView !== "territories";
      }
      if (chartId === "siHomicideStructureChart" && name === "territory" && STATE.homicideStructureView === "territories") {
        hidden = true;
      }
      if (select.dataset.siAutoHidden === "true") hidden = true;
      label.hidden = hidden;
    });
  }

  function chartIdForControl(select) {
    var block = select && select.closest ? (select.closest(".si-chart-block") || select.closest(".si-panel")) : null;
    var chart = block ? block.querySelector(".si-chart") : null;
    if (chart) return chart.id;
    var table = block ? block.querySelector(".si-table-wrap") : null;
    return table ? table.id : "global";
  }

  function controlRootForId(id) {
    var target = document.getElementById(id);
    if (!target) return null;
    return target.closest(".si-chart-block") || target.closest(".si-panel") || target;
  }

  function onChange(el, fn) {
    if (el) el.addEventListener("change", fn);
  }

  function years() {
    var recordYears = unique(STATE.records.map(function (row) { return row.year; })).filter(isFiniteNumber).sort(function (a, b) { return a - b; });
    var start = isFiniteNumber(STATE.meta.start_year) ? STATE.meta.start_year : recordYears[0];
    var end = isFiniteNumber(STATE.meta.end_year) ? STATE.meta.end_year : recordYears[recordYears.length - 1];
    if (isFiniteNumber(start) && isFiniteNumber(end) && start <= end) {
      var out = [];
      for (var year = start; year <= end; year += 1) out.push(year);
      return out;
    }
    return recordYears;
  }

  function latestYear() {
    return STATE.meta.end_year || years().slice(-1)[0] || null;
  }

  function previousYear() {
    var list = years().filter(function (year) { return year < STATE.year; });
    return list.length ? list[list.length - 1] : null;
  }

  function comparisonYearOptions() {
    var list = years().filter(function (year) { return year < STATE.year; }).sort(function (a, b) { return b - a; });
    if (!list.length) return [{ value: "", label: "Nessun anno precedente" }];
    return list.map(optionFromValue);
  }

  function surveyIndicatorOptions(rows) {
    return [{ value: "all", label: "Tutti gli indicatori" }].concat(
      unique(rows.map(function (row) { return row.indicator; })).sort(sortItalian).map(optionFromValue)
    );
  }

  function normalizedComparisonYear() {
    var validYears = years().filter(function (year) { return year < STATE.year; }).sort(function (a, b) { return a - b; });
    if (!validYears.length) {
      STATE.comparisonYear = null;
      return null;
    }
    if (!isFiniteNumber(STATE.comparisonYear) || validYears.indexOf(STATE.comparisonYear) < 0) {
      STATE.comparisonYear = validYears[validYears.length - 1];
    }
    return STATE.comparisonYear;
  }

  function yearRangeLabel() {
    return (STATE.meta.start_year || years()[0] || "n.d.") + "-" + (STATE.meta.end_year || latestYear() || "n.d.");
  }

  function metricScopeLabel() {
    if (STATE.crime !== "all") return crimeLabel({ crime_code: STATE.crime });
    return STATE.theme === "all" ? tr("Totale reati denunciati") : themeLabel(STATE.theme);
  }

  function metricScopeLabelForRow(row) {
    if (STATE.crime !== "all") return crimeLabel(row);
    if (STATE.theme !== "all") return themeLabel(row._theme);
    return crimeLabel(row);
  }

  function territoryScopeLabel() {
    if (STATE.territory === "all") return levelLabel(STATE.level);
    var row = reportedRows().find(function (item) { return item.territory_code === STATE.territory && item.territory_level === STATE.level; });
    return territoryLabel(row);
  }

  function measureLabel() {
    if (STATE.measure === "rate") return ui("Tasso per 100.000", "Rate per 100,000");
    if (STATE.measure === "rate_1000") return ui("Tasso per 1.000", "Rate per 1,000");
    if (STATE.measure === "index") return ui("Indice", "Index");
    if (STATE.measure === "moving_average") return ui("Media mobile triennale", "Three-year moving average");
    if (STATE.measure === "yoy") return ui("Variazione % annua", "Annual % change");
    return ui("Delitti denunciati", "Reported crimes");
  }

  function contributionDirectionLabel() {
    if (STATE.contributionDirection === "increase") return ui("solo aumenti", "increases only");
    if (STATE.contributionDirection === "decrease") return ui("solo diminuzioni", "decreases only");
    return ui("aumenti e diminuzioni", "increases and decreases");
  }

  function crimeOption(code) {
    return { value: code, label: crimeLabel({ crime_code: code }) };
  }

  function crimeLabel(row) {
    var code = crimeCode(row);
    if (CRIME_LABELS[code]) return tr(CRIME_LABELS[code]);
    var raw = row && (row.crime_name || row.indicator_name);
    if (raw && String(raw).indexOf("REATI_PS__") !== 0) return tr(labelize(raw));
    return code || ui("n.d.", "n/a");
  }

  function crimeCode(row) {
    return String(row && (row.crime_code || row.indicator_code || "") || "").trim().toUpperCase();
  }

  function themeForCrime(code) {
    code = String(code || "").toUpperCase();
    var keys = Object.keys(CRIME_THEMES);
    for (var i = 0; i < keys.length; i += 1) {
      if (keys[i] !== "all" && CRIME_THEMES[keys[i]].codes.indexOf(code) >= 0) return keys[i];
    }
    return code === "TOT" ? "all" : "other";
  }

  function themeLabel(key) {
    return tr((CRIME_THEMES[key] || CRIME_THEMES.other).label);
  }

  function levelLabel(value) {
    return tr(LEVEL_LABELS[value] || labelize(value || "n.d."));
  }

  function citizenshipLabel(value) {
    return tr(CITIZENSHIP_LABELS[value] || labelize(value || "cittadinanza n.d."));
  }

  function territoryLabel(row) {
    if (!row) return ui("n.d.", "n/a");
    var lookup = territoryLookupLabel(row.territory_level, row.territory_code);
    if (lookup) return lookup;
    var readable = readableTerritoryName(row);
    if (readable) return readable;
    if (row.territory_level === "national") return levelLabel("national");
    if (row.territory_level === "regional") return row.region || row.territory_code || ui("n.d.", "n/a");
    if (row.territory_level === "provincial") return territoryShort(row.province || row.territory_code);
    if (row.territory_level === "capital") return ui("Capoluogo ", "Provincial capital ") + territoryShort(row.capital || row.territory_code);
    return row.territory_name || row.territory_code || ui("n.d.", "n/a");
  }

  function territoryLookupLabel(level, code) {
    var labels = (STATE.meta && STATE.meta.territory_labels) || {};
    var byLevel = labels[level] || {};
    return byLevel[String(code || "")] || "";
  }

  function readableTerritoryName(row) {
    var name = row && row.territory_name;
    if (!name || looksLikeTerritoryCode(name)) return "";
    return name;
  }

  function looksLikeTerritoryCode(value) {
    return /^(?:\d{1,6}|IT[A-Z0-9]{1,4})$/.test(String(value || "").trim());
  }

  function territoryShort(value) {
    value = String(value || "");
    if (/^IT[A-Z0-9]{3}$/.test(value)) return value;
    if (/^\d+$/.test(value)) return value.padStart(3, "0");
    return value;
  }

  function territoryContext(row) {
    if (!row) return "";
    return [row.region, row.province && row.territory_level === "capital" ? ui("Provincia ", "Province ") + row.province : "", row.territory_code].filter(Boolean).join(" - ");
  }

  function sexLabel(value) {
    value = String(value || "n.d.").toUpperCase();
    if (value === "1" || value === "M") return ui("Uomini", "Men");
    if (value === "2" || value === "F") return ui("Donne", "Women");
    if (value === "9" || value === "T") return ui("Totale", "Total");
    return tr(labelize(value));
  }

  function ageLabel(value) {
    var code = String(value || "").toUpperCase();
    if (isTotalAgeGroup(code)) return ui("Totale", "Total");
    if (code === "Y_UN13" || code === "UN13" || code === "Y_LT14" || code === "LT14") return ui("Fino a 13 anni", "Up to 13 years");
    if (code === "Y_GE65" || code === "GE65") return ui("65 anni e oltre", "65 years and over");
    var range = code.replace(/^Y_?/, "").match(/^(\d{1,2})-(\d{1,2})$/);
    if (range) return ui(range[1] + "-" + range[2] + " anni", range[1] + "-" + range[2] + " years");
    var over = code.replace(/^Y_?/, "").match(/^GE(\d{1,2})$/);
    if (over) return ui(over[1] + " anni e oltre", over[1] + " years and over");
    var under = code.replace(/^Y_?/, "").match(/^UN(\d{1,2})$/);
    if (under) return ui("Fino a " + under[1] + " anni", "Up to " + under[1] + " years");
    return tr(labelize(code || "eta n.d."));
  }

  function optionFromValue(value) {
    return { value: value, label: String(value) };
  }

  function yearLabel(value) {
    return String(value);
  }

  function codeLine(value) {
    return value ? '<span class="si-code">' + escapeHtml(value) + "</span>" : "";
  }

  function formatInteger(value) {
    if (!isFiniteNumber(value)) return ui("n.d.", "n/a");
    return Math.round(value).toLocaleString(formatLocale());
  }

  function formatNumber(value) {
    if (!isFiniteNumber(value)) return ui("n.d.", "n/a");
    return Number(value).toLocaleString(formatLocale(), { maximumFractionDigits: 1 });
  }

  function formatPercent(value) {
    if (!isFiniteNumber(value)) return ui("n.d.", "n/a");
    return Number(value).toLocaleString(formatLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
  }

  function formatLocale() {
    return isEnglish() ? "en-US" : "it-IT";
  }

  function changeText(value) {
    return ui("var. annua ", "annual change ") + formatPercent(value);
  }

  function percentChange(current, previous) {
    if (!isFiniteNumber(current) || !isFiniteNumber(previous) || previous === 0) return null;
    return (current - previous) / previous * 100;
  }

  function numberOrNull(value) {
    if (value === null || value === undefined || value === "") return null;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function isFiniteNumber(value) {
    return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
  }

  function sum(rows, getter) {
    return rows.reduce(function (total, row) {
      var value = getter(row);
      return total + (isFiniteNumber(value) ? Number(value) : 0);
    }, 0);
  }

  function sumNumbers(values) {
    return values.reduce(function (total, value) { return total + Number(value); }, 0);
  }

  function unique(values) {
    var seen = {};
    return values.filter(function (value) {
      if (value === null || value === undefined || value === "") return false;
      var key = String(value);
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function uniqueEntities(entities) {
    var seen = {};
    return entities.filter(function (entity) {
      var key = entity.level + ":" + entity.code;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function descValue(a, b) {
    return (b.value || 0) - (a.value || 0);
  }

  function descMetric(a, b) {
    return (metricValueForRow(b) || 0) - (metricValueForRow(a) || 0);
  }

  function sortYear(a, b) {
    return a.year - b.year;
  }

  function sortCrimeLabel(a, b) {
    return crimeLabel({ crime_code: a }).localeCompare(crimeLabel({ crime_code: b }), "it");
  }

  function sortItalian(a, b) {
    return String(a || "").localeCompare(String(b || ""), isEnglish() ? "en" : "it");
  }

  function labelize(value) {
    return String(value || ui("n.d.", "n/a")).replace(/^REATI_PS__/, "").replace(/_N1$/, "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, function (letter) {
      return letter.toUpperCase();
    });
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") || "dark";
  }

  function cssVar(name, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  function setStatus(message, state) {
    els.siStatus.textContent = tr(message);
    if (state) els.siStatus.dataset.state = state;
    else delete els.siStatus.dataset.state;
  }

  function emptyMessage(message) {
    return '<p class="si-empty">' + escapeHtml(tr(message)) + "</p>";
  }

  function escapeHtml(value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, wait);
    };
  }
})();
