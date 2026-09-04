<?php
require_once __DIR__ . '/_commun.php';
header('Content-Type: application/json');
require_admin();

$isAdmin = !empty($_SESSION['admin_id']) || !empty($_SESSION['user_id']);
$isSuper = ($_SESSION['role'] ?? '') === 'super_admin';
$isOriginallySuper = isset($_SESSION['super_admin_id']);

if (!$isAdmin) {
  http_response_code(401);
  echo json_encode(['error' => 'Session requise']);
  exit;
}

$db = db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  if (!$isSuper && !$isOriginallySuper) {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
  }
  $rows = $db->query('SELECT id, username, role FROM admins ORDER BY username ASC')->fetchAll();
  $currentId = (int)($_SESSION['admin_id'] ?? $_SESSION['user_id'] ?? 0);
  $superId = $_SESSION['super_admin_id'] ?? $currentId;
  $accounts = [];
  foreach ($rows as $r) {
    $accounts[] = [
      'id' => (int)$r['id'],
      'username' => $r['username'],
      'role' => $r['role'],
      'is_current' => (int)$r['id'] === $currentId,
    ];
  }
  echo json_encode(['accounts' => $accounts, 'current_id' => $currentId, 'super_id' => $superId]);
  exit;
}

if ($method === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true) ?: [];
  $targetId = (int)($input['id'] ?? 0);

  if ($targetId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'ID invalide']);
    exit;
  }

  $currentId = (int)($_SESSION['admin_id'] ?? $_SESSION['user_id'] ?? 0);
  if ($targetId === $currentId) {
    echo json_encode(['success' => true, 'message' => 'Vous êtes déjà sur ce compte']);
    exit;
  }

  $isSuperAdmin = ($_SESSION['role'] ?? '') === 'super_admin';
  $isOriginallySuper = isset($_SESSION['super_admin_id']);
  $canSwitch = $isSuperAdmin || $isOriginallySuper;

  if (!$canSwitch) {
    http_response_code(403);
    echo json_encode(['error' => 'Seul un Super Admin peut changer de compte']);
    exit;
  }

  $target = $db->prepare('SELECT id, username, role FROM admins WHERE id = ?');
  $target->execute([$targetId]);
  $row = $target->fetch();
  if (!$row) {
    http_response_code(404);
    echo json_encode(['error' => 'Compte introuvable']);
    exit;
  }

  if (!isset($_SESSION['super_admin_id'])) {
    $_SESSION['super_admin_id'] = $currentId;
    $_SESSION['super_admin_username'] = $_SESSION['username'] ?? '';
  }

  $_SESSION['admin_id'] = (int)$row['id'];
  $_SESSION['user_id'] = (int)$row['id'];
  $_SESSION['username'] = $row['username'];
  $_SESSION['role'] = $row['role'];
  $_SESSION['user_type'] = 'admin';
  session_regenerate_id(true);

  echo json_encode([
    'success' => true,
    'message' => 'Connecté en tant que ' . $row['username'],
    'user' => [
      'id' => (int)$row['id'],
      'username' => $row['username'],
      'role' => $row['role'],
    ],
  ]);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'Méthode non autorisée']);
