let toastTimeout;
function showMsg(t, ok) {
  const container = document.getElementById('toast-container');
  const text = document.getElementById('toast-text');
  if(!container || !text) return;
  text.textContent = t;
  container.className = 'toast-container ' + (ok ? 'toast-success' : 'toast-error');
  container.removeAttribute('style');
  container.style.display = 'flex';
  
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    container.style.display = 'none';
  }, 4500);
}
window.showMessage = showMsg;
window.showToast = showMsg;

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

let editId = null;
let currentRole = null;
let currentId = null;
let roleReady = false;

// Récupère le rôle courant pour adapter l'UI — seul super_admin a le CRUD (sans refresh)
fetch('../login_php/check_session.php').then(r=>r.json()).then(d=>{
  currentRole = d.role;
  currentId = d.user_id || null;
  roleReady = true;
  if (currentRole === 'super_admin') {
    const b = document.getElementById('super-banner');
    if (b) b.style.display = 'block';
  } else {
    const formCard = document.getElementById('form-compte')?.closest('.card');
    if (formCard) {
      formCard.style.opacity = '0.55';
      formCard.style.pointerEvents = 'none';
      const note = document.createElement('div');
      note.style.cssText = 'margin-top:12px;padding:10px 12px;background:rgba(196,67,43,0.08);border:1px solid rgba(196,67,43,0.2);border-radius:8px;color:var(--danger);font-size:0.84rem;';
      note.textContent = 'Accès lecture seule — seul un Super Admin peut créer, modifier ou supprimer des comptes.';
      formCard.appendChild(note);
    }
    const opt = document.querySelector('#c-role option[value="super_admin"]');
    if (opt) { opt.disabled = true; opt.textContent += ' (réservé Super Admin)'; }
  }
  // Recharge le tableau dès que le rôle est connu — actions s'affichent sans refresh
  charger();
}).catch(()=>{ roleReady = true; charger(); });

async function charger() {
  const r = await fetch('../login_php/admins.php');
  if (r.status === 401 || r.status === 403) { window.location.replace('../index.php'); return; }
  const data = await r.json();
  const ct = document.getElementById('counter-admins');
  const cs = document.getElementById('counter-super');
  if (ct) ct.textContent = data.admin_count || 0;
  if (cs) cs.textContent = data.super_count || 0;
  const tbody = document.querySelector('#table-comptes tbody');
  tbody.innerHTML = data.admins.map(a => {
    const isSuper = a.role === 'super_admin';
    const isOwn = currentId && a.id == currentId;
    const locked = currentRole !== 'super_admin';
    const badgeClass = isSuper ? 'badge-super_admin' : 'badge-admin';
    const shieldSm = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" style="vertical-align:-1px;margin-right:3px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
    const roleLabel = isSuper ? shieldSm + 'super_admin' : 'admin';
    const ownTag = isOwn ? ' <span class="own-tag">vous</span>' : '';
    const avatarHtml = a.photo
      ? `<img src="../uploads/avatars/${esc(a.photo)}" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:8px;border:1px solid var(--line);">`
      : `<span style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg, var(--lagoon), var(--bay));display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:0.82rem;vertical-align:middle;margin-right:8px;">${esc(a.username.trim().charAt(0).toUpperCase())}</span>`;
    return `
    <tr class="${isOwn ? 'row-own' : ''} ${locked ? 'row-locked' : ''}">
      <td style="display:flex;align-items:center;">${avatarHtml}<span>${esc(a.username)}${ownTag}</span></td>
      <td><span class="badge ${badgeClass}">${roleLabel}</span></td>
      <td>${a.creation}</td>
      <td style="white-space:nowrap;">
        <button class="btn btn-icon btn-sm" ${locked ? 'disabled' : ''} onclick="startEdit(${a.id}, '${a.username.replace(/'/g,"\\'")}', '${a.role}', '${(a.email || '').replace(/'/g,"\\'")}')" title="Modifier" aria-label="Modifier">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn btn-icon btn-sm" ${locked || isOwn ? 'disabled' : ''} onclick="resetPwd(${a.id})" title="Mot de passe" aria-label="Mot de passe">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
        </button>
        <button class="btn btn-icon btn-danger-icon btn-sm" ${locked || isOwn ? 'disabled' : ''} onclick="supprimer(${a.id})" title="Supprimer" aria-label="Supprimer">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </td>
    </tr>`;
  }).join('');
}

function startEdit(id, username, role, email = '') {
  editId = id;
  document.getElementById('edit-id').value = id;
  document.getElementById('c-username').value = username;
  document.getElementById('c-email').value = email;
  document.getElementById('c-role').value = role;
  document.getElementById('c-password').value = '';
  document.getElementById('c-password').required = false;
  const isOwn = currentId && id == currentId;
  const roleSel = document.getElementById('c-role');
  if (isOwn) {
    roleSel.disabled = true;
    roleSel.title = 'Vous ne pouvez pas changer votre propre rôle';
  } else {
    roleSel.disabled = false;
    roleSel.title = '';
  }
  document.getElementById('titre-form').textContent = 'Modifier le compte';
  document.getElementById('btn-submit').textContent = 'Enregistrer';
  document.getElementById('btn-cancel').style.display = '';
  window.scrollTo({top:0, behavior:'smooth'});
}

document.getElementById('btn-cancel').addEventListener('click', () => {
  editId = null;
  document.getElementById('form-compte').reset();
  document.getElementById('edit-id').value = '';
  document.getElementById('c-password').required = true;
  document.getElementById('c-role').disabled = false;
  document.getElementById('c-role').title = '';
  document.getElementById('titre-form').textContent = 'Créer un compte';
  document.getElementById('btn-submit').textContent = 'Créer le compte';
  document.getElementById('btn-cancel').style.display = 'none';
});

let currentActionId = null;

function resetPwd(id) {
  currentActionId = id;
  const input = document.getElementById('input-new-pwd');
  if(input) input.value = '';
  openModal('modal-reset');
  setTimeout(() => input?.focus(), 100);
}

document.getElementById('btn-confirm-reset')?.addEventListener('click', async () => {
  const pwd = document.getElementById('input-new-pwd').value;
  if (pwd.length < 6) { showMsg('Mot de passe trop court', false); return; }
  closeModal('modal-reset');
  const r = await fetch('../login_php/admins.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'reset_password', id: currentActionId, password: pwd}) });
  const data = await r.json().catch(()=>({}));
  showMsg(data.message || data.error, r.ok);
  if (r.ok) charger();
});

function supprimer(id) {
  currentActionId = id;
  openModal('modal-delete');
}

document.getElementById('btn-confirm-delete')?.addEventListener('click', async () => {
  if (!currentActionId) return;
  closeModal('modal-delete');
  const r = await fetch('../login_php/admins.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'supprimer', id: currentActionId}) });
  const data = await r.json().catch(()=>({}));
  showMsg(data.message || data.error, r.ok);
  if (r.ok) charger();
});

// Touche clavier globale (Echap pour fermer, Entrée pour valider modale si ouverte)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal('modal-delete');
    closeModal('modal-reset');
  }
  if (e.key === 'Enter') {
    if (document.getElementById('modal-delete').style.display === 'flex') {
      document.getElementById('btn-confirm-delete').click();
    }
    if (document.getElementById('modal-reset').style.display === 'flex') {
      document.getElementById('btn-confirm-reset').click();
    }
  }
});

document.getElementById('form-compte').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('c-username').value.trim();
  const email = document.getElementById('c-email').value.trim();
  const password = document.getElementById('c-password').value;
  const role = document.getElementById('c-role').value;

  if (editId) {
    // Modification : username + role, mot de passe optionnel via reset séparé si fourni
    const r = await fetch('../login_php/admins.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'modifier', id: editId, username, email, role}) });
    const data = await r.json().catch(()=>({}));
    if (!r.ok) { showMsg(data.error||'Erreur', false); return; }
    if (password) {
      const r2 = await fetch('../login_php/admins.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'reset_password', id: editId, password}) });
      const d2 = await r2.json().catch(()=>({}));
      if (!r2.ok) { showMsg(d2.error||'Erreur mot de passe', false); return; }
    }
    showMsg(data.message, true);
    document.getElementById('btn-cancel').click();
    charger();
  } else {
    if (!password || password.length < 6) { showMsg('Mot de passe 6 caractères minimum', false); return; }
    const r = await fetch('../login_php/admins.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'creer', username, email, password, role}) });
    const data = await r.json().catch(()=>({}));
    showMsg(data.message || data.error, r.ok);
    if (r.ok) { e.target.reset(); charger(); }
  }
});
// Premier chargement via le fetch du rôle ci-dessus (pas besoin d'appel direct)
