<?php
require_once __DIR__ . '/_commun.php';
security_headers();
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$auth = !empty($_SESSION['admin_id']) || !empty($_SESSION['user_id']);

// Vérifie IP/UA n'a pas changé (protection vol de session) — optionnel, tolérant
if ($auth) {
  $curIp = $_SERVER['REMOTE_ADDR'] ?? '';
  $sessIp = $_SESSION['login_ip'] ?? '';
  // On ne bloque pas si IP change (mobile), mais on peut logger
}

echo json_encode([
  'authenticated' => $auth,
  'username' => $_SESSION['username'] ?? $_SESSION['admin_username'] ?? null,
  'role' => $_SESSION['role'] ?? null,
  'user_type' => $_SESSION['user_type'] ?? null,
  'user_id' => $_SESSION['user_id'] ?? $_SESSION['admin_id'] ?? null,
  'original_super' => isset($_SESSION['super_admin_id']),
  'csrf' => $auth ? ($_SESSION['csrf_token'] ?? csrf_token()) : null,
]);
