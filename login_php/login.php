<?php
require_once __DIR__ . '/_commun.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$username = isset($input['username']) ? trim($input['username']) : '';
$password = isset($input['password']) ? $input['password'] : '';

if ($username === '' || $password === '') {
  http_response_code(400);
  echo json_encode(['error' => 'Identifiant et mot de passe requis']);
  exit;
}

$stmt = db()->prepare('SELECT id, username, password FROM admins WHERE username = ?');
$stmt->execute([$username]);
$admin = $stmt->fetch();

if (!$admin || !password_verify($password, $admin['password'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Identifiant ou mot de passe incorrect']);
  exit;
}

session_regenerate_id(true);
$_SESSION['admin_id'] = (int)$admin['id'];
$_SESSION['admin_username'] = $admin['username'];

echo json_encode([
  'success' => true,
  'user' => ['id' => (int)$admin['id'], 'username' => $admin['username']],
]);
