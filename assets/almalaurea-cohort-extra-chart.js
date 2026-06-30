(function () {
  var DATA_URL = "/data/almalaurea/almalaurea_timeseries_data.json";
  var WILDCARD = "*";
  var records = [];
  var colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];

  function byId(id) {
    return document.getElementById(id);
  }

  function toNumber(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cssColor(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function normalizeRecord(record) {
    record.graduates = toNumber(record.graduates);
    record.employment_rate = toNumber(record.employment_rate);
    record.net_monthly_salary = toNumber(record.net_monthly_salary);
    record.survey_year = toNumber(record.survey_year);
    record.years_after_degree = toNumber(record.years_after_degree);
    record.graduation_year = toNumber(record.graduation_year);
    record.university_label = record.university_label || record.university;
    record.disciplinary_group_label = record.disciplinary_group_label || record.disciplinary_group;
    record.course_type_label = record.course_type_label || record.course_type;
    return record;
  }

  function weightedAverage(rows, field) {
    var weightedSum = 0;
    var weightSum = 0;
    var plainSum = 0;
    var plainCount = 0;
    rows.forEach(function (record) {
      var value = record[field];
      if (!Number.isFinite(value)) return;
      plainSum += value;
      plainCount += 1;
      if (Number.isFinite(record.graduates) && record.graduates > 0) {
        weightedSum += value * record.graduates;
        weightSum += record.graduates;
      }
    });
    if (weightSum > 0) return weightedSum / weightSum;
    return plainCount > 0 ? plainSum / plainCount : null;
  }

  function metricLabel(metric) {
    if (metric === "net_monthly_salary") return "Retribuzione mensile netta";
    return "Tasso di occupazione";
  }

  function metricSuffix(metric) {
    return metric === "net_monthly_salary" ? " euro" : "%";
  }

  function readSharedFilters() {
    return {
      definition: byId("timeDefinition") ? byId("timeDefinition").value : "broad",
      university: byId("timeUniversity") ? byId("timeUniversity").value : WILDCARD,
      group: byId("timeGroup") ? byId("timeGroup").value : WILDCARD,
      course: byId("timeCourse") ? byId("timeCourse").value : WILDCARD,
    };
  }

  function availableCohorts() {
    var counts = new Map();
    records.forEach(function (record) {
      if (!Number.isFinite(record.graduation_year) || !Number.isFinite(record.years_after_degree)) return;
      if (!counts.has(record.graduation_year)) counts.set(record.graduation_year, new Set());
      counts.get(record.graduation_year).add(record.years_after_degree);
    });
    return Array.from(counts.entries())
      .filter(function (entry) { return entry[1].size >= 2; })
      .map(function (entry) { return entry[0]; })
      .sort(function (a, b) { return b - a; });
  }

  function ensurePanel() {
    var existing = byId("cohortPathExtraPanel");
    if (existing) return existing;
    var timeChart = byId("timeSeriesChart");
    if (!timeChart) return null;
    var timePanel = timeChart.closest(".chart-panel");
    if (!timePanel) return null;

    var panel = document.createElement("div");
    panel.id = "cohortPathExtraPanel";
    panel.className = "chart-panel cohort-path-panel";
    panel.innerHTML = "<div class=\"panel-title\"><h2>Percorso della stessa coorte</h2><span>asse orizzontale: anni dalla laurea</span></div>" +
      "<div class=\"chart-context-note\"><strong>Seconda serie storica: stessa coorte nel tempo</strong><p>Questo grafico fissa l’anno di laurea e segue lo stesso gruppo nei diversi orizzonti disponibili. Va letto separatamente dal trend a distanza fissa, che confronta coorti diverse.</p><small class=\"chart-source\">Fonte: AlmaLaurea. Elaborazione: Nazareno Lecis.</small></div>" +
      "<div class=\"cohort-extra-controls\"><label><span>Coorte</span><select id=\"cohortExtraCohort\"></select></label><label><span>Indicatore</span><select id=\"cohortExtraMetric\"><option value=\"employment_rate\">Tasso di occupazione</option><option value=\"net_monthly_salary\">Retribuzione mensile netta</option></select></label><label><span>Serie</span><select id=\"cohortExtraDimension\"><option value=\"disciplinary_group\">Gruppi disciplinari</option><option value=\"university\">Atenei</option></select></label></div>" +
      "<div id=\"cohortPathExtraChart\" class=\"chart\"></div>" +
      "<div class=\"chart-bottom-credit\">Fonte: AlmaLaurea. <strong>Elaborazione: Nazareno Lecis.</strong></div>";
    timePanel.insertAdjacentElement("afterend", panel);
    return panel;
  }

  function ensureStyle() {
    if (byId("cohortPathExtraStyle")) return;
    var style = document.createElement("style");
    style.id = "cohortPathExtraStyle";
    style.textContent = ".cohort-path-panel{margin-top:18px}.cohort-extra-controls{display:grid;grid-template-columns:repeat(3,minmax(160px,1fr));gap:12px;margin:0 0 14px}.cohort-extra-controls label{display:grid;gap:7px}.cohort-extra-controls span{color:var(--muted);font-size:.82rem;font-weight:750;text-transform:uppercase;letter-spacing:.08em}.cohort-extra-controls select{min-height:43px;padding:0 12px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--text);font:inherit}@media(max-width:760px){.cohort-extra-controls{grid-template-columns:1fr}.cohort-path-panel{margin-left:-12px;margin-right:-12px}}";
    document.head.appendChild(style);
  }

  function populateControls() {
    var cohortSelect = byId("cohortExtraCohort");
    if (!cohortSelect || cohortSelect.options.length) return;
    var cohorts = availableCohorts();
    cohortSelect.innerHTML = cohorts.map(function (year) {
      return "<option value=\"" + year + "\">" + year + "</option>";
    }).join("");
    if (!cohortSelect.value && cohorts.length) cohortSelect.value = cohorts[0];
  }

  function rowMatches(record, filters, cohort, dimension) {
    if (record.graduation_year !== cohort) return false;
    if (record.employment_definition !== filters.definition) return false;
    if (filters.course !== WILDCARD) {
      if (record.course_type !== filters.course) return false;
    } else if (record.course_type !== WILDCARD) {
      return false;
    }
    if (filters.university !== WILDCARD && record.university !== filters.university) return false;
    if (filters.group !== WILDCARD && record.disciplinary_group !== filters.group) return false;

    if (dimension === "university") {
      if (record.university === WILDCARD) return false;
      if (filters.group === WILDCARD && record.disciplinary_group !== WILDCARD) return false;
    } else {
      if (record.disciplinary_group === WILDCARD) return false;
      if (filters.university === WILDCARD && record.university !== WILDCARD) return false;
    }
    return true;
  }

  function traceKey(record, dimension) {
    return dimension === "university" ? record.university : record.disciplinary_group;
  }

  function traceLabel(record, dimension) {
    return dimension === "university" ? record.university_label : record.disciplinary_group_label;
  }

  function aggregateRows(rows, metric, dimension) {
    var buckets = new Map();
    rows.forEach(function (record) {
      var key = traceKey(record, dimension);
      var x = record.years_after_degree;
      if (!key || key === WILDCARD || !Number.isFinite(x)) return;
      var bucketKey = key + "||" + x;
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, { key: key, label: traceLabel(record, dimension), x: x, rows: [] });
      }
      buckets.get(bucketKey).rows.push(record);
    });
    return Array.from(buckets.values()).map(function (bucket) {
      var graduates = bucket.rows.reduce(function (sum, record) {
        return sum + (Number.isFinite(record.graduates) ? record.graduates : 0);
      }, 0);
      return {
        key: bucket.key,
        label: bucket.label,
        x: bucket.x,
        value: weightedAverage(bucket.rows, metric),
        graduates: graduates,
      };
    }).filter(function (point) { return Number.isFinite(point.value); });
  }

  function renderEmpty(message) {
    var chart = byId("cohortPathExtraChart");
    if (!chart) return;
    if (window.Plotly) window.Plotly.purge(chart);
    chart.innerHTML = "<div class=\"empty-state\">" + escapeHtml(message) + "</div>";
  }

  function clearEmpty() {
    var chart = byId("cohortPathExtraChart");
    if (!chart) return;
    chart.querySelectorAll(".empty-state").forEach(function (message) {
      message.remove();
    });
  }

  function render() {
    ensureStyle();
    var panel = ensurePanel();
    if (!panel || !window.Plotly) return;
    populateControls();

    var cohort = toNumber(byId("cohortExtraCohort") && byId("cohortExtraCohort").value);
    var metric = byId("cohortExtraMetric") ? byId("cohortExtraMetric").value : "employment_rate";
    var dimension = byId("cohortExtraDimension") ? byId("cohortExtraDimension").value : "disciplinary_group";
    var filters = readSharedFilters();
    if (!Number.isFinite(cohort)) {
      renderEmpty("Nessuna coorte con più orizzonti disponibile.");
      return;
    }

    var rows = records.filter(function (record) { return rowMatches(record, filters, cohort, dimension); });
    var points = aggregateRows(rows, metric, dimension);
    if (!points.length) {
      renderEmpty("Nessun dato disponibile per questa combinazione di filtri.");
      return;
    }

    var grouped = new Map();
    points.forEach(function (point) {
      if (!grouped.has(point.key)) grouped.set(point.key, []);
      grouped.get(point.key).push(point);
    });

    var traces = Array.from(grouped.entries()).map(function (entry, index) {
      var series = entry[1].sort(function (a, b) { return a.x - b.x; });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: series[0].label,
        x: series.map(function (point) { return point.x; }),
        y: series.map(function (point) { return point.value; }),
        marker: { size: 8, color: colors[index % colors.length] },
        line: { width: 2, color: colors[index % colors.length] },
        customdata: series.map(function (point) { return [point.label, point.graduates]; }),
        hovertemplate: "<b>%{customdata[0]}</b><br>Anni dalla laurea: %{x}<br>" + metricLabel(metric) + ": %{y:.1f}" + metricSuffix(metric) + "<br>Laureati: %{customdata[1]:,.0f}<extra></extra>",
      };
    });

    var layout = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: cssColor("--text", "#f5f2ed"), family: "system-ui, -apple-system, Segoe UI, sans-serif", size: 14 },
      margin: { l: 76, r: 210, t: 12, b: 74 },
      xaxis: { title: { text: "Anni dalla laurea" }, gridcolor: cssColor("--line", "#303030"), fixedrange: true },
      yaxis: { title: { text: metricLabel(metric) }, gridcolor: cssColor("--line", "#303030"), fixedrange: true, ticksuffix: metric === "net_monthly_salary" ? "" : "%" },
      legend: { orientation: "v", x: 1.02, y: 1, xanchor: "left", borderwidth: 0 },
      dragmode: false,
    };

    clearEmpty();
    window.Plotly.react("cohortPathExtraChart", traces, layout, {
      responsive: true,
      displayModeBar: false,
      scrollZoom: false,
      doubleClick: false,
    });
  }

  function bind() {
    ["cohortExtraCohort", "cohortExtraMetric", "cohortExtraDimension"].forEach(function (id) {
      var element = byId(id);
      if (element) element.addEventListener("change", render);
    });
    ["timeDefinition", "timeUniversity", "timeGroup", "timeCourse", "resetTimeFilters"].forEach(function (id) {
      var element = byId(id);
      if (!element) return;
      element.addEventListener(id === "resetTimeFilters" ? "click" : "change", function () {
        window.setTimeout(render, 0);
        window.setTimeout(render, 250);
      });
    });
    render();
    window.setTimeout(render, 500);
  }

  function wait(attempt) {
    if (byId("timeSeriesChart") && window.Plotly && records.length) {
      ensurePanel();
      populateControls();
      bind();
      return;
    }
    if (attempt > 100) return;
    window.setTimeout(function () { wait(attempt + 1); }, 100);
  }

  function init() {
    if (location.pathname.indexOf("/dashboard/almalaurea/") < 0) return;
    function start(payload) {
      records = (payload.records || []).map(normalizeRecord);
      wait(0);
    }
    if (window.AlmaLaureaData && window.AlmaLaureaData.timeseriesPayload) {
      start(window.AlmaLaureaData.timeseriesPayload);
      return;
    }
    window.addEventListener("almalaurea:timeseries-ready", function (event) {
      start(event.detail || { records: [] });
    }, { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
