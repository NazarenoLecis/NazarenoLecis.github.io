(function () {
  "use strict";

  var DATA_SOURCES = [
    "../../data/sanita-italia/dashboard.json?v=20260720-5",
    "https://data.nazarenolecis.com/sanita-italia/dashboard.json?v=20260720-5",
    "https://raw.githubusercontent.com/NazarenoLecis/nazarenolecis-data-pipeline/main/publish/sanita-italia/dashboard.json"
  ];

  var STATE = {
    payload: null,
    region: "Italia",
    discipline: "",
    metric: "discharges",
    ratioMode: "population_total",
    nationalActivityRegion: "Italia",
    nationalActivityProvince: "all",
    nationalActivityMetric: "discharges",
    nationalActivityRatio: "absolute",
    nationalActivityLimit: "25",
    nationalBedsRegion: "Italia",
    nationalBedsYear: "latest",
    nationalBedsMetric: "total_beds",
    nationalBedsRatio: "absolute",
    nationalBedsLimit: "25",
    dischargeRegion: "Italia",
    disciplineRegion: "Italia",
    disciplineProvince: "all",
    disciplineMetric: "rate",
    denominator: "auto",
    costRegion: "Italia",
    costRatio: "population_total",
    costType: "totali",
    costCompositionRegion: "Italia",
    bedsSeriesRegion: "Italia",
    bedsSeriesMetric: "total_beds",
    bedsSeriesRatio: "absolute",
    pharmaRegion: "Italia",
    pharmaLabel: "all",
    hospitalRegion: "Italia",
    hospitalProvince: "all",
    hospitalDiscipline: "all",
    mobilityRatio: "absolute",
    mobilitySeriesRegion: "Italia",
    mobilitySeriesRatio: "absolute",
    mobilityHospitalRegion: "Italia",
    mobilityHospitalLimit: "15",
    mobilitySankeyMin: "0",
    tableRegion: "Italia",
    tableProvince: "all",
    tableDiscipline: "all",
    table: "regional_summary",
    search: ""
  };

  var COLORS = ["#ff5a1f", "#5d8fd7", "#3aa6a1", "#65a96b", "#d9ad48", "#d96666", "#9c7ad9", "#8f8f8f"];
  var MISSING = "ND";

  var METRICS = {
    discharges: { label: "Dimissioni", family: "volume" },
    total_beds: { label: "Posti letto", family: "volume" },
    ssn_cost_eur: { label: "Costo SSN", family: "money" },
    mobility_balance_eur: { label: "Saldo mobilita", family: "money_signed" },
    bed_utilization_percent: { label: "Utilizzo posti letto", field: "bed_utilization_percent", format: formatPercent },
    avg_los_days: { label: "Degenza media", field: "avg_los_days", format: function (value) { return formatDecimal(value) + " giorni"; } }
  };

  var RATIO_MODES = {
    auto: "misura consigliata",
    absolute: "valore assoluto",
    population_total: "popolazione totale",
    population_65_plus: "popolazione 65+",
    population_75_plus: "popolazione 75+",
    clinical: "denominatore clinico",
    gdp: "PIL regionale"
  };

  var DENOMINATORS = {
    auto: "automatico",
    population_total: "popolazione totale",
    population_65_plus: "popolazione 65+",
    population_75_plus: "popolazione 75+",
    population_0: "eta 0 / neonati",
    population_0_14: "popolazione 0-14",
    women_15_49: "donne 15-49"
  };

  var TABLE_OPTIONS = [
    {
      id: "regional_summary",
      label: "Sintesi regionale",
      columns: [
        ["region", "Regione"],
        ["discharges", "Dimissioni"],
        ["discharges_per_1000", "Dim./1.000"],
        ["discharges_per_1000_over65", "Dim./1.000 65+"],
        ["discharges_per_1000_over75", "Dim./1.000 75+"],
        ["total_beds", "Posti letto"],
        ["beds_per_1000", "PL/1.000"],
        ["ssn_cost_eur", "Costo SSN"],
        ["ssn_cost_per_capita_eur", "Euro pro capite"],
        ["ssn_cost_per_discharge_eur", "Euro/dimissione"],
        ["ssn_cost_percent_gdp", "Costo/PIL"],
        ["mobility_balance_million_eur", "Saldo mobilita"],
        ["top_discipline", "Disciplina principale"]
      ]
    },
    {
      id: "activity_by_region_discipline",
      label: "Attivita per regione e disciplina",
      columns: [
        ["region", "Regione"],
        ["discipline", "Disciplina"],
        ["discharges", "Dimissioni"],
        ["discharges_per_1000_total", "Dim./1.000 totale"],
        ["discharges_per_1000_over65", "Dim./1.000 65+"],
        ["discharges_per_1000_over75", "Dim./1.000 75+"],
        ["discharges_per_1000_relevant", "Dim./1.000 denom."],
        ["relevant_denominator", "Denominatore"],
        ["avg_los_days", "Degenza media"],
        ["bed_utilization_percent", "Utilizzo PL"]
      ]
    },
    {
      id: "activity_by_province_discipline",
      label: "Attivita per provincia e disciplina",
      columns: [
        ["region", "Regione"],
        ["province", "Provincia"],
        ["province_name", "Nome provincia"],
        ["discipline", "Disciplina"],
        ["discharges", "Dimissioni"],
        ["discharges_per_1000_total", "Dim./1.000 totale"],
        ["discharges_per_1000_over65", "Dim./1.000 65+"],
        ["discharges_per_1000_over75", "Dim./1.000 75+"],
        ["discharges_per_1000_relevant", "Dim./1.000 denom."],
        ["relevant_denominator", "Denominatore"],
        ["avg_los_days", "Degenza media"],
        ["bed_utilization_percent", "Utilizzo PL"]
      ]
    },
    {
      id: "beds_by_region_discipline",
      label: "Posti letto per regione e disciplina",
      columns: [
        ["year", "Anno"],
        ["region", "Regione"],
        ["discipline", "Disciplina"],
        ["discipline_type", "Tipo"],
        ["total_beds", "Totale PL"],
        ["ordinary_beds", "PL ordinari"],
        ["day_hospital_beds", "PL DH"],
        ["day_surgery_beds", "PL DS"],
        ["beds_per_1000_total", "PL/1.000"],
        ["beds_per_1000_over65", "PL/1.000 65+"],
        ["beds_per_1000_over75", "PL/1.000 75+"]
      ]
    },
    {
      id: "cost_by_region_category",
      label: "Costi regionali",
      columns: [
        ["region", "Regione"],
        ["cost_label", "Voce"],
        ["amount_eur", "Importo"],
        ["amount_per_capita_eur", "Euro/ab."],
        ["amount_per_over65_eur", "Euro/65+"],
        ["amount_per_over75_eur", "Euro/75+"],
        ["amount_per_discharge_eur", "Euro/dimissione"],
        ["amount_percent_gdp", "% PIL"],
        ["share_percent", "Quota %"],
        ["change_percent", "Var. %"],
        ["year", "Anno"]
      ]
    },
    {
      id: "pharma_series",
      label: "Serie farmaceutica",
      columns: [
        ["region", "Territorio"],
        ["year", "Anno"],
        ["cost_label", "Voce"],
        ["amount_eur", "Importo"]
      ]
    },
    {
      id: "hospital_activity_top",
      label: "Top strutture",
      columns: [
        ["region", "Regione"],
        ["structure", "Struttura"],
        ["municipality", "Comune"],
        ["province", "Provincia"],
        ["discharges", "Dimissioni"],
        ["ordinary_beds", "PL ordinari"],
        ["main_discipline", "Disciplina principale"]
      ]
    },
    {
      id: "population_denominators",
      label: "Denominatori demografici",
      columns: [
        ["region", "Regione"],
        ["population_total", "Popolazione"],
        ["population_0", "Eta 0"],
        ["population_0_14", "0-14"],
        ["population_65_plus", "65+"],
        ["population_75_plus", "75+"],
        ["women_15_49", "Donne 15-49"]
      ]
    },
    {
      id: "population_denominators_province",
      label: "Denominatori provinciali",
      columns: [
        ["region", "Regione"],
        ["province", "Provincia"],
        ["province_name", "Nome provincia"],
        ["population_total", "Popolazione"],
        ["population_0", "Eta 0"],
        ["population_0_14", "0-14"],
        ["population_65_plus", "65+"],
        ["population_75_plus", "75+"],
        ["women_15_49", "Donne 15-49"]
      ]
    },
    {
      id: "gdp_regional",
      label: "PIL regionale",
      columns: [
        ["region", "Regione"],
        ["year", "Anno"],
        ["nuts2", "NUTS2"],
        ["gdp_million_eur", "PIL"],
        ["source", "Fonte"]
      ]
    },
    {
      id: "mobility_balance",
      label: "Mobilita sanitaria",
      columns: [
        ["region", "Regione"],
        ["year", "Anno"],
        ["balance_million_eur", "Saldo"],
        ["balance_per_capita_eur", "Euro/ab."],
        ["balance_per_over65_eur", "Euro/65+"],
        ["balance_per_over75_eur", "Euro/75+"],
        ["balance_percent_gdp", "% PIL"],
        ["direction", "Direzione"]
      ]
    },
    {
      id: "mobility_sankey",
      label: "Sankey mobilita 2024",
      columns: [
        ["source", "Origine"],
        ["target", "Destinazione"],
        ["value_million_eur", "Valore"],
        ["flow_type", "Tipo"],
        ["year", "Anno"]
      ]
    },
    {
      id: "discharge_type_by_region",
      label: "Tipologia dimissioni",
      columns: [
        ["year", "Anno"],
        ["region", "Regione"],
        ["deaths", "Decessi"],
        ["home_discharges", "Domicilio"],
        ["transfers", "Trasferimenti"],
        ["known_total", "Totale noto"],
        ["masked_cells", "Celle oscurate"]
      ]
    },
    {
      id: "definitions",
      label: "Definizioni",
      columns: [
        ["indicator", "Indicatore"],
        ["definition", "Definizione"],
        ["numerator", "Numeratore"],
        ["denominator", "Denominatore"],
        ["unit", "Unita"],
        ["source", "Fonte"],
        ["warning", "Avvertenza"]
      ]
    },
    {
      id: "sources",
      label: "Fonti",
      columns: [
        ["provider", "Ente"],
        ["name", "Fonte"],
        ["used_for", "Uso"],
        ["coverage", "Copertura"],
        ["latest_year", "Anno"],
        ["license", "Licenza"],
        ["url", "Pagina"]
      ]
    }
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function asText(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback || MISSING;
    return String(value);
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function formatNumber(value) {
    var number = toNumber(value);
    if (number === null) return MISSING;
    return number.toLocaleString("it-IT", { maximumFractionDigits: 0 });
  }

  function formatDecimal(value) {
    var number = toNumber(value);
    if (number === null) return MISSING;
    return number.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function formatPercent(value) {
    var number = toNumber(value);
    if (number === null) return MISSING;
    return number.toLocaleString("it-IT", { maximumFractionDigits: 1 }) + "%";
  }

  function formatEuro(value) {
    var number = toNumber(value);
    if (number === null) return MISSING;
    return number.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  }

  function formatEuroDecimal(value) {
    var number = toNumber(value);
    if (number === null) return MISSING;
    return number.toLocaleString("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatEuroCompact(value) {
    var number = toNumber(value);
    if (number === null) return MISSING;
    if (Math.abs(number) >= 1000000000) return (number / 1000000000).toLocaleString("it-IT", { maximumFractionDigits: 1 }) + " mld euro";
    if (Math.abs(number) >= 1000000) return (number / 1000000).toLocaleString("it-IT", { maximumFractionDigits: 1 }) + " mln euro";
    return formatEuro(number);
  }

  function formatMillionEuro(value) {
    var number = toNumber(value);
    if (number === null) return MISSING;
    return number.toLocaleString("it-IT", { maximumFractionDigits: 1 }) + " mln euro";
  }

  function formatCell(column, value) {
    if (/million_eur$/i.test(column)) return formatMillionEuro(value);
    if (/per_capita_eur|per_over65_eur|per_over75_eur|per_discharge_eur/i.test(column)) return formatEuroDecimal(value);
    if (/eur$/i.test(column) || column === "amount_eur" || column === "ssn_cost_eur") return formatEuroCompact(value);
    if (/percent$/i.test(column)) return formatPercent(value);
    if (column === "selected_value") return formatDecimal(value);
    if (/per_1000|avg_los|share|change|utilization/i.test(column)) return formatDecimal(value);
    if (/population|beds|discharges|days|total|structures|deaths|transfers|masked|year/i.test(column)) return formatNumber(value);
    return asText(value);
  }

  function compact(value, maxLength) {
    var text = asText(value);
    maxLength = maxLength || 72;
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3).trim() + "...";
  }

  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function clear(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function create(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function tableRows(name) {
    var tables = STATE.payload && STATE.payload.tables ? STATE.payload.tables : {};
    return toArray(tables[name]);
  }

  function populationMap() {
    var map = {};
    tableRows("population_denominators").forEach(function (row) {
      map[row.region] = row;
    });
    return map;
  }

  function nationalPopulation() {
    return (STATE.payload && STATE.payload.national && STATE.payload.national.population) || {};
  }

  function provinceMeta(region, province) {
    return toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.provinces).find(function (row) {
      return row.region === region && row.province === province;
    }) || null;
  }

  function provinceLabel(region, province) {
    var meta = provinceMeta(region, province);
    if (!province || province === "all") return "Tutte";
    return meta && meta.province_name ? province + " - " + meta.province_name : province;
  }

  function territoryLabel(region, province) {
    if (province && province !== "all") return provinceLabel(region, province);
    return region || "Italia";
  }

  function provinceOptions(region) {
    var rows = toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.provinces).filter(function (row) {
      return region !== "Italia" && row.region === region;
    });
    return [{ value: "all", label: region === "Italia" ? "Seleziona una regione" : "Tutte" }].concat(rows.map(function (row) {
      return { value: row.province, label: provinceLabel(row.region, row.province) };
    }));
  }

  function refreshProvinceFilter(id, stateKey, region) {
    var options = provinceOptions(region);
    if (region === "Italia" || !options.some(function (option) { return option.value === STATE[stateKey]; })) {
      STATE[stateKey] = "all";
    }
    fillSelect(id, options, STATE[stateKey]);
    var node = byId(id);
    if (node) node.disabled = region === "Italia";
  }

  function refreshProvinceFilters() {
    refreshProvinceFilter("hiNationalActivityProvinceFilter", "nationalActivityProvince", STATE.nationalActivityRegion);
    refreshProvinceFilter("hiDisciplineProvinceFilter", "disciplineProvince", STATE.disciplineRegion);
    refreshProvinceFilter("hiHospitalProvinceFilter", "hospitalProvince", STATE.hospitalRegion);
    refreshProvinceFilter("hiTableProvinceFilter", "tableProvince", STATE.tableRegion);
  }

  function denominatorValueForRow(row, denominator) {
    if (!row) return null;
    if (row[denominator] !== undefined && row[denominator] !== null) return toNumber(row[denominator]);
    if (row.region) return toNumber((populationMap()[row.region] || {})[denominator]);
    return toNumber(nationalPopulation()[denominator]);
  }

  function ratioLabel(mode) {
    if (mode === "auto") return "per 1.000, denominatore clinico";
    if (mode === "population_65_plus") return "per 1.000 residenti 65+";
    if (mode === "population_75_plus") return "per 1.000 residenti 75+";
    if (mode === "population_total") return "per 1.000 residenti";
    return "valore assoluto";
  }

  function normalizedValue(row, field, mode) {
    if (!mode || mode === "absolute") return toNumber(row[field]);
    var denominator = mode === "auto" ? toNumber(row.relevant_population) : denominatorValueForRow(row, mode);
    if (!denominator) return null;
    return ((toNumber(row[field]) || 0) / denominator) * 1000;
  }

  function withNormalizedMetric(rows, field, mode) {
    return toArray(rows).map(function (row) {
      var copy = Object.assign({}, row);
      copy.selected_value = normalizedValue(row, field, mode);
      return copy;
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
  }

  function setStatus(text, state) {
    var node = byId("hiStatus");
    if (!node) return;
    node.textContent = text;
    if (state) node.dataset.state = state;
  }

  function plotConfig() {
    return {
      responsive: true,
      displayModeBar: false,
      scrollZoom: false,
      doubleClick: false,
      showTips: false
    };
  }

  function defaultAxis() {
    var muted = cssVar("--muted", "#b9b2aa");
    var line = cssVar("--line", "#303030");
    return {
      fixedrange: true,
      gridcolor: line,
      zerolinecolor: line,
      tickfont: { color: muted },
      automargin: true
    };
  }

  function baseLayout(extra) {
    var text = cssVar("--text", "#f5f2ed");
    var line = cssVar("--line", "#303030");
    var panel = cssVar("--panel", "#090909");
    var layout = Object.assign({
      autosize: true,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: {
        color: text,
        family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        size: 12
      },
      margin: { t: 18, r: 18, b: 52, l: 72 },
      hoverlabel: {
        bgcolor: panel,
        bordercolor: line,
        font: { color: text }
      },
      dragmode: false,
      xaxis: defaultAxis(),
      yaxis: defaultAxis()
    }, extra || {});
    if (extra && extra.xaxis) layout.xaxis = Object.assign(defaultAxis(), extra.xaxis);
    if (extra && extra.yaxis) layout.yaxis = Object.assign(defaultAxis(), extra.yaxis);
    return layout;
  }

  function showEmptyChart(id, message) {
    var node = byId(id);
    if (!node) return;
    if (window.Plotly) {
      try { window.Plotly.purge(node); } catch (error) {}
    }
    clear(node);
    node.appendChild(create("div", "hi-empty", message || "Nessun dato disponibile"));
  }

  function plot(id, traces, layout) {
    var node = byId(id);
    if (!node) return;
    if (!window.Plotly) {
      showEmptyChart(id, "Plotly non caricato");
      return;
    }
    if (!traces || !traces.length) {
      showEmptyChart(id, "Nessun dato disponibile");
      return;
    }
    window.Plotly.react(node, traces, baseLayout(layout), plotConfig()).catch(function () {
      showEmptyChart(id, "Errore nella costruzione del grafico");
    });
  }

  function sortDescending(rows, field) {
    return toArray(rows).slice().sort(function (a, b) {
      return (toNumber(b[field]) || 0) - (toNumber(a[field]) || 0);
    });
  }

  function horizontalBar(id, rows, labelField, valueField, options) {
    options = options || {};
    rows = toArray(rows).filter(function (row) { return toNumber(row[valueField]) !== null; });
    if (!rows.length) {
      showEmptyChart(id);
      return;
    }
    rows = rows.slice(0, options.limit || 20).reverse();
    var labels = rows.map(function (row) { return compact(row[labelField], options.labelLength || 34); });
    var values = rows.map(function (row) { return toNumber(row[valueField]) || 0; });
    var displayValues = rows.map(function (row) {
      return options.format ? options.format(row[valueField]) : formatDecimal(row[valueField]);
    });
    var colors = rows.map(function (row) {
      if (options.colorFor) return options.colorFor(row);
      var highlightField = options.highlightField || "region";
      return options.highlight && row[highlightField] === options.highlight ? COLORS[0] : (options.color || COLORS[1]);
    });
    plot(id, [{
      type: "bar",
      orientation: "h",
      x: values,
      y: labels,
      text: displayValues,
      marker: { color: colors },
      customdata: rows,
      hovertemplate: options.hovertemplate || "%{y}: %{x:,.2f}<extra></extra>"
    }], {
      margin: { t: 16, r: 26, b: 46, l: options.leftMargin || 190 },
      xaxis: { title: options.xTitle || "" },
      yaxis: { title: "" }
    });
  }

  function lineChart(id, traces, options) {
    options = options || {};
    if (!traces.length) {
      showEmptyChart(id);
      return;
    }
    plot(id, traces, {
      margin: { t: 20, r: 26, b: 52, l: 78 },
      xaxis: { title: "" },
      yaxis: { title: options.yTitle || "" },
      legend: { orientation: "h", y: -0.18 },
      hovermode: "x unified"
    });
  }

  function fillSelect(id, options, selected) {
    var node = byId(id);
    if (!node) return;
    clear(node);
    options.forEach(function (option) {
      var opt = document.createElement("option");
      opt.value = option.value;
      opt.textContent = option.label;
      node.appendChild(opt);
    });
    if (options.some(function (option) { return option.value === selected; })) {
      node.value = selected;
    }
  }

  function setupFilters() {
    var filters = STATE.payload.filters || {};
    var disciplineRows = sortDescending(tableRows("activity_by_discipline"), "discharges");
    if (!STATE.discipline && disciplineRows.length) STATE.discipline = disciplineRows[0].discipline;
    var regionOptions = [{ value: "Italia", label: "Italia" }].concat(toArray(filters.regions).map(function (region) {
      return { value: region, label: region };
    }));
    var disciplineOptions = disciplineRows.map(function (row) {
      return { value: row.discipline, label: row.discipline };
    });
    var disciplineOptionsWithAll = [{ value: "all", label: "Tutte" }].concat(disciplineOptions);
    var costOptions = toArray(filters.cost_types).map(function (row) {
      return { value: row.id, label: row.label };
    });
    var bedYears = unique(tableRows("beds_by_discipline").map(function (row) { return row.year; })).sort(function (a, b) { return b - a; });
    var pharmaLabels = unique(tableRows("pharma_series").map(function (row) { return row.cost_label; })).sort();

    [
      ["hiNationalActivityRegionFilter", "nationalActivityRegion"],
      ["hiNationalBedsRegionFilter", "nationalBedsRegion"],
      ["hiRegionalRegionFilter", "region"],
      ["hiDischargeRegionFilter", "dischargeRegion"],
      ["hiDisciplineRegionFilter", "disciplineRegion"],
      ["hiCostRegionFilter", "costRegion"],
      ["hiCostCompositionRegionFilter", "costCompositionRegion"],
      ["hiBedsSeriesRegionFilter", "bedsSeriesRegion"],
      ["hiPharmaSeriesRegionFilter", "pharmaRegion"],
      ["hiHospitalRegionFilter", "hospitalRegion"],
      ["hiMobilitySeriesRegionFilter", "mobilitySeriesRegion"],
      ["hiMobilityHospitalRegionFilter", "mobilityHospitalRegion"],
      ["hiTableRegionFilter", "tableRegion"]
    ].forEach(function (item) {
      fillSelect(item[0], regionOptions, STATE[item[1]]);
    });
    refreshProvinceFilters();

    fillSelect("hiDisciplineFilter", disciplineOptions, STATE.discipline);
    fillSelect("hiHospitalDisciplineFilter", disciplineOptionsWithAll, STATE.hospitalDiscipline);
    fillSelect("hiTableDisciplineFilter", disciplineOptionsWithAll, STATE.tableDiscipline);
    fillSelect("hiCostTypeFilter", costOptions, STATE.costType);
    var latestBedsYear = STATE.payload.kpis && STATE.payload.kpis.beds_latest_year;
    fillSelect("hiNationalBedsYearFilter", [{ value: "latest", label: latestBedsYear ? "Ultimo anno (" + latestBedsYear + ")" : "Ultimo anno" }].concat(bedYears.filter(function (year) {
      return year !== latestBedsYear;
    }).map(function (year) {
      return { value: String(year), label: String(year) };
    })), STATE.nationalBedsYear);
    fillSelect("hiPharmaSeriesLabelFilter", [{ value: "all", label: "Tutte" }].concat(pharmaLabels.map(function (label) {
      return { value: label, label: label };
    })), STATE.pharmaLabel);

    var ratioSelect = byId("hiRatioFilter");
    if (ratioSelect) ratioSelect.value = STATE.ratioMode;
    var costRatioSelect = byId("hiCostRatioFilter");
    if (costRatioSelect) costRatioSelect.value = STATE.costRatio;
    var mobilityRatioSelect = byId("hiMobilityRatioFilter");
    if (mobilityRatioSelect) mobilityRatioSelect.value = STATE.mobilityRatio;
    [
      ["hiNationalActivityMetricFilter", "nationalActivityMetric"],
      ["hiNationalActivityRatioFilter", "nationalActivityRatio"],
      ["hiNationalActivityLimitFilter", "nationalActivityLimit"],
      ["hiNationalBedsMetricFilter", "nationalBedsMetric"],
      ["hiNationalBedsRatioFilter", "nationalBedsRatio"],
      ["hiNationalBedsLimitFilter", "nationalBedsLimit"],
      ["hiDisciplineMetricFilter", "disciplineMetric"],
      ["hiBedsSeriesMetricFilter", "bedsSeriesMetric"],
      ["hiBedsSeriesRatioFilter", "bedsSeriesRatio"],
      ["hiMobilitySeriesRatioFilter", "mobilitySeriesRatio"],
      ["hiMobilityHospitalLimitFilter", "mobilityHospitalLimit"],
      ["hiMobilitySankeyMinFilter", "mobilitySankeyMin"]
    ].forEach(function (item) {
      var node = byId(item[0]);
      if (node) node.value = STATE[item[1]];
    });

    var tableSelect = byId("hiTableSelect");
    if (tableSelect) {
      clear(tableSelect);
      TABLE_OPTIONS.forEach(function (item) {
        if (!STATE.payload.tables || !STATE.payload.tables[item.id]) return;
        var option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.label;
        tableSelect.appendChild(option);
      });
      tableSelect.value = STATE.table;
    }
  }

  function bindControls() {
    var bindings = [
      ["hiRegionalRegionFilter", "region"],
      ["hiDisciplineFilter", "discipline"],
      ["hiMetricFilter", "metric"],
      ["hiRatioFilter", "ratioMode"],
      ["hiNationalActivityRegionFilter", "nationalActivityRegion"],
      ["hiNationalActivityProvinceFilter", "nationalActivityProvince"],
      ["hiNationalActivityMetricFilter", "nationalActivityMetric"],
      ["hiNationalActivityRatioFilter", "nationalActivityRatio"],
      ["hiNationalActivityLimitFilter", "nationalActivityLimit"],
      ["hiNationalBedsRegionFilter", "nationalBedsRegion"],
      ["hiNationalBedsYearFilter", "nationalBedsYear"],
      ["hiNationalBedsMetricFilter", "nationalBedsMetric"],
      ["hiNationalBedsRatioFilter", "nationalBedsRatio"],
      ["hiNationalBedsLimitFilter", "nationalBedsLimit"],
      ["hiDischargeRegionFilter", "dischargeRegion"],
      ["hiDisciplineRegionFilter", "disciplineRegion"],
      ["hiDisciplineProvinceFilter", "disciplineProvince"],
      ["hiDisciplineMetricFilter", "disciplineMetric"],
      ["hiDenominatorFilter", "denominator"],
      ["hiCostRegionFilter", "costRegion"],
      ["hiCostRatioFilter", "costRatio"],
      ["hiCostTypeFilter", "costType"],
      ["hiCostCompositionRegionFilter", "costCompositionRegion"],
      ["hiBedsSeriesRegionFilter", "bedsSeriesRegion"],
      ["hiBedsSeriesMetricFilter", "bedsSeriesMetric"],
      ["hiBedsSeriesRatioFilter", "bedsSeriesRatio"],
      ["hiPharmaSeriesRegionFilter", "pharmaRegion"],
      ["hiPharmaSeriesLabelFilter", "pharmaLabel"],
      ["hiHospitalRegionFilter", "hospitalRegion"],
      ["hiHospitalProvinceFilter", "hospitalProvince"],
      ["hiHospitalDisciplineFilter", "hospitalDiscipline"],
      ["hiMobilityRatioFilter", "mobilityRatio"],
      ["hiMobilitySeriesRegionFilter", "mobilitySeriesRegion"],
      ["hiMobilitySeriesRatioFilter", "mobilitySeriesRatio"],
      ["hiMobilityHospitalRegionFilter", "mobilityHospitalRegion"],
      ["hiMobilityHospitalLimitFilter", "mobilityHospitalLimit"],
      ["hiMobilitySankeyMinFilter", "mobilitySankeyMin"],
      ["hiTableRegionFilter", "tableRegion"],
      ["hiTableProvinceFilter", "tableProvince"],
      ["hiTableDisciplineFilter", "tableDiscipline"],
      ["hiTableSelect", "table"]
    ];
    bindings.forEach(function (binding) {
      var node = byId(binding[0]);
      if (!node) return;
      node.addEventListener("change", function () {
        STATE[binding[1]] = node.value;
        renderDynamic();
      });
    });

    var search = byId("hiTableSearch");
    if (search) {
      search.addEventListener("input", function () {
        STATE.search = search.value;
        renderExplorer();
      });
    }

  }

  function renderKpis() {
    var payload = STATE.payload;
    var national = payload.national || {};
    var kpis = payload.kpis || {};
    var activity = national.activity || {};
    var beds = national.beds || {};
    var costs = national.costs || {};
    var pop = national.population || {};
    var mobility = national.mobility || {};
    var items = [
      ["Dimissioni ospedaliere", activity.discharges, "anno " + asText(activity.year), formatDecimal(activity.discharges_per_1000) + " per 1.000 residenti"],
      ["Discipline", kpis.disciplines, "reparti ospedalieri", "classificate nella fonte Ministero"],
      ["Giornate di degenza", activity.stay_days, "anno " + asText(activity.year), "degenza media " + formatDecimal(activity.avg_los_days) + " giorni"],
      ["Posti letto", beds.total_beds, "anno " + asText(beds.year), formatDecimal(beds.beds_per_1000) + " per 1.000 residenti"],
      ["Costo SSN", formatEuroCompact(costs.amount_eur), "conto economico " + asText(costs.year), formatEuroDecimal(costs.cost_per_capita_eur) + " pro capite; " + formatPercent(costs.cost_percent_gdp) + " del PIL"],
      ["Popolazione 65+", pop.population_65_plus, "ISTAT 2026", formatPercent(pop.elderly_65_share_percent) + " della popolazione"],
      ["Strutture", kpis.structures, "pubbliche ed equiparate", "nel dataset attivita reparti"],
      ["Saldo mobilita", formatEuroCompact(mobility.balance_eur), "Corte dei conti " + asText(mobility.year), formatEuroDecimal(mobility.balance_per_capita_eur) + " per abitante"]
    ];
    var container = byId("hiKpis");
    clear(container);
    items.forEach(function (item) {
      var card = create("article", "hi-kpi");
      card.appendChild(create("span", "", item[0]));
      card.appendChild(create("strong", "", typeof item[1] === "number" ? formatNumber(item[1]) : asText(item[1])));
      card.appendChild(create("em", "", item[2]));
      card.appendChild(create("small", "", item[3]));
      container.appendChild(card);
    });
  }

  function renderNationalCharts() {
    var activityConfig = nationalActivityConfig();
    var activityRows = nationalActivityRows().map(function (row) {
      var copy = Object.assign({}, row);
      copy.selected_value = activityConfig.value(row);
      return copy;
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
    var activityTag = byId("hiNationalActivityTag");
    if (activityTag) {
      activityTag.textContent = territoryLabel(STATE.nationalActivityRegion, STATE.nationalActivityProvince) + " - " + activityConfig.context;
    }
    horizontalBar(
      "hiNationalActivityChart",
      sortDescending(activityRows, "selected_value"),
      "discipline",
      "selected_value",
      {
        limit: chartLimit(STATE.nationalActivityLimit, 25),
        color: COLORS[0],
        leftMargin: 210,
        xTitle: activityConfig.xTitle,
        format: activityConfig.format,
        hovertemplate: "%{y}<br>" + activityConfig.label + ": %{text}<extra></extra>"
      }
    );

    var latestBedsYear = STATE.payload.kpis && STATE.payload.kpis.beds_latest_year;
    var selectedYear = STATE.nationalBedsYear === "latest" ? latestBedsYear : Number(STATE.nationalBedsYear);
    var bedConfig = bedMetricConfig(STATE.nationalBedsMetric);
    var bedRows = (STATE.nationalBedsRegion === "Italia" ? tableRows("beds_by_discipline") : tableRows("beds_by_region_discipline").filter(function (row) {
      return row.region === STATE.nationalBedsRegion;
    })).filter(function (row) {
      return row.year === selectedYear && toNumber(row[bedConfig.field]) > 0;
    });
    bedRows = withNormalizedMetric(bedRows, bedConfig.field, STATE.nationalBedsRatio);
    var bedTag = byId("hiNationalBedsTag");
    if (bedTag) {
      bedTag.textContent = territoryLabel(STATE.nationalBedsRegion, "all") + " - " + selectedYear + " - " + ratioLabel(STATE.nationalBedsRatio);
    }
    var bedLabel = STATE.nationalBedsRatio === "absolute" ? bedConfig.label : bedConfig.label + " " + ratioLabel(STATE.nationalBedsRatio);
    var bedFormat = STATE.nationalBedsRatio === "absolute" ? formatNumber : formatDecimal;
    var bedXTitle = STATE.nationalBedsRatio === "absolute" ? bedConfig.xTitle : ratioLabel(STATE.nationalBedsRatio);
    bedRows = bedRows.filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
    horizontalBar(
      "hiNationalBedsChart",
      sortDescending(bedRows, "selected_value"),
      "discipline",
      "selected_value",
      {
        limit: chartLimit(STATE.nationalBedsLimit, 25),
        color: COLORS[2],
        leftMargin: 210,
        xTitle: bedXTitle,
        format: bedFormat,
        hovertemplate: "%{y}<br>" + bedLabel + ": %{text}<extra></extra>"
      }
    );

    renderDischargeTypeChart();
  }

  function chartLimit(value, fallback) {
    if (value === "all") return 999;
    return toNumber(value) || fallback || 25;
  }

  function nationalActivityConfig() {
    var metric = STATE.nationalActivityMetric;
    var mode = STATE.nationalActivityRatio;
    var normalizable = metric === "discharges" || metric === "stay_days" || metric === "ordinary_beds";
    var labels = {
      discharges: "Dimissioni",
      stay_days: "Giornate di degenza",
      ordinary_beds: "Posti letto ordinari",
      avg_los_days: "Degenza media",
      bed_utilization_percent: "Utilizzo posti letto"
    };
    var fields = {
      discharges: "discharges",
      stay_days: "stay_days",
      ordinary_beds: "ordinary_beds",
      avg_los_days: "avg_los_days",
      bed_utilization_percent: "bed_utilization_percent"
    };
    if (metric === "avg_los_days") return { label: labels[metric], field: fields[metric], value: function (row) { return toNumber(row.avg_los_days); }, xTitle: "giorni", format: function (value) { return formatDecimal(value) + " giorni"; }, context: "valore medio" };
    if (metric === "bed_utilization_percent") return { label: labels[metric], field: fields[metric], value: function (row) { return toNumber(row.bed_utilization_percent); }, xTitle: "% utilizzo", format: formatPercent, context: "rapporto giornate/giornate disponibili" };
    if (normalizable && mode !== "absolute") {
      return {
        label: labels[metric] + " " + ratioLabel(mode),
        field: fields[metric],
        value: function (row) { return normalizedValue(row, fields[metric], mode); },
        xTitle: ratioLabel(mode),
        format: formatDecimal,
        context: ratioLabel(mode)
      };
    }
    return { label: labels[metric] || labels.discharges, field: fields[metric] || "discharges", value: function (row) { return toNumber(row[fields[metric] || "discharges"]); }, xTitle: metric === "ordinary_beds" ? "posti letto ordinari" : (metric === "stay_days" ? "giornate" : "dimissioni"), format: formatNumber, context: "valore assoluto" };
  }

  function nationalActivityRows() {
    if (STATE.nationalActivityRegion !== "Italia" && STATE.nationalActivityProvince !== "all") {
      return tableRows("activity_by_province_discipline").filter(function (row) {
        return row.region === STATE.nationalActivityRegion && row.province === STATE.nationalActivityProvince;
      });
    }
    if (STATE.nationalActivityRegion !== "Italia") {
      return tableRows("activity_by_region_discipline").filter(function (row) {
        return row.region === STATE.nationalActivityRegion;
      });
    }
    return tableRows("activity_by_discipline");
  }

  function bedMetricConfig(metric) {
    if (metric === "ordinary_beds") return { label: "Posti letto ordinari", field: "ordinary_beds", xTitle: "posti letto ordinari" };
    if (metric === "day_hospital_beds") return { label: "Posti letto day hospital", field: "day_hospital_beds", xTitle: "posti letto day hospital" };
    if (metric === "day_surgery_beds") return { label: "Posti letto day surgery", field: "day_surgery_beds", xTitle: "posti letto day surgery" };
    return { label: "Posti letto totali", field: "total_beds", xTitle: "posti letto" };
  }

  function latestRow(rows) {
    rows = toArray(rows);
    if (!rows.length) return null;
    rows.sort(function (a, b) { return (toNumber(b.year) || 0) - (toNumber(a.year) || 0); });
    return rows[0];
  }

  function renderDischargeTypeChart() {
    var region = STATE.dischargeRegion;
    var rows = region === "Italia" ? tableRows("discharge_type_national") : tableRows("discharge_type_by_region").filter(function (row) {
      return row.region === region;
    });
    var row = latestRow(rows);
    if (!row) {
      showEmptyChart("hiDischargeTypeChart");
      return;
    }
    var labels = ["A domicilio", "Trasferimenti", "Decessi"];
    var values = [row.home_discharges, row.transfers, row.deaths].map(function (value) { return toNumber(value) || 0; });
    plot("hiDischargeTypeChart", [{
      type: "bar",
      x: labels,
      y: values,
      marker: { color: [COLORS[2], COLORS[4], COLORS[5]] },
      hovertemplate: "%{x}: %{y:,.0f}<extra></extra>"
    }], {
      margin: { t: 18, r: 18, b: 54, l: 78 },
      yaxis: { title: "dimissioni note" }
    });
    var note = byId("hiDischargeTypeNote");
    if (note) {
      note.textContent = "Fonte: Ministero della Salute, SDO per tipologia di dimissione. Elaborazione di Nazareno Lecis. Anno " + row.year + ". Celle oscurate nella selezione: " + formatNumber(row.masked_cells) + ". Le celle oscurate non sono trattate come zero.";
    }
  }

  function ratioMode() {
    return STATE.ratioMode || "auto";
  }

  function ratioModeLabel() {
    return RATIO_MODES[ratioMode()] || RATIO_MODES.auto;
  }

  function regionalMetricConfig() {
    var mode = ratioMode();
    var metric = METRICS[STATE.metric] || METRICS.discharges;
    if (STATE.metric === "discharges") {
      if (mode === "absolute") return { label: "Dimissioni", value: function (row) { return toNumber(row.discharges); }, xTitle: "dimissioni", format: formatNumber };
      if (mode === "population_65_plus") return { label: "Dimissioni per 1.000 residenti 65+", value: function (row) { return toNumber(row.discharges_per_1000_over65); }, xTitle: "per 1.000 residenti 65+", format: formatDecimal };
      if (mode === "population_75_plus") return { label: "Dimissioni per 1.000 residenti 75+", value: function (row) { return toNumber(row.discharges_per_1000_over75); }, xTitle: "per 1.000 residenti 75+", format: formatDecimal };
      if (mode === "gdp") return { label: "Dimissioni per miliardo di PIL", value: function (row) { return toNumber(row.discharges_per_billion_gdp); }, xTitle: "dimissioni per mld PIL", format: formatDecimal };
      return { label: "Dimissioni per 1.000 residenti", value: function (row) { return toNumber(row.discharges_per_1000); }, xTitle: "per 1.000 residenti", format: formatDecimal };
    }
    if (STATE.metric === "total_beds") {
      if (mode === "absolute") return { label: "Posti letto", value: function (row) { return toNumber(row.total_beds); }, xTitle: "posti letto", format: formatNumber };
      if (mode === "population_65_plus") return { label: "Posti letto per 1.000 residenti 65+", value: function (row) { return toNumber(row.beds_per_1000_over65); }, xTitle: "per 1.000 residenti 65+", format: formatDecimal };
      if (mode === "population_75_plus") return { label: "Posti letto per 1.000 residenti 75+", value: function (row) { return toNumber(row.beds_per_1000_over75); }, xTitle: "per 1.000 residenti 75+", format: formatDecimal };
      if (mode === "gdp") return { label: "Posti letto per miliardo di PIL", value: function (row) { return toNumber(row.beds_per_billion_gdp); }, xTitle: "posti letto per mld PIL", format: formatDecimal };
      return { label: "Posti letto per 1.000 residenti", value: function (row) { return toNumber(row.beds_per_1000); }, xTitle: "per 1.000 residenti", format: formatDecimal };
    }
    if (STATE.metric === "ssn_cost_eur") {
      if (mode === "absolute") return { label: "Costo SSN", value: function (row) { return (toNumber(row.ssn_cost_eur) || 0) / 1000000000; }, xTitle: "miliardi di euro", format: function (value) { return formatDecimal(value) + " mld euro"; } };
      if (mode === "population_65_plus") return { label: "Costo SSN per residente 65+", value: function (row) { return toNumber(row.ssn_cost_per_over65_eur); }, xTitle: "euro per residente 65+", format: formatEuroDecimal };
      if (mode === "population_75_plus") return { label: "Costo SSN per residente 75+", value: function (row) { return toNumber(row.ssn_cost_per_over75_eur); }, xTitle: "euro per residente 75+", format: formatEuroDecimal };
      if (mode === "gdp") return { label: "Costo SSN in rapporto al PIL", value: function (row) { return toNumber(row.ssn_cost_percent_gdp); }, xTitle: "% del PIL", format: formatPercent };
      return { label: "Costo SSN pro capite", value: function (row) { return toNumber(row.ssn_cost_per_capita_eur); }, xTitle: "euro per abitante", format: formatEuroDecimal };
    }
    if (STATE.metric === "mobility_balance_eur") {
      if (mode === "population_total" || mode === "clinical") return { label: "Saldo mobilita per abitante", value: function (row) { return toNumber(row.mobility_balance_per_capita_eur); }, xTitle: "euro per abitante", format: formatEuroDecimal, signed: true };
      if (mode === "population_65_plus") return { label: "Saldo mobilita per residente 65+", value: function (row) { return toNumber(row.mobility_balance_per_over65_eur); }, xTitle: "euro per residente 65+", format: formatEuroDecimal, signed: true };
      if (mode === "population_75_plus") return { label: "Saldo mobilita per residente 75+", value: function (row) { return toNumber(row.mobility_balance_per_over75_eur); }, xTitle: "euro per residente 75+", format: formatEuroDecimal, signed: true };
      if (mode === "gdp") return { label: "Saldo mobilita in rapporto al PIL", value: function (row) { return toNumber(row.mobility_balance_percent_gdp); }, xTitle: "% del PIL", format: formatPercent, signed: true };
      return { label: "Saldo mobilita", value: function (row) { return toNumber(row.mobility_balance_million_eur); }, xTitle: "milioni di euro", format: formatMillionEuro, signed: true };
    }
    return {
      label: metric.label,
      value: function (row) { return toNumber(row[metric.field]); },
      xTitle: metric.label,
      format: metric.format || formatDecimal
    };
  }

  function renderRegionalRank() {
    var config = regionalMetricConfig();
    var rows = tableRows("regional_summary").map(function (row) {
      var copy = Object.assign({}, row);
      copy.selected_metric = config.value(row);
      return copy;
    }).filter(function (row) {
      return toNumber(row.selected_metric) !== null;
    });
    rows.sort(function (a, b) { return (toNumber(b.selected_metric) || 0) - (toNumber(a.selected_metric) || 0); });
    var title = byId("hiRegionalRankTitle");
    var tag = byId("hiRegionalRankTag");
    if (title) title.textContent = config.label;
    if (tag) tag.textContent = (STATE.region === "Italia" ? "tutte le regioni" : "focus " + STATE.region) + " - " + ratioModeLabel();
    horizontalBar("hiRegionalRankChart", rows, "region", "selected_metric", {
      limit: 21,
      highlight: STATE.region,
      leftMargin: 150,
      xTitle: config.xTitle,
      format: config.format,
      colorFor: config.signed ? function (row) { return toNumber(row.selected_metric) < 0 ? COLORS[5] : COLORS[2]; } : null,
      hovertemplate: "%{y}<br>" + config.label + ": %{text}<extra></extra>"
    });
  }

  function selectedRegionalRow() {
    if (STATE.region === "Italia") return null;
    return tableRows("regional_summary").find(function (row) { return row.region === STATE.region; }) || null;
  }

  function renderRegionProfile() {
    var container = byId("hiRegionProfile");
    clear(container);
    var national = STATE.payload.national || {};
    var row = selectedRegionalRow();
    var title = STATE.region === "Italia" ? "Italia" : STATE.region;
    var items;
    if (!row) {
      items = [
        ["Territorio", title, "somma nazionale dei territori disponibili"],
        ["Dimissioni", formatNumber((national.activity || {}).discharges), formatDecimal((national.activity || {}).discharges_per_1000) + " per 1.000 residenti"],
        ["Posti letto", formatNumber((national.beds || {}).total_beds), formatDecimal((national.beds || {}).beds_per_1000) + " per 1.000 residenti"],
        ["Costo SSN", formatEuroCompact((national.costs || {}).amount_eur), formatEuroDecimal((national.costs || {}).cost_per_capita_eur) + " pro capite; " + formatPercent((national.costs || {}).cost_percent_gdp) + " del PIL"],
        ["Popolazione 75+", formatNumber((national.population || {}).population_75_plus), formatPercent((national.population || {}).elderly_75_share_percent) + " dei residenti"],
        ["Saldo mobilita", formatEuroCompact((national.mobility || {}).balance_eur), formatEuroDecimal((national.mobility || {}).balance_per_capita_eur) + " per abitante"]
      ];
    } else {
      items = [
        ["Territorio", row.region, formatNumber(row.population_total) + " residenti ISTAT 2026"],
        ["Dimissioni", formatNumber(row.discharges), formatDecimal(row.discharges_per_1000) + " per 1.000, rank " + asText(row.rank_discharges_per_1000)],
        ["Posti letto", formatNumber(row.total_beds), formatDecimal(row.beds_per_1000) + " per 1.000, rank " + asText(row.rank_beds_per_1000)],
        ["Costo SSN", formatEuroCompact(row.ssn_cost_eur), formatEuroDecimal(row.ssn_cost_per_capita_eur) + " pro capite; " + formatPercent(row.ssn_cost_percent_gdp) + " del PIL"],
        ["Popolazione 75+", formatNumber(row.population_75_plus), formatPercent(row.elderly_75_share_percent) + " dei residenti"],
        ["Saldo mobilita", formatEuroCompact(row.mobility_balance_eur), formatEuroDecimal(row.mobility_balance_per_capita_eur) + " per abitante, rank " + asText(row.rank_mobility_balance)]
      ];
    }
    items.forEach(function (item) {
      var card = create("div", "hi-profile-item");
      card.appendChild(create("span", "", item[0]));
      card.appendChild(create("strong", "", item[1]));
      card.appendChild(create("small", "", item[2]));
      container.appendChild(card);
    });
  }

  function renderRegionalSummaryTable() {
    createTable("hiRegionalSummaryTable", filteredByRegion(tableRows("regional_summary")), tableOption("regional_summary").columns, 30);
  }

  function disciplineRate(row) {
    var denominator = STATE.denominator;
    if (denominator === "auto") return toNumber(row.discharges_per_1000_relevant);
    var value = denominatorValueForRow(row, denominator);
    if (!value) return null;
    return ((toNumber(row.discharges) || 0) / value) * 1000;
  }

  function disciplineMetricConfig() {
    var metric = STATE.disciplineMetric;
    if (metric === "discharges") return { label: "Dimissioni", field: "discharges", xTitle: "dimissioni", format: formatNumber };
    if (metric === "stay_days") return { label: "Giornate di degenza", field: "stay_days", xTitle: "giornate", format: formatNumber };
    if (metric === "avg_los_days") return { label: "Degenza media", field: "avg_los_days", xTitle: "giorni", format: function (value) { return formatDecimal(value) + " giorni"; } };
    if (metric === "bed_utilization_percent") return { label: "Utilizzo posti letto", field: "bed_utilization_percent", xTitle: "% utilizzo", format: formatPercent };
    if (metric === "ordinary_beds") return { label: "Posti letto ordinari", field: "ordinary_beds", xTitle: "posti letto ordinari", format: formatNumber };
    return { label: "Dimissioni per 1.000", field: "selected_value", xTitle: "dimissioni per 1.000", format: formatDecimal, rate: true };
  }

  function renderDiscipline() {
    var config = disciplineMetricConfig();
    var provinceLevel = STATE.disciplineRegion !== "Italia";
    var rows = (provinceLevel ? tableRows("activity_by_province_discipline") : tableRows("activity_by_region_discipline")).filter(function (row) {
      if (row.discipline !== STATE.discipline) return false;
      if (!provinceLevel) return true;
      if (row.region !== STATE.disciplineRegion) return false;
      return STATE.disciplineProvince === "all" || row.province === STATE.disciplineProvince;
    }).map(function (row) {
      var copy = Object.assign({}, row);
      copy.selected_value = config.rate ? disciplineRate(row) : toNumber(row[config.field]);
      copy.territory_label = provinceLevel ? provinceLabel(row.region, row.province) : row.region;
      return copy;
    });
    rows.sort(function (a, b) { return (toNumber(b.selected_value) || 0) - (toNumber(a.selected_value) || 0); });
    var title = byId("hiDisciplineRegionTitle");
    var tag = byId("hiDisciplineRegionTag");
    var denominatorLabel = STATE.denominator === "auto" ? "automatico" : DENOMINATORS[STATE.denominator];
    var territory = territoryLabel(STATE.disciplineRegion, STATE.disciplineProvince);
    if (title) title.textContent = STATE.discipline || "Disciplina";
    if (tag) tag.textContent = territory + " - " + (config.rate ? "per 1.000, denominatore " + denominatorLabel : config.label);
    horizontalBar("hiDisciplineRegionChart", rows, "territory_label", "selected_value", {
      limit: provinceLevel ? 40 : 21,
      highlight: provinceLevel ? STATE.disciplineProvince : STATE.disciplineRegion,
      highlightField: provinceLevel ? "province" : "region",
      leftMargin: provinceLevel ? 190 : 150,
      xTitle: config.xTitle,
      format: config.format,
      hovertemplate: "%{y}<br>" + config.label + ": %{text}<extra></extra>"
    });
    var note = byId("hiDisciplineNote");
    if (note) {
      var source = "Fonte: Ministero della Salute, dati di attivita dei reparti; ISTAT POSAS 2026 per denominatori. Elaborazione di Nazareno Lecis. ";
      note.textContent = source + (config.rate ? "Denominatore selezionato: " + denominatorLabel + ". La tabella riporta anche volumi assoluti, degenza media e utilizzo dei posti letto." : "Misura selezionata: " + config.label + ". I tassi per popolazione restano disponibili cambiando misura.");
    }
    var tableColumns = [
      [provinceLevel ? "province" : "region", provinceLevel ? "Provincia" : "Regione"],
      ["discipline", "Disciplina"],
      ["discharges", "Dimissioni"],
      ["selected_value", config.label],
      ["relevant_denominator", "Denom. auto"],
      ["avg_los_days", "Degenza media"],
      ["bed_utilization_percent", "Utilizzo PL"]
    ];
    if (provinceLevel) tableColumns.splice(1, 0, ["province_name", "Nome provincia"]);
    createTable("hiDisciplineTable", rows, tableColumns, 80);
  }

  function costMetricConfig() {
    var mode = STATE.costRatio || "population_total";
    if (mode === "population_65_plus") return { label: "per residente 65+", field: "amount_per_over65_eur", xTitle: "euro per residente 65+", format: formatEuroDecimal };
    if (mode === "population_75_plus") return { label: "per residente 75+", field: "amount_per_over75_eur", xTitle: "euro per residente 75+", format: formatEuroDecimal };
    if (mode === "gdp") return { label: "in rapporto al PIL", field: "amount_percent_gdp", xTitle: "% del PIL", format: formatPercent };
    if (mode === "discharges") return { label: "per dimissione ospedaliera", field: "amount_per_discharge_eur", xTitle: "euro per dimissione", format: formatEuroDecimal };
    if (mode === "absolute") return { label: "totale", field: "amount_billion", xTitle: "miliardi di euro", format: function (value) { return formatDecimal(value) + " mld euro"; } };
    return { label: "pro capite", field: "amount_per_capita_eur", xTitle: "euro per abitante", format: formatEuroDecimal };
  }

  function renderCosts() {
    var costType = STATE.costType;
    var label = costLabel(costType);
    var config = costMetricConfig();
    var rows = tableRows("cost_by_region_category").filter(function (row) {
      return row.cost_type === costType;
    }).map(function (row) {
      var copy = Object.assign({}, row);
      copy.amount_billion = (toNumber(row.amount_eur) || 0) / 1000000000;
      return copy;
    });
    rows.sort(function (a, b) { return (toNumber(b[config.field]) || 0) - (toNumber(a[config.field]) || 0); });
    var title = byId("hiCostRegionTitle");
    if (title) title.textContent = label + " per regione - " + config.label;
    horizontalBar("hiCostRegionChart", rows, "region", config.field, {
      limit: 21,
      highlight: STATE.costRegion,
      color: COLORS[3],
      leftMargin: 150,
      xTitle: config.xTitle,
      format: config.format,
      hovertemplate: "%{y}<br>" + label + ": %{text}<extra></extra>"
    });

    var compositionRegion = STATE.costCompositionRegion || "Italia";
    var composition = (compositionRegion === "Italia" ? tableRows("cost_national") : tableRows("cost_by_region_category").filter(function (row) {
      return row.region === compositionRegion;
    })).filter(function (row) {
      return row.cost_type !== "totali";
    }).map(function (row) {
      var copy = Object.assign({}, row);
      copy.amount_billion = (toNumber(row.amount_eur) || 0) / 1000000000;
      return copy;
    });
    var compositionTitle = byId("hiCostCompositionTitle");
    if (compositionTitle) compositionTitle.textContent = "Composizione dei costi - " + compositionRegion;
    horizontalBar("hiCostCompositionChart", sortDescending(composition, "amount_billion"), "cost_label", "amount_billion", {
      limit: 8,
      color: COLORS[4],
      leftMargin: 230,
      xTitle: "miliardi di euro",
      hovertemplate: "%{y}<br>Importo: %{x:,.2f} mld euro<extra></extra>"
    });

    var displayRows = STATE.costRegion === "Italia" ? rows : rows.filter(function (row) { return row.region === STATE.costRegion; });
    createTable("hiCostTable", displayRows, tableOption("cost_by_region_category").columns, 40);
  }

  function costLabel(costType) {
    var match = toArray(STATE.payload.filters && STATE.payload.filters.cost_types).find(function (row) {
      return row.id === costType;
    });
    return match ? match.label : costType;
  }

  function renderSeries() {
    renderBedsSeries();
    renderPharmaSeries();
  }

  function renderBedsSeries() {
    var region = STATE.bedsSeriesRegion;
    var metric = bedMetricConfig(STATE.bedsSeriesMetric);
    var source = tableRows("beds_by_region_year");
    var rows;
    if (region === "Italia") {
      var grouped = {};
      source.forEach(function (row) {
        grouped[row.year] = (grouped[row.year] || 0) + (toNumber(row[metric.field]) || 0);
      });
      rows = Object.keys(grouped).map(function (year) {
        var item = { year: Number(year) };
        item[metric.field] = grouped[year];
        return item;
      });
    } else {
      rows = source.filter(function (row) { return row.region === region; });
    }
    rows = rows.map(function (row) {
      var copy = Object.assign({}, row);
      copy.selected_value = normalizedValue(row, metric.field, STATE.bedsSeriesRatio);
      return copy;
    });
    rows.sort(function (a, b) { return a.year - b.year; });
    var title = byId("hiBedsSeriesTitle");
    if (title) title.textContent = metric.label + " nel tempo - " + region + " - " + ratioLabel(STATE.bedsSeriesRatio);
    var valueFormat = STATE.bedsSeriesRatio === "absolute" ? "%{y:,.0f}" : "%{y:,.2f}";
    lineChart("hiBedsSeriesChart", [{
      type: "scatter",
      mode: "lines+markers",
      name: metric.label,
      x: rows.map(function (row) { return row.year; }),
      y: rows.map(function (row) { return row.selected_value; }),
      line: { color: COLORS[2], width: 3 },
      marker: { size: 8 },
      hovertemplate: "%{x}<br>" + metric.label + ": " + valueFormat + "<extra></extra>"
    }], { yTitle: STATE.bedsSeriesRatio === "absolute" ? metric.xTitle : ratioLabel(STATE.bedsSeriesRatio) });
  }

  function renderPharmaSeries() {
    var region = STATE.pharmaRegion;
    var rows = tableRows("pharma_series").filter(function (row) {
      return row.region === region;
    });
    if (STATE.pharmaLabel !== "all") {
      rows = rows.filter(function (row) { return row.cost_label === STATE.pharmaLabel; });
    }
    var labels = unique(rows.map(function (row) { return row.cost_label; }));
    var traces = labels.map(function (label, index) {
      var series = rows.filter(function (row) { return row.cost_label === label; }).sort(function (a, b) { return a.year - b.year; });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: label,
        x: series.map(function (row) { return row.year; }),
        y: series.map(function (row) { return (toNumber(row.amount_eur) || 0) / 1000000000; }),
        line: { color: COLORS[index % COLORS.length], width: 3 },
        marker: { size: 7 },
        hovertemplate: "%{x}<br>%{y:,.2f} mld euro<extra></extra>"
      };
    });
    var title = byId("hiPharmaSeriesTitle");
    if (title) title.textContent = "Spesa farmaceutica - " + region;
    lineChart("hiPharmaSeriesChart", traces, { yTitle: "miliardi di euro" });
  }

  function renderHospitals() {
    var rows = tableRows("hospital_activity_top");
    if (STATE.hospitalRegion !== "Italia") rows = rows.filter(function (row) { return row.region === STATE.hospitalRegion; });
    if (STATE.hospitalProvince !== "all") rows = rows.filter(function (row) { return row.province === STATE.hospitalProvince; });
    if (STATE.hospitalDiscipline !== "all") rows = rows.filter(function (row) { return row.main_discipline === STATE.hospitalDiscipline; });
    rows = sortDescending(rows, "discharges");
    var title = byId("hiHospitalTitle");
    if (title) title.textContent = "Top strutture per dimissioni - " + territoryLabel(STATE.hospitalRegion, STATE.hospitalProvince);
    horizontalBar("hiHospitalChart", rows, "structure", "discharges", {
      limit: 22,
      color: COLORS[6],
      leftMargin: 260,
      labelLength: 42,
      xTitle: "dimissioni",
      hovertemplate: "%{y}<br>Dimissioni: %{x:,.0f}<extra></extra>"
    });
    createTable("hiHospitalTable", rows, tableOption("hospital_activity_top").columns, 80);
  }

  function renderMobility() {
    renderMobilitySankey();
    renderMobilityHospitalSankey();
    renderMobilityBalance();
    renderMobilitySeries();
    renderMobilityTable();
  }

  function renderMobilitySankey() {
    var minValue = toNumber(STATE.mobilitySankeyMin) || 0;
    var rows = mobilityRegionalNetLinks(minValue);
    if (!rows.length) {
      showEmptyChart("hiMobilitySankeyChart", "Saldi regionali non disponibili nel payload");
      return;
    }
    var labels = [];
    rows.forEach(function (row) {
      if (labels.indexOf(row.source) === -1) labels.push(row.source);
      if (labels.indexOf(row.target) === -1) labels.push(row.target);
    });
    var source = rows.map(function (row) { return labels.indexOf(row.source); });
    var target = rows.map(function (row) { return labels.indexOf(row.target); });
    var values = rows.map(function (row) { return toNumber(row.value_million_eur) || 0; });
    var linkColors = rows.map(function (row) {
      return row.flow_type === "saldo netto regionale" ? "rgba(58, 166, 161, .52)" : "rgba(217, 173, 72, .48)";
    });
    var passiveRegions = rows.map(function (row) { return row.source; });
    plot("hiMobilitySankeyChart", [{
      type: "sankey",
      arrangement: "snap",
      node: {
        label: labels,
        pad: 14,
        thickness: 16,
        color: labels.map(function (label) {
          return passiveRegions.indexOf(label) !== -1 ? COLORS[5] : COLORS[2];
        }),
        line: { color: cssVar("--line", "#303030"), width: 1 }
      },
      link: {
        source: source,
        target: target,
        value: values,
        color: linkColors,
        customdata: rows.map(function (row) { return formatMillionEuro(row.value_million_eur); }),
        hovertemplate: "%{source.label} -> %{target.label}<br>%{customdata}<extra></extra>"
      }
    }], {
      margin: { t: 12, r: 12, b: 16, l: 12 }
    });
    var note = byId("hiMobilitySankeyNote");
    if (note) {
      note.textContent = "Fonte: Corte dei conti, saldi economici della mobilita sanitaria. Elaborazione di Nazareno Lecis. Le compensazioni economiche derivano dai flussi di prestazioni/pazienti, ma il saldo netto non conserva la coppia origine-destinazione reale; il grafico abbina regioni con saldo passivo a regioni con saldo attivo per rappresentare i saldi netti 2024.";
    }
  }

  function mobilityRegionalNetLinks(minValue) {
    var passive = [];
    var active = [];
    tableRows("mobility_balance").forEach(function (row) {
      if (row.year !== 2024) return;
      var value = toNumber(row.balance_million_eur);
      if (value === null || value === 0) return;
      if (value < 0) passive.push({ region: row.region, remaining: Math.abs(value) });
      if (value > 0) active.push({ region: row.region, remaining: value });
    });
    passive.sort(function (a, b) { return b.remaining - a.remaining; });
    active.sort(function (a, b) { return b.remaining - a.remaining; });
    var links = [];
    var i = 0;
    var j = 0;
    while (i < passive.length && j < active.length) {
      var value = Math.min(passive[i].remaining, active[j].remaining);
      if (value >= minValue) {
        links.push({
          source: passive[i].region,
          target: active[j].region,
          value_million_eur: roundDisplay(value),
          year: 2024,
          flow_type: "saldo netto regionale"
        });
      }
      passive[i].remaining -= value;
      active[j].remaining -= value;
      if (passive[i].remaining <= 0.001) i += 1;
      if (active[j].remaining <= 0.001) j += 1;
    }
    return links;
  }

  function roundDisplay(value) {
    return Math.round((toNumber(value) || 0) * 1000) / 1000;
  }

  function renderMobilityHospitalSankey() {
    var limit = chartLimit(STATE.mobilityHospitalLimit, 15);
    var rows = tableRows("hospital_activity_top");
    if (STATE.mobilityHospitalRegion !== "Italia") {
      rows = rows.filter(function (row) { return row.region === STATE.mobilityHospitalRegion; });
    }
    rows = sortDescending(rows, "discharges").slice(0, limit);
    if (!rows.length) {
      showEmptyChart("hiMobilityHospitalChart", "Strutture non disponibili nel payload");
      return;
    }
    var labels = [];
    rows.forEach(function (row) {
      if (labels.indexOf(row.region) === -1) labels.push(row.region);
      row._hospital_label = compact(row.structure, 44) + " (" + row.province + ")";
      if (labels.indexOf(row._hospital_label) === -1) labels.push(row._hospital_label);
    });
    var title = byId("hiMobilityHospitalTitle");
    if (title) title.textContent = "Da regione a ospedali piu frequentati - " + STATE.mobilityHospitalRegion;
    plot("hiMobilityHospitalChart", [{
      type: "sankey",
      arrangement: "snap",
      node: {
        label: labels,
        pad: 14,
        thickness: 16,
        color: labels.map(function (label) {
          return rows.some(function (row) { return row.region === label; }) ? COLORS[0] : COLORS[1];
        }),
        line: { color: cssVar("--line", "#303030"), width: 1 }
      },
      link: {
        source: rows.map(function (row) { return labels.indexOf(row.region); }),
        target: rows.map(function (row) { return labels.indexOf(row._hospital_label); }),
        value: rows.map(function (row) { return toNumber(row.discharges) || 0; }),
        color: rows.map(function () { return "rgba(93, 143, 215, .45)"; }),
        customdata: rows.map(function (row) { return row.structure + "<br>" + row.region + ", " + row.province + "<br>Dimissioni: " + formatNumber(row.discharges); }),
        hovertemplate: "%{customdata}<extra></extra>"
      }
    }], {
      margin: { t: 12, r: 12, b: 16, l: 12 }
    });
  }

  function renderMobilityBalance() {
    var config = mobilityMetricConfig();
    var rows = tableRows("regional_summary").filter(function (row) {
      return toNumber(row[config.field]) !== null;
    }).sort(function (a, b) {
      return (toNumber(b[config.field]) || 0) - (toNumber(a[config.field]) || 0);
    });
    var title = byId("hiMobilityBalanceTitle");
    if (title) title.textContent = "Saldo mobilita per regione - " + config.label;
    horizontalBar("hiMobilityBalanceChart", rows, "region", config.field, {
      limit: 21,
      highlight: STATE.mobilitySeriesRegion,
      leftMargin: 150,
      xTitle: config.xTitle,
      format: config.format,
      colorFor: function (row) { return toNumber(row[config.field]) < 0 ? COLORS[5] : COLORS[2]; },
      hovertemplate: "%{y}<br>Saldo: %{text}<extra></extra>"
    });
  }

  function mobilityMetricConfig() {
    var mode = STATE.mobilityRatio;
    if (mode === "population_total") return { label: "per abitante", field: "mobility_balance_per_capita_eur", xTitle: "euro per abitante", format: formatEuroDecimal };
    if (mode === "population_65_plus") return { label: "per residente 65+", field: "mobility_balance_per_over65_eur", xTitle: "euro per residente 65+", format: formatEuroDecimal };
    if (mode === "population_75_plus") return { label: "per residente 75+", field: "mobility_balance_per_over75_eur", xTitle: "euro per residente 75+", format: formatEuroDecimal };
    if (mode === "gdp") return { label: "in rapporto al PIL", field: "mobility_balance_percent_gdp", xTitle: "% del PIL", format: formatPercent };
    return { label: "2024", field: "mobility_balance_million_eur", xTitle: "milioni di euro", format: formatMillionEuro };
  }

  function renderMobilitySeries() {
    var config = mobilitySeriesMetricConfig();
    var source = tableRows("mobility_balance").filter(function (row) {
      return typeof row.year === "number";
    });
    var rows;
    var title = byId("hiMobilitySeriesTitle");
    if (STATE.mobilitySeriesRegion === "Italia") {
      var grouped = {};
      source.forEach(function (row) {
        grouped[row.year] = (grouped[row.year] || 0) + (toNumber(row[config.sourceField]) || 0);
      });
      rows = Object.keys(grouped).map(function (year) {
        var item = { year: Number(year) };
        item[config.sourceField] = grouped[year];
        return item;
      });
      if (title) title.textContent = "Serie storica del saldo - Italia - " + config.xTitle;
    } else {
      rows = source.filter(function (row) { return row.region === STATE.mobilitySeriesRegion; });
      if (title) title.textContent = "Serie storica del saldo - " + STATE.mobilitySeriesRegion + " - " + config.xTitle;
    }
    rows.sort(function (a, b) { return a.year - b.year; });
    lineChart("hiMobilitySeriesChart", [{
      type: "scatter",
      mode: "lines+markers",
      name: STATE.mobilitySeriesRegion,
      x: rows.map(function (row) { return row.year; }),
      y: rows.map(function (row) { return toNumber(row[config.sourceField]) || 0; }),
      line: { color: STATE.mobilitySeriesRegion === "Italia" ? COLORS[1] : COLORS[0], width: 3 },
      marker: { size: 8 },
      hovertemplate: "%{x}<br>Saldo: %{y:,.2f}<extra></extra>"
    }], { yTitle: config.xTitle });
  }

  function mobilitySeriesMetricConfig() {
    var mode = STATE.mobilitySeriesRatio;
    if (mode === "population_total") return { sourceField: "balance_per_capita_eur", xTitle: "euro per abitante" };
    if (mode === "population_65_plus") return { sourceField: "balance_per_over65_eur", xTitle: "euro per residente 65+" };
    if (mode === "population_75_plus") return { sourceField: "balance_per_over75_eur", xTitle: "euro per residente 75+" };
    if (mode === "gdp") return { sourceField: "balance_percent_gdp", xTitle: "% del PIL" };
    return { sourceField: "balance_million_eur", xTitle: "milioni di euro" };
  }

  function renderMobilityTable() {
    var rows = tableRows("mobility_balance").filter(function (row) {
      if (row.year !== 2024) return false;
      return STATE.mobilitySeriesRegion === "Italia" || row.region === STATE.mobilitySeriesRegion;
    }).sort(function (a, b) {
      return (toNumber(b.balance_million_eur) || 0) - (toNumber(a.balance_million_eur) || 0);
    });
    createTable("hiMobilityTable", rows, tableOption("mobility_balance").columns, 40);
  }

  function renderMethod() {
    renderList("hiMethodNotes", STATE.payload.methodology && STATE.payload.methodology.notes);
    renderList("hiMethodWarnings", STATE.payload.methodology && STATE.payload.methodology.comparability_warnings);
    renderDenominatorRules();
    createTable("hiDefinitionsTable", tableRows("definitions"), tableOption("definitions").columns, 30);
    createTable("hiSourcesTable", tableRows("sources"), tableOption("sources").columns, 30);
  }

  function renderList(id, items) {
    var node = byId(id);
    clear(node);
    toArray(items).forEach(function (text) {
      node.appendChild(create("li", "", text));
    });
  }

  function renderDenominatorRules() {
    var container = byId("hiDenominatorRules");
    clear(container);
    toArray(STATE.payload.methodology && STATE.payload.methodology.denominator_rules).forEach(function (rule) {
      var item = create("div", "hi-coverage-item");
      item.appendChild(create("strong", "", rule.label));
      item.appendChild(create("span", "", rule.keywords && rule.keywords.length ? "Parole chiave: " + rule.keywords.join(", ") : "Regola generale se non ci sono parole chiave cliniche."));
      item.appendChild(create("em", "", rule.denominator));
      container.appendChild(item);
    });
  }

  function unique(values) {
    var seen = {};
    return values.filter(function (value) {
      if (!value || seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function filteredByRegion(rows) {
    if (STATE.region === "Italia") return toArray(rows);
    return toArray(rows).filter(function (row) {
      return !row.region || row.region === STATE.region;
    });
  }

  function rowText(row) {
    return Object.keys(row || {}).map(function (key) { return asText(row[key], ""); }).join(" ").toLowerCase();
  }

  function rowMatchesExplorer(row) {
    if (row.region && STATE.tableRegion !== "Italia" && row.region !== STATE.tableRegion) return false;
    if (row.province && STATE.tableProvince !== "all" && row.province !== STATE.tableProvince) return false;
    if (row.discipline && STATE.tableDiscipline !== "all" && row.discipline !== STATE.tableDiscipline) return false;
    if (row.cost_type && row.cost_type !== STATE.costType && STATE.table.indexOf("cost") !== -1) return false;
    var term = STATE.search.trim().toLowerCase();
    return !term || rowText(row).indexOf(term) !== -1;
  }

  function filteredTableRows(tableName) {
    return tableRows(tableName).filter(rowMatchesExplorer);
  }

  function tableOption(id) {
    for (var i = 0; i < TABLE_OPTIONS.length; i += 1) {
      if (TABLE_OPTIONS[i].id === id) return TABLE_OPTIONS[i];
    }
    return { id: id, label: id, columns: null };
  }

  function createTable(containerId, tableRowsValue, columns, limit) {
    var container = byId(containerId);
    if (!container) return;
    clear(container);
    var rows = toArray(tableRowsValue).slice(0, limit || 120);
    columns = columns && columns.length ? columns : inferColumns(rows);

    var table = create("table", "hi-table");
    var thead = document.createElement("thead");
    var headerRow = document.createElement("tr");
    columns.forEach(function (column) {
      headerRow.appendChild(create("th", "", column[1] || column[0]));
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    if (!rows.length) {
      var emptyRow = document.createElement("tr");
      var emptyCell = create("td", "", "Nessun dato disponibile");
      emptyCell.colSpan = Math.max(1, columns.length);
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
    } else {
      rows.forEach(function (row) {
        var tr = document.createElement("tr");
        columns.forEach(function (column) {
          var key = column[0];
          var td = document.createElement("td");
          var value = row[key];
          if (key === "url" && /^https?:\/\//i.test(asText(value, ""))) {
            var link = document.createElement("a");
            link.href = value;
            link.target = "_blank";
            link.rel = "noopener";
            link.textContent = "pagina ufficiale";
            td.appendChild(link);
          } else if (key === "region" || key === "discipline" || key === "structure" || key === "indicator" || key === "name" || key === "provider") {
            var strong = document.createElement("strong");
            strong.textContent = compact(value, key === "structure" ? 72 : 56);
            td.appendChild(strong);
          } else {
            td.textContent = compact(formatCell(key, value), 96);
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function inferColumns(rows) {
    var first = rows && rows.length ? rows[0] : {};
    return Object.keys(first).slice(0, 8).map(function (key) { return [key, key.replace(/_/g, " ")]; });
  }

  function renderExplorer() {
    var option = tableOption(STATE.table);
    var rows = filteredTableRows(STATE.table);
    var title = byId("hiTableTitle");
    var count = byId("hiTableCount");
    if (title) title.textContent = option.label;
    if (count) count.textContent = formatNumber(rows.length) + " righe";
    createTable("hiTableExplorer", rows, option.columns, 250);
  }

  function renderDynamic() {
    refreshProvinceFilters();
    renderNationalCharts();
    renderRegionalRank();
    renderRegionProfile();
    renderRegionalSummaryTable();
    renderDiscipline();
    renderCosts();
    renderSeries();
    renderHospitals();
    renderMobility();
    renderExplorer();
  }

  function renderAll() {
    setupFilters();
    renderKpis();
    renderDynamic();
    renderMethod();
  }

  function fetchJson(url) {
    return fetch(url, { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    });
  }

  function loadPayload(index) {
    index = index || 0;
    if (index >= DATA_SOURCES.length) {
      setStatus("Dati non disponibili. La dashboard si aggiornera quando il payload sara pubblicato.", "error");
      return;
    }
    fetchJson(DATA_SOURCES[index]).then(function (payload) {
      STATE.payload = payload;
      var generated = payload.meta && payload.meta.generated_at ? payload.meta.generated_at.replace("T", " ").replace("+00:00", " UTC") : "";
      setStatus("Dati caricati: " + generated);
      renderAll();
    }).catch(function () {
      loadPayload(index + 1);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindControls();
    loadPayload(0);
  });
})();
