function formatAr(n) {
  return Number(n || 0).toLocaleString('fr-FR') + ' Ar';
}

function isDark() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

function chartColors() {
  if (isDark()) {
    return {
      grid: 'rgba(168,178,209,0.08)',
      tick: '#8892b0',
      legend: '#a8b2d1',
      barBg: '#E8622C',
      donutBg: ['#64ffda', '#3FA34D', '#C9A227', '#C4432B']
    };
  }
  return {
    grid: 'rgba(14,42,61,0.08)',
    tick: '#4B5B63',
    legend: '#142027',
    barBg: '#E8622C',
    donutBg: ['#16405A', '#3FA34D', '#C9A227', '#C4432B']
  };
}

let statsBarChart = null;
let freqChart = null;
let usageChart = null;
let statsDonutChart = null;

async function chargerStats() {
  try {
    const response = await fetch('../login_php/stats.php');
    if (response.status === 401) {
      window.location.replace('../index.php');
      return;
    }
    const data = await response.json();
    const cc = chartColors();

    const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setText('stat-revenus-jour', formatAr(data.revenus_jour));
    setText('stat-total', formatAr(data.total_genere));
    setText('stat-actif', data.compteurs.actif);
    setText('stat-actif-dash', data.compteurs.actif);
    setText('stat-non-utilise', data.compteurs.non_utilise);
    setText('stat-non-utilise-dash', data.compteurs.non_utilise);

    const ctxBar = document.getElementById('chart-semaine');
    if (ctxBar && window.Chart) {
      const labels = data.semaine.map(j => j.jour);
      const valeurs = data.semaine.map(j => Number(j.total));
      if (statsBarChart) {
        statsBarChart.data.labels = labels;
        statsBarChart.data.datasets[0].data = valeurs;
        statsBarChart.data.datasets[0].backgroundColor = cc.barBg;
        statsBarChart.options.scales.x.ticks.color = cc.tick;
        statsBarChart.options.scales.y.ticks.color = cc.tick;
        statsBarChart.options.scales.x.grid.color = cc.grid;
        statsBarChart.options.scales.y.grid.color = cc.grid;
        statsBarChart.update();
      } else {
        statsBarChart = new Chart(ctxBar, {
          type: 'bar',
          data: { labels, datasets: [{ label: 'Revenus (Ar)', data: valeurs, backgroundColor: cc.barBg, borderRadius: 6, borderSkipped: false }] },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: cc.grid }, ticks: { color: cc.tick, font: { family: 'Poppins' } } },
              y: { beginAtZero: true, grid: { color: cc.grid }, ticks: { color: cc.tick, font: { family: 'Poppins' } } }
            }
          },
        });
      }
    }

    // Fréquentation — codes créés par jour (ligne orange)
    const ctxFreq = document.getElementById('chart-frequentation');
    if (ctxFreq && window.Chart && data.frequentation) {
      const labelsF = data.frequentation.map(j => j.jour);
      const valsF = data.frequentation.map(j => Number(j.nb));
      if (freqChart) {
        freqChart.data.labels = labelsF;
        freqChart.data.datasets[0].data = valsF;
        freqChart.options.scales.x.ticks.color = cc.tick;
        freqChart.options.scales.y.ticks.color = cc.tick;
        freqChart.options.scales.x.grid.color = cc.grid;
        freqChart.options.scales.y.grid.color = cc.grid;
        freqChart.update();
      } else {
        freqChart = new Chart(ctxFreq, {
          type: 'line',
          data: { labels: labelsF, datasets: [{ label: 'Codes', data: valsF, borderColor: '#E8622C', backgroundColor: 'rgba(232,98,44,0.15)', tension: 0.35, fill: true, pointRadius: 4, pointBackgroundColor: '#E8622C' }] },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: cc.grid }, ticks: { color: cc.tick, font: { family: 'Poppins' } } },
              y: { beginAtZero: true, grid: { color: cc.grid }, ticks: { color: cc.tick, font: { family: 'Poppins' }, precision: 0 } }
            }
          },
        });
      }
    }
    // Usage — codes actifs par jour (ligne lagoon)
    const ctxUsage = document.getElementById('chart-usage');
    if (ctxUsage && window.Chart && data.usage) {
      const labelsU = data.usage.map(j => j.jour);
      const valsU = data.usage.map(j => Number(j.actifs));
      if (usageChart) {
        usageChart.data.labels = labelsU;
        usageChart.data.datasets[0].data = valsU;
        usageChart.options.scales.x.ticks.color = cc.tick;
        usageChart.options.scales.y.ticks.color = cc.tick;
        usageChart.options.scales.x.grid.color = cc.grid;
        usageChart.options.scales.y.grid.color = cc.grid;
        usageChart.update();
      } else {
        usageChart = new Chart(ctxUsage, {
          type: 'line',
          data: { labels: labelsU, datasets: [{ label: 'Actifs', data: valsU, borderColor: '#17A398', backgroundColor: 'rgba(23,163,152,0.12)', tension: 0.35, fill: true, pointRadius: 4, pointBackgroundColor: '#17A398' }] },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: cc.grid }, ticks: { color: cc.tick, font: { family: 'Poppins' } } },
              y: { beginAtZero: true, grid: { color: cc.grid }, ticks: { color: cc.tick, font: { family: 'Poppins' }, precision: 0 } }
            }
          },
        });
      }
    }

    const ctxDonut = document.getElementById('chart-statuts');
    if (ctxDonut && window.Chart) {
      const valeurs = [data.compteurs.non_utilise, data.compteurs.actif, data.compteurs.expire, data.compteurs.desactive];
      if (statsDonutChart) {
        statsDonutChart.data.datasets[0].data = valeurs;
        statsDonutChart.data.datasets[0].backgroundColor = cc.donutBg;
        statsDonutChart.options.plugins.legend.labels.color = cc.legend;
        statsDonutChart.update();
      } else {
        statsDonutChart = new Chart(ctxDonut, {
          type: 'doughnut',
          data: {
            labels: ['Non utilisés', 'Actifs', 'Expirés', 'Désactivés'],
            datasets: [{ data: valeurs, backgroundColor: cc.donutBg, borderWidth: 0 }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: { legend: { position: 'bottom', labels: { color: cc.legend, font: { family: 'Poppins', size: 11 }, padding: 14, usePointStyle: true } } }
          },
        });
      }
    }

    const tbody = document.querySelector('#table-offres tbody');
    if (tbody) {
      tbody.innerHTML = data.offres.map(o => `
        <tr>
          <td>${escHtml(o.nom)}</td>
          <td>${o.nb_codes}</td>
          <td>${Number(o.total).toLocaleString('fr-FR')} Ar</td>
        </tr>
      `).join('');
    }
  } catch (err) {}
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

chargerStats();
setInterval(chargerStats, 30000);
