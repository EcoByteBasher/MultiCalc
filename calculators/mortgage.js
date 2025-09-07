function bindMortgage(container) {
  const byId = id => container.querySelector(`#${id}`);
  const fmt = n => '£' + (isFinite(n) ? n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0.00');

  function monthlyRateFromAnnual(annualPct, mode){
    const a = (annualPct || 0) / 100;
    return mode === 'annually' ? Math.pow(1 + a, 1/12) - 1 : a / 12;
  }

  function annuityPayment(P, r, n){
    if (n <= 0) return 0;
    if (Math.abs(r) < 1e-12) return P / n;
    const f = Math.pow(1 + r, n);
    return P * (r * f) / (f - 1);
  }

  function baseTotals({P, r, n, type}){
    if (type === 'interestOnly'){
      const mPay = P * r;
      return { monthly: mPay, interest: mPay * n };
    } else {
      const mPay = annuityPayment(P, r, n);
      return { monthly: mPay, interest: mPay * n - P };
    }
  }

  function simulateWithOverpay({P, r, n, type, oneOff, monthlyOver, baseMonthly}){
    if (type === 'interestOnly'){
      let balance = Math.max(0, P - (oneOff || 0));
      let interestAccrued = 0;
      for (let i = 0; i < n; i++){
        const interest = balance * r;
        interestAccrued += interest;
        balance = Math.max(0, balance - (monthlyOver || 0));
      }
      return { months: n, interest: interestAccrued, balloon: balance };
    } else {
      let balance = Math.max(0, P - (oneOff || 0));
      let months = 0;
      let interestAccrued = 0;
      const payment = Math.max(0, baseMonthly + (monthlyOver || 0));

      if (balance === 0) return { months: 0, interest: 0, balloon: 0 };

      while (balance > 1e-8 && months < 1000*12){
        const interest = balance * r;
        interestAccrued += interest;
        let principal = payment - interest;
        if (principal <= 0){ months = n; break; }
        if (principal > balance) principal = balance;
        balance -= principal;
        months++;
      }
      return { months, interest: interestAccrued, balloon: 0 };
    }
  }

  function calculateMortgage(){
    const P = Math.max(0, parseFloat(byId('mortgage-amount').value));
    const annual = Math.max(0, parseFloat(byId('mortgage-rate').value));
    let yrs = Math.max(1, parseInt(byId('mortgage-years').value || '0', 10));
    let mos = Math.min(11, Math.max(0, parseInt(byId('mortgage-months').value || '0', 10)));
    byId('mortgage-years').value = yrs; byId('mortgage-months').value = mos;

    const n = yrs * 12 + mos;
    const type = container.querySelector('input[name="mortgageType"]:checked').value;
    const mode = container.querySelector('input[name="calcType"]:checked').value;
    const oneOff = Math.max(0, parseFloat(byId('mortgage-oneOff').value || '0'));
    const monthlyOver = Math.max(0, parseFloat(byId('mortgage-monthlyOver').value || '0'));

    if (!P || n <= 0){
      alert('Please enter a valid loan amount and term.');
      return;
    }

    const r = monthlyRateFromAnnual(annual, mode);
    const base = baseTotals({P, r, n, type});
    byId('mortgage-payment').value = fmt(base.monthly);

    const sim = simulateWithOverpay({P, r, n, type, oneOff, monthlyOver, baseMonthly: base.monthly});

    if (type === 'interestOnly'){
      byId('mortgage-newYears').value = yrs;
      byId('mortgage-newMonths').value = mos;
      byId('mortgage-balloonRow').style.display = '';
      byId('mortgage-balloonVal').style.display = '';
      byId('mortgage-balloonVal').textContent = fmt(sim.balloon);
    } else {
      const newYears = Math.floor(sim.months / 12);
      const newMonths = sim.months % 12;
      byId('mortgage-newYears').value = newYears;
      byId('mortgage-newMonths').value = newMonths;
      byId('mortgage-balloonRow').style.display = 'none';
      byId('mortgage-balloonVal').style.display = 'none';
    }

    byId('mortgage-tiBase').textContent  = fmt(base.interest);
    byId('mortgage-tiWith').textContent  = fmt(sim.interest);
    byId('mortgage-tiSaved').textContent = fmt(Math.max(0, base.interest - sim.interest));
  }

  byId('mortgage-calcBtn').addEventListener('click', calculateMortgage);
  container.addEventListener('keydown', e => { if (e.key === 'Enter') calculateMortgage(); });
}

