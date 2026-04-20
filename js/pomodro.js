
class PomodoroTimer {
    constructor() {
        // Timer state
        this.isRunning = false;
        this.isPaused = false;
        this.currentMode = 'focus'; // 'focus', 'shortBreak', 'longBreak'
        this.timeLeft = 25 * 60; // 25 minutes in seconds
        this.totalTime = 25 * 60;
        this.intervalId = null;
        
        // Pomodoro settings
        this.settings = {
            focusTime: 25, // minutes
            shortBreak: 5, // minutes
            longBreak: 15, // minutes
            sessionsBeforeLongBreak: 4,
            autoStartBreaks: true,
            autoStartSessions: false,
            soundNotifications: true,
            desktopNotifications: false,
            strictMode: false,
            notificationSound: 'bell'
        };
        
        // Session tracking
        this.sessionCount = 0;
        this.completedSessions = 0;
        this.completedTasks = 0;
        this.totalFocusTime = 0; // in minutes
        this.todayStats = {
            date: new Date().toDateString(),
            focusSessions: 0,
            completedTasks: 0,
            focusTime: 0 // in minutes
        };
        
        // Tasks
        this.tasks = [];
        this.nextTaskId = 1;
        
        // Initialize
        this.init();
    }
    
    async init() {
        this.loadSettings();
        this.loadStats();
        this.loadTasks();
        this.initUI();
        this.setupEventListeners();
        this.updateTimerDisplay();
        this.updateStatsDisplay();
        this.renderTasks();
        
        // Check if we need to reset today's stats
        this.checkDailyReset();
    }
    
    loadSettings() {
        const savedSettings = localStorage.getItem('pomodoroSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
        
        // Update UI with loaded settings
        document.getElementById('focusTime').value = this.settings.focusTime;
        document.getElementById('shortBreak').value = this.settings.shortBreak;
        document.getElementById('longBreak').value = this.settings.longBreak;
        document.getElementById('sessionsBeforeLongBreak').value = this.settings.sessionsBeforeLongBreak;
        document.getElementById('autoStartBreaks').checked = this.settings.autoStartBreaks;
        document.getElementById('autoStartSessions').checked = this.settings.autoStartSessions;
        document.getElementById('soundNotifications').checked = this.settings.soundNotifications;
        document.getElementById('desktopNotifications').checked = this.settings.desktopNotifications;
        document.getElementById('strictMode').checked = this.settings.strictMode;
        document.getElementById('notificationSound').value = this.settings.notificationSound;
    }
    
    loadStats() {
        const savedStats = localStorage.getItem('pomodoroStats');
        if (savedStats) {
            const stats = JSON.parse(savedStats);
            this.completedSessions = stats.completedSessions || 0;
            this.completedTasks = stats.completedTasks || 0;
            this.totalFocusTime = stats.totalFocusTime || 0;
            this.sessionCount = stats.sessionCount || 0;
        }
        
        const savedTodayStats = localStorage.getItem('pomodoroTodayStats');
        if (savedTodayStats) {
            this.todayStats = JSON.parse(savedTodayStats);
        }
    }
    
    loadTasks() {
        const savedTasks = localStorage.getItem('pomodoroTasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
            // Find the highest task ID
            if (this.tasks.length > 0) {
                this.nextTaskId = Math.max(...this.tasks.map(t => t.id)) + 1;
            }
        } else {
            // Load demo tasks
            this.loadDemoTasks();
        }
    }
    
    loadDemoTasks() {
        this.tasks = [
            {
                id: 1,
                text: "Complete math assignment",
                completed: false,
                priority: "high",
                createdAt: new Date().toISOString(),
                completedAt: null
            },
            {
                id: 2,
                text: "Read chapter 5 of history book",
                completed: false,
                priority: "medium",
                createdAt: new Date().toISOString(),
                completedAt: null
            },
            {
                id: 3,
                text: "Prepare for English presentation",
                completed: false,
                priority: "urgent",
                createdAt: new Date().toISOString(),
                completedAt: null
            }
        ];
        this.nextTaskId = 4;
        this.saveTasks();
    }
    
    initUI() {
        // Update timer display
        this.updateTimerDisplay();
        
        // Update UI state
        this.updateUIState();
        
        // Update stats display
        this.updateStatsDisplay();
    }
    
    setupEventListeners() {
        // Timer control buttons
        document.getElementById('startBtn').addEventListener('click', () => this.startTimer());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseTimer());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopTimer());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetTimer());
        
        // Quick action buttons
        document.querySelector('button[onclick="startFocusSession()"]').addEventListener('click', () => this.startFocusSession());
        document.querySelector('button[onclick="startShortBreak()"]').addEventListener('click', () => this.startShortBreak());
        document.querySelector('button[onclick="startLongBreak()"]').addEventListener('click', () => this.startLongBreak());
        document.querySelector('button[onclick="resetAllStats()"]').addEventListener('click', () => this.resetAllStats());
        
        // Task management
        document.getElementById('newTaskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
        
        // Settings changes
        document.getElementById('focusTime').addEventListener('change', (e) => {
            this.settings.focusTime = parseInt(e.target.value);
            this.saveSettings();
            if (this.currentMode === 'focus' && !this.isRunning) {
                this.timeLeft = this.settings.focusTime * 60;
                this.totalTime = this.settings.focusTime * 60;
                this.updateTimerDisplay();
            }
        });
        
        document.getElementById('shortBreak').addEventListener('change', (e) => {
            this.settings.shortBreak = parseInt(e.target.value);
            this.saveSettings();
            if (this.currentMode === 'shortBreak' && !this.isRunning) {
                this.timeLeft = this.settings.shortBreak * 60;
                this.totalTime = this.settings.shortBreak * 60;
                this.updateTimerDisplay();
            }
        });
        
        document.getElementById('longBreak').addEventListener('change', (e) => {
            this.settings.longBreak = parseInt(e.target.value);
            this.saveSettings();
            if (this.currentMode === 'longBreak' && !this.isRunning) {
                this.timeLeft = this.settings.longBreak * 60;
                this.totalTime = this.settings.longBreak * 60;
                this.updateTimerDisplay();
            }
        });
        
        document.getElementById('sessionsBeforeLongBreak').addEventListener('change', (e) => {
            this.settings.sessionsBeforeLongBreak = parseInt(e.target.value);
            this.saveSettings();
        });
        
        // Checkbox settings
        document.getElementById('autoStartBreaks').addEventListener('change', (e) => {
            this.settings.autoStartBreaks = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('autoStartSessions').addEventListener('change', (e) => {
            this.settings.autoStartSessions = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('soundNotifications').addEventListener('change', (e) => {
            this.settings.soundNotifications = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('desktopNotifications').addEventListener('change', (e) => {
            this.settings.desktopNotifications = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('strictMode').addEventListener('change', (e) => {
            this.settings.strictMode = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('notificationSound').addEventListener('change', (e) => {
            this.settings.notificationSound = e.target.value;
            this.saveSettings();
        });
    }
    
    startTimer() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        
        // Update UI
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('stopBtn').disabled = false;
        
        // Start the timer interval
        this.intervalId = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            // Check if timer reached zero
            if (this.timeLeft <= 0) {
                this.timerComplete();
            }
        }, 1000);
        
        // Update status
        this.updateStatus(`${this.currentMode === 'focus' ? 'Focus' : 'Break'} session started`);
    }
    
    pauseTimer() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        clearInterval(this.intervalId);
        
        // Update UI
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-play"></i> Resume';
        this.updateStatus('Timer paused');
    }
    
    stopTimer() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.intervalId);
        
        // Update UI
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('stopBtn').disabled = true;
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> Pause';
        
        this.updateStatus('Timer stopped');
    }
    
    resetTimer() {
        this.stopTimer();
        
        // Reset time based on current mode
        switch (this.currentMode) {
            case 'focus':
                this.timeLeft = this.settings.focusTime * 60;
                this.totalTime = this.settings.focusTime * 60;
                break;
            case 'shortBreak':
                this.timeLeft = this.settings.shortBreak * 60;
                this.totalTime = this.settings.shortBreak * 60;
                break;
            case 'longBreak':
                this.timeLeft = this.settings.longBreak * 60;
                this.totalTime = this.settings.longBreak * 60;
                break;
        }
        
        this.updateTimerDisplay();
        this.updateStatus('Timer reset');
    }
    
    timerComplete() {
        this.stopTimer();
        
        // Play notification sound
        if (this.settings.soundNotifications) {
            this.playNotificationSound();
        }
        
        // Show desktop notification
        if (this.settings.desktopNotifications && 'Notification' in window && Notification.permission === 'granted') {
            this.showDesktopNotification();
        }
        
        // Update stats based on completed session type
        if (this.currentMode === 'focus') {
            this.completedSessions++;
            this.sessionCount++;
            this.totalFocusTime += this.settings.focusTime;
            this.todayStats.focusSessions++;
            this.todayStats.focusTime += this.settings.focusTime;
            
            this.updateStatus('Focus session completed! Time for a break.');
            
            // Check if we should start a break automatically
            if (this.settings.autoStartBreaks) {
                setTimeout(() => {
                    if (this.sessionCount % this.settings.sessionsBeforeLongBreak === 0) {
                        this.startLongBreak();
                    } else {
                        this.startShortBreak();
                    }
                }, 1000);
            }
        } else {
            this.updateStatus('Break completed! Ready for next focus session.');
            
            // Check if we should start next focus session automatically
            if (this.settings.autoStartSessions) {
                setTimeout(() => {
                    this.startFocusSession();
                }, 1000);
            }
        }
        
        // Save stats
        this.saveStats();
        this.updateStatsDisplay();
    }
    
    startFocusSession() {
        this.currentMode = 'focus';
        this.timeLeft = this.settings.focusTime * 60;
        this.totalTime = this.settings.focusTime * 60;
        
        this.updateTimerDisplay();
        this.updateStatus('Focus session ready - Click Start to begin');
        
        // Update UI state
        this.updateUIState();
        
        // Reset timer if it was running
        if (this.isRunning) {
            this.stopTimer();
        }
    }
    
    startShortBreak() {
        this.currentMode = 'shortBreak';
        this.timeLeft = this.settings.shortBreak * 60;
        this.totalTime = this.settings.shortBreak * 60;
        
        this.updateTimerDisplay();
        this.updateStatus('Short break ready - Click Start to begin');
        
        // Update UI state
        this.updateUIState();
        
        // Reset timer if it was running
        if (this.isRunning) {
            this.stopTimer();
        }
    }
    
    startLongBreak() {
        this.currentMode = 'longBreak';
        this.timeLeft = this.settings.longBreak * 60;
        this.totalTime = this.settings.longBreak * 60;
        
        this.updateTimerDisplay();
        this.updateStatus('Long break ready - Click Start to begin');
        
        // Update UI state
        this.updateUIState();
        
        // Reset timer if it was running
        if (this.isRunning) {
            this.stopTimer();
        }
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timerDisplay').textContent = display;
        
        // Update progress indicator (if any)
        const progress = ((this.totalTime - this.timeLeft) / this.totalTime) * 100;
        // You could add a progress bar here if needed
    }
    
    updateStatus(status) {
        let statusText = '';
        switch (this.currentMode) {
            case 'focus':
                statusText = 'Focus Session';
                break;
            case 'shortBreak':
                statusText = 'Short Break';
                break;
            case 'longBreak':
                statusText = 'Long Break';
                break;
        }
        
        if (this.isRunning) {
            statusText += ' - Running';
        } else if (this.isPaused) {
            statusText += ' - Paused';
        } else {
            statusText += ' - Ready';
        }
        
        document.getElementById('timerStatus').textContent = `${statusText} - ${status}`;
    }
    
    updateUIState() {
        // Update button states based on current mode
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (this.isRunning) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
        }
        
        // Update timer display color based on mode
        const timerDisplay = document.getElementById('timerDisplay');
        timerDisplay.className = 'display-1';
        
        switch (this.currentMode) {
            case 'focus':
                timerDisplay.classList.add('text-primary');
                break;
            case 'shortBreak':
                timerDisplay.classList.add('text-success');
                break;
            case 'longBreak':
                timerDisplay.classList.add('text-warning');
                break;
        }
    }
    
    // Task Management Methods
    addTask() {
        const input = document.getElementById('newTaskInput');
        const text = input.value.trim();
        
        if (!text) {
            this.showToast('Please enter a task description', 'warning');
            return;
        }
        
        const newTask = {
            id: this.nextTaskId++,
            text: text,
            completed: false,
            priority: 'medium', // Default priority
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        
        this.tasks.push(newTask);
        this.saveTasks();
        this.renderTasks();
        
        input.value = '';
        input.focus();
        
        this.showToast('Task added successfully', 'success');
    }
    
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            
            if (task.completed) {
                this.completedTasks++;
                this.todayStats.completedTasks++;
                this.saveStats();
                this.updateStatsDisplay();
                this.showToast('Task completed!', 'success');
            } else {
                this.completedTasks = Math.max(0, this.completedTasks - 1);
                this.todayStats.completedTasks = Math.max(0, this.todayStats.completedTasks - 1);
                this.saveStats();
                this.updateStatsDisplay();
            }
            
            this.saveTasks();
            this.renderTasks();
        }
    }
    
    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const task = this.tasks[taskIndex];
            if (task.completed) {
                this.completedTasks = Math.max(0, this.completedTasks - 1);
                this.todayStats.completedTasks = Math.max(0, this.todayStats.completedTasks - 1);
                this.saveStats();
                this.updateStatsDisplay();
            }
            
            this.tasks.splice(taskIndex, 1);
            this.saveTasks();
            this.renderTasks();
            this.showToast('Task deleted', 'info');
        }
    }
    
    clearCompletedTasks() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveTasks();
        this.renderTasks();
        this.showToast(`Cleared ${completedCount} completed tasks`, 'success');
    }
    
    renderTasks() {
        const taskList = document.getElementById('taskList');
        if (!taskList) return;
        
        taskList.innerHTML = '';
        
        this.tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = `task-item d-flex align-items-center mb-2 ${task.completed ? 'completed' : ''}`;
            
            // Priority badge color
            let badgeClass = 'bg-secondary';
            switch (task.priority) {
                case 'high': badgeClass = 'bg-info'; break;
                case 'medium': badgeClass = 'bg-warning'; break;
                case 'urgent': badgeClass = 'bg-danger'; break;
                case 'low': badgeClass = 'bg-success'; break;
            }
            
            taskItem.innerHTML = `
                <input type="checkbox" class="form-check-input me-2" ${task.completed ? 'checked' : ''}
                       onclick="pomodoro.toggleTask(${task.id})">
                <label class="form-check-label flex-grow-1" style="cursor: pointer;"
                       onclick="pomodoro.toggleTask(${task.id})">
                    ${this.escapeHtml(task.text)}
                </label>
                <span class="badge ${badgeClass}">${task.priority}</span>
                <button class="btn btn-sm btn-outline-danger ms-2" onclick="pomodoro.deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            taskList.appendChild(taskItem);
        });
        
        // Update task count
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        document.getElementById('completedTasks').textContent = completedTasks;
        
        // Update today's progress
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const progressBar = document.getElementById('todayProgress');
        if (progressBar) {
            progressBar.style.width = `${progressPercentage}%`;
            progressBar.textContent = `${progressPercentage}%`;
            progressBar.nextElementSibling.textContent = `${completedTasks} of ${totalTasks} tasks completed`;
        }
    }
    
    updateStatsDisplay() {
        document.getElementById('completedSessions').textContent = this.completedSessions;
        document.getElementById('completedTasks').textContent = this.completedTasks;
        document.getElementById('totalFocusTime').textContent = (this.totalFocusTime / 60).toFixed(1);
        
        // Update today's stats
        const todayProgress = document.getElementById('todayProgress');
        if (todayProgress) {
            const totalTasks = this.tasks.length;
            const completedTasks = this.tasks.filter(t => t.completed).length;
            const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            todayProgress.style.width = `${progressPercentage}%`;
            todayProgress.textContent = `${progressPercentage}%`;
            todayProgress.nextElementSibling.textContent = `${completedTasks} of ${totalTasks} tasks completed`;
        }
    }
    
    resetAllStats() {
        if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
            this.completedSessions = 0;
            this.completedTasks = 0;
            this.totalFocusTime = 0;
            this.sessionCount = 0;
            this.todayStats = {
                date: new Date().toDateString(),
                focusSessions: 0,
                completedTasks: 0,
                focusTime: 0
            };
            
            this.saveStats();
            this.updateStatsDisplay();
            this.showToast('All statistics have been reset', 'success');
        }
    }
    
    checkDailyReset() {
        const today = new Date().toDateString();
        if (this.todayStats.date !== today) {
            // Reset today's stats
            this.todayStats = {
                date: today,
                focusSessions: 0,
                completedTasks: 0,
                focusTime: 0
            };
            this.saveStats();
        }
    }
    
    exportTasks() {
        const exportData = {
            tasks: this.tasks,
            exportDate: new Date().toISOString(),
            stats: {
                completedSessions: this.completedSessions,
                completedTasks: this.completedTasks,
                totalFocusTime: this.totalFocusTime
            }
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `pomodoro-tasks-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showToast('Tasks exported successfully', 'success');
    }
    
    playNotificationSound() {
        // In a real implementation, you would play different sounds based on settings
        // For now, we'll just use a simple beep
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio context not supported:', e);
        }
    }
    
    showDesktopNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            const title = this.currentMode === 'focus' ? 'Focus Session Complete!' : 'Break Time Over!';
            const body = this.currentMode === 'focus'
                ? 'Great job! Time to take a break.'
                : 'Break is over. Ready for your next focus session?';
            
            new Notification(title, {
                body: body,
                icon: '../assets/icons/icon-192x192.png'
            });
        }
    }
    
    saveSettings() {
        localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
    }
    
    saveStats() {
        const stats = {
            completedSessions: this.completedSessions,
            completedTasks: this.completedTasks,
            totalFocusTime: this.totalFocusTime,
            sessionCount: this.sessionCount
        };
        localStorage.setItem('pomodoroStats', JSON.stringify(stats));
        localStorage.setItem('pomodoroTodayStats', JSON.stringify(this.todayStats));
    }
    
    saveTasks() {
        localStorage.setItem('pomodoroTasks', JSON.stringify(this.tasks));
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showToast(message, type = 'info') {
        // Use the main.js toast function if available
        if (window.showToast) {
            window.showToast(message, type);
            return;
        }
        
        // Fallback toast implementation
        const toastContainer = document.getElementById('toastContainer') || (() => {
            const container = document.createElement('div');
            container.id = 'toastContainer';
            container.style.position = 'fixed';
            container.style.top = '20px';
            container.style.right = '20px';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
            return container;
        })();
        
        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast show align-items-center text-bg-${type} border-0`;
        toast.style.minWidth = '250px';
        toast.style.marginBottom = '10px';
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            const toastElement = document.getElementById(toastId);
            if (toastElement) {
                toastElement.classList.remove('show');
                setTimeout(() => toastElement.remove(), 300);
            }
        }, 3000);
    }
}

// Global instance
let pomodoro;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    pomodoro = new PomodoroTimer();
});

// Global functions for HTML onclick handlers
function startTimer() {
    if (pomodoro) pomodoro.startTimer();
}

function pauseTimer() {
    if (pomodoro) pomodoro.pauseTimer();
}

function stopTimer() {
    if (pomodoro) pomodoro.stopTimer();
}

function resetTimer() {
    if (pomodoro) pomodoro.resetTimer();
}

function startFocusSession() {
    if (pomodoro) pomodoro.startFocusSession();
}

function startShortBreak() {
    if (pomodoro) pomodoro.startShortBreak();
}

function startLongBreak() {
    if (pomodoro) pomodoro.startLongBreak();
}

function resetAllStats() {
    if (pomodoro) pomodoro.resetAllStats();
}

function addTask() {
    if (pomodoro) pomodoro.addTask();
}

function clearCompletedTasks() {
    if (pomodoro) pomodoro.clearCompletedTasks();
}

function exportTasks() {
    if (pomodoro) pomodoro.exportTasks();
}

function resetAll() {
    if (confirm('Reset everything (timer, tasks, stats)?')) {
        if (pomodoro) {
            pomodoro.resetTimer();
            pomodoro.resetAllStats();
            pomodoro.tasks = [];
            pomodoro.saveTasks();
            pomodoro.renderTasks();
            pomodoro.showToast('Everything has been reset', 'success');
        }
    }
}
