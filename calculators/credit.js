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
    setResultsActive(false);
    return;
  }

  // APR = 0 → straight line repayment
  if (monthlyRate === 0) {
    const months = Math.ceil(balance / payment);
    const years = Math.floor(months / 12);
    const remMonths = months % 12;
    const fullPayments = months - 1;
    const finalPayment = balance - fullPayments * payment;
    const totalPaid = fullPayments * payment + finalPayment;

    byId('time').textContent = `${years} years ${remMonths} months`;
    byId('interest').textContent = formatCurrency(0);
    byId('total').textContent = formatCurrency(totalPaid);
    byId('last').textContent = formatCurrency(finalPayment);

    setResultsActive(true);
    return;
  }

  // Case 1: Payment too low
  const monthlyInterest = balance * monthlyRate;
  const minPayment = monthlyInterest + 1;
  if (payment <= monthlyInterest) {
    showWarning(
      `Monthly payment is too low to ever clear the debt. Minimum required: ${formatCurrency(minPayment)}`
    );
    setResultsActive(false);
    return;
  }

  // Case 2: Repayment > 50 years
  const t = Math.log(payment / (payment - balance * monthlyRate)) / Math.log(1 + monthlyRate);
  if (t > 600) {
    showWarning("It would take more than 50 years to repay this debt.");
    setResultsActive(false);
    return;
  }

  // Case 3: Iterative repayment with final payment
  const months = Math.ceil(t);
  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  let remaining = balance;
  let totalPaid = 0;
  let totalInterest = 0;
  let finalPayment = payment;

  for (let m = 1; m <= months; m++) {
    const interest = remaining * monthlyRate;
    let principal = payment - interest;

    if (remaining - principal < 0) {
      principal = remaining;
    }

    const actualPayment = principal + interest;
    remaining -= principal;
    totalPaid += actualPayment;
    totalInterest += interest;
    finalPayment = actualPayment;

    if (remaining <= 0) break;
  }

  // Round neatly
  totalPaid = round2(totalPaid);
  totalInterest = round2(totalInterest);
  finalPayment = round2(finalPayment);

  byId('time').textContent = `${years} years ${remMonths} months`;
  byId('interest').textContent = formatCurrency(totalInterest);
  byId('total').textContent = formatCurrency(totalPaid);
  byId('last').textContent = formatCurrency(finalPayment);

  setResultsActive(true);
}

function showWarning(msg) {
  const warn = document.getElementById("warning");
  if (warn) {
    warn.textContent = msg;
    warn.style.display = "block";
  }
}

function clearWarning() {
  const warn = document.getElementById("warning");
  if (warn) {
    warn.textContent = "";
    warn.style.display = "none";
  }
}

function setResultsActive(active) {
  const results = document.querySelectorAll('#results .val');
  results.forEach(r => {
    if(!active) r.textContent = "—";
  });
}

function formatCurrency(num) {
  return num.toLocaleString(undefined, { style: 'currency', currency: 'GBP' });
}

function round2(num) {
  return Math.round(num * 100) / 100;
}

