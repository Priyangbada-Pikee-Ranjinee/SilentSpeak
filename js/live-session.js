/**
 * Live Session Module for Silent Speak
 * Handles teacher/student roles, live captioning, communication, and session management
 */
 
class LiveSession {
    constructor() {
        this.currentRole = null;
        this.sessionActive = false;
        this.sessionCode = this.generateRandomSessionCode();
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
        
        // Microphone properties
        this.microphoneActive = false;
        this.speechSimulationInterval = null;
        
        // Speech recognition properties
        this.speechRecognition = null;
        this.isSpeechRecognitionSupported = false;
        this.currentTranscript = '';
        this.interimTranscript = '';
        
        // Real-time communication properties
        this.realtimePollingInterval = null;
        this.lastUpdateTime = Math.floor(Date.now() / 1000);
        this.apiBaseUrl = 'php/api';
        this.isConnectedToAPI = false;
        this.pollingEnabled = true;
        this.pollingInterval = 3000; // 3 seconds
        
        this.init();
    }
    
    generateRandomSessionCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    
    init() {
        // Check if we're coming back to a session
        const savedRole = localStorage.getItem('liveSessionRole');
        if (savedRole) {
            this.selectRole(savedRole);
        }
        
        // Check speech recognition support
        this.checkSpeechRecognitionSupport();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize demo data
        this.initializeDemoData();
    }
    
    checkSpeechRecognitionSupport() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech recognition is not supported in this browser.');
            this.isSpeechRecognitionSupported = false;
            return false;
        }
        
        this.speechRecognition = new SpeechRecognition();
        this.configureSpeechRecognition();
        this.isSpeechRecognitionSupported = true;
        return true;
    }
    
    configureSpeechRecognition() {
        if (!this.speechRecognition) return;
        
        // Get selected language from dropdown
        const languageSelect = document.getElementById('captionLanguage');
        const language = languageSelect ? languageSelect.value : 'en-US';
        
        this.speechRecognition.lang = language;
        this.speechRecognition.continuous = true;
        this.speechRecognition.interimResults = true;
        this.speechRecognition.maxAlternatives = 3;
        
        // Set up event handlers
        this.speechRecognition.onstart = this.onSpeechRecognitionStart.bind(this);
        this.speechRecognition.onresult = this.onSpeechRecognitionResult.bind(this);
        this.speechRecognition.onerror = this.onSpeechRecognitionError.bind(this);
        this.speechRecognition.onend = this.onSpeechRecognitionEnd.bind(this);
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
        
        // Session control buttons
        this.setupSessionControlListeners();
        
        // Microphone control buttons
        this.setupMicrophoneListeners();
        
        // Communication send button
        this.setupCommunicationListeners();
        
        // Assignment creation button
        this.setupAssignmentListeners();
        
        // Student panel listeners
        this.setupStudentListeners();
    }
    
    setupSessionControlListeners() {
        // Start Session button
        const startBtn = document.getElementById('startSessionBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startSession();
            });
        }
        
        // Pause Session button
        const pauseBtn = document.getElementById('pauseSessionBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.pauseSession();
            });
        }
        
        // End Session button
        const endBtn = document.getElementById('endSessionBtn');
        if (endBtn) {
            endBtn.addEventListener('click', () => {
                this.endSession();
            });
        }
    }
    
    setupMicrophoneListeners() {
        // Start Microphone button
        const startMicBtn = document.getElementById('startMicBtn');
        if (startMicBtn) {
            startMicBtn.addEventListener('click', () => {
                this.startMicrophone();
            });
        }
        
        // Stop Microphone button
        const stopMicBtn = document.getElementById('stopMicBtn');
        if (stopMicBtn) {
            stopMicBtn.addEventListener('click', () => {
                this.stopMicrophone();
            });
        }
    }
    
    setupCommunicationListeners() {
        // Send Message button
        const sendBtn = document.getElementById('sendMessageBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this.sendTeacherMessage();
            });
        }
        
        // Also add Enter key support for the message input
        const messageInput = document.getElementById('teacherMessage');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendTeacherMessage();
                }
            });
        }
    }
    
    setupAssignmentListeners() {
        // Add Assignment button
        const addAssignmentBtn = document.getElementById('addAssignmentBtn');
        if (addAssignmentBtn) {
            addAssignmentBtn.addEventListener('click', () => {
                this.createAssignment();
            });
        }
        
        // Add Enter key support for assignment title input
        const titleInput = document.getElementById('assignmentTitle');
        if (titleInput) {
            titleInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.createAssignment();
                }
            });
        }
    }
    
    setupStudentListeners() {
        // Join Session button
        const joinSessionBtn = document.getElementById('joinSessionBtn');
        if (joinSessionBtn) {
            joinSessionBtn.addEventListener('click', () => {
                this.joinSession();
            });
        }
        
        // Enter key support for session code input
        const sessionCodeInput = document.getElementById('studentSessionCode');
        if (sessionCodeInput) {
            sessionCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.joinSession();
                }
            });
        }
        
        // Send Student Message button
        const sendStudentMessageBtn = document.getElementById('sendStudentMessageBtn');
        if (sendStudentMessageBtn) {
            sendStudentMessageBtn.addEventListener('click', () => {
                this.sendStudentMessage();
            });
        }
        
        // Enter key support for student message input
        const studentMessageInput = document.getElementById('studentMessage');
        if (studentMessageInput) {
            studentMessageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendStudentMessage();
                }
            });
        }
        
        // Save Notes button
        const saveNotesBtn = document.getElementById('saveNotesBtn');
        if (saveNotesBtn) {
            saveNotesBtn.addEventListener('click', () => {
                this.saveStudentNotes();
            });
        }
        
        // Download Captions button
        const downloadCaptionsBtn = document.getElementById('downloadCaptionsBtn');
        if (downloadCaptionsBtn) {
            downloadCaptionsBtn.addEventListener('click', () => {
                this.downloadStudentCaptions();
            });
        }
        
        // Leave Session button
        const leaveSessionBtn = document.getElementById('leaveSessionBtn');
        if (leaveSessionBtn) {
            leaveSessionBtn.addEventListener('click', () => {
                this.leaveSession();
            });
        }
        
        // Clear Student Captions button
        const clearStudentCaptionsBtn = document.getElementById('clearStudentCaptionsBtn');
        if (clearStudentCaptionsBtn) {
            clearStudentCaptionsBtn.addEventListener('click', () => {
                this.clearStudentCaptions();
            });
        }
        
        // Enhance Notes button
        const enhanceNotesBtn = document.getElementById('enhanceNotesBtn');
        if (enhanceNotesBtn) {
            enhanceNotesBtn.addEventListener('click', () => {
                this.enhanceStudentNotes();
            });
        }
        
        // Quick action buttons
        const quickActionButtons = ['askQuestionBtn', 'requestRepeatBtn', 'needHelpBtn', 'confusedBtn'];
        quickActionButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => {
                    const action = btnId.replace('Btn', '');
                    this.studentAction(action);
                });
            }
        });
        
        // Auto scroll toggle for student
        const studentAutoScroll = document.getElementById('studentAutoScroll');
        if (studentAutoScroll) {
            studentAutoScroll.addEventListener('change', (e) => {
                this.toggleAutoScroll(e.target.checked, 'student');
            });
        }
        
        // Show translation toggle for student
        const studentShowTranslation = document.getElementById('studentShowTranslation');
        if (studentShowTranslation) {
            studentShowTranslation.addEventListener('change', (e) => {
                this.toggleTranslation(e.target.checked);
            });
        }
    }
    
    // Microphone functionality
    startMicrophone() {
        if (this.microphoneActive) {
            this.showToast('Microphone is already active', 'warning');
            return;
        }
        
        // Check if speech recognition is supported
        if (!this.isSpeechRecognitionSupported || !this.speechRecognition) {
            this.showToast('Speech recognition is not supported in your browser. Using simulation mode.', 'warning');
            this.startSimulationMode();
            return;
        }
        
        this.showToast('Starting microphone...', 'info');
        
        // Update button states
        const startBtn = document.getElementById('startMicBtn');
        const stopBtn = document.getElementById('stopMicBtn');
        
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        
        try {
            // Configure with current language setting
            this.configureSpeechRecognition();
            
            // Start real speech recognition
            this.speechRecognition.start();
            this.microphoneActive = true;
            
            this.showToast('Microphone started. Speak now for live captioning.', 'success');
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            this.showToast('Failed to start microphone. Using simulation mode.', 'error');
            this.startSimulationMode();
        }
    }
    
    startSimulationMode() {
        // Fallback to simulation mode
        this.microphoneActive = true;
        
        // Update button states
        const startBtn = document.getElementById('startMicBtn');
        const stopBtn = document.getElementById('stopMicBtn');
        
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        
        this.simulateSpeechRecognition();
        this.showToast('Simulation mode activated. Demo captions will be generated.', 'info');
    }
    
    stopMicrophone() {
        if (!this.microphoneActive) {
            this.showToast('Microphone is not active', 'warning');
            return;
        }
        
        this.showToast('Stopping microphone...', 'info');
        
        // Update button states
        const startBtn = document.getElementById('startMicBtn');
        const stopBtn = document.getElementById('stopMicBtn');
        
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
        
        // Stop real speech recognition if active
        if (this.speechRecognition && this.isSpeechRecognitionSupported) {
            try {
                this.speechRecognition.stop();
            } catch (error) {
                console.error('Error stopping speech recognition:', error);
            }
        }
        
        // Stop speech recognition simulation
        if (this.speechSimulationInterval) {
            clearInterval(this.speechSimulationInterval);
            this.speechSimulationInterval = null;
        }
        
        this.microphoneActive = false;
        this.showToast('Microphone stopped.', 'success');
    }
    
    // Speech Recognition Event Handlers
    onSpeechRecognitionStart() {
        console.log('Speech recognition started');
        this.showToast('Speech recognition started. Speak now for live captioning.', 'success');
        
        // Update UI to show recognition is active
        const captionBox = document.getElementById('teacherCaptionBox');
        if (captionBox) {
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'text-xs text-success mb-2';
            statusIndicator.textContent = '🎤 Live captioning active...';
            captionBox.prepend(statusIndicator);
        }
    }
    
    onSpeechRecognitionResult(event) {
        if (!event.results || event.results.length === 0) return;
        
        const result = event.results[event.resultIndex];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        
        // Check if this is an interim result or final result
        if (result.isFinal) {
            // Final result - add as caption
            this.currentTranscript = transcript;
            this.interimTranscript = '';
            
            // Get current time
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            // Add as caption
            this.addCaption(timeStr, transcript, 'teacher');
            
            // Send caption to students via API if connected
            if (this.sessionId && this.isConnectedToAPI) {
                this.sendCaptionAPI(transcript, this.speechRecognition.lang, confidence);
            }
            
            // Update UI
            this.updateUI();
            
            console.log('Final transcript:', transcript, 'Confidence:', confidence);
        } else {
            // Interim result - show in UI but don't save yet
            this.interimTranscript = transcript;
            
            // Update UI to show interim result
            this.updateInterimTranscriptDisplay(transcript);
            
            console.log('Interim transcript:', transcript);
        }
    }
    
    onSpeechRecognitionError(event) {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = 'Speech recognition error: ';
        switch (event.error) {
            case 'no-speech':
                errorMessage += 'No speech detected. Please speak louder or check your microphone.';
                break;
            case 'audio-capture':
                errorMessage += 'No microphone found. Please ensure a microphone is connected.';
                break;
            case 'not-allowed':
                errorMessage += 'Microphone access denied. Please allow microphone access in your browser settings.';
                break;
            case 'network':
                errorMessage += 'Network error occurred. Please check your internet connection.';
                break;
            default:
                errorMessage += event.error;
        }
        
        this.showToast(errorMessage, 'error');
        
        // Fall back to simulation mode
        if (this.microphoneActive) {
            this.showToast('Falling back to simulation mode.', 'warning');
            this.startSimulationMode();
        }
    }
    
    onSpeechRecognitionEnd() {
        console.log('Speech recognition ended');
        
        // If microphone is still supposed to be active, restart recognition
        if (this.microphoneActive && this.isSpeechRecognitionSupported) {
            setTimeout(() => {
                try {
                    this.speechRecognition.start();
                    this.showToast('Speech recognition restarted.', 'info');
                } catch (error) {
                    console.error('Error restarting speech recognition:', error);
                    this.showToast('Failed to restart speech recognition. Using simulation mode.', 'error');
                    this.startSimulationMode();
                }
            }, 100);
        }
    }
    
    updateInterimTranscriptDisplay(transcript) {
        const captionBox = document.getElementById('teacherCaptionBox');
        if (!captionBox) return;
        
        // Find or create interim transcript element
        let interimElement = captionBox.querySelector('.interim-transcript');
        if (!interimElement) {
            interimElement = document.createElement('div');
            interimElement.className = 'interim-transcript text-muted italic';
            captionBox.appendChild(interimElement);
        }
        
        // Update with interim transcript
        interimElement.textContent = `...${transcript}`;
        
        // Auto scroll to show latest
        this.autoScrollCaptions('teacherCaptionBox');
    }
    
    simulateSpeechRecognition() {
        // Demo phrases that a teacher might say
        const demoPhrases = [
            "Good morning class",
            "Today we're learning about algebra",
            "Please open your textbooks to page 45",
            "The quadratic formula is x equals negative b plus or minus the square root of b squared minus 4ac all over 2a",
            "Does anyone have questions?",
            "Let's work through an example together",
            "The first step is to identify the coefficients",
            "Remember to check your work",
            "Homework will be due on Friday",
            "Great participation today everyone"
        ];
        
        let phraseIndex = 0;
        
        this.speechSimulationInterval = setInterval(() => {
            if (phraseIndex >= demoPhrases.length) {
                phraseIndex = 0; // Loop back to start
            }
            
            const phrase = demoPhrases[phraseIndex];
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            // Add as caption
            this.addCaption(timeStr, phrase, 'teacher');
            
            phraseIndex++;
        }, 10000); // Add a new phrase every 10 seconds
    }
    
    // Assignment creation functionality
    createAssignment() {
        // Get assignment inputs by ID
        const titleInput = document.getElementById('assignmentTitle');
        const descriptionInput = document.getElementById('assignmentDescription');
        
        if (!titleInput || !descriptionInput) return;
        
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        
        if (!title) {
            this.showToast('Please enter an assignment title', 'warning');
            titleInput.focus();
            return;
        }
        
        // Create new assignment
        const newAssignment = {
            id: Date.now(),
            title: title,
            description: description || 'No description provided',
            due: 'Tomorrow',
            status: 'active',
            createdAt: new Date().toLocaleDateString()
        };
        
        // Add to tasks array
        this.tasks.unshift(newAssignment);
        
        // Render tasks
        this.renderTasks();
        
        // Clear inputs
        titleInput.value = '';
        descriptionInput.value = '';
        
        this.showToast('Assignment created successfully!', 'success');
        
        // Update UI
        this.updateUI();
    }
    
    initializeDemoData() {
        // Start with empty arrays - no demo data
        this.captions = [];
        this.messages = [];
        this.tasks = [];
        
        // Add welcome message only
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        this.messages.push({
            sender: 'System',
            text: 'Welcome to the live session! Start by speaking or sending a message.',
            time: timeStr,
            type: 'received'
        });
    }
    
    selectRole(role) {
        // Get authenticated user's role
        const userRole = this.getAuthenticatedUserRole();
        
        // Check if user is trying to switch to a different role than their authenticated role
        if (userRole && userRole !== role) {
            this.showToast(`You cannot switch to ${role} role. Your authenticated role is ${userRole}.`, 'error');
            return;
        }
        
        this.currentRole = role;
        localStorage.setItem('liveSessionRole', role);
        
        // Hide role selection
        const roleSelection = document.getElementById('roleSelection');
        if (roleSelection) {
            roleSelection.classList.add('hidden');
        }
        
        // Show appropriate panel
        if (role === 'teacher') {
            this.showTeacherPanel();
        } else if (role === 'student') {
            this.showStudentPanel();
        }
        
        // Update UI
        this.updateUI();
        
        // Show notification
        this.showToast(`You are now a ${role}.`, 'success');
    }
    
    getAuthenticatedUserRole() {
        let currentUser = null;
        
        // Try to get user from auth system first
        if (window.auth && typeof window.auth.getCurrentUser === 'function') {
            currentUser = window.auth.getCurrentUser();
        }
        
        // Fallback to localStorage
        if (!currentUser) {
            const userData = localStorage.getItem('silentSpeakCurrentUser') ||
                            localStorage.getItem('silentSpeakUser') ||
                            localStorage.getItem('currentUser');
            if (userData) {
                try {
                    currentUser = JSON.parse(userData);
                } catch (e) {
                    console.error('Error parsing user data:', e);
                }
            }
        }
        
        return currentUser ? currentUser.role || 'student' : null;
    }
    
    showTeacherPanel() {
        const teacherPanel = document.getElementById('teacherPanel');
        if (teacherPanel) {
            teacherPanel.classList.remove('hidden');
        }
        
        // Update session info
        this.updateSessionInfo();
        
        // Render captions
        this.renderCaptions('teacherCaptionBox');
        
        // Render messages
        this.renderMessages();
        
        // Render tasks
        this.renderTasks();
        
        // Render students
        this.renderStudents();
    }
    
    showStudentPanel() {
        const studentPanel = document.getElementById('studentPanel');
        if (studentPanel) {
            studentPanel.classList.remove('hidden');
        }
        
        // Show join session section by default
        const joinSection = document.getElementById('joinSessionSection');
        const activeSection = document.getElementById('activeSessionSection');
        
        if (joinSection && activeSection) {
            joinSection.classList.remove('hidden');
            activeSection.classList.add('hidden');
        }
        
        // Set student name from authentication system if available
        let currentUser = null;
        
        // Try to get user from auth system first
        if (window.auth && typeof window.auth.getCurrentUser === 'function') {
            currentUser = window.auth.getCurrentUser();
        }
        
        // Fallback to localStorage
        if (!currentUser) {
            const userData = localStorage.getItem('silentSpeakCurrentUser') || localStorage.getItem('silentSpeakUser') || localStorage.getItem('currentUser');
            if (userData) {
                try {
                    currentUser = JSON.parse(userData);
                } catch (e) {
                    console.error('Error parsing user data:', e);
                }
            }
        }
        
        if (currentUser && currentUser.name) {
            const studentNameInput = document.getElementById('studentTeacherName');
            if (studentNameInput) {
                studentNameInput.value = currentUser.name;
            }
        }
        
        // Setup student event listeners
        this.setupStudentListeners();
        
        // Render student-specific data
        this.renderStudentCaptions();
        this.renderStudentAssignments();
        this.renderStudentMessages();
        
        // Update student stats
        this.updateStudentStats();
        
        this.showToast('Student panel loaded. Enter a session code to join.', 'info');
    }
    
    updateSessionInfo() {
        const sessionCodeInput = document.getElementById('sessionCode');
        const sessionNameInput = document.getElementById('sessionName');
        
        if (sessionCodeInput) {
            sessionCodeInput.value = this.sessionCode;
        }
        
        if (sessionNameInput) {
            sessionNameInput.value = this.sessionName;
        }
    }
    
    renderCaptions(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        this.captions.forEach(caption => {
            const line = document.createElement('div');
            line.className = 'caption-line';
            
            const showTimestamps = document.getElementById('showTimestamps');
            const timestamp = showTimestamps && showTimestamps.checked ? `[${caption.time}] ` : '';
            
            line.textContent = `${timestamp}${caption.text}`;
            container.appendChild(line);
        });
        
        // Auto scroll if enabled
        this.autoScrollCaptions(containerId);
    }
    
    renderMessages() {
        const messageBox = document.getElementById('teacherChatBox');
        if (!messageBox) return;
        
        messageBox.innerHTML = '';
        
        this.messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.type} mb-2 p-2 rounded-lg`;
            
            // Add different styling for sent vs received messages
            if (msg.type === 'sent') {
                messageDiv.classList.add('bg-primary', 'text-primary-content', 'ml-auto', 'max-w-xs');
            } else {
                messageDiv.classList.add('bg-base-300', 'text-base-content', 'mr-auto', 'max-w-xs');
            }
            
            const sender = msg.sender === 'You' ? 'You' : msg.sender;
            const time = msg.time || '';
            
            messageDiv.innerHTML = `
                <div class="font-bold text-sm">${sender}</div>
                <div class="text-sm">${msg.text}</div>
                <div class="text-xs opacity-70 mt-1">${time}</div>
            `;
            
            messageBox.appendChild(messageDiv);
        });
        
        // Scroll to bottom
        messageBox.scrollTop = messageBox.scrollHeight;
    }
    
    renderTasks() {
        const assignmentList = document.getElementById('assignmentList');
        if (!assignmentList) return;
        
        // Clear the container but keep the "no assignments" message
        const noAssignmentsMsg = document.getElementById('noAssignmentsMessage');
        assignmentList.innerHTML = '';
        if (noAssignmentsMsg) {
            assignmentList.appendChild(noAssignmentsMsg);
        }
        
        if (this.tasks.length === 0) {
            // Show the "no assignments" message
            if (noAssignmentsMsg) {
                noAssignmentsMsg.classList.remove('hidden');
            }
            return;
        }
        
        // Hide the "no assignments" message
        if (noAssignmentsMsg) {
            noAssignmentsMsg.classList.add('hidden');
        }
        
        // Render each task
        this.tasks.forEach(task => {
            const assignmentItem = document.createElement('div');
            assignmentItem.className = 'assignment-item p-3 border rounded-lg bg-base-100';
            
            let badgeClass = 'badge-secondary';
            let badgeText = task.status.charAt(0).toUpperCase() + task.status.slice(1);
            
            if (task.status === 'active') {
                badgeClass = 'badge-primary';
            } else if (task.status === 'assigned') {
                badgeClass = 'badge-info';
            } else if (task.status === 'pending') {
                badgeClass = 'badge-warning';
            }
            
            assignmentItem.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <h5 class="font-medium">${task.title}</h5>
                        <p class="text-sm text-base-content/70">${task.description || 'No description'}</p>
                        <p class="text-xs text-base-content/50 mt-1">Due: ${task.due || 'No due date'} | Created: ${task.createdAt || 'Today'}</p>
                    </div>
                    <span class="badge ${badgeClass}">${badgeText}</span>
                </div>
            `;
            
            assignmentList.appendChild(assignmentItem);
        });
    }
    
    renderStudents() {
        const studentsContainer = document.querySelector('.connected-students');
        if (!studentsContainer) return;
        
        studentsContainer.innerHTML = '';
        
        this.students.forEach(student => {
            const badge = document.createElement('span');
            badge.className = `badge ${student.online ? 'bg-primary' : 'bg-secondary'} me-2 mb-2`;
            badge.textContent = `${student.name} (${student.online ? 'Online' : 'Offline'})`;
            studentsContainer.appendChild(badge);
        });
    }
    
    // Student-specific rendering methods
    renderStudentCaptions() {
        const container = document.getElementById('studentCaptionBox');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.captions.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-base-content/50">No captions yet. Join a session to see live captions.</div>';
            return;
        }
        
        this.captions.forEach(caption => {
            const line = document.createElement('div');
            line.className = 'caption-line border-b border-base-300 py-2';
            
            const showTimestamps = document.getElementById('studentAutoScroll')?.checked || true;
            const timestamp = showTimestamps ? `[${caption.time}] ` : '';
            
            let captionText = `${timestamp}${caption.text}`;
            
            // Add translation if enabled and available
            const showTranslation = document.getElementById('studentShowTranslation')?.checked;
            if (showTranslation && caption.translation) {
                captionText += `\n<span class="text-sm text-primary">${caption.translation}</span>`;
                line.innerHTML = captionText;
            } else {
                line.textContent = captionText;
            }
            
            container.appendChild(line);
        });
        
        // Auto scroll if enabled
        const autoScroll = document.getElementById('studentAutoScroll');
        if (autoScroll && autoScroll.checked) {
            container.scrollTop = container.scrollHeight;
        }
    }
    
    renderStudentAssignments() {
        const container = document.getElementById('studentAssignmentList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.tasks.length === 0) {
            container.innerHTML = '<div class="text-center py-4 text-base-content/50" id="noStudentAssignmentsMessage">No assignments yet. Check back later.</div>';
            return;
        }
        
        this.tasks.forEach((task, index) => {
            const assignmentDiv = document.createElement('div');
            assignmentDiv.className = 'card bg-base-100 shadow-sm';
            assignmentDiv.innerHTML = `
                <div class="card-body p-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <h5 class="font-bold">${task.title}</h5>
                            <p class="text-sm text-base-content/70 mt-1">${task.description}</p>
                            <div class="flex items-center gap-2 mt-2">
                                <span class="badge badge-${task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'success'}">${task.priority}</span>
                                <span class="text-xs">${task.dueDate || 'No due date'}</span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-sm btn-outline" onclick="liveSession.markAssignmentComplete(${index})">
                                <i class="fas fa-check"></i> Mark Complete
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(assignmentDiv);
        });
        
        // Update assignment count
        const assignmentCountElement = document.getElementById('studentAssignmentCount');
        if (assignmentCountElement) {
            assignmentCountElement.textContent = this.tasks.length;
        }
    }
    
    renderStudentMessages() {
        const container = document.getElementById('studentChatBox');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Filter messages for student (messages where recipient is 'all' or 'student')
        const studentMessages = this.messages.filter(msg =>
            msg.recipient === 'all' || msg.recipient === 'student' || msg.type === 'teacher'
        );
        
        if (studentMessages.length === 0) {
            container.innerHTML = '<div class="text-center py-4 text-base-content/50">No messages yet. Send a message to the teacher!</div>';
            return;
        }
        
        studentMessages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.sender === 'student' ? 'student' : 'teacher'} mb-2 p-2 rounded-lg`;
            
            if (msg.sender === 'student') {
                messageDiv.classList.add('bg-primary', 'text-primary-content', 'ml-auto', 'max-w-xs');
                messageDiv.innerHTML = `
                    <div class="font-medium">You:</div>
                    <div class="text-sm">${msg.text}</div>
                    <div class="text-xs opacity-70 text-right">${msg.time}</div>
                `;
            } else {
                messageDiv.classList.add('bg-base-300', 'text-base-content', 'mr-auto', 'max-w-xs');
                messageDiv.innerHTML = `
                    <div class="font-medium">${msg.sender === 'teacher' ? 'Teacher' : msg.sender}:</div>
                    <div class="text-sm">${msg.text}</div>
                    <div class="text-xs opacity-70">${msg.time}</div>
                `;
            }
            
            container.appendChild(messageDiv);
        });
        
        // Auto scroll to bottom
        container.scrollTop = container.scrollHeight;
    }
    
    updateStudentStats() {
        const captionCountElement = document.getElementById('studentCaptionCount');
        const assignmentCountElement = document.getElementById('studentAssignmentCount');
        const sessionDurationElement = document.getElementById('studentSessionDuration');
        
        if (captionCountElement) {
            captionCountElement.textContent = this.captions.length;
        }
        
        if (assignmentCountElement) {
            assignmentCountElement.textContent = this.tasks.length;
        }
        
        if (sessionDurationElement) {
            sessionDurationElement.textContent = this.getSessionDuration();
        }
    }
    
    clearStudentCaptions() {
        const container = document.getElementById('studentCaptionBox');
        if (container) {
            container.innerHTML = '<div class="text-center py-8 text-base-content/50">Captions cleared. New captions will appear here.</div>';
            this.showToast('Student captions cleared', 'success');
        }
    }
    
    toggleTranslation(enabled) {
        this.showTranslation = enabled;
        this.renderStudentCaptions();
        this.showToast(enabled ? 'Bangla translation enabled' : 'Bangla translation disabled', 'info');
    }
    
    updateUI() {
        // Update session statistics
        this.updateSessionStats();
        
        // Update activity timeline
        this.updateActivityTimeline();
    }
    
    updateSessionStats() {
        const onlineStudents = this.students.filter(s => s.online).length;
        const totalStudents = this.students.length;
        const messageCount = this.messages.length;
        const captionCount = this.captions.length;
        
        // Update stats in teacher panel
        const statsElements = {
            'students': `${onlineStudents}/${totalStudents}`,
            'duration': this.getSessionDuration(),
            'messages': messageCount,
            'captions': captionCount
        };
        
        Object.keys(statsElements).forEach(key => {
            const element = document.querySelector(`[data-stat="${key}"]`);
            if (element) {
                element.textContent = statsElements[key];
            }
        });
    }
    
    updateActivityTimeline() {
        const activityTimeline = document.querySelector('.activity-timeline');
        if (!activityTimeline) return;
        
        // Demo activities
        const activities = [
            { time: '2 min ago', text: 'Ahmed joined the session' },
            { time: '5 min ago', text: 'You sent a message to all students' },
            { time: '10 min ago', text: 'Session started' },
            { time: '15 min ago', text: 'Classwork task created' }
        ];
        
        activityTimeline.innerHTML = '';
        
        activities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <small>${activity.time}</small>
                <p>${activity.text}</p>
            `;
            activityTimeline.appendChild(activityItem);
        });
    }
    
    getSessionDuration() {
        if (!this.sessionStartTime) return '0 min';
        
        const now = new Date();
        const diffMs = now - this.sessionStartTime;
        const diffMins = Math.floor(diffMs / 60000);
        
        return `${diffMins} min`;
    }
    
    // Session Management
    startSession() {
        if (this.sessionActive) return;
        
        this.sessionActive = true;
        this.sessionStartTime = new Date();
        
        // Generate new random session code
        this.sessionCode = this.generateRandomSessionCode();
        
        // Save session code to localStorage for students to access
        localStorage.setItem('silentSpeakCurrentSessionCode', this.sessionCode);
        
        // Update button states
        const startBtn = document.getElementById('startSessionBtn');
        const pauseBtn = document.getElementById('pauseSessionBtn');
        const endBtn = document.getElementById('endSessionBtn');
        
        if (startBtn) startBtn.disabled = true;
        if (pauseBtn) pauseBtn.disabled = false;
        if (endBtn) endBtn.disabled = false;
        
        // Start caption simulation
        this.startCaptionSimulation();
        
        // Show notification with session code
        this.showToast(`Session started successfully. Session code: ${this.sessionCode}`, 'success');
        
        // Update UI to show new session code
        this.updateSessionInfo();
        this.updateUI();
    }
    
    pauseSession() {
        if (!this.sessionActive) return;
        
        this.sessionActive = false;
        
        // Update button states
        const startBtn = document.getElementById('startSessionBtn');
        const pauseBtn = document.getElementById('pauseSessionBtn');
        
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
        
        // Stop caption simulation
        this.stopCaptionSimulation();
        
        this.showToast('Session paused.', 'warning');
    }
    
    endSession() {
        if (!confirm('Are you sure you want to end the session? All unsaved data will be lost.')) {
            return;
        }
        
        this.sessionActive = false;
        this.sessionStartTime = null;
        
        // Clear session code from localStorage
        localStorage.removeItem('silentSpeakCurrentSessionCode');
        
        // Update button states
        const startBtn = document.getElementById('startSessionBtn');
        const pauseBtn = document.getElementById('pauseSessionBtn');
        const endBtn = document.getElementById('endSessionBtn');
        
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
        if (endBtn) endBtn.disabled = false;
        
        // Stop caption simulation
        this.stopCaptionSimulation();
        
        // Clear captions
        this.captions = [];
        this.renderCaptions('teacherCaptionBox');
        
        this.showToast('Session ended.', 'info');
        this.updateUI();
    }
    
    // Caption Simulation
    startCaptionSimulation() {
        if (this.captionInterval) return;
        
        // Demo captions to add
        const demoCaptions = [
            "Let's solve an example: x² + 5x + 6 = 0",
            "First, we need to factor the equation",
            "The factors are (x + 2)(x + 3) = 0",
            "So the solutions are x = -2 and x = -3",
            "Does everyone understand?",
            "Great! Now let's move to the next topic"
        ];
        
        let captionIndex = 0;
        
        this.captionInterval = setInterval(() => {
            if (captionIndex >= demoCaptions.length) {
                this.stopCaptionSimulation();
                return;
            }
            
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            this.addCaption(timeStr, demoCaptions[captionIndex], 'teacher');
            captionIndex++;
            
            // Update student caption box if active
            this.renderCaptions('studentCaptionBox');
            
        }, 8000); // Add a caption every 8 seconds
    }
    
    stopCaptionSimulation() {
        if (this.captionInterval) {
            clearInterval(this.captionInterval);
            this.captionInterval = null;
        }
    }
    
    addCaption(time, text, speaker) {
        const caption = { time, text, speaker };
        this.captions.push(caption);
        
        // Limit to 50 captions
        if (this.captions.length > 50) {
            this.captions.shift();
        }
        
        // Update teacher caption box
        this.renderCaptions('teacherCaptionBox');
        
        // Update UI
        this.updateUI();
        
        // If teacher is speaking and we're in demo mode (no API), save to localStorage for students
        if (speaker === 'teacher' && (!this.sessionId || !this.isConnectedToAPI)) {
            this.saveCaptionToLocalStorage(caption);
        }
    }
    
    saveCaptionToLocalStorage(caption) {
        try {
            // Get existing shared captions from localStorage
            const sharedCaptionsJson = localStorage.getItem('silentSpeakSharedCaptions');
            let sharedCaptions = sharedCaptionsJson ? JSON.parse(sharedCaptionsJson) : [];
            
            // Add new caption with unique ID and timestamp
            const sharedCaption = {
                id: Date.now(),
                text: caption.text,
                speaker: caption.speaker,
                timestamp: new Date().toISOString(),
                time: caption.time
            };
            
            sharedCaptions.push(sharedCaption);
            
            // Limit to last 50 captions
            if (sharedCaptions.length > 50) {
                sharedCaptions = sharedCaptions.slice(-50);
            }
            
            // Save back to localStorage
            localStorage.setItem('silentSpeakSharedCaptions', JSON.stringify(sharedCaptions));
            
            // Trigger storage event for other tabs
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'silentSpeakSharedCaptions',
                newValue: JSON.stringify(sharedCaptions)
            }));
            
        } catch (error) {
            console.error('Error saving caption to localStorage:', error);
        }
    }
    
    loadCaptionsFromLocalStorage() {
        try {
            const sharedCaptionsJson = localStorage.getItem('silentSpeakSharedCaptions');
            if (!sharedCaptionsJson) return [];
            
            const sharedCaptions = JSON.parse(sharedCaptionsJson);
            
            // Filter out captions we already have
            const newCaptions = sharedCaptions.filter(sharedCaption =>
                !this.captions.find(c => c.text === sharedCaption.text && c.time === sharedCaption.time)
            );
            
            return newCaptions;
        } catch (error) {
            console.error('Error loading captions from localStorage:', error);
            return [];
        }
    }
    
    clearCaptions() {
        if (!confirm('Clear all captions? This cannot be undone.')) return;
        
        this.captions = [];
        this.renderCaptions('teacherCaptionBox');
        this.renderCaptions('studentCaptionBox');
        
        this.showToast('Captions cleared.', 'info');
    }
    
    autoScrollCaptions(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const autoScrollCheckbox = containerId === 'teacherCaptionBox' 
            ? document.getElementById('autoScroll') 
            : document.getElementById('studentAutoScroll');
        
        if (autoScrollCheckbox && autoScrollCheckbox.checked) {
            container.scrollTop = container.scrollHeight;
        }
    }
    
    toggleAutoScroll(enabled, panel = 'teacher') {
        const containerId = panel === 'teacher' ? 'teacherCaptionBox' : 'studentCaptionBox';
        const container = document.getElementById(containerId);
        
        if (container && enabled) {
            container.scrollTop = container.scrollHeight;
        }
    }
    
    // Communication
    sendTeacherMessage() {
        const messageInput = document.getElementById('teacherMessage');
        const recipientSelect = document.getElementById('messageRecipient');
        
        if (!messageInput || !recipientSelect) return;
        
        const text = messageInput.value.trim();
        if (!text) {
            this.showToast('Please enter a message.', 'warning');
            return;
        }
        
        const recipient = recipientSelect.value;
        const recipientName = recipient === 'all' ? 'All Students' : 
                             recipient === 'ahmed' ? 'Ahmed' :
                             recipient === 'fatima' ? 'Fatima' : 'Rahim';
        
        // Add to messages
        this.messages.push({
            sender: 'You',
            text: `${text} (to ${recipientName})`,
            time: this.getCurrentTime(),
            type: 'sent'
        });
        
        // Clear input
        messageInput.value = '';
        
        // Render messages
        this.renderMessages();
        
        // Show notification
        this.showToast(`Message sent to ${recipientName}.`, 'success');
        
        // Update UI
        this.updateUI();
    }
    
    sendStudentMessage() {
        const messageInput = document.getElementById('studentMessage');
        if (!messageInput) return;
        
        const text = messageInput.value.trim();
        if (!text) {
            this.showToast('Please enter a message.', 'warning');
            return;
        }
        
        // In a real app, this would send to the teacher
        // For demo, we'll just add to student messages
        const studentMessages = document.querySelector('#studentPanel .message-box');
        if (studentMessages) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message sent';
            messageDiv.innerHTML = `<strong>You:</strong> ${text}`;
            studentMessages.appendChild(messageDiv);
            
            // Scroll to bottom
            studentMessages.scrollTop = studentMessages.scrollHeight;
        }
        
        // Clear input
        messageInput.value = '';
        
        this.showToast('Message sent to teacher.', 'success');
    }
    
    sendQuickMessage(message) {
        // In a real app, this would send to the teacher
        // For demo, we'll show a notification
        this.showToast(`Quick message sent: "${message}"`, 'info');
        
        // Add to student messages
        const studentMessages = document.querySelector('#studentPanel .message-box');
        if (studentMessages) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message sent';
            messageDiv.innerHTML = `<strong>You:</strong> ${message}`;
            studentMessages.appendChild(messageDiv);
            
            // Scroll to bottom
            studentMessages.scrollTop = studentMessages.scrollHeight;
        }
    }
    
    // Task Management
    createTask() {
        const taskTitleInput = document.getElementById('taskTitle');
        const taskTypeSelect = document.getElementById('taskType');
        
        if (!taskTitleInput || !taskTypeSelect) return;
        
        const title = taskTitleInput.value.trim();
        if (!title) {
            this.showToast('Please enter a task title.', 'warning');
            return;
        }
        
        const type = taskTypeSelect.value;
        const newTask = {
            id: this.tasks.length + 1,
            title: `${title} (${type})`,
            due: 'Today',
            status: 'active'
        };
        
        this.tasks.unshift(newTask);
        this.renderTasks();
        
        // Clear input
        taskTitleInput.value = '';
        
        this.showToast('Task created successfully.', 'success');
        this.updateUI();
    }
    
    // Student Session Management
    joinSession() {
        const joinCodeInput = document.getElementById('joinCode');
        if (!joinCodeInput) return;
        
        const code = joinCodeInput.value.trim().toUpperCase();
        if (!code) {
            this.showToast('Please enter a session code.', 'warning');
            return;
        }
        
        // In demo mode, accept any non-empty code
        // In a real app, this would validate against the teacher's session code via API
        // For now, we'll accept any code that's 6 characters (like our generated codes)
        if (code.length < 3) {
            this.showToast('Session code should be at least 3 characters.', 'warning');
            return;
        }
        
        // Try to get the current session code from localStorage (if teacher has saved it)
        const currentSessionCode = localStorage.getItem('silentSpeakCurrentSessionCode');
        if (currentSessionCode && code !== currentSessionCode) {
            this.showToast(`Invalid session code. The current session code is ${currentSessionCode}.`, 'error');
            return;
        }
        
        // Hide join section, show active session
        const joinSection = document.getElementById('joinSessionSection');
        const activeSection = document.getElementById('activeSessionSection');
        
        if (joinSection && activeSection) {
            joinSection.classList.add('hidden');
            activeSection.classList.remove('hidden');
        }
        
        // Set session code for this student
        this.sessionCode = code;
        
        // Render student captions
        this.renderStudentCaptions();
        
        this.showToast('Successfully joined the session!', 'success');
        
        // Start polling for updates if we have a session code
        if (this.sessionCode && !this.sessionId) {
            // In demo mode, we don't have a real session ID, but we can still poll localStorage
            // for shared captions
            this.startDemoPolling();
        }
    }
    
    startDemoPolling() {
        // Clear any existing interval
        if (this.demoPollingInterval) {
            clearInterval(this.demoPollingInterval);
        }
        
        // Poll for new captions from localStorage
        this.demoPollingInterval = setInterval(() => {
            this.checkForSharedCaptions();
        }, 2000); // Check every 2 seconds
    }
    
    checkForSharedCaptions() {
        const newCaptions = this.loadCaptionsFromLocalStorage();
        if (newCaptions.length > 0) {
            // Add new captions
            newCaptions.forEach(caption => {
                this.captions.push({
                    time: caption.time,
                    text: caption.text,
                    speaker: caption.speaker
                });
            });
            
            // Update student caption display
            this.renderStudentCaptions();
        }
    }
    
    saveStudentNotes() {
        const notesTextarea = document.getElementById('studentNotes');
        if (!notesTextarea) return;
        
        const notes = notesTextarea.value;
        localStorage.setItem('studentSessionNotes', notes);
        
        this.showToast('Notes saved successfully.', 'success');
    }
    
    saveSessionNotes() {
        // Save current captions as notes
        const captionText = this.captions.map(c => `[${c.time}] ${c.text}`).join('\n');
        const blob = new Blob([captionText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `session-notes-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Session notes downloaded.', 'success');
    }
    
    downloadStudentCaptions() {
        const captionText = this.captions.map(c => `[${c.time}] ${c.text}`).join('\n');
        const blob = new Blob([captionText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `student-captions-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Captions downloaded.', 'success');
    }
    
    enhanceNotes() {
        // Simulate AI enhancement
        this.showToast('AI enhancement applied to notes.', 'info');
        
        // In a real app, this would call an AI API
        setTimeout(() => {
            this.showToast('Notes enhanced with formatting and summaries.', 'success');
        }, 1500);
    }
    
    enhanceStudentNotes() {
        this.showToast('AI enhancement applied to your notes.', 'info');
        
        const notesTextarea = document.getElementById('studentNotes');
        if (notesTextarea) {
            const currentNotes = notesTextarea.value;
            // Simulate enhancement by adding a header
            notesTextarea.value = `# Enhanced Notes\n# ${new Date().toLocaleDateString()}\n\n${currentNotes}\n\n---\n*Enhanced with AI formatting*`;
        }
    }
    
    // Quick Actions
    quickAction(action) {
        const actions = {
            'attendance': 'Taking attendance...',
            'poll': 'Creating quick poll...',
            'break': 'Starting 5-minute break...',
            'recap': 'Generating session recap...'
        };
        
        if (actions[action]) {
            this.showToast(actions[action], 'info');
            
            // Simulate action completion
            setTimeout(() => {
                this.showToast(`${action.charAt(0).toUpperCase() + action.slice(1)} completed successfully.`, 'success');
            }, 2000);
        }
    }
    
    studentAction(action) {
        const actions = {
            'raiseHand': 'Hand raised! Teacher notified.',
            'requestBreak': 'Break request sent to teacher.',
            'emergency': 'EMERGENCY ALERT sent to teacher!'
        };
        
        if (actions[action]) {
            this.showToast(actions[action], action === 'emergency' ? 'error' : 'info');
        }
    }
    
    // Utility Methods
    getCurrentTime() {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
    
    showToast(message, type = 'info') {
        // Use the toast system from main.js if available
        if (window.showToast) {
            window.showToast(message, type);
            return;
        }
        
        // Fallback toast
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }
    
    copySessionCode() {
        const sessionCodeInput = document.getElementById('sessionCode');
        if (!sessionCodeInput) return;
        
        sessionCodeInput.select();
        sessionCodeInput.setSelectionRange(0, 99999); // For mobile
        
        try {
            navigator.clipboard.writeText(sessionCodeInput.value);
            this.showToast('Session code copied to clipboard!', 'success');
        } catch (err) {
            // Fallback for older browsers
            document.execCommand('copy');
            this.showToast('Session code copied!', 'success');
        }
    }
    
    resetSession() {
        if (confirm('Reset session and return to role selection?')) {
            localStorage.removeItem('liveSessionRole');
            
            // Hide all panels
            document.getElementById('teacherPanel')?.classList.add('hidden');
            document.getElementById('studentPanel')?.classList.add('hidden');
            
            // Show role selection
            document.getElementById('roleSelection')?.classList.remove('hidden');
            
            // Stop real-time polling
            this.stopRealtimePolling();
            
            this.showToast('Session reset.', 'info');
        }
    }
    
    // Real-time communication methods
    startRealtimePolling() {
        if (!this.pollingEnabled || !this.sessionId) {
            return;
        }
        
        // Clear any existing interval
        this.stopRealtimePolling();
        
        // Start polling
        this.realtimePollingInterval = setInterval(() => {
            this.pollForUpdates();
        }, this.pollingInterval);
        
        console.log('Real-time polling started for session:', this.sessionId);
    }
    
    stopRealtimePolling() {
        if (this.realtimePollingInterval) {
            clearInterval(this.realtimePollingInterval);
            this.realtimePollingInterval = null;
            console.log('Real-time polling stopped');
        }
    }
    
    async pollForUpdates() {
        if (!this.sessionId) {
            return;
        }
        
        try {
            const response = await fetch(
                `${this.apiBaseUrl}/realtime.php?action=updates&session_id=${this.sessionId}&last_update=${this.lastUpdateTime}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.processRealtimeUpdates(data.data);
                this.lastUpdateTime = data.data.timestamp || Math.floor(Date.now() / 1000);
            }
        } catch (error) {
            console.error('Error polling for updates:', error);
            // Don't show error toast for polling failures to avoid spam
        }
    }
    
    processRealtimeUpdates(updates) {
        let hasUpdates = false;
        
        // Process new captions
        if (updates.captions && updates.captions.length > 0) {
            updates.captions.forEach(caption => {
                // Add caption if not already in list
                if (!this.captions.find(c => c.id === caption.id)) {
                    this.captions.push({
                        id: caption.id || Date.now(),
                        text: caption.text,
                        speaker: `${caption.first_name} ${caption.last_name}`,
                        timestamp: new Date().toLocaleTimeString(),
                        language: caption.language || 'en'
                    });
                    hasUpdates = true;
                }
            });
            
            if (hasUpdates) {
                // Update caption display based on current role
                if (this.currentRole === 'teacher') {
                    this.renderCaptions('teacherCaptionBox');
                } else if (this.currentRole === 'student') {
                    this.renderCaptions('studentCaptionBox');
                }
            }
        }
        
        // Process new messages
        if (updates.messages && updates.messages.length > 0) {
            updates.messages.forEach(message => {
                if (!this.messages.find(m => m.id === message.id)) {
                    const senderName = message.sender_first_name ?
                        `${message.sender_first_name} ${message.sender_last_name}` : 'Unknown';
                    
                    const recipientName = message.recipient_first_name ?
                        `${message.recipient_first_name} ${message.recipient_last_name}` : 'Everyone';
                    
                    this.messages.push({
                        id: message.id,
                        sender: senderName,
                        recipient: recipientName,
                        text: message.message,
                        timestamp: new Date().toLocaleTimeString(),
                        isPrivate: !!message.recipient_id
                    });
                    hasUpdates = true;
                }
            });
            
            if (hasUpdates) {
                this.updateMessageDisplay();
            }
        }
        
        // Process new tasks
        if (updates.tasks && updates.tasks.length > 0) {
            updates.tasks.forEach(task => {
                if (!this.tasks.find(t => t.id === task.id)) {
                    const creatorName = task.creator_first_name ?
                        `${task.creator_first_name} ${task.creator_last_name}` : 'Teacher';
                    
                    const assigneeName = task.assignee_first_name ?
                        `${task.assignee_first_name} ${task.assignee_last_name}` : 'All Students';
                    
                    this.tasks.push({
                        id: task.id,
                        title: task.title,
                        description: task.description,
                        assignedTo: assigneeName,
                        createdBy: creatorName,
                        dueDate: task.due_date || 'Today',
                        priority: task.priority || 'medium',
                        status: task.status || 'pending'
                    });
                    hasUpdates = true;
                }
            });
            
            if (hasUpdates) {
                this.updateTaskDisplay();
            }
        }
        
        // Process participant changes
        if (updates.participants && updates.participants.length > 0) {
            updates.participants.forEach(participant => {
                if (participant.left_at) {
                    // Student left
                    const studentIndex = this.students.findIndex(s => s.id === participant.student_id);
                    if (studentIndex !== -1) {
                        this.students[studentIndex].online = false;
                        hasUpdates = true;
                    }
                } else {
                    // Student joined or is online
                    const existingStudent = this.students.find(s => s.id === participant.student_id);
                    if (!existingStudent) {
                        // New student
                        this.students.push({
                            id: participant.student_id,
                            name: `${participant.first_name} ${participant.last_name}`,
                            online: true
                        });
                        hasUpdates = true;
                    } else if (!existingStudent.online) {
                        existingStudent.online = true;
                        hasUpdates = true;
                    }
                }
            });
            
            if (hasUpdates) {
                this.updateStudentList();
            }
        }
        
        if (hasUpdates) {
            // Play a subtle notification sound if updates were received
            this.playNotificationSound();
        }
    }
    
    async createSessionAPI(subject, language = 'en', description = '') {
        try {
            // Get authentication token
            const token = localStorage.getItem('auth_token');
            if (!token) {
                this.showToast('Please login first', 'error');
                return null;
            }
            
            const response = await fetch(`${this.apiBaseUrl}/sessions.php?action=create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    subject: subject,
                    language: language,
                    description: description
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.sessionId = data.data.session.id;
                this.sessionCode = data.data.session_code;
                this.sessionName = subject;
                this.isConnectedToAPI = true;
                
                // Start real-time polling
                this.startRealtimePolling();
                
                this.showToast('Session created successfully!', 'success');
                return data.data;
            } else {
                this.showToast(data.error || 'Failed to create session', 'error');
                return null;
            }
        } catch (error) {
            console.error('Error creating session:', error);
            this.showToast('Network error. Using demo mode.', 'warning');
            return null;
        }
    }
    
    async joinSessionAPI(sessionCode) {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                this.showToast('Please login first', 'error');
                return false;
            }
            
            const response = await fetch(`${this.apiBaseUrl}/sessions.php?action=join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    session_code: sessionCode
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.sessionId = data.data.session.id;
                this.sessionCode = sessionCode;
                this.sessionName = data.data.session.subject;
                this.isConnectedToAPI = true;
                
                // Start real-time polling
                this.startRealtimePolling();
                
                this.showToast('Joined session successfully!', 'success');
                return true;
            } else {
                this.showToast(data.error || 'Failed to join session', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error joining session:', error);
            this.showToast('Network error. Using demo mode.', 'warning');
            return false;
        }
    }
    
    async sendCaptionAPI(text, language = 'en', confidence = 1.0) {
        if (!this.sessionId || !this.isConnectedToAPI) {
            // Fallback to local storage - create a caption with current time
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            this.addCaption(timeStr, text, 'teacher');
            return;
        }
        
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;
            
            await fetch(`${this.apiBaseUrl}/sessions.php?action=caption`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    text: text,
                    language: language,
                    confidence: confidence,
                    is_final: true
                })
            });
            
            // Show notification that caption was sent to students
            this.showToast('Caption sent to students', 'info');
        } catch (error) {
            console.error('Error sending caption:', error);
            // Fallback to local storage
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            this.addCaption(timeStr, text, 'teacher');
        }
    }
    
    async sendMessageAPI(message, recipientId = null) {
        if (!this.sessionId || !this.isConnectedToAPI) {
            // Fallback to local storage
            this.addMessage(message, recipientId);
            return;
        }
        
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;
            
            await fetch(`${this.apiBaseUrl}/sessions.php?action=message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    message: message,
                    recipient_id: recipientId
                })
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }
    
    async createTaskAPI(title, description, assignedTo = null, dueDate = null, priority = 'medium') {
        if (!this.sessionId || !this.isConnectedToAPI) {
            // Fallback to local storage
            this.createTaskLocal(title, description, assignedTo, dueDate, priority);
            return;
        }
        
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;
            
            await fetch(`${this.apiBaseUrl}/sessions.php?action=task`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    title: title,
                    description: description,
                    assigned_to: assignedTo,
                    due_date: dueDate,
                    priority: priority
                })
            });
        } catch (error) {
            console.error('Error creating task:', error);
        }
    }
    
    playNotificationSound() {
        // Create a subtle notification sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            // Audio context not supported, silent fail
        }
    }
    
    // Helper method for local task creation (fallback)
    createTaskLocal(title, description, assignedTo = null, dueDate = null, priority = 'medium') {
        const newTask = {
            id: Date.now(),
            title: title,
            description: description,
            assignedTo: assignedTo || 'All Students',
            createdBy: this.currentRole === 'teacher' ? 'You' : 'Teacher',
            dueDate: dueDate || 'Today',
            priority: priority,
            status: 'pending'
        };
        
        this.tasks.push(newTask);
        this.updateTaskDisplay();
        this.showToast('Task created!', 'success');
    }
    
    leaveSession() {
        const joinSection = document.getElementById('joinSessionSection');
        const activeSection = document.getElementById('activeSessionSection');
        
        if (joinSection && activeSection) {
            joinSection.classList.remove('hidden');
            activeSection.classList.add('hidden');
        }
        
        // Clear student-specific data
        const studentCaptionBox = document.getElementById('studentCaptionBox');
        if (studentCaptionBox) {
            studentCaptionBox.innerHTML = '<div class="text-center py-8 text-base-content/50">Live captions will appear here once the teacher starts speaking</div>';
        }
        
        const studentChatBox = document.getElementById('studentChatBox');
        if (studentChatBox) {
            studentChatBox.innerHTML = '<div class="message teacher mb-2"><div class="font-medium">Teacher:</div><div class="text-sm">Welcome to today\'s class!</div></div>';
        }
        
        this.showToast('You have left the session.', 'info');
    }
    
    markAssignmentComplete(index) {
        if (index >= 0 && index < this.tasks.length) {
            this.tasks[index].completed = true;
            this.tasks[index].completedAt = new Date().toLocaleTimeString();
            this.renderStudentAssignments();
            this.showToast('Assignment marked as complete!', 'success');
        }
    }
    
    addMessage(text, sender = 'student', recipient = 'teacher') {
        const message = {
            text: text,
            sender: sender,
            recipient: recipient,
            time: this.getCurrentTime(),
            type: sender === 'student' ? 'sent' : 'received'
        };
        
        this.messages.push(message);
        
        // Update both teacher and student message displays
        this.renderMessages();
        this.renderStudentMessages();
        
        return message;
    }
}

// Global functions for HTML onclick handlers
function selectRole(role) {
    if (!window.liveSession) {
        window.liveSession = new LiveSession();
    }
    window.liveSession.selectRole(role);
}

function startSession() {
    if (window.liveSession) window.liveSession.startSession();
}

function pauseSession() {
    if (window.liveSession) window.liveSession.pauseSession();
}

function endSession() {
    if (window.liveSession) window.liveSession.endSession();
}

function copySessionCode() {
    if (window.liveSession) window.liveSession.copySessionCode();
}

function clearCaptions() {
    if (window.liveSession) window.liveSession.clearCaptions();
}

function sendTeacherMessage() {
    if (window.liveSession) window.liveSession.sendTeacherMessage();
}

function sendStudentMessage() {
    if (window.liveSession) window.liveSession.sendStudentMessage();
}

function createTask() {
    if (window.liveSession) window.liveSession.createTask();
}

function joinSession() {
    if (window.liveSession) window.liveSession.joinSession();
}

function saveStudentNotes() {
    if (window.liveSession) window.liveSession.saveStudentNotes();
}

function saveSessionNotes() {
    if (window.liveSession) window.liveSession.saveSessionNotes();
}

function downloadCaptions() {
    if (window.liveSession) window.liveSession.downloadStudentCaptions();
}

function downloadStudentCaptions() {
    if (window.liveSession) window.liveSession.downloadStudentCaptions();
}

function enhanceNotes() {
    if (window.liveSession) window.liveSession.enhanceNotes();
}

function enhanceStudentNotes() {
    if (window.liveSession) window.liveSession.enhanceStudentNotes();
}

function quickAction(action) {
    if (window.liveSession) window.liveSession.quickAction(action);
}

function studentAction(action) {
    if (window.liveSession) window.liveSession.studentAction(action);
}

function resetSession() {
    if (window.liveSession) window.liveSession.resetSession();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.liveSession = new LiveSession();
});