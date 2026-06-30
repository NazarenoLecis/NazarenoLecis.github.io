(function () {
  var DATA_URL = "/data/almalaurea/almalaurea_timeseries_data.json";
  var WILDCARD = "*";
  var records = [];
  var patched = false;
  var rendering = false;
  var colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf", "#4e79a7", "#f28e2b", "#59a14f", "#e15759", "#76b7b2"];

  function byId(id) { return document.getElementById(id); }
  function toNumber(value) { var n = Number(value); return Number.isFinite(n) ? n : null; }
  function cssColor(name, fallback) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; }
  function metricLabel(metric) { return metric === "net_monthly_salary" ? "Retribuzione mensile netta" : "Tasso di occupazione"; }
  function metricSuffix(metric) { return metric === "net_monthly_salary" ? " euro" : "%"; }

  function selectValue(id, fallback) {
    var select = byId(id);
    return select ? select.value : fallback;
  }

  function selectNumber(id, fallback) {
    var value = toNumber(selectValue(id, fallback));
    return Number.isFinite(value) ? value : fallback;
  }

  function normalize(record) {
    record.survey_year = toNumber(record.survey_year);
    record.graduation_year = toNumber(record.graduation_year);
    record.years_after_degree = toNumber(record.years_after_degree);
    record.graduates = toNumber(record.graduates);
    record.employment_rate = toNumber(record.employment_rate);
    record.net_monthly_salary = toNumber(record.net_monthly_salary);
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

  function readFilters() {
    var selectedMetric = selectValue("timeMetric", "employment_rate");
    return {
      mode: selectValue("timeMode", "fixed_horizon"),
      start_year: selectNumber("timeStartYear", 2007),
      end_year: selectNumber("timeEndYear", 2025),
      years_after_degree: selectNumber("timeYearsAfter", 1),
      cohort: selectNumber("timeCohort", 2020),
      definition: selectValue("timeDefinition", "broad"),
      university: selectValue("timeUniversity", WILDCARD),
      group: selectValue("timeGroup", WILDCARD),
      course: selectValue("timeCourse", WILDCARD),
      dimension: selectValue("timePointDimension", "disciplinary_group"),
      metric: selectedMetric === "second_level_enrollment_rate" ? "employment_rate" : selectedMetric
    };
  }

  function baseMatch(record, filters) {
    if (record.employment_definition !== filters.definition) return false;
    if (filters.university !== WILDCARD && record.university !== filters.university) return false;
    if (filters.group !== WILDCARD && record.disciplinary_group !== filters.group) return false;
    if (filters.course !== WILDCARD && record.course_type !== filters.course) return false;
    return true;
  }

  function levelMatch(record, filters) {
    if (filters.dimension === "university") {
      if (record.university === WILDCARD) return false;
      if (filters.group === WILDCARD && record.disciplinary_group !== WILDCARD) return false;
      if (filters.course === WILDCARD && record.course_type !== WILDCARD) return false;
      return true;
    }
    if (record.disciplinary_group === WILDCARD) return false;
    if (filters.university === WILDCARD && record.university !== WILDCARD) return false;
    if (filters.course === WILDCARD && record.course_type !== WILDCARD) return false;
    return true;
  }

  function seriesKey(record, filters) {
    return filters.dimension === "university" ? record.university : record.disciplinary_group;
  }

  function seriesLabel(record, filters) {
    return filters.dimension === "university" ? record.university_label : record.disciplinary_group_label;
  }

  function xValue(record, filters) {
    return filters.mode === "cohort_path" ? record.years_after_degree : record.survey_year;
  }

  function xTitle(filters) {
    return filters.mode === "cohort_path" ? "Anni dalla laurea" : "Anno indagine";
  }

  function rowsForChart(filters) {
    return records.filter(function (record) {
      if (!baseMatch(record, filters) || !levelMatch(record, filters)) return false;
      if (filters.mode === "cohort_path") {
        if (record.graduation_year !== filters.cohort) return false;
      } else {
        if (record.survey_year < Math.max(2007, filters.start_year) || record.survey_year > filters.end_year) return false;
        if (record.years_after_degree !== filters.years_after_degree) return false;
        if (record.graduation_year !== record.survey_year - filters.years_after_degree) return false;
      }
      return Number.isFinite(record[filters.metric]) && record[filters.metric] > 0;
    });
  }

  function aggregate(rows, filters) {
    var buckets = new Map();
    rows.forEach(function (record) {
      var key = seriesKey(record, filters);
      var x = xValue(record, filters);
      if (!key || key === WILDCARD || !Number.isFinite(x)) return;
      var bucketKey = key + "||" + x;
      if (!buckets.has(bucketKey)) buckets.set(bucketKey, { key: key, label: seriesLabel(record, filters), x: x, rows: [] });
      buckets.get(bucketKey).rows.push(record);
    });
    return Array.from(buckets.values()).map(function (bucket) {
      return {
        key: bucket.key,
        label: bucket.label,
        x: bucket.x,
        value: weightedAverage(bucket.rows, filters.metric),
        graduates: bucket.rows.reduce(function (sum, record) { return sum + (record.graduates || 0); }, 0)
      };
    }).filter(function (point) { return Number.isFinite(point.value); });
  }

  function renderMessage(message) {
    var chart = byId("timeSeriesChart");
    if (!chart) return;
    if (window.Plotly) window.Plotly.purge(chart);
    chart.innerHTML = "<div class=\"empty-state\" style=\"padding:26px;line-height:1.55\">" + message + "</div>";
  }

  function clearMessage() {
    var chart = byId("timeSeriesChart");
    if (!chart) return;
    chart.querySelectorAll(".empty-state").forEach(function (message) {
      message.remove();
    });
  }

  function render() {
    if (rendering) return;
    if (!window.Plotly || !records.length || !byId("timeSeriesChart")) return;
    rendering = true;
    try {
      var filters = readFilters();
      var points = aggregate(rowsForChart(filters), filters);
      if (!points.length) {
        renderMessage("Nessun dato disponibile per questa combinazione di filtri.");
        return;
      }

      var grouped = new Map();
      points.forEach(function (point) {
        if (!grouped.has(point.key)) grouped.set(point.key, []);
        grouped.get(point.key).push(point);
      });

      var seriesList = Array.from(grouped.values()).map(function (series) {
        series.sort(function (a, b) { return a.x - b.x; });
        return series;
      }).filter(function (series) {
        return series.length > 1;
      });

      if (!seriesList.length) {
        renderMessage("Non ci sono almeno due punti temporali numerici per questa selezione. Prova una definizione occupazionale, un indicatore o un intervallo temporale diverso.");
        return;
      }

      var traces = seriesList.map(function (series, index) {
        return {
          type: "scatter",
          mode: "lines+markers",
          name: series[0].label,
          x: series.map(function (point) { return point.x; }),
          y: series.map(function (point) { return point.value; }),
          marker: { size: 7, color: colors[index % colors.length] },
          line: { width: 2, color: colors[index % colors.length] },
          customdata: series.map(function (point) { return [point.label, point.graduates]; }),
          hovertemplate: "<b>%{customdata[0]}</b><br>" + xTitle(filters) + ": %{x}<br>" + metricLabel(filters.metric) + ": %{y:.1f}" + metricSuffix(filters.metric) + "<br>Laureati: %{customdata[1]:,.0f}<extra></extra>"
        };
      });

      clearMessage();
      var layout = {
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: cssColor("--text", "#f5f2ed"), family: "system-ui, -apple-system, Segoe UI, sans-serif", size: 14 },
        margin: { l: 76, r: 250, t: 14, b: 76 },
        xaxis: { title: { text: xTitle(filters) }, gridcolor: cssColor("--line", "#303030"), fixedrange: true, dtick: 1 },
        yaxis: { title: { text: metricLabel(filters.metric) }, gridcolor: cssColor("--line", "#303030"), fixedrange: true, ticksuffix: filters.metric === "net_monthly_salary" ? "" : "%" },
        legend: { orientation: "v", x: 1.02, y: 1, xanchor: "left" },
        dragmode: false
      };
      window.Plotly.react("timeSeriesChart", traces, layout, { responsive: true, displayModeBar: false, scrollZoom: false, doubleClick: false });
    } finally {
      window.setTimeout(function () { rendering = false; }, 0);
    }
  }

  function patchPlotly() {
    if (patched || !window.Plotly || !window.Plotly.react) return;
    patched = true;
    var originalReact = window.Plotly.react;
    window.Plotly.react = function (gd, data, layout, config) {
      var chartId = typeof gd === "string" ? gd : gd && gd.id;
      if (chartId === "timeSeriesChart" && !rendering) {
        window.setTimeout(render, 0);
      }
      return originalReact.call(window.Plotly, gd, data, layout, config);
    };
  }

  function bind() {
    patchPlotly();
    render();
    window.setTimeout(render, 300);
    window.setTimeout(render, 900);
    ["timeMode", "timeStartYear", "timeEndYear", "timeYearsAfter", "timeCohort", "timeDefinition", "timeUniversity", "timeGroup", "timeCourse", "timePointDimension", "timeMetric", "resetTimeFilters"].forEach(function (id) {
      var element = byId(id);
      if (!element) return;
      element.addEventListener(id === "resetTimeFilters" ? "click" : "change", function () {
        window.setTimeout(render, 0);
        window.setTimeout(render, 250);
      });
    });
  }

  function wait(attempt) {
    patchPlotly();
    if (byId("timeSeriesChart") && byId("timeMetric") && records.length) {
      bind();
      return;
    }
    if (attempt > 100) return;
    window.setTimeout(function () { wait(attempt + 1); }, 100);
  }

  function init() {
    if (location.pathname.indexOf("/dashboard/almalaurea/") < 0) return;
    var loader = window.AlmaLaureaData && window.AlmaLaureaData.timeseries ?
      window.AlmaLaureaData.timeseries(true) :
      fetch(DATA_URL).then(function (response) { return response.json(); });
    loader.then(function (payload) {
      records = (payload.records || []).map(normalize);
      wait(0);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
