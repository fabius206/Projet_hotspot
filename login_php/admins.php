<?php
require_once __DIR__ . '/_commun.php';
header('Content-Type: application/json');
require_admin();
$currentRole = $_SESSION['role'] ?? '';
$currentId = (int)($_SESSION['user_id'] ?? 0);

$db = db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $rows = $db->query('SELECT id, username, role, photo, creation FROM admins ORDER BY creation DESC')->fetchAll();
  $adminCount = count($rows);
  $superCount = 0;
  foreach ($rows as $r) { if ($r['role'] === 'super_admin') $superCount++; }
  echo json_encode(['admins' => $rows, 'admin_count' => $adminCount, 'super_count' => $superCount]);
  exit;
}

if ($method === 'POST') {
  // Seul super_admin a droit au CRUD comptes
  if ($currentRole !== 'super_admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Action réservée au Super Admin']);
    exit;
  }
  $input = json_decode(file_get_contents('php://input'), true) ?: [];
  $action = $input['action'] ?? '';

  if ($action === 'creer') {
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';
    $role = $input['role'] ?? $input['profil'] ?? 'admin';
    $email = trim($input['email'] ?? '');
    if (!in_array($role, ['admin','super_admin'], true)) $role = 'admin';
    if ($role === 'super_admin' && $currentRole !== 'super_admin') {
      http_response_code(403); echo json_encode(['error' => 'Seul un Super Admin peut créer un Super Admin']); exit;
    }
    if ($username === '' || mb_strlen($username) < 3) {
      http_response_code(400); echo json_encode(['error' => 'Nom d\'utilisateur trop court (3 min)']); exit;
    }
    if (mb_strlen($password) < 6) {
      http_response_code(400); echo json_encode(['error' => 'Mot de passe 6 caractères minimum']); exit;
    }
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
      http_response_code(400); echo json_encode(['error' => 'Email invalide']); exit;
    }
    $check = $db->prepare('SELECT id FROM admins WHERE username = ?');
    $check->execute([$username]);
    if ($check->fetch()) {
      http_response_code(409); echo json_encode(['error' => 'Ce nom existe déjà']); exit;
    }
    if ($email !== '') {
      $check2 = $db->prepare('SELECT id FROM admins WHERE email = ? AND email IS NOT NULL AND email != ""');
      $check2->execute([$email]);
      if ($check2->fetch()) { http_response_code(409); echo json_encode(['error' => 'Cet email existe déjà']); exit; }
    }
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $db->prepare('INSERT INTO admins (username, email, password, role, creation) VALUES (?, ?, ?, ?, NOW())');
    $stmt->execute([$username, $email ?: null, $hash, $role]);
    echo json_encode(['success' => true, 'message' => 'Compte créé']);
    exit;
  }

  if ($action === 'modifier') {
    $id = (int)($input['id'] ?? 0);
    $username = trim($input['username'] ?? '');
    $role = $input['role'] ?? 'admin';
    if (!in_array($role, ['admin','super_admin'], true)) $role = 'admin';
    if ($role === 'super_admin' && $currentRole !== 'super_admin') {
      http_response_code(403); echo json_encode(['error' => 'Seul un Super Admin peut attribuer ce rôle']); exit;
    }
    if ($id <= 0 || mb_strlen($username) < 3) {
      http_response_code(400); echo json_encode(['error' => 'Données invalides']); exit;
    }
    // Empêche de rétrograder le dernier super_admin
    $cur = $db->prepare('SELECT role FROM admins WHERE id = ?');
    $cur->execute([$id]);
    $old = $cur->fetch();
    if (!$old) { http_response_code(404); echo json_encode(['error' => 'Introuvable']); exit; }
    if ($old['role'] === 'super_admin' && $currentRole !== 'super_admin') {
      http_response_code(403); echo json_encode(['error' => 'Seul un Super Admin peut modifier un Super Admin']); exit;
    }
    if ($id === $currentId && $role !== $old['role']) {
      http_response_code(400); echo json_encode(['error' => 'Vous ne pouvez pas changer votre propre rôle']); exit;
    }
    if ($old['role'] === 'super_admin' && $role !== 'super_admin') {
      $cnt = $db->query("SELECT COUNT(*) FROM admins WHERE role='super_admin'")->fetchColumn();
      if ($cnt <= 1) { http_response_code(400); echo json_encode(['error' => 'Impossible de rétrograder le dernier super_admin']); exit; }
    }
    $check = $db->prepare('SELECT id FROM admins WHERE username = ? AND id != ?');
    $check->execute([$username, $id]);
    if ($check->fetch()) { http_response_code(409); echo json_encode(['error' => 'Ce nom existe déjà']); exit; }
    $stmt = $db->prepare('UPDATE admins SET username = ?, role = ? WHERE id = ?');
    $stmt->execute([$username, $role, $id]);
    echo json_encode(['success' => true, 'message' => 'Compte modifié']);
    exit;
  }

  if ($action === 'reset_password') {
    $id = (int)($input['id'] ?? 0);
    $password = $input['password'] ?? '';
    if ($id <= 0 || mb_strlen($password) < 6) {
      http_response_code(400); echo json_encode(['error' => 'Mot de passe 6 caractères minimum']); exit;
    }
    if ($id === $currentId) {
      http_response_code(400); echo json_encode(['error' => 'Utilisez Paramètres pour changer votre propre mot de passe']); exit;
    }
    $target = $db->prepare('SELECT role FROM admins WHERE id = ?');
    $target->execute([$id]);
    $t = $target->fetch();
    if ($t && $t['role'] === 'super_admin' && $currentRole !== 'super_admin') {
      http_response_code(403); echo json_encode(['error' => 'Seul un Super Admin peut réinitialiser un Super Admin']); exit;
    }
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $db->prepare('UPDATE admins SET password = ? WHERE id = ?');
    $stmt->execute([$hash, $id]);
    echo json_encode(['success' => true, 'message' => 'Mot de passe réinitialisé']);
    exit;
  }

  if ($action === 'supprimer') {
    $id = (int)($input['id'] ?? 0);
    if ($id === $currentId) {
      http_response_code(400); echo json_encode(['error' => 'Vous ne pouvez pas vous supprimer']); exit;
    }
    $cur = $db->prepare('SELECT role FROM admins WHERE id = ?');
    $cur->execute([$id]);
    $row = $cur->fetch();
    if (!$row) { http_response_code(404); echo json_encode(['error' => 'Introuvable']); exit; }
    if ($row['role'] === 'super_admin' && $currentRole !== 'super_admin') {
      http_response_code(403); echo json_encode(['error' => 'Seul un Super Admin peut supprimer un Super Admin']); exit;
    }
    if ($row['role'] === 'super_admin') {
      $cnt = $db->query("SELECT COUNT(*) FROM admins WHERE role='super_admin'")->fetchColumn();
      if ($cnt <= 1) { http_response_code(400); echo json_encode(['error' => 'Impossible de supprimer le dernier super_admin']); exit; }
    }
    $stmt = $db->prepare('DELETE FROM admins WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'message' => 'Compte supprimé']);
    exit;
  }

  http_response_code(400);
  echo json_encode(['error' => 'Action inconnue']);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'Méthode non autorisée']);
