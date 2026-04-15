<?php
/**
 * Sessions API Endpoint for Silent Speak
 * Handles live session creation, joining, management, and caption data
 */

require_once __DIR__ . '/../config.php';

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Route the request
switch ($method) {
    case 'POST':
        handlePostRequest();
        break;
    case 'GET':
        handleGetRequest();
        break;
    case 'PUT':
        handlePutRequest();
        break;
    case 'DELETE':
        handleDeleteRequest();
        break;
    default:
        sendError('Method not allowed', 405);
}
 
/**
 * Handle POST requests
 */
function handlePostRequest() {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'create':
            createSession();
            break;
        case 'join':
            joinSession();
            break;
        case 'leave':
            leaveSession();
            break;
        case 'caption':
            addCaption();
            break;
        case 'message':
            sendMessage();
            break;
        case 'task':
            createTask();
            break;
        default:
            sendError('Invalid action specified', 400);
    }
}

/**
 * Handle GET requests
 */
function handleGetRequest() {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'list':
            listSessions();
            break;
        case 'details':
            getSessionDetails();
            break;
        case 'participants':
            getParticipants();
            break;
        case 'captions':
            getCaptions();
            break;
        case 'messages':
            getMessages();
            break;
        case 'tasks':
            getTasks();
            break;
        case 'active':
            getActiveSessions();
            break;
        default:
            sendError('Invalid action specified', 400);
    }
}

/**
 * Handle PUT requests
 */
function handlePutRequest() {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'update':
            updateSession();
            break;
        case 'end':
            endSession();
            break;
        case 'task':
            updateTask();
            break;
        default:
            sendError('Invalid action specified', 400);
    }
}

/**
 * Handle DELETE requests
 */
function handleDeleteRequest() {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'delete':
            deleteSession();
            break;
        case 'task':
            deleteTask();
            break;
        default:
            sendError('Invalid action specified', 400);
    }
}

/**
 * Create a new session (teacher only)
 */
function createSession() {
    $user = requireAuth();
    
    // Check if user is a teacher
    if ($user->role !== 'teacher') {
        sendError('Only teachers can create sessions', 403);
    }
    
    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required = ['subject'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            sendError("Missing required field: $field", 400);
        }
    }
    
    // Generate unique session code
    $sessionCode = generateSessionCode();
    $subject = $data['subject'];
    $language = $data['language'] ?? 'en';
    $description = $data['description'] ?? '';
    
    $conn = getDatabaseConnection();
    if (!$conn) {
        sendError('Database connection failed', 500);
    }
    
    // Insert session
    $stmt = $conn->prepare("
        INSERT INTO sessions (session_code, teacher_id, subject, language, description)
        VALUES (?, ?, ?, ?, ?)
    ");
    
    $stmt->bind_param("sisss", $sessionCode, $user->id, $subject, $language, $description);
    
    if ($stmt->execute()) {
        $sessionId = $conn->insert_id;
        
        // Get the created session
        $result = $conn->query("
            SELECT s.*, u.first_name, u.last_name, u.email as teacher_email
            FROM sessions s
            JOIN users u ON s.teacher_id = u.id
            WHERE s.id = $sessionId
        ");
        
        $session = $result->fetch_assoc();
        
        sendSuccess([
            'session' => $session,
            'session_code' => $sessionCode
        ], 'Session created successfully');
    } else {
        sendError('Failed to create session: ' . $stmt->error, 500);
    }
}

/**
 * Join an existing session (student)
 */
function joinSession() {
    $user = requireAuth();
    
    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (empty($data['session_code'])) {
        sendError('Session code is required', 400);
    }
    
    $sessionCode = $data['session_code'];
    
    $conn = getDatabaseConnection();
    if (!$conn) {
        sendError('Database connection failed', 500);
    }
    
    // Check if session exists and is active
    $stmt = $conn->prepare("
        SELECT s.*, u.first_name as teacher_name, u.last_name as teacher_last_name
        FROM sessions s
        JOIN users u ON s.teacher_id = u.id
        WHERE s.session_code = ? AND s.is_active = TRUE
    ");
    
    $stmt->bind_param("s", $sessionCode);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendError('Session not found or inactive', 404);
    }
    
    $session = $result->fetch_assoc();
    
    // Check if student is already in session
    $checkStmt = $conn->prepare("
        SELECT * FROM session_participants
        WHERE session_id = ? AND student_id = ? AND left_at IS NULL
    ");
    
    $checkStmt->bind_param("ii", $session['id'], $user->id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows > 0) {
        sendError('You are already in this session', 400);
    }
    
    // Join the session
    $joinStmt = $conn->prepare("
        INSERT INTO session_participants (session_id, student_id)
        VALUES (?, ?)
    ");
    
    $joinStmt->bind_param("ii", $session['id'], $user->id);
    
    if ($joinStmt->execute()) {
        // Log activity
        logActivity($user->id, 'session_join', "Joined session: $sessionCode");
        
        sendSuccess([
            'session' => $session,
            'joined_at' => date('Y-m-d H:i:s')
        ], 'Successfully joined session');
    } else {
        sendError('Failed to join session: ' . $joinStmt->error, 500);
    }
}

/**
 * Leave a session
 */
function leaveSession() {
    $user = requireAuth();
    
    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (empty($data['session_id'])) {
        sendError('Session ID is required', 400);
    }
    
    $sessionId = $data['session_id'];
    
    $conn = getDatabaseConnection();
    if (!$conn) {
        sendError('Database connection failed', 500);
    }
    
    // Update participant record
    $stmt = $conn->prepare("
        UPDATE session_participants
        SET left_at = NOW()
        WHERE session_id = ? AND student_id = ? AND left_at IS NULL
    ");
    
    $stmt->bind_param("ii", $sessionId, $user->id);
    
    if ($stmt->execute() && $stmt->affected_rows > 0) {
        // Log activity
        logActivity($user->id, 'session_leave', "Left session ID: $sessionId");
        
        sendSuccess([], 'Successfully left session');
    } else {
        sendError('Failed to leave session or not in session', 400);
    }
}

/**
 * Add caption to session
 */
function addCaption() {
    $user = requireAuth();
    
    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required = ['session_id', 'text', 'language'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            sendError("Missing required field: $field", 400);
        }
    }
    
    $sessionId = $data['session_id'];
    $text = $data['text'];
    $language = $data['language'];
    $confidence = $data['confidence'] ?? 1.0;
    $is_final = $data['is_final'] ?? true;
    
    $conn = getDatabaseConnection();
    if (!$conn) {
        sendError('Database connection failed', 500);
    }
    
    // Check if user has permission to add captions (teacher or participant)
    if ($user->role === 'teacher') {
        // Teacher is always allowed
    } else {
        // Check if student is in the session
        $checkStmt = $conn->prepare("
            SELECT * FROM session_participants
            WHERE session_id = ? AND student_id = ? AND left_at IS NULL
        ");
        
        $checkStmt->bind_param("ii", $sessionId, $user->id);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows === 0) {
            sendError('You are not in this session', 403);
        }
    }
    
    // Insert caption
    $stmt = $conn->prepare("
        INSERT INTO captions (session_id, user_id, text, language, confidence, is_final)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->bind_param("iissdi", $sessionId, $user->id, $text, $language, $confidence, $is_final);
    
    if ($stmt->execute()) {
        $captionId = $conn->insert_id;
        
        // Get the created caption
        $result = $conn->query("
            SELECT c.*, u.first_name, u.last_name
            FROM captions c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = $captionId
        ");
        
        $caption = $result->fetch_assoc();
        
        // Broadcast to other participants (in a real app, you'd use WebSockets)
        broadcastCaption($sessionId, $caption);
        
        sendSuccess([
            'caption' => $caption
        ], 'Caption added successfully');
    } else {
        sendError('Failed to add caption: ' . $stmt->error, 500);
    }
}

/**
 * Send message in session
 */
function sendMessage() {
    $user = requireAuth();
    
    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required = ['session_id', 'message'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            sendError("Missing required field: $field", 400);
        }
    }
    
    $sessionId = $data['session_id'];
    $message = $data['message'];
    $recipient_id = $data['recipient_id'] ?? null; // null for broadcast
    
    $conn = getDatabaseConnection();
    if (!$conn) {
        sendError('Database connection failed', 500);
    }
    
    // Check if user is in the session
    if ($user->role === 'teacher') {
        // Teacher is always allowed
    } else {
        $checkStmt = $conn->prepare("
            SELECT * FROM session_participants
            WHERE session_id = ? AND student_id = ? AND left_at IS NULL
        ");
        
        $checkStmt->bind_param("ii", $sessionId, $user->id);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows === 0) {
            sendError('You are not in this session', 403);
        }
    }
    
    // Insert message
    $stmt = $conn->prepare("
        INSERT INTO session_messages (session_id, sender_id, recipient_id, message)
        VALUES (?, ?, ?, ?)
    ");
    
    $stmt->bind_param("iiis", $sessionId, $user->id, $recipient_id, $message);
    
    if ($stmt->execute()) {
        $messageId = $conn->insert_id;
        
        // Get the created message
        $result = $conn->query("
            SELECT m.*, 
                   s.first_name as sender_first_name, 
                   s.last_name as sender_last_name,
                   r.first_name as recipient_first_name,
                   r.last_name as recipient_last_name
            FROM session_messages m
            JOIN users s ON m.sender_id = s.id
            LEFT JOIN users r ON m.recipient_id = r.id
            WHERE m.id = $messageId
        ");
        
        $messageData = $result->fetch_assoc();
        
        // Broadcast message (in a real app, you'd use WebSockets)
        broadcastMessage($sessionId, $messageData);
        
        sendSuccess([
            'message' => $messageData
        ], 'Message sent successfully');
    } else {
        sendError('Failed to send message: ' . $stmt->error, 500);
    }
}
?>