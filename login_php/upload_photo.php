<?php
require_once __DIR__ . '/_commun.php';
security_headers();
header('Content-Type: application/json');
require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Méthode non autorisée']);
  exit;
}
verify_csrf();

// Support suppression via JSON {action: "remove"}
$raw = file_get_contents('php://input');
if (empty($_FILES) && $raw) {
  $j = json_decode($raw, true);
  if (isset($j['action']) && $j['action'] === 'remove') {
    $adminId = (int)($_SESSION['admin_id'] ?? $_SESSION['user_id'] ?? 0);
    $db = db();
    $old = $db->prepare('SELECT photo FROM admins WHERE id = ?');
    $old->execute([$adminId]);
    $oldPhoto = $old->fetchColumn();
    if ($oldPhoto && file_exists(__DIR__ . '/../uploads/avatars/' . $oldPhoto)) {
      @unlink(__DIR__ . '/../uploads/avatars/' . $oldPhoto);
    }
    $db->prepare('UPDATE admins SET photo = NULL WHERE id = ?')->execute([$adminId]);
    audit_log('profile.photo_remove', (string)$adminId);
    echo json_encode(['success' => true, 'message' => 'Photo retirée']);
    exit;
  }
}

if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
  http_response_code(400);
  echo json_encode(['error' => 'Aucun fichier reçu']);
  exit;
}

$file = $_FILES['photo'];
$allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!isset($allowed[$mime])) {
  http_response_code(400);
  echo json_encode(['error' => 'Format non supporté (jpg, png, webp, gif uniquement)']);
  exit;
}
if ($file['size'] > 2 * 1024 * 1024) {
  http_response_code(400);
  echo json_encode(['error' => 'Fichier trop volumineux (2 Mo max)']);
  exit;
}

// Vérifie que c'est bien une image
$imgInfo = getimagesize($file['tmp_name']);
if ($imgInfo === false) {
  http_response_code(400);
  echo json_encode(['error' => 'Fichier image invalide']);
  exit;
}

$adminId = (int)($_SESSION['admin_id'] ?? $_SESSION['user_id'] ?? 0);
$ext = $allowed[$mime];
$filename = 'admin_' . $adminId . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
$destDir = __DIR__ . '/../uploads/avatars';
if (!is_dir($destDir)) mkdir($destDir, 0755, true);
$dest = $destDir . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $dest)) {
  http_response_code(500);
  echo json_encode(['error' => 'Échec enregistrement']);
  exit;
}

// Supprime ancienne photo si existe
$db = db();
$old = $db->prepare('SELECT photo FROM admins WHERE id = ?');
$old->execute([$adminId]);
$oldPhoto = $old->fetchColumn();
if ($oldPhoto && file_exists($destDir . '/' . $oldPhoto)) {
  @unlink($destDir . '/' . $oldPhoto);
}

$db->prepare('UPDATE admins SET photo = ? WHERE id = ?')->execute([$filename, $adminId]);
audit_log('profile.photo_update', (string)$adminId, $filename);

echo json_encode(['success' => true, 'message' => 'Photo mise à jour', 'photo' => '../uploads/avatars/' . $filename, 'filename' => $filename]);
