<?php
require_once __DIR__ . '/_commun.php';
security_headers();
header('Content-Type: application/json');
require_admin();

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$newUsername = isset($input['new_username']) ? trim($input['new_username']) : '';
$email = trim((string)($input['email'] ?? ''));
$telephone = trim((string)($input['telephone'] ?? ''));

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
$db->exec("ALTER TABLE admins ADD COLUMN IF NOT EXISTS telephone VARCHAR(30) NULL");
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['error' => 'Adresse e-mail invalide']);
  exit;
}
if (mb_strlen($email) > 190 || mb_strlen($telephone) > 30) {
  http_response_code(400);
  echo json_encode(['error' => 'E-mail ou téléphone trop long']);
  exit;
}
$check = $db->prepare('SELECT id FROM admins WHERE username = ? AND id != ?');
$check->execute([$newUsername, $adminId]);
if ($check->fetch()) {
  http_response_code(409);
  echo json_encode(['error' => 'Ce nom est deja utilise']);
  exit;
}

$update = $db->prepare('UPDATE admins SET username = ?, email = ?, telephone = ? WHERE id = ?');
$update->execute([$newUsername, $email !== '' ? $email : null, $telephone !== '' ? $telephone : null, $adminId]);

// Met à jour la session
$_SESSION['username'] = $newUsername;
if (isset($_SESSION['admin_username'])) $_SESSION['admin_username'] = $newUsername;

echo json_encode(['success' => true, 'message' => "Profil administrateur mis à jour", 'username' => $newUsername, 'email' => $email, 'telephone' => $telephone]);
