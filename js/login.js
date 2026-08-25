const toggleBtn = document.querySelector('.toggle-password');
if (toggleBtn) {
  const pwdInput = document.getElementById('password');
  const eyeOn = toggleBtn.querySelector('.eye-on');
  const eyeOff = toggleBtn.querySelector('.eye-off');

  toggleBtn.addEventListener('click', () => {
    const show = pwdInput.type === 'password';
    pwdInput.type = show ? 'text' : 'password';
    eyeOn.style.display = show ? 'none' : '';
    eyeOff.style.display = show ? '' : 'none';
    toggleBtn.setAttribute('aria-label', show ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
    pwdInput.focus();
  });
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const errorBox = document.getElementById('error');
  const btn = e.target.querySelector('.btn');
  errorBox.style.display = 'none';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  btn.disabled = true;
  btn.classList.add('loading');

  try {
    const response = await fetch('login_php/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Erreur ${response.status}`);
    }

    window.location.href = 'dashboard/dash.html';
  } catch (err) {
    errorBox.textContent = err.message || 'Connexion impossible';
    errorBox.style.display = 'block';
    errorBox.classList.remove('shake');
    void errorBox.offsetWidth;
    errorBox.classList.add('shake');
    btn.disabled = false;
    btn.classList.remove('loading');
  }
});
