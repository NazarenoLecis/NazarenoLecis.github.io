(function () {
  "use strict";
  var dataset = null;
  var cards = [];
  var colors = ["#ff571c", "#5d8fd7", "#3aa6a1", "#65a96b", "#d9ad48", "#d96666"];
  var definitions = [
    { id: "expenditure", section: "costi", domain: "expenditure", metric: "public_gdp" },
    { id: "financing", section: "costi", domain: "composition", metric: "financing_composition" },
    { id: "workforce", section: "personale", domain: "workforce", metric: "workforce_PHYS_PRACT" },
    { id: "regional-workforce", section: "personale", domain: "regional_workforce", metric: "regional_workforce_OC221" },
    { id: "specialty", section: "personale", domain: "specialty", metric: "medical_category" },
    { id: "concentration", section: "volumi-pne", domain: "concentration", metric: "high_volume_728" },
    { id: "access", section: "liste-attesa", domain: "access", metric: "unmet_medical_needs" },
    { id: "avoidable", section: "mortalita", domain: "quality", metric: "avoidable_TRT" },
    { id: "screening", section: "prevenzione", domain: "screening", metric: "screening_breast_adherence" },
    { id: "lea", section: "prevenzione", domain: "lea", metric: "lea_prevention" },
    { id: "community", section: "assistenza-territoriale", domain: "community", metric: "community_full" },
    { id: "digital", section: "assistenza-territoriale", domain: "digital", metric: "fse_citizen_use" }
  ];

  function english() { return window.SiteLanguage ? window.SiteLanguage.get() === "en" : new URLSearchParams(location.search).get("lang") === "en"; }
  function t(it, en) { return english() ? en : it; }
  function element(tag, className, value) { var node = document.createElement(tag); if (className) node.className = className; if (value !== undefined) node.textContent = value; return node; }
  function unique(values) { return Array.from(new Set(values)).sort(); }
  function label(item) { return english() ? (item.label_en || item.label) : item.label; }
  function territory(row) { return english() ? (row.territory_en || row.territory) : row.territory; }
  function number(value) { return value === null || value === undefined ? t("ND", "NA") : Number(value).toLocaleString(english() ? "en-GB" : "it-IT", { maximumFractionDigits: 2 }); }
  function period(value) {
    if (!english()) return value;
    var months = {gennaio:"January",febbraio:"February",marzo:"March",aprile:"April",maggio:"May",giugno:"June",luglio:"July",agosto:"August",settembre:"September",ottobre:"October",novembre:"November",dicembre:"December"};
    return String(value).replace(/gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre/g,function (month) { return months[month]; });
  }
  function specialtyLabel(code, fallback) {
    var names = {GEN:"Medici generalisti",GEN_PRAC:"Medicina generale",GEN_OTH:"Altri medici generalisti",SPEC:"Medici specialisti",PAED:"Pediatria",GYN:"Ostetricia e ginecologia",PSY:"Psichiatria",MED:"Specialita mediche",MED_INT:"Medicina interna",MED_CAR:"Cardiologia",MED_END:"Endocrinologia",MED_GAS:"Gastroenterologia",MED_RES:"Malattie respiratorie",MED_ONC:"Oncologia",MED_IMM:"Immunologia",MED_NEU:"Neurologia",MED_ORL:"Otorinolaringoiatria",MED_RAD:"Radiologia",MED_MIC:"Microbiologia",MED_HAE:"Ematologia",MED_DER:"Dermatologia",MED_PAT:"Anatomia patologica",MED_OCC:"Medicina del lavoro",SURG:"Specialita chirurgiche",SURG_GEN:"Chirurgia generale",SURG_NEU:"Neurochirurgia",SURG_PLA:"Chirurgia plastica",SURG_OPH:"Oculistica",SURG_ORT:"Ortopedia",SURG_THO:"Chirurgia toracica",SURG_VAS:"Chirurgia vascolare",SURG_ANE:"Anestesia e terapia intensiva",SURG_URO:"Urologia",SURG_EME:"Medicina di emergenza",OTH:"Altre specialita",NSP:"Specializzazione non indicata"};
    return !english() && names[code] ? names[code] : fallback;
  }
  function functionLabel(code, fallback) {
    var names = {TOT_HC:"Spesa sanitaria corrente totale",HC1_2:"Cura e riabilitazione",HC11_21:"Cura e riabilitazione in ricovero",HC12_22:"Cura e riabilitazione in day hospital",HC13_23:"Cura e riabilitazione ambulatoriale",HC14_24:"Cura e riabilitazione domiciliare",HC3:"Assistenza sanitaria di lungo periodo",HC31:"Assistenza di lungo periodo in ricovero",HC32:"Assistenza di lungo periodo diurna",HC33:"Assistenza di lungo periodo ambulatoriale",HC34:"Assistenza di lungo periodo domiciliare",HC4:"Servizi ausiliari",HC5:"Beni sanitari",HC51:"Farmaci e altri beni sanitari non durevoli",HC52:"Dispositivi terapeutici e altri beni durevoli",HC6:"Prevenzione",HC7:"Governo e amministrazione sanitaria",HC_UNK:"Altri servizi non classificati",HCRI1:"Spesa farmaceutica complessiva",HCR1:"Assistenza sociale di lungo periodo",HCRI_PPR:"Prevenzione, preparazione e risposta",HCRI_EMS:"Assistenza di emergenza",HCRI_MHC:"Salute mentale",HCCOV1:"Trattamenti Covid-19",HCCOV2:"Test e tracciamento Covid-19",HCCOV3:"Vaccinazioni Covid-19",HCCOV4:"Beni sanitari Covid-19",HCCOV5:"Altra spesa sanitaria Covid-19",HCRCOV1:"Spesa collegata al Covid fuori dalla spesa corrente",HKCOV1:"Investimenti Covid-19"};
    return !english() && names[code] ? names[code] : fallback;
  }
  function sourceFlag(value) {
    if (!value) return t("nessuna segnalazione", "no source flag");
    var flags = {b:["rottura di serie","break in series"],p:["dato provvisorio","provisional value"],e:["stima della fonte","source estimate"],u:["attendibilita ridotta","low reliability"],d:["definizione diversa","different definition"],s:["stima Eurostat","Eurostat estimate"]};
    return String(value).split("").filter(function (flag) { return flags[flag]; }).map(function (flag) { return t(flags[flag][0],flags[flag][1]); }).join("; ") || t("consultare i metadati della fonte", "consult source metadata");
  }
  function unit(value) {
    var units = {
      "% GDP": ["% del PIL", "% of GDP"], "current international $ / 65+ resident": ["dollari internazionali PPP correnti per residente 65+", "current PPP international dollars per resident aged 65+"],
      "2015 EUR / resident": ["euro a prezzi 2015 per abitante", "2015-price euros per resident"], "million current EUR": ["milioni di euro correnti", "million current euros"],
      "per 1,000 residents": ["per 1.000 abitanti", "per 1,000 residents"], "% population aged 16+": ["% della popolazione 16+", "% of population aged 16+"],
      "age-standardised deaths / 100,000": ["decessi standardizzati per 100.000", "age-standardised deaths per 100,000"], "points / 100": ["punti su 100", "points out of 100"],
      "% document types": ["% delle tipologie documentali", "% of document types"], "number": ["strutture", "facilities"], "beds": ["posti letto", "beds"]
    };
    return units[value] ? t(units[value][0], units[value][1]) : value;
  }

  function note(indicator) {
    if (!english()) return indicator.note;
    var notes = {
      expenditure: "Public expenditure, total expenditure and government/compulsory financing schemes have different definitions. PPP international dollars are at current prices. Dividing overall public expenditure by the population aged 65+ is demographic normalisation, not actual expenditure on older people. The 2000=100 index is not real growth. Real euro expenditure uses 2015 prices. Numerator and denominator refer to the same year.",
      workforce: "Practising professionals provide direct patient care. Professionally active staff also include research and administrative roles. Licensed professionals may not be practising. Definitions are kept separate; source flags identify breaks and provisional observations. Rates are converted from per 100,000 to per 1,000 residents.",
      access: "EU-SILC survey, population aged 16+, reference period: the preceding 12 months. The combined cost/distance/waiting-list reason overlaps with individual reasons and must not be added to them. Income quintiles are country-specific. This is not a count of appointments or automatically the same measure as ISTAT foregone care.",
      quality: "Avoidable deaths before age 75, age-standardised to the 2013 European Standard Population. Treatable mortality concerns timely and effective treatment; preventable mortality concerns primary prevention. These are not postoperative mortality rates or direct hospital rankings.",
      screening: "Invitations in 2025; responses collected until 30 April 2026. Adjusted participation uses invited people after exclusions; examination coverage uses the eligible population before invitation exclusions. Low invitation coverage in Valle d'Aosta makes its breast-screening participation rate poorly comparable. Source-image transcriptions were checked; no estimates or interpolation.",
      lea: "LEA: essential care levels. NSG: the New Guarantee System. Each of the three areas must score at least 60/100. A total above 180 does not compensate for an insufficient area. The 2024 CORE indicators differ from 2023. Scores were checked against table 1 of the official report.",
      community: "Reported position at 31 December 2025, report updated 8 April 2026. Regional declarations were validated by the source. At least one active service does not imply full operation. Full operation includes all mandatory services and medical/nursing coverage under DM 77/2022. CIS and extra-CIS planning differs from PNRR targets and ReGiS records.",
      digital: "Indicators have different reference periods and denominators. Citizen use concerns people with at least one document available during the same 90 days. Consent uses all assisted residents. Specialist authorisation does not mean actual use. GP uploads include electronic prescriptions. Document availability measures available types, not the share of clinical records uploaded. March 2026 repeats December 2025 for Abruzzo, Liguria and Puglia. These indicators do not establish effective interoperability."
    };
    notes.regional_workforce = "The regional API does not separate practising, professionally active and licensed professionals. Physicians use the current hlth_rs_physreg collection. Nurses and midwives form a combined historical category ending in 2021, unlike the national nurses indicator. Definitions and coverage may differ; consult source flags.";
    notes.specialty = "General practitioners identify family doctors. The current collection distinguishes 11 broad categories; more detailed specialties remain available in the historical collection ending in 2021. Groups and their component specialties must not be added together. National definitions may include active or licensed doctors: this is distinct from the separate practising-doctors indicator.";
    notes.concentration = "Procedure-specific annual thresholds: pancreatic resections 50, isolated colon cancer surgery 50 (literature cited in PNE 2025), breast cancer surgery 150 (DM 70/2015). PNE 2025 pancreatic protocol 728 includes periampullary neoplasms and pancreatic tumours of uncertain behaviour; it differs from the old 103 cohort. Thresholds apply to the entire facility, then cases are aggregated by treatment region, not patient residence. Volume alone does not measure surgical success. Risk-adjusted outcomes remain in the PNE outcomes section.";
    if (indicator.id === "financing_composition") return "SHA 2011 financing schemes, not public/private ownership of the provider. HF1: government and compulsory schemes; HF2: voluntary financing; HF3: household out-of-pocket; HF4: rest of the world. Categories and their subcategories must not be added together. Missing components are not assumed to be zero.";
    return notes[indicator.domain] || indicator.note_en || indicator.note;
  }
  window.SanitaSystem = {label:label,unit:unit,note:note};

  function controls(card, key, caption, options) {
    var field = element("label", "", caption);
    var select = element("select");
    select.id = "hs_" + card.definition.id + "_" + key;
    options.forEach(function (option) { var item = element("option", "", option.label); item.value = option.value; select.appendChild(item); });
    if (!options.some(function (option) { return String(option.value) === String(card.state[key]); })) card.state[key] = options[0] ? options[0].value : "";
    select.value = card.state[key];
    select.disabled = options.length <= 1;
    field.appendChild(select);
    select.addEventListener("change", function () { card.state[key] = select.value; render(card); syncUrl(card); });
    card.filters.appendChild(field);
  }

  function syncUrl(card) {
    var url = new URL(location.href);
    Object.keys(card.state).forEach(function (key) { url.searchParams.set("hs_" + card.definition.id + "_" + key, card.state[key]); });
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  }

  function sourceCredit(card, indicator, text) {
    card.credit.replaceChildren();
    var sourceLine = element("span", "dashboard-credit-source");
    sourceLine.appendChild(element("strong", "", t("Fonte: ", "Source: ")));
    var anchor = element("a", "", indicator.source.indexOf("fse") === 0 ? "Ministero della Salute / DTD, FSE" : indicator.source === "ons_2025" ? "Osservatorio Nazionale Screening" : indicator.source === "dm77_2025" ? "AGENAS DM 77" : indicator.source === "pne_concentration" ? "AGENAS PNE 2025" : indicator.source === "nsg_core_2024" ? "Ministero della Salute, NSG" : indicator.source.indexOf("SH.") === 0 ? "WHO GHED / World Bank" : "Eurostat");
    anchor.href = indicator.source_url;
    anchor.target = "_blank";
    anchor.rel = "noopener";
    sourceLine.appendChild(anchor);
    sourceLine.appendChild(document.createTextNode(t(". Elaborazione di Nazareno Lecis.", ". Processing by Nazareno Lecis.")));
    card.credit.appendChild(sourceLine);
    card.credit.appendChild(element("br"));
    card.credit.appendChild(element("strong", "", t("Nota: ", "Note: ")));
    card.credit.appendChild(document.createTextNode(text));
  }

  function axisLayout(card, indicator) {
    var style = getComputedStyle(document.documentElement);
    var text = style.getPropertyValue("--text").trim() || "#eee";
    var line = style.getPropertyValue("--line").trim() || "#444";
    return { autosize: true, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { family: "system-ui, sans-serif", size: 12, color: text },
      margin: { t: 22, r: 28, b: 70, l: Math.min(220, Math.max(110, card.chart.clientWidth * 0.25)) },
      xaxis: { title: card.chart.clientWidth < 600 ? unit(indicator.unit).replace(/(.{20,35})\s/g,"$1<br>") : unit(indicator.unit), gridcolor: line, zerolinecolor: line, automargin: true },
      yaxis: { gridcolor: line, automargin: true }, hoverlabel: { bgcolor: style.getPropertyValue("--panel").trim(), font: { color: text } },
      legend: { orientation: "h", y: -0.15 }, height: 430 };
  }

  function render(card) {
    var metrics = dataset.indicators.filter(function (item) { return card.definition.domain === "composition" ? item.id === "financing_composition" : item.domain === card.definition.domain && item.id !== "financing_composition"; });
    card.filters.replaceChildren();
    controls(card, "metric", t("Indicatore", "Indicator"), metrics.map(function (item) { return { value: item.id, label: label(item) }; }));
    var indicator = metrics.find(function (item) { return item.id === card.state.metric; });
    if (!indicator) return;
    var rows = dataset.rows.filter(function (row) { return row.metric === indicator.id; });
    if (indicator.id === "medical_specialty" || indicator.id === "medical_category") {
      controls(card, "specialty", t("Specializzazione", "Specialty"), unique(rows.map(function (row) { return row.specialty; })).map(function (code) {
        return { value:code, label:specialtyLabel(code,rows.find(function (row) { return row.specialty === code; }).specialty_label) };
      }));
      rows = rows.filter(function (row) { return row.specialty === card.state.specialty; });
    }
    if (indicator.id === "unmet_medical_needs") {
      controls(card, "reason", t("Motivo", "Reason"), unique(rows.map(function (row) { return row.reason; })).map(function (reason) {
        var labels = { TXP: ["Costi eccessivi", "Too expensive"], WLIST: ["Liste d'attesa", "Waiting list"], TFAR: ["Distanza", "Too far"], TXP_TFAR_WLIST: ["Costi, distanza o liste d'attesa (combinato)", "Cost, distance or waiting list (combined)"], NTIME: ["Mancanza di tempo", "No time"], FEAR_DR_HSP: ["Timore di medico, ospedale o esame", "Fear of doctor, hospital or examination"], HOPE: ["Attesa di miglioramento spontaneo", "Hope to get better"], GDOC_UNK: ["Medico non conosciuto", "Good doctor not known"], OTH: ["Altri motivi", "Other reasons"] };
        return { value: reason, label: labels[reason] ? t(labels[reason][0], labels[reason][1]) : reason };
      }));
      controls(card, "income", t("Reddito", "Income"), [{ value: "TOTAL", label: t("Tutti i redditi", "All income levels") }].concat([1,2,3,4,5].map(function (value) { return { value: "QU" + value, label: t("Quintile ", "Quintile ") + value + (value === 1 ? t(" (piu basso)", " (lowest)") : value === 5 ? t(" (piu alto)", " (highest)") : "") }; })));
      rows = rows.filter(function (row) { return row.reason === card.state.reason && row.income === card.state.income; });
    }
    if (indicator.id === "financing_composition") {
      var functions = unique(rows.map(function (row) { return row.function; }));
      controls(card, "function", t("Tipo di assistenza", "Healthcare function"), functions.map(function (code) { var row = rows.find(function (item) { return item.function === code; }); return { value: code, label: functionLabel(code,row.function_label) }; }));
      rows = rows.filter(function (row) { return row.function === card.state.function; });
    }
    controls(card, "geo", t("Territorio", "Territory"), [{ value: "all", label: t("Tutti i territori", "All territories") }].concat(unique(rows.map(function (row) { return row.geo; })).map(function (geo) { return { value: geo, label: territory(rows.find(function (row) { return row.geo === geo; })) }; })));
    if (card.state.geo !== "all") rows = rows.filter(function (row) { return row.geo === card.state.geo; });
    var years = unique(rows.map(function (row) { return String(row.year); })).reverse();
    var countries = ["IT", "DE", "FR", "ES"];
    var international = card.state.geo === "all" && countries.every(function (geo) { return rows.some(function (row) { return row.geo === geo; }); });
    controls(card, "year", t("Anno", "Year"), [{ value: "latest", label: international ? t("Ultimo anno comune disponibile", "Latest available common year") : t("Ultimo anno disponibile", "Latest available year") }].concat(years.map(function (year) { return { value: year, label: year }; })));
    var views = [{ value:"comparison",label:t("Confronto territoriale", "Territorial comparison") }];
    if (unique(rows.map(function (row) { return String(row.period || row.year); })).length > 1) views.push({value:"series",label:t("Serie storica", "Time series")});
    controls(card, "view", t("Vista", "View"), views);
    var common = years.filter(function (year) { return countries.every(function (geo) { return rows.some(function (row) { return row.geo === geo && row.year === Number(year); }); }); });
    var selectedYear = card.state.year === "latest" ? Number(common[0] || years[0]) : Number(card.state.year);
    var displayedYears = unique(rows.filter(function (row) { return card.state.year === "latest" || row.year <= selectedYear; }).map(function (row) { return String(row.year); }));
    var selected = rows.filter(function (row) { return row.year === selectedYear; });
    // Quarterly document snapshots use the latest reported period in a year.
    if (indicator.id === "fse_document_availability" && selected.length) {
      var lastPeriod = unique(selected.map(function (row) { return row.period; })).pop();
      selected = selected.filter(function (row) { return row.period === lastPeriod; });
    }
    var selectionLabel = (indicator.id === "medical_specialty" || indicator.id === "medical_category") && rows.length ? specialtyLabel(card.state.specialty,rows[0].specialty_label) : indicator.id === "financing_composition" && rows.length ? functionLabel(card.state.function,rows[0].function_label) : "";
    card.title.textContent = label(indicator) + (selectionLabel ? " - " + selectionLabel : "") + " - " + (card.state.geo === "all" ? t("confronto territoriale", "territorial comparison") : rows.length ? territory(rows[0]) : card.state.geo);
    var periods = unique(selected.map(function (row) { return row.period || String(row.year); }));
    var suffix = indicator.id === "unmet_medical_needs" ? "; " + card.filters.querySelector("#hs_" + card.definition.id + "_reason").selectedOptions[0].textContent + ", " + card.filters.querySelector("#hs_" + card.definition.id + "_income").selectedOptions[0].textContent : "";
    card.subtitle.textContent = unit(indicator.unit) + "; " + (card.state.view === "series" ? (displayedYears[0] || "") + " - " + (displayedYears[displayedYears.length - 1] || "") : periods.map(period).join("; ")) + suffix;
    var traces = [], layout = axisLayout(card, indicator);
    if (indicator.id === "financing_composition" && card.state.view === "comparison") {
      var financing = ["HF1", "HF2", "HF3", "HF4", "HF_UNK"];
      var names = [t("Pubblico e obbligatorio", "Government and compulsory"), t("Finanziamento volontario", "Voluntary financing"), t("Pagamenti diretti famiglie", "Household out-of-pocket"), t("Resto del mondo", "Rest of the world"), t("Non classificato", "Unclassified")];
      var geos = unique(selected.map(function (row) { return row.geo; }));
      financing.forEach(function (scheme, index) {
        traces.push({ type: "bar", orientation: "h", name: names[index], y: geos.map(function (geo) { return territory(selected.find(function (row) { return row.geo === geo; })); }),
          x: geos.map(function (geo) { var row = selected.find(function (item) { return item.geo === geo && item.financing === scheme; }); return row ? row.value : null; }), marker: { color: colors[index] }, hovertemplate: "%{y}<br>%{x:,.1f} " + unit(indicator.unit) + "<extra>%{fullData.name}</extra>" });
      });
      layout.barmode = "stack";
    } else if (card.state.view === "series") {
      unique(rows.map(function (row) { return row.geo; })).forEach(function (geo, index) {
        var series = rows.filter(function (row) { return row.geo === geo && (indicator.id !== "financing_composition" || row.financing === "TOT_HF"); }).sort(function (a,b) { return String(a.period || a.year).localeCompare(String(b.period || b.year)); });
        if (card.state.year !== "latest") series = series.filter(function (row) { return row.year <= selectedYear; });
        traces.push({ type: "scatter", mode: "lines+markers", name: territory(series[0] || {territory:geo}), x: series.map(function (row) { return String(row.period || row.year); }), y: series.map(function (row) { return row.value; }), connectgaps: false, line: { color: colors[index % colors.length], width: 2 }, marker: { size: 6 } });
      });
      layout.xaxis.title = t("Periodo", "Period");
      layout.xaxis.type = "category";
      layout.xaxis.categoryorder = "category ascending";
      layout.yaxis.title = unit(indicator.unit);
      layout.margin.l = 85;
      layout.height = card.state.geo === "all" && unique(rows.map(function (row) { return row.geo; })).length > 8 ? 580 : 430;
    } else {
      selected.sort(function (a,b) { return b.value - a.value; });
      traces.push({ type: "bar", orientation: "h", x: selected.map(function (row) { return row.value; }), y: selected.map(territory), marker: { color: selected.map(function (row) { return row.geo === "IT" || row.geo === "Italia" ? colors[0] : indicator.domain === "lea" && row.value < 60 ? colors[5] : colors[2]; }) }, text: selected.map(function (row) { return number(row.value); }), textposition: "auto", customdata: selected.map(function (row) { return [period(row.period || row.year), sourceFlag(row.source_status), row.numerator, row.denominator]; }), hovertemplate: "%{y}<br>%{x:,.2f} " + unit(indicator.unit) + "<br>%{customdata[0]}<br>" + t("Qualita del dato", "Data quality") + ": %{customdata[1]}<extra></extra>" });
      layout.yaxis.autorange = "reversed";
      layout.height = Math.max(360, selected.length * 30 + 110);
      if (indicator.domain === "lea") layout.shapes = [{ type:"line", x0:60, x1:60, y0:0, y1:1, yref:"paper", line:{color:colors[5],dash:"dash"} }];
    }
    if (!selected.length && card.state.view === "comparison") {
      layout.annotations = [{ text:t("Nessuna osservazione disponibile per i filtri selezionati", "No observation available for the selected filters"), x:0.5,y:0.5,xref:"paper",yref:"paper",showarrow:false }];
      layout.xaxis.visible = false;
      layout.yaxis.visible = false;
    }
    var sourceNote = note(indicator) + " " + t("Periodo mostrato: ", "Displayed period: ") + card.subtitle.textContent + ".";
    sourceCredit(card, indicator, sourceNote);
    window.Plotly.react(card.chart, traces, layout, { responsive:true, displaylogo:false, displayModeBar:false });
  }

  function makeCard(definition) {
    var section = document.getElementById(definition.section);
    if (!section) return;
    var card = {definition:definition, state:{metric:definition.metric,year:"latest",geo:"all",view:"comparison",reason:"WLIST",income:"TOTAL",function:"TOT_HC",specialty:"GEN_PRAC"}};
    var params = new URLSearchParams(location.search);
    Object.keys(card.state).forEach(function (key) { var value = params.get("hs_" + definition.id + "_" + key); if (value) card.state[key] = value; });
    var frame = element("article", "hi-card hi-system-card");
    frame.setAttribute("data-local-i18n", "true");
    frame.id = "hs_" + definition.id;
    var titleRow = element("div", "hi-card-title");
    card.title = element("h3"); titleRow.appendChild(card.title); frame.appendChild(titleRow);
    card.subtitle = element("p", "hi-card-subtitle"); frame.appendChild(card.subtitle);
    card.filters = element("div", "filter-grid chart-filter-panel hs-filter-grid"); frame.appendChild(card.filters);
    card.chart = element("div", "hi-chart hi-chart-wide"); card.chart.id = "hs_" + definition.id + "_chart"; frame.appendChild(card.chart);
    card.credit = element("p", "hi-chart-credit"); frame.appendChild(card.credit);
    section.appendChild(frame);
    cards.push(card);
    render(card);
  }

  function load(urls, index) {
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); },30000);
    return fetch(urls[index], {cache:"no-cache",signal:controller.signal}).then(function (response) { if (!response.ok) throw new Error("HTTP " + response.status); return response.json(); }).finally(function () { clearTimeout(timeout); }).catch(function (error) { if (index + 1 < urls.length) return load(urls,index+1); throw error; });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderSectionNames();
    var urls = ["https://data.nazarenolecis.com/sanita-italia/health-system.json?v=20261010", "../../data/sanita-italia/health-system.json?v=20261010"];
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") urls.reverse();
    load(urls,0).then(function (payload) {
      dataset = payload;
      definitions.forEach(makeCard);
      window.dispatchEvent(new CustomEvent("sanita-extra-data-ready", {detail:payload}));
    }).catch(function (error) { var node = document.getElementById("hsLoadStatus"); if (node) node.textContent = t("Indicatori aggiuntivi non disponibili: ", "Additional indicators unavailable: ") + error.message; });
  });
  function renderSectionNames() {
    [["personale", "Personale sanitario", "Healthcare personnel", "Medici e infermieri", "Doctors and nurses", "Personale", "Workforce"],
     ["prevenzione", "Prevenzione e assistenza", "Prevention and care", "Screening oncologici e livelli essenziali di assistenza", "Cancer screening and essential care levels", "Screening e LEA", "Screening and care levels"],
     ["assistenza-territoriale", "Assistenza territoriale e digitale", "Community and digital care", "Case della Comunita e Fascicolo sanitario elettronico", "Community health centres and electronic health records", "Territorio e FSE", "Community care and EHR"]].forEach(function (item) {
      var heading = document.querySelector("#" + item[0] + " > .section-head");
      if (heading) { heading.setAttribute("data-local-i18n", "true"); heading.querySelector(".eyebrow").textContent = t(item[1],item[2]); heading.querySelector("h2").textContent = t(item[3],item[4]); }
      var anchor = document.querySelector('.dashboard-jump-nav a[href="#' + item[0] + '"]');
      if (anchor) { anchor.setAttribute("data-local-i18n", "true"); anchor.textContent = t(item[5],item[6]); }
    });
  }
  window.addEventListener("site-language-change", function () { renderSectionNames(); cards.forEach(render); });
  new MutationObserver(function (mutations) { if (mutations.some(function (mutation) { return mutation.attributeName === "data-theme" || mutation.attributeName === "class"; })) cards.forEach(render); }).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme","class"]});
})();
