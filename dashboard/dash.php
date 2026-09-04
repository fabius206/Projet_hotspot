<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tableau de bord — Hotspot Diego</title>
<link rel="stylesheet" href="dashboard.css">
</head>
<body>

<div class="tout">
  <aside class="deuxieme">
    <div class="title">Hotspot<span style="color:var(--coral)">Diego</span>
      <small>Affichage</small>
    </div>
    <nav>
      <a href="dash.php" class="active">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Tableau de bord
      </a>
      <a href="#">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Utilisateurs
      </a>
      <a href="codes.php">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
        Codes d'accès
      </a>
      <a href="offres.php">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
        Offres
      </a>
      <a href="parametre.php">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
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
  </main>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="../js/guard.js"></script>
<script src="../js/dashboard.js"></script>
</body>
</html>
