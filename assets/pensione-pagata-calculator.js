(function () {
  "use strict";

  var DATA_URL = "https://data.nazarenolecis.com/pensioni-italia/calcolatore.json?v=20260712-6";
  var COLORS = ["#ff5a1f", "#4e79a7", "#76b7b2", "#f2a541", "#e15759", "#b07aa1"];
  var PROGRESSION = { nessuna: 0, lenta: 0.01, media: 0.02, rapida: 0.03 };
  var LIRE_PER_EURO = 1936.27;
  var LIFE_EXPECTANCY_BASE_AGE = 65;
  var state = { payload: null, mode: "simple", annualRows: [], result: null, career: [], scenario: null, axisMode: "zero" };

  function byId(id) { return document.getElementById(id); }
  function rows(dataset) { return dataset && Array.isArray(dataset.rows) ? dataset.rows : []; }
  function paramRows(name) { return rows(state.payload && state.payload.tables.parameters[name]); }
  function exampleRows(name) { return rows(state.payload && state.payload.tables.examples[name]); }
  function clear(node) { if (node) while (node.firstChild) node.removeChild(node.firstChild); }
  function toNumber(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback === undefined ? null : fallback;
    var parsed = Number(String(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : (fallback === undefined ? null : fallback);
  }
  function inputNumber(id, fallback) { var node = byId(id); return node ? toNumber(node.value, fallback) : fallback; }
  function inputText(id, fallback) { var node = byId(id); return node && node.value !== "" ? node.value : fallback; }
  function truthy(value) { return value === true || String(value).toLowerCase() === "true" || value === 1; }
  function fmt(value, digits) {
    var number = toNumber(value);
    if (number === null) return "ND";
    return number.toLocaleString("it-IT", { maximumFractionDigits: digits === undefined ? 0 : digits });
  }
  function euro(value, digits) { return fmt(value, digits) + " euro"; }
  function pct(value, digits) { return fmt((toNumber(value, 0) || 0) * 100, digits === undefined ? 1 : digits) + "%"; }
  function careerAmountToEuro(value, currency) {
    var amount = toNumber(value, 0);
    return String(currency).toLowerCase() === "lire" ? amount / LIRE_PER_EURO : amount;
  }
  function updateLireConverter() {
    var input = byId("pcLireInput"), output = byId("pcEuroOutput");
    if (!input || !output) return;
    var euroValue = careerAmountToEuro(input.value, "lire");
    output.value = euroValue ? Math.round(euroValue).toLocaleString("it-IT") : "";
  }
  function pensionNetAnnualEstimate(annualGross, year) {
    annualGross = Math.max(toNumber(annualGross, 0), 0);
    if (!annualGross) return 0;
    var middleRate = year >= 2026 ? 0.33 : 0.35, grossTax, detraction;
    if (annualGross <= 28000) grossTax = annualGross * 0.23;
    else if (annualGross <= 50000) grossTax = 6440 + (annualGross - 28000) * middleRate;
    else grossTax = 6440 + 22000 * middleRate + (annualGross - 50000) * 0.43;
    if (annualGross <= 8500) detraction = 1955;
    else if (annualGross <= 28000) detraction = 700 + 1255 * (28000 - annualGross) / 19500;
    else if (annualGross <= 50000) detraction = 700 * (50000 - annualGross) / 22000;
    else detraction = 0;
    if (annualGross > 25000 && annualGross <= 29000) detraction += 50;
    return Math.max(annualGross - Math.max(grossTax - Math.max(detraction, 0), 0) - annualGross * 0.021, 0);
  }
  function pensionGrossAnnualFromNet(annualNet, year) {
    annualNet = Math.max(toNumber(annualNet, 0), 0);
    if (!annualNet) return 0;
    var low = annualNet, high = Math.max(annualNet * 2.5, annualNet + 30000);
    while (pensionNetAnnualEstimate(high, year) < annualNet) high *= 1.5;
    for (var iteration = 0; iteration < 80; iteration += 1) {
      var middle = (low + high) / 2;
      if (pensionNetAnnualEstimate(middle, year) < annualNet) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  }
  function setStatus(message, isError) {
    var node = byId("pcStatus");
    if (!node) return;
    node.textContent = message;
    node.style.color = isError ? "#e15759" : "";
  }
  function parseDate(value) {
    if (!value) return null;
    var parts = String(value).split("-").map(Number);
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  function isoDate(value) {
    if (!value) return null;
    return [value.getFullYear(), String(value.getMonth() + 1).padStart(2, "0"), String(value.getDate()).padStart(2, "0")].join("-");
  }
  function formatDate(value) {
    return value ? value.toLocaleDateString("it-IT", { month: "long", year: "numeric" }) : "ND";
  }
  function addMonths(value, months) {
    var result = new Date(value.getFullYear(), value.getMonth() + months, 1);
    var lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(value.getDate(), lastDay));
    return result;
  }
  function ageParts(birth, reference) {
    var months = (reference.getFullYear() - birth.getFullYear()) * 12 + reference.getMonth() - birth.getMonth();
    if (reference.getDate() < birth.getDate()) months -= 1;
    months = Math.max(0, months);
    return { years: Math.floor(months / 12), months: months % 12, total: months / 12 };
  }
  function elapsedYears(start, end) { return Math.max(0, (end.getTime() - start.getTime()) / 31556952000); }
  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function plot(id, traces, customLayout) {
    var node = byId(id);
    if (!node || !window.Plotly) return;
    var textColor = cssVar("--text", "#f5f2ed");
    var muted = cssVar("--muted", "#c5beb5");
    var panel = cssVar("--panel", "#111214");
    var grid = "rgba(170, 170, 170, 0.24)";
    var baseX = { fixedrange: true, gridcolor: grid, zerolinecolor: grid, linecolor: grid, tickfont: { color: muted }, automargin: true };
    var baseY = { fixedrange: true, rangemode: state.axisMode === "zero" ? "tozero" : "normal", gridcolor: grid, zerolinecolor: grid, linecolor: grid, tickfont: { color: muted }, automargin: true };
    customLayout = customLayout || {};
    var layout = Object.assign({
      autosize: true,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(255,255,255,0.025)",
      font: { color: textColor, family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", size: 12 },
      margin: { t: 24, r: 20, b: 64, l: 78 },
      hoverlabel: { bgcolor: panel, bordercolor: grid, font: { color: textColor } },
      legend: { orientation: "h", x: 0, xanchor: "left", y: -0.22, font: { color: muted } }
    }, customLayout);
    layout.xaxis = Object.assign({}, baseX, customLayout.xaxis || {});
    layout.yaxis = Object.assign({}, baseY, customLayout.yaxis || {});
    window.Plotly.react(node, traces, layout, { responsive: true, displaylogo: false, displayModeBar: false, scrollZoom: false });
  }

  function categoryFor(id) {
    return paramRows("categories").find(function (row) { return row.categoria_id === id; });
  }
  function populateCategories() {
    var select = byId("pcCategory");
    clear(select);
    paramRows("categories").forEach(function (row) {
      var option = document.createElement("option");
      option.value = row.categoria_id;
      option.textContent = row.categoria_nome + (truthy(row.abilitata_frontend) ? "" : " - non ancora disponibile");
      option.disabled = !truthy(row.abilitata_frontend);
      option.selected = row.categoria_id === "generica_fpld";
      select.appendChild(option);
    });
    updateCategoryNote();
  }
  function updateCategoryNote() {
    var category = categoryFor(inputText("pcCategory", "generica_fpld"));
    if (!category) return;
    byId("pcCategoryNote").textContent = category.note || "";
    var tag = byId("pcCategoryTag");
    if (tag) tag.textContent = category.gestione || "FPLD";
    var business = ["artigiani", "commercianti"].indexOf(category.profilo_aliquota_id) >= 0;
    var conventional = category.profilo_aliquota_id === "agricoli_autonomi";
    document.querySelectorAll("[data-employee-label]").forEach(function (label) {
      if (conventional && label.dataset.conventionalLabel) label.textContent = label.dataset.conventionalLabel;
      else if (business && label.dataset.businessLabel) label.textContent = label.dataset.businessLabel;
      else label.textContent = label.dataset.employeeLabel;
    });
    var minimum = toNumber(category.anno_minimo_calcolabile, 1976);
    ["pcSimpleStartYear"].forEach(function (id) {
      var input = byId(id);
      if (input && toNumber(input.value, minimum) < minimum) input.value = minimum;
    });
    document.querySelectorAll('[data-period-field="start"]').forEach(function (input) {
      if (toNumber(input.value, minimum) < minimum) input.value = minimum;
    });
    updateSimpleContributionYearOptions();
  }
  function fillSelect(select, values, selected) {
    clear(select);
    values.forEach(function (value) {
      var option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      option.selected = Number(value) === Number(selected);
      select.appendChild(option);
    });
  }
  function populateSimpleMenus() {
    var current = new Date().getFullYear();
    var years = [];
    for (var year = 1976; year <= current; year += 1) years.push(year);
    fillSelect(byId("pcSimpleStartYear"), years, 1996);
    updateSimpleContributionYearOptions(29);
  }
  function updateSimpleContributionYearOptions(preferred) {
    var select = byId("pcSimpleContributedYears");
    if (!select) return;
    var retirement = parseDate(inputText("pcRetirementDate", "2025-01-01"));
    var end = (retirement ? retirement.getFullYear() : 2025) - 1;
    var start = inputNumber("pcSimpleStartYear", 1996);
    var possible = Math.max(1, end - start + 1);
    var currentValue = preferred || inputNumber("pcSimpleContributedYears", Math.min(possible, 29));
    var selected = Math.max(1, Math.min(currentValue, possible));
    var values = [];
    for (var count = 1; count <= possible; count += 1) values.push(count);
    fillSelect(select, values, selected);
    var note = byId("pcSimpleContributedYearsNote");
    if (note) note.textContent = "Massimo " + possible + " anni tra " + start + " e " + end + ".";
  }

  function makePeriod(index, values) {
    values = values || {};
    var wrapper = document.createElement("div");
    wrapper.className = "pc-period";
    wrapper.innerHTML = '<h4>Periodo ' + (index + 1) + '</h4>' +
      '<label><span>Anno iniziale</span><input data-period-field="start" type="number" min="1976" max="2050" value="' + (values.start || "") + '"></label>' +
      '<label><span>Anno finale</span><input data-period-field="end" type="number" min="1976" max="2050" value="' + (values.end || "") + '"></label>' +
      '<label><span data-employee-label="Retribuzione annua lorda (RAL) iniziale" data-business-label="Reddito imponibile iniziale" data-conventional-label="Reddito convenzionale iniziale">Retribuzione annua lorda (RAL) iniziale</span><input data-period-field="ralStart" type="number" min="0" step="500" value="' + (values.ralStart || "") + '"></label>' +
      '<label><span data-employee-label="Retribuzione annua lorda (RAL) finale" data-business-label="Reddito imponibile finale" data-conventional-label="Reddito convenzionale finale">Retribuzione annua lorda (RAL) finale</span><input data-period-field="ralEnd" type="number" min="0" step="500" value="' + (values.ralEnd || "") + '"></label>' +
      '<label><span>Quota lavoro</span><input data-period-field="workShare" type="number" min="1" max="100" value="' + (values.workShare || 100) + '"></label>' +
      '<label><span>Mesi annui</span><input data-period-field="months" type="number" min="0" max="12" step="0.5" value="' + (values.months || 12) + '"></label>';
    return wrapper;
  }
  function initPeriods() {
    var node = byId("pcPeriods");
    clear(node);
    node.appendChild(makePeriod(0, { start: 1996, end: 2024, ralStart: 20000, ralEnd: 38000, workShare: 100, months: 12 }));
    node.appendChild(makePeriod(1));
    node.appendChild(makePeriod(2));
  }

  function readScenario() {
    var birth = parseDate(inputText("pcBirthDate", "1960-01-01"));
    var retirement = parseDate(inputText("pcRetirementDate", "2025-01-01"));
    if (!birth || !retirement) throw new Error("Inserisci date di nascita e pensionamento valide.");
    var age = ageParts(birth, retirement);
    var currentYear = new Date().getFullYear();
    var pensionMonths = inputNumber("pcPensionMonths", 13);
    var pensionInput = inputNumber("pcMonthlyPension", 2000);
    var pensionValueType = inputText("pcPensionValueType", "lordo");
    var annualGross = pensionValueType === "netto" ? pensionGrossAnnualFromNet(pensionInput * pensionMonths, currentYear) : pensionInput * pensionMonths;
    var annualNet = pensionValueType === "netto" ? pensionInput * pensionMonths : pensionNetAnnualEstimate(annualGross, currentYear);
    var start, end, contributed, workShare, workMonths, firstRal, finalRal, progression;
    if (state.mode === "simple") {
      start = inputNumber("pcSimpleStartYear", 1996);
      end = retirement.getFullYear() - 1;
      contributed = inputNumber("pcSimpleContributedYears", Math.max(1, end - start + 1));
      var pattern = inputText("pcSimpleWorkPattern", "100");
      workShare = pattern === "seasonal" ? 100 : toNumber(pattern, 100);
      workMonths = pattern === "seasonal" ? 8 : 12;
      firstRal = null;
      finalRal = careerAmountToEuro(inputNumber("pcSimpleFinalRal", 38000), inputText("pcSimpleCurrency", "euro"));
      progression = "media";
    } else {
      var annualYears = state.annualRows.map(function (row) { return row.anno; });
      start = annualYears.length ? Math.min.apply(null, annualYears) : 1996;
      end = annualYears.length ? Math.max.apply(null, annualYears) : retirement.getFullYear() - 1;
      contributed = annualYears.length;
      workShare = 100;
      workMonths = 12;
      firstRal = null;
      finalRal = null;
      progression = "media";
    }
    return {
      scenario_id: "frontend",
      data_nascita: isoDate(birth),
      data_pensionamento: isoDate(retirement),
      anno_nascita: birth.getFullYear(),
      sesso: inputText("pcSex", "T"),
      categoria_id: inputText("pcCategory", "generica_fpld"),
      anno_inizio: start,
      anno_fine: end,
      anno_pensione: retirement.getFullYear(),
      eta_pensione: age.years,
      mesi_eta_pensione: age.months,
      ral_iniziale: firstRal,
      ral_finale: finalRal,
      livello_finale: "medio",
      progressione: progression,
      anni_contribuiti: contributed,
      percentuale_lavoro: workShare,
      mesi_lavorati_annui: workMonths,
      pensione_mensile_attuale: pensionInput,
      pensione_valore_tipo: pensionValueType,
      pensione_lorda_mensile_effettiva: annualGross / pensionMonths,
      pensione_netto_mensile_stimato: annualNet / pensionMonths,
      mensilita_pensione: pensionMonths,
      anno_riferimento_pensione: currentYear,
      rivalutazione_futura_pensione: inputText("pcFutureIndexation", "inflazione_costante"),
      tasso_inflazione_futura: inputNumber("pcFutureInflation", 2) / 100
    };
  }
  function validateScenario(scenario) {
    var category = categoryFor(scenario.categoria_id);
    var supported = ["fpld", "artigiani", "commercianti", "pubblico_ctps", "pubblico_enti_locali", "agricoli_dipendenti", "agricoli_autonomi"];
    if (!category || !truthy(category.abilitata_frontend) || supported.indexOf(category.profilo_aliquota_id) < 0) throw new Error("La categoria scelta non ha ancora una serie storica utilizzabile.");
    if (category.anno_minimo_calcolabile && scenario.anno_inizio < toNumber(category.anno_minimo_calcolabile)) throw new Error(category.categoria_nome + " e' disponibile dal " + category.anno_minimo_calcolabile + ". Per gli anni precedenti inserisci i contributi effettivi di una gestione supportata.");
    if (scenario.anno_inizio > scenario.anno_fine) throw new Error("L'inizio della carriera deve precedere la fine.");
    if (scenario.anno_fine >= scenario.anno_pensione) throw new Error("La carriera deve terminare prima del pensionamento.");
    if (scenario.eta_pensione < 40 || scenario.eta_pensione > 80) throw new Error("Controlla le date: l'eta al pensionamento non e' plausibile.");
    if (scenario.percentuale_lavoro <= 0 || scenario.percentuale_lavoro > 100) throw new Error("La quota di lavoro deve essere tra 1 e 100.");
  }
  function rateForYear(year, categoryId) {
    var category = categoryFor(categoryId);
    var profile = category ? category.profilo_aliquota_id : "fpld";
    var table = paramRows("annual").filter(function (row) { return (row.profilo_aliquota_id || "fpld") === profile; });
    var exact = table.find(function (row) { return toNumber(row.anno) === year; });
    if (exact) return exact;
    var previous = table.filter(function (row) { return toNumber(row.anno, 0) <= year; }).sort(function (a, b) { return toNumber(b.anno) - toNumber(a.anno); })[0];
    if (!previous) throw new Error("Non esiste un'aliquota disponibile per la categoria e l'anno selezionati.");
    return previous;
  }
  function coefficientFor(year, age, months) {
    var table = paramRows("coefficients");
    var period = table.filter(function (row) { return toNumber(row.periodo_dal) <= year && toNumber(row.periodo_al) >= year; });
    var nature = "osservato";
    if (!period.length) {
      nature = "tabella piu' vicina";
      var periods = table.map(function (row) { return toNumber(row.periodo_dal, 0); }).filter(function (value, index, values) { return values.indexOf(value) === index; });
      var nearest = periods.sort(function (a, b) { return Math.abs(a - year) - Math.abs(b - year); })[0];
      period = table.filter(function (row) { return toNumber(row.periodo_dal) === nearest; });
    }
    var byAge = {};
    period.forEach(function (row) { byAge[toNumber(row.eta)] = toNumber(row.coefficiente); });
    var ages = Object.keys(byAge).map(Number).sort(function (a, b) { return a - b; });
    var rawAge = Math.max(ages[0], Math.min(age + Math.max(0, Math.min(months || 0, 11)) / 12, ages[ages.length - 1]));
    var lower = Math.floor(rawAge), upper = Math.min(lower + 1, ages[ages.length - 1]);
    var coefficient = byAge[lower];
    if (upper !== lower && byAge[upper] !== undefined) coefficient += (byAge[upper] - byAge[lower]) * (rawAge - lower);
    return { coefficiente: coefficient, eta_usata: rawAge, natura: nature };
  }
  function contractualSalaryProfile(years, scenario) {
    var category = categoryFor(scenario.categoria_id);
    var agreementId = category && category.indice_ccnl_id;
    if (!agreementId || state.mode === "accurate") return null;
    var table = paramRows("contract_wages").filter(function (row) { return row.indice_ccnl_id === agreementId; });
    if (!table.length) return null;
    var indexByYear = {};
    table.forEach(function (row) { indexByYear[toNumber(row.anno)] = toNumber(row.indice_retribuzione_contrattuale); });
    var observedYears = Object.keys(indexByYear).map(Number).sort(function (a, b) { return a - b; });
    var firstObserved = observedYears[0], lastObserved = observedYears[observedYears.length - 1];
    function indexFor(year) {
      if (indexByYear[year] !== undefined) return indexByYear[year];
      if (year < firstObserved) return indexByYear[firstObserved] / Math.pow(1.02, firstObserved - year);
      return indexByYear[lastObserved] * Math.pow(1.02, year - lastObserved);
    }
    var start = years[0], end = years[years.length - 1];
    var firstRal = scenario.ral_iniziale;
    var finalRal = scenario.ral_finale || 36000;
    if (!firstRal) firstRal = finalRal * indexFor(start) / indexFor(end);
    var contractualRatio = indexFor(end) / indexFor(start);
    var targetRatio = finalRal / Math.max(firstRal, 1);
    var correction = Math.pow(targetRatio / Math.max(contractualRatio, 0.0001), 1 / Math.max(1, end - start));
    var profile = {};
    years.forEach(function (year) {
      profile[year] = firstRal * indexFor(year) / indexFor(start) * Math.pow(correction, year - start);
    });
    return { profile: profile, nature: "indice retribuzioni contrattuali ISTAT " + agreementId + ", calibrato sugli input" };
  }
  function salaryProfile(years, scenario) {
    var contractual = contractualSalaryProfile(years, scenario);
    if (contractual) return contractual;
    var growth = PROGRESSION[scenario.progressione] === undefined ? PROGRESSION.media : PROGRESSION[scenario.progressione];
    var start = years[0], end = years[years.length - 1], profile = {};
    if (scenario.ral_iniziale && scenario.ral_finale) {
      years.forEach(function (year) {
        var local = Math.pow(scenario.ral_finale / scenario.ral_iniziale, 1 / Math.max(1, end - start)) - 1;
        profile[year] = scenario.ral_iniziale * Math.pow(1 + local, year - start);
      });
      return { profile: profile, nature: "stimato su due RAL" };
    }
    var finalRal = scenario.ral_finale || 36000;
    years.forEach(function (year) { profile[year] = finalRal / Math.pow(1 + Math.max(growth, 0.015), end - year); });
    return { profile: profile, nature: "stimato su ultima RAL" };
  }
  function contributionMonthsByYear(years, contributedYears, annualMonths) {
    var allocation = {};
    years.forEach(function (year) { allocation[year] = 0; });
    var cappedYears = Math.max(0, Math.min(toNumber(contributedYears, years.length), years.length));
    var cappedMonths = Math.max(0, Math.min(toNumber(annualMonths, 12), 12));
    var remaining = cappedYears * cappedMonths;
    years.slice().reverse().some(function (year) {
      var months = Math.min(cappedMonths, remaining);
      allocation[year] = months;
      remaining -= months;
      return remaining <= 0.0000001;
    });
    return allocation;
  }
  function contributionSplit(taxable, rate, financial) {
    var financing = toNumber(rate.aliquota_finanziamento, 0);
    var total = financial === undefined || financial === null ? taxable * financing : toNumber(financial, 0);
    var worker, employer;
    if (financial === undefined || financial === null || financing <= 0) {
      worker = taxable * toNumber(rate.quota_lavoratore, 0);
      employer = taxable * toNumber(rate.quota_datore, 0);
    } else {
      worker = total * toNumber(rate.quota_lavoratore, 0) / financing;
      employer = total * toNumber(rate.quota_datore, 0) / financing;
    }
    return { total: total, worker: worker, employer: employer };
  }
  function buildCareer(scenario) {
    validateScenario(scenario);
    var category = categoryFor(scenario.categoria_id);
    var years = [];
    for (var year = scenario.anno_inizio; year <= scenario.anno_fine; year += 1) years.push(year);
    var salary = salaryProfile(years, scenario);
    var monthsByYear = contributionMonthsByYear(years, scenario.anni_contribuiti || years.length, scenario.mesi_lavorati_annui || 12);
    var workShare = (scenario.percentuale_lavoro || 100) / 100;
    var accrued = 0;
    return years.map(function (year, index) {
      var rate = rateForYear(year, scenario.categoria_id);
      var gross = Math.max(salary.profile[year], 0);
      var months = monthsByYear[year] || 0;
      var taxable = gross * workShare * months / 12;
      var financing = toNumber(rate.aliquota_finanziamento, 0.327);
      var computation = toNumber(rate.aliquota_computo, 0.33);
      var capitalization = toNumber(rate.tasso_capitalizzazione, 0);
      var split = contributionSplit(taxable, rate);
      var financial = split.total;
      var credit = taxable * computation;
      accrued = accrued * (1 + capitalization) + credit;
      return { scenario_id: "frontend", anno: year, categoria: scenario.categoria_id, gestione: category.gestione, retribuzione_stimata: gross, retribuzione_inserita: null, mesi_lavorati: months, percentuale_part_time: workShare * 100, imponibile_previdenziale: taxable, aliquota_finanziamento: financing, aliquota_computo: computation, quota_lavoratore: toNumber(rate.quota_lavoratore, 0), quota_datore: toNumber(rate.quota_datore, 0), contributi_finanziari: financial, contributi_lavoratore: split.worker, contributi_datore: split.employer, accredito_montante: credit, tasso_rivalutazione: capitalization, montante_fine_anno: accrued, natura_dato: salary.nature, indice_anno: index + 1 };
    });
  }
  function buildAccurateCareer(scenario) {
    if (!state.annualRows.length) generateAnnualRows();
    validateScenario(scenario);
    var seen = {}, accrued = 0;
    return state.annualRows.slice().sort(function (a, b) { return a.anno - b.anno; }).map(function (row, index) {
      if (seen[row.anno]) throw new Error("Anno duplicato nella tabella accurata: " + row.anno);
      seen[row.anno] = true;
      var category = categoryFor(row.categoria || scenario.categoria_id) || categoryFor(scenario.categoria_id);
      var rate = rateForYear(row.anno, category.categoria_id);
      var taxable = Math.max(toNumber(row.imponibile_previdenziale, 0), 0);
      var financing = toNumber(rate.aliquota_finanziamento, 0.327), computation = toNumber(rate.aliquota_computo, 0.33), capitalization = toNumber(rate.tasso_capitalizzazione, 0);
      var explicitFinancial = row.contributi !== null && row.contributi !== undefined ? toNumber(row.contributi, 0) : null;
      var split = contributionSplit(taxable, rate, explicitFinancial);
      var financial = split.total;
      var credit = taxable * computation + toNumber(row.contributi_figurativi, 0);
      accrued = accrued * (1 + capitalization) + credit;
      return { scenario_id: "frontend", anno: row.anno, categoria: category.categoria_id, gestione: category.gestione, retribuzione_stimata: taxable, retribuzione_inserita: taxable, mesi_lavorati: toNumber(row.mesi_lavorati, 12), percentuale_part_time: toNumber(row.percentuale_part_time, 100), imponibile_previdenziale: taxable, aliquota_finanziamento: financing, aliquota_computo: computation, quota_lavoratore: toNumber(rate.quota_lavoratore, 0), quota_datore: toNumber(rate.quota_datore, 0), contributi_finanziari: financial, contributi_lavoratore: split.worker, contributi_datore: split.employer, accredito_montante: credit, tasso_rivalutazione: capitalization, montante_fine_anno: accrued, natura_dato: row.natura_dato || "stimato_periodi", indice_anno: index + 1 };
    });
  }

  function sexLabel(value) { return value === "M" ? "Maschi" : value === "F" ? "Femmine" : "Totale"; }
  function mortalityRows(scenario) {
    var table = paramRows("mortality").filter(function (row) { return row.sesso === sexLabel(scenario.sesso); });
    return table.length ? table : paramRows("mortality").filter(function (row) { return row.sesso === "Totale"; });
  }
  function survival(scenario, age, horizon) {
    var table = mortalityRows(scenario);
    var base = table.find(function (row) { return toNumber(row.eta) === Math.floor(age); });
    var target = table.find(function (row) { return toNumber(row.eta) === Math.min(Math.floor(age + horizon), 110); });
    var baseSurvivors = base ? toNumber(base.sopravviventi, 100000) : 100000;
    return target ? Math.max(0, Math.min(1, toNumber(target.sopravviventi, 0) / baseSurvivors)) : 0;
  }
  function lifeExpectancy(scenario, retirementAge) {
    var row = mortalityRows(scenario).find(function (item) { return toNumber(item.eta) === Math.floor(retirementAge); });
    var observed = row ? toNumber(row.speranza_vita, null) : null;
    if (observed !== null) return observed;
    var sum = 0;
    for (var horizon = 1; horizon <= 55; horizon += 1) sum += survival(scenario, retirementAge, horizon);
    return sum;
  }
  function effectiveAnnualPension(scenario) {
    var annual = (scenario.pensione_lorda_mensile_effettiva || 0) * (scenario.mensilita_pensione || 13);
    if (scenario.anno_riferimento_pensione > scenario.anno_pensione) annual /= Math.pow(1.02, scenario.anno_riferimento_pensione - scenario.anno_pensione);
    return annual;
  }
  function futureIndexationRate(scenario) {
    return scenario.rivalutazione_futura_pensione === "inflazione_costante" ? Math.max(0, toNumber(scenario.tasso_inflazione_futura, 0.02)) : 0;
  }
  function indexedAnnuityMultiplier(scenario, age) {
    var futureRate = futureIndexationRate(scenario);
    if (!futureRate) return 1;
    var flat = 0, indexed = 0;
    for (var horizon = 0; horizon <= 55; horizon += 1) {
      var probability = survival(scenario, age, horizon);
      flat += probability;
      indexed += probability * Math.pow(1 + futureRate, horizon);
    }
    return flat ? indexed / flat : 1;
  }
  function calculateTimeline(scenario, accrued, actualAnnual) {
    var birth = parseDate(scenario.data_nascita), retirement = parseDate(scenario.data_pensionamento), today = new Date();
    var retirementAge = ageParts(birth, retirement).total;
    var elapsed = retirement <= today ? elapsedYears(retirement, today) : 0;
    var elapsedMonths = retirement <= today ? Math.max(0, Math.floor(elapsed * 12)) : 0;
    var lifeAt65 = lifeExpectancy(scenario, LIFE_EXPECTANCY_BASE_AGE);
    var expectedAge = LIFE_EXPECTANCY_BASE_AGE + lifeAt65;
    var remainingLife = Math.max(0, expectedAge - retirementAge);
    var expectedMonths = Math.max(1, Math.round(remainingLife * 12));
    var futureRate = futureIndexationRate(scenario);
    var cumulative = 0, received = 0, atExpected = 0, exhaustionMonth = null, points = [{ month: 0, age: retirementAge, cumulative: 0 }];
    for (var month = 1; month <= 960; month += 1) {
      var annualPayment;
      if (month <= elapsedMonths) annualPayment = actualAnnual * Math.pow(1.02, month / 12);
      else annualPayment = actualAnnual * Math.pow(1.02, elapsedMonths / 12) * Math.pow(1 + futureRate, (month - elapsedMonths) / 12);
      cumulative += annualPayment / 12;
      if (month === elapsedMonths) received = cumulative;
      if (month === expectedMonths) atExpected = cumulative;
      if (exhaustionMonth === null && cumulative >= accrued) exhaustionMonth = month;
      if (month % 3 === 0 || month === elapsedMonths || month === expectedMonths || month === exhaustionMonth) points.push({ month: month, age: retirementAge + month / 12, cumulative: cumulative });
    }
    if (!elapsedMonths) received = 0;
    var exhaustionDate = exhaustionMonth === null ? null : addMonths(retirement, exhaustionMonth);
    return { retirementAge: retirementAge, yearsRetired: elapsed, elapsedMonths: elapsedMonths, lifeRemaining: remainingLife, lifeExpectancyBaseAge: LIFE_EXPECTANCY_BASE_AGE, lifeExpectancyAtBase: lifeAt65, expectedAge: expectedAge, expectedMonths: expectedMonths, received: received, remainingToday: accrued - received, cumulativeAtExpected: atExpected, balanceAtExpected: accrued - atExpected, exhaustionMonth: exhaustionMonth, exhaustionAge: exhaustionMonth === null ? null : retirementAge + exhaustionMonth / 12, exhaustionDate: exhaustionDate, points: points };
  }
  function classifyRegime(career) {
    var before = career.filter(function (row) { return row.anno < 1996; }).length;
    return !before ? "contributivo" : before >= 18 ? "prevalentemente retributivo" : "misto";
  }
  function reliability(career) {
    if (state.mode === "accurate") {
      var actual = career.length && career.every(function (row) { return row.natura_dato === "inserito_utente"; });
      if (actual) return { level: "alta", note: "Gli imponibili effettivi sono stati inseriti anno per anno; restano le approssimazioni fiscali e dei parametri non osservabili." };
      return { level: "media", note: "Le righe annuali sono precompilate da periodi medi. Sostituisci ogni imponibile con il dato dell'estratto contributivo INPS per ottenere la modalita accurata." };
    }
    var contractBased = career.length && career.every(function (row) { return String(row.natura_dato || "").indexOf("indice retribuzioni contrattuali ISTAT") === 0; });
    if (contractBased) return { level: "media", note: "La carriera semplificata usa l'indice ISTAT delle retribuzioni contrattuali del contratto scelto, calibrato sull'importo inserito. Gli imponibili INPS effettivi restano piu' precisi." };
    return { level: "bassa", note: "La carriera e' ricostruita con pochi dati e va letta come ordine di grandezza." };
  }
  function calculateMetrics(career, scenario) {
    var last = career[career.length - 1] || {};
    var accrued = toNumber(last.montante_fine_anno, 0), coefficient = coefficientFor(scenario.anno_pensione, scenario.eta_pensione, scenario.mesi_eta_pensione);
    var contributive = accrued * coefficient.coefficiente, actualAtRetirement = effectiveAnnualPension(scenario);
    var indexationMultiplier = indexedAnnuityMultiplier(scenario, scenario.eta_pensione);
    var actuarialRequired = coefficient.coefficiente ? actualAtRetirement / coefficient.coefficiente * indexationMultiplier : null;
    var actuarialGap = actuarialRequired ? accrued - actuarialRequired : null;
    var actuarialCoverage = actuarialRequired ? accrued / actuarialRequired : null;
    var referenceFactor = Math.pow(1.02, Math.max(0, scenario.anno_riferimento_pensione - scenario.anno_pensione));
    var contributiveAtReference = contributive * referenceFactor;
    var actualAtReference = scenario.pensione_lorda_mensile_effettiva * scenario.mensilita_pensione;
    var timeline = calculateTimeline(scenario, accrued, actualAtRetirement), expected = 0;
    var futureRate = futureIndexationRate(scenario);
    for (var horizon = 0; horizon <= 55; horizon += 1) expected += actualAtRetirement * Math.pow(1 + futureRate, horizon) * survival(scenario, timeline.retirementAge, horizon);
    var rel = reliability(career), months = scenario.mensilita_pensione || 13;
    return { anni_contribuzione: career.reduce(function (sum, row) { return sum + toNumber(row.mesi_lavorati, 0) / 12; }, 0), contributi_finanziari_versati: career.reduce(function (sum, row) { return sum + toNumber(row.contributi_finanziari, 0); }, 0), contributi_lavoratore_versati: career.reduce(function (sum, row) { return sum + toNumber(row.contributi_lavoratore, 0); }, 0), contributi_datore_versati: career.reduce(function (sum, row) { return sum + toNumber(row.contributi_datore, 0); }, 0), accredito_totale_montante: career.reduce(function (sum, row) { return sum + toNumber(row.accredito_montante, 0); }, 0), montante_contributivo: accrued, capitale_attuariale_necessario: actuarialRequired, fattore_capitale_perequazione: indexationMultiplier, rivalutazione_futura_pensione: scenario.rivalutazione_futura_pensione, tasso_inflazione_futura: futureRate, gap_attuariale_montante: actuarialGap, copertura_attuariale: actuarialCoverage, coefficiente_trasformazione: coefficient.coefficiente, eta_coefficiente: coefficient.eta_usata, anno_riferimento_confronto: scenario.anno_riferimento_pensione, pensione_contributiva_annua_equivalente: contributive, pensione_effettiva_annua_lorda: actualAtRetirement, pensione_contributiva_annua_equivalente_anno_riferimento: contributiveAtReference, pensione_effettiva_annua_lorda_anno_riferimento: actualAtReference, pensione_contributiva_mensile_equivalente: contributiveAtReference / months, pensione_effettiva_mensile_lorda_anno_riferimento: actualAtReference / months, differenza_mensile_lorda: (actualAtReference - contributiveAtReference) / months, differenza_annua_lorda: actualAtReference - contributiveAtReference, differenza_percentuale_su_contributiva: contributiveAtReference ? (actualAtReference - contributiveAtReference) / contributiveAtReference : 0, valore_atteso_prestazioni_lorde: expected, eta_pareggio: timeline.exhaustionAge, regime_indicativo: classifyRegime(career), livello_affidabilita: rel.level, input_migliorativi: rel.note, natura_coefficiente: coefficient.natura, timeline: timeline };
  }

  function makeKpi(label, value, note) {
    var node = document.createElement("div");
    node.className = "pi-kpi";
    node.innerHTML = "<span>" + label + "</span><strong>" + value + "</strong><small>" + (note || "") + "</small>";
    return node;
  }
  function renderResults(result, scenario) {
    var node = byId("pcKpis"), timeline = result.timeline;
    clear(node);
    var exhaustionLabel = timeline.exhaustionDate ? formatDate(timeline.exhaustionDate) : "non raggiunto";
    var pensionInputNote = scenario.pensione_valore_tipo === "netto" ? "lordo stimato dalla pensione netta inserita" : "pensione lorda attuale inserita";
    var gap = toNumber(result.gap_attuariale_montante, null);
    var futureRate = toNumber(result.tasso_inflazione_futura, 0);
    var indexationNote = futureRate ? "include rivalutazione futura al " + pct(futureRate) + " annuo" : "senza rivalutazione futura";
    var coverageNote = gap === null ? "montante / capitale necessario" : (gap >= 0 ? "avanzo attuariale di " + euro(gap) : "mancano " + euro(Math.abs(gap)));
    [
      ["Montante contributivo", euro(result.montante_contributivo), "accrediti rivalutati a fine carriera"],
      ["Contributi lavoratore", euro(result.contributi_lavoratore_versati), "quota trattenuta o versata personalmente"],
      ["Contributi impresa", euro(result.contributi_datore_versati), "quota a carico del datore; zero per autonomi"],
      ["Contributi totali", euro(result.contributi_finanziari_versati), "lavoratore + datore/impresa, al netto delle approssimazioni"],
      ["Capitale necessario", euro(result.capitale_attuariale_necessario), indexationNote],
      ["Copertura attuariale", pct(result.copertura_attuariale), coverageNote],
      ["Pensione effettiva", euro(result.pensione_effettiva_mensile_lorda_anno_riferimento), pensionInputNote],
      ["Pensione contributiva", euro(result.pensione_contributiva_mensile_equivalente), "lordo equivalente per rata nel " + result.anno_riferimento_confronto],
      ["Coefficiente", pct(result.coefficiente_trasformazione, 3), "eta " + fmt(result.eta_coefficiente, 2) + " alla data di pensionamento"],
      ["Differenza per rata", euro(result.differenza_mensile_lorda), pct(result.differenza_percentuale_su_contributiva) + " rispetto alla contributiva"],
      ["Tempo in pensione", timeline.yearsRetired ? fmt(timeline.yearsRetired, 1) + " anni" : "non ancora", "calcolato dalla data inserita"],
      ["Gia' ricevuto", euro(timeline.received), "stima lorda cumulata fino a oggi"],
      ["Montante virtuale residuo", euro(timeline.remainingToday), timeline.remainingToday >= 0 ? "soglia ancora da raggiungere" : "soglia gia' superata"],
      ["Raggiungimento nominale", exhaustionLabel, timeline.exhaustionAge ? "cumulato pensioni = montante, non pareggio attuariale" : "entro l'orizzonte simulato"],
      ["Eta attesa media", fmt(timeline.expectedAge, 1) + " anni", "65 anni + vita residua a 65 anni"],
      ["Affidabilita", result.livello_affidabilita, result.input_migliorativi]
    ].forEach(function (item) { node.appendChild(makeKpi(item[0], item[1], item[2])); });

    var direction = result.differenza_mensile_lorda >= 0 ? "superiore" : "inferiore";
    var narrative = "La pensione inserita e' " + direction + " di " + euro(Math.abs(result.differenza_mensile_lorda)) + " per rata rispetto alla pensione interamente contributiva stimata. ";
    narrative += "Il montante stimato copre il " + pct(result.copertura_attuariale) + " del capitale necessario a finanziare la pensione inserita, includendo la rivalutazione futura selezionata. ";
    narrative += timeline.exhaustionDate ? "Il cumulato nominale delle rate raggiunge il montante virtuale intorno a " + formatDate(timeline.exhaustionDate) + ", ma questa non e' una prova di pareggio attuariale. " : "Nell'orizzonte simulato il cumulato nominale delle rate non raggiunge il montante virtuale. ";
    narrative += "All'eta attesa media di " + fmt(timeline.expectedAge, 1) + " anni, calcolata dalla vita residua a 65 anni, il totale lordo cumulato sarebbe circa " + euro(timeline.cumulativeAtExpected) + ".";
    byId("pcResultNarrative").textContent = narrative;
    byId("pcReliability").innerHTML = "<strong>Affidabilita " + result.livello_affidabilita + ".</strong> " + result.input_migliorativi + " Il montante virtuale e' una soglia di confronto, non un conto individuale che viene svuotato.";
    byId("pcPensionChartNote").textContent = "Con pensionamento il " + new Date(scenario.data_pensionamento + "T00:00:00").toLocaleDateString("it-IT") + ", il coefficiente applicato e' " + pct(result.coefficiente_trasformazione, 3) + ". Nel " + result.anno_riferimento_confronto + " la rata effettiva lorda e' " + euro(result.pensione_effettiva_mensile_lorda_anno_riferimento) + "; quella contributiva equivalente e' " + euro(result.pensione_contributiva_mensile_equivalente) + ".";
    byId("pcCumulativeChartNote").textContent = "La linea del montante mostra quando il cumulato nominale delle rate lo supera; la linea del capitale necessario include la rivalutazione futura selezionata. Il pareggio corretto e' la copertura attuariale, non il semplice incrocio nominale.";
  }

  function axis(title) { return { title: title, rangemode: state.axisMode === "zero" ? "tozero" : "normal" }; }
  function renderCharts(career, result) {
    plot("pcPensionChart", [{ type: "bar", x: ["Pensione effettiva", "Pensione maturata"], y: [result.pensione_effettiva_mensile_lorda_anno_riferimento, result.pensione_contributiva_mensile_equivalente], marker: { color: [COLORS[0], COLORS[2]] }, text: [euro(result.pensione_effettiva_mensile_lorda_anno_riferimento), euro(result.pensione_contributiva_mensile_equivalente)], textposition: "outside", cliponaxis: false, hovertemplate: "%{x}<br>%{y:,.0f} euro lordi per rata<extra></extra>" }], { margin: { t: 44, r: 24, b: 64, l: 82 }, yaxis: axis("euro lordi per rata"), showlegend: false });

    var timeline = result.timeline;
    var horizonAge = Math.max(timeline.retirementAge + 2, timeline.expectedAge + 2, timeline.exhaustionAge ? timeline.exhaustionAge + 2 : timeline.expectedAge + 2);
    var visible = timeline.points.filter(function (point) { return point.age <= horizonAge; });
    var past = visible.filter(function (point) { return point.month <= timeline.elapsedMonths; });
    var future = visible.filter(function (point) { return point.month >= timeline.elapsedMonths; });
    if (past.length && future.length && past[past.length - 1].month !== future[0].month) future.unshift(past[past.length - 1]);
    var cumulativeTraces = [
      { type: "scatter", mode: "lines", name: "Ricevuto fino a oggi", x: past.map(function (point) { return point.age; }), y: past.map(function (point) { return point.cumulative; }), line: { color: COLORS[0], width: 4 }, hovertemplate: "Eta %{x:.1f}<br>%{y:,.0f} euro<extra></extra>" },
      { type: "scatter", mode: "lines", name: "Proiezione", x: future.map(function (point) { return point.age; }), y: future.map(function (point) { return point.cumulative; }), line: { color: COLORS[0], width: 3, dash: "dash" }, hovertemplate: "Eta %{x:.1f}<br>%{y:,.0f} euro<extra></extra>" },
      { type: "scatter", mode: "lines", name: "Montante virtuale", x: visible.map(function (point) { return point.age; }), y: visible.map(function () { return result.montante_contributivo; }), line: { color: COLORS[2], width: 2, dash: "dot" }, hovertemplate: "%{y:,.0f} euro<extra></extra>" },
      { type: "scatter", mode: "lines", name: "Capitale necessario", x: visible.map(function (point) { return point.age; }), y: visible.map(function () { return result.capitale_attuariale_necessario; }), line: { color: COLORS[5], width: 2, dash: "dashdot" }, hovertemplate: "%{y:,.0f} euro<extra></extra>" },
      { type: "scatter", mode: "markers", name: "Eta attesa media", x: [timeline.expectedAge], y: [timeline.cumulativeAtExpected], marker: { color: COLORS[3], size: 10, symbol: "diamond" }, hovertemplate: "Eta attesa %{x:.1f}<br>%{y:,.0f} euro<extra></extra>" }
    ];
    if (timeline.elapsedMonths > 0) cumulativeTraces.push({ type: "scatter", mode: "markers", name: "Oggi", x: [timeline.retirementAge + timeline.elapsedMonths / 12], y: [timeline.received], marker: { color: COLORS[1], size: 11, symbol: "circle" }, hovertemplate: "Oggi, eta %{x:.1f}<br>%{y:,.0f} euro ricevuti<extra></extra>" });
    if (timeline.exhaustionAge) cumulativeTraces.push({ type: "scatter", mode: "markers", name: "Raggiungimento montante", x: [timeline.exhaustionAge], y: [result.montante_contributivo], marker: { color: COLORS[4], size: 12, symbol: "x" }, hovertemplate: "Montante raggiunto<br>Eta %{x:.1f}<extra></extra>" });
    plot("pcCumulativeChart", cumulativeTraces, { xaxis: { title: "eta", range: [timeline.retirementAge, horizonAge] }, yaxis: axis("pensioni lorde cumulate (euro)") });
  }

  function calculate() {
    try {
      var scenario = readScenario();
      var career = state.mode === "accurate" ? buildAccurateCareer(scenario) : buildCareer(scenario);
      var result = calculateMetrics(career, scenario);
      state.scenario = scenario; state.career = career; state.result = result;
      renderResults(result, scenario); renderCharts(career, result, scenario);
      setStatus("Calcolo aggiornato in modalita " + (state.mode === "simple" ? "semplificata" : "accurata") + ". Tutti i valori sono lordi.", false);
    } catch (error) { setStatus(error.message || "Errore nel calcolo", true); }
  }
  function generateAnnualRows() {
    var output = [], categoryId = inputText("pcCategory", "generica_fpld");
    Array.from(document.querySelectorAll(".pc-period")).forEach(function (period) {
      function field(name) { var input = period.querySelector('[data-period-field="' + name + '"]'); return input ? toNumber(input.value, null) : null; }
      var start = field("start"), end = field("end");
      if (!start || !end) return;
      var currency = inputText("pcPeriodCurrency", "euro");
      var rawRalStart = field("ralStart"), rawRalEnd = field("ralEnd");
      if (!rawRalStart) rawRalStart = rawRalEnd || 0;
      if (!rawRalEnd) rawRalEnd = rawRalStart;
      var ralStart = careerAmountToEuro(rawRalStart, currency), ralEnd = careerAmountToEuro(rawRalEnd, currency), months = field("months") || 12, workShare = field("workShare") || 100;
      for (var year = start; year <= end; year += 1) {
        var share = start === end ? 0 : (year - start) / (end - start), salary = ralStart + (ralEnd - ralStart) * share;
        output.push({ anno: year, categoria: categoryId, imponibile_previdenziale: salary * workShare / 100 * months / 12, mesi_lavorati: months, percentuale_part_time: workShare, contributi: null, contributi_figurativi: 0, natura_dato: "stimato_periodi" });
      }
    });
    state.annualRows = output.sort(function (a, b) { return a.anno - b.anno; });
    renderAnnualTable();
  }
  function renderAnnualTable() {
    var tbody = byId("pcAnnualRows"); clear(tbody);
    state.annualRows.forEach(function (row, index) {
      var category = categoryFor(row.categoria) || categoryFor(inputText("pcCategory", "generica_fpld"));
      var tr = document.createElement("tr");
      tr.innerHTML = "<td>" + row.anno + "</td><td>" + category.categoria_nome + "</td>" +
        '<td><input data-row="' + index + '" data-field="imponibile_previdenziale" type="number" value="' + Math.round(row.imponibile_previdenziale) + '"></td>' +
        '<td><input data-row="' + index + '" data-field="mesi_lavorati" type="number" min="0" max="12" step="0.5" value="' + row.mesi_lavorati + '"></td>' +
        '<td><input data-row="' + index + '" data-field="percentuale_part_time" type="number" min="1" max="100" value="' + row.percentuale_part_time + '"></td>' +
        '<td><input data-row="' + index + '" data-field="contributi" type="number" placeholder="auto" value="' + (row.contributi || "") + '"></td>';
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll("input").forEach(function (input) { input.addEventListener("input", function () { var row = state.annualRows[toNumber(input.dataset.row, 0)]; row[input.dataset.field] = input.value === "" ? null : toNumber(input.value, 0); row.natura_dato = "inserito_utente"; }); });
  }
  function parseCsv(text) {
    var lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    var header = lines[0].split(/[;,]/).map(function (item) { return item.trim(); });
    return lines.slice(1).map(function (line) {
      var values = line.split(/[;,]/), object = {};
      header.forEach(function (key, index) { object[key] = values[index]; });
      var weeks = toNumber(object.settimane_contributive, null);
      var currency = String(object.valuta || object.currency || "euro").toLowerCase();
      return { anno: toNumber(object.anno), categoria: object.categoria_id || inputText("pcCategory", "generica_fpld"), imponibile_previdenziale: careerAmountToEuro(object.imponibile_previdenziale, currency), mesi_lavorati: weeks ? weeks / 52 * 12 : toNumber(object.mesi_lavorati, 12), percentuale_part_time: toNumber(object.percentuale_part_time, 100), contributi: object.contributi === undefined || object.contributi === "" ? null : careerAmountToEuro(object.contributi, currency), contributi_figurativi: careerAmountToEuro(object.contributi_figurativi, currency), natura_dato: "inserito_utente" };
    }).filter(function (row) { return row.anno; });
  }
  function setMode(mode) {
    state.mode = ["simple", "accurate"].indexOf(mode) >= 0 ? mode : "simple";
    byId("pcMode").value = state.mode;
    document.querySelectorAll(".pc-simple-only").forEach(function (node) { node.hidden = state.mode !== "simple"; });
    document.querySelectorAll(".pc-accurate-only").forEach(function (node) { node.hidden = state.mode !== "accurate"; });
    document.querySelectorAll(".pc-non-simple-only").forEach(function (node) { node.hidden = state.mode === "simple"; });
    var notes = { simple: "Stima rapida basata su categoria, anni contribuiti, importo finale e indice contrattuale quando disponibile.", accurate: "Diventa accurata quando sostituisci la precompilazione con gli imponibili INPS effettivi anno per anno." };
    byId("pcModeNote").textContent = notes[state.mode];
    if (state.mode === "accurate" && !state.annualRows.length) generateAnnualRows();
    calculate();
  }
  function download(filename, content, mime) {
    var blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" }), url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }
  function exportCsv() {
    var header = ["anno", "categoria", "retribuzione_stimata", "imponibile_previdenziale", "mesi_lavorati", "aliquota_finanziamento", "aliquota_computo", "quota_lavoratore", "quota_datore", "contributi_lavoratore", "contributi_datore", "contributi_finanziari", "accredito_montante", "tasso_rivalutazione", "montante_fine_anno"];
    var lines = [header.join(",")].concat(state.career.map(function (row) { return header.map(function (key) { return row[key] === null || row[key] === undefined ? "" : row[key]; }).join(","); }));
    download("calcolatore-pensione-carriera.csv", lines.join("\n"), "text/csv;charset=utf-8");
  }
  function exportJson() { download("calcolatore-pensione-risultato.json", JSON.stringify({ result: state.result, career: state.career }, null, 2), "application/json;charset=utf-8"); }
  function updatePensionValueLabel() {
    var net = inputText("pcPensionValueType", "lordo") === "netto";
    byId("pcPensionValueLabel").textContent = net ? "Pensione netta mensile attuale" : "Pensione lorda mensile attuale";
  }
  function bindEvents() {
    byId("pcMode").addEventListener("change", function () { setMode(byId("pcMode").value); });
    byId("pcCategory").addEventListener("change", function () { updateCategoryNote(); if (state.mode === "accurate") { state.annualRows.forEach(function (row) { row.categoria = byId("pcCategory").value; }); renderAnnualTable(); } calculate(); });
    byId("pcAxisMode").addEventListener("change", function () { state.axisMode = byId("pcAxisMode").value; if (state.result) renderCharts(state.career, state.result, state.scenario); });
    byId("pcCalculate").addEventListener("click", calculate);
    byId("pcPensionValueType").addEventListener("change", function () { updatePensionValueLabel(); calculate(); });
    if (byId("pcLireInput")) byId("pcLireInput").addEventListener("input", updateLireConverter);
    byId("pcSimpleStartYear").addEventListener("change", function () { updateSimpleContributionYearOptions(); calculate(); });
    byId("pcReset").addEventListener("click", function () { location.reload(); });
    byId("pcGenerateAnnualRows").addEventListener("click", function () { generateAnnualRows(); calculate(); });
    byId("pcExportCsv").addEventListener("click", exportCsv);
    byId("pcExportJson").addEventListener("click", exportJson);
    byId("pcShareLink").addEventListener("click", function () { var link = location.origin + location.pathname + "?mode=" + encodeURIComponent(state.mode); if (navigator.clipboard) navigator.clipboard.writeText(link); setStatus("Link copiato senza dati personali: contiene solo la modalita selezionata.", false); });
    byId("pcCsvInput").addEventListener("change", function (event) { var file = event.target.files && event.target.files[0]; if (!file) return; file.text().then(function (text) { state.annualRows = parseCsv(text); renderAnnualTable(); calculate(); }); event.target.value = ""; });
    document.querySelectorAll("#pcCalculatorForm input, #pcCalculatorForm select").forEach(function (node) { node.addEventListener("change", function () { if (!node.closest(".pc-period") && !node.closest(".pc-annual-table")) calculate(); }); });
    var dateTimer;
    ["pcBirthDate", "pcRetirementDate"].forEach(function (id) {
      byId(id).addEventListener("input", function () {
        clearTimeout(dateTimer);
        dateTimer = setTimeout(function () { updateSimpleContributionYearOptions(); calculate(); }, 180);
      });
    });
    updatePensionValueLabel();
  }

  document.addEventListener("DOMContentLoaded", function () {
    fetch(DATA_URL, { cache: "no-store" }).then(function (response) { if (!response.ok) throw new Error("Impossibile caricare i parametri del calcolatore."); return response.json(); }).then(function (payload) {
      state.payload = payload; populateCategories(); populateSimpleMenus(); initPeriods(); bindEvents();
      var example = exampleRows("results")[0];
      if (example) setStatus("Parametri caricati. Il calcolo avviene interamente nel browser.", false);
      updateLireConverter();
      var mode = new URLSearchParams(location.search).get("mode"); setMode(["simple", "accurate"].indexOf(mode) >= 0 ? mode : "simple");
    }).catch(function (error) { setStatus(error.message || "Errore nel caricamento dati.", true); });
  });
}());
