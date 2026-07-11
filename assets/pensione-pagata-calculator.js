(function () {
  "use strict";

  var DATA_URL = "https://data.nazarenolecis.com/pensioni-italia/calcolatore.json?v=20260712-1";
  var COLORS = ["#ff5a1f", "#4e79a7", "#76b7b2", "#f2a541", "#e15759", "#b07aa1"];
  var PROGRESSION = { nessuna: 0, lenta: 0.01, media: 0.02, rapida: 0.03 };
  var LEVEL_RAL_2025 = { basso: 24000, medio: 36000, alto: 58000 };
  var state = { payload: null, mode: "simple", annualRows: [], result: null, career: [] };

  function byId(id) { return document.getElementById(id); }
  function rows(dataset) { return dataset && Array.isArray(dataset.rows) ? dataset.rows : []; }
  function paramRows(name) { return rows(state.payload && state.payload.tables.parameters[name]); }
  function exampleRows(name) { return rows(state.payload && state.payload.tables.examples[name]); }
  function toNumber(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback === undefined ? null : fallback;
    var parsed = Number(String(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : (fallback === undefined ? null : fallback);
  }
  function inputNumber(id, fallback) { var node = byId(id); return node ? toNumber(node.value, fallback) : fallback; }
  function inputText(id, fallback) { var node = byId(id); return node && node.value !== "" ? node.value : fallback; }
  function fmt(value, digits) {
    var n = toNumber(value);
    if (n === null) return "ND";
    return n.toLocaleString("it-IT", { maximumFractionDigits: digits === undefined ? 0 : digits });
  }
  function euro(value, digits) { return fmt(value, digits) + " euro"; }
  function pct(value, digits) { return fmt((toNumber(value, 0) || 0) * 100, digits === undefined ? 1 : digits) + "%"; }
  function setStatus(message, isError) {
    var node = byId("pcStatus");
    if (!node) return;
    node.textContent = message;
    node.style.color = isError ? "#e15759" : "";
  }
  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }
  function plot(id, traces, layout) {
    var node = byId(id);
    if (!node || !window.Plotly) return;
    var textColor = cssVar("--text", "#f5f2ed");
    var muted = cssVar("--muted", "#b9b2aa");
    var line = cssVar("--line", "#303030");
    var panel = cssVar("--panel", "#090909");
    var base = {
      autosize: true,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: textColor, family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", size: 12 },
      margin: { t: 22, r: 18, b: 58, l: 70 },
      hoverlabel: { bgcolor: panel, bordercolor: line, font: { color: textColor } },
      legend: { orientation: "h", x: 0, xanchor: "left", y: -0.22, font: { color: muted } },
      xaxis: { fixedrange: true, gridcolor: line, zerolinecolor: line, tickfont: { color: muted }, automargin: true },
      yaxis: { fixedrange: true, rangemode: "tozero", gridcolor: line, zerolinecolor: line, tickfont: { color: muted }, automargin: true }
    };
    window.Plotly.react(node, traces, Object.assign(base, layout || {}), { responsive: true, displaylogo: false, modeBarButtonsToRemove: ["select2d", "lasso2d"] });
  }
  function clear(node) { if (node) while (node.firstChild) node.removeChild(node.firstChild); }

  function populateCategories() {
    var select = byId("pcCategory");
    if (!select) return;
    clear(select);
    paramRows("categories").forEach(function (row) {
      var option = document.createElement("option");
      option.value = row.categoria_id;
      option.textContent = row.categoria_nome + (row.stato === "operativa" ? "" : " (" + row.stato + ")");
      option.disabled = row.stato !== "operativa";
      if (row.categoria_id === "generica_fpld") option.selected = true;
      select.appendChild(option);
    });
    updateCategoryNote();
  }

  function updateCategoryNote() {
    var selected = inputText("pcCategory", "generica_fpld");
    var category = paramRows("categories").find(function (row) { return row.categoria_id === selected; });
    var note = byId("pcCategoryNote");
    var tag = byId("pcCategoryTag");
    if (note && category) note.textContent = category.note || "";
    if (tag && category) tag.textContent = category.gestione || "FPLD";
  }

  function makePeriod(index, values) {
    values = values || {};
    var wrapper = document.createElement("div");
    wrapper.className = "pc-period";
    wrapper.innerHTML =
      '<h4>Periodo ' + (index + 1) + '</h4>' +
      '<label><span>Anno iniziale</span><input data-period-field="start" type="number" min="1976" max="2050" value="' + (values.start || "") + '"></label>' +
      '<label><span>Anno finale</span><input data-period-field="end" type="number" min="1976" max="2050" value="' + (values.end || "") + '"></label>' +
      '<label><span>RAL iniziale</span><input data-period-field="ralStart" type="number" min="0" step="500" value="' + (values.ralStart || "") + '"></label>' +
      '<label><span>RAL finale</span><input data-period-field="ralEnd" type="number" min="0" step="500" value="' + (values.ralEnd || "") + '"></label>' +
      '<label><span>Quota lavoro</span><input data-period-field="workShare" type="number" min="1" max="100" value="' + (values.workShare || 100) + '"></label>' +
      '<label><span>Mesi annui</span><input data-period-field="months" type="number" min="0" max="12" step="0.5" value="' + (values.months || 12) + '"></label>';
    return wrapper;
  }

  function initPeriods() {
    var node = byId("pcPeriods");
    if (!node) return;
    clear(node);
    node.appendChild(makePeriod(0, { start: 1996, end: 2024, ralStart: 20000, ralEnd: 38000, workShare: 100, months: 12 }));
    node.appendChild(makePeriod(1));
    node.appendChild(makePeriod(2));
  }

  function readScenario() {
    return {
      scenario_id: "frontend",
      anno_nascita: inputNumber("pcBirthYear", 1960),
      sesso: inputText("pcSex", "T"),
      categoria_id: inputText("pcCategory", "generica_fpld"),
      anno_inizio: inputNumber("pcStartYear", 1996),
      anno_fine: inputNumber("pcEndYear", 2024),
      anno_pensione: inputNumber("pcRetirementYear", 2025),
      eta_pensione: inputNumber("pcRetirementAge", 65),
      mesi_eta_pensione: inputNumber("pcRetirementMonths", 0),
      ral_iniziale: inputNumber("pcInitialRal", null),
      ral_finale: inputNumber("pcFinalRal", null),
      ral_anno: inputNumber("pcKnownRalYear", null),
      ral_valore: inputNumber("pcKnownRalValue", null),
      livello_iniziale: inputText("pcInitialLevel", "medio"),
      livello_finale: inputText("pcFinalLevel", "medio"),
      progressione: inputText("pcProgression", "media"),
      anni_contribuiti: inputNumber("pcContributedYears", 29),
      percentuale_lavoro: inputNumber("pcWorkShare", 100),
      mesi_lavorati_annui: inputNumber("pcWorkMonths", 12),
      pensione_lorda_mensile_effettiva: inputNumber("pcMonthlyPension", 2000),
      mensilita_pensione: inputNumber("pcPensionMonths", 13),
      anno_riferimento_pensione: inputNumber("pcPensionReferenceYear", inputNumber("pcRetirementYear", 2025)),
      rivalutazione_futura_pensione: inputText("pcFutureIndexation", "nessuna"),
      tasso_inflazione_futura: inputNumber("pcFutureInflation", 2) / 100
    };
  }

  function validateScenario(s) {
    if (s.categoria_id !== "generica_fpld") throw new Error("Categoria non operativa: usa la carriera generica FPLD.");
    if (s.anno_inizio > s.anno_fine) throw new Error("Anno inizio deve precedere anno fine.");
    if (s.anno_fine >= s.anno_pensione) throw new Error("Anno fine deve precedere anno pensionamento.");
    var impliedAge = s.anno_pensione - s.anno_nascita;
    if (Math.abs(impliedAge - s.eta_pensione) > 2) throw new Error("Anno di nascita, pensionamento ed eta non sono coerenti.");
    if (s.percentuale_lavoro <= 0 || s.percentuale_lavoro > 100) throw new Error("Quota lavoro deve essere tra 1 e 100.");
    if (s.mesi_lavorati_annui < 0 || s.mesi_lavorati_annui > 12) throw new Error("Mesi annui deve essere tra 0 e 12.");
  }

  function rateForYear(year) {
    var table = paramRows("annual");
    var exact = table.find(function (row) { return toNumber(row.anno) === year; });
    if (exact) return exact;
    var before = table.filter(function (row) { return toNumber(row.anno, 0) <= year; }).sort(function (a, b) { return toNumber(b.anno) - toNumber(a.anno); })[0];
    return before || table[table.length - 1];
  }

  function coefficientFor(retirementYear, age, months) {
    var table = paramRows("coefficients");
    var period = table.filter(function (row) { return toNumber(row.periodo_dal) <= retirementYear && toNumber(row.periodo_al) >= retirementYear; });
    var nature = "osservato";
    if (!period.length) {
      nature = "tabella_piu_vicina";
      var latestStart = Math.max.apply(null, table.map(function (row) { return toNumber(row.periodo_dal, 0); }));
      period = table.filter(function (row) { return toNumber(row.periodo_dal) === latestStart; });
    }
    var byAge = {};
    period.forEach(function (row) { byAge[toNumber(row.eta)] = toNumber(row.coefficiente); });
    var ages = Object.keys(byAge).map(Number).sort(function (a, b) { return a - b; });
    var rawAge = age + Math.max(0, Math.min(months || 0, 11)) / 12;
    rawAge = Math.max(ages[0], Math.min(rawAge, ages[ages.length - 1]));
    var lower = Math.floor(rawAge);
    var upper = Math.min(lower + 1, ages[ages.length - 1]);
    var coeff = byAge[lower];
    if (upper !== lower && byAge[upper] !== undefined) coeff = byAge[lower] + (byAge[upper] - byAge[lower]) * (rawAge - lower);
    return { coefficiente: coeff, eta_usata: rawAge, natura: nature };
  }

  function salaryProfile(years, s) {
    var growth = PROGRESSION[s.progressione] === undefined ? PROGRESSION.media : PROGRESSION[s.progressione];
    var known = {};
    var start = years[0], end = years[years.length - 1];
    if (s.ral_iniziale) known[start] = s.ral_iniziale;
    if (s.ral_finale) known[end] = s.ral_finale;
    if (s.ral_anno && years.indexOf(s.ral_anno) >= 0 && s.ral_valore) known[s.ral_anno] = s.ral_valore;
    var profile = {};
    var points = Object.keys(known).map(Number).sort(function (a, b) { return a - b; });
    if (points.length >= 2) {
      years.forEach(function (year) {
        var before = points.filter(function (p) { return p <= year; }).pop() || points[0];
        var after = points.find(function (p) { return p >= year; }) || points[points.length - 1];
        if (before === after) profile[year] = known[before];
        else {
          var localGrowth = Math.pow(known[after] / known[before], 1 / (after - before)) - 1;
          profile[year] = known[before] * Math.pow(1 + localGrowth, year - before);
        }
      });
      return { profile: profile, nature: "stimato_calibrato_su_ral" };
    }
    if (points.length === 1) {
      var refYear = points[0], refSalary = known[refYear];
      years.forEach(function (year) { profile[year] = refSalary * Math.pow(1 + growth, year - refYear); });
      return { profile: profile, nature: "stimato_calibrato_su_ral" };
    }
    var ref = LEVEL_RAL_2025[s.livello_finale] || LEVEL_RAL_2025.medio;
    years.forEach(function (year) { profile[year] = ref / Math.pow(1 + Math.max(growth, 0.015), 2025 - year); });
    return { profile: profile, nature: "stimato_scenario_senza_ral" };
  }

  function buildCareer(s) {
    validateScenario(s);
    var years = [];
    for (var year = s.anno_inizio; year <= s.anno_fine; year += 1) years.push(year);
    var salary = salaryProfile(years, s);
    var possibleYears = years.length;
    var contributedYears = Math.min(s.anni_contribuiti || possibleYears, possibleYears);
    var monthsFromContributed = possibleYears ? 12 * contributedYears / possibleYears : 0;
    var months = Math.min(s.mesi_lavorati_annui || 12, monthsFromContributed || 12);
    var workShare = (s.percentuale_lavoro || 100) / 100;
    var accrued = 0;
    return years.map(function (year, index) {
      var rate = rateForYear(year);
      var gross = Math.max(salary.profile[year], 0);
      var taxable = gross * workShare * months / 12;
      var financing = toNumber(rate.aliquota_finanziamento, 0.327);
      var computo = toNumber(rate.aliquota_computo, 0.33);
      var cap = toNumber(rate.tasso_capitalizzazione, 0);
      var financial = taxable * financing;
      var credit = taxable * computo;
      accrued = accrued * (1 + cap) + credit;
      return {
        scenario_id: "frontend",
        anno: year,
        categoria: "generica_fpld",
        gestione: "FPLD lavoratori dipendenti",
        retribuzione_stimata: gross,
        retribuzione_inserita: salary.nature === "stimato_calibrato_su_ral" ? gross : null,
        mesi_lavorati: months,
        percentuale_part_time: workShare * 100,
        imponibile_previdenziale: taxable,
        aliquota_finanziamento: financing,
        aliquota_computo: computo,
        quota_lavoratore: toNumber(rate.quota_lavoratore, 0),
        quota_datore: toNumber(rate.quota_datore, 0),
        contributi_finanziari: financial,
        accredito_montante: credit,
        tasso_rivalutazione: cap,
        montante_fine_anno: accrued,
        natura_dato: salary.nature,
        indice_anno: index + 1
      };
    });
  }

  function buildAccurateCareer(s) {
    if (!state.annualRows.length) generateAnnualRows();
    var rowsIn = state.annualRows.slice().sort(function (a, b) { return a.anno - b.anno; });
    var seen = {};
    var accrued = 0;
    return rowsIn.map(function (row, index) {
      if (seen[row.anno]) throw new Error("Anno duplicato nella tabella accurata: " + row.anno);
      seen[row.anno] = true;
      var rate = rateForYear(row.anno);
      var taxable = Math.max(toNumber(row.imponibile_previdenziale, 0), 0);
      var financing = toNumber(rate.aliquota_finanziamento, 0.327);
      var computo = toNumber(rate.aliquota_computo, 0.33);
      var cap = toNumber(rate.tasso_capitalizzazione, 0);
      var financial = row.contributi !== null && row.contributi !== undefined ? toNumber(row.contributi, 0) : taxable * financing;
      var credit = taxable * computo + toNumber(row.contributi_figurativi, 0);
      accrued = accrued * (1 + cap) + credit;
      return {
        scenario_id: "frontend",
        anno: row.anno,
        categoria: row.categoria || "generica_fpld",
        gestione: row.gestione || "FPLD lavoratori dipendenti",
        retribuzione_stimata: taxable,
        retribuzione_inserita: taxable,
        mesi_lavorati: toNumber(row.mesi_lavorati, 12),
        percentuale_part_time: toNumber(row.percentuale_part_time, 100),
        imponibile_previdenziale: taxable,
        aliquota_finanziamento: financing,
        aliquota_computo: computo,
        quota_lavoratore: toNumber(rate.quota_lavoratore, 0),
        quota_datore: toNumber(rate.quota_datore, 0),
        contributi_finanziari: financial,
        accredito_montante: credit,
        tasso_rivalutazione: cap,
        montante_fine_anno: accrued,
        natura_dato: "inserito_utente",
        indice_anno: index + 1
      };
    });
  }

  function sexLabel(value) { return value === "M" ? "Maschi" : value === "F" ? "Femmine" : "Totale"; }
  function survival(s, startAge, horizon) {
    var table = paramRows("mortality").filter(function (row) { return row.sesso === sexLabel(s.sesso); });
    if (!table.length) table = paramRows("mortality").filter(function (row) { return row.sesso === "Totale"; });
    var base = table.find(function (row) { return toNumber(row.eta) === startAge; });
    var target = table.find(function (row) { return toNumber(row.eta) === Math.min(startAge + horizon, 119); });
    var baseSurvivors = base ? toNumber(base.sopravviventi, 100000) : 100000;
    return target ? Math.max(0, Math.min(1, toNumber(target.sopravviventi, 0) / baseSurvivors)) : 0;
  }

  function effectiveAnnualPension(s) {
    var annual = (s.pensione_lorda_mensile_effettiva || 0) * (s.mensilita_pensione || 13);
    if (s.anno_riferimento_pensione > s.anno_pensione) annual = annual / Math.pow(1.02, s.anno_riferimento_pensione - s.anno_pensione);
    return annual;
  }

  function classifyRegime(career) {
    var before = career.filter(function (row) { return row.anno < 1996; }).length;
    if (!before) return "contributivo";
    if (before >= 18) return "prevalentemente retributivo";
    return "misto";
  }

  function reliability(career, s) {
    if (career.some(function (row) { return row.natura_dato === "inserito_utente"; })) return { level: "alta", note: "Imponibili annuali inseriti o caricati. Rimangono i limiti dei parametri normativi e della pensione effettiva inserita." };
    if (s.ral_iniziale || s.ral_finale || s.ral_valore) return { level: "media", note: "Aggiungere imponibili annuali dall'estratto contributivo migliorerebbe la precisione." };
    return { level: "bassa", note: "Inserire almeno una RAL reale o caricare un CSV annuale migliorerebbe molto la stima." };
  }

  function calculateMetrics(career, s) {
    var last = career[career.length - 1] || {};
    var accrued = toNumber(last.montante_fine_anno, 0);
    var coeff = coefficientFor(s.anno_pensione, s.eta_pensione, s.mesi_eta_pensione);
    var contributive = accrued * coeff.coefficiente;
    var actual = effectiveAnnualPension(s);
    var futureRate = s.rivalutazione_futura_pensione === "inflazione_costante" ? s.tasso_inflazione_futura : 0;
    var expected = 0, cumulative = 0, breakEven = null;
    for (var h = 0; h <= 55; h += 1) {
      var payment = actual * Math.pow(1 + futureRate, h);
      expected += payment * survival(s, s.eta_pensione, h);
      cumulative += payment;
      if (breakEven === null && cumulative >= accrued) breakEven = s.eta_pensione + h;
    }
    var rel = reliability(career, s);
    return {
      anni_contribuzione: career.length,
      retribuzione_finale: toNumber(last.retribuzione_stimata, 0),
      contributi_finanziari_versati: career.reduce(function (sum, row) { return sum + toNumber(row.contributi_finanziari, 0); }, 0),
      accredito_totale_montante: career.reduce(function (sum, row) { return sum + toNumber(row.accredito_montante, 0); }, 0),
      montante_contributivo: accrued,
      coefficiente_trasformazione: coeff.coefficiente,
      pensione_contributiva_annua_equivalente: contributive,
      pensione_effettiva_annua_lorda: actual,
      differenza_annua_lorda: actual - contributive,
      differenza_percentuale_su_contributiva: contributive ? (actual - contributive) / contributive : 0,
      valore_atteso_prestazioni_lorde: expected,
      eta_pareggio: breakEven,
      rapporto_prestazioni_attese_montante: accrued ? expected / accrued : null,
      regime_indicativo: classifyRegime(career),
      livello_affidabilita: rel.level,
      input_migliorativi: rel.note,
      natura_coefficiente: coeff.natura
    };
  }

  function makeKpi(label, value, note) {
    var node = document.createElement("div");
    node.className = "pi-kpi";
    node.innerHTML = "<span>" + label + "</span><strong>" + value + "</strong><small>" + (note || "") + "</small>";
    return node;
  }

  function renderKpis(result) {
    var node = byId("pcKpis");
    clear(node);
    [
      ["Anni contribuzione", fmt(result.anni_contribuzione), result.regime_indicativo],
      ["Montante contributivo", euro(result.montante_contributivo), "rivalutato a fine carriera"],
      ["Pensione contributiva", euro(result.pensione_contributiva_annua_equivalente), "lordo annuo equivalente"],
      ["Pensione effettiva", euro(result.pensione_effettiva_annua_lorda), "lordo annuo inserito"],
      ["Differenza annua", euro(result.differenza_annua_lorda), pct(result.differenza_percentuale_su_contributiva) + " sulla contributiva"],
      ["Valore atteso", euro(result.valore_atteso_prestazioni_lorde), "prestazioni lorde ponderate per sopravvivenza"],
      ["Eta pareggio", result.eta_pareggio ? fmt(result.eta_pareggio) : "non raggiunta", "pensioni cumulate non scontate"],
      ["Affidabilita", result.livello_affidabilita, result.input_migliorativi]
    ].forEach(function (item) { node.appendChild(makeKpi(item[0], item[1], item[2])); });
    var rel = byId("pcReliability");
    if (rel) rel.innerHTML = "<strong>Affidabilita " + result.livello_affidabilita + ".</strong> " + result.input_migliorativi + " Il tool non ricalcola la pensione liquidata dall'INPS: confronta il valore inserito con un controfattuale contributivo.";
  }

  function renderCharts(career, result, s) {
    var years = career.map(function (row) { return row.anno; });
    plot("pcSalaryChart", [
      { type: "scatter", mode: "lines", name: "Retribuzione stimata/inserita", x: years, y: career.map(function (r) { return r.retribuzione_stimata; }), line: { color: COLORS[0], width: 3 }, hovertemplate: "%{x}<br>%{y:,.0f} euro<extra></extra>" },
      { type: "scatter", mode: "lines", name: "Imponibile previdenziale", x: years, y: career.map(function (r) { return r.imponibile_previdenziale; }), line: { color: COLORS[2], width: 3 }, hovertemplate: "%{x}<br>%{y:,.0f} euro<extra></extra>" }
    ], { yaxis: { title: "euro annui", rangemode: "tozero" } });

    plot("pcRatesChart", [
      { type: "scatter", mode: "lines", name: "Aliquota finanziamento", x: years, y: career.map(function (r) { return r.aliquota_finanziamento * 100; }), line: { color: COLORS[0], width: 3 }, hovertemplate: "%{x}<br>%{y:.2f}%<extra></extra>" },
      { type: "scatter", mode: "lines", name: "Aliquota computo", x: years, y: career.map(function (r) { return r.aliquota_computo * 100; }), line: { color: COLORS[1], width: 3 }, hovertemplate: "%{x}<br>%{y:.2f}%<extra></extra>" },
      { type: "scatter", mode: "lines", name: "Capitalizzazione", x: years, y: career.map(function (r) { return r.tasso_rivalutazione * 100; }), line: { color: COLORS[3], width: 2, dash: "dot" }, hovertemplate: "%{x}<br>%{y:.2f}%<extra></extra>" }
    ], { yaxis: { title: "%", rangemode: "tozero" } });

    plot("pcCapitalChart", [
      { type: "bar", name: "Contributi finanziari", x: years, y: career.map(function (r) { return r.contributi_finanziari; }), marker: { color: COLORS[1] }, hovertemplate: "%{x}<br>%{y:,.0f} euro<extra></extra>" },
      { type: "scatter", mode: "lines", name: "Montante", x: years, y: career.map(function (r) { return r.montante_fine_anno; }), line: { color: COLORS[0], width: 3 }, hovertemplate: "%{x}<br>%{y:,.0f} euro<extra></extra>" }
    ], { yaxis: { title: "euro", rangemode: "tozero" } });

    plot("pcPensionChart", [{
      type: "bar",
      x: ["Contributiva equivalente", "Effettiva inserita", "Differenza"],
      y: [result.pensione_contributiva_annua_equivalente, result.pensione_effettiva_annua_lorda, result.differenza_annua_lorda],
      marker: { color: [COLORS[2], COLORS[0], result.differenza_annua_lorda >= 0 ? COLORS[3] : COLORS[4]] },
      hovertemplate: "%{x}<br>%{y:,.0f} euro<extra></extra>"
    }], { yaxis: { title: "euro annui lordi", rangemode: "tozero" }, showlegend: false });

    var ages = [], cum = [], threshold = [];
    var total = 0;
    for (var h = 0; h <= 40; h += 1) {
      ages.push(s.eta_pensione + h);
      total += result.pensione_effettiva_annua_lorda;
      cum.push(total);
      threshold.push(result.montante_contributivo);
    }
    plot("pcCumulativeChart", [
      { type: "scatter", mode: "lines", name: "Pensioni cumulate", x: ages, y: cum, line: { color: COLORS[0], width: 3 }, hovertemplate: "Eta %{x}<br>%{y:,.0f} euro<extra></extra>" },
      { type: "scatter", mode: "lines", name: "Montante rivalutato", x: ages, y: threshold, line: { color: COLORS[2], width: 2, dash: "dash" }, hovertemplate: "Eta %{x}<br>%{y:,.0f} euro<extra></extra>" }
    ], { xaxis: { title: "eta", fixedrange: true }, yaxis: { title: "euro cumulati", rangemode: "tozero" } });

    renderScenarioChart(s);
    renderCompositionChart(career);
  }

  function renderScenarioChart(s) {
    var factors = state.mode === "simple" ? [
      ["Basso", 0.85],
      ["Centrale", 1],
      ["Alto", 1.15]
    ] : [];
    if (!factors.length) return;
    var labels = [], montantes = [], pensions = [];
    factors.forEach(function (item) {
      var copy = Object.assign({}, s);
      if (copy.ral_finale) copy.ral_finale *= item[1];
      if (copy.ral_iniziale) copy.ral_iniziale *= item[1];
      if (copy.ral_valore) copy.ral_valore *= item[1];
      var c = buildCareer(copy);
      var r = calculateMetrics(c, copy);
      labels.push(item[0]);
      montantes.push(r.montante_contributivo);
      pensions.push(r.pensione_contributiva_annua_equivalente);
    });
    plot("pcScenarioChart", [
      { type: "bar", name: "Montante", x: labels, y: montantes, marker: { color: COLORS[1] } },
      { type: "bar", name: "Pensione contributiva annua", x: labels, y: pensions, marker: { color: COLORS[0] } }
    ], { barmode: "group", yaxis: { title: "euro", rangemode: "tozero" } });
  }

  function renderCompositionChart(career) {
    if (state.mode !== "accurate") return;
    var byGestione = {};
    career.forEach(function (row) { byGestione[row.gestione] = (byGestione[row.gestione] || 0) + row.imponibile_previdenziale; });
    plot("pcCompositionChart", [{
      type: "bar",
      x: Object.keys(byGestione),
      y: Object.keys(byGestione).map(function (key) { return byGestione[key]; }),
      marker: { color: COLORS[2] },
      hovertemplate: "%{x}<br>%{y:,.0f} euro<extra></extra>"
    }], { yaxis: { title: "imponibile complessivo", rangemode: "tozero" }, showlegend: false });
  }

  function calculate() {
    try {
      var s = readScenario();
      var career = state.mode === "accurate" ? buildAccurateCareer(s) : buildCareer(s);
      var result = calculateMetrics(career, s);
      state.career = career;
      state.result = result;
      renderKpis(result);
      renderCharts(career, result, s);
      setStatus("Calcolo aggiornato. Tutti i valori sono lordi e derivano dai parametri disponibili.", false);
    } catch (error) {
      setStatus(error.message || "Errore nel calcolo", true);
    }
  }

  function generateAnnualRows() {
    var periods = Array.from(document.querySelectorAll(".pc-period"));
    var rowsOut = [];
    periods.forEach(function (period) {
      function field(name) { var input = period.querySelector('[data-period-field="' + name + '"]'); return input ? toNumber(input.value, null) : null; }
      var start = field("start"), end = field("end");
      if (!start || !end) return;
      var ralStart = field("ralStart") || field("ralEnd") || 0;
      var ralEnd = field("ralEnd") || ralStart;
      var months = field("months") || 12;
      var workShare = field("workShare") || 100;
      for (var year = start; year <= end; year += 1) {
        var share = start === end ? 0 : (year - start) / (end - start);
        var salary = ralStart + (ralEnd - ralStart) * share;
        rowsOut.push({
          anno: year,
          gestione: "FPLD lavoratori dipendenti",
          categoria: "generica_fpld",
          imponibile_previdenziale: salary * workShare / 100 * months / 12,
          mesi_lavorati: months,
          percentuale_part_time: workShare,
          contributi: null,
          contributi_figurativi: 0
        });
      }
    });
    state.annualRows = rowsOut.sort(function (a, b) { return a.anno - b.anno; });
    renderAnnualTable();
  }

  function renderAnnualTable() {
    var tbody = byId("pcAnnualRows");
    clear(tbody);
    state.annualRows.forEach(function (row, index) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + row.anno + "</td><td>" + row.gestione + "</td>" +
        '<td><input data-row="' + index + '" data-field="imponibile_previdenziale" type="number" value="' + Math.round(row.imponibile_previdenziale) + '"></td>' +
        '<td><input data-row="' + index + '" data-field="mesi_lavorati" type="number" min="0" max="12" step="0.5" value="' + row.mesi_lavorati + '"></td>' +
        '<td><input data-row="' + index + '" data-field="percentuale_part_time" type="number" min="1" max="100" value="' + row.percentuale_part_time + '"></td>' +
        '<td><input data-row="' + index + '" data-field="contributi" type="number" placeholder="auto" value="' + (row.contributi || "") + '"></td>';
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll("input").forEach(function (input) {
      input.addEventListener("input", function () {
        var row = state.annualRows[toNumber(input.dataset.row, 0)];
        row[input.dataset.field] = input.value === "" ? null : toNumber(input.value, 0);
      });
    });
  }

  function parseCsv(text) {
    var lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    var header = lines[0].split(/[;,]/).map(function (x) { return x.trim(); });
    return lines.slice(1).map(function (line) {
      var values = line.split(/[;,]/);
      var obj = {};
      header.forEach(function (key, index) { obj[key] = values[index]; });
      var weeks = toNumber(obj.settimane_contributive, null);
      return {
        anno: toNumber(obj.anno),
        gestione: obj.gestione || "FPLD lavoratori dipendenti",
        categoria: "generica_fpld",
        imponibile_previdenziale: toNumber(obj.imponibile_previdenziale, 0),
        mesi_lavorati: weeks ? weeks / 52 * 12 : 12,
        percentuale_part_time: 100,
        contributi: toNumber(obj.contributi, null),
        contributi_figurativi: toNumber(obj.contributi_figurativi, 0)
      };
    }).filter(function (row) { return row.anno; });
  }

  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll(".pc-mode-tabs button").forEach(function (button) {
      var active = button.dataset.mode === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll(".pc-accurate-only").forEach(function (node) { node.hidden = mode !== "accurate"; });
    document.querySelectorAll(".pc-simple-only").forEach(function (node) { node.hidden = mode !== "simple"; });
    if (mode === "accurate" && !state.annualRows.length) generateAnnualRows();
    calculate();
  }

  function download(filename, content, mime) {
    var blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    var header = ["anno", "gestione", "retribuzione_stimata", "imponibile_previdenziale", "aliquota_finanziamento", "aliquota_computo", "contributi_finanziari", "accredito_montante", "tasso_rivalutazione", "montante_fine_anno"];
    var lines = [header.join(",")].concat(state.career.map(function (row) { return header.map(function (key) { return row[key] === null || row[key] === undefined ? "" : row[key]; }).join(","); }));
    download("calcolatore-pensione-carriera.csv", lines.join("\n"), "text/csv;charset=utf-8");
  }

  function exportJson() {
    download("calcolatore-pensione-risultato.json", JSON.stringify({ result: state.result, career: state.career }, null, 2), "application/json;charset=utf-8");
  }

  function bindEvents() {
    byId("pcCategory").addEventListener("change", function () { updateCategoryNote(); calculate(); });
    byId("pcCalculate").addEventListener("click", calculate);
    byId("pcReset").addEventListener("click", function () { location.reload(); });
    byId("pcModeSimple").addEventListener("click", function () { setMode("simple"); });
    byId("pcModeAccurate").addEventListener("click", function () { setMode("accurate"); });
    byId("pcGenerateAnnualRows").addEventListener("click", function () { generateAnnualRows(); calculate(); });
    byId("pcExportCsv").addEventListener("click", exportCsv);
    byId("pcExportJson").addEventListener("click", exportJson);
    byId("pcShareLink").addEventListener("click", function () {
      var link = location.origin + location.pathname + "?mode=" + encodeURIComponent(state.mode);
      if (navigator.clipboard) navigator.clipboard.writeText(link);
      setStatus("Link copiato senza dati personali: contiene solo la modalita selezionata.", false);
    });
    byId("pcCsvInput").addEventListener("change", function (event) {
      var file = event.target.files && event.target.files[0];
      if (!file) return;
      file.text().then(function (text) { state.annualRows = parseCsv(text); renderAnnualTable(); calculate(); });
      event.target.value = "";
    });
    document.querySelectorAll("#pcCalculatorForm input, #pcCalculatorForm select").forEach(function (node) {
      node.addEventListener("change", function () {
        if (!node.closest(".pc-period") && !node.closest(".pc-annual-table")) calculate();
      });
    });
  }

  function hydrateFromExamples() {
    var first = exampleRows("results")[0];
    if (first) setStatus("Parametri caricati. Esempio pronto: " + first.scenario_id + ".", false);
  }

  document.addEventListener("DOMContentLoaded", function () {
    fetch(DATA_URL, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("Impossibile caricare i parametri del calcolatore.");
        return response.json();
      })
      .then(function (payload) {
        state.payload = payload;
        populateCategories();
        initPeriods();
        bindEvents();
        hydrateFromExamples();
        var params = new URLSearchParams(location.search);
        setMode(params.get("mode") === "accurate" ? "accurate" : "simple");
      })
      .catch(function (error) {
        setStatus(error.message || "Errore nel caricamento dati.", true);
      });
  });
}());
