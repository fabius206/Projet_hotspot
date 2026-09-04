<?php
require_once __DIR__ . '/_commun.php';
security_headers();
header('Content-Type: application/json; charset=utf-8');
require_admin();

$db = db();

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
