<?php

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'silentspeak_user');
define('DB_PASS', 'secure_password_123');
define('DB_NAME', 'silent_speak_db');

// Application settings
define('APP_NAME', 'Silent Speak');
define('APP_VERSION', '1.0.0');
define('APP_URL', 'http://localhost/silent-speak');

// Security settings
define('JWT_SECRET', 'your_jwt_secret_key_here_change_in_production');
define('JWT_ALGORITHM', 'HS256');
define('PASSWORD_HASH_COST', 12);

// CORS settings
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

?>