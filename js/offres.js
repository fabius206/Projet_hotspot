const messageBox = document.getElementById('message');

function showMessage(text, ok) {
  messageBox.textContent = text;
  messageBox.classList.toggle('success-banner', ok);
  messageBox.classList.toggle('error-banner', !ok);
  messageBox.style.display = 'block';
}

let idEnEdition = null;

async function chargerPlans() {
  const response = await fetch('../login_php/plans.php');
  if (response.status === 401) { window.location.replace('../index.html'); return; }
  const data = await response.json();

  const tbody = document.querySelector('#table-plans tbody');
  tbody.innerHTML = data.plans.map((p) => `
    <tr>
      <td>${p.nom}</td>
      <td>${p.duree_heures} h</td>
      <td>${Number(p.prix).toLocaleString('fr-FR')} Ar</td>
      <td>${p.nb_codes}</td>
      <td><span class="badge ${Number(p.actif) === 1 ? 'badge-actif' : 'badge-desactive'}">${Number(p.actif) === 1 ? 'Active' : 'Masquee'}</span></td>
      <td style="white-space:nowrap;">
        <button class="btn btn-outline btn-sm" onclick="preparerEdition(${p.id}, '${p.nom.replace(/'/g, "\\'")}', ${p.duree_heures}, ${p.prix})">Modifier</button>
        <button class="btn btn-outline btn-sm" onclick="actionPlan(${p.id}, 'basculer')">${Number(p.actif) === 1 ? 'Masquer' : 'Afficher'}</button>
        <button class="btn btn-danger btn-sm" onclick="actionPlan(${p.id}, 'supprimer')">Supprimer</button>
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

async function actionPlan(id, action) {
  if (action === 'supprimer' && !confirm('Supprimer cette offre ?')) return;

  const response = await fetch('../login_php/plans.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action }),
  });

  if (response.status === 401) { window.location.replace('../index.html'); return; }
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

  if (response.status === 401) { window.location.replace('../index.html'); return; }
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
