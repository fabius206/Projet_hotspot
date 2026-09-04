<?php
/**
 * api_vouchers.php — API REST pour la gestion des vouchers
 * Méthodes: GET ?action=list|stats  POST action=deactivate|delete|bulk_deactivate|bulk_delete
 */
header('Content-Type: application/json; charset=utf-8');

session_start();
if (empty($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non authentifié']);
    exit;
}

require_once __DIR__ . '/../config.php';

try {
    $pdo = new PDO(
        'mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB erreur', 'details' => $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true) ?? [];
$action = strtolower(trim($_GET['action'] ?? $body['action'] ?? ''));

function ok(array $data = []): void { echo json_encode(array_merge(['success' => true], $data)); exit; }
function err(string $msg, int $code = 400): void { http_response_code($code); echo json_encode(['error' => $msg, 'success' => false]); exit; }

switch ($action) {

    case 'list': {
        $limit  = min((int)($_GET['limit'] ?? 2000), 5000);
        $status = $_GET['status'] ?? '';
        $where  = $status ? "WHERE v.status = :status" : "";
        $stmt   = $pdo->prepare("
            SELECT v.id, v.code, v.status, v.created_at, v.used_at, v.expire_at,
                   v.hotspot_user, v.ip_address, v.mac_address, v.plan_id,
                   p.nom AS plan_nom, p.prix, p.duree_heures,
                   cl.nom AS client_nom
            FROM vouchers v
            LEFT JOIN plans p ON p.id = v.plan_id
            LEFT JOIN clients cl ON cl.id = v.client_id
            $where
            ORDER BY v.created_at DESC
            LIMIT :lim
        ");
        if ($status) $stmt->bindValue(':status', $status);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $vouchers = $stmt->fetchAll();

        // Stats
        $statsQ = $pdo->query("SELECT
            COUNT(*) AS total,
            SUM(status='non_utilise') AS libre,
            SUM(status='actif') AS actif,
            SUM(status='expire') AS expire,
            SUM(status='desactive') AS desactive
            FROM vouchers")->fetch();

        // Offres
        $offres = $pdo->query("SELECT id, nom FROM plans WHERE actif=1 ORDER BY nom")->fetchAll();

        ok(['vouchers' => $vouchers, 'stats' => $statsQ, 'offres' => $offres, 'total' => count($vouchers)]);
    }

    case 'deactivate': {
        $id = (int)($body['id'] ?? 0);
        if (!$id) err('ID manquant');
        $pdo->prepare("UPDATE vouchers SET status='desactive' WHERE id=?")->execute([$id]);
        ok(['message' => 'Voucher désactivé']);
    }

    case 'delete': {
        $id = (int)($body['id'] ?? 0);
        if (!$id) err('ID manquant');
        // Sécurité : ne supprime que les non_utilise
        $stmt = $pdo->prepare("SELECT status FROM vouchers WHERE id=? LIMIT 1");
        $stmt->execute([$id]);
        $v = $stmt->fetch();
        if (!$v) err('Voucher introuvable', 404);
        $pdo->prepare("DELETE FROM vouchers WHERE id=?")->execute([$id]);
        ok(['message' => 'Voucher supprimé']);
    }

    case 'bulk_deactivate': {
        $ids = array_filter(array_map('intval', $body['ids'] ?? []));
        if (!$ids) err('Aucun ID fourni');
        $ph  = implode(',', array_fill(0, count($ids), '?'));
        $pdo->prepare("UPDATE vouchers SET status='desactive' WHERE id IN ($ph)")->execute(array_values($ids));
        ok(['message' => count($ids) . ' vouchers désactivés']);
    }

    case 'bulk_delete': {
        $ids = array_filter(array_map('intval', $body['ids'] ?? []));
        if (!$ids) err('Aucun ID fourni');
        $ph  = implode(',', array_fill(0, count($ids), '?'));
        $pdo->prepare("DELETE FROM vouchers WHERE id IN ($ph)")->execute(array_values($ids));
        ok(['message' => count($ids) . ' vouchers supprimés']);
    }

    case 'stats': {
        $stats = $pdo->query("SELECT
            COUNT(*) AS total,
            SUM(status='non_utilise') AS libre,
            SUM(status='actif') AS actif,
            SUM(status='expire') AS expire,
            SUM(status='desactive') AS desactive,
            SUM(DATE(created_at)=CURDATE()) AS created_today
            FROM vouchers")->fetch();
        ok(['stats' => $stats]);
    }

    default:
        err("Action inconnue: $action. Disponible: list | deactivate | delete | bulk_deactivate | bulk_delete | stats");
}
