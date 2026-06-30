(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function ensureStyle() {
    if (byId("almCoverageNoteStyle")) return;
    var style = document.createElement("style");
    style.id = "almCoverageNoteStyle";
    style.textContent = ".alm-coverage-note{display:block;margin-top:8px;color:var(--muted);font-size:.86rem;line-height:1.35}.source-panel .alm-coverage-note{margin-top:8px}";
    document.head.appendChild(style);
  }

  function addNoteToSource() {
    var sourceMeta = byId("sourceMeta");
    if (!sourceMeta || byId("sourceCoverageNote")) return;
    var note = document.createElement("span");
    note.id = "sourceCoverageNote";
    note.className = "alm-coverage-note";
    note.textContent = "Perimetro: solo atenei presenti nei dati AlmaLaurea caricati. Atenei non aderenti o non pubblicati nel dataset non compaiono nei filtri.";
    sourceMeta.insertAdjacentElement("afterend", note);
  }

  function addNoteToUniversityFilters() {
    ["scatterUniversity", "boxUniversity", "timeUniversity"].forEach(function (id) {
      var select = byId(id);
      if (!select) return;
      var label = select.closest("label");
      if (!label || label.querySelector(".alm-coverage-note")) return;
      var note = document.createElement("span");
      note.className = "alm-coverage-note";
      note.textContent = "Lista ricavata dal dataset AlmaLaurea caricato.";
      label.appendChild(note);
    });
  }

  function update() {
    ensureStyle();
    addNoteToSource();
    addNoteToUniversityFilters();
  }

  function init() {
    if (location.pathname.indexOf("/dashboard/almalaurea/") < 0) return;
    update();
    window.setTimeout(update, 300);
    window.setTimeout(update, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
