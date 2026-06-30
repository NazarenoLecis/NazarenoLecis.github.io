(function () {
  var chartIds = ["scatterChart", "boxChart", "timeSeriesChart"];

  function byId(id) {
    return document.getElementById(id);
  }

  function ensureStyle() {
    if (byId("almPlotResetStyle")) return;
    var style = document.createElement("style");
    style.id = "almPlotResetStyle";
    style.textContent = ".plot-reset-row{display:flex;justify-content:flex-end;gap:10px;margin:0 0 12px}.plot-reset-button{min-height:38px;padding:0 12px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--text);font:inherit;font-weight:800;cursor:pointer}.plot-reset-button:hover{border-color:var(--orange);color:var(--orange)}.embed-mode .plot-reset-row{justify-content:flex-start;margin:8px 0 12px}@media(max-width:760px){.plot-reset-row{justify-content:stretch}.plot-reset-button{width:100%}}";
    document.head.appendChild(style);
  }

  function resetChart(chartId) {
    var chart = byId(chartId);
    if (!chart || !window.Plotly) return;
    window.Plotly.relayout(chart, {
      "xaxis.autorange": true,
      "yaxis.autorange": true,
      "xaxis2.autorange": true,
      "yaxis2.autorange": true,
      "xaxis3.autorange": true,
      "yaxis3.autorange": true
    });
  }

  function ensureButton(chartId) {
    var chart = byId(chartId);
    if (!chart) return;
    var panel = chart.closest(".chart-panel");
    if (!panel) return;
    if (panel.querySelector("[data-reset-chart='" + chartId + "']")) return;

    var row = document.createElement("div");
    row.className = "plot-reset-row";
    var button = document.createElement("button");
    button.type = "button";
    button.className = "plot-reset-button";
    button.dataset.resetChart = chartId;
    button.textContent = "Reset visuale";
    button.addEventListener("click", function () {
      resetChart(chartId);
    });
    row.appendChild(button);

    var note = panel.querySelector(".chart-context-note");
    var title = panel.querySelector(".panel-title");
    if (note) {
      note.insertAdjacentElement("afterend", row);
    } else if (title) {
      title.insertAdjacentElement("afterend", row);
    } else {
      chart.insertAdjacentElement("beforebegin", row);
    }
  }

  function ensureAll() {
    ensureStyle();
    chartIds.forEach(ensureButton);
  }

  function bind() {
    ensureAll();
    window.setTimeout(ensureAll, 300);
    window.setTimeout(ensureAll, 900);
    document.addEventListener("plotly_relayout", function () {
      window.setTimeout(ensureAll, 0);
    });
  }

  function waitForCharts(attempt) {
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
