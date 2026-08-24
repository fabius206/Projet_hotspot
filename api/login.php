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
$password = isset($input['password']) ? $input['password'] : '';

if ($username === '' || $password === '') {
  http_response_code(400);
  echo json_encode(['error' => 'Identifiant et mot de passe requis']);
  exit;
}

$stmt = $pdo->prepare('SELECT id, username, password FROM admins WHERE username = ?');
$stmt->execute([$username]);
$admin = $stmt->fetch();

if (!$admin || !password_verify($password, $admin['password'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Identifiant ou mot de passe incorrect']);
  exit;
}

echo json_encode([
  'success' => true,
  'user' => ['id' => (int)$admin['id'], 'username' => $admin['username']],
]);
