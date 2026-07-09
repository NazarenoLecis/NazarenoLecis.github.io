(function () {
  "use strict";

  var DATA_URL = "https://data.nazarenolecis.com/pensioni-italia/dashboard.json?v=20260709-2";
  var MISSING = "ND";
  var COLORS = ["#ff5a1f", "#76b7b2", "#f2a541", "#e15759", "#4e79a7", "#b07aa1"];

  var state = {
    payload: null,
    themeStatus: "",
    questionTheme: "",
    questionStatus: "",
    questionSearch: "",
    scenarioId: ""
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function toNumber(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function text(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback || MISSING;
    return String(value);
  }

  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function fmt(value, digits) {
    var n = toNumber(value);
    if (n === null) return MISSING;
    return n.toLocaleString("it-IT", {
      maximumFractionDigits: Number.isFinite(digits) ? digits : 0,
      minimumFractionDigits: 0
    });
  }

  function percentShare(value) {
    var n = toNumber(value);
    if (n === null) return MISSING;
    return (n * 100).toLocaleString("it-IT", { maximumFractionDigits: 1 }) + "%";
  }

  function euro(value) {
    var n = toNumber(value);
    if (n === null) return MISSING;
    if (Math.abs(n) >= 1000000000) return (n / 1000000000).toLocaleString("it-IT", { maximumFractionDigits: 1 }) + " mld euro";
    return n.toLocaleString("it-IT", { maximumFractionDigits: 0 }) + " euro";
  }

  function clear(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function uniqueSorted(values) {
    var seen = {};
    return toArray(values).filter(function (value) {
      if (value === null || value === undefined || value === "") return false;
      var key = String(value);
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    }).sort(function (a, b) {
      return String(a).localeCompare(String(b), "it");
    });
  }

  function countBy(rows, field) {
    return toArray(rows).reduce(function (acc, row) {
      var key = text(row[field], "non_disponibile");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function badge(value) {
    var span = document.createElement("span");
    var clean = text(value, "nd").replace(/\s+/g, "_");
    span.className = "pi-badge " + clean;
    span.textContent = text(value);
    return span;
  }

  function makeKpi(label, value, note) {
    var item = document.createElement("div");
    item.className = "pi-kpi";
    var labelNode = document.createElement("span");
    var valueNode = document.createElement("strong");
    var noteNode = document.createElement("small");
    labelNode.textContent = label;
    valueNode.textContent = value;
    noteNode.textContent = note || "";
    item.appendChild(labelNode);
    item.appendChild(valueNode);
    item.appendChild(noteNode);
    return item;
  }

  function makeListItem(title, body) {
    var item = document.createElement("div");
    item.className = "pi-list-item";
    var strong = document.createElement("strong");
    var span = document.createElement("span");
    strong.textContent = title;
    span.textContent = body || "";
    item.appendChild(strong);
    item.appendChild(span);
    return item;
  }

  function setStatus(message, isError) {
    var node = byId("piStatus");
    if (!node) return;
    node.textContent = message;
    node.style.color = isError ? "#e15759" : "";
  }

  function showEmpty(id, message) {
    var node = byId(id);
    if (!node) return;
    if (window.Plotly) {
      try { window.Plotly.purge(node); } catch (error) {}
    }
    node.innerHTML = "";
    var empty = document.createElement("div");
    empty.className = "pi-empty";
    empty.textContent = message || "Nessun dato disponibile";
    node.appendChild(empty);
  }

  function baseLayout(extra) {
    var textColor = cssVar("--text", "#f5f2ed");
    var muted = cssVar("--muted", "#b9b2aa");
    var line = cssVar("--line", "#303030");
    var panel = cssVar("--panel", "#090909");
    return Object.assign({
      autosize: true,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: textColor, family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", size: 12 },
      margin: { t: 18, r: 18, b: 54, l: 58 },
      hoverlabel: { bgcolor: panel, bordercolor: line, font: { color: textColor } },
      legend: { orientation: "h", x: 0, xanchor: "left", y: -0.2, font: { color: muted } },
      dragmode: false,
      xaxis: { fixedrange: true, gridcolor: line, zerolinecolor: line, tickfont: { color: muted }, automargin: true },
      yaxis: { fixedrange: true, gridcolor: line, zerolinecolor: line, tickfont: { color: muted }, automargin: true }
    }, extra || {});
  }

  function plot(id, traces, layout) {
    var node = byId(id);
    if (!node) return;
    if (!window.Plotly) {
      showEmpty(id, "Plotly non caricato");
      return;
    }
    if (!traces || !traces.length) {
      showEmpty(id, "Nessun dato disponibile");
      return;
    }
    window.Plotly.react(node, traces, baseLayout(layout), {
      responsive: true,
      displayModeBar: false,
      scrollZoom: false,
      doubleClick: false
    }).catch(function () {
      showEmpty(id, "Errore nella costruzione del grafico");
    });
  }

  function populateSelect(id, values, allLabel, selectedValue) {
    var node = byId(id);
    clear(node);
    var all = document.createElement("option");
    all.value = "";
    all.textContent = allLabel || "Tutti";
    node.appendChild(all);
    toArray(values).forEach(function (value) {
      var option = document.createElement("option");
      option.value = String(value.value || value);
      option.textContent = String(value.label || value);
      node.appendChild(option);
    });
    node.value = selectedValue || "";
  }

  function coverageRows() {
    return toArray(state.payload && state.payload.coverage && state.payload.coverage.questions);
  }

  function filteredQuestions() {
    var needle = state.questionSearch.trim().toLowerCase();
    return coverageRows().filter(function (row) {
      if (state.questionTheme && row.tema !== state.questionTheme) return false;
      if (state.questionStatus && row.stato !== state.questionStatus) return false;
      if (!needle) return true;
      return [row.domanda_id, row.tema, row.domanda, row.indicatore_richiesto, row.fonte_principale]
        .join(" ")
        .toLowerCase()
        .indexOf(needle) !== -1;
    });
  }

  function filteredThemes() {
    return toArray(state.payload && state.payload.themes).filter(function (theme) {
      return !state.themeStatus || theme.stato === state.themeStatus;
    });
  }

  function baseRows() {
    var rows = toArray(state.payload && state.payload.calculator && state.payload.calculator.base_rows);
    if (!rows.length && state.payload && state.payload.calculator && state.payload.calculator.base) {
      rows = [state.payload.calculator.base];
    }
    return rows;
  }

  function selectedScenarioId() {
    if (state.scenarioId) return state.scenarioId;
    return state.payload && state.payload.calculator && state.payload.calculator.default_scenario_id;
  }

  function selectedCalculator() {
    var scenarioId = selectedScenarioId();
    var rows = baseRows();
    return rows.find(function (row) { return row.scenario_id === scenarioId; }) || rows[0] || {};
  }

  function selectedCareer() {
    var scenarioId = selectedScenarioId();
    return toArray(state.payload && state.payload.calculator && state.payload.calculator.career).filter(function (row) {
      return !scenarioId || row.scenario_id === scenarioId;
    });
  }

  function setupControls(payload) {
    populateSelect("piThemeStatus", uniqueSorted(toArray(payload.themes).map(function (row) { return row.stato; })), "Tutti gli stati", state.themeStatus);
    populateSelect("piQuestionTheme", uniqueSorted(coverageRows().map(function (row) { return row.tema; })), "Tutti i temi", state.questionTheme);
    populateSelect("piQuestionStatus", uniqueSorted(coverageRows().map(function (row) { return row.stato; })), "Tutti gli stati", state.questionStatus);

    var scenarioLabels = baseRows().map(function (row) {
      return {
        value: row.scenario_id,
        label: text(row.scenario_id).replace(/_/g, " ")
      };
    });
    populateSelect("piScenario", scenarioLabels, "Scenario default", state.scenarioId);

    byId("piThemeStatus").addEventListener("change", function (event) {
      state.themeStatus = event.target.value;
      renderAll();
    });
    byId("piQuestionTheme").addEventListener("change", function (event) {
      state.questionTheme = event.target.value;
      renderAll();
    });
    byId("piQuestionStatus").addEventListener("change", function (event) {
      state.questionStatus = event.target.value;
      renderAll();
    });
    byId("piScenario").addEventListener("change", function (event) {
      state.scenarioId = event.target.value;
      renderAll();
    });
    byId("piQuestionSearch").addEventListener("input", function (event) {
      state.questionSearch = event.target.value;
      renderAll();
    });
    byId("piResetFilters").addEventListener("click", function () {
      state.themeStatus = "";
      state.questionTheme = "";
      state.questionStatus = "";
      state.questionSearch = "";
      state.scenarioId = "";
      byId("piQuestionSearch").value = "";
      setupControls(state.payload);
      renderAll();
    });
  }

  function renderKpis() {
    var node = byId("piKpis");
    clear(node);
    var questions = filteredQuestions();
    var allQuestions = coverageRows();
    var calculator = selectedCalculator();
    node.appendChild(makeKpi("Domande visibili", fmt(questions.length), fmt(allQuestions.length) + " nella matrice"));
    node.appendChild(makeKpi("Senza dati", fmt(countBy(questions, "stato").mancano_dati || 0), "Dopo i filtri correnti"));
    node.appendChild(makeKpi("Temi visibili", fmt(filteredThemes().length), fmt(toArray(state.payload.themes).length) + " totali"));
    node.appendChild(makeKpi("Quota non coperta", percentShare(calculator.quota_pensione_non_coperta), text(calculator.scenario_id, "Scenario")));
  }

  function renderCoverage() {
    var counts = countBy(filteredQuestions(), "stato");
    var labels = Object.keys(counts);
    var values = labels.map(function (key) { return counts[key]; });
    plot("piCoverageChart", [{
      type: "bar",
      orientation: "h",
      y: labels,
      x: values,
      marker: { color: COLORS.slice(0, labels.length) },
      hovertemplate: "%{y}: %{x}<extra></extra>"
    }], {
      margin: { t: 18, r: 18, b: 42, l: 118 },
      xaxis: { title: "Domande" }
    });
  }

  function renderQuality() {
    var node = byId("piQualityList");
    clear(node);
    var counts = (state.payload.quality && state.payload.quality.status_counts) || {};
    Object.keys(counts).forEach(function (key) {
      var item = document.createElement("div");
      item.className = "pi-list-item";
      var strong = document.createElement("strong");
      var span = document.createElement("span");
      strong.appendChild(badge(key));
      span.textContent = fmt(counts[key]) + " controlli";
      item.appendChild(strong);
      item.appendChild(span);
      node.appendChild(item);
    });
    if (!node.children.length) node.appendChild(makeListItem("Nessun controllo disponibile", ""));
  }

  function renderThemes() {
    var node = byId("piThemes");
    var themes = filteredThemes();
    clear(node);
    byId("piThemeSummary").textContent = themes.length + " temi visualizzati. La sintesi viene da metadata/temi_dashboard.csv, costruito a partire dai testi delle live.";
    themes.forEach(function (theme) {
      var card = document.createElement("article");
      card.className = "pi-theme";
      var h = document.createElement("h3");
      var p = document.createElement("p");
      var footer = document.createElement("div");
      h.textContent = text(theme.titolo);
      p.textContent = text(theme.sintesi, "");
      footer.className = "pi-theme-footer";
      footer.appendChild(badge(theme.stato));
      if (theme.indicatori) footer.appendChild(badge("indicatori"));
      card.appendChild(h);
      card.appendChild(p);
      card.appendChild(footer);
      node.appendChild(card);
    });
    if (!themes.length) node.appendChild(makeListItem("Nessun tema con questi filtri", ""));
  }

  function renderCalculator() {
    var base = selectedCalculator();
    var kpis = byId("piCalculatorKpis");
    clear(kpis);
    byId("piScenarioNote").textContent = text(base.descrizione, "Scenario didattico") + " " + text(base.note, "");
    kpis.appendChild(makeKpi("Anni contribuzione", fmt(base.anni_contribuzione), "Scenario selezionato"));
    kpis.appendChild(makeKpi("Tasso teorico", percentShare(base.tasso_sostituzione_teorico), "Montante / vita residua"));
    kpis.appendChild(makeKpi("Tasso effettivo", percentShare(base.tasso_sostituzione_effettivo), "Ipotesi scenario"));
    kpis.appendChild(makeKpi("Per occupato", euro(base.quota_non_coperta_per_occupato), "Quota non coperta stimata"));

    var career = selectedCareer();
    if (!career.length) {
      showEmpty("piCareerChart", "Carriera non disponibile");
      return;
    }
    plot("piCareerChart", [
      {
        type: "scatter",
        mode: "lines",
        name: "Salario",
        x: career.map(function (row) { return row.anno; }),
        y: career.map(function (row) { return row.salario; }),
        line: { color: COLORS[0], width: 3 },
        hovertemplate: "%{x}<br>salario indice %{y:.1f}<extra></extra>"
      },
      {
        type: "scatter",
        mode: "lines",
        name: "Montante",
        x: career.map(function (row) { return row.anno; }),
        y: career.map(function (row) { return row.montante_contributivo; }),
        line: { color: COLORS[1], width: 3 },
        hovertemplate: "%{x}<br>montante %{y:.1f}<extra></extra>"
      },
      {
        type: "bar",
        name: "Contributi",
        x: career.map(function (row) { return row.anno; }),
        y: career.map(function (row) { return row.contributi; }),
        marker: { color: "rgba(242,165,65,.55)" },
        hovertemplate: "%{x}<br>contributi %{y:.1f}<extra></extra>"
      }
    ], {
      yaxis: { title: "Indice scenario" },
      barmode: "overlay"
    });
  }

  function renderQuestions() {
    var body = byId("piQuestionRows");
    var rows = filteredQuestions();
    clear(body);
    byId("piQuestionSummary").textContent = rows.length + " domande visualizzate. Usa tema, stato e ricerca per isolare ripartizione, trasferimenti, demografia o pensionati.";
    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      ["domanda_id", "tema", "stato", "domanda", "tabella_finale"].forEach(function (key) {
        var td = document.createElement("td");
        if (key === "stato") td.appendChild(badge(row[key]));
        else td.textContent = text(row[key], "");
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    if (!rows.length) {
      var empty = document.createElement("tr");
      var cell = document.createElement("td");
      cell.colSpan = 5;
      cell.textContent = "Nessuna domanda con questi filtri.";
      empty.appendChild(cell);
      body.appendChild(empty);
    }
  }

  function renderMethod() {
    var limitations = byId("piLimitations");
    var sources = byId("piSources");
    clear(limitations);
    clear(sources);
    toArray(state.payload.known_limitations).forEach(function (item) {
      limitations.appendChild(makeListItem(item, ""));
    });
    if (!limitations.children.length) limitations.appendChild(makeListItem("Nessun limite registrato", ""));
    toArray(state.payload.catalog && state.payload.catalog.sources).forEach(function (source) {
      sources.appendChild(makeListItem(text(source.ente) + " - " + text(source.nome_fonte), text(source.perimetro, "")));
    });
  }

  function renderAll() {
    if (!state.payload) return;
    renderKpis();
    renderCoverage();
    renderQuality();
    renderThemes();
    renderCalculator();
    renderQuestions();
    renderMethod();
  }

  fetch(DATA_URL, { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (payload) {
      state.payload = payload;
      setupControls(payload);
      renderAll();
      var preparedAt = payload.meta && payload.meta.prepared_at ? new Date(payload.meta.prepared_at) : null;
      setStatus("Dati caricati" + (preparedAt ? " - payload " + preparedAt.toLocaleString("it-IT") : "") + ".");
    })
    .catch(function () {
      setStatus("Impossibile caricare il payload pensioni da R2.", true);
      showEmpty("piCoverageChart", "Payload non disponibile");
      showEmpty("piCareerChart", "Payload non disponibile");
    });
}());
