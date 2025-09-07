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
  const months = parseInt(document.getElementById("fund-months").value);

  const scenarios = [
    { label: "Low", rate: growth - variance, color: "#d62828" },
    { label: "Base", rate: growth, color: "#0d6efd" },
    { label: "High", rate: growth + variance, color: "#2ca02c" },
  ];

  const datasets = [];
  let resultsHtml = `<h3>Results</h3>`;

  scenarios.forEach(s => {
    let bal = balance;
    const data = [];
    let depletedAt = null;

    for (let m = 1; m <= months; m++) {
      bal *= 1 + s.rate / 12;
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
      const years = Math.floor(depletedAt / 12);
      const remMonths = depletedAt % 12;
      resultsHtml += `<p style="color:${s.color}">${s.label}: Funds depleted after ${years} years ${remMonths} months</p>`;
    } else {
      const finalBal = data[data.length - 1].y.toFixed(2);
      resultsHtml += `<p style="color:${s.color}">${s.label}: Funds remain after ${months} months (£${finalBal})</p>`;
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
        mode: "nearest",
        intersect: false
      },
      plugins: {
        tooltip: {
          enabled: true,
          callbacks: {
            label: function(context) {
              return `£${context.parsed.y.toFixed(2)}`;
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
      // Disable clicks/drags from triggering redraws
      events: ["mousemove", "mouseout", "mouseenter", "mouseleave", "touchstart", "touchmove"]
    }
  });
}

