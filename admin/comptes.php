<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Comptes — Hotspot Diego</title>
<link rel="stylesheet" href="dashboard.css?v=9">
</head>
<body>
<div class="tout">
  <aside class="deuxieme"><div class="title">Hotspot<span style="color:var(--coral)">Diego</span><small>Affichage</small></div>
  <nav>
<a href="dash.php">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Tableau de bord
      </a>
      <a href="clients.php">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Clients
      </a>
      <a href="codes.php" data-role="admin">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
        Codes d'accès
      </a>
      <a href="sessions.php" data-role="admin">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        Sessions
      </a>
      <a href="offres.php" data-role="admin">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
        Offres
      </a>
      <a href="comptes.php" class="active" data-role="admin">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        Comptes
      </a>
      <a href="parametre.php">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
        Paramètre
      </a>
      <a href="../login_php/logout.php">Déconnexion</a>
    </nav></aside>
  <main class="main">
    <div class="topbar"><div><h1>Comptes administrateurs</h1></div><div class="topbar-actions"><button id="theme-toggle" class="theme-toggle" type="button" aria-label="Passer en mode sombre">
      <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>
      <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
    </button></div></div>
    <div class="stat-grid" style="grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:16px;">
      <div class="stat-card"><div class="label">Admins totaux</div><div class="value" id="counter-admins">—</div></div>
      <div class="stat-card accent"><div class="label">Super Admins</div><div class="value" id="counter-super">—</div></div>
    </div>
    <div id="toast-container" class="toast-container" style="display:none;"><span id="toast-text"></span></div>
    <div class="card" style="margin-bottom:16px;">
      <h3 id="titre-form">Créer un compte</h3>
      <form id="form-compte"><input type="hidden" id="edit-id">
        <div style="display:grid;grid-template-columns:1.2fr 1fr 0.9fr;gap:12px;">
          <div class="field"><label>Identifiant *</label><input type="text" id="c-username" required placeholder="james"></div>
          <div class="field"><label>Mot de passe *</label><input type="password" id="c-password" placeholder="••••••••"></div>
          <div class="field"><label>Rôle</label><select id="c-role"><option value="admin">Admin</option><option value="super_admin">Super Admin</option></select></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;"><button type="submit" class="btn btn-primary" id="btn-submit">Créer le compte</button><button type="button" class="btn btn-outline" id="btn-cancel" style="display:none">Annuler</button></div>
      </form>
    </div>
    <div class="card"><div class="table-responsive"><table id="table-comptes"><thead><tr><th>Identifiant</th><th>Rôle</th><th>Créé le</th><th>Actions</th></tr></thead><tbody></tbody></table></div></div>
  </main>
</div>
<script src="../js/guard.js"></script>
<script src="../js/comptes.js"></script>
</body>
</html>