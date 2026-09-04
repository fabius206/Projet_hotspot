<?php
require_once __DIR__ . '/_commun.php';
security_headers();
header('Content-Type: application/json');
require_admin();

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$username = isset($input['username']) ? trim($input['username']) : '';
$currentPassword = $input['current_password'] ?? '';
$newPassword = $input['new_password'] ?? '';

if ($username === '' || $currentPassword === '' || $newPassword === '') {
  http_response_code(400);
  echo json_encode(['error' => 'Tous les champs sont requis']);
  exit;
}
if (strlen($newPassword) < 6) {
  http_response_code(400);
  echo json_encode(['error' => 'Le nouveau mot de passe doit contenir au moins 6 caracteres']);
  exit;
}

// L'admin ne peut modifier que SON propre mot de passe
$adminId = (int)($_SESSION['admin_id'] ?? $_SESSION['user_id'] ?? 0);
$sessionUsername = $_SESSION['username'] ?? $_SESSION['admin_username'] ?? '';

if ($username !== $sessionUsername) {
  http_response_code(403);
  echo json_encode(['error' => 'Vous ne pouvez modifier que votre propre mot de passe']);
  exit;
}

$db = db();
$stmt = $db->prepare('SELECT id, password FROM admins WHERE id = ?');
$stmt->execute([$adminId]);
$admin = $stmt->fetch();

if (!$admin || !password_verify($currentPassword, $admin['password'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Mot de passe actuel incorrect']);
  exit;
}

if (password_verify($newPassword, $admin['password'])) {
  http_response_code(400);
  echo json_encode(['error' => "Le nouveau mot de passe doit etre different de l'ancien"]);
  exit;
}

$update = $db->prepare('UPDATE admins SET password = ? WHERE id = ?');
$update->execute([password_hash($newPassword, PASSWORD_DEFAULT), $adminId]);

echo json_encode(['success' => true, 'message' => 'Mot de passe mis a jour avec succes']);
