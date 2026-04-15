-- Silent Speak Database Schema
-- Dummy SQL file for the Silent Speak application
-- This file contains the complete database schema and sample data

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS silent_speak_db;
USE silent_speak_db;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS pomodoro_sessions;
DROP TABLE IF EXISTS stt_history;
DROP TABLE IF EXISTS tts_history;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS quick_phrases;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS session_tasks;
DROP TABLE IF EXISTS session_messages;
DROP TABLE IF EXISTS captions;
DROP TABLE IF EXISTS session_participants;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS users;

-- Users table (main user accounts)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other', 'prefer-not-to-say') DEFAULT 'prefer-not-to-say',
    role ENUM('student', 'teacher', 'parent', 'administrator') DEFAULT 'student',
    institution VARCHAR(255),
    department VARCHAR(255),
    semester VARCHAR(50),
    bio TEXT,
    disabilities JSON,
    settings JSON,
    profile_image VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Sessions table (live teaching sessions)
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_code VARCHAR(20) UNIQUE NOT NULL,
    teacher_id INT NOT NULL,
    subject VARCHAR(255),
    language VARCHAR(50) DEFAULT 'en',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_code (session_code),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_is_active (is_active)
);

-- Session participants (students in sessions)
CREATE TABLE session_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (session_id, student_id),
    INDEX idx_session_id (session_id),
    INDEX idx_student_id (student_id)
);

-- Captions table (real-time speech-to-text captions)
CREATE TABLE captions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    speaker_id INT NOT NULL,
    text TEXT NOT NULL,
    language VARCHAR(50) DEFAULT 'en',
    confidence FLOAT DEFAULT 1.0,
    is_final BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (speaker_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_speaker_id (speaker_id),
    INDEX idx_timestamp (timestamp)
);

-- Session messages (chat messages within sessions)
CREATE TABLE session_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    sender_id INT NOT NULL,
    recipient_id INT NULL,
    message TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_session_id (session_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_recipient_id (recipient_id)
);

-- Session tasks (assignments/tasks within sessions)
CREATE TABLE session_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    created_by INT NOT NULL,
    assigned_to INT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('pending', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_session_id (session_id),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_status (status)
);

-- Notes table (personal notes)
CREATE TABLE notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags JSON,
    is_public BOOLEAN DEFAULT FALSE,
    file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_is_public (is_public)
);

-- Tasks table (pomodoro tasks)
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('pending', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
    due_date DATE,
    pomodoro_sessions INT DEFAULT 0,
    completed_sessions INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
);

-- Quick phrases (predefined phrases for quick communication)
CREATE TABLE quick_phrases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    translation JSON,
    usage_count INT DEFAULT 0,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_is_favorite (is_favorite)
);

-- Activity logs (user activity tracking)
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    details TEXT,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at)
);

-- Text-to-speech history
CREATE TABLE tts_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    text TEXT NOT NULL,
    language VARCHAR(50) DEFAULT 'en',
    voice VARCHAR(100),
    speed FLOAT DEFAULT 1.0,
    pitch FLOAT DEFAULT 1.0,
    audio_file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Speech-to-text history
CREATE TABLE stt_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    audio_file_path VARCHAR(500),
    text TEXT,
    language VARCHAR(50) DEFAULT 'en',
    confidence FLOAT,
    duration_seconds INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Pomodoro sessions
CREATE TABLE pomodoro_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT NULL,
    session_type ENUM('work', 'break', 'long_break') DEFAULT 'work',
    duration_minutes INT NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_task_id (task_id),
    INDEX idx_start_time (start_time)
);

-- User settings (extended settings beyond JSON field)
CREATE TABLE user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    theme VARCHAR(50) DEFAULT 'light',
    font_size VARCHAR(20) DEFAULT 'medium',
    high_contrast BOOLEAN DEFAULT FALSE,
    text_to_speech_enabled BOOLEAN DEFAULT TRUE,
    speech_to_text_enabled BOOLEAN DEFAULT TRUE,
    auto_captions BOOLEAN DEFAULT TRUE,
    notification_sound BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample data

-- Sample users
INSERT INTO users (email, password_hash, first_name, last_name, role, phone, gender, institution, department, is_verified) VALUES
('teacher@example.com', '$2y$10$YourHashedPasswordHere', 'John', 'Smith', 'teacher', '+1234567890', 'male', 'University of Technology', 'Computer Science', TRUE),
('student1@example.com', '$2y$10$YourHashedPasswordHere', 'Alice', 'Johnson', 'student', '+1234567891', 'female', 'University of Technology', 'Computer Science', TRUE),
('student2@example.com', '$2y$10$YourHashedPasswordHere', 'Bob', 'Williams', 'student', '+1234567892', 'male', 'University of Technology', 'Electrical Engineering', TRUE),
('parent@example.com', '$2y$10$YourHashedPasswordHere', 'Carol', 'Brown', 'parent', '+1234567893', 'female', NULL, NULL, TRUE),
('admin@example.com', '$2y$10$YourHashedPasswordHere', 'David', 'Miller', 'administrator', '+1234567894', 'male', 'University of Technology', 'Administration', TRUE);

-- Sample sessions
INSERT INTO sessions (session_code, teacher_id, subject, language, description) VALUES
('MATH101', 1, 'Calculus I', 'en', 'Introduction to differential calculus'),
('CS201', 1, 'Data Structures', 'en', 'Linked lists, trees, and graphs'),
('PHY101', 1, 'Physics Fundamentals', 'en', 'Basic mechanics and thermodynamics');

-- Sample session participants
INSERT INTO session_participants (session_id, student_id) VALUES
(1, 2), -- Alice in Calculus
(1, 3), -- Bob in Calculus
(2, 2), -- Alice in Data Structures
(2, 3), -- Bob in Data Structures
(3, 2); -- Alice in Physics

-- Sample captions
INSERT INTO captions (session_id, speaker_id, text, language, confidence, is_final) VALUES
(1, 1, 'Welcome to Calculus I. Today we will discuss limits and derivatives.', 'en', 0.95, TRUE),
(1, 1, 'The derivative represents the rate of change of a function.', 'en', 0.92, TRUE),
(1, 2, 'Could you explain the chain rule again?', 'en', 0.88, TRUE),
(1, 1, 'Certainly. The chain rule is used for composite functions.', 'en', 0.94, TRUE);

-- Sample session messages
INSERT INTO session_messages (session_id, sender_id, recipient_id, message, message_type) VALUES
(1, 2, NULL, 'Hello everyone!', 'text'),
(1, 1, NULL, 'Welcome to the session!', 'text'),
(1, 3, 2, 'Do you have the homework?', 'text'),
(1, 2, 3, 'Yes, I can share it with you.', 'text');

-- Sample session tasks
INSERT INTO session_tasks (session_id, created_by, assigned_to, title, description, due_date, priority) VALUES
(1, 1, 2, 'Homework 1', 'Complete exercises 1-10 on limits', '2024-12-15', 'high'),
(1, 1, 3, 'Homework 1', 'Complete exercises 1-10 on limits', '2024-12-15', 'high'),
(2, 1, 2, 'Linked List Implementation', 'Implement singly linked list with insert/delete operations', '2024-12-20', 'medium');

-- Sample notes
INSERT INTO notes (user_id, title, content, category, tags, is_public) VALUES
(2, 'Calculus Notes', 'Limits: The limit of f(x) as x approaches a is L if...', 'Mathematics', '["calculus", "limits", "derivatives"]', FALSE),
(2, 'Data Structures', 'Linked lists are linear data structures...', 'Computer Science', '["data-structures", "linked-lists"]', FALSE),
(3, 'Physics Formulas', 'F = ma, v = u + at, s = ut + ½at²', 'Physics', '["mechanics", "formulas"]', TRUE);

-- Sample tasks (pomodoro)
INSERT INTO tasks (user_id, title, description, priority, status, due_date, pomodoro_sessions, completed_sessions) VALUES
(2, 'Complete Calculus Homework', 'Finish exercises 1-10 on limits', 'high', 'pending', '2024-12-15', 4, 1),
(2, 'Study Data Structures', 'Review linked lists and trees', 'medium', 'in-progress', '2024-12-18', 6, 3),
(3, 'Physics Lab Report', 'Write report on pendulum experiment', 'high', 'pending', '2024-12-12', 3, 0);

-- Sample quick phrases
INSERT INTO quick_phrases (user_id, category, text, translation, usage_count, is_favorite) VALUES
(2, 'Classroom', 'Could you repeat that?', '{"bn": "আপনি কি এটি আবার বলতে পারেন?"}', 5, TRUE),
(2, 'Classroom', 'I don''t understand', '{"bn": "আমি বুঝতে পারছি না"}', 3, FALSE),
(3, 'General', 'Thank you', '{"bn": "ধন্যবাদ", "es": "Gracias"}', 10, TRUE),
(1, 'Teaching', 'Please pay attention', '{"bn": "দয়া করে মনোযোগ দিন"}', 8, TRUE);

-- Sample activity logs
INSERT INTO activity_logs (user_id, activity_type, details, device_info, ip_address) VALUES
(1, 'session_created', 'Created new session: MATH101', 'Chrome on Windows', '192.168.1.100'),
(2, 'session_joined', 'Joined session: MATH101', 'Firefox on macOS', '192.168.1.101'),
(3, 'note_created', 'Created note: Physics Formulas', 'Safari on iOS', '192.168.1.102'),
(2, 'task_created', 'Created task: Complete Calculus Homework', 'Chrome on Windows', '192.168.1.101');

-- Sample TTS history
INSERT INTO tts_history (user_id, text, language, voice, speed, pitch) VALUES
(2, 'Hello, how are you today?', 'en', 'en-US-Wavenet-A', 1.0, 1.0),
(3, 'The quick brown fox jumps over the lazy dog', 'en', 'en-GB-Wavenet-B', 1.2, 0.9);

-- Sample STT history
INSERT INTO stt_history (user_id, text, language, confidence, duration_seconds) VALUES
(2, 'I would like to ask about the homework assignment', 'en', 0.89, 5),
(3, 'Can you explain the concept of derivatives again', 'en', 0.92, 7);

-- Sample pomodoro sessions
INSERT INTO pomodoro_sessions (user_id, task_id, session_type, duration_minutes, completed, notes) VALUES
(2, 1, 'work', 25, TRUE, 'Focused on limit problems'),
(2, 1, 'break', 5, TRUE, 'Short break'),
(2, 2, 'work', 25, TRUE, 'Studied linked list implementation');

-- Sample user settings
INSERT INTO user_settings (user_id, theme, font_size, high_contrast, text_to_speech_enabled, speech_to_text_enabled) VALUES
(1, 'dark', 'large', FALSE, TRUE, TRUE),
(2, 'light', 'medium', TRUE, TRUE, TRUE),
(3, 'dark', 'small', FALSE, TRUE, FALSE),
(4, 'light', 'medium', FALSE, FALSE, TRUE),
(5, 'dark', 'large', TRUE, TRUE, TRUE);

-- Display summary of inserted data
SELECT 'Database setup completed successfully!' AS message;
SELECT
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM sessions) AS total_sessions,
    (SELECT COUNT(*) FROM session_participants) AS total_participants,
    (SELECT COUNT(*) FROM captions) AS total_captions,
    (SELECT COUNT(*) FROM notes) AS total_notes,
    (SELECT COUNT(*) FROM tasks) AS total_tasks;

-- Example queries for common operations
/*
-- Get all active sessions with teacher info
SELECT s.session_code, s.subject, s.language,
       CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
       COUNT(sp.student_id) AS participant_count
FROM sessions s
JOIN users u ON s.teacher_id = u.id
LEFT JOIN session_participants sp ON s.id = sp.session_id AND sp.left_at IS NULL
WHERE s.is_active = TRUE
GROUP BY s.id;

-- Get user's notes with categories
SELECT n.title, n.category, n.created_at,
       JSON_LENGTH(n.tags) AS tag_count
FROM notes n
WHERE n.user_id = 2
ORDER BY n.created_at DESC;

-- Get session chat history
SELECT sm.message,
       CONCAT(su.first_name, ' ', su.last_name) AS sender,
       CONCAT(ru.first_name, ' ', ru.last_name) AS recipient,
       sm.created_at
FROM session_messages sm
JOIN users su ON sm.sender_id = su.id
LEFT JOIN users ru ON sm.recipient_id = ru.id
WHERE sm.session_id = 1
ORDER BY sm.created_at ASC;
*/
