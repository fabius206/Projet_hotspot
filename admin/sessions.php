<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sessions — Hotspot Diego</title>
  <script src="../js/theme-preload.js"></script><link rel="stylesheet" href="dashboard.css">
</head>
<body>
  <div class="tout">
    <aside class="deuxieme">
      <div class="title">Hotspot<span style="color:var(--coral)">Diego</span><small>Affichage</small></div>
      <nav>
        <a href="dash.php">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Tableau de bord
        </a>
        <a href="clients.php">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Clients
        </a>
        <a href="codes.php" data-role="admin">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
          Codes d'accès
        </a>
        <a href="sessions.php" class="active" data-role="admin">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          Sessions
        </a>
        <a href="offres.php" data-role="admin">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          Offres
        </a>
        <a href="comptes.php" data-role="admin">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          Comptes
        </a>
        <a href="parametre.php">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
          Paramètre
        </a>
        <a href="../login_php/logout.php">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Déconnexion
        </a>
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
      if (!button || !(await window.showConfirm('Cette session sera immédiatement déconnectée.', {
        title: 'Déconnecter la session ?',
        confirmLabel: 'Déconnecter'
      }))) return;
      const response = await fetch('../login_php/api_sessions.php', {
        method: 'POST', credentials: 'same-origin',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: 'kick', id: Number(button.dataset.kick)})
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        window.showToast(data.error || 'Déconnexion impossible', false);
        return;
      }
      window.showToast('Session déconnectée avec succès.');
      loadSessions('active');
    });
    loadSessions();
  </script>
</body>
</html>
