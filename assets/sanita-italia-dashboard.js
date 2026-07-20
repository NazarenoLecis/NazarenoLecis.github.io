(function () {
  "use strict";

  var DATA_SOURCES = [
    "../../data/sanita-italia/dashboard.json?v=20260720-2",
    "https://data.nazarenolecis.com/sanita-italia/dashboard.json?v=20260720-2",
    "https://raw.githubusercontent.com/NazarenoLecis/nazarenolecis-data-pipeline/main/publish/sanita-italia/dashboard.json"
  ];

  var STATE = {
    payload: null,
    region: "Italia",
    discipline: "",
    metric: "discharges_per_1000",
    denominator: "auto",
    costType: "totali",
    table: "regional_summary",
    search: ""
  };

  var COLORS = ["#ff5a1f", "#5d8fd7", "#3aa6a1", "#65a96b", "#d9ad48", "#d96666", "#9c7ad9", "#8f8f8f"];
  var MISSING = "ND";

  var METRICS = {
    discharges: { label: "Dimissioni", field: "discharges", format: formatNumber },
    discharges_per_1000: { label: "Dimissioni per 1.000 residenti", field: "discharges_per_1000", format: formatDecimal },
    discharges_per_1000_over65: { label: "Dimissioni per 1.000 residenti 65+", field: "discharges_per_1000_over65", format: formatDecimal },
    total_beds: { label: "Posti letto", field: "total_beds", format: formatNumber },
    beds_per_1000: { label: "Posti letto per 1.000 residenti", field: "beds_per_1000", format: formatDecimal },
    beds_per_1000_over75: { label: "Posti letto per 1.000 residenti 75+", field: "beds_per_1000_over75", format: formatDecimal },
    ssn_cost_eur: { label: "Costo SSN", field: "ssn_cost_eur", format: formatEuroCompact },
    ssn_cost_per_capita_eur: { label: "Costo SSN pro capite", field: "ssn_cost_per_capita_eur", format: formatEuro },
    ssn_cost_per_over65_eur: { label: "Costo SSN per residente 65+", field: "ssn_cost_per_over65_eur", format: formatEuro },
    bed_utilization_percent: { label: "Utilizzo posti letto", field: "bed_utilization_percent", format: formatPercent },
    avg_los_days: { label: "Degenza media", field: "avg_los_days", format: function (value) { return formatDecimal(value) + " giorni"; } }
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
        ["total_beds", "Posti letto"],
        ["beds_per_1000", "PL/1.000"],
        ["ssn_cost_eur", "Costo SSN"],
        ["ssn_cost_per_capita_eur", "Euro pro capite"],
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
        ["day_surgery_beds", "PL DS"]
      ]
    },
    {
      id: "cost_by_region_category",
      label: "Costi regionali",
      columns: [
        ["region", "Regione"],
        ["cost_label", "Voce"],
        ["amount_eur", "Importo"],
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

  function formatEuroCompact(value) {
    var number = toNumber(value);
    if (number === null) return MISSING;
    if (Math.abs(number) >= 1000000000) return (number / 1000000000).toLocaleString("it-IT", { maximumFractionDigits: 1 }) + " mld euro";
    if (Math.abs(number) >= 1000000) return (number / 1000000).toLocaleString("it-IT", { maximumFractionDigits: 1 }) + " mln euro";
    return formatEuro(number);
  }

  function formatCell(column, value) {
    if (/eur$/i.test(column) || column === "amount_eur" || column === "ssn_cost_eur") return formatEuroCompact(value);
    if (/percent$/i.test(column)) return formatPercent(value);
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
    var colors = rows.map(function (row) {
      return options.highlight && row.region === options.highlight ? COLORS[0] : (options.color || COLORS[1]);
    });
    plot(id, [{
      type: "bar",
      orientation: "h",
      x: values,
      y: labels,
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

    fillSelect("hiRegionFilter", [{ value: "Italia", label: "Italia" }].concat(toArray(filters.regions).map(function (region) {
      return { value: region, label: region };
    })), STATE.region);

    fillSelect("hiDisciplineFilter", disciplineRows.map(function (row) {
      return { value: row.discipline, label: row.discipline };
    }), STATE.discipline);

    fillSelect("hiCostTypeFilter", toArray(filters.cost_types).map(function (row) {
      return { value: row.id, label: row.label };
    }), STATE.costType);

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
      ["hiRegionFilter", "region"],
      ["hiDisciplineFilter", "discipline"],
      ["hiMetricFilter", "metric"],
      ["hiDenominatorFilter", "denominator"],
      ["hiCostTypeFilter", "costType"],
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

    var download = byId("hiDownloadCsv");
    if (download) download.addEventListener("click", downloadCurrentCsv);
  }

  function renderKpis() {
    var payload = STATE.payload;
    var national = payload.national || {};
    var kpis = payload.kpis || {};
    var activity = national.activity || {};
    var beds = national.beds || {};
    var costs = national.costs || {};
    var pop = national.population || {};
    var items = [
      ["Dimissioni ospedaliere", activity.discharges, "anno " + asText(activity.year), formatDecimal(activity.discharges_per_1000) + " per 1.000 residenti"],
      ["Discipline", kpis.disciplines, "reparti ospedalieri", "classificate nella fonte Ministero"],
      ["Giornate di degenza", activity.stay_days, "anno " + asText(activity.year), "degenza media " + formatDecimal(activity.avg_los_days) + " giorni"],
      ["Posti letto", beds.total_beds, "anno " + asText(beds.year), formatDecimal(beds.beds_per_1000) + " per 1.000 residenti"],
      ["Costo SSN", costs.amount_eur, "conto economico " + asText(costs.year), formatEuro(costs.cost_per_capita_eur) + " pro capite"],
      ["Popolazione 65+", pop.population_65_plus, "ISTAT 2026", formatPercent(pop.elderly_65_share_percent) + " della popolazione"],
      ["Strutture", kpis.structures, "pubbliche ed equiparate", "nel dataset attivita reparti"],
      ["Mobilita sanitaria", "AGENAS", "report ufficiale", "flussi e saldo economico incorporati"]
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
    horizontalBar(
      "hiNationalActivityChart",
      sortDescending(tableRows("activity_by_discipline"), "discharges"),
      "discipline",
      "discharges",
      {
        limit: 22,
        color: COLORS[0],
        leftMargin: 210,
        xTitle: "dimissioni",
        hovertemplate: "%{y}<br>Dimissioni: %{x:,.0f}<extra></extra>"
      }
    );

    var latestBedsYear = STATE.payload.kpis && STATE.payload.kpis.beds_latest_year;
    var bedRows = tableRows("beds_by_discipline").filter(function (row) {
      return row.year === latestBedsYear && toNumber(row.total_beds) > 0;
    });
    horizontalBar(
      "hiNationalBedsChart",
      sortDescending(bedRows, "total_beds"),
      "discipline",
      "total_beds",
      {
        limit: 22,
        color: COLORS[2],
        leftMargin: 210,
        xTitle: "posti letto",
        hovertemplate: "%{y}<br>Posti letto: %{x:,.0f}<extra></extra>"
      }
    );

    renderDischargeTypeChart();
  }

  function latestRow(rows) {
    rows = toArray(rows);
    if (!rows.length) return null;
    rows.sort(function (a, b) { return (toNumber(b.year) || 0) - (toNumber(a.year) || 0); });
    return rows[0];
  }

  function renderDischargeTypeChart() {
    var rows = STATE.region === "Italia" ? tableRows("discharge_type_national") : tableRows("discharge_type_by_region").filter(function (row) {
      return row.region === STATE.region;
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
      note.textContent = "Fonte: Ministero della Salute, SDO. Anno " + row.year + ". Celle oscurate nella selezione: " + formatNumber(row.masked_cells) + ". Le celle oscurate non sono trattate come zero.";
    }
  }

  function renderRegionalRank() {
    var config = METRICS[STATE.metric] || METRICS.discharges_per_1000;
    var rows = sortDescending(tableRows("regional_summary"), config.field);
    var title = byId("hiRegionalRankTitle");
    var tag = byId("hiRegionalRankTag");
    if (title) title.textContent = config.label;
    if (tag) tag.textContent = STATE.region === "Italia" ? "tutte le regioni" : "focus " + STATE.region;
    horizontalBar("hiRegionalRankChart", rows, "region", config.field, {
      limit: 21,
      highlight: STATE.region,
      leftMargin: 150,
      xTitle: config.label,
      hovertemplate: "%{y}<br>" + config.label + ": %{x:,.2f}<extra></extra>"
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
        ["Costo SSN", formatEuroCompact((national.costs || {}).amount_eur), formatEuro((national.costs || {}).cost_per_capita_eur) + " pro capite"]
      ];
    } else {
      items = [
        ["Territorio", row.region, formatNumber(row.population_total) + " residenti ISTAT 2026"],
        ["Dimissioni", formatNumber(row.discharges), formatDecimal(row.discharges_per_1000) + " per 1.000, rank " + asText(row.rank_discharges_per_1000)],
        ["Posti letto", formatNumber(row.total_beds), formatDecimal(row.beds_per_1000) + " per 1.000, rank " + asText(row.rank_beds_per_1000)],
        ["Costo SSN", formatEuroCompact(row.ssn_cost_eur), formatEuro(row.ssn_cost_per_capita_eur) + " pro capite, rank " + asText(row.rank_cost_per_capita)]
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

  function denominatorValue(region, denominator) {
    var pop = populationMap()[region] || {};
    return toNumber(pop[denominator]);
  }

  function disciplineRate(row) {
    var denominator = STATE.denominator;
    if (denominator === "auto") return toNumber(row.discharges_per_1000_relevant);
    var value = denominatorValue(row.region, denominator);
    if (!value) return null;
    return ((toNumber(row.discharges) || 0) / value) * 1000;
  }

  function renderDiscipline() {
    var rows = tableRows("activity_by_region_discipline").filter(function (row) {
      return row.discipline === STATE.discipline;
    }).map(function (row) {
      var copy = Object.assign({}, row);
      copy.selected_rate = disciplineRate(row);
      return copy;
    });
    rows.sort(function (a, b) { return (toNumber(b.selected_rate) || 0) - (toNumber(a.selected_rate) || 0); });
    var title = byId("hiDisciplineRegionTitle");
    var tag = byId("hiDisciplineRegionTag");
    var denominatorLabel = STATE.denominator === "auto" ? "automatico" : DENOMINATORS[STATE.denominator];
    if (title) title.textContent = STATE.discipline || "Disciplina";
    if (tag) tag.textContent = "per 1.000, denominatore " + denominatorLabel;
    horizontalBar("hiDisciplineRegionChart", rows, "region", "selected_rate", {
      limit: 21,
      highlight: STATE.region,
      leftMargin: 150,
      xTitle: "dimissioni per 1.000",
      hovertemplate: "%{y}<br>Tasso: %{x:,.2f}<extra></extra>"
    });
    var note = byId("hiDisciplineNote");
    if (note) {
      note.textContent = "Denominatore selezionato: " + denominatorLabel + ". La tabella riporta anche volumi assoluti, degenza media e utilizzo dei posti letto.";
    }
    createTable("hiDisciplineTable", STATE.region === "Italia" ? rows : rows.filter(function (row) { return row.region === STATE.region; }), [
      ["region", "Regione"],
      ["discipline", "Disciplina"],
      ["discharges", "Dimissioni"],
      ["selected_rate", "Tasso selezionato"],
      ["relevant_denominator", "Denom. auto"],
      ["avg_los_days", "Degenza media"],
      ["bed_utilization_percent", "Utilizzo PL"]
    ], 40);
  }

  function renderCosts() {
    var costType = STATE.costType;
    var label = costLabel(costType);
    var rows = tableRows("cost_by_region_category").filter(function (row) {
      return row.cost_type === costType;
    }).map(function (row) {
      var copy = Object.assign({}, row);
      copy.amount_billion = (toNumber(row.amount_eur) || 0) / 1000000000;
      return copy;
    });
    rows.sort(function (a, b) { return (b.amount_billion || 0) - (a.amount_billion || 0); });
    var title = byId("hiCostRegionTitle");
    if (title) title.textContent = label + " per regione";
    horizontalBar("hiCostRegionChart", rows, "region", "amount_billion", {
      limit: 21,
      highlight: STATE.region,
      color: COLORS[3],
      leftMargin: 150,
      xTitle: "miliardi di euro",
      hovertemplate: "%{y}<br>Importo: %{x:,.2f} mld euro<extra></extra>"
    });

    var composition = tableRows("cost_national").filter(function (row) {
      return row.cost_type !== "totali";
    }).map(function (row) {
      var copy = Object.assign({}, row);
      copy.amount_billion = (toNumber(row.amount_eur) || 0) / 1000000000;
      return copy;
    });
    horizontalBar("hiCostCompositionChart", sortDescending(composition, "amount_billion"), "cost_label", "amount_billion", {
      limit: 8,
      color: COLORS[4],
      leftMargin: 230,
      xTitle: "miliardi di euro",
      hovertemplate: "%{y}<br>Importo: %{x:,.2f} mld euro<extra></extra>"
    });

    var displayRows = STATE.region === "Italia" ? rows : rows.filter(function (row) { return row.region === STATE.region; });
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
    var region = STATE.region;
    var source = tableRows("beds_by_region_year");
    var rows;
    if (region === "Italia") {
      var grouped = {};
      source.forEach(function (row) {
        grouped[row.year] = (grouped[row.year] || 0) + (toNumber(row.total_beds) || 0);
      });
      rows = Object.keys(grouped).map(function (year) {
        return { year: Number(year), total_beds: grouped[year] };
      });
    } else {
      rows = source.filter(function (row) { return row.region === region; });
    }
    rows.sort(function (a, b) { return a.year - b.year; });
    var title = byId("hiBedsSeriesTitle");
    if (title) title.textContent = "Posti letto nel tempo - " + region;
    lineChart("hiBedsSeriesChart", [{
      type: "scatter",
      mode: "lines+markers",
      name: "Posti letto",
      x: rows.map(function (row) { return row.year; }),
      y: rows.map(function (row) { return row.total_beds; }),
      line: { color: COLORS[2], width: 3 },
      marker: { size: 8 },
      hovertemplate: "%{x}<br>Posti letto: %{y:,.0f}<extra></extra>"
    }], { yTitle: "posti letto" });
  }

  function renderPharmaSeries() {
    var region = STATE.region;
    var rows = tableRows("pharma_series").filter(function (row) {
      return row.region === region;
    });
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
    if (STATE.region !== "Italia") rows = rows.filter(function (row) { return row.region === STATE.region; });
    rows = sortDescending(rows, "discharges");
    var title = byId("hiHospitalTitle");
    if (title) title.textContent = "Top strutture per dimissioni - " + STATE.region;
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
    var mobility = STATE.payload.mobility || {};
    var frame = byId("hiMobilityFrame");
    var economic = byId("hiEconomicMobilityFrame");
    if (frame && mobility.embed_url && frame.src !== mobility.embed_url) frame.src = mobility.embed_url;
    if (economic && mobility.economic_embed_url && economic.src !== mobility.economic_embed_url) economic.src = mobility.economic_embed_url;
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
    if (row.region && STATE.region !== "Italia" && row.region !== STATE.region) return false;
    if (row.discipline && STATE.discipline && STATE.table.indexOf("activity") !== -1 && row.discipline !== STATE.discipline) return false;
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

  function csvEscape(value) {
    var text = asText(value, "");
    if (/[",\n\r]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
    return text;
  }

  function downloadCurrentCsv() {
    var option = tableOption(STATE.table);
    var rows = filteredTableRows(STATE.table);
    var columns = option.columns && option.columns.length ? option.columns : inferColumns(rows);
    var keys = columns.map(function (column) { return column[0]; });
    var labels = columns.map(function (column) { return column[1] || column[0]; });
    var lines = [labels.map(csvEscape).join(",")];
    rows.forEach(function (row) {
      lines.push(keys.map(function (key) { return csvEscape(row[key]); }).join(","));
    });
    var blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sanita-italia-" + STATE.table + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  function renderDynamic() {
    renderNationalCharts();
    renderRegionalRank();
    renderRegionProfile();
    renderRegionalSummaryTable();
    renderDiscipline();
    renderCosts();
    renderSeries();
    renderHospitals();
    renderExplorer();
  }

  function renderAll() {
    setupFilters();
    renderKpis();
    renderDynamic();
    renderMobility();
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
