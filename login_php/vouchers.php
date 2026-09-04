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
      "SELECT v.code, v.status, DATE_FORMAT(v.created_at, '%d/%m/%Y %H:%i') AS cree_le
       FROM vouchers v ORDER BY v.id DESC"
    )->fetchAll(PDO::FETCH_ASSOC);

    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, ['Code', 'Statut', 'Cree le'], ';');
    foreach ($rows as $r) {
      fputcsv($out, [$r['code'], $r['status'], $r['cree_le']], ';');
    }
    fclose($out);
    exit;
  }

  $sql = "SELECT v.id, v.code, v.username, v.duree, v.profil, v.debit_max, v.max_appareils, v.status, v.sync_status, v.created_at, v.used_at, v.expire_at FROM vouchers v";
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
    $quantite = (int)($input['quantite'] ?? 0);
    $profil = trim($input['profil'] ?? $input['plan_id'] ?? 'default');
    $duree = (int)($input['duree'] ?? 60);
    $debit = trim($input['debit_max'] ?? $input['debit'] ?? '1M/1M');
    $max = (int)($input['max_appareils'] ?? 1);
    if ($quantite < 1 || $quantite > 200) {
      http_response_code(400);
      echo json_encode(['error' => 'Quantite entre 1 et 200 requise']);
      exit;
    }
    if ($duree < 5 || $duree > 10080) $duree = 60;
    if ($max < 1 || $max > 10) $max = 1;
    // Vérifie profil existe, sinon crée-le
    $prof = $db->prepare('SELECT id FROM profils WHERE nom=?');
    $prof->execute([$profil]);
    if (!$prof->fetch()) {
        $db->prepare('INSERT INTO profils (nom, duree, debit_max, max_appareils) VALUES (?,?,?,?)')->execute([$profil, $duree, $debit, $max]);
    }
    $insert = $db->prepare('INSERT INTO vouchers (code, username, password, duree, profil, debit_max, max_appareils, status, sync_status) VALUES (?,?,?,?,?,?,?, "non_utilise", "pending")');
    $codes = []; $syncErrors = 0;
    for ($i = 0; $i < $quantite; $i++) {
      $code = generer_code($db);
      if ($code === null) break;
      $insert->execute([$code, $code, $code, $duree, $profil, $debit, $max]);
      $id = $db->lastInsertId();
      $codes[] = $code;
      // Sync MikroTik
      try {
          require_once __DIR__ . '/../mikrotik/MikroTikAPI.php';
          $rcfg = $db->query("SELECT valeur FROM config WHERE cle='router_ip'")->fetchColumn() ?: '192.168.88.1';
          $ruser = $db->query("SELECT valeur FROM config WHERE cle='router_username'")->fetchColumn() ?: 'admin';
          $rpass = $db->query("SELECT valeur FROM config WHERE cle='router_password'")->fetchColumn() ?: '';
          $api = new MikroTikAPI($rcfg, $ruser, $rpass);
          $api->addUser($code, $code, $profil, $duree.'m');
          $db->prepare("UPDATE vouchers SET sync_status='synced' WHERE id=?")->execute([$id]);
      } catch (Throwable $e) {
          $db->prepare("UPDATE vouchers SET sync_status='sync_error' WHERE id=?")->execute([$id]);
          $syncErrors++;
          error_log("Voucher sync error $code: ".$e->getMessage());
      }
    }
    $msg = count($codes) . ' code(s) genere(s)';
    if ($syncErrors) $msg .= " ($syncErrors sync_error)";
    echo json_encode(['success' => true, 'message' => $msg, 'codes' => $codes, 'sync_errors' => $syncErrors]);
    exit;
  }

  if ($action === 'marquer_utilise') {
    $id = (int)($input['id'] ?? 0);
    $v = $db->prepare('SELECT id, duree, expire_at IS NULL AS jamais_utilise FROM vouchers WHERE id=?');
    $v->execute([$id]);
    $voucher = $v->fetch();
    if (!$voucher || !$voucher['jamais_utilise']) {
      http_response_code(400);
      echo json_encode(['error' => 'Code introuvable ou deja utilise']);
      exit;
    }
    $db->prepare("UPDATE vouchers SET status='actif', sync_status='active', used_at=NOW(), expire_at=DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id=?")
       ->execute([(int)($voucher['duree'] ?? 60), $id]);
    echo json_encode(['success' => true, 'message' => 'Code marque comme actif']);
    exit;
  }

  if ($action === 'desactiver') {
    $id = (int)($input['id'] ?? 0);
    $row = $db->prepare('SELECT code FROM vouchers WHERE id=?'); $row->execute([$id]); $code=$row->fetchColumn();
    $db->prepare("UPDATE vouchers SET status='desactive', sync_status='disabled' WHERE id=?")->execute([$id]);
    try{ require_once __DIR__.'/../mikrotik/MikroTikAPI.php'; $rcfg=$db->query("SELECT valeur FROM config WHERE cle='router_ip'")->fetchColumn()?:'192.168.88.1'; $ruser=$db->query("SELECT valeur FROM config WHERE cle='router_username'")->fetchColumn()?:'admin'; $rpass=$db->query("SELECT valeur FROM config WHERE cle='router_password'")->fetchColumn()?:''; (new MikroTikAPI($rcfg,$ruser,$rpass))->disableUser($code,true); }catch(Throwable $e){}
    echo json_encode(['success' => true, 'message' => 'Code desactive']);
    exit;
  }

  if ($action === 'reactiver') {
    $id = (int)($input['id'] ?? 0);
    $db->prepare("UPDATE vouchers SET status='non_utilise', sync_status='pending', expire_at=NULL, used_at=NULL WHERE id=?")->execute([$id]);
    echo json_encode(['success' => true, 'message' => 'Code reactive']);
    exit;
  }

  if ($action === 'supprimer') {
    $id = (int)($input['id'] ?? 0);
    $row = $db->prepare('SELECT code FROM vouchers WHERE id=?'); $row->execute([$id]); $code=$row->fetchColumn();
    $db->prepare('DELETE FROM vouchers WHERE id=?')->execute([$id]);
    try{ require_once __DIR__.'/../mikrotik/MikroTikAPI.php'; $rcfg=$db->query("SELECT valeur FROM config WHERE cle='router_ip'")->fetchColumn()?:'192.168.88.1'; $ruser=$db->query("SELECT valeur FROM config WHERE cle='router_username'")->fetchColumn()?:'admin'; $rpass=$db->query("SELECT valeur FROM config WHERE cle='router_password'")->fetchColumn()?:''; (new MikroTikAPI($rcfg,$ruser,$rpass))->removeUser($code); }catch(Throwable $e){}
    echo json_encode(['success' => true, 'message' => 'Code supprime']);
    exit;
  }

  http_response_code(400);
  echo json_encode(['error' => 'Action inconnue']);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'Methode non autorisee']);
