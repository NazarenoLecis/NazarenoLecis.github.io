(function () {
  "use strict";

  var URL = "https://data.nazarenolecis.com/bilancio-pubblico/dashboard.json";
  var current = "tax_pressure";
  var defs = {
    tax_pressure: { unit: "% PIL", year: "tax_year" },
    public_spending: { unit: "% PIL", year: "spending_year" },
    social_spending: { unit: "% PIL", year: "social_year" }
  };

  function n(v) { var x = Number(v); return Number.isFinite(x) ? x : null; }
  function t(v) { return v === null || v === undefined || v === "" ? "-" : String(v); }
  function a(v) { return Array.isArray(v) ? v : []; }
  function id(v) { return document.getElementById(v); }
  function f(v) { var x = n(v); return x === null ? "-" : x.toLocaleString("it-IT", { maximumFractionDigits: 1 }); }
  function css(name, fallback) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; }

  function rows(payload) {
    return a(payload.peer).map(function (r) {
      return { name: t(r.country || r.paese || r.code), code: t(r.code || r.codice || r.paese), value: n(r[current]) };
    }).filter(function (r) { return r.value !== null; }).sort(function (x, y) { return y.value - x.value; });
  }

  function table(list, def) {
    var body = id("bpPeerRows");
    if (!body) return;
    body.innerHTML = "";
    list.forEach(function (r, i) {
      var tr = document.createElement("tr");
      [String(i + 1), r.name, r.code, f(r.value) + " " + def.unit].forEach(function (v) {
        var td = document.createElement("td");
        td.textContent = v;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
  }

  function chart(list, def) {
    var node = id("bpPeerBars");
    if (!node || !window.Plotly) return;
    var data = list.slice().reverse();
    window.Plotly.react(node, [{
      type: "bar",
      orientation: "h",
      x: data.map(function (r) { return r.value; }),
      y: data.map(function (r) { return r.code; }),
      customdata: data.map(function (r) { return r.name; }),
      marker: { color: data.map(function (r) { return r.code === "IT" ? css("--orange", "#ff5a1f") : "#4e79a7"; }) },
      hovertemplate: "%{customdata}<br>%{x:.1f} " + def.unit + "<extra></extra>"
    }], {
      height: Math.max(520, list.length * 22),
      margin: { t: 18, r: 24, b: 44, l: 92 },
      showlegend: false,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: css("--text", "#f5f2ed"), family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", size: 12 },
      xaxis: { title: def.unit, fixedrange: true, gridcolor: css("--line", "#303030"), tickfont: { color: css("--muted", "#b9b2aa") } },
      yaxis: { title: "", fixedrange: true, tickfont: { color: css("--muted", "#b9b2aa") } }
    }, { responsive: true, displayModeBar: false, scrollZoom: false, doubleClick: false, showTips: false }).catch(function () {});
  }

  function labels() {
    document.querySelectorAll("h2").forEach(function (h) {
      if (h.textContent.trim() === "Tasse dirette e indirette") h.textContent = "Imposte dirette e indirette";
    });
  }

  function render(payload) {
    var select = id("bpPeerMetric");
    if (select && select.value) current = select.value;
    var def = defs[current] || defs.tax_pressure;
    var list = rows(payload || {});
    if (!list.length) return;
    chart(list, def);
    table(list, def);
  }

  function start() {
    labels();
    window.fetch(URL).then(function (r) { return r.json(); }).then(function (p) {
      var select = id("bpPeerMetric");
      if (select) select.addEventListener("change", function () { render(p); });
      render(p);
    }).catch(function () {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(start, 1200); setTimeout(start, 2600); });
  else { setTimeout(start, 1200); setTimeout(start, 2600); }
})();
