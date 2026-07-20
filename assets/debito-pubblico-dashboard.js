(function () {
  "use strict";

  var DATA_URL = "https://data.nazarenolecis.com/debito-pubblico/data.json?v=20260721-1";
  var STATE = { payload: null, composition: "debt_by_instrument", costMode: "nominal" };
  var COLORS = ["#ff5a1f", "#4e79a7", "#76b7b2", "#f2a541", "#e15759", "#b07aa1", "#59a14f", "#9c755f"];
  var PLOT_CONFIG = { responsive: true, displayModeBar: false, scrollZoom: false, doubleClick: false, showTips: false };
  var COMPOSITION_ORDER = ["debt_by_instrument", "debt_by_holder", "debt_by_subsector", "debt_by_residual_maturity"];

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

  function renderMainCharts(payload) {
    var total = payload.main_series && payload.main_series.total_debt;
    var debtGdp = payload.main_series && payload.main_series.debt_to_gdp;
    var debtPoints = seriesPoints(total, false);
    var gdpPoints = seriesPoints(debtGdp, true);
    plot("dpDebtChart", [{
      type: "scatter",
      mode: "lines",
      name: "Debito pubblico",
      x: debtPoints.map(function (point) { return point.date; }),
      y: debtPoints.map(function (point) { return point.value; }),
      line: { color: cssVar("--orange", COLORS[0]), width: 2.5 },
      hovertemplate: "%{x}<br>%{y:.1f} mld euro<extra></extra>"
    }], { yaxis: { title: "Miliardi di euro" }, xaxis: { title: "" } });
    plot("dpDebtGdpChart", [{
      type: "scatter",
      mode: "lines+markers",
      name: "Debito/PIL",
      x: gdpPoints.map(function (point) { return point.date; }),
      y: gdpPoints.map(function (point) { return point.value; }),
      line: { color: COLORS[1], width: 2.5 },
      marker: { size: 5 },
      hovertemplate: "%{x}<br>%{y:.1f}% PIL<extra></extra>"
    }], { yaxis: { title: "% PIL", ticksuffix: "%" }, xaxis: { title: "" } });
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
    var labels = rows.map(function (row) { return compactLabel(row.label, mobile ? 24 : 44); }).reverse();
    var values = rows.map(function (row) { return num(row[valueKey]); }).reverse();
    plot(id, [{
      type: "bar",
      orientation: "h",
      x: values,
      y: labels,
      marker: { color: rows.map(function (_, index) { return COLORS[index % COLORS.length]; }).reverse() },
      text: values.map(function (value) { return useShare ? pct(value) : mld(value); }),
      textposition: "auto",
      customdata: rows.map(function (row) { return [row.label, row.date, mld(row.value_bln_eur), pct(row.share_percent)]; }).reverse(),
      hovertemplate: "%{customdata[0]}<br>%{customdata[1]}<br>%{customdata[2]}<br>Quota: %{customdata[3]}<extra></extra>"
    }], {
      title: { text: title || "", font: { size: 13 } },
      margin: { t: title ? 34 : 20, r: 24, b: 48, l: mobile ? 126 : 210 },
      xaxis: { title: unit, ticksuffix: useShare ? "%" : "" },
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

  function renderHolders(payload) {
    renderHorizontalBar("dpHoldersChart", compositionRows(payload, "debt_by_holder"), "share_percent", "Quota sul debito", "", true);
  }

  function renderRates(payload) {
    var rows = toArray(payload.interest_rates);
    plot("dpRatesChart", [{
      type: "scatter",
      mode: "lines",
      name: "Rendimento lungo termine",
      x: rows.map(function (row) { return row.date; }),
      y: rows.map(function (row) { return num(row.value); }),
      line: { color: cssVar("--orange", COLORS[0]), width: 2.2 },
      hovertemplate: "%{x}<br>%{y:.2f}%<extra></extra>"
    }], { yaxis: { title: "%", ticksuffix: "%" }, xaxis: { title: "" } });
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
    if (status) status.textContent = "Dati aggiornati al " + text(payload.meta && payload.meta.latest_bankitalia_date) + ". Refresh automatico il primo giorno di ogni mese.";
    if (meta) meta.textContent = "Ultimo dato Banca d'Italia: " + text(payload.meta && payload.meta.latest_bankitalia_date) + ". Refresh automatico il primo giorno di ogni mese.";
  }

  function renderAll(payload) {
    renderMeta(payload);
    renderKpis(payload);
    renderMainCharts(payload);
    renderComposition(payload);
    renderMaturity(payload);
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
    document.querySelectorAll("[data-cost-mode]").forEach(function (button) {
      button.addEventListener("click", function () {
        STATE.costMode = button.getAttribute("data-cost-mode") || "nominal";
        if (STATE.payload) renderDebtCost(STATE.payload);
      });
    });
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
        ["dpDebtChart", "dpDebtGdpChart", "dpCompositionChart", "dpMaturityChart", "dpProfileChart", "dpHoldersChart", "dpDebtCostChart", "dpRatesChart"].forEach(function (id) {
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
