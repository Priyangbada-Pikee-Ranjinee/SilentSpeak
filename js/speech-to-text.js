/**
 * SpeechToText - Speech recognition functionality for Silent Speak
 * Uses Web Speech API for speech recognition
 */ 
class SpeechToText {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isPaused = false;
        this.transcript = '';
        this.interimTranscript = '';
        this.sessionStartTime = null;
        this.sessionStats = {
            totalWords: 0,
            totalCharacters: 0,
            totalSessions: 0,
            totalTime: 0,
            confidenceSum: 0,
            confidenceCount: 0
        };
        
        this.settings = {
            language: 'en-US',
            continuous: true,
            interimResults: true,
            confidenceThreshold: 0.7,
            autoPunctuation: true,
            autoCapitalize: true,
            highContrast: true,
            voiceFeedback: false,
            visualCues: true
        };
        
        this.quickPhrases = [
            "Can you please repeat that?",
            "I understand, thank you.",
            "I have a question about this topic.",
            "Emergency: I need assistance immediately.",
            "Please speak more slowly.",
            "I didn't catch that.",
            "Could you write that down?",
            "Yes, I agree.",
            "No, I don't think so.",
            "Maybe we should discuss this later."
        ];
        
        this.history = [];
    }
    
    /**
     * Initialize the speech recognition system
     */
    async init() {
        this.checkSpeechRecognitionSupport();
        this.loadSettings();
        this.loadStats();
        this.loadHistory();
        this.initUI();
        this.setupEventListeners();
        this.applyAccessibilitySettings();
        
        console.log('SpeechToText initialized');
    }
    
    /**
     * Check if browser supports speech recognition
     */
    checkSpeechRecognitionSupport() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            this.showToast('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.', 'error');
            return false;
        }
        
        this.recognition = new SpeechRecognition();
        this.configureRecognition();
        return true;
    }
    
    /**
     * Configure recognition settings
     */
    configureRecognition() {
        if (!this.recognition) return;
        
        this.recognition.lang = this.settings.language;
        this.recognition.continuous = this.settings.continuous;
        this.recognition.interimResults = this.settings.interimResults;
        this.recognition.maxAlternatives = 3;
        
        // Set up event handlers
        this.recognition.onstart = this.onRecognitionStart.bind(this);
        this.recognition.onresult = this.onRecognitionResult.bind(this);
        this.recognition.onerror = this.onRecognitionError.bind(this);
        this.recognition.onend = this.onRecognitionEnd.bind(this);
    }
    
    /**
     * Load settings from localStorage
     */
    loadSettings() {
        const saved = localStorage.getItem('speechToTextSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        
        // Update UI elements
        if (document.getElementById('languageSelect')) {
            document.getElementById('languageSelect').value = this.settings.language;
        }
        if (document.getElementById('recognitionMode')) {
            document.getElementById('recognitionMode').value = this.settings.continuous ? 'continuous' : 'single';
        }
        if (document.getElementById('confidenceSlider')) {
            document.getElementById('confidenceSlider').value = this.settings.confidenceThreshold;
            this.updateConfidenceValue();
        }
        if (document.getElementById('interimResults')) {
            document.getElementById('interimResults').checked = this.settings.interimResults;
        }
        if (document.getElementById('autoPunctuation')) {
            document.getElementById('autoPunctuation').checked = this.settings.autoPunctuation;
        }
        if (document.getElementById('autoCapitalize')) {
            document.getElementById('autoCapitalize').checked = this.settings.autoCapitalize;
        }
        if (document.getElementById('sttHighContrast')) {
            document.getElementById('sttHighContrast').checked = this.settings.highContrast;
        }
        if (document.getElementById('sttVoiceFeedback')) {
            document.getElementById('sttVoiceFeedback').checked = this.settings.voiceFeedback;
        }
        if (document.getElementById('sttVisualCues')) {
            document.getElementById('sttVisualCues').checked = this.settings.visualCues;
        }
    }
    
    /**
     * Load statistics from localStorage
     */
    loadStats() {
        const saved = localStorage.getItem('speechToTextStats');
        if (saved) {
            this.sessionStats = JSON.parse(saved);
            this.updateStatsDisplay();
        }
    }
    
    /**
     * Load history from localStorage
     */
    loadHistory() {
        const saved = localStorage.getItem('speechToTextHistory');
        if (saved) {
            this.history = JSON.parse(saved);
            this.renderHistory();
        }
    }
    
    /**
     * Initialize UI elements
     */
    initUI() {
        this.updateStatus('Ready to listen', 'Click the button below to start speech recognition');
        this.updateCounts();
        this.updateStatsDisplay();
        this.renderQuickPhrases();
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Language selection
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.settings.language = e.target.value;
                this.saveSettings();
                if (this.recognition) {
                    this.recognition.lang = this.settings.language;
                }
                this.showToast(`Language changed to ${e.target.options[e.target.selectedIndex].text}`, 'info');
            });
        }
        
        // Recognition mode
        const recognitionMode = document.getElementById('recognitionMode');
        if (recognitionMode) {
            recognitionMode.addEventListener('change', (e) => {
                this.settings.continuous = e.target.value === 'continuous';
                this.saveSettings();
                if (this.recognition) {
                    this.recognition.continuous = this.settings.continuous;
                }
            });
        }
        
        // Confidence slider
        const confidenceSlider = document.getElementById('confidenceSlider');
        if (confidenceSlider) {
            confidenceSlider.addEventListener('input', (e) => {
                this.settings.confidenceThreshold = parseFloat(e.target.value);
                this.updateConfidenceValue();
                this.saveSettings();
            });
        }
        
        // Checkboxes
        ['interimResults', 'autoPunctuation', 'autoCapitalize', 'sttHighContrast', 'sttVoiceFeedback', 'sttVisualCues'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.settings[id] = e.target.checked;
                    this.saveSettings();
                    
                    if (id === 'sttHighContrast' || id === 'sttVisualCues') {
                        this.applyAccessibilitySettings();
                    }
                });
            }
        });
        
        // Transcript box events
        const transcriptBox = document.getElementById('transcriptBox');
        if (transcriptBox) {
            transcriptBox.addEventListener('input', () => {
                this.updateCounts();
            });
            
            transcriptBox.addEventListener('focus', () => {
                if (transcriptBox.innerHTML === '<p>Your speech will appear here as you speak...</p><p>Try saying: "Hello, this is a test of the speech recognition system."</p>') {
                    transcriptBox.innerHTML = '';
                }
            });
        }
    }
    
    /**
     * Apply accessibility settings
     */
    applyAccessibilitySettings() {
        const body = document.body;
        const transcriptBox = document.getElementById('transcriptBox');
        
        if (this.settings.highContrast) {
            body.classList.add('high-contrast');
            if (transcriptBox) {
                transcriptBox.style.backgroundColor = '#000';
                transcriptBox.style.color = '#fff';
            }
        } else {
            body.classList.remove('high-contrast');
            if (transcriptBox) {
                transcriptBox.style.backgroundColor = '';
                transcriptBox.style.color = '';
            }
        }
        
        // Update sound wave visibility
        const soundWave = document.getElementById('soundWave');
        if (soundWave) {
            soundWave.style.display = this.settings.visualCues ? 'flex' : 'none';
        }
    }
    
    /**
     * Start speech recognition
     */
    startRecognition() {
        if (!this.recognition) {
            if (!this.checkSpeechRecognitionSupport()) {
                return;
            }
        }
        
        try {
            this.recognition.start();
            this.isListening = true;
            this.isPaused = false;
            this.sessionStartTime = Date.now();
            this.updateStatus('Listening...', 'Speak now');
            this.updateUIState();
            this.startSoundWaveAnimation();
            
            // Update session stats
            this.sessionStats.totalSessions++;
            
            this.showToast('Speech recognition started', 'success');
        } catch (error) {
            console.error('Error starting recognition:', error);
            this.showToast('Error starting recognition: ' + error.message, 'error');
        }
    }
    
    /**
     * Pause speech recognition
     */
    pauseRecognition() {
        if (this.recognition && this.isListening && !this.isPaused) {
            this.recognition.stop();
            this.isPaused = true;
            this.updateStatus('Paused', 'Click resume to continue');
            this.updateUIState();
            this.pauseSoundWaveAnimation();
            
            this.showToast('Recognition paused', 'warning');
        }
    }
    
    /**
     * Stop speech recognition
     */
    stopRecognition() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.isPaused = false;
            this.updateStatus('Stopped', 'Click start to begin again');
            this.updateUIState();
            this.stopSoundWaveAnimation();
            
            // Update session time
            if (this.sessionStartTime) {
                const sessionTime = Math.floor((Date.now() - this.sessionStartTime) / 1000);
                this.sessionStats.totalTime += sessionTime;
                this.saveStats();
                this.updateStatsDisplay();
            }
            
            this.showToast('Recognition stopped', 'info');
        }
    }
    
    /**
     * Resume speech recognition
     */
    resumeRecognition() {
        if (this.isPaused) {
            this.startRecognition();
        }
    }
    
    /**
     * Handle recognition start event
     */
    onRecognitionStart() {
        console.log('Recognition started');
        this.updateMicIcon('listening');
    }
    
    /**
     * Handle recognition result event
     */
    onRecognitionResult(event) {
        this.interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const confidence = event.results[i][0].confidence;
            
            if (event.results[i].isFinal) {
                // Apply confidence threshold
                if (confidence >= this.settings.confidenceThreshold) {
                    let processedTranscript = transcript;
                    
                    // Apply auto punctuation
                    if (this.settings.autoPunctuation) {
                        processedTranscript = this.addPunctuation(processedTranscript);
                    }
                    
                    // Apply auto capitalization
                    if (this.settings.autoCapitalize) {
                        processedTranscript = this.capitalizeSentences(processedTranscript);
                    }
                    
                    finalTranscript += processedTranscript;
                    
                    // Update confidence stats
                    this.sessionStats.confidenceSum += confidence;
                    this.sessionStats.confidenceCount++;
                }
            } else {
                this.interimTranscript += transcript;
            }
        }
        
        // Update transcript
        if (finalTranscript) {
            this.transcript += finalTranscript + ' ';
            this.updateTranscriptDisplay();
            this.updateCounts();
            
            // Add to history
            this.addToHistory(finalTranscript);
        }
        
        // Show interim results if enabled
        if (this.settings.interimResults && this.interimTranscript) {
            this.showInterimResults(this.interimTranscript);
        }
        
        // Update confidence display
        if (event.results.length > 0) {
            const lastResult = event.results[event.results.length - 1];
            if (lastResult[0]) {
                const confidence = Math.round(lastResult[0].confidence * 100);
                this.updateConfidenceBadge(confidence);
            }
        }
    }
    
    /**
     * Handle recognition error event
     */
    onRecognitionError(event) {
        console.error('Recognition error:', event.error);
        
        if (event.error === 'no-speech') {
            this.showToast('No speech detected. Please try again.', 'warning');
        } else if (event.error === 'audio-capture') {
            this.showToast('No microphone found. Please check your microphone.', 'error');
        } else if (event.error === 'not-allowed') {
            this.showToast('Microphone access denied. Please allow microphone access.', 'error');
        } else {
            this.showToast('Recognition error: ' + event.error, 'error');
        }
        
        this.isListening = false;
        this.isPaused = false;
        this.updateUIState();
        this.stopSoundWaveAnimation();
    }
    
    /**
     * Handle recognition end event
     */
    onRecognitionEnd() {
        console.log('Recognition ended');
        this.updateMicIcon('default');
        
        // Restart if continuous mode and not paused/stopped
        if (this.settings.continuous && this.isListening && !this.isPaused) {
            setTimeout(() => {
                if (this.isListening && !this.isPaused) {
                    try {
                        this.recognition.start();
                    } catch (error) {
                        console.error('Error restarting recognition:', error);
                    }
                }
            }, 100);
        }
    }
    
    /**
     * Update microphone icon state
     */
    updateMicIcon(state) {
        const micIcon = document.getElementById('micIcon');
        if (!micIcon) return;
        
        micIcon.classList.remove('listening', 'paused');
        
        if (state === 'listening') {
            micIcon.classList.add('listening');
        } else if (state === 'paused') {
            micIcon.classList.add('paused');
        }
    }
    
    /**
     * Update status indicator
     */
    updateStatus(status, description) {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusDescription = document.getElementById('statusDescription');
        
        if (statusIndicator) statusIndicator.textContent = status;
        if (statusDescription) statusDescription.textContent = description;
    }
    
    /**
     * Update UI button states
     */
    updateUIState() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (startBtn) startBtn.disabled = this.isListening && !this.isPaused;
        if (pauseBtn) pauseBtn.disabled = !this.isListening || this.isPaused;
        if (stopBtn) stopBtn.disabled = !this.isListening;
    }
    
    /**
     * Start sound wave animation
     */
    startSoundWaveAnimation() {
        if (!this.settings.visualCues) return;
        
        const bars = document.querySelectorAll('.sound-wave .bar');
        bars.forEach(bar => {
            bar.style.animationPlayState = 'running';
        });
    }
    
    /**
     * Pause sound wave animation
     */
    pauseSoundWaveAnimation() {
        const bars = document.querySelectorAll('.sound-wave .bar');
        bars.forEach(bar => {
            bar.style.animationPlayState = 'paused';
        });
    }
    
    /**
     * Stop sound wave animation
     */
    stopSoundWaveAnimation() {
        const bars = document.querySelectorAll('.sound-wave .bar');
        bars.forEach(bar => {
            bar.style.animationPlayState = 'paused';
            bar.style.height = '20px';
        });
    }
    
    /**
     * Update transcript display
     */
    updateTranscriptDisplay() {
        const transcriptBox = document.getElementById('transcriptBox');
        if (!transcriptBox) return;
        
        // Remove placeholder if present
        if (transcriptBox.innerHTML.includes('Your speech will appear here')) {
            transcriptBox.innerHTML = '';
        }
        
        // Add new transcript
        const newParagraph = document.createElement('p');
        newParagraph.textContent = this.transcript.trim();
        transcriptBox.appendChild(newParagraph);
        
        // Scroll to bottom
        transcriptBox.scrollTop = transcriptBox.scrollHeight;
    }
    
    /**
     * Show interim results
     */
    showInterimResults(interimText) {
        const transcriptBox = document.getElementById('transcriptBox');
        if (!transcriptBox) return;
        
        // Find or create interim results paragraph
        let interimPara = transcriptBox.querySelector('.interim-results');
        if (!interimPara) {
            interimPara = document.createElement('p');
            interimPara.className = 'interim-results text-muted';
            transcriptBox.appendChild(interimPara);
        }
        
        interimPara.textContent = interimText;
        
        // Scroll to bottom
        transcriptBox.scrollTop = transcriptBox.scrollHeight;
    }
    
    /**
     * Update word and character counts
     */
    updateCounts() {
        const transcriptBox = document.getElementById('transcriptBox');
        if (!transcriptBox) return;
        
        const text = transcriptBox.textContent || transcriptBox.innerText;
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        const characters = text.length;
        
        // Update word count
        const wordCountElement = document.getElementById('wordCount');
        if (wordCountElement) {
            wordCountElement.textContent = `Words: ${words.length}`;
        }
        
        // Update character count
        const charCountElement = document.getElementById('charCount');
        if (charCountElement) {
            charCountElement.textContent = `Characters: ${characters}`;
        }
        
        // Update session stats
        this.sessionStats.totalWords = words.length;
        this.sessionStats.totalCharacters = characters;
    }
    
    /**
     * Update confidence badge
     */
    updateConfidenceBadge(confidence) {
        const confidenceBadge = document.getElementById('confidenceBadge');
        if (confidenceBadge) {
            confidenceBadge.textContent = `Confidence: ${confidence}%`;
            confidenceBadge.className = 'badge ms-2';
            
            if (confidence >= 90) {
                confidenceBadge.classList.add('bg-success');
            } else if (confidence >= 70) {
                confidenceBadge.classList.add('bg-warning');
            } else {
                confidenceBadge.classList.add('bg-danger');
            }
        }
    }
    
    /**
     * Update confidence value display
     */
    updateConfidenceValue() {
        const confidenceValue = document.getElementById('confidenceValue');
        if (confidenceValue) {
            const value = this.settings.confidenceThreshold;
            let label = 'Low';
            if (value >= 0.8) label = 'High';
            else if (value >= 0.5) label = 'Medium';
            
            confidenceValue.textContent = `${label} (${value.toFixed(1)})`;
        }
    }
    
    /**
     * Update statistics display
     */
    updateStatsDisplay() {
        // Total words
        const totalWordsElement = document.getElementById('totalWords');
        if (totalWordsElement) {
            totalWordsElement.textContent = this.sessionStats.totalWords;
        }
        
        // Accuracy rate (average confidence)
        const accuracyRateElement = document.getElementById('accuracyRate');
        if (accuracyRateElement) {
            const avgConfidence = this.sessionStats.confidenceCount > 0
                ? Math.round((this.sessionStats.confidenceSum / this.sessionStats.confidenceCount) * 100)
                : 0;
            accuracyRateElement.textContent = `${avgConfidence}%`;
        }
        
        // Session time
        const sessionTimeElement = document.getElementById('sessionTime');
        if (sessionTimeElement) {
            const minutes = Math.floor(this.sessionStats.totalTime / 60);
            const seconds = this.sessionStats.totalTime % 60;
            sessionTimeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Average confidence
        const avgConfidenceElement = document.getElementById('avgConfidence');
        if (avgConfidenceElement) {
            const avgConfidence = this.sessionStats.confidenceCount > 0
                ? Math.round((this.sessionStats.confidenceSum / this.sessionStats.confidenceCount) * 100)
                : 0;
            avgConfidenceElement.textContent = `${avgConfidence}%`;
        }
    }
    
    /**
     * Add punctuation to text
     */
    addPunctuation(text) {
        // Simple punctuation rules
        let result = text.trim();
        
        // Add period if sentence doesn't end with punctuation
        if (!/[.!?]$/.test(result)) {
            result += '.';
        }
        
        // Capitalize "I"
        result = result.replace(/\bi\b/g, 'I');
        
        return result;
    }
    
    /**
     * Capitalize sentences
     */
    capitalizeSentences(text) {
        return text.replace(/(^\s*\w|[.!?]\s+\w)/g, match => match.toUpperCase());
    }
    
    /**
     * Add transcript to history
     */
    addToHistory(transcript) {
        const historyItem = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            text: transcript,
            language: this.settings.language,
            wordCount: transcript.trim().split(/\s+/).length,
            confidence: this.sessionStats.confidenceCount > 0
                ? Math.round((this.sessionStats.confidenceSum / this.sessionStats.confidenceCount) * 100)
                : 0
        };
        
        this.history.unshift(historyItem);
        
        // Keep only last 10 items
        if (this.history.length > 10) {
            this.history = this.history.slice(0, 10);
        }
        
        this.saveHistory();
        this.renderHistory();
    }
    
    /**
     * Render history items
     */
    renderHistory() {
        const historyContainer = document.getElementById('transcriptHistory');
        if (!historyContainer) return;
        
        historyContainer.innerHTML = '';
        
        this.history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <small>${item.timestamp}</small>
                <p class="mb-1">"${item.text}"</p>
                <small class="text-muted">${this.getLanguageName(item.language)}, ${item.wordCount} words, ${item.confidence}% confidence</small>
            `;
            
            historyItem.addEventListener('click', () => {
                this.insertText(item.text);
            });
            
            historyContainer.appendChild(historyItem);
        });
    }
    
    /**
     * Render quick phrases
     */
    renderQuickPhrases() {
        // Quick phrases are already rendered in HTML
        // This method can be extended if needed
    }
    
    /**
     * Get language name from code
     */
    getLanguageName(code) {
        const languages = {
            'en-US': 'English (US)',
            'en-GB': 'English (UK)',
            'bn-BD': 'Bangla',
            'bn-IN': 'Bangla (India)',
            'hi-IN': 'Hindi',
            'es-ES': 'Spanish',
            'fr-FR': 'French'
        };
        
        return languages[code] || code;
    }
    
    /**
     * Insert text into transcript
     */
    insertText(text) {
        const transcriptBox = document.getElementById('transcriptBox');
        if (!transcriptBox) return;
        
        // Remove placeholder if present
        if (transcriptBox.innerHTML.includes('Your speech will appear here')) {
            transcriptBox.innerHTML = '';
        }
        
        const newParagraph = document.createElement('p');
        newParagraph.textContent = text;
        transcriptBox.appendChild(newParagraph);
        
        this.updateCounts();
        this.showToast('Text inserted', 'info');
    }
    
    /**
     * Clear transcript
     */
    clearTranscript() {
        const transcriptBox = document.getElementById('transcriptBox');
        if (transcriptBox) {
            transcriptBox.innerHTML = '<p>Your speech will appear here as you speak...</p><p>Try saying: "Hello, this is a test of the speech recognition system."</p>';
            this.transcript = '';
            this.updateCounts();
            this.showToast('Transcript cleared', 'info');
        }
    }
    
    /**
     * Copy transcript to clipboard
     */
    copyTranscript() {
        const transcriptBox = document.getElementById('transcriptBox');
        if (!transcriptBox) return;
        
        const text = transcriptBox.textContent || transcriptBox.innerText;
        
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Transcript copied to clipboard', 'success');
        }).catch(err => {
            console.error('Failed to copy:', err);
            this.showToast('Failed to copy transcript', 'error');
        });
    }
    
    /**
     * Save transcript
     */
    saveTranscript() {
        const transcriptBox = document.getElementById('transcriptBox');
        if (!transcriptBox) return;
        
        const text = transcriptBox.textContent || transcriptBox.innerText;
        
        // In a real app, this would save to server
        // For demo, we'll save to localStorage
        const savedTranscripts = JSON.parse(localStorage.getItem('savedTranscripts') || '[]');
        savedTranscripts.push({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            text: text,
            wordCount: text.trim().split(/\s+/).length
        });
        
        localStorage.setItem('savedTranscripts', JSON.stringify(savedTranscripts));
        
        this.showToast('Transcript saved', 'success');
    }
    
    /**
     * Enhance transcript with AI (demo)
     */
    enhanceTranscript() {
        const transcriptBox = document.getElementById('transcriptBox');
        if (!transcriptBox) return;
        
        let text = transcriptBox.textContent || transcriptBox.innerText;
        
        // Demo enhancement: fix common issues
        text = text.replace(/\s+/g, ' ').trim();
        text = text.replace(/([.!?])\s*/g, '$1 ');
        text = text.replace(/\bi\b/g, 'I');
        
        // Capitalize sentences
        text = text.replace(/(^\s*\w|[.!?]\s+\w)/g, match => match.toUpperCase());
        
        transcriptBox.innerHTML = `<p>${text}</p>`;
        
        this.updateCounts();
        this.showToast('Transcript enhanced with AI', 'success');
    }
    
    /**
     * Reset statistics
     */
    resetStats() {
        this.sessionStats = {
            totalWords: 0,
            totalCharacters: 0,
            totalSessions: 0,
            totalTime: 0,
            confidenceSum: 0,
            confidenceCount: 0
        };
        
        this.saveStats();
        this.updateStatsDisplay();
        this.showToast('Statistics reset', 'info');
    }
    
    /**
     * Reset all (transcript, stats, history)
     */
    resetAll() {
        this.clearTranscript();
        this.resetStats();
        this.history = [];
        this.saveHistory();
        this.renderHistory();
        this.showToast('All data reset', 'warning');
    }
    
    /**
     * Save settings to localStorage
     */
    saveSettings() {
        localStorage.setItem('speechToTextSettings', JSON.stringify(this.settings));
    }
    
    /**
     * Save statistics to localStorage
     */
    saveStats() {
        localStorage.setItem('speechToTextStats', JSON.stringify(this.sessionStats));
    }
    
    /**
     * Save history to localStorage
     */
    saveHistory() {
        localStorage.setItem('speechToTextHistory', JSON.stringify(this.history));
    }
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Use main.js toast function if available
        if (window.showToast) {
            window.showToast(message, type);
            return;
        }
        
        // Fallback toast
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
        
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} alert-dismissible fade show`;
        toast.style.minWidth = '300px';
        toast.style.marginBottom = '10px';
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }
}

// Global functions for HTML onclick handlers
function startRecognition() {
    if (window.speechToText) {
        window.speechToText.startRecognition();
    }
}

function pauseRecognition() {
    if (window.speechToText) {
        window.speechToText.pauseRecognition();
    }
}

function stopRecognition() {
    if (window.speechToText) {
        window.speechToText.stopRecognition();
    }
}

function clearTranscript() {
    if (window.speechToText) {
        window.speechToText.clearTranscript();
    }
}

function copyTranscript() {
    if (window.speechToText) {
        window.speechToText.copyTranscript();
    }
}

function saveTranscript() {
    if (window.speechToText) {
        window.speechToText.saveTranscript();
    }
}

function enhanceTranscript() {
    if (window.speechToText) {
        window.speechToText.enhanceTranscript();
    }
}

function resetStats() {
    if (window.speechToText) {
        window.speechToText.resetStats();
    }
}

function resetAll() {
    if (window.speechToText) {
        window.speechToText.resetAll();
    }
}

function insertText(text) {
    if (window.speechToText) {
        window.speechToText.insertText(text);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.speechToText = new SpeechToText();
    window.speechToText.init();
});