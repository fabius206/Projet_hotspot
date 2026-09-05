<?php require_once __DIR__ . '/../login_php/_commun.php'; require_permission('dashboard'); ?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tableau de bord — Hotspot Diego</title>
<script src="../js/theme-preload.js"></script><link rel="stylesheet" href="dashboard.css">
</head>
<body>

<div class="tout">
  <aside class="deuxieme">
    <div class="title">Hotspot<span style="color:var(--coral)">Diego</span>
      <small>Affichage</small>
    </div>
    <nav>
<a href="dash.php" class="active">
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
        <h1>Tableau de bord</h1>
        <div class="subtitle">Ensemble de l'activité hotspot — Diégo-Suarez</div>
      </div>
      
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="label">Vouchers non utilisés</div>
        <div class="value" id="stat-non-utilise">—</div>
      </div>
      <div class="stat-card accent">
        <div class="label">Sessions actives</div>
        <div class="value" id="stat-actif">—</div>
      </div>
      <div class="stat-card">
        <div class="label">Vouchers expirés</div>
        <div class="value" id="stat-expire">—</div>
      </div>
      <div class="stat-card">
        <div class="label">Total généré</div>
        <div class="value" id="stat-total">—</div>
      </div>
      <div class="stat-card accent">
        <div class="label">Revenus du jour</div>
        <div class="value" id="stat-revenus-jour">—</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:28px;">
      <h3 style="margin-bottom:14px;">Statistiques</h3>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:24px;align-items:center;">
        <div style="position:relative;height:260px;"><canvas id="chart-semaine"></canvas></div>
        <div style="position:relative;height:240px;"><canvas id="chart-statuts"></canvas></div>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-bottom:14px;">Détails des routeurs</h3>
      <table>
        <thead>
          <tr><th>Nom</th><th>Adresse IP</th><th>Site</th><th>Statut</th><th></th></tr>
        </thead>
      </table>
    </div>

      <!-- Statistiques détaillées — anciennement page stats.php -->
      <div class="section-title" style="margin-top:28px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> Statistiques détaillées</div>
      <div class="stat-grid" style="margin-bottom:16px;">
        <div class="stat-card accent"><div class="label">Revenus du jour</div><div class="value" id="stat-revenus-jour">—</div></div>
        <div class="stat-card"><div class="label">Total généré</div><div class="value" id="stat-total">—</div></div>
        <div class="stat-card"><div class="label">Codes actifs</div><div class="value" id="stat-actif-dash">—</div></div>
        <div class="stat-card"><div class="label">Codes non utilisés</div><div class="value" id="stat-non-utilise-dash">—</div></div>
      </div>
      <div class="dash-charts">
        <div class="card">
          <h3 style="margin-bottom:14px; display:flex; align-items:center; gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="color:var(--lagoon)"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> Revenus des 7 derniers jours</h3>
          <div style="position:relative;height:260px;"><canvas id="chart-semaine"></canvas></div>
        </div>
        <div class="card">
          <h3 style="margin-bottom:14px; display:flex; align-items:center; gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="color:var(--coral)"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-8a2 2 0 0 0-2-2h-2"/></svg> Fréquentation (codes/jour)</h3>
          <div style="position:relative;height:260px;"><canvas id="chart-frequentation"></canvas></div>
        </div>
      </div>
      <div class="dash-charts" style="margin-top:16px;">
        <div class="card">
          <h3 style="margin-bottom:14px; display:flex; align-items:center; gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="color:var(--lagoon)"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Usage — codes actifs par jour</h3>
          <div style="position:relative;height:220px;"><canvas id="chart-usage"></canvas></div>
        </div>
        <div class="card">
          <h3 style="margin-bottom:14px; display:flex; align-items:center; gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="color:var(--lagoon)"><circle cx="12" cy="12" r="10"/><path d="M12 2a12 12 0 0 1 12 12"/></svg> Répartition des codes</h3>
          <div style="position:relative;height:220px;max-width:360px;margin:auto;"><canvas id="chart-statuts"></canvas></div>
        </div>
      </div>
      <div class="card" style="margin-top:16px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
          <h3 style="margin:0; display:flex; align-items:center; gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="color:var(--lagoon)"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg> Ventes par offre</h3>
          <span style="font-size:0.75rem; color:var(--ink-soft);">Détail par forfait</span>
        </div>
        <div class="table-responsive"><table id="table-offres"><thead><tr><th>Offre</th><th>Codes vendus</th><th>Total (Ar)</th></tr></thead><tbody></tbody></table></div>
      </div>

  </main>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="../js/guard.js"></script>
<script src="../js/dashboard.js"></script>
<script src="../js/stats.js"></script>
</body>
</html>
