(function () {
  "use strict";

  var DATA_SOURCES = [
    "https://data.nazarenolecis.com/sanita-italia/dashboard.json?v=20260720-1",
    "../../data/sanita-italia/dashboard.json",
    "https://raw.githubusercontent.com/NazarenoLecis/nazarenolecis-data-pipeline/main/publish/sanita-italia/dashboard.json"
  ];

  var STATE = {
    payload: null,
    year: "Tutti",
    region: "Tutte",
    provider: "Tutte",
    theme: "Tutte",
    compare: "italia",
    table: "catalog",
    search: ""
  };

  var COLORS = ["#ff5a1f", "#5d8fd7", "#3aa6a1", "#65a96b", "#d9ad48", "#d96666", "#9c7ad9", "#8f8f8f"];
  var MISSING = "ND";

  var TABLE_OPTIONS = [
    { id: "catalog", label: "Catalogo fonti", columns: ["provider", "dataset_name", "theme", "access_type", "license", "redistribution_allowed", "download_status", "source_page_url"] },
    { id: "source_ranking", label: "Ranking fonti", columns: ["provider", "dataset_name", "theme", "access_type", "license", "score", "source_page_url"] },
    { id: "validated_links", label: "Link validati", columns: ["provider", "source_id", "file_extension", "link_text", "validation_status_code", "validation_content_length", "is_data_file", "final_url"] },
    { id: "dataset_registry", label: "Registro dataset", columns: ["provider", "dataset_name", "theme", "file_extension", "validation_status_code", "is_data_file", "is_report_file", "candidate_url"] },
    { id: "health_expenditure_resource_plan", label: "Piano risorse spesa", columns: ["provider", "dataset_name", "format", "accounting_basis", "relevance_score", "resource_status", "candidate_url"] },
    { id: "health_expenditure_registry", label: "Registro spesa sanitaria", columns: ["provider", "dataset_name", "format", "accounting_basis", "relevance_score", "candidate_url"] },
    { id: "openbdap_health_expenditure_resources", label: "Risorse OpenBDAP", columns: ["package_title", "resource_name", "resource_format", "license_title", "relevance_score", "resource_url"] },
    { id: "regional_sources_seed", label: "Mapping regionale", columns: ["region", "module_id", "status", "license", "source_page_url", "download_url"] },
    { id: "analysis_modules", label: "Moduli analisi", columns: ["module_id", "module_name", "coverage", "expected_granularity"] },
    { id: "project_audit", label: "Audit progetto", columns: ["check_group", "check_name", "passed", "value", "message"] },
    { id: "quality_overview", label: "Qualita dataset", columns: ["check_name", "passed", "value", "message", "dataset_path"] },
    { id: "processed_dataset_inventory", label: "Dataset processati", columns: ["dataset_path", "file_format", "rows", "columns", "error"] },
    { id: "outputs_summary", label: "Output prodotti", columns: ["output_file", "path", "format"] },
    { id: "recursive_public_discovery", label: "Discovery ricorsiva", columns: ["provider", "source_id", "link_type", "depth", "link_text", "found_url"] },
    { id: "agenas_links", label: "Link AGENAS", columns: ["provider", "source_id", "link_text", "url", "error"] },
    { id: "iss_links", label: "Link ISS", columns: ["provider", "source_id", "link_text", "url", "error"] },
    { id: "istat_demography_links", label: "Link ISTAT demografia", columns: ["provider", "source_role", "link_type", "link_text", "url"] },
    { id: "siope_links", label: "Link SIOPE", columns: ["provider", "source_id", "link_type", "link_text", "url"] },
    { id: "data_requirements", label: "Requisiti dati", columns: ["module_id", "required_dataset", "granularity", "source_priority", "notes"] },
    { id: "publication_rules", label: "Regole pubblicazione", columns: ["rule_id", "scope", "rule", "severity", "notes"] }
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function asText(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback || MISSING;
    return String(value);
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function formatNumber(value) {
    var number = toNumber(value);
    if (number === null) return MISSING;
    return number.toLocaleString("it-IT", { maximumFractionDigits: 0 });
  }

  function formatDisplay(value) {
    var number = toNumber(value);
    if (number === null) return asText(value);
    return formatNumber(number);
  }

  function compact(value, maxLength) {
    var text = asText(value);
    maxLength = maxLength || 74;
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3).trim() + "...";
  }

  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function clear(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function create(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function rows(tableName) {
    var tables = STATE.payload && STATE.payload.tables ? STATE.payload.tables : {};
    return toArray(tables[tableName]);
  }

  function summary(name) {
    var summaries = STATE.payload && STATE.payload.summaries ? STATE.payload.summaries : {};
    return toArray(summaries[name]);
  }

  function worklist(name) {
    var worklists = STATE.payload && STATE.payload.worklists ? STATE.payload.worklists : {};
    return toArray(worklists[name]);
  }

  function setStatus(text, state) {
    var node = byId("hiStatus");
    if (!node) return;
    node.textContent = text;
    if (state) node.dataset.state = state;
  }

  function plotConfig() {
    return {
      responsive: true,
      displayModeBar: false,
      scrollZoom: false,
      doubleClick: false,
      showTips: false
    };
  }

  function baseLayout(extra) {
    var text = cssVar("--text", "#f5f2ed");
    var muted = cssVar("--muted", "#b9b2aa");
    var line = cssVar("--line", "#303030");
    var panel = cssVar("--panel", "#090909");
    var layout = Object.assign({
      autosize: true,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: {
        color: text,
        family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        size: 12
      },
      margin: { t: 18, r: 18, b: 48, l: 68 },
      hoverlabel: {
        bgcolor: panel,
        bordercolor: line,
        font: { color: text }
      },
      dragmode: false,
      xaxis: {
        fixedrange: true,
        gridcolor: line,
        zerolinecolor: line,
        tickfont: { color: muted },
        automargin: true
      },
      yaxis: {
        fixedrange: true,
        gridcolor: line,
        zerolinecolor: line,
        tickfont: { color: muted },
        automargin: true
      }
    }, extra || {});

    if (extra && extra.xaxis) {
      layout.xaxis = Object.assign({}, baseLayout().xaxis, extra.xaxis);
    }
    if (extra && extra.yaxis) {
      layout.yaxis = Object.assign({}, baseLayout().yaxis, extra.yaxis);
    }
    return layout;
  }

  function showEmptyChart(id, message) {
    var node = byId(id);
    if (!node) return;
    if (window.Plotly) {
      try { window.Plotly.purge(node); } catch (error) {}
    }
    clear(node);
    node.appendChild(create("div", "hi-empty", message || "Nessun dato disponibile"));
  }

  function plot(id, traces, layout) {
    var node = byId(id);
    if (!node) return;
    if (!window.Plotly) {
      showEmptyChart(id, "Plotly non caricato");
      return;
    }
    if (!traces || !traces.length) {
      showEmptyChart(id, "Nessun dato disponibile");
      return;
    }
    window.Plotly.react(node, traces, baseLayout(layout), plotConfig()).catch(function () {
      showEmptyChart(id, "Errore nella costruzione del grafico");
    });
  }

  function plotSummaryBar(id, data, limit, horizontal) {
    data = toArray(data).slice(0, limit || 12);
    if (!data.length) {
      showEmptyChart(id);
      return;
    }
    var labels = data.map(function (item) { return compact(item.value, horizontal ? 34 : 22); });
    var values = data.map(function (item) { return toNumber(item.count) || 0; });
    if (horizontal) {
      labels.reverse();
      values.reverse();
    }
    plot(id, [{
      type: "bar",
      orientation: horizontal ? "h" : "v",
      x: horizontal ? values : labels,
      y: horizontal ? labels : values,
      marker: { color: COLORS[0] },
      hovertemplate: "%{y}: %{x}<extra></extra>"
    }], {
      margin: horizontal ? { t: 18, r: 18, b: 42, l: 158 } : { t: 18, r: 18, b: 86, l: 56 },
      xaxis: horizontal ? { title: "" } : { tickangle: -28 },
      yaxis: horizontal ? { title: "" } : { title: "" }
    });
  }

  function plotDonut(id, data) {
    data = toArray(data).filter(function (item) { return (toNumber(item.count) || 0) > 0; });
    if (!data.length) {
      showEmptyChart(id);
      return;
    }
    plot(id, [{
      type: "pie",
      hole: .55,
      labels: data.map(function (item) { return asText(item.value); }),
      values: data.map(function (item) { return toNumber(item.count) || 0; }),
      marker: { colors: COLORS },
      textinfo: "label+percent",
      hovertemplate: "%{label}: %{value}<extra></extra>"
    }], {
      margin: { t: 18, r: 18, b: 18, l: 18 },
      showlegend: false
    });
  }

  function linkCell(value) {
    var text = asText(value, "");
    if (!/^https?:\/\//i.test(text)) return document.createTextNode(compact(text));
    var link = document.createElement("a");
    link.href = text;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "apri";
    return link;
  }

  function createTable(containerId, tableRows, columns, limit) {
    var container = byId(containerId);
    if (!container) return;
    clear(container);
    tableRows = toArray(tableRows).slice(0, limit || 80);
    columns = columns && columns.length ? columns : inferColumns(tableRows);

    var table = create("table", "hi-table");
    var thead = document.createElement("thead");
    var headerRow = document.createElement("tr");
    columns.forEach(function (column) {
      headerRow.appendChild(create("th", "", column.replace(/_/g, " ")));
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    if (!tableRows.length) {
      var emptyRow = document.createElement("tr");
      var emptyCell = create("td", "", "Nessun dato disponibile");
      emptyCell.colSpan = Math.max(1, columns.length);
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
    } else {
      tableRows.forEach(function (row) {
        var tr = document.createElement("tr");
        columns.forEach(function (column) {
          var td = document.createElement("td");
          var value = row[column];
          if (/url$/i.test(column) || column === "candidate_url" || column === "final_url") {
            td.className = "hi-url-cell";
            td.appendChild(linkCell(value));
          } else if (column === "dataset_name" || column === "package_title" || column === "resource_name") {
            var strong = document.createElement("strong");
            strong.textContent = compact(value, 88);
            td.appendChild(strong);
          } else {
            td.textContent = compact(value, 96);
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function inferColumns(tableRows) {
    var first = tableRows && tableRows.length ? tableRows[0] : {};
    return Object.keys(first).slice(0, 8);
  }

  function valueMatches(value, selected) {
    return selected === "Tutti" || selected === "Tutte" || asText(value) === selected;
  }

  function dimensionMatches(values, selected) {
    if (selected === "Tutti" || selected === "Tutte") return true;
    values = toArray(values).filter(function (value) {
      return value !== null && value !== undefined && value !== "";
    });
    if (!values.length) return true;
    return values.some(function (value) {
      return asText(value) === selected;
    });
  }

  function rowText(row) {
    return Object.keys(row || {}).map(function (key) { return asText(row[key], ""); }).join(" ").toLowerCase();
  }

  function rowMatchesGlobalFilters(row) {
    var providerOk = dimensionMatches([row.provider], STATE.provider);
    var themeOk = dimensionMatches([row.theme, row.module_id], STATE.theme);
    var regionOk = dimensionMatches([row.region, row.region_name], STATE.region);
    var year = row.year || yearFromText(row.dataset_name) || yearFromText(row.checked_at) || yearFromText(row.last_checked) || yearFromText(row.resource_created);
    var yearOk = dimensionMatches([year], STATE.year);
    return providerOk && themeOk && regionOk && yearOk;
  }

  function yearFromText(value) {
    var match = asText(value, "").match(/\b(20\d{2}|19\d{2})\b/);
    return match ? match[1] : null;
  }

  function filteredRows(tableName) {
    var term = STATE.search.trim().toLowerCase();
    return rows(tableName).filter(function (row) {
      if (!rowMatchesGlobalFilters(row)) return false;
      if (!term) return true;
      return rowText(row).indexOf(term) !== -1;
    });
  }

  function uniqueSorted(values, firstLabel) {
    var seen = {};
    var result = [firstLabel];
    values.forEach(function (value) {
      var text = asText(value, "");
      if (!text || text === MISSING || seen[text]) return;
      seen[text] = true;
      result.push(text);
    });
    return result.sort(function (a, b) {
      if (a === firstLabel) return -1;
      if (b === firstLabel) return 1;
      return a.localeCompare(b, "it");
    });
  }

  function fillSelect(id, options, selected) {
    var node = byId(id);
    if (!node) return;
    clear(node);
    options.forEach(function (option) {
      var opt = document.createElement("option");
      opt.value = option;
      opt.textContent = option;
      node.appendChild(opt);
    });
    if (options.indexOf(selected) !== -1) node.value = selected;
  }

  function setupFilters() {
    var catalog = rows("catalog");
    var regional = rows("regional_sources_seed");
    var years = [];
    ["catalog", "validated_links", "health_expenditure_resource_plan", "openbdap_health_expenditure_resources"].forEach(function (tableName) {
      rows(tableName).forEach(function (row) {
        ["year", "last_checked", "checked_at", "dataset_name", "resource_created", "resource_last_modified"].forEach(function (field) {
          var year = row[field] && field === "year" ? row[field] : yearFromText(row[field]);
          if (year) years.push(year);
        });
      });
    });

    fillSelect("hiYearFilter", uniqueSorted(years, "Tutti"), STATE.year);
    fillSelect("hiRegionFilter", uniqueSorted(regional.map(function (row) { return row.region; }), "Tutte"), STATE.region);
    fillSelect("hiProviderFilter", uniqueSorted(catalog.map(function (row) { return row.provider; }), "Tutte"), STATE.provider);
    fillSelect("hiThemeFilter", uniqueSorted(catalog.map(function (row) { return row.theme; }).concat(regional.map(function (row) { return row.module_id; })), "Tutte"), STATE.theme);

    var tableSelect = byId("hiTableSelect");
    if (tableSelect) {
      clear(tableSelect);
      TABLE_OPTIONS.forEach(function (item) {
        if (!STATE.payload.tables || !STATE.payload.tables[item.id]) return;
        var option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.label;
        tableSelect.appendChild(option);
      });
      tableSelect.value = STATE.table;
    }
  }

  function bindControls() {
    var bindings = [
      ["hiYearFilter", "year"],
      ["hiRegionFilter", "region"],
      ["hiProviderFilter", "provider"],
      ["hiThemeFilter", "theme"],
      ["hiCompareFilter", "compare"],
      ["hiTableSelect", "table"]
    ];
    bindings.forEach(function (binding) {
      var node = byId(binding[0]);
      if (!node) return;
      node.addEventListener("change", function () {
        STATE[binding[1]] = node.value;
        renderDynamic();
      });
    });

    var search = byId("hiTableSearch");
    if (search) {
      search.addEventListener("input", function () {
        STATE.search = search.value;
        renderExplorer();
      });
    }

    var download = byId("hiDownloadCsv");
    if (download) {
      download.addEventListener("click", downloadCurrentCsv);
    }
  }

  function renderKpis() {
    var counts = STATE.payload.counts || {};
    var items = [
      ["Fonti catalogate", counts.catalog_sources, "enti e portali pubblici", "Base per accesso, ospedali, mobilita, territorio e spesa"],
      ["Link validati", counts.validated_links, counts.data_file_candidates + " candidati dati", counts.report_file_candidates + " documenti di supporto"],
      ["Risorse spesa", counts.health_expenditure_plan, "OpenBDAP/SIOPE", "competenza economica, cassa e piani di download"],
      ["Mapping regionale", counts.regional_mapping_rows, "regione-modulo", "copertura da completare per i profili regionali"],
      ["Moduli analisi", counts.analysis_modules, "aree sanitarie", "granularita nazionale, regionale, aziendale e struttura"],
      ["Output prodotti", counts.output_files, "file pipeline", counts.processed_dataset_files + " dataset processati"],
      ["Qualita dataset", counts.quality_checks - counts.quality_checks_failed + "/" + counts.quality_checks, "check superati", counts.quality_checks_failed + " controlli con dati mancanti"],
      ["Audit progetto", counts.project_checks - counts.project_checks_failed + "/" + counts.project_checks, "check superati", "nessun errore bloccante nel run"]
    ];
    var container = byId("hiKpis");
    clear(container);
    items.forEach(function (item) {
      var card = create("article", "hi-kpi");
      card.appendChild(create("span", "", item[0]));
      card.appendChild(create("strong", "", formatDisplay(item[1])));
      card.appendChild(create("em", "", item[2]));
      card.appendChild(create("small", "", item[3]));
      container.appendChild(card);
    });
  }

  function tableOption(id) {
    for (var i = 0; i < TABLE_OPTIONS.length; i += 1) {
      if (TABLE_OPTIONS[i].id === id) return TABLE_OPTIONS[i];
    }
    return { id: id, label: id, columns: null };
  }

  function topFiltered(tableName, predicate, limit) {
    return rows(tableName).filter(function (row) {
      return rowMatchesGlobalFilters(row) && (!predicate || predicate(row));
    }).slice(0, limit || 80);
  }

  function textIncludes(row, values) {
    var text = rowText(row);
    return values.some(function (value) { return text.indexOf(value) !== -1; });
  }

  function renderMainCharts() {
    plotSummaryBar("hiProviderChart", summary("catalog_by_provider"), 12, true);
    plotSummaryBar("hiThemeChart", summary("catalog_by_theme"), 14, true);
    plotSummaryBar("hiStatusChart", summary("validated_by_status_code"), 8, false);
    plotDonut("hiLinkRoleChart", summary("validated_link_roles"));
  }

  function renderAccess() {
    var accessCatalog = topFiltered("catalog", function (row) {
      return textIncludes(row, ["waiting", "attesa", "prestaz", "pnla", "services"]);
    }, 80);
    var candidates = rows("dataset_registry").filter(function (row) {
      return rowMatchesGlobalFilters(row) && textIncludes(row, ["waiting", "attesa", "prestaz", "pnla", "services"]);
    });
    if (!candidates.length) {
      candidates = worklist("data_candidates").filter(function (row) {
        return rowMatchesGlobalFilters(row) && textIncludes(row, ["waiting", "attesa", "prestaz", "pnla", "services"]);
      });
    }
    var chartData = countRows(accessCatalog, "provider");
    plotSummaryBar("hiAccessChart", chartData.length ? chartData : summary("catalog_by_access_type"), 8, false);
    createTable("hiAccessTable", candidates.length ? candidates : accessCatalog, ["provider", "dataset_name", "theme", "access_type", "download_status", "source_page_url"], 12);
  }

  function renderHospitals() {
    var hospitalRows = rows("validated_links").filter(function (row) {
      return rowMatchesGlobalFilters(row) && textIncludes(row, ["pne", "ospedal", "ricover", "hospital", "esiti", "strutture"]);
    });
    var agenasRows = rows("agenas_links").filter(function (row) {
      return rowMatchesGlobalFilters(row) && textIncludes(row, ["pne", "ospedal", "ricover", "esiti", "strutture"]);
    });
    plotSummaryBar("hiHospitalChart", countRows(hospitalRows.length ? hospitalRows : agenasRows, "source_id"), 8, true);
    createTable("hiHospitalTable", hospitalRows.length ? hospitalRows : agenasRows, ["provider", "source_id", "file_extension", "link_text", "validation_status_code", "final_url", "url"], 14);
  }

  function renderMobility() {
    var mobilityRows = rows("catalog").filter(function (row) {
      return rowMatchesGlobalFilters(row) && textIncludes(row, ["mobilita", "mobility"]);
    });
    var rankingRows = rows("source_ranking").filter(function (row) {
      return rowMatchesGlobalFilters(row) && textIncludes(row, ["mobilita", "mobility"]);
    });
    plotSummaryBar("hiMobilityChart", countRows(mobilityRows.concat(rankingRows), "provider"), 8, false);
    createTable("hiMobilityTable", rankingRows.length ? rankingRows : mobilityRows, ["provider", "dataset_name", "theme", "access_type", "license", "score", "source_page_url"], 12);
  }

  function renderRegionalMatrix() {
    var regional = rows("regional_sources_seed");
    var filtered = regional.filter(function (row) {
      return rowMatchesGlobalFilters(row);
    });
    if (!filtered.length) filtered = regional;
    var regions = uniqueSorted(filtered.map(function (row) { return row.region; }), "").filter(Boolean);
    var modules = uniqueSorted(filtered.map(function (row) { return row.module_id; }), "").filter(Boolean);
    var lookup = {};
    filtered.forEach(function (row) {
      lookup[asText(row.region) + "|" + asText(row.module_id)] = asText(row.status, "ND");
    });
    var z = regions.map(function (region) {
      return modules.map(function (module) {
        return statusValue(lookup[region + "|" + module]);
      });
    });
    var text = regions.map(function (region) {
      return modules.map(function (module) {
        return region + " - " + module + ": " + asText(lookup[region + "|" + module], "ND");
      });
    });
    plot("hiRegionalMatrix", [{
      type: "heatmap",
      x: modules,
      y: regions,
      z: z,
      text: text,
      hovertemplate: "%{text}<extra></extra>",
      colorscale: [
        [0, "#303030"],
        [.5, "#d9ad48"],
        [1, "#3aa6a1"]
      ],
      showscale: false
    }], {
      margin: { t: 18, r: 18, b: 110, l: 122 },
      xaxis: { tickangle: -35 },
      yaxis: { automargin: true }
    });
    renderRegionProfile(filtered, regional);
  }

  function statusValue(value) {
    var text = asText(value, "").toLowerCase();
    if (text.indexOf("mapped") !== -1 || text.indexOf("ok") !== -1) return 2;
    if (text.indexOf("progress") !== -1) return 1;
    return 0;
  }

  function renderRegionProfile(filtered, allRegional) {
    var title = byId("hiRegionProfileTitle");
    var tag = byId("hiRegionProfileTag");
    var container = byId("hiRegionProfile");
    clear(container);
    var selectedRegion = STATE.region === "Tutte" ? "Italia" : STATE.region;
    if (title) title.textContent = "Sanita in " + selectedRegion;
    if (tag) tag.textContent = STATE.compare;

    var regionRows = STATE.region === "Tutte" ? filtered : allRegional.filter(function (row) { return asText(row.region) === STATE.region; });
    var mapped = regionRows.filter(function (row) { return statusValue(row.status) > 0; }).length;
    var items = [
      ["Moduli censiti", regionRows.length, "righe regione-modulo nel piano di mapping"],
      ["Moduli con fonte mappata", mapped, "conteggio basato sullo stato del seed regionale"],
      ["Stato prevalente", dominantValue(regionRows, "status"), "utile per capire la maturita del profilo regionale"],
      ["Prossime aree", topValues(regionRows, "module_id", 5).join(", "), "accesso, strutture, personale, costi e territorio"]
    ];
    items.forEach(function (item) {
      var node = create("div", "hi-profile-item");
      node.appendChild(create("span", "", item[0]));
      node.appendChild(create("strong", "", formatDisplay(item[1])));
      node.appendChild(create("small", "", item[2]));
      container.appendChild(node);
    });
  }

  function renderResources() {
    plotSummaryBar("hiResourceFormatChart", summary("health_resources_by_format"), 12, false);
    plotSummaryBar("hiAccountingChart", summary("health_resources_by_basis"), 12, true);
    createTable("hiResourceTable", worklist("health_expenditure_resources").filter(rowMatchesGlobalFilters), ["provider", "dataset_name", "format", "accounting_basis", "relevance_score", "resource_status", "candidate_url"], 18);
  }

  function renderQuality() {
    plotDonut("hiQualityChart", summary("quality_by_status"));
    plotDonut("hiAuditChart", summary("audit_by_status"));
    var issues = worklist("quality_issues").concat(worklist("audit_issues"));
    createTable("hiIssuesTable", issues, ["check_group", "check_name", "passed", "value", "message", "dataset_path"], 18);
  }

  function renderExplorer() {
    var option = tableOption(STATE.table);
    var data = filteredRows(STATE.table);
    var title = byId("hiTableTitle");
    var count = byId("hiTableCount");
    if (title) title.textContent = option.label;
    if (count) count.textContent = formatNumber(data.length) + " righe";
    createTable("hiTableExplorer", data, option.columns, 250);
  }

  function countRows(tableRows, field) {
    var counts = {};
    toArray(tableRows).forEach(function (row) {
      var value = asText(row[field]);
      counts[value] = (counts[value] || 0) + 1;
    });
    return Object.keys(counts).map(function (key) {
      return { value: key, count: counts[key] };
    }).sort(function (a, b) {
      return b.count - a.count || a.value.localeCompare(b.value, "it");
    });
  }

  function topValues(tableRows, field, limit) {
    return countRows(tableRows, field).slice(0, limit || 5).map(function (row) { return row.value; });
  }

  function dominantValue(tableRows, field) {
    var values = topValues(tableRows, field, 1);
    return values.length ? values[0] : MISSING;
  }

  function csvEscape(value) {
    var text = asText(value, "");
    if (/[",\n\r]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
    return text;
  }

  function downloadCurrentCsv() {
    var option = tableOption(STATE.table);
    var data = filteredRows(STATE.table);
    var columns = option.columns && option.columns.length ? option.columns : inferColumns(data);
    var lines = [columns.map(csvEscape).join(",")];
    data.forEach(function (row) {
      lines.push(columns.map(function (column) { return csvEscape(row[column]); }).join(","));
    });
    var blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sanita-italia-" + STATE.table + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  function renderDynamic() {
    renderAccess();
    renderHospitals();
    renderMobility();
    renderRegionalMatrix();
    renderResources();
    renderExplorer();
  }

  function renderAll() {
    setupFilters();
    renderKpis();
    renderMainCharts();
    renderDynamic();
    renderQuality();
  }

  function fetchJson(url) {
    return fetch(url, { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    });
  }

  function loadPayload(index) {
    index = index || 0;
    if (index >= DATA_SOURCES.length) {
      setStatus("Dati non disponibili. La dashboard resta pronta e si aggiornera quando il payload sara pubblicato.", "error");
      return;
    }
    fetchJson(DATA_SOURCES[index]).then(function (payload) {
      STATE.payload = payload;
      var generated = payload.meta && payload.meta.generated_at ? payload.meta.generated_at.replace("T", " ").replace("+00:00", " UTC") : "";
      setStatus("Dati caricati: " + generated);
      renderAll();
    }).catch(function () {
      loadPayload(index + 1);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindControls();
    loadPayload(0);
  });
})();
