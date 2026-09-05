<?php
require_once __DIR__ . '/_commun.php';
security_headers();
header('Content-Type: application/json');
require_role(['super_admin']);
ensure_admin_schema();

$limit = min(200, max(10, (int)($_GET['limit'] ?? 50)));
$stmt = db()->prepare('SELECT a.id, a.action, a.cible, a.details, a.ip_address, a.resultat, a.created_at, ad.username
  FROM audit_logs a LEFT JOIN admins ad ON ad.id = a.admin_id
  ORDER BY a.created_at DESC LIMIT ' . $limit);
$stmt->execute();
echo json_encode(['success' => true, 'logs' => $stmt->fetchAll()]);
