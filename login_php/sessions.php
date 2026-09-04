<?php
require_once __DIR__ . '/_commun.php';
security_headers();
header('Content-Type: application/json; charset=utf-8');
require_admin();

$db = db();

// Expiration auto
$db->exec("UPDATE sessions s
    JOIN vouchers v ON v.id = s.voucher_id
    SET s.status='expired', s.ended_at=NOW()
    WHERE s.status='active' AND v.expire_at IS NOT NULL AND v.expire_at < NOW()");

// Déconnexion via POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $id = $input['id'] ?? $input['.id'] ?? null;
    $user = $input['user'] ?? null;
    if (!$id && !$user) { http_response_code(400); echo json_encode(['error'=>'ID ou user requis']); exit; }
    try {
        require_once __DIR__ . '/../mikrotik/MikroTikAPI.php';
        $rcfg = $db->query("SELECT valeur FROM config WHERE cle='router_ip'")->fetchColumn() ?: '192.168.88.1';
        $ruser = $db->query("SELECT valeur FROM config WHERE cle='router_username'")->fetchColumn() ?: 'admin';
        $rpass = $db->query("SELECT valeur FROM config WHERE cle='router_password'")->fetchColumn() ?: '';
        $api = new MikroTikAPI($rcfg, $ruser, $rpass);
        $api->disconnectUser($id ?: $user);
        // Historise
        if ($id) $db->prepare("UPDATE sessions SET status='closed', ended_at=NOW() WHERE id=?")->execute([$id]);
        $db->prepare("INSERT INTO logs (admin_id, action, cible, detail) VALUES (?,?,?,?)")->execute([$_SESSION['admin_id']??null, 'deconnexion', $id?:$user, 'Session MikroTik']);
        echo json_encode(['success'=>true, 'message'=>'Client déconnecté']);
    } catch (Throwable $e) { http_response_code(502); echo json_encode(['error'=>'MikroTik: '.$e->getMessage()]); }
    exit;
}

// Récupérer les sessions actives — tente MikroTik d'abord (temps réel), fallback DB
$formatted = [];
$mikrotik_ok = false;
try {
    require_once __DIR__ . '/../mikrotik/MikroTikAPI.php';
    $rcfg = $db->query("SELECT valeur FROM config WHERE cle='router_ip'")->fetchColumn() ?: '192.168.88.1';
    $ruser = $db->query("SELECT valeur FROM config WHERE cle='router_username'")->fetchColumn() ?: 'admin';
    $rpass = $db->query("SELECT valeur FROM config WHERE cle='router_password'")->fetchColumn() ?: '';
    $api = new MikroTikAPI($rcfg, $ruser, $rpass);
    $active = $api->getActiveSessions();
    foreach ($active as $s) {
        $formatted[] = [
            'id' => $s['.id'] ?? $s['id'] ?? 0,
            'user' => $s['user'] ?? $s['name'] ?? '—',
            'ip' => $s['address'] ?? $s['ip'] ?? '—',
            'mac' => $s['mac-address'] ?? '—',
            'uptime' => $s['uptime'] ?? '—',
            'duree' => $s['uptime'] ?? '—',
            'bytes_in' => $s['bytes-in'] ?? $s['bytes_in'] ?? '—',
            'bytes_out' => $s['bytes-out'] ?? $s['bytes_out'] ?? '—',
            'statut' => 'Actif'
        ];
    }
    $mikrotik_ok = true;
} catch (Throwable $e) { $mikrotik_ok = false; }

if (!$mikrotik_ok) {
    // Fallback DB
    try {
        $stmt = $db->query("SELECT s.id, s.hotspot_user, s.ip_address, s.mac_address, s.started_at, TIMESTAMPDIFF(MINUTE, s.started_at, NOW()) AS duree_min, v.code AS voucher_code FROM sessions s LEFT JOIN vouchers v ON v.id=s.voucher_id WHERE s.status='active' ORDER BY s.started_at DESC LIMIT 20");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $r) {
            $duree = ((int)$r['duree_min'] < 60) ? ($r['duree_min'].' min') : (floor($r['duree_min']/60).'h'.str_pad($r['duree_min']%60,2,'0',STR_PAD_LEFT));
            $formatted[] = ['id'=>(int)$r['id'],'user'=>$r['hotspot_user']?:($r['voucher_code']?:'Utilisateur'),'ip'=>$r['ip_address']?:'—','mac'=>$r['mac_address']?:'—','uptime'=>$duree,'duree'=>$duree,'bytes_in'=>'—','bytes_out'=>'—','statut'=>'Actif'];
        }
    } catch (Throwable $e) {}
}

echo json_encode([
    'total'    => count($formatted),
    'status'   => $mikrotik_ok ? 'connecte' : 'deconnecte',
    'sessions' => $formatted
]);
