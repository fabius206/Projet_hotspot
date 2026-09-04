<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sessions — Hotspot Diego</title>
  <link rel="stylesheet" href="dashboard.css">
</head>
<body>
  <div class="tout">
    <aside class="deuxieme">
      <div class="title">Hotspot<span style="color:var(--coral)">Diego</span><small>Affichage</small></div>
      <nav>
        <a href="dash.php">Tableau de bord</a>
        <a href="clients.php">Clients</a>
        <a href="codes.php">Codes d'accès</a>
        <a href="sessions.php" class="active">Sessions</a>
        <a href="offres.php">Offres</a>
        <a href="comptes.php">Comptes</a>
        <a href="parametre.php">Paramètre</a>
        <a href="../login_php/logout.php">Déconnexion</a>
      </nav>
    </aside>
    <main class="main">
      <div class="topbar">
        <div><h1>Sessions</h1><div class="subtitle">Connexions actives et historique du hotspot</div></div>
        <button class="btn btn-outline" id="refresh">Actualiser</button>
      </div>
      <div class="stat-grid">
        <div class="stat-card accent"><div class="label">Actives</div><div class="value" id="active">—</div></div>
        <div class="stat-card"><div class="label">Aujourd'hui</div><div class="value" id="today">—</div></div>
        <div class="stat-card"><div class="label">Ce mois</div><div class="value" id="month">—</div></div>
        <div class="stat-card"><div class="label">Durée moyenne</div><div class="value" id="average">—</div></div>
      </div>
      <div class="tabs">
        <button class="tab active" data-action="active">Sessions actives</button>
        <button class="tab" data-action="history">Historique</button>
      </div>
      <div class="card">
        <div id="notice" class="error-banner" hidden></div>
        <div class="table-responsive">
          <table>
            <thead><tr><th>Utilisateur</th><th>Voucher</th><th>IP</th><th>Offre</th><th>Début</th><th>Statut</th><th>Action</th></tr></thead>
            <tbody id="rows"><tr><td colspan="7">Chargement…</td></tr></tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
  <script src="../js/guard.js"></script>
  <script>
    const rows = document.getElementById('rows');
    const notice = document.getElementById('notice');
    let currentAction = 'active';
    const esc = value => String(value ?? '—').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
    const formatDate = value => value ? new Date(value.replace(' ', 'T')).toLocaleString('fr-FR') : '—';
    async function loadSessions(action = currentAction) {
      currentAction = action;
      notice.hidden = true;
      rows.innerHTML = '<tr><td colspan="7">Chargement…</td></tr>';
      try {
        const response = await fetch('../login_php/api_sessions.php?action=' + action, { credentials: 'same-origin' });
        const data = await response.json();
        if (!response.ok || data.success === false) throw new Error(data.error || 'Impossible de charger les sessions');
        if (action === 'active') {
          document.getElementById('active').textContent = data.stats.active;
          document.getElementById('today').textContent = data.stats.today;
          document.getElementById('month').textContent = data.stats.month;
          document.getElementById('average').textContent = (data.stats.avg_duration || 0) + ' min';
        }
        const sessions = data.sessions || [];
        rows.innerHTML = sessions.length ? sessions.map(session => `<tr>
          <td>${esc(session.hotspot_user)}</td><td>${esc(session.voucher_code)}</td>
          <td>${esc(session.ip_address)}</td><td>${esc(session.plan_nom)}</td>
          <td>${esc(formatDate(session.started_at))}</td><td>${esc(session.status)}</td>
          <td>${action === 'active' ? `<button class="btn btn-danger btn-sm" data-kick="${Number(session.id)}">Déconnecter</button>` : '—'}</td>
        </tr>`).join('') : '<tr><td colspan="7">Aucune session à afficher.</td></tr>';
      } catch (error) {
        notice.textContent = error.message;
        notice.hidden = false;
        rows.innerHTML = '<tr><td colspan="7">Erreur de chargement.</td></tr>';
      }
    }
    document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('[data-action]').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      loadSessions(button.dataset.action);
    }));
    document.getElementById('refresh').addEventListener('click', () => loadSessions());
    rows.addEventListener('click', async event => {
      const button = event.target.closest('[data-kick]');
      if (!button || !confirm('Déconnecter cette session ?')) return;
      const response = await fetch('../login_php/api_sessions.php', {
        method: 'POST', credentials: 'same-origin',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: 'kick', id: Number(button.dataset.kick)})
      });
      const data = await response.json();
      if (!response.ok || data.success === false) { notice.textContent = data.error || 'Déconnexion impossible'; notice.hidden = false; return; }
      loadSessions('active');
    });
    loadSessions();
  </script>
</body>
</html>
