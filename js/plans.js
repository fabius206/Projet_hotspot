requireLogin();

document.getElementById('logout-link').addEventListener('click', (e) => {
  e.preventDefault();
  clearSession();
  window.location.href = 'index.html';
});

function formatDuration(minutes) {
  if (minutes % 1440 === 0) return `${minutes / 1440} j`;
  if (minutes % 60 === 0) return `${minutes / 60} h`;
  return `${minutes} min`;
}

async function loadPlans() {
  const body = document.getElementById('plans-body');
  try {
    const plans = await apiFetch('/plans');
    if (plans.length === 0) {
      body.innerHTML = '<tr><td colspan="6">Aucune offre pour le moment.</td></tr>';
      return;
    }
    body.innerHTML = plans.map((p) => `
      <tr>
        <td><strong>${p.name}</strong><div class="hint">${p.description || ''}</div></td>
        <td>${formatDuration(p.duration_minutes)}</td>
        <td>${p.speed_limit || '—'}</td>
        <td>${Number(p.price_ariary).toLocaleString('fr-FR')} Ar</td>
        <td><span class="badge ${p.is_active ? 'badge-actif' : 'badge-desactive'}">${p.is_active ? 'Active' : 'Inactive'}</span></td>
        <td><button class="btn btn-danger btn-sm" onclick="deletePlan(${p.id})">Supprimer</button></td>
      </tr>
    `).join('');
  } catch (err) {
    body.innerHTML = `<tr><td colspan="6">Erreur : ${err.message}</td></tr>`;
  }
}

async function deletePlan(id) {
  if (!confirm('Supprimer cette offre ?')) return;
  try {
    await apiFetch(`/plans/${id}`, { method: 'DELETE' });
    loadPlans();
  } catch (err) {
    alert(err.message);
  }
}

document.getElementById('plan-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await apiFetch('/plans', {
      method: 'POST',
      body: {
        name: document.getElementById('name').value.trim(),
        price_ariary: parseInt(document.getElementById('price').value, 10),
        duration_minutes: parseInt(document.getElementById('duration').value, 10),
        speed_limit: document.getElementById('speed').value.trim() || null,
        description: document.getElementById('description').value.trim() || null,
      },
    });
    e.target.reset();
    loadPlans();
  } catch (err) {
    alert(err.message);
  }
});

loadPlans();
