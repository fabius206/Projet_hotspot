<?php
require_once __DIR__ . '/../login_php/_commun.php';
require_permission('vouchers');
header('Location: codes.php');
exit;
