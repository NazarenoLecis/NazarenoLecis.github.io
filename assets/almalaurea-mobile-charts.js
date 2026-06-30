(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function onAlmaPage() {
    return location.pathname.indexOf("/dashboard/almalaurea/") >= 0 ||
      location.pathname.indexOf("/articoli/occupazione-salari-laureati-almalaurea") >= 0;
  }

  function ensureStyle() {
    if (byId("almMobileChartStyle")) return;
    var style = document.createElement("style");
    style.id = "almMobileChartStyle";
    style.textContent = "@media(max-width:760px){.alm-dashboard .chart-panel{overflow-x:auto;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;margin-left:-12px;margin-right:-12px;padding-left:12px;padding-right:12px}.alm-dashboard .chart,.alm-dashboard .main-chart .chart,.embed-mode .chart,.embed-mode .main-chart .chart{width:880px!important;min-width:880px!important;min-height:520px}.chart-mobile-note{display:block;margin:0 0 12px;padding:10px 12px;border:1px dashed var(--line);border-radius:8px;background:var(--panel);color:var(--muted);font-size:.9rem;line-height:1.45}.chart-mobile-note a{color:var(--orange);font-weight:800}.chart-mobile-note strong{color:var(--text)}.article .chart.dashboard-live{overflow-x:auto;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}.article .chart.dashboard-live iframe{width:880px!important;min-width:880px!important;height:640px}.article .chart.dashboard-live figcaption{min-width:880px}.article .chart.dashboard-live .chart-mobile-note{min-width:0;margin:12px 18px 0}.embed-mode .chart-mobile-note{margin:10px 16px 12px}}@media(min-width:761px){.chart-mobile-note{display:none}}";
    document.head.appendChild(style);
  }

  function createNote(text, linkHref) {
    var note = document.createElement("div");
    note.className = "chart-mobile-note";
    note.innerHTML = "<strong>Grafico largo.</strong> " + text;
    if (linkHref) {
      var link = document.createElement("a");
      link.href = linkHref;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Apri in pagina intera";
      note.appendChild(document.createTextNode(" "));
      note.appendChild(link);
    }
    return note;
  }

  function addDashboardNotes() {
    ["scatterChart", "boxChart", "timeSeriesChart"].forEach(function (id) {
      var chart = byId(id);
      if (!chart) return;
      var panel = chart.closest(".chart-panel");
      if (!panel || panel.querySelector(".chart-mobile-note")) return;
      var note = createNote("Su telefono mantiene una larghezza minima: scorri orizzontalmente per vedere asse, punti e legenda senza comprimere il grafico.");
      var resetRow = panel.querySelector(".plot-reset-row");
      var context = panel.querySelector(".chart-context-note");
      if (resetRow) {
        resetRow.insertAdjacentElement("afterend", note);
      } else if (context) {
        context.insertAdjacentElement("afterend", note);
      } else {
        chart.insertAdjacentElement("beforebegin", note);
      }
    });
  }

  function addArticleNotes() {
    document.querySelectorAll(".article .chart.dashboard-live").forEach(function (figure) {
      if (figure.querySelector(".chart-mobile-note")) return;
      var iframe = figure.querySelector("iframe");
      var href = iframe ? iframe.src : "";
      var note = createNote("Su telefono scorri orizzontalmente. Il grafico non viene schiacciato.", href);
      var context = figure.querySelector(".chart-context");
      if (context) {
        context.insertAdjacentElement("afterend", note);
      } else if (iframe) {
        iframe.insertAdjacentElement("beforebegin", note);
      } else {
        figure.insertAdjacentElement("afterbegin", note);
      }
    });
  }

  function disableMobileDrag() {
    if (!window.matchMedia || !window.matchMedia("(max-width:760px)").matches) return;
    if (!window.Plotly) return;
    ["scatterChart", "boxChart", "timeSeriesChart"].forEach(function (id) {
      var chart = byId(id);
      if (!chart || !chart.data) return;
      try {
        window.Plotly.relayout(chart, { dragmode: false });
      } catch (error) {}
    });
  }

  function refresh() {
    ensureStyle();
    addDashboardNotes();
    addArticleNotes();
    disableMobileDrag();
  }

  function init() {
    if (!onAlmaPage()) return;
    refresh();
    window.setTimeout(refresh, 300);
    window.setTimeout(refresh, 900);
    window.setTimeout(refresh, 1800);
    window.addEventListener("resize", function () {
      window.setTimeout(refresh, 100);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
