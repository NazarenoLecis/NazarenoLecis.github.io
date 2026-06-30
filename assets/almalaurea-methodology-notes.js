(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function ensureStyle() {
    if (byId("almMethodologyStyle")) return;
    var style = document.createElement("style");
    style.id = "almMethodologyStyle";
    style.textContent = ".extended-methodology{grid-column:1/-1;margin-top:18px;padding-top:18px;border-top:1px solid var(--line)}.extended-methodology h2{margin:0 0 14px;font-size:1.22rem;letter-spacing:0}.methodology-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.methodology-card{padding:16px;border:1px solid var(--line);border-radius:8px;background:color-mix(in srgb,var(--panel) 88%,transparent)}.methodology-card h3{margin:0 0 8px;font-size:1.02rem;letter-spacing:0}.methodology-card p{margin:0 0 8px;color:var(--muted);line-height:1.55}.methodology-card p:last-child{margin-bottom:0}.methodology-card ul{margin:8px 0 0;padding-left:18px;color:var(--muted)}.methodology-card li{margin:0 0 7px;line-height:1.5;color:var(--muted)}@media(max-width:760px){.methodology-grid{grid-template-columns:1fr}.extended-methodology{margin-top:14px;padding-top:14px}.methodology-card{padding:14px}}";
    document.head.appendChild(style);
  }

  function replaceBasicNotes() {
    var list = byId("methodologyList");
    if (!list || list.dataset.extended === "1") return;
    list.dataset.extended = "1";
    list.innerHTML = [
      "La dashboard usa dati AlmaLaurea sugli esiti occupazionali dei laureati. Le viste dettagliate e le serie storiche possono avere perimetri diversi.",
      "Anno di indagine, coorte e anni dalla laurea devono essere letti insieme. Per esempio: indagine 2025, coorte 2024, 1 anno dalla laurea.",
      "La retribuzione mensile netta è dichiarata nell’indagine e viene pubblicata come statistica aggregata. Non è un dato amministrativo individuale.",
      "L’assenza di una voce o di un punto non va letta come valore zero. Può dipendere da soglie minime, oscuramenti, perimetri non pubblicati o combinazioni di filtri non coerenti.",
      "Le mediane mostrate nei grafici sono mediane delle osservazioni aggregate disponibili nel grafico, non mediane individuali dei laureati."
    ].map(function (item) { return "<li>" + item + "</li>"; }).join("");
  }

  function extendDefinitions() {
    var section = byId("methodologySection");
    if (!section || byId("extendedMethodology")) return;
    var panel = document.createElement("div");
    panel.id = "extendedMethodology";
    panel.className = "extended-methodology";
    panel.innerHTML = "<h2>Come leggere filtri, grafici e perimetro dei dati</h2>" +
      "<div class=\"methodology-grid\">" +
      "<div class=\"methodology-card\"><h3>Anno di indagine, coorte e distanza dalla laurea</h3><p>L’anno di indagine è l’anno in cui AlmaLaurea osserva gli esiti. La coorte è l’anno di laurea. Gli anni dalla laurea sono la distanza tra i due.</p><p>Indagine 2025 e coorte 2024 significa 1 anno dalla laurea. Indagine 2025 e coorte 2020 significa 5 anni dalla laurea.</p></div>" +
      "<div class=\"methodology-card\"><h3>Trend a distanza fissa e percorso della coorte</h3><p>Nel trend a distanza fissa confronti coorti diverse sempre allo stesso orizzonte, per esempio sempre a 1 anno oppure sempre a 5 anni dalla laurea.</p><p>Nel percorso della stessa coorte fissi l’anno di laurea e osservi lo stesso gruppo negli orizzonti disponibili. I due grafici rispondono a domande diverse.</p></div>" +
      "<div class=\"methodology-card\"><h3>Tipi di corso e perimetro a 5 anni</h3><p>La dashboard distingue lauree di primo livello, lauree magistrali biennali e lauree magistrali a ciclo unico quando il dato è disponibile.</p><p>Il dato a 5 anni per le lauree di primo livello non sempre appartiene alla stessa base dettagliata usata per il secondo livello. Alcune viste possono quindi risultare non disponibili.</p></div>" +
      "<div class=\"methodology-card\"><h3>Definizione di occupato</h3><p>La definizione ampia include chi dichiara un’attività retribuita, comprese attività di formazione post-laurea retribuite.</p><p>La definizione restrittiva esclude la formazione retribuita. Quando confronti anni, gruppi o atenei, va mantenuta la stessa definizione.</p></div>" +
      "<div class=\"methodology-card\"><h3>Retribuzione media e mediana</h3><p>La retribuzione mensile netta è dichiarata nell’indagine e pubblicata in forma aggregata. Non è verificata tramite contratto, dato fiscale o contributivo.</p><p>Nei popup la media è il valore medio aggregato disponibile. La mediana, quando mostrata, è calcolata sui punti aggregati del grafico, per esempio tra atenei o gruppi, non sui microdati individuali.</p></div>" +
      "<div class=\"methodology-card\"><h3>Scatterplot</h3><p>Ogni punto rappresenta la dimensione scelta nel filtro: gruppo disciplinare, ateneo o classe/corso. L’asse orizzontale mostra la retribuzione mensile netta, l’asse verticale il tasso di occupazione.</p><p>La dimensione della bolla indica il numero di laureati. Quando passi da gruppi ad atenei o classi/corsi, cambia anche il perimetro interpretativo del confronto.</p></div>" +
      "<div class=\"methodology-card\"><h3>Boxplot</h3><p>Il boxplot mostra la dispersione della retribuzione tra atenei disponibili nel perimetro selezionato. I punti sono atenei, non individui.</p><p>La linea interna alla scatola è la mediana degli atenei nel gruppo, non la mediana salariale individuale dei laureati.</p></div>" +
      "<div class=\"methodology-card\"><h3>Filtri e dati mancanti</h3><p>I filtri possono restringere molto il campione. Alcune combinazioni tra anno, coorte, ateneo, gruppo, tipo di corso e classe/corso possono non essere pubblicate.</p><ul><li>Un punto assente non indica valore zero.</li><li>Un ateneo assente non indica necessariamente che non offra quel corso.</li><li>Alcune statistiche sono oscurate per numerosità ridotta o rischio di identificazione.</li></ul></div>" +
      "<div class=\"methodology-card\"><h3>Atenei presenti</h3><p>Il filtro sugli atenei usa solo le università presenti nel dataset caricato. Atenei non aderenti ad AlmaLaurea o non pubblicati nelle schede usate per questa dashboard non compaiono nella lista.</p></div>" +
      "<div class=\"methodology-card\"><h3>Uso corretto della dashboard</h3><p>La dashboard serve per esplorare relazioni e differenze, non per produrre classifiche definitive sulla qualità degli atenei o dei corsi.</p><p>I risultati possono riflettere mercato del lavoro locale, composizione dei corsi, settore di sbocco, prosecuzione degli studi, numerosità del campione e selezione iniziale degli studenti.</p></div>" +
      "</div>";
    section.appendChild(panel);
  }

  function init() {
    if (location.pathname.indexOf("/dashboard/almalaurea/") < 0) return;
    ensureStyle();
    replaceBasicNotes();
    extendDefinitions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
