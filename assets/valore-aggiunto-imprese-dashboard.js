(function () {
  "use strict";

  var DEFAULT_DATA_URL = "https://data.nazarenolecis.com/valore-aggiunto-imprese/dashboard.json?v=20260720-4";
  var COLORS = ["#ff6b2a", "#5b8fd9", "#5fc3b2", "#f0b44d", "#e66b6b", "#6fbd72", "#bd8ac7", "#9edb85"];
  var EU27 = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "FI", "FR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"];
  var SECTION_CODES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U"];
  var AGGREGATE_CODES = ["B-E", "G-I", "M_N", "O-Q", "R-U"];
  var SBS_SECTOR_ORDER = ["C", "F", "G", "H", "I", "J", "M", "N"];
  var SIZE_ORDER = ["0-9", "10-19", "20-49", "50-249", "250+"];
  var DEFAULT_SERIES_SECTORS = ["TOTAL", "C", "G", "H", "I", "J"];
  var DEFAULT_TREND_COUNTRIES = ["IT", "DE", "FR", "ES", "PL"];
  var CHART_SOURCE_NOTE = "Fonte: Eurostat. Elaborazione di Nazareno Lecis.";
  var COUNTRY_LABELS_IT = {
    AT: "Austria",
    BE: "Belgio",
    BG: "Bulgaria",
    CY: "Cipro",
    CZ: "Cechia",
    DE: "Germania",
    DK: "Danimarca",
    EE: "Estonia",
    EL: "Grecia",
    ES: "Spagna",
    EU27_2020: "Unione europea (27 paesi)",
    FI: "Finlandia",
    FR: "Francia",
    HR: "Croazia",
    HU: "Ungheria",
    IE: "Irlanda",
    IT: "Italia",
    LT: "Lituania",
    LU: "Lussemburgo",
    LV: "Lettonia",
    MT: "Malta",
    NL: "Paesi Bassi",
    PL: "Polonia",
    PT: "Portogallo",
    RO: "Romania",
    SE: "Svezia",
    SI: "Slovenia",
    SK: "Slovacchia"
  };
  var SECTOR_LABELS_IT = {
    TOTAL: "Totale economia",
    A: "Agricoltura, silvicoltura e pesca",
    A01: "Agricoltura e attivita connesse",
    A02: "Silvicoltura",
    A03: "Pesca e acquacoltura",
    B: "Estrazione di minerali",
    "B-E": "Industria esclusa costruzioni",
    C: "Manifattura",
    "C10-C12": "Alimentari, bevande e tabacco",
    "C13-C15": "Tessile, abbigliamento, pelle e calzature",
    C16: "Legno e prodotti in legno",
    "C16-C18": "Legno, carta e stampa",
    C17: "Carta e prodotti di carta",
    C18: "Stampa e riproduzione",
    C19: "Coke e prodotti petroliferi raffinati",
    C20: "Chimica",
    C21: "Farmaceutica",
    C22: "Gomma e plastica",
    C22_C23: "Gomma, plastica e minerali non metalliferi",
    C23: "Altri prodotti minerali non metalliferi",
    C24: "Metallurgia",
    C24_C25: "Metallurgia e prodotti in metallo",
    C25: "Prodotti in metallo",
    C26: "Computer, elettronica e ottica",
    C27: "Apparecchiature elettriche",
    C28: "Macchinari e apparecchiature",
    C29: "Autoveicoli, rimorchi e semirimorchi",
    C29_C30: "Mezzi di trasporto",
    C30: "Altri mezzi di trasporto",
    "C31-C33": "Mobili, altre manifatture e riparazioni",
    C31_C32: "Mobili e altre manifatture",
    C33: "Riparazione, manutenzione e installazione di macchine",
    D: "Energia elettrica, gas, vapore e aria condizionata",
    D35: "Energia elettrica, gas, vapore e aria condizionata",
    E: "Acqua, reti fognarie, rifiuti e risanamento",
    E36: "Raccolta, trattamento e fornitura di acqua",
    "E37-E39": "Reti fognarie, rifiuti e risanamento",
    F: "Costruzioni",
    G: "Commercio all'ingrosso e al dettaglio",
    G45: "Commercio e riparazione di autoveicoli",
    G46: "Commercio all'ingrosso",
    G47: "Commercio al dettaglio",
    "G-I": "Commercio, trasporti, alloggio e ristorazione",
    "G-J": "Commercio, trasporti, alloggio, ristorazione, informazione e comunicazione",
    H: "Trasporto e magazzinaggio",
    H49: "Trasporto terrestre e mediante condotte",
    H50: "Trasporto marittimo e per vie d'acqua",
    H51: "Trasporto aereo",
    H52: "Magazzinaggio e attivita di supporto ai trasporti",
    H53: "Servizi postali e corriere",
    I: "Alloggio e ristorazione",
    J: "Informazione e comunicazione",
    J58: "Editoria",
    "J58-J60": "Editoria, audiovisivo e trasmissioni",
    J59_J60: "Audiovisivo e attivita di programmazione",
    J61: "Telecomunicazioni",
    J62_J63: "Software, consulenza informatica e servizi informativi",
    K: "Attivita finanziarie e assicurative",
    "K-N": "Servizi finanziari, immobiliari, professionali e amministrativi",
    K64: "Servizi finanziari",
    K65: "Assicurazioni e fondi pensione",
    K66: "Attivita ausiliarie dei servizi finanziari e assicurativi",
    L: "Attivita immobiliari",
    L68: "Attivita immobiliari",
    L68A: "Affitti imputati delle abitazioni occupate dai proprietari",
    M: "Attivita professionali, scientifiche e tecniche",
    "M69-M71": "Legale, contabilita, consulenza e architettura",
    M69_M70: "Legale, contabilita e consulenza gestionale",
    M71: "Architettura e ingegneria",
    M72: "Ricerca e sviluppo",
    M73: "Pubblicita e ricerche di mercato",
    "M73-M75": "Pubblicita, ricerche di mercato e altre attivita professionali",
    M74_M75: "Altre attivita professionali e veterinarie",
    M_N: "Servizi professionali, scientifici, tecnici e amministrativi",
    N: "Servizi amministrativi e di supporto",
    N77: "Noleggio e leasing",
    N78: "Ricerca, selezione e fornitura di personale",
    N79: "Agenzie di viaggio e tour operator",
    "N80-N82": "Sicurezza, servizi agli edifici e supporto alle imprese",
    O: "Pubblica amministrazione e difesa",
    O84: "Pubblica amministrazione e difesa; assicurazione sociale obbligatoria",
    "O-Q": "Pubblica amministrazione, istruzione, sanita e sociale",
    P: "Istruzione",
    P85: "Istruzione",
    Q: "Sanita e assistenza sociale",
    Q86: "Sanita",
    Q87_Q88: "Assistenza residenziale e sociale",
    R: "Arte, sport e intrattenimento",
    "R90-R92": "Attivita creative, artistiche, intrattenimento e gioco",
    R93: "Attivita sportive e ricreative",
    "R-U": "Arte, intrattenimento e altri servizi",
    S: "Altri servizi",
    S94: "Organizzazioni associative",
    S95: "Riparazione di computer e beni personali",
    S96: "Altri servizi alla persona",
    T: "Attivita di famiglie e convivenze",
    U: "Organizzazioni extraterritoriali",
    U99: "Organizzazioni e organismi extraterritoriali"
  };

  var state = {
    payload: null,
    recordCache: {},
    country: "IT",
    year: null,
    sectorMode: "sections",
    sectorMeasure: "na_value",
    sectorCountry: "IT",
    sectorYear: null,
    rankMode: "top",
    rankCount: "12",
    seriesView: "countries",
    seriesCountry: "IT",
    seriesSectors: DEFAULT_SERIES_SECTORS.slice(),
    seriesStartYear: null,
    seriesEndYear: null,
    seriesMetric: "value",
    seriesYAxis: "zero",
    countryTrendSector: "TOTAL",
    countryTrendCountries: DEFAULT_TREND_COUNTRIES.slice(),
    europeSector: "TOTAL",
    europeYear: null,
    sizeCountry: "IT",
    sizeYear: null,
    sizeSector: "C",
    sizeMeasure: "enterprises",
    sizeTrendCountry: "IT",
    sizeTrendSector: "C",
    sizeTrendMeasure: "value_added",
    regionalCountry: "IT",
    regionalYear: null,
    regionalSector: "TOTAL"
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function text(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback || "";
    return String(value);
  }

  function number(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function dataUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get("data") || DEFAULT_DATA_URL;
  }

  function records(key) {
    var raw = toArray(state.payload && state.payload.records && state.payload.records[key]);
    var schema = toArray(state.payload && state.payload.record_schema && state.payload.record_schema[key]);
    if (!raw.length || !Array.isArray(raw[0]) || !schema.length) return raw;
    if (!state.recordCache[key]) {
      state.recordCache[key] = raw.map(function (record) {
        var row = {};
        schema.forEach(function (field, index) {
          row[field] = record[index];
        });
        return row;
      });
    }
    return state.recordCache[key];
  }

  function lookup(key) {
    return toArray(state.payload && state.payload.lookups && state.payload.lookups[key]);
  }

  function optionLabel(row) {
    return row.label || row.name || row.code || "";
  }

  function countryLabel(code, fallback) {
    return COUNTRY_LABELS_IT[code] || fallback || code || "";
  }

  function sectorLabel(rowOrCode, fallback) {
    var code = typeof rowOrCode === "string" ? rowOrCode : rowOrCode && rowOrCode.sector_code;
    var sourceLabel = typeof rowOrCode === "string" ? fallback : rowOrCode && rowOrCode.sector_label;
    return SECTOR_LABELS_IT[code] || sourceLabel || fallback || code || "";
  }

  function formatMoney(value) {
    var parsed = number(value);
    if (parsed === null) return "ND";
    if (Math.abs(parsed) >= 1000) return (parsed / 1000).toLocaleString("it-IT", { maximumFractionDigits: 1, useGrouping: true }) + " mld EUR";
    return parsed.toLocaleString("it-IT", { maximumFractionDigits: 1, useGrouping: true }) + " mln EUR";
  }

  function formatShare(value) {
    var parsed = number(value);
    if (parsed === null) return "ND";
    var digits = Math.abs(parsed) > 0 && Math.abs(parsed) < 0.1 ? 2 : 1;
    return parsed.toLocaleString("it-IT", { maximumFractionDigits: digits, useGrouping: true }) + "%";
  }

  function colorVars() {
    var style = getComputedStyle(document.documentElement);
    return {
      text: style.getPropertyValue("--text").trim() || "#f5f2ed",
      muted: style.getPropertyValue("--muted").trim() || "#b9b2aa",
      line: style.getPropertyValue("--line").trim() || "#303030",
      panel: style.getPropertyValue("--panel").trim() || "#090909"
    };
  }

  function plot(id, traces, layout) {
    var node = byId(id);
    var colors = colorVars();
    var customLayout = Object.assign({}, layout || {});
    var sourceNote = customLayout.sourceNote;
    delete customLayout.sourceNote;
    var annotations = toArray(customLayout.annotations).slice();
    delete customLayout.annotations;
    if (sourceNote) {
      annotations.push({
        text: sourceNote,
        xref: "paper",
        yref: "paper",
        x: 0,
        y: -0.22,
        xanchor: "left",
        yanchor: "top",
        showarrow: false,
        align: "left",
        font: { color: colors.muted, size: 11 }
      });
    }
    if (!node || !window.Plotly) return;
    window.Plotly.react(node, traces, Object.assign({
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: colors.text, family: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" },
      margin: { t: 18, r: 20, b: 64, l: 120 },
      xaxis: { gridcolor: colors.line, zerolinecolor: colors.line },
      yaxis: { gridcolor: colors.line, zerolinecolor: colors.line },
      hoverlabel: { bgcolor: colors.panel, bordercolor: colors.line, font: { color: colors.text } },
      legend: { orientation: "h", y: -0.18 },
      annotations: annotations
    }, customLayout), { responsive: true, displayModeBar: false });
  }

  function showEmpty(id, message) {
    var node = byId(id);
    if (!node) return;
    node.innerHTML = "";
    var empty = document.createElement("div");
    empty.className = "vai-empty";
    empty.textContent = message;
    node.appendChild(empty);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function renderGuidance(id, items) {
    var container = byId(id);
    if (!container) return;
    clear(container);
    items.forEach(function (item) {
      var node = document.createElement("div");
      var title = document.createElement("strong");
      var body = document.createElement("span");
      node.className = "vai-guidance";
      title.textContent = item.title;
      body.textContent = item.text;
      node.appendChild(title);
      node.appendChild(body);
      container.appendChild(node);
    });
  }

  function makeSelect(container, label, value, options, onChange) {
    var wrapper = document.createElement("label");
    var span = document.createElement("span");
    var select = document.createElement("select");
    span.textContent = label;
    options.forEach(function (option) {
      var item = document.createElement("option");
      item.value = option.value;
      item.textContent = option.label;
      if (String(option.value) === String(value)) item.selected = true;
      select.appendChild(item);
    });
    select.addEventListener("change", function () {
      onChange(select.value);
    });
    wrapper.appendChild(span);
    wrapper.appendChild(select);
    container.appendChild(wrapper);
  }

  function makeMultiSelect(container, label, values, options, onChange) {
    var wrapper = document.createElement("label");
    var span = document.createElement("span");
    var select = document.createElement("select");
    var selected = {};
    toArray(values).forEach(function (value) {
      selected[String(value)] = true;
    });
    span.textContent = label;
    wrapper.className = "vai-multi-filter";
    select.multiple = true;
    select.size = Math.min(Math.max(options.length, 4), 8);
    options.forEach(function (option) {
      var item = document.createElement("option");
      item.value = option.value;
      item.textContent = option.label;
      item.selected = Boolean(selected[String(option.value)]);
      select.appendChild(item);
    });
    select.addEventListener("change", function () {
      var next = Array.prototype.slice.call(select.selectedOptions).map(function (option) {
        return option.value;
      });
      onChange(next);
    });
    wrapper.appendChild(span);
    wrapper.appendChild(select);
    container.appendChild(wrapper);
  }

  function yearOptions(recordsList) {
    return Array.from(new Set(recordsList.map(function (row) { return row.year; })))
      .filter(Boolean)
      .sort(function (a, b) { return Number(b) - Number(a); })
      .map(function (year) { return { value: String(year), label: String(year) }; });
  }

  function yearValues(recordsList) {
    return Array.from(new Set(recordsList.map(function (row) { return Number(row.year); })))
      .filter(function (year) { return Number.isFinite(year); })
      .sort(function (a, b) { return a - b; });
  }

  function syncYearRange(recordsList, startKey, endKey) {
    var years = yearValues(recordsList);
    if (!years.length) return [];
    if (years.indexOf(Number(state[startKey])) < 0) state[startKey] = years[0];
    if (years.indexOf(Number(state[endKey])) < 0) state[endKey] = years[years.length - 1];
    if (Number(state[startKey]) > Number(state[endKey])) {
      state[startKey] = years[0];
      state[endKey] = years[years.length - 1];
    }
    return years.map(function (year) {
      return { value: String(year), label: String(year) };
    });
  }

  function filterYearRange(recordsList, startKey, endKey) {
    return recordsList.filter(function (row) {
      var year = Number(row.year);
      if (!Number.isFinite(year)) return false;
      if (state[startKey] && year < Number(state[startKey])) return false;
      if (state[endKey] && year > Number(state[endKey])) return false;
      return true;
    });
  }

  function countryOptions(includeEu27) {
    return lookup("countries")
      .filter(function (row) { return includeEu27 || row.code !== "EU27_2020"; })
      .map(function (row) { return { value: row.code, label: countryLabel(row.code, optionLabel(row)) }; });
  }

  function sectorOptions(sourceKey, includeTotal) {
    return lookup(sourceKey)
      .filter(function (row) { return includeTotal || row.code !== "TOTAL"; })
      .map(function (row) { return { value: row.code, label: row.code + " - " + sectorLabel(row.code, optionLabel(row)) }; });
  }

  function effectiveYear(recordsList, preferredYear) {
    var preferred = Number(preferredYear);
    var years = yearOptions(recordsList).map(function (row) { return Number(row.value); });
    if (years.indexOf(preferred) >= 0) return preferred;
    return years.length ? years[0] : preferred;
  }

  function rowsForCountryYear(country, year) {
    var rows = records("sector_value_added").filter(function (row) {
      return row.country_code === country && Number(row.year) === Number(year);
    });
    if (rows.length) return rows;
    var fallbackYear = effectiveYear(records("sector_value_added").filter(function (row) {
      return row.country_code === country;
    }), year);
    state.year = fallbackYear;
    return records("sector_value_added").filter(function (row) {
      return row.country_code === country && Number(row.year) === Number(fallbackYear);
    });
  }

  function sectorRow(rows, code) {
    return rows.find(function (row) { return row.sector_code === code; });
  }

  function totalValue(rows) {
    var total = sectorRow(rows, "TOTAL");
    return total ? number(total.value_million_eur) : null;
  }

  function mainSectionRows(rows) {
    return SECTION_CODES.map(function (code) { return sectorRow(rows, code); }).filter(Boolean);
  }

  function detailRows(rows) {
    return rows.filter(function (row) {
      return row.sector_code !== "TOTAL"
        && SECTION_CODES.indexOf(row.sector_code) < 0
        && AGGREGATE_CODES.indexOf(row.sector_code) < 0;
    });
  }

  function totalByYear(country) {
    var totals = {};
    records("sector_value_added").forEach(function (row) {
      if (row.country_code === country && row.sector_code === "TOTAL") {
        totals[Number(row.year)] = number(row.value_million_eur);
      }
    });
    return totals;
  }

  function groupValueFromNumber(value, metric, baseValue, totalValueForYear) {
    if (value === null) return null;
    if (metric === "share") {
      return totalValueForYear ? value / totalValueForYear * 100 : null;
    }
    if (metric === "base100") {
      return baseValue ? value / baseValue * 100 : null;
    }
    return value;
  }

  function groupValue(row, metric, baseValue, totalValueForYear) {
    return groupValueFromNumber(number(row && row.value_million_eur), metric, baseValue, totalValueForYear);
  }

  function seriesAxisTitle(metric, unit) {
    if (metric === "share") return unit === "enterprises" ? "Quota sulle imprese (%)" : "Quota sul totale (%)";
    if (metric === "base100") return "Indice base 100";
    if (unit === "enterprises") return "Numero di imprese";
    return "Milioni di euro";
  }

  function seriesHoverTemplate(metric, baseYear, unit) {
    if (metric === "share") {
      return unit === "enterprises"
        ? "%{x}<br>%{fullData.name}: %{y:.1f}% delle imprese<extra></extra>"
        : "%{x}<br>%{fullData.name}: %{y:.1f}% del totale<extra></extra>";
    }
    if (metric === "base100") return "%{x}<br>%{fullData.name}: %{y:.1f} (base " + baseYear + "=100)<extra></extra>";
    if (unit === "enterprises") return "%{x}<br>%{fullData.name}: %{y:,.0f} imprese<extra></extra>";
    return "%{x}<br>%{fullData.name}: %{y:,.1f} mln EUR<extra></extra>";
  }

  function renderGlobalFilters() {
    var container = byId("vaiGlobalFilters");
    if (!container) return;
    clear(container);
    makeSelect(container, "Paese", state.country, countryOptions(true), function (value) {
      state.country = value;
      state.sectorCountry = value;
      state.seriesCountry = value;
      state.sizeCountry = value === "EU27_2020" ? "IT" : value;
      state.sizeTrendCountry = value === "EU27_2020" ? "IT" : value;
      state.regionalCountry = value === "EU27_2020" ? "IT" : value;
      renderAll();
    });
    makeSelect(container, "Anno", state.year, yearOptions(records("sector_value_added")), function (value) {
      state.year = Number(value);
      state.sectorYear = Number(value);
      renderAll();
    });
  }

  function renderKpis() {
    var container = byId("vaiKpis");
    var rows = rowsForCountryYear(state.country, state.year);
    var total = totalValue(rows);
    var sections = mainSectionRows(rows).filter(function (row) { return number(row.value_million_eur) !== null; });
    var top = sections.slice().sort(function (a, b) { return b.value_million_eur - a.value_million_eur; })[0];
    var bottom = sections.slice().filter(function (row) { return row.value_million_eur > 0; }).sort(function (a, b) { return a.value_million_eur - b.value_million_eur; })[0];
    var kpis = [
      { label: "Totale", value: formatMoney(total), note: text(state.year) + " - " + countryLabel(state.country) },
      { label: "Primo settore", value: top ? sectorLabel(top) : "ND", note: top ? formatMoney(top.value_million_eur) : "" },
      { label: "Minore tra le sezioni", value: bottom ? sectorLabel(bottom) : "ND", note: bottom ? formatMoney(bottom.value_million_eur) : "" },
      { label: "Settori disponibili", value: rows.filter(function (row) { return row.value_million_eur !== null; }).length, note: "voci National Accounts" }
    ];
    clear(container);
    kpis.forEach(function (item) {
      var card = document.createElement("div");
      card.className = "vai-kpi";
      card.innerHTML = "<span></span><strong></strong><small></small>";
      card.querySelector("span").textContent = item.label;
      card.querySelector("strong").textContent = item.value;
      card.querySelector("small").textContent = item.note;
      container.appendChild(card);
    });
  }

  function renderFocusCards() {
    var container = byId("vaiFocusCards");
    var rows = rowsForCountryYear(state.country, state.year);
    var total = totalValue(rows);
    clear(container);
    var sections = mainSectionRows(rows).filter(function (row) {
      return number(row.value_million_eur) !== null && row.value_million_eur > 0;
    }).sort(function (a, b) {
      return b.value_million_eur - a.value_million_eur;
    });
    var cards = sections.slice(0, 3).map(function (row, index) {
      return { label: (index + 1) + " settore", row: row };
    });
    var bottom = sections.slice().sort(function (a, b) { return a.value_million_eur - b.value_million_eur; })[0];
    if (bottom) cards.push({ label: "Settore minore", row: bottom });
    cards.forEach(function (item) {
      var row = item.row;
      var share = row && total ? row.value_million_eur / total * 100 : null;
      var card = document.createElement("div");
      card.className = "vai-focus-card";
      card.innerHTML = "<span></span><strong></strong><em></em><small></small>";
      card.querySelector("span").textContent = item.label;
      card.querySelector("strong").textContent = row ? sectorLabel(row) : "Non disponibile";
      card.querySelector("em").textContent = row ? formatMoney(row.value_million_eur) : "ND";
      card.querySelector("small").textContent = row ? "Quota sul totale: " + formatShare(share) : "Dato non pubblicato per questa selezione.";
      container.appendChild(card);
    });
  }

  function metricOptions() {
    return [
      { value: "value", label: "Valori assoluti" },
      { value: "share", label: "Quota percentuale" },
      { value: "base100", label: "Indice base 100" }
    ];
  }

  function yAxisOptions() {
    return [
      { value: "zero", label: "Asse Y da zero" },
      { value: "fit", label: "Asse Y adattato ai dati" }
    ];
  }

  function yAxisConfig(title) {
    var axis = { title: title };
    if (state.seriesYAxis === "zero") axis.rangemode = "tozero";
    return axis;
  }

  function syncSeriesCountries() {
    var options = countryOptions(false);
    var codes = options.map(function (option) { return option.value; });
    state.countryTrendCountries = toArray(state.countryTrendCountries).filter(function (code) {
      return codes.indexOf(code) >= 0;
    });
    if (!state.countryTrendCountries.length) {
      state.countryTrendCountries = DEFAULT_TREND_COUNTRIES.filter(function (code) {
        return codes.indexOf(code) >= 0;
      });
    }
    return options;
  }

  function syncSeriesSectors() {
    var options = sectorOptions("sectors", true);
    var codes = options.map(function (option) { return option.value; });
    state.seriesSectors = toArray(state.seriesSectors).filter(function (code) {
      return codes.indexOf(code) >= 0;
    });
    if (!state.seriesSectors.length) {
      state.seriesSectors = DEFAULT_SERIES_SECTORS.filter(function (code) {
        return codes.indexOf(code) >= 0;
      });
    }
    return options;
  }

  function totalByCountryYear() {
    var totals = {};
    records("sector_value_added").forEach(function (row) {
      if (row.sector_code === "TOTAL") {
        totals[row.country_code + "-" + Number(row.year)] = number(row.value_million_eur);
      }
    });
    return totals;
  }

  function seriesRowsForRange() {
    if (state.seriesView === "countries") {
      return records("sector_value_added").filter(function (row) {
        return state.countryTrendCountries.indexOf(row.country_code) >= 0
          && row.sector_code === state.countryTrendSector
          && number(row.value_million_eur) !== null;
      });
    }
    if (state.seriesView === "size") {
      var config = sizeTrendConfig();
      return records(config.key).filter(function (row) {
        return row.country_code === state.sizeTrendCountry
          && row.sector_code === state.sizeTrendSector
          && number(row[config.valueField]) !== null;
      });
    }
    return records("sector_value_added").filter(function (row) {
      return row.country_code === state.seriesCountry
        && state.seriesSectors.indexOf(row.sector_code) >= 0
        && number(row.value_million_eur) !== null;
    });
  }

  function renderSeriesCommonFilters(container, yearOpts) {
    makeSelect(container, "Da anno", state.seriesStartYear, yearOpts, function (value) {
      state.seriesStartYear = Number(value);
      if (Number(state.seriesStartYear) > Number(state.seriesEndYear)) state.seriesEndYear = Number(value);
      renderSeriesFilters();
      renderSeriesChart();
    });
    makeSelect(container, "Ad anno", state.seriesEndYear, yearOpts, function (value) {
      state.seriesEndYear = Number(value);
      if (Number(state.seriesStartYear) > Number(state.seriesEndYear)) state.seriesStartYear = Number(value);
      renderSeriesFilters();
      renderSeriesChart();
    });
    makeSelect(container, "Parametro", state.seriesMetric, metricOptions(), function (value) {
      state.seriesMetric = value;
      renderSeriesChart();
    });
    makeSelect(container, "Asse Y", state.seriesYAxis, yAxisOptions(), function (value) {
      state.seriesYAxis = value;
      renderSeriesChart();
    });
  }

  function renderSeriesFilters() {
    var container = byId("vaiSeriesFilters");
    if (!container) return;
    clear(container);
    makeSelect(container, "Vista", state.seriesView, [
      { value: "countries", label: "Paesi nel tempo" },
      { value: "sectors", label: "Settori nel tempo" },
      { value: "size", label: "Classi dimensionali nel tempo" }
    ], function (value) {
      state.seriesView = value;
      renderSeriesFilters();
      renderSeriesChart();
    });

    if (state.seriesView === "countries") {
      var countryOpts = syncSeriesCountries();
      makeSelect(container, "Settore", state.countryTrendSector, sectorOptions("sectors", true), function (value) {
        state.countryTrendSector = value;
        renderSeriesFilters();
        renderSeriesChart();
      });
      makeMultiSelect(container, "Paesi nel grafico", state.countryTrendCountries, countryOpts, function (values) {
        state.countryTrendCountries = values.length ? values : DEFAULT_TREND_COUNTRIES.slice();
        renderSeriesFilters();
        renderSeriesChart();
      });
    } else if (state.seriesView === "size") {
      makeSelect(container, "Misura", state.sizeTrendMeasure, [
        { value: "value_added", label: "Valore aggiunto" },
        { value: "enterprises", label: "Numero imprese" }
      ], function (value) {
        state.sizeTrendMeasure = value;
        renderSeriesFilters();
        renderSeriesChart();
      });
      makeSelect(container, "Paese", state.sizeTrendCountry, countryOptions(false), function (value) {
        state.sizeTrendCountry = value;
        renderSeriesFilters();
        renderSeriesChart();
      });
      makeSelect(container, "Settore imprese", state.sizeTrendSector, sectorOptions("sbs_sectors", false), function (value) {
        state.sizeTrendSector = value;
        renderSeriesFilters();
        renderSeriesChart();
      });
    } else {
      var sectorOpts = syncSeriesSectors();
      makeSelect(container, "Paese", state.seriesCountry, countryOptions(true), function (value) {
        state.seriesCountry = value;
        renderSeriesFilters();
        renderSeriesChart();
      });
      makeMultiSelect(container, "Settori nel grafico", state.seriesSectors, sectorOpts, function (values) {
        state.seriesSectors = values.length ? values : DEFAULT_SERIES_SECTORS.slice();
        renderSeriesFilters();
        renderSeriesChart();
      });
    }

    renderSeriesCommonFilters(container, syncYearRange(seriesRowsForRange(), "seriesStartYear", "seriesEndYear"));
  }

  function renderCountrySeriesChart() {
    var allRows = filterYearRange(seriesRowsForRange(), "seriesStartYear", "seriesEndYear");
    var totals = totalByCountryYear();
    var baseYear = Number(state.seriesStartYear);
    var traces = state.countryTrendCountries.map(function (country, index) {
      var rows = allRows.filter(function (row) { return row.country_code === country; })
        .sort(function (a, b) { return Number(a.year) - Number(b.year); });
      var baseRow = rows.find(function (row) { return Number(row.year) === baseYear; });
      var baseValue = baseRow ? number(baseRow.value_million_eur) : null;
      var points = rows.map(function (row) {
        return {
          year: Number(row.year),
          value: groupValue(row, state.seriesMetric, baseValue, totals[row.country_code + "-" + Number(row.year)])
        };
      }).filter(function (point) { return point.value !== null; });
      if (points.length < 2) return null;
      return {
        type: "scatter",
        mode: "lines+markers",
        name: countryLabel(country),
        x: points.map(function (point) { return point.year; }),
        y: points.map(function (point) { return point.value; }),
        line: { color: COLORS[index % COLORS.length], width: country === "IT" ? 3 : 2 },
        marker: { size: country === "IT" ? 7 : 6 },
        hovertemplate: seriesHoverTemplate(state.seriesMetric, baseYear)
      };
    }).filter(Boolean);
    var metricText = state.seriesMetric === "share" ? "quota sul totale del paese" : (state.seriesMetric === "base100" ? "indice base 100" : "valore aggiunto assoluto");
    byId("vaiSeriesTitle").textContent = sectorLabel(state.countryTrendSector) + " nei paesi";
    byId("vaiSeriesTag").textContent = state.countryTrendCountries.length + " paesi - " + text(state.seriesStartYear) + "-" + text(state.seriesEndYear);
    byId("vaiSeriesNote").textContent = "Vista paesi: aggiungi o togli paesi dal filtro multiplo. Il parametro corrente mostra " + metricText + ".";
    renderGuidance("vaiSeriesGuidance", [
      {
        title: "Paesi selezionati",
        text: "Ogni linea e un paese. La selezione multipla permette di confrontare solo i paesi utili alla lettura, senza sovraccaricare il grafico."
      },
      {
        title: state.seriesYAxis === "fit" ? "Asse Y adattato" : "Asse Y da zero",
        text: state.seriesYAxis === "fit"
          ? "L'asse Y si concentra sui dati selezionati: utile per leggere differenze piccole, meno adatto a confrontare livelli assoluti."
          : "L'asse Y parte da zero: lettura piu prudente dei livelli, anche se variazioni piccole possono apparire compresse."
      }
    ]);
    return traces;
  }

  function renderSectorSeriesChart() {
    var allRows = filterYearRange(seriesRowsForRange(), "seriesStartYear", "seriesEndYear");
    var totals = totalByYear(state.seriesCountry);
    var baseYear = Number(state.seriesStartYear);
    var traces = state.seriesSectors.map(function (code, index) {
      var rows = allRows.filter(function (row) { return row.sector_code === code; })
        .sort(function (a, b) { return Number(a.year) - Number(b.year); });
      var baseRow = rows.find(function (row) { return Number(row.year) === baseYear; });
      var baseValue = baseRow ? number(baseRow.value_million_eur) : null;
      var points = rows.map(function (row) {
        return {
          year: Number(row.year),
          value: groupValue(row, state.seriesMetric, baseValue, totals[Number(row.year)]),
          label: sectorLabel(row)
        };
      }).filter(function (point) { return point.value !== null; });
      if (points.length < 2) return null;
      return {
        type: "scatter",
        mode: "lines+markers",
        name: points[0].label,
        x: points.map(function (point) { return point.year; }),
        y: points.map(function (point) { return point.value; }),
        line: { color: COLORS[index % COLORS.length], width: index === 0 ? 3 : 2 },
        marker: { size: index === 0 ? 7 : 6 },
        hovertemplate: seriesHoverTemplate(state.seriesMetric, baseYear)
      };
    }).filter(Boolean);
    byId("vaiSeriesTitle").textContent = "Settori nel tempo";
    byId("vaiSeriesTag").textContent = countryLabel(state.seriesCountry) + " - " + text(state.seriesStartYear) + "-" + text(state.seriesEndYear);
    byId("vaiSeriesNote").textContent = "Vista settori: seleziona uno o piu settori dello stesso paese. Il parametro cambia tra livello assoluto, quota sul totale e indice base 100.";
    renderGuidance("vaiSeriesGuidance", [
      {
        title: "Settori selezionati",
        text: "Il grafico usa gli stessi anni per le voci scelte; se una linea manca significa che non ha almeno due osservazioni nel periodo selezionato."
      },
      {
        title: state.seriesMetric === "base100" ? "Indice base 100" : (state.seriesMetric === "share" ? "Quota sul totale" : "Valori assoluti"),
        text: state.seriesMetric === "base100"
          ? "La base 100 confronta la dinamica relativa: non dice quale settore produce piu valore in livello."
          : (state.seriesMetric === "share"
            ? "La quota misura il peso del settore sul valore aggiunto totale del paese nello stesso anno."
            : "I valori assoluti indicano la dimensione economica del settore, in milioni di euro correnti.")
      }
    ]);
    return traces;
  }

  function renderSizeSeriesChart() {
    var config = sizeTrendConfig();
    var rows = filterYearRange(seriesRowsForRange(), "seriesStartYear", "seriesEndYear");
    var totals = {};
    rows.forEach(function (row) {
      var year = Number(row.year);
      totals[year] = (totals[year] || 0) + number(row[config.valueField]);
    });
    var baseYear = Number(state.seriesStartYear);
    var traces = SIZE_ORDER.map(function (sizeClass, index) {
      var sizeRowsList = rows.filter(function (row) { return row.size_class === sizeClass; })
        .sort(function (a, b) { return Number(a.year) - Number(b.year); });
      var baseRow = sizeRowsList.find(function (row) { return Number(row.year) === baseYear; });
      var baseValue = baseRow ? number(baseRow[config.valueField]) : null;
      var points = sizeRowsList.map(function (row) {
        return {
          year: Number(row.year),
          value: groupValueFromNumber(number(row[config.valueField]), state.seriesMetric, baseValue, totals[Number(row.year)])
        };
      }).filter(function (point) { return point.value !== null; });
      if (points.length < 2) return null;
      return {
        type: "scatter",
        mode: "lines+markers",
        name: sizeClass,
        x: points.map(function (point) { return point.year; }),
        y: points.map(function (point) { return point.value; }),
        line: { color: COLORS[index % COLORS.length], width: index === 0 ? 3 : 2 },
        marker: { size: index === 0 ? 7 : 6 },
        hovertemplate: seriesHoverTemplate(state.seriesMetric, baseYear, config.unit)
      };
    }).filter(Boolean);
    var measureText = config.unit === "enterprises" ? "numero di imprese" : "valore aggiunto";
    byId("vaiSeriesTitle").textContent = sectorLabel(state.sizeTrendSector) + " per classe dimensionale";
    byId("vaiSeriesTag").textContent = countryLabel(state.sizeTrendCountry) + " - " + text(state.seriesStartYear) + "-" + text(state.seriesEndYear);
    byId("vaiSeriesNote").textContent = "Vista dimensione: il parametro corrente lavora sul " + measureText + " nel perimetro delle statistiche strutturali d'impresa. Le classi sopra 10 persone restano separate.";
    renderGuidance("vaiSeriesGuidance", [
      {
        title: config.unit === "enterprises" ? "Numero imprese" : "Valore aggiunto",
        text: config.unit === "enterprises"
          ? "La serie conta le imprese per classe dimensionale. Una classe numerosa non necessariamente genera la stessa quota di valore aggiunto."
          : "La serie misura il valore aggiunto generato dalle imprese della classe dimensionale selezionata dalla fonte."
      },
      {
        title: state.seriesMetric === "share" ? "Quota nel settore" : (state.seriesMetric === "base100" ? "Dinamica relativa" : "Livelli"),
        text: state.seriesMetric === "share"
          ? "La quota e calcolata sul totale delle classi disponibili nello stesso settore, paese e anno."
          : (state.seriesMetric === "base100"
            ? "L'indice base 100 confronta traiettorie relative tra classi con dimensioni molto diverse."
            : "I livelli mostrano la scala assoluta della misura scelta.")
      }
    ]);
    return traces;
  }

  function renderSeriesChart() {
    var unit = "value_added";
    var traces = [];
    if (state.seriesView === "countries") {
      traces = renderCountrySeriesChart();
    } else if (state.seriesView === "size") {
      unit = sizeTrendConfig().unit;
      traces = renderSizeSeriesChart();
    } else {
      traces = renderSectorSeriesChart();
    }
    if (!traces.length) {
      showEmpty("vaiSeriesChart", "Serie storica non disponibile per questa selezione.");
      return;
    }
    plot("vaiSeriesChart", traces, {
      margin: { t: 18, r: 24, b: 84, l: 86 },
      xaxis: {
        title: "",
        dtick: 1,
        range: [Number(state.seriesStartYear) - 0.2, Number(state.seriesEndYear) + 0.2]
      },
      yaxis: yAxisConfig(seriesAxisTitle(state.seriesMetric, unit)),
      sourceNote: CHART_SOURCE_NOTE
    });
  }

  function sizeTrendConfig() {
    if (state.sizeTrendMeasure === "enterprises") {
      return {
        key: "firm_size_enterprises",
        valueField: "enterprises",
        unit: "enterprises",
        label: "Numero imprese"
      };
    }
    return {
      key: "firm_size_value_added",
      valueField: "value_million_eur",
      unit: "value_added",
      label: "Valore aggiunto"
    };
  }

  function sortedSizeRows(rows) {
    return rows.slice().sort(function (a, b) {
      return SIZE_ORDER.indexOf(a.size_class) - SIZE_ORDER.indexOf(b.size_class);
    });
  }

  function sizeChartConfig() {
    if (state.sizeMeasure === "value_added") {
      return {
        key: "firm_size_value_added",
        valueField: "value_million_eur",
        unit: "value_added",
        title: "Valore aggiunto per classe dimensionale",
        yTitle: "Milioni di euro",
        empty: "Valore aggiunto per dimensione non disponibile per questa selezione."
      };
    }
    if (state.sizeMeasure === "value_added_share") {
      return {
        key: "firm_size_value_added",
        valueField: "value_million_eur",
        unit: "value_added_share",
        title: "Distribuzione del valore aggiunto per classe",
        yTitle: "% valore aggiunto",
        empty: "Distribuzione del valore aggiunto per dimensione non disponibile per questa selezione."
      };
    }
    if (state.sizeMeasure === "value_per_enterprise") {
      return {
        key: "firm_size_value_added",
        valueField: "value_million_eur",
        unit: "value_per_enterprise",
        title: "Valore aggiunto per impresa per classe",
        yTitle: "Migliaia di euro per impresa",
        empty: "Valore aggiunto per impresa non disponibile per questa selezione."
      };
    }
    if (state.sizeMeasure === "enterprise_share") {
      return {
        key: "firm_size_enterprises",
        valueField: "enterprises",
        unit: "enterprise_share",
        title: "Distribuzione percentuale delle imprese",
        yTitle: "% imprese",
        empty: "Distribuzione imprese non disponibile per questa selezione."
      };
    }
    return {
      key: "firm_size_enterprises",
      valueField: "enterprises",
      unit: "enterprises",
      title: "Numero di imprese per classe dimensionale",
      yTitle: "Numero di imprese",
      empty: "Numero di imprese non disponibile per questa selezione."
    };
  }

  function sizeRows(key, valueField) {
    return sortedSizeRows(records(key).filter(function (row) {
      return row.country_code === state.sizeCountry
        && row.sector_code === state.sizeSector
        && Number(row.year) === Number(state.sizeYear)
        && number(row[valueField]) !== null;
    }));
  }

  function sectorMeasureConfig() {
    var configs = {
      na_value: { source: "national", valueKey: "value_million_eur", title: "Valore aggiunto totale", axis: "Milioni di euro", empty: "Dati settoriali non disponibili per questa selezione." },
      na_share: { source: "national", valueKey: "share", title: "Distribuzione del valore aggiunto", axis: "% del totale", empty: "Distribuzione settoriale non disponibile per questa selezione." },
      sbs_enterprises: { source: "sbs_enterprises", valueKey: "enterprises", title: "Numero di imprese per settore", axis: "Numero di imprese", empty: "Numero di imprese per settore non disponibile per questa selezione." },
      sbs_enterprise_share: { source: "sbs_enterprises", valueKey: "enterprise_share", title: "Distribuzione delle imprese per settore", axis: "% imprese", empty: "Distribuzione delle imprese non disponibile per questa selezione." },
      sbs_value: { source: "sbs_value", valueKey: "value_million_eur", title: "Valore aggiunto delle imprese per settore", axis: "Milioni di euro", empty: "Valore aggiunto delle imprese per settore non disponibile per questa selezione." },
      sbs_value_per_enterprise: { source: "sbs_value", valueKey: "value_per_enterprise", title: "Valore aggiunto per impresa", axis: "Migliaia di euro per impresa", empty: "Valore aggiunto per impresa non disponibile per questa selezione." }
    };
    return configs[state.sectorMeasure] || configs.na_value;
  }

  function sectorMeasureOptions() {
    return [
      { value: "na_value", label: "Valore aggiunto totale" },
      { value: "na_share", label: "Distribuzione valore aggiunto (%)" },
      { value: "sbs_enterprises", label: "Numero imprese per settore" },
      { value: "sbs_enterprise_share", label: "Distribuzione imprese (%)" },
      { value: "sbs_value", label: "Valore aggiunto imprese" },
      { value: "sbs_value_per_enterprise", label: "Valore aggiunto per impresa" }
    ];
  }

  function sectorMeasureUsesSbs() {
    return sectorMeasureConfig().source.indexOf("sbs") === 0;
  }

  function sectorYearBaseRows(config) {
    if (config.source === "sbs_enterprises") return records("firm_size_enterprises");
    if (config.source === "sbs_value") return records("firm_size_value_added");
    return records("sector_value_added");
  }

  function sbsSectorAggregates(country, year) {
    var bySector = {};
    records("firm_size_enterprises").forEach(function (row) {
      if (row.country_code !== country || Number(row.year) !== Number(year)) return;
      if (SBS_SECTOR_ORDER.indexOf(row.sector_code) < 0) return;
      var item = bySector[row.sector_code] || { sector_code: row.sector_code, sector_label: sectorLabel(row), enterprises: 0, value_million_eur: 0 };
      item.enterprises += number(row.enterprises) || 0;
      bySector[row.sector_code] = item;
    });
    records("firm_size_value_added").forEach(function (row) {
      if (row.country_code !== country || Number(row.year) !== Number(year)) return;
      if (SBS_SECTOR_ORDER.indexOf(row.sector_code) < 0) return;
      var item = bySector[row.sector_code] || { sector_code: row.sector_code, sector_label: sectorLabel(row), enterprises: 0, value_million_eur: 0 };
      item.value_million_eur += number(row.value_million_eur) || 0;
      bySector[row.sector_code] = item;
    });
    return Object.keys(bySector).map(function (code) {
      var item = bySector[code];
      item.value_per_enterprise = item.enterprises ? item.value_million_eur * 1000 / item.enterprises : null;
      return item;
    });
  }

  function sectorChartRows(config) {
    if (config.source === "national") {
      var rows = records("sector_value_added").filter(function (row) {
        return row.country_code === state.sectorCountry
          && Number(row.year) === Number(state.sectorYear)
          && number(row.value_million_eur) !== null;
      });
      var candidates = state.sectorMode === "sections" ? mainSectionRows(rows) : detailRows(rows);
      var total = totalValue(rows) || candidates.reduce(function (sum, row) { return sum + number(row.value_million_eur); }, 0);
      return candidates.map(function (row) {
        return Object.assign({}, row, {
          plot_value: config.valueKey === "share" && total ? row.value_million_eur / total * 100 : row.value_million_eur,
          raw_value: row.value_million_eur,
          share: total ? row.value_million_eur / total * 100 : null
        });
      });
    }
    var sbsRows = sbsSectorAggregates(state.sectorCountry, state.sectorYear);
    var totalEnterprises = sbsRows.reduce(function (sum, row) { return sum + row.enterprises; }, 0);
    var totalSbsValue = sbsRows.reduce(function (sum, row) { return sum + row.value_million_eur; }, 0);
    return sbsRows.map(function (row) {
      var value = row[config.valueKey];
      if (config.valueKey === "enterprise_share") value = totalEnterprises ? row.enterprises / totalEnterprises * 100 : null;
      return Object.assign({}, row, {
        plot_value: value,
        enterprise_share: totalEnterprises ? row.enterprises / totalEnterprises * 100 : null,
        value_share: totalSbsValue ? row.value_million_eur / totalSbsValue * 100 : null
      });
    });
  }

  function renderSectorFilters() {
    var container = byId("vaiSectorFilters");
    if (!container) return;
    clear(container);
    var config = sectorMeasureConfig();
    if (sectorMeasureUsesSbs() && state.sectorCountry === "EU27_2020") state.sectorCountry = "IT";
    var countryOpts = countryOptions(!sectorMeasureUsesSbs());
    var allYearRows = sectorYearBaseRows(config);
    var baseRows = allYearRows.filter(function (row) { return row.country_code === state.sectorCountry; });
    state.sectorYear = effectiveYear(baseRows.length ? baseRows : allYearRows, state.sectorYear || state.year);
    makeSelect(container, "Parametro", state.sectorMeasure, sectorMeasureOptions(), function (value) {
      state.sectorMeasure = value;
      renderSectorFilters();
      renderSectorChart();
    });
    makeSelect(container, "Paese", state.sectorCountry, countryOpts, function (value) {
      state.sectorCountry = value;
      renderSectorFilters();
      renderSectorChart();
    });
    makeSelect(container, "Anno", state.sectorYear, yearOptions(baseRows.length ? baseRows : allYearRows), function (value) {
      state.sectorYear = Number(value);
      renderSectorChart();
    });
    makeSelect(container, "Vista", state.sectorMode, [
      { value: "sections", label: "Sezioni NACE separate" },
      { value: "detail", label: "Dettaglio senza aggregati" }
    ], function (value) {
      state.sectorMode = value;
      renderSectorChart();
    });
    makeSelect(container, "Ordine", state.rankMode, [
      { value: "top", label: "Valori maggiori" },
      { value: "bottom", label: "Valori minori" }
    ], function (value) {
      state.rankMode = value;
      renderSectorChart();
    });
    makeSelect(container, "Numero", state.rankCount, [
      { value: "8", label: "8 settori" },
      { value: "12", label: "12 settori" },
      { value: "20", label: "20 settori" }
    ], function (value) {
      state.rankCount = value;
      renderSectorChart();
    });
  }

  function renderSectorChart() {
    var config = sectorMeasureConfig();
    var candidates = sectorChartRows(config);
    candidates = candidates.filter(function (row) {
      return number(row.plot_value) !== null && row.plot_value > 0;
    });
    candidates.sort(function (a, b) {
      return state.rankMode === "top"
        ? b.plot_value - a.plot_value
        : a.plot_value - b.plot_value;
    });
    candidates = candidates.slice(0, Number(state.rankCount)).reverse();
    byId("vaiSectorTitle").textContent = (state.rankMode === "top" ? "Valori maggiori - " : "Valori minori - ") + config.title.toLowerCase();
    byId("vaiSectorTag").textContent = countryLabel(state.sectorCountry) + " - " + text(state.sectorYear);
    var sectorNote = byId("vaiSectorNote");
    if (sectorNote) {
      sectorNote.textContent = sectorMeasureUsesSbs()
        ? "Questa vista usa le statistiche strutturali d'impresa: copre i settori pubblicati per numero di imprese, valore aggiunto e classi dimensionali."
        : "Questa vista usa i conti nazionali: le sezioni NACE sono separate per evitare aggregati troppo grandi come commercio-trasporti-alloggio-ristorazione.";
    }
    renderGuidance("vaiSectorGuidance", [
      {
        title: state.sectorMode === "sections" ? "Sezioni separate" : "Dettaglio senza aggregati",
        text: state.sectorMode === "sections"
          ? "Commercio, trasporti e alloggio-ristorazione sono mostrati come settori distinti, non dentro l'aggregato G-I."
          : "Il dettaglio entra nelle branche A64 ed esclude gli aggregati piu larghi per evitare letture gonfiate da sottovoci gia incluse."
      },
      {
        title: config.title,
        text: state.sectorMeasure === "sbs_value_per_enterprise"
          ? "Il valore per impresa e calcolato come valore aggiunto del settore diviso per numero di imprese nello stesso perimetro."
          : (config.valueKey === "share" || config.valueKey === "enterprise_share"
            ? "La distribuzione trasforma i livelli in quote percentuali per leggere la composizione."
            : "La vista in livelli mostra la dimensione assoluta della misura selezionata.")
      }
    ]);
    if (!candidates.length) {
      showEmpty("vaiSectorChart", config.empty);
      return;
    }
    plot("vaiSectorChart", [{
      type: "bar",
      orientation: "h",
      x: candidates.map(function (row) { return row.plot_value; }),
      y: candidates.map(function (row) { return sectorLabel(row); }),
      marker: { color: candidates.map(function (_, index) { return COLORS[index % COLORS.length]; }) },
      customdata: candidates.map(function (row) {
        return [
          row.raw_value || row.value_million_eur || null,
          row.enterprises || null,
          row.share || row.enterprise_share || row.value_share || null
        ];
      }),
      hovertemplate: config.valueKey === "value_per_enterprise"
        ? "%{y}<br>%{x:,.1f} mila EUR per impresa<br>%{customdata[1]:,.0f} imprese<extra></extra>"
        : (config.valueKey === "enterprises"
          ? "%{y}<br>%{x:,.0f} imprese<br>%{customdata[2]:.1f}%<extra></extra>"
          : ((config.valueKey === "share" || config.valueKey === "enterprise_share")
            ? "%{y}<br>%{x:.1f}%<extra></extra>"
            : "%{y}<br>%{x:,.1f} mln EUR<br>%{customdata[2]:.1f}%<extra></extra>"))
    }], {
      margin: { t: 18, r: 24, b: 78, l: 240 },
      xaxis: { title: config.axis },
      yaxis: { automargin: true },
      sourceNote: CHART_SOURCE_NOTE
    });
  }

  function renderEuropeFilters() {
    var container = byId("vaiEuropeFilters");
    if (!container) return;
    clear(container);
    makeSelect(container, "Settore", state.europeSector, sectorOptions("sectors", true), function (value) {
      state.europeSector = value;
      renderEuropeChart();
    });
    makeSelect(container, "Anno", state.europeYear, yearOptions(records("sector_value_added")), function (value) {
      state.europeYear = Number(value);
      renderEuropeChart();
    });
  }

  function renderEuropeChart() {
    var rows = records("sector_value_added").filter(function (row) {
      return EU27.indexOf(row.country_code) >= 0
        && row.sector_code === state.europeSector
        && Number(row.year) === Number(state.europeYear)
        && number(row.value_million_eur) !== null;
    }).sort(function (a, b) {
      return b.value_million_eur - a.value_million_eur;
    });
    var sector = rows[0] ? sectorLabel(rows[0]) : sectorLabel(state.europeSector);
    byId("vaiEuropeTitle").textContent = sector;
    byId("vaiEuropeTag").textContent = text(state.europeYear);
    renderGuidance("vaiEuropeGuidance", [
      {
        title: "Confronto assoluto",
        text: "Gli importi non sono normalizzati per popolazione, occupati o PIL: il grafico mostra la dimensione economica del settore nei paesi disponibili."
      },
      {
        title: "Stesso anno e stesso settore",
        text: "Il confronto usa una sola combinazione anno-settore; se un paese manca, la cella non e pubblicata nella fonte integrata."
      }
    ]);
    if (!rows.length) {
      showEmpty("vaiEuropeChart", "Confronto europeo non disponibile per questa selezione.");
      return;
    }
    plot("vaiEuropeChart", [{
      type: "bar",
      x: rows.map(function (row) { return countryLabel(row.country_code, row.country_name); }),
      y: rows.map(function (row) { return row.value_million_eur; }),
      marker: { color: rows.map(function (row) { return row.country_code === "IT" ? "#ff6b2a" : "#5b8fd9"; }) },
      hovertemplate: "%{x}<br>%{y:,.1f} mln EUR<extra></extra>"
    }], {
      margin: { t: 18, r: 24, b: 120, l: 86 },
      yaxis: { title: "Milioni di euro" },
      xaxis: { tickangle: -38, automargin: true },
      sourceNote: CHART_SOURCE_NOTE
    });
  }

  function renderSizeFilters() {
    var container = byId("vaiSizeFilters");
    if (!container) return;
    clear(container);
    var config = sizeChartConfig();
    var availableRows = records(config.key).filter(function (row) {
      return row.country_code === state.sizeCountry && row.sector_code === state.sizeSector;
    });
    state.sizeYear = effectiveYear(availableRows.length ? availableRows : records(config.key), state.sizeYear);
    makeSelect(container, "Parametro", state.sizeMeasure, [
      { value: "enterprises", label: "Numero imprese" },
      { value: "enterprise_share", label: "Distribuzione imprese (%)" },
      { value: "value_added", label: "Valore aggiunto" },
      { value: "value_added_share", label: "Distribuzione valore aggiunto (%)" },
      { value: "value_per_enterprise", label: "Valore aggiunto per impresa" }
    ], function (value) {
      state.sizeMeasure = value;
      renderSizeFilters();
      renderSizeChart();
    });
    makeSelect(container, "Paese", state.sizeCountry, countryOptions(false), function (value) {
      state.sizeCountry = value;
      renderSizeFilters();
      renderSizeChart();
    });
    makeSelect(container, "Settore imprese", state.sizeSector, sectorOptions("sbs_sectors", false), function (value) {
      state.sizeSector = value;
      renderSizeFilters();
      renderSizeChart();
    });
    makeSelect(container, "Anno", state.sizeYear, yearOptions(availableRows.length ? availableRows : records(config.key)), function (value) {
      state.sizeYear = Number(value);
      renderSizeChart();
    });
  }

  function renderSizeChart() {
    var config = sizeChartConfig();
    var rows = sizeRows(config.key, config.valueField);
    var enterpriseRows = sizeRows("firm_size_enterprises", "enterprises");
    var enterprisesByClass = {};
    enterpriseRows.forEach(function (row) {
      enterprisesByClass[row.size_class] = number(row.enterprises);
    });
    var total = rows.reduce(function (sum, row) { return sum + number(row[config.valueField]); }, 0);
    var values = rows.map(function (row) {
      var value = number(row[config.valueField]);
      if (config.unit === "enterprise_share" && total) return value / total * 100;
      if (config.unit === "value_added_share" && total) return value / total * 100;
      if (config.unit === "value_per_enterprise") {
        var enterprises = enterprisesByClass[row.size_class];
        return enterprises ? value * 1000 / enterprises : null;
      }
      return value;
    });
    byId("vaiSizeTitle").textContent = rows[0] ? config.title + " - " + sectorLabel(rows[0]) : config.title;
    byId("vaiSizeTag").textContent = countryLabel(state.sizeCountry) + " - " + text(state.sizeYear);
    byId("vaiSizeNote").textContent = config.unit === "enterprises"
      ? "Il grafico conta le imprese attive pubblicate nella fonte in ciascuna classe dimensionale. Non misura quanto valore producono."
      : (config.unit === "enterprise_share"
        ? "La distribuzione mostra il peso percentuale di ogni classe sul numero totale di imprese del settore selezionato."
        : (config.unit === "value_per_enterprise"
          ? "Il valore aggiunto per impresa divide il valore aggiunto della classe per il numero di imprese della stessa classe."
          : (config.unit === "value_added_share"
            ? "La distribuzione mostra quale quota del valore aggiunto del settore arriva da ogni classe dimensionale."
            : "Il grafico mostra il valore aggiunto generato dalle imprese di ciascuna classe dimensionale.")));
    renderGuidance("vaiSizeGuidance", [
      {
        title: config.unit.indexOf("value") === 0 ? "Valore prodotto" : "Numerosita delle imprese",
        text: config.unit.indexOf("value") === 0
          ? "Qui leggi dove si concentra il valore aggiunto, non quante imprese esistono in ogni classe."
          : "Qui leggi quante imprese appartengono a ogni classe. Una classe molto numerosa puo produrre una quota di valore aggiunto molto diversa."
      },
      {
        title: "Classi sopra 10 persone",
        text: "Le classi 10-19, 20-49, 50-249 e 250+ restano separate: non vengono accorpate in un generico 10+."
      }
    ]);
    if (!rows.length) {
      showEmpty("vaiSizeChart", config.empty);
      return;
    }
    plot("vaiSizeChart", [{
      type: "bar",
      x: rows.map(function (row) { return row.size_class; }),
      y: values,
      marker: { color: COLORS },
      customdata: rows.map(function (row) {
        var value = number(row[config.valueField]);
        return [
          config.unit === "enterprise_share" ? value : enterprisesByClass[row.size_class],
          total ? value / total * 100 : null
        ];
      }),
      hovertemplate: config.unit === "value_added"
        ? "%{x}<br>%{y:,.1f} mln EUR<br>%{customdata[1]:.1f}% del settore<extra></extra>"
        : (config.unit === "enterprise_share"
          ? "%{x}<br>%{y:.1f}%<br>%{customdata[0]:,.0f} imprese<extra></extra>"
          : (config.unit === "value_added_share"
            ? "%{x}<br>%{y:.1f}% del valore aggiunto<extra></extra>"
            : (config.unit === "value_per_enterprise"
              ? "%{x}<br>%{y:,.1f} mila EUR per impresa<br>%{customdata[0]:,.0f} imprese<extra></extra>"
              : "%{x}<br>%{y:,.0f} imprese<br>%{customdata[1]:.1f}% del settore<extra></extra>")))
    }], {
      margin: { t: 18, r: 24, b: 82, l: 92 },
      yaxis: { title: config.yTitle, rangemode: "tozero" },
      xaxis: { title: "Classe di persone occupate" },
      sourceNote: CHART_SOURCE_NOTE
    });
  }

  function renderRegionalFilters() {
    var container = byId("vaiRegionalFilters");
    if (!container) return;
    clear(container);
    makeSelect(container, "Paese", state.regionalCountry, countryOptions(false), function (value) {
      state.regionalCountry = value;
      renderRegionalChart();
    });
    makeSelect(container, "Anno", state.regionalYear, yearOptions(records("regional_value_added")), function (value) {
      state.regionalYear = Number(value);
      renderRegionalChart();
    });
    makeSelect(container, "Settore", state.regionalSector, sectorOptions("regional_sectors", true), function (value) {
      state.regionalSector = value;
      renderRegionalChart();
    });
  }

  function renderRegionalChart() {
    var rows = records("regional_value_added").filter(function (row) {
      return row.country_code === state.regionalCountry
        && row.sector_code === state.regionalSector
        && Number(row.year) === Number(state.regionalYear)
        && number(row.value_million_eur) !== null;
    }).sort(function (a, b) {
      return b.value_million_eur - a.value_million_eur;
    }).slice(0, 30).reverse();
    byId("vaiRegionalTitle").textContent = rows[0] ? sectorLabel(rows[0]) : "Valore aggiunto regionale";
    byId("vaiRegionalTag").textContent = countryLabel(state.regionalCountry) + " - " + text(state.regionalYear);
    renderGuidance("vaiRegionalGuidance", [
      {
        title: "Dentro il paese",
        text: "Il grafico mostra le regioni NUTS2 del paese selezionato. Se ci sono molte regioni, vengono visualizzate le prime 30 per valore aggiunto."
      },
      {
        title: "Settori piu aggregati",
        text: "Il dato regionale ha meno dettaglio settoriale dei conti nazionali A64: e utile per la geografia, non per analisi settoriali molto fini."
      }
    ]);
    if (!rows.length) {
      showEmpty("vaiRegionalChart", "Dato regionale NUTS2 non disponibile per questa selezione.");
      return;
    }
    plot("vaiRegionalChart", [{
      type: "bar",
      orientation: "h",
      x: rows.map(function (row) { return row.value_million_eur; }),
      y: rows.map(function (row) { return row.region_name; }),
      marker: { color: "#5fc3b2" },
      hovertemplate: "%{y}<br>%{x:,.1f} mln EUR<extra></extra>"
    }], {
      margin: { t: 18, r: 24, b: 78, l: 250 },
      xaxis: { title: "Milioni di euro" },
      yaxis: { automargin: true },
      sourceNote: CHART_SOURCE_NOTE
    });
  }

  function statusLabel(value) {
    var labels = {
      available: "Disponibile",
      available_when_published: "Disponibile dove pubblicato",
      not_estimated: "Non stimato"
    };
    return labels[value] || value || "";
  }

  function renderCoverage() {
    var container = byId("vaiCoverage");
    if (!container) return;
    clear(container);
    toArray(state.payload && state.payload.coverage).forEach(function (item) {
      var card = document.createElement("div");
      card.className = "vai-coverage-item";
      card.innerHTML = "<span></span><strong></strong><em></em><small></small>";
      card.querySelector("span").textContent = statusLabel(item.status);
      card.querySelector("strong").textContent = item.dimension || "";
      card.querySelector("em").textContent = item.source || "";
      card.querySelector("small").textContent = item.note || "";
      container.appendChild(card);
    });
  }

  function renderMethod() {
    var notes = byId("vaiMethodNotes");
    if (!notes) return;
    clear(notes);
    [
      "Il valore aggiunto lordo e misurato a prezzi correnti in milioni di euro: confronta la dimensione economica delle attivita, non la produttivita o i margini delle imprese.",
      "Le serie storiche sono a prezzi correnti: variazioni nel tempo possono riflettere sia quantita prodotte sia prezzi, quindi non sono serie reali o depurate dall'inflazione.",
      "I conti nazionali Eurostat sono usati per il confronto settoriale perche coprono l'intera economia e includono agricoltura, silvicoltura, pesca e servizi.",
      "La vista per sezioni principali e la piu adatta per leggere la composizione complessiva: evita di mescolare aggregati e sottovoci dello stesso ramo NACE.",
      "Il dettaglio settoriale A64 e utile per voci specifiche, ma va letto come gerarchia: alcune righe sono sottoinsiemi di aggregati gia presenti.",
      "Alcuni fenomeni economici non coincidono con una singola branca NACE: la dashboard mostra le voci ufficiali disponibili senza costruire stime settoriali aggiuntive.",
      "Le classi dimensionali arrivano dalle statistiche strutturali d'impresa: sono classi di persone occupate nell'impresa e hanno un perimetro diverso dai conti nazionali.",
      "Le classi dimensionali non sono una scomposizione dell'intera economia nazionale: descrivono il perimetro delle statistiche strutturali d'impresa e quindi vanno confrontate soprattutto dentro lo stesso settore e la stessa fonte.",
      "Il dettaglio regionale usa le regioni NUTS pubblicate da Eurostat e settori piu aggregati; non tutte le combinazioni paese-settore-anno sono disponibili.",
      "Nei confronti europei i valori sono assoluti: paesi piu grandi possono avere importi maggiori anche se il peso relativo del settore nell'economia e diverso.",
      "L'indice base 100 confronta dinamiche relative, non livelli: due linee simili in base 100 possono corrispondere a valori assoluti molto distanti.",
      "Eta e titolo di studio non sono stimati: le fonti integrate non pubblicano valore aggiunto ufficiale per queste dimensioni."
    ].forEach(function (note) {
      var item = document.createElement("li");
      item.textContent = note;
      notes.appendChild(item);
    });
  }

  function renderAll() {
    renderGlobalFilters();
    renderKpis();
    renderFocusCards();
    renderSeriesFilters();
    renderSeriesChart();
    renderSectorFilters();
    renderSectorChart();
    renderEuropeFilters();
    renderEuropeChart();
    renderSizeFilters();
    renderSizeChart();
    renderRegionalFilters();
    renderRegionalChart();
    renderCoverage();
    renderMethod();
  }

  function initialize(payload) {
    state.payload = payload;
    state.recordCache = {};
    state.year = payload.meta.latest_sector_year || 2024;
    state.europeYear = state.year;
    state.sectorCountry = state.country;
    state.sectorYear = state.year;
    state.sizeYear = payload.meta.latest_enterprise_year || payload.meta.latest_size_year || state.year;
    state.regionalYear = payload.meta.latest_regional_year || state.year;
    var status = byId("vaiStatus");
    if (status) status.textContent = "";
    renderAll();
  }

  function load() {
    fetch(dataUrl(), { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(initialize)
      .catch(function (error) {
        var status = byId("vaiStatus");
        if (status) status.textContent = "Non riesco a caricare i dati: " + error.message;
        ["vaiSeriesChart", "vaiSectorChart", "vaiEuropeChart", "vaiSizeChart", "vaiRegionalChart"].forEach(function (id) {
          showEmpty(id, "Dati non disponibili.");
        });
      });
  }

  document.addEventListener("DOMContentLoaded", load);
  new MutationObserver(function () {
    if (state.payload) renderAll();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
})();
