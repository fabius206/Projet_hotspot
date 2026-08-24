requireLogin();

document.getElementById('logout-link').addEventListener('click', (e) => {
  e.preventDefault();
  clearSession();
  window.location.href = 'index.html';
});

async function loadStats() {
  try {
    const vouchers = await apiFetch('/vouchers');
    const counts = { non_utilise: 0, actif: 0, expire: 0, desactive: 0 };
    vouchers.forEach((v) => { counts[v.status] = (counts[v.status] || 0) + 1; });

    document.getElementById('stat-non-utilise').textContent = counts.non_utilise;
    document.getElementById('stat-actif').textContent = counts.actif;
    document.getElementById('stat-expire').textContent = counts.expire;
    document.getElementById('stat-total').textContent = vouchers.length;
  } catch (err) {
    console.error(err);
  }
}

async function loadRouters() {
  const body = document.getElementById('routers-body');
  try {
    const routers = await apiFetch('/routers');
    if (routers.length === 0) {
      body.innerHTML = '<tr><td colspan="5">Aucun routeur configuré pour le moment.</td></tr>';
      return;
    }
    body.innerHTML = routers.map((r) => `
      <tr>
        <td>${r.name}</td>
        <td class="mono">${r.ip_address}</td>
        <td>${r.site_location || '—'}</td>
        <td><span id="status-${r.id}" class="badge badge-non_utilise">à vérifier</span></td>
        <td><button class="btn btn-outline btn-sm" onclick="testRouter(${r.id})">Tester</button></td>
      </tr>
    `).join('');
  } catch (err) {
    body.innerHTML = `<tr><td colspan="5">Erreur : ${err.message}</td></tr>`;
  }
}

async function testRouter(id) {
  const badge = document.getElementById(`status-${id}`);
  badge.textContent = 'test en cours…';
  try {
    const result = await apiFetch(`/routers/${id}/test`);
    if (result.online) {
      badge.textContent = 'en ligne';
      badge.className = 'badge badge-actif';
    } else {
      badge.textContent = 'hors ligne';
      badge.className = 'badge badge-desactive';
    }
  } catch (err) {
    badge.textContent = 'erreur';
    badge.className = 'badge badge-desactive';
  }
}

loadStats();
loadRouters();
