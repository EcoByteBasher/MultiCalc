// calculators/fund.js

function bindFund() {
  const byId = id => document.getElementById(id);
  byId('calcBtn').addEventListener('click', calculateFund);
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') calculateFund();
  });
}

function calculateFund() {
  const balance = parseFloat(document.getElementById('fund-balance').value) || 0;
  const growth = (parseFloat(document.getElementById('fund-growth').value) || 0) / 100;
  const variance = (parseFloat(document.getElementById('fund-variance').value) || 0) / 100;
  const withdrawal = parseFloat(document.getElementById('fund-withdrawal').value) || 0;
  const customMonths = parseInt(document.getElementById('fund-months').value) || 600;

  const resultsDiv = document.getElementById('fund-results');
  const ctx = document.getElementById('fundChart').getContext('2d');

  // helper to simulate depletion
  function simulate(rate) {
    let months = 0, bal = balance, totalInterest = 0, totalContrib = 0;
    while (bal > 0 && months < customMonths) {
      const interest = bal * (rate / 12);
      bal += interest;
      totalInterest += interest;
      bal -= withdrawal;
      totalContrib += withdrawal;
      months++;
    }
    return { months, bal: Math.max(bal, 0), totalInterest, totalContrib };
  }

  const low = simulate(growth - variance);
  const base = simulate(growth);
  const high = simulate(growth + variance);

  function formatYM(months) {
    if (months >= customMonths) return "Not depleted";
    const y = Math.floor(months / 12);
    const m = months % 12;
    return `${y}y ${m}m`;
  }

  resultsDiv.innerHTML = `
    <div class="results">
      <span>Time to depletion (Low):</span><span class="val red">${formatYM(low.months)}</span>
      <span>Time to depletion (Base):</span><span class="val blue">${formatYM(base.months)}</span>
      <span>Time to depletion (High):</span><span class="val green">${formatYM(high.months)}</span>
      <span>Total growth (Base):</span><span class="val blue">£${base.totalInterest.toFixed(2)}</span>
      <span>Funds remaining (Base):</span><span class="val blue">£${base.bal.toFixed(2)}</span>
    </div>
  `;

  // Chart.js rendering
  if (window.fundChart) {
    window.fundChart.destroy();
  }

  function trajectory(rate) {
    let bal = balance;
    const points = [bal];
    for (let m = 0; m < customMonths; m++) {
      bal += bal * (rate / 12);
      bal -= withdrawal;
      points.push(Math.max(bal, 0));
      if (bal <= 0) break;
    }
    return points;
  }

  window.fundChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({ length: customMonths + 1 }, (_, i) => i),
      datasets: [
        {
          label: 'Low',
          data: trajectory(growth - variance),
          borderColor: '#d62828',
          borderWidth: 1.5,
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Base',
          data: trajectory(growth),
          borderColor: '#0000CD',
          borderWidth: 1.5,
          fill: false,
          pointRadius: 0
        },
        {
          label: 'High',
          data: trajectory(growth + variance),
          borderColor: '#00aa00',
          borderWidth: 1.5,
          fill: false,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: ctx => `£${ctx.parsed.y.toFixed(2)}`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Months' }
        },
        y: {
          title: { display: true, text: 'Balance (£)' }
        }
      }
    }
  });
}

