(function () {
  "use strict";

  var DATA_URL = "https://data.nazarenolecis.com/pensioni-italia/dashboard.json?v=20260711-14";
  var GEOJSON_URL = "../../data/crisi-abitativa/italy-regions.geojson";
  var MISSING = "ND";
  var COLORS = ["#ff5a1f", "#4e79a7", "#76b7b2", "#f2a541", "#e15759", "#b07aa1", "#59a14f"];
  var MAP_CATEGORY_LABELS = {
    totale: "Totale",
    ivs: "IVS",
    vecchiaia: "Vecchiaia",
    invalidita: "Invalidita'",
    superstiti: "Superstiti",
    indennitaria: "Indennitarie",
    assistenziale: "Assistenziali"
  };
  var MAP_CATEGORY_ORDER = ["totale", "ivs", "vecchiaia", "invalidita", "superstiti", "indennitaria", "assistenziale"];

  var state = {
    payload: null,
    geojson: null,
    mapMetric: "pensionati",
    mapYear: null,
    mapCategory: "totale",
    distributionYear: null,
    distributionSex: "Totale",
    distributionScope: "pensioni",
    distributionMetric: "count",
    ageDistributionYear: null,
    ageDistributionSex: "Totale",
    ageDistributionMetric: "count",
    professionMeasure: "pensioni_vigenti",
    europeCountries: ["Germania", "Francia", "Spagna"],
    transferComponents: [],
    replacementSeries: "eurostat_aggregate",
    replacementSex: "T",
    replacementWorker: "dipendenti_privati",
    replacementCoverage: "obbligatoria",
    replacementMeasure: "lordo",
    systemSeriesMetric: "funding",
    retirementAgeManagement: "fondo_pensioni_lavoratori_dipendenti",
    retirementAgeSex: "Totale",
    retirementAgeMetric: "eta_media_decorrenza_pensione",
    retirementDistributionYear: null,
    retirementDistributionSex: "Totale",
    axisPrefs: {}
  };

  var AXIS_CONTROLLED_CHARTS = {
    piEuropeChart: true,
    piOecdChart: true,
    piReplacementRateChart: true,
    piSystemSeriesChart: true,
    piTransferComponentsChart: true,
    piRateChart: true,
    piContributionCoverageChart: true,
    piProfessionChart: true,
    piRetirementAgeChart: true
  };

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

  function optionalInputNumber(node) {
    if (!node || String(node.value || "").trim() === "") return null;
    return toNumber(node.value);
  }

  function text(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback || MISSING;
    return String(value);
  }

  function italianDate(value) {
    if (!value) return MISSING;
    var parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return text(value);
    return parsed.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
  }

  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function fmt(value, digits) {
    var n = toNumber(value);
    if (n === null) return MISSING;
    return n.toLocaleString("it-IT", {
      maximumFractionDigits: Number.isFinite(digits) ? digits : 0,
      minimumFractionDigits: 0
    });
  }

  function euroBn(value) {
    var n = toNumber(value);
    if (n === null) return MISSING;
    return (n / 1000000000).toLocaleString("it-IT", { maximumFractionDigits: 1 }) + " mld";
  }

  function euro(value) {
    var n = toNumber(value);
    if (n === null) return MISSING;
    return n.toLocaleString("it-IT", { maximumFractionDigits: 0 }) + " euro";
  }

  function clear(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function setStatus(message, isError) {
    var node = byId("piStatus");
    if (!node) return;
    node.textContent = message;
    node.style.color = isError ? "#e15759" : "";
  }

  function showEmpty(id, message) {
    var node = byId(id);
    if (!node) return;
    if (window.Plotly) {
      try { window.Plotly.purge(node); } catch (error) {}
    }
    node.innerHTML = "";
    var empty = document.createElement("div");
    empty.className = "pi-empty";
    empty.textContent = message || "Nessun dato disponibile";
    node.appendChild(empty);
  }

  function baseLayout(extra) {
    var textColor = cssVar("--text", "#f5f2ed");
    var muted = cssVar("--muted", "#b9b2aa");
    var line = cssVar("--line", "#303030");
    var panel = cssVar("--panel", "#090909");
    return Object.assign({
      autosize: true,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: textColor, family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", size: 12 },
      margin: { t: 24, r: 18, b: 58, l: 62 },
      hoverlabel: { bgcolor: panel, bordercolor: line, font: { color: textColor } },
      legend: { orientation: "h", x: 0, xanchor: "left", y: -0.22, font: { color: muted } },
      dragmode: false,
      xaxis: { fixedrange: true, gridcolor: line, zerolinecolor: line, tickfont: { color: muted }, automargin: true },
      yaxis: { fixedrange: true, gridcolor: line, zerolinecolor: line, tickfont: { color: muted }, automargin: true }
    }, extra || {});
  }

  function numericXExtent(traces) {
    var values = [];
    toArray(traces).forEach(function (trace) {
      toArray(trace.x).forEach(function (value) {
        var parsed = toNumber(value);
        if (parsed !== null) values.push(parsed);
      });
    });
    return values.length ? { min: Math.min.apply(null, values), max: Math.max.apply(null, values) } : null;
  }

  function axisState(id) {
    state.axisPrefs[id] = state.axisPrefs[id] || { yAxisMode: "zero", xAxisStart: null };
    return state.axisPrefs[id];
  }

  function axisYears(traces) {
    var values = [];
    toArray(traces).forEach(function (trace) {
      toArray(trace.x).forEach(function (value) {
        var parsed = toNumber(value);
        if (parsed !== null && Number.isInteger(parsed)) values.push(parsed);
      });
    });
    return Array.from(new Set(values)).sort(function (a, b) { return a - b; });
  }

  function ensureAxisControls(id, traces) {
    if (!AXIS_CONTROLLED_CHARTS[id]) return;
    var chart = byId(id);
    if (!chart || !toArray(traces).some(isCartesianTrace)) return;
    var prefs = axisState(id);
    var controls = chart.parentNode.querySelector('[data-pi-axis-for="' + id + '"]');
    var ySelect;
    var xSelect;
    if (!controls) {
      controls = document.createElement("div");
      controls.className = "pi-inline-filters pi-axis-inline";
      controls.setAttribute("data-pi-axis-for", id);

      var yLabel = document.createElement("label");
      var yText = document.createElement("span");
      ySelect = document.createElement("select");
      yText.textContent = "Asse Y";
      [["zero", "Includi lo zero"], ["fit", "Adatta ai dati"]].forEach(function (optionData) {
        var option = document.createElement("option");
        option.value = optionData[0];
        option.textContent = optionData[1];
        ySelect.appendChild(option);
      });
      yLabel.appendChild(yText);
      yLabel.appendChild(ySelect);

      var xLabel = document.createElement("label");
      var xText = document.createElement("span");
      xSelect = document.createElement("select");
      xText.textContent = "Anno iniziale";
      xLabel.appendChild(xText);
      xLabel.appendChild(xSelect);

      controls.appendChild(yLabel);
      controls.appendChild(xLabel);
      chart.parentNode.insertBefore(controls, chart);
      ySelect.addEventListener("change", function () {
        axisState(id).yAxisMode = ySelect.value;
        renderAll();
      });
      xSelect.addEventListener("change", function () {
        axisState(id).xAxisStart = optionalInputNumber(xSelect);
        renderAll();
      });
    }
    ySelect = controls.querySelector("select");
    xSelect = controls.querySelectorAll("select")[1];
    if (ySelect) ySelect.value = prefs.yAxisMode;
    if (xSelect) {
      var years = axisYears(traces);
      var current = prefs.xAxisStart;
      clear(xSelect);
      var allOption = document.createElement("option");
      allOption.value = "";
      allOption.textContent = "Tutti gli anni";
      xSelect.appendChild(allOption);
      years.forEach(function (year) {
        var option = document.createElement("option");
        option.value = year;
        option.textContent = "Dal " + year;
        xSelect.appendChild(option);
      });
      if (current !== null && years.indexOf(current) < 0) {
        prefs.xAxisStart = null;
        current = null;
      }
      xSelect.value = current === null ? "" : String(current);
    }
  }

  function isCartesianTrace(trace) {
    return trace && trace.type !== "choropleth" && toArray(trace.x).length && toArray(trace.y).length;
  }

  function applyAxisPreferences(chartLayout, traces, id) {
    if (!toArray(traces).some(isCartesianTrace)) return chartLayout;
    var prefs = AXIS_CONTROLLED_CHARTS[id] ? axisState(id) : { yAxisMode: "zero", xAxisStart: null };
    chartLayout.xaxis = Object.assign({}, chartLayout.xaxis || {});
    chartLayout.yaxis = Object.assign({}, chartLayout.yaxis || {});
    chartLayout.xaxis.fixedrange = true;
    chartLayout.yaxis.fixedrange = true;
    chartLayout.dragmode = false;

    var extent = numericXExtent(traces);
    if (extent && prefs.xAxisStart !== null) {
      var start = prefs.xAxisStart === null ? extent.min : prefs.xAxisStart;
      var end = extent.max;
      if (start < end) {
        chartLayout.xaxis.range = [start, end];
        chartLayout.xaxis.autorange = false;
      }
    }

    if (prefs.yAxisMode === "fit") {
      delete chartLayout.yaxis.rangemode;
      delete chartLayout.yaxis.range;
      chartLayout.yaxis.autorange = true;
    } else {
      delete chartLayout.yaxis.range;
      delete chartLayout.yaxis.autorange;
      chartLayout.yaxis.rangemode = "tozero";
    }
    return chartLayout;
  }

  function plot(id, traces, layout) {
    var node = byId(id);
    if (!node) return;
    if (!window.Plotly) {
      showEmpty(id, "Plotly non caricato");
      return;
    }
    if (!traces || !traces.length) {
      showEmpty(id, "Nessun dato disponibile");
      return;
    }
    ensureAxisControls(id, traces);
    ensureExportButton(id);
    window.Plotly.react(node, traces, applyAxisPreferences(baseLayout(layout), traces, id), {
      responsive: true,
      displayModeBar: false,
      displaylogo: false,
      modeBarButtonsToRemove: ["lasso2d", "select2d", "toImage"],
      scrollZoom: false,
      doubleClick: "reset"
    })["catch"](function () {
      showEmpty(id, "Errore nella costruzione del grafico");
    });
  }

  function slugify(value) {
    return text(value, "grafico").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "grafico";
  }

  function exportChart(id) {
    var node = byId(id);
    if (!node || !window.Plotly || !node.data) return;
    var card = node.closest(".pi-card") || node.parentNode;
    var title = card && card.querySelector(".pi-card-title h3") ? card.querySelector(".pi-card-title h3").textContent : id;
    var note = card && card.querySelector(".pi-card-note") ? card.querySelector(".pi-card-note").textContent : "";
    var credit = card && card.querySelector(".pi-chart-credit") ? card.querySelector(".pi-chart-credit").textContent : "";
    var exportLayout = Object.assign({}, node.layout || {}, {
      title: { text: title, x: 0.01, xanchor: "left", font: { size: 22 } },
      width: 1400,
      height: 900,
      margin: Object.assign({}, (node.layout && node.layout.margin) || {}, { t: 90, b: 155 }),
      annotations: [
        { text: note, x: 0, y: -0.16, xref: "paper", yref: "paper", xanchor: "left", yanchor: "top", showarrow: false, align: "left", font: { size: 13 } },
        { text: credit, x: 0, y: -0.28, xref: "paper", yref: "paper", xanchor: "left", yanchor: "top", showarrow: false, align: "left", font: { size: 12 } }
      ]
    });
    window.Plotly.toImage({ data: node.data, layout: exportLayout }, { format: "png", width: 1400, height: 900 })
      .then(function (url) {
        var link = document.createElement("a");
        link.href = url;
        link.download = slugify(title) + ".png";
        link.click();
      });
  }

  function ensureExportButton(id) {
    var node = byId(id);
    if (!node) return;
    var card = node.closest(".pi-card");
    if (!card || card.querySelector('[data-pi-export-for="' + id + '"]')) return;
    var titleRow = card.querySelector(".pi-card-title") || card;
    var button = document.createElement("button");
    button.type = "button";
    button.className = "pi-export-button";
    button.setAttribute("data-pi-export-for", id);
    button.setAttribute("aria-label", "Esporta grafico in PNG");
    button.textContent = "PNG";
    button.addEventListener("click", function () { exportChart(id); });
    titleRow.appendChild(button);
  }

  function tableRows(key) {
    return toArray(state.payload && state.payload.tables && state.payload.tables.final && state.payload.tables.final[key] && state.payload.tables.final[key].rows);
  }

  function latest(rows, predicate) {
    return toArray(rows)
      .filter(predicate || function () { return true; })
      .sort(function (a, b) { return (toNumber(b.anno) || 0) - (toNumber(a.anno) || 0); })[0] || null;
  }

  function rowsByIndicator(rows, indicator) {
    return toArray(rows).filter(function (row) { return row.indicatore_id === indicator; });
  }

  function makeKpi(label, value, year, note) {
    var item = document.createElement("div");
    item.className = "pi-kpi";
    var labelNode = document.createElement("span");
    var valueNode = document.createElement("strong");
    var yearNode = document.createElement("em");
    var noteNode = document.createElement("small");
    labelNode.textContent = label;
    valueNode.textContent = value;
    yearNode.textContent = year ? "Anno " + year : "";
    noteNode.textContent = note || "";
    item.appendChild(labelNode);
    item.appendChild(valueNode);
    item.appendChild(yearNode);
    item.appendChild(noteNode);
    return item;
  }

  function labelGroup(value) {
    var labels = {
      ex_dipendenti_privati: "Ex dipendenti privati",
      ex_dipendenti_pubblici: "Ex dipendenti pubblici",
      ex_imprenditori_autonomi: "Artigiani e commercianti",
      ex_autonomi_agricoli: "Ex autonomi agricoli",
      ex_partite_iva_parasubordinati: "Autonomi e parasubordinati",
      altre_gestioni: "Altre gestioni",
      prestazioni_assistenziali: "Prestazioni assistenziali"
    };
    return labels[value] || text(value).replace(/_/g, " ");
  }

  function renderKpis() {
    var annual = tableRows("annual_pensions");
    var node = byId("piKpis");
    clear(node);

    var pensioni = latest(annual, function (row) { return row.indicatore_id === "pensioni_vigenti" && row.area === "Italia - INPS"; });
    var pensionati = latest(annual, function (row) { return row.indicatore_id === "pensionati" && row.area === "Italia - complessivi"; });
    var pensionatiInps = latest(annual, function (row) { return row.indicatore_id === "pensionati" && row.area === "Italia - INPS"; });
    var reddito = latest(annual, function (row) { return row.indicatore_id === "reddito_pensionistico_totale" && row.area === "Italia - complessivi"; });
    var ratio = latest(annual, function (row) { return row.indicatore_id === "trattamenti_per_pensionato" && row.area === "Italia - INPS"; });
    var redditoInps = latest(annual, function (row) { return row.indicatore_id === "reddito_pensionistico_totale" && row.area === "Italia - INPS"; });
    var contributi = latest(annual, function (row) { return row.indicatore_id === "entrate_contributive_inps"; });
    var medio = latest(annual, function (row) { return row.indicatore_id === "reddito_pensionistico_medio_mensile" && row.area === "Italia - complessivi"; });

    node.appendChild(makeKpi("Reddito pensionistico lordo", euroBn(reddito && reddito.valore), reddito && reddito.anno, "Totale sistema; di cui pensionati INPS: " + euroBn(redditoInps && redditoInps.valore)));
    node.appendChild(makeKpi("Contributi INPS", euroBn(contributi && contributi.valore), contributi && contributi.anno, "Entrate contributive complessive INPS"));
    node.appendChild(makeKpi("Pensioni INPS", fmt(pensioni && pensioni.valore), pensioni && pensioni.anno, "Prestazioni vigenti"));
    node.appendChild(makeKpi("Pensionati complessivi", fmt(pensionati && pensionati.valore), pensionati && pensionati.anno, "Di cui INPS: " + fmt(pensionatiInps && pensionatiInps.valore)));
    node.appendChild(makeKpi("Pensioni per pensionato", fmt(ratio && ratio.valore, 2), ratio && ratio.anno, "Rapporto nel perimetro INPS"));
    node.appendChild(makeKpi("Reddito medio lordo", euro(medio && medio.valore), medio && medio.anno, "Equivalente mensile del reddito annuo"));
  }

  function denseYears(rows) {
    var ordered = toArray(rows).slice().sort(function (a, b) { return a.anno - b.anno; });
    if (!ordered.length) return { years: [], values: [], areas: [] };
    var byYear = {};
    ordered.forEach(function (row) { byYear[row.anno] = row; });
    var years = [];
    var values = [];
    var areas = [];
    for (var year = ordered[0].anno; year <= ordered[ordered.length - 1].anno; year += 1) {
      years.push(year);
      values.push(byYear[year] ? toNumber(byYear[year].valore) : null);
      areas.push(byYear[year] ? byYear[year].area : "Dato non disponibile");
    }
    return { years: years, values: values, areas: areas };
  }

  function renderContributionsChart() {
    var rows = rowsByIndicator(tableRows("annual_pensions"), "entrate_contributive_inps");
    var series = denseYears(rows);
    plot("piContributionsChart", [{
      type: "scatter",
      mode: "lines+markers",
      name: "Entrate contributive INPS",
      x: series.years,
      y: series.values.map(function (value) { return value === null ? null : value / 1000000000; }),
      connectgaps: false,
      line: { color: COLORS[1], width: 3 },
      marker: { size: 7 },
      hovertemplate: "%{x}<br>%{y:.1f} miliardi di euro<extra></extra>"
    }], { showlegend: false, xaxis: { dtick: 1, fixedrange: true, gridcolor: cssVar("--line", "#303030") }, yaxis: { title: "miliardi di euro", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") } });
  }

  function renderSpendingChart() {
    var rows = rowsByIndicator(tableRows("annual_pensions"), "reddito_pensionistico_totale")
      .filter(function (row) { return row.area === "Italia - complessivi" && toNumber(row.anno) >= 2018; });
    var series = denseYears(rows);
    plot("piSpendingChart", [{
      type: "scatter",
      mode: "lines+markers",
      name: "Reddito pensionistico lordo complessivo",
      x: series.years,
      y: series.values.map(function (value) { return value === null ? null : value / 1000000000; }),
      connectgaps: false,
      line: { color: COLORS[0], width: 3 },
      marker: { size: 7 },
      hovertemplate: "%{x}<br>%{y:.1f} miliardi di euro<extra></extra>"
    }], { showlegend: false, xaxis: { dtick: 1, fixedrange: true, gridcolor: cssVar("--line", "#303030") }, yaxis: { title: "miliardi di euro", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") } });
  }

  function valuesByYear(rows, years, scale) {
    var byYear = {};
    toArray(rows).forEach(function (row) { byYear[toNumber(row.anno)] = toNumber(row.valore); });
    return years.map(function (year) {
      return byYear[year] === undefined || byYear[year] === null ? null : byYear[year] / (scale || 1);
    });
  }

  function rowYears(rows) {
    return Array.from(new Set(toArray(rows).map(function (row) { return toNumber(row.anno); }))).filter(function (year) { return year !== null; });
  }

  function commonYears(rowGroups) {
    var groups = toArray(rowGroups).map(function (rows) { return rowYears(rows); }).filter(function (years) { return years.length; });
    if (!groups.length) return [];
    return groups[0].filter(function (year) {
      return groups.every(function (years) { return years.indexOf(year) >= 0; });
    }).sort(function (a, b) { return a - b; });
  }

  function latestContinuousYears(years) {
    var sorted = Array.from(new Set(toArray(years).map(toNumber).filter(function (year) { return year !== null; }))).sort(function (a, b) { return a - b; });
    if (!sorted.length) return [];
    var available = {};
    sorted.forEach(function (year) { available[year] = true; });
    var block = [sorted[sorted.length - 1]];
    for (var year = block[0] - 1; available[year]; year -= 1) block.unshift(year);
    return block;
  }

  function fundingSeries() {
    var annual = tableRows("annual_pensions");
    var transfers = rowsByIndicator(tableRows("state_transfers"), "trasferimenti_stato_inps");
    var contributions = rowsByIndicator(annual, "entrate_contributive_inps");
    var spending = rowsByIndicator(annual, "reddito_pensionistico_totale").filter(function (row) {
      return row.area === "Italia - complessivi";
    });
    var inpsSpending = rowsByIndicator(annual, "reddito_pensionistico_totale").filter(function (row) {
      return row.area === "Italia - INPS";
    });
    var years = commonYears([contributions, spending, inpsSpending, transfers])
      .filter(function (year) { return year >= 2018; });

    return {
      years: years,
      traces: [
        { type: "scatter", mode: "lines+markers", name: "Contributi INPS", x: years, y: valuesByYear(contributions, years, 1000000000), connectgaps: false, line: { color: COLORS[1], width: 3 }, marker: { size: 7 }, hovertemplate: "%{x}<br>%{y:.1f} miliardi di euro<extra></extra>" },
        { type: "scatter", mode: "lines+markers", name: "Reddito pensionistico complessivo", x: years, y: valuesByYear(spending, years, 1000000000), connectgaps: false, line: { color: COLORS[0], width: 3 }, marker: { size: 7 }, hovertemplate: "%{x}<br>%{y:.1f} miliardi di euro<extra></extra>" },
        { type: "scatter", mode: "lines+markers", name: "Di cui pensionati INPS", x: years, y: valuesByYear(inpsSpending, years, 1000000000), connectgaps: false, line: { color: COLORS[0], width: 2, dash: "dot" }, marker: { size: 6 }, hovertemplate: "%{x}<br>%{y:.1f} miliardi di euro<extra></extra>" },
        { type: "scatter", mode: "lines+markers", name: "Trasferimenti Stato all'INPS", x: years, y: valuesByYear(transfers, years, 1000000000), connectgaps: false, line: { color: COLORS[3], width: 3 }, marker: { size: 7 }, hovertemplate: "%{x}<br>%{y:.1f} miliardi di euro<extra></extra>" }
      ]
    };
  }

  function updateSystemSeriesCopy(metric) {
    var title = byId("piSystemSeriesTitle");
    var tag = byId("piSystemSeriesTag");
    var note = byId("piSystemSeriesNote");
    var copy = {
      funding: {
        title: "Reddito pensionistico, contributi e trasferimenti complessivi all'INPS",
        tag: "flussi lordi",
        note: "Le serie confrontano grandezze aggregate con perimetri differenti. I trasferimenti dello Stato finanziano il complesso delle attivita' INPS e comprendono pensioni, assistenza, sostegno al reddito, famiglia, sgravi e altre voci. Le linee non costituiscono un'identita' contabile e non vanno sommate tra loro."
      },
      spending: {
        title: "Reddito pensionistico lordo",
        tag: "totale e di cui INPS",
        note: "Il totale complessivo conta tutti i pensionati; il sottoinsieme INPS conta le persone che percepiscono almeno una prestazione INPS. Non sono grandezze identiche."
      },
      contributions: {
        title: "Contributi incassati dall'INPS",
        tag: "entrate contributive",
        note: "Entrate contributive accertate nei bilanci e rendiconti INPS. La serie misura incassi del sistema INPS, non contributi individuali medi."
      },
      pensions_pensioners: {
        title: "Pensioni e pensionati",
        tag: "trattamenti e persone",
        note: "Le pensioni sono singoli trattamenti; i pensionati sono persone. Una persona puo' cumulare piu' prestazioni, quindi le due linee non devono coincidere."
      },
      income: {
        title: "Reddito pensionistico medio lordo",
        tag: "annuo / 12",
        note: "Equivalente mensile del reddito annuo: somma annua lorda dei trattamenti divisa per pensionati e per 12. Non coincide necessariamente con una singola rata mensile."
      }
    }[metric] || {};
    if (title) title.textContent = copy.title || "Serie storiche del sistema";
    if (tag) tag.textContent = copy.tag || "seleziona misura";
    if (note) note.textContent = copy.note || "";
  }

  function renderFundingChart() {
    var series = fundingSeries();
    plot("piFundingChart", series.traces, {
      xaxis: { dtick: 1, fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      yaxis: { title: "miliardi di euro", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      legend: { orientation: "h", x: 0, y: -0.24, font: { color: cssVar("--muted", "#b9b2aa") } }
    });
  }

  function renderSystemSeriesChart() {
    var metric = state.systemSeriesMetric;
    updateSystemSeriesCopy(metric);
    var annual = tableRows("annual_pensions");
    var traces = [];
    var layout = {
      xaxis: { dtick: 1, fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      yaxis: { title: "miliardi di euro", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      legend: { orientation: "h", x: 0, y: -0.24, font: { color: cssVar("--muted", "#b9b2aa") } }
    };

    if (metric === "funding") {
      traces = fundingSeries().traces;
    } else if (metric === "spending") {
      var spending = denseYears(rowsByIndicator(annual, "reddito_pensionistico_totale").filter(function (row) { return row.area === "Italia - complessivi" && toNumber(row.anno) >= 2018; }));
      var spendingInps = denseYears(rowsByIndicator(annual, "reddito_pensionistico_totale").filter(function (row) { return row.area === "Italia - INPS" && toNumber(row.anno) >= 2018; }));
      traces = [
        { type: "scatter", mode: "lines+markers", name: "Totale complessivo", x: spending.years, y: spending.values.map(function (value) { return value === null ? null : value / 1000000000; }), connectgaps: false, line: { color: COLORS[0], width: 3 }, marker: { size: 7 }, hovertemplate: "%{x}<br>%{y:.1f} miliardi di euro<extra></extra>" },
        { type: "scatter", mode: "lines+markers", name: "Di cui pensionati INPS", x: spendingInps.years, y: spendingInps.values.map(function (value) { return value === null ? null : value / 1000000000; }), connectgaps: false, line: { color: COLORS[2], width: 2.5, dash: "dot" }, marker: { size: 7 }, hovertemplate: "%{x}<br>%{y:.1f} miliardi di euro<extra></extra>" }
      ];
    } else if (metric === "contributions") {
      var contributions = denseYears(rowsByIndicator(annual, "entrate_contributive_inps"));
      traces = [{ type: "scatter", mode: "lines+markers", name: "Contributi INPS", x: contributions.years, y: contributions.values.map(function (value) { return value === null ? null : value / 1000000000; }), connectgaps: false, line: { color: COLORS[1], width: 3 }, marker: { size: 7 }, hovertemplate: "%{x}<br>%{y:.1f} miliardi di euro<extra></extra>" }];
      layout.showlegend = false;
    } else if (metric === "pensions_pensioners") {
      var pensions = rowsByIndicator(annual, "pensioni_vigenti").filter(function (row) { return row.area === "Italia - INPS" && toNumber(row.anno) >= 2018; }).sort(function (a, b) { return toNumber(a.anno) - toNumber(b.anno); });
      var pensioners = rowsByIndicator(annual, "pensionati").filter(function (row) { return row.area === "Italia - complessivi" && toNumber(row.anno) >= 2018; }).sort(function (a, b) { return toNumber(a.anno) - toNumber(b.anno); });
      traces = [
        { type: "scatter", mode: "lines+markers", name: "Pensioni vigenti INPS", x: pensions.map(function (row) { return row.anno; }), y: pensions.map(function (row) { return toNumber(row.valore) / 1000000; }), line: { color: COLORS[0], width: 3 }, marker: { size: 7 }, hovertemplate: "%{x}<br>%{y:.2f} milioni<extra></extra>" },
        { type: "scatter", mode: "lines+markers", name: "Pensionati complessivi", x: pensioners.map(function (row) { return row.anno; }), y: pensioners.map(function (row) { return toNumber(row.valore) / 1000000; }), line: { color: COLORS[2], width: 3 }, marker: { size: 7 }, hovertemplate: "%{x}<br>%{y:.2f} milioni<extra></extra>" }
      ];
      layout.yaxis.title = "milioni";
    } else if (metric === "income") {
      var income = denseYears(rowsByIndicator(annual, "reddito_pensionistico_medio_mensile").filter(function (row) { return row.area === "Italia - complessivi" && toNumber(row.anno) >= 2018; }));
      traces = [{ type: "scatter", mode: "lines+markers", name: "Reddito pensionistico medio mensile", x: income.years, y: income.values, connectgaps: false, line: { color: COLORS[3], width: 3 }, marker: { size: 8 }, hovertemplate: "%{x}<br>%{y:,.0f} euro al mese<extra></extra>" }];
      layout.yaxis.title = "euro al mese";
      layout.showlegend = false;
    }
    plot("piSystemSeriesChart", traces, layout);
  }

  function renderTransferComponentsChart() {
    var rows = rowsByIndicator(tableRows("state_transfers"), "trasferimenti_stato_inps_per_componente");
    var years = Array.from(new Set(rows.map(function (row) { return toNumber(row.anno); }))).filter(Boolean).sort();
    var available = Array.from(new Set(rows.map(function (row) { return row.categoria_analitica; })));
    var selected = state.transferComponents.length ? state.transferComponents : available;
    var labels = {};
    rows.forEach(function (row) { labels[row.categoria_analitica] = row.voce_nome; });
    var traces = selected.map(function (component, index) {
      var byYear = {};
      rows.filter(function (row) { return row.categoria_analitica === component; }).forEach(function (row) { byYear[toNumber(row.anno)] = toNumber(row.valore); });
      return {
        type: "bar",
        name: labels[component] || text(component),
        x: years.map(String),
        y: years.map(function (year) { return byYear[year] === undefined ? null : byYear[year] / 1000000000; }),
        marker: { color: COLORS[index % COLORS.length] },
        hovertemplate: "%{x}<br>%{fullData.name}: %{y:.1f} miliardi di euro<extra></extra>"
      };
    });
    plot("piTransferComponentsChart", traces, {
      barmode: "stack",
      xaxis: { type: "category", fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      yaxis: { title: "miliardi di euro", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      legend: { orientation: "h", x: 0, y: -0.32, font: { color: cssVar("--muted", "#b9b2aa") } },
      margin: { t: 18, r: 18, b: 100, l: 72 }
    });
  }

  function renderContributionCoverageChart() {
    var rows = rowsByIndicator(tableRows("demography_work"), "rapporto_contributi_reddito_pensionistico_inps");
    if (!rows.length) rows = rowsByIndicator(tableRows("demography_work"), "copertura_spesa_contributi");
    rows = rows
      .sort(function (a, b) { return toNumber(a.anno) - toNumber(b.anno); });
    plot("piContributionCoverageChart", [{
      type: "scatter",
      mode: "lines+markers",
      name: "Contributi / reddito pensionistico INPS",
      x: rows.map(function (row) { return row.anno; }),
      y: rows.map(function (row) { return toNumber(row.valore); }),
      line: { color: COLORS[3], width: 3 },
      marker: { size: 8 },
      hovertemplate: "%{x}<br>Entrate contributive pari al %{y:.1f}% del reddito pensionistico del perimetro INPS<extra></extra>"
    }], {
      showlegend: false,
      xaxis: { dtick: 1, fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      yaxis: { title: "% del reddito pensionistico INPS", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") }
    });
  }

  function renderPensionIncomeChart() {
    var rows = rowsByIndicator(tableRows("annual_pensions"), "reddito_pensionistico_medio_mensile")
      .filter(function (row) { return row.area === "Italia - complessivi" && toNumber(row.anno) >= 2018; });
    var series = denseYears(rows);
    plot("piPensionIncomeChart", [{
      type: "scatter",
      mode: "lines+markers",
      name: "Reddito pensionistico medio mensile",
      x: series.years,
      y: series.values,
      connectgaps: false,
      line: { color: COLORS[3], width: 3 },
      marker: { size: 8 },
      hovertemplate: "%{x}<br>%{y:,.0f} euro al mese<extra></extra>"
    }], { showlegend: false, xaxis: { dtick: 1, fixedrange: true, gridcolor: cssVar("--line", "#303030") }, yaxis: { title: "euro al mese", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") } });
  }

  function renderCountChart(id, indicator, preferredArea, label, color) {
    var allRows = rowsByIndicator(tableRows("annual_pensions"), indicator).filter(function (row) {
      return row.area === preferredArea && toNumber(row.anno) >= 2018;
    });
    var rows = [];
    Array.from(new Set(allRows.map(function (row) { return row.anno; }))).sort().forEach(function (year) {
      var candidates = allRows.filter(function (row) { return row.anno === year; });
      var selected = candidates.filter(function (row) { return row.area === preferredArea; })[0] || candidates[0];
      if (selected) rows.push(selected);
    });
    var traces = [{
        type: "scatter",
        mode: "lines+markers",
        name: label,
        x: rows.map(function (row) { return row.anno; }),
        y: rows.map(function (row) { return toNumber(row.valore) / 1000000; }),
        text: rows.map(function (row) { return row.area; }),
        line: { color: color, width: 3 },
        marker: { size: 7 },
        hovertemplate: "%{x}<br>%{y:.2f} milioni<br>%{text}<extra></extra>"
      }];
    plot(id, traces, {
      showlegend: false,
      xaxis: { dtick: 1, fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      yaxis: { title: "milioni", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") }
    });
  }

  function renderPensionsChart() {
    renderCountChart("piPensionsChart", "pensioni_vigenti", "Italia - INPS", "Pensioni vigenti", COLORS[0]);
  }

  function renderPensionersChart() {
    renderCountChart("piPensionersChart", "pensionati", "Italia - complessivi", "Pensionati", COLORS[2]);
  }

  function renderRateChart() {
    var rows = tableRows("system_parameters")
      .filter(function (row) { return row.parametro_id === "aliquota_ivs_fpld_totale_fine_anno"; })
      .sort(function (a, b) { return a.anno - b.anno; });
    var current = tableRows("system_parameters").filter(function (row) { return row.parametro_id === "aliquota_ivs_standard_ago_corrente"; });
    var traces = [{
      type: "scatter",
      mode: "lines",
      name: "FPLD totale a fine anno",
      x: rows.map(function (row) { return row.anno; }),
      y: rows.map(function (row) { return row.valore; }),
      line: { color: COLORS[0], width: 3 }
    }];
    if (current.length) {
      traces.push({
        type: "scatter",
        mode: "markers",
        name: "Riferimento corrente AGO/FPLD",
        x: current.map(function (row) { return row.anno; }),
        y: current.map(function (row) { return row.valore; }),
        marker: { color: COLORS[2], size: 11, symbol: "diamond" }
      });
    }
    plot("piRateChart", traces, { yaxis: { title: "%", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") } });
  }

  function renderEuropeChart() {
    var comparison = tableRows("european_comparison");
    var rows = rowsByIndicator(comparison, "spesa_pensionistica_pil_esspros");
    var countries = ["Italia", "Unione europea (27)"].concat(state.europeCountries);
    var colors = { "Italia": COLORS[0], "Unione europea (27)": COLORS[2] };
    var traces = countries.map(function (country, index) {
      var countryRows = rows.filter(function (row) { return row.paese === country; })
        .sort(function (a, b) { return toNumber(a.anno) - toNumber(b.anno); });
      if (!countryRows.length) return null;
      return {
        type: "scatter",
        mode: country === "Italia" ? "lines+markers" : "lines",
        name: country,
        x: countryRows.map(function (row) { return row.anno; }),
        y: countryRows.map(function (row) { return row.valore; }),
        line: { color: colors[country] || COLORS[(index + 1) % COLORS.length], width: country === "Italia" ? 4 : 2.2, dash: country === "Unione europea (27)" ? "dash" : "solid" },
        marker: { size: 6 },
        hovertemplate: country + "<br>%{x}: %{y:.1f}% del PIL<extra></extra>"
      };
    }).filter(Boolean);
    plot("piEuropeChart", traces, {
      xaxis: { dtick: 2, fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      yaxis: { title: "% del PIL", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      legend: { orientation: "h", x: 0, y: -0.24, font: { color: cssVar("--muted", "#b9b2aa") } }
    });
  }

  function renderOecdChart() {
    var rows = rowsByIndicator(tableRows("european_comparison"), "spesa_pensionistica_pil_oecd_pubblica");
    var selectedYears = [2000, 2010, 2020, 2021];
    var colors = { "Italia": COLORS[0], "Media OCSE": COLORS[2] };
    var traces = ["Italia", "Media OCSE"].map(function (country) {
      var series = rows.filter(function (row) { return row.paese === country && selectedYears.indexOf(toNumber(row.anno)) >= 0; }).sort(function (a, b) { return toNumber(a.anno) - toNumber(b.anno); });
      if (!series.length) return null;
      return {
        type: "scatter",
        mode: "lines+markers",
        name: country,
        x: series.map(function (row) { return row.anno; }),
        y: series.map(function (row) { return row.valore; }),
        line: { color: colors[country], width: country === "Italia" ? 4 : 2.5, dash: country === "Italia" ? "solid" : "dash" },
        marker: { size: 7 },
        hovertemplate: country + "<br>%{x}: %{y:.1f}% del PIL<extra></extra>"
      };
    }).filter(Boolean);
    plot("piOecdChart", traces, {
      xaxis: { dtick: 5, fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      yaxis: { title: "% del PIL", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      legend: { orientation: "h", x: 0, y: -0.24, font: { color: cssVar("--muted", "#b9b2aa") } }
    });
  }

  function renderReplacementRateChart() {
    var title = byId("piReplacementTitle");
    var tag = byId("piReplacementTag");
    var note = byId("piReplacementNote");
    var credit = byId("piReplacementCredit");
    if (state.replacementSeries === "eurostat_aggregate") {
      var rows = rowsByIndicator(tableRows("european_comparison"), "tasso_sostituzione_aggregato_eurostat")
        .filter(function (row) { return row.paese === "Italia" && row.definizione === "aggregato|" + state.replacementSex; })
        .sort(function (a, b) { return toNumber(a.anno) - toNumber(b.anno); });
      if (title) title.textContent = "Tasso di sostituzione aggregato";
      if (tag) tag.textContent = "Eurostat, " + (rows[0] ? rows[0].anno : "") + "-" + (rows[rows.length - 1] ? rows[rows.length - 1].anno : "");
      if (note) note.textContent = "Rapporto aggregato tra pensione individuale mediana lorda delle persone 65-74 e reddito individuale mediano lordo da lavoro delle persone 50-59. E' annuale e osservato, ma non coincide con il tasso RGS di un profilo tipo.";
      if (credit) credit.textContent = "Fonte: Eurostat, dataset ilc_pnp3. Elaborazione di Nazareno Lecis.";
      plot("piReplacementRateChart", [{
        type: "scatter",
        mode: "lines+markers",
        name: "Italia",
        x: rows.map(function (row) { return row.anno; }),
        y: rows.map(function (row) { return row.valore; }),
        line: { color: COLORS[0], width: 3 },
        marker: { size: 8 },
        hovertemplate: "%{x}<br>%{y:.1f}%<extra>Tasso aggregato</extra>"
      }], {
        showlegend: false,
        xaxis: { dtick: 1, fixedrange: true, gridcolor: cssVar("--line", "#303030") },
        yaxis: { title: "%", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") }
      });
      return;
    }

    var target = [state.replacementWorker, state.replacementCoverage, state.replacementMeasure].join("|");
    var rgsRows = rowsByIndicator(tableRows("european_comparison"), "tasso_sostituzione_rgs")
      .filter(function (row) { return row.definizione === target; })
      .sort(function (a, b) { return toNumber(a.anno) - toNumber(b.anno); });
    var observed = rgsRows.filter(function (row) { return toNumber(row.anno) <= 2020; });
    var projections = rgsRows.filter(function (row) { return toNumber(row.anno) >= 2030; });
    var bridge = [];
    var ref2020 = observed.filter(function (row) { return toNumber(row.anno) === 2020; })[0];
    var proj2030 = projections.filter(function (row) { return toNumber(row.anno) === 2030; })[0];
    if (ref2020 && proj2030) bridge = [ref2020, proj2030];
    if (title) title.textContent = "Tasso di sostituzione: profilo RGS e proiezioni";
    if (tag) tag.textContent = "scenario RGS";
    if (note) note.textContent = "Rapporto tra prima pensione e ultima retribuzione o reddito del profilo selezionato. I punti 2010 e 2020 sono valori di riferimento della tavola RGS; il segmento tratteggiato collega 2020 al primo scenario futuro, mentre i valori dal 2030 sono proiezioni dello scenario nazionale base.";
    if (credit) credit.textContent = "Fonte: MEF-RGS, Rapporto n. 26/2025, Tavola 6.4. Elaborazione di Nazareno Lecis.";
    plot("piReplacementRateChart", [
      { type: "scatter", mode: "lines+markers", name: "Valori di riferimento", x: observed.map(function (row) { return row.anno; }), y: observed.map(function (row) { return row.valore; }), line: { color: COLORS[0], width: 3 }, marker: { size: 8 }, hovertemplate: "%{x}<br>%{y:.1f}%<extra>Valore di riferimento</extra>" },
      { type: "scatter", mode: "lines", name: "Collegamento 2020-2030", x: bridge.map(function (row) { return row.anno; }), y: bridge.map(function (row) { return row.valore; }), line: { color: COLORS[3], width: 2.5, dash: "dash" }, hoverinfo: "skip", showlegend: false },
      { type: "scatter", mode: "lines+markers", name: "Proiezione RGS", x: projections.map(function (row) { return row.anno; }), y: projections.map(function (row) { return row.valore; }), line: { color: COLORS[3], width: 3, dash: "dash" }, marker: { size: 8, symbol: "diamond" }, hovertemplate: "%{x}<br>%{y:.1f}%<extra>Proiezione RGS</extra>" }
    ], {
      xaxis: { dtick: 10, fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      yaxis: { title: "% dell'ultima retribuzione o reddito", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      legend: { orientation: "h", x: 0, y: -0.24, font: { color: cssVar("--muted", "#b9b2aa") } }
    });
  }

  function orderedDistribution(rows) {
    return toArray(rows).sort(function (a, b) {
      var av = toNumber(a.classe_importo_min);
      var bv = toNumber(b.classe_importo_min);
      if (av === null) return 1;
      if (bv === null) return -1;
      return av - bv;
    });
  }

  var COMPACT_DISTRIBUTION_BINS = [
    { label: "Fino a 499,99", min: 0, max: 499.99 },
    { label: "500,00-999,99", min: 500, max: 999.99 },
    { label: "1000,00-1499,99", min: 1000, max: 1499.99 },
    { label: "1500,00-1999,99", min: 1500, max: 1999.99 },
    { label: "2000,00-2499,99", min: 2000, max: 2499.99 },
    { label: "2500,00-2999,99", min: 2500, max: 2999.99 },
    { label: "3000,00 e oltre", min: 3000, max: null }
  ];

  var DETAILED_DISTRIBUTION_BINS = [
    { label: "Fino a 499,99", min: 0, max: 499.99 },
    { label: "500,00-999,99", min: 500, max: 999.99 },
    { label: "1000,00-1499,99", min: 1000, max: 1499.99 },
    { label: "1500,00-1999,99", min: 1500, max: 1999.99 },
    { label: "2000,00-2499,99", min: 2000, max: 2499.99 },
    { label: "2500,00-2999,99", min: 2500, max: 2999.99 },
    { label: "3000,00-3499,99", min: 3000, max: 3499.99 },
    { label: "3500,00-3999,99", min: 3500, max: 3999.99 },
    { label: "4000,00-4999,99", min: 4000, max: 4999.99 },
    { label: "5000,00 e oltre", min: 5000, max: null }
  ];

  function distributionBins(rows) {
    var highRows = toArray(rows).filter(function (row) {
      var min = toNumber(row.classe_importo_min);
      return min !== null && min >= 3000;
    });
    if (!highRows.length) return COMPACT_DISTRIBUTION_BINS;
    var detailed = highRows.every(function (row) {
      var min = toNumber(row.classe_importo_min);
      var max = toNumber(row.classe_importo_max);
      return min >= 5000 || (max !== null && max <= 4999.99);
    });
    return detailed ? DETAILED_DISTRIBUTION_BINS : COMPACT_DISTRIBUTION_BINS;
  }

  function commonDistributionBin(row, bins) {
    var min = toNumber(row.classe_importo_min);
    var max = toNumber(row.classe_importo_max);
    if (min === null && max === null) return null;
    var reference = min === null ? 0 : min;
    for (var i = 0; i < bins.length; i += 1) {
      var bin = bins[i];
      if (bin.max === null && reference >= bin.min) return bin;
      if (bin.max !== null && reference >= bin.min && reference <= bin.max) return bin;
    }
    return bins[bins.length - 1];
  }

  function rowsForDistribution(table, population, indicator, year, sex) {
    var base = table.filter(function (row) {
      return row.popolazione === population && row.indicatore_id === indicator && toNumber(row.anno) === year;
    });
    var selected = base.filter(function (row) { return row.sesso === sex; });
    return selected.length ? selected : base.filter(function (row) { return row.sesso === "Totale"; });
  }

  function aggregateDistributionRows(rows) {
    var bins = distributionBins(rows);
    var grouped = {};
    orderedDistribution(rows).forEach(function (row) {
      var bin = commonDistributionBin(row, bins);
      var value = toNumber(row.valore);
      if (!bin || value === null) return;
      grouped[bin.label] = (grouped[bin.label] || 0) + value;
    });
    return bins.map(function (bin) {
      return { classe_importo: bin.label, valore: grouped[bin.label] };
    }).filter(function (row) { return row.valore !== undefined; });
  }

  function aggregateAverageDistribution(table, population, countIndicator, amountIndicator, year, sex) {
    var counts = aggregateDistributionRows(rowsForDistribution(table, population, countIndicator, year, sex));
    var amounts = aggregateDistributionRows(rowsForDistribution(table, population, amountIndicator, year, sex));
    var amountByClass = {};
    amounts.forEach(function (row) { amountByClass[row.classe_importo] = toNumber(row.valore); });
    return counts.map(function (row) {
      var count = toNumber(row.valore);
      var amount = amountByClass[row.classe_importo];
      return {
        classe_importo: row.classe_importo,
        valore: count && amount ? amount / count / 12 : null
      };
    }).filter(function (row) { return row.valore !== null; });
  }

  function aggregateDistribution(table, population, measure, year, sex) {
    if (measure === "importo_medio_pensione_mensile_classe") {
      return aggregateAverageDistribution(table, population, "pensioni_per_classe_importo", "spesa_per_classe_importo", year, sex);
    }
    if (measure === "reddito_pensionistico_medio_mensile_classe") {
      return aggregateAverageDistribution(table, population, "pensionati_per_classe_reddito_pensionistico", "reddito_pensionistico_totale", year, sex);
    }
    if (measure === "reddito_pensionistico_netto_stimato_medio_mensile_classe") {
      return aggregateAverageDistribution(table, population, "pensionati_per_classe_reddito_pensionistico", "reddito_pensionistico_netto_stimato_totale", year, sex);
    }
    return aggregateDistributionRows(rowsForDistribution(table, population, measure, year, sex));
  }

  function hasDistributionSex(table, population, indicator, year, sex) {
    return table.some(function (row) {
      return row.popolazione === population && row.indicatore_id === indicator && toNumber(row.anno) === year && row.sesso === sex;
    });
  }

  function distributionConfig() {
    var isPensions = state.distributionScope === "pensioni";
    var configs = {
      pensioni: {
        population: "pensioni",
        color: COLORS[0],
        title: "Pensioni per classe d'importo",
        tag: "trattamenti lordi",
        source: "Fonte: INPS, Open Data, Appendici statistiche, Casellario dei pensionati 2024 e repository pensioni. Elaborazione di Nazareno Lecis.",
        measures: {
          count: { indicator: "pensioni_per_classe_importo", scale: 1000000, axis: "milioni di pensioni", suffix: " mln pensioni", label: "Numero di pensioni", title: "Pensioni per classe d'importo" },
          total: { indicator: "spesa_per_classe_importo", scale: 1000000000, axis: "miliardi di euro annui", suffix: " mld euro", label: "Ammontare lordo complessivo", amount: true, title: "Spesa lorda per classe d'importo" },
          average: { indicator: "importo_medio_pensione_mensile_classe", scale: 1, axis: "euro al mese", suffix: " euro al mese", label: "Equivalente mensile lordo della pensione" }
        },
        note: "Classifica i singoli trattamenti per importo mensile lordo. Una persona puo' ricevere piu' trattamenti, quindi questo grafico non conta teste uniche."
      },
      pensionati: {
        population: "pensionati_inps",
        color: COLORS[2],
        title: "Reddito pensionistico dei pensionati",
        tag: "persone e redditi lordi",
        source: "Fonte: INPS, Open Data, Appendici statistiche e repository pensioni. Elaborazione di Nazareno Lecis.",
        measures: {
          count: { indicator: "pensionati_per_classe_reddito_pensionistico", scale: 1000000, axis: "milioni di pensionati", suffix: " mln pensionati", label: "Numero di pensionati", title: "Pensionati per reddito pensionistico" },
          total: { indicator: "reddito_pensionistico_totale", scale: 1000000000, axis: "miliardi di euro annui", suffix: " mld euro", label: "Ammontare lordo complessivo", amount: true, title: "Ammontare lordo del reddito pensionistico" },
          average: { indicator: "reddito_pensionistico_medio_mensile_classe", scale: 1, axis: "euro al mese", suffix: " euro al mese", label: "Equivalente mensile lordo del reddito annuo", title: "Equivalente mensile lordo del reddito pensionistico" },
          net_average: { indicator: "reddito_pensionistico_netto_stimato_medio_mensile_classe", scale: 1, axis: "euro al mese", suffix: " euro al mese", label: "Simulazione del reddito netto sul valore medio della fascia", net: true, title: "Simulazione del reddito netto sul valore medio della fascia" },
          net_total: { indicator: "reddito_pensionistico_netto_stimato_totale", scale: 1000000000, axis: "miliardi di euro annui", suffix: " mld euro", label: "Totale netto simulato sul valore medio della fascia", amount: true, net: true, title: "Totale netto simulato sul valore medio della fascia" }
        },
        note: "Classifica le persone per reddito pensionistico mensile lordo complessivo. Qui tutte le pensioni percepite dalla stessa persona vengono sommate."
      }
    };
    var config = configs[isPensions ? "pensioni" : "pensionati"];
    config.measure = config.measures[state.distributionMetric] || config.measures.count;
    return config;
  }

  function distributionMetricOptions() {
    if (state.distributionScope === "pensionati") {
      return [
        { value: "count", label: "Numero di pensionati per fascia di reddito" },
        { value: "total", label: "Ammontare lordo complessivo per fascia" },
        { value: "average", label: "Equivalente mensile lordo del reddito annuo" },
        { value: "net_average", label: "Simulazione del reddito netto sul valore medio della fascia" },
        { value: "net_total", label: "Totale netto simulato sul valore medio della fascia" }
      ];
    }
    return [
      { value: "count", label: "Numero di pensioni" },
      { value: "total", label: "Spesa annua lorda per fascia" },
      { value: "average", label: "Equivalente mensile lordo della pensione" }
    ];
  }

  function renderDistributions() {
    var distribution = tableRows("pensioner_distribution");
    var config = distributionConfig();
    var rows = aggregateDistribution(distribution, config.population, config.measure.indicator, state.distributionYear, state.distributionSex);
    var title = byId("piDistributionTitle");
    var tag = byId("piDistributionTag");
    var note = byId("piDistributionNote");
    var credit = byId("piDistributionCredit");
    var sexFallback = state.distributionSex !== "Totale" && !hasDistributionSex(distribution, config.population, config.measure.indicator, state.distributionYear, state.distributionSex);
    if (title) title.textContent = config.measure.title || config.title;
    if (tag) tag.textContent = config.measure.label;
    if (note) {
      var methodNote = config.measure.net
        ? " La simulazione applica scaglioni IRPEF nazionali, detrazione per redditi da pensione e addizionali regionali/comunali medie stimate al reddito pensionistico lordo medio della fascia. Non utilizza microdati individuali, non sottrae contributi previdenziali e non considera altri redditi, deduzioni, detrazioni o carichi familiari. Il risultato non rappresenta il netto effettivamente ricevuto dai pensionati della fascia."
        : "";
      var amountNote = "";
      if (config.measure.amount && config.population === "pensionati_inps") {
        amountNote = " Questa vista somma il reddito pensionistico annuo dei pensionati nella fascia: non e' il numero di persone. Per contare persone scegli Numero di pensionati.";
      } else if (config.measure.amount) {
        amountNote = " Questa vista somma gli importi annui dei trattamenti nella fascia: non e' il numero di pensioni.";
      }
      var tailNote = rows.some(function (row) { return text(row.classe_importo).indexOf("5000") >= 0; })
        ? " La fonte consente di dettagliare la coda alta fino a 5000 euro e oltre."
        : " La fonte disponibile mantiene la coda superiore aggregata a 3000 euro e oltre: non viene divisa con ipotesi arbitrarie.";
      note.textContent = config.note + tailNote + amountNote + (config.measure.note ? " " + config.measure.note : "") + methodNote + (sexFallback ? " Per questa combinazione il dato per sesso non e' disponibile: viene mostrato il totale." : "");
    }
    if (credit) credit.textContent = config.source;
    plot("piDistributionChart", [{
      type: "bar",
      name: config.measure.label,
      x: rows.map(function (row) { return row.classe_importo; }),
      y: rows.map(function (row) { return toNumber(row.valore) / config.measure.scale; }),
      marker: { color: config.color },
      hovertemplate: "%{x}<br>%{y:,.2f}" + config.measure.suffix + "<extra></extra>"
    }], {
      yaxis: { title: config.measure.axis, rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      margin: { t: 18, r: 18, b: 86, l: 72 }
    });
  }

  function ageSortValue(label) {
    var value = text(label).toLowerCase();
    if (value.indexOf("fino") >= 0) return 0;
    if (value.indexOf("20") >= 0) return 1;
    if (value.indexOf("40") >= 0) return 2;
    if (value.indexOf("60 a 64") >= 0) return 3;
    if (value.indexOf("65 a 69") >= 0) return 4;
    if (value.indexOf("70") >= 0) return 5;
    if (value.indexOf("80") >= 0) return 6;
    return 99;
  }

  function rowsForAgeDistribution(indicator, year, sex) {
    var base = tableRows("pensioner_distribution").filter(function (row) {
      return row.popolazione === "pensionati_inps" && row.indicatore_id === indicator && toNumber(row.anno) === year;
    });
    var selected = base.filter(function (row) { return row.sesso === sex; });
    return (selected.length ? selected : base.filter(function (row) { return row.sesso === "Totale"; }))
      .sort(function (a, b) { return ageSortValue(a.classe_eta) - ageSortValue(b.classe_eta); });
  }

  function renderAgeDistributionChart() {
    var isAverage = state.ageDistributionMetric === "average";
    var rows = rowsForAgeDistribution(isAverage ? "reddito_pensionistico_medio_mensile_eta" : "pensionati_per_classe_eta", state.ageDistributionYear, state.ageDistributionSex);
    var averages = rowsForAgeDistribution("reddito_pensionistico_medio_mensile_eta", state.ageDistributionYear, state.ageDistributionSex);
    var avgByAge = {};
    averages.forEach(function (row) { avgByAge[row.classe_eta] = toNumber(row.valore); });
    var tag = byId("piAgeDistributionTag");
    var note = byId("piAgeDistributionNote");
    if (tag) tag.textContent = isAverage ? "importi lordi" : "pensionati INPS";
    if (note) note.textContent = isAverage ? "Equivalente mensile lordo del reddito annuo per classe di eta': la media divide il reddito annuo complessivo della classe per pensionati e per 12 mesi." : "Distribuzione dei pensionati INPS per classe di eta'. Nel passaggio del mouse appare anche l'equivalente mensile lordo del reddito annuo della stessa classe.";
    plot("piAgeDistributionChart", [{
      type: "bar",
      name: isAverage ? "Reddito medio" : "Pensionati",
      x: rows.map(function (row) { return row.classe_eta; }),
      y: rows.map(function (row) { return toNumber(row.valore) / (isAverage ? 1 : 1000000); }),
      customdata: rows.map(function (row) { return avgByAge[row.classe_eta]; }),
      marker: { color: COLORS[5] },
      hovertemplate: isAverage ? "%{x}<br>%{y:,.0f} euro al mese<extra>annuo / 12</extra>" : "%{x}<br>%{y:.2f} mln pensionati<br>equivalente mensile: %{customdata:,.0f} euro<extra></extra>"
    }], {
      yaxis: { title: isAverage ? "euro al mese" : "milioni di pensionati", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      margin: { t: 18, r: 18, b: 88, l: 72 }
    });
  }

  function retirementManagementLabel(value) {
    return {
      fondo_pensioni_lavoratori_dipendenti: "Fondo lavoratori dipendenti",
      gestioni_lavoratori_autonomi: "Gestioni lavoratori autonomi"
    }[value] || text(value).replace(/_/g, " ");
  }

  function retirementMetricConfig(metric) {
    return {
      eta_media_decorrenza_pensione: {
        title: "Eta' media alla decorrenza",
        tag: "anni",
        axis: "anni",
        suffix: " anni",
        scale: 1,
        color: COLORS[0],
        note: "Eta' media alla decorrenza delle pensioni di vecchiaia, anzianita/anticipate e prepensionamenti vigenti al 31.12.2025, classificate per anno di decorrenza. Non e' la media di tutti i pensionamenti liquidati nell'anno."
      },
      pensioni_decorrenza_vecchiaia_anticipate_vigenti: {
        title: "Pensioni vigenti per anno di decorrenza",
        tag: "trattamenti",
        axis: "migliaia di pensioni",
        suffix: " mila pensioni",
        scale: 1000,
        color: COLORS[2],
        note: "Numero di pensioni di vecchiaia, anzianita/anticipate e prepensionamenti ancora vigenti al 31.12.2025, per anno di decorrenza."
      },
      importo_medio_pensione_mensile_decorrenza: {
        title: "Importo lordo medio per anno di decorrenza",
        tag: "euro al mese",
        axis: "euro al mese",
        suffix: " euro al mese",
        scale: 1,
        color: COLORS[3],
        note: "Importo lordo medio mensile al 31.12.2025 delle pensioni vigenti, classificate per anno di decorrenza."
      }
    }[metric];
  }

  function renderRetirementAgeChart() {
    var config = retirementMetricConfig(state.retirementAgeMetric);
    var rows = tableRows("retirement_flows").filter(function (row) {
      return row.misura === "eta_decorrenza_pensioni_vigenti" &&
        row.indicatore_id === state.retirementAgeMetric &&
        row.gestione_id === state.retirementAgeManagement &&
        row.sesso === state.retirementAgeSex;
    }).sort(function (a, b) { return toNumber(a.anno) - toNumber(b.anno); });
    var title = byId("piRetirementAgeTitle");
    var tag = byId("piRetirementAgeTag");
    var note = byId("piRetirementAgeNote");
    if (title) title.textContent = config.title;
    if (tag) tag.textContent = retirementManagementLabel(state.retirementAgeManagement) + " - " + config.tag;
    if (note) note.textContent = config.note + " Fonte: Appendice statistica INPS, tavole 3.15a e 3.15b; natura del dato: osservato amministrativo, con perimetro dichiarato.";
    plot("piRetirementAgeChart", [{
      type: "scatter",
      mode: "lines+markers",
      name: retirementManagementLabel(state.retirementAgeManagement),
      x: rows.map(function (row) { return row.anno; }),
      y: rows.map(function (row) { return toNumber(row.valore) / config.scale; }),
      line: { color: config.color, width: 3 },
      marker: { size: 7 },
      hovertemplate: "%{x}<br>%{y:,.2f}" + config.suffix + "<extra>Dato osservato INPS</extra>"
    }], {
      showlegend: false,
      xaxis: { dtick: 1, fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      yaxis: { title: config.axis, rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") }
    });
  }

  function ageBandSort(label) {
    var n = text(label).match(/\d+/);
    if (!n) return 999;
    return Number(n[0]);
  }

  function renderRetirementAgeDistributionChart() {
    var base = tableRows("retirement_flows").filter(function (row) {
      return row.indicatore_id === "pensioni_liquidate_per_classe_eta" && toNumber(row.anno) === state.retirementDistributionYear;
    });
    var grouped = {};
    base.filter(function (row) {
      return state.retirementDistributionSex === "Totale" ? row.sesso !== "Totale" : row.sesso === state.retirementDistributionSex;
    }).forEach(function (row) {
      grouped[row.classe_eta] = (grouped[row.classe_eta] || 0) + (toNumber(row.valore) || 0);
    });
    var rows = Object.keys(grouped).map(function (age) { return { classe_eta: age, valore: grouped[age] }; })
      .sort(function (a, b) { return ageBandSort(a.classe_eta) - ageBandSort(b.classe_eta); });
    var note = byId("piRetirementDistributionNote");
    var tag = byId("piRetirementDistributionTag");
    if (tag) tag.textContent = "Gestione dipendenti pubblici - decorrenza " + state.retirementDistributionYear;
    if (note) note.textContent = "Distribuzione per classe di eta' delle pensioni liquidate della Gestione dipendenti pubblici. Il perimetro e' limitato agli Open Data INPS disponibili e non rappresenta il totale delle pensioni italiane liquidate.";
    plot("piRetirementDistributionChart", [{
      type: "bar",
      name: "Pensioni liquidate",
      x: rows.map(function (row) { return row.classe_eta; }),
      y: rows.map(function (row) { return row.valore; }),
      marker: { color: COLORS[5] },
      hovertemplate: "%{x}<br>%{y:,.0f} pensioni liquidate<extra>Dato osservato INPS</extra>"
    }], {
      showlegend: false,
      yaxis: { title: "pensioni liquidate", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      margin: { t: 18, r: 18, b: 88, l: 72 }
    });
  }

  function renderProfessionChart() {
    var rows = tableRows("managements");
    var note = byId("piProfessionNote");
    var tag = byId("piProfessionTag");
    if (state.professionMeasure === "importo_medio_pensione") {
      rows = rows.filter(function (row) { return text(row.fonte_id).indexOf("inps_appendice") === 0; });
      if (note) note.textContent = "Importo lordo medio mensile per prestazione. La vista usa solo le appendici statistiche 2022-2025: i dati Open Data 2010-2017 non vengono cuciti alla serie per evitare un salto di perimetro non omogeneo.";
      if (tag) tag.textContent = "appendici 2022-2025";
    } else {
      if (note) note.textContent = "Gli anni osservati hanno linea continua e marcatori pieni. Il tratto 2017-2022 e i marcatori vuoti 2018-2021 indicano stime interpolate linearmente solo per il numero di prestazioni; gli importi medi non sono interpolati.";
      if (tag) tag.textContent = "2010-2025";
    }
    var counts = {};
    rows.filter(function (row) { return row.indicatore_id === "pensioni_vigenti"; }).forEach(function (row) {
      counts[row.anno + "|" + row.gestione_id] = toNumber(row.valore) || 0;
    });
    var grouped = {};
    rows.filter(function (row) { return row.indicatore_id === state.professionMeasure; }).forEach(function (row) {
      var key = (row.gruppo_gestione || "altre_gestioni") + "|" + row.anno;
      var value = toNumber(row.valore) || 0;
      var weight = state.professionMeasure === "importo_medio_pensione" ? (counts[row.anno + "|" + row.gestione_id] || 0) : 1;
      grouped[key] = grouped[key] || { total: 0, weight: 0, interpolated: false };
      grouped[key].total += state.professionMeasure === "importo_medio_pensione" ? value * weight : value;
      grouped[key].weight += weight;
      grouped[key].interpolated = grouped[key].interpolated || text(row.fonte_id) === "elaborazione_repo" && text(row.note).toLowerCase().indexOf("interpolazione") >= 0;
    });
    var categories = Array.from(new Set(Object.keys(grouped).map(function (key) { return key.split("|")[0]; }))).sort();
    var observedYears = Array.from(new Set(Object.keys(grouped).map(function (key) { return Number(key.split("|")[1]); }))).sort();
    var years = [];
    if (observedYears.length) {
      for (var year = observedYears[0]; year <= observedYears[observedYears.length - 1]; year += 1) years.push(year);
    }
    function professionValue(cell) {
      if (!cell) return null;
      return state.professionMeasure === "importo_medio_pensione" ? cell.total / cell.weight : cell.total / 1000000;
    }
    var traces = [];
    categories.forEach(function (category, index) {
      var color = COLORS[index % COLORS.length];
      var values = years.map(function (year) {
        var cell = grouped[category + "|" + year];
        if (!cell || cell.interpolated) return null;
        return professionValue(cell);
      });
      traces.push({
        type: "scatter",
        mode: "lines+markers",
        name: labelGroup(category),
        x: years,
        y: values,
        line: { color: color, width: 2.5 },
        marker: { size: 7 },
        connectgaps: false,
        hovertemplate: labelGroup(category) + "<br>%{x}: %{y:,.2f}" + (state.professionMeasure === "importo_medio_pensione" ? " euro al mese" : " mln prestazioni") + "<extra>Dato osservato</extra>"
      });
      if (state.professionMeasure !== "importo_medio_pensione") {
        var bridgeYears = [2017, 2018, 2019, 2020, 2021, 2022].filter(function (year) { return grouped[category + "|" + year]; });
        if (bridgeYears.length > 1) {
          traces.push({
            type: "scatter",
            mode: "lines+markers",
            name: labelGroup(category) + " - interpolazione",
            x: bridgeYears,
            y: bridgeYears.map(function (year) { return professionValue(grouped[category + "|" + year]); }),
            customdata: bridgeYears.map(function (year) { return grouped[category + "|" + year].interpolated ? "Stima interpolata" : "Dato osservato"; }),
            line: { color: color, width: 2, dash: "dash" },
            marker: { size: 8, symbol: bridgeYears.map(function (year) { return grouped[category + "|" + year].interpolated ? "circle-open" : "circle"; }) },
            showlegend: false,
            hovertemplate: labelGroup(category) + "<br>%{x}: %{y:,.2f} mln prestazioni<extra>%{customdata}</extra>"
          });
        }
      }
    });
    plot("piProfessionChart", traces, {
      margin: { t: 18, r: 18, b: 70, l: 72 },
      legend: { orientation: "h", x: 0, y: -0.24, font: { color: cssVar("--muted", "#b9b2aa") } },
      xaxis: { dtick: 1, fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      yaxis: { title: state.professionMeasure === "importo_medio_pensione" ? "euro al mese" : "milioni di prestazioni", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") }
    });
  }

  function categoryLabel(category) {
    return MAP_CATEGORY_LABELS[category || "totale"] || text(category);
  }

  function rowCategory(row) {
    return text(row.categoria_pensione || "totale") || "totale";
  }

  function mapDataMetric(metric, category) {
    if ((category || "totale") !== "totale" && metric === "pensionati") return "pensioni_vigenti";
    return metric;
  }

  function metricLabel(metric, category) {
    var isCategory = (category || "totale") !== "totale";
    if (metric === "pensionati") return isCategory ? "Numero di pensioni" : "Numero di pensionati";
    if (metric === "pensionati_percentuale_popolazione") return isCategory ? "Pensioni ogni 100 residenti" : "Pensionati ogni 100 residenti";
    return {
      importo_medio_pensione_mensile_regionale: "Importo medio lordo della pensione",
      spesa_pensionistica_regionale: "Spesa pensionistica complessiva lorda",
      spesa_pensionistica_percentuale_pil: "Spesa pensionistica sul PIL regionale"
    }[metric] || metric;
  }

  function metricUnit(metric, category) {
    if (metric === "pensionati") return (category || "totale") === "totale" ? "pensionati" : "pensioni";
    if (metric === "spesa_pensionistica_regionale") return "miliardi di euro";
    if (metric === "importo_medio_pensione_mensile_regionale") return "euro al mese";
    if (metric === "pensionati_percentuale_popolazione") return (category || "totale") === "totale" ? "pensionati per 100 residenti" : "pensioni per 100 residenti";
    return "%";
  }

  function regionName(name) {
    var value = text(name);
    if (value.indexOf("Valle d'Aosta") === 0 || value.indexOf("Valle D'Aosta") === 0) return "Valle d'Aosta";
    if (value.indexOf("Trentino") === 0) return "Trentino-Alto Adige";
    if (value.indexOf("Friuli") === 0) return "Friuli Venezia Giulia";
    if (value.indexOf("Emilia") === 0) return "Emilia-Romagna";
    return value;
  }

  function regionSlug(name) {
    var value = regionName(name);
    if (value === "Valle d'Aosta") return "valle_d_aosta_vallee_d_aoste";
    if (value === "Trentino-Alto Adige") return "trentino_alto_adige_sudtirol";
    return value.toLowerCase().replace(/'/g, "").replace(/-/g, "_").replace(/\s+/g, "_");
  }

  function regionRowsAllYears(metric, category) {
    var dataMetric = mapDataMetric(metric, category);
    return tableRows("territorial").filter(function (row) {
      return row.livello_territoriale === "regione" && row.indicatore_id === dataMetric && rowCategory(row) === category;
    });
  }

  function regionRows(metric) {
    var category = state.mapCategory || "totale";
    var rows = regionRowsAllYears(metric, category);
    var year = state.mapYear || Math.max.apply(null, rows.map(function (row) { return toNumber(row.anno) || 0; }));
    var allowed = {};
    toArray(state.geojson && state.geojson.features).forEach(function (feature) { allowed[feature.properties.slug] = true; });
    return rows.filter(function (row) { return toNumber(row.anno) === year && allowed[regionSlug(row.nome_territorio)]; });
  }

  function regionMapValue(row, metric) {
    var value = toNumber(row.valore) || 0;
    return metric === "spesa_pensionistica_regionale" ? value / 1000000000 : value;
  }

  function renderRegionalMap() {
    var metric = state.mapMetric;
    var category = state.mapCategory || "totale";
    var rows = regionRows(metric);
    if (!rows.length) {
      showEmpty("piRegionalMap", "Dati regionali non disponibili");
      return;
    }
    var values = rows.map(function (row) { return regionMapValue(row, metric); });
    var allValues = regionRowsAllYears(metric, category).map(function (row) { return regionMapValue(row, metric); }).filter(function (value) { return Number.isFinite(value); });
    var minValue = Math.min.apply(null, allValues);
    var maxValue = Math.max.apply(null, allValues);
    var subtitle = byId("piMapSubtitle");
    var note = byId("piMapNote");
    if (subtitle) subtitle.textContent = metricLabel(metric, category) + " - " + categoryLabel(category) + " - " + rows[0].anno;
    if (note) note.textContent = "Scala cromatica fissa per indicatore e categoria su tutti gli anni disponibili. Con categoria Totale il primo indicatore conta persone pensionate; con le categorie pensionistiche conta prestazioni.";
    plot("piRegionalMap", [{
      type: "choropleth",
      geojson: state.geojson,
      featureidkey: "properties.slug",
      locations: rows.map(function (row) { return regionSlug(row.nome_territorio); }),
      z: values,
      text: rows.map(function (row) { return regionName(row.nome_territorio); }),
      customdata: rows.map(function (row) {
        if (metric === "spesa_pensionistica_regionale") return euroBn(row.valore) + " lordi";
        if (metric === "importo_medio_pensione_mensile_regionale") return euro(row.valore) + " lordi al mese";
        if (metric === "pensionati_percentuale_popolazione" && category !== "totale") return fmt(row.valore, 1) + " pensioni ogni 100 residenti";
        if (metric === "pensionati_percentuale_popolazione") return fmt(row.valore, 1) + "% della popolazione";
        if (metric === "spesa_pensionistica_percentuale_pil") return fmt(row.valore, 1) + "% del PIL regionale";
        return fmt(row.valore) + (category === "totale" ? " pensionati" : " pensioni");
      }),
      colorscale: [[0, "#fff2df"], [0.35, "#ffb15f"], [0.7, "#f26a21"], [1, "#7a1f0c"]],
      zmin: minValue,
      zmax: maxValue,
      marker: { line: { color: "rgba(255,255,255,.55)", width: 0.55 } },
      colorbar: { title: metricUnit(metric, category), tickfont: { color: cssVar("--muted", "#b9b2aa") } },
      hovertemplate: "<b>%{text}</b><br>%{customdata}<extra></extra>"
    }], {
      margin: { t: 8, r: 8, b: 8, l: 8 },
      showlegend: false,
      geo: {
        fitbounds: "locations",
        visible: false,
        showland: true,
        landcolor: "rgba(255,255,255,0.02)",
        bgcolor: "rgba(0,0,0,0)"
      }
    });
  }

  function updateReplacementControls() {
    var isRgs = state.replacementSeries === "rgs_profile";
    ["piReplacementWorker", "piReplacementCoverage", "piReplacementMeasure"].forEach(function (id) {
      var control = byId(id);
      if (control && control.parentNode) control.parentNode.style.display = isRgs ? "" : "none";
    });
    var sex = byId("piReplacementSex");
    if (sex && sex.parentNode) sex.parentNode.style.display = isRgs ? "none" : "";
  }

  function setupControls() {
    var metric = byId("piMapMetric");
    var mapYear = byId("piMapYear");
    var mapCategory = byId("piMapCategory");
    function updateMapMetricOptionLabels() {
      if (!metric) return;
      var category = state.mapCategory || "totale";
      var countOption = metric.querySelector('option[value="pensionati"]');
      var ratioOption = metric.querySelector('option[value="pensionati_percentuale_popolazione"]');
      if (countOption) countOption.textContent = metricLabel("pensionati", category);
      if (ratioOption) ratioOption.textContent = metricLabel("pensionati_percentuale_popolazione", category);
    }
    function mapCategoryAvailable(category) {
      var dataMetric = mapDataMetric(state.mapMetric, category);
      return tableRows("territorial").some(function (row) {
        return row.livello_territoriale === "regione" && row.indicatore_id === dataMetric && rowCategory(row) === category;
      });
    }
    function fillMapCategories() {
      if (!mapCategory) return;
      var present = {};
      tableRows("territorial").forEach(function (row) {
        if (row.livello_territoriale === "regione") present[rowCategory(row)] = true;
      });
      var categories = MAP_CATEGORY_ORDER.filter(function (category) {
        return present[category] && mapCategoryAvailable(category);
      });
      if (categories.indexOf("totale") < 0) categories.unshift("totale");
      clear(mapCategory);
      categories.forEach(function (category) {
        var option = document.createElement("option");
        option.value = category;
        option.textContent = categoryLabel(category);
        mapCategory.appendChild(option);
      });
      state.mapCategory = categories.indexOf(state.mapCategory) >= 0 ? state.mapCategory : "totale";
      mapCategory.value = state.mapCategory;
      updateMapMetricOptionLabels();
    }
    function fillMapYears() {
      var category = state.mapCategory || "totale";
      var dataMetric = mapDataMetric(state.mapMetric, category);
      var years = Array.from(new Set(tableRows("territorial").filter(function (row) {
        return row.livello_territoriale === "regione" && row.indicatore_id === dataMetric && rowCategory(row) === category;
      }).map(function (row) { return toNumber(row.anno); }))).filter(Boolean).sort();
      clear(mapYear);
      years.forEach(function (year) {
        var option = document.createElement("option"); option.value = year; option.textContent = year; mapYear.appendChild(option);
      });
      state.mapYear = years.indexOf(state.mapYear) >= 0 ? state.mapYear : years[years.length - 1];
      mapYear.value = state.mapYear;
    }
    if (metric) {
      metric.value = state.mapMetric;
      metric.addEventListener("change", function () {
        state.mapMetric = metric.value;
        updateMapMetricOptionLabels();
        fillMapCategories();
        fillMapYears();
        renderRegionalMap();
      });
    }
    if (mapCategory) {
      fillMapCategories();
      mapCategory.addEventListener("change", function () {
        state.mapCategory = mapCategory.value;
        updateMapMetricOptionLabels();
        fillMapYears();
        renderRegionalMap();
      });
    }
    if (mapYear) {
      fillMapYears();
      mapYear.addEventListener("change", function () { state.mapYear = toNumber(mapYear.value); renderRegionalMap(); });
    }

    var distributionYear = byId("piDistributionYear");
    var distributionSex = byId("piDistributionSex");
    var distributionScope = byId("piDistributionScope");
    var distributionMetric = byId("piDistributionMetric");
    function distributionYears(population, indicator) {
      return Array.from(new Set(tableRows("pensioner_distribution").filter(function (row) {
        return row.popolazione === population && row.indicatore_id === indicator;
      }).map(function (row) { return toNumber(row.anno); }))).filter(Boolean);
    }
    function fillDistributionYears() {
      if (!distributionYear) return;
      var config = distributionConfig();
      var years = distributionYears(config.population, config.measure.indicator).sort(function (a, b) { return a - b; });
      clear(distributionYear);
      years.forEach(function (year) {
        var option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        distributionYear.appendChild(option);
      });
      state.distributionYear = years.indexOf(state.distributionYear) >= 0 ? state.distributionYear : years[years.length - 1];
      distributionYear.value = state.distributionYear;
    }
    function fillDistributionMetrics() {
      if (!distributionMetric) return;
      var options = distributionMetricOptions();
      var selected = options.some(function (option) { return option.value === state.distributionMetric; }) ? state.distributionMetric : "count";
      clear(distributionMetric);
      options.forEach(function (item) {
        var option = document.createElement("option");
        option.value = item.value;
        option.textContent = item.label;
        distributionMetric.appendChild(option);
      });
      state.distributionMetric = selected;
      distributionMetric.value = selected;
    }
    if (distributionScope) {
      distributionScope.value = state.distributionScope;
      distributionScope.addEventListener("change", function () {
        state.distributionScope = distributionScope.value;
        fillDistributionMetrics();
        fillDistributionYears();
        renderDistributions();
      });
    }
    if (distributionMetric) {
      fillDistributionMetrics();
      distributionMetric.addEventListener("change", function () {
        state.distributionMetric = distributionMetric.value;
        fillDistributionYears();
        renderDistributions();
      });
    }
    if (distributionSex) {
      distributionSex.value = state.distributionSex;
      distributionSex.addEventListener("change", function () {
        state.distributionSex = distributionSex.value;
        renderDistributions();
      });
    }
    if (distributionYear) {
      fillDistributionYears();
      distributionYear.addEventListener("change", function () {
        state.distributionYear = toNumber(distributionYear.value);
        renderDistributions();
      });
    }

    var ageYear = byId("piAgeDistributionYear");
    var ageSex = byId("piAgeDistributionSex");
    var ageMetric = byId("piAgeDistributionMetric");
    function fillAgeYears() {
      if (!ageYear) return;
      var years = Array.from(new Set(tableRows("pensioner_distribution").filter(function (row) {
        return row.indicatore_id === "pensionati_per_classe_eta";
      }).map(function (row) { return toNumber(row.anno); }))).filter(Boolean).sort();
      clear(ageYear);
      years.forEach(function (year) {
        var option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        ageYear.appendChild(option);
      });
      state.ageDistributionYear = years.indexOf(state.ageDistributionYear) >= 0 ? state.ageDistributionYear : years[years.length - 1];
      ageYear.value = state.ageDistributionYear;
    }
    if (ageYear) {
      fillAgeYears();
      ageYear.addEventListener("change", function () {
        state.ageDistributionYear = toNumber(ageYear.value);
        renderAgeDistributionChart();
      });
    }
    if (ageMetric) {
      ageMetric.value = state.ageDistributionMetric;
      ageMetric.addEventListener("change", function () {
        state.ageDistributionMetric = ageMetric.value;
        renderAgeDistributionChart();
      });
    }
    if (ageSex) {
      ageSex.value = state.ageDistributionSex;
      ageSex.addEventListener("change", function () {
        state.ageDistributionSex = ageSex.value;
        renderAgeDistributionChart();
      });
    }

    var retirementManagement = byId("piRetirementAgeManagement");
    var retirementSex = byId("piRetirementAgeSex");
    var retirementMetric = byId("piRetirementAgeMetric");
    [
      [retirementManagement, "retirementAgeManagement", renderRetirementAgeChart],
      [retirementSex, "retirementAgeSex", renderRetirementAgeChart],
      [retirementMetric, "retirementAgeMetric", renderRetirementAgeChart]
    ].forEach(function (item) {
      var control = item[0];
      if (!control) return;
      control.value = state[item[1]];
      control.addEventListener("change", function () {
        state[item[1]] = control.value;
        item[2]();
      });
    });

    var retirementDistributionYear = byId("piRetirementDistributionYear");
    var retirementDistributionSex = byId("piRetirementDistributionSex");
    function fillRetirementDistributionYears() {
      if (!retirementDistributionYear) return;
      var years = Array.from(new Set(tableRows("retirement_flows").filter(function (row) {
        return row.indicatore_id === "pensioni_liquidate_per_classe_eta";
      }).map(function (row) { return toNumber(row.anno); }))).filter(Boolean).sort(function (a, b) { return a - b; });
      clear(retirementDistributionYear);
      years.forEach(function (year) {
        var option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        retirementDistributionYear.appendChild(option);
      });
      state.retirementDistributionYear = years.indexOf(state.retirementDistributionYear) >= 0 ? state.retirementDistributionYear : years[years.length - 1];
      retirementDistributionYear.value = state.retirementDistributionYear;
    }
    fillRetirementDistributionYears();
    if (retirementDistributionYear) {
      retirementDistributionYear.addEventListener("change", function () {
        state.retirementDistributionYear = toNumber(retirementDistributionYear.value);
        renderRetirementAgeDistributionChart();
      });
    }
    if (retirementDistributionSex) {
      retirementDistributionSex.value = state.retirementDistributionSex;
      retirementDistributionSex.addEventListener("change", function () {
        state.retirementDistributionSex = retirementDistributionSex.value;
        renderRetirementAgeDistributionChart();
      });
    }

    var systemSeries = byId("piSystemSeriesMetric");
    if (systemSeries) {
      systemSeries.value = state.systemSeriesMetric;
      systemSeries.addEventListener("change", function () {
        state.systemSeriesMetric = systemSeries.value;
        renderSystemSeriesChart();
      });
    }

    var profession = byId("piProfessionMeasure");
    profession.value = state.professionMeasure;
    profession.addEventListener("change", function () { state.professionMeasure = profession.value; renderProfessionChart(); });

    var transferComponents = byId("piTransferComponents");
    if (transferComponents) {
      var transferRows = rowsByIndicator(tableRows("state_transfers"), "trasferimenti_stato_inps_per_componente");
      var components = {};
      transferRows.forEach(function (row) { components[row.categoria_analitica] = row.voce_nome; });
      state.transferComponents = Object.keys(components);
      clear(transferComponents);
      state.transferComponents.forEach(function (component) {
        var option = document.createElement("option");
        option.value = component;
        option.textContent = components[component];
        option.selected = true;
        transferComponents.appendChild(option);
      });
      transferComponents.addEventListener("change", function () {
        state.transferComponents = Array.from(transferComponents.selectedOptions).map(function (option) { return option.value; });
        renderTransferComponentsChart();
      });
    }

    [
      ["piReplacementSeries", "replacementSeries"],
      ["piReplacementSex", "replacementSex"],
      ["piReplacementWorker", "replacementWorker"],
      ["piReplacementCoverage", "replacementCoverage"],
      ["piReplacementMeasure", "replacementMeasure"]
    ].forEach(function (item) {
      var control = byId(item[0]);
      if (!control) return;
      control.value = state[item[1]];
      control.addEventListener("change", function () {
        state[item[1]] = control.value;
        updateReplacementControls();
        renderReplacementRateChart();
      });
    });
    updateReplacementControls();

    var europe = byId("piEuropeCountries");
    var countries = Array.from(new Set(rowsByIndicator(tableRows("european_comparison"), "spesa_pensionistica_pil_esspros").map(function (row) { return row.paese; })))
      .filter(function (country) { return country !== "Italia" && country !== "Unione europea (27)"; }).sort();
    countries.forEach(function (country) {
      var label = document.createElement("label");
      var input = document.createElement("input");
      var textNode = document.createElement("span");
      input.type = "checkbox";
      input.value = country;
      input.checked = state.europeCountries.indexOf(country) >= 0;
      textNode.textContent = country;
      label.appendChild(input);
      label.appendChild(textNode);
      europe.appendChild(label);
      input.addEventListener("change", function () {
        state.europeCountries = Array.from(europe.querySelectorAll("input:checked")).map(function (node) { return node.value; });
        renderEuropeChart();
      });
    });
  }

  function renderAll() {
    renderKpis();
    renderSystemSeriesChart();
    renderTransferComponentsChart();
    renderRateChart();
    renderContributionCoverageChart();
    renderEuropeChart();
    renderOecdChart();
    renderReplacementRateChart();
    renderDistributions();
    renderAgeDistributionChart();
    renderRetirementAgeChart();
    renderRetirementAgeDistributionChart();
    renderProfessionChart();
    renderRegionalMap();
  }

  function load() {
    Promise.all([
      fetch(DATA_URL, { cache: "no-store" }),
      fetch(GEOJSON_URL, { cache: "force-cache" })
    ])
      .then(function (responses) {
        if (!responses[0].ok) throw new Error("Payload HTTP " + responses[0].status);
        if (!responses[1].ok) throw new Error("Mappa HTTP " + responses[1].status);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(function (results) {
        state.payload = results[0];
        state.geojson = results[1];
        setupControls();
        renderAll();
        setStatus("Dashboard generata il " + italianDate(state.payload.meta && (state.payload.meta.prepared_at || state.payload.meta.updated_at)));
      })
      ["catch"](function (error) {
        setStatus("Dati temporaneamente non disponibili: " + error.message, true);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
