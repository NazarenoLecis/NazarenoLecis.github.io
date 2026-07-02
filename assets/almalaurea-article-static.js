(function () {
  var DATA_VERSION = "v=20260703-2";
  var DATA_URL = "https://data.nazarenolecis.com/almalaurea/almalaurea_article_data.json?" + DATA_VERSION;
  var TIMESERIES_URL = "https://data.nazarenolecis.com/almalaurea/almalaurea_article_timeseries_data.json?" + DATA_VERSION;
  var WILDCARD = "*";
  var records = [];
  var timeRecords = [];
  var chartCounter = 0;
  var colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf", "#4e79a7", "#f28e2b", "#59a14f", "#e15759", "#76b7b2"];

  function onArticle() {
    return location.pathname.indexOf("/articoli/occupazione-salari-laureati-almalaurea") >= 0;
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function toNumber(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function escapeHtml(value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function colorFor(index) {
    return colors[index % colors.length];
  }

  function cssColor(name, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  function formatPercent(value) {
    return Number.isFinite(value) ? value.toLocaleString("it-IT", { maximumFractionDigits: 1 }) + "%" : "-";
  }

  function formatEuro(value) {
    return Number.isFinite(value) ? Math.round(value).toLocaleString("it-IT") + " euro" : "-";
  }

  function normalize(record) {
    record.survey_year = toNumber(record.survey_year);
    record.graduation_year = toNumber(record.graduation_year);
    record.years_after_degree = toNumber(record.years_after_degree);
    record.graduates = toNumber(record.graduates);
    record.employment_rate = toNumber(record.employment_rate);
    record.net_monthly_salary = toNumber(record.net_monthly_salary);
    record.second_level_enrollment_rate = toNumber(record.second_level_enrollment_rate);
    record.university_label = record.university_label || record.university;
    record.disciplinary_group_label = record.disciplinary_group_label || record.disciplinary_group;
    record.course_type_label = record.course_type_label || record.course_type;
    record.degree_class_label = record.degree_class_label || record.degree_class;
    return record;
  }

  function parseIframeParams(iframe) {
    var src = iframe.getAttribute("src") || "";
    var query = src.split("?")[1] || "";
    var params = new URLSearchParams(query.replace(/&amp;/g, "&"));
    return {
      chart: params.get("chart") || "scatter",
      survey: toNumber(params.get("survey")) || 2025,
      years: toNumber(params.get("years")) || 1,
      cohort: toNumber(params.get("cohort")) || null,
      definition: params.get("definition") || "broad",
      course: params.get("course") || WILDCARD,
      dimension: params.get("dimension") || "disciplinary_group",
      split: params.get("split") || "disciplinary_group",
      timeMode: params.get("time_mode") || "fixed_horizon",
      metric: params.get("metric") || "employment_rate"
    };
  }

  function replaceIframes() {
    document.querySelectorAll("figure.dashboard-live iframe").forEach(function (iframe) {
      if (iframe.dataset.staticReplaced === "1") return;
      iframe.dataset.staticReplaced = "1";
      var params = parseIframeParams(iframe);
      var div = document.createElement("div");
      div.className = "article-static-chart";
      div.id = "articleStaticChart" + (++chartCounter);
      div.dataset.params = JSON.stringify(params);
      div.innerHTML = "<div class=\"article-chart-loading\">Caricamento grafico...</div>";
      iframe.replaceWith(div);
    });
  }

  function ensureStyle() {
    if (byId("almArticleStaticStyle")) return;
    var style = document.createElement("style");
    style.id = "almArticleStaticStyle";
    style.textContent = ".article-static-chart{min-height:560px;background:var(--bg)}.article-static-chart .plot-container,.article-static-chart .svg-container{background:var(--bg)!important}.article-chart-loading,.article-chart-error{padding:26px;color:var(--muted);line-height:1.55}.article-chart-error strong{color:var(--text)}@media(max-width:760px){.article-static-chart{min-width:880px;min-height:560px}}";
    document.head.appendChild(style);
  }

  function loadPlotly() {
    if (window.Plotly) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector("script[data-article-plotly]");
      if (existing) {
        existing.addEventListener("load", resolve);
        existing.addEventListener("error", reject);
        return;
      }
      var script = document.createElement("script");
      script.src = "https://cdn.plot.ly/plotly-2.35.2.min.js";
      script.dataset.articlePlotly = "1";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function fetchJson(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status + " su " + url);
      return response.json();
    });
  }

  function extractRecords(payload) {
    return asArray(payload.records)
      .concat(asArray(payload.dashboard_records))
      .concat(asArray(payload.detailed_records))
      .concat(asArray(payload.article_records))
      .concat(asArray(payload.data));
  }

  function extractTimeRecords(payload) {
    return asArray(payload.timeseries_records)
      .concat(asArray(payload.time_records))
      .concat(asArray(payload.timeseries))
      .concat(asArray(payload.records));
  }

  function fetchData() {
    return Promise.all([fetchJson(DATA_URL), fetchJson(TIMESERIES_URL).catch(function () { return { records: [] }; })])
      .then(function (payloads) {
        records = extractRecords(payloads[0]).map(normalize);
        timeRecords = extractTimeRecords(payloads[1]).map(normalize);
      });
  }

  function fixedRows(source, params) {
    var cohort = params.cohort || (params.survey - params.years);
    return source.filter(function (record) {
      if (record.survey_year !== params.survey) return false;
      if (record.years_after_degree !== params.years) return false;
      if (record.graduation_year !== cohort) return false;
      if (record.employment_definition !== params.definition) return false;
      if (params.course !== WILDCARD && record.course_type !== params.course) return false;
      if (params.course === WILDCARD && record.course_type !== WILDCARD) return false;
      return Number.isFinite(record.net_monthly_salary) && record.net_monthly_salary > 0 &&
        Number.isFinite(record.employment_rate) && record.employment_rate > 0;
    });
  }

  function weightedAverage(rows, field) {
    var weightedSum = 0;
    var weightSum = 0;
    var plainSum = 0;
    var plainCount = 0;
    rows.forEach(function (record) {
      var value = record[field];
      if (!Number.isFinite(value) || value <= 0) return;
      plainSum += value;
      plainCount += 1;
      if (Number.isFinite(record.graduates) && record.graduates > 0) {
        weightedSum += value * record.graduates;
        weightSum += record.graduates;
      }
    });
    if (weightSum > 0) return weightedSum / weightSum;
    return plainCount ? plainSum / plainCount : null;
  }

  function meanValue(values) {
    var total = 0;
    var count = 0;
    values.forEach(function (value) {
      if (!Number.isFinite(value) || value <= 0) return;
      total += value;
      count += 1;
    });
    return count ? total / count : null;
  }

  function medianValue(values) {
    var ordered = values
      .filter(function (value) { return Number.isFinite(value) && value > 0; })
      .sort(function (a, b) { return a - b; });
    if (!ordered.length) return null;
    var middle = Math.floor(ordered.length / 2);
    if (ordered.length % 2) return ordered[middle];
    return (ordered[middle - 1] + ordered[middle]) / 2;
  }

  function sanitizeCourseType(value) {
    return value === WILDCARD || !value ? "Tutti i tipi di corso" : String(value);
  }

  function aggregatePoints(rows, keyFn, labelFn) {
    var buckets = new Map();
    rows.forEach(function (record) {
      var key = keyFn(record);
      if (!key || key === WILDCARD) return;
      if (!buckets.has(key)) buckets.set(key, { key: key, label: labelFn(record), rows: [] });
      buckets.get(key).rows.push(record);
    });
    return Array.from(buckets.values()).map(function (bucket) {
      var salaryValues = bucket.rows.map(function (record) { return record.net_monthly_salary; });
      return {
        key: bucket.key,
        label: bucket.label,
        group_label: bucket.rows[0].disciplinary_group_label,
        course_type_label: sanitizeCourseType(bucket.rows[0].course_type_label),
        graduates: bucket.rows.reduce(function (sum, record) { return sum + (record.graduates || 0); }, 0),
        employment_rate: weightedAverage(bucket.rows, "employment_rate"),
        net_monthly_salary: weightedAverage(bucket.rows, "net_monthly_salary")
      };
    }).filter(function (point) {
      return Number.isFinite(point.employment_rate) && point.employment_rate > 0 && Number.isFinite(point.net_monthly_salary) && point.net_monthly_salary > 0;
    });
  }

  function scatterPoints(params) {
    var rows = fixedRows(records, params);
    if (params.dimension === "university") {
      var universityRows = rows.filter(function (record) {
        return record.university !== WILDCARD && record.degree_class === WILDCARD;
      });
      return aggregatePoints(universityRows, function (record) { return record.university; }, function (record) { return record.university_label; });
    }
    if (params.dimension === "degree_class") {
      var degreeRows = rows.filter(function (record) {
        return record.degree_class !== WILDCARD && record.university === WILDCARD;
      });
      return aggregatePoints(degreeRows, function (record) { return record.degree_class; }, function (record) { return record.degree_class_label; });
    }
    var groupRows = rows.filter(function (record) {
      return record.disciplinary_group !== WILDCARD && record.university === WILDCARD && record.degree_class === WILDCARD;
    });
    return aggregatePoints(groupRows, function (record) { return record.disciplinary_group; }, function (record) { return record.disciplinary_group_label; });
  }

  function clearForPlot(el) {
    el.innerHTML = "";
  }

  function renderScatter(el, params) {
    var points = scatterPoints(params);
    if (!points.length) return renderError(el, "Nessun dato disponibile per questa vista statica.");
    clearForPlot(el);
    var maxGraduates = Math.max.apply(null, points.map(function (point) { return point.graduates || 0; })) || 1;
    var traces = points.map(function (point, index) {
      return {
        type: "scatter",
        mode: "markers+text",
        name: point.label,
        x: [point.net_monthly_salary],
        y: [point.employment_rate],
        text: [params.dimension === "university" ? "" : point.label],
        textposition: ["top center", "bottom center", "top left", "top right", "bottom left", "bottom right"][index % 6],
        textfont: { size: 11 },
        cliponaxis: false,
        marker: { color: colorFor(index), size: 10 + 32 * Math.sqrt((point.graduates || 0) / maxGraduates), opacity: 0.85, line: { color: "rgba(255,255,255,.45)", width: 1 } },
        customdata: [[point.label, point.group_label, point.course_type_label, point.graduates]],
        hovertemplate: "<b>%{customdata[0]}</b><br>Gruppo: %{customdata[1]}<br>Tipo corso: %{customdata[2]}<br>Retribuzione media: %{x:.0f} euro<br>Occupazione: %{y:.1f}%<br>Laureati: %{customdata[3]:,.0f}<extra></extra>"
      };
    });
    window.Plotly.react(el.id, traces, layout({
      xaxis: { title: { text: "Retribuzione mensile netta" }, gridcolor: cssColor("--line", "#303030"), fixedrange: true },
      yaxis: { title: { text: "Tasso di occupazione" }, ticksuffix: "%", gridcolor: cssColor("--line", "#303030"), fixedrange: true },
      margin: { l: 78, r: 220, t: 20, b: 76 }
    }), plotConfig());
  }

  function boxRows(params) {
    return fixedRows(records, params).filter(function (record) {
      return record.university !== WILDCARD && record.degree_class === WILDCARD && record.disciplinary_group !== WILDCARD;
    });
  }

  function renderBox(el, params) {
    var rows = boxRows(params);
    if (!rows.length) return renderError(el, "Nessun dato disponibile per questa distribuzione statica.");
    clearForPlot(el);
    var byGroup = new Map();
    rows.forEach(function (record) {
      var key = params.split === "course_type" ? record.course_type_label : record.disciplinary_group_label;
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key).push(record);
    });
    var traces = Array.from(byGroup.entries()).map(function (entry, index) {
      var group = entry[0];
      var groupRows = entry[1];
      var salaryValues = groupRows.map(function (record) { return record.net_monthly_salary; });
      var groupMeanSalary = meanValue(salaryValues);
      var groupMedianSalary = medianValue(salaryValues);
      return {
        type: "box",
        name: group.length > 24 ? group.slice(0, 23) + "..." : group,
        y: groupRows.map(function (record) { return record.net_monthly_salary; }),
        text: groupRows.map(function (record) { return record.university_label; }),
        customdata: groupRows.map(function (record) { return [record.disciplinary_group_label, sanitizeCourseType(record.course_type_label), groupMeanSalary, groupMedianSalary]; }),
        boxpoints: "all",
        jitter: 0.32,
        pointpos: 0,
        marker: { color: colorFor(index), opacity: 0.72, size: 7 },
        line: { color: colorFor(index) },
        fillcolor: "rgba(160,160,160,.16)",
        hovertemplate: "<b>%{text}</b><br>Gruppo: %{customdata[0]}<br>Tipo corso: %{customdata[1]}<br>Retribuzione media: %{customdata[2]:.0f} euro<br>Retribuzione mediana: %{customdata[3]:.0f} euro<extra></extra>"
      };
    });
    window.Plotly.react(el.id, traces, layout({
      showlegend: false,
      xaxis: { tickangle: -35, title: { text: params.split === "course_type" ? "Tipo corso" : "Gruppo disciplinare" }, gridcolor: "rgba(0,0,0,0)", fixedrange: true },
      yaxis: { title: { text: "Retribuzione mensile netta" }, gridcolor: cssColor("--line", "#303030"), fixedrange: true },
      margin: { l: 72, r: 26, t: 18, b: 132 }
    }), plotConfig());
  }

  function metricLabel(metric) {
    return metric === "net_monthly_salary" ? "Retribuzione mensile netta" : "Tasso di occupazione";
  }

  function metricSuffix(metric) {
    return metric === "net_monthly_salary" ? " euro" : "%";
  }

  function timeRows(params) {
    var metric = params.metric === "second_level_enrollment_rate" ? "employment_rate" : params.metric;
    var source = timeRecords.length ? timeRecords : records;
    return source.filter(function (record) {
      if (record.employment_definition !== params.definition) return false;
      if (params.course !== WILDCARD && record.course_type !== params.course) return false;
      if (params.timeMode === "cohort_path") {
        if (record.graduation_year !== params.cohort) return false;
      } else {
        if (record.years_after_degree !== params.years) return false;
        if (record.survey_year < 2007 || record.survey_year > params.survey) return false;
        if (record.graduation_year !== record.survey_year - params.years) return false;
      }
      if (params.dimension === "university") {
        if (record.university === WILDCARD) return false;
      } else if (record.disciplinary_group === WILDCARD || record.university !== WILDCARD) {
        return false;
      }
      return Number.isFinite(record[metric]) && record[metric] > 0;
    });
  }

  function renderTime(el, params) {
    var metric = params.metric === "second_level_enrollment_rate" ? "employment_rate" : params.metric;
    var rows = timeRows(params);
    if (!rows.length) return renderError(el, "Nessun dato disponibile per questa serie statica.");
    clearForPlot(el);
    var buckets = new Map();
    rows.forEach(function (record) {
      var key = params.dimension === "university" ? record.university : record.disciplinary_group;
      var label = params.dimension === "university" ? record.university_label : record.disciplinary_group_label;
      var x = params.timeMode === "cohort_path" ? record.years_after_degree : record.survey_year;
      if (!key || key === WILDCARD || !Number.isFinite(x)) return;
      var bucketKey = key + "||" + x;
      if (!buckets.has(bucketKey)) buckets.set(bucketKey, { key: key, label: label, x: x, rows: [] });
      buckets.get(bucketKey).rows.push(record);
    });
    var points = Array.from(buckets.values()).map(function (bucket) {
      return { key: bucket.key, label: bucket.label, x: bucket.x, value: weightedAverage(bucket.rows, metric), graduates: bucket.rows.reduce(function (sum, record) { return sum + (record.graduates || 0); }, 0) };
    }).filter(function (point) { return Number.isFinite(point.value); });
    if (!points.length) return renderError(el, "Nessun valore numerico disponibile per questa serie statica.");

    var grouped = new Map();
    points.forEach(function (point) {
      if (!grouped.has(point.key)) grouped.set(point.key, []);
      grouped.get(point.key).push(point);
    });
    var traces = Array.from(grouped.values()).map(function (series, index) {
      series.sort(function (a, b) { return a.x - b.x; });
      return { type: "scatter", mode: "lines+markers", name: series[0].label, x: series.map(function (point) { return point.x; }), y: series.map(function (point) { return point.value; }), marker: { color: colorFor(index), size: 8 }, line: { color: colorFor(index), width: 2 }, customdata: series.map(function (point) { return [point.label, point.graduates]; }), hovertemplate: "<b>%{customdata[0]}</b><br>" + (params.timeMode === "cohort_path" ? "Anni dalla laurea" : "Anno indagine") + ": %{x}<br>" + metricLabel(metric) + ": %{y:.1f}" + metricSuffix(metric) + "<br>Laureati: %{customdata[1]:,.0f}<extra></extra>" };
    }).filter(function (trace) { return trace.x.length > 0; });
    if (!traces.length) return renderError(el, "Nessuna serie valida da mostrare.");
    window.Plotly.react(el.id, traces, layout({
      xaxis: { title: { text: params.timeMode === "cohort_path" ? "Anni dalla laurea" : "Anno indagine" }, gridcolor: cssColor("--line", "#303030"), fixedrange: true, dtick: 1 },
      yaxis: { title: { text: metricLabel(metric) }, gridcolor: cssColor("--line", "#303030"), fixedrange: true, ticksuffix: metric === "net_monthly_salary" ? "" : "%" },
      margin: { l: 76, r: 250, t: 18, b: 76 }
    }), plotConfig());
  }

  function layout(extra) {
    return Object.assign({
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: cssColor("--text", "#f5f2ed"), family: "system-ui, -apple-system, Segoe UI, sans-serif", size: 14 },
      dragmode: false,
      legend: { orientation: "v", x: 1.02, y: 1, xanchor: "left" }
    }, extra || {});
  }

  function plotConfig() {
    return { responsive: true, displayModeBar: false, scrollZoom: false, doubleClick: false };
  }

  function renderError(el, message) {
    el.innerHTML = "<div class=\"article-chart-error\"><strong>Grafico non disponibile.</strong><br>" + escapeHtml(message) + "</div>";
  }

  function renderCharts() {
    document.querySelectorAll(".article-static-chart").forEach(function (el) {
      var params = JSON.parse(el.dataset.params || "{}");
      if (params.chart === "box") return renderBox(el, params);
      if (params.chart === "time") return renderTime(el, params);
      return renderScatter(el, params);
    });
  }

  function bestRowKey(record) {
    return [record.employment_rate || -1, record.graduates || -1, record.net_monthly_salary || -1];
  }

  function betterThan(candidate, current) {
    if (!current) return true;
    var a = bestRowKey(candidate);
    var b = bestRowKey(current);
    for (var i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return a[i] > b[i];
    return String(candidate.disciplinary_group_label).localeCompare(String(current.disciplinary_group_label), "it") < 0;
  }

  function renderBestCourses(containerId, secondLevel) {
    var container = byId(containerId);
    if (!container) return;
    var best = new Map();
    records.forEach(function (record) {
      if (record.survey_year !== 2025 || record.years_after_degree !== 1 || record.graduation_year !== 2024) return;
      if (record.employment_definition !== "broad") return;
      if (record.university === WILDCARD || record.disciplinary_group === WILDCARD || record.degree_class !== WILDCARD) return;
      var isSecond = record.course_type === "laurea magistrale biennale" || record.course_type === "laurea magistrale a ciclo unico";
      if (secondLevel !== isSecond) return;
      if (!Number.isFinite(record.employment_rate) || !Number.isFinite(record.graduates) || record.graduates < 20) return;
      if (betterThan(record, best.get(record.university))) best.set(record.university, record);
    });
    var rows = Array.from(best.values()).sort(function (a, b) {
      if (b.employment_rate !== a.employment_rate) return b.employment_rate - a.employment_rate;
      return b.graduates - a.graduates;
    });
    if (!rows.length) {
      container.textContent = "Nessun dato disponibile per questa selezione.";
      return;
    }
    container.innerHTML = rows.map(function (record) {
      var salary = Number.isFinite(record.net_monthly_salary) ? " - " + formatEuro(record.net_monthly_salary) : "";
      return "<div class=\"best-course-row\" style=\"--rate:" + record.employment_rate.toFixed(1) + "\"><div class=\"best-course-main\"><strong>" + escapeHtml(record.university_label) + "</strong><span>" + escapeHtml(record.disciplinary_group_label) + " - " + escapeHtml(record.course_type_label.replace(/^laurea /i, "")) + "</span></div><div class=\"best-course-bar\" aria-hidden=\"true\"><span></span></div><div class=\"best-course-value\">" + formatPercent(record.employment_rate) + "</div><div class=\"best-course-meta\">" + Math.round(record.graduates).toLocaleString("it-IT") + " laureati" + salary + "</div></div>";
    }).join("");
  }

  function renderBestCourseTables() {
    renderBestCourses("bestCourseRowsFirstLevel", false);
    renderBestCourses("bestCourseRowsSecondLevel", true);
  }

  function init() {
    if (!onArticle()) return;
    ensureStyle();
    replaceIframes();
    Promise.all([loadPlotly(), fetchData()]).then(function () {
      renderCharts();
      renderBestCourseTables();
    }).catch(function (error) {
      document.querySelectorAll(".article-static-chart").forEach(function (el) {
        renderError(el, "Non riesco a caricare i dati AlmaLaurea: " + error.message);
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
