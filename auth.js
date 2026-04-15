class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.users = this.loadUsers();
    }
    
    // Load users from localStorage
    loadUsers() {
        const usersJson = localStorage.getItem('silentSpeakUsers');
        return usersJson ? JSON.parse(usersJson) : [];
    }
    
    // Save users to localStorage
    saveUsers() {
        localStorage.setItem('silentSpeakUsers', JSON.stringify(this.users));
    }


     // Register a new user
    register(userData) {
        // Validate required fields
        if (!userData.email || !userData.password || !userData.name) {
            return { success: false, message: 'All required fields must be filled' };
        }
        
        // Check if user already exists
        if (this.users.find(u => u.email === userData.email)) {
            return { success: false, message: 'User with this email already exists' };
        }
        
        // Validate password strength
        const passwordValidation = this.validatePassword(userData.password);
        if (!passwordValidation.isValid) {
            return { 
                success: false, 
                message: 'Password must be at least 8 characters with uppercase, lowercase, and numbers' 
            };
        }
        
        // Create user object
        const user = {
            id: Date.now(),
            email: userData.email,
            password: this.hashPassword(userData.password), // In production, use proper hashing
            name: userData.name,
            role: userData.role || 'student',
            disabilities: userData.disabilities || [],
            institution: userData.institution || '',
            semester: userData.semester || '',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            settings: {
                fontSize: 'normal',
                theme: 'light',
                colorBlindMode: false,
                language: 'en'
            }
        };
        
        // Add to users array
        this.users.push(user);
        this.saveUsers();
        
        // Log the user in
        this.login(userData.email, userData.password);
        
        return { 
            success: true, 
            message: 'Registration successful!',
            user: { ...user, password: undefined } // Don't return password
        };
    }


    // Login user
    login(email, password) {
        // Find user
        const user = this.users.find(u => u.email === email);
        
        if (!user) {
            return { success: false, message: 'User not found' };
        }
        
        // Check password (in production, compare hashed passwords)
        if (this.hashPassword(password) !== user.password) {
            return { success: false, message: 'Invalid password' };
        }
        
        // Update last login
        user.lastLogin = new Date().toISOString();
        this.saveUsers();
        
        // Set current user (without password)
        this.currentUser = { ...user, password: undefined };
        this.isAuthenticated = true;
        
        // Save to session
        localStorage.setItem('silentSpeakCurrentUser', JSON.stringify(this.currentUser));
        
        return { 
            success: true, 
            message: 'Login successful!',
            user: this.currentUser
        };
    }

    // Logout user
    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('silentSpeakCurrentUser');
        return { success: true, message: 'Logged out successfully' };
    }
    
    // Get current user
    getCurrentUser() {
        if (!this.currentUser) {
            const savedUser = localStorage.getItem('silentSpeakCurrentUser');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                this.isAuthenticated = true;
            }
        }
        return this.currentUser;
    }
    
    // Check if user is authenticated
    checkAuth() {
        return this.isAuthenticated || !!localStorage.getItem('silentSpeakCurrentUser');
    }

    // Update user profile
    updateProfile(userId, updates) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }
        
        // Update user data
        this.users[userIndex] = { ...this.users[userIndex], ...updates };
        this.saveUsers();
        
        // Update current user if it's the same user
        if (this.currentUser && this.currentUser.id === userId) {
            this.currentUser = { ...this.currentUser, ...updates };
            localStorage.setItem('silentSpeakCurrentUser', JSON.stringify(this.currentUser));
        }
        
        return { success: true, message: 'Profile updated successfully' };
    }

    
    // Change password
    changePassword(userId, currentPassword, newPassword) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            return { success: false, message: 'User not found' };
        }
        
        // Verify current password
        if (this.hashPassword(currentPassword) !== user.password) {
            return { success: false, message: 'Current password is incorrect' };
        }
        
        // Validate new password
        const passwordValidation = this.validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return { 
                success: false, 
                message: 'New password must be at least 8 characters with uppercase, lowercase, and numbers' 
            };
        }
        // Update password
        user.password = this.hashPassword(newPassword);
        this.saveUsers();
        
        return { success: true, message: 'Password changed successfully' };
    }


     // Password validation
    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        
        return {
            isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
            minLength: password.length >= minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers
        };
    }

    
    // Simple hash function (for demo only - in production use bcrypt or similar)
    hashPassword(password) {
        // This is a simple demo hash - NOT secure for production
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    
    // Reset password (demo)
    resetPassword(email) {
        const user = this.users.find(u => u.email === email);
        if (!user) {
            return { success: false, message: 'User not found' };
        }
        
        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        user.password = this.hashPassword(tempPassword);
        this.saveUsers();
        
        // In production, send email with temp password
        console.log(`Password reset for ${email}. Temporary password: ${tempPassword}`);
        
        return { 
            success: true, 
            message: 'Password reset instructions sent to your email',
            tempPassword: tempPassword // Only for demo
        };
    }

     // Get all users (admin function)
    getAllUsers() {
        return this.users.map(user => ({ ...user, password: undefined }));
    }
    
    // Delete user (admin function)
    deleteUser(userId) {
        const initialLength = this.users.length;
        this.users = this.users.filter(u => u.id !== userId);
        
        if (this.users.length < initialLength) {
            this.saveUsers();
            
            // If deleted user is current user, logout
            if (this.currentUser && this.currentUser.id === userId) {
                this.logout();
            }
            
            return { success: true, message: 'User deleted successfully' };
        }
        
        return { success: false, message: 'User not found' };
    }

}

// Create global auth instance
const auth = new AuthSystem();

// Demo data initialization
function initializeDemoData() {
    // Check if demo data already exists
    if (!localStorage.getItem('silentSpeakDemoInitialized')) {
        const demoUsers = [
            {
                id: 1,
                email: 'teacher@example.com',
                password: auth.hashPassword('Teacher123'),
                name: 'Sarah Johnson',
                role: 'teacher',
                disabilities: [],
                institution: 'University of Dhaka',
                semester: '',
                createdAt: '2023-01-15T10:30:00Z',
                lastLogin: null,
                settings: { fontSize: 'normal', theme: 'light', colorBlindMode: false, language: 'en' }
            },
            {
                id: 2,
                email: 'student@example.com',
                password: auth.hashPassword('Student123'),
                name: 'Ahmed Rahman',
                role: 'student',
                disabilities: ['hearing'],
                institution: 'University of Dhaka',
                semester: '5',
                createdAt: '2023-02-20T14:45:00Z',
                lastLogin: null,
                settings: { fontSize: 'large', theme: 'colorblind', colorBlindMode: true, language: 'bn' }
            },
            {
                id: 3,
                email: 'parent@example.com',
                password: auth.hashPassword('Parent123'),
                name: 'Fatima Begum',
                role: 'parent',
                disabilities: [],
                institution: '',
                semester: '',
                createdAt: '2023-03-10T09:15:00Z',
                lastLogin: null,
                settings: { fontSize: 'normal', theme: 'light', colorBlindMode: false, language: 'en' }
            }
        ];
        
        localStorage.setItem('silentSpeakUsers', JSON.stringify(demoUsers));
        localStorage.setItem('silentSpeakDemoInitialized', 'true');
    }
}

// Initialize demo data on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeDemoData();
    
    // Check auth status and update UI
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
        updateUIForAuthenticatedUser(currentUser);
    }
});


// Update UI for authenticated user
function updateUIForAuthenticatedUser(user) {
    // Update user name in navbar
    const userElements = document.querySelectorAll('.user-name, .user-email, .user-role');
    userElements.forEach(element => {
        if (element.classList.contains('user-name')) {
            element.textContent = user.name;
        }
        if (element.classList.contains('user-email')) {
            element.textContent = user.email;
        }
        if (element.classList.contains('user-role')) {
            element.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        }
    });
    

    // Update avatar
    const avatarElements = document.querySelectorAll('.user-avatar');
    avatarElements.forEach(element => {
        if (element.tagName === 'IMG') {
            element.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=007bff&color=fff&size=100`;
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

// Export for use in other modules
window.AuthSystem = AuthSystem;
window.auth = auth;


// Helper functions for forms
function handleLoginForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = form.querySelector('#email').value;
        const password = form.querySelector('#password').value;
        const rememberMe = form.querySelector('#rememberMe')?.checked || false;
        
        const result = auth.login(email, password);
        
        if (result.success) {
            window.SilentSpeak.showToast(result.message, 'success');
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = '../app.html';
            }, 1000);
        } else {
            window.SilentSpeak.showToast(result.message, 'danger');
        }
    });
}
