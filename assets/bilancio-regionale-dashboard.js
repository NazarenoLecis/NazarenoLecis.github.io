(function () {
  "use strict";

  var PUBLIC_DATA_URL = "https://data.nazarenolecis.com/bilancio-regionale/dashboard.json?v=20260705-regionale";
  var LOCAL_DATA_URLS = [
    "../../../nazarenolecis-data-pipeline/publish/bilancio-regionale/dashboard.json",
    "../../data/bilancio-regionale/dashboard.json",
    PUBLIC_DATA_URL
  ];
  var REMOTE_DATA_URLS = [
    PUBLIC_DATA_URL,
    "../../data/bilancio-regionale/dashboard.json"
  ];
  var DATA_URLS = /^(127\.0\.0\.1|localhost)$/.test(window.location.hostname) ? LOCAL_DATA_URLS : REMOTE_DATA_URLS;

  var MISSING_VALUE = "ND";
  var COLORS = ["#ff5a1f", "#4e79a7", "#59a14f", "#f28e2b", "#76b7b2", "#e15759", "#edc948", "#b07aa1"];

  var STATE = {
    payload: null,
    dataUrl: null,
    dataBaseUrl: null,
    region: "Sardegna",
    year: null,
    metric: "mld",
    measure: "spese_finali",
    compareMetric: "mld",
    compareRegions: [],
    siopePerimeter: "regioni_sanita",
    siopeFlow: "uscite",
    codePerimeter: "regioni_sanita",
    codeFlow: "uscite",
    codeCache: {},
    codePromises: {}
  };

  var OPENBDAP_MEASURES = [
    { id: "spese_finali", label: "Spese finali", block: "spending", rowsKey: "aggregates_by_region", aggregateId: "spese_finali" },
    { id: "spese_totali", label: "Spese totali", block: "spending", rowsKey: "by_region" },
    { id: "entrate_finali", label: "Entrate finali", block: "revenue", rowsKey: "aggregates_by_region", aggregateId: "entrate_finali" },
    { id: "entrate_totali", label: "Entrate totali", block: "revenue", rowsKey: "by_region" },
    { id: "saldo_finale", label: "Saldo finale", block: "balances", rowsKey: "final_by_region" },
    { id: "saldo_totale", label: "Saldo totale", block: "balances", rowsKey: "by_region" }
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function arr(value) {
    return Array.isArray(value) ? value : [];
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback || MISSING_VALUE;
    return String(value);
  }

  function num(value) {
    if (value === null || value === undefined || value === "") return null;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function cssVar(name, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  function mobile() {
    return window.matchMedia && window.matchMedia("(max-width: 760px)").matches;
  }

  function clear(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function compact(value, maxLength) {
    var clean = text(value, "").replace(/\s+/g, " ").trim();
    maxLength = maxLength || 46;
    if (clean.length <= maxLength) return clean;
    return clean.slice(0, Math.max(0, maxLength - 3)).trim() + "...";
  }

  function formatPlain(value, digits) {
    var valueNumber = num(value);
    if (valueNumber === null) return MISSING_VALUE;
    return valueNumber.toLocaleString("it-IT", {
      maximumFractionDigits: Number.isFinite(digits) ? digits : 0,
      minimumFractionDigits: 0
    });
  }

  function formatDecimal(value, digits) {
    var valueNumber = num(value);
    if (valueNumber === null) return MISSING_VALUE;
    digits = Number.isFinite(digits) ? digits : 1;
    return valueNumber.toLocaleString("it-IT", {
      maximumFractionDigits: digits,
      minimumFractionDigits: 0
    });
  }

  function formatMld(value) {
    var valueNumber = num(value);
    if (valueNumber === null) return MISSING_VALUE;
    return valueNumber.toLocaleString("it-IT", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }) + " mld";
  }

  function formatEuro(value) {
    var valueNumber = num(value);
    if (valueNumber === null) return MISSING_VALUE;
    return valueNumber.toLocaleString("it-IT", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }) + " euro";
  }

  function formatMetricValue(value, metric) {
    var unit = text(metric && metric.unit, "");
    if (unit === "mld") return formatMld(value);
    if (unit === "% PIL") return formatDecimal(value, 2) + "%";
    if (unit === "euro" || unit === "euro_km2") return formatEuro(value);
    return formatDecimal(value, 2);
  }

  function metricAxis(metric) {
    var unit = text(metric && metric.unit, "");
    if (unit === "mld") return "Miliardi di euro";
    if (unit === "% PIL") return "% PIL regionale";
    if (unit === "euro") return "Euro pro capite";
    if (unit === "euro_km2") return "Euro per kmq";
    return text(metric && metric.label, "Valore");
  }

  function metricOptions(payload) {
    var options = arr(payload && payload.normalization_options);
    if (options.length) return options;
    return [
      { id: "mld", label: "Miliardi correnti", field: "mld", unit: "mld" },
      { id: "pil", label: "% PIL regionale", field: "pil", unit: "% PIL" },
      { id: "euro_per_capita", label: "Euro pro capite", field: "euro_per_capita", unit: "euro" },
      { id: "euro_per_km2", label: "Euro per kmq", field: "euro_per_km2", unit: "euro_km2" }
    ];
  }

  function metricById(payload, id) {
    var options = metricOptions(payload);
    return options.find(function (metric) { return metric.id === id; }) || options[0];
  }

  function measureById(id) {
    return OPENBDAP_MEASURES.find(function (measure) { return measure.id === id; }) || OPENBDAP_MEASURES[0];
  }

  function rowValue(row, metric) {
    return num(row && row[metric.field || "mld"]);
  }

  function showStatus(message, isError) {
    var node = byId("brStatus");
    if (!node) return;
    node.textContent = message;
    node.style.color = isError ? "#e15759" : "";
  }

  function showEmptyChart(id, message) {
    var node = byId(id);
    if (!node) return;
    if (window.Plotly) {
      try { window.Plotly.purge(node); } catch (error) {}
    }
    node.innerHTML = "";
    var empty = document.createElement("div");
    empty.className = "bp-empty-chart";
    empty.textContent = message || "Nessun dato disponibile";
    node.appendChild(empty);
  }

  function baseLayout(extra) {
    var textColor = cssVar("--text", "#f5f2ed");
    var muted = cssVar("--muted", "#b9b2aa");
    var line = cssVar("--line", "#303030");
    var panel = cssVar("--panel", "#090909");
    var layout = {
      autosize: true,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: {
        color: textColor,
        family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        size: 12
      },
      margin: { t: 24, r: 28, b: 54, l: 80 },
      hoverlabel: {
        bgcolor: panel,
        bordercolor: line,
        font: { color: textColor }
      },
      legend: {
        orientation: "h",
        x: 0,
        xanchor: "left",
        y: -0.2,
        font: { color: muted }
      },
      dragmode: false,
      xaxis: {
        fixedrange: true,
        gridcolor: line,
        zerolinecolor: line,
        tickfont: { color: muted },
        titlefont: { color: muted },
        automargin: true
      },
      yaxis: {
        fixedrange: true,
        gridcolor: line,
        zerolinecolor: line,
        tickfont: { color: muted },
        titlefont: { color: muted },
        automargin: true
      }
    };
    extra = extra || {};
    Object.keys(extra).forEach(function (key) {
      if (key === "xaxis") {
        layout.xaxis = Object.assign({}, layout.xaxis, extra.xaxis);
      } else if (key === "yaxis") {
        layout.yaxis = Object.assign({}, layout.yaxis, extra.yaxis);
      } else {
        layout[key] = extra[key];
      }
    });
    return layout;
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
    return window.Plotly.react(node, traces, baseLayout(layout), {
      responsive: true,
      displayModeBar: false,
      scrollZoom: false,
      doubleClick: false,
      showTips: false
    }).catch(function () {
      showEmptyChart(id, "Errore nella costruzione del grafico");
    });
  }

  function createRows(tbody, rows, columns) {
    clear(tbody);
    if (!tbody) return;
    if (!rows.length) {
      var emptyRow = document.createElement("tr");
      var emptyCell = document.createElement("td");
      emptyCell.colSpan = Math.max(1, columns.length);
      emptyCell.textContent = "Nessun dato disponibile";
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
      return;
    }
    rows.forEach(function (row, index) {
      var tr = document.createElement("tr");
      columns.forEach(function (column) {
        var td = document.createElement("td");
        if (column.className) td.className = column.className;
        td.textContent = column.value(row, index);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  function setSelect(select, items, selected, valueFn, labelFn) {
    if (!select) return selected;
    var values = [];
    clear(select);
    items.forEach(function (item) {
      var value = String(valueFn ? valueFn(item) : item);
      values.push(value);
      var option = document.createElement("option");
      option.value = value;
      option.textContent = labelFn ? labelFn(item) : value;
      select.appendChild(option);
    });
    var selectedText = selected === null || selected === undefined ? "" : String(selected);
    if (values.indexOf(selectedText) < 0) selectedText = values[0] || "";
    select.value = selectedText;
    return selectedText;
  }

  function bindSelect(id, handler) {
    var select = byId(id);
    if (!select || select.brBound) return;
    select.brBound = true;
    select.addEventListener("change", handler);
  }

  function fetchJson(url) {
    return window.fetch(url, { cache: "no-store", mode: "cors" }).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status + " for " + url);
      return response.json();
    });
  }

  function baseFromUrl(url) {
    var clean = String(url).split("?")[0];
    return clean.slice(0, clean.lastIndexOf("/") + 1);
  }

  function fetchFirstJson(urls, index) {
    index = index || 0;
    if (index >= urls.length) throw new Error("Nessuna sorgente dati disponibile");
    return fetchJson(urls[index]).then(function (payload) {
      STATE.dataUrl = urls[index];
      STATE.dataBaseUrl = baseFromUrl(urls[index]);
      return payload;
    }).catch(function () {
      return fetchFirstJson(urls, index + 1);
    });
  }

  function dataPath(path) {
    return (STATE.dataBaseUrl || "").replace(/\/?$/, "/") + path.replace(/^\/+/, "");
  }

  function latestYear(payload) {
    var latest = obj(payload && payload.latest_years);
    return num(latest.totals) || num(latest.missions) || Math.max.apply(null, arr(payload && payload.years).map(num).filter(function (value) {
      return value !== null;
    }));
  }

  function latestSiopeYear(payload) {
    var latest = obj(payload && payload.latest_years);
    var years = arr(obj(payload && payload.siope).years).map(num).filter(function (value) { return value !== null; });
    return num(latest.siope) || (years.length ? Math.max.apply(null, years) : latestYear(payload));
  }

  function openbdapBlock(payload, name) {
    return obj(obj(payload && payload.openbdap)[name]);
  }

  function measureRows(payload, measureId) {
    var measure = measureById(measureId);
    var block = openbdapBlock(payload, measure.block);
    var rows = arr(block[measure.rowsKey]);
    if (measure.aggregateId) {
      rows = rows.filter(function (row) { return row && row.aggregate_id === measure.aggregateId; });
    }
    return rows;
  }

  function regionYearRows(rows, region, year) {
    return arr(rows).filter(function (row) {
      return text(row && row.regione, "") === region && num(row && row.anno) === year;
    });
  }

  function firstRegionYearRow(rows, region, year) {
    return regionYearRows(rows, region, year)[0] || null;
  }

  function sortRowsByMetric(rows, metric) {
    return rows.slice().sort(function (a, b) {
      return (rowValue(b, metric) || 0) - (rowValue(a, metric) || 0);
    });
  }

  function totalForRows(rows, metric) {
    return rows.reduce(function (sum, row) {
      var value = rowValue(row, metric);
      return sum + (value || 0);
    }, 0);
  }

  function uniqueTexts(values) {
    var seen = {};
    var output = [];
    arr(values).forEach(function (value) {
      var clean = text(value, "").trim();
      if (!clean || seen[clean]) return;
      seen[clean] = true;
      output.push(clean);
    });
    return output.sort(function (a, b) { return a.localeCompare(b, "it"); });
  }

  function renderControls(payload) {
    var years = arr(payload.years).slice().sort(function (a, b) { return num(b) - num(a); });
    var regions = arr(payload.regions);
    var metrics = metricOptions(payload);
    var siope = obj(payload.siope);
    var perimeters = arr(siope.perimeters);
    var codePerimeters = perimeters.filter(function (perimeter) { return perimeter && perimeter.code_detail; });
    if (!codePerimeters.length) codePerimeters = perimeters;

    if (regions.indexOf(STATE.region) < 0) STATE.region = regions.indexOf("Sardegna") >= 0 ? "Sardegna" : regions[0];
    STATE.year = num(setSelect(byId("brYear"), years, STATE.year || latestYear(payload)));
    STATE.region = setSelect(byId("brRegion"), regions, STATE.region);
    STATE.metric = setSelect(byId("brMetric"), metrics, STATE.metric, function (metric) {
      return metric.id;
    }, function (metric) {
      return metric.label;
    });
    STATE.measure = setSelect(byId("brMeasure"), OPENBDAP_MEASURES, STATE.measure, function (measure) {
      return measure.id;
    }, function (measure) {
      return measure.label;
    });
    STATE.siopePerimeter = setSelect(byId("brSiopePerimeter"), perimeters, STATE.siopePerimeter, function (perimeter) {
      return perimeter.id;
    }, function (perimeter) {
      return perimeter.label;
    });
    STATE.codePerimeter = setSelect(byId("brCodePerimeter"), codePerimeters, STATE.codePerimeter, function (perimeter) {
      return perimeter.id;
    }, function (perimeter) {
      return perimeter.label;
    });
    STATE.compareMetric = setSelect(byId("brOpenbdapMetric"), metrics, STATE.compareMetric, function (metric) {
      return metric.id;
    }, function (metric) {
      return metric.label;
    });

    bindSelect("brRegion", function () {
      STATE.region = this.value;
      renderAll();
    });
    bindSelect("brYear", function () {
      STATE.year = num(this.value);
      renderAll();
    });
    bindSelect("brMetric", function () {
      STATE.metric = this.value;
      renderAll();
    });
    bindSelect("brMeasure", function () {
      STATE.measure = this.value;
      renderAll();
    });
    bindSelect("brSiopePerimeter", function () {
      STATE.siopePerimeter = this.value;
      renderAll();
    });
    bindSelect("brSiopeFlow", function () {
      STATE.siopeFlow = this.value;
      renderAll();
    });
    bindSelect("brCodePerimeter", function () {
      STATE.codePerimeter = this.value;
      renderCodes();
    });
    bindSelect("brCodeFlow", function () {
      STATE.codeFlow = this.value;
      renderCodes();
    });
    bindSelect("brOpenbdapMetric", function () {
      STATE.compareMetric = this.value;
      renderOpenbdapMissionCompare(STATE.payload);
    });
  }

  function kpiBox(label, value, detail) {
    var box = document.createElement("div");
    box.className = "kpi";
    var labelNode = document.createElement("span");
    labelNode.textContent = label;
    var valueNode = document.createElement("strong");
    valueNode.textContent = value;
    var detailNode = document.createElement("small");
    detailNode.textContent = detail;
    box.appendChild(labelNode);
    box.appendChild(valueNode);
    box.appendChild(detailNode);
    return box;
  }

  function renderKpis(payload) {
    var container = byId("brKpis");
    if (!container) return;
    clear(container);
    var year = STATE.year || latestYear(payload);
    var region = STATE.region;
    var spending = openbdapBlock(payload, "spending");
    var revenue = openbdapBlock(payload, "revenue");
    var balances = openbdapBlock(payload, "balances");
    var spendRow = firstRegionYearRow(arr(spending.aggregates_by_region).filter(function (row) {
      return row.aggregate_id === "spese_finali";
    }), region, year) || firstRegionYearRow(spending.by_region, region, year);
    var revenueRow = firstRegionYearRow(arr(revenue.aggregates_by_region).filter(function (row) {
      return row.aggregate_id === "entrate_finali";
    }), region, year) || firstRegionYearRow(revenue.by_region, region, year);
    var balanceRow = firstRegionYearRow(balances.final_by_region, region, year) || firstRegionYearRow(balances.by_region, region, year);
    var codeFile = arr(obj(obj(payload.siope).code_detail_index).files).find(function (file) {
      return file && file.regione === region;
    });

    container.appendChild(kpiBox("Spese", formatMld(spendRow && spendRow.mld), region + ", " + year));
    container.appendChild(kpiBox("Entrate", formatMld(revenueRow && revenueRow.mld), region + ", " + year));
    container.appendChild(kpiBox("Saldo", formatMld(balanceRow && balanceRow.mld), "Entrate - spese"));
    container.appendChild(kpiBox("Codici SIOPE", formatPlain(codeFile && codeFile.rows, 0), "Dettaglio gestionale pubblicato"));
  }

  function renderComparison(payload) {
    var metric = metricById(payload, STATE.metric);
    var measure = measureById(STATE.measure);
    var rows = measureRows(payload, STATE.measure).filter(function (row) {
      return num(row && row.anno) === STATE.year && rowValue(row, metric) !== null;
    });
    var sorted = sortRowsByMetric(rows, metric);
    var chartRows = sorted.slice().reverse();
    var title = byId("brComparisonTitle");
    if (title) title.textContent = measure.label + " " + STATE.year + " - " + metric.label;

    if (!chartRows.length) {
      showEmptyChart("brComparisonChart", "Nessun dato OpenBDAP disponibile per questa selezione");
      createRows(byId("brComparisonRows"), [], []);
      return;
    }

    plot("brComparisonChart", [{
      type: "bar",
      orientation: "h",
      x: chartRows.map(function (row) { return rowValue(row, metric); }),
      y: chartRows.map(function (row) { return compact(row.regione, 30); }),
      marker: {
        color: chartRows.map(function (row) {
          var value = rowValue(row, metric) || 0;
          return value < 0 ? COLORS[1] : cssVar("--orange", COLORS[0]);
        })
      },
      text: mobile() ? [] : chartRows.map(function (row) { return formatMetricValue(rowValue(row, metric), metric); }),
      textposition: mobile() ? "none" : "outside",
      cliponaxis: false,
      hovertemplate: "%{y}<br>" + measure.label + ": %{x:.3f}<extra></extra>"
    }], {
      margin: { t: 18, r: mobile() ? 24 : 96, b: 54, l: mobile() ? 128 : 190 },
      xaxis: { title: metricAxis(metric), zeroline: true },
      yaxis: { title: "", showgrid: false },
      showlegend: false
    });

    createRows(byId("brComparisonRows"), sorted, [
      { value: function (row) { return text(row.regione); } },
      { value: function (row) { return formatMetricValue(rowValue(row, metric), metric); } },
      { value: function (row) { return text(row.anno); } }
    ]);
  }

  function allCompareRegions(payload, rows) {
    var regions = uniqueTexts(arr(payload && payload.regions).concat(rows.map(function (row) { return row && row.regione; })));
    return regions;
  }

  function defaultCompareRegions(rows, metric) {
    var totals = {};
    arr(rows).forEach(function (row) {
      var region = text(row && row.regione, "");
      var value = rowValue(row, metric);
      if (!region || value === null) return;
      totals[region] = (totals[region] || 0) + Math.abs(value);
    });
    return Object.keys(totals).sort(function (a, b) {
      return totals[b] - totals[a];
    }).slice(0, 4);
  }

  function selectedCompareRegions(payload, rows, metric) {
    var available = allCompareRegions(payload, rows);
    STATE.compareRegions = STATE.compareRegions.filter(function (region) {
      return available.indexOf(region) >= 0;
    });
    if (!STATE.compareRegions.length) {
      STATE.compareRegions = defaultCompareRegions(rows, metric);
    }
    return STATE.compareRegions;
  }

  function setupCompareRegionGrid(payload, rows, metric) {
    var grid = byId("brOpenbdapRegions");
    if (!grid) return;
    var selected = selectedCompareRegions(payload, rows, metric);
    clear(grid);
    allCompareRegions(payload, rows).forEach(function (region) {
      var label = document.createElement("label");
      label.className = "br-region-option";
      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = region;
      checkbox.checked = selected.indexOf(region) >= 0;
      checkbox.addEventListener("change", function () {
        STATE.compareRegions = Array.prototype.slice.call(grid.querySelectorAll("input:checked")).map(function (input) {
          return input.value;
        });
        renderOpenbdapMissionCompare(payload);
      });
      var span = document.createElement("span");
      span.textContent = region;
      label.appendChild(checkbox);
      label.appendChild(span);
      grid.appendChild(label);
    });
  }

  function topCompareMissions(rows, regions, metric) {
    var totals = {};
    rows.filter(function (row) {
      return regions.indexOf(text(row && row.regione, "")) >= 0;
    }).forEach(function (row) {
      var mission = text(row.missione || row.missione_code, "");
      var value = rowValue(row, metric);
      if (!mission || value === null) return;
      totals[mission] = (totals[mission] || 0) + Math.abs(value);
    });
    return Object.keys(totals).sort(function (a, b) {
      return totals[b] - totals[a];
    }).slice(0, mobile() ? 6 : 8);
  }

  function renderOpenbdapMissionCompare(payload) {
    if (!payload) return;
    var metric = metricById(payload, STATE.compareMetric);
    var rows = arr(openbdapBlock(payload, "spending").by_mission).filter(function (row) {
      return num(row && row.anno) === STATE.year && rowValue(row, metric) !== null;
    });
    var title = byId("brOpenbdapCompareTitle");
    var note = byId("brOpenbdapCompareNote");
    if (title) title.textContent = "Spesa per missione " + STATE.year + " - " + metric.label;
    if (note) {
      note.textContent = "Confronto OpenBDAP " + STATE.year + ": dettaglio regionale per missione. Usa la stessa logica del confronto presente nella dashboard Bilancio pubblico.";
    }
    if (!rows.length) {
      setupCompareRegionGrid(payload, [], metric);
      showEmptyChart("brOpenbdapMissionCompareChart", "Dettaglio per missione non disponibile per questo anno");
      createRows(byId("brOpenbdapMissionCompareRows"), [], []);
      return;
    }
    setupCompareRegionGrid(payload, rows, metric);
    var regions = selectedCompareRegions(payload, rows, metric);
    var missions = topCompareMissions(rows, regions, metric);
    if (!regions.length || !missions.length) {
      showEmptyChart("brOpenbdapMissionCompareChart", "Seleziona almeno una regione");
      createRows(byId("brOpenbdapMissionCompareRows"), [], []);
      return;
    }
    var traces = regions.map(function (region, index) {
      var values = missions.map(function (mission) {
        var matched = rows.find(function (row) {
          return row.regione === region && text(row.missione || row.missione_code, "") === mission;
        });
        return matched ? rowValue(matched, metric) : null;
      });
      return {
        type: "bar",
        name: region,
        x: missions.map(function (mission) { return compact(mission, mobile() ? 18 : 30); }),
        y: values,
        customdata: values.map(function (value, valueIndex) {
          return [missions[valueIndex], formatMetricValue(value, metric)];
        }),
        marker: { color: COLORS[index % COLORS.length] },
        hovertemplate: "%{fullData.name}<br>%{customdata[0]}<br>%{customdata[1]}<extra></extra>"
      };
    });
    plot("brOpenbdapMissionCompareChart", traces, {
      barmode: "group",
      height: mobile() ? 460 : Math.min(760, Math.max(520, 360 + regions.length * 32)),
      margin: { t: 20, r: 18, b: mobile() ? 122 : 96, l: mobile() ? 62 : 82 },
      xaxis: { title: "", tickangle: mobile() ? -35 : -20 },
      yaxis: { title: metricAxis(metric), rangemode: "tozero" },
      legend: { orientation: "h", x: 0, xanchor: "left", y: -0.28 }
    });
    var tableRows = rows.filter(function (row) {
      return regions.indexOf(row.regione) >= 0 && missions.indexOf(text(row.missione || row.missione_code, "")) >= 0;
    }).sort(function (a, b) {
      return (rowValue(b, metric) || 0) - (rowValue(a, metric) || 0);
    }).slice(0, 40);
    createRows(byId("brOpenbdapMissionCompareRows"), tableRows, [
      { value: function (row) { return text(row.regione); } },
      { value: function (row) { return text(row.missione || row.missione_code); } },
      { value: function (row) { return formatMetricValue(rowValue(row, metric), metric); } }
    ]);
  }

  function renderHistory(payload) {
    var metric = metricById(payload, STATE.metric);
    var region = STATE.region;
    var spendingRows = arr(openbdapBlock(payload, "spending").by_region).filter(function (row) { return row.regione === region; });
    var revenueRows = arr(openbdapBlock(payload, "revenue").by_region).filter(function (row) { return row.regione === region; });
    var balanceRows = arr(openbdapBlock(payload, "balances").by_region).filter(function (row) { return row.regione === region; });
    var series = [
      { name: "Spese", rows: spendingRows, color: COLORS[0] },
      { name: "Entrate", rows: revenueRows, color: COLORS[2] },
      { name: "Saldo", rows: balanceRows, color: COLORS[1] }
    ];
    var traces = series.map(function (item) {
      var rows = item.rows.slice().sort(function (a, b) { return num(a.anno) - num(b.anno); });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: item.name,
        x: rows.map(function (row) { return num(row.anno); }),
        y: rows.map(function (row) { return rowValue(row, metric); }),
        line: { color: item.color, width: 3 },
        marker: { size: 7 },
        hovertemplate: item.name + "<br>Anno %{x}<br>Valore %{y:.3f}<extra></extra>"
      };
    }).filter(function (trace) { return trace.x.length; });

    var title = byId("brHistoryTitle");
    if (title) title.textContent = region + " - " + metric.label;
    plot("brHistoryChart", traces, {
      xaxis: { title: "Anno", dtick: 1 },
      yaxis: { title: metricAxis(metric), zeroline: true },
      legend: { orientation: "h", y: -0.24 }
    });
  }

  function renderMission(payload) {
    var metric = metricById(payload, STATE.metric);
    var rows = regionYearRows(openbdapBlock(payload, "spending").by_mission, STATE.region, STATE.year)
      .filter(function (row) { return rowValue(row, metric) !== null && rowValue(row, metric) !== 0; });
    var total = totalForRows(rows, metric);
    rows = sortRowsByMetric(rows, metric);
    var title = byId("brMissionTitle");
    if (title) title.textContent = STATE.region + " " + STATE.year + " - " + metric.label;

    if (!rows.length) {
      showEmptyChart("brMissionChart", "Dettaglio per missione non disponibile per questa selezione");
      createRows(byId("brMissionRows"), [], []);
      return;
    }
    var chartRows = rows.slice(0, mobile() ? 10 : 16).reverse();
    plot("brMissionChart", [{
      type: "bar",
      orientation: "h",
      x: chartRows.map(function (row) { return rowValue(row, metric); }),
      y: chartRows.map(function (row) { return compact(row.missione, mobile() ? 30 : 58); }),
      marker: { color: cssVar("--orange", COLORS[0]) },
      text: mobile() ? [] : chartRows.map(function (row) { return formatMetricValue(rowValue(row, metric), metric); }),
      textposition: mobile() ? "none" : "outside",
      cliponaxis: false,
      customdata: chartRows.map(function (row) {
        var value = rowValue(row, metric) || 0;
        return [text(row.missione), total ? value / total * 100 : null];
      }),
      hovertemplate: "%{customdata[0]}<br>Valore %{x:.3f}<br>Quota %{customdata[1]:.1f}%<extra></extra>"
    }], {
      margin: { t: 18, r: mobile() ? 24 : 92, b: 54, l: mobile() ? 150 : 310 },
      xaxis: { title: metricAxis(metric), rangemode: "tozero" },
      yaxis: { title: "", showgrid: false },
      showlegend: false
    });
    createRows(byId("brMissionRows"), rows, [
      { value: function (row) { return text(row.missione); } },
      { value: function (row) { return formatMetricValue(rowValue(row, metric), metric); } },
      { value: function (row) {
        var value = rowValue(row, metric) || 0;
        return total ? formatDecimal(value / total * 100, 1) + "%" : MISSING_VALUE;
      } }
    ]);
  }

  function detailTitleRows(payload, blockName) {
    var metric = metricById(payload, STATE.metric);
    return regionYearRows(openbdapBlock(payload, blockName).by_title, STATE.region, STATE.year)
      .filter(function (row) { return rowValue(row, metric) !== null && rowValue(row, metric) !== 0; })
      .sort(function (a, b) { return (rowValue(b, metric) || 0) - (rowValue(a, metric) || 0); });
  }

  function renderTitleDetail(payload, config) {
    var metric = metricById(payload, STATE.metric);
    var rows = detailTitleRows(payload, config.block);
    var title = byId(config.titleId);
    if (title) title.textContent = STATE.region + " " + STATE.year + " - " + metric.label;
    if (!rows.length) {
      showEmptyChart(config.chartId, config.emptyMessage);
      createRows(byId(config.tableId), [], []);
      return;
    }
    var chartRows = rows.slice(0, mobile() ? 10 : 16).reverse();
    plot(config.chartId, [{
      type: "bar",
      orientation: "h",
      x: chartRows.map(function (row) { return rowValue(row, metric); }),
      y: chartRows.map(function (row) { return compact(row.titolo || row.titolo_code, mobile() ? 34 : 62); }),
      marker: { color: config.color },
      text: mobile() ? [] : chartRows.map(function (row) { return formatMetricValue(rowValue(row, metric), metric); }),
      textposition: mobile() ? "none" : "outside",
      cliponaxis: false,
      hovertemplate: "%{y}<br>Valore %{x:.3f}<extra></extra>"
    }], {
      margin: { t: 18, r: mobile() ? 24 : 92, b: 54, l: mobile() ? 156 : 310 },
      xaxis: { title: metricAxis(metric), rangemode: "tozero" },
      yaxis: { title: "", showgrid: false },
      showlegend: false
    });
    createRows(byId(config.tableId), rows, [
      { value: function (row) { return text(row.titolo || row.titolo_code); } },
      { value: function (row) { return formatMetricValue(rowValue(row, metric), metric); } }
    ]);
  }

  function renderSpendingTitles(payload) {
    renderTitleDetail(payload, {
      block: "spending",
      titleId: "brSpendingTitleTitle",
      chartId: "brSpendingTitleChart",
      tableId: "brSpendingTitleRows",
      color: cssVar("--orange", COLORS[0]),
      emptyMessage: "Dettaglio spese per titolo non disponibile per questa selezione"
    });
  }

  function renderRevenueTitles(payload) {
    renderTitleDetail(payload, {
      block: "revenue",
      titleId: "brRevenueTitleTitle",
      chartId: "brRevenueTitleChart",
      tableId: "brRevenueTitleRows",
      color: COLORS[2],
      emptyMessage: "Dettaglio entrate per titolo non disponibile per questa selezione"
    });
  }

  function renderSiopeYear(payload) {
    var metric = metricById(payload, STATE.metric);
    var siope = obj(payload.siope);
    var year = latestSiopeYear(payload);
    var rows = arr(siope.by_region_year).filter(function (row) {
      return row.regione === STATE.region && row.perimetro === STATE.siopePerimeter && num(row.anno) === year;
    });
    var balance = arr(siope.balances_by_region_year).find(function (row) {
      return row.regione === STATE.region && row.perimetro === STATE.siopePerimeter && num(row.anno) === year;
    });
    var values = [
      { label: "Incassi", row: rows.find(function (row) { return row.flusso === "entrate"; }), color: COLORS[2] },
      { label: "Pagamenti", row: rows.find(function (row) { return row.flusso === "uscite"; }), color: COLORS[0] },
      { label: "Saldo", row: balance, color: COLORS[1] }
    ].filter(function (item) { return item.row && rowValue(item.row, metric) !== null; });
    var title = byId("brSiopeTitle");
    if (title) title.textContent = STATE.region + " - SIOPE " + year;
    if (!values.length) {
      showEmptyChart("brSiopeYearChart", "Dati SIOPE non disponibili");
      return;
    }
    plot("brSiopeYearChart", [{
      type: "bar",
      x: values.map(function (item) { return item.label; }),
      y: values.map(function (item) { return rowValue(item.row, metric); }),
      marker: { color: values.map(function (item) { return item.color; }) },
      text: values.map(function (item) { return formatMetricValue(rowValue(item.row, metric), metric); }),
      textposition: "auto",
      hovertemplate: "%{x}<br>Valore %{y:.3f}<extra></extra>"
    }], {
      margin: { t: 18, r: 24, b: 48, l: 70 },
      yaxis: { title: metricAxis(metric), zeroline: true },
      showlegend: false
    });
  }

  function renderSiopeMonth(payload) {
    var siope = obj(payload.siope);
    var year = latestSiopeYear(payload);
    var rows = arr(siope.by_region_month).filter(function (row) {
      return row.regione === STATE.region && row.perimetro === STATE.siopePerimeter && num(row.anno) === year;
    });
    if (!rows.length) {
      showEmptyChart("brSiopeMonthChart", "Serie mensile SIOPE non disponibile");
      return;
    }
    var months = [];
    for (var month = 1; month <= 12; month += 1) months.push(month);
    function monthValue(flow, monthNumber) {
      var row = rows.find(function (item) { return item.flusso === flow && num(item.mese) === monthNumber; });
      return num(row && row.mld) || 0;
    }
    var entrate = months.map(function (monthNumber) { return monthValue("entrate", monthNumber); });
    var uscite = months.map(function (monthNumber) { return monthValue("uscite", monthNumber); });
    var saldo = months.map(function (monthNumber, index) { return entrate[index] - uscite[index]; });
    plot("brSiopeMonthChart", [
      { type: "bar", name: "Incassi", x: months, y: entrate, marker: { color: COLORS[2] }, hovertemplate: "Mese %{x}<br>Incassi %{y:.3f} mld<extra></extra>" },
      { type: "bar", name: "Pagamenti", x: months, y: uscite, marker: { color: COLORS[0] }, hovertemplate: "Mese %{x}<br>Pagamenti %{y:.3f} mld<extra></extra>" },
      { type: "scatter", mode: "lines+markers", name: "Saldo", x: months, y: saldo, line: { color: COLORS[1], width: 3 }, marker: { size: 7 }, hovertemplate: "Mese %{x}<br>Saldo %{y:.3f} mld<extra></extra>" }
    ], {
      barmode: "group",
      xaxis: { title: "Mese", dtick: 1 },
      yaxis: { title: "Miliardi di euro", zeroline: true },
      legend: { orientation: "h", y: -0.25 }
    });
  }

  function renderCompartments(payload) {
    var metric = metricById(payload, STATE.metric);
    var year = latestSiopeYear(payload);
    var rows = arr(obj(payload.siope).by_region_compartment_year).filter(function (row) {
      return row.regione === STATE.region && row.flusso === STATE.siopeFlow && num(row.anno) === year && rowValue(row, metric) !== null;
    });
    rows = sortRowsByMetric(rows, metric);
    var title = byId("brCompartmentTitle");
    if (title) title.textContent = (STATE.siopeFlow === "uscite" ? "Pagamenti" : "Incassi") + " " + year + " - " + metric.label;
    if (!rows.length) {
      showEmptyChart("brCompartmentChart", "Comparti SIOPE non disponibili");
      return;
    }
    var chartRows = rows.slice(0, mobile() ? 10 : 16).reverse();
    plot("brCompartmentChart", [{
      type: "bar",
      orientation: "h",
      x: chartRows.map(function (row) { return rowValue(row, metric); }),
      y: chartRows.map(function (row) { return compact(row.comparto_label || row.comparto, mobile() ? 32 : 58); }),
      marker: { color: STATE.siopeFlow === "uscite" ? COLORS[0] : COLORS[2] },
      hovertemplate: "%{y}<br>Valore %{x:.3f}<extra></extra>"
    }], {
      margin: { t: 18, r: 28, b: 54, l: mobile() ? 150 : 300 },
      xaxis: { title: metricAxis(metric), rangemode: "tozero" },
      yaxis: { title: "", showgrid: false },
      showlegend: false
    });
  }

  function codeFileForRegion(payload, region) {
    return arr(obj(obj(payload.siope).code_detail_index).files).find(function (file) {
      return file && file.regione === region;
    });
  }

  function loadCodeRows(payload, region) {
    if (STATE.codeCache[region]) return Promise.resolve(STATE.codeCache[region]);
    if (STATE.codePromises[region]) return STATE.codePromises[region];
    var file = codeFileForRegion(payload, region);
    if (!file) return Promise.resolve([]);
    var url = dataPath(file.path);
    STATE.codePromises[region] = fetchJson(url).then(function (data) {
      var rows = arr(data.rows);
      STATE.codeCache[region] = rows;
      return rows;
    });
    return STATE.codePromises[region];
  }

  function renderCodes() {
    var payload = STATE.payload;
    if (!payload) return;
    var metric = metricById(payload, STATE.metric);
    var status = byId("brCodesStatus");
    var title = byId("brCodesTitle");
    var file = codeFileForRegion(payload, STATE.region);
    if (title) title.textContent = STATE.region + " - " + (STATE.codeFlow === "uscite" ? "pagamenti" : "incassi");
    if (!file) {
      if (status) status.textContent = "Nessun file SIOPE per codice disponibile per " + STATE.region + ".";
      showEmptyChart("brCodesChart", "Dettaglio per codice non disponibile");
      createRows(byId("brCodesRows"), [], []);
      return;
    }
    if (status) status.textContent = "Caricamento dettaglio " + STATE.region + " (" + formatPlain(file.rows, 0) + " righe) ...";
    loadCodeRows(payload, STATE.region).then(function (rows) {
      var filtered = rows.filter(function (row) {
        return row.perimetro === STATE.codePerimeter && row.flusso === STATE.codeFlow && rowValue(row, metric) !== null && rowValue(row, metric) !== 0;
      });
      filtered = sortRowsByMetric(filtered, metric);
      if (status) {
        status.textContent = "Dettaglio caricato: " + formatPlain(filtered.length, 0) + " righe nel perimetro selezionato.";
      }
      if (!filtered.length) {
        showEmptyChart("brCodesChart", "Nessun codice gestionale per questa selezione");
        createRows(byId("brCodesRows"), [], []);
        return;
      }
      var chartRows = filtered.slice(0, mobile() ? 10 : 18).reverse();
      plot("brCodesChart", [{
        type: "bar",
        orientation: "h",
        x: chartRows.map(function (row) { return rowValue(row, metric); }),
        y: chartRows.map(function (row) { return compact(row.codice_gestionale + " - " + row.descrizione_codice, mobile() ? 34 : 70); }),
        marker: { color: STATE.codeFlow === "uscite" ? COLORS[0] : COLORS[2] },
        hovertemplate: "%{y}<br>Valore %{x:.3f}<extra></extra>"
      }], {
        margin: { t: 18, r: 28, b: 54, l: mobile() ? 160 : 360 },
        xaxis: { title: metricAxis(metric), rangemode: "tozero" },
        yaxis: { title: "", showgrid: false },
        showlegend: false
      });
      createRows(byId("brCodesRows"), filtered.slice(0, 80), [
        { value: function (row) { return text(row.codice_gestionale); } },
        { value: function (row) { return text(row.descrizione_codice); } },
        { value: function (row) { return formatMetricValue(rowValue(row, metric), metric); } }
      ]);
    }).catch(function () {
      if (status) status.textContent = "Errore nel caricamento del dettaglio SIOPE per " + STATE.region + ".";
      showEmptyChart("brCodesChart", "Errore nel caricamento dei codici SIOPE");
      createRows(byId("brCodesRows"), [], []);
    });
  }

  function renderSourceMeta(payload) {
    var node = byId("brSourceMeta");
    var counts = obj(payload.counts);
    if (!node) return;
    node.textContent = text(payload.updated, "Dati regionali disponibili") +
      ". Regioni: " + formatPlain(counts.regions, 0) +
      "; righe SIOPE codice: " + formatPlain(counts.siope_code_rows, 0) + ".";
  }

  function availableYears(rows) {
    return arr(rows).map(function (row) { return num(row && row.anno); })
      .filter(function (year) { return year !== null; })
      .filter(function (year, index, years) { return years.indexOf(year) === index; })
      .sort(function (a, b) { return a - b; });
  }

  function yearRangeText(years) {
    if (!years.length) return "non disponibile";
    if (years.length === 1) return String(years[0]);
    return String(years[0]) + "-" + String(years[years.length - 1]);
  }

  function renderCoverageNote(payload) {
    var node = byId("brCoverageNote");
    if (!node) return;
    var openbdap = obj(payload.openbdap);
    var spending = obj(openbdap.spending);
    var revenue = obj(openbdap.revenue);
    var balances = obj(openbdap.balances);
    var siope = obj(payload.siope);
    node.textContent =
      "Copertura dati: totali OpenBDAP spese/entrate/saldi " + yearRangeText(availableYears(spending.by_region)) +
      "; missioni spesa " + yearRangeText(availableYears(spending.by_mission)) +
      "; titoli di spesa " + yearRangeText(availableYears(spending.by_title)) +
      "; titoli di entrata " + yearRangeText(availableYears(revenue.by_title)) +
      "; saldo finale " + yearRangeText(availableYears(balances.final_by_region)) +
      "; SIOPE " + yearRangeText(availableYears(siope.by_region_year)) + ".";
  }

  function renderAll() {
    var payload = STATE.payload;
    if (!payload) return;
    renderControls(payload);
    renderSourceMeta(payload);
    renderCoverageNote(payload);
    renderKpis(payload);
    renderComparison(payload);
    renderOpenbdapMissionCompare(payload);
    renderHistory(payload);
    renderMission(payload);
    renderSpendingTitles(payload);
    renderRevenueTitles(payload);
    renderSiopeYear(payload);
    renderSiopeMonth(payload);
    renderCompartments(payload);
    renderCodes();
    showStatus("Dati caricati: " + text(payload.updated, "aggiornamento non indicato") + ".");
  }

  function init() {
    showStatus("Caricamento in corso ...");
    fetchFirstJson(DATA_URLS).then(function (payload) {
      STATE.payload = payload;
      STATE.year = latestYear(payload);
      renderAll();
    }).catch(function (error) {
      showStatus("Impossibile caricare i dati della dashboard regionale.", true);
      [
        "brComparisonChart", "brOpenbdapMissionCompareChart", "brHistoryChart", "brMissionChart",
        "brSpendingTitleChart", "brRevenueTitleChart", "brSiopeYearChart", "brSiopeMonthChart",
        "brCompartmentChart", "brCodesChart"
      ].forEach(function (id) {
        showEmptyChart(id, error.message || "Errore dati");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
