(function () {
  var cleaning = false;

  function isArticle() {
    return location.pathname.indexOf("/articoli/occupazione-salari-laureati-almalaurea") >= 0;
  }

  function isArticleScatter(chart) {
    if (!chart || !chart.id || chart.id.indexOf("articleStaticChart") !== 0) return false;
    var title = chart.layout && chart.layout.xaxis && chart.layout.xaxis.title && chart.layout.xaxis.title.text;
    return title === "Retribuzione mensile netta";
  }

  function readable(value, fallback) {
    if (value === "*" || value === null || value === undefined || value === "") return fallback;
    return value;
  }

  function cleanChart(chart) {
    if (!window.Plotly || cleaning || !isArticleScatter(chart) || !Array.isArray(chart.data)) return;
    var changed = false;
    chart.data.forEach(function (trace) {
      if (!trace || trace.type !== "scatter") return;
      if (trace.mode !== "markers") {
        trace.mode = "markers";
        changed = true;
      }
      if (trace.text && trace.text.length) {
        trace.text = [];
        changed = true;
      }
      if (trace.textposition) {
        delete trace.textposition;
        changed = true;
      }
      if (Array.isArray(trace.customdata)) {
        trace.customdata.forEach(function (row) {
          if (!Array.isArray(row)) return;
          var cleanGroup = readable(row[1], "Tutti i gruppi");
          var cleanCourse = readable(row[2], "Tutti i tipi di corso");
          if (row[1] !== cleanGroup) {
            row[1] = cleanGroup;
            changed = true;
          }
          if (row[2] !== cleanCourse) {
            row[2] = cleanCourse;
            changed = true;
          }
        });
      }
      var template = "<b>%{customdata[0]}</b><br>" +
        "Gruppo: %{customdata[1]}<br>" +
        "Tipo corso: %{customdata[2]}<br>" +
        "Retribuzione media: %{x:.0f} euro<br>" +
        "Occupazione: %{y:.1f}%<br>" +
        "Laureati: %{customdata[3]:,.0f}<extra></extra>";
      if (trace.hovertemplate !== template) {
        trace.hovertemplate = template;
        changed = true;
      }
    });
    if (!changed) return;
    cleaning = true;
    window.Plotly.react(chart.id, chart.data, chart.layout, {
      responsive: true,
      displayModeBar: false,
      scrollZoom: false,
      doubleClick: false
    }).finally(function () {
      cleaning = false;
    });
  }

  function cleanAll() {
    if (!isArticle()) return;
    document.querySelectorAll(".article-static-chart").forEach(cleanChart);
  }

  function patchPlotly() {
    if (!window.Plotly || !window.Plotly.react || window.Plotly.__almArticleScatterLabelFix) return;
    window.Plotly.__almArticleScatterLabelFix = true;
    var originalReact = window.Plotly.react;
    window.Plotly.react = function (gd, data, layout, config) {
      var result = originalReact.call(window.Plotly, gd, data, layout, config);
      window.setTimeout(cleanAll, 0);
      window.setTimeout(cleanAll, 250);
      return result;
    };
  }

  function init() {
    if (!isArticle()) return;
    patchPlotly();
    cleanAll();
    window.setTimeout(function () {
      patchPlotly();
      cleanAll();
    }, 500);
    window.setTimeout(cleanAll, 1500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
