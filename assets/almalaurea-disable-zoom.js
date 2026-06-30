(function () {
  var chartIds = ["scatterChart", "boxChart", "timeSeriesChart"];
  var patched = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function ensureStyle() {
    if (byId("almDisableZoomStyle")) return;
    var style = document.createElement("style");
    style.id = "almDisableZoomStyle";
    style.textContent = ".js-plotly-plot,.js-plotly-plot .plotly,.js-plotly-plot .svg-container,.js-plotly-plot .main-svg,.js-plotly-plot .draglayer,.js-plotly-plot .nsewdrag{touch-action:pan-x pan-y!important}.js-plotly-plot .nsewdrag,.js-plotly-plot .drag{cursor:default!important}.js-plotly-plot .modebar{display:none!important}";
    document.head.appendChild(style);
  }

  function fixLayout(layout) {
    layout = layout || {};
    layout.dragmode = false;
    ["xaxis", "yaxis", "xaxis2", "yaxis2", "xaxis3", "yaxis3"].forEach(function (axis) {
      layout[axis] = Object.assign({}, layout[axis] || {}, { fixedrange: true });
    });
    return layout;
  }

  function fixConfig(config) {
    return Object.assign({}, config || {}, {
      responsive: true,
      displayModeBar: false,
      scrollZoom: false,
      doubleClick: false,
      showTips: false,
      modeBarButtonsToRemove: [
        "zoom2d", "pan2d", "select2d", "lasso2d", "zoomIn2d", "zoomOut2d",
        "autoScale2d", "resetScale2d", "hoverClosestCartesian", "hoverCompareCartesian"
      ]
    });
  }

  function patchPlotly() {
    if (patched || !window.Plotly || !window.Plotly.react) return;
    patched = true;
    var originalReact = window.Plotly.react;
    window.Plotly.react = function (gd, data, layout, config) {
      var result = originalReact.call(window.Plotly, gd, data, fixLayout(layout), fixConfig(config));
      if (result && typeof result.then === "function") {
        result.then(function () { window.setTimeout(disableAll, 0); });
      } else {
        window.setTimeout(disableAll, 0);
      }
      return result;
    };
  }

  function disableZoom(chartId) {
    var chart = byId(chartId);
    if (!chart || !window.Plotly) return;
    try {
      window.Plotly.relayout(chart, {
        dragmode: false,
        "xaxis.fixedrange": true,
        "yaxis.fixedrange": true,
        "xaxis2.fixedrange": true,
        "yaxis2.fixedrange": true,
        "xaxis3.fixedrange": true,
        "yaxis3.fixedrange": true
      });
    } catch (error) {}
  }

  function disableAll() {
    ensureStyle();
    patchPlotly();
    chartIds.forEach(disableZoom);
  }

  function bind() {
    disableAll();
    window.setTimeout(disableAll, 100);
    window.setTimeout(disableAll, 300);
    window.setTimeout(disableAll, 900);
    window.setTimeout(disableAll, 1800);

    [
      "scatterSurveyYear", "scatterYearsAfter", "scatterGraduationYear", "scatterDefinition",
      "scatterUniversity", "scatterGroup", "scatterCourse", "scatterDegree", "scatterPointDimension",
      "boxSurveyYear", "boxYearsAfter", "boxGraduationYear", "boxDefinition", "boxUniversity",
      "boxGroup", "boxCourse", "boxSplitDimension", "timeMode", "timeStartYear", "timeEndYear",
      "timeYearsAfter", "timeCohort", "timeDefinition", "timeUniversity", "timeGroup", "timeCourse",
      "timePointDimension", "timeMetric", "resetScatterFilters", "resetBoxFilters", "resetTimeFilters"
    ].forEach(function (id) {
      var element = byId(id);
      if (!element) return;
      element.addEventListener(id.indexOf("reset") === 0 ? "click" : "change", function () {
        window.setTimeout(disableAll, 0);
        window.setTimeout(disableAll, 100);
        window.setTimeout(disableAll, 300);
        window.setTimeout(disableAll, 700);
      });
    });
  }

  function waitForCharts(attempt) {
    patchPlotly();
    if (chartIds.some(function (id) { return byId(id); })) {
      bind();
      return;
    }
    if (attempt > 80) return;
    window.setTimeout(function () { waitForCharts(attempt + 1); }, 100);
  }

  function init() {
    if (location.pathname.indexOf("/dashboard/almalaurea/") < 0) return;
    waitForCharts(0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
