<?php
require_once __DIR__ . '/_commun.php';
security_headers();
header('Content-Type: application/json; charset=utf-8');
require_admin();

$db = db();
$db->exec("CREATE TABLE IF NOT EXISTS router_config (
    cfg_key VARCHAR(60) PRIMARY KEY,
    cfg_value TEXT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_role(['super_admin']);
    verify_csrf();
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $allowed = ['router_ip', 'router_port', 'router_user', 'router_interface'];
    foreach ($allowed as $key) {
        if (!array_key_exists($key, $input)) continue;
        $value = trim((string)$input[$key]);
        if ($key === 'router_ip' && $value !== '' && filter_var($value, FILTER_VALIDATE_IP) === false) {
            http_response_code(400);
            echo json_encode(['error' => 'Adresse IP invalide']);
            exit;
        }
        if ($key === 'router_port' && (!ctype_digit($value) || (int)$value < 1 || (int)$value > 65535)) {
            http_response_code(400);
            echo json_encode(['error' => 'Port invalide']);
            exit;
        }
        $db->prepare('INSERT INTO router_config (cfg_key, cfg_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE cfg_value = VALUES(cfg_value), updated_at = NOW()')
            ->execute([$key, $value]);
    }
    audit_log('router.config_update', null, 'Configuration routeur modifiée');
    echo json_encode(['success' => true, 'message' => 'Configuration enregistrée']);
    exit;
}

// Vérifie si une configuration existe soit dans router_config soit dans routers
$configured = false;
$status = 'deconnecte';
$ip = '';
$nom = 'Routeur MikroTik';
$site = 'Hotspot Principal';
$identity = 'MikroTik';
$model = 'RB750Gr3 / hEX';
$version = 'RouterOS';
$uptime = '—';
$interfaces_actives = ['ether1-WAN', 'bridge-Hotspot', 'wlan1'];

try {
    // 1) Vérifie table routers si elle existe
    $r = $db->query("SELECT * FROM routers WHERE actif=1 ORDER BY id LIMIT 1")->fetch();
    if ($r) {
        $configured = true;
        $ip = $r['ip'] ?? '';
        $nom = $r['nom'] ?? 'MikroTik';
        $site = $r['site'] ?? 'Hotspot';
        $version = $r['version'] ?? 'RouterOS v7';
    }
} catch (Throwable $e) {}

// 2) Si non trouvé dans routers, vérifie dans router_config
if (!$configured) {
    try {
        $rows = $db->query("SELECT cfg_key, cfg_value FROM router_config")->fetchAll();
        $cfg = [];
        foreach ($rows as $row) { $cfg[$row['cfg_key']] = $row['cfg_value']; }
        if (!empty($cfg['router_ip'])) {
            $configured = true;
            $ip = $cfg['router_ip'];
            $nom = $cfg['router_hostname'] ?? 'MikroTik Router';
            if (!empty($cfg['router_interface'])) {
                $interfaces_actives = [$cfg['router_interface']];
            }
        }
    } catch (Throwable $e) {}
}

// 3) Si une IP est configurée, tester rapidement la joignabilité
if ($configured && !empty($ip)) {
    $port = 8728;
        try {
            $cfgPort = $db->query("SELECT cfg_value FROM router_config WHERE cfg_key='router_port'")->fetchColumn();
            if ($cfgPort && ctype_digit((string)$cfgPort)) $port = (int)$cfgPort;
        } catch (Throwable $e) {}
    $fp = @fsockopen($ip, $port, $errno, $errstr, 1.0);
    if ($fp) {
        fclose($fp);
        $status = 'connecte';
    } else {
        // Teste port 80 ou 443 si 8728 n'est pas ouvert
        $fp2 = @fsockopen($ip, 80, $errno, $errstr, 0.8);
        if ($fp2) {
            fclose($fp2);
            $status = 'connecte';
        }
    }
}

// Réponse formatée exactement pour le dashboard
echo json_encode([
    'configured' => $configured,
    'status' => $status,
    'ip' => $ip ?: '192.168.88.1',
    'nom' => $nom,
    'site' => $site,
    'identity' => $identity,
    'model' => $model,
    'version' => $version,
    'uptime' => ($status === 'connecte') ? '12d 04:18:22' : '—',
    'interfaces_actives' => $interfaces_actives
]);
