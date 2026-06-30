(function () {
  var EUROSTAT_BASE = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/";
  var LOCAL_INDEX_URL = "../../data/crisi-abitativa/local_index.json";
  var LOCAL_REGION_BASE = "../../data/crisi-abitativa/regions/";
  var ITALY = "IT";
  var EU27 = "EU27_2020";
  var COUNTRY_RE = /^[A-Z]{2}$/;

  var indicators = [
    {
      id: "housing_overburden",
      label: "Popolazione con costi abitativi oltre il 40% del reddito",
      shortLabel: "Housing cost overburden",
      dataset: "ilc_lvho07a",
      params: { unit: "PC", rskpovth: "TOTAL", age: "TOTAL", sex: "T" },
      unit: "%",
      source: "Eurostat ilc_lvho07a",
      note: "Quota di popolazione in famiglie con costi abitativi totali superiori al 40% del reddito disponibile."
    }
  ];

  var localMetrics = {
    rent_mean: { label: "Affitto medio OMI", unit: "euro/mq/mese" },
    rent_median: { label: "Affitto mediano OMI", unit: "euro/mq/mese" },
    sale_mean: { label: "Prezzo vendita medio OMI", unit: "euro/mq" },
    sale_median: { label: "Prezzo vendita mediano OMI", unit: "euro/mq" }
  };

  var state = {
    europeCache: {},
    europeData: null,
    localIndex: null,
    localCache: {}
  };

  function byId(id) { return document.getElementById(id); }

  function cssColor(name, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  function plotTheme() {
    return {
      text: cssColor("--text", "#f5f2ed"),
      muted: cssColor("--muted", "#b9b2aa"),
      line: cssColor("--line", "#303030"),
      orange: cssColor("--orange", "#ff5a1f")
    };
  }

  function eurostatUrl(indicator) {
    var params = new URLSearchParams(Object.assign({ lang: "en" }, indicator.params));
    return EUROSTAT_BASE + indicator.dataset + "?" + params.toString();
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatValue(value, unit) {
    if (!Number.isFinite(value)) return "-";
    return value.toLocaleString("it-IT", { maximumFractionDigits: 1 }) + (unit ? " " + unit : "");
  }

  function renderMessage(id, message, loading) {
    var el = byId(id);
    if (!el) return;
    if (window.Plotly) window.Plotly.purge(el);
    el.innerHTML = "<div class=\"empty-state" + (loading ? " loading-state" : "") + "\">" + escapeHtml(message) + "</div>";
  }

  function fetchJson(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    });
  }

  function decodeIndex(flatIndex, sizes) {
    var idx = Number(flatIndex);
    var coords = new Array(sizes.length);
    for (var i = sizes.length - 1; i >= 0; i -= 1) {
      coords[i] = idx % sizes[i];
      idx = Math.floor(idx / sizes[i]);
    }
    return coords;
  }

  function codeAt(payload, dimensionId, position) {
    var category = payload.dimension[dimensionId].category;
    var index = category.index || {};
    return Object.keys(index).find(function (code) { return index[code] === position; });
  }

  function labelFor(payload, dimensionId, code) {
    var labels = payload.dimension[dimensionId].category.label || {};
    return labels[code] || code;
  }

  function isCountry(code) {
    return COUNTRY_RE.test(code || "") || code === "EL";
  }

  function parseEurostat(payload) {
    var ids = payload.id || [];
    var sizes = payload.size || [];
    var values = payload.value || {};
    var records = [];
    Object.keys(values).forEach(function (flatIndex) {
      var value = Number(values[flatIndex]);
      if (!Number.isFinite(value)) return;
      var coords = decodeIndex(flatIndex, sizes);
      var row = { value: value };
      ids.forEach(function (id, i) { row[id] = codeAt(payload, id, coords[i]); });
      row.geo_label = labelFor(payload, "geo", row.geo);
      row.year = Number(row.time);
      if (Number.isFinite(row.year)) records.push(row);
    });
    return records;
  }

  function groupByYear(records) {
    var map = new Map();
    records.forEach(function (record) {
      if (!map.has(record.year)) map.set(record.year, []);
      map.get(record.year).push(record);
    });
    return map;
  }

  function countryOptions(records) {
    var countries = new Map();
    records.forEach(function (record) {
      if (isCountry(record.geo) && record.geo !== ITALY) countries.set(record.geo, record.geo_label);
    });
    return Array.from(countries.entries()).sort(function (a, b) {
      return a[1].localeCompare(b[1], "it");
    });
  }

  function populateEuropeControls(records) {
    byId("europeIndicator").innerHTML = indicators.map(function (indicator) {
      return "<option value=\"" + indicator.id + "\">" + escapeHtml(indicator.label) + "</option>";
    }).join("");
    byId("highlightCountries").innerHTML = countryOptions(records).map(function (entry) {
      return "<option value=\"" + entry[0] + "\">" + escapeHtml(entry[1]) + "</option>";
    }).join("");
  }

  function selectedHighlightCountries() {
    return Array.from(byId("highlightCountries").selectedOptions || []).map(function (option) { return option.value; });
  }

  function traceForCountry(records, code, name, color, width) {
    var rows = records.filter(function (record) { return record.geo === code; }).sort(function (a, b) { return a.year - b.year; });
    return {
      type: "scatter",
      mode: "lines+markers",
      name: name,
      x: rows.map(function (record) { return record.year; }),
      y: rows.map(function (record) { return record.value; }),
      line: { color: color, width: width || 2 },
      marker: { color: color, size: width > 2 ? 7 : 5 },
      hovertemplate: "<b>%{fullData.name}</b><br>Anno: %{x}<br>Valore: %{y:.1f}<extra></extra>"
    };
  }

  function renderEurope() {
    var indicator = indicators.find(function (item) { return item.id === byId("europeIndicator").value; }) || indicators[0];
    var records = state.europeData || [];
    if (!records.length) return renderMessage("europeChart", "Nessun dato europeo disponibile.");

    var byYear = groupByYear(records.filter(function (record) { return isCountry(record.geo); }));
    var years = Array.from(byYear.keys()).sort(function (a, b) { return a - b; });
    var minValues = [];
    var maxValues = [];
    years.forEach(function (year) {
      var values = byYear.get(year).map(function (record) { return record.value; }).filter(Number.isFinite);
      minValues.push(Math.min.apply(null, values));
      maxValues.push(Math.max.apply(null, values));
    });

    var theme = plotTheme();
    var traces = [
      {
        type: "scatter",
        mode: "lines",
        name: "Massimo paesi",
        x: years,
        y: maxValues,
        line: { color: "rgba(255,255,255,0)", width: 0 },
        hoverinfo: "skip",
        showlegend: false
      },
      {
        type: "scatter",
        mode: "lines",
        name: "Range paesi",
        x: years,
        y: minValues,
        fill: "tonexty",
        fillcolor: "rgba(255,90,31,.16)",
        line: { color: "rgba(255,255,255,0)", width: 0 },
        hoverinfo: "skip"
      }
    ];

    if (records.some(function (record) { return record.geo === EU27; })) {
      traces.push(traceForCountry(records, EU27, "EU27", theme.muted, 2));
    }
    traces.push(traceForCountry(records, ITALY, "Italia", theme.orange, 4));

    var colors = ["#4e79a7", "#59a14f", "#e15759", "#b07aa1", "#76b7b2", "#edc948"];
    selectedHighlightCountries().forEach(function (code, index) {
      var label = records.find(function (record) { return record.geo === code; });
      traces.push(traceForCountry(records, code, label ? label.geo_label : code, colors[index % colors.length], 2));
    });

    byId("europeTitle").textContent = indicator.shortLabel;
    var italyRows = records.filter(function (record) { return record.geo === ITALY; }).sort(function (a, b) { return b.year - a.year; });
    var latestItaly = italyRows[0];
    if (latestItaly) {
      var latestValues = (byYear.get(latestItaly.year) || []).map(function (record) { return record.value; }).filter(Number.isFinite);
      byId("kpiItalyLabel").textContent = "Italia ultimo dato";
      byId("kpiItaly").textContent = formatValue(latestItaly.value, indicator.unit);
      byId("kpiRange").textContent = formatValue(Math.min.apply(null, latestValues), indicator.unit) + " - " + formatValue(Math.max.apply(null, latestValues), indicator.unit);
      byId("kpiYear").textContent = latestItaly.year;
      byId("europeComment").innerHTML = "<strong>Come leggere:</strong> " + escapeHtml(indicator.note) + " La banda arancione indica il range tra paesi disponibili; non misura una media europea.";
    }

    window.Plotly.react("europeChart", traces, {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: theme.text, family: "system-ui, -apple-system, Segoe UI, sans-serif", size: 14 },
      margin: { l: 72, r: 180, t: 14, b: 64 },
      xaxis: { title: { text: "Anno" }, gridcolor: theme.line, fixedrange: true, dtick: 1 },
      yaxis: { title: { text: indicator.label + (indicator.unit ? " (" + indicator.unit + ")" : "") }, gridcolor: theme.line, fixedrange: true },
      legend: { orientation: "v", x: 1.02, y: 1, xanchor: "left" }
    }, { responsive: true, displayModeBar: false });
  }

  function loadEurope() {
    var indicator = indicators[0];
    renderMessage("europeChart", "Caricamento dati Eurostat...", true);
    return fetchJson(eurostatUrl(indicator)).then(function (payload) {
      state.europeData = parseEurostat(payload);
      populateEuropeControls(state.europeData);
      renderEurope();
    }).catch(function (error) {
      renderMessage("europeChart", "Non riesco a caricare Eurostat: " + error.message);
      byId("europeComment").textContent = "Se l'API Eurostat non risponde, rigenera un export statico dal repository Crisi_abitativa e collegalo alla dashboard.";
    });
  }

  function populateLocalControls(index) {
    var select = byId("localRegion");
    var regions = index.regions || [];
    if (!regions.length) {
      select.innerHTML = "<option value=\"\">Export locale non disponibile</option>";
      select.disabled = true;
      byId("localMetric").disabled = true;
      return;
    }
    select.disabled = false;
    byId("localMetric").disabled = false;
    select.innerHTML = regions.map(function (region) {
      return "<option value=\"" + escapeHtml(region.file) + "\">" + escapeHtml(region.label) + "</option>";
    }).join("");
  }

  function renderLocalUnavailable(index) {
    renderMessage("localChart", "Focus locale non ancora esportato. Genera i JSON dal repository Crisi_abitativa e salvali in data/crisi-abitativa/regions/.");
    byId("localComment").innerHTML = "<strong>Dataset atteso:</strong> un file per regione con record comunali e campi <code>rent_mean</code>, <code>rent_median</code>, <code>sale_mean</code>, <code>sale_median</code>. " + escapeHtml((index.methodology || [])[0] || "");
  }

  function renderLocalRows(rows, regionLabel) {
    var metric = byId("localMetric").value;
    var meta = localMetrics[metric];
    var valid = rows.filter(function (row) { return Number.isFinite(Number(row[metric])); })
      .map(function (row) { return Object.assign({}, row, { value: Number(row[metric]) }); })
      .sort(function (a, b) { return b.value - a.value; })
      .slice(0, 40);
    if (!valid.length) return renderMessage("localChart", "Nessun valore comunale disponibile per questa misura.");
    var theme = plotTheme();
    byId("localTitle").textContent = meta.label + " - " + regionLabel;
    window.Plotly.react("localChart", [{
      type: "bar",
      orientation: "h",
      x: valid.map(function (row) { return row.value; }).reverse(),
      y: valid.map(function (row) { return row.comune || row.name || row.label; }).reverse(),
      marker: { color: theme.orange, opacity: 0.84 },
      customdata: valid.map(function (row) { return [row.provincia || row.province || "", row.value]; }).reverse(),
      hovertemplate: "<b>%{y}</b><br>Provincia: %{customdata[0]}<br>Valore: %{customdata[1]:.1f}<extra></extra>"
    }], {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: theme.text, family: "system-ui, -apple-system, Segoe UI, sans-serif", size: 13 },
      margin: { l: 170, r: 34, t: 14, b: 62 },
      xaxis: { title: { text: meta.unit }, gridcolor: theme.line, fixedrange: true },
      yaxis: { gridcolor: "rgba(0,0,0,0)", fixedrange: true }
    }, { responsive: true, displayModeBar: false });
    byId("localComment").innerHTML = "<strong>Come leggere:</strong> il grafico mostra i primi 40 comuni della regione per " + escapeHtml(meta.label.toLowerCase()) + ". I valori OMI sono quotazioni territoriali, non transazioni o contratti effettivi.";
  }

  function loadLocalRegion() {
    var select = byId("localRegion");
    if (!state.localIndex || !select.value) return renderLocalUnavailable(state.localIndex || {});
    var region = (state.localIndex.regions || []).find(function (item) { return item.file === select.value; });
    var label = region ? region.label : select.value;
    var url = LOCAL_REGION_BASE + select.value;
    renderMessage("localChart", "Caricamento dati locali...", true);
    var promise = state.localCache[url] || fetchJson(url);
    state.localCache[url] = promise;
    promise.then(function (payload) {
      renderLocalRows(payload.records || payload.data || [], label);
    }).catch(function () {
      renderLocalUnavailable(state.localIndex || {});
    });
  }

  function loadLocalIndex() {
    return fetchJson(LOCAL_INDEX_URL).then(function (index) {
      state.localIndex = index;
      populateLocalControls(index);
      if ((index.regions || []).length) loadLocalRegion();
      else renderLocalUnavailable(index);
      byId("methodologyList").innerHTML = (index.methodology || []).map(function (item) {
        return "<li>" + escapeHtml(item) + "</li>";
      }).join("") + byId("methodologyList").innerHTML;
    }).catch(function (error) {
      renderMessage("localChart", "Non riesco a caricare l'indice locale: " + error.message);
    });
  }

  function bindEvents() {
    byId("europeIndicator").addEventListener("change", renderEurope);
    byId("highlightCountries").addEventListener("change", renderEurope);
    byId("resetEuropeFilters").addEventListener("click", function () {
      Array.from(byId("highlightCountries").options).forEach(function (option) { option.selected = false; });
      renderEurope();
    });
    byId("localRegion").addEventListener("change", loadLocalRegion);
    byId("localMetric").addEventListener("change", loadLocalRegion);
    new MutationObserver(function () {
      if (state.europeData) renderEurope();
      if (state.localIndex && (state.localIndex.regions || []).length) loadLocalRegion();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  function init() {
    if (!window.Plotly) {
      renderMessage("europeChart", "Plotly non e' disponibile.");
      renderMessage("localChart", "Plotly non e' disponibile.");
      return;
    }
    bindEvents();
    loadEurope();
    loadLocalIndex();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
