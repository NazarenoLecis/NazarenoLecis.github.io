(function () {
  "use strict";

  var DATA_SOURCES = [
    "../../data/demografia/dashboard.json?v=20260722-2",
    "https://data.nazarenolecis.com/demografia/dashboard.json?v=20260722-2"
  ];

  var STATE = {
    payload: null,
    kebabTerritory: "country:ITA",
    kebabYear: null,
    seriesTerritory: "country:ITA",
    seriesMetric: "population_total",
    ageSharesTerritory: "country:ITA",
    regionalMetric: "share_65_plus",
    regionalYear: null,
    regionalFocus: null,
    regionalSeriesMetric: "share_65_plus",
    educationCountry: "ITA",
    educationAge: "25-64",
    educationSex: "T",
    educationYear: null,
    tertiaryCountry: "ITA",
    tertiaryAge: "25-64",
    tertiarySex: "T",
    tertiaryLevel: "tertiary",
    europeMetric: "share_65_plus",
    europeYear: null,
    europeCountry: "DEU",
    europeSeriesMetric: "share_65_plus"
  };

  var COLORS = {
    orange: "#ff5a1f",
    blue: "#5d8fd7",
    teal: "#3aa6a1",
    green: "#65a96b",
    red: "#d96666",
    purple: "#9c7ad9",
    yellow: "#d9ad48",
    gray: "#8f8f8f"
  };

  var METRICS = {
    population_total: { label: "Popolazione totale", format: formatMillions, axis: "Milioni", scale: 1000000 },
    share_0_14: { label: "Quota 0-14", format: formatPercent, axis: "% popolazione", suffix: "%" },
    share_15_64: { label: "Quota 15-64", format: formatPercent, axis: "% popolazione", suffix: "%" },
    share_65_plus: { label: "Quota 65+", format: formatPercent, axis: "% popolazione", suffix: "%" },
    share_80_plus: { label: "Quota 80+", format: formatPercent, axis: "% popolazione", suffix: "%" },
    median_age: { label: "Eta' mediana", format: function (v) { return formatNumber(v) + " anni"; }, axis: "Anni" },
    dependency_old: { label: "Dipendenza anziani", format: function (v) { return formatDecimal(v, 1); }, axis: "Ogni 100 persone 15-64" },
    total_fertility_rate: { label: "Fecondita'", format: function (v) { return formatDecimal(v, 2); }, axis: "Figli per donna" },
    balance_gbirthrt: { label: "Natalita'", format: function (v) { return formatDecimal(v, 1); }, axis: "Nati per 1.000 abitanti" },
    net_migration_adjustment: { label: "Saldo migratorio", format: formatSigned, axis: "Persone" },
    tertiary_25_64: { label: "Laurea 25-64", format: formatPercent, axis: "% popolazione 25-64", suffix: "%" }
  };

  var EDUCATION_LABELS = {
    low_education: "Fino alla licenza media",
    upper_secondary_or_more: "Secondaria o terziaria",
    upper_secondary_post_secondary: "Secondaria superiore",
    upper_secondary_general: "Secondaria generale",
    upper_secondary_vocational: "Secondaria professionale",
    tertiary: "Terziario"
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function sortByYear(rows) {
    return rows.slice().sort(function (a, b) { return Number(a.year || 0) - Number(b.year || 0); });
  }

  function latest(rows, predicate) {
    var candidates = rows.filter(function (row) {
      return toNumber(row.year) !== null && (!predicate || predicate(row));
    });
    return candidates.length ? sortByYear(candidates).pop() : null;
  }

  function latestNonNull(rows, field, predicate) {
    return latest(rows, function (row) {
      return toNumber(row[field]) !== null && (!predicate || predicate(row));
    });
  }

  function unique(values) {
    return Array.from(new Set(values.filter(function (value) {
      return value !== null && value !== undefined && value !== "";
    })));
  }

  function median(values) {
    var clean = values.map(toNumber).filter(function (value) { return value !== null; }).sort(function (a, b) { return a - b; });
    if (!clean.length) return null;
    var mid = Math.floor(clean.length / 2);
    return clean.length % 2 ? clean[mid] : (clean[mid - 1] + clean[mid]) / 2;
  }

  function formatNumber(value, digits) {
    var parsed = toNumber(value);
    if (parsed === null) return "ND";
    return parsed.toLocaleString("it-IT", { minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0 });
  }

  function formatDecimal(value, digits) {
    var parsed = toNumber(value);
    if (parsed === null) return "ND";
    return parsed.toLocaleString("it-IT", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function formatMillions(value) {
    var parsed = toNumber(value);
    if (parsed === null) return "ND";
    return formatDecimal(parsed / 1000000, 1) + " mln";
  }

  function formatPercent(value, digits) {
    var parsed = toNumber(value);
    if (parsed === null) return "ND";
    return formatDecimal(parsed, digits === undefined ? 1 : digits) + "%";
  }

  function formatSigned(value) {
    var parsed = toNumber(value);
    if (parsed === null) return "ND";
    return (parsed > 0 ? "+" : "") + formatNumber(parsed);
  }

  function scaledValue(value, metric) {
    var parsed = toNumber(value);
    if (parsed === null) return null;
    return metric && metric.scale ? parsed / metric.scale : parsed;
  }

  function sexLabel(value) {
    if (value === "M") return "Uomini";
    if (value === "F") return "Donne";
    return "Totale";
  }

  function setStatus(message, state) {
    var node = byId("diStatus");
    if (!node) return;
    node.textContent = message;
    if (state) node.dataset.state = state;
    else node.removeAttribute("data-state");
  }

  function showEmpty(id, message) {
    var node = byId(id);
    if (!node) return;
    if (window.Plotly) {
      try { window.Plotly.purge(node); } catch (error) {}
    }
    node.innerHTML = "";
    var empty = document.createElement("div");
    empty.className = "di-empty";
    empty.textContent = message || "Dati non disponibili.";
    node.appendChild(empty);
  }

  function axisDefaults(axis) {
    var text = cssVar("--text") || "#f5f2ed";
    var muted = cssVar("--muted") || "#b9b2aa";
    var line = cssVar("--line") || "#303030";
    return Object.assign({
      automargin: true,
      gridcolor: line,
      linecolor: line,
      zerolinecolor: line,
      tickfont: { color: muted },
      title: { font: { color: text } }
    }, axis || {});
  }

  function baseLayout(layout) {
    var text = cssVar("--text") || "#f5f2ed";
    var merged = Object.assign({
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: "system-ui, -apple-system, Segoe UI, sans-serif", color: text },
      margin: { l: 64, r: 34, t: 18, b: 58 },
      hovermode: "x unified",
      legend: { orientation: "h", x: 0, y: -0.18, font: { color: text } }
    }, layout || {});
    merged.xaxis = axisDefaults(merged.xaxis);
    merged.yaxis = axisDefaults(merged.yaxis);
    if (merged.xaxis2) merged.xaxis2 = axisDefaults(merged.xaxis2);
    if (merged.yaxis2) merged.yaxis2 = axisDefaults(merged.yaxis2);
    return merged;
  }

  function plot(id, traces, layout) {
    var node = byId(id);
    if (!node) return;
    if (!traces || !traces.length) {
      showEmpty(id);
      return;
    }
    if (!window.Plotly) {
      showEmpty(id, "Plotly non caricato.");
      return;
    }
    window.Plotly.react(node, traces, baseLayout(layout), {
      responsive: true,
      displayModeBar: false,
      displaylogo: false
    }).catch(function () {
      showEmpty(id, "Grafico non disponibile.");
    });
  }

  function fetchJsonFrom(index) {
    if (index >= DATA_SOURCES.length) return Promise.reject(new Error("Nessuna sorgente dati disponibile"));
    return fetch(DATA_SOURCES[index], { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    }).catch(function () {
      return fetchJsonFrom(index + 1);
    });
  }

  function countryName(payload, iso3) {
    var row = (payload.country_age_structure || []).find(function (item) { return item.iso3 === iso3 && item.geo_name; });
    return row ? row.geo_name : iso3;
  }

  function countryOptions(payload) {
    return unique((payload.country_age_structure || []).map(function (row) { return row.iso3; }))
      .sort(function (a, b) { return countryName(payload, a).localeCompare(countryName(payload, b), "it"); })
      .map(function (iso3) { return { value: iso3, label: countryName(payload, iso3) }; });
  }

  function regionOptions(payload) {
    var byCode = {};
    (payload.regional_age_structure || []).forEach(function (row) {
      byCode[row.geo_code] = row.geo_name || row.geo_code;
    });
    return Object.keys(byCode).sort(function (a, b) { return byCode[a].localeCompare(byCode[b], "it"); })
      .map(function (code) { return { value: code, label: byCode[code] }; });
  }

  function territoryOptions(payload) {
    return [{ value: "country:ITA", label: "Italia" }].concat(regionOptions(payload).map(function (item) {
      return { value: "region:" + item.value, label: item.label };
    }));
  }

  function fillSelect(id, options, value, onChange) {
    var node = byId(id);
    if (!node) return;
    node.innerHTML = options.map(function (option) {
      return "<option value=\"" + option.value + "\">" + option.label + "</option>";
    }).join("");
    if (value !== null && value !== undefined) node.value = String(value);
    node.onchange = function () {
      onChange(node.value);
      renderAll(STATE.payload);
    };
  }

  function rowsForTerritory(payload, territory) {
    if (territory && territory.indexOf("region:") === 0) {
      var code = territory.split(":")[1];
      return sortByYear((payload.regional_age_structure || []).filter(function (row) { return row.geo_code === code; }));
    }
    var iso3 = territory && territory.indexOf("country:") === 0 ? territory.split(":")[1] : "ITA";
    return sortByYear((payload.country_age_structure || []).filter(function (row) { return row.iso3 === iso3; }));
  }

  function preferredRows(rows) {
    var byYear = {};
    rows.forEach(function (row) {
      var year = toNumber(row.year);
      if (year === null) return;
      if (!byYear[year] || row.status === "observed") byYear[year] = row;
    });
    return sortByYear(Object.keys(byYear).map(function (year) { return byYear[year]; }));
  }

  function metricRows(payload, metric, scope) {
    if (metric === "total_fertility_rate") {
      return (scope === "region" ? payload.regional_fertility : payload.country_fertility || []).filter(function (row) {
        return row.indicator === "total_fertility_rate" || row.indicator === "fertility_nr";
      }).map(function (row) { return Object.assign({}, row, { metric_value: row.value }); });
    }
    if (metric === "balance_gbirthrt" || metric === "net_migration_adjustment") {
      return (scope === "region" ? payload.regional_demographic_balance : payload.country_demographic_balance || []).map(function (row) {
        return Object.assign({}, row, { metric_value: row[metric] });
      });
    }
    if (metric === "tertiary_25_64") {
      return (payload.education_attainment || []).filter(function (row) {
        return row.age_label === "25-64" && row.sex === "T" && row.education_level === "tertiary";
      }).map(function (row) { return Object.assign({}, row, { metric_value: row.value }); });
    }
    return (scope === "region" ? payload.regional_age_structure : payload.country_age_structure || []).map(function (row) {
      return Object.assign({}, row, { metric_value: row[metric] });
    });
  }

  function createKpi(label, value, tag, note) {
    var item = document.createElement("div");
    item.className = "di-kpi";
    item.innerHTML = "<span>" + label + "</span><strong>" + value + "</strong><em>" + tag + "</em><small>" + note + "</small>";
    return item;
  }

  function renderKpis(payload) {
    var node = byId("diKpis");
    if (!node) return;
    node.innerHTML = "";
    var observed = latest(payload.age_structure || [], function (row) { return row.status === "observed"; });
    var projected = latest(payload.age_structure || [], function (row) { return row.status === "projected"; });
    var fertility = latestNonNull(payload.fertility || [], "value");
    var birthRate = latestNonNull(payload.demographic_balance || [], "balance_gbirthrt");
    var migration = latestNonNull(payload.demographic_balance || [], "net_migration_adjustment");
    var tertiary = latestNonNull(payload.education_attainment || [], "value", function (row) {
      return row.iso3 === "ITA" && row.age_label === "25-64" && row.sex === "T" && row.education_level === "tertiary";
    });
    [
      createKpi("Popolazione", formatMillions(observed && observed.population_total), observed ? observed.year + " osservato" : "ND", "Residenti totali a inizio anno."),
      createKpi("Eta' mediana", formatNumber(observed && observed.median_age) + " anni", observed ? observed.year + " osservato" : "ND", "Mediana della distribuzione per eta'."),
      createKpi("Quota 65+", formatPercent(observed && observed.share_65_plus), observed ? observed.year + " osservato" : "ND", "Peso della popolazione in eta' anziana."),
      createKpi("Dipendenza anziani", formatDecimal(observed && observed.dependency_old, 1), "ogni 100 persone 15-64", "Rapporto strutturale tra 65+ e eta' attiva."),
      createKpi("Fecondita'", formatDecimal(fertility && fertility.value, 2), fertility ? fertility.year + " Eurostat" : "ND", "Figli per donna."),
      createKpi("Natalita'", formatDecimal(birthRate && birthRate.balance_gbirthrt, 1), birthRate ? birthRate.year + " per 1.000" : "ND", "Nati vivi per 1.000 abitanti."),
      createKpi("Saldo migratorio", formatSigned(migration && migration.net_migration_adjustment), migration ? migration.year + " persone" : "ND", "Saldo con aggiustamento statistico."),
      createKpi("Laurea 25-64", formatPercent(tertiary && tertiary.value), tertiary ? tertiary.year + " totale" : "ND", "Quota con istruzione terziaria."),
      createKpi("Popolazione 2050", formatMillions(projected && projected.population_total), projected ? projected.year + " proiezione" : "ND", projected ? "Scenario " + projected.scenario + "." : "Proiezione non disponibile.")
    ].forEach(function (item) { node.appendChild(item); });
  }

  function renderControls(payload) {
    var territories = territoryOptions(payload);
    fillSelect("diKebabTerritory", territories, STATE.kebabTerritory, function (value) {
      STATE.kebabTerritory = value;
      STATE.kebabYear = null;
    });
    fillSelect("diSeriesTerritory", territories, STATE.seriesTerritory, function (value) { STATE.seriesTerritory = value; });
    fillSelect("diAgeSharesTerritory", territories, STATE.ageSharesTerritory, function (value) { STATE.ageSharesTerritory = value; });
    fillSelect("diSeriesMetric", Array.from(byId("diSeriesMetric").options).map(function (o) { return { value: o.value, label: o.textContent }; }), STATE.seriesMetric, function (value) { STATE.seriesMetric = value; });

    var regions = regionOptions(payload);
    if (!STATE.regionalFocus && regions.length) STATE.regionalFocus = regions[0].value;
    fillSelect("diRegionalFocus", regions, STATE.regionalFocus, function (value) { STATE.regionalFocus = value; });
    fillSelect("diRegionalMetric", selectOptions("diRegionalMetric"), STATE.regionalMetric, function (value) {
      STATE.regionalMetric = value;
      STATE.regionalYear = null;
    });
    fillSelect("diRegionalSeriesMetric", selectOptions("diRegionalSeriesMetric"), STATE.regionalSeriesMetric, function (value) { STATE.regionalSeriesMetric = value; });

    var countries = countryOptions(payload);
    fillSelect("diEducationCountry", countries, STATE.educationCountry, function (value) { STATE.educationCountry = value; STATE.educationYear = null; });
    fillSelect("diTertiaryCountry", countries, STATE.tertiaryCountry, function (value) { STATE.tertiaryCountry = value; });
    fillSelect("diEuropeCountry", countries.filter(function (item) { return item.value !== "ITA"; }), STATE.europeCountry, function (value) { STATE.europeCountry = value; });
    fillSelect("diEuropeMetric", selectOptions("diEuropeMetric"), STATE.europeMetric, function (value) { STATE.europeMetric = value; STATE.europeYear = null; });
    fillSelect("diEuropeSeriesMetric", selectOptions("diEuropeSeriesMetric"), STATE.europeSeriesMetric, function (value) { STATE.europeSeriesMetric = value; });

    fillEducationControls(payload);
  }

  function selectOptions(id) {
    var node = byId(id);
    return node ? Array.from(node.options).map(function (option) { return { value: option.value, label: option.textContent }; }) : [];
  }

  function fillEducationControls(payload) {
    var rows = payload.education_attainment || [];
    var ages = unique(rows.map(function (row) { return row.age_label; })).sort();
    var sexes = ["T", "M", "F"].filter(function (sex) { return rows.some(function (row) { return row.sex === sex; }); });
    var levels = unique(rows.map(function (row) { return row.education_level; })).sort();
    fillSelect("diEducationAge", ages.map(function (age) { return { value: age, label: age }; }), STATE.educationAge, function (value) { STATE.educationAge = value; STATE.educationYear = null; });
    fillSelect("diEducationSex", sexes.map(function (sex) { return { value: sex, label: sexLabel(sex) }; }), STATE.educationSex, function (value) { STATE.educationSex = value; STATE.educationYear = null; });
    fillSelect("diTertiaryAge", ages.map(function (age) { return { value: age, label: age }; }), STATE.tertiaryAge, function (value) { STATE.tertiaryAge = value; });
    fillSelect("diTertiarySex", sexes.map(function (sex) { return { value: sex, label: sexLabel(sex) }; }), STATE.tertiarySex, function (value) { STATE.tertiarySex = value; });
    fillSelect("diTertiaryLevel", levels.map(function (level) { return { value: level, label: EDUCATION_LABELS[level] || level }; }), STATE.tertiaryLevel, function (value) { STATE.tertiaryLevel = value; });

    var years = unique(rows.filter(function (row) {
      return row.iso3 === STATE.educationCountry && row.age_label === STATE.educationAge && row.sex === STATE.educationSex;
    }).map(function (row) { return row.year; })).sort(function (a, b) { return a - b; });
    if (!STATE.educationYear || years.indexOf(Number(STATE.educationYear)) === -1) STATE.educationYear = years[years.length - 1];
    fillSelect("diEducationYear", years.map(function (year) { return { value: year, label: String(year) }; }), STATE.educationYear, function (value) { STATE.educationYear = Number(value); });
  }

  function renderKebabControls(payload) {
    var rows = STATE.kebabTerritory.indexOf("region:") === 0 ? payload.regional_population_age_sex || [] : payload.population_age_sex || [];
    var code = STATE.kebabTerritory.split(":")[1];
    var filtered = rows.filter(function (row) {
      return STATE.kebabTerritory.indexOf("region:") === 0 ? row.geo_code === code : row.iso3 === code;
    });
    var years = unique(filtered.map(function (row) { return row.year; })).sort(function (a, b) { return a - b; });
    if (!STATE.kebabYear || years.indexOf(Number(STATE.kebabYear)) === -1) {
      STATE.kebabYear = payload.meta && payload.meta.latest_observed_year || years[years.length - 1];
      if (years.indexOf(Number(STATE.kebabYear)) === -1) STATE.kebabYear = years[years.length - 1];
    }
    fillSelect("diKebabYear", years.map(function (year) {
      return { value: year, label: String(year) };
    }), STATE.kebabYear, function (value) { STATE.kebabYear = Number(value); });
  }

  function renderKebabChart(payload) {
    renderKebabControls(payload);
    var rows = STATE.kebabTerritory.indexOf("region:") === 0 ? payload.regional_population_age_sex || [] : payload.population_age_sex || [];
    var code = STATE.kebabTerritory.split(":")[1];
    var filtered = rows.filter(function (row) {
      var match = STATE.kebabTerritory.indexOf("region:") === 0 ? row.geo_code === code : row.iso3 === code;
      return match && Number(row.year) === Number(STATE.kebabYear) && (row.sex === "M" || row.sex === "F");
    });
    var hasObserved = filtered.some(function (row) { return row.status === "observed"; });
    filtered = filtered.filter(function (row) { return row.status === (hasObserved ? "observed" : "projected"); });
    var byAge = {};
    filtered.forEach(function (row) {
      var age = toNumber(row.age_low);
      if (age === null) return;
      var key = row.age_label || String(age);
      if (!byAge[key]) byAge[key] = { label: key, low: age, M: 0, F: 0 };
      byAge[key][row.sex] += toNumber(row.value) || 0;
    });
    var ages = Object.keys(byAge).map(function (key) { return byAge[key]; }).sort(function (a, b) { return a.low - b.low; });
    if (!ages.length) return showEmpty("diKebabChart");
    var male = ages.map(function (row) { return -row.M / 1000000; });
    var female = ages.map(function (row) { return row.F / 1000000; });
    var maxValue = Math.max.apply(null, male.concat(female).map(Math.abs)) || 1;
    var limit = Math.ceil(maxValue * 12) / 10;
    var tickValues = [-limit, -limit / 2, 0, limit / 2, limit];
    var tag = byId("diKebabTag");
    if (tag) tag.textContent = (STATE.kebabTerritory.indexOf("region:") === 0 ? "Regione" : "Italia") + ", " + STATE.kebabYear;
    plot("diKebabChart", [
      { type: "bar", orientation: "h", name: "Uomini", x: male, y: ages.map(function (r) { return r.label; }), marker: { color: COLORS.blue }, customdata: ages.map(function (r) { return r.M; }), hovertemplate: "Eta' %{y}<br>Uomini: %{customdata:,.0f}<extra></extra>" },
      { type: "bar", orientation: "h", name: "Donne", x: female, y: ages.map(function (r) { return r.label; }), marker: { color: COLORS.orange }, customdata: ages.map(function (r) { return r.F; }), hovertemplate: "Eta' %{y}<br>Donne: %{customdata:,.0f}<extra></extra>" }
    ], {
      barmode: "relative",
      bargap: 0.05,
      hovermode: "closest",
      xaxis: { title: { text: "Milioni di persone" }, range: [-limit, limit], tickvals: tickValues, ticktext: tickValues.map(function (v) { return Math.abs(v).toLocaleString("it-IT", { maximumFractionDigits: 1 }); }) },
      yaxis: { title: { text: "Eta'" } }
    });
  }

  function renderPopulationChart(payload) {
    var metric = METRICS[STATE.seriesMetric];
    var rows = rowsForTerritory(payload, STATE.seriesTerritory).filter(function (row) { return toNumber(row[STATE.seriesMetric]) !== null; });
    var observed = sortByYear(rows.filter(function (row) { return row.status !== "projected"; }));
    var projected = sortByYear(rows.filter(function (row) { return row.status === "projected"; }));
    var traces = [];
    if (observed.length) traces.push({ type: "scatter", mode: "lines+markers", name: "Osservato", x: observed.map(function (r) { return r.year; }), y: observed.map(function (r) { return scaledValue(r[STATE.seriesMetric], metric); }), line: { color: COLORS.orange, width: 3 } });
    if (projected.length) traces.push({ type: "scatter", mode: "lines+markers", name: "Proiezione", x: projected.map(function (r) { return r.year; }), y: projected.map(function (r) { return scaledValue(r[STATE.seriesMetric], metric); }), line: { color: COLORS.blue, width: 3, dash: "dash" } });
    plot("diPopulationChart", traces, { yaxis: { title: { text: metric.axis }, ticksuffix: metric.suffix || "" } });
  }

  function renderAgeSharesChart(payload) {
    var rows = preferredRows(rowsForTerritory(payload, STATE.ageSharesTerritory));
    var traces = [["0-14", "share_0_14", COLORS.teal], ["15-64", "share_15_64", COLORS.blue], ["65+", "share_65_plus", COLORS.orange], ["80+", "share_80_plus", COLORS.purple]].map(function (spec) {
      return { type: "scatter", mode: "lines+markers", name: spec[0], x: rows.map(function (r) { return r.year; }), y: rows.map(function (r) { return r[spec[1]]; }), line: { color: spec[2], width: 3 } };
    });
    plot("diAgeSharesChart", traces, { yaxis: { title: { text: "% popolazione" }, ticksuffix: "%" } });
  }

  function renderAgeDistributionChart(payload) {
    var rows = preferredRows(payload.age_structure || []);
    var specs = [["P10", "age_p10", COLORS.teal, "dot"], ["P25", "age_p25", COLORS.green, "dot"], ["Mediana", "median_age", COLORS.orange, "solid"], ["Media", "mean_age", COLORS.blue, "solid"], ["P75", "age_p75", COLORS.purple, "dot"], ["P90", "age_p90", COLORS.red, "dot"]];
    plot("diAgeDistributionChart", specs.map(function (spec) {
      return { type: "scatter", mode: "lines+markers", name: spec[0], x: rows.map(function (r) { return r.year; }), y: rows.map(function (r) { return r[spec[1]]; }), line: { color: spec[2], width: spec[0] === "Mediana" ? 4 : 2, dash: spec[3] } };
    }), { yaxis: { title: { text: "Anni" } } });
  }

  function renderDependencyChart(payload) {
    var rows = preferredRows(payload.age_structure || []);
    plot("diDependencyChart", [
      { type: "scatter", mode: "lines+markers", name: "Dipendenza anziani", x: rows.map(function (r) { return r.year; }), y: rows.map(function (r) { return r.dependency_old; }), line: { color: COLORS.orange, width: 3 } },
      { type: "scatter", mode: "lines+markers", name: "Dipendenza totale", x: rows.map(function (r) { return r.year; }), y: rows.map(function (r) { return r.dependency_total; }), line: { color: COLORS.blue, width: 3 } }
    ], { yaxis: { title: { text: "Persone ogni 100 attivi" } } });
  }

  function renderRegionalControls(payload) {
    var rows = metricRows(payload, STATE.regionalMetric, "region").filter(function (row) { return toNumber(row.metric_value) !== null; });
    var years = unique(rows.map(function (row) { return row.year; })).sort(function (a, b) { return a - b; });
    if (!STATE.regionalYear || years.indexOf(Number(STATE.regionalYear)) === -1) STATE.regionalYear = years[years.length - 1];
    fillSelect("diRegionalYear", years.map(function (year) { return { value: year, label: String(year) }; }), STATE.regionalYear, function (value) { STATE.regionalYear = Number(value); });
  }

  function renderRegionalRankChart(payload) {
    renderRegionalControls(payload);
    var metric = METRICS[STATE.regionalMetric];
    var rows = metricRows(payload, STATE.regionalMetric, "region").filter(function (row) {
      return Number(row.year) === Number(STATE.regionalYear) && toNumber(row.metric_value) !== null;
    }).sort(function (a, b) { return toNumber(a.metric_value) - toNumber(b.metric_value); });
    var tag = byId("diRegionalRankTag");
    if (tag) tag.textContent = metric.label + ", " + STATE.regionalYear;
    plot("diRegionalRankChart", [{
      type: "bar",
      orientation: "h",
      name: metric.label,
      x: rows.map(function (row) { return scaledValue(row.metric_value, metric); }),
      y: rows.map(function (row) { return row.geo_name; }),
      marker: { color: rows.map(function (row) { return row.geo_code === STATE.regionalFocus ? COLORS.orange : COLORS.blue; }) }
    }], { xaxis: { title: { text: metric.axis }, ticksuffix: metric.suffix || "" }, margin: { l: 150, r: 34, t: 18, b: 58 } });
  }

  function renderRegionalSeriesChart(payload) {
    var metric = METRICS[STATE.regionalSeriesMetric];
    var rows = sortByYear(metricRows(payload, STATE.regionalSeriesMetric, "region").filter(function (row) {
      return row.geo_code === STATE.regionalFocus && toNumber(row.metric_value) !== null;
    }));
    var tag = byId("diRegionalSeriesTag");
    if (tag && rows[0]) tag.textContent = rows[0].geo_name + " - " + metric.label;
    plot("diRegionalSeriesChart", [{ type: "scatter", mode: "lines+markers", name: metric.label, x: rows.map(function (r) { return r.year; }), y: rows.map(function (r) { return scaledValue(r.metric_value, metric); }), line: { color: COLORS.orange, width: 3 } }], { yaxis: { title: { text: metric.axis }, ticksuffix: metric.suffix || "" } });
  }

  function renderFertilityChart(payload) {
    var fertility = sortByYear(payload.fertility || []);
    var balance = sortByYear((payload.demographic_balance || []).filter(function (row) { return toNumber(row.balance_gbirthrt) !== null; }));
    plot("diFertilityChart", [
      { type: "scatter", mode: "lines+markers", name: "Fecondita'", x: fertility.map(function (r) { return r.year; }), y: fertility.map(function (r) { return r.value; }), line: { color: COLORS.orange, width: 3 } },
      { type: "scatter", mode: "lines+markers", name: "Natalita'", x: balance.map(function (r) { return r.year; }), y: balance.map(function (r) { return r.balance_gbirthrt; }), yaxis: "y2", line: { color: COLORS.teal, width: 3 } }
    ], { yaxis: { title: { text: "Figli per donna" } }, yaxis2: { title: { text: "Nati per 1.000 abitanti" }, overlaying: "y", side: "right" } });
  }

  function renderMigrationChart(payload) {
    var rows = sortByYear((payload.demographic_balance || []).filter(function (row) { return toNumber(row.immigration) !== null && toNumber(row.net_migration_adjustment) !== null; }));
    plot("diMigrationChart", [
      { type: "bar", name: "Immigrazione", x: rows.map(function (r) { return r.year; }), y: rows.map(function (r) { return toNumber(r.immigration) / 1000; }), marker: { color: COLORS.green } },
      { type: "bar", name: "Emigrazione stimata", x: rows.map(function (r) { return r.year; }), y: rows.map(function (r) { return -((toNumber(r.immigration) - toNumber(r.net_migration_adjustment)) / 1000); }), marker: { color: COLORS.red } },
      { type: "scatter", mode: "lines+markers", name: "Saldo", x: rows.map(function (r) { return r.year; }), y: rows.map(function (r) { return toNumber(r.net_migration_adjustment) / 1000; }), line: { color: COLORS.orange, width: 3 } }
    ], { barmode: "relative", yaxis: { title: { text: "Migliaia di persone" }, zeroline: true } });
  }

  function renderEducationChart(payload) {
    fillEducationControls(payload);
    var rows = (payload.education_attainment || []).filter(function (row) {
      return row.iso3 === STATE.educationCountry && row.age_label === STATE.educationAge && row.sex === STATE.educationSex && Number(row.year) === Number(STATE.educationYear);
    });
    rows = rows.filter(function (row) { return row.education_level !== "upper_secondary_or_more"; }).sort(function (a, b) { return (toNumber(b.value) || 0) - (toNumber(a.value) || 0); });
    var tag = byId("diEducationTag");
    if (tag) tag.textContent = countryName(payload, STATE.educationCountry) + ", " + STATE.educationAge + ", " + sexLabel(STATE.educationSex) + ", " + STATE.educationYear;
    plot("diEducationChart", [{ type: "bar", name: "Quota", x: rows.map(function (r) { return EDUCATION_LABELS[r.education_level] || r.education_level; }), y: rows.map(function (r) { return r.value; }), marker: { color: [COLORS.orange, COLORS.blue, COLORS.teal, COLORS.purple, COLORS.yellow] } }], { yaxis: { title: { text: "% popolazione" }, ticksuffix: "%" } });
  }

  function renderEducationTrendChart(payload) {
    var rows = sortByYear((payload.education_attainment || []).filter(function (row) {
      return row.iso3 === STATE.tertiaryCountry && row.age_label === STATE.tertiaryAge && row.sex === STATE.tertiarySex && row.education_level === STATE.tertiaryLevel;
    }));
    var pop = sortByYear((payload.country_age_structure || []).filter(function (row) { return row.iso3 === STATE.tertiaryCountry && row.status === "observed"; }));
    plot("diTertiaryChart", [
      { type: "scatter", mode: "lines+markers", name: EDUCATION_LABELS[STATE.tertiaryLevel] || STATE.tertiaryLevel, x: rows.map(function (r) { return r.year; }), y: rows.map(function (r) { return r.value; }), line: { color: COLORS.orange, width: 3 } },
      { type: "scatter", mode: "lines+markers", name: "Popolazione totale", x: pop.map(function (r) { return r.year; }), y: pop.map(function (r) { return toNumber(r.population_total) / 1000000; }), yaxis: "y2", line: { color: COLORS.blue, width: 3, dash: "dot" } }
    ], { yaxis: { title: { text: "% livello selezionato" }, ticksuffix: "%" }, yaxis2: { title: { text: "Milioni residenti" }, overlaying: "y", side: "right" } });
  }

  function renderEuropeControls(payload) {
    var rows = metricRows(payload, STATE.europeMetric, "country").filter(function (row) { return toNumber(row.metric_value) !== null; });
    var years = unique(rows.map(function (row) { return row.year; })).sort(function (a, b) { return a - b; });
    if (!STATE.europeYear || years.indexOf(Number(STATE.europeYear)) === -1) STATE.europeYear = Math.min(2024, years[years.length - 1]);
    fillSelect("diEuropeYear", years.map(function (year) { return { value: year, label: String(year) }; }), STATE.europeYear, function (value) { STATE.europeYear = Number(value); });
  }

  function renderEuropeRankChart(payload) {
    renderEuropeControls(payload);
    var metric = METRICS[STATE.europeMetric];
    var rows = metricRows(payload, STATE.europeMetric, "country").filter(function (row) {
      return Number(row.year) === Number(STATE.europeYear) && toNumber(row.metric_value) !== null;
    }).sort(function (a, b) { return toNumber(a.metric_value) - toNumber(b.metric_value); });
    var tag = byId("diEuropeRankTag");
    if (tag) tag.textContent = metric.label + ", " + STATE.europeYear;
    plot("diEuropeRankChart", [{
      type: "bar",
      orientation: "h",
      name: metric.label,
      x: rows.map(function (row) { return scaledValue(row.metric_value, metric); }),
      y: rows.map(function (row) { return countryName(payload, row.iso3); }),
      marker: { color: rows.map(function (row) { return row.iso3 === "ITA" ? COLORS.orange : COLORS.blue; }) }
    }], { xaxis: { title: { text: metric.axis }, ticksuffix: metric.suffix || "" }, margin: { l: 150, r: 34, t: 18, b: 58 } });
  }

  function seriesForCountryMetric(payload, iso3, metricName) {
    return sortByYear(metricRows(payload, metricName, "country").filter(function (row) {
      return row.iso3 === iso3 && toNumber(row.metric_value) !== null;
    }));
  }

  function renderEuropeSeriesChart(payload) {
    var metric = METRICS[STATE.europeSeriesMetric];
    var allRows = metricRows(payload, STATE.europeSeriesMetric, "country").filter(function (row) { return toNumber(row.metric_value) !== null; });
    var years = unique(allRows.map(function (row) { return row.year; })).sort(function (a, b) { return a - b; });
    var euMedian = years.map(function (year) {
      return { year: year, value: median(allRows.filter(function (row) { return Number(row.year) === Number(year); }).map(function (row) { return row.metric_value; })) };
    });
    var italy = seriesForCountryMetric(payload, "ITA", STATE.europeSeriesMetric);
    var other = seriesForCountryMetric(payload, STATE.europeCountry, STATE.europeSeriesMetric);
    var tag = byId("diEuropeSeriesTag");
    if (tag) tag.textContent = "Italia, mediana UE e " + countryName(payload, STATE.europeCountry);
    plot("diEuropeSeriesChart", [
      { type: "scatter", mode: "lines+markers", name: "Italia", x: italy.map(function (r) { return r.year; }), y: italy.map(function (r) { return scaledValue(r.metric_value, metric); }), line: { color: COLORS.orange, width: 4 } },
      { type: "scatter", mode: "lines+markers", name: countryName(payload, STATE.europeCountry), x: other.map(function (r) { return r.year; }), y: other.map(function (r) { return scaledValue(r.metric_value, metric); }), line: { color: COLORS.blue, width: 3 } },
      { type: "scatter", mode: "lines+markers", name: "Mediana UE", x: euMedian.map(function (r) { return r.year; }), y: euMedian.map(function (r) { return scaledValue(r.value, metric); }), line: { color: COLORS.gray, width: 3, dash: "dash" } }
    ], { yaxis: { title: { text: metric.axis }, ticksuffix: metric.suffix || "" } });
  }

  function renderAll(payload) {
    if (!payload) return;
    renderKpis(payload);
    renderControls(payload);
    renderKebabChart(payload);
    renderPopulationChart(payload);
    renderAgeSharesChart(payload);
    renderAgeDistributionChart(payload);
    renderDependencyChart(payload);
    renderRegionalRankChart(payload);
    renderRegionalSeriesChart(payload);
    renderFertilityChart(payload);
    renderMigrationChart(payload);
    renderEducationChart(payload);
    renderEducationTrendChart(payload);
    renderEuropeRankChart(payload);
    renderEuropeSeriesChart(payload);
  }

  fetchJsonFrom(0).then(function (payload) {
    STATE.payload = payload;
    renderAll(payload);
    var prepared = payload.meta && payload.meta.updated_at ? payload.meta.updated_at.slice(0, 10) : "data non disponibile";
    setStatus("Dati caricati. Payload aggiornato: " + prepared + ".");
  }).catch(function (error) {
    setStatus("Dati non disponibili: " + error.message + ".", "error");
    ["diKebabChart", "diPopulationChart", "diAgeSharesChart", "diAgeDistributionChart", "diDependencyChart", "diRegionalRankChart", "diRegionalSeriesChart", "diFertilityChart", "diMigrationChart", "diEducationChart", "diTertiaryChart", "diEuropeRankChart", "diEuropeSeriesChart"].forEach(function (id) {
      showEmpty(id, "Dati non disponibili.");
    });
  });
}());
