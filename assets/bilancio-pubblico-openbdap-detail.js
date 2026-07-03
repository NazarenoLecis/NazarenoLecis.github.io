(function () {
  "use strict";

  if (window.__bpOpenbdapDetailLoaded) return;
  window.__bpOpenbdapDetailLoaded = true;

  var DATA_URL = "../../data/bilancio-pubblico/dashboard.json?v=20260703-cofog-detail";
  var state = { regions: [], metric: "mld", payloadPromise: null };

  var fallbackMetrics = [
    { id: "mld", label: "Miliardi correnti", field: "mld", unit: "mld" },
    { id: "euro_per_capita", label: "Euro pro capite", field: "euro_per_capita", unit: "euro" },
    { id: "euro_per_km2", label: "Euro per kmq", field: "euro_per_km2", unit: "euro_km2" }
  ];

  function byId(id) { return document.getElementById(id); }
  function arr(value) { return Array.isArray(value) ? value : []; }
  function num(value) { var parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
  function text(value, fallback) { return value === null || value === undefined || value === "" ? fallback || "-" : String(value); }
  function css(name, fallback) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; }
  function mobile() { return window.matchMedia && window.matchMedia("(max-width: 760px)").matches; }
  function compact(value, maxLength) {
    var s = text(value).replace(/\s+/g, " ").trim();
    maxLength = maxLength || 42;
    return s.length <= maxLength ? s : s.slice(0, Math.max(0, maxLength - 3)).trim() + "...";
  }

  function formatValue(value, metric) {
    var n = num(value);
    if (n === null) return "-";
    if (metric.unit === "euro" || metric.unit === "euro_km2") {
      return n.toLocaleString("it-IT", { maximumFractionDigits: 0 }) + " euro";
    }
    return n.toLocaleString("it-IT", { maximumFractionDigits: 2, minimumFractionDigits: 0 }) + " mld";
  }

  function metricAxis(metric) {
    if (metric.unit === "euro") return "Euro per abitante";
    if (metric.unit === "euro_km2") return "Euro per kmq";
    return "Miliardi di euro";
  }

  function ensureStyles() {
    if (byId("bpOpenbdapStyles")) return;
    var style = document.createElement("style");
    style.id = "bpOpenbdapStyles";
    style.textContent = [
      ".bp-openbdap-compare{margin-top:18px;padding-top:16px;border-top:1px solid var(--line)}",
      ".bp-openbdap-compare h3{margin:0 0 10px;color:var(--text);font-size:1.02rem;letter-spacing:0}",
      ".bp-openbdap-controls{display:grid;grid-template-columns:minmax(180px,240px) minmax(0,1fr);gap:14px;margin:12px 0 14px;align-items:start}",
      ".bp-openbdap-region-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}",
      ".bp-region-option{min-width:0;display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;color:var(--text);background:color-mix(in srgb,var(--card) 78%,transparent);font-size:.9rem;font-weight:700}",
      ".bp-region-option input{accent-color:var(--orange)}",
      ".bp-region-option span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      "@media (max-width:760px),(pointer:coarse){.bp-openbdap-controls{grid-template-columns:1fr}.bp-openbdap-region-grid{grid-template-columns:1fr 1fr}.bp-region-option{font-size:.84rem;padding:8px}}"
    ].join("");
    document.head.appendChild(style);
  }

  function ensurePanel() {
    var section = byId("bilanci-regionali");
    if (!section) return null;
    var existing = byId("bpOpenbdapCompare");
    if (existing) return existing;

    ensureStyles();
    var article = section.querySelector(".bp-card") || section;
    var panel = document.createElement("div");
    panel.id = "bpOpenbdapCompare";
    panel.className = "bp-openbdap-compare";
    panel.innerHTML = [
      '<h3>Confronto OpenBDAP 2024</h3>',
      '<div class="bp-openbdap-controls">',
      '<label for="bpOpenbdapMetric" class="bp-filter-label">Metrica<select id="bpOpenbdapMetric" class="bp-select"></select></label>',
      '<div><span class="bp-filter-label">Regioni</span><div id="bpOpenbdapRegions" class="bp-openbdap-region-grid"></div></div>',
      '</div>',
      '<div class="bp-chart-wrap"><div id="bpOpenbdapMissionChart" class="chart bp-chart" role="img" aria-label="Confronto OpenBDAP 2024 per missione"></div></div>',
      '<div class="bp-table-wrap"><table class="bp-table"><thead><tr><th>Regione</th><th>Missione</th><th>Valore</th></tr></thead><tbody id="bpOpenbdapMissionRows"></tbody></table></div>'
    ].join("");
    article.appendChild(panel);
    return panel;
  }

  function missionRows(payload) {
    var regional = payload.regional_budgets || {};
    var detail = regional.spending_2024_detail || {};
    var rows = arr(detail.by_mission);
    if (!rows.length) {
      rows = arr(regional.spending_by_mission).filter(function (row) {
        return num(row.anno) === 2024;
      });
    }
    return rows.filter(function (row) { return text(row.regione, "") && num(row.mld) !== null; });
  }

  function metrics(payload, rows) {
    var regional = payload.regional_budgets || {};
    var options = arr(regional.normalization_options).length ? arr(regional.normalization_options) : fallbackMetrics;
    return options.filter(function (metric) {
      return metric && metric.field && rows.some(function (row) { return num(row[metric.field]) !== null; });
    });
  }

  function allRegions(rows) {
    return Array.from(new Set(rows.map(function (row) { return text(row.regione); }))).sort(function (a, b) {
      return a.localeCompare(b, "it");
    });
  }

  function defaultRegions(rows) {
    var totals = {};
    rows.forEach(function (row) {
      var region = text(row.regione);
      totals[region] = (totals[region] || 0) + (num(row.mld) || 0);
    });
    return Object.keys(totals).sort(function (a, b) { return totals[b] - totals[a]; }).slice(0, 4);
  }

  function selectedRegions(rows) {
    var available = allRegions(rows);
    state.regions = state.regions.filter(function (region) { return available.indexOf(region) >= 0; });
    if (!state.regions.length) state.regions = defaultRegions(rows);
    return state.regions;
  }

  function setupControls(payload, rows, metricList) {
    var metricSelect = byId("bpOpenbdapMetric");
    if (metricSelect && !metricSelect.__bpBound) {
      metricSelect.__bpBound = true;
      metricSelect.addEventListener("change", function () {
        state.metric = metricSelect.value;
        render(payload);
      });
    }
    if (metricSelect) {
      metricSelect.innerHTML = "";
      metricList.forEach(function (metric) {
        var option = document.createElement("option");
        option.value = metric.id;
        option.textContent = metric.label;
        metricSelect.appendChild(option);
      });
      metricSelect.value = state.metric;
    }

    var regionGrid = byId("bpOpenbdapRegions");
    if (!regionGrid) return;
    var regions = selectedRegions(rows);
    regionGrid.innerHTML = "";
    allRegions(rows).forEach(function (region) {
      var label = document.createElement("label");
      label.className = "bp-region-option";
      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = region;
      checkbox.checked = regions.indexOf(region) >= 0;
      checkbox.addEventListener("change", function () {
        state.regions = Array.prototype.slice.call(regionGrid.querySelectorAll("input:checked")).map(function (input) {
          return input.value;
        });
        render(payload);
      });
      var span = document.createElement("span");
      span.textContent = region;
      label.appendChild(checkbox);
      label.appendChild(span);
      regionGrid.appendChild(label);
    });
  }

  function topMissions(rows, regions, metric) {
    var totals = {};
    rows.filter(function (row) { return regions.indexOf(text(row.regione)) >= 0; }).forEach(function (row) {
      var mission = text(row.missione || row.missione_code);
      var value = num(row[metric.field]);
      if (value !== null) totals[mission] = (totals[mission] || 0) + value;
    });
    return Object.keys(totals).sort(function (a, b) { return totals[b] - totals[a]; }).slice(0, mobile() ? 6 : 8);
  }

  function plotMissionChart(rows, metric) {
    var node = byId("bpOpenbdapMissionChart");
    if (!node || !window.Plotly) return;
    var regions = selectedRegions(rows);
    var missions = topMissions(rows, regions, metric);
    if (!regions.length || !missions.length) {
      node.textContent = "Nessun dato OpenBDAP disponibile";
      return;
    }

    var palette = [css("--orange", "#ff5a1f"), "#4e79a7", "#59a14f", "#f28e2b", "#76b7b2", "#e15759", "#edc948", "#b07aa1"];
    var traces = regions.map(function (region, index) {
      var values = missions.map(function (mission) {
        var matched = rows.find(function (row) {
          return text(row.regione) === region && text(row.missione || row.missione_code) === mission;
        });
        return matched ? num(matched[metric.field]) : null;
      });
      return {
        type: "bar",
        name: region,
        x: missions.map(function (mission) { return mobile() ? compact(mission, 18) : compact(mission, 30); }),
        y: values,
        customdata: values.map(function (value, valueIndex) { return [missions[valueIndex], formatValue(value, metric)]; }),
        marker: { color: palette[index % palette.length] },
        hovertemplate: "%{fullData.name}<br>%{customdata[0]}<br>%{customdata[1]}<extra></extra>"
      };
    });

    window.Plotly.react(node, traces, {
      barmode: "group",
      autosize: true,
      height: mobile() ? 460 : Math.min(760, Math.max(520, 360 + regions.length * 32)),
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      margin: { t: 20, r: 18, b: mobile() ? 122 : 96, l: mobile() ? 62 : 82 },
      legend: { orientation: "h", x: 0, xanchor: "left", y: -0.28, font: { color: css("--muted", "#b9b2aa") } },
      font: { color: css("--text", "#f5f2ed"), family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", size: 12 },
      xaxis: { title: "", fixedrange: true, tickangle: mobile() ? -35 : -20, tickfont: { color: css("--muted", "#b9b2aa") } },
      yaxis: { title: metricAxis(metric), fixedrange: true, gridcolor: css("--line", "#303030"), tickfont: { color: css("--muted", "#b9b2aa") } }
    }, { responsive: true, displayModeBar: false, scrollZoom: false, doubleClick: false, showTips: false }).catch(function () {});
  }

  function renderTable(rows, metric) {
    var tbody = byId("bpOpenbdapMissionRows");
    if (!tbody) return;
    tbody.innerHTML = "";
    var regions = selectedRegions(rows);
    rows.filter(function (row) {
      return regions.indexOf(text(row.regione)) >= 0 && num(row[metric.field]) !== null;
    }).sort(function (a, b) {
      return (num(b[metric.field]) || 0) - (num(a[metric.field]) || 0);
    }).slice(0, 24).forEach(function (row) {
      var tr = document.createElement("tr");
      [text(row.regione), text(row.missione || row.missione_code), formatValue(row[metric.field], metric)].forEach(function (value) {
        var td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    if (!tbody.children.length) {
      var empty = document.createElement("tr");
      var cell = document.createElement("td");
      cell.colSpan = 3;
      cell.textContent = "Nessun dato disponibile";
      empty.appendChild(cell);
      tbody.appendChild(empty);
    }
  }

  function addMethodNote() {
    var notes = byId("bpMethodNotes");
    if (!notes) return;
    var note = "OpenBDAP 2024 aggiunge un dettaglio dei rendiconti regionali per missione. Euro pro capite ed euro per kmq sono normalizzazioni derivate.";
    var exists = Array.prototype.some.call(notes.querySelectorAll("li"), function (item) {
      return item.textContent === note;
    });
    if (exists) return;
    var li = document.createElement("li");
    li.textContent = note;
    notes.appendChild(li);
  }

  function render(payload) {
    var rows = missionRows(payload || {});
    if (!rows.length || !ensurePanel()) return;
    var metricList = metrics(payload || {}, rows);
    var metric = metricList.find(function (item) { return item.id === state.metric; }) || metricList[0];
    if (!metric) return;
    state.metric = metric.id;
    setupControls(payload || {}, rows, metricList);
    plotMissionChart(rows, metric);
    renderTable(rows, metric);
    addMethodNote();
  }

  function load() {
    if (!window.fetch) return;
    if (!state.payloadPromise) {
      state.payloadPromise = window.fetch(DATA_URL, { cache: "no-store" }).then(function (response) {
        if (!response.ok) throw new Error("dashboard json");
        return response.json();
      });
    }
    state.payloadPromise.then(render).catch(function () {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
