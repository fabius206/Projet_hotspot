<?php
if (session_status() === PHP_SESSION_NONE) {
  session_start();
}

function require_admin() {
  if (empty($_SESSION['admin_id'])) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Session expiree ou absente']);
    exit;
  }
}

function db() {
  static $pdo = null;
  if ($pdo === null) {
    $pdo = new PDO(
      'mysql:host=localhost;dbname=vrai_projet;charset=utf8mb4',
      'root',
      '',
      [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      ]
    );
  }
  return $pdo;
}
