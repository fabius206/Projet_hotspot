<?php
require_once __DIR__ . '/../config.php';

// ===== CONFIGURATION SESSION SÉCURISÉE =====
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? '') == 443);

ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');
if ($isHttps) {
  ini_set('session.cookie_secure', '1');
}
ini_set('session.gc_maxlifetime', (string)(SESSION_IDLE_MAX + 60));
ini_set('session.cookie_lifetime', (string)SESSION_COOKIE_LIFETIME); // 0 = expire à fermeture navigateur/onglet

if (session_status() === PHP_SESSION_NONE) {
  session_set_cookie_params([
    'lifetime' => SESSION_COOKIE_LIFETIME,
    'path'     => '/',
    'domain'   => '',
    'secure'   => $isHttps,
    'httponly' => true,
    'samesite' => 'Lax',
  ]);
  session_start();
}

// ===== HEADERS DE SÉCURITÉ (API) =====
function security_headers() {
  header('X-Content-Type-Options: nosniff');
  header('X-Frame-Options: DENY');
  header('Referrer-Policy: strict-origin-when-cross-origin');
  header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
  // Ne pas mettre HSTS en localhost, seulement en HTTPS prod
  if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
  }
  header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
  header('Pragma: no-cache');
}

// ===== TIMEOUT IDLE CÔTÉ SERVEUR (30 min) =====
if (!empty($_SESSION['user_id']) || !empty($_SESSION['admin_id'])) {
  $lastActivity = $_SESSION['last_activity'] ?? 0;
  if ($lastActivity && (time() - $lastActivity > SESSION_IDLE_MAX)) {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
      $p = session_get_cookie_params();
      setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    // Si requête JSON, répondre 401 ; sinon laisser le caller gérer
    if (strpos($_SERVER['REQUEST_URI'] ?? '', '/login_php/') !== false) {
      $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
      // check_session / stats etc. retourneront 401 via require_admin
    }
  } else {
    $_SESSION['last_activity'] = time();
  }
}

// ===== CSRF =====
function csrf_token() {
  if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
  }
  return $_SESSION['csrf_token'];
}

function verify_csrf() {
  // Vérifie header X-CSRF-Token OU champ _csrf
  $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
  if ($sent === '' && isset($_POST['_csrf'])) $sent = $_POST['_csrf'];
  if ($sent === '') {
    // Essayer JSON body
    $raw = file_get_contents('php://input');
    if ($raw) {
      $j = json_decode($raw, true);
      if (isset($j['_csrf'])) $sent = $j['_csrf'];
      // On ne consomme pas le body — le caller le relira
    }
  }
  $expected = $_SESSION['csrf_token'] ?? '';
  if ($expected === '' || $sent === '' || !hash_equals($expected, $sent)) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Jeton CSRF invalide. Actualisez la page.']);
    exit;
  }
}

// ===== RATE LIMIT PAR IP (table MySQL, fallback mémoire session) =====
function rate_limit_check($maxAttempts = 5, $windowSec = 300) {
  $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
  $key = 'rl_' . md5($ip);

  // Tente via MySQL si table existe, sinon session
  try {
    $pdo = db();
    // Crée la table si absente
    $pdo->exec("CREATE TABLE IF NOT EXISTS login_attempts (
      ip varchar(45) NOT NULL PRIMARY KEY,
      attempts int NOT NULL DEFAULT 0,
      last_attempt int NOT NULL,
      blocked_until int DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $stmt = $pdo->prepare('SELECT attempts, last_attempt, blocked_until FROM login_attempts WHERE ip = ?');
    $stmt->execute([$ip]);
    $row = $stmt->fetch();

    if ($row) {
      // Si bloqué
      if (!empty($row['blocked_until']) && time() < (int)$row['blocked_until']) {
        $wait = (int)$row['blocked_until'] - time();
        return ['blocked' => true, 'wait' => $wait, 'remaining' => 0];
      }
      // Fenêtre expirée → reset
      if (time() - (int)$row['last_attempt'] > $windowSec) {
        $pdo->prepare('UPDATE login_attempts SET attempts = 0, blocked_until = NULL WHERE ip = ?')->execute([$ip]);
        return ['blocked' => false, 'remaining' => $maxAttempts];
      }
      if ((int)$row['attempts'] >= $maxAttempts) {
        return ['blocked' => true, 'wait' => $windowSec - (time() - (int)$row['last_attempt']), 'remaining' => 0];
      }
      return ['blocked' => false, 'remaining' => $maxAttempts - (int)$row['attempts']];
    }
    return ['blocked' => false, 'remaining' => $maxAttempts];
  } catch (Throwable $e) {
    // Fallback session
    if (!isset($_SESSION['login_attempts'])) $_SESSION['login_attempts'] = ['count' => 0, 'time' => 0];
    $c = $_SESSION['login_attempts']['count'];
    $t = $_SESSION['login_attempts']['time'];
    if ($c >= $maxAttempts && (time() - $t) < $windowSec) {
      return ['blocked' => true, 'wait' => $windowSec - (time() - $t), 'remaining' => 0];
    }
    if ((time() - $t) > $windowSec) {
      $_SESSION['login_attempts'] = ['count' => 0, 'time' => 0];
      return ['blocked' => false, 'remaining' => $maxAttempts];
    }
    return ['blocked' => false, 'remaining' => $maxAttempts - $c];
  }
}

function rate_limit_hit($maxAttempts = 5, $windowSec = 300) {
  $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
  try {
    $pdo = db();
    $pdo->exec("CREATE TABLE IF NOT EXISTS login_attempts (
      ip varchar(45) NOT NULL PRIMARY KEY,
      attempts int NOT NULL DEFAULT 0,
      last_attempt int NOT NULL,
      blocked_until int DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $stmt = $pdo->prepare('SELECT attempts FROM login_attempts WHERE ip = ?');
    $stmt->execute([$ip]);
    $row = $stmt->fetch();
    $now = time();
    if ($row) {
      $newAttempts = (int)$row['attempts'] + 1;
      $blockedUntil = null;
      if ($newAttempts >= $maxAttempts) $blockedUntil = $now + $windowSec;
      $pdo->prepare('UPDATE login_attempts SET attempts = ?, last_attempt = ?, blocked_until = ? WHERE ip = ?')
          ->execute([$newAttempts, $now, $blockedUntil, $ip]);
    } else {
      $pdo->prepare('INSERT INTO login_attempts (ip, attempts, last_attempt) VALUES (?, 1, ?)')
          ->execute([$ip, $now]);
    }
  } catch (Throwable $e) {
    if (!isset($_SESSION['login_attempts'])) $_SESSION['login_attempts'] = ['count' => 0, 'time' => 0];
    $_SESSION['login_attempts']['count']++;
    $_SESSION['login_attempts']['time'] = time();
  }
}

function rate_limit_reset() {
  $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
  try {
    db()->prepare('DELETE FROM login_attempts WHERE ip = ?')->execute([$ip]);
  } catch (Throwable $e) {}
  $_SESSION['login_attempts'] = ['count' => 0, 'time' => 0];
}

// ===== AUTH HELPERS =====
function require_admin() {
  if (empty($_SESSION['admin_id']) && empty($_SESSION['user_id'])) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Session expirée ou absente']);
    exit;
  }
  if (!empty($_SESSION['user_id']) && empty($_SESSION['admin_id']) && ($_SESSION['user_type'] ?? '') === 'admin') {
    $_SESSION['admin_id'] = $_SESSION['user_id'];
  }
  // Vérifier idle côté serveur
  if (!empty($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > SESSION_IDLE_MAX)) {
    $_SESSION = [];
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Session expirée par inactivité']);
    exit;
  }
  $_SESSION['last_activity'] = time();
}

function ensure_admin_schema() {
  static $ready = false;
  if ($ready) return;
  $db = db();
  $columns = [
    "ALTER TABLE admins ADD COLUMN IF NOT EXISTS statut VARCHAR(20) NOT NULL DEFAULT 'actif'",
    "ALTER TABLE admins ADD COLUMN IF NOT EXISTS derniere_connexion DATETIME NULL",
    "ALTER TABLE admins ADD COLUMN IF NOT EXISTS permissions TEXT NULL",
  ];
  foreach ($columns as $sql) {
    try { $db->exec($sql); } catch (Throwable $e) { /* compatible avec les schémas existants */ }
  }
  try {
    $db->exec("CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      admin_id INT NULL,
      action VARCHAR(120) NOT NULL,
      cible VARCHAR(120) NULL,
      details TEXT NULL,
      ip_address VARCHAR(45) NULL,
      resultat VARCHAR(20) NOT NULL DEFAULT 'success',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_created (created_at),
      INDEX idx_audit_admin (admin_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  } catch (Throwable $e) {}
  try {
    $db->exec("CREATE TABLE IF NOT EXISTS app_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value TEXT NULL,
      category VARCHAR(40) NOT NULL DEFAULT 'general',
      updated_by INT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  } catch (Throwable $e) {}
  $ready = true;
}

function audit_log($action, $cible = null, $details = null, $resultat = 'success') {
  ensure_admin_schema();
  try {
    db()->prepare('INSERT INTO audit_logs (admin_id, action, cible, details, ip_address, resultat) VALUES (?, ?, ?, ?, ?, ?)')
      ->execute([(int)($_SESSION['admin_id'] ?? $_SESSION['user_id'] ?? 0) ?: null, $action, $cible, $details, $_SERVER['REMOTE_ADDR'] ?? null, $resultat]);
  } catch (Throwable $e) {}
}

function require_permission($permission) {
  require_admin();
  ensure_admin_schema();
  $role = $_SESSION['role'] ?? '';
  if ($role === 'super_admin') return;
  $adminId = (int)($_SESSION['admin_id'] ?? $_SESSION['user_id'] ?? 0);
  if ($adminId > 0) {
    $stmt = db()->prepare('SELECT permissions FROM admins WHERE id = ?');
    $stmt->execute([$adminId]);
    $custom = json_decode((string)$stmt->fetchColumn(), true);
    if (is_array($custom) && array_key_exists($permission, $custom)) {
      if ($custom[$permission] === true) return;
      http_response_code(403);
      header('Content-Type: application/json');
      echo json_encode(['error' => 'Accès refusé pour cette permission']);
      exit;
    }

    function valid_password($password) {
      return is_string($password)
        && strlen($password) >= 8
        && preg_match('/[A-Z]/', $password)
        && preg_match('/[a-z]/', $password)
        && preg_match('/\d/', $password)
        && preg_match('/[^A-Za-z0-9]/', $password);
    }
  }
  $defaults = [
    'dashboard' => ['admin', 'operateur'],
    'clients' => ['admin', 'operateur'],
    'vouchers' => ['admin', 'operateur'],
    'sessions' => ['admin', 'operateur'],
    'stats' => ['admin', 'operateur'],
    'routeur' => ['admin'],
    'admins' => [],
    'settings' => ['admin'],
    'profile' => ['admin', 'operateur'],
  ];
  if (!in_array($role, $defaults[$permission] ?? [], true)) {
    audit_log('access.denied', $permission, 'Permission insuffisante', 'failure');
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Accès refusé pour votre rôle']);
    exit;
  }
}

function require_role($roles = []) {
  require_admin();
  $role = $_SESSION['role'] ?? '';
  if (!empty($roles) && !in_array($role, (array)$roles, true)) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Accès refusé pour votre rôle']);
    exit;
  }
}

function db() {
  static $pdo = null;
  if ($pdo === null) {
    $pdo = new PDO(
      'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
      DB_USER,
      DB_PASS,
      [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      ]
    );
  }
  return $pdo;
}
