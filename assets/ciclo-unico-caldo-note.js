(function () {
  function addTrentinoDataNote() {
    var list = document.querySelector("#methodologySection .notes-panel ul, #methodologySection ul");
    if (!list || document.getElementById("trentinoAltoAdigeDataNote")) return;

    var note = document.createElement("li");
    note.id = "trentinoAltoAdigeDataNote";
    note.textContent = "Nel dataset MIM nazionale gli indicatori edilizi e impiantistici del Trentino-Alto Adige non sono disponibili. I confronti regionali e i totali nazionali della dashboard vanno letti tenendo conto di questa copertura informativa.";
    list.appendChild(note);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addTrentinoDataNote);
  } else {
    addTrentinoDataNote();
  }
})();
