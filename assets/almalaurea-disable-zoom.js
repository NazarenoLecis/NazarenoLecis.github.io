(function () {
  var patched = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function isTouchDevice() {
    if (window.matchMedia) {
      var coarse = window.matchMedia("(pointer: coarse)");
      var hoverNone = window.matchMedia("(hover: none)");
      if ((coarse && coarse.matches) || (hoverNone && hoverNone.matches)) return true;
    }
    return window.innerWidth <= 768 || window.navigator.maxTouchPoints > 0;
  }

  function isDashboard() {
    return location.pathname.indexOf("/dashboard/") >= 0;
  }

  function ensureStyle() {
    if (byId("plotlyDisableZoomStyle")) return;
    var style = document.createElement("style");
    style.id = "plotlyDisableZoomStyle";
    style.textContent = ".js-plotly-plot,.js-plotly-plot .plotly,.js-plotly-plot .svg-container,.js-plotly-plot .main-svg,.js-plotly-plot .draglayer,.js-plotly-plot .nsewdrag{touch-action:pan-x pan-y!important}.js-plotly-plot .nsewdrag,.js-plotly-plot .drag{cursor:default!important}.js-plotly-plot .modebar{display:none!important}@media (pointer:coarse),(hover:none),(max-width:768px){.js-plotly-plot .draglayer,.js-plotly-plot .nsewdrag,.js-plotly-plot .drag{pointer-events:none!important;touch-action:pan-x pan-y!important}}";
    document.head.appendChild(style);
  }

  function chartIdsFromDom() {
    var ids = [];
    if (!document.body) return ids;
    document.body.querySelectorAll(".chart").forEach(function (element) {
      if (element.id && ids.indexOf(element.id) < 0) ids.push(element.id);
    });
    return ids;
  }

  function fixLayout(layout) {
    layout = layout || {};
    layout.dragmode = false;
    ["xaxis", "yaxis", "xaxis2", "yaxis2", "xaxis3", "yaxis3", "xaxis4", "yaxis4"].forEach(function (axis) {
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
    var originalNewPlot = window.Plotly.newPlot;
    window.Plotly.react = function (gd, data, layout, config) {
      return originalReact.call(window.Plotly, gd, data, fixLayout(layout), fixConfig(config));
    };
    if (originalNewPlot) {
      window.Plotly.newPlot = function (gd, data, layout, config) {
        return originalNewPlot.call(window.Plotly, gd, data, fixLayout(layout), fixConfig(config));
      };
    }
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
        "yaxis3.fixedrange": true,
        "xaxis4.fixedrange": true,
        "yaxis4.fixedrange": true
      });
    } catch (error) {}
  }

  function disableAll() {
    ensureStyle();
    patchPlotly();
    chartIdsFromDom().forEach(disableZoom);
  }

  function bind() {
    disableAll();
    window.setTimeout(disableAll, 100);
    window.setTimeout(disableAll, 300);
    window.setTimeout(disableAll, 900);
    window.setTimeout(disableAll, 1800);
  }

  function init() {
    if (!isDashboard() || !isTouchDevice()) return;
    if (chartIdsFromDom().length) {
      bind();
      return;
    }
    window.setTimeout(init, 200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
