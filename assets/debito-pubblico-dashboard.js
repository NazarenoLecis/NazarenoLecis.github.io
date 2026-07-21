(function () {
  "use strict";

  var DATA_URL = "https://data.nazarenolecis.com/debito-pubblico/data.json?v=20260721-5";
  var STATE = { payload: null, composition: "debt_by_instrument", debtMode: "nominal", costMode: "nominal", rateSeries: "btp_10y", timeRanges: {} };
  var COLORS = ["#ff5a1f", "#4e79a7", "#76b7b2", "#f2a541", "#e15759", "#b07aa1", "#59a14f", "#9c755f"];
  var PLOT_CONFIG = { responsive: true, displayModeBar: false, scrollZoom: false, doubleClick: false, showTips: false };
  var COMPOSITION_ORDER = ["debt_by_instrument", "debt_by_holder", "debt_by_subsector", "debt_by_residual_maturity"];
  var SERIES_WINDOW_OPTIONS = [
    { id: "all", label: "Tutti gli anni", years: null },
    { id: "20", label: "Ultimi 20 anni", years: 20 },
    { id: "10", label: "Ultimi 10 anni", years: 10 },
    { id: "5", label: "Ultimi 5 anni", years: 5 }
  ];

  function byId(id) { return document.getElementById(id); }
  function toArray(value) { return Array.isArray(value) ? value : []; }
  function text(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback || "ND";
    return String(value);
  }
  function num(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  function clear(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }
  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }
  function compactLabel(value, maxLength) {
    var label = text(value);
    maxLength = maxLength || 42;
    return label.length > maxLength ? label.slice(0, maxLength - 3).trim() + "..." : label;
  }
  function fmt(value, digits) {
    var n = num(value);
    if (n === null) return "ND";
    return n.toLocaleString("it-IT", { maximumFractionDigits: digits || 0, minimumFractionDigits: digits || 0 });
  }
  function fmtLoose(value, digits) {
    var n = num(value);
    if (n === null) return "ND";
    return n.toLocaleString("it-IT", { maximumFractionDigits: digits || 1, minimumFractionDigits: 0 });
  }
  function pct(value) { return num(value) === null ? "ND" : fmtLoose(value, 1) + "%"; }
  function mld(value) { return num(value) === null ? "ND" : fmtLoose(value, 1) + " mld"; }
  function dateYear(date) { return text(date).slice(0, 4) || "ND"; }
  function isMobile() { return window.matchMedia && window.matchMedia("(max-width: 640px)").matches; }
  function yearFromDate(date) {
    var year = Number(text(date).slice(0, 4));
    return Number.isFinite(year) ? year : null;
  }
  function uniqueLabels(labels) {
    var counts = {};
    return labels.map(function (label) {
      counts[label] = (counts[label] || 0) + 1;
      return counts[label] === 1 ? label : label + " (" + counts[label] + ")";
    });
  }
  function availableYearsFromPoints(points) {
    var seen = {};
    return toArray(points).map(function (point) {
      return yearFromDate(point.date);
    }).filter(function (year) {
      if (year === null || seen[year]) return false;
      seen[year] = true;
      return true;
    }).sort(function (a, b) { return a - b; });
  }
  function selectedTimeRange(chartId) {
    return STATE.timeRanges[chartId] || "20";
  }
  function timeRangeStart(chartId, years) {
    var selected = SERIES_WINDOW_OPTIONS.find(function (item) {
      return item.id === selectedTimeRange(chartId);
    });
    if (!selected || !selected.years || !years.length) return null;
    return Math.max.apply(null, years) - selected.years + 1;
  }
  function ensureTimeRangeControl(chartId, years) {
    var chart = byId(chartId);
    if (!chart || !chart.closest) return;
    var card = chart.closest(".dp-card");
    if (!card) return;
    var controlId = chartId + "TimeRange";
    var select = byId(controlId);
    if (!select) {
      var row = document.createElement("div");
      row.className = "dp-inline-controls";

      var label = document.createElement("label");
      label.className = "dp-filter-label";
      label.setAttribute("for", controlId);
      label.textContent = "Periodo";

      select = document.createElement("select");
      select.id = controlId;
      select.className = "dp-select dp-select-small";
      select.addEventListener("change", function () {
        STATE.timeRanges[chartId] = select.value;
        if (STATE.payload) renderAll(STATE.payload);
      });

      label.appendChild(select);
      row.appendChild(label);
      card.insertBefore(row, chart);
    }

    var current = selectedTimeRange(chartId);
    clear(select);
    SERIES_WINDOW_OPTIONS.forEach(function (option) {
      var item = document.createElement("option");
      item.value = option.id;
      item.textContent = option.label;
      item.disabled = option.years !== null && years.length > 0 && years.length < option.years;
      select.appendChild(item);
    });
    if (!Array.prototype.some.call(select.options, function (option) {
      return option.value === current && !option.disabled;
    })) {
      current = "all";
      STATE.timeRanges[chartId] = current;
    }
    select.value = current;
  }
  function filterPointsByTimeRange(chartId, points) {
    var years = availableYearsFromPoints(points);
    var start = timeRangeStart(chartId, years);
    ensureTimeRangeControl(chartId, years);
    if (start === null) return points;
    return toArray(points).filter(function (point) {
      var year = yearFromDate(point.date);
      return year !== null && year >= start;
    });
  }

  function showEmpty(id, message) {
    var node = byId(id);
    if (!node) return;
    if (window.Plotly) {
      try { window.Plotly.purge(node); } catch (error) {}
    }
    node.innerHTML = "";
    var empty = document.createElement("div");
    empty.className = "dp-empty";
    empty.textContent = message || "Nessun dato disponibile";
    node.appendChild(empty);
  }

  function baseLayout(extra) {
    var textColor = cssVar("--text", "#f5f2ed");
    var muted = cssVar("--muted", "#b9b2aa");
    var line = cssVar("--line", "#303030");
    var panel = cssVar("--panel", "#090909");
    var layout = Object.assign({
      autosize: true,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: textColor, family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", size: 12 },
      margin: { t: 20, r: 22, b: 54, l: 62 },
      hoverlabel: { bgcolor: panel, bordercolor: line, font: { color: textColor } },
      legend: { orientation: "h", x: 0, y: -0.22, font: { color: muted } },
      dragmode: false,
      xaxis: { fixedrange: true, gridcolor: line, zerolinecolor: line, tickfont: { color: muted }, automargin: true },
      yaxis: { fixedrange: true, gridcolor: line, zerolinecolor: line, tickfont: { color: muted }, automargin: true }
    }, extra || {});
    if (extra && extra.xaxis) layout.xaxis = Object.assign({}, baseLayout().xaxis, extra.xaxis);
    if (extra && extra.yaxis) layout.yaxis = Object.assign({}, baseLayout().yaxis, extra.yaxis);
    return layout;
  }

  function plot(id, traces, layout) {
    var node = byId(id);
    if (!node) return;
    if (!window.Plotly) return showEmpty(id, "Plotly non caricato");
    if (!traces || !traces.length) return showEmpty(id, "Nessun dato disponibile");
    return window.Plotly.react(node, traces, baseLayout(layout), PLOT_CONFIG).catch(function () {
      showEmpty(id, "Errore nella costruzione del grafico");
    });
  }

  function seriesPoints(record, usePercent) {
    return toArray(record && record.points).map(function (point) {
      return { date: point[0], value: usePercent ? num(point[1]) : num(point[2]) };
    }).filter(function (point) {
      return point.date && point.value !== null;
    });
  }

  function makeKpi(item) {
    var node = document.createElement("div");
    node.className = "dp-kpi";
    var label = document.createElement("span");
    var value = document.createElement("strong");
    var date = document.createElement("em");
    label.textContent = item.label;
    value.textContent = item.unit === "% PIL" || item.unit === "%" ? fmtLoose(item.value, 1) + " " + item.unit : fmtLoose(item.value, 1) + " " + item.unit;
    date.textContent = item.date ? "Ultimo dato: " + item.date : "Ultimo dato ND";
    node.appendChild(label);
    node.appendChild(value);
    node.appendChild(date);
    return node;
  }

  function renderKpis(payload) {
    var node = byId("dpKpis");
    clear(node);
    toArray(payload.kpis).forEach(function (item) { node.appendChild(makeKpi(item)); });
  }

  function setDebtButtons() {
    document.querySelectorAll("[data-debt-mode]").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-debt-mode") === STATE.debtMode);
    });
  }

  function renderMainCharts(payload) {
    var total = payload.main_series && payload.main_series.total_debt;
    var debtGdp = payload.main_series && payload.main_series.debt_to_gdp;
    var isNominal = STATE.debtMode === "nominal";
    var selected = isNominal ? total : debtGdp;
    var points = filterPointsByTimeRange("dpDebtChart", seriesPoints(selected, !isNominal));
    var unitNode = byId("dpDebtUnit");
    if (unitNode) unitNode.textContent = isNominal ? "Miliardi di euro" : "Percentuale del PIL";
    setDebtButtons();
    plot("dpDebtChart", [{
      type: "scatter",
      mode: isNominal ? "lines" : "lines+markers",
      name: isNominal ? "Debito pubblico" : "Debito/PIL",
      x: points.map(function (point) { return point.date; }),
      y: points.map(function (point) { return point.value; }),
      line: { color: isNominal ? cssVar("--orange", COLORS[0]) : COLORS[1], width: 2.5 },
      marker: { size: 5, color: isNominal ? cssVar("--orange", COLORS[0]) : COLORS[1] },
      hovertemplate: isNominal ? "%{x}<br>%{y:.1f} mld euro<extra></extra>" : "%{x}<br>%{y:.1f}% PIL<extra></extra>"
    }], {
      yaxis: { title: isNominal ? "Miliardi di euro" : "% PIL", ticksuffix: isNominal ? "" : "%" },
      xaxis: { title: "" },
      showlegend: false
    });
  }

  function compositionRows(payload, key) {
    var section = payload.sections && payload.sections[key];
    return toArray(section && section.composition).slice().sort(function (a, b) {
      return (num(b.value_bln_eur) || 0) - (num(a.value_bln_eur) || 0);
    });
  }

  function latestRows(payload, key) {
    var section = payload.sections && payload.sections[key];
    return toArray(section && section.latest).slice().sort(function (a, b) {
      return (num(b.value_bln_eur) || 0) - (num(a.value_bln_eur) || 0);
    });
  }

  function tableRows(tbody, rows) {
    clear(tbody);
    if (!tbody) return;
    if (!rows.length) {
      var tr = document.createElement("tr");
      var td = document.createElement("td");
      td.colSpan = 4;
      td.textContent = "Nessun dato disponibile";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }
    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      [text(row.label), text(row.date), mld(row.value_bln_eur), row.share_percent === undefined ? "ND" : pct(row.share_percent)].forEach(function (value) {
        var td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  function renderHorizontalBar(id, rows, valueKey, unit, title, useShare) {
    if (!rows.length) return showEmpty(id, "Nessun dato disponibile");
    var mobile = isMobile();
    var labels = uniqueLabels(rows.map(function (row) { return compactLabel(row.label, mobile ? 24 : 38); })).reverse();
    var values = rows.map(function (row) { return num(row[valueKey]); }).reverse();
    var numericValues = values.filter(function (value) { return value !== null; });
    var maxValue = numericValues.length ? Math.max.apply(null, numericValues) : 1;
    plot(id, [{
      type: "bar",
      orientation: "h",
      x: values,
      y: labels,
      marker: { color: rows.map(function (_, index) { return COLORS[index % COLORS.length]; }).reverse() },
      text: values.map(function (value) { return useShare ? pct(value) : mld(value); }),
      textposition: "outside",
      cliponaxis: false,
      customdata: rows.map(function (row) { return [row.label, row.date, mld(row.value_bln_eur), pct(row.share_percent)]; }).reverse(),
      hovertemplate: "%{customdata[0]}<br>%{customdata[1]}<br>%{customdata[2]}<br>Quota: %{customdata[3]}<extra></extra>"
    }], {
      title: { text: title || "", font: { size: 13 } },
      margin: { t: title ? 34 : 20, r: 60, b: 48, l: mobile ? 118 : 230 },
      xaxis: { title: unit, ticksuffix: useShare ? "%" : "", range: [0, maxValue * 1.16] },
      yaxis: { title: "" },
      showlegend: false
    });
  }

  function populateCompositionSelect(payload) {
    var select = byId("dpCompositionSelect");
    clear(select);
    COMPOSITION_ORDER.forEach(function (key) {
      var section = payload.sections && payload.sections[key];
      if (!section) return;
      var option = document.createElement("option");
      option.value = key;
      option.textContent = section.label || key;
      select.appendChild(option);
    });
    if (!STATE.composition || !payload.sections[STATE.composition]) STATE.composition = COMPOSITION_ORDER[0];
    select.value = STATE.composition;
  }

  function renderComposition(payload) {
    populateCompositionSelect(payload);
    var rows = compositionRows(payload, STATE.composition);
    var section = payload.sections && payload.sections[STATE.composition];
    var title = byId("dpCompositionTitle");
    if (title) title.textContent = section && section.label ? section.label : "Composizione";
    renderHorizontalBar("dpCompositionChart", rows, "share_percent", "Quota sul debito", "Ultima osservazione", true);
    tableRows(byId("dpCompositionRows"), rows);
  }

  function renderMaturity(payload) {
    renderHorizontalBar("dpMaturityChart", compositionRows(payload, "debt_by_residual_maturity"), "share_percent", "Quota sul debito", "", true);
    renderHorizontalBar("dpProfileChart", latestRows(payload, "debt_by_original_maturity_currency_residency"), "value_bln_eur", "Miliardi di euro", "", false);
  }

  function renderProfileTable(rows) {
    var tbody = byId("dpRedemptionProfileRows");
    clear(tbody);
    if (!tbody) return;
    if (!rows.length) {
      var tr = document.createElement("tr");
      var td = document.createElement("td");
      td.colSpan = 4;
      td.textContent = "Nessun dato disponibile";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }
    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      [text(row.year), text(row.quarter), mld(row.amount_bln_eur_revalued), fmt(row.securities, 0)].forEach(function (value) {
        var td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  function renderRedemptionProfile(payload) {
    var profile = payload.maturity_profile || {};
    var yearly = toArray(profile.yearly);
    var quarterly = toArray(profile.quarterly);
    var meta = byId("dpMaturityProfileMeta");
    if (meta) meta.textContent = profile.snapshot_date ? "Aggiornato al " + profile.snapshot_date : "MEF";
    renderProfileTable(quarterly);
    if (!yearly.length) return showEmpty("dpRedemptionProfileChart", "Nessun dato disponibile");

    var years = yearly.map(function (row) { return row.year; });
    var values = yearly.map(function (row) { return num(row.amount_bln_eur_revalued); });
    var securities = yearly.map(function (row) { return num(row.securities); });
    plot("dpRedemptionProfileChart", [{
      type: "bar",
      name: "Ammontare in scadenza",
      x: years,
      y: values,
      marker: {
        color: values,
        colorscale: [[0, "#ffd1c3"], [0.45, "#ff5a1f"], [1, "#b9123b"]],
        line: { color: "rgba(255,255,255,.08)", width: 1 }
      },
      customdata: yearly.map(function (row) { return [mld(row.amount_bln_eur_revalued), fmt(row.securities, 0)]; }),
      hovertemplate: "Anno %{x}<br>%{customdata[0]}<br>Titoli: %{customdata[1]}<extra></extra>"
    }], {
      margin: { t: 22, r: 24, b: 86, l: 72 },
      xaxis: { title: "Anno di scadenza", tickangle: -90 },
      yaxis: { title: "Miliardi di euro" },
      showlegend: false
    });
  }

  function renderHolders(payload) {
    renderHorizontalBar("dpHoldersChart", compositionRows(payload, "debt_by_holder"), "share_percent", "Quota sul debito", "", true);
  }

  function securityYieldSeries(payload) {
    return toArray(payload.security_yields && payload.security_yields.series);
  }

  function populateRateSelect(payload) {
    var select = byId("dpRateSeriesSelect");
    if (!select) return;
    clear(select);
    var series = securityYieldSeries(payload);
    series.forEach(function (item) {
      var option = document.createElement("option");
      option.value = item.id || item.series_key;
      option.textContent = item.label || item.id || item.series_key;
      select.appendChild(option);
    });
    var hasSelected = series.some(function (item) { return (item.id || item.series_key) === STATE.rateSeries; });
    if (!hasSelected && series.length) STATE.rateSeries = series[0].id || series[0].series_key;
    select.value = STATE.rateSeries;
  }

  function selectedRateSeries(payload) {
    return securityYieldSeries(payload).find(function (item) {
      return (item.id || item.series_key) === STATE.rateSeries;
    });
  }

  function renderRates(payload) {
    populateRateSelect(payload);
    var series = selectedRateSeries(payload);
    if (!series) return showEmpty("dpRatesChart", "Nessun dato disponibile");
    var rows = filterPointsByTimeRange("dpRatesChart", toArray(series.points).map(function (point) {
      return { date: point[0], value: num(point[1]) };
    }).filter(function (point) {
      return point.date && point.value !== null;
    }));
    var meta = byId("dpRatesMeta");
    if (meta) meta.textContent = series.rate_kind || "Rendimento lordo all'emissione";
    plot("dpRatesChart", [{
      type: "scatter",
      mode: "lines+markers",
      name: series.label || "Rendimento",
      x: rows.map(function (row) { return row.date; }),
      y: rows.map(function (row) { return row.value; }),
      line: { color: cssVar("--orange", COLORS[0]), width: 2.2 },
      marker: { size: 4, color: cssVar("--orange", COLORS[0]) },
      hovertemplate: "%{x}<br>%{y:.2f}%<extra></extra>"
    }], { yaxis: { title: "%", ticksuffix: "%" }, xaxis: { title: "" }, showlegend: false });
  }

  function setCostButtons() {
    document.querySelectorAll("[data-cost-mode]").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-cost-mode") === STATE.costMode);
    });
  }

  function renderDebtCost(payload) {
    var cost = payload.debt_cost || {};
    var measures = cost.measures || {};
    var measure = measures[STATE.costMode] || measures.nominal;
    if (!measure) return showEmpty("dpDebtCostChart", "Nessun dato disponibile");

    var isNominal = STATE.costMode === "nominal";
    var points = toArray(measure.points).map(function (point) {
      return { date: point[0], value: isNominal ? num(point[2]) : num(point[1]) };
    }).filter(function (point) {
      return point.date && point.value !== null;
    });
    points = filterPointsByTimeRange("dpDebtCostChart", points);
    var unitNode = byId("dpDebtCostUnit");
    if (unitNode) unitNode.textContent = isNominal ? "Miliardi di euro" : "Percentuale del PIL";
    setCostButtons();
    plot("dpDebtCostChart", [{
      type: "scatter",
      mode: "lines+markers",
      name: isNominal ? "Interessi passivi" : "Interessi passivi/PIL",
      x: points.map(function (point) { return point.date; }),
      y: points.map(function (point) { return point.value; }),
      fill: "tozeroy",
      line: { color: cssVar("--orange", COLORS[0]), width: 2.6 },
      marker: { size: 5, color: cssVar("--orange", COLORS[0]) },
      hovertemplate: isNominal ? "%{x}<br>%{y:.1f} mld euro<extra></extra>" : "%{x}<br>%{y:.1f}% PIL<extra></extra>"
    }], {
      yaxis: { title: isNominal ? "Miliardi di euro" : "% PIL", ticksuffix: isNominal ? "" : "%" },
      xaxis: { title: "" },
      showlegend: false
    });
  }

  function renderNotes(payload) {
    var notes = byId("dpNotes");
    var sources = byId("dpSources");
    clear(notes);
    clear(sources);
    toArray(payload.notes).forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = item;
      notes.appendChild(li);
    });
    toArray(payload.sources).forEach(function (source) {
      var li = document.createElement("li");
      var link = document.createElement("a");
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = source.name + " - " + source.dataset;
      li.appendChild(link);
      sources.appendChild(li);
    });
  }

  function renderMeta(payload) {
    var status = byId("dpStatus");
    var meta = byId("dpSourceMeta");
    if (status) status.textContent = "Dati aggiornati al " + text(payload.meta && payload.meta.latest_bankitalia_date) + ". Refresh automatico il 16 di ogni mese.";
    if (meta) meta.textContent = "Ultimo dato Banca d'Italia: " + text(payload.meta && payload.meta.latest_bankitalia_date) + ". Refresh automatico il 16 di ogni mese.";
  }

  function renderAll(payload) {
    renderMeta(payload);
    renderKpis(payload);
    renderMainCharts(payload);
    renderComposition(payload);
    renderMaturity(payload);
    renderRedemptionProfile(payload);
    renderHolders(payload);
    renderDebtCost(payload);
    renderRates(payload);
    renderNotes(payload);
  }

  function initControls() {
    var select = byId("dpCompositionSelect");
    if (select) {
      select.addEventListener("change", function () {
        STATE.composition = select.value;
        if (STATE.payload) renderComposition(STATE.payload);
      });
    }
    document.querySelectorAll("[data-debt-mode]").forEach(function (button) {
      button.addEventListener("click", function () {
        STATE.debtMode = button.getAttribute("data-debt-mode") || "nominal";
        if (STATE.payload) renderMainCharts(STATE.payload);
      });
    });
    document.querySelectorAll("[data-cost-mode]").forEach(function (button) {
      button.addEventListener("click", function () {
        STATE.costMode = button.getAttribute("data-cost-mode") || "nominal";
        if (STATE.payload) renderDebtCost(STATE.payload);
      });
    });
    var rateSelect = byId("dpRateSeriesSelect");
    if (rateSelect) {
      rateSelect.addEventListener("change", function () {
        STATE.rateSeries = rateSelect.value;
        if (STATE.payload) renderRates(STATE.payload);
      });
    }
  }

  function initThemeObserver() {
    if (!window.MutationObserver) return;
    var observer = new MutationObserver(function () {
      if (!STATE.payload) return;
      window.clearTimeout(window.__dpThemeTimer);
      window.__dpThemeTimer = window.setTimeout(function () { renderAll(STATE.payload); }, 120);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  function load() {
    initControls();
    initThemeObserver();
    fetch(DATA_URL, { cache: "no-store", mode: "cors" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (payload) {
        STATE.payload = payload;
        renderAll(payload);
      })
      .catch(function (error) {
        var status = byId("dpStatus");
        if (status) status.textContent = "Errore nel caricamento dei dati: " + error.message;
        ["dpDebtChart", "dpCompositionChart", "dpMaturityChart", "dpRedemptionProfileChart", "dpProfileChart", "dpHoldersChart", "dpDebtCostChart", "dpRatesChart"].forEach(function (id) {
          showEmpty(id, "Dati non caricati");
        });
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
