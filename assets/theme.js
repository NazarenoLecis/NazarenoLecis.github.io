(function () {
  var R2_DATA_BASE = "https://data.nazarenolecis.com";

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
  }

  function loadScript(src, key) {
    if (document.querySelector("script[data-" + key + "]")) return;
    var script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.dataset[key] = "1";
    document.head.appendChild(script);
  }

  function isAlmaArticle() {
    return location.pathname.indexOf("/articoli/occupazione-salari-laureati-almalaurea") >= 0;
  }

  function isHeatDashboard() {
    return location.pathname.indexOf("/dashboard/ciclo-unico-caldo") >= 0;
  }

  function dataUrlToR2(input) {
    var url = typeof input === "string" ? input : String((input && input.url) || "");
    var parsed = null;
    try {
      parsed = new URL(url, window.location.href);
    } catch (error) {
      return null;
    }
    if (parsed.origin !== window.location.origin) return null;
    if (parsed.pathname.indexOf("/data/") !== 0) return null;
    return R2_DATA_BASE + parsed.pathname.slice("/data".length) + parsed.search;
  }

  function patchR2DataFetch() {
    if (window.__r2DataFetchPatched || !window.fetch) return;
    window.__r2DataFetchPatched = true;

    var originalFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var r2Url = dataUrlToR2(input);
      if (!r2Url) return originalFetch(input, init);
      if (typeof Request !== "undefined" && input instanceof Request) {
        return originalFetch(new Request(r2Url, input), init);
      }
      return originalFetch(r2Url, init);
    };
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

  function patchAlmaArticleDataFetch() {
    if (!isAlmaArticle() || window.__almArticleDataFetchPatched) return;
    window.__almArticleDataFetchPatched = true;

    var originalFetch = window.fetch.bind(window);
    var articleTimeseriesFetchCount = 0;

    window.fetch = function (input, init) {
      var url = typeof input === "string" ? input : String(input && input.url || "");
      if (url.indexOf("/data/almalaurea/almalaurea_article_timeseries_data.json") >= 0 || url.indexOf("almalaurea_article_timeseries_data.json") >= 0) {
        articleTimeseriesFetchCount += 1;
        if (articleTimeseriesFetchCount === 1) {
          return originalFetch("/data/almalaurea/almalaurea_dashboard_data.json", init);
        }
      }
      return originalFetch(input, init);
    };
  }

  function start() {
    var saved = null;
    try {
      saved = localStorage.getItem("theme");
    } catch (error) {}

    apply(saved || "dark");
    injectSocialStyle();
    removeTopGithubLink();
    loadScript("/assets/lang.js", "language");
    loadScript("/assets/professional-title.js", "professionalTitle");

    if (isAlmaArticle()) {
      patchAlmaArticleDataFetch();
      loadScript("/assets/almalaurea-article-static.js", "almArticleStatic");
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

  patchR2DataFetch();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
