<?php
require_once __DIR__ . '/_commun.php';

echo json_encode([
  'authenticated' => !empty($_SESSION['admin_id']),
  'username' => $_SESSION['admin_username'] ?? null,
]);
