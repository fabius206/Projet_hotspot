const API_BASE = '/api';

async function loadPlans() {
  const list = document.getElementById('plans-list');
  try {
    const response = await fetch(`${API_BASE}/public/plans`);
    const plans = await response.json();

    if (!Array.isArray(plans) || plans.length === 0) {
      list.innerHTML = '<div class="plan-row"><span class="plan-name">Aucune offre disponible</span></div>';
      return;
    }

    list.innerHTML = plans.map((p) => `
      <div class="plan-row">
        <span class="plan-name">${p.name}</span>
        <span class="plan-price">${Number(p.price_ariary).toLocaleString('fr-FR')} Ar</span>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = '<div class="plan-row"><span class="plan-name">Offres indisponibles</span></div>';
  }
}

function showStatus(message, type) {
  const box = document.getElementById('status');
  box.textContent = message;
  box.className = `status-msg show ${type}`;
}

document.getElementById('activate-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('connect-btn');
  const code = document.getElementById('code').value.trim().toUpperCase();

  btn.disabled = true;
  btn.textContent = 'Connexion en cours…';

  try {
    const response = await fetch(`${API_BASE}/vouchers/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Code invalide');
    }

    document.getElementById('login-view').style.display = 'none';
    document.getElementById('success-view').style.display = 'block';
    const expires = new Date(data.expires_at);
    document.getElementById('expires-at').textContent =
      `Accès valable jusqu'à ${expires.toLocaleString('fr-FR')}`;
  } catch (err) {
    showStatus(err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Se connecter';
  }
});

loadPlans();
