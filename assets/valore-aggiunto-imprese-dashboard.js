(function () {
  "use strict";

  var DEFAULT_DATA_URL = "https://data.nazarenolecis.com/valore-aggiunto-imprese/dashboard.json?v=20260720-1";
  var COLORS = ["#ff6b2a", "#5b8fd9", "#5fc3b2", "#f0b44d", "#e66b6b", "#6fbd72", "#bd8ac7", "#9edb85"];
  var EU27 = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "FI", "FR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"];
  var SECTION_CODES = ["A", "B-E", "F", "G-I", "J", "K", "L", "M_N", "O-Q", "R-U"];
  var FOCUS_CODES = ["A", "A03", "I", "N79"];
  var SIZE_ORDER = ["0-9", "10-19", "20-49", "50-249", "250+"];
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
    "B-E": "Industria esclusa costruzioni",
    C: "Manifattura",
    F: "Costruzioni",
    "G-I": "Commercio, trasporti, alloggio e ristorazione",
    I: "Alloggio e ristorazione",
    J: "Informazione e comunicazione",
    K: "Attivita finanziarie e assicurative",
    L: "Attivita immobiliari",
    M_N: "Servizi professionali, scientifici, tecnici e amministrativi",
    N79: "Agenzie di viaggio e tour operator",
    "O-Q": "Pubblica amministrazione, istruzione, sanita e sociale",
    "R-U": "Arte, intrattenimento e altri servizi"
  };

  var state = {
    payload: null,
    recordCache: {},
    country: "IT",
    year: null,
    sectorMode: "sections",
    rankMode: "top",
    rankCount: "12",
    europeSector: "A",
    europeYear: null,
    sizeCountry: "IT",
    sizeYear: null,
    sizeSector: "C",
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
    if (!node) return;
    Plotly.newPlot(id, traces, Object.assign({
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

  function yearOptions(recordsList) {
    return Array.from(new Set(recordsList.map(function (row) { return row.year; })))
      .filter(Boolean)
      .sort(function (a, b) { return Number(b) - Number(a); })
      .map(function (year) { return { value: String(year), label: String(year) }; });
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

  function sectorRowAtOrBefore(country, year, code) {
    var rows = records("sector_value_added").filter(function (row) {
      return row.country_code === country && row.sector_code === code && number(row.value_million_eur) !== null;
    }).sort(function (a, b) {
      return Number(b.year) - Number(a.year);
    });
    var preferred = rows.find(function (row) { return Number(row.year) <= Number(year); });
    return preferred || rows[0] || null;
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
      return row.sector_code !== "TOTAL" && SECTION_CODES.indexOf(row.sector_code) < 0;
    });
  }

  function renderGlobalFilters() {
    var container = byId("vaiGlobalFilters");
    if (!container) return;
    clear(container);
    makeSelect(container, "Paese", state.country, countryOptions(true), function (value) {
      state.country = value;
      state.sizeCountry = value === "EU27_2020" ? "IT" : value;
      state.regionalCountry = value === "EU27_2020" ? "IT" : value;
      renderAll();
    });
    makeSelect(container, "Anno", state.year, yearOptions(records("sector_value_added")), function (value) {
      state.year = Number(value);
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
    FOCUS_CODES.forEach(function (code) {
      var row = sectorRowAtOrBefore(state.country, state.year, code);
      var rowRows = row ? rowsForCountryYear(state.country, row.year) : rows;
      var rowTotal = row ? totalValue(rowRows) : total;
      var share = row && rowTotal ? row.value_million_eur / rowTotal * 100 : null;
      var yearText = row && Number(row.year) !== Number(state.year) ? "Ultimo anno disponibile: " + row.year + ". " : "";
      var card = document.createElement("div");
      card.className = "vai-focus-card";
      card.innerHTML = "<span></span><strong></strong><em></em><small></small>";
      card.querySelector("span").textContent = code;
      card.querySelector("strong").textContent = row ? sectorLabel(row) : "Non disponibile";
      card.querySelector("em").textContent = row ? formatMoney(row.value_million_eur) : "ND";
      card.querySelector("small").textContent = row ? yearText + "Quota sul totale: " + formatShare(share) : "Dato non pubblicato per questa selezione.";
      container.appendChild(card);
    });
  }

  function renderSectorFilters() {
    var container = byId("vaiSectorFilters");
    if (!container) return;
    clear(container);
    makeSelect(container, "Vista", state.sectorMode, [
      { value: "sections", label: "Sezioni principali" },
      { value: "detail", label: "Dettaglio Eurostat" }
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
    var rows = rowsForCountryYear(state.country, state.year);
    var candidates = state.sectorMode === "sections" ? mainSectionRows(rows) : detailRows(rows);
    candidates = candidates.filter(function (row) {
      return number(row.value_million_eur) !== null && row.value_million_eur > 0;
    });
    candidates.sort(function (a, b) {
      return state.rankMode === "top"
        ? b.value_million_eur - a.value_million_eur
        : a.value_million_eur - b.value_million_eur;
    });
    candidates = candidates.slice(0, Number(state.rankCount)).reverse();
    byId("vaiSectorTitle").textContent = state.rankMode === "top" ? "Settori con maggiore valore aggiunto" : "Settori con minore valore aggiunto";
    byId("vaiSectorTag").textContent = countryLabel(state.country) + " - " + text(state.year);
    renderGuidance("vaiSectorGuidance", [
      {
        title: state.sectorMode === "sections" ? "Sezioni principali" : "Dettaglio Eurostat",
        text: state.sectorMode === "sections"
          ? "Le sezioni principali sono piu adatte a confrontare i pesi dei settori senza sommare sottovoci gia incluse negli aggregati."
          : "Il dettaglio entra nelle branche A64: e utile per leggere settori specifici, ma alcune voci sono aggregati e non vanno sommate tra loro senza controllare la gerarchia NACE."
      },
      {
        title: state.rankMode === "top" ? "Valori maggiori" : "Valori minori",
        text: state.rankMode === "top"
          ? "Le barre mostrano dove si concentra piu valore aggiunto nel paese selezionato."
          : "La vista sui valori minori esclude importi nulli o mancanti: serve a leggere i settori pubblicati con contributo piu contenuto."
      }
    ]);
    if (!candidates.length) {
      showEmpty("vaiSectorChart", "Dati settoriali non disponibili per questa selezione.");
      return;
    }
    plot("vaiSectorChart", [{
      type: "bar",
      orientation: "h",
      x: candidates.map(function (row) { return row.value_million_eur; }),
      y: candidates.map(function (row) { return sectorLabel(row); }),
      marker: { color: candidates.map(function (_, index) { return COLORS[index % COLORS.length]; }) },
      hovertemplate: "%{y}<br>%{x:,.1f} mln EUR<extra></extra>"
    }], {
      margin: { t: 18, r: 24, b: 78, l: 240 },
      xaxis: { title: "Milioni di euro" },
      yaxis: { automargin: true },
      sourceNote: CHART_SOURCE_NOTE
    });
  }

  function renderEuropeFilters() {
    var container = byId("vaiEuropeFilters");
    if (!container) return;
    clear(container);
    makeSelect(container, "Settore", state.europeSector, sectorOptions("sectors", false), function (value) {
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
    makeSelect(container, "Paese", state.sizeCountry, countryOptions(false), function (value) {
      state.sizeCountry = value;
      renderSizeChart();
    });
    makeSelect(container, "Anno", state.sizeYear, yearOptions(records("firm_size_value_added")), function (value) {
      state.sizeYear = Number(value);
      renderSizeChart();
    });
    makeSelect(container, "Settore SBS", state.sizeSector, sectorOptions("sbs_sectors", false), function (value) {
      state.sizeSector = value;
      renderSizeChart();
    });
  }

  function renderSizeChart() {
    var rows = records("firm_size_value_added").filter(function (row) {
      return row.country_code === state.sizeCountry
        && row.sector_code === state.sizeSector
        && Number(row.year) === Number(state.sizeYear)
        && number(row.value_million_eur) !== null;
    });
    rows.sort(function (a, b) {
      return SIZE_ORDER.indexOf(a.size_class) - SIZE_ORDER.indexOf(b.size_class);
    });
    var total = rows.reduce(function (sum, row) { return sum + row.value_million_eur; }, 0);
    byId("vaiSizeTitle").textContent = rows[0] ? sectorLabel(rows[0]) : "Classi dimensionali";
    byId("vaiSizeTag").textContent = countryLabel(state.sizeCountry) + " - " + text(state.sizeYear);
    renderGuidance("vaiSizeGuidance", [
      {
        title: "Classi sopra 10 persone",
        text: "Le classi 10-19, 20-49, 50-249 e 250+ restano separate: qui non vengono accorpate in un generico 10+."
      },
      {
        title: "Perimetro SBS",
        text: "Questa tavola descrive la business economy coperta dalle Structural Business Statistics: non ha lo stesso perimetro dei conti nazionali, soprattutto per agricoltura, pesca e alcune attivita pubbliche."
      }
    ]);
    if (!rows.length) {
      showEmpty("vaiSizeChart", "Valore aggiunto per dimensione non disponibile per questa selezione.");
      return;
    }
    plot("vaiSizeChart", [{
      type: "bar",
      x: rows.map(function (row) { return row.size_class; }),
      y: rows.map(function (row) { return row.value_million_eur; }),
      marker: { color: COLORS },
      customdata: rows.map(function (row) { return total ? row.value_million_eur / total * 100 : null; }),
      hovertemplate: "%{x}<br>%{y:,.1f} mln EUR<br>%{customdata:.1f}% del settore<extra></extra>"
    }], {
      margin: { t: 18, r: 24, b: 82, l: 92 },
      yaxis: { title: "Milioni di euro" },
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
      "I conti nazionali Eurostat sono usati per il confronto settoriale perche coprono l'intera economia e includono agricoltura, silvicoltura, pesca e servizi.",
      "Il turismo non e una singola branca NACE nei conti nazionali: la dashboard mostra alloggio e ristorazione come proxy principale e agenzie di viaggio/tour operator quando il dettaglio e pubblicato.",
      "Le classi dimensionali arrivano da Structural Business Statistics: sono classi di persone occupate nell'impresa e hanno un perimetro diverso dai conti nazionali.",
      "Il dettaglio regionale usa le regioni NUTS pubblicate da Eurostat e settori piu aggregati; non tutte le combinazioni paese-settore-anno sono disponibili.",
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
    state.sizeYear = payload.meta.latest_size_year || state.year;
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
        ["vaiSectorChart", "vaiEuropeChart", "vaiSizeChart", "vaiRegionalChart"].forEach(function (id) {
          showEmpty(id, "Dati non disponibili.");
        });
      });
  }

  document.addEventListener("DOMContentLoaded", load);
  new MutationObserver(function () {
    if (state.payload) renderAll();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
})();
