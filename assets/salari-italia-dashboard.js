(function () {
  "use strict";

  var DEFAULT_INITIAL_DATA_URL = "https://data.nazarenolecis.com/salari-italia/dashboard-site-initial.json?v=20260713-8";
  var DEFAULT_FULL_DATA_URL = "https://data.nazarenolecis.com/salari-italia/dashboard-site.json?v=20260713-8";
  var MISSING = "ND";
  var COLORS = ["#ff6b2a", "#5b8fd9", "#5fc3b2", "#f0b44d", "#e66b6b", "#6fbd72", "#bd8ac7", "#9edb85"];
  var STAT_LABELS = {
    mean: "Media",
    median: "Mediana",
    percentile: "Percentile",
    d9_d1: "D9 / D1",
    d9_median: "D9 / mediana",
    median_d1: "Mediana / D1",
    share_below_two_thirds_median: "Bassa retribuzione",
    mean_gap: "Gender pay gap"
  };
  var PERIOD_LABELS = { hourly: "Oraria", monthly: "Mensile", annual: "Annuale" };
  var TOTAL_VALUES = ["T", "TOTAL", "9", "99", "0010", "WORLD", "GE10"];
  var ANALYSIS_FILTER_KEYS = [
    "sex",
    "age_class",
    "education",
    "country_birth",
    "working_time",
    "contract_type",
    "contractual_occupation",
    "sector",
    "firm_size",
    "seniority",
    "paid_days"
  ];
  var DIMENSIONS = {
    sex: { field: "sex", labelField: "sex_label", label: "Sesso" },
    age_class: { field: "age_class", labelField: "age_label", label: "Età" },
    education: { field: "education", labelField: "education_label", label: "Titolo di studio" },
    occupation: { field: "occupation", labelField: "occupation_label", label: "Professione" },
    contractual_occupation: { field: "contractual_occupation", labelField: "contractual_occupation_label", label: "Qualifica" },
    sector: { field: "sector", labelField: "sector_label", label: "Settore" },
    working_time: { field: "working_time", labelField: "working_time_label", label: "Orario" },
    firm_size: { field: "firm_size", labelField: "firm_size_label", label: "Dimensione impresa" },
    seniority: { field: "seniority", labelField: "seniority_label", label: "Anzianità" },
    paid_days: { field: "paid_days", labelField: "paid_days_label", label: "Giornate retribuite" },
    contract_type: { field: "contract_type", labelField: "contract_type_label", label: "Contratto" },
    country_birth: { field: "country_birth", labelField: "country_birth_label", label: "Paese di nascita" },
    geography_code: { field: "geography_code", labelField: "geography_name", label: "Territorio" }
  };
  var FIELD_FILTER_ID = {
    geography_code: "geography",
    sex: "sex",
    age_class: "age",
    education: "education",
    occupation: "occupation",
    contractual_occupation: "contractual_occupation",
    contract_type: "contract_type",
    working_time: "working_time",
    seniority: "seniority",
    paid_days: "paid_days",
    sector: "sector",
    firm_size: "firm_size",
    public_private: "public_private",
    citizenship: "citizenship",
    country_birth: "country_birth",
    pay_period: "pay_period",
    statistic: "statistic",
    year: "year"
  };
  var LABEL_IT = {
    "1 000 employees or more": "1.000 addetti e oltre",
    "10 employees or more": "10 addetti e oltre",
    "15-29 years": "15-29 anni",
    "30-49 years": "30-49 anni",
    "50 years and over": "50 anni e oltre",
    "60 years or over": "60 anni e oltre",
    "accommodation": "Alloggio",
    "activities auxiliary to financial services and insurance activities": "Attivita' ausiliarie dei servizi finanziari e assicurativi",
    "activities of head offices, management consultancy activities": "Direzione aziendale e consulenza gestionale",
    "advertising and market research": "Pubblicita' e ricerche di mercato",
    "air transport": "Trasporto aereo",
    "All ISCED 2011 levels": "Totale",
    "Apprentice or trainee": "Apprendista o tirocinante",
    "average": "Media",
    "Average": "Media",
    "Business economy": "Economia di mercato",
    "civil engineering": "Ingegneria civile",
    "computer programming, consultancy and related activities": "Programmazione, consulenza informatica e attivita' connesse",
    "construction of buildings": "Costruzione di edifici",
    "creative, arts and entertainment activities": "Attivita' creative, artistiche e di intrattenimento",
    "education": "Istruzione",
    "electricity, gas, steam and air conditioning supply": "Energia elettrica, gas, vapore e aria condizionata",
    "employment activities": "Attivita' di ricerca, selezione e fornitura di personale",
    "European Union - 27 countries (from 2020)": "Unione europea a 27",
    "extraction of crude petroleum and natural gas": "Estrazione di petrolio greggio e gas naturale",
    "females": "Femmine",
    "financial service activities, except insurance and pension funding": "Servizi finanziari esclusi assicurazioni e fondi pensione",
    "full-time": "Tempo pieno",
    "Full-time": "Tempo pieno",
    "From 1 to 9 employees": "1-9 addetti",
    "From 10 to 49 employees": "10-49 addetti",
    "From 20 to 29 years": "20-29 anni",
    "From 250 to 499 employees": "250-499 addetti",
    "From 30 to 39 years": "30-39 anni",
    "From 40 to 49 years": "40-49 anni",
    "From 50 to 59 years": "50-59 anni",
    "From 50 to 249 employees": "50-249 addetti",
    "From 500 to 999 employees": "500-999 addetti",
    "food service activities": "Ristorazione",
    "France": "Francia",
    "gambling and betting activities": "Lotterie, scommesse e case da gioco",
    "Germany": "Germania",
    "Gross hourly wage per hour paid of employee jobs in euro (average).": "Retribuzione oraria lorda media",
    "Gross hourly wage per hour paid of employee jobs in euro (first decile).": "Primo decile della retribuzione oraria lorda",
    "Gross hourly wage per hour paid of employee jobs in euro (ninth decile).": "Nono decile della retribuzione oraria lorda",
    "Gross hourly wage per hour paid of employee jobs  in euros (median).": "Retribuzione oraria lorda mediana",
    "human health activities": "Sanita'",
    "Industry and construction": "Industria e costruzioni",
    "Industry, construction and services (except public administration, defense, compulsory social security)": "Industria, costruzioni e servizi esclusa PA",
    "information service activities": "Servizi d'informazione",
    "insurance, reinsurance and pension funding, except compulsory social security": "Assicurazioni, riassicurazioni e fondi pensione",
    "Italy": "Italia",
    "land transport and transport via pipelines": "Trasporto terrestre e mediante condotte",
    "legal and accounting activities": "Attivita' legali e contabilita'",
    "Less than 20 years": "Meno di 20 anni",
    "Less than 30 years": "Meno di 30 anni",
    "Less than primary, primary and lower secondary education (levels 0-2)": "Fino alla licenza media",
    "libraries, archives, museums and other cultural activities": "Biblioteche, archivi, musei e altre attivita' culturali",
    "Limited duration except apprentice and trainee": "Tempo determinato esclusi apprendisti e tirocinanti",
    "males": "Maschi",
    "manufacture of basic metals": "Metallurgia",
    "manufacture of basic pharmaceutical products and pharmaceutical preparations": "Prodotti farmaceutici di base e preparati farmaceutici",
    "manufacture of beverages": "Bevande",
    "manufacture of chemicals and chemical products": "Prodotti chimici",
    "manufacture of coke and refined petroleum products": "Coke e prodotti petroliferi raffinati",
    "manufacture of computer, electronic and optical products": "Computer, elettronica e ottica",
    "manufacture of electrical equipment and of non-electric domestic appliances": "Apparecchiature elettriche",
    "manufacture of fabricated metal products, except machinery and equipment": "Prodotti in metallo esclusi macchinari",
    "manufacture of food products": "Prodotti alimentari",
    "manufacture of furniture": "Mobili",
    "manufacture of leather and related products": "Pelle e prodotti in pelle",
    "manufacture of machinery and equipment n.e.c.": "Macchinari e apparecchiature n.c.a.",
    "manufacture of motor vehicles, trailers and semi-trailers": "Autoveicoli, rimorchi e semirimorchi",
    "manufacture of other non-metallic mineral products": "Altri prodotti della lavorazione di minerali non metalliferi",
    "manufacture of other transport equipment": "Altri mezzi di trasporto",
    "manufacture of paper and paper products": "Carta e prodotti di carta",
    "manufacture of rubber and plastic products": "Gomma e materie plastiche",
    "manufacture of textiles": "Prodotti tessili",
    "manufacture of tobacco products": "Tabacco",
    "manufacture of wearing apparel": "Abbigliamento",
    "manufacture of wood and of products of wood and cork, except furniture, manufacture of articles of straw and plaiting materials": "Legno, sughero, paglia e materiali da intreccio",
    "median": "Mediana",
    "mining support service activities": "Attivita' di supporto all'estrazione",
    "motion picture, video and television programme production, sound recording and music publishing activities": "Cinema, video, televisione, musica ed editoria sonora",
    "Netherlands": "Paesi Bassi",
    "office administrative, office support and other business support activities": "Supporto per funzioni d'ufficio e altri servizi alle imprese",
    "other manufacturing": "Altre attivita' manifatturiere",
    "other mining and quarrying": "Altre attivita' estrattive",
    "other personal service activities": "Altri servizi alla persona",
    "other professional, scientific and technical activities": "Altre attivita' professionali, scientifiche e tecniche",
    "part-time": "Tempo parziale",
    "Part-time": "Tempo parziale",
    "permanent employees": "Tempo indeterminato",
    "postal and courier activities": "Servizi postali e corrieri",
    "printing and reproduction of recorded media": "Stampa e riproduzione di supporti registrati",
    "programming and broadcasting activities": "Programmazione e trasmissioni radio-televisive",
    "publishing activities": "Editoria",
    "real estate activities": "Attivita' immobiliari",
    "remediation activities and other waste management services": "Risanamento e gestione rifiuti",
    "rental and leasing activities": "Noleggio e leasing operativo",
    "repair and installation of machinery and equipment": "Riparazione e installazione di macchinari",
    "repair of computers and personal and household goods": "Riparazione di computer e beni personali",
    "residential care activities": "Assistenza sociale residenziale",
    "retail trade, except of motor vehicles and motorcycles": "Commercio al dettaglio esclusi autoveicoli e motocicli",
    "scientific research and development": "Ricerca scientifica e sviluppo",
    "security and investigation activities": "Servizi di vigilanza e investigazione",
    "Services of the business economy": "Servizi dell'economia di mercato",
    "services (g to s, except o)": "Servizi esclusa PA",
    "services to buildings and landscape activities": "Servizi per edifici e paesaggio",
    "sewerage": "Reti fognarie",
    "social work activities without accommodation": "Assistenza sociale non residenziale",
    "Spain": "Spagna",
    "specialised construction activities": "Lavori di costruzione specializzati",
    "sports activities and amusement and recreation activities": "Sport, intrattenimento e divertimento",
    "telecommunications": "Telecomunicazioni",
    "temporary employees": "Tempo determinato",
    "Tertiary education (levels 5-8)": "Istruzione terziaria",
    "TOTAL INDUSTRY EXCLUDING CONSTRUCTION (b to e)": "Industria esclusa costruzioni",
    "temporary employees": "Tempo determinato",
    "total": "Totale",
    "Total": "Totale",
    "travel agency, tour operator and other reservation service and related activities": "Agenzie di viaggio, tour operator e servizi di prenotazione",
    "Unadjusted gender pay gap": "Gender pay gap non corretto",
    "Unlimited duration": "Tempo indeterminato",
    "Unknown": "Non noto",
    "Upper secondary and post-secondary non-tertiary education (levels 3 and 4)": "Diploma e post-secondario non terziario",
    "veterinary activities": "Servizi veterinari",
    "warehousing and support activities for transportation": "Magazzinaggio e supporto ai trasporti",
    "waste collection, treatment and disposal activities, materials recovery": "Raccolta e trattamento rifiuti, recupero materiali",
    "water collection, treatment and supply": "Raccolta, trattamento e fornitura di acqua",
    "water transport": "Trasporto marittimo e per vie d'acqua",
    "wholesale and retail trade and repair of motor vehicles and motorcycles": "Commercio e riparazione di autoveicoli e motocicli",
    "wholesale trade, except of motor vehicles and motorcycles": "Commercio all'ingrosso esclusi autoveicoli e motocicli",
    "apprentice": "Apprendisti"
  };
  var CODE_LABEL_IT = {
    geography_code: {
      EU27_2020: "Unione europea a 27",
      AT: "Austria",
      BE: "Belgio",
      BG: "Bulgaria",
      CH: "Svizzera",
      CY: "Cipro",
      CZ: "Cechia",
      DE: "Germania",
      DK: "Danimarca",
      EE: "Estonia",
      EL: "Grecia",
      ES: "Spagna",
      FI: "Finlandia",
      FR: "Francia",
      HR: "Croazia",
      HU: "Ungheria",
      IE: "Irlanda",
      IS: "Islanda",
      IT: "Italia",
      LT: "Lituania",
      LU: "Lussemburgo",
      LV: "Lettonia",
      MT: "Malta",
      NL: "Paesi Bassi",
      NO: "Norvegia",
      PL: "Polonia",
      PT: "Portogallo",
      RO: "Romania",
      SE: "Svezia",
      SI: "Slovenia",
      SK: "Slovacchia",
      UK: "Regno Unito"
    },
    education: {
      TOTAL: "Totale",
      "ED0-2": "Fino alla licenza media",
      ED3_4: "Diploma e post-secondario non terziario",
      "ED5-8": "Istruzione terziaria",
      UNK: "Non noto"
    },
    working_time: {
      FT: "Tempo pieno",
      PT: "Tempo parziale",
      "1": "Tempo pieno",
      "2": "Tempo parziale",
      TOTAL: "Totale",
      "9": "Totale"
    },
    firm_size: {
      GE1000: "1.000 addetti e oltre",
      GE10: "10 addetti e oltre",
      "1-9": "1-9 addetti",
      "10-49": "10-49 addetti",
      "50-249": "50-249 addetti",
      "250-499": "250-499 addetti",
      "500-999": "500-999 addetti"
    },
    contract_type: {
      APP_TRN: "Apprendista o tirocinante",
      LTD_X_APP_TRN: "Tempo determinato esclusi apprendisti e tirocinanti",
      NLTD: "Tempo indeterminato",
      "1": "Tempo determinato",
      "2": "Tempo indeterminato",
      TOTAL: "Totale",
      "9": "Totale"
    },
    contractual_occupation: {
      "1": "Dirigenti e impiegati",
      "2": "Dirigenti",
      "3": "Quadri",
      "4": "Impiegati",
      "5": "Operai e apprendisti",
      "6": "Operai",
      "7": "Apprendisti",
      "10": "Dipendenti esclusi dirigenti",
      "23": "Quadri e impiegati",
      "35": "Dirigenti e quadri",
      "99": "Totale"
    },
    paid_days: {
      D_UN90: "Fino a 90 giornate retribuite",
      D_GE91: "91 giornate retribuite e oltre",
      TOTAL: "Totale"
    },
    sector: {
      "B-N": "Economia di mercato",
      "P-S": "Istruzione, sanita', arte e altri servizi",
      "B-F": "Industria e costruzioni",
      "B-S_X_O": "Industria, costruzioni e servizi esclusa PA",
      "G-N": "Servizi dell'economia di mercato",
      "0020": "Industria esclusa costruzioni",
      "0038": "Servizi esclusa PA",
      "55": "Alloggio",
      "66": "Attivita' ausiliarie dei servizi finanziari e assicurativi",
      "70": "Direzione aziendale e consulenza gestionale",
      "73": "Pubblicita' e ricerche di mercato",
      "51": "Trasporto aereo",
      "71": "Architettura, ingegneria, collaudi e analisi tecniche",
      "42": "Ingegneria civile",
      "62": "Programmazione, consulenza informatica e attivita' connesse",
      "41": "Costruzione di edifici",
      "90": "Attivita' creative, artistiche e di intrattenimento",
      "85": "Istruzione",
      "35": "Energia elettrica, gas, vapore e aria condizionata",
      "78": "Ricerca, selezione e fornitura di personale",
      "06": "Estrazione di petrolio greggio e gas naturale",
      "64": "Servizi finanziari esclusi assicurazioni e fondi pensione",
      "56": "Ristorazione",
      "92": "Lotterie, scommesse e case da gioco",
      "86": "Sanita'",
      "63": "Servizi d'informazione",
      "65": "Assicurazioni, riassicurazioni e fondi pensione",
      "49": "Trasporto terrestre e mediante condotte",
      "69": "Attivita' legali e contabilita'",
      "91": "Biblioteche, archivi, musei e altre attivita' culturali",
      "24": "Metallurgia",
      "21": "Prodotti farmaceutici",
      "11": "Bevande",
      "20": "Prodotti chimici",
      "19": "Coke e prodotti petroliferi raffinati",
      "26": "Computer, elettronica e ottica",
      "27": "Apparecchiature elettriche",
      "25": "Prodotti in metallo esclusi macchinari",
      "10": "Prodotti alimentari",
      "31": "Mobili",
      "15": "Pelle e prodotti in pelle",
      "28": "Macchinari e apparecchiature n.c.a.",
      "29": "Autoveicoli, rimorchi e semirimorchi",
      "23": "Minerali non metalliferi",
      "30": "Altri mezzi di trasporto",
      "17": "Carta e prodotti di carta",
      "22": "Gomma e materie plastiche",
      "13": "Prodotti tessili",
      "12": "Tabacco",
      "14": "Abbigliamento",
      "16": "Legno, sughero e materiali da intreccio",
      "09": "Supporto all'estrazione",
      "59": "Cinema, video, televisione e musica",
      "82": "Supporto d'ufficio e altri servizi alle imprese",
      "32": "Altre attivita' manifatturiere",
      "08": "Altre attivita' estrattive",
      "96": "Altri servizi alla persona",
      "74": "Altre attivita' professionali, scientifiche e tecniche",
      "53": "Servizi postali e corrieri",
      "18": "Stampa e riproduzione di supporti registrati",
      "60": "Programmazione e trasmissioni radio-televisive",
      "58": "Editoria",
      "68": "Attivita' immobiliari",
      "39": "Risanamento e gestione rifiuti",
      "77": "Noleggio e leasing operativo",
      "33": "Riparazione e installazione di macchinari",
      "95": "Riparazione di computer e beni personali",
      "87": "Assistenza sociale residenziale",
      "47": "Commercio al dettaglio esclusi autoveicoli e motocicli",
      "72": "Ricerca scientifica e sviluppo",
      "80": "Vigilanza e investigazione",
      "81": "Servizi per edifici e paesaggio",
      "37": "Reti fognarie",
      "88": "Assistenza sociale non residenziale",
      "43": "Lavori di costruzione specializzati",
      "93": "Sport, intrattenimento e divertimento",
      "61": "Telecomunicazioni",
      "79": "Agenzie di viaggio e tour operator",
      "75": "Servizi veterinari",
      "52": "Magazzinaggio e supporto ai trasporti",
      "38": "Raccolta e trattamento rifiuti",
      "36": "Raccolta, trattamento e fornitura di acqua",
      "50": "Trasporto marittimo e per vie d'acqua",
      "45": "Commercio e riparazione di autoveicoli e motocicli",
      "46": "Commercio all'ingrosso esclusi autoveicoli e motocicli"
    }
  };

  var state = {
    payload: null,
    records: [],
    grossRecords: [],
    distributionRecords: [],
    istatDistributionRecords: [],
    eurostatDistributionRecords: [],
    lookups: {},
    fullDataset: false,
    distribution: {
      year: null,
      geography_code: "IT",
      sex: "T",
      age_class: "TOTAL",
      education: "99",
      sector: "0010",
      contract_type: "9",
      working_time: "9",
      contractual_occupation: "99",
      firm_size: "TOTAL",
      country_birth: "WORLD",
      paid_days: "TOTAL",
      pay_period: "hourly"
    },
    worker: {
      dimension: "age_class",
      year: null,
      geography_code: "IT",
      sex: "T",
      age_class: "all",
      education: "all",
      country_birth: "all",
      working_time: "all",
      contract_type: "all",
      contractual_occupation: "all",
      sector: "all",
      firm_size: "all",
      seniority: "all",
      paid_days: "all",
      pay_period: "hourly",
      statistic: "median",
    },
    job: {
      dimension: "sector",
      year: null,
      geography_code: "IT",
      sex: "T",
      age_class: "all",
      education: "all",
      country_birth: "all",
      working_time: "all",
      contract_type: "all",
      contractual_occupation: "all",
      sector: "all",
      firm_size: "all",
      seniority: "all",
      paid_days: "all",
      pay_period: "hourly",
      statistic: "median",
    },
    lowWage: {
      dimension: "geography_code",
      year: null,
      geography_code: "IT"
    },
    selectedSectors: [],
    territory: {
      region_code: "all",
      province_code: "all",
      year: null,
      sex: "T",
      age_class: "all",
      education: "all",
      country_birth: "all",
      working_time: "all",
      contract_type: "all",
      contractual_occupation: "all",
      firm_size: "all",
      paid_days: "all",
      statistic: "median",
    },
    paidDays: {
      year: null,
      geography_code: "IT",
      sex: "T",
      age_class: "all",
      education: "all",
      country_birth: "all",
      working_time: "all",
      contract_type: "all",
      contractual_occupation: "all",
      sector: "0010",
      firm_size: "all",
      statistic: "median"
    },
    europe: { pay_period: "hourly", statistic: "median", sex: "T", countries: [], start_year: null, end_year: null },
    series: {
      pay_period: "hourly",
      statistic: "all",
      geography_code: "IT",
      sex: "T",
      age_class: "TOTAL",
      education: "99",
      sector: "0010",
      contract_type: "9",
      working_time: "9",
      contractual_occupation: "99",
      firm_size: "TOTAL",
      country_birth: "WORLD",
      paid_days: "TOTAL",
      start_year: null,
      end_year: null
    }
  };
  var lazyObserver = null;
  var renderedLazySections = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function toNumber(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function buildLookups(payload) {
    var lookups = {};
    Object.keys(FIELD_FILTER_ID).forEach(function (field) {
      var filterId = FIELD_FILTER_ID[field];
      lookups[field] = {};
      toArray(payload.filters && payload.filters[filterId]).forEach(function (option) {
        lookups[field][String(option.value)] = option.label;
      });
    });
    return lookups;
  }

  function recordsFromPayload(payload) {
    var schema = toArray(payload.record_schema);
    var records = toArray(payload.records);
    if (!schema.length || !records.length || !Array.isArray(records[0])) return records;
    return records.map(function (record) {
      var row = {};
      schema.forEach(function (field, index) {
        var value = record[index];
        if (value !== null && value !== undefined) row[field] = value;
      });
      return row;
    });
  }

  function labelFromCode(field, value) {
    if (field === null || field === undefined || value === null || value === undefined) return null;
    var fieldLabels = CODE_LABEL_IT[field];
    if (!fieldLabels) return null;
    return fieldLabels[String(value)] || null;
  }

  function italianLabel(value) {
    if (value === null || value === undefined || value === "") return null;
    var label = String(value);
    return LABEL_IT[label] || LABEL_IT[label.toLowerCase()] || label;
  }

  function lookupLabel(field, value) {
    if (value === null || value === undefined) return null;
    var codeLabel = labelFromCode(field, value);
    if (codeLabel) return codeLabel;
    var label = state.lookups[field] && state.lookups[field][String(value)];
    return label ? italianLabel(label) : null;
  }

  function text(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback || MISSING;
    return String(value);
  }

  function fmt(value, digits) {
    var n = toNumber(value);
    if (n === null) return MISSING;
    return n.toLocaleString("it-IT", {
      maximumFractionDigits: Number.isFinite(digits) ? digits : 1,
      minimumFractionDigits: 0
    });
  }

  function euro(value, digits) {
    var n = toNumber(value);
    if (n === null) return MISSING;
    return n.toLocaleString("it-IT", {
      maximumFractionDigits: Number.isFinite(digits) ? digits : 1,
      minimumFractionDigits: 0
    }) + " €";
  }

  function percent(value) {
    var n = toNumber(value);
    if (n === null) return MISSING;
    return n.toLocaleString("it-IT", { maximumFractionDigits: 1 }) + "%";
  }

  function clear(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function setStatus(message, isError) {
    var node = byId("siStatus");
    if (!node) return;
    if (!message) {
      node.textContent = "";
      node.hidden = true;
      return;
    }
    node.hidden = false;
    node.textContent = message;
    node.style.color = isError ? "#e15759" : "";
  }

  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function fullDataUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get("data") || window.SALARI_ITALIA_DATA_URL || DEFAULT_FULL_DATA_URL;
  }

  function initialDataUrl() {
    var params = new URLSearchParams(window.location.search);
    var explicitUrl = params.get("initialData") || window.SALARI_ITALIA_INITIAL_DATA_URL;
    var fullUrl = fullDataUrl();
    if (explicitUrl) return explicitUrl;
    if (fullUrl.indexOf("dashboard-site.json") >= 0) {
      return fullUrl.replace("dashboard-site.json", "dashboard-site-initial.json");
    }
    return DEFAULT_INITIAL_DATA_URL;
  }

  function showEmpty(id, message) {
    var node = byId(id);
    if (!node) return;
    if (window.Plotly) {
      try { window.Plotly.purge(node); } catch (error) {}
    }
    clear(node);
    var empty = document.createElement("div");
    empty.className = "si-empty";
    empty.textContent = message || "Nessun dato disponibile";
    node.appendChild(empty);
  }

  function baseLayout(extra) {
    var textColor = cssVar("--text", "#f5f2ed");
    var muted = cssVar("--muted", "#b9b2aa");
    var line = cssVar("--line", "#303030");
    var panel = cssVar("--panel", "#090909");
    var chartBg = cssVar("--si-chart-bg", panel);
    var grid = cssVar("--si-grid", line);
    var defaults = {
      autosize: true,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: chartBg,
      font: { color: textColor, family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", size: 12 },
      margin: { t: 24, r: 18, b: 58, l: 70 },
      hoverlabel: { bgcolor: panel, bordercolor: line, font: { color: textColor } },
      legend: { orientation: "h", x: 0, xanchor: "left", y: -0.22, font: { color: muted } },
      dragmode: false,
      xaxis: { fixedrange: true, showgrid: true, gridcolor: grid, gridwidth: 1, zerolinecolor: line, tickfont: { color: muted }, automargin: true },
      yaxis: { fixedrange: true, showgrid: true, gridcolor: grid, gridwidth: 1, zerolinecolor: line, tickfont: { color: muted }, automargin: true }
    };
    var merged = Object.assign({}, defaults, extra || {});
    if (extra && extra.xaxis) merged.xaxis = Object.assign({}, defaults.xaxis, extra.xaxis);
    if (extra && extra.yaxis) merged.yaxis = Object.assign({}, defaults.yaxis, extra.yaxis);
    return merged;
  }

  function plot(id, traces, layout) {
    if (!window.Plotly) {
      showEmpty(id, "Plotly non è disponibile.");
      return;
    }
    if (!toArray(traces).length) {
      showEmpty(id, "Nessun dato disponibile per la selezione corrente.");
      return;
    }
    window.Plotly.react(id, traces, baseLayout(layout), {
      responsive: true,
      displayModeBar: false,
      scrollZoom: false
    });
  }

  function optionLabel(row, field, labelField) {
    var codeLabel = labelFromCode(field, row[field]);
    var rawLabel = codeLabel || (labelField && row[labelField] ? row[labelField] : lookupLabel(field, row[field]) || row[field]);
    var label = text(rawLabel, text(row[field]));
    return italianLabel(label) || label;
  }

  function isTotal(field, value) {
    if (value === null || value === undefined) return true;
    var raw = String(value);
    if (field === "sex") return raw === "T" || raw === "TOTAL";
    return TOTAL_VALUES.indexOf(raw) >= 0 || raw === "B-S_X_O";
  }

  function matchesFilterValue(row, field, value) {
    if (value === null || value === undefined || value === "") return true;
    if (String(value) === "all") return true;
    if (isTotal(field, value)) return isTotal(field, row[field]);
    if (optionIdentity(field, row[field]) === optionIdentity(field, value)) return true;
    return String(row[field]) === String(value);
  }

  function optionIdentity(field, value) {
    if (value === null || value === undefined || value === "") return "";
    var raw = String(value);
    if (field === "working_time") {
      if (raw === "1" || raw === "FT") return "full_time";
      if (raw === "2" || raw === "PT") return "part_time";
      if (raw === "9" || raw === "TOTAL") return "total";
    }
    return raw;
  }

  function uniqueOptions(rows, field, labelField, includeTotals) {
    var map = {};
    toArray(rows).forEach(function (row) {
      var value = row[field];
      if (value === null || value === undefined || value === "") return;
      if (!includeTotals && isTotal(field, value)) return;
      map[optionIdentity(field, value)] = { value: String(value), label: optionLabel(row, field, labelField) };
    });
    return Object.keys(map).map(function (key) { return map[key]; }).sort(function (a, b) {
      var an = toNumber(a.value);
      var bn = toNumber(b.value);
      if (an !== null && bn !== null) return an - bn;
      return a.label.localeCompare(b.label, "it");
    });
  }

  function yearsFrom(rows) {
    return uniqueOptions(rows, "year", null, true).sort(function (a, b) {
      return Number(b.value) - Number(a.value);
    });
  }

  function yearsAscending(rows) {
    return yearsFrom(rows).sort(function (a, b) {
      return Number(a.value) - Number(b.value);
    });
  }

  function syncYearRange(containerId, rows, targetState, onChange) {
    var container = byId(containerId);
    var options = yearsAscending(rows);
    if (!container || !options.length) return;
    var firstYear = options[0].value;
    var lastYear = options[options.length - 1].value;
    var values = options.map(function (option) { return String(option.value); });
    if (!targetState.start_year || values.indexOf(String(targetState.start_year)) < 0) targetState.start_year = firstYear;
    if (!targetState.end_year || values.indexOf(String(targetState.end_year)) < 0) targetState.end_year = lastYear;
    if (Number(targetState.start_year) > Number(targetState.end_year)) {
      targetState.start_year = firstYear;
      targetState.end_year = lastYear;
    }
    ensureSelect(container, { key: "start_year", label: "Da anno" }, options, targetState.start_year, function (key, value) {
      targetState[key] = value;
      if (Number(targetState.start_year) > Number(targetState.end_year)) targetState.end_year = value;
      onChange(key);
    });
    ensureSelect(container, { key: "end_year", label: "Ad anno" }, options, targetState.end_year, function (key, value) {
      targetState[key] = value;
      if (Number(targetState.start_year) > Number(targetState.end_year)) targetState.start_year = value;
      onChange(key);
    });
  }

  function applyYearRange(rows, targetState) {
    return toArray(rows).filter(function (row) {
      var year = Number(row.year);
      if (!Number.isFinite(year)) return false;
      if (targetState.start_year && year < Number(targetState.start_year)) return false;
      if (targetState.end_year && year > Number(targetState.end_year)) return false;
      return true;
    });
  }

  function filterRows(rows, filters, skipKey) {
    return toArray(rows).filter(function (row) {
      return Object.keys(filters).every(function (key) {
        if (key === skipKey) return true;
        return matchesFilterValue(row, key, filters[key]);
      });
    });
  }

  function ensureSelect(container, spec, options, current, onChange) {
    var wrapper = container.querySelector('[data-filter="' + spec.key + '"]');
    if (!options.length) {
      if (wrapper) wrapper.remove();
      return null;
    }
    if (!wrapper) {
      wrapper = document.createElement("label");
      wrapper.setAttribute("data-filter", spec.key);
      var label = document.createElement("span");
      var select = document.createElement("select");
      label.textContent = spec.label;
      select.addEventListener("change", function () {
        onChange(spec.key, select.value);
      });
      wrapper.appendChild(label);
      wrapper.appendChild(select);
      container.appendChild(wrapper);
    }
    var node = wrapper.querySelector("select");
    clear(node);
    options.forEach(function (option) {
      var item = document.createElement("option");
      item.value = option.value;
      item.textContent = option.label;
      node.appendChild(item);
    });
    node.value = String(current);
    return node;
  }

  function ensureMultiSelect(container, spec, options, selectedValues, onChange) {
    var wrapper = container.querySelector('[data-filter="' + spec.key + '"]');
    if (!options.length) {
      if (wrapper) wrapper.remove();
      return null;
    }
    if (!wrapper) {
      wrapper = document.createElement("label");
      wrapper.setAttribute("data-filter", spec.key);
      var label = document.createElement("span");
      var select = document.createElement("select");
      label.textContent = spec.label;
      select.multiple = true;
      select.addEventListener("change", function () {
        onChange(Array.prototype.slice.call(select.selectedOptions).map(function (option) {
          return option.value;
        }));
      });
      wrapper.appendChild(label);
      wrapper.appendChild(select);
      container.appendChild(wrapper);
    }
    var node = wrapper.querySelector("select");
    var selected = {};
    toArray(selectedValues).forEach(function (value) {
      selected[String(value)] = true;
    });
    clear(node);
    node.size = Math.min(Math.max(options.length, 4), 9);
    options.forEach(function (option) {
      var item = document.createElement("option");
      item.value = option.value;
      item.textContent = option.label;
      item.selected = Boolean(selected[String(option.value)]);
      node.appendChild(item);
    });
    return node;
  }

  function preferredOption(options, spec) {
    if (!options.length) return "";
    var allMatch = options.find(function (option) { return String(option.value) === "all"; });
    if (allMatch && (!spec || spec.preferAll !== false)) return allMatch.value;
    if (!spec || spec.preferTotal !== false) {
      var totalMatch = options.find(function (option) { return isTotal(spec && spec.field, option.value); });
      if (totalMatch) return totalMatch.value;
    }
    if (spec && spec.preferNonTotal) {
      var nonTotal = options.find(function (option) { return !isTotal(spec.field, option.value); });
      if (nonTotal) return nonTotal.value;
    }
    return options[0].value;
  }

  function optionAllowed(options, spec, current) {
    return options.some(function (option) {
      if (String(option.value) === String(current)) return true;
      if (spec && spec.field && isTotal(spec.field, option.value) && isTotal(spec.field, current)) return true;
      return spec && spec.field && optionIdentity(spec.field, option.value) === optionIdentity(spec.field, current);
    });
  }

  function matchingOption(options, spec, current) {
    var exact = options.find(function (option) {
      return String(option.value) === String(current);
    });
    if (exact) return exact;
    return options.find(function (option) {
      if (!spec || !spec.field) return false;
      if (isTotal(spec.field, option.value) && isTotal(spec.field, current)) return true;
      return optionIdentity(spec.field, option.value) === optionIdentity(spec.field, current);
    }) || null;
  }

  function activeFilterValue(spec, value) {
    if (!spec || !spec.field) return false;
    if (value === null || value === undefined || value === "" || String(value) === "all") return false;
    return !isTotal(spec.field, value);
  }

  function filterSpecsToFilters(specs, targetState) {
    var filters = {};
    specs.forEach(function (item) {
      if (item.field && targetState[item.key] !== undefined) filters[item.field] = targetState[item.key];
    });
    return filters;
  }

  function filteredRowsForSpecs(rows, specs, targetState) {
    return filterRows(rows, filterSpecsToFilters(specs, targetState));
  }

  function filterResetRank(spec, index) {
    if (!spec || !spec.field) return -1000;
    if (["year", "geography_code", "sex", "pay_period", "statistic"].indexOf(spec.key) >= 0) return -100 + index;
    return index;
  }

  function normalizeFilterState(rows, specs, targetState) {
    if (filteredRowsForSpecs(rows, specs, targetState).length) return;
    var changedKey = targetState.changedKey;
    var candidates = specs.map(function (spec, index) {
      return { spec: spec, index: index, rank: filterResetRank(spec, index) };
    }).filter(function (item) {
      return item.spec.field && item.spec.key !== changedKey && activeFilterValue(item.spec, targetState[item.spec.key]);
    }).sort(function (a, b) {
      return b.rank - a.rank;
    });
    for (var index = 0; index < candidates.length; index += 1) {
      var spec = candidates[index].spec;
      var filters = filterSpecsToFilters(specs, targetState);
      var optionRows = filterRows(rows, filters, spec.field);
      var options = spec.options ? spec.options(optionRows) : uniqueOptions(optionRows, spec.field, spec.labelField, spec.includeTotals);
      if (!options.length) continue;
      targetState[spec.key] = preferredOption(options, spec);
      if (filteredRowsForSpecs(rows, specs, targetState).length) return;
    }
  }

  function syncFilters(containerId, specs, rows, targetState, onChange) {
    var container = byId(containerId);
    if (!container) return;
    normalizeFilterState(rows, specs, targetState);
    targetState.changedKey = null;
    specs.forEach(function (spec) {
      var filters = {};
      specs.forEach(function (item) {
        if (item.field && targetState[item.key] !== undefined) filters[item.field] = targetState[item.key];
      });
      var optionRows = spec.stableOptions ? rows : filterRows(rows, filters, spec.field);
      var options = spec.options ? spec.options(optionRows) : uniqueOptions(optionRows, spec.field, spec.labelField, spec.includeTotals);
      if (!options.length) {
        var node = container.querySelector('[data-filter="' + spec.key + '"]');
        if (node) node.remove();
        return;
      }
      var current = targetState[spec.key];
      var matched = matchingOption(options, spec, current);
      var allowed = Boolean(matched) || optionAllowed(options, spec, current);
      if (!allowed) {
        targetState[spec.key] = preferredOption(options, spec);
        current = targetState[spec.key];
      } else if (matched && String(matched.value) !== String(current)) {
        targetState[spec.key] = matched.value;
        current = targetState[spec.key];
      }
      if (spec.hideSingle && options.length <= 1) {
        targetState[spec.key] = options[0].value;
        var singleNode = container.querySelector('[data-filter="' + spec.key + '"]');
        if (singleNode) singleNode.remove();
        return;
      }
      ensureSelect(container, spec, options, current, function (key, value) {
        targetState[key] = value;
        targetState.changedKey = key;
        onChange(key);
      });
    });
  }

  function optionalDimensionOptions(rows, field, labelField, label) {
    var options = uniqueOptions(rows, field, labelField, false);
    if (!options.length) return [];
    return [{ value: "all", label: label || "Tutto" }].concat(options);
  }

  function totalCountText(total, noun) {
    return total + " " + noun;
  }

  function grossRows() {
    return state.grossRecords;
  }

  function distributionRows() {
    return state.distributionRecords;
  }

  function istatDistributionRows() {
    return state.istatDistributionRecords;
  }

  function eurostatDistributionRows() {
    return state.eurostatDistributionRecords;
  }

  function rowMatches(row, filters) {
    return Object.keys(filters).every(function (key) {
      return matchesFilterValue(row, key, filters[key]);
    });
  }

  function latestRecord(rows, filters) {
    var filtered = toArray(rows).filter(function (row) { return rowMatches(row, filters); });
    filtered.sort(function (a, b) {
      return (toNumber(b.year) || 0) - (toNumber(a.year) || 0);
    });
    return filtered[0] || null;
  }

  function latestYear(rows, filters) {
    var record = latestRecord(rows, filters || {});
    return record ? record.year : null;
  }

  function appendKpi(container, title, record, formatter, note) {
    var card = document.createElement("div");
    card.className = "si-kpi";
    var label = document.createElement("span");
    var value = document.createElement("strong");
    var year = document.createElement("em");
    var small = document.createElement("small");
    label.textContent = title;
    value.textContent = record ? formatter(record.value) : MISSING;
    year.textContent = record ? text(record.year) + " · " + text(record.source_request || record.source, "fonte") : "Dato non disponibile";
    small.textContent = note || (record ? text(lookupLabel("geography_code", record.geography_code), record.geography_code) : "");
    card.appendChild(label);
    card.appendChild(value);
    card.appendChild(year);
    card.appendChild(small);
    container.appendChild(card);
  }

  function renderKpis() {
    var container = byId("siKpis");
    if (!container) return;
    clear(container);
    var records = state.records;
    appendKpi(container, "Mediana oraria lorda", latestRecord(records, {
      geography_code: "IT", sex: "T", age_class: "TOTAL", education: "99", sector: "0010", contract_type: "9", working_time: "9", contractual_occupation: "99", firm_size: "TOTAL", country_birth: "WORLD", pay_concept: "gross_earnings", pay_period: "hourly", statistic: "median"
    }), function (value) { return euro(value, 2); }, "ISTAT RACLI");
    appendKpi(container, "Media mensile lorda", latestRecord(records, {
      geography_code: "IT", sex: "T", pay_concept: "gross_earnings", pay_period: "monthly", statistic: "mean"
    }), function (value) { return euro(value, 0); }, "Retribuzione mensile, non netto");
    appendKpi(container, "D9 / D1 orario", latestRecord(records, {
      geography_code: "IT", sex: "T", age_class: "TOTAL", education: "99", sector: "0010", contract_type: "9", working_time: "9", contractual_occupation: "99", firm_size: "TOTAL", country_birth: "WORLD", pay_concept: "gross_earnings_ratio", pay_period: "hourly", statistic: "d9_d1"
    }), function (value) { return fmt(value, 2) + "x"; }, "Rapporto tra salari alti e bassi");
    appendKpi(container, "Bassa retribuzione", latestRecord(records, {
      geography_code: "IT", pay_concept: "low_wage_earners", statistic: "share_below_two_thirds_median"
    }), percent, "Quota sotto due terzi della mediana");
    appendKpi(container, "Gender pay gap", latestRecord(records, {
      geography_code: "IT", pay_concept: "gender_pay_gap_unadjusted"
    }), percent, "Non corretto per composizione");
    appendKpi(container, "Costo orario lavoro", latestRecord(records, {
      geography_code: "IT", pay_concept: "labour_cost", sector: "B-S_X_O"
    }), function (value) { return euro(value, 1); }, "Costo del lavoro, non salario netto");
  }

  function statName(row) {
    if (row.percentile === 10) return "P10 / D1";
    if (row.percentile === 50) return "P50 / mediana";
    if (row.percentile === 90) return "P90 / D9";
    return STAT_LABELS[row.statistic] || text(row.statistic);
  }

  function statOrder(row) {
    if (row.percentile === 10) return 1;
    if (row.statistic === "median") return 2;
    if (row.statistic === "mean") return 3;
    if (row.percentile === 90) return 4;
    return 9;
  }

  function plotDistributionRows(selected) {
    plot("siDistributionChart", [{
      type: "bar",
      x: selected.map(statName),
      y: selected.map(function (row) { return row.value; }),
      marker: { color: COLORS[0] },
      text: selected.map(function (row) { return euro(row.value, state.distribution.pay_period === "hourly" ? 2 : 0); }),
      textposition: "outside",
      hovertemplate: "%{x}<br>%{text}<extra></extra>"
    }], {
      yaxis: { title: payAxisTitle(state.distribution.pay_period), rangemode: "tozero" },
      xaxis: { title: "" }
    });
  }

  function renderDistributionPreview(rows) {
    var filters = byId("siDistributionFilters");
    if (filters) clear(filters);
    var selected = filterRows(rows, {
      year: state.distribution.year,
      geography_code: state.distribution.geography_code,
      sex: state.distribution.sex,
      age_class: state.distribution.age_class,
      education: state.distribution.education,
      sector: state.distribution.sector,
      contract_type: state.distribution.contract_type,
      working_time: state.distribution.working_time,
      contractual_occupation: state.distribution.contractual_occupation,
      firm_size: state.distribution.firm_size,
      country_birth: state.distribution.country_birth,
      paid_days: state.distribution.paid_days,
      pay_period: state.distribution.pay_period
    }).sort(function (a, b) { return statOrder(a) - statOrder(b); });
    byId("siDistributionTitle").textContent = "Punti ufficiali della " + payPeriodText(state.distribution.pay_period);
    byId("siDistributionTag").textContent = text(state.distribution.year) + " · " + text(lookupLabel("geography_code", state.distribution.geography_code), state.distribution.geography_code);
    var note = byId("siDistributionNote");
    if (note) {
      note.textContent = "Le fonti aggregate integrate pubblicano D1/P10, mediana/P50, D9/P90 e media. D2-D8 e distribuzione piena non vengono interpolati se non esiste una tavola ufficiale con classi o frequenze.";
    }
    if (!selected.length) {
      showEmpty("siDistributionChart", "Nessun punto distributivo disponibile per questa selezione.");
      return;
    }
    plotDistributionRows(selected);
  }

  function renderDistribution() {
    var rows = istatDistributionRows().concat(eurostatDistributionRows().filter(function (row) {
      return row.source_request === "ses_monthly_distribution" || row.source_request === "ses_annual_distribution";
    }));
    var specs = [
      { key: "year", field: "year", label: "Anno", options: yearsFrom, includeTotals: true },
      { key: "geography_code", field: "geography_code", label: "Territorio", labelField: "geography_name", includeTotals: true },
      { key: "sex", field: "sex", label: "Sesso", labelField: "sex_label", includeTotals: true, hideSingle: true },
      { key: "age_class", field: "age_class", label: "Età", labelField: "age_label", includeTotals: true, hideSingle: true },
      { key: "education", field: "education", label: "Titolo di studio", labelField: "education_label", includeTotals: true, hideSingle: true },
      { key: "sector", field: "sector", label: "Settore", labelField: "sector_label", includeTotals: true, hideSingle: true },
      { key: "contract_type", field: "contract_type", label: "Contratto", labelField: "contract_type_label", includeTotals: true, hideSingle: true },
      { key: "working_time", field: "working_time", label: "Orario", labelField: "working_time_label", includeTotals: true, hideSingle: true },
      { key: "contractual_occupation", field: "contractual_occupation", label: "Qualifica", labelField: "contractual_occupation_label", includeTotals: true, hideSingle: true },
      { key: "firm_size", field: "firm_size", label: "Dimensione", labelField: "firm_size_label", includeTotals: true, hideSingle: true },
      { key: "country_birth", field: "country_birth", label: "Paese nascita", labelField: "country_birth_label", includeTotals: true, hideSingle: true },
      { key: "paid_days", field: "paid_days", label: "Giornate retribuite", labelField: "paid_days_label", includeTotals: true, hideSingle: true },
      { key: "pay_period", field: "pay_period", label: "Unità retributiva", options: periodOptions, includeTotals: true, hideSingle: true }
    ];
    if (!state.distribution.year) {
      state.distribution.year = latestYear(rows, { geography_code: "IT", sex: "T", pay_period: "hourly" });
    }
    if (!state.fullDataset) {
      renderDistributionPreview(rows);
      return;
    }
    syncFilters("siDistributionFilters", specs, rows, state.distribution, renderDistribution);
    var selected = filterRows(rows, {
      year: state.distribution.year,
      geography_code: state.distribution.geography_code,
      sex: state.distribution.sex,
      age_class: state.distribution.age_class,
      education: state.distribution.education,
      sector: state.distribution.sector,
      contract_type: state.distribution.contract_type,
      working_time: state.distribution.working_time,
      contractual_occupation: state.distribution.contractual_occupation,
      firm_size: state.distribution.firm_size,
      country_birth: state.distribution.country_birth,
      paid_days: state.distribution.paid_days,
      pay_period: state.distribution.pay_period
    }).sort(function (a, b) { return statOrder(a) - statOrder(b); });
    var byStat = {};
    selected.forEach(function (row) {
      var key = statName(row);
      if (!byStat[key] || row.source === "ISTAT") byStat[key] = row;
    });
    selected = Object.keys(byStat).map(function (key) { return byStat[key]; }).sort(function (a, b) { return statOrder(a) - statOrder(b); });
    byId("siDistributionTitle").textContent = "Punti ufficiali della " + payPeriodText(state.distribution.pay_period);
    byId("siDistributionTag").textContent = text(state.distribution.year) + " · " + text(lookupLabel("geography_code", state.distribution.geography_code), state.distribution.geography_code);
    var note = byId("siDistributionNote");
    if (note) {
      note.textContent = "Le fonti aggregate integrate pubblicano D1/P10, mediana/P50, D9/P90 e media. D2-D8 e distribuzione piena non vengono interpolati se non esiste una tavola ufficiale con classi o frequenze.";
    }
    if (!selected.length) {
      showEmpty("siDistributionChart", "Nessun punto distributivo disponibile per questa selezione.");
      return;
    }
    plotDistributionRows(selected);
  }

  function periodOptions(rows) {
    return uniqueOptions(rows, "pay_period", null, true).map(function (option) {
      return { value: option.value, label: PERIOD_LABELS[option.value] || option.value };
    });
  }

  function payPeriodText(value) {
    return {
      hourly: "retribuzione oraria",
      monthly: "retribuzione mensile",
      annual: "retribuzione annuale"
    }[value] || text(PERIOD_LABELS[value], value);
  }

  function payAxisTitle(value) {
    return {
      hourly: "Retribuzione oraria lorda (euro per ora)",
      monthly: "Retribuzione mensile lorda (euro)",
      annual: "Retribuzione annuale lorda (euro)"
    }[value] || "Euro";
  }

  function statisticOptions(rows) {
    return uniqueOptions(rows, "statistic", null, true).filter(function (option) {
      return ["mean", "median"].indexOf(option.value) >= 0;
    }).map(function (option) {
      return { value: option.value, label: STAT_LABELS[option.value] || option.value };
    });
  }

  function hasSeriesYears(rows, minimumYears) {
    var years = {};
    toArray(rows).forEach(function (row) {
      if (row.year !== null && row.year !== undefined && row.year !== "") years[String(row.year)] = true;
    });
    return Object.keys(years).length >= (minimumYears || 2);
  }

  function seriesDimensionOptions(rows, field, labelField, includeTotals) {
    var groups = {};
    toArray(rows).forEach(function (row) {
      var value = row[field];
      if (value === null || value === undefined || value === "") return;
      var key = String(value);
      groups[key] = groups[key] || [];
      groups[key].push(row);
    });
    var eligibleRows = toArray(rows).filter(function (row) {
      var value = row[field];
      if (value === null || value === undefined || value === "") return false;
      return hasSeriesYears(groups[String(value)], 2);
    });
    return uniqueOptions(eligibleRows, field, labelField, includeTotals);
  }

  function seriesStatisticOptions(rows) {
    var base = statisticOptions(rows).filter(function (option) {
      return hasSeriesYears(toArray(rows).filter(function (row) {
        return matchesFilterValue(row, "statistic", option.value);
      }), 2);
    });
    return hasSeriesYears(rows, 2) ? [{ value: "all", label: "Tutto" }].concat(base) : base;
  }

  function dimensionOptions(keys, rows) {
    return keys.filter(function (key) {
      var dimension = DIMENSIONS[key];
      return rows.some(function (row) {
        return row[dimension.field] !== undefined && row[dimension.field] !== null && !isTotal(dimension.field, row[dimension.field]);
      });
    }).map(function (key) {
      return { value: key, label: DIMENSIONS[key].label };
    });
  }

  function analysisFilterSpecs(activeDimensionKey, includeKeys) {
    return ANALYSIS_FILTER_KEYS.filter(function (key) {
      return key !== "sex" && includeKeys.indexOf(key) >= 0;
    }).map(function (key) {
      var dimension = DIMENSIONS[key];
      return {
        key: key,
        field: dimension.field,
        label: dimension.label,
        labelField: dimension.labelField,
        options: function (optionRows) {
          return optionalDimensionOptions(optionRows, dimension.field, dimension.labelField, "Tutto");
        },
        stableOptions: true,
        preferAll: true,
        preferTotal: false
      };
    });
  }

  function analysisRows(targetState, dimensionKey) {
    var dimension = DIMENSIONS[dimensionKey];
    return grossRows().filter(function (row) {
      if (!dimension || row[dimension.field] === undefined || row[dimension.field] === null) return false;
      if (isTotal(dimension.field, row[dimension.field])) return false;
      if (targetState.year && String(row.year) !== String(targetState.year)) return false;
      if (targetState.geography_code && String(row.geography_code) !== String(targetState.geography_code)) return false;
      if (targetState.pay_period && String(row.pay_period) !== String(targetState.pay_period)) return false;
      if (targetState.statistic && String(row.statistic) !== String(targetState.statistic)) return false;
      for (var index = 0; index < ANALYSIS_FILTER_KEYS.length; index += 1) {
        var key = ANALYSIS_FILTER_KEYS[index];
        var item = DIMENSIONS[key];
        var value = targetState[key];
        if (!item || item.field === dimension.field || value === null || value === undefined || value === "") continue;
        if (String(value) === "all") {
          if (row[item.field] !== null && row[item.field] !== undefined && row[item.field] !== "" && !isTotal(item.field, row[item.field])) return false;
          continue;
        }
        if (!matchesFilterValue(row, item.field, value)) return false;
      }
      return true;
    });
  }

  function analysisRequestName(dimensionKey) {
    return {
      sex: "gender",
      age_class: "age",
      education: "education",
      country_birth: "country_birth",
      working_time: "working_time",
      contract_type: "contract",
      firm_size: "firm_size",
      contractual_occupation: "qualification",
      paid_days: "paid_days",
      sector: "sector"
    }[dimensionKey] || "";
  }

  function analysisRowPriority(row, dimensionKey) {
    var request = String(row.source_request || "");
    var priority = row.source === "ISTAT" ? 0 : 100;
    var requestName = analysisRequestName(dimensionKey);
    if (requestName && request.indexOf("istat_racli_sector_" + requestName) === 0) priority -= 20;
    if (request === "istat_racli_sector_gender") priority -= 10;
    if (hasOnlyTotalAnalysisDimensionsExcept(row, [dimensionKey])) priority -= 5;
    return priority;
  }

  function dedupeAnalysisRows(rows, dimensionKey) {
    var dimension = DIMENSIONS[dimensionKey];
    var selected = {};
    if (!dimension) return [];
    toArray(rows).forEach(function (row) {
      var key = optionIdentity(dimension.field, row[dimension.field]) || String(row[dimension.field]);
      var existing = selected[key];
      if (!existing || analysisRowPriority(row, dimensionKey) < analysisRowPriority(existing, dimensionKey)) {
        selected[key] = row;
      }
    });
    return Object.keys(selected).map(function (key) { return selected[key]; });
  }

  function categoryLabels(rows, dimension) {
    var labels = toArray(rows).map(function (row) {
      return optionLabel(row, dimension.field, dimension.labelField);
    });
    var counts = {};
    labels.forEach(function (label) {
      counts[label] = (counts[label] || 0) + 1;
    });
    return labels.map(function (label, index) {
      if (counts[label] <= 1) return label;
      return label + " (" + text(rows[index][dimension.field]) + ")";
    });
  }

  function barChartHeight(count) {
    var rows = Math.max(Number(count) || 0, 1);
    return Math.max(460, rows * 24 + 150);
  }

  function renderBarByDimension(chartId, titleId, tagId, targetState, dimensionKeys, containerId, onFilterChange) {
    var rows = grossRows();
    var includedFilters = dimensionKeys.concat(["sector", "working_time", "firm_size", "contractual_occupation", "contract_type", "country_birth", "education", "age_class", "paid_days"]);
    var specs = [
      { key: "dimension", label: "Dimensione", options: function () { return dimensionOptions(dimensionKeys, rows); } },
      { key: "year", field: "year", label: "Anno", options: yearsFrom, includeTotals: true, stableOptions: true },
      { key: "geography_code", field: "geography_code", label: "Territorio", labelField: "geography_name", includeTotals: true, stableOptions: true },
      { key: "sex", field: "sex", label: "Sesso", labelField: "sex_label", includeTotals: true, stableOptions: true },
      { key: "pay_period", field: "pay_period", label: "Unità retributiva", options: periodOptions, includeTotals: true, hideSingle: true, stableOptions: true },
      { key: "statistic", field: "statistic", label: "Statistica", options: statisticOptions, includeTotals: true, stableOptions: true }
    ].concat(analysisFilterSpecs(targetState.dimension, includedFilters));
    if (!targetState.year) {
      targetState.year = latestYear(rows, { geography_code: "IT", pay_period: targetState.pay_period, statistic: targetState.statistic });
    }
    syncFilters(containerId, specs, rows, targetState, onFilterChange || renderAll);
    var dimension = DIMENSIONS[targetState.dimension];
    var selected = dedupeAnalysisRows(analysisRows(targetState, targetState.dimension), targetState.dimension);
    selected.sort(function (a, b) { return (toNumber(b.value) || 0) - (toNumber(a.value) || 0); });
    var totalSelected = selected.length;
    selected = selected.reverse();
    byId(titleId).textContent = dimension ? "Retribuzione per " + dimension.label.toLowerCase() : "Retribuzione";
    byId(tagId).textContent = [text(targetState.year), PERIOD_LABELS[targetState.pay_period] || targetState.pay_period, STAT_LABELS[targetState.statistic] || targetState.statistic, totalCountText(totalSelected, "elementi")].join(" · ");
    if (!selected.length || !dimension) {
      showEmpty(chartId, "Nessun dato disponibile per questa combinazione.");
      return;
    }
    plot(chartId, [{
      type: "bar",
      orientation: "h",
      x: selected.map(function (row) { return row.value; }),
      y: categoryLabels(selected, dimension),
      marker: { color: COLORS[1] },
      hovertemplate: "%{y}<br>%{x:.2f} €<extra></extra>"
    }], {
      height: barChartHeight(selected.length),
      margin: { t: 22, r: 18, b: 52, l: 180 },
      xaxis: { title: payAxisTitle(targetState.pay_period), rangemode: "tozero" },
      yaxis: { title: "", automargin: true }
    });
  }

  function renderWorker() {
    renderBarByDimension("siWorkerChart", "siWorkerTitle", "siWorkerTag", state.worker, ["sex", "age_class", "education", "country_birth", "occupation", "seniority"], "siWorkerFilters", renderWorker);
    renderLowWage();
  }

  function renderJob() {
    renderBarByDimension("siJobChart", "siJobTitle", "siJobTag", state.job, ["sector", "working_time", "firm_size", "contractual_occupation", "occupation", "contract_type"], "siJobFilters", renderJob);
    renderSectorBox();
    renderLabourCost();
  }

  function activeJobBoxFilters() {
    return ["age_class", "education", "country_birth", "working_time", "contract_type", "contractual_occupation", "firm_size", "paid_days"].filter(function (key) {
      var value = state.job[key];
      return value !== null && value !== undefined && value !== "" && String(value) !== "all";
    });
  }

  function sectorBoxBaseRows() {
    return grossRows().filter(function (row) {
      return String(row.source_request || "").indexOf("istat_racli_sector_") === 0
        && row.pay_period === "hourly"
        && row.geography_code === "IT"
        && row.sector
        && !isTotal("sector", row.sector);
    });
  }

  function sectorBoxPriority(row, activeKeys) {
    var request = String(row.source_request || "");
    if (!activeKeys.length && request === "istat_racli_sector_gender") return 0;
    if (activeKeys.indexOf("education") >= 0 && request === "istat_racli_sector_education") return 0;
    if (activeKeys.indexOf("country_birth") >= 0 && request === "istat_racli_sector_country_birth") return 0;
    if (activeKeys.indexOf("working_time") >= 0 && request === "istat_racli_sector_working_time") return 0;
    if (activeKeys.indexOf("contract_type") >= 0 && request === "istat_racli_sector_contract") return 0;
    if (activeKeys.indexOf("firm_size") >= 0 && request === "istat_racli_sector_firm_size") return 0;
    if (activeKeys.indexOf("contractual_occupation") >= 0 && request === "istat_racli_sector_qualification") return 0;
    if (activeKeys.indexOf("age_class") >= 0 && request === "istat_racli_sector_age") return 0;
    if (activeKeys.indexOf("paid_days") >= 0 && request === "istat_racli_sector_paid_days") return 0;
    return request === "istat_racli_sector_gender" ? 1 : 2;
  }

  function dedupeSectorRows(rows, activeKeys) {
    var selected = {};
    toArray(rows).forEach(function (row) {
      var key = row.sector;
      var existing = selected[key];
      if (!existing || sectorBoxPriority(row, activeKeys) < sectorBoxPriority(existing, activeKeys)) {
        selected[key] = row;
      }
    });
    return Object.keys(selected).map(function (key) { return selected[key]; });
  }

  function sectorBoxRows() {
    if (String(state.job.geography_code) !== "IT") return [];
    var activeKeys = activeJobBoxFilters();
    var rows = sectorBoxBaseRows().filter(function (row) {
      if (String(row.year) !== String(state.job.year)) return false;
      if (String(row.statistic) !== String(state.job.statistic)) return false;
      if (!matchesFilterValue(row, "sex", state.job.sex)) return false;
      for (var index = 0; index < activeKeys.length; index += 1) {
        var key = activeKeys[index];
        var item = DIMENSIONS[key];
        if (!item || !matchesFilterValue(row, item.field, state.job[key])) return false;
      }
      if (!activeKeys.length && !hasOnlyTotalAnalysisDimensionsExcept(row, ["sector"])) return false;
      return true;
    });
    return dedupeSectorRows(rows, activeKeys).filter(function (row) {
      return toNumber(row.value) !== null;
    }).sort(function (a, b) {
      return (toNumber(a.value) || 0) - (toNumber(b.value) || 0);
    });
  }

  function latestSectorBoxYear() {
    return latestYear(sectorBoxBaseRows(), { sex: "T", statistic: "median" });
  }

  function medianValue(values) {
    var ordered = values.map(Number).filter(Number.isFinite).sort(function (a, b) { return a - b; });
    if (!ordered.length) return null;
    var middle = Math.floor(ordered.length / 2);
    if (ordered.length % 2) return ordered[middle];
    return (ordered[middle - 1] + ordered[middle]) / 2;
  }

  function renderSectorBoxSummary(rows) {
    var picker = byId("siSectorPicker");
    if (!picker) return;
    clear(picker);
    if (!rows.length) return;
    var minRow = rows[0];
    var maxRow = rows[rows.length - 1];
    var values = rows.map(function (row) { return row.value; });
    [
      "Settori: " + rows.length,
      "min " + optionLabel(minRow, "sector", "sector_label") + " " + euro(minRow.value, 2),
      "mediana settori " + euro(medianValue(values), 2),
      "max " + optionLabel(maxRow, "sector", "sector_label") + " " + euro(maxRow.value, 2)
    ].forEach(function (textValue) {
      var item = document.createElement("span");
      item.className = "si-box-summary-item";
      item.textContent = textValue;
      picker.appendChild(item);
    });
  }

  function renderSectorBox() {
    var rows = sectorBoxRows();
    renderSectorBoxSummary(rows);
    if (!rows.length) {
      showEmpty("siSectorBoxChart", "Boxplot settoriale disponibile solo per combinazioni pubblicate da ISTAT RACLI. L'incrocio settore-territorio provinciale non è disponibile e non viene stimato.");
      return;
    }
    plot("siSectorBoxChart", [{
      type: "box",
      name: "Settori ATECO",
      y: rows.map(function (row) { return row.value; }),
      text: rows.map(function (row) { return optionLabel(row, "sector", "sector_label"); }),
      marker: { color: COLORS[0], opacity: 0.78, size: 7 },
      line: { color: COLORS[0], width: 1.8 },
      fillcolor: "rgba(255,107,42,.18)",
      boxpoints: "all",
      jitter: 0.36,
      pointpos: 0,
      hovertemplate: "<b>%{text}</b><br>Retribuzione: %{y:.2f} €<extra></extra>"
    }], {
      height: 560,
      margin: { t: 22, r: 18, b: 72, l: 70 },
      xaxis: { title: "", automargin: true },
      yaxis: { title: "Retribuzione oraria lorda (euro per ora)", rangemode: "tozero" }
    });
  }

  function lowWageRowsForDimension(dimensionKey) {
    var requestByDimension = {
      geography_code: "low_wage_share",
      sex: "low_wage_share",
      age_class: "low_wage_share_by_age",
      education: "low_wage_share_by_education"
    };
    var request = requestByDimension[dimensionKey] || "low_wage_share";
    return state.records.filter(function (row) {
      return row.pay_concept === "low_wage_earners" && row.source_request === request;
    });
  }

  function lowWageDimensionOptions() {
    return [
      { value: "geography_code", label: "Paese" },
      { value: "sex", label: "Sesso" },
      { value: "age_class", label: "Età" },
      { value: "education", label: "Titolo di studio" }
    ];
  }

  function renderLowWage() {
    var rows = lowWageRowsForDimension(state.lowWage.dimension);
    var specs = [
      { key: "dimension", label: "Dimensione", options: lowWageDimensionOptions, preferAll: false, preferTotal: false },
      { key: "year", field: "year", label: "Anno", options: yearsFrom, includeTotals: true }
    ];
    if (state.lowWage.dimension !== "geography_code") {
      specs.push({ key: "geography_code", field: "geography_code", label: "Paese", labelField: "geography_name", includeTotals: true });
    }
    if (!state.lowWage.year) {
      state.lowWage.year = latestYear(rows, {});
    }
    syncFilters("siLowWageFilters", specs, rows, state.lowWage, renderLowWage);
    rows = lowWageRowsForDimension(state.lowWage.dimension).filter(function (row) {
      if (String(row.year) !== String(state.lowWage.year)) return false;
      if (state.lowWage.dimension !== "geography_code" && String(row.geography_code) !== String(state.lowWage.geography_code)) return false;
      if (state.lowWage.dimension === "geography_code") return String(row.sex || "T") === "T";
      return row[DIMENSIONS[state.lowWage.dimension].field] !== undefined && row[DIMENSIONS[state.lowWage.dimension].field] !== null;
    });
    var dimension = DIMENSIONS[state.lowWage.dimension] || DIMENSIONS.geography_code;
    rows.sort(function (a, b) { return (toNumber(b.value) || 0) - (toNumber(a.value) || 0); });
    rows = rows.reverse();
    if (!rows.length) {
      showEmpty("siLowWageChart", "Quota di bassa retribuzione non disponibile per questa selezione.");
      return;
    }
    plot("siLowWageChart", [{
      type: "bar",
      orientation: "h",
      x: rows.map(function (row) { return row.value; }),
      y: rows.map(function (row) { return optionLabel(row, dimension.field, dimension.labelField); }),
      marker: { color: COLORS[4] },
      hovertemplate: "%{y}<br>%{x:.1f}%<extra></extra>"
    }], {
      height: 460,
      margin: { t: 22, r: 18, b: 52, l: 170 },
      xaxis: { title: "% dei dipendenti", rangemode: "tozero" },
      yaxis: { title: "", automargin: true }
    });
  }

  function renderLabourCost() {
    var rows = state.records.filter(function (row) {
      return row.pay_concept === "labour_cost" && row.geography_code === state.job.geography_code;
    });
    var sectors = uniqueOptions(rows, "sector", "sector_label", false);
    var traces = sectors.map(function (sector, index) {
      var sectorRows = rows.filter(function (row) { return String(row.sector) === sector.value; }).sort(function (a, b) {
        return Number(a.year) - Number(b.year);
      });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: sector.label,
        x: sectorRows.map(function (row) { return row.year; }),
        y: sectorRows.map(function (row) { return row.value; }),
        line: { color: COLORS[index % COLORS.length], width: 3 },
        hovertemplate: "%{fullData.name}<br>%{x}: %{y:.1f} €<extra></extra>"
      };
    }).filter(function (trace) { return trace.x.length; });
    plot("siLabourCostChart", traces, {
      yaxis: { title: "Euro per ora", rangemode: "tozero" },
      xaxis: { title: "" }
    });
  }

  function geographyLevel(code) {
    var value = String(code || "");
    if (value === "IT") return "country";
    if (/^\d{6}$/.test(value)) return "municipality";
    if (value.length >= 5) return "province";
    if (value.length === 4) return "region";
    if (value.length === 3) return "macroarea";
    return "other";
  }

  function territoryLevelLabel(level) {
    return {
      region: "Regioni",
      province: "Province",
      municipality: "Comuni"
    }[level] || level;
  }

  function territoryLevelOptions(rows) {
    var levels = {};
    toArray(rows).forEach(function (row) {
      var level = geographyLevel(row.geography_code);
      if (["region", "province", "municipality"].indexOf(level) >= 0) levels[level] = true;
    });
    return ["region", "province", "municipality"].filter(function (level) {
      return levels[level];
    }).map(function (level) {
      return { value: level, label: territoryLevelLabel(level) };
    });
  }

  function territoryOptionsByLevel(rows, level, allLabel) {
    var seen = {};
    toArray(rows).forEach(function (row) {
      if (geographyLevel(row.geography_code) !== level) return;
      seen[String(row.geography_code)] = {
        value: String(row.geography_code),
        label: optionLabel(row, "geography_code", "geography_name")
      };
    });
    return [{ value: "all", label: allLabel }].concat(Object.keys(seen).map(function (key) {
      return seen[key];
    }).sort(function (a, b) {
      return a.label.localeCompare(b.label, "it");
    }));
  }

  function regionOptions(rows) {
    return territoryOptionsByLevel(rows, "region", "Tutte le regioni");
  }

  function provinceOptions(rows) {
    var provinces = toArray(rows).filter(function (row) {
      if (geographyLevel(row.geography_code) !== "province") return false;
      if (state.territory.region_code && state.territory.region_code !== "all") {
        return String(row.geography_code).indexOf(String(state.territory.region_code)) === 0;
      }
      return true;
    });
    return territoryOptionsByLevel(provinces, "province", "Tutte le province");
  }

  function territorySelectionLevel() {
    if (state.territory.province_code && state.territory.province_code !== "all") return "province";
    if (state.territory.region_code && state.territory.region_code !== "all") return "province";
    return "region";
  }

  function activeTerritoryFilters() {
    return ANALYSIS_FILTER_KEYS.filter(function (key) {
      var value = state.territory[key];
      return key !== "sex" && value !== null && value !== undefined && value !== "" && String(value) !== "all";
    });
  }

  function territoryBaseRows() {
    return grossRows().filter(function (row) {
      return String(row.source_request || "").indexOf("istat_racli_province_") === 0
        && row.pay_period === "hourly"
        && row.geography_code
        && row.geography_code !== "IT"
        && row.sector === "0010";
    });
  }

  function territoryPriority(row, activeKeys) {
    var request = String(row.source_request || "");
    if (!activeKeys.length && request === "istat_racli_province_gender") return 0;
    if (activeKeys.indexOf("education") >= 0 && request === "istat_racli_province_education") return 0;
    if (activeKeys.indexOf("country_birth") >= 0 && request === "istat_racli_province_country_birth") return 0;
    if (activeKeys.indexOf("working_time") >= 0 && request === "istat_racli_province_working_time") return 0;
    if (activeKeys.indexOf("contract_type") >= 0 && request === "istat_racli_province_contract") return 0;
    if (activeKeys.indexOf("firm_size") >= 0 && request === "istat_racli_province_firm_size") return 0;
    if (activeKeys.indexOf("contractual_occupation") >= 0 && request === "istat_racli_province_qualification") return 0;
    if (activeKeys.indexOf("age_class") >= 0 && request === "istat_racli_province_age") return 0;
    if (activeKeys.indexOf("paid_days") >= 0 && request === "istat_racli_province_paid_days") return 0;
    return request === "istat_racli_province_gender" ? 1 : 2;
  }

  function dedupeTerritoryRows(rows, activeKeys) {
    var selected = {};
    toArray(rows).forEach(function (row) {
      var key = row.geography_code;
      var existing = selected[key];
      if (!existing || territoryPriority(row, activeKeys) < territoryPriority(existing, activeKeys)) {
        selected[key] = row;
      }
    });
    return Object.keys(selected).map(function (key) { return selected[key]; });
  }

  function hasOnlyTotalAnalysisDimensions(row) {
    return hasOnlyTotalAnalysisDimensionsExcept(row, []);
  }

  function hasOnlyTotalAnalysisDimensionsExcept(row, excludedKeys) {
    var excluded = toArray(excludedKeys);
    return ANALYSIS_FILTER_KEYS.every(function (key) {
      if (key === "sex") return true;
      if (excluded.indexOf(key) >= 0) return true;
      var item = DIMENSIONS[key];
      if (!item) return true;
      var value = row[item.field];
      return value === null || value === undefined || value === "" || isTotal(item.field, value);
    });
  }

  function renderTerritory() {
    var rows = territoryBaseRows();
    var specs = [
      { key: "region_code", label: "Regione", options: regionOptions, preferAll: false, preferTotal: false, stableOptions: true },
      { key: "province_code", label: "Provincia", options: provinceOptions, preferAll: false, preferTotal: false, stableOptions: true },
      { key: "year", field: "year", label: "Anno", options: yearsFrom, includeTotals: true, stableOptions: true },
      { key: "sex", field: "sex", label: "Sesso", labelField: "sex_label", includeTotals: true, stableOptions: true },
      { key: "statistic", field: "statistic", label: "Statistica", options: statisticOptions, includeTotals: true, stableOptions: true }
    ].concat(analysisFilterSpecs("", ["age_class", "education", "country_birth", "working_time", "contract_type", "contractual_occupation", "firm_size", "paid_days"]));
    if (!state.territory.year) {
      state.territory.year = latestYear(rows, { sex: "T", statistic: "median" });
    }
    syncFilters("siTerritoryFilters", specs, rows, state.territory, renderTerritory);
    var activeKeys = activeTerritoryFilters();
    var selectedLevel = territorySelectionLevel();
    var selected = rows.filter(function (row) {
      if (geographyLevel(row.geography_code) !== selectedLevel) return false;
      if (state.territory.province_code && state.territory.province_code !== "all" && String(row.geography_code) !== String(state.territory.province_code)) return false;
      if (state.territory.province_code === "all" && state.territory.region_code && state.territory.region_code !== "all" && String(row.geography_code).indexOf(String(state.territory.region_code)) !== 0) return false;
      if (String(row.year) !== String(state.territory.year)) return false;
      if (String(row.statistic) !== String(state.territory.statistic)) return false;
      if (state.territory.sex && !matchesFilterValue(row, "sex", state.territory.sex)) return false;
      for (var index = 0; index < ANALYSIS_FILTER_KEYS.length; index += 1) {
        var key = ANALYSIS_FILTER_KEYS[index];
        var item = DIMENSIONS[key];
        var value = state.territory[key];
        if (!item || key === "sex" || value === null || value === undefined || value === "" || String(value) === "all") continue;
        if (!matchesFilterValue(row, item.field, value)) return false;
      }
      if (!activeKeys.length && !hasOnlyTotalAnalysisDimensions(row)) return false;
      return true;
    });
    selected = dedupeTerritoryRows(selected, activeKeys);
    selected.sort(function (a, b) { return (toNumber(b.value) || 0) - (toNumber(a.value) || 0); });
    var totalSelected = selected.length;
    selected = selected.reverse();
    var regionName = state.territory.region_code && state.territory.region_code !== "all" ? lookupLabel("geography_code", state.territory.region_code) : "";
    byId("siTerritoryTitle").textContent = selectedLevel === "province" && regionName ? "Retribuzione per province: " + regionName : "Retribuzione per " + territoryLevelLabel(selectedLevel).toLowerCase();
    byId("siTerritoryTag").textContent = [text(state.territory.year), STAT_LABELS[state.territory.statistic] || state.territory.statistic, totalCountText(totalSelected, "territori")].join(" · ");
    if (!selected.length) {
      showEmpty("siTerritoryChart", "Confronto territoriale non disponibile per questa combinazione.");
      return;
    }
    plot("siTerritoryChart", [{
      type: "bar",
      orientation: "h",
      y: selected.map(function (row) { return optionLabel(row, "geography_code", "geography_name"); }),
      x: selected.map(function (row) { return row.value; }),
      marker: { color: COLORS[2] },
      hovertemplate: "%{y}<br>%{x:.2f} €<extra></extra>"
    }], {
      height: barChartHeight(selected.length),
      margin: { t: 22, r: 18, b: 52, l: 190 },
      xaxis: { title: "Retribuzione oraria lorda", rangemode: "tozero" },
      yaxis: { title: "", automargin: true }
    });
  }

  function paidDaysRows() {
    return grossRows().filter(function (row) {
      return String(row.source_request || "").indexOf("paid_days") >= 0
        && row.pay_period === "hourly"
        && row.paid_days
        && !isTotal("paid_days", row.paid_days);
    });
  }

  function paidDaysOrder(value) {
    return {
      D_UN90: 1,
      D1_3: 2,
      "D1-3": 2,
      D4_30: 3,
      "D4-30": 3,
      D31_60: 4,
      "D31-60": 4,
      D61_90: 5,
      "D61-90": 5,
      D_GE91: 6,
      D91_180: 7,
      "D91-180": 7,
      D181_270: 8,
      "D181-270": 8,
      D271_364: 9,
      "D271-364": 9
    }[String(value)] || 99;
  }

  function dedupePaidDaysRows(rows) {
    var selected = {};
    toArray(rows).forEach(function (row) {
      var key = String(row.paid_days);
      var existing = selected[key];
      if (!existing || seriesPriority(row) < seriesPriority(existing)) selected[key] = row;
    });
    return Object.keys(selected).map(function (key) { return selected[key]; });
  }

  function renderPaidDays() {
    var rows = paidDaysRows();
    var specs = [
      { key: "year", field: "year", label: "Anno", options: yearsFrom, includeTotals: true, stableOptions: true },
      { key: "geography_code", field: "geography_code", label: "Territorio", labelField: "geography_name", includeTotals: true, stableOptions: true },
      { key: "sex", field: "sex", label: "Sesso", labelField: "sex_label", includeTotals: true, stableOptions: true },
      { key: "sector", field: "sector", label: "Settore", labelField: "sector_label", includeTotals: true, stableOptions: true },
      { key: "statistic", field: "statistic", label: "Statistica", options: statisticOptions, includeTotals: true, stableOptions: true }
    ].concat(analysisFilterSpecs("paid_days", ["age_class", "education", "country_birth", "working_time", "contract_type", "contractual_occupation", "firm_size"]));
    if (!state.paidDays.year) {
      state.paidDays.year = latestYear(rows, { geography_code: "IT", sex: "T", sector: "0010", statistic: "median" });
    }
    syncFilters("siPaidDaysFilters", specs, rows, state.paidDays, renderPaidDays);
    var selected = filterRows(rows, {
      year: state.paidDays.year,
      geography_code: state.paidDays.geography_code,
      sex: state.paidDays.sex,
      sector: state.paidDays.sector,
      age_class: state.paidDays.age_class,
      education: state.paidDays.education,
      country_birth: state.paidDays.country_birth,
      working_time: state.paidDays.working_time,
      contract_type: state.paidDays.contract_type,
      contractual_occupation: state.paidDays.contractual_occupation,
      firm_size: state.paidDays.firm_size,
      statistic: state.paidDays.statistic
    });
    selected = dedupePaidDaysRows(selected).sort(function (a, b) {
      return paidDaysOrder(a.paid_days) - paidDaysOrder(b.paid_days);
    });
    byId("siPaidDaysTag").textContent = [text(state.paidDays.year), STAT_LABELS[state.paidDays.statistic] || state.paidDays.statistic].join(" · ");
    if (!selected.length) {
      showEmpty("siPaidDaysChart", "Classi di giornate retribuite non disponibili per questa selezione.");
      return;
    }
    plot("siPaidDaysChart", [{
      type: "bar",
      x: selected.map(function (row) { return optionLabel(row, "paid_days", "paid_days_label"); }),
      y: selected.map(function (row) { return row.value; }),
      marker: { color: COLORS[3] },
      text: selected.map(function (row) { return euro(row.value, 2); }),
      textposition: "outside",
      hovertemplate: "%{x}<br>%{text}<extra></extra>"
    }], {
      height: 500,
      yaxis: { title: "Euro per ora", rangemode: "tozero" },
      xaxis: { title: "", automargin: true }
    });
  }

  function countryOptionOrder(option) {
    var preferred = ["IT", "EU27_2020", "DE", "FR", "ES", "NL"];
    var index = preferred.indexOf(String(option.value));
    return index >= 0 ? index : 100;
  }

  function europeCountryOptions(rows) {
    var groups = {};
    toArray(rows).forEach(function (row) {
      if (!row.geography_code) return;
      groups[String(row.geography_code)] = groups[String(row.geography_code)] || [];
      groups[String(row.geography_code)].push(row);
    });
    var eligibleRows = toArray(rows).filter(function (row) {
      return row.geography_code && hasSeriesYears(groups[String(row.geography_code)], 2);
    });
    return uniqueOptions(eligibleRows, "geography_code", "geography_name", true).sort(function (a, b) {
      var orderA = countryOptionOrder(a);
      var orderB = countryOptionOrder(b);
      if (orderA !== orderB) return orderA - orderB;
      return a.label.localeCompare(b.label, "it");
    });
  }

  function defaultEuropeCountries(options) {
    var available = {};
    options.forEach(function (option) {
      available[String(option.value)] = true;
    });
    var preferred = ["IT", "EU27_2020", "DE", "FR", "ES", "NL"];
    var selected = preferred.filter(function (country) {
      return available[country];
    });
    if (selected.length) return selected;
    return options.slice(0, 6).map(function (option) {
      return option.value;
    });
  }

  function syncEuropeCountries(rows) {
    var container = byId("siEuropeFilters");
    if (!container) return [];
    var options = europeCountryOptions(rows);
    var available = {};
    options.forEach(function (option) {
      available[String(option.value)] = true;
    });
    state.europe.countries = toArray(state.europe.countries).filter(function (country) {
      return available[String(country)];
    });
    if (!state.europe.countries.length) {
      state.europe.countries = defaultEuropeCountries(options);
    }
    ensureMultiSelect(container, { key: "countries", label: "Paesi nel grafico" }, options, state.europe.countries, function (values) {
      state.europe.countries = values;
      renderEurope();
    });
    return state.europe.countries;
  }

  function renderEurope() {
    var rows = eurostatDistributionRows();
    var specs = [
      { key: "pay_period", field: "pay_period", label: "Unità retributiva", options: periodOptions, includeTotals: true },
      { key: "statistic", field: "statistic", label: "Statistica", options: statisticOptions, includeTotals: true },
      { key: "sex", field: "sex", label: "Sesso", labelField: "sex_label", includeTotals: true }
    ];
    syncFilters("siEuropeFilters", specs, rows, state.europe, renderEurope);
    var selected = rows.filter(function (row) {
      var sourceMatch = state.europe.pay_period === "hourly"
        ? row.source_request === "ses_by_working_time" && row.sector === "B-S_X_O" && row.working_time === "TOTAL"
        : row.source_request === (state.europe.pay_period === "monthly" ? "ses_monthly_distribution" : "ses_annual_distribution");
      return sourceMatch
        && row.pay_period === state.europe.pay_period
        && row.statistic === state.europe.statistic
        && row.sex === state.europe.sex;
    });
    var countries = syncEuropeCountries(selected);
    syncYearRange("siEuropeFilters", selected, state.europe, renderEurope);
    selected = applyYearRange(selected, state.europe);
    var traces = countries.map(function (country, index) {
      var byYear = {};
      selected.filter(function (row) { return row.geography_code === country; }).forEach(function (row) {
        byYear[String(row.year)] = row;
      });
      var countryRows = Object.keys(byYear).map(function (year) { return byYear[year]; }).sort(function (a, b) {
        return Number(a.year) - Number(b.year);
      });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: countryRows[0] ? optionLabel(countryRows[0], "geography_code", "geography_name") : country,
        x: countryRows.map(function (row) { return row.year; }),
        y: countryRows.map(function (row) { return row.value; }),
        line: { color: COLORS[index % COLORS.length], width: country === "IT" ? 4 : 2 },
        hovertemplate: "%{fullData.name}<br>%{x}: %{y:.2f} €<extra></extra>"
      };
    }).filter(function (trace) { return trace.x.length; });
    var tag = byId("siEuropeTag");
    if (tag) tag.textContent = countries.length + " paesi · " + text(state.europe.start_year) + "-" + text(state.europe.end_year);
    plot("siEuropeChart", traces, {
      yaxis: { title: "Euro" },
      xaxis: { title: "" }
    });
  }

  function renderOecd() {
    var rows = state.records.filter(function (row) {
      return row.source === "OECD"
        && row.pay_concept === "average_annual_wage_oecd"
        && row.statistic === "mean"
        && row.pay_period === "annual";
    });
    var countries = ["ITA", "OECD", "DEU", "FRA", "ESP", "NLD", "USA"];
    var traces = countries.map(function (country, index) {
      var countryRows = rows.filter(function (row) { return row.geography_code === country; }).sort(function (a, b) {
        return Number(a.year) - Number(b.year);
      });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: countryRows[0] ? optionLabel(countryRows[0], "geography_code", "geography_name") : country,
        x: countryRows.map(function (row) { return row.year; }),
        y: countryRows.map(function (row) { return row.value; }),
        line: { color: COLORS[index % COLORS.length], width: country === "ITA" ? 4 : 2, dash: country === "OECD" ? "dot" : "solid" },
        hovertemplate: "%{fullData.name}<br>%{x}: %{y:,.0f} $ PPP<extra></extra>"
      };
    }).filter(function (trace) { return trace.x.length; });
    plot("siOecdChart", traces, {
      yaxis: { title: "Dollari USA PPP 2025", rangemode: "tozero" },
      xaxis: { title: "" }
    });
  }

  function renderGenderGap() {
    var rows = state.records.filter(function (row) {
      return row.pay_concept === "gender_pay_gap_unadjusted";
    });
    var countries = ["IT", "EU27_2020", "DE", "FR", "ES", "NL"];
    var traces = countries.map(function (country, index) {
      var countryRows = rows.filter(function (row) { return row.geography_code === country; }).sort(function (a, b) {
        return Number(a.year) - Number(b.year);
      });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: countryRows[0] ? optionLabel(countryRows[0], "geography_code", "geography_name") : country,
        x: countryRows.map(function (row) { return row.year; }),
        y: countryRows.map(function (row) { return row.value; }),
        line: { color: COLORS[index % COLORS.length], width: country === "IT" ? 4 : 2 },
        hovertemplate: "%{fullData.name}<br>%{x}: %{y:.1f}%<extra></extra>"
      };
    }).filter(function (trace) { return trace.x.length; });
    var istat = {};
    grossRows().forEach(function (row) {
      if (row.source_request !== "istat_racli_sector_gender") return;
      if (row.geography_code !== "IT" || row.sector !== "0010" || row.pay_period !== "hourly" || row.statistic !== "mean") return;
      if (["M", "F"].indexOf(row.sex) < 0) return;
      istat[row.year] = istat[row.year] || {};
      istat[row.year][row.sex] = row.value;
    });
    var istatYears = Object.keys(istat).map(Number).filter(Number.isFinite).sort(function (a, b) { return a - b; });
    var istatGap = istatYears.map(function (year) {
      var item = istat[year];
      if (!item || !toNumber(item.M) || !toNumber(item.F)) return null;
      return { year: year, value: ((toNumber(item.M) - toNumber(item.F)) / toNumber(item.M)) * 100 };
    }).filter(Boolean);
    if (istatGap.length) {
      traces.unshift({
        type: "scatter",
        mode: "lines+markers",
        name: "Italia ISTAT privato, grezzo",
        x: istatGap.map(function (row) { return row.year; }),
        y: istatGap.map(function (row) { return row.value; }),
        line: { color: COLORS[0], width: 4, dash: "dot" },
        hovertemplate: "%{fullData.name}<br>%{x}: %{y:.1f}%<extra></extra>"
      });
    }
    plot("siGenderGapChart", traces, {
      yaxis: { title: "%", zeroline: true },
      xaxis: { title: "" }
    });
  }

  function seriesPriority(row) {
    if (row.source === "ISTAT") {
      if (String(row.source_request || "").indexOf("istat_racli_sector_") === 0) return 0;
      return 1;
    }
    return 2;
  }

  function dedupeSeriesRows(rows) {
    var selected = {};
    toArray(rows).forEach(function (row) {
      var key = [statName(row), row.year].join("|");
      var existing = selected[key];
      if (!existing || seriesPriority(row) < seriesPriority(existing)) selected[key] = row;
    });
    return Object.keys(selected).map(function (key) { return selected[key]; });
  }

  function uniqueYearRows(rows) {
    var selected = {};
    toArray(rows).forEach(function (row) {
      var key = String(row.year);
      var existing = selected[key];
      if (!existing || seriesPriority(row) < seriesPriority(existing)) selected[key] = row;
    });
    return Object.keys(selected).map(function (key) { return selected[key]; }).sort(function (a, b) {
      return Number(a.year) - Number(b.year);
    });
  }

  function seriesFilterSpec(key, field, label, labelField) {
    return {
      key: key,
      field: field,
      label: label,
      labelField: labelField,
      includeTotals: true,
      hideSingle: true,
      options: function (optionRows) {
        return seriesDimensionOptions(optionRows, field, labelField, true);
      }
    };
  }

  function coherentSeriesRows(rows) {
    var candidates = toArray(rows);
    var istatRows = candidates.filter(function (row) {
      return row.source === "ISTAT";
    });
    var eurostatRows = candidates.filter(function (row) {
      return row.source === "Eurostat";
    });
    if (state.series.geography_code === "IT" && state.series.pay_period === "hourly" && hasSeriesYears(istatRows, 2)) {
      return istatRows;
    }
    if (state.series.geography_code !== "IT" && hasSeriesYears(eurostatRows, 2)) {
      return eurostatRows;
    }
    if (hasSeriesYears(istatRows, 2)) return istatRows;
    if (hasSeriesYears(eurostatRows, 2)) return eurostatRows;
    return candidates;
  }

  function seriesSourceText(rows) {
    var sources = {};
    toArray(rows).forEach(function (row) {
      if (row.source) sources[row.source] = true;
    });
    var names = Object.keys(sources);
    if (names.length === 1 && names[0] === "ISTAT") return "ISTAT RACLI";
    if (names.length === 1 && names[0] === "Eurostat") return "Eurostat SES";
    if (names.length === 1) return names[0];
    return names.length ? "fonti non omogenee" : "";
  }

  function seriesMeasureText() {
    return state.series.statistic === "all" ? "tutte le misure" : STAT_LABELS[state.series.statistic] || state.series.statistic;
  }

  function renderSeries() {
    var rows = istatDistributionRows().concat(eurostatDistributionRows());
    var specs = [
      {
        key: "pay_period",
        field: "pay_period",
        label: "Unità retributiva",
        options: function (optionRows) {
          return seriesDimensionOptions(optionRows, "pay_period", null, true).map(function (option) {
            return { value: option.value, label: PERIOD_LABELS[option.value] || option.label };
          });
        },
        includeTotals: true
      },
      { key: "statistic", field: "statistic", label: "Statistica", options: seriesStatisticOptions, includeTotals: true },
      seriesFilterSpec("geography_code", "geography_code", "Territorio", "geography_name"),
      seriesFilterSpec("sex", "sex", "Sesso", "sex_label"),
      seriesFilterSpec("age_class", "age_class", "Età", "age_label"),
      seriesFilterSpec("education", "education", "Titolo di studio", "education_label"),
      seriesFilterSpec("sector", "sector", "Settore", "sector_label"),
      seriesFilterSpec("contract_type", "contract_type", "Contratto", "contract_type_label"),
      seriesFilterSpec("working_time", "working_time", "Orario", "working_time_label"),
      seriesFilterSpec("contractual_occupation", "contractual_occupation", "Qualifica", "contractual_occupation_label"),
      seriesFilterSpec("firm_size", "firm_size", "Dimensione", "firm_size_label"),
      seriesFilterSpec("country_birth", "country_birth", "Paese nascita", "country_birth_label"),
      seriesFilterSpec("paid_days", "paid_days", "Giornate retribuite", "paid_days_label")
    ];
    syncFilters("siSeriesFilters", specs, rows, state.series, renderSeries);
    var selected = filterRows(rows, {
      geography_code: state.series.geography_code,
      sex: state.series.sex,
      age_class: state.series.age_class,
      education: state.series.education,
      sector: state.series.sector,
      contract_type: state.series.contract_type,
      working_time: state.series.working_time,
      contractual_occupation: state.series.contractual_occupation,
      firm_size: state.series.firm_size,
      country_birth: state.series.country_birth,
      paid_days: state.series.paid_days,
      pay_period: state.series.pay_period
    }).filter(function (row) {
      return state.series.statistic === "all" || row.statistic === state.series.statistic;
    });
    selected = coherentSeriesRows(selected);
    syncYearRange("siSeriesFilters", selected, state.series, renderSeries);
    selected = applyYearRange(selected, state.series);
    selected = dedupeSeriesRows(selected).sort(function (a, b) { return Number(a.year) - Number(b.year); });
    if (!selected.length) {
      showEmpty("siSeriesChart", "Serie non disponibile per questa selezione.");
      return;
    }
    byId("siSeriesTitle").textContent = "Serie della " + payPeriodText(state.series.pay_period);
    byId("siSeriesTag").textContent = [seriesMeasureText(), seriesSourceText(selected), text(state.series.start_year) + "-" + text(state.series.end_year)].filter(Boolean).join(" · ");
    var seriesGroups = {};
    selected.forEach(function (row) {
      var key = statName(row);
      seriesGroups[key] = seriesGroups[key] || [];
      seriesGroups[key].push(row);
    });
    var traces = Object.keys(seriesGroups).sort().map(function (key, index) {
      var values = uniqueYearRows(seriesGroups[key]);
      return {
        type: "scatter",
        mode: "lines+markers",
        name: key,
        x: values.map(function (row) { return row.year; }),
        y: values.map(function (row) { return row.value; }),
        line: { color: COLORS[index % COLORS.length], width: key === "Mediana" ? 4 : 2 },
        hovertemplate: "%{fullData.name}<br>%{x}: %{y:.2f} €<extra></extra>"
      };
    });
    plot("siSeriesChart", traces, {
      yaxis: { title: "Euro" },
      xaxis: { title: "" }
    });
  }

  function renderMethod() {
    var notes = byId("siMethodNotes");
    var coverage = byId("siCoverageList");
    if (notes) {
      clear(notes);
      [
        "Retribuzione oraria, mensile e annuale sono periodi distinti e non vengono convertiti tra loro.",
        "La distribuzione piena non viene ricostruita da pochi percentili: quando la fonte pubblica solo D1, mediana, D9 e media, il grafico mostra solo quei punti.",
        "Le retribuzioni pubblicate sono lorde; il netto non viene stimato nel browser.",
        "Il costo del lavoro proviene da una tavola separata e non rappresenta il salario ricevuto dal lavoratore.",
        "Le giornate retribuite sono classi ufficiali RACLI: indicano continuita' o stagionalita' della posizione, ma non conteggi di lavoratori ricostruiti.",
        "Le tavole 2022 su istruzione, anzianità e dimensione impresa sono punti dell'edizione SES 2022.",
        "Territorio di residenza, luogo di lavoro e sede dell'impresa non sono intercambiabili.",
        "Il gender pay gap adjusted non viene stimato senza microdati o una tavola ufficiale gia' corretta."
      ].forEach(function (note) {
        var item = document.createElement("li");
        item.textContent = note;
        notes.appendChild(item);
      });
    }
    if (coverage) {
      clear(coverage);
      toArray(state.payload && state.payload.coverage).forEach(function (item) {
        var node = document.createElement("div");
        var title = document.createElement("strong");
        var note = document.createElement("span");
        var status = document.createElement("em");
        node.className = "si-coverage-item";
        title.textContent = item.dimension || "Dimensione";
        note.textContent = (item.source ? item.source + ". " : "") + text(item.note, "");
        status.textContent = text(item.status, "status");
        node.appendChild(title);
        node.appendChild(note);
        node.appendChild(status);
        coverage.appendChild(node);
      });
    }
  }

  function renderLazySection(sectionId, force) {
    if (!state.fullDataset) return;
    if (!force && renderedLazySections[sectionId]) return;
    renderedLazySections[sectionId] = true;
    if (sectionId === "lavoratore") renderWorker();
    if (sectionId === "lavoro") renderJob();
    if (sectionId === "territorio") renderTerritory();
    if (sectionId === "giornate") renderPaidDays();
    if (sectionId === "europa") renderEurope();
    if (sectionId === "ocse") renderOecd();
    if (sectionId === "gender-gap") renderGenderGap();
    if (sectionId === "serie") renderSeries();
  }

  function renderVisibleLazySections() {
    Object.keys(renderedLazySections).forEach(function (sectionId) {
      renderLazySection(sectionId, true);
    });
  }

  function setupLazySections() {
    var sectionIds = ["lavoratore", "lavoro", "territorio", "europa", "ocse", "gender-gap", "serie", "giornate"];
    if (!("IntersectionObserver" in window)) {
      sectionIds.forEach(function (sectionId) {
        renderLazySection(sectionId);
      });
      return;
    }
    if (lazyObserver) lazyObserver.disconnect();
    lazyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        renderLazySection(entry.target.id);
        lazyObserver.unobserve(entry.target);
      });
    }, { rootMargin: "650px 0px" });
    sectionIds.forEach(function (sectionId) {
      var section = byId(sectionId);
      if (!section || renderedLazySections[sectionId]) return;
      lazyObserver.observe(section);
    });
  }

  function renderAll() {
    renderKpis();
    renderDistribution();
    renderMethod();
    if (state.fullDataset) {
      renderVisibleLazySections();
      setupLazySections();
    }
  }

  function initializeDefaults() {
    var rows = istatDistributionRows();
    if (!state.distribution.year) {
      state.distribution.year = latestYear(rows, { geography_code: "IT", sex: "T", pay_period: "hourly" });
    }
    if (!state.worker.year) {
      state.worker.year = latestYear(grossRows(), { geography_code: "IT", sex: "T", pay_period: "hourly", statistic: "median" });
    }
    if (!state.job.year) {
      state.job.year = latestSectorBoxYear() || state.worker.year;
    }
  }

  function applyPayload(payload, fullDataset) {
    state.payload = payload;
    state.lookups = buildLookups(payload);
    state.records = recordsFromPayload(payload);
    state.grossRecords = state.records.filter(function (row) {
      return row.pay_concept === "gross_earnings";
    });
    state.distributionRecords = state.grossRecords.filter(function (row) {
      return ["mean", "median", "percentile"].indexOf(row.statistic) >= 0;
    });
    state.istatDistributionRecords = state.distributionRecords.filter(function (row) {
      return row.source === "ISTAT" && row.pay_period === "hourly";
    });
    state.eurostatDistributionRecords = state.distributionRecords.filter(function (row) {
      return row.source === "Eurostat";
    });
    state.fullDataset = fullDataset;
    initializeDefaults();
    setStatus("");
    renderAll();
  }

  function loadFullPayload(preserveInitial) {
    return fetch(fullDataUrl(), { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (payload) {
        applyPayload(payload, true);
        return payload;
      })
      .catch(function (error) {
        setStatus("Non riesco a caricare i dati salari: " + error.message, true);
        if (preserveInitial) return;
        ["siDistributionChart", "siWorkerChart", "siLowWageChart", "siSectorBoxChart", "siJobChart", "siLabourCostChart", "siTerritoryChart", "siPaidDaysChart", "siEuropeChart", "siOecdChart", "siGenderGapChart", "siSeriesChart"].forEach(function (id) {
          showEmpty(id, "Dati non disponibili.");
        });
      });
  }

  function load() {
    var initialUrl = initialDataUrl();
    var completeUrl = fullDataUrl();
    fetch(initialUrl, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (payload) {
        applyPayload(payload, initialUrl === completeUrl);
        if (initialUrl !== completeUrl) {
          window.setTimeout(function () {
            loadFullPayload(true);
          }, 900);
        }
      })
      .catch(function () {
        loadFullPayload(false);
      });
  }

  document.addEventListener("DOMContentLoaded", load);
  new MutationObserver(function () {
    if (state.records.length) renderAll();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
})();
