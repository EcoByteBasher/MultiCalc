function bindTarget() {
  const byId = id => document.getElementById(id);
  byId('calcBtn').addEventListener('click', calculateTarget);
  document.addEventListener('keydown', e => { if (e.key === 'Enter') calculateTarget(); });
}

function calculateTarget() {
  const byId = id => document.getElementById(id);

  const start = Math.max(0, parseFloat(byId('start').value || '0'));
  const monthly = Math.max(0, parseFloat(byId('monthly').value || '0'));
  const target = Math.max(1, parseFloat(byId('target').value || '0'));
  const annual = Math.max(0, parseFloat(byId('rate').value || '0'));

  const mode = document.querySelector('input[name="calcType"]:checked').value;
  const r = (mode === 'annually')
    ? Math.pow(1 + annual / 100, 1/12) - 1
    : (annual / 100) / 12;

  let balance = start;
  let months = 0;

  while (balance < target && months < 1000 * 12) {
    balance = balance * (1 + r) + monthly;
    months++;
  }

  // Formatters
  const fmtMoney = n => '£' + (isFinite(n) ? n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '—');
  const fmtTime = m => (m >= 1200) ? 'Over 100 years' : `${Math.floor(m / 12)} years ${m % 12} months`;

  // Contributions = initial + deposits
  const contributions = start + monthly * months;
  const growth = balance - contributions;

  // Percentages
  const contribPct = balance > 0 ? (contributions / balance * 100) : 0;
  const growthPct = balance > 0 ? (growth / balance * 100) : 0;

  // Update UI
  byId('timeToTarget').textContent = fmtTime(months);
  byId('totalContrib').textContent = fmtMoney(contributions);
  byId('growth').textContent = fmtMoney(growth);
  byId('finalBalance').textContent = fmtMoney(balance);
  byId('breakdown').textContent = 
    `${contribPct.toFixed(1)}% contributions / ${growthPct.toFixed(1)}% growth`;
}

