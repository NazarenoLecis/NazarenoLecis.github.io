(function () {
  "use strict";

  var DEFAULT_DATA_URL = "https://data.nazarenolecis.com/salari-italia/dashboard.json?v=20260712-1";
  var MISSING = "ND";
  var COLORS = ["#ff5a1f", "#4e79a7", "#76b7b2", "#f2a541", "#e15759", "#59a14f", "#b07aa1", "#8cd17d"];
  var STAT_LABELS = {
    mean: "Media",
    median: "Mediana",
    percentile: "Percentile",
    d9_d1: "D9 / D1",
    d9_median: "D9 / mediana",
    median_d1: "Mediana / D1",
    share_below_two_thirds_median: "Bassa retribuzione",
    mean_gap: "Gender pay gap"
  };
  var PERIOD_LABELS = { hourly: "Orario", monthly: "Mensile", annual: "Annuale" };
  var DIMENSIONS = {
    sex: { field: "sex", labelField: "sex_label", label: "Sesso" },
    age_class: { field: "age_class", labelField: "age_label", label: "Età" },
    education: { field: "education", labelField: "education_label", label: "Titolo di studio" },
    occupation: { field: "occupation", labelField: "occupation_label", label: "Professione" },
    sector: { field: "sector", labelField: "sector_label", label: "Settore" },
    working_time: { field: "working_time", labelField: "working_time_label", label: "Orario" },
    firm_size: { field: "firm_size", labelField: "firm_size_label", label: "Dimensione impresa" },
    seniority: { field: "seniority", labelField: "seniority_label", label: "Anzianità" },
    contract_type: { field: "contract_type", labelField: "contract_type_label", label: "Contratto" }
  };

  var state = {
    payload: null,
    records: [],
    distribution: { year: null, geography_code: "IT", sex: "T", pay_period: "hourly" },
    worker: {
      dimension: "age_class",
      year: null,
      geography_code: "IT",
      sex: "T",
      pay_period: "hourly",
      statistic: "median"
    },
    job: {
      dimension: "sector",
      year: null,
      geography_code: "IT",
      sex: "T",
      pay_period: "hourly",
      statistic: "median"
    },
    selectedSectors: [],
    europe: { pay_period: "hourly", statistic: "median", sex: "T" },
    series: { pay_period: "hourly", statistic: "all", sex: "T" }
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function toNumber(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function text(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback || MISSING;
    return String(value);
  }

  function fmt(value, digits) {
    var n = toNumber(value);
    if (n === null) return MISSING;
    return n.toLocaleString("it-IT", {
      maximumFractionDigits: Number.isFinite(digits) ? digits : 1,
      minimumFractionDigits: 0
    });
  }

  function euro(value, digits) {
    var n = toNumber(value);
    if (n === null) return MISSING;
    return n.toLocaleString("it-IT", {
      maximumFractionDigits: Number.isFinite(digits) ? digits : 1,
      minimumFractionDigits: 0
    }) + " €";
  }

  function percent(value) {
    var n = toNumber(value);
    if (n === null) return MISSING;
    return n.toLocaleString("it-IT", { maximumFractionDigits: 1 }) + "%";
  }

  function clear(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function setStatus(message, isError) {
    var node = byId("siStatus");
    if (!node) return;
    node.textContent = message;
    node.style.color = isError ? "#e15759" : "";
  }

  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function dataUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get("data") || window.SALARI_ITALIA_DATA_URL || DEFAULT_DATA_URL;
  }

  function showEmpty(id, message) {
    var node = byId(id);
    if (!node) return;
    if (window.Plotly) {
      try { window.Plotly.purge(node); } catch (error) {}
    }
    clear(node);
    var empty = document.createElement("div");
    empty.className = "si-empty";
    empty.textContent = message || "Nessun dato disponibile";
    node.appendChild(empty);
  }

  function baseLayout(extra) {
    var textColor = cssVar("--text", "#f5f2ed");
    var muted = cssVar("--muted", "#b9b2aa");
    var line = cssVar("--line", "#303030");
    var panel = cssVar("--panel", "#090909");
    return Object.assign({
      autosize: true,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: textColor, family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", size: 12 },
      margin: { t: 24, r: 18, b: 58, l: 70 },
      hoverlabel: { bgcolor: panel, bordercolor: line, font: { color: textColor } },
      legend: { orientation: "h", x: 0, xanchor: "left", y: -0.22, font: { color: muted } },
      dragmode: false,
      xaxis: { fixedrange: true, gridcolor: line, zerolinecolor: line, tickfont: { color: muted }, automargin: true },
      yaxis: { fixedrange: true, gridcolor: line, zerolinecolor: line, tickfont: { color: muted }, automargin: true }
    }, extra || {});
  }

  function plot(id, traces, layout) {
    if (!window.Plotly) {
      showEmpty(id, "Plotly non è disponibile.");
      return;
    }
    if (!toArray(traces).length) {
      showEmpty(id, "Nessun dato disponibile per la selezione corrente.");
      return;
    }
    window.Plotly.react(id, traces, baseLayout(layout), {
      responsive: true,
      displayModeBar: false,
      scrollZoom: false
    });
  }

  function optionLabel(row, field, labelField) {
    return text(labelField ? row[labelField] : row[field], text(row[field]));
  }

  function isTotal(field, value) {
    if (value === null || value === undefined) return true;
    var raw = String(value);
    if (field === "sex") return raw === "T" || raw === "TOTAL";
    return raw === "TOTAL" || raw === "B-S_X_O" || raw === "GE10";
  }

  function uniqueOptions(rows, field, labelField, includeTotals) {
    var map = {};
    toArray(rows).forEach(function (row) {
      var value = row[field];
      if (value === null || value === undefined || value === "") return;
      if (!includeTotals && isTotal(field, value)) return;
      map[String(value)] = { value: String(value), label: optionLabel(row, field, labelField) };
    });
    return Object.keys(map).map(function (key) { return map[key]; }).sort(function (a, b) {
      var an = toNumber(a.value);
      var bn = toNumber(b.value);
      if (an !== null && bn !== null) return an - bn;
      return a.label.localeCompare(b.label, "it");
    });
  }

  function yearsFrom(rows) {
    return uniqueOptions(rows, "year", null, true).sort(function (a, b) {
      return Number(b.value) - Number(a.value);
    });
  }

  function filterRows(rows, filters, skipKey) {
    return toArray(rows).filter(function (row) {
      return Object.keys(filters).every(function (key) {
        if (key === skipKey) return true;
        var value = filters[key];
        if (value === null || value === undefined || value === "") return true;
        if (String(value) === "all") return true;
        return String(row[key]) === String(value);
      });
    });
  }

  function ensureSelect(container, spec, options, current, onChange) {
    var wrapper = container.querySelector('[data-filter="' + spec.key + '"]');
    if (!options.length) {
      if (wrapper) wrapper.remove();
      return null;
    }
    if (!wrapper) {
      wrapper = document.createElement("label");
      wrapper.setAttribute("data-filter", spec.key);
      var label = document.createElement("span");
      var select = document.createElement("select");
      label.textContent = spec.label;
      select.addEventListener("change", function () {
        onChange(spec.key, select.value);
      });
      wrapper.appendChild(label);
      wrapper.appendChild(select);
      container.appendChild(wrapper);
    }
    var node = wrapper.querySelector("select");
    clear(node);
    options.forEach(function (option) {
      var item = document.createElement("option");
      item.value = option.value;
      item.textContent = option.label;
      node.appendChild(item);
    });
    node.value = String(current);
    return node;
  }

  function syncFilters(containerId, specs, rows, targetState, onChange) {
    var container = byId(containerId);
    if (!container) return;
    specs.forEach(function (spec) {
      var filters = {};
      specs.forEach(function (item) {
        if (item.field && targetState[item.key] !== undefined) filters[item.field] = targetState[item.key];
      });
      var optionRows = filterRows(rows, filters, spec.field);
      var options = spec.options ? spec.options(optionRows) : uniqueOptions(optionRows, spec.field, spec.labelField, spec.includeTotals);
      if (!options.length) {
        var node = container.querySelector('[data-filter="' + spec.key + '"]');
        if (node) node.remove();
        return;
      }
      var current = targetState[spec.key];
      var allowed = options.some(function (option) { return String(option.value) === String(current); });
      if (!allowed) {
        targetState[spec.key] = options[0].value;
        current = targetState[spec.key];
      }
      ensureSelect(container, spec, options, current, function (key, value) {
        targetState[key] = value;
        onChange();
      });
    });
  }

  function grossRows() {
    return state.records.filter(function (row) {
      return row.pay_concept === "gross_earnings";
    });
  }

  function distributionRows() {
    return state.records.filter(function (row) {
      return row.pay_concept === "gross_earnings" && ["mean", "median", "percentile"].indexOf(row.statistic) >= 0;
    });
  }

  function rowMatches(row, filters) {
    return Object.keys(filters).every(function (key) {
      var value = filters[key];
      if (value === null || value === undefined || value === "") return true;
      return String(row[key]) === String(value);
    });
  }

  function latestRecord(rows, filters) {
    var filtered = toArray(rows).filter(function (row) { return rowMatches(row, filters); });
    filtered.sort(function (a, b) {
      return (toNumber(b.year) || 0) - (toNumber(a.year) || 0);
    });
    return filtered[0] || null;
  }

  function latestYear(rows, filters) {
    var record = latestRecord(rows, filters || {});
    return record ? record.year : null;
  }

  function appendKpi(container, title, record, formatter, note) {
    var card = document.createElement("div");
    card.className = "si-kpi";
    var label = document.createElement("span");
    var value = document.createElement("strong");
    var year = document.createElement("em");
    var small = document.createElement("small");
    label.textContent = title;
    value.textContent = record ? formatter(record.value) : MISSING;
    year.textContent = record ? text(record.year) + " · " + text(record.dataset) : "Dato non disponibile";
    small.textContent = note || (record ? text(record.geography_name, record.geography_code) : "");
    card.appendChild(label);
    card.appendChild(value);
    card.appendChild(year);
    card.appendChild(small);
    container.appendChild(card);
  }

  function renderKpis() {
    var container = byId("siKpis");
    if (!container) return;
    clear(container);
    var records = state.records;
    appendKpi(container, "Mediana oraria lorda", latestRecord(records, {
      geography_code: "IT", sex: "T", pay_concept: "gross_earnings", pay_period: "hourly", statistic: "median"
    }), function (value) { return euro(value, 2); }, "Structure of Earnings Survey");
    appendKpi(container, "Media mensile lorda", latestRecord(records, {
      geography_code: "IT", sex: "T", pay_concept: "gross_earnings", pay_period: "monthly", statistic: "mean"
    }), function (value) { return euro(value, 0); }, "Retribuzione mensile, non netto");
    appendKpi(container, "D9 / D1 orario", latestRecord(records, {
      geography_code: "IT", sex: "T", pay_concept: "gross_earnings_ratio", pay_period: "hourly", statistic: "d9_d1"
    }), function (value) { return fmt(value, 2) + "x"; }, "Rapporto tra salari alti e bassi");
    appendKpi(container, "Bassa retribuzione", latestRecord(records, {
      geography_code: "IT", pay_concept: "low_wage_earners", statistic: "share_below_two_thirds_median"
    }), percent, "Quota sotto due terzi della mediana");
    appendKpi(container, "Gender pay gap", latestRecord(records, {
      geography_code: "IT", pay_concept: "gender_pay_gap_unadjusted"
    }), percent, "Non corretto per composizione");
    appendKpi(container, "Costo orario lavoro", latestRecord(records, {
      geography_code: "IT", pay_concept: "labour_cost", sector: "B-S_X_O"
    }), function (value) { return euro(value, 1); }, "Costo del lavoro, non salario netto");
  }

  function statName(row) {
    if (row.percentile === 10) return "D1";
    if (row.percentile === 90) return "D9";
    return STAT_LABELS[row.statistic] || text(row.statistic);
  }

  function statOrder(row) {
    if (row.percentile === 10) return 1;
    if (row.statistic === "median") return 2;
    if (row.statistic === "mean") return 3;
    if (row.percentile === 90) return 4;
    return 9;
  }

  function renderDistribution() {
    var rows = distributionRows();
    var specs = [
      { key: "year", field: "year", label: "Anno", options: yearsFrom, includeTotals: true },
      { key: "geography_code", field: "geography_code", label: "Territorio", labelField: "geography_name", includeTotals: true },
      { key: "sex", field: "sex", label: "Sesso", labelField: "sex_label", includeTotals: true },
      { key: "pay_period", field: "pay_period", label: "Periodo", options: periodOptions, includeTotals: true }
    ];
    if (!state.distribution.year) {
      state.distribution.year = latestYear(rows, { geography_code: "IT", sex: "T", pay_period: "hourly" });
    }
    syncFilters("siDistributionFilters", specs, rows, state.distribution, renderAll);
    var selected = filterRows(rows, {
      year: state.distribution.year,
      geography_code: state.distribution.geography_code,
      sex: state.distribution.sex,
      pay_period: state.distribution.pay_period
    }).sort(function (a, b) { return statOrder(a) - statOrder(b); });
    byId("siDistributionTitle").textContent = "Distribuzione " + text(PERIOD_LABELS[state.distribution.pay_period], state.distribution.pay_period).toLowerCase();
    byId("siDistributionTag").textContent = text(state.distribution.year) + " · " + text(state.distribution.geography_code);
    if (!selected.length) {
      showEmpty("siDistributionChart", "Nessun punto distributivo disponibile per questa selezione.");
      return;
    }
    plot("siDistributionChart", [{
      type: "bar",
      x: selected.map(statName),
      y: selected.map(function (row) { return row.value; }),
      marker: { color: COLORS[0] },
      text: selected.map(function (row) { return euro(row.value, state.distribution.pay_period === "hourly" ? 2 : 0); }),
      textposition: "outside",
      hovertemplate: "%{x}<br>%{text}<extra></extra>"
    }], {
      yaxis: { title: "Euro", rangemode: "tozero" },
      xaxis: { title: "" }
    });
  }

  function periodOptions(rows) {
    return uniqueOptions(rows, "pay_period", null, true).map(function (option) {
      return { value: option.value, label: PERIOD_LABELS[option.value] || option.value };
    });
  }

  function statisticOptions(rows) {
    return uniqueOptions(rows, "statistic", null, true).filter(function (option) {
      return ["mean", "median"].indexOf(option.value) >= 0;
    }).map(function (option) {
      return { value: option.value, label: STAT_LABELS[option.value] || option.value };
    });
  }

  function seriesStatisticOptions(rows) {
    var base = statisticOptions(rows);
    return [{ value: "all", label: "Tutto" }].concat(base);
  }

  function dimensionOptions(keys, rows) {
    return keys.filter(function (key) {
      var dimension = DIMENSIONS[key];
      return rows.some(function (row) {
        return row[dimension.field] !== undefined && row[dimension.field] !== null && !isTotal(dimension.field, row[dimension.field]);
      });
    }).map(function (key) {
      return { value: key, label: DIMENSIONS[key].label };
    });
  }

  function analysisRows(targetState, dimensionKey) {
    var dimension = DIMENSIONS[dimensionKey];
    return grossRows().filter(function (row) {
      if (!dimension || row[dimension.field] === undefined || row[dimension.field] === null) return false;
      if (isTotal(dimension.field, row[dimension.field])) return false;
      if (targetState.year && String(row.year) !== String(targetState.year)) return false;
      if (targetState.geography_code && String(row.geography_code) !== String(targetState.geography_code)) return false;
      if (targetState.pay_period && String(row.pay_period) !== String(targetState.pay_period)) return false;
      if (targetState.statistic && String(row.statistic) !== String(targetState.statistic)) return false;
      if (dimension.field !== "sex" && targetState.sex && String(row.sex || "T") !== String(targetState.sex)) return false;
      return true;
    });
  }

  function renderBarByDimension(chartId, titleId, tagId, targetState, dimensionKeys, containerId) {
    var rows = grossRows();
    var activeDimension = DIMENSIONS[targetState.dimension] || DIMENSIONS[dimensionKeys[0]];
    var filterBaseRows = rows.filter(function (row) {
      if (!activeDimension || row[activeDimension.field] === undefined || row[activeDimension.field] === null) return false;
      return !isTotal(activeDimension.field, row[activeDimension.field]);
    });
    var specs = [
      { key: "dimension", label: "Dimensione", options: function () { return dimensionOptions(dimensionKeys, rows); } },
      { key: "year", field: "year", label: "Anno", options: yearsFrom, includeTotals: true },
      { key: "geography_code", field: "geography_code", label: "Territorio", labelField: "geography_name", includeTotals: true },
      { key: "sex", field: "sex", label: "Sesso", labelField: "sex_label", includeTotals: true },
      { key: "pay_period", field: "pay_period", label: "Periodo", options: periodOptions, includeTotals: true },
      { key: "statistic", field: "statistic", label: "Statistica", options: statisticOptions, includeTotals: true }
    ];
    if (!targetState.year) {
      targetState.year = latestYear(rows, { geography_code: "IT", pay_period: targetState.pay_period, statistic: targetState.statistic });
    }
    syncFilters(containerId, specs, filterBaseRows, targetState, renderAll);
    var dimension = DIMENSIONS[targetState.dimension];
    var selected = analysisRows(targetState, targetState.dimension);
    selected.sort(function (a, b) { return (toNumber(b.value) || 0) - (toNumber(a.value) || 0); });
    selected = selected.slice(0, 18).reverse();
    byId(titleId).textContent = dimension ? "Retribuzione per " + dimension.label.toLowerCase() : "Retribuzione";
    byId(tagId).textContent = [text(targetState.year), PERIOD_LABELS[targetState.pay_period] || targetState.pay_period, STAT_LABELS[targetState.statistic] || targetState.statistic].join(" · ");
    if (!selected.length || !dimension) {
      showEmpty(chartId, "Nessun dato disponibile per questa combinazione.");
      return;
    }
    plot(chartId, [{
      type: "bar",
      orientation: "h",
      x: selected.map(function (row) { return row.value; }),
      y: selected.map(function (row) { return optionLabel(row, dimension.field, dimension.labelField); }),
      marker: { color: COLORS[1] },
      hovertemplate: "%{y}<br>%{x:.2f} €<extra></extra>"
    }], {
      margin: { t: 22, r: 18, b: 52, l: 180 },
      xaxis: { title: "Euro", rangemode: "tozero" },
      yaxis: { title: "", automargin: true }
    });
  }

  function renderWorker() {
    renderBarByDimension("siWorkerChart", "siWorkerTitle", "siWorkerTag", state.worker, ["sex", "age_class", "education", "occupation", "seniority"], "siWorkerFilters");
    renderLowWage();
  }

  function renderJob() {
    renderBarByDimension("siJobChart", "siJobTitle", "siJobTag", state.job, ["sector", "working_time", "firm_size", "occupation", "contract_type"], "siJobFilters");
    renderSectorBox();
    renderLabourCost();
  }

  function sectorDistributionGroups() {
    var grouped = {};
    distributionRows().forEach(function (row) {
      if (!row.sector || isTotal("sector", row.sector)) return;
      if (String(row.year) !== String(state.job.year)) return;
      if (String(row.geography_code) !== String(state.job.geography_code)) return;
      if (String(row.sex || "T") !== String(state.job.sex)) return;
      if (String(row.pay_period) !== String(state.job.pay_period)) return;
      var key = String(row.sector);
      grouped[key] = grouped[key] || {
        sector: key,
        label: row.sector_label || key,
        d1: null,
        median: null,
        d9: null,
        mean: null
      };
      if (row.percentile === 10) grouped[key].d1 = row.value;
      if (row.percentile === 90) grouped[key].d9 = row.value;
      if (row.statistic === "median") grouped[key].median = row.value;
      if (row.statistic === "mean") grouped[key].mean = row.value;
    });
    return Object.keys(grouped).map(function (key) { return grouped[key]; }).filter(function (item) {
      return item.d1 !== null && item.median !== null && item.d9 !== null;
    }).sort(function (a, b) {
      return (toNumber(b.median) || 0) - (toNumber(a.median) || 0);
    });
  }

  function latestSectorBoxYear() {
    var years = {};
    distributionRows().forEach(function (row) {
      if (!row.sector || isTotal("sector", row.sector)) return;
      if (String(row.geography_code) !== String(state.job.geography_code)) return;
      if (String(row.sex || "T") !== String(state.job.sex)) return;
      if (String(row.pay_period) !== String(state.job.pay_period)) return;
      years[row.year] = true;
    });
    var ordered = Object.keys(years).map(Number).filter(Number.isFinite).sort(function (a, b) { return b - a; });
    return ordered.length ? ordered[0] : null;
  }

  function renderSectorPicker(groups) {
    var picker = byId("siSectorPicker");
    if (!picker) return;
    var available = groups.map(function (item) { return item.sector; });
    state.selectedSectors = state.selectedSectors.filter(function (sector) {
      return available.indexOf(sector) >= 0;
    });
    if (!state.selectedSectors.length) {
      state.selectedSectors = groups.slice(0, 6).map(function (item) { return item.sector; });
    }
    clear(picker);
    groups.forEach(function (item) {
      var label = document.createElement("label");
      var input = document.createElement("input");
      var span = document.createElement("span");
      input.type = "checkbox";
      input.value = item.sector;
      input.checked = state.selectedSectors.indexOf(item.sector) >= 0;
      input.addEventListener("change", function () {
        if (input.checked && state.selectedSectors.indexOf(item.sector) < 0) {
          state.selectedSectors.push(item.sector);
        } else if (!input.checked) {
          state.selectedSectors = state.selectedSectors.filter(function (sector) { return sector !== item.sector; });
        }
        renderSectorBox();
      });
      span.textContent = item.label;
      label.appendChild(input);
      label.appendChild(span);
      picker.appendChild(label);
    });
  }

  function renderSectorBox() {
    var groups = sectorDistributionGroups();
    renderSectorPicker(groups);
    var selected = groups.filter(function (item) {
      return state.selectedSectors.indexOf(item.sector) >= 0;
    }).slice().reverse();
    if (!selected.length) {
      showEmpty("siSectorBoxChart", "D1, mediana e D9 settoriali non disponibili per questa selezione.");
      return;
    }
    var rangeTraces = selected.map(function (item, index) {
      return {
        type: "scatter",
        mode: "lines",
        name: item.label,
        x: [item.d1, item.d9],
        y: [item.label, item.label],
        line: { color: COLORS[index % COLORS.length], width: 8 },
        hovertemplate: item.label + "<br>D1: " + euro(item.d1, 2) + "<br>D9: " + euro(item.d9, 2) + "<extra></extra>",
        showlegend: false
      };
    });
    var medianTrace = {
      type: "scatter",
      mode: "markers",
      name: "Mediana",
      x: selected.map(function (item) { return item.median; }),
      y: selected.map(function (item) { return item.label; }),
      marker: { color: cssVar("--text", "#f5f2ed"), size: 11, symbol: "diamond" },
      hovertemplate: "%{y}<br>Mediana: %{x:.2f} €<extra></extra>"
    };
    var meanTrace = {
      type: "scatter",
      mode: "markers",
      name: "Media",
      x: selected.map(function (item) { return item.mean; }),
      y: selected.map(function (item) { return item.label; }),
      marker: { color: COLORS[0], size: 9, symbol: "circle" },
      hovertemplate: "%{y}<br>Media: %{x:.2f} €<extra></extra>"
    };
    plot("siSectorBoxChart", rangeTraces.concat([medianTrace, meanTrace]), {
      margin: { t: 22, r: 18, b: 52, l: 210 },
      xaxis: { title: "Euro", rangemode: "tozero" },
      yaxis: { title: "", automargin: true }
    });
  }

  function renderLowWage() {
    var wanted = ["sex", "age_class", "education"];
    var dimensionKey = wanted.indexOf(state.worker.dimension) >= 0 ? state.worker.dimension : "sex";
    var dimension = DIMENSIONS[dimensionKey];
    var rows = state.records.filter(function (row) {
      if (row.pay_concept !== "low_wage_earners") return false;
      if (row.geography_code !== state.worker.geography_code) return false;
      if (row[dimension.field] === undefined || row[dimension.field] === null) return false;
      return !isTotal(dimension.field, row[dimension.field]) || dimension.field === "sex";
    });
    var year = latestYear(rows, {});
    rows = rows.filter(function (row) { return String(row.year) === String(year); });
    rows.sort(function (a, b) { return (toNumber(b.value) || 0) - (toNumber(a.value) || 0); });
    rows = rows.slice(0, 14).reverse();
    if (!rows.length) {
      showEmpty("siLowWageChart", "Quota low-wage non disponibile per questa dimensione.");
      return;
    }
    plot("siLowWageChart", [{
      type: "bar",
      orientation: "h",
      x: rows.map(function (row) { return row.value; }),
      y: rows.map(function (row) { return optionLabel(row, dimension.field, dimension.labelField); }),
      marker: { color: COLORS[4] },
      hovertemplate: "%{y}<br>%{x:.1f}%<extra></extra>"
    }], {
      margin: { t: 22, r: 18, b: 52, l: 170 },
      xaxis: { title: "% dipendenti", rangemode: "tozero" },
      yaxis: { title: "", automargin: true }
    });
  }

  function renderLabourCost() {
    var rows = state.records.filter(function (row) {
      return row.pay_concept === "labour_cost" && row.geography_code === state.job.geography_code;
    });
    var sectors = uniqueOptions(rows, "sector", "sector_label", false).slice(0, 5);
    var traces = sectors.map(function (sector, index) {
      var sectorRows = rows.filter(function (row) { return String(row.sector) === sector.value; }).sort(function (a, b) {
        return Number(a.year) - Number(b.year);
      });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: sector.label,
        x: sectorRows.map(function (row) { return row.year; }),
        y: sectorRows.map(function (row) { return row.value; }),
        line: { color: COLORS[index % COLORS.length], width: 3 },
        hovertemplate: "%{fullData.name}<br>%{x}: %{y:.1f} €<extra></extra>"
      };
    }).filter(function (trace) { return trace.x.length; });
    plot("siLabourCostChart", traces, {
      yaxis: { title: "Euro per ora", rangemode: "tozero" },
      xaxis: { title: "" }
    });
  }

  function renderTerritory() {
    var rows = distributionRows().filter(function (row) {
      return row.pay_period === "hourly" && row.statistic === "median" && row.sex === "T";
    });
    var year = latestYear(rows, {});
    rows = rows.filter(function (row) { return String(row.year) === String(year); });
    rows.sort(function (a, b) { return (toNumber(b.value) || 0) - (toNumber(a.value) || 0); });
    if (!rows.length) {
      showEmpty("siTerritoryChart", "Confronto territoriale non disponibile.");
      return;
    }
    plot("siTerritoryChart", [{
      type: "bar",
      x: rows.map(function (row) { return row.geography_name || row.geography_code; }),
      y: rows.map(function (row) { return row.value; }),
      marker: { color: rows.map(function (row) { return row.geography_code === "IT" ? COLORS[0] : COLORS[2]; }) },
      hovertemplate: "%{x}<br>%{y:.2f} €<extra></extra>"
    }], {
      yaxis: { title: "Mediana oraria lorda", rangemode: "tozero" },
      xaxis: { title: "" }
    });
  }

  function renderEurope() {
    var rows = distributionRows();
    var specs = [
      { key: "pay_period", field: "pay_period", label: "Periodo", options: periodOptions, includeTotals: true },
      { key: "statistic", field: "statistic", label: "Statistica", options: statisticOptions, includeTotals: true },
      { key: "sex", field: "sex", label: "Sesso", labelField: "sex_label", includeTotals: true }
    ];
    syncFilters("siEuropeFilters", specs, rows, state.europe, renderAll);
    var selected = rows.filter(function (row) {
      return row.pay_period === state.europe.pay_period && row.statistic === state.europe.statistic && row.sex === state.europe.sex;
    });
    var countries = ["IT", "EU27_2020", "DE", "FR", "ES", "NL"];
    var traces = countries.map(function (country, index) {
      var countryRows = selected.filter(function (row) { return row.geography_code === country; }).sort(function (a, b) {
        return Number(a.year) - Number(b.year);
      });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: countryRows[0] ? countryRows[0].geography_name : country,
        x: countryRows.map(function (row) { return row.year; }),
        y: countryRows.map(function (row) { return row.value; }),
        line: { color: COLORS[index % COLORS.length], width: country === "IT" ? 4 : 2 },
        hovertemplate: "%{fullData.name}<br>%{x}: %{y:.2f} €<extra></extra>"
      };
    }).filter(function (trace) { return trace.x.length; });
    plot("siEuropeChart", traces, {
      yaxis: { title: "Euro", rangemode: "tozero" },
      xaxis: { title: "" }
    });
    renderGenderGap();
  }

  function renderGenderGap() {
    var rows = state.records.filter(function (row) {
      return row.pay_concept === "gender_pay_gap_unadjusted";
    });
    var countries = ["IT", "EU27_2020", "DE", "FR", "ES", "NL"];
    var traces = countries.map(function (country, index) {
      var countryRows = rows.filter(function (row) { return row.geography_code === country; }).sort(function (a, b) {
        return Number(a.year) - Number(b.year);
      });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: countryRows[0] ? countryRows[0].geography_name : country,
        x: countryRows.map(function (row) { return row.year; }),
        y: countryRows.map(function (row) { return row.value; }),
        line: { color: COLORS[index % COLORS.length], width: country === "IT" ? 4 : 2 },
        hovertemplate: "%{fullData.name}<br>%{x}: %{y:.1f}%<extra></extra>"
      };
    }).filter(function (trace) { return trace.x.length; });
    plot("siGenderGapChart", traces, {
      yaxis: { title: "%", zeroline: true },
      xaxis: { title: "" }
    });
  }

  function renderSeries() {
    var rows = distributionRows().filter(function (row) {
      return row.geography_code === "IT";
    });
    var specs = [
      { key: "pay_period", field: "pay_period", label: "Periodo", options: periodOptions, includeTotals: true },
      { key: "statistic", field: "statistic", label: "Statistica", options: seriesStatisticOptions, includeTotals: true },
      { key: "sex", field: "sex", label: "Sesso", labelField: "sex_label", includeTotals: true }
    ];
    syncFilters("siSeriesFilters", specs, rows, state.series, renderAll);
    var selected = rows.filter(function (row) {
      var statOk = state.series.statistic === "all" || row.statistic === state.series.statistic;
      return row.pay_period === state.series.pay_period && statOk && row.sex === state.series.sex;
    }).sort(function (a, b) { return Number(a.year) - Number(b.year); });
    byId("siSeriesTitle").textContent = "Serie " + text(PERIOD_LABELS[state.series.pay_period], state.series.pay_period).toLowerCase();
    byId("siSeriesTag").textContent = state.series.statistic === "all" ? "tutte le misure" : STAT_LABELS[state.series.statistic] || state.series.statistic;
    if (!selected.length) {
      showEmpty("siSeriesChart", "Serie non disponibile per questa selezione.");
      return;
    }
    var seriesGroups = {};
    selected.forEach(function (row) {
      var key = statName(row);
      seriesGroups[key] = seriesGroups[key] || [];
      seriesGroups[key].push(row);
    });
    var traces = Object.keys(seriesGroups).sort().map(function (key, index) {
      var values = seriesGroups[key].sort(function (a, b) { return Number(a.year) - Number(b.year); });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: key,
        x: values.map(function (row) { return row.year; }),
        y: values.map(function (row) { return row.value; }),
        line: { color: COLORS[index % COLORS.length], width: key === "Mediana" ? 4 : 2 },
        hovertemplate: "%{fullData.name}<br>%{x}: %{y:.2f} €<extra></extra>"
      };
    });
    plot("siSeriesChart", traces, {
      yaxis: { title: "Euro", rangemode: "tozero" },
      xaxis: { title: "" }
    });
  }

  function renderMethod() {
    var notes = byId("siMethodNotes");
    var coverage = byId("siCoverageList");
    if (notes) {
      clear(notes);
      [
        "Retribuzione oraria, mensile e annuale sono periodi distinti e non vengono convertiti tra loro.",
        "Le retribuzioni pubblicate sono lorde; il netto non viene stimato nel browser.",
        "Il costo del lavoro proviene da una tavola separata e non rappresenta il salario ricevuto dal lavoratore.",
        "Le tavole 2022 su istruzione, anzianità e dimensione impresa sono punti dell'edizione SES 2022.",
        "Territorio di residenza, luogo di lavoro e sede dell'impresa non sono intercambiabili."
      ].forEach(function (note) {
        var item = document.createElement("li");
        item.textContent = note;
        notes.appendChild(item);
      });
    }
    if (coverage) {
      clear(coverage);
      toArray(state.payload && state.payload.coverage).forEach(function (item) {
        var node = document.createElement("div");
        var title = document.createElement("strong");
        var note = document.createElement("span");
        var status = document.createElement("em");
        node.className = "si-coverage-item";
        title.textContent = item.dimension || "Dimensione";
        note.textContent = (item.source ? item.source + ". " : "") + text(item.note, "");
        status.textContent = text(item.status, "status");
        node.appendChild(title);
        node.appendChild(note);
        node.appendChild(status);
        coverage.appendChild(node);
      });
    }
  }

  function renderAll() {
    renderKpis();
    renderDistribution();
    renderWorker();
    renderJob();
    renderTerritory();
    renderEurope();
    renderSeries();
    renderMethod();
  }

  function initializeDefaults() {
    var rows = distributionRows();
    state.distribution.year = latestYear(rows, { geography_code: "IT", sex: "T", pay_period: "hourly" });
    state.worker.year = latestYear(grossRows(), { geography_code: "IT", sex: "T", pay_period: "hourly", statistic: "median" });
    state.job.year = latestSectorBoxYear() || state.worker.year;
  }

  function load() {
    fetch(dataUrl(), { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (payload) {
        state.payload = payload;
        state.records = toArray(payload.records);
        initializeDefaults();
        setStatus("Dati caricati: " + fmt(state.records.length, 0) + " osservazioni. Aggiornamento " + text(payload.meta && payload.meta.updated_at, MISSING) + ".");
        renderAll();
      })
      .catch(function (error) {
        setStatus("Non riesco a caricare i dati salari: " + error.message, true);
        ["siDistributionChart", "siWorkerChart", "siLowWageChart", "siSectorBoxChart", "siJobChart", "siLabourCostChart", "siTerritoryChart", "siEuropeChart", "siGenderGapChart", "siSeriesChart"].forEach(function (id) {
          showEmpty(id, "Dati non disponibili.");
        });
      });
  }

  document.addEventListener("DOMContentLoaded", load);
  new MutationObserver(function () {
    if (state.records.length) renderAll();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
})();
