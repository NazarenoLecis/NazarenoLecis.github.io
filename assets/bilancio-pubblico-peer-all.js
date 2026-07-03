(function () {
  "use strict";

  if (window.__bpPeerAllLoaded) return;
  window.__bpPeerAllLoaded = true;

  var URL = "https://data.nazarenolecis.com/bilancio-pubblico/dashboard.json";
  var current = "tax_pressure";
  var payloadPromise = null;
  var latestPayload = null;
  var defs = {
    tax_pressure: "% PIL",
    public_spending: "% PIL",
    social_spending: "% PIL"
  };

  function n(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function a(value) { return Array.isArray(value) ? value : []; }
  function byId(id) { return document.getElementById(id); }

  function css(name, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  function fmt(value) {
    var parsed = n(value);
    return parsed === null ? "-" : parsed.toLocaleString("it-IT", { maximumFractionDigits: 1 });
  }

  function rows(payload) {
    return a(payload.peer).map(function (row) {
      return {
        name: String(row.country || row.paese || row.code || "-"),
        code: String(row.code || row.codice || row.paese || "-"),
        value: n(row[current])
      };
    }).filter(function (row) {
      return row.value !== null;
    }).sort(function (left, right) {
      return right.value - left.value;
    });
  }

  function table(list, unit) {
    var body = byId("bpPeerRows");
    if (!body) return;
    body.innerHTML = "";
    list.forEach(function (row, index) {
      var tr = document.createElement("tr");
      [String(index + 1), row.name, row.code, fmt(row.value) + " " + unit].forEach(function (value) {
        var td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
  }

  function chart(list, unit) {
    var node = byId("bpPeerBars");
    if (!node || !window.Plotly) return;
    var data = list.slice().reverse();
    window.Plotly.react(node, [{
      type: "bar",
      orientation: "h",
      x: data.map(function (row) { return row.value; }),
      y: data.map(function (row) { return row.code; }),
      customdata: data.map(function (row) { return row.name; }),
      marker: {
        color: data.map(function (row) {
          return row.code === "IT" ? css("--orange", "#ff5a1f") : "#4e79a7";
        })
      },
      hovertemplate: "%{customdata}<br>%{x:.1f} " + unit + "<extra></extra>"
    }], {
      height: Math.min(900, Math.max(560, list.length * 24)),
      margin: { t: 18, r: 24, b: 46, l: 96 },
      showlegend: false,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: css("--text", "#f5f2ed"), family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", size: 12 },
      xaxis: { title: unit, fixedrange: true, gridcolor: css("--line", "#303030"), tickfont: { color: css("--muted", "#b9b2aa") } },
      yaxis: { title: "", fixedrange: true, automargin: true, tickfont: { color: css("--muted", "#b9b2aa") } }
    }, { responsive: true, displayModeBar: false, scrollZoom: false, doubleClick: false, showTips: false }).catch(function () {});
  }

  function labels() {
    document.querySelectorAll("h2").forEach(function (heading) {
      if (heading.textContent.trim() === "Tasse dirette e indirette") {
        heading.textContent = "Imposte dirette e indirette";
      }
    });
    var taxType = byId("bpTaxTypeTrend");
    if (taxType && taxType.getAttribute("aria-label") === "Tasse dirette e indirette") {
      taxType.setAttribute("aria-label", "Imposte dirette e indirette");
    }
  }

  function render(payload) {
    labels();
    latestPayload = payload || latestPayload || {};
    var select = byId("bpPeerMetric");
    if (select && select.value) current = select.value;
    var unit = defs[current] || "% PIL";
    var list = rows(latestPayload);
    if (!list.length) return;
    chart(list, unit);
    table(list, unit);
  }

  function load() {
    labels();
    if (!window.fetch) return;
    if (!payloadPromise) {
      payloadPromise = window.fetch(URL, { cache: "no-store" }).then(function (response) {
        if (!response.ok) throw new Error("dashboard json");
        return response.json();
      });
    }
    payloadPromise.then(render).catch(function () {});
  }

  function bindControls() {
    var select = byId("bpPeerMetric");
    if (!select || select.__bpPeerAllBound) return;
    select.__bpPeerAllBound = true;
    select.addEventListener("change", function () { render(latestPayload); });
  }

  function start() {
    bindControls();
    load();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  if (window.MutationObserver) {
    new MutationObserver(function () {
      window.clearTimeout(window.__bpPeerAllThemeTimer);
      window.__bpPeerAllThemeTimer = window.setTimeout(function () { render(latestPayload); }, 160);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }
})();
