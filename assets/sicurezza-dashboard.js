(function () {
  "use strict";

  var VERSION = "20260722-8";
  var PAYLOAD_GLOBALS = {
    metadata: "SICUREZZA_DASHBOARD_METADATA",
    reported: "SICUREZZA_REPORTED_CRIMES",
    people: "SICUREZZA_PEOPLE"
  };
  var DATA_BASES = [
    "https://data.nazarenolecis.com/sicurezza/"
  ];

  var COLORS = ["#ff5a1f", "#4f8bc9", "#3aa6a1", "#d4a348", "#d96363", "#8d7ad8", "#6ea66f", "#b36a4a"];
  var LEVEL_LABELS = { national: "Italia", regional: "Regioni", provincial: "Province", capital: "Comuni capoluogo" };
  var ROLE_LABELS = { offender: "Autori / denunciati", victim: "Vittime", unknown: "Ruolo non classificato" };
  var CITIZENSHIP_LABELS = {
    totale_cittadinanza: "Totale cittadinanza",
    immigrati_o_stranieri: "Stranieri / immigrati",
    italiani_o_non_immigrati: "Italiani / non immigrati",
    non_classificato: "Non classificato"
  };

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
    TERRORHOM: "Omicidi con finalita terroristica",
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
    INTPROP: "Violazioni della proprieta intellettuale",
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
    organized: { label: "Criminalita organizzata", codes: ["MAFIASS", "MAFIAHOM", "CRIMASS", "EXTORT", "USURY", "MONEYLAU", "ARSON"] },
    other: { label: "Altri reati", codes: ["OTHCRIM"] }
  };

  var VIOLENT_CODES = new Set(CRIME_THEMES.violent_person.codes.concat(["ROBBER", "BANKROB", "POSTROB", "SHOPROB", "STREETROB", "HOUSEROB", "EXTORT"]));
  var MEASURE_OPTIONS = [
    { value: "absolute", label: "Valori assoluti" },
    { value: "rate", label: "Tassi per 100.000" },
    { value: "index", label: "Indice primo anno = 100" },
    { value: "moving_average", label: "Media mobile triennale" },
    { value: "yoy", label: "Variazione % annua" }
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

  var STATE = {
    meta: {},
    records: [],
    year: null,
    level: "regional",
    region: "all",
    province: "all",
    territory: "all",
    theme: "all",
    crime: "TOT",
    measure: "absolute",
    role: "all",
    citizenship: "all",
    counterDirection: "all",
    compositionMode: "themes",
    compositionMetric: "share",
    comparisonYear: null,
    contributionDirection: "all",
    search: "",
    peopleLoaded: false
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

  function init() {
    [
      "siStatus", "siTopRecap", "siYear", "siLevel", "siRegion", "siProvince", "siTerritory", "siTheme", "siCrime",
      "siMeasure", "siRole", "siCitizenship", "siCounterDirection", "siSearch", "siReset", "siKpis", "siCoverage",
      "siTrendTag", "siCompositionTag", "siContributionTag", "siRankingTag", "siScatterTag",
      "siTreemapTag", "siTableTag", "siPropertyTag", "siViolentTag", "siPersonFocusTag", "siCrimeTag", "siPeopleTag",
      "siDemographyTag", "siCounterTag", "siTerritoryTable", "siCounterTable", "siPeopleNotice",
      "siMethodNotes", "siSourceList", "siPlannedSourceList", "siPropertyFocusChart", "siPersonFocusChart"
    ].forEach(function (id) {
      els[id] = document.getElementById(id);
    });

    bindControls();
    loadData();
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
    els.siSearch.addEventListener("input", function () { STATE.search = els.siSearch.value.trim().toLowerCase(); renderTables(); });
    bindChartControls();
    els.siReset.addEventListener("click", function () {
      STATE.year = latestYear();
      STATE.level = "regional";
      STATE.region = "all";
      STATE.province = "all";
      STATE.territory = "all";
      STATE.theme = "all";
      STATE.crime = "TOT";
      STATE.measure = "absolute";
      STATE.role = "all";
      STATE.citizenship = "all";
      STATE.counterDirection = "all";
      STATE.compositionMode = "themes";
      STATE.compositionMetric = "share";
      STATE.comparisonYear = null;
      STATE.contributionDirection = "all";
      STATE.search = "";
      if (els.siSearch) els.siSearch.value = "";
      renderAll();
    });
  }

  function setLevel(value) {
    STATE.level = value;
    STATE.territory = "all";
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
    renderAll();
  }

  function setProvince(value) {
    STATE.province = value;
    STATE.territory = "all";
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
        applyControlValue(control.getAttribute("data-si-control"), control.value);
      });
    });
  }

  function applyControlValue(name, value) {
    if (name === "year") STATE.year = numberOrNull(value);
    if (name === "level") {
      setLevel(value);
      return;
    }
    if (name === "region") {
      setRegion(value);
      return;
    }
    if (name === "province") {
      setProvince(value);
      return;
    }
    if (name === "territory") STATE.territory = value;
    if (name === "theme") {
      setTheme(value);
      return;
    }
    if (name === "crime") STATE.crime = value;
    if (name === "measure") STATE.measure = value;
    if (name === "role") STATE.role = value;
    if (name === "citizenship") STATE.citizenship = value;
    if (name === "counterDirection") STATE.counterDirection = value;
    if (name === "compositionMode") STATE.compositionMode = value;
    if (name === "compositionMetric") STATE.compositionMetric = value;
    if (name === "comparisonYear") STATE.comparisonYear = numberOrNull(value);
    if (name === "contributionDirection") STATE.contributionDirection = value;
    renderAll();
  }

  function loadData() {
    setStatus("Caricamento metadati e reati denunciati ...");
    Promise.all([
      loadJavascriptPayload("dashboard_metadata.js", PAYLOAD_GLOBALS.metadata),
      loadJavascriptPayload("dashboard_reported_crimes.js", PAYLOAD_GLOBALS.reported)
    ]).then(function (payloads) {
      STATE.meta = (payloads[0] && payloads[0].meta) || (payloads[1] && payloads[1].meta) || {};
      STATE.records = decodeColumnPayload(payloads[1], "reported_crimes");
      STATE.year = latestYear();
      populateStaticFilters();
      renderMetaBlocks();
      renderAll();
      setStatus("Dati reati caricati: " + formatInteger(reportedRows().length) + " righe, anni " + yearRangeLabel() + ". Profili persone in caricamento...");
      loadPeopleData();
    }).catch(function (error) {
      setStatus("Errore nel caricamento dati: " + error.message, "error");
      renderError();
    });
  }

  function loadPeopleData() {
    loadJavascriptPayload("dashboard_people.js", PAYLOAD_GLOBALS.people).then(function (payload) {
      var people = decodeColumnPayload(payload, "people");
      STATE.records = reportedRows().concat(people);
      STATE.peopleLoaded = true;
      populatePeopleFilters();
      renderCoverage();
      renderPeopleNotice();
      renderPeopleChart();
      renderDemographyChart();
      setStatus("Dati caricati: " + formatInteger(reportedRows().length) + " righe reati e " + formatInteger(peopleRows().length) + " righe persone, anni " + yearRangeLabel() + ".");
    }).catch(function () {
      STATE.peopleLoaded = false;
      renderCoverage();
      renderPeopleNotice();
      emptyChart("siPeopleChart", "Dati persone non disponibili in questo momento.");
      emptyChart("siDemographyChart", "Dati persone non disponibili in questo momento.");
      setStatus("Dati reati caricati: " + formatInteger(reportedRows().length) + " righe, anni " + yearRangeLabel() + ". Profili persone non disponibili.");
    });
  }

  function loadJavascriptPayload(fileName, globalName) {
    var index = 0;
    function tryNext() {
      if (index >= DATA_BASES.length) return Promise.reject(new Error("payload non disponibile: " + fileName));
      var url = DATA_BASES[index] + fileName + "?v=" + VERSION;
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
          reject(new Error("payload JavaScript senza dati"));
        };
        script.onerror = function () {
          script.remove();
          reject(new Error("script non disponibile"));
        };
        document.head.appendChild(script);
      }).catch(tryNext);
    }
    return tryNext();
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

  function populateStaticFilters() {
    populateControlGroup("year", years().map(optionFromValue), String(STATE.year));
    populateControlGroup("level", ["national", "regional", "provincial", "capital"].map(function (value) {
      return { value: value, label: LEVEL_LABELS[value] || value };
    }), STATE.level);
    populateControlGroup("theme", Object.keys(CRIME_THEMES).map(function (key) {
      return { value: key, label: CRIME_THEMES[key].label };
    }), STATE.theme);
    populateControlGroup("measure", MEASURE_OPTIONS, STATE.measure);
    populateControlGroup("counterDirection", COUNTER_OPTIONS, STATE.counterDirection);
    populateControlGroup("compositionMode", COMPOSITION_MODE_OPTIONS, STATE.compositionMode);
    populateControlGroup("compositionMetric", COMPOSITION_METRIC_OPTIONS, STATE.compositionMetric);
    populateControlGroup("contributionDirection", CONTRIBUTION_DIRECTION_OPTIONS, STATE.contributionDirection);
    populatePeopleFilters();
  }

  function populatePeopleFilters() {
    var people = peopleRows();
    var roles = unique(people.map(function (row) { return row.person_role; })).sort();
    var citizenship = unique(people.map(function (row) { return row.citizenship_group; })).sort();
    populateControlGroup("role", [{ value: "all", label: "Tutti" }].concat(roles.map(function (value) {
      return { value: value, label: ROLE_LABELS[value] || labelize(value) };
    })), STATE.role);
    populateControlGroup("citizenship", [{ value: "all", label: "Tutte" }].concat(citizenship.map(function (value) {
      return { value: value, label: CITIZENSHIP_LABELS[value] || labelize(value) };
    })), STATE.citizenship);
    setControlDisabled("role", roles.length === 0);
    setControlDisabled("citizenship", citizenship.length === 0);
  }

  function renderAll() {
    populateStaticFilters();
    refreshDependentFilters();
    renderTopRecap();
    renderKpis();
    renderCoverage();
    renderPeopleNotice();
    renderCharts();
    renderTables();
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
      "Anni " + escapeHtml(yearRangeLabel()) + ".",
      "Ultimo dato Italia: <strong>" + formatInteger(total) + "</strong> delitti denunciati nel " + escapeHtml(String(latest || "n.d.")) + ".",
      "Copertura: " + formatInteger(counts.regional || 0) + " regioni, " + formatInteger(counts.provincial || 0) + " province, " + formatInteger(counts.capital || 0) + " comuni capoluogo."
    ].join(" ");
  }

  function renderMethodNotes() {
    if (!els.siMethodNotes) return;
    var notes = STATE.meta.notes || [];
    if (!notes.length) {
      notes = [
        "I conteggi sono delitti denunciati, non tutti i reati effettivamente commessi.",
        "Le dimensioni persone richiedono fonti e denominatori dedicati per letture corrette."
      ];
    }
    els.siMethodNotes.innerHTML = notes.map(function (note) {
      return "<li>" + escapeHtml(note) + "</li>";
    }).join("");
  }

  function renderSources() {
    renderSourceList(els.siSourceList, STATE.meta.sources || []);
    renderSourceList(els.siPlannedSourceList, STATE.meta.planned_sources || []);
  }

  function renderSourceList(target, sources) {
    if (!target) return;
    if (!sources.length) {
      target.innerHTML = "<li>Fonti non disponibili nei metadati caricati.</li>";
      return;
    }
    target.innerHTML = sources.map(function (source) {
      return '<li><a href="' + escapeHtml(source.url || "#") + '" target="_blank" rel="noopener">' + escapeHtml(source.label || "Fonte") + '</a><span>' + escapeHtml(source.role || "") + '</span></li>';
    }).join("");
  }

  function renderPeopleNotice() {
    if (!els.siPeopleNotice) return;
    var people = peopleRows();
    if (!STATE.peopleLoaded && !people.length) {
      els.siPeopleNotice.innerHTML = "<strong>Copertura persone:</strong> caricamento in corso. I grafici principali sui reati sono gia disponibili.";
      return;
    }
    if (!people.length) {
      els.siPeopleNotice.innerHTML = "<strong>Copertura persone:</strong> non disponibile nei payload correnti.";
      return;
    }
    var levels = unique(people.map(function (row) { return row.territory_level; })).filter(Boolean);
    var scope = levels.length === 1 && levels[0] === "national" ? "Italia" : levels.map(function (level) { return LEVEL_LABELS[level] || level; }).join(", ");
    els.siPeopleNotice.innerHTML = "<strong>Copertura persone:</strong> " + escapeHtml(scope) + ". I conteggi per cittadinanza non sono tassi di delittuosita: per rispondere alla domanda immigrati/non immigrati servono denominatori coerenti per cittadinanza, eta, sesso e territorio.";
  }

  function refreshDependentFilters() {
    var regions = unique(reportedRows().map(function (row) { return row.region; })).sort(sortItalian);
    populateControlGroup("region", [{ value: "all", label: "Tutte" }].concat(regions.map(optionFromValue)), STATE.region);

    var provinceSource = reportedRows().filter(function (row) {
      return row.province && (STATE.region === "all" || row.region === STATE.region);
    });
    var provinces = unique(provinceSource.map(function (row) { return row.province; })).sort(sortItalian);
    if (STATE.province !== "all" && provinces.indexOf(STATE.province) < 0) STATE.province = "all";
    populateControlGroup("province", [{ value: "all", label: "Tutte" }].concat(provinces.map(function (value) {
      return { value: value, label: territoryShort(value) };
    })), STATE.province);

    var territoryOptions = territoryRowsForControls().map(function (row) {
      return { value: row.territory_code, label: territoryLabel(row) };
    }).sort(function (a, b) { return sortItalian(a.label, b.label); });
    if (STATE.territory !== "all" && !territoryOptions.some(function (option) { return option.value === STATE.territory; })) {
      STATE.territory = "all";
    }
    populateControlGroup("territory", [{ value: "all", label: "Tutti" }].concat(territoryOptions), STATE.territory);

    var crimeOptions = crimeOptionsForTheme();
    if (!crimeOptions.some(function (option) { return option.value === STATE.crime; })) {
      STATE.crime = STATE.theme === "all" ? "TOT" : "all";
    }
    populateControlGroup("crime", crimeOptions, STATE.crime);
    populateControlGroup("measure", MEASURE_OPTIONS, STATE.measure);
    populateControlGroup("counterDirection", COUNTER_OPTIONS, STATE.counterDirection);
    populateComparisonYearFilters();

    setControlDisabled("region", STATE.level === "national");
    setControlDisabled("province", STATE.level === "national" || STATE.level === "regional");
  }

  function populateComparisonYearFilters() {
    var options = comparisonYearOptions();
    var selected = normalizedComparisonYear();
    populateControlGroup("comparisonYear", options, selected === null ? "" : String(selected));
    setControlDisabled("comparisonYear", selected === null);
  }

  function renderKpis() {
    var cards = [
      metricCard("Delitti denunciati", "TOT", "Totale delitti registrati"),
      metricCard("Omicidi volontari", "INTENHOM", "Eventi rari: leggere anche serie pluriennale"),
      metricCard("Furti in abitazione", "BURGTHEF", "Indicatore patrimoniale"),
      metricCard("Borseggi", "PICKTHEF", "Reati predatori nello spazio pubblico"),
      metricCard("Rapine", "ROBBER", "Rapine totali"),
      metricCard("Truffe digitali", "SWINCYB", "Truffe e frodi informatiche")
    ];
    els.siKpis.innerHTML = cards.join("");
  }

  function metricCard(title, code, note) {
    var current = aggregateSelectionForCrime(code, STATE.year);
    var previous = aggregateSelectionForCrime(code, previousYear());
    var change = percentChange(current, previous);
    return [
      '<article class="si-kpi">',
      "<span>" + escapeHtml(title) + "</span>",
      "<strong>" + formatInteger(current) + "</strong>",
      "<small>" + escapeHtml(note) + " - " + changeText(change) + "</small>",
      "</article>"
    ].join("");
  }

  function renderCoverage() {
    els.siCoverage.innerHTML = [
      coverageItem("Denunce registrate", "Serie per anno, reato e territorio fino ai comuni capoluogo."),
      coverageItem("Benchmark Italia", "Il confronto nazionale resta disponibile nelle serie principali quando scegli un territorio."),
      coverageItem("Tassi per 100.000", "Usali per confrontare territori; i valori assoluti descrivono il volume registrato."),
      coverageItem("Autori e vittime", "Sono conteggi di persone registrate nelle fonti disponibili, non tassi di propensione."),
      coverageItem("Cittadinanza", "Italiani e stranieri vanno confrontati solo con denominatori coerenti per eta, sesso e territorio."),
      coverageItem("Percezione e vittimizzazione", "Sono fenomeni diversi dalle denunce e vanno letti con fonti campionarie dedicate.")
    ].join("");
  }

  function renderCharts() {
    renderTrendChart();
    renderCompositionChart();
    renderContributionChart();
    renderRankingChart();
    renderScatterChart();
    renderTreemapChart();
    renderPropertyFocusChart();
    renderViolentChart();
    renderPersonFocusChart();
    renderCrimeChart();
    renderPeopleChart();
    renderDemographyChart();
    renderCounterChart();
  }

  function renderTrendChart() {
    var series = trendSeries();
    els.siTrendTag.textContent = measureLabel();
    if (!series.length) return emptyChart("siTrendChart", "Nessuna serie nel perimetro selezionato.");
    plot("siTrendChart", series.map(function (serie, index) {
      return {
        type: "scatter",
        mode: "lines+markers",
        name: serie.name,
        x: serie.points.map(function (point) { return yearLabel(point.year); }),
        y: transformSeriesValues(serie.points).map(function (point) { return point.value; }),
        line: { color: COLORS[index % COLORS.length], width: 3 },
        marker: { size: 7 },
        hovertemplate: "<b>%{fullData.name}</b><br>Anno: %{x}<br>" + measureLabel() + ": %{y:,.2f}<extra></extra>"
      };
    }), { yTitle: measureLabel(), legend: true, yearAxis: true });
  }

  function renderCompositionChart() {
    var rows = selectedTerritoryRows(STATE.year).filter(function (row) {
      return row.indicator_group === "reported_crimes" && row.crime_code !== "TOT";
    });
    if (STATE.compositionMode === "crimes" && STATE.theme !== "all") {
      rows = rows.filter(function (row) { return row._theme === STATE.theme; });
    }
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
    els.siCompositionTag.textContent = String(STATE.year) + " - " + (STATE.compositionMode === "crimes" ? "reati" : "categorie");
    if (!data.length) return emptyChart("siCompositionChart", "Nessun dettaglio per composizione.");
    plot("siCompositionChart", [{
      type: "bar",
      orientation: "h",
      x: data.map(function (row) { return row.value; }),
      y: data.map(function (row) { return row.key; }),
      customdata: data.map(function (row) { return [formatInteger(row.rawValue), formatPercent(row.share)]; }),
      marker: { color: data.map(function (_, index) { return COLORS[index % COLORS.length]; }) },
      hovertemplate: "%{y}<br>Valore: %{customdata[0]}<br>Quota: %{customdata[1]}<extra></extra>"
    }], {
      yTitle: "",
      xTitle: STATE.compositionMetric === "share" ? "% del totale selezionato" : "Delitti denunciati",
      marginLeft: STATE.compositionMode === "crimes" ? 220 : 170
    });
  }

  function renderContributionChart() {
    var comparison = normalizedComparisonYear();
    if (comparison === null) {
      els.siContributionTag.textContent = "confronto non disponibile";
      return emptyChart("siContributionChart", "Scegli un anno finale successivo al primo anno disponibile.");
    }
    var currentRows = selectedTerritoryRows(STATE.year).filter(nonTotalReported);
    var prevRows = selectedTerritoryRows(comparison).filter(nonTotalReported);
    var current = aggregateBy(currentRows, function (row) { return themeLabel(row._theme); });
    var previous = mapByKey(aggregateBy(prevRows, function (row) { return themeLabel(row._theme); }));
    var data = current.map(function (row) {
      var base = (previous[row.key] || {}).value || 0;
      return { key: row.key, value: row.value - base, current: row.value, base: base };
    }).filter(function (row) {
      if (STATE.contributionDirection === "increase") return row.value > 0;
      if (STATE.contributionDirection === "decrease") return row.value < 0;
      return row.value !== 0;
    }).sort(function (a, b) { return Math.abs(b.value) - Math.abs(a.value); }).slice(0, 12).reverse();
    els.siContributionTag.textContent = comparison + "-" + STATE.year + " - " + contributionDirectionLabel();
    if (!data.length) return emptyChart("siContributionChart", "Nessuna variazione calcolabile.");
    plot("siContributionChart", [{
      type: "bar",
      orientation: "h",
      x: data.map(function (row) { return row.value; }),
      y: data.map(function (row) { return row.key; }),
      customdata: data.map(function (row) { return [formatInteger(row.base), formatInteger(row.current)]; }),
      marker: { color: data.map(function (row) { return row.value >= 0 ? "#d96363" : "#5e9f65"; }) },
      hovertemplate: "%{y}<br>Anno confronto: %{customdata[0]}<br>Anno finale: %{customdata[1]}<br>Variazione: %{x:,.0f}<extra></extra>"
    }], { xTitle: "Variazione assoluta " + comparison + "-" + STATE.year, marginLeft: 190 });
  }

  function renderRankingChart() {
    var rows = territoryMetricRows().sort(descMetric).slice(0, 25).reverse();
    els.siRankingTag.textContent = LEVEL_LABELS[STATE.level] + " - " + metricScopeLabel();
    if (!rows.length) return emptyChart("siRankingChart", "Nessun territorio nel perimetro selezionato.");
    plot("siRankingChart", [{
      type: "bar",
      orientation: "h",
      x: rows.map(metricValueForRow),
      y: rows.map(function (row) { return territoryLabel(row); }),
      marker: { color: rows.map(function (_, index) { return COLORS[index % COLORS.length]; }) },
      hovertemplate: "%{y}<br>" + measureLabel() + ": %{x:,.2f}<extra></extra>"
    }], { xTitle: measureLabel(), marginLeft: 170 });
  }

  function renderScatterChart() {
    var rows = territoryMetricRows().filter(function (row) { return isFiniteNumber(row.change_pct_yoy); });
    els.siScatterTag.textContent = "valore vs variazione";
    if (!rows.length) return emptyChart("siScatterChart", "Servono almeno due anni per calcolare la variazione.");
    plot("siScatterChart", [{
      type: "scatter",
      mode: "markers",
      x: rows.map(function (row) { return row.value; }),
      y: rows.map(function (row) { return row.change_pct_yoy; }),
      text: rows.map(territoryLabel),
      marker: {
        size: rows.map(function (row) { return Math.max(7, Math.min(24, Math.sqrt(Math.max(row.value, 0)) / 20)); }),
        color: rows.map(function (row) { return row.change_pct_yoy >= 0 ? "#d96363" : "#5e9f65"; }),
        opacity: .78
      },
      hovertemplate: "<b>%{text}</b><br>Valore: %{x:,.0f}<br>Var. annua: %{y:.1f}%<extra></extra>"
    }], { xTitle: "Delitti denunciati", yTitle: "Variazione % annua" });
  }

  function renderTreemapChart() {
    var rows = territoryMetricRows()
      .filter(function (row) { return row.territory_level !== "national"; })
      .sort(descMetric)
      .slice(0, 25)
      .reverse();
    els.siTreemapTag.textContent = LEVEL_LABELS[STATE.level] + " - " + String(STATE.year);
    if (!rows.length) return emptyChart("siTreemapChart", "Seleziona un livello territoriale locale per vedere la distribuzione.");
    plot("siTreemapChart", [{
      type: "bar",
      orientation: "h",
      x: rows.map(metricValueForRow),
      y: rows.map(territoryLabel),
      marker: { color: rows.map(function (row) { return row.change_pct_yoy >= 0 ? "#d96363" : "#5e9f65"; }) },
      customdata: rows.map(function (row) { return [metricScopeLabel(), formatPercent(row.change_pct_yoy), territoryContext(row)]; }),
      hovertemplate: "<b>%{y}</b><br>" + measureLabel() + ": %{x:,.2f}<br>Reato/categoria: %{customdata[0]}<br>Var. annua: %{customdata[1]}<br>%{customdata[2]}<extra></extra>"
    }], { xTitle: measureLabel(), marginLeft: 180 });
  }

  function renderPropertyFocusChart() {
    renderThemeFocusChart(
      "siPropertyFocusChart",
      els.siPropertyTag,
      ["property", "predatory"],
      "Principali reati patrimoniali"
    );
  }

  function renderPersonFocusChart() {
    renderThemeFocusChart(
      "siPersonFocusChart",
      els.siPersonFocusTag,
      ["violent_person"],
      "Principali reati contro la persona"
    );
  }

  function renderThemeFocusChart(chartId, tagEl, themeKeys, emptyLabel) {
    var rows = selectedTerritoryRows(null).filter(function (row) {
      return row.indicator_group === "reported_crimes" && row.crime_code !== "TOT" && themeKeys.indexOf(row._theme) >= 0;
    });
    if (tagEl) tagEl.textContent = territoryScopeLabel();
    if (!rows.length) return emptyChart(chartId, "Nessun dato disponibile per " + emptyLabel.toLowerCase() + " nel perimetro selezionato.");
    var topCodes = aggregateBy(rows.filter(function (row) { return row.year === STATE.year; }), function (row) {
      return row.crime_code;
    }).sort(descValue).slice(0, 6).map(function (row) { return row.key; });
    if (!topCodes.length) return emptyChart(chartId, "Nessun reato selezionabile per questo focus.");
    plot(chartId, topCodes.map(function (code, index) {
      var points = years().map(function (year) {
        return {
          year: year,
          value: sum(rows.filter(function (row) { return row.year === year && row.crime_code === code; }), function (row) { return valueForMeasureBase(row); })
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
        hovertemplate: "<b>%{fullData.name}</b><br>Anno: %{x}<br>" + measureLabel() + ": %{y:,.2f}<extra></extra>"
      };
    }), { yTitle: measureLabel(), legend: true, yearAxis: true });
  }

  function renderViolentChart() {
    var rows = selectedTerritoryRows(null).filter(nonTotalReported);
    var yearsList = years();
    var violent = yearsList.map(function (year) {
      return sum(rows.filter(function (row) { return row.year === year && row._violent; }), function (row) { return row.value; });
    });
    var other = yearsList.map(function (year) {
      return sum(rows.filter(function (row) { return row.year === year && !row._violent; }), function (row) { return row.value; });
    });
    els.siViolentTag.textContent = territoryScopeLabel();
    if (!rows.length) return emptyChart("siViolentChart", "Nessun dato per classificazione violenti/altri.");
    plot("siViolentChart", [
      { type: "bar", name: "Reati violenti", x: yearsList.map(yearLabel), y: violent, marker: { color: "#d96363" } },
      { type: "bar", name: "Altri reati", x: yearsList.map(yearLabel), y: other, marker: { color: "#4f8bc9" } }
    ], { barmode: "stack", yTitle: "Delitti denunciati", legend: true, yearAxis: true });
  }

  function renderCrimeChart() {
    var selected = STATE.crime === "all" ? topCrimeCodeForSelection() : STATE.crime;
    var rows = selectedTerritoryRows(null).filter(function (row) {
      return row.indicator_group === "reported_crimes" && row.crime_code === selected;
    }).sort(sortYear);
    els.siCrimeTag.textContent = crimeLabel({ crime_code: selected });
    if (!rows.length) return emptyChart("siCrimeChart", "Seleziona un reato specifico per vedere la scheda.");
    plot("siCrimeChart", [{
      type: "scatter",
      mode: "lines+markers",
      x: rows.map(function (row) { return yearLabel(row.year); }),
      y: rows.map(function (row) { return row.value; }),
      fill: "tozeroy",
      line: { color: "#ff5a1f", width: 3 },
      marker: { size: 8 },
      hovertemplate: "Anno: %{x}<br>Valore: %{y:,.0f}<extra></extra>"
    }], { yTitle: "Delitti denunciati", yearAxis: true });
  }

  function renderPeopleChart() {
    var rows = peopleSelectionRows();
    els.siPeopleTag.textContent = rows.length ? peopleBreakdownLabel() : "da integrare";
    if (!rows.length) return emptyChart("siPeopleChart", "I dati autori/vittime non sono ancora presenti nel payload selezionato.");
    var grouped = aggregateBy(rows, function (row) {
      return peopleBreakdownKey(row);
    }).sort(descValue).slice(0, 24).reverse();
    plot("siPeopleChart", [{
      type: "bar",
      orientation: "h",
      x: grouped.map(function (row) { return row.value; }),
      y: grouped.map(function (row) { return row.key; }),
      marker: { color: grouped.map(function (row, index) { return COLORS[index % COLORS.length]; }) },
      hovertemplate: "%{y}<br>Valore: %{x:,.0f}<extra></extra>"
    }], { xTitle: "Persone registrate", marginLeft: 260 });
  }

  function renderDemographyChart() {
    var rows = peopleSelectionRows().filter(function (row) { return row.age_group || row.sex; });
    els.siDemographyTag.textContent = rows.length ? "sesso ed eta" : "da integrare";
    if (!rows.length) return emptyChart("siDemographyChart", "Sesso ed eta non sono disponibili per il perimetro selezionato.");
    var grouped = aggregateBy(rows, function (row) {
      return sexLabel(row.sex) + " - " + ageLabel(row.age_group);
    }).sort(descValue).slice(0, 20).reverse();
    plot("siDemographyChart", [{
      type: "bar",
      orientation: "h",
      x: grouped.map(function (row) { return row.value; }),
      y: grouped.map(function (row) { return row.key; }),
      marker: { color: "#d4a348" },
      hovertemplate: "%{y}<br>Valore: %{x:,.0f}<extra></extra>"
    }], { xTitle: "Persone", marginLeft: 170 });
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
    if (STATE.role === "all") parts.push(ROLE_LABELS[row.person_role] || labelize(row.person_role || "ruolo n.d."));
    if (STATE.citizenship === "all") parts.push(CITIZENSHIP_LABELS[row.citizenship_group] || labelize(row.citizenship_group || "cittadinanza n.d."));
    return parts.filter(Boolean).join(" - ");
  }

  function peopleBreakdownLabel() {
    if (STATE.crime === "TOT" && STATE.theme === "all") return "categorie di reato";
    if (STATE.crime === "all") return CRIME_THEMES[STATE.theme].label;
    return crimeLabel({ crime_code: STATE.crime });
  }

  function renderCounterChart() {
    var rows = counterRows().sort(function (a, b) {
      return Math.abs(b.change_pct_yoy || 0) - Math.abs(a.change_pct_yoy || 0);
    }).slice(0, 20).reverse();
    els.siCounterTag.textContent = STATE.year + " - " + counterDirectionLabel();
    if (!rows.length) {
      emptyChart("siCounterChart", "Nessuna controtendenza nel perimetro selezionato.");
      els.siCounterTable.innerHTML = emptyMessage("Nessuna controtendenza nel perimetro selezionato.");
      return;
    }
    plot("siCounterChart", [{
      type: "bar",
      orientation: "h",
      x: rows.map(function (row) { return row.change_pct_yoy; }),
      y: rows.map(function (row) { return territoryLabel(row) + " - " + crimeLabel(row); }),
      marker: { color: rows.map(function (row) { return row.change_pct_yoy >= 0 ? "#d96363" : "#5e9f65"; }) },
      hovertemplate: "%{y}<br>Territorio: %{x:.1f}%<extra></extra>"
    }], { xTitle: "Variazione % annua", marginLeft: 220 });
  }

  function renderTables() {
    renderTerritoryTable();
    renderCounterTable();
  }

  function renderTerritoryTable() {
    var rows = territoryMetricRows().filter(matchesSearch).sort(descMetric).slice(0, 80);
    els.siTableTag.textContent = formatInteger(rows.length) + " righe";
    if (!rows.length) {
      els.siTerritoryTable.innerHTML = emptyMessage("Nessun territorio nel perimetro selezionato.");
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
      els.siCounterTable.innerHTML = emptyMessage("Nessuna controtendenza nel perimetro selezionato.");
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
        crimeLabel(row) + codeLine(row.crime_code),
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
        return { year: year, value: sum(rows, function (row) { return valueForMeasureBase(row); }), raw: rows };
      });
      return { name: entity.label, points: points };
    }).filter(function (serie) {
      return serie.points.some(function (point) { return isFiniteNumber(point.value) && point.value !== 0; });
    });
  }

  function selectedSeriesEntities(base) {
    var entities = [{ level: "national", code: "IT", label: "Italia" }];
    if (STATE.territory !== "all") {
      var selected = base.find(function (row) {
        return row.territory_level === STATE.level && row.territory_code === STATE.territory;
      });
      if (selected && selected.territory_code !== "IT") {
        entities.push({ level: selected.territory_level, code: selected.territory_code, label: territoryLabel(selected) });
      }
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
        if (STATE.citizenship !== "all") return row.citizenship_group === STATE.citizenship;
        return !hasDetailedCitizenship() || row.citizenship_group !== "totale_cittadinanza";
      });
    var local = base.filter(peopleAreaFilter).filter(peopleCrimeFilter);
    if (local.length) return local;
    var national = base.filter(function (row) { return row.territory_level === "national"; }).filter(peopleCrimeFilter);
    if (national.length) return national;
    return base.filter(function (row) { return row.territory_level === "national"; });
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
    if (STATE.counterDirection === "worse") return "peggiora mentre Italia migliora";
    if (STATE.counterDirection === "better") return "migliora mentre Italia peggiora";
    return "tutte le controtendenze";
  }

  function aggregateSelectionForCrime(code, year) {
    if (!year) return null;
    return sum(selectedTerritoryRows(year).filter(function (row) { return row.crime_code === code; }), function (row) { return row.value; });
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

  function peopleCrimeFilter(row) {
    if (STATE.crime !== "all" && STATE.crime !== "TOT") return row.crime_code === STATE.crime;
    if (STATE.theme !== "all") return row.crime_code !== "TOT" && row._theme === STATE.theme;
    return row.crime_code !== "TOT";
  }

  function nonTotalReported(row) {
    return row.indicator_group === "reported_crimes" && row.crime_code !== "TOT";
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
    return STATE.records.filter(function (row) { return row.indicator_group === "reported_crimes"; });
  }

  function peopleRows() {
    return STATE.records.filter(function (row) { return row.indicator_group === "people"; });
  }

  function hasDetailedCitizenship() {
    return peopleRows().some(function (row) {
      return row.citizenship_group === "immigrati_o_stranieri" || row.citizenship_group === "italiani_o_non_immigrati";
    });
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
      return [{ value: "all", label: "Tutti i reati della categoria" }].concat(codes.sort(sortCrimeLabel).map(crimeOption));
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
    if (STATE.measure === "rate") return isFiniteNumber(row.value_rate_per_100k) ? row.value_rate_per_100k : null;
    return row.value;
  }

  function metricValueForRow(row) {
    if (STATE.measure === "rate" && isFiniteNumber(row.value_rate_per_100k)) return row.value_rate_per_100k;
    if (STATE.measure === "yoy") return row.change_pct_yoy;
    return row.value;
  }

  function aggregateRows(rows, keys, makeBase) {
    var buckets = {};
    rows.forEach(function (row) {
      var key = keys.map(function (column) { return row[column] || ""; }).join("||");
      if (!buckets[key]) buckets[key] = makeBase(row);
      buckets[key].value += row.value || 0;
    });
    return Object.keys(buckets).map(function (key) { return buckets[key]; });
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

  function plot(id, traces, options) {
    var el = document.getElementById(id);
    if (!el) return;
    if (!window.Plotly) {
      el.innerHTML = '<div class="si-chart-empty">Libreria grafici non caricata.</div>';
      return;
    }
    el.innerHTML = "";
    var theme = currentTheme();
    var layout = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: cssVar("--text", theme === "light" ? "#17120f" : "#f5f2ed"), family: "system-ui, -apple-system, Segoe UI, sans-serif" },
      margin: { t: 24, r: 18, b: 56, l: (options && options.marginLeft) || 64 },
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
    if (options && options.yearAxis) {
      var axisYears = years().map(yearLabel);
      layout.xaxis.type = "category";
      layout.xaxis.tickmode = "array";
      layout.xaxis.tickvals = axisYears;
      layout.xaxis.ticktext = axisYears;
      layout.xaxis.categoryorder = "array";
      layout.xaxis.categoryarray = axisYears;
    }
    el.innerHTML = "";
    Plotly.newPlot(el, traces, layout, { responsive: true, displayModeBar: false });
  }

  function emptyChart(id, message) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = '<div class="si-chart-empty">' + escapeHtml(message) + "</div>";
  }

  function renderError() {
    ["siTrendChart", "siCompositionChart", "siContributionChart", "siRankingChart", "siScatterChart", "siTreemapChart", "siPropertyFocusChart", "siViolentChart", "siPersonFocusChart", "siCrimeChart", "siPeopleChart", "siDemographyChart", "siCounterChart"].forEach(function (id) {
      emptyChart(id, "Dati non caricati.");
    });
  }

  function table(headers, rows) {
    return '<table class="si-table"><thead><tr>' + headers.map(function (header) {
      return '<th class="' + (header[1] === "right" ? "si-number" : "si-name") + '">' + escapeHtml(header[0]) + "</th>";
    }).join("") + "</tr></thead><tbody>" + rows.map(function (row) {
      return "<tr>" + row.map(function (cell, index) {
        return '<td class="' + (headers[index][1] === "right" ? "si-number" : "si-name") + '">' + cell + "</td>";
      }).join("") + "</tr>";
    }).join("") + "</tbody></table>";
  }

  function coverageItem(label, note) {
    return '<article class="si-coverage-item"><strong>' + escapeHtml(label) + "</strong><span>" + escapeHtml(note) + "</span></article>";
  }

  function populateSelect(select, options, value) {
    if (!select) return;
    select.innerHTML = options.map(function (option) {
      return '<option value="' + escapeHtml(String(option.value)) + '">' + escapeHtml(String(option.label)) + "</option>";
    }).join("");
    select.value = options.some(function (option) { return String(option.value) === String(value); }) ? String(value) : (options[0] ? String(options[0].value) : "");
  }

  function populateControlGroup(name, options, value) {
    controlsFor(name).forEach(function (select) {
      populateSelect(select, options, value);
    });
  }

  function setControlDisabled(name, disabled) {
    controlsFor(name).forEach(function (select) {
      select.disabled = disabled;
    });
  }

  function controlsFor(name) {
    var controls = Array.prototype.slice.call(document.querySelectorAll('[data-si-control="' + name + '"]'));
    var mainId = MAIN_CONTROL_BY_NAME[name];
    if (mainId && els[mainId]) controls.unshift(els[mainId]);
    return controls.filter(Boolean);
  }

  function onChange(el, fn) {
    if (el) el.addEventListener("change", fn);
  }

  function years() {
    return unique(STATE.records.map(function (row) { return row.year; })).filter(isFiniteNumber).sort(function (a, b) { return a - b; });
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
    return STATE.theme === "all" ? "Totale reati denunciati" : CRIME_THEMES[STATE.theme].label;
  }

  function metricScopeLabelForRow(row) {
    if (STATE.crime !== "all") return crimeLabel(row) + codeLine(row.crime_code);
    if (STATE.theme !== "all") return themeLabel(row._theme);
    return crimeLabel(row);
  }

  function territoryScopeLabel() {
    if (STATE.territory === "all") return LEVEL_LABELS[STATE.level] || STATE.level;
    var row = reportedRows().find(function (item) { return item.territory_code === STATE.territory && item.territory_level === STATE.level; });
    return territoryLabel(row);
  }

  function measureLabel() {
    if (STATE.measure === "rate") return "Tasso per 100.000";
    if (STATE.measure === "index") return "Indice";
    if (STATE.measure === "moving_average") return "Media mobile triennale";
    if (STATE.measure === "yoy") return "Variazione % annua";
    return "Delitti denunciati";
  }

  function contributionDirectionLabel() {
    if (STATE.contributionDirection === "increase") return "solo aumenti";
    if (STATE.contributionDirection === "decrease") return "solo diminuzioni";
    return "aumenti e diminuzioni";
  }

  function crimeOption(code) {
    return { value: code, label: crimeLabel({ crime_code: code }) };
  }

  function crimeLabel(row) {
    var code = crimeCode(row);
    if (CRIME_LABELS[code]) return CRIME_LABELS[code];
    var raw = row && (row.crime_name || row.indicator_name);
    if (raw && String(raw).indexOf("REATI_PS__") !== 0) return labelize(raw);
    return code || "n.d.";
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
    return (CRIME_THEMES[key] || CRIME_THEMES.other).label;
  }

  function territoryLabel(row) {
    if (!row) return "n.d.";
    if (row.territory_level === "national") return "Italia";
    if (row.territory_level === "regional") return row.region || row.territory_name || row.territory_code || "n.d.";
    if (row.territory_level === "provincial") return territoryShort(row.province || row.territory_code);
    if (row.territory_level === "capital") return "Capoluogo " + territoryShort(row.capital || row.territory_code);
    return row.territory_name || row.territory_code || "n.d.";
  }

  function territoryShort(value) {
    value = String(value || "");
    if (/^IT[A-Z0-9]{3}$/.test(value)) return value;
    if (/^\d+$/.test(value)) return value.padStart(3, "0");
    return value;
  }

  function territoryContext(row) {
    if (!row) return "";
    return [row.region, row.province && row.territory_level === "capital" ? "Provincia " + row.province : "", row.territory_code].filter(Boolean).join(" - ");
  }

  function sexLabel(value) {
    value = String(value || "n.d.").toUpperCase();
    if (value === "1" || value === "M") return "Uomini";
    if (value === "2" || value === "F") return "Donne";
    if (value === "9" || value === "T") return "Totale";
    return labelize(value);
  }

  function ageLabel(value) {
    value = String(value || "eta n.d.");
    return value.replace(/^Y_/, "").replace(/_/g, " ");
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
    if (!isFiniteNumber(value)) return "n.d.";
    return Math.round(value).toLocaleString("it-IT");
  }

  function formatNumber(value) {
    if (!isFiniteNumber(value)) return "n.d.";
    return Number(value).toLocaleString("it-IT", { maximumFractionDigits: 1 });
  }

  function formatPercent(value) {
    if (!isFiniteNumber(value)) return "n.d.";
    return Number(value).toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
  }

  function changeText(value) {
    return "var. annua " + formatPercent(value);
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
    return Number.isFinite(Number(value));
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
    return String(a || "").localeCompare(String(b || ""), "it");
  }

  function labelize(value) {
    return String(value || "n.d.").replace(/^REATI_PS__/, "").replace(/_N1$/, "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, function (letter) {
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
    els.siStatus.textContent = message;
    if (state) els.siStatus.dataset.state = state;
    else delete els.siStatus.dataset.state;
  }

  function emptyMessage(message) {
    return '<p class="si-empty">' + escapeHtml(message) + "</p>";
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
