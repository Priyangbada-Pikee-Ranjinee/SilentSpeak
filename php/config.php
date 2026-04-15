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

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
 
// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Timezone
date_default_timezone_set('Asia/Dhaka');

/**
 * Database connection function
 */
function getDatabaseConnection() {
    static $conn = null;
    
    if ($conn === null) {
        try {
            $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
            
            if ($conn->connect_error) {
                throw new Exception("Connection failed: " . $conn->connect_error);
            }
            
            $conn->set_charset("utf8mb4");
        } catch (Exception $e) {
            // For demo purposes, we'll return a mock connection
            // In production, you would handle this differently
            return null;
        }
    }
    
    return $conn;
}
/**
 * Send JSON response
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

/**
 * Send error response
 */
function sendError($message, $statusCode = 400) {
    sendResponse([
        'success' => false,
        'error' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ], $statusCode);
}
/**
 * Send success response
 */
function sendSuccess($data = [], $message = 'Success') {
    sendResponse([
        'success' => true,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

/**
 * Validate required parameters
 */
function validateRequired($params, $required) {
    foreach ($required as $field) {
        if (!isset($params[$field]) || empty($params[$field])) {
            return "Missing required field: $field";
        }
    }
    return null;
}

/**
 * Sanitize input
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        foreach ($data as $key => $value) {
            $data[$key] = sanitizeInput($value);
        }
    } else {
        $data = trim($data);
        $data = stripslashes($data);
        $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    }
    return $data;
}

/**
 * Generate JWT token
 */
function generateJWT($payload) {
    $header = json_encode(['typ' => 'JWT', 'alg' => JWT_ALGORITHM]);
    $payload['iat'] = time();
    $payload['exp'] = time() + (60 * 60 * 24); // 24 hours
    $payload = json_encode($payload);
    
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}
/**
 * Verify JWT token
 */
function verifyJWT($token) {
    try {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }
        
        $signature = hash_hmac('sha256', $parts[0] . "." . $parts[1], JWT_SECRET, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        if ($base64UrlSignature !== $parts[2]) {
            return false;
        }
        
        $payload = json_decode(base64_decode($parts[1]), true);
        
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }
        
        return $payload;
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Hash password
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => PASSWORD_HASH_COST]);
}

/**
 * Verify password
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Get authorization header
 */
function getAuthorizationHeader() {
    $headers = null;
    
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    
    return $headers;
}

/**
 * Get bearer token
 */
function getBearerToken() {
    $headers = getAuthorizationHeader();
    
    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
    }
    
    return null;
}

/**
 * Require authentication
 */
function requireAuth() {
    $token = getBearerToken();
    
    if (!$token) {
        sendError('Authentication token required', 401);
    }
    
    $payload = verifyJWT($token);
    
    if (!$payload) {
        sendError('Invalid or expired token', 401);
    }
    
    return $payload;
}

?>