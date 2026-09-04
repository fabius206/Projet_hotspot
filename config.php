<?php

// Configuration locale XAMPP. Les variables d'environnement restent prioritaires.
defined('DB_HOST') || define('DB_HOST', getenv('HOTSPOT_DB_HOST') ?: 'localhost');
defined('DB_NAME') || define('DB_NAME', getenv('HOTSPOT_DB_NAME') ?: 'vrai_projet');
defined('DB_USER') || define('DB_USER', getenv('HOTSPOT_DB_USER') ?: 'root');
defined('DB_PASS') || define('DB_PASS', getenv('HOTSPOT_DB_PASSWORD') ?: '');

defined('SESSION_IDLE_MAX') || define('SESSION_IDLE_MAX', 1800);
defined('SESSION_COOKIE_LIFETIME') || define('SESSION_COOKIE_LIFETIME', 0);
