<?php
/**
 * Real-time Communication API for Silent Speak
 * Handles polling for real-time updates (captions, messages, tasks)
 */

require_once __DIR__ . '/../config.php';

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendError('Method not allowed', 405);
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'updates':
        getUpdates();
        break;
    case 'subscribe':
        subscribe();
        break;
    case 'unsubscribe':
        unsubscribe();
        break;
    default:
        sendError('Invalid action specified', 400);
}
 
/**
 * Get real-time updates for a session
 */
function getUpdates() {
    $user = requireAuth();
    $sessionId = $_GET['session_id'] ?? 0;
    $lastUpdate = $_GET['last_update'] ?? 0;
    
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
    
    $updates = [
        'captions' => [],
        'messages' => [],
        'tasks' => [],
        'participants' => [],
        'timestamp' => time()
    ];
    
    // Get new captions
    $captionStmt = $conn->prepare("
        SELECT c.*, u.first_name, u.last_name
        FROM captions c
        JOIN users u ON c.user_id = u.id
        WHERE c.session_id = ? AND c.created_at > FROM_UNIXTIME(?)
        ORDER BY c.created_at ASC
        LIMIT 50
    ");
    
    $captionStmt->bind_param("ii", $sessionId, $lastUpdate);
    $captionStmt->execute();
    $captionResult = $captionStmt->get_result();
    
    while ($row = $captionResult->fetch_assoc()) {
        $updates['captions'][] = $row;
    }
    
    // Get new messages
    $messageStmt = $conn->prepare("
        SELECT m.*, 
               s.first_name as sender_first_name, 
               s.last_name as sender_last_name,
               r.first_name as recipient_first_name,
               r.last_name as recipient_last_name
        FROM session_messages m
        JOIN users s ON m.sender_id = s.id
        LEFT JOIN users r ON m.recipient_id = r.id
        WHERE m.session_id = ? AND m.created_at > FROM_UNIXTIME(?)
        ORDER BY m.created_at ASC
        LIMIT 50
    ");
    
    $messageStmt->bind_param("ii", $sessionId, $lastUpdate);
    $messageStmt->execute();
    $messageResult = $messageStmt->get_result();
    
    while ($row = $messageResult->fetch_assoc()) {
        $updates['messages'][] = $row;
    }
    
    // Get new/updated tasks
    $taskStmt = $conn->prepare("
        SELECT t.*, 
               c.first_name as creator_first_name,
               c.last_name as creator_last_name,
               a.first_name as assignee_first_name,
               a.last_name as assignee_last_name
        FROM session_tasks t
        JOIN users c ON t.created_by = c.id
        LEFT JOIN users a ON t.assigned_to = a.id
        WHERE t.session_id = ? AND (t.created_at > FROM_UNIXTIME(?) OR t.updated_at > FROM_UNIXTIME(?))
        ORDER BY t.created_at ASC
        LIMIT 50
    ");
    
    $taskStmt->bind_param("iii", $sessionId, $lastUpdate, $lastUpdate);
    $taskStmt->execute();
    $taskResult = $taskStmt->get_result();
    
    while ($row = $taskResult->fetch_assoc()) {
        $updates['tasks'][] = $row;
    }
    
    // Get participant changes
    $participantStmt = $conn->prepare("
        SELECT sp.*, u.first_name, u.last_name, u.email
        FROM session_participants sp
        JOIN users u ON sp.student_id = u.id
        WHERE sp.session_id = ? AND (sp.joined_at > FROM_UNIXTIME(?) OR sp.left_at > FROM_UNIXTIME(?))
        ORDER BY sp.joined_at ASC
        LIMIT 50
    ");
    
    $participantStmt->bind_param("iii", $sessionId, $lastUpdate, $lastUpdate);
    $participantStmt->execute();
    $participantResult = $participantStmt->get_result();
    
    while ($row = $participantResult->fetch_assoc()) {
        $updates['participants'][] = $row;
    }
    
    sendSuccess($updates, 'Updates retrieved');
}
?>