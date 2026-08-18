(function () {
  "use strict";

  var DATA_SOURCES = [
    "../../data/sanita-italia/dashboard.json?v=20260818-pnla-box-3",
    "https://data.nazarenolecis.com/sanita-italia/dashboard.json?v=20260818-pnla-box-3",
    "https://raw.githubusercontent.com/NazarenoLecis/nazarenolecis-data-pipeline/main/publish/sanita-italia/dashboard.json"
  ];

  var STATE = {
    payload: null,
    payloadSource: "",
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
    psRegionBoxLayout: "level_region",
    psRegionBoxTriage: "all",
    psRegionBoxLevel: "all",
    psRegionBoxMetric: "mean_wait_minutes",
    psRegionBoxFocus: "Italia",
    psStructureRegion: "Italia",
    psStructureProvince: "all",
    psStructure: "all",
    psStructureTriage: "verde",
    psRegionLevel: "all",
    psStructureLevel: "all",
    psStructureLimit: "20",
    psStructureBoxLayout: "level_structure",
    waitingYear: "latest",
    waitingServiceType: "all",
    waitingService: "all",
    waitingPriority: "all",
    waitingRegime: "institutional",
    waitingAccess: "first",
    waitingMetric: "mean_first_available_days",
    waitingRegionFocus: "Italia",
    waitingQualityYear: "latest",
    waitingQualityServiceType: "all",
    waitingQualityService: "all",
    waitingQualityPriority: "B - Breve (10 giorni)",
    waitingQualityRegime: "institutional",
    waitingQualityAccess: "first",
    waitingQualityMetric: "mean_first_available_days",
    waitingQualityFocus: "Sardegna",
    waitingQualityLayout: "region_service_type",
    waitingQualityGranularity: "service_type",
    waitingQualityLimit: "20",
    waitingQualityStructureRegion: "Sardegna",
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
    waitingStructureRegion: "Sardegna",
    waitingStructureServiceType: "all",
    waitingStructureService: "33 - ESOFAGOGASTRODUODENOSCOPIA [EGDS]",
    waitingStructurePriority: "B - Breve (10 giorni)",
    waitingStructureMetric: "mean_first_available_days",
    waitingStructureLimit: "20",
    waitingStructureFocus: "all",
    waitingStructureBoxLayout: "service_structure",
    waitingStructureBoxRegion: "Sardegna",
    waitingStructureBoxServiceType: "all",
    waitingStructureBoxService: "all",
    waitingStructureBoxPriority: "B - Breve (10 giorni)",
    waitingStructureBoxMetric: "mean_first_available_days",
    waitingStructureBoxLimit: "20",
    waitingCompareRegionA: "Sardegna",
    waitingCompareStructureA: "200904",
    waitingCompareRegionB: "Emilia-Romagna",
    waitingCompareStructureB: "505001",
    waitingCompareServiceType: "all",
    waitingCompareService: "33 - ESOFAGOGASTRODUODENOSCOPIA [EGDS]",
    waitingComparePriority: "B - Breve (10 giorni)",
    waitingCompareMetric: "mean_first_available_days",
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
    mortalityQualityLayout: "region_cause",
    mortalityQualityGroup: "cancer_detail",
    mortalityQualityCause: "all",
    mortalityQualityYear: "latest",
    mortalityQualityFocus: "Sardegna",
    mortalityQualityLimit: "20",
    pneOutcomeIndicator: "727",
    pneOutcomeRegion: "Italia",
    pneOutcomeMetric: "success_rate_adjusted_percent",
    pneOutcomeMinCases: "50",
    pneOutcomeLimit: "20",
    pneOutcomeFocusStructure: "all",
    pneQualityLayout: "region_structure",
    pneQualityIndicator: "727",
    pneQualityRegion: "Italia",
    pneQualityMetric: "success_rate_adjusted_percent",
    pneQualityMinCases: "50",
    pneQualityLimit: "20",
    pneQualityFocusStructure: "all",
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
    hospitalProfileRegion: "Sardegna",
    hospitalProfileProvince: "all",
    hospitalProfileStructure: "",
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

  var WAITING_STRUCTURE_CACHE = {};
  var WAITING_STRUCTURE_LOADING = {};
  var TABLE_EXPANDED = {};

  var URL_STATE_KEYS = [
    "region", "discipline", "metric", "ratioMode",
    "nationalActivityRegion", "nationalActivityProvince", "nationalActivityMetric", "nationalActivityRatio", "nationalActivityLimit",
    "nationalBedsRegion", "nationalBedsYear", "nationalBedsMetric", "nationalBedsRatio", "nationalBedsLimit",
    "dischargeRegion", "dischargeProvince", "dischargeStructure", "dischargeDiscipline", "dischargeDisciplineMetric",
    "dischargeHospitalRegion", "dischargeHospitalProvince", "dischargeHospitalCategory", "dischargeHospitalLimit",
    "psRegion", "psRegionTriage", "psRegionLevel", "psRegionMetric", "psRegionBoxLayout", "psRegionBoxTriage", "psRegionBoxLevel", "psRegionBoxMetric", "psRegionBoxFocus", "psStructureRegion", "psStructureProvince", "psStructure", "psStructureTriage", "psStructureLevel", "psStructureLimit", "psStructureBoxLayout",
    "waitingYear", "waitingServiceType", "waitingService", "waitingPriority", "waitingRegime", "waitingAccess", "waitingMetric", "waitingRegionFocus",
    "waitingQualityYear", "waitingQualityServiceType", "waitingQualityService", "waitingQualityPriority", "waitingQualityRegime", "waitingQualityAccess", "waitingQualityMetric", "waitingQualityFocus", "waitingQualityLayout", "waitingQualityGranularity", "waitingQualityLimit", "waitingQualityStructureRegion",
    "waitingServiceRegion", "waitingServiceYear", "waitingServiceType2", "waitingServicePriority", "waitingServiceRegime", "waitingServiceAccess", "waitingServiceMetric", "waitingServiceLimit",
    "waitingTrendRegion", "waitingTrendService", "waitingTrendPriority", "waitingTrendMetric",
    "waitingStructureRegion", "waitingStructureServiceType", "waitingStructureService", "waitingStructurePriority", "waitingStructureMetric", "waitingStructureLimit", "waitingStructureFocus",
    "waitingStructureBoxLayout", "waitingStructureBoxRegion", "waitingStructureBoxServiceType", "waitingStructureBoxService", "waitingStructureBoxPriority", "waitingStructureBoxMetric", "waitingStructureBoxLimit",
    "waitingCompareRegionA", "waitingCompareStructureA", "waitingCompareRegionB", "waitingCompareStructureB", "waitingCompareServiceType", "waitingCompareService", "waitingComparePriority", "waitingCompareMetric",
    "healthGroup", "healthIndicator", "healthYear", "healthTerritoryFocus", "healthProfileTerritory", "healthProfileGroup", "healthProfileYear", "healthTrendTerritory", "healthTrendGroup", "healthTrendIndicator",
    "cancerRecentMetric", "cancerRecentSite",
    "mortalityGroup", "mortalityIndicator", "mortalityYear", "mortalityTerritoryFocus", "mortalityProfileTerritory", "mortalityProfileGroup", "mortalityProfileYear", "mortalityTrendTerritory", "mortalityTrendGroup", "mortalityTrendIndicator",
    "mortalityDetailGroup", "mortalityDetailCause", "mortalityDetailYear", "mortalityDetailTerritoryFocus", "mortalityDetailTrendTerritory", "mortalityDetailTrendGroup", "mortalityDetailTrendCause",
    "mortalityQualityLayout", "mortalityQualityGroup", "mortalityQualityCause", "mortalityQualityYear", "mortalityQualityFocus", "mortalityQualityLimit",
    "pneOutcomeIndicator", "pneOutcomeRegion", "pneOutcomeMetric", "pneOutcomeMinCases", "pneOutcomeLimit", "pneOutcomeFocusStructure",
    "pneQualityLayout", "pneQualityIndicator", "pneQualityRegion", "pneQualityMetric", "pneQualityMinCases", "pneQualityLimit", "pneQualityFocusStructure",
    "disciplineRegion", "disciplineProvince", "disciplineMetric", "denominator",
    "costRegion", "costRatio", "costType", "costCompositionRegion", "bedsSeriesRegion", "bedsSeriesMetric", "bedsSeriesRatio", "pharmaRegion", "pharmaLabel",
    "hospitalRegion", "hospitalProvince", "hospitalDiscipline", "hospitalDepartmentRegion", "hospitalDepartmentProvince", "hospitalDepartmentStructure", "hospitalDepartmentMetric", "hospitalDepartmentLimit",
    "hospitalProfileRegion", "hospitalProfileProvince", "hospitalProfileStructure",
    "mobilityRatio", "mobilitySeriesRegion", "mobilitySeriesRatio", "mobilityHospitalRegion", "mobilityHospitalLimit", "mobilitySankeyMin",
    "tableRegion", "tableProvince", "tableDiscipline", "table"
  ];

  var DEFAULT_FILTER_STATE = {};
  URL_STATE_KEYS.forEach(function (key) {
    DEFAULT_FILTER_STATE[key] = STATE[key];
  });

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
      id: "pne_hospital_outcomes",
      label: "Esiti ospedalieri PNE",
      columns: [
        ["edition", "Edizione"],
        ["indicator_code", "Indicatore"],
        ["indicator_short_label", "Esito"],
        ["region", "Regione"],
        ["province", "Provincia"],
        ["city", "Comune"],
        ["structure", "Struttura"],
        ["year", "Anno"],
        ["cases", "Casi/coorte"],
        ["events", "Eventi"],
        ["mortality_raw_percent", "Mortalita grezza"],
        ["mortality_adjusted_percent", "Mortalita aggiustata"],
        ["success_rate_adjusted_percent", "Successo aggiustato"],
        ["annual_volume_latest", "Volume annuo"],
        ["annual_volume_latest_year", "Anno volume"]
      ]
    },
    {
      id: "pne_hospital_outcome_volume_trend",
      label: "Storico volumi PNE",
      columns: [
        ["indicator_code", "Indicatore"],
        ["indicator_short_label", "Prestazione"],
        ["region", "Regione"],
        ["province", "Provincia"],
        ["city", "Comune"],
        ["structure", "Struttura"],
        ["year", "Anno"],
        ["annual_volume", "Ricoveri"]
      ]
    },
    {
      id: "pne_outcome_indicators",
      label: "Indicatori esiti PNE",
      columns: [
        ["indicator_code", "Codice"],
        ["indicator_label", "Indicatore"],
        ["edition", "Edizione"],
        ["source_url", "Scheda PNE"],
        ["protocol_url", "Protocollo"],
        ["rationale_url", "Razionale"]
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

  function applyUrlFilters() {
    if (!window.URLSearchParams) return;
    var params = new URLSearchParams(window.location.search);
    URL_STATE_KEYS.forEach(function (key) {
      if (params.has(key)) STATE[key] = params.get(key);
    });
  }

  function syncFilterUrl() {
    if (!window.history || !window.URL) return;
    var url = new URL(window.location.href);
    URL_STATE_KEYS.forEach(function (key) {
      url.searchParams.delete(key);
    });
    URL_STATE_KEYS.forEach(function (key) {
      var value = STATE[key];
      if (value === undefined || value === null || value === "") return;
      if (String(value) === String(DEFAULT_FILTER_STATE[key])) return;
      url.searchParams.set(key, value);
    });
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }

  function copyFilterUrl() {
    syncFilterUrl();
    var button = byId("hiShareFiltersButton");
    var url = window.location.href;
    function done(ok) {
      if (!button) return;
      button.textContent = ok ? "Link copiato" : "Link pronto";
      window.setTimeout(function () {
        button.textContent = "Copia link con filtri";
      }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { done(true); }).catch(function () { done(false); });
      return;
    }
    window.prompt("Copia il link con i filtri", url);
    done(false);
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

  function formatSignedDecimal(value) {
    var number = toNumber(value);
    if (number === null) return MISSING;
    var formatted = Math.abs(number).toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return (number > 0 ? "+" : (number < 0 ? "-" : "")) + formatted;
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
    if (column === "quality_score" || column === "z_score" || column === "national_sd") return formatSignedDecimal(value);
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

  function normalizeLabel(value) {
    return asText(value, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function clear(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function currentLanguageIsEnglish() {
    try {
      var params = new URLSearchParams(window.location.search);
      if (params.get("lang") === "en") return true;
      if (params.get("lang") === "it") return false;
    } catch (error) {}
    try {
      return localStorage.getItem("siteLanguage") === "en";
    } catch (error) {}
    return document.documentElement.lang === "en";
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
    refreshProvinceFilter("hiHospitalProfileProvinceFilter", "hospitalProfileProvince", STATE.hospitalProfileRegion);
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

  function psLevelOrder(value) {
    if (value === "PRONTO SOCCORSO") return 1;
    if (value === "DEA DI 1° LIVELLO") return 2;
    if (value === "DEA DI 2° LIVELLO") return 3;
    return 99;
  }

  function psLevelOptions() {
    var levels = unique(tableRows("ps_structures").map(function (row) {
      return row.emergency_level;
    }).filter(Boolean)).sort(function (a, b) {
      return psLevelOrder(a) - psLevelOrder(b) || a.localeCompare(b);
    });
    return [{ value: "all", label: "Tutti i livelli" }].concat(levels.map(function (level) {
      return { value: level, label: level };
    }));
  }

  function psLevelText(level) {
    return level && level !== "all" ? level : "tutti i livelli PS/DEA";
  }

  function psLevelMatches(row, level) {
    return !level || level === "all" || row.emergency_level === level;
  }

  function refreshPsLevelFilter(id, stateKey) {
    var options = psLevelOptions();
    if (!options.some(function (option) { return option.value === STATE[stateKey]; })) {
      STATE[stateKey] = "all";
    }
    fillSelect(id, options, STATE[stateKey]);
  }

  function psStructureKey(row) {
    return asText(row.structure_code || row.institute_code || (asText(row.region) + "|" + asText(row.structure)), "");
  }

  function psStructureRows() {
    return tableRows("ps_structures").filter(function (row) {
      if (STATE.psStructureRegion !== "Italia" && row.region !== STATE.psStructureRegion) return false;
      if (STATE.psStructureProvince !== "all" && row.province !== STATE.psStructureProvince) return false;
      if (!psLevelMatches(row, STATE.psStructureLevel)) return false;
      return true;
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

  function waitingStructureFiles() {
    return toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.waiting_structure_files);
  }

  function waitingStructureFile(region) {
    return waitingStructureFiles().find(function (row) {
      return row.region === region;
    }) || null;
  }

  function waitingStructureDataSources(path) {
    return [
      "../../data/sanita-italia/" + path + "?v=20260817-ps-level-1",
      "https://data.nazarenolecis.com/sanita-italia/" + path + "?v=20260817-ps-level-1",
      "https://raw.githubusercontent.com/NazarenoLecis/nazarenolecis-data-pipeline/main/publish/sanita-italia/" + path
    ];
  }

  function fetchWaitingStructureSource(sources, index) {
    index = index || 0;
    if (index >= sources.length) return Promise.reject(new Error("PNLA structure file not available"));
    return fetchJson(sources[index]).catch(function () {
      return fetchWaitingStructureSource(sources, index + 1);
    });
  }

  function loadWaitingStructureRegion(region) {
    if (!region) return Promise.resolve({ meta: {}, rows: [] });
    if (WAITING_STRUCTURE_CACHE[region]) return Promise.resolve(WAITING_STRUCTURE_CACHE[region]);
    if (WAITING_STRUCTURE_LOADING[region]) return WAITING_STRUCTURE_LOADING[region];
    var file = waitingStructureFile(region);
    if (!file || !file.path) {
      WAITING_STRUCTURE_CACHE[region] = { meta: { region: region }, rows: [] };
      return Promise.resolve(WAITING_STRUCTURE_CACHE[region]);
    }
    WAITING_STRUCTURE_LOADING[region] = fetchWaitingStructureSource(waitingStructureDataSources(file.path), 0).then(function (payload) {
      WAITING_STRUCTURE_CACHE[region] = {
        meta: payload.meta || { region: region, year: file.year },
        rows: toArray(payload.rows)
      };
      delete WAITING_STRUCTURE_LOADING[region];
      return WAITING_STRUCTURE_CACHE[region];
    }).catch(function (error) {
      WAITING_STRUCTURE_CACHE[region] = {
        meta: { region: region, year: file.year, error: error && error.message ? error.message : "Errore caricamento" },
        rows: []
      };
      delete WAITING_STRUCTURE_LOADING[region];
      return WAITING_STRUCTURE_CACHE[region];
    });
    return WAITING_STRUCTURE_LOADING[region];
  }

  function waitingStructureRows() {
    var cached = WAITING_STRUCTURE_CACHE[STATE.waitingStructureRegion];
    return cached ? toArray(cached.rows) : [];
  }

  function waitingStructureRowsForRegion(region) {
    var cached = WAITING_STRUCTURE_CACHE[region];
    return cached ? toArray(cached.rows) : [];
  }

  function waitingStructureYearForRegion(region) {
    var cached = WAITING_STRUCTURE_CACHE[region];
    var file = waitingStructureFile(region) || {};
    return cached && cached.meta && cached.meta.year ? cached.meta.year : file.year;
  }

  function waitingStructureMeta() {
    var cached = WAITING_STRUCTURE_CACHE[STATE.waitingStructureRegion];
    var file = waitingStructureFile(STATE.waitingStructureRegion) || {};
    return cached && cached.meta ? cached.meta : { region: STATE.waitingStructureRegion, year: file.year };
  }

  function waitingStructureYear() {
    var meta = waitingStructureMeta();
    return meta.year || (waitingStructureFile(STATE.waitingStructureRegion) || {}).year || waitingLatestYear();
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

  function waitingStructureRegionOptions() {
    var rows = waitingStructureFiles();
    if (!rows.length) {
      rows = toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.regions).map(function (region) {
        return { region: region };
      });
    }
    return rows.map(function (row) {
      return { value: row.region, label: row.region };
    });
  }

  function waitingStructureServiceOptions(serviceType) {
    var rows = waitingStructureRows();
    if (!rows.length) return waitingServiceOptions(serviceType, false);
    var serviceMap = {};
    rows.forEach(function (row) {
      if (serviceType !== "all" && row.service_type !== serviceType) return;
      if (!row.service_id || serviceMap[row.service_id]) return;
      serviceMap[row.service_id] = { value: row.service_id, label: compact(row.service, 70), service_type: row.service_type };
    });
    return Object.keys(serviceMap).map(function (key) {
      return serviceMap[key];
    }).sort(function (a, b) {
      return (a.service_type || "").localeCompare(b.service_type || "") || a.label.localeCompare(b.label);
    });
  }

  function defaultWaitingStructureService(options) {
    var preferred = [
      "33 - ESOFAGOGASTRODUODENOSCOPIA [EGDS]",
      "45 - TC ADDOME",
      "49 - TC DEL TORACE"
    ];
    for (var index = 0; index < preferred.length; index += 1) {
      if (options.some(function (option) { return option.value === preferred[index]; })) return preferred[index];
    }
    return options[0] ? options[0].value : "";
  }

  function refreshWaitingServiceFilter(id, stateKey, serviceType, includeAll) {
    var options = waitingServiceOptions(serviceType, includeAll);
    if (!options.some(function (option) { return option.value === STATE[stateKey]; })) {
      STATE[stateKey] = includeAll ? "all" : (options[0] ? options[0].value : "all");
    }
    fillSelect(id, options, STATE[stateKey]);
  }

  function refreshWaitingStructureServiceFilter() {
    var options = waitingStructureServiceOptions(STATE.waitingStructureServiceType);
    var node = byId("hiWaitingStructureServiceFilter");
    if (!options.length) {
      STATE.waitingStructureService = "";
      fillSelect("hiWaitingStructureServiceFilter", [{ value: "", label: "Nessuna prestazione disponibile" }], "");
      if (node) node.disabled = true;
      return;
    }
    if (!options.some(function (option) { return option.value === STATE.waitingStructureService; })) {
      STATE.waitingStructureService = defaultWaitingStructureService(options);
    }
    fillSelect("hiWaitingStructureServiceFilter", options, STATE.waitingStructureService);
    if (node) node.disabled = false;
  }

  function waitingStructurePriorityOptions() {
    var loadedRows = waitingStructureRows();
    var baseOptions = waitingPriorityOptions(false);
    if (!loadedRows.length) return [{ value: "all", label: "Tutte" }].concat(baseOptions);
    var available = {};
    loadedRows.forEach(function (row) {
      if (STATE.waitingStructureServiceType !== "all" && row.service_type !== STATE.waitingStructureServiceType) return;
      if (STATE.waitingStructureService && row.service_id !== STATE.waitingStructureService) return;
      if (row.priority_label) available[row.priority_label] = true;
    });
    var options = baseOptions.filter(function (option) {
      return available[option.value];
    });
    return [{ value: "all", label: "Tutte" }].concat(options);
  }

  function defaultWaitingStructurePriority(options) {
    var preferred = "B - Breve (10 giorni)";
    if (options.some(function (option) { return option.value === preferred; })) return preferred;
    return options[0] ? options[0].value : "all";
  }

  function refreshWaitingStructurePriorityFilter() {
    var options = waitingStructurePriorityOptions();
    if (!options.some(function (option) { return option.value === STATE.waitingStructurePriority; })) {
      STATE.waitingStructurePriority = defaultWaitingStructurePriority(options);
    }
    fillSelect("hiWaitingStructurePriorityFilter", options, STATE.waitingStructurePriority);
  }

  function waitingStructureFocusOptions() {
    var rows = filterWaitingStructureRows();
    var grouped = {};
    rows.forEach(function (row) {
      if (!row.structure_code || grouped[row.structure_code]) return;
      grouped[row.structure_code] = {
        value: row.structure_code,
        label: compact(row.structure, 70),
        structure: row.structure
      };
    });
    var options = Object.keys(grouped).map(function (key) {
      return grouped[key];
    }).sort(function (a, b) {
      return a.structure.localeCompare(b.structure);
    });
    return [{ value: "all", label: "Tutte" }].concat(options);
  }

  function refreshWaitingStructureFocusFilter() {
    var options = waitingStructureFocusOptions();
    if (!options.some(function (option) { return option.value === STATE.waitingStructureFocus; })) {
      STATE.waitingStructureFocus = "all";
    }
    fillSelect("hiWaitingStructureFocusFilter", options, STATE.waitingStructureFocus);
  }

  function waitingStructureBoxRegionOptions() {
    return [{ value: "all", label: "Tutte le regioni" }].concat(waitingStructureRegionOptions());
  }

  function refreshWaitingStructureBoxServiceFilter() {
    var options = waitingServiceOptions(STATE.waitingStructureBoxServiceType, true);
    if (!options.some(function (option) { return option.value === STATE.waitingStructureBoxService; })) {
      STATE.waitingStructureBoxService = "all";
    }
    fillSelect("hiWaitingStructureBoxServiceFilter", options, STATE.waitingStructureBoxService);
  }

  function refreshWaitingStructureBoxFilters() {
    var regionOptions = waitingStructureBoxRegionOptions();
    if (!regionOptions.some(function (option) { return option.value === STATE.waitingStructureBoxRegion; })) {
      STATE.waitingStructureBoxRegion = STATE.waitingStructureRegion || "all";
    }
    fillSelect("hiWaitingStructureBoxRegionFilter", regionOptions, STATE.waitingStructureBoxRegion);
    fillSelect("hiWaitingStructureBoxServiceTypeFilter", waitingServiceTypeOptions(), STATE.waitingStructureBoxServiceType);
    refreshWaitingStructureBoxServiceFilter();
    fillSelect("hiWaitingStructureBoxPriorityFilter", waitingPriorityOptions(true), STATE.waitingStructureBoxPriority);
    [
      ["hiWaitingStructureBoxLayoutFilter", "waitingStructureBoxLayout"],
      ["hiWaitingStructureBoxMetricFilter", "waitingStructureBoxMetric"],
      ["hiWaitingStructureBoxLimitFilter", "waitingStructureBoxLimit"]
    ].forEach(function (item) {
      var node = byId(item[0]);
      if (node) node.value = STATE[item[1]];
    });
  }

  function refreshWaitingStructureFilters() {
    var regionOptions = waitingStructureRegionOptions();
    if (!regionOptions.some(function (option) { return option.value === STATE.waitingStructureRegion; })) {
      STATE.waitingStructureRegion = regionOptions[0] ? regionOptions[0].value : "";
    }
    fillSelect("hiWaitingStructureRegionFilter", regionOptions, STATE.waitingStructureRegion);
    fillSelect("hiWaitingStructureServiceTypeFilter", waitingServiceTypeOptions(), STATE.waitingStructureServiceType);
    refreshWaitingStructureServiceFilter();
    refreshWaitingStructurePriorityFilter();
    refreshWaitingStructureFocusFilter();
    [
      ["hiWaitingStructureMetricFilter", "waitingStructureMetric"],
      ["hiWaitingStructureLimitFilter", "waitingStructureLimit"]
    ].forEach(function (item) {
      var node = byId(item[0]);
      if (node) node.value = STATE[item[1]];
    });
    refreshWaitingStructureBoxFilters();
  }

  function waitingCompareRegionRows(region) {
    var cached = WAITING_STRUCTURE_CACHE[region];
    return cached ? toArray(cached.rows) : [];
  }

  function waitingCompareServiceOptions() {
    var rows = waitingCompareRegionRows(STATE.waitingCompareRegionA).concat(waitingCompareRegionRows(STATE.waitingCompareRegionB));
    if (!rows.length) return waitingServiceOptions(STATE.waitingCompareServiceType, false);
    var serviceMap = {};
    rows.forEach(function (row) {
      if (STATE.waitingCompareServiceType !== "all" && row.service_type !== STATE.waitingCompareServiceType) return;
      if (!row.service_id || serviceMap[row.service_id]) return;
      serviceMap[row.service_id] = { value: row.service_id, label: compact(row.service, 70), service_type: row.service_type };
    });
    return Object.keys(serviceMap).map(function (key) {
      return serviceMap[key];
    }).sort(function (a, b) {
      return (a.service_type || "").localeCompare(b.service_type || "") || a.label.localeCompare(b.label);
    });
  }

  function waitingComparePriorityOptions() {
    var loadedRows = waitingCompareRegionRows(STATE.waitingCompareRegionA).concat(waitingCompareRegionRows(STATE.waitingCompareRegionB));
    var baseOptions = waitingPriorityOptions(false);
    if (!loadedRows.length) return [{ value: "all", label: "Tutte" }].concat(baseOptions);
    var available = {};
    loadedRows.forEach(function (row) {
      if (STATE.waitingCompareServiceType !== "all" && row.service_type !== STATE.waitingCompareServiceType) return;
      if (STATE.waitingCompareService && row.service_id !== STATE.waitingCompareService) return;
      if (row.priority_label) available[row.priority_label] = true;
    });
    return [{ value: "all", label: "Tutte" }].concat(baseOptions.filter(function (option) {
      return available[option.value];
    }));
  }

  function waitingCompareStructureOptions(region, selectedValue) {
    var rows = waitingCompareRegionRows(region);
    if (!rows.length) {
      return [{ value: selectedValue || "", label: "Caricamento strutture..." }];
    }
    var grouped = {};
    rows.forEach(function (row) {
      if (STATE.waitingCompareServiceType !== "all" && row.service_type !== STATE.waitingCompareServiceType) return;
      if (STATE.waitingCompareService && row.service_id !== STATE.waitingCompareService) return;
      if (STATE.waitingComparePriority && STATE.waitingComparePriority !== "all" && row.priority_label !== STATE.waitingComparePriority) return;
      if (!row.structure_code || grouped[row.structure_code]) return;
      grouped[row.structure_code] = { value: row.structure_code, label: compact(row.structure, 72), structure: row.structure };
    });
    var options = Object.keys(grouped).map(function (key) {
      return grouped[key];
    }).sort(function (a, b) {
      return a.structure.localeCompare(b.structure);
    });
    if (!options.length && selectedValue) return [{ value: selectedValue, label: "Nessun dato con questi filtri" }];
    return options;
  }

  function preferredWaitingCompareStructure(region, options) {
    var preferred = "";
    if (region === "Sardegna") preferred = "200904";
    if (region === "Emilia-Romagna") preferred = "505001";
    if (preferred && options.some(function (option) { return option.value === preferred; })) return preferred;
    return options[0] ? options[0].value : "";
  }

  function refreshWaitingCompareStructureFilter(id, stateKey, region) {
    var options = waitingCompareStructureOptions(region, STATE[stateKey]);
    if (!options.some(function (option) { return option.value === STATE[stateKey]; })) {
      STATE[stateKey] = preferredWaitingCompareStructure(region, options);
    }
    fillSelect(id, options, STATE[stateKey]);
  }

  function refreshWaitingCompareFilters() {
    var regionOptions = waitingStructureRegionOptions();
    fillSelect("hiWaitingCompareRegionAFilter", regionOptions, STATE.waitingCompareRegionA);
    fillSelect("hiWaitingCompareRegionBFilter", regionOptions, STATE.waitingCompareRegionB);
    fillSelect("hiWaitingCompareServiceTypeFilter", waitingServiceTypeOptions(), STATE.waitingCompareServiceType);
    var serviceOptions = waitingCompareServiceOptions();
    if (!serviceOptions.some(function (option) { return option.value === STATE.waitingCompareService; })) {
      STATE.waitingCompareService = defaultWaitingStructureService(serviceOptions);
    }
    fillSelect("hiWaitingCompareServiceFilter", serviceOptions.length ? serviceOptions : [{ value: "", label: "Nessuna prestazione disponibile" }], STATE.waitingCompareService);
    var priorityOptions = waitingComparePriorityOptions();
    if (!priorityOptions.some(function (option) { return option.value === STATE.waitingComparePriority; })) {
      STATE.waitingComparePriority = defaultWaitingStructurePriority(priorityOptions);
    }
    fillSelect("hiWaitingComparePriorityFilter", priorityOptions.length ? priorityOptions : [{ value: "", label: "Nessuna priorita disponibile" }], STATE.waitingComparePriority);
    refreshWaitingCompareStructureFilter("hiWaitingCompareStructureAFilter", "waitingCompareStructureA", STATE.waitingCompareRegionA);
    refreshWaitingCompareStructureFilter("hiWaitingCompareStructureBFilter", "waitingCompareStructureB", STATE.waitingCompareRegionB);
    var metricNode = byId("hiWaitingCompareMetricFilter");
    if (metricNode) metricNode.value = STATE.waitingCompareMetric;
  }

  function refreshWaitingFilters(regionOptions) {
    fillSelect("hiWaitingYearFilter", waitingYearOptions(), STATE.waitingYear);
    fillSelect("hiWaitingQualityYearFilter", waitingYearOptions(), STATE.waitingQualityYear);
    fillSelect("hiWaitingServiceYearFilter", waitingYearOptions(), STATE.waitingServiceYear);
    fillSelect("hiWaitingServiceTypeFilter", waitingServiceTypeOptions(), STATE.waitingServiceType);
    fillSelect("hiWaitingQualityServiceTypeFilter", waitingServiceTypeOptions(), STATE.waitingQualityServiceType);
    fillSelect("hiWaitingQualityStructureRegionFilter", waitingStructureRegionOptions(), STATE.waitingQualityStructureRegion);
    fillSelect("hiWaitingServiceType2Filter", waitingServiceTypeOptions(), STATE.waitingServiceType2);
    fillSelect("hiWaitingPriorityFilter", waitingPriorityOptions(true), STATE.waitingPriority);
    fillSelect("hiWaitingQualityPriorityFilter", waitingPriorityOptions(true), STATE.waitingQualityPriority);
    fillSelect("hiWaitingServicePriorityFilter", waitingPriorityOptions(true), STATE.waitingServicePriority);
    fillSelect("hiWaitingTrendPriorityFilter", waitingPriorityOptions(true), STATE.waitingTrendPriority);
    fillSelect("hiWaitingRegimeFilter", waitingRegimeOptions(), STATE.waitingRegime);
    fillSelect("hiWaitingQualityRegimeFilter", waitingRegimeOptions(), STATE.waitingQualityRegime);
    fillSelect("hiWaitingServiceRegimeFilter", waitingRegimeOptions(), STATE.waitingServiceRegime);
    fillSelect("hiWaitingAccessFilter", waitingAccessOptions(), STATE.waitingAccess);
    fillSelect("hiWaitingQualityAccessFilter", waitingAccessOptions(), STATE.waitingQualityAccess);
    fillSelect("hiWaitingServiceAccessFilter", waitingAccessOptions(), STATE.waitingServiceAccess);
    fillSelect("hiWaitingRegionFocusFilter", regionOptions, STATE.waitingRegionFocus);
    var waitingQualityFocusOptions = regionOptions.filter(function (option) { return option.value !== "Italia"; });
    if (!waitingQualityFocusOptions.some(function (option) { return option.value === STATE.waitingQualityFocus; })) {
      STATE.waitingQualityFocus = waitingQualityFocusOptions[0] ? waitingQualityFocusOptions[0].value : "";
    }
    fillSelect("hiWaitingQualityFocusFilter", waitingQualityFocusOptions, STATE.waitingQualityFocus);
    fillSelect("hiWaitingServiceRegionFilter", regionOptions, STATE.waitingServiceRegion);
    fillSelect("hiWaitingTrendRegionFilter", regionOptions, STATE.waitingTrendRegion);
    refreshWaitingServiceFilter("hiWaitingServiceFilter", "waitingService", STATE.waitingServiceType, true);
    refreshWaitingServiceFilter("hiWaitingQualityServiceFilter", "waitingQualityService", STATE.waitingQualityServiceType, true);
    refreshWaitingServiceFilter("hiWaitingTrendServiceFilter", "waitingTrendService", "all", true);
    refreshWaitingStructureFilters();
    refreshWaitingCompareFilters();
    var simpleSelects = [
      ["hiWaitingMetricFilter", "waitingMetric"],
      ["hiWaitingQualityLayoutFilter", "waitingQualityLayout"],
      ["hiWaitingQualityMetricFilter", "waitingQualityMetric"],
      ["hiWaitingQualityLimitFilter", "waitingQualityLimit"],
      ["hiWaitingServiceMetricFilter", "waitingServiceMetric"],
      ["hiWaitingServiceLimitFilter", "waitingServiceLimit"],
      ["hiWaitingTrendMetricFilter", "waitingTrendMetric"]
    ];
    simpleSelects.forEach(function (item) {
      var node = byId(item[0]);
      if (node && item[1] === "waitingQualityMetric" && !Array.prototype.some.call(node.options, function (option) { return option.value === STATE.waitingQualityMetric; })) {
        STATE.waitingQualityMetric = "mean_first_available_days";
      }
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

  function filterWaitingStructureRows() {
    return waitingStructureRows().filter(function (row) {
      if (STATE.waitingStructureServiceType !== "all" && row.service_type !== STATE.waitingStructureServiceType) return false;
      if (STATE.waitingStructureService && row.service_id !== STATE.waitingStructureService) return false;
      if (STATE.waitingStructurePriority !== "all" && row.priority_label !== STATE.waitingStructurePriority) return false;
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

  function includeHighlightedRow(rows, field, value, limit) {
    rows = toArray(rows);
    if (!value || value === "all" || !limit || rows.length <= limit) return rows;
    var index = rows.findIndex(function (row) {
      return row[field] === value;
    });
    if (index < 0 || index < limit) return rows;
    return rows.slice(0, limit - 1).concat([rows[index]]);
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

  function hospitalProfileStructureRows() {
    var grouped = {};
    tableRows("hospital_activity_by_discipline").forEach(function (row) {
      if (STATE.hospitalProfileRegion !== "Italia" && row.region !== STATE.hospitalProfileRegion) return;
      if (STATE.hospitalProfileProvince !== "all" && row.province !== STATE.hospitalProfileProvince) return;
      var key = structureKey(row);
      if (!key) return;
      if (!grouped[key]) {
        grouped[key] = {
          key: key,
          year: row.year,
          region: row.region,
          region_code: row.region_code,
          province: row.province,
          structure_code: row.structure_code,
          structure: row.structure,
          municipality: row.municipality,
          discharges: 0,
          stay_days: 0,
          available_days: 0,
          ordinary_beds: 0,
          day_hospital_beds: 0,
          day_surgery_beds: 0,
          departments: 0,
          main_discipline: "",
          main_discipline_discharges: 0
        };
      }
      grouped[key].discharges += toNumber(row.discharges) || 0;
      grouped[key].stay_days += toNumber(row.stay_days) || 0;
      grouped[key].available_days += toNumber(row.available_days) || 0;
      grouped[key].ordinary_beds += toNumber(row.ordinary_beds) || 0;
      grouped[key].day_hospital_beds += toNumber(row.day_hospital_beds) || 0;
      grouped[key].day_surgery_beds += toNumber(row.day_surgery_beds) || 0;
      grouped[key].departments += 1;
      if ((toNumber(row.discharges) || 0) > grouped[key].main_discipline_discharges) {
        grouped[key].main_discipline = row.discipline;
        grouped[key].main_discipline_discharges = toNumber(row.discharges) || 0;
      }
    });
    return Object.keys(grouped).map(function (key) {
      var row = grouped[key];
      row.avg_los_days = row.discharges ? row.stay_days / row.discharges : null;
      row.bed_utilization_percent = row.available_days ? (row.stay_days / row.available_days) * 100 : null;
      return row;
    }).sort(function (a, b) {
      return (toNumber(b.discharges) || 0) - (toNumber(a.discharges) || 0);
    });
  }

  function hospitalProfileStructureOptions() {
    return hospitalProfileStructureRows().map(function (row) {
      var place = STATE.hospitalProfileRegion === "Italia" ? " - " + row.region + " (" + row.province + ")" : (STATE.hospitalProfileProvince === "all" ? " (" + row.province + ")" : "");
      return { value: row.key, label: compact(row.structure, 58) + place };
    });
  }

  function refreshHospitalProfileStructureFilter() {
    var options = hospitalProfileStructureOptions();
    var node = byId("hiHospitalProfileStructureFilter");
    if (!options.length) {
      STATE.hospitalProfileStructure = "";
      fillSelect("hiHospitalProfileStructureFilter", [{ value: "", label: "Nessun ospedale disponibile" }], "");
      if (node) node.disabled = true;
      return;
    }
    if (!STATE.hospitalProfileStructure || !options.some(function (option) { return option.value === STATE.hospitalProfileStructure; })) {
      STATE.hospitalProfileStructure = options[0].value;
    }
    fillSelect("hiHospitalProfileStructureFilter", options, STATE.hospitalProfileStructure);
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

  function mortalityQualityCauseOptions(group) {
    return [{ value: "all", label: "Tutte le cause del gruppo" }].concat(mortalityDetailCauseOptions(group));
  }

  function mortalityQualityYears(group, causeCode) {
    var years = unique(mortalityDetailRows().filter(function (row) {
      if (row.territory_type !== "region") return false;
      if (group && row.group !== group) return false;
      if (causeCode && causeCode !== "all" && row.cause_code !== causeCode) return false;
      return true;
    }).map(function (row) { return row.year; })).sort(function (a, b) { return b - a; });
    return years;
  }

  function mortalityQualityYearOptions(group, causeCode) {
    var years = mortalityQualityYears(group, causeCode);
    return [{ value: "latest", label: "Ultimo anno con regioni" }].concat(years.map(function (year) {
      return { value: String(year), label: String(year) };
    }));
  }

  function mortalityQualityYearValue(value, group, causeCode) {
    if (value === "latest") {
      var years = mortalityQualityYears(group, causeCode);
      return years.length ? years[0] : null;
    }
    return toNumber(value);
  }

  function refreshMortalityDetailFilters() {
    var groupOptions = mortalityDetailGroups();
    var territoryOptions = mortalityDetailTerritoryOptions();
    var regionOptions = territoryOptions.filter(function (option) { return option.value !== "Italia"; });
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
    if (!groupOptions.some(function (option) { return option.value === STATE.mortalityQualityGroup; })) STATE.mortalityQualityGroup = "cancer_detail";
    var qualityCauseOptions = mortalityQualityCauseOptions(STATE.mortalityQualityGroup);
    if (!qualityCauseOptions.some(function (option) { return option.value === STATE.mortalityQualityCause; })) STATE.mortalityQualityCause = "all";
    if (!mortalityQualityYearOptions(STATE.mortalityQualityGroup, STATE.mortalityQualityCause).some(function (option) { return option.value === STATE.mortalityQualityYear; })) STATE.mortalityQualityYear = "latest";
    if (!regionOptions.some(function (option) { return option.value === STATE.mortalityQualityFocus; })) STATE.mortalityQualityFocus = regionOptions[0] ? regionOptions[0].value : "";

    fillSelect("hiMortalityDetailGroupFilter", groupOptions, STATE.mortalityDetailGroup);
    fillSelect("hiMortalityDetailCauseFilter", causeOptions, STATE.mortalityDetailCause);
    fillSelect("hiMortalityDetailYearFilter", mortalityDetailYearOptions(STATE.mortalityDetailCause, true), STATE.mortalityDetailYear);
    fillSelect("hiMortalityDetailFocusFilter", territoryOptions, STATE.mortalityDetailTerritoryFocus);
    fillSelect("hiMortalityDetailTrendTerritoryFilter", territoryOptions, STATE.mortalityDetailTrendTerritory);
    fillSelect("hiMortalityDetailTrendGroupFilter", groupOptions, STATE.mortalityDetailTrendGroup);
    fillSelect("hiMortalityDetailTrendCauseFilter", trendCauseOptions, STATE.mortalityDetailTrendCause);
    fillSelect("hiMortalityQualityGroupFilter", groupOptions, STATE.mortalityQualityGroup);
    fillSelect("hiMortalityQualityCauseFilter", qualityCauseOptions, STATE.mortalityQualityCause);
    fillSelect("hiMortalityQualityYearFilter", mortalityQualityYearOptions(STATE.mortalityQualityGroup, STATE.mortalityQualityCause), STATE.mortalityQualityYear);
    fillSelect("hiMortalityQualityFocusFilter", regionOptions, STATE.mortalityQualityFocus);
    [
      ["hiMortalityQualityLayoutFilter", "mortalityQualityLayout"],
      ["hiMortalityQualityLimitFilter", "mortalityQualityLimit"]
    ].forEach(function (item) {
      var node = byId(item[0]);
      if (node) node.value = STATE[item[1]];
    });
  }

  function pneRows() {
    return tableRows("pne_hospital_outcomes");
  }

  function pneVolumeTrendRows() {
    return tableRows("pne_hospital_outcome_volume_trend");
  }

  function pneIndicators() {
    return tableRows("pne_outcome_indicators");
  }

  function pneIndicatorByCode(code) {
    return pneIndicators().find(function (row) {
      return String(row.indicator_code) === String(code);
    }) || null;
  }

  function pneIndicatorOptions(includeAll) {
    var rows = pneIndicators().slice().sort(function (a, b) {
      return (toNumber(a.indicator_code) || 0) - (toNumber(b.indicator_code) || 0);
    }).map(function (row) {
      return {
        value: String(row.indicator_code),
        label: row.indicator_code + " - " + compact(row.indicator_label, 82)
      };
    });
    return includeAll ? [{ value: "all", label: "Tutti gli indicatori PNE" }].concat(rows) : rows;
  }

  function pneRegionOptions() {
    var regions = toArray(STATE.payload && STATE.payload.filters && STATE.payload.filters.pne_regions);
    if (!regions.length) {
      regions = unique(pneRows().map(function (row) { return row.region; })).sort();
    }
    return [{ value: "Italia", label: "Italia" }].concat(regions.filter(Boolean).map(function (region) {
      return { value: region, label: region };
    }));
  }

  function pneStructureOptions(rows, includeAll) {
    var seen = {};
    var options = [];
    toArray(rows).forEach(function (row) {
      var id = asText(row.structure_id);
      if (!id || seen[id]) return;
      seen[id] = true;
      var place = [row.city, row.province, row.region].filter(Boolean).join(", ");
      options.push({
        value: id,
        label: compact(row.structure + (place ? " - " + place : ""), 94)
      });
    });
    options.sort(function (a, b) { return a.label.localeCompare(b.label); });
    return includeAll ? [{ value: "all", label: "Nessuna struttura evidenziata" }].concat(options) : options;
  }

  function pneMetricConfig(metric) {
    var configs = {
      success_rate_adjusted_percent: {
        label: "Successo aggiustato",
        field: "success_rate_adjusted_percent",
        xTitle: "% senza decesso/evento aggiustata",
        format: formatPercent,
        lowerBetter: false,
        availableField: "mortality_adjusted_percent",
        note: "derivato come 100 meno la mortalita aggiustata PNE"
      },
      mortality_adjusted_percent: {
        label: "Mortalita aggiustata",
        field: "mortality_adjusted_percent",
        xTitle: "% decessi/eventi aggiustata",
        format: formatPercent,
        lowerBetter: true,
        availableField: "mortality_adjusted_percent",
        note: "mortalita risk-adjusted pubblicata da PNE"
      },
      success_rate_raw_percent: {
        label: "Successo grezzo",
        field: "success_rate_raw_percent",
        xTitle: "% senza decesso/evento grezza",
        format: formatPercent,
        lowerBetter: false,
        availableField: "mortality_raw_percent",
        note: "derivato come 100 meno la mortalita grezza, non aggiustata per rischio"
      },
      mortality_raw_percent: {
        label: "Mortalita grezza",
        field: "mortality_raw_percent",
        xTitle: "% decessi/eventi grezza",
        format: formatPercent,
        lowerBetter: true,
        availableField: "mortality_raw_percent",
        note: "mortalita osservata, non aggiustata per rischio"
      },
      cases: {
        label: "Casi nella coorte",
        field: "cases",
        xTitle: "ricoveri nella coorte PNE",
        format: formatNumber,
        lowerBetter: false,
        availableField: "cases",
        note: "denominatore della coorte usata per l'esito"
      },
      events: {
        label: "Eventi osservati",
        field: "events",
        xTitle: "decessi/eventi osservati",
        format: formatNumber,
        lowerBetter: true,
        availableField: "events",
        note: "numeratore osservato nella coorte, non aggiustato per rischio"
      }
    };
    return configs[metric] || configs.success_rate_adjusted_percent;
  }

  function pneQualityMetricConfig(metric) {
    var config = pneMetricConfig(metric);
    if (config.field === "cases" || config.field === "events") return pneMetricConfig("mortality_adjusted_percent");
    return config;
  }

  function refreshPneFilters() {
    var indicatorOptions = pneIndicatorOptions(false);
    var indicatorOptionsWithAll = pneIndicatorOptions(true);
    var regionOptions = pneRegionOptions();
    if (!indicatorOptions.some(function (option) { return option.value === STATE.pneOutcomeIndicator; })) {
      var pancreas = indicatorOptions.find(function (option) { return option.value === "727"; });
      STATE.pneOutcomeIndicator = pancreas ? pancreas.value : (indicatorOptions[0] ? indicatorOptions[0].value : "");
    }
    if (!indicatorOptionsWithAll.some(function (option) { return option.value === STATE.pneQualityIndicator; })) {
      STATE.pneQualityIndicator = "727";
    }
    if (!regionOptions.some(function (option) { return option.value === STATE.pneOutcomeRegion; })) STATE.pneOutcomeRegion = "Italia";
    if (!regionOptions.some(function (option) { return option.value === STATE.pneQualityRegion; })) STATE.pneQualityRegion = "Italia";

    var outcomeStructureRows = pneRows().filter(function (row) {
      return String(row.indicator_code) === String(STATE.pneOutcomeIndicator) &&
        (STATE.pneOutcomeRegion === "Italia" || row.region === STATE.pneOutcomeRegion);
    });
    var outcomeStructureOptions = pneStructureOptions(outcomeStructureRows, true);
    if (!outcomeStructureOptions.some(function (option) { return option.value === STATE.pneOutcomeFocusStructure; })) {
      STATE.pneOutcomeFocusStructure = "all";
    }

    var qualityStructureRows = pneRows().filter(function (row) {
      return (STATE.pneQualityIndicator === "all" || String(row.indicator_code) === String(STATE.pneQualityIndicator)) &&
        (STATE.pneQualityRegion === "Italia" || row.region === STATE.pneQualityRegion);
    });
    var qualityStructureOptions = pneStructureOptions(qualityStructureRows, true);
    if (!qualityStructureOptions.some(function (option) { return option.value === STATE.pneQualityFocusStructure; })) {
      STATE.pneQualityFocusStructure = "all";
    }

    fillSelect("hiPneOutcomeIndicatorFilter", indicatorOptions, STATE.pneOutcomeIndicator);
    fillSelect("hiPneOutcomeRegionFilter", regionOptions, STATE.pneOutcomeRegion);
    fillSelect("hiPneOutcomeFocusStructureFilter", outcomeStructureOptions, STATE.pneOutcomeFocusStructure);
    fillSelect("hiPneQualityIndicatorFilter", indicatorOptionsWithAll, STATE.pneQualityIndicator);
    fillSelect("hiPneQualityRegionFilter", regionOptions, STATE.pneQualityRegion);
    fillSelect("hiPneQualityFocusStructureFilter", qualityStructureOptions, STATE.pneQualityFocusStructure);
    [
      ["hiPneOutcomeMetricFilter", "pneOutcomeMetric"],
      ["hiPneOutcomeMinCasesFilter", "pneOutcomeMinCases"],
      ["hiPneOutcomeLimitFilter", "pneOutcomeLimit"],
      ["hiPneQualityLayoutFilter", "pneQualityLayout"],
      ["hiPneQualityMetricFilter", "pneQualityMetric"],
      ["hiPneQualityMinCasesFilter", "pneQualityMinCases"],
      ["hiPneQualityLimitFilter", "pneQualityLimit"]
    ].forEach(function (item) {
      var node = byId(item[0]);
      if (node) node.value = STATE[item[1]];
    });
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
      ["hiPsRegionBoxFocusFilter", "psRegionBoxFocus"],
      ["hiPsStructureRegionFilter", "psStructureRegion"],
      ["hiDisciplineRegionFilter", "disciplineRegion"],
      ["hiCostRegionFilter", "costRegion"],
      ["hiCostCompositionRegionFilter", "costCompositionRegion"],
      ["hiBedsSeriesRegionFilter", "bedsSeriesRegion"],
      ["hiPharmaSeriesRegionFilter", "pharmaRegion"],
      ["hiHospitalRegionFilter", "hospitalRegion"],
      ["hiHospitalDepartmentRegionFilter", "hospitalDepartmentRegion"],
      ["hiHospitalProfileRegionFilter", "hospitalProfileRegion"],
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
    refreshPsTriageFilter("hiPsRegionBoxTriageFilter", "psRegionBoxTriage", true);
    refreshPsTriageFilter("hiPsStructureTriageFilter", "psStructureTriage", true);
    refreshPsLevelFilter("hiPsRegionLevelFilter", "psRegionLevel");
    refreshPsLevelFilter("hiPsRegionBoxLevelFilter", "psRegionBoxLevel");
    refreshPsLevelFilter("hiPsStructureLevelFilter", "psStructureLevel");
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
      ["hiPsRegionBoxLayoutFilter", "psRegionBoxLayout"],
      ["hiPsRegionBoxMetricFilter", "psRegionBoxMetric"],
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
    refreshPneFilters();
    refreshDischargeStructureFilter();
    refreshPsStructureFilter();
    refreshHospitalDepartmentStructureFilter();
    refreshHospitalProfileStructureFilter();

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
      ["hiPsRegionLevelFilter", "psRegionLevel"],
      ["hiPsRegionMetricFilter", "psRegionMetric"],
      ["hiPsRegionBoxLayoutFilter", "psRegionBoxLayout"],
      ["hiPsRegionBoxTriageFilter", "psRegionBoxTriage"],
      ["hiPsRegionBoxLevelFilter", "psRegionBoxLevel"],
      ["hiPsRegionBoxMetricFilter", "psRegionBoxMetric"],
      ["hiPsRegionBoxFocusFilter", "psRegionBoxFocus"],
      ["hiPsStructureRegionFilter", "psStructureRegion"],
      ["hiPsStructureProvinceFilter", "psStructureProvince"],
      ["hiPsStructureFilter", "psStructure"],
      ["hiPsStructureTriageFilter", "psStructureTriage"],
      ["hiPsStructureLevelFilter", "psStructureLevel"],
      ["hiPsStructureLimitFilter", "psStructureLimit"],
      ["hiPsStructureBoxLayoutFilter", "psStructureBoxLayout"],
      ["hiWaitingYearFilter", "waitingYear"],
      ["hiWaitingServiceTypeFilter", "waitingServiceType"],
      ["hiWaitingServiceFilter", "waitingService"],
      ["hiWaitingPriorityFilter", "waitingPriority"],
      ["hiWaitingRegimeFilter", "waitingRegime"],
      ["hiWaitingAccessFilter", "waitingAccess"],
      ["hiWaitingMetricFilter", "waitingMetric"],
      ["hiWaitingRegionFocusFilter", "waitingRegionFocus"],
      ["hiWaitingQualityYearFilter", "waitingQualityYear"],
      ["hiWaitingQualityServiceTypeFilter", "waitingQualityServiceType"],
      ["hiWaitingQualityServiceFilter", "waitingQualityService"],
      ["hiWaitingQualityPriorityFilter", "waitingQualityPriority"],
      ["hiWaitingQualityRegimeFilter", "waitingQualityRegime"],
      ["hiWaitingQualityAccessFilter", "waitingQualityAccess"],
      ["hiWaitingQualityMetricFilter", "waitingQualityMetric"],
      ["hiWaitingQualityFocusFilter", "waitingQualityFocus"],
      ["hiWaitingQualityLayoutFilter", "waitingQualityLayout"],
      ["hiWaitingQualityLimitFilter", "waitingQualityLimit"],
      ["hiWaitingQualityStructureRegionFilter", "waitingQualityStructureRegion"],
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
      ["hiWaitingStructureRegionFilter", "waitingStructureRegion"],
      ["hiWaitingStructureServiceTypeFilter", "waitingStructureServiceType"],
      ["hiWaitingStructureServiceFilter", "waitingStructureService"],
      ["hiWaitingStructurePriorityFilter", "waitingStructurePriority"],
      ["hiWaitingStructureMetricFilter", "waitingStructureMetric"],
      ["hiWaitingStructureLimitFilter", "waitingStructureLimit"],
      ["hiWaitingStructureFocusFilter", "waitingStructureFocus"],
      ["hiWaitingStructureBoxLayoutFilter", "waitingStructureBoxLayout"],
      ["hiWaitingStructureBoxRegionFilter", "waitingStructureBoxRegion"],
      ["hiWaitingStructureBoxServiceTypeFilter", "waitingStructureBoxServiceType"],
      ["hiWaitingStructureBoxServiceFilter", "waitingStructureBoxService"],
      ["hiWaitingStructureBoxPriorityFilter", "waitingStructureBoxPriority"],
      ["hiWaitingStructureBoxMetricFilter", "waitingStructureBoxMetric"],
      ["hiWaitingStructureBoxLimitFilter", "waitingStructureBoxLimit"],
      ["hiWaitingCompareRegionAFilter", "waitingCompareRegionA"],
      ["hiWaitingCompareStructureAFilter", "waitingCompareStructureA"],
      ["hiWaitingCompareRegionBFilter", "waitingCompareRegionB"],
      ["hiWaitingCompareStructureBFilter", "waitingCompareStructureB"],
      ["hiWaitingCompareServiceTypeFilter", "waitingCompareServiceType"],
      ["hiWaitingCompareServiceFilter", "waitingCompareService"],
      ["hiWaitingComparePriorityFilter", "waitingComparePriority"],
      ["hiWaitingCompareMetricFilter", "waitingCompareMetric"],
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
      ["hiMortalityQualityLayoutFilter", "mortalityQualityLayout"],
      ["hiMortalityQualityGroupFilter", "mortalityQualityGroup"],
      ["hiMortalityQualityCauseFilter", "mortalityQualityCause"],
      ["hiMortalityQualityYearFilter", "mortalityQualityYear"],
      ["hiMortalityQualityFocusFilter", "mortalityQualityFocus"],
      ["hiMortalityQualityLimitFilter", "mortalityQualityLimit"],
      ["hiPneOutcomeIndicatorFilter", "pneOutcomeIndicator"],
      ["hiPneOutcomeRegionFilter", "pneOutcomeRegion"],
      ["hiPneOutcomeMetricFilter", "pneOutcomeMetric"],
      ["hiPneOutcomeMinCasesFilter", "pneOutcomeMinCases"],
      ["hiPneOutcomeLimitFilter", "pneOutcomeLimit"],
      ["hiPneOutcomeFocusStructureFilter", "pneOutcomeFocusStructure"],
      ["hiPneQualityLayoutFilter", "pneQualityLayout"],
      ["hiPneQualityIndicatorFilter", "pneQualityIndicator"],
      ["hiPneQualityRegionFilter", "pneQualityRegion"],
      ["hiPneQualityMetricFilter", "pneQualityMetric"],
      ["hiPneQualityMinCasesFilter", "pneQualityMinCases"],
      ["hiPneQualityLimitFilter", "pneQualityLimit"],
      ["hiPneQualityFocusStructureFilter", "pneQualityFocusStructure"],
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
      ["hiHospitalProfileRegionFilter", "hospitalProfileRegion"],
      ["hiHospitalProfileProvinceFilter", "hospitalProfileProvince"],
      ["hiHospitalProfileStructureFilter", "hospitalProfileStructure"],
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

    var share = byId("hiShareFiltersButton");
    if (share) share.addEventListener("click", copyFilterUrl);
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
      ["Liste d'attesa", kpis.pnla_bookings_latest, "PNLA " + asText(kpis.pnla_year), formatNumber(kpis.pnla_services) + " prestazioni; " + formatNumber(kpis.pnla_structure_rows) + " righe struttura"],
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
    renderPsRegionQualityChart();
    renderPsStructureChart();
    renderPsStructureQualityChart();
  }

  function psRegionalStructureRows() {
    var triage = STATE.psRegionTriage;
    var source = triage === "all" ? tableRows("ps_structures") : tableRows("ps_wait_times_by_structure_triage");
    var valueField = triage === "all" ? "mean_wait_minutes" : "wait_minutes";
    var grouped = {};
    source.forEach(function (row) {
      if (triage !== "all" && row.triage_code !== triage) return;
      if (!psLevelMatches(row, STATE.psRegionLevel)) return;
      var value = toNumber(row[valueField]);
      if (value === null) return;
      var key = row.region;
      if (!grouped[key]) {
        grouped[key] = {
          region: row.region,
          year: row.year,
          values: [],
          accesses_total: 0,
          structures: 0
        };
      }
      grouped[key].values.push(value);
      grouped[key].accesses_total += toNumber(row.accesses_total) || 0;
      grouped[key].structures += 1;
    });
    return Object.keys(grouped).map(function (key) {
      var item = grouped[key];
      item.mean_wait_minutes = mean(item.values);
      item.median_wait_minutes = median(item.values);
      delete item.values;
      return item;
    });
  }

  function renderPsRegionChart() {
    var metric = STATE.psRegionMetric || "mean_wait_minutes";
    var rows = psRegionalStructureRows();
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
    var levelText = psLevelText(STATE.psRegionLevel);
    if (title) title.textContent = "Pronto soccorso: " + psMetricLabel(metric) + " - " + triageText + " - " + levelText;
    setTag("hiPsRegionTag", "2024 - " + psMetricLabel(metric) + " - " + levelText);
    var unavailable = psUnavailableCodesText();
    setChartCredit("hiPsRegionNote", [
      { id: "agenas_trova_strutture_ps", label: "AGENAS Trova Strutture, Pronto Soccorso" }
    ], "Il tempo misura la permanenza media dal triage alla dimissione, non solo l'attesa prima della visita. Il confronto regionale e calcolato sulle strutture e non e pesato per accessi. Il filtro livello PS/DEA evita di confrontare insieme pronto soccorso, DEA di 1 livello e DEA di 2 livello; con 'tutti i livelli' la vista resta volutamente aggregata. Il filtro mostra solo i codici con tempi pubblicati dall'endpoint: " + psAvailableCodesText() + "." + (unavailable ? " I codici " + unavailable + " esistono nel modello triage a 5 codici, ma non sono pubblicati come tempi separati nell'endpoint corrente e quindi non sono mostrati come filtri grafico." : ""));
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

  function psRegionBoxSpec() {
    if (STATE.psRegionBoxLayout === "triage_region") {
      return {
        group: "triage",
        point: "region",
        title: "Boxplot PS per codice triage",
        groupLabel: "Codice triage",
        pointLabel: "Regione",
        subtitle: "Ogni box e un codice triage; ogni punto e una regione o provincia autonoma."
      };
    }
    if (STATE.psRegionBoxLayout === "region_level") {
      return {
        group: "region",
        point: "level",
        title: "Boxplot PS per regione",
        groupLabel: "Regione",
        pointLabel: "Livello PS/DEA",
        subtitle: "Ogni box e una regione; ogni punto e un livello PS/DEA pubblicato per quella regione."
      };
    }
    if (STATE.psRegionBoxLayout === "region_triage") {
      return {
        group: "region",
        point: "triage",
        title: "Boxplot PS per regione",
        groupLabel: "Regione",
        pointLabel: "Codice triage",
        subtitle: "Ogni box e una regione; ogni punto e un codice triage pubblicato per quella regione."
      };
    }
    return {
      group: "level",
      point: "region",
      title: "Boxplot PS per livello",
      groupLabel: "Livello PS/DEA",
      pointLabel: "Regione",
      subtitle: "Ogni box e un livello PS/DEA; ogni punto e una regione o provincia autonoma."
    };
  }

  function psRegionBoxDimension(row, dimension) {
    if (dimension === "region") return { key: row.region, label: row.region };
    if (dimension === "level") return { key: row.emergency_level || "Non classificato", label: row.emergency_level || "Non classificato" };
    if (dimension === "triage") return { key: row.triage_code || "all", label: row.triage_label || triageLabel(row.triage_code || "all") };
    return { key: "", label: "" };
  }

  function psRegionBoxRows(spec, config, metric) {
    var grouped = {};
    tableRows("ps_wait_times_by_structure_triage").forEach(function (row) {
      if (!psLevelMatches(row, STATE.psRegionBoxLevel)) return;
      if (STATE.psRegionBoxTriage !== "all" && row.triage_code !== STATE.psRegionBoxTriage) return;
      var value = toNumber(row.wait_minutes);
      if (value === null) return;
      var group = psRegionBoxDimension(row, spec.group);
      var point = psRegionBoxDimension(row, spec.point);
      if (!group.key || !point.key) return;
      var key = group.key + "||" + point.key;
      if (!grouped[key]) {
        grouped[key] = {
          group_key: group.key,
          group_label: group.label,
          point_key: point.key,
          point_label: point.label,
          region: row.region,
          emergency_level: row.emergency_level || "Non classificato",
          triage_code: row.triage_code || "all",
          triage_label: row.triage_label || triageLabel(row.triage_code || "all"),
          values: [],
          accesses_map: {},
          structures_map: {}
        };
      }
      grouped[key].values.push(value);
      grouped[key].structures_map[psStructureKey(row)] = true;
      grouped[key].accesses_map[psStructureKey(row)] = toNumber(row.accesses_total) || 0;
    });
    var rows = Object.keys(grouped).map(function (key) {
      var item = grouped[key];
      item.mean_wait_minutes = mean(item.values);
      item.median_wait_minutes = median(item.values);
      item.selected_value = toNumber(item[metric]) !== null ? toNumber(item[metric]) : item.mean_wait_minutes;
      item.structures = Object.keys(item.structures_map).length;
      item.accesses_total = Object.keys(item.accesses_map).reduce(function (total, structureKey) {
        return total + (toNumber(item.accesses_map[structureKey]) || 0);
      }, 0);
      delete item.values;
      delete item.structures_map;
      delete item.accesses_map;
      return item;
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
    rows = applyGroupedQualityDistribution(rows, config);
    var groupStats = {};
    rows.forEach(function (row) {
      if (!groupStats[row.group_key]) groupStats[row.group_key] = { key: row.group_key, label: row.group_label, values: [], order: 99 };
      groupStats[row.group_key].values.push(row.selected_value);
      if (spec.group === "level") groupStats[row.group_key].order = psLevelOrder(row.group_key);
      if (spec.group === "triage") groupStats[row.group_key].order = triageOrder(row.group_key);
      if (spec.group === "region") groupStats[row.group_key].order = 10;
    });
    var groups = Object.keys(groupStats).map(function (key) {
      var group = groupStats[key];
      group.mean_value = mean(group.values);
      return group;
    }).sort(function (a, b) {
      if (spec.group === "region") return (toNumber(b.mean_value) || 0) - (toNumber(a.mean_value) || 0) || a.label.localeCompare(b.label);
      return a.order - b.order || a.label.localeCompare(b.label);
    });
    var limit = spec.group === "region" ? 21 : groups.length;
    var allowed = {};
    groups.slice(0, limit).forEach(function (group) { allowed[group.key] = true; });
    rows = rows.filter(function (row) { return allowed[row.group_key]; });
    rows.groupLabels = groups.filter(function (group) { return allowed[group.key]; }).map(function (group) { return group.label; });
    return rows;
  }

  function renderPsRegionBoxSummary(rows, spec) {
    var container = byId("hiPsRegionQualitySummary");
    clear(container);
    rows = toArray(rows);
    var better = rows.filter(function (row) { return toNumber(row.quality_score) !== null && row.quality_score >= 1; });
    var worse = rows.filter(function (row) { return toNumber(row.quality_score) !== null && row.quality_score <= -1; }).sort(function (a, b) {
      return (toNumber(a.quality_score) || 0) - (toNumber(b.quality_score) || 0);
    });
    var focusRows = STATE.psRegionBoxFocus === "Italia" ? [] : rows.filter(function (row) {
      return asText(row.region) === asText(STATE.psRegionBoxFocus);
    });
    var focusScore = mean(focusRows.map(function (row) { return row.quality_score; }));
    function labelList(list) {
      return list.slice(0, 3).map(function (row) {
        return compact(row.region + " / " + row.group_label, 48);
      }).join(", ");
    }
    [
      ["Box nel grafico", formatNumber((rows.groupLabels || []).length), spec.groupLabel],
      ["Punti confrontati", formatNumber(rows.length), spec.pointLabel + " con dato disponibile"],
      ["Meglio della media", formatNumber(better.length), labelList(better) || "nessun punto oltre +1 DS"],
      ["Peggio della media", formatNumber(worse.length), labelList(worse) || "nessun punto sotto -1 DS"],
      ["Focus", focusRows.length ? compact(STATE.psRegionBoxFocus, 42) : "nessun focus", focusRows.length ? formatSignedDecimal(focusScore) + " DS medio su " + formatNumber(focusRows.length) + " punti" : "seleziona una regione da evidenziare"]
    ].forEach(function (item) {
      var card = create("div", "hi-profile-item");
      card.appendChild(create("span", "", item[0]));
      card.appendChild(create("strong", "", item[1]));
      card.appendChild(create("small", "", item[2]));
      container.appendChild(card);
    });
  }

  function renderPsRegionGroupedBoxplot(rows, spec) {
    rows = toArray(rows);
    if (rows.length < 2) {
      showEmptyChart("hiPsRegionBoxChart", "Servono almeno due punti confrontabili per calcolare il boxplot");
      return;
    }
    var groupLabels = rows.groupLabels || unique(rows.map(function (row) { return row.group_label; }));
    var traces = groupLabels.map(function (label) {
      var groupRows = rows.filter(function (row) { return row.group_label === label; });
      return {
        type: "box",
        name: compact(label, 32),
        x: groupRows.map(function () { return label; }),
        y: groupRows.map(function (row) { return row.selected_value; }),
        boxpoints: false,
        fillcolor: "rgba(160,160,160,.16)",
        line: { color: cssVar("--muted", "#b9b2aa") },
        marker: { color: cssVar("--muted", "#b9b2aa") },
        hoverinfo: "skip"
      };
    });
    traces.push({
      type: "scatter",
      mode: "markers",
      name: spec.pointLabel,
      x: rows.map(function (row) { return row.group_label; }),
      y: rows.map(function (row) { return row.selected_value; }),
      text: rows.map(function (row) { return row.point_label; }),
      customdata: rows.map(function (row) {
        return [row.group_label, row.point_label, row.region, row.emergency_level, row.triage_label, row.selected_value_text, row.quality_score_text, row.quality_status, row.structures, row.accesses_total];
      }),
      marker: {
        color: rows.map(function (row) { return STATE.psRegionBoxFocus !== "Italia" && row.region === STATE.psRegionBoxFocus ? COLORS[0] : waitingQualityColor(row.quality_score); }),
        size: rows.map(function (row) { return STATE.psRegionBoxFocus !== "Italia" && row.region === STATE.psRegionBoxFocus ? 12 : 7; }),
        opacity: .88,
        line: { color: cssVar("--panel", "#090909"), width: 1 }
      },
      hovertemplate: "<b>%{customdata[0]}</b><br>" + spec.pointLabel + ": %{customdata[1]}<br>Regione: %{customdata[2]}<br>Livello: %{customdata[3]}<br>Codice: %{customdata[4]}<br>Permanenza: %{customdata[5]}<br>Indice qualita: %{customdata[6]}<br>Lettura: %{customdata[7]}<br>Strutture: %{customdata[8]:,.0f}<br>Accessi totali strutture: %{customdata[9]:,.0f}<extra></extra>"
    });
    plot("hiPsRegionBoxChart", traces, {
      showlegend: false,
      margin: { t: 20, r: 30, b: 126, l: 86 },
      xaxis: {
        title: spec.groupLabel,
        tickangle: -35,
        automargin: true,
        categoryorder: "array",
        categoryarray: groupLabels
      },
      yaxis: { title: "minuti" }
    });
  }

  function renderPsRegionQualityChart() {
    var layoutNode = byId("hiPsRegionBoxLayoutFilter");
    if (layoutNode) layoutNode.value = STATE.psRegionBoxLayout;
    var metric = STATE.psRegionBoxMetric || "mean_wait_minutes";
    var config = qualityDistributionConfig(psMetricLabel(metric), "selected_value", formatDurationMinutes, "minuti", true);
    var spec = psRegionBoxSpec();
    var triageText = STATE.psRegionBoxTriage === "all" ? "tutti i codici disponibili" : triageLabel(STATE.psRegionBoxTriage).toLowerCase();
    var levelText = psLevelText(STATE.psRegionBoxLevel);
    var rows = psRegionBoxRows(spec, config, metric);
    var title = byId("hiPsRegionBoxTitle");
    if (title) title.textContent = spec.title + " - " + psMetricLabel(metric);
    setSubtitle("hiPsRegionBoxSubtitle", spec.subtitle + " Tempi piu bassi indicano una performance migliore dentro il proprio box. Filtro: " + triageText + ", " + levelText + ".");
    setTag("hiPsRegionBoxTag", "2024 - " + spec.groupLabel + " / " + spec.pointLabel);
    renderPsRegionBoxSummary(rows, spec);
    renderPsRegionGroupedBoxplot(rows, spec);
    setChartCredit("hiPsRegionBoxNote", [
      { id: "agenas_trova_strutture_ps", label: "AGENAS Trova Strutture, Pronto Soccorso" }
    ], "Boxplot calcolato sui punti filtrati. L'indice qualita e uno z-score descrittivo calcolato dentro ogni box: almeno +1 DS indica permanenze piu brevi della media del proprio box, almeno -1 DS permanenze piu lunghe. Il filtro Vista decide se il confronto e costruito per livello PS/DEA, codice triage o regione; gli accessi sono totali di struttura e non sono pubblicati per singolo codice triage.");
    createTable("hiPsRegionQualityTable", rows, [
      ["group_label", spec.groupLabel],
      ["point_label", spec.pointLabel],
      ["region", "Regione"],
      ["emergency_level", "Livello PS/DEA"],
      ["triage_label", "Codice triage"],
      ["selected_value_text", psMetricLabel(metric)],
      ["quality_mean_text", "Media box"],
      ["quality_sd_text", "Deviazione standard"],
      ["quality_score_text", "Indice qualita"],
      ["quality_status", "Lettura"],
      ["structures", "Strutture"],
      ["accesses_total", "Accessi totali"]
    ], 120);
  }

  function psWaitRowsForStructureChart() {
    return tableRows("ps_wait_times_by_structure_triage").filter(function (row) {
      if (STATE.psStructureRegion !== "Italia" && row.region !== STATE.psStructureRegion) return false;
      if (STATE.psStructureProvince !== "all" && row.province !== STATE.psStructureProvince) return false;
      if (STATE.psStructure !== "all" && psStructureKey(row) !== STATE.psStructure) return false;
      if (STATE.psStructureTriage !== "all" && row.triage_code !== STATE.psStructureTriage) return false;
      if (!psLevelMatches(row, STATE.psStructureLevel)) return false;
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
    var levelText = selectedStructure ? (structureLevel || psLevelText(STATE.psStructureLevel)) : psLevelText(STATE.psStructureLevel);
    if (title) {
      title.textContent = selectedStructure ? "Pronto soccorso: codici triage - " + territory + " - " + levelText : "Pronto soccorso: permanenza per struttura - " + territory + " - " + triageText + " - " + levelText;
    }
    setTag("hiPsStructureTag", "2024 - " + (selectedStructure && structureAccesses !== null ? "accessi struttura: " + formatNumber(structureAccesses) : (selectedStructure ? territory : triageText + " - " + levelText)));
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
    ], "Il grafico usa il tempo medio di permanenza dal triage alla dimissione. " + (selectedStructure ? "Nel dettaglio per codice triage la tabella non mostra gli accessi, perche la fonte pubblica solo gli accessi totali della struttura" + (structureAccesses !== null ? " (" + formatNumber(structureAccesses) + ")" : "") + (structureLevel ? " e il livello PS/DEA (" + structureLevel + ")" : "") + "." : "Accessi totali e livello PS/DEA sono riportati in tabella come dati della struttura, non del singolo codice triage. Il filtro livello PS/DEA serve a confrontare strutture dello stesso livello; scegliendo tutti i livelli la vista e aggregata e va letta come panoramica, non come graduatoria omogenea.") + " Gli accessi non sono divisi per codice triage, quindi non vengono usati per pesare i tempi per colore." + (unavailable ? " I codici " + unavailable + " esistono nel modello triage a 5 codici, ma non sono pubblicati come tempi separati nell'endpoint corrente e quindi non sono mostrati come filtri grafico." : ""));
  }

  function psStructureBoxSpec() {
    if (STATE.psStructureBoxLayout === "region_structure") {
      return {
        group: "region",
        point: "structure",
        title: "Boxplot PS per regione",
        groupLabel: "Regione",
        pointLabel: "Struttura",
        subtitle: "Ogni box e una regione; ogni punto e un pronto soccorso della selezione."
      };
    }
    if (STATE.psStructureBoxLayout === "triage_structure") {
      return {
        group: "triage",
        point: "structure",
        title: "Boxplot PS per codice triage",
        groupLabel: "Codice triage",
        pointLabel: "Struttura",
        subtitle: "Ogni box e un codice triage; ogni punto e un pronto soccorso della selezione."
      };
    }
    if (STATE.psStructureBoxLayout === "structure_triage") {
      return {
        group: "structure",
        point: "triage",
        title: "Boxplot PS per struttura",
        groupLabel: "Struttura",
        pointLabel: "Codice triage",
        subtitle: "Ogni box e un pronto soccorso; ogni punto e un codice triage pubblicato per quella struttura."
      };
    }
    return {
      group: "level",
      point: "structure",
      title: "Boxplot PS per livello",
      groupLabel: "Livello PS/DEA",
      pointLabel: "Struttura",
      subtitle: "Ogni box e un livello PS/DEA; ogni punto e un pronto soccorso della selezione."
    };
  }

  function psStructureBoxDimension(row, dimension) {
    if (dimension === "region") return { key: row.region, label: row.region };
    if (dimension === "level") return { key: row.emergency_level || "Non classificato", label: row.emergency_level || "Non classificato" };
    if (dimension === "triage") return { key: row.triage_code || "all", label: row.triage_label || triageLabel(row.triage_code || "all") };
    if (dimension === "structure") return { key: row.structure_key || psStructureKey(row), label: row.structure };
    return { key: "", label: "" };
  }

  function psStructureBoxSourceRows(spec) {
    var useTriageRows = spec.group === "triage" || spec.point === "triage" || STATE.psStructureTriage !== "all";
    var rows = useTriageRows ? tableRows("ps_wait_times_by_structure_triage") : tableRows("ps_structures");
    return rows.filter(function (row) {
      if (STATE.psStructureRegion !== "Italia" && row.region !== STATE.psStructureRegion) return false;
      if (STATE.psStructureProvince !== "all" && row.province !== STATE.psStructureProvince) return false;
      if (!psLevelMatches(row, STATE.psStructureLevel)) return false;
      if (useTriageRows && STATE.psStructureTriage !== "all" && row.triage_code !== STATE.psStructureTriage) return false;
      return true;
    }).map(function (row) {
      var copy = Object.assign({}, row);
      copy.structure_key = psStructureKey(row);
      copy.triage_code = copy.triage_code || "all";
      copy.triage_label = copy.triage_label || "Tutti i codici disponibili";
      copy.selected_value = toNumber(useTriageRows ? row.wait_minutes : row.mean_wait_minutes);
      return copy;
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
  }

  function applyGroupedQualityDistribution(rows, config) {
    var grouped = {};
    rows.forEach(function (row) {
      if (!grouped[row.group_key]) grouped[row.group_key] = [];
      grouped[row.group_key].push(row.selected_value);
    });
    rows.forEach(function (row) {
      var values = grouped[row.group_key] || [];
      var avg = mean(values);
      var sd = standardDeviation(values, avg);
      var rawScore = sd ? (row.selected_value - avg) / sd : null;
      var qualityScore = rawScore === null ? null : rawScore * config.qualityDirection;
      row.quality_mean = avg;
      row.quality_sd = sd;
      row.quality_score = qualityScore;
      row.quality_status = waitingQualityStatus(qualityScore);
      row.selected_value_text = config.format(row.selected_value);
      row.quality_mean_text = config.format(avg);
      row.quality_sd_text = sd === null ? MISSING : config.format(sd);
      row.quality_score_text = qualityScore === null ? MISSING : formatSignedDecimal(qualityScore) + " DS";
    });
    return rows.sort(function (a, b) {
      var scoreA = toNumber(a.quality_score);
      var scoreB = toNumber(b.quality_score);
      if (scoreA === null && scoreB === null) return 0;
      if (scoreA === null) return 1;
      if (scoreB === null) return -1;
      return scoreB - scoreA;
    });
  }

  function psStructureBoxRows(spec, config) {
    var rows = psStructureBoxSourceRows(spec).map(function (row) {
      var group = psStructureBoxDimension(row, spec.group);
      var point = psStructureBoxDimension(row, spec.point);
      return Object.assign({}, row, {
        group_key: group.key,
        group_label: group.label,
        point_key: point.key,
        point_label: point.label
      });
    }).filter(function (row) {
      return row.group_key && row.point_key;
    });
    rows = applyGroupedQualityDistribution(rows, config);
    var groupStats = {};
    rows.forEach(function (row) {
      if (!groupStats[row.group_key]) groupStats[row.group_key] = { key: row.group_key, label: row.group_label, values: [], order: 99 };
      groupStats[row.group_key].values.push(row.selected_value);
      if (spec.group === "level") groupStats[row.group_key].order = psLevelOrder(row.group_key);
      if (spec.group === "triage") groupStats[row.group_key].order = triageOrder(row.group_key);
      if (spec.group === "region") groupStats[row.group_key].order = 10;
      if (spec.group === "structure") groupStats[row.group_key].order = 50;
    });
    var groups = Object.keys(groupStats).map(function (key) {
      var group = groupStats[key];
      group.mean_value = mean(group.values);
      return group;
    }).sort(function (a, b) {
      if (spec.group === "structure") return (toNumber(b.mean_value) || 0) - (toNumber(a.mean_value) || 0) || a.label.localeCompare(b.label);
      return a.order - b.order || a.label.localeCompare(b.label);
    });
    var limit = spec.group === "structure" ? chartLimit(STATE.psStructureLimit, 20) : groups.length;
    var allowed = {};
    groups.slice(0, limit).forEach(function (group) { allowed[group.key] = true; });
    rows = rows.filter(function (row) { return allowed[row.group_key]; });
    rows.groupLabels = groups.filter(function (group) { return allowed[group.key]; }).map(function (group) { return group.label; });
    return rows;
  }

  function renderPsStructureBoxSummary(rows, spec) {
    var container = byId("hiPsStructureQualitySummary");
    clear(container);
    rows = toArray(rows);
    var better = rows.filter(function (row) { return toNumber(row.quality_score) !== null && row.quality_score >= 1; });
    var worse = rows.filter(function (row) { return toNumber(row.quality_score) !== null && row.quality_score <= -1; }).sort(function (a, b) {
      return (toNumber(a.quality_score) || 0) - (toNumber(b.quality_score) || 0);
    });
    var focusRows = STATE.psStructure === "all" ? [] : rows.filter(function (row) {
      return asText(row.structure_key) === asText(STATE.psStructure);
    });
    var focusScore = mean(focusRows.map(function (row) { return row.quality_score; }));
    function labelList(list) {
      return list.slice(0, 3).map(function (row) {
        return compact(row.structure + " / " + row.group_label, 48);
      }).join(", ");
    }
    [
      ["Box nel grafico", formatNumber((rows.groupLabels || []).length), spec.groupLabel],
      ["Punti confrontati", formatNumber(rows.length), spec.pointLabel + " con dato disponibile"],
      ["Meglio della media", formatNumber(better.length), labelList(better) || "nessun punto oltre +1 DS"],
      ["Peggio della media", formatNumber(worse.length), labelList(worse) || "nessun punto sotto -1 DS"],
      ["Focus", focusRows.length ? compact(focusRows[0].structure, 42) : "nessun focus", focusRows.length ? formatSignedDecimal(focusScore) + " DS medio su " + formatNumber(focusRows.length) + " punti" : "seleziona un punto da evidenziare"]
    ].forEach(function (item) {
      var card = create("div", "hi-profile-item");
      card.appendChild(create("span", "", item[0]));
      card.appendChild(create("strong", "", item[1]));
      card.appendChild(create("small", "", item[2]));
      container.appendChild(card);
    });
  }

  function renderPsStructureGroupedBoxplot(rows, spec) {
    rows = toArray(rows);
    if (rows.length < 2) {
      showEmptyChart("hiPsStructureBoxChart", "Servono almeno due punti confrontabili per calcolare il boxplot");
      return;
    }
    var groupLabels = rows.groupLabels || unique(rows.map(function (row) { return row.group_label; }));
    var traces = groupLabels.map(function (label) {
      var groupRows = rows.filter(function (row) { return row.group_label === label; });
      return {
        type: "box",
        name: compact(label, 32),
        x: groupRows.map(function () { return label; }),
        y: groupRows.map(function (row) { return row.selected_value; }),
        boxpoints: false,
        fillcolor: "rgba(160,160,160,.16)",
        line: { color: cssVar("--muted", "#b9b2aa") },
        marker: { color: cssVar("--muted", "#b9b2aa") },
        hoverinfo: "skip"
      };
    });
    traces.push({
      type: "scatter",
      mode: "markers",
      name: spec.pointLabel,
      x: rows.map(function (row) { return row.group_label; }),
      y: rows.map(function (row) { return row.selected_value; }),
      text: rows.map(function (row) { return row.point_label; }),
      customdata: rows.map(function (row) {
        return [row.group_label, row.point_label, row.structure, row.region, row.province, row.emergency_level, row.triage_label, row.selected_value_text, row.quality_score_text, row.quality_status, row.accesses_total];
      }),
      marker: {
        color: rows.map(function (row) { return STATE.psStructure !== "all" && asText(row.structure_key) === asText(STATE.psStructure) ? COLORS[0] : waitingQualityColor(row.quality_score); }),
        size: rows.map(function (row) { return STATE.psStructure !== "all" && asText(row.structure_key) === asText(STATE.psStructure) ? 12 : 7; }),
        opacity: .88,
        line: { color: cssVar("--panel", "#090909"), width: 1 }
      },
      hovertemplate: "<b>%{customdata[0]}</b><br>" + spec.pointLabel + ": %{customdata[1]}<br>Struttura: %{customdata[2]}<br>Regione: %{customdata[3]} - %{customdata[4]}<br>Livello: %{customdata[5]}<br>Codice: %{customdata[6]}<br>Permanenza: %{customdata[7]}<br>Indice qualita: %{customdata[8]}<br>Lettura: %{customdata[9]}<br>Accessi totali struttura: %{customdata[10]:,.0f}<extra></extra>"
    });
    plot("hiPsStructureBoxChart", traces, {
      showlegend: false,
      margin: { t: 20, r: 30, b: 126, l: 86 },
      xaxis: {
        title: spec.groupLabel,
        tickangle: -35,
        automargin: true,
        categoryorder: "array",
        categoryarray: groupLabels
      },
      yaxis: { title: "minuti" }
    });
  }

  function renderPsStructureQualityChart() {
    var layoutNode = byId("hiPsStructureBoxLayoutFilter");
    if (layoutNode) layoutNode.value = STATE.psStructureBoxLayout;
    var config = qualityDistributionConfig("permanenza media", "selected_value", formatDurationMinutes, "minuti", true);
    var spec = psStructureBoxSpec();
    var triageText = STATE.psStructureTriage === "all" ? "tutti i codici disponibili" : triageLabel(STATE.psStructureTriage).toLowerCase();
    var territory = territoryLabel(STATE.psStructureRegion, STATE.psStructureProvince);
    var levelText = psLevelText(STATE.psStructureLevel);
    var rows = psStructureBoxRows(spec, config);
    var title = byId("hiPsStructureBoxTitle");
    if (title) title.textContent = spec.title + " - " + territory;
    setSubtitle("hiPsStructureBoxSubtitle", spec.subtitle + " Tempi piu bassi indicano una performance migliore. Filtro: " + triageText + ", " + levelText + ".");
    setTag("hiPsStructureBoxTag", "2024 - " + spec.groupLabel + " / " + spec.pointLabel);
    renderPsStructureBoxSummary(rows, spec);
    renderPsStructureGroupedBoxplot(rows, spec);
    setChartCredit("hiPsStructureBoxNote", [
      { id: "agenas_trova_strutture_ps", label: "AGENAS Trova Strutture, Pronto Soccorso" }
    ], "Boxplot calcolato sui punti filtrati. L'indice qualita e uno z-score descrittivo calcolato dentro ogni box: almeno +1 DS indica permanenze piu brevi della media del proprio box, almeno -1 DS permanenze piu lunghe. La vista per livello separa pronto soccorso, DEA di 1 livello e DEA di 2 livello; con altre viste il filtro livello PS/DEA resta disponibile per evitare confronti non omogenei. Con 'tutti i codici disponibili' il valore per struttura e la media semplice dei codici pubblicati, non pesata per accessi.");
    createTable("hiPsStructureQualityTable", rows, [
      ["group_label", spec.groupLabel],
      ["point_label", spec.pointLabel],
      ["structure", "Struttura"],
      ["region", "Regione"],
      ["province", "Provincia"],
      ["emergency_level", "Livello PS/DEA"],
      ["triage_label", "Codice triage"],
      ["selected_value_text", "Permanenza"],
      ["quality_mean_text", "Media box"],
      ["quality_sd_text", "Deviazione standard"],
      ["quality_score_text", "Indice qualita"],
      ["quality_status", "Lettura"],
      ["accesses_total", "Accessi totali"]
    ], 120);
  }

  function renderWaitingLists() {
    renderWaitingRegionChart();
    renderWaitingQualityChart();
    renderWaitingStructureChart();
    renderWaitingCompareChart();
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

  function waitingPriorityTargetDays(label) {
    if (!label) return null;
    if (label.indexOf("U -") === 0) return 3;
    if (label.indexOf("B -") === 0) return 10;
    if (label.indexOf("D - Differita prime visite") === 0) return 30;
    if (label.indexOf("D -") === 0) return 60;
    if (label.indexOf("P -") === 0) return 120;
    return null;
  }

  function waitingPriorityThresholdNote(settings, config) {
    var base = "Le soglie tra parentesi nelle priorita PNLA sono obiettivi massimi, non tempi medi garantiti: U=3 giorni, B=10 giorni, D=30/60 giorni, P=120 giorni.";
    if (!settings || !config || config.field.indexOf("days") === -1 || !settings.service || settings.service === "all") return base;
    var comparisonSettings = Object.assign({}, settings, { priority: "all" });
    var rows = aggregateWaitingRows(filterWaitingRows(comparisonSettings), function (row) {
      return row.priority_label;
    }, function (row) {
      return row.priority_label;
    }).map(function (row) {
      row.priority_label = row.label;
      row.target_days = waitingPriorityTargetDays(row.label);
      row.selected_value = toNumber(row[config.field]);
      return row;
    }).filter(function (row) {
      return row.target_days !== null && toNumber(row.selected_value) !== null;
    }).sort(function (a, b) {
      return a.target_days - b.target_days;
    });
    var inversions = [];
    rows.forEach(function (urgent) {
      rows.forEach(function (lessUrgent) {
        if (urgent.target_days >= lessUrgent.target_days) return;
        if (urgent.selected_value <= lessUrgent.selected_value + 0.05) return;
        inversions.push({
          urgent: urgent,
          lessUrgent: lessUrgent,
          gap: urgent.selected_value - lessUrgent.selected_value
        });
      });
    });
    if (!inversions.length) return base;
    var selectedPriority = settings.priority && settings.priority !== "all" ? settings.priority : "";
    var chosen = inversions.find(function (item) {
      return item.urgent.priority_label === selectedPriority || item.lessUrgent.priority_label === selectedPriority;
    }) || inversions.sort(function (a, b) {
      return b.gap - a.gap;
    })[0];
    return base + " In questa selezione " + chosen.urgent.priority_label + " risulta " + config.format(chosen.urgent.selected_value) + " contro " + chosen.lessUrgent.priority_label + ": " + config.format(chosen.lessUrgent.selected_value) + ". Non e un'inversione del filtro, ma il tempo medio osservato nella fonte. Leggere sempre insieme a prenotazioni e percentuale entro soglia.";
  }

  function waitingStructureSourceNote(extra) {
    var parts = ["Anno " + asText(waitingStructureYear()), "Regione: " + STATE.waitingStructureRegion];
    if (STATE.waitingStructureService && STATE.waitingStructureService !== "all") parts.push(waitingServiceLabel(STATE.waitingStructureService));
    else if (STATE.waitingStructureServiceType && STATE.waitingStructureServiceType !== "all") parts.push(STATE.waitingStructureServiceType);
    else parts.push("tutte le prestazioni");
    if (STATE.waitingStructurePriority && STATE.waitingStructurePriority !== "all") parts.push(STATE.waitingStructurePriority);
    parts.push("Istituzionale");
    parts.push("Primo accesso");
    return parts.join(", ") + ". " + extra;
  }

  function waitingCompareStructureName(region, structureCode) {
    var row = waitingCompareRegionRows(region).find(function (item) {
      return item.structure_code === structureCode;
    });
    return row && row.structure ? row.structure : structureCode;
  }

  function waitingCompareSummary(region, structureCode, sideLabel) {
    var config = waitingMetricConfig(STATE.waitingCompareMetric);
    var rows = waitingCompareRegionRows(region).filter(function (row) {
      if (row.structure_code !== structureCode) return false;
      if (STATE.waitingCompareServiceType !== "all" && row.service_type !== STATE.waitingCompareServiceType) return false;
      if (STATE.waitingCompareService && row.service_id !== STATE.waitingCompareService) return false;
      if (STATE.waitingComparePriority !== "all" && row.priority_label !== STATE.waitingComparePriority) return false;
      return true;
    });
    var aggregated = aggregateWaitingRows(rows, function (row) {
      return row.structure_code;
    }, function (row) {
      return row.structure;
    })[0] || {};
    var structureName = aggregated.label || waitingCompareStructureName(region, structureCode);
    return Object.assign({
      side: sideLabel,
      region: region,
      structure_code: structureCode,
      structure: structureName,
      label: sideLabel + " - " + structureName + " (" + region + ")"
    }, aggregated, {
      selected_value: toNumber(aggregated[config.field])
    });
  }

  function renderWaitingCompareChart() {
    var regions = unique([STATE.waitingCompareRegionA, STATE.waitingCompareRegionB].filter(Boolean));
    var missingRegions = regions.filter(function (region) {
      return !WAITING_STRUCTURE_CACHE[region];
    });
    var config = waitingMetricConfig(STATE.waitingCompareMetric);
    var serviceText = waitingServiceText(STATE.waitingCompareService, STATE.waitingCompareServiceType);
    var priorityText = waitingPriorityText(STATE.waitingComparePriority);
    var title = byId("hiWaitingCompareTitle");
    var compareYear = (STATE.payload.kpis || {}).pnla_structure_year || waitingLatestYear();
    if (title) title.textContent = "Confronto tra due strutture - " + config.label;
    setSubtitle("hiWaitingCompareSubtitle", "Le due barre confrontano la stessa prestazione e la stessa priorita nelle strutture selezionate. Filtro: " + serviceText + ", " + priorityText + ", Istituzionale, Primo accesso. Per leggere il confronto conta anche il numero di prenotazioni.");
    setTag("hiWaitingCompareTag", "PNLA " + asText(compareYear) + " - confronto diretto");

    if (missingRegions.length) {
      showEmptyChart("hiWaitingCompareChart", "Caricamento strutture per il confronto...");
      createTable("hiWaitingCompareTable", [], [
        ["side", "Lato"],
        ["region", "Regione"],
        ["structure", "Struttura"],
        ["bookings", "Prenotazioni"],
        ["mean_first_available_days", "Giorni prima disponibilita"]
      ], 2);
      setChartCredit("hiWaitingCompareNote", [
        { id: "agenas_liste_attesa_pnla", label: "AGENAS PNLA" }
      ], "Il confronto carica i file regionali necessari e poi applica gli stessi filtri a entrambe le strutture.");
      Promise.all(missingRegions.map(function (region) {
        return loadWaitingStructureRegion(region);
      })).then(function () {
        refreshWaitingCompareFilters();
        renderWaitingCompareChart();
        refreshSiteLanguage();
      });
      return;
    }

    var rows = [
      waitingCompareSummary(STATE.waitingCompareRegionA, STATE.waitingCompareStructureA, "A"),
      waitingCompareSummary(STATE.waitingCompareRegionB, STATE.waitingCompareStructureB, "B")
    ];
    var chartRows = rows.filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
    if (!chartRows.length) {
      showEmptyChart("hiWaitingCompareChart", "Nessun dato confrontabile per i filtri selezionati");
    } else {
      horizontalBar("hiWaitingCompareChart", chartRows, "label", "selected_value", {
        limit: 2,
        leftMargin: 380,
        labelLength: 72,
        xTitle: config.xTitle,
        format: config.format,
        colorFor: function (row) { return row.side === "A" ? COLORS[0] : COLORS[1]; },
        hovertemplate: "%{y}<br>" + config.label + ": %{text}<br>Prenotazioni: %{customdata.bookings:,.0f}<extra></extra>"
      });
    }
    createTable("hiWaitingCompareTable", rows, [
      ["side", "Lato"],
      ["region", "Regione"],
      ["structure", "Struttura"],
      ["bookings", "Prenotazioni"],
      ["within_target_percent", "% entro soglia"],
      ["accepted_within_target_percent", "% appuntamento"],
      ["mean_first_available_days", "Giorni prima disponibilita"],
      ["mean_accepted_wait_days", "Giorni appuntamento"]
    ], 2);
    setChartCredit("hiWaitingCompareNote", [
      { id: "agenas_liste_attesa_pnla", label: "AGENAS PNLA" }
    ], "Confronto diretto su " + serviceText + ", " + priorityText + ", Istituzionale, Primo accesso. Le barre mostrano la misura selezionata per le due strutture; la tabella sotto aggiunge prenotazioni e quote entro soglia. La struttura indica la prima disponibilita proposta nel monitoraggio PNLA, non una matrice di mobilita sanitaria. " + waitingPriorityThresholdNote(null, config));
  }

  function waitingQualityMetricConfig(metric) {
    if (metric === "bookings") metric = "mean_first_available_days";
    var config = waitingMetricConfig(metric);
    var percentMetric = config.field.indexOf("percent") >= 0;
    return Object.assign({}, config, {
      higherIsBetter: percentMetric,
      lowerBetter: !percentMetric,
      qualityDirection: percentMetric ? 1 : -1,
      spreadUnit: percentMetric ? "punti percentuali" : config.xTitle,
      qualityRule: percentMetric ? "valori piu alti sono migliori" : "valori piu bassi sono migliori"
    });
  }

  function mean(values) {
    values = toArray(values).filter(function (value) {
      return toNumber(value) !== null;
    }).map(toNumber);
    if (!values.length) return null;
    return values.reduce(function (total, value) { return total + value; }, 0) / values.length;
  }

  function median(values) {
    values = toArray(values).filter(function (value) {
      return toNumber(value) !== null;
    }).map(toNumber).sort(function (a, b) {
      return a - b;
    });
    if (!values.length) return null;
    var middle = Math.floor(values.length / 2);
    return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
  }

  function standardDeviation(values, avg) {
    values = toArray(values).filter(function (value) {
      return toNumber(value) !== null;
    }).map(toNumber);
    if (values.length < 2 || avg === null) return null;
    var variance = values.reduce(function (total, value) {
      return total + Math.pow(value - avg, 2);
    }, 0) / values.length;
    return Math.sqrt(variance);
  }

  function waitingQualityStatus(score) {
    if (toNumber(score) === null) return "non valutabile";
    if (score >= 1) return "meglio della media";
    if (score <= -1) return "peggio della media";
    return "in linea";
  }

  function waitingQualityColor(score) {
    if (toNumber(score) === null) return COLORS[7];
    if (score >= 1) return COLORS[3];
    if (score <= -1) return COLORS[5];
    return COLORS[1];
  }

  function qualityDistributionConfig(label, field, format, xTitle, lowerBetter) {
    return {
      label: label,
      field: field,
      format: format || formatDecimal,
      xTitle: xTitle || label,
      lowerBetter: Boolean(lowerBetter),
      qualityDirection: lowerBetter ? -1 : 1,
      spreadUnit: xTitle || label
    };
  }

  function applyQualityDistribution(rows, config) {
    rows = toArray(rows).map(function (row) {
      var copy = Object.assign({}, row);
      copy.selected_value = toNumber(copy[config.field]);
      return copy;
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
    var values = rows.map(function (row) { return row.selected_value; });
    var avg = mean(values);
    var sd = standardDeviation(values, avg);
    rows.forEach(function (row) {
      var rawScore = sd ? (row.selected_value - avg) / sd : null;
      var qualityScore = rawScore === null ? null : rawScore * config.qualityDirection;
      row.quality_mean = avg;
      row.quality_sd = sd;
      row.quality_score = qualityScore;
      row.quality_status = waitingQualityStatus(qualityScore);
      row.selected_value_text = config.format(row.selected_value);
      row.quality_mean_text = config.format(avg);
      row.quality_sd_text = sd === null ? MISSING : config.format(sd);
      row.quality_score_text = qualityScore === null ? MISSING : formatSignedDecimal(qualityScore) + " DS";
    });
    return rows.sort(function (a, b) {
      var scoreA = toNumber(a.quality_score);
      var scoreB = toNumber(b.quality_score);
      if (scoreA === null && scoreB === null) return 0;
      if (scoreA === null) return 1;
      if (scoreB === null) return -1;
      return scoreB - scoreA;
    });
  }

  function renderQualitySummary(containerId, rows, config, labelField, focusField, focusValue) {
    var container = byId(containerId);
    clear(container);
    rows = toArray(rows);
    var focus = focusValue ? rows.find(function (row) { return asText(row[focusField]) === asText(focusValue); }) : null;
    var avg = rows.length ? rows[0].quality_mean : null;
    var sd = rows.length ? rows[0].quality_sd : null;
    var better = rows.filter(function (row) { return toNumber(row.quality_score) !== null && row.quality_score >= 1; });
    var worse = rows.filter(function (row) { return toNumber(row.quality_score) !== null && row.quality_score <= -1; }).sort(function (a, b) {
      return (toNumber(a.quality_score) || 0) - (toNumber(b.quality_score) || 0);
    });
    function labelList(list) {
      return list.slice(0, 3).map(function (row) { return compact(row[labelField], 34); }).join(", ");
    }
    [
      ["Media", config.format(avg), "media semplice dei punti nel boxplot"],
      ["Deviazione standard", sd === null ? MISSING : config.format(sd), "soglia descrittiva: almeno +/-1 DS"],
      ["Meglio della media", formatNumber(better.length), labelList(better) || "nessun punto oltre +1 DS"],
      ["Peggio della media", formatNumber(worse.length), labelList(worse) || "nessun punto sotto -1 DS"],
      ["Focus", focus ? compact(focus[labelField], 42) : "nessun focus", focus ? focus.quality_score_text + " - " + focus.quality_status : "seleziona un punto da evidenziare"]
    ].forEach(function (item) {
      var card = create("div", "hi-profile-item");
      card.appendChild(create("span", "", item[0]));
      card.appendChild(create("strong", "", item[1]));
      card.appendChild(create("small", "", item[2]));
      container.appendChild(card);
    });
  }

  function renderQualityBoxplot(chartId, rows, config, labelField, focusField, focusValue, groupLabel) {
    rows = toArray(rows);
    if (rows.length < 2) {
      showEmptyChart(chartId, "Servono almeno due punti confrontabili per calcolare boxplot e deviazione standard");
      return;
    }
    var avg = rows[0].quality_mean;
    var sd = rows[0].quality_sd;
    var values = rows.map(function (row) { return row.selected_value; });
    var shapes = [];
    var annotations = [];
    function referenceLine(value, label, color, dash) {
      if (toNumber(value) === null) return;
      shapes.push({
        type: "line",
        xref: "paper",
        x0: 0,
        x1: 1,
        y0: value,
        y1: value,
        line: { color: color, width: 2, dash: dash || "dash" }
      });
      annotations.push({
        xref: "paper",
        yref: "y",
        x: 1,
        y: value,
        xanchor: "right",
        yanchor: "bottom",
        text: label,
        showarrow: false,
        font: { size: 11, color: color }
      });
    }
    referenceLine(avg, "media", COLORS[0], "dash");
    if (sd) {
      referenceLine(avg + sd, config.lowerBetter ? "peggio: media +1 DS" : "meglio: media +1 DS", config.lowerBetter ? COLORS[5] : COLORS[3], "dot");
      referenceLine(avg - sd, config.lowerBetter ? "meglio: media -1 DS" : "peggio: media -1 DS", config.lowerBetter ? COLORS[3] : COLORS[5], "dot");
    }
    plot(chartId, [
      {
        type: "box",
        name: groupLabel || "Distribuzione",
        x: values.map(function () { return groupLabel || "Distribuzione"; }),
        y: values,
        boxpoints: false,
        fillcolor: "rgba(160,160,160,.16)",
        line: { color: cssVar("--muted", "#b9b2aa") },
        marker: { color: cssVar("--muted", "#b9b2aa") },
        hoverinfo: "skip"
      },
      {
        type: "scatter",
        mode: "markers",
        name: groupLabel || "Punti",
        x: rows.map(function () { return groupLabel || "Distribuzione"; }),
        y: values,
        text: rows.map(function (row) { return row[labelField]; }),
        customdata: rows.map(function (row) {
          return [row.selected_value_text, row.quality_score_text, row.quality_status, row.quality_mean_text, row.quality_sd_text];
        }),
        marker: {
          color: rows.map(function (row) { return focusValue && asText(row[focusField]) === asText(focusValue) ? COLORS[0] : waitingQualityColor(row.quality_score); }),
          size: rows.map(function (row) { return focusValue && asText(row[focusField]) === asText(focusValue) ? 13 : 8; }),
          opacity: .9,
          line: { color: cssVar("--panel", "#090909"), width: 1 }
        },
        hovertemplate: "<b>%{text}</b><br>" + config.label + ": %{customdata[0]}<br>Indice qualita: %{customdata[1]}<br>Lettura: %{customdata[2]}<br>Media: %{customdata[3]}<br>Deviazione standard: %{customdata[4]}<extra></extra>"
      }
    ], {
      showlegend: false,
      margin: { t: 20, r: 36, b: 60, l: 86 },
      xaxis: { title: "", showgrid: false },
      yaxis: { title: config.xTitle },
      shapes: shapes,
      annotations: annotations
    });
  }

  function waitingQualitySettings() {
    return {
      year: STATE.waitingQualityYear,
      serviceType: STATE.waitingQualityServiceType,
      service: STATE.waitingQualityService,
      priority: STATE.waitingQualityPriority,
      regime: STATE.waitingQualityRegime,
      access: STATE.waitingQualityAccess
    };
  }

  function waitingQualityRows(config) {
    var rows = aggregateWaitingRows(filterWaitingRows(waitingQualitySettings()), function (row) {
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
    var values = rows.map(function (row) { return row.selected_value; });
    var avg = mean(values);
    var sd = standardDeviation(values, avg);
    rows.forEach(function (row) {
      var rawScore = sd ? (row.selected_value - avg) / sd : null;
      var qualityScore = rawScore === null ? null : rawScore * config.qualityDirection;
      row.national_mean = avg;
      row.national_sd = sd;
      row.quality_score = qualityScore;
      row.quality_status = waitingQualityStatus(qualityScore);
      row.selected_value_text = config.format(row.selected_value);
      row.national_mean_text = config.format(avg);
      row.national_sd_text = sd === null ? MISSING : (formatDecimal(sd) + " " + config.spreadUnit);
      row.quality_score_text = qualityScore === null ? MISSING : formatSignedDecimal(qualityScore) + " DS";
    });
    return rows.sort(function (a, b) {
      return (toNumber(b.quality_score) || -99) - (toNumber(a.quality_score) || -99);
    });
  }

  function renderWaitingQualitySummary(rows, config) {
    var container = byId("hiWaitingQualitySummary");
    clear(container);
    var focus = rows.find(function (row) { return row.region === STATE.waitingQualityFocus; });
    var avg = rows.length ? rows[0].national_mean : null;
    var sd = rows.length ? rows[0].national_sd : null;
    var better = rows.filter(function (row) { return toNumber(row.quality_score) !== null && row.quality_score >= 1; });
    var worse = rows.filter(function (row) { return toNumber(row.quality_score) !== null && row.quality_score <= -1; });
    [
      ["Media aree", config.format(avg), "media semplice tra regioni e province autonome"],
      ["Deviazione standard", sd === null ? MISSING : formatDecimal(sd) + " " + config.spreadUnit, "soglia outlier: almeno +/-1 DS"],
      ["Meglio della media", formatNumber(better.length), better.slice(0, 3).map(function (row) { return row.region; }).join(", ") || "nessuna area oltre +1 DS"],
      ["Peggio della media", formatNumber(worse.length), worse.slice(-3).map(function (row) { return row.region; }).join(", ") || "nessuna area sotto -1 DS"],
      ["Focus", focus ? focus.region : asText(STATE.waitingQualityFocus), focus ? focus.quality_score_text + " - " + focus.quality_status : "area non disponibile nei filtri"]
    ].forEach(function (item) {
      var card = create("div", "hi-profile-item");
      card.appendChild(create("span", "", item[0]));
      card.appendChild(create("strong", "", item[1]));
      card.appendChild(create("small", "", item[2]));
      container.appendChild(card);
    });
  }

  function waitingQualityMode() {
    return STATE.waitingQualityLayout || "region_service_type";
  }

  function waitingQualityModeSpec() {
    var specs = {
      region_service_type: { source: "summary", group: "region", point: "service_type", title: "Boxplot per regioni - punti tipologie", subtitle: "Ogni box e una regione o provincia autonoma; ogni punto e una tipologia di prestazione." },
      region_service: { source: "summary", group: "region", point: "service", title: "Boxplot per regioni - punti prestazioni", subtitle: "Ogni box e una regione o provincia autonoma; ogni punto e una singola prestazione." },
      service_type_region: { source: "summary", group: "service_type", point: "region", title: "Boxplot per tipologie - punti regioni", subtitle: "Ogni box e una tipologia di prestazione; ogni punto e una regione o provincia autonoma." },
      service_region: { source: "summary", group: "service", point: "region", title: "Boxplot per prestazioni - punti regioni", subtitle: "Ogni box e una singola prestazione; ogni punto e una regione o provincia autonoma." },
      service_type_structure: { source: "structure", group: "service_type", point: "structure", title: "Boxplot per tipologie - punti strutture", subtitle: "Ogni box e una tipologia di prestazione; ogni punto e una struttura della regione selezionata." },
      service_structure: { source: "structure", group: "service", point: "structure", title: "Boxplot per prestazioni - punti strutture", subtitle: "Ogni box e una singola prestazione; ogni punto e una struttura della regione selezionata." }
    };
    return specs[waitingQualityMode()] || specs.region_service_type;
  }

  function waitingQualityDimension(row, dimension) {
    if (dimension === "region") return { key: row.region, label: row.region, region: row.region };
    if (dimension === "service_type") return { key: row.service_type, label: row.service_type, service_type: row.service_type };
    if (dimension === "service") return { key: row.service_id, label: row.service || waitingServiceLabel(row.service_id), service_id: row.service_id, service: row.service || waitingServiceLabel(row.service_id), service_type: row.service_type };
    if (dimension === "structure") return { key: row.structure_code || row.structure, label: row.structure || row.published_structure || row.structure_code, structure_code: row.structure_code, structure: row.structure || row.published_structure };
    return { key: "", label: "" };
  }

  function waitingQualityDimensionLabel(dimension) {
    if (dimension === "region") return "Regione";
    if (dimension === "service_type") return "Tipologia prestazione";
    if (dimension === "service") return "Prestazione";
    if (dimension === "structure") return "Struttura";
    return "Punto";
  }

  function waitingQualityStructureMode() {
    return waitingQualityModeSpec().source === "structure";
  }

  function waitingQualitySourceRows(spec) {
    if (spec.source === "structure") {
      var year = waitingStructureYearForRegion(STATE.waitingQualityStructureRegion);
      var selectedYear = waitingYearValue(STATE.waitingQualityYear);
      if (selectedYear && year && selectedYear !== year) return [];
      return waitingStructureRowsForRegion(STATE.waitingQualityStructureRegion).filter(function (row) {
        if (STATE.waitingQualityServiceType !== "all" && row.service_type !== STATE.waitingQualityServiceType) return false;
        if (STATE.waitingQualityService && STATE.waitingQualityService !== "all" && row.service_id !== STATE.waitingQualityService) return false;
        if (STATE.waitingQualityPriority !== "all" && row.priority_label !== STATE.waitingQualityPriority) return false;
        if (STATE.waitingQualityRegime !== "all" && row.regime !== STATE.waitingQualityRegime) return false;
        if (STATE.waitingQualityAccess !== "all" && row.access_type !== STATE.waitingQualityAccess) return false;
        return true;
      });
    }
    return filterWaitingRows(waitingQualitySettings());
  }

  function waitingQualityLabels(spec) {
    return {
      group: waitingQualityDimensionLabel(spec.group),
      point: waitingQualityDimensionLabel(spec.point),
      title: spec.title,
      subtitle: spec.subtitle
    };
  }

  function waitingQualityMatrixRows(config) {
    var spec = waitingQualityModeSpec();
    var metadata = {};
    var rows = aggregateWaitingRows(waitingQualitySourceRows(spec), function (row) {
      var group = waitingQualityDimension(row, spec.group);
      var point = waitingQualityDimension(row, spec.point);
      var key = group.key + "||" + point.key;
      if (!metadata[key]) {
        metadata[key] = {
          group_key: group.key,
          group_label: group.label,
          point_key: point.key,
          point_label: point.label,
          region: group.region || point.region || row.region,
          service_type: group.service_type || point.service_type || row.service_type,
          service_id: group.service_id || point.service_id || row.service_id,
          service: group.service || point.service || row.service,
          structure_code: group.structure_code || point.structure_code || row.structure_code,
          structure: group.structure || point.structure || row.structure
        };
      }
      return key;
    }, function (row) {
      return waitingQualityDimension(row, spec.group).label;
    }).map(function (row) {
      var item = Object.assign({}, row, metadata[row.key] || {});
      item.selected_value = toNumber(item[config.field]);
      return item;
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });

    rows = applyQualityDistribution(rows, config);
    var groupStats = {};
    rows.forEach(function (row) {
      if (!groupStats[row.group_key]) groupStats[row.group_key] = { key: row.group_key, label: row.group_label, values: [], bookings: 0 };
      groupStats[row.group_key].values.push(row.selected_value);
      groupStats[row.group_key].bookings += toNumber(row.bookings) || 0;
    });
    var groups = Object.keys(groupStats).map(function (key) {
      var group = groupStats[key];
      group.mean_value = mean(group.values);
      return group;
    }).sort(function (a, b) {
      var av = toNumber(a.mean_value);
      var bv = toNumber(b.mean_value);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return config.lowerBetter ? bv - av : av - bv;
    });
    var limit = spec.group === "region" ? groups.length : chartLimit(STATE.waitingQualityLimit, 20);
    if (STATE.waitingQualityLimit === "all") limit = groups.length;
    var groupOrder = groups.slice(0, limit).map(function (group) { return group.key; });
    var allowed = {};
    groupOrder.forEach(function (key) { allowed[key] = true; });
    rows = rows.filter(function (row) { return allowed[row.group_key]; });
    rows.groupOrder = groupOrder;
    rows.groupLabels = groups.filter(function (group) { return allowed[group.key]; }).map(function (group) { return group.label; });
    return rows;
  }

  function renderWaitingQualityMatrixSummary(rows, config, labels) {
    var container = byId("hiWaitingQualitySummary");
    clear(container);
    rows = toArray(rows);
    var avg = rows.length ? rows[0].quality_mean : null;
    var sd = rows.length ? rows[0].quality_sd : null;
    var better = rows.filter(function (row) { return toNumber(row.quality_score) !== null && row.quality_score >= 1; });
    var worse = rows.filter(function (row) { return toNumber(row.quality_score) !== null && row.quality_score <= -1; }).sort(function (a, b) {
      return (toNumber(a.quality_score) || 0) - (toNumber(b.quality_score) || 0);
    });
    var focusRows = rows.filter(function (row) { return row.region === STATE.waitingQualityFocus; });
    var focusScore = mean(focusRows.map(function (row) { return row.quality_score; }));
    function pointLabel(row) {
      return compact(row.group_label + " / " + row.point_label, 46);
    }
    [
      ["Punti nel boxplot", formatNumber(rows.length), labels.group + " x " + labels.point],
      ["Media punti", config.format(avg), "media semplice dei punti visualizzati"],
      ["Deviazione standard", sd === null ? MISSING : config.format(sd), "soglia descrittiva: almeno +/-1 DS"],
      ["Meglio della media", formatNumber(better.length), better.slice(0, 3).map(pointLabel).join(", ") || "nessun punto oltre +1 DS"],
      ["Peggio della media", formatNumber(worse.length), worse.slice(0, 3).map(pointLabel).join(", ") || "nessun punto sotto -1 DS"],
      ["Focus", STATE.waitingQualityFocus, focusRows.length ? formatSignedDecimal(focusScore) + " DS medio su " + formatNumber(focusRows.length) + " punti" : "area non presente nei filtri"]
    ].forEach(function (item) {
      var card = create("div", "hi-profile-item");
      card.appendChild(create("span", "", item[0]));
      card.appendChild(create("strong", "", item[1]));
      card.appendChild(create("small", "", item[2]));
      container.appendChild(card);
    });
  }

  function renderWaitingQualityGroupedBoxplot(rows, config, labels) {
    rows = toArray(rows);
    if (rows.length < 2) {
      showEmptyChart("hiWaitingQualityChart", "Servono almeno due punti confrontabili per calcolare il boxplot");
      return;
    }
    var groupLabels = rows.groupLabels || unique(rows.map(function (row) { return row.group_label; }));
    var chartNode = byId("hiWaitingQualityChart");
    if (chartNode) chartNode.style.height = Math.max(520, Math.min(1400, 150 + groupLabels.length * 34)) + "px";
    var traces = groupLabels.map(function (label) {
      var groupRows = rows.filter(function (row) { return row.group_label === label; });
      return {
        type: "box",
        name: compact(label, 32),
        orientation: "h",
        x: groupRows.map(function (row) { return row.selected_value; }),
        y: groupRows.map(function () { return compact(label, 48); }),
        boxpoints: false,
        fillcolor: "rgba(160,160,160,.16)",
        line: { color: cssVar("--muted", "#b9b2aa") },
        marker: { color: cssVar("--muted", "#b9b2aa") },
        hoverinfo: "skip"
      };
    });
    traces.push({
      type: "scatter",
      mode: "markers",
      name: labels.point,
      x: rows.map(function (row) { return row.selected_value; }),
      y: rows.map(function (row) { return compact(row.group_label, 48); }),
      text: rows.map(function (row) { return row.point_label; }),
      customdata: rows.map(function (row) {
        return [row.group_label, row.point_label, row.region, row.service || row.service_type, row.structure || "", row.selected_value_text, row.quality_score_text, row.quality_status, row.bookings];
      }),
      marker: {
        color: rows.map(function (row) { return row.region === STATE.waitingQualityFocus ? COLORS[0] : waitingQualityColor(row.quality_score); }),
        size: rows.map(function (row) { return row.region === STATE.waitingQualityFocus ? 12 : 7; }),
        opacity: .88,
        line: { color: cssVar("--panel", "#090909"), width: 1 }
      },
      hovertemplate: "<b>%{customdata[0]}</b><br>" + labels.point + ": %{customdata[1]}<br>Regione: %{customdata[2]}<br>Prestazione: %{customdata[3]}<br>Struttura: %{customdata[4]}<br>" + config.label + ": %{customdata[5]}<br>Indice qualita: %{customdata[6]}<br>Lettura: %{customdata[7]}<br>Prenotazioni: %{customdata[8]:,.0f}<extra></extra>"
    });
    plot("hiWaitingQualityChart", traces, {
      showlegend: false,
      margin: { t: 20, r: 30, b: 62, l: 300 },
      xaxis: {
        title: config.xTitle,
        automargin: true
      },
      yaxis: {
        title: labels.group,
        automargin: true,
        categoryorder: "array",
        categoryarray: groupLabels.map(function (label) { return compact(label, 48); }),
        autorange: "reversed"
      }
    });
  }

  function waitingQualityHistoryTerritory(spec) {
    if (spec && spec.source === "structure") return STATE.waitingQualityStructureRegion;
    return STATE.waitingQualityFocus;
  }

  function waitingQualityHistorySeries(region, config) {
    var settings = Object.assign({}, waitingQualitySettings(), {
      year: null,
      region: region
    });
    return aggregateWaitingRows(filterWaitingRows(settings), function (row) {
      return String(row.year);
    }, function (row) {
      return String(row.year);
    }).map(function (row) {
      row.year = toNumber(row.key);
      row.selected_value = toNumber(row[config.field]);
      row.selected_value_text = config.format(row.selected_value);
      return row;
    }).filter(function (row) {
      return row.year !== null && row.selected_value !== null;
    }).sort(function (a, b) {
      return a.year - b.year;
    });
  }

  function renderWaitingQualityHistoryChart(spec, config) {
    var territory = waitingQualityHistoryTerritory(spec);
    var nationalRows = waitingQualityHistorySeries("Italia", config);
    var territoryRows = territory && territory !== "Italia" ? waitingQualityHistorySeries(territory, config) : [];
    var years = unique(nationalRows.concat(territoryRows).map(function (row) { return row.year; })).sort(function (a, b) { return a - b; });
    var serviceText = waitingServiceText(STATE.waitingQualityService, STATE.waitingQualityServiceType);
    var priorityText = waitingPriorityText(STATE.waitingQualityPriority);
    var title = byId("hiWaitingQualityHistoryTitle");
    if (title) title.textContent = "Storico PNLA - " + (territory && territory !== "Italia" ? territory + " vs Italia" : "Italia") + " - " + config.label;
    setSubtitle("hiWaitingQualityHistorySubtitle", "Serie annua della stessa selezione del boxplot: " + serviceText + ", " + priorityText + ", " + waitingRegimeText(STATE.waitingQualityRegime) + ", " + waitingAccessText(STATE.waitingQualityAccess) + ". Il filtro Anno sopra cambia il boxplot, mentre questo grafico usa tutti gli anni disponibili.");
    setTag("hiWaitingQualityHistoryTag", years.length ? years[0] + "-" + years[years.length - 1] : "PNLA");

    var traces = [];
    if (nationalRows.length) {
      traces.push({
        x: nationalRows.map(function (row) { return row.year; }),
        y: nationalRows.map(function (row) { return row.selected_value; }),
        text: nationalRows.map(function (row) { return row.selected_value_text; }),
        customdata: nationalRows.map(function (row) { return row.bookings; }),
        type: "scatter",
        mode: "lines+markers",
        name: "Italia",
        line: { color: COLORS[1], width: 3 },
        marker: { size: 8 },
        hovertemplate: "%{x}<br>Italia<br>" + config.label + ": %{text}<br>Prenotazioni: %{customdata:,.0f}<extra></extra>"
      });
    }
    if (territoryRows.length) {
      traces.push({
        x: territoryRows.map(function (row) { return row.year; }),
        y: territoryRows.map(function (row) { return row.selected_value; }),
        text: territoryRows.map(function (row) { return row.selected_value_text; }),
        customdata: territoryRows.map(function (row) { return row.bookings; }),
        type: "scatter",
        mode: "lines+markers",
        name: territory,
        line: { color: COLORS[0], width: 3 },
        marker: { size: 8 },
        hovertemplate: "%{x}<br>" + territory + "<br>" + config.label + ": %{text}<br>Prenotazioni: %{customdata:,.0f}<extra></extra>"
      });
    }

    if (!traces.length) {
      showEmptyChart("hiWaitingQualityHistoryChart", "Nessuno storico disponibile per questa selezione");
    } else {
      lineChart("hiWaitingQualityHistoryChart", traces, {
        yTitle: config.xTitle,
        xAxis: {
          tickmode: "array",
          tickvals: years,
          ticktext: years.map(String)
        }
      });
    }

    setChartCredit("hiWaitingQualityHistoryNote", [
      { id: "agenas_liste_attesa_pnla", label: "AGENAS PNLA" }
    ], "Storico annuo disponibile nel dataset aggregato PNLA: " + (years.length ? years.join(", ") : "nessun anno nella selezione") + ". Le serie sono aggregate e pesate per prenotazioni quando si selezionano piu prestazioni o priorita. Il dettaglio PNLA per struttura e disponibile solo per il 2026: nelle viste con punti struttura lo storico resta quindi regionale, non ospedaliero.");
  }

  function renderWaitingQualityChart() {
    var config = waitingQualityMetricConfig(STATE.waitingQualityMetric);
    var settings = waitingQualitySettings();
    var spec = waitingQualityModeSpec();
    var labels = waitingQualityLabels(spec);
    var structureRegion = STATE.waitingQualityStructureRegion;
    if (spec.source === "structure" && (!structureRegion || !waitingStructureFile(structureRegion))) {
      showEmptyChart("hiWaitingQualityChart", "Seleziona una regione con dettaglio strutture PNLA");
      clear(byId("hiWaitingQualitySummary"));
      createTable("hiWaitingQualityTable", [], [
        ["group_label", labels.group],
        ["point_label", labels.point],
        ["selected_value_text", config.label]
      ], 20);
      setChartCredit("hiWaitingQualityNote", [
        { id: "agenas_liste_attesa_pnla", label: "AGENAS PNLA" }
      ], "La vista con strutture usa i file regionali PNLA dell'ultimo anno disponibile.");
      return;
    }
    if (spec.source === "structure" && !WAITING_STRUCTURE_CACHE[structureRegion]) {
      showEmptyChart("hiWaitingQualityChart", "Caricamento strutture PNLA per " + structureRegion + "...");
      clear(byId("hiWaitingQualitySummary"));
      createTable("hiWaitingQualityTable", [], [
        ["group_label", labels.group],
        ["point_label", labels.point],
        ["selected_value_text", config.label]
      ], 20);
      setChartCredit("hiWaitingQualityNote", [
        { id: "agenas_liste_attesa_pnla", label: "AGENAS PNLA" }
      ], "Sto caricando il dettaglio strutture per costruire il boxplot.");
      loadWaitingStructureRegion(structureRegion).then(function () {
        renderWaitingQualityChart();
        refreshSiteLanguage();
      });
      return;
    }
    var rows = waitingQualityMatrixRows(config);
    var serviceText = waitingServiceText(STATE.waitingQualityService, STATE.waitingQualityServiceType);
    var priorityText = waitingPriorityText(STATE.waitingQualityPriority);
    var sourceSettings = spec.source === "structure" ? Object.assign({}, settings, { year: waitingStructureYearForRegion(structureRegion), region: structureRegion }) : settings;
    var title = byId("hiWaitingQualityTitle");
    if (title) title.textContent = labels.title + " - " + config.label;
    setSubtitle("hiWaitingQualitySubtitle", labels.subtitle + " Il colore segnala chi sta almeno a +/-1 deviazione standard dalla media dei punti visualizzati. Filtro: " + serviceText + ", " + priorityText + ", " + waitingRegimeText(STATE.waitingQualityRegime) + ", " + waitingAccessText(STATE.waitingQualityAccess) + (spec.source === "structure" ? ", regione strutture: " + structureRegion : "") + ".");
    setTag("hiWaitingQualityTag", "PNLA " + asText(waitingYearValue(STATE.waitingQualityYear)) + " - " + labels.group + " / " + labels.point);
    renderWaitingQualityMatrixSummary(rows, config, labels);
    setChartCredit("hiWaitingQualityNote", [
      { id: "agenas_liste_attesa_pnla", label: "AGENAS PNLA" }
    ], waitingSourceNote(sourceSettings, "Boxplot incrociato: " + labels.group + " sull'asse orizzontale, punti = " + labels.point + ". Ogni box e una traccia separata e il filtro Vista decide come costruirlo. L'indice qualita e uno z-score descrittivo calcolato sui punti visualizzati: +1 DS o piu indica performance migliore della media, -1 DS o meno performance peggiore. Per i giorni valori piu bassi sono migliori; per le percentuali valori piu alti sono migliori. Non e un indicatore clinico risk-adjusted. La fonte PNLA disponibile qui pubblica il confronto territoriale per regione/provincia autonoma; il dettaglio province NUTS3 non e presente, quindi non viene mostrato un filtro provincia. " + (spec.source === "structure" ? "I file PNLA struttura non pubblicano la provincia; per questo il livello disponibile qui e la struttura della prima disponibilita proposta. " : "") + waitingPriorityThresholdNote(sourceSettings, config)));
    renderWaitingQualityHistoryChart(spec, config);

    if (rows.length < 2) {
      showEmptyChart("hiWaitingQualityChart", "Servono almeno due punti confrontabili per calcolare deviazione standard e boxplot");
      createTable("hiWaitingQualityTable", rows, [
        ["group_label", labels.group],
        ["point_label", labels.point],
        ["selected_value_text", config.label],
        ["bookings", "Prenotazioni"]
      ], 80);
      return;
    }

    renderWaitingQualityGroupedBoxplot(rows, config, labels);

    createTable("hiWaitingQualityTable", rows, [
      ["group_label", labels.group],
      ["point_label", labels.point],
      ["region", "Regione"],
      ["service_type", "Tipo prestazione"],
      ["service", "Prestazione"],
      ["structure", "Struttura"],
      ["selected_value_text", config.label],
      ["quality_mean_text", "Media punti"],
      ["quality_sd_text", "Deviazione standard"],
      ["quality_score_text", "Indice qualita"],
      ["quality_status", "Lettura"],
      ["bookings", "Prenotazioni"]
    ], 160);
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
    if (title) title.textContent = "Liste d'attesa per regione - " + config.label;
    setSubtitle("hiWaitingRegionSubtitle", "Ogni barra e una regione o provincia autonoma. Il grafico confronta la stessa prestazione, priorita, regime e tipo accesso; se scegli 'tutte' le prestazioni l'aggregazione e pesata per numero di prenotazioni. Filtro: " + serviceText + ", " + priorityText + ", " + waitingRegimeText(STATE.waitingRegime) + ", " + waitingAccessText(STATE.waitingAccess) + ".");
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
    var noteSettings = Object.assign({}, settings, { region: STATE.waitingRegionFocus });
    setChartCredit("hiWaitingRegionNote", [
      { id: "agenas_liste_attesa_pnla", label: "AGENAS PNLA" }
    ], waitingSourceNote(settings, "La prima disponibilita proposta indica il primo slot rilevato dal sistema; l'appuntamento accettato e il tempo effettivamente scelto o assegnato. Le due misure possono divergere. Le aggregazioni su piu prestazioni o priorita sono pesate per numero di prenotazioni. La nota sulle soglie legge il territorio evidenziato: " + STATE.waitingRegionFocus + ". " + waitingPriorityThresholdNote(noteSettings, config)));
  }

  function renderWaitingStructureChart() {
    var region = STATE.waitingStructureRegion;
    var config = waitingMetricConfig(STATE.waitingStructureMetric);
    var serviceText = waitingServiceText(STATE.waitingStructureService, STATE.waitingStructureServiceType);
    var priorityText = waitingPriorityText(STATE.waitingStructurePriority);
    var title = byId("hiWaitingStructureTitle");
    if (title) title.textContent = "Strutture PNLA - " + region + " - " + config.label;
    setSubtitle("hiWaitingStructureSubtitle", "Ogni barra e una struttura della regione selezionata. La misura mostra dove il sistema rileva la prima disponibilita proposta o l'appuntamento accettato per " + serviceText + ". Filtro: " + priorityText + ", Istituzionale, Primo accesso.");
    setTag("hiWaitingStructureTag", "PNLA " + asText(waitingStructureYear()) + " - " + priorityText);

    if (!region || !waitingStructureFile(region)) {
      showEmptyChart("hiWaitingStructureChart", "Seleziona una regione con dettaglio struttura");
      createTable("hiWaitingStructureTable", [], [
        ["structure", "Struttura"],
        ["bookings", "Prenotazioni"],
        ["mean_first_available_days", "Giorni prima disponibilita"],
        ["mean_accepted_wait_days", "Giorni appuntamento"]
      ], 20);
      setChartCredit("hiWaitingStructureNote", [
        { id: "agenas_liste_attesa_pnla", label: "AGENAS PNLA" }
      ], "Il dettaglio per struttura e disponibile per le regioni pubblicate nei file PNLA dell'ultimo anno.");
      showEmptyChart("hiWaitingStructureBoxChart", "Seleziona una regione con dettaglio struttura");
      clear(byId("hiWaitingStructureQualitySummary"));
      createTable("hiWaitingStructureQualityTable", [], [
        ["structure", "Struttura"],
        ["selected_value_text", "Misura"],
        ["quality_score_text", "Indice qualita"]
      ], 20);
      setChartCredit("hiWaitingStructureBoxNote", [
        { id: "agenas_liste_attesa_pnla", label: "AGENAS PNLA" }
      ], "Il boxplot per struttura richiede il file regionale PNLA con dettaglio struttura.");
      return;
    }

    if (!WAITING_STRUCTURE_CACHE[region]) {
      showEmptyChart("hiWaitingStructureChart", "Caricamento dettaglio strutture...");
      createTable("hiWaitingStructureTable", [], [
        ["structure", "Struttura"],
        ["bookings", "Prenotazioni"],
        ["mean_first_available_days", "Giorni prima disponibilita"],
        ["mean_accepted_wait_days", "Giorni appuntamento"]
      ], 20);
      setChartCredit("hiWaitingStructureNote", [
        { id: "agenas_liste_attesa_pnla", label: "AGENAS PNLA" }
      ], "Sto caricando il file regionale con il dettaglio per struttura.");
      showEmptyChart("hiWaitingStructureBoxChart", "Caricamento boxplot strutture...");
      clear(byId("hiWaitingStructureQualitySummary"));
      createTable("hiWaitingStructureQualityTable", [], [
        ["structure", "Struttura"],
        ["selected_value_text", "Misura"],
        ["quality_score_text", "Indice qualita"]
      ], 20);
      setChartCredit("hiWaitingStructureBoxNote", [
        { id: "agenas_liste_attesa_pnla", label: "AGENAS PNLA" }
      ], "Sto caricando il file regionale con il dettaglio per struttura.");
      loadWaitingStructureRegion(region).then(function () {
        refreshWaitingStructureFilters();
        renderWaitingStructureChart();
        refreshSiteLanguage();
      });
      return;
    }

    var rows = aggregateWaitingRows(filterWaitingStructureRows(), function (row) {
      return row.structure_code;
    }, function (row) {
      return row.structure;
    }).map(function (row) {
      row.structure_code = row.key;
      row.structure = row.label;
      row.selected_value = toNumber(row[config.field]);
      return row;
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
    rows = sortWaitingMetric(rows, "selected_value", config.lowerBetter);
    var structureLimit = chartLimit(STATE.waitingStructureLimit, 20);
    var visibleRows = includeHighlightedRow(rows, "structure_code", STATE.waitingStructureFocus, structureLimit);
    if (!rows.length) {
      showEmptyChart("hiWaitingStructureChart", "Nessuna struttura per i filtri selezionati");
    } else {
      horizontalBar("hiWaitingStructureChart", visibleRows, "structure", "selected_value", {
        limit: structureLimit,
        highlight: STATE.waitingStructureFocus,
        highlightField: "structure_code",
        leftMargin: 360,
        labelLength: 66,
        xTitle: config.xTitle,
        format: config.format,
        color: config.field.indexOf("percent") !== -1 ? COLORS[3] : COLORS[2],
        hovertemplate: "%{y}<br>" + config.label + ": %{text}<br>Prenotazioni: %{customdata.bookings:,.0f}<extra></extra>"
      });
    }
    createTable("hiWaitingStructureTable", visibleRows, [
      ["structure", "Struttura"],
      ["bookings", "Prenotazioni"],
      ["within_target_bookings", "Entro soglia"],
      ["within_target_percent", "% entro soglia"],
      ["accepted_within_target_percent", "% appuntamento"],
      ["mean_first_available_days", "Giorni prima disponibilita"],
      ["mean_accepted_wait_days", "Giorni appuntamento"]
    ], structureLimit);
    setChartCredit("hiWaitingStructureNote", [
      { id: "agenas_liste_attesa_pnla", label: "AGENAS PNLA" }
    ], waitingStructureSourceNote("Il grafico ordina le strutture secondo la misura scelta. La prima disponibilita proposta non coincide necessariamente con l'appuntamento accettato dal cittadino; la tabella sotto riporta anche prenotazioni e quote entro soglia. Non e una matrice di mobilita sanitaria: indica offerta rilevata, non origine-destinazione dei pazienti. I confronti ospedalieri vanno letti insieme ai volumi. " + waitingPriorityThresholdNote({
      year: waitingStructureYear(),
      region: STATE.waitingStructureRegion,
      serviceType: STATE.waitingStructureServiceType,
      service: STATE.waitingStructureService,
      priority: STATE.waitingStructurePriority,
      regime: "institutional",
      access: "first"
    }, config)));
    renderWaitingStructureQualityChart();
  }

  function waitingStructureBoxSpec() {
    var specs = {
      region_structure: { group: "region", point: "structure", title: "Boxplot PNLA per regioni", subtitle: "Ogni box e una regione o provincia autonoma; ogni punto e una struttura con dato disponibile." },
      service_structure: { group: "service", point: "structure", title: "Boxplot PNLA per prestazioni", subtitle: "Ogni box e una prestazione; ogni punto e una struttura con dato disponibile." },
      service_type_structure: { group: "service_type", point: "structure", title: "Boxplot PNLA per tipologia", subtitle: "Ogni box e una tipologia di prestazione; ogni punto e una struttura con dato disponibile." },
      structure_service: { group: "structure", point: "service", title: "Boxplot PNLA per strutture", subtitle: "Ogni box e una struttura; ogni punto e una prestazione filtrata." },
      region_service: { group: "region", point: "service", title: "Boxplot PNLA per regioni", subtitle: "Ogni box e una regione o provincia autonoma; ogni punto e una prestazione aggregata sulle strutture." },
      service_region: { group: "service", point: "region", title: "Boxplot PNLA per prestazioni", subtitle: "Ogni box e una prestazione; ogni punto e una regione o provincia autonoma." }
    };
    return specs[STATE.waitingStructureBoxLayout] || specs.service_structure;
  }

  function waitingStructureBoxRegions() {
    if (STATE.waitingStructureBoxRegion === "all") {
      return waitingStructureFiles().map(function (row) { return row.region; });
    }
    return [STATE.waitingStructureBoxRegion || STATE.waitingStructureRegion].filter(Boolean);
  }

  function waitingStructureBoxMissingRegions() {
    return waitingStructureBoxRegions().filter(function (region) {
      return !WAITING_STRUCTURE_CACHE[region];
    });
  }

  function waitingStructureBoxDimension(row, dimension) {
    var multiRegion = STATE.waitingStructureBoxRegion === "all";
    if (dimension === "region") return { key: row.region, label: row.region, region: row.region };
    if (dimension === "service_type") return { key: row.service_type, label: row.service_type, service_type: row.service_type };
    if (dimension === "service") return { key: row.service_id, label: row.service || waitingServiceLabel(row.service_id), service_id: row.service_id, service: row.service || waitingServiceLabel(row.service_id), service_type: row.service_type };
    if (dimension === "structure") {
      return {
        key: row.region + "|" + (row.structure_code || row.structure),
        label: (row.structure || row.published_structure || row.structure_code) + (multiRegion ? " (" + row.region + ")" : ""),
        structure_code: row.structure_code,
        structure: row.structure || row.published_structure,
        region: row.region
      };
    }
    return { key: "", label: "" };
  }

  function waitingStructureBoxSourceRows() {
    var selectedRegions = {};
    waitingStructureBoxRegions().forEach(function (region) { selectedRegions[region] = true; });
    var rows = [];
    Object.keys(selectedRegions).forEach(function (region) {
      rows = rows.concat(waitingStructureRowsForRegion(region));
    });
    return rows.filter(function (row) {
      if (STATE.waitingStructureBoxServiceType !== "all" && row.service_type !== STATE.waitingStructureBoxServiceType) return false;
      if (STATE.waitingStructureBoxService !== "all" && row.service_id !== STATE.waitingStructureBoxService) return false;
      if (STATE.waitingStructureBoxPriority !== "all" && row.priority_label !== STATE.waitingStructureBoxPriority) return false;
      if (row.regime && row.regime !== "institutional") return false;
      if (row.access_type && row.access_type !== "first") return false;
      return true;
    });
  }

  function waitingStructureBoxRows(spec, config) {
    var metadata = {};
    var rows = aggregateWaitingRows(waitingStructureBoxSourceRows(), function (row) {
      var group = waitingStructureBoxDimension(row, spec.group);
      var point = waitingStructureBoxDimension(row, spec.point);
      if (!group.key || !point.key) return "";
      var key = group.key + "||" + point.key;
      if (!metadata[key]) {
        metadata[key] = {
          group_key: group.key,
          group_label: group.label,
          point_key: point.key,
          point_label: point.label,
          region: group.region || point.region || row.region,
          service_type: group.service_type || point.service_type || row.service_type,
          service_id: group.service_id || point.service_id || row.service_id,
          service: group.service || point.service || row.service,
          structure_code: group.structure_code || point.structure_code || row.structure_code,
          structure: group.structure || point.structure || row.structure
        };
      }
      return key;
    }, function (row) {
      return waitingStructureBoxDimension(row, spec.group).label;
    }).map(function (row) {
      var item = Object.assign({}, row, metadata[row.key] || {});
      item.selected_value = toNumber(item[config.field]);
      return item;
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
    rows = applyGroupedQualityDistribution(rows, config);
    var groupStats = {};
    rows.forEach(function (row) {
      if (!groupStats[row.group_key]) groupStats[row.group_key] = { key: row.group_key, label: row.group_label, values: [], bookings: 0 };
      groupStats[row.group_key].values.push(row.selected_value);
      groupStats[row.group_key].bookings += toNumber(row.bookings) || 0;
    });
    var groups = Object.keys(groupStats).map(function (key) {
      var group = groupStats[key];
      group.mean_value = mean(group.values);
      return group;
    }).sort(function (a, b) {
      var av = toNumber(a.mean_value);
      var bv = toNumber(b.mean_value);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return config.lowerBetter ? bv - av : av - bv;
    });
    var limit = spec.group === "region" ? groups.length : chartLimit(STATE.waitingStructureBoxLimit, 20);
    if (STATE.waitingStructureBoxLimit === "all") limit = groups.length;
    var allowed = {};
    groups.slice(0, limit).forEach(function (group) { allowed[group.key] = true; });
    rows = rows.filter(function (row) { return allowed[row.group_key]; });
    rows.groupLabels = groups.filter(function (group) { return allowed[group.key]; }).map(function (group) { return group.label; });
    return rows;
  }

  function renderWaitingStructureBoxSummary(rows, labels) {
    var container = byId("hiWaitingStructureQualitySummary");
    clear(container);
    rows = toArray(rows);
    var better = rows.filter(function (row) { return toNumber(row.quality_score) !== null && row.quality_score >= 1; });
    var worse = rows.filter(function (row) { return toNumber(row.quality_score) !== null && row.quality_score <= -1; }).sort(function (a, b) {
      return (toNumber(a.quality_score) || 0) - (toNumber(b.quality_score) || 0);
    });
    function pointLabel(row) {
      return compact(row.group_label + " / " + row.point_label, 52);
    }
    [
      ["Box nel grafico", formatNumber((rows.groupLabels || []).length), labels.group],
      ["Punti confrontati", formatNumber(rows.length), labels.point + " con dato disponibile"],
      ["Meglio della media", formatNumber(better.length), better.slice(0, 3).map(pointLabel).join(", ") || "nessun punto oltre +1 DS"],
      ["Peggio della media", formatNumber(worse.length), worse.slice(0, 3).map(pointLabel).join(", ") || "nessun punto sotto -1 DS"],
      ["Ambito", STATE.waitingStructureBoxRegion === "all" ? "tutte le regioni" : STATE.waitingStructureBoxRegion, "filtri autonomi del boxplot"]
    ].forEach(function (item) {
      var card = create("div", "hi-profile-item");
      card.appendChild(create("span", "", item[0]));
      card.appendChild(create("strong", "", item[1]));
      card.appendChild(create("small", "", item[2]));
      container.appendChild(card);
    });
  }

  function renderWaitingStructureGroupedBoxplot(rows, config, labels) {
    rows = toArray(rows);
    if (rows.length < 2) {
      showEmptyChart("hiWaitingStructureBoxChart", "Servono almeno due punti confrontabili per calcolare il boxplot");
      return;
    }
    var groupLabels = rows.groupLabels || unique(rows.map(function (row) { return row.group_label; }));
    var chartNode = byId("hiWaitingStructureBoxChart");
    if (chartNode) chartNode.style.height = Math.max(520, Math.min(1400, 150 + groupLabels.length * 34)) + "px";
    var traces = groupLabels.map(function (label) {
      var groupRows = rows.filter(function (row) { return row.group_label === label; });
      return {
        type: "box",
        name: compact(label, 32),
        orientation: "h",
        x: groupRows.map(function (row) { return row.selected_value; }),
        y: groupRows.map(function () { return compact(label, 48); }),
        boxpoints: false,
        fillcolor: "rgba(160,160,160,.16)",
        line: { color: cssVar("--muted", "#b9b2aa") },
        marker: { color: cssVar("--muted", "#b9b2aa") },
        hoverinfo: "skip"
      };
    });
    traces.push({
      type: "scatter",
      mode: "markers",
      name: labels.point,
      x: rows.map(function (row) { return row.selected_value; }),
      y: rows.map(function (row) { return compact(row.group_label, 48); }),
      text: rows.map(function (row) { return row.point_label; }),
      customdata: rows.map(function (row) {
        return [row.group_label, row.point_label, row.region, row.service || row.service_type, row.structure || "", row.selected_value_text, row.quality_score_text, row.quality_status, row.bookings];
      }),
      marker: {
        color: rows.map(function (row) { return waitingQualityColor(row.quality_score); }),
        size: 7,
        opacity: .88,
        line: { color: cssVar("--panel", "#090909"), width: 1 }
      },
      hovertemplate: "<b>%{customdata[0]}</b><br>" + labels.point + ": %{customdata[1]}<br>Regione: %{customdata[2]}<br>Prestazione: %{customdata[3]}<br>Struttura: %{customdata[4]}<br>" + config.label + ": %{customdata[5]}<br>Indice qualita: %{customdata[6]}<br>Lettura: %{customdata[7]}<br>Prenotazioni: %{customdata[8]:,.0f}<extra></extra>"
    });
    plot("hiWaitingStructureBoxChart", traces, {
      showlegend: false,
      margin: { t: 20, r: 30, b: 62, l: 300 },
      xaxis: {
        title: config.xTitle,
        automargin: true
      },
      yaxis: {
        title: labels.group,
        automargin: true,
        categoryorder: "array",
        categoryarray: groupLabels.map(function (label) { return compact(label, 48); }),
        autorange: "reversed"
      }
    });
  }

  function renderWaitingStructureQualityChart() {
    var config = waitingQualityMetricConfig(STATE.waitingStructureBoxMetric);
    var spec = waitingStructureBoxSpec();
    var labels = {
      group: waitingQualityDimensionLabel(spec.group),
      point: waitingQualityDimensionLabel(spec.point)
    };
    var regionText = STATE.waitingStructureBoxRegion === "all" ? "tutte le regioni disponibili" : STATE.waitingStructureBoxRegion;
    var serviceText = waitingServiceText(STATE.waitingStructureBoxService, STATE.waitingStructureBoxServiceType);
    var priorityText = waitingPriorityText(STATE.waitingStructureBoxPriority);
    var title = byId("hiWaitingStructureBoxTitle");
    if (title) title.textContent = spec.title + " - " + config.label;
    setSubtitle("hiWaitingStructureBoxSubtitle", spec.subtitle + " Filtri autonomi del boxplot: " + regionText + ", " + serviceText + ", " + priorityText + ", Istituzionale, Primo accesso.");
    setTag("hiWaitingStructureBoxTag", "PNLA " + asText((STATE.payload.kpis || {}).pnla_structure_year || waitingStructureYear()) + " - " + labels.group + " / " + labels.point);

    var missingRegions = waitingStructureBoxMissingRegions();
    if (missingRegions.length) {
      showEmptyChart("hiWaitingStructureBoxChart", "Caricamento strutture PNLA: " + formatNumber(missingRegions.length) + " regioni");
      clear(byId("hiWaitingStructureQualitySummary"));
      createTable("hiWaitingStructureQualityTable", [], [
        ["group_label", labels.group],
        ["point_label", labels.point],
        ["selected_value_text", config.label]
      ], 20);
      setChartCredit("hiWaitingStructureBoxNote", [
        { id: "agenas_liste_attesa_pnla", label: "AGENAS PNLA" }
      ], "Il boxplot usa filtri propri e carica i file regionali PNLA necessari. I file struttura PNLA non pubblicano la provincia: il livello territoriale disponibile qui e regione/provincia autonoma, non provincia NUTS3.");
      Promise.all(missingRegions.map(function (region) {
        return loadWaitingStructureRegion(region);
      })).then(function () {
        refreshWaitingStructureFilters();
        renderWaitingStructureQualityChart();
        refreshSiteLanguage();
      });
      return;
    }

    var rows = waitingStructureBoxRows(spec, config);
    renderWaitingStructureBoxSummary(rows, labels);
    if (!rows.length) {
      showEmptyChart("hiWaitingStructureBoxChart", "Nessun punto disponibile per i filtri selezionati");
    } else {
      renderWaitingStructureGroupedBoxplot(rows, config, labels);
    }
    setChartCredit("hiWaitingStructureBoxNote", [
      { id: "agenas_liste_attesa_pnla", label: "AGENAS PNLA" }
    ], "Boxplot calcolato sui punti selezionati dai filtri del boxplot, non dai filtri del grafico a barre sopra. L'indice qualita e uno z-score descrittivo calcolato dentro ogni box: almeno +1 DS indica performance migliore della media del proprio box, almeno -1 DS performance peggiore. Per i giorni valori piu bassi sono migliori; per le percentuali valori piu alti sono migliori. I file struttura PNLA non pubblicano la provincia, quindi non e disponibile il box per province. " + waitingPriorityThresholdNote({
      year: (STATE.payload.kpis || {}).pnla_structure_year || waitingStructureYear(),
      region: STATE.waitingStructureBoxRegion === "all" ? null : STATE.waitingStructureBoxRegion,
      serviceType: STATE.waitingStructureBoxServiceType,
      service: STATE.waitingStructureBoxService,
      priority: STATE.waitingStructureBoxPriority,
      regime: "institutional",
      access: "first"
    }, config));
    createTable("hiWaitingStructureQualityTable", rows, [
      ["group_label", labels.group],
      ["point_label", labels.point],
      ["region", "Regione"],
      ["service_type", "Tipo prestazione"],
      ["service", "Prestazione"],
      ["structure", "Struttura"],
      ["bookings", "Prenotazioni"],
      ["selected_value_text", config.label],
      ["quality_mean_text", "Media box"],
      ["quality_sd_text", "Deviazione standard"],
      ["quality_score_text", "Indice qualita"],
      ["quality_status", "Lettura"],
      ["within_target_percent", "% entro soglia"],
      ["mean_first_available_days", "Giorni prima disponibilita"],
      ["mean_accepted_wait_days", "Giorni appuntamento"]
    ], 160);
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
    setSubtitle("hiWaitingServiceSubtitle", "Ogni barra e una prestazione nel territorio selezionato. Il grafico serve a capire quali visite o esami risultano piu lenti, piu veloci o piu voluminosi con la misura scelta. Filtro: " + waitingPriorityText(STATE.waitingServicePriority) + ", " + waitingRegimeText(STATE.waitingServiceRegime) + ", " + waitingAccessText(STATE.waitingServiceAccess) + ".");
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
    ], waitingSourceNote(settings, "Il grafico ordina le prestazioni secondo la misura selezionata: per i giorni mostra le attese piu lunghe, per le percentuali mette in evidenza le quote piu basse di rispetto dei tempi, per le prenotazioni mostra i volumi. La tabella sotto aggiunge prenotazioni, rispetto soglia e tempi medi. " + waitingPriorityThresholdNote(settings, config)));
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
    setSubtitle("hiWaitingTrendSubtitle", "Ogni punto e un mese dell'anno disponibile nel payload. La serie mostra direzione e oscillazioni della misura scelta per la stessa prestazione e priorita: " + serviceText + ", " + waitingPriorityText(STATE.waitingTrendPriority) + ", Istituzionale, Primo accesso.");
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
    ], "Anno " + asText(trendYear) + ", Territorio: " + STATE.waitingTrendRegion + ", " + serviceText + ", " + waitingPriorityText(STATE.waitingTrendPriority) + ", Istituzionale, Primo accesso. La serie serve a seguire la direzione nel tempo, non a stimare la mobilita sanitaria origine-destinazione. " + waitingPriorityThresholdNote({
      year: trendYear,
      region: STATE.waitingTrendRegion,
      service: serviceId,
      priority: STATE.waitingTrendPriority,
      regime: "institutional",
      access: "first"
    }, config));
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
    renderMortalityQualityChart();
    renderMortalityDetailTrendChart();
  }

  function mortalityQualitySpec() {
    if (STATE.mortalityQualityLayout === "cause_region") {
      return {
        group: "cause",
        point: "region",
        groupLabel: "Causa",
        pointLabel: "Regione",
        title: "Indice mortalita - box cause, punti regioni",
        subtitle: "Ogni box e una causa ICD-10; ogni punto e una regione o provincia autonoma."
      };
    }
    return {
      group: "region",
      point: "cause",
      groupLabel: "Regione",
      pointLabel: "Causa",
      title: "Indice mortalita - box regioni, punti cause",
      subtitle: "Ogni box e una regione o provincia autonoma; ogni punto e una causa ICD-10 del gruppo selezionato."
    };
  }

  function mortalityQualityPlotCopy(spec) {
    var english = currentLanguageIsEnglish();
    return {
      groupLabel: english ? (spec.group === "cause" ? "Cause" : "Region") : spec.groupLabel,
      pointLabel: english ? (spec.point === "cause" ? "Cause" : "Region") : spec.pointLabel,
      yTitle: english ? "mortality index (standard deviations)" : "indice mortalita (deviazioni standard)",
      better: english ? "better: +1 SD" : "meglio: +1 DS",
      worse: english ? "worse: -1 SD" : "peggio: -1 DS",
      territory: english ? "Area" : "Territorio",
      cause: english ? "Cause" : "Causa",
      rate: english ? "Rate" : "Tasso",
      italy: english ? "Italy" : "Italia",
      diffItaly: english ? "Diff. Italy" : "Diff. Italia",
      index: english ? "Mortality index" : "Indice mortalita",
      reading: english ? "Reading" : "Lettura"
    };
  }

  function mortalityQualityDimension(row, dimension) {
    if (dimension === "region") return { key: row.territory, label: row.territory, territory: row.territory };
    if (dimension === "cause") return { key: row.cause_code, label: row.cause, cause_code: row.cause_code, cause: row.cause };
    return { key: "", label: "" };
  }

  function mortalityQualitySelectedCauseLabel() {
    if (STATE.mortalityQualityCause === "all") return "tutte le cause del gruppo";
    var cause = mortalityDetailCauseByCode(STATE.mortalityQualityCause);
    return cause ? cause.label : asText(STATE.mortalityQualityCause);
  }

  function mortalityQualitySourceRows() {
    var year = mortalityQualityYearValue(STATE.mortalityQualityYear, STATE.mortalityQualityGroup, STATE.mortalityQualityCause);
    return mortalityDetailRows().filter(function (row) {
      if (row.territory_type !== "region") return false;
      if (row.year !== year) return false;
      if (STATE.mortalityQualityGroup !== "all" && row.group !== STATE.mortalityQualityGroup) return false;
      if (STATE.mortalityQualityCause !== "all" && row.cause_code !== STATE.mortalityQualityCause) return false;
      return true;
    });
  }

  function mortalityQualityRows() {
    var spec = mortalityQualitySpec();
    var year = mortalityQualityYearValue(STATE.mortalityQualityYear, STATE.mortalityQualityGroup, STATE.mortalityQualityCause);
    var italyByCause = {};
    mortalityDetailRows().forEach(function (row) {
      if (row.territory !== "Italia" || row.year !== year) return;
      italyByCause[row.cause_code] = toNumber(row.value);
    });
    var causeStats = {};
    mortalityQualitySourceRows().forEach(function (row) {
      if (!causeStats[row.cause_code]) causeStats[row.cause_code] = { values: [] };
      var value = toNumber(row.value);
      if (value !== null) causeStats[row.cause_code].values.push(value);
    });
    Object.keys(causeStats).forEach(function (code) {
      causeStats[code].mean = mean(causeStats[code].values);
      causeStats[code].sd = standardDeviation(causeStats[code].values, causeStats[code].mean);
    });

    var rows = mortalityQualitySourceRows().map(function (row) {
      var stats = causeStats[row.cause_code] || {};
      var rate = toNumber(row.value);
      var score = rate !== null && stats.sd ? (stats.mean - rate) / stats.sd : null;
      var italy = italyByCause[row.cause_code];
      var group = mortalityQualityDimension(row, spec.group);
      var point = mortalityQualityDimension(row, spec.point);
      return Object.assign({}, row, {
        group_key: group.key,
        group_label: group.label,
        point_key: point.key,
        point_label: point.label,
        rate_value: rate,
        italy_value: italy,
        difference_from_italy: rate !== null && toNumber(italy) !== null ? rate - italy : null,
        index_mean: stats.mean,
        index_sd: stats.sd,
        selected_value: score,
        selected_value_text: score === null ? MISSING : formatSignedDecimal(score) + " DS",
        rate_value_text: formatMortalityDetailValue(rate),
        italy_value_text: toNumber(italy) === null ? MISSING : formatMortalityDetailValue(italy),
        difference_from_italy_text: rate !== null && toNumber(italy) !== null ? formatSignedDecimal(rate - italy) : MISSING,
        quality_score: score,
        quality_score_text: score === null ? MISSING : formatSignedDecimal(score) + " DS",
        quality_status: waitingQualityStatus(score)
      });
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });

    var groupStats = {};
    rows.forEach(function (row) {
      if (!groupStats[row.group_key]) groupStats[row.group_key] = { key: row.group_key, label: row.group_label, values: [] };
      groupStats[row.group_key].values.push(row.selected_value);
    });
    var groups = Object.keys(groupStats).map(function (key) {
      var group = groupStats[key];
      group.mean_value = mean(group.values);
      group.spread_value = standardDeviation(group.values, group.mean_value) || 0;
      return group;
    }).sort(function (a, b) {
      if (spec.group === "cause") return b.spread_value - a.spread_value || a.label.localeCompare(b.label);
      return (toNumber(a.mean_value) || 0) - (toNumber(b.mean_value) || 0);
    });
    var limit = spec.group === "region" ? groups.length : chartLimit(STATE.mortalityQualityLimit, 20);
    if (STATE.mortalityQualityLimit === "all") limit = groups.length;
    var groupOrder = groups.slice(0, limit).map(function (group) { return group.key; });
    var allowed = {};
    groupOrder.forEach(function (key) { allowed[key] = true; });
    rows = rows.filter(function (row) { return allowed[row.group_key]; });
    rows.groupLabels = groups.filter(function (group) { return allowed[group.key]; }).map(function (group) { return group.label; });
    return rows;
  }

  function renderMortalityQualitySummary(rows) {
    var container = byId("hiMortalityQualitySummary");
    clear(container);
    rows = toArray(rows);
    var values = rows.map(function (row) { return row.selected_value; });
    var avg = mean(values);
    var sd = standardDeviation(values, avg);
    var better = rows.filter(function (row) { return toNumber(row.selected_value) !== null && row.selected_value >= 1; });
    var worse = rows.filter(function (row) { return toNumber(row.selected_value) !== null && row.selected_value <= -1; }).sort(function (a, b) {
      return (toNumber(a.selected_value) || 0) - (toNumber(b.selected_value) || 0);
    });
    var focusRows = rows.filter(function (row) { return row.territory === STATE.mortalityQualityFocus; });
    var focusScore = mean(focusRows.map(function (row) { return row.selected_value; }));
    function labelList(list) {
      return list.slice(0, 3).map(function (row) {
        return compact(row.territory + " / " + row.cause, 46);
      }).join(", ");
    }
    [
      ["Punti nel boxplot", formatNumber(rows.length), "regioni x cause visualizzate"],
      ["Indice medio", avg === null ? MISSING : formatSignedDecimal(avg) + " DS", "media degli indici visualizzati"],
      ["Deviazione standard", sd === null ? MISSING : formatDecimal(sd) + " DS", "dispersione degli indici visualizzati"],
      ["Meglio della media", formatNumber(better.length), labelList(better) || "nessun punto oltre +1 DS"],
      ["Peggio della media", formatNumber(worse.length), labelList(worse) || "nessun punto sotto -1 DS"],
      ["Focus", STATE.mortalityQualityFocus, focusRows.length ? formatSignedDecimal(focusScore) + " DS medio su " + formatNumber(focusRows.length) + " punti" : "territorio non presente nei filtri"]
    ].forEach(function (item) {
      var card = create("div", "hi-profile-item");
      card.appendChild(create("span", "", item[0]));
      card.appendChild(create("strong", "", item[1]));
      card.appendChild(create("small", "", item[2]));
      container.appendChild(card);
    });
  }

  function renderMortalityQualityBoxplot(rows, spec) {
    rows = toArray(rows);
    if (rows.length < 2) {
      showEmptyChart("hiMortalityQualityChart", "Servono almeno due punti confrontabili per calcolare il boxplot");
      return;
    }
    var copy = mortalityQualityPlotCopy(spec);
    var groupLabels = rows.groupLabels || unique(rows.map(function (row) { return row.group_label; }));
    var traces = groupLabels.map(function (label) {
      var groupRows = rows.filter(function (row) { return row.group_label === label; });
      return {
        type: "box",
        name: compact(label, 32),
        x: groupRows.map(function () { return label; }),
        y: groupRows.map(function (row) { return row.selected_value; }),
        boxpoints: false,
        fillcolor: "rgba(160,160,160,.16)",
        line: { color: cssVar("--muted", "#b9b2aa") },
        marker: { color: cssVar("--muted", "#b9b2aa") },
        hoverinfo: "skip"
      };
    });
    traces.push({
      type: "scatter",
      mode: "markers",
      name: copy.pointLabel,
      x: rows.map(function (row) { return row.group_label; }),
      y: rows.map(function (row) { return row.selected_value; }),
      text: rows.map(function (row) { return row.point_label; }),
      customdata: rows.map(function (row) {
        return [row.group_label, row.point_label, row.territory, row.cause, row.cause_code, row.rate_value_text, row.italy_value_text, row.difference_from_italy_text, row.quality_score_text, row.quality_status];
      }),
      marker: {
        color: rows.map(function (row) { return row.territory === STATE.mortalityQualityFocus ? COLORS[0] : waitingQualityColor(row.selected_value); }),
        size: rows.map(function (row) { return row.territory === STATE.mortalityQualityFocus ? 12 : 7; }),
        opacity: .88,
        line: { color: cssVar("--panel", "#090909"), width: 1 }
      },
      hovertemplate: "<b>%{customdata[0]}</b><br>" + copy.pointLabel + ": %{customdata[1]}<br>" + copy.territory + ": %{customdata[2]}<br>" + copy.cause + ": %{customdata[3]} (%{customdata[4]})<br>" + copy.rate + ": %{customdata[5]}<br>" + copy.italy + ": %{customdata[6]}<br>" + copy.diffItaly + ": %{customdata[7]}<br>" + copy.index + ": %{customdata[8]}<br>" + copy.reading + ": %{customdata[9]}<extra></extra>"
    });
    plot("hiMortalityQualityChart", traces, {
      showlegend: false,
      margin: { t: 20, r: 30, b: 126, l: 86 },
      xaxis: {
        title: copy.groupLabel,
        tickangle: -35,
        automargin: true,
        categoryorder: "array",
        categoryarray: groupLabels
      },
      yaxis: { title: copy.yTitle },
      shapes: [
        { type: "line", xref: "paper", x0: 0, x1: 1, y0: 0, y1: 0, line: { color: COLORS[0], width: 2, dash: "dash" } },
        { type: "line", xref: "paper", x0: 0, x1: 1, y0: 1, y1: 1, line: { color: COLORS[3], width: 2, dash: "dot" } },
        { type: "line", xref: "paper", x0: 0, x1: 1, y0: -1, y1: -1, line: { color: COLORS[5], width: 2, dash: "dot" } }
      ],
      annotations: [
        { xref: "paper", yref: "y", x: 1, y: 1, xanchor: "right", yanchor: "bottom", text: copy.better, showarrow: false, font: { size: 11, color: COLORS[3] } },
        { xref: "paper", yref: "y", x: 1, y: -1, xanchor: "right", yanchor: "top", text: copy.worse, showarrow: false, font: { size: 11, color: COLORS[5] } }
      ]
    });
  }

  function renderMortalityQualityChart() {
    var spec = mortalityQualitySpec();
    var year = mortalityQualityYearValue(STATE.mortalityQualityYear, STATE.mortalityQualityGroup, STATE.mortalityQualityCause);
    var rows = mortalityQualityRows();
    var groupLabel = mortalityDetailGroups().find(function (group) { return group.value === STATE.mortalityQualityGroup; });
    var title = byId("hiMortalityQualityTitle");
    if (title) title.textContent = spec.title + " - " + (groupLabel ? groupLabel.label : STATE.mortalityQualityGroup);
    setSubtitle("hiMortalityQualitySubtitle", spec.subtitle + " L'indice confronta ogni punto con la media regionale della stessa causa nello stesso anno: valori positivi indicano tassi piu bassi della media, valori negativi tassi piu alti. Filtro: " + mortalityQualitySelectedCauseLabel() + ".");
    setTag("hiMortalityQualityTag", "Eurostat " + asText(year) + " - +/-1 DS");
    renderMortalityQualitySummary(rows);
    renderMortalityQualityBoxplot(rows, spec);
    createTable("hiMortalityQualityTable", rows, [
      ["group_label", spec.groupLabel],
      ["point_label", spec.pointLabel],
      ["territory", "Territorio"],
      ["cause", "Causa"],
      ["cause_code", "ICD-10"],
      ["year", "Anno"],
      ["rate_value_text", "Tasso standardizzato"],
      ["italy_value_text", "Italia"],
      ["difference_from_italy_text", "Diff. Italia"],
      ["quality_score_text", "Indice mortalita"],
      ["quality_status", "Lettura"]
    ], 160);
    setChartCredit("hiMortalityQualityNote", [
      { id: "eurostat_mortality_detail", label: "Eurostat hlth_cd_asdr2" }
    ], "Anno " + asText(year) + ", gruppo: " + (groupLabel ? groupLabel.label : STATE.mortalityQualityGroup) + ", causa: " + mortalityQualitySelectedCauseLabel() + ". L'indice e uno z-score descrittivo calcolato separatamente per ogni causa sui territori regionali disponibili: +1 DS o piu indica un tasso almeno una deviazione standard sotto la media regionale della stessa causa; -1 DS o meno indica un tasso sopra la media. La fonte misura mortalita per residenza e causa ICD-10, non mortalita post-intervento PNE, non qualita clinica risk-adjusted dell'ospedale e non flussi di pazienti.");
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

  function pneSourceId(code) {
    return "agenas_pne_indicator_" + asText(code);
  }

  function pneIndicatorLabel(code) {
    var indicator = pneIndicatorByCode(code);
    return indicator ? indicator.indicator_label : "indicatore PNE " + asText(code);
  }

  function pneDisplayIndicatorLabel(code) {
    if (currentLanguageIsEnglish() && String(code) === "727") {
      return "Pancreatic cancer resection surgery: 90-day mortality";
    }
    return pneIndicatorLabel(code);
  }

  function pneShortIndicatorLabel(code) {
    var indicator = pneIndicatorByCode(code);
    return indicator ? indicator.indicator_short_label : pneIndicatorLabel(code);
  }

  function pneMetricLabel(config) {
    if (!currentLanguageIsEnglish()) return config.label;
    var labels = {
      success_rate_adjusted_percent: "Adjusted success",
      mortality_adjusted_percent: "Adjusted mortality",
      success_rate_raw_percent: "Crude success",
      mortality_raw_percent: "Crude mortality",
      cases: "Cases in cohort",
      events: "Observed events"
    };
    return labels[config.field] || config.label;
  }

  function pneMetricNoteText(config) {
    if (!currentLanguageIsEnglish()) return config.note;
    var notes = {
      success_rate_adjusted_percent: "derived as 100 minus PNE adjusted mortality",
      mortality_adjusted_percent: "risk-adjusted mortality published by PNE",
      success_rate_raw_percent: "derived as 100 minus crude mortality, not risk-adjusted",
      mortality_raw_percent: "observed mortality, not risk-adjusted",
      cases: "the denominator of the cohort used for the outcome",
      events: "the observed numerator in the cohort, not risk-adjusted"
    };
    return notes[config.field] || config.note;
  }

  function pneSelectedRows(indicatorCode, region, minCases) {
    var minValue = toNumber(minCases);
    return pneRows().filter(function (row) {
      if (indicatorCode !== "all" && String(row.indicator_code) !== String(indicatorCode)) return false;
      if (region && region !== "Italia" && row.region !== region) return false;
      if (minValue !== null && (toNumber(row.cases) || 0) < minValue) return false;
      return true;
    });
  }

  function pneRowsWithMetric(rows, config) {
    return toArray(rows).map(function (row) {
      var copy = Object.assign({}, row);
      copy.selected_value = toNumber(row[config.field]);
      copy.selected_value_text = config.format(copy.selected_value);
      copy.mortality_adjusted_text = formatPercent(row.mortality_adjusted_percent);
      copy.mortality_raw_text = formatPercent(row.mortality_raw_percent);
      copy.success_adjusted_text = formatPercent(row.success_rate_adjusted_percent);
      copy.success_raw_text = formatPercent(row.success_rate_raw_percent);
      copy.cases_text = formatNumber(row.cases);
      copy.events_text = formatNumber(row.events);
      copy.annual_volume_text = toNumber(row.annual_volume_latest) === null ? MISSING : formatNumber(row.annual_volume_latest);
      return copy;
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null;
    });
  }

  function sortPneMetricRows(rows, config) {
    return toArray(rows).sort(function (a, b) {
      var av = toNumber(a.selected_value);
      var bv = toNumber(b.selected_value);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return config.lowerBetter ? av - bv : bv - av;
    });
  }

  function ensureFocusRow(rows, allRows, focusStructure, limit) {
    var chartRows = rows.slice(0, limit);
    if (!focusStructure || focusStructure === "all") return chartRows;
    var focus = allRows.find(function (row) { return asText(row.structure_id) === asText(focusStructure); });
    if (!focus || toNumber(focus.selected_value) === null) return chartRows;
    if (chartRows.some(function (row) { return asText(row.structure_id) === asText(focusStructure); })) return chartRows;
    if (chartRows.length >= limit && chartRows.length) chartRows[chartRows.length - 1] = focus;
    else chartRows.push(focus);
    return chartRows;
  }

  function renderPneOutcomeSummary(rows, baseRows, config) {
    var container = byId("hiPneOutcomeSummary");
    clear(container);
    rows = toArray(rows);
    baseRows = toArray(baseRows);
    var best = rows[0] || null;
    var worst = rows.length ? rows[rows.length - 1] : null;
    var focus = STATE.pneOutcomeFocusStructure === "all" ? null : baseRows.find(function (row) {
      return asText(row.structure_id) === asText(STATE.pneOutcomeFocusStructure);
    });
    function focusValue() {
      if (!focus) return "nessuna";
      var value = toNumber(focus[config.field]);
      if (value === null) return "ND per la misura";
      return config.format(value);
    }
    [
      ["Strutture confrontate", formatNumber(rows.length), "con dato disponibile per " + config.label],
      ["Migliore", best ? compact(best.structure, 40) : MISSING, best ? config.format(best.selected_value) + " - " + best.region : "nessun dato"],
      ["Peggiore", worst ? compact(worst.structure, 40) : MISSING, worst ? config.format(worst.selected_value) + " - " + worst.region : "nessun dato"],
      ["Focus struttura", focus ? compact(focus.structure, 40) : "nessuna", focus ? focusValue() + "; casi " + formatNumber(focus.cases) : "seleziona una struttura"],
      ["Casi minimi", STATE.pneOutcomeMinCases === "0" ? "nessuna soglia" : formatNumber(STATE.pneOutcomeMinCases), "soglia sul denominatore della coorte PNE"]
    ].forEach(function (item) {
      var card = create("div", "hi-profile-item");
      card.appendChild(create("span", "", item[0]));
      card.appendChild(create("strong", "", item[1]));
      card.appendChild(create("small", "", item[2]));
      container.appendChild(card);
    });
  }

  function pneOutcomeNote(indicator, config, rows) {
    var parts = [];
    var english = currentLanguageIsEnglish();
    if (english) {
      parts.push("PNE edition " + asText(indicator && indicator.edition) + ", indicator " + asText(indicator && indicator.indicator_code) + ": " + pneDisplayIndicatorLabel(indicator && indicator.indicator_code) + ".");
      parts.push("The chart uses " + pneMetricNoteText(config) + " and shows only facilities with at least " + (STATE.pneOutcomeMinCases === "0" ? "one case" : formatNumber(STATE.pneOutcomeMinCases) + " cases") + " in the cohort.");
      if (indicator && String(indicator.indicator_code) === "727") {
        parts.push("For pancreatic resection, PNE 2025 measures 90-day mortality on a three-year cohort; the annual volume, where shown, comes from PNE indicator 728.");
      }
      parts.push("Missing or unpublished adjusted values are not treated as zero. Outcomes are attributed to the PNE facility, not to the patient's region of residence.");
      if (!rows.length) parts.push("The current selection has no comparable points: lower the case threshold or choose a crude measure.");
      return parts.join(" ");
    }
    parts.push("Edizione PNE " + asText(indicator && indicator.edition) + ", indicatore " + asText(indicator && indicator.indicator_code) + ": " + asText(indicator && indicator.indicator_label) + ".");
    parts.push("Il grafico usa " + config.note + " e mostra solo strutture con almeno " + (STATE.pneOutcomeMinCases === "0" ? "un caso" : formatNumber(STATE.pneOutcomeMinCases) + " casi") + " nella coorte.");
    if (indicator && String(indicator.indicator_code) === "727") {
      parts.push("Per la resezione pancreatica PNE 2025 misura la mortalita a 90 giorni su coorte triennale; il volume annuo, dove mostrato, viene dall'indicatore PNE 728.");
    }
    parts.push("Valori aggiustati mancanti o non pubblicabili non sono trattati come zero. Gli esiti sono attribuiti alla struttura PNE, non alla regione di residenza del paziente.");
    if (!rows.length) parts.push("La selezione corrente non ha punti confrontabili: abbassa la soglia casi o scegli una misura grezza.");
    return parts.join(" ");
  }

  function renderPneOutcomeChart() {
    var indicator = pneIndicatorByCode(STATE.pneOutcomeIndicator);
    var config = pneMetricConfig(STATE.pneOutcomeMetric);
    var baseRows = pneSelectedRows(STATE.pneOutcomeIndicator, STATE.pneOutcomeRegion, STATE.pneOutcomeMinCases);
    var metricRows = sortPneMetricRows(pneRowsWithMetric(baseRows, config), config);
    var limit = chartLimit(STATE.pneOutcomeLimit, 20);
    if (STATE.pneOutcomeLimit === "all") limit = metricRows.length;
    var chartRows = ensureFocusRow(metricRows, metricRows, STATE.pneOutcomeFocusStructure, limit);
    var english = currentLanguageIsEnglish();
    var metricLabel = pneMetricLabel(config);
    var title = byId("hiPneOutcomeTitle");
    if (title) title.textContent = (english ? "PNE hospital outcomes - " : "Esiti ospedalieri PNE - ") + metricLabel;
    setSubtitle("hiPneOutcomeSubtitle", english ?
      "Facility ranking. Indicator: " + pneDisplayIndicatorLabel(STATE.pneOutcomeIndicator) + ". Region: " + (STATE.pneOutcomeRegion === "Italia" ? "Italy" : STATE.pneOutcomeRegion) + ". The case threshold avoids fragile comparisons on very small volumes." :
      "Ranking per struttura: " + pneIndicatorLabel(STATE.pneOutcomeIndicator) + ". Regione: " + STATE.pneOutcomeRegion + ". La soglia casi evita confronti fragili su volumi molto piccoli.");
    setTag("hiPneOutcomeTag", "PNE " + asText(indicator && indicator.edition) + " - " + (english ? "indicator " : "indicatore ") + STATE.pneOutcomeIndicator);
    renderPneOutcomeSummary(metricRows, baseRows, config);
    if (chartRows.length) {
      horizontalBar("hiPneOutcomeChart", chartRows, "structure", "selected_value", {
        limit: chartRows.length,
        color: config.lowerBetter ? COLORS[5] : COLORS[3],
        highlightField: "structure_id",
        highlight: STATE.pneOutcomeFocusStructure,
        leftMargin: 250,
        labelLength: 46,
        xTitle: config.xTitle,
        format: config.format,
        hovertemplate: "%{customdata.structure}<br>%{customdata.city} (%{customdata.province}) - %{customdata.region}<br>" + config.label + ": %{text}<br>Casi: %{customdata.cases_text}<br>Eventi: %{customdata.events_text}<br>Mortalita agg.: %{customdata.mortality_adjusted_text}<br>Mortalita grezza: %{customdata.mortality_raw_text}<extra></extra>"
      });
    } else {
      showEmptyChart("hiPneOutcomeChart", "Nessuna struttura con dato disponibile per questa selezione");
    }
    setChartCredit("hiPneOutcomeNote", [
      { id: pneSourceId(STATE.pneOutcomeIndicator), label: "AGENAS PNE indicatore " + STATE.pneOutcomeIndicator }
    ], pneOutcomeNote(indicator, config, metricRows));
    createTable("hiPneOutcomeTable", metricRows, [
      ["indicator_code", "Indicatore"],
      ["indicator_short_label", "Esito"],
      ["region", "Regione"],
      ["province", "Provincia"],
      ["city", "Comune"],
      ["structure", "Struttura"],
      ["year", "Anno"],
      ["cases", "Casi/coorte"],
      ["events", "Eventi"],
      ["mortality_adjusted_percent", "Mortalita aggiustata"],
      ["success_rate_adjusted_percent", "Successo aggiustato"],
      ["mortality_raw_percent", "Mortalita grezza"],
      ["annual_volume_latest", "Volume annuo"]
    ], 120);
  }

  function pneQualitySpec() {
    if (STATE.pneQualityLayout === "indicator_structure") {
      return {
        group: "indicator",
        point: "structure",
        groupLabel: "Indicatore",
        pointLabel: "Struttura",
        title: "Indice PNE - box indicatori, punti strutture",
        subtitle: "Ogni box e un indicatore PNE; ogni punto e una struttura della regione selezionata o dell'Italia."
      };
    }
    if (STATE.pneQualityLayout === "structure_indicator") {
      return {
        group: "structure",
        point: "indicator",
        groupLabel: "Struttura",
        pointLabel: "Indicatore",
        title: "Indice PNE - box strutture, punti indicatori",
        subtitle: "Ogni box e una struttura; ogni punto e un indicatore PNE disponibile per quella struttura."
      };
    }
    return {
      group: "region",
      point: "structure",
      groupLabel: "Regione",
      pointLabel: "Struttura",
      title: "Indice PNE - box regioni, punti strutture",
      subtitle: "Ogni box e una regione; ogni punto e una struttura per l'indicatore PNE selezionato."
    };
  }

  function pneQualityDimension(row, dimension) {
    if (dimension === "region") return { key: row.region, label: row.region };
    if (dimension === "indicator") return { key: String(row.indicator_code), label: row.indicator_short_label || row.indicator_label };
    if (dimension === "structure") return { key: row.structure_id, label: row.structure + (row.city ? " - " + row.city : "") };
    return { key: "", label: "" };
  }

  function pneQualityRows() {
    var config = pneQualityMetricConfig(STATE.pneQualityMetric);
    var spec = pneQualitySpec();
    var baseRows = pneSelectedRows(STATE.pneQualityIndicator, STATE.pneQualityRegion, STATE.pneQualityMinCases);
    var metricRows = pneRowsWithMetric(baseRows, config);
    var statsByIndicator = {};
    metricRows.forEach(function (row) {
      var key = String(row.indicator_code);
      if (!statsByIndicator[key]) statsByIndicator[key] = { values: [] };
      if (toNumber(row.selected_value) !== null) statsByIndicator[key].values.push(row.selected_value);
    });
    Object.keys(statsByIndicator).forEach(function (key) {
      var stats = statsByIndicator[key];
      stats.mean = mean(stats.values);
      stats.sd = standardDeviation(stats.values, stats.mean);
    });
    var rows = metricRows.map(function (row) {
      var stats = statsByIndicator[String(row.indicator_code)] || {};
      var raw = toNumber(row.selected_value);
      var rawScore = raw !== null && stats.sd ? (raw - stats.mean) / stats.sd : null;
      var score = rawScore === null ? null : rawScore * (config.lowerBetter ? -1 : 1);
      var group = pneQualityDimension(row, spec.group);
      var point = pneQualityDimension(row, spec.point);
      return Object.assign({}, row, {
        group_key: group.key,
        group_label: group.label,
        point_key: point.key,
        point_label: point.label,
        raw_value: raw,
        raw_value_text: config.format(raw),
        indicator_mean: stats.mean,
        indicator_sd: stats.sd,
        selected_value: score,
        selected_value_text: score === null ? MISSING : formatSignedDecimal(score) + " DS",
        quality_score: score,
        quality_score_text: score === null ? MISSING : formatSignedDecimal(score) + " DS",
        quality_status: waitingQualityStatus(score)
      });
    }).filter(function (row) {
      return toNumber(row.selected_value) !== null && row.group_key;
    });

    var groupStats = {};
    rows.forEach(function (row) {
      if (!groupStats[row.group_key]) groupStats[row.group_key] = { key: row.group_key, label: row.group_label, values: [] };
      groupStats[row.group_key].values.push(row.selected_value);
    });
    var groups = Object.keys(groupStats).map(function (key) {
      var group = groupStats[key];
      group.mean_value = mean(group.values);
      group.count = group.values.length;
      return group;
    }).sort(function (a, b) {
      return (toNumber(b.mean_value) || 0) - (toNumber(a.mean_value) || 0) || b.count - a.count || a.label.localeCompare(b.label);
    });
    var limit = chartLimit(STATE.pneQualityLimit, 20);
    if (STATE.pneQualityLimit === "all") limit = groups.length;
    if (spec.group === "region" && STATE.pneQualityRegion === "Italia") limit = groups.length;
    var allowed = {};
    groups.slice(0, limit).forEach(function (group) { allowed[group.key] = true; });
    rows = rows.filter(function (row) { return allowed[row.group_key]; });
    rows.groupLabels = groups.filter(function (group) { return allowed[group.key]; }).map(function (group) { return group.label; });
    return rows;
  }

  function renderPneQualitySummary(rows) {
    var container = byId("hiPneQualitySummary");
    clear(container);
    rows = toArray(rows);
    var better = rows.filter(function (row) { return toNumber(row.selected_value) !== null && row.selected_value >= 1; });
    var worse = rows.filter(function (row) { return toNumber(row.selected_value) !== null && row.selected_value <= -1; }).sort(function (a, b) {
      return (toNumber(a.selected_value) || 0) - (toNumber(b.selected_value) || 0);
    });
    var focusRows = STATE.pneQualityFocusStructure === "all" ? [] : rows.filter(function (row) {
      return asText(row.structure_id) === asText(STATE.pneQualityFocusStructure);
    });
    var focusScore = mean(focusRows.map(function (row) { return row.selected_value; }));
    function labelList(list) {
      return list.slice(0, 3).map(function (row) {
        return compact(row.structure + " / " + row.indicator_short_label, 54);
      }).join(", ");
    }
    [
      ["Punti nel boxplot", formatNumber(rows.length), "strutture x indicatori visualizzati"],
      ["Meglio della media", formatNumber(better.length), labelList(better) || "nessun punto oltre +1 DS"],
      ["Peggio della media", formatNumber(worse.length), labelList(worse) || "nessun punto sotto -1 DS"],
      ["Focus struttura", STATE.pneQualityFocusStructure === "all" ? "nessuna" : (focusRows[0] ? compact(focusRows[0].structure, 42) : "non presente"), focusRows.length ? formatSignedDecimal(focusScore) + " DS medio su " + formatNumber(focusRows.length) + " punti" : "seleziona una struttura"],
      ["Casi minimi", STATE.pneQualityMinCases === "0" ? "nessuna soglia" : formatNumber(STATE.pneQualityMinCases), "soglia sul denominatore della coorte PNE"]
    ].forEach(function (item) {
      var card = create("div", "hi-profile-item");
      card.appendChild(create("span", "", item[0]));
      card.appendChild(create("strong", "", item[1]));
      card.appendChild(create("small", "", item[2]));
      container.appendChild(card);
    });
  }

  function renderPneQualityBoxplot(rows, spec) {
    rows = toArray(rows);
    if (rows.length < 2) {
      showEmptyChart("hiPneQualityChart", "Servono almeno due punti confrontabili per calcolare il boxplot PNE");
      return;
    }
    var groupLabels = rows.groupLabels || unique(rows.map(function (row) { return row.group_label; }));
    var traces = groupLabels.map(function (label) {
      var groupRows = rows.filter(function (row) { return row.group_label === label; });
      return {
        type: "box",
        name: compact(label, 32),
        x: groupRows.map(function () { return label; }),
        y: groupRows.map(function (row) { return row.selected_value; }),
        boxpoints: false,
        fillcolor: "rgba(160,160,160,.16)",
        line: { color: cssVar("--muted", "#b9b2aa") },
        marker: { color: cssVar("--muted", "#b9b2aa") },
        hoverinfo: "skip"
      };
    });
    traces.push({
      type: "scatter",
      mode: "markers",
      name: spec.pointLabel,
      x: rows.map(function (row) { return row.group_label; }),
      y: rows.map(function (row) { return row.selected_value; }),
      text: rows.map(function (row) { return row.point_label; }),
      customdata: rows.map(function (row) {
        return [row.group_label, row.point_label, row.structure, row.city, row.region, row.indicator_short_label, row.raw_value_text, row.quality_score_text, row.quality_status, row.cases_text, row.events_text];
      }),
      marker: {
        color: rows.map(function (row) { return STATE.pneQualityFocusStructure !== "all" && asText(row.structure_id) === asText(STATE.pneQualityFocusStructure) ? COLORS[0] : waitingQualityColor(row.selected_value); }),
        size: rows.map(function (row) { return STATE.pneQualityFocusStructure !== "all" && asText(row.structure_id) === asText(STATE.pneQualityFocusStructure) ? 12 : 7; }),
        opacity: .88,
        line: { color: cssVar("--panel", "#090909"), width: 1 }
      },
      hovertemplate: "<b>%{customdata[0]}</b><br>" + spec.pointLabel + ": %{customdata[1]}<br>Struttura: %{customdata[2]} - %{customdata[3]}<br>Regione: %{customdata[4]}<br>Indicatore: %{customdata[5]}<br>Valore: %{customdata[6]}<br>Indice PNE: %{customdata[7]}<br>Lettura: %{customdata[8]}<br>Casi: %{customdata[9]}<br>Eventi: %{customdata[10]}<extra></extra>"
    });
    plot("hiPneQualityChart", traces, {
      showlegend: false,
      margin: { t: 20, r: 30, b: 126, l: 86 },
      xaxis: {
        title: spec.groupLabel,
        tickangle: -35,
        automargin: true,
        categoryorder: "array",
        categoryarray: groupLabels
      },
      yaxis: { title: "indice PNE (deviazioni standard)" },
      shapes: [
        { type: "line", xref: "paper", x0: 0, x1: 1, y0: 0, y1: 0, line: { color: COLORS[0], width: 2, dash: "dash" } },
        { type: "line", xref: "paper", x0: 0, x1: 1, y0: 1, y1: 1, line: { color: COLORS[3], width: 2, dash: "dot" } },
        { type: "line", xref: "paper", x0: 0, x1: 1, y0: -1, y1: -1, line: { color: COLORS[5], width: 2, dash: "dot" } }
      ],
      annotations: [
        { xref: "paper", yref: "y", x: 1, y: 1, xanchor: "right", yanchor: "bottom", text: "meglio: +1 DS", showarrow: false, font: { size: 11, color: COLORS[3] } },
        { xref: "paper", yref: "y", x: 1, y: -1, xanchor: "right", yanchor: "top", text: "peggio: -1 DS", showarrow: false, font: { size: 11, color: COLORS[5] } }
      ]
    });
  }

  function renderPneQualityChart() {
    var spec = pneQualitySpec();
    var config = pneQualityMetricConfig(STATE.pneQualityMetric);
    var rows = pneQualityRows();
    var title = byId("hiPneQualityTitle");
    if (title) title.textContent = spec.title + " - " + config.label;
    setSubtitle("hiPneQualitySubtitle", spec.subtitle + " L'indice e calcolato separatamente per ogni indicatore: valori positivi indicano performance migliore della media dello stesso indicatore, valori negativi peggiore.");
    setTag("hiPneQualityTag", "PNE 2025 - +/-1 DS");
    renderPneQualitySummary(rows);
    renderPneQualityBoxplot(rows, spec);
    createTable("hiPneQualityTable", rows, [
      ["group_label", spec.groupLabel],
      ["point_label", spec.pointLabel],
      ["region", "Regione"],
      ["province", "Provincia"],
      ["city", "Comune"],
      ["structure", "Struttura"],
      ["indicator_short_label", "Indicatore"],
      ["raw_value_text", config.label],
      ["cases", "Casi/coorte"],
      ["events", "Eventi"],
      ["quality_score_text", "Indice PNE"],
      ["quality_status", "Lettura"]
    ], 160);
    setChartCredit("hiPneQualityNote", [
      { id: "agenas_pne_outcomes", label: "AGENAS PNE" }
    ], "Vista: " + spec.groupLabel + " / " + spec.pointLabel + ". Misura: " + config.label + ". L'indice e uno z-score descrittivo sui dati PNE disponibili: +1 DS o piu indica performance migliore della media dello stesso indicatore; -1 DS o meno performance peggiore. I confronti restano descrittivi e vanno letti con casi, eventi, intervalli di confidenza e protocollo PNE.");
  }

  function renderPneVolumeTrendChart() {
    var trendRows = pneVolumeTrendRows().filter(function (row) {
      return String(row.indicator_code) === "728";
    });
    if (!trendRows.length) {
      showEmptyChart("hiPneVolumeTrendChart", "Storico volumi PNE non disponibile nel dataset");
      return;
    }
    var national = {};
    trendRows.forEach(function (row) {
      var year = toNumber(row.year);
      if (year === null) return;
      if (!national[year]) national[year] = { year: year, annual_volume: 0 };
      national[year].annual_volume += toNumber(row.annual_volume) || 0;
    });
    var nationalRows = Object.keys(national).map(function (year) { return national[year]; }).sort(function (a, b) { return a.year - b.year; });
    var focusRows = STATE.pneOutcomeFocusStructure === "all" ? [] : trendRows.filter(function (row) {
      return asText(row.structure_id) === asText(STATE.pneOutcomeFocusStructure);
    }).sort(function (a, b) { return a.year - b.year; });
    var focusName = focusRows[0] ? focusRows[0].structure : "";
    var traces = [{
      type: "scatter",
      mode: "lines+markers",
      name: "Italia",
      x: nationalRows.map(function (row) { return row.year; }),
      y: nationalRows.map(function (row) { return toNumber(row.annual_volume); }),
      text: nationalRows.map(function (row) { return formatNumber(row.annual_volume); }),
      line: { color: COLORS[1], width: 3 },
      marker: { size: 8 },
      hovertemplate: "%{x}<br>Italia: %{text} ricoveri<extra></extra>"
    }];
    if (focusRows.length) {
      traces.push({
        type: "scatter",
        mode: "lines+markers",
        name: focusName,
        x: focusRows.map(function (row) { return row.year; }),
        y: focusRows.map(function (row) { return toNumber(row.annual_volume); }),
        text: focusRows.map(function (row) { return formatNumber(row.annual_volume); }),
        line: { color: COLORS[0], width: 3 },
        marker: { size: 8 },
        hovertemplate: "%{x}<br>" + focusName + ": %{text} ricoveri<extra></extra>"
      });
    }
    var years = nationalRows.map(function (row) { return row.year; });
    var title = byId("hiPneVolumeTrendTitle");
    if (title) title.textContent = "Storico PNE volumi pancreas" + (focusName ? " - " + focusName : "");
    setSubtitle("hiPneVolumeTrendSubtitle", "Ricoveri annui dell'indicatore PNE 728 per resezione pancreatica per tumore maligno. Il confronto con la struttura evidenziata appare quando selezioni una struttura nel grafico sopra.");
    setTag("hiPneVolumeTrendTag", years.length ? Math.min.apply(null, years) + "-" + Math.max.apply(null, years) : "PNE");
    lineChart("hiPneVolumeTrendChart", traces, {
      yTitle: "ricoveri annui",
      xAxis: { title: "anno", tickmode: "linear", dtick: 1 }
    });
    setChartCredit("hiPneVolumeTrendNote", [
      { id: "agenas_pne_indicator_728", label: "AGENAS PNE indicatore 728" }
    ], "La serie storica e sui volumi annui di ricoveri per resezione pancreatica per tumore maligno; non misura direttamente mortalita, successo clinico o mobilita sanitaria origine-destinazione.");
    var tableRowsValue = focusRows.length ? focusRows : nationalRows.map(function (row) {
      return { year: row.year, structure: "Italia", annual_volume: row.annual_volume };
    });
    createTable("hiPneVolumeTrendTable", tableRowsValue, [
      ["year", "Anno"],
      ["structure", "Struttura"],
      ["annual_volume", "Ricoveri"]
    ], 80);
  }

  function renderPneOutcomes() {
    renderPneOutcomeChart();
    renderPneQualityChart();
    renderPneVolumeTrendChart();
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
    renderHospitalProfile();
  }

  function selectedHospitalProfileSummary() {
    return hospitalProfileStructureRows().find(function (row) {
      return row.key === STATE.hospitalProfileStructure;
    }) || null;
  }

  function selectedHospitalProfileDepartmentRows() {
    return tableRows("hospital_activity_by_discipline").filter(function (row) {
      return structureKey(row) === STATE.hospitalProfileStructure;
    });
  }

  function renderHospitalProfileCards(summary) {
    var container = byId("hiHospitalProfileCards");
    clear(container);
    if (!summary) return;
    [
      ["Dimissioni", formatNumber(summary.discharges), "attivita reparti " + asText(summary.year)],
      ["Reparti", formatNumber(summary.departments), "discipline pubblicate"],
      ["Posti letto ordinari", formatNumber(summary.ordinary_beds), "dotazione nel dataset reparti"],
      ["Degenza media", formatDecimal(summary.avg_los_days) + " giorni", "giornate / dimissioni"],
      ["Utilizzo PL", formatPercent(summary.bed_utilization_percent), "giornate su disponibilita"],
      ["Disciplina principale", summary.main_discipline || MISSING, formatNumber(summary.main_discipline_discharges) + " dimissioni"]
    ].forEach(function (item) {
      var card = create("div", "hi-profile-item");
      card.appendChild(create("span", "", item[0]));
      card.appendChild(create("strong", "", item[1]));
      card.appendChild(create("small", "", item[2]));
      container.appendChild(card);
    });
  }

  function hospitalProfilePsRows(summary) {
    if (!summary) return [];
    var structureName = normalizeLabel(summary.structure);
    var municipality = normalizeLabel(summary.municipality);
    var rows = tableRows("ps_structures").filter(function (row) {
      if (row.region !== summary.region) return false;
      if (summary.province && row.province !== summary.province) return false;
      return true;
    }).map(function (row) {
      var copy = Object.assign({}, row);
      var psName = normalizeLabel(row.structure);
      var sameCode = row.institute_code === summary.structure_code || row.structure_code === summary.structure_code;
      var sameMunicipality = municipality && normalizeLabel(row.municipality) === municipality;
      var nameOverlap = psName && structureName && structureName.split(" ").some(function (token) {
        return token.length > 4 && psName.indexOf(token) >= 0;
      });
      copy.match_score = sameCode ? 3 : (sameMunicipality && nameOverlap ? 2 : (sameMunicipality ? 1 : 0));
      copy.match_note = sameCode ? "codice struttura" : (sameMunicipality && nameOverlap ? "stesso comune e nome simile" : (sameMunicipality ? "stesso comune" : "stessa provincia"));
      return copy;
    }).filter(function (row) {
      return row.match_score > 0;
    }).sort(function (a, b) {
      return (b.match_score - a.match_score) || ((toNumber(b.accesses_total) || 0) - (toNumber(a.accesses_total) || 0));
    });
    return rows.slice(0, 8);
  }

  function hospitalProfileWaitingRows(summary) {
    if (!summary || !summary.region || !summary.structure_code) return [];
    var cached = WAITING_STRUCTURE_CACHE[summary.region];
    if (!cached) return null;
    return toArray(cached.rows).filter(function (row) {
      return row.structure_code === summary.structure_code;
    }).sort(function (a, b) {
      return (toNumber(b.bookings) || 0) - (toNumber(a.bookings) || 0);
    }).slice(0, 20);
  }

  function renderHospitalProfile() {
    var summary = selectedHospitalProfileSummary();
    var title = byId("hiHospitalProfileTitle");
    if (!summary) {
      if (title) title.textContent = "Scheda ospedale";
      clear(byId("hiHospitalProfileCards"));
      showEmptyChart("hiHospitalProfileDepartmentsChart", "Seleziona un ospedale");
      createTable("hiHospitalProfilePsTable", [], [["structure", "Pronto soccorso"], ["accesses_total", "Accessi"]], 8);
      createTable("hiHospitalProfileWaitingTable", [], [["service", "Prestazione"], ["bookings", "Prenotazioni"]], 20);
      return;
    }
    if (title) title.textContent = "Scheda ospedale - " + summary.structure;
    setSubtitle("hiHospitalProfileSubtitle", summary.region + ", " + summary.province + " - " + asText(summary.municipality) + ". La scheda aggrega le informazioni disponibili senza stimare dati mancanti.");
    setTag("hiHospitalProfileTag", "Ministero Salute " + asText(summary.year) + " - profilo struttura");
    renderHospitalProfileCards(summary);

    var departmentRows = sortDescending(selectedHospitalProfileDepartmentRows(), "discharges");
    horizontalBar("hiHospitalProfileDepartmentsChart", departmentRows, "discipline", "discharges", {
      limit: 12,
      color: COLORS[1],
      leftMargin: 230,
      labelLength: 42,
      xTitle: "dimissioni",
      format: formatNumber,
      hovertemplate: "%{y}<br>Dimissioni: %{text}<extra></extra>"
    });

    createTable("hiHospitalProfilePsTable", hospitalProfilePsRows(summary), [
      ["match_note", "Collegamento"],
      ["structure", "Pronto soccorso"],
      ["municipality", "Comune"],
      ["emergency_level", "Livello PS/DEA"],
      ["accesses_total", "Accessi"],
      ["mean_wait_hhmm", "Permanenza media"],
      ["triage_codes_available", "Codici pubblicati"]
    ], 8);

    var waitingRows = hospitalProfileWaitingRows(summary);
    if (waitingRows === null) {
      createTable("hiHospitalProfileWaitingTable", [], [
        ["service", "Prestazione"],
        ["bookings", "Prenotazioni"],
        ["mean_first_available_days", "Giorni prima disponibilita"]
      ], 20);
      loadWaitingStructureRegion(summary.region).then(function () {
        renderHospitalProfile();
        refreshSiteLanguage();
      });
    } else {
      createTable("hiHospitalProfileWaitingTable", waitingRows, [
        ["service", "Prestazione"],
        ["priority_label", "Priorita"],
        ["bookings", "Prenotazioni"],
        ["within_target_percent", "% entro soglia"],
        ["mean_first_available_days", "Giorni prima disponibilita"],
        ["mean_accepted_wait_days", "Giorni appuntamento"]
      ], 20);
    }
    setChartCredit("hiHospitalProfileNote", [
      { id: "ministero_attivita_reparti", label: "Ministero della Salute, attivita dei reparti" },
      { id: "agenas_trova_strutture_ps", label: "AGENAS Trova Strutture, Pronto Soccorso" },
      { id: "agenas_liste_attesa_pnla", label: "AGENAS PNLA" }
    ], "I reparti sono della struttura selezionata. Il pronto soccorso e collegato quando risulta nello stesso codice, comune o provincia; non e un join clinico. Le liste PNLA sono mostrate solo quando il codice struttura coincide nel file AGENAS della prima disponibilita proposta.");
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
    var allRows = toArray(tableRowsValue);
    var maxRows = limit ? Math.min(allRows.length, limit) : allRows.length;
    var collapsedLimit = 10;
    var expanded = Boolean(TABLE_EXPANDED[containerId]);
    var visibleLimit = expanded ? maxRows : Math.min(collapsedLimit, maxRows);
    var rows = allRows.slice(0, visibleLimit);
    columns = columns && columns.length ? columns : inferColumns(allRows);

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

    if (maxRows > collapsedLimit) {
      var actions = create("div", "hi-table-actions");
      var count = create("span", "", (expanded ? "Mostrate " : "Mostrate le prime ") + formatNumber(visibleLimit) + " di " + formatNumber(maxRows) + " righe");
      var button = create("button", "hi-table-toggle", expanded ? "Mostra meno" : "Mostra tutto");
      button.type = "button";
      button.addEventListener("click", function () {
        TABLE_EXPANDED[containerId] = !expanded;
        createTable(containerId, allRows, columns, limit);
        refreshSiteLanguage();
      });
      actions.appendChild(count);
      actions.appendChild(button);
      container.appendChild(actions);
    }
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
    refreshMortalityDetailFilters();
    refreshPneFilters();
    refreshDischargeStructureFilter();
    refreshPsStructureFilter();
    refreshHospitalDepartmentStructureFilter();
    refreshHospitalProfileStructureFilter();
    renderNationalCharts();
    renderPsEmergency();
    renderWaitingLists();
    renderHealth();
    renderMortality();
    renderPneOutcomes();
    renderRegionalRank();
    renderRegionProfile();
    renderRegionalSummaryTable();
    renderDiscipline();
    renderCosts();
    renderSeries();
    renderHospitals();
    renderMobility();
    renderExplorer();
    syncFilterUrl();
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
      STATE.payloadSource = DATA_SOURCES[index];
      var generated = payload.meta && payload.meta.generated_at ? payload.meta.generated_at.replace("T", " ").replace("+00:00", " UTC") : "";
      setStatus("Dati caricati: " + generated);
      renderAll();
    }).catch(function () {
      loadPayload(index + 1);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyUrlFilters();
    bindControls();
    loadPayload(0);
  });
})();
