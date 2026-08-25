function formatAr(n) {
  return Number(n || 0).toLocaleString('fr-FR') + ' Ar';
}

let barChart = null;
let donutChart = null;

async function chargerStats() {
  try {
    const response = await fetch('../login_php/stats.php');
    if (response.status === 401) {
      window.location.replace('../index.html');
      return;
    }
    const data = await response.json();

    document.getElementById('stat-non-utilise').textContent = data.compteurs.non_utilise;
    document.getElementById('stat-actif').textContent = data.compteurs.actif;
    document.getElementById('stat-expire').textContent = data.compteurs.expire;
    document.getElementById('stat-total').textContent = formatAr(data.total_genere);
    document.getElementById('stat-revenus-jour').textContent = formatAr(data.revenus_jour);

    const ctxBar = document.getElementById('chart-semaine');
    const ctxDonut = document.getElementById('chart-statuts');

    if (ctxBar && window.Chart) {
      const labels = data.semaine.map((j) => j.jour);
      const valeurs = data.semaine.map((j) => Number(j.total));

      if (barChart) { barChart.data.labels = labels; barChart.data.datasets[0].data = valeurs; barChart.update(); }
      else {
        barChart = new Chart(ctxBar, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Revenus (Ar)',
              data: valeurs,
              backgroundColor: '#E8622C',
              borderRadius: 6,
            }],
          },
          options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } },
          },
        });
      }
    }

    if (ctxDonut && window.Chart) {
      const valeurs = [
        data.compteurs.non_utilise,
        data.compteurs.actif,
        data.compteurs.expire,
        data.compteurs.desactive,
      ];

      if (donutChart) { donutChart.data.datasets[0].data = valeurs; donutChart.update(); }
      else {
        donutChart = new Chart(ctxDonut, {
          type: 'doughnut',
          data: {
            labels: ['Non utilisés', 'Actifs', 'Expirés', 'Désactivés'],
            datasets: [{
              data: valeurs,
              backgroundColor: ['#16405A', '#3FA34D', '#C9A227', '#C4432B'],
              borderWidth: 0,
            }],
          },
          options: {
            cutout: '62%',
            plugins: { legend: { position: 'bottom' } },
          },
        });
      }
    }
  } catch (err) {
    /* silence : reessai au prochain cycle */
  }
}

chargerStats();
setInterval(chargerStats, 30000);
