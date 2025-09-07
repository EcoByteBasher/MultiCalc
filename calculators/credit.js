// calculators/credit.js
function bindCredit() {
  const byId = id => document.getElementById(id);
  byId('calcBtn').addEventListener('click', calculateCredit);
  document.addEventListener('keydown', e => { if (e.key === 'Enter') calculateCredit(); });
}

function calculateCredit() {
  const byId = id => document.getElementById(id);

  const balance = parseFloat(byId('balance').value);
  const apr = parseFloat(byId('apr').value);
  const payment = parseFloat(byId('payment').value);
  const monthlyRate = apr / 100 / 12;

  clearWarning();

  if (isNaN(balance) || isNaN(apr) || isNaN(payment)) {
    showWarning("Please fill in all fields.");
    return;
  }

  // monthly interest on opening balance
  const monthlyInterest = balance * monthlyRate;

  // Case 1: Payment never clears the debt
  if (payment <= monthlyInterest) {
    showWarning("Monthly payment is too low to ever clear the debt.");
    return;
  }

  // Case 2: Calculate repayment time (months) using logarithmic formula
  const t = Math.log(payment / (payment - balance * monthlyRate)) / Math.log(1 + monthlyRate);

  // Case 2a: More than 50 years (600 months)
  if (t > 600) {
    showWarning("It would take more than 50 years to repay this debt.");
    return;
  }

  // Case 3: Normal repayment path
  const months = Math.ceil(t);
  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  const totalPaid = payment * months;
  const totalInterest = totalPaid - balance;

  byId('time').textContent = `${years} years ${remMonths} months`;
  byId('interest').textContent = totalInterest.toLocaleString(undefined, { style: 'currency', currency: 'GBP' });
  byId('total').textContent = totalPaid.toLocaleString(undefined, { style: 'currency', currency: 'GBP' });

  setResultsActive(true);
}

function showWarning(msg) {
  const warn = document.getElementById('warning');
  warn.textContent = msg;
  warn.style.display = 'block';
  setResultsActive(false);
}

function clearWarning() {
  const warn = document.getElementById('warning');
  warn.textContent = "";
  warn.style.display = 'none';
}

function setResultsActive(active) {
  const results = document.querySelectorAll('#results .val');
  results.forEach(r => {
    r.style.opacity = active ? '1' : '0.4';
  });
}

