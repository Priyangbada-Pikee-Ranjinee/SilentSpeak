
class LiveSession {
    constructor() {
        this.currentRole = null;
        this.sessionActive = false;
        this.sessionCode = 'ABC123';
        this.sessionName = 'Math 101 - Algebra';
        this.sessionId = null;
        this.captions = [];
        this.messages = [];
        this.tasks = [];
        this.students = [
            { id: 'ahmed', name: 'Ahmed Rahman', online: true },
            { id: 'fatima', name: 'Fatima Begum', online: true },
            { id: 'rahim', name: 'Rahim Khan', online: true },
            { id: 'sara', name: 'Sara Ahmed', online: false }
        ];
        this.recognition = null;
        this.captionInterval = null;
        this.sessionStartTime = null;
        
        // Real-time communication properties
        this.realtimePollingInterval = null;
        this.lastUpdateTime = Math.floor(Date.now() / 1000);
        this.apiBaseUrl = 'php/api';
        this.isConnectedToAPI = false;
        this.pollingEnabled = true;
        this.pollingInterval = 3000; // 3 seconds
        
        this.init();
    }
    
    init() {
        // Check if we're coming back to a session
        const savedRole = localStorage.getItem('liveSessionRole');
        if (savedRole) {
            this.selectRole(savedRole);
        }
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize demo data
        this.initializeDemoData();
    }
    
    setupEventListeners() {
        // Role selection cards
        document.querySelectorAll('.role-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const role = card.dataset.role;
                    this.selectRole(role);
                }
            });
        });
        
        // Quick message buttons for students
        document.querySelectorAll('.quick-msg-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const msg = btn.dataset.msg;
                this.sendQuickMessage(msg);
            });
        });
    }
    
    initializeDemoData() {
        // Initialize demo captions
        this.captions = [
            { time: '10:30', text: 'Welcome to today\'s Math class on Algebra', speaker: 'teacher' },
            { time: '10:31', text: 'Today we\'ll be learning about quadratic equations', speaker: 'teacher' },
            { time: '10:32', text: 'The general form is ax² + bx + c = 0', speaker: 'teacher' },
            { time: '10:33', text: 'Can anyone tell me what \'a\' represents?', speaker: 'teacher' }
        ];
        
        // Initialize demo messages
        this.messages = [
            { sender: 'Ahmed', text: 'I have a question about the quadratic formula', time: '10:31', type: 'received' },
            { sender: 'You', text: 'Please ask your question', time: '10:32', type: 'sent' },
            { sender: 'Fatima', text: 'Can you repeat the formula?', time: '10:33', type: 'received' }
        ];
        
        // Initialize demo tasks
        this.tasks = [
            { id: 1, title: 'Solve quadratic equations (CW)', due: 'Today', status: 'active' },
            { id: 2, title: 'Chapter 5 exercises (HW)', due: 'Tomorrow', status: 'assigned' },
            { id: 3, title: 'Algebra project', due: 'Next week', status: 'pending' }
        ];
    }
    
    selectRole(role) {
        this.currentRole = role;
        localStorage.setItem('liveSessionRole', role);
        
        // Hide role selection
        const roleSelection = document.getElementById('roleSelection');
        if (roleSelection) {
            roleSelection.classList.add('d-none');
        }
        
        // Show appropriate panel
        if (role === 'teacher') {
            this.showTeacherPanel();
        } else if (role === 'student') {
            this.showStudentPanel();
        }
        