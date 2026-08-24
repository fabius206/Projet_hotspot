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

$stmt = $pdo->query('SELECT id, username FROM admins ORDER BY id ASC LIMIT 1');
$admin = $stmt->fetch();

if (!$admin) {
  http_response_code(404);
  echo json_encode(['error' => 'Aucun administrateur trouve']);
  exit;
}

$check = $pdo->prepare('SELECT id FROM admins WHERE username = ? AND id != ?');
$check->execute([$newUsername, $admin['id']]);
if ($check->fetch()) {
  http_response_code(409);
  echo json_encode(['error' => 'Ce nom est deja utilise']);
  exit;
}

$update = $pdo->prepare('UPDATE admins SET username = ? WHERE id = ?');
$update->execute([$newUsername, $admin['id']]);

echo json_encode(['success' => true, 'message' => "Nom de l'administrateur mis a jour"]);
