(function () {
  "use strict";

  var DATA_URL = "https://data.nazarenolecis.com/ciclo-unico-caldo/dashboard_caldo.json";
  var PNRR_URL = "https://data.nazarenolecis.com/ciclo-unico-caldo/dashboard_caldo_pnrr_clima_regioni.json";

  var state = {
    data: null,
    pnrr: { records: [] },
    pnrrError: "",
    languageRefreshPending: false
  };

  var metrics = {
    quota_aria_condizionata_si: {
      label: "Quota scuole-edifici con A/C dichiarata",
      color: "warning",
      note: "Campo MIM CONDIZIONAMENTOVENTILAZIONE=SI, su tutti gli edifici compresi quelli NON DEFINITO."
    },
    quota_aria_condizionata_si_su_definiti: {
      label: "Quota A/C sui soli SI/NO",
      color: "warning",
      note: "Campo MIM CONDIZIONAMENTOVENTILAZIONE=SI, escludendo gli edifici NON DEFINITO dal denominatore."
    },
    quota_aria_condizionata_non_definito: {
      label: "Quota A/C non definita",
      color: "danger",
      note: "Edifici in cui il campo CONDIZIONAMENTOVENTILAZIONE e' NON DEFINITO o non compilato."
    },
    quota_mitigazione_media_alta: {
      label: "Quota con mitigazione termica media o alta",
      color: "good",
      note: "Proxy del repository basato su indicatori energetici e termici MIM."
    },
    quota_nessun_indicatore_termico: {
      label: "Quota senza indicatori termici MIM",
      color: "danger",
      note: "Righe senza segnali MIM di mitigazione termica tra quelli disponibili."
    },
    quota_rischio_caldo_alto: {
      label: "Quota in rischio caldo alto",
      color: "danger",
      note: "Indice di scenario basato su posizione, fragilita' termica e studenti esposti."
    },
    quota_rischio_caldo_alto_medio: {
      label: "Quota in rischio caldo medio/alto",
      color: "warning",
      note: "Perimetro ampio di priorita' potenziale prima di estendere il calendario nei mesi caldi."
    }
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function t(value) {
    return window.SiteLanguage && window.SiteLanguage.t ? window.SiteLanguage.t(value) : value;
  }

  function locale() {
    return window.SiteLanguage && window.SiteLanguage.get && window.SiteLanguage.get() === "en" ? "en-US" : "it-IT";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString(locale(), { maximumFractionDigits: 0 });
  }

  function formatPercent(value) {
    return Number(value || 0).toLocaleString(locale(), { maximumFractionDigits: 1 }) + "%";
  }

  function formatRate(value) {
    var number = Number(value || 0);
    var decimals = Math.abs(number) > 0 && Math.abs(number) < 1 ? 2 : 1;
    return number.toLocaleString(locale(), { maximumFractionDigits: decimals }) + "%";
  }

  function formatCurrency(value) {
    var number = Number(value || 0);
    if (Math.abs(number) >= 1000000000) {
      return (number / 1000000000).toLocaleString(locale(), { maximumFractionDigits: 1 }) + " " + t("mld euro");
    }
    if (Math.abs(number) >= 1000000) {
      return (number / 1000000).toLocaleString(locale(), { maximumFractionDigits: 1 }) + " " + t("mln euro");
    }
    return number.toLocaleString(locale(), { maximumFractionDigits: 0 }) + " " + t("euro");
  }

  function fetchJson(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    });
  }

  function gradeList() {
    if (state.data && state.data.metadata && Array.isArray(state.data.metadata.grades)) {
      return state.data.metadata.grades;
    }
    var seen = new Set();
    return ((state.data && state.data.records) || []).map(function (row) {
      return row.grado;
    }).filter(function (grade) {
      if (!grade || seen.has(grade)) return false;
      seen.add(grade);
      return true;
    });
  }

  function rowsForGrade(grade) {
    return ((state.data && state.data.records) || []).filter(function (row) {
      return row.grado === grade;
    });
  }

  function totalsForGrade(grade) {
    return rowsForGrade(grade).reduce(function (acc, row) {
      Object.keys(acc).forEach(function (key) {
        acc[key] += Number(row[key] || 0);
      });
      return acc;
    }, {
      righe_mim: 0,
      aria_condizionata_si: 0,
      aria_condizionata_no: 0,
      aria_condizionata_non_definito: 0,
      mitigazione_alta: 0,
      mitigazione_media: 0,
      nessun_indicatore_termico: 0,
      rischio_caldo_alto: 0
    });
  }

  function updateKpis(grade) {
    var totals = totalsForGrade(grade);
    var denominator = totals.righe_mim || 1;
    var metadata = state.data && state.data.metadata ? state.data.metadata : {};
    byId("kpiSites").textContent = formatNumber(totals.righe_mim);
    byId("kpiSourceBuildings").textContent = formatNumber(metadata.source_unique_buildings);
    byId("kpiAcData").textContent = formatPercent(totals.aria_condizionata_si / denominator * 100);
    byId("kpiMitigation").textContent = formatPercent((totals.mitigazione_alta + totals.mitigazione_media) / denominator * 100);
    byId("kpiRisk").textContent = formatPercent(totals.rischio_caldo_alto / denominator * 100);
  }

  function drawChart(rows, metricId) {
    var svg = byId("barChart");
    var metric = metrics[metricId] || metrics.quota_aria_condizionata_si;
    var width = Math.max(980, svg.parentElement.clientWidth || 980);
    var height = 520;
    var margin = { top: 28, right: 16, bottom: 112, left: 54 };
    var chartWidth = width - margin.left - margin.right;
    var chartHeight = height - margin.top - margin.bottom;
    var sorted = rows.slice().sort(function (a, b) {
      return Number(b[metricId]) - Number(a[metricId]) || a.regione.localeCompare(b.regione, locale().slice(0, 2));
    });
    var maxValue = Math.max.apply(null, sorted.map(function (row) {
      return Number(row[metricId] || 0);
    }).concat([1]));
    var axisMax = Math.max(100, maxValue);
    var barGap = 7;
    var barWidth = Math.max(20, (chartWidth - barGap * (sorted.length - 1)) / sorted.length);
    var html = "";

    [0, 25, 50, 75, 100].forEach(function (tick) {
      var y = margin.top + chartHeight - (tick / axisMax) * chartHeight;
      html += "<line class=\"grid-line\" x1=\"" + margin.left + "\" x2=\"" + (width - margin.right) + "\" y1=\"" + y + "\" y2=\"" + y + "\"></line>";
      html += "<text class=\"bar-label\" x=\"10\" y=\"" + (y + 4) + "\">" + formatPercent(tick) + "</text>";
    });

    sorted.forEach(function (row, index) {
      var value = Number(row[metricId] || 0);
      var barHeight = value / axisMax * chartHeight;
      var x = margin.left + index * (barWidth + barGap);
      var y = margin.top + chartHeight - barHeight;
      var label = row.regione.length > 16 ? row.regione.slice(0, 15) + "." : row.regione;
      html += "<rect class=\"bar " + metric.color + "\" x=\"" + x + "\" y=\"" + y + "\" width=\"" + barWidth + "\" height=\"" + barHeight + "\"><title>" + escapeHtml(row.regione + ": " + formatPercent(value)) + "</title></rect>";
      html += "<text class=\"value-label\" text-anchor=\"middle\" x=\"" + (x + barWidth / 2) + "\" y=\"" + Math.max(14, y - 6) + "\">" + formatPercent(value) + "</text>";
      html += "<text class=\"bar-label\" text-anchor=\"end\" transform=\"translate(" + (x + barWidth / 2 + 4) + "," + (height - margin.bottom + 18) + ") rotate(-55)\">" + escapeHtml(label) + "</text>";
    });

    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.innerHTML = html;
    byId("chartNote").textContent = t(metric.note);
    byId("chartTitle").textContent = t(metric.label) + " " + t("per regione");
    return sorted;
  }

  function updateTable(rows) {
    byId("tableBody").innerHTML = rows.map(function (row) {
      return "<tr>" +
        "<td>" + escapeHtml(row.regione) + "</td>" +
        "<td>" + formatNumber(row.righe_mim) + "</td>" +
        "<td>" + formatPercent(row.quota_aria_condizionata_si) + "</td>" +
        "<td>" + formatPercent(row.quota_aria_condizionata_non_definito) + "</td>" +
        "<td>" + formatPercent(row.quota_mitigazione_media_alta) + "</td>" +
        "<td>" + formatPercent(row.quota_nessun_indicatore_termico) + "</td>" +
        "<td>" + formatPercent(row.quota_rischio_caldo_alto) + "</td>" +
        "</tr>";
    }).join("");
  }

  function pnrrRecordsByRegion() {
    var map = new Map();
    ((state.pnrr && state.pnrr.records) || []).forEach(function (record) {
      map.set(record.regione, record);
    });
    return map;
  }

  function pnrrRowsForGrade(grade) {
    var pnrrMap = pnrrRecordsByRegion();
    return rowsForGrade(grade).map(function (row) {
      var record = pnrrMap.get(row.regione) || {};
      var denominator = Number(row.righe_mim || 0);
      var projects = Number(record.projects || 0);
      return {
        regione: row.regione,
        righe_mim: denominator,
        projects: projects,
        cost_eur: Number(record.cost_eur || 0),
        categories: record.categories || [],
        per_100: denominator ? projects / denominator * 100 : 0
      };
    });
  }

  function drawPnrrChart(rows, grade) {
    var svg = byId("pnrrChart");
    var width = Math.max(980, svg.parentElement.clientWidth || 980);
    var height = 520;
    var margin = { top: 28, right: 16, bottom: 112, left: 64 };
    var chartWidth = width - margin.left - margin.right;
    var chartHeight = height - margin.top - margin.bottom;
    var sorted = rows.slice().sort(function (a, b) {
      return Number(b.per_100) - Number(a.per_100) || Number(b.projects) - Number(a.projects) || a.regione.localeCompare(b.regione, locale().slice(0, 2));
    });
    var maxValue = Math.max.apply(null, sorted.map(function (row) {
      return Number(row.per_100 || 0);
    }).concat([0]));
    var axisMax = maxValue <= 0 ? 1 : (maxValue < 1 ? Math.ceil(maxValue * 10) / 10 : Math.ceil(maxValue));
    var barGap = 7;
    var barWidth = Math.max(20, (chartWidth - barGap * (sorted.length - 1)) / sorted.length);
    var html = "";

    [0, axisMax / 4, axisMax / 2, axisMax * 3 / 4, axisMax].forEach(function (tick) {
      var y = margin.top + chartHeight - (tick / axisMax) * chartHeight;
      html += "<line class=\"grid-line\" x1=\"" + margin.left + "\" x2=\"" + (width - margin.right) + "\" y1=\"" + y + "\" y2=\"" + y + "\"></line>";
      html += "<text class=\"bar-label\" x=\"10\" y=\"" + (y + 4) + "\">" + formatRate(tick) + "</text>";
    });

    sorted.forEach(function (row, index) {
      var value = Number(row.per_100 || 0);
      var barHeight = value / axisMax * chartHeight;
      var x = margin.left + index * (barWidth + barGap);
      var y = margin.top + chartHeight - barHeight;
      var label = row.regione.length > 16 ? row.regione.slice(0, 15) + "." : row.regione;
      var tooltip = row.regione + ": " + formatRate(value) + " - " + formatNumber(row.projects) + " " + t("progetti") + " - " + formatCurrency(row.cost_eur);
      html += "<rect class=\"bar investment\" x=\"" + x + "\" y=\"" + y + "\" width=\"" + barWidth + "\" height=\"" + barHeight + "\"><title>" + escapeHtml(tooltip) + "</title></rect>";
      if (value > 0) {
        html += "<text class=\"value-label\" text-anchor=\"middle\" x=\"" + (x + barWidth / 2) + "\" y=\"" + Math.max(14, y - 6) + "\">" + formatRate(value) + "</text>";
      }
      html += "<text class=\"bar-label\" text-anchor=\"end\" transform=\"translate(" + (x + barWidth / 2 + 4) + "," + (height - margin.bottom + 18) + ") rotate(-55)\">" + escapeHtml(label) + "</text>";
    });

    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.innerHTML = html;
    byId("pnrrChartTitle").textContent = t("Progetti clima/energia per 100 edifici");
    byId("pnrrChartNote").textContent = t("progetti 2021-2027 / edifici per regione") + " - " + t(grade);
    return sorted;
  }

  function updatePnrrComment(sorted) {
    var comment = byId("pnrrComment");
    if (!comment) return;
    if (state.pnrrError) {
      comment.innerHTML = "<strong>" + escapeHtml(t("Nota di lettura.")) + "</strong> " + escapeHtml(t("Non riesco a caricare il riepilogo PNRR:")) + " " + escapeHtml(state.pnrrError);
      return;
    }
    var totalProjects = sorted.reduce(function (acc, row) {
      return acc + Number(row.projects || 0);
    }, 0);
    var totalCost = sorted.reduce(function (acc, row) {
      return acc + Number(row.cost_eur || 0);
    }, 0);
    var top = sorted.find(function (row) {
      return Number(row.projects || 0) > 0;
    });
    var topText = top ? " " + t("La regione con intensita' piu' alta e'") + " <strong>" + escapeHtml(top.regione) + "</strong> (" + formatRate(top.per_100) + ")." : "";
    comment.innerHTML = "<strong>" + escapeHtml(t("Nota di lettura.")) + "</strong> " +
      escapeHtml(t("Il valore e' una proxy territoriale: progetti PNRR clima/energia per 100 edifici del grado selezionato.")) + " " +
      escapeHtml(t("Nel perimetro selezionato il numeratore resta regionale, mentre il denominatore cambia con il grado scolastico.")) + " " +
      escapeHtml(t("Totale progetti considerati:")) + " <strong>" + formatNumber(totalProjects) + "</strong>, " +
      escapeHtml(t("valore finanziato:")) + " <strong>" + formatCurrency(totalCost) + "</strong>." + topText;
  }

  function render() {
    if (!state.data) return;
    var grade = byId("gradeSelect").value || "Tutti";
    var metricId = byId("metricSelect").value || "quota_aria_condizionata_si";
    var rows = rowsForGrade(grade);
    updateKpis(grade);
    updateTable(drawChart(rows, metricId));
  }

  function renderPnrr() {
    if (!state.data || !state.pnrr) return;
    var grade = byId("pnrrGradeSelect").value || "Tutti";
    updatePnrrComment(drawPnrrChart(pnrrRowsForGrade(grade), grade));
  }

  function fillGradeSelect(id, selected) {
    var select = byId(id);
    if (!select) return;
    var grades = gradeList();
    select.innerHTML = grades.map(function (grade) {
      return "<option value=\"" + escapeHtml(grade) + "\">" + escapeHtml(t(grade)) + "</option>";
    }).join("");
    select.value = selected && grades.indexOf(selected) >= 0 ? selected : "Tutti";
  }

  function fillMetricSelect(selected) {
    var select = byId("metricSelect");
    if (!select) return;
    select.innerHTML = Object.keys(metrics).map(function (id) {
      return "<option value=\"" + escapeHtml(id) + "\">" + escapeHtml(t(metrics[id].label)) + "</option>";
    }).join("");
    select.value = selected && metrics[selected] ? selected : "quota_aria_condizionata_si";
  }

  function resetFilters() {
    byId("gradeSelect").value = "Tutti";
    byId("metricSelect").value = "quota_aria_condizionata_si";
    render();
  }

  function resetPnrrFilters() {
    byId("pnrrGradeSelect").value = "Tutti";
    renderPnrr();
  }

  function refreshForLanguage() {
    if (!state.data) {
      state.languageRefreshPending = true;
      return;
    }
    fillGradeSelect("gradeSelect", byId("gradeSelect").value);
    fillGradeSelect("pnrrGradeSelect", byId("pnrrGradeSelect").value);
    fillMetricSelect(byId("metricSelect").value);
    render();
    renderPnrr();
    if (window.SiteLanguage) window.SiteLanguage.refresh(document.querySelector(".heat-dashboard"));
    state.languageRefreshPending = false;
  }

  function bindControls() {
    byId("gradeSelect").addEventListener("change", render);
    byId("metricSelect").addEventListener("change", render);
    byId("resetHeatFilters").addEventListener("click", resetFilters);
    byId("pnrrGradeSelect").addEventListener("change", renderPnrr);
    byId("resetPnrrFilters").addEventListener("click", resetPnrrFilters);
    window.addEventListener("resize", function () {
      render();
      renderPnrr();
    });
  }

  function populateControls() {
    fillGradeSelect("gradeSelect");
    fillGradeSelect("pnrrGradeSelect");
    fillMetricSelect();
  }

  function showError(error) {
    byId("chartTitle").textContent = t("Errore nel caricamento dei dati");
    byId("chartNote").textContent = error.message;
    byId("pnrrChartTitle").textContent = t("Errore nel caricamento dei dati");
    byId("pnrrChartNote").textContent = error.message;
  }

  function init() {
    window.addEventListener("site-language-change", refreshForLanguage);
    Promise.all([
      fetchJson(DATA_URL),
      fetchJson(PNRR_URL).catch(function (error) {
        state.pnrrError = error.message;
        return { records: [] };
      })
    ]).then(function (payloads) {
      state.data = payloads[0];
      state.pnrr = payloads[1] || { records: [] };
      populateControls();
      bindControls();
      resetFilters();
      resetPnrrFilters();
      if (state.languageRefreshPending || window.SiteLanguage) refreshForLanguage();
    }).catch(showError);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
