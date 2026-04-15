/**
 * Text to Speech Module for Silent Speak
 * Handles text-to-speech conversion with voice selection, rate, pitch, and volume controls
 */
 
class TextToSpeech {
    constructor() {
        this.speechSynthesis = window.speechSynthesis;
        this.speechUtterance = null;
        this.isSpeaking = false;
        this.isPaused = false;
        this.voices = [];
        this.currentVoice = null;
        this.currentText = '';
        this.wordIndex = 0;
        this.words = [];
        this.highlightInterval = null;
        
        this.settings = {
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0,
            language: 'en-US',
            autoPlay: true,
            highlightWords: true
        };
        
        this.init();
    }
    
    async init() {
        // Load saved settings
        this.loadSettings();
        
        // Initialize UI
        this.initUI();
        
        // Load available voices
        this.loadVoices();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Update character/word count
        this.updateCounts();
    }
    
    loadSettings() {
        const savedSettings = localStorage.getItem('ttsSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
    }
    
    saveSettings() {
        localStorage.setItem('ttsSettings', JSON.stringify(this.settings));
    }
    
    initUI() {
        // Set slider values from settings
        const rateSlider = document.getElementById('rateSlider');
        const pitchSlider = document.getElementById('pitchSlider');
        const volumeSlider = document.getElementById('volumeSlider');
        const languageSelect = document.getElementById('languageSelect');
        const autoPlayCheckbox = document.getElementById('autoPlay');
        const highlightCheckbox = document.getElementById('highlightWords');
        const highContrastCheckbox = document.getElementById('highContrast');
        const largeTextCheckbox = document.getElementById('largeText');
        const colorBlindCheckbox = document.getElementById('colorBlindMode');
        
        if (rateSlider) rateSlider.value = this.settings.rate;
        if (pitchSlider) pitchSlider.value = this.settings.pitch;
        if (volumeSlider) volumeSlider.value = this.settings.volume;
        if (languageSelect) languageSelect.value = this.settings.language;
        if (autoPlayCheckbox) autoPlayCheckbox.checked = this.settings.autoPlay;
        if (highlightCheckbox) highlightCheckbox.checked = this.settings.highlightWords;
        
        // Update display values
        this.updateSliderValues();
        
        // Apply accessibility settings
        if (highContrastCheckbox) {
            highContrastCheckbox.checked = localStorage.getItem('highContrast') === 'true';
            highContrastCheckbox.addEventListener('change', (e) => {
                localStorage.setItem('highContrast', e.target.checked);
                this.applyAccessibilitySettings();
            });
        }
        
        if (largeTextCheckbox) {
            largeTextCheckbox.checked = localStorage.getItem('largeText') === 'true';
            largeTextCheckbox.addEventListener('change', (e) => {
                localStorage.setItem('largeText', e.target.checked);
                this.applyAccessibilitySettings();
            });
        }
        
        if (colorBlindCheckbox) {
            colorBlindCheckbox.checked = localStorage.getItem('colorBlindMode') === 'true';
            colorBlindCheckbox.addEventListener('change', (e) => {
                localStorage.setItem('colorBlindMode', e.target.checked);
                this.applyAccessibilitySettings();
            });
        }
        
        this.applyAccessibilitySettings();
    }
    
    applyAccessibilitySettings() {
        const highContrast = localStorage.getItem('highContrast') === 'true';
        const largeText = localStorage.getItem('largeText') === 'true';
        const colorBlindMode = localStorage.getItem('colorBlindMode') === 'true';
        
        document.body.classList.toggle('high-contrast', highContrast);
        document.body.classList.toggle('large-text', largeText);
        document.body.classList.toggle('color-blind', colorBlindMode);
    }
    
    setupEventListeners() {
        // Text input events
        const textInput = document.getElementById('textInput');
        if (textInput) {
            textInput.addEventListener('input', () => {
                this.updateCounts();
                this.currentText = textInput.value;
            });
            
            textInput.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    this.speakText();
                }
            });
        }
        
        // Slider events
        const rateSlider = document.getElementById('rateSlider');
        const pitchSlider = document.getElementById('pitchSlider');
        const volumeSlider = document.getElementById('volumeSlider');
        
        if (rateSlider) {
            rateSlider.addEventListener('input', (e) => {
                this.settings.rate = parseFloat(e.target.value);
                this.updateSliderValues();
                this.saveSettings();
            });
        }
        
        if (pitchSlider) {
            pitchSlider.addEventListener('input', (e) => {
                this.settings.pitch = parseFloat(e.target.value);
                this.updateSliderValues();
                this.saveSettings();
            });
        }
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.settings.volume = parseFloat(e.target.value);
                this.updateSliderValues();
                this.saveSettings();
            });
        }
        
        // Language select
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.settings.language = e.target.value;
                this.saveSettings();
                this.filterVoicesByLanguage();
            });
        }
        
        // Checkbox events
        const autoPlayCheckbox = document.getElementById('autoPlay');
        const highlightCheckbox = document.getElementById('highlightWords');
        
        if (autoPlayCheckbox) {
            autoPlayCheckbox.addEventListener('change', (e) => {
                this.settings.autoPlay = e.target.checked;
                this.saveSettings();
            });
        }
        
        if (highlightCheckbox) {
            highlightCheckbox.addEventListener('change', (e) => {
                this.settings.highlightWords = e.target.checked;
                this.saveSettings();
            });
        }
        
        // Quick phrase buttons
        document.querySelectorAll('.quick-phrase').forEach(button => {
            button.addEventListener('click', (e) => {
                const text = e.target.dataset.text || e.target.closest('.quick-phrase').dataset.text;
                if (text && textInput) {
                    textInput.value = text;
                    this.updateCounts();
                    this.currentText = text;
                    
                    // Auto-speak if enabled
                    if (this.settings.autoPlay) {
                        setTimeout(() => this.speakText(), 500);
                    }
                }
            });
        });
        
        // Voice select
        const voiceSelect = document.getElementById('voiceSelect');
        if (voiceSelect) {
            voiceSelect.addEventListener('change', (e) => {
                const voiceName = e.target.value;
                this.currentVoice = this.voices.find(v => v.name === voiceName);
                this.updateCurrentVoiceName();
            });
        }
    }
    
    updateSliderValues() {
        const rateValue = document.getElementById('rateValue');
        const pitchValue = document.getElementById('pitchValue');
        const volumeValue = document.getElementById('volumeValue');
        
        if (rateValue) {
            let rateText = 'Normal (1.0)';
            if (this.settings.rate < 1) rateText = `Slow (${this.settings.rate.toFixed(1)})`;
            else if (this.settings.rate > 1) rateText = `Fast (${this.settings.rate.toFixed(1)})`;
            rateValue.textContent = rateText;
        }
        
        if (pitchValue) {
            let pitchText = 'Normal (1.0)';
            if (this.settings.pitch < 1) pitchText = `Low (${this.settings.pitch.toFixed(1)})`;
            else if (this.settings.pitch > 1) pitchText = `High (${this.settings.pitch.toFixed(1)})`;
            pitchValue.textContent = pitchText;
        }
        
        if (volumeValue) {
            let volumeText = 'Loud (1.0)';
            if (this.settings.volume < 0.5) volumeText = `Quiet (${this.settings.volume.toFixed(1)})`;
            else if (this.settings.volume < 1) volumeText = `Medium (${this.settings.volume.toFixed(1)})`;
            volumeValue.textContent = volumeText;
        }
    }
    
    updateCounts() {
        const textInput = document.getElementById('textInput');
        if (!textInput) return;
        
        const text = textInput.value;
        const charCount = text.length;
        const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        
        const charCountElement = document.getElementById('charCount');
        const wordCountElement = document.getElementById('wordCount');
        
        if (charCountElement) charCountElement.textContent = `Characters: ${charCount}`;
        if (wordCountElement) wordCountElement.textContent = `Words: ${wordCount}`;
    }
    
    loadVoices() {
        // Wait for voices to be loaded
        const populateVoices = () => {
            this.voices = this.speechSynthesis.getVoices();
            const voiceSelect = document.getElementById('voiceSelect');
            
            if (!voiceSelect) return;
            
            voiceSelect.innerHTML = '';
            
            // Filter voices by selected language
            const filteredVoices = this.filterVoicesByLanguage();
            
            filteredVoices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
            });
            
            // Select first voice by default
            if (filteredVoices.length > 0 && !this.currentVoice) {
                this.currentVoice = filteredVoices[0];
                voiceSelect.value = this.currentVoice.name;
                this.updateCurrentVoiceName();
            }
        };
        
        // Some browsers load voices asynchronously
        if (this.speechSynthesis.getVoices().length > 0) {
            populateVoices();
        } else {
            this.speechSynthesis.onvoiceschanged = populateVoices;
        }
    }
    
    filterVoicesByLanguage() {
        const languageSelect = document.getElementById('languageSelect');
        const selectedLang = languageSelect ? languageSelect.value : this.settings.language;
        
        return this.voices.filter(voice => {
            return voice.lang.startsWith(selectedLang) || 
                   selectedLang === 'bn' && voice.lang.includes('bn') ||
                   selectedLang === 'hi' && voice.lang.includes('hi');
        });
    }
    
    updateCurrentVoiceName() {
        const currentVoiceName = document.getElementById('currentVoiceName');
        if (currentVoiceName && this.currentVoice) {
            currentVoiceName.textContent = `${this.currentVoice.name} (${this.currentVoice.lang})`;
        }
    }
    
    speakText() {
        const textInput = document.getElementById('textInput');
        if (!textInput) return;
        
        const text = textInput.value.trim();
        if (!text) {
            this.showToast('Please enter some text to speak.', 'warning');
            return;
        }
        
        this.currentText = text;
        this.words = text.split(/\s+/);
        this.wordIndex = 0;
        
        // Stop any ongoing speech
        this.stopSpeech();
        
        // Create new utterance
        this.speechUtterance = new SpeechSynthesisUtterance(text);
        
        // Configure utterance
        if (this.currentVoice) {
            this.speechUtterance.voice = this.currentVoice;
        }
        
        this.speechUtterance.rate = this.settings.rate;
        this.speechUtterance.pitch = this.settings.pitch;
        this.speechUtterance.volume = this.settings.volume;
        this.speechUtterance.lang = this.settings.language;
        
        // Set up event handlers
        this.speechUtterance.onstart = () => {
            this.isSpeaking = true;
            this.updateSpeechControls();
            this.startWordHighlighting();
            this.showToast('Speech started.', 'success');
        };
        
        this.speechUtterance.onend = () => {
            this.isSpeaking = false;
            this.isPaused = false;
            this.updateSpeechControls();
            this.stopWordHighlighting();
            this.showToast('Speech completed.', 'info');
        };
        
        this.speechUtterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.isSpeaking = false;
            this.isPaused = false;
            this.updateSpeechControls();
            this.stopWordHighlighting();
            this.showToast('Speech error occurred.', 'error');
        };
        
        this.speechUtterance.onpause = () => {
            this.isPaused = true;
            this.updateSpeechControls();
            this.showToast('Speech paused.', 'warning');
        };
        
        this.speechUtterance.onresume = () => {
            this.isPaused = false;
            this.updateSpeechControls();
            this.showToast('Speech resumed.', 'success');
        };
        
        // Calculate estimated duration (rough estimate)
        const wordCount = this.words.length;
        const wordsPerMinute = 150; // Average speaking rate
        const estimatedMinutes = wordCount / wordsPerMinute;
        const estimatedSeconds = Math.ceil(estimatedMinutes * 60);
        
        // Update progress display
        this.updateProgress(0, estimatedSeconds);
        
        // Start speech
        this.speechSynthesis.speak(this.speechUtterance);
        
        // Update progress periodically
        this.startProgressUpdate(estimatedSeconds);
    }
    
    pauseSpeech() {
        if (this.speechSynthesis.speaking && !this.speechSynthesis.paused) {
            this.speechSynthesis.pause();
            this.isPaused = true;
            this.updateSpeechControls();
        }
    }
    
    resumeSpeech() {
        if (this.speechSynthesis.speaking && this.speechSynthesis.paused) {
            this.speechSynthesis.resume();
            this.isPaused = false;
            this.updateSpeechControls();
        }
    }
    
    stopSpeech() {
        if (this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
            this.isSpeaking = false;
            this.isPaused = false;
            this.updateSpeechControls();
            this.stopWordHighlighting();
            this.updateProgress(0, 0);
        }
    }
    
    updateSpeechControls() {
        const speakBtn = document.getElementById('speakBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (speakBtn) {
            if (this.isPaused) {
                speakBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
                speakBtn.onclick = () => this.resumeSpeech();
            } else {
                speakBtn.innerHTML = '<i class="fas fa-play"></i> Speak Text';
                speakBtn.onclick = () => this.speakText();
            }
            speakBtn.disabled = this.isSpeaking && !this.isPaused;
        }
        
        if (pauseBtn) {
            pauseBtn.disabled = !this.isSpeaking || this.isPaused;
            pauseBtn.innerHTML = this.isPaused ? '<i class="fas fa-play"></i> Resume' : '<i class="fas fa-pause"></i> Pause';
            pauseBtn.onclick = this.isPaused ? () => this.resumeSpeech() : () => this.pauseSpeech();
        }
        
        if (stopBtn) {
            stopBtn.disabled = !this.isSpeaking;
        }
    }
    
    startWordHighlighting() {
        if (!this.settings.highlightWords) return;
        
        this.stopWordHighlighting();
        
        const textInput = document.getElementById('textInput');
        if (!textInput) return;
        
        const text = textInput.value;
        const words = text.split(/\s+/);
        const wordDuration = (text.length * 60) / (150 * 5); // Rough estimate
        
        this.highlightInterval = setInterval(() => {
            if (this.wordIndex < words.length) {
                // Highlight current word
                this.highlightWord(this.wordIndex);
                this.wordIndex++;
            } else {
                this.stopWordHighlighting();
            }
        }, wordDuration * 1000);
    }
    
    highlightWord(index) {
        const textInput = document.getElementById('textInput');
        if (!textInput) return;
        
        const text = textInput.value;
        const words = text.split(/\s+/);
        
        // Create highlighted text
        let highlightedText = '';
        for (let i = 0; i < words.length; i++) {
            if (i === index) {
                highlightedText += `<span class="speaking-word">${words[i]}</span> `;
            } else {
                highlightedText += `${words[i]} `;
            }
        }
        
        // Create a temporary element to show highlighting
        const highlightDisplay = document.getElementById('highlightDisplay');
        if (!highlightDisplay) {
            const div = document.createElement('div');
            div.id = 'highlightDisplay';
            div.className = 'mt-3 p-3 bg-light border rounded';
            div.style.minHeight = '100px';
            textInput.parentNode.insertBefore(div, textInput.nextSibling);
        }
        
        document.getElementById('highlightDisplay').innerHTML = highlightedText.trim();
    }
    
    stopWordHighlighting() {
        if (this.highlightInterval) {
            clearInterval(this.highlightInterval);
            this.highlightInterval = null;
        }
        
        const highlightDisplay = document.getElementById('highlightDisplay');
        if (highlightDisplay) {
            highlightDisplay.remove();
        }
        
        this.wordIndex = 0;
    }
    
    startProgressUpdate(totalSeconds) {
        let elapsedSeconds = 0;
        const progressInterval = setInterval(() => {
            if (!this.isSpeaking || this.isPaused) {
                clearInterval(progressInterval);
                return;
            }
            
            elapsedSeconds++;
            if (elapsedSeconds > totalSeconds) {
                clearInterval(progressInterval);
                return;
            }
            
            this.updateProgress(elapsedSeconds, totalSeconds);
    }, 1000);
}

updateProgress(elapsedSeconds, totalSeconds) {
    const progressBar = document.getElementById('speechProgress');
    const currentTimeElement = document.getElementById('currentTime');
    const totalTimeElement = document.getElementById('totalTime');
    
    if (!progressBar || !currentTimeElement || !totalTimeElement) return;
    
    const progress = totalSeconds > 0 ? (elapsedSeconds / totalSeconds) * 100 : 0;
    progressBar.style.width = `${progress}%`;
    
    // Format time as MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    currentTimeElement.textContent = formatTime(elapsedSeconds);
    totalTimeElement.textContent = formatTime(totalSeconds);
}

previewVoice() {
    const previewText = "This is a voice preview. You can hear how the selected voice sounds.";
    const utterance = new SpeechSynthesisUtterance(previewText);
    
    if (this.currentVoice) {
        utterance.voice = this.currentVoice;
    }
    
    utterance.rate = this.settings.rate;
    utterance.pitch = this.settings.pitch;
    utterance.volume = this.settings.volume;
    
    // Animate preview bar
    const previewBar = document.getElementById('voicePreviewBar');
    if (previewBar) {
        previewBar.style.width = '0%';
        previewBar.classList.remove('bg-success');
        previewBar.classList.add('bg-info');
        
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
                previewBar.classList.remove('bg-info');
                previewBar.classList.add('bg-success');
                return;
            }
            width += 2;
            previewBar.style.width = `${width}%`;
        }, 30);
        
        utterance.onend = () => {
            clearInterval(interval);
            previewBar.style.width = '100%';
            setTimeout(() => {
                previewBar.style.width = '0%';
                previewBar.classList.remove('bg-info');
                previewBar.classList.add('bg-success');
            }, 500);
        };
    }
    
    this.speechSynthesis.speak(utterance);
    this.showToast('Playing voice preview...', 'info');
}

downloadAudio() {
    this.showToast('Audio download feature requires server-side processing.', 'info');
    // Note: Web Speech API doesn't support direct audio download
    // In a real implementation, this would use a server-side TTS service
}

saveToNotes() {
    const textInput = document.getElementById('textInput');
    if (!textInput) return;
    
    const text = textInput.value.trim();
    if (!text) {
        this.showToast('No text to save.', 'warning');
        return;
    }
    
    // Save to localStorage for notes page
    const notes = JSON.parse(localStorage.getItem('userNotes') || '[]');
    const newNote = {
        id: Date.now(),
        title: `TTS: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`,
        content: text,
        type: 'tts',
        date: new Date().toISOString(),
        voice: this.currentVoice ? this.currentVoice.name : 'Default',
        settings: {
            rate: this.settings.rate,
            pitch: this.settings.pitch,
            volume: this.settings.volume
        }
    };
    
    notes.unshift(newNote);
    localStorage.setItem('userNotes', JSON.stringify(notes));
    
    this.showToast('Text saved to notes.', 'success');
}

clearText() {
    const textInput = document.getElementById('textInput');
    if (textInput) {
        textInput.value = '';
        this.updateCounts();
        this.currentText = '';
        this.showToast('Text cleared.', 'info');
    }
}

pasteText() {
    const textInput = document.getElementById('textInput');
    if (!textInput) return;
    
    navigator.clipboard.readText()
        .then(text => {
            textInput.value = text;
            this.updateCounts();
            this.currentText = text;
            this.showToast('Text pasted from clipboard.', 'success');
        })
        .catch(err => {
            console.error('Failed to read clipboard:', err);
            this.showToast('Could not access clipboard.', 'error');
        });
}

clearHistory() {
    if (confirm('Clear conversion history?')) {
        localStorage.removeItem('ttsHistory');
        this.showToast('History cleared.', 'info');
    }
}

resetSettings() {
    if (confirm('Reset all settings to defaults?')) {
        localStorage.removeItem('ttsSettings');
        this.settings = {
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0,
            language: 'en-US',
            autoPlay: true,
            highlightWords: true
        };
        
        this.initUI();
        this.showToast('Settings reset to defaults.', 'success');
    }
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
}

// Global functions for HTML onclick handlers
function speakText() {
if (window.textToSpeech) window.textToSpeech.speakText();
}

function pauseSpeech() {
if (window.textToSpeech) window.textToSpeech.pauseSpeech();
}

function stopSpeech() {
if (window.textToSpeech) window.textToSpeech.stopSpeech();
}

function previewVoice() {
if (window.textToSpeech) window.textToSpeech.previewVoice();
}

function downloadAudio() {
if (window.textToSpeech) window.textToSpeech.downloadAudio();
}

function saveToNotes() {
if (window.textToSpeech) window.textToSpeech.saveToNotes();
}

function clearText() {
if (window.textToSpeech) window.textToSpeech.clearText();
}

function pasteText() {
if (window.textToSpeech) window.textToSpeech.pasteText();
}

function clearHistory() {
if (window.textToSpeech) window.textToSpeech.clearHistory();
}

function resetSettings() {
if (window.textToSpeech) window.textToSpeech.resetSettings();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
window.textToSpeech = new TextToSpeech();
});