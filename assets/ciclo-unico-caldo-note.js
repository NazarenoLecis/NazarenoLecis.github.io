(function () {
  function addTrentinoDataNote() {
    var list = document.querySelector("#methodologySection .notes-panel ul, #methodologySection ul");
    if (!list || document.getElementById("trentinoAltoAdigeDataNote")) return;

    var note = document.createElement("li");
    note.id = "trentinoAltoAdigeDataNote";
    note.textContent = "Nel dataset utilizzato mancano i dati del Trentino-Alto Adige. I confronti regionali e i totali nazionali della dashboard vanno letti tenendo conto di questa assenza.";
    list.appendChild(note);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addTrentinoDataNote);
  } else {
    addTrentinoDataNote();
  }
})();
