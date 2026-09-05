<?php require_once __DIR__ . '/../login_php/_commun.php'; require_role(['super_admin']); ?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Routeur — Hotspot Diego</title>
  <script src="../js/theme-preload.js"></script><link rel="stylesheet" href="dashboard.css">
</head>
<body>
<div class="tout">
  <aside class="deuxieme"><div class="title">Hotspot<span style="color:var(--coral)">Diego</span><small>Affichage</small></div><nav>
    <a href="dash.php">Tableau de bord</a><a href="clients.php">Clients</a><a href="codes.php">Codes d'accès</a><a href="sessions.php">Sessions</a><a href="routeur.php" class="active">Routeur</a><a href="stats.php">Statistiques</a><a href="comptes.php">Comptes</a><a href="parametre.php">Paramètre</a><a href="../login_php/logout.php"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Déconnexion</a>
  </nav></aside>
  <main class="main">
    <div class="topbar"><div><h1>Gestion du routeur</h1><div class="subtitle">Configuration et état de connexion MikroTik</div></div><button class="btn btn-outline" id="btn-refresh">Tester la connexion</button></div>
    <div id="router-message" class="error-banner" style="display:none;"></div>
    <div class="stat-grid">
      <div class="stat-card accent"><div class="label">État</div><div class="value" id="router-status">—</div></div>
      <div class="stat-card"><div class="label">IP</div><div class="value" id="router-ip">—</div></div>
      <div class="stat-card"><div class="label">Version RouterOS</div><div class="value" id="router-version">—</div></div>
    </div>
    <div class="card card-large">
      <h3>Configuration MikroTik</h3>
      <p class="hint">Les identifiants sensibles ne sont pas affichés ni enregistrés par cette interface.</p>
      <form id="router-form" class="form-grid form-grid-2">
        <div class="field"><label for="router-ip-input">Adresse IP</label><input id="router-ip-input" placeholder="192.168.88.1" required></div>
        <div class="field"><label for="router-port">Port API</label><input id="router-port" type="number" min="1" max="65535" value="8728" required></div>
        <div class="field"><label for="router-user">Utilisateur API</label><input id="router-user" value="admin"></div>
        <div class="field"><label for="router-interface">Interface hotspot</label><input id="router-interface" placeholder="bridge-hotspot"></div>
        <div><button class="btn btn-primary" type="submit">Enregistrer et synchroniser</button></div>
      </form>
    </div>
  </main>
</div>
<script src="../js/guard.js"></script>
<script>
const msg = document.getElementById('router-message');
const show = (text, ok) => { msg.textContent=text; msg.className=ok?'success-banner':'error-banner'; msg.style.display='block'; };
const loadRouter = async () => {
  const r = await fetch('../login_php/router.php'); const d = await r.json();
  document.getElementById('router-status').textContent = d.status === 'connecte' ? 'Connecté' : 'Déconnecté';
  document.getElementById('router-ip').textContent = d.ip || '—';
  document.getElementById('router-version').textContent = d.version || '—';
  document.getElementById('router-ip-input').value = d.ip === '192.168.88.1' && !d.configured ? '' : (d.ip || '');
};
document.getElementById('router-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const r = await fetch('../login_php/router.php', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
    router_ip: document.getElementById('router-ip-input').value.trim(),
    router_port: document.getElementById('router-port').value,
    router_user: document.getElementById('router-user').value.trim(),
    router_interface: document.getElementById('router-interface').value.trim()
  })});
  const d = await r.json().catch(()=>({})); show(d.message || d.error || 'Erreur', r.ok); if(r.ok) loadRouter();
});
document.getElementById('btn-refresh').addEventListener('click', loadRouter);
loadRouter();
</script>
</body>
</html>
