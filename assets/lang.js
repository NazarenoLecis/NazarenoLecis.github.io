(function () {
  "use strict";

  var files = [
    "/assets/lang-data-0.txt",
    "/assets/lang-data-1.txt",
    "/assets/lang-data-2.txt",
    "/assets/lang-data-3.txt",
    "/assets/lang-data-4.txt"
  ];
  var storageKey = "siteLanguage";
  var validLanguages = { it: true, en: true };
  var originalText = new WeakMap();
  var originalTitle = document.title;
  var currentLanguage = "it";
  var applying = false;
  var queued = false;
  var data = null;
  var dataPromise = null;

  var exactOverrides = {
    "Statistico e analista del rischio": "Statistician and Risk Analysis Officer",
    "Sono uno statistico e analista del rischio. Mi occupo di statistica applicata, economia, finanza e analisi dei rischi.": "I am a Statistician and Risk Analysis Officer. I work on applied statistics, economics, finance and risk analysis.",
    "Quale universita scegliere?": "Which university should you choose?",
    "Quale università scegliere?": "Which university should you choose?",
    "Perché cambiare il calendario scolastico": "Why change the school calendar",
    "Vacanze estive, distribuzione delle ferie scolastiche, summer learning loss e disuguaglianze.": "Summer holidays, distribution of school breaks, summer learning loss and inequalities.",
    "Analisi AlmaLaurea 2025 su occupazione, salari, atenei e gruppi disciplinari.": "AlmaLaurea 2025 analysis on employment, wages, universities and disciplinary groups."
  };

  var phraseOverrides = [
    ["Data Scientist and Risk Analysis Officer", "Statistician and Risk Analysis Officer"],
    ["Data Scientist e Risk Analysis Officer", "Statistician and Risk Analysis Officer"],
    ["Fonte:", "Source:"],
    ["Elaborazione di Nazareno Lecis", "Processed by Nazareno Lecis"],
    [" laureati", " graduates"],
    [" euro", " euros"],
    [" mld €", " bn €"]
  ];

  var articlePages = {
    "/articoli/calendario-scolastico-vacanze-estive.html": "/en/articoli/calendario-scolastico-vacanze-estive.html",
    "/articoli/occupazione-salari-laureati-almalaurea.html": "/en/articoli/occupazione-salari-laureati-almalaurea.html",
    "/articoli/quanto-costerebbe-aria-condizionata-scuole.html": "/en/articoli/calendario-scolastico-vacanze-estive.html"
  };

  function decodeCompressed(value) {
    var bytes = Uint8Array.from(atob(value.trim()), function (char) {
      return char.charCodeAt(0);
    });
    if (!window.DecompressionStream) {
      return Promise.reject(new Error("DecompressionStream not available"));
    }
    var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text().then(function (text) {
      return JSON.parse(text);
    });
  }

  function loadData() {
    if (data) return Promise.resolve(data);
    if (dataPromise) return dataPromise;
    dataPromise = Promise.all(files.map(function (file) {
      return fetch(file, { cache: "force-cache" }).then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.text();
      });
    })).then(function (parts) {
      return decodeCompressed(parts.join(""));
    }).then(function (payload) {
      payload.EXACT = payload.EXACT || {};
      payload.PHRASES = payload.PHRASES || [];
      Object.keys(exactOverrides).forEach(function (key) {
        payload.EXACT[key] = exactOverrides[key];
      });
      payload.PHRASES = phraseOverrides.concat(payload.PHRASES);
      data = payload;
      return data;
    });
    return dataPromise;
  }

  function normalise(value) {
    var text = String(value == null ? "" : value);
    text = text.split(String.fromCharCode(160)).join(" ");
    text = text.split(String.fromCharCode(10)).join(" ");
    text = text.split(String.fromCharCode(13)).join(" ");
    text = text.split(String.fromCharCode(9)).join(" ");
    text = text.trim();
    while (text.indexOf("  ") >= 0) text = text.split("  ").join(" ");
    return text;
  }

  function leadingSpace(value) {
    var i = 0;
    while (i < value.length && (value.charCodeAt(i) <= 32 || value.charCodeAt(i) === 160)) i += 1;
    return value.slice(0, i);
  }

  function trailingSpace(value) {
    var i = value.length - 1;
    while (i >= 0 && (value.charCodeAt(i) <= 32 || value.charCodeAt(i) === 160)) i -= 1;
    return value.slice(i + 1);
  }

  function applyPhrases(text) {
    var output = text;
    (data.PHRASES || []).forEach(function (pair) {
      output = output.split(pair[0]).join(pair[1]);
    });
    return output;
  }

  function translateValue(original) {
    if (!data) return original;
    var compact = normalise(original);
    if (!compact) return original;
    var exact = data.EXACT[compact];
    var translated = exact || applyPhrases(compact);
    if (!exact && translated === compact) return original;
    var raw = String(original);
    return leadingSpace(raw) + translated + trailingSpace(raw);
  }

  function shouldSkip(element) {
    return !element || Boolean(element.closest("script,style,noscript,.language-switch"));
  }

  function translateTextNode(node, language) {
    if (!node || node.nodeType !== Node.TEXT_NODE || shouldSkip(node.parentElement)) return;
    if (!originalText.has(node)) originalText.set(node, node.nodeValue);
    var original = originalText.get(node);
    node.nodeValue = language === "en" ? translateValue(original) : original;
  }

  function datasetKey(attribute) {
    return "i18nOriginal" + attribute.split("-").join("");
  }

  function translateAttribute(element, attribute, language) {
    if (!element || !element.hasAttribute || !element.hasAttribute(attribute) || shouldSkip(element)) return;
    var key = datasetKey(attribute);
    if (!element.dataset[key]) element.dataset[key] = element.getAttribute(attribute) || "";
    var original = element.dataset[key];
    if (!original || original.slice(0, 4).toLowerCase() === "http") return;
    element.setAttribute(attribute, language === "en" ? translateValue(original) : original);
  }

  function translateAttributes(element, language) {
    ["placeholder", "aria-label", "alt", "title", "content"].forEach(function (attribute) {
      translateAttribute(element, attribute, language);
    });
  }

  function walk(root, language) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root, language);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) translateAttributes(root, language);
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        return shouldSkip(node.parentElement) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = walker.nextNode())) translateTextNode(node, language);
    if (root.querySelectorAll) {
      root.querySelectorAll("[placeholder],[aria-label],[alt],[title],meta[content]").forEach(function (element) {
        translateAttributes(element, language);
      });
    }
  }

  function setMetadata(language) {
    document.documentElement.lang = language;
    document.title = language === "en" ? translateValue(originalTitle) : originalTitle;
  }

  function languageFromUrlOrStorage() {
    var params = new URLSearchParams(window.location.search);
    var language = params.get("lang");
    if (validLanguages[language]) return language;
    try {
      language = localStorage.getItem(storageKey);
    } catch (error) {}
    return validLanguages[language] ? language : "it";
  }

  function saveLanguage(language) {
    try {
      localStorage.setItem(storageKey, language);
    } catch (error) {}
  }

  function setUrlLanguage(language) {
    if (!window.history || !window.history.replaceState) return;
    var url = new URL(window.location.href);
    if (language === "en") url.searchParams.set("lang", "en");
    else url.searchParams.delete("lang");
    window.history.replaceState(null, "", url.toString());
  }

  function currentArticleTarget(language) {
    var path = window.location.pathname;
    var italian = Object.keys(articlePages).find(function (item) { return path.endsWith(item); });
    if (language === "en" && italian) return articlePages[italian] + "?lang=en";
    var english = Object.keys(articlePages).find(function (item) { return path.endsWith(articlePages[item]); });
    if (language === "it" && english) return english;
    return null;
  }

  function maybeNavigateToArticle(language) {
    var target = currentArticleTarget(language);
    if (!target) return false;
    saveLanguage(language);
    window.location.href = target;
    return true;
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
    var italian = Object.keys(articlePages).find(function (item) { return path.endsWith(item); });
    if (language === "en" && italian) return articlePages[italian] + "?lang=en" + url.hash;
    var english = Object.keys(articlePages).find(function (item) { return path.endsWith(articlePages[item]); });
    if (language === "it" && english) return english + url.hash;
    return originalHref;
  }

  function syncLinks(language) {
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

  function applyLanguage(language, updateUrl) {
    if (!validLanguages[language]) language = "it";
    currentLanguage = language;
    saveLanguage(language);
    if (updateUrl) setUrlLanguage(language);
    setActive(language);
    setMetadata(language);
    syncLinks(language);
    if (language === "en" && !data) {
      loadData().then(function () {
        if (currentLanguage === "en") applyLanguage("en", false);
      }).catch(function () {});
      return;
    }
    applying = true;
    walk(document.body, language);
    syncLinks(language);
    applying = false;
  }

  function scheduleApply() {
    if (applying || queued) return;
    queued = true;
    (window.requestAnimationFrame || function (callback) { return setTimeout(callback, 16); })(function () {
      queued = false;
      applyLanguage(currentLanguage, false);
    });
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
      if (maybeNavigateToArticle(language)) return;
      applyLanguage(language, true);
    });
  }

  function observeChanges() {
    if (!window.MutationObserver || !document.body) return;
    var observer = new MutationObserver(function () {
      if (applying) return;
      scheduleApply();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "aria-label", "alt", "title", "content", "href"]
    });
  }

  function start() {
    injectStyle();
    injectSwitch();
    applyLanguage(languageFromUrlOrStorage(), false);
    observeChanges();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();