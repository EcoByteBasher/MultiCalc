function bindFund() {
  document.getElementById("calcBtn").addEventListener("click", calculateFund);
}

let fundChart;

function calculateFund() {
  const start = parseFloat(document.getElementById("start").value) || 0;
  const draw = parseFloat(document.getElementById("draw").value) || 0;
  const rate = parseFloat(document.getElementById("rate").value) || 0;
  const variance = parseFloat(document.getElementById("variance").value) || 0;
  const timeframeYears = parseInt(document.getElementById("timeframe").value) || 30;
  const timeframe = timeframeYears * 12;

  const rateType = document.querySelector("input[name='rateType']:checked").value;
  const monthlyRate = rateType === "aer"
    ? Math.pow(1 + rate / 100, 1 / 12) - 1
    : (rate / 100) / 12;

  const scenarios = [
    { label: "Low", color: "#d62828", r: (rate - variance) },
    { label: "Base", color: "#0d6efd", r: rate },
    { label: "High", color: "#2ca02c", r: (rate + variance) }
  ];

  const results = {};
  const chartData = [];

  scenarios.forEach(s => {
    const monthly = rateType === "aer"
      ? Math.pow(1 + s.r / 100, 1 / 12) - 1
      : (s.r / 100) / 12;

    let balance = start;
    let totalGrowth = 0;
    const balances = [];
    let months = 0;

    for (months = 0; months < timeframe; months++) {
      if (balance <= 0) break;
      balance -= draw;
      if (balance <= 0) {
        balance = 0;
        balances.push(balance);
        break;
      }
      const growth = balance * monthly;
      balance += growth;
      totalGrowth += growth;
      balances.push(balance);
    }

    results[s.label] = {
      months: balance > 0 ? null : months + 1,
      growth: totalGrowth,
      remaining: balance
    };

    chartData.push({
      label: s.label,
      data: balances,
      borderColor: s.color,
      borderWidth: 1.5,
      tension: 0.2,
      fill: false
    });
  });

  // Render results
  const res = document.getElementById("fundResults");
  res.innerHTML = "";

  ["Low", "Base", "High"].forEach((lbl, i) => {
    const r = results[lbl];
    const colorClass = i === 0 ? "red" : i === 1 ? "blue" : "green";

    if (r.months) {
      res.innerHTML += `
        <div>${lbl} scenario (Rate ${(scenarios[i].r).toFixed(1)}%)</div>
        <div class="val ${colorClass}">${r.months} months until depletion</div>
        <div>Total growth</div>
        <div class="val ${colorClass}">£${r.growth.toLocaleString()}</div>
      `;
    } else {
      res.innerHTML += `
        <div>${lbl} scenario (Rate ${(scenarios[i].r).toFixed(1)}%)</div>
        <div class="val ${colorClass}">Funds not depleted</div>
        <div>Funds remaining</div>
        <div class="val ${colorClass}">£${r.remaining.toLocaleString()}</div>
        <div>Total growth</div>
        <div class="val ${colorClass}">£${r.growth.toLocaleString()}</div>
      `;
    }
  });

  // Render chart
  const ctx = document.getElementById("fundChart").getContext("2d");
  if (fundChart) fundChart.destroy();

  fundChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: Array.from({ length: timeframe }, (_, i) => i + 1),
      datasets: chartData
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: ctx => `${ctx.dataset.label}: £${ctx.parsed.y.toLocaleString()}`
          }
        }
      },
      elements: {
        line: { borderWidth: 1.5 },   // ✅ force thin lines
        point: { radius: 0 }          // ✅ hide markers for cleaner look
      },
      scales: {
        x: {
          title: { display: true, text: "Months" }
        },
        y: {
          title: { display: true, text: "Balance (£)" }
        }
      }
    }
  });
}

