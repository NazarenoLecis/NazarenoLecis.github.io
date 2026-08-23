(function () {
  var EUROPE_DATA_BASE = "https://data.nazarenolecis.com/crisi-abitativa/eurostat/";
  var EUROPE_INDEX_URL = EUROPE_DATA_BASE + "index.json";
  var STOCK_AGE_URL = EUROPE_DATA_BASE + "estat_dwellings_by_construction_period_2021.json";
  var EXTRA_DATA_URL = "https://data.nazarenolecis.com/crisi-abitativa/dashboard_extra.json";
  var LOCAL_INDEX_URL = "https://data.nazarenolecis.com/crisi-abitativa/local_index.json";
  var LOCAL_REGION_BASE = "https://data.nazarenolecis.com/crisi-abitativa/regions/";
  var LOCAL_ITALY_GEOJSON_URLS = [
    "/data/crisi-abitativa/italy-regions.geojson",
    "../../data/crisi-abitativa/italy-regions.geojson",
    "https://nazarenolecis.com/data/crisi-abitativa/italy-regions.geojson",
    "https://nazarenolecis.github.io/data/crisi-abitativa/italy-regions.geojson"
  ];
  var ITALY = "IT";
  var EU27 = "EU27_2020";
  var COUNTRY_RE = /^[A-Z]{2}$/;
  var SERIES_WINDOW_OPTIONS = [
    { id: "all", label: "Tutti gli anni", years: null },
    { id: "20", label: "Ultimi 20 anni", years: 20 },
    { id: "10", label: "Ultimi 10 anni", years: 10 },
    { id: "5", label: "Ultimi 5 anni", years: 5 }
  ];
  var HIGHLIGHT_COLORS = ["#4e79a7", "#59a14f", "#e15759", "#b07aa1", "#76b7b2", "#edc948"];

  var indicators = [];
  var defaultEuropeIndicatorId = null;

  var localMetrics = {
    rent_mean: {
      label: "Affitto medio (euro per metro quadro al mese)",
      unit: "euro per metro quadro al mese",
      description: "media semplice delle zone OMI residenziali disponibili nel comune"
    },
    rent_median: {
      label: "Affitto mediano (euro per metro quadro al mese)",
      unit: "euro per metro quadro al mese",
      description: "mediana delle zone OMI residenziali disponibili nel comune"
    },
    sale_mean: {
      label: "Prezzo di vendita medio (euro per metro quadro)",
      unit: "euro per metro quadro",
      description: "media semplice delle zone OMI residenziali disponibili nel comune"
    },
    sale_median: {
      label: "Prezzo di vendita mediano (euro per metro quadro)",
      unit: "euro per metro quadro",
      description: "mediana delle zone OMI residenziali disponibili nel comune"
    }
  };

  var state = {
    europeCache: {},
    currentIndicatorId: null,
    europeData: null,
    europeYearWindow: "all",
    europeSeriesMode: "absolute",
    europeBaseYear: "",
    localIndex: null,
    localCache: {},
    currentLocalRows: [],
    currentLocalLabel: "",
    currentLocalPayload: null,
    currentLocalRegionFile: "",
    selectedLocalComune: "",
    stockAgeData: null,
    extraData: null,
    europeHasRendered: false,
    extraHasRendered: false,
    localHasRendered: false,
    italyHasRendered: false,
    localRequestSerial: 0,
    localAllPayloads: null,
    localAllPayloadsPromise: null,
    italyGeojson: null,
    italyGeojsonPromise: null
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function t(value) {
    return window.SiteLanguage && window.SiteLanguage.t ? window.SiteLanguage.t(value) : value;
  }

  function locale() {
    return window.SiteLanguage && window.SiteLanguage.get && window.SiteLanguage.get() === "en" ? "en-US" : "it-IT";
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

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
    return value.toLocaleString(locale(), { maximumFractionDigits: decimals }) + (unit ? " " + t(unit) : "");
  }

  function formatIndex(value) {
    if (!Number.isFinite(value)) return "-";
    return value.toLocaleString(locale(), { maximumFractionDigits: 1 });
  }

  function renderMessage(id, message, loading) {
    var el = byId(id);
    if (!el) return;
    if (window.Plotly) window.Plotly.purge(el);
    el.innerHTML = "<div class=\"empty-state" + (loading ? " loading-state" : "") + "\">" + escapeHtml(t(message)) + "</div>";
  }

  function clearChartMessage(id) {
    var el = byId(id);
    if (!el) return;
    el.querySelectorAll(".empty-state").forEach(function (message) {
      message.remove();
    });
  }

  function fetchJson(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    });
  }

  function fetchFirstJson(urls) {
    urls = toArray(urls);
    return urls.reduce(function (chain, url) {
      return chain.catch(function () {
        return fetchJson(url);
      });
    }, Promise.reject(new Error("nessun URL provato")));
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
    return Object.keys(index).find(function (code) {
      return index[code] === position;
    });
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
      ids.forEach(function (id, i) {
        row[id] = codeAt(payload, id, coords[i]);
      });
      row.geo_label = labelFor(payload, "geo", row.geo);
      row.year = Number(String(row.time || row.TIME_PERIOD || "").slice(0, 4));
      if (Number.isFinite(row.year)) records.push(row);
    });
    return records;
  }

  function groupByYear(records) {
    var map = new Map();
    toArray(records).forEach(function (record) {
      if (!map.has(record.year)) map.set(record.year, []);
      map.get(record.year).push(record);
    });
    return map;
  }

  function uniqueYears(records) {
    return Array.from(new Set(toArray(records).map(function (record) {
      return toNumber(record && record.year);
    }).filter(function (year) {
      return year !== null;
    }))).sort(function (a, b) {
      return a - b;
    });
  }

  function selectedYearsByWindow(years, windowId) {
    years = toArray(years).slice().sort(function (a, b) { return a - b; });
    var option = SERIES_WINDOW_OPTIONS.find(function (item) {
      return item.id === windowId;
    }) || SERIES_WINDOW_OPTIONS[0];
    if (!option || option.years === null || years.length <= option.years) return years;
    return years.slice(Math.max(0, years.length - option.years));
  }

  function countryOptions(records) {
    var countries = new Map();
    toArray(records).forEach(function (record) {
      if (isCountry(record.geo) && record.geo !== ITALY) countries.set(record.geo, record.geo_label);
    });
    return Array.from(countries.entries()).sort(function (a, b) {
      return a[1].localeCompare(b[1], locale().slice(0, 2));
    });
  }

  function comparableCountryOptions(records) {
    var countries = new Map();
    toArray(records).forEach(function (record) {
      if ((isCountry(record.geo) || record.geo === EU27) && record.geo) {
        countries.set(record.geo, record.geo_label || record.scope || record.geo);
      }
    });
    return Array.from(countries.entries()).sort(function (a, b) {
      if (a[0] === ITALY) return -1;
      if (b[0] === ITALY) return 1;
      if (a[0] === EU27) return b[0] === ITALY ? 1 : -1;
      if (b[0] === EU27) return a[0] === ITALY ? -1 : 1;
      return String(a[1] || a[0]).localeCompare(String(b[1] || b[0]), locale().slice(0, 2));
    });
  }

  function defaultComparableCountries(records) {
    return [ITALY, EU27].filter(function (code) {
      return toArray(records).some(function (record) {
        return record.geo === code;
      });
    });
  }

  function selectedValues(select) {
    return select ? Array.from(select.options || []).filter(function (option) {
      return option.selected;
    }).map(function (option) {
      return option.value;
    }) : [];
  }

  function selectedLabels(select) {
    return select ? Array.from(select.options || []).filter(function (option) {
      return option.selected;
    }).map(function (option) {
      return option.textContent || option.value;
    }) : [];
  }

  function dropdownSummary(select) {
    var labels = selectedLabels(select);
    if (!labels.length) return t("Nessun paese selezionato");
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return labels.join(", ");
    return labels.length.toLocaleString(locale()) + " " + t("paesi selezionati");
  }

  function closeCheckboxDropdowns(exceptRoot) {
    document.querySelectorAll(".checkbox-dropdown.is-open").forEach(function (root) {
      if (root !== exceptRoot) {
        root.classList.remove("is-open");
        var button = root.querySelector(".checkbox-dropdown-button");
        if (button) button.setAttribute("aria-expanded", "false");
      }
    });
  }

  function dispatchSelectChange(select) {
    if (!select) return;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setAllOptions(select, selected) {
    Array.from((select && select.options) || []).forEach(function (option) {
      option.selected = selected;
    });
  }

  function ensureCheckboxDropdown(select) {
    if (!select) return null;
    if (select.housingCheckboxDropdown) return select.housingCheckboxDropdown;

    select.classList.add("native-multiselect-hidden");
    select.setAttribute("aria-hidden", "true");
    select.tabIndex = -1;

    var root = document.createElement("div");
    root.className = "checkbox-dropdown";

    var button = document.createElement("button");
    button.type = "button";
    button.className = "checkbox-dropdown-button";
    button.setAttribute("aria-haspopup", "true");
    button.setAttribute("aria-expanded", "false");

    var summary = document.createElement("span");
    summary.className = "checkbox-dropdown-summary";
    button.appendChild(summary);

    var chevron = document.createElement("span");
    chevron.className = "checkbox-dropdown-chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "▾";
    button.appendChild(chevron);

    var menu = document.createElement("div");
    menu.className = "checkbox-dropdown-menu";
    menu.setAttribute("role", "menu");

    var actions = document.createElement("div");
    actions.className = "checkbox-dropdown-actions";

    var selectAll = document.createElement("button");
    selectAll.type = "button";
    selectAll.textContent = t("Tutti");
    selectAll.addEventListener("click", function () {
      setAllOptions(select, true);
      renderCheckboxDropdown(select);
      dispatchSelectChange(select);
    });

    var selectNone = document.createElement("button");
    selectNone.type = "button";
    selectNone.textContent = t("Nessuno");
    selectNone.addEventListener("click", function () {
      setAllOptions(select, false);
      renderCheckboxDropdown(select);
      dispatchSelectChange(select);
    });

    actions.appendChild(selectAll);
    actions.appendChild(selectNone);

    var list = document.createElement("div");
    list.className = "checkbox-dropdown-list";

    menu.appendChild(actions);
    menu.appendChild(list);
    root.appendChild(button);
    root.appendChild(menu);
    select.insertAdjacentElement("afterend", root);

    button.addEventListener("click", function () {
      var isOpen = root.classList.toggle("is-open");
      closeCheckboxDropdowns(root);
      button.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    root.addEventListener("click", function (event) {
      event.stopPropagation();
    });

    select.housingCheckboxDropdown = {
      root: root,
      button: button,
      summary: summary,
      menu: menu,
      list: list,
      selectAll: selectAll,
      selectNone: selectNone
    };

    if (!document.housingCheckboxDropdownEvents) {
      document.housingCheckboxDropdownEvents = true;
      document.addEventListener("click", function () {
        closeCheckboxDropdowns();
      });
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeCheckboxDropdowns();
      });
    }

    return select.housingCheckboxDropdown;
  }

  function renderCheckboxDropdown(select) {
    var dropdown = ensureCheckboxDropdown(select);
    if (!dropdown) return;
    dropdown.summary.textContent = dropdownSummary(select);
    dropdown.selectAll.textContent = t("Tutti");
    dropdown.selectNone.textContent = t("Nessuno");
    dropdown.list.innerHTML = "";

    Array.from(select.options || []).forEach(function (option) {
      var row = document.createElement("div");
      row.className = "checkbox-dropdown-option";
      row.setAttribute("role", "menuitemcheckbox");
      row.setAttribute("aria-checked", option.selected ? "true" : "false");

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = option.selected;
      checkbox.value = option.value;

      var text = document.createElement("span");
      text.textContent = option.textContent || option.value;

      checkbox.addEventListener("change", function () {
        option.selected = checkbox.checked;
        row.setAttribute("aria-checked", option.selected ? "true" : "false");
        dropdown.summary.textContent = dropdownSummary(select);
        dispatchSelectChange(select);
      });

      row.addEventListener("click", function (event) {
        if (event.target === checkbox) return;
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      });

      row.appendChild(checkbox);
      row.appendChild(text);
      dropdown.list.appendChild(row);
    });
  }

  function syncCheckboxDropdown(id) {
    renderCheckboxDropdown(byId(id));
  }

  function applyDefaultComparableSelection(select, records) {
    if (!select) return;
    var defaults = new Set(defaultComparableCountries(records));
    Array.from(select.options || []).forEach(function (option) {
      option.selected = defaults.has(option.value);
    });
    renderCheckboxDropdown(select);
  }

  function countryNameFor(records, code) {
    var record = toArray(records).find(function (item) {
      return item.geo === code;
    });
    if (code === ITALY) return t("Italia");
    if (code === EU27) return "EU27";
    return t((record && (record.geo_label || record.scope)) || code);
  }

  function populateEuropeIndicatorControl() {
    var select = byId("europeIndicator");
    if (!select) return;
    var current = select.value;
    select.innerHTML = indicators.map(function (indicator) {
      return "<option value=\"" + indicator.id + "\">" + escapeHtml(t(indicator.label)) + "</option>";
    }).join("");
    if (current) select.value = current;
  }

  function populateCountryControl(records) {
    var select = byId("highlightCountries");
    if (!select) return;
    var current = new Set(selectedHighlightCountries());
    select.innerHTML = countryOptions(records).map(function (entry) {
      var selected = current.has(entry[0]) ? " selected" : "";
      return "<option value=\"" + entry[0] + "\"" + selected + ">" + escapeHtml(t(entry[1])) + "</option>";
    }).join("");
    renderCheckboxDropdown(select);
  }

  function selectedHighlightCountries() {
    return selectedValues(byId("highlightCountries"));
  }

  function selectedStockAgeCountries() {
    var select = byId("stockAgeCountries");
    return selectedValues(select);
  }

  function populateStockAgeCountryControl(records) {
    var select = byId("stockAgeCountries");
    if (!select) return;
    var current = new Set(selectedStockAgeCountries());
    var isInitial = select.options.length === 0;
    select.innerHTML = comparableCountryOptions(records).map(function (entry) {
      var selected = current.has(entry[0]) || (isInitial && defaultComparableCountries(records).indexOf(entry[0]) >= 0) ? " selected" : "";
      return "<option value=\"" + entry[0] + "\"" + selected + ">" + escapeHtml(t(entry[1] || entry[0])) + "</option>";
    }).join("");
    renderCheckboxDropdown(select);
  }

  function currentIndicator() {
    var selectedId = byId("europeIndicator") ? byId("europeIndicator").value : "";
    return indicators.find(function (item) {
      return item.id === selectedId;
    }) || indicators[0];
  }

  function ensureInlineLabel(label, labelText) {
    var caption = label.querySelector("span");
    if (!caption) {
      caption = document.createElement("span");
      label.insertBefore(caption, label.firstChild);
    }
    caption.textContent = t(labelText);
  }

  function ensureEuropeSeriesControls(allYears, baseYears) {
    var chart = byId("europeChart");
    if (!chart || !chart.closest) return;
    var chartPanel = chart.closest(".chart-panel");
    if (!chartPanel || !chartPanel.parentNode) return;
    var controls = byId("europeSeriesControls");
    if (!controls) {
      controls = document.createElement("div");
      controls.id = "europeSeriesControls";
      controls.className = "housing-inline-controls";
      chartPanel.parentNode.insertBefore(controls, chartPanel);
    }

    function ensureLabeledSelect(id, labelText, onChange) {
      var select = byId(id);
      var label = byId(id + "Wrap");
      if (!label) {
        label = document.createElement("label");
        label.id = id + "Wrap";
        label.setAttribute("for", id);
        controls.appendChild(label);
      }
      ensureInlineLabel(label, labelText);
      if (!select) {
        select = document.createElement("select");
        select.id = id;
        select.addEventListener("change", onChange);
        label.appendChild(select);
      }
      return select;
    }

    allYears = toArray(allYears);
    baseYears = toArray(baseYears);

    var windowSelect = ensureLabeledSelect("europeYearWindow", "Periodo", function () {
      state.europeYearWindow = windowSelect.value;
      renderEurope();
    });
    windowSelect.innerHTML = "";
    SERIES_WINDOW_OPTIONS.forEach(function (option) {
      var item = document.createElement("option");
      item.value = option.id;
      item.textContent = t(option.label);
      item.disabled = option.years !== null && allYears.length > 0 && allYears.length < option.years;
      windowSelect.appendChild(item);
    });
    if (!Array.prototype.some.call(windowSelect.options, function (option) {
      return option.value === state.europeYearWindow && !option.disabled;
    })) {
      state.europeYearWindow = "all";
    }
    windowSelect.value = state.europeYearWindow;

    var modeSelect = ensureLabeledSelect("europeSeriesMode", "Scala", function () {
      state.europeSeriesMode = modeSelect.value === "base100" ? "base100" : "absolute";
      renderEurope();
    });
    modeSelect.innerHTML = "";
    [
      { id: "absolute", label: "Valori assoluti" },
      { id: "base100", label: "Indice base 100" }
    ].forEach(function (option) {
      var item = document.createElement("option");
      item.value = option.id;
      item.textContent = t(option.label);
      modeSelect.appendChild(item);
    });
    if (state.europeSeriesMode !== "base100") state.europeSeriesMode = "absolute";
    modeSelect.value = state.europeSeriesMode;

    var baseYearSelect = ensureLabeledSelect("europeBaseYear", "Base", function () {
      state.europeBaseYear = baseYearSelect.value;
      renderEurope();
    });
    baseYearSelect.innerHTML = "";
    if (!baseYears.length) {
      var empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "ND";
      baseYearSelect.appendChild(empty);
      state.europeBaseYear = "";
      baseYearSelect.value = "";
      baseYearSelect.disabled = true;
      return;
    }
    baseYears.forEach(function (year) {
      var item = document.createElement("option");
      item.value = String(year);
      item.textContent = String(year);
      baseYearSelect.appendChild(item);
    });
    if (baseYears.map(String).indexOf(String(state.europeBaseYear)) < 0) {
      state.europeBaseYear = String(baseYears[0]);
    }
    baseYearSelect.value = String(state.europeBaseYear);
    baseYearSelect.disabled = state.europeSeriesMode !== "base100";
  }

  function countrySeriesRows(records, code) {
    return toArray(records).filter(function (record) {
      return record.geo === code && Number.isFinite(record.value);
    }).sort(function (a, b) {
      return a.year - b.year;
    });
  }

  function normalizedSeriesRows(rows, baseYear) {
    baseYear = toNumber(baseYear);
    if (baseYear === null) return [];
    var baseRow = toArray(rows).find(function (row) {
      return toNumber(row && row.year) === baseYear && Number.isFinite(row.value);
    });
    var baseValue = baseRow ? toNumber(baseRow.value) : null;
    if (baseValue === null || baseValue === 0) return [];
    return toArray(rows).map(function (row) {
      if (!Number.isFinite(row.value)) return null;
      return Object.assign({}, row, {
        raw_value: row.value,
        value: row.value / baseValue * 100
      });
    }).filter(function (row) {
      return row;
    });
  }

  function normalizedRecordsBase100(records, baseYear) {
    var groups = new Map();
    toArray(records).forEach(function (record) {
      if (!groups.has(record.geo)) groups.set(record.geo, []);
      groups.get(record.geo).push(record);
    });
    var output = [];
    groups.forEach(function (rows) {
      normalizedSeriesRows(rows, baseYear).forEach(function (row) {
        output.push(row);
      });
    });
    return output;
  }

  function traceForCountry(records, code, name, color, width) {
    var rows = countrySeriesRows(records, code);
    if (!rows.length) return null;
    return {
      type: "scatter",
      mode: "lines+markers",
      name: t(name),
      x: rows.map(function (record) { return record.year; }),
      y: rows.map(function (record) { return record.value; }),
      line: { color: color, width: width || 2 },
      marker: { color: color, size: width > 2 ? 7 : 5 },
      customdata: rows.map(function (record) { return record.period || record.year; }),
      hovertemplate: "<b>%{fullData.name}</b><br>" + t("Periodo") + ": %{customdata}<br>" + t("Valore") + ": %{y:.1f}<extra></extra>"
    };
  }

  function traceForEuAverage(byYear, years, theme) {
    var values = years.map(function (year) {
      var rows = (byYear.get(year) || []).filter(function (record) {
        return isCountry(record.geo) && Number.isFinite(record.value);
      });
      if (!rows.length) return null;
      return rows.reduce(function (total, record) {
        return total + record.value;
      }, 0) / rows.length;
    });
    if (!values.some(Number.isFinite)) return null;
    return {
      type: "scatter",
      mode: "lines+markers",
      name: t("Media UE"),
      x: years,
      y: values,
      line: { color: theme.muted, width: 2, dash: "dot" },
      marker: { color: theme.muted, size: 5 },
      customdata: years,
      hovertemplate: "<b>" + t("Media UE") + "</b><br>" + t("Periodo") + ": %{customdata}<br>" + t("Valore") + ": %{y:.1f}<extra></extra>"
    };
  }

  function isAbsoluteIndicator(indicator) {
    if (!indicator) return false;
    if (indicator.show_eu_aggregate === true) return false;
    if (indicator.show_eu_aggregate === false || indicator.absolute_count) return true;
    return /abitazioni|famiglie|persone|m2|m²/i.test(indicator.unit || "");
  }

  function renderEurope() {
    var indicator = currentIndicator();
    var allRecords = state.europeData || [];
    if (!allRecords.length) {
      return renderMessage("europeChart", "Nessun dato europeo disponibile per questo indicatore.");
    }

    var allCountryYears = uniqueYears(allRecords.filter(function (record) {
      return isCountry(record.geo);
    }));
    var visibleYears = selectedYearsByWindow(allCountryYears, state.europeYearWindow);
    var italyBaseYears = visibleYears.filter(function (year) {
      return countrySeriesRows(allRecords, ITALY).some(function (record) {
        return record.year === year && Number.isFinite(record.value);
      });
    });
    ensureEuropeSeriesControls(allCountryYears, italyBaseYears);

    var filteredRecords = allRecords.filter(function (record) {
      return visibleYears.indexOf(record.year) >= 0 && (isCountry(record.geo) || record.geo === EU27);
    });
    var useBase100 = state.europeSeriesMode === "base100" && !!state.europeBaseYear;
    if (useBase100) {
      filteredRecords = normalizedRecordsBase100(filteredRecords, state.europeBaseYear);
    }

    var countryRecords = filteredRecords.filter(function (record) {
      return isCountry(record.geo);
    });
    if (!countryRecords.length) {
      return renderMessage("europeChart", "Nessun dato europeo disponibile per questo indicatore.");
    }

    var byYear = groupByYear(countryRecords);
    var years = Array.from(byYear.keys()).sort(function (a, b) {
      return a - b;
    });
    if (!years.length) {
      return renderMessage("europeChart", "Nessun dato europeo disponibile per questo indicatore.");
    }

    var minValues = [];
    var maxValues = [];
    years.forEach(function (year) {
      var values = (byYear.get(year) || []).map(function (record) {
        return record.value;
      }).filter(Number.isFinite);
      if (!values.length) return;
      minValues.push(Math.min.apply(null, values));
      maxValues.push(Math.max.apply(null, values));
    });

    var theme = plotTheme();
    var traces = [
      {
        type: "scatter",
        mode: "lines",
        name: t("Massimo paesi"),
        x: years,
        y: maxValues,
        line: { color: "rgba(255,255,255,0)", width: 0 },
        hoverinfo: "skip",
        showlegend: false
      },
      {
        type: "scatter",
        mode: "lines",
        name: t("Range paesi"),
        x: years,
        y: minValues,
        fill: "tonexty",
        fillcolor: "rgba(255,90,31,.16)",
        line: { color: "rgba(255,255,255,0)", width: 0 },
        hoverinfo: "skip"
      }
    ];

    var showEuAggregate = !isAbsoluteIndicator(indicator);
    var averageTrace = null;
    if (indicator.eu_average_from_countries) {
      averageTrace = traceForEuAverage(byYear, years, theme);
    } else if (showEuAggregate && filteredRecords.some(function (record) { return record.geo === EU27; })) {
      averageTrace = traceForCountry(filteredRecords, EU27, "EU27", theme.muted, 2);
    }
    if (averageTrace) traces.push(averageTrace);

    var italyTrace = traceForCountry(filteredRecords, ITALY, "Italia", theme.orange, 4);
    if (italyTrace) traces.push(italyTrace);

    selectedHighlightCountries().forEach(function (code, index) {
      var labelRecord = filteredRecords.find(function (record) {
        return record.geo === code;
      }) || allRecords.find(function (record) {
        return record.geo === code;
      });
      var trace = traceForCountry(filteredRecords, code, labelRecord ? labelRecord.geo_label : code, HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length], 2);
      if (trace) traces.push(trace);
    });

    byId("europeTitle").textContent = t(indicator.shortLabel);
    byId("europeSubtitle").textContent = useBase100
      ? t("Indice base 100") + " (" + state.europeBaseYear + "=100)"
      : t("range min-max, Italia sempre evidenziata");

    var italyRows = countrySeriesRows(filteredRecords, ITALY).sort(function (a, b) {
      return b.year - a.year;
    });
    var latestItaly = italyRows[0];
    if (latestItaly) {
      var latestValues = (byYear.get(latestItaly.year) || []).map(function (record) {
        return record.value;
      }).filter(Number.isFinite);
      byId("kpiItalyLabel").textContent = t("Italia ultimo dato");
      byId("kpiItaly").textContent = useBase100 ? formatIndex(latestItaly.value) : formatValue(latestItaly.value, indicator.unit);
      byId("kpiRange").textContent = useBase100
        ? formatIndex(Math.min.apply(null, latestValues)) + " - " + formatIndex(Math.max.apply(null, latestValues))
        : formatValue(Math.min.apply(null, latestValues), indicator.unit) + " - " + formatValue(Math.max.apply(null, latestValues), indicator.unit);
      byId("kpiYear").textContent = latestItaly.period || latestItaly.year;

      var noteParts = [
        "<strong>" + escapeHtml(t("Come leggere:")) + "</strong>"
      ];
      if (useBase100) {
        noteParts.push(escapeHtml(t("Con la base 100 tutte le serie visibili partono da 100 nell'anno scelto e mostrano solo variazioni relative, non livelli assoluti.")));
      }
      noteParts.push(escapeHtml(t(indicator.note || "")));
      noteParts.push(escapeHtml(t("La banda arancione indica il range min-max tra paesi disponibili: non e' una media europea e non misura la distribuzione interna ai singoli paesi.")));
      if (indicator.eu_average_from_countries) {
        noteParts.push(escapeHtml(t("La linea Media UE e' calcolata come media semplice dei paesi disponibili nello stesso anno, quindi resta dentro il range.")));
      } else if (!showEuAggregate) {
        noteParts.push(escapeHtml(t("Per gli indicatori in valori assoluti EU27 non viene disegnato: e' un aggregato e sarebbe fuori scala rispetto ai singoli paesi.")));
      }
      byId("europeComment").innerHTML = noteParts.join(" ");
    }

    clearChartMessage("europeChart");
    window.Plotly.react("europeChart", traces, {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: theme.text, family: "system-ui, -apple-system, Segoe UI, sans-serif", size: 14 },
      margin: { l: 72, r: 180, t: 14, b: 64 },
      xaxis: { title: { text: t("Periodo") }, gridcolor: theme.line, fixedrange: true, dtick: 1 },
      yaxis: {
        title: {
          text: useBase100
            ? t("Indice base 100") + " (" + state.europeBaseYear + "=100)"
            : t(indicator.label) + (indicator.unit ? " (" + t(indicator.unit) + ")" : "")
        },
        gridcolor: theme.line,
        fixedrange: true
      },
      legend: { orientation: "v", x: 1.02, y: 1, xanchor: "left" }
    }, { responsive: true, displayModeBar: false });
  }

  function renderStockAge(records) {
    records = records || [];
    if (!records.length) return renderMessage("stockAgeChart", "Nessun dato disponibile sull'eta' del patrimonio immobiliare.");
    var theme = plotTheme();
    var countryCodes = selectedStockAgeCountries().filter(function (code, index, array) {
      return array.indexOf(code) === index && records.some(function (record) { return record.geo === code; });
    });
    if (!countryCodes.length) return renderMessage("stockAgeChart", "Seleziona almeno un paese per visualizzare lo stock abitativo.");
    var buckets = [];
    records.forEach(function (record) {
      if (!buckets.some(function (bucket) { return bucket.id === record.bucket; })) {
        buckets.push({ id: record.bucket, label: t(record.bucket_label || record.bucket) });
      }
    });
    var colors = [theme.orange, theme.muted, "#4e79a7", "#59a14f", "#e15759", "#b07aa1", "#76b7b2", "#edc948"];
    var traces = countryCodes.map(function (code, index) {
      return {
        type: "bar",
        name: countryNameFor(records, code),
        x: buckets.map(function (bucket) { return bucket.label; }),
        y: buckets.map(function (bucket) {
          var row = records.find(function (record) { return record.geo === code && record.bucket === bucket.id; });
          return row ? Number(row.share_pct) : null;
        }),
        marker: { color: colors[index % colors.length], opacity: code === ITALY ? 0.9 : 0.7 },
        customdata: buckets.map(function (bucket) {
          var row = records.find(function (record) { return record.geo === code && record.bucket === bucket.id; });
          return row ? [row.value, row.geo_total] : [null, null];
        }),
        hovertemplate: "<b>%{fullData.name}</b><br>" + t("Periodo") + ": %{x}<br>" + t("Quota stock") + ": %{y:.1f}%<br>" + t("Abitazioni") + ": %{customdata[0]:,.0f}<extra></extra>"
      };
    });
    clearChartMessage("stockAgeChart");
    window.Plotly.react("stockAgeChart", traces, {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: theme.text, family: "system-ui, -apple-system, Segoe UI, sans-serif", size: 14 },
      margin: { l: 72, r: 40, t: 14, b: 112 },
      barmode: "group",
      xaxis: { title: { text: t("Periodo di costruzione") }, gridcolor: theme.line, fixedrange: true, tickangle: -30 },
      yaxis: { title: { text: t("Quota dello stock abitativo (%)") }, gridcolor: theme.line, fixedrange: true, rangemode: "tozero" },
      legend: { orientation: "h", x: 0, y: 1.12, xanchor: "left" }
    }, { responsive: true, displayModeBar: false });
    byId("stockAgeComment").innerHTML = "<strong>" + escapeHtml(t("Come leggere:")) + "</strong> " +
      escapeHtml(t("questo grafico usa un unico JSON statico Eurostat gia' aggregato. Le barre mostrano la composizione percentuale dello stock abitativo 2021 per periodo di costruzione; il tooltip riporta anche il numero di abitazioni.")) + " " +
      escapeHtml(t("Paesi selezionati:")) + " " + countryCodes.map(function (code) { return escapeHtml(countryNameFor(records, code)); }).join(", ") + ".";
  }

  function loadStockAge() {
    return fetchJson(STOCK_AGE_URL).then(function (payload) {
      state.stockAgeData = payload.records || [];
      populateStockAgeCountryControl(state.stockAgeData);
      renderStockAge(state.stockAgeData);
    }).catch(function (error) {
      renderMessage("stockAgeChart", "Non riesco a caricare il JSON sullo stock abitativo: " + error.message);
      byId("stockAgeComment").textContent = t("Verifica che estat_dwellings_by_construction_period_2021.json sia stato sincronizzato su Cloudflare R2.");
    });
  }

  function loadEuropeIndex() {
    return fetchJson(EUROPE_INDEX_URL).then(function (payload) {
      indicators = payload.indicators || [];
      defaultEuropeIndicatorId = payload.default_indicator || (indicators[0] && indicators[0].id) || null;
      if (!indicators.length) throw new Error(t("indice Eurostat vuoto"));
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
      byId("europeComment").textContent = t("Caricamento in corso.");
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
      byId("europeComment").textContent = t("Rigenera gli export statici dal repository Crisi_abitativa o controlla che i file siano presenti su Cloudflare R2.");
    });
  }

  function extraModule(id) {
    return ((state.extraData && state.extraData.modules) || []).find(function (module) {
      return module.id === id;
    }) || null;
  }

  function extraLayout(margin) {
    var theme = plotTheme();
    return {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: theme.text, family: "system-ui, -apple-system, Segoe UI, sans-serif", size: 12 },
      margin: margin || { l: 58, r: 18, t: 10, b: 48 }
    };
  }

  function chartRecords(module, fieldName) {
    var records = module && module[fieldName || "records"];
    return toArray(records).filter(function (record) {
      return toNumber(record && record.value) !== null;
    });
  }

  function currentSnapshotModule() {
    var select = byId("snapshotMetric");
    var selectedId = select ? select.value : "tenure";
    return extraModule(selectedId) || extraModule("tenure") || extraModule("stock_activation");
  }

  function selectedSnapshotCountries() {
    return selectedValues(byId("snapshotCountries"));
  }

  function populateSnapshotCountryControl(module) {
    var select = byId("snapshotCountries");
    if (!select || !module) return;
    var records = chartRecords(module);
    var current = new Set(selectedSnapshotCountries());
    var isInitial = select.options.length === 0;
    select.innerHTML = comparableCountryOptions(records).map(function (entry) {
      var selected = current.has(entry[0]) || (isInitial && defaultComparableCountries(records).indexOf(entry[0]) >= 0) ? " selected" : "";
      return "<option value=\"" + entry[0] + "\"" + selected + ">" + escapeHtml(t(entry[1] || entry[0])) + "</option>";
    }).join("");
    renderCheckboxDropdown(select);
  }

  function snapshotRowValue(module, row) {
    if (!row) return null;
    if (module && module.id === "stock_activation") return toNumber(row.share_pct);
    return toNumber(row.value);
  }

  function renderEurostatSnapshot() {
    var module = currentSnapshotModule();
    if (!module) return renderMessage("eurostatSnapshotChart", "Nessun dato snapshot Eurostat disponibile.");
    populateSnapshotCountryControl(module);
    var records = chartRecords(module);
    var countryCodes = selectedSnapshotCountries().filter(function (code, index, array) {
      return array.indexOf(code) === index && records.some(function (record) { return record.geo === code; });
    });
    if (!countryCodes.length) {
      byId("eurostatSnapshotComment").textContent = t("Seleziona almeno un paese per visualizzare lo snapshot Eurostat.");
      return renderMessage("eurostatSnapshotChart", "Seleziona almeno un paese per visualizzare lo snapshot Eurostat.");
    }

    var categories = [];
    records.forEach(function (record) {
      if (!record.code || !countryCodes.includes(record.geo)) return;
      if (!categories.some(function (category) { return category.code === record.code; })) {
        categories.push({ code: record.code, label: record.category || record.code });
      }
    });
    if (!categories.length) return renderMessage("eurostatSnapshotChart", "Nessun dato disponibile per i paesi selezionati.");

    var theme = plotTheme();
    var colors = [theme.orange, "#1f6b86", "#59a14f", "#00a862", "#b07aa1", "#edc948"];
    var isStockActivation = module.id === "stock_activation";
    var traces = categories.map(function (category, index) {
      return {
        type: "bar",
        name: t(category.label),
        x: countryCodes.map(function (code) { return countryNameFor(records, code); }),
        y: countryCodes.map(function (code) {
          var row = records.find(function (record) {
            return record.geo === code && record.code === category.code;
          });
          return snapshotRowValue(module, row);
        }),
        marker: { color: colors[index % colors.length], opacity: 0.86 },
        customdata: countryCodes.map(function (code) {
          var row = records.find(function (record) {
            return record.geo === code && record.code === category.code;
          }) || {};
          return [row.period || "", toNumber(row.value), toNumber(row.geo_total)];
        }),
        hovertemplate: "<b>%{fullData.name}</b><br>%{x}<br>" +
          t("Quota") + ": %{y:.1f}%<br>" +
          t("Periodo") + ": %{customdata[0]}" +
          (isStockActivation ? "<br>" + t("Abitazioni") + ": %{customdata[1]:,.0f}<br>" + t("Stock totale") + ": %{customdata[2]:,.0f}" : "") +
          "<extra></extra>"
      };
    });

    byId("snapshotTitle").textContent = t(module.title || "Snapshot Eurostat");
    byId("snapshotSubtitle").textContent = t(module.subtitle || "paesi selezionati");
    clearChartMessage("eurostatSnapshotChart");
    window.Plotly.react("eurostatSnapshotChart", traces, Object.assign(extraLayout({ l: 58, r: 22, t: 8, b: 72 }), {
      barmode: "stack",
      xaxis: { fixedrange: true, tickangle: countryCodes.length > 6 ? -28 : 0 },
      yaxis: {
        title: { text: isStockActivation ? t("Quota dello stock abitativo (%)") : t("Quota della popolazione (%)") },
        gridcolor: theme.line,
        fixedrange: true,
        range: [0, 105]
      },
      legend: { orientation: "h", x: 0, y: -0.18, xanchor: "left" }
    }), { responsive: true, displayModeBar: false });

    byId("eurostatSnapshotComment").innerHTML = "<strong>" + escapeHtml(t("Come leggere:")) + "</strong> " +
      escapeHtml(t(module.note || "")) + " " +
      escapeHtml(t("Paesi selezionati:")) + " " +
      countryCodes.map(function (code) { return escapeHtml(countryNameFor(records, code)); }).join(", ") + ".";
  }

  function renderExtraHorizontalBar(id, module, records, options) {
    records = toArray(records || chartRecords(module)).slice();
    if (!records.length) return renderMessage(id, "Nessun dato disponibile.");
    options = options || {};
    var theme = plotTheme();
    var values = records.map(function (record) { return toNumber(record.value); });
    var labels = records.map(function (record) { return t(record.category || record.label); });
    var periods = records.map(function (record) { return record.period || ""; });
    clearChartMessage(id);
    window.Plotly.react(id, [{
      type: "bar",
      orientation: "h",
      x: values.slice().reverse(),
      y: labels.slice().reverse(),
      marker: {
        color: values.map(function (_, index) {
          if (options.emphasizeFirst && index === 0) return theme.orange;
          return options.color || "#4e79a7";
        }).reverse(),
        opacity: 0.86
      },
      customdata: periods.slice().reverse(),
      hovertemplate: "<b>%{y}</b><br>" + t("Valore") + ": %{x:,.1f}<br>" + t("Periodo") + ": %{customdata}<extra></extra>"
    }], Object.assign(extraLayout(options.margin || { l: 154, r: 20, t: 8, b: 48 }), {
      xaxis: {
        title: { text: t(options.xTitle || ((records[0] && records[0].unit) || "")) },
        gridcolor: theme.line,
        fixedrange: true,
        rangemode: "tozero"
      },
      yaxis: { gridcolor: "rgba(0,0,0,0)", fixedrange: true }
    }), { responsive: true, displayModeBar: false });
  }

  function renderSocialHousingChart() {
    var module = extraModule("public_social_housing");
    renderExtraHorizontalBar("socialHousingChart", module, chartRecords(module), {
      xTitle: "% stock abitativo",
      color: "#59a14f",
      emphasizeFirst: true,
      margin: { l: 82, r: 20, t: 8, b: 48 }
    });
  }

  function renderStudentHousingChart() {
    var module = extraModule("student_housing");
    renderExtraHorizontalBar("studentHousingChart", module, chartRecords(module), {
      xTitle: "studenti / posti letto",
      color: "#b07aa1",
      emphasizeFirst: true,
      margin: { l: 158, r: 20, t: 8, b: 48 }
    });
  }

  function renderShortRentalsChart() {
    var module = extraModule("short_rentals");
    renderExtraHorizontalBar("shortRentalsChart", module, chartRecords(module, "regional_records"), {
      xTitle: "strutture",
      color: "#edc948",
      emphasizeFirst: true,
      margin: { l: 156, r: 20, t: 8, b: 48 }
    });
  }

  function renderPolicyCards() {
    var container = byId("policyMixCards");
    var module = extraModule("policy_mix");
    if (!container || !module) return;
    container.innerHTML = toArray(module.records).map(function (record) {
      return "<article class=\"policy-card\">" +
        "<h3>" + escapeHtml(t(record.label)) + "</h3>" +
        "<span>" + escapeHtml(t(record.metric)) + "</span>" +
        "<p>" + escapeHtml(t(record.why)) + "</p>" +
        "</article>";
    }).join("");
  }

  function renderExtraData() {
    if (!state.extraData) return;
    renderEurostatSnapshot();
    renderExtraHorizontalBar("evictionsChart", extraModule("evictions"), null, {
      xTitle: "atti / richieste / esecuzioni",
      color: "#e15759",
      emphasizeFirst: true,
      margin: { l: 170, r: 20, t: 8, b: 48 }
    });
    renderSocialHousingChart();
    renderStudentHousingChart();
    renderShortRentalsChart();
    renderPolicyCards();
    state.extraHasRendered = true;
  }

  function loadExtraData() {
    ["eurostatSnapshotChart", "evictionsChart", "socialHousingChart", "studentHousingChart", "shortRentalsChart"].forEach(function (id) {
      renderMessage(id, "Caricamento...", true);
    });
    return fetchJson(EXTRA_DATA_URL).then(function (payload) {
      state.extraData = payload;
      renderExtraData();
    }).catch(function (error) {
      ["eurostatSnapshotChart", "evictionsChart", "socialHousingChart", "studentHousingChart", "shortRentalsChart"].forEach(function (id) {
        renderMessage(id, "Non riesco a caricare il payload nazionale extra: " + error.message);
      });
      var comment = byId("eurostatSnapshotComment");
      if (comment) comment.textContent = t("Verifica che dashboard_extra.json sia stato pubblicato su Cloudflare R2.");
    });
  }

  function populateLocalControls(index) {
    var select = byId("localRegion");
    if (!select) return;
    var regions = index.regions || [];
    var current = select.value;
    if (!regions.length) {
      select.innerHTML = "<option value=\"\">" + escapeHtml(t("Export locale non disponibile")) + "</option>";
      select.disabled = true;
      byId("localMetric").disabled = true;
      return;
    }
    select.disabled = false;
    byId("localMetric").disabled = false;
    if (!byId("localMetric").value) byId("localMetric").value = "rent_mean";
    var selectedFile = current && regions.some(function (region) { return region.file === current; })
      ? current
      : ((regions.find(function (region) { return region.preload; }) || regions[0] || {}).file || "");
    select.innerHTML = regions.map(function (region) {
      var selected = region.file === selectedFile ? " selected" : "";
      return "<option value=\"" + escapeHtml(region.file) + "\"" + selected + ">" + escapeHtml(t(region.label)) + "</option>";
    }).join("");
  }

  function renderLocalUnavailable(index) {
    renderMessage("italyOverviewChart", "Focus locale non ancora esportato. Genera i JSON regionali dal repository Crisi_abitativa e pubblicali su Cloudflare R2.");
    renderMessage("localChart", "Focus locale non ancora esportato. Genera i JSON regionali dal repository Crisi_abitativa e pubblicali su Cloudflare R2.");
    byId("italyOverviewComment").innerHTML = "<strong>" + escapeHtml(t("Dataset atteso:")) + "</strong> " + escapeHtml(t("un file per regione con geometrie comunali e record con campi")) + " <code>rent_mean</code>, <code>rent_median</code>, <code>sale_mean</code>, <code>sale_median</code>. " + escapeHtml(t((index.methodology || [])[0] || ""));
    byId("localComment").innerHTML = byId("italyOverviewComment").innerHTML;
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
    var names = Array.from(new Set(toArray(rows).map(function (row) {
      return row.comune || row.name || row.label;
    }).filter(Boolean))).sort(function (a, b) {
      return a.localeCompare(b, "it");
    });
    list.innerHTML = names.map(function (name) {
      return "<option value=\"" + escapeHtml(name) + "\"></option>";
    }).join("");
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
      name: t("Comune selezionato"),
      marker: { size: 16, color: theme.text, line: { color: theme.orange, width: 4 }, symbol: "circle" },
      hovertemplate: "<b>" + escapeHtml(selected.comune) + "</b><br>" + t("Valore") + ": " + selected.value.toLocaleString(locale(), { maximumFractionDigits: 1 }) + "<extra></extra>",
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

  function fetchLocalRegionPayload(regionFile) {
    var url = LOCAL_REGION_BASE + regionFile;
    if (!state.localCache[url]) state.localCache[url] = fetchJson(url);
    return state.localCache[url];
  }

  function loadAllLocalRegions() {
    if (state.localAllPayloadsPromise) return state.localAllPayloadsPromise;
    var regions = toArray(state.localIndex && state.localIndex.regions);
    state.localAllPayloadsPromise = Promise.all(regions.map(function (region) {
      return fetchLocalRegionPayload(region.file).then(function (payload) {
        return { region: region, payload: payload, error: null };
      }).catch(function (error) {
        return { region: region, payload: null, error: error };
      });
    })).then(function (entries) {
      state.localAllPayloads = entries;
      return entries;
    });
    return state.localAllPayloadsPromise;
  }

  function loadItalyGeojson() {
    if (state.italyGeojson) return Promise.resolve(state.italyGeojson);
    if (!state.italyGeojsonPromise) {
      state.italyGeojsonPromise = fetchFirstJson(LOCAL_ITALY_GEOJSON_URLS).then(function (payload) {
        state.italyGeojson = payload;
        return payload;
      });
    }
    return state.italyGeojsonPromise;
  }

  function metricValues(rows, metric) {
    return toArray(rows).map(function (row) {
      return toNumber(row && row[metric]);
    }).filter(function (value) {
      return value !== null;
    });
  }

  function average(values) {
    values = toArray(values);
    if (!values.length) return null;
    return values.reduce(function (total, value) {
      return total + value;
    }, 0) / values.length;
  }

  function italySummaryRows(metric) {
    return toArray(state.localAllPayloads).map(function (entry) {
      var values = metricValues(entry.payload && (entry.payload.records || entry.payload.data), metric);
      return {
        file: entry.region.file,
        label: entry.region.label,
        value: average(values),
        available: values.length,
        semester: entry.payload && entry.payload.semestre_omi ? entry.payload.semestre_omi : "",
        error: entry.error
      };
    }).filter(function (row) {
      return row.value !== null;
    });
  }

  function bindItalyOverviewClick() {
    var node = byId("italyOverviewChart");
    if (!node || !node.on) return;
    if (node.housingItalyClickHandler && node.removeListener) {
      node.removeListener("plotly_click", node.housingItalyClickHandler);
    }
    node.housingItalyClickHandler = function (eventData) {
      var point = eventData && eventData.points && eventData.points[0];
      var regionFile = point && (point.location || (point.customdata && point.customdata[0]));
      if (!regionFile) return;
      var select = byId("localRegion");
      if (!select) return;
      select.value = regionFile;
      renderItalyOverview();
      loadLocalRegion();
    };
    node.on("plotly_click", node.housingItalyClickHandler);
  }

  function renderItalyOverview() {
    var metric = byId("localMetric") ? byId("localMetric").value : "";
    var meta = localMetrics[metric];
    if (!meta || !state.localAllPayloads) return;
    var rows = italySummaryRows(metric);
    if (!rows.length) {
      renderMessage("italyOverviewChart", "Nessun valore comunale disponibile per questa misura.");
      byId("italyOverviewComment").textContent = t("Nessun valore comunale disponibile per questa misura.");
      return;
    }
    var selectedRegionFile = byId("localRegion") ? byId("localRegion").value : "";
    var selectedRow = rows.find(function (row) { return row.file === selectedRegionFile; });
    var theme = plotTheme();
    var minValue = Math.min.apply(null, rows.map(function (row) { return row.value; }));
    var maxValue = Math.max.apply(null, rows.map(function (row) { return row.value; }));

    byId("italyOverviewTitle").textContent = t(meta.label) + " - " + t("Italia");
    byId("italyOverviewSubtitle").textContent = t("anteprima regionale della misura selezionata");

    clearChartMessage("italyOverviewChart");

    if (state.italyGeojson) {
      var traces = [{
        type: "choropleth",
        geojson: state.italyGeojson,
        featureidkey: "properties.region_file",
        locations: rows.map(function (row) { return row.file; }),
        z: rows.map(function (row) { return row.value; }),
        text: rows.map(function (row) { return row.label; }),
        customdata: rows.map(function (row) { return [row.file, row.available, row.semester || ""]; }),
        colorscale: [[0, "#fff2df"], [0.35, "#ffb15f"], [0.7, "#f26a21"], [1, "#7a1f0c"]],
        zmin: minValue,
        zmax: maxValue,
        marker: { line: { color: "rgba(255,255,255,.55)", width: 0.9 } },
        colorbar: { title: t(meta.unit), tickfont: { color: theme.text }, titlefont: { color: theme.text } },
        hovertemplate: "<b>%{text}</b><br>" + t("Valore") + ": %{z:.1f}<br>" + t("Comuni con dato") + ": %{customdata[1]}<br>" + t("Semestre OMI") + ": %{customdata[2]}<extra></extra>"
      }];

      if (selectedRow) {
        traces.push({
          type: "choropleth",
          geojson: state.italyGeojson,
          featureidkey: "properties.region_file",
          locations: [selectedRow.file],
          z: [selectedRow.value],
          colorscale: [[0, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,0)"]],
          zmin: selectedRow.value,
          zmax: selectedRow.value,
          showscale: false,
          hoverinfo: "skip",
          marker: { line: { color: theme.text, width: 2.1 } }
        });
      }

      window.Plotly.react("italyOverviewChart", traces, {
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: theme.text, family: "system-ui, -apple-system, Segoe UI, sans-serif", size: 13 },
        margin: { l: 8, r: 8, t: 8, b: 8 },
        geo: {
          fitbounds: "locations",
          visible: false,
          showcountries: false,
          showcoastlines: false,
          showland: true,
          landcolor: "rgba(255,255,255,0.02)",
          bgcolor: "rgba(0,0,0,0)"
        }
      }, { responsive: true, displayModeBar: false });
    } else {
      var sortedRows = rows.slice().sort(function (a, b) { return b.value - a.value; });
      window.Plotly.react("italyOverviewChart", [{
        type: "bar",
        orientation: "h",
        x: sortedRows.map(function (row) { return row.value; }).reverse(),
        y: sortedRows.map(function (row) { return row.label; }).reverse(),
        customdata: sortedRows.map(function (row) { return [row.file, row.available, row.semester || ""]; }).reverse(),
        marker: {
          color: sortedRows.map(function (row) { return row.file === selectedRegionFile ? theme.text : theme.orange; }).reverse(),
          opacity: 0.84
        },
        hovertemplate: "<b>%{y}</b><br>" + t("Valore") + ": %{x:.1f}<br>" + t("Comuni con dato") + ": %{customdata[1]}<br>" + t("Semestre OMI") + ": %{customdata[2]}<extra></extra>"
      }], {
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: theme.text, family: "system-ui, -apple-system, Segoe UI, sans-serif", size: 13 },
        margin: { l: 150, r: 34, t: 14, b: 62 },
        xaxis: { title: { text: t(meta.unit) }, gridcolor: theme.line, fixedrange: true, rangemode: "tozero" },
        yaxis: { gridcolor: "rgba(0,0,0,0)", fixedrange: true }
      }, { responsive: true, displayModeBar: false });
    }
    bindItalyOverviewClick();

    var selectedText = selectedRow
      ? " " + escapeHtml(t("Regione attiva:")) + " " + escapeHtml(t(selectedRow.label)) + "."
      : "";
    byId("italyOverviewComment").innerHTML = "<strong>" + escapeHtml(t("Come leggere:")) + "</strong> " +
      escapeHtml(t(state.italyGeojson ? "La mappa sintetizza ogni regione con la media semplice dei valori comunali disponibili per la misura selezionata." : "Il grafico sintetizza ogni regione con la media semplice dei valori comunali disponibili per la misura selezionata.")) + " " +
      escapeHtml(t("Serve come anteprima territoriale: clicca una regione per aprire sotto il dettaglio comunale.")) + " " +
      escapeHtml(t("Le quotazioni OMI restano valori di riferimento territoriale e non prezzi effettivi di contratto o di rogito.")) +
      selectedText;
  }

  function loadItalyOverview() {
    if (!state.localIndex || !(state.localIndex.regions || []).length) return Promise.resolve();
    if (!state.italyHasRendered) renderMessage("italyOverviewChart", "Caricamento...", true);
    return loadAllLocalRegions().then(function () {
      return loadItalyGeojson().catch(function () {
        state.italyGeojson = null;
        return null;
      });
    }).then(function () {
      renderItalyOverview();
      state.italyHasRendered = true;
    }).catch(function (error) {
      renderMessage("italyOverviewChart", "Non riesco a caricare il riepilogo Italia: " + error.message);
      byId("italyOverviewComment").textContent = t("Controlla che gli export locali siano pubblicati correttamente.");
    });
  }

  function renderLocalMap(rows, regionLabel, payload) {
    var metric = byId("localMetric").value;
    var meta = localMetrics[metric];
    var valid = toArray(rows).filter(function (row) {
      return Number.isFinite(Number(row[metric])) && rowLocation(row);
    }).map(function (row) {
      return Object.assign({}, row, { value: Number(row[metric]) });
    });
    if (!valid.length) return renderMessage("localChart", "Nessun valore comunale disponibile per questa misura.");
    var theme = plotTheme();
    var maxValue = Math.max.apply(null, valid.map(function (row) { return row.value; }));
    var minValue = Math.min.apply(null, valid.map(function (row) { return row.value; }));
    byId("localTitle").textContent = t(meta.label) + " - " + t(regionLabel);
    byId("localSubtitle").textContent = t("dettaglio comunale");
    clearChartMessage("localChart");
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
      colorbar: { title: t(meta.unit), tickfont: { color: theme.text }, titlefont: { color: theme.text } },
      hovertemplate: "<b>%{text}</b><br>" + t("Provincia") + ": %{customdata[0]}<br>" + t("Valore") + ": %{z:.1f}<br>" + t("Zone OMI") + ": %{customdata[1]}<extra></extra>"
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
    var selectedText = selectedMunicipalityName()
      ? " " + escapeHtml(t("Comune evidenziato:")) + " " + escapeHtml((valid.find(isSelectedMunicipality) || {}).comune || state.selectedLocalComune) + "."
      : "";
    byId("localComment").innerHTML = "<strong>" + escapeHtml(t("Come leggere:")) + "</strong> " +
      escapeHtml(t("la mappa colora i comuni della regione per")) + " " + escapeHtml(t(meta.label).toLowerCase()) + ". " +
      escapeHtml(t("Il valore e' una")) + " " + escapeHtml(t(meta.description)) + "; " +
      escapeHtml(t("non e' un prezzo di rogito o un canone contrattuale.")) + " " +
      escapeHtml(t("Comuni caricati:")) + " " + valid.length.toLocaleString(locale()) + "." +
      selectedText;
  }

  function renderLocalBar(rows, regionLabel) {
    var metric = byId("localMetric").value;
    var meta = localMetrics[metric];
    var allValid = toArray(rows).filter(function (row) {
      return Number.isFinite(Number(row[metric]));
    }).map(function (row) {
      return Object.assign({}, row, { value: Number(row[metric]) });
    }).sort(function (a, b) {
      return b.value - a.value;
    });
    var selectedRow = allValid.find(isSelectedMunicipality);
    var valid = allValid.slice(0, selectedRow ? 39 : 40);
    if (selectedRow && !valid.some(isSelectedMunicipality)) valid.push(selectedRow);
    valid = valid.sort(function (a, b) { return b.value - a.value; });
    if (!valid.length) return renderMessage("localChart", "Nessun valore comunale disponibile per questa misura.");
    var theme = plotTheme();
    byId("localTitle").textContent = t(meta.label) + " - " + t(regionLabel);
    byId("localSubtitle").textContent = t("dettaglio comunale");
    clearChartMessage("localChart");
    window.Plotly.react("localChart", [{
      type: "bar",
      orientation: "h",
      x: valid.map(function (row) { return row.value; }).reverse(),
      y: valid.map(function (row) { return row.comune || row.name || row.label; }).reverse(),
      marker: {
        color: valid.map(function (row) { return isSelectedMunicipality(row) ? theme.text : theme.orange; }).reverse(),
        opacity: 0.84,
        line: {
          color: valid.map(function (row) { return isSelectedMunicipality(row) ? theme.orange : "rgba(0,0,0,0)"; }).reverse(),
          width: valid.map(function (row) { return isSelectedMunicipality(row) ? 3 : 0; }).reverse()
        }
      },
      customdata: valid.map(function (row) { return [row.provincia || row.province || "", row.value]; }).reverse(),
      hovertemplate: "<b>%{y}</b><br>" + t("Provincia") + ": %{customdata[0]}<br>" + t("Valore") + ": %{customdata[1]:.1f}<extra></extra>"
    }], {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: theme.text, family: "system-ui, -apple-system, Segoe UI, sans-serif", size: 13 },
      margin: { l: 170, r: 34, t: 14, b: 62 },
      xaxis: { title: { text: t(meta.unit) }, gridcolor: theme.line, fixedrange: true },
      yaxis: { gridcolor: "rgba(0,0,0,0)", fixedrange: true }
    }, { responsive: true, displayModeBar: false });
    var selectedText = selectedMunicipalityName() ? " " + escapeHtml(t("Se il comune selezionato non e' nei primi valori, viene comunque incluso nella classifica.")) : "";
    byId("localComment").innerHTML = "<strong>" + escapeHtml(t("Come leggere:")) + "</strong> " +
      escapeHtml(t("il grafico mostra i primi comuni della regione per")) + " " + escapeHtml(t(meta.label).toLowerCase()) + ". " +
      escapeHtml(t("I valori OMI sono quotazioni territoriali, non transazioni o contratti effettivi.")) +
      selectedText;
  }

  function renderLocalRows(rows, regionLabel, payload) {
    populateMunicipalityControl(rows);
    if (payload && payload.geojson && payload.geojson.features) renderLocalMap(rows, regionLabel, payload);
    else renderLocalBar(rows, regionLabel);
    if (payload && payload.semestre_omi) {
      byId("sourceMeta").textContent = t("Eurostat da export statici. Mappa Italia e focus locale:") + " " + t(regionLabel) + " OMI " + payload.semestre_omi + ".";
    }
  }

  function loadLocalRegion() {
    var select = byId("localRegion");
    if (!state.localIndex || !select || !select.value) return renderLocalUnavailable(state.localIndex || {});
    var input = byId("localMunicipality");
    if (input && state.currentLocalRegionFile !== select.value) {
      input.value = "";
      state.selectedLocalComune = "";
    }
    state.currentLocalRegionFile = select.value;
    var region = (state.localIndex.regions || []).find(function (item) { return item.file === select.value; });
    var label = region ? region.label : select.value;
    var requestSerial = state.localRequestSerial + 1;
    state.localRequestSerial = requestSerial;
    if (state.localHasRendered) renderMessage("localChart", "Caricamento...", true);
    fetchLocalRegionPayload(select.value).then(function (payload) {
      if (requestSerial !== state.localRequestSerial) return;
      state.currentLocalRows = payload.records || payload.data || [];
      state.currentLocalLabel = label;
      state.currentLocalPayload = payload;
      renderItalyOverview();
      renderLocalRows(state.currentLocalRows, state.currentLocalLabel, state.currentLocalPayload);
      state.localHasRendered = true;
    }).catch(function () {
      if (requestSerial !== state.localRequestSerial) return;
      renderLocalUnavailable(state.localIndex || {});
    });
  }

  function loadLocalIndex() {
    return fetchJson(LOCAL_INDEX_URL).then(function (index) {
      state.localIndex = index;
      populateLocalControls(index);
      if ((index.regions || []).length) {
        loadItalyOverview();
        loadLocalRegion();
      } else {
        renderLocalUnavailable(index);
      }
      byId("methodologyList").innerHTML = (index.methodology || []).map(function (item) {
        return "<li>" + escapeHtml(t(item)) + "</li>";
      }).join("") + byId("methodologyList").innerHTML;
    }).catch(function (error) {
      renderMessage("italyOverviewChart", "Non riesco a caricare l'indice locale: " + error.message);
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
      syncCheckboxDropdown("highlightCountries");
      renderEurope();
    });

    function rerenderSnapshot() {
      if (!state.extraData) return;
      renderEurostatSnapshot();
    }

    byId("snapshotMetric").addEventListener("change", function () {
      populateSnapshotCountryControl(currentSnapshotModule());
      renderEurostatSnapshot();
    });
    byId("snapshotCountries").addEventListener("change", rerenderSnapshot);
    byId("snapshotCountries").addEventListener("input", rerenderSnapshot);
    byId("snapshotCountries").addEventListener("click", function () {
      setTimeout(rerenderSnapshot, 0);
    });
    byId("resetSnapshotCountries").addEventListener("click", function () {
      var module = currentSnapshotModule();
      applyDefaultComparableSelection(byId("snapshotCountries"), module ? chartRecords(module) : []);
      syncCheckboxDropdown("snapshotCountries");
      renderEurostatSnapshot();
    });

    function rerenderStockAge() {
      if (state.stockAgeData) renderStockAge(state.stockAgeData);
    }

    byId("stockAgeCountries").addEventListener("change", rerenderStockAge);
    byId("stockAgeCountries").addEventListener("input", rerenderStockAge);
    byId("stockAgeCountries").addEventListener("click", function () {
      setTimeout(rerenderStockAge, 0);
    });
    byId("resetStockAgeCountries").addEventListener("click", function () {
      applyDefaultComparableSelection(byId("stockAgeCountries"), state.stockAgeData || []);
      syncCheckboxDropdown("stockAgeCountries");
      rerenderStockAge();
    });

    byId("localRegion").addEventListener("change", function () {
      renderItalyOverview();
      loadLocalRegion();
    });
    byId("localMetric").addEventListener("change", function () {
      renderItalyOverview();
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

    window.addEventListener("site-language-change", function () {
      populateEuropeIndicatorControl();
      if (state.europeData) {
        populateCountryControl(state.europeData);
        renderEurope();
      }
      if (state.stockAgeData) {
        populateStockAgeCountryControl(state.stockAgeData);
        renderStockAge(state.stockAgeData);
      }
      if (state.extraData) renderExtraData();
      if (state.localIndex) populateLocalControls(state.localIndex);
      if (state.localAllPayloads && state.italyGeojson) renderItalyOverview();
      if (state.currentLocalRows.length) renderLocalRows(state.currentLocalRows, state.currentLocalLabel, state.currentLocalPayload);
      if (window.SiteLanguage) window.SiteLanguage.refresh(document.querySelector(".housing-dashboard"));
    });

    new MutationObserver(function () {
      if (state.europeData) renderEurope();
      if (state.stockAgeData) renderStockAge(state.stockAgeData);
      if (state.extraData) renderExtraData();
      if (state.localAllPayloads && state.italyGeojson) renderItalyOverview();
      if (state.currentLocalRows.length) renderLocalRows(state.currentLocalRows, state.currentLocalLabel, state.currentLocalPayload);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  function init() {
    if (!window.Plotly) {
      renderMessage("europeChart", "Plotly non e' disponibile.");
      renderMessage("stockAgeChart", "Plotly non e' disponibile.");
      renderMessage("eurostatSnapshotChart", "Plotly non e' disponibile.");
      renderMessage("evictionsChart", "Plotly non e' disponibile.");
      renderMessage("socialHousingChart", "Plotly non e' disponibile.");
      renderMessage("studentHousingChart", "Plotly non e' disponibile.");
      renderMessage("shortRentalsChart", "Plotly non e' disponibile.");
      renderMessage("italyOverviewChart", "Plotly non e' disponibile.");
      renderMessage("localChart", "Plotly non e' disponibile.");
      return;
    }
    bindEvents();
    renderMessage("italyOverviewChart", "Caricamento...", true);
    loadEuropeIndex().then(function () {
      populateEuropeIndicatorControl();
      if (defaultEuropeIndicatorId) byId("europeIndicator").value = defaultEuropeIndicatorId;
      if (!byId("europeIndicator").value && indicators[0]) byId("europeIndicator").value = indicators[0].id;
      loadEuropeIndicator(byId("europeIndicator").value || defaultEuropeIndicatorId);
    }).catch(function (error) {
      renderMessage("europeChart", "Non riesco a caricare l'indice Eurostat statico: " + error.message);
    });
    loadStockAge();
    loadExtraData();
    loadLocalIndex();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
