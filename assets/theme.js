(function () {
  var themeScript = document.currentScript;
  var dashboardPlotlyNoZoomHooked = false;
  var dashboardPlotlyNoZoomPatched = false;
  var dashboardPlotlyTouchGuardInstalled = false;

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch (error) {}

    document.querySelectorAll(".sun,.theme-toggle").forEach(function (button) {
      button.textContent = theme === "light" ? "☾" : "☼";
      button.setAttribute("role", "button");
      button.setAttribute("tabindex", "0");
      button.setAttribute("aria-label", theme === "light" ? "Passa al tema scuro" : "Passa al tema chiaro");
    });

    restylePlotlyCharts(theme);
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: theme } }));
  }

  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function restylePlotlyCharts(theme) {
    if (!window.Plotly || !window.Plotly.relayout) return;
    var text = cssVar("--text", theme === "light" ? "#17120f" : "#f5f2ed");
    var muted = cssVar("--muted", theme === "light" ? "#5f574f" : "#b9b2aa");
    var line = cssVar("--line", theme === "light" ? "#ddd4ca" : "#303030");
    var panel = cssVar("--panel", theme === "light" ? "#fffaf4" : "#090909");

    document.querySelectorAll(".js-plotly-plot").forEach(function (chart) {
      var update = {
        "font.color": text,
        "hoverlabel.bgcolor": panel,
        "hoverlabel.bordercolor": line,
        "hoverlabel.font.color": text,
        "legend.font.color": muted
      };
      var layout = chart._fullLayout || {};
      Object.keys(layout).forEach(function (key) {
        if (/^[xy]axis[0-9]*$/.test(key)) {
          update[key + ".gridcolor"] = line;
          update[key + ".zerolinecolor"] = line;
          update[key + ".linecolor"] = line;
          update[key + ".tickfont.color"] = muted;
          update[key + ".title.font.color"] = text;
        }
      });
      if (Array.isArray(layout.annotations)) {
        layout.annotations.forEach(function (_, index) {
          update["annotations[" + index + "].font.color"] = text;
        });
      }
      window.Plotly.relayout(chart, update).catch(function () {});
    });
  }

  function dashboardPlotlyNoZoomButtons(config) {
    var blocked = [
      "zoom2d",
      "pan2d",
      "select2d",
      "lasso2d",
      "zoomIn2d",
      "zoomOut2d",
      "autoScale2d",
      "resetScale2d",
      "hoverClosestCartesian",
      "hoverCompareCartesian"
    ];
    var existing = (config && Array.isArray(config.modeBarButtonsToRemove)) ? config.modeBarButtonsToRemove : [];
    blocked.forEach(function (button) {
      if (existing.indexOf(button) < 0) existing.push(button);
    });
    return existing;
  }

  function dashboardPlotlyNoZoomConfig(config) {
    return Object.assign({}, config || {}, {
      responsive: true,
      displayModeBar: false,
      displaylogo: false,
      scrollZoom: false,
      doubleClick: false,
      showTips: false,
      modeBarButtonsToRemove: dashboardPlotlyNoZoomButtons(config)
    });
  }

  function dashboardPlotlyAxisNames(layout) {
    var names = ["xaxis", "yaxis"];
    Object.keys(layout || {}).forEach(function (name) {
      if (/^[xy]axis[0-9]*$/.test(name) && names.indexOf(name) < 0) names.push(name);
    });
    return names;
  }

  function dashboardPlotlyNoZoomLayout(layout) {
    var output = Object.assign({}, layout || {});
    output.dragmode = false;
    dashboardPlotlyAxisNames(output).forEach(function (axis) {
      output[axis] = Object.assign({}, output[axis] || {}, { fixedrange: true });
    });
    ["polar", "polar2", "polar3", "polar4"].forEach(function (polar) {
      if (!output[polar]) return;
      output[polar] = Object.assign({}, output[polar]);
      output[polar].radialaxis = Object.assign({}, output[polar].radialaxis || {}, { fixedrange: true });
      output[polar].angularaxis = Object.assign({}, output[polar].angularaxis || {}, { fixedrange: true });
    });
    ["scene", "scene2", "scene3", "scene4"].forEach(function (scene) {
      if (!output[scene]) return;
      output[scene] = Object.assign({}, output[scene], { dragmode: false });
    });
    return output;
  }

  function dashboardPlotlyNoZoomUpdate(chart) {
    var update = { dragmode: false };
    dashboardPlotlyAxisNames(chart && chart._fullLayout).forEach(function (axis) {
      update[axis + ".fixedrange"] = true;
    });
    return update;
  }

  function ensureDashboardPlotlyNoZoomStyle() {
    if (!isDashboardPage() || document.getElementById("dashboardPlotlyNoZoomStyle")) return;
    var style = document.createElement("style");
    style.id = "dashboardPlotlyNoZoomStyle";
    style.textContent = [
      ".js-plotly-plot .modebar{display:none!important}",
      ".js-plotly-plot .nsewdrag,.js-plotly-plot .drag{cursor:default!important}",
      ".js-plotly-plot .draglayer,.js-plotly-plot .nsewdrag{touch-action:pan-x pan-y!important}",
      "@media (pointer:coarse),(hover:none),(max-width:768px){.js-plotly-plot .draglayer,.js-plotly-plot .nsewdrag,.js-plotly-plot .drag{pointer-events:none!important;touch-action:pan-x pan-y!important}}"
    ].join("");
    document.head.appendChild(style);
  }

  function isDashboardPlotlyTouchEvent(event) {
    var target = event.target;
    if (!target || !target.closest || !target.closest(".js-plotly-plot")) return false;
    if (event.type.indexOf("touch") === 0) return true;
    return event.pointerType === "touch";
  }

  function stopDashboardPlotlyTouch(event) {
    if (!isDashboardPlotlyTouchEvent(event)) return;
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
  }

  function installDashboardPlotlyTouchGuard() {
    if (!isDashboardPage() || dashboardPlotlyTouchGuardInstalled || !document.addEventListener) return;
    dashboardPlotlyTouchGuardInstalled = true;
    ["touchstart", "touchmove", "pointerdown", "pointermove"].forEach(function (eventName) {
      document.addEventListener(eventName, stopDashboardPlotlyTouch, { capture: true, passive: true });
    });
  }

  function disableDashboardPlotlyZoomOnCharts() {
    if (!isDashboardPage() || !window.Plotly || !window.Plotly.relayout || !document.body) return;
    ensureDashboardPlotlyNoZoomStyle();
    document.querySelectorAll(".js-plotly-plot").forEach(function (chart) {
      window.Plotly.relayout(chart, dashboardPlotlyNoZoomUpdate(chart)).catch(function () {});
    });
  }

  function patchDashboardPlotlyNoZoom() {
    if (!isDashboardPage() || dashboardPlotlyNoZoomPatched || !window.Plotly || !window.Plotly.react) return false;
    var plotly = window.Plotly;
    var originalReact = plotly.react;
    var originalNewPlot = plotly.newPlot;
    dashboardPlotlyNoZoomPatched = true;
    plotly.react = function (target, data, layout, config) {
      return originalReact.call(plotly, target, data, dashboardPlotlyNoZoomLayout(layout), dashboardPlotlyNoZoomConfig(config));
    };
    if (originalNewPlot) {
      plotly.newPlot = function (target, data, layout, config) {
        return originalNewPlot.call(plotly, target, data, dashboardPlotlyNoZoomLayout(layout), dashboardPlotlyNoZoomConfig(config));
      };
    }
    disableDashboardPlotlyZoomOnCharts();
    return true;
  }

  function scheduleDashboardPlotlyNoZoom() {
    if (!isDashboardPage()) return;
    ensureDashboardPlotlyNoZoomStyle();
    installDashboardPlotlyTouchGuard();
    patchDashboardPlotlyNoZoom();
    disableDashboardPlotlyZoomOnCharts();
    [0, 50, 150, 400, 900, 1800, 3200].forEach(function (delay) {
      window.setTimeout(function () {
        patchDashboardPlotlyNoZoom();
        disableDashboardPlotlyZoomOnCharts();
      }, delay);
    });
  }

  function installDashboardPlotlyNoZoomHook() {
    if (!isDashboardPage() || dashboardPlotlyNoZoomHooked) return;
    dashboardPlotlyNoZoomHooked = true;
    var currentPlotly = window.Plotly;
    try {
      Object.defineProperty(window, "Plotly", {
        configurable: true,
        get: function () {
          return currentPlotly;
        },
        set: function (value) {
          currentPlotly = value;
          scheduleDashboardPlotlyNoZoom();
        }
      });
    } catch (error) {}
    scheduleDashboardPlotlyNoZoom();
  }

  function loadScript(src, key) {
    if (document.querySelector("script[data-" + key + "]")) return;
    var script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.dataset[key] = "1";
    document.head.appendChild(script);
  }

  function loadScriptWhenIdle(src, key) {
    var schedule = window.requestIdleCallback || function (callback) {
      return window.setTimeout(callback, 900);
    };
    schedule(function () {
      loadScript(src, key);
    }, { timeout: 2200 });
  }

  function assetUrl(fileName) {
    var script = themeScript || document.querySelector('script[src*="assets/theme.js"]');
    if (script && script.src) {
      return new URL(fileName, script.src).href;
    }
    return "/assets/" + fileName;
  }

  function ensureFavicon() {
    var link = document.querySelector('link[rel~="icon"]') || document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.href = assetUrl("logo.png");
    if (!link.parentNode) document.head.appendChild(link);
  }

  function isAlmaArticle() {
    return location.pathname.indexOf("/articoli/occupazione-salari-laureati-almalaurea") >= 0;
  }

  function isNativeEnglishPage() {
    return document.documentElement.lang === "en";
  }

  function isHeatDashboard() {
    return location.pathname.indexOf("/dashboard/ciclo-unico-caldo") >= 0;
  }

  function isDashboardPage() {
    return location.pathname.indexOf("/dashboard/") >= 0;
  }

  function removeTopGithubLink() {
    document.querySelectorAll(".site-header .nav a").forEach(function (link) {
      var href = link.getAttribute("href") || "";
      var text = (link.textContent || "").trim().toLowerCase();
      if (text === "github" || href === "https://github.com/NazarenoLecis" || href.indexOf("github.com/NazarenoLecis") >= 0) {
        link.remove();
      }
    });
  }

  function injectSocialStyle() {
    if (document.getElementById("roundSocialStyle")) return;
    var style = document.createElement("style");
    style.id = "roundSocialStyle";
    style.textContent = [
      ".social-links{gap:12px}",
      ".social-link{width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important;padding:0!important;border:1.5px solid var(--orange)!important;border-radius:999px!important;background:transparent!important;color:var(--orange)!important;display:inline-flex!important;align-items:center!important;justify-content:center!important}",
      ".social-link:hover{background:color-mix(in srgb,var(--orange) 12%,transparent)!important;color:var(--orange)!important;border-color:var(--orange)!important}",
      ".social-link svg{width:21px!important;height:21px!important}",
      ".social-link span{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}",
      ".contact-social-links{justify-content:flex-start;margin-top:18px}"
    ].join("");
    document.head.appendChild(style);
  }

  function replaceText(value, replacements) {
    var output = value;
    replacements.forEach(function (pair) {
      output = output.split(pair[0]).join(pair[1]);
    });
    return output;
  }

  function dashboardTextReplacements() {
    var italian = [
      ["Grafico europeo da export statici Eurostat. Focus locale caricato da export statici regionali.", "Indicatori europei Eurostat. Focus locale su quotazioni OMI comunali."],
      ["Nel focus Italia scegli regione e misura OMI. La Sardegna e' caricata di default; gli altri export regionali possono essere aggiunti dallo stesso repository dati.", "Nel focus Italia scegli regione e misura OMI. La Sardegna e' caricata di default; le altre regioni possono essere aggiunte quando disponibili."],
      [", usando un JSON statico gia' aggregato.", "."],
      ["I dati sono salvati come JSON statici per rendere la dashboard piu' veloce e non dipendere dall'API al caricamento della pagina. ", ""],
      ["Questa sezione usa export statici regionali con quotazioni OMI comunali: la Sardegna e' pre-caricata, mentre la struttura permette di aggiungere le altre regioni generando gli stessi JSON.", "Questa sezione usa quotazioni OMI comunali. La Sardegna e' pre-caricata; le altre regioni possono essere aggiunte quando disponibili."],
      ["questo grafico usa un unico JSON statico gia' aggregato. Le barre mostrano", "Le barre mostrano"],
      ["Non riesco a caricare il JSON sullo stock abitativo:", "Non riesco a caricare i dati sullo stock abitativo:"],
      ["Verifica che estat_dwellings_by_construction_period_2021.json sia stato sincronizzato su Cloudflare R2.", "Controlla che i dati sul periodo di costruzione siano disponibili."],
      ["Non riesco a caricare il JSON Eurostat statico:", "Non riesco a caricare i dati Eurostat:"],
      ["Non riesco a caricare l'indice Eurostat statico:", "Non riesco a caricare l'indice Eurostat:"],
      ["Rigenera gli export statici dal repository Crisi_abitativa o controlla che i file siano presenti su Cloudflare R2.", "Controlla che i dati Eurostat siano disponibili."],
      ["Export locale non disponibile", "Focus locale non disponibile"],
      ["Focus locale non ancora esportato. Genera i JSON regionali dal repository Crisi_abitativa e pubblicali su Cloudflare R2.", "Focus locale non disponibile."],
      ["Dataset atteso:", "Dati comunali necessari:"],
      ["un file per regione con geometrie comunali e record con campi", "quotazioni comunali OMI per"],
      ["Eurostat da export statici. Focus locale:", "Eurostat. Focus locale:"],
      ["Il grafico PNRR usa un JSON aggregato regionale leggero, derivato dai progetti 2021-2027 classificati come efficientamento energetico, comfort termico o mitigazione caldo.", "Il grafico PNRR usa un aggregato regionale derivato dai progetti 2021-2027 classificati come efficientamento energetico, comfort termico o mitigazione caldo."],
      ["Indicatori europei Eurostat. Focus locale su quotazioni OMI comunali.", "Indicatori europei Eurostat. Focus locale su quotazioni OMI comunali."],
      ["Nel focus Italia scegli regione e misura OMI. La Sardegna e' caricata di default; le altre regioni possono essere aggiunte quando disponibili.", "Nel focus Italia scegli regione e misura OMI. La Sardegna e' caricata di default; le altre regioni possono essere aggiunte quando disponibili."]
    ];

    var english = [
      ["European chart from static Eurostat exports. Local focus loaded from static regional exports.", "European indicators from Eurostat. Local focus on municipal OMI quotations."],
      ["Indicatori europei Eurostat. Focus locale su quotazioni OMI comunali.", "European indicators from Eurostat. Local focus on municipal OMI quotations."],
      ["In the Italy focus, choose a region and an OMI measure. Sardinia is loaded by default; the other regional exports can be added from the same data repository.", "In the Italy focus, choose a region and an OMI measure. Sardinia is loaded by default; other regions can be added when available."],
      ["Nel focus Italia scegli regione e misura OMI. La Sardegna e' caricata di default; le altre regioni possono essere aggiunte quando disponibili.", "In the Italy focus, choose a region and an OMI measure. Sardinia is loaded by default; other regions can be added when available."],
      [", using an already aggregated static JSON.", "."],
      ["The data are saved as static JSON to keep the dashboard faster and avoid depending on the API at page load. ", ""],
      ["National averages say little about what actually happens in Cagliari, Nuoro, Sassari or inland municipalities. This section uses static regional exports with municipal OMI quotations: Sardinia is preloaded, while the structure allows other regions to be added by generating the same JSON files.", "National averages say little about what actually happens in Cagliari, Nuoro, Sassari or inland municipalities. This section uses municipal OMI quotations. Sardinia is preloaded; other regions can be added when available."],
      ["Questa sezione usa quotazioni OMI comunali. La Sardegna e' pre-caricata; le altre regioni possono essere aggiunte quando disponibili.", "This section uses municipal OMI quotations. Sardinia is preloaded; other regions can be added when available."],
      ["this chart uses a single already aggregated static JSON. The bars show", "The bars show"],
      ["Non riesco a caricare i dati sullo stock abitativo:", "I cannot load the housing-stock data:"],
      ["Check that estat_dwellings_by_construction_period_2021.json has been synced to Cloudflare R2.", "Check that the construction-period data are available."],
      ["Controlla che i dati sul periodo di costruzione siano disponibili.", "Check that the construction-period data are available."],
      ["I cannot load the static Eurostat JSON:", "I cannot load the Eurostat data:"],
      ["I cannot load the static Eurostat index:", "I cannot load the Eurostat index:"],
      ["Check that the Eurostat data have been exported and are available on Cloudflare R2.", "Check that the Eurostat data are available."],
      ["Regenerate the static exports from the Crisi_abitativa repository or check that the files are available on Cloudflare R2.", "Check that the Eurostat data are available."],
      ["Local export not available", "Local focus not available"],
      ["Local focus not exported yet. Generate the regional JSON files from the Crisi_abitativa repository and publish them to Cloudflare R2.", "Local focus not available."],
      ["Expected dataset:", "Required municipal data:"],
      ["one file per region with municipal geometries and records with fields", "municipal OMI quotations for"],
      ["Eurostat from static exports. Local focus:", "Eurostat. Local focus:"],
      ["The NRRP chart uses a lightweight regional aggregate JSON, derived from 2021-2027 projects classified as energy efficiency, thermal comfort or heat mitigation.", "The NRRP chart uses a regional aggregate derived from 2021-2027 projects classified as energy efficiency, thermal comfort or heat mitigation."],
      ["Il grafico PNRR usa un aggregato regionale derivato dai progetti 2021-2027 classificati come efficientamento energetico, comfort termico o mitigazione caldo.", "The NRRP chart uses a regional aggregate derived from 2021-2027 projects classified as energy efficiency, thermal comfort or heat mitigation."]
    ];

    return document.documentElement.lang === "en" ? english : italian;
  }

  function removeDashboardTechnicalBlocks() {
    var patterns = [
      "La dashboard del sito consuma dati gia' puliti o endpoint pubblici.",
      "Per aggiornare il focus locale bisogna esportare dal repository Python i JSON regionali",
      "The site dashboard consumes already cleaned data or public endpoints.",
      "To update the local focus, export the regional JSON files",
      "crisi-abitativa/regions/",
      "local_index.json"
    ];

    document.querySelectorAll("p,li").forEach(function (node) {
      var text = (node.textContent || "").replace(/\s+/g, " ").trim();
      if (patterns.some(function (pattern) { return text.indexOf(pattern) >= 0; })) {
        node.remove();
      }
    });
  }

  function cleanDashboardTechnicalText() {
    if (!isDashboardPage() || !document.body || cleanDashboardTechnicalText.running) return;
    cleanDashboardTechnicalText.running = true;
    removeDashboardTechnicalBlocks();

    var replacements = dashboardTextReplacements();
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentElement;
        if (!parent || parent.closest("script,style,noscript,svg,canvas")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var updated = replaceText(node.nodeValue, replacements);
      if (updated !== node.nodeValue) node.nodeValue = updated;
    });
    cleanDashboardTechnicalText.running = false;
  }

  function observeDashboardText() {
    if (!isDashboardPage() || !document.body) return;
    var scheduled = false;
    function scheduleCleanup() {
      if (scheduled) return;
      scheduled = true;
      var run = function () {
        scheduled = false;
        cleanDashboardTechnicalText();
      };
      if (window.requestAnimationFrame) window.requestAnimationFrame(run);
      else window.setTimeout(run, 0);
    }

    cleanDashboardTechnicalText();
    [250, 1000, 2500, 5000].forEach(function (delay) {
      window.setTimeout(cleanDashboardTechnicalText, delay);
    });

    new MutationObserver(scheduleCleanup).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    window.addEventListener("site-language-change", function () {
      window.setTimeout(cleanDashboardTechnicalText, 0);
      window.setTimeout(cleanDashboardTechnicalText, 100);
    });
  }

  function start() {
    var saved = null;
    try {
      saved = localStorage.getItem("theme");
    } catch (error) {}

    apply(saved || "dark");
    ensureFavicon();
    injectSocialStyle();
    removeTopGithubLink();
    installDashboardPlotlyNoZoomHook();
    observeDashboardText();
    loadScriptWhenIdle("/assets/lang.js?v=20260722-dashboard-i18n-3", "language");
    loadScriptWhenIdle("/assets/professional-title.js", "professionalTitle");

    if (isAlmaArticle() && !isNativeEnglishPage()) {
      loadScriptWhenIdle("/assets/almalaurea-article-static.js", "almArticleStatic");
    }

    if (isHeatDashboard()) {
      loadScript("/assets/ciclo-unico-caldo-note.js", "heatDashboardNotes");
    }

    document.addEventListener("click", function (event) {
      var button = event.target.closest(".sun,.theme-toggle");
      if (!button) return;
      apply(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
    });

    document.addEventListener("keydown", function (event) {
      var button = event.target.closest && event.target.closest(".sun,.theme-toggle");
      if (!button) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        button.click();
      }
    });
  }

  installDashboardPlotlyNoZoomHook();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
