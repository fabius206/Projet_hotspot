<?php
/**
 * api_sessions.php — API REST pour la gestion des sessions
 * GET  ?action=active|history|stats
 * POST action=kick|kick_all
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

// Crée la table sessions si absente
$pdo->exec("CREATE TABLE IF NOT EXISTS sessions (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    voucher_id   INT,
    hotspot_user VARCHAR(100),
    ip_address   VARCHAR(45),
    mac_address  VARCHAR(20),
    status       ENUM('active','closed','expired','kicked') DEFAULT 'active',
    started_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at     DATETIME,
    INDEX idx_status (status),
    INDEX idx_user   (hotspot_user),
    INDEX idx_started(started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$body   = json_decode(file_get_contents('php://input'), true) ?? [];
$action = strtolower(trim($_GET['action'] ?? $body['action'] ?? ''));

function ok(array $d = []): void { echo json_encode(array_merge(['success' => true], $d)); exit; }
function err(string $m, int $c = 400): void { http_response_code($c); echo json_encode(['error' => $m, 'success' => false]); exit; }

// Marquer sessions expirées automatiquement
$pdo->exec("UPDATE sessions s
    JOIN vouchers v ON v.id = s.voucher_id
    SET s.status='expired', s.ended_at=NOW()
    WHERE s.status='active' AND v.expire_at IS NOT NULL AND v.expire_at < NOW()");

switch ($action) {

    // ═══════════════════════════════════════
    // SESSIONS ACTIVES
    // ═══════════════════════════════════════
    case 'active': {
        $sessions = $pdo->query("
            SELECT s.id, s.hotspot_user, s.ip_address, s.mac_address,
                   s.status, s.started_at, s.ended_at,
                   v.code AS voucher_code, v.expire_at,
                   p.nom AS plan_nom, p.duree_heures
            FROM sessions s
            LEFT JOIN vouchers v ON v.id = s.voucher_id
            LEFT JOIN plans p ON p.id = v.plan_id
            WHERE s.status = 'active'
            ORDER BY s.started_at DESC
        ")->fetchAll();

        // Stats
        $today  = $pdo->query("SELECT COUNT(*) FROM sessions WHERE DATE(started_at) = CURDATE()")->fetchColumn();
        $month  = $pdo->query("SELECT COUNT(*) FROM sessions WHERE YEAR(started_at)=YEAR(NOW()) AND MONTH(started_at)=MONTH(NOW())")->fetchColumn();
        $avgQ   = $pdo->query("SELECT ROUND(AVG(TIMESTAMPDIFF(MINUTE, started_at, COALESCE(ended_at, NOW()))),0) AS avg_min FROM sessions WHERE ended_at IS NOT NULL")->fetch();

        ok([
            'sessions' => $sessions,
            'stats' => [
                'active'       => count($sessions),
                'today'        => (int)$today,
                'month'        => (int)$month,
                'avg_duration' => $avgQ['avg_min'] ?? 0,
            ]
        ]);
    }

    // ═══════════════════════════════════════
    // HISTORIQUE
    // ═══════════════════════════════════════
    case 'history': {
        $limit  = min((int)($_GET['limit'] ?? 1000), 5000);
        $status = $_GET['status'] ?? '';
        $from   = $_GET['from']   ?? '';
        $to     = $_GET['to']     ?? '';

        $where = ['1=1'];
        $params= [];
        if ($status) { $where[] = 's.status = ?'; $params[] = $status; }
        if ($from)   { $where[] = 'DATE(s.started_at) >= ?'; $params[] = $from; }
        if ($to)     { $where[] = 'DATE(s.started_at) <= ?'; $params[] = $to; }

        // La limite est validée puis intégrée comme entier : certains pilotes
        // MySQL refusent les paramètres liés directement dans LIMIT.
        $limitSql = (string)$limit;
        $sql = "
            SELECT s.id, s.hotspot_user, s.ip_address, s.mac_address,
                   s.status, s.started_at, s.ended_at,
                   v.code AS voucher_code, v.expire_at,
                   p.nom AS plan_nom, p.prix
            FROM sessions s
            LEFT JOIN vouchers v ON v.id = s.voucher_id
            LEFT JOIN plans p ON p.id = v.plan_id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY s.started_at DESC
            LIMIT $limitSql
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        ok(['sessions' => $stmt->fetchAll(), 'total' => $stmt->rowCount()]);
    }

    // ═══════════════════════════════════════
    // STATS
    // ═══════════════════════════════════════
    case 'stats': {
        $active = $pdo->query("SELECT COUNT(*) FROM sessions WHERE status='active'")->fetchColumn();
        $today  = $pdo->query("SELECT COUNT(*) FROM sessions WHERE DATE(started_at)=CURDATE()")->fetchColumn();
        $month  = $pdo->query("SELECT COUNT(*) FROM sessions WHERE YEAR(started_at)=YEAR(NOW()) AND MONTH(started_at)=MONTH(NOW())")->fetchColumn();
        $avg    = $pdo->query("SELECT ROUND(AVG(TIMESTAMPDIFF(MINUTE, started_at, ended_at)),0) FROM sessions WHERE ended_at IS NOT NULL")->fetchColumn();
        ok(['active' => (int)$active, 'today' => (int)$today, 'month' => (int)$month, 'avg_duration' => (int)$avg]);
    }

    // ═══════════════════════════════════════
    // KICK 1 UTILISATEUR
    // ═══════════════════════════════════════
    case 'kick': {
        $id   = (int)($body['id']   ?? 0);
        $user = trim($body['user']  ?? '');
        if (!$id && !$user) err('ID ou user requis');

        $cond   = $id ? 'id=?' : 'hotspot_user=?';
        $param  = $id ? $id   : $user;
        $pdo->prepare("UPDATE sessions SET status='kicked', ended_at=NOW() WHERE $cond AND status='active'")
            ->execute([$param]);

        // Essaie aussi via router_detect_sync si disponible
        $kicked = true;
        $router_api_url = '../router_detect_sync.php?action=kick_user&user=' . urlencode($user ?: $param);
        // (optionnel, ne bloque pas si le routeur est offline)
        @file_get_contents($router_api_url);

        ok(['kicked' => $kicked, 'user' => $user ?: $id]);
    }

    // ═══════════════════════════════════════
    // KICK ALL
    // ═══════════════════════════════════════
    case 'kick_all': {
        $count = $pdo->query("SELECT COUNT(*) FROM sessions WHERE status='active'")->fetchColumn();
        $pdo->exec("UPDATE sessions SET status='kicked', ended_at=NOW() WHERE status='active'");

        // Essaie via routeur
        @file_get_contents('../router_detect_sync.php?action=kick_all');

        ok(['kicked' => (int)$count]);
    }

    default:
        err("Action inconnue: $action. Disponible: active | history | stats | kick | kick_all");
}
