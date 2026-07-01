(function () {
  "use strict";

  var storageKey = "siteLanguage";
  var validLanguages = { it: true, en: true };
  var originalText = new WeakMap();
  var originalTitle = document.title;
  var articlePages = {
    "/articoli/calendario-scolastico-vacanze-estive.html": "/en/articoli/calendario-scolastico-vacanze-estive.html",
    "/articoli/occupazione-salari-laureati-almalaurea.html": "/en/articoli/occupazione-salari-laureati-almalaurea.html"
  };
  var staticPages = [
    "/index.html",
    "/articoli/index.html",
    "/dashboard/index.html",
    "/media/index.html",
    "/about/index.html"
  ];
  var text = {
    "Articoli": "Articles",
    "Leggi gli articoli": "Read the articles",
    "Dashboard": "Dashboard",
    "Esplora le dashboard": "Explore the dashboards",
    "Media": "Media",
    "About": "About",
    "GitHub": "GitHub",
    "Data & Risk Analysis": "Data & Risk Analysis",
    "Data &amp; Risk Analysis": "Data & Risk Analysis",
    "Analisi economica e dati pubblici": "Economic analysis and public data",
    "Statistico e analista del rischio": "Statistician and Risk Analyst",
    "Analisi economica, rischio, dati e politiche pubbliche. Articoli, dashboard e contenuti video con approccio quantitativo, grafici chiari e fonti verificabili.": "Economic analysis, risk, data and public policy. Articles, dashboards and video content with a quantitative approach, clear charts and verifiable sources.",
    "Analisi su economia, finanza, dati pubblici e politiche pubbliche.": "Analysis on economics, finance, public data and public policy.",
    "Apri archivio ->": "Open archive ->",
    "Apri archivio \u2192": "Open archive \u2192",
    "Grafici e dashboard per analisi economiche replicabili.": "Charts and dashboards for reproducible economic analysis.",
    "Esplora ->": "Explore ->",
    "Esplora \u2192": "Explore \u2192",
    "Interventi, apparizioni YouTube e contenuti video.": "Talks, YouTube appearances and video content.",
    "Guarda ->": "Watch ->",
    "Guarda \u2192": "Watch \u2192",
    "Articoli | Nazareno Lecis": "Articles | Nazareno Lecis",
    "Analisi su economia, finanza, dati pubblici, rischio, mercato del lavoro e politiche pubbliche.": "Analysis on economics, finance, public data, risk, labour markets and public policy.",
    "Perché cambiare il calendario scolastico": "Why change the school calendar",
    "Quale universita scegliere?": "Which university should you choose?",
    "Quale università scegliere?": "Which university should you choose?",
    "Vacanze estive, distribuzione delle ferie scolastiche, summer learning loss e disuguaglianze.": "Summer holidays, distribution of school breaks, summer learning loss and inequalities.",
    "Analisi AlmaLaurea 2025 su occupazione, salari, atenei e gruppi disciplinari.": "AlmaLaurea 2025 analysis on employment, wages, universities and disciplinary groups.",
    "Salari, percentile e distribuzione": "Wages, percentiles and distributions",
    "Pagina template per analisi su salari, distribuzione e confronti europei.": "Template page for analysis on wages, distributions and European comparisons.",
    "Pensioni, perimetro e dati pubblici": "Pensions, scope and public data",
    "Spesa pensionistica, previdenza, assistenza e trasferimenti.": "Pension spending, social security, welfare and transfers.",
    "Da completare": "To be completed",
    "Dashboard | Nazareno Lecis": "Dashboard | Nazareno Lecis",
    "Dashboard statiche o semi-interattive basate su dati pubblici.": "Static or semi-interactive dashboards based on public data.",
    "Occupazione, retribuzione, atenei, gruppi disciplinari, tipi di corso e classi di laurea.": "Employment, wages, universities, subject groups, degree types and degree classes.",
    "Dashboard interattiva": "Interactive dashboard",
    "Crisi abitativa": "Housing crisis",
    "Confronto europeo su indicatori Eurostat e focus locale italiano su prezzi, affitti e redditi.": "European comparison using Eurostat indicators and an Italian local focus on prices, rents and incomes.",
    "Scuole, caldo e climatizzazione": "Schools, heat and air conditioning",
    "Quota di scuole-edifici con condizionamento dichiarato nei dati MIM, per regione e grado scolastico.": "Share of school buildings with declared air conditioning in MIM data, by region and school level.",
    "Salari in Europa": "Wages in Europe",
    "Confronto tra salari, distribuzione e dinamiche reali nei principali paesi europei.": "Comparison of wages, distributions and real dynamics in major European countries.",
    "Energia e prezzi": "Energy and prices",
    "Prezzi dell'energia, inflazione e indicatori correlati.": "Energy prices, inflation and related indicators.",
    "Media | Nazareno Lecis": "Media | Nazareno Lecis",
    "Raccolta di contributi pubblici su economia, dati, finanza, innovazione e politiche pubbliche.": "A collection of public contributions on economics, data, finance, innovation and public policy.",
    "Video": "Video",
    "Articolo pubblicato su Il Sole 24 Ore.": "Article published in Il Sole 24 Ore.",
    "Analisi pubblicata su EconomyUp, con Andrea Savi e Umberto Bertonelli.": "Analysis published in EconomyUp, with Andrea Savi and Umberto Bertonelli.",
    "Leggi ->": "Read ->",
    "Leggi \u2192": "Read \u2192",
    "Playlist": "Playlist",
    "Playlist con interventi e contenuti video su economia, finanza, dati e politiche pubbliche.": "Playlist with talks and video content on economics, finance, data and public policy.",
    "Apri la playlist su YouTube ->": "Open the playlist on YouTube ->",
    "Apri la playlist su YouTube \u2192": "Open the playlist on YouTube \u2192",
    "Guarda su YouTube ->": "Watch on YouTube ->",
    "Guarda su YouTube \u2192": "Watch on YouTube \u2192",
    "Bilancio pubblico, sviluppo e vincoli europei": "Public budget, growth and European constraints",
    "Interventi su manovre di bilancio, NADEF, MES, patto di stabilità e politiche per la crescita.": "Talks on budget laws, NADEF, ESM, the Stability Pact and growth policies.",
    "Pensioni, salari e mercato del lavoro": "Pensions, wages and the labour market",
    "Discussioni su sistema pensionistico, riforme, salari e dati INPS.": "Discussions on the pension system, reforms, wages and INPS data.",
    "Debunking, dati macro e finanza pubblica": "Debunking, macro data and public finance",
    "Analisi e fact-checking su spread, inflazione, Superbonus e performance economica.": "Analysis and fact-checking on spreads, inflation, Superbonus and economic performance.",
    "Scuola e politiche educative": "School and education policy",
    "Interventi su calendario scolastico, tempo scuola, apprendimenti e organizzazione dei servizi educativi.": "Talks on the school calendar, school time, learning and education services.",
    "Dati, università e policy settoriali": "Data, universities and sector policy",
    "Contenuti su dati, programmazione, università, liberalizzazioni e politiche climatiche.": "Content on data, planning, universities, liberalisation and climate policy.",
    "Profilo": "Profile",
    "About | Nazareno Lecis": "About | Nazareno Lecis",
    "Statistica, economia, finanza e politiche pubbliche.": "Statistics, economics, finance and public policy.",
    "Sono uno statistico e analista del rischio. Mi occupo di statistica applicata, economia, finanza e analisi dei rischi.": "I am a statistician and risk analyst. I work on applied statistics, economics, finance and risk analysis.",
    "Ho lavorato a ESMA, European Central Bank, ABN AMRO e Accenture. I temi principali del mio lavoro sono money market, monetary policy, financial stability, DORA designation, greenwashing, fund stress testing, risk analysis e cyber risk.": "I have worked at ESMA, the European Central Bank, ABN AMRO and Accenture. My main work areas include money markets, monetary policy, financial stability, DORA designation, greenwashing, fund stress testing, risk analysis and cyber risk.",
    "Nel dibattito pubblico mi occupo di temi economici e di policy: pensioni, fisco, energia, politiche europee, sviluppo economico, mercato del lavoro, demografia e immigrazione.": "In the public debate I cover economic and policy topics: pensions, taxation, energy, European policy, economic development, the labour market, demographics and immigration.",
    "Profilo professionale": "Professional profile",
    "Statistica, dati, rischio finanziario, mercati, strumenti di analisi e supervisione finanziaria.": "Statistics, data, financial risk, markets, analytical tools and financial supervision.",
    "Dibattito pubblico": "Public debate",
    "Analisi economiche, dati pubblici, grafici, articoli e interventi su temi di policy.": "Economic analysis, public data, charts, articles and talks on policy topics.",
    "Contatti": "Contacts"
  };

  function saveLanguage(language) {
    try {
      localStorage.setItem(storageKey, language);
    } catch (error) {}
  }

  function normalise(value) {
    return String(value == null ? "" : value)
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function leadingSpace(value) {
    var match = String(value).match(/^\s*/);
    return match ? match[0] : "";
  }

  function trailingSpace(value) {
    var match = String(value).match(/\s*$/);
    return match ? match[0] : "";
  }

  function translateValue(value, language) {
    if (language !== "en") return value;
    var key = normalise(value);
    if (!key || !text[key]) return value;
    return leadingSpace(value) + text[key] + trailingSpace(value);
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

  function isStaticPage() {
    var path = window.location.pathname;
    if (path === "/") return true;
    return staticPages.some(function (item) {
      return path.endsWith(item);
    });
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

  function setUrlLanguage(language) {
    if (!window.history || !window.history.replaceState || !isStaticPage()) return;
    var url = new URL(window.location.href);
    if (language === "en") url.searchParams.set("lang", "en");
    else url.searchParams.delete("lang");
    window.history.replaceState(null, "", url.toString());
  }

  function shouldSkip(node) {
    var parent = node && node.parentElement;
    return !parent || Boolean(parent.closest("script,style,noscript,.language-switch,svg,canvas,.js-plotly-plot,.plot-container,.svg-container"));
  }

  function translateNode(node, language) {
    if (!node || node.nodeType !== Node.TEXT_NODE || shouldSkip(node)) return;
    if (!originalText.has(node)) originalText.set(node, node.nodeValue);
    var original = originalText.get(node);
    node.nodeValue = language === "en" ? translateValue(original, language) : original;
  }

  function translateStaticPage(language) {
    if (!isStaticPage() || !document.body) return;
    document.documentElement.lang = language;
    document.title = language === "en" ? translateValue(originalTitle, language) : originalTitle;

    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        return shouldSkip(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = walker.nextNode())) translateNode(node, language);
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
    saveLanguage(language);
    setActive(language);
    syncArticleLinks(language);
    translateStaticPage(language);
    if (updateUrl) setUrlLanguage(language);
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
      applyLanguage(language, true);
    });
  }

  function start() {
    injectStyle();
    injectSwitch();
    var language = languageFromUrlOrStorage();
    if (language === "en" && document.documentElement.lang !== "en" && navigateToArticle(language)) return;
    applyLanguage(language, false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
