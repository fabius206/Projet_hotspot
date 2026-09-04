<?php
require_once __DIR__ . '/_commun.php';
security_headers();
header('Content-Type: application/json');
require_admin();

function detect_rest($ip, $user, $pass, $timeout = 3) {
    $urls = ["https://$ip/rest/system/resource", "http://$ip/rest/system/resource"];
    foreach ($urls as $url) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_USERPWD => "$user:$pass",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_CONNECTTIMEOUT => $timeout,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        ]);
        $body = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);
        if ($code === 200 && $body) {
            $j = json_decode($body, true);
            if (isset($j['version'])) return ['api'=>'rest', 'version'=>$j['version'], 'raw'=>$j];
            if (isset($j[0]['version'])) return ['api'=>'rest', 'version'=>$j[0]['version'], 'raw'=>$j[0]];
        }
    }
    return null;
}

// RouterOS API binaire minimal
function ros_encode_len($len) {
    if ($len < 0x80) return chr($len);
    if ($len < 0x4000) return chr(($len >> 8) | 0x80) . chr($len & 0xFF);
    if ($len < 0x200000) return chr(($len >> 16) | 0xC0) . chr(($len >> 8) & 0xFF) . chr($len & 0xFF);
    if ($len < 0x10000000) return chr(($len >> 24) | 0xE0) . chr(($len >> 16) & 0xFF) . chr(($len >> 8) & 0xFF) . chr($len & 0xFF);
    return chr(0xF0) . chr(($len >> 24) & 0xFF) . chr(($len >> 16) & 0xFF) . chr(($len >> 8) & 0xFF) . chr($len & 0xFF);
}
function ros_write($fp, $words) {
    foreach ($words as $w) { fwrite($fp, ros_encode_len(strlen($w)) . $w); }
    fwrite($fp, chr(0));
}
function ros_read_word($fp) {
    $c = ord(fread($fp, 1));
    if ($c === 0) return '';
    $len = 0;
    if ($c < 0x80) $len = $c;
    elseif ($c < 0xC0) $len = (($c & 0x7F) << 8) + ord(fread($fp,1));
    elseif ($c < 0xE0) $len = (($c & 0x3F) << 16) + (ord(fread($fp,1)) << 8) + ord(fread($fp,1));
    elseif ($c < 0xF0) $len = (($c & 0x1F) << 24) + (ord(fread($fp,1)) << 16) + (ord(fread($fp,1)) << 8) + ord(fread($fp,1));
    else $len = (ord(fread($fp,1)) << 24) + (ord(fread($fp,1)) << 16) + (ord(fread($fp,1)) << 8) + ord(fread($fp,1));
    if ($len === 0) return '';
    return fread($fp, $len);
}
function ros_read_sentence($fp) {
    $words = [];
    while (true) {
        $w = ros_read_word($fp);
        if ($w === '') break;
        $words[] = $w;
    }
    return $words;
}
function detect_ros($ip, $user, $pass, $port = 8728, $timeout = 3) {
    $fp = @fsockopen($ip, $port, $errno, $errstr, $timeout);
    if (!$fp) return null;
    stream_set_timeout($fp, $timeout);
    // login
    ros_write($fp, ['/login', "=name=$user", "=password=$pass"]);
    // Alternative: challenge/response for older versions
    $resp = ros_read_sentence($fp);
    // Check if !done or !trap
    $is_done = in_array('!done', $resp);
    if (!$is_done && in_array('!trap', $resp)) {
        // Try challenge method
        $challenge = '';
        foreach ($resp as $r) { if (strpos($r,'=ret=')===0) $challenge = substr($r,5); }
        if ($challenge !== '') {
            $hash = md5(chr(0) . $pass . pack('H*', $challenge));
            ros_write($fp, ['/login', "=name=$user", "=response=00$hash"]);
            $resp = ros_read_sentence($fp);
            $is_done = in_array('!done', $resp);
        }
    }
    if (!$is_done) { fclose($fp); return null; }
    // resource print
    ros_write($fp, ['/system/resource/print']);
    $version = null;
    while (true) {
        $sentence = ros_read_sentence($fp);
        if (empty($sentence)) break;
        if (in_array('!done', $sentence)) break;
        foreach ($sentence as $w) {
            if (strpos($w, '=version=')===0) $version = substr($w, 9);
        }
        if ($version) break;
        // consume until !done
        if (in_array('!trap', $sentence)) break;
    }
    fclose($fp);
    if ($version) return ['api'=>'ros', 'version'=>$version];
    return null;
}

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
    // Liste les routeurs stockés avec leur version détectée si déjà en cache
    $db = db();
    try {
        $rows = $db->query('SELECT id, nom, ip, port_api, username, site, actif FROM routers ORDER BY id')->fetchAll();
    } catch (Throwable $e) { $rows = []; }
    echo json_encode(['routers'=>$rows]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $ip = trim($input['ip'] ?? '');
    $user = trim($input['username'] ?? $input['user'] ?? '');
    $pass = $input['password'] ?? $input['pass'] ?? '';
    $port = (int)($input['port'] ?? 8728);

    // Si pas d'IP fournie, prend le premier routeur actif en base
    if ($ip === '') {
        $db = db();
        try {
            $r = $db->query('SELECT ip, username, password, port_api FROM routers WHERE actif=1 ORDER BY id LIMIT 1')->fetch();
            if ($r) { $ip=$r['ip']; $user=$r['username']; $pass=$r['password']; $port=(int)$r['port_api'] ?: 8728; }
        } catch (Throwable $e) {}
    }
    if ($ip === '' || $user === '') {
        http_response_code(400);
        echo json_encode(['error'=>'IP et utilisateur requis (ou configure un routeur dans la table routers)']);
        exit;
    }

    $result = null;
    $tried = [];

    // 1. Tente REST (v7)
    $tried[] = 'rest:443';
    $rest = detect_rest($ip, $user, $pass, 3);
    if ($rest) {
        $result = $rest;
        $result['api_type'] = 'rest';
        $result['is_v7'] = str_starts_with($result['version'], '7.');
        $result['is_v6'] = str_starts_with($result['version'], '6.');
    } else {
        // 2. Fallback ROS (v6)
        $tried[] = "ros:$port";
        $ros = detect_ros($ip, $user, $pass, $port, 3);
        if ($ros) {
            $result = $ros;
            $result['api_type'] = 'ros';
            $result['is_v7'] = str_starts_with($result['version'], '7.');
            $result['is_v6'] = str_starts_with($result['version'], '6.');
        }
    }

    if ($result) {
        // Mets en cache dans routers si trouvé
        try {
            $db = db();
            // Crée colonne version/api_type si absente
            $db->exec("ALTER TABLE routers ADD COLUMN IF NOT EXISTS version varchar(20) DEFAULT NULL");
            $db->exec("ALTER TABLE routers ADD COLUMN IF NOT EXISTS api_type varchar(10) DEFAULT NULL");
            $db->exec("ALTER TABLE routers ADD COLUMN IF NOT EXISTS last_check datetime DEFAULT NULL");
            $stmt = $db->prepare('UPDATE routers SET version=?, api_type=?, last_check=NOW() WHERE ip=?');
            $stmt->execute([$result['version'], $result['api_type'], $ip]);
        } catch (Throwable $e) {}
        echo json_encode([
            'success'=>true,
            'ip'=>$ip,
            'version'=>$result['version'],
            'api_type'=>$result['api_type'],
            'is_v6'=> $result['is_v6'] ?? false,
            'is_v7'=> $result['is_v7'] ?? false,
            'message'=> $result['is_v7'] ? 'Routeur v7 détecté → utiliser REST (443)' : ($result['is_v6'] ? 'Routeur v6 détecté → utiliser API 8728' : 'Version détectée: '.$result['version'])
        ]);
        exit;
    } else {
        http_response_code(502);
        echo json_encode(['error'=>'Routeur injoignable ou identifiants invalides', 'tried'=>$tried, 'hint'=>'Vérifie IP, port 8728/443 ouverts dans IP → Services, et user groupe full']);
        exit;
    }
}

http_response_code(405);
echo json_encode(['error'=>'Méthode non autorisée']);
