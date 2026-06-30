(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function toNumber(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function numericValues(values) {
    return (values || []).map(toNumber).filter(Number.isFinite);
  }

  function isFlatTrace(trace) {
    if (!trace || trace.type !== "scatter") return false;
    var values = numericValues(trace.y);
    if (values.length < 3) return false;
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var axisTitle = (((trace._fullInput || {}).yaxis || "") + " " + JSON.stringify((trace._fullInput || {}).hovertemplate || "")).toLowerCase();
    var tolerance = axisTitle.indexOf("euro") >= 0 ? 1 : 0.05;
    return (max - min) <= tolerance;
  }

  function visibleScatterTraces(chart) {
    if (!chart || !Array.isArray(chart.data)) return [];
    return chart.data.filter(function (trace) {
      return trace && trace.type === "scatter" && trace.visible !== "legendonly" && Array.isArray(trace.y) && trace.y.length;
    });
  }

  function renderWarning(chart, traces) {
    if (!chart || chart.dataset.flatSeriesHidden === "1") return;
    chart.dataset.flatSeriesHidden = "1";
    try {
      if (window.Plotly) window.Plotly.purge(chart);
    } catch (error) {}
    chart.innerHTML = "<div class=\"empty-state\" style=\"padding:28px;line-height:1.55;max-width:760px\"><strong>Serie storica non mostrata.</strong><br>La base storica caricata produce valori perfettamente costanti per tutto il periodo selezionato. Questo non è credibile per una serie temporale degli esiti occupazionali e indica che il dataset storico va rigenerato prima di pubblicare il grafico.</div>";
    var panel = chart.closest(".chart-panel");
    if (panel) {
      var title = panel.querySelector(".panel-title h2");
      var subtitle = panel.querySelector(".panel-title span");
      if (title) title.textContent = "Serie storica da rigenerare";
      if (subtitle) subtitle.textContent = "Il grafico è nascosto perché la serie caricata è piatta";
    }
  }

  function checkChart() {
    var chart = byId("timeSeriesChart");
    if (!chart) return;
    var traces = visibleScatterTraces(chart);
    if (!traces.length) return;
    var flat = traces.filter(isFlatTrace);
    if (flat.length === traces.length) {
      renderWarning(chart, traces);
    }
  }

  function patchPlotly() {
    if (!window.Plotly || !window.Plotly.react || window.Plotly.__almFlatGuardPatched) return;
    window.Plotly.__almFlatGuardPatched = true;
    var originalReact = window.Plotly.react;
    window.Plotly.react = function (gd, data, layout, config) {
      var chartId = typeof gd === "string" ? gd : gd && gd.id;
      var result = originalReact.call(window.Plotly, gd, data, layout, config);
      if (chartId === "timeSeriesChart") {
        window.setTimeout(checkChart, 50);
        window.setTimeout(checkChart, 300);
      }
      return result;
    };
  }

  function bind() {
    patchPlotly();
    checkChart();
    window.setInterval(function () {
      patchPlotly();
      checkChart();
    }, 800);
  }

  function init() {
    if (location.pathname.indexOf("/dashboard/almalaurea/") < 0) return;
    bind();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
