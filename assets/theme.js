(function () {
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

    if (isAlmaArticle()) {
      patchAlmaArticleDataFetch();
      loadScript("/assets/almalaurea-article-static.js", "almArticleStatic");
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
