(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function selectLabel(id) {
    var select = byId(id);
    if (!select || !select.options.length) return "";
    return select.options[select.selectedIndex].textContent.trim();
  }

  function selectValue(id) {
    var select = byId(id);
    return select ? select.value : "";
  }

  function sourceText() {
    var title = byId("sourceTitle");
    var text = title && title.textContent ? title.textContent.replace(/^Fonte:\s*/i, "Fonte: ") : "Fonte: AlmaLaurea";
    return text + ". Elaborazione: Nazareno Lecis.";
  }

  function shortFilter(label, value) {
    if (!value) return "";
    return label + " " + value;
  }

  function joinParts(parts) {
    return parts.filter(Boolean).join("; ") + ".";
  }

  function metricLabel(value) {
    if (value === "employment_rate") return "tasso di occupazione";
    if (value === "net_monthly_salary") return "retribuzione mensile netta";
    if (value === "second_level_enrollment_rate") return "iscrizione alla magistrale";
    return "indicatore selezionato";
  }

  function ensureStyle() {
    if (byId("almChartContextStyle")) return;
    var style = document.createElement("style");
    style.id = "almChartContextStyle";
    style.textContent = ".chart-context-note{margin:0 0 14px;padding:12px 14px;border-left:3px solid var(--orange);background:color-mix(in srgb,var(--orange) 9%,transparent);color:var(--muted);line-height:1.45}.chart-context-note strong{display:block;color:var(--text);font-size:.98rem}.chart-context-note p{margin:6px 0 0;color:var(--muted);font-size:.94rem}.chart-context-note small{display:block;margin-top:6px;color:var(--muted);font-size:.86rem}.chart-context-note .chart-source{color:var(--orange);font-weight:750}";
    document.head.appendChild(style);
  }

  function ensureNote(chartId) {
    var chart = byId(chartId);
    if (!chart) return null;
    var panel = chart.closest(".chart-panel");
    if (!panel) return null;
    var note = panel.querySelector(".chart-context-note");
    if (note) return note;
    note = document.createElement("div");
    note.className = "chart-context-note";
    note.innerHTML = "<strong></strong><p></p><small class=\"chart-source\"></small>";
    var title = panel.querySelector(".panel-title");
    if (title) {
      title.insertAdjacentElement("afterend", note);
    } else {
      panel.insertAdjacentElement("afterbegin", note);
    }
    return note;
  }

  function setPanelTitle(chartId, title, subtitle) {
    var chart = byId(chartId);
    if (!chart) return;
    var panel = chart.closest(".chart-panel");
    if (!panel) return;
    var h2 = panel.querySelector(".panel-title h2");
    var span = panel.querySelector(".panel-title span");
    if (h2) h2.textContent = title;
    if (span) span.textContent = subtitle;
  }

  function updateScatterContext() {
    var dimension = selectLabel("scatterPointDimension") || "punti selezionati";
    var title = "Occupazione e retribuzione per " + dimension.toLowerCase();
    setPanelTitle("scatterChart", title, "Dimensione bolla: numero di laureati");
    var note = ensureNote("scatterChart");
    if (!note) return;
    note.querySelector("strong").textContent = title;
    note.querySelector("p").textContent = joinParts([
      shortFilter("Indagine", selectLabel("scatterSurveyYear")),
      shortFilter("coorte", selectLabel("scatterGraduationYear")),
      shortFilter("distanza", selectLabel("scatterYearsAfter")),
      shortFilter("occupazione", selectLabel("scatterDefinition")),
      shortFilter("ateneo", selectLabel("scatterUniversity")),
      shortFilter("gruppo", selectLabel("scatterGroup")),
      shortFilter("tipo corso", selectLabel("scatterCourse")),
      shortFilter("classe", selectLabel("scatterDegree"))
    ]);
    note.querySelector("small").textContent = sourceText();
  }

  function updateBoxContext() {
    var split = selectLabel("boxSplitDimension") || "suddivisione selezionata";
    var title = "Distribuzione della retribuzione per " + split.toLowerCase();
    setPanelTitle("boxChart", title, "Punti: atenei disponibili nel perimetro selezionato");
    var note = ensureNote("boxChart");
    if (!note) return;
    note.querySelector("strong").textContent = title;
    note.querySelector("p").textContent = joinParts([
      shortFilter("Indagine", selectLabel("boxSurveyYear")),
      shortFilter("coorte", selectLabel("boxGraduationYear")),
      shortFilter("distanza", selectLabel("boxYearsAfter")),
      shortFilter("occupazione", selectLabel("boxDefinition")),
      shortFilter("ateneo", selectLabel("boxUniversity")),
      shortFilter("gruppo", selectLabel("boxGroup")),
      shortFilter("tipo corso", selectLabel("boxCourse"))
    ]);
    note.querySelector("small").textContent = sourceText();
  }

  function updateTimeContext() {
    var mode = selectValue("timeMode");
    var metric = metricLabel(selectValue("timeMetric"));
    var title = mode === "cohort_path" ?
      "Percorso della stessa coorte — " + metric :
      "Trend a distanza fissa — " + metric;
    var subtitle = mode === "cohort_path" ?
      "Asse orizzontale: anni dalla laurea" :
      "Asse orizzontale: anno di indagine";
    setPanelTitle("timeSeriesChart", title, subtitle);
    var note = ensureNote("timeSeriesChart");
    if (!note) return;
    note.querySelector("strong").textContent = title;
    var parts = mode === "cohort_path" ? [
      "Lettura: stessa coorte, orizzonti diversi",
      shortFilter("coorte", selectLabel("timeCohort")),
      shortFilter("occupazione", selectLabel("timeDefinition")),
      shortFilter("serie", selectLabel("timePointDimension")),
      shortFilter("ateneo", selectLabel("timeUniversity")),
      shortFilter("gruppo", selectLabel("timeGroup")),
      shortFilter("tipo corso", selectLabel("timeCourse"))
    ] : [
      "Lettura: stessa distanza dalla laurea, coorti diverse",
      shortFilter("anni", selectLabel("timeStartYear") + "-" + selectLabel("timeEndYear")),
      shortFilter("distanza", selectLabel("timeYearsAfter")),
      shortFilter("occupazione", selectLabel("timeDefinition")),
      shortFilter("serie", selectLabel("timePointDimension")),
      shortFilter("ateneo", selectLabel("timeUniversity")),
      shortFilter("gruppo", selectLabel("timeGroup")),
      shortFilter("tipo corso", selectLabel("timeCourse"))
    ];
    note.querySelector("p").textContent = joinParts(parts);
    note.querySelector("small").textContent = sourceText();
  }

  function updateAll() {
    ensureStyle();
    updateScatterContext();
    updateBoxContext();
    updateTimeContext();
  }

  function bind() {
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
        window.setTimeout(updateAll, 0);
        window.setTimeout(updateAll, 250);
      });
    });
    updateAll();
    window.setTimeout(updateAll, 500);
  }

  function waitForControls(attempt) {
    if (byId("scatterSurveyYear") && byId("timeMetric") && byId("scatterSurveyYear").options.length) {
      bind();
      return;
    }
    if (attempt > 80) return;
    window.setTimeout(function () { waitForControls(attempt + 1); }, 100);
  }

  function init() {
    if (location.pathname.indexOf("/dashboard/almalaurea/") < 0) return;
    waitForControls(0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
