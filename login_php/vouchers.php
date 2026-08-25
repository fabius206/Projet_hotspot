<?php
require_once __DIR__ . '/_commun.php';
header('Content-Type: application/json');
require_admin();

$db = db();

// Expiration automatique des codes dont la duree est passee
$db->query("UPDATE vouchers SET status = 'expire' WHERE status = 'actif' AND expire_at IS NOT NULL AND expire_at < NOW()");

function generer_code($db) {
  $charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for ($tentative = 0; $tentative < 50; $tentative++) {
    $code = 'HS-';
    for ($i = 0; $i < 6; $i++) {
      $code .= $charset[random_int(0, strlen($charset) - 1)];
    }
    $check = $db->prepare('SELECT id FROM vouchers WHERE code = ?');
    $check->execute([$code]);
    if (!$check->fetch()) {
      return $code;
    }
  }
  return null;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  if (isset($_GET['export'])) {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="codes_acces.csv"');

    $rows = $db->query(
      "SELECT v.code, COALESCE(p.nom, '-') AS plan, p.prix, v.status,
              DATE_FORMAT(v.created_at, '%d/%m/%Y %H:%i') AS cree_le
       FROM vouchers v LEFT JOIN plans p ON p.id = v.plan_id
       ORDER BY v.id DESC"
    )->fetchAll(PDO::FETCH_ASSOC);

    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, ['Code', 'Offre', 'Prix (Ar)', 'Statut', 'Cree le'], ';');
    foreach ($rows as $r) {
      fputcsv($out, [$r['code'], $r['plan'], $r['prix'], $r['status'], $r['cree_le']], ';');
    }
    fclose($out);
    exit;
  }

  $sql = "SELECT v.id, v.code, v.status, v.created_at, v.used_at, v.expire_at,
                 COALESCE(p.nom, '-') AS plan, p.prix
          FROM vouchers v LEFT JOIN plans p ON p.id = v.plan_id";
  $conditions = [];
  $params = [];

  if (!empty($_GET['statut']) && $_GET['statut'] !== 'tous') {
    $conditions[] = 'v.status = ?';
    $params[] = $_GET['statut'];
  }
  if (!empty($_GET['q'])) {
    $conditions[] = 'v.code LIKE ?';
    $params[] = '%' . strtoupper(trim($_GET['q'])) . '%';
  }
  if ($conditions) {
    $sql .= ' WHERE ' . implode(' AND ', $conditions);
  }
  $sql .= ' ORDER BY v.id DESC LIMIT 300';

  $stmt = $db->prepare($sql);
  $stmt->execute($params);
  echo json_encode(['vouchers' => $stmt->fetchAll()]);
  exit;
}

if ($method === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true) ?: [];
  $action = $input['action'] ?? '';

  if ($action === 'generer') {
    $planId = (int)($input['plan_id'] ?? 0);
    $quantite = (int)($input['quantite'] ?? 0);

    if ($planId <= 0 || $quantite < 1 || $quantite > 200) {
      http_response_code(400);
      echo json_encode(['error' => 'Offre valide et quantite entre 1 et 200 requises']);
      exit;
    }

    $plan = $db->prepare('SELECT id FROM plans WHERE id = ?');
    $plan->execute([$planId]);
    if (!$plan->fetch()) {
      http_response_code(404);
      echo json_encode(['error' => 'Offre introuvable']);
      exit;
    }

    $insert = $db->prepare('INSERT INTO vouchers (code, plan_id) VALUES (?, ?)');
    $codes = [];
    for ($i = 0; $i < $quantite; $i++) {
      $code = generer_code($db);
      if ($code === null) break;
      $insert->execute([$code, $planId]);
      $codes[] = $code;
    }

    echo json_encode(['success' => true, 'message' => count($codes) . ' code(s) genere(s)', 'codes' => $codes]);
    exit;
  }

  if ($action === 'marquer_utilise') {
    $id = (int)($input['id'] ?? 0);
    $v = $db->prepare('SELECT v.id, v.expire_at IS NULL AS jamais_utilise, p.duree_heures
                       FROM vouchers v JOIN plans p ON p.id = v.plan_id WHERE v.id = ?');
    $v->execute([$id]);
    $voucher = $v->fetch();
    if (!$voucher || !$voucher['jamais_utilise']) {
      http_response_code(400);
      echo json_encode(['error' => 'Code introuvable ou deja utilise']);
      exit;
    }
    $db->prepare("UPDATE vouchers SET status = 'actif', used_at = NOW(), expire_at = DATE_ADD(NOW(), INTERVAL ? HOUR) WHERE id = ?")
       ->execute([(int)$voucher['duree_heures'], $id]);
    echo json_encode(['success' => true, 'message' => 'Code marque comme actif']);
    exit;
  }

  if ($action === 'desactiver') {
    $id = (int)($input['id'] ?? 0);
    $db->prepare("UPDATE vouchers SET status = 'desactive' WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true, 'message' => 'Code desactive']);
    exit;
  }

  if ($action === 'reactiver') {
    $id = (int)($input['id'] ?? 0);
    $db->prepare("UPDATE vouchers SET status = 'non_utilise', expire_at = NULL, used_at = NULL WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true, 'message' => 'Code reactive']);
    exit;
  }

  if ($action === 'supprimer') {
    $id = (int)($input['id'] ?? 0);
    $db->prepare('DELETE FROM vouchers WHERE id = ?')->execute([$id]);
    echo json_encode(['success' => true, 'message' => 'Code supprime']);
    exit;
  }

  http_response_code(400);
  echo json_encode(['error' => 'Action inconnue']);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'Methode non autorisee']);
