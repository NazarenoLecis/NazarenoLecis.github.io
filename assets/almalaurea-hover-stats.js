(function () {
  var patched = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function toNumber(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function formatEuroNumber(value) {
    var number = toNumber(value);
    return Number.isFinite(number) ? Math.round(number) : null;
  }

  function mean(values) {
    var valid = values.map(toNumber).filter(Number.isFinite);
    if (!valid.length) return null;
    return valid.reduce(function (sum, value) { return sum + value; }, 0) / valid.length;
  }

  function median(values) {
    var valid = values.map(toNumber).filter(Number.isFinite).sort(function (a, b) { return a - b; });
    if (!valid.length) return null;
    var mid = Math.floor(valid.length / 2);
    return valid.length % 2 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
  }

  function ensureCustomdata(trace, length) {
    if (!Array.isArray(trace.customdata)) {
      trace.customdata = Array.from({ length: length }, function () { return []; });
    }
    trace.customdata = trace.customdata.map(function (row) {
      return Array.isArray(row) ? row.slice() : [row];
    });
    return trace.customdata;
  }

  function appendStatsToCustomdata(trace, values) {
    var avg = formatEuroNumber(mean(values));
    var med = formatEuroNumber(median(values));
    var length = Array.isArray(values) ? values.length : 0;
    var customdata = ensureCustomdata(trace, length);
    var start = customdata.reduce(function (max, row) { return Math.max(max, row.length); }, 0);
    customdata.forEach(function (row) {
      while (row.length < start) row.push("");
      row.push(avg);
      row.push(med);
    });
    trace.customdata = customdata;
    return { meanIndex: start, medianIndex: start + 1, mean: avg, median: med };
  }

  function alreadyHasStats(template) {
    return template && template.indexOf("Mediana") >= 0;
  }

  function cleanSalaryLabel(template) {
    if (!template) return template;
    return template
      .replace(/Retribuzione: %\{x:\.0f\} euro/g, "Retribuzione media: %{x:.0f} euro")
      .replace(/Retribuzione: %\{y:\.0f\} euro/g, "Retribuzione media: %{y:.0f} euro");
  }

  function addScatterStats(trace) {
    if (!trace || trace.type !== "scatter" || !Array.isArray(trace.x)) return trace;
    trace.hovertemplate = cleanSalaryLabel(trace.hovertemplate);
    var values = trace.x.map(toNumber).filter(function (value) { return Number.isFinite(value) && value > 0; });
    if (values.length <= 1 || alreadyHasStats(trace.hovertemplate)) return trace;
    var stats = appendStatsToCustomdata(trace, trace.x);
    trace.hovertemplate = trace.hovertemplate.replace("<extra></extra>", "Media della serie: %{customdata[" + stats.meanIndex + "]:.0f} euro<br>Mediana della serie: %{customdata[" + stats.medianIndex + "]:.0f} euro<extra></extra>");
    return trace;
  }

  function addBoxStats(trace) {
    if (!trace || trace.type !== "box" || !Array.isArray(trace.y)) return trace;
    trace.hovertemplate = cleanSalaryLabel(trace.hovertemplate);
    var values = trace.y.map(toNumber).filter(function (value) { return Number.isFinite(value) && value > 0; });
    if (!values.length || alreadyHasStats(trace.hovertemplate)) return trace;
    var stats = appendStatsToCustomdata(trace, trace.y);
    trace.hovertemplate = trace.hovertemplate.replace("<extra></extra>", "Media della distribuzione: %{customdata[" + stats.meanIndex + "]:.0f} euro<br>Mediana della distribuzione: %{customdata[" + stats.medianIndex + "]:.0f} euro<extra></extra>");
    return trace;
  }

  function addStats(data, chartId) {
    if (!Array.isArray(data)) return data;
    if (chartId === "scatterChart") return data.map(addScatterStats);
    if (chartId === "boxChart") return data.map(addBoxStats);
    return data;
  }

  function updateChart(chartId) {
    var chart = byId(chartId);
    if (!chart || !window.Plotly || !Array.isArray(chart.data)) return;
    var data = addStats(chart.data, chartId);
    try {
      window.Plotly.react(chartId, data, chart.layout, {
        responsive: true,
        displayModeBar: false,
        scrollZoom: false,
        doubleClick: false
      });
    } catch (error) {}
  }

  function updateAll() {
    updateChart("scatterChart");
    updateChart("boxChart");
  }

  function patchPlotly() {
    if (patched || !window.Plotly || !window.Plotly.react) return;
    patched = true;
    var originalReact = window.Plotly.react;
    window.Plotly.react = function (gd, data, layout, config) {
      var chartId = typeof gd === "string" ? gd : gd && gd.id;
      data = addStats(data, chartId);
      var result = originalReact.call(window.Plotly, gd, data, layout, config);
      if (result && typeof result.then === "function") {
        result.then(function () { window.setTimeout(updateAll, 0); });
      } else {
        window.setTimeout(updateAll, 0);
      }
      return result;
    };
  }

  function bind() {
    patchPlotly();
    updateAll();
    window.setTimeout(updateAll, 300);
    window.setTimeout(updateAll, 900);
    [
      "scatterSurveyYear", "scatterYearsAfter", "scatterGraduationYear", "scatterDefinition",
      "scatterUniversity", "scatterGroup", "scatterCourse", "scatterDegree", "scatterPointDimension",
      "boxSurveyYear", "boxYearsAfter", "boxGraduationYear", "boxDefinition", "boxUniversity",
      "boxGroup", "boxCourse", "boxSplitDimension", "resetScatterFilters", "resetBoxFilters"
    ].forEach(function (id) {
      var element = byId(id);
      if (!element) return;
      element.addEventListener(id.indexOf("reset") === 0 ? "click" : "change", function () {
        window.setTimeout(updateAll, 0);
        window.setTimeout(updateAll, 250);
        window.setTimeout(updateAll, 700);
      });
    });
  }

  function wait(attempt) {
    patchPlotly();
    if (byId("scatterChart") || byId("boxChart")) {
      bind();
      return;
    }
    if (attempt > 80) return;
    window.setTimeout(function () { wait(attempt + 1); }, 100);
  }

  function init() {
    if (location.pathname.indexOf("/dashboard/almalaurea/") < 0) return;
    wait(0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
