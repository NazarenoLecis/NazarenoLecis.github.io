(function () {
  var META = "../../data/almalaurea/almalaurea_metadata.json";
  var CHUNKS = "../../data/almalaurea/dashboard_chunks/";
  var TIMESERIES = "../../data/almalaurea/almalaurea_timeseries_aggregated_data.json";
  var W = "*";
  var params = new URLSearchParams(window.location.search);
  var embed = params.get("embed") === "1";
  var state = { meta: null, rows: [], chunks: {}, timeseries: null, lastPoints: [] };
  var palette = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
  if (embed) document.documentElement.classList.add("embed-mode");

  function byId(id) { return document.getElementById(id); }
  function text(v) { return v == null ? "" : String(v); }
  function num(v) { var n = Number(v); return Number.isFinite(n) ? n : null; }
  function esc(v) { return text(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;"); }
  function css(name, fallback) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; }
  function fmtInt(v) { return Number.isFinite(v) ? Math.round(v).toLocaleString("it-IT") : "-"; }
  function fmtPct(v) { return Number.isFinite(v) ? v.toLocaleString("it-IT", { maximumFractionDigits: 1 }) + "%" : "-"; }
  function fmtEuro(v) { return Number.isFinite(v) ? Math.round(v).toLocaleString("it-IT") + " euro" : "-"; }

  function requestJson(url) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.timeout = 15000;
      xhr.onload = function () {
        if (xhr.status < 200 || xhr.status >= 300) return reject(new Error("HTTP " + xhr.status));
        try { resolve(JSON.parse(xhr.responseText)); }
        catch (error) { reject(error); }
      };
      xhr.onerror = function () { reject(new Error("errore di rete")); };
      xhr.ontimeout = function () { reject(new Error("oltre 15 secondi")); };
      xhr.send();
    });
  }

  function message(id, msg) {
    var el = byId(id);
    if (!el) return;
    if (window.Plotly && el.data) { try { window.Plotly.purge(el); } catch (error) {} }
    el.innerHTML = "<div class=\"empty-state\">" + esc(msg) + "</div>";
  }

  function opts(key) { return ((state.meta.filters && state.meta.filters[key]) || []).slice(); }
  function hasOption(select, value) { return select && Array.from(select.options).some(function (o) { return o.value === text(value); }); }
  function setSelect(id, value) { var s = byId(id); if (s && hasOption(s, value)) s.value = text(value); }

  function populate(id, key, wildcardLabel) {
    var s = byId(id);
    if (!s) return;
    var values = opts(key);
    if (wildcardLabel && !values.some(function (x) { return text(x.value) === W; })) values.unshift({ value: W, label: wildcardLabel });
    s.innerHTML = values.map(function (x) { return "<option value=\"" + esc(x.value) + "\">" + esc(x.label) + "</option>"; }).join("");
  }

  function populateFilters() {
    [["scatterSurveyYear", "survey_year"], ["scatterYearsAfter", "years_after_degree"], ["scatterGraduationYear", "graduation_year"], ["scatterDefinition", "employment_definition"], ["boxSurveyYear", "survey_year"], ["boxYearsAfter", "years_after_degree"], ["boxGraduationYear", "graduation_year"], ["boxDefinition", "employment_definition"], ["timeYearsAfter", "years_after_degree"], ["timeDefinition", "employment_definition"]].forEach(function (x) { populate(x[0], x[1]); });
    [["scatterUniversity", "university", "Tutti gli atenei"], ["scatterGroup", "disciplinary_group", "Tutti i gruppi"], ["scatterCourse", "course_type", "Tutti i tipi di corso"], ["scatterDegree", "degree_class", "Tutte le classi"], ["boxUniversity", "university", "Tutti gli atenei"], ["boxGroup", "disciplinary_group", "Tutti i gruppi"], ["boxCourse", "course_type", "Tutti i tipi di corso"], ["timeUniversity", "university", "Tutti gli atenei"], ["timeGroup", "disciplinary_group", "Tutti i gruppi"], ["timeCourse", "course_type", "Tutti i tipi di corso"]].forEach(function (x) { populate(x[0], x[1], x[2]); });
    var years = state.meta.timeseries_years || [];
    ["timeStartYear", "timeEndYear"].forEach(function (id) { var s = byId(id); if (s) s.innerHTML = years.map(function (y) { return "<option value=\"" + y + "\">" + y + "</option>"; }).join(""); });
    var cohorts = state.meta.graduation_years || [];
    var c = byId("timeCohort");
    if (c) c.innerHTML = cohorts.map(function (y) { return "<option value=\"" + y + "\">" + y + "</option>"; }).join("");
  }

  function defaultYearsAfter() { return opts("years_after_degree").some(function (x) { return Number(x.value) === 1; }) ? 1 : (opts("years_after_degree")[0] || {}).value; }
  function sync(prefix) { var s = num(byId(prefix + "SurveyYear").value), y = num(byId(prefix + "YearsAfter").value); if (Number.isFinite(s) && Number.isFinite(y)) setSelect(prefix + "GraduationYear", s - y); }
  function syncBack(prefix) { var s = num(byId(prefix + "SurveyYear").value), c = num(byId(prefix + "GraduationYear").value); if (Number.isFinite(s) && Number.isFinite(c)) setSelect(prefix + "YearsAfter", s - c); }

  function defaults() {
    ["scatter", "box"].forEach(function (p) {
      setSelect(p + "SurveyYear", state.meta.latest_survey_year);
      setSelect(p + "YearsAfter", defaultYearsAfter());
      sync(p);
      setSelect(p + "Definition", "broad");
      setSelect(p + "University", W);
      setSelect(p + "Group", W);
      setSelect(p + "Course", W);
    });
    setSelect("scatterDegree", W);
    setSelect("scatterPointDimension", "disciplinary_group");
    setSelect("boxSplitDimension", "disciplinary_group");
    var years = state.meta.timeseries_years || [];
    setSelect("timeMode", "fixed_horizon");
    setSelect("timeStartYear", years[0]);
    setSelect("timeEndYear", years[years.length - 1]);
    setSelect("timeYearsAfter", defaultYearsAfter());
    setSelect("timeCohort", state.meta.latest_survey_year - 5);
    setSelect("timeDefinition", "restrictive");
    setSelect("timeUniversity", W);
    setSelect("timeGroup", W);
    setSelect("timeCourse", W);
    setSelect("timePointDimension", "disciplinary_group");
    setSelect("timeMetric", "employment_rate");
  }

  function setFromQuery(id, names) { names.some(function (name) { if (!params.has(name)) return false; setSelect(id, params.get(name)); return true; }); }
  function applyQuery() {
    if (!params.toString()) return;
    setFromQuery("scatterSurveyYear", ["scatter_survey", "survey"]); setFromQuery("scatterYearsAfter", ["scatter_years", "years"]); setFromQuery("scatterGraduationYear", ["scatter_cohort", "cohort"]); setFromQuery("scatterDefinition", ["scatter_definition", "definition"]); setFromQuery("scatterUniversity", ["scatter_university", "university"]); setFromQuery("scatterGroup", ["scatter_group", "group"]); setFromQuery("scatterCourse", ["scatter_course", "course"]); setFromQuery("scatterDegree", ["scatter_degree", "degree"]); setFromQuery("scatterPointDimension", ["scatter_dimension", "dimension"]);
    setFromQuery("boxSurveyYear", ["box_survey", "survey"]); setFromQuery("boxYearsAfter", ["box_years", "years"]); setFromQuery("boxGraduationYear", ["box_cohort", "cohort"]); setFromQuery("boxDefinition", ["box_definition", "definition"]); setFromQuery("boxUniversity", ["box_university", "university"]); setFromQuery("boxGroup", ["box_group", "group"]); setFromQuery("boxCourse", ["box_course", "course"]); setFromQuery("boxSplitDimension", ["box_split", "split"]);
    setFromQuery("timeMode", ["time_mode", "mode"]); setFromQuery("timeStartYear", ["time_start", "start"]); setFromQuery("timeEndYear", ["time_end", "end"]); setFromQuery("timeYearsAfter", ["time_years", "years"]); setFromQuery("timeCohort", ["time_cohort", "cohort"]); setFromQuery("timeDefinition", ["time_definition", "definition"]); setFromQuery("timeUniversity", ["time_university", "university"]); setFromQuery("timeGroup", ["time_group", "group"]); setFromQuery("timeCourse", ["time_course", "course"]); setFromQuery("timePointDimension", ["time_dimension", "dimension"]); setFromQuery("timeMetric", ["time_metric", "metric"]);
  }

  function chartFromQuery() { var c = params.get("chart"); return c === "box" || c === "time" || c === "scatter" ? c : "scatter"; }
  function applyEmbed() { if (!embed) return; ["scatter", "box", "time"].forEach(function (k) { var s = byId(k + "Section"); if (s) s.classList.toggle("embed-active", k === chartFromQuery()); }); }

  function layout(extra) {
    return Object.assign({ paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: css("--text", "#f5f2ed"), family: "system-ui,-apple-system,Segoe UI,sans-serif", size: 14 }, margin: { l: 76, r: 28, t: 18, b: 70 }, xaxis: { gridcolor: css("--line", "#303030") }, yaxis: { gridcolor: css("--line", "#303030") }, legend: { orientation: "v", x: 1.02, y: 1, xanchor: "left" } }, extra || {});
  }
  function config() { return { responsive: true, displayModeBar: false, scrollZoom: false, doubleClick: false }; }

  function preview() {
    if (!window.Plotly) {
      message("scatterChart", "Anteprima statica. Cambia un filtro per caricare i dati."); message("boxChart", "Anteprima statica. Cambia un filtro per caricare i dati."); message("timeSeriesChart", "Anteprima statica. Cambia un filtro per caricare i dati."); return;
    }
    var pts = [{ l: "Medico-sanitario", s: 1672, e: 86.7 }, { l: "Ingegneria", s: 1635, e: 84 }, { l: "ICT", s: 1608, e: 71.9 }, { l: "Psicologico", s: 1220, e: 47.3 }, { l: "Scienze motorie", s: 1022, e: 64 }];
    Plotly.react("scatterChart", [{ type: "scatter", mode: "markers+text", name: "Anteprima", x: pts.map(function (p) { return p.s; }), y: pts.map(function (p) { return p.e; }), text: pts.map(function (p) { return p.l; }), textposition: "top center", marker: { color: css("--orange", "#ff5a1f"), size: 14, opacity: .85 } }], layout({ xaxis: { title: { text: "Retribuzione mensile netta" } }, yaxis: { title: { text: "Tasso di occupazione" }, ticksuffix: "%" }, margin: { l: 78, r: 38, t: 16, b: 76 } }), config());
    Plotly.react("boxChart", [{ type: "bar", orientation: "h", x: [1022, 1608, 1635, 1672], y: ["Scienze motorie", "ICT", "Ingegneria", "Medico-sanitario"], marker: { color: css("--orange", "#ff5a1f") } }], layout({ showlegend: false, xaxis: { title: { text: "Retribuzione mensile netta" } }, margin: { l: 150, r: 24, t: 16, b: 64 } }), config());
    message("timeSeriesChart", "Anteprima statica. Cambia un filtro della serie storica per caricare i dati entro 15 secondi.");
    if (byId("selectionComment")) byId("selectionComment").textContent = "Anteprima statica iniziale. I dati dettagliati vengono caricati solo quando cambi un filtro.";
  }

  function normalize(r) {
    ["graduates", "employment_rate", "net_monthly_salary", "second_level_enrollment_rate", "survey_year", "years_after_degree", "graduation_year"].forEach(function (k) { r[k] = num(r[k]); });
    r.university_label = r.university_label || r.university; r.disciplinary_group_label = r.disciplinary_group_label || r.disciplinary_group; r.course_type_label = r.course_type_label || r.course_type; r.degree_class_label = r.degree_class_label || r.degree_class; return r;
  }
  function chunkUrl(survey, years) { return CHUNKS + "almalaurea_dashboard_s" + survey + "_a" + years + ".json"; }
  function loadChunk(survey, years) { var key = survey + "_" + years; if (state.chunks[key]) return state.chunks[key]; state.chunks[key] = requestJson(chunkUrl(survey, years)).then(function (p) { var r = (p.records || p.data || []).map(normalize); state.rows = state.rows.concat(r); return r; }); return state.chunks[key]; }
  function filters(prefix) { return { survey: num(byId(prefix + "SurveyYear").value), years: num(byId(prefix + "YearsAfter").value), cohort: num(byId(prefix + "GraduationYear").value), def: byId(prefix + "Definition").value, university: byId(prefix + "University").value, group: byId(prefix + "Group").value, course: byId(prefix + "Course").value, degree: prefix === "scatter" ? byId("scatterDegree").value : W, dim: prefix === "scatter" ? byId("scatterPointDimension").value : "disciplinary_group", split: prefix === "box" ? byId("boxSplitDimension").value : "disciplinary_group" }; }
  function baseMatch(r, f) { return r.survey_year === f.survey && r.years_after_degree === f.years && r.graduation_year === f.cohort && r.employment_definition === f.def; }
  function avg(rows, field) { var ws = 0, w = 0, ps = 0, c = 0; rows.forEach(function (r) { var v = r[field]; if (!Number.isFinite(v)) return; ps += v; c += 1; if (r.graduates > 0) { ws += v * r.graduates; w += r.graduates; } }); return w > 0 ? ws / w : (c ? ps / c : null); }
  function pointRows(f) { return state.rows.filter(function (r) { if (!baseMatch(r, f)) return false; if (f.course !== W ? r.course_type !== f.course : (f.dim === "degree_class" ? r.course_type === W : r.course_type !== W)) return false; if (f.degree !== W ? r.degree_class !== f.degree : (f.dim === "degree_class" ? r.degree_class === W : r.degree_class !== W)) return false; if (f.group !== W && r.disciplinary_group !== f.group) return false; if (f.university !== W ? r.university !== f.university : (f.dim === "university" ? r.university === W : r.university !== W)) return false; return Number.isFinite(r.employment_rate) && Number.isFinite(r.net_monthly_salary); }); }
  function aggregate(rows, dim) { var m = new Map(); rows.forEach(function (r) { var k = r[dim]; if (!k || k === W) return; if (!m.has(k)) m.set(k, []); m.get(k).push(r); }); return Array.from(m.entries()).map(function (e) { var a = e[1], r = a[0]; return { label: dim === "university" ? r.university_label : (dim === "degree_class" ? r.degree_class_label : r.disciplinary_group_label), group: r.disciplinary_group_label, course: r.course_type_label, graduates: a.reduce(function (s, x) { return s + (x.graduates || 0); }, 0), employment_rate: avg(a, "employment_rate"), net_monthly_salary: avg(a, "net_monthly_salary") }; }).filter(function (p) { return Number.isFinite(p.employment_rate) && Number.isFinite(p.net_monthly_salary); }); }

  function drawScatter(points) {
    if (!points.length) return message("scatterChart", "Nessun dato disponibile per questa selezione.");
    state.lastPoints = points;
    var maxG = Math.max.apply(null, points.map(function (p) { return p.graduates || 0; })) || 1;
    Plotly.react("scatterChart", [{ type: "scatter", mode: points.length <= 38 ? "markers+text" : "markers", name: "Selezione", x: points.map(function (p) { return p.net_monthly_salary; }), y: points.map(function (p) { return p.employment_rate; }), text: points.map(function (p) { return p.label; }), textposition: "top center", marker: { color: css("--orange", "#ff5a1f"), size: points.map(function (p) { return 10 + 34 * Math.sqrt((p.graduates || 0) / maxG); }), opacity: .86 }, customdata: points.map(function (p) { return [p.label, p.group, p.course, p.graduates]; }), hovertemplate: "<b>%{customdata[0]}</b><br>Gruppo: %{customdata[1]}<br>Tipo corso: %{customdata[2]}<br>Retribuzione: %{x:.0f} euro<br>Occupazione: %{y:.1f}%<br>Laureati: %{customdata[3]:,.0f}<extra></extra>" }], layout({ xaxis: { title: { text: "Retribuzione mensile netta" } }, yaxis: { title: { text: "Tasso di occupazione" }, ticksuffix: "%" }, margin: { l: 78, r: 120, t: 18, b: 76 } }), config());
    byId("kpiGraduates").textContent = fmtInt(points.reduce(function (s, p) { return s + (p.graduates || 0); }, 0)); byId("kpiEmployment").textContent = fmtPct(avg(points, "employment_rate")); byId("kpiSalary").textContent = fmtEuro(avg(points, "net_monthly_salary")); byId("kpiExtraLabel").textContent = "Punti visualizzati"; byId("kpiExtra").textContent = fmtInt(points.length);
  }
  function updateScatter() { var f = filters("scatter"); message("scatterChart", "Caricamento dati. Timeout massimo: 15 secondi."); loadChunk(f.survey, f.years).then(function () { drawScatter(aggregate(pointRows(f), f.dim)); if (byId("selectionComment")) byId("selectionComment").textContent = "Dati caricati per indagine " + f.survey + ", coorte " + f.cohort + "."; }).catch(function (e) { message("scatterChart", "Caricamento non completato entro 15 secondi: " + e.message); }); }

  function boxRows(f) { return state.rows.filter(function (r) { if (!baseMatch(r, f) || !Number.isFinite(r.net_monthly_salary)) return false; if (f.course !== W ? r.course_type !== f.course : (f.split === "course_type" ? r.course_type === W : r.course_type !== W)) return false; if (r.degree_class !== W) return false; if (f.group !== W ? r.disciplinary_group !== f.group : (f.split === "disciplinary_group" ? r.disciplinary_group === W : r.disciplinary_group !== W)) return false; if (f.university !== W ? r.university !== f.university : r.university === W) return false; return true; }); }
  function updateBox() { var f = filters("box"); message("boxChart", "Caricamento dati. Timeout massimo: 15 secondi."); loadChunk(f.survey, f.years).then(function () { var m = new Map(); boxRows(f).forEach(function (r) { var k = f.split === "course_type" ? r.course_type_label : r.disciplinary_group_label; if (!m.has(k)) m.set(k, []); m.get(k).push(r); }); var traces = Array.from(m.entries()).map(function (e, i) { var rows = e[1]; return { type: "box", name: e[0].length > 24 ? e[0].slice(0, 23) + "…" : e[0], y: rows.map(function (r) { return r.net_monthly_salary; }), text: rows.map(function (r) { return r.university_label; }), boxpoints: "all", jitter: .32, pointpos: 0, marker: { color: palette[i % palette.length], opacity: .75, size: 7 }, hovertemplate: "<b>%{text}</b><br>Retribuzione: %{y:.0f} euro<extra></extra>" }; }); if (!traces.length) return message("boxChart", "Nessun dato disponibile per questa selezione."); Plotly.react("boxChart", traces, layout({ showlegend: false, xaxis: { tickangle: -35, title: { text: f.split === "course_type" ? "Tipo corso" : "Gruppo disciplinare" } }, yaxis: { title: { text: "Retribuzione mensile netta" } }, margin: { l: 72, r: 26, t: 14, b: 126 } }), config()); }).catch(function (e) { message("boxChart", "Caricamento non completato entro 15 secondi: " + e.message); }); }
  function updateTime() { message("timeSeriesChart", "Caricamento serie storica. Timeout massimo: 15 secondi."); var p = state.timeseries ? Promise.resolve(state.timeseries) : requestJson(TIMESERIES).then(function (x) { state.timeseries = (x.records || []).map(normalize); return state.timeseries; }); p.then(function (rows) { var metric = byId("timeMetric").value, start = num(byId("timeStartYear").value), end = num(byId("timeEndYear").value), years = num(byId("timeYearsAfter").value), def = byId("timeDefinition").value; var m = new Map(); rows.forEach(function (r) { if (r.employment_definition !== def || r.years_after_degree !== years || r.survey_year < start || r.survey_year > end || r.course_type !== W || r.university !== W || r.disciplinary_group === W || !Number.isFinite(r[metric])) return; if (!m.has(r.disciplinary_group)) m.set(r.disciplinary_group, []); m.get(r.disciplinary_group).push(r); }); var traces = Array.from(m.entries()).map(function (e, i) { var a = e[1].sort(function (x, y) { return x.survey_year - y.survey_year; }); return { type: "scatter", mode: "lines+markers", name: e[0], x: a.map(function (r) { return r.survey_year; }), y: a.map(function (r) { return r[metric]; }), marker: { color: palette[i % palette.length], size: 8 }, line: { color: palette[i % palette.length], width: 2 } }; }).filter(function (t) { return t.x.length > 1; }); if (!traces.length) return message("timeSeriesChart", "Nessuna serie disponibile per questa selezione."); Plotly.react("timeSeriesChart", traces, layout({ xaxis: { title: { text: "Anno indagine" }, dtick: 1 }, yaxis: { title: { text: metric === "net_monthly_salary" ? "Retribuzione mensile netta" : "Tasso di occupazione" }, ticksuffix: metric === "net_monthly_salary" ? "" : "%" }, margin: { l: 78, r: 210, t: 16, b: 64 } }), config()); }).catch(function (e) { message("timeSeriesChart", "Caricamento non completato entro 15 secondi: " + e.message); }); }

  function bind() {
    ["scatterSurveyYear", "scatterYearsAfter", "scatterGraduationYear", "scatterDefinition", "scatterUniversity", "scatterGroup", "scatterCourse", "scatterDegree", "scatterPointDimension"].forEach(function (id) { var el = byId(id); if (el) el.addEventListener("change", function () { if (id === "scatterSurveyYear" || id === "scatterYearsAfter") sync("scatter"); if (id === "scatterGraduationYear") syncBack("scatter"); updateScatter(); }); });
    ["boxSurveyYear", "boxYearsAfter", "boxGraduationYear", "boxDefinition", "boxUniversity", "boxGroup", "boxCourse", "boxSplitDimension"].forEach(function (id) { var el = byId(id); if (el) el.addEventListener("change", function () { if (id === "boxSurveyYear" || id === "boxYearsAfter") sync("box"); if (id === "boxGraduationYear") syncBack("box"); updateBox(); }); });
    ["timeMode", "timeStartYear", "timeEndYear", "timeYearsAfter", "timeCohort", "timeDefinition", "timeUniversity", "timeGroup", "timeCourse", "timePointDimension", "timeMetric"].forEach(function (id) { var el = byId(id); if (el) el.addEventListener("change", updateTime); });
    var rs = byId("resetScatterFilters"); if (rs) rs.addEventListener("click", function () { defaults(); preview(); }); var rb = byId("resetBoxFilters"); if (rb) rb.addEventListener("click", function () { defaults(); preview(); }); var rt = byId("resetTimeFilters"); if (rt) rt.addEventListener("click", function () { defaults(); preview(); });
  }

  function init() {
    requestJson(META).then(function (m) {
      state.meta = m; populateFilters(); defaults(); applyQuery(); applyEmbed();
      if (byId("sourceTitle")) byId("sourceTitle").textContent = "Fonte: AlmaLaurea " + state.meta.latest_survey_year;
      if (byId("sourceMeta")) byId("sourceMeta").textContent = "Apertura con anteprima statica. I dati dettagliati vengono caricati al cambio dei filtri, con timeout a 15 secondi.";
      if (byId("methodologyList")) byId("methodologyList").innerHTML = (state.meta.methodology || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
      bind(); preview();
      if (embed || params.get("autoload") === "1") { if (chartFromQuery() === "box") updateBox(); else if (chartFromQuery() === "time") updateTime(); else updateScatter(); }
    }).catch(function (e) { ["scatterChart", "boxChart", "timeSeriesChart"].forEach(function (id) { message(id, "Non riesco a caricare la configurazione AlmaLaurea: " + e.message); }); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
