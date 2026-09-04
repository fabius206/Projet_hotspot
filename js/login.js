// ===== TOAST NOTIFICATION UNIFIÉ (Style Offre) =====
const toastContainer = document.getElementById('toast-container');
const toastText = document.getElementById('toast-text');
let toastTimer = null;

function showToast(text, ok = true) {
  if (toastText) toastText.textContent = text;
  if (toastContainer) {
    toastContainer.className = 'toast-container ' + (ok ? 'toast-success' : 'toast-error');
    toastContainer.style.display = 'flex';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastContainer.style.display = 'none';
    }, 4500);
  }
}

// ===== TOGGLE PASSWORD POUR TOUS LES CHAMPS =====
document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target') || 'password';
    const pwdInput = document.getElementById(targetId);
    if (!pwdInput) return;
    const eyeOn = btn.querySelector('.eye-on');
    const eyeOff = btn.querySelector('.eye-off');
    const show = pwdInput.type === 'password';
    pwdInput.type = show ? 'text' : 'password';
    if (eyeOn) eyeOn.style.display = show ? 'none' : '';
    if (eyeOff) eyeOff.style.display = show ? '' : 'none';
    btn.setAttribute('aria-label', show ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
    pwdInput.focus();
  });
});

// ===== CSRF TOKEN =====
let csrfToken = '';
fetch('login_php/csrf.php', { credentials: 'same-origin' })
  .then(r => r.json())
  .then(d => {
    csrfToken = d.csrf || '';
    const el = document.getElementById('csrf-token');
    if (el) el.value = csrfToken;
  })
  .catch(() => {});

// ===== SWITCH ENTRE CONNEXION ET MOT DE PASSE OUBLIÉ =====
const cardLogin = document.getElementById('card-login');
const cardForgot = document.getElementById('card-forgot');
const forgotLink = document.getElementById('forgot-link');
const backToLogin = document.getElementById('back-to-login');
const forgotStep1 = document.getElementById('forgot-step1-form');
const forgotStep2 = document.getElementById('forgot-step2-form');
const backToStep1 = document.getElementById('back-to-step1');

if (forgotLink) {
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    cardLogin.style.display = 'none';
    cardForgot.style.display = 'block';
    // Reset forgot steps
    forgotStep1.style.display = 'block';
    forgotStep2.style.display = 'none';
    const ferr = document.getElementById('forgot-error');
    if (ferr) ferr.style.display = 'none';
    const usr = document.getElementById('username')?.value.trim();
    if (usr) document.getElementById('forgot-username').value = usr;
    document.getElementById('forgot-username').focus();
  });
}

if (backToLogin) {
  backToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    cardForgot.style.display = 'none';
    cardLogin.style.display = 'block';
    const err = document.getElementById('error');
    if (err) err.style.display = 'none';
  });
}

if (backToStep1) {
  backToStep1.addEventListener('click', (e) => {
    e.preventDefault();
    forgotStep2.style.display = 'none';
    forgotStep1.style.display = 'block';
  });
}

// ===== SOUMISSION CONNEXION =====
let failedCount = 0;

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const errorBox = document.getElementById('error');
  const btn = document.getElementById('btn-login-submit');
  errorBox.style.display = 'none';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (username.length < 2) {
    errorBox.textContent = 'Veuillez saisir votre identifiant.';
    errorBox.style.display = 'block';
    return;
  }
  if (password.length < 2) {
    errorBox.textContent = 'Veuillez saisir votre mot de passe.';
    errorBox.style.display = 'block';
    return;
  }

  btn.disabled = true;

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

    const payload = { username, password };
    if (csrfToken) payload._csrf = csrfToken;

    const response = await fetch('login_php/login.php', {
      method: 'POST',
      headers,
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Identifiant ou mot de passe incorrect.');
    }

    showToast('Connexion réussie ! Redirection en cours...', true);
    setTimeout(() => {
      window.location.replace(data.redirect || 'admin/dash.php');
    }, 400);

  } catch (err) {
    failedCount++;
    errorBox.textContent = err.message || 'Connexion impossible';
    errorBox.style.display = 'block';
    errorBox.classList.remove('shake');
    void errorBox.offsetWidth;
    errorBox.classList.add('shake');
    showToast(err.message || 'Erreur de connexion', false);
    btn.disabled = false;

    if (failedCount >= 3) {
      btn.disabled = true;
      let wait = 3;
      const orig = errorBox.textContent;
      const timer = setInterval(() => {
        errorBox.textContent = orig + ' — Veuillez patienter ' + wait + 's...';
        wait--;
        if (wait < 0) {
          clearInterval(timer);
          errorBox.textContent = orig;
          btn.disabled = false;
        }
      }, 1000);
    }
  }
});

// ===== FLUX MOT DE PASSE OUBLIÉ =====
let resetSessionToken = '';
let currentForgotUser = '';

// Étape 1 : Demande de code de réinitialisation
document.getElementById('forgot-step1-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const ferr = document.getElementById('forgot-error');
  const btn = document.getElementById('btn-forgot-step1');
  ferr.style.display = 'none';

  const username = document.getElementById('forgot-username').value.trim();
  if (!username) {
    ferr.textContent = 'Veuillez saisir votre identifiant ou adresse email.';
    ferr.style.display = 'block';
    return;
  }

  btn.disabled = true;

  try {
    const res = await fetch('login_php/forgot_password.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request', username })
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Compte introuvable ou erreur de traitement.');
    }

    resetSessionToken = data.token;
    currentForgotUser = username;

    // Affiche le code démo / aide pour le mode local
    if (data.demo_code) {
      const hintBox = document.getElementById('otp-hint-box');
      const hintCode = document.getElementById('otp-hint-code');
      if (hintBox && hintCode) {
        hintCode.textContent = data.demo_code;
        hintBox.style.display = 'block';
      }
      // Pré-remplir l'OTP pour un confort optimal
      const otpInput = document.getElementById('otp-code');
      if (otpInput) otpInput.value = data.demo_code;
    }

    showToast(data.message || 'Code de vérification envoyé !', true);

    // Passage à l'étape 2
    forgotStep1.style.display = 'none';
    forgotStep2.style.display = 'block';
    document.getElementById('new-password').focus();

  } catch (err) {
    ferr.textContent = err.message || 'Erreur lors de la demande.';
    ferr.style.display = 'block';
    showToast(err.message, false);
  } finally {
    btn.disabled = false;
  }
});

// Étape 2 : Validation code OTP + Nouveau mot de passe
document.getElementById('forgot-step2-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const ferr = document.getElementById('forgot-error');
  const btn = document.getElementById('btn-forgot-step2');
  ferr.style.display = 'none';

  const otp = document.getElementById('otp-code').value.trim();
  const newPwd = document.getElementById('new-password').value;
  const confirmPwd = document.getElementById('confirm-password').value;

  if (otp.length < 4) {
    ferr.textContent = 'Veuillez saisir le code de vérification à 6 chiffres.';
    ferr.style.display = 'block';
    return;
  }
  if (newPwd.length < 6) {
    ferr.textContent = 'Le mot de passe doit comporter au moins 6 caractères.';
    ferr.style.display = 'block';
    return;
  }
  if (newPwd !== confirmPwd) {
    ferr.textContent = 'Les deux mots de passe ne correspondent pas.';
    ferr.style.display = 'block';
    return;
  }

  btn.disabled = true;

  try {
    const res = await fetch('login_php/forgot_password.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reset',
        token: resetSessionToken,
        otp,
        new_password: newPwd
      })
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Échec de la réinitialisation.');
    }

    showToast(data.message || 'Mot de passe modifié avec succès !', true);

    // Retour automatique à la connexion avec l'identifiant pré-rempli
    setTimeout(() => {
      cardForgot.style.display = 'none';
      cardLogin.style.display = 'block';
      document.getElementById('username').value = currentForgotUser;
      document.getElementById('password').value = '';
      document.getElementById('password').focus();
    }, 1500);

  } catch (err) {
    ferr.textContent = err.message || 'Erreur lors de la réinitialisation.';
    ferr.style.display = 'block';
    showToast(err.message, false);
  } finally {
    btn.disabled = false;
  }
});
