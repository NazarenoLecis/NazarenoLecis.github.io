(function () {
  "use strict";

  var DATA_URL = "https://data.nazarenolecis.com/salari-italia/gender-pay-gap.json";
  var FALLBACK_URL = "../../data/salari-italia/gender-pay-gap.json";
  var COLORS = ["#ff6b2a", "#4f8bd8", "#61c3b7", "#f2b84b", "#e45f68", "#6da65f", "#b58cff", "#8d8d8d"];
  var COMPONENT_LABELS = {
    unadjusted: "Divario osservato",
    explained_overall: "Totale spiegato",
    adjusted_unexplained: "Residuo adjusted",
    residual: "Adjusted / residuo",
    age: "Eta'",
    education: "Titolo di studio",
    economic_activity: "Attivita' economica",
    sector: "Settore economico",
    occupation: "Professione",
    working_time: "Tempo di lavoro",
    employment_contract: "Tipo di contratto",
    contract: "Contratto",
    enterprise_control: "Controllo dell'impresa",
    enterprise_size: "Dimensione dell'impresa",
    firm_size: "Dimensione impresa",
    geographical_location: "Area geografica",
    job_experience: "Esperienza lavorativa",
    public_private: "Pubblico/privato",
    other: "Altre componenti"
  };
  var COMPONENT_NOTES = {
    unadjusted: "Differenza osservata tra retribuzione oraria lorda media di uomini e donne.",
    explained_overall: "Parte del divario associata alle caratteristiche osservabili incluse nella decomposizione.",
    adjusted_unexplained: "Parte non spiegata dopo i controlli della decomposizione SES; coincide con la misura adjusted pubblicata dalla fonte.",
    residual: "Parte non spiegata dalle variabili del modello; nella fonte Eurostat e' l'adjusted gender pay gap.",
    age: "Effetto della diversa composizione per classe di eta'.",
    education: "Effetto della diversa distribuzione per titolo di studio.",
    economic_activity: "Effetto della diversa concentrazione tra attivita' economiche e settori produttivi.",
    sector: "Effetto della concentrazione in settori con livelli retributivi diversi.",
    occupation: "Effetto della diversa distribuzione tra professioni e livelli occupazionali.",
    working_time: "Effetto legato alla diversa presenza in tempo pieno e part-time.",
    employment_contract: "Effetto della diversa composizione per tipologia contrattuale.",
    contract: "Effetto legato alla composizione per tipo di contratto.",
    enterprise_control: "Effetto della diversa presenza in imprese a controllo pubblico o privato.",
    enterprise_size: "Effetto della diversa distribuzione per classe dimensionale dell'impresa.",
    firm_size: "Effetto legato alla diversa distribuzione per dimensione dell'impresa.",
    geographical_location: "Effetto della diversa distribuzione territoriale delle lavoratrici e dei lavoratori.",
    job_experience: "Effetto associato alla diversa anzianita' o esperienza lavorativa osservata nella fonte.",
    public_private: "Effetto della diversa presenza tra settore pubblico e privato.",
    other: "Componenti residue pubblicate dalla fonte."
  };
  var COMPONENT_ORDER = [
    "adjusted_unexplained",
    "economic_activity",
    "employment_contract",
    "enterprise_control",
    "enterprise_size",
    "geographical_location",
    "job_experience",
    "explained_overall",
    "residual",
    "age",
    "education",
    "occupation",
    "working_time",
    "unadjusted",
    "sector",
    "contract",
    "firm_size",
    "public_private",
    "other"
  ];
  var COUNTRY_ORDER = ["IT", "EU27_2020", "DE", "FR", "ES", "NL", "BE", "AT", "DK", "SE", "FI", "PT", "IE", "PL", "CZ", "EL"];

  var state = {
    rows: [],
    schema: [],
    lookups: {},
    countries: [],
    selectedCountries: [],
    selectedCountry: "IT",
    comparisonYear: null,
    startYear: null,
    endYear: null
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function toNumber(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function text(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback || "";
    return String(value);
  }

  function translate(value) {
    return window.SiteLanguage && window.SiteLanguage.t ? window.SiteLanguage.t(value) : value;
  }

  function normaliseCodeLabel(value) {
    return text(value)
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, function (match) { return match.toUpperCase(); });
  }

  function componentLabel(statistic) {
    return translate(COMPONENT_LABELS[statistic] || normaliseCodeLabel(statistic));
  }

  function componentNote(statistic) {
    return translate(COMPONENT_NOTES[statistic] || "Componente pubblicata dalla decomposizione ufficiale Eurostat SES.");
  }

  function componentOrder(statistic) {
    var index = COMPONENT_ORDER.indexOf(statistic);
    return index < 0 ? 999 : index;
  }

  function unadjustedAxisTitle() {
    return translate("Gender pay gap non aggiustato (%)");
  }

  function percent(value, digits) {
    var number = toNumber(value);
    if (number === null) return "n.d.";
    return number.toLocaleString("it-IT", { minimumFractionDigits: digits, maximumFractionDigits: digits }) + "%";
  }

  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function recordsFromPayload(payload) {
    var schema = toArray(payload.record_schema);
    state.schema = schema;
    return toArray(payload.records).map(function (record) {
      var row = {};
      schema.forEach(function (field, index) {
        row[field] = record[index];
      });
      return row;
    });
  }

  function countryName(code) {
    var match = state.rows.find(function (row) {
      return row.geography_code === code && row.geography_name;
    });
    return match ? match.geography_name : code;
  }

  function countryOptions(rows) {
    var seen = {};
    toArray(rows).forEach(function (row) {
      if (row.geography_code) seen[row.geography_code] = countryName(row.geography_code);
    });
    return Object.keys(seen).sort(function (a, b) {
      var orderA = COUNTRY_ORDER.indexOf(a);
      var orderB = COUNTRY_ORDER.indexOf(b);
      if (orderA >= 0 || orderB >= 0) return (orderA < 0 ? 999 : orderA) - (orderB < 0 ? 999 : orderB);
      return seen[a].localeCompare(seen[b], "it");
    }).map(function (code) {
      return { value: code, label: seen[code] };
    });
  }

  function years(rows) {
    var seen = {};
    toArray(rows).forEach(function (row) {
      if (row.year !== null && row.year !== undefined) seen[String(row.year)] = true;
    });
    return Object.keys(seen).sort(function (a, b) { return Number(a) - Number(b); });
  }

  function yearAxis(rows) {
    var ticks = years(rows);
    return {
      title: "",
      tickmode: "array",
      tickvals: ticks.map(Number),
      ticktext: ticks,
      gridcolor: cssVar("--gpg-grid", "#4a4a4a"),
      zerolinecolor: cssVar("--gpg-grid", "#4a4a4a"),
      automargin: true
    };
  }

  function ensureSelect(container, key, labelText, options, current, onChange) {
    var wrapper = container.querySelector('[data-filter="' + key + '"]');
    if (!options.length) {
      if (wrapper) wrapper.remove();
      return null;
    }
    if (!wrapper) {
      wrapper = document.createElement("label");
      wrapper.setAttribute("data-filter", key);
      var label = document.createElement("span");
      var select = document.createElement("select");
      label.textContent = translate(labelText);
      select.addEventListener("change", function () {
        onChange(select.value);
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
      item.textContent = translate(option.label);
      node.appendChild(item);
    });
    node.value = String(current);
    return node;
  }

  function ensureMultiSelect(container, key, labelText, options, selectedValues, onChange) {
    var wrapper = container.querySelector('[data-filter="' + key + '"]');
    if (!options.length) {
      if (wrapper) wrapper.remove();
      return null;
    }
    if (!wrapper) {
      wrapper = document.createElement("label");
      wrapper.setAttribute("data-filter", key);
      var label = document.createElement("span");
      var select = document.createElement("select");
      label.textContent = translate(labelText);
      select.multiple = true;
      select.addEventListener("change", function () {
        onChange(Array.prototype.slice.call(select.selectedOptions).map(function (option) {
          return option.value;
        }));
      });
      wrapper.appendChild(label);
      wrapper.appendChild(select);
      container.appendChild(wrapper);
    }
    var node = wrapper.querySelector("select");
    var selected = {};
    toArray(selectedValues).forEach(function (value) {
      selected[String(value)] = true;
    });
    clear(node);
    node.size = Math.min(Math.max(options.length, 4), 10);
    options.forEach(function (option) {
      var item = document.createElement("option");
      item.value = option.value;
      item.textContent = translate(option.label);
      item.selected = Boolean(selected[String(option.value)]);
      node.appendChild(item);
    });
    return node;
  }

  function plotLayout(extra) {
    return Object.assign({
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: cssVar("--gpg-chart-bg", "#1c1c1c"),
      font: { color: cssVar("--text", "#f3f3f3"), family: "inherit" },
      margin: { t: 24, r: 24, b: 56, l: 64 },
      xaxis: { gridcolor: cssVar("--gpg-grid", "#4a4a4a"), zerolinecolor: cssVar("--gpg-grid", "#4a4a4a"), automargin: true },
      yaxis: { gridcolor: cssVar("--gpg-grid", "#4a4a4a"), zerolinecolor: cssVar("--gpg-grid", "#4a4a4a"), automargin: true },
      legend: { orientation: "h", y: -0.22, x: 0 },
      hovermode: "closest"
    }, extra || {});
  }

  function plot(id, traces, layout) {
    var node = byId(id);
    if (!node || !window.Plotly) return;
    node.querySelectorAll(".gpg-empty").forEach(function (item) {
      item.remove();
    });
    window.Plotly.react(node, traces, plotLayout(layout), { responsive: true, displayModeBar: false });
  }

  function showEmpty(id, message) {
    var node = byId(id);
    if (!node) return;
    clear(node);
    var box = document.createElement("div");
    box.className = "gpg-empty";
    box.textContent = translate(message);
    node.appendChild(box);
  }

  function unadjustedRows() {
    return state.rows.filter(function (row) {
      return row.pay_concept === "gender_pay_gap_unadjusted";
    });
  }

  function adjustedRows() {
    return state.rows.filter(function (row) {
      return row.pay_concept === "gender_pay_gap_adjusted";
    });
  }

  function decompositionRows() {
    return state.rows.filter(function (row) {
      return row.pay_concept === "gender_pay_gap_decomposition";
    });
  }

  function latestRow(rows, filters) {
    return toArray(rows).filter(function (row) {
      return Object.keys(filters || {}).every(function (key) {
        return String(row[key]) === String(filters[key]);
      });
    }).sort(function (a, b) { return Number(b.year) - Number(a.year); })[0] || null;
  }

  function appendKpi(container, label, row, formatter, note) {
    var card = document.createElement("article");
    var title = document.createElement("span");
    var value = document.createElement("strong");
    var source = document.createElement("em");
    var detail = document.createElement("span");
    card.className = "gpg-kpi";
    title.textContent = translate(label);
    value.textContent = row ? formatter(row.value) : "n.d.";
    source.textContent = row ? text(row.year) + " · " + text(row.source, "fonte") : translate("non disponibile");
    detail.textContent = translate(note || "");
    card.appendChild(title);
    card.appendChild(value);
    card.appendChild(source);
    card.appendChild(detail);
    container.appendChild(card);
  }

  function renderKpis() {
    var container = byId("gpgKpis");
    if (!container) return;
    clear(container);
    var country = state.selectedCountry || "IT";
    appendKpi(container, "Non aggiustato", latestRow(unadjustedRows(), { geography_code: country }), function (value) { return percent(value, 1); }, countryName(country));
    appendKpi(container, "Adjusted", latestRow(adjustedRows(), { geography_code: country }), function (value) { return percent(value, 1); }, "Residuo della decomposizione SES");
    appendKpi(container, "Parte spiegata", latestRow(decompositionRows(), { geography_code: country, statistic: "explained_overall" }), function (value) { return percent(value, 1); }, "Composizione osservabile");
    appendKpi(container, "Paesi disponibili", { value: countryOptions(unadjustedRows()).length, year: "dataset", source: "Eurostat" }, function (value) { return String(value); }, "Serie non aggiustate pubblicate");
  }

  function defaultCountries(options) {
    var available = {};
    options.forEach(function (option) { available[option.value] = true; });
    var selected = COUNTRY_ORDER.filter(function (code) { return available[code]; }).slice(0, 8);
    return selected.length ? selected : options.slice(0, 8).map(function (option) { return option.value; });
  }

  function syncYearRange(rows, container, rerender) {
    var values = years(rows);
    if (!values.length) return;
    var first = values[0];
    var last = values[values.length - 1];
    if (!state.startYear || values.indexOf(String(state.startYear)) < 0) state.startYear = first;
    if (!state.endYear || values.indexOf(String(state.endYear)) < 0) state.endYear = last;
    if (Number(state.startYear) > Number(state.endYear)) {
      state.startYear = first;
      state.endYear = last;
    }
    var options = values.map(function (year) { return { value: year, label: year }; });
    ensureSelect(container, "start_year", "Da anno", options, state.startYear, function (value) {
      state.startYear = value;
      if (Number(state.startYear) > Number(state.endYear)) state.endYear = value;
      rerender();
    });
    ensureSelect(container, "end_year", "Ad anno", options, state.endYear, function (value) {
      state.endYear = value;
      if (Number(state.startYear) > Number(state.endYear)) state.startYear = value;
      rerender();
    });
  }

  function applyYearRange(rows) {
    return rows.filter(function (row) {
      var year = Number(row.year);
      if (!Number.isFinite(year)) return false;
      if (state.startYear && year < Number(state.startYear)) return false;
      if (state.endYear && year > Number(state.endYear)) return false;
      return true;
    });
  }

  function renderSeries() {
    var rows = unadjustedRows();
    var container = byId("gpgSeriesFilters");
    var options = countryOptions(rows);
    var available = {};
    options.forEach(function (option) { available[option.value] = true; });
    state.selectedCountries = toArray(state.selectedCountries).filter(function (code) { return available[code]; });
    if (!state.selectedCountries.length) state.selectedCountries = defaultCountries(options);
    ensureMultiSelect(container, "countries", "Paesi nel grafico", options, state.selectedCountries, function (values) {
      state.selectedCountries = values;
      renderSeries();
    });
    syncYearRange(rows, container, renderSeries);
    var selectedRows = applyYearRange(rows);
    var traces = state.selectedCountries.map(function (country, index) {
      var countryRows = selectedRows.filter(function (row) {
        return row.geography_code === country;
      }).sort(function (a, b) { return Number(a.year) - Number(b.year); });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: countryName(country),
        x: countryRows.map(function (row) { return row.year; }),
        y: countryRows.map(function (row) { return row.value; }),
        line: { color: COLORS[index % COLORS.length], width: country === "IT" ? 4 : 2 },
        marker: { size: 6 },
        hovertemplate: "%{x}<br>%{y:.1f}%<extra>%{fullData.name}</extra>"
      };
    }).filter(function (trace) { return trace.x.length; });
    if (!traces.length) {
      showEmpty("gpgSeriesChart", "Nessuna serie disponibile per questa selezione.");
      return;
    }
    byId("gpgSeriesTag").textContent = state.selectedCountries.length + " paesi · " + state.startYear + "-" + state.endYear;
    plot("gpgSeriesChart", traces, {
      height: 520,
      xaxis: yearAxis(selectedRows),
      yaxis: { title: unadjustedAxisTitle(), gridcolor: cssVar("--gpg-grid", "#4a4a4a"), zerolinecolor: cssVar("--gpg-grid", "#4a4a4a"), rangemode: "normal" }
    });
  }

  function renderComparison() {
    var rows = unadjustedRows().filter(function (row) {
      return toNumber(row.value) !== null;
    });
    var container = byId("gpgComparisonFilters");
    var values = years(rows);
    if (!values.length) {
      showEmpty("gpgComparisonChart", "Nessun confronto disponibile.");
      return;
    }
    if (!state.comparisonYear || values.indexOf(String(state.comparisonYear)) < 0) {
      state.comparisonYear = values[values.length - 1];
    }
    ensureSelect(container, "comparison_year", "Anno", values.map(function (year) {
      return { value: year, label: year };
    }), state.comparisonYear, function (value) {
      state.comparisonYear = value;
      renderComparison();
    });
    var selected = rows.filter(function (row) {
      return String(row.year) === String(state.comparisonYear);
    }).sort(function (a, b) {
      return toNumber(a.value) - toNumber(b.value);
    });
    if (!selected.length) {
      showEmpty("gpgComparisonChart", "Nessun confronto disponibile per questo anno.");
      return;
    }
    byId("gpgComparisonTag").textContent = state.comparisonYear + " · " + selected.length + " paesi";
    plot("gpgComparisonChart", [{
      type: "bar",
      orientation: "h",
      x: selected.map(function (row) { return row.value; }),
      y: selected.map(function (row) { return countryName(row.geography_code); }),
      marker: { color: selected.map(function (row) { return row.geography_code === "IT" ? COLORS[0] : COLORS[1]; }) },
      hovertemplate: "%{y}<br>%{x:.1f}%<extra></extra>"
    }], {
      height: Math.max(520, selected.length * 24 + 140),
      margin: { t: 24, r: 24, b: 56, l: 150 },
      xaxis: { title: unadjustedAxisTitle(), gridcolor: cssVar("--gpg-grid", "#4a4a4a"), zerolinecolor: cssVar("--gpg-grid", "#4a4a4a") },
      yaxis: { title: "", automargin: true }
    });
  }

  function renderAdjusted() {
    var rows = decompositionRows();
    var container = byId("gpgAdjustedFilters");
    var options = countryOptions(rows);
    var codes = options.map(function (option) { return option.value; });
    if (codes.indexOf(state.selectedCountry) < 0) state.selectedCountry = codes.indexOf("IT") >= 0 ? "IT" : codes[0];
    ensureSelect(container, "country", "Paese", options, state.selectedCountry, function (value) {
      state.selectedCountry = value;
      renderKpis();
      renderAdjusted();
    });
    var selected = rows.filter(function (row) {
      return row.geography_code === state.selectedCountry && row.statistic !== "unadjusted";
    }).sort(function (a, b) {
      return componentOrder(a.statistic) - componentOrder(b.statistic);
    });
    if (!selected.length) {
      showEmpty("gpgAdjustedChart", "Decomposizione adjusted non disponibile per questo paese.");
      return;
    }
    byId("gpgAdjustedTag").textContent = countryName(state.selectedCountry) + " · " + selected[0].year;
    plot("gpgAdjustedChart", [{
      type: "bar",
      x: selected.map(function (row) { return componentLabel(row.statistic); }),
      y: selected.map(function (row) { return row.value; }),
      marker: { color: selected.map(function (row) { return row.statistic === "residual" ? COLORS[0] : COLORS[1]; }) },
      customdata: selected.map(function (row) { return componentNote(row.statistic); }),
      hovertemplate: "<b>%{x}</b><br>%{y:.1f}%<br>%{customdata}<extra></extra>"
    }], {
      height: 520,
      margin: { t: 24, r: 24, b: 110, l: 64 },
      xaxis: { title: "", tickangle: -28, gridcolor: cssVar("--gpg-grid", "#4a4a4a"), zerolinecolor: cssVar("--gpg-grid", "#4a4a4a") },
      yaxis: { title: "Punti percentuali", gridcolor: cssVar("--gpg-grid", "#4a4a4a"), zerolinecolor: cssVar("--gpg-grid", "#4a4a4a") }
    });
    renderComponentGuide(selected);
  }

  function renderComponentGuide(rows) {
    var container = byId("gpgComponentGuide");
    if (!container) return;
    clear(container);
    rows.forEach(function (row) {
      var item = document.createElement("article");
      var title = document.createElement("h3");
      var note = document.createElement("span");
      item.className = "gpg-guide-item";
      title.textContent = componentLabel(row.statistic);
      note.textContent = componentNote(row.statistic);
      item.appendChild(title);
      item.appendChild(note);
      container.appendChild(item);
    });
  }

  function renderMethod() {
    var container = byId("gpgMethod");
    if (!container) return;
    clear(container);
    [
      ["Non aggiustato", "Misura il divario osservato nella retribuzione oraria lorda media. E' un indicatore aggregato: tiene insieme struttura del mercato del lavoro, settore, orario, contratto e livelli professionali."],
      ["Adjusted", "Misura la parte residua dopo aver controllato per le caratteristiche osservabili nella decomposizione Eurostat SES 2022. La dashboard non produce una stima autonoma."],
      ["Composizione", "La parte spiegata cattura quanto pesano distribuzioni diverse tra eta', istruzione, professioni, settori, orario di lavoro, contratto, dimensione d'impresa e pubblico/privato."],
      ["Limite", "Il residuo adjusted non prova discriminazione individuale: indica solo la quota non spiegata dalle variabili disponibili nel modello ufficiale e puo' includere fattori non osservati."]
    ].forEach(function (entry) {
      var item = document.createElement("article");
      var title = document.createElement("h3");
      var note = document.createElement("span");
      item.className = "gpg-method-item";
      title.textContent = translate(entry[0]);
      note.textContent = translate(entry[1]);
      item.appendChild(title);
      item.appendChild(note);
      container.appendChild(item);
    });
  }

  function renderAll() {
    renderKpis();
    renderSeries();
    renderComparison();
    renderAdjusted();
    renderMethod();
  }

  function applyPayload(payload) {
    state.rows = recordsFromPayload(payload);
    state.countries = countryOptions(state.rows);
    var status = byId("gpgStatus");
    if (status) status.textContent = "";
    renderAll();
  }

  function loadData(url) {
    return fetch(url, { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    });
  }

  function initialize() {
    loadData(DATA_URL)
      .catch(function () { return loadData(FALLBACK_URL); })
      .then(applyPayload)
      .catch(function (error) {
        var status = byId("gpgStatus");
        if (status) status.textContent = "Non riesco a caricare i dati gender pay gap: " + error.message;
        ["gpgSeriesChart", "gpgComparisonChart", "gpgAdjustedChart"].forEach(function (id) {
          showEmpty(id, "Dati non disponibili.");
        });
      });
  }

  document.addEventListener("DOMContentLoaded", initialize);
  window.addEventListener("themechange", renderAll);
  window.addEventListener("site-language-change", renderAll);
})();
