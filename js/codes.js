const STATUTS = {
  non_utilise: { label: 'Non utilisé', badge: 'badge-non_utilise' },
  actif: { label: 'Actif', badge: 'badge-actif' },
  expire: { label: 'Expiré', badge: 'badge-expire' },
  desactive: { label: 'Désactivé', badge: 'badge-desactive' },
};

const msgContainer = document.getElementById('toast-container');
const msgText = document.getElementById('toast-text');
function showMessage(text, ok) {
  if (msgText) msgText.textContent = text;
  if (msgContainer) {
    msgContainer.className = 'toast-container ' + (ok ? 'toast-success' : 'toast-error');
    msgContainer.style.display = 'flex';
    setTimeout(() => { msgContainer.style.display = 'none'; }, 5000);
  }
}

function formaterDate(v) {
  if (!v) return '-';
  return v.replace(' ', ' à ');
}

async function chargerPlans() {
  const select = document.getElementById('plan-select');
  const response = await fetch('../login_php/plans.php');
  if (response.status === 401) { window.location.replace('../index.php'); return; }
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
  if (response.status === 401) { window.location.replace('../index.php'); return; }
  const data = await response.json();

  const tbody = document.querySelector('#table-codes tbody');
  tbody.innerHTML = data.vouchers.map((v) => {
    const s = STATUTS[v.status] || { label: v.status, badge: '' };
    let actions = '';

    if (v.status === 'non_utilise') {
      actions += `<button class="btn btn-icon btn-sm" onclick="actionCode(${v.id}, 'marquer_utilise')" title="Activer" aria-label="Activer"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></button> `;
      actions += `<button class="btn btn-icon btn-sm" onclick="actionCode(${v.id}, 'desactiver')" title="Désactiver" aria-label="Désactiver"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></button> `;
    } else if (v.status === 'desactive') {
      actions += `<button class="btn btn-icon btn-sm" onclick="actionCode(${v.id}, 'reactiver')" title="Réactiver" aria-label="Réactiver"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/></svg></button> `;
    }
    actions += `<button class="btn btn-icon btn-danger-icon btn-sm" onclick="actionCode(${v.id}, 'supprimer')" title="Supprimer" aria-label="Supprimer"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>`;

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

let pendingDeleteId = null;
function closeModal(id){ document.getElementById(id).style.display='none'; }
document.getElementById('modal-delete-code')?.addEventListener('click', e=>{ if(e.target===e.currentTarget) closeModal('modal-delete-code'); });
document.getElementById('btn-confirm-delete-code')?.addEventListener('click', async ()=>{
  if(pendingDeleteId===null) return;
  closeModal('modal-delete-code');
  await doActionCode(pendingDeleteId, 'supprimer');
  pendingDeleteId=null;
});
async function actionCode(id, action) {
  if (action === 'supprimer') { pendingDeleteId=id; document.getElementById('modal-delete-code').style.display='flex'; return; }

  return doActionCode(id, action);
}
async function doActionCode(id, action) {
  const response = await fetch('../login_php/vouchers.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action }),
  });

  if (response.status === 401) { window.location.replace('../index.php'); return; }
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

  if (response.status === 401) { window.location.replace('../index.php'); return; }
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
setInterval(()=>{ if(!document.hidden) chargerVouchers(); }, 15000);
