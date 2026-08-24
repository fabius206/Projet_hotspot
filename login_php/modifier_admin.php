<?php
header('Content-Type: application/json');

$host = 'localhost';
$dbname = 'vrai_projet';
$dbUser = 'root';
$dbPass = '';

try {
  $pdo = new PDO(
    "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
    $dbUser,
    $dbPass,
    [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]
  );
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Connexion a la base de donnees impossible']);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$username = isset($input['username']) ? trim($input['username']) : '';
$currentPassword = isset($input['current_password']) ? $input['current_password'] : '';
$newPassword = isset($input['new_password']) ? $input['new_password'] : '';

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

$stmt = $pdo->prepare('SELECT id, password FROM admins WHERE username = ?');
$stmt->execute([$username]);
$admin = $stmt->fetch();

if (!$admin || !password_verify($currentPassword, $admin['password'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Identifiant ou mot de passe actuel incorrect']);
  exit;
}

if (password_verify($newPassword, $admin['password'])) {
  http_response_code(400);
  echo json_encode(['error' => "Le nouveau mot de passe doit etre different de l'ancien"]);
  exit;
}

$update = $pdo->prepare('UPDATE admins SET password = ? WHERE id = ?');
$update->execute([password_hash($newPassword, PASSWORD_DEFAULT), $admin['id']]);

echo json_encode(['success' => true, 'message' => 'Mot de passe mis a jour avec succes']);
