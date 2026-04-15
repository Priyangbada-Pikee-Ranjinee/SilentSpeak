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
}