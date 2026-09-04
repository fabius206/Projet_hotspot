<?php
require_once __DIR__ . '/_commun.php';
security_headers();
header('Content-Type: application/json');
require_admin();
$db = db();

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
    $rows = $db->query("SELECT cle, valeur, categorie FROM config WHERE cle IN ('hotspot_nom','systeme_langue','hotspot_duree_session','hotspot_timeout')")->fetchAll(PDO::FETCH_KEY_PAIR);
    echo json_encode([
        'hotspot_nom' => $rows['hotspot_nom'] ?? 'Hotspot Diego',
        'systeme_langue' => $rows['systeme_langue'] ?? 'fr',
        'hotspot_duree_session' => $rows['hotspot_duree_session'] ?? '60',
        'hotspot_timeout' => $rows['hotspot_timeout'] ?? '30',
    ]);
    exit;
}
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $hotspot_nom = isset($input['hotspot_nom']) ? trim($input['hotspot_nom']) : null;
    $langue = isset($input['systeme_langue']) ? trim($input['systeme_langue']) : null;

    if ($hotspot_nom !== null) {
        if (mb_strlen($hotspot_nom) < 2 || mb_strlen($hotspot_nom) > 50) {
            http_response_code(400); echo json_encode(['error'=>'Nom du hotspot 2-50 caractères']); exit;
        }
        $db->prepare("INSERT INTO config (cle, valeur, categorie, description) VALUES ('hotspot_nom', ?, 'hotspot', 'Nom du hotspot') ON DUPLICATE KEY UPDATE valeur=?, updated_at=NOW()")->execute([$hotspot_nom, $hotspot_nom]);
    }
    if ($langue !== null) {
        if (!in_array($langue, ['fr','en','mg'], true)) { http_response_code(400); echo json_encode(['error'=>'Langue invalide']); exit; }
        $db->prepare("INSERT INTO config (cle, valeur, categorie, description) VALUES ('systeme_langue', ?, 'general', 'Langue du système') ON DUPLICATE KEY UPDATE valeur=?, updated_at=NOW()")->execute([$langue, $langue]);
        $_SESSION['langue'] = $langue;
    }
    echo json_encode(['success'=>true, 'message'=>'Paramètres enregistrés']);
    exit;
}
http_response_code(405);
echo json_encode(['error'=>'Méthode non autorisée']);
