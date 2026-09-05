<?php
require_once __DIR__ . '/_commun.php';
security_headers();
header('Content-Type: application/json');
require_admin();
ensure_admin_schema();
$db = db();

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
    $rows = $db->query("SELECT setting_key, setting_value FROM app_settings")->fetchAll(PDO::FETCH_KEY_PAIR);
    $legacy = $db->query("SELECT cle, valeur FROM config WHERE cle IN ('hotspot_nom','systeme_langue','hotspot_duree_session','hotspot_timeout')")->fetchAll(PDO::FETCH_KEY_PAIR);
    $rows = array_merge($legacy, $rows);
    echo json_encode([
        'hotspot_nom' => $rows['hotspot_nom'] ?? 'Hotspot Diego',
        'systeme_langue' => $rows['systeme_langue'] ?? 'fr',
        'hotspot_duree_session' => $rows['hotspot_duree_session'] ?? '60',
        'hotspot_timeout' => $rows['hotspot_timeout'] ?? '30',
        'hotspot_description' => $rows['hotspot_description'] ?? '',
        'hotspot_message_accueil' => $rows['hotspot_message_accueil'] ?? '',
        'contact_email' => $rows['contact_email'] ?? '',
        'contact_telephone' => $rows['contact_telephone'] ?? '',
        'contact_adresse' => $rows['contact_adresse'] ?? '',
        'site_web' => $rows['site_web'] ?? '',
        'devise' => $rows['devise'] ?? 'MGA',
        'fuseau_horaire' => $rows['fuseau_horaire'] ?? 'Indian/Antananarivo',
        'format_date' => $rows['format_date'] ?? 'dd/MM/yyyy',
        'session_admin_minutes' => $rows['session_admin_minutes'] ?? '30',
        'app_nom' => $rows['app_nom'] ?? 'Hotspot Diego',
        'app_version' => $rows['app_version'] ?? '1.0.0',
    ]);
    exit;
}
if ($method === 'POST') {
    require_permission('settings');
    verify_csrf();
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $allowed = ['hotspot_nom','systeme_langue','hotspot_description','hotspot_message_accueil','contact_email','contact_telephone','contact_adresse','site_web','devise','fuseau_horaire','format_date','session_admin_minutes','app_nom'];
    foreach ($input as $key => $value) {
        if (!in_array($key, $allowed, true)) continue;
        $value = trim((string)$value);
        if ($key === 'contact_email' && $value !== '' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400); echo json_encode(['error'=>'Email de contact invalide']); exit;
        }
        if ($key === 'systeme_langue' && !in_array($value, ['fr','en','mg'], true)) {
            http_response_code(400); echo json_encode(['error'=>'Langue invalide']); exit;
        }
        if ($key === 'session_admin_minutes' && (!ctype_digit($value) || (int)$value < 5 || (int)$value > 1440)) {
            http_response_code(400); echo json_encode(['error'=>'Durée de session invalide']); exit;
        }
        $stmt = $db->prepare('INSERT INTO app_settings (setting_key, setting_value, category, updated_by) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by), updated_at = NOW()');
        $category = str_starts_with($key, 'hotspot_') || str_starts_with($key, 'contact_') || $key === 'site_web' ? 'hotspot' : 'general';
        $stmt->execute([$key, $value, $category, (int)($_SESSION['admin_id'] ?? $_SESSION['user_id'] ?? 0)]);
    }
    audit_log('settings.update', null, implode(',', array_keys($input)));
    echo json_encode(['success'=>true, 'message'=>'Paramètres enregistrés']);
    exit;

}
http_response_code(405);
echo json_encode(['error'=>'Méthode non autorisée']);
