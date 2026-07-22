(function () {
  "use strict";

  var DATA_SOURCES = [
    "../../data/demografia/dashboard.json?v=20260722-6",
    "https://data.nazarenolecis.com/demografia/dashboard.json?v=20260722-6"
  ];

  var STATE = {
    payload: null,
    kebabPopulation: "total",
    kebabTerritory: "country:ITA",
    kebabYear: null,
    kebabPlaying: false,
    kebabTimer: null,
    seriesTerritory: "country:ITA",
    seriesCompare: "country:ESP",
    seriesMetric: "population_total",
    ageSharesTerritory: "country:ITA",
    ageSharesCompare: "country:ESP",
    distributionTerritory: "country:ITA",
    distributionCompare: "country:ESP",
    dependencyTerritory: "country:ITA",
    dependencyCompare: "country:ESP",
    regionalLevel: "province",
    regionalMetric: "live_births",
    regionalYear: null,
    regionalSeriesLevel: "province",
    regionalFocus: null,
    regionalCompare: null,
    regionalSeriesMetric: "live_births",
    vitalTerritory: "country:ITA",
    vitalCompare: "country:ESP",
    birthDeathTerritory: "country:ITA",
    birthDeathCompare: "country:ESP",
    migrationTerritory: "country:ITA",
    migrationCompare: "country:ESP",
    educationCountry: "ITA",
    educationCompareCountry: "ESP",
    educationAge: "25-64",
    educationSex: "T",
    educationYear: null,
    tertiaryCountry: "ITA",
    tertiaryCompareCountry: "ESP",
    tertiaryAge: "25-64",
    tertiarySex: "T",
    tertiaryLevel: "tertiary",
    europeMetric: "share_65_plus",
    europeYear: null,
    europeCountry: "ESP",
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
    population_total: { label: "Popolazione totale", axis: "Persone", scale: 1000000, axisScaled: "Milioni" },
    share_0_14: { label: "Quota 0-14", axis: "% popolazione", suffix: "%" },
    share_15_64: { label: "Quota 15-64", axis: "% popolazione", suffix: "%" },
    share_65_plus: { label: "Quota 65+", axis: "% popolazione", suffix: "%" },
    share_80_plus: { label: "Quota 80+", axis: "% popolazione", suffix: "%" },
    median_age: { label: "Età mediana", axis: "Anni" },
    mean_age: { label: "Età media", axis: "Anni" },
    dependency_old: { label: "Dipendenza anziani", axis: "Ogni 100 persone 15-64" },
    dependency_total: { label: "Dipendenza totale", axis: "Ogni 100 persone 15-64" },
    total_fertility_rate: { label: "Fecondità", axis: "Figli per donna" },
    mean_age_at_childbirth: { label: "Età media al parto", axis: "Anni" },
    balance_gbirthrt: { label: "Natalità", axis: "Nati per 1.000 abitanti" },
    live_births: { label: "Nati vivi", axis: "Persone", scale: 1000, axisScaled: "Migliaia" },
    deaths: { label: "Decessi", axis: "Persone", scale: 1000, axisScaled: "Migliaia" },
    natural_change: { label: "Saldo naturale", axis: "Persone", scale: 1000, axisScaled: "Migliaia" },
    net_migration_adjustment: { label: "Saldo migratorio", axis: "Persone", scale: 1000, axisScaled: "Migliaia" },
    population_change: { label: "Variazione popolazione", axis: "Persone", scale: 1000, axisScaled: "Migliaia" },
    tertiary_25_64: { label: "Laurea 25-64", axis: "% popolazione 25-64", suffix: "%" }
  };

  var EUROPE_METRIC_COPY = {
    share_65_plus: {
      rankTitle: "Paesi UE per quota 65+",
      seriesTitle: "Quota 65+ nel confronto UE",
      explain: "Quota della popolazione residente con almeno 65 anni. Misura il peso relativo dell'invecchiamento, non il numero assoluto di anziani.",
      source: 'Fonte dati: Eurostat <a href="https://ec.europa.eu/eurostat/databrowser/view/demo_pjan/default/table" target="_blank" rel="noopener"><code>demo_pjan</code></a> e <a href="https://ec.europa.eu/eurostat/databrowser/view/proj_23np/default/table" target="_blank" rel="noopener"><code>proj_23np</code></a>.',
      note: "La classifica usa la quota 65+ sul totale della popolazione del paese; gli anni futuri usano le proiezioni disponibili."
    },
    median_age: {
      rankTitle: "Paesi UE per età mediana",
      seriesTitle: "Età mediana nel confronto UE",
      explain: "Età che divide la popolazione in due metà uguali: metà dei residenti è più giovane e metà è più anziana.",
      source: 'Fonte dati: Eurostat <a href="https://ec.europa.eu/eurostat/databrowser/view/demo_pjan/default/table" target="_blank" rel="noopener"><code>demo_pjan</code></a> e <a href="https://ec.europa.eu/eurostat/databrowser/view/proj_23np/default/table" target="_blank" rel="noopener"><code>proj_23np</code></a>.',
      note: "La mediana è calcolata dalla distribuzione per età; è diversa dall'età media perché guarda il punto centrale della popolazione."
    },
    dependency_old: {
      rankTitle: "Paesi UE per dipendenza degli anziani",
      seriesTitle: "Dipendenza degli anziani nel confronto UE",
      explain: "Rapporto tra popolazione 65+ e popolazione 15-64. Serve a leggere la pressione demografica potenziale sulle età attive.",
      source: 'Fonte dati: Eurostat <a href="https://ec.europa.eu/eurostat/databrowser/view/demo_pjan/default/table" target="_blank" rel="noopener"><code>demo_pjan</code></a> e <a href="https://ec.europa.eu/eurostat/databrowser/view/proj_23np/default/table" target="_blank" rel="noopener"><code>proj_23np</code></a>.',
      note: "Il valore indica persone 65+ ogni 100 residenti 15-64; non è un tasso di occupazione o contribuzione."
    },
    live_births: {
      rankTitle: "Paesi UE per numero di nati vivi",
      seriesTitle: "Nati vivi nel confronto UE",
      explain: "Numero annuo di nati vivi. È una misura assoluta: i paesi più popolosi tendono naturalmente ad avere valori più alti.",
      source: 'Fonte dati: Eurostat <a href="https://ec.europa.eu/eurostat/databrowser/view/demo_gind/default/table" target="_blank" rel="noopener"><code>demo_gind</code></a>.',
      note: "È una misura assoluta: la classifica è in migliaia di persone e non corregge per la dimensione della popolazione; per confrontare intensità usare il tasso di natalità."
    },
    deaths: {
      rankTitle: "Paesi UE per numero di decessi",
      seriesTitle: "Decessi nel confronto UE",
      explain: "Numero annuo di decessi. È una misura assoluta e dipende sia dalla popolazione totale sia dalla struttura per età.",
      source: 'Fonte dati: Eurostat <a href="https://ec.europa.eu/eurostat/databrowser/view/demo_gind/default/table" target="_blank" rel="noopener"><code>demo_gind</code></a>.',
      note: "È una misura assoluta: la classifica è in migliaia di persone; paesi grandi o più anziani possono avere più decessi anche a parità di condizioni sanitarie."
    },
    natural_change: {
      rankTitle: "Paesi UE per saldo naturale",
      seriesTitle: "Saldo naturale nel confronto UE",
      explain: "Differenza tra nati vivi e decessi. Valori negativi indicano che i decessi superano le nascite.",
      source: 'Fonte dati: Eurostat <a href="https://ec.europa.eu/eurostat/databrowser/view/demo_gind/default/table" target="_blank" rel="noopener"><code>demo_gind</code></a>.',
      note: "La classifica è in migliaia di persone; il saldo naturale non include immigrazione, emigrazione o aggiustamenti statistici."
    },
    total_fertility_rate: {
      rankTitle: "Paesi UE per fecondità totale",
      seriesTitle: "Fecondità totale nel confronto UE",
      explain: "Numero medio di figli per donna, calcolato come indicatore sintetico di fecondità nell'anno selezionato.",
      source: 'Fonte dati: Eurostat <a href="https://ec.europa.eu/eurostat/databrowser/view/demo_frate/default/table" target="_blank" rel="noopener"><code>demo_frate</code></a>.',
      note: "La misura è figli per donna; non è un conteggio di nascite e non dipende direttamente dalla dimensione del paese."
    },
    balance_gbirthrt: {
      rankTitle: "Paesi UE per tasso di natalità",
      seriesTitle: "Tasso di natalità nel confronto UE",
      explain: "Nati vivi per 1.000 abitanti. Permette di confrontare paesi con popolazioni di dimensione diversa.",
      source: 'Fonte dati: Eurostat <a href="https://ec.europa.eu/eurostat/databrowser/view/demo_gind/default/table" target="_blank" rel="noopener"><code>demo_gind</code></a>.',
      note: "Il tasso di natalità dipende sia dai comportamenti riproduttivi sia dalla struttura per età della popolazione."
    },
    tertiary_25_64: {
      rankTitle: "Paesi UE per istruzione terziaria 25-64",
      seriesTitle: "Istruzione terziaria 25-64 nel confronto UE",
      explain: "Quota di residenti 25-64 con titolo terziario. La misura è una percentuale della fascia d'età selezionata.",
      source: 'Fonte dati: Eurostat <a href="https://ec.europa.eu/eurostat/databrowser/view/edat_lfse_03/default/table" target="_blank" rel="noopener"><code>edat_lfse_03</code></a>.',
      note: "Laurea 25-64 indica ISCED 5-8 nella fascia 25-64; è una quota percentuale, non un numero assoluto di laureati."
    }
  };

  var REGIONAL_METRICS = [
    "population_total",
    "live_births",
    "deaths",
    "natural_change",
    "total_fertility_rate",
    "balance_gbirthrt",
    "net_migration_adjustment",
    "population_change",
    "share_65_plus",
    "median_age",
    "dependency_old"
  ];

  var BALANCE_METRICS = {
    live_births: true,
    deaths: true,
    natural_change: true,
    balance_gbirthrt: true,
    net_migration_adjustment: true,
    population_change: true
  };

  var FERTILITY_METRICS = {
    total_fertility_rate: true,
    mean_age_at_childbirth: true
  };

  var AGE_METRICS = {
    population_total: true,
    share_0_14: true,
    share_15_64: true,
    share_65_plus: true,
    share_80_plus: true,
    median_age: true,
    mean_age: true,
    dependency_old: true,
    dependency_total: true
  };

  var EDUCATION_LABELS = {
    low_education: "Fino alla licenza media",
    upper_secondary_or_more: "Secondaria o terziaria",
    upper_secondary_post_secondary: "Secondaria superiore",
    upper_secondary_general: "Secondaria generale",
    upper_secondary_vocational: "Secondaria professionale",
    tertiary: "Terziario"
  };

  var EDUCATION_ORDER = {
    low_education: 10,
    upper_secondary_post_secondary: 20,
    upper_secondary_general: 30,
    upper_secondary_vocational: 40,
    tertiary: 50,
    upper_secondary_or_more: 60
  };

  var LEVEL_LABELS = {
    region: "Regioni",
    province: "Province"
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char];
    });
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function metricValue(row, metric) {
    if (!row) return null;
    if (metric === "natural_change") return toNumber(row.natural_change) !== null ? row.natural_change : row.natural_change_derived;
    if (metric === "population_total" && toNumber(row.population_total) === null) return row.population_1_january;
    return row[metric];
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
      return toNumber(metricValue(row, field)) !== null && (!predicate || predicate(row));
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

  function scaledValue(value, metricName) {
    var parsed = toNumber(value);
    var metric = METRICS[metricName] || {};
    if (parsed === null) return null;
    return metric.scale ? parsed / metric.scale : parsed;
  }

  function metricAxis(metricName) {
    var metric = METRICS[metricName] || {};
    return metric.axisScaled || metric.axis || "";
  }

  function europeMetricCopy(metricName) {
    var metric = METRICS[metricName] || { label: "Indicatore" };
    return EUROPE_METRIC_COPY[metricName] || {
      rankTitle: "Paesi UE per " + metric.label.toLowerCase(),
      seriesTitle: metric.label + " nel confronto UE",
      explain: "Confronto armonizzato tra paesi UE disponibili per la misura selezionata.",
      source: "Fonte dati: Eurostat, paesi UE27 nei dataset linkati in questa pagina.",
      note: "La vista usa solo paesi e anni con valore disponibile per l'indicatore selezionato."
    };
  }

  function setHtml(id, value) {
    var node = byId(id);
    if (node) node.innerHTML = value;
  }

  function setText(id, value) {
    var node = byId(id);
    if (node) node.textContent = value;
  }

  function europeCredit(copy, extraNote) {
    return copy.source + " Elaborazione: Nazareno Lecis. Nota: " + copy.note + " " + extraNote;
  }

  function sexLabel(value) {
    if (value === "M") return "Uomini";
    if (value === "F") return "Donne";
    return "Totale";
  }

  function setStatus(message, state) {
    var node = byId("diStatus");
    if (!node) return;
    if (!message) {
      node.hidden = true;
      node.textContent = "";
      node.removeAttribute("data-state");
      return;
    }
    node.hidden = false;
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
    empty.textContent = message || "Dati non disponibili per la selezione.";
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
      margin: { l: 64, r: 34, t: 18, b: 62 },
      hovermode: "x unified",
      legend: { orientation: "h", x: 0, y: -0.2, font: { color: text } }
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
    var clean = (traces || []).filter(function (trace) {
      var numericValues = trace && trace.orientation === "h" ? trace.x : trace && trace.y;
      return trace && trace.x && trace.y && trace.x.length && numericValues && numericValues.some(function (value) { return toNumber(value) !== null; });
    });
    if (!clean.length) return showEmpty(id);
    if (!window.Plotly) return showEmpty(id, "Plotly non caricato.");
    window.Plotly.react(node, clean, baseLayout(layout), {
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

  function optionExists(options, value) {
    return options.some(function (option) { return String(option.value) === String(value); });
  }

  function ensureValue(value, options, fallbackIndex) {
    if (optionExists(options, value)) return value;
    if (!options.length) return value;
    return options[Math.min(fallbackIndex || 0, options.length - 1)].value;
  }

  function fillSelect(id, options, value, onChange) {
    var node = byId(id);
    if (!node) return value;
    node.innerHTML = options.map(function (option) {
      return "<option value=\"" + escapeHtml(option.value) + "\">" + escapeHtml(option.label) + "</option>";
    }).join("");
    var selected = ensureValue(value, options, 0);
    if (selected !== null && selected !== undefined) node.value = String(selected);
    node.onchange = function () {
      onChange(node.value);
      renderAll(STATE.payload);
    };
    return selected;
  }

  function selectOptions(id) {
    var node = byId(id);
    return node ? Array.from(node.options).map(function (option) { return { value: option.value, label: option.textContent }; }) : [];
  }

  function compareOptions(options) {
    return [{ value: "none", label: "Nessun confronto" }].concat(options);
  }

  function countryName(payload, iso3) {
    if (iso3 === "EU_MEDIAN") return "Mediana UE";
    var row = (payload.country_age_structure || []).find(function (item) { return item.iso3 === iso3 && item.geo_name; });
    return row ? row.geo_name : iso3;
  }

  function countryOptions(payload) {
    return unique((payload.country_age_structure || []).map(function (row) { return row.iso3; }))
      .sort(function (a, b) { return countryName(payload, a).localeCompare(countryName(payload, b), "it"); })
      .map(function (iso3) { return { value: iso3, label: countryName(payload, iso3) }; });
  }

  function countryTerritoryOptions(payload) {
    return countryOptions(payload).map(function (item) { return { value: "country:" + item.value, label: item.label }; });
  }

  function addGeoOption(map, row) {
    if (!row || !row.geo_code || !row.geo_level) return;
    if (row.geo_level !== "region" && row.geo_level !== "province") return;
    map[row.geo_level + ":" + row.geo_code] = {
      value: row.geo_level + ":" + row.geo_code,
      level: row.geo_level,
      code: row.geo_code,
      label: row.geo_name || row.geo_code
    };
  }

  function territorialOptions(payload, levels) {
    var allowed = {};
    (levels || ["region", "province"]).forEach(function (level) { allowed[level] = true; });
    var map = {};
    [payload.regional_age_structure, payload.regional_demographic_balance, payload.regional_fertility, payload.regional_population_age_sex].forEach(function (table) {
      (table || []).forEach(function (row) { addGeoOption(map, row); });
    });
    return Object.keys(map).map(function (key) { return map[key]; })
      .filter(function (item) { return allowed[item.level]; })
      .sort(function (a, b) { return a.label.localeCompare(b.label, "it"); })
      .map(function (item) { return { value: item.value, label: item.label }; });
  }

  function ageTerritoryOptions(payload) {
    return [{ value: "country:ITA", label: "Italia" }].concat(territorialOptions(payload, ["region"]));
  }

  function allTerritoryOptions(payload) {
    return [{ value: "country:ITA", label: "Italia" }]
      .concat(territorialOptions(payload, ["region", "province"]))
      .concat(countryTerritoryOptions(payload).filter(function (item) { return item.value !== "country:ITA"; }));
  }

  function territoryParts(territory) {
    var parts = String(territory || "country:ITA").split(":");
    return { level: parts[0] || "country", code: parts[1] || "ITA" };
  }

  function territoryLabel(payload, territory) {
    if (territory === "none") return "Nessun confronto";
    var parts = territoryParts(territory);
    if (parts.level === "country") return countryName(payload, parts.code);
    var option = territorialOptions(payload, [parts.level]).find(function (item) { return item.value === territory; });
    return option ? option.label : parts.code;
  }

  function ageLabel(row) {
    if (row.age_label !== null && row.age_label !== undefined && row.age_label !== "") return String(row.age_label);
    var low = toNumber(row.age_low);
    var high = toNumber(row.age_high);
    if (low === null) return "ND";
    if (high === null || low === high) return String(low);
    if (high >= 120) return String(low) + "+";
    return String(low) + "-" + String(high);
  }

  function intervalBounds(row) {
    var low = toNumber(row.age_low);
    var high = toNumber(row.age_high);
    if (low === null) return null;
    if (high === null) high = low;
    return { low: low, high: high, width: high - low };
  }

  function finestNonOverlappingAgeRows(rows) {
    var bySex = {};
    rows.forEach(function (row) {
      if (!bySex[row.sex]) bySex[row.sex] = [];
      bySex[row.sex].push(row);
    });
    return Object.keys(bySex).flatMap(function (sex) {
      var selected = [];
      bySex[sex].slice().sort(function (a, b) {
        var boundsA = intervalBounds(a);
        var boundsB = intervalBounds(b);
        if (!boundsA || !boundsB) return boundsA ? -1 : boundsB ? 1 : 0;
        if (boundsA.width !== boundsB.width) return boundsA.width - boundsB.width;
        if (boundsA.low !== boundsB.low) return boundsA.low - boundsB.low;
        return boundsA.high - boundsB.high;
      }).forEach(function (row) {
        var bounds = intervalBounds(row);
        if (!bounds) return;
        var overlaps = selected.some(function (item) {
          return !(bounds.high < item.low || bounds.low > item.high);
        });
        if (!overlaps) selected.push(Object.assign({ row: row }, bounds));
      });
      return selected.map(function (item) { return item.row; });
    });
  }

  function hasContinuousCountryScope(row) {
    var year = toNumber(row.year);
    return !(row.iso3 === "DEU" && year !== null && year < 1991);
  }

  function rowsForAgeTerritory(payload, territory) {
    var parts = territoryParts(territory);
    if (parts.level === "region") {
      return sortByYear((payload.regional_age_structure || []).filter(function (row) {
        return row.geo_code === parts.code && hasCompleteAgeCoverage(row);
      }));
    }
    if (parts.level === "country") {
      return sortByYear((payload.country_age_structure || []).filter(function (row) {
        return row.iso3 === parts.code && hasCompleteAgeCoverage(row) && hasContinuousCountryScope(row);
      }));
    }
    return [];
  }

  function rowsForBalanceTerritory(payload, territory) {
    var parts = territoryParts(territory);
    if (parts.level === "country") {
      return sortByYear((payload.country_demographic_balance || []).filter(function (row) {
        return row.iso3 === parts.code && hasContinuousCountryScope(row);
      }));
    }
    return sortByYear((payload.regional_demographic_balance || []).filter(function (row) { return row.geo_code === parts.code && row.geo_level === parts.level; }));
  }

  function rowsForFertilityTerritory(payload, territory, indicator) {
    var parts = territoryParts(territory);
    var rows = parts.level === "country"
      ? (payload.country_fertility || []).filter(function (row) { return row.iso3 === parts.code && hasContinuousCountryScope(row); })
      : (payload.regional_fertility || []).filter(function (row) { return row.geo_code === parts.code && row.geo_level === parts.level; });
    return sortByYear(rows.filter(function (row) {
      if (indicator === "total_fertility_rate") return row.indicator === "total_fertility_rate" || row.indicator === "fertility_nr";
      return row.indicator === indicator;
    }));
  }

  function kebabPopulationOptions(payload) {
    var options = [{ value: "total", label: "Totale residenti" }];
    if ((payload.immigrant_population_age_sex || []).length) {
      options.push({ value: "foreign_born", label: "Nati all'estero" });
    }
    return options;
  }

  function kebabTerritoryOptions(payload, ageTerritories) {
    if (STATE.kebabPopulation === "foreign_born") return [{ value: "country:ITA", label: "Italia" }];
    return ageTerritories;
  }

  function rowsForKebab(payload) {
    var parts = territoryParts(STATE.kebabTerritory);
    if (STATE.kebabPopulation === "foreign_born") {
      return sortByYear((payload.immigrant_population_age_sex || []).filter(function (row) {
        return row.iso3 === "ITA" && row.category === "FOR";
      }));
    }
    if (parts.level === "region") return payload.regional_population_age_sex || [];
    return payload.population_age_sex || [];
  }

  function kebabYears(payload) {
    var parts = territoryParts(STATE.kebabTerritory);
    var rows = rowsForKebab(payload).filter(function (row) {
      if (STATE.kebabPopulation === "foreign_born") return row.sex === "M" || row.sex === "F";
      var match = parts.level === "region" ? row.geo_code === parts.code : row.iso3 === parts.code;
      return match && (row.sex === "M" || row.sex === "F");
    });
    return unique(rows.map(function (row) { return row.year; })).sort(function (a, b) { return a - b; });
  }

  function stopKebabAnimation() {
    if (STATE.kebabTimer) window.clearInterval(STATE.kebabTimer);
    STATE.kebabTimer = null;
    STATE.kebabPlaying = false;
    syncKebabPlayButton();
  }

  function advanceKebabYear(payload) {
    var years = kebabYears(payload);
    if (years.length < 2) return;
    var current = Number(STATE.kebabYear);
    var index = years.indexOf(current);
    STATE.kebabYear = years[index >= 0 && index < years.length - 1 ? index + 1 : 0];
    renderKebabChart(payload);
  }

  function startKebabAnimation(payload) {
    var years = kebabYears(payload);
    if (years.length < 2) return;
    if (STATE.kebabTimer) window.clearInterval(STATE.kebabTimer);
    STATE.kebabYear = years[0];
    STATE.kebabPlaying = true;
    syncKebabPlayButton();
    renderKebabChart(payload);
    STATE.kebabTimer = window.setInterval(function () {
      advanceKebabYear(STATE.payload);
    }, 850);
  }

  function syncKebabPlayButton() {
    var node = byId("diKebabPlay");
    if (!node) return;
    node.textContent = STATE.kebabPlaying ? "Ferma evoluzione" : "Avvia evoluzione";
    node.dataset.active = STATE.kebabPlaying ? "true" : "false";
    node.setAttribute("aria-pressed", STATE.kebabPlaying ? "true" : "false");
    node.onclick = function () {
      if (STATE.kebabPlaying) stopKebabAnimation();
      else startKebabAnimation(STATE.payload);
    };
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

  function hasCompleteAgeCoverage(row) {
    var ageMin = toNumber(row.age_min);
    var ageMax = toNumber(row.age_max);
    var ageClasses = toNumber(row.age_classes);
    if (ageMin === null || ageMax === null || ageClasses === null) return true;
    return ageMin <= 0 && ageMax >= 85 && ageClasses >= 16;
  }

  function rowsForMetricTerritory(payload, metric, territory) {
    var parts = territoryParts(territory);
    if (metric === "tertiary_25_64" && parts.level === "country") {
      return sortByYear((payload.education_attainment || []).filter(function (row) {
        return row.iso3 === parts.code && row.age_label === "25-64" && row.sex === "T" && row.education_level === "tertiary";
      }).map(function (row) {
        return Object.assign({}, row, { metric_value: row.value });
      }));
    }
    var rows = [];
    if (AGE_METRICS[metric]) {
      rows = rowsForAgeTerritory(payload, territory).map(function (row) {
        return Object.assign({}, row, { metric_value: metricValue(row, metric) });
      });
      if (rows.some(function (row) { return toNumber(row.metric_value) !== null; })) return rows;
      if (metric !== "population_total") return [];
    }
    if (BALANCE_METRICS[metric] || metric === "population_total") {
      return rowsForBalanceTerritory(payload, territory).map(function (row) {
        return Object.assign({}, row, { metric_value: metricValue(row, metric) });
      });
    }
    if (FERTILITY_METRICS[metric]) {
      return rowsForFertilityTerritory(payload, territory, metric).map(function (row) {
        return Object.assign({}, row, { metric_value: row.value });
      });
    }
    return rows;
  }

  function rowsForMetricLevel(payload, metric, level) {
    if (level === "country") {
      return countryTerritoryOptions(payload).flatMap(function (option) {
        return rowsForMetricTerritory(payload, metric, option.value);
      });
    }
    return territorialOptions(payload, [level]).flatMap(function (option) {
      return rowsForMetricTerritory(payload, metric, option.value);
    });
  }

  function metricSeriesTrace(payload, territory, metricName, color, dash, namePrefix) {
    var rows = sortByYear(rowsForMetricTerritory(payload, metricName, territory).filter(function (row) {
      return toNumber(row.metric_value) !== null;
    }));
    var name = namePrefix || territoryLabel(payload, territory);
    return {
      type: "scatter",
      mode: "lines+markers",
      name: name,
      x: rows.map(function (row) { return row.year; }),
      y: rows.map(function (row) { return scaledValue(row.metric_value, metricName); }),
      line: { color: color, width: 3, dash: dash || "solid" }
    };
  }

  function createKpi(label, value, tag, note) {
    var item = document.createElement("div");
    item.className = "di-kpi";
    item.innerHTML = "<span>" + escapeHtml(label) + "</span><strong>" + escapeHtml(value) + "</strong><em>" + escapeHtml(tag) + "</em><small>" + escapeHtml(note) + "</small>";
    return item;
  }

  function renderKpis(payload) {
    var node = byId("diKpis");
    if (!node) return;
    node.innerHTML = "";
    var observed = latest(payload.age_structure || [], function (row) { return row.status === "observed"; });
    var projected = latest(payload.age_structure || [], function (row) { return row.status === "projected"; });
    var fertility = latestNonNull(payload.fertility || [], "value");
    var births = latestNonNull(payload.demographic_balance || [], "live_births");
    var deaths = latestNonNull(payload.demographic_balance || [], "deaths");
    var migration = latestNonNull(payload.demographic_balance || [], "net_migration_adjustment");
    var tertiary = latestNonNull(payload.education_attainment || [], "value", function (row) {
      return row.iso3 === "ITA" && row.age_label === "25-64" && row.sex === "T" && row.education_level === "tertiary";
    });
    [
      createKpi("Popolazione", formatMillions(observed && observed.population_total), observed ? observed.year + " osservato" : "ND", "Residenti totali a inizio anno."),
      createKpi("Età mediana", formatNumber(observed && observed.median_age) + " anni", observed ? observed.year + " osservato" : "ND", "Mediana della distribuzione per età."),
      createKpi("Quota 65+", formatPercent(observed && observed.share_65_plus), observed ? observed.year + " osservato" : "ND", "Peso della popolazione in età anziana."),
      createKpi("Dipendenza anziani", formatDecimal(observed && observed.dependency_old, 1), "ogni 100 persone 15-64", "Rapporto strutturale tra 65+ ed età attiva."),
      createKpi("Fecondità", formatDecimal(fertility && fertility.value, 2), fertility ? fertility.year + " Eurostat" : "ND", "Figli per donna."),
      createKpi("Nati vivi", formatNumber(births && births.live_births), births ? births.year + " persone" : "ND", "Numero di nati vivi nell'anno."),
      createKpi("Decessi", formatNumber(deaths && deaths.deaths), deaths ? deaths.year + " persone" : "ND", "Numero di decessi nell'anno."),
      createKpi("Saldo migratorio", formatSigned(migration && migration.net_migration_adjustment), migration ? migration.year + " persone" : "ND", "Saldo con aggiustamento statistico."),
      createKpi("Laurea 25-64", formatPercent(tertiary && tertiary.value), tertiary ? tertiary.year + " totale" : "ND", "Quota con istruzione terziaria."),
      createKpi("Popolazione 2050", formatMillions(projected && projected.population_total), projected ? projected.year + " proiezione" : "ND", projected ? "Scenario " + projected.scenario + "." : "Proiezione non disponibile.")
    ].forEach(function (item) { node.appendChild(item); });
  }

  function metricOptionsForLevel(level) {
    return REGIONAL_METRICS.filter(function (metric) {
      return level !== "province" || !["share_65_plus", "median_age", "dependency_old"].includes(metric);
    }).map(function (metric) { return { value: metric, label: METRICS[metric].label }; });
  }

  function fillEducationControls(payload) {
    var rows = payload.education_attainment || [];
    var ages = unique(rows.map(function (row) { return row.age_label; })).sort();
    var sexes = ["T", "M", "F"].filter(function (sex) { return rows.some(function (row) { return row.sex === sex; }); });
    var levels = unique(rows.map(function (row) { return row.education_level; })).sort();
    STATE.educationAge = fillSelect("diEducationAge", ages.map(function (age) { return { value: age, label: age }; }), STATE.educationAge, function (value) { STATE.educationAge = value; STATE.educationYear = null; });
    STATE.educationSex = fillSelect("diEducationSex", sexes.map(function (sex) { return { value: sex, label: sexLabel(sex) }; }), STATE.educationSex, function (value) { STATE.educationSex = value; STATE.educationYear = null; });
    STATE.tertiaryAge = fillSelect("diTertiaryAge", ages.map(function (age) { return { value: age, label: age }; }), STATE.tertiaryAge, function (value) { STATE.tertiaryAge = value; });
    STATE.tertiarySex = fillSelect("diTertiarySex", sexes.map(function (sex) { return { value: sex, label: sexLabel(sex) }; }), STATE.tertiarySex, function (value) { STATE.tertiarySex = value; });
    STATE.tertiaryLevel = fillSelect("diTertiaryLevel", levels.map(function (level) { return { value: level, label: EDUCATION_LABELS[level] || level }; }), STATE.tertiaryLevel, function (value) { STATE.tertiaryLevel = value; });

    var years = unique(rows.filter(function (row) {
      return row.iso3 === STATE.educationCountry && row.age_label === STATE.educationAge && row.sex === STATE.educationSex;
    }).map(function (row) { return row.year; })).sort(function (a, b) { return a - b; });
    STATE.educationYear = fillSelect("diEducationYear", years.map(function (year) { return { value: year, label: String(year) }; }), STATE.educationYear || years[years.length - 1], function (value) { STATE.educationYear = Number(value); });
  }

  function renderControls(payload) {
    var ageTerritories = ageTerritoryOptions(payload);
    var allTerritories = allTerritoryOptions(payload);
    var countries = countryOptions(payload);
    var countryTerritories = countryTerritoryOptions(payload);

    STATE.kebabPopulation = fillSelect("diKebabPopulation", kebabPopulationOptions(payload), STATE.kebabPopulation, function (value) { STATE.kebabPopulation = value; STATE.kebabTerritory = "country:ITA"; STATE.kebabYear = null; stopKebabAnimation(); });
    STATE.kebabTerritory = fillSelect("diKebabTerritory", kebabTerritoryOptions(payload, ageTerritories), STATE.kebabTerritory, function (value) { STATE.kebabTerritory = value; STATE.kebabYear = null; stopKebabAnimation(); });
    STATE.seriesTerritory = fillSelect("diSeriesTerritory", allTerritories, STATE.seriesTerritory, function (value) { STATE.seriesTerritory = value; });
    STATE.seriesCompare = fillSelect("diSeriesCompare", compareOptions(allTerritories), STATE.seriesCompare, function (value) { STATE.seriesCompare = value; });
    STATE.seriesMetric = fillSelect("diSeriesMetric", selectOptions("diSeriesMetric"), STATE.seriesMetric, function (value) { STATE.seriesMetric = value; });

    STATE.ageSharesTerritory = fillSelect("diAgeSharesTerritory", ageTerritories, STATE.ageSharesTerritory, function (value) { STATE.ageSharesTerritory = value; });
    STATE.ageSharesCompare = fillSelect("diAgeSharesCompare", compareOptions(countryTerritories), STATE.ageSharesCompare, function (value) { STATE.ageSharesCompare = value; });
    STATE.distributionTerritory = fillSelect("diDistributionTerritory", ageTerritories, STATE.distributionTerritory, function (value) { STATE.distributionTerritory = value; });
    STATE.distributionCompare = fillSelect("diDistributionCompare", compareOptions(countryTerritories), STATE.distributionCompare, function (value) { STATE.distributionCompare = value; });
    STATE.dependencyTerritory = fillSelect("diDependencyTerritory", ageTerritories, STATE.dependencyTerritory, function (value) { STATE.dependencyTerritory = value; });
    STATE.dependencyCompare = fillSelect("diDependencyCompare", compareOptions(countryTerritories), STATE.dependencyCompare, function (value) { STATE.dependencyCompare = value; });

    STATE.regionalLevel = fillSelect("diRegionalLevel", [{ value: "province", label: "Province" }, { value: "region", label: "Regioni" }], STATE.regionalLevel, function (value) { STATE.regionalLevel = value; STATE.regionalYear = null; });
    var rankMetrics = metricOptionsForLevel(STATE.regionalLevel);
    STATE.regionalMetric = fillSelect("diRegionalMetric", rankMetrics, STATE.regionalMetric, function (value) { STATE.regionalMetric = value; STATE.regionalYear = null; });
    STATE.regionalSeriesLevel = fillSelect("diRegionalSeriesLevel", [{ value: "province", label: "Province" }, { value: "region", label: "Regioni" }], STATE.regionalSeriesLevel, function (value) { STATE.regionalSeriesLevel = value; STATE.regionalFocus = null; STATE.regionalCompare = null; });
    var seriesTerritories = territorialOptions(payload, [STATE.regionalSeriesLevel]);
    STATE.regionalFocus = fillSelect("diRegionalFocus", seriesTerritories, STATE.regionalFocus, function (value) { STATE.regionalFocus = value; });
    STATE.regionalCompare = fillSelect("diRegionalCompare", compareOptions(seriesTerritories), STATE.regionalCompare || (seriesTerritories[1] && seriesTerritories[1].value), function (value) { STATE.regionalCompare = value; });
    STATE.regionalSeriesMetric = fillSelect("diRegionalSeriesMetric", metricOptionsForLevel(STATE.regionalSeriesLevel), STATE.regionalSeriesMetric, function (value) { STATE.regionalSeriesMetric = value; });

    STATE.vitalTerritory = fillSelect("diVitalTerritory", allTerritories, STATE.vitalTerritory, function (value) { STATE.vitalTerritory = value; });
    STATE.vitalCompare = fillSelect("diVitalCompare", compareOptions(allTerritories), STATE.vitalCompare, function (value) { STATE.vitalCompare = value; });
    STATE.birthDeathTerritory = fillSelect("diBirthDeathTerritory", allTerritories, STATE.birthDeathTerritory, function (value) { STATE.birthDeathTerritory = value; });
    STATE.birthDeathCompare = fillSelect("diBirthDeathCompare", compareOptions(allTerritories), STATE.birthDeathCompare, function (value) { STATE.birthDeathCompare = value; });
    STATE.migrationTerritory = fillSelect("diMigrationTerritory", allTerritories, STATE.migrationTerritory, function (value) { STATE.migrationTerritory = value; });
    STATE.migrationCompare = fillSelect("diMigrationCompare", compareOptions(allTerritories), STATE.migrationCompare, function (value) { STATE.migrationCompare = value; });

    STATE.educationCountry = fillSelect("diEducationCountry", countries, STATE.educationCountry, function (value) { STATE.educationCountry = value; STATE.educationYear = null; });
    STATE.educationCompareCountry = fillSelect("diEducationCompareCountry", compareOptions(countries), STATE.educationCompareCountry, function (value) { STATE.educationCompareCountry = value; });
    STATE.tertiaryCountry = fillSelect("diTertiaryCountry", countries, STATE.tertiaryCountry, function (value) { STATE.tertiaryCountry = value; });
    STATE.tertiaryCompareCountry = fillSelect("diTertiaryCompareCountry", compareOptions(countries), STATE.tertiaryCompareCountry, function (value) { STATE.tertiaryCompareCountry = value; });
    STATE.europeCountry = fillSelect("diEuropeCountry", countries.filter(function (item) { return item.value !== "ITA"; }), STATE.europeCountry, function (value) { STATE.europeCountry = value; });
    STATE.europeMetric = fillSelect("diEuropeMetric", selectOptions("diEuropeMetric"), STATE.europeMetric, function (value) { STATE.europeMetric = value; STATE.europeYear = null; });
    STATE.europeSeriesMetric = fillSelect("diEuropeSeriesMetric", selectOptions("diEuropeSeriesMetric"), STATE.europeSeriesMetric, function (value) { STATE.europeSeriesMetric = value; });

    fillEducationControls(payload);
    syncKebabPlayButton();
  }

  function renderKebabControls(payload) {
    var years = kebabYears(payload);
    if (!years.length) return;
    var preferred = STATE.kebabPopulation === "foreign_born"
      ? years[years.length - 1]
      : payload.meta && payload.meta.latest_observed_year || years[years.length - 1];
    var selected = years.includes(Number(STATE.kebabYear)) ? Number(STATE.kebabYear) : preferred;
    if (!years.includes(Number(selected))) selected = years[years.length - 1];
    STATE.kebabYear = fillSelect("diKebabYear", years.map(function (year) { return { value: year, label: String(year) }; }), selected, function (value) { STATE.kebabYear = Number(value); stopKebabAnimation(); });
  }

  function renderKebabChart(payload) {
    renderKebabControls(payload);
    var parts = territoryParts(STATE.kebabTerritory);
    var filtered = rowsForKebab(payload).filter(function (row) {
      var match = STATE.kebabPopulation === "foreign_born"
        ? row.iso3 === "ITA"
        : parts.level === "region" ? row.geo_code === parts.code : row.iso3 === parts.code;
      return match && Number(row.year) === Number(STATE.kebabYear) && (row.sex === "M" || row.sex === "F");
    });
    if (STATE.kebabPopulation !== "foreign_born") {
      var hasObserved = filtered.some(function (row) { return row.status === "observed"; });
      filtered = filtered.filter(function (row) { return row.status === (hasObserved ? "observed" : "projected"); });
    }
    filtered = finestNonOverlappingAgeRows(filtered);
    var byAge = {};
    filtered.forEach(function (row) {
      var age = toNumber(row.age_low);
      if (age === null) return;
      var key = ageLabel(row);
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
    var populationLabel = STATE.kebabPopulation === "foreign_born" ? "nati all'estero" : "totale residenti";
    if (tag) tag.textContent = territoryLabel(payload, STATE.kebabTerritory) + ", " + populationLabel + ", " + STATE.kebabYear;
    plot("diKebabChart", [
      { type: "bar", orientation: "h", name: "Uomini", x: male, y: ages.map(function (r) { return r.label; }), marker: { color: COLORS.blue }, customdata: ages.map(function (r) { return r.M; }), hovertemplate: "Età %{y}<br>Uomini: %{customdata:,.0f}<extra></extra>" },
      { type: "bar", orientation: "h", name: "Donne", x: female, y: ages.map(function (r) { return r.label; }), marker: { color: COLORS.orange }, customdata: ages.map(function (r) { return r.F; }), hovertemplate: "Età %{y}<br>Donne: %{customdata:,.0f}<extra></extra>" }
    ], {
      barmode: "relative",
      bargap: 0.05,
      hovermode: "closest",
      xaxis: { title: { text: "Milioni di persone" }, range: [-limit, limit], tickvals: tickValues, ticktext: tickValues.map(function (v) { return Math.abs(v).toLocaleString("it-IT", { maximumFractionDigits: 1 }); }) },
      yaxis: { title: { text: "Età" } }
    });
  }

  function renderPopulationChart(payload) {
    var metric = METRICS[STATE.seriesMetric];
    var traces = [metricSeriesTrace(payload, STATE.seriesTerritory, STATE.seriesMetric, COLORS.orange, "solid", territoryLabel(payload, STATE.seriesTerritory))];
    if (STATE.seriesCompare !== "none") traces.push(metricSeriesTrace(payload, STATE.seriesCompare, STATE.seriesMetric, COLORS.blue, "dash", territoryLabel(payload, STATE.seriesCompare)));
    plot("diPopulationChart", traces, { yaxis: { title: { text: metricAxis(STATE.seriesMetric) }, ticksuffix: metric.suffix || "" } });
  }

  function renderAgeSharesChart(payload) {
    var rows = preferredRows(rowsForAgeTerritory(payload, STATE.ageSharesTerritory));
    var traces = [["0-14", "share_0_14", COLORS.teal], ["15-64", "share_15_64", COLORS.blue], ["65+", "share_65_plus", COLORS.orange], ["80+", "share_80_plus", COLORS.purple]].map(function (spec) {
      return { type: "scatter", mode: "lines+markers", name: territoryLabel(payload, STATE.ageSharesTerritory) + " " + spec[0], x: rows.map(function (r) { return r.year; }), y: rows.map(function (r) { return r[spec[1]]; }), line: { color: spec[2], width: 3 } };
    });
    if (STATE.ageSharesCompare !== "none") {
      var compareRows = preferredRows(rowsForAgeTerritory(payload, STATE.ageSharesCompare));
      [["0-14", "share_0_14", COLORS.teal], ["15-64", "share_15_64", COLORS.blue], ["65+", "share_65_plus", COLORS.orange], ["80+", "share_80_plus", COLORS.purple]].forEach(function (spec) {
        traces.push({ type: "scatter", mode: "lines", name: territoryLabel(payload, STATE.ageSharesCompare) + " " + spec[0], x: compareRows.map(function (r) { return r.year; }), y: compareRows.map(function (r) { return r[spec[1]]; }), line: { color: spec[2], width: 2, dash: "dash" } });
      });
    }
    plot("diAgeSharesChart", traces, { yaxis: { title: { text: "% popolazione" }, ticksuffix: "%" } });
  }

  function renderAgeDistributionChart(payload) {
    var rows = preferredRows(rowsForAgeTerritory(payload, STATE.distributionTerritory));
    var specs = [["P10", "age_p10", COLORS.teal, "dot"], ["P25", "age_p25", COLORS.green, "dot"], ["Mediana", "median_age", COLORS.orange, "solid"], ["Media", "mean_age", COLORS.blue, "solid"], ["P75", "age_p75", COLORS.purple, "dot"], ["P90", "age_p90", COLORS.red, "dot"]];
    var traces = specs.map(function (spec) {
      return { type: "scatter", mode: "lines+markers", name: territoryLabel(payload, STATE.distributionTerritory) + " " + spec[0], x: rows.map(function (r) { return r.year; }), y: rows.map(function (r) { return r[spec[1]]; }), line: { color: spec[2], width: spec[0] === "Mediana" ? 4 : 2, dash: spec[3] } };
    });
    if (STATE.distributionCompare !== "none") {
      var compareRows = preferredRows(rowsForAgeTerritory(payload, STATE.distributionCompare));
      traces.push({ type: "scatter", mode: "lines+markers", name: territoryLabel(payload, STATE.distributionCompare) + " mediana", x: compareRows.map(function (r) { return r.year; }), y: compareRows.map(function (r) { return r.median_age; }), line: { color: COLORS.gray, width: 3, dash: "dash" } });
    }
    plot("diAgeDistributionChart", traces, { yaxis: { title: { text: "Anni" } } });
  }

  function renderDependencyChart(payload) {
    var rows = preferredRows(rowsForAgeTerritory(payload, STATE.dependencyTerritory));
    var traces = [
      { type: "scatter", mode: "lines+markers", name: territoryLabel(payload, STATE.dependencyTerritory) + " anziani", x: rows.map(function (r) { return r.year; }), y: rows.map(function (r) { return r.dependency_old; }), line: { color: COLORS.orange, width: 3 } },
      { type: "scatter", mode: "lines+markers", name: territoryLabel(payload, STATE.dependencyTerritory) + " totale", x: rows.map(function (r) { return r.year; }), y: rows.map(function (r) { return r.dependency_total; }), line: { color: COLORS.blue, width: 3 } }
    ];
    if (STATE.dependencyCompare !== "none") {
      var compareRows = preferredRows(rowsForAgeTerritory(payload, STATE.dependencyCompare));
      traces.push({ type: "scatter", mode: "lines+markers", name: territoryLabel(payload, STATE.dependencyCompare) + " anziani", x: compareRows.map(function (r) { return r.year; }), y: compareRows.map(function (r) { return r.dependency_old; }), line: { color: COLORS.gray, width: 3, dash: "dash" } });
    }
    plot("diDependencyChart", traces, { yaxis: { title: { text: "Persone ogni 100 in età 15-64" } } });
  }

  function renderRegionalControls(payload) {
    var rows = rowsForMetricLevel(payload, STATE.regionalMetric, STATE.regionalLevel).filter(function (row) { return toNumber(row.metric_value) !== null; });
    var years = unique(rows.map(function (row) { return row.year; })).sort(function (a, b) { return a - b; });
    STATE.regionalYear = fillSelect("diRegionalYear", years.map(function (year) { return { value: year, label: String(year) }; }), STATE.regionalYear || years[years.length - 1], function (value) { STATE.regionalYear = Number(value); });
  }

  function renderRegionalRankChart(payload) {
    renderRegionalControls(payload);
    var metric = METRICS[STATE.regionalMetric];
    var rows = rowsForMetricLevel(payload, STATE.regionalMetric, STATE.regionalLevel).filter(function (row) {
      return Number(row.year) === Number(STATE.regionalYear) && toNumber(row.metric_value) !== null;
    }).sort(function (a, b) { return toNumber(a.metric_value) - toNumber(b.metric_value); });
    var tag = byId("diRegionalRankTag");
    if (tag) tag.textContent = LEVEL_LABELS[STATE.regionalLevel] + " - " + metric.label + ", " + STATE.regionalYear;
    plot("diRegionalRankChart", [{
      type: "bar",
      orientation: "h",
      name: metric.label,
      x: rows.map(function (row) { return scaledValue(row.metric_value, STATE.regionalMetric); }),
      y: rows.map(function (row) { return row.geo_name || row.geo_code; }),
      marker: { color: rows.map(function (row) { return STATE.regionalFocus && row.geo_code === territoryParts(STATE.regionalFocus).code ? COLORS.orange : COLORS.blue; }) }
    }], { xaxis: { title: { text: metricAxis(STATE.regionalMetric) }, ticksuffix: metric.suffix || "" }, margin: { l: 170, r: 34, t: 18, b: 62 } });
  }

  function renderRegionalSeriesChart(payload) {
    var metric = METRICS[STATE.regionalSeriesMetric];
    var traces = [
      metricSeriesTrace(payload, STATE.regionalFocus, STATE.regionalSeriesMetric, COLORS.orange, "solid", territoryLabel(payload, STATE.regionalFocus))
    ];
    if (STATE.regionalCompare && STATE.regionalCompare !== "none") {
      traces.push(metricSeriesTrace(payload, STATE.regionalCompare, STATE.regionalSeriesMetric, COLORS.blue, "dash", territoryLabel(payload, STATE.regionalCompare)));
    }
    var tag = byId("diRegionalSeriesTag");
    if (tag) tag.textContent = metric.label + " - " + LEVEL_LABELS[STATE.regionalSeriesLevel].toLowerCase();
    plot("diRegionalSeriesChart", traces, { yaxis: { title: { text: metricAxis(STATE.regionalSeriesMetric) }, ticksuffix: metric.suffix || "" } });
  }

  function renderFertilityChart(payload) {
    var traces = [
      metricSeriesTrace(payload, STATE.vitalTerritory, "total_fertility_rate", COLORS.orange, "solid", territoryLabel(payload, STATE.vitalTerritory) + " fecondità"),
      metricSeriesTrace(payload, STATE.vitalTerritory, "balance_gbirthrt", COLORS.teal, "solid", territoryLabel(payload, STATE.vitalTerritory) + " natalità")
    ];
    traces[1].yaxis = "y2";
    if (STATE.vitalCompare !== "none") {
      var fertilityCompare = metricSeriesTrace(payload, STATE.vitalCompare, "total_fertility_rate", COLORS.blue, "dash", territoryLabel(payload, STATE.vitalCompare) + " fecondità");
      var birthRateCompare = metricSeriesTrace(payload, STATE.vitalCompare, "balance_gbirthrt", COLORS.gray, "dash", territoryLabel(payload, STATE.vitalCompare) + " natalità");
      birthRateCompare.yaxis = "y2";
      traces.push(fertilityCompare, birthRateCompare);
    }
    plot("diFertilityChart", traces, { yaxis: { title: { text: "Figli per donna" } }, yaxis2: { title: { text: "Nati per 1.000 abitanti" }, overlaying: "y", side: "right" } });
  }

  function renderBirthDeathChart(payload) {
    var traces = [
      metricSeriesTrace(payload, STATE.birthDeathTerritory, "live_births", COLORS.green, "solid", territoryLabel(payload, STATE.birthDeathTerritory) + " nati"),
      metricSeriesTrace(payload, STATE.birthDeathTerritory, "deaths", COLORS.red, "solid", territoryLabel(payload, STATE.birthDeathTerritory) + " decessi"),
      metricSeriesTrace(payload, STATE.birthDeathTerritory, "natural_change", COLORS.orange, "solid", territoryLabel(payload, STATE.birthDeathTerritory) + " saldo naturale")
    ];
    if (STATE.birthDeathCompare !== "none") {
      traces.push(
        metricSeriesTrace(payload, STATE.birthDeathCompare, "live_births", COLORS.green, "dash", territoryLabel(payload, STATE.birthDeathCompare) + " nati"),
        metricSeriesTrace(payload, STATE.birthDeathCompare, "deaths", COLORS.red, "dash", territoryLabel(payload, STATE.birthDeathCompare) + " decessi"),
        metricSeriesTrace(payload, STATE.birthDeathCompare, "natural_change", COLORS.gray, "dash", territoryLabel(payload, STATE.birthDeathCompare) + " saldo naturale")
      );
    }
    plot("diBirthDeathChart", traces, { yaxis: { title: { text: "Migliaia di persone" }, zeroline: true } });
  }

  function renderMigrationChart(payload) {
    var rows = rowsForBalanceTerritory(payload, STATE.migrationTerritory);
    var hasImmigration = rows.some(function (row) { return toNumber(row.immigration) !== null && toNumber(row.net_migration_adjustment) !== null; });
    var traces = [];
    if (hasImmigration) {
      traces.push(
        { type: "bar", name: territoryLabel(payload, STATE.migrationTerritory) + " immigrazione", x: rows.map(function (r) { return r.year; }), y: rows.map(function (r) { return toNumber(r.immigration) / 1000; }), marker: { color: COLORS.green } },
        { type: "bar", name: territoryLabel(payload, STATE.migrationTerritory) + " emigrazione stimata", x: rows.map(function (r) { return r.year; }), y: rows.map(function (r) { return -((toNumber(r.immigration) - toNumber(r.net_migration_adjustment)) / 1000); }), marker: { color: COLORS.red } }
      );
    }
    traces.push(metricSeriesTrace(payload, STATE.migrationTerritory, "net_migration_adjustment", COLORS.orange, "solid", territoryLabel(payload, STATE.migrationTerritory) + " saldo"));
    if (STATE.migrationCompare !== "none") {
      traces.push(metricSeriesTrace(payload, STATE.migrationCompare, "net_migration_adjustment", COLORS.blue, "dash", territoryLabel(payload, STATE.migrationCompare) + " saldo"));
    }
    plot("diMigrationChart", traces, { barmode: "relative", yaxis: { title: { text: "Migliaia di persone" }, zeroline: true } });
  }

  function educationRows(payload, iso3, age, sex, year) {
    return (payload.education_attainment || []).filter(function (row) {
      return row.iso3 === iso3 && row.age_label === age && row.sex === sex && Number(row.year) === Number(year);
    });
  }

  function educationDisplayRows(rows) {
    var hasSublevels = rows.some(function (row) {
      return row.education_level === "upper_secondary_general" || row.education_level === "upper_secondary_vocational";
    });
    return rows.filter(function (row) {
      if (row.education_level === "upper_secondary_or_more") return false;
      if (hasSublevels && row.education_level === "upper_secondary_post_secondary") return false;
      return true;
    }).sort(function (a, b) {
      var orderA = EDUCATION_ORDER[a.education_level] || 999;
      var orderB = EDUCATION_ORDER[b.education_level] || 999;
      if (orderA !== orderB) return orderA - orderB;
      return (toNumber(b.value) || 0) - (toNumber(a.value) || 0);
    });
  }

  function renderEducationChart(payload) {
    fillEducationControls(payload);
    var primary = educationDisplayRows(educationRows(payload, STATE.educationCountry, STATE.educationAge, STATE.educationSex, STATE.educationYear));
    var compare = STATE.educationCompareCountry === "none" ? [] : educationDisplayRows(educationRows(payload, STATE.educationCompareCountry, STATE.educationAge, STATE.educationSex, STATE.educationYear));
    var levels = unique(primary.concat(compare).map(function (row) { return row.education_level; })).sort(function (a, b) {
      return (EDUCATION_ORDER[a] || 999) - (EDUCATION_ORDER[b] || 999);
    });
    var primaryMap = {};
    var compareMap = {};
    primary.forEach(function (row) { primaryMap[row.education_level] = row.value; });
    compare.forEach(function (row) { compareMap[row.education_level] = row.value; });
    var tag = byId("diEducationTag");
    if (tag) tag.textContent = countryName(payload, STATE.educationCountry) + ", " + STATE.educationAge + ", " + sexLabel(STATE.educationSex) + ", " + STATE.educationYear;
    var traces = [{
      type: "bar",
      name: countryName(payload, STATE.educationCountry),
      x: levels.map(function (level) { return EDUCATION_LABELS[level] || level; }),
      y: levels.map(function (level) { return primaryMap[level]; }),
      marker: { color: COLORS.orange }
    }];
    if (STATE.educationCompareCountry !== "none") {
      traces.push({
        type: "bar",
        name: countryName(payload, STATE.educationCompareCountry),
        x: levels.map(function (level) { return EDUCATION_LABELS[level] || level; }),
        y: levels.map(function (level) { return compareMap[level]; }),
        marker: { color: COLORS.blue }
      });
    }
    plot("diEducationChart", traces, { barmode: "group", yaxis: { title: { text: "% popolazione" }, ticksuffix: "%" } });
  }

  function renderEducationTrendChart(payload) {
    var rows = sortByYear((payload.education_attainment || []).filter(function (row) {
      return row.iso3 === STATE.tertiaryCountry && row.age_label === STATE.tertiaryAge && row.sex === STATE.tertiarySex && row.education_level === STATE.tertiaryLevel;
    }));
    var compare = STATE.tertiaryCompareCountry === "none" ? [] : sortByYear((payload.education_attainment || []).filter(function (row) {
      return row.iso3 === STATE.tertiaryCompareCountry && row.age_label === STATE.tertiaryAge && row.sex === STATE.tertiarySex && row.education_level === STATE.tertiaryLevel;
    }));
    var pop = sortByYear((payload.country_age_structure || []).filter(function (row) { return row.iso3 === STATE.tertiaryCountry && row.status === "observed"; }));
    var traces = [
      { type: "scatter", mode: "lines+markers", name: countryName(payload, STATE.tertiaryCountry) + " - " + (EDUCATION_LABELS[STATE.tertiaryLevel] || STATE.tertiaryLevel), x: rows.map(function (r) { return r.year; }), y: rows.map(function (r) { return r.value; }), line: { color: COLORS.orange, width: 3 } },
      { type: "scatter", mode: "lines+markers", name: "Popolazione totale " + countryName(payload, STATE.tertiaryCountry), x: pop.map(function (r) { return r.year; }), y: pop.map(function (r) { return toNumber(r.population_total) / 1000000; }), yaxis: "y2", line: { color: COLORS.gray, width: 3, dash: "dot" } }
    ];
    if (STATE.tertiaryCompareCountry !== "none") {
      traces.push({ type: "scatter", mode: "lines+markers", name: countryName(payload, STATE.tertiaryCompareCountry), x: compare.map(function (r) { return r.year; }), y: compare.map(function (r) { return r.value; }), line: { color: COLORS.blue, width: 3, dash: "dash" } });
    }
    plot("diTertiaryChart", traces, { yaxis: { title: { text: "% livello selezionato" }, ticksuffix: "%" }, yaxis2: { title: { text: "Milioni residenti" }, overlaying: "y", side: "right" } });
  }

  function renderEuropeControls(payload) {
    var rows = rowsForMetricLevel(payload, STATE.europeMetric, "country").filter(function (row) { return toNumber(row.metric_value) !== null; });
    var years = unique(rows.map(function (row) { return row.year; })).sort(function (a, b) { return a - b; });
    STATE.europeYear = fillSelect("diEuropeYear", years.map(function (year) { return { value: year, label: String(year) }; }), STATE.europeYear || Math.min(2024, years[years.length - 1]), function (value) { STATE.europeYear = Number(value); });
  }

  function renderEuropeRankChart(payload) {
    renderEuropeControls(payload);
    var metric = METRICS[STATE.europeMetric];
    var copy = europeMetricCopy(STATE.europeMetric);
    var rows = rowsForMetricLevel(payload, STATE.europeMetric, "country").filter(function (row) {
      return Number(row.year) === Number(STATE.europeYear) && toNumber(row.metric_value) !== null;
    }).sort(function (a, b) { return toNumber(a.metric_value) - toNumber(b.metric_value); });
    setText("diEuropeRankTitle", copy.rankTitle);
    setText("diEuropeRankExplain", copy.explain);
    setHtml("diEuropeRankCredit", europeCredit(copy, "La classifica usa solo i paesi con valore disponibile nell'anno selezionato; l'Italia è evidenziata in arancione."));
    var tag = byId("diEuropeRankTag");
    if (tag) tag.textContent = metric.label + ", " + STATE.europeYear;
    plot("diEuropeRankChart", [{
      type: "bar",
      orientation: "h",
      name: metric.label,
      x: rows.map(function (row) { return scaledValue(row.metric_value, STATE.europeMetric); }),
      y: rows.map(function (row) { return countryName(payload, row.iso3); }),
      marker: { color: rows.map(function (row) { return row.iso3 === "ITA" ? COLORS.orange : COLORS.blue; }) }
    }], { xaxis: { title: { text: metricAxis(STATE.europeMetric) }, ticksuffix: metric.suffix || "" }, margin: { l: 150, r: 34, t: 18, b: 62 } });
  }

  function renderEuropeSeriesChart(payload) {
    var metric = METRICS[STATE.europeSeriesMetric];
    var copy = europeMetricCopy(STATE.europeSeriesMetric);
    var allRows = rowsForMetricLevel(payload, STATE.europeSeriesMetric, "country").filter(function (row) { return toNumber(row.metric_value) !== null; });
    var years = unique(allRows.map(function (row) { return row.year; })).sort(function (a, b) { return a - b; });
    var euMedian = years.map(function (year) {
      return { year: year, value: median(allRows.filter(function (row) { return Number(row.year) === Number(year); }).map(function (row) { return row.metric_value; })) };
    });
    setText("diEuropeSeriesTitle", copy.seriesTitle);
    setText("diEuropeSeriesExplain", copy.explain + " La linea grigia mostra la mediana annuale dei paesi UE disponibili.");
    setHtml("diEuropeSeriesCredit", europeCredit(copy, "La mediana UE è calcolata anno per anno sui paesi disponibili e non è ponderata per popolazione; il paese precaricato è la Spagna."));
    var tag = byId("diEuropeSeriesTag");
    if (tag) tag.textContent = "Italia, mediana UE e " + countryName(payload, STATE.europeCountry);
    plot("diEuropeSeriesChart", [
      metricSeriesTrace(payload, "country:ITA", STATE.europeSeriesMetric, COLORS.orange, "solid", "Italia"),
      metricSeriesTrace(payload, "country:" + STATE.europeCountry, STATE.europeSeriesMetric, COLORS.blue, "solid", countryName(payload, STATE.europeCountry)),
      { type: "scatter", mode: "lines+markers", name: "Mediana UE", x: euMedian.map(function (r) { return r.year; }), y: euMedian.map(function (r) { return scaledValue(r.value, STATE.europeSeriesMetric); }), line: { color: COLORS.gray, width: 3, dash: "dash" } }
    ], { yaxis: { title: { text: metricAxis(STATE.europeSeriesMetric) }, ticksuffix: metric.suffix || "" } });
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
    renderBirthDeathChart(payload);
    renderMigrationChart(payload);
    renderEducationChart(payload);
    renderEducationTrendChart(payload);
    renderEuropeRankChart(payload);
    renderEuropeSeriesChart(payload);
  }

  fetchJsonFrom(0).then(function (payload) {
    STATE.payload = payload;
    renderAll(payload);
    setStatus("");
  }).catch(function (error) {
    setStatus("Dati non disponibili: " + error.message + ".", "error");
    [
      "diKebabChart", "diPopulationChart", "diAgeSharesChart", "diAgeDistributionChart", "diDependencyChart",
      "diRegionalRankChart", "diRegionalSeriesChart", "diFertilityChart", "diBirthDeathChart", "diMigrationChart",
      "diEducationChart", "diTertiaryChart", "diEuropeRankChart", "diEuropeSeriesChart"
    ].forEach(function (id) {
      showEmpty(id, "Dati non disponibili.");
    });
  });
}());
