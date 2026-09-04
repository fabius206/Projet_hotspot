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

let idEnEdition = null;

async function chargerPlans() {
  const response = await fetch('../login_php/plans.php');
  if (response.status === 401) { window.location.replace('../index.php'); return; }
  const data = await response.json();

  const tbody = document.querySelector('#table-plans tbody');
  tbody.innerHTML = data.plans.map((p) => `
    <tr>
      <td>${p.nom}</td>
      <td>${p.duree_heures} h</td>
      <td>${Number(p.prix).toLocaleString('fr-FR')} Ar</td>
      <td>${p.nb_codes}</td>
      <td><span class="badge ${Number(p.actif) === 1 ? 'badge-actif' : 'badge-desactive'}">${Number(p.actif) === 1 ? 'Active' : 'Masquee'}</span></td>
      <td style="white-space:nowrap; text-align:center;">
        <button class="btn btn-icon btn-sm" onclick="preparerEdition(${p.id}, '${p.nom.replace(/'/g, "\\'")}', ${p.duree_heures}, ${p.prix})" title="Modifier" aria-label="Modifier"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="btn btn-icon btn-sm" onclick="actionPlan(${p.id}, 'basculer')" title="${Number(p.actif) === 1 ? 'Masquer' : 'Afficher'}" aria-label="${Number(p.actif) === 1 ? 'Masquer' : 'Afficher'}">${Number(p.actif) === 1 ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'}</button>
        <button class="btn btn-icon btn-danger-icon btn-sm" onclick="actionPlan(${p.id}, 'supprimer')" title="Supprimer" aria-label="Supprimer"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
      </td>
    </tr>
  `).join('');
}

function preparerEdition(id, nom, duree, prix) {
  idEnEdition = id;
  document.getElementById('plan-nom').value = nom;
  document.getElementById('plan-duree').value = duree;
  document.getElementById('plan-prix').value = prix;
  document.getElementById('btn-plan').textContent = 'Mettre a jour';
  document.getElementById('btn-annuler').style.display = '';
}

function resetForm() {
  idEnEdition = null;
  document.getElementById('form-plan').reset();
  document.getElementById('btn-plan').textContent = 'Ajouter l\'offre';
  document.getElementById('btn-annuler').style.display = 'none';
}

document.getElementById('btn-annuler').addEventListener('click', resetForm);

let pendingDeleteOffreId = null;
function closeModal(id){ document.getElementById(id).style.display='none'; }
document.getElementById('modal-delete-offre')?.addEventListener('click', e=>{ if(e.target===e.currentTarget) closeModal('modal-delete-offre'); });
document.getElementById('btn-confirm-delete-offre')?.addEventListener('click', async ()=>{
  if(pendingDeleteOffreId===null) return;
  closeModal('modal-delete-offre');
  await doActionPlan(pendingDeleteOffreId, 'supprimer');
  pendingDeleteOffreId=null;
});
async function actionPlan(id, action) {
  if (action === 'supprimer') { pendingDeleteOffreId=id; document.getElementById('modal-delete-offre').style.display='flex'; return; }
  return doActionPlan(id, action);
}
async function doActionPlan(id, action) {
  const response = await fetch('../login_php/plans.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action }),
  });

  if (response.status === 401) { window.location.replace('../index.php'); return; }
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    showMessage(data.error || 'Action impossible.', false);
    return;
  }
  showMessage(data.message, true);
  chargerPlans();
}

document.getElementById('form-plan').addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    action: idEnEdition ? 'modifier' : 'creer',
    nom: document.getElementById('plan-nom').value.trim(),
    duree_heures: document.getElementById('plan-duree').value,
    prix: document.getElementById('plan-prix').value,
  };
  if (idEnEdition) payload.id = idEnEdition;

  const response = await fetch('../login_php/plans.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (response.status === 401) { window.location.replace('../index.php'); return; }
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    showMessage(data.error || 'Enregistrement impossible.', false);
    return;
  }

  showMessage(data.message, true);
  resetForm();
  chargerPlans();
});

chargerPlans();
setInterval(()=>{ if(!document.hidden) chargerPlans(); }, 15000);
