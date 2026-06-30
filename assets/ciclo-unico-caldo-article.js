(() => {
  const DATA_URL = "../data/ciclo-unico-caldo/article_data.json";
  const gradeKeys = ["Infanzia", "Primaria", "Secondaria I grado", "Secondaria II grado"];
  const gradeColors = ["#ff5a1f", "#f2a541", "#cc6a2c", "#ffe0b5"];
  const ageKeys = ["Prima del 1976", "1976-1992", "Dal 1993", "Non definito"];
  const ageColors = ["#ff5a1f", "#f2a541", "#cc6a2c", "#8d8178"];
  const moneyColors = ["#ff5a1f", "#f2a541", "#cc6a2c"];

  const byId = (id) => document.getElementById(id);

  function formatNumber(value) {
    return Number(value || 0).toLocaleString("it-IT", { maximumFractionDigits: 0 });
  }

  function formatPercent(value, digits = 1) {
    return Number(value || 0).toLocaleString("it-IT", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }) + "%";
  }

  function formatBillions(value) {
    return (Number(value || 0) / 1_000_000_000).toLocaleString("it-IT", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + " mld";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function legend(keys, colors) {
    return keys.map((key, index) => (
      "<span class=\"chart-legend-item\"><i style=\"background:" + colors[index] + "\"></i>" +
      escapeHtml(key) + "</span>"
    )).join("");
  }

  function setKpis(data) {
    const summary = data.summary;
    byId("kpiMimRows").textContent = formatNumber(summary.mim_rows);
    byId("kpiAcShare").textContent = formatPercent(summary.air_conditioning_yes_pct, 2);
    byId("kpiHeatCost").textContent = formatBillions(summary.heat_package_base_eur);
    byId("kpiHeatGdp").textContent = formatPercent(summary.heat_package_pil_pct, 3);
  }

  function drawRegionalGrade(data) {
    const target = byId("regionalGradeChart");
    const rows = data.regional_grade.slice().sort((a, b) => b.Tutti - a.Tutti);
    const width = 1240;
    const height = 570;
    const margin = { top: 54, right: 24, bottom: 128, left: 56 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const maxValue = Math.max(35, ...rows.flatMap((row) => gradeKeys.map((key) => Number(row[key] || 0))));
    const groupWidth = chartWidth / rows.length;
    const barWidth = Math.max(7, Math.min(13, (groupWidth - 10) / gradeKeys.length));
    let svg = "";

    [0, 10, 20, 30].forEach((tick) => {
      const y = margin.top + chartHeight - tick / maxValue * chartHeight;
      svg += "<line class=\"grid-line\" x1=\"" + margin.left + "\" x2=\"" + (width - margin.right) + "\" y1=\"" + y + "\" y2=\"" + y + "\"></line>";
      svg += "<text class=\"axis-label\" x=\"12\" y=\"" + (y + 4) + "\">" + tick + "%</text>";
    });

    rows.forEach((row, rowIndex) => {
      const groupX = margin.left + rowIndex * groupWidth + groupWidth / 2;
      gradeKeys.forEach((key, gradeIndex) => {
        const value = Number(row[key] || 0);
        const x = groupX - (barWidth * gradeKeys.length) / 2 + gradeIndex * barWidth;
        const barHeight = value / maxValue * chartHeight;
        const y = margin.top + chartHeight - barHeight;
        svg += "<rect class=\"article-bar\" x=\"" + x + "\" y=\"" + y + "\" width=\"" + (barWidth - 1) + "\" height=\"" + barHeight + "\" fill=\"" + gradeColors[gradeIndex] + "\"></rect>";
      });
      const label = row.regione.length > 15 ? row.regione.slice(0, 14) + "." : row.regione;
      svg += "<text class=\"axis-label\" text-anchor=\"end\" transform=\"translate(" + groupX + "," + (height - margin.bottom + 18) + ") rotate(-55)\">" + escapeHtml(label) + "</text>";
      svg += "<text class=\"value-label\" text-anchor=\"middle\" x=\"" + groupX + "\" y=\"" + (margin.top + chartHeight - Number(row.Tutti || 0) / maxValue * chartHeight - 8) + "\">" + formatPercent(row.Tutti, 1) + "</text>";
    });

    target.innerHTML =
      "<div class=\"chart-legend\">" + legend(gradeKeys, gradeColors) + "</div>" +
      "<div class=\"chart-scroll\"><svg viewBox=\"0 0 " + width + " " + height + "\" role=\"img\" aria-label=\"Quota con aria condizionata per regione e grado\">" + svg + "</svg></div>";
  }

  function drawAgeBars(data) {
    const target = byId("ageRegionChart");
    const rows = data.age_regions.slice().sort((a, b) => b["Prima del 1976 pct"] - a["Prima del 1976 pct"]);
    const width = 1120;
    const rowHeight = 28;
    const margin = { top: 22, right: 110, bottom: 22, left: 178 };
    const height = margin.top + margin.bottom + rows.length * rowHeight;
    const chartWidth = width - margin.left - margin.right;
    let svg = "";

    rows.forEach((row, index) => {
      const y = margin.top + index * rowHeight;
      let x = margin.left;
      svg += "<text class=\"axis-label\" text-anchor=\"end\" x=\"" + (margin.left - 10) + "\" y=\"" + (y + 17) + "\">" + escapeHtml(row.regione) + "</text>";
      ageKeys.forEach((key, keyIndex) => {
        const value = Number(row[key + " pct"] || 0);
        const segmentWidth = chartWidth * value / 100;
        svg += "<rect class=\"article-bar\" x=\"" + x + "\" y=\"" + y + "\" width=\"" + segmentWidth + "\" height=\"18\" fill=\"" + ageColors[keyIndex] + "\"></rect>";
        x += segmentWidth;
      });
      svg += "<text class=\"value-label\" x=\"" + (margin.left + chartWidth + 8) + "\" y=\"" + (y + 15) + "\">" + formatPercent(row["Prima del 1976 pct"], 0) + "</text>";
    });

    target.innerHTML =
      "<div class=\"chart-legend\">" + legend(ageKeys, ageColors) + "</div>" +
      "<div class=\"chart-scroll\"><svg viewBox=\"0 0 " + width + " " + height + "\" role=\"img\" aria-label=\"Età degli edifici scolastici per regione\">" + svg + "</svg></div>";
  }

  function drawCostBars(data) {
    const target = byId("costChart");
    const rows = data.cost_options;
    const width = 980;
    const height = 310;
    const margin = { top: 28, right: 180, bottom: 64, left: 228 };
    const chartWidth = width - margin.left - margin.right;
    const maxValue = Math.max(...rows.map((row) => row.costo_eur));
    let svg = "";

    rows.forEach((row, index) => {
      const y = margin.top + index * 66;
      const barWidth = Number(row.costo_eur || 0) / maxValue * chartWidth;
      svg += "<text class=\"axis-label\" text-anchor=\"end\" x=\"" + (margin.left - 12) + "\" y=\"" + (y + 24) + "\">" + escapeHtml(row.nome) + "</text>";
      svg += "<rect class=\"article-bar\" x=\"" + margin.left + "\" y=\"" + y + "\" width=\"" + barWidth + "\" height=\"30\" fill=\"" + moneyColors[index] + "\"></rect>";
      svg += "<text class=\"value-label\" x=\"" + (margin.left + barWidth + 10) + "\" y=\"" + (y + 20) + "\">" + formatBillions(row.costo_eur) + "  " + formatPercent(row.pil_pct, 3) + " del PIL</text>";
      svg += "<text class=\"axis-label\" x=\"" + margin.left + "\" y=\"" + (y + 50) + "\">spalmato sugli anni del modello  " + formatPercent(row.pil_annuo_pct, 3) + " del PIL annuo</text>";
    });

    target.innerHTML = "<div class=\"chart-scroll\"><svg viewBox=\"0 0 " + width + " " + height + "\" role=\"img\" aria-label=\"Costo stimato e quota di PIL\">" + svg + "</svg></div>";
  }

  function setCostTable(data) {
    const rows = data.heat_by_category;
    byId("costTableBody").innerHTML = rows.map((row) => (
      "<tr><td>" + escapeHtml(row.nome) + "</td><td>" + formatBillions(row.costo_eur) +
      "</td><td>" + formatPercent(row.pil_pct, 3) + "</td></tr>"
    )).join("");
  }

  fetch(DATA_URL)
    .then((response) => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then((data) => {
      setKpis(data);
      drawRegionalGrade(data);
      drawAgeBars(data);
      drawCostBars(data);
      setCostTable(data);
    })
    .catch((error) => {
      ["regionalGradeChart", "ageRegionChart", "costChart"].forEach((id) => {
        const target = byId(id);
        if (target) target.textContent = "Errore nel caricamento dei dati " + error.message;
      });
    });
})();
