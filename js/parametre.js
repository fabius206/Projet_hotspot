const form = document.getElementById('form-password');
const messageBox = document.getElementById('message');
const submitBtn = form.querySelector('.btn');

function showMessage(text, ok) {
  messageBox.textContent = text;
  messageBox.classList.toggle('success-banner', ok);
  messageBox.classList.toggle('error-banner', !ok);
  messageBox.style.display = 'block';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  messageBox.style.display = 'none';

  const username = document.getElementById('username').value.trim();
  const currentPassword = document.getElementById('current').value;
  const newPassword = document.getElementById('new').value;
  const confirmPassword = document.getElementById('confirm').value;

  if (newPassword !== confirmPassword) {
    showMessage('Les nouveaux mots de passe ne correspondent pas.', false);
    return;
  }

  submitBtn.disabled = true;

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

    showMessage(data.message || 'Mot de passe mis à jour avec succès.', true);
    form.reset();
  } catch (err) {
    showMessage(err.message || 'Modification impossible.', false);
  } finally {
    submitBtn.disabled = false;
  }
});
