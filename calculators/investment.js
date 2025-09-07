function bindInvestment() {
  const byId = id => document.getElementById(id);

  let invChart = null;

  function monthlyRateFromAnnual(annualPct, mode){
    const a = (annualPct || 0)/100;
    return mode === 'AER' ? Math.pow(1 + a, 1/12) - 1 : a/12;
  }

  function futureBalance(start, contrib, months, r){
    let balance = start;
    const history = [balance];
    for(let i=0; i<months; i++){
      balance = balance*(1+r) + contrib;
      history.push(balance);
    }
    return history;
  }

  function calculateInvestment(){
    const start = parseFloat(byId('invStart').value) || 0;
    const contrib = parseFloat(byId('invMonthly').value) || 0;
    const yrs = parseInt(byId('invYears').value || '0',10);
    const mos = parseInt(byId('invMonths').value || '0',10);
    const totalMonths = yrs*12 + mos;
    const rate = parseFloat(byId('invRate').value) || 0;
    const variance = parseFloat(byId('invVariance').value) || 0;
    const rateType = document.querySelector('input[name="invRateType"]:checked').value;
    const totalContrib = start + (contrib * totalMonths);

    byId('invTotalContrib').textContent = '£' + totalContrib.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    if(totalMonths<=0){ alert('Enter a valid period'); return; }

    const scenarios = [
      { name:'Low',  rate: rate-variance, color:'#d62828', id:'invLow' },
      { name:'Base', rate: rate, color:'#0d6efd', id:'invBase' },
      { name:'High', rate: rate+variance, color:'#2a9d8f', id:'invHigh' }
    ];

    const datasets = [];
    scenarios.forEach(s=>{
      const r = monthlyRateFromAnnual(s.rate, rateType);
      const hist = futureBalance(start, contrib, totalMonths, r);
      document.getElementById(s.id).textContent = '£'+hist[hist.length-1].toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');

      datasets.push({
        label: '',         // blank label prevents legend
        data: hist,
        borderColor: s.color,
        borderWidth: 1.5,
        fill:false,
        pointRadius:0,
        tension:0.1
      });
    });

    const labels = Array.from({length:totalMonths+1},(_,i)=>i);

    const ctx = document.getElementById('invChart').getContext('2d');
    if(invChart) invChart.destroy();
    invChart = new Chart(ctx,{
      type:'line',
      data:{ labels, datasets },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        interaction:{ mode:'index', intersect:false },
        scales:{
          x:{ title:{ display:true, text:'Months' } },
          y:{ title:{ display:true, text:'Balance (£)' },
              ticks:{ callback:v=>'£'+v.toLocaleString() } }
        },
        plugins:{
          legend:{ display:false },
          tooltip:{
            callbacks:{
              label:ctx=>'£'+ctx.parsed.y.toFixed(2)
            }
          }
        }
      }
    });
  }

  byId('invCalcBtn').addEventListener('click', calculateInvestment);
  document.addEventListener('keydown', e=>{ if(e.key==='Enter') calculateInvestment(); });
}

