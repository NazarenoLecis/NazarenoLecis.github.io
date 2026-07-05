(function () {
  "use strict";

  function removeLegacyPanel() {
    var panel = document.getElementById("bpOpenbdapCompare");
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", removeLegacyPanel);
  } else {
    removeLegacyPanel();
  }
})();
