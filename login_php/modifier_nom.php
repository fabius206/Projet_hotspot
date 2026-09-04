<?php
require_once __DIR__ . '/_commun.php';
security_headers();
header('Content-Type: application/json');
require_admin();

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$newUsername = isset($input['new_username']) ? trim($input['new_username']) : '';

if ($newUsername === '') {
  http_response_code(400);
  echo json_encode(['error' => 'Le nouveau nom est requis']);
  exit;
}
if (mb_strlen($newUsername) < 3) {
  http_response_code(400);
  echo json_encode(['error' => 'Le nom doit contenir au moins 3 caracteres']);
  exit;
}
if (mb_strlen($newUsername) > 50) {
  http_response_code(400);
  echo json_encode(['error' => 'Nom trop long (50 max)']);
  exit;
}

// Utilise l'ID de la session — chaque admin ne modifie que son propre nom
$adminId = (int)($_SESSION['admin_id'] ?? $_SESSION['user_id'] ?? 0);
if ($adminId <= 0) {
  http_response_code(401);
  echo json_encode(['error' => 'Session invalide']);
  exit;
}

$db = db();
$check = $db->prepare('SELECT id FROM admins WHERE username = ? AND id != ?');
$check->execute([$newUsername, $adminId]);
if ($check->fetch()) {
  http_response_code(409);
  echo json_encode(['error' => 'Ce nom est deja utilise']);
  exit;
}

$update = $db->prepare('UPDATE admins SET username = ? WHERE id = ?');
$update->execute([$newUsername, $adminId]);

// Met à jour la session
$_SESSION['username'] = $newUsername;
if (isset($_SESSION['admin_username'])) $_SESSION['admin_username'] = $newUsername;

echo json_encode(['success' => true, 'message' => "Nom de l'administrateur mis a jour", 'username' => $newUsername]);
