(function () {
  var patched = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function toNumber(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function validPositive(value) {
    var number = toNumber(value);
    return Number.isFinite(number) && number > 0;
  }

  function arrayItem(value, index) {
    return Array.isArray(value) ? value[index] : value;
  }

  function filterArray(value, keep) {
    return Array.isArray(value) ? keep.map(function (index) { return value[index]; }) : value;
  }

  function cleanBoxTrace(trace) {
    if (!trace || trace.type !== "box" || !Array.isArray(trace.y)) return trace;
    var keep = [];
    trace.y.forEach(function (value, index) {
      if (validPositive(value)) keep.push(index);
    });
    if (keep.length === trace.y.length) return trace;
    return Object.assign({}, trace, {
      y: keep.map(function (index) { return trace.y[index]; }),
      x: filterArray(trace.x, keep),
      text: filterArray(trace.text, keep),
      customdata: filterArray(trace.customdata, keep),
      marker: Object.assign({}, trace.marker || {}, {
        size: Array.isArray(trace.marker && trace.marker.size) ? keep.map(function (index) { return trace.marker.size[index]; }) : trace.marker && trace.marker.size,
        color: Array.isArray(trace.marker && trace.marker.color) ? keep.map(function (index) { return trace.marker.color[index]; }) : trace.marker && trace.marker.color
      })
    });
  }

  function cleanScatterTrace(trace) {
    if (!trace || trace.type !== "scatter" || !Array.isArray(trace.x) || !Array.isArray(trace.y)) return trace;
    var keep = [];
    trace.x.forEach(function (_, index) {
      if (validPositive(arrayItem(trace.x, index)) && validPositive(arrayItem(trace.y, index))) keep.push(index);
    });
    if (keep.length === trace.x.length) return trace;
    return Object.assign({}, trace, {
      x: keep.map(function (index) { return trace.x[index]; }),
      y: keep.map(function (index) { return trace.y[index]; }),
      text: filterArray(trace.text, keep),
      customdata: filterArray(trace.customdata, keep),
      marker: Object.assign({}, trace.marker || {}, {
        size: Array.isArray(trace.marker && trace.marker.size) ? keep.map(function (index) { return trace.marker.size[index]; }) : trace.marker && trace.marker.size,
        color: Array.isArray(trace.marker && trace.marker.color) ? keep.map(function (index) { return trace.marker.color[index]; }) : trace.marker && trace.marker.color
      })
    });
  }

  function cleanData(data, chartId) {
    if (!Array.isArray(data)) return data;
    if (chartId === "boxChart") {
      return data.map(cleanBoxTrace).filter(function (trace) {
        return !trace || !Array.isArray(trace.y) || trace.y.length > 0;
      });
    }
    if (chartId === "scatterChart") {
      return data.map(cleanScatterTrace).filter(function (trace) {
        return !trace || !Array.isArray(trace.x) || trace.x.length > 0;
      });
    }
    return data;
  }

  function cleanChart(chartId) {
    var chart = byId(chartId);
    if (!chart || !window.Plotly || !Array.isArray(chart.data)) return;
    var cleaned = cleanData(chart.data, chartId);
    if (cleaned === chart.data) return;
    try {
      window.Plotly.react(chartId, cleaned, chart.layout, {
        responsive: true,
        displayModeBar: false,
        scrollZoom: false,
        doubleClick: false
      });
    } catch (error) {}
  }

  function cleanAll() {
    cleanChart("boxChart");
    cleanChart("scatterChart");
  }

  function patchPlotly() {
    if (patched || !window.Plotly || !window.Plotly.react) return;
    patched = true;
    var originalReact = window.Plotly.react;
    window.Plotly.react = function (gd, data, layout, config) {
      var chartId = typeof gd === "string" ? gd : gd && gd.id;
      data = cleanData(data, chartId);
      var result = originalReact.call(window.Plotly, gd, data, layout, config);
      if (result && typeof result.then === "function") {
        result.then(function () { window.setTimeout(cleanAll, 0); });
      } else {
        window.setTimeout(cleanAll, 0);
      }
      return result;
    };
  }

  function bind() {
    patchPlotly();
    cleanAll();
    window.setTimeout(cleanAll, 300);
    window.setTimeout(cleanAll, 900);
    window.setTimeout(cleanAll, 1800);

    [
      "boxSurveyYear", "boxYearsAfter", "boxGraduationYear", "boxDefinition", "boxUniversity",
      "boxGroup", "boxCourse", "boxSplitDimension", "scatterSurveyYear", "scatterYearsAfter",
      "scatterGraduationYear", "scatterDefinition", "scatterUniversity", "scatterGroup",
      "scatterCourse", "scatterDegree", "scatterPointDimension", "resetBoxFilters", "resetScatterFilters"
    ].forEach(function (id) {
      var element = byId(id);
      if (!element) return;
      element.addEventListener(id.indexOf("reset") === 0 ? "click" : "change", function () {
        window.setTimeout(cleanAll, 0);
        window.setTimeout(cleanAll, 250);
        window.setTimeout(cleanAll, 700);
      });
    });
  }

  function wait(attempt) {
    patchPlotly();
    if (byId("boxChart") || byId("scatterChart")) {
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
