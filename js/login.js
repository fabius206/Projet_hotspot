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
