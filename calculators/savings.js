function bindSavings(container) {
  const byId = id => container.querySelector(`#${id}`);
  const fmt = n => '£' + (isFinite(n) ? n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0.00');

  function calculateSavings() {
    const start = parseFloat(byId('savings-startBalance').value) || 0;
    const monthly = parseFloat(byId('savings-monthlyPayment').value) || 0;
    const years = parseInt(byId('savings-years').value || '0', 10);
    const months = parseInt(byId('savings-months').value || '0', 10);
    const rate = parseFloat(byId('savings-growthRate').value || '0') / 100;
    const n = years * 12 + months;
    const rateType = container.querySelector('input[name="savings-rateType"]:checked').value;

    let monthlyRate;
    if (rateType === 'APR') {
      monthlyRate = rate / 12;
    } else { // AER
      monthlyRate = Math.pow(1 + rate, 1/12) - 1;
    }

    let balance = start;
    let interestAccrued = 0;

    for (let i = 0; i < n; i++) {
      balance += monthly;
      const interest = balance * monthlyRate;
      balance += interest;
      interestAccrued += interest;
    }

    // Update UI
    byId('savings-totalSaved').textContent = fmt(balance);
    byId('savings-totalInterest').textContent = fmt(interestAccrued); 
 }
 
  byId('savings-calcBtn').addEventListener('click', calculateSavings);
  container.addEventListener('keydown', e => { if (e.key === 'Enter') calculateSavings(); });
}

