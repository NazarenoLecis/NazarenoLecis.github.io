(function () {
  var DATA_URL = "../../data/almalaurea/almalaurea_dashboard_data.json";
  var TIMESERIES_AGG_URL = "../../data/almalaurea/almalaurea_timeseries_aggregated_data.json";
  var TIMESERIES_DETAIL_URL = "../../data/almalaurea/almalaurea_timeseries_university_data.json";
  var ARTICLE_DATA_URL = "../../data/almalaurea/almalaurea_article_data.json";
  var ARTICLE_TIMESERIES_URL = "../../data/almalaurea/almalaurea_article_timeseries_data.json";
  var WILDCARD = "*";
  var sharedData = window.AlmaLaureaData = window.AlmaLaureaData || {};
  sharedData.cache = sharedData.cache || {};
  var queryParams = new URLSearchParams(window.location.search);
  var embedMode = queryParams.get("embed") === "1";
  var liteMode = queryParams.get("lite") === "1";
  if (embedMode) {
    document.documentElement.classList.add("embed-mode");
  }

  var chartIds = {
    scatter: {
      survey_year: "scatterSurveyYear",
      years_after_degree: "scatterYearsAfter",
      graduation_year: "scatterGraduationYear",
      employment_definition: "scatterDefinition",
      university: "scatterUniversity",
      disciplinary_group: "scatterGroup",
      course_type: "scatterCourse",
      degree_class: "scatterDegree",
      point_dimension: "scatterPointDimension",
    },
    box: {
      survey_year: "boxSurveyYear",
      years_after_degree: "boxYearsAfter",
      graduation_year: "boxGraduationYear",
      employment_definition: "boxDefinition",
      university: "boxUniversity",
      disciplinary_group: "boxGroup",
      course_type: "boxCourse",
      split_dimension: "boxSplitDimension",
    },
    time: {
      mode: "timeMode",
      start_year: "timeStartYear",
      end_year: "timeEndYear",
      years_after_degree: "timeYearsAfter",
      graduation_year: "timeCohort",
      employment_definition: "timeDefinition",
      university: "timeUniversity",
      disciplinary_group: "timeGroup",
      course_type: "timeCourse",
      point_dimension: "timePointDimension",
      metric: "timeMetric",
    },
  };

  var fieldSets = {
    scatter: [
      { key: "survey_year", id: "scatterSurveyYear", wildcard: false },
      { key: "years_after_degree", id: "scatterYearsAfter", wildcard: false },
      { key: "graduation_year", id: "scatterGraduationYear", wildcard: false },
      { key: "employment_definition", id: "scatterDefinition", wildcard: false },
      { key: "university", id: "scatterUniversity", wildcard: true, allLabel: "Tutti gli atenei" },
      { key: "disciplinary_group", id: "scatterGroup", wildcard: true, allLabel: "Tutti i gruppi" },
      { key: "course_type", id: "scatterCourse", wildcard: true, allLabel: "Tutti i tipi di corso" },
      { key: "degree_class", id: "scatterDegree", wildcard: true, allLabel: "Tutte le classi di laurea" },
    ],
    box: [
      { key: "survey_year", id: "boxSurveyYear", wildcard: false },
      { key: "years_after_degree", id: "boxYearsAfter", wildcard: false },
      { key: "graduation_year", id: "boxGraduationYear", wildcard: false },
      { key: "employment_definition", id: "boxDefinition", wildcard: false },
      { key: "university", id: "boxUniversity", wildcard: true, allLabel: "Tutti gli atenei" },
      { key: "disciplinary_group", id: "boxGroup", wildcard: true, allLabel: "Tutti i gruppi" },
      { key: "course_type", id: "boxCourse", wildcard: true, allLabel: "Tutti i tipi di corso" },
    ],
    time: [
      { key: "years_after_degree", id: "timeYearsAfter", wildcard: false },
      { key: "employment_definition", id: "timeDefinition", wildcard: false },
      { key: "university", id: "timeUniversity", wildcard: true, allLabel: "Tutti gli atenei" },
      { key: "disciplinary_group", id: "timeGroup", wildcard: true, allLabel: "Tutti i gruppi" },
      { key: "course_type", id: "timeCourse", wildcard: true, allLabel: "Tutti i tipi di corso" },
    ],
  };

  var palette = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
    "#4e79a7", "#f28e2b", "#59a14f", "#e15759", "#76b7b2",
    "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac",
  ];

  var state = {
    metadata: null,
    records: [],
    timeseriesRecords: [],
    timeseriesDetailLoaded: false,
    timeseriesDetailPromise: null,
    colorMap: new Map(),
    lastPoints: [],
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function asText(value) {
    return value === null || value === undefined ? "" : String(value);
  }

  function displayLabel(value) {
    return asText(value) === WILDCARD ? "Totale" : asText(value);
  }

  function escapeHtml(value) {
    return asText(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function toNumber(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
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

  function metricLabel(metric) {
    if (metric === "employment_rate") return "Tasso di occupazione";
    if (metric === "net_monthly_salary") return "Retribuzione mensile netta";
    if (metric === "second_level_enrollment_rate") return "Iscritti a magistrale";
    return metric;
  }

  function metricSuffix(metric) {
    return metric === "net_monthly_salary" ? " euro" : "%";
  }

  function timeSeriesHeading(cohortMode, metric) {
    if (cohortMode && metric === "employment_rate") {
      return "Evoluzione occupazionale della coorte selezionata";
    }
    if (cohortMode && metric === "net_monthly_salary") {
      return "Evoluzione retributiva della coorte selezionata";
    }
    if (cohortMode && metric === "second_level_enrollment_rate") {
      return "Prosecuzione alla magistrale della coorte";
    }
    if (metric === "employment_rate") {
      return "Trend occupazionale a distanza fissa";
    }
    if (metric === "net_monthly_salary") {
      return "Trend retributivo a distanza fissa";
    }
    return "Trend della prosecuzione alla magistrale";
  }

  function timeModeExplanation(cohortMode) {
    if (cohortMode) {
      return "Questa lettura segue la stessa coorte di laurea: l'asse orizzontale indica gli anni dalla laurea disponibili nel dataset, non l'anno di indagine.";
    }
    return "Questa lettura confronta anni di indagine diversi mantenendo fissa la distanza dalla laurea: e' una serie storica a orizzonte costante, non il percorso degli stessi laureati.";
  }

  function shortText(value, maxLength) {
    value = asText(value);
    if (value.length <= maxLength) return value;
    return value.slice(0, Math.max(0, maxLength - 1)).trimEnd() + "...";
  }

  function shortDegree(value) {
    var text = asText(value);
    var match = text.match(/\(([^)]+)\)/);
    if (match) return shortText(match[1].split(",")[0], 18);
    return shortText(text, 28);
  }

  function colorFor(key) {
    key = key || "Selezione";
    if (!state.colorMap.has(key)) {
      state.colorMap.set(key, palette[state.colorMap.size % palette.length]);
    }
    return state.colorMap.get(key);
  }

  function cssColor(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function plotTheme() {
    return {
      text: cssColor("--text") || "#f5f2ed",
      muted: cssColor("--muted") || "#b9b2aa",
      line: cssColor("--line") || "#303030",
      panel: "rgba(0,0,0,0)",
      orange: cssColor("--orange") || "#ff5a1f",
    };
  }

  function metadataOptions(key) {
    var options = (state.metadata.filters && state.metadata.filters[key]) || [];
    return options.slice();
  }

  function optionLabel(field, option) {
    if (field.wildcard && asText(option.value) === WILDCARD) return field.allLabel;
    return option.label;
  }

  function allFieldDefinitions() {
    return fieldSets.scatter.concat(fieldSets.box, fieldSets.time);
  }

  function populateSelect(field) {
    var select = byId(field.id);
    if (!select) return;
    var options = metadataOptions(field.key);
    var star = options.find(function (item) { return asText(item.value) === WILDCARD; });
    var regular = options.filter(function (item) { return asText(item.value) !== WILDCARD; });
    if (field.wildcard && !star) {
      star = { value: WILDCARD, label: field.allLabel };
    }
    var ordered = field.wildcard && star ? [star].concat(regular) : regular;

    select.innerHTML = ordered.map(function (option) {
      return "<option value=\"" + escapeHtml(option.value) + "\">" +
        escapeHtml(optionLabel(field, option)) +
        "</option>";
    }).join("");
  }

  function populateTimeYearSelects() {
    var years = state.metadata.timeseries_years || [];
    ["timeStartYear", "timeEndYear"].forEach(function (id) {
      var select = byId(id);
      if (!select) return;
      select.innerHTML = years.map(function (year) {
        return "<option value=\"" + year + "\">" + year + "</option>";
      }).join("");
    });
  }

  function populateTimeCohortSelect() {
    var select = byId("timeCohort");
    if (!select) return;
    var currentValue = select.value;
    var years = Array.from(new Set(state.timeseriesRecords.map(function (record) {
      return record.graduation_year;
    }))).filter(Number.isFinite).sort(function (a, b) {
      return a - b;
    });
    if (!years.length && state.metadata.graduation_years) {
      years = state.metadata.graduation_years.filter(Number.isFinite);
    }
    select.innerHTML = years.map(function (year) {
      return "<option value=\"" + year + "\">" + year + "</option>";
    }).join("");
    if (hasOption(select, currentValue)) {
      select.value = currentValue;
    }
  }

  function hasOption(select, value) {
    return Array.from(select.options).some(function (option) {
      return option.value === asText(value);
    });
  }

  function setSelect(id, value) {
    var select = byId(id);
    if (select && hasOption(select, value)) {
      select.value = asText(value);
    }
  }

  function setSelectFromQuery(id, names) {
    names.some(function (name) {
      if (!queryParams.has(name)) return false;
      setSelect(id, queryParams.get(name));
      return true;
    });
  }

  function firstOptionValue(id) {
    var select = byId(id);
    return select && select.options.length ? select.options[0].value : "";
  }

  function latestDetailedYear() {
    return state.metadata.latest_survey_year;
  }

  function defaultYearsAfter() {
    return metadataOptions("years_after_degree").some(function (item) {
      return Number(item.value) === 1;
    }) ? 1 : metadataOptions("years_after_degree")[0].value;
  }

  function getDetailedFilters(chart) {
    var ids = chartIds[chart];
    return {
      survey_year: toNumber(byId(ids.survey_year).value),
      years_after_degree: toNumber(byId(ids.years_after_degree).value),
      graduation_year: toNumber(byId(ids.graduation_year).value),
      employment_definition: byId(ids.employment_definition).value,
      university: byId(ids.university).value,
      disciplinary_group: byId(ids.disciplinary_group).value,
      course_type: byId(ids.course_type).value,
      degree_class: ids.degree_class ? byId(ids.degree_class).value : WILDCARD,
      point_dimension: ids.point_dimension ? byId(ids.point_dimension).value : "disciplinary_group",
      split_dimension: ids.split_dimension ? byId(ids.split_dimension).value : "disciplinary_group",
    };
  }

  function getTimeFilters() {
    var ids = chartIds.time;
    var startYear = toNumber(byId(ids.start_year).value);
    var endYear = toNumber(byId(ids.end_year).value);
    if (Number.isFinite(startYear) && Number.isFinite(endYear) && startYear > endYear) {
      var swap = startYear;
      startYear = endYear;
      endYear = swap;
    }
    return {
      mode: byId(ids.mode).value,
      start_year: startYear,
      end_year: endYear,
      years_after_degree: toNumber(byId(ids.years_after_degree).value),
      graduation_year: toNumber(byId(ids.graduation_year).value),
      employment_definition: byId(ids.employment_definition).value,
      university: byId(ids.university).value,
      disciplinary_group: byId(ids.disciplinary_group).value,
      course_type: byId(ids.course_type).value,
      point_dimension: byId(ids.point_dimension).value,
      metric: byId(ids.metric).value,
    };
  }

  function setDetailedDefaults(chart) {
    var ids = chartIds[chart];
    setSelect(ids.survey_year, latestDetailedYear());
    setSelect(ids.years_after_degree, defaultYearsAfter());
    syncGraduationYear(chart);
    setSelect(ids.employment_definition, "broad");
    setSelect(ids.university, WILDCARD);
    setSelect(ids.disciplinary_group, WILDCARD);
    setSelect(ids.course_type, WILDCARD);
    if (ids.degree_class) setSelect(ids.degree_class, WILDCARD);
    if (ids.point_dimension) setSelect(ids.point_dimension, "disciplinary_group");
    if (ids.split_dimension) setSelect(ids.split_dimension, "disciplinary_group");
  }

  function setTimeDefaults() {
    var ids = chartIds.time;
    var years = state.metadata.timeseries_years || [];
    setSelect(ids.mode, "fixed_horizon");
    setSelect(ids.start_year, years.length ? years[0] : firstOptionValue(ids.start_year));
    setSelect(ids.end_year, years.length ? years[years.length - 1] : firstOptionValue(ids.end_year));
    setSelect(ids.years_after_degree, defaultYearsAfter());
    setSelect(ids.graduation_year, state.metadata.latest_survey_year - 5);
    setSelect(ids.employment_definition, "restrictive");
    setSelect(ids.university, WILDCARD);
    setSelect(ids.disciplinary_group, WILDCARD);
    setSelect(ids.course_type, WILDCARD);
    setSelect(ids.point_dimension, "disciplinary_group");
    setSelect(ids.metric, "employment_rate");
  }

  function setDefaults() {
    setDetailedDefaults("scatter");
    setDetailedDefaults("box");
    setTimeDefaults();
    updateTimeModeUi();
  }

  function applyDetailedQuery(chart) {
    var ids = chartIds[chart];
    setSelectFromQuery(ids.survey_year, [chart + "_survey", "survey"]);
    setSelectFromQuery(ids.years_after_degree, [chart + "_years", "years"]);
    setSelectFromQuery(ids.graduation_year, [chart + "_cohort", "cohort"]);
    setSelectFromQuery(ids.employment_definition, [chart + "_definition", "definition"]);
    setSelectFromQuery(ids.university, [chart + "_university", "university"]);
    setSelectFromQuery(ids.disciplinary_group, [chart + "_group", "group"]);
    setSelectFromQuery(ids.course_type, [chart + "_course", "course"]);
    if (ids.degree_class) setSelectFromQuery(ids.degree_class, [chart + "_degree", "degree"]);
    if (ids.point_dimension) setSelectFromQuery(ids.point_dimension, [chart + "_dimension", "dimension"]);
    if (ids.split_dimension) setSelectFromQuery(ids.split_dimension, [chart + "_split", "split"]);
    if (!queryParams.has(chart + "_cohort") && !queryParams.has("cohort")) {
      syncGraduationYear(chart);
    }
    if (chart === "scatter") avoidSinglePointScatter();
  }

  function applyTimeQuery() {
    var ids = chartIds.time;
    setSelectFromQuery(ids.mode, ["time_mode", "mode"]);
    setSelectFromQuery(ids.start_year, ["time_start", "start"]);
    setSelectFromQuery(ids.end_year, ["time_end", "end"]);
    setSelectFromQuery(ids.years_after_degree, ["time_years", "years"]);
    setSelectFromQuery(ids.graduation_year, ["time_cohort", "cohort"]);
    setSelectFromQuery(ids.employment_definition, ["time_definition", "definition"]);
    setSelectFromQuery(ids.university, ["time_university", "university"]);
    setSelectFromQuery(ids.disciplinary_group, ["time_group", "group"]);
    setSelectFromQuery(ids.course_type, ["time_course", "course"]);
    setSelectFromQuery(ids.point_dimension, ["time_dimension", "dimension"]);
    setSelectFromQuery(ids.metric, ["time_metric", "metric"]);
  }

  function applyQueryParams() {
    if (!queryParams.toString()) return;
    applyDetailedQuery("scatter");
    applyDetailedQuery("box");
    applyTimeQuery();
    updateTimeModeUi();
  }

  function focusQueryChart() {
    if (embedMode) return;
    var chart = queryParams.get("chart");
    var sectionIds = {
      scatter: "scatterSection",
      box: "boxSection",
      time: "timeSection",
    };
    var section = byId(sectionIds[chart]);
    if (!section) return;
    window.setTimeout(function () {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  function requestedEmbedChart() {
    var chart = queryParams.get("chart");
    return chartIds[chart] ? chart : "scatter";
  }

  function shouldLoadTimeseriesOnInit() {
    return !embedMode || requestedEmbedChart() === "time";
  }

  function applyEmbedMode() {
    if (!embedMode) return;
    var sectionIds = {
      scatter: "scatterSection",
      box: "boxSection",
      time: "timeSection",
    };
    var chart = requestedEmbedChart();
    Object.keys(sectionIds).forEach(function (key) {
      var section = byId(sectionIds[key]);
      if (section) section.classList.toggle("embed-active", key === chart);
    });
  }

  function prepareResponsiveFilters() {
    if (embedMode || !window.matchMedia) return;
    var query = window.matchMedia("(max-width: 760px)");
    var panels = Array.prototype.slice.call(document.querySelectorAll(".filter-details"));

    function syncPanels(event) {
      panels.forEach(function (panel) {
        panel.open = !event.matches;
      });
    }

    syncPanels(query);
    if (query.addEventListener) {
      query.addEventListener("change", syncPanels);
    } else if (query.addListener) {
      query.addListener(syncPanels);
    }
  }

  function setTimeFieldVisibility(id, hidden) {
    var element = byId(id);
    if (!element) return;
    var label = element.closest("label");
    if (label) label.classList.toggle("is-hidden", hidden);
  }

  function updateTimeModeUi() {
    var ids = chartIds.time;
    var mode = byId(ids.mode).value;
    var metric = byId(ids.metric).value;
    var cohortMode = mode === "cohort_path";

    setTimeFieldVisibility(ids.start_year, cohortMode);
    setTimeFieldVisibility(ids.end_year, cohortMode);
    setTimeFieldVisibility(ids.years_after_degree, cohortMode);
    setTimeFieldVisibility(ids.graduation_year, !cohortMode);

    byId("timeSeriesTitle").textContent = timeSeriesHeading(cohortMode, metric);
    byId("timeModeNote").textContent = timeModeExplanation(cohortMode);
  }

  function syncGraduationYear(chart) {
    var ids = chartIds[chart];
    var surveyYear = toNumber(byId(ids.survey_year).value);
    var yearsAfter = toNumber(byId(ids.years_after_degree).value);
    if (!Number.isFinite(surveyYear) || !Number.isFinite(yearsAfter)) return;
    setSelect(ids.graduation_year, surveyYear - yearsAfter);
  }

  function syncYearsAfterFromGraduationYear(chart) {
    var ids = chartIds[chart];
    var surveyYear = toNumber(byId(ids.survey_year).value);
    var graduationYear = toNumber(byId(ids.graduation_year).value);
    if (!Number.isFinite(surveyYear) || !Number.isFinite(graduationYear)) return;
    setSelect(ids.years_after_degree, surveyYear - graduationYear);
  }

  function avoidSinglePointScatter() {
    var ids = chartIds.scatter;
    if (byId(ids.disciplinary_group).value === WILDCARD) return;
    if (byId(ids.point_dimension).value !== "disciplinary_group") return;
    if (byId(ids.degree_class).value === WILDCARD) {
      setSelect(ids.point_dimension, "degree_class");
      return;
    }
    setSelect(ids.point_dimension, "university");
  }

  function fixedMatch(record, filters) {
    return record.survey_year === filters.survey_year &&
      record.years_after_degree === filters.years_after_degree &&
      record.graduation_year === filters.graduation_year &&
      record.employment_definition === filters.employment_definition;
  }

  function hasMeasures(record) {
    return Number.isFinite(record.graduates) ||
      Number.isFinite(record.employment_rate) ||
      Number.isFinite(record.net_monthly_salary) ||
      Number.isFinite(record.second_level_enrollment_rate);
  }

  function candidateRows(filters, dimension) {
    return state.records.filter(function (record) {
      if (!fixedMatch(record, filters)) return false;
      if (!hasMeasures(record)) return false;

      if (filters.course_type !== WILDCARD) {
        if (record.course_type !== filters.course_type) return false;
      } else if (dimension === "degree_class") {
        if (record.course_type === WILDCARD) return false;
      } else if (record.course_type !== WILDCARD) {
        return false;
      }

      if (filters.degree_class !== WILDCARD) {
        if (record.degree_class !== filters.degree_class) return false;
      } else if (dimension === "degree_class") {
        if (record.degree_class === WILDCARD) return false;
      } else if (record.degree_class !== WILDCARD) {
        return false;
      }

      if (filters.disciplinary_group !== WILDCARD &&
          record.disciplinary_group !== filters.disciplinary_group) {
        return false;
      }

      if (filters.university !== WILDCARD) {
        if (record.university !== filters.university) return false;
      } else if (dimension === "university") {
        if (record.university === WILDCARD) return false;
      } else if (record.university !== WILDCARD) {
        return false;
      }

      return true;
    });
  }

  function distributionRows(filters) {
    return state.records.filter(function (record) {
      if (!fixedMatch(record, filters)) return false;
      if (!Number.isFinite(record.net_monthly_salary)) return false;

      if (filters.course_type !== WILDCARD) {
        if (record.course_type !== filters.course_type) return false;
      } else if (filters.split_dimension === "course_type") {
        if (record.course_type === WILDCARD) return false;
      } else if (record.course_type !== WILDCARD) {
        return false;
      }

      if (record.degree_class !== WILDCARD) return false;

      if (filters.disciplinary_group !== WILDCARD) {
        if (record.disciplinary_group !== filters.disciplinary_group) return false;
      } else if (filters.split_dimension === "disciplinary_group") {
        if (record.disciplinary_group === WILDCARD) return false;
      } else if (record.disciplinary_group !== WILDCARD) {
        return false;
      }

      if (filters.university !== WILDCARD) {
        if (record.university !== filters.university) return false;
      } else if (record.university === WILDCARD) {
        return false;
      }

      return true;
    });
  }

  function bucketKey(record, dimension) {
    return record[dimension];
  }

  function bucketLabel(record, dimension) {
    if (dimension === "degree_class") return record.degree_class_label;
    if (dimension === "university") return record.university_label;
    return record.disciplinary_group_label;
  }

  function pointDisplayLabel(record, dimension) {
    if (dimension === "degree_class") return shortDegree(record.degree_class_label);
    if (dimension === "university") return shortText(record.university_label, 26);
    return shortText(record.disciplinary_group_label, 28);
  }

  function colorKeyForBucket(records, dimension) {
    if (dimension === "disciplinary_group") return records[0].disciplinary_group_label;
    if (dimension === "degree_class") {
      var degreeGroups = Array.from(new Set(records.map(function (record) {
        return record.disciplinary_group_label;
      })));
      if (degreeGroups.length === 1) return records[0].course_type_label;
      return records[0].disciplinary_group_label;
    }

    var groups = Array.from(new Set(records.map(function (record) {
      return record.disciplinary_group_label;
    })));
    return groups.length === 1 ? groups[0] : "Atenei";
  }

  function weightedAverage(records, field) {
    var weightedSum = 0;
    var weightSum = 0;
    var plainSum = 0;
    var plainCount = 0;

    records.forEach(function (record) {
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

  function aggregateRows(rows, dimension) {
    var buckets = new Map();

    rows.forEach(function (record) {
      var key = bucketKey(record, dimension);
      if (!key || key === WILDCARD) return;
      if (!buckets.has(key)) {
        buckets.set(key, []);
      }
      buckets.get(key).push(record);
    });

    return Array.from(buckets.entries()).map(function (entry) {
      var bucketRows = entry[1];
      var first = bucketRows[0];
      var graduates = bucketRows.reduce(function (sum, record) {
        return sum + (Number.isFinite(record.graduates) ? record.graduates : 0);
      }, 0);

      return {
        key: entry[0],
        label: bucketLabel(first, dimension),
        display_label: pointDisplayLabel(first, dimension),
        disciplinary_group: first.disciplinary_group,
        group_label: first.disciplinary_group_label,
        course_type_label: first.course_type_label,
        color_key: colorKeyForBucket(bucketRows, dimension),
        graduates: graduates,
        employment_rate: weightedAverage(bucketRows, "employment_rate"),
        net_monthly_salary: weightedAverage(bucketRows, "net_monthly_salary"),
        second_level_enrollment_rate: weightedAverage(bucketRows, "second_level_enrollment_rate"),
        current_second_level_enrollment_rate: weightedAverage(
          bucketRows,
          "current_second_level_enrollment_rate"
        ),
      };
    }).filter(function (point) {
      return Number.isFinite(point.employment_rate) && Number.isFinite(point.net_monthly_salary);
    });
  }

  function splitByColor(points) {
    var groups = new Map();
    points.forEach(function (point) {
      if (!groups.has(point.color_key)) groups.set(point.color_key, []);
      groups.get(point.color_key).push(point);
    });
    return Array.from(groups.entries());
  }

  function plotlyAvailable() {
    return Boolean(window.Plotly);
  }

  function clearChartMessage(elementId) {
    var element = byId(elementId);
    if (!element) return;
    element.querySelectorAll(".empty-state").forEach(function (message) {
      message.remove();
    });
  }

  function renderMessage(elementId, message) {
    var element = byId(elementId);
    if (!element) return;
    if (plotlyAvailable()) window.Plotly.purge(element);
    element.innerHTML = "<div class=\"empty-state\">" + escapeHtml(message) + "</div>";
  }

  function plotLayout(extra) {
    var theme = plotTheme();
    return Object.assign({
      paper_bgcolor: theme.panel,
      plot_bgcolor: theme.panel,
      font: { color: theme.text, family: "system-ui, -apple-system, Segoe UI, sans-serif", size: 14 },
      margin: { l: 76, r: 28, t: 18, b: 70 },
      hoverlabel: { bgcolor: theme.text, font: { color: cssColor("--bg") || "#020202" } },
      xaxis: {
        gridcolor: theme.line,
        zerolinecolor: theme.line,
        title: { text: "Retribuzione mensile netta" },
      },
      yaxis: {
        gridcolor: theme.line,
        zerolinecolor: theme.line,
        title: { text: "Tasso di occupazione" },
      },
      legend: {
        orientation: "v",
        x: 1.02,
        y: 1,
        xanchor: "left",
        borderwidth: 0,
      },
    }, extra || {});
  }

  function renderScatter(points) {
    if (!plotlyAvailable()) {
      renderMessage("scatterChart", "Plotly non e' disponibile.");
      return;
    }
    if (!points.length) {
      renderMessage("scatterChart", "Nessun dato disponibile per questa combinazione di filtri.");
      return;
    }
    clearChartMessage("scatterChart");

    var maxGraduates = Math.max.apply(null, points.map(function (point) {
      return point.graduates || 0;
    })) || 1;
    var showLabels = points.length <= 38;

    var traces = splitByColor(points).map(function (entry) {
      var colorKey = entry[0];
      var tracePoints = entry[1];
      return {
        type: "scatter",
        mode: showLabels ? "markers+text" : "markers",
        name: colorKey,
        x: tracePoints.map(function (point) { return point.net_monthly_salary; }),
        y: tracePoints.map(function (point) { return point.employment_rate; }),
        text: tracePoints.map(function (point) { return point.display_label; }),
        textposition: "top center",
        textfont: { size: 12 },
        cliponaxis: false,
        marker: {
          color: colorFor(colorKey),
          opacity: .86,
          line: { color: "rgba(255,255,255,.45)", width: 1 },
          size: tracePoints.map(function (point) {
            return 10 + 34 * Math.sqrt((point.graduates || 0) / maxGraduates);
          }),
        },
        customdata: tracePoints.map(function (point) {
          return [
            point.label,
            point.group_label,
            point.course_type_label,
            point.graduates,
            formatPercent(point.second_level_enrollment_rate),
          ];
        }),
        hovertemplate: "<b>%{customdata[0]}</b><br>" +
          "Gruppo: %{customdata[1]}<br>" +
          "Tipo corso: %{customdata[2]}<br>" +
          "Retribuzione: %{x:.0f} euro<br>" +
          "Occupazione: %{y:.1f}%<br>" +
          "Iscritti a magistrale: %{customdata[4]}<br>" +
          "Laureati: %{customdata[3]:,.0f}<extra></extra>",
      };
    });

    window.Plotly.react(
      "scatterChart",
      traces,
      plotLayout({
        margin: { l: 78, r: 210, t: 18, b: 76 },
      }),
      { responsive: true, displayModeBar: false }
    );
  }

  function boxGroupKey(record, filters) {
    if (filters.split_dimension === "course_type") return record.course_type_label;
    return record.disciplinary_group_label;
  }

  function renderBox(rows, filters) {
    if (!plotlyAvailable()) {
      renderMessage("boxChart", "Plotly non e' disponibile.");
      return;
    }
    if (!rows.length) {
      renderMessage("boxChart", "La distribuzione per ateneo non e' disponibile per questa selezione.");
      return;
    }

    var byGroup = new Map();
    rows.forEach(function (record) {
      var key = boxGroupKey(record, filters);
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key).push(record);
    });

    var traces = Array.from(byGroup.entries()).map(function (entry) {
      var group = entry[0];
      var groupRows = entry[1].filter(function (record) {
        return Number.isFinite(record.net_monthly_salary);
      });
      return {
        type: "box",
        name: shortText(group, 22),
        y: groupRows.map(function (record) { return record.net_monthly_salary; }),
        text: groupRows.map(function (record) { return record.university_label; }),
        customdata: groupRows.map(function (record) {
          return [
            record.disciplinary_group_label,
            record.course_type_label,
            formatPercent(record.second_level_enrollment_rate),
          ];
        }),
        boxpoints: "all",
        jitter: .32,
        pointpos: 0,
        marker: { color: colorFor(group), opacity: .75, size: 7 },
        line: { color: colorFor(group) },
        fillcolor: "rgba(160,160,160,.18)",
        hovertemplate: "<b>%{text}</b><br>" +
          "Gruppo: %{customdata[0]}<br>" +
          "Tipo corso: %{customdata[1]}<br>" +
          "Retribuzione: %{y:.0f} euro<br>" +
          "Iscritti a magistrale: %{customdata[2]}<extra></extra>",
      };
    }).filter(function (trace) {
      return trace.y.length > 0;
    });

    if (!traces.length) {
      renderMessage("boxChart", "Nessun valore di retribuzione disponibile.");
      return;
    }
    clearChartMessage("boxChart");

    window.Plotly.react(
      "boxChart",
      traces,
      plotLayout({
        showlegend: false,
        margin: { l: 72, r: 26, t: 14, b: 126 },
        yaxis: {
          gridcolor: plotTheme().line,
          zerolinecolor: plotTheme().line,
          title: { text: "Retribuzione mensile netta" },
        },
        xaxis: {
          tickangle: -35,
          gridcolor: "rgba(0,0,0,0)",
          title: {
            text: filters.split_dimension === "course_type" ?
              "Tipo corso" :
              "Gruppo disciplinare",
          },
        },
      }),
      { responsive: true, displayModeBar: false }
    );
  }

  function timeseriesRows(filters) {
    return state.timeseriesRecords.filter(function (record) {
      if (filters.mode === "cohort_path") {
        if (record.graduation_year !== filters.graduation_year) return false;
      } else {
        if (Number.isFinite(filters.start_year) && record.survey_year < filters.start_year) return false;
        if (Number.isFinite(filters.end_year) && record.survey_year > filters.end_year) return false;
        if (record.years_after_degree !== filters.years_after_degree) return false;
      }
      if (record.employment_definition !== filters.employment_definition) return false;

      if (filters.course_type !== WILDCARD) {
        if (record.course_type !== filters.course_type) return false;
      } else if (record.course_type !== WILDCARD) {
        return false;
      }

      if (filters.university !== WILDCARD && record.university !== filters.university) return false;
      if (filters.disciplinary_group !== WILDCARD &&
          record.disciplinary_group !== filters.disciplinary_group) return false;

      if (filters.point_dimension === "university") {
        if (record.university === WILDCARD) return false;
      } else {
        if (record.disciplinary_group === WILDCARD) return false;
        if (filters.university === WILDCARD && record.university !== WILDCARD) return false;
      }

      return true;
    });
  }

  function timeFiltersNeedDetail(filters) {
    return filters.point_dimension === "university" || filters.university !== WILDCARD;
  }

  function timeseriesTraceKey(record, filters) {
    if (filters.point_dimension === "university") return record.university;
    return record.disciplinary_group;
  }

  function timeseriesTraceLabel(record, filters) {
    if (filters.point_dimension === "university") return record.university_label;
    return record.disciplinary_group_label;
  }

  function timeseriesAxisValue(record, filters) {
    if (filters.mode === "cohort_path") return record.years_after_degree;
    return record.survey_year;
  }

  function aggregateTimeseriesRows(rows, filters) {
    var buckets = new Map();

    rows.forEach(function (record) {
      var key = timeseriesTraceKey(record, filters);
      if (!key || key === WILDCARD) return;
      var xValue = timeseriesAxisValue(record, filters);
      var bucketKey = key + "||" + xValue;
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, {
          key: key,
          label: timeseriesTraceLabel(record, filters),
          x_value: xValue,
          survey_year: record.survey_year,
          graduation_year: record.graduation_year,
          years_after_degree: record.years_after_degree,
          rows: [],
        });
      }
      buckets.get(bucketKey).rows.push(record);
    });

    return Array.from(buckets.values()).map(function (bucket) {
      var graduates = bucket.rows.reduce(function (sum, record) {
        return sum + (Number.isFinite(record.graduates) ? record.graduates : 0);
      }, 0);
      return {
        key: bucket.key,
        label: bucket.label,
        x_value: bucket.x_value,
        survey_year: bucket.survey_year,
        graduation_year: bucket.graduation_year,
        years_after_degree: bucket.years_after_degree,
        graduates: graduates,
        employment_rate: weightedAverage(bucket.rows, "employment_rate"),
        net_monthly_salary: weightedAverage(bucket.rows, "net_monthly_salary"),
        second_level_enrollment_rate: weightedAverage(bucket.rows, "second_level_enrollment_rate"),
      };
    });
  }

  function renderTimeSeries(rows, filters) {
    if (!plotlyAvailable()) {
      renderMessage("timeSeriesChart", "Plotly non e' disponibile.");
      return;
    }

    var metric = filters.metric;
    var label = metricLabel(metric);
    var suffix = metricSuffix(metric);
    var cohortMode = filters.mode === "cohort_path";

    if (!rows.length) {
      renderMessage("timeSeriesChart", "Nessuna serie storica disponibile per questa combinazione di filtri.");
      return;
    }

    var byKey = new Map();
    aggregateTimeseriesRows(rows, filters).forEach(function (record) {
      if (!record.key || record.key === WILDCARD || !Number.isFinite(record[metric])) return;
      if (!byKey.has(record.key)) byKey.set(record.key, []);
      byKey.get(record.key).push(record);
    });

    var traces = Array.from(byKey.entries()).map(function (entry) {
      var key = entry[0];
      var traceRows = entry[1].sort(function (a, b) {
        return a.x_value - b.x_value;
      });
      var traceLabel = traceRows.length ? traceRows[0].label : key;
      return {
        type: "scatter",
        mode: "lines+markers",
        name: shortText(traceLabel, 28),
        x: traceRows.map(function (record) { return record.x_value; }),
        y: traceRows.map(function (record) { return record[metric]; }),
        marker: { color: colorFor(traceLabel), size: 8 },
        line: { color: colorFor(traceLabel), width: 2 },
        customdata: traceRows.map(function (record) {
          return [
            record.survey_year,
            record.graduation_year,
            record.years_after_degree,
            record.graduates,
            traceLabel,
          ];
        }),
        hovertemplate: cohortMode ?
          "<b>%{customdata[4]}</b><br>" +
          "Anni dalla laurea: %{x}<br>" +
          "Anno indagine: %{customdata[0]}<br>" +
          "Coorte: %{customdata[1]}<br>" +
          label + ": %{y:.1f}" + suffix + "<br>" +
          "Laureati: %{customdata[3]:,.0f}<extra></extra>" :
          "<b>%{customdata[4]}</b><br>" +
          "Anno indagine: %{x}<br>" +
          "Coorte: %{customdata[1]}<br>" +
          label + ": %{y:.1f}" + suffix + "<br>" +
          "Laureati: %{customdata[3]:,.0f}<extra></extra>",
      };
    }).filter(function (trace) {
      return trace.x.length > 1;
    });

    if (!traces.length) {
      renderMessage(
        "timeSeriesChart",
        "Non ci sono almeno due punti temporali numerici per questa combinazione di filtri. Prova una definizione occupazionale, un indicatore o un intervallo temporale diverso."
      );
      return;
    }
    clearChartMessage("timeSeriesChart");

    var xaxis = {
      gridcolor: plotTheme().line,
      zerolinecolor: plotTheme().line,
      title: { text: cohortMode ? "Anni dalla laurea" : "Anno indagine" },
      dtick: 1,
    };
    if (cohortMode) {
      xaxis.tickmode = "array";
      xaxis.tickvals = Array.from(new Set(traces.reduce(function (values, trace) {
        return values.concat(trace.x);
      }, []))).sort(function (a, b) {
        return a - b;
      });
    }

    window.Plotly.react(
      "timeSeriesChart",
      traces,
      plotLayout({
        margin: { l: 78, r: 210, t: 16, b: 64 },
        xaxis: xaxis,
        yaxis: {
          gridcolor: plotTheme().line,
          zerolinecolor: plotTheme().line,
          title: { text: label },
          ticksuffix: metric === "net_monthly_salary" ? "" : "%",
        },
      }),
      { responsive: true, displayModeBar: false }
    );
  }

  function updateKpis(points) {
    var graduates = points.reduce(function (sum, point) {
      return sum + (Number.isFinite(point.graduates) ? point.graduates : 0);
    }, 0);
    var employment = weightedAverage(points, "employment_rate");
    var salary = weightedAverage(points, "net_monthly_salary");
    var secondLevel = weightedAverage(points, "second_level_enrollment_rate");

    byId("kpiGraduates").textContent = formatInt(graduates);
    byId("kpiEmployment").textContent = formatPercent(employment);
    byId("kpiSalary").textContent = formatEuro(salary);
    if (Number.isFinite(secondLevel)) {
      byId("kpiExtraLabel").textContent = "Iscritti a magistrale";
      byId("kpiExtra").textContent = formatPercent(secondLevel);
    } else {
      byId("kpiExtraLabel").textContent = "Punti visualizzati";
      byId("kpiExtra").textContent = formatInt(points.length);
    }
  }

  function detailedFilterDescription(filters) {
    var parts = [];
    var definition = metadataOptions("employment_definition").find(function (item) {
      return item.value === filters.employment_definition;
    });
    parts.push("indagine " + filters.survey_year);
    parts.push("coorte " + filters.graduation_year);
    parts.push(filters.years_after_degree === 1 ? "1 anno dalla laurea" : filters.years_after_degree + " anni dalla laurea");
    if (definition) parts.push(definition.label.toLowerCase());
    if (filters.university !== WILDCARD) parts.push("ateneo: " + filters.university);
    if (filters.disciplinary_group !== WILDCARD) parts.push("gruppo: " + filters.disciplinary_group);
    if (filters.course_type !== WILDCARD) parts.push("tipo corso: " + filters.course_type);
    if (filters.degree_class !== WILDCARD) parts.push("classe: " + shortText(filters.degree_class, 72));
    return parts.join(" | ");
  }

  function updateComment(points, filters) {
    var dimensionLabel = {
      disciplinary_group: "gruppi disciplinari",
      university: "atenei",
      degree_class: "classi di laurea",
    }[filters.point_dimension];

    if (!points.length) {
      byId("selectionComment").textContent =
        "Nessun dato disponibile per " + detailedFilterDescription(filters) +
        ". In AlmaLaurea alcune combinazioni non sono pubblicate o non sono coerenti tra loro.";
      return;
    }

    var bestSalary = points.slice().sort(function (a, b) {
      return b.net_monthly_salary - a.net_monthly_salary;
    })[0];
    var bestEmployment = points.slice().sort(function (a, b) {
      return b.employment_rate - a.employment_rate;
    })[0];
    var caveat = "";

    if (filters.course_type !== WILDCARD) {
      caveat = " Il filtro sul tipo di corso mostra solo i gruppi o le classi pubblicati da AlmaLaurea per quel percorso, quindi alcune aree possono non comparire.";
    }
    if (filters.point_dimension === "degree_class" && filters.university !== WILDCARD) {
      caveat = " Le classi di laurea sono disponibili nella struttura esportata a livello nazionale; per gli atenei la vista piu' robusta resta per gruppo disciplinare.";
    }

    byId("selectionComment").textContent =
      "La vista mostra " + points.length + " " + dimensionLabel + " per " +
      detailedFilterDescription(filters) + ". Retribuzione piu' alta: " +
      bestSalary.label + " (" + formatEuro(bestSalary.net_monthly_salary) +
      "). Occupazione piu' alta: " + bestEmployment.label + " (" +
      formatPercent(bestEmployment.employment_rate) + ")." + caveat;
  }

  function updateSourceAndNotes() {
    byId("sourceTitle").textContent = "Fonte: AlmaLaurea " + state.metadata.latest_survey_year;
    var dashboardYears = state.metadata.survey_years || [];
    var timeseriesYears = state.metadata.timeseries_years || [];
    var dashboardText = dashboardYears.length > 1 ?
      dashboardYears[0] + "-" + dashboardYears[dashboardYears.length - 1] :
      state.metadata.latest_survey_year;
    var timeseriesText = timeseriesYears.length > 1 ?
      timeseriesYears[0] + "-" + timeseriesYears[timeseriesYears.length - 1] :
      dashboardText;
    byId("sourceMeta").textContent =
      "Dashboard dettagliata: " + formatInt(state.metadata.record_count) +
      " osservazioni, anni " + dashboardText + ". Serie storiche: " +
      formatInt(state.metadata.timeseries_record_count || 0) +
      " osservazioni, anni " + timeseriesText + ".";
    byId("methodologyList").innerHTML = (state.metadata.methodology || []).map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");
  }

  function updateScatter() {
    var filters = getDetailedFilters("scatter");
    var dimension = filters.point_dimension;
    var rows = candidateRows(filters, dimension);
    var points = aggregateRows(rows, dimension);
    state.lastPoints = points;

    updateKpis(points);
    updateComment(points, filters);
    renderScatter(points);
  }

  function updateBox() {
    var filters = getDetailedFilters("box");
    renderBox(distributionRows(filters), filters);
  }

  function updateTimeSeries() {
    updateTimeModeUi();
    var filters = getTimeFilters();
    if (timeFiltersNeedDetail(filters) && !state.timeseriesDetailLoaded && !liteMode) {
      renderMessage("timeSeriesChart", "Caricamento dettaglio storico per ateneo...");
      loadTimeseriesDetailRecords()
        .then(updateTimeSeries)
        .catch(function (error) {
          renderMessage("timeSeriesChart", "Non riesco a caricare il dettaglio storico per ateneo: " + error.message);
        });
      return;
    }
    renderTimeSeries(timeseriesRows(filters), filters);
  }

  function updateAll() {
    updateScatter();
    updateBox();
    updateTimeSeries();
  }

  function downloadScatterCsv() {
    var points = state.lastPoints || [];
    if (!points.length) return;

    var headers = ["voce", "gruppo", "laureati", "tasso_occupazione", "retribuzione_mensile_netta"];
    var lines = [headers.join(";")].concat(points.map(function (point) {
      return [
        point.label,
        point.group_label,
        point.graduates,
        Number.isFinite(point.employment_rate) ? point.employment_rate.toFixed(1).replace(".", ",") : "",
        Number.isFinite(point.net_monthly_salary) ? Math.round(point.net_monthly_salary) : "",
      ].map(function (value) {
        return "\"" + asText(value).replace(/"/g, "\"\"") + "\"";
      }).join(";");
    }));

    var blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    var filters = getDetailedFilters("scatter");
    link.href = url;
    link.download = "almalaurea_scatter_" + filters.survey_year + "_" +
      filters.graduation_year + "_" + filters.years_after_degree + "anni.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function resetScatterFilters() {
    setDetailedDefaults("scatter");
    updateScatter();
  }

  function resetBoxFilters() {
    setDetailedDefaults("box");
    updateBox();
  }

  function resetTimeFilters() {
    setTimeDefaults();
    updateTimeSeries();
  }

  function bindDetailedEvents(chart, updateFn) {
    fieldSets[chart].forEach(function (field) {
      byId(field.id).addEventListener("change", function () {
        if (field.key === "survey_year" || field.key === "years_after_degree") {
          syncGraduationYear(chart);
        }
        if (field.key === "graduation_year") {
          syncYearsAfterFromGraduationYear(chart);
        }
        if (chart === "scatter") avoidSinglePointScatter();
        updateFn();
      });
    });
  }

  function bindEvents() {
    bindDetailedEvents("scatter", updateScatter);
    bindDetailedEvents("box", updateBox);

    byId("scatterPointDimension").addEventListener("change", function () {
      avoidSinglePointScatter();
      updateScatter();
    });
    byId("boxSplitDimension").addEventListener("change", updateBox);

    fieldSets.time.forEach(function (field) {
      byId(field.id).addEventListener("change", updateTimeSeries);
    });
    ["timeMode", "timeStartYear", "timeEndYear", "timeCohort", "timePointDimension", "timeMetric"].forEach(function (id) {
      byId(id).addEventListener("change", updateTimeSeries);
    });

    byId("resetScatterFilters").addEventListener("click", resetScatterFilters);
    byId("downloadScatter").addEventListener("click", downloadScatterCsv);
    byId("resetBoxFilters").addEventListener("click", resetBoxFilters);
    byId("resetTimeFilters").addEventListener("click", resetTimeFilters);

    new MutationObserver(function () {
      updateAll();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  function normalizeRecord(record) {
    record.graduates = toNumber(record.graduates);
    record.employment_rate = toNumber(record.employment_rate);
    record.net_monthly_salary = toNumber(record.net_monthly_salary);
    record.second_level_enrollment_rate = toNumber(record.second_level_enrollment_rate);
    record.current_second_level_enrollment_rate = toNumber(record.current_second_level_enrollment_rate);
    record.survey_year = toNumber(record.survey_year);
    record.years_after_degree = toNumber(record.years_after_degree);
    record.graduation_year = toNumber(record.graduation_year);
    record.university_label = record.university_label || displayLabel(record.university);
    record.disciplinary_group_label = record.disciplinary_group_label || displayLabel(record.disciplinary_group);
    record.course_type_label = record.course_type_label || displayLabel(record.course_type);
    record.degree_class_label = record.degree_class_label || displayLabel(record.degree_class);
    return record;
  }

  function normalizeTimeseriesRecord(record) {
    record.graduates = toNumber(record.graduates);
    record.employment_rate = toNumber(record.employment_rate);
    record.net_monthly_salary = toNumber(record.net_monthly_salary);
    record.second_level_enrollment_rate = toNumber(record.second_level_enrollment_rate);
    record.current_second_level_enrollment_rate = toNumber(record.current_second_level_enrollment_rate);
    record.survey_year = toNumber(record.survey_year);
    record.years_after_degree = toNumber(record.years_after_degree);
    record.graduation_year = toNumber(record.graduation_year);
    record.university_label = record.university_label || displayLabel(record.university);
    record.disciplinary_group_label = record.disciplinary_group_label || displayLabel(record.disciplinary_group);
    record.course_type_label = record.course_type_label || displayLabel(record.course_type);
    return record;
  }

  function renderFatal(message) {
    byId("selectionComment").textContent = message;
    ["scatterChart", "boxChart", "timeSeriesChart"].forEach(function (id) {
      renderMessage(id, message);
    });
  }

  function fetchJson(url, optional) {
    var cacheKey = new URL(url, window.location.href).href;
    if (!sharedData.cache[cacheKey]) {
      sharedData.cache[cacheKey] = fetch(url).then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      });
    }
    return sharedData.cache[cacheKey].catch(function (error) {
      if (optional) return { records: [] };
      throw error;
    });
  }

  sharedData.dashboard = sharedData.dashboard || function (optional) {
    return fetchJson(liteMode ? ARTICLE_DATA_URL : DATA_URL, optional);
  };
  sharedData.timeseries = sharedData.timeseries || function (optional) {
    return fetchJson(liteMode ? ARTICLE_TIMESERIES_URL : TIMESERIES_AGG_URL, optional);
  };
  sharedData.timeseriesDetail = sharedData.timeseriesDetail || function (optional) {
    if (liteMode) return Promise.resolve({ records: [] });
    return fetchJson(TIMESERIES_DETAIL_URL, optional);
  };

  function loadTimeseriesRecords() {
    return sharedData.timeseries(true)
      .then(function (timeseriesPayload) {
        sharedData.timeseriesPayload = timeseriesPayload;
        state.timeseriesRecords = (timeseriesPayload.records || []).map(normalizeTimeseriesRecord);
        state.timeseriesDetailLoaded = false;
        state.timeseriesDetailPromise = null;
        populateTimeCohortSelect();
        if (!byId("timeCohort").value) {
          setSelect("timeCohort", state.metadata.latest_survey_year - 5);
        }
        updateTimeSeries();
        window.dispatchEvent(new CustomEvent("almalaurea:timeseries-ready", {
          detail: timeseriesPayload,
        }));
      })
      .catch(function (error) {
        renderMessage("timeSeriesChart", "Non riesco a caricare la serie storica AlmaLaurea: " + error.message);
      });
  }

  function loadTimeseriesDetailRecords() {
    if (state.timeseriesDetailLoaded) return Promise.resolve();
    if (state.timeseriesDetailPromise) return state.timeseriesDetailPromise;
    state.timeseriesDetailPromise = sharedData.timeseriesDetail(false)
      .then(function (timeseriesPayload) {
        var detailRecords = (timeseriesPayload.records || []).map(normalizeTimeseriesRecord);
        state.timeseriesRecords = state.timeseriesRecords.concat(detailRecords);
        state.timeseriesDetailLoaded = true;
        sharedData.timeseriesDetailPayload = timeseriesPayload;
      })
      .catch(function (error) {
        state.timeseriesDetailPromise = null;
        throw error;
      });
    return state.timeseriesDetailPromise;
  }

  function init() {
    sharedData.dashboard(false)
      .then(function (payload) {
        state.metadata = payload.metadata;
        state.records = payload.records.map(normalizeRecord);
        state.timeseriesRecords = [];
        allFieldDefinitions().forEach(populateSelect);
        populateTimeYearSelects();
        populateTimeCohortSelect();
        setDefaults();
        applyQueryParams();
        applyEmbedMode();
        prepareResponsiveFilters();
        updateSourceAndNotes();
        bindEvents();
        var initialChart = requestedEmbedChart();
        if (!embedMode || initialChart === "scatter") {
          updateScatter();
        }
        if (!embedMode || initialChart === "box") {
          updateBox();
        }
        if (shouldLoadTimeseriesOnInit()) {
          renderMessage("timeSeriesChart", "Caricamento serie storica AlmaLaurea...");
        }
        focusQueryChart();
        if (shouldLoadTimeseriesOnInit()) {
          loadTimeseriesRecords();
        }
      })
      .catch(function (error) {
        renderFatal("Non riesco a caricare i dati AlmaLaurea: " + error.message);
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
