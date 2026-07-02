(function () {
  "use strict";

  var DATA_URL = "https://data.nazarenolecis.com/bilancio-pubblico/dashboard.json";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var chartIds = {
    topTaxes: "bpTopTaxes",
    taxTrend: "bpTaxTrend",
    revenuePie: "bpRevenuePie",
    spendingPie: "bpSpendingPie",
    revenueTrend: "bpRevenueTrend",
    spendingTrend: "bpSpendingTrend",
    taxTypeTrend: "bpTaxTypeTrend",
    peerBars: "bpPeerBars"
  };
  var palette = [
    "#ff7a35", "#1f77b4", "#2ca02c", "#9467bd", "#8c564b",
    "#d62728", "#ffbb78", "#17becf", "#bcbd22", "#7f7f7f",
    "#e377c2", "#59a14f", "#f28e2b", "#76b7b2", "#9c755f"
  ];
  var peerMetricMeta = {
    tax_pressure: { label: "Pressione fiscale", unit: "% PIL", note: "Totale imposte e contributi sociali", valueLabel: "Valore" },
    public_spending: { label: "Spesa pubblica", unit: "% PIL", note: "Totale spesa pubblica", valueLabel: "Valore" },
    social_spending: { label: "Spesa sociale", unit: "% PIL", note: "Spesa sociale pubblica", valueLabel: "Valore" }
  };

  var STATE = {
    payload: null,
    peerMetric: "tax_pressure"
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function asText(value) {
    return value === null || value === undefined || value === "" ? "—" : String(value);
  }

  function toNumber(value) {
    var valueNumber = Number(value);
    return Number.isFinite(valueNumber) ? valueNumber : null;
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function formatPlain(value) {
    var n = toNumber(value);
    if (n === null) return "—";
    return n.toLocaleString("it-IT", { maximumFractionDigits: 0 });
  }

  function formatDecimal(value, digits) {
    var n = toNumber(value);
    if (n === null) return "—";
    digits = Number.isFinite(digits) ? digits : 1;
    return n.toLocaleString("it-IT", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
  }

  function formatPercent(value, digits) {
    var n = toNumber(value);
    if (n === null) return "—";
    digits = Number.isFinite(digits) ? digits : 1;
    return n.toLocaleString("it-IT", { maximumFractionDigits: digits }) + "%";
  }

  function formatMld(value, digits) {
    var n = toNumber(value);
    if (n === null) return "—";
    digits = Number.isFinite(digits) ? digits : 1;
    return n.toLocaleString("it-IT", { maximumFractionDigits: digits, minimumFractionDigits: 1 }) + " mld";
  }

  function formatCurrencyLike(value) {
    var n = toNumber(value);
    if (n === null) return "—";
    return n.toLocaleString("it-IT", { maximumFractionDigits: 0 }) + " euro";
  }

  function clear(el) {
    if (!el) return;
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  function appendText(parent, x, y, text, size, align, color, weight) {
    if (!parent || text === undefined || text === null) return;
    var t = document.createElementNS(SVG_NS, "text");
    t.setAttribute("x", x);
    t.setAttribute("y", y);
    t.setAttribute("fill", color || "var(--text)");
    t.setAttribute("text-anchor", align || "start");
    t.setAttribute("font-size", size || 11);
    t.setAttribute("font-weight", weight || "500");
    t.textContent = text;
    parent.appendChild(t);
  }

  function setMessage(svg, message) {
    clear(svg);
    var box = chartBox(svg);
    appendText(svg, box.width / 2, box.height / 2, message, 12, "middle", "var(--muted)");
  }

  function chartBox(svg) {
    var rect = svg.getBoundingClientRect();
    var width = Math.max(260, Math.round(rect.width || 320));
    var height = Math.max(220, Math.round(rect.height || 280));
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    return { width: width, height: height };
  }

  function percentToPercent(num) {
    return toNumber(num);
  }

  function pickFirst(obj, keys) {
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var candidate = obj[key];
      if (Array.isArray(candidate) && candidate.length) return candidate;
      if (candidate && !Array.isArray(candidate) && key === "pressureTrend" && candidate.year) {
        return [candidate];
      }
    }
    return [];
  }

  function uniqueRows(rows) {
    if (!rows || !rows.length) return [];
    return rows.filter(function (row, index, array) {
      var key = asText(row.code || row.label || row.band || row.country || "").toLowerCase();
      return array.findIndex(function (candidate) {
        return asText(candidate.code || candidate.label || candidate.band || candidate.country || "").toLowerCase() === key;
      }) === index;
    });
  }

  function createTableRows(tbody, rows, columns) {
    clear(tbody);
    if (!rows.length) {
      var empty = document.createElement("tr");
      var cell = document.createElement("td");
      cell.colSpan = Math.max(1, columns.length);
      cell.textContent = "Nessun dato disponibile";
      empty.appendChild(cell);
      tbody.appendChild(empty);
      return;
    }
    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      columns.forEach(function (column) {
        var td = document.createElement("td");
        var cellValue = column.value(row);
        if (column.html) {
          td.innerHTML = cellValue;
        } else {
          td.textContent = cellValue;
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  function drawHorizontalBars(svgId, rows, valueKey, options) {
    options = options || {};
    var svg = byId(svgId);
    if (!svg) return;
    rows = toArray(rows)
      .filter(function (row) {
        return row;
      })
      .filter(function (row) {
        return toNumber(row[valueKey]) !== null;
      })
      .sort(function (a, b) {
        return toNumber(b[valueKey]) - toNumber(a[valueKey]);
      });

    if (!rows.length) {
      setMessage(svg, options.emptyText || "Nessun dato disponibile");
      return;
    }

    var box = chartBox(svg);
    clear(svg);
    var margin = { top: 14, right: 10, bottom: 28, left: 180 };
    var inner = {
      width: Math.max(80, box.width - margin.left - margin.right),
      height: Math.max(100, box.height - margin.top - margin.bottom),
      left: margin.left,
      top: margin.top
    };
    var maxValue = Math.max.apply(Math, rows.map(function (row) { return toNumber(row[valueKey]); }));
    if (!Number.isFinite(maxValue) || maxValue <= 0) {
      setMessage(svg, options.emptyText || "Valori non validi");
      return;
    }

    var rowHeight = inner.height / rows.length;
    var baseY = inner.top + inner.height;
    rows.forEach(function (row, index) {
      var y = inner.top + (index * rowHeight) + 8;
      var barHeight = Math.max(8, rowHeight - 16);
      var value = toNumber(row[valueKey]);
      var width = (value / maxValue) * inner.width;
      var color = row.highlight ? "#f95f1a" : (palette[index % palette.length]);

      var rect = document.createElementNS(SVG_NS, "rect");
      rect.setAttribute("x", inner.left);
      rect.setAttribute("y", y);
      rect.setAttribute("height", barHeight);
      rect.setAttribute("width", Math.max(0, width));
      rect.setAttribute("fill", color);
      rect.setAttribute("rx", 4);
      rect.setAttribute("ry", 4);
      rect.setAttribute("class", "bar");
      if (row.code === "ITALIA" || row.code === "IT" || row.country === "Italia") {
        rect.setAttribute("class", "bar italy");
      }
      svg.appendChild(rect);

      var labelText = asText(row.label || row.country || row.code || row.band || "Voce");
      appendText(svg, 12, y + barHeight - 1, labelText, 11, "start", "var(--muted)");
      appendText(svg, inner.left + width + 6, y + barHeight - 1, asText(options.formatter ? options.formatter(value) : formatPlain(value)), 11, "start", "var(--text)");
    });

    var yAxisLabel = rowHeight > 28 ? "valore" : "";
    if (yAxisLabel) {
      var xAxis = margin.left + Math.max(0, inner.width);
      var baseLine = baseY;
      for (var i = 0; i <= 5; i++) {
        var tickX = margin.left + (inner.width * (i / 5));
        var val = (maxValue * (i / 5));
        var grid = document.createElementNS(SVG_NS, "line");
        grid.setAttribute("x1", tickX);
        grid.setAttribute("x2", tickX);
        grid.setAttribute("y1", inner.top - 6);
        grid.setAttribute("y2", baseLine);
        grid.setAttribute("class", "grid");
        svg.appendChild(grid);
        appendText(svg, tickX, baseLine + 16, formatPlain(val), 10, "middle", "var(--muted)");
      }
      appendText(svg, inner.left, inner.top - 4, asText(options.xTitle || "Valore"), 10, "start", "var(--orange)");
      appendText(svg, xAxis, baseLine + 28, asText(options.yTitle || "Categorie"), 10, "end", "var(--muted)");
    }
  }

  function drawPieChart(svgId, rows, valueKey, labelKey, options) {
    options = options || {};
    var svg = byId(svgId);
    if (!svg) return;
    rows = toArray(rows)
      .filter(function (row) { return row && toNumber(row[valueKey]) !== null; })
      .map(function (row) {
        return {
          label: row[labelKey] || row.code || row.label || "Voce",
          value: toNumber(row[valueKey]),
          share: toNumber(row.share_percent),
          raw: row
        };
      })
      .sort(function (a, b) {
        return b.value - a.value;
      });
    if (!rows.length) {
      setMessage(svg, options.emptyText || "Nessun dato disponibile");
      return;
    }

    var box = chartBox(svg);
    clear(svg);
    var cx = box.width / 2;
    var cy = box.height / 2;
    var radius = Math.min(cx, cy) * 0.72;
    var titleSpace = 20;
    if (cy < radius + titleSpace) {
      radius = Math.max(40, cy - titleSpace);
    }

    var total = rows.reduce(function (acc, row) { return acc + row.value; }, 0);
    if (!total) {
      setMessage(svg, options.emptyText || "Totale non disponibile");
      return;
    }

    var start = -Math.PI / 2;
    var full = Math.PI * 2;
    var cursor = start;
    rows.forEach(function (row, index) {
      var slice = (row.share !== null ? row.share / 100 : row.value / total);
      if (!Number.isFinite(slice) || slice <= 0) return;
      var end = cursor + slice * full;
      var large = (end - cursor) > Math.PI ? 1 : 0;
      var x1 = cx + (radius * Math.cos(cursor));
      var y1 = cy + (radius * Math.sin(cursor));
      var x2 = cx + (radius * Math.cos(end));
      var y2 = cy + (radius * Math.sin(end));
      var path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", [
        "M", cx, ",", cy,
        "L", x1, ",", y1,
        "A", radius, radius, 0, large, 1, x2, y2,
        "Z"
      ].join(" "));
      path.setAttribute("fill", palette[index % palette.length]);
      path.setAttribute("class", "bar");
      path.setAttribute("stroke", "var(--panel)");
      path.setAttribute("stroke-width", 1);
      svg.appendChild(path);

      var middle = cursor + (end - cursor) / 2;
      if ((end - cursor) > 0.18) {
        var lx = cx + ((radius * 0.62) * Math.cos(middle));
        var ly = cy + ((radius * 0.62) * Math.sin(middle));
        var pct = ((slice * 100) >= 3) ? (formatPercent(slice * 100, 1) + " \u2013 " + asText(row.label)) : "";
        if (pct) {
          appendText(svg, lx, ly, pct, 10, "middle", "var(--panel)");
        }
      }
      cursor = end;
    });

    appendText(svg, cx, cy, asText(options.title || "Ripartizione"), 12, "middle", "var(--text)", "700");
    appendText(svg, cx, cy + 16, "100%", 16, "middle", "var(--orange)", "800");

    var ring = document.createElementNS(SVG_NS, "circle");
    ring.setAttribute("cx", cx);
    ring.setAttribute("cy", cy);
    ring.setAttribute("r", Math.max(22, radius * 0.16));
    ring.setAttribute("fill", "var(--panel)");
    ring.setAttribute("stroke", "var(--line)");
    svg.appendChild(ring);

    appendText(svg, cx, cy + 5, asText(formatDecimal(total, 1)), 11, "middle", "var(--text)", "700");
    appendText(svg, cx, cy + 20, "mld", 10, "middle", "var(--muted)");
  }

  function drawLineChart(svgId, series, options) {
    options = options || {};
    var svg = byId(svgId);
    if (!svg) return;
    var safeSeries = toArray(series).filter(function (item) {
      return item && Array.isArray(item.points) && item.points.length;
    });
    if (!safeSeries.length) {
      setMessage(svg, options.emptyText || "Nessun dato disponibile");
      return;
    }

    var years = [];
    safeSeries.forEach(function (line) {
      line.points.forEach(function (point) {
        if (years.indexOf(point.year) < 0) years.push(point.year);
      });
    });
    years = years.filter(function (y) { return y !== null && y !== undefined; }).sort(function (a, b) { return a - b; });
    if (!years.length) {
      setMessage(svg, options.emptyText || "Nessun dato disponibile");
      return;
    }

    var box = chartBox(svg);
    clear(svg);
    var margin = { top: 18, right: 18, bottom: 36, left: 62 };
    var inner = {
      width: Math.max(160, box.width - margin.left - margin.right),
      height: Math.max(130, box.height - margin.top - margin.bottom),
      left: margin.left,
      top: margin.top,
      bottom: margin.bottom
    };

    var yMin = Infinity;
    var yMax = -Infinity;
    safeSeries.forEach(function (line) {
      line.points.forEach(function (point) {
        if (point.value !== null) {
          yMin = Math.min(yMin, point.value);
          yMax = Math.max(yMax, point.value);
        }
      });
    });
    if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin === yMax) {
      yMin = (yMin || 0) - 1;
      yMax = (yMax || 0) + 1;
    }

    function scaleX(value) {
      var t = years.length > 1 ? (value - years[0]) / (years[years.length - 1] - years[0]) : 0.5;
      return inner.left + Math.max(0, Math.min(1, t)) * inner.width;
    }

    function scaleY(value) {
      var t = (value - yMin) / (yMax - yMin);
      return inner.top + inner.height * (1 - Math.max(0, Math.min(1, t)));
    }

    function addLine(points, color, width) {
      if (!points.length) return;
      var pathData = "";
      points.forEach(function (point, index) {
        var x = scaleX(point.year);
        var y = scaleY(point.value);
        if (index === 0) pathData += "M " + x + " " + y;
        else pathData += " L " + x + " " + y;
      });
      var path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", pathData);
      path.setAttribute("class", "line");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", color);
      path.setAttribute("stroke-width", width || 2.4);
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("stroke-linecap", "round");
      svg.appendChild(path);

      points.forEach(function (point) {
        var pointDot = document.createElementNS(SVG_NS, "circle");
        pointDot.setAttribute("cx", scaleX(point.year));
        pointDot.setAttribute("cy", scaleY(point.value));
        pointDot.setAttribute("r", 2.8);
        pointDot.setAttribute("class", "dot");
        pointDot.setAttribute("fill", color);
        svg.appendChild(pointDot);
      });
    }

    var zeroY = scaleY(Math.min(0, yMax));
    var xAxis = document.createElementNS(SVG_NS, "line");
    xAxis.setAttribute("x1", margin.left);
    xAxis.setAttribute("x2", margin.left + inner.width);
    xAxis.setAttribute("y1", inner.top + inner.height);
    xAxis.setAttribute("y2", inner.top + inner.height);
    xAxis.setAttribute("class", "axis");
    svg.appendChild(xAxis);

    var yAxis = document.createElementNS(SVG_NS, "line");
    yAxis.setAttribute("x1", margin.left);
    yAxis.setAttribute("x2", margin.left);
    yAxis.setAttribute("y1", inner.top);
    yAxis.setAttribute("y2", inner.top + inner.height);
    yAxis.setAttribute("class", "axis");
    svg.appendChild(yAxis);

    for (var yi = 0; yi <= 5; yi++) {
      var t = yi / 5;
      var y = inner.top + inner.height * (1 - t);
      var val = yMin + (yMax - yMin) * t;
      var hGrid = document.createElementNS(SVG_NS, "line");
      hGrid.setAttribute("x1", margin.left);
      hGrid.setAttribute("x2", margin.left + inner.width);
      hGrid.setAttribute("y1", y);
      hGrid.setAttribute("y2", y);
      hGrid.setAttribute("class", "grid");
      svg.appendChild(hGrid);
      appendText(svg, margin.left - 8, y + 4, options.yFormatter ? options.yFormatter(val) : formatDecimal(val, 1), 10, "end", "var(--muted)");
    }

    var yTicks = 5;
    for (var xi = 0; xi <= yTicks; xi++) {
      var tx = margin.left + (inner.width * (xi / yTicks));
      var idx = Math.round((years.length - 1) * (xi / yTicks));
      var xLabel = years[idx];
      appendText(svg, tx, inner.top + inner.height + 18, asText(xLabel), 10, "middle", "var(--muted)");
      var vLine = document.createElementNS(SVG_NS, "line");
      vLine.setAttribute("x1", tx);
      vLine.setAttribute("x2", tx);
      vLine.setAttribute("y1", inner.top + inner.height);
      vLine.setAttribute("y2", inner.top + inner.height + 6);
      vLine.setAttribute("class", "axis");
      svg.appendChild(vLine);
    }

    safeSeries.forEach(function (line, index) {
      var points = line.points.filter(function (point) {
        return point && Number.isFinite(point.value);
      }).sort(function (a, b) { return a.year - b.year; });
      addLine(points, line.color || palette[index % palette.length], index === 0 ? 2.6 : 2.1);
    });

    appendText(svg, margin.left, margin.top - 2, options.title || "Serie storica", 11, "start", "var(--orange)", "650");
    appendText(svg, margin.left + inner.width, margin.top - 2, asText(options.unit || ""), 10, "end", "var(--muted)");

    var legendY = inner.top + 8;
    safeSeries.slice(0, 6).forEach(function (line, index) {
      var x = margin.left + 6 + ((index % 2) * (inner.width / 2 - 8));
      var y = legendY + Math.floor(index / 2) * 14;
      appendText(svg, x, y, "\u25A0", 14, "start", line.color || palette[index % palette.length]);
      appendText(svg, x + 10, y + 3, asText(line.label || ("Serie " + (index + 1))), 10, "start", "var(--text)");
    });

    if (options.annotation) {
      appendText(svg, margin.left, margin.top + inner.height + 28, options.annotation, 10, "start", "var(--muted)");
    }
  }

  function renderKpis(payload) {
    var container = byId("bpKpis");
    if (!container) return;
    clear(container);
    var list = toArray(payload.kpis);
    if (!list.length) {
      container.innerHTML = "<div class=\"kpi\"><span>Dati non disponibili</span><strong>—</strong></div>";
      return;
    }
    list.forEach(function (item) {
      var value = item.value_mld || item.value;
      var card = document.createElement("article");
      card.className = "kpi";
      card.innerHTML = ""
        + "<span>" + asText(item.label || item.id || "Indicatore") + "</span>"
        + "<strong>"
        + (item.unit && String(item.unit).indexOf("%") >= 0 ? formatPercent(value, 1) : formatMld(value, 1))
        + "</strong>";
      container.appendChild(card);
    });
  }

  function renderMeta(payload) {
    var status = byId("bpStatus");
    var updated = byId("bpUpdated");
    var notes = byId("bpMethodNotes");

    if (status) {
      status.textContent = "Dati della dashboard caricati da data.nazarenolecis.com (json unico pubblico).";
    }
    if (updated) {
      var generated = payload && payload.meta && payload.meta.generated_at ? payload.meta.generated_at : "";
      updated.textContent = generated ? ("Generato il " + formatPlainDate(generated)) : "";
    }
    if (!notes) return;
    clear(notes);
    var sourceList = (payload.meta && payload.meta.sources) || [];
    var metaRows = [
      "Dati strutturati per uso dashboard: entrate, spese, confronto UE/OECD e focus dichiarazioni.",
      "Quando una voce non compare nelle fonti disponibili, la scheda la segnala come non disponibile nella pipeline corrente.",
      sourceList.slice(0, 3).map(asText).join(" ")
    ].concat([
      payload.meta && payload.meta.generated_by ? ("Procedura: " + payload.meta.generated_by) : null,
      payload.meta && payload.meta.manifest_rows ? ("Manifest JSON disponibili: " + payload.meta.manifest_rows + " file") : null
    ]);
    metaRows.filter(Boolean).forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = item;
      notes.appendChild(li);
    });
  }

  function formatPlainDate(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return asText(value);
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function renderTopTaxes(payload) {
    var rows = uniqueRows(toArray(payload.top_taxes_2025))
      .filter(function (row) { return toNumber(row.value) !== null; })
      .sort(function (a, b) {
        return toNumber(b.value) - toNumber(a.value);
      });
    drawHorizontalBars(chartIds.topTaxes, rows, "value", {
      formatter: function (value) { return formatMld(value, 1); },
      xTitle: "Entrate (mld)",
      emptyText: "Nessun dato per le principali entrate."
    });
  }

  function renderTaxTrend(payload) {
    var rows = pickFirst(payload, ["pressureTrend", "pressure_trend", "fiscal_trend", "tax_pressure_trend"]);
    if (!rows.length && Array.isArray(payload.fiscal_trend)) {
      rows = toArray(payload.fiscal_trend);
    }
    if (!rows.length && rows.year && toNumber(rows.value) !== null) {
      rows = [rows];
    }
    if (!rows.length) {
      setMessage(byId(chartIds.taxTrend), "Nessun trend fiscale disponibile.");
      return;
    }

    var firstRow = rows[0] || {};
    var keys = Object.keys(firstRow)
      .filter(function (k) { return k !== "year"; })
      .filter(function (k) {
        return rows.some(function (row) {
          return Number.isFinite(toNumber(row[k]));
        });
      });
    var ordered = [];
    if (keys.indexOf("value") >= 0) {
      ordered.push("value");
    }
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] !== "value") ordered.push(keys[i]);
    }
    ordered = ordered.filter(Boolean).slice(0, 6);

    var series = ordered.map(function (key, index) {
      return {
        label: key === "value" ? "Totale (mld)" : key,
        color: index === 0 ? "#f95f1a" : palette[index % palette.length],
        points: rows.map(function (row) {
          return { year: toNumber(row.year), value: toNumber(row[key]) };
        }).filter(function (point) {
          return point.year !== null && point.value !== null;
        })
      };
    }).filter(function (line) { return line.points.length > 1; });

    drawLineChart(chartIds.taxTrend, series, {
      title: "Andamento pressione fiscale e componenti",
      unit: "percentuale (%)",
      yFormatter: function (value) {
        return formatDecimal(value, 1) + "%";
      },
      annotation: "Nota: la somma delle componenti segue la sorgente disponibile nel periodo."
    });
  }

  function renderRevenuePie(payload) {
    var rows = uniqueRows(toArray(payload.revenue_pie)).filter(function (row) {
      return toNumber(row.value_mld) !== null || toNumber(row.share_percent) !== null;
    });
    drawPieChart(chartIds.revenuePie, rows, "value_mld", "label", {
      title: "Entrate",
      emptyText: "Nessuna ripartizione delle entrate disponibile.",
      formatter: function (v) { return formatMld(v, 1); }
    });

    var rowsBody = byId("bpRevenuePieRows");
    if (rowsBody) {
      var tableRows = rows
        .sort(function (a, b) {
          return (toNumber(b.value_mld) || 0) - (toNumber(a.value_mld) || 0);
        })
        .map(function (row) {
          return {
            rowLabel: asText(row.label || row.code || "-"),
            value: formatMld(toNumber(row.value_mld), 1),
            share: formatPercent(toNumber(row.share_percent), 1)
          };
        });
      createTableRows(rowsBody, tableRows, [
        { value: function (item) { return item.rowLabel; } },
        { value: function (item) { return item.value; } },
        { value: function (item) { return item.share; } }
      ]);
    }
  }

  function renderSpendingPie(payload) {
    var rows = uniqueRows(toArray(payload.spending_pie)).filter(function (row) {
      return toNumber(row.value_mld) !== null || toNumber(row.share_percent) !== null;
    });
    drawPieChart(chartIds.spendingPie, rows, "value_mld", "label", {
      title: "Spese",
      emptyText: "Nessuna ripartizione della spesa disponibile.",
      formatter: function (v) { return formatMld(v, 1); }
    });

    var rowsBody = byId("bpSpendingPieRows");
    if (rowsBody) {
      var tableRows = rows
        .sort(function (a, b) {
          return (toNumber(b.value_mld) || 0) - (toNumber(a.value_mld) || 0);
        })
        .map(function (row) {
          return {
            rowLabel: asText(row.label || row.code || "-"),
            value: formatMld(toNumber(row.value_mld), 1),
            share: formatPercent(toNumber(row.share_percent), 1)
          };
        });
      createTableRows(rowsBody, tableRows, [
        { value: function (item) { return item.rowLabel; } },
        { value: function (item) { return item.value; } },
        { value: function (item) { return item.share; } }
      ]);
    }
  }

  function renderRevenueTrend(payload) {
    var rows = uniqueRows(toArray(payload.revenue_category_series))
      .filter(function (row) {
        return row && row.series && Array.isArray(row.series) && row.series.length;
      })
      .sort(function (a, b) {
        return (toNumber(b.latest_value_mld) || 0) - (toNumber(a.latest_value_mld) || 0);
      })
      .slice(0, 5);

    var series = rows.map(function (row, index) {
      return {
        label: asText(row.label || row.code || ("Entrata " + (index + 1))),
        color: palette[index % palette.length],
        points: row.series
          .map(function (point) {
            return { year: toNumber(point.year), value: toNumber(point.value_mld) };
          })
          .filter(function (point) {
            return point.year !== null && point.value !== null;
          })
      };
    }).filter(function (line) {
      return line.points.length > 1;
    });
    drawLineChart(chartIds.revenueTrend, series, {
      title: "Serie storiche entrate principali",
      unit: "mld",
      yFormatter: function (value) { return formatMld(value, 1); }
    });
  }

  function renderSpendingTrend(payload) {
    var rows = uniqueRows(toArray(payload.spending_category_series))
      .filter(function (row) {
        return row && row.series && Array.isArray(row.series) && row.series.length;
      })
      .sort(function (a, b) {
        return (toNumber(b.latest_value_mld) || 0) - (toNumber(a.latest_value_mld) || 0);
      })
      .slice(0, 5);

    var series = rows.map(function (row, index) {
      return {
        label: asText(row.label || row.code || ("Spesa " + (index + 1))),
        color: palette[(index + 2) % palette.length],
        points: row.series
          .map(function (point) {
            return { year: toNumber(point.year), value: toNumber(point.value_mld) };
          })
          .filter(function (point) {
            return point.year !== null && point.value !== null;
          })
      };
    }).filter(function (line) { return line.points.length > 1; });

    drawLineChart(chartIds.spendingTrend, series, {
      title: "Serie storiche spesa per funzione",
      unit: "mld",
      yFormatter: function (value) { return formatMld(value, 1); }
    });
  }

  function renderIrpefBand(payload) {
    var declaration = payload.declaration_summary || {};
    var bands = toArray(declaration.bands);
    var shares = {};
    toArray(declaration.share_by_band).forEach(function (item) {
      shares[item.band] = {
        tax_share: toNumber(item.tax_share),
        contributors_share: toNumber(item.contributors_share)
      };
    });

    if (!bands.length) {
      bands = toArray(payload.irpef_by_band);
    }
    var sorted = bands.sort(function (a, b) {
      return asText(a.band).localeCompare(asText(b.band), "it");
    });
    var body = byId("bpIrpefBandTable");
    if (!body) return;

    createTableRows(body, sorted, [
      {
        value: function (row) {
          return asText(row.band);
        }
      },
      {
        value: function (row) {
          return formatPlain(toNumber(row.contributors || 0));
        }
      },
      {
        value: function (row) {
          return formatDecimal((shares[row.band] && shares[row.band].contributors_share), 1) + (shares[row.band] ? "%" : "");
        }
      },
      {
        value: function (row) {
          return formatMld(row.tax_mld !== undefined ? row.tax_mld : row.value_mld, 1);
        }
      },
      {
        value: function (row) {
          return formatPercent((shares[row.band] && shares[row.band].tax_share), 1);
        }
      }
    ]);
  }

  function renderTaxTypeTrend(payload) {
    var rows = toArray(payload.tax_revenue_by_type)
      .filter(function (row) { return toNumber(row.year) !== null; });
    if (!rows.length) {
      setMessage(byId(chartIds.taxTypeTrend), "Nessun trend entrate dirette/indirette.");
      return;
    }
    var firstRow = rows[0] || {};
    var typeKeys = Object.keys(firstRow).filter(function (key) { return key !== "year"; })
      .filter(function (key) { return rows.some(function (row) { return toNumber(row[key]) !== null; }); });

    var series = typeKeys.map(function (key, index) {
      return {
        label: asText(key),
        color: palette[index % palette.length],
        points: rows
          .map(function (row) {
            return { year: toNumber(row.year), value: toNumber(row[key]) };
          })
          .filter(function (point) {
            return point.year !== null && point.value !== null;
          })
      };
    }).filter(function (line) { return line.points.length > 1; });

    drawLineChart(chartIds.taxTypeTrend, series, {
      title: "Entrate dirette e indirette",
      unit: "mld",
      yFormatter: function (value) { return formatMld(value, 1); }
    });
  }

  function renderRevenueFocus(payload) {
    var rows = toArray(payload.revenue_items).map(function (row) {
      return row;
    }).sort(function (a, b) {
      return (toNumber(b.value_mld) || 0) - (toNumber(a.value_mld) || 0);
    });
    var body = byId("bpRevenueFocusRows");
    if (!body) return;
    createTableRows(body, rows, [
      {
        value: function (row) { return asText(row.label || row.code || "Voci"); }
      },
      {
        value: function (row) {
          if (row.status) return "N/D";
          return formatMld(toNumber(row.value) || toNumber(row.value_mld), 1);
        }
      },
      {
        value: function (row) { return asText(row.source || "—"); }
      },
      {
        value: function (row) { return asText(row.year || "—"); }
      }
    ]);
    var hasNote = rows.some(function (row) { return row.status; }) || rows.some(function (row) { return row.note; });
    if (hasNote) {
      var warningRow = byId("bpMethodNotes");
      if (warningRow) {
        var extra = document.createElement("li");
        extra.textContent = "Nota: alcune voci di entrata (es. cedolare secca, TARI) risultano non disponibili in questo export e sono riportate con N/D.";
        warningRow.appendChild(extra);
      }
    }
  }

  function renderUnder500(payload) {
    var block = payload.under_500m_revenue_summary || {};
    var entries = toArray(block.entries);
    var body = byId("bpUnder500Rows");
    if (!body) return;
    if (entries.length) {
      createTableRows(body, entries, [
        {
          value: function (row) { return asText(row.code || row.label || "Voce"); }
        },
        {
          value: function (row) { return asText(row.year || block.year || "—"); }
        },
        {
          value: function (row) {
            var value = toNumber(row.value_mld) || toNumber(row.value);
            return value === null ? "—" : formatMld(value, 1);
          }
        },
        {
          value: function (row) {
            var share = toNumber(row.share_of_total_percent) || toNumber(row.share_percent);
            return share === null ? "—" : formatPercent(share, 1);
          }
        }
      ]);
    } else {
      clear(body);
      var empty = document.createElement("tr");
      var td = document.createElement("td");
      td.colSpan = 4;
      td.textContent = "Non risultano voci sotto 0,5 mld in questo payload.";
      empty.appendChild(td);
      body.appendChild(empty);
    }

    var meta = byId("bpUnder500Meta");
    if (meta) {
      if (entries.length) {
        meta.textContent = "Totale sotto 0,5 mld: " + formatMld(block.under_500_total_mld, 2) +
          " (cumulo: " + formatPercent(block.under_500_share_of_total_percent, 1) + ")";
      } else {
        meta.textContent = asText(block.note);
      }
    }
  }

  function renderSpendingFocus(payload) {
    var rows = uniqueRows(toArray(payload.spending_focus)).sort(function (a, b) {
      return (toNumber(b.value) || 0) - (toNumber(a.value) || 0);
    });
    var body = byId("bpSpendingFocusRows");
    if (!body) return;
    createTableRows(body, rows, [
      {
        value: function (row) { return asText(row.label || row.code || "Voce"); }
      },
      {
        value: function (row) {
          var value = toNumber(row.value) || toNumber(row.value_mld);
          return formatMld(value, 1);
        }
      },
      {
        value: function (row) {
          var value = toNumber(row.value_pil_percent);
          return value === null ? "—" : formatPercent(value, 1);
        }
      },
      {
        value: function (row) {
          var value = toNumber(row.share_spesa_totale);
          return value === null ? "—" : formatPercent(value, 1);
        }
      },
      {
        value: function (row) { return asText(row.source || "—"); }
      },
      {
        value: function (row) { return asText(row.year || row.year_to || "—"); }
      }
    ]);
  }

  function normalizePeerRows(payload) {
    var rows = toArray(payload.peer);
    return rows
      .map(function (row) {
        return {
          country: asText(row.country || row.paese || row.code),
          code: asText(row.code || row.paese),
          value: toNumber(row[STATE.peerMetric]),
          year: row[STATE.peerMetric === "tax_pressure" ? "tax_year" : (STATE.peerMetric === "public_spending" ? "spending_year" : "social_year")] || row.year
        };
      })
      .filter(function (row) { return row.value !== null && row.country !== "—"; })
      .sort(function (a, b) { return b.value - a.value; })
      .slice(0, 12);
  }

  function renderPeer(payload) {
    var control = byId("bpPeerMetric");
    if (control && !control.options.length) {
      Object.keys(peerMetricMeta).forEach(function (key) {
        var option = document.createElement("option");
        option.value = key;
        option.textContent = peerMetricMeta[key].label;
        control.appendChild(option);
      });
      control.value = STATE.peerMetric;
    }
    if (control && control.value && control.value !== STATE.peerMetric) {
      STATE.peerMetric = control.value;
    }

    var rows = normalizePeerRows(payload);
    if (!rows.length) {
      setMessage(byId(chartIds.peerBars), "Nessun confronto paese disponibile.");
      var rowsFallback = byId("bpPeerRows");
      if (rowsFallback) {
        createTableRows(rowsFallback, [], []);
      }
      return;
    }

    var metricLabel = peerMetricMeta[STATE.peerMetric] || {};
    var rowsForChart = rows.map(function (row, index) {
      return {
        label: row.code,
        value: row.value,
        country: row.country,
        year: row.year,
        color: (row.code === "IT" || row.code === "ITALY" || row.country === "Italia") ? "#f95f1a" : palette[index % palette.length]
      };
    });

    drawHorizontalBars(chartIds.peerBars, rowsForChart, "value", {
      formatter: function (value) {
        return formatDecimal(value, 1) + " " + (metricLabel.unit || "");
      },
      xTitle: asText(metricLabel.label) + " " + asText(metricLabel.unit),
      yTitle: "Paese",
      emptyText: "Nessun confronto paese disponibile."
    });

    var body = byId("bpPeerRows");
    if (!body) return;
    createTableRows(body, rows, [
      {
        value: function (row, index) {
          return asText(index + 1);
        }
      },
      {
        value: function (row) { return asText(row.country); }
      },
      {
        value: function (row) { return asText(row.code); }
      },
      {
        value: function (row) {
          return formatDecimal(row.value, 1) + " " + asText(metricLabel.unit);
        }
      }
    ]);
  }

  function renderAll(payload) {
    renderKpis(payload);
    renderMeta(payload);
    renderTopTaxes(payload);
    renderTaxTrend(payload);
    renderRevenuePie(payload);
    renderSpendingPie(payload);
    renderRevenueTrend(payload);
    renderSpendingTrend(payload);
    renderIrpefBand(payload);
    renderTaxTypeTrend(payload);
    renderRevenueFocus(payload);
    renderUnder500(payload);
    renderSpendingFocus(payload);
    renderPeer(payload);
  }

  function onPeerMetricChange(event) {
    var value = event.target.value;
    STATE.peerMetric = value;
    if (STATE.payload) {
      renderPeer(STATE.payload);
    }
  }

  function renderDashboard() {
    if (!STATE.payload) return;
    renderAll(STATE.payload);
  }

  function init() {
    var status = byId("bpStatus");
    if (status) {
      status.textContent = "Caricamento dati in corso...";
    }

    fetch(DATA_URL, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Errore HTTP " + response.status);
        }
        return response.json();
      })
      .then(function (payload) {
        STATE.payload = payload;
        renderDashboard();
      })
      .catch(function (error) {
        var statusNode = byId("bpStatus");
        if (statusNode) statusNode.textContent = "Errore nel caricamento dei dati: " + error.message;
      });

    var peerMetricSelect = byId("bpPeerMetric");
    if (peerMetricSelect) {
      peerMetricSelect.addEventListener("change", onPeerMetricChange);
    }

    if (!window.__bpResizeAttached) {
      window.__bpResizeAttached = true;
      window.addEventListener("resize", function () {
        if (STATE.payload) {
          clearTimeout(window.__bpResizeTimer);
          window.__bpResizeTimer = window.setTimeout(renderDashboard, 300);
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
