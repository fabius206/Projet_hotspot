<?php
require_once __DIR__ . '/_commun.php';
security_headers();

// Détruit proprement la session + cookie
$logoutAdminId = $_SESSION['admin_id'] ?? $_SESSION['user_id'] ?? null;
if ($logoutAdminId) audit_log('auth.logout', (string)$logoutAdminId);
$_SESSION = [];
if (ini_get('session.use_cookies')) {
  $params = session_get_cookie_params();
  setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
}
session_destroy();

// Répond JSON si appel fetch, sinon redirige
$accept = $_SERVER['HTTP_ACCEPT'] ?? '';
$isJson = (strpos($accept, 'application/json') !== false) || (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'fetch');
if ($isJson || ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  header('Content-Type: application/json');
  echo json_encode(['success' => true]);
  exit;
}
header('Location: ../index.php');
exit;
