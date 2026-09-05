<?php require_once __DIR__ . '/../login_php/_commun.php'; require_permission('profile'); ?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Paramètres — Hotspot Diego</title>
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
      <a href="parametre.php" class="active">
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
        <h1>Paramètres</h1>
        <div class="subtitle">Gestion du compte administrateur</div>
      </div>
    </div>

    <div class="tabs">
      <button type="button" class="tab active" data-tab="profil">Profil</button>
      <button type="button" class="tab" data-tab="securite">Sécurité</button>
      <button type="button" class="tab" data-tab="general">Hotspot</button>
      <button type="button" class="tab" data-tab="apparence">Apparence</button>
    </div>

    <div id="tab-profil" class="tab-panel active">
      <div class="card card-large">
        <h3 style="margin-bottom:6px;">Profil</h3>
        <p class="hint" style="margin-top:0;">Gérez votre photo et votre nom d'affichage dans le back-office.</p>
        <div class="profile-meta-grid">
          <div><span class="hint">Rôle</span><strong id="profile-role">—</strong></div>
          <div><span class="hint">Statut</span><strong id="profile-status">—</strong></div>
          <div><span class="hint">Créé le</span><strong id="profile-created">—</strong></div>
          <div><span class="hint">Dernière connexion</span><strong id="profile-last-login">—</strong></div>
        </div>

        <div id="message-nom" class="error-banner" style="display:none;"></div>

        <div class="admin-profile-photo">
          <div class="admin-photo-preview">
            <span id="photo-placeholder" class="generic-avatar" aria-label="Avatar générique"></span>
            <img id="photo-preview" alt="Photo de profil" style="display:none;">
          </div>
          <div class="admin-photo-controls">
            <strong>Photo de profil</strong>
            <span class="hint">JPG, PNG, WebP ou GIF · 2 Mo maximum</span>
            <input type="file" id="photo-input" accept="image/jpeg,image/png,image/webp,image/gif" hidden>
            <div class="photo-actions">
              <button type="button" class="btn btn-outline" id="btn-choose-photo">Choisir une photo</button>
              <button type="button" class="btn btn-primary" id="btn-upload-photo" style="display:none;">Enregistrer</button>
              <button type="button" class="btn btn-outline" id="btn-remove-photo" style="display:none;">Retirer</button>
            </div>
            <div id="message-photo" class="photo-message" style="display:none;"></div>
          </div>
        </div>

        <div id="tab-general" class="tab-panel">
          <div class="card card-large">
            <h3>Paramètres du hotspot</h3>
            <p class="hint">Ces informations sont enregistrées dans la base et peuvent être utilisées par le portail captif.</p>
            <div id="message-general" class="error-banner" style="display:none;"></div>
            <form id="form-general">
              <div class="form-grid form-grid-2">
                <div class="field"><label for="hotspot-nom">Nom du hotspot</label><input id="hotspot-nom" maxlength="50" required></div>
                <div class="field"><label for="systeme-langue">Langue</label><select id="systeme-langue"><option value="fr">Français</option><option value="en">English</option><option value="mg">Malagasy</option></select></div>
                <div class="field"><label for="hotspot-description">Description</label><input id="hotspot-description" maxlength="255"></div>
                <div class="field"><label for="hotspot-message">Message d'accueil</label><input id="hotspot-message" maxlength="255"></div>
                <div class="field"><label for="contact-email">Email de contact</label><input type="email" id="contact-email"></div>
                <div class="field"><label for="contact-telephone">Téléphone de contact</label><input id="contact-telephone" maxlength="30"></div>
                <div class="field"><label for="contact-adresse">Adresse</label><input id="contact-adresse" maxlength="255"></div>
                <div class="field"><label for="site-web">Site web</label><input type="url" id="site-web" placeholder="https://"></div>
              </div>
              <button type="submit" class="btn btn-primary">Enregistrer les paramètres</button>
            </form>
          </div>
        </div>

        <form id="form-nom">
          <div class="form-grid form-grid-2">
            <div class="field admin-name-field">
              <label for="nom-admin">Nom de l'administrateur</label>
              <input type="text" id="nom-admin" required minlength="3">
            </div>
            <div class="field">
              <label for="email-admin">E-mail</label>
              <input type="email" id="email-admin" autocomplete="email" placeholder="admin@exemple.com">
            </div>
            <div class="field admin-phone-field">
              <label for="telephone-admin">Téléphone</label>
              <input type="tel" id="telephone-admin" autocomplete="tel" inputmode="numeric" maxlength="13" placeholder="032 45 678 12">
            </div>
          </div>
          <p class="hint">Sécurité : utilisez au moins 8 caractères, avec une majuscule, un chiffre et un caractère spécial.</p>
          <button type="submit" class="btn btn-primary">Enregistrer le profil</button>
        </form>
      </div>
    </div>

    <div id="tab-securite" class="tab-panel">
      <div class="card card-large">
        <h3 style="margin-bottom:6px;">Sécurité</h3>
        <p class="hint" style="margin-top:0;">Modifiez le mot de passe de connexion au back-office.</p>

        <div id="message" class="error-banner" style="display:none;"></div>

        <form id="form-password">
          <div class="form-grid">
            <div class="field">
              <label for="username">Identifiant admin</label>
              <input type="text" id="username" autocomplete="username" required>
            </div>
            <div class="field">
              <label for="current">Mot de passe actuel</label>
              <input type="password" id="current" autocomplete="current-password" required>
            </div>
            <div class="field">
              <label for="new">Nouveau mot de passe</label>
              <input type="password" id="new" autocomplete="new-password" required minlength="6">
            </div>
            <div class="field">
              <label for="confirm">Confirmer</label>
              <input type="password" id="confirm" autocomplete="new-password" required minlength="6">
            </div>
          </div>
          <button type="submit" class="btn btn-primary">Enregistrer</button>
        </form>
      </div>
    </div>

    <div id="tab-apparence" class="tab-panel">
      <div class="card card-large theme-settings-card">
        <h3 style="margin-bottom:6px;">Apparence</h3>
        <p class="hint" style="margin-top:0;">Choisissez le thème de l'interface. Votre choix est conservé automatiquement.</p>
        <button type="button" id="dark-mode-btn" class="dark-mode-btn" aria-label="Passer en mode sombre">
          <span class="theme-mode-orb" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg></span>
          <svg id="dark-mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"></svg>
          <span id="dark-mode-label">Mode sombre</span>
        </button>
      </div>
    </div>

  </main>
</div>

<script src="../js/guard.js"></script>
<script src="../js/parametre.js"></script>
</body>
</html>
