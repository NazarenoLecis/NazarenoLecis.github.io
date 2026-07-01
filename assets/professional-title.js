(function () {
  var variants = [
    "Statistician and Risk Analysis Officer",
    "Statistician and Risk Analyst Officer"
  ];
  var target = "Statistician and Risk Analyst";
  var running = false;

  function replaceText(value) {
    var output = String(value == null ? "" : value);
    variants.forEach(function (variant) {
      output = output.split(variant).join(target);
    });
    return output;
  }

  function fixNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    var fixed = replaceText(node.nodeValue);
    if (fixed !== node.nodeValue) node.nodeValue = fixed;
  }

  function fixElement(element) {
    if (!element || !element.getAttribute) return;
    ["title", "alt", "aria-label", "content"].forEach(function (attr) {
      if (!element.hasAttribute(attr)) return;
      var current = element.getAttribute(attr);
      var fixed = replaceText(current);
      if (fixed !== current) element.setAttribute(attr, fixed);
    });
  }

  function run() {
    if (running) return;
    running = true;
    document.title = replaceText(document.title);
    var walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) fixNode(node);
    document.querySelectorAll("[title],[alt],[aria-label],meta[content]").forEach(fixElement);
    running = false;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();

  if (window.MutationObserver) {
    new MutationObserver(run).observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["title", "alt", "aria-label", "content"]
    });
  }
})();