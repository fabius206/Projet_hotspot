<?php
require_once __DIR__ . '/_commun.php';
header('Content-Type: application/json');
require_admin();
$db = db();
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
  $rows = $db->query("SELECT p.*, (SELECT COUNT(*) FROM vouchers v WHERE v.plan_id = p.id) AS nb_codes FROM plans p ORDER BY p.id DESC")->fetchAll();
  echo json_encode(['plans' => $rows]); exit;
}
if ($method === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true) ?: [];
  $action = $input['action'] ?? '';
  if ($action === 'creer') {
    $stmt = $db->prepare("INSERT INTO plans (nom, duree_heures, prix) VALUES (?, ?, ?)");
    $stmt->execute([$input['nom'], $input['duree_heures'], $input['prix']]);
    echo json_encode(['success'=>true]); exit;
  }
  if ($action === 'modifier') {
    $stmt = $db->prepare("UPDATE plans SET nom=?, duree_heures=?, prix=? WHERE id=?");
    $stmt->execute([$input['nom'], $input['duree_heures'], $input['prix'], $input['id']]);
    echo json_encode(['success'=>true]); exit;
  }
  if ($action === 'supprimer') {
    $db->prepare("DELETE FROM plans WHERE id=?")->execute([$input['id']]);
    echo json_encode(['success'=>true]); exit;
  }
  if ($action === 'basculer') {
    $db->prepare("UPDATE plans SET actif = 1 - actif WHERE id=?")->execute([$input['id']]);
    echo json_encode(['success'=>true]); exit;
  }
}
?>