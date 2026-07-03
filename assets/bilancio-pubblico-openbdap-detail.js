(function () {
  "use strict";

  var DATA_URL = "https://data.nazarenolecis.com/bilancio-pubblico/dashboard.json";
  var state = { region: "Tutte" };

  function byId(id) { return document.getElementById(id); }
  function arr(value) { return Array.isArray(value) ? value : []; }
  function num(value) { var parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
  function text(value, fallback) { return value === null || value === undefined || value === "" ? fallback || "-" : String(value); }
  function css(name, fallback) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; }
  function mobile() { return window.matchMedia && window.matchMedia("(max-width: 760px)").matches; }
  function compact(value, maxLength) { var s = text(value).replace(/\s+/g, " ").trim(); maxLength = maxLength || 42; return s.length <= maxLength ? s : s.slice(0, maxLength - 3).trim() + "..."; }
  function formatMld(value, digits) { var n = num(value); return n === null ? "-" : n.toLocaleString("it-IT", { maximumFractionDigits: digits || 1, minimumFractionDigits: 0 }) + " mld"; }

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
      '<div class="bp-card-title"><h2>OpenBDAP 2024 - Spesa regionale</h2><span>Missioni, miliardi di euro</span></div>',
      '<p>Dettaglio delle spese regionali per missione dal perimetro Regioni e province autonome.</p>',
      '<div class="bp-chart-wrap"><div id="bpOpenbdapMissionChart" class="chart bp-chart" role="img" aria-label="Spesa regionale OpenBDAP per missione"></div></div>',
      '<p class="bp-chart-credit">Fonte: RGS - OpenBDAP, Finanza degli Enti Territoriali. Elaborazione di Nazareno Lecis.</p>',
      '</article>',
      '<article class="bp-card">',
      '<div class="bp-card-title"><h2>Dettaglio per Regione</h2><label for="bpOpenbdapRegion" class="bp-select-label">Regione</label><select id="bpOpenbdapRegion" class="bp-select"></select></div>',
      '<p>Prime voci di spesa 2024 per missione. La tabella usa il dettaglio OpenBDAP FET.</p>',
      '<div class="bp-table-wrap"><table class="bp-table"><thead><tr><th>Regione</th><th>Missione</th><th>Spesa</th></tr></thead><tbody id="bpOpenbdapMissionRows"></tbody></table></div>',
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

  function groupedByMission(rows) {
    var groups = {};
    rows.forEach(function (row) {
      var key = text(row.missione_code || row.missione || "-");
      if (!groups[key]) groups[key] = { code: key, label: text(row.missione || key), mld: 0 };
      groups[key].mld += num(row.mld) || 0;
    });
    return Object.keys(groups).map(function (key) { return groups[key]; })
      .sort(function (a, b) { return b.mld - a.mld; })
      .slice(0, 12)
      .reverse();
  }

  function plotMissionChart(rows) {
    var node = byId("bpOpenbdapMissionChart");
    if (!node || !window.Plotly) return;
    var grouped = groupedByMission(rows);
    if (!grouped.length) {
      node.textContent = "Nessun dato OpenBDAP disponibile";
      return;
    }
    window.Plotly.react(node, [{
      type: "bar",
      orientation: "h",
      x: grouped.map(function (row) { return row.mld; }),
      y: grouped.map(function (row) { return mobile() ? compact(row.label, 26) : compact(row.label, 44); }),
      customdata: grouped.map(function (row) { return row.label; }),
      marker: { color: css("--orange", "#ff5a1f") },
      text: grouped.map(function (row) { return formatMld(row.mld, 1); }),
      textposition: mobile() ? "none" : "auto",
      hovertemplate: "%{customdata}<br>%{x:.1f} mld<extra></extra>"
    }], {
      autosize: true,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      margin: { t: 20, r: mobile() ? 12 : 34, b: 48, l: mobile() ? 150 : 220 },
      showlegend: false,
      font: { color: css("--text", "#f5f2ed"), family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", size: 12 },
      xaxis: { title: "Miliardi di euro", fixedrange: true, gridcolor: css("--line", "#303030"), tickfont: { color: css("--muted", "#b9b2aa") } },
      yaxis: { title: "", fixedrange: true, tickfont: { color: css("--muted", "#b9b2aa") } }
    }, { responsive: true, displayModeBar: false, scrollZoom: false, doubleClick: false, showTips: false }).catch(function () {});
  }

  function fillRegionSelect(rows, payload) {
    var select = byId("bpOpenbdapRegion");
    if (!select) return;
    if (select.options.length) return;
    var regions = Array.from(new Set(rows.map(function (row) { return text(row.regione); }))).sort();
    ["Tutte"].concat(regions).forEach(function (region) {
      var option = document.createElement("option");
      option.value = region;
      option.textContent = region;
      select.appendChild(option);
    });
    select.value = state.region;
    select.addEventListener("change", function () {
      state.region = select.value;
      renderTable(rows);
    });
  }

  function renderTable(rows) {
    var tbody = byId("bpOpenbdapMissionRows");
    if (!tbody) return;
    tbody.innerHTML = "";
    var selected = state.region;
    var filtered = selected === "Tutte" ? rows.slice() : rows.filter(function (row) { return text(row.regione) === selected; });
    filtered.sort(function (a, b) { return (num(b.mld) || 0) - (num(a.mld) || 0); }).slice(0, 18).forEach(function (row) {
      var tr = document.createElement("tr");
      [text(row.regione), text(row.missione || row.missione_code), formatMld(row.mld, 2)].forEach(function (value) {
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
    var note = "OpenBDAP 2024 aggiunge un dettaglio dei rendiconti regionali per missione. Il dato è più granulare del COFOG Eurostat e segue il perimetro Regioni e province autonome.";
    var exists = Array.prototype.some.call(notes.querySelectorAll("li"), function (item) { return item.textContent === note; });
    if (exists) return;
    var li = document.createElement("li");
    li.textContent = note;
    notes.appendChild(li);
  }

  function render(payload) {
    var rows = missionRows(payload || {});
    if (!rows.length) return;
    addJumpLink();
    createSection();
    plotMissionChart(rows);
    fillRegionSelect(rows, payload || {});
    renderTable(rows);
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
