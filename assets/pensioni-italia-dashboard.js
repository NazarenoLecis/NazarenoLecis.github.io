(function () {
  "use strict";

  var DATA_URL = "https://data.nazarenolecis.com/pensioni-italia/dashboard.json?v=20260710-6";
  var GEOJSON_URL = "../../data/crisi-abitativa/italy-regions.geojson";
  var MISSING = "ND";
  var COLORS = ["#ff5a1f", "#4e79a7", "#76b7b2", "#f2a541", "#e15759", "#b07aa1", "#59a14f"];

  var state = {
    payload: null,
    geojson: null,
    mapMetric: "pensionati",
    mapYear: null,
    pensionDistributionYear: null,
    pensionDistributionMeasure: "pensioni_per_classe_importo",
    incomeDistributionYear: null,
    incomeDistributionMeasure: "pensionati_per_classe_reddito_pensionistico",
    professionMeasure: "pensioni_vigenti",
    europeCountries: ["Germania", "Francia", "Spagna"]
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
      ex_partite_iva_parasubordinati: "Autonomi e parasubordinati",
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
    node.appendChild(makeKpi("Reddito pensionistico lordo", euroBn(reddito && reddito.valore), "Sistema complessivo " + text(reddito && reddito.anno)));
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
    }], { showlegend: false, xaxis: { dtick: 1, fixedrange: true, gridcolor: cssVar("--line", "#303030") }, yaxis: { title: "miliardi di euro", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") } });
  }

  function renderSpendingChart() {
    var rows = rowsByIndicator(tableRows("annual_pensions"), "reddito_pensionistico_totale")
      .filter(function (row) { return row.area === "Italia - complessivi" && toNumber(row.anno) >= 2018; });
    var series = denseYears(rows);
    plot("piSpendingChart", [{
      type: "scatter",
      mode: "lines+markers",
      name: "Spesa pensionistica complessiva",
      x: series.years,
      y: series.values.map(function (value) { return value === null ? null : value / 1000000000; }),
      connectgaps: false,
      line: { color: COLORS[0], width: 3 },
      marker: { size: 7 },
      hovertemplate: "%{x}<br>%{y:.1f} miliardi di euro<extra></extra>"
    }], { showlegend: false, xaxis: { dtick: 1, fixedrange: true, gridcolor: cssVar("--line", "#303030") }, yaxis: { title: "miliardi di euro", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") } });
  }

  function renderFundingChart() {
    var annual = tableRows("annual_pensions");
    var transfers = rowsByIndicator(tableRows("state_transfers"), "trasferimenti_stato_inps");
    var contributions = rowsByIndicator(annual, "entrate_contributive_inps");
    var spending = rowsByIndicator(annual, "reddito_pensionistico_totale").filter(function (row) {
      return row.area === "Italia - complessivi";
    });
    var years = Array.from(new Set(transfers.map(function (row) { return toNumber(row.anno); })))
      .filter(function (year) { return year >= 2019; }).sort();

    function values(rows) {
      var byYear = {};
      rows.forEach(function (row) { byYear[toNumber(row.anno)] = toNumber(row.valore); });
      return years.map(function (year) { return byYear[year] === undefined ? null : byYear[year] / 1000000000; });
    }

    plot("piFundingChart", [
      { type: "scatter", mode: "lines+markers", name: "Contributi INPS", x: years, y: values(contributions), connectgaps: false, line: { color: COLORS[1], width: 3 }, marker: { size: 7 }, hovertemplate: "%{x}<br>%{y:.1f} miliardi di euro<extra></extra>" },
      { type: "scatter", mode: "lines+markers", name: "Spesa pensionistica lorda", x: years, y: values(spending), connectgaps: false, line: { color: COLORS[0], width: 3 }, marker: { size: 7 }, hovertemplate: "%{x}<br>%{y:.1f} miliardi di euro<extra></extra>" },
      { type: "scatter", mode: "lines+markers", name: "Trasferimenti dallo Stato", x: years, y: values(transfers), connectgaps: false, line: { color: COLORS[3], width: 3 }, marker: { size: 7 }, hovertemplate: "%{x}<br>%{y:.1f} miliardi di euro<extra></extra>" }
    ], {
      xaxis: { dtick: 1, fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      yaxis: { title: "miliardi di euro", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      legend: { orientation: "h", x: 0, y: -0.24, font: { color: cssVar("--muted", "#b9b2aa") } }
    });
  }

  function renderDemographyRatioChart(id, indicator, label, color) {
    var rows = rowsByIndicator(tableRows("demography_work"), indicator)
      .sort(function (a, b) { return toNumber(a.anno) - toNumber(b.anno); });
    plot(id, [{
      type: "scatter",
      mode: "lines+markers",
      name: label,
      x: rows.map(function (row) { return row.anno; }),
      y: rows.map(function (row) { return toNumber(row.valore); }),
      line: { color: color, width: 3 },
      marker: { size: 8 },
      hovertemplate: "%{x}<br>%{y:.2f} per pensionato<extra></extra>"
    }], {
      showlegend: false,
      xaxis: { dtick: 1, fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      yaxis: { title: "rapporto", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") }
    });
  }

  function renderWorkersRatioChart() {
    renderDemographyRatioChart("piWorkersRatioChart", "occupati_per_pensionato", "Occupati per pensionato", COLORS[2]);
  }

  function renderInsuredRatioChart() {
    renderDemographyRatioChart("piInsuredRatioChart", "assicurati_inps_per_pensionato", "Assicurati INPS per pensionato", COLORS[1]);
  }

  function renderContributionCoverageChart() {
    var rows = rowsByIndicator(tableRows("demography_work"), "copertura_spesa_contributi")
      .sort(function (a, b) { return toNumber(a.anno) - toNumber(b.anno); });
    plot("piContributionCoverageChart", [{
      type: "scatter",
      mode: "lines+markers",
      name: "Contributi / spesa lorda",
      x: rows.map(function (row) { return row.anno; }),
      y: rows.map(function (row) { return toNumber(row.valore); }),
      line: { color: COLORS[3], width: 3 },
      marker: { size: 8 },
      hovertemplate: "%{x}<br>%{y:.1f}% della spesa<extra></extra>"
    }], {
      showlegend: false,
      xaxis: { dtick: 1, fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      yaxis: { title: "% della spesa lorda", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") }
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
    var rows = rowsByIndicator(tableRows("european_comparison"), "spesa_pensionistica_pil_esspros");
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
    var pensions = orderedDistribution(distribution.filter(function (row) {
      return row.popolazione === "pensioni" && row.indicatore_id === state.pensionDistributionMeasure && toNumber(row.anno) === state.pensionDistributionYear;
    }));
    var pensioners = orderedDistribution(distribution.filter(function (row) {
      return row.popolazione === "pensionati_inps" && row.indicatore_id === state.incomeDistributionMeasure && toNumber(row.anno) === state.incomeDistributionYear;
    }));
    var pensionConfig = {
      pensioni_per_classe_importo: { scale: 1000000, title: "milioni di pensioni", suffix: " mln pensioni" },
      spesa_per_classe_importo: { scale: 1000000000, title: "miliardi di euro", suffix: " mld euro" },
      importo_medio_pensione_mensile_classe: { scale: 1, title: "euro al mese", suffix: " euro al mese" }
    }[state.pensionDistributionMeasure];
    var incomeConfig = {
      pensionati_per_classe_reddito_pensionistico: { scale: 1000000, title: "milioni di pensionati", suffix: " mln pensionati" },
      reddito_pensionistico_totale: { scale: 1000000000, title: "miliardi di euro annui", suffix: " mld euro" },
      reddito_pensionistico_medio_mensile_classe: { scale: 1, title: "euro al mese", suffix: " euro al mese" }
    }[state.incomeDistributionMeasure];
    plot("piPensionDistributionChart", [{
      type: "bar",
      name: "Pensioni",
      x: pensions.map(function (row) { return row.classe_importo; }),
      y: pensions.map(function (row) { return toNumber(row.valore) / pensionConfig.scale; }),
      marker: { color: COLORS[0] },
      hovertemplate: "%{x}<br>%{y:,.2f}" + pensionConfig.suffix + "<extra></extra>"
    }], { yaxis: { title: pensionConfig.title, rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") } });
    plot("piIncomeDistributionChart", [{
      type: "bar",
      name: "Pensionati",
      x: pensioners.map(function (row) { return row.classe_importo; }),
      y: pensioners.map(function (row) { return toNumber(row.valore) / incomeConfig.scale; }),
      marker: { color: COLORS[2] },
      hovertemplate: "%{x}<br>%{y:,.2f}" + incomeConfig.suffix + "<extra></extra>"
    }], { yaxis: { title: incomeConfig.title, rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") } });
  }

  function renderProfessionChart() {
    var rows = tableRows("managements");
    var counts = {};
    rows.filter(function (row) { return row.indicatore_id === "pensioni_vigenti"; }).forEach(function (row) {
      counts[row.anno + "|" + row.gestione_id] = toNumber(row.valore) || 0;
    });
    var grouped = {};
    rows.filter(function (row) { return row.indicatore_id === state.professionMeasure; }).forEach(function (row) {
      var key = (row.gruppo_gestione || "altre_gestioni") + "|" + row.anno;
      var value = toNumber(row.valore) || 0;
      var weight = state.professionMeasure === "importo_medio_pensione" ? (counts[row.anno + "|" + row.gestione_id] || 0) : 1;
      grouped[key] = grouped[key] || { total: 0, weight: 0 };
      grouped[key].total += state.professionMeasure === "importo_medio_pensione" ? value * weight : value;
      grouped[key].weight += weight;
    });
    var categories = Array.from(new Set(Object.keys(grouped).map(function (key) { return key.split("|")[0]; }))).sort();
    var years = Array.from(new Set(Object.keys(grouped).map(function (key) { return Number(key.split("|")[1]); }))).sort();
    var traces = categories.map(function (category, index) {
      var values = years.map(function (year) {
        var cell = grouped[category + "|" + year];
        if (!cell) return null;
        var value = state.professionMeasure === "importo_medio_pensione" ? cell.total / cell.weight : cell.total / 1000000;
        return value;
      });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: labelGroup(category),
        x: years,
        y: values,
        line: { color: COLORS[index % COLORS.length], width: 2.5 },
        marker: { size: 7 },
        hovertemplate: labelGroup(category) + "<br>%{x}: %{y:,.2f}" + (state.professionMeasure === "importo_medio_pensione" ? " euro al mese" : " mln prestazioni") + "<extra></extra>"
      };
    });
    plot("piProfessionChart", traces, {
      margin: { t: 18, r: 18, b: 70, l: 72 },
      legend: { orientation: "h", x: 0, y: -0.24, font: { color: cssVar("--muted", "#b9b2aa") } },
      xaxis: { dtick: 1, fixedrange: true, gridcolor: cssVar("--line", "#303030") },
      yaxis: { title: state.professionMeasure === "importo_medio_pensione" ? "euro al mese" : "milioni di prestazioni", rangemode: "tozero", fixedrange: true, gridcolor: cssVar("--line", "#303030") }
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
      importo_medio_pensione_mensile_regionale: "Importo medio lordo della pensione",
      spesa_pensionistica_regionale: "Spesa pensionistica complessiva lorda",
      pensionati_percentuale_popolazione: "Pensionati sulla popolazione residente",
      spesa_pensionistica_percentuale_pil: "Spesa pensionistica sul PIL regionale"
    }[metric] || metric;
  }

  function metricUnit(metric) {
    if (metric === "pensionati") return "pensionati";
    if (metric === "spesa_pensionistica_regionale") return "miliardi di euro";
    if (metric === "importo_medio_pensione_mensile_regionale") return "euro al mese";
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

  function regionRows(metric) {
    var rows = tableRows("territorial").filter(function (row) {
      return row.livello_territoriale === "regione" && row.indicatore_id === metric;
    });
    var year = state.mapYear || Math.max.apply(null, rows.map(function (row) { return toNumber(row.anno) || 0; }));
    var allowed = {};
    toArray(state.geojson && state.geojson.features).forEach(function (feature) { allowed[feature.properties.slug] = true; });
    return rows.filter(function (row) { return toNumber(row.anno) === year && allowed[regionSlug(row.nome_territorio)]; });
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
        if (metric === "spesa_pensionistica_regionale") return euroBn(row.valore) + " lordi";
        if (metric === "importo_medio_pensione_mensile_regionale") return euro(row.valore) + " lordi al mese";
        if (metric === "pensionati_percentuale_popolazione") return fmt(row.valore, 1) + "% della popolazione";
        if (metric === "spesa_pensionistica_percentuale_pil") return fmt(row.valore, 1) + "% del PIL regionale";
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
    var mapYear = byId("piMapYear");
    function fillMapYears() {
      var years = Array.from(new Set(tableRows("territorial").filter(function (row) {
        return row.livello_territoriale === "regione" && row.indicatore_id === state.mapMetric;
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
        fillMapYears();
        renderRegionalMap();
      });
    }
    if (mapYear) {
      fillMapYears();
      mapYear.addEventListener("change", function () { state.mapYear = toNumber(mapYear.value); renderRegionalMap(); });
    }

    function setupDistribution(yearId, measureId, population, stateYearKey, stateMeasureKey) {
      var yearNode = byId(yearId);
      var measureNode = byId(measureId);
      var years = Array.from(new Set(tableRows("pensioner_distribution").filter(function (row) { return row.popolazione === population; }).map(function (row) { return toNumber(row.anno); }))).filter(Boolean).sort();
      clear(yearNode);
      years.forEach(function (year) { var option = document.createElement("option"); option.value = year; option.textContent = year; yearNode.appendChild(option); });
      state[stateYearKey] = years[years.length - 1];
      yearNode.value = state[stateYearKey];
      measureNode.value = state[stateMeasureKey];
      yearNode.addEventListener("change", function () { state[stateYearKey] = toNumber(yearNode.value); renderDistributions(); });
      measureNode.addEventListener("change", function () { state[stateMeasureKey] = measureNode.value; renderDistributions(); });
    }
    setupDistribution("piPensionDistributionYear", "piPensionDistributionMeasure", "pensioni", "pensionDistributionYear", "pensionDistributionMeasure");
    setupDistribution("piIncomeDistributionYear", "piIncomeDistributionMeasure", "pensionati_inps", "incomeDistributionYear", "incomeDistributionMeasure");

    var profession = byId("piProfessionMeasure");
    profession.value = state.professionMeasure;
    profession.addEventListener("change", function () { state.professionMeasure = profession.value; renderProfessionChart(); });

    var europe = byId("piEuropeCountries");
    var countries = Array.from(new Set(rowsByIndicator(tableRows("european_comparison"), "spesa_pensionistica_pil_esspros").map(function (row) { return row.paese; })))
      .filter(function (country) { return country !== "Italia" && country !== "Unione europea (27)"; }).sort();
    countries.forEach(function (country) {
      var option = document.createElement("option"); option.value = country; option.textContent = country; option.selected = state.europeCountries.indexOf(country) >= 0; europe.appendChild(option);
    });
    europe.addEventListener("change", function () {
      state.europeCountries = Array.from(europe.selectedOptions).map(function (option) { return option.value; });
      renderEuropeChart();
    });
  }

  function renderAll() {
    renderKpis();
    renderContributionsChart();
    renderSpendingChart();
    renderFundingChart();
    renderPensionIncomeChart();
    renderPensionsChart();
    renderPensionersChart();
    renderRateChart();
    renderWorkersRatioChart();
    renderInsuredRatioChart();
    renderContributionCoverageChart();
    renderEuropeChart();
    renderDistributions();
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
