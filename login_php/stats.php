<?php
require_once __DIR__ . '/_commun.php';
header('Content-Type: application/json');
require_admin();

$db = db();

$db->query("UPDATE vouchers SET status = 'expire' WHERE status = 'actif' AND expire_at IS NOT NULL AND expire_at < NOW()");

$parStatut = $db->query(
  'SELECT status, COUNT(*) AS nb FROM vouchers GROUP BY status'
)->fetchAll(PDO::FETCH_KEY_PAIR);

$compteurs = [
  'non_utilise' => (int)($parStatut['non_utilise'] ?? 0),
  'actif' => (int)($parStatut['actif'] ?? 0),
  'expire' => (int)($parStatut['expire'] ?? 0),
  'desactive' => (int)($parStatut['desactive'] ?? 0),
];

$totalGenere = (int)$db->query(
  "SELECT COALESCE(SUM(p.prix), 0) FROM vouchers v JOIN plans p ON p.id = v.plan_id"
)->fetchColumn();

$revenusJour = (int)$db->query(
  "SELECT COALESCE(SUM(p.prix), 0) FROM vouchers v JOIN plans p ON p.id = v.plan_id
   WHERE DATE(v.created_at) = CURDATE()"
)->fetchColumn();

$semaine = $db->query(
  "SELECT DATE_FORMAT(d.jour, '%d/%m') AS jour,
          COALESCE(SUM(p.prix), 0) AS total
   FROM (
     SELECT CURDATE() AS jour UNION SELECT DATE_SUB(CURDATE(), INTERVAL 1 DAY)
     UNION SELECT DATE_SUB(CURDATE(), INTERVAL 2 DAY) UNION SELECT DATE_SUB(CURDATE(), INTERVAL 3 DAY)
     UNION SELECT DATE_SUB(CURDATE(), INTERVAL 4 DAY) UNION SELECT DATE_SUB(CURDATE(), INTERVAL 5 DAY)
     UNION SELECT DATE_SUB(CURDATE(), INTERVAL 6 DAY)
   ) d
   LEFT JOIN vouchers v ON DATE(v.created_at) = d.jour
   LEFT JOIN plans p ON p.id = v.plan_id
   GROUP BY d.jour ORDER BY d.jour ASC"
)->fetchAll(PDO::FETCH_ASSOC);

// Fréquentation : nombre de codes créés par jour (7 derniers jours)
$frequentation = $db->query(
  "SELECT DATE_FORMAT(d.jour, '%d/%m') AS jour, COUNT(v.id) AS nb
   FROM (
     SELECT CURDATE() AS jour UNION SELECT DATE_SUB(CURDATE(), INTERVAL 1 DAY)
     UNION SELECT DATE_SUB(CURDATE(), INTERVAL 2 DAY) UNION SELECT DATE_SUB(CURDATE(), INTERVAL 3 DAY)
     UNION SELECT DATE_SUB(CURDATE(), INTERVAL 4 DAY) UNION SELECT DATE_SUB(CURDATE(), INTERVAL 5 DAY)
     UNION SELECT DATE_SUB(CURDATE(), INTERVAL 6 DAY)
   ) d
   LEFT JOIN vouchers v ON DATE(v.created_at) = d.jour
   GROUP BY d.jour ORDER BY d.jour ASC"
)->fetchAll(PDO::FETCH_ASSOC);

// Usage : répartition par statut déjà dans compteurs, + courbe d'usage heures (simulée via actifs)
$usage = $db->query(
  "SELECT DATE_FORMAT(d.jour, '%d/%m') AS jour, COUNT(CASE WHEN v.status='actif' THEN 1 END) AS actifs
   FROM (
     SELECT CURDATE() AS jour UNION SELECT DATE_SUB(CURDATE(), INTERVAL 1 DAY)
     UNION SELECT DATE_SUB(CURDATE(), INTERVAL 2 DAY) UNION SELECT DATE_SUB(CURDATE(), INTERVAL 3 DAY)
     UNION SELECT DATE_SUB(CURDATE(), INTERVAL 4 DAY) UNION SELECT DATE_SUB(CURDATE(), INTERVAL 5 DAY)
     UNION SELECT DATE_SUB(CURDATE(), INTERVAL 6 DAY)
   ) d
   LEFT JOIN vouchers v ON DATE(v.used_at) = d.jour
   GROUP BY d.jour ORDER BY d.jour ASC"
)->fetchAll(PDO::FETCH_ASSOC);

$offres = $db->query(
  'SELECT p.nom, COUNT(v.id) AS nb_codes, COALESCE(SUM(p.prix), 0) AS total
   FROM plans p
   LEFT JOIN vouchers v ON v.plan_id = p.id
   GROUP BY p.id, p.nom
   ORDER BY total DESC'
)->fetchAll(PDO::FETCH_ASSOC);

$adminCount = (int)$db->query("SELECT COUNT(*) FROM admins")->fetchColumn();
$superCount = (int)$db->query("SELECT COUNT(*) FROM admins WHERE role='super_admin'")->fetchColumn();
$userCount = (int)$db->query("SELECT COUNT(*) FROM utilisateurs")->fetchColumn();

echo json_encode([
  'compteurs' => $compteurs,
  'total_genere' => $totalGenere,
  'revenus_jour' => $revenusJour,
  'semaine' => $semaine,
  'frequentation' => $frequentation,
  'usage' => $usage,
  'offres' => $offres,
  'admin_count' => $adminCount,
  'super_count' => $superCount,
  'user_count' => $userCount,
]);
