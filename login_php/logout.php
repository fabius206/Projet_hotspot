<?php
require_once __DIR__ . '/_commun.php';
$_SESSION = [];
session_destroy();
header('Location: ../index.html');
exit;
