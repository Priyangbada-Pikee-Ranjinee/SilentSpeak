/**
 * Quick Communication Board
 * For Silent Speak - Classroom Communication Platform
 */

class QuickCommunication {
    constructor() {
        // Communication phrases data
        this.phrases = {
            emergency: [
                { id: 1, text: "I need help", icon: "fas fa-exclamation-circle", color: "danger", translation: "আমার সাহায্য দরকার" },
                { id: 2, text: "Emergency!", icon: "fas fa-ambulance", color: "danger", translation: "জরুরি অবস্থা!" },
                { id: 3, text: "Call my parents", icon: "fas fa-phone", color: "danger", translation: "আমার বাবা-মাকে ফোন করুন" },
                { id: 4, text: "I'm not feeling well", icon: "fas fa-heartbeat", color: "danger", translation: "আমার ভাল লাগছে না" },
                { id: 5, text: "I need to go to the nurse", icon: "fas fa-first-aid", color: "danger", translation: "আমাকে নার্সের কাছে যেতে হবে" },
                { id: 6, text: "I'm lost", icon: "fas fa-map-marker-alt", color: "danger", translation: "আমি হারিয়ে গেছি" }
            ],
            classroom: [
                { id: 7, text: "I don't understand", icon: "fas fa-question-circle", color: "primary", translation: "আমি বুঝতে পারছি না" },
                { id: 8, text: "Please repeat that", icon: "fas fa-redo", color: "primary", translation: "দয়া করে আবার বলুন" },
                { id: 9, text: "Can you write it down?", icon: "fas fa-edit", color: "primary", translation: "আপনি কি এটি লিখে দিতে পারেন?" },
                { id: 10, text: "I have a question", icon: "fas fa-hand-paper", color: "primary", translation: "আমার একটি প্রশ্ন আছে" },
                { id: 11, text: "I need more time", icon: "fas fa-clock", color: "primary", translation: "আমার আরও সময় দরকার" },
                { id: 12, text: "Can I go to the bathroom?", icon: "fas fa-restroom", color: "primary", translation: "আমি কি বাথরুমে যেতে পারি?" },
                { id: 13, text: "I need a break", icon: "fas fa-coffee", color: "primary", translation: "আমার একটি বিরতি দরকার" },
                { id: 14, text: "Yes", icon: "fas fa-check-circle", color: "success", translation: "হ্যাঁ" },
                { id: 15, text: "No", icon: "fas fa-times-circle", color: "danger", translation: "না" },
                { id: 16, text: "Maybe", icon: "fas fa-question-circle", color: "warning", translation: "হয়তো" }
            ],
            needs: [
                { id: 17, text: "I'm thirsty", icon: "fas fa-tint", color: "warning", translation: "আমার তৃষ্ণা পেয়েছে" },
                { id: 18, text: "I'm hungry", icon: "fas fa-utensils", color: "warning", translation: "আমার ক্ষুধা পেয়েছে" },
                { id: 19, text: "I need water", icon: "fas fa-glass-whiskey", color: "warning", translation: "আমার পানি দরকার" },
                { id: 20, text: "It's too loud", icon: "fas fa-volume-up", color: "warning", translation: "এটা খুব জোরে" },
                { id: 21, text: "It's too bright", icon: "fas fa-sun", color: "warning", translation: "এটা খুব উজ্জ্বল" },
                { id: 22, text: "I'm cold", icon: "fas fa-temperature-low", color: "warning", translation: "আমার ঠান্ডা লাগছে" },
                { id: 23, text: "I'm hot", icon: "fas fa-temperature-high", color: "warning", translation: "আমার গরম লাগছে" },
                { id: 24, text: "I need to stand up", icon: "fas fa-wheelchair", color: "warning", translation: "আমাকে দাঁড়াতে হবে" }
            ],
            custom: []
        };
        
        // Settings
        this.settings = {
            autoSpeak: true,
            showImages: true,
            vibrateOnClick: false,
            showTranslation: true,
            speechSpeed: 1,
            voiceType: 'female'
        };
        
        // Activity log
        this.activityLog = [];
        
        // Speech synthesis
        this.speechSynthesis = window.speechSynthesis;
        this.currentUtterance = null;
        
        // Initialize
        this.init();
    }
    
    async init() {
        this.loadSettings();
        this.loadCustomPhrases();
        this.loadActivityLog();
        this.initUI();
        this.setupEventListeners();
        this.renderAllPhrases();
        this.renderActivityLog();
        
        // Check for speech synthesis support
        this.checkSpeechSupport();
    }
    
    loadSettings() {
        const savedSettings = localStorage.getItem('quickCommSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
        
        // Update UI with loaded settings
        document.getElementById('autoSpeak').checked = this.settings.autoSpeak;
        document.getElementById('showImages').checked = this.settings.showImages;
        document.getElementById('vibrateOnClick').checked = this.settings.vibrateOnClick;
        document.getElementById('showTranslation').checked = this.settings.showTranslation;
        document.getElementById('speechSpeed').value = this.settings.speechSpeed;
        document.getElementById('voiceType').value = this.settings.voiceType;
    }
    
    loadCustomPhrases() {
        const savedCustomPhrases = localStorage.getItem('quickCommCustomPhrases');
        if (savedCustomPhrases) {
            this.phrases.custom = JSON.parse(savedCustomPhrases);
        }
    }
    
    loadActivityLog() {
        const savedActivityLog = localStorage.getItem('quickCommActivityLog');
        if (savedActivityLog) {
            this.activityLog = JSON.parse(savedActivityLog);
        } else {
            // Add some demo activity
            this.activityLog = [
                { type: 'speak', text: 'I need help', timestamp: new Date(Date.now() - 120000).toISOString() },
                { type: 'copy', text: 'Copied classroom phrases', timestamp: new Date(Date.now() - 600000).toISOString() },
                { type: 'add', text: 'Added custom phrase', timestamp: new Date(Date.now() - 3600000).toISOString() }
            ];
        }
    }
    
    initUI() {
        // Nothing specific to initialize here
    }
    
    setupEventListeners() {
        // Settings changes
        document.getElementById('autoSpeak').addEventListener('change', (e) => {
            this.settings.autoSpeak = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('showImages').addEventListener('change', (e) => {
            this.settings.showImages = e.target.checked;
            this.saveSettings();
            this.renderAllPhrases();
        });
        
        document.getElementById('vibrateOnClick').addEventListener('change', (e) => {
            this.settings.vibrateOnClick = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('showTranslation').addEventListener('change', (e) => {
            this.settings.showTranslation = e.target.checked;
            this.saveSettings();
            this.renderAllPhrases();
        });
        
        document.getElementById('speechSpeed').addEventListener('change', (e) => {
            this.settings.speechSpeed = parseFloat(e.target.value);
            this.saveSettings();
        });
        
        document.getElementById('voiceType').addEventListener('change', (e) => {
            this.settings.voiceType = e.target.value;
            this.saveSettings();
        });
        
        // Custom phrase input
        document.getElementById('customPhraseInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addCustomPhrase();
            }
        });
    }
    
    checkSpeechSupport() {
        if (!this.speechSynthesis) {
            this.showToast('Speech synthesis not supported in your browser', 'warning');
            document.getElementById('autoSpeak').disabled = true;
            document.getElementById('autoSpeak').checked = false;
            this.settings.autoSpeak = false;
            this.saveSettings();
        }
    }
    
    renderAllPhrases() {
        this.renderPhrases('emergency', 'emergencyPhrases');
        this.renderPhrases('classroom', 'classroomPhrases');
        this.renderPhrases('needs', 'needsPhrases');
        this.renderPhrases('custom', 'customPhrases');
    }
    
    renderPhrases(category, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        this.phrases[category].forEach(phrase => {
            const col = document.createElement('div');
            col.className = 'col-md-4 col-sm-6 mb-3';
            
            const card = document.createElement('div');
            card.className = `card phrase-card ${category} h-100`;
            card.style.cursor = 'pointer';
            card.onclick = () => this.handlePhraseClick(phrase, category);
            
            // Add haptic feedback if enabled
            if (this.settings.vibrateOnClick && 'vibrate' in navigator) {
                card.ontouchstart = () => navigator.vibrate(50);
            }
            
            let cardContent = `
                <div class="card-body text-center">
                    <div class="phrase-icon text-${phrase.color}">
                        <i class="${phrase.icon} fa-2x"></i>
                    </div>
                    <h6 class="card-title">${this.escapeHtml(phrase.text)}</h6>
            `;
            
            if (this.settings.showTranslation && phrase.translation) {
                cardContent += `<small class="text-muted d-block">${this.escapeHtml(phrase.translation)}</small>`;
            }
            
            if (category === 'custom') {
                cardContent += `
                    <div class="mt-2">
                        <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); quickComm.deleteCustomPhrase(${phrase.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            }
            
            cardContent += `</div>`;
            card.innerHTML = cardContent;
            
            col.appendChild(card);
            container.appendChild(col);
        });
        
        // Add empty state for custom phrases
        if (category === 'custom' && this.phrases.custom.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'col-12 text-center py-4';
            emptyState.innerHTML = `
                <i class="fas fa-comment-slash fa-3x text-muted mb-3"></i>
                <p class="text-muted">No custom phrases yet. Add your first phrase above!</p>
            `;
            container.appendChild(emptyState);
        }
    }
    
    handlePhraseClick(phrase, category) {
        // Add to activity log
        this.addToActivityLog('speak', phrase.text);
        
        // Speak the phrase if auto-speak is enabled
        if (this.settings.autoSpeak) {
            this.speakPhrase(phrase.text);
        }
        
        // Show visual feedback
        this.showPhraseFeedback(phrase.text);
        
        // Show toast notification
        this.showToast(`"${phrase.text}" selected`, 'success');
    }
    
    speakPhrase(text) {
        if (!this.speechSynthesis) return;
        
        // Cancel any ongoing speech
        if (this.currentUtterance) {
            this.speechSynthesis.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice based on settings
        utterance.rate = this.settings.speechSpeed;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Try to set voice type
        const voices = this.speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Simple voice selection based on type
            let preferredVoice = voices[0];
            
            if (this.settings.voiceType === 'female') {
                // Try to find a female voice
                const femaleVoice = voices.find(v => v.name.toLowerCase().includes('female') || 
                                                    v.name.toLowerCase().includes('woman') ||
                                                    v.name.toLowerCase().includes('zira') || // Windows female voice
                                                    v.name.toLowerCase().includes('samantha')); // macOS female voice
                if (femaleVoice) preferredVoice = femaleVoice;
            } else if (this.settings.voiceType === 'male') {
                // Try to find a male voice
                const maleVoice = voices.find(v => v.name.toLowerCase().includes('male') || 
                                                  v.name.toLowerCase().includes('man') ||
                                                  v.name.toLowerCase().includes('david') || // Windows male voice
                                                  v.name.toLowerCase().includes('alex')); // macOS male voice
                if (maleVoice) preferredVoice = maleVoice;
            } else if (this.settings.voiceType === 'child') {
                // Try to find a child voice (not common, but we can adjust pitch)
                utterance.pitch = 1.5; // Higher pitch for child-like voice
            }
            
            utterance.voice = preferredVoice;
        }
        
        this.currentUtterance = utterance;
        this.speechSynthesis.speak(utterance);
        
        utterance.onend = () => {
            this.currentUtterance = null;
        };
    }
    
    speakAllEmergency() {
        const emergencyTexts = this.phrases.emergency.map(p => p.text).join('. ');
        this.speakPhrase(emergencyTexts);
        this.addToActivityLog('speak', 'All emergency phrases');
        this.showToast('Speaking all emergency phrases', 'info');
    }
    
    copyAllPhrases() {
        let allText = '';
        
        // Collect all phrases
        Object.keys(this.phrases).forEach(category => {
            allText += `=== ${category.toUpperCase()} ===\n`;
            this.phrases[category].forEach(phrase => {
                allText += `• ${phrase.text}`;
                if (phrase.translation) {
                    allText += ` (${phrase.translation})`;
                }
                allText += '\n';
            });
            allText += '\n';
        });
        
        // Copy to clipboard
        navigator.clipboard.writeText(allText).then(() => {
            this.addToActivityLog('copy', 'All phrases');
            this.showToast('All phrases copied to clipboard', 'success');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            this.showToast('Failed to copy to clipboard', 'error');
        });
    }
    
    addCustomPhrase() {
        const input = document.getElementById('customPhraseInput');
        const categorySelect = document.getElementById('customCategory');
        const text = input.value.trim();
        
        if (!text) {
            this.showToast('Please enter a phrase', 'warning');
            return;
        }
        
        const newPhrase = {
            id: Date.now(), // Simple ID generation
            text: text,
            icon: 'fas fa-comment',
            color: 'info',
            translation: '' // Could add translation service here
        };
        
        // Add to custom phrases
        this.phrases.custom.push(newPhrase);
        this.saveCustomPhrases();
        this.renderPhrases('custom', 'customPhrases');
        
        // Clear input
        input.value = '';
        input.focus();
        
        // Add to activity log
        this.addToActivityLog('add', `"${text}"`);
        
        this.showToast('Custom phrase added', 'success');
    }
    
    deleteCustomPhrase(id) {
        const index = this.phrases.custom.findIndex(p => p.id === id);
        if (index !== -1) {
            const phraseText = this.phrases.custom[index].text;
            this.phrases.custom.splice(index, 1);
            this.saveCustomPhrases();
            this.renderPhrases('custom', 'customPhrases');
            
            this.addToActivityLog('delete', `"${phraseText}"`);
            this.showToast('Custom phrase deleted', 'info');
        }
    }
    
    resetCustomPhrases() {
        if (confirm('Are you sure you want to reset all custom phrases? This cannot be undone.')) {
            this.phrases.custom = [];
            this.saveCustomPhrases();
            this.renderPhrases('custom', 'customPhrases');
            this.addToActivityLog('reset', 'Custom phrases');
            this.showToast('Custom phrases reset', 'success');
        }
    }
    
    clearAllPhrases() {
        if (confirm('This will clear all phrases (demo only). Are you sure?')) {
            // This is just for demo - in a real app, you might not want this
            this.phrases.emergency = [];
            this.phrases.classroom = [];
            this.phrases.needs = [];
            this.phrases.custom = [];
            
            // Re-render all
            this.renderAllPhrases();
            this.addToActivityLog('clear', 'All phrases');
            this.showToast('All phrases cleared (demo)', 'warning');
            
            // Reload demo data after 2 seconds
            setTimeout(() => {
                this.loadDemoData();
                this.renderAllPhrases();
                this.showToast('Demo data reloaded', 'info');
            }, 2000);
        }
    }
    
    loadDemoData() {
        // Reload the default phrases
        this.phrases = {
            emergency: [
                { id: 1, text: "I need help", icon: "fas fa-exclamation-circle", color: "danger", translation: "আমার সাহায্য দরকার" },
                { id: 2, text: "Emergency!", icon: "fas fa-ambulance", color: "danger", translation: "জরুরি অবস্থা!" },
                { id: 3, text: "Call my parents", icon: "fas fa-phone", color: "danger", translation: "আমার বাবা-মাকে ফোন করুন" },
                { id: 4, text: "I'm not feeling well", icon: "fas fa-heartbeat", color: "danger", translation: "আমার ভাল লাগছে না" },
                { id: 5, text: "I need to go to the nurse", icon: "fas fa-first-aid", color: "danger", translation: "আমাকে নার্সের কাছে যেতে হবে" },
                { id: 6, text: "I'm lost", icon: "fas fa-map-marker-alt", color: "danger", translation: "আমি হারিয়ে গেছি" }
            ],
            classroom: [
                { id: 7, text: "I don't understand", icon: "fas fa-question-circle", color: "primary", translation: "আমি বুঝতে পারছি না" },
                { id: 8, text: "Please repeat that", icon: "fas fa-redo", color: "primary", translation: "দয়া করে আবার বলুন" },
                { id: 9, text: "Can you write it down?", icon: "fas fa-edit", color: "primary", translation: "আপনি কি এটি লিখে দিতে পারেন?" },
                { id: 10, text: "I have a question", icon: "fas fa-hand-paper", color: "primary", translation: "আমার একটি প্রশ্ন আছে" },
                { id: 11, text: "I need more time", icon: "fas fa-clock", color: "primary", translation: "আমার আরও সময় দরকার" },
                { id: 12, text: "Can I go to the bathroom?", icon: "fas fa-restroom", color: "primary", translation: "আমি কি বাথরুমে যেতে পারি?" },
                { id: 13, text: "I need a break", icon: "fas fa-coffee", color: "primary", translation: "আমার একটি বিরতি দরকার" },
                { id: 14, text: "Yes", icon: "fas fa-check-circle", color: "success", translation: "হ্যাঁ" },
                { id: 15, text: "No", icon: "fas fa-times-circle", color: "danger", translation: "না" },
                { id: 16, text: "Maybe", icon: "fas fa-question-circle", color: "warning", translation: "হয়তো" }
            ],
            needs: [
                { id: 17, text: "I'm thirsty", icon: "fas fa-tint", color: "warning", translation: "আমার তৃষ্ণা পেয়েছে" },
                { id: 18, text: "I'm hungry", icon: "fas fa-utensils", color: "warning", translation: "আমার ক্ষুধা পেয়েছে" },
                { id: 19, text: "I need water", icon: "fas fa-glass-whiskey", color: "warning", translation: "আমার পানি দরকার" },
                { id: 20, text: "It's too loud", icon: "fas fa-volume-up", color: "warning", translation: "এটা খুব জোরে" },
                { id: 21, text: "It's too bright", icon: "fas fa-sun", color: "warning", translation: "এটা খুব উজ্জ্বল" },
                { id: 22, text: "I'm cold", icon: "fas fa-temperature-low", color: "warning", translation: "আমার ঠান্ডা লাগছে" },
                { id: 23, text: "I'm hot", icon: "fas fa-temperature-high", color: "warning", translation: "আমার গরম লাগছে" },
                { id: 24, text: "I need to stand up", icon: "fas fa-wheelchair", color: "warning", translation: "আমাকে দাঁড়াতে হবে" }
            ],
            custom: []
        };
    }
    
    showPhraseFeedback(text) {
        // Visual feedback - could be enhanced with animations
        const feedback = document.createElement('div');
        feedback.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
        feedback.style.zIndex = '9999';
        feedback.style.pointerEvents = 'none';
        feedback.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
        feedback.style.opacity = '0';
        feedback.style.transition = 'opacity 0.3s';
        
        const textElement = document.createElement('div');
        textElement.className = 'bg-primary text-white p-4 rounded shadow-lg';
        textElement.style.fontSize = '1.5rem';
        textElement.textContent = text;
        
        feedback.appendChild(textElement);
        document.body.appendChild(feedback);
        
        // Fade in
        setTimeout(() => {
            feedback.style.opacity = '1';
        }, 10);
        
        // Fade out and remove
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }, 1000);
    }
    
    addToActivityLog(type, text) {
        const activity = {
            type: type,
            text: text,
            timestamp: new Date().toISOString()
        };
        
        this.activityLog.unshift(activity);
        
        // Keep only last 50 activities
        if (this.activityLog.length > 50) {
            this.activityLog = this.activityLog.slice(0, 50);
        }
        
        this.saveActivityLog();
        this.renderActivityLog();
    }
    
    renderActivityLog() {
        const container = document.getElementById('recentActivity');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Show only last 5 activities
        const recentActivities = this.activityLog.slice(0, 5);
        
        recentActivities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item d-flex align-items-center mb-2';
            
            let iconClass = 'fas fa-comment';
            let iconColor = 'primary';
            
            switch (activity.type) {
                case 'speak':
                    iconClass = 'fas fa-volume-up';
                    iconColor = 'success';
                    break;
                case 'copy':
                    iconClass = 'fas fa-copy';
                    iconColor = 'primary';
                    break;
                case 'add':
                    iconClass = 'fas fa-plus-circle';
                    iconColor = 'info';
                    break;
                case 'delete':
                    iconClass = 'fas fa-trash';
                    iconColor = 'danger';
                    break;
                case 'reset':
                    iconClass = 'fas fa-redo';
                    iconColor = 'warning';
                    break;
                case 'clear':
                    iconClass = 'fas fa-broom';
                    iconColor = 'warning';
                    break;
            }
            
            const timeAgo = this.getTimeAgo(new Date(activity.timestamp));
            
            activityItem.innerHTML = `
                <i class="fas ${iconClass} text-${iconColor} me-2"></i>
                <div>
                    <small class="d-block">${this.escapeHtml(activity.text)}</small>
                    <small class="text-muted">${timeAgo}</small>
                </div>
            `;
            
            container.appendChild(activityItem);
        });
        
        // Add empty state
        if (recentActivities.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'text-center py-3 text-muted';
            emptyState.innerHTML = '<i class="fas fa-history fa-2x mb-2"></i><p>No activity yet</p>';
            container.appendChild(emptyState);
        }
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        if (diffSec < 60) {
            return 'just now';
        } else if (diffMin < 60) {
            return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
        } else if (diffHour < 24) {
            return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
        } else if (diffDay < 7) {
            return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
    
    saveSettings() {
        localStorage.setItem('quickCommSettings', JSON.stringify(this.settings));
    }
    
    saveCustomPhrases() {
        localStorage.setItem('quickCommCustomPhrases', JSON.stringify(this.phrases.custom));
    }
    
    saveActivityLog() {
        localStorage.setItem('quickCommActivityLog', JSON.stringify(this.activityLog));
    }
    
    resetSettings() {
        if (confirm('Reset all settings to default?')) {
            this.settings = {
                autoSpeak: true,
                showImages: true,
                vibrateOnClick: false,
                showTranslation: true,
                speechSpeed: 1,
                voiceType: 'female'
            };
            
            this.saveSettings();
            
            // Update UI
            document.getElementById('autoSpeak').checked = this.settings.autoSpeak;
            document.getElementById('showImages').checked = this.settings.showImages;
            document.getElementById('vibrateOnClick').checked = this.settings.vibrateOnClick;
            document.getElementById('showTranslation').checked = this.settings.showTranslation;
            document.getElementById('speechSpeed').value = this.settings.speechSpeed;
            document.getElementById('voiceType').value = this.settings.voiceType;
            
            this.addToActivityLog('reset', 'Settings');
            this.showToast('Settings reset to default', 'success');
        }
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
let quickComm;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    quickComm = new QuickCommunication();
});

// Global functions for HTML onclick handlers
function addCustomPhrase() {
    if (quickComm) quickComm.addCustomPhrase();
}

function speakAllEmergency() {
    if (quickComm) quickComm.speakAllEmergency();
}

function copyAllPhrases() {
    if (quickComm) quickComm.copyAllPhrases();
}

function resetCustomPhrases() {
    if (quickComm) quickComm.resetCustomPhrases();
}

function clearAllPhrases() {
    if (quickComm) quickComm.clearAllPhrases();
}

function resetSettings() {
    if (quickComm) quickComm.resetSettings();
}