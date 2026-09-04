<?php
require_once __DIR__ . '/_commun.php';
security_headers();
header('Content-Type: application/json');
require_admin();

$adminId = (int)($_SESSION['admin_id'] ?? $_SESSION['user_id'] ?? 0);
$db = db();
$db->exec("ALTER TABLE admins ADD COLUMN IF NOT EXISTS telephone VARCHAR(30) NULL");
$stmt = $db->prepare('SELECT id, username, email, telephone, role, photo, creation FROM admins WHERE id = ?');
$stmt->execute([$adminId]);
$admin = $stmt->fetch();

if (!$admin) {
  http_response_code(404);
  echo json_encode(['error' => 'Administrateur introuvable']);
  exit;
}

// Construit l'URL photo si existe
$photoUrl = null;
if (!empty($admin['photo'])) {
  $photoUrl = '../uploads/avatars/' . $admin['photo'];
  // vérifie fichier existe sinon null
  if (!file_exists(__DIR__ . '/../uploads/avatars/' . $admin['photo'])) {
    $photoUrl = null;
  }
}

echo json_encode([
  'success' => true,
  'admin' => [
    'id' => (int)$admin['id'],
    'username' => $admin['username'],
    'email' => $admin['email'] ?? '',
    'telephone' => $admin['telephone'] ?? '',
    'role' => $admin['role'],
    'photo' => $photoUrl,
    'creation' => $admin['creation']
  ],
  // compat ancien JS
  'username' => $admin['username'],
  'email' => $admin['email'] ?? '',
  'telephone' => $admin['telephone'] ?? '',
  'role' => $admin['role'],
  'photo' => $photoUrl,
  'nom_complet' => $admin['username']
]);
