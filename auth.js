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
}