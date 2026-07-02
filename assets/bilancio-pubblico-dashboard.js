(function () {
  "use strict";

  var DATA_URL = "https://data.nazarenolecis.com/bilancio-pubblico/dashboard.json";
  var STATE = {
    payload: null,
    peerMetric: "tax_pressure"
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
    if (value === null || value === undefined || value === "") return fallback || "-";
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
    if (n === null) return "-";
    return n.toLocaleString("it-IT", {
      maximumFractionDigits: Number.isFinite(digits) ? digits : 0,
      minimumFractionDigits: 0
    });
  }

  function formatDecimal(value, digits) {
    var n = toNumber(value);
    if (n === null) return "-";
    digits = Number.isFinite(digits) ? digits : 1;
    return n.toLocaleString("it-IT", {
      maximumFractionDigits: digits,
      minimumFractionDigits: 0
    });
  }

  function formatPercent(value, digits) {
    var n = toNumber(value);
    if (n === null) return "-";
    return formatDecimal(n, Number.isFinite(digits) ? digits : 1) + "%";
  }

  function formatMld(value, digits) {
    var n = toNumber(value);
    if (n === null) return "-";
    digits = Number.isFinite(digits) ? digits : 1;
    return n.toLocaleString("it-IT", {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits
    }) + " mld";
  }

  function niceLabel(value) {
    return asText(value)
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();
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
      "COFOG: classificazione internazionale delle funzioni della spesa pubblica, usata da Eurostat per rendere confrontabili i paesi.",
      "Distribuzione IRPEF: contribuenti e imposta netta sono aggregati per fascia di reddito dichiarato.",
      payload.meta && payload.meta.manifest_rows ? "Serie e tavole sorgente censite nell'elaborazione: " + payload.meta.manifest_rows + "." : null
    ].filter(Boolean).forEach(function (text) {
      var li = document.createElement("li");
      li.textContent = text;
      notes.appendChild(li);
    });
    toArray(payload.meta && payload.meta.sources).slice(0, 5).forEach(function (source) {
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
      hovertemplate: "%{y}<br>%{x:.1f} mld<extra></extra>"
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
    if (!rows.length) {
      showEmptyChart("bpTaxTrend", "Nessuna serie sulla pressione fiscale disponibile");
      return;
    }
    var keys = Object.keys(rows[0]).filter(function (key) {
      return key !== "year" && rows.some(function (row) { return toNumber(row[key]) !== null; });
    });
    keys = ["value"].concat(keys.filter(function (key) { return key !== "value"; })).slice(0, 5);
    plot("bpTaxTrend", lineSeriesFromRows(rows, keys, {
      labels: { value: "Totale" },
      suffix: "%"
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
      hovertemplate: "%{label}<br>%{value:.1f} mld<br>%{percent}<extra></extra>"
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
    var traces = rows.map(function (row, index) {
      var points = toArray(row.series).filter(function (point) {
        return toNumber(point.year) !== null && toNumber(point.value_mld) !== null;
      });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: asText(row.label || row.code),
        x: points.map(function (point) { return toNumber(point.year); }),
        y: points.map(function (point) { return toNumber(point.value_mld); }),
        line: { color: COLORS[index % COLORS.length], width: index === 0 ? 3 : 2 },
        marker: { size: 5 },
        hovertemplate: "%{x}<br>%{fullData.name}: %{y:.1f} mld<extra></extra>"
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
    if (!rows.length) {
      showEmptyChart("bpTaxTypeTrend", "Nessuna serie dirette/indirette disponibile");
      return;
    }
    var keys = Object.keys(rows[0]).filter(function (key) {
      return key !== "year" && rows.some(function (row) { return toNumber(row[key]) !== null; });
    }).slice(0, 6);
    plot("bpTaxTypeTrend", lineSeriesFromRows(rows, keys, { suffix: " mld" }), {
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
      { value: function (row) { return asText(row.group || "-"); }, className: "is-muted" },
      {
        value: function (row) {
          var value = row.latest_value_mld !== undefined ? row.latest_value_mld : (row.value || row.value_mld);
          return row.status ? "N/D" : formatMld(value, 3);
        }
      },
      { value: function (row) { return asText(row.source); }, className: "is-muted" },
      { value: function (row) { return asText(row.latest_year || row.year); } }
    ]);
  }

  function renderUnder500(payload) {
    var block = payload.under_500m_revenue_summary || {};
    var entries = toArray(block.entries).slice().sort(function (a, b) {
      return (toNumber(b.value_mld) || 0) - (toNumber(a.value_mld) || 0);
    });

    if (entries.length) {
      var chartRows = entries.slice(0, 24).reverse();
      var cumulative = [];
      var running = 0;
      chartRows.forEach(function (row) {
        running += toNumber(row.value_mld) || 0;
        cumulative.push(running);
      });
      plot("bpUnder500Chart", [
        {
          type: "bar",
          name: "Valore",
          x: chartRows.map(function (row) { return asText(row.label || row.code); }),
          y: chartRows.map(function (row) { return toNumber(row.value_mld); }),
          marker: { color: cssVar("--orange", COLORS[0]) },
          hovertemplate: "%{x}<br>%{y:.3f} mld<extra></extra>"
        },
        {
          type: "scatter",
          mode: "lines+markers",
          name: "Cumulo",
          x: chartRows.map(function (row) { return asText(row.label || row.code); }),
          y: cumulative,
          yaxis: "y2",
          line: { color: COLORS[1], width: 3 },
          marker: { size: 6 },
          hovertemplate: "%{x}<br>Cumulo: %{y:.3f} mld<extra></extra>"
        }
      ], {
        margin: { t: 18, r: 72, b: 112, l: 58 },
        xaxis: { title: "", tickangle: -35 },
        yaxis: { title: "Miliardi" },
        yaxis2: {
          title: "Cumulo",
          overlaying: "y",
          side: "right",
          fixedrange: true,
          gridcolor: "rgba(0,0,0,0)"
        },
        legend: { orientation: "h", y: -0.35 }
      });
    } else {
      showEmptyChart("bpUnder500Chart", "Nessuna voce sotto 500 milioni disponibile");
    }

    createTableRows(byId("bpUnder500Rows"), entries, [
      { value: function (row) { return asText(row.label || row.code); } },
      { value: function (row) { return asText(row.year || block.year); } },
      { value: function (row) { return formatMld(row.value_mld || row.value, 2); } },
      { value: function (row) { return formatPercent(row.share_of_total_percent || row.share_percent, 2); } }
    ]);

    var meta = byId("bpUnder500Meta");
    if (!meta) return;
    if (entries.length) {
      meta.textContent = "Totale sotto 500 milioni: " + formatMld(block.under_500_total_mld, 2) +
        " (" + formatPercent(block.under_500_share_of_total_percent, 2) + " del totale).";
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
    var rows = byValueDesc(toArray(payload.spending_focus), "value");
    createTableRows(byId("bpSpendingFocusRows"), rows, [
      { value: function (row) { return asText(row.label || row.code); } },
      { value: function (row) { return row.status ? "N/D" : formatMld(row.value || row.value_mld, 1); } },
      { value: function (row) { return formatPercent(row.value_pil_percent, 1); } },
      { value: function (row) { return formatPercent(row.share_spesa_totale, 1); } },
      { value: function (row) { return asText(row.source); }, className: "is-muted" },
      { value: function (row) { return asText(row.year || row.year_to); } }
    ]);
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
    var rows = normalizePeerRows(payload).slice(0, 12);
    var chartRows = rows.slice().reverse();
    if (!chartRows.length) {
      showEmptyChart("bpPeerBars", "Nessun confronto paese disponibile");
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
        margin: { t: 18, r: 24, b: 44, l: 92 },
        xaxis: { title: metric.unit },
        yaxis: { title: "" },
        showlegend: false
      });
    }

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
          "bpTopTaxes", "bpTaxTrend", "bpRevenuePie", "bpSpendingPie",
          "bpRevenueTrend", "bpSpendingTrend", "bpIrpefBandChart",
          "bpTaxTypeTrend", "bpUnder500Chart", "bpPeerBars"
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
