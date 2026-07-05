(function () {
  "use strict";

  var PIE_IDS = ["bpRevenuePie", "bpSpendingPie"];
  var OBSERVED_CHART_IDS = ["bpRevenuePie", "bpSpendingPie", "bpUnder500Chart"];

  function isCompact() {
    return window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
  }

  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function toNumber(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function shortLabel(value) {
    var text = String(value || "").replace(/\s+/g, " ").trim();
    if (text.length <= 32) return text;
    return text.slice(0, 29).trim() + "...";
  }

  function formatMld(value) {
    var n = toNumber(value);
    if (n === null) return "";
    return n.toLocaleString("it-IT", {
      maximumFractionDigits: 3,
      minimumFractionDigits: 0
    });
  }

  function tunePie(id) {
    var node = document.getElementById(id);
    if (!node || !window.Plotly || !node.data || !node.data.length) return;
    if (!isCompact()) return;
    window.Plotly.restyle(node, { textinfo: "percent", textposition: "inside", insidetextorientation: "horizontal" }).catch(function () {});
    window.Plotly.relayout(node, { height: 390, margin: { t: 4, r: 4, b: 4, l: 4 }, showlegend: false, uniformtext: { minsize: 11, mode: "hide" } }).catch(function () {});
  }

  function readUnder500Rows(node) {
    var bar = node.data && node.data.find(function (trace) {
      return trace.type === "bar" && Array.isArray(trace.x) && Array.isArray(trace.y);
    });
    if (!bar) return null;
    if (bar.orientation === "h") {
      return bar.y.map(function (label, index) { return { label: String(label || ""), value: toNumber(bar.x[index]) }; }).filter(function (row) { return row.label && row.value !== null; });
    }
    return bar.x.map(function (label, index) { return { label: String(label || ""), value: toNumber(bar.y[index]) }; }).filter(function (row) { return row.label && row.value !== null; });
  }

  function tuneUnder500() {
    var node = document.getElementById("bpUnder500Chart");
    if (!node || !window.Plotly || !node.data || !node.data.length) return;
    if (!isCompact()) return;
    var freshRows = readUnder500Rows(node);
    if (freshRows && freshRows.length) { node.__bpUnder500Rows = freshRows; node.__bpUnder500Tuned = false; }
    if (node.__bpUnder500Tuned) return;
    if (!node.__bpUnder500Rows || !node.__bpUnder500Rows.length) return;
    var rows = node.__bpUnder500Rows.slice().sort(function (a, b) { return b.value - a.value; }).slice(0, 8).reverse();
    node.__bpUnder500Tuned = true;
    window.Plotly.react(node, [{ type: "bar", orientation: "h", x: rows.map(function (row) { return row.value; }), y: rows.map(function (row) { return shortLabel(row.label); }), customdata: rows.map(function (row) { return row.label; }), marker: { color: cssVar("--orange", "#ff5a1f") }, text: rows.map(function (row) { return formatMld(row.value); }), textposition: "auto", hovertemplate: "%{customdata}<br>%{x:.3f} miliardi di euro<extra></extra>" }], { height: 430, margin: { t: 6, r: 8, b: 44, l: 170 }, showlegend: false, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: cssVar("--text", "#f5f2ed"), family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", size: 12 }, xaxis: { title: "Miliardi di euro", fixedrange: true, gridcolor: cssVar("--line", "#303030"), zerolinecolor: cssVar("--line", "#303030"), tickfont: { color: cssVar("--muted", "#b9b2aa") }, titlefont: { color: cssVar("--muted", "#b9b2aa") }, automargin: false }, yaxis: { title: "", fixedrange: true, tickfont: { color: cssVar("--muted", "#b9b2aa") }, automargin: false } }, { responsive: true, displayModeBar: false, scrollZoom: false, doubleClick: false, showTips: false }).catch(function () { node.__bpUnder500Tuned = false; });
  }

  function tuneAll() { PIE_IDS.forEach(tunePie); tuneUnder500(); }
  function schedule() { tuneAll(); [250, 800, 1500, 2500].forEach(function (delay) { window.setTimeout(tuneAll, delay); }); }
  function loadExternalScript(flag, src) { if (document.querySelector("script[" + flag + "]")) return; var script = document.createElement("script"); script.defer = true; script.setAttribute(flag, "true"); script.src = src; document.body.appendChild(script); }
  function loadSpendingOptionsScript() { loadExternalScript("data-bp-spending-options", "../../assets/bilancio-pubblico-spending-options.js?v=20260705-base100"); }

  function observeCharts() {
    if (!window.MutationObserver) return;
    OBSERVED_CHART_IDS.forEach(function (id) {
      var node = document.getElementById(id);
      if (!node) return;
      var observer = new MutationObserver(function () { window.clearTimeout(node.__bpChartFixTimer); node.__bpChartFixTimer = window.setTimeout(tuneAll, 80); });
      observer.observe(node, { childList: true, subtree: true });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { schedule(); observeCharts(); loadSpendingOptionsScript(); });
  } else { schedule(); observeCharts(); loadSpendingOptionsScript(); }

  window.addEventListener("resize", function () { var under500 = document.getElementById("bpUnder500Chart"); if (under500) under500.__bpUnder500Tuned = false; schedule(); });
})();
