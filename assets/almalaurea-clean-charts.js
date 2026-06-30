(function () {
  var patched = false;
  var positionCycle = [
    "top center", "bottom center", "top left", "top right",
    "bottom left", "bottom right", "middle left", "middle right"
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function removeSecondLevelMetric() {
    var select = byId("timeMetric");
    if (!select) return;
    var option = select.querySelector("option[value='second_level_enrollment_rate']");
    if (option) option.remove();
    if (select.value === "second_level_enrollment_rate") {
      select.value = "employment_rate";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function updateCourseLabels() {
    var scatterDegree = byId("scatterDegree");
    if (scatterDegree) {
      var label = scatterDegree.closest("label");
      if (label && label.querySelector("span")) label.querySelector("span").textContent = "Classe/corso";
    }
    var scatterPointDimension = byId("scatterPointDimension");
    if (scatterPointDimension) {
      Array.from(scatterPointDimension.options).forEach(function (option) {
        if (option.value === "degree_class") option.textContent = "Classi/corsi";
      });
    }
  }

  function hasOption(id, value) {
    var select = byId(id);
    if (!select) return false;
    return Array.from(select.options).some(function (option) { return option.value === value; });
  }

  function setSelect(id, value) {
    var select = byId(id);
    if (!select || !hasOption(id, value)) return false;
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function ensureClassCourseButton() {
    if (byId("showDegreeClassScatter")) return;
    var actions = document.querySelector("#scatterSection .filter-actions");
    if (!actions) return;

    var button = document.createElement("button");
    button.id = "showDegreeClassScatter";
    button.type = "button";
    button.className = "button compact";
    button.textContent = "Mostra classi/corsi";
    button.addEventListener("click", function () {
      setSelect("scatterDegree", "*");
      setSelect("scatterPointDimension", "degree_class");
      window.setTimeout(function () {
        var chart = byId("scatterChart");
        if (chart) chart.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    });
    actions.insertBefore(button, actions.firstChild);
  }

  function cleanTemplate(template) {
    if (!template) return template;
    return template
      .replace(/<br>Iscritti a magistrale: %\{customdata\[[0-9]+\]\}/g, "")
      .replace(/Iscritti a magistrale: %\{customdata\[[0-9]+\]\}<br>/g, "")
      .replace(/Iscritti a magistrale: %\{customdata\[[0-9]+\]\}/g, "");
  }

  function labelPositions(trace, offset) {
    var count = Array.isArray(trace.text) ? trace.text.length : 1;
    var positions = [];
    for (var i = 0; i < count; i += 1) {
      positions.push(positionCycle[(offset + i) % positionCycle.length]);
    }
    return count === 1 ? positions[0] : positions;
  }

  function cleanData(data, chartId) {
    if (!Array.isArray(data)) return data;
    var labelOffset = 0;
    data.forEach(function (trace, index) {
      if (!trace) return;
      if (trace.hovertemplate) trace.hovertemplate = cleanTemplate(trace.hovertemplate);
      if (chartId === "scatterChart" && trace.type === "scatter") {
        trace.textposition = labelPositions(trace, labelOffset + index);
        trace.textfont = Object.assign({}, trace.textfont || {}, { size: 11 });
        trace.cliponaxis = false;
        labelOffset += Array.isArray(trace.text) ? trace.text.length : 1;
      }
    });
    return data;
  }

  function cleanChart(chartId) {
    var chart = byId(chartId);
    if (!chart || !window.Plotly || !Array.isArray(chart.data)) return;
    cleanData(chart.data, chartId);
    try { window.Plotly.redraw(chart); } catch (error) {}
  }

  function patchPlotly() {
    if (patched || !window.Plotly || !window.Plotly.react) return;
    patched = true;
    var originalReact = window.Plotly.react;
    window.Plotly.react = function (gd, data, layout, config) {
      var chartId = typeof gd === "string" ? gd : gd && gd.id;
      cleanData(data, chartId);
      var result = originalReact.call(window.Plotly, gd, data, layout, config);
      if (result && typeof result.then === "function") {
        result.then(function () {
          window.setTimeout(function () { cleanChart(chartId); }, 0);
        });
      } else {
        window.setTimeout(function () { cleanChart(chartId); }, 0);
      }
      return result;
    };
  }

  function refresh() {
    removeSecondLevelMetric();
    updateCourseLabels();
    ensureClassCourseButton();
    patchPlotly();
    cleanChart("scatterChart");
    cleanChart("boxChart");
  }

  function bind() {
    refresh();
    window.setTimeout(refresh, 300);
    window.setTimeout(refresh, 900);
    [
      "scatterSurveyYear", "scatterYearsAfter", "scatterGraduationYear", "scatterDefinition",
      "scatterUniversity", "scatterGroup", "scatterCourse", "scatterDegree", "scatterPointDimension",
      "boxSurveyYear", "boxYearsAfter", "boxGraduationYear", "boxDefinition", "boxUniversity",
      "boxGroup", "boxCourse", "boxSplitDimension", "timeMetric", "resetScatterFilters", "resetBoxFilters", "resetTimeFilters"
    ].forEach(function (id) {
      var element = byId(id);
      if (!element) return;
      element.addEventListener(id.indexOf("reset") === 0 ? "click" : "change", function () {
        window.setTimeout(refresh, 0);
        window.setTimeout(refresh, 250);
        window.setTimeout(refresh, 700);
      });
    });
  }

  function wait(attempt) {
    patchPlotly();
    if (byId("scatterChart") || byId("timeMetric")) {
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
