(function () {
  "use strict";

  var DATA_URL = "../../data/bilancio-pubblico/dashboard.json?v=20260703-cofog-detail";
  var MISSING_VALUE = "ND";
  var STATE = {
    payload: null,
    peerMetric: "tax_pressure",
    peerCountries: null,
    spendingDetailFunction: "GF01",
    regionalYear: null,
    regionalRegion: null,
    yearWindows: {}
  };

  var COLORS = [
    "#ff5a1f", "#4e79a7", "#59a14f", "#f28e2b", "#76b7b2",
    "#e15759", "#edc948", "#b07aa1", "#9c755f", "#bab0ac"
  ];

  var PEER_METRICS = {
    tax_pressure: { label: "Pressione fiscale", unit: "% PIL", year: "tax_year" },
    public_spending: { label: "Spesa pubblica", unit: "% PIL", year: "spending_year" },
    social_spending: { label: "Spesa sociale", unit: "% PIL", year: "social_year" }
  };

  var SERIES_WINDOW_OPTIONS = [
    { id: "all", label: "Tutti gli anni", years: null },
    { id: "20", label: "Ultimi 20 anni", years: 20 },
    { id: "10", label: "Ultimi 10 anni", years: 10 },
    { id: "5", label: "Ultimi 5 anni", years: 5 }
  ];

  var PLOT_CONFIG = {
    responsive: true,
    displayModeBar: false,
    scrollZoom: false,
    doubleClick: false,
    showTips: false
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function asText(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback || MISSING_VALUE;
    return String(value);
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function formatPlain(value, digits) {
    var n = toNumber(value);
    if (n === null) return MISSING_VALUE;
    return n.toLocaleString("it-IT", {
      maximumFractionDigits: Number.isFinite(digits) ? digits : 0,
      minimumFractionDigits: 0
    });
  }

  function formatDecimal(value, digits) {
    var n = toNumber(value);
    if (n === null) return MISSING_VALUE;
    digits = Number.isFinite(digits) ? digits : 1;
    return n.toLocaleString("it-IT", {
      maximumFractionDigits: digits,
      minimumFractionDigits: 0
    });
  }

  function formatPercent(value, digits) {
    var n = toNumber(value);
    if (n === null) return MISSING_VALUE;
    return formatDecimal(n, Number.isFinite(digits) ? digits : 1) + "%";
  }

  function formatMld(value, digits) {
    var n = toNumber(value);
    if (n === null) return MISSING_VALUE;
    digits = Number.isFinite(digits) ? digits : 1;
    return n.toLocaleString("it-IT", {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits
    }) + " miliardi di euro";
  }

  function niceLabel(value) {
    return asText(value)
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function compactLabel(value, maxLength) {
    var text = asText(value);
    maxLength = maxLength || 48;
    if (text.length <= maxLength) return text;
    return text.slice(0, Math.max(0, maxLength - 3)).trim() + "...";
  }

  function isMobileViewport() {
    return window.matchMedia && window.matchMedia("(max-width: 760px)").matches;
  }

  function clear(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function showEmptyChart(id, message) {
    var node = byId(id);
    if (!node) return;
    if (window.Plotly) {
      try { window.Plotly.purge(node); } catch (error) {}
    }
    node.innerHTML = "";
    var empty = document.createElement("div");
    empty.className = "bp-empty-chart";
    empty.textContent = message || "Nessun dato disponibile";
    node.appendChild(empty);
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
      margin: { t: 24, r: 22, b: 54, l: 62 },
      hoverlabel: {
        bgcolor: panel,
        bordercolor: line,
        font: { color: text }
      },
      legend: {
        orientation: "h",
        x: 0,
        xanchor: "left",
        y: -0.2,
        font: { color: muted }
      },
      dragmode: false,
      xaxis: {
        fixedrange: true,
        gridcolor: line,
        zerolinecolor: line,
        tickfont: { color: muted },
        titlefont: { color: muted },
        automargin: true
      },
      yaxis: {
        fixedrange: true,
        gridcolor: line,
        zerolinecolor: line,
        tickfont: { color: muted },
        titlefont: { color: muted },
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
    window.Plotly.react(node, traces, baseLayout(layout), PLOT_CONFIG).catch(function () {
      showEmptyChart(id, "Errore nella costruzione del grafico");
    });
  }

  function createTableRows(tbody, rows, columns) {
    clear(tbody);
    if (!tbody) return;
    rows = toArray(rows);
    if (!rows.length) {
      var emptyRow = document.createElement("tr");
      var emptyCell = document.createElement("td");
      emptyCell.colSpan = Math.max(1, columns.length);
      emptyCell.textContent = "Nessun dato disponibile";
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
      return;
    }
    rows.forEach(function (row, rowIndex) {
      var tr = document.createElement("tr");
      columns.forEach(function (column) {
        var td = document.createElement("td");
        if (column.className) td.className = column.className;
        td.textContent = column.value(row, rowIndex);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  function firstRows(payload, keys) {
    for (var i = 0; i < keys.length; i++) {
      var rows = toArray(payload[keys[i]]);
      if (rows.length) return rows;
    }
    return [];
  }

  function byValueDesc(rows, key) {
    return toArray(rows).slice().sort(function (a, b) {
      return (toNumber(b[key]) || 0) - (toNumber(a[key]) || 0);
    });
  }

  function uniqueSorted(values, descending) {
    var seen = {};
    var out = [];
    toArray(values).forEach(function (value) {
      if (value === null || value === undefined || value === "") return;
      var key = String(value);
      if (seen[key]) return;
      seen[key] = true;
      out.push(value);
    });
    out.sort(function (a, b) {
      var an = toNumber(a);
      var bn = toNumber(b);
      if (an !== null && bn !== null) return descending ? bn - an : an - bn;
      return descending
        ? String(b).localeCompare(String(a), "it")
        : String(a).localeCompare(String(b), "it");
    });
    return out;
  }

  function setSelectOptions(select, values, current, labelFormatter) {
    if (!select) return current || null;
    clear(select);
    values = toArray(values);
    if (!values.length) return null;
    values.forEach(function (value) {
      var option = document.createElement("option");
      option.value = String(value);
      option.textContent = labelFormatter ? labelFormatter(value) : String(value);
      select.appendChild(option);
    });
    var selected = current !== null && current !== undefined ? String(current) : String(values[0]);
    var allowed = values.map(function (value) { return String(value); });
    if (allowed.indexOf(selected) < 0) selected = String(values[0]);
    select.value = selected;
    return selected;
  }

  function regionalRowRegion(row) {
    return row && row.regione ? String(row.regione) : "";
  }

  function regionalRowMatches(row, region, year) {
    return regionalRowRegion(row) === region && toNumber(row.anno) === year;
  }

  function findRegionalValue(rows, region, year) {
    var row = toArray(rows).find(function (item) {
      return regionalRowMatches(item, region, year);
    });
    return row ? toNumber(row.mld) : null;
  }

  function formatRegionalMld(value) {
    var n = toNumber(value);
    if (n === null) return MISSING_VALUE;
    return formatMld(n, Math.abs(n) < 1 ? 3 : 2);
  }

  function regionalAvailableRegions(block, year) {
    var denominatorRows = toArray(block && block.regional_denominators);
    var denominatorsByYear = uniqueSorted(
      denominatorRows
        .filter(function (row) {
          return row && row.regione && (year === null || year === undefined || toNumber(row.anno) === year);
        })
        .map(function (row) { return String(row.regione); }),
      false
    );
    if (denominatorsByYear.length) return denominatorsByYear;

    var denominators = uniqueSorted(
      denominatorRows
        .filter(function (row) { return row && row.regione; })
        .map(function (row) { return String(row.regione); }),
      false
    );
    if (denominators.length) return denominators;

    return uniqueSorted(
      toArray(block && block.spending_by_region)
        .concat(toArray(block && block.revenue_by_region))
        .concat(toArray(block && block.balances_by_region))
        .filter(function (row) {
          return (year === null || year === undefined || toNumber(row.anno) === year) && regionalRowRegion(row);
        })
        .map(regionalRowRegion),
      false
    );
  }

  function availableYearsFromRows(rows, key) {
    key = key || "year";
    return uniqueSorted(toArray(rows).map(function (row) { return toNumber(row[key]); }), false);
  }

  function selectedYearWindow(chartId) {
    return STATE.yearWindows[chartId] || "all";
  }

  function yearWindowStart(chartId, years) {
    var selected = SERIES_WINDOW_OPTIONS.find(function (item) {
      return item.id === selectedYearWindow(chartId);
    });
    if (!selected || !selected.years || !years.length) return null;
    var maxYear = Math.max.apply(null, years);
    return maxYear - selected.years + 1;
  }

  function filterRowsByYearWindow(chartId, rows, key) {
    key = key || "year";
    var years = availableYearsFromRows(rows, key);
    var start = yearWindowStart(chartId, years);
    ensureYearWindowControl(chartId, years);
    if (start === null) return rows;
    return toArray(rows).filter(function (row) {
      var year = toNumber(row[key]);
      return year !== null && year >= start;
    });
  }

  function filterPointsByYearWindow(chartId, points) {
    var years = availableYearsFromRows(points, "year");
    var start = yearWindowStart(chartId, years);
    ensureYearWindowControl(chartId, years);
    if (start === null) return points;
    return toArray(points).filter(function (point) {
      var year = toNumber(point.year);
      return year !== null && year >= start;
    });
  }

  function ensureYearWindowControl(chartId, years) {
    var chart = byId(chartId);
    if (!chart) return;
    var card = chart.closest ? chart.closest(".bp-card") : null;
    if (!card) return;
    var controlId = chartId + "YearWindow";
    var existing = byId(controlId);
    if (!existing) {
      var row = document.createElement("div");
      row.className = "bp-inline-controls bp-series-controls";

      var label = document.createElement("label");
      label.className = "bp-filter-label";
      label.setAttribute("for", controlId);
      label.textContent = "Periodo";

      var select = document.createElement("select");
      select.id = controlId;
      select.className = "bp-select bp-select-small";
      select.addEventListener("change", function () {
        STATE.yearWindows[chartId] = select.value;
        if (STATE.payload) renderAll(STATE.payload);
      });

      label.appendChild(select);
      row.appendChild(label);

      var wrap = chart.closest ? chart.closest(".bp-chart-wrap") : null;
      if (wrap && wrap.parentNode) {
        wrap.parentNode.insertBefore(row, wrap);
      } else {
        card.appendChild(row);
      }
      existing = select;
    }

    var current = selectedYearWindow(chartId);
    clear(existing);
    SERIES_WINDOW_OPTIONS.forEach(function (option) {
      var item = document.createElement("option");
      item.value = option.id;
      item.textContent = option.label;
      item.disabled = option.years !== null && years.length > 0 && years.length < option.years;
      existing.appendChild(item);
    });
    if (!Array.prototype.some.call(existing.options, function (option) {
      return option.value === current && !option.disabled;
    })) {
      current = "all";
      STATE.yearWindows[chartId] = current;
    }
    existing.value = current;
  }

  function renderKpis(payload) {
    var container = byId("bpKpis");
    if (!container) return;
    clear(container);
    toArray(payload.kpis).forEach(function (item) {
      var card = document.createElement("article");
      card.className = "kpi";

      var label = document.createElement("span");
      label.textContent = asText(item.label || item.id);

      var value = document.createElement("strong");
      var unit = asText(item.unit, "");
      value.textContent = unit.indexOf("%") >= 0
        ? formatDecimal(item.value, 1) + " " + unit
        : formatMld(item.value_mld !== undefined ? item.value_mld : item.value, 1);

      var detail = document.createElement("span");
      detail.textContent = [
        item.year ? "Anno " + item.year : null,
        item.value_mld ? formatMld(item.value_mld, 1) : null
      ].filter(Boolean).join(" - ");

      card.appendChild(label);
      card.appendChild(value);
      if (detail.textContent) card.appendChild(detail);
      container.appendChild(card);
    });
  }

  function renderMeta(payload) {
    var status = byId("bpStatus");
    var sourceMeta = byId("bpSourceMeta");
    var notes = byId("bpMethodNotes");

    if (status) status.textContent = "Dati caricati dalle elaborazioni del repository Bilancio_pubblico.";
    if (sourceMeta) sourceMeta.textContent = "Fonti ufficiali elaborate nel repository Bilancio_pubblico.";

    if (!notes) return;
    clear(notes);
    [
      "Repository di elaborazione: NazarenoLecis/Bilancio_pubblico.",
      "Entrate e uscite sono in miliardi di euro quando non indicato diversamente.",
      "Pressione fiscale e contributiva: entrate da imposte e contributi sociali rapportate al PIL.",
      "Contributi sociali netti: classificazione Eurostat dei conti nazionali; non indica contributi al netto delle prestazioni sociali pagate.",
      "COFOG: classificazione internazionale delle funzioni della spesa pubblica, usata da Eurostat per rendere confrontabili i paesi. Il secondo livello COFOG mostra cosa compone le macro voci.",
      "OpenBDAP e Eurostat COFOG hanno perimetri diversi: OpenBDAP serve per il dettaglio dei rendiconti regionali, Eurostat COFOG per i confronti armonizzati per funzione.",
      "Le metriche euro pro capite ed euro per kmq sono normalizzazioni derivate; il dato originale OpenBDAP resta espresso in euro o miliardi di euro.",
      "L'imposta su successioni e donazioni aggrega trasferimenti patrimoniali per causa di morte e trasferimenti gratuiti tra vivi.",
      "Distribuzione IRPEF: contribuenti e imposta netta sono aggregati per fascia di reddito dichiarato.",
      payload.meta && payload.meta.manifest_rows ? "Serie e tavole sorgente censite nell'elaborazione: " + payload.meta.manifest_rows + "." : null
    ].filter(Boolean).forEach(function (text) {
      var li = document.createElement("li");
      li.textContent = text;
      notes.appendChild(li);
    });
    toArray(payload.meta && payload.meta.sources).filter(function (source) {
      return !(typeof source === "string" && source.toLowerCase().indexOf("siope") >= 0);
    }).slice(0, 5).forEach(function (source) {
      var li = document.createElement("li");
      li.textContent = source;
      notes.appendChild(li);
    });
  }

  function formatDate(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return asText(value);
    return date.toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function renderTopTaxes(payload) {
    var rows = byValueDesc(firstRows(payload, ["top_taxes_2025", "top_taxes", "main_taxes_2025"]), "value_mld")
      .slice(0, 10)
      .reverse();
    if (!rows.length) {
      showEmptyChart("bpTopTaxes", "Nessuna entrata principale disponibile");
      return;
    }
    plot("bpTopTaxes", [{
      type: "bar",
      orientation: "h",
      x: rows.map(function (row) { return toNumber(row.value_mld || row.value); }),
      y: rows.map(function (row) { return asText(row.label || row.code); }),
      marker: {
        color: rows.map(function (row, index) {
          return row.code === "IRPEF" ? cssVar("--orange", COLORS[0]) : COLORS[(index + 1) % COLORS.length];
        })
      },
      text: rows.map(function (row) { return formatMld(row.value_mld || row.value, 1); }),
      textposition: "auto",
      hovertemplate: "%{y}<br>%{x:.1f} miliardi di euro<extra></extra>"
    }], {
      margin: { t: 18, r: 24, b: 44, l: 132 },
      xaxis: { title: "Miliardi di euro" },
      yaxis: { title: "" },
      showlegend: false
    });
  }

  function lineSeriesFromRows(rows, keys, options) {
    options = options || {};
    return keys.map(function (key, index) {
      return {
        type: "scatter",
        mode: "lines+markers",
        name: options.labels && options.labels[key] ? options.labels[key] : niceLabel(key),
        x: rows.map(function (row) { return toNumber(row.year); }),
        y: rows.map(function (row) { return toNumber(row[key]); }),
        line: {
          color: index === 0 ? cssVar("--orange", COLORS[0]) : COLORS[index % COLORS.length],
          width: index === 0 ? 3 : 2
        },
        marker: { size: index === 0 ? 6 : 5 },
        hovertemplate: "%{x}<br>%{fullData.name}: %{y:.1f}" + (options.suffix || "") + "<extra></extra>"
      };
    });
  }

  function renderTaxTrend(payload) {
    var rows = firstRows(payload, ["pressureTrend", "tax_pressure_trend", "pressure_trend", "fiscal_trend"]);
    rows = toArray(rows).filter(function (row) { return toNumber(row.year) !== null; });
    rows = filterRowsByYearWindow("bpTaxTrend", rows, "year");
    if (!rows.length) {
      showEmptyChart("bpTaxTrend", "Nessuna serie sulla pressione fiscale disponibile");
      return;
    }
    plot("bpTaxTrend", lineSeriesFromRows(rows, ["value"], {
      labels: { value: "Totale" },
      suffix: "%"
    }), {
      yaxis: { title: "% PIL", ticksuffix: "%" },
      xaxis: { title: "" }
    });
  }

  function taxComponentLabel(key) {
    var labels = {
      "produzione e importazioni": "Imposte su produzione e importazioni",
      "reddito": "Imposte su reddito",
      "patrimonio": "Imposte su patrimonio",
      "imposte su reddito": "Imposte su reddito",
      "imposte su patrimonio": "Imposte su patrimonio",
      "reddito e patrimonio": "Imposte su reddito e patrimonio",
      "imposte su produzione e importazioni": "Imposte su produzione e importazioni",
      "imposte su reddito e patrimonio": "Imposte su reddito e patrimonio",
      "contributi sociali netti": "Contributi sociali netti",
      "imposte in conto capitale": "Imposte in conto capitale"
    };
    return labels[String(key).toLowerCase()] || niceLabel(key);
  }

  function normalizeTaxComponentKey(key) {
    var value = String(key || "").toLowerCase().trim();
    var map = {
      "produzione e importazioni": "imposte su produzione e importazioni",
      "imposte su produzione e importazioni": "imposte su produzione e importazioni",
      "reddito": "imposte su reddito",
      "imposte su reddito": "imposte su reddito",
      "patrimonio": "imposte su patrimonio",
      "imposte su patrimonio": "imposte su patrimonio",
      "reddito e patrimonio": "imposte su reddito e patrimonio",
      "imposte su reddito e patrimonio": "imposte su reddito e patrimonio",
      "contributi sociali netti": "contributi sociali netti",
      "imposte in conto capitale": "imposte in conto capitale"
    };
    return map[value] || null;
  }

  function hasSplitIncomeCapitalComponents(rows) {
    return rows.some(function (row) {
      return toNumber(row["imposte su reddito"]) !== null
        || toNumber(row["reddito"]) !== null
        || toNumber(row["imposte su patrimonio"]) !== null
        || toNumber(row["patrimonio"]) !== null;
    });
  }

  function taxComponentRows(rows) {
    var useSplitComponents = hasSplitIncomeCapitalComponents(rows);
    return rows.map(function (row) {
      var next = {};
      Object.keys(row).forEach(function (key) {
        if (key !== "year" && key !== "value") {
          var normalized = normalizeTaxComponentKey(key);
          if (normalized === "imposte su reddito e patrimonio") {
            return;
          }
          if (!normalized) return;
          var value = toNumber(row[key]);
          if (value === null) return;
          next[normalized] = value;
        }
      });
      if (useSplitComponents) {
        if (toNumber(next["imposte su reddito"]) === null) {
          next["imposte su reddito"] = toNumber(row["reddito"]) || toNumber(row["imposte su reddito"]);
        }
        if (toNumber(next["imposte su patrimonio"]) === null) {
          next["imposte su patrimonio"] = toNumber(row["patrimonio"]) || toNumber(row["imposte su patrimonio"]);
        }
      }
      next.year = row.year;
      next.value = row.value;
      return next;
    });
  }

  function renderTaxCompositionTrend(payload) {
    var rows = firstRows(payload, ["pressure_components", "tax_pressure_trend", "pressureTrend", "pressure_trend", "fiscal_trend"]);
    var note = byId("bpTaxCompositionNote");
    rows = toArray(rows).filter(function (row) { return toNumber(row.year) !== null; });
    rows = filterRowsByYearWindow("bpTaxCompositionTrend", rows, "year");
    if (!rows.length) {
      showEmptyChart("bpTaxCompositionTrend", "Nessuna componente della pressione fiscale disponibile");
      if (note) {
        note.style.display = "none";
      }
      return;
    }
    var hasSplit = hasSplitIncomeCapitalComponents(rows);
    if (note) {
      if (hasSplit) {
        note.style.display = "none";
      } else {
        note.style.display = "block";
        note.textContent = "Nota metodologica: la separazione tra imposte su reddito e patrimonio è applicata solo se il dataset upstream espone entrambe le serie in modo esplicito. Nel file corrente è disponibile solo la voce aggregata \"imposte su reddito e patrimonio\", quindi non viene mostrata separata.";
      }
    }
    rows = taxComponentRows(rows);
    var keys = [];
    var keySet = {};
    rows.forEach(function (row) {
      Object.keys(row).forEach(function (key) {
        if (key === "year" || key === "value" || keySet[key]) return;
        if (toNumber(row[key]) === null) return;
        keySet[key] = true;
        keys.push(key);
      });
    });
    if (!keys.length) {
      showEmptyChart("bpTaxCompositionTrend", "Componenti non disponibili nel dataset caricato");
      return;
    }
    plot("bpTaxCompositionTrend", keys.map(function (key, index) {
      return {
        type: "scatter",
        mode: "lines",
        name: taxComponentLabel(key),
        x: rows.map(function (row) { return toNumber(row.year); }),
        y: rows.map(function (row) { return toNumber(row[key]); }),
        line: { color: COLORS[index % COLORS.length], width: 1.5 },
        hovertemplate: "%{x}<br>%{fullData.name}: %{y:.2f}% PIL<extra></extra>"
      };
    }), {
      yaxis: { title: "% PIL", ticksuffix: "%" },
      xaxis: { title: "" }
    });
  }

  function renderPie(id, rows, title, tableId) {
    rows = byValueDesc(rows, "value_mld");
    if (!rows.length) {
      showEmptyChart(id, "Nessuna ripartizione disponibile");
      return;
    }
    plot(id, [{
      type: "pie",
      labels: rows.map(function (row) { return asText(row.label || row.code); }),
      values: rows.map(function (row) { return toNumber(row.value_mld || row.value); }),
      hole: .48,
      sort: false,
      textinfo: "label+percent",
      textposition: "inside",
      marker: {
        colors: rows.map(function (row, index) { return COLORS[index % COLORS.length]; }),
        line: { color: cssVar("--panel", "#090909"), width: 1 }
      },
      hovertemplate: "%{label}<br>%{value:.1f} miliardi di euro<br>%{percent}<extra></extra>"
    }], {
      margin: { t: 18, r: 16, b: 18, l: 16 },
      showlegend: true,
      legend: { orientation: "h", y: -0.05 },
      annotations: [{
        text: title,
        showarrow: false,
        font: { color: cssVar("--text", "#f5f2ed"), size: 15, family: "inherit" }
      }]
    });

    createTableRows(byId(tableId), rows, [
      { value: function (row) { return asText(row.label || row.code); } },
      { value: function (row) { return formatMld(row.value_mld || row.value, 1); } },
      { value: function (row) { return formatPercent(row.share_percent, 1); } }
    ]);
  }

  function renderCategoryTrend(id, rows, emptyMessage) {
    rows = byValueDesc(rows, "latest_value_mld").slice(0, 6);
    var allYears = [];
    rows.slice().sort(function (a, b) {
      return asText(a.country || a.label || a.code, "").localeCompare(asText(b.country || b.label || b.code, ""), "it");
    }).forEach(function (row) {
      toArray(row.series).forEach(function (point) {
        var year = toNumber(point.year);
        if (year !== null) allYears.push(year);
      });
    });
    ensureYearWindowControl(id, uniqueSorted(allYears, false));
    var traces = rows.map(function (row, index) {
      var points = toArray(row.series).filter(function (point) {
        return toNumber(point.year) !== null && toNumber(point.value_mld) !== null;
      });
      points = filterPointsByYearWindow(id, points);
      return {
        type: "scatter",
        mode: "lines+markers",
        name: asText(row.label || row.code),
        x: points.map(function (point) { return toNumber(point.year); }),
        y: points.map(function (point) { return toNumber(point.value_mld); }),
        line: { color: COLORS[index % COLORS.length], width: index === 0 ? 3 : 2 },
        marker: { size: 5 },
        hovertemplate: "%{x}<br>%{fullData.name}: %{y:.1f} miliardi di euro<extra></extra>"
      };
    }).filter(function (trace) { return trace.x.length > 1; });

    if (!traces.length) {
      showEmptyChart(id, emptyMessage);
      return;
    }
    plot(id, traces, {
      yaxis: { title: "Miliardi di euro" },
      xaxis: { title: "" }
    });
  }

  function renderIrpef(payload) {
    var declaration = payload.declaration_summary || {};
    var bands = toArray(declaration.bands).length ? toArray(declaration.bands) : toArray(payload.irpef_by_band);
    var shares = {};
    var shareRows = toArray(declaration.share_by_band).length
      ? toArray(declaration.share_by_band)
      : toArray(payload.irpef_share_by_band);
    shareRows.forEach(function (row) {
      shares[row.band] = row;
    });

    var chartRows = bands.map(function (row) {
      var share = shares[row.band] || {};
      return {
        band: asText(row.band),
        contributorsShare: toNumber(share.contributors_share),
        taxShare: toNumber(share.tax_share)
      };
    }).filter(function (row) {
      return row.contributorsShare !== null || row.taxShare !== null;
    });

    if (chartRows.length) {
      plot("bpIrpefBandChart", [
        {
          type: "bar",
          orientation: "h",
          name: "Quota contribuenti",
          x: chartRows.map(function (row) { return row.contributorsShare; }),
          y: chartRows.map(function (row) { return row.band; }),
          marker: { color: COLORS[1] },
          hovertemplate: "%{y}<br>Contribuenti: %{x:.1f}%<extra></extra>"
        },
        {
          type: "bar",
          orientation: "h",
          name: "Quota IRPEF",
          x: chartRows.map(function (row) { return row.taxShare; }),
          y: chartRows.map(function (row) { return row.band; }),
          marker: { color: cssVar("--orange", COLORS[0]) },
          hovertemplate: "%{y}<br>IRPEF: %{x:.1f}%<extra></extra>"
        }
      ], {
        barmode: "group",
        margin: { t: 20, r: 20, b: 48, l: 112 },
        xaxis: { title: "Quota percentuale", ticksuffix: "%" },
        yaxis: { autorange: "reversed", title: "" }
      });
    } else {
      showEmptyChart("bpIrpefBandChart", "Nessun dato IRPEF disponibile");
    }

    createTableRows(byId("bpIrpefBandTable"), bands, [
      { value: function (row) { return asText(row.band); } },
      { value: function (row) { return formatPlain(row.contributors, 0); } },
      { value: function (row) { return formatPercent(shares[row.band] && shares[row.band].contributors_share, 1); } },
      { value: function (row) { return formatMld(row.tax_mld || row.value_mld, 1); } },
      { value: function (row) { return formatPercent(shares[row.band] && shares[row.band].tax_share, 1); } }
    ]);
  }

  function renderTaxTypeTrend(payload) {
    var rows = toArray(payload.tax_revenue_by_type).filter(function (row) {
      return toNumber(row.year) !== null;
    });
    rows = filterRowsByYearWindow("bpTaxTypeTrend", rows, "year");
    if (!rows.length) {
      showEmptyChart("bpTaxTypeTrend", "Nessuna serie dirette/indirette disponibile");
      return;
    }
    var keys = Object.keys(rows[0]).filter(function (key) {
      return key !== "year" && rows.some(function (row) { return toNumber(row[key]) !== null; });
    }).slice(0, 6);
    plot("bpTaxTypeTrend", lineSeriesFromRows(rows, keys, { suffix: " miliardi di euro" }), {
      yaxis: { title: "Miliardi di euro" },
      xaxis: { title: "" }
    });
  }

  function renderRevenueFocus(payload) {
    var sourceRows = toArray(payload.all_revenue_lines).length ? toArray(payload.all_revenue_lines) : toArray(payload.revenue_items);
    var rows = sourceRows.slice().sort(function (a, b) {
      var av = toNumber(a.latest_value_mld !== undefined ? a.latest_value_mld : a.value);
      var bv = toNumber(b.latest_value_mld !== undefined ? b.latest_value_mld : b.value);
      return (bv || 0) - (av || 0);
    });
    createTableRows(byId("bpRevenueFocusRows"), rows, [
      { value: function (row) { return asText(row.label || row.code); } },
      { value: function (row) { return asText(row.group || MISSING_VALUE); }, className: "is-muted" },
      {
        value: function (row) {
          var value = row.latest_value_mld !== undefined ? row.latest_value_mld : (row.value || row.value_mld);
          return row.status ? MISSING_VALUE : formatMld(value, 3);
        }
      },
      { value: function (row) { return asText(row.source); }, className: "is-muted" },
      { value: function (row) { return asText(row.latest_year || row.year); } }
    ]);
  }

  function revenueEntryValue(row) {
    if (!row) return null;
    if (row.value_mld !== undefined) return toNumber(row.value_mld);
    if (row.latest_value_mld !== undefined) return toNumber(row.latest_value_mld);
    return toNumber(row.value);
  }

  function revenueEntryYear(row, fallback) {
    return row && (row.latest_year || row.year) ? (row.latest_year || row.year) : fallback;
  }

  function under500Key(row) {
    return [
      asText(row && (row.code || row.label), ""),
      asText(row && row.source, ""),
      asText(row && (row.year || row.latest_year), "")
    ].join("|").toLowerCase();
  }

  function collectUnder500Entries(payload, block) {
    var threshold = toNumber(block && block.threshold_mld) || 0.5;
    var entriesByKey = {};

    function addEntry(row, fallbackYear) {
      var value = revenueEntryValue(row);
      if (!row || value === null || value <= 0 || value >= threshold || row.status) return;
      var normalized = Object.assign({}, row, {
        year: revenueEntryYear(row, fallbackYear),
        value_mld: value
      });
      entriesByKey[under500Key(normalized)] = normalized;
    }

    toArray(block && block.entries).forEach(function (row) {
      addEntry(row, block && block.year);
    });
    toArray(payload.all_revenue_lines).forEach(function (row) {
      addEntry(row, block && block.year);
    });
    if (!Object.keys(entriesByKey).length) {
      toArray(payload.revenue_items).forEach(function (row) {
        addEntry(row, block && block.year);
      });
    }

    return Object.keys(entriesByKey).map(function (key) {
      return entriesByKey[key];
    }).sort(function (a, b) {
      return (revenueEntryValue(b) || 0) - (revenueEntryValue(a) || 0);
    });
  }

  function renderUnder500(payload) {
    var block = payload.under_500m_revenue_summary || {};
    var entries = collectUnder500Entries(payload, block);

    if (entries.length) {
      var chartRows = entries.slice(0, 24);
      var mobile = isMobileViewport();
      var values = chartRows.map(function (row) { return revenueEntryValue(row); });
      var yValues = chartRows.map(function (row, index) { return index; });
      var yLabels = chartRows.map(function (row) {
        return compactLabel(row.label || row.code, mobile ? 25 : 58);
      });
      var valueTexts = chartRows.map(function (row) {
        return formatMld(revenueEntryValue(row), 2);
      });
      var numericValues = values.filter(function (value) { return value !== null; });
      var maxValue = numericValues.length ? Math.max.apply(null, numericValues) : 1;
      plot("bpUnder500Chart", [
        {
          type: "bar",
          orientation: "h",
          name: "Miliardi di euro",
          x: values,
          y: yValues,
          marker: { color: cssVar("--orange", COLORS[0]) },
          text: mobile ? [] : valueTexts,
          textposition: mobile ? "none" : "outside",
          cliponaxis: false,
          customdata: chartRows.map(function (row) { return asText(row.label || row.code); }),
          hovertemplate: "%{customdata}<br>Miliardi di euro: %{x:.3f}<extra></extra>"
        }
      ], {
        margin: { t: 20, r: mobile ? 24 : 72, b: 58, l: mobile ? 128 : 290 },
        xaxis: {
          title: "Miliardi di euro",
          range: [0, maxValue * (mobile ? 1.25 : 1.15)],
          rangemode: "tozero"
        },
        yaxis: {
          title: "",
          range: [chartRows.length - 0.5, -0.5],
          tickmode: "array",
          tickvals: yValues,
          ticktext: yLabels,
          showgrid: false
        },
        showlegend: false
      });
    } else {
      showEmptyChart("bpUnder500Chart", "Nessuna voce sotto 500 milioni disponibile");
    }

    createTableRows(byId("bpUnder500Rows"), entries, [
      { value: function (row) { return asText(row.label || row.code); } },
      { value: function (row) { return asText(revenueEntryYear(row, block.year)); } },
      { value: function (row) { return formatMld(revenueEntryValue(row), 2); } },
      { value: function (row) { return formatPercent(row.share_of_total_percent || row.share_percent, 2); } }
    ]);

    var meta = byId("bpUnder500Meta");
    if (!meta) return;
    if (entries.length) {
      var total = entries.reduce(function (sum, row) {
        return sum + (revenueEntryValue(row) || 0);
      }, 0);
      var shareText = toNumber(block.under_500_share_of_total_percent) !== null && toArray(block.entries).length === entries.length
        ? " (" + formatPercent(block.under_500_share_of_total_percent, 2) + " del totale)"
        : "";
      meta.textContent = "Voci sotto 500 milioni nel dataset caricato: " + entries.length +
        ". Totale: " + formatMld(total, 2) + shareText + ".";
    } else {
      meta.textContent = asText(block.note, "Nessuna voce sotto soglia nell'elaborazione corrente.");
    }
  }

  function renderRevenueGaps(payload) {
    createTableRows(byId("bpRevenueGapRows"), toArray(payload.known_revenue_gaps), [
      { value: function (row) { return asText(row.label || row.code); } },
      { value: function (row) { return niceLabel(row.status); } },
      { value: function (row) { return asText(row.mapped_to); } },
      { value: function (row) { return asText(row.note); }, className: "is-muted" }
    ]);
  }

  function renderSpendingFocus(payload) {
    var rows = byValueDesc(toArray(payload.spending_focus).filter(function (row) {
      return toNumber(row.value || row.value_mld) !== null ||
        toNumber(row.value_pil_percent) !== null ||
        toNumber(row.share_spesa_totale) !== null;
    }), "value");
    createTableRows(byId("bpSpendingFocusRows"), rows, [
      { value: function (row) { return asText(row.label || row.code); } },
      { value: function (row) { return formatMld(row.value || row.value_mld, 1); } },
      { value: function (row) { return formatPercent(row.value_pil_percent, 1); } },
      { value: function (row) { return formatPercent(row.share_spesa_totale, 1); } },
      { value: function (row) { return asText(row.source); }, className: "is-muted" },
      { value: function (row) { return asText(row.year || row.year_to); } }
    ]);
  }

  function spendingDetailParents(rows) {
    var byCode = {};
    toArray(rows).forEach(function (row) {
      var parentCode = asText(row.parent_code, "");
      if (!parentCode) return;
      if (!byCode[parentCode]) {
        byCode[parentCode] = {
          code: parentCode,
          label: asText(row.parent_label || parentCode),
          total: 0
        };
      }
      byCode[parentCode].total += toNumber(row.latest_value_mld) || 0;
    });
    return Object.keys(byCode).map(function (code) {
      return byCode[code];
    }).sort(function (a, b) {
      return a.code.localeCompare(b.code, "it");
    });
  }

  function renderSpendingFunctionDetail(payload) {
    var rows = toArray(payload.spending_function_detail_series).filter(function (row) {
      return row.parent_code && toArray(row.series).some(function (point) {
        return toNumber(point.year) !== null && toNumber(point.value_pil) !== null;
      });
    });
    var select = byId("bpSpendingDetailFunction");
    var tbody = byId("bpSpendingDetailRows");
    var parents = spendingDetailParents(rows);

    if (!rows.length || !parents.length) {
      showEmptyChart("bpSpendingDetailTrend", "Dettaglio COFOG non disponibile nel dataset caricato");
      createTableRows(tbody, [], [
        { value: function (row) { return row.label; } },
        { value: function (row) { return formatMld(row.latest_value_mld, 1); } },
        { value: function (row) { return formatPercent(row.latest_value_pil, 2); } },
        { value: function (row) { return formatPercent(row.latest_share_parent_percent, 1); } }
      ]);
      return;
    }

    if (select) {
      clear(select);
      parents.forEach(function (parent) {
        var option = document.createElement("option");
        option.value = parent.code;
        option.textContent = parent.label;
        select.appendChild(option);
      });
      if (!parents.some(function (parent) { return parent.code === STATE.spendingDetailFunction; })) {
        STATE.spendingDetailFunction = parents.some(function (parent) { return parent.code === "GF01"; })
          ? "GF01"
          : parents[0].code;
      }
      select.value = STATE.spendingDetailFunction;
    }

    var selectedRows = rows.filter(function (row) {
      return row.parent_code === STATE.spendingDetailFunction;
    }).sort(function (a, b) {
      return (toNumber(b.latest_value_pil) || 0) - (toNumber(a.latest_value_pil) || 0);
    });

    var allYears = [];
    selectedRows.forEach(function (row) {
      toArray(row.series).forEach(function (point) {
        var year = toNumber(point.year);
        if (year !== null) allYears.push(year);
      });
    });
    ensureYearWindowControl("bpSpendingDetailTrend", uniqueSorted(allYears, false));

    var traces = selectedRows.map(function (row, index) {
      var points = toArray(row.series).filter(function (point) {
        return toNumber(point.year) !== null && toNumber(point.value_pil) !== null;
      });
      points = filterPointsByYearWindow("bpSpendingDetailTrend", points);
      return {
        type: "scatter",
        mode: "lines",
        name: asText(row.label || row.code),
        x: points.map(function (point) { return toNumber(point.year); }),
        y: points.map(function (point) { return toNumber(point.value_pil); }),
        line: { color: COLORS[index % COLORS.length], width: 1.4 },
        hovertemplate: "%{x}<br>%{fullData.name}: %{y:.2f}% PIL<extra></extra>"
      };
    }).filter(function (trace) {
      return trace.x.length > 1;
    });

    if (traces.length) {
      plot("bpSpendingDetailTrend", traces, {
        yaxis: { title: "% del PIL", ticksuffix: "%" },
        xaxis: { title: "" },
        margin: { t: 20, r: 22, b: 58, l: 70 }
      });
    } else {
      showEmptyChart("bpSpendingDetailTrend", "Nessuna serie disponibile per la macro voce selezionata");
    }

    createTableRows(tbody, selectedRows, [
      { value: function (row) { return asText(row.label || row.code); } },
      { value: function (row) { return formatMld(row.latest_value_mld, 2); } },
      { value: function (row) { return formatPercent(row.latest_value_pil, 2); } },
      { value: function (row) { return formatPercent(row.latest_share_parent_percent, 1); } }
    ]);
  }

  function renderRegionalSummary(items) {
    var container = byId("bpRegionalSummary");
    if (!container) return;
    clear(container);
    toArray(items).forEach(function (item) {
      var box = document.createElement("div");

      var label = document.createElement("span");
      label.textContent = item.label;

      var value = document.createElement("strong");
      value.textContent = item.value;

      var detail = document.createElement("small");
      detail.textContent = item.detail || "";

      box.appendChild(label);
      box.appendChild(value);
      if (detail.textContent) box.appendChild(detail);
      container.appendChild(box);
    });
  }

  function renderRegionalBudgets(payload) {
    var block = payload.regional_budgets || {};
    var missionRows = toArray(block.spending_by_mission).filter(function (row) {
      return regionalRowRegion(row) && row.missione && toNumber(row.mld) !== null;
    });
    var spendingRows = toArray(block.spending_by_region).filter(function (row) {
      return regionalRowRegion(row) && toNumber(row.mld) !== null;
    });
    var revenueRows = toArray(block.revenue_by_region).filter(function (row) {
      return regionalRowRegion(row) && toNumber(row.mld) !== null;
    });
    var balanceRows = toArray(block.balances_by_region).filter(function (row) {
      return regionalRowRegion(row) && toNumber(row.mld) !== null;
    });

    var tableColumns = [
      { value: function (row) { return asText(row.missione); } },
      { value: function (row) { return formatRegionalMld(row.mld); } },
      { value: function (row) { return formatPercent(row.share, 1); } }
    ];

    if (!missionRows.length && !spendingRows.length) {
      showEmptyChart("bpRegionalMissionChart", "Nessun dato regionale disponibile");
      createTableRows(byId("bpRegionalMissionRows"), [], tableColumns);
      renderRegionalSummary([]);
      var emptyCoverage = byId("bpRegionalCoverage");
      if (emptyCoverage) emptyCoverage.textContent = "Dati regionali non disponibili nel dataset caricato.";
      return;
    }

    var detailYears = uniqueSorted(missionRows.map(function (row) { return toNumber(row.anno); }), true);
    var totalYears = uniqueSorted(
      spendingRows.concat(revenueRows).concat(balanceRows).map(function (row) { return toNumber(row.anno); }),
      true
    );
    var years = detailYears.length ? detailYears : totalYears;
    var selectedYearText = setSelectOptions(byId("bpRegionalYear"), years, STATE.regionalYear, function (value) {
      return String(value);
    });
    var selectedYear = toNumber(selectedYearText);
    STATE.regionalYear = selectedYearText;

    if (selectedYear === null) {
      showEmptyChart("bpRegionalMissionChart", "Nessun anno regionale disponibile");
      createTableRows(byId("bpRegionalMissionRows"), [], tableColumns);
      renderRegionalSummary([]);
      return;
    }

    var availableRegions = regionalAvailableRegions(block, selectedYear);
    var detailRegions = uniqueSorted(missionRows
      .filter(function (row) { return toNumber(row.anno) === selectedYear; })
      .map(regionalRowRegion), false);
    var totalRegions = uniqueSorted(spendingRows
      .filter(function (row) { return toNumber(row.anno) === selectedYear; })
      .map(regionalRowRegion), false);
    var regions = availableRegions.length ? availableRegions : (detailRegions.length ? detailRegions : totalRegions);
    var largestRegion = spendingRows
      .filter(function (row) { return toNumber(row.anno) === selectedYear; })
      .sort(function (a, b) { return (toNumber(b.mld) || 0) - (toNumber(a.mld) || 0); })[0];
    var selectedRegion = setSelectOptions(
      byId("bpRegionalRegion"),
      regions,
      STATE.regionalRegion || (largestRegion && regionalRowRegion(largestRegion)) || (regions[0] || null),
      function (value) { return String(value); }
    );
    STATE.regionalRegion = selectedRegion;

    var spendingValue = findRegionalValue(spendingRows, selectedRegion, selectedYear);
    var revenueValue = findRegionalValue(revenueRows, selectedRegion, selectedYear);
    var balanceValue = findRegionalValue(balanceRows, selectedRegion, selectedYear);
    if (balanceValue === null && revenueValue !== null && spendingValue !== null) {
      balanceValue = revenueValue - spendingValue;
    }

    renderRegionalSummary([
      { label: "Spese", value: formatRegionalMld(spendingValue), detail: "Rendiconto " + selectedYear },
      { label: "Entrate", value: formatRegionalMld(revenueValue), detail: "Rendiconto " + selectedYear },
      { label: "Saldo", value: formatRegionalMld(balanceValue), detail: "Entrate - spese" }
    ]);

    var coverage = toArray(block.coverage).find(function (row) {
      return toNumber(row.anno) === selectedYear;
    });
    var coverageNode = byId("bpRegionalCoverage");
    if (coverageNode) {
      var coverageText = coverage
        ? "Copertura " + selectedYear + ": " + formatPlain(coverage.regioni_presenti, 0) + " regioni su " +
          formatPlain(coverage.regioni_attese, 0) + "."
        : "Copertura non indicata per " + selectedYear + ".";
      var missing = toArray(coverage && coverage.regioni_mancanti);
      if (missing.length) coverageText += " Mancano: " + missing.join(", ") + ".";
      if (detailYears.length && totalYears.length > detailYears.length) {
        coverageText += " Il dettaglio per missione e' disponibile per " + detailYears.join(", ") + ".";
      }
      coverageNode.textContent = coverageText;
    }

    var selectedMissionRows = missionRows
      .filter(function (row) { return regionalRowMatches(row, selectedRegion, selectedYear); })
      .filter(function (row) { return toNumber(row.mld) !== null && toNumber(row.mld) > 0; })
      .sort(function (a, b) { return (toNumber(b.mld) || 0) - (toNumber(a.mld) || 0); });
    var missionTotal = spendingValue !== null
      ? spendingValue
      : selectedMissionRows.reduce(function (sum, row) { return sum + (toNumber(row.mld) || 0); }, 0);
    selectedMissionRows = selectedMissionRows.map(function (row) {
      return Object.assign({}, row, {
        share: missionTotal ? (toNumber(row.mld) || 0) / missionTotal * 100 : null
      });
    });

    if (selectedMissionRows.length) {
      var mobile = isMobileViewport();
      var chartRows = selectedMissionRows.slice(0, mobile ? 10 : 16).reverse();
      plot("bpRegionalMissionChart", [{
        type: "bar",
        orientation: "h",
        name: "Miliardi di euro",
        x: chartRows.map(function (row) { return toNumber(row.mld); }),
        y: chartRows.map(function (row) { return compactLabel(row.missione, mobile ? 28 : 54); }),
        marker: { color: cssVar("--orange", COLORS[0]) },
        text: mobile ? [] : chartRows.map(function (row) { return formatRegionalMld(row.mld); }),
        textposition: mobile ? "none" : "outside",
        cliponaxis: false,
        customdata: chartRows.map(function (row) {
          return [asText(row.missione), toNumber(row.share)];
        }),
        hovertemplate: "%{customdata[0]}<br>Miliardi di euro: %{x:.3f}<br>Quota spesa: %{customdata[1]:.1f}%<extra></extra>"
      }], {
        margin: { t: 18, r: mobile ? 24 : 84, b: 54, l: mobile ? 142 : 300 },
        xaxis: { title: "Miliardi di euro", rangemode: "tozero" },
        yaxis: { title: "", showgrid: false },
        showlegend: false
      });
    } else {
      showEmptyChart("bpRegionalMissionChart", "Nessun dettaglio per missione disponibile per la selezione");
    }

    createTableRows(byId("bpRegionalMissionRows"), selectedMissionRows, tableColumns);
  }

  function normalizePeerRows(payload) {
    var metric = PEER_METRICS[STATE.peerMetric] || PEER_METRICS.tax_pressure;
    return toArray(payload.peer)
      .map(function (row) {
        return {
          country: asText(row.country || row.paese || row.code),
          code: asText(row.code || row.paese),
          value: toNumber(row[STATE.peerMetric]),
          year: row[metric.year] || row.year
        };
      })
      .filter(function (row) { return row.value !== null; })
      .sort(function (a, b) { return b.value - a.value; });
  }

  function selectedPeerRows(rows) {
    rows = toArray(rows);
    if (STATE.peerCountries === null) {
      return rows;
    }
    var selected = STATE.peerCountries;
    return rows.filter(function (row) {
      return selected.indexOf(row.code) >= 0;
    });
  }

  function ensurePeerCountryControls(rows) {
    var chart = byId("bpPeerBars");
    if (!chart) return;
    var card = chart.closest ? chart.closest(".bp-card") : null;
    if (!card) return;

    var panel = byId("bpPeerCountryPanel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "bpPeerCountryPanel";
      panel.className = "bp-peer-country-panel";
      panel.innerHTML = [
        '<div class="bp-peer-country-head">',
        '<span class="bp-filter-label">Paesi</span>',
        '<div class="bp-peer-actions">',
        '<button type="button" data-peer-action="all">Tutti</button>',
        '<button type="button" data-peer-action="it">Italia</button>',
        '<button type="button" data-peer-action="clear">Nessuno</button>',
        '</div>',
        '</div>',
        '<div id="bpPeerCountries" class="bp-peer-country-grid"></div>'
      ].join("");
      var wrap = chart.closest ? chart.closest(".bp-chart-wrap") : null;
      if (wrap && wrap.parentNode) {
        wrap.parentNode.insertBefore(panel, wrap);
      } else {
        card.appendChild(panel);
      }
      panel.querySelectorAll("[data-peer-action]").forEach(function (button) {
        button.addEventListener("click", function () {
          var action = button.getAttribute("data-peer-action");
          if (action === "all") STATE.peerCountries = null;
          if (action === "it") STATE.peerCountries = ["IT"];
          if (action === "clear") STATE.peerCountries = [];
          if (STATE.payload) renderPeer(STATE.payload);
        });
      });
    }

    var grid = byId("bpPeerCountries");
    if (!grid) return;
    var selected = STATE.peerCountries === null ? rows.map(function (row) { return row.code; }) : STATE.peerCountries;
    clear(grid);
    rows.forEach(function (row) {
      var label = document.createElement("label");
      label.className = "bp-country-option";

      var input = document.createElement("input");
      input.type = "checkbox";
      input.value = row.code;
      input.checked = selected.indexOf(row.code) >= 0;
      input.addEventListener("change", function () {
        var checked = Array.prototype.slice.call(grid.querySelectorAll("input:checked")).map(function (item) {
          return item.value;
        });
        STATE.peerCountries = checked;
        if (STATE.payload) renderPeer(STATE.payload);
      });

      var name = document.createElement("span");
      name.textContent = row.country + " (" + row.code + ")";

      label.appendChild(input);
      label.appendChild(name);
      grid.appendChild(label);
    });
  }

  function renderPeer(payload) {
    var select = byId("bpPeerMetric");
    if (select && !select.options.length) {
      Object.keys(PEER_METRICS).forEach(function (key) {
        var option = document.createElement("option");
        option.value = key;
        option.textContent = PEER_METRICS[key].label;
        select.appendChild(option);
      });
      select.value = STATE.peerMetric;
    }
    if (select && select.value) STATE.peerMetric = select.value;

    var metric = PEER_METRICS[STATE.peerMetric] || PEER_METRICS.tax_pressure;
    var allRows = normalizePeerRows(payload);
    ensurePeerCountryControls(allRows);
    var rows = selectedPeerRows(allRows);
    var chartRows = rows.slice().reverse();
    if (!chartRows.length) {
      showEmptyChart("bpPeerBars", "Seleziona almeno un paese");
    } else {
      plot("bpPeerBars", [{
        type: "bar",
        orientation: "h",
        x: chartRows.map(function (row) { return row.value; }),
        y: chartRows.map(function (row) { return row.code; }),
        text: chartRows.map(function (row) { return formatDecimal(row.value, 1); }),
        textposition: "auto",
        marker: {
          color: chartRows.map(function (row, index) {
            return row.code === "IT" ? cssVar("--orange", COLORS[0]) : COLORS[(index + 2) % COLORS.length];
          })
        },
        customdata: chartRows.map(function (row) { return row.country; }),
        hovertemplate: "%{customdata}<br>%{x:.1f} " + metric.unit + "<extra></extra>"
      }], {
        height: Math.min(980, Math.max(isMobileViewport() ? 500 : 560, rows.length * (isMobileViewport() ? 28 : 24) + 130)),
        margin: { t: 18, r: 24, b: 44, l: 92 },
        xaxis: { title: metric.unit },
        yaxis: { title: "" },
        showlegend: false
      });
    }

    var peerHeader = byId("bpPeerMetricHeader");
    if (peerHeader) peerHeader.textContent = metric.unit;

    createTableRows(byId("bpPeerRows"), rows, [
      { value: function (row, index) { return String(index + 1); } },
      { value: function (row) { return row.country; } },
      { value: function (row) { return row.code; } },
      { value: function (row) { return formatDecimal(row.value, 1) + " " + metric.unit; } }
    ]);
  }

  function renderAll(payload) {
    renderMeta(payload);
    renderKpis(payload);
    renderTopTaxes(payload);
    renderTaxTrend(payload);
    renderTaxCompositionTrend(payload);
    renderPie("bpRevenuePie", toArray(payload.revenue_pie), "Entrate", "bpRevenuePieRows");
    renderPie("bpSpendingPie", toArray(payload.spending_pie), "Spese", "bpSpendingPieRows");
    renderCategoryTrend("bpRevenueTrend", toArray(payload.revenue_category_series), "Nessuna serie entrate disponibile");
    renderCategoryTrend("bpSpendingTrend", toArray(payload.spending_category_series), "Nessuna serie spese disponibile");
    renderIrpef(payload);
    renderTaxTypeTrend(payload);
    renderRevenueFocus(payload);
    renderUnder500(payload);
    renderRevenueGaps(payload);
    renderSpendingFocus(payload);
    renderSpendingFunctionDetail(payload);
    renderRegionalBudgets(payload);
    renderPeer(payload);
  }

  function initPeerControl() {
    var select = byId("bpPeerMetric");
    if (!select) return;
    select.addEventListener("change", function () {
      STATE.peerMetric = select.value;
      if (STATE.payload) renderPeer(STATE.payload);
    });
  }

  function initRegionalControls() {
    var yearSelect = byId("bpRegionalYear");
    var regionSelect = byId("bpRegionalRegion");
    if (yearSelect) {
      yearSelect.addEventListener("change", function () {
        STATE.regionalYear = yearSelect.value;
        if (STATE.payload) renderRegionalBudgets(STATE.payload);
      });
    }
    if (regionSelect) {
      regionSelect.addEventListener("change", function () {
        STATE.regionalRegion = regionSelect.value;
        if (STATE.payload) renderRegionalBudgets(STATE.payload);
      });
    }
  }

  function initSpendingDetailControl() {
    var select = byId("bpSpendingDetailFunction");
    if (!select) return;
    select.addEventListener("change", function () {
      STATE.spendingDetailFunction = select.value;
      if (STATE.payload) renderSpendingFunctionDetail(STATE.payload);
    });
  }

  function initThemeObserver() {
    if (!window.MutationObserver) return;
    var observer = new MutationObserver(function () {
      if (STATE.payload) {
        window.clearTimeout(window.__bpThemeTimer);
        window.__bpThemeTimer = window.setTimeout(function () {
          renderAll(STATE.payload);
        }, 120);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  function init() {
    initPeerControl();
    initRegionalControls();
    initSpendingDetailControl();
    initThemeObserver();

    var status = byId("bpStatus");
    if (status) status.textContent = "Caricamento dati in corso...";

    fetch(DATA_URL, { cache: "no-store", mode: "cors" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (payload) {
        STATE.payload = payload;
        renderAll(payload);
      })
      .catch(function (error) {
        if (status) status.textContent = "Errore nel caricamento dei dati: " + error.message;
        [
          "bpTopTaxes", "bpTaxTrend", "bpTaxCompositionTrend", "bpRevenuePie", "bpSpendingPie",
          "bpRevenueTrend", "bpSpendingTrend", "bpIrpefBandChart",
          "bpTaxTypeTrend", "bpUnder500Chart", "bpRegionalMissionChart",
          "bpSpendingDetailTrend", "bpPeerBars"
        ].forEach(function (id) {
          showEmptyChart(id, "Dati non caricati");
        });
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

