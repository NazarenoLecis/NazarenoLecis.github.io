(function () {
  "use strict";

  var DEFAULT_DATA_URL = "https://data.nazarenolecis.com/valore-aggiunto-imprese/dashboard.json?v=20260720-10";
  var COLORS = ["#ff6b2a", "#5b8fd9", "#5fc3b2", "#f0b44d", "#e66b6b", "#6fbd72", "#bd8ac7", "#9edb85"];
  var EU27 = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "FI", "FR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"];
  var SECTION_CODES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U"];
  var AGGREGATE_CODES = ["B-E", "G-I", "M_N", "O-Q", "R-U"];
  var SBS_SECTION_CODES = ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "P", "Q", "R"];
  var SBS_TOTAL_COMPONENT_CODES = SBS_SECTION_CODES.concat(["S95", "S96"]);
  var REGIONAL_SEPARATE_CODES = ["A", "B-E", "F", "G-I", "J", "K", "L", "M_N", "O-Q", "R-U"];
  var THEMATIC_AGGREGATES = [
    {
      code: "THEME_TOURISM_NARROW",
      label: "Turismo (proxy stretto)",
      components: ["I", "N79"],
      note: "Aggrega alloggio e ristorazione con agenzie di viaggio e tour operator. Non coincide con il conto satellite del turismo."
    },
    {
      code: "THEME_TOURISM_EXTENDED",
      label: "Turismo (proxy esteso)",
      components: ["I", "N79", "H50", "H51", "R90-R92", "R90", "R91", "R92", "R93"],
      note: "Aggiunge trasporto marittimo, trasporto aereo, cultura, intrattenimento e sport. Include anche attivita non turistiche."
    },
    {
      code: "THEME_ICT",
      label: "Digitale, media e telecomunicazioni",
      components: ["J58-J60", "J61", "J62_J63"],
      note: "Aggrega le sottovoci disponibili dell'informazione e comunicazione."
    },
    {
      code: "THEME_PUBLIC_SOCIAL",
      label: "Pubblico, istruzione, sanita e sociale",
      components: ["O", "P", "Q"],
      note: "Ricostruisce l'aggregato O-Q mantenendo esplicite le componenti usate."
    },
    {
      code: "THEME_UTILITIES",
      label: "Energia, acqua, rifiuti e reti",
      components: ["D", "E"],
      note: "Aggrega utility energetiche e ambientali."
    },
    {
      code: "THEME_LOCAL_SERVICES",
      label: "Altro: cultura, sport e servizi personali",
      components: ["R", "S"],
      note: "Aggrega attivita ricreative, culturali, sportive e altri servizi alla persona."
    },
    {
      code: "THEME_CULTURE_SPORT",
      label: "Cultura, sport e ricreazione",
      components: ["R"],
      note: "Voce ufficiale NACE R, isolata per distinguere cultura, spettacolo, sport e ricreazione."
    },
    {
      code: "THEME_OTHER_SERVICES",
      label: "Altri servizi personali",
      components: ["S"],
      note: "Voce ufficiale NACE S, utile per non perdere il blocco degli altri servizi nel confronto."
    }
  ];
  var SIZE_ORDER = ["0-9", "10-19", "20-49", "50-249", "250+"];
  var MICRO_SIZE_ORDER = ["0 dip.", "1-4 dip.", "5-9 dip."];
  var SBS_TOTAL_CODE = "SBS_TOTAL";
  var DEFAULT_SERIES_SECTORS = ["TOTAL", "C", "G", "H", "I", "J"];
  var DEFAULT_TREND_COUNTRIES = ["IT", "DE", "FR", "ES", "PL"];
  var CHART_SOURCE_NOTE = "Fonte: Eurostat. Elaborazione di Nazareno Lecis.";
  var COUNTRY_LABELS_IT = {
    AT: "Austria",
    BE: "Belgio",
    BG: "Bulgaria",
    CY: "Cipro",
    CZ: "Cechia",
    DE: "Germania",
    DK: "Danimarca",
    EE: "Estonia",
    EL: "Grecia",
    ES: "Spagna",
    EU27_2020: "Unione europea (27 paesi)",
    FI: "Finlandia",
    FR: "Francia",
    HR: "Croazia",
    HU: "Ungheria",
    IE: "Irlanda",
    IT: "Italia",
    LT: "Lituania",
    LU: "Lussemburgo",
    LV: "Lettonia",
    MT: "Malta",
    NL: "Paesi Bassi",
    PL: "Polonia",
    PT: "Portogallo",
    RO: "Romania",
    SE: "Svezia",
    SI: "Slovenia",
    SK: "Slovacchia"
  };
  var COUNTRY_LABELS_EN = {
    AT: "Austria",
    BE: "Belgium",
    BG: "Bulgaria",
    CY: "Cyprus",
    CZ: "Czechia",
    DE: "Germany",
    DK: "Denmark",
    EE: "Estonia",
    EL: "Greece",
    ES: "Spain",
    EU27_2020: "European Union (27 countries)",
    FI: "Finland",
    FR: "France",
    HR: "Croatia",
    HU: "Hungary",
    IE: "Ireland",
    IT: "Italy",
    LT: "Lithuania",
    LU: "Luxembourg",
    LV: "Latvia",
    MT: "Malta",
    NL: "Netherlands",
    PL: "Poland",
    PT: "Portugal",
    RO: "Romania",
    SE: "Sweden",
    SI: "Slovenia",
    SK: "Slovakia"
  };
  var SECTOR_LABELS_IT = {
    TOTAL: "Totale economia",
    SBS_TOTAL: "Totale settori imprese SBS",
    A: "Agricoltura, silvicoltura e pesca",
    A01: "Agricoltura e attivita connesse",
    A02: "Silvicoltura",
    A03: "Pesca e acquacoltura",
    B: "Estrazione di minerali",
    B05: "Estrazione di carbone",
    B06: "Estrazione di petrolio e gas naturale",
    B07: "Estrazione di minerali metalliferi",
    B08: "Altre attivita estrattive",
    B09: "Servizi di supporto all'estrazione",
    "B-E": "Industria esclusa costruzioni",
    C: "Manifattura",
    C10: "Industrie alimentari",
    "C10-C12": "Alimentari, bevande e tabacco",
    C11: "Bevande",
    C12: "Tabacco",
    C13: "Tessile",
    "C13-C15": "Tessile, abbigliamento, pelle e calzature",
    C13_C14: "Tessile e abbigliamento",
    C14: "Abbigliamento",
    C15: "Pelle, calzature e articoli in pelle",
    C16: "Legno e prodotti in legno",
    "C16-C18": "Legno, carta e stampa",
    C17: "Carta e prodotti di carta",
    C17_C18: "Carta e stampa",
    C18: "Stampa e riproduzione",
    C19: "Coke e prodotti petroliferi raffinati",
    C20: "Chimica",
    C20_C21: "Chimica e farmaceutica",
    C21: "Farmaceutica",
    C22: "Gomma e plastica",
    C22_C23: "Gomma, plastica e minerali non metalliferi",
    C23: "Altri prodotti minerali non metalliferi",
    C24: "Metallurgia",
    C24_C25: "Metallurgia e prodotti in metallo",
    C25: "Prodotti in metallo",
    C26: "Computer, elettronica e ottica",
    C27: "Apparecchiature elettriche",
    C28: "Macchinari e apparecchiature",
    C29: "Autoveicoli, rimorchi e semirimorchi",
    C29_C30: "Mezzi di trasporto",
    C30: "Altri mezzi di trasporto",
    C31: "Mobili",
    "C31-C33": "Mobili, altre manifatture e riparazioni",
    C31_C32: "Mobili e altre manifatture",
    C32: "Altre manifatture",
    C33: "Riparazione, manutenzione e installazione di macchine",
    D: "Energia elettrica, gas, vapore e aria condizionata",
    D35: "Energia elettrica, gas, vapore e aria condizionata",
    E: "Acqua, reti fognarie, rifiuti e risanamento",
    E36: "Raccolta, trattamento e fornitura di acqua",
    E37: "Reti fognarie",
    E38: "Raccolta, trattamento e smaltimento dei rifiuti",
    "E37-E39": "Reti fognarie, rifiuti e risanamento",
    E39: "Risanamento e altri servizi di gestione dei rifiuti",
    F: "Costruzioni",
    F41: "Costruzione di edifici",
    F42: "Ingegneria civile",
    F43: "Lavori di costruzione specializzati",
    G: "Commercio all'ingrosso e al dettaglio",
    G45: "Commercio e riparazione di autoveicoli",
    G46: "Commercio all'ingrosso",
    G47: "Commercio al dettaglio",
    "G-I": "Commercio, trasporti, alloggio e ristorazione",
    "G-J": "Commercio, trasporti, alloggio, ristorazione, informazione e comunicazione",
    H: "Trasporto e magazzinaggio",
    H49: "Trasporto terrestre e mediante condotte",
    H50: "Trasporto marittimo e per vie d'acqua",
    H51: "Trasporto aereo",
    H52: "Magazzinaggio e attivita di supporto ai trasporti",
    H53: "Servizi postali e corriere",
    I: "Alloggio e ristorazione",
    I55: "Alloggio",
    I56: "Ristorazione",
    J: "Informazione e comunicazione",
    J58: "Editoria",
    "J58-J60": "Editoria, audiovisivo e trasmissioni",
    J59: "Cinema, video e musica",
    J59_J60: "Audiovisivo e attivita di programmazione",
    J60: "Programmazione e trasmissione",
    J61: "Telecomunicazioni",
    J62: "Software e consulenza informatica",
    J62_J63: "Software, consulenza informatica e servizi informativi",
    J63: "Servizi informativi",
    K: "Attivita finanziarie e assicurative",
    "K-N": "Servizi finanziari, immobiliari, professionali e amministrativi",
    K64: "Servizi finanziari",
    K65: "Assicurazioni e fondi pensione",
    K66: "Attivita ausiliarie dei servizi finanziari e assicurativi",
    L: "Attivita immobiliari",
    L68: "Attivita immobiliari",
    L68A: "Affitti imputati delle abitazioni occupate dai proprietari",
    M: "Attivita professionali, scientifiche e tecniche",
    M69: "Attivita legali e contabilita",
    "M69-M71": "Legale, contabilita, consulenza e architettura",
    M69_M70: "Legale, contabilita e consulenza gestionale",
    M70: "Direzione aziendale e consulenza gestionale",
    M71: "Architettura e ingegneria",
    M72: "Ricerca e sviluppo",
    M73: "Pubblicita e ricerche di mercato",
    "M73-M75": "Pubblicita, ricerche di mercato e altre attivita professionali",
    M74: "Altre attivita professionali, scientifiche e tecniche",
    M74_M75: "Altre attivita professionali e veterinarie",
    M75: "Servizi veterinari",
    M_N: "Servizi professionali, scientifici, tecnici e amministrativi",
    N: "Servizi amministrativi e di supporto",
    N77: "Noleggio e leasing",
    N78: "Ricerca, selezione e fornitura di personale",
    N79: "Agenzie di viaggio e tour operator",
    N80: "Sicurezza e investigazione",
    N81: "Servizi per edifici e paesaggio",
    "N80-N82": "Sicurezza, servizi agli edifici e supporto alle imprese",
    N82: "Supporto amministrativo e servizi alle imprese",
    O: "Pubblica amministrazione e difesa",
    O84: "Pubblica amministrazione e difesa; assicurazione sociale obbligatoria",
    "O-Q": "Pubblica amministrazione, istruzione, sanita e sociale",
    P: "Istruzione",
    P85: "Istruzione",
    Q: "Sanita e assistenza sociale",
    Q86: "Sanita",
    Q87: "Assistenza residenziale",
    Q87_Q88: "Assistenza residenziale e sociale",
    Q88: "Assistenza sociale non residenziale",
    R: "Arte, sport e intrattenimento",
    R90: "Attivita creative, artistiche e di intrattenimento",
    R91: "Biblioteche, archivi, musei e attivita culturali",
    R92: "Gioco e scommesse",
    "R90-R92": "Attivita creative, artistiche, intrattenimento e gioco",
    R93: "Attivita sportive e ricreative",
    "R-U": "Arte, intrattenimento e altri servizi",
    S: "Altri servizi",
    S94: "Organizzazioni associative",
    S95: "Riparazione di computer e beni personali",
    S96: "Altri servizi alla persona",
    T: "Attivita di famiglie e convivenze",
    U: "Organizzazioni extraterritoriali",
    U99: "Organizzazioni e organismi extraterritoriali"
  };
  var SECTOR_LABELS_EN = {
    TOTAL: "Total economy",
    SBS_TOTAL: "Total SBS business sectors",
    A: "Agriculture, forestry and fishing",
    A01: "Crop and animal production",
    A02: "Forestry",
    A03: "Fishing and aquaculture",
    B: "Mining and quarrying",
    B05: "Mining of coal",
    B06: "Extraction of crude petroleum and natural gas",
    B07: "Mining of metal ores",
    B08: "Other mining and quarrying",
    B09: "Mining support services",
    "B-E": "Industry excluding construction",
    C: "Manufacturing",
    C10: "Food industries",
    "C10-C12": "Food, beverages and tobacco",
    C11: "Beverages",
    C12: "Tobacco",
    C13: "Textiles",
    "C13-C15": "Textiles, wearing apparel, leather and footwear",
    C13_C14: "Textiles and wearing apparel",
    C14: "Wearing apparel",
    C15: "Leather, footwear and leather products",
    C16: "Wood and products of wood",
    "C16-C18": "Wood, paper and printing",
    C17: "Paper and paper products",
    C17_C18: "Paper and printing",
    C18: "Printing and reproduction",
    C19: "Coke and refined petroleum products",
    C20: "Chemicals",
    C20_C21: "Chemicals and pharmaceuticals",
    C21: "Pharmaceuticals",
    C22: "Rubber and plastics",
    C22_C23: "Rubber, plastics and non-metallic minerals",
    C23: "Other non-metallic mineral products",
    C24: "Basic metals",
    C24_C25: "Basic metals and fabricated metal products",
    C25: "Fabricated metal products",
    C26: "Computer, electronic and optical products",
    C27: "Electrical equipment",
    C28: "Machinery and equipment",
    C29: "Motor vehicles, trailers and semi-trailers",
    C29_C30: "Transport equipment",
    C30: "Other transport equipment",
    C31: "Furniture",
    "C31-C33": "Furniture, other manufacturing and repair",
    C31_C32: "Furniture and other manufacturing",
    C32: "Other manufacturing",
    C33: "Repair, maintenance and installation of machinery",
    D: "Electricity, gas, steam and air conditioning",
    D35: "Electricity, gas, steam and air conditioning",
    E: "Water supply, sewerage, waste and remediation",
    E36: "Water collection, treatment and supply",
    E37: "Sewerage",
    E38: "Waste collection, treatment and disposal",
    "E37-E39": "Sewerage, waste and remediation",
    E39: "Remediation and other waste management services",
    F: "Construction",
    F41: "Construction of buildings",
    F42: "Civil engineering",
    F43: "Specialised construction activities",
    G: "Wholesale and retail trade",
    G45: "Trade and repair of motor vehicles",
    G46: "Wholesale trade",
    G47: "Retail trade",
    "G-I": "Trade, transport, accommodation and food services",
    "G-J": "Trade, transport, accommodation, food services, information and communication",
    H: "Transportation and storage",
    H49: "Land transport and transport via pipelines",
    H50: "Water transport",
    H51: "Air transport",
    H52: "Warehousing and support activities for transportation",
    H53: "Postal and courier activities",
    I: "Accommodation and food services",
    I55: "Accommodation",
    I56: "Food and beverage services",
    J: "Information and communication",
    J58: "Publishing",
    "J58-J60": "Publishing, audiovisual and broadcasting",
    J59: "Motion picture, video and music",
    J59_J60: "Audiovisual and programming activities",
    J60: "Programming and broadcasting",
    J61: "Telecommunications",
    J62: "Software and IT consulting",
    J62_J63: "Software, IT consulting and information services",
    J63: "Information services",
    K: "Financial and insurance activities",
    "K-N": "Financial, real-estate, professional and administrative services",
    K64: "Financial services",
    K65: "Insurance and pension funding",
    K66: "Activities auxiliary to financial and insurance services",
    L: "Real estate activities",
    L68: "Real estate activities",
    L68A: "Imputed rents of owner-occupied dwellings",
    M: "Professional, scientific and technical activities",
    M69: "Legal and accounting activities",
    "M69-M71": "Legal, accounting, consulting and architecture",
    M69_M70: "Legal, accounting and management consulting",
    M70: "Head offices and management consulting",
    M71: "Architecture and engineering",
    M72: "Research and development",
    M73: "Advertising and market research",
    "M73-M75": "Advertising, market research and other professional activities",
    M74: "Other professional, scientific and technical activities",
    M74_M75: "Other professional and veterinary activities",
    M75: "Veterinary activities",
    M_N: "Professional, scientific, technical and administrative services",
    N: "Administrative and support services",
    N77: "Rental and leasing",
    N78: "Employment activities",
    N79: "Travel agencies and tour operators",
    N80: "Security and investigation",
    N81: "Services to buildings and landscape",
    "N80-N82": "Security, building services and business support",
    N82: "Office administrative and business support",
    O: "Public administration and defence",
    O84: "Public administration and defence; compulsory social security",
    "O-Q": "Public administration, education, health and social work",
    P: "Education",
    P85: "Education",
    Q: "Human health and social work",
    Q86: "Human health",
    Q87: "Residential care",
    Q87_Q88: "Residential and social care",
    Q88: "Social work without accommodation",
    R: "Arts, sports and entertainment",
    R90: "Creative, arts and entertainment activities",
    R91: "Libraries, archives, museums and cultural activities",
    R92: "Gambling and betting",
    "R90-R92": "Creative, arts, entertainment and gambling",
    R93: "Sports and recreation activities",
    "R-U": "Arts, entertainment and other services",
    S: "Other services",
    S94: "Membership organisations",
    S95: "Repair of computers and personal goods",
    S96: "Other personal services",
    T: "Activities of households",
    U: "Extraterritorial organisations",
    U99: "Extraterritorial organisations and bodies"
  };
  var THEME_LABELS_EN = {
    THEME_TOURISM_NARROW: "Tourism (narrow proxy)",
    THEME_TOURISM_EXTENDED: "Tourism (extended proxy)",
    THEME_ICT: "Digital, media and telecommunications",
    THEME_PUBLIC_SOCIAL: "Public sector, education, health and social work",
    THEME_UTILITIES: "Energy, water, waste and networks",
    THEME_LOCAL_SERVICES: "Other: culture, sport and personal services",
    THEME_CULTURE_SPORT: "Culture, sport and recreation",
    THEME_OTHER_SERVICES: "Other personal services"
  };

  var state = {
    payload: null,
    recordCache: {},
    country: "IT",
    year: null,
    sectorMode: "detail",
    sectorMeasure: "na_value",
    sectorCountry: "IT",
    sectorYear: null,
    rankMode: "top",
    rankCount: "all",
    seriesView: "countries",
    seriesCountry: "IT",
    seriesSectors: DEFAULT_SERIES_SECTORS.slice(),
    seriesStartYear: null,
    seriesEndYear: null,
    seriesMetric: "value",
    seriesYAxis: "zero",
    countryTrendSector: "TOTAL",
    countryTrendCountries: DEFAULT_TREND_COUNTRIES.slice(),
    europeSector: "TOTAL",
    europeYear: null,
    europeMeasure: "value",
    sizeCountry: "IT",
    sizeYear: null,
    sizeSector: "C",
    sizeMeasure: "enterprises",
    microCountry: "IT",
    microYear: null,
    microSector: "C",
    microMeasure: "active_enterprises_share",
    sizeTrendCountry: "IT",
    sizeTrendSector: "C",
    sizeTrendMeasure: "value_added",
    regionalCountry: "IT",
    regionalYear: null,
    regionalSector: "TOTAL",
    regionalView: "regions",
    regionalRegion: null,
    regionalSectorMode: "separate"
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function text(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback || "";
    return String(value);
  }

  function number(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function dataUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get("data") || DEFAULT_DATA_URL;
  }

  function records(key) {
    var raw = toArray(state.payload && state.payload.records && state.payload.records[key]);
    var schema = toArray(state.payload && state.payload.record_schema && state.payload.record_schema[key]);
    if (!raw.length || !Array.isArray(raw[0]) || !schema.length) return raw;
    if (!state.recordCache[key]) {
      state.recordCache[key] = raw.map(function (record) {
        var row = {};
        schema.forEach(function (field, index) {
          row[field] = record[index];
        });
        return row;
      });
    }
    return state.recordCache[key];
  }

  function lookup(key) {
    return toArray(state.payload && state.payload.lookups && state.payload.lookups[key]);
  }

  function optionLabel(row) {
    return row.label || row.name || row.code || "";
  }

  function currentLanguage() {
    return window.SiteLanguage && window.SiteLanguage.get ? window.SiteLanguage.get() : document.documentElement.lang || "it";
  }

  function isEnglish() {
    return currentLanguage() === "en";
  }

  function translateLabel(value) {
    return window.SiteLanguage && window.SiteLanguage.t ? window.SiteLanguage.t(value) : value;
  }

  function countryLabel(code, fallback) {
    var labels = isEnglish() ? COUNTRY_LABELS_EN : COUNTRY_LABELS_IT;
    return labels[code] || translateLabel(fallback || code || "");
  }

  function sectorLabel(rowOrCode, fallback) {
    var code = typeof rowOrCode === "string" ? rowOrCode : rowOrCode && rowOrCode.sector_code;
    var sourceLabel = typeof rowOrCode === "string" ? fallback : rowOrCode && rowOrCode.sector_label;
    var theme = THEMATIC_AGGREGATES.find(function (item) { return item.code === code; });
    var labels = isEnglish() ? SECTOR_LABELS_EN : SECTOR_LABELS_IT;
    var themeLabel = isEnglish() ? THEME_LABELS_EN[code] : theme && theme.label;
    return labels[code] || themeLabel || translateLabel(sourceLabel || fallback || code || "");
  }

  function formatMoney(value) {
    var parsed = number(value);
    if (parsed === null) return "ND";
    var locale = isEnglish() ? "en-US" : "it-IT";
    if (Math.abs(parsed) >= 1000) return (parsed / 1000).toLocaleString(locale, { maximumFractionDigits: 1, useGrouping: true }) + (isEnglish() ? " bn EUR" : " mld EUR");
    return parsed.toLocaleString(locale, { maximumFractionDigits: 1, useGrouping: true }) + (isEnglish() ? " mn EUR" : " mln EUR");
  }

  function formatShare(value) {
    var parsed = number(value);
    if (parsed === null) return "ND";
    var digits = Math.abs(parsed) > 0 && Math.abs(parsed) < 0.1 ? 2 : 1;
    return parsed.toLocaleString(isEnglish() ? "en-US" : "it-IT", { maximumFractionDigits: digits, useGrouping: true }) + "%";
  }

  function median(values) {
    var sorted = values.map(number).filter(function (value) { return value !== null; })
      .sort(function (a, b) { return a - b; });
    if (!sorted.length) return null;
    var middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function colorVars() {
    var style = getComputedStyle(document.documentElement);
    return {
      text: style.getPropertyValue("--text").trim() || "#f5f2ed",
      muted: style.getPropertyValue("--muted").trim() || "#b9b2aa",
      line: style.getPropertyValue("--line").trim() || "#303030",
      panel: style.getPropertyValue("--panel").trim() || "#090909"
    };
  }

  function plot(id, traces, layout) {
    var node = byId(id);
    var colors = colorVars();
    var customLayout = Object.assign({}, layout || {});
    var sourceNote = customLayout.sourceNote;
    delete customLayout.sourceNote;
    var annotations = toArray(customLayout.annotations).slice();
    delete customLayout.annotations;
    if (sourceNote) {
      var chartBlock = node && node.closest ? node.closest(".vai-chart-block") : null;
      var hasExternalCredit = chartBlock && chartBlock.querySelector(".vai-chart-credit");
      if (hasExternalCredit) sourceNote = "";
    }
    if (sourceNote) {
      annotations.push({
        text: sourceNote,
        xref: "paper",
        yref: "paper",
        x: 0,
        y: -0.22,
        xanchor: "left",
        yanchor: "top",
        showarrow: false,
        align: "left",
        font: { color: colors.muted, size: 11 }
      });
    }
    if (!node || !window.Plotly) return;
    window.Plotly.react(node, traces, Object.assign({
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: colors.text, family: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" },
      margin: { t: 18, r: 20, b: 64, l: 120 },
      xaxis: { gridcolor: colors.line, zerolinecolor: colors.line },
      yaxis: { gridcolor: colors.line, zerolinecolor: colors.line },
      hoverlabel: { bgcolor: colors.panel, bordercolor: colors.line, font: { color: colors.text } },
      legend: { orientation: "h", y: -0.18 },
      annotations: annotations
    }, customLayout), { responsive: true, displayModeBar: false });
  }

  function showEmpty(id, message) {
    var node = byId(id);
    if (!node) return;
    node.innerHTML = "";
    var empty = document.createElement("div");
    empty.className = "vai-empty";
    empty.textContent = message;
    node.appendChild(empty);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function renderGuidance(id, items) {
    var container = byId(id);
    if (!container) return;
    clear(container);
    items.forEach(function (item) {
      var node = document.createElement("div");
      var title = document.createElement("strong");
      var body = document.createElement("span");
      node.className = "vai-guidance";
      title.textContent = translateLabel(item.title);
      body.textContent = translateLabel(item.text);
      node.appendChild(title);
      node.appendChild(body);
      container.appendChild(node);
    });
  }

  function makeSelect(container, label, value, options, onChange) {
    var wrapper = document.createElement("label");
    var span = document.createElement("span");
    var select = document.createElement("select");
    span.textContent = translateLabel(label);
    options.forEach(function (option) {
      var item = document.createElement("option");
      item.value = option.value;
      item.textContent = translateLabel(option.label);
      if (String(option.value) === String(value)) item.selected = true;
      select.appendChild(item);
    });
    select.addEventListener("change", function () {
      onChange(select.value);
    });
    wrapper.appendChild(span);
    wrapper.appendChild(select);
    container.appendChild(wrapper);
  }

  function makeMultiSelect(container, label, values, options, onChange) {
    var wrapper = document.createElement("label");
    var span = document.createElement("span");
    var select = document.createElement("select");
    var selected = {};
    toArray(values).forEach(function (value) {
      selected[String(value)] = true;
    });
    span.textContent = translateLabel(label);
    wrapper.className = "vai-multi-filter";
    select.multiple = true;
    select.size = Math.min(Math.max(options.length, 4), 8);
    options.forEach(function (option) {
      var item = document.createElement("option");
      item.value = option.value;
      item.textContent = translateLabel(option.label);
      item.selected = Boolean(selected[String(option.value)]);
      select.appendChild(item);
    });
    select.addEventListener("change", function () {
      var next = Array.prototype.slice.call(select.selectedOptions).map(function (option) {
        return option.value;
      });
      onChange(next);
    });
    wrapper.appendChild(span);
    wrapper.appendChild(select);
    container.appendChild(wrapper);
  }

  function yearOptions(recordsList) {
    return Array.from(new Set(recordsList.map(function (row) { return row.year; })))
      .filter(Boolean)
      .sort(function (a, b) { return Number(b) - Number(a); })
      .map(function (year) { return { value: String(year), label: String(year) }; });
  }

  function yearValues(recordsList) {
    return Array.from(new Set(recordsList.map(function (row) { return Number(row.year); })))
      .filter(function (year) { return Number.isFinite(year); })
      .sort(function (a, b) { return a - b; });
  }

  function syncYearRange(recordsList, startKey, endKey) {
    var years = yearValues(recordsList);
    if (!years.length) return [];
    if (years.indexOf(Number(state[startKey])) < 0) state[startKey] = years[0];
    if (years.indexOf(Number(state[endKey])) < 0) state[endKey] = years[years.length - 1];
    if (Number(state[startKey]) > Number(state[endKey])) {
      state[startKey] = years[0];
      state[endKey] = years[years.length - 1];
    }
    return years.map(function (year) {
      return { value: String(year), label: String(year) };
    });
  }

  function filterYearRange(recordsList, startKey, endKey) {
    return recordsList.filter(function (row) {
      var year = Number(row.year);
      if (!Number.isFinite(year)) return false;
      if (state[startKey] && year < Number(state[startKey])) return false;
      if (state[endKey] && year > Number(state[endKey])) return false;
      return true;
    });
  }

  function countryOptions(includeEu27) {
    return lookup("countries")
      .filter(function (row) { return includeEu27 || row.code !== "EU27_2020"; })
      .map(function (row) { return { value: row.code, label: countryLabel(row.code, optionLabel(row)) }; });
  }

  function sectorOptions(sourceKey, includeTotal) {
    return lookup(sourceKey)
      .filter(function (row) { return includeTotal || row.code !== "TOTAL"; })
      .map(function (row) { return { value: row.code, label: row.code + " - " + sectorLabel(row.code, optionLabel(row)) }; });
  }

  function codeListOptions(codes) {
    var available = {};
    lookup("sbs_sectors").forEach(function (row) {
      available[row.code] = optionLabel(row);
    });
    return codes.filter(function (code) { return available[code]; })
      .map(function (code) { return { value: code, label: code + " - " + sectorLabel(code, available[code]) }; });
  }

  function isNaceDivision(code) {
    return /^[A-Z][0-9]{2}$/.test(code || "");
  }

  function themeSectorOptions() {
    return THEMATIC_AGGREGATES.map(function (theme) {
      return { value: theme.code, label: (isEnglish() ? "Theme" : "Tema") + " - " + sectorLabel(theme.code, theme.label) };
    });
  }

  function nationalSectorOptionsWithThemes(includeTotal) {
    return sectorOptions("sectors", includeTotal).concat(themeSectorOptions());
  }

  function sbsSectorOptionsWithTotal() {
    return [{ value: SBS_TOTAL_CODE, label: sectorLabel(SBS_TOTAL_CODE) }]
      .concat(sectorOptions("sbs_sectors", false));
  }

  function effectiveYear(recordsList, preferredYear) {
    var preferred = Number(preferredYear);
    var years = yearOptions(recordsList).map(function (row) { return Number(row.value); });
    if (years.indexOf(preferred) >= 0) return preferred;
    return years.length ? years[0] : preferred;
  }

  function rowsForCountryYear(country, year) {
    var rows = records("sector_value_added").filter(function (row) {
      return row.country_code === country && Number(row.year) === Number(year);
    });
    if (rows.length) return rows;
    var fallbackYear = effectiveYear(records("sector_value_added").filter(function (row) {
      return row.country_code === country;
    }), year);
    state.year = fallbackYear;
    return records("sector_value_added").filter(function (row) {
      return row.country_code === country && Number(row.year) === Number(fallbackYear);
    });
  }

  function sectorRow(rows, code) {
    return rows.find(function (row) { return row.sector_code === code; });
  }

  function totalValue(rows) {
    var total = sectorRow(rows, "TOTAL");
    return total ? number(total.value_million_eur) : null;
  }

  function mainSectionRows(rows) {
    return SECTION_CODES.map(function (code) { return sectorRow(rows, code); }).filter(Boolean);
  }

  function detailRows(rows) {
    return rows.filter(function (row) {
      return row.sector_code !== "TOTAL"
        && SECTION_CODES.indexOf(row.sector_code) < 0
        && AGGREGATE_CODES.indexOf(row.sector_code) < 0;
    });
  }

  function thematicRows(rows) {
    return THEMATIC_AGGREGATES.map(function (theme) {
      var components = theme.components.map(function (code) { return sectorRow(rows, code); })
        .filter(function (row) { return row && number(row.value_million_eur) !== null; });
      if (!components.length) return null;
      return {
        country_code: components[0].country_code,
        country_name: components[0].country_name,
        year: components[0].year,
        sector_code: theme.code,
        sector_label: sectorLabel(theme.code, theme.label),
        value_million_eur: components.reduce(function (sum, row) { return sum + number(row.value_million_eur); }, 0),
        theme_note: translateLabel(theme.note),
        theme_component_codes: components.map(function (row) { return row.sector_code; }),
        theme_components: components.map(function (row) { return sectorLabel(row); }).join("; ")
      };
    }).filter(Boolean);
  }

  function nationalRowsWithThemes() {
    if (!state.recordCache.sector_value_added_with_themes) {
      var baseRows = records("sector_value_added");
      var groups = {};
      baseRows.forEach(function (row) {
        var key = row.country_code + "-" + Number(row.year);
        if (!groups[key]) groups[key] = [];
        groups[key].push(row);
      });
      var themedRows = [];
      Object.keys(groups).forEach(function (key) {
        themedRows = themedRows.concat(thematicRows(groups[key]));
      });
      state.recordCache.sector_value_added_with_themes = baseRows.concat(themedRows);
    }
    return state.recordCache.sector_value_added_with_themes;
  }

  function totalByYear(country) {
    var totals = {};
    records("sector_value_added").forEach(function (row) {
      if (row.country_code === country && row.sector_code === "TOTAL") {
        totals[Number(row.year)] = number(row.value_million_eur);
      }
    });
    return totals;
  }

  function groupValueFromNumber(value, metric, baseValue, totalValueForYear) {
    if (value === null) return null;
    if (metric === "share") {
      return totalValueForYear ? value / totalValueForYear * 100 : null;
    }
    if (metric === "gdp_share") {
      return totalValueForYear ? value / totalValueForYear * 100 : null;
    }
    if (metric === "base100") {
      return baseValue ? value / baseValue * 100 : null;
    }
    return value;
  }

  function groupValue(row, metric, baseValue, totalValueForYear) {
    return groupValueFromNumber(number(row && row.value_million_eur), metric, baseValue, totalValueForYear);
  }

  function seriesAxisTitle(metric, unit) {
    if (metric === "share") return unit === "enterprises" ? "Quota sulle imprese (%)" : "Quota sul totale (%)";
    if (metric === "gdp_share") return "% PIL";
    if (metric === "base100") return "Indice base 100";
    if (unit === "enterprises") return "Numero di imprese";
    if (unit === "value_per_employed") return "Migliaia di euro per occupato";
    return "Milioni di euro";
  }

  function seriesHoverTemplate(metric, baseYear, unit) {
    if (metric === "share") {
      return unit === "enterprises"
        ? "%{x}<br>%{fullData.name}: %{y:.1f}% delle imprese<extra></extra>"
        : "%{x}<br>%{fullData.name}: %{y:.1f}% del totale<extra></extra>";
    }
    if (metric === "gdp_share") return "%{x}<br>%{fullData.name}: %{y:.2f}% del PIL<extra></extra>";
    if (metric === "base100") return "%{x}<br>%{fullData.name}: %{y:.1f} (base " + baseYear + "=100)<extra></extra>";
    if (unit === "enterprises") return "%{x}<br>%{fullData.name}: %{y:,.0f} imprese<extra></extra>";
    if (unit === "value_per_employed") return "%{x}<br>%{fullData.name}: %{y:,.1f} mila EUR per occupato<extra></extra>";
    return "%{x}<br>%{fullData.name}: %{y:,.1f} mln EUR<extra></extra>";
  }

  function renderGlobalFilters() {
    var container = byId("vaiGlobalFilters");
    if (!container) return;
    clear(container);
    makeSelect(container, "Paese", state.country, countryOptions(true), function (value) {
      state.country = value;
      state.sectorCountry = value;
      state.seriesCountry = value;
      state.sizeCountry = value === "EU27_2020" ? "IT" : value;
      state.sizeTrendCountry = value === "EU27_2020" ? "IT" : value;
      state.microCountry = value === "EU27_2020" ? "IT" : value;
      state.regionalCountry = value === "EU27_2020" ? "IT" : value;
      renderAll();
    });
    makeSelect(container, "Anno", state.year, yearOptions(records("sector_value_added")), function (value) {
      state.year = Number(value);
      state.sectorYear = Number(value);
      renderAll();
    });
  }

  function renderKpis() {
    var container = byId("vaiKpis");
    var rows = rowsForCountryYear(state.country, state.year);
    var total = totalValue(rows);
    var gdp = gdpValue(state.country, state.year);
    var sections = mainSectionRows(rows).filter(function (row) { return number(row.value_million_eur) !== null; });
    var top = sections.slice().sort(function (a, b) { return b.value_million_eur - a.value_million_eur; })[0];
    var kpis = [
      { label: "Valore aggiunto totale", value: formatMoney(total), note: text(state.year) + " - " + countryLabel(state.country) + " - non e il PIL" },
      { label: "PIL", value: formatMoney(gdp), note: "Denominatore dei rapporti al PIL" },
      { label: "Primo settore", value: top ? sectorLabel(top) : "ND", note: top ? formatMoney(top.value_million_eur) : "" },
      { label: "Settori disponibili", value: rows.filter(function (row) { return row.value_million_eur !== null; }).length, note: "voci National Accounts" }
    ];
    clear(container);
    kpis.forEach(function (item) {
      var card = document.createElement("div");
      card.className = "vai-kpi";
      card.innerHTML = "<span></span><strong></strong><small></small>";
      card.querySelector("span").textContent = item.label;
      card.querySelector("strong").textContent = item.value;
      card.querySelector("small").textContent = item.note;
      container.appendChild(card);
    });
  }

  function renderFocusCards() {
    var container = byId("vaiFocusCards");
    var rows = rowsForCountryYear(state.country, state.year);
    var total = totalValue(rows);
    clear(container);
    var sections = mainSectionRows(rows).filter(function (row) {
      return number(row.value_million_eur) !== null && row.value_million_eur > 0;
    }).sort(function (a, b) {
      return b.value_million_eur - a.value_million_eur;
    });
    var cards = sections.slice(0, 3).map(function (row, index) {
      return { label: "Maggiore " + (index + 1), row: row };
    });
    var used = {};
    cards.forEach(function (item) {
      if (item.row) used[item.row.sector_code] = true;
    });
    sections.slice().sort(function (a, b) { return a.value_million_eur - b.value_million_eur; })
      .filter(function (row) { return !used[row.sector_code]; })
      .slice(0, 3)
      .forEach(function (row, index) {
        cards.push({ label: "Minore " + (index + 1), row: row });
      });
    cards.forEach(function (item) {
      var row = item.row;
      var share = row && total ? row.value_million_eur / total * 100 : null;
      var card = document.createElement("div");
      card.className = "vai-focus-card";
      card.innerHTML = "<span></span><strong></strong><em></em><small></small>";
      card.querySelector("span").textContent = item.label;
      card.querySelector("strong").textContent = row ? sectorLabel(row) : "Non disponibile";
      card.querySelector("em").textContent = row ? formatMoney(row.value_million_eur) : "ND";
      card.querySelector("small").textContent = row ? "Quota sul totale: " + formatShare(share) : "Dato non pubblicato per questa selezione.";
      container.appendChild(card);
    });
  }

  function metricOptions(unit) {
    var options = [{ value: "value", label: "Valori assoluti" }];
    if (unit !== "value_per_employed") {
      options.push({ value: "share", label: "Quota percentuale" });
    }
    options.push({ value: "base100", label: "Indice base 100" });
    if (unit !== "enterprises" && unit !== "value_per_employed") {
      options.splice(2, 0, { value: "gdp_share", label: "Quota sul PIL" });
    }
    return options;
  }

  function seriesMetricExplanation(metric, unit) {
    if (metric === "gdp_share") {
      return "La quota sul PIL divide il valore aggiunto per il PIL nominale dello stesso paese e anno: e utile per confrontare economie di dimensione diversa.";
    }
    if (metric === "share") {
      return unit === "enterprises"
        ? "La quota percentuale mostra il peso di ogni classe sul numero di imprese del settore selezionato."
        : "La quota percentuale mostra il peso della voce selezionata sul totale pubblicato nello stesso paese e anno.";
    }
    if (metric === "base100") {
      return "L'indice base 100 confronta la dinamica dal primo anno selezionato: evidenzia traiettorie relative, non livelli assoluti.";
    }
    if (unit === "value_per_employed") {
      return "I valori assoluti dividono il valore aggiunto della classe per le persone occupate nella stessa classe, settore, paese e anno.";
    }
    return unit === "enterprises"
      ? "I valori assoluti contano le imprese pubblicate nella fonte per classe dimensionale."
      : "I valori assoluti mostrano il valore aggiunto in milioni di euro correnti.";
  }

  function yAxisOptions() {
    return [
      { value: "zero", label: "Asse Y da zero" },
      { value: "fit", label: "Asse Y adattato ai dati" }
    ];
  }

  function yAxisConfig(title) {
    var axis = { title: title };
    if (state.seriesYAxis === "zero") axis.rangemode = "tozero";
    return axis;
  }

  function syncSeriesCountries() {
    var options = countryOptions(false);
    var codes = options.map(function (option) { return option.value; });
    state.countryTrendCountries = toArray(state.countryTrendCountries).filter(function (code) {
      return codes.indexOf(code) >= 0;
    });
    if (!state.countryTrendCountries.length) {
      state.countryTrendCountries = DEFAULT_TREND_COUNTRIES.filter(function (code) {
        return codes.indexOf(code) >= 0;
      });
    }
    return options;
  }

  function syncSeriesSectors() {
    var options = nationalSectorOptionsWithThemes(true);
    var codes = options.map(function (option) { return option.value; });
    state.seriesSectors = toArray(state.seriesSectors).filter(function (code) {
      return codes.indexOf(code) >= 0;
    });
    if (!state.seriesSectors.length) {
      state.seriesSectors = DEFAULT_SERIES_SECTORS.filter(function (code) {
        return codes.indexOf(code) >= 0;
      });
    }
    return options;
  }

  function totalByCountryYear() {
    var totals = {};
    records("sector_value_added").forEach(function (row) {
      if (row.sector_code === "TOTAL") {
        totals[row.country_code + "-" + Number(row.year)] = number(row.value_million_eur);
      }
    });
    return totals;
  }

  function gdpByCountryYear() {
    var values = {};
    records("country_gdp").forEach(function (row) {
      var value = number(row.gdp_million_eur);
      if (value !== null) values[row.country_code + "-" + Number(row.year)] = value;
    });
    return values;
  }

  function gdpValue(country, year) {
    return gdpByCountryYear()[country + "-" + Number(year)] || null;
  }

  function sectorEmployeesByCode(country, year) {
    var values = {};
    records("sector_employees").forEach(function (row) {
      if (row.country_code !== country || Number(row.year) !== Number(year)) return;
      var value = number(row.employees_thousand);
      if (value !== null) values[row.sector_code] = value;
    });
    return values;
  }

  function seriesRowsForRange() {
    if (state.seriesView === "countries") {
      return nationalRowsWithThemes().filter(function (row) {
        return state.countryTrendCountries.indexOf(row.country_code) >= 0
          && row.sector_code === state.countryTrendSector
          && number(row.value_million_eur) !== null;
      });
    }
    if (state.seriesView === "size") {
      var config = sizeTrendConfig();
      if (config.unit === "value_per_employed") {
        var employment = {};
        sizeSourceRows(
          "firm_size_employment",
          "persons_employed",
          state.sizeTrendCountry,
          state.sizeTrendSector,
          null
        ).forEach(function (row) {
          employment[Number(row.year) + "-" + row.size_class] = number(row.persons_employed);
        });
        return sizeSourceRows(
          "firm_size_value_added",
          "value_million_eur",
          state.sizeTrendCountry,
          state.sizeTrendSector,
          null
        ).map(function (row) {
          var employed = employment[Number(row.year) + "-" + row.size_class];
          return Object.assign({}, row, {
            persons_employed: employed,
            value_per_employed: employed ? number(row.value_million_eur) * 1000 / employed : null
          });
        }).filter(function (row) {
          return number(row.value_per_employed) !== null;
        });
      }
      return sizeSourceRows(
        config.key,
        config.valueField,
        state.sizeTrendCountry,
        state.sizeTrendSector,
        null
      );
    }
    return nationalRowsWithThemes().filter(function (row) {
      return row.country_code === state.seriesCountry
        && state.seriesSectors.indexOf(row.sector_code) >= 0
        && number(row.value_million_eur) !== null;
    });
  }

  function renderSeriesCommonFilters(container, yearOpts, unit) {
    var options = metricOptions(unit);
    if (!options.some(function (option) { return option.value === state.seriesMetric; })) {
      state.seriesMetric = "value";
    }
    makeSelect(container, "Da anno", state.seriesStartYear, yearOpts, function (value) {
      state.seriesStartYear = Number(value);
      if (Number(state.seriesStartYear) > Number(state.seriesEndYear)) state.seriesEndYear = Number(value);
      renderSeriesFilters();
      renderSeriesChart();
    });
    makeSelect(container, "Ad anno", state.seriesEndYear, yearOpts, function (value) {
      state.seriesEndYear = Number(value);
      if (Number(state.seriesStartYear) > Number(state.seriesEndYear)) state.seriesStartYear = Number(value);
      renderSeriesFilters();
      renderSeriesChart();
    });
    makeSelect(container, "Parametro", state.seriesMetric, options, function (value) {
      state.seriesMetric = value;
      renderSeriesFilters();
      renderSeriesChart();
    });
    makeSelect(container, "Asse Y", state.seriesYAxis, yAxisOptions(), function (value) {
      state.seriesYAxis = value;
      renderSeriesChart();
    });
  }

  function renderSeriesFilters() {
    var container = byId("vaiSeriesFilters");
    if (!container) return;
    clear(container);
    makeSelect(container, "Vista", state.seriesView, [
      { value: "countries", label: "Paesi nel tempo" },
      { value: "sectors", label: "Settori nel tempo" },
      { value: "size", label: "Classi dimensionali nel tempo" }
    ], function (value) {
      state.seriesView = value;
      renderSeriesFilters();
      renderSeriesChart();
    });

    if (state.seriesView === "countries") {
      var countryOpts = syncSeriesCountries();
      makeSelect(container, "Settore", state.countryTrendSector, nationalSectorOptionsWithThemes(true), function (value) {
        state.countryTrendSector = value;
        renderSeriesFilters();
        renderSeriesChart();
      });
      makeMultiSelect(container, "Paesi nel grafico", state.countryTrendCountries, countryOpts, function (values) {
        state.countryTrendCountries = values.length ? values : DEFAULT_TREND_COUNTRIES.slice();
        renderSeriesFilters();
        renderSeriesChart();
      });
    } else if (state.seriesView === "size") {
      makeSelect(container, "Misura", state.sizeTrendMeasure, [
        { value: "value_added", label: "Valore aggiunto" },
        { value: "enterprises", label: "Numero imprese" },
        { value: "value_per_employed", label: "Valore aggiunto per occupato" }
      ], function (value) {
        state.sizeTrendMeasure = value;
        renderSeriesFilters();
        renderSeriesChart();
      });
      makeSelect(container, "Paese", state.sizeTrendCountry, countryOptions(false), function (value) {
        state.sizeTrendCountry = value;
        renderSeriesFilters();
        renderSeriesChart();
      });
      makeSelect(container, "Settore imprese", state.sizeTrendSector, sbsSectorOptionsWithTotal(), function (value) {
        state.sizeTrendSector = value;
        renderSeriesFilters();
        renderSeriesChart();
      });
    } else {
      var sectorOpts = syncSeriesSectors();
      makeSelect(container, "Paese", state.seriesCountry, countryOptions(true), function (value) {
        state.seriesCountry = value;
        renderSeriesFilters();
        renderSeriesChart();
      });
      makeMultiSelect(container, "Settori nel grafico", state.seriesSectors, sectorOpts, function (values) {
        state.seriesSectors = values.length ? values : DEFAULT_SERIES_SECTORS.slice();
        renderSeriesFilters();
        renderSeriesChart();
      });
    }

    renderSeriesCommonFilters(
      container,
      syncYearRange(seriesRowsForRange(), "seriesStartYear", "seriesEndYear"),
      state.seriesView === "size" ? sizeTrendConfig().unit : "value_added"
    );
  }

  function renderCountrySeriesChart() {
    var allRows = filterYearRange(seriesRowsForRange(), "seriesStartYear", "seriesEndYear");
    var totals = totalByCountryYear();
    var gdps = gdpByCountryYear();
    var baseYear = Number(state.seriesStartYear);
    var traces = state.countryTrendCountries.map(function (country, index) {
      var rows = allRows.filter(function (row) { return row.country_code === country; })
        .sort(function (a, b) { return Number(a.year) - Number(b.year); });
      var baseRow = rows.find(function (row) { return Number(row.year) === baseYear; });
      var baseValue = baseRow ? number(baseRow.value_million_eur) : null;
      var points = rows.map(function (row) {
        var year = Number(row.year);
        var denominator = state.seriesMetric === "gdp_share"
          ? gdps[row.country_code + "-" + year]
          : totals[row.country_code + "-" + year];
        return {
          year: year,
          value: groupValue(row, state.seriesMetric, baseValue, denominator)
        };
      }).filter(function (point) { return point.value !== null; });
      if (points.length < 2) return null;
      return {
        type: "scatter",
        mode: "lines+markers",
        name: countryLabel(country),
        x: points.map(function (point) { return point.year; }),
        y: points.map(function (point) { return point.value; }),
        line: { color: COLORS[index % COLORS.length], width: country === "IT" ? 3 : 2 },
        marker: { size: country === "IT" ? 7 : 6 },
        hovertemplate: seriesHoverTemplate(state.seriesMetric, baseYear, "value_added")
      };
    }).filter(Boolean);
    byId("vaiSeriesTitle").textContent = sectorLabel(state.countryTrendSector) + " nei paesi";
    byId("vaiSeriesTag").textContent = state.countryTrendCountries.length + " paesi - " + text(state.seriesStartYear) + "-" + text(state.seriesEndYear);
    byId("vaiSeriesNote").textContent = "Ogni linea mostra lo stesso settore in un paese. Cambiando parametro passi dai livelli nominali alle quote sul totale, al rapporto con il PIL o alla dinamica indicizzata.";
    renderGuidance("vaiSeriesGuidance", [
      {
        title: "Paesi e settore",
        text: "Il settore selezionato resta identico per tutte le linee; il filtro multiplo serve a tenere solo i paesi che vuoi confrontare."
      },
      {
        title: "Dato mostrato",
        text: seriesMetricExplanation(state.seriesMetric, "value_added")
      }
    ]);
    return traces;
  }

  function renderSectorSeriesChart() {
    var allRows = filterYearRange(seriesRowsForRange(), "seriesStartYear", "seriesEndYear");
    var totals = totalByYear(state.seriesCountry);
    var gdps = gdpByCountryYear();
    var baseYear = Number(state.seriesStartYear);
    var traces = state.seriesSectors.map(function (code, index) {
      var rows = allRows.filter(function (row) { return row.sector_code === code; })
        .sort(function (a, b) { return Number(a.year) - Number(b.year); });
      var baseRow = rows.find(function (row) { return Number(row.year) === baseYear; });
      var baseValue = baseRow ? number(baseRow.value_million_eur) : null;
      var points = rows.map(function (row) {
        var year = Number(row.year);
        var denominator = state.seriesMetric === "gdp_share"
          ? gdps[state.seriesCountry + "-" + year]
          : totals[year];
        return {
          year: year,
          value: groupValue(row, state.seriesMetric, baseValue, denominator),
          label: sectorLabel(row)
        };
      }).filter(function (point) { return point.value !== null; });
      if (points.length < 2) return null;
      return {
        type: "scatter",
        mode: "lines+markers",
        name: points[0].label,
        x: points.map(function (point) { return point.year; }),
        y: points.map(function (point) { return point.value; }),
        line: { color: COLORS[index % COLORS.length], width: index === 0 ? 3 : 2 },
        marker: { size: index === 0 ? 7 : 6 },
        hovertemplate: seriesHoverTemplate(state.seriesMetric, baseYear, "value_added")
      };
    }).filter(Boolean);
    byId("vaiSeriesTitle").textContent = "Settori nel tempo";
    byId("vaiSeriesTag").textContent = countryLabel(state.seriesCountry) + " - " + text(state.seriesStartYear) + "-" + text(state.seriesEndYear);
    byId("vaiSeriesNote").textContent = "Ogni linea e un settore nello stesso paese. Il parametro selezionato cambia la lettura tra dimensione economica, composizione, peso sul PIL e dinamica.";
    renderGuidance("vaiSeriesGuidance", [
      {
        title: "Settori selezionati",
        text: "Il grafico usa gli stessi anni per le voci scelte; se una linea manca significa che non ha almeno due osservazioni nel periodo selezionato."
      },
      {
        title: "Dato mostrato",
        text: seriesMetricExplanation(state.seriesMetric, "value_added")
      }
    ]);
    return traces;
  }

  function renderSizeSeriesChart() {
    var config = sizeTrendConfig();
    var rows = filterYearRange(seriesRowsForRange(), "seriesStartYear", "seriesEndYear");
    var gdps = gdpByCountryYear();
    var totals = {};
    rows.forEach(function (row) {
      var year = Number(row.year);
      totals[year] = (totals[year] || 0) + number(row[config.valueField]);
    });
    var baseYear = Number(state.seriesStartYear);
    var traces = SIZE_ORDER.map(function (sizeClass, index) {
      var sizeRowsList = rows.filter(function (row) { return row.size_class === sizeClass; })
        .sort(function (a, b) { return Number(a.year) - Number(b.year); });
      var baseRow = sizeRowsList.find(function (row) { return Number(row.year) === baseYear; });
      var baseValue = baseRow ? number(baseRow[config.valueField]) : null;
      var points = sizeRowsList.map(function (row) {
        var year = Number(row.year);
        var denominator = state.seriesMetric === "gdp_share"
          ? gdps[state.sizeTrendCountry + "-" + year]
          : totals[year];
        return {
          year: year,
          value: groupValueFromNumber(number(row[config.valueField]), state.seriesMetric, baseValue, denominator)
        };
      }).filter(function (point) { return point.value !== null; });
      if (points.length < 2) return null;
      return {
        type: "scatter",
        mode: "lines+markers",
        name: sizeClass,
        x: points.map(function (point) { return point.year; }),
        y: points.map(function (point) { return point.value; }),
        line: { color: COLORS[index % COLORS.length], width: index === 0 ? 3 : 2 },
        marker: { size: index === 0 ? 7 : 6 },
        hovertemplate: seriesHoverTemplate(state.seriesMetric, baseYear, config.unit)
      };
    }).filter(Boolean);
    var measureText = config.unit === "enterprises"
      ? "numero di imprese"
      : (config.unit === "value_per_employed" ? "valore aggiunto per occupato" : "valore aggiunto");
    byId("vaiSeriesTitle").textContent = sectorLabel(state.sizeTrendSector) + " per classe dimensionale";
    byId("vaiSeriesTag").textContent = countryLabel(state.sizeTrendCountry) + " - " + text(state.seriesStartYear) + "-" + text(state.seriesEndYear);
    byId("vaiSeriesNote").textContent = state.sizeTrendSector === SBS_TOTAL_CODE
      ? "Ogni linea e una classe dimensionale aggregata sui settori SBS disponibili. La misura corrente lavora su " + measureText + " nel perimetro delle statistiche strutturali d'impresa."
      : "Ogni linea e una classe dimensionale nel settore selezionato. La misura corrente lavora su " + measureText + " nel perimetro delle statistiche strutturali d'impresa.";
    renderGuidance("vaiSeriesGuidance", [
      {
        title: "Classi dimensionali",
        text: "Le classi 0-9, 10-19, 20-49, 50-249 e 250+ persone occupate restano separate, senza aggregare tutto sopra 10."
      },
      {
        title: "Dato mostrato",
        text: config.unit === "enterprises"
          ? seriesMetricExplanation(state.seriesMetric, "enterprises")
          : seriesMetricExplanation(state.seriesMetric, config.unit === "value_per_employed" ? "value_per_employed" : "value_added")
      }
    ]);
    return traces;
  }

  function renderSeriesChart() {
    var unit = "value_added";
    var traces = [];
    if (state.seriesView === "countries") {
      traces = renderCountrySeriesChart();
    } else if (state.seriesView === "size") {
      unit = sizeTrendConfig().unit;
      traces = renderSizeSeriesChart();
    } else {
      traces = renderSectorSeriesChart();
    }
    if (!traces.length) {
      showEmpty("vaiSeriesChart", "Serie storica non disponibile per questa selezione.");
      return;
    }
    plot("vaiSeriesChart", traces, {
      margin: { t: 18, r: 24, b: 84, l: 86 },
      xaxis: {
        title: "",
        dtick: 1,
        range: [Number(state.seriesStartYear) - 0.2, Number(state.seriesEndYear) + 0.2]
      },
      yaxis: yAxisConfig(seriesAxisTitle(state.seriesMetric, unit)),
      sourceNote: CHART_SOURCE_NOTE
    });
  }

  function sizeTrendConfig() {
    if (state.sizeTrendMeasure === "enterprises") {
      return {
        key: "firm_size_enterprises",
        valueField: "enterprises",
        unit: "enterprises",
        label: "Numero imprese"
      };
    }
    if (state.sizeTrendMeasure === "value_per_employed") {
      return {
        key: "firm_size_value_added",
        valueField: "value_per_employed",
        unit: "value_per_employed",
        label: "Valore aggiunto per occupato"
      };
    }
    return {
      key: "firm_size_value_added",
      valueField: "value_million_eur",
      unit: "value_added",
      label: "Valore aggiunto"
    };
  }

  function sortedSizeRows(rows) {
    return rows.slice().sort(function (a, b) {
      return SIZE_ORDER.indexOf(a.size_class) - SIZE_ORDER.indexOf(b.size_class);
    });
  }

  function sizeSourceRows(key, valueField, country, sector, year) {
    var rows = records(key).filter(function (row) {
      if (row.country_code !== country) return false;
      if (year !== null && year !== undefined && Number(row.year) !== Number(year)) return false;
      if (sector === SBS_TOTAL_CODE && SBS_TOTAL_COMPONENT_CODES.indexOf(row.sector_code) < 0) return false;
      if (sector !== SBS_TOTAL_CODE && row.sector_code !== sector) return false;
      return number(row[valueField]) !== null;
    });
    if (sector !== SBS_TOTAL_CODE) return sortedSizeRows(rows);
    var grouped = {};
    rows.forEach(function (row) {
      var groupKey = Number(row.year) + "-" + row.size_class;
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          year: Number(row.year),
          country_code: row.country_code,
          country_name: row.country_name,
          sector_code: SBS_TOTAL_CODE,
          sector_label: sectorLabel(SBS_TOTAL_CODE),
          size_class: row.size_class,
          source: row.source,
          dataset: row.dataset
        };
        grouped[groupKey][valueField] = 0;
      }
      grouped[groupKey][valueField] += number(row[valueField]) || 0;
    });
    return sortedSizeRows(Object.keys(grouped).map(function (groupKey) {
      return grouped[groupKey];
    }));
  }

  function sizeChartConfig() {
    if (state.sizeMeasure === "value_added") {
      return {
        key: "firm_size_value_added",
        valueField: "value_million_eur",
        unit: "value_added",
        title: "Valore aggiunto per classe dimensionale",
        yTitle: "Milioni di euro",
        empty: "Valore aggiunto per dimensione non disponibile per questa selezione."
      };
    }
    if (state.sizeMeasure === "value_added_share") {
      return {
        key: "firm_size_value_added",
        valueField: "value_million_eur",
        unit: "value_added_share",
        title: "Quota del valore aggiunto per classe",
        yTitle: "% valore aggiunto",
        empty: "Quote del valore aggiunto per dimensione non disponibili per questa selezione."
      };
    }
    if (state.sizeMeasure === "value_per_enterprise") {
      return {
        key: "firm_size_value_added",
        valueField: "value_million_eur",
        unit: "value_per_enterprise",
        title: "Valore aggiunto per impresa per classe",
        yTitle: "Migliaia di euro per impresa",
        empty: "Valore aggiunto per impresa non disponibile per questa selezione."
      };
    }
    if (state.sizeMeasure === "value_gdp_share") {
      return {
        key: "firm_size_value_added",
        valueField: "value_million_eur",
        unit: "value_gdp_share",
        title: "Valore aggiunto per classe in rapporto al PIL",
        yTitle: "% PIL",
        empty: "Rapporto al PIL per dimensione non disponibile per questa selezione."
      };
    }
    if (state.sizeMeasure === "value_per_employed") {
      return {
        key: "firm_size_value_added",
        valueField: "value_million_eur",
        unit: "value_per_employed",
        title: "Valore aggiunto per occupato per classe",
        yTitle: "Migliaia di euro per occupato",
        empty: "Valore aggiunto per occupato non disponibile per questa selezione."
      };
    }
    if (state.sizeMeasure === "enterprise_share") {
      return {
        key: "firm_size_enterprises",
        valueField: "enterprises",
        unit: "enterprise_share",
        title: "Quota percentuale delle imprese",
        yTitle: "% imprese",
        empty: "Quote imprese non disponibili per questa selezione."
      };
    }
    return {
      key: "firm_size_enterprises",
      valueField: "enterprises",
      unit: "enterprises",
      title: "Numero di imprese per classe dimensionale",
      yTitle: "Numero di imprese",
      empty: "Numero di imprese non disponibile per questa selezione."
    };
  }

  function sizeRows(key, valueField) {
    return sizeSourceRows(key, valueField, state.sizeCountry, state.sizeSector, state.sizeYear);
  }

  function sectorMeasureConfig() {
    var configs = {
      na_value: { source: "national", valueKey: "value_million_eur", title: "Valore aggiunto totale", axis: "Milioni di euro", empty: "Dati settoriali non disponibili per questa selezione." },
      na_share: { source: "national", valueKey: "share", title: "Quota sul valore aggiunto totale", axis: "% del totale", empty: "Quote settoriali non disponibili per questa selezione." },
      na_gdp_share: { source: "national", valueKey: "gdp_share", title: "Valore aggiunto in rapporto al PIL", axis: "% PIL", empty: "Rapporto al PIL non disponibile per questa selezione." },
      na_value_per_employee: { source: "national", valueKey: "value_per_employee", title: "Valore aggiunto per dipendente", axis: "Migliaia di euro per dipendente", empty: "Valore aggiunto per dipendente non disponibile per questa selezione." },
      sbs_enterprises: { source: "sbs_enterprises", valueKey: "enterprises", title: "Numero di imprese per settore", axis: "Numero di imprese", empty: "Numero di imprese per settore non disponibile per questa selezione." },
      sbs_enterprise_share: { source: "sbs_enterprises", valueKey: "enterprise_share", title: "Quota sulle imprese per settore", axis: "% imprese", empty: "Quote sulle imprese non disponibili per questa selezione." },
      sbs_value: { source: "sbs_value", valueKey: "value_million_eur", title: "Valore aggiunto delle imprese per settore", axis: "Milioni di euro", empty: "Valore aggiunto delle imprese per settore non disponibile per questa selezione." },
      sbs_gdp_share: { source: "sbs_value", valueKey: "gdp_share", title: "Valore aggiunto delle imprese in rapporto al PIL", axis: "% PIL", empty: "Rapporto al PIL SBS non disponibile per questa selezione." },
      sbs_value_per_enterprise: { source: "sbs_value", valueKey: "value_per_enterprise", title: "Valore aggiunto per impresa", axis: "Migliaia di euro per impresa", empty: "Valore aggiunto per impresa non disponibile per questa selezione." },
      sbs_value_per_employed: { source: "sbs_value", valueKey: "value_per_employed", title: "Valore aggiunto per occupato", axis: "Migliaia di euro per occupato", empty: "Valore aggiunto per occupato non disponibile per questa selezione." }
    };
    return configs[state.sectorMeasure] || configs.na_value;
  }

  function sectorMeasureOptions() {
    return [
      { value: "na_value", label: "Valore aggiunto totale" },
      { value: "na_share", label: "Quota sul valore aggiunto totale (%)" },
      { value: "na_gdp_share", label: "Valore aggiunto / PIL (%)" },
      { value: "na_value_per_employee", label: "Valore aggiunto per dipendente" },
      { value: "sbs_enterprises", label: "Numero imprese per settore" },
      { value: "sbs_enterprise_share", label: "Quota sulle imprese (%)" },
      { value: "sbs_value", label: "Valore aggiunto imprese" },
      { value: "sbs_gdp_share", label: "Valore aggiunto imprese / PIL (%)" },
      { value: "sbs_value_per_enterprise", label: "Valore aggiunto per impresa" },
      { value: "sbs_value_per_employed", label: "Valore aggiunto per occupato" }
    ];
  }

  function sectorMeasureUsesSbs() {
    return sectorMeasureConfig().source.indexOf("sbs") === 0;
  }

  function sectorYearBaseRows(config) {
    if (config.source === "sbs_enterprises") return records("firm_size_enterprises");
    if (config.source === "sbs_value") return records("firm_size_value_added");
    return records("sector_value_added");
  }

  function sbsSectorCodesForMode() {
    if (state.sectorMode === "detail") {
      return lookup("sbs_sectors").map(function (row) { return row.code; })
        .filter(function (code) { return isNaceDivision(code); });
    }
    return SBS_TOTAL_COMPONENT_CODES.slice();
  }

  function sbsSectorAggregates(country, year) {
    var sectorCodes = sbsSectorCodesForMode();
    var bySector = {};
    records("firm_size_enterprises").forEach(function (row) {
      if (row.country_code !== country || Number(row.year) !== Number(year)) return;
      if (sectorCodes.indexOf(row.sector_code) < 0) return;
      var item = bySector[row.sector_code] || { sector_code: row.sector_code, sector_label: sectorLabel(row), enterprises: 0, value_million_eur: 0, persons_employed: 0 };
      item.enterprises += number(row.enterprises) || 0;
      bySector[row.sector_code] = item;
    });
    records("firm_size_value_added").forEach(function (row) {
      if (row.country_code !== country || Number(row.year) !== Number(year)) return;
      if (sectorCodes.indexOf(row.sector_code) < 0) return;
      var item = bySector[row.sector_code] || { sector_code: row.sector_code, sector_label: sectorLabel(row), enterprises: 0, value_million_eur: 0, persons_employed: 0 };
      item.value_million_eur += number(row.value_million_eur) || 0;
      bySector[row.sector_code] = item;
    });
    records("firm_size_employment").forEach(function (row) {
      if (row.country_code !== country || Number(row.year) !== Number(year)) return;
      if (sectorCodes.indexOf(row.sector_code) < 0) return;
      var item = bySector[row.sector_code] || { sector_code: row.sector_code, sector_label: sectorLabel(row), enterprises: 0, value_million_eur: 0, persons_employed: 0 };
      item.persons_employed += number(row.persons_employed) || 0;
      bySector[row.sector_code] = item;
    });
    return Object.keys(bySector).map(function (code) {
      var item = bySector[code];
      item.value_per_enterprise = item.enterprises ? item.value_million_eur * 1000 / item.enterprises : null;
      item.value_per_employed = item.persons_employed ? item.value_million_eur * 1000 / item.persons_employed : null;
      return item;
    });
  }

  function sectorChartRows(config) {
    if (config.source === "national") {
      var rows = records("sector_value_added").filter(function (row) {
        return row.country_code === state.sectorCountry
          && Number(row.year) === Number(state.sectorYear)
          && number(row.value_million_eur) !== null;
      });
      var candidates = state.sectorMode === "themes"
        ? thematicRows(rows)
        : (state.sectorMode === "sections" ? mainSectionRows(rows) : detailRows(rows));
      var total = totalValue(rows) || candidates.reduce(function (sum, row) { return sum + number(row.value_million_eur); }, 0);
      var gdp = gdpValue(state.sectorCountry, state.sectorYear);
      var employeesBySector = sectorEmployeesByCode(state.sectorCountry, state.sectorYear);
      return candidates.map(function (row) {
        var value = row.value_million_eur;
        var employeeCodes = row.theme_component_codes || [row.sector_code];
        var employees = employeeCodes.reduce(function (sum, code) {
          return sum + (employeesBySector[code] || 0);
        }, 0);
        if (config.valueKey === "share" && total) value = row.value_million_eur / total * 100;
        if (config.valueKey === "gdp_share") value = gdp ? row.value_million_eur / gdp * 100 : null;
        if (config.valueKey === "value_per_employee") value = employees ? row.value_million_eur / employees : null;
        return Object.assign({}, row, {
          plot_value: value,
          raw_value: row.value_million_eur,
          share: total ? row.value_million_eur / total * 100 : null,
          gdp_share: gdp ? row.value_million_eur / gdp * 100 : null,
          employees_thousand: employees || null,
          value_per_employee: employees ? row.value_million_eur / employees : null
        });
      });
    }
    var sbsRows = sbsSectorAggregates(state.sectorCountry, state.sectorYear);
    var totalEnterprises = sbsRows.reduce(function (sum, row) { return sum + row.enterprises; }, 0);
    var totalSbsValue = sbsRows.reduce(function (sum, row) { return sum + row.value_million_eur; }, 0);
    var sbsGdp = gdpValue(state.sectorCountry, state.sectorYear);
    return sbsRows.map(function (row) {
      var value = row[config.valueKey];
      if (config.valueKey === "enterprise_share") value = totalEnterprises ? row.enterprises / totalEnterprises * 100 : null;
      if (config.valueKey === "gdp_share") value = sbsGdp ? row.value_million_eur / sbsGdp * 100 : null;
      return Object.assign({}, row, {
        plot_value: value,
        enterprise_share: totalEnterprises ? row.enterprises / totalEnterprises * 100 : null,
        value_share: totalSbsValue ? row.value_million_eur / totalSbsValue * 100 : null,
        gdp_share: sbsGdp ? row.value_million_eur / sbsGdp * 100 : null
      });
    });
  }

  function renderSectorFilters() {
    var container = byId("vaiSectorFilters");
    if (!container) return;
    clear(container);
    var config = sectorMeasureConfig();
    if (sectorMeasureUsesSbs() && state.sectorCountry === "EU27_2020") state.sectorCountry = "IT";
    if (sectorMeasureUsesSbs() && state.sectorMode === "themes") state.sectorMode = "sections";
    var countryOpts = countryOptions(!sectorMeasureUsesSbs());
    var allYearRows = sectorYearBaseRows(config);
    var baseRows = allYearRows.filter(function (row) { return row.country_code === state.sectorCountry; });
    state.sectorYear = effectiveYear(baseRows.length ? baseRows : allYearRows, state.sectorYear || state.year);
    makeSelect(container, "Parametro", state.sectorMeasure, sectorMeasureOptions(), function (value) {
      state.sectorMeasure = value;
      renderSectorFilters();
      renderSectorChart();
    });
    makeSelect(container, "Paese", state.sectorCountry, countryOpts, function (value) {
      state.sectorCountry = value;
      renderSectorFilters();
      renderSectorChart();
    });
    makeSelect(container, "Anno", state.sectorYear, yearOptions(baseRows.length ? baseRows : allYearRows), function (value) {
      state.sectorYear = Number(value);
      renderSectorChart();
    });
    makeSelect(container, "Vista", state.sectorMode, sectorMeasureUsesSbs() ? [
        { value: "sections", label: "Sezioni SBS separate" },
        { value: "detail", label: "Divisioni SBS disponibili" }
      ] : [
        { value: "sections", label: "Sezioni NACE separate" },
        { value: "detail", label: "Dettaglio A64 senza aggregati" },
        { value: "themes", label: "Aggregazioni tematiche" }
      ], function (value) {
        state.sectorMode = value;
        renderSectorChart();
      });
    makeSelect(container, "Ordine", state.rankMode, [
      { value: "top", label: "Valori maggiori" },
      { value: "bottom", label: "Valori minori" }
    ], function (value) {
      state.rankMode = value;
      renderSectorChart();
    });
    makeSelect(container, "Numero", state.rankCount, [
      { value: "8", label: "8 settori" },
      { value: "12", label: "12 settori" },
      { value: "20", label: "20 settori" },
      { value: "all", label: "Tutti i settori" }
    ], function (value) {
      state.rankCount = value;
      renderSectorChart();
    });
  }

  function sectorMeasureExplanation(config) {
    if (config.valueKey === "gdp_share") {
      return "Il valore aggiunto e diviso per il PIL nominale dello stesso paese e anno: la misura riduce l'effetto della dimensione complessiva dell'economia.";
    }
    if (config.valueKey === "value_per_employed") {
      return "Il valore per occupato divide il valore aggiunto SBS del settore per le persone occupate nello stesso settore, paese e anno.";
    }
    if (config.valueKey === "value_per_employee") {
      return "Il valore per dipendente divide il valore aggiunto dei conti nazionali per i dipendenti della stessa branca NACE. La linea di mediana e calcolata tra i settori mostrati.";
    }
    if (config.valueKey === "value_per_enterprise") {
      return "Il valore per impresa divide il valore aggiunto SBS del settore per il numero di imprese attive nello stesso settore, paese e anno.";
    }
    if (config.valueKey === "share" || config.valueKey === "enterprise_share") {
      return "La quota trasforma i livelli in peso percentuale per leggere la composizione interna della selezione.";
    }
    if (config.valueKey === "enterprises") {
      return "Il grafico conta le imprese attive pubblicate nelle Structural Business Statistics per ogni settore disponibile.";
    }
    return "La vista in livelli mostra la dimensione assoluta della misura selezionata, in milioni di euro correnti.";
  }

  function sectorHoverTemplate(config) {
    if (config.valueKey === "value_per_employed") {
      return "%{y}<br>%{x:,.1f} mila EUR per occupato<br>%{customdata[3]:,.0f} occupati<extra></extra>";
    }
    if (config.valueKey === "value_per_employee") {
      return "%{y}<br>%{x:,.1f} mila EUR per dipendente<br>%{customdata[7]:,.1f} mila dipendenti<extra></extra>";
    }
    if (config.valueKey === "value_per_enterprise") {
      return "%{y}<br>%{x:,.1f} mila EUR per impresa<br>%{customdata[1]:,.0f} imprese<extra></extra>";
    }
    if (config.valueKey === "enterprises") {
      return "%{y}<br>%{x:,.0f} imprese<br>%{customdata[2]:.1f}%<extra></extra>";
    }
    if (config.valueKey === "gdp_share") {
      return "%{y}<br>%{x:.2f}% del PIL<br>%{customdata[0]:,.1f} mln EUR<extra></extra>";
    }
    if (config.valueKey === "share" || config.valueKey === "enterprise_share") {
      return "%{y}<br>%{x:.1f}%<br>%{customdata[5]}<extra></extra>";
    }
    if (state.sectorMode === "themes") {
      return "%{y}<br>%{x:,.1f} mln EUR<br>Componenti: %{customdata[5]}<extra></extra>";
    }
    return "%{y}<br>%{x:,.1f} mln EUR<br>%{customdata[2]:.1f}%<extra></extra>";
  }

  function renderSectorChart() {
    var config = sectorMeasureConfig();
    var candidates = sectorChartRows(config);
    candidates = candidates.filter(function (row) {
      return number(row.plot_value) !== null && row.plot_value > 0;
    });
    candidates.sort(function (a, b) {
      return state.rankMode === "top"
        ? b.plot_value - a.plot_value
        : a.plot_value - b.plot_value;
    });
    if (state.rankCount !== "all") {
      candidates = candidates.slice(0, Number(state.rankCount));
    }
    candidates = candidates.reverse();
    byId("vaiSectorTitle").textContent = (state.rankMode === "top" ? "Valori maggiori - " : "Valori minori - ") + config.title.toLowerCase();
    byId("vaiSectorTag").textContent = countryLabel(state.sectorCountry) + " - " + text(state.sectorYear);
    var sectorNote = byId("vaiSectorNote");
    if (sectorNote) {
      sectorNote.textContent = sectorMeasureUsesSbs()
        ? "Questa vista usa le statistiche strutturali d'impresa: copre il perimetro SBS disponibile per imprese, occupati e valore aggiunto. Le sezioni e le divisioni non vanno sommate tra loro."
        : (state.sectorMode === "themes"
          ? "Questa vista somma voci NACE osservate per costruire aggregazioni tematiche leggibili, incluso un proxy del turismo. Le aggregazioni non sono settori ufficiali e non vanno sommate tra loro."
          : "Questa vista usa i conti nazionali: le sezioni NACE sono separate per evitare aggregati troppo grandi e il dettaglio esclude le voci gia incluse.");
    }
    renderGuidance("vaiSectorGuidance", [
      {
        title: sectorMeasureUsesSbs()
          ? (state.sectorMode === "detail" ? "Divisioni SBS" : "Sezioni SBS")
          : (state.sectorMode === "themes"
          ? "Aggregazioni tematiche"
          : (state.sectorMode === "sections" ? "Sezioni separate" : "Dettaglio senza aggregati")),
        text: sectorMeasureUsesSbs()
          ? (state.sectorMode === "detail"
            ? "Il grafico mostra divisioni SBS dove pubblicate: qui compaiono voci come farmaceutica, alloggio, ristorazione, agenzie viaggio, sport e altri servizi."
            : "Il grafico usa componenti SBS non sovrapposte per una lettura sintetica. Per scendere di livello passa a divisioni SBS disponibili.")
          : (state.sectorMode === "themes"
          ? "Il turismo compare come proxy stretto e proxy esteso: sono somme dichiarate di voci NACE, utili per orientarsi ma non equivalenti a una misura ufficiale del turismo."
          : (state.sectorMode === "sections"
            ? "Commercio, trasporti e alloggio-ristorazione sono mostrati come settori distinti, non dentro l'aggregato G-I."
            : "Il dettaglio entra nelle branche A64 ed esclude gli aggregati piu larghi per evitare letture gonfiate da sottovoci gia incluse."))
      },
      {
        title: config.title,
        text: sectorMeasureExplanation(config)
      }
    ]);
    if (!candidates.length) {
      showEmpty("vaiSectorChart", config.empty);
      return;
    }
    var chartHeight = Math.max(470, candidates.length * 28 + 140);
    var chartNode = byId("vaiSectorChart");
    if (chartNode) chartNode.style.minHeight = chartHeight + "px";
    var medianValue = config.valueKey === "value_per_employee"
      ? median(candidates.map(function (row) { return row.plot_value; }))
      : null;
    var medianLayout = medianValue === null ? {} : {
      shapes: [{
        type: "line",
        x0: medianValue,
        x1: medianValue,
        y0: 0,
        y1: 1,
        xref: "x",
        yref: "paper",
        line: { color: "#f0b44d", width: 2, dash: "dot" }
      }],
      annotations: [{
        text: "Mediana settori: " + medianValue.toLocaleString("it-IT", { maximumFractionDigits: 1 }) + " mila EUR",
        x: medianValue,
        y: 1.04,
        xref: "x",
        yref: "paper",
        showarrow: false,
        xanchor: "left",
        font: { color: "#f0b44d", size: 11 }
      }]
    };
    plot("vaiSectorChart", [{
      type: "bar",
      orientation: "h",
      x: candidates.map(function (row) { return row.plot_value; }),
      y: candidates.map(function (row) { return sectorLabel(row); }),
      marker: { color: candidates.map(function (_, index) { return COLORS[index % COLORS.length]; }) },
      customdata: candidates.map(function (row) {
        return [
          row.raw_value || row.value_million_eur || null,
          row.enterprises || null,
          row.share || row.enterprise_share || row.value_share || row.gdp_share || null,
          row.persons_employed || null,
          row.gdp_share || null,
          row.theme_components || "",
          row.theme_note || "",
          row.employees_thousand || null,
          row.value_per_employee || null
        ];
      }),
      hovertemplate: sectorHoverTemplate(config)
    }], Object.assign({
      height: chartHeight,
      margin: { t: 18, r: 24, b: 78, l: 240 },
      xaxis: { title: config.axis },
      yaxis: { automargin: true },
      sourceNote: CHART_SOURCE_NOTE
    }, medianLayout));
  }

  function renderEuropeFilters() {
    var container = byId("vaiEuropeFilters");
    if (!container) return;
    clear(container);
    makeSelect(container, "Parametro", state.europeMeasure, [
      { value: "value", label: "Valore aggiunto totale" },
      { value: "gdp_share", label: "Valore aggiunto / PIL (%)" },
      { value: "share", label: "Quota sul valore aggiunto nazionale (%)" }
    ], function (value) {
      state.europeMeasure = value;
      renderEuropeChart();
    });
    makeSelect(container, "Settore", state.europeSector, nationalSectorOptionsWithThemes(true), function (value) {
      state.europeSector = value;
      renderEuropeChart();
    });
    makeSelect(container, "Anno", state.europeYear, yearOptions(records("sector_value_added")), function (value) {
      state.europeYear = Number(value);
      renderEuropeChart();
    });
  }

  function renderEuropeChart() {
    var totals = totalByCountryYear();
    var gdps = gdpByCountryYear();
    var rows = nationalRowsWithThemes().filter(function (row) {
      return EU27.indexOf(row.country_code) >= 0
        && row.sector_code === state.europeSector
        && Number(row.year) === Number(state.europeYear)
        && number(row.value_million_eur) !== null;
    }).map(function (row) {
      var key = row.country_code + "-" + Number(row.year);
      var plotValue = row.value_million_eur;
      if (state.europeMeasure === "gdp_share") plotValue = gdps[key] ? row.value_million_eur / gdps[key] * 100 : null;
      if (state.europeMeasure === "share") plotValue = totals[key] ? row.value_million_eur / totals[key] * 100 : null;
      return Object.assign({}, row, {
        plot_value: plotValue,
        share: totals[key] ? row.value_million_eur / totals[key] * 100 : null,
        gdp_share: gdps[key] ? row.value_million_eur / gdps[key] * 100 : null
      });
    }).filter(function (row) {
      return number(row.plot_value) !== null;
    }).sort(function (a, b) {
      return b.plot_value - a.plot_value;
    });
    var sector = rows[0] ? sectorLabel(rows[0]) : sectorLabel(state.europeSector);
    byId("vaiEuropeTitle").textContent = sector;
    byId("vaiEuropeTag").textContent = text(state.europeYear) + " - " + (
      state.europeMeasure === "gdp_share" ? "% PIL" : (state.europeMeasure === "share" ? "% totale paese" : "mln EUR")
    );
    renderGuidance("vaiEuropeGuidance", [
      {
        title: "Parametro selezionato",
        text: state.europeMeasure === "gdp_share"
          ? "Il valore aggiunto del settore e diviso per il PIL nominale del paese: il confronto pesa meno la dimensione assoluta dell'economia."
          : (state.europeMeasure === "share"
            ? "La quota mostra quanto il settore pesa dentro il valore aggiunto totale del paese nello stesso anno."
            : "Gli importi assoluti mostrano la dimensione economica del settore: i paesi piu grandi tendono ad avere valori maggiori.")
      },
      {
        title: "Stesso anno e stesso settore",
        text: "Il confronto usa una sola combinazione anno-settore; se un paese manca, la cella non e pubblicata nella fonte integrata."
      }
    ]);
    if (!rows.length) {
      showEmpty("vaiEuropeChart", "Confronto europeo non disponibile per questa selezione.");
      return;
    }
    plot("vaiEuropeChart", [{
      type: "bar",
      x: rows.map(function (row) { return countryLabel(row.country_code, row.country_name); }),
      y: rows.map(function (row) { return row.plot_value; }),
      marker: { color: rows.map(function (row) { return row.country_code === "IT" ? "#ff6b2a" : "#5b8fd9"; }) },
      customdata: rows.map(function (row) { return [row.value_million_eur, row.share, row.gdp_share]; }),
      hovertemplate: state.europeMeasure === "gdp_share"
        ? "%{x}<br>%{y:.2f}% del PIL<br>%{customdata[0]:,.1f} mln EUR<extra></extra>"
        : (state.europeMeasure === "share"
          ? "%{x}<br>%{y:.1f}% del valore aggiunto nazionale<br>%{customdata[0]:,.1f} mln EUR<extra></extra>"
          : "%{x}<br>%{y:,.1f} mln EUR<br>%{customdata[1]:.1f}% del paese<extra></extra>")
    }], {
      margin: { t: 18, r: 24, b: 120, l: 86 },
      yaxis: { title: state.europeMeasure === "gdp_share" ? "% PIL" : (state.europeMeasure === "share" ? "% del totale paese" : "Milioni di euro") },
      xaxis: { tickangle: -38, automargin: true },
      sourceNote: CHART_SOURCE_NOTE
    });
  }

  function renderSizeFilters() {
    var container = byId("vaiSizeFilters");
    if (!container) return;
    clear(container);
    var config = sizeChartConfig();
    var availableRows = sizeSourceRows(
      config.key,
      config.valueField,
      state.sizeCountry,
      state.sizeSector,
      null
    );
    state.sizeYear = effectiveYear(availableRows.length ? availableRows : records(config.key), state.sizeYear);
    makeSelect(container, "Parametro", state.sizeMeasure, [
      { value: "enterprises", label: "Numero imprese" },
      { value: "enterprise_share", label: "Quota imprese (%)" },
      { value: "value_added", label: "Valore aggiunto" },
      { value: "value_added_share", label: "Quota valore aggiunto (%)" },
      { value: "value_gdp_share", label: "Valore aggiunto / PIL (%)" },
      { value: "value_per_enterprise", label: "Valore aggiunto per impresa" },
      { value: "value_per_employed", label: "Valore aggiunto per occupato" }
    ], function (value) {
      state.sizeMeasure = value;
      renderSizeFilters();
      renderSizeChart();
    });
    makeSelect(container, "Paese", state.sizeCountry, countryOptions(false), function (value) {
      state.sizeCountry = value;
      renderSizeFilters();
      renderSizeChart();
    });
    makeSelect(container, "Settore imprese", state.sizeSector, sbsSectorOptionsWithTotal(), function (value) {
      state.sizeSector = value;
      renderSizeFilters();
      renderSizeChart();
    });
    makeSelect(container, "Anno", state.sizeYear, yearOptions(availableRows.length ? availableRows : records(config.key)), function (value) {
      state.sizeYear = Number(value);
      renderSizeChart();
    });
  }

  function renderSizeChart() {
    var config = sizeChartConfig();
    var rows = sizeRows(config.key, config.valueField);
    var enterpriseRows = sizeRows("firm_size_enterprises", "enterprises");
    var enterprisesByClass = {};
    enterpriseRows.forEach(function (row) {
      enterprisesByClass[row.size_class] = number(row.enterprises);
    });
    var employmentRows = sizeRows("firm_size_employment", "persons_employed");
    var employmentByClass = {};
    employmentRows.forEach(function (row) {
      employmentByClass[row.size_class] = number(row.persons_employed);
    });
    var gdp = gdpValue(state.sizeCountry, state.sizeYear);
    var total = rows.reduce(function (sum, row) { return sum + number(row[config.valueField]); }, 0);
    var sizeScope = state.sizeSector === SBS_TOTAL_CODE
      ? "del totale dei settori SBS disponibili"
      : "del settore selezionato";
    var values = rows.map(function (row) {
      var value = number(row[config.valueField]);
      if (config.unit === "enterprise_share" && total) return value / total * 100;
      if (config.unit === "value_added_share" && total) return value / total * 100;
      if (config.unit === "value_gdp_share") return gdp ? value / gdp * 100 : null;
      if (config.unit === "value_per_enterprise") {
        var enterprises = enterprisesByClass[row.size_class];
        return enterprises ? value * 1000 / enterprises : null;
      }
      if (config.unit === "value_per_employed") {
        var employed = employmentByClass[row.size_class];
        return employed ? value * 1000 / employed : null;
      }
      return value;
    });
    byId("vaiSizeTitle").textContent = rows[0] ? config.title + " - " + sectorLabel(rows[0]) : config.title;
    byId("vaiSizeTag").textContent = countryLabel(state.sizeCountry) + " - " + text(state.sizeYear);
    byId("vaiSizeNote").textContent = config.unit === "enterprises"
        ? "Il grafico conta le imprese attive pubblicate nella fonte in ciascuna classe dimensionale. Non misura quanto valore producono."
        : (config.unit === "enterprise_share"
          ? "La quota mostra il peso percentuale di ogni classe sul numero totale di imprese " + sizeScope + "."
          : (config.unit === "value_gdp_share"
            ? "Il rapporto al PIL divide il valore aggiunto della classe per il PIL nominale del paese nello stesso anno. Nel tooltip la seconda percentuale e la quota della classe dentro il valore aggiunto " + sizeScope + "."
            : (config.unit === "value_per_employed"
              ? "Il valore per occupato divide il valore aggiunto della classe per le persone occupate nella stessa classe."
              : (config.unit === "value_per_enterprise"
                ? "Il valore aggiunto per impresa divide il valore aggiunto della classe per il numero di imprese della stessa classe."
                : (config.unit === "value_added_share"
                  ? "La quota mostra quale parte del valore aggiunto " + sizeScope + " arriva da ogni classe dimensionale."
                  : "Il grafico mostra il valore aggiunto generato dalle imprese di ciascuna classe dimensionale.")))));
    renderGuidance("vaiSizeGuidance", [
      {
        title: config.unit.indexOf("value") === 0 ? "Valore prodotto" : "Imprese osservate",
        text: config.unit === "value_gdp_share"
          ? "La misura normalizza il valore aggiunto rispetto alla dimensione complessiva dell'economia nazionale. La quota mostrata nel tooltip usa invece come base il valore aggiunto " + sizeScope + "."
          : (config.unit === "value_per_employed"
            ? "La misura confronta il valore aggiunto generato per persona occupata nella classe dimensionale."
            : (config.unit.indexOf("value") === 0
              ? "Qui leggi dove si concentra il valore aggiunto, non quante imprese esistono in ogni classe."
              : "Qui leggi quante imprese appartengono a ogni classe. Una classe molto numerosa puo produrre una quota di valore aggiunto molto diversa."))
      },
      {
        title: "Classi sopra 10 persone",
        text: "Le classi 10-19, 20-49, 50-249 e 250+ restano separate: non vengono accorpate in un generico 10+."
      },
      {
        title: "Perimetro SBS",
        text: state.sizeSector === SBS_TOTAL_CODE
          ? "Il totale aggrega i settori presenti nelle statistiche strutturali d'impresa della dashboard, non i conti nazionali dell'intera economia."
          : "La selezione mostra un singolo settore SBS. Usa il totale settori imprese SBS per leggere il profilo aggregato delle classi dimensionali."
      }
    ]);
    if (!rows.length) {
      showEmpty("vaiSizeChart", config.empty);
      return;
    }
    plot("vaiSizeChart", [{
      type: "bar",
      x: rows.map(function (row) { return row.size_class; }),
      y: values,
      marker: { color: COLORS },
      customdata: rows.map(function (row) {
        var value = number(row[config.valueField]);
        return [
          config.unit === "enterprise_share" ? value : enterprisesByClass[row.size_class],
          total ? value / total * 100 : null,
          employmentByClass[row.size_class],
          gdp ? value / gdp * 100 : null
        ];
      }),
      hovertemplate: config.unit === "value_added"
        ? "%{x}<br>%{y:,.1f} mln EUR<br>%{customdata[1]:.1f}% della selezione SBS<extra></extra>"
        : (config.unit === "enterprise_share"
          ? "%{x}<br>%{y:.1f}%<br>%{customdata[0]:,.0f} imprese<extra></extra>"
          : (config.unit === "value_gdp_share"
            ? "%{x}<br>%{y:.2f}% del PIL<br>%{customdata[1]:.1f}% del valore aggiunto della selezione SBS<extra></extra>"
            : (config.unit === "value_per_employed"
              ? "%{x}<br>%{y:,.1f} mila EUR per occupato<br>%{customdata[2]:,.0f} occupati<extra></extra>"
              : (config.unit === "value_added_share"
                ? "%{x}<br>%{y:.1f}% del valore aggiunto<extra></extra>"
                : (config.unit === "value_per_enterprise"
                  ? "%{x}<br>%{y:,.1f} mila EUR per impresa<br>%{customdata[0]:,.0f} imprese<extra></extra>"
                  : "%{x}<br>%{y:,.0f} imprese<br>%{customdata[1]:.1f}% della selezione SBS<extra></extra>")))))
    }], {
      margin: { t: 18, r: 24, b: 82, l: 92 },
      yaxis: { title: config.yTitle, rangemode: "tozero" },
      xaxis: { title: "Classe di persone occupate" },
      sourceNote: CHART_SOURCE_NOTE
    });
  }

  function sortedMicroRows(rows) {
    return rows.slice().sort(function (a, b) {
      return MICRO_SIZE_ORDER.indexOf(a.size_class) - MICRO_SIZE_ORDER.indexOf(b.size_class);
    });
  }

  function microChartConfig() {
    if (state.microMeasure === "active_enterprises") {
      return {
        field: "active_enterprises",
        unit: "count",
        title: "Imprese attive sotto i 10 dipendenti",
        yTitle: "Numero di imprese",
        empty: "Imprese attive micro non disponibili per questa selezione."
      };
    }
    if (state.microMeasure === "persons_employed") {
      return {
        field: "persons_employed",
        unit: "count",
        title: "Persone occupate nelle micro-imprese",
        yTitle: "Persone occupate",
        empty: "Persone occupate micro non disponibili per questa selezione."
      };
    }
    if (state.microMeasure === "persons_employed_share") {
      return {
        field: "persons_employed",
        unit: "share",
        title: "Quota delle persone occupate nelle micro-imprese",
        yTitle: "% persone occupate",
        empty: "Quote degli occupati micro non disponibili per questa selezione."
      };
    }
    if (state.microMeasure === "employees") {
      return {
        field: "employees",
        unit: "count",
        title: "Dipendenti nelle micro-imprese",
        yTitle: "Dipendenti",
        empty: "Dipendenti micro non disponibili per questa selezione."
      };
    }
    if (state.microMeasure === "employees_share") {
      return {
        field: "employees",
        unit: "share",
        title: "Quota dei dipendenti nelle micro-imprese",
        yTitle: "% dipendenti",
        empty: "Quote dei dipendenti micro non disponibili per questa selezione."
      };
    }
    if (state.microMeasure === "employees_per_enterprise") {
      return {
        field: "employees",
        unit: "ratio",
        title: "Dipendenti per impresa attiva",
        yTitle: "Dipendenti per impresa",
        empty: "Dipendenti per impresa non disponibili per questa selezione."
      };
    }
    return {
      field: "active_enterprises",
      unit: "share",
      title: "Quota delle imprese attive sotto i 10 dipendenti",
      yTitle: "% imprese attive",
      empty: "Quote delle micro-imprese non disponibili per questa selezione."
    };
  }

  function microRowsForSelection() {
    return sortedMicroRows(records("micro_business_demography").filter(function (row) {
      return row.country_code === state.microCountry
        && row.sector_code === state.microSector
        && Number(row.year) === Number(state.microYear)
        && MICRO_SIZE_ORDER.indexOf(row.size_class) >= 0;
    }));
  }

  function renderMicroFilters() {
    var container = byId("vaiMicroFilters");
    if (!container) return;
    clear(container);
    var availableRows = records("micro_business_demography").filter(function (row) {
      return row.country_code === state.microCountry && row.sector_code === state.microSector;
    });
    state.microYear = effectiveYear(availableRows.length ? availableRows : records("micro_business_demography"), state.microYear);
    makeSelect(container, "Parametro", state.microMeasure, [
      { value: "active_enterprises_share", label: "Quota imprese attive (%)" },
      { value: "active_enterprises", label: "Imprese attive" },
      { value: "persons_employed", label: "Persone occupate" },
      { value: "persons_employed_share", label: "Quota persone occupate (%)" },
      { value: "employees", label: "Dipendenti" },
      { value: "employees_share", label: "Quota dipendenti (%)" },
      { value: "employees_per_enterprise", label: "Dipendenti per impresa" }
    ], function (value) {
      state.microMeasure = value;
      renderMicroChart();
    });
    makeSelect(container, "Paese", state.microCountry, countryOptions(false), function (value) {
      state.microCountry = value;
      renderMicroFilters();
      renderMicroChart();
    });
    makeSelect(container, "Settore", state.microSector, sectorOptions("micro_sectors", false), function (value) {
      state.microSector = value;
      renderMicroFilters();
      renderMicroChart();
    });
    makeSelect(container, "Anno", state.microYear, yearOptions(availableRows.length ? availableRows : records("micro_business_demography")), function (value) {
      state.microYear = Number(value);
      renderMicroChart();
    });
  }

  function renderMicroChart() {
    var config = microChartConfig();
    var rows = microRowsForSelection();
    var total = rows.reduce(function (sum, row) {
      return sum + (number(row[config.field]) || 0);
    }, 0);
    var values = rows.map(function (row) {
      var value = number(row[config.field]);
      if (config.unit === "share") return total ? value / total * 100 : null;
      if (config.unit === "ratio") {
        var enterprises = number(row.active_enterprises);
        return enterprises ? value / enterprises : null;
      }
      return value;
    });
    var title = byId("vaiMicroTitle");
    var tag = byId("vaiMicroTag");
    var note = byId("vaiMicroNote");
    if (title) title.textContent = rows[0] ? config.title + " - " + sectorLabel(rows[0]) : config.title;
    if (tag) tag.textContent = countryLabel(state.microCountry) + " - " + text(state.microYear);
    if (note) {
      note.textContent = "Questa vista usa Business Demography: descrive le classi 0, 1-4 e 5-9 dipendenti sotto la soglia 10. Non contiene valore aggiunto e non va confrontata come scomposizione della classe SBS 0-9.";
    }
    renderGuidance("vaiMicroGuidance", [
      {
        title: "Fonte diversa",
        text: "Il focus micro usa Eurostat Business Demography, mentre il valore aggiunto per dimensione viene dalle Structural Business Statistics. Le due fonti servono domande diverse."
      },
      {
        title: "Classe 0 dipendenti",
        text: "La classe 0 dipendenti puo avere persone occupate perche include titolari, lavoratori indipendenti o altre forme non classificate come dipendenti."
      }
    ]);
    if (!rows.length || !values.some(function (value) { return number(value) !== null; })) {
      showEmpty("vaiMicroChart", config.empty);
      return;
    }
    plot("vaiMicroChart", [{
      type: "bar",
      x: rows.map(function (row) { return row.size_class; }),
      y: values,
      marker: { color: ["#ff6b2a", "#5b8fd9", "#5fc3b2"] },
      customdata: rows.map(function (row) {
        return [
          row.active_enterprises,
          row.persons_employed,
          row.employees,
          total ? (number(row[config.field]) || 0) / total * 100 : null
        ];
      }),
      hovertemplate: config.unit === "share"
        ? "%{x}<br>%{y:.1f}%<br>Imprese: %{customdata[0]:,.0f}<br>Occupati: %{customdata[1]:,.0f}<br>Dipendenti: %{customdata[2]:,.0f}<extra></extra>"
        : (config.unit === "ratio"
          ? "%{x}<br>%{y:.2f} dipendenti per impresa<br>Imprese: %{customdata[0]:,.0f}<extra></extra>"
          : "%{x}<br>%{y:,.0f}<br>Imprese: %{customdata[0]:,.0f}<br>Occupati: %{customdata[1]:,.0f}<br>Dipendenti: %{customdata[2]:,.0f}<extra></extra>")
    }], {
      margin: { t: 18, r: 24, b: 82, l: 92 },
      yaxis: { title: config.yTitle, rangemode: "tozero" },
      xaxis: { title: "Classe di dipendenti" },
      sourceNote: CHART_SOURCE_NOTE
    });
  }

  function regionalRegionOptions(country, year) {
    var seen = {};
    records("regional_value_added").forEach(function (row) {
      if (row.country_code !== country || Number(row.year) !== Number(year)) return;
      if (!row.region_code || !row.region_name) return;
      seen[row.region_code] = row.region_name;
    });
    return Object.keys(seen).sort(function (a, b) {
      return seen[a].localeCompare(seen[b], "it");
    }).map(function (code) {
      return { value: code, label: seen[code] };
    });
  }

  function syncRegionalRegion() {
    var options = regionalRegionOptions(state.regionalCountry, state.regionalYear);
    var codes = options.map(function (option) { return option.value; });
    if (codes.indexOf(state.regionalRegion) < 0) {
      state.regionalRegion = codes[0] || null;
    }
    return options;
  }

  function renderRegionalFilters() {
    var container = byId("vaiRegionalFilters");
    if (!container) return;
    clear(container);
    makeSelect(container, "Vista", state.regionalView, [
      { value: "regions", label: "Regioni per settore" },
      { value: "sectors", label: "Settori nella regione" }
    ], function (value) {
      state.regionalView = value;
      renderRegionalFilters();
      renderRegionalChart();
    });
    makeSelect(container, "Paese", state.regionalCountry, countryOptions(false), function (value) {
      state.regionalCountry = value;
      state.regionalRegion = null;
      renderRegionalFilters();
      renderRegionalChart();
    });
    makeSelect(container, "Anno", state.regionalYear, yearOptions(records("regional_value_added")), function (value) {
      state.regionalYear = Number(value);
      state.regionalRegion = null;
      renderRegionalFilters();
      renderRegionalChart();
    });
    if (state.regionalView === "regions") {
      makeSelect(container, "Settore", state.regionalSector, sectorOptions("regional_sectors", true), function (value) {
        state.regionalSector = value;
        renderRegionalChart();
      });
    } else {
      makeSelect(container, "Regione", state.regionalRegion, syncRegionalRegion(), function (value) {
        state.regionalRegion = value;
        renderRegionalChart();
      });
      makeSelect(container, "Dettaglio", state.regionalSectorMode, [
        { value: "separate", label: "Settori regionali separati" },
        { value: "all", label: "Tutte le voci pubblicate" }
      ], function (value) {
        state.regionalSectorMode = value;
        renderRegionalChart();
      });
    }
  }

  function renderRegionalChart() {
    var rows = records("regional_value_added").filter(function (row) {
      if (row.country_code !== state.regionalCountry) return false;
      if (Number(row.year) !== Number(state.regionalYear)) return false;
      if (number(row.value_million_eur) === null) return false;
      if (state.regionalView === "regions") return row.sector_code === state.regionalSector;
      if (row.region_code !== state.regionalRegion || row.sector_code === "TOTAL") return false;
      return state.regionalSectorMode === "all" || REGIONAL_SEPARATE_CODES.indexOf(row.sector_code) >= 0;
    }).sort(function (a, b) {
      return b.value_million_eur - a.value_million_eur;
    });
    if (state.regionalView === "regions") {
      rows = rows.slice(0, 30);
    }
    rows = rows.reverse();
    var regionName = rows[0] && state.regionalView === "sectors"
      ? rows[0].region_name
      : (syncRegionalRegion().find(function (option) { return option.value === state.regionalRegion; }) || {}).label;
    byId("vaiRegionalTitle").textContent = state.regionalView === "regions"
      ? (rows[0] ? sectorLabel(rows[0]) : "Valore aggiunto regionale")
      : ("Settori nella regione - " + text(regionName, "regione"));
    byId("vaiRegionalTag").textContent = countryLabel(state.regionalCountry) + " - " + text(state.regionalYear);
    renderGuidance("vaiRegionalGuidance", [
      {
        title: state.regionalView === "regions" ? "Regioni per settore" : "Barchart regionale per settore",
        text: state.regionalView === "regions"
          ? "Il grafico mostra le regioni NUTS2 del paese selezionato per una voce settoriale. Se ci sono molte regioni, vengono visualizzate le prime 30."
          : "Il grafico mostra quali settori generano piu valore aggiunto nella regione selezionata."
      },
      {
        title: "Settori regionali",
        text: state.regionalView === "sectors" && state.regionalSectorMode === "all"
          ? "La vista tutte le voci pubblicate include anche aggregati sovrapposti: serve per esplorare la fonte, non per sommare le barre."
          : "Il dato regionale ha meno dettaglio dei conti nazionali A64 e delle divisioni SBS: e utile per la geografia, con settori piu aggregati."
      }
    ]);
    if (!rows.length) {
      showEmpty("vaiRegionalChart", "Dato regionale NUTS2 non disponibile per questa selezione.");
      return;
    }
    plot("vaiRegionalChart", [{
      type: "bar",
      orientation: "h",
      x: rows.map(function (row) { return row.value_million_eur; }),
      y: rows.map(function (row) {
        return state.regionalView === "regions" ? row.region_name : sectorLabel(row);
      }),
      marker: { color: state.regionalView === "regions" ? "#5fc3b2" : "#f0b44d" },
      hovertemplate: "%{y}<br>%{x:,.1f} mln EUR<extra></extra>"
    }], {
      margin: { t: 18, r: 24, b: 78, l: state.regionalView === "regions" ? 250 : 230 },
      xaxis: { title: "Milioni di euro" },
      yaxis: { automargin: true },
      sourceNote: CHART_SOURCE_NOTE
    });
  }

  function statusLabel(value) {
    var labels = {
      available: "Disponibile",
      available_descriptive: "Disponibile come descrizione",
      available_when_published: "Disponibile dove pubblicato",
      not_estimated: "Non stimato"
    };
    return labels[value] || value || "";
  }

  function renderCoverage() {
    var container = byId("vaiCoverage");
    if (!container) return;
    clear(container);
    toArray(state.payload && state.payload.coverage).forEach(function (item) {
      var card = document.createElement("div");
      card.className = "vai-coverage-item";
      card.innerHTML = "<span></span><strong></strong><em></em><small></small>";
      card.querySelector("span").textContent = statusLabel(item.status);
      card.querySelector("strong").textContent = item.dimension || "";
      card.querySelector("em").textContent = item.source || "";
      card.querySelector("small").textContent = item.note || "";
      container.appendChild(card);
    });
  }

  function renderMethod() {
    var notes = byId("vaiMethodNotes");
    if (!notes) return;
    clear(notes);
    [
      "Il valore aggiunto lordo e misurato a prezzi correnti in milioni di euro: confronta la dimensione economica delle attivita, non la produttivita o i margini delle imprese.",
      "Il valore aggiunto totale non coincide con il PIL ai prezzi di mercato: il PIL aggiunge le imposte sui prodotti e sottrae i contributi ai prodotti.",
      "Le serie storiche sono a prezzi correnti: variazioni nel tempo possono riflettere sia quantita prodotte sia prezzi, quindi non sono serie reali o depurate dall'inflazione.",
      "I conti nazionali Eurostat sono usati per il confronto settoriale perche coprono l'intera economia e includono agricoltura, silvicoltura, pesca e servizi.",
      "La vista per sezioni principali e la piu adatta per leggere la composizione complessiva: evita di mescolare aggregati e sottovoci dello stesso ramo NACE.",
      "Il dettaglio settoriale A64 e utile per voci specifiche, ma va letto come gerarchia: alcune righe sono sottoinsiemi di aggregati gia presenti.",
      "Alcuni fenomeni economici non coincidono con una singola branca NACE: la dashboard mostra le voci ufficiali disponibili senza costruire stime settoriali aggiuntive.",
      "Le classi dimensionali arrivano dalle statistiche strutturali d'impresa: sono classi di persone occupate nell'impresa e hanno un perimetro diverso dai conti nazionali.",
      "Le classi dimensionali non sono una scomposizione dell'intera economia nazionale: descrivono il perimetro delle statistiche strutturali d'impresa e quindi vanno confrontate soprattutto dentro lo stesso settore e la stessa fonte.",
      "Il focus sulle micro-imprese usa Business Demography e separa 0, 1-4 e 5-9 dipendenti. E una vista descrittiva su imprese e occupazione, non una stima del valore aggiunto dentro la classe SBS 0-9.",
      "Quando una vista cambia dataset, cambia anche il perimetro: conti nazionali, SBS e Business Demography non vanno sommati o confrontati come se fossero una sola tabella.",
      "I rapporti al PIL usano il PIL nominale Eurostat dello stesso paese e anno. Sono utili nei confronti tra paesi, ma non trasformano i valori in serie reali.",
      "Il valore aggiunto per dipendente usa i dipendenti dei conti nazionali per branca NACE. La mediana e calcolata tra i settori visualizzati, non dentro ogni settore.",
      "Il valore per occupato e calcolato solo nel perimetro SBS, dividendo il valore aggiunto per le persone occupate pubblicate nella stessa cella.",
      "Il dettaglio regionale usa le regioni NUTS pubblicate da Eurostat e settori piu aggregati; non tutte le combinazioni paese-settore-anno sono disponibili.",
      "Nei confronti europei puoi passare dai valori assoluti a quote sul PIL o sul valore aggiunto nazionale per ridurre l'effetto della scala del paese.",
      "L'indice base 100 confronta dinamiche relative, non livelli: due linee simili in base 100 possono corrispondere a valori assoluti molto distanti."
    ].forEach(function (note) {
      var item = document.createElement("li");
      item.textContent = note;
      notes.appendChild(item);
    });
  }

  function renderAll() {
    renderGlobalFilters();
    renderKpis();
    renderFocusCards();
    renderSeriesFilters();
    renderSeriesChart();
    renderSectorFilters();
    renderSectorChart();
    renderEuropeFilters();
    renderEuropeChart();
    renderSizeFilters();
    renderSizeChart();
    renderMicroFilters();
    renderMicroChart();
    renderRegionalFilters();
    renderRegionalChart();
    renderCoverage();
    renderMethod();
  }

  function initialize(payload) {
    state.payload = payload;
    state.recordCache = {};
    state.year = payload.meta.latest_sector_year || 2024;
    state.europeYear = state.year;
    state.sectorCountry = state.country;
    state.sectorYear = state.year;
    state.sizeYear = payload.meta.latest_enterprise_year || payload.meta.latest_size_year || state.year;
    state.microYear = payload.meta.latest_micro_year || state.sizeYear;
    state.regionalYear = payload.meta.latest_regional_year || state.year;
    var status = byId("vaiStatus");
    if (status) {
      status.textContent = "Dati caricati. Ultimo anno conti nazionali: " + text(payload.meta.latest_sector_year, "ND")
        + "; SBS occupati: " + text(payload.meta.latest_employment_year, "ND")
        + "; PIL: " + text(payload.meta.latest_gdp_year, "ND") + ".";
    }
    renderAll();
  }

  function load() {
    fetch(dataUrl(), { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(initialize)
      .catch(function (error) {
        var status = byId("vaiStatus");
        if (status) status.textContent = "Non riesco a caricare i dati: " + error.message;
        ["vaiSeriesChart", "vaiSectorChart", "vaiEuropeChart", "vaiSizeChart", "vaiMicroChart", "vaiRegionalChart"].forEach(function (id) {
          showEmpty(id, "Dati non disponibili.");
        });
      });
  }

  document.addEventListener("DOMContentLoaded", load);
  window.addEventListener("site-language-change", function () {
    if (!state.payload) return;
    renderAll();
    if (window.SiteLanguage && window.SiteLanguage.refresh) {
      window.setTimeout(function () { window.SiteLanguage.refresh(); }, 0);
    }
  });
  new MutationObserver(function () {
    if (state.payload) renderAll();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
})();
