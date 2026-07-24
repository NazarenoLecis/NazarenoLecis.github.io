(function () {
  var themeScript = document.currentScript;
  var dashboardPlotlyNoZoomHooked = false;
  var dashboardPlotlyNoZoomPatched = false;
  var dashboardPlotlyTouchGuardInstalled = false;
  var dashboardMobileHeaderInstalled = false;
  var dashboardCreditFormatterInstalled = false;

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

  function isWideContentPage() {
    return isDashboardPage() || location.pathname.indexOf("/articoli") >= 0 || location.pathname.indexOf("/media") >= 0;
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

  function injectWideContentFitStyle() {
    if (!isWideContentPage() || document.getElementById("wideContentFitStyle")) return;
    var style = document.createElement("style");
    style.id = "wideContentFitStyle";
    style.textContent = [
      "@media (min-width:1024px){",
      ".site-header .wrap,main.wrap{width:calc(100% - clamp(32px,3vw,64px))!important;max-width:none!important}",
      "main.wrap[class*='dashboard'],main.wrap.alm-dashboard,main.wrap.bp-dashboard,main.wrap.br-dashboard,main.wrap.dp-dashboard,main.wrap.di-dashboard,main.wrap.gpg-dashboard,main.wrap.hi-dashboard,main.wrap.housing-dashboard,main.wrap.heat-dashboard,main.wrap.pi-dashboard,main.wrap.si-dashboard,main.wrap.vai-dashboard{--max:none!important}",
      "}"
    ].join("");
    document.head.appendChild(style);
  }

  function injectDashboardMobileHeaderStyle() {
    if (!isDashboardPage() || document.getElementById("dashboardMobileHeaderStyle")) return;
    var style = document.createElement("style");
    style.id = "dashboardMobileHeaderStyle";
    style.textContent = [
      "@media (max-width:900px){",
      ".dashboard-menu-toggle{display:none;width:44px;height:44px;border:1px solid var(--line);border-radius:999px;background:var(--panel);color:var(--text);align-items:center;justify-content:center;flex-direction:column;gap:4px;padding:0;cursor:pointer;grid-column:2;grid-row:1;justify-self:end}",
      ".dashboard-menu-toggle:before,.dashboard-menu-toggle:after,.dashboard-menu-toggle span{content:\"\";display:block;width:18px;height:2px;border-radius:999px;background:currentColor;transition:transform .18s ease,opacity .18s ease}",
      ".dashboard-menu-toggle:focus-visible{outline:2px solid var(--orange);outline-offset:2px}",
      "body.dashboard-mobile-compact .site-header .header-inner{grid-template-columns:minmax(0,1fr) auto;min-height:58px;padding:6px 0;gap:8px;overflow:visible}",
      "body.dashboard-mobile-compact .site-header .brand{grid-column:1;grid-row:1;min-width:0;gap:10px}",
      "body.dashboard-mobile-compact .site-header .logo{width:40px;height:40px}",
      "body.dashboard-mobile-compact .site-header .brand-name{font-size:.96rem;line-height:1.08}",
      "body.dashboard-mobile-compact .site-header .brand-tag{font-size:.72rem;line-height:1.08;margin-top:1px}",
      "body.dashboard-mobile-compact .site-header .nav,body.dashboard-mobile-compact .site-header .header-tools,body.dashboard-mobile-compact .site-header .header-inner>.sun{display:none!important}",
      "body.dashboard-mobile-compact .site-header .dashboard-menu-toggle{display:inline-flex}",
      "body.dashboard-mobile-compact.dashboard-mobile-menu-open .site-header{box-shadow:0 16px 36px rgba(0,0,0,.3)}",
      "body.dashboard-mobile-compact.dashboard-mobile-menu-open .site-header .nav{display:flex!important;grid-column:1/-1;grid-row:2;width:100%;overflow-x:auto;gap:10px;padding:4px 0 2px;scrollbar-width:none}",
      "body.dashboard-mobile-compact.dashboard-mobile-menu-open .site-header .header-tools{display:flex!important;grid-column:1/-1;grid-row:3;justify-content:flex-end;padding:4px 0 0}",
      "body.dashboard-mobile-compact.dashboard-mobile-menu-open .site-header .header-inner>.sun{display:grid!important;grid-column:1/-1;grid-row:3;justify-self:end}",
      "body.dashboard-mobile-compact.dashboard-mobile-menu-open .site-header .dashboard-menu-toggle span{opacity:0}",
      "body.dashboard-mobile-compact.dashboard-mobile-menu-open .site-header .dashboard-menu-toggle:before{transform:translateY(6px) rotate(45deg)}",
      "body.dashboard-mobile-compact.dashboard-mobile-menu-open .site-header .dashboard-menu-toggle:after{transform:translateY(-6px) rotate(-45deg)}",
      "body.dashboard-mobile-compact.dashboard-mobile-menu-open .site-header .nav a{padding:9px 12px}",
      "}",
      "@media (min-width:901px){.dashboard-menu-toggle{display:none!important}}"
    ].join("");
    document.head.appendChild(style);
  }

  function setDashboardMobileMenuOpen(open) {
    document.body.classList.toggle("dashboard-mobile-menu-open", open);
    var header = document.querySelector(".site-header");
    if (header) header.classList.toggle("dashboard-menu-open", open);
    var button = document.querySelector(".dashboard-menu-toggle");
    if (button) {
      button.setAttribute("aria-expanded", open ? "true" : "false");
      button.setAttribute("aria-label", open ? "Chiudi menu" : "Apri menu");
    }
  }

  function syncDashboardMobileHeader() {
    if (!isDashboardPage() || !document.body) return;
    var compact = window.matchMedia("(max-width: 900px)").matches && window.scrollY > 24;
    document.body.classList.toggle("dashboard-mobile-compact", compact);
    if (!compact) setDashboardMobileMenuOpen(false);
  }

  function installDashboardMobileHeader() {
    if (!isDashboardPage() || dashboardMobileHeaderInstalled || !document.body) return;
    var header = document.querySelector(".site-header");
    var inner = header && header.querySelector(".header-inner");
    if (!header || !inner) return;
    dashboardMobileHeaderInstalled = true;
    injectDashboardMobileHeaderStyle();

    var button = inner.querySelector(".dashboard-menu-toggle");
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "dashboard-menu-toggle";
      button.setAttribute("aria-label", "Apri menu");
      button.setAttribute("aria-expanded", "false");
      button.innerHTML = "<span></span>";
      var themeButton = inner.querySelector(".sun,.theme-toggle");
      if (themeButton && themeButton.nextSibling) {
        inner.insertBefore(button, themeButton.nextSibling);
      } else {
        inner.appendChild(button);
      }
    }

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      setDashboardMobileMenuOpen(!document.body.classList.contains("dashboard-mobile-menu-open"));
    });

    document.addEventListener("click", function (event) {
      if (!document.body.classList.contains("dashboard-mobile-menu-open")) return;
      if (event.target.closest && event.target.closest(".site-header")) return;
      setDashboardMobileMenuOpen(false);
    });

    document.addEventListener("click", function (event) {
      if (!event.target.closest || !event.target.closest(".site-header .nav a")) return;
      setDashboardMobileMenuOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setDashboardMobileMenuOpen(false);
    });

    window.addEventListener("scroll", syncDashboardMobileHeader, { passive: true });
    window.addEventListener("resize", syncDashboardMobileHeader);
    syncDashboardMobileHeader();
  }

  function injectDashboardCreditStyle() {
    if (!isDashboardPage() || document.getElementById("dashboardCreditStyle")) return;
    var style = document.createElement("style");
    style.id = "dashboardCreditStyle";
    style.textContent = [
      ".dashboard-credit-source,.dashboard-credit-note{display:inline}",
      ".dashboard-credit-note{display:inline-block;margin-top:4px}",
      ".dashboard-credit-source a,.dashboard-credit-note a{color:var(--orange);font-weight:800}"
    ].join("");
    document.head.appendChild(style);
  }

  function dashboardCreditLinkDefinitions() {
    var links = [
      ["Eurostat Census Hub", "https://ec.europa.eu/eurostat/web/population-demography/population-housing-censuses/database"],
      ["OECD Data Explorer", "https://data-explorer.oecd.org/"],
      ["Ministero della Salute", "https://www.salute.gov.it/"],
      ["Ministero del Lavoro", "https://www.lavoro.gov.it/"],
      ["MEF - Dipartimento delle Finanze", "https://www.finanze.gov.it/"],
      ["MEF Dipartimento Finanze", "https://www.finanze.gov.it/"],
      ["Dipartimento delle Finanze", "https://www.finanze.gov.it/"],
      ["RGS-OpenBDAP", "https://openbdap.rgs.mef.gov.it/"],
      ["OpenBDAP/RGS", "https://openbdap.rgs.mef.gov.it/"],
      ["MEF-RGS", "https://www.rgs.mef.gov.it/"],
      ["OpenBDAP", "https://openbdap.rgs.mef.gov.it/"],
      ["Corte dei conti", "https://www.corteconti.it/"],
      ["Banca d'Italia", "https://www.bancaditalia.it/"],
      ["Agenzia Entrate", "https://www.agenziaentrate.gov.it/"],
      ["OMI Agenzia Entrate", "https://www.agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/omi"],
      ["OpenCoesione", "https://opencoesione.gov.it/"],
      ["AlmaLaurea", "https://www.almalaurea.it/"],
      ["SIOPE", "https://www.siope.it/"],
      ["Eurostat", "https://ec.europa.eu/eurostat/databrowser/"],
      ["ISTAT", "https://www.istat.it/"],
      ["INPS", "https://www.inps.it/"],
      ["MIM", "https://dati.istruzione.it/opendata/"]
    ];
    [
      "bd_9bd_sz_cl_r2", "demo_frate", "demo_gind", "demo_mlexpec", "demo_pjan",
      "demo_r_find3", "demo_r_gind3", "demo_r_pjangroup", "earn_gr_gpgr2",
      "earn_ses_pub1a", "earn_ses_pub1i", "earn_ses_pub1s", "edat_lfse_03",
      "gov_10a_exp", "gov_10a_main", "gov_10a_taxag", "ilc_pnp3", "lc_lci_lev",
      "migr_pop3ctb", "nama_10_a64", "nama_10_a64_e", "nama_10_gdp",
      "nama_10r_3gdp", "nama_10r_3gva", "proj_23np", "sbs_sc_ovw", "spr_exp_pens"
    ].forEach(function (code) {
      links.push([code, "https://ec.europa.eu/eurostat/databrowser/view/" + code + "/default/table"]);
    });
    return links.sort(function (left, right) {
      return right[0].length - left[0].length;
    });
  }

  function dashboardCreditPlainText(html) {
    var box = document.createElement("div");
    box.innerHTML = html;
    return (box.textContent || "").replace(/\s+/g, " ").trim();
  }

  function dashboardCreditIsEnglish(html) {
    return document.documentElement.lang === "en" || /\b(Source|Sources|Data source|Processing by|Note):/i.test(dashboardCreditPlainText(html));
  }

  function dashboardCreditHasElaboration(html) {
    return /\b(Elaborazione di Nazareno Lecis|Processing by Nazareno Lecis|Classificazione ed elaborazione di Nazareno Lecis)\b/i.test(dashboardCreditPlainText(html));
  }

  function dashboardCreditEnsureSentence(html) {
    if (!html) return html;
    return /[.!?]\s*$/.test(dashboardCreditPlainText(html)) ? html : html + ".";
  }

  function dashboardCreditSourceRegex() {
    return /(?:<strong[^>]*>\s*)?(?:Fonte dati|Fonte|Fonti|Data source|Source|Sources):(?:\s*<\/strong>)?/i;
  }

  function dashboardCreditNoteRegex() {
    return /(?:<strong[^>]*>\s*)?(?:Nota(?:\s+[^:<]+)?|Note(?:\s+[^:<]+)?):(?:\s*<\/strong>)?/i;
  }

  function dashboardCreditElaborationRegex() {
    return /\b(?:Elaborazione di Nazareno Lecis|Processing by Nazareno Lecis|Classificazione ed elaborazione di Nazareno Lecis)\.?/i;
  }

  function normalizeDashboardCreditLanguage(html) {
    return html
      .replace(/<strong[^>]*>\s*Elaborazione:\s*Nazareno Lecis\.?\s*<\/strong>/gi, "Elaborazione di Nazareno Lecis.")
      .replace(/\bElaborazione:\s*Nazareno Lecis\.?/gi, "Elaborazione di Nazareno Lecis.")
      .replace(/<strong[^>]*>\s*Processing:\s*Nazareno Lecis\.?\s*<\/strong>/gi, "Processing by Nazareno Lecis.")
      .replace(/\bProcessing:\s*Nazareno Lecis\.?/gi, "Processing by Nazareno Lecis.");
  }

  function dashboardCreditNoteStartIndex(html) {
    var match = html.match(/\.\s+(?:Il|La|Le|Lo|Gli|I|Unita|Unità|Territorio|Totale|Valori|Anno|Serie|Celle|Positive|Negative|Con|Per|Nel|Nella|L')\b/);
    return match ? match.index + match[0].match(/^\.\s*/)[0].length : -1;
  }

  function splitDashboardCreditSourceAndNote(html) {
    var normalized = normalizeDashboardCreditLanguage(html.trim());
    var sourceRegex = dashboardCreditSourceRegex();
    var noteRegex = dashboardCreditNoteRegex();
    var sourceMatch = sourceRegex.exec(normalized);
    var noteMatch = noteRegex.exec(normalized);
    var sourceHtml;
    var noteHtml = "";
    var elaborationMatch;
    var noteStart;
    var beforeElaboration;
    var afterElaboration;

    if (!sourceMatch) return null;

    if (noteMatch) {
      if (sourceMatch.index < noteMatch.index) {
        sourceHtml = normalized.slice(sourceMatch.index, noteMatch.index).trim();
        noteHtml = normalized.slice(noteMatch.index).trim();
      } else {
        noteHtml = normalized.slice(noteMatch.index, sourceMatch.index).trim();
        sourceHtml = normalized.slice(sourceMatch.index).trim();
      }
      return { source: sourceHtml, note: noteHtml };
    }

    sourceHtml = normalized.slice(sourceMatch.index).trim();
    elaborationMatch = dashboardCreditElaborationRegex().exec(sourceHtml);
    if (elaborationMatch) {
      beforeElaboration = sourceHtml.slice(0, elaborationMatch.index).trim();
      afterElaboration = sourceHtml.slice(elaborationMatch.index + elaborationMatch[0].length).trim();
      noteStart = dashboardCreditNoteStartIndex(beforeElaboration);
      if (noteStart >= 0) {
        noteHtml = beforeElaboration.slice(noteStart).trim();
        sourceHtml = (beforeElaboration.slice(0, noteStart).trim() + " " + elaborationMatch[0].trim()).trim();
      } else {
        sourceHtml = (beforeElaboration + " " + elaborationMatch[0].trim()).trim();
      }
      if (afterElaboration) noteHtml = [noteHtml, afterElaboration].filter(Boolean).join(" ");
      return { source: sourceHtml, note: noteHtml };
    }

    noteStart = dashboardCreditNoteStartIndex(sourceHtml);
    if (noteStart >= 0) {
      noteHtml = sourceHtml.slice(noteStart).trim();
      sourceHtml = sourceHtml.slice(0, noteStart).trim();
    }
    return { source: sourceHtml, note: noteHtml };
  }

  function buildDashboardCreditHtml(parts, english) {
    var sourceBody = parts.source.replace(dashboardCreditSourceRegex(), "").trim();
    var noteBody = (parts.note || "").replace(dashboardCreditNoteRegex(), "").trim();
    var elaboration = english ? "Processing by Nazareno Lecis." : "Elaborazione di Nazareno Lecis.";
    var noteLabel = english ? "Note:" : "Nota:";
    var sourceLabel = english ? "Source:" : "Fonte:";

    if (!sourceBody) return null;
    if (!dashboardCreditHasElaboration(sourceBody)) {
      sourceBody = dashboardCreditEnsureSentence(sourceBody) + " " + elaboration;
    }

    return '<span class="dashboard-credit-source"><strong>' + sourceLabel + '</strong> ' + sourceBody + '</span>' +
      (noteBody ? '<br><span class="dashboard-credit-note"><strong>' + noteLabel + '</strong> ' + noteBody + '</span>' : "");
  }

  function dashboardCreditChildParts(element) {
    var source = element.querySelector(".si-chart-source");
    var note = element.querySelector(".si-chart-note");
    if (!source) return null;
    return {
      source: source.innerHTML.trim(),
      note: note ? note.innerHTML.trim() : ""
    };
  }

  function dashboardCreditClosestLink(node) {
    var parent = node.parentElement;
    return parent && parent.closest("a");
  }

  function createDashboardCreditLink(text, href) {
    var link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = text;
    return link;
  }

  function findDashboardCreditLinkMatch(text, links) {
    var lower = text.toLowerCase();
    var best = null;
    links.forEach(function (link) {
      var index = lower.indexOf(link[0].toLowerCase());
      if (index < 0) return;
      if (!best || index < best.index || (index === best.index && link[0].length > best.text.length)) {
        best = { index: index, text: text.slice(index, index + link[0].length), href: link[1] };
      }
    });
    return best;
  }

  function linkDashboardCreditTextNodes(source) {
    var links = dashboardCreditLinkDefinitions();
    var walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim() || dashboardCreditClosestLink(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    var node;
    while ((node = walker.nextNode())) nodes.push(node);

    nodes.forEach(function (textNode) {
      var text = textNode.nodeValue;
      var fragment = document.createDocumentFragment();
      var match;
      while ((match = findDashboardCreditLinkMatch(text, links))) {
        if (match.index > 0) fragment.appendChild(document.createTextNode(text.slice(0, match.index)));
        fragment.appendChild(createDashboardCreditLink(match.text, match.href));
        text = text.slice(match.index + match.text.length);
      }
      if (!fragment.childNodes.length) return;
      if (text) fragment.appendChild(document.createTextNode(text));
      textNode.parentNode.replaceChild(fragment, textNode);
    });
  }

  function linkDashboardCreditCodeNodes(source) {
    var links = dashboardCreditLinkDefinitions();
    source.querySelectorAll("code").forEach(function (code) {
      if (code.closest("a")) return;
      var text = (code.textContent || "").trim().toLowerCase();
      var match = links.find(function (link) { return link[0].toLowerCase() === text; });
      if (!match) return;
      var wrapper = createDashboardCreditLink("", match[1]);
      code.parentNode.insertBefore(wrapper, code);
      wrapper.appendChild(code);
    });
  }

  function linkDashboardCreditSources(element) {
    element.querySelectorAll(".dashboard-credit-source").forEach(function (source) {
      linkDashboardCreditCodeNodes(source);
      linkDashboardCreditTextNodes(source);
    });
  }

  function replaceDashboardCreditText(element, from, to) {
    var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        return dashboardCreditClosestLink(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.indexOf(from) >= 0) node.nodeValue = node.nodeValue.split(from).join(to);
    }
  }

  function syncDashboardCreditLanguage(element) {
    var english = document.documentElement.lang === "en";
    var sourceLabel = element.querySelector(".dashboard-credit-source strong");
    var noteLabel = element.querySelector(".dashboard-credit-note strong");
    if (sourceLabel) sourceLabel.textContent = english ? "Source:" : "Fonte:";
    if (noteLabel) noteLabel.textContent = english ? "Note:" : "Nota:";
    if (english) {
      replaceDashboardCreditText(element, "Elaborazione di Nazareno Lecis.", "Processing by Nazareno Lecis.");
    } else {
      replaceDashboardCreditText(element, "Processing by Nazareno Lecis.", "Elaborazione di Nazareno Lecis.");
    }
  }

  function isDashboardCreditElement(element) {
    var className = element.className || "";
    if (typeof className !== "string") return false;
    if (!element.classList) return false;
    return element.classList.contains("chart-credit") ||
      element.classList.contains("chart-source") ||
      element.classList.contains("chart-bottom-credit") ||
      element.classList.contains("table-credit") ||
      element.classList.contains("source-credit") ||
      /(^|\s)[a-z0-9]+-chart-credit(\s|$)/i.test(className);
  }

  function formatDashboardCreditElement(element) {
    if (!isDashboardPage() || !isDashboardCreditElement(element)) return;
    var signature = element.innerHTML.trim();
    if (!signature || element.dataset.dashboardCreditLast === signature) return;
    if (element.querySelector(".dashboard-credit-source")) {
      syncDashboardCreditLanguage(element);
      linkDashboardCreditSources(element);
      element.dataset.dashboardCreditLast = element.innerHTML.trim();
      return;
    }
    var parts = dashboardCreditChildParts(element) || splitDashboardCreditSourceAndNote(signature);
    var formatted = parts && buildDashboardCreditHtml(parts, dashboardCreditIsEnglish(signature));
    if (!formatted) {
      element.dataset.dashboardCreditLast = signature;
      return;
    }
    element.innerHTML = formatted;
    syncDashboardCreditLanguage(element);
    linkDashboardCreditSources(element);
    element.dataset.dashboardCreditLast = element.innerHTML.trim();
  }

  function formatDashboardCredits(root) {
    if (!isDashboardPage() || !root) return;
    if (root.nodeType === 1 && isDashboardCreditElement(root)) formatDashboardCreditElement(root);
    if (!root.querySelectorAll) return;
    root.querySelectorAll(".chart-credit,.chart-source,.chart-bottom-credit,.table-credit,.source-credit,[class*='-chart-credit']").forEach(formatDashboardCreditElement);
  }

  function installDashboardCreditFormatter() {
    if (!isDashboardPage() || dashboardCreditFormatterInstalled || !document.body) return;
    dashboardCreditFormatterInstalled = true;
    injectDashboardCreditStyle();
    formatDashboardCredits(document.body);
    [100, 500, 1200, 2500, 5000].forEach(function (delay) {
      window.setTimeout(function () { formatDashboardCredits(document.body); }, delay);
    });
    window.addEventListener("site-language-change", function () {
      window.setTimeout(function () { formatDashboardCredits(document.body); }, 0);
      window.setTimeout(function () { formatDashboardCredits(document.body); }, 150);
    });
    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === "characterData" && mutation.target.parentElement) {
          formatDashboardCreditElement(mutation.target.parentElement);
          return;
        }
        mutation.addedNodes.forEach(function (node) {
          formatDashboardCredits(node);
        });
        if (mutation.target && mutation.target.nodeType === 1) {
          formatDashboardCreditElement(mutation.target);
        }
      });
    }).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
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
    injectWideContentFitStyle();
    installDashboardMobileHeader();
    installDashboardCreditFormatter();
    removeTopGithubLink();
    installDashboardPlotlyNoZoomHook();
    observeDashboardText();
    loadScriptWhenIdle("/assets/lang.js?v=20260724-sanita-specialty", "language");
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
