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

/**
 * Create task in session (teacher only)
 */
function createTask() {
    $user = requireAuth();
    
    // Check if user is a teacher
    if ($user->role !== 'teacher') {
        sendError('Only teachers can create tasks', 403);
    }
    
    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required = ['session_id', 'title', 'description'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            sendError("Missing required field: $field", 400);
        }
    }
    
    $sessionId = $data['session_id'];
    $title = $data['title'];
    $description = $data['description'];
    $due_date = $data['due_date'] ?? null;
    $priority = $data['priority'] ?? 'medium';
    $assigned_to = $data['assigned_to'] ?? null; // null for all participants
    
    $conn = getDatabaseConnection();
    if (!$conn) {
        sendError('Database connection failed', 500);
    }
    
    // Check if teacher owns the session
    $checkStmt = $conn->prepare("
        SELECT * FROM sessions
        WHERE id = ? AND teacher_id = ?
    ");
    
    $checkStmt->bind_param("ii", $sessionId, $user->id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        sendError('You do not own this session', 403);
    }
    
    // Insert task
    $stmt = $conn->prepare("
        INSERT INTO session_tasks (session_id, created_by, assigned_to, title, description, due_date, priority, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    ");
    
    $stmt->bind_param("iiissss", $sessionId, $user->id, $assigned_to, $title, $description, $due_date, $priority);
    
    if ($stmt->execute()) {
        $taskId = $conn->insert_id;
        
        // Get the created task
        $result = $conn->query("
            SELECT t.*, 
                   c.first_name as creator_first_name,
                   c.last_name as creator_last_name,
                   a.first_name as assignee_first_name,
                   a.last_name as assignee_last_name
            FROM session_tasks t
            JOIN users c ON t.created_by = c.id
            LEFT JOIN users a ON t.assigned_to = a.id
            WHERE t.id = $taskId
        ");
        
        $task = $result->fetch_assoc();
        
        // Broadcast task creation (in a real app, you'd use WebSockets)
        broadcastTask($sessionId, $task);
        
        sendSuccess([
            'task' => $task
        ], 'Task created successfully');
    } else {
        sendError('Failed to create task: ' . $stmt->error, 500);
    }
}

/**
 * List active sessions
 */
function listSessions() {
    $user = requireAuth();
    
    $conn = getDatabaseConnection();
    if (!$conn) {
        sendError('Database connection failed', 500);
    }
    
    if ($user->role === 'teacher') {
        // Get sessions created by this teacher
        $stmt = $conn->prepare("
            SELECT s.*, 
                   COUNT(DISTINCT sp.id) as participant_count,
                   COUNT(DISTINCT c.id) as caption_count
            FROM sessions s
            LEFT JOIN session_participants sp ON s.id = sp.session_id AND sp.left_at IS NULL
            LEFT JOIN captions c ON s.id = c.session_id
            WHERE s.teacher_id = ?
            GROUP BY s.id
            ORDER BY s.created_at DESC
        ");
        
        $stmt->bind_param("i", $user->id);
    } else {
        // Get sessions this student is in
        $stmt = $conn->prepare("
            SELECT s.*, 
                   u.first_name as teacher_first_name,
                   u.last_name as teacher_last_name,
                   COUNT(DISTINCT sp2.id) as participant_count
            FROM sessions s
            JOIN session_participants sp ON s.id = sp.session_id AND sp.student_id = ? AND sp.left_at IS NULL
            JOIN users u ON s.teacher_id = u.id
            LEFT JOIN session_participants sp2 ON s.id = sp2.session_id AND sp2.left_at IS NULL
            WHERE s.is_active = TRUE
            GROUP BY s.id
            ORDER BY s.created_at DESC
        ");
        
        $stmt->bind_param("i", $user->id);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $sessions = [];
    
    while ($row = $result->fetch_assoc()) {
        $sessions[] = $row;
    }
    
    sendSuccess(['sessions' => $sessions], 'Sessions retrieved successfully');
}

/**
 * Get session details
 */
function getSessionDetails() {
    $user = requireAuth();
    $sessionId = $_GET['session_id'] ?? 0;
    
    if (!$sessionId) {
        sendError('Session ID is required', 400);
    }
    
    $conn = getDatabaseConnection();
    if (!$conn) {
        sendError('Database connection failed', 500);
    }
    
    // Get session details
    $stmt = $conn->prepare("
        SELECT s.*,
               u.first_name as teacher_first_name,
               u.last_name as teacher_last_name,
               u.email as teacher_email,
               COUNT(DISTINCT sp.id) as participant_count,
               COUNT(DISTINCT c.id) as caption_count
        FROM sessions s
        JOIN users u ON s.teacher_id = u.id
        LEFT JOIN session_participants sp ON s.id = sp.session_id AND sp.left_at IS NULL
        LEFT JOIN captions c ON s.id = c.session_id
        WHERE s.id = ?
        GROUP BY s.id
    ");
    
    $stmt->bind_param("i", $sessionId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendError('Session not found', 404);
    }
    
    $session = $result->fetch_assoc();
    
    // Check if user has access to this session
    if ($user->role === 'teacher' && $session['teacher_id'] !== $user->id) {
        sendError('You do not have access to this session', 403);
    }
    
    if ($user->role === 'student') {
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
    
    sendSuccess(['session' => $session], 'Session details retrieved');
}

/**
 * Get session participants
 */
function getParticipants() {
    $user = requireAuth();
    $sessionId = $_GET['session_id'] ?? 0;
    
    if (!$sessionId) {
        sendError('Session ID is required', 400);
    }
    
    $conn = getDatabaseConnection();
    if (!$conn) {
        sendError('Database connection failed', 500);
    }
    
    // Check if user has access to this session
    if ($user->role === 'teacher') {
        $checkStmt = $conn->prepare("
            SELECT * FROM sessions WHERE id = ? AND teacher_id = ?
        ");
        $checkStmt->bind_param("ii", $sessionId, $user->id);
    } else {
        $checkStmt = $conn->prepare("
            SELECT * FROM session_participants
            WHERE session_id = ? AND student_id = ? AND left_at IS NULL
        ");
        $checkStmt->bind_param("ii", $sessionId, $user->id);
    }
    
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        sendError('You do not have access to this session', 403);
    }
    
    // Get participants
    $stmt = $conn->prepare("
        SELECT u.id, u.first_name, u.last_name, u.email, u.role,
               sp.joined_at, sp.left_at
        FROM session_participants sp
        JOIN users u ON sp.student_id = u.id
        WHERE sp.session_id = ? AND sp.left_at IS NULL
        ORDER BY sp.joined_at
    ");
    
    $stmt->bind_param("i", $sessionId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $participants = [];
    while ($row = $result->fetch_assoc()) {
        $participants[] = $row;
    }
    
    sendSuccess(['participants' => $participants], 'Participants retrieved');
}

/**
 * Get session captions
 */
function getCaptions() {
    $user = requireAuth();
    $sessionId = $_GET['session_id'] ?? 0;
    $limit = $_GET['limit'] ?? 100;
    $offset = $_GET['offset'] ?? 0;
    
    if (!$sessionId) {
        sendError('Session ID is required', 400);
    }
    
    $conn = getDatabaseConnection();
    if (!$conn) {
        sendError('Database connection failed', 500);
    }
    
    // Check if user has access to this session
    if ($user->role === 'teacher') {
        $checkStmt = $conn->prepare("
            SELECT * FROM sessions WHERE id = ? AND teacher_id = ?
        ");
        $checkStmt->bind_param("ii", $sessionId, $user->id);
    } else {
        $checkStmt = $conn->prepare("
            SELECT * FROM session_participants
            WHERE session_id = ? AND student_id = ? AND left_at IS NULL
        ");
        $checkStmt->bind_param("ii", $sessionId, $user->id);
    }
    
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        sendError('You do not have access to this session', 403);
    }
    
    // Get captions
    $stmt = $conn->prepare("
        SELECT c.*, u.first_name, u.last_name
        FROM captions c
        JOIN users u ON c.user_id = u.id
        WHERE c.session_id = ?
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
    ");
    
    $stmt->bind_param("iii", $sessionId, $limit, $offset);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $captions = [];
    while ($row = $result->fetch_assoc()) {
        $captions[] = $row;
    }
    
    sendSuccess(['captions' => $captions], 'Captions retrieved');
}

/**
 * End a session (teacher only)
 */
function endSession() {
    $user = requireAuth();
    
    // Check if user is a teacher
    if ($user->role !== 'teacher') {
        sendError('Only teachers can end sessions', 403);
    }
    
    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['session_id'])) {
        sendError('Session ID is required', 400);
    }
    
    $sessionId = $data['session_id'];
    
    $conn = getDatabaseConnection();
    if (!$conn) {
        sendError('Database connection failed', 500);
    }
    
    // Check if teacher owns the session
    $checkStmt = $conn->prepare("
        SELECT * FROM sessions
        WHERE id = ? AND teacher_id = ?
    ");
    
    $checkStmt->bind_param("ii", $sessionId, $user->id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        sendError('You do not own this session', 403);
    }
    
    // End the session
    $stmt = $conn->prepare("
        UPDATE sessions
        SET is_active = FALSE, end_time = NOW()
        WHERE id = ?
    ");
    
    $stmt->bind_param("i", $sessionId);
    
    if ($stmt->execute()) {
        // Log activity
        logActivity($user->id, 'session_end', "Ended session ID: $sessionId");
        
        sendSuccess([], 'Session ended successfully');
    } else {
        sendError('Failed to end session: ' . $stmt->error, 500);
    }
}

/**
 * Generate unique session code
 */
function generateSessionCode() {
    $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $code = '';
    
    for ($i = 0; $i < 6; $i++) {
        $code .= $characters[rand(0, strlen($characters) - 1)];
    }
    
    return $code;
}

/**
 * Broadcast caption to participants (placeholder for WebSocket implementation)
 */
function broadcastCaption($sessionId, $caption) {
    // In a real implementation, this would use WebSockets
    // For now, we'll just log it
    error_log("Broadcasting caption for session $sessionId: " . $caption['text']);
}

/**
 * Broadcast message to participants (placeholder for WebSocket implementation)
 */
function broadcastMessage($sessionId, $message) {
    // In a real implementation, this would use WebSockets
    error_log("Broadcasting message for session $sessionId: " . $message['message']);
}

/**
 * Broadcast task to participants (placeholder for WebSocket implementation)
 */
function broadcastTask($sessionId, $task) {
    // In a real implementation, this would use WebSockets
    error_log("Broadcasting task for session $sessionId: " . $task['title']);
}

/**
 * Log activity
 */
function logActivity($userId, $action, $details) {
    $conn = getDatabaseConnection();
    if (!$conn) {
        return;
    }
    
    $stmt = $conn->prepare("
        INSERT INTO activity_logs (user_id, action, details)
        VALUES (?, ?, ?)
    ");
    
    $stmt->bind_param("iss", $userId, $action, $details);
    $stmt->execute();
}

/**
 * Get session messages
 */
function getMessages() {
    $user = requireAuth();
    $sessionId = $_GET['session_id'] ?? 0;
    $limit = $_GET['limit'] ?? 100;
    $offset = $_GET['offset'] ?? 0;
    
    if (!$sessionId) {
        sendError('Session ID is required', 400);
    }
    
    $conn = getDatabaseConnection();
    if (!$conn) {
        sendError('Database connection failed', 500);
    }
    
    // Check if user has access to this session
    if ($user->role === 'teacher') {
        $checkStmt = $conn->prepare("
            SELECT * FROM sessions WHERE id = ? AND teacher_id = ?
        ");
        $checkStmt->bind_param("ii", $sessionId, $user->id);
    } else {
        $checkStmt = $conn->prepare("
            SELECT * FROM session_participants
            WHERE session_id = ? AND student_id = ? AND left_at IS NULL
        ");
        $checkStmt->bind_param("ii", $sessionId, $user->id);
    }
    
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        sendError('You do not have access to this session', 403);
    }
    
    // Get messages
    $stmt = $conn->prepare("
        SELECT m.*,
               s.first_name as sender_first_name,
               s.last_name as sender_last_name,
               r.first_name as recipient_first_name,
               r.last_name as recipient_last_name
        FROM session_messages m
        JOIN users s ON m.sender_id = s.id
        LEFT JOIN users r ON m.recipient_id = r.id
        WHERE m.session_id = ?
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
    ");
    
    $stmt->bind_param("iii", $sessionId, $limit, $offset);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $messages = [];
    while ($row = $result->fetch_assoc()) {
        $messages[] = $row;
    }
    
    sendSuccess(['messages' => $messages], 'Messages retrieved');
}

/**
 * Get session tasks
 */
function getTasks() {
    $user = requireAuth();
    $sessionId = $_GET['session_id'] ?? 0;
    $status = $_GET['status'] ?? null;
    
    if (!$sessionId) {
        sendError('Session ID is required', 400);
    }
    
    $conn = getDatabaseConnection();
    if (!$conn) {
        sendError('Database connection failed', 500);
    }
    
    // Check if user has access to this session
    if ($user->role === 'teacher') {
        $checkStmt = $conn->prepare("
            SELECT * FROM sessions WHERE id = ? AND teacher_id = ?
        ");
        $checkStmt->bind_param("ii", $sessionId, $user->id);
    } else {
        $checkStmt = $conn->prepare("
            SELECT * FROM session_participants
            WHERE session_id = ? AND student_id = ? AND left_at IS NULL
        ");
        $checkStmt->bind_param("ii", $sessionId, $user->id);
    }
    
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        sendError('You do not have access to this session', 403);
    }
    
    // Build query based on user role
    if ($user->role === 'teacher') {
        $query = "
            SELECT t.*,
                   c.first_name as creator_first_name,
                   c.last_name as creator_last_name,
                   a.first_name as assignee_first_name,
                   a.last_name as assignee_last_name
            FROM session_tasks t
            JOIN users c ON t.created_by = c.id
            LEFT JOIN users a ON t.assigned_to = a.id
            WHERE t.session_id = ?
        ";
    } else {
        $query = "
            SELECT t.*,
                   c.first_name as creator_first_name,
                   c.last_name as creator_last_name,
                   a.first_name as assignee_first_name,
                   a.last_name as assignee_last_name
            FROM session_tasks t
            JOIN users c ON t.created_by = c.id
            LEFT JOIN users a ON t.assigned_to = a.id
            WHERE t.session_id = ? AND (t.assigned_to IS NULL OR t.assigned_to = ?)
        ";
    }
    
    if ($status) {
        $query .= " AND t.status = ?";
    }
    
    $query .= " ORDER BY t.created_at DESC";
    
    $stmt = $conn->prepare($query);
    
    if ($user->role === 'teacher') {
        if ($status) {
            $stmt->bind_param("is", $sessionId, $status);
        } else {
            $stmt->bind_param("i", $sessionId);
        }
    } else {
        if ($status) {
            $stmt->bind_param("iis", $sessionId, $user->id, $status);
        } else {
            $stmt->bind_param("ii", $sessionId, $user->id);
        }
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $tasks = [];
    while ($row = $result->fetch_assoc()) {
        $tasks[] = $row;
    }
    
    sendSuccess(['tasks' => $tasks], 'Tasks retrieved');
}

/**
 * Get active sessions for current user
 */
function getActiveSessions() {
    $user = requireAuth();
    
    $conn = getDatabaseConnection();
    if (!$conn) {
        sendError('Database connection failed', 500);
    }
    
    if ($user->role === 'teacher') {
        $stmt = $conn->prepare("
            SELECT s.*,
                   COUNT(DISTINCT sp.id) as participant_count
            FROM sessions s
            LEFT JOIN session_participants sp ON s.id = sp.session_id AND sp.left_at IS NULL
            WHERE s.teacher_id = ? AND s.is_active = TRUE
            GROUP BY s.id
            ORDER BY s.created_at DESC
        ");
        $stmt->bind_param("i", $user->id);
    } else {
        $stmt = $conn->prepare("
            SELECT s.*,
                   u.first_name as teacher_first_name,
                   u.last_name as teacher_last_name,
                   COUNT(DISTINCT sp2.id) as participant_count
            FROM sessions s
            JOIN session_participants sp ON s.id = sp.session_id AND sp.student_id = ? AND sp.left_at IS NULL
            JOIN users u ON s.teacher_id = u.id
            LEFT JOIN session_participants sp2 ON s.id = sp2.session_id AND sp2.left_at IS NULL
            WHERE s.is_active = TRUE
            GROUP BY s.id
            ORDER BY s.created_at DESC
        ");
        $stmt->bind_param("i", $user->id);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $sessions = [];
    while ($row = $result->fetch_assoc()) {
        $sessions[] = $row;
    }
    
    sendSuccess(['sessions' => $sessions], 'Active sessions retrieved');
}

/**
 * Update session details (teacher only)
 */
function updateSession() {
    $user = requireAuth();
    
    // Check if user is a teacher
    if ($user->role !== 'teacher') {
        sendError('Only teachers can update sessions', 403);
    }
    
    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['session_id'])) {
        sendError('Session ID is required', 400);
    }
    
    $sessionId = $data['session_id'];
    $subject = $data['subject'] ?? null;
    $description = $data['description'] ?? null;
    $language = $data['language'] ?? null;
    
    $conn = getDatabaseConnection();
    if (!$conn) {
        sendError('Database connection failed', 500);
    }
    
    // Check if teacher owns the session
    $checkStmt = $conn->prepare("
        SELECT * FROM sessions
        WHERE id = ? AND teacher_id = ?
    ");
    
    $checkStmt->bind_param("ii", $sessionId, $user->id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        sendError('You do not own this session', 403);
    }
    
    // Build update query dynamically
    $updates = [];
    $params = [];
    $types = '';
    
    if ($subject !== null) {
        $updates[] = "subject = ?";
        $params[] = $subject;
        $types .= "s";
    }
    
    if ($description !== null) {
        $updates[] = "description = ?";
        $params[] = $description;
        $types .= "s";
    }
    
    if ($language !== null) {
        $updates[] = "language = ?";
        $params[] = $language;
        $types .= "s";
    }
    
    if (empty($updates)) {
        sendError('No fields to update', 400);
    }
    
    $updates[] = "updated_at = NOW()";
    $query = "UPDATE sessions SET " . implode(", ", $updates) . " WHERE id = ?";
    $params[] = $sessionId;
    $types .= "i";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        sendSuccess([], 'Session updated successfully');
    } else {
        sendError('Failed to update session: ' . $stmt->error, 500);
    }
}

/**
 * Update task status (teacher or assigned student)
 */
function updateTask() {
    $user = requireAuth();
    
    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['task_id'])) {
        sendError('Task ID is required', 400);
    }
    
    $taskId = $data['task_id'];
    $status = $data['status'] ?? null;
    $progress = $data['progress'] ?? null;
    $notes = $data['notes'] ?? null;
    
    $conn = getDatabaseConnection();
    if (!$conn) {
        sendError('Database connection failed', 500);
    }
    
    // Get task details
    $stmt = $conn->prepare("
        SELECT t.*, s.teacher_id
        FROM session_tasks t
        JOIN sessions s ON t.session_id = s.id
        WHERE t.id = ?
    ");
    
    $stmt->bind_param("i", $taskId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendError('Task not found', 404);
    }
    
    $task = $result->fetch_assoc();
    
    // Check permissions
    $canUpdate = false;
    if ($user->role === 'teacher' && $task['teacher_id'] === $user->id) {
        $canUpdate = true; // Teacher owns the session
    } elseif ($task['assigned_to'] === $user->id) {
        $canUpdate = true; // Student is assigned to the task
    } elseif ($task['assigned_to'] === null && $user->role === 'student') {
        // Check if student is in the session
        $checkStmt = $conn->prepare("
            SELECT * FROM session_participants
            WHERE session_id = ? AND student_id = ? AND left_at IS NULL
        ");
        $checkStmt->bind_param("ii", $task['session_id'], $user->id);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows > 0) {
            $canUpdate = true; // Student is in session and task is for all participants
        }
    }
    
    if (!$canUpdate) {
        sendError('You do not have permission to update this task', 403);
    }
    
    // Build update query
    $updates = [];
    $params = [];
    $types = '';
    
    if ($status !== null) {
        $updates[] = "status = ?";
        $params[] = $status;
        $types .= "s";
    }
    
    if ($progress !== null) {
        $updates[] = "progress = ?";
        $params[] = $progress;
        $types .= "i";
    }
    
    if ($notes !== null) {
        $updates[] = "notes = ?";
        $params[] = $notes;
        $types .= "s";
    }
    
    if (empty($updates)) {
        sendError('No fields to update', 400);
    }
    
    $updates[] = "updated_at = NOW()";
    $query = "UPDATE session_tasks SET " . implode(", ", $updates) . " WHERE id = ?";
    $params[] = $taskId;
    $types .= "i";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        sendSuccess([], 'Task updated successfully');
    } else {
        sendError('Failed to update task: ' . $stmt->error, 500);
    }
}

/**
 * Delete session (teacher only)
 */
function deleteSession() {
    $user = requireAuth();
    
    // Check if user is a teacher
    if ($user->role !== 'teacher') {
        sendError('Only teachers can delete sessions', 403);
    }
    
    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['session_id'])) {
        sendError('Session ID is required', 400);
    }
    
    $sessionId = $data['session_id'];
    
    $conn = getDatabaseConnection();
    if (!$conn) {
        sendError('Database connection failed', 500);
    }
    
    // Check if teacher owns the session
    $checkStmt = $conn->prepare("
        SELECT * FROM sessions
        WHERE id = ? AND teacher_id = ?
    ");
    
    $checkStmt->bind_param("ii", $sessionId, $user->id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        sendError('You do not own this session', 403);
    }
    
    // Delete session (cascade should handle related records)
    $stmt = $conn->prepare("DELETE FROM sessions WHERE id = ?");
    $stmt->bind_param("i", $sessionId);
    
    if ($stmt->execute()) {
        sendSuccess([], 'Session deleted successfully');
    } else {
        sendError('Failed to delete session: ' . $stmt->error, 500);
    }
}

/**
 * Delete task (teacher only)
 */
function deleteTask() {
    $user = requireAuth();
    
    // Check if user is a teacher
    if ($user->role !== 'teacher') {
        sendError('Only teachers can delete tasks', 403);
    }
    
    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['task_id'])) {
        sendError('Task ID is required', 400);
    }
    
    $taskId = $data['task_id'];
    
    $conn = getDatabaseConnection();
    if (!$conn) {
        sendError('Database connection failed', 500);
    }
    
    // Check if teacher owns the task's session
    $checkStmt = $conn->prepare("
        SELECT s.teacher_id
        FROM session_tasks t
        JOIN sessions s ON t.session_id = s.id
        WHERE t.id = ?
    ");
    
    $checkStmt->bind_param("i", $taskId);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        sendError('Task not found', 404);
    }
    
    $session = $checkResult->fetch_assoc();
    
    if ($session['teacher_id'] !== $user->id) {
        sendError('You do not own this task', 403);
    }
    
    // Delete task
    $stmt = $conn->prepare("DELETE FROM session_tasks WHERE id = ?");
    $stmt->bind_param("i", $taskId);
    
    if ($stmt->execute()) {
        sendSuccess([], 'Task deleted successfully');
    } else {
        sendError('Failed to delete task: ' . $stmt->error, 500);
    }
}
