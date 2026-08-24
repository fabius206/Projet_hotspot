requireLogin();

document.getElementById('logout-link').addEventListener('click', (e) => {
  e.preventDefault();
  clearSession();
  window.location.href = 'index.html';
});

const STATUS_LABELS = {
  non_utilise: 'Non utilisé',
  actif: 'Actif',
  expire: 'Expiré',
  desactive: 'Désactivé',
};

async function loadPlansIntoSelect() {
  const select = document.getElementById('plan-select');
  try {
    const plans = await apiFetch('/plans');
    select.innerHTML = plans
      .filter((p) => p.is_active)
      .map((p) => `<option value="${p.id}">${p.name} — ${Number(p.price_ariary).toLocaleString('fr-FR')} Ar</option>`)
      .join('');
  } catch (err) {
    select.innerHTML = '<option>Impossible de charger les offres</option>';
  }
}

async function loadVouchers() {
  const body = document.getElementById('vouchers-body');
  const status = document.getElementById('status-filter').value;
  try {
    const path = status ? `/vouchers?status=${status}` : '/vouchers';
    const vouchers = await apiFetch(path);
    if (vouchers.length === 0) {
      body.innerHTML = '<tr><td colspan="6">Aucun code pour ce filtre.</td></tr>';
      return;
    }
    body.innerHTML = vouchers.map((v) => `
      <tr>
        <td><span class="voucher-strip mono">${v.code}</span></td>
        <td>${v.plan_name}</td>
        <td>${v.batch_label || '—'}</td>
        <td><span class="badge badge-${v.status}">${STATUS_LABELS[v.status] || v.status}</span></td>
        <td>${new Date(v.created_at).toLocaleDateString('fr-FR')}</td>
        <td>
          ${v.status !== 'desactive' ? `<button class="btn btn-danger btn-sm" onclick="deactivate(${v.id})">Désactiver</button>` : ''}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    body.innerHTML = `<tr><td colspan="6">Erreur : ${err.message}</td></tr>`;
  }
}

async function deactivate(id) {
  if (!confirm('Désactiver ce voucher ?')) return;
  try {
    await apiFetch(`/vouchers/${id}`, { method: 'DELETE' });
    loadVouchers();
  } catch (err) {
    alert(err.message);
  }
}

document.getElementById('generate-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const resultBox = document.getElementById('generate-result');
  resultBox.innerHTML = 'Génération en cours…';

  const planId = document.getElementById('plan-select').value;
  const quantity = parseInt(document.getElementById('quantity').value, 10);
  const batchLabel = document.getElementById('batch-label').value.trim() || undefined;

  try {
    const result = await apiFetch('/vouchers/generate', {
      method: 'POST',
      body: { plan_id: planId, quantity, batch_label: batchLabel },
    });
    resultBox.innerHTML = `
      <div class="error-banner" style="background:rgba(63,163,77,0.08);border-color:rgba(63,163,77,0.3);color:var(--success);">
        ${result.codes.length} codes générés dans le lot « ${result.batch_label} ».
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;">
        ${result.codes.map((c) => `<span class="voucher-strip mono">${c}</span>`).join('')}
      </div>
    `;
    loadVouchers();
  } catch (err) {
    resultBox.innerHTML = `<div class="error-banner">${err.message}</div>`;
  }
});

document.getElementById('status-filter').addEventListener('change', loadVouchers);

loadPlansIntoSelect();
loadVouchers();
