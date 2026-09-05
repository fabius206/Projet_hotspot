<?php
require_once __DIR__ . '/_commun.php';
security_headers();
header('Content-Type: application/json');

// N'accepte que POST
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  http_response_code(405);
  header('Allow: POST');
  echo json_encode(['error' => 'Méthode non autorisée']);
  exit;
}

// Vérifie Content-Type JSON (optionnel mais recommandé)
$contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
// On tolère l'absence pour compatibilité, mais on lit en JSON

// Rate limit par IP (5 tentatives / 5 min)
$rl = rate_limit_check(5, 300);
if ($rl['blocked']) {
  http_response_code(429);
  $waitMin = (int)ceil($rl['wait'] / 60);
  echo json_encode(['error' => "Trop de tentatives. Réessayez dans $waitMin minute(s)."]);
  exit;
}

// Lecture entrée avec limites
$raw = file_get_contents('php://input');
if (strlen($raw) > 2048) {
  http_response_code(413);
  echo json_encode(['error' => 'Requête trop volumineuse']);
  exit;
}
$input = json_decode($raw, true);
if (!is_array($input)) $input = [];

$username = isset($input['username']) ? trim((string)$input['username']) : '';
$password = isset($input['password']) ? (string)$input['password'] : '';
$remember = !empty($input['remember']);

// Validation stricte
if ($username === '' || $password === '') {
  http_response_code(400);
  echo json_encode(['error' => 'Identifiant et mot de passe requis']);
  exit;
}
if (mb_strlen($username) > 255 || mb_strlen($password) > 255) {
  http_response_code(400);
  echo json_encode(['error' => 'Identifiant ou mot de passe trop long']);
  exit;
}
if (mb_strlen($username) < 2 || mb_strlen($password) < 2) {
  http_response_code(400);
  echo json_encode(['error' => 'Identifiant ou mot de passe trop court']);
  exit;
}

// Hash factice pour anti-timing (même durée que password_verify)
$dummyHash = '$2y$10$usesomesillystringfore7hnbQJ5vQvzQvQvzQvQvzQvQvzQvQvzQ';

// 1) Cherche dans admins
ensure_admin_schema();
$stmt = db()->prepare('SELECT id, username, password, role, statut FROM admins WHERE username = ? LIMIT 1');
$stmt->execute([$username]);
$admin = $stmt->fetch();

// 2) Cherche dans utilisateurs
$stmt2 = db()->prepare('SELECT id, username, password, nom, statut FROM utilisateurs WHERE username = ? OR email = ? OR telephone = ? LIMIT 1');
$stmt2->execute([$username, $username, $username]);
$user = $stmt2->fetch();

// Détermine le candidat et vérifie
$ok = false;
$account = null;
$accountType = null;

if ($admin) {
  $ok = password_verify($password, $admin['password']);
  // Toujours vérifier l'autre aussi pour temps constant (évite de révéler dans quelle table est le user)
  password_verify($password, $user ? $user['password'] : $dummyHash);
  if ($ok) { $account = $admin; $accountType = 'admin'; }
} elseif ($user) {
  $ok = password_verify($password, $user['password']);
  password_verify($password, $dummyHash); // temps constant
  if ($ok) { $account = $user; $accountType = 'utilisateur'; }
} else {
  // Aucun trouvé → on fait quand même un verify pour temps constant
  password_verify($password, $dummyHash);
  $ok = false;
}

if ($ok && $account) {
  if ($accountType === 'admin' && ($account['statut'] ?? 'actif') !== 'actif') {
    rate_limit_hit(5, 300);
    audit_log('auth.login', (string)$account['id'], 'Compte administrateur inactif', 'failure');
    http_response_code(403);
    echo json_encode(['error' => 'Ce compte administrateur est inactif.']);
    exit;
  }
  // Vérifie statut suspendu (utilisateurs seulement)
  if ($accountType === 'utilisateur' && ($account['statut'] ?? 'actif') === 'suspendu') {
    rate_limit_hit(5, 300);
    http_response_code(403);
    echo json_encode(['error' => 'Votre compte est suspendu. Contactez un administrateur.']);
    exit;
  }

  // Rehash si algo obsolète
  if (password_needs_rehash($account['password'], PASSWORD_DEFAULT)) {
    $newHash = password_hash($password, PASSWORD_DEFAULT);
    try {
      if ($accountType === 'admin') {
        db()->prepare('UPDATE admins SET password = ? WHERE id = ?')->execute([$newHash, $account['id']]);
      } else {
        db()->prepare('UPDATE utilisateurs SET password = ? WHERE id = ?')->execute([$newHash, $account['id']]);
      }
    } catch (Throwable $e) {}
  }

  // Succès : reset rate limit + régénère session
  rate_limit_reset();
  session_regenerate_id(true);
  $_SESSION['user_id'] = (int)$account['id'];
  $_SESSION['username'] = $account['username'];
  $_SESSION['last_activity'] = time();
  $_SESSION['login_ip'] = $_SERVER['REMOTE_ADDR'] ?? '';
  $_SESSION['login_ua'] = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);

  if ($accountType === 'admin') {
    db()->prepare('UPDATE admins SET derniere_connexion = NOW() WHERE id = ?')->execute([$account['id']]);
    audit_log('auth.login', (string)$account['id'], 'Connexion réussie');
    $_SESSION['role'] = $account['role'];
    $_SESSION['user_type'] = 'admin';
    $_SESSION['admin_id'] = (int)$account['id'];
    $_SESSION['admin_username'] = $account['username'];
  } else {
    $_SESSION['role'] = 'utilisateur';
    $_SESSION['user_type'] = 'utilisateur';
    // Met à jour dernière connexion
    try {
      db()->prepare('UPDATE utilisateurs SET derniere_connexion = NOW(), nb_connexions = nb_connexions + 1 WHERE id = ?')->execute([$account['id']]);
    } catch (Throwable $e) {}
  }

  // Génère CSRF token pour la session
  csrf_token();

  // Remember-me : prolonge le cookie de session (pas de token persistant)
  if ($remember) {
    $params = session_get_cookie_params();
    setcookie(session_name(), session_id(), time() + 30*24*3600, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
  }

  // Réponse minimale (ne jamais renvoyer le hash)
  if ($accountType === 'admin') {
    echo json_encode([
      'success' => true,
      'role' => $account['role'],
      'user_type' => 'admin',
      'redirect' => 'admin/dash.php',
      'csrf' => $_SESSION['csrf_token'],
      'user' => ['id' => (int)$account['id'], 'username' => $account['username'], 'role' => $account['role']],
    ]);
  } else {
    echo json_encode([
      'success' => true,
      'role' => 'utilisateur',
      'user_type' => 'utilisateur',
      'redirect' => 'admin/dash.php',
      'csrf' => $_SESSION['csrf_token'],
      'user' => ['id' => (int)$account['id'], 'username' => $account['username'], 'nom' => $account['nom']],
    ]);
  }
  exit;
}

// Échec : incrémente rate limit + message générique (ne révèle pas si le compte existe)
rate_limit_hit(5, 300);
$rl2 = rate_limit_check(5, 300);
http_response_code(401);
if ($rl2['blocked']) {
  echo json_encode(['error' => 'Trop de tentatives. Réessayez dans quelques minutes.']);
} else {
  echo json_encode(['error' => 'Identifiant ou mot de passe incorrect.']);
}
