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
    "/dashboard/almalaurea/index.html",
    "/dashboard/crisi-abitativa/index.html",
    "/dashboard/ciclo-unico-caldo/index.html",
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
    "Chi sono": "About",
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
    "Chi sono | Nazareno Lecis": "About | Nazareno Lecis",
    "Statistica, economia, finanza e politiche pubbliche.": "Statistics, economics, finance and public policy.",
    "Sono uno statistico e analista del rischio. Mi occupo di statistica applicata, economia, finanza e analisi dei rischi.": "I am a statistician and risk analyst. I work on applied statistics, economics, finance and risk analysis.",
    "Ho lavorato a ESMA, European Central Bank, ABN AMRO e Accenture. I temi principali del mio lavoro sono money market, monetary policy, financial stability, DORA designation, greenwashing, fund stress testing, risk analysis e cyber risk.": "I have worked at ESMA, the European Central Bank, ABN AMRO and Accenture. My main work areas include money markets, monetary policy, financial stability, DORA designation, greenwashing, fund stress testing, risk analysis and cyber risk.",
    "Nel dibattito pubblico mi occupo di temi economici e di policy: pensioni, fisco, energia, politiche europee, sviluppo economico, mercato del lavoro, demografia e immigrazione.": "In the public debate I cover economic and policy topics: pensions, taxation, energy, European policy, economic development, the labour market, demographics and immigration.",
    "Profilo professionale": "Professional profile",
    "Statistica, dati, rischio finanziario, mercati, strumenti di analisi e supervisione finanziaria.": "Statistics, data, financial risk, markets, analytical tools and financial supervision.",
    "Dibattito pubblico": "Public debate",
    "Analisi economiche, dati pubblici, grafici, articoli e interventi su temi di policy.": "Economic analysis, public data, charts, articles and talks on policy topics.",
    "Contatti": "Contacts",
    "AlmaLaurea | Nazareno Lecis": "AlmaLaurea | Nazareno Lecis",
    "Crisi abitativa | Nazareno Lecis": "Housing crisis | Nazareno Lecis",
    "Scuole, caldo e climatizzazione | Nazareno Lecis": "Schools, heat and air conditioning | Nazareno Lecis",
    "Dati AlmaLaurea": "AlmaLaurea data",
    "Occupazione e retribuzione dei laureati": "Employment and wages of graduates",
    "Parti da anno indagine e anno laurea, poi restringi il perimetro per ateneo, gruppo disciplinare, tipo di corso e classe di laurea. La vista dettagliata usa gli anni recenti; le serie storiche usano dati piu' aggregati e vanno piu' indietro nel tempo.": "Start from survey year and graduation year, then narrow the scope by university, subject group, degree type and degree class. The detailed view uses recent years; the time series use more aggregated data and go further back in time.",
    "Fonte: AlmaLaurea": "Source: AlmaLaurea",
    "Caricamento dati...": "Loading data...",
    "Leggi l'articolo collegato": "Read the related article",
    "Guida alla lettura": "Reading guide",
    "Scegli il perimetro": "Choose the scope",
    "Anno indagine, anni dalla laurea e anno laurea identificano il gruppo osservato.": "Survey year, years since graduation and graduation year identify the observed group.",
    "Confronta la selezione": "Compare the selection",
    "Scatter e boxplot usano i filtri dove sono coerenti con i dati disponibili.": "Scatter and box plots use filters where they are consistent with the available data.",
    "Guarda l'evoluzione": "Read the evolution",
    "La serie storica confronta anni di indagine diversi a parita' di distanza dalla laurea, oppure segue una singola coorte quando sono disponibili piu' osservazioni.": "The time series compares different survey years at the same distance from graduation, or follows one cohort when multiple observations are available.",
    "Sezioni della dashboard AlmaLaurea": "AlmaLaurea dashboard sections",
    "Serie storiche": "Time series",
    "Metodo e fonte": "Method and source",
    "Confronto": "Comparison",
    "Mappa dei laureati selezionati": "Map of the selected graduates",
    "Lo scatter confronta occupazione e retribuzione. La dimensione della bolla indica il numero di laureati, mentre il menu \"punti e serie\" decide se visualizzare gruppi disciplinari, atenei o classi.": "The scatter plot compares employment and wages. Bubble size shows the number of graduates, while the points menu chooses whether to display subject groups, universities or degree classes.",
    "Filtri scatterplot": "Scatter plot filters",
    "Vista iniziale: ultimo anno disponibile, 1 anno dalla laurea, tutti i gruppi disciplinari. Cambia \"punti\" solo quando vuoi passare dal confronto tra gruppi a quello tra atenei o classi.": "Initial view: latest available year, 1 year after graduation, all subject groups. Change points only when you want to switch from groups to universities or classes.",
    "Anno indagine": "Survey year",
    "Anni dalla laurea": "Years since graduation",
    "Anno laurea": "Graduation year",
    "Coorte": "Cohort",
    "Definizione occupazione": "Employment definition",
    "Ateneo": "University",
    "Gruppo disciplinare": "Subject group",
    "Tipo corso": "Degree type",
    "Classe di laurea": "Degree class",
    "Punti": "Points",
    "Gruppi disciplinari": "Subject groups",
    "Atenei": "Universities",
    "Classi di laurea": "Degree classes",
    "Reset scatter": "Reset scatter",
    "Scarica CSV scatter": "Download scatter CSV",
    "Laureati": "Graduates",
    "Tasso occupazione": "Employment rate",
    "Retribuzione netta": "Net wage",
    "Punti visualizzati": "Displayed points",
    "Occupazione e retribuzione": "Employment and wages",
    "dimensione bolla: numero di laureati": "bubble size: number of graduates",
    "Distribuzione": "Distribution",
    "Distribuzione della retribuzione": "Wage distribution",
    "Il boxplot mostra la dispersione della retribuzione tra atenei per gruppo disciplinare o tipo di corso.": "The box plot shows wage dispersion across universities by subject group or degree type.",
    "Filtri boxplot": "Box plot filters",
    "Ogni punto rappresenta un ateneo disponibile per il perimetro selezionato. Il grafico non misura la distribuzione individuale dei laureati.": "Each point represents an available university in the selected scope. The chart does not measure the individual distribution of graduates.",
    "Raggruppa per": "Group by",
    "Reset boxplot": "Reset box plot",
    "Distribuzione retribuzione": "Wage distribution",
    "punti: atenei": "points: universities",
    "Tempo": "Time",
    "La serie storica confronta anni di indagine diversi a parita' di distanza dalla laurea.": "The time series compares different survey years at the same distance from graduation.",
    "Trend a distanza fissa": "Fixed-horizon trend",
    "Confronta coorti diverse mantenendo costante la distanza dalla laurea, per esempio sempre a 1 anno.": "Compares different cohorts while keeping the distance from graduation constant, for example always at 1 year.",
    "Percorso della coorte": "Cohort path",
    "Segue la stessa coorte su piu' anni dalla laurea, quando il dato e' disponibile.": "Follows the same cohort across several years since graduation, when data are available.",
    "Perimetro": "Scope",
    "La definizione restrittiva e' usata come default per le serie lunghe perche' e' la piu' continua negli anni storici. La definizione meno restrittiva resta disponibile dove AlmaLaurea pubblica le metriche.": "The restrictive definition is the default for long series because it is the most continuous over historical years. The broader definition remains available where AlmaLaurea publishes the metrics.",
    "Filtri serie storica": "Time series filters",
    "Usa il trend a distanza fissa per confrontare coorti diverse nello stesso momento dopo la laurea. Usa il percorso della coorte per seguire gli stessi laureati nei punti temporali disponibili.": "Use the fixed-horizon trend to compare different cohorts at the same moment after graduation. Use the cohort path to follow the same graduates at the available time points.",
    "Modalita'": "Mode",
    "Da anno indagine": "From survey year",
    "A anno indagine": "To survey year",
    "Serie": "Series",
    "Indicatore": "Indicator",
    "Tasso di occupazione": "Employment rate",
    "Retribuzione mensile netta": "Net monthly wage",
    "Iscritti a magistrale": "Enrolled in a master's degree",
    "Reset serie storica": "Reset time series",
    "Trend occupazione/retribuzione": "Employment/wage trend",
    "linee: serie selezionate": "lines: selected series",
    "Note metodologiche": "Methodological notes",
    "Fonte e definizioni": "Source and definitions",
    "Fonte dati: AlmaLaurea, indagine sulla condizione occupazionale dei laureati. Elaborazione di Nazareno Lecis.": "Data source: AlmaLaurea, survey on graduates' employment outcomes. Processing by Nazareno Lecis.",
    "\"Occupati incl. formazione retribuita\" include anche chi svolge attivita' di formazione retribuita; \"occupati escl. formazione retribuita\" la esclude.": "\"Employed incl. paid training\" also includes paid training activities; \"employed excl. paid training\" excludes them.",
    "Per le lauree di primo livello, la quota di iscritti a un corso di secondo livello aiuta a leggere il tasso di occupazione a 1 anno, evitando di confondere prosecuzione degli studi e mancato inserimento lavorativo.": "For bachelor's degrees, the share enrolled in a second-level degree helps interpret the 1-year employment rate, avoiding confusion between further study and lack of labour-market entry.",
    "Se una combinazione di filtri non compare, significa che non e' pubblicata o non e' coerente nelle viste AlmaLaurea disponibili.": "If a filter combination does not appear, it means it is not published or not consistent in the available AlmaLaurea views.",
    "Tutti gli atenei": "All universities",
    "Tutti i gruppi": "All groups",
    "Tutti i tipi di corso": "All degree types",
    "Tutte le classi di laurea": "All degree classes",
    "Totale": "Total",
    "Incl. formazione retribuita": "Incl. paid training",
    "Escl. formazione retribuita": "Excl. paid training",
    "1 anno": "1 year",
    "5 anni": "5 years",
    "Trend della prosecuzione alla magistrale": "Trend in master's enrolment",
    "Evoluzione occupazionale della coorte selezionata": "Employment evolution of the selected cohort",
    "Evoluzione retributiva della coorte selezionata": "Wage evolution of the selected cohort",
    "Prosecuzione alla magistrale della coorte": "Cohort progression to master's degree",
    "Trend occupazionale a distanza fissa": "Fixed-horizon employment trend",
    "Trend retributivo a distanza fissa": "Fixed-horizon wage trend",
    "Questa lettura segue la stessa coorte di laurea: l'asse orizzontale indica gli anni dalla laurea disponibili nel dataset, non l'anno di indagine.": "This view follows the same graduation cohort: the horizontal axis shows the available years since graduation, not the survey year.",
    "Questa lettura confronta anni di indagine diversi mantenendo fissa la distanza dalla laurea: e' una serie storica a orizzonte costante, non il percorso degli stessi laureati.": "This view compares different survey years while keeping the distance from graduation fixed: it is a constant-horizon time series, not the path of the same graduates.",
    "Plotly non e' disponibile.": "Plotly is not available.",
    "Nessun dato disponibile per questa combinazione di filtri.": "No data available for this filter combination.",
    "La distribuzione per ateneo non e' disponibile per questa selezione.": "The university-level distribution is not available for this selection.",
    "Nessun valore di retribuzione disponibile.": "No wage value available.",
    "Nessuna serie storica disponibile per questa combinazione di filtri.": "No time series available for this filter combination.",
    "Non ci sono almeno due punti temporali numerici per questa combinazione di filtri. Prova una definizione occupazionale, un indicatore o un intervallo temporale diverso.": "There are not at least two numeric time points for this filter combination. Try a different employment definition, indicator or time interval.",
    "Il boxplot si carica quando raggiungi questa sezione.": "The box plot loads when you reach this section.",
    "Le serie storiche si caricano quando raggiungi questa sezione.": "The time series load when you reach this section.",
    "Caricamento dati AlmaLaurea...": "Loading AlmaLaurea data...",
    "Caricamento serie storica AlmaLaurea...": "Loading AlmaLaurea time series...",
    "Aggiornamento serie storica...": "Updating time series...",
    "Caricamento dettaglio storico per ateneo...": "Loading historical university detail...",
    "Non riesco a caricare i dati AlmaLaurea:": "I cannot load AlmaLaurea data:",
    "Non riesco a caricare la serie storica AlmaLaurea:": "I cannot load the AlmaLaurea time series:",
    "La coorte di laurea e' calcolata come anno indagine meno anni dalla laurea.": "The graduation cohort is calculated as survey year minus years since graduation.",
    "La dashboard dettagliata carica gli ultimi 10 anni di indagine disponibili.": "The detailed dashboard loads the latest 10 available survey years.",
    "Le serie storiche usano dati aggregati, senza dettaglio per classe di laurea, dal primo anno storico scaricato.": "The time series use aggregated data, without degree-class detail, from the first downloaded historical year.",
    "Per le lauree di primo livello e' disponibile anche la quota di laureati iscritti a un corso di secondo livello.": "For bachelor's degrees, the share of graduates enrolled in a second-level degree is also available.",
    "Nelle serie storiche, a parita' di anni dalla laurea, ogni anno di indagine osserva una coorte diversa.": "In the time series, at the same distance from graduation, each survey year observes a different cohort.",
    "Non tutte le combinazioni di filtri sono pubblicate da AlmaLaurea.": "Not all filter combinations are published by AlmaLaurea.",
    "I tipi di corso possono cambiare nel tempo; le serie mostrano solo le combinazioni disponibili in ciascun anno.": "Degree types can change over time; the series only show the combinations available in each year.",
    "I valori mancanti dipendono dalla disponibilita' delle viste sul sito sorgente.": "Missing values depend on the availability of views on the source site.",
    "La retribuzione e' espressa come retribuzione mensile netta.": "Wages are expressed as net monthly wages.",
    "Crisi abitativa": "Housing crisis",
    "Prezzi, affitti, redditi e accesso alla casa": "Prices, rents, incomes and access to housing",
    "Dashboard costruita per leggere la crisi abitativa su due scale. La prima mostra dove si colloca l'Italia nel confronto europeo sugli indicatori armonizzati; la seconda scende al livello comunale, perche' il problema abitativo diventa concreto quando prezzi, affitti e redditi incontrano i mercati locali.": "A dashboard built to read the housing crisis at two scales. The first shows where Italy stands in the European comparison of harmonised indicators; the second moves down to municipal level, because housing pressure becomes concrete when prices, rents and incomes meet local markets.",
    "Fonte: Eurostat, OMI, MEF": "Source: Eurostat, OMI, MEF",
    "Grafico europeo da export statici Eurostat. Focus locale caricato da export statici regionali.": "European chart from static Eurostat exports. Local focus loaded from static regional exports.",
    "Apri repository Crisi_abitativa": "Open the Crisi_abitativa repository",
    "Scegli l'indicatore": "Choose the indicator",
    "Nel confronto europeo il primo menu cambia la variabile: costi abitativi, sovraffollamento, arretrati, offerta, giovani in casa con i genitori e altri proxy della crisi.": "In the European comparison, the first menu changes the variable: housing costs, overcrowding, arrears, supply, young adults living with parents and other proxies of the crisis.",
    "Leggi il range": "Read the range",
    "L'Italia resta sempre evidenziata. La banda arancione mostra minimo e massimo tra paesi disponibili: serve a capire il posizionamento, non e' una media europea.": "Italy is always highlighted. The orange band shows the minimum and maximum among available countries: it helps read positioning, but it is not a European average.",
    "Passa al locale": "Move to the local view",
    "Nel focus Italia scegli regione e metrica. I valori comunali sono quotazioni territoriali: affitto in euro per metro quadro al mese, vendita in euro per metro quadro. La Sardegna e' caricata di default; gli altri export regionali possono essere aggiunti dallo stesso repository dati.": "In the Italy focus, choose a region and a metric. Municipal values are territorial quotations: rents in euros per square meter per month, sales in euros per square meter. Sardinia is loaded by default; other regional exports can be added from the same data repository.",
    "Nel focus Italia leggi prima la mappa nazionale per regione, poi scendi al dettaglio comunale del territorio selezionato. Le quotazioni OMI restano valori territoriali di riferimento, non prezzi di contratto o di rogito.": "In the Italy focus, first read the national map by region, then move down to the municipal detail of the selected territory. OMI quotations remain territorial reference values, not contract or deed prices.",
    "Cos'e' OMI": "What is OMI",
    "Sezioni dashboard crisi abitativa": "Housing crisis dashboard sections",
    "Confronto europeo": "European comparison",
    "Stock abitativo": "Housing stock",
    "Focus locale": "Local focus",
    "Metodo e fonti": "Method and sources",
    "Prima di leggere i grafici": "Before reading the charts",
    "Gli indicatori misurano pezzi diversi della crisi": "The indicators measure different parts of the crisis",
    "Non esiste un numero unico che dica se la casa e' accessibile. Per questo la dashboard separa costo economico, qualita' dell'abitare, domanda compressa e offerta. Il confronto europeo serve a vedere il quadro generale; il focus comunale mostra dove la pressione diventa locale.": "There is no single number that says whether housing is affordable. This is why the dashboard separates economic cost, housing quality, compressed demand and supply. The European comparison shows the general picture; the municipal focus shows where pressure becomes local.",
    "La mappa Italia sintetizza ogni regione con la media semplice dei valori comunali disponibili per la misura selezionata: e' una lettura di orientamento, non una stima pesata per popolazione, stock abitativo o transazioni.": "The Italy map summarises each region with the simple average of available municipal values for the selected measure: it is an orientation view, not an estimate weighted by population, housing stock or transactions.",
    "OMI (Osservatorio del Mercato Immobiliare, Agenzia delle Entrate) raccoglie quotazioni territoriali per zone OMI. Sono valori di riferimento statistico, utili per confronti spaziali, non prezzi effettivi di contratto o di rogito.": "The OMI (Observatory of the Real Estate Market at the Italian Revenue Agency) provides territorial quoted values by OMI zone. These are benchmark values, useful for spatial comparisons, not actual contract rents or deed prices.",
    "Qualita' e spazio": "Quality and space",
    "Domanda latente": "Latent demand",
    "Offerta e stock": "Supply and stock",
    "Eta' del patrimonio immobiliare": "Age of the housing stock",
    "I dati Eurostat sul periodo di costruzione delle abitazioni sono una fotografia del 2021, non una serie storica. Per questo sono mostrati in un grafico separato: il bar chart confronta la quota dello stock abitativo per periodo di costruzione, usando un JSON statico gia' aggregato.": "Eurostat data on the construction period of dwellings are a 2021 snapshot, not a time series. They are therefore shown in a separate chart: the bar chart compares the share of the housing stock by construction period, using an already aggregated static JSON.",
    "Filtri stock abitativo": "Housing stock filters",
    "Paesi da confrontare": "Countries to compare",
    "Italia ed EU27 restano sempre visibili. Puoi aggiungere altri paesi dal menu: il grafico usa quote percentuali dello stock per evitare che i paesi piu' grandi schiaccino gli altri.": "Italy and EU27 remain always visible. You can add other countries from the menu: the chart uses percentage shares of the stock so larger countries do not dominate the comparison.",
    "Paesi da aggiungere": "Countries to add",
    "Reset paesi": "Reset countries",
    "Abitazioni per periodo di costruzione": "Dwellings by construction period",
    "quota dello stock, 2021": "share of stock, 2021",
    "Fonte: Eurostat Census Hub 2021. Elaborazione di Nazareno Lecis.": "Source: Eurostat Census Hub 2021. Processing by Nazareno Lecis.",
    "Europa": "Europe",
    "Il confronto europeo: utile, ma non sufficiente": "The European comparison: useful, but not sufficient",
    "Eurostat permette di confrontare paesi con definizioni armonizzate. I dati sono salvati come JSON statici per rendere la dashboard piu' veloce e non dipendere dall'API al caricamento della pagina. Il confronto aiuta a capire se l'Italia e' un caso isolato o parte di una dinamica piu' ampia, ma le medie nazionali nascondono differenze enormi tra territori.": "Eurostat makes it possible to compare countries with harmonised definitions. The data are saved as static JSON to keep the dashboard faster and avoid depending on the API at page load. The comparison helps understand whether Italy is an isolated case or part of a wider dynamic, but national averages hide huge territorial differences.",
    "Filtri confronto europeo": "European comparison filters",
    "Come usare i filtri": "How to use the filters",
    "Scegli la variabile nel primo menu. Nel secondo menu puoi selezionare uno o piu' paesi da evidenziare oltre all'Italia. EU27 viene mostrata quando Eurostat pubblica la serie aggregata. Se un paese sparisce in alcuni anni, significa che Eurostat non ha un valore disponibile per quella combinazione di filtri.": "Choose the variable in the first menu. In the second menu you can select one or more countries to highlight in addition to Italy. EU27 is shown when Eurostat publishes the aggregate series. If a country disappears in some years, Eurostat has no value for that filter combination.",
    "Paesi da evidenziare": "Countries to highlight",
    "Reset confronto": "Reset comparison",
    "Italia ultimo dato": "Italy latest value",
    "Range paesi": "Country range",
    "Anno": "Year",
    "range min-max, Italia sempre evidenziata": "min-max range, Italy always highlighted",
    "Fonte: Eurostat. Elaborazione di Nazareno Lecis.": "Source: Eurostat. Processing by Nazareno Lecis.",
    "Italia locale": "Local Italy",
    "Prezzi e affitti comunali: dove il problema diventa concreto": "Municipal prices and rents: where the issue becomes concrete",
    "Le medie nazionali dicono poco su cosa succede davvero a Cagliari, Nuoro, Sassari o nei comuni interni. Questa sezione usa export statici regionali con quotazioni OMI comunali: la Sardegna e' pre-caricata, mentre la struttura permette di aggiungere le altre regioni generando gli stessi JSON.": "National averages say little about what actually happens in Cagliari, Nuoro, Sassari or inland municipalities. This section uses static regional exports with municipal OMI quotations: Sardinia is preloaded, while the structure allows other regions to be added by generating the same JSON files.",
    "Dalla mappa Italia al dettaglio comunale": "From the Italy map to municipal detail",
    "Le medie nazionali dicono poco su cosa succede davvero a Cagliari, Nuoro, Sassari o nei comuni interni. Per questo la lettura locale parte da una sintesi regionale su tutta Italia e poi scende alla singola regione e ai comuni. I dati usano export statici regionali con quotazioni OMI comunali e indicatori di reddito dove disponibili.": "National averages say little about what actually happens in Cagliari, Nuoro, Sassari or inland municipalities. This is why the local reading starts from a regional summary for the whole of Italy and then moves down to the single region and its municipalities. The data use static regional exports with municipal OMI quotations and income indicators where available.",
    "Filtri focus locale": "Local focus filters",
    "Come usare i filtri locali": "How to use local filters",
    "Scegli una regione e una metrica: affitto medio, affitto mediano, prezzo di vendita medio o prezzo di vendita mediano. Gli affitti sono in euro per metro quadro al mese e i prezzi di vendita in euro per metro quadro. Quando sono presenti le geometrie, il grafico mostra una mappa comunale; altrimenti usa una classifica dei comuni con valori disponibili.": "Choose a region and a metric: average rent, median rent, average sale price or median sale price. Rents are in euros per square meter per month and sale prices in euros per square meter. When geometries are available, the chart shows a municipal map; otherwise it uses a ranking of municipalities with available values.",
    "Filtri mappa Italia": "Italy map filters",
    "Come leggere la mappa Italia": "How to read the Italy map",
    "La misura selezionata colora le regioni italiane usando una sintesi dei valori comunali disponibili: affitto medio, affitto mediano, prezzo di vendita medio o prezzo di vendita mediano. Clicca una regione per caricare sotto il dettaglio comunale dello stesso territorio.": "The selected measure colours the Italian regions using a summary of available municipal values: average rent, median rent, average sale price or median sale price. Click a region to load the municipal detail of the same territory below.",
    "Italia regionale": "Regional Italy",
    "anteprima regionale della misura selezionata": "regional preview of the selected measure",
    "Dettaglio regionale": "Regional detail",
    "Come usare il dettaglio regionale": "How to use the regional detail",
    "Dopo aver scelto la misura sopra, seleziona una regione oppure cliccala nella mappa Italia. Quando sono presenti le geometrie, il grafico mostra una mappa comunale; altrimenti usa una classifica dei comuni con valori disponibili. Il campo di ricerca serve solo a evidenziare un comune nel perimetro regionale gia' aperto.": "After choosing the measure above, select a region or click it in the Italy map. When geometries are available, the chart shows a municipal map; otherwise it uses a ranking of municipalities with available values. The search field is only used to highlight a municipality within the regional scope already open.",
    "Regione": "Region",
    "Misura comunale": "Municipal measure",
    "Comune da evidenziare": "Municipality to highlight",
    "Scrivi un comune, es. Sam...": "Type a municipality, e.g. Sam...",
    "Affitto medio (euro per metro quadro al mese)": "Average rent (euros per square meter per month)",
    "Affitto mediano (euro per metro quadro al mese)": "Median rent (euros per square meter per month)",
    "Prezzo di vendita medio (euro per metro quadro)": "Average sale price (euros per square meter)",
    "Prezzo di vendita mediano (euro per metro quadro)": "Median sale price (euros per square meter)",
    "Focus locale Italia": "Local Italy focus",
    "dettaglio comunale": "municipal detail",
    "Fonte: OMI Agenzia Entrate e MEF Dipartimento Finanze, dove disponibili. Elaborazione di Nazareno Lecis.": "Source: OMI Agenzia Entrate and MEF Department of Finance, where available. Processing by Nazareno Lecis.",
    "Fonte e repository": "Source and repository",
    "La dashboard del sito consuma dati gia' puliti o endpoint pubblici. Le API e gli export pesanti non vengono eseguiti direttamente nel browser.": "The site dashboard consumes already cleaned data or public endpoints. APIs and heavy exports are not run directly in the browser.",
    "OMI descrive una quota territoriale della rendita immobiliare locale: oltre ai livelli di prezzi/affitti, nel file comunale sono inclusi anche indicatori di sostenibilita' economica come reddito medio disponibile e rapporti affitto-reddito (anni di reddito per 80 m² e canone di 50 m²).": "OMI tracks a territorial slice of local property values. Beyond rent and sale levels, the municipal file also includes affordability complements such as available disposable income and rent-to-income diagnostics (years of income for 80 m² and rent burden for 50 m²).",
    "Sovraccarico dei costi abitativi": "Housing cost overburden",
    "Costi abitativi oltre il 40% del reddito": "Housing costs over 40% of income",
    "Arretrati su mutuo, affitto o bollette": "Arrears on mortgage, rent or utility bills",
    "Arretrati abitativi e bollette": "Housing and utility arrears",
    "Sovraccarico dei costi abitativi tra gli inquilini": "Housing cost overburden among tenants",
    "Inquilini con costi oltre il 40% del reddito": "Tenants with costs over 40% of income",
    "Peso mediano dei costi abitativi sul reddito": "Median housing-cost burden on income",
    "Peso mediano dei costi abitativi": "Median housing-cost burden",
    "Rischio poverta dopo i costi abitativi": "At-risk-of-poverty after housing costs",
    "Poverta dopo i costi abitativi": "Poverty after housing costs",
    "Rischio poverta standard": "Standard at-risk-of-poverty",
    "Rischio poverta prima dei costi abitativi": "At-risk-of-poverty before housing costs",
    "Famiglie private": "Private households",
    "Numero di famiglie private": "Number of private households",
    "Popolazione residente": "Resident population",
    "Popolazione al 1 gennaio": "Population on 1 January",
    "Eta media di uscita dalla casa dei genitori": "Average age of leaving the parental home",
    "Eta di uscita dalla casa dei genitori": "Age of leaving the parental home",
    "Giovani 25-34 anni che vivono con i genitori": "Young adults aged 25-34 living with parents",
    "25-34 anni in casa con i genitori": "25-34-year-olds living with parents",
    "Investimenti in abitazioni": "Investment in dwellings",
    "Investimenti in abitazioni (% PIL)": "Investment in dwellings (% of GDP)",
    "Costi di costruzione residenziale": "Residential construction costs",
    "Costi nuovi edifici residenziali (indice 2021=100)": "New residential building costs (index 2021=100)",
    "Permessi di costruzione per abitazioni": "Building permits for dwellings",
    "Permessi abitativi (indice 2021=100)": "Dwelling permits (index 2021=100)",
    "Superficie residenziale autorizzata": "Authorised residential floor area",
    "Permessi residenziali in m2 per 1.000 abitanti": "Residential permits in m2 per 1,000 inhabitants",
    "Permessi edilizi per nuove abitazioni": "Building permits for new dwellings",
    "Nuove abitazioni autorizzate": "Authorised new dwellings",
    "Produzione nelle costruzioni": "Construction production",
    "Produzione nelle costruzioni (indice 2015=100)": "Construction production (index 2015=100)",
    "Indice dei prezzi delle case": "House price index",
    "Prezzi delle case (indice 2015=100)": "House prices (index 2015=100)",
    "Impossibilita di riscaldare adeguatamente la casa": "Inability to keep home adequately warm",
    "Casa non riscaldata adeguatamente": "Home not adequately heated",
    "Abitazioni con perdite, umidita o marciume": "Dwellings with leaks, damp or rot",
    "Perdite, umidita o marciume nell'abitazione": "Leaks, damp or rot in the dwelling",
    "Retribuzione netta annua": "Annual net earnings",
    "Retribuzione netta annua (single, 100% salario medio)": "Annual net earnings (single, 100% average wage)",
    "Grave deprivazione abitativa": "Severe housing deprivation",
    "Tasso di sovraffollamento abitativo": "Overcrowding rate",
    "Sovraffollamento abitativo": "Overcrowding",
    "% della popolazione": "% of population",
    "% della popolazione in affitto": "% of tenant population",
    "% del reddito disponibile": "% of disposable income",
    "migliaia di famiglie": "thousand households",
    "persone": "people",
    "anni": "years",
    "% della popolazione 25-34": "% of population aged 25-34",
    "% del PIL": "% of GDP",
    "indice 2021=100": "index 2021=100",
    "indice 2015=100": "index 2015=100",
    "m2 per 1.000 abitanti": "m2 per 1,000 inhabitants",
    "migliaia di abitazioni": "thousand dwellings",
    "euro": "euro",
    "Prima del 1919": "Before 1919",
    "Dal 2016": "From 2016",
    "Non indicato": "Not reported",
    "Italia": "Italy",
    "Media UE": "EU average",
    "Massimo paesi": "Country maximum",
    "Range paesi": "Country range",
    "Periodo": "Period",
    "Tutti gli anni": "All years",
    "Ultimi 20 anni": "Last 20 years",
    "Ultimi 10 anni": "Last 10 years",
    "Ultimi 5 anni": "Last 5 years",
    "Scala": "Scale",
    "Valori assoluti": "Absolute values",
    "Indice base 100": "Index base 100",
    "Base": "Base",
    "Valore": "Value",
    "Quota stock": "Stock share",
    "Abitazioni": "Dwellings",
    "Periodo di costruzione": "Construction period",
    "Quota dello stock abitativo (%)": "Share of housing stock (%)",
    "Come leggere:": "How to read:",
    "Comune selezionato": "Selected municipality",
    "Provincia": "Province",
    "Zone OMI": "OMI zones",
    "media semplice delle zone OMI residenziali disponibili nel comune": "simple average of available residential OMI zones in the municipality",
    "mediana delle zone OMI residenziali disponibili nel comune": "median of available residential OMI zones in the municipality",
    "Prezzo di vendita medio OMI": "Average OMI sale price",
    "Prezzo di vendita mediano OMI": "Median OMI sale price",
    "euro per metro quadro al mese": "euros per square meter per month",
    "euro per metro quadro": "euros per square meter",
    "euro/mq/mese": "euro/sqm/month",
    "euro/mq": "euro/sqm",
    "Nessun dato europeo disponibile per questo indicatore.": "No European data available for this indicator.",
    "Con la base 100 tutte le serie visibili partono da 100 nell'anno scelto e mostrano solo variazioni relative, non livelli assoluti.": "With base 100, all visible series start from 100 in the selected year and only show relative changes, not absolute levels.",
    "La banda arancione indica il range min-max tra paesi disponibili: non e' una media europea e non misura la distribuzione interna ai singoli paesi.": "The orange band shows the min-max range across available countries: it is not a European average and does not measure within-country distributions.",
    "La linea Media UE e' calcolata come media semplice dei paesi disponibili nello stesso anno, quindi resta dentro il range.": "The EU average line is calculated as the simple average of available countries in the same year, so it remains inside the range.",
    "Per gli indicatori in valori assoluti EU27 non viene disegnato: e' un aggregato e sarebbe fuori scala rispetto ai singoli paesi.": "For absolute-value indicators, EU27 is not drawn: it is an aggregate and would be out of scale compared with individual countries.",
    "Nessun dato disponibile sull'eta' del patrimonio immobiliare.": "No data available on the age of the housing stock.",
    "questo grafico usa un unico JSON statico gia' aggregato. Le barre mostrano la composizione percentuale dello stock abitativo 2021 per periodo di costruzione; il tooltip riporta anche il numero di abitazioni.": "this chart uses a single already aggregated static JSON. The bars show the percentage composition of the 2021 housing stock by construction period; the tooltip also reports the number of dwellings.",
    "Verifica che estat_dwellings_by_construction_period_2021.json sia stato sincronizzato su Cloudflare R2.": "Check that estat_dwellings_by_construction_period_2021.json has been synced to Cloudflare R2.",
    "indice Eurostat vuoto": "empty Eurostat index",
    "Caricamento...": "Loading...",
    "Caricamento in corso.": "Loading in progress.",
    "Rigenera gli export statici dal repository Crisi_abitativa o controlla che i file siano presenti su Cloudflare R2.": "Regenerate the static exports from the Crisi_abitativa repository or check that the files are available on Cloudflare R2.",
    "Export locale non disponibile": "Local export not available",
    "Focus locale non ancora esportato. Genera i JSON regionali dal repository Crisi_abitativa e pubblicali su Cloudflare R2.": "Local focus not exported yet. Generate the regional JSON files from the Crisi_abitativa repository and publish them to Cloudflare R2.",
    "Dataset atteso:": "Expected dataset:",
    "un file per regione con geometrie comunali e record con campi": "one file per region with municipal geometries and records with fields",
    "Nessun valore comunale disponibile per questa misura.": "No municipal value available for this measure.",
    "Comuni con dato": "Municipalities with data",
    "Semestre OMI": "OMI semester",
    "Regione attiva:": "Active region:",
    "La mappa sintetizza ogni regione con la media semplice dei valori comunali disponibili per la misura selezionata.": "The map summarises each region with the simple average of available municipal values for the selected measure.",
    "Serve come anteprima territoriale: clicca una regione per aprire sotto il dettaglio comunale.": "It serves as a territorial preview: click a region to open the municipal detail below.",
    "Le quotazioni OMI restano valori di riferimento territoriale e non prezzi effettivi di contratto o di rogito.": "OMI quotations remain territorial reference values and not actual contract or deed prices.",
    "Controlla che il GeoJSON regionale e gli export locali siano pubblicati correttamente.": "Check that the regional GeoJSON and local exports are published correctly.",
    "Comune evidenziato:": "Highlighted municipality:",
    "la mappa colora i comuni della regione per": "the map colours the region's municipalities by",
    "Il valore e' una": "The value is a",
    "non e' un prezzo di rogito o un canone contrattuale.": "it is not a deed price or an actual rental contract.",
    "Comuni caricati:": "Municipalities loaded:",
    "Se il comune selezionato non e' nei primi valori, viene comunque incluso nella classifica.": "If the selected municipality is not among the top values, it is still included in the ranking.",
    "il grafico mostra i primi comuni della regione per": "the chart shows the top municipalities in the region by",
    "I valori OMI sono quotazioni territoriali, non transazioni o contratti effettivi.": "OMI values are territorial quotations, not actual transactions or contracts.",
    "Eurostat da export statici. Focus locale:": "Eurostat from static exports. Local focus:",
    "Eurostat da export statici. Mappa Italia e focus locale:": "Eurostat from static exports. Italy map and local focus:",
    "Scuole, caldo e climatizzazione": "Schools, heat and air conditioning",
    "Ciclo unico scolastico": "Single school cycle",
    "Dashboard sui dati MIM degli impianti di riscaldamento e condizionamento. Il grafico mostra la quota di righe scuola edificio con condizionamento o ventilazione dichiarati, per regione e grado scolastico, insieme ad alcuni indicatori termici usati nello scenario del repository.": "Dashboard on MIM data for heating and air-conditioning systems. The chart shows the share of school-building rows with declared air conditioning or ventilation, by region and school level, together with thermal indicators used in the repository scenario.",
    "Fonte: MIM, Istat, repository Ciclo_unico_scolastico": "Source: MIM, Istat, Ciclo_unico_scolastico repository",
    "Dataset MIM di edilizia scolastica, impianti, origine degli edifici e indicatori energetici. Elaborazione di Nazareno Lecis.": "MIM dataset on school buildings, systems, building origin and energy indicators. Processing by Nazareno Lecis.",
    "Dataset MIM di edilizia scolastica, impianti, origine degli edifici e indicatori energetici.": "MIM dataset on school buildings, systems, building origin and energy indicators.",
    "Elaborazione di Nazareno Lecis.": "Processing by Nazareno Lecis.",
    "Apri repository dati": "Open data repository",
    "Scegli il grado": "Choose the school level",
    "Il menu permette di leggere tutte le righe MIM insieme oppure separare infanzia, primaria, secondaria di primo grado e secondaria di secondo grado.": "The menu lets you read all MIM rows together or separate pre-primary, primary, lower-secondary and upper-secondary schools.",
    "Cambia metrica": "Change metric",
    "La quota A/C usa il campo diretto MIM. Le metriche su rischio e mitigazione sono proxy costruiti dallo scenario del repository.": "The A/C share uses the direct MIM field. Risk and mitigation metrics are proxies built by the repository scenario.",
    "Leggi note e fonti": "Read notes and sources",
    "Le regioni sono ordinate dalla quota piÃ¹ alta alla piÃ¹ bassa per la metrica selezionata. La tabella sotto il grafico espone tutte le variabili principali.": "Regions are sorted from the highest to the lowest share for the selected metric. The table below the chart exposes all main variables.",
    "Sezioni dashboard caldo scuole": "School heat dashboard sections",
    "Grafico": "Chart",
    "PNRR clima": "Climate NRRP",
    "Tabella": "Table",
    "Confronto regionale": "Regional comparison",
    "Condizionamento e rischio caldo nelle scuole": "Air conditioning and heat risk in schools",
    "Usa i filtri per cambiare grado scolastico e metrica. Il grafico resta sempre regionale, cosÃ¬ il confronto territoriale rimane leggibile.": "Use the filters to change school level and metric. The chart remains regional so the territorial comparison stays readable.",
    "Filtri dashboard caldo": "School heat dashboard filters",
    "Il filtro sul grado cambia il perimetro osservato. Il filtro sulla metrica cambia la variabile ordinata nel grafico. La quota A/C dichiarata include nel denominatore anche i valori non definiti, mentre la quota sui soli SI/NO li esclude.": "The school-level filter changes the observed scope. The metric filter changes the variable sorted in the chart. The declared A/C share includes undefined values in the denominator, while the SI/NO-only share excludes them.",
    "Grado scolastico": "School level",
    "Metrica": "Metric",
    "Reset filtri": "Reset filters",
    "Indicatori sintetici": "Summary indicators",
    "Righe MIM nel perimetro": "MIM rows in scope",
    "A/C dichiarata": "Declared A/C",
    "Mitigazione media/alta": "Medium/high mitigation",
    "Rischio caldo alto": "High heat risk",
    "Barplot per regione": "Bar plot by region",
    "Fonte: MIM, Portale unico dei dati della scuola. Elaborazione di Nazareno Lecis.": "Source: MIM, national school data portal. Processing by Nazareno Lecis.",
    "Investimenti recenti": "Recent investments",
    "PNRR clima/energia rispetto allo stock scolastico": "NRRP climate/energy investments relative to the school stock",
    "Il grafico mette a 100 le righe scuola-edificio MIM di ogni regione e mostra i progetti PNRR 2021-2027 collegati a efficientamento energetico, comfort termico o mitigazione caldo.": "The chart sets each region's MIM school-building rows equal to 100 and shows 2021-2027 NRRP projects related to energy efficiency, thermal comfort or heat mitigation.",
    "Filtri investimenti PNRR clima": "NRRP climate investment filters",
    "Come leggere il rapporto": "How to read the ratio",
    "Il numeratore PNRR e' regionale e non e' collegato ai codici edificio MIM. Il filtro sul grado cambia quindi il denominatore MIM, mantenendo il confronto territoriale leggero e coerente con il grafico principale.": "The NRRP numerator is regional and is not linked to MIM building codes. The school-level filter therefore changes the MIM denominator, keeping the territorial comparison lightweight and consistent with the main chart.",
    "Reset investimenti": "Reset investments",
    "Progetti clima/energia per 100 scuole-edificio": "Climate/energy projects per 100 school-building rows",
    "progetti 2021-2027 / righe MIM per regione": "2021-2027 projects / MIM rows by region",
    "Fonte: OpenCoesione 2021-2027 e MIM. Elaborazione di Nazareno Lecis.": "Source: OpenCoesione 2021-2027 and MIM. Processing by Nazareno Lecis.",
    "Il valore e' una proxy territoriale: progetti PNRR clima/energia per 100 righe scuola-edificio MIM del grado selezionato.": "The value is a territorial proxy: NRRP climate/energy projects per 100 MIM school-building rows in the selected school level.",
    "Nel perimetro selezionato il numeratore resta regionale, mentre il denominatore cambia con il grado scolastico.": "In the selected scope, the numerator remains regional while the denominator changes with the school level.",
    "Totale progetti considerati:": "Total projects considered:",
    "valore finanziato:": "funded value:",
    "La regione con intensita' piu' alta e'": "The region with the highest intensity is",
    "Non riesco a caricare il riepilogo PNRR:": "I cannot load the NRRP summary:",
    "Nota di lettura.": "Reading note.",
    "La presenza di condizionamento o ventilazione Ã¨ un dato dichiarato nel campo MIM CONDIZIONAMENTOVENTILAZIONE. Non misura la temperatura in aula e non garantisce che tutte le aule siano raffrescate.": "The presence of air conditioning or ventilation is declared in the MIM CONDIZIONAMENTOVENTILAZIONE field. It does not measure classroom temperature and does not guarantee that all classrooms are cooled.",
    "Dettaglio": "Detail",
    "Tabella regioni": "Regional table",
    "La tabella segue lo stesso ordinamento del grafico e permette di confrontare A/C dichiarata, valori non definiti, indicatori termici e rischio caldo.": "The table follows the same ordering as the chart and lets you compare declared A/C, undefined values, thermal indicators and heat risk.",
    "Regione": "Region",
    "Righe MIM": "MIM rows",
    "A/C non definita": "A/C undefined",
    "Nessun indicatore termico": "No thermal indicator",
    "Rischio alto": "High risk",
    "Fonte: MIM, dataset edilizia scolastica e impianti. Elaborazione di Nazareno Lecis.": "Source: MIM, school buildings and systems dataset. Processing by Nazareno Lecis.",
    "Il grafico PNRR usa un JSON aggregato regionale leggero, derivato dai progetti 2021-2027 classificati come efficientamento energetico, comfort termico o mitigazione caldo.": "The NRRP chart uses a lightweight regional aggregate JSON, derived from 2021-2027 projects classified as energy efficiency, thermal comfort or heat mitigation.",
    "Fonti e repository": "Sources and repository",
    "Quota scuole-edifici con A/C dichiarata": "Share of school buildings with declared A/C",
    "Quota A/C sui soli SI/NO": "A/C share among SI/NO only",
    "Quota A/C non definita": "Undefined A/C share",
    "Quota con mitigazione termica media o alta": "Share with medium or high thermal mitigation",
    "Quota senza indicatori termici MIM": "Share without MIM thermal indicators",
    "Quota in rischio caldo alto": "Share at high heat risk",
    "Quota in rischio caldo medio/alto": "Share at medium/high heat risk",
    "Mitigazione termica media/alta": "Medium/high thermal mitigation",
    "Aria condizionata dichiarata": "Declared air conditioning",
    "Rischio caldo medio/alto": "Medium/high heat risk",
    "Tutti": "All",
    "Infanzia": "Pre-primary",
    "Primaria": "Primary",
    "Secondaria I grado": "Lower secondary",
    "Secondaria II grado": "Upper secondary",
    "Altro/non classificato": "Other/not classified",
    "per regione": "by region",
    "Campo MIM CONDIZIONAMENTOVENTILAZIONE=SI, su tutte le righe comprese quelle NON DEFINITO.": "MIM field CONDIZIONAMENTOVENTILAZIONE=SI, over all rows including NON DEFINITO values.",
    "Campo MIM CONDIZIONAMENTOVENTILAZIONE=SI, escludendo le righe NON DEFINITO dal denominatore.": "MIM field CONDIZIONAMENTOVENTILAZIONE=SI, excluding NON DEFINITO rows from the denominator.",
    "Righe MIM in cui il campo CONDIZIONAMENTOVENTILAZIONE e' NON DEFINITO o non compilato.": "MIM rows where the CONDIZIONAMENTOVENTILAZIONE field is NON DEFINITO or not filled in.",
    "Proxy del repository basato su indicatori energetici e termici MIM.": "Repository proxy based on MIM energy and thermal indicators.",
    "Righe senza segnali MIM di mitigazione termica tra quelli disponibili.": "Rows without available MIM signals of thermal mitigation.",
    "Indice di scenario basato su posizione, fragilita' termica e studenti esposti.": "Scenario index based on location, thermal vulnerability and exposed students.",
    "Perimetro ampio di priorita' potenziale prima di estendere il calendario nei mesi caldi.": "Broad potential-priority scope before extending the calendar into hot months.",
    "mld euro": "bn euros",
    "mln euro": "mn euros",
    "progetti": "projects",
    "Errore nel caricamento dei dati": "Error loading data"
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

  function normalisedPathname() {
    var path = window.location.pathname;
    if (path === "/") return "/index.html";
    if (path.slice(-1) === "/") return path + "index.html";
    return path;
  }

  function isStaticPage() {
    var path = normalisedPathname();
    return staticPages.some(function (item) {
      return path.endsWith(item);
    });
  }

  function isDashboardPage() {
    return normalisedPathname().indexOf("/dashboard/") >= 0;
  }

  function canTranslateCurrentPage() {
    return isStaticPage() || isDashboardPage();
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
    if (!window.history || !window.history.replaceState || !canTranslateCurrentPage()) return;
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

  function translateStaticPage(language, root) {
    if (!canTranslateCurrentPage() || !document.body) return;
    document.documentElement.lang = language;
    document.title = language === "en" ? translateValue(originalTitle, language) : originalTitle;

    var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, {
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
    translateStaticPage(language);
    window.setTimeout(function () {
      translateStaticPage(language);
    }, 0);
    window.dispatchEvent(new CustomEvent("site-language-change", { detail: { language: language } }));
  }

  function refreshLanguage(root) {
    var language = languageFromUrlOrStorage();
    setActive(language);
    syncArticleLinks(language);
    translateStaticPage(language, root);
  }

  function scheduleDashboardRefresh(language) {
    if (!isDashboardPage()) return;
    [0, 250, 1000, 2200].forEach(function (delay) {
      window.setTimeout(function () {
        translateStaticPage(languageFromUrlOrStorage());
      }, delay);
    });
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
    scheduleDashboardRefresh(language);
  }

  window.SiteLanguage = {
    get: languageFromUrlOrStorage,
    t: function (value) {
      return translateValue(value, languageFromUrlOrStorage());
    },
    refresh: refreshLanguage
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
