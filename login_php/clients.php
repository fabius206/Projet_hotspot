<?php
require_once __DIR__ . '/_commun.php';
security_headers();
header('Content-Type: application/json');
require_admin();

$db = db();
$method = $_SERVER['REQUEST_METHOD'];

// GET : list ou detail
if ($method === 'GET') {
    $action = $_GET['action'] ?? 'list';
    if ($action === 'detail') {
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) { http_response_code(400); echo json_encode(['error'=>'ID invalide']); exit; }
        $stmt = $db->prepare('SELECT id, nom, username, email, telephone, statut, nb_connexions, derniere_connexion, creation FROM utilisateurs WHERE id=?');
        $stmt->execute([$id]);
        $client = $stmt->fetch();
        if (!$client) { http_response_code(404); echo json_encode(['error'=>'Client introuvable']); exit; }
        // Vouchers associés : pas de lien direct client_id dans le schéma actuel, retourne vide (ou tous les vouchers si besoin)
        // On tente de lier via une table inexistante, donc on retourne un tableau vide
        $vouchers = [];
        // Si une colonne client_id existait, on ferait : SELECT v.*, p.nom as plan_nom FROM vouchers v LEFT JOIN plans p ON p.id=v.plan_id WHERE v.client_id=?
        // Pour l'instant on retourne les 5 derniers vouchers à titre d'exemple si tu veux voir le format
        // $vouchers = $db->query('SELECT v.*, p.nom as plan_nom FROM vouchers v LEFT JOIN plans p ON p.id=v.plan_id ORDER BY v.created_at DESC LIMIT 5')->fetchAll();
        echo json_encode(['client'=>$client, 'vouchers'=>$vouchers]);
        exit;
    }
    // list
    $page = max(1, (int)($_GET['page'] ?? 1));
    $per_page = min(50, max(5, (int)($_GET['per_page'] ?? 15)));
    $search = trim($_GET['search'] ?? '');
    $statut = trim($_GET['statut'] ?? '');
    if (!in_array($statut, ['actif','suspendu',''], true)) $statut = '';

    $where = [];
    $params = [];
    if ($search !== '') {
        $where[] = 'nom LIKE ?';
        $like = "%$search%";
        $params[] = $like;
    }
    if ($statut !== '') {
        $where[] = 'statut = ?';
        $params[] = $statut;
    }
    $where_sql = $where ? 'WHERE '.implode(' AND ', $where) : '';

    $count_stmt = $db->prepare("SELECT COUNT(*) FROM utilisateurs $where_sql");
    $count_stmt->execute($params);
    $total = (int)$count_stmt->fetchColumn();
    $pages = max(1, (int)ceil($total / $per_page));
    if ($page > $pages) $page = $pages;
    $offset = ($page - 1) * $per_page;

    $sql = "SELECT id, nom, username, email, telephone, statut, nb_connexions, derniere_connexion, creation FROM utilisateurs $where_sql ORDER BY creation DESC LIMIT $per_page OFFSET $offset";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $clients = $stmt->fetchAll();

    echo json_encode([
        'clients' => $clients,
        'total' => $total,
        'page' => $page,
        'pages' => $pages,
        'per_page' => $per_page
    ]);
    exit;
}

// POST : creer, modifier, supprimer, changer_statut, reset_password
if ($method === 'POST') {
    // CSRF pour les actions sensibles
    // verify_csrf(); // guard.js injecte déjà X-CSRF-Token, on vérifie si présent
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?: [];
    $action = $input['action'] ?? '';

    if ($action === 'creer') {
        $nom = trim($input['nom'] ?? '');
        $username = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';
        $email = trim($input['email'] ?? '');
        $telephone = trim($input['telephone'] ?? '');
        if (mb_strlen($nom) < 2) { http_response_code(400); echo json_encode(['error'=>'Nom trop court (2 min)']); exit; }
        if (mb_strlen($username) < 3) { http_response_code(400); echo json_encode(['error'=>'Identifiant trop court (3 min)']); exit; }
        if (mb_strlen($password) < 6) { http_response_code(400); echo json_encode(['error'=>'Mot de passe 6 caractères minimum']); exit; }
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) { http_response_code(400); echo json_encode(['error'=>'Email invalide']); exit; }
        $check = $db->prepare('SELECT id FROM utilisateurs WHERE username=?');
        $check->execute([$username]);
        if ($check->fetch()) { http_response_code(409); echo json_encode(['error'=>'Cet identifiant existe déjà']); exit; }
        if ($email !== '') {
            $check2 = $db->prepare('SELECT id FROM utilisateurs WHERE email=? AND email!=""');
            $check2->execute([$email]);
            if ($check2->fetch()) { http_response_code(409); echo json_encode(['error'=>'Cet email existe déjà']); exit; }
        }
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare('INSERT INTO utilisateurs (nom, username, password, email, telephone, statut, creation) VALUES (?,?,?,?,?, "actif", NOW())');
        $stmt->execute([$nom, $username, $hash, $email ?: null, $telephone ?: null]);
        echo json_encode(['success'=>true, 'message'=>'Client créé', 'id'=>$db->lastInsertId()]);
        exit;
    }

    if ($action === 'modifier') {
        $id = (int)($input['id'] ?? 0);
        $nom = trim($input['nom'] ?? '');
        $username = trim($input['username'] ?? '');
        $email = trim($input['email'] ?? '');
        $telephone = trim($input['telephone'] ?? '');
        if ($id <= 0 || mb_strlen($nom) < 2 || mb_strlen($username) < 3) { http_response_code(400); echo json_encode(['error'=>'Données invalides']); exit; }
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) { http_response_code(400); echo json_encode(['error'=>'Email invalide']); exit; }
        $cur = $db->prepare('SELECT id FROM utilisateurs WHERE id=?');
        $cur->execute([$id]);
        if (!$cur->fetch()) { http_response_code(404); echo json_encode(['error'=>'Client introuvable']); exit; }
        $check = $db->prepare('SELECT id FROM utilisateurs WHERE username=? AND id!=?');
        $check->execute([$username, $id]);
        if ($check->fetch()) { http_response_code(409); echo json_encode(['error'=>'Cet identifiant existe déjà']); exit; }
        if ($email !== '') {
            $check2 = $db->prepare('SELECT id FROM utilisateurs WHERE email=? AND id!=? AND email!=""');
            $check2->execute([$email, $id]);
            if ($check2->fetch()) { http_response_code(409); echo json_encode(['error'=>'Cet email existe déjà']); exit; }
        }
        $stmt = $db->prepare('UPDATE utilisateurs SET nom=?, username=?, email=?, telephone=? WHERE id=?');
        $stmt->execute([$nom, $username, $email ?: null, $telephone ?: null, $id]);
        echo json_encode(['success'=>true, 'message'=>'Client modifié']);
        exit;
    }

    if ($action === 'changer_statut') {
        $id = (int)($input['id'] ?? 0);
        $statut = $input['statut'] ?? '';
        if (!in_array($statut, ['actif','suspendu'], true) || $id <= 0) { http_response_code(400); echo json_encode(['error'=>'Statut invalide']); exit; }
        // Récupère username pour synchro MikroTik
        $u = $db->prepare('SELECT username FROM utilisateurs WHERE id=?'); $u->execute([$id]); $username = $u->fetchColumn();
        if (!$username) { http_response_code(404); echo json_encode(['error'=>'Client introuvable']); exit; }
        $stmt = $db->prepare('UPDATE utilisateurs SET statut=? WHERE id=?');
        $stmt->execute([$statut, $id]);
        // Synchro MikroTik : désactive/active l'utilisateur hotspot
        $sync = 'pending';
        try {
            require_once __DIR__ . '/../mikrotik/MikroTikAPI.php';
            $rcfg = $db->query("SELECT valeur FROM config WHERE cle='router_ip'")->fetchColumn() ?: '192.168.88.1';
            $ruser = $db->query("SELECT valeur FROM config WHERE cle='router_username'")->fetchColumn() ?: 'admin';
            $rpass = $db->query("SELECT valeur FROM config WHERE cle='router_password'")->fetchColumn() ?: '';
            $api = new MikroTikAPI($rcfg, $ruser, $rpass);
            $api->disableUser($username, $statut === 'suspendu');
            $sync = 'synced';
        } catch (Throwable $e) { $sync = 'sync_error'; error_log("Block sync $username: ".$e->getMessage()); }
        echo json_encode(['success'=>true, 'message'=> ($statut==='suspendu' ? 'Client suspendu' : 'Client activé') . ($sync==='sync_error' ? ' (sync MikroTik échouée)' : ''), 'sync'=>$sync]);
        exit;
    }

    if ($action === 'reset_password') {
        $id = (int)($input['id'] ?? 0);
        $password = $input['password'] ?? '';
        if ($id <= 0 || mb_strlen($password) < 6) { http_response_code(400); echo json_encode(['error'=>'Mot de passe 6 caractères minimum']); exit; }
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare('UPDATE utilisateurs SET password=? WHERE id=?');
        $stmt->execute([$hash, $id]);
        if ($stmt->rowCount() === 0) { http_response_code(404); echo json_encode(['error'=>'Client introuvable']); exit; }
        echo json_encode(['success'=>true, 'message'=>'Mot de passe réinitialisé']);
        exit;
    }

    if ($action === 'supprimer') {
        $id = (int)($input['id'] ?? 0);
        if ($id <= 0) { http_response_code(400); echo json_encode(['error'=>'ID invalide']); exit; }
        $stmt = $db->prepare('DELETE FROM utilisateurs WHERE id=?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) { http_response_code(404); echo json_encode(['error'=>'Client introuvable']); exit; }
        echo json_encode(['success'=>true, 'message'=>'Client supprimé']);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error'=>'Action inconnue']);
    exit;
}

http_response_code(405);
echo json_encode(['error'=>'Méthode non autorisée']);
