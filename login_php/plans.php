<?php
require_once __DIR__ . '/_commun.php';
header('Content-Type: application/json');
require_admin();

$db = db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $rows = $db->query(
    'SELECT p.id, p.nom, p.duree_heures, p.prix, p.actif,
            (SELECT COUNT(*) FROM vouchers v WHERE v.plan_id = p.id) AS nb_codes
     FROM plans p
     ORDER BY p.prix ASC'
  )->fetchAll();
  echo json_encode(['plans' => $rows]);
  exit;
}

if ($method === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true) ?: [];
  $action = $input['action'] ?? '';

  if ($action === 'creer') {
    $nom = trim($input['nom'] ?? '');
    $duree = (int)($input['duree_heures'] ?? 0);
    $prix = (int)($input['prix'] ?? 0);

    if ($nom === '' || $duree <= 0 || $prix <= 0) {
      http_response_code(400);
      echo json_encode(['error' => 'Nom, duree et prix valides sont requis']);
      exit;
    }

    $stmt = $db->prepare('INSERT INTO plans (nom, duree_heures, prix) VALUES (?, ?, ?)');
    $stmt->execute([$nom, $duree, $prix]);
    echo json_encode(['success' => true, 'message' => 'Offre creee']);
    exit;
  }

  if ($action === 'modifier') {
    $id = (int)($input['id'] ?? 0);
    $nom = trim($input['nom'] ?? '');
    $duree = (int)($input['duree_heures'] ?? 0);
    $prix = (int)($input['prix'] ?? 0);

    if ($id <= 0 || $nom === '' || $duree <= 0 || $prix <= 0) {
      http_response_code(400);
      echo json_encode(['error' => 'Donnees invalides']);
      exit;
    }

    $stmt = $db->prepare('UPDATE plans SET nom = ?, duree_heures = ?, prix = ? WHERE id = ?');
    $stmt->execute([$nom, $duree, $prix, $id]);
    echo json_encode(['success' => true, 'message' => 'Offre modifiee']);
    exit;
  }

  if ($action === 'basculer') {
    $id = (int)($input['id'] ?? 0);
    $stmt = $db->prepare('UPDATE plans SET actif = 1 - actif WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'message' => 'Statut de l\'offre mis a jour']);
    exit;
  }

  if ($action === 'supprimer') {
    $id = (int)($input['id'] ?? 0);
    $stmt = $db->prepare('DELETE FROM plans WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'message' => 'Offre supprimee']);
    exit;
  }

  http_response_code(400);
  echo json_encode(['error' => 'Action inconnue']);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'Methode non autorisee']);
