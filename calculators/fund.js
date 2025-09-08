// calculators/fund.js

function bindFund() {
  document.getElementById("calcBtn").addEventListener("click", calculateFund);
}

let fundChart = null;

function calculateFund() {
  const balance = parseFloat(document.getElementById("fund-balance").value);
  const growth = parseFloat(document.getElementById("fund-growth").value) / 100;
  const variance = parseFloat(document.getElementById("fund-variance").value) / 100;
  const withdrawal = parseFloat(document.getElementById("fund-withdrawal").value);

  let years = parseInt(document.getElementById("fund-years").value) || 0;
  let months = parseInt(document.getElementById("fund-months").value) || 0;

  // clamp months safely
  if (months < 0) months = 0;
  if (months > 11) months = 11;

  const totalMonths = years * 12 + months;

  const scenarios = [
    { label: "Low", rate: growth - variance, color: "#d62828" },
    { label: "Base", rate: growth, color: "#0d6efd" },
    { label: "High", rate: growth + variance, color: "#2ca02c" },
  ];

  const datasets = [];
  let resultsHtml = "";

  scenarios.forEach(s => {
    let bal = balance;
    const data = [];
    const monthlyRate = Math.pow(1 + s.rate, 1 / 12) - 1;
    let depletedAt = null;

    for (let m = 1; m <= totalMonths; m++) {
      // compound growth monthly
      bal *= 1 + monthlyRate;
      bal -= withdrawal;
      data.push({ x: m, y: bal });

      if (bal <= 0 && !depletedAt) {
        depletedAt = m;
        break;
      }
    }

    datasets.push({
      label: s.label,
      data: data,
      borderColor: s.color,
      borderWidth: 1.5,
      pointRadius: 0,
      fill: false,
      tension: 0.1
    });

    if (depletedAt) {
      const yrs = Math.floor(depletedAt / 12);
      const remMonths = depletedAt % 12;
      resultsHtml += `<div style="color:${s.color};text-align:left">${s.label} (${(s.rate*100).toFixed(1)}%): Funds depleted after ${yrs} years ${remMonths} months</div>`;
    } else {
      const finalBal = data[data.length - 1].y.toFixed(2);
      resultsHtml += `<div style="color:${s.color};text-align:left">${s.label} (${(s.rate*100).toFixed(1)}%): Funds remain after ${years} years ${months} months (£${finalBal})</div>`;
    }
  });

  document.getElementById("fund-results").innerHTML = resultsHtml;

  const ctx = document.getElementById("fundChart").getContext("2d");
  if (fundChart) {
    fundChart.destroy();
  }
  fundChart = new Chart(ctx, {
    type: "line",
    data: { datasets },
    options: {
      responsive: true,
      interaction: {
        mode: "index",   // show all lines at once
        intersect: false
      },
      plugins: {
        tooltip: {
          enabled: true,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: £${context.parsed.y.toFixed(2)}`;
            }
          }
        },
        legend: { display: true }
      },
      scales: {
        x: {
          type: "linear",
          title: { display: true, text: "Months" }
        },
        y: {
          title: { display: true, text: "Balance (£)" },
          beginAtZero: true
        }
      },
      events: ["mousemove", "mouseout", "mouseenter", "mouseleave", "touchstart", "touchmove"]
    }
  });
}

