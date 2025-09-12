// calculators/credit.js
function bindCredit() {
  const byId = id => document.getElementById(id);
  byId('calcBtn').addEventListener('click', calculateCredit);
  document.addEventListener('keydown', e => { if (e.key === 'Enter') calculateCredit(); });

  // Toggle repayment input fields
  const radios = document.querySelectorAll('input[name="repay-mode"]');
  const paymentRow = document.getElementById('payment-row');
  const timeframeRow = document.getElementById('timeframe-row');

  radios.forEach(r => {
    r.addEventListener('change', () => {
      if (r.value === "payment" && r.checked) {
        paymentRow.style.display = "flex";
        timeframeRow.style.display = "none";
      } else if (r.value === "time" && r.checked) {
        paymentRow.style.display = "none";
        timeframeRow.style.display = "flex";
      }
    });
  });
}

function calculateCredit() {
  const byId = id => document.getElementById(id);

  const balance = parseFloat(byId('balance').value);
  const apr = parseFloat(byId('apr').value);
  const monthlyRate = apr / 100 / 12;

  // radio name we used earlier
  const mode = document.querySelector('input[name="repay-mode"]:checked')?.value || 'payment';

  // primary label element (where we switch the text)
  const primaryLabel = byId('primary-label') || null;

  clearWarning();

  // basic validation
  if (isNaN(balance) || isNaN(apr)) {
    showWarning("Please fill in balance and APR.");
    setResultsActive(false);
    return;
  }

  // variables to be used by the shared simulation
  let payment = NaN;
  let months = 0;

  // ---- MODE A: user supplied monthly payment ----
  if (mode === 'payment') {
    payment = parseFloat(byId('payment').value);
    if (isNaN(payment) || payment <= 0) {
      showWarning("Please enter a valid monthly payment.");
      setResultsActive(false);
      return;
    }

    // APR = 0 special-case: straight-line repayment
    if (monthlyRate === 0) {
      months = Math.ceil(balance / payment);
      const years = Math.floor(months / 12);
      const remMonths = months % 12;
      const fullPayments = months - 1;
      const finalPayment = round2(balance - fullPayments * payment);
      const totalPaid = round2(fullPayments * payment + finalPayment);

      if (primaryLabel) primaryLabel.textContent = "Time to clear debt";
      byId('time').textContent = `${years} years ${remMonths} months`;
      byId('interest').textContent = formatCurrency(0);
      byId('total').textContent = formatCurrency(totalPaid);
      byId('last').textContent = formatCurrency(finalPayment);

      setResultsActive(true);
      return;
    }

    // ensure payment > interest on opening balance
    const monthlyInterest = balance * monthlyRate;
    const minPayment = monthlyInterest + 1;
    if (payment <= monthlyInterest) {
      showWarning(`Monthly payment is too low to ever clear the debt. Minimum required: ${formatCurrency(minPayment)}`);
      setResultsActive(false);
      return;
    }

    // analytic months estimate (may be fractional) and clamp to 50 years
    const t = Math.log(payment / (payment - balance * monthlyRate)) / Math.log(1 + monthlyRate);
    if (!isFinite(t) || t > 600) {
      showWarning("It would take more than 50 years to repay this debt.");
      setResultsActive(false);
      return;
    }
    months = Math.ceil(t);

  // ---- MODE B: user supplied timeframe ----
  } else {
    const years = parseInt(byId('years').value) || 0;
    const extraMonths = parseInt(byId('months').value) || 0;
    months = years * 12 + extraMonths;

    if (months <= 0) {
      showWarning("Please enter a valid timeframe (years and/or months).");
      setResultsActive(false);
      return;
    }
    if (months > 600) {
      showWarning("Please choose a timeframe of 50 years (600 months) or less.");
      setResultsActive(false);
      return;
    }

    if (monthlyRate === 0) {
      payment = balance / months;
    } else {
      // annuity formula for required monthly payment
      payment = balance * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
    }
  }

  // ---- Shared month-by-month simulation (so final payment & totals are exact) ----
  let remaining = balance;
  let totalPaid = 0;
  let totalInterest = 0;
  let finalPayment = payment;
  let monthsTaken = 0;

  for (let m = 1; m <= months; m++) {
    monthsTaken++;
    const interest = remaining * monthlyRate;
    let principal = payment - interest;

    // final partial payment case
    if (principal > remaining) principal = remaining;

    const actualPayment = principal + interest;
    // avoid tiny negative residues
    remaining = Math.max(0, remaining - principal);

    totalPaid += actualPayment;
    totalInterest += interest;
    finalPayment = actualPayment;

    if (remaining <= 1e-9) break;
  }

  // Round for display
  totalPaid = round2(totalPaid);
  totalInterest = round2(totalInterest);
  finalPayment = round2(finalPayment);

  // Update results depending on mode
  if (mode === 'payment') {
    const y = Math.floor(monthsTaken / 12);
    const r = monthsTaken % 12;
    if (primaryLabel) primaryLabel.textContent = "Time to clear debt";
    byId('time').textContent = `${y} years ${r} months`;
  } else {
    if (primaryLabel) primaryLabel.textContent = "Monthly payment required";
    byId('time').textContent = formatCurrency(round2(payment));
  }

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

