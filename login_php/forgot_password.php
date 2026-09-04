<?php
require_once __DIR__ . '/_commun.php';
security_headers();
header('Content-Type: application/json; charset=utf-8');

// N'accepte que POST
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

$db = db();

// Crée la table de réinitialisation si nécessaire
$db->exec("CREATE TABLE IF NOT EXISTS password_resets (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    account_id        INT NOT NULL,
    account_type      ENUM('admin', 'utilisateur') NOT NULL,
    email_or_username VARCHAR(255) NOT NULL,
    otp_code          VARCHAR(10) NOT NULL,
    token             VARCHAR(64) NOT NULL,
    expires_at        DATETIME NOT NULL,
    used              TINYINT(1) DEFAULT 0,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_otp (otp_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$raw = file_get_contents('php://input');
$input = json_decode($raw, true) ?: $_POST;
$action = trim($input['action'] ?? 'request');

// Helper JSON
function ok($data = []) {
    echo json_encode(array_merge(['success' => true], $data));
    exit;
}
function err($msg, $code = 400, $extra = []) {
    http_response_code($code);
    echo json_encode(array_merge(['error' => $msg, 'success' => false], $extra));
    exit;
}

// ══════════════════════════════════════════════════════════════════════
// ACTION 1 : REQUEST — Demande de code de réinitialisation
// ══════════════════════════════════════════════════════════════════════
if ($action === 'request') {
    $username = trim($input['username'] ?? '');
    if ($username === '') {
        err('Veuillez saisir votre identifiant ou adresse email.');
    }

    // 1) Cherche dans admins
    $stmt = $db->prepare('SELECT id, username FROM admins WHERE username = ? LIMIT 1');
    $stmt->execute([$username]);
    $admin = $stmt->fetch();

    // 2) Cherche dans utilisateurs (username ou email ou telephone)
    $stmt2 = $db->prepare('SELECT id, username, email FROM utilisateurs WHERE username = ? OR email = ? OR telephone = ? LIMIT 1');
    $stmt2->execute([$username, $username, $username]);
    $user = $stmt2->fetch();

    $accountId = null;
    $accountType = null;
    $targetEmailOrUser = $username;

    if ($admin) {
        $accountId = (int)$admin['id'];
        $accountType = 'admin';
        $targetEmailOrUser = $admin['username'];
    } elseif ($user) {
        $accountId = (int)$user['id'];
        $accountType = 'utilisateur';
        $targetEmailOrUser = $user['email'] ?: $user['username'];
    }

    if (!$accountId) {
        // Pour éviter le bruteforce d'énumération de comptes, on temporise
        usleep(300000);
        err("Aucun compte actif trouvé avec cet identifiant.", 404);
    }

    // Génère code OTP à 6 chiffres
    $otp = (string)random_int(100000, 999999);
    $token = bin2hex(random_bytes(24));
    $expiresAt = date('Y-m-d H:i:s', time() + (15 * 60)); // 15 minutes

    // Invalide les anciens tokens pour ce compte
    $db->prepare("UPDATE password_resets SET used = 1 WHERE account_id = ? AND account_type = ?")
       ->execute([$accountId, $accountType]);

    // Insère le nouveau code
    $ins = $db->prepare("INSERT INTO password_resets (account_id, account_type, email_or_username, otp_code, token, expires_at) VALUES (?, ?, ?, ?, ?, ?)");
    $ins->execute([$accountId, $accountType, $targetEmailOrUser, $otp, $token, $expiresAt]);

    // Tente l'envoi d'email si une adresse email est détectée
    $emailSent = false;
    if (filter_var($targetEmailOrUser, FILTER_VALIDATE_EMAIL)) {
        $subject = "Code de réinitialisation de mot de passe — Hotspot Diego";
        $bodyMsg = "Bonjour,\n\nVotre code de vérification pour réinitialiser votre mot de passe est : $otp\nCe code expire dans 15 minutes.\n\nCordialement,\nL'équipe Hotspot Diego";
        $headers = "From: noreply@hotspot-diego.local\r\nContent-Type: text/plain; charset=UTF-8";
        $emailSent = @mail($targetEmailOrUser, $subject, $bodyMsg, $headers);
    }

    ok([
        'message' => 'Code de vérification généré avec succès !',
        'token' => $token,
        'target' => $targetEmailOrUser,
        // Fourni directement pour l'expérience fluide et autonome en environnement local/XAMPP
        'demo_code' => $otp,
        'expires_in' => 15
    ]);
}

// ══════════════════════════════════════════════════════════════════════
// ACTION 2 : VERIFY — Vérifie le code OTP saisi
// ══════════════════════════════════════════════════════════════════════
if ($action === 'verify') {
    $token = trim($input['token'] ?? '');
    $otp   = trim($input['otp'] ?? '');

    if ($token === '' || $otp === '') {
        err('Token ou code de vérification manquant.');
    }

    $stmt = $db->prepare("SELECT id, expires_at, used FROM password_resets WHERE token = ? AND otp_code = ? LIMIT 1");
    $stmt->execute([$token, $otp]);
    $row = $stmt->fetch();

    if (!$row) {
        err('Code de vérification invalide.', 400);
    }
    if ($row['used']) {
        err('Ce code a déjà été utilisé. Veuillez faire une nouvelle demande.', 400);
    }
    if (strtotime($row['expires_at']) < time()) {
        err('Ce code a expiré. Veuillez refaire une demande.', 400);
    }

    ok(['message' => 'Code valide. Vous pouvez maintenant définir votre nouveau mot de passe.']);
}

// ══════════════════════════════════════════════════════════════════════
// ACTION 3 : RESET — Application du nouveau mot de passe
// ══════════════════════════════════════════════
if ($action === 'reset') {
    $token    = trim($input['token'] ?? '');
    $otp      = trim($input['otp'] ?? '');
    $password = (string)($input['new_password'] ?? '');

    if ($token === '' || $otp === '') {
        err('Paramètres de sécurité manquants.');
    }
    if (mb_strlen($password) < 6) {
        err('Le nouveau mot de passe doit comporter au moins 6 caractères.');
    }

    $stmt = $db->prepare("SELECT id, account_id, account_type, expires_at, used FROM password_resets WHERE token = ? AND otp_code = ? LIMIT 1");
    $stmt->execute([$token, $otp]);
    $row = $stmt->fetch();

    if (!$row) {
        err('Code ou session de réinitialisation invalide.', 400);
    }
    if ($row['used']) {
        err('Ce code a déjà été utilisé.', 400);
    }
    if (strtotime($row['expires_at']) < time()) {
        err('Ce code a expiré. Veuillez refaire une demande.', 400);
    }

    // Nouveau hash sécurisé
    $newHash = password_hash($password, PASSWORD_DEFAULT);

    if ($row['account_type'] === 'admin') {
        $up = $db->prepare("UPDATE admins SET password = ? WHERE id = ?");
        $up->execute([$newHash, $row['account_id']]);
    } else {
        $up = $db->prepare("UPDATE utilisateurs SET password = ? WHERE id = ?");
        $up->execute([$newHash, $row['account_id']]);
    }

    // Marque le token comme consommé
    $db->prepare("UPDATE password_resets SET used = 1 WHERE id = ?")->execute([$row['id']]);

    // Réinitialise d'éventuels blocages de tentatives
    rate_limit_reset();

    ok([
        'message' => 'Votre mot de passe a été modifié avec succès ! Vous pouvez à présent vous connecter.'
    ]);
}

err('Action inconnue.');
