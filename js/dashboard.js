/**
 * dashboard.js — Tableau de bord Hotspot Diego
 * Gestion complète des statistiques, graphiques Chart.js, compteurs animés et notifications toast
 */

'use strict';

function formatAr(n) {
  return Number(n || 0).toLocaleString('fr-FR') + ' Ar';
}

function isDark() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

function chartColors() {
  if (isDark()) {
    return {
      grid: 'rgba(255, 255, 255, 0.06)',
      tick: '#8892b0',
      legend: '#a8b2d1',
      barBg: '#E8622C',
      donutBg: ['#64ffda', '#3FA34D', '#C9A227', '#C4432B']
    };
  }
  return {
    grid: 'rgba(14, 42, 61, 0.08)',
    tick: '#4B5B63',
    legend: '#142027',
    barBg: '#E8622C',
    donutBg: ['#16405A', '#3FA34D', '#C9A227', '#C4432B']
  };
}

// Instances des graphiques Chart.js
let chartSemaine = null;
let chartFreq = null;
let chartUsage = null;
let chartDonut = null;

const REFRESH_INTERVAL = 30000;

function updateTopbarDate() {
  const el = document.getElementById('topbar-date');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function animateValue(el, target, isMoney = false) {
  if (!el) return;
  const start = parseInt(el.textContent.replace(/\D/g, '')) || 0;
  const end = parseInt(target) || 0;
  if (start === end) {
    el.textContent = isMoney ? formatAr(end) : String(end);
    return;
  }
  const duration = 500;
  const startTime = performance.now();
  function step(now) {
    const p = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const cur = Math.round(start + (end - start) * eased);
    el.textContent = isMoney ? formatAr(cur) : String(cur);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ===== MESSAGE BOX TOAST (Style Offre) ===== */
function showDashMsg(text, ok = true) {
  const toast = document.getElementById('toast-container');
  const txt = document.getElementById('toast-text');
  if (toast && txt) {
    txt.textContent = text;
    toast.className = 'toast-container ' + (ok ? 'toast-success' : 'toast-error');
    toast.removeAttribute('style');
    toast.style.display = 'flex';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.display = 'none';
    }, 4500);
  }
}
window.showMessage = showDashMsg;
window.showToast = showDashMsg;

/* ===== CHARGEMENT PRINCIPAL DES STATISTIQUES ===== */
async function chargerStats() {
  try {
    const response = await fetch('../login_php/stats.php', {
      headers: { 'X-Requested-With': 'fetch' },
      credentials: 'same-origin'
    });

    if (response.status === 401) {
      window.location.replace('../index.php');
      return;
    }

    const data = await response.json();
    const cc = chartColors();

    // 1) Cartes du haut
    animateValue(document.getElementById('stat-actif'), data.compteurs.actif, false);
    animateValue(document.getElementById('stat-actif-dash'), data.compteurs.actif, false);
    animateValue(document.getElementById('stat-non-utilise'), data.compteurs.non_utilise, false);
    animateValue(document.getElementById('stat-non-utilise-dash'), data.compteurs.non_utilise, false);
    animateValue(document.getElementById('stat-expire'), (data.compteurs.expire || 0) + (data.compteurs.desactive || 0), false);

    const totalEl = document.getElementById('stat-total');
    const jourEl = document.getElementById('stat-revenus-jour');
    if (totalEl) totalEl.textContent = formatAr(data.total_genere);
    if (jourEl) jourEl.textContent = formatAr(data.revenus_jour);

    const subEl = document.getElementById('stat-expire-sub');
    if (subEl) subEl.textContent = (data.compteurs.desactive || 0) + ' désactivés';

    // 2) Widget Super Admin (si rôle super_admin)
    const sw = document.getElementById('super-widget');
    if (sw && data.admin_count !== undefined) {
      fetch('../login_php/check_session.php')
        .then(r => r.json())
        .then(s => {
          if (s.role === 'super_admin') {
            sw.style.display = 'block';
            const a1 = document.getElementById('super-admin-count');
            const a2 = document.getElementById('super-super-count');
            const a3 = document.getElementById('super-user-count');
            if (a1) a1.textContent = data.admin_count;
            if (a2) a2.textContent = data.super_count;
            if (a3) a3.textContent = data.user_count;
          }
        })
        .catch(() => {});
    }

    // 3) Graphique Revenus 7 jours (Bar)
    const ctxBar = document.getElementById('chart-semaine');
    if (ctxBar && window.Chart && data.semaine) {
      const labels = data.semaine.map(j => j.jour);
      const valeurs = data.semaine.map(j => Number(j.total));
      if (chartSemaine) {
        chartSemaine.data.labels = labels;
        chartSemaine.data.datasets[0].data = valeurs;
        chartSemaine.data.datasets[0].backgroundColor = cc.barBg;
        chartSemaine.options.scales.x.ticks.color = cc.tick;
        chartSemaine.options.scales.y.ticks.color = cc.tick;
        chartSemaine.options.scales.x.grid.color = cc.grid;
        chartSemaine.options.scales.y.grid.color = cc.grid;
        chartSemaine.update();
      } else {
        chartSemaine = new Chart(ctxBar, {
          type: 'bar',
          data: {
            labels,
            datasets: [{ label: 'Revenus (Ar)', data: valeurs, backgroundColor: cc.barBg, borderRadius: 6, borderSkipped: false }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: cc.grid }, ticks: { color: cc.tick, font: { family: 'Poppins' } } },
              y: { beginAtZero: true, grid: { color: cc.grid }, ticks: { color: cc.tick, font: { family: 'Poppins' } } }
            }
          }
        });
      }
    }

    // 4) Graphique Fréquentation (Line)
    const ctxFreq = document.getElementById('chart-frequentation');
    if (ctxFreq && window.Chart && data.frequentation) {
      const labelsF = data.frequentation.map(j => j.jour);
      const valsF = data.frequentation.map(j => Number(j.nb));
      if (chartFreq) {
        chartFreq.data.labels = labelsF;
        chartFreq.data.datasets[0].data = valsF;
        chartFreq.options.scales.x.ticks.color = cc.tick;
        chartFreq.options.scales.y.ticks.color = cc.tick;
        chartFreq.options.scales.x.grid.color = cc.grid;
        chartFreq.options.scales.y.grid.color = cc.grid;
        chartFreq.update();
      } else {
        chartFreq = new Chart(ctxFreq, {
          type: 'line',
          data: {
            labels: labelsF,
            datasets: [{
              label: 'Codes générés',
              data: valsF,
              borderColor: '#E8622C',
              backgroundColor: 'rgba(232, 98, 44, 0.15)',
              tension: 0.35,
              fill: true,
              pointRadius: 4,
              pointBackgroundColor: '#E8622C'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: cc.grid }, ticks: { color: cc.tick, font: { family: 'Poppins' } } },
              y: { beginAtZero: true, grid: { color: cc.grid }, ticks: { color: cc.tick, font: { family: 'Poppins' }, precision: 0 } }
            }
          }
        });
      }
    }

    // 5) Graphique Usage (Line)
    const ctxUsage = document.getElementById('chart-usage');
    if (ctxUsage && window.Chart && data.usage) {
      const labelsU = data.usage.map(j => j.jour);
      const valsU = data.usage.map(j => Number(j.actifs));
      if (chartUsage) {
        chartUsage.data.labels = labelsU;
        chartUsage.data.datasets[0].data = valsU;
        chartUsage.options.scales.x.ticks.color = cc.tick;
        chartUsage.options.scales.y.ticks.color = cc.tick;
        chartUsage.options.scales.x.grid.color = cc.grid;
        chartUsage.options.scales.y.grid.color = cc.grid;
        chartUsage.update();
      } else {
        chartUsage = new Chart(ctxUsage, {
          type: 'line',
          data: {
            labels: labelsU,
            datasets: [{
              label: 'Codes actifs',
              data: valsU,
              borderColor: '#17A398',
              backgroundColor: 'rgba(23, 163, 152, 0.12)',
              tension: 0.35,
              fill: true,
              pointRadius: 4,
              pointBackgroundColor: '#17A398'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: cc.grid }, ticks: { color: cc.tick, font: { family: 'Poppins' } } },
              y: { beginAtZero: true, grid: { color: cc.grid }, ticks: { color: cc.tick, font: { family: 'Poppins' }, precision: 0 } }
            }
          }
        });
      }
    }

    // 6) Graphique Répartition des codes (Doughnut)
    const ctxDonut = document.getElementById('chart-statuts');
    if (ctxDonut && window.Chart) {
      const valeurs = [
        data.compteurs.non_utilise || 0,
        data.compteurs.actif || 0,
        data.compteurs.expire || 0,
        data.compteurs.desactive || 0
      ];
      if (chartDonut) {
        chartDonut.data.datasets[0].data = valeurs;
        chartDonut.data.datasets[0].backgroundColor = cc.donutBg;
        chartDonut.options.plugins.legend.labels.color = cc.legend;
        chartDonut.update();
      } else {
        chartDonut = new Chart(ctxDonut, {
          type: 'doughnut',
          data: {
            labels: ['Disponibles', 'Actifs', 'Expirés', 'Désactivés'],
            datasets: [{ data: valeurs, backgroundColor: cc.donutBg, borderWidth: 0 }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '64%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: cc.legend, font: { family: 'Poppins', size: 11 }, padding: 12, usePointStyle: true }
              }
            }
          }
        });
      }
    }

    // 7) Tableau des Ventes par offre
    const tbodyOffres = document.querySelector('#table-offres tbody');
    if (tbodyOffres && data.offres) {
      if (!data.offres.length) {
        tbodyOffres.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:14px; color:#94A3B8;">Aucune vente enregistrée pour le moment</td></tr>';
      } else {
        tbodyOffres.innerHTML = data.offres.map(o => `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.03);">
            <td style="padding:10px; font-weight:600; color:#E2E8F0;">${escHtml(o.nom)}</td>
            <td style="padding:10px; color:#94A3B8;">${o.nb_codes || 0}</td>
            <td style="padding:10px; font-weight:700; color:#4ADE80;">${Number(o.total || 0).toLocaleString('fr-FR')} Ar</td>
          </tr>
        `).join('');
      }
    }

  } catch (err) {
    console.error('Erreur chargerStats:', err);
  }
}

/* ===== SESSIONS DU ROUTEUR (Pour le compteur clients connectés) ===== */
async function chargerClientsConnectes() {
  try {
    const res = await fetch('../login_php/sessions.php', {
      headers: { 'X-Requested-With': 'fetch' },
      credentials: 'same-origin'
    });
    if (res.ok) {
      const d = await res.json();
      const scEl = document.getElementById('stat-clients');
      const scSub = document.getElementById('stat-clients-sub');
      if (scEl) animateValue(scEl, d.total || 0, false);
      if (scSub) scSub.textContent = (d.status === 'connecte') ? 'via MikroTik' : 'hors ligne';
    }
  } catch (e) {}
}

/* ===== RAFRAÎCHISSEMENT GLOBAL ===== */
async function refreshAll() {
  const btn = document.getElementById('btn-refresh');
  if (btn) btn.classList.add('spinning');
  try {
    await Promise.all([chargerStats(), chargerClientsConnectes()]);
    showDashMsg('Données actualisées avec succès !', true);
  } catch (e) {
    showDashMsg('Erreur lors de l\'actualisation', false);
  } finally {
    setTimeout(() => {
      if (btn) btn.classList.remove('spinning');
    }, 600);
  }
}

/* ===== INITIALISATION ===== */
document.addEventListener('DOMContentLoaded', () => {
  updateTopbarDate();
  chargerStats();
  chargerClientsConnectes();

  const refreshBtn = document.getElementById('btn-refresh');
  if (refreshBtn) refreshBtn.addEventListener('click', refreshAll);

  // Intervalle de rafraîchissement automatique
  setInterval(() => {
    chargerStats();
    chargerClientsConnectes();
  }, REFRESH_INTERVAL);

  // Actualise les couleurs des graphiques lors du changement de thème
  const tt = document.getElementById('theme-toggle');
  if (tt) {
    tt.addEventListener('click', () => {
      setTimeout(() => {
        if (chartSemaine || chartFreq || chartUsage || chartDonut) {
          chargerStats();
        }
      }, 100);
    });
  }
});
