(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function ensureStyle() {
    if (byId("almFilterPlacementStyle")) return;
    var style = document.createElement("style");
    style.id = "almFilterPlacementStyle";
    style.textContent = ".chart-filter-panel.is-adjacent-to-chart{margin:18px 0 14px}.chart-filter-panel.is-adjacent-to-chart .filter-intro h3::after{content:' del grafico';font-weight:inherit}.filter-anchor-note{margin:0 0 10px;color:var(--muted);font-size:.92rem;line-height:1.45}@media(max-width:760px){.chart-filter-panel.is-adjacent-to-chart{margin:14px 0 12px}}";
    document.head.appendChild(style);
  }

  function addNote(filter, text) {
    if (filter.querySelector(".filter-anchor-note")) return;
    var note = document.createElement("p");
    note.className = "filter-anchor-note";
    note.textContent = text;
    var intro = filter.querySelector(".filter-intro");
    if (intro) {
      intro.insertAdjacentElement("afterend", note);
    } else {
      filter.insertAdjacentElement("afterbegin", note);
    }
  }

  function moveFilter(sectionId, filterLabel, chartId, noteText) {
    var section = byId(sectionId);
    var chart = byId(chartId);
    if (!section || !chart) return false;
    var filter = section.querySelector("details[aria-label='" + filterLabel + "']");
    var chartPanel = chart.closest(".chart-panel");
    if (!filter || !chartPanel) return false;
    filter.classList.add("is-adjacent-to-chart");
    addNote(filter, noteText);
    if (filter.nextElementSibling !== chartPanel) {
      chartPanel.insertAdjacentElement("beforebegin", filter);
    }
    return true;
  }

  function moveAll() {
    ensureStyle();
    moveFilter(
      "scatterSection",
      "Filtri scatterplot",
      "scatterChart",
      "Questi filtri modificano direttamente lo scatterplot subito sotto. Gli indicatori sopra riassumono la selezione corrente."
    );
    moveFilter(
      "boxSection",
      "Filtri boxplot",
      "boxChart",
      "Questi filtri modificano direttamente il boxplot subito sotto."
    );
    moveFilter(
      "timeSection",
      "Filtri serie storica",
      "timeSeriesChart",
      "Questi filtri modificano direttamente la serie storica subito sotto."
    );
  }

  function wait(attempt) {
    if (byId("scatterChart") && byId("boxChart") && byId("timeSeriesChart")) {
      moveAll();
      window.setTimeout(moveAll, 300);
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
