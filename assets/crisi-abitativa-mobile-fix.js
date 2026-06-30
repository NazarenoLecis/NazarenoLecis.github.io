(function () {
  function isHousingDashboard() {
    return location.pathname.indexOf("/dashboard/crisi-abitativa/") >= 0;
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function injectStyle() {
    if (byId("housingMobileFixStyle")) return;
    var style = document.createElement("style");
    style.id = "housingMobileFixStyle";
    style.textContent = [
      ".housing-kpis .kpi{min-width:0;overflow:hidden}",
      ".housing-kpis .kpi strong,.housing-kpis .kpi strong *{color:var(--orange)!important;-webkit-text-fill-color:var(--orange)!important}",
      ".housing-kpis .kpi strong{font-size:clamp(1.75rem,3.4vw,2.85rem);line-height:1.02;letter-spacing:-.055em;overflow-wrap:normal;word-break:normal}",
      ".housing-kpis .kpi>span{min-height:2.2em;display:block}",
      ".housing-kpi-token{white-space:nowrap}",
      "@media(max-width:760px){",
      ".housing-kpis{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important}",
      ".housing-kpis .kpi{padding:13px 10px!important;min-height:128px!important}",
      ".housing-kpis .kpi>span{font-size:.72rem!important;line-height:1.15!important;letter-spacing:-.02em!important}",
      ".housing-kpis .kpi strong{font-size:clamp(1.35rem,7vw,2rem)!important;line-height:1.03!important;letter-spacing:-.06em!important}",
      ".housing-kpis #kpiRange{font-size:clamp(1.05rem,4.9vw,1.45rem)!important;line-height:1.08!important}",
      ".housing-kpis #kpiYear{font-size:clamp(1.55rem,8vw,2.15rem)!important}",
      "}"
    ].join("");
    document.head.appendChild(style);
  }

  function compactValue(text) {
    return String(text || "")
      .replace(/\s*%\s+della popolazione/gi, "%")
      .replace(/\s*%\s+del(?:la)?\s+popolazione/gi, "%")
      .replace(/\s*%\s+del\s+reddito(?:\s+disponibile)?/gi, "% reddito")
      .replace(/(\d)\s+%/g, "$1%")
      .replace(/\s+-\s+/g, "–");
  }

  function indicatorShortLabel() {
    var title = (byId("europeTitle") && byId("europeTitle").textContent) || "indicatore";
    return title
      .replace(/Costi abitativi oltre il 40% del reddito/i, "costi >40% reddito")
      .replace(/percentuale della popolazione/ig, "% pop.")
      .replace(/della popolazione/ig, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 34);
  }

  function setLabel(id, text) {
    var element = byId(id);
    if (element && element.textContent !== text) element.textContent = text;
  }

  function clarifyLabels() {
    var label = indicatorShortLabel();
    setLabel("kpiItalyLabel", "Italia — " + label);
    var range = byId("kpiRange") && byId("kpiRange").parentElement && byId("kpiRange").parentElement.querySelector("span");
    if (range && range.textContent !== "Paesi min–max — " + label) range.textContent = "Paesi min–max — " + label;
    var year = byId("kpiYear") && byId("kpiYear").parentElement && byId("kpiYear").parentElement.querySelector("span");
    if (year && year.textContent !== "Anno ultimo dato") year.textContent = "Anno ultimo dato";
  }

  function wrapTokens(text) {
    var safe = String(text || "");
    return safe.replace(/(\d+(?:,\d+)?%)/g, '<span class="housing-kpi-token">$1</span>');
  }

  function compactKpis() {
    clarifyLabels();
    ["kpiItaly", "kpiRange", "kpiYear"].forEach(function (id) {
      var element = byId(id);
      if (!element) return;
      var compact = compactValue(element.textContent);
      var wrapped = wrapTokens(compact);
      if (element.innerHTML !== wrapped) {
        element.innerHTML = wrapped;
      }
    });
  }

  function init() {
    if (!isHousingDashboard()) return;
    injectStyle();
    compactKpis();
    if (!document.body) return;
    var observer = new MutationObserver(function () {
      compactKpis();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
