(function () {
  var patched = false;
  var positionCycle = [
    "top center", "bottom center", "top left", "top right",
    "bottom left", "bottom right", "middle left", "middle right"
  ];
  var colorCycle = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
    "#4e79a7", "#f28e2b", "#59a14f", "#e15759", "#76b7b2",
    "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac"
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function toNumber(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function asText(value) {
    return value === null || value === undefined ? "" : String(value);
  }

  function escapeHtml(value) {
    return asText(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
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
      setSelect("scatterSurveyYear", "2025");
      setSelect("scatterYearsAfter", "1");
      setSelect("scatterGraduationYear", "2024");
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

  function arrayItem(value, index) {
    return Array.isArray(value) ? value[index] : value;
  }

  function genericLabel(value) {
    var text = asText(value).toLowerCase();
    if (!text) return true;
    return text === "laurea di primo livello" ||
      text === "laurea magistrale biennale" ||
      text === "laurea magistrale a ciclo unico" ||
      text === "atenei" ||
      text === "totale" ||
      text.indexOf("tutti ") === 0;
  }

  function makeUnique(label, seen) {
    var base = asText(label) || "Voce";
    var count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count ? base + " (" + (count + 1) + ")" : base;
  }

  function pointLabel(trace, index) {
    var candidates = [];
    if (Array.isArray(trace.customdata) && trace.customdata[index]) {
      candidates.push(trace.customdata[index][0]);
      candidates.push(trace.customdata[index][1]);
    }
    if (Array.isArray(trace.text)) candidates.push(trace.text[index]);
    candidates.push(trace.name);

    for (var i = 0; i < candidates.length; i += 1) {
      if (!genericLabel(candidates[i])) return asText(candidates[i]);
    }
    return asText(candidates[0] || candidates[1] || trace.name || "Voce");
  }

  function hasValidPoint(trace, index) {
    var x = toNumber(arrayItem(trace.x, index));
    var y = toNumber(arrayItem(trace.y, index));
    return Number.isFinite(x) && Number.isFinite(y) && x > 0 && y > 0;
  }

  function filterInvalidScatterPoints(data, chartId) {
    if (chartId !== "scatterChart") return data;
    return data.map(function (trace) {
      if (!trace || trace.type !== "scatter" || !Array.isArray(trace.x)) return trace;
      var keep = [];
      trace.x.forEach(function (_, index) {
        if (hasValidPoint(trace, index)) keep.push(index);
      });
      if (keep.length === trace.x.length) return trace;
      return Object.assign({}, trace, {
        x: keep.map(function (index) { return arrayItem(trace.x, index); }),
        y: keep.map(function (index) { return arrayItem(trace.y, index); }),
        text: Array.isArray(trace.text) ? keep.map(function (index) { return trace.text[index]; }) : trace.text,
        customdata: Array.isArray(trace.customdata) ? keep.map(function (index) { return trace.customdata[index]; }) : trace.customdata,
        marker: Object.assign({}, trace.marker || {}, {
          size: Array.isArray(trace.marker && trace.marker.size) ? keep.map(function (index) { return trace.marker.size[index]; }) : trace.marker && trace.marker.size
        })
      });
    }).filter(function (trace) {
      return !trace || !Array.isArray(trace.x) || trace.x.length > 0;
    });
  }

  function splitDegreeClassTraces(data, chartId) {
    var dimensionSelect = byId("scatterPointDimension");
    if (chartId !== "scatterChart" || !dimensionSelect || dimensionSelect.value !== "degree_class") return data;
    var split = [];
    var seen = new Map();
    data.forEach(function (trace) {
      if (!trace || trace.type !== "scatter" || !Array.isArray(trace.x)) return;
      trace.x.forEach(function (_, index) {
        if (!hasValidPoint(trace, index)) return;
        var label = makeUnique(pointLabel(trace, index), seen);
        var marker = Object.assign({}, trace.marker || {});
        marker.size = arrayItem(marker.size, index);
        marker.color = colorCycle[split.length % colorCycle.length];
        split.push(Object.assign({}, trace, {
          name: label,
          legendgroup: label,
          showlegend: true,
          x: [arrayItem(trace.x, index)],
          y: [arrayItem(trace.y, index)],
          text: [label],
          customdata: Array.isArray(trace.customdata) ? [trace.customdata[index]] : trace.customdata,
          marker: marker,
          textposition: positionCycle[split.length % positionCycle.length],
          hovertemplate: cleanTemplate(trace.hovertemplate),
          cliponaxis: false,
          _isDegreeClassLegendPoint: true
        }));
      });
    });
    return split.length ? split : data;
  }

  function cleanData(data, chartId) {
    if (!Array.isArray(data)) return data;
    data = filterInvalidScatterPoints(data, chartId);
    data = splitDegreeClassTraces(data, chartId);
    var labelOffset = 0;
    data.forEach(function (trace, index) {
      if (!trace) return;
      if (trace.hovertemplate) trace.hovertemplate = cleanTemplate(trace.hovertemplate);
      if (chartId === "scatterChart" && trace.type === "scatter") {
        trace.textposition = trace.textposition || labelPositions(trace, labelOffset + index);
        trace.textfont = Object.assign({}, trace.textfont || {}, { size: 11 });
        trace.cliponaxis = false;
        labelOffset += Array.isArray(trace.text) ? trace.text.length : 1;
      }
    });
    return data;
  }

  function updateExternalLegend(chartId, data) {
    var chart = byId(chartId);
    if (!chart) return;
    var panel = chart.closest(".chart-panel");
    if (!panel) return;
    var existing = panel.querySelector(".degree-class-point-legend");
    var dimensionSelect = byId("scatterPointDimension");
    if (chartId !== "scatterChart" || !dimensionSelect || dimensionSelect.value !== "degree_class") {
      if (existing) existing.remove();
      return;
    }
    if (!existing) {
      existing = document.createElement("div");
      existing.className = "degree-class-point-legend";
      panel.appendChild(existing);
    }
    var items = (data || []).filter(function (trace) { return trace && trace._isDegreeClassLegendPoint; });
    existing.innerHTML = "<h3>Legenda classi/corsi</h3><div>" + items.map(function (trace) {
      var color = trace.marker && trace.marker.color ? trace.marker.color : "currentColor";
      return "<span class=\"degree-class-legend-item\"><i style=\"background:" + color + "\"></i>" + escapeHtml(trace.name) + "</span>";
    }).join("") + "</div>";
  }

  function ensureStyle() {
    if (byId("degreeClassLegendStyle")) return;
    var style = document.createElement("style");
    style.id = "degreeClassLegendStyle";
    style.textContent = ".degree-class-point-legend{margin-top:12px;padding-top:12px;border-top:1px solid var(--line)}.degree-class-point-legend h3{margin:0 0 10px;font-size:1rem;letter-spacing:0}.degree-class-point-legend>div{display:flex;flex-wrap:wrap;gap:8px 12px}.degree-class-legend-item{display:inline-flex;align-items:center;gap:7px;color:var(--muted);font-size:.88rem;line-height:1.25}.degree-class-legend-item i{width:10px;height:10px;border-radius:999px;display:inline-block;flex:0 0 auto}@media(max-width:760px){.degree-class-point-legend>div{display:grid;grid-template-columns:1fr}.degree-class-point-legend{min-width:880px}}";
    document.head.appendChild(style);
  }

  function cleanChart(chartId) {
    var chart = byId(chartId);
    if (!chart || !window.Plotly || !Array.isArray(chart.data)) return;
    ensureStyle();
    var cleaned = cleanData(chart.data, chartId);
    try {
      if (cleaned !== chart.data) {
        window.Plotly.react(chartId, cleaned, chart.layout, { responsive: true, displayModeBar: false, scrollZoom: false, doubleClick: false });
      } else {
        window.Plotly.redraw(chart);
      }
      updateExternalLegend(chartId, cleaned);
    } catch (error) {}
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
        result.then(function () {
          updateExternalLegend(chartId, data);
          window.setTimeout(function () { cleanChart(chartId); }, 0);
        });
      } else {
        updateExternalLegend(chartId, data);
        window.setTimeout(function () { cleanChart(chartId); }, 0);
      }
      return result;
    };
  }

  function refresh() {
    removeSecondLevelMetric();
    updateCourseLabels();
    ensureClassCourseButton();
    ensureStyle();
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
