(function () {
  "use strict";

  var PIE_IDS = ["bpRevenuePie", "bpSpendingPie"];

  function isCompact() {
    return window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
  }

  function tunePie(id) {
    var node = document.getElementById(id);
    if (!node || !window.Plotly || !node.data || !node.data.length) return;

    if (!isCompact()) return;

    window.Plotly.restyle(node, {
      textinfo: "percent",
      textposition: "inside",
      insidetextorientation: "horizontal"
    }).catch(function () {});

    window.Plotly.relayout(node, {
      height: 390,
      margin: { t: 4, r: 4, b: 4, l: 4 },
      showlegend: false,
      uniformtext: { minsize: 11, mode: "hide" }
    }).catch(function () {});
  }

  function tuneAll() {
    PIE_IDS.forEach(tunePie);
  }

  function schedule() {
    tuneAll();
    window.setTimeout(tuneAll, 250);
    window.setTimeout(tuneAll, 800);
  }

  function observeCharts() {
    if (!window.MutationObserver) return;
    PIE_IDS.forEach(function (id) {
      var node = document.getElementById(id);
      if (!node) return;
      var observer = new MutationObserver(function () {
        window.clearTimeout(node.__bpPieFixTimer);
        node.__bpPieFixTimer = window.setTimeout(tuneAll, 80);
      });
      observer.observe(node, { childList: true, subtree: true });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      schedule();
      observeCharts();
    });
  } else {
    schedule();
    observeCharts();
  }

  window.addEventListener("resize", schedule);
})();
