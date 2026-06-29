(function () {
  var DATA_URL = "../../data/almalaurea/almalaurea_dashboard_data.json";
  var TIMESERIES_URL = "../../data/almalaurea/almalaurea_timeseries_data.json";
  var WILDCARD = "*";

  var fields = [
    { key: "survey_year", id: "filterSurveyYear", wildcard: false },
    { key: "years_after_degree", id: "filterYearsAfter", wildcard: false },
    { key: "graduation_year", id: "filterGraduationYear", wildcard: false },
    { key: "employment_definition", id: "filterDefinition", wildcard: false },
    { key: "university", id: "filterUniversity", wildcard: true, allLabel: "Tutti gli atenei" },
    { key: "disciplinary_group", id: "filterGroup", wildcard: true, allLabel: "Tutti i gruppi" },
    { key: "course_type", id: "filterCourse", wildcard: true, allLabel: "Tutti i tipi di corso" },
    { key: "degree_class", id: "filterDegree", wildcard: true, allLabel: "Tutte le classi di laurea" },
  ];

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
    if (field.key === "employment_definition") return option.label;
    return option.label;
  }

  function populateSelect(field) {
    var select = byId(field.id);
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

  function getFilters() {
    return {
      survey_year: toNumber(byId("filterSurveyYear").value),
      years_after_degree: toNumber(byId("filterYearsAfter").value),
      graduation_year: toNumber(byId("filterGraduationYear").value),
      employment_definition: byId("filterDefinition").value,
      university: byId("filterUniversity").value,
      disciplinary_group: byId("filterGroup").value,
      course_type: byId("filterCourse").value,
      degree_class: byId("filterDegree").value,
      point_dimension: byId("pointDimension").value,
    };
  }

  function setDefaults() {
    setSelect("filterSurveyYear", state.metadata.latest_survey_year);
    setSelect("filterYearsAfter", metadataOptions("years_after_degree").some(function (item) {
      return Number(item.value) === 1;
    }) ? 1 : metadataOptions("years_after_degree")[0].value);
    syncGraduationYear();
    setSelect("filterDefinition", "broad");
    setSelect("filterUniversity", WILDCARD);
    setSelect("filterGroup", WILDCARD);
    setSelect("filterCourse", WILDCARD);
    setSelect("filterDegree", WILDCARD);
    setSelect("pointDimension", "disciplinary_group");
    avoidSinglePointView();
  }

  function syncGraduationYear() {
    var surveyYear = toNumber(byId("filterSurveyYear").value);
    var yearsAfter = toNumber(byId("filterYearsAfter").value);
    if (!Number.isFinite(surveyYear) || !Number.isFinite(yearsAfter)) return;
    var expected = surveyYear - yearsAfter;
    setSelect("filterGraduationYear", expected);
  }

  function syncYearsAfterFromGraduationYear() {
    var surveyYear = toNumber(byId("filterSurveyYear").value);
    var graduationYear = toNumber(byId("filterGraduationYear").value);
    if (!Number.isFinite(surveyYear) || !Number.isFinite(graduationYear)) return;
    var expected = surveyYear - graduationYear;
    setSelect("filterYearsAfter", expected);
  }

  function avoidSinglePointView() {
    if (byId("filterGroup").value === WILDCARD) return;
    if (byId("pointDimension").value !== "disciplinary_group") return;
    if (byId("filterDegree").value === WILDCARD) {
      setSelect("pointDimension", "degree_class");
      return;
    }
    setSelect("pointDimension", "university");
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

  function candidateRows(dimension) {
    var filters = getFilters();

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

  function distributionRows() {
    var filters = getFilters();
    var splitByCourseType = filters.disciplinary_group !== WILDCARD &&
      filters.course_type === WILDCARD &&
      filters.degree_class === WILDCARD;

    return state.records.filter(function (record) {
      if (!fixedMatch(record, filters)) return false;
      if (!hasMeasures(record)) return false;
      if (filters.course_type !== WILDCARD && record.course_type !== filters.course_type) return false;
      if (filters.course_type === WILDCARD && splitByCourseType && record.course_type === WILDCARD) return false;
      if (filters.course_type === WILDCARD && !splitByCourseType && record.course_type !== WILDCARD) return false;
      if (filters.degree_class !== WILDCARD && record.degree_class !== filters.degree_class) return false;
      if (filters.degree_class === WILDCARD && record.degree_class !== WILDCARD) return false;
      if (filters.disciplinary_group !== WILDCARD &&
          record.disciplinary_group !== filters.disciplinary_group) return false;
      if (filters.university !== WILDCARD && record.university !== filters.university) return false;
      if (filters.university === WILDCARD && record.university === WILDCARD) return false;
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

  function renderMessage(elementId, message) {
    var element = byId(elementId);
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

  function renderBox(rows) {
    if (!plotlyAvailable()) {
      renderMessage("boxChart", "Plotly non e' disponibile.");
      return;
    }
    if (!rows.length) {
      renderMessage("boxChart", "La distribuzione per ateneo non e' disponibile per questa selezione.");
      return;
    }

    var filters = getFilters();
    var splitByCourseType = filters.disciplinary_group !== WILDCARD &&
      filters.course_type === WILDCARD &&
      filters.degree_class === WILDCARD;
    var byGroup = new Map();
    rows.forEach(function (record) {
      var key = splitByCourseType ? record.course_type_label : record.disciplinary_group_label;
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
          return [record.disciplinary_group_label, record.course_type_label, formatPercent(record.second_level_enrollment_rate)];
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

    window.Plotly.react(
      "boxChart",
      traces,
      plotLayout({
        showlegend: false,
        margin: { l: 72, r: 26, t: 14, b: 120 },
        yaxis: {
          gridcolor: plotTheme().line,
          zerolinecolor: plotTheme().line,
          title: { text: "Retribuzione mensile netta" },
        },
        xaxis: {
          tickangle: -35,
          gridcolor: "rgba(0,0,0,0)",
          title: { text: splitByCourseType ? "Tipo corso" : "Gruppo disciplinare" },
        },
      }),
      { responsive: true, displayModeBar: false }
    );
  }

  function timeseriesRows() {
    var filters = getFilters();
    var dimension = filters.point_dimension;

    return state.timeseriesRecords.filter(function (record) {
      if (record.years_after_degree !== filters.years_after_degree) return false;
      if (record.employment_definition !== filters.employment_definition) return false;
      if (filters.course_type !== WILDCARD && record.course_type !== filters.course_type) return false;
      if (filters.course_type === WILDCARD && record.course_type !== WILDCARD) return false;
      if (filters.degree_class !== WILDCARD) return false;
      if (filters.university !== WILDCARD && record.university !== filters.university) return false;
      if (filters.disciplinary_group !== WILDCARD &&
          record.disciplinary_group !== filters.disciplinary_group) return false;

      if (dimension === "university") {
        if (record.university === WILDCARD) return false;
        if (filters.disciplinary_group === WILDCARD && record.disciplinary_group === WILDCARD) return false;
      } else {
        if (filters.university === WILDCARD && record.university !== WILDCARD) return false;
        if (record.disciplinary_group === WILDCARD) return false;
      }
      return true;
    });
  }

  function timeseriesTraceKey(record, filters) {
    if (filters.point_dimension === "university") return record.university;
    return record.disciplinary_group;
  }

  function aggregateTimeseriesRows(rows, filters) {
    var buckets = new Map();

    rows.forEach(function (record) {
      var key = timeseriesTraceKey(record, filters);
      if (!key || key === WILDCARD) return;
      var bucketKey = key + "||" + record.survey_year;
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, {
          key: key,
          survey_year: record.survey_year,
          graduation_year: record.graduation_year,
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
        survey_year: bucket.survey_year,
        graduation_year: bucket.graduation_year,
        graduates: graduates,
        employment_rate: weightedAverage(bucket.rows, "employment_rate"),
        net_monthly_salary: weightedAverage(bucket.rows, "net_monthly_salary"),
        second_level_enrollment_rate: weightedAverage(bucket.rows, "second_level_enrollment_rate"),
      };
    });
  }

  function renderTimeSeries(rows) {
    if (!plotlyAvailable()) {
      renderMessage("timeSeriesChart", "Plotly non e' disponibile.");
      return;
    }

    var filters = getFilters();
    var metric = byId("timeMetric").value;
    var label = metricLabel(metric);
    var suffix = metricSuffix(metric);

    if (filters.degree_class !== WILDCARD) {
      renderMessage(
        "timeSeriesChart",
        "La serie storica lunga non include il dettaglio per classe di laurea. Rimuovi il filtro classe per confrontare gli anni."
      );
      return;
    }

    if (!rows.length) {
      renderMessage("timeSeriesChart", "Nessuna serie storica disponibile per questa combinazione di filtri.");
      return;
    }

    var byKey = new Map();
    aggregateTimeseriesRows(rows, filters).forEach(function (record) {
      var key = record.key;
      if (!key || key === WILDCARD || !Number.isFinite(record[metric])) return;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(record);
    });

    var traces = Array.from(byKey.entries()).map(function (entry) {
      var key = entry[0];
      var traceRows = entry[1].sort(function (a, b) {
        return a.survey_year - b.survey_year;
      });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: shortText(key, 28),
        x: traceRows.map(function (record) { return record.survey_year; }),
        y: traceRows.map(function (record) { return record[metric]; }),
        marker: { color: colorFor(key), size: 8 },
        line: { color: colorFor(key), width: 2 },
        customdata: traceRows.map(function (record) {
          return [record.graduation_year, record.graduates, record.disciplinary_group, record.university];
        }),
        hovertemplate: "<b>" + escapeHtml(shortText(key, 36)) + "</b><br>" +
          "Anno indagine: %{x}<br>" +
          "Coorte: %{customdata[0]}<br>" +
          label + ": %{y:.1f}" + suffix + "<br>" +
          "Laureati: %{customdata[1]:,.0f}<extra></extra>",
      };
    }).filter(function (trace) {
      return trace.x.length > 0;
    });

    if (!traces.length) {
      renderMessage("timeSeriesChart", "Nessun valore numerico disponibile per la serie storica.");
      return;
    }

    window.Plotly.react(
      "timeSeriesChart",
      traces,
      plotLayout({
        margin: { l: 78, r: 210, t: 16, b: 64 },
        xaxis: {
          gridcolor: plotTheme().line,
          zerolinecolor: plotTheme().line,
          title: { text: "Anno indagine" },
          dtick: 1,
        },
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

  function filterDescription(filters) {
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

  function updateComment(points) {
    var filters = getFilters();
    var dimensionLabel = {
      disciplinary_group: "gruppi disciplinari",
      university: "atenei",
      degree_class: "classi di laurea",
    }[filters.point_dimension];

    if (!points.length) {
      byId("selectionComment").textContent =
        "Nessun dato disponibile per " + filterDescription(filters) +
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
      filterDescription(filters) + ". Retribuzione piu' alta: " +
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

  function update() {
    var dimension = byId("pointDimension").value;
    var rows = candidateRows(dimension);
    var points = aggregateRows(rows, dimension);
    state.lastPoints = points;

    updateKpis(points);
    updateComment(points);
    renderScatter(points);
    renderBox(distributionRows());
    renderTimeSeries(timeseriesRows());
  }

  function downloadCsv() {
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
    var filters = getFilters();
    link.href = url;
    link.download = "almalaurea_" + filters.survey_year + "_" +
      filters.graduation_year + "_" + filters.years_after_degree + "anni.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function resetFilters() {
    setDefaults();
    update();
  }

  function bindEvents() {
    fields.forEach(function (field) {
      byId(field.id).addEventListener("change", function () {
        if (field.key === "survey_year" || field.key === "years_after_degree") {
          syncGraduationYear();
        }
        if (field.key === "graduation_year") {
          syncYearsAfterFromGraduationYear();
        }
        avoidSinglePointView();
        update();
      });
    });
    byId("pointDimension").addEventListener("change", function () {
      avoidSinglePointView();
      update();
    });
    byId("timeMetric").addEventListener("change", update);
    byId("resetFilters").addEventListener("click", resetFilters);
    byId("downloadFiltered").addEventListener("click", downloadCsv);

    new MutationObserver(function () {
      update();
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
    return record;
  }

  function renderFatal(message) {
    byId("selectionComment").textContent = message;
    ["scatterChart", "boxChart", "timeSeriesChart"].forEach(function (id) {
      renderMessage(id, message);
    });
  }

  function fetchJson(url, optional) {
    return fetch(url).then(function (response) {
      if (!response.ok) {
        if (optional) return { records: [] };
        throw new Error("HTTP " + response.status);
      }
      return response.json();
    });
  }

  function init() {
    Promise.all([
      fetchJson(DATA_URL, false),
      fetchJson(TIMESERIES_URL, true),
    ])
      .then(function (payloads) {
        var payload = payloads[0];
        var timeseriesPayload = payloads[1];
        state.metadata = payload.metadata;
        state.records = payload.records.map(normalizeRecord);
        state.timeseriesRecords = (timeseriesPayload.records || []).map(normalizeTimeseriesRecord);
        fields.forEach(populateSelect);
        setDefaults();
        updateSourceAndNotes();
        bindEvents();
        update();
      })
      .catch(function (error) {
        renderFatal("Non riesco a caricare i dati AlmaLaurea: " + error.message);
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
