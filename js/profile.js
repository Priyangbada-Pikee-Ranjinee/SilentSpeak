/**
 * Profile Management System for Silent Speak
 * Handles user profile editing, security, and activity tracking
 */
 
class ProfileManager {
    constructor() {
        this.user = {
            id: 'user_001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+880 1234 567890',
            dob: '2000-05-15',
            gender: 'male',
            role: 'student',
            institution: 'University of Dhaka',
            department: 'Computer Science',
            semester: '5',
            bio: 'Computer Science student with hearing impairment. Passionate about accessibility technology and inclusive education.',
            disabilities: {
                primary: 'Hearing Impairment',
                additional: ['Color Blindness', 'Dyslexia'],
                assistiveTech: ['Screen Reader', 'Captioning'],
                communicationPrefs: 'Text-based communication preferred, visual cues important'
            },
            stats: {
                sessions: 42,
                notes: 156,
                tasks: 89,
                streakDays: 14,
                profileCompleteness: 85
            },
            security: {
                twoFactorEnabled: true,
                lastPasswordChange: '2023-10-15'
            },
            activity: [],
            lastUpdated: new Date().toISOString()
        };
        
        this.init();
    }
    
    async init() {
        this.loadUserData();
        this.initUI();
        this.setupEventListeners();
        this.loadActivity();
        this.updateStatsDisplay();
    }
    
    loadUserData() {
        try {
            const saved = localStorage.getItem('silentSpeakUserProfile');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.user = { ...this.user, ...parsed };
                console.log('User profile loaded from localStorage');
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }
    
    saveUserData() {
        try {
            this.user.lastUpdated = new Date().toISOString();
            localStorage.setItem('silentSpeakUserProfile', JSON.stringify(this.user));
            console.log('User profile saved to localStorage');
            this.updateStatsDisplay();
            this.showToast('Profile updated successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Error saving user profile:', error);
            this.showToast('Error saving profile', 'error');
            return false;
        }
    }
    
    initUI() {
        // Load basic info
        document.getElementById('firstName').value = this.user.firstName;
        document.getElementById('lastName').value = this.user.lastName;
        document.getElementById('email').value = this.user.email;
        document.getElementById('phone').value = this.user.phone;
        document.getElementById('dob').value = this.user.dob;
        document.getElementById('gender').value = this.user.gender;
        document.getElementById('role').value = this.user.role;
        document.getElementById('institution').value = this.user.institution;
        document.getElementById('department').value = this.user.department;
        document.getElementById('semester').value = this.user.semester;
        document.getElementById('bio').value = this.user.bio;
        
        // Update displayed name
        document.getElementById('userName').textContent = `${this.user.firstName} ${this.user.lastName}`;
        document.getElementById('userRole').textContent = `${this.user.role.charAt(0).toUpperCase() + this.user.role.slice(1)} • Semester ${this.user.semester}`;
        
        // Update disability info
        document.getElementById('primaryDisability').textContent = this.user.disabilities.primary;
        
        const additionalConditions = document.getElementById('additionalConditions');
        additionalConditions.innerHTML = '';
        this.user.disabilities.additional.forEach(condition => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-info me-1 mb-1';
            badge.textContent = condition;
            additionalConditions.appendChild(badge);
        });
        
        const assistiveTech = document.getElementById('assistiveTech');
        assistiveTech.innerHTML = '';
        this.user.disabilities.assistiveTech.forEach(tech => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-success me-1 mb-1';
            badge.textContent = tech;
            assistiveTech.appendChild(badge);
        });
        
        document.getElementById('commPrefs').textContent = this.user.disabilities.communicationPrefs;
        
        // Update security settings
        document.getElementById('twoFactor').checked = this.user.security.twoFactorEnabled;
    }
    
    setupEventListeners() {
        // Profile form submission
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile();
        });
        
        // Two-factor authentication toggle
        document.getElementById('twoFactor').addEventListener('change', (e) => {
            this.user.security.twoFactorEnabled = e.target.checked;
            this.saveUserData();
        });
    }
    
    updateProfile() {
        // Get form values
        this.user.firstName = document.getElementById('firstName').value;
        this.user.lastName = document.getElementById('lastName').value;
        this.user.email = document.getElementById('email').value;
        this.user.phone = document.getElementById('phone').value;
        this.user.dob = document.getElementById('dob').value;
        this.user.gender = document.getElementById('gender').value;
        this.user.role = document.getElementById('role').value;
        this.user.institution = document.getElementById('institution').value;
        this.user.department = document.getElementById('department').value;
        this.user.semester = document.getElementById('semester').value;
        this.user.bio = document.getElementById('bio').value;
        
        // Update displayed name
        document.getElementById('userName').textContent = `${this.user.firstName} ${this.user.lastName}`;
        document.getElementById('userRole').textContent = `${this.user.role.charAt(0).toUpperCase() + this.user.role.slice(1)} • Semester ${this.user.semester}`;
        
        // Save to localStorage
        if (this.saveUserData()) {
            // Add activity log
            this.addActivity('Profile Updated', 'Updated personal information');
        }
    }
    
    changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Basic validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showToast('Please fill in all password fields', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showToast('New passwords do not match', 'error');
            return;
        }
        
        if (newPassword.length < 8) {
            this.showToast('Password must be at least 8 characters long', 'error');
            return;
        }
        
        // In a real app, this would validate with server
        // For demo, we'll just simulate success
        this.user.security.lastPasswordChange = new Date().toISOString().split('T')[0];
        
        // Clear password fields
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
        this.saveUserData();
        this.addActivity('Password Changed', 'Updated account password');
        this.showToast('Password updated successfully!', 'success');
    }
    
    changeProfileImage() {
        // In a real app, this would open a file picker
        // For demo, we'll just change to a random avatar
        const randomId = Math.floor(Math.random() * 1000);
        const profileImage = document.getElementById('profileImage');
        profileImage.src = `https://ui-avatars.com/api/?name=${this.user.firstName}+${this.user.lastName}&background=007bff&color=fff&size=150&bold=true&format=svg&length=2&rounded=true&size=150`;
        
        this.showToast('Profile image updated (demo)', 'info');
        this.addActivity('Profile Image', 'Changed profile picture');
    }
    
    loadActivity() {
        // Demo activity data
        const demoActivity = [
            {
                id: 1,
                date: 'Today, 10:30 AM',
                type: 'Speech to Text',
                icon: 'fas fa-microphone',
                color: 'primary',
                details: 'Converted 5 minutes of speech',
                device: 'Chrome • Windows'
            },
            {
                id: 2,
                date: 'Today, 9:15 AM',
                type: 'Note Created',
                icon: 'fas fa-sticky-note',
                color: 'info',
                details: '"Math Lecture Notes"',
                device: 'Android App'
            },
            {
                id: 3,
                date: 'Yesterday, 3:45 PM',
                type: 'Live Session',
                icon: 'fas fa-broadcast-tower',
                color: 'warning',
                details: 'Joined "Physics 101" class',
                device: 'Chrome • Windows'
            },
            {
                id: 4,
                date: 'Yesterday, 11:20 AM',
                type: 'Pomodoro Completed',
                icon: 'fas fa-clock',
                color: 'success',
                details: 'Completed 4 focus sessions',
                device: 'Chrome • Windows'
            },
            {
                id: 5,
                date: '2 days ago, 2:30 PM',
                type: 'Quick Communication',
                icon: 'fas fa-comment-dots',
                color: 'danger',
                details: 'Used "I need help" phrase',
                device: 'Android App'
            }
        ];
        
        this.user.activity = demoActivity;
        this.renderActivity();
    }
    
    renderActivity() {
        const activityTable = document.getElementById('activityTable');
        if (!activityTable) return;
        
        activityTable.innerHTML = '';
        
        this.user.activity.forEach(activity => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${activity.date}</td>
                <td><i class="${activity.icon} text-${activity.color}"></i> ${activity.type}</td>
                <td>${activity.details}</td>
                <td>${activity.device}</td>
            `;
            activityTable.appendChild(row);
        });
    }
    
    loadMoreActivity() {
        // Simulate loading more activity
        const newActivity = {
            id: this.user.activity.length + 1,
            date: '3 days ago, 10:00 AM',
            type: 'Text to Speech',
            icon: 'fas fa-text-height',
            color: 'purple',
            details: 'Read 3 paragraphs aloud',
            device: 'Chrome • Windows'
        };
        
        this.user.activity.push(newActivity);
        this.renderActivity();
        this.showToast('Loaded more activity', 'info');
    }
    
    addActivity(type, details) {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateString = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        
        const newActivity = {
            id: this.user.activity.length + 1,
            date: `${dateString}, ${timeString}`,
            type: type,
            icon: this.getActivityIcon(type),
            color: this.getActivityColor(type),
            details: details,
            device: this.getCurrentDevice()
        };
        
        this.user.activity.unshift(newActivity); // Add to beginning
        if (this.user.activity.length > 10) {
            this.user.activity.pop(); // Keep only last 10 activities
        }
        
        this.renderActivity();
    }
    
    getActivityIcon(type) {
        const iconMap = {
            'Profile Updated': 'fas fa-user-edit',
            'Password Changed': 'fas fa-key',
            'Profile Image': 'fas fa-camera',
            'Speech to Text': 'fas fa-microphone',
            'Text to Speech': 'fas fa-text-height',
            'Note Created': 'fas fa-sticky-note',
            'Live Session': 'fas fa-broadcast-tower',
            'Pomodoro Completed': 'fas fa-clock',
            'Quick Communication': 'fas fa-comment-dots',
            'Settings Changed': 'fas fa-cog'
        };
        
        return iconMap[type] || 'fas fa-history';
    }
    
    getActivityColor(type) {
        const colorMap = {
            'Profile Updated': 'primary',
            'Password Changed': 'warning',
            'Profile Image': 'info',
            'Speech to Text': 'primary',
            'Text to Speech': 'purple',
            'Note Created': 'info',
            'Live Session': 'warning',
            'Pomodoro Completed': 'success',
            'Quick Communication': 'danger',
            'Settings Changed': 'secondary'
        };
        
        return colorMap[type] || 'secondary';
    }
    
    getCurrentDevice() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome')) {
            return 'Chrome • ' + (userAgent.includes('Windows') ? 'Windows' : 'Other OS');
        } else if (userAgent.includes('Firefox')) {
            return 'Firefox • ' + (userAgent.includes('Android') ? 'Android' : 'Other OS');
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            return 'Safari • ' + (userAgent.includes('Mac') ? 'Mac' : 'Other OS');
        }
        return 'Web Browser';
    }
    
    updateStatsDisplay() {
        document.getElementById('sessionCount').textContent = this.user.stats.sessions;
        document.getElementById('noteCount').textContent = this.user.stats.notes;
        document.getElementById('taskCount').textContent = this.user.stats.tasks;
        document.getElementById('streakDays').textContent = this.user.stats.streakDays;
        
        // Update progress bar
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${this.user.stats.profileCompleteness}%`;
            progressBar.setAttribute('aria-valuenow', this.user.stats.profileCompleteness);
            progressBar.textContent = `${this.user.stats.profileCompleteness}%`;
        }
    }
    
    resetForm() {
        this.initUI();
        this.showToast('Form reset to saved values', 'info');
    }
    
    togglePassword(fieldId) {
        const field = document.getElementById(fieldId);
        const button = field.nextElementSibling;
        const icon = button.querySelector('i');
        
        if (field.type === 'password') {
            field.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            field.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }
    
    showToast(message, type = 'info') {
        // Create alert element using DaisyUI classes
        const alert = document.createElement('div');
        alert.className = `alert alert-${type === 'error' ? 'error' : type === 'success' ? 'success' : 'info'} shadow-lg max-w-md mx-auto mb-4`;
        alert.setAttribute('role', 'alert');
        
        alert.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'} mr-3"></i>
                <span>${message}</span>
            </div>
            <button class="btn btn-sm btn-ghost" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add to alert container or create one
        let container = document.getElementById('alertContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'alertContainer';
            container.className = 'fixed top-4 right-4 z-50 w-full max-w-sm';
            document.body.appendChild(container);
        }
        
        container.appendChild(alert);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }
    
    getUserData() {
        return { ...this.user };
    }
}

// Global functions for HTML onclick handlers
function changeProfileImage() {
    if (window.profileManager) {
        window.profileManager.changeProfileImage();
    }
}

function changePassword() {
    if (window.profileManager) {
        window.profileManager.changePassword();
    }
}

function resetForm() {
    if (window.profileManager) {
        window.profileManager.resetForm();
    }
}

function loadMoreActivity() {
    if (window.profileManager) {
        window.profileManager.loadMoreActivity();
    }
}

function togglePassword(fieldId) {
    if (window.profileManager) {
        window.profileManager.togglePassword(fieldId);
    }
}

// Initialize profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
});