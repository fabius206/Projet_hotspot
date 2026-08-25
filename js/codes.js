const STATUTS = {
  non_utilise: { label: 'Non utilisé', badge: 'badge-non_utilise' },
  actif: { label: 'Actif', badge: 'badge-actif' },
  expire: { label: 'Expiré', badge: 'badge-expire' },
  desactive: { label: 'Désactivé', badge: 'badge-desactive' },
};

const messageBox = document.getElementById('message');

function showMessage(text, ok) {
  messageBox.textContent = text;
  messageBox.classList.toggle('success-banner', ok);
  messageBox.classList.toggle('error-banner', !ok);
  messageBox.style.display = 'block';
}

function formaterDate(v) {
  if (!v) return '-';
  return v.replace(' ', ' à ');
}

async function chargerPlans() {
  const select = document.getElementById('plan-select');
  const response = await fetch('../login_php/plans.php');
  if (response.status === 401) { window.location.replace('../index.html'); return; }
  const data = await response.json();
  select.innerHTML = '<option value="">-- Choisir une offre --</option>' +
    data.plans
      .filter((p) => Number(p.actif) === 1)
      .map((p) => `<option value="${p.id}">${p.nom} (${Number(p.prix).toLocaleString('fr-FR')} Ar)</option>`)
      .join('');
}

async function chargerVouchers() {
  const statut = document.getElementById('filtre-statut').value;
  const q = document.getElementById('recherche').value.trim();

  const params = new URLSearchParams();
  if (statut) params.set('statut', statut);
  if (q) params.set('q', q);

  const response = await fetch('../login_php/vouchers.php?' + params.toString());
  if (response.status === 401) { window.location.replace('../index.html'); return; }
  const data = await response.json();

  const tbody = document.querySelector('#table-codes tbody');
  tbody.innerHTML = data.vouchers.map((v) => {
    const s = STATUTS[v.status] || { label: v.status, badge: '' };
    let actions = '';

    if (v.status === 'non_utilise') {
      actions += `<button class="btn btn-outline btn-sm" onclick="actionCode(${v.id}, 'marquer_utilise')">Activer</button> `;
      actions += `<button class="btn btn-danger btn-sm" onclick="actionCode(${v.id}, 'desactiver')">Désactiver</button> `;
    } else if (v.status === 'desactive') {
      actions += `<button class="btn btn-outline btn-sm" onclick="actionCode(${v.id}, 'reactiver')">Réactiver</button> `;
    }
    actions += `<button class="btn btn-danger btn-sm" onclick="actionCode(${v.id}, 'supprimer')">Supprimer</button>`;

    return `<tr>
      <td class="mono">${v.code}</td>
      <td>${v.plan}</td>
      <td>${Number(v.prix || 0).toLocaleString('fr-FR')} Ar</td>
      <td><span class="badge ${s.badge}">${s.label}</span></td>
      <td>${formaterDate(v.created_at)}</td>
      <td>${formaterDate(v.used_at)}</td>
      <td>${formaterDate(v.expire_at)}</td>
      <td style="white-space:nowrap;">${actions}</td>
    </tr>`;
  }).join('');
}

async function actionCode(id, action) {
  if (action === 'supprimer' && !confirm('Supprimer ce code definitivement ?')) return;

  const response = await fetch('../login_php/vouchers.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action }),
  });

  if (response.status === 401) { window.location.replace('../index.html'); return; }
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    showMessage(data.error || 'Action impossible.', false);
  } else {
    showMessage(data.message, true);
    chargerVouchers();
  }
}

document.getElementById('form-generer').addEventListener('submit', async (e) => {
  e.preventDefault();

  const planId = document.getElementById('plan-select').value;
  const quantite = document.getElementById('quantite').value;

  if (!planId) {
    showMessage('Choisissez une offre avant de generer.', false);
    return;
  }

  const response = await fetch('../login_php/vouchers.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'generer', plan_id: planId, quantite }),
  });

  if (response.status === 401) { window.location.replace('../index.html'); return; }
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    showMessage(data.error || 'Generation impossible.', false);
    return;
  }

  showMessage(data.message, true);
  const zone = document.getElementById('codes-genere');
  zone.innerHTML = (data.codes || [])
    .map((c) => `<span class="voucher-strip mono">${c}</span>`)
    .join(' ');
  chargerVouchers();
});

document.getElementById('form-filtres').addEventListener('submit', (e) => {
  e.preventDefault();
  chargerVouchers();
});
document.getElementById('filtre-statut').addEventListener('change', chargerVouchers);

chargerPlans();
chargerVouchers();
