(function () {
  "use strict";

  var VERSION = "20260722-2";
  var DATA_BASES = [
    "../../data/sicurezza/",
    "https://data.nazarenolecis.com/sicurezza/"
  ];

  var LEVEL_LABELS = {
    national: "Italia",
    regional: "Regioni",
    provincial: "Province",
    capital: "Capoluoghi"
  };

  var CRIME_LABELS = {
    TOT: "Totale reati denunciati",
    THEFT: "Furti",
    BAGTHEF: "Scippi",
    PICKTHEF: "Borseggi",
    BURGTHEF: "Furti in abitazione",
    SHOPTHEF: "Furti in esercizi commerciali",
    CARTHEF: "Furti di autovetture",
    MOPETHEF: "Furti di ciclomotori",
    MOTORTHEF: "Furti di motocicli",
    TRUCKTHEF: "Furti di autocarri",
    VEHITHEF: "Furti su veicoli",
    ROBBER: "Rapine",
    BANKROB: "Rapine in banca",
    POSTROB: "Rapine in uffici postali",
    SHOPROB: "Rapine in esercizi commerciali",
    STREETROB: "Rapine in pubblica via",
    HOUSEROB: "Rapine in abitazione",
    INTENHOM: "Omicidi volontari",
    ATTEMPHOM: "Tentati omicidi",
    MAFIAHOM: "Omicidi di tipo mafioso",
    ROADHOM: "Omicidi stradali",
    INFANTHOM: "Infanticidi",
    RAPE: "Violenze sessuali",
    RAPEUN18: "Violenze sessuali su minori",
    KIDNAPP: "Sequestri di persona",
    EXTORT: "Estorsioni",
    DRUG: "Stupefacenti",
    CYBERCRIM: "Delitti informatici",
    SWINCYB: "Truffe e frodi informatiche",
    MONEYLAU: "Riciclaggio",
    USURY: "Usura",
    DAMAGE: "Danneggiamenti",
    ARSON: "Incendi",
    MENACE: "Minacce",
    BLOWS: "Percosse",
    PROSTI: "Prostituzione",
    PORNO: "Pornografia",
    COUNTER: "Contraffazione",
    SMUGGL: "Contrabbando",
    RECEIV: "Ricettazione",
    CRIMASS: "Associazione per delinquere",
    MAFIASS: "Associazione mafiosa",
    OTHCRIM: "Altri reati"
  };

  var STATE = {
    manifest: null,
    latest: [],
    countertrend: [],
    level: "regional",
    region: "all",
    province: "all",
    crime: "TOT",
    search: "",
    sort: "value"
  };

  var els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    els.status = document.getElementById("siStatus");
    els.kpis = document.getElementById("siKpis");
    els.coverage = document.getElementById("siCoverage");
    els.level = document.getElementById("siLevel");
    els.region = document.getElementById("siRegion");
    els.province = document.getElementById("siProvince");
    els.crime = document.getElementById("siCrime");
    els.search = document.getElementById("siSearch");
    els.sort = document.getElementById("siSort");
    els.reset = document.getElementById("siReset");
    els.nationalTag = document.getElementById("siNationalTag");
    els.nationalTable = document.getElementById("siNationalTable");
    els.territoryTitle = document.getElementById("siTerritoryTitle");
    els.territoryTag = document.getElementById("siTerritoryTag");
    els.territoryTable = document.getElementById("siTerritoryTable");
    els.counterTag = document.getElementById("siCounterTag");
    els.counterTable = document.getElementById("siCounterTable");

    bindEvents();
    loadData();
  }

  function bindEvents() {
    els.level.addEventListener("change", function () {
      STATE.level = els.level.value;
      if (STATE.level === "national") {
        STATE.region = "all";
        STATE.province = "all";
      }
      if (STATE.level === "regional") {
        STATE.province = "all";
      }
      render();
    });

    els.region.addEventListener("change", function () {
      STATE.region = els.region.value;
      STATE.province = "all";
      render();
    });

    els.province.addEventListener("change", function () {
      STATE.province = els.province.value;
      render();
    });

    els.crime.addEventListener("change", function () {
      STATE.crime = els.crime.value;
      render();
    });

    els.search.addEventListener("input", function () {
      STATE.search = els.search.value.trim().toLowerCase();
      renderTables();
    });

    els.sort.addEventListener("change", function () {
      STATE.sort = els.sort.value;
      renderTables();
    });

    els.reset.addEventListener("click", function () {
      STATE.level = "regional";
      STATE.region = "all";
      STATE.province = "all";
      STATE.crime = "TOT";
      STATE.search = "";
      STATE.sort = "value";
      els.search.value = "";
      render();
    });
  }

  function loadData() {
    setStatus("Caricamento dati sicurezza da Cloudflare R2 ...");

    Promise.all([
      fetchJson("manifest.json"),
      fetchJson("latest_snapshot.json"),
      fetchJson("countertrend_indicators.json")
    ]).then(function (parts) {
      STATE.manifest = parts[0] || {};
      STATE.latest = Array.isArray(parts[1]) ? parts[1] : [];
      STATE.countertrend = Array.isArray(parts[2]) ? parts[2] : [];
      populateFilters();
      render();
      setStatus(statusSummary());
    }).catch(function (error) {
      setStatus("Errore nel caricamento dei dati: " + error.message, "error");
      renderError();
    });
  }

  function fetchJson(fileName) {
    var index = 0;

    function tryNext() {
      if (index >= DATA_BASES.length) {
        return Promise.reject(new Error("file non disponibile: " + fileName));
      }
      var url = DATA_BASES[index] + fileName + "?v=" + VERSION;
      index += 1;
      return fetch(url, { cache: "no-store" }).then(function (response) {
        if (!response.ok) {
          throw new Error(response.status + " " + response.statusText);
        }
        return response.json();
      }).catch(tryNext);
    }

    return tryNext();
  }

  function renderError() {
    els.kpis.innerHTML = emptyMessage("Dati non caricati. Controlla il manifest pubblico o riprova tra poco.");
    els.coverage.innerHTML = "";
    els.nationalTable.innerHTML = emptyMessage("Nessun dato disponibile.");
    els.territoryTable.innerHTML = emptyMessage("Nessun dato disponibile.");
    els.counterTable.innerHTML = emptyMessage("Nessun dato disponibile.");
  }

  function populateFilters() {
    var levels = ["national", "regional", "provincial", "capital"].filter(function (level) {
      return STATE.latest.some(function (row) { return row.territory_level === level; });
    });

    populateSelect(els.level, levels.map(function (level) {
      return { value: level, label: LEVEL_LABELS[level] || level };
    }), STATE.level);

    populateCrimeSelect();
    updateAreaFilters();
  }

  function populateCrimeSelect() {
    var seen = {};
    var options = STATE.latest
      .filter(function (row) { return row.territory_level === "national"; })
      .map(function (row) { return crimeCode(row); })
      .filter(function (code) {
        if (!code || seen[code]) return false;
        seen[code] = true;
        return true;
      })
      .sort(function (a, b) {
        if (a === "TOT") return -1;
        if (b === "TOT") return 1;
        return crimeLabel({ crime_code: a }).localeCompare(crimeLabel({ crime_code: b }), "it");
      })
      .map(function (code) {
        return { value: code, label: crimeLabel({ crime_code: code }) + " (" + code + ")" };
      });

    populateSelect(els.crime, options, STATE.crime);
  }

  function updateAreaFilters() {
    var regions = uniqueValues(STATE.latest.map(function (row) { return row.region; })).sort(sortItalian);
    var regionOptions = [{ value: "all", label: "Tutte" }].concat(regions.map(function (region) {
      return { value: region, label: region };
    }));

    populateSelect(els.region, regionOptions, STATE.region);

    var provinceSource = STATE.latest.filter(function (row) {
      if (!row.province) return false;
      return STATE.region === "all" || row.region === STATE.region;
    });
    var provinces = uniqueValues(provinceSource.map(function (row) { return row.province; })).sort();
    var provinceOptions = [{ value: "all", label: "Tutte" }].concat(provinces.map(function (province) {
      return { value: province, label: "Provincia " + province };
    }));

    if (STATE.province !== "all" && provinces.indexOf(STATE.province) < 0) {
      STATE.province = "all";
    }

    populateSelect(els.province, provinceOptions, STATE.province);

    els.region.disabled = STATE.level === "national";
    els.province.disabled = STATE.level === "national" || STATE.level === "regional";
  }

  function render() {
    updateAreaFilters();
    els.level.value = STATE.level;
    els.region.value = STATE.region;
    els.province.value = STATE.province;
    els.crime.value = STATE.crime;
    els.sort.value = STATE.sort;
    els.search.value = STATE.search;
    renderKpis();
    renderCoverage();
    renderTables();
  }

  function renderKpis() {
    var year = latestYear();
    var nationalTotal = STATE.latest.find(function (row) {
      return row.territory_level === "national" && crimeCode(row) === "TOT";
    });
    var levels = uniqueValues(STATE.latest.map(function (row) { return row.territory_level; })).length;
    var territories = uniqueValues(STATE.latest.map(function (row) {
      return row.territory_level + ":" + row.territory_code;
    })).length;
    var latestCounter = STATE.countertrend.filter(function (row) {
      return Number(row.year) === year;
    }).length;

    els.kpis.innerHTML = [
      kpi("Anni", yearRangeLabel(), "Periodo coperto dal manifest pubblicato"),
      kpi("Totale nazionale", formatInteger(valueOf(nationalTotal)), "Reati denunciati nel " + (year || "ultimo anno")),
      kpi("Granularita", formatInteger(territories), levels + " livelli territoriali nel file snapshot"),
      kpi("Controtendenze", formatInteger(latestCounter), "Righe dell'ultimo anno con segno opposto all'Italia")
    ].join("");
  }

  function renderCoverage() {
    var hasReported = STATE.latest.some(function (row) { return isNumber(row.value); });
    var hasPeople = STATE.latest.some(function (row) { return row.person_role || row.person_category; });
    var hasCitizenship = STATE.latest.some(function (row) { return row.citizenship || row.citizenship_group; });
    var hasViolence = STATE.latest.some(function (row) {
      return row.violent_crime === true || (row.crime_family && row.crime_family !== "other_crime");
    });

    els.coverage.innerHTML = [
      coverageItem("Reati denunciati", hasReported, "Conteggi disponibili per reato e territorio."),
      coverageItem("Autori e vittime", hasPeople, "Campi previsti, non ancora popolati nei JSON correnti."),
      coverageItem("Cittadinanza", hasCitizenship, "Campi previsti per immigrati/non immigrati, da integrare."),
      coverageItem("Reati violenti", hasViolence, "Classificazione da completare con dizionario reati affidabile.")
    ].join("");
  }

  function renderTables() {
    renderNationalTable();
    renderTerritoryTable();
    renderCounterTable();
  }

  function renderNationalTable() {
    var year = latestYear();
    var rows = STATE.latest
      .filter(function (row) { return row.territory_level === "national" && crimeCode(row) !== "TOT"; })
      .sort(function (a, b) { return valueOf(b) - valueOf(a); })
      .slice(0, 15);

    els.nationalTag.textContent = year ? "Italia, " + year : "Italia";
    els.nationalTable.innerHTML = renderSimpleRows(rows, {
      name: "Reato",
      nameFn: crimeNameCell,
      contextFn: function () { return ""; },
      maxValue: maxValue(rows)
    });
  }

  function renderTerritoryTable() {
    var rows = filteredLatestRows();
    var max = maxValue(rows);
    var label = LEVEL_LABELS[STATE.level] || STATE.level;
    var crime = crimeLabel({ crime_code: STATE.crime });

    els.territoryTitle.textContent = label + " per " + crime.toLowerCase();
    els.territoryTag.textContent = tagText(rows.length);
    els.territoryTable.innerHTML = renderSimpleRows(rows.slice(0, 30), {
      name: "Territorio",
      nameFn: territoryNameCell,
      contextFn: territoryContext,
      maxValue: max
    });
  }

  function renderCounterTable() {
    var year = latestYear();
    var rows = STATE.countertrend
      .filter(function (row) { return Number(row.year) === year; })
      .filter(matchesLevelAndArea)
      .filter(matchesCrime)
      .filter(matchesSearch)
      .sort(function (a, b) { return counterScore(b) - counterScore(a); })
      .slice(0, 30);

    els.counterTag.textContent = tagText(rows.length);

    if (!rows.length) {
      els.counterTable.innerHTML = emptyMessage("Nessuna controtendenza nel perimetro selezionato.");
      return;
    }

    els.counterTable.innerHTML = [
      '<table class="si-table">',
      "<thead><tr>",
      '<th class="si-name">Territorio</th>',
      "<th>Reato</th>",
      '<th class="si-number">Valore</th>',
      '<th class="si-number">Territorio</th>',
      '<th class="si-number">Italia</th>',
      "</tr></thead><tbody>",
      rows.map(function (row) {
        return [
          "<tr>",
          '<td class="si-name">' + territoryNameCell(row) + "</td>",
          "<td>" + crimeNameCell(row) + "</td>",
          '<td class="si-number">' + formatInteger(valueOf(row)) + "</td>",
          '<td class="si-number">' + changeBadge(row.change_pct_yoy) + "</td>",
          '<td class="si-number">' + changeBadge(row.national_change_pct_yoy) + "</td>",
          "</tr>"
        ].join("");
      }).join(""),
      "</tbody></table>"
    ].join("");
  }

  function filteredLatestRows() {
    return STATE.latest
      .filter(matchesLevelAndArea)
      .filter(matchesCrime)
      .filter(matchesSearch)
      .sort(sortRows);
  }

  function matchesLevelAndArea(row) {
    if (row.territory_level !== STATE.level) return false;
    if (STATE.region !== "all" && row.region !== STATE.region) return false;
    if (STATE.province !== "all" && row.province !== STATE.province) return false;
    return true;
  }

  function matchesCrime(row) {
    return crimeCode(row) === STATE.crime;
  }

  function matchesSearch(row) {
    if (!STATE.search) return true;
    var haystack = [
      territoryLabel(row),
      territoryContext(row),
      crimeLabel(row),
      crimeCode(row),
      row.territory_code,
      row.indicator_name,
      row.crime_name
    ].join(" ").toLowerCase();
    return haystack.indexOf(STATE.search) >= 0;
  }

  function sortRows(a, b) {
    if (STATE.sort === "change") {
      return safeNumber(b.change_pct_yoy) - safeNumber(a.change_pct_yoy);
    }
    if (STATE.sort === "name") {
      return territoryLabel(a).localeCompare(territoryLabel(b), "it");
    }
    return valueOf(b) - valueOf(a);
  }

  function renderSimpleRows(rows, options) {
    if (!rows.length) {
      return emptyMessage("Nessun dato nel perimetro selezionato.");
    }

    return [
      '<table class="si-table">',
      "<thead><tr>",
      '<th class="si-name">' + escapeHtml(options.name) + "</th>",
      '<th class="si-number">Valore</th>',
      "<th>Incidenza</th>",
      '<th class="si-number">Var. annua</th>',
      "</tr></thead><tbody>",
      rows.map(function (row) {
        var width = options.maxValue > 0 ? Math.max(2, Math.round(valueOf(row) / options.maxValue * 100)) : 0;
        return [
          "<tr>",
          '<td class="si-name">' + options.nameFn(row) + "</td>",
          '<td class="si-number">' + formatInteger(valueOf(row)) + "</td>",
          '<td><div class="si-bar-track" aria-hidden="true"><span class="si-bar-fill" style="width:' + width + '%"></span></div></td>',
          '<td class="si-number">' + changeBadge(row.change_pct_yoy) + "</td>",
          "</tr>"
        ].join("");
      }).join(""),
      "</tbody></table>"
    ].join("");
  }

  function kpi(label, value, note) {
    return [
      '<article class="si-kpi">',
      "<span>" + escapeHtml(label) + "</span>",
      "<strong>" + escapeHtml(value) + "</strong>",
      "<small>" + escapeHtml(note) + "</small>",
      "</article>"
    ].join("");
  }

  function coverageItem(label, isReady, note) {
    return [
      '<article class="si-coverage-item" data-state="' + (isReady ? "ready" : "missing") + '">',
      "<strong>" + escapeHtml(label) + ": " + (isReady ? "disponibile" : "da integrare") + "</strong>",
      "<span>" + escapeHtml(note) + "</span>",
      "</article>"
    ].join("");
  }

  function crimeNameCell(row) {
    return [
      escapeHtml(crimeLabel(row)),
      '<span class="si-code">' + escapeHtml(crimeCode(row) || "n.d.") + "</span>"
    ].join("");
  }

  function territoryNameCell(row) {
    var context = territoryContext(row);
    return [
      escapeHtml(territoryLabel(row)),
      context ? '<span class="si-code">' + escapeHtml(context) + "</span>" : ""
    ].join("");
  }

  function territoryLabel(row) {
    if (!row) return "n.d.";
    if (row.territory_level === "national") return "Italia";
    if (row.territory_level === "regional") return row.region || row.territory_name || row.territory_code || "n.d.";
    if (row.territory_level === "provincial") return "Provincia " + (row.province || row.territory_code || "n.d.");
    if (row.territory_level === "capital") return "Capoluogo " + (row.capital || row.territory_code || "n.d.");
    return row.territory_name || row.territory_code || "n.d.";
  }

  function territoryContext(row) {
    var parts = [];
    if (!row) return "";
    if (row.region) parts.push(row.region);
    if (row.territory_level === "capital" && row.province) parts.push("Provincia " + row.province);
    if (row.territory_code && row.territory_code !== row.territory_name) parts.push("Codice " + row.territory_code);
    return parts.join(" · ");
  }

  function crimeLabel(row) {
    var code = crimeCode(row);
    var raw = row && (row.crime_name || row.indicator_name);
    if (code && CRIME_LABELS[code]) return CRIME_LABELS[code];
    if (raw && raw.indexOf("REATI_PS__") !== 0) return titleCase(raw);
    return code || "n.d.";
  }

  function crimeCode(row) {
    return row && String(row.crime_code || row.indicator_code || "").trim();
  }

  function changeBadge(value) {
    var direction = "flat";
    if (isNumber(value) && value > 0.05) direction = "up";
    if (isNumber(value) && value < -0.05) direction = "down";
    return '<span class="si-change" data-direction="' + direction + '">' + formatPercent(value) + "</span>";
  }

  function tagText(count) {
    var year = latestYear();
    return formatInteger(count) + " righe" + (year ? " · " + year : "");
  }

  function statusSummary() {
    var manifest = STATE.manifest || {};
    var generated = manifest.generated_at ? formatDate(manifest.generated_at) : "data generazione n.d.";
    return "Dati caricati: " + formatInteger(STATE.latest.length) + " righe snapshot, manifest generato " + generated + ".";
  }

  function yearRangeLabel() {
    var manifest = STATE.manifest || {};
    var start = manifest.start_year || "";
    var end = manifest.end_year || latestYear() || "";
    if (start && end) return start + "-" + end;
    return String(end || "n.d.");
  }

  function latestYear() {
    if (STATE.manifest && STATE.manifest.end_year) return Number(STATE.manifest.end_year);
    return STATE.latest.reduce(function (max, row) {
      return Math.max(max, Number(row.year) || 0);
    }, 0);
  }

  function valueOf(row) {
    if (!row) return 0;
    if (isNumber(row.reported_crimes)) return Number(row.reported_crimes);
    if (isNumber(row.value)) return Number(row.value);
    return 0;
  }

  function maxValue(rows) {
    return rows.reduce(function (max, row) {
      return Math.max(max, valueOf(row));
    }, 0);
  }

  function counterScore(row) {
    return Math.abs(safeNumber(row.change_pct_yoy) - safeNumber(row.national_change_pct_yoy));
  }

  function populateSelect(select, options, selectedValue) {
    select.innerHTML = options.map(function (option) {
      return '<option value="' + escapeAttribute(option.value) + '">' + escapeHtml(option.label) + "</option>";
    }).join("");

    if (options.some(function (option) { return option.value === selectedValue; })) {
      select.value = selectedValue;
    } else if (options.length) {
      select.value = options[0].value;
    }
  }

  function uniqueValues(values) {
    var seen = {};
    return values.filter(function (value) {
      if (value === null || value === undefined || value === "") return false;
      if (seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function sortItalian(a, b) {
    return String(a).localeCompare(String(b), "it");
  }

  function isNumber(value) {
    return value !== null && value !== "" && Number.isFinite(Number(value));
  }

  function safeNumber(value) {
    return isNumber(value) ? Number(value) : 0;
  }

  function formatInteger(value) {
    if (!isNumber(value)) return "n.d.";
    return Math.round(Number(value)).toLocaleString("it-IT");
  }

  function formatPercent(value) {
    if (!isNumber(value)) return "n.d.";
    return Number(value).toLocaleString("it-IT", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }) + "%";
  }

  function formatDate(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("it-IT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function titleCase(value) {
    return String(value)
      .replace(/^REATI_PS__/, "")
      .replace(/_N1$/, "")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }

  function setStatus(message, state) {
    els.status.textContent = message;
    if (state) {
      els.status.dataset.state = state;
    } else {
      delete els.status.dataset.state;
    }
  }

  function emptyMessage(message) {
    return '<p class="si-empty">' + escapeHtml(message) + "</p>";
  }

  function escapeHtml(value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }
})();
