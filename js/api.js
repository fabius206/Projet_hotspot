// Point d'entrée unique vers l'API. Adapter API_BASE selon l'environnement
// (en dev via Nginx du docker-compose, tout passe par /api).
const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('hotspot_token');
}

function setToken(token) {
  localStorage.setItem('hotspot_token', token);
}

function clearSession() {
  localStorage.removeItem('hotspot_token');
  localStorage.removeItem('hotspot_user');
}

function requireLogin() {
  if (!getToken()) {
    window.location.href = 'index.html';
  }
}

async function apiFetch(path, options = {}) {
  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    options.headers || {}
  );

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    clearSession();
    window.location.href = 'index.html';
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Erreur ${response.status}`);
  }

  return data;
}
