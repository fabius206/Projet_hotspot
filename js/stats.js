function formatAr(n) {
  return Number(n || 0).toLocaleString('fr-FR') + ' Ar';
}

async function chargerStats() {
  try {
    const response = await fetch('../login_php/stats.php');
    if (response.status === 401) {
      window.location.replace('../index.html');
      return;
    }
    const data = await response.json();

    document.getElementById('stat-revenus-jour').textContent = formatAr(data.revenus_jour);
    document.getElementById('stat-total').textContent = formatAr(data.total_genere);
    document.getElementById('stat-actif').textContent = data.compteurs.actif;
    document.getElementById('stat-non-utilise').textContent = data.compteurs.non_utilise;

    const ctxBar = document.getElementById('chart-semaine');
    if (ctxBar && window.Chart && !window._barChart) {
      window._barChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: data.semaine.map((j) => j.jour),
          datasets: [{
            label: 'Revenus (Ar)',
            data: data.semaine.map((j) => Number(j.total)),
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

    const ctxDonut = document.getElementById('chart-statuts');
    if (ctxDonut && window.Chart && !window._donutChart) {
      window._donutChart = new Chart(ctxDonut, {
        type: 'doughnut',
        data: {
          labels: ['Non utilisés', 'Actifs', 'Expirés', 'Désactivés'],
          datasets: [{
            data: [
              data.compteurs.non_utilise,
              data.compteurs.actif,
              data.compteurs.expire,
              data.compteurs.desactive,
            ],
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

    const tbody = document.querySelector('#table-offres tbody');
    tbody.innerHTML = data.offres.map((o) => `
      <tr>
        <td>${o.nom}</td>
        <td>${o.nb_codes}</td>
        <td>${Number(o.total).toLocaleString('fr-FR')} Ar</td>
      </tr>
    `).join('');
  } catch (err) {
    /* reessai au prochain cycle */
  }
}

chargerStats();
setInterval(chargerStats, 30000);
