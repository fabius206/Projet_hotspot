const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.tab-panel');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.toggle('active', t === tab));
    panels.forEach((p) => p.classList.toggle('active', p.id === 'tab-' + tab.dataset.tab));
  });
});

function makeShow(box) {
  return (text, ok) => {
    box.textContent = text;
    box.classList.toggle('success-banner', ok);
    box.classList.toggle('error-banner', !ok);
    box.style.display = 'block';
  };
}

const showNom = makeShow(document.getElementById('message-nom'));
const showPass = makeShow(document.getElementById('message'));

// --- Profil : prenom de l'admin ---
fetch('../login_php/admin_info.php')
  .then((r) => r.json())
  .then((data) => {
    if (data.admin) {
      document.getElementById('nom-admin').value = data.admin.username;
    }
  })
  .catch(() => {});

document.getElementById('form-nom').addEventListener('submit', async (e) => {
  e.preventDefault();
  showNom('', true);
  document.getElementById('message-nom').style.display = 'none';

  const btn = e.target.querySelector('.btn');
  const newUsername = document.getElementById('nom-admin').value.trim();
  btn.disabled = true;

  try {
    const response = await fetch('../login_php/modifier_nom.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_username: newUsername }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Erreur ${response.status}`);
    }

    showNom(data.message || "Nom de l'administrateur mis à jour.", true);
  } catch (err) {
    showNom(err.message || 'Modification impossible.', false);
  } finally {
    btn.disabled = false;
  }
});

// --- Securite : mot de passe ---
document.getElementById('form-password').addEventListener('submit', async (e) => {
  e.preventDefault();
  document.getElementById('message').style.display = 'none';

  const username = document.getElementById('username').value.trim();
  const currentPassword = document.getElementById('current').value;
  const newPassword = document.getElementById('new').value;
  const confirmPassword = document.getElementById('confirm').value;

  if (newPassword !== confirmPassword) {
    showPass('Les nouveaux mots de passe ne correspondent pas.', false);
    return;
  }

  const btn = e.target.querySelector('.btn');
  btn.disabled = true;

  try {
    const response = await fetch('../login_php/modifier_admin.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Erreur ${response.status}`);
    }

    showPass(data.message || 'Mot de passe mis à jour avec succès.', true);
    e.target.reset();
  } catch (err) {
    showPass(err.message || 'Modification impossible.', false);
  } finally {
    btn.disabled = false;
  }
});
