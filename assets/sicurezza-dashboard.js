(function () {
  "use strict";

  var VERSION = "20260722-4";
  var PAYLOAD_GLOBAL = "SICUREZZA_DASHBOARD_PAYLOAD";
  var DATA_BASES = [
    "https://data.nazarenolecis.com/sicurezza/"
  ];

  var COLORS = ["#ff5a1f", "#4f8bc9", "#3aa6a1", "#d4a348", "#d96363", "#8d7ad8", "#6ea66f", "#b36a4a"];
  var LEVEL_LABELS = { national: "Italia", regional: "Regioni", provincial: "Province", capital: "Capoluoghi" };
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
    INTENHOM: "Omicidi volontari",
    ATTEMPHOM: "Tentati omicidi",
    MAFIAHOM: "Omicidi di tipo mafioso",
    ROADHOM: "Omicidi stradali",
    INFANTHOM: "Infanticidi",
    RAPE: "Violenze sessuali",
    RAPEUN18: "Violenze sessuali su minori",
    KIDNAPP: "Sequestri di persona",
    EXTORT: "Estorsioni",
    DRUG: "Stupefacenti",
    CYBERCRIM: "Delitti informatici",
    SWINCYB: "Truffe e frodi informatiche",
    MONEYLAU: "Riciclaggio",
    USURY: "Usura",
    DAMAGE: "Danneggiamenti",
    ARSON: "Incendi",
    MENACE: "Minacce",
    BLOWS: "Percosse",
    PROSTI: "Prostituzione",
    PORNO: "Pornografia",
    COUNTER: "Contraffazione",
    SMUGGL: "Contrabbando",
    RECEIV: "Ricettazione",
    CRIMASS: "Associazione per delinquere",
    MAFIASS: "Associazione mafiosa",
    OTHCRIM: "Altri reati"
  };

  var CRIME_THEMES = {
    all: { label: "Tutte le categorie", codes: [] },
    violent_person: {
      label: "Violenza contro la persona",
      codes: ["INTENHOM", "ATTEMPHOM", "MAFIAHOM", "INFANTHOM", "ROADHOM", "TERRORHOM", "UNINTHOM", "RAPE", "RAPEUN18", "BLOWS", "MENACE", "KIDNAPP", "ATTACK"]
    },
    property: {
      label: "Patrimonio",
      codes: ["THEFT", "BURGTHEF", "SHOPTHEF", "CARTHEF", "MOPETHEF", "MOTORTHEF", "TRUCKTHEF", "VEHITHEF", "DAMAGE", "RECEIV", "ARSON"]
    },
    predatory: {
      label: "Reati predatori",
      codes: ["BAGTHEF", "PICKTHEF", "ROBBER", "BANKROB", "POSTROB", "SHOPROB", "STREETROB", "HOUSEROB", "CARTHEF", "BURGTHEF"]
    },
    economic_digital: {
      label: "Economici e digitali",
      codes: ["SWINCYB", "CYBERCRIM", "MONEYLAU", "USURY", "COUNTER", "SMUGGL", "CORRUPUN18", "INTPROP"]
    },
    drugs: { label: "Stupefacenti", codes: ["DRUG"] },
    organized: { label: "Criminalita organizzata", codes: ["MAFIASS", "MAFIAHOM", "CRIMASS", "EXTORT", "USURY", "MONEYLAU", "ARSON"] },
    other: { label: "Altri reati", codes: ["OTHCRIM"] }
  };

  var VIOLENT_CODES = new Set(CRIME_THEMES.violent_person.codes.concat(["ROBBER", "BANKROB", "POSTROB", "SHOPROB", "STREETROB", "HOUSEROB", "EXTORT"]));

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
    search: ""
  };

  var els = {};

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("resize", debounce(renderCharts, 180));
  window.addEventListener("themechange", renderCharts);

  function init() {
    [
      "siStatus", "siYear", "siLevel", "siRegion", "siProvince", "siTerritory", "siTheme", "siCrime",
      "siMeasure", "siRole", "siCitizenship", "siSearch", "siReset", "siKpis", "siCoverage",
      "siTrendTag", "siCompositionTag", "siContributionTag", "siRankingTag", "siScatterTag",
      "siTreemapTag", "siTableTag", "siViolentTag", "siCrimeTag", "siPeopleTag",
      "siDemographyTag", "siCounterTag", "siTerritoryTable", "siCounterTable"
    ].forEach(function (id) {
      els[id] = document.getElementById(id);
    });

    bindControls();
    loadData();
  }

  function bindControls() {
    onChange(els.siYear, function () { STATE.year = numberOrNull(els.siYear.value); renderAll(); });
    onChange(els.siLevel, function () {
      STATE.level = els.siLevel.value;
      STATE.territory = "all";
      if (STATE.level === "national") {
        STATE.region = "all";
        STATE.province = "all";
      }
      if (STATE.level === "regional") STATE.province = "all";
      renderAll();
    });
    onChange(els.siRegion, function () { STATE.region = els.siRegion.value; STATE.province = "all"; STATE.territory = "all"; renderAll(); });
    onChange(els.siProvince, function () { STATE.province = els.siProvince.value; STATE.territory = "all"; renderAll(); });
    onChange(els.siTerritory, function () { STATE.territory = els.siTerritory.value; renderAll(); });
    onChange(els.siTheme, function () {
      STATE.theme = els.siTheme.value;
      STATE.crime = STATE.theme === "all" ? "TOT" : "all";
      renderAll();
    });
    onChange(els.siCrime, function () { STATE.crime = els.siCrime.value; renderAll(); });
    onChange(els.siMeasure, function () { STATE.measure = els.siMeasure.value; renderAll(); });
    onChange(els.siRole, function () { STATE.role = els.siRole.value; renderAll(); });
    onChange(els.siCitizenship, function () { STATE.citizenship = els.siCitizenship.value; renderAll(); });
    els.siSearch.addEventListener("input", function () { STATE.search = els.siSearch.value.trim().toLowerCase(); renderTables(); });
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
      STATE.search = "";
      renderAll();
    });
  }

  function loadData() {
    setStatus("Caricamento payload dashboard ...");
    loadPayload().then(function (payload) {
      STATE.meta = payload.meta || {};
      STATE.records = (payload.records || []).map(normalizeRecord);
      STATE.year = latestYear();
      populateStaticFilters();
      renderAll();
      setStatus("Dati caricati: " + formatInteger(STATE.records.length) + " righe, anni " + yearRangeLabel() + ".");
    }).catch(function (error) {
      setStatus("Errore nel caricamento dati: " + error.message, "error");
      renderError();
    });
  }

  function loadPayload() {
    return loadJavascriptPayload("dashboard_payload.js");
  }

  function loadJavascriptPayload(fileName) {
    var index = 0;
    function tryNext() {
      if (index >= DATA_BASES.length) return Promise.reject(new Error("payload non disponibile: " + fileName));
      var url = DATA_BASES[index] + fileName + "?v=" + VERSION;
      index += 1;
      window[PAYLOAD_GLOBAL] = null;
      return new Promise(function (resolve, reject) {
        var script = document.createElement("script");
        script.async = true;
        script.src = url;
        script.onload = function () {
          script.remove();
          if (window[PAYLOAD_GLOBAL] && window[PAYLOAD_GLOBAL].records) {
            resolve(window[PAYLOAD_GLOBAL]);
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
    populateSelect(els.siYear, years().map(optionFromValue), String(STATE.year));
    populateSelect(els.siLevel, ["national", "regional", "provincial", "capital"].map(function (value) {
      return { value: value, label: LEVEL_LABELS[value] || value };
    }), STATE.level);
    populateSelect(els.siTheme, Object.keys(CRIME_THEMES).map(function (key) {
      return { value: key, label: CRIME_THEMES[key].label };
    }), STATE.theme);
    populatePeopleFilters();
  }

  function populatePeopleFilters() {
    var people = peopleRows();
    var roles = unique(people.map(function (row) { return row.person_role; })).sort();
    var citizenship = unique(people.map(function (row) { return row.citizenship_group; })).sort();
    populateSelect(els.siRole, [{ value: "all", label: "Tutti" }].concat(roles.map(function (value) {
      return { value: value, label: ROLE_LABELS[value] || labelize(value) };
    })), STATE.role);
    populateSelect(els.siCitizenship, [{ value: "all", label: "Tutte" }].concat(citizenship.map(function (value) {
      return { value: value, label: CITIZENSHIP_LABELS[value] || labelize(value) };
    })), STATE.citizenship);
    els.siRole.disabled = roles.length === 0;
    els.siCitizenship.disabled = citizenship.length === 0;
  }

  function renderAll() {
    refreshDependentFilters();
    renderKpis();
    renderCoverage();
    renderCharts();
    renderTables();
  }

  function refreshDependentFilters() {
    var regions = unique(reportedRows().map(function (row) { return row.region; })).sort(sortItalian);
    populateSelect(els.siRegion, [{ value: "all", label: "Tutte" }].concat(regions.map(optionFromValue)), STATE.region);

    var provinceSource = reportedRows().filter(function (row) {
      return row.province && (STATE.region === "all" || row.region === STATE.region);
    });
    var provinces = unique(provinceSource.map(function (row) { return row.province; })).sort(sortItalian);
    if (STATE.province !== "all" && provinces.indexOf(STATE.province) < 0) STATE.province = "all";
    populateSelect(els.siProvince, [{ value: "all", label: "Tutte" }].concat(provinces.map(function (value) {
      return { value: value, label: territoryShort(value) };
    })), STATE.province);

    var territoryOptions = territoryRowsForControls().map(function (row) {
      return { value: row.territory_code, label: territoryLabel(row) };
    }).sort(function (a, b) { return sortItalian(a.label, b.label); });
    if (STATE.territory !== "all" && !territoryOptions.some(function (option) { return option.value === STATE.territory; })) {
      STATE.territory = "all";
    }
    populateSelect(els.siTerritory, [{ value: "all", label: "Tutti" }].concat(territoryOptions), STATE.territory);

    var crimeOptions = crimeOptionsForTheme();
    if (!crimeOptions.some(function (option) { return option.value === STATE.crime; })) {
      STATE.crime = STATE.theme === "all" ? "TOT" : "all";
    }
    populateSelect(els.siCrime, crimeOptions, STATE.crime);

    els.siRegion.disabled = STATE.level === "national";
    els.siProvince.disabled = STATE.level === "national" || STATE.level === "regional";
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
      "<small>" + escapeHtml(note) + " · " + changeText(change) + "</small>",
      "</article>"
    ].join("");
  }

  function renderCoverage() {
    var dimensions = STATE.meta.available_dimensions || {};
    var people = peopleRows();
    els.siCoverage.innerHTML = [
      coverageItem("Delitti denunciati", true, "Serie per anno, territorio e reato."),
      coverageItem("Reati violenti/altri", Boolean(dimensions.violent_crime), "Classificazione operativa dai codici reato."),
      coverageItem("Autori e vittime", people.length > 0, people.length ? "Dataflow persone presente nel payload." : "In attesa dei dataflow persone nel pipeline."),
      coverageItem("Cittadinanza", unique(people.map(function (row) { return row.citizenship_group; })).length > 0, "Italiani/stranieri quando la fonte lo consente.")
    ].join("");
  }

  function renderCharts() {
    renderTrendChart();
    renderCompositionChart();
    renderContributionChart();
    renderRankingChart();
    renderScatterChart();
    renderTreemapChart();
    renderViolentChart();
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
        x: serie.points.map(function (point) { return point.year; }),
        y: transformSeriesValues(serie.points).map(function (point) { return point.value; }),
        line: { color: COLORS[index % COLORS.length], width: 3 },
        marker: { size: 7 },
        hovertemplate: "<b>%{fullData.name}</b><br>Anno: %{x}<br>" + measureLabel() + ": %{y:,.2f}<extra></extra>"
      };
    }), { yTitle: measureLabel(), legend: true });
  }

  function renderCompositionChart() {
    var rows = selectedTerritoryRows(STATE.year).filter(function (row) {
      return row.indicator_group === "reported_crimes" && row.crime_code !== "TOT";
    });
    var grouped = aggregateBy(rows, function (row) { return themeLabel(row._theme); });
    var data = grouped.sort(descValue).slice(0, 12);
    els.siCompositionTag.textContent = String(STATE.year);
    if (!data.length) return emptyChart("siCompositionChart", "Nessun dettaglio per composizione.");
    plot("siCompositionChart", [{
      type: "bar",
      orientation: "h",
      x: data.map(function (row) { return row.value; }),
      y: data.map(function (row) { return row.key; }),
      marker: { color: data.map(function (_, index) { return COLORS[index % COLORS.length]; }) },
      hovertemplate: "%{y}<br>Valore: %{x:,.0f}<extra></extra>"
    }], { yTitle: "", xTitle: "Delitti denunciati", marginLeft: 170 });
  }

  function renderContributionChart() {
    var currentRows = selectedTerritoryRows(STATE.year).filter(nonTotalReported);
    var prevRows = selectedTerritoryRows(previousYear()).filter(nonTotalReported);
    var current = aggregateBy(currentRows, function (row) { return themeLabel(row._theme); });
    var previous = mapByKey(aggregateBy(prevRows, function (row) { return themeLabel(row._theme); }));
    var data = current.map(function (row) {
      return { key: row.key, value: row.value - ((previous[row.key] || {}).value || 0) };
    }).sort(function (a, b) { return Math.abs(b.value) - Math.abs(a.value); });
    els.siContributionTag.textContent = previousYear() + "-" + STATE.year;
    if (!data.length) return emptyChart("siContributionChart", "Nessuna variazione calcolabile.");
    plot("siContributionChart", [{
      type: "bar",
      x: data.map(function (row) { return row.key; }),
      y: data.map(function (row) { return row.value; }),
      marker: { color: data.map(function (row) { return row.value >= 0 ? "#d96363" : "#5e9f65"; }) },
      hovertemplate: "%{x}<br>Variazione: %{y:,.0f}<extra></extra>"
    }], { yTitle: "Variazione assoluta", xTitle: "" });
  }

  function renderRankingChart() {
    var rows = territoryMetricRows().sort(descMetric).slice(0, 25).reverse();
    els.siRankingTag.textContent = LEVEL_LABELS[STATE.level] + " · " + metricScopeLabel();
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
    var rows = territoryMetricRows().filter(function (row) { return row.territory_level !== "national"; });
    els.siTreemapTag.textContent = LEVEL_LABELS[STATE.level] + " · " + String(STATE.year);
    if (!rows.length) return emptyChart("siTreemapChart", "Treemap disponibile per livelli territoriali locali.");
    var labels = ["Italia"];
    var parents = [""];
    var values = [sum(rows, metricValueForRow)];
    var regionSeen = {};
    rows.forEach(function (row) {
      var region = row.region || "Non classificato";
      if (!regionSeen[region]) {
        regionSeen[region] = true;
        labels.push(region);
        parents.push("Italia");
        values.push(sum(rows.filter(function (item) { return (item.region || "Non classificato") === region; }), metricValueForRow));
      }
      labels.push(territoryLabel(row));
      parents.push(region);
      values.push(metricValueForRow(row));
    });
    plot("siTreemapChart", [{
      type: "treemap",
      labels: labels,
      parents: parents,
      values: values,
      branchvalues: "total",
      marker: { colorscale: "Oranges" },
      hovertemplate: "<b>%{label}</b><br>Valore: %{value:,.0f}<extra></extra>"
    }], { noAxes: true });
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
      { type: "bar", name: "Reati violenti", x: yearsList, y: violent, marker: { color: "#d96363" } },
      { type: "bar", name: "Altri reati", x: yearsList, y: other, marker: { color: "#4f8bc9" } }
    ], { barmode: "stack", yTitle: "Delitti denunciati", legend: true });
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
      x: rows.map(function (row) { return row.year; }),
      y: rows.map(function (row) { return row.value; }),
      fill: "tozeroy",
      line: { color: "#ff5a1f", width: 3 },
      marker: { size: 8 },
      hovertemplate: "Anno: %{x}<br>Valore: %{y:,.0f}<extra></extra>"
    }], { yTitle: "Delitti denunciati" });
  }

  function renderPeopleChart() {
    var rows = peopleSelectionRows();
    els.siPeopleTag.textContent = rows.length ? "autori/vittime" : "da integrare";
    if (!rows.length) return emptyChart("siPeopleChart", "I dati autori/vittime non sono ancora presenti nel payload selezionato.");
    var grouped = aggregateBy(rows, function (row) {
      return (ROLE_LABELS[row.person_role] || labelize(row.person_role || "ruolo n.d.")) + " · " + (CITIZENSHIP_LABELS[row.citizenship_group] || labelize(row.citizenship_group || "cittadinanza n.d."));
    }).sort(descValue).slice(0, 18).reverse();
    plot("siPeopleChart", [{
      type: "bar",
      orientation: "h",
      x: grouped.map(function (row) { return row.value; }),
      y: grouped.map(function (row) { return row.key; }),
      marker: { color: "#3aa6a1" },
      hovertemplate: "%{y}<br>Valore: %{x:,.0f}<extra></extra>"
    }], { xTitle: "Persone", marginLeft: 210 });
  }

  function renderDemographyChart() {
    var rows = peopleSelectionRows().filter(function (row) { return row.age_group || row.sex; });
    els.siDemographyTag.textContent = rows.length ? "sesso ed eta" : "da integrare";
    if (!rows.length) return emptyChart("siDemographyChart", "Sesso ed eta non sono disponibili per il perimetro selezionato.");
    var grouped = aggregateBy(rows, function (row) {
      return sexLabel(row.sex) + " · " + ageLabel(row.age_group);
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

  function renderCounterChart() {
    var rows = counterRows().sort(function (a, b) {
      return Math.abs(b.change_pct_yoy || 0) - Math.abs(a.change_pct_yoy || 0);
    }).slice(0, 20).reverse();
    els.siCounterTag.textContent = STATE.year + " · " + metricScopeLabel();
    if (!rows.length) {
      emptyChart("siCounterChart", "Nessuna controtendenza nel perimetro selezionato.");
      els.siCounterTable.innerHTML = emptyMessage("Nessuna controtendenza nel perimetro selezionato.");
      return;
    }
    plot("siCounterChart", [{
      type: "bar",
      orientation: "h",
      x: rows.map(function (row) { return row.change_pct_yoy; }),
      y: rows.map(function (row) { return territoryLabel(row) + " · " + crimeLabel(row); }),
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
    territoryMetricRows().sort(descMetric).slice(0, STATE.level === "national" ? 1 : 5).forEach(function (row) {
      if (row.territory_code !== "IT") entities.push({ level: row.territory_level, code: row.territory_code, label: territoryLabel(row) });
    });
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
    var rows = peopleRows()
      .filter(function (row) { return row.year === STATE.year; })
      .filter(peopleAreaFilter)
      .filter(peopleCrimeFilter)
      .filter(function (row) { return STATE.role === "all" || row.person_role === STATE.role; })
      .filter(function (row) {
        if (STATE.citizenship !== "all") return row.citizenship_group === STATE.citizenship;
        return !hasDetailedCitizenship() || row.citizenship_group !== "totale_cittadinanza";
      });
    return rows;
  }

  function counterRows() {
    return reportedRows()
      .filter(function (row) { return row.year === STATE.year && row.is_countertrend_vs_national === true; })
      .filter(areaFilter)
      .filter(metricCrimeFilter)
      .filter(function (row) { return row.territory_level === STATE.level; })
      .filter(function (row) { return STATE.territory === "all" || row.territory_code === STATE.territory; })
      .sort(function (a, b) { return Math.abs(b.change_pct_yoy || 0) - Math.abs(a.change_pct_yoy || 0); });
  }

  function aggregateSelectionForCrime(code, year) {
    if (!year) return null;
    return sum(selectedTerritoryRows(year).filter(function (row) { return row.crime_code === code; }), function (row) { return row.value; });
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
        return { year: point.year, value: firstRow ? firstRow.change_pct_yoy : null };
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
    Plotly.newPlot(el, traces, layout, { responsive: true, displayModeBar: false });
  }

  function emptyChart(id, message) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = '<div class="si-chart-empty">' + escapeHtml(message) + "</div>";
  }

  function renderError() {
    ["siTrendChart", "siCompositionChart", "siContributionChart", "siRankingChart", "siScatterChart", "siTreemapChart", "siViolentChart", "siCrimeChart", "siPeopleChart", "siDemographyChart", "siCounterChart"].forEach(function (id) {
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

  function coverageItem(label, ready, note) {
    return '<article class="si-coverage-item" data-state="' + (ready ? "ready" : "missing") + '"><strong>' + escapeHtml(label) + ": " + (ready ? "disponibile" : "da integrare") + "</strong><span>" + escapeHtml(note) + "</span></article>";
  }

  function populateSelect(select, options, value) {
    select.innerHTML = options.map(function (option) {
      return '<option value="' + escapeHtml(String(option.value)) + '">' + escapeHtml(String(option.label)) + "</option>";
    }).join("");
    select.value = options.some(function (option) { return String(option.value) === String(value); }) ? String(value) : (options[0] ? String(options[0].value) : "");
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

  function crimeOption(code) {
    return { value: code, label: crimeLabel({ crime_code: code }) + " (" + code + ")" };
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
    return [row.region, row.province && row.territory_level === "capital" ? "Provincia " + row.province : "", row.territory_code].filter(Boolean).join(" · ");
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
