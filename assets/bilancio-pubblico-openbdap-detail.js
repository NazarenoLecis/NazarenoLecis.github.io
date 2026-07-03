(function () {
  "use strict";

  var DATA_URL = "https://data.nazarenolecis.com/bilancio-pubblico/dashboard.json";
  var state = { regions: [], metric: "mld" };

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
  function compact(value, maxLength) { var s = text(value).replace(/\s+/g, " ").trim(); maxLength = maxLength || 42; return s.length <= maxLength ? s : s.slice(0, maxLength - 3).trim() + "..."; }

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

  function addJumpLink() {
    var nav = document.querySelector(".bp-jump-nav");
    if (!nav || nav.querySelector('a[href="#openbdap-2024"]')) return;
    var link = document.createElement("a");
    link.href = "#openbdap-2024";
    link.textContent = "OpenBDAP 2024";
    nav.appendChild(link);
  }

  function createSection() {
    if (byId("openbdap-2024")) return byId("openbdap-2024");
    var section = document.createElement("section");
    section.className = "bp-grid-2";
    section.id = "openbdap-2024";
    section.innerHTML = [
      '<article class="bp-card">',
      '<div class="bp-card-title"><h2>OpenBDAP 2024 - Spesa regionale</h2><span>Confronto per missione</span></div>',
      '<p>Seleziona più regioni per confrontare la spesa per missione. Puoi usare valori assoluti, pro capite o per superficie.</p>',
      '<div class="bp-chart-wrap"><div id="bpOpenbdapMissionChart" class="chart bp-chart" role="img" aria-label="Spesa regionale OpenBDAP per missione"></div></div>',
      '<p class="bp-chart-credit">Fonte: RGS - OpenBDAP, Finanza degli Enti Territoriali. Elaborazione di Nazareno Lecis.</p>',
      '</article>',
      '<article class="bp-card">',
      '<div class="bp-card-title"><h2>Selezione confronto</h2><label for="bpOpenbdapMetric" class="bp-select-label">Metrica</label><select id="bpOpenbdapMetric" class="bp-select"></select></div>',
      '<p>Usa Ctrl o Cmd per selezionare più regioni. La tabella riporta le prime voci per la metrica scelta.</p>',
      '<label for="bpOpenbdapRegions" class="bp-select-label">Regioni</label><select id="bpOpenbdapRegions" class="bp-select" multiple size="8"></select>',
      '<div class="bp-table-wrap"><table class="bp-table"><thead><tr><th>Regione</th><th>Missione</th><th>Valore</th></tr></thead><tbody id="bpOpenbdapMissionRows"></tbody></table></div>',
      '</article>'
    ].join("");
    var target = byId("focus-spese");
    if (target && target.parentNode) target.parentNode.insertBefore(section, target.nextSibling);
    return section;
  }

  function missionRows(payload) {
    var regional = payload.regional_budgets || {};
    var detail = regional.spending_2024_detail || {};
    var rows = arr(detail.by_mission);
    if (!rows.length) rows = arr(regional.spending_by_mission).filter(function (row) { return num(row.anno) === 2024; });
    return rows.filter(function (row) { return num(row.mld) !== null; });
  }

  function metrics(payload, rows) {
    var regional = payload.regional_budgets || {};
    var options = arr(regional.normalization_options).length ? arr(regional.normalization_options) : fallbackMetrics;
    return options.filter(function (metric) {
      return rows.some(function (row) { return num(row[metric.field]) !== null; });
    });
  }

  function allRegions(rows) {
    return Array.from(new Set(rows.map(function (row) { return text(row.regione); }))).sort();
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
    if (state.regions.length) return state.regions;
    state.regions = defaultRegions(rows);
    return state.regions;
  }

  function setupControls(payload, rows, metricList) {
    var metricSelect = byId("bpOpenbdapMetric");
    if (metricSelect && !metricSelect.options.length) {
      metricList.forEach(function (metric) {
        var option = document.createElement("option");
        option.value = metric.id;
        option.textContent = metric.label;
        metricSelect.appendChild(option);
      });
      metricSelect.addEventListener("change", function () {
        state.metric = metricSelect.value;
        render(payload);
      });
    }
    if (metricSelect) metricSelect.value = state.metric;

    var regionSelect = byId("bpOpenbdapRegions");
    if (regionSelect && !regionSelect.options.length) {
      allRegions(rows).forEach(function (region) {
        var option = document.createElement("option");
        option.value = region;
        option.textContent = region;
        regionSelect.appendChild(option);
      });
      regionSelect.addEventListener("change", function () {
        state.regions = Array.prototype.slice.call(regionSelect.selectedOptions).map(function (option) { return option.value; });
        render(payload);
      });
    }
    if (regionSelect) {
      selectedRegions(rows).forEach(function (region) {
        var option = Array.prototype.find.call(regionSelect.options, function (item) { return item.value === region; });
        if (option) option.selected = true;
      });
    }
  }

  function topMissions(rows, regions, metric) {
    var totals = {};
    rows.filter(function (row) { return regions.indexOf(text(row.regione)) >= 0; }).forEach(function (row) {
      var mission = text(row.missione || row.missione_code);
      totals[mission] = (totals[mission] || 0) + (num(row[metric.field]) || 0);
    });
    return Object.keys(totals).sort(function (a, b) { return totals[b] - totals[a]; }).slice(0, mobile() ? 6 : 8);
  }

  function plotMissionChart(rows, metric) {
    var node = byId("bpOpenbdapMissionChart");
    if (!node || !window.Plotly) return;
    var regions = selectedRegions(rows).slice(0, 6);
    var missions = topMissions(rows, regions, metric);
    var traces = regions.map(function (region, index) {
      var values = missions.map(function (mission) {
        var matched = rows.find(function (row) { return text(row.regione) === region && text(row.missione || row.missione_code) === mission; });
        return matched ? num(matched[metric.field]) : null;
      });
      return {
        type: "bar",
        name: region,
        x: missions.map(function (mission) { return mobile() ? compact(mission, 18) : compact(mission, 30); }),
        y: values,
        customdata: values.map(function (value) { return formatValue(value, metric); }),
        marker: { color: index === 0 ? css("--orange", "#ff5a1f") : ["#4e79a7", "#59a14f", "#f28e2b", "#76b7b2", "#e15759"][index - 1] || "#bab0ac" },
        hovertemplate: "%{fullData.name}<br>%{x}<br>%{customdata}<extra></extra>"
      };
    });
    if (!traces.length || !missions.length) {
      node.textContent = "Nessun dato OpenBDAP disponibile";
      return;
    }
    window.Plotly.react(node, traces, {
      barmode: "group",
      autosize: true,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      margin: { t: 20, r: 18, b: mobile() ? 120 : 92, l: mobile() ? 62 : 82 },
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
    rows.filter(function (row) { return regions.indexOf(text(row.regione)) >= 0 && num(row[metric.field]) !== null; })
      .sort(function (a, b) { return (num(b[metric.field]) || 0) - (num(a[metric.field]) || 0); })
      .slice(0, 24)
      .forEach(function (row) {
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
    var note = "OpenBDAP 2024 aggiunge un dettaglio dei rendiconti regionali per missione. I confronti tra regioni possono essere normalizzati per popolazione o superficie.";
    var exists = Array.prototype.some.call(notes.querySelectorAll("li"), function (item) { return item.textContent === note; });
    if (exists) return;
    var li = document.createElement("li");
    li.textContent = note;
    notes.appendChild(li);
  }

  function render(payload) {
    var rows = missionRows(payload || {});
    if (!rows.length) return;
    var metricList = metrics(payload || {}, rows);
    var metric = metricList.find(function (item) { return item.id === state.metric; }) || metricList[0];
    if (!metric) return;
    state.metric = metric.id;
    addJumpLink();
    createSection();
    setupControls(payload || {}, rows, metricList);
    plotMissionChart(rows, metric);
    renderTable(rows, metric);
    addMethodNote();
  }

  function load() {
    if (!window.fetch) return;
    window.fetch(DATA_URL).then(function (response) {
      if (!response.ok) throw new Error("dashboard json");
      return response.json();
    }).then(render).catch(function () {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { window.setTimeout(load, 1000); window.setTimeout(load, 2400); });
  } else {
    window.setTimeout(load, 1000);
    window.setTimeout(load, 2400);
  }
})();
