(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function ensureHiddenDownloadTarget() {
    if (byId("downloadScatter")) return;
    var button = document.createElement("button");
    button.id = "downloadScatter";
    button.type = "button";
    button.hidden = true;
    button.setAttribute("aria-hidden", "true");
    button.style.display = "none";
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
    });
    (document.body || document.documentElement).appendChild(button);
  }

  function removeCsvControls() {
    document.querySelectorAll("#downloadScatterCsv, button, a").forEach(function (element) {
      var text = (element.textContent || "").toLowerCase();
      var href = element.getAttribute && (element.getAttribute("href") || "");
      var download = element.hasAttribute && element.hasAttribute("download");
      var isCsv = text.indexOf("csv") >= 0 || href.toLowerCase().indexOf(".csv") >= 0 || download;
      if (isCsv && element.id !== "downloadScatter") {
        element.remove();
      }
    });
  }

  function apply() {
    ensureHiddenDownloadTarget();
    removeCsvControls();
  }

  function observe() {
    apply();
    if (!document.body) return;
    var observer = new MutationObserver(function () {
      apply();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observe);
    ensureHiddenDownloadTarget();
  } else {
    observe();
  }
})();
