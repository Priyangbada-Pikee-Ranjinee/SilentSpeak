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

/**
 * Login user
 */
function loginUser() {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendError('Invalid JSON input', 400);
    }
    
    // Validate required fields
    $required = ['email', 'password'];
    $error = validateRequired($input, $required);
    
    if ($error) {
        sendError($error, 400);
    }
    
    // Sanitize input
    $email = sanitizeInput($input['email']);
    $password = $input['password'];
    
    $conn = getDatabaseConnection();
    
    if ($conn) {
        // Get user from database
        $stmt = $conn->prepare("
            SELECT id, email, password_hash, first_name, last_name, role, 
                   is_active, is_verified, settings
            FROM users 
            WHERE email = ?
        ");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            sendError('Invalid email or password', 401);
        }
        
        $user = $result->fetch_assoc();
        
        // Verify password
        if (!verifyPassword($password, $user['password_hash'])) {
            sendError('Invalid email or password', 401);
        }
        
        // Check if user is active
        if (!$user['is_active']) {
            sendError('Account is deactivated', 403);
        }
        
        // Generate JWT token
        $token = generateJWT([
            'userId' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role']
        ]);
        
        // Log activity
        logActivity($user['id'], 'User Login', 'User logged in successfully');
        
        // Update last login (you would add a last_login field to users table)
        
        sendSuccess([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'firstName' => $user['first_name'],
                'lastName' => $user['last_name'],
                'role' => $user['role'],
                'isVerified' => (bool)$user['is_verified'],
                'settings' => json_decode($user['settings'], true)
            ]
        ], 'Login successful');
        
        $stmt->close();
    } else {
        // Demo mode - simulate login
        // For demo, accept any password for demo@example.com
        if ($email === 'demo@example.com') {
            $token = generateJWT([
                'userId' => 1,
                'email' => $email,
                'role' => 'student'
            ]);
            
            sendSuccess([
                'token' => $token,
                'user' => [
                    'id' => 1,
                    'email' => $email,
                    'firstName' => 'Demo',
                    'lastName' => 'User',
                    'role' => 'student',
                    'isVerified' => true,
                    'settings' => [
                        'accessibility' => [
                            'fontSize' => 'medium',
                            'colorTheme' => 'default',
                            'highContrast' => false
                        ]
                    ]
                ]
            ], 'Login successful (demo mode)');
        } else {
            sendError('Invalid email or password', 401);
        }
    }
}

/**
 * Logout user
 */
function logoutUser() {
    $payload = requireAuth();
    
    // In a real app, you might add the token to a blacklist
    // For now, we'll just log the activity
    
    logActivity($payload['userId'], 'User Logout', 'User logged out');
    
    sendSuccess([], 'Logout successful');
}

/**
 * Refresh JWT token
 */
function refreshToken() {
    $payload = requireAuth();
    
    // Generate new token with same payload but new expiration
    $newToken = generateJWT([
        'userId' => $payload['userId'],
        'email' => $payload['email'],
        'role' => $payload['role']
    ]);
    
    sendSuccess([
        'token' => $newToken
    ], 'Token refreshed');
}

/**
 * Forgot password
 */
function forgotPassword() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email'])) {
        sendError('Email is required', 400);
    }
    
    $email = sanitizeInput($input['email']);
    
    // In a real app, you would:
    // 1. Check if email exists
    // 2. Generate reset token
    // 3. Send email with reset link
    // 4. Store reset token in database with expiration
    
    // For demo, just return success
    sendSuccess([], 'If an account exists with this email, a password reset link has been sent');
}

/**
 * Reset password
 */
function resetPassword() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendError('Invalid JSON input', 400);
    }
    
    $required = ['token', 'newPassword'];
    $error = validateRequired($input, $required);
    
    if ($error) {
        sendError($error, 400);
    }
    
    $token = sanitizeInput($input['token']);
    $newPassword = $input['newPassword'];
    
    // Validate password strength
    if (strlen($newPassword) < 8) {
        sendError('Password must be at least 8 characters long', 400);
    }
    
    // In a real app, you would:
    // 1. Verify reset token from database
    // 2. Check if token is expired
    // 3. Update user's password
    // 4. Invalidate all existing sessions
    
    // For demo, just return success
    sendSuccess([], 'Password reset successful');
}


/**
 * Verify JWT token
 */
function verifyToken() {
    $token = getBearerToken();
    
    if (!$token) {
        sendError('Token required', 401);
    }
    
    $payload = verifyJWT($token);
    
    if (!$payload) {
        sendError('Invalid or expired token', 401);
    }
    
    sendSuccess([
        'valid' => true,
        'user' => [
            'userId' => $payload['userId'],
            'email' => $payload['email'],
            'role' => $payload['role']
        ]
    ], 'Token is valid');
}

/**
 * Get user profile
 */
function getProfile() {
    $payload = requireAuth();
    $userId = $payload['userId'];
    
    $conn = getDatabaseConnection();
    
    if ($conn) {
        $stmt = $conn->prepare("
            SELECT id, email, first_name, last_name, phone, date_of_birth,
                   gender, role, institution, department, semester, bio,
                   disabilities, settings, profile_image, is_verified,
                   created_at, updated_at
            FROM users 
            WHERE id = ?
        ");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            sendError('User not found', 404);
        }
        
        $user = $result->fetch_assoc();
        
        // Convert JSON fields
        $user['disabilities'] = json_decode($user['disabilities'], true);
        $user['settings'] = json_decode($user['settings'], true);
        
        // Remove sensitive data
        unset($user['password_hash']);
        
        sendSuccess([
            'profile' => $user
        ], 'Profile retrieved successfully');
        
        $stmt->close();
    } else {
        // Demo mode - return demo profile
        sendSuccess([
            'profile' => [
                'id' => $userId,
                'email' => 'demo@example.com',
                'first_name' => 'Demo',
                'last_name' => 'User',
                'phone' => '+880 1234 567890',
                'date_of_birth' => '2000-01-01',
                'gender' => 'male',
                'role' => 'student',
                'institution' => 'University of Dhaka',
                'department' => 'Computer Science',
                'semester' => '5',
                'bio' => 'Demo user for Silent Speak application',
                'disabilities' => [
                    'primary' => 'Hearing Impairment',
                    'additional' => ['Color Blindness'],
                    'assistiveTech' => ['Screen Reader']
                ],
                'settings' => [
                    'accessibility' => [
                        'fontSize' => 'medium',
                        'colorTheme' => 'default',
                        'highContrast' => false
                    ]
                ],
                'profile_image' => null,
                'is_verified' => true,
                'created_at' => '2023-01-01 00:00:00',
                'updated_at' => '2023-10-01 00:00:00'
            ]
        ], 'Profile retrieved (demo mode)');
    }
}

/**
 * Log activity
 */
function logActivity($userId, $activityType, $details) {
    $conn = getDatabaseConnection();
    
    if (!$conn) {
        return;
    }
    
    $deviceInfo = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : 'Unknown';
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
    
    $stmt = $conn->prepare("
        INSERT INTO activity_logs (user_id, activity_type, details, device_info, ip_address)
        VALUES (?, ?, ?, ?, ?)
    ");
    
    $stmt->bind_param("issss", $userId, $activityType, $details, $deviceInfo, $ipAddress);
    $stmt->execute();
    $stmt->close();
}
?>