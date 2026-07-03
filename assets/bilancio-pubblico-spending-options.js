(function () {
  "use strict";

  var DATA_URL = "../../data/bilancio-pubblico/dashboard.json?v=20260703-cofog-detail";
  var state = { metric: "mld", yearWindow: "all" };
  var fallbackOptions = [
    { id: "mld", label: "Miliardi correnti", field: "mld", unit: "mld", axis: "Miliardi di euro correnti", source: "Fonte: Eurostat gov_10a_exp, classificazione COFOG" },
    { id: "mld_2024", label: "Miliardi reali", field: "mld_2024", unit: "mld", axis: "Miliardi di euro a prezzi 2024", source: "Fonte: Eurostat gov_10a_exp e HICP all-items" },
    { id: "pil", label: "% PIL", field: "pil", unit: "%", axis: "% del PIL", source: "Fonte: Eurostat gov_10a_exp, classificazione COFOG" },
    { id: "euro_per_capita", label: "Euro pro capite", field: "euro_per_capita", unit: "euro", axis: "Euro correnti per abitante", source: "Fonte: Eurostat gov_10a_exp e demo_pjan" },
    { id: "euro_2024_per_capita", label: "Euro reali pro capite", field: "euro_2024_per_capita", unit: "euro", axis: "Euro 2024 per abitante", source: "Fonte: Eurostat gov_10a_exp, HICP all-items e demo_pjan" }
  ];

  var SERIES_WINDOW_OPTIONS = [
    { id: "all", label: "Tutti gli anni", years: null },
    { id: "20", label: "Ultimi 20 anni", years: 20 },
    { id: "10", label: "Ultimi 10 anni", years: 10 },
    { id: "5", label: "Ultimi 5 anni", years: 5 }
  ];

  function byId(id) { return document.getElementById(id); }
  function arr(value) { return Array.isArray(value) ? value : []; }
  function num(value) { var parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
  function text(value, fallback) { return value === null || value === undefined || value === "" ? fallback || "ND" : String(value); }
  function css(name, fallback) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; }
  function compact(value) { var s = text(value).replace(/\s+/g, " ").trim(); return s.length <= 30 ? s : s.slice(0, 27).trim() + "..."; }
  function mobile() { return window.matchMedia && window.matchMedia("(max-width: 760px)").matches; }

  function selectedYearWindow() {
    return state.yearWindow || "all";
  }

  function availableYears(points) {
    return arr(points).map(function (point) { return num(point.year); }).filter(function (year) {
      return year !== null;
    }).filter(function (value, index, values) {
      return values.indexOf(value) === index;
    }).sort(function (a, b) { return a - b; });
  }

  function yearWindowStart(years) {
    var selected = SERIES_WINDOW_OPTIONS.find(function (option) {
      return option.id === selectedYearWindow();
    });
    if (!selected || !selected.years || !years.length) return null;
    return Math.max.apply(null, years) - selected.years + 1;
  }

  function filterPointsByYearWindow(points) {
    var years = availableYears(points);
    var start = yearWindowStart(years);
    if (start === null) return points;
    return arr(points).filter(function (point) {
      var year = num(point.year);
      return year !== null && year >= start;
    });
  }

  function ensureYearWindowControl(chartId, years) {
    var chart = byId(chartId);
    if (!chart) return;
    var card = chart.closest ? chart.closest(".bp-card") : null;
    if (!card) return;
    var controlId = chartId + "YearWindow";
    var existing = byId(controlId);
    if (!existing) {
      var row = document.createElement("div");
      row.className = "bp-inline-controls bp-series-controls";

      var label = document.createElement("label");
      label.className = "bp-filter-label";
      label.setAttribute("for", controlId);
      label.textContent = "Periodo";

      var select = document.createElement("select");
      select.id = controlId;
      select.className = "bp-select bp-select-small";
      select.addEventListener("change", function () {
        state.yearWindow = select.value;
        load();
      });
      label.appendChild(select);
      row.appendChild(label);

      var wrap = chart.closest ? chart.closest(".bp-chart-wrap") : null;
      if (wrap && wrap.parentNode) {
        wrap.parentNode.insertBefore(row, wrap);
      } else {
        card.appendChild(row);
      }
      existing = select;
    }
    while (existing.firstChild) existing.removeChild(existing.firstChild);
    SERIES_WINDOW_OPTIONS.forEach(function (option) {
      var item = document.createElement("option");
      item.value = option.id;
      item.textContent = option.label;
      item.disabled = option.years !== null && years.length > 0 && years.length < option.years;
      existing.appendChild(item);
    });

    var current = selectedYearWindow();
    if (!Array.prototype.some.call(existing.options, function (option) {
      return option.value === current && !option.disabled;
    })) {
      current = "all";
      state.yearWindow = current;
    }
    existing.value = current;
  }

  function availableOptions(payload, rows) {
    var options = arr(payload.spending_metric_options).length ? arr(payload.spending_metric_options) : fallbackOptions;
    return options.map(function (option) {
      return {
        id: option.id,
        label: option.label,
        field: option.field,
        unit: option.unit || "mld",
        axis: option.axis_title || option.axis || option.label,
        source: option.source
      };
    }).filter(function (option) {
      return rows.some(function (row) { return num(row[option.field]) !== null; });
    });
  }

  function groupedRows(rows, option) {
    var groups = {};
    rows.forEach(function (row) {
      var year = num(row.anno || row.year);
      var value = num(row[option.field]);
      var code = text(row.codice || row.code, "ND");
      if (year === null || value === null) return;
      if (!groups[code]) groups[code] = { code: code, label: text(row.funzione || row.label || code), points: [] };
      groups[code].points.push({ year: year, value: value });
    });
    return Object.keys(groups).map(function (key) {
      var item = groups[key];
      item.points.sort(function (a, b) { return a.year - b.year; });
      item.latest = item.points.length ? item.points[item.points.length - 1].value : 0;
      return item;
    }).filter(function (item) { return item.points.length > 1; })
      .sort(function (a, b) { return b.latest - a.latest; })
      .slice(0, 6);
  }

  function formatValue(value, option) {
    var n = num(value);
    if (n === null) return "ND";
    if (option.unit === "%" || option.unit === "% PIL") return n.toLocaleString("it-IT", { maximumFractionDigits: 1 }) + "%";
    if (option.unit === "euro" || option.unit === "euro_2024") return n.toLocaleString("it-IT", { maximumFractionDigits: 0 }) + " euro";
    return n.toLocaleString("it-IT", { maximumFractionDigits: 1 }) + " miliardi di euro";
  }

  function layout(option) {
    return {
      autosize: true,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      margin: { t: 24, r: 22, b: 54, l: mobile() ? 58 : 74 },
      showlegend: true,
      legend: { orientation: "h", x: 0, xanchor: "left", y: -0.2, font: { color: css("--muted", "#b9b2aa") } },
      font: { color: css("--text", "#f5f2ed"), family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", size: 12 },
      xaxis: { title: "", fixedrange: true, gridcolor: css("--line", "#303030"), zerolinecolor: css("--line", "#303030"), tickfont: { color: css("--muted", "#b9b2aa") }, automargin: true },
      yaxis: { title: option.axis, fixedrange: true, gridcolor: css("--line", "#303030"), zerolinecolor: css("--line", "#303030"), ticksuffix: option.unit === "%" || option.unit === "% PIL" ? "%" : "", tickfont: { color: css("--muted", "#b9b2aa") }, titlefont: { color: css("--muted", "#b9b2aa") }, automargin: true }
    };
  }

  function ensureSelector(card, selected, options, payload) {
    var title = card.querySelector(".bp-card-title");
    if (!title) return;
    var select = byId("bpSpendingMetric");
    if (!select) {
      var label = document.createElement("label");
      label.className = "bp-select-label";
      label.setAttribute("for", "bpSpendingMetric");
      label.textContent = "Metrica";
      select = document.createElement("select");
      select.id = "bpSpendingMetric";
      select.className = "bp-select";
      options.forEach(function (option) {
        var item = document.createElement("option");
        item.value = option.id;
        item.textContent = option.label;
        select.appendChild(item);
      });
      select.addEventListener("change", function () { state.metric = select.value; render(payload); });
      title.appendChild(label);
      title.appendChild(select);
    }
    select.value = selected.id;
    var subtitle = title.querySelector("span");
    if (subtitle) subtitle.textContent = selected.axis;
    var credit = card.querySelector(".bp-chart-credit");
    if (credit && selected.source) credit.textContent = selected.source.replace(/\.$/, "") + ". Elaborazione di Nazareno Lecis.";
  }

  function render(payload) {
    var node = byId("bpSpendingTrend");
    if (!node || !window.Plotly) return;
    var rows = arr(payload.cofog_spending_trend);
    var options = availableOptions(payload, rows);
    if (!options.length) return;
    var option = options.find(function (item) { return item.id === state.metric; }) || options[0];
    state.metric = option.id;
    var groups = groupedRows(rows, option).map(function (group) {
      return Object.assign({}, group, { points: filterPointsByYearWindow(group.points) });
    }).filter(function (group) { return group.points.length > 1; });
    ensureYearWindowControl("bpSpendingTrend", availableYears(Array.prototype.concat.apply([], groups.map(function (group) {
      return group.points;
    }))));
    if (!groups.length) return;
    var traces = groups.map(function (group, index) {
      return {
        type: "scatter",
        mode: "lines+markers",
        name: mobile() ? compact(group.label) : group.label,
        x: group.points.map(function (point) { return point.year; }),
        y: group.points.map(function (point) { return point.value; }),
        customdata: group.points.map(function (point) { return formatValue(point.value, option); }),
        line: { color: index === 0 ? css("--orange", "#ff5a1f") : ["#4e79a7", "#59a14f", "#f28e2b", "#76b7b2", "#e15759"][index - 1] || "#bab0ac", width: index === 0 ? 3 : 2 },
        marker: { size: index === 0 ? 6 : 5 },
        hovertemplate: "%{x}<br>%{fullData.name}: %{customdata}<extra></extra>"
      };
    });
    window.Plotly.react(node, traces, layout(option), { responsive: true, displayModeBar: false, scrollZoom: false, doubleClick: false, showTips: false }).catch(function () {});
    var card = node.closest(".bp-card");
    if (card) ensureSelector(card, option, options, payload);
  }

  function addNote(textValue) {
    var notes = byId("bpMethodNotes");
    if (!notes) return;
    var exists = Array.prototype.some.call(notes.querySelectorAll("li"), function (item) { return item.textContent === textValue; });
    if (exists) return;
    var li = document.createElement("li");
    li.textContent = textValue;
    notes.appendChild(li);
  }

  function addNotes() {
    addNote("Le serie di spesa in miliardi sono valori nominali in euro correnti quando non Ã¨ selezionata una metrica reale o pro capite.");
    addNote("Le metriche reali usano HICP all-items Eurostat; le metriche pro capite usano la popolazione residente Eurostat al 1 gennaio.");
  }

  function load() {
    if (!window.fetch) return;
    window.fetch(DATA_URL).then(function (response) {
      if (!response.ok) throw new Error("dashboard json");
      return response.json();
    }).then(function (payload) {
      render(payload || {});
      addNotes();
    }).catch(addNotes);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { window.setTimeout(load, 900); window.setTimeout(load, 2200); });
  } else {
    window.setTimeout(load, 900);
    window.setTimeout(load, 2200);
  }
})();

