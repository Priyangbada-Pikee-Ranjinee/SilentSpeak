/* Silent Speak - Main JavaScript File */

// Global variables
let currentUser = null;
let currentSession = null;
let settings = {
    fontSize: 'normal',
    theme: 'light',
    colorBlindMode: false,
    language: 'en',
    autoScroll: true,
    voiceSpeed: 'normal'
};
 
// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Silent Speak application initialized');
    
    // Check authentication for protected pages
    const isAuthenticated = requireAuth();
    
    // If user is authenticated or page doesn't require auth, continue initialization
    if (isAuthenticated !== false) {
        // Load user settings from localStorage
        loadSettings();
        
        // Apply settings to UI
        applySettings();
        
        // Initialize tooltips
        initTooltips();
        
        // Initialize event listeners
        initEventListeners();
        
        // Check if user is logged in (demo)
        checkAuthStatus();
    }
});

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('silentSpeakSettings');
    if (savedSettings) {
        settings = { ...settings, ...JSON.parse(savedSettings) };
    }
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('silentSpeakSettings', JSON.stringify(settings));
}

// Apply settings to UI
function applySettings() {
    // Apply font size
    document.body.classList.remove('font-small', 'font-normal', 'font-large', 'font-xlarge', 'font-xxlarge');
    document.body.classList.add(`font-${settings.fontSize}`);
    
    // Apply theme
    document.body.classList.remove('high-contrast', 'colorblind-friendly');
    if (settings.theme === 'high-contrast') {
        document.body.classList.add('high-contrast');
    } else if (settings.theme === 'colorblind') {
        document.body.classList.add('colorblind-friendly');
    }
    
    // Apply color blind mode
    if (settings.colorBlindMode) {
        document.body.classList.add('colorblind-friendly');
    }
    
    // Update language attribute
    document.documentElement.lang = settings.language;
}

// Initialize tooltips using DaisyUI tooltip data attribute
function initTooltips() {
    // DaisyUI tooltips use data-tip attribute, no JS initialization needed
    // We'll just ensure tooltip elements have proper attributes
    const tooltipElements = document.querySelectorAll('[data-tip]');
    tooltipElements.forEach(el => {
        if (!el.hasAttribute('data-tooltip')) {
            el.setAttribute('data-tooltip', el.getAttribute('data-tip'));
        }
    });
}

// Initialize event listeners
function initEventListeners() {
    // Back to home buttons
    const backButtons = document.querySelectorAll('.back-to-home');
    backButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'app.html';
        });
    });
    
    // Logout buttons
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });
    
    // Settings save buttons
    const saveSettingsButtons = document.querySelectorAll('.save-settings');
    saveSettingsButtons.forEach(button => {
        button.addEventListener('click', function() {
            saveSettingsFromForm();
        });
    });
    
    // Demo login for testing
    const demoLoginButtons = document.querySelectorAll('.demo-login');
    demoLoginButtons.forEach(button => {
        button.addEventListener('click', function() {
            demoLogin();
        });
    });
}

// Check authentication status - uses the auth system from auth.js
function checkAuthStatus() {
    // Use the global auth instance if available
    if (window.auth && typeof window.auth.getCurrentUser === 'function') {
        const user = window.auth.getCurrentUser();
        if (user) {
            currentUser = user;
            updateUIForLoggedInUser();
            return true;
        }
    }
    
    // Fallback to localStorage check for compatibility
    let userData = localStorage.getItem('silentSpeakCurrentUser') || localStorage.getItem('silentSpeakUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        updateUIForLoggedInUser();
        return true;
    }
    
    return false;
}

// Check if user is authenticated and redirect if not
function requireAuth(redirectTo = 'login.html') {
    const isAuthenticated = checkAuthStatus();
    
    // Get current page filename
    const currentPage = window.location.pathname.split('/').pop();
    
    // List of pages that require authentication
    const protectedPages = [
        'live-session.html',
        'notes.html',
        'pomodoro.html',
        'profile.html',
        'quick-communication.html',
        'settings.html',
        'speech-to-text.html',
        'text-to-speech.html',
        'app.html'
    ];
    
    // Check if current page is protected and user is not authenticated
    if (protectedPages.includes(currentPage) && !isAuthenticated) {
        // Redirect to login page
        window.location.href = redirectTo;
        return false;
    }
    
    return isAuthenticated;
}

// Demo login function - now uses the proper auth system
function demoLogin() {
    // Try to use the auth system if available
    if (window.auth && typeof window.auth.login === 'function') {
        const result = window.auth.login('student@example.com', 'Student123');
        if (result.success) {
            currentUser = result.user;
            updateUIForLoggedInUser();
            showToast('Logged in successfully!', 'success');
            
            // Redirect to app after 1 second
            setTimeout(() => {
                window.location.href = 'app.html';
            }, 1000);
            return;
        }
    }
    
    // Fallback to old demo login
    currentUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'student',
        disability: 'hearing',
        semester: 5,
        avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=007bff&color=fff&size=100'
    };
    
    // Save to both storage keys for compatibility
    localStorage.setItem('silentSpeakUser', JSON.stringify(currentUser));
    localStorage.setItem('silentSpeakCurrentUser', JSON.stringify(currentUser));
    updateUIForLoggedInUser();
    
    // Show success message
    showToast('Logged in successfully!', 'success');
    
    // Redirect to app after 1 second
    setTimeout(() => {
        window.location.href = 'app.html';
    }, 1000);
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    if (!currentUser) return;
    
    const userElements = document.querySelectorAll('.user-name, .user-email, .user-avatar, .user-role');
    
    userElements.forEach(element => {
        if (element.classList.contains('user-name')) {
            element.textContent = currentUser.name || 'User';
        }
        if (element.classList.contains('user-email')) {
            element.textContent = currentUser.email || '';
        }
        if (element.classList.contains('user-role')) {
            element.textContent = currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'User';
        }
        if (element.classList.contains('user-avatar') && element.tagName === 'IMG') {
            element.src = currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=007bff&color=fff&size=100`;
        }
    });
    
    // Show/hide auth buttons
    const authButtons = document.querySelectorAll('.auth-buttons');
    authButtons.forEach(container => {
        container.style.display = 'none';
    });
    
    const userMenu = document.querySelectorAll('.user-menu');
    userMenu.forEach(container => {
        container.style.display = 'block';
    });
}

// Logout function - uses the auth system if available
function logout() {
    // Use auth system if available
    if (window.auth && typeof window.auth.logout === 'function') {
        window.auth.logout();
    }
    
    currentUser = null;
    localStorage.removeItem('silentSpeakUser');
    localStorage.removeItem('silentSpeakCurrentUser');
    
    // Show success message
    showToast('Logged out successfully!', 'info');
    
    // Redirect to home after 1 second
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Save settings from form
function saveSettingsFromForm() {
    // Get values from form (if exists)
    const fontSizeSelect = document.getElementById('fontSize');
    const themeSelect = document.getElementById('theme');
    const colorBlindCheck = document.getElementById('colorBlind');
    const languageSelect = document.getElementById('language');
    const autoScrollCheck = document.getElementById('autoScroll');
    const voiceSpeedSelect = document.getElementById('voiceSpeed');
    
    if (fontSizeSelect) settings.fontSize = fontSizeSelect.value;
    if (themeSelect) settings.theme = themeSelect.value;
    if (colorBlindCheck) settings.colorBlindMode = colorBlindCheck.checked;
    if (languageSelect) settings.language = languageSelect.value;
    if (autoScrollCheck) settings.autoScroll = autoScrollCheck.checked;
    if (voiceSpeedSelect) settings.voiceSpeed = voiceSpeedSelect.value;
    
    saveSettings();
    applySettings();
    
    showToast('Settings saved successfully!', 'success');
}

// Show toast notification
function showToast(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelector('.toast-alert-container');
    if (existingAlerts) {
        existingAlerts.remove();
    }
    
    // Create alert container
    const alertContainer = document.createElement('div');
    alertContainer.className = 'toast-alert-container fixed bottom-4 right-4 z-50 w-full max-w-sm';
    
    // Create alert using DaisyUI classes
    const alert = document.createElement('div');
    const alertType = type === 'error' ? 'error' : type === 'success' ? 'success' : 'info';
    alert.className = `alert alert-${alertType} shadow-lg mb-3`;
    alert.setAttribute('role', 'alert');
    
    // Icon based on type
    const icon = type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle';
    
    alert.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${icon} mr-3"></i>
            <span>${message}</span>
        </div>
        <button class="btn btn-sm btn-ghost" onclick="this.parentElement.parentElement.remove()">×</button>
    `;
    
    alertContainer.appendChild(alert);
    document.body.appendChild(alertContainer);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertContainer.parentElement) {
            alertContainer.remove();
        }
    }, 5000);
}

// Generate random session code
function generateSessionCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Format date for display
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format time duration
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Check if device is mobile
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showToast('Failed to copy to clipboard', 'danger');
    });
}

// Export data as JSON
function exportData(data, filename = 'data.json') {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', filename);
    linkElement.click();
}

// Import data from JSON file
function importData(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            callback(data);
        } catch (error) {
            showToast('Invalid JSON file', 'danger');
            console.error('Error parsing JSON:', error);
        }
    };
    reader.readAsText(file);
}

// Validate email format
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate password strength
function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
        isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
        minLength: password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
    };
}

// OOP Principles Demo Classes
class User {
    constructor(id, name, email, role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.disabilities = [];
        this.settings = {};
    }
    
    addDisability(disability) {
        this.disabilities.push(disability);
    }
    
    updateProfile(data) {
        Object.assign(this, data);
    }
}

class Session {
    constructor(code, teacherId, subject) {
        this.code = code;
        this.teacherId = teacherId;
        this.subject = subject;
        this.students = [];
        this.captions = [];
        this.startTime = new Date();
        this.isActive = true;
    }
    
    addStudent(student) {
        this.students.push(student);
    }
    
    addCaption(text, speaker) {
        const caption = {
            text,
            speaker,
            timestamp: new Date()
        };
        this.captions.push(caption);
        return caption;
    }
    
    endSession() {
        this.isActive = false;
        this.endTime = new Date();
    }
}

class Note {
    constructor(title, content, sessionId) {
        this.id = Date.now();
        this.title = title;
        this.content = content;
        this.sessionId = sessionId;
        this.createdAt = new Date();
        this.tags = [];
        this.isAIEnhanced = false;
    }
    
    addTag(tag) {
        this.tags.push(tag);
    }
    
    enhanceWithAI() {
        // Simulate AI enhancement
        this.content = `[AI Enhanced] ${this.content}`;
        this.isAIEnhanced = true;
    }
}

// Export for use in other modules
window.SilentSpeak = {
    settings,
    currentUser,
    generateSessionCode,
    formatDate,
    formatDuration,
    showToast,
    copyToClipboard,
    demoLogin,
    User,
    Session,
    Note
};