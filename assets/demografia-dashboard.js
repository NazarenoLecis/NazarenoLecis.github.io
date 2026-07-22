(function () {
  "use strict";

  var DATA_SOURCES = [
    "../../data/demografia/dashboard.json?v=20260722-1",
    "https://data.nazarenolecis.com/demografia/dashboard.json?v=20260722-1",
    "https://raw.githubusercontent.com/NazarenoLecis/nazarenolecis-data-pipeline/main/publish/demografia/dashboard.json"
  ];

  var STATE = {
    payload: null,
    kebabYear: null
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

  var EDUCATION_LABELS = {
    low_education: "Fino alla licenza media",
    upper_secondary_post_secondary: "Secondaria superiore",
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
    return rows.slice().sort(function (a, b) {
      return Number(a.year || 0) - Number(b.year || 0);
    });
  }

  function latest(rows, predicate) {
    var candidates = rows.filter(function (row) {
      return toNumber(row.year) !== null && (!predicate || predicate(row));
    });
    if (!candidates.length) return null;
    return sortByYear(candidates).pop();
  }

  function latestNonNull(rows, field, predicate) {
    return latest(rows, function (row) {
      return toNumber(row[field]) !== null && (!predicate || predicate(row));
    });
  }

  function preferredAgeRows(rows) {
    var byYear = {};
    rows.forEach(function (row) {
      var year = toNumber(row.year);
      if (year === null) return;
      var current = byYear[year];
      if (!current || row.status === "observed") byYear[year] = row;
    });
    return sortByYear(Object.keys(byYear).map(function (year) { return byYear[year]; }));
  }

  function formatNumber(value, digits) {
    var parsed = toNumber(value);
    if (parsed === null) return "ND";
    return parsed.toLocaleString("it-IT", {
      minimumFractionDigits: digits || 0,
      maximumFractionDigits: digits || 0
    });
  }

  function formatDecimal(value, digits) {
    var parsed = toNumber(value);
    if (parsed === null) return "ND";
    return parsed.toLocaleString("it-IT", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
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
    var sign = parsed > 0 ? "+" : "";
    return sign + formatNumber(parsed);
  }

  function sexLabel(value) {
    if (value === "M") return "Uomini";
    if (value === "F") return "Donne";
    return "Totale";
  }

  function isTotalFertility(row) {
    return toNumber(row.age_low) === null && toNumber(row.age_high) === null;
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
      margin: { l: 58, r: 28, t: 18, b: 54 },
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
    if (index >= DATA_SOURCES.length) {
      return Promise.reject(new Error("Nessuna sorgente dati disponibile"));
    }
    var url = DATA_SOURCES[index];
    return fetch(url, { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status + " da " + url);
      return response.json();
    }).catch(function () {
      return fetchJsonFrom(index + 1);
    });
  }

  function createKpi(label, value, tag, note) {
    var item = document.createElement("div");
    item.className = "di-kpi";
    item.innerHTML = [
      "<span>" + label + "</span>",
      "<strong>" + value + "</strong>",
      "<em>" + tag + "</em>",
      "<small>" + note + "</small>"
    ].join("");
    return item;
  }

  function renderKpis(payload) {
    var node = byId("diKpis");
    if (!node) return;
    node.innerHTML = "";

    var observed = latest(payload.age_structure || [], function (row) { return row.status === "observed"; });
    var projected = latest(payload.age_structure || [], function (row) { return row.status === "projected"; });
    var fertility = latestNonNull(payload.fertility || [], "value", isTotalFertility);
    var birthRate = latestNonNull(payload.demographic_balance || [], "balance_gbirthrt");
    var migration = latestNonNull(payload.demographic_balance || [], "net_migration_adjustment");
    var tertiary = latestNonNull(payload.education_attainment || [], "value", function (row) {
      return row.age_label === "25-64" && row.sex === "T" && row.education_level === "tertiary";
    });

    var projectedNote = projected
      ? "Scenario " + (projected.scenario || "base") + ", 65+ " + formatPercent(projected.share_65_plus)
      : "Proiezione non disponibile";

    [
      createKpi("Popolazione", formatMillions(observed && observed.population_total), observed ? observed.year + " osservato" : "ND", "Residenti totali a inizio anno."),
      createKpi("Eta' mediana", formatNumber(observed && observed.median_age) + " anni", observed ? observed.year + " osservato" : "ND", "Mediana della distribuzione per eta'."),
      createKpi("Quota 65+", formatPercent(observed && observed.share_65_plus), observed ? observed.year + " osservato" : "ND", "Peso della popolazione in eta' anziana."),
      createKpi("Dipendenza anziani", formatDecimal(observed && observed.dependency_old, 1), "ogni 100 persone 15-64", "Indicatore strutturale di pressione demografica."),
      createKpi("Fecondita'", formatDecimal(fertility && fertility.value, 2), fertility ? fertility.year + " Eurostat" : "ND", "Figli per donna, tasso totale di fecondita'."),
      createKpi("Natalita'", formatDecimal(birthRate && birthRate.balance_gbirthrt, 1), birthRate ? birthRate.year + " per 1.000" : "ND", "Nati vivi per 1.000 abitanti."),
      createKpi("Saldo migratorio", formatSigned(migration && migration.net_migration_adjustment), migration ? migration.year + " persone" : "ND", "Saldo migratorio con aggiustamento statistico."),
      createKpi("Laurea 25-64", formatPercent(tertiary && tertiary.value), tertiary ? tertiary.year + " totale" : "ND", "Quota con istruzione terziaria."),
      createKpi("Popolazione 2030", formatMillions(projected && projected.population_total), projected ? projected.year + " proiezione" : "ND", projectedNote)
    ].forEach(function (item) { node.appendChild(item); });
  }

  function renderKebabControls(payload) {
    var select = byId("diKebabYear");
    if (!select) return;
    var years = Array.from(new Set((payload.population_age_sex || []).map(function (row) {
      return toNumber(row.year);
    }).filter(function (year) { return year !== null; }))).sort(function (a, b) { return a - b; });
    var latestObserved = payload.meta && payload.meta.latest_observed_year;
    if (STATE.kebabYear === null) STATE.kebabYear = latestObserved || years[years.length - 1] || null;

    select.innerHTML = years.map(function (year) {
      var label = year <= latestObserved ? year + " osservato" : year + " proiezione";
      return "<option value=\"" + year + "\">" + label + "</option>";
    }).join("");
    if (STATE.kebabYear !== null) select.value = String(STATE.kebabYear);
    select.onchange = function () {
      STATE.kebabYear = Number(select.value);
      renderKebabChart(STATE.payload);
    };
  }

  function renderKebabChart(payload) {
    var year = STATE.kebabYear;
    if (!year) {
      showEmpty("diKebabChart");
      return;
    }
    var yearRows = (payload.population_age_sex || []).filter(function (row) {
      return Number(row.year) === Number(year) && (row.sex === "M" || row.sex === "F");
    });
    var hasObserved = yearRows.some(function (row) { return row.status === "observed"; });
    var status = hasObserved ? "observed" : "projected";
    var rows = yearRows.filter(function (row) { return row.status === status; });
    var byAge = {};
    rows.forEach(function (row) {
      var age = toNumber(row.age_low);
      var value = toNumber(row.value);
      if (age === null || value === null) return;
      if (!byAge[age]) byAge[age] = { age: age, label: row.age_label || String(age), M: 0, F: 0 };
      byAge[age][row.sex] += value;
    });
    var ages = Object.keys(byAge).map(function (key) { return byAge[key]; }).sort(function (a, b) { return a.age - b.age; });
    if (!ages.length) {
      showEmpty("diKebabChart");
      return;
    }

    var male = ages.map(function (row) { return -row.M / 1000000; });
    var female = ages.map(function (row) { return row.F / 1000000; });
    var labels = ages.map(function (row) { return row.label; });
    var maxValue = Math.max.apply(null, male.concat(female).map(Math.abs)) || 1;
    var limit = Math.ceil(maxValue * 12) / 10;
    var tickValues = [-limit, -limit / 2, 0, limit / 2, limit];
    var tickText = tickValues.map(function (value) {
      return Math.abs(value).toLocaleString("it-IT", { maximumFractionDigits: 1 });
    });
    var tag = byId("diKebabTag");
    if (tag) tag.textContent = year + " " + (status === "observed" ? "osservato" : "proiezione");

    plot("diKebabChart", [
      {
        type: "bar",
        orientation: "h",
        name: "Uomini",
        x: male,
        y: labels,
        marker: { color: COLORS.blue },
        customdata: ages.map(function (row) { return row.M; }),
        hovertemplate: "Eta' %{y}<br>Uomini: %{customdata:,.0f}<extra></extra>"
      },
      {
        type: "bar",
        orientation: "h",
        name: "Donne",
        x: female,
        y: labels,
        marker: { color: COLORS.orange },
        customdata: ages.map(function (row) { return row.F; }),
        hovertemplate: "Eta' %{y}<br>Donne: %{customdata:,.0f}<extra></extra>"
      }
    ], {
      barmode: "relative",
      bargap: 0.05,
      hovermode: "closest",
      margin: { l: 54, r: 24, t: 8, b: 58 },
      xaxis: {
        title: { text: "Milioni di persone" },
        range: [-limit, limit],
        tickvals: tickValues,
        ticktext: tickText,
        zeroline: true
      },
      yaxis: { title: { text: "Eta'" } }
    });
  }

  function renderPopulationChart(payload) {
    var rows = payload.age_structure || [];
    var observed = sortByYear(rows.filter(function (row) { return row.status === "observed"; }));
    var projected = sortByYear(rows.filter(function (row) { return row.status === "projected"; }));
    plot("diPopulationChart", [
      {
        type: "scatter",
        mode: "lines+markers",
        name: "Osservato",
        x: observed.map(function (row) { return row.year; }),
        y: observed.map(function (row) { return toNumber(row.population_total) / 1000000; }),
        line: { color: COLORS.orange, width: 3 }
      },
      {
        type: "scatter",
        mode: "lines+markers",
        name: "Proiezione",
        x: projected.map(function (row) { return row.year; }),
        y: projected.map(function (row) { return toNumber(row.population_total) / 1000000; }),
        line: { color: COLORS.blue, width: 3, dash: "dash" }
      }
    ], {
      yaxis: { title: { text: "Milioni" } }
    });
  }

  function renderAgeSharesChart(payload) {
    var rows = preferredAgeRows(payload.age_structure || []);
    var traces = [
      ["0-14", "share_0_14", COLORS.teal],
      ["15-64", "share_15_64", COLORS.blue],
      ["65+", "share_65_plus", COLORS.orange],
      ["80+", "share_80_plus", COLORS.purple]
    ].map(function (spec) {
      return {
        type: "scatter",
        mode: "lines+markers",
        name: spec[0],
        x: rows.map(function (row) { return row.year; }),
        y: rows.map(function (row) { return row[spec[1]]; }),
        line: { color: spec[2], width: 3 }
      };
    });
    plot("diAgeSharesChart", traces, {
      yaxis: { title: { text: "% popolazione" }, ticksuffix: "%" }
    });
  }

  function renderAgeDistributionChart(payload) {
    var rows = preferredAgeRows(payload.age_structure || []);
    var specs = [
      ["P10", "age_p10", COLORS.teal, "dot"],
      ["P25", "age_p25", COLORS.green, "dot"],
      ["Mediana", "median_age", COLORS.orange, "solid"],
      ["Media", "mean_age", COLORS.blue, "solid"],
      ["P75", "age_p75", COLORS.purple, "dot"],
      ["P90", "age_p90", COLORS.red, "dot"]
    ];
    var traces = specs.map(function (spec) {
      return {
        type: "scatter",
        mode: "lines+markers",
        name: spec[0],
        x: rows.map(function (row) { return row.year; }),
        y: rows.map(function (row) { return row[spec[1]]; }),
        line: { color: spec[2], width: spec[0] === "Mediana" ? 4 : 2, dash: spec[3] }
      };
    });
    plot("diAgeDistributionChart", traces, {
      yaxis: { title: { text: "Anni" } }
    });
  }

  function renderDependencyChart(payload) {
    var rows = preferredAgeRows(payload.age_structure || []);
    plot("diDependencyChart", [
      {
        type: "scatter",
        mode: "lines+markers",
        name: "Dipendenza anziani",
        x: rows.map(function (row) { return row.year; }),
        y: rows.map(function (row) { return row.dependency_old; }),
        line: { color: COLORS.orange, width: 3 }
      },
      {
        type: "scatter",
        mode: "lines+markers",
        name: "Dipendenza totale",
        x: rows.map(function (row) { return row.year; }),
        y: rows.map(function (row) { return row.dependency_total; }),
        line: { color: COLORS.blue, width: 3 }
      }
    ], {
      yaxis: { title: { text: "Persone ogni 100 attivi" } }
    });
  }

  function renderFertilityChart(payload) {
    var fertility = sortByYear((payload.fertility || []).filter(function (row) {
      return toNumber(row.value) !== null && isTotalFertility(row);
    }));
    var balance = sortByYear((payload.demographic_balance || []).filter(function (row) {
      return toNumber(row.balance_gbirthrt) !== null;
    }));
    plot("diFertilityChart", [
      {
        type: "scatter",
        mode: "lines+markers",
        name: "Fecondita'",
        x: fertility.map(function (row) { return row.year; }),
        y: fertility.map(function (row) { return row.value; }),
        line: { color: COLORS.orange, width: 3 }
      },
      {
        type: "scatter",
        mode: "lines+markers",
        name: "Natalita'",
        x: balance.map(function (row) { return row.year; }),
        y: balance.map(function (row) { return row.balance_gbirthrt; }),
        yaxis: "y2",
        line: { color: COLORS.teal, width: 3 }
      }
    ], {
      yaxis: { title: { text: "Figli per donna" } },
      yaxis2: {
        title: { text: "Nati per 1.000 abitanti" },
        overlaying: "y",
        side: "right"
      }
    });
  }

  function renderMigrationChart(payload) {
    var rows = sortByYear((payload.demographic_balance || []).filter(function (row) {
      return toNumber(row.immigration) !== null && toNumber(row.net_migration_adjustment) !== null;
    }));
    var x = rows.map(function (row) { return row.year; });
    var immigration = rows.map(function (row) { return toNumber(row.immigration) / 1000; });
    var net = rows.map(function (row) { return toNumber(row.net_migration_adjustment) / 1000; });
    var emigration = rows.map(function (row) {
      return -((toNumber(row.immigration) - toNumber(row.net_migration_adjustment)) / 1000);
    });
    plot("diMigrationChart", [
      {
        type: "bar",
        name: "Immigrazione",
        x: x,
        y: immigration,
        marker: { color: COLORS.green }
      },
      {
        type: "bar",
        name: "Emigrazione stimata",
        x: x,
        y: emigration,
        marker: { color: COLORS.red }
      },
      {
        type: "scatter",
        mode: "lines+markers",
        name: "Saldo",
        x: x,
        y: net,
        line: { color: COLORS.orange, width: 3 }
      }
    ], {
      barmode: "relative",
      yaxis: { title: { text: "Migliaia di persone" }, zeroline: true }
    });
  }

  function renderEducationChart(payload) {
    var rows = payload.education_attainment || [];
    var latestYear = latestNonNull(rows, "value", function (row) {
      return row.age_label === "25-64" && row.sex === "T" && row.education_level === "tertiary";
    });
    var year = latestYear && latestYear.year;
    var chartRows = rows.filter(function (row) {
      return row.year === year && row.age_label === "25-64" && row.sex === "T" &&
        ["low_education", "upper_secondary_post_secondary", "tertiary"].indexOf(row.education_level) !== -1;
    }).sort(function (a, b) {
      var order = ["low_education", "upper_secondary_post_secondary", "tertiary"];
      return order.indexOf(a.education_level) - order.indexOf(b.education_level);
    });
    var tag = byId("diEducationTag");
    if (tag && year) tag.textContent = "25-64, " + year;
    plot("diEducationChart", [{
      type: "bar",
      name: "Quota",
      x: chartRows.map(function (row) { return EDUCATION_LABELS[row.education_level] || row.education_level; }),
      y: chartRows.map(function (row) { return row.value; }),
      marker: { color: [COLORS.red, COLORS.blue, COLORS.orange] },
      hovertemplate: "%{x}<br>%{y:.1f}%<extra></extra>"
    }], {
      yaxis: { title: { text: "% popolazione 25-64" }, ticksuffix: "%" }
    });
  }

  function renderTertiaryChart(payload) {
    var rows = payload.education_attainment || [];
    var traces = ["T", "M", "F"].map(function (sex, index) {
      var series = sortByYear(rows.filter(function (row) {
        return row.age_label === "25-64" && row.education_level === "tertiary" && row.sex === sex;
      }));
      return {
        type: "scatter",
        mode: "lines+markers",
        name: sexLabel(sex),
        x: series.map(function (row) { return row.year; }),
        y: series.map(function (row) { return row.value; }),
        line: { color: [COLORS.orange, COLORS.blue, COLORS.purple][index], width: 3 }
      };
    });
    plot("diTertiaryChart", traces, {
      yaxis: { title: { text: "% popolazione 25-64" }, ticksuffix: "%" }
    });
  }

  function renderAll(payload) {
    renderKpis(payload);
    renderKebabControls(payload);
    renderKebabChart(payload);
    renderPopulationChart(payload);
    renderAgeSharesChart(payload);
    renderAgeDistributionChart(payload);
    renderDependencyChart(payload);
    renderFertilityChart(payload);
    renderMigrationChart(payload);
    renderEducationChart(payload);
    renderTertiaryChart(payload);
  }

  fetchJsonFrom(0).then(function (payload) {
    STATE.payload = payload;
    renderAll(payload);
    var prepared = payload.meta && payload.meta.updated_at ? payload.meta.updated_at.slice(0, 10) : "data non disponibile";
    setStatus("Dati caricati. Payload aggiornato: " + prepared + ".");
  }).catch(function (error) {
    setStatus("Dati non disponibili: " + error.message + ".", "error");
    ["diKebabChart", "diPopulationChart", "diAgeSharesChart", "diAgeDistributionChart", "diDependencyChart", "diFertilityChart", "diMigrationChart", "diEducationChart", "diTertiaryChart"].forEach(function (id) {
      showEmpty(id, "Dati non disponibili.");
    });
  });
}());
