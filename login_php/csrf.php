<?php
require_once __DIR__ . '/_commun.php';
security_headers();
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
echo json_encode(['csrf' => csrf_token()]);