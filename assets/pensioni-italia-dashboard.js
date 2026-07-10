(function () {
  "use strict";

  var DATA_URL = "https://data.nazarenolecis.com/pensioni-italia/dashboard.json?v=20260710-2";
  var MISSING = "ND";
  var COLORS = ["#ff5a1f", "#4e79a7", "#76b7b2", "#f2a541", "#e15759", "#b07aa1", "#59a14f"];

  var REGION_COORDS = {
    "Piemonte": [45.1, 7.7],
    "Valle d'Aosta": [45.7, 7.3],
    "Lombardia": [45.6, 9.7],
    "Trentino-Alto Adige": [46.5, 11.3],
    "Veneto": [45.7, 11.8],
    "Friuli Venezia Giulia": [46.1, 13.1],
    "Liguria": [44.4, 8.9],
    "Emilia-Romagna": [44.6, 11.2],
    "Toscana": [43.5, 11.2],
    "Umbria": [43.1, 12.4],
    "Marche": [43.4, 13.2],
    "Lazio": [41.9, 12.7],
    "Abruzzo": [42.2, 13.9],
    "Molise": [41.6, 14.6],
    "Campania": [40.9, 14.9],
    "Puglia": [41.1, 16.8],
    "Basilicata": [40.5, 16.1],
    "Calabria": [39.0, 16.5],
    "Sicilia": [37.6, 14.0],
    "Sardegna": [40.1, 9.0]
  };

  var state = {
    payload: null,
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
      ex_imprenditori_autonomi: "Ex artigiani/commercianti",
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

  function renderMoneyChart() {
    var annual = tableRows("annual_pensions");
    var series = [
      ["entrate_contributive_inps", "Contributi INPS", COLORS[1]],
      ["spesa_pensionistica_casellario", "Spesa Casellario", COLORS[0]],
      ["spesa_pensionistica_inps_stimata", "Spesa INPS stimata", COLORS[3]]
    ];
    var traces = series.map(function (item) {
      var rows = rowsByIndicator(annual, item[0]).sort(function (a, b) { return a.anno - b.anno; });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: item[1],
        x: rows.map(function (row) { return row.anno; }),
        y: rows.map(function (row) { return toNumber(row.valore) / 1000000000; }),
        line: { color: item[2], width: 3 },
        marker: { size: 7 }
      };
    }).filter(function (trace) { return trace.x.length; });
    plot("piMoneyChart", traces, { yaxis: { title: "miliardi di euro", fixedrange: true, gridcolor: cssVar("--line", "#303030") } });
  }

  function renderStockChart() {
    var annual = tableRows("annual_pensions");
    var traces = [
      ["pensioni_vigenti", "Pensioni", COLORS[0]],
      ["pensionati", "Pensionati", COLORS[2]]
    ].map(function (item) {
      var rows = rowsByIndicator(annual, item[0]).filter(function (row) {
        return row.area === "Italia" || row.area === "Italia - INPS" || row.area === "Italia - complessivi";
      }).sort(function (a, b) { return a.anno - b.anno; });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: item[1],
        x: rows.map(function (row) { return row.anno; }),
        y: rows.map(function (row) { return toNumber(row.valore) / 1000000; }),
        line: { color: item[2], width: 3 },
        marker: { size: 7 },
        text: rows.map(function (row) { return row.area; }),
        hovertemplate: "%{fullData.name}<br>%{x}<br>%{y:.1f} mln<br>%{text}<extra></extra>"
      };
    });
    plot("piStockChart", traces, { yaxis: { title: "milioni", fixedrange: true, gridcolor: cssVar("--line", "#303030") } });
  }

  function renderRatioChart() {
    var rows = rowsByIndicator(tableRows("annual_pensions"), "trattamenti_per_pensionato")
      .sort(function (a, b) { return a.anno - b.anno; });
    plot("piRatioChart", [{
      type: "bar",
      name: "Pensioni per pensionato",
      x: rows.map(function (row) { return row.anno; }),
      y: rows.map(function (row) { return row.valore; }),
      marker: { color: COLORS[4] },
      text: rows.map(function (row) { return fmt(row.valore, 2); }),
      textposition: "outside"
    }], { yaxis: { title: "rapporto", fixedrange: true, gridcolor: cssVar("--line", "#303030") } });
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
      var key = row.categoria_professionale || "altre_gestioni";
      grouped[key] = (grouped[key] || 0) + (toNumber(row.prestazioni) || 0);
    });
    var entries = Object.keys(grouped).map(function (key) { return [key, grouped[key]]; }).sort(function (a, b) { return b[1] - a[1]; });
    plot("piProfessionChart", [{
      type: "bar",
      orientation: "h",
      x: entries.map(function (entry) { return entry[1] / 1000000; }),
      y: entries.map(function (entry) { return labelGroup(entry[0]); }),
      marker: { color: COLORS[1] },
      hovertemplate: "%{y}<br>%{x:.2f} mln prestazioni<extra></extra>"
    }], { margin: { t: 18, r: 18, b: 46, l: 160 }, xaxis: { title: "milioni di prestazioni", fixedrange: true, gridcolor: cssVar("--line", "#303030") } });
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
      gini_reddito_pensionistico: "Gini reddito pensionistico",
      decile_D5_reddito_pensionistico: "Reddito pensionistico mediano"
    }[metric] || metric;
  }

  function metricUnit(metric) {
    return metric === "pensionati" ? "pensionati" : metric === "gini_reddito_pensionistico" ? "%" : "euro";
  }

  function regionName(name) {
    var value = text(name);
    if (value.indexOf("Valle d'Aosta") === 0 || value.indexOf("Valle D'Aosta") === 0) return "Valle d'Aosta";
    if (value.indexOf("Trentino") === 0) return "Trentino-Alto Adige";
    if (value.indexOf("Friuli") === 0) return "Friuli Venezia Giulia";
    if (value.indexOf("Emilia") === 0) return "Emilia-Romagna";
    return value;
  }

  function regionCoord(row) {
    return REGION_COORDS[regionName(row.nome_territorio)];
  }

  function regionRows(metric) {
    var rows = tableRows("territorial").filter(function (row) {
      return row.livello_territoriale === "regione" && row.indicatore_id === metric && regionCoord(row);
    });
    var latestYear = Math.max.apply(null, rows.map(function (row) { return toNumber(row.anno) || 0; }));
    return rows.filter(function (row) { return toNumber(row.anno) === latestYear; });
  }

  function renderRegionalMap() {
    var metric = state.mapMetric;
    var rows = regionRows(metric);
    if (!rows.length) {
      showEmpty("piRegionalMap", "Dati regionali non disponibili");
      return;
    }
    var values = rows.map(function (row) { return toNumber(row.valore) || 0; });
    var maxValue = Math.max.apply(null, values);
    var sizes = values.map(function (value) {
      if (metric === "pensionati") return 14 + 34 * Math.sqrt(value / maxValue);
      return 24;
    });
    var subtitle = byId("piMapSubtitle");
    if (subtitle) subtitle.textContent = metricLabel(metric) + " - " + rows[0].anno;
    plot("piRegionalMap", [{
      type: "scattergeo",
      mode: "markers+text",
      lat: rows.map(function (row) { return regionCoord(row)[0]; }),
      lon: rows.map(function (row) { return regionCoord(row)[1]; }),
      text: rows.map(function (row) { return regionName(row.nome_territorio); }),
      textposition: "top center",
      marker: {
        size: sizes,
        color: values,
        colorscale: [[0, "#76b7b2"], [0.5, "#f2a541"], [1, "#ff5a1f"]],
        line: { color: cssVar("--panel", "#090909"), width: 1 },
        colorbar: { title: metricUnit(metric), tickfont: { color: cssVar("--muted", "#b9b2aa") } }
      },
      customdata: values,
      hovertemplate: "%{text}<br>%{customdata:,.0f} " + metricUnit(metric) + "<extra></extra>"
    }], {
      margin: { t: 4, r: 4, b: 4, l: 4 },
      showlegend: false,
      geo: {
        scope: "europe",
        resolution: 50,
        lataxis: { range: [36, 47.5] },
        lonaxis: { range: [6, 19] },
        showland: true,
        landcolor: "rgba(255,255,255,0.04)",
        showcountries: false,
        showsubunits: false,
        showcoastlines: true,
        coastlinecolor: cssVar("--line", "#303030"),
        bgcolor: "rgba(0,0,0,0)"
      }
    });
    renderRegionalRanking(rows, metric);
  }

  function renderRegionalRanking(rows, metric) {
    var node = byId("piRegionalRanking");
    clear(node);
    var subtitle = byId("piRankingSubtitle");
    if (subtitle && rows[0]) subtitle.textContent = String(rows[0].anno);
    rows.slice().sort(function (a, b) { return (toNumber(b.valore) || 0) - (toNumber(a.valore) || 0); }).slice(0, 12).forEach(function (row) {
      var value = metric === "decile_D5_reddito_pensionistico" ? euro(row.valore) : metric === "gini_reddito_pensionistico" ? fmt(row.valore, 1) + "%" : fmt(row.valore);
      node.appendChild(makeListItem(row.nome_territorio, value + " - " + metricLabel(metric)));
    });
  }

  function renderSources() {
    var node = byId("piSources");
    clear(node);
    var wanted = ["inps_appendice_xxv", "inps_casellario_2024", "inps_open_data", "inps_aliquote_storiche", "inps_aliquote_correnti"];
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
    renderMoneyChart();
    renderStockChart();
    renderRatioChart();
    renderRateChart();
    renderDistributions();
    renderProfessionChart();
    renderManagementList();
    renderRegionalMap();
    renderSources();
  }

  function load() {
    fetch(DATA_URL, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (payload) {
        state.payload = payload;
        setupControls();
        renderAll();
        setStatus("Dati caricati. Aggiornamento payload: " + text(payload.meta && payload.meta.updated_at));
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
