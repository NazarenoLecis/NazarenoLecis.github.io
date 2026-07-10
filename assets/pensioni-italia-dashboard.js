(function () {
  "use strict";

  var DATA_URL = "https://data.nazarenolecis.com/pensioni-italia/dashboard.json?v=20260710-3";
  var GEOJSON_URL = "../../data/crisi-abitativa/italy-regions.geojson";
  var MISSING = "ND";
  var COLORS = ["#ff5a1f", "#4e79a7", "#76b7b2", "#f2a541", "#e15759", "#b07aa1", "#59a14f"];

  var state = {
    payload: null,
    geojson: null,
    mapMetric: "pensionati"
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

  function text(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback || MISSING;
    return String(value);
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
    window.Plotly.react(node, traces, baseLayout(layout), {
      responsive: true,
      displayModeBar: false,
      scrollZoom: false,
      doubleClick: false
    })["catch"](function () {
      showEmpty(id, "Errore nella costruzione del grafico");
    });
  }

  function tableRows(key) {
    return toArray(state.payload && state.payload.tables && state.payload.tables.final && state.payload.tables.final[key] && state.payload.tables.final[key].rows);
  }

  function catalogRows(key) {
    return toArray(state.payload && state.payload.catalog && state.payload.catalog[key]);
  }

  function latest(rows, predicate) {
    return toArray(rows)
      .filter(predicate || function () { return true; })
      .sort(function (a, b) { return (toNumber(b.anno) || 0) - (toNumber(a.anno) || 0); })[0] || null;
  }

  function rowsByIndicator(rows, indicator) {
    return toArray(rows).filter(function (row) { return row.indicatore_id === indicator; });
  }

  function makeKpi(label, value, note) {
    var item = document.createElement("div");
    item.className = "pi-kpi";
    var labelNode = document.createElement("span");
    var valueNode = document.createElement("strong");
    var noteNode = document.createElement("small");
    labelNode.textContent = label;
    valueNode.textContent = value;
    noteNode.textContent = note || "";
    item.appendChild(labelNode);
    item.appendChild(valueNode);
    item.appendChild(noteNode);
    return item;
  }

  function makeListItem(title, body) {
    var item = document.createElement("div");
    item.className = "pi-list-item";
    var strong = document.createElement("strong");
    var span = document.createElement("span");
    strong.textContent = title;
    span.textContent = body || "";
    item.appendChild(strong);
    item.appendChild(span);
    return item;
  }

  function labelGroup(value) {
    var labels = {
      ex_dipendenti_privati: "Ex dipendenti privati",
      ex_dipendenti_pubblici: "Ex dipendenti pubblici",
      ex_imprenditori_autonomi: "Artigiani e commercianti",
      ex_autonomi_agricoli: "Ex autonomi agricoli",
      ex_partite_iva_parasubordinati: "Gestione separata",
      altre_gestioni: "Altre gestioni",
      prestazioni_assistenziali: "Prestazioni assistenziali"
    };
    return labels[value] || text(value).replace(/_/g, " ");
  }

  function renderKpis() {
    var annual = tableRows("annual_pensions");
    var parameters = tableRows("system_parameters");
    var node = byId("piKpis");
    clear(node);

    var pensioni = latest(annual, function (row) { return row.indicatore_id === "pensioni_vigenti" && row.area === "Italia - INPS"; });
    var pensionati = latest(annual, function (row) { return row.indicatore_id === "pensionati" && row.area === "Italia - INPS"; });
    var reddito = latest(annual, function (row) { return row.indicatore_id === "reddito_pensionistico_totale" && row.area === "Italia - complessivi"; });
    var ratio = latest(annual, function (row) { return row.indicatore_id === "trattamenti_per_pensionato" && row.area === "Italia - INPS"; });
    var spesa = latest(annual, function (row) { return row.indicatore_id === "spesa_pensionistica_inps_stimata"; });
    var rate = latest(parameters, function (row) { return row.parametro_id === "aliquota_ivs_standard_ago_corrente"; });

    node.appendChild(makeKpi("Pensioni INPS", fmt(pensioni && pensioni.valore), "Prestazioni vigenti " + text(pensioni && pensioni.anno)));
    node.appendChild(makeKpi("Pensionati INPS", fmt(pensionati && pensionati.valore), "Persone beneficiarie " + text(pensionati && pensionati.anno)));
    node.appendChild(makeKpi("Pensioni per pensionato", fmt(ratio && ratio.valore, 2), "Rapporto nel perimetro INPS"));
    node.appendChild(makeKpi("Reddito pensionistico", euroBn(reddito && reddito.valore), "Sistema complessivo " + text(reddito && reddito.anno)));
    node.appendChild(makeKpi("Spesa INPS stimata", euroBn(spesa && spesa.valore), "Da prestazioni x importo medio"));
    node.appendChild(makeKpi("Aliquota IVS", fmt(rate && rate.valore, 1) + "%", "Riferimento corrente AGO/FPLD"));
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
    }], { showlegend: false, yaxis: { title: "miliardi di euro", fixedrange: true, gridcolor: cssVar("--line", "#303030") } });
  }

  function renderSpendingChart() {
    var rows = rowsByIndicator(tableRows("annual_pensions"), "spesa_pensionistica_casellario");
    var series = denseYears(rows);
    plot("piSpendingChart", [{
      type: "scatter",
      mode: "lines+markers",
      name: "Spesa pensionistica Casellario",
      x: series.years,
      y: series.values.map(function (value) { return value === null ? null : value / 1000000000; }),
      connectgaps: false,
      line: { color: COLORS[0], width: 3 },
      marker: { size: 7 },
      hovertemplate: "%{x}<br>%{y:.1f} miliardi di euro<extra></extra>"
    }], { showlegend: false, yaxis: { title: "miliardi di euro", fixedrange: true, gridcolor: cssVar("--line", "#303030") } });
  }

  function renderPensionIncomeChart() {
    var rows = rowsByIndicator(tableRows("annual_pensions"), "reddito_pensionistico_totale")
      .filter(function (row) { return row.area === "Italia - complessivi"; });
    var series = denseYears(rows);
    plot("piPensionIncomeChart", [{
      type: "scatter",
      mode: "lines+markers",
      name: "Reddito pensionistico complessivo",
      x: series.years,
      y: series.values.map(function (value) { return value === null ? null : value / 1000000000; }),
      connectgaps: false,
      line: { color: COLORS[3], width: 3 },
      marker: { size: 8 },
      hovertemplate: "%{x}<br>%{y:.1f} miliardi di euro<extra></extra>"
    }], { showlegend: false, yaxis: { title: "miliardi di euro", fixedrange: true, gridcolor: cssVar("--line", "#303030") } });
  }

  function renderCountChart(id, indicator, preferredArea, label, color) {
    var allRows = rowsByIndicator(tableRows("annual_pensions"), indicator);
    var rows = [];
    Array.from(new Set(allRows.map(function (row) { return row.anno; }))).sort().forEach(function (year) {
      var candidates = allRows.filter(function (row) { return row.anno === year; });
      var selected = candidates.filter(function (row) { return row.area === preferredArea; })[0] || candidates[0];
      if (selected) rows.push(selected);
    });
    var segments = [];
    rows.forEach(function (row) {
      var current = segments[segments.length - 1];
      if (!current || row.anno > current[current.length - 1].anno + 1) {
        current = [];
        segments.push(current);
      }
      current.push(row);
    });
    var traces = segments.map(function (segment, index) {
      var first = segment[0];
      var last = segment[segment.length - 1];
      return {
        type: "scatter",
        mode: "lines+markers",
        name: label + " " + first.anno + "-" + last.anno,
        x: segment.map(function (row) { return row.anno; }),
        y: segment.map(function (row) { return toNumber(row.valore) / 1000000; }),
        text: segment.map(function (row) { return row.area; }),
        line: { color: index === 0 ? color : COLORS[3], width: 3 },
        marker: { size: 7 },
        hovertemplate: "%{x}<br>%{y:.2f} milioni<br>%{text}<extra></extra>"
      };
    });
    plot(id, traces, {
      legend: { orientation: "h", x: 0, y: -0.22, font: { color: cssVar("--muted", "#b9b2aa") } },
      yaxis: { title: "milioni", fixedrange: true, gridcolor: cssVar("--line", "#303030") }
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
    plot("piRateChart", traces, { yaxis: { title: "%", fixedrange: true, gridcolor: cssVar("--line", "#303030") } });
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

  function renderDistributions() {
    var distribution = tableRows("pensioner_distribution");
    var pensions = orderedDistribution(distribution.filter(function (row) { return row.indicatore_id === "pensioni_per_classe_importo"; }));
    var pensioners = orderedDistribution(distribution.filter(function (row) { return row.indicatore_id === "pensionati_per_classe_reddito_pensionistico"; }));
    plot("piPensionDistributionChart", [{
      type: "bar",
      name: "Pensioni",
      x: pensions.map(function (row) { return row.classe_importo; }),
      y: pensions.map(function (row) { return toNumber(row.valore) / 1000000; }),
      marker: { color: COLORS[0] },
      hovertemplate: "%{x}<br>%{y:.2f} mln pensioni<extra></extra>"
    }], { yaxis: { title: "milioni di pensioni", fixedrange: true, gridcolor: cssVar("--line", "#303030") } });
    plot("piIncomeDistributionChart", [{
      type: "bar",
      name: "Pensionati",
      x: pensioners.map(function (row) { return row.classe_importo; }),
      y: pensioners.map(function (row) { return toNumber(row.valore) / 1000000; }),
      marker: { color: COLORS[2] },
      hovertemplate: "%{x}<br>%{y:.2f} mln pensionati<extra></extra>"
    }], { yaxis: { title: "milioni di pensionati", fixedrange: true, gridcolor: cssVar("--line", "#303030") } });
  }

  function renderProfessionChart() {
    var grouped = {};
    tableRows("pensioners_by_management_profession").forEach(function (row) {
      var key = (row.categoria_professionale || "altre_gestioni") + "|" + row.anno;
      grouped[key] = (grouped[key] || 0) + (toNumber(row.prestazioni) || 0);
    });
    var categories = Array.from(new Set(Object.keys(grouped).map(function (key) { return key.split("|")[0]; }))).sort();
    var years = Array.from(new Set(Object.keys(grouped).map(function (key) { return Number(key.split("|")[1]); }))).sort();
    var traces = years.map(function (year, index) {
      return {
        type: "bar",
        orientation: "h",
        name: String(year),
        x: categories.map(function (category) { return (grouped[category + "|" + year] || 0) / 1000000; }),
        y: categories.map(labelGroup),
        marker: { color: COLORS[index % COLORS.length] },
        hovertemplate: "%{y}<br>" + year + ": %{x:.2f} mln prestazioni<extra></extra>"
      };
    });
    plot("piProfessionChart", traces, {
      barmode: "group",
      margin: { t: 18, r: 18, b: 70, l: window.innerWidth < 640 ? 132 : 190 },
      legend: { orientation: "h", x: 0, y: -0.24, font: { color: cssVar("--muted", "#b9b2aa") } },
      xaxis: { title: "milioni di prestazioni", fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      yaxis: { fixedrange: true, gridcolor: "rgba(0,0,0,0)", automargin: true }
    });
  }

  function renderManagementList() {
    var node = byId("piManagementList");
    clear(node);
    var counts = tableRows("managements").filter(function (row) {
      return row.anno === 2025 && row.indicatore_id === "pensioni_vigenti";
    }).sort(function (a, b) { return (toNumber(b.valore) || 0) - (toNumber(a.valore) || 0); }).slice(0, 7);
    counts.forEach(function (row) {
      node.appendChild(makeListItem(row.gestione_nome, fmt(row.valore) + " prestazioni - " + labelGroup(row.gruppo_gestione)));
    });
  }

  function metricLabel(metric) {
    return {
      pensionati: "Pensionati regionali",
      reddito_pensionistico_medio_mensile: "Reddito pensionistico medio mensile",
      spesa_pensionistica_regionale: "Spesa pensionistica complessiva"
    }[metric] || metric;
  }

  function metricUnit(metric) {
    return metric === "pensionati" ? "pensionati" : metric === "spesa_pensionistica_regionale" ? "miliardi di euro" : "euro al mese";
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

  function regionRows(metric) {
    var rows = tableRows("territorial").filter(function (row) {
      return row.livello_territoriale === "regione" && row.indicatore_id === metric;
    });
    var latestYear = Math.max.apply(null, rows.map(function (row) { return toNumber(row.anno) || 0; }));
    var allowed = {};
    toArray(state.geojson && state.geojson.features).forEach(function (feature) { allowed[feature.properties.slug] = true; });
    return rows.filter(function (row) { return toNumber(row.anno) === latestYear && allowed[regionSlug(row.nome_territorio)]; });
  }

  function renderRegionalMap() {
    var metric = state.mapMetric;
    var rows = regionRows(metric);
    if (!rows.length) {
      showEmpty("piRegionalMap", "Dati regionali non disponibili");
      return;
    }
    var values = rows.map(function (row) {
      var value = toNumber(row.valore) || 0;
      return metric === "spesa_pensionistica_regionale" ? value / 1000000000 : value;
    });
    var minValue = Math.min.apply(null, values);
    var maxValue = Math.max.apply(null, values);
    var subtitle = byId("piMapSubtitle");
    if (subtitle) subtitle.textContent = metricLabel(metric) + " - " + rows[0].anno;
    plot("piRegionalMap", [{
      type: "choropleth",
      geojson: state.geojson,
      featureidkey: "properties.slug",
      locations: rows.map(function (row) { return regionSlug(row.nome_territorio); }),
      z: values,
      text: rows.map(function (row) { return regionName(row.nome_territorio); }),
      customdata: rows.map(function (row) {
        if (metric === "spesa_pensionistica_regionale") return euroBn(row.valore);
        if (metric === "reddito_pensionistico_medio_mensile") return euro(row.valore) + " al mese";
        return fmt(row.valore) + " pensionati";
      }),
      colorscale: [[0, "#fff2df"], [0.35, "#ffb15f"], [0.7, "#f26a21"], [1, "#7a1f0c"]],
      zmin: minValue,
      zmax: maxValue,
      marker: { line: { color: "rgba(255,255,255,.55)", width: 0.55 } },
      colorbar: { title: metricUnit(metric), tickfont: { color: cssVar("--muted", "#b9b2aa") } },
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

  function renderSources() {
    var node = byId("piSources");
    clear(node);
    var wanted = ["inps_appendice_xxv", "inps_appendice_xxiv", "inps_appendice_xxiii", "inps_rendiconti", "inps_casellario_2024", "inps_open_data", "inps_aliquote_storiche", "inps_aliquote_correnti"];
    catalogRows("sources").filter(function (row) {
      return wanted.indexOf(row.fonte_id) >= 0;
    }).forEach(function (row) {
      node.appendChild(makeListItem(row.nome_fonte || row.fonte_id, text(row.perimetro) + " - " + text(row.frequenza)));
    });

    var dataNode = byId("piDatasets");
    clear(dataNode);
    var inventory = catalogRows("dataset_inventory")
      .filter(function (row) { return row.priorita_dashboard === "alta"; })
      .slice(0, 8);
    inventory.forEach(function (row) {
      dataNode.appendChild(makeListItem(text(row.titolo || row.name, row.dataset_id), text(row.ambito_dashboard) + " - " + text(row.stato_uso)));
    });
  }

  function setupControls() {
    var metric = byId("piMapMetric");
    if (metric) {
      metric.value = state.mapMetric;
      metric.addEventListener("change", function () {
        state.mapMetric = metric.value;
        renderRegionalMap();
      });
    }
  }

  function renderAll() {
    renderKpis();
    renderContributionsChart();
    renderSpendingChart();
    renderPensionIncomeChart();
    renderPensionsChart();
    renderPensionersChart();
    renderRateChart();
    renderDistributions();
    renderProfessionChart();
    renderManagementList();
    renderRegionalMap();
    renderSources();
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
        setStatus("Dati caricati. Aggiornamento payload: " + text(state.payload.meta && state.payload.meta.updated_at));
      })
      ["catch"](function (error) {
        setStatus("Errore nel caricamento del payload: " + error.message, true);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
