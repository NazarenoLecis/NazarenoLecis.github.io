(function () {
  "use strict";

  var DATA_SOURCES = [
    "../../data/sanita-italia/dashboard.json?v=20260813-cancer-detail-1",
    "https://data.nazarenolecis.com/sanita-italia/dashboard.json?v=20260813-cancer-detail-1",
    "https://raw.githubusercontent.com/NazarenoLecis/nazarenolecis-data-pipeline/main/publish/sanita-italia/dashboard.json"
  ];

  var STATE = {
    payload: null,
    region: "Italia",
    discipline: "",
    metric: "discharges",
    ratioMode: "population_total",
    nationalActivityRegion: "Italia",
    nationalActivityProvince: "all",
    nationalActivityMetric: "discharges",
    nationalActivityRatio: "absolute",
    nationalActivityLimit: "25",
    nationalBedsRegion: "Italia",
    nationalBedsYear: "latest",
    nationalBedsMetric: "total_beds",
    nationalBedsRatio: "absolute",
    nationalBedsLimit: "25",
    dischargeRegion: "Italia",
    dischargeProvince: "all",
    dischargeStructure: "all",
    dischargeDiscipline: "all",
    dischargeDisciplineMetric: "discharges",
    dischargeHospitalRegion: "Italia",
    dischargeHospitalProvince: "all",
    dischargeHospitalCategory: "known_total",
    dischargeHospitalLimit: "20",
    psRegion: "Italia",
    psRegionTriage: "verde",
    psRegionMetric: "mean_wait_minutes",
    psStructureRegion: "Italia",
    psStructureProvince: "all",
    psStructure: "all",
    psStructureTriage: "verde",
    psStructureLimit: "20",
    waitingYear: "latest",
    waitingServiceType: "all",
    waitingService: "all",
    waitingPriority: "all",
    waitingRegime: "institutional",
    waitingAccess: "first",
    waitingMetric: "mean_first_available_days",
    waitingRegionFocus: "Italia",
    waitingServiceRegion: "Italia",
    waitingServiceYear: "latest",
    waitingServiceType2: "all",
    waitingServicePriority: "all",
    waitingServiceRegime: "institutional",
    waitingServiceAccess: "first",
    waitingServiceMetric: "mean_first_available_days",
    waitingServiceLimit: "20",
    waitingTrendRegion: "Italia",
    waitingTrendService: "33 - ESOFAGOGASTRODUODENOSCOPIA [EGDS]",
    waitingTrendPriority: "all",
    waitingTrendMetric: "mean_first_available_days",
    healthGroup: "risk_weight",
    healthIndicator: "obesity_18_plus",
    healthYear: "latest",
    healthTerritoryFocus: "Italia",
    healthProfileTerritory: "Italia",
    healthProfileGroup: "chronic_conditions",
    healthProfileYear: "latest",
    healthTrendTerritory: "Italia",
    healthTrendGroup: "risk_smoking",
    healthTrendIndicator: "smokers_15_plus",
    cancerRecentMetric: "new_cases",
    cancerRecentSite: "pancreas",
    mortalityGroup: "mortality_cancers",
    mortalityIndicator: "mortality_tumors",
    mortalityYear: "latest",
    mortalityTerritoryFocus: "Italia",
    mortalityProfileTerritory: "Italia",
    mortalityProfileGroup: "mortality_cancers",
    mortalityProfileYear: "latest",
    mortalityTrendTerritory: "Italia",
    mortalityTrendGroup: "mortality_cancers",
    mortalityTrendIndicator: "mortality_tumors",
    mortalityDetailGroup: "cancer_detail",
    mortalityDetailCause: "C25",
    mortalityDetailYear: "latest",
    mortalityDetailTerritoryFocus: "Italia",
    mortalityDetailTrendTerritory: "Italia",
    mortalityDetailTrendGroup: "cancer_detail",
    mortalityDetailTrendCause: "C25",
    disciplineRegion: "Italia",
    disciplineProvince: "all",
    disciplineMetric: "rate",
    denominator: "auto",
    costRegion: "Italia",
    costRatio: "population_total",
    costType: "totali",
    costCompositionRegion: "Italia",
    bedsSeriesRegion: "Italia",
    bedsSeriesMetric: "total_beds",
    bedsSeriesRatio: "absolute",
    pharmaRegion: "Italia",
    pharmaLabel: "all",
    hospitalRegion: "Italia",
    hospitalProvince: "all",
    hospitalDiscipline: "all",
    hospitalDepartmentRegion: "Italia",
    hospitalDepartmentProvince: "all",
    hospitalDepartmentStructure: "",
    hospitalDepartmentMetric: "discharges",
    hospitalDepartmentLimit: "20",
    mobilityRatio: "absolute",
    mobilitySeriesRegion: "Italia",
    mobilitySeriesRatio: "absolute",
    mobilityHospitalRegion: "Italia",
    mobilityHospitalLimit: "15",
    mobilitySankeyMin: "0",
    tableRegion: "Italia",
    tableProvince: "all",
    tableDiscipline: "all",
    table: "regional_summary",
    search: ""
  };

  var COLORS = ["#ff5a1f", "#5d8fd7", "#3aa6a1", "#65a96b", "#d9ad48", "#d96666", "#9c7ad9", "#8f8f8f"];
  var MISSING = "ND";

  var METRICS = {
    discharges: { label: "Dimissioni", family: "volume" },
    total_beds: { label: "Posti letto", family: "volume" },
    ssn_cost_eur: { label: "Costo SSN", family: "money" },
    mobility_balance_eur: { label: "Saldo mobilita", family: "money_signed" },
    bed_utilization_percent: { label: "Utilizzo posti letto", field: "bed_utilization_percent", format: formatPercent },
    avg_los_days: { label: "Degenza media", field: "avg_los_days", format: function (value) { return formatDecimal(value) + " giorni"; } }
  };

  var RATIO_MODES = {
    auto: "misura consigliata",
    absolute: "valore assoluto",
    population_total: "popolazione totale",
    population_65_plus: "popolazione 65+",
    population_75_plus: "popolazione 75+",
    clinical: "denominatore clinico",
    gdp: "PIL regionale"
  };

  var DENOMINATORS = {
    auto: "automatico",
    population_total: "popolazione totale",
    population_65_plus: "popolazione 65+",
    population_75_plus: "popolazione 75+",
    population_0: "eta 0 / neonati",
    population_0_14: "popolazione 0-14",
    women_15_49: "donne 15-49"
  };

  var TABLE_OPTIONS = [
    {
      id: "regional_summary",
      label: "Sintesi regionale",
      columns: [
        ["region", "Regione"],
        ["discharges", "Dimissioni"],
        ["discharges_per_1000", "Dim./1.000"],
        ["discharges_per_1000_over65", "Dim./1.000 65+"],
        ["discharges_per_1000_over75", "Dim./1.000 75+"],
        ["total_beds", "Posti letto"],
        ["beds_per_1000", "PL/1.000"],
        ["ssn_cost_eur", "Costo SSN"],
        ["ssn_cost_per_capita_eur", "Euro pro capite"],
        ["ssn_cost_per_discharge_eur", "Euro/dimissione"],
        ["ssn_cost_percent_gdp", "Costo/PIL"],
        ["mobility_balance_million_eur", "Saldo mobilita"],
        ["top_discipline", "Disciplina principale"]
      ]
    },
    {
      id: "activity_by_region_discipline",
      label: "Attivita per regione e disciplina",
      columns: [
        ["region", "Regione"],
        ["discipline", "Disciplina"],
        ["discharges", "Dimissioni"],
        ["discharges_per_1000_total", "Dim./1.000 totale"],
        ["discharges_per_1000_over65", "Dim./1.000 65+"],
        ["discharges_per_1000_over75", "Dim./1.000 75+"],
        ["discharges_per_1000_relevant", "Dim./1.000 denom."],
        ["relevant_denominator", "Denominatore"],
        ["avg_los_days", "Degenza media"],
        ["bed_utilization_percent", "Utilizzo PL"]
      ]
    },
    {
      id: "activity_by_province_discipline",
      label: "Attivita per provincia e disciplina",
      columns: [
        ["region", "Regione"],
        ["province", "Provincia"],
        ["province_name", "Nome provincia"],
        ["discipline", "Disciplina"],
        ["discharges", "Dimissioni"],
        ["discharges_per_1000_total", "Dim./1.000 totale"],
        ["discharges_per_1000_over65", "Dim./1.000 65+"],
        ["discharges_per_1000_over75", "Dim./1.000 75+"],
        ["discharges_per_1000_relevant", "Dim./1.000 denom."],
        ["relevant_denominator", "Denominatore"],
        ["avg_los_days", "Degenza media"],
        ["bed_utilization_percent", "Utilizzo PL"]
      ]
    },
    {
      id: "beds_by_region_discipline",
      label: "Posti letto per regione e disciplina",
      columns: [
        ["year", "Anno"],
        ["region", "Regione"],
        ["discipline", "Disciplina"],
        ["discipline_type", "Tipo"],
        ["total_beds", "Totale PL"],
        ["ordinary_beds", "PL ordinari"],
        ["day_hospital_beds", "PL DH"],
        ["day_surgery_beds", "PL DS"],
        ["beds_per_1000_total", "PL/1.000"],
        ["beds_per_1000_over65", "PL/1.000 65+"],
        ["beds_per_1000_over75", "PL/1.000 75+"]
      ]
    },
    {
      id: "cost_by_region_category",
      label: "Costi regionali",
      columns: [
        ["region", "Regione"],
        ["cost_label", "Voce"],
        ["amount_eur", "Importo"],
        ["amount_per_capita_eur", "Euro/ab."],
        ["amount_per_over65_eur", "Euro/65+"],
        ["amount_per_over75_eur", "Euro/75+"],
        ["amount_per_discharge_eur", "Euro/dimissione"],
        ["amount_percent_gdp", "% PIL"],
        ["share_percent", "Quota %"],
        ["change_percent", "Var. %"],
        ["year", "Anno"]
      ]
    },
    {
      id: "pharma_series",
      label: "Serie farmaceutica",
      columns: [
        ["region", "Territorio"],
        ["year", "Anno"],
        ["cost_label", "Voce"],
        ["amount_eur", "Importo"]
      ]
    },
    {
      id: "hospital_activity_top",
      label: "Top strutture",
      columns: [
        ["region", "Regione"],
        ["structure", "Struttura"],
        ["municipality", "Comune"],
        ["province", "Provincia"],
        ["discharges", "Dimissioni"],
        ["ordinary_beds", "PL ordinari"],
        ["main_discipline", "Disciplina principale"]
      ]
    },
    {
      id: "hospital_activity_by_discipline",
      label: "Strutture per disciplina",
      columns: [
        ["region", "Regione"],
        ["province", "Provincia"],
        ["structure", "Struttura"],
        ["municipality", "Comune"],
        ["discipline", "Disciplina"],
        ["discharges", "Dimissioni"],
        ["stay_days", "Giornate"],
        ["ordinary_beds", "PL ordinari"],
        ["used_beds", "PL usati"],
        ["avg_los_days", "Degenza media"],
        ["bed_utilization_percent", "Utilizzo PL"]
      ]
    },
    {
      id: "population_denominators",
      label: "Denominatori demografici",
      columns: [
        ["region", "Regione"],
        ["population_total", "Popolazione"],
        ["population_0", "Eta 0"],
        ["population_0_14", "0-14"],
        ["population_65_plus", "65+"],
        ["population_75_plus", "75+"],
        ["women_15_49", "Donne 15-49"]
      ]
    },
    {
      id: "population_denominators_province",
      label: "Denominatori provinciali",
      columns: [
        ["region", "Regione"],
        ["province", "Provincia"],
        ["province_name", "Nome provincia"],
        ["population_total", "Popolazione"],
        ["population_0", "Eta 0"],
        ["population_0_14", "0-14"],
        ["population_65_plus", "65+"],
        ["population_75_plus", "75+"],
        ["women_15_49", "Donne 15-49"]
      ]
    },
    {
      id: "gdp_regional",
      label: "PIL regionale",
      columns: [
        ["region", "Regione"],
        ["year", "Anno"],
        ["nuts2", "NUTS2"],
        ["gdp_million_eur", "PIL"],
        ["source", "Fonte"]
      ]
    },
    {
      id: "mobility_balance",
      label: "Mobilita sanitaria",
      columns: [
        ["region", "Regione"],
        ["year", "Anno"],
        ["balance_million_eur", "Saldo"],
        ["balance_per_capita_eur", "Euro/ab."],
        ["balance_per_over65_eur", "Euro/65+"],
        ["balance_per_over75_eur", "Euro/75+"],
        ["balance_percent_gdp", "% PIL"],
        ["direction", "Direzione"]
      ]
    },
    {
      id: "mobility_sankey",
      label: "Sankey mobilita 2024",
      columns: [
        ["source", "Origine"],
        ["target", "Destinazione"],
        ["value_million_eur", "Valore"],
        ["flow_type", "Tipo"],
        ["year", "Anno"]
      ]
    },
    {
      id: "discharge_type_by_region",
      label: "Tipologia dimissioni",
      columns: [
        ["year", "Anno"],
        ["region", "Regione"],
        ["deaths", "Decessi"],
        ["home_discharges", "Domicilio"],
        ["transfers", "Trasferimenti"],
        ["known_total", "Totale noto"],
        ["masked_cells", "Celle oscurate"]
      ]
    },
    {
      id: "discharge_type_by_province",
      label: "Tipologia dimissioni province",
      columns: [
        ["year", "Anno"],
        ["region", "Regione"],
        ["province", "Provincia"],
        ["deaths", "Decessi"],
        ["home_discharges", "Domicilio"],
        ["transfers", "Trasferimenti"],
        ["known_total", "Totale noto"],
        ["masked_cells", "Celle oscurate"]
      ]
    },
    {
      id: "discharge_type_by_structure",
      label: "Tipologia dimissioni strutture",
      columns: [
        ["year", "Anno"],
        ["region", "Regione"],
        ["province", "Provincia"],
        ["structure", "Struttura"],
        ["municipality", "Comune"],
        ["deaths", "Decessi"],
        ["home_discharges", "Domicilio"],
        ["transfers", "Trasferimenti"],
        ["known_total", "Totale noto"],
        ["masked_cells", "Celle oscurate"]
      ]
    },
    {
      id: "ps_wait_times_by_structure_triage",
      label: "Pronto soccorso per struttura e triage",
      columns: [
        ["year", "Anno"],
        ["region", "Regione"],
        ["province", "Provincia"],
        ["province_name", "Nome provincia"],
        ["municipality", "Comune"],
        ["structure", "Pronto soccorso"],
        ["emergency_level", "Livello PS/DEA"],
        ["triage_label", "Codice triage"],
        ["wait_minutes", "Permanenza media"]
      ]
    },
    {
      id: "ps_wait_times_by_region_triage",
      label: "Pronto soccorso per regione e triage",
      columns: [
        ["year", "Anno"],
        ["region", "Regione"],
        ["triage_label", "Codice triage"],
        ["structures", "Strutture"],
        ["mean_wait_minutes", "Media strutture"],
        ["median_wait_minutes", "Mediana strutture"]
      ]
    },
    {
      id: "ps_structures",
      label: "Pronto soccorso",
      columns: [
        ["year", "Anno"],
        ["region", "Regione"],
        ["province", "Provincia"],
        ["province_name", "Nome provincia"],
        ["municipality", "Comune"],
        ["structure", "Pronto soccorso"],
        ["emergency_level", "Livello PS/DEA"],
        ["accesses_total", "Accessi totali"],
        ["wait_rosso_minutes", "Rosso"],
        ["wait_arancione_minutes", "Arancione"],
        ["wait_blu_minutes", "Blu/azzurro"],
        ["wait_giallo_minutes", "Giallo"],
        ["wait_verde_minutes", "Verde"],
        ["wait_bianco_minutes", "Bianco"],
        ["mean_wait_minutes", "Media codici"]
      ]
    },
    {
      id: "ps_triage_codes",
      label: "Codici triage PS",
      columns: [
        ["label", "Codice triage"],
        ["priority", "Priorita"],
        ["expected_access_minutes", "Tempo massimo"],
        ["available_wait_times", "Tempi pubblicati"],
        ["model", "Modello"]
      ]
    },
    {
      id: "waiting_lists_pnla_summary",
      label: "Liste d'attesa PNLA",
      columns: [
        ["year", "Anno"],
        ["region", "Regione"],
        ["service_type", "Tipo prestazione"],
        ["service", "Prestazione"],
        ["priority_label", "Priorita"],
        ["regime_label", "Regime"],
        ["access_type_label", "Tipo accesso"],
        ["bookings", "Prenotazioni"],
        ["within_target_bookings", "Entro soglia"],
        ["within_target_percent", "% entro soglia"],
        ["accepted_within_target_percent", "% appuntamento"],
        ["mean_first_available_days", "Giorni prima disponibilita"],
        ["mean_accepted_wait_days", "Giorni appuntamento"]
      ]
    },
    {
      id: "waiting_lists_pnla_monthly",
      label: "Serie mensile PNLA",
      columns: [
        ["year", "Anno"],
        ["month", "Mese"],
        ["region", "Regione"],
        ["service_id", "Prestazione"],
        ["priority_label", "Priorita"],
        ["bookings", "Prenotazioni"],
        ["within_target_percent", "% entro soglia"],
        ["accepted_within_target_percent", "% appuntamento"],
        ["mean_first_available_days", "Giorni prima disponibilita"],
        ["mean_accepted_wait_days", "Giorni appuntamento"]
      ]
    },
    {
      id: "health_status_by_territory_year",
      label: "Salute per territorio",
      columns: [
        ["year", "Anno"],
        ["territory", "Territorio"],
        ["indicator", "Indicatore"],
        ["group_label", "Gruppo"],
        ["subgroup", "Area"],
        ["value", "Valore"],
        ["unit_label", "Unita"],
        ["definition", "Definizione"]
      ]
    },
    {
      id: "health_indicators",
      label: "Indicatori salute",
      columns: [
        ["id", "ID"],
        ["code", "Codice HFA"],
        ["label", "Indicatore"],
        ["group_label", "Gruppo"],
        ["subgroup", "Area"],
        ["unit_label", "Unita"],
        ["first_year", "Primo anno"],
        ["latest_year", "Ultimo anno"],
        ["definition", "Definizione"]
      ]
    },
    {
      id: "recent_cancer_estimates",
      label: "Stime oncologiche recenti",
      columns: [
        ["site", "Sede tumorale"],
        ["incidence_year", "Anno incidenza"],
        ["new_cases", "Nuove diagnosi"],
        ["new_cases_male", "Uomini"],
        ["new_cases_female", "Donne"],
        ["mortality_year", "Anno mortalita"],
        ["deaths", "Decessi"],
        ["prevalence_year", "Anno prevalenza"],
        ["prevalence", "Prevalenza"],
        ["survival_5y_label", "Sopravvivenza 5 anni"],
        ["source", "Fonte"]
      ]
    },
    {
      id: "mortality_detail_by_territory_year",
      label: "Mortalita dettagliata Eurostat",
      columns: [
        ["year", "Anno"],
        ["territory", "Territorio"],
        ["cause", "Causa"],
        ["group_label", "Gruppo"],
        ["cause_code", "Codice ICD-10"],
        ["value", "Tasso standardizzato"],
        ["unit_label", "Unita"],
        ["definition", "Definizione"]
      ]
    },
    {
      id: "mortality_detail_causes",
      label: "Cause mortalita Eurostat",
      columns: [
        ["cause_code", "Codice ICD-10"],
        ["label", "Causa"],
        ["group_label", "Gruppo"],
        ["first_year", "Primo anno"],
        ["latest_year", "Ultimo anno"],
        ["unit_label", "Unita"],
        ["definition", "Definizione"]
      ]
    },
    {
      id: "definitions",
      label: "Definizioni",
      columns: [
        ["indicator", "Indicatore"],
        ["definition", "Definizione"],
        ["numerator", "Numeratore"],
        ["denominator", "Denominatore"],
        ["unit", "Unita"],
        ["source", "Fonte"],
        ["warning", "Avvertenza"]
      ]
    },
    {
      id: "sources",
      label: "Fonti",
      columns: [
        ["provider", "Ente"],
        ["name", "Fonte"],
        ["used_for", "Uso"],
        ["coverage", "Copertura"],
        ["latest_year", "Anno"],
        ["license", "Licenza"],
        ["url", "Pagina"]
      ]
    }
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function asText(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback || MISSING;
    return String(value);
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function formatNumber(value) {
    var number = toNumber(value);
    if (number === null) return MISSING;
    return number.toLocaleString("it-IT", { maximumFractionDigits: 0 });
  }

  function formatDecimal(value) {
    var number = toNumber(value);
    if (number === null) return MISSING;
    return number.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function formatDurationMinutes(value) {
    var number = toNumber(value);
    if (number === null) return MISSING;
    var minutes = Math.round(number);
    var hours = Math.floor(minutes / 60);
    var remainder = minutes % 60;
    return String(hours).padStart(2, "0") + ":" + String(remainder).padStart(2, "0");
  }

  function formatPercent(value) {
    var number = toNumber(value);
    if (number === null) return MISSING;
    return number.toLocaleString("it-IT", { maximumFractionDigits: 1 }) + "%";
  }

  function formatEuro(value) {
    var number = toNumber(value);
    if (number === null) return MISSING;
    return number.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  }

  function formatEuroDecimal(value) {
    var number = toNumber(value);
    if (number === null) return MISSING;
    return number.toLocaleString("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatEuroCompact(value) {
    var number = toNumber(value);
    if (number === null) return MISSING;
    if (Math.abs(number) >= 1000000000) return (number / 1000000000).toLocaleString("it-IT", { maximumFractionDigits: 1 }) + " mld euro";
    if (Math.abs(number) >= 1000000) return (number / 1000000).toLocaleString("it-IT", { maximumFractionDigits: 1 }) + " mln euro";
    return formatEuro(number);
  }

  function formatMillionEuro(value) {
    var number = toNumber(value);
    if (number === null) return MISSING;
    return number.toLocaleString("it-IT", { maximumFractionDigits: 1 }) + " mln euro";
  }

  function denominatorLabel(value) {
    var labels = {
      auto: "Denominatore automatico",
      population_total: "Popolazione totale",
      population_65_plus: "Residenti 65+",
      population_75_plus: "Residenti 75+",
      population_0: "Neonati / residenti eta 0",
      population_0_14: "Residenti 0-14",
      women_15_49: "Donne 15-49 anni"
    };
    return labels[value] || DENOMINATORS[value] || asText(value);
  }

  function formatCell(column, value) {
    if (column === "available_wait_times") return value ? "Si" : "No";
    if (column === "expected_access_minutes") {
      var accessMinutes = toNumber(value);
      if (accessMinutes === null) return MISSING;
      return accessMinutes === 0 ? "immediato" : formatNumber(accessMinutes) + " minuti";
    }
    if (/wait_.*minutes|mean_wait_minutes|median_wait_minutes|max_wait_minutes/i.test(column)) return formatDurationMinutes(value);
    if (/million_eur$/i.test(column)) return formatMillionEuro(value);
    if (/per_capita_eur|per_over65_eur|per_over75_eur|per_discharge_eur/i.test(column)) return formatEuroDecimal(value);
    if (/eur$/i.test(column) || column === "amount_eur" || column === "ssn_cost_eur") return formatEuroCompact(value);
    if (/percent$/i.test(column)) return formatPercent(value);
    if (/denominator/i.test(column)) return denominatorLabel(value);
    if (/mean_.*days/i.test(column)) return formatDecimal(value);
    if (column === "selected_value" || column === "value") return formatDecimal(value);
    if (/per_1000|avg_los|share|change|utilization/i.test(column)) return formatDecimal(value);
    if (/population|beds|discharges|cases|prevalence|days|total|structures|deaths|transfers|masked|year/i.test(column)) return formatNumber(value);
    return asText(value);
  }

  function compact(value, maxLength) {
    var text = asText(value);
    maxLength = maxLength || 72;
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3).trim() + "...";
  }

  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function clear(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function create(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function tableRows(name) {
    var tables = STATE.payload && STATE.payload.tables ? STATE.payload.tables : {};
    return toArray(tables[name]);
  }

  function escapeHtml(value) {
    return asText(value, "").replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char];
    });
  }

  function sourceById(id) {
    return tableRows("sources").find(function (row) {
      return row.id === id;
    }) || null;
  }

  function sourceLink(id, label) {
    var row = sourceById(id);
    var text = label || (row && row.provider) || id;
    if (!row || !row.url) return escapeHtml(text);
    return '<a href="' + escapeHtml(row.url) + '" target="_blank" rel="noopener">' + escapeHtml(text) + "</a>";
  }

  function sourceBody(sources) {
    var links = toArray(sources).map(function (source) {
      return sourceLink(source.id, source.label);
    }).filter(Boolean);
    return links.join(", ") + ". Elaborazione di Nazareno Lecis.";
  }

  function sourceLine(sources) {
    return "Fonte: " + sourceBody(sources);
  }

  function setChartCredit(id, sources, note) {
    var node = byId(id);
    if (!node) return;
    node.innerHTML = '<span class="dashboard-credit-source"><strong>Fonte:</strong> ' + sourceBody(sources) + '</span>' +
      (note ? '<br><span class="dashboard-credit-note"><strong>Nota:</strong> ' + escapeHtml(note) + "</span>" : "");
  }

  function setTag(id, text) {
    var node = byId(id);
    if (node) node.textContent = text;
  }

  function bedsSourceId(year) {
    var selected = Number(year);
    if (selected >= 2020 && selected <= 2023) return "ministero_posti_letto_" + selected;
    return "ministero_posti_letto_2019";
  }

  function denominatorSources(mode) {
    if (mode === "population_total" || mode === "population_65_plus" || mode === "population_75_plus" || mode === "auto" || mode === "clinical") {
      return [{ id: "istat_posas_2026", label: "ISTAT denominatori demografici" }];
    }
    if (mode === "gdp") return [{ id: "eurostat_gdp_nuts2", label: "Eurostat PIL regionale" }];
    return [];
  }

  function populationMap() {
    var map = {};
    tableRows("population_denominators").forEach(function (row) {
      map[row.region] = row;
    });
    return map;
  }

  function nationalPopulation() {
    return (STATE.payload && STATE.payload.national && STATE.payload.national.population) || {};
  }

  function provinceMeta(region, province) {
    return toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.provinces).find(function (row) {
      return row.region === region && row.province === province;
    }) || null;
  }

  function provinceLabel(region, province) {
    var meta = provinceMeta(region, province);
    if (!province || province === "all") return "Tutte";
    return meta && meta.province_name ? meta.province_name + " (" + province + ")" : province;
  }

  function plainKey(value) {
    var text = asText(value, "").toLowerCase();
    if (text.normalize) text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return text.replace(/[^a-z0-9]+/g, " ").trim();
  }

  function isBambinoGesu(value) {
    var key = plainKey(value);
    return key.indexOf("bambino") !== -1 && key.indexOf("gesu") !== -1;
  }

  function mobilityTargetLabel(value) {
    if (isBambinoGesu(value)) return "Vaticano";
    return asText(value);
  }

  function mobilityTargetDetail(value) {
    if (isBambinoGesu(value)) return "Ospedale Pediatrico Bambino Gesu";
    return asText(value);
  }

  function territoryLabel(region, province) {
    if (province && province !== "all") return provinceLabel(region, province);
    return region || "Italia";
  }

  function provinceOptions(region) {
    var rows = toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.provinces).filter(function (row) {
      return region !== "Italia" && row.region === region;
    });
    return [{ value: "all", label: region === "Italia" ? "Seleziona una regione" : "Tutte" }].concat(rows.map(function (row) {
      return { value: row.province, label: provinceLabel(row.region, row.province) };
    }));
  }

  function refreshProvinceFilter(id, stateKey, region) {
    var options = provinceOptions(region);
    if (region === "Italia" || !options.some(function (option) { return option.value === STATE[stateKey]; })) {
      STATE[stateKey] = "all";
    }
    fillSelect(id, options, STATE[stateKey]);
    var node = byId(id);
    if (node) node.disabled = region === "Italia";
  }

  function refreshProvinceFilters() {
    refreshProvinceFilter("hiNationalActivityProvinceFilter", "nationalActivityProvince", STATE.nationalActivityRegion);
    refreshProvinceFilter("hiDischargeProvinceFilter", "dischargeProvince", STATE.dischargeRegion);
    refreshProvinceFilter("hiDischargeHospitalProvinceFilter", "dischargeHospitalProvince", STATE.dischargeHospitalRegion);
    refreshProvinceFilter("hiPsStructureProvinceFilter", "psStructureProvince", STATE.psStructureRegion);
    refreshProvinceFilter("hiDisciplineProvinceFilter", "disciplineProvince", STATE.disciplineRegion);
    refreshProvinceFilter("hiHospitalProvinceFilter", "hospitalProvince", STATE.hospitalRegion);
    refreshProvinceFilter("hiHospitalDepartmentProvinceFilter", "hospitalDepartmentProvince", STATE.hospitalDepartmentRegion);
    refreshProvinceFilter("hiTableProvinceFilter", "tableProvince", STATE.tableRegion);
  }

  function triageOrder(value) {
    var order = { rosso: 1, arancione: 2, giallo: 3, blu: 4, verde: 5, bianco: 6 };
    return order[value] || 99;
  }

  function triageLabel(value) {
    var labels = {
      all: "Tutti",
      bianco: "Codice bianco",
      verde: "Codice verde",
      giallo: "Codice giallo",
      rosso: "Codice rosso",
      blu: "Codice blu/azzurro",
      arancione: "Codice arancione"
    };
    return labels[value] || asText(value);
  }

  function triageColor(value) {
    if (value === "bianco") return "#cfd6df";
    if (value === "verde") return COLORS[3];
    if (value === "giallo") return COLORS[4];
    if (value === "rosso") return COLORS[5];
    if (value === "blu") return COLORS[1];
    if (value === "arancione") return COLORS[0];
    return COLORS[2];
  }

  function psTriageOptions(includeAll) {
    var rows = toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.ps_triage_codes);
    if (!rows.length) {
      rows = unique(tableRows("ps_wait_times_by_structure_triage").map(function (row) {
        return row.triage_code;
      })).map(function (code) {
        return { id: code, label: triageLabel(code), sort_order: triageOrder(code), available_wait_times: true };
      });
    }
    rows = rows.filter(function (row) {
      return row.available_wait_times !== false;
    });
    rows = rows.slice().sort(function (a, b) {
      return (toNumber(a.sort_order) || triageOrder(a.id)) - (toNumber(b.sort_order) || triageOrder(b.id));
    });
    var options = rows.map(function (row) {
      return { value: row.id, label: row.label || triageLabel(row.id) };
    });
    return includeAll ? [{ value: "all", label: "Tutti i codici disponibili" }].concat(options) : options;
  }

  function refreshPsTriageFilter(id, stateKey, includeAll) {
    var options = psTriageOptions(includeAll);
    if (!options.some(function (option) { return option.value === STATE[stateKey]; })) {
      STATE[stateKey] = includeAll ? "all" : (options[0] ? options[0].value : "all");
    }
    fillSelect(id, options, STATE[stateKey]);
  }

  function psTriageAvailableCodes() {
    return unique(tableRows("ps_wait_times_by_structure_triage").map(function (row) {
      return row.triage_code;
    })).sort(function (a, b) {
      return triageOrder(a) - triageOrder(b);
    });
  }

  function psTriageHasData(code) {
    if (!code || code === "all") return true;
    return psTriageAvailableCodes().indexOf(code) !== -1;
  }

  function psTriageUnavailableText(code) {
    if (psTriageHasData(code)) return "";
    return triageLabel(code) + " fa parte del modello triage AGENAS a 5 codici, ma l'endpoint pubblico dei tempi PS non pubblica valori per questo colore nel payload corrente.";
  }

  function psUnavailableCodesText() {
    var rows = toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.ps_triage_codes).filter(function (row) {
      return row.available_wait_times === false;
    });
    if (!rows.length) return "";
    rows.sort(function (a, b) {
      return (toNumber(a.sort_order) || triageOrder(a.id)) - (toNumber(b.sort_order) || triageOrder(b.id));
    });
    return rows.map(function (row) {
      return (row.label || triageLabel(row.id)).replace("Codice ", "").toLowerCase();
    }).join(", ");
  }

  function psStructureKey(row) {
    return asText(row.structure_code || row.institute_code || (asText(row.region) + "|" + asText(row.structure)), "");
  }

  function psStructureRows() {
    return tableRows("ps_structures").filter(function (row) {
      if (STATE.psStructureRegion !== "Italia" && row.region !== STATE.psStructureRegion) return false;
      return STATE.psStructureProvince === "all" || row.province === STATE.psStructureProvince;
    });
  }

  function psStructureOptions() {
    var rows = psStructureRows().sort(function (a, b) {
      return asText(a.structure).localeCompare(asText(b.structure));
    });
    return [{ value: "all", label: "Tutti" }].concat(rows.map(function (row) {
      var place = STATE.psStructureRegion === "Italia" ? " (" + row.region + ", " + row.province + ")" : " (" + row.province + ")";
      return { value: psStructureKey(row), label: compact(row.structure, 52) + place };
    }));
  }

  function refreshPsStructureFilter() {
    var options = psStructureOptions();
    if (!options.some(function (option) { return option.value === STATE.psStructure; })) {
      STATE.psStructure = "all";
    }
    fillSelect("hiPsStructureFilter", options, STATE.psStructure);
  }

  function waitingRows() {
    return tableRows("waiting_lists_pnla_summary");
  }

  function waitingMonthlyRows() {
    return tableRows("waiting_lists_pnla_monthly");
  }

  function waitingLatestYear() {
    var years = toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.waiting_years).map(toNumber).filter(function (value) {
      return value !== null;
    });
    if (!years.length) years = unique(waitingRows().map(function (row) { return row.year; })).map(toNumber).filter(function (value) { return value !== null; });
    return years.length ? Math.max.apply(null, years) : null;
  }

  function waitingYearValue(value) {
    if (value === "latest") return waitingLatestYear();
    return toNumber(value);
  }

  function waitingServiceMap() {
    var result = {};
    toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.waiting_services).forEach(function (row) {
      result[row.id] = row;
    });
    return result;
  }

  function waitingServiceLabel(serviceId) {
    var service = waitingServiceMap()[serviceId];
    return service ? service.label : asText(serviceId);
  }

  function waitingServiceType(serviceId) {
    var service = waitingServiceMap()[serviceId];
    return service ? service.service_type : "";
  }

  function waitingYearOptions() {
    var years = toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.waiting_years).slice().sort();
    return [{ value: "latest", label: "Ultimo anno" }].concat(years.map(function (year) {
      return { value: String(year), label: String(year) };
    }));
  }

  function waitingServiceTypeOptions() {
    var rows = toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.waiting_service_types);
    return [{ value: "all", label: "Tutte" }].concat(rows.map(function (row) {
      return { value: row.id, label: row.label };
    }));
  }

  function waitingServiceOptions(serviceType, includeAll) {
    var rows = toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.waiting_services).filter(function (row) {
      return serviceType === "all" || row.service_type === serviceType;
    });
    var options = rows.map(function (row) {
      return { value: row.id, label: compact(row.label, 70) };
    });
    return includeAll ? [{ value: "all", label: "Tutte" }].concat(options) : options;
  }

  function waitingPriorityOptions(includeAll) {
    var rows = toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.waiting_priorities);
    var options = rows.map(function (row) {
      return { value: row.id, label: row.label };
    });
    return includeAll ? [{ value: "all", label: "Tutte" }].concat(options) : options;
  }

  function waitingRegimeOptions() {
    var rows = toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.waiting_regimes);
    return [{ value: "all", label: "Tutti" }].concat(rows.map(function (row) {
      return { value: row.id, label: row.label };
    }));
  }

  function waitingAccessOptions() {
    var rows = toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.waiting_access_types);
    return [{ value: "all", label: "Tutti" }].concat(rows.map(function (row) {
      return { value: row.id, label: row.label };
    }));
  }

  function refreshWaitingServiceFilter(id, stateKey, serviceType, includeAll) {
    var options = waitingServiceOptions(serviceType, includeAll);
    if (!options.some(function (option) { return option.value === STATE[stateKey]; })) {
      STATE[stateKey] = includeAll ? "all" : (options[0] ? options[0].value : "all");
    }
    fillSelect(id, options, STATE[stateKey]);
  }

  function refreshWaitingFilters(regionOptions) {
    fillSelect("hiWaitingYearFilter", waitingYearOptions(), STATE.waitingYear);
    fillSelect("hiWaitingServiceYearFilter", waitingYearOptions(), STATE.waitingServiceYear);
    fillSelect("hiWaitingServiceTypeFilter", waitingServiceTypeOptions(), STATE.waitingServiceType);
    fillSelect("hiWaitingServiceType2Filter", waitingServiceTypeOptions(), STATE.waitingServiceType2);
    fillSelect("hiWaitingPriorityFilter", waitingPriorityOptions(true), STATE.waitingPriority);
    fillSelect("hiWaitingServicePriorityFilter", waitingPriorityOptions(true), STATE.waitingServicePriority);
    fillSelect("hiWaitingTrendPriorityFilter", waitingPriorityOptions(true), STATE.waitingTrendPriority);
    fillSelect("hiWaitingRegimeFilter", waitingRegimeOptions(), STATE.waitingRegime);
    fillSelect("hiWaitingServiceRegimeFilter", waitingRegimeOptions(), STATE.waitingServiceRegime);
    fillSelect("hiWaitingAccessFilter", waitingAccessOptions(), STATE.waitingAccess);
    fillSelect("hiWaitingServiceAccessFilter", waitingAccessOptions(), STATE.waitingServiceAccess);
    fillSelect("hiWaitingRegionFocusFilter", regionOptions, STATE.waitingRegionFocus);
    fillSelect("hiWaitingServiceRegionFilter", regionOptions, STATE.waitingServiceRegion);
    fillSelect("hiWaitingTrendRegionFilter", regionOptions, STATE.waitingTrendRegion);
    refreshWaitingServiceFilter("hiWaitingServiceFilter", "waitingService", STATE.waitingServiceType, true);
    refreshWaitingServiceFilter("hiWaitingTrendServiceFilter", "waitingTrendService", "all", true);
    var simpleSelects = [
      ["hiWaitingMetricFilter", "waitingMetric"],
      ["hiWaitingServiceMetricFilter", "waitingServiceMetric"],
      ["hiWaitingServiceLimitFilter", "waitingServiceLimit"],
      ["hiWaitingTrendMetricFilter", "waitingTrendMetric"]
    ];
    simpleSelects.forEach(function (item) {
      var node = byId(item[0]);
      if (node) node.value = STATE[item[1]];
    });
  }

  function setSubtitle(id, text) {
    var node = byId(id);
    if (node) node.textContent = text;
  }

  function waitingServiceText(serviceId, serviceType) {
    if (serviceId && serviceId !== "all") return waitingServiceLabel(serviceId);
    if (serviceType && serviceType !== "all") return serviceType.toLowerCase();
    return "tutte le prestazioni PNLA";
  }

  function waitingPriorityText(priority) {
    return priority && priority !== "all" ? priority : "tutte le priorita";
  }

  function waitingRegimeText(regime) {
    if (regime === "institutional") return "Istituzionale";
    if (regime === "private") return "ALPI";
    return "tutti i regimi";
  }

  function waitingAccessText(access) {
    if (access === "first") return "Primo accesso";
    if (access === "subsequent") return "Accesso successivo";
    return "tutti gli accessi";
  }

  function waitingScopeText(settings) {
    return [
      waitingServiceText(settings.service, settings.serviceType),
      waitingPriorityText(settings.priority),
      waitingRegimeText(settings.regime),
      waitingAccessText(settings.access)
    ].join(", ");
  }

  function waitingMetricConfig(metric) {
    if (metric === "mean_accepted_wait_days") {
      return { label: "giorni medi all'appuntamento accettato", field: "mean_accepted_wait_days", xTitle: "giorni", format: function (value) { return formatDecimal(value) + " giorni"; }, lowerBetter: false };
    }
    if (metric === "within_target_percent") {
      return { label: "% entro soglia - prima disponibilita", field: "within_target_percent", xTitle: "% entro soglia", format: formatPercent, lowerBetter: true };
    }
    if (metric === "accepted_within_target_percent") {
      return { label: "% entro soglia - appuntamento accettato", field: "accepted_within_target_percent", xTitle: "% entro soglia", format: formatPercent, lowerBetter: true };
    }
    if (metric === "bookings") {
      return { label: "prenotazioni", field: "bookings", xTitle: "prenotazioni", format: formatNumber, lowerBetter: false };
    }
    return { label: "giorni medi alla prima disponibilita", field: "mean_first_available_days", xTitle: "giorni", format: function (value) { return formatDecimal(value) + " giorni"; }, lowerBetter: false };
  }

  function filterWaitingRows(settings) {
    var year = waitingYearValue(settings.year);
    return waitingRows().filter(function (row) {
      if (year && row.year !== year) return false;
      if (settings.region && settings.region !== "Italia" && row.region !== settings.region) return false;
      if (settings.serviceType && settings.serviceType !== "all" && row.service_type !== settings.serviceType) return false;
      if (settings.service && settings.service !== "all" && row.service_id !== settings.service) return false;
      if (settings.priority && settings.priority !== "all" && row.priority_label !== settings.priority) return false;
      if (settings.regime && settings.regime !== "all" && row.regime !== settings.regime) return false;
      if (settings.access && settings.access !== "all" && row.access_type !== settings.access) return false;
      return true;
    });
  }

  function weightedValue(rows, field) {
    var totalWeight = 0;
    var totalValue = 0;
    rows.forEach(function (row) {
      var value = toNumber(row[field]);
      var weight = toNumber(row.bookings) || 0;
      if (value === null || !weight) return;
      totalWeight += weight;
      totalValue += value * weight;
    });
    return totalWeight ? totalValue / totalWeight : null;
  }

  function aggregateWaitingRows(rows, groupField, labelField) {
    var grouped = {};
    rows.forEach(function (row) {
      var key = groupField(row);
      if (!key) return;
      var item = grouped[key] || { key: key, label: labelField(row), bookings: 0, within_target_bookings: 0, rows: [] };
      item.bookings += toNumber(row.bookings) || 0;
      item.within_target_bookings += toNumber(row.within_target_bookings) || 0;
      item.rows.push(row);
      grouped[key] = item;
    });
    return Object.keys(grouped).map(function (key) {
      var item = grouped[key];
      item.bookings = Math.round(item.bookings);
      item.within_target_bookings = Math.round(item.within_target_bookings);
      item.within_target_percent = item.bookings ? (item.within_target_bookings / item.bookings) * 100 : weightedValue(item.rows, "within_target_percent");
      item.accepted_within_target_percent = weightedValue(item.rows, "accepted_within_target_percent");
      item.mean_first_available_days = weightedValue(item.rows, "mean_first_available_days");
      item.mean_accepted_wait_days = weightedValue(item.rows, "mean_accepted_wait_days");
      delete item.rows;
      return item;
    });
  }

  function sortWaitingMetric(rows, field, lowerBetter) {
    return rows.slice().sort(function (a, b) {
      var av = toNumber(a[field]);
      var bv = toNumber(b[field]);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return lowerBetter ? av - bv : bv - av;
    });
  }

  function dischargeStructureOptions() {
    var rows = tableRows("discharge_type_by_structure").filter(function (row) {
      if (STATE.dischargeRegion === "Italia") return false;
      if (row.region !== STATE.dischargeRegion) return false;
      return STATE.dischargeProvince === "all" || row.province === STATE.dischargeProvince;
    });
    rows = rows.sort(function (a, b) {
      return asText(a.structure).localeCompare(asText(b.structure));
    });
    return [{ value: "all", label: STATE.dischargeRegion === "Italia" ? "Seleziona una regione" : "Tutte" }].concat(rows.map(function (row) {
      var place = STATE.dischargeProvince === "all" ? " (" + row.province + ")" : "";
      return { value: row.structure_code, label: compact(row.structure, 52) + place };
    }));
  }

  function refreshDischargeStructureFilter() {
    var options = dischargeStructureOptions();
    if (STATE.dischargeRegion === "Italia" || !options.some(function (option) { return option.value === STATE.dischargeStructure; })) {
      STATE.dischargeStructure = "all";
    }
    fillSelect("hiDischargeStructureFilter", options, STATE.dischargeStructure);
    var node = byId("hiDischargeStructureFilter");
    if (node) node.disabled = STATE.dischargeRegion === "Italia";
  }

  function dischargeActivityRows() {
    return tableRows("hospital_activity_by_discipline").filter(function (row) {
      if (STATE.dischargeRegion !== "Italia" && row.region !== STATE.dischargeRegion) return false;
      if (STATE.dischargeProvince !== "all" && row.province !== STATE.dischargeProvince) return false;
      if (STATE.dischargeStructure !== "all" && structureKey(row) !== STATE.dischargeStructure) return false;
      return true;
    });
  }

  function structureKey(row) {
    return asText(row.structure_code || (asText(row.region) + "|" + asText(row.structure)));
  }

  function hospitalDepartmentStructureRows() {
    var grouped = {};
    tableRows("hospital_activity_by_discipline").forEach(function (row) {
      if (STATE.hospitalDepartmentRegion !== "Italia" && row.region !== STATE.hospitalDepartmentRegion) return;
      if (STATE.hospitalDepartmentProvince !== "all" && row.province !== STATE.hospitalDepartmentProvince) return;
      var key = structureKey(row);
      if (!key) return;
      if (!grouped[key]) {
        grouped[key] = {
          key: key,
          region: row.region,
          province: row.province,
          structure: row.structure,
          municipality: row.municipality,
          discharges: 0
        };
      }
      grouped[key].discharges += toNumber(row.discharges) || 0;
    });
    return Object.keys(grouped).map(function (key) {
      return grouped[key];
    }).sort(function (a, b) {
      return (toNumber(b.discharges) || 0) - (toNumber(a.discharges) || 0);
    });
  }

  function hospitalDepartmentStructureOptions() {
    return hospitalDepartmentStructureRows().map(function (row) {
      var place = STATE.hospitalDepartmentRegion === "Italia" ? " - " + row.region + " (" + row.province + ")" : (STATE.hospitalDepartmentProvince === "all" ? " (" + row.province + ")" : "");
      return { value: row.key, label: compact(row.structure, 54) + place };
    });
  }

  function refreshHospitalDepartmentStructureFilter() {
    var options = hospitalDepartmentStructureOptions();
    var node = byId("hiHospitalDepartmentStructureFilter");
    if (!options.length) {
      STATE.hospitalDepartmentStructure = "";
      fillSelect("hiHospitalDepartmentStructureFilter", [{ value: "", label: "Nessun ospedale disponibile" }], "");
      if (node) node.disabled = true;
      return;
    }
    if (!STATE.hospitalDepartmentStructure || !options.some(function (option) { return option.value === STATE.hospitalDepartmentStructure; })) {
      STATE.hospitalDepartmentStructure = options[0].value;
    }
    fillSelect("hiHospitalDepartmentStructureFilter", options, STATE.hospitalDepartmentStructure);
    if (node) node.disabled = false;
  }

  function denominatorValueForRow(row, denominator) {
    if (!row) return null;
    if (row[denominator] !== undefined && row[denominator] !== null) return toNumber(row[denominator]);
    if (row.region) return toNumber((populationMap()[row.region] || {})[denominator]);
    return toNumber(nationalPopulation()[denominator]);
  }

  function ratioLabel(mode) {
    if (mode === "auto") return "per 1.000, denominatore clinico";
    if (mode === "population_65_plus") return "per 1.000 residenti 65+";
    if (mode === "population_75_plus") return "per 1.000 residenti 75+";
    if (mode === "population_total") return "per 1.000 residenti";
    return "valore assoluto";
  }

  function normalizedValue(row, field, mode) {
    if (!mode || mode === "absolute") return toNumber(row[field]);
    var denominator = mode === "auto" ? toNumber(row.relevant_population) : denominatorValueForRow(row, mode);
    if (!denominator) return null;
    return ((toNumber(row[field]) || 0) / denominator) * 1000;
  }

  function withNormalizedMetric(rows, field, mode) {
    return toArray(rows).map(function (row) {
      var copy = Object.assign({}, row);
      copy.selected_value = normalizedValue(row, field, mode);
      return copy;
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
  }

  function setStatus(text, state) {
    var node = byId("hiStatus");
    if (!node) return;
    node.textContent = text;
    if (state) node.dataset.state = state;
  }

  function plotConfig() {
    return {
      responsive: true,
      displayModeBar: false,
      scrollZoom: false,
      doubleClick: false,
      showTips: false
    };
  }

  function defaultAxis() {
    var muted = cssVar("--muted", "#b9b2aa");
    var line = cssVar("--line", "#303030");
    return {
      fixedrange: true,
      gridcolor: line,
      zerolinecolor: line,
      tickfont: { color: muted },
      automargin: true
    };
  }

  function baseLayout(extra) {
    var text = cssVar("--text", "#f5f2ed");
    var line = cssVar("--line", "#303030");
    var panel = cssVar("--panel", "#090909");
    var layout = Object.assign({
      autosize: true,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: {
        color: text,
        family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        size: 12
      },
      margin: { t: 18, r: 18, b: 52, l: 72 },
      hoverlabel: {
        bgcolor: panel,
        bordercolor: line,
        font: { color: text }
      },
      dragmode: false,
      xaxis: defaultAxis(),
      yaxis: defaultAxis()
    }, extra || {});
    if (extra && extra.xaxis) layout.xaxis = Object.assign(defaultAxis(), extra.xaxis);
    if (extra && extra.yaxis) layout.yaxis = Object.assign(defaultAxis(), extra.yaxis);
    return layout;
  }

  function showEmptyChart(id, message) {
    var node = byId(id);
    if (!node) return;
    if (window.Plotly) {
      try {
        window.Plotly.react(node, [], baseLayout({
          margin: { t: 16, r: 18, b: 28, l: 18 },
          xaxis: { visible: false },
          yaxis: { visible: false },
          annotations: [{
            text: message || "Nessun dato disponibile",
            x: 0.5,
            y: 0.5,
            xref: "paper",
            yref: "paper",
            showarrow: false,
            font: { size: 14, color: cssVar("--muted", "#b9b2aa") }
          }]
        }), plotConfig()).catch(function () {
          clear(node);
          node.appendChild(create("div", "hi-empty", message || "Nessun dato disponibile"));
        });
        return;
      } catch (error) {}
    }
    clear(node);
    node.appendChild(create("div", "hi-empty", message || "Nessun dato disponibile"));
  }

  function plot(id, traces, layout) {
    var node = byId(id);
    if (!node) return;
    if (!window.Plotly) {
      showEmptyChart(id, "Plotly non caricato");
      return;
    }
    if (!traces || !traces.length) {
      showEmptyChart(id, "Nessun dato disponibile");
      return;
    }
    window.Plotly.react(node, traces, baseLayout(layout), plotConfig()).catch(function () {
      showEmptyChart(id, "Errore nella costruzione del grafico");
    });
  }

  function sortDescending(rows, field) {
    return toArray(rows).slice().sort(function (a, b) {
      return (toNumber(b[field]) || 0) - (toNumber(a[field]) || 0);
    });
  }

  function horizontalBar(id, rows, labelField, valueField, options) {
    options = options || {};
    rows = toArray(rows).filter(function (row) { return toNumber(row[valueField]) !== null; });
    if (!rows.length) {
      showEmptyChart(id);
      return;
    }
    rows = rows.slice(0, options.limit || 20).reverse();
    var labels = rows.map(function (row) { return compact(row[labelField], options.labelLength || 34); });
    var values = rows.map(function (row) { return toNumber(row[valueField]) || 0; });
    var displayValues = rows.map(function (row) {
      return options.format ? options.format(row[valueField]) : formatDecimal(row[valueField]);
    });
    var colors = rows.map(function (row) {
      if (options.colorFor) return options.colorFor(row);
      var highlightField = options.highlightField || "region";
      return options.highlight && row[highlightField] === options.highlight ? COLORS[0] : (options.color || COLORS[1]);
    });
    plot(id, [{
      type: "bar",
      orientation: "h",
      x: values,
      y: labels,
      text: displayValues,
      marker: { color: colors },
      customdata: rows,
      hovertemplate: options.hovertemplate || "%{y}: %{x:,.2f}<extra></extra>"
    }], {
      margin: { t: 16, r: 26, b: 46, l: options.leftMargin || 190 },
      xaxis: { title: options.xTitle || "" },
      yaxis: { title: "" }
    });
  }

  function lineChart(id, traces, options) {
    options = options || {};
    if (!traces.length) {
      showEmptyChart(id);
      return;
    }
    var xaxis = Object.assign({ title: "" }, options.xAxis || {});
    plot(id, traces, {
      margin: { t: 20, r: 26, b: 52, l: 78 },
      xaxis: xaxis,
      yaxis: { title: options.yTitle || "" },
      legend: { orientation: "h", y: -0.18 },
      hovermode: "x unified"
    });
  }

  function fillSelect(id, options, selected) {
    var node = byId(id);
    if (!node) return;
    clear(node);
    options.forEach(function (option) {
      var opt = document.createElement("option");
      opt.value = option.value;
      opt.textContent = option.label;
      node.appendChild(opt);
    });
    if (options.some(function (option) { return option.value === selected; })) {
      node.value = selected;
    }
  }

  function healthRows() {
    return tableRows("health_status_by_territory_year");
  }

  function healthIndicators() {
    return toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.health_indicators);
  }

  function healthIndicatorMap() {
    var map = {};
    healthIndicators().forEach(function (indicator) {
      map[indicator.id] = indicator;
    });
    return map;
  }

  function healthIndicatorById(id) {
    return healthIndicatorMap()[id] || null;
  }

  function isMortalityGroup(group) {
    return asText(group).indexOf("mortality_") === 0;
  }

  function healthGroupOptions(domain) {
    return toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.health_groups).filter(function (row) {
      if (domain === "mortality") return isMortalityGroup(row.id);
      if (domain === "health") return !isMortalityGroup(row.id);
      return true;
    }).map(function (row) {
      return { value: row.id, label: row.label };
    });
  }

  function healthTerritoryOptions() {
    var rows = toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.health_territories);
    if (!rows.length) rows = unique(healthRows().map(function (row) { return row.territory; })).map(function (territory) {
      return { id: territory, label: territory };
    });
    return rows.map(function (row) {
      return { value: row.id || row.territory, label: row.label || row.territory };
    });
  }

  function healthIndicatorsForGroup(group) {
    return healthIndicators().filter(function (indicator) {
      return indicator.group === group;
    });
  }

  function healthIndicatorOptions(group) {
    var rows = healthIndicatorsForGroup(group);
    return rows.map(function (indicator) {
      return { value: indicator.id, label: compact(indicator.subgroup + " - " + indicator.label, 72) };
    });
  }

  function healthYearsForIndicator(indicatorId, regionalOnly) {
    var years = unique(healthRows().filter(function (row) {
      if (row.indicator_id !== indicatorId) return false;
      return !regionalOnly || row.territory_type === "region";
    }).map(function (row) { return row.year; })).sort(function (a, b) { return b - a; });
    if (!years.length && regionalOnly) return healthYearsForIndicator(indicatorId, false);
    return years;
  }

  function healthYearsForGroup(group, regionalOnly) {
    var years = unique(healthRows().filter(function (row) {
      if (row.group !== group) return false;
      return !regionalOnly || row.territory_type === "region";
    }).map(function (row) { return row.year; })).sort(function (a, b) { return b - a; });
    if (!years.length && regionalOnly) return healthYearsForGroup(group, false);
    return years;
  }

  function healthYearOptions(indicatorId, group, regionalOnly) {
    var years = indicatorId ? healthYearsForIndicator(indicatorId, regionalOnly) : healthYearsForGroup(group, regionalOnly);
    var latestLabel = regionalOnly ? "Ultimo anno con regioni" : (indicatorId ? "Ultimo anno disponibile" : "Ultimo anno per indicatore");
    return [{ value: "latest", label: latestLabel }].concat(years.map(function (year) {
      return { value: String(year), label: String(year) };
    }));
  }

  function healthYearValue(value, indicatorId, regionalOnly) {
    if (value === "latest") {
      var years = healthYearsForIndicator(indicatorId, regionalOnly);
      return years.length ? years[0] : null;
    }
    return toNumber(value);
  }

  function healthGroupLabel(group) {
    var match = healthGroupOptions().find(function (row) { return row.value === group; });
    return match ? match.label : asText(group);
  }

  function healthUnitTitle(indicator) {
    if (!indicator) return "valore";
    if (indicator.unit === "percent") return "percentuale";
    if (indicator.unit === "per_1000") return "tasso per 1.000";
    if (indicator.unit === "per_10000") return "tasso per 10.000";
    return indicator.unit_label || "valore";
  }

  function formatHealthValue(value, indicator) {
    if (indicator && indicator.unit === "percent") return formatPercent(value);
    return formatDecimal(value);
  }

  function healthRowFor(territory, indicatorId, yearValue) {
    var rows = healthRows().filter(function (row) {
      if (row.territory !== territory || row.indicator_id !== indicatorId) return false;
      if (yearValue !== "latest" && toNumber(yearValue) !== null && row.year !== toNumber(yearValue)) return false;
      return true;
    });
    return latestRow(rows);
  }

  function healthPairedRows(territory, indicatorId, yearValue) {
    if (territory === "Italia") {
      var italyOnly = healthRowFor("Italia", indicatorId, yearValue);
      return { territoryRow: italyOnly, italyRow: italyOnly };
    }
    if (yearValue !== "latest" && toNumber(yearValue) !== null) {
      return {
        territoryRow: healthRowFor(territory, indicatorId, yearValue),
        italyRow: healthRowFor("Italia", indicatorId, yearValue)
      };
    }
    var territoryRows = healthRows().filter(function (row) {
      return row.territory === territory && row.indicator_id === indicatorId;
    });
    var italyRows = healthRows().filter(function (row) {
      return row.territory === "Italia" && row.indicator_id === indicatorId;
    });
    var italyByYear = {};
    italyRows.forEach(function (row) {
      italyByYear[row.year] = row;
    });
    territoryRows.sort(function (a, b) { return b.year - a.year; });
    for (var i = 0; i < territoryRows.length; i += 1) {
      if (italyByYear[territoryRows[i].year]) {
        return { territoryRow: territoryRows[i], italyRow: italyByYear[territoryRows[i].year] };
      }
    }
    return { territoryRow: latestRow(territoryRows), italyRow: latestRow(italyRows) };
  }

  function healthNoteForIndicator(indicator, extra) {
    var parts = [];
    if (indicator && indicator.measure_type === "mortality") {
      parts.push("Misura mortalita: indica decessi per causa, non incidenza, prevalenza o numero di persone malate.");
    } else if (indicator && (indicator.measure_type === "incidence_registry" || indicator.measure_type === "prevalence_registry")) {
      parts.push("Indicatore epidemiologico: incidenza e prevalenza descrivono nuovi casi o casi presenti, non decessi.");
    } else if (indicator && indicator.measure_type === "self_report_average") {
      parts.push("Indicatore dichiarato: misura un comportamento medio riferito dagli intervistati.");
    } else {
      parts.push("Indicatore dichiarato: utile per confronti territoriali e andamento, ma non sostituisce diagnosi cliniche o registri di patologia.");
    }
    if (indicator && (indicator.group === "mortality_cancers" || indicator.group === "cancer_burden")) {
      parts.push("Il pancreas non e disponibile come indicatore regionale separato in Health for All; la dashboard non lo stima con proxy.");
    }
    parts.push("In questa fonte Trentino-Alto Adige e pubblicato come area unica, non come P.A. Trento e P.A. Bolzano.");
    if (extra) parts.push(extra);
    return parts.join(" ");
  }

  function recentCancerRows() {
    return tableRows("recent_cancer_estimates");
  }

  function recentCancerTotals() {
    return tableRows("recent_cancer_totals");
  }

  function recentCancerMetricOptions() {
    var options = toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.recent_cancer_metrics);
    if (!options.length) {
      options = [
        { id: "new_cases", label: "Nuove diagnosi stimate", year_label: "incidenza 2024" },
        { id: "deaths", label: "Decessi stimati", year_label: "mortalita 2022" },
        { id: "prevalence", label: "Persone viventi dopo diagnosi", year_label: "prevalenza 2024" }
      ];
    }
    return options.map(function (option) {
      return { value: option.id, label: option.label, yearLabel: option.year_label };
    });
  }

  function recentCancerMetricConfig(metric) {
    var match = recentCancerMetricOptions().find(function (option) { return option.value === metric; }) || recentCancerMetricOptions()[0];
    if (!match || match.value === "new_cases") {
      return { field: "new_cases", label: "Nuove diagnosi stimate", shortLabel: "nuove diagnosi", yearLabel: "incidenza 2024", xTitle: "casi stimati", format: formatNumber };
    }
    if (match.value === "deaths") {
      return { field: "deaths", label: "Decessi stimati", shortLabel: "decessi", yearLabel: "mortalita 2022", xTitle: "decessi stimati", format: formatNumber };
    }
    return { field: "prevalence", label: "Persone viventi dopo diagnosi", shortLabel: "prevalenza", yearLabel: "prevalenza 2024", xTitle: "persone", format: formatNumber };
  }

  function recentCancerSiteOptions() {
    return recentCancerRows().map(function (row) {
      return { value: row.site_id, label: row.site };
    });
  }

  function recentCancerSelectedSite() {
    return recentCancerRows().find(function (row) {
      return row.site_id === STATE.cancerRecentSite;
    }) || recentCancerRows()[0] || null;
  }

  function refreshRecentCancerFilters() {
    var metricOptions = recentCancerMetricOptions();
    var siteOptions = recentCancerSiteOptions();
    if (!metricOptions.some(function (option) { return option.value === STATE.cancerRecentMetric; })) {
      STATE.cancerRecentMetric = metricOptions[0] ? metricOptions[0].value : "new_cases";
    }
    if (!siteOptions.some(function (option) { return option.value === STATE.cancerRecentSite; })) {
      var pancreas = siteOptions.find(function (option) { return option.value === "pancreas"; });
      STATE.cancerRecentSite = pancreas ? pancreas.value : (siteOptions[0] ? siteOptions[0].value : "");
    }
    fillSelect("hiCancerRecentMetricFilter", metricOptions, STATE.cancerRecentMetric);
    fillSelect("hiCancerRecentSiteFilter", siteOptions, STATE.cancerRecentSite);
  }

  function mortalityDetailRows() {
    return tableRows("mortality_detail_by_territory_year");
  }

  function mortalityDetailCauses() {
    return toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.mortality_detail_causes);
  }

  function mortalityDetailGroups() {
    return toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.mortality_detail_groups).map(function (group) {
      return { value: group.id, label: group.label };
    });
  }

  function mortalityDetailTerritoryOptions() {
    var rows = toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.mortality_detail_territories);
    return rows.map(function (row) {
      return { value: row.id || row.territory, label: row.label || row.territory };
    });
  }

  function mortalityDetailCauseOptions(group) {
    return mortalityDetailCauses().filter(function (cause) {
      return !group || cause.group === group;
    }).map(function (cause) {
      return { value: cause.cause_code || cause.id, label: compact(cause.label, 76) };
    });
  }

  function mortalityDetailCauseByCode(code) {
    return mortalityDetailCauses().find(function (cause) {
      return cause.cause_code === code || cause.id === code;
    }) || null;
  }

  function mortalityDetailYearsForCause(causeCode, regionalOnly) {
    var years = unique(mortalityDetailRows().filter(function (row) {
      if (row.cause_code !== causeCode) return false;
      return !regionalOnly || row.territory_type === "region";
    }).map(function (row) { return row.year; })).sort(function (a, b) { return b - a; });
    if (!years.length && regionalOnly) return mortalityDetailYearsForCause(causeCode, false);
    return years;
  }

  function mortalityDetailYearOptions(causeCode, regionalOnly) {
    var years = mortalityDetailYearsForCause(causeCode, regionalOnly);
    return [{ value: "latest", label: regionalOnly ? "Ultimo anno con regioni" : "Ultimo anno disponibile" }].concat(years.map(function (year) {
      return { value: String(year), label: String(year) };
    }));
  }

  function mortalityDetailYearValue(value, causeCode, regionalOnly) {
    if (value === "latest") {
      var years = mortalityDetailYearsForCause(causeCode, regionalOnly);
      return years.length ? years[0] : null;
    }
    return toNumber(value);
  }

  function refreshMortalityDetailFilters() {
    var groupOptions = mortalityDetailGroups();
    var territoryOptions = mortalityDetailTerritoryOptions();
    if (!groupOptions.some(function (option) { return option.value === STATE.mortalityDetailGroup; })) {
      STATE.mortalityDetailGroup = groupOptions[0] ? groupOptions[0].value : "cancer_detail";
    }
    if (!groupOptions.some(function (option) { return option.value === STATE.mortalityDetailTrendGroup; })) {
      STATE.mortalityDetailTrendGroup = STATE.mortalityDetailGroup;
    }
    var causeOptions = mortalityDetailCauseOptions(STATE.mortalityDetailGroup);
    if (!causeOptions.some(function (option) { return option.value === STATE.mortalityDetailCause; })) {
      var pancreas = causeOptions.find(function (option) { return option.value === "C25"; });
      STATE.mortalityDetailCause = pancreas ? pancreas.value : (causeOptions[0] ? causeOptions[0].value : "");
    }
    var trendCauseOptions = mortalityDetailCauseOptions(STATE.mortalityDetailTrendGroup);
    if (!trendCauseOptions.some(function (option) { return option.value === STATE.mortalityDetailTrendCause; })) {
      var trendPancreas = trendCauseOptions.find(function (option) { return option.value === "C25"; });
      STATE.mortalityDetailTrendCause = trendPancreas ? trendPancreas.value : (trendCauseOptions[0] ? trendCauseOptions[0].value : "");
    }
    if (!territoryOptions.some(function (option) { return option.value === STATE.mortalityDetailTerritoryFocus; })) STATE.mortalityDetailTerritoryFocus = "Italia";
    if (!territoryOptions.some(function (option) { return option.value === STATE.mortalityDetailTrendTerritory; })) STATE.mortalityDetailTrendTerritory = "Italia";
    if (!mortalityDetailYearOptions(STATE.mortalityDetailCause, true).some(function (option) { return option.value === STATE.mortalityDetailYear; })) STATE.mortalityDetailYear = "latest";

    fillSelect("hiMortalityDetailGroupFilter", groupOptions, STATE.mortalityDetailGroup);
    fillSelect("hiMortalityDetailCauseFilter", causeOptions, STATE.mortalityDetailCause);
    fillSelect("hiMortalityDetailYearFilter", mortalityDetailYearOptions(STATE.mortalityDetailCause, true), STATE.mortalityDetailYear);
    fillSelect("hiMortalityDetailFocusFilter", territoryOptions, STATE.mortalityDetailTerritoryFocus);
    fillSelect("hiMortalityDetailTrendTerritoryFilter", territoryOptions, STATE.mortalityDetailTrendTerritory);
    fillSelect("hiMortalityDetailTrendGroupFilter", groupOptions, STATE.mortalityDetailTrendGroup);
    fillSelect("hiMortalityDetailTrendCauseFilter", trendCauseOptions, STATE.mortalityDetailTrendCause);
  }

  function formatMortalityDetailValue(value) {
    return formatDecimal(value);
  }

  function mortalityDetailNote(cause, year, extra) {
    var parts = [];
    parts.push("Dato Eurostat: tasso standardizzato per eta, sesso totale e tutte le eta, per regione NUTS2 di residenza.");
    if (cause) parts.push("Causa ICD-10 selezionata: " + cause.label + " (" + (cause.cause_code || cause.id) + ").");
    if (year) parts.push("Anno selezionato: " + year + ".");
    if (STATE.mortalityDetailTerritoryFocus) parts.push("Territorio evidenziato nel grafico: " + STATE.mortalityDetailTerritoryFocus + ".");
    parts.push("Misura decessi, non nuovi casi, prevalenza, tempi di attesa o qualita delle cure.");
    if (extra) parts.push(extra);
    return parts.join(" ");
  }

  function refreshHealthFilters() {
    var groupOptions = healthGroupOptions("health");
    var territoryOptions = healthTerritoryOptions();
    if (!groupOptions.some(function (option) { return option.value === STATE.healthGroup; })) {
      STATE.healthGroup = groupOptions[0] ? groupOptions[0].value : "risk_weight";
    }
    if (!groupOptions.some(function (option) { return option.value === STATE.healthProfileGroup; })) {
      STATE.healthProfileGroup = groupOptions[0] ? groupOptions[0].value : "chronic_conditions";
    }
    if (!groupOptions.some(function (option) { return option.value === STATE.healthTrendGroup; })) {
      STATE.healthTrendGroup = groupOptions[0] ? groupOptions[0].value : "risk_weight";
    }
    if (!territoryOptions.some(function (option) { return option.value === STATE.healthTerritoryFocus; })) STATE.healthTerritoryFocus = "Italia";
    if (!territoryOptions.some(function (option) { return option.value === STATE.healthProfileTerritory; })) STATE.healthProfileTerritory = "Italia";
    if (!territoryOptions.some(function (option) { return option.value === STATE.healthTrendTerritory; })) STATE.healthTrendTerritory = "Italia";

    var indicatorOptions = healthIndicatorOptions(STATE.healthGroup);
    if (!indicatorOptions.some(function (option) { return option.value === STATE.healthIndicator; })) {
      STATE.healthIndicator = indicatorOptions[0] ? indicatorOptions[0].value : "";
    }
    var trendIndicatorOptions = healthIndicatorOptions(STATE.healthTrendGroup);
    if (!trendIndicatorOptions.some(function (option) { return option.value === STATE.healthTrendIndicator; })) {
      STATE.healthTrendIndicator = trendIndicatorOptions[0] ? trendIndicatorOptions[0].value : "";
    }
    if (!healthYearOptions(STATE.healthIndicator, STATE.healthGroup, true).some(function (option) { return option.value === STATE.healthYear; })) STATE.healthYear = "latest";
    var profileRegionalOnly = STATE.healthProfileTerritory !== "Italia";
    if (!healthYearOptions(null, STATE.healthProfileGroup, profileRegionalOnly).some(function (option) { return option.value === STATE.healthProfileYear; })) STATE.healthProfileYear = "latest";

    fillSelect("hiHealthGroupFilter", groupOptions, STATE.healthGroup);
    fillSelect("hiHealthIndicatorFilter", indicatorOptions, STATE.healthIndicator);
    fillSelect("hiHealthYearFilter", healthYearOptions(STATE.healthIndicator, STATE.healthGroup, true), STATE.healthYear);
    fillSelect("hiHealthTerritoryFocusFilter", territoryOptions, STATE.healthTerritoryFocus);
    fillSelect("hiHealthProfileTerritoryFilter", territoryOptions, STATE.healthProfileTerritory);
    fillSelect("hiHealthProfileGroupFilter", groupOptions, STATE.healthProfileGroup);
    fillSelect("hiHealthProfileYearFilter", healthYearOptions(null, STATE.healthProfileGroup, profileRegionalOnly), STATE.healthProfileYear);
    fillSelect("hiHealthTrendTerritoryFilter", territoryOptions, STATE.healthTrendTerritory);
    fillSelect("hiHealthTrendGroupFilter", groupOptions, STATE.healthTrendGroup);
    fillSelect("hiHealthTrendIndicatorFilter", trendIndicatorOptions, STATE.healthTrendIndicator);
  }

  function refreshMortalityFilters() {
    var groupOptions = healthGroupOptions("mortality");
    var territoryOptions = healthTerritoryOptions();
    if (!groupOptions.some(function (option) { return option.value === STATE.mortalityGroup; })) {
      STATE.mortalityGroup = groupOptions[0] ? groupOptions[0].value : "mortality_cancers";
    }
    if (!groupOptions.some(function (option) { return option.value === STATE.mortalityProfileGroup; })) {
      STATE.mortalityProfileGroup = groupOptions[0] ? groupOptions[0].value : "mortality_cancers";
    }
    if (!groupOptions.some(function (option) { return option.value === STATE.mortalityTrendGroup; })) {
      STATE.mortalityTrendGroup = groupOptions[0] ? groupOptions[0].value : "mortality_cancers";
    }
    if (!territoryOptions.some(function (option) { return option.value === STATE.mortalityTerritoryFocus; })) STATE.mortalityTerritoryFocus = "Italia";
    if (!territoryOptions.some(function (option) { return option.value === STATE.mortalityProfileTerritory; })) STATE.mortalityProfileTerritory = "Italia";
    if (!territoryOptions.some(function (option) { return option.value === STATE.mortalityTrendTerritory; })) STATE.mortalityTrendTerritory = "Italia";

    var indicatorOptions = healthIndicatorOptions(STATE.mortalityGroup);
    if (!indicatorOptions.some(function (option) { return option.value === STATE.mortalityIndicator; })) {
      STATE.mortalityIndicator = indicatorOptions[0] ? indicatorOptions[0].value : "";
    }
    var trendIndicatorOptions = healthIndicatorOptions(STATE.mortalityTrendGroup);
    if (!trendIndicatorOptions.some(function (option) { return option.value === STATE.mortalityTrendIndicator; })) {
      STATE.mortalityTrendIndicator = trendIndicatorOptions[0] ? trendIndicatorOptions[0].value : "";
    }
    if (!healthYearOptions(STATE.mortalityIndicator, STATE.mortalityGroup, true).some(function (option) { return option.value === STATE.mortalityYear; })) STATE.mortalityYear = "latest";
    var profileRegionalOnly = STATE.mortalityProfileTerritory !== "Italia";
    if (!healthYearOptions(null, STATE.mortalityProfileGroup, profileRegionalOnly).some(function (option) { return option.value === STATE.mortalityProfileYear; })) STATE.mortalityProfileYear = "latest";

    fillSelect("hiMortalityGroupFilter", groupOptions, STATE.mortalityGroup);
    fillSelect("hiMortalityIndicatorFilter", indicatorOptions, STATE.mortalityIndicator);
    fillSelect("hiMortalityYearFilter", healthYearOptions(STATE.mortalityIndicator, STATE.mortalityGroup, true), STATE.mortalityYear);
    fillSelect("hiMortalityTerritoryFocusFilter", territoryOptions, STATE.mortalityTerritoryFocus);
    fillSelect("hiMortalityProfileTerritoryFilter", territoryOptions, STATE.mortalityProfileTerritory);
    fillSelect("hiMortalityProfileGroupFilter", groupOptions, STATE.mortalityProfileGroup);
    fillSelect("hiMortalityProfileYearFilter", healthYearOptions(null, STATE.mortalityProfileGroup, profileRegionalOnly), STATE.mortalityProfileYear);
    fillSelect("hiMortalityTrendTerritoryFilter", territoryOptions, STATE.mortalityTrendTerritory);
    fillSelect("hiMortalityTrendGroupFilter", groupOptions, STATE.mortalityTrendGroup);
    fillSelect("hiMortalityTrendIndicatorFilter", trendIndicatorOptions, STATE.mortalityTrendIndicator);
  }

  function setupFilters() {
    var filters = STATE.payload.filters || {};
    var disciplineRows = sortDescending(tableRows("activity_by_discipline"), "discharges");
    if (!STATE.discipline && disciplineRows.length) STATE.discipline = disciplineRows[0].discipline;
    var regionOptions = [{ value: "Italia", label: "Italia" }].concat(toArray(filters.regions).map(function (region) {
      return { value: region, label: region };
    }));
    var disciplineOptions = disciplineRows.map(function (row) {
      return { value: row.discipline, label: row.discipline };
    });
    var disciplineOptionsWithAll = [{ value: "all", label: "Tutte" }].concat(disciplineOptions);
    var costOptions = toArray(filters.cost_types).map(function (row) {
      return { value: row.id, label: row.label };
    });
    var bedYears = unique(tableRows("beds_by_discipline").map(function (row) { return row.year; })).sort(function (a, b) { return b - a; });
    var pharmaLabels = unique(tableRows("pharma_series").map(function (row) { return row.cost_label; })).sort();

    [
      ["hiNationalActivityRegionFilter", "nationalActivityRegion"],
      ["hiNationalBedsRegionFilter", "nationalBedsRegion"],
      ["hiRegionalRegionFilter", "region"],
      ["hiDischargeRegionFilter", "dischargeRegion"],
      ["hiDischargeHospitalRegionFilter", "dischargeHospitalRegion"],
      ["hiPsRegionFilter", "psRegion"],
      ["hiPsStructureRegionFilter", "psStructureRegion"],
      ["hiDisciplineRegionFilter", "disciplineRegion"],
      ["hiCostRegionFilter", "costRegion"],
      ["hiCostCompositionRegionFilter", "costCompositionRegion"],
      ["hiBedsSeriesRegionFilter", "bedsSeriesRegion"],
      ["hiPharmaSeriesRegionFilter", "pharmaRegion"],
      ["hiHospitalRegionFilter", "hospitalRegion"],
      ["hiHospitalDepartmentRegionFilter", "hospitalDepartmentRegion"],
      ["hiMobilitySeriesRegionFilter", "mobilitySeriesRegion"],
      ["hiMobilityHospitalRegionFilter", "mobilityHospitalRegion"],
      ["hiTableRegionFilter", "tableRegion"]
    ].forEach(function (item) {
      fillSelect(item[0], regionOptions, STATE[item[1]]);
    });
    refreshProvinceFilters();

    fillSelect("hiDisciplineFilter", disciplineOptions, STATE.discipline);
    fillSelect("hiDischargeDisciplineFilter", disciplineOptionsWithAll, STATE.dischargeDiscipline);
    fillSelect("hiHospitalDisciplineFilter", disciplineOptionsWithAll, STATE.hospitalDiscipline);
    fillSelect("hiTableDisciplineFilter", disciplineOptionsWithAll, STATE.tableDiscipline);
    refreshPsTriageFilter("hiPsRegionTriageFilter", "psRegionTriage", true);
    refreshPsTriageFilter("hiPsStructureTriageFilter", "psStructureTriage", true);
    fillSelect("hiCostTypeFilter", costOptions, STATE.costType);
    var latestBedsYear = STATE.payload.kpis && STATE.payload.kpis.beds_latest_year;
    fillSelect("hiNationalBedsYearFilter", [{ value: "latest", label: latestBedsYear ? "Ultimo anno (" + latestBedsYear + ")" : "Ultimo anno" }].concat(bedYears.filter(function (year) {
      return year !== latestBedsYear;
    }).map(function (year) {
      return { value: String(year), label: String(year) };
    })), STATE.nationalBedsYear);
    fillSelect("hiPharmaSeriesLabelFilter", [{ value: "all", label: "Tutte" }].concat(pharmaLabels.map(function (label) {
      return { value: label, label: label };
    })), STATE.pharmaLabel);

    var ratioSelect = byId("hiRatioFilter");
    if (ratioSelect) ratioSelect.value = STATE.ratioMode;
    var costRatioSelect = byId("hiCostRatioFilter");
    if (costRatioSelect) costRatioSelect.value = STATE.costRatio;
    var mobilityRatioSelect = byId("hiMobilityRatioFilter");
    if (mobilityRatioSelect) mobilityRatioSelect.value = STATE.mobilityRatio;
    [
      ["hiNationalActivityMetricFilter", "nationalActivityMetric"],
      ["hiNationalActivityRatioFilter", "nationalActivityRatio"],
      ["hiNationalActivityLimitFilter", "nationalActivityLimit"],
      ["hiNationalBedsMetricFilter", "nationalBedsMetric"],
      ["hiNationalBedsRatioFilter", "nationalBedsRatio"],
      ["hiNationalBedsLimitFilter", "nationalBedsLimit"],
      ["hiDisciplineMetricFilter", "disciplineMetric"],
      ["hiDischargeHospitalCategoryFilter", "dischargeHospitalCategory"],
      ["hiDischargeHospitalLimitFilter", "dischargeHospitalLimit"],
      ["hiPsRegionMetricFilter", "psRegionMetric"],
      ["hiPsStructureLimitFilter", "psStructureLimit"],
      ["hiDischargeDisciplineMetricFilter", "dischargeDisciplineMetric"],
      ["hiHospitalDepartmentMetricFilter", "hospitalDepartmentMetric"],
      ["hiHospitalDepartmentLimitFilter", "hospitalDepartmentLimit"],
      ["hiBedsSeriesMetricFilter", "bedsSeriesMetric"],
      ["hiBedsSeriesRatioFilter", "bedsSeriesRatio"],
      ["hiMobilitySeriesRatioFilter", "mobilitySeriesRatio"],
      ["hiMobilityHospitalLimitFilter", "mobilityHospitalLimit"],
      ["hiMobilitySankeyMinFilter", "mobilitySankeyMin"]
    ].forEach(function (item) {
      var node = byId(item[0]);
      if (node) node.value = STATE[item[1]];
    });
    refreshWaitingFilters(regionOptions);
    refreshHealthFilters();
    refreshRecentCancerFilters();
    refreshMortalityFilters();
    refreshMortalityDetailFilters();
    refreshDischargeStructureFilter();
    refreshPsStructureFilter();
    refreshHospitalDepartmentStructureFilter();

    var tableSelect = byId("hiTableSelect");
    if (tableSelect) {
      clear(tableSelect);
      TABLE_OPTIONS.forEach(function (item) {
        if (!STATE.payload.tables || !STATE.payload.tables[item.id]) return;
        var option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.label;
        tableSelect.appendChild(option);
      });
      tableSelect.value = STATE.table;
    }
  }

  function bindControls() {
    var bindings = [
      ["hiRegionalRegionFilter", "region"],
      ["hiDisciplineFilter", "discipline"],
      ["hiMetricFilter", "metric"],
      ["hiRatioFilter", "ratioMode"],
      ["hiNationalActivityRegionFilter", "nationalActivityRegion"],
      ["hiNationalActivityProvinceFilter", "nationalActivityProvince"],
      ["hiNationalActivityMetricFilter", "nationalActivityMetric"],
      ["hiNationalActivityRatioFilter", "nationalActivityRatio"],
      ["hiNationalActivityLimitFilter", "nationalActivityLimit"],
      ["hiNationalBedsRegionFilter", "nationalBedsRegion"],
      ["hiNationalBedsYearFilter", "nationalBedsYear"],
      ["hiNationalBedsMetricFilter", "nationalBedsMetric"],
      ["hiNationalBedsRatioFilter", "nationalBedsRatio"],
      ["hiNationalBedsLimitFilter", "nationalBedsLimit"],
      ["hiDischargeRegionFilter", "dischargeRegion"],
      ["hiDischargeProvinceFilter", "dischargeProvince"],
      ["hiDischargeStructureFilter", "dischargeStructure"],
      ["hiDischargeDisciplineFilter", "dischargeDiscipline"],
      ["hiDischargeDisciplineMetricFilter", "dischargeDisciplineMetric"],
      ["hiDischargeHospitalRegionFilter", "dischargeHospitalRegion"],
      ["hiDischargeHospitalProvinceFilter", "dischargeHospitalProvince"],
      ["hiDischargeHospitalCategoryFilter", "dischargeHospitalCategory"],
      ["hiDischargeHospitalLimitFilter", "dischargeHospitalLimit"],
      ["hiPsRegionFilter", "psRegion"],
      ["hiPsRegionTriageFilter", "psRegionTriage"],
      ["hiPsRegionMetricFilter", "psRegionMetric"],
      ["hiPsStructureRegionFilter", "psStructureRegion"],
      ["hiPsStructureProvinceFilter", "psStructureProvince"],
      ["hiPsStructureFilter", "psStructure"],
      ["hiPsStructureTriageFilter", "psStructureTriage"],
      ["hiPsStructureLimitFilter", "psStructureLimit"],
      ["hiWaitingYearFilter", "waitingYear"],
      ["hiWaitingServiceTypeFilter", "waitingServiceType"],
      ["hiWaitingServiceFilter", "waitingService"],
      ["hiWaitingPriorityFilter", "waitingPriority"],
      ["hiWaitingRegimeFilter", "waitingRegime"],
      ["hiWaitingAccessFilter", "waitingAccess"],
      ["hiWaitingMetricFilter", "waitingMetric"],
      ["hiWaitingRegionFocusFilter", "waitingRegionFocus"],
      ["hiWaitingServiceRegionFilter", "waitingServiceRegion"],
      ["hiWaitingServiceYearFilter", "waitingServiceYear"],
      ["hiWaitingServiceType2Filter", "waitingServiceType2"],
      ["hiWaitingServicePriorityFilter", "waitingServicePriority"],
      ["hiWaitingServiceRegimeFilter", "waitingServiceRegime"],
      ["hiWaitingServiceAccessFilter", "waitingServiceAccess"],
      ["hiWaitingServiceMetricFilter", "waitingServiceMetric"],
      ["hiWaitingServiceLimitFilter", "waitingServiceLimit"],
      ["hiWaitingTrendRegionFilter", "waitingTrendRegion"],
      ["hiWaitingTrendServiceFilter", "waitingTrendService"],
      ["hiWaitingTrendPriorityFilter", "waitingTrendPriority"],
      ["hiWaitingTrendMetricFilter", "waitingTrendMetric"],
      ["hiHealthGroupFilter", "healthGroup"],
      ["hiHealthIndicatorFilter", "healthIndicator"],
      ["hiHealthYearFilter", "healthYear"],
      ["hiHealthTerritoryFocusFilter", "healthTerritoryFocus"],
      ["hiHealthProfileTerritoryFilter", "healthProfileTerritory"],
      ["hiHealthProfileGroupFilter", "healthProfileGroup"],
      ["hiHealthProfileYearFilter", "healthProfileYear"],
      ["hiHealthTrendTerritoryFilter", "healthTrendTerritory"],
      ["hiHealthTrendGroupFilter", "healthTrendGroup"],
      ["hiHealthTrendIndicatorFilter", "healthTrendIndicator"],
      ["hiCancerRecentMetricFilter", "cancerRecentMetric"],
      ["hiCancerRecentSiteFilter", "cancerRecentSite"],
      ["hiMortalityGroupFilter", "mortalityGroup"],
      ["hiMortalityIndicatorFilter", "mortalityIndicator"],
      ["hiMortalityYearFilter", "mortalityYear"],
      ["hiMortalityTerritoryFocusFilter", "mortalityTerritoryFocus"],
      ["hiMortalityProfileTerritoryFilter", "mortalityProfileTerritory"],
      ["hiMortalityProfileGroupFilter", "mortalityProfileGroup"],
      ["hiMortalityProfileYearFilter", "mortalityProfileYear"],
      ["hiMortalityTrendTerritoryFilter", "mortalityTrendTerritory"],
      ["hiMortalityTrendGroupFilter", "mortalityTrendGroup"],
      ["hiMortalityTrendIndicatorFilter", "mortalityTrendIndicator"],
      ["hiMortalityDetailGroupFilter", "mortalityDetailGroup"],
      ["hiMortalityDetailCauseFilter", "mortalityDetailCause"],
      ["hiMortalityDetailYearFilter", "mortalityDetailYear"],
      ["hiMortalityDetailFocusFilter", "mortalityDetailTerritoryFocus"],
      ["hiMortalityDetailTrendTerritoryFilter", "mortalityDetailTrendTerritory"],
      ["hiMortalityDetailTrendGroupFilter", "mortalityDetailTrendGroup"],
      ["hiMortalityDetailTrendCauseFilter", "mortalityDetailTrendCause"],
      ["hiDisciplineRegionFilter", "disciplineRegion"],
      ["hiDisciplineProvinceFilter", "disciplineProvince"],
      ["hiDisciplineMetricFilter", "disciplineMetric"],
      ["hiDenominatorFilter", "denominator"],
      ["hiCostRegionFilter", "costRegion"],
      ["hiCostRatioFilter", "costRatio"],
      ["hiCostTypeFilter", "costType"],
      ["hiCostCompositionRegionFilter", "costCompositionRegion"],
      ["hiBedsSeriesRegionFilter", "bedsSeriesRegion"],
      ["hiBedsSeriesMetricFilter", "bedsSeriesMetric"],
      ["hiBedsSeriesRatioFilter", "bedsSeriesRatio"],
      ["hiPharmaSeriesRegionFilter", "pharmaRegion"],
      ["hiPharmaSeriesLabelFilter", "pharmaLabel"],
      ["hiHospitalRegionFilter", "hospitalRegion"],
      ["hiHospitalProvinceFilter", "hospitalProvince"],
      ["hiHospitalDisciplineFilter", "hospitalDiscipline"],
      ["hiHospitalDepartmentRegionFilter", "hospitalDepartmentRegion"],
      ["hiHospitalDepartmentProvinceFilter", "hospitalDepartmentProvince"],
      ["hiHospitalDepartmentStructureFilter", "hospitalDepartmentStructure"],
      ["hiHospitalDepartmentMetricFilter", "hospitalDepartmentMetric"],
      ["hiHospitalDepartmentLimitFilter", "hospitalDepartmentLimit"],
      ["hiMobilityRatioFilter", "mobilityRatio"],
      ["hiMobilitySeriesRegionFilter", "mobilitySeriesRegion"],
      ["hiMobilitySeriesRatioFilter", "mobilitySeriesRatio"],
      ["hiMobilityHospitalRegionFilter", "mobilityHospitalRegion"],
      ["hiMobilityHospitalLimitFilter", "mobilityHospitalLimit"],
      ["hiMobilitySankeyMinFilter", "mobilitySankeyMin"],
      ["hiTableRegionFilter", "tableRegion"],
      ["hiTableProvinceFilter", "tableProvince"],
      ["hiTableDisciplineFilter", "tableDiscipline"],
      ["hiTableSelect", "table"]
    ];
    bindings.forEach(function (binding) {
      var node = byId(binding[0]);
      if (!node) return;
      node.addEventListener("change", function () {
        STATE[binding[1]] = node.value;
        renderDynamic();
      });
    });

    var search = byId("hiTableSearch");
    if (search) {
      search.addEventListener("input", function () {
        STATE.search = search.value;
        renderExplorer();
      });
    }

  }

  function renderKpis() {
    var payload = STATE.payload;
    var national = payload.national || {};
    var kpis = payload.kpis || {};
    var activity = national.activity || {};
    var beds = national.beds || {};
    var costs = national.costs || {};
    var pop = national.population || {};
    var mobility = national.mobility || {};
    var items = [
      ["Dimissioni ospedaliere", activity.discharges, "anno " + asText(activity.year), formatDecimal(activity.discharges_per_1000) + " per 1.000 residenti"],
      ["Discipline", kpis.disciplines, "reparti ospedalieri", "classificate nella fonte Ministero"],
      ["Giornate di degenza", activity.stay_days, "anno " + asText(activity.year), "degenza media " + formatDecimal(activity.avg_los_days) + " giorni"],
      ["Posti letto", beds.total_beds, "anno " + asText(beds.year), formatDecimal(beds.beds_per_1000) + " per 1.000 residenti"],
      ["Costo SSN", formatEuroCompact(costs.amount_eur), "conto economico " + asText(costs.year), formatEuroDecimal(costs.cost_per_capita_eur) + " pro capite; " + formatPercent(costs.cost_percent_gdp) + " del PIL"],
      ["Popolazione 65+", pop.population_65_plus, "ISTAT 2026", formatPercent(pop.elderly_65_share_percent) + " della popolazione"],
      ["Strutture", kpis.structures, "pubbliche ed equiparate", "nel dataset attivita reparti"],
      ["Pronto soccorso", kpis.ps_structures, "AGENAS " + asText(kpis.ps_year), "tempi per struttura e codice triage"],
      ["Liste d'attesa", kpis.pnla_bookings_latest, "PNLA " + asText(kpis.pnla_year), formatNumber(kpis.pnla_services) + " prestazioni monitorate"],
      ["Salute italiani", kpis.health_status_indicators || kpis.health_indicators, "ISTAT HFA", "fattori, condizioni, limitazioni e tumori non-mortalita"],
      ["Tumori recenti", kpis.recent_cancer_estimated_cases_2025, "AIRTUM 2025", formatNumber(kpis.recent_cancer_sites) + " sedi tumorali nel dettaglio AIOM"],
      ["Mortalita dettagliata", kpis.mortality_detail_causes, "Eurostat " + asText(kpis.mortality_detail_latest_year), "cause ICD-10 con regioni NUTS2"],
      ["Saldo mobilita", formatEuroCompact(mobility.balance_eur), "Corte dei conti " + asText(mobility.year), formatEuroDecimal(mobility.balance_per_capita_eur) + " per abitante"]
    ];
    var container = byId("hiKpis");
    clear(container);
    items.forEach(function (item) {
      var card = create("article", "hi-kpi");
      card.appendChild(create("span", "", item[0]));
      card.appendChild(create("strong", "", typeof item[1] === "number" ? formatNumber(item[1]) : asText(item[1])));
      card.appendChild(create("em", "", item[2]));
      card.appendChild(create("small", "", item[3]));
      container.appendChild(card);
    });
  }

  function renderNationalCharts() {
    var activityConfig = nationalActivityConfig();
    var activityRows = nationalActivityRows().map(function (row) {
      var copy = Object.assign({}, row);
      copy.selected_value = activityConfig.value(row);
      return copy;
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
    var activityTag = byId("hiNationalActivityTag");
    if (activityTag) {
      activityTag.textContent = territoryLabel(STATE.nationalActivityRegion, STATE.nationalActivityProvince) + " - " + activityConfig.context;
    }
    var activityTitle = byId("hiNationalActivityTitle");
    if (activityTitle) {
      activityTitle.textContent = activityConfig.label + " per disciplina - " + territoryLabel(STATE.nationalActivityRegion, STATE.nationalActivityProvince);
    }
    horizontalBar(
      "hiNationalActivityChart",
      sortDescending(activityRows, "selected_value"),
      "discipline",
      "selected_value",
      {
        limit: chartLimit(STATE.nationalActivityLimit, 25),
        color: COLORS[0],
        leftMargin: 210,
        xTitle: activityConfig.xTitle,
        format: activityConfig.format,
        hovertemplate: "%{y}<br>" + activityConfig.label + ": %{text}<extra></extra>"
      }
    );
    setChartCredit("hiNationalActivityNote", [
      { id: "ministero_attivita_reparti", label: "Ministero della Salute, attivita dei reparti" }
    ].concat(denominatorSources(STATE.nationalActivityRatio)), "La misura e il territorio selezionati determinano la classifica delle discipline; sono dati di attivita ospedaliera, non una misura di appropriatezza o qualita clinica.");

    var latestBedsYear = STATE.payload.kpis && STATE.payload.kpis.beds_latest_year;
    var selectedYear = STATE.nationalBedsYear === "latest" ? latestBedsYear : Number(STATE.nationalBedsYear);
    var bedConfig = bedMetricConfig(STATE.nationalBedsMetric);
    var bedRows = (STATE.nationalBedsRegion === "Italia" ? tableRows("beds_by_discipline") : tableRows("beds_by_region_discipline").filter(function (row) {
      return row.region === STATE.nationalBedsRegion;
    })).filter(function (row) {
      return row.year === selectedYear && toNumber(row[bedConfig.field]) > 0;
    });
    bedRows = withNormalizedMetric(bedRows, bedConfig.field, STATE.nationalBedsRatio);
    var bedTag = byId("hiNationalBedsTag");
    if (bedTag) {
      bedTag.textContent = territoryLabel(STATE.nationalBedsRegion, "all") + " - " + selectedYear + " - " + ratioLabel(STATE.nationalBedsRatio);
    }
    var bedTitle = byId("hiNationalBedsTitle");
    if (bedTitle) {
      bedTitle.textContent = bedConfig.label + " per disciplina - " + territoryLabel(STATE.nationalBedsRegion, "all");
    }
    var bedLabel = STATE.nationalBedsRatio === "absolute" ? bedConfig.label : bedConfig.label + " " + ratioLabel(STATE.nationalBedsRatio);
    var bedFormat = STATE.nationalBedsRatio === "absolute" ? formatNumber : formatDecimal;
    var bedXTitle = STATE.nationalBedsRatio === "absolute" ? bedConfig.xTitle : ratioLabel(STATE.nationalBedsRatio);
    bedRows = bedRows.filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
    horizontalBar(
      "hiNationalBedsChart",
      sortDescending(bedRows, "selected_value"),
      "discipline",
      "selected_value",
      {
        limit: chartLimit(STATE.nationalBedsLimit, 25),
        color: COLORS[2],
        leftMargin: 210,
        xTitle: bedXTitle,
        format: bedFormat,
        hovertemplate: "%{y}<br>" + bedLabel + ": %{text}<extra></extra>"
      }
    );
    setChartCredit("hiNationalBedsNote", [
      { id: bedsSourceId(selectedYear), label: "Ministero della Salute, posti letto per regione e disciplina" }
    ].concat(denominatorSources(STATE.nationalBedsRatio)), "Il filtro anno e il rapporto scelto cambiano la lettura del grafico; i posti letto misurano la dotazione pubblicata dalla fonte, non il personale disponibile o i tempi di accesso.");

    renderDischargeTypeChart();
    renderDischargeHospitalRank();
  }

  function chartLimit(value, fallback) {
    if (value === "all") return 999;
    return toNumber(value) || fallback || 25;
  }

  function nationalActivityConfig() {
    var metric = STATE.nationalActivityMetric;
    var mode = STATE.nationalActivityRatio;
    var normalizable = metric === "discharges" || metric === "stay_days" || metric === "ordinary_beds";
    var labels = {
      discharges: "Dimissioni",
      stay_days: "Giornate di degenza",
      ordinary_beds: "Posti letto ordinari",
      avg_los_days: "Degenza media",
      bed_utilization_percent: "Utilizzo posti letto"
    };
    var fields = {
      discharges: "discharges",
      stay_days: "stay_days",
      ordinary_beds: "ordinary_beds",
      avg_los_days: "avg_los_days",
      bed_utilization_percent: "bed_utilization_percent"
    };
    if (metric === "avg_los_days") return { label: labels[metric], field: fields[metric], value: function (row) { return toNumber(row.avg_los_days); }, xTitle: "giorni", format: function (value) { return formatDecimal(value) + " giorni"; }, context: "valore medio" };
    if (metric === "bed_utilization_percent") return { label: labels[metric], field: fields[metric], value: function (row) { return toNumber(row.bed_utilization_percent); }, xTitle: "% utilizzo", format: formatPercent, context: "rapporto giornate/giornate disponibili" };
    if (normalizable && mode !== "absolute") {
      return {
        label: labels[metric] + " " + ratioLabel(mode),
        field: fields[metric],
        value: function (row) { return normalizedValue(row, fields[metric], mode); },
        xTitle: ratioLabel(mode),
        format: formatDecimal,
        context: ratioLabel(mode)
      };
    }
    return { label: labels[metric] || labels.discharges, field: fields[metric] || "discharges", value: function (row) { return toNumber(row[fields[metric] || "discharges"]); }, xTitle: metric === "ordinary_beds" ? "posti letto ordinari" : (metric === "stay_days" ? "giornate" : "dimissioni"), format: formatNumber, context: "valore assoluto" };
  }

  function nationalActivityRows() {
    if (STATE.nationalActivityRegion !== "Italia" && STATE.nationalActivityProvince !== "all") {
      return tableRows("activity_by_province_discipline").filter(function (row) {
        return row.region === STATE.nationalActivityRegion && row.province === STATE.nationalActivityProvince;
      });
    }
    if (STATE.nationalActivityRegion !== "Italia") {
      return tableRows("activity_by_region_discipline").filter(function (row) {
        return row.region === STATE.nationalActivityRegion;
      });
    }
    return tableRows("activity_by_discipline");
  }

  function bedMetricConfig(metric) {
    if (metric === "ordinary_beds") return { label: "Posti letto ordinari", field: "ordinary_beds", xTitle: "posti letto ordinari" };
    if (metric === "day_hospital_beds") return { label: "Posti letto day hospital", field: "day_hospital_beds", xTitle: "posti letto day hospital" };
    if (metric === "day_surgery_beds") return { label: "Posti letto day surgery", field: "day_surgery_beds", xTitle: "posti letto day surgery" };
    return { label: "Posti letto totali", field: "total_beds", xTitle: "posti letto" };
  }

  function latestRow(rows) {
    rows = toArray(rows);
    if (!rows.length) return null;
    rows.sort(function (a, b) { return (toNumber(b.year) || 0) - (toNumber(a.year) || 0); });
    return rows[0];
  }

  function dischargeDisciplineLabel() {
    return STATE.dischargeDiscipline === "all" ? "tutte le specializzazioni" : STATE.dischargeDiscipline;
  }

  function dischargeTypeScopeLabel() {
    return STATE.dischargeStructure === "all" ? "territorio" : "istituto";
  }

  function renderDischargeTypeChart() {
    var region = STATE.dischargeRegion;
    var territory = region;
    var rows;
    if (region === "Italia") {
      rows = tableRows("discharge_type_national");
      territory = "Italia";
    } else if (STATE.dischargeStructure !== "all") {
      rows = tableRows("discharge_type_by_structure").filter(function (row) {
        return row.region === region && row.structure_code === STATE.dischargeStructure;
      });
      territory = rows.length ? rows[0].structure : territoryLabel(region, STATE.dischargeProvince);
    } else if (STATE.dischargeProvince !== "all") {
      rows = tableRows("discharge_type_by_province").filter(function (row) {
        return row.region === region && row.province === STATE.dischargeProvince;
      });
      territory = territoryLabel(region, STATE.dischargeProvince);
    } else {
      rows = tableRows("discharge_type_by_region").filter(function (row) {
        return row.region === region;
      });
    }
    var row = latestRow(rows);
    if (!row) {
      showEmptyChart("hiDischargeTypeChart");
      return;
    }
    var specialtyConfig = dischargeDisciplineMetricConfig();
    var specialtyLabel = dischargeDisciplineLabel();
    var title = byId("hiDischargeTypeTitle");
    if (title) title.textContent = "Tipologia SDO e " + specialtyConfig.label + " per " + specialtyLabel + " - " + territory;
    setTag("hiDischargeTypeTag", "anno " + asText(row.year) + " - " + dischargeTypeScopeLabel() + " | sotto: " + specialtyLabel + " - " + specialtyConfig.label);
    var labels = ["A domicilio", "Trasferimenti", "Decessi"];
    var values = [row.home_discharges, row.transfers, row.deaths].map(function (value) { return toNumber(value) || 0; });
    plot("hiDischargeTypeChart", [{
      type: "bar",
      x: labels,
      y: values,
      marker: { color: [COLORS[2], COLORS[4], COLORS[5]] },
      hovertemplate: "%{x}: %{y:,.0f}<extra></extra>"
    }], {
      margin: { t: 18, r: 18, b: 54, l: 78 },
      yaxis: { title: "dimissioni note" }
    });
    var note = byId("hiDischargeTypeNote");
    if (note) setChartCredit("hiDischargeTypeNote", [
      { id: "ministero_sdo_tipologia_dimissione", label: "Ministero della Salute, SDO per tipologia di dimissione" }
    ], "Vista SDO: anno " + row.year + ", " + dischargeTypeScopeLabel() + " " + territory + ". Celle oscurate nella selezione: " + formatNumber(row.masked_cells) + ". Le barre sopra mostrano la tipologia amministrativa aggregata; il filtro specializzazione aggiorna sotto la misura " + specialtyConfig.label + " per " + specialtyLabel + ".");
    renderDischargeDisciplineChart();
  }

  function dischargeDisciplineMetricConfig() {
    var metric = STATE.dischargeDisciplineMetric;
    if (metric === "stay_days") return { label: "Giornate di degenza", field: "stay_days", xTitle: "giornate", color: COLORS[2], format: formatNumber };
    if (metric === "ordinary_beds") return { label: "Posti letto ordinari", field: "ordinary_beds", xTitle: "posti letto ordinari", color: COLORS[3], format: formatNumber };
    if (metric === "avg_los_days") return { label: "Degenza media", field: "avg_los_days", xTitle: "giorni", color: COLORS[4], format: formatDecimal };
    if (metric === "bed_utilization_percent") return { label: "Utilizzo posti letto", field: "bed_utilization_percent", xTitle: "percentuale", color: COLORS[5], format: formatPercent };
    return { label: "Dimissioni", field: "discharges", xTitle: "dimissioni", color: COLORS[1], format: formatNumber };
  }

  function summarizeActivityRows(rows, keyFn, labelFn) {
    var grouped = {};
    toArray(rows).forEach(function (row) {
      var key = keyFn(row);
      if (!key) return;
      if (!grouped[key]) {
        grouped[key] = Object.assign({
          key: key,
          year: row.year,
          discharges: 0,
          stay_days: 0,
          available_days: 0,
          ordinary_beds: 0,
          day_hospital_beds: 0,
          day_surgery_beds: 0,
          used_beds: 0
        }, labelFn(row));
      }
      grouped[key].discharges += toNumber(row.discharges) || 0;
      grouped[key].stay_days += toNumber(row.stay_days) || 0;
      grouped[key].available_days += toNumber(row.available_days) || 0;
      grouped[key].ordinary_beds += toNumber(row.ordinary_beds) || 0;
      grouped[key].day_hospital_beds += toNumber(row.day_hospital_beds) || 0;
      grouped[key].day_surgery_beds += toNumber(row.day_surgery_beds) || 0;
      grouped[key].used_beds += toNumber(row.used_beds) || 0;
    });
    return Object.keys(grouped).map(function (key) {
      var row = grouped[key];
      row.avg_los_days = row.discharges ? row.stay_days / row.discharges : null;
      row.bed_utilization_percent = row.available_days ? (row.stay_days / row.available_days) * 100 : null;
      return row;
    });
  }

  function topRowsKeepingSelection(rows, labelField, selectedValue, valueField, limit) {
    rows = sortDescending(rows, valueField);
    if (!selectedValue || selectedValue === "all" || limit === "all") return rows;
    var numericLimit = chartLimit(limit, 25);
    var selected = rows.find(function (row) { return row[labelField] === selectedValue; });
    if (!selected) return rows;
    var top = rows.slice(0, numericLimit);
    if (!top.some(function (row) { return row[labelField] === selectedValue; }) && top.length) {
      top[top.length - 1] = selected;
    }
    return sortDescending(top, valueField);
  }

  function renderDischargeDisciplineChart() {
    var config = dischargeDisciplineMetricConfig();
    var selectedDiscipline = STATE.dischargeDiscipline;
    var specialtyLabel = dischargeDisciplineLabel();
    var rows = dischargeActivityRows();
    var selectedStructure = STATE.dischargeStructure !== "all";
    var labelField = "discipline";
    var titlePrefix = config.label + " per specializzazione";
    var tableColumns;
    var viewNote = "";

    if (selectedStructure) {
      rows = summarizeActivityRows(rows, function (row) {
        return row.discipline;
      }, function (row) {
        return {
          region: row.region,
          province: row.province,
          structure: row.structure,
          municipality: row.municipality,
          discipline: row.discipline
        };
      });
      rows = topRowsKeepingSelection(rows, "discipline", selectedDiscipline, config.field, 25);
      tableColumns = [
        ["discipline", "Disciplina"],
        ["discharges", "Dimissioni"],
        ["stay_days", "Giornate di degenza"],
        ["ordinary_beds", "Posti letto ordinari"],
        ["avg_los_days", "Degenza media"],
        ["bed_utilization_percent", "Utilizzo posti letto"]
      ];
      if (selectedDiscipline === "all") {
        viewNote = "Vista selezionata: " + config.label + " per tutte le specializzazioni dentro la struttura scelta.";
      } else {
        viewNote = "Vista selezionata: " + config.label + ". La struttura scelta mostra tutte le specializzazioni e mette in evidenza " + selectedDiscipline + ".";
      }
    } else if (selectedDiscipline !== "all") {
      rows = rows.filter(function (row) { return row.discipline === selectedDiscipline; });
      rows = summarizeActivityRows(rows, function (row) {
        return structureKey(row);
      }, function (row) {
        return {
          region: row.region,
          province: row.province,
          structure: row.structure,
          municipality: row.municipality,
          discipline: row.discipline
        };
      });
      labelField = "structure";
      titlePrefix = config.label + " per ospedale - " + selectedDiscipline;
      rows = sortDescending(rows, config.field);
      tableColumns = [
        ["structure", "Struttura"],
        ["region", "Regione"],
        ["province", "Provincia"],
        ["discipline", "Disciplina"],
        ["discharges", "Dimissioni"],
        ["stay_days", "Giornate di degenza"],
        ["ordinary_beds", "Posti letto ordinari"],
        ["avg_los_days", "Degenza media"],
        ["bed_utilization_percent", "Utilizzo posti letto"]
      ];
      viewNote = "Vista selezionata: " + config.label + " per " + selectedDiscipline + ". Il grafico confronta le strutture del territorio selezionato che pubblicano quella specializzazione.";
    } else {
      rows = summarizeActivityRows(rows, function (row) {
        return row.discipline;
      }, function (row) {
        return { discipline: row.discipline };
      });
      rows = sortDescending(rows, config.field);
      tableColumns = [
        ["discipline", "Disciplina"],
        ["discharges", "Dimissioni"],
        ["stay_days", "Giornate di degenza"],
        ["ordinary_beds", "Posti letto ordinari"],
        ["avg_los_days", "Degenza media"],
        ["bed_utilization_percent", "Utilizzo posti letto"]
      ];
      viewNote = "Vista selezionata: " + config.label + " per tutte le specializzazioni. Il grafico aggrega i reparti del territorio selezionato.";
    }

    var territory = territoryLabel(STATE.dischargeRegion, STATE.dischargeProvince);
    var structureRows = selectedStructure ? dischargeActivityRows() : [];
    if (selectedStructure && structureRows.length) territory = structureRows[0].structure;
    var title = byId("hiDischargeDisciplineTitle");
    if (title) {
      title.textContent = titlePrefix + " - " + territory + (selectedDiscipline !== "all" && selectedStructure ? " (focus " + selectedDiscipline + ")" : "");
    }
    setTag("hiDischargeDisciplineTag", "2022 - " + specialtyLabel + " | misura: " + config.label);

    rows = rows.filter(function (row) { return toNumber(row[config.field]) !== null; });
    horizontalBar("hiDischargeDisciplineChart", rows, labelField, config.field, {
      limit: 25,
      color: config.color,
      highlight: selectedDiscipline,
      highlightField: "discipline",
      leftMargin: labelField === "structure" ? 280 : 250,
      labelLength: labelField === "structure" ? 48 : 42,
      xTitle: config.xTitle,
      format: config.format,
      hovertemplate: "%{y}<br>" + config.label + ": %{text}<extra></extra>"
    });
    createTable("hiDischargeDisciplineTable", rows, tableColumns, 80);
    var note = byId("hiDischargeDisciplineNote");
    if (note) setChartCredit("hiDischargeDisciplineNote", [
      { id: "ministero_attivita_reparti", label: "Ministero della Salute, dati di attivita dei reparti" }
    ], viewNote + " La tipologia amministrativa SDO sopra resta disponibile per territorio o istituto, non per disciplina clinica.");
  }

  function dischargeCategoryConfig() {
    var category = STATE.dischargeHospitalCategory;
    if (category === "home_discharges") return { label: "Dimissioni a domicilio", field: "home_discharges", xTitle: "dimissioni a domicilio", color: COLORS[2] };
    if (category === "transfers") return { label: "Trasferimenti verso altra struttura", field: "transfers", xTitle: "trasferimenti", color: COLORS[4] };
    if (category === "deaths") return { label: "Decessi", field: "deaths", xTitle: "decessi", color: COLORS[5] };
    return { label: "Totale noto delle categorie SDO", field: "known_total", xTitle: "dimissioni note", color: COLORS[1] };
  }

  function renderDischargeHospitalRank() {
    var config = dischargeCategoryConfig();
    var rows = tableRows("discharge_type_by_structure").filter(function (row) {
      if (STATE.dischargeHospitalRegion !== "Italia" && row.region !== STATE.dischargeHospitalRegion) return false;
      return STATE.dischargeHospitalProvince === "all" || row.province === STATE.dischargeHospitalProvince;
    }).filter(function (row) {
      return toNumber(row[config.field]) !== null;
    });
    rows = sortDescending(rows, config.field);
    var territory = territoryLabel(STATE.dischargeHospitalRegion, STATE.dischargeHospitalProvince);
    var title = byId("hiDischargeHospitalTitle");
    if (title) title.textContent = config.label + " per ospedale - " + territory;
    setTag("hiDischargeHospitalTag", "istituti SDO - " + chartLimit(STATE.dischargeHospitalLimit, 20) + " strutture");
    horizontalBar("hiDischargeHospitalChart", rows, "structure", config.field, {
      limit: chartLimit(STATE.dischargeHospitalLimit, 20),
      color: config.color,
      leftMargin: 270,
      labelLength: 44,
      xTitle: config.xTitle,
      format: formatNumber,
      hovertemplate: "%{y}<br>" + config.label + ": %{text}<extra></extra>"
    });
    createTable("hiDischargeHospitalTable", rows, tableOption("discharge_type_by_structure").columns, chartLimit(STATE.dischargeHospitalLimit, 20));
    var note = byId("hiDischargeHospitalNote");
    if (note) setChartCredit("hiDischargeHospitalNote", [
      { id: "ministero_sdo_tipologia_dimissione", label: "Ministero della Salute, SDO per tipologia di dimissione" }
    ], "Categoria selezionata: " + config.label + ". La fonte pubblica queste categorie per istituto, non per disciplina clinica.");
  }

  function psMetricLabel(metric) {
    return metric === "median_wait_minutes" ? "permanenza mediana" : "permanenza media";
  }

  function psAvailableCodesText() {
    var values = psTriageAvailableCodes().map(function (code) {
      return triageLabel(code).replace("Codice ", "").toLowerCase();
    });
    return values.length ? values.join(", ") : "codici disponibili";
  }

  function renderPsEmergency() {
    renderPsRegionChart();
    renderPsStructureChart();
  }

  function renderPsRegionChart() {
    var metric = STATE.psRegionMetric || "mean_wait_minutes";
    var rows = tableRows("ps_wait_times_by_region_triage");
    if (STATE.psRegionTriage !== "all") {
      rows = rows.filter(function (row) { return row.triage_code === STATE.psRegionTriage; });
    } else {
      var grouped = {};
      rows.forEach(function (row) {
        var key = row.region;
        if (!grouped[key]) grouped[key] = { region: row.region, year: row.year, triage_label: "Tutti i codici disponibili", values: [] };
        var value = toNumber(row[metric]);
        if (value !== null) grouped[key].values.push(value);
      });
      rows = Object.keys(grouped).map(function (key) {
        var item = grouped[key];
        item[metric] = item.values.length ? item.values.reduce(function (sum, value) { return sum + value; }, 0) / item.values.length : null;
        return item;
      });
    }
    rows = rows.map(function (row) {
      var copy = Object.assign({}, row);
      copy.selected_value = toNumber(row[metric]);
      return copy;
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
    rows.sort(function (a, b) { return (toNumber(b.selected_value) || 0) - (toNumber(a.selected_value) || 0); });
    var title = byId("hiPsRegionTitle");
    var triageText = STATE.psRegionTriage === "all" ? "tutti i codici disponibili" : triageLabel(STATE.psRegionTriage).toLowerCase();
    if (title) title.textContent = "Pronto soccorso: " + psMetricLabel(metric) + " - " + triageText;
    setTag("hiPsRegionTag", "2024 - " + psMetricLabel(metric));
    var unavailable = psUnavailableCodesText();
    setChartCredit("hiPsRegionNote", [
      { id: "agenas_trova_strutture_ps", label: "AGENAS Trova Strutture, Pronto Soccorso" }
    ], "Il tempo misura la permanenza media dal triage alla dimissione, non solo l'attesa prima della visita. Il confronto regionale e non pesato per struttura. Il filtro mostra solo i codici con tempi pubblicati dall'endpoint: " + psAvailableCodesText() + "." + (unavailable ? " I codici " + unavailable + " esistono nel modello triage a 5 codici, ma non sono pubblicati come tempi separati nell'endpoint corrente e quindi non sono mostrati come filtri grafico." : ""));
    horizontalBar("hiPsRegionChart", rows, "region", "selected_value", {
      limit: 21,
      highlight: STATE.psRegion,
      colorFor: function (row) {
        return row.region === STATE.psRegion ? COLORS[0] : triageColor(STATE.psRegionTriage === "all" ? "verde" : STATE.psRegionTriage);
      },
      leftMargin: 150,
      xTitle: "minuti",
      format: formatDurationMinutes,
      hovertemplate: "%{y}<br>Permanenza: %{text}<extra></extra>"
    });
  }

  function psWaitRowsForStructureChart() {
    return tableRows("ps_wait_times_by_structure_triage").filter(function (row) {
      if (STATE.psStructureRegion !== "Italia" && row.region !== STATE.psStructureRegion) return false;
      if (STATE.psStructureProvince !== "all" && row.province !== STATE.psStructureProvince) return false;
      if (STATE.psStructure !== "all" && psStructureKey(row) !== STATE.psStructure) return false;
      if (STATE.psStructureTriage !== "all" && row.triage_code !== STATE.psStructureTriage) return false;
      return true;
    });
  }

  function renderPsStructureChart() {
    var selectedStructure = STATE.psStructure !== "all";
    var triageText = STATE.psStructureTriage === "all" ? "tutti i codici disponibili" : triageLabel(STATE.psStructureTriage).toLowerCase();
    var territory = territoryLabel(STATE.psStructureRegion, STATE.psStructureProvince);
    var structureAccesses = null;
    var structureLevel = "";
    var rows;
    var tableColumns;
    var labelField;

    if (selectedStructure) {
      rows = psWaitRowsForStructureChart().map(function (row) {
        var copy = Object.assign({}, row);
        copy.selected_value = toNumber(row.wait_minutes);
        return copy;
      }).sort(function (a, b) { return triageOrder(a.triage_code) - triageOrder(b.triage_code); });
      labelField = "triage_label";
      tableColumns = tableOption("ps_wait_times_by_structure_triage").columns;
      if (rows.length) {
        territory = rows[0].structure;
        structureAccesses = toNumber(rows[0].accesses_total);
        structureLevel = asText(rows[0].emergency_level);
      }
    } else if (STATE.psStructureTriage === "all") {
      rows = psStructureRows().map(function (row) {
        var copy = Object.assign({}, row);
        copy.selected_value = toNumber(row.mean_wait_minutes);
        return copy;
      });
      rows.sort(function (a, b) { return (toNumber(b.selected_value) || 0) - (toNumber(a.selected_value) || 0); });
      labelField = "structure";
      tableColumns = tableOption("ps_structures").columns;
    } else {
      rows = psWaitRowsForStructureChart().map(function (row) {
        var copy = Object.assign({}, row);
        copy.selected_value = toNumber(row.wait_minutes);
        return copy;
      });
      rows.sort(function (a, b) { return (toNumber(b.selected_value) || 0) - (toNumber(a.selected_value) || 0); });
      labelField = "structure";
      tableColumns = tableOption("ps_wait_times_by_structure_triage").columns;
    }

    var title = byId("hiPsStructureTitle");
    if (title) {
      title.textContent = selectedStructure ? "Pronto soccorso: codici triage - " + territory : "Pronto soccorso: permanenza per struttura - " + territory + " - " + triageText;
    }
    setTag("hiPsStructureTag", "2024 - " + (selectedStructure && structureAccesses !== null ? "accessi struttura: " + formatNumber(structureAccesses) : (selectedStructure ? territory : triageText)));
    rows = rows.filter(function (row) { return toNumber(row.selected_value) !== null; });
    horizontalBar("hiPsStructureChart", rows, labelField, "selected_value", {
      limit: selectedStructure ? 10 : chartLimit(STATE.psStructureLimit, 20),
      colorFor: function (row) {
        return selectedStructure ? triageColor(row.triage_code) : triageColor(STATE.psStructureTriage === "all" ? "verde" : STATE.psStructureTriage);
      },
      leftMargin: selectedStructure ? 170 : 300,
      labelLength: selectedStructure ? 34 : 52,
      xTitle: "minuti",
      format: formatDurationMinutes,
      hovertemplate: "%{y}<br>Permanenza: %{text}<extra></extra>"
    });
    createTable("hiPsStructureTable", rows, tableColumns, selectedStructure ? 20 : chartLimit(STATE.psStructureLimit, 20));
    var unavailable = psUnavailableCodesText();
    setChartCredit("hiPsStructureNote", [
      { id: "agenas_trova_strutture_ps", label: "AGENAS Trova Strutture, Pronto Soccorso" }
    ], "Il grafico usa il tempo medio di permanenza dal triage alla dimissione. " + (selectedStructure ? "Nel dettaglio per codice triage la tabella non mostra gli accessi, perche la fonte pubblica solo gli accessi totali della struttura" + (structureAccesses !== null ? " (" + formatNumber(structureAccesses) + ")" : "") + (structureLevel ? " e il livello PS/DEA (" + structureLevel + ")" : "") + "." : "Accessi totali e livello PS/DEA sono riportati in tabella come dati della struttura, non del singolo codice triage.") + " Gli accessi non sono divisi per codice triage, quindi non vengono usati per pesare i tempi per colore." + (unavailable ? " I codici " + unavailable + " esistono nel modello triage a 5 codici, ma non sono pubblicati come tempi separati nell'endpoint corrente e quindi non sono mostrati come filtri grafico." : ""));
  }

  function renderWaitingLists() {
    renderWaitingRegionChart();
    renderWaitingServiceChart();
    renderWaitingTrendChart();
  }

  function waitingSourceNote(settings, extra) {
    var year = waitingYearValue(settings.year) || waitingLatestYear();
    var parts = ["Anno " + asText(year)];
    if (settings.region) parts.push("Territorio: " + settings.region);
    if (settings.service && settings.service !== "all") parts.push(waitingServiceLabel(settings.service));
    if (settings.priority && settings.priority !== "all") parts.push(settings.priority);
    if (settings.regime && settings.regime !== "all") parts.push(settings.regime === "institutional" ? "Istituzionale" : "ALPI");
    if (settings.access && settings.access !== "all") parts.push(settings.access === "first" ? "Primo accesso" : "Accesso successivo");
    return parts.join(", ") + ". " + extra;
  }

  function renderWaitingRegionChart() {
    var config = waitingMetricConfig(STATE.waitingMetric);
    var settings = {
      year: STATE.waitingYear,
      serviceType: STATE.waitingServiceType,
      service: STATE.waitingService,
      priority: STATE.waitingPriority,
      regime: STATE.waitingRegime,
      access: STATE.waitingAccess
    };
    var rows = aggregateWaitingRows(filterWaitingRows(settings), function (row) {
      return row.region;
    }, function (row) {
      return row.region;
    }).map(function (row) {
      row.region = row.label;
      row.selected_value = toNumber(row[config.field]);
      return row;
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
    rows = sortWaitingMetric(rows, "selected_value", config.lowerBetter);
    var serviceText = waitingServiceText(STATE.waitingService, STATE.waitingServiceType);
    var priorityText = waitingPriorityText(STATE.waitingPriority);
    var title = byId("hiWaitingRegionTitle");
    if (title) title.textContent = "Liste d'attesa per area - " + config.label;
    setSubtitle("hiWaitingRegionSubtitle", "Confronto tra tutte le regioni e province autonome. Filtro: " + serviceText + ", " + priorityText + ", " + waitingRegimeText(STATE.waitingRegime) + ", " + waitingAccessText(STATE.waitingAccess) + ".");
    setTag("hiWaitingRegionTag", "PNLA " + asText(waitingYearValue(STATE.waitingYear)) + " - " + priorityText);
    horizontalBar("hiWaitingRegionChart", rows, "region", "selected_value", {
      limit: 21,
      highlight: STATE.waitingRegionFocus,
      leftMargin: 150,
      xTitle: config.xTitle,
      format: config.format,
      color: config.field.indexOf("percent") !== -1 ? COLORS[3] : COLORS[1],
      hovertemplate: "%{y}<br>" + config.label + ": %{text}<br>Prenotazioni: %{customdata.bookings:,.0f}<extra></extra>"
    });
    setChartCredit("hiWaitingRegionNote", [
      { id: "agenas_liste_attesa_pnla", label: "AGENAS PNLA" }
    ], waitingSourceNote(settings, "Dati estratti dalla dashboard PNLA AGENAS tramite endpoint pubblico. Le aggregazioni su piu prestazioni o priorita sono pesate per numero di prenotazioni. La prima disponibilita proposta e diversa dall'appuntamento accettato quando l'utente o l'offerta spostano la data."));
  }

  function renderWaitingServiceChart() {
    var config = waitingMetricConfig(STATE.waitingServiceMetric);
    var settings = {
      year: STATE.waitingServiceYear,
      region: STATE.waitingServiceRegion,
      serviceType: STATE.waitingServiceType2,
      service: "all",
      priority: STATE.waitingServicePriority,
      regime: STATE.waitingServiceRegime,
      access: STATE.waitingServiceAccess
    };
    var rows = aggregateWaitingRows(filterWaitingRows(settings), function (row) {
      return row.service_id;
    }, function (row) {
      return row.service;
    }).map(function (row) {
      row.service = row.label;
      row.selected_value = toNumber(row[config.field]);
      return row;
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
    rows = sortWaitingMetric(rows, "selected_value", config.lowerBetter);
    var territory = STATE.waitingServiceRegion === "Italia" ? "Italia" : STATE.waitingServiceRegion;
    var title = byId("hiWaitingServiceTitle");
    if (title) title.textContent = "Prestazioni PNLA - " + territory + " - " + config.label;
    setSubtitle("hiWaitingServiceSubtitle", "Territorio: " + territory + ". Filtro: " + waitingPriorityText(STATE.waitingServicePriority) + ", " + waitingRegimeText(STATE.waitingServiceRegime) + ", " + waitingAccessText(STATE.waitingServiceAccess) + ".");
    setTag("hiWaitingServiceTag", "PNLA " + asText(waitingYearValue(STATE.waitingServiceYear)) + " - " + waitingPriorityText(STATE.waitingServicePriority));
    horizontalBar("hiWaitingServiceChart", rows, "service", "selected_value", {
      limit: chartLimit(STATE.waitingServiceLimit, 20),
      leftMargin: 310,
      labelLength: 56,
      xTitle: config.xTitle,
      format: config.format,
      color: config.field.indexOf("percent") !== -1 ? COLORS[3] : COLORS[2],
      hovertemplate: "%{y}<br>" + config.label + ": %{text}<br>Prenotazioni: %{customdata.bookings:,.0f}<extra></extra>"
    });
    createTable("hiWaitingServiceTable", rows, [
      ["service", "Prestazione"],
      ["bookings", "Prenotazioni"],
      ["within_target_bookings", "Entro soglia"],
      ["within_target_percent", "% entro soglia"],
      ["accepted_within_target_percent", "% appuntamento"],
      ["mean_first_available_days", "Giorni prima disponibilita"],
      ["mean_accepted_wait_days", "Giorni appuntamento"]
    ], chartLimit(STATE.waitingServiceLimit, 20));
    setChartCredit("hiWaitingServiceNote", [
      { id: "agenas_liste_attesa_pnla", label: "AGENAS PNLA" }
    ], waitingSourceNote(settings, "Dati estratti dalla dashboard PNLA AGENAS tramite endpoint pubblico. Il grafico ordina le prestazioni secondo la misura selezionata: per i giorni mostra le attese piu lunghe, per le percentuali mette in evidenza le quote piu basse di rispetto dei tempi."));
  }

  function renderWaitingTrendChart() {
    var config = waitingMetricConfig(STATE.waitingTrendMetric);
    var serviceId = STATE.waitingTrendService;
    var rows = waitingMonthlyRows().filter(function (row) {
      if (STATE.waitingTrendRegion !== "Italia" && row.region !== STATE.waitingTrendRegion) return false;
      if (serviceId !== "all" && row.service_id !== serviceId) return false;
      if (STATE.waitingTrendPriority !== "all" && row.priority_label !== STATE.waitingTrendPriority) return false;
      return true;
    });
    rows = aggregateWaitingRows(rows, function (row) {
      return row.year + "-" + String(row.month_number).padStart(2, "0");
    }, function (row) {
      return row.month;
    }).map(function (row) {
      var parts = row.key.split("-");
      row.year = Number(parts[0]);
      row.month_number = Number(parts[1]);
      row.period = row.key;
      row.selected_value = toNumber(row[config.field]);
      return row;
    }).sort(function (a, b) {
      return (a.year - b.year) || (a.month_number - b.month_number);
    });
    if (!rows.length) {
      showEmptyChart("hiWaitingTrendChart");
    }
    var serviceText = waitingServiceText(serviceId, "all");
    var title = byId("hiWaitingTrendTitle");
    if (title) title.textContent = "Serie mensile PNLA - " + STATE.waitingTrendRegion + " - " + serviceText;
    var trendYear = rows.length ? rows[0].year : waitingLatestYear();
    setSubtitle("hiWaitingTrendSubtitle", "Andamento mensile " + asText(trendYear) + ". Filtro: " + serviceText + ", " + waitingPriorityText(STATE.waitingTrendPriority) + ", Istituzionale, Primo accesso.");
    setTag("hiWaitingTrendTag", "Istituzionale - primo accesso - " + waitingPriorityText(STATE.waitingTrendPriority));
    if (rows.length) {
      lineChart("hiWaitingTrendChart", [{
        x: rows.map(function (row) { return row.period; }),
        y: rows.map(function (row) { return row.selected_value; }),
        text: rows.map(function (row) { return config.format(row.selected_value); }),
        type: "scatter",
        mode: "lines+markers",
        name: config.label,
        line: { color: COLORS[0], width: 3 },
        marker: { size: 7 },
        customdata: rows.map(function (row) { return row.bookings; }),
        hovertemplate: "%{x}<br>" + config.label + ": %{text}<br>Prenotazioni: %{customdata:,.0f}<extra></extra>"
      }], {
        yTitle: config.xTitle
      });
    }
    setChartCredit("hiWaitingTrendNote", [
      { id: "agenas_liste_attesa_pnla", label: "AGENAS PNLA" }
    ], "Dati estratti dalla dashboard PNLA AGENAS tramite endpoint pubblico. Serie mensile sull'ultimo anno disponibile nel payload, filtrata su Istituzionale e primo accesso. Serve a seguire la direzione nel tempo, non a stimare la mobilita sanitaria origine-destinazione.");
  }

  function healthColor(group) {
    if (group === "risk_weight") return COLORS[2];
    if (group === "risk_smoking") return COLORS[5];
    if (group === "risk_food") return COLORS[3];
    if (group === "risk_activity") return COLORS[4];
    if (group === "chronic_conditions") return COLORS[1];
    if (group === "cancer_burden") return COLORS[6];
    if (group === "functional_limitations") return COLORS[4];
    if (group === "perceived_health") return COLORS[2];
    if (group === "mortality_cancers") return COLORS[5];
    if (group === "mortality_cardio") return COLORS[0];
    return COLORS[4];
  }

  function renderHealth() {
    renderHealthTerritoryChart();
    renderHealthProfileChart();
    renderHealthTrendChart();
    renderRecentCancer();
  }

  function renderRecentCancer() {
    var config = recentCancerMetricConfig(STATE.cancerRecentMetric);
    var selectedSite = recentCancerSelectedSite();
    var rows = recentCancerRows().map(function (row) {
      var copy = Object.assign({}, row);
      copy.selected_value = toNumber(row[config.field]);
      return copy;
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
    rows = sortDescending(rows, "selected_value");
    var title = byId("hiCancerRecentTitle");
    var titleFocus = selectedSite ? " - focus " + selectedSite.site : "";
    if (title) title.textContent = config.label + " per sede tumorale - Italia" + titleFocus;
    var total = recentCancerTotals().find(function (row) {
      return row.metric === "new_malignant_cancers_estimate";
    });
    var totalText = total ? " AIRTUM stima " + formatNumber(total.value) + " nuovi tumori maligni nel 2025." : "";
    var selectedText = selectedSite ? " Sede in evidenza: " + selectedSite.site + "." : "";
    setSubtitle("hiCancerRecentSubtitle", "Scheda nazionale AIOM/AIRTUM: " + config.yearLabel + " per sede tumorale." + totalText + selectedText);
    setTag("hiCancerRecentTag", config.yearLabel + " - Italia");
    horizontalBar("hiCancerRecentChart", rows, "site", "selected_value", {
      limit: 20,
      color: COLORS[6],
      highlightField: "site_id",
      highlight: STATE.cancerRecentSite,
      leftMargin: 150,
      xTitle: config.xTitle,
      format: config.format,
      hovertemplate: "%{y}<br>" + config.label + ": %{text}<extra></extra>"
    });
    createTable("hiCancerRecentTable", rows.map(function (row) {
      return Object.assign({}, row, {
        selected_value_text: config.format(row.selected_value)
      });
    }), [
      ["site", "Sede tumorale"],
      ["selected_value_text", config.label],
      ["new_cases", "Nuove diagnosi"],
      ["deaths", "Decessi"],
      ["prevalence", "Prevalenza"],
      ["survival_5y_label", "Sopravvivenza 5 anni"]
    ], 20);
    setChartCredit("hiCancerRecentNote", [
      { id: "aiom_cancer_numbers_2025", label: "I numeri del cancro in Italia 2025" },
      { id: "airtum_incidence_2025", label: "AIRTUM incidenza 2025" }
    ], "Stime nazionali per sede tumorale: incidenza 2024, mortalita 2022 e prevalenza riportate nel volume AIOM/AIRTUM 2025. " + (selectedSite ? "Sede evidenziata: " + selectedSite.site + ". " : "") + "Il totale 2025 e una stima nazionale AIRTUM, non una serie regionale. Per confronti regionali di mortalita usa il grafico Eurostat sotto.");
  }

  function renderHealthTerritoryChart() {
    var indicator = healthIndicatorById(STATE.healthIndicator);
    if (!indicator) {
      showEmptyChart("hiHealthTerritoryChart");
      return;
    }
    var year = healthYearValue(STATE.healthYear, indicator.id, true);
    var rows = healthRows().filter(function (row) {
      return row.indicator_id === indicator.id && row.year === year;
    }).map(function (row) {
      var copy = Object.assign({}, row);
      copy.selected_value = toNumber(row.value);
      return copy;
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
    rows = sortDescending(rows, "selected_value");
    var title = byId("hiHealthTerritoryTitle");
    if (title) title.textContent = indicator.label + " per territorio";
    setSubtitle("hiHealthTerritorySubtitle", healthGroupLabel(indicator.group) + " - " + indicator.definition + " Valori disponibili per Italia e regioni.");
    setTag("hiHealthTerritoryTag", asText(year) + " - " + healthUnitTitle(indicator));
    horizontalBar("hiHealthTerritoryChart", rows, "territory", "selected_value", {
      limit: 21,
      color: healthColor(indicator.group),
      highlightField: "territory",
      highlight: STATE.healthTerritoryFocus,
      leftMargin: 150,
      xTitle: healthUnitTitle(indicator),
      format: function (value) { return formatHealthValue(value, indicator); },
      hovertemplate: "%{y}<br>" + indicator.label + ": %{text}<extra></extra>"
    });
    setChartCredit("hiHealthTerritoryNote", [
      { id: "istat_health_for_all", label: "ISTAT Health for All" }
    ], healthNoteForIndicator(indicator, "Anno selezionato: " + asText(year) + ". Per il confronto territoriale la lista anni esclude gli anni in cui ISTAT pubblica solo il valore Italia senza dettaglio regionale."));
  }

  function renderHealthProfileChart() {
    var group = STATE.healthProfileGroup;
    var territory = STATE.healthProfileTerritory;
    var indicators = healthIndicatorsForGroup(group);
    var profileRows = indicators.map(function (indicator) {
      var paired = healthPairedRows(territory, indicator.id, STATE.healthProfileYear);
      var row = paired.territoryRow;
      var italyRow = paired.italyRow;
      return {
        indicator_id: indicator.id,
        indicator: indicator.label,
        subgroup: indicator.subgroup,
        territory: territory,
        year: row ? row.year : (italyRow ? italyRow.year : null),
        territory_value: row ? row.value : null,
        italy_value: italyRow ? italyRow.value : null,
        unit_label: indicator.unit_label,
        unit: indicator.unit,
        definition: indicator.definition
      };
    }).filter(function (row) {
      return toNumber(row.territory_value) !== null || toNumber(row.italy_value) !== null;
    });
    profileRows.sort(function (a, b) {
      return (toNumber(b.territory_value) || 0) - (toNumber(a.territory_value) || 0);
    });
    var chartRows = profileRows.slice().reverse();
    var labels = chartRows.map(function (row) {
      var yearLabel = STATE.healthProfileYear === "latest" && row.year ? " (" + row.year + ")" : "";
      return compact(row.indicator + yearLabel, 42);
    });
    var firstIndicator = indicators[0] || {};
    var traces = [{
      type: "bar",
      orientation: "h",
      x: chartRows.map(function (row) { return toNumber(row.territory_value); }),
      y: labels,
      text: chartRows.map(function (row) { return formatHealthValue(row.territory_value, row); }),
      name: territory,
      marker: { color: healthColor(group) },
      hovertemplate: "%{y}<br>" + territory + ": %{text}<extra></extra>"
    }];
    if (territory !== "Italia") {
      traces.push({
        type: "bar",
        orientation: "h",
        x: chartRows.map(function (row) { return toNumber(row.italy_value); }),
        y: labels,
        text: chartRows.map(function (row) { return formatHealthValue(row.italy_value, row); }),
        name: "Italia",
        marker: { color: COLORS[0] },
        hovertemplate: "%{y}<br>Italia: %{text}<extra></extra>"
      });
    }
    var title = byId("hiHealthProfileTitle");
    if (title) title.textContent = "Profilo salute - " + territory + " - " + healthGroupLabel(group);
    setSubtitle("hiHealthProfileSubtitle", "Indicatori del gruppo selezionato confrontati con l'Italia. Con 'ultimo anno' ogni indicatore usa il proprio ultimo anno comparabile tra territorio e Italia.");
    setTag("hiHealthProfileTag", STATE.healthProfileYear === "latest" ? "ultimo anno per indicatore" : "anno " + STATE.healthProfileYear);
    if (profileRows.length) {
      plot("hiHealthProfileChart", traces, {
        barmode: "group",
        margin: { t: 16, r: 26, b: 54, l: 230 },
        xaxis: { title: healthUnitTitle(firstIndicator) },
        yaxis: { title: "" },
        legend: { orientation: "h", y: -0.18 }
      });
    } else {
      showEmptyChart("hiHealthProfileChart");
    }
    createTable("hiHealthProfileTable", profileRows.map(function (row) {
      return Object.assign({}, row, {
        territory_value_text: formatHealthValue(row.territory_value, row),
        italy_value_text: formatHealthValue(row.italy_value, row)
      });
    }), [
      ["indicator", "Indicatore"],
      ["subgroup", "Area"],
      ["territory", "Territorio"],
      ["territory_value_text", "Valore territorio"],
      ["italy_value_text", "Italia"],
      ["year", "Anno"],
      ["unit_label", "Unita"]
    ], 80);
    setChartCredit("hiHealthProfileNote", [
      { id: "istat_health_for_all", label: "ISTAT Health for All" }
    ], healthNoteForIndicator(firstIndicator, "Gruppo selezionato: " + healthGroupLabel(group) + "."));
  }

  function renderHealthTrendChart() {
    var indicator = healthIndicatorById(STATE.healthTrendIndicator);
    var territory = STATE.healthTrendTerritory;
    if (!indicator) {
      showEmptyChart("hiHealthTrendChart");
      return;
    }
    var territoryRows = healthRows().filter(function (row) {
      return row.indicator_id === indicator.id && row.territory === territory;
    }).sort(function (a, b) { return a.year - b.year; });
    var italyRows = healthRows().filter(function (row) {
      return row.indicator_id === indicator.id && row.territory === "Italia";
    }).sort(function (a, b) { return a.year - b.year; });
    var traces = [];
    if (territoryRows.length) {
      traces.push({
        x: territoryRows.map(function (row) { return row.year; }),
        y: territoryRows.map(function (row) { return row.value; }),
        text: territoryRows.map(function (row) { return formatHealthValue(row.value, indicator); }),
        type: "scatter",
        mode: "lines+markers",
        name: territory,
        line: { color: healthColor(indicator.group), width: 3 },
        marker: { size: 7 },
        hovertemplate: "%{x}<br>" + territory + ": %{text}<extra></extra>"
      });
    }
    if (territory !== "Italia" && italyRows.length) {
      traces.push({
        x: italyRows.map(function (row) { return row.year; }),
        y: italyRows.map(function (row) { return row.value; }),
        text: italyRows.map(function (row) { return formatHealthValue(row.value, indicator); }),
        type: "scatter",
        mode: "lines+markers",
        name: "Italia",
        line: { color: COLORS[0], width: 3 },
        marker: { size: 7 },
        hovertemplate: "%{x}<br>Italia: %{text}<extra></extra>"
      });
    }
    var title = byId("hiHealthTrendTitle");
    if (title) title.textContent = indicator.label + " nel tempo - " + territory;
    setSubtitle("hiHealthTrendSubtitle", healthGroupLabel(indicator.group) + " - " + indicator.definition + " Confronto temporale sullo stesso indicatore.");
    var years = territoryRows.map(function (row) { return row.year; });
    setTag("hiHealthTrendTag", (years.length ? Math.min.apply(null, years) + "-" + Math.max.apply(null, years) : "serie") + " - " + healthUnitTitle(indicator));
    lineChart("hiHealthTrendChart", traces, {
      xAxis: { title: "anno", tickmode: "linear", dtick: 1 },
      yTitle: healthUnitTitle(indicator)
    });
    setChartCredit("hiHealthTrendNote", [
      { id: "istat_health_for_all", label: "ISTAT Health for All" }
    ], healthNoteForIndicator(indicator, "La serie usa solo gli anni pubblicati da ISTAT per questo indicatore."));
  }

  function renderMortality() {
    renderMortalityTerritoryChart();
    renderMortalityProfileChart();
    renderMortalityTrendChart();
    renderMortalityDetail();
  }

  function renderMortalityDetail() {
    renderMortalityDetailTerritoryChart();
    renderMortalityDetailTrendChart();
  }

  function renderMortalityDetailTerritoryChart() {
    var cause = mortalityDetailCauseByCode(STATE.mortalityDetailCause);
    if (!cause) {
      showEmptyChart("hiMortalityDetailChart");
      return;
    }
    var year = mortalityDetailYearValue(STATE.mortalityDetailYear, STATE.mortalityDetailCause, true);
    var rows = mortalityDetailRows().filter(function (row) {
      return row.cause_code === STATE.mortalityDetailCause && row.year === year;
    }).map(function (row) {
      var copy = Object.assign({}, row);
      copy.selected_value = toNumber(row.value);
      return copy;
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
    rows = sortDescending(rows, "selected_value");
    var title = byId("hiMortalityDetailTitle");
    var focusLabel = STATE.mortalityDetailTerritoryFocus || "Italia";
    var detailFocusTitle = focusLabel && focusLabel !== "Italia" ? " - focus " + focusLabel : "";
    if (title) title.textContent = cause.label + " per regione" + detailFocusTitle;
    setSubtitle("hiMortalityDetailSubtitle", "Confronto territoriale Eurostat sul tasso standardizzato di mortalita. Gruppo: " + asText(cause.group_label) + ". Territorio evidenziato: " + focusLabel + ".");
    setTag("hiMortalityDetailTag", "Eurostat " + asText(year) + " - per 100.000 standardizzato");
    horizontalBar("hiMortalityDetailChart", rows, "territory", "selected_value", {
      limit: 22,
      color: COLORS[5],
      highlightField: "territory",
      highlight: STATE.mortalityDetailTerritoryFocus,
      leftMargin: 160,
      xTitle: "decessi per 100.000 abitanti, tasso standardizzato",
      format: formatMortalityDetailValue,
      hovertemplate: "%{y}<br>" + cause.label + ": %{text}<br>Tasso standardizzato per 100.000<extra></extra>"
    });
    createTable("hiMortalityDetailTable", rows.map(function (row) {
      return Object.assign({}, row, {
        selected_value_text: formatMortalityDetailValue(row.selected_value)
      });
    }), [
      ["territory", "Territorio"],
      ["cause", "Causa"],
      ["cause_code", "Codice ICD-10"],
      ["year", "Anno"],
      ["selected_value_text", "Tasso standardizzato"]
    ], 80);
    setChartCredit("hiMortalityDetailNote", [
      { id: "eurostat_mortality_detail", label: "Eurostat hlth_cd_asdr2" }
    ], mortalityDetailNote(cause, year, "Il confronto usa la popolazione standard Eurostat: e piu adatto dei conteggi assoluti quando le regioni hanno eta medie diverse."));
  }

  function renderMortalityDetailTrendChart() {
    var cause = mortalityDetailCauseByCode(STATE.mortalityDetailTrendCause);
    var territory = STATE.mortalityDetailTrendTerritory;
    if (!cause) {
      showEmptyChart("hiMortalityDetailTrendChart");
      return;
    }
    var territoryRows = mortalityDetailRows().filter(function (row) {
      return row.cause_code === STATE.mortalityDetailTrendCause && row.territory === territory;
    }).sort(function (a, b) { return a.year - b.year; });
    var italyRows = mortalityDetailRows().filter(function (row) {
      return row.cause_code === STATE.mortalityDetailTrendCause && row.territory === "Italia";
    }).sort(function (a, b) { return a.year - b.year; });
    var traces = [];
    if (territoryRows.length) {
      traces.push({
        x: territoryRows.map(function (row) { return row.year; }),
        y: territoryRows.map(function (row) { return row.value; }),
        text: territoryRows.map(function (row) { return formatMortalityDetailValue(row.value); }),
        type: "scatter",
        mode: "lines+markers",
        name: territory,
        line: { color: COLORS[5], width: 3 },
        marker: { size: 7 },
        hovertemplate: "%{x}<br>" + territory + ": %{text}<extra></extra>"
      });
    }
    if (territory !== "Italia" && italyRows.length) {
      traces.push({
        x: italyRows.map(function (row) { return row.year; }),
        y: italyRows.map(function (row) { return row.value; }),
        text: italyRows.map(function (row) { return formatMortalityDetailValue(row.value); }),
        type: "scatter",
        mode: "lines+markers",
        name: "Italia",
        line: { color: COLORS[0], width: 3 },
        marker: { size: 7 },
        hovertemplate: "%{x}<br>Italia: %{text}<extra></extra>"
      });
    }
    var title = byId("hiMortalityDetailTrendTitle");
    if (title) title.textContent = cause.label + " nel tempo - " + territory;
    var years = territoryRows.map(function (row) { return row.year; });
    setSubtitle("hiMortalityDetailTrendSubtitle", "Serie storica Eurostat del tasso standardizzato di mortalita per " + cause.label + ". Gruppo: " + asText(cause.group_label) + ".");
    setTag("hiMortalityDetailTrendTag", (years.length ? Math.min.apply(null, years) + "-" + Math.max.apply(null, years) : "serie") + " - per 100.000 standardizzato");
    lineChart("hiMortalityDetailTrendChart", traces, {
      xAxis: { title: "anno", tickmode: "linear", dtick: 1 },
      yTitle: "decessi per 100.000 abitanti, tasso standardizzato"
    });
    setChartCredit("hiMortalityDetailTrendNote", [
      { id: "eurostat_mortality_detail", label: "Eurostat hlth_cd_asdr2" }
    ], mortalityDetailNote(cause, null, "La serie usa solo gli anni pubblicati da Eurostat per questa causa e questo territorio."));
  }

  function renderMortalityTerritoryChart() {
    var indicator = healthIndicatorById(STATE.mortalityIndicator);
    if (!indicator) {
      showEmptyChart("hiMortalityTerritoryChart");
      return;
    }
    var year = healthYearValue(STATE.mortalityYear, indicator.id, true);
    var rows = healthRows().filter(function (row) {
      return row.indicator_id === indicator.id && row.year === year;
    }).map(function (row) {
      var copy = Object.assign({}, row);
      copy.selected_value = toNumber(row.value);
      return copy;
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
    rows = sortDescending(rows, "selected_value");
    var title = byId("hiMortalityTerritoryTitle");
    if (title) title.textContent = indicator.label + " per territorio";
    setSubtitle("hiMortalityTerritorySubtitle", healthGroupLabel(indicator.group) + " - " + indicator.definition + " Valori disponibili per Italia e regioni.");
    setTag("hiMortalityTerritoryTag", asText(year) + " - " + healthUnitTitle(indicator));
    horizontalBar("hiMortalityTerritoryChart", rows, "territory", "selected_value", {
      limit: 21,
      color: healthColor(indicator.group),
      highlightField: "territory",
      highlight: STATE.mortalityTerritoryFocus,
      leftMargin: 150,
      xTitle: healthUnitTitle(indicator),
      format: function (value) { return formatHealthValue(value, indicator); },
      hovertemplate: "%{y}<br>" + indicator.label + ": %{text}<extra></extra>"
    });
    setChartCredit("hiMortalityTerritoryNote", [
      { id: "istat_health_for_all", label: "ISTAT Health for All" }
    ], healthNoteForIndicator(indicator, "Anno selezionato: " + asText(year) + ". Per il confronto territoriale la lista anni esclude gli anni in cui ISTAT pubblica solo il valore Italia senza dettaglio regionale."));
  }

  function renderMortalityProfileChart() {
    var group = STATE.mortalityProfileGroup;
    var territory = STATE.mortalityProfileTerritory;
    var indicators = healthIndicatorsForGroup(group);
    var profileRows = indicators.map(function (indicator) {
      var paired = healthPairedRows(territory, indicator.id, STATE.mortalityProfileYear);
      var row = paired.territoryRow;
      var italyRow = paired.italyRow;
      return {
        indicator_id: indicator.id,
        indicator: indicator.label,
        subgroup: indicator.subgroup,
        territory: territory,
        year: row ? row.year : (italyRow ? italyRow.year : null),
        territory_value: row ? row.value : null,
        italy_value: italyRow ? italyRow.value : null,
        unit_label: indicator.unit_label,
        unit: indicator.unit,
        definition: indicator.definition
      };
    }).filter(function (row) {
      return toNumber(row.territory_value) !== null || toNumber(row.italy_value) !== null;
    });
    profileRows.sort(function (a, b) {
      return (toNumber(b.territory_value) || 0) - (toNumber(a.territory_value) || 0);
    });
    var chartRows = profileRows.slice().reverse();
    var labels = chartRows.map(function (row) {
      var yearLabel = STATE.mortalityProfileYear === "latest" && row.year ? " (" + row.year + ")" : "";
      return compact(row.indicator + yearLabel, 42);
    });
    var firstIndicator = indicators[0] || {};
    var traces = [{
      type: "bar",
      orientation: "h",
      x: chartRows.map(function (row) { return toNumber(row.territory_value); }),
      y: labels,
      text: chartRows.map(function (row) { return formatHealthValue(row.territory_value, row); }),
      name: territory,
      marker: { color: healthColor(group) },
      hovertemplate: "%{y}<br>" + territory + ": %{text}<extra></extra>"
    }];
    if (territory !== "Italia") {
      traces.push({
        type: "bar",
        orientation: "h",
        x: chartRows.map(function (row) { return toNumber(row.italy_value); }),
        y: labels,
        text: chartRows.map(function (row) { return formatHealthValue(row.italy_value, row); }),
        name: "Italia",
        marker: { color: COLORS[0] },
        hovertemplate: "%{y}<br>Italia: %{text}<extra></extra>"
      });
    }
    var title = byId("hiMortalityProfileTitle");
    if (title) title.textContent = "Profilo mortalita - " + territory + " - " + healthGroupLabel(group);
    setSubtitle("hiMortalityProfileSubtitle", "Cause del gruppo selezionato confrontate con l'Italia. Con 'ultimo anno' ogni causa usa il proprio ultimo anno comparabile tra territorio e Italia.");
    setTag("hiMortalityProfileTag", STATE.mortalityProfileYear === "latest" ? "ultimo anno per causa" : "anno " + STATE.mortalityProfileYear);
    if (profileRows.length) {
      plot("hiMortalityProfileChart", traces, {
        barmode: "group",
        margin: { t: 16, r: 26, b: 54, l: 250 },
        xaxis: { title: healthUnitTitle(firstIndicator) },
        yaxis: { title: "" },
        legend: { orientation: "h", y: -0.18 }
      });
    } else {
      showEmptyChart("hiMortalityProfileChart");
    }
    createTable("hiMortalityProfileTable", profileRows.map(function (row) {
      return Object.assign({}, row, {
        territory_value_text: formatHealthValue(row.territory_value, row),
        italy_value_text: formatHealthValue(row.italy_value, row)
      });
    }), [
      ["indicator", "Causa"],
      ["subgroup", "Area"],
      ["territory", "Territorio"],
      ["territory_value_text", "Valore territorio"],
      ["italy_value_text", "Italia"],
      ["year", "Anno"],
      ["unit_label", "Unita"]
    ], 80);
    setChartCredit("hiMortalityProfileNote", [
      { id: "istat_health_for_all", label: "ISTAT Health for All" }
    ], healthNoteForIndicator(firstIndicator, "Gruppo selezionato: " + healthGroupLabel(group) + "."));
  }

  function renderMortalityTrendChart() {
    var indicator = healthIndicatorById(STATE.mortalityTrendIndicator);
    var territory = STATE.mortalityTrendTerritory;
    if (!indicator) {
      showEmptyChart("hiMortalityTrendChart");
      return;
    }
    var territoryRows = healthRows().filter(function (row) {
      return row.indicator_id === indicator.id && row.territory === territory;
    }).sort(function (a, b) { return a.year - b.year; });
    var italyRows = healthRows().filter(function (row) {
      return row.indicator_id === indicator.id && row.territory === "Italia";
    }).sort(function (a, b) { return a.year - b.year; });
    var traces = [];
    if (territoryRows.length) {
      traces.push({
        x: territoryRows.map(function (row) { return row.year; }),
        y: territoryRows.map(function (row) { return row.value; }),
        text: territoryRows.map(function (row) { return formatHealthValue(row.value, indicator); }),
        type: "scatter",
        mode: "lines+markers",
        name: territory,
        line: { color: healthColor(indicator.group), width: 3 },
        marker: { size: 7 },
        hovertemplate: "%{x}<br>" + territory + ": %{text}<extra></extra>"
      });
    }
    if (territory !== "Italia" && italyRows.length) {
      traces.push({
        x: italyRows.map(function (row) { return row.year; }),
        y: italyRows.map(function (row) { return row.value; }),
        text: italyRows.map(function (row) { return formatHealthValue(row.value, indicator); }),
        type: "scatter",
        mode: "lines+markers",
        name: "Italia",
        line: { color: COLORS[0], width: 3 },
        marker: { size: 7 },
        hovertemplate: "%{x}<br>Italia: %{text}<extra></extra>"
      });
    }
    var title = byId("hiMortalityTrendTitle");
    if (title) title.textContent = indicator.label + " nel tempo - " + territory;
    setSubtitle("hiMortalityTrendSubtitle", healthGroupLabel(indicator.group) + " - " + indicator.definition + " Confronto temporale sullo stesso tasso di mortalita.");
    var years = territoryRows.map(function (row) { return row.year; });
    setTag("hiMortalityTrendTag", (years.length ? Math.min.apply(null, years) + "-" + Math.max.apply(null, years) : "serie") + " - " + healthUnitTitle(indicator));
    lineChart("hiMortalityTrendChart", traces, {
      xAxis: { title: "anno", tickmode: "linear", dtick: 1 },
      yTitle: healthUnitTitle(indicator)
    });
    setChartCredit("hiMortalityTrendNote", [
      { id: "istat_health_for_all", label: "ISTAT Health for All" }
    ], healthNoteForIndicator(indicator, "La serie usa solo gli anni pubblicati da ISTAT per questa causa."));
  }

  function ratioMode() {
    return STATE.ratioMode || "auto";
  }

  function ratioModeLabel() {
    return RATIO_MODES[ratioMode()] || RATIO_MODES.auto;
  }

  function regionalMetricConfig() {
    var mode = ratioMode();
    var metric = METRICS[STATE.metric] || METRICS.discharges;
    if (STATE.metric === "discharges") {
      if (mode === "absolute") return { label: "Dimissioni", value: function (row) { return toNumber(row.discharges); }, xTitle: "dimissioni", format: formatNumber };
      if (mode === "population_65_plus") return { label: "Dimissioni per 1.000 residenti 65+", value: function (row) { return toNumber(row.discharges_per_1000_over65); }, xTitle: "per 1.000 residenti 65+", format: formatDecimal };
      if (mode === "population_75_plus") return { label: "Dimissioni per 1.000 residenti 75+", value: function (row) { return toNumber(row.discharges_per_1000_over75); }, xTitle: "per 1.000 residenti 75+", format: formatDecimal };
      if (mode === "gdp") return { label: "Dimissioni per miliardo di PIL", value: function (row) { return toNumber(row.discharges_per_billion_gdp); }, xTitle: "dimissioni per mld PIL", format: formatDecimal };
      return { label: "Dimissioni per 1.000 residenti", value: function (row) { return toNumber(row.discharges_per_1000); }, xTitle: "per 1.000 residenti", format: formatDecimal };
    }
    if (STATE.metric === "total_beds") {
      if (mode === "absolute") return { label: "Posti letto", value: function (row) { return toNumber(row.total_beds); }, xTitle: "posti letto", format: formatNumber };
      if (mode === "population_65_plus") return { label: "Posti letto per 1.000 residenti 65+", value: function (row) { return toNumber(row.beds_per_1000_over65); }, xTitle: "per 1.000 residenti 65+", format: formatDecimal };
      if (mode === "population_75_plus") return { label: "Posti letto per 1.000 residenti 75+", value: function (row) { return toNumber(row.beds_per_1000_over75); }, xTitle: "per 1.000 residenti 75+", format: formatDecimal };
      if (mode === "gdp") return { label: "Posti letto per miliardo di PIL", value: function (row) { return toNumber(row.beds_per_billion_gdp); }, xTitle: "posti letto per mld PIL", format: formatDecimal };
      return { label: "Posti letto per 1.000 residenti", value: function (row) { return toNumber(row.beds_per_1000); }, xTitle: "per 1.000 residenti", format: formatDecimal };
    }
    if (STATE.metric === "ssn_cost_eur") {
      if (mode === "absolute") return { label: "Costo SSN", value: function (row) { return (toNumber(row.ssn_cost_eur) || 0) / 1000000000; }, xTitle: "miliardi di euro", format: function (value) { return formatDecimal(value) + " mld euro"; } };
      if (mode === "population_65_plus") return { label: "Costo SSN per residente 65+", value: function (row) { return toNumber(row.ssn_cost_per_over65_eur); }, xTitle: "euro per residente 65+", format: formatEuroDecimal };
      if (mode === "population_75_plus") return { label: "Costo SSN per residente 75+", value: function (row) { return toNumber(row.ssn_cost_per_over75_eur); }, xTitle: "euro per residente 75+", format: formatEuroDecimal };
      if (mode === "gdp") return { label: "Costo SSN in rapporto al PIL", value: function (row) { return toNumber(row.ssn_cost_percent_gdp); }, xTitle: "% del PIL", format: formatPercent };
      return { label: "Costo SSN pro capite", value: function (row) { return toNumber(row.ssn_cost_per_capita_eur); }, xTitle: "euro per abitante", format: formatEuroDecimal };
    }
    if (STATE.metric === "mobility_balance_eur") {
      if (mode === "population_total" || mode === "clinical") return { label: "Saldo mobilita per abitante", value: function (row) { return toNumber(row.mobility_balance_per_capita_eur); }, xTitle: "euro per abitante", format: formatEuroDecimal, signed: true };
      if (mode === "population_65_plus") return { label: "Saldo mobilita per residente 65+", value: function (row) { return toNumber(row.mobility_balance_per_over65_eur); }, xTitle: "euro per residente 65+", format: formatEuroDecimal, signed: true };
      if (mode === "population_75_plus") return { label: "Saldo mobilita per residente 75+", value: function (row) { return toNumber(row.mobility_balance_per_over75_eur); }, xTitle: "euro per residente 75+", format: formatEuroDecimal, signed: true };
      if (mode === "gdp") return { label: "Saldo mobilita in rapporto al PIL", value: function (row) { return toNumber(row.mobility_balance_percent_gdp); }, xTitle: "% del PIL", format: formatPercent, signed: true };
      return { label: "Saldo mobilita", value: function (row) { return toNumber(row.mobility_balance_million_eur); }, xTitle: "milioni di euro", format: formatMillionEuro, signed: true };
    }
    return {
      label: metric.label,
      value: function (row) { return toNumber(row[metric.field]); },
      xTitle: metric.label,
      format: metric.format || formatDecimal
    };
  }

  function renderRegionalRank() {
    var config = regionalMetricConfig();
    var rows = tableRows("regional_summary").map(function (row) {
      var copy = Object.assign({}, row);
      copy.selected_metric = config.value(row);
      return copy;
    }).filter(function (row) {
      return toNumber(row.selected_metric) !== null;
    });
    rows.sort(function (a, b) { return (toNumber(b.selected_metric) || 0) - (toNumber(a.selected_metric) || 0); });
    var title = byId("hiRegionalRankTitle");
    var tag = byId("hiRegionalRankTag");
    if (title) title.textContent = config.label;
    if (tag) tag.textContent = (STATE.region === "Italia" ? "tutte le regioni" : "focus " + STATE.region) + " - " + ratioModeLabel();
    setChartCredit("hiRegionalRankNote", [
      { id: "ministero_attivita_reparti", label: "Ministero della Salute" },
      { id: "openbdap_ssn", label: "OpenBDAP/RGS" },
      { id: "istat_posas_2026", label: "ISTAT" },
      { id: "eurostat_gdp_nuts2", label: "Eurostat PIL regionale" }
    ], "Il confronto regionale usa la misura selezionata e, quando richiesto, rapporta i valori alla popolazione residente, alla popolazione anziana, alle dimissioni o al PIL.");
    horizontalBar("hiRegionalRankChart", rows, "region", "selected_metric", {
      limit: 21,
      highlight: STATE.region,
      leftMargin: 150,
      xTitle: config.xTitle,
      format: config.format,
      colorFor: config.signed ? function (row) { return toNumber(row.selected_metric) < 0 ? COLORS[5] : COLORS[2]; } : null,
      hovertemplate: "%{y}<br>" + config.label + ": %{text}<extra></extra>"
    });
  }

  function selectedRegionalRow() {
    if (STATE.region === "Italia") return null;
    return tableRows("regional_summary").find(function (row) { return row.region === STATE.region; }) || null;
  }

  function renderRegionProfile() {
    var container = byId("hiRegionProfile");
    clear(container);
    var national = STATE.payload.national || {};
    var row = selectedRegionalRow();
    var title = STATE.region === "Italia" ? "Italia" : STATE.region;
    var items;
    if (!row) {
      items = [
        ["Territorio", title, "somma nazionale dei territori disponibili"],
        ["Dimissioni", formatNumber((national.activity || {}).discharges), formatDecimal((national.activity || {}).discharges_per_1000) + " per 1.000 residenti"],
        ["Posti letto", formatNumber((national.beds || {}).total_beds), formatDecimal((national.beds || {}).beds_per_1000) + " per 1.000 residenti"],
        ["Costo SSN", formatEuroCompact((national.costs || {}).amount_eur), formatEuroDecimal((national.costs || {}).cost_per_capita_eur) + " pro capite; " + formatPercent((national.costs || {}).cost_percent_gdp) + " del PIL"],
        ["Popolazione 75+", formatNumber((national.population || {}).population_75_plus), formatPercent((national.population || {}).elderly_75_share_percent) + " dei residenti"],
        ["Saldo mobilita", formatEuroCompact((national.mobility || {}).balance_eur), formatEuroDecimal((national.mobility || {}).balance_per_capita_eur) + " per abitante"]
      ];
    } else {
      items = [
        ["Territorio", row.region, formatNumber(row.population_total) + " residenti ISTAT 2026"],
        ["Dimissioni", formatNumber(row.discharges), formatDecimal(row.discharges_per_1000) + " per 1.000, rank " + asText(row.rank_discharges_per_1000)],
        ["Posti letto", formatNumber(row.total_beds), formatDecimal(row.beds_per_1000) + " per 1.000, rank " + asText(row.rank_beds_per_1000)],
        ["Costo SSN", formatEuroCompact(row.ssn_cost_eur), formatEuroDecimal(row.ssn_cost_per_capita_eur) + " pro capite; " + formatPercent(row.ssn_cost_percent_gdp) + " del PIL"],
        ["Popolazione 75+", formatNumber(row.population_75_plus), formatPercent(row.elderly_75_share_percent) + " dei residenti"],
        ["Saldo mobilita", formatEuroCompact(row.mobility_balance_eur), formatEuroDecimal(row.mobility_balance_per_capita_eur) + " per abitante, rank " + asText(row.rank_mobility_balance)]
      ];
    }
    items.forEach(function (item) {
      var card = create("div", "hi-profile-item");
      card.appendChild(create("span", "", item[0]));
      card.appendChild(create("strong", "", item[1]));
      card.appendChild(create("small", "", item[2]));
      container.appendChild(card);
    });
  }

  function renderRegionalSummaryTable() {
    createTable("hiRegionalSummaryTable", filteredByRegion(tableRows("regional_summary")), tableOption("regional_summary").columns, 30);
  }

  function disciplineRate(row) {
    var denominator = STATE.denominator;
    if (denominator === "auto") return toNumber(row.discharges_per_1000_relevant);
    var value = denominatorValueForRow(row, denominator);
    if (!value) return null;
    return ((toNumber(row.discharges) || 0) / value) * 1000;
  }

  function disciplineMetricConfig() {
    var metric = STATE.disciplineMetric;
    if (metric === "discharges") return { label: "Dimissioni", field: "discharges", xTitle: "dimissioni", format: formatNumber };
    if (metric === "stay_days") return { label: "Giornate di degenza", field: "stay_days", xTitle: "giornate", format: formatNumber };
    if (metric === "avg_los_days") return { label: "Degenza media", field: "avg_los_days", xTitle: "giorni", format: function (value) { return formatDecimal(value) + " giorni"; } };
    if (metric === "bed_utilization_percent") return { label: "Utilizzo posti letto", field: "bed_utilization_percent", xTitle: "% utilizzo", format: formatPercent };
    if (metric === "ordinary_beds") return { label: "Posti letto ordinari", field: "ordinary_beds", xTitle: "posti letto ordinari", format: formatNumber };
    return { label: "Dimissioni per 1.000", field: "selected_value", xTitle: "dimissioni per 1.000", format: formatDecimal, rate: true };
  }

  function renderDiscipline() {
    var config = disciplineMetricConfig();
    var provinceLevel = STATE.disciplineRegion !== "Italia";
    var rows = (provinceLevel ? tableRows("activity_by_province_discipline") : tableRows("activity_by_region_discipline")).filter(function (row) {
      if (row.discipline !== STATE.discipline) return false;
      if (!provinceLevel) return true;
      if (row.region !== STATE.disciplineRegion) return false;
      return STATE.disciplineProvince === "all" || row.province === STATE.disciplineProvince;
    }).map(function (row) {
      var copy = Object.assign({}, row);
      copy.selected_value = config.rate ? disciplineRate(row) : toNumber(row[config.field]);
      copy.territory_label = provinceLevel ? provinceLabel(row.region, row.province) : row.region;
      return copy;
    });
    rows.sort(function (a, b) { return (toNumber(b.selected_value) || 0) - (toNumber(a.selected_value) || 0); });
    var title = byId("hiDisciplineRegionTitle");
    var tag = byId("hiDisciplineRegionTag");
    var denominatorText = STATE.denominator === "auto" ? "automatico" : denominatorLabel(STATE.denominator);
    var territory = territoryLabel(STATE.disciplineRegion, STATE.disciplineProvince);
    if (title) title.textContent = STATE.discipline || "Disciplina";
    if (tag) tag.textContent = territory + " - " + (config.rate ? "per 1.000, denominatore " + denominatorText : config.label);
    horizontalBar("hiDisciplineRegionChart", rows, "territory_label", "selected_value", {
      limit: provinceLevel ? 40 : 21,
      highlight: provinceLevel ? STATE.disciplineProvince : STATE.disciplineRegion,
      highlightField: provinceLevel ? "province" : "region",
      leftMargin: provinceLevel ? 190 : 150,
      xTitle: config.xTitle,
      format: config.format,
      hovertemplate: "%{y}<br>" + config.label + ": %{text}<extra></extra>"
    });
    var note = byId("hiDisciplineNote");
    if (note) setChartCredit("hiDisciplineNote", [
      { id: "ministero_attivita_reparti", label: "Ministero della Salute, attivita dei reparti" },
      { id: "istat_posas_2026", label: "ISTAT POSAS 2026" }
    ], config.rate ? "Denominatore selezionato: " + denominatorText + ". La tabella riporta anche volumi assoluti, degenza media e utilizzo dei posti letto." : "Misura selezionata: " + config.label + ". I tassi per popolazione restano disponibili cambiando misura.");
    var tableColumns = [
      [provinceLevel ? "province" : "region", provinceLevel ? "Provincia" : "Regione"],
      ["discipline", "Disciplina"],
      ["discharges", "Dimissioni"],
      ["selected_value", config.label],
      ["relevant_denominator", "Denom. auto"],
      ["avg_los_days", "Degenza media"],
      ["bed_utilization_percent", "Utilizzo PL"]
    ];
    if (provinceLevel) tableColumns.splice(1, 0, ["province_name", "Nome provincia"]);
    createTable("hiDisciplineTable", rows, tableColumns, 80);
  }

  function costMetricConfig() {
    var mode = STATE.costRatio || "population_total";
    if (mode === "population_65_plus") return { label: "per residente 65+", field: "amount_per_over65_eur", xTitle: "euro per residente 65+", format: formatEuroDecimal };
    if (mode === "population_75_plus") return { label: "per residente 75+", field: "amount_per_over75_eur", xTitle: "euro per residente 75+", format: formatEuroDecimal };
    if (mode === "gdp") return { label: "in rapporto al PIL", field: "amount_percent_gdp", xTitle: "% del PIL", format: formatPercent };
    if (mode === "discharges") return { label: "per dimissione ospedaliera", field: "amount_per_discharge_eur", xTitle: "euro per dimissione", format: formatEuroDecimal };
    if (mode === "absolute") return { label: "totale", field: "amount_billion", xTitle: "miliardi di euro", format: function (value) { return formatDecimal(value) + " mld euro"; } };
    return { label: "pro capite", field: "amount_per_capita_eur", xTitle: "euro per abitante", format: formatEuroDecimal };
  }

  function renderCosts() {
    var costType = STATE.costType;
    var label = costLabel(costType);
    var config = costMetricConfig();
    var rows = tableRows("cost_by_region_category").filter(function (row) {
      return row.cost_type === costType;
    }).map(function (row) {
      var copy = Object.assign({}, row);
      copy.amount_billion = (toNumber(row.amount_eur) || 0) / 1000000000;
      return copy;
    });
    rows.sort(function (a, b) { return (toNumber(b[config.field]) || 0) - (toNumber(a[config.field]) || 0); });
    var title = byId("hiCostRegionTitle");
    if (title) title.textContent = label + " per regione - " + config.label;
    setTag("hiCostRegionTag", "conto economico 2024 - " + config.xTitle);
    var costSources = [{ id: "openbdap_ssn", label: "OpenBDAP/RGS, Enti del SSN" }];
    costSources = costSources.concat(denominatorSources(STATE.costRatio));
    if (STATE.costRatio === "discharges") costSources.push({ id: "ministero_attivita_reparti", label: "Ministero della Salute, dimissioni" });
    setChartCredit("hiCostRegionNote", costSources, "Le voci sono contabili e regionali: aiutano a leggere dove si concentra la spesa, ma non misurano il costo clinico della singola prestazione.");
    horizontalBar("hiCostRegionChart", rows, "region", config.field, {
      limit: 21,
      highlight: STATE.costRegion,
      color: COLORS[3],
      leftMargin: 150,
      xTitle: config.xTitle,
      format: config.format,
      hovertemplate: "%{y}<br>" + label + ": %{text}<extra></extra>"
    });

    var compositionRegion = STATE.costCompositionRegion || "Italia";
    var composition = (compositionRegion === "Italia" ? tableRows("cost_national") : tableRows("cost_by_region_category").filter(function (row) {
      return row.region === compositionRegion;
    })).filter(function (row) {
      return row.cost_type !== "totali";
    }).map(function (row) {
      var copy = Object.assign({}, row);
      copy.amount_billion = (toNumber(row.amount_eur) || 0) / 1000000000;
      return copy;
    });
    var compositionTitle = byId("hiCostCompositionTitle");
    if (compositionTitle) compositionTitle.textContent = "Composizione dei costi - " + compositionRegion;
    setTag("hiCostCompositionTag", "conto economico 2024 - miliardi di euro");
    setChartCredit("hiCostCompositionNote", [
      { id: "openbdap_ssn", label: "OpenBDAP/RGS, Enti del SSN" }
    ], "La composizione esclude il totale per mostrare le principali voci contabili del territorio selezionato.");
    horizontalBar("hiCostCompositionChart", sortDescending(composition, "amount_billion"), "cost_label", "amount_billion", {
      limit: 8,
      color: COLORS[4],
      leftMargin: 230,
      xTitle: "miliardi di euro",
      hovertemplate: "%{y}<br>Importo: %{x:,.2f} mld euro<extra></extra>"
    });

    var displayRows = STATE.costRegion === "Italia" ? rows : rows.filter(function (row) { return row.region === STATE.costRegion; });
    createTable("hiCostTable", displayRows, tableOption("cost_by_region_category").columns, 40);
  }

  function costLabel(costType) {
    var match = toArray(STATE.payload.filters && STATE.payload.filters.cost_types).find(function (row) {
      return row.id === costType;
    });
    return match ? match.label : costType;
  }

  function renderSeries() {
    renderBedsSeries();
    renderPharmaSeries();
  }

  function renderBedsSeries() {
    var region = STATE.bedsSeriesRegion;
    var metric = bedMetricConfig(STATE.bedsSeriesMetric);
    var source = tableRows("beds_by_region_year");
    var rows;
    if (region === "Italia") {
      var grouped = {};
      source.forEach(function (row) {
        grouped[row.year] = (grouped[row.year] || 0) + (toNumber(row[metric.field]) || 0);
      });
      rows = Object.keys(grouped).map(function (year) {
        var item = { year: Number(year) };
        item[metric.field] = grouped[year];
        return item;
      });
    } else {
      rows = source.filter(function (row) { return row.region === region; });
    }
    rows = rows.map(function (row) {
      var copy = Object.assign({}, row);
      copy.selected_value = normalizedValue(row, metric.field, STATE.bedsSeriesRatio);
      return copy;
    });
    rows.sort(function (a, b) { return a.year - b.year; });
    var title = byId("hiBedsSeriesTitle");
    if (title) title.textContent = metric.label + " nel tempo - " + region + " - " + ratioLabel(STATE.bedsSeriesRatio);
    setTag("hiBedsSeriesTag", "2010-2023 - " + ratioLabel(STATE.bedsSeriesRatio));
    setChartCredit("hiBedsSeriesNote", [
      { id: "ministero_posti_letto_2019", label: "Ministero della Salute 2010-2019" },
      { id: "ministero_posti_letto_2023", label: "Ministero della Salute 2020-2023" }
    ], "Serie costruita sui CSV 2010-2019 e sui file annuali 2020, 2021, 2022 e 2023 normalizzati nella pipeline.");
    var valueFormat = STATE.bedsSeriesRatio === "absolute" ? "%{y:,.0f}" : "%{y:,.2f}";
    var years = rows.map(function (row) { return String(row.year); });
    lineChart("hiBedsSeriesChart", [{
      type: "scatter",
      mode: "lines+markers",
      name: metric.label,
      x: years,
      y: rows.map(function (row) { return row.selected_value; }),
      line: { color: COLORS[2], width: 3 },
      marker: { size: 8 },
      hovertemplate: "%{x}<br>" + metric.label + ": " + valueFormat + "<extra></extra>"
    }], {
      yTitle: STATE.bedsSeriesRatio === "absolute" ? metric.xTitle : ratioLabel(STATE.bedsSeriesRatio),
      xAxis: { type: "category", categoryorder: "array", categoryarray: years }
    });
  }

  function renderPharmaSeries() {
    var region = STATE.pharmaRegion;
    var rows = tableRows("pharma_series").filter(function (row) {
      return row.region === region;
    });
    if (STATE.pharmaLabel !== "all") {
      rows = rows.filter(function (row) { return row.cost_label === STATE.pharmaLabel; });
    }
    var labels = unique(rows.map(function (row) { return row.cost_label; }));
    var traces = labels.map(function (label, index) {
      var series = rows.filter(function (row) { return row.cost_label === label; }).sort(function (a, b) { return a.year - b.year; });
      return {
        type: "scatter",
        mode: "lines+markers",
        name: label,
        x: series.map(function (row) { return row.year; }),
        y: series.map(function (row) { return (toNumber(row.amount_eur) || 0) / 1000000000; }),
        line: { color: COLORS[index % COLORS.length], width: 3 },
        marker: { size: 7 },
        hovertemplate: "%{x}<br>%{y:,.2f} mld euro<extra></extra>"
      };
    });
    var title = byId("hiPharmaSeriesTitle");
    if (title) title.textContent = "Spesa farmaceutica - " + region;
    setTag("hiPharmaSeriesTag", "2012-2024 - " + (STATE.pharmaLabel === "all" ? "tutte le voci" : STATE.pharmaLabel));
    setChartCredit("hiPharmaSeriesNote", [
      { id: "openbdap_ssn", label: "OpenBDAP/RGS, Enti del SSN" }
    ], "\"Farmaceutica convenzionata\" e \"Prodotti farmaceutici\" sono canali o voci contabili diversi; il grafico li affianca senza sommarli automaticamente.");
    lineChart("hiPharmaSeriesChart", traces, { yTitle: "miliardi di euro" });
  }

  function renderHospitals() {
    var disciplineSelected = STATE.hospitalDiscipline !== "all";
    var tableName = disciplineSelected ? "hospital_activity_by_discipline" : "hospital_activity_top";
    var rows = tableRows(tableName);
    if (STATE.hospitalRegion !== "Italia") rows = rows.filter(function (row) { return row.region === STATE.hospitalRegion; });
    if (STATE.hospitalProvince !== "all") rows = rows.filter(function (row) { return row.province === STATE.hospitalProvince; });
    if (disciplineSelected) rows = rows.filter(function (row) { return row.discipline === STATE.hospitalDiscipline; });
    rows = sortDescending(rows, "discharges");
    var title = byId("hiHospitalTitle");
    if (title) {
      title.textContent = "Top strutture per dimissioni - " + territoryLabel(STATE.hospitalRegion, STATE.hospitalProvince) + (disciplineSelected ? " - " + STATE.hospitalDiscipline : "");
    }
    setTag("hiHospitalTag", "2022 - " + (disciplineSelected ? STATE.hospitalDiscipline : "tutte le discipline"));
    setChartCredit("hiHospitalNote", [
      { id: "ministero_attivita_reparti", label: "Ministero della Salute, attivita dei reparti" }
    ], "Se scegli una disciplina, la classifica conta le dimissioni di quella disciplina dentro ogni struttura; la numerosita non misura automaticamente qualita o appropriatezza.");
    horizontalBar("hiHospitalChart", rows, "structure", "discharges", {
      limit: 22,
      color: COLORS[6],
      leftMargin: 260,
      labelLength: 42,
      xTitle: "dimissioni",
      hovertemplate: disciplineSelected ? "%{y}<br>" + STATE.hospitalDiscipline + ": %{x:,.0f} dimissioni<extra></extra>" : "%{y}<br>Dimissioni: %{x:,.0f}<extra></extra>"
    });
    createTable("hiHospitalTable", rows, tableOption(tableName).columns, 80);
    renderHospitalDepartments();
  }

  function hospitalDepartmentMetricConfig() {
    var metric = STATE.hospitalDepartmentMetric;
    if (metric === "stay_days") return { label: "Giornate di degenza", field: "stay_days", xTitle: "giornate", color: COLORS[2], format: formatNumber };
    if (metric === "ordinary_beds") return { label: "Posti letto ordinari", field: "ordinary_beds", xTitle: "posti letto ordinari", color: COLORS[3], format: formatNumber };
    if (metric === "avg_los_days") return { label: "Degenza media", field: "avg_los_days", xTitle: "giorni", color: COLORS[4], format: formatDecimal };
    if (metric === "bed_utilization_percent") return { label: "Utilizzo posti letto", field: "bed_utilization_percent", xTitle: "percentuale", color: COLORS[5], format: formatPercent };
    return { label: "Dimissioni", field: "discharges", xTitle: "dimissioni", color: COLORS[1], format: formatNumber };
  }

  function renderHospitalDepartments() {
    var config = hospitalDepartmentMetricConfig();
    var rows = tableRows("hospital_activity_by_discipline").filter(function (row) {
      return structureKey(row) === STATE.hospitalDepartmentStructure;
    }).filter(function (row) {
      return toNumber(row[config.field]) !== null;
    });
    rows = sortDescending(rows, config.field);
    var selected = rows.length ? rows[0] : hospitalDepartmentStructureRows().find(function (row) {
      return row.key === STATE.hospitalDepartmentStructure;
    });
    var structureLabel = selected && selected.structure ? selected.structure : "ospedale selezionato";
    var title = byId("hiHospitalDepartmentTitle");
    if (title) {
      title.textContent = config.label + " per reparto - " + structureLabel;
    }
    setTag("hiHospitalDepartmentTag", "2022 - " + territoryLabel(STATE.hospitalDepartmentRegion, STATE.hospitalDepartmentProvince) + " - top " + chartLimit(STATE.hospitalDepartmentLimit, 20));
    horizontalBar("hiHospitalDepartmentChart", rows, "discipline", config.field, {
      limit: chartLimit(STATE.hospitalDepartmentLimit, 20),
      color: config.color,
      leftMargin: 250,
      labelLength: 42,
      xTitle: config.xTitle,
      format: config.format,
      hovertemplate: "%{y}<br>" + config.label + ": %{text}<extra></extra>"
    });
    createTable("hiHospitalDepartmentTable", rows, tableOption("hospital_activity_by_discipline").columns, chartLimit(STATE.hospitalDepartmentLimit, 20));
    var note = byId("hiHospitalDepartmentNote");
    if (note) setChartCredit("hiHospitalDepartmentNote", [
      { id: "ministero_attivita_reparti", label: "Ministero della Salute, attivita dei reparti" }
    ], "Vista selezionata: " + config.label + " per disciplina/reparto dentro la struttura ospedaliera.");
  }

  function renderMobility() {
    renderMobilitySankey();
    renderMobilityHospitalSankey();
    renderMobilityBalance();
    renderMobilitySeries();
    renderMobilityTable();
  }

  function renderMobilitySankey() {
    var minValue = toNumber(STATE.mobilitySankeyMin) || 0;
    var rows = mobilityRegionalNetLinks(minValue);
    if (!rows.length) {
      showEmptyChart("hiMobilitySankeyChart", "Saldi regionali non disponibili nel payload");
      return;
    }
    var title = byId("hiMobilitySankeyTitle");
    if (title) title.textContent = "Sankey regionale dei saldi netti - 2024";
    var labels = [];
    rows.forEach(function (row) {
      if (labels.indexOf(row.source) === -1) labels.push(row.source);
      if (labels.indexOf(row.target) === -1) labels.push(row.target);
    });
    var source = rows.map(function (row) { return labels.indexOf(row.source); });
    var target = rows.map(function (row) { return labels.indexOf(row.target); });
    var values = rows.map(function (row) { return toNumber(row.value_million_eur) || 0; });
    var linkColors = rows.map(function (row) {
      return row.target_type === "special" ? "rgba(93, 143, 215, .48)" : "rgba(58, 166, 161, .5)";
    });
    var passiveRegions = unique(rows.map(function (row) { return row.source; }));
    var regionTargets = unique(rows.filter(function (row) { return row.target_type === "region"; }).map(function (row) { return row.target; }));
    var specialTargets = unique(rows.filter(function (row) { return row.target_type === "special"; }).map(function (row) { return row.target; }));
    plot("hiMobilitySankeyChart", [{
      type: "sankey",
      arrangement: "snap",
      node: {
        label: labels,
        pad: 14,
        thickness: 16,
        color: labels.map(function (label) {
          if (passiveRegions.indexOf(label) !== -1) return COLORS[5];
          if (regionTargets.indexOf(label) !== -1) return COLORS[2];
          if (specialTargets.indexOf(label) !== -1) return COLORS[1];
          return COLORS[7];
        }),
        line: { color: cssVar("--line", "#303030"), width: 1 }
      },
      link: {
        source: source,
        target: target,
        value: values,
        color: linkColors,
        customdata: rows.map(function (row) {
          var detail = row.target_detail ? "<br>" + row.target_detail : "";
          return row.flow_label + detail + "<br>" + formatMillionEuro(row.value_million_eur);
        }),
        hovertemplate: "%{source.label} -> %{target.label}<br>%{customdata}<extra></extra>"
      }
    }], {
      margin: { t: 12, r: 12, b: 16, l: 12 }
    });
    setTag("hiMobilitySankeyTag", "2024 - soglia " + formatMillionEuro(minValue));
    var note = byId("hiMobilitySankeyNote");
    if (note) setChartCredit("hiMobilitySankeyNote", [
      { id: "corte_conti_mobilita_2024", label: "Corte dei conti, mobilita sanitaria" }
    ], "Le compensazioni economiche derivano dai flussi di prestazioni/pazienti, ma il saldo netto non conserva la coppia origine-destinazione reale; il grafico abbina regioni con saldo passivo a regioni con saldo attivo e soggetti extraregionali per rappresentare i saldi netti 2024. Vaticano indica l'Ospedale Pediatrico Bambino Gesu.");
  }

  function mobilityRegionalNetLinks(minValue) {
    var passive = [];
    var active = [];
    var regionNames = toArray(STATE.payload.filters && STATE.payload.filters.regions);
    tableRows("mobility_balance").forEach(function (row) {
      if (row.year !== 2024) return;
      var value = toNumber(row.balance_million_eur);
      if (value === null || value === 0) return;
      if (value < 0) passive.push({ label: row.region, remaining: Math.abs(value), type: "region" });
      if (value > 0) active.push({ label: row.region, remaining: value, type: "region" });
    });
    tableRows("mobility_sankey").forEach(function (row) {
      if (row.year !== 2024) return;
      if (regionNames.indexOf(row.target) !== -1) return;
      if (!row.flow_type || row.flow_type.indexOf("extraregionale") === -1) return;
      var value = toNumber(row.value_million_eur);
      if (value === null || value <= 0) return;
      active.push({
        label: mobilityTargetLabel(row.target),
        detail: mobilityTargetDetail(row.target),
        remaining: value,
        type: "special"
      });
    });
    passive.sort(function (a, b) { return b.remaining - a.remaining; });
    active.sort(function (a, b) { return b.remaining - a.remaining; });
    var links = [];
    var i = 0;
    var j = 0;
    while (i < passive.length && j < active.length) {
      var value = Math.min(passive[i].remaining, active[j].remaining);
      if (value >= minValue) {
        links.push({
          source: passive[i].label,
          target: active[j].label,
          value_million_eur: roundDisplay(value),
          year: 2024,
          flow_type: "saldo netto regionale",
          source_type: passive[i].type,
          target_type: active[j].type,
          target_detail: active[j].detail,
          flow_label: active[j].type === "special" ? "saldo verso soggetto extraregionale" : "saldo netto verso regione attiva"
        });
      }
      passive[i].remaining -= value;
      active[j].remaining -= value;
      if (passive[i].remaining <= 0.001) i += 1;
      if (active[j].remaining <= 0.001) j += 1;
    }
    return links;
  }

  function roundDisplay(value) {
    return Math.round((toNumber(value) || 0) * 1000) / 1000;
  }

  function renderMobilityHospitalSankey() {
    var limit = chartLimit(STATE.mobilityHospitalLimit, 15);
    var rows = tableRows("hospital_activity_top");
    if (STATE.mobilityHospitalRegion !== "Italia") {
      rows = rows.filter(function (row) { return row.region === STATE.mobilityHospitalRegion; });
    }
    var availableRows = rows;
    rows = sortDescending(availableRows, "discharges").slice(0, limit);
    rows = includeBambinoGesuHospital(rows, availableRows);
    if (!rows.length) {
      showEmptyChart("hiMobilityHospitalChart", "Strutture non disponibili nel payload");
      return;
    }
    var labels = [];
    rows.forEach(function (row) {
      row._source_label = isBambinoGesu(row.structure) ? "Vaticano" : row.region;
      if (labels.indexOf(row._source_label) === -1) labels.push(row._source_label);
      row._hospital_label = compact(row.structure, 44) + " (" + row.province + ")";
      if (labels.indexOf(row._hospital_label) === -1) labels.push(row._hospital_label);
    });
    var title = byId("hiMobilityHospitalTitle");
    if (title) title.textContent = "Da regione a ospedali piu frequentati - " + STATE.mobilityHospitalRegion;
    setTag("hiMobilityHospitalTag", "2022 - top " + limit + " strutture per dimissioni");
    plot("hiMobilityHospitalChart", [{
      type: "sankey",
      arrangement: "snap",
      node: {
        label: labels,
        pad: 14,
        thickness: 16,
        color: labels.map(function (label) {
          if (label === "Vaticano") return COLORS[1];
          return rows.some(function (row) { return row._source_label === label; }) ? COLORS[0] : COLORS[1];
        }),
        line: { color: cssVar("--line", "#303030"), width: 1 }
      },
      link: {
        source: rows.map(function (row) { return labels.indexOf(row._source_label); }),
        target: rows.map(function (row) { return labels.indexOf(row._hospital_label); }),
        value: rows.map(function (row) { return toNumber(row.discharges) || 0; }),
        color: rows.map(function () { return "rgba(93, 143, 215, .45)"; }),
        customdata: rows.map(function (row) {
          var territory = isBambinoGesu(row.structure) ? "Vaticano / extraterritoriale; classificazione fonte: " + row.region + ", " + row.province : row.region + ", " + row.province;
          return row.structure + "<br>" + territory + "<br>Dimissioni: " + formatNumber(row.discharges);
        }),
        hovertemplate: "%{customdata}<extra></extra>"
      }
    }], {
      margin: { t: 12, r: 12, b: 16, l: 12 }
    });
    setChartCredit("hiMobilityHospitalNote", [
      { id: "ministero_attivita_reparti", label: "Ministero della Salute, attivita dei reparti" }
    ], "Il grafico mostra la regione di erogazione e le strutture con piu dimissioni, non la residenza dei pazienti; il Bambino Gesu e evidenziato come soggetto extraterritoriale.");
  }

  function includeBambinoGesuHospital(rows, availableRows) {
    if (STATE.mobilityHospitalRegion !== "Italia" && STATE.mobilityHospitalRegion !== "Lazio") return rows;
    var bambino = toArray(availableRows).find(function (row) {
      return isBambinoGesu(row.structure);
    });
    if (!bambino) return rows;
    var alreadyIncluded = rows.some(function (row) {
      return row.structure_code === bambino.structure_code;
    });
    return alreadyIncluded ? rows : rows.concat([bambino]);
  }

  function renderMobilityBalance() {
    var config = mobilityMetricConfig();
    var rows = tableRows("regional_summary").filter(function (row) {
      return toNumber(row[config.field]) !== null;
    }).sort(function (a, b) {
      return (toNumber(b[config.field]) || 0) - (toNumber(a[config.field]) || 0);
    });
    var title = byId("hiMobilityBalanceTitle");
    if (title) title.textContent = "Saldo mobilita per regione - " + config.label;
    setTag("hiMobilityBalanceTag", "2024 - " + config.xTitle);
    var mobilitySources = [{ id: "corte_conti_mobilita_2024", label: "Corte dei conti, mobilita sanitaria" }];
    mobilitySources = mobilitySources.concat(denominatorSources(STATE.mobilityRatio));
    setChartCredit("hiMobilityBalanceNote", mobilitySources, "Valori positivi indicano attrazione economica netta; valori negativi indicano fuga economica netta. Il rapporto selezionato serve a confrontare regioni di dimensione diversa.");
    horizontalBar("hiMobilityBalanceChart", rows, "region", config.field, {
      limit: 21,
      highlight: STATE.mobilitySeriesRegion,
      leftMargin: 150,
      xTitle: config.xTitle,
      format: config.format,
      colorFor: function (row) { return toNumber(row[config.field]) < 0 ? COLORS[5] : COLORS[2]; },
      hovertemplate: "%{y}<br>Saldo: %{text}<extra></extra>"
    });
  }

  function mobilityMetricConfig() {
    var mode = STATE.mobilityRatio;
    if (mode === "population_total") return { label: "per abitante", field: "mobility_balance_per_capita_eur", xTitle: "euro per abitante", format: formatEuroDecimal };
    if (mode === "population_65_plus") return { label: "per residente 65+", field: "mobility_balance_per_over65_eur", xTitle: "euro per residente 65+", format: formatEuroDecimal };
    if (mode === "population_75_plus") return { label: "per residente 75+", field: "mobility_balance_per_over75_eur", xTitle: "euro per residente 75+", format: formatEuroDecimal };
    if (mode === "gdp") return { label: "in rapporto al PIL", field: "mobility_balance_percent_gdp", xTitle: "% del PIL", format: formatPercent };
    return { label: "2024", field: "mobility_balance_million_eur", xTitle: "milioni di euro", format: formatMillionEuro };
  }

  function renderMobilitySeries() {
    var config = mobilitySeriesMetricConfig();
    var source = tableRows("mobility_balance").filter(function (row) {
      return typeof row.year === "number";
    });
    var rows;
    var title = byId("hiMobilitySeriesTitle");
    if (STATE.mobilitySeriesRegion === "Italia") {
      var grouped = {};
      source.forEach(function (row) {
        grouped[row.year] = (grouped[row.year] || 0) + (toNumber(row[config.sourceField]) || 0);
      });
      rows = Object.keys(grouped).map(function (year) {
        var item = { year: Number(year) };
        item[config.sourceField] = grouped[year];
        return item;
      });
      if (title) title.textContent = "Serie storica del saldo - Italia - " + config.xTitle;
    } else {
      rows = source.filter(function (row) { return row.region === STATE.mobilitySeriesRegion; });
      if (title) title.textContent = "Serie storica del saldo - " + STATE.mobilitySeriesRegion + " - " + config.xTitle;
    }
    setTag("hiMobilitySeriesTag", "2014-2024 - " + config.xTitle);
    var mobilitySeriesSources = [{ id: "corte_conti_mobilita_2024", label: "Corte dei conti, mobilita sanitaria" }];
    mobilitySeriesSources = mobilitySeriesSources.concat(denominatorSources(STATE.mobilitySeriesRatio));
    setChartCredit("hiMobilitySeriesNote", mobilitySeriesSources, "La serie aiuta a distinguere oscillazioni annuali e persistenza del turismo sanitario economico; i valori sono saldi economici netti, non conteggi di pazienti.");
    rows.sort(function (a, b) { return a.year - b.year; });
    lineChart("hiMobilitySeriesChart", [{
      type: "scatter",
      mode: "lines+markers",
      name: STATE.mobilitySeriesRegion,
      x: rows.map(function (row) { return row.year; }),
      y: rows.map(function (row) { return toNumber(row[config.sourceField]) || 0; }),
      line: { color: STATE.mobilitySeriesRegion === "Italia" ? COLORS[1] : COLORS[0], width: 3 },
      marker: { size: 8 },
      hovertemplate: "%{x}<br>Saldo: %{y:,.2f}<extra></extra>"
    }], { yTitle: config.xTitle });
  }

  function mobilitySeriesMetricConfig() {
    var mode = STATE.mobilitySeriesRatio;
    if (mode === "population_total") return { sourceField: "balance_per_capita_eur", xTitle: "euro per abitante" };
    if (mode === "population_65_plus") return { sourceField: "balance_per_over65_eur", xTitle: "euro per residente 65+" };
    if (mode === "population_75_plus") return { sourceField: "balance_per_over75_eur", xTitle: "euro per residente 75+" };
    if (mode === "gdp") return { sourceField: "balance_percent_gdp", xTitle: "% del PIL" };
    return { sourceField: "balance_million_eur", xTitle: "milioni di euro" };
  }

  function renderMobilityTable() {
    var rows = tableRows("mobility_balance").filter(function (row) {
      if (row.year !== 2024) return false;
      return STATE.mobilitySeriesRegion === "Italia" || row.region === STATE.mobilitySeriesRegion;
    }).sort(function (a, b) {
      return (toNumber(b.balance_million_eur) || 0) - (toNumber(a.balance_million_eur) || 0);
    });
    createTable("hiMobilityTable", rows, tableOption("mobility_balance").columns, 40);
  }

  function renderMethod() {
    renderList("hiMethodNotes", STATE.payload.methodology && STATE.payload.methodology.notes);
    renderList("hiMethodWarnings", STATE.payload.methodology && STATE.payload.methodology.comparability_warnings);
    renderDenominatorRules();
    createTable("hiDefinitionsTable", tableRows("definitions"), tableOption("definitions").columns, 30);
    createTable("hiSourcesTable", tableRows("sources"), tableOption("sources").columns, 30);
  }

  function renderList(id, items) {
    var node = byId(id);
    clear(node);
    toArray(items).forEach(function (text) {
      node.appendChild(create("li", "", text));
    });
  }

  function renderDenominatorRules() {
    var container = byId("hiDenominatorRules");
    clear(container);
    toArray(STATE.payload.methodology && STATE.payload.methodology.denominator_rules).forEach(function (rule) {
      var item = create("div", "hi-coverage-item");
      item.appendChild(create("strong", "", rule.label));
      item.appendChild(create("span", "", rule.keywords && rule.keywords.length ? "Parole chiave: " + rule.keywords.join(", ") : "Regola generale se non ci sono parole chiave cliniche."));
      item.appendChild(create("em", "", denominatorLabel(rule.denominator)));
      container.appendChild(item);
    });
  }

  function unique(values) {
    var seen = {};
    return values.filter(function (value) {
      if (!value || seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function filteredByRegion(rows) {
    if (STATE.region === "Italia") return toArray(rows);
    return toArray(rows).filter(function (row) {
      return !row.region || row.region === STATE.region;
    });
  }

  function rowText(row) {
    return Object.keys(row || {}).map(function (key) { return asText(formatCell(key, row[key]), ""); }).join(" ").toLowerCase();
  }

  function rowMatchesExplorer(row) {
    if (row.region && STATE.tableRegion !== "Italia" && row.region !== STATE.tableRegion) return false;
    if (!row.region && row.territory && STATE.tableRegion !== "Italia" && row.territory !== STATE.tableRegion) return false;
    if (row.province && STATE.tableProvince !== "all" && row.province !== STATE.tableProvince) return false;
    if (row.discipline && STATE.tableDiscipline !== "all" && row.discipline !== STATE.tableDiscipline) return false;
    if (row.cost_type && row.cost_type !== STATE.costType && STATE.table.indexOf("cost") !== -1) return false;
    var term = STATE.search.trim().toLowerCase();
    return !term || rowText(row).indexOf(term) !== -1;
  }

  function filteredTableRows(tableName) {
    return tableRows(tableName).filter(rowMatchesExplorer);
  }

  function tableOption(id) {
    for (var i = 0; i < TABLE_OPTIONS.length; i += 1) {
      if (TABLE_OPTIONS[i].id === id) return TABLE_OPTIONS[i];
    }
    return { id: id, label: id, columns: null };
  }

  function createTable(containerId, tableRowsValue, columns, limit) {
    var container = byId(containerId);
    if (!container) return;
    clear(container);
    var rows = toArray(tableRowsValue).slice(0, limit || 120);
    columns = columns && columns.length ? columns : inferColumns(rows);

    var table = create("table", "hi-table");
    var thead = document.createElement("thead");
    var headerRow = document.createElement("tr");
    columns.forEach(function (column) {
      headerRow.appendChild(create("th", "", column[1] || column[0]));
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    if (!rows.length) {
      var emptyRow = document.createElement("tr");
      var emptyCell = create("td", "", "Nessun dato disponibile");
      emptyCell.colSpan = Math.max(1, columns.length);
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
    } else {
      rows.forEach(function (row) {
        var tr = document.createElement("tr");
        columns.forEach(function (column) {
          var key = column[0];
          var td = document.createElement("td");
          var value = row[key];
          if (key === "url" && /^https?:\/\//i.test(asText(value, ""))) {
            var link = document.createElement("a");
            link.href = value;
            link.target = "_blank";
            link.rel = "noopener";
            link.textContent = "pagina ufficiale";
            td.appendChild(link);
          } else if (key === "service_id") {
            td.textContent = compact(waitingServiceLabel(value), 96);
          } else if (key === "region" || key === "discipline" || key === "structure" || key === "indicator" || key === "name" || key === "provider") {
            var strong = document.createElement("strong");
            strong.textContent = compact(value, key === "structure" ? 72 : 56);
            td.appendChild(strong);
          } else {
            td.textContent = compact(formatCell(key, value), 96);
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function inferColumns(rows) {
    var first = rows && rows.length ? rows[0] : {};
    return Object.keys(first).slice(0, 8).map(function (key) { return [key, key.replace(/_/g, " ")]; });
  }

  function renderExplorer() {
    var option = tableOption(STATE.table);
    var rows = filteredTableRows(STATE.table);
    var title = byId("hiTableTitle");
    var count = byId("hiTableCount");
    if (title) title.textContent = option.label;
    if (count) count.textContent = formatNumber(rows.length) + " righe";
    createTable("hiTableExplorer", rows, option.columns, 250);
  }

  function renderDynamic() {
    var filters = STATE.payload.filters || {};
    var regionOptions = [{ value: "Italia", label: "Italia" }].concat(toArray(filters.regions).map(function (region) {
      return { value: region, label: region };
    }));
    refreshProvinceFilters();
    refreshWaitingFilters(regionOptions);
    refreshHealthFilters();
    refreshMortalityFilters();
    refreshDischargeStructureFilter();
    refreshPsStructureFilter();
    refreshHospitalDepartmentStructureFilter();
    renderNationalCharts();
    renderPsEmergency();
    renderWaitingLists();
    renderHealth();
    renderMortality();
    renderRegionalRank();
    renderRegionProfile();
    renderRegionalSummaryTable();
    renderDiscipline();
    renderCosts();
    renderSeries();
    renderHospitals();
    renderMobility();
    renderExplorer();
    refreshSiteLanguage();
  }

  function refreshSiteLanguage() {
    if (!window.SiteLanguage || typeof window.SiteLanguage.refresh !== "function") return;
    window.setTimeout(function () {
      window.SiteLanguage.refresh(document.body);
    }, 0);
  }

  function renderAll() {
    setupFilters();
    renderKpis();
    renderDynamic();
    renderMethod();
  }

  function fetchJson(url) {
    return fetch(url, { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    });
  }

  function loadPayload(index) {
    index = index || 0;
    if (index >= DATA_SOURCES.length) {
      setStatus("Dati non disponibili. La dashboard si aggiornera quando il payload sara pubblicato.", "error");
      return;
    }
    fetchJson(DATA_SOURCES[index]).then(function (payload) {
      STATE.payload = payload;
      var generated = payload.meta && payload.meta.generated_at ? payload.meta.generated_at.replace("T", " ").replace("+00:00", " UTC") : "";
      setStatus("Dati caricati: " + generated);
      renderAll();
    }).catch(function () {
      loadPayload(index + 1);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindControls();
    loadPayload(0);
  });
})();
