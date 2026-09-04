<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Codes d'accès — Hotspot Diego</title>
<script src="../js/theme-preload.js"></script><link rel="stylesheet" href="dashboard.css">
</head>
<body>

<div class="tout">
  <aside class="deuxieme">
    <div class="title">Hotspot<span style="color:var(--coral)">Diego</span>
      <small>Affichage</small>
    </div>
    <nav>
<a href="dash.php">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Tableau de bord
      </a>
      <a href="clients.php">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Clients
      </a>
      <a href="codes.php" class="active" data-role="admin">
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
      <a href="comptes.php" data-role="admin">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        Comptes
      </a>
      <a href="parametre.php">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
        Paramètre
      </a>
      <a href="../login_php/logout.php">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Déconnexion
      </a>
    </nav>
  </aside>

  <main class="main">

    <div class="topbar">
      <div>
        <h1>Codes d'accès</h1>
        <div class="subtitle">Générer et gérer les vouchers WiFi</div>
      </div>
      <a class="btn btn-outline" href="../login_php/vouchers.php?export=csv">Exporter en CSV</a>
    </div>

    <div id="message" class="error-banner" style="display:none;"></div>

    <div class="card" style="margin-bottom:16px;">
      <form id="form-generer" class="toolbar" style="margin-bottom:0;">
        <strong>Générer des codes</strong>
        <select id="plan-select" required></select>
        <input type="number" id="quantite" min="1" max="200" value="10" required title="Quantité">
        <button type="submit" class="btn btn-primary">Générer</button>
      </form>
      <div id="codes-genere" style="margin-top:14px;display:flex;flex-wrap:wrap;gap:8px;"></div>
    </div>

    <div class="card">
      <form id="form-filtres" class="toolbar">
        <input type="text" id="recherche" placeholder="Rechercher un code..." style="max-width:240px;">
        <select id="filtre-statut" style="max-width:180px;">
          <option value="">Tous les statuts</option>
          <option value="non_utilise">Non utilisés</option>
          <option value="actif">Actifs</option>
          <option value="expire">Expirés</option>
          <option value="desactive">Désactivés</option>
        </select>
        <button type="submit" class="btn btn-outline">Filtrer</button>
      </form>

      <table id="table-codes">
        <thead>
          <tr><th>Code</th><th>Offre</th><th>Prix</th><th>Statut</th><th>Créé le</th><th>Utilisé le</th><th>Expire le</th><th>Actions</th></tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>

  </main>
</div>

<script src="../js/guard.js"></script>
<script src="../js/codes.js"></script>
</body>
</html>
