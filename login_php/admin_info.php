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

$stmt = $pdo->query('SELECT id, username FROM admins ORDER BY id ASC LIMIT 1');
$admin = $stmt->fetch();

if (!$admin) {
  http_response_code(404);
  echo json_encode(['error' => 'Aucun administrateur trouve']);
  exit;
}

echo json_encode([
  'success' => true,
  'admin' => ['id' => (int)$admin['id'], 'username' => $admin['username']],
]);
