(function () {
  var WILDCARD = "*";
  var counter = 0;

  function onArticle() {
    return location.pathname.indexOf("/articoli/occupazione-salari-laureati-almalaurea") >= 0;
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function toNumber(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function format(value, suffix) {
    return Number(value).toLocaleString("it-IT", { maximumFractionDigits: 1 }) + suffix;
  }

  function paramsFromIframe(iframe) {
    var src = iframe.getAttribute("src") || "";
    var query = src.split("?")[1] || "";
    var params = new URLSearchParams(query.replace(/&amp;/g, "&"));
    return {
      chart: params.get("chart") || "scatter",
      years: toNumber(params.get("years")) || 1,
      course: params.get("course") || WILDCARD,
      dimension: params.get("dimension") || "disciplinary_group"
    };
  }

  function ensureStyle() {
    if (byId("almArticleStaticStyle")) return;
    var style = document.createElement("style");
    style.id = "almArticleStaticStyle";
    style.textContent = ".article-static-chart{padding:18px;background:var(--bg);overflow-x:auto}.static-chart{min-width:720px;border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:20px}.static-chart h4{margin:0 0 6px;font-size:1.08rem}.static-chart p{margin:0 0 16px!important;color:var(--muted)!important;font-size:.94rem!important;line-height:1.45!important}.static-row{display:grid;grid-template-columns:250px 1fr 96px;gap:12px;align-items:center;margin:10px 0}.static-row span{font-size:.92rem}.static-track{height:14px;border-radius:999px;background:color-mix(in srgb,var(--line) 72%,transparent);overflow:hidden}.static-track i{display:block;height:100%;width:calc(var(--v)*1%);background:var(--orange);border-radius:999px}.static-value{text-align:right;color:var(--orange);font-weight:800}.static-note{min-width:720px;border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:22px;color:var(--muted);line-height:1.55}.static-note strong{display:block;color:var(--text);margin-bottom:8px}.static-note a{color:var(--orange);font-weight:800}.best-course-rows .static-note{min-width:0;border:0;background:transparent;border-radius:0}.static-axis{font-size:.84rem;color:var(--muted);margin-top:12px}@media(max-width:760px){.article-static-chart{padding:12px}.static-chart,.static-note{min-width:760px}}";
    document.head.appendChild(style);
  }

  function introPatch() {
    document.querySelectorAll(".article p").forEach(function (p) {
      if ((p.textContent || "").indexOf("Le figure dell'articolo") < 0) return;
      p.innerHTML = "I file usati per costruire l’analisi sono disponibili nel repository <a href=\"https://github.com/NazarenoLecis/analisi_almalaurea\" target=\"_blank\" rel=\"noopener\">analisi_almalaurea</a>. Le figure dell’articolo sono anteprime statiche leggere. La dashboard resta separata e carica i dati solo quando l’utente interagisce con i filtri.";
    });
  }

  function replaceIframes() {
    document.querySelectorAll("figure.dashboard-live iframe").forEach(function (iframe) {
      var div = document.createElement("div");
      div.id = "articleStaticChart" + (++counter);
      div.className = "article-static-chart";
      div.dataset.params = JSON.stringify(paramsFromIframe(iframe));
      iframe.replaceWith(div);
    });
  }

  function rows(title, subtitle, data, key, suffix) {
    var max = Math.max.apply(null, data.map(function (x) { return x[key]; })) || 1;
    return "<div class=\"static-chart\"><h4>" + escapeHtml(title) + "</h4><p>" + escapeHtml(subtitle) + "</p>" +
      data.map(function (x) {
        var pct = Math.max(2, 100 * x[key] / max);
        return "<div class=\"static-row\" style=\"--v:" + pct.toFixed(1) + "\"><span>" + escapeHtml(x.label) + "</span><div class=\"static-track\"><i></i></div><span class=\"static-value\">" + format(x[key], suffix) + "</span></div>";
      }).join("") +
      "<div class=\"static-axis\">Anteprima statica. Il dettaglio completo resta nella dashboard interattiva.</div></div>";
  }

  function note(title, text) {
    return "<div class=\"static-note\"><strong>" + escapeHtml(title) + "</strong><div>" + escapeHtml(text) + "</div><div style=\"margin-top:10px\"><a href=\"../dashboard/almalaurea/index.html\">Apri la dashboard interattiva</a></div></div>";
  }

  var salaryOneYear = [
    { label: "Scienze motorie e sportive", salary: 1022 },
    { label: "Informatica e Tecnologie ICT", salary: 1608 },
    { label: "Ingegneria industriale e dell’informazione", salary: 1635 },
    { label: "Medico-sanitario e farmaceutico", salary: 1672 }
  ];
  var salaryFiveYears = [
    { label: "Informatica e Tecnologie ICT", salary: 2226 },
    { label: "Ingegneria industriale e dell’informazione", salary: 2185 },
    { label: "Economico", salary: 2006 },
    { label: "Medico-sanitario e farmaceutico", salary: 1993 },
    { label: "Architettura e Ingegneria civile", salary: 1988 },
    { label: "Educazione e Formazione", salary: 1477 }
  ];
  var firstLevel = [
    { label: "Scientifico", employment: 29.4 },
    { label: "Letterario-umanistico", employment: 33.7 },
    { label: "Psicologico", employment: 36.1 },
    { label: "Mediana gruppi", employment: 47.4 }
  ];
  var masters = [
    { label: "Mediana gruppi", employment: 83.6 },
    { label: "Informatica e Tecnologie ICT", employment: 93.3 },
    { label: "Ingegneria industriale e dell’informazione", employment: 93.6 }
  ];
  var fiveYearsEmployment = [
    { label: "Letterario-umanistico", employment: 88.1 },
    { label: "Ingegneria industriale e dell’informazione", employment: 97.5 }
  ];

  function renderChart(el) {
    var params = JSON.parse(el.dataset.params || "{}");
    if (params.chart === "box" && params.years === 5) {
      el.innerHTML = rows("Retribuzioni a 5 anni", "Valori medi netti mensili citati nel testo.", salaryFiveYears, "salary", " €");
    } else if (params.chart === "box") {
      el.innerHTML = rows("Retribuzioni a 1 anno", "Valori medi netti mensili citati nel testo.", salaryOneYear, "salary", " €");
    } else if (params.chart === "time") {
      el.innerHTML = note("Percorso della coorte 2020", "Questa sezione resta statica nell’articolo. La dashboard consente di seguire la coorte e cambiare indicatore caricando i dati solo su richiesta.");
    } else if (params.dimension === "university") {
      el.innerHTML = note("Vista per ateneo", "La vista per ateneo richiede il dettaglio più pesante. Nell’articolo resta statica; nella dashboard viene caricata quando l’utente sceglie questa analisi.");
    } else if (params.course === "laurea di primo livello") {
      el.innerHTML = rows("Lauree triennali a 1 anno", "Tassi di occupazione citati nel testo.", firstLevel, "employment", "%");
    } else if (params.course === "laurea magistrale biennale") {
      el.innerHTML = rows("Magistrali biennali a 1 anno", "Tassi di occupazione citati nel testo.", masters, "employment", "%");
    } else if (params.years === 5) {
      el.innerHTML = rows("Occupazione a 5 anni", "Estremi citati nel testo per il secondo livello.", fiveYearsEmployment, "employment", "%");
    } else {
      el.innerHTML = rows("Retribuzioni a 1 anno", "Valori principali citati nel testo.", salaryOneYear, "salary", " €");
    }
  }

  function renderCharts() {
    document.querySelectorAll(".article-static-chart").forEach(renderChart);
  }

  function renderBestTables() {
    var first = byId("bestCourseRowsFirstLevel");
    var second = byId("bestCourseRowsSecondLevel");
    if (first) first.innerHTML = note("Miglior ambito disponibile per ateneo", "La classifica completa richiede il dettaglio per ateneo. Per tenere l’articolo veloce, questa parte resta statica e rimanda alla dashboard.");
    if (second) second.innerHTML = note("Miglior ambito disponibile nel secondo livello", "La classifica completa richiede il dettaglio per ateneo. Per tenere l’articolo veloce, questa parte resta statica e rimanda alla dashboard.");
  }

  function init() {
    if (!onArticle()) return;
    ensureStyle();
    introPatch();
    replaceIframes();
    renderCharts();
    renderBestTables();
    window.setTimeout(renderBestTables, 300);
    window.setTimeout(renderBestTables, 900);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
