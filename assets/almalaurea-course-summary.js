(function () {
  var DATA_URL = "/data/almalaurea/almalaurea_dashboard_data.json";
  var WILDCARD = "*";
  var records = [];
  var metadata = null;
  var categories = [];

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

  function formatInt(value) {
    if (!Number.isFinite(value)) return "-";
    return Math.round(value).toLocaleString("it-IT");
  }

  function formatPercent(value) {
    if (!Number.isFinite(value)) return "-";
    return value.toLocaleString("it-IT", { maximumFractionDigits: 1 }) + "%";
  }

  function formatEuro(value) {
    if (!Number.isFinite(value)) return "-";
    return value.toLocaleString("it-IT", { maximumFractionDigits: 0 }) + " euro";
  }

  function hasOption(id, value) {
    var select = byId(id);
    if (!select) return false;
    return Array.from(select.options).some(function (option) {
      return option.value === asText(value);
    });
  }

  function setSelect(id, value) {
    var select = byId(id);
    if (!select || !hasOption(id, value)) return false;
    if (select.value === asText(value)) return true;
    select.value = asText(value);
    return true;
  }

  function dispatchChanges(ids) {
    ids.forEach(function (id) {
      var element = byId(id);
      if (element) element.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  function applyUsefulDefault() {
    if (window.location.search) return;
    if (document.documentElement.dataset.almUsefulDefault === "1") return;
    document.documentElement.dataset.almUsefulDefault = "1";

    var latest = toNumber(metadata.latest_survey_year) || 2025;
    var cohort = latest - 5;
    var ids = [
      "scatterSurveyYear", "scatterYearsAfter", "scatterGraduationYear", "scatterDefinition",
      "boxSurveyYear", "boxYearsAfter", "boxGraduationYear", "boxDefinition"
    ];

    setSelect("scatterSurveyYear", latest);
    setSelect("scatterYearsAfter", 5);
    setSelect("scatterGraduationYear", cohort);
    setSelect("scatterDefinition", "broad");
    setSelect("scatterUniversity", WILDCARD);
    setSelect("scatterGroup", WILDCARD);
    setSelect("scatterCourse", WILDCARD);
    setSelect("scatterDegree", WILDCARD);
    setSelect("scatterPointDimension", "disciplinary_group");

    setSelect("boxSurveyYear", latest);
    setSelect("boxYearsAfter", 5);
    setSelect("boxGraduationYear", cohort);
    setSelect("boxDefinition", "broad");
    setSelect("boxUniversity", WILDCARD);
    setSelect("boxGroup", WILDCARD);
    setSelect("boxCourse", WILDCARD);
    setSelect("boxSplitDimension", "disciplinary_group");

    var intro = document.querySelector("#scatterSection .filter-intro p");
    if (intro) {
      intro.textContent = "Vista iniziale: ultima indagine disponibile, coorte osservata a 5 anni dalla laurea, tutti i gruppi disciplinari. Cambia i filtri quando vuoi restringere il perimetro.";
    }

    window.setTimeout(function () { dispatchChanges(ids); }, 0);
    window.setTimeout(function () { dispatchChanges(ids); }, 300);
  }

  function normalizeRecord(record) {
    record.graduates = toNumber(record.graduates);
    record.employment_rate = toNumber(record.employment_rate);
    record.net_monthly_salary = toNumber(record.net_monthly_salary);
    record.survey_year = toNumber(record.survey_year);
    record.years_after_degree = toNumber(record.years_after_degree);
    record.graduation_year = toNumber(record.graduation_year);
    return record;
  }

  function weightedAverage(rows, field) {
    var weightedSum = 0;
    var weightSum = 0;
    var plainSum = 0;
    var plainCount = 0;
    rows.forEach(function (record) {
      var value = record[field];
      if (!Number.isFinite(value)) return;
      plainSum += value;
      plainCount += 1;
      if (Number.isFinite(record.graduates) && record.graduates > 0) {
        weightedSum += value * record.graduates;
        weightSum += record.graduates;
      }
    });
    if (weightSum > 0) return weightedSum / weightSum;
    return plainCount > 0 ? plainSum / plainCount : null;
  }

  function readFilters() {
    return {
      survey_year: toNumber(byId("scatterSurveyYear") && byId("scatterSurveyYear").value),
      graduation_year: toNumber(byId("scatterGraduationYear") && byId("scatterGraduationYear").value),
      employment_definition: byId("scatterDefinition") ? byId("scatterDefinition").value : "broad",
      university: byId("scatterUniversity") ? byId("scatterUniversity").value : WILDCARD,
      disciplinary_group: byId("scatterGroup") ? byId("scatterGroup").value : WILDCARD,
      course_type: byId("scatterCourse") ? byId("scatterCourse").value : WILDCARD,
      degree_class: byId("scatterDegree") ? byId("scatterDegree").value : WILDCARD,
    };
  }

  function buildCategories() {
    var options = ((metadata.filters && metadata.filters.course_type) || [])
      .filter(function (item) { return asText(item.value) !== WILDCARD; });

    function findByLabel(test) {
      return options.find(function (item) {
        return test(asText(item.label).toLowerCase(), asText(item.value).toLowerCase());
      });
    }

    var first = findByLabel(function (label, value) {
      return label.indexOf("primo") >= 0 || label.indexOf("triennal") >= 0 || value === "l";
    });
    var master = findByLabel(function (label, value) {
      return (label.indexOf("magistrale") >= 0 || label.indexOf("secondo") >= 0 || value === "lm") &&
        label.indexOf("ciclo") < 0;
    });
    var single = findByLabel(function (label, value) {
      return label.indexOf("ciclo unico") >= 0 || value === "lmcu";
    });

    categories = [
      { key: "first", label: "Prima laurea", option: first },
      { key: "master", label: "Laurea magistrale", option: master },
      { key: "single", label: "Magistrale a ciclo unico", option: single },
    ].filter(function (item) { return Boolean(item.option); });
  }

  function availableSurveyYears() {
    return (metadata.survey_years || []).map(toNumber).filter(Number.isFinite);
  }

  function missingReason(category, horizon, filters) {
    if (!Number.isFinite(filters.graduation_year)) {
      return "Seleziona una coorte per calcolare il dato.";
    }
    var surveyNeeded = filters.graduation_year + horizon;
    var years = availableSurveyYears();
    if (years.length && years.indexOf(surveyNeeded) < 0) {
      return "Per la coorte " + filters.graduation_year + " servirebbe l’indagine " + surveyNeeded + ", non presente nei dati caricati.";
    }
    if (category.key === "first" && horizon === 5) {
      return "Il dato a 5 anni per la prima laurea non è nella stessa base dettagliata: AlmaLaurea rileva quel perimetro separatamente.";
    }
    return "Dato non pubblicato per questa combinazione di filtri.";
  }

  function baseRows(category, horizon, filters) {
    if (!Number.isFinite(filters.graduation_year)) return [];
    if (filters.course_type !== WILDCARD && filters.course_type !== category.option.value) return [];
    var surveyYear = filters.graduation_year + horizon;
    return records.filter(function (record) {
      if (record.survey_year !== surveyYear) return false;
      if (record.years_after_degree !== horizon) return false;
      if (record.graduation_year !== filters.graduation_year) return false;
      if (record.employment_definition !== filters.employment_definition) return false;
      if (record.course_type !== category.option.value) return false;
      if (filters.university !== WILDCARD && record.university !== filters.university) return false;
      if (filters.university === WILDCARD && record.university !== WILDCARD) return false;
      return Number.isFinite(record.graduates) || Number.isFinite(record.employment_rate) || Number.isFinite(record.net_monthly_salary);
    });
  }

  function chooseRows(category, horizon, filters) {
    var base = baseRows(category, horizon, filters);
    if (!base.length) return [];

    var strict = base.filter(function (record) {
      return record.disciplinary_group === filters.disciplinary_group &&
        record.degree_class === filters.degree_class;
    });
    if (strict.length) return strict;

    if (filters.degree_class !== WILDCARD) return [];

    if (filters.disciplinary_group !== WILDCARD) {
      var classRows = base.filter(function (record) {
        return record.disciplinary_group === filters.disciplinary_group &&
          record.degree_class !== WILDCARD;
      });
      return classRows;
    }

    var groupRows = base.filter(function (record) {
      return record.disciplinary_group !== WILDCARD && record.degree_class === WILDCARD;
    });
    if (groupRows.length) return groupRows;

    return base.filter(function (record) {
      return record.degree_class !== WILDCARD;
    });
  }

  function aggregate(rows) {
    if (!rows.length) return null;
    var graduates = rows.reduce(function (sum, record) {
      return sum + (Number.isFinite(record.graduates) ? record.graduates : 0);
    }, 0);
    return {
      graduates: graduates,
      employment_rate: weightedAverage(rows, "employment_rate"),
      net_monthly_salary: weightedAverage(rows, "net_monthly_salary"),
    };
  }

  function summaryValue(category, horizon, filters) {
    var rows = chooseRows(category, horizon, filters);
    var value = aggregate(rows);
    return {
      value: value,
      reason: value ? "" : missingReason(category, horizon, filters),
    };
  }

  function cellHtml(result) {
    if (!result || !result.value) {
      return "<span class=\"course-empty\">Non disponibile</span>" +
        "<span class=\"course-empty\">" + escapeHtml(result && result.reason ? result.reason : "Dato non disponibile.") + "</span>";
    }
    return "<strong>" + formatPercent(result.value.employment_rate) + "</strong>" +
      "<span>" + formatEuro(result.value.net_monthly_salary) + " · " + formatInt(result.value.graduates) + " laureati</span>";
  }

  function ensureKpiScope() {
    if (byId("kpiScopeNote")) return;
    var kpis = document.querySelector("#scatterSection .kpi-grid");
    if (!kpis) return;
    var note = document.createElement("section");
    note.id = "kpiScopeNote";
    note.className = "kpi-scope";
    note.innerHTML = "<h2>Indicatori della selezione corrente</h2><p>Questi numeri sono calcolati sui punti mostrati nello scatterplot e cambiano con i filtri sopra. La tabella sotto usa la stessa coorte e gli stessi filtri per separare i dati per tipo di corso.</p>";
    kpis.insertAdjacentElement("beforebegin", note);
  }

  function ensurePanel() {
    var existing = byId("courseTypeSummaryPanel");
    if (existing) return existing;
    var kpis = document.querySelector("#scatterSection .kpi-grid");
    if (!kpis) return null;
    var panel = document.createElement("section");
    panel.id = "courseTypeSummaryPanel";
    panel.className = "course-summary-panel";
    panel.innerHTML = "<div class=\"course-summary-head\"><h2>Indicatori per tipo di corso</h2><p>La tabella usa la coorte e gli altri filtri dello scatterplot. Il dato a 1 anno richiede l’indagine dell’anno successivo alla laurea; il dato a 5 anni richiede l’indagine cinque anni dopo.</p></div><div id=\"courseTypeSummary\"></div>";
    kpis.insertAdjacentElement("afterend", panel);
    return panel;
  }

  function render() {
    ensureKpiScope();
    var panel = ensurePanel();
    var target = byId("courseTypeSummary");
    if (!panel || !target || !metadata) return;
    if (!categories.length) {
      target.innerHTML = "<div class=\"empty-state\">Tipi di corso non disponibili nei metadati.</div>";
      return;
    }
    var filters = readFilters();
    var visibleCategories = categories.filter(function (category) {
      return filters.course_type === WILDCARD || filters.course_type === category.option.value;
    });
    if (!visibleCategories.length) visibleCategories = categories;

    var rows = visibleCategories.map(function (category) {
      return {
        category: category,
        one: summaryValue(category, 1, filters),
        five: summaryValue(category, 5, filters),
      };
    });

    target.innerHTML = "<div class=\"course-summary-table\"><div class=\"course-summary-row course-summary-row-head\"><span>Tipo corso</span><span>1 anno</span><span>5 anni</span></div>" +
      rows.map(function (row) {
        return "<div class=\"course-summary-row\"><span><strong>" + escapeHtml(row.category.label) + "</strong><small>" + escapeHtml(row.category.option.label) + "</small></span><span>" + cellHtml(row.one) + "</span><span>" + cellHtml(row.five) + "</span></div>";
      }).join("") +
      "</div>";
  }

  function bind() {
    applyUsefulDefault();
    [
      "scatterSurveyYear", "scatterYearsAfter", "scatterGraduationYear", "scatterDefinition",
      "scatterUniversity", "scatterGroup", "scatterCourse", "scatterDegree", "resetScatterFilters"
    ].forEach(function (id) {
      var element = byId(id);
      if (element) element.addEventListener(id === "resetScatterFilters" ? "click" : "change", function () {
        window.setTimeout(render, 0);
      });
    });
    render();
  }

  function waitForControls(attempt) {
    if (byId("scatterSurveyYear") && byId("scatterSurveyYear").options.length) {
      bind();
      return;
    }
    if (attempt > 60) return;
    window.setTimeout(function () { waitForControls(attempt + 1); }, 100);
  }

  function init() {
    if (location.pathname.indexOf("/dashboard/almalaurea/") < 0) return;
    fetch(DATA_URL)
      .then(function (response) { return response.json(); })
      .then(function (payload) {
        metadata = payload.metadata || {};
        records = (payload.records || []).map(normalizeRecord);
        buildCategories();
        waitForControls(0);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
