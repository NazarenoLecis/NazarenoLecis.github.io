(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function setText(selector, text) {
    var element = document.querySelector(selector);
    if (element) element.textContent = text;
  }

  function setOptionText(selectId, value, text) {
    var select = byId(selectId);
    if (!select) return;
    Array.from(select.options).forEach(function (option) {
      if (option.value === value) option.textContent = text;
    });
  }

  function updateModeNote() {
    var mode = byId("timeMode") ? byId("timeMode").value : "fixed_horizon";
    var note = byId("timeModeNote");
    if (!note) return;
    if (mode === "cohort_path") {
      note.textContent = "Lettura selezionata: stessa coorte, anni dalla laurea diversi. L’asse orizzontale indica la distanza dalla laurea, per esempio 1 e 5 anni. Serve per vedere come cambia l’esito dello stesso gruppo di laureati nel tempo.";
    } else {
      note.textContent = "Lettura selezionata: stessa distanza dalla laurea, coorti diverse. L’asse orizzontale indica l’anno di indagine. Serve per confrontare, per esempio, il dato sempre a 1 anno o sempre a 5 anni dalla laurea.";
    }
  }

  function updateIntro() {
    setText("#timeSection .section-head h2", "Due modi di leggere il tempo");
    setText("#timeSection .section-head p", "La prima lettura confronta coorti diverse tenendo fissa la distanza dalla laurea, per esempio sempre a 1 anno o sempre a 5 anni. La seconda segue la stessa coorte e mostra come cambiano occupazione o retribuzione negli anni successivi al titolo.");
    setText("#timeSection .filter-intro p", "Scegli se confrontare anni di indagine diversi a distanza fissa dalla laurea, oppure seguire una sola coorte lungo gli orizzonti disponibili.");

    var cards = document.querySelectorAll("#timeSection .time-method-panel > div");
    if (cards[0]) {
      setText("#timeSection .time-method-panel > div:nth-child(1) h3", "Trend a distanza fissa");
      setText("#timeSection .time-method-panel > div:nth-child(1) p", "Confronta indagini diverse mantenendo fissa la distanza dalla laurea. Per esempio: tutti i laureati osservati a 1 anno, oppure tutti quelli osservati a 5 anni. Le coorti cambiano.");
    }
    if (cards[1]) {
      setText("#timeSection .time-method-panel > div:nth-child(2) h3", "Percorso della stessa coorte");
      setText("#timeSection .time-method-panel > div:nth-child(2) p", "Fissa l’anno di laurea e segue lo stesso gruppo di laureati negli orizzonti disponibili. Qui cambia la distanza dalla laurea, non la coorte.");
    }
    if (cards[2]) {
      setText("#timeSection .time-method-panel > div:nth-child(3) h3", "Differenza da tenere presente");
      setText("#timeSection .time-method-panel > div:nth-child(3) p", "Nel trend a distanza fissa l’asse orizzontale è l’anno di indagine. Nel percorso della stessa coorte l’asse orizzontale è il numero di anni dalla laurea.");
    }
  }

  function updateLabels() {
    setOptionText("timeMode", "fixed_horizon", "Trend a distanza fissa: sempre 1 o 5 anni");
    setOptionText("timeMode", "cohort_path", "Percorso della stessa coorte");
    updateIntro();
    updateModeNote();
  }

  function bind() {
    updateLabels();
    window.setTimeout(updateLabels, 300);
    var timeMode = byId("timeMode");
    if (timeMode) {
      timeMode.addEventListener("change", function () {
        window.setTimeout(updateLabels, 0);
        window.setTimeout(updateLabels, 250);
      });
    }
    ["resetTimeFilters", "timeMetric", "timeYearsAfter", "timeCohort"].forEach(function (id) {
      var element = byId(id);
      if (element) {
        element.addEventListener(id === "resetTimeFilters" ? "click" : "change", function () {
          window.setTimeout(updateLabels, 0);
          window.setTimeout(updateLabels, 250);
        });
      }
    });
  }

  function waitForControls(attempt) {
    if (byId("timeMode") && byId("timeMode").options.length) {
      bind();
      return;
    }
    if (attempt > 80) return;
    window.setTimeout(function () { waitForControls(attempt + 1); }, 100);
  }

  function init() {
    if (location.pathname.indexOf("/dashboard/almalaurea/") < 0) return;
    waitForControls(0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
