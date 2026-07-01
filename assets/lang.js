(function () {
  "use strict";

  var storageKey = "siteLanguage";
  var validLanguages = { it: true, en: true };
  var articlePages = {
    "/articoli/calendario-scolastico-vacanze-estive.html": "/en/articoli/calendario-scolastico-vacanze-estive.html",
    "/articoli/occupazione-salari-laureati-almalaurea.html": "/en/articoli/occupazione-salari-laureati-almalaurea.html"
  };

  function saveLanguage(language) {
    try {
      localStorage.setItem(storageKey, language);
    } catch (error) {}
  }

  function languageFromUrlOrStorage() {
    var params = new URLSearchParams(window.location.search);
    var language = params.get("lang");
    if (validLanguages[language]) return language;
    if (document.documentElement.lang === "en") return "en";
    try {
      language = localStorage.getItem(storageKey);
    } catch (error) {}
    return validLanguages[language] ? language : "it";
  }

  function currentArticleTarget(language) {
    var path = window.location.pathname;
    var italian = Object.keys(articlePages).find(function (item) {
      return path.endsWith(item);
    });
    if (language === "en" && italian) return articlePages[italian] + "?lang=en";

    var english = Object.keys(articlePages).find(function (item) {
      return path.endsWith(articlePages[item]);
    });
    if (language === "it" && english) return english;

    return null;
  }

  function localisedHref(originalHref, language) {
    if (!originalHref || originalHref.indexOf("#") === 0 || originalHref.indexOf("mailto:") === 0) return originalHref;
    var url;
    try {
      url = new URL(originalHref, window.location.href);
    } catch (error) {
      return originalHref;
    }
    if (url.origin !== window.location.origin) return originalHref;

    var path = url.pathname;
    var italian = Object.keys(articlePages).find(function (item) {
      return path.endsWith(item);
    });
    if (language === "en" && italian) return articlePages[italian] + "?lang=en" + url.hash;

    var english = Object.keys(articlePages).find(function (item) {
      return path.endsWith(articlePages[item]);
    });
    if (language === "it" && english) return english + url.hash;

    return originalHref;
  }

  function syncArticleLinks(language) {
    document.querySelectorAll("a[href]").forEach(function (link) {
      if (!link.dataset.i18nHrefOriginal) link.dataset.i18nHrefOriginal = link.getAttribute("href") || "";
      link.setAttribute("href", localisedHref(link.dataset.i18nHrefOriginal, language));
    });
  }

  function setActive(language) {
    document.querySelectorAll(".language-switch button").forEach(function (button) {
      var active = button.dataset.lang === language;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function applyLanguage(language) {
    if (!validLanguages[language]) language = "it";
    saveLanguage(language);
    setActive(language);
    syncArticleLinks(language);
  }

  function navigateToArticle(language) {
    var target = currentArticleTarget(language);
    if (!target) return false;
    saveLanguage(language);
    window.location.href = target;
    return true;
  }

  function injectStyle() {
    if (document.getElementById("languageSwitchStyle")) return;
    var style = document.createElement("style");
    style.id = "languageSwitchStyle";
    style.textContent = [
      ".header-tools{display:flex;align-items:center;gap:8px}",
      ".language-switch{display:inline-flex;align-items:center;gap:2px;border:1px solid var(--line);border-radius:999px;background:var(--panel);padding:3px}",
      ".language-switch button{min-width:34px;height:34px;border:0;border-radius:999px;background:transparent;color:var(--muted);font:inherit;font-size:.78rem;font-weight:850;cursor:pointer}",
      ".language-switch button.active{background:var(--orange);color:#fff}",
      ".language-switch button:focus-visible{outline:2px solid var(--orange);outline-offset:2px}",
      "@media(max-width:900px){.header-tools{justify-self:end}.language-switch button{min-width:32px;height:32px;font-size:.75rem}}"
    ].join("");
    document.head.appendChild(style);
  }

  function injectSwitch() {
    if (document.querySelector(".language-switch")) return;
    var header = document.querySelector(".site-header .header-inner");
    if (!header) return;

    var switcher = document.createElement("div");
    switcher.className = "language-switch";
    switcher.setAttribute("aria-label", "Language");
    switcher.innerHTML = '<button type="button" data-lang="it">IT</button><button type="button" data-lang="en">EN</button>';

    var themeButton = header.querySelector(".sun,.theme-toggle");
    if (themeButton) {
      var tools = document.createElement("div");
      tools.className = "header-tools";
      themeButton.parentNode.insertBefore(tools, themeButton);
      tools.appendChild(switcher);
      tools.appendChild(themeButton);
    } else {
      header.appendChild(switcher);
    }

    switcher.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-lang]");
      if (!button) return;
      var language = button.dataset.lang;
      if (navigateToArticle(language)) return;
      applyLanguage(language);
    });
  }

  function start() {
    injectStyle();
    injectSwitch();
    var language = languageFromUrlOrStorage();
    if (language === "en" && document.documentElement.lang !== "en" && navigateToArticle(language)) return;
    applyLanguage(language);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
