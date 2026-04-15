<?php
/**
 * Authentication API Endpoints for Silent Speak
 */

require_once '../config.php';

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Handle different request methods
switch ($method) {
    case 'POST':
        handlePostRequest();
        break;
    case 'GET':
        handleGetRequest();
        break;
    default:
        sendError('Method not allowed', 405);
}

/**
 * Handle POST requests
 */ 
function handlePostRequest() {
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    switch ($action) {
        case 'register':
            registerUser();
            break;
        case 'login':
            loginUser();
            break;
        case 'logout':
            logoutUser();
            break;
        case 'refresh':
            refreshToken();
            break;
        case 'forgot-password':
            forgotPassword();
            break;
        case 'reset-password':
            resetPassword();
            break;
        default:
            sendError('Invalid action', 400);
    }
}

/**
 * Handle GET requests
 */
function handleGetRequest() {
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    switch ($action) {
        case 'verify':
            verifyToken();
            break;
        case 'profile':
            getProfile();
            break;
        default:
            sendError('Invalid action', 400);
    }
}

/**
 * Register a new user
 */
function registerUser() {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendError('Invalid JSON input', 400);
    }
    
    // Validate required fields
    $required = ['email', 'password', 'firstName', 'lastName', 'role'];
    $error = validateRequired($input, $required);
    
    if ($error) {
        sendError($error, 400);
    }
    
    // Sanitize input
    $email = sanitizeInput($input['email']);
    $password = $input['password'];
    $firstName = sanitizeInput($input['firstName']);
    $lastName = sanitizeInput($input['lastName']);
    $role = sanitizeInput($input['role']);
    
    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendError('Invalid email address', 400);
    }
    
    // Validate password strength
    if (strlen($password) < 8) {
        sendError('Password must be at least 8 characters long', 400);
    }
    
    // Check if user already exists
    $conn = getDatabaseConnection();
    
    if ($conn) {
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            sendError('Email already registered', 409);
        }
        
        // Hash password
        $passwordHash = hashPassword($password);
        
        // Prepare disabilities data
        $disabilities = isset($input['disabilities']) ? json_encode($input['disabilities']) : json_encode([]);
        
        // Prepare settings data
        $settings = isset($input['settings']) ? json_encode($input['settings']) : json_encode([
            'accessibility' => [
                'fontSize' => 'medium',
                'colorTheme' => 'default',
                'highContrast' => false
            ]
        ]);
        
        // Insert new user
        $stmt = $conn->prepare("
            INSERT INTO users (
                email, password_hash, first_name, last_name, role,
                phone, date_of_birth, gender, institution, department,
                semester, bio, disabilities, settings
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $phone = isset($input['phone']) ? sanitizeInput($input['phone']) : null;
        $dob = isset($input['dateOfBirth']) ? sanitizeInput($input['dateOfBirth']) : null;
        $gender = isset($input['gender']) ? sanitizeInput($input['gender']) : 'prefer-not-to-say';
        $institution = isset($input['institution']) ? sanitizeInput($input['institution']) : null;
        $department = isset($input['department']) ? sanitizeInput($input['department']) : null;
        $semester = isset($input['semester']) ? sanitizeInput($input['semester']) : null;
        $bio = isset($input['bio']) ? sanitizeInput($input['bio']) : null;
        
        $stmt->bind_param(
            "ssssssssssssss",
            $email, $passwordHash, $firstName, $lastName, $role,
            $phone, $dob, $gender, $institution, $department,
            $semester, $bio, $disabilities, $settings
        );
        
        if ($stmt->execute()) {
            $userId = $stmt->insert_id;
            
            // Generate JWT token
            $token = generateJWT([
                'userId' => $userId,
                'email' => $email,
                'role' => $role
            ]);
            
            // Log activity
            logActivity($userId, 'User Registration', 'New user registered');
            
            sendSuccess([
                'token' => $token,
                'user' => [
                    'id' => $userId,
                    'email' => $email,
                    'firstName' => $firstName,
                    'lastName' => $lastName,
                    'role' => $role,
                    'isVerified' => false
                ]
            ], 'Registration successful');
        } else {
            sendError('Registration failed: ' . $stmt->error, 500);
        }
        
        $stmt->close();
    } else {
        // Demo mode - simulate registration
        $token = generateJWT([
            'userId' => 1,
            'email' => $email,
            'role' => $role
        ]);
        
        sendSuccess([
            'token' => $token,
            'user' => [
                'id' => 1,
                'email' => $email,
                'firstName' => $firstName,
                'lastName' => $lastName,
                'role' => $role,
                'isVerified' => false
            ]
        ], 'Registration successful (demo mode)');
    }
}
?>