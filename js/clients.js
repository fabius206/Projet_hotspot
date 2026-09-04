const msgContainer = document.getElementById('toast-container');
const msgText = document.getElementById('toast-text');
function showMsg(t, ok) {
  if (msgText) msgText.textContent = t;
  if (msgContainer) {
    msgContainer.className = 'toast-container ' + (ok ? 'toast-success' : 'toast-error');
    msgContainer.style.display = 'flex';
    setTimeout(() => { msgContainer.style.display = 'none'; }, 5000);
  }
}
function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

let editId = null;
let currentPage = 1;
let totalPages = 1;

async function charger(page) {
  page = page || 1;
  const search = document.getElementById('search-clients').value.trim();
  const statut = document.getElementById('filter-statut').value;
  const params = new URLSearchParams({ page, per_page: 15 });
  if (search) params.set('search', search);
  if (statut) params.set('statut', statut);

  const r = await fetch('../login_php/clients.php?action=list&' + params);
  if (r.status === 401 || r.status === 403) { window.location.replace('../index.php'); return; }
  const d = await r.json();
  currentPage = d.page;
  totalPages = d.pages;

  document.getElementById('cl-total').textContent = d.total;
  const all = d.clients;
  document.getElementById('cl-actifs').textContent = all.filter(c => c.statut === 'actif').length;
  document.getElementById('cl-suspendus').textContent = all.filter(c => c.statut === 'suspendu').length;
  document.getElementById('cl-auj').textContent = all.filter(c => c.creation && c.creation.startsWith(new Date().toISOString().slice(0, 10))).length;

  const tbody = document.querySelector('#table-clients tbody');
  if (all.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--ink-soft);">Aucun client trouvé</td></tr>';
  } else {
    tbody.innerHTML = all.map(c => {
      const safeUser = String(c.username||'').replace(/'/g, "\\'");
      const safeNom = String(c.nom||'').replace(/'/g, "\\'");
      const safeEmail = String(c.email||'').replace(/'/g, "\\'");
      const safeTel = String(c.telephone||'').replace(/'/g, "\\'");
      return `
      <tr class="${c.statut === 'suspendu' ? 'row-locked' : ''}">
        <td class="mono" style="font-size:0.82rem;text-align:center;font-weight:600;">${esc(String(c.id))}</td>
        <td><strong>${esc(c.nom)}</strong></td>
        <td style="font-size:0.85rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;">${esc(c.email || '—')}</td>
        <td class="mono" style="font-size:0.8rem;white-space:nowrap;">${esc(formatMG(c.telephone) || '—')}</td>
        <td><span class="badge ${c.statut === 'actif' ? 'badge-actif' : 'badge-desactive'}">${c.statut}</span></td>
        <td style="text-align:center;">${c.nb_connexions || 0}</td>
        <td style="font-size:0.8rem;">${c.derniere_connexion || '—'}</td>
        <td style="white-space:nowrap; text-align:center;">
          <button class="btn btn-icon btn-sm" onclick="voirDetails(${c.id})" title="Détails" aria-label="Détails"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
          <button class="btn btn-icon btn-sm" onclick="startEdit(${c.id},'${safeUser}','${safeNom}','${safeEmail}','${safeTel}')" title="Modifier" aria-label="Modifier"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="btn btn-icon btn-sm ${c.statut === 'actif' ? 'btn-warn' : 'btn-success'}" onclick="toggleStatut(${c.id},'${c.statut === 'actif' ? 'suspendu' : 'actif'}')" title="${c.statut === 'actif' ? 'Suspendre' : 'Activer'}" aria-label="${c.statut === 'actif' ? 'Suspendre' : 'Activer'}">${c.statut === 'actif' ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="23" x2="1" y2="1"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 23 8"/></svg>'}</button>
          <button class="btn btn-icon btn-danger-icon btn-sm" onclick="supprimer(${c.id})" title="Supprimer" aria-label="Supprimer"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
        </td>
      </tr>
    `}).join('');
  }

  renderPagination(d.page, d.pages);
}

function renderPagination(page, pages) {
  const el = document.getElementById('pagination-clients');
  if (pages <= 1) { el.innerHTML = ''; return; }
  let html = '';
  if (page > 1) html += '<button class="btn btn-sm btn-outline" onclick="charger(' + (page - 1) + ')">← Précédent</button>';
  html += '<span style="padding:0 12px;font-size:0.85rem;color:var(--ink-soft);">Page ' + page + ' / ' + pages + '</span>';
  if (page < pages) html += '<button class="btn btn-sm btn-outline" onclick="charger(' + (page + 1) + ')">Suivant →</button>';
  el.innerHTML = html;
}

function startEdit(id, username, nom, email, telephone) {
  editId = id;
  document.getElementById('edit-id').value = id;
  document.getElementById('cl-username').value = username;
  document.getElementById('cl-nom').value = nom;
  document.getElementById('cl-email').value = email;
  document.getElementById('cl-tel').value = formatMG(telephone);
  document.getElementById('cl-password').value = '';
  document.getElementById('titre-form').textContent = 'Modifier le client';
  document.getElementById('btn-submit').textContent = 'Enregistrer';
  document.getElementById('btn-cancel').style.display = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('btn-cancel').addEventListener('click', () => {
  editId = null;
  document.getElementById('form-client').reset();
  document.getElementById('edit-id').value = '';
  const u = document.getElementById('cl-username'); if (u) u.value = '';
  const pw = document.getElementById('cl-password'); if (pw) pw.value = '';
  document.getElementById('titre-form').textContent = 'Nouveau client';
  document.getElementById('btn-submit').textContent = 'Créer le client';
  document.getElementById('btn-cancel').style.display = 'none';
});

async function voirDetails(id) {
  const r = await fetch('../login_php/clients.php?action=detail&id=' + id);
  if (!r.ok) { showMsg('Erreur lors du chargement', false); return; }
  const d = await r.json();
  const c = d.client;
  const vouchers = d.vouchers || [];

  let html = `
    <div class="detail-grid">
      <div class="detail-field"><span class="df-label">Nom</span><span class="df-value">${esc(c.nom)}</span></div>
      <div class="detail-field"><span class="df-label">Identifiant</span><span class="df-value mono">${esc(c.username)}</span></div>
      <div class="detail-field"><span class="df-label">Email</span><span class="df-value">${esc(c.email || '—')}</span></div>
      <div class="detail-field"><span class="df-label">Téléphone</span><span class="df-value mono">${esc(formatMG(c.telephone) || '—')}</span></div>
      <div class="detail-field"><span class="df-label">Statut</span><span class="df-value"><span class="badge ${c.statut === 'actif' ? 'badge-actif' : 'badge-desactive'}">${c.statut}</span></span></div>
      <div class="detail-field"><span class="df-label">Créé le</span><span class="df-value">${c.creation || '—'}</span></div>
      <div class="detail-field"><span class="df-label">Connexions</span><span class="df-value">${c.nb_connexions || 0}</span></div>
      <div class="detail-field"><span class="df-label">Dernière connexion</span><span class="df-value">${c.derniere_connexion || '—'}</span></div>
    </div>`;

  if (vouchers.length > 0) {
    html += '<h3 style="margin:18px 0 10px;font-size:0.95rem;">Vouchers associés</h3>';
    html += '<div class="table-responsive"><table style="width:100%;font-size:0.82rem;"><thead><tr><th>Code</th><th>Offre</th><th>Statut</th><th>Créé</th><th>Utilisé</th><th>Expire</th></tr></thead><tbody>';
    vouchers.forEach(v => {
      const badgeClass = v.status === 'actif' ? 'badge-actif' : v.status === 'non_utilise' ? 'badge-non_utilise' : v.status === 'expire' ? 'badge-expire' : 'badge-desactive';
      html += '<tr><td class="mono">' + esc(v.code) + '</td><td>' + esc(v.plan_nom || '—') + '</td><td><span class="badge ' + badgeClass + '">' + esc(v.status) + '</span></td><td>' + (v.created_at || '—') + '</td><td>' + (v.used_at || '—') + '</td><td>' + (v.expire_at || '—') + '</td></tr>';
    });
    html += '</tbody></table></div>';
  } else {
    html += '<p style="color:var(--ink-soft);margin-top:14px;font-size:0.85rem;">Aucun voucher associé</p>';
  }

  document.getElementById('modal-detail-title').textContent = 'Client — ' + c.nom;
  document.getElementById('modal-detail-body').innerHTML = html;
  document.getElementById('modal-detail').style.display = 'flex';
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }
document.getElementById('modal-detail')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('modal-detail'); });

document.addEventListener('keydown', (e) => {
  const confirmModal = document.getElementById('modal-confirm');
  const statusModal = document.getElementById('modal-status');
  const isConfirmVisible = confirmModal && confirmModal.style.display !== 'none';
  const isStatusVisible = statusModal && statusModal.style.display !== 'none';

  if (e.key === 'Enter') {
    if (isConfirmVisible) {
      e.preventDefault();
      document.getElementById('btn-confirm-delete').click();
    } else if (isStatusVisible) {
      e.preventDefault();
      document.getElementById('btn-confirm-status').click();
    }
  } else if (e.key === 'Escape') {
    closeModal('modal-confirm');
    closeModal('modal-status');
    closeModal('modal-detail');
  }
});

let clientToChangeStatus = null;
let statusToSet = null;

function toggleStatut(id, newStatut) {
  clientToChangeStatus = id;
  statusToSet = newStatut;
  const label = newStatut === 'suspendu' ? 'suspendre' : 'activer';
  document.getElementById('modal-status-text').textContent = 'Voulez-vous vraiment ' + label + ' ce client ?';
  document.getElementById('modal-status').style.display = 'flex';
}

document.getElementById('btn-confirm-status')?.addEventListener('click', async () => {
  if (!clientToChangeStatus || !statusToSet) return;
  const id = clientToChangeStatus;
  const newStatut = statusToSet;
  closeModal('modal-status');
  clientToChangeStatus = null;
  statusToSet = null;
  
  const r = await fetch('../login_php/clients.php', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'changer_statut', id, statut: newStatut })
  });
  const d = await r.json().catch(() => ({}));
  showMsg(d.message || (r.ok ? 'Statut du client modifié avec succès' : 'Erreur lors de la modification du statut'), r.ok);
  if (r.ok) charger(currentPage);
});

let clientToDelete = null;

function supprimer(id) {
  clientToDelete = id;
  document.getElementById('modal-confirm').style.display = 'flex';
}

document.getElementById('btn-confirm-delete')?.addEventListener('click', async () => {
  if (!clientToDelete) return;
  const id = clientToDelete;
  closeModal('modal-confirm');
  clientToDelete = null;
  
  const r = await fetch('../login_php/clients.php', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'supprimer', id })
  });
  const d = await r.json().catch(() => ({}));
  showMsg(d.message || (r.ok ? 'Client supprimé avec succès' : 'Erreur lors de la suppression'), r.ok);
  if (r.ok) charger(currentPage);
});

function formatMG(num){
  if (!num) return '';
  let d = num.replace(/[^0-9]/g,'');
  if (d.startsWith('261')) d = d.substring(3);
  if (d.length > 0 && d[0] !== '0') d = '0' + d;
  d = d.slice(0,10);
  if (d.length <= 3) return d;
  if (d.length <= 5) return d.slice(0,3)+' '+d.slice(3);
  if (d.length <= 8) return d.slice(0,3)+' '+d.slice(3,5)+' '+d.slice(5);
  return d.slice(0,3)+' '+d.slice(3,5)+' '+d.slice(5,8)+' '+d.slice(8,10);
}
document.getElementById('cl-tel').addEventListener('input', e=>{
  e.target.value = formatMG(e.target.value);
});
document.getElementById('form-client').addEventListener('submit', async e => {
  e.preventDefault();
  const nom = document.getElementById('cl-nom').value.trim();
  let username = document.getElementById('cl-username')?.value.trim() || '';
  let password = document.getElementById('cl-password')?.value || '';
  const email = document.getElementById('cl-email').value.trim();
  const country = document.getElementById('cl-country')?.value || '+261';
  let telRaw = document.getElementById('cl-tel').value.replace(/[^0-9]/g,'').replace(/^0+/, '');
  const telephone = telRaw ? country + telRaw : '';
  // Auto-génère identifiant/mot de passe si champs cachés vides
  if (!username) {
    username = nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'.').replace(/^\.+|\.+$/g,'');
    if (username.length < 3) username = 'user' + Math.random().toString(36).slice(2,5);
  }
  if (!editId && (!password || password.length < 6)) {
    password = Math.random().toString(36).slice(2,8) + Math.random().toString(36).slice(2,4);
    if (password.length < 8) password = (password + 'abc123').slice(0,8);
  }

  if (editId) {
    const r = await fetch('../login_php/clients.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'modifier', id: editId, nom, username, email, telephone })
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { showMsg(d.error || 'Erreur lors de la modification', false); return; }
    if (password && password.length >= 6) {
      const r2 = await fetch('../login_php/clients.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', id: editId, password })
      });
      const d2 = await r2.json().catch(() => ({}));
      if (!r2.ok) { showMsg(d2.error || 'Erreur lors de la mise à jour du mot de passe', false); return; }
    }
    showMsg(d.message || 'Client modifié avec succès', true);
    document.getElementById('btn-cancel').click();
    charger(currentPage);
  } else {
    if (!password || password.length < 6) { showMsg('Mot de passe 6 caractères minimum', false); return; }
    const r = await fetch('../login_php/clients.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'creer', nom, username, password, email, telephone })
    });
    const d = await r.json().catch(() => ({}));
    showMsg(d.message || (r.ok ? 'Client créé avec succès' : d.error || 'Erreur lors de la création'), r.ok);
    if (r.ok) { e.target.reset(); charger(1); }
  }
});

// Auto-génère l'identifiant à partir du nom si vide
document.getElementById('cl-nom').addEventListener('input', e=>{
  if (editId) return;
  const u = document.getElementById('cl-username');
  if (u.value) return;
  const base = e.target.value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'.').replace(/^\.+|\.+$/g,'');
  if (base.length >= 2) u.value = base;
});

let searchTimer;
document.getElementById('search-clients').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => charger(1), 400);
});
document.getElementById('filter-statut').addEventListener('change', () => charger(1));

charger(1);
setInterval(()=> { if(!document.hidden) charger(currentPage); }, 15000);
