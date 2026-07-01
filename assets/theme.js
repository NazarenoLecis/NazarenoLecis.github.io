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

  function loadScriptWhenIdle(src, key) {
    var schedule = window.requestIdleCallback || function (callback) {
      return window.setTimeout(callback, 900);
    };
    schedule(function () {
      loadScript(src, key);
    }, { timeout: 2200 });
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
