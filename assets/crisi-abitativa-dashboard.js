(function () {
  var EUROPE_DATA_BASE = "../../data/crisi-abitativa/eurostat/";
  var EUROPE_INDEX_URL = EUROPE_DATA_BASE + "index.json";
  var LOCAL_INDEX_URL = "../../data/crisi-abitativa/local_index.json";
  var LOCAL_REGION_BASE = "../../data/crisi-abitativa/regions/";
  var ITALY = "IT";
  var EU27 = "EU27_2020";
  var COUNTRY_RE = /^[A-Z]{2}$/;
  var EUROPE_COUNTRIES = [
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "EU27_2020"
  ];

  var indicators = [];
  var defaultEuropeIndicatorId = null;

  var localMetrics = {
    rent_mean: { label: "Affitto medio OMI", unit: "euro/mq/mese", description: "media semplice delle zone OMI residenziali disponibili nel comune" },
    rent_median: { label: "Affitto mediano OMI", unit: "euro/mq/mese", description: "mediana delle zone OMI residenziali disponibili nel comune" },
    sale_mean: { label: "Prezzo di vendita medio OMI", unit: "euro/mq", description: "media semplice delle zone OMI residenziali disponibili nel comune" },
    sale_median: { label: "Prezzo di vendita mediano OMI", unit: "euro/mq", description: "mediana delle zone OMI residenziali disponibili nel comune" }
  };

  var state = {
    europeCache: {},
    currentIndicatorId: null,
    europeData: null,
    localIndex: null,
    localCache: {},
    currentLocalRows: [],
    currentLocalLabel: "",
    currentLocalPayload: null,
    selectedLocalComune: "",
    europeHasRendered: false,
    localHasRendered: false
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

  function staticEuropeUrl(indicator) {
    return EUROPE_DATA_BASE + (indicator.file || (indicator.id + ".json"));
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
    var decimals = Math.abs(value) >= 1000 ? 0 : 1;
    return value.toLocaleString("it-IT", { maximumFractionDigits: decimals }) + (unit ? " " + unit : "");
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
    var dimension = payload.dimension && payload.dimension[dimensionId];
    var category = dimension && dimension.category;
    var index = (category && category.index) || {};
    return Object.keys(index).find(function (code) { return index[code] === position; });
  }

  function labelFor(payload, dimensionId, code) {
    var dimension = payload.dimension && payload.dimension[dimensionId];
    var labels = (dimension && dimension.category && dimension.category.label) || {};
    return labels[code] || code;
  }

  function isCountry(code) {
    return COUNTRY_RE.test(code || "");
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
      row.year = Number(String(row.time || row.TIME_PERIOD || "").slice(0, 4));
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

  function populateEuropeIndicatorControl() {
    byId("europeIndicator").innerHTML = indicators.map(function (indicator) {
      return "<option value=\"" + indicator.id + "\">" + escapeHtml(indicator.label) + "</option>";
    }).join("");
  }

  function populateCountryControl(records) {
    var current = new Set(selectedHighlightCountries());
    byId("highlightCountries").innerHTML = countryOptions(records).map(function (entry) {
      var selected = current.has(entry[0]) ? " selected" : "";
      return "<option value=\"" + entry[0] + "\"" + selected + ">" + escapeHtml(entry[1]) + "</option>";
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
      customdata: rows.map(function (record) { return record.period || record.year; }),
      hovertemplate: "<b>%{fullData.name}</b><br>Periodo: %{customdata}<br>Valore: %{y:.1f}<extra></extra>"
    };
  }

  function currentIndicator() {
    return indicators.find(function (item) { return item.id === byId("europeIndicator").value; }) || indicators[0];
  }

  function renderEurope() {
    var indicator = currentIndicator();
    var records = state.europeData || [];
    if (!records.length) return renderMessage("europeChart", "Nessun dato europeo disponibile per questo indicatore.");

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
      byId("kpiYear").textContent = latestItaly.period || latestItaly.year;
      byId("europeComment").innerHTML = "<strong>Come leggere:</strong> " + escapeHtml(indicator.note) + " La banda arancione indica il range min-max tra paesi disponibili: non e' una media europea e non misura la distribuzione interna ai singoli paesi.";
    }

    window.Plotly.react("europeChart", traces, {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: theme.text, family: "system-ui, -apple-system, Segoe UI, sans-serif", size: 14 },
      margin: { l: 72, r: 180, t: 14, b: 64 },
      xaxis: { title: { text: "Periodo" }, gridcolor: theme.line, fixedrange: true, dtick: 1 },
      yaxis: { title: { text: indicator.label + (indicator.unit ? " (" + indicator.unit + ")" : "") }, gridcolor: theme.line, fixedrange: true },
      legend: { orientation: "v", x: 1.02, y: 1, xanchor: "left" }
    }, { responsive: true, displayModeBar: false });
  }

  function loadEuropeIndex() {
    return fetchJson(EUROPE_INDEX_URL).then(function (payload) {
      indicators = payload.indicators || [];
      defaultEuropeIndicatorId = payload.default_indicator || (indicators[0] && indicators[0].id) || null;
      if (!indicators.length) throw new Error("indice Eurostat vuoto");
    });
  }


  function prefetchEuropeIndicators() {
    indicators.forEach(function (indicator) {
      if (!indicator || !indicator.id || state.europeCache[indicator.id]) return;
      fetchJson(staticEuropeUrl(indicator)).then(function (payload) {
        state.europeCache[indicator.id] = payload.records || [];
      }).catch(function () {});
    });
  }

  function loadEuropeIndicator(indicatorId) {
    var indicator = indicators.find(function (item) { return item.id === indicatorId; }) || indicators[0];
    state.currentIndicatorId = indicator.id;
    if (state.europeCache[indicator.id]) {
      state.europeData = state.europeCache[indicator.id];
      populateCountryControl(state.europeData);
      renderEurope();
      return Promise.resolve();
    }
    if (state.europeHasRendered) {
      renderMessage("europeChart", "Caricamento...", true);
      byId("europeComment").textContent = "Caricamento in corso.";
    }
    return fetchJson(staticEuropeUrl(indicator)).then(function (payload) {
      state.europeCache[indicator.id] = payload.records || [];
      state.europeData = state.europeCache[indicator.id];
      populateCountryControl(state.europeData);
      renderEurope();
      state.europeHasRendered = true;
    }).catch(function (error) {
      state.europeData = [];
      renderMessage("europeChart", "Non riesco a caricare il JSON Eurostat statico: " + error.message);
      byId("europeComment").textContent = "Rigenera gli export statici dal repository Crisi_abitativa o controlla che i file siano presenti in data/crisi-abitativa/eurostat/.";
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
    if (!byId("localMetric").value) byId("localMetric").value = "rent_mean";
    select.innerHTML = regions.map(function (region) {
      var selected = region.preload ? " selected" : "";
      return "<option value=\"" + escapeHtml(region.file) + "\"" + selected + ">" + escapeHtml(region.label) + "</option>";
    }).join("");
  }

  function renderLocalUnavailable(index) {
    renderMessage("localChart", "Focus locale non ancora esportato. Genera i JSON regionali dal repository Crisi_abitativa e salvali in data/crisi-abitativa/regions/.");
    byId("localComment").innerHTML = "<strong>Dataset atteso:</strong> un file per regione con geometrie comunali e record con campi <code>rent_mean</code>, <code>rent_median</code>, <code>sale_mean</code>, <code>sale_median</code>. " + escapeHtml((index.methodology || [])[0] || "");
  }


  function normalizeText(value) {
    return String(value == null ? "" : value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

  function selectedMunicipalityName() {
    return normalizeText(state.selectedLocalComune || (byId("localMunicipality") && byId("localMunicipality").value));
  }

  function isSelectedMunicipality(row) {
    var selected = selectedMunicipalityName();
    return selected && normalizeText(row.comune || row.name || row.label) === selected;
  }

  function populateMunicipalityControl(rows) {
    var list = byId("localMunicipalityList");
    var input = byId("localMunicipality");
    if (!list || !input) return;
    var names = Array.from(new Set((rows || []).map(function (row) { return row.comune || row.name || row.label; }).filter(Boolean))).sort(function (a, b) {
      return a.localeCompare(b, "it");
    });
    list.innerHTML = names.map(function (name) { return "<option value=\"" + escapeHtml(name) + "\"></option>"; }).join("");
  }

  function collectCoordinates(coords, output) {
    if (!Array.isArray(coords)) return output;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      output.push(coords);
      return output;
    }
    coords.forEach(function (item) { collectCoordinates(item, output); });
    return output;
  }

  function featureLocation(feature) {
    var coords = collectCoordinates(feature && feature.geometry && feature.geometry.coordinates, []);
    if (!coords.length) return null;
    var lon = 0;
    var lat = 0;
    coords.forEach(function (coord) {
      lon += Number(coord[0]);
      lat += Number(coord[1]);
    });
    return { lon: lon / coords.length, lat: lat / coords.length };
  }

  function featureValueByKey(feature, key) {
    var props = (feature && feature.properties) || {};
    if (key === "properties.com_catasto_code") return String(props.com_catasto_code || "").toUpperCase();
    if (key === "properties.com_istat_code") return String(props.com_istat_code || "").toUpperCase();
    return String(props.name || "").toUpperCase();
  }

  function selectedMunicipalityTrace(valid, payload, theme) {
    var selected = valid.find(isSelectedMunicipality);
    if (!selected || !(payload && payload.geojson && payload.geojson.features)) return null;
    var key = geoFeatureKey(payload.geojson);
    var location = rowLocation(selected);
    var feature = payload.geojson.features.find(function (item) { return featureValueByKey(item, key) === location; });
    var point = featureLocation(feature);
    if (!point) return null;
    return {
      type: "scattergeo",
      mode: "markers+text",
      lon: [point.lon],
      lat: [point.lat],
      text: [selected.comune],
      textposition: "top center",
      name: "Comune selezionato",
      marker: { size: 16, color: theme.text, line: { color: theme.orange, width: 4 }, symbol: "circle" },
      hovertemplate: "<b>" + escapeHtml(selected.comune) + "</b><br>Valore: " + selected.value.toLocaleString("it-IT", { maximumFractionDigits: 1 }) + "<extra></extra>",
      showlegend: false
    };
  }

  function rowLocation(row) {
    return String(row.codice_catastale || row.codice_istat || row.comune || "").toUpperCase();
  }

  function geoFeatureKey(geojson) {
    var feature = geojson && geojson.features && geojson.features[0];
    var props = (feature && feature.properties) || {};
    if (Object.prototype.hasOwnProperty.call(props, "com_catasto_code")) return "properties.com_catasto_code";
    if (Object.prototype.hasOwnProperty.call(props, "com_istat_code")) return "properties.com_istat_code";
    return "properties.name";
  }

  function renderLocalMap(rows, regionLabel, payload) {
    var metric = byId("localMetric").value;
    var meta = localMetrics[metric];
    var valid = rows.filter(function (row) { return Number.isFinite(Number(row[metric])) && rowLocation(row); })
      .map(function (row) { return Object.assign({}, row, { value: Number(row[metric]) }); });
    if (!valid.length) return renderMessage("localChart", "Nessun valore comunale disponibile per questa misura.");
    var theme = plotTheme();
    var maxValue = Math.max.apply(null, valid.map(function (row) { return row.value; }));
    var minValue = Math.min.apply(null, valid.map(function (row) { return row.value; }));
    byId("localTitle").textContent = meta.label + " - " + regionLabel;
    var traces = [{
      type: "choropleth",
      geojson: payload.geojson,
      featureidkey: geoFeatureKey(payload.geojson),
      locations: valid.map(rowLocation),
      z: valid.map(function (row) { return row.value; }),
      text: valid.map(function (row) { return row.comune; }),
      customdata: valid.map(function (row) {
        return [row.provincia || "", row.zone_omi || "", row.income_mean || null, row.sale_80sqm_income_years || null, row.rent_50sqm_income_pct || null];
      }),
      colorscale: [[0, "#fff2df"], [0.35, "#ffb15f"], [0.7, "#f26a21"], [1, "#7a1f0c"]],
      zmin: minValue,
      zmax: maxValue,
      marker: { line: { color: "rgba(255,255,255,.55)", width: 0.35 } },
      colorbar: { title: meta.unit, tickfont: { color: theme.text }, titlefont: { color: theme.text } },
      hovertemplate: "<b>%{text}</b><br>Provincia: %{customdata[0]}<br>Valore: %{z:.1f}<br>Zone OMI: %{customdata[1]}<extra></extra>"
    }];
    var selectedTrace = selectedMunicipalityTrace(valid, payload, theme);
    if (selectedTrace) traces.push(selectedTrace);
    window.Plotly.react("localChart", traces, {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: theme.text, family: "system-ui, -apple-system, Segoe UI, sans-serif", size: 13 },
      margin: { l: 8, r: 8, t: 8, b: 8 },
      geo: { fitbounds: "locations", visible: false, bgcolor: "rgba(0,0,0,0)" }
    }, { responsive: true, displayModeBar: false });
    var selectedText = selectedMunicipalityName() ? " Comune evidenziato: " + escapeHtml((valid.find(isSelectedMunicipality) || {}).comune || state.selectedLocalComune) + "." : "";
    byId("localComment").innerHTML = "<strong>Come leggere:</strong> la mappa colora i comuni della regione per " + escapeHtml(meta.label.toLowerCase()) + ". Il valore e' una " + escapeHtml(meta.description) + "; non e' un prezzo di rogito o un canone contrattuale. Comuni caricati: " + valid.length.toLocaleString("it-IT") + "." + selectedText;
  }

  function renderLocalBar(rows, regionLabel) {
    var metric = byId("localMetric").value;
    var meta = localMetrics[metric];
    var allValid = rows.filter(function (row) { return Number.isFinite(Number(row[metric])); })
      .map(function (row) { return Object.assign({}, row, { value: Number(row[metric]) }); })
      .sort(function (a, b) { return b.value - a.value; });
    var selectedRow = allValid.find(isSelectedMunicipality);
    var valid = allValid.slice(0, selectedRow ? 39 : 40);
    if (selectedRow && !valid.some(isSelectedMunicipality)) valid.push(selectedRow);
    valid = valid.sort(function (a, b) { return b.value - a.value; });
    if (!valid.length) return renderMessage("localChart", "Nessun valore comunale disponibile per questa misura.");
    var theme = plotTheme();
    byId("localTitle").textContent = meta.label + " - " + regionLabel;
    window.Plotly.react("localChart", [{
      type: "bar",
      orientation: "h",
      x: valid.map(function (row) { return row.value; }).reverse(),
      y: valid.map(function (row) { return row.comune || row.name || row.label; }).reverse(),
      marker: { color: valid.map(function (row) { return isSelectedMunicipality(row) ? theme.text : theme.orange; }).reverse(), opacity: 0.84, line: { color: valid.map(function (row) { return isSelectedMunicipality(row) ? theme.orange : "rgba(0,0,0,0)"; }).reverse(), width: valid.map(function (row) { return isSelectedMunicipality(row) ? 3 : 0; }).reverse() } },
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
    var selectedText = selectedMunicipalityName() ? " Se il comune selezionato non e' nei primi valori, viene comunque incluso nella classifica." : "";
    byId("localComment").innerHTML = "<strong>Come leggere:</strong> il grafico mostra i primi comuni della regione per " + escapeHtml(meta.label.toLowerCase()) + ". I valori OMI sono quotazioni territoriali, non transazioni o contratti effettivi." + selectedText;
  }

  function renderLocalRows(rows, regionLabel, payload) {
    populateMunicipalityControl(rows);
    if (payload && payload.geojson && payload.geojson.features) renderLocalMap(rows, regionLabel, payload);
    else renderLocalBar(rows, regionLabel);
    if (payload && payload.semestre_omi) {
      byId("sourceMeta").textContent = "Eurostat da export statici. Focus locale: " + regionLabel + " OMI " + payload.semestre_omi + ".";
    }
  }

  function loadLocalRegion() {
    var select = byId("localRegion");
    if (!state.localIndex || !select.value) return renderLocalUnavailable(state.localIndex || {});
    var input = byId("localMunicipality");
    if (input && state.currentLocalRegionFile !== select.value) {
      input.value = "";
      state.selectedLocalComune = "";
    }
    state.currentLocalRegionFile = select.value;
    var region = (state.localIndex.regions || []).find(function (item) { return item.file === select.value; });
    var label = region ? region.label : select.value;
    var url = LOCAL_REGION_BASE + select.value;
    if (state.localHasRendered) renderMessage("localChart", "Caricamento...", true);
    var promise = state.localCache[url] || fetchJson(url);
    state.localCache[url] = promise;
    promise.then(function (payload) {
      state.currentLocalRows = payload.records || payload.data || [];
      state.currentLocalLabel = label;
      state.currentLocalPayload = payload;
      renderLocalRows(state.currentLocalRows, state.currentLocalLabel, state.currentLocalPayload);
      state.localHasRendered = true;
    }).catch(function () {
      renderLocalUnavailable(state.localIndex || {});
    });
  }


  function prefetchLocalRegions() {
    if (!state.localIndex || !(state.localIndex.regions || []).length) return;
    (state.localIndex.regions || []).forEach(function (region) {
      if (!region || !region.file) return;
      var url = LOCAL_REGION_BASE + region.file;
      if (state.localCache[url]) return;
      state.localCache[url] = fetchJson(url).catch(function (error) {
        delete state.localCache[url];
        throw error;
      });
    });
  }

  function loadLocalIndex() {
    return fetchJson(LOCAL_INDEX_URL).then(function (index) {
      state.localIndex = index;
      populateLocalControls(index);
      if ((index.regions || []).length) {
        loadLocalRegion();
        prefetchLocalRegions();
      }
      else renderLocalUnavailable(index);
      byId("methodologyList").innerHTML = (index.methodology || []).map(function (item) {
        return "<li>" + escapeHtml(item) + "</li>";
      }).join("") + byId("methodologyList").innerHTML;
    }).catch(function (error) {
      renderMessage("localChart", "Non riesco a caricare l'indice locale: " + error.message);
    });
  }

  function bindEvents() {
    byId("europeIndicator").addEventListener("change", function () {
      loadEuropeIndicator(byId("europeIndicator").value);
    });
    byId("highlightCountries").addEventListener("change", renderEurope);
    byId("resetEuropeFilters").addEventListener("click", function () {
      Array.from(byId("highlightCountries").options).forEach(function (option) { option.selected = false; });
      renderEurope();
    });
    byId("localRegion").addEventListener("change", loadLocalRegion);
    byId("localMetric").addEventListener("change", function () {
      if (state.currentLocalRows.length) renderLocalRows(state.currentLocalRows, state.currentLocalLabel, state.currentLocalPayload);
      else loadLocalRegion();
    });
    var municipalityInput = byId("localMunicipality");
    if (municipalityInput) {
      municipalityInput.addEventListener("input", function () {
        state.selectedLocalComune = municipalityInput.value;
        if (state.currentLocalRows.length) renderLocalRows(state.currentLocalRows, state.currentLocalLabel, state.currentLocalPayload);
      });
    }
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
    loadEuropeIndex().then(function () {
      populateEuropeIndicatorControl();
      if (defaultEuropeIndicatorId) byId("europeIndicator").value = defaultEuropeIndicatorId;
      if (!byId("europeIndicator").value && indicators[0]) byId("europeIndicator").value = indicators[0].id;
      loadEuropeIndicator(byId("europeIndicator").value || defaultEuropeIndicatorId).then(prefetchEuropeIndicators);
    }).catch(function (error) {
      renderMessage("europeChart", "Non riesco a caricare l'indice Eurostat statico: " + error.message);
    });
    loadLocalIndex();
  }

  document.addEventListener("DOMContentLoaded", init);
})();






