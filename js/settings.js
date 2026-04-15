/**
 * Settings Management System for Silent Speak
 * Handles accessibility, notification, privacy, and general settings
 */
 
class SettingsManager {
    constructor() {
        this.settings = {
            accessibility: {
                fontSize: 'medium',
                colorTheme: 'default',
                highContrast: false,
                colorBlindMode: 'none',
                dyslexiaFont: false,
                reduceMotion: false,
                screenReader: false
            },
            notifications: {
                email: true,
                push: false,
                assignments: true,
                classAlerts: true,
                frequency: 'hourly',
                sound: true
            },
            privacy: {
                dataCollection: true,
                personalizedAds: false,
                autoSave: true,
                cloudBackup: false,
                shareProgress: false,
                analytics: true
            },
            general: {
                language: 'en',
                timezone: 'Asia/Dhaka',
                dateFormat: 'dd/mm/yyyy',
                autoLogout: 30,
                showTutorial: true,
                backupFrequency: 'weekly'
            },
            lastUpdated: new Date().toISOString()
        };
        
        this.init();
    }
    
    async init() {
        this.loadSettings();
        this.initUI();
        this.setupEventListeners();
        this.updateSummary();
        this.applySettings();
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('silentSpeakSettings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
                console.log('Settings loaded from localStorage');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    saveSettings() {
        try {
            this.settings.lastUpdated = new Date().toISOString();
            localStorage.setItem('silentSpeakSettings', JSON.stringify(this.settings));
            console.log('Settings saved to localStorage');
            this.updateSummary();
            this.applySettings();
            this.showToast('Settings saved successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showToast('Error saving settings', 'error');
            return false;
        }
    }
    
    initUI() {
        // Load accessibility settings
        document.getElementById('fontSize').value = this.settings.accessibility.fontSize;
        document.getElementById('highContrast').checked = this.settings.accessibility.highContrast;
        document.getElementById('dyslexiaFont').checked = this.settings.accessibility.dyslexiaFont;
        document.getElementById('reduceMotion').checked = this.settings.accessibility.reduceMotion;
        document.getElementById('screenReader').checked = this.settings.accessibility.screenReader;
        document.getElementById('colorBlindMode').value = this.settings.accessibility.colorBlindMode;
        
        // Set active theme radio button
        const themeRadios = document.querySelectorAll('input[name="colorTheme"]');
        themeRadios.forEach(radio => {
            if (radio.value === this.settings.accessibility.colorTheme) {
                radio.checked = true;
                const parent = radio.closest('.theme-option');
                if (parent) parent.classList.add('active');
            }
        });
        
        // Load notification settings
        document.getElementById('emailNotifications').checked = this.settings.notifications.email;
        document.getElementById('pushNotifications').checked = this.settings.notifications.push;
        document.getElementById('assignmentReminders').checked = this.settings.notifications.assignments;
        document.getElementById('classAlerts').checked = this.settings.notifications.classAlerts;
        document.getElementById('notificationFrequency').value = this.settings.notifications.frequency;
        document.getElementById('notificationSound').checked = this.settings.notifications.sound;
        
        // Load privacy settings
        document.getElementById('dataCollection').checked = this.settings.privacy.dataCollection;
        document.getElementById('personalizedAds').checked = this.settings.privacy.personalizedAds;
        document.getElementById('autoSave').checked = this.settings.privacy.autoSave;
        document.getElementById('cloudBackup').checked = this.settings.privacy.cloudBackup;
        document.getElementById('shareProgress').checked = this.settings.privacy.shareProgress;
        document.getElementById('analytics').checked = this.settings.privacy.analytics;
        
        // Load general settings
        document.getElementById('language').value = this.settings.general.language;
        document.getElementById('timezone').value = this.settings.general.timezone;
        document.getElementById('dateFormat').value = this.settings.general.dateFormat;
        document.getElementById('autoLogout').value = this.settings.general.autoLogout;
        document.getElementById('showTutorial').checked = this.settings.general.showTutorial;
        document.getElementById('backupFrequency').value = this.settings.general.backupFrequency;
    }
    
    setupEventListeners() {
        // Save button
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        
        // Reset button
        document.getElementById('resetSettings').addEventListener('click', () => this.resetToDefaults());
        
        // Export button
        document.getElementById('exportSettings').addEventListener('click', () => this.exportSettings());
        
        // Import button
        document.getElementById('importSettings').addEventListener('click', () => this.importSettings());
        
        // Clear data button
        document.getElementById('clearData').addEventListener('click', () => this.clearAllData());
        
        // Real-time updates for accessibility settings
        document.getElementById('fontSize').addEventListener('input', (e) => {
            this.settings.accessibility.fontSize = e.target.value;
            this.applyAccessibilitySettings();
        });
        
        document.getElementById('highContrast').addEventListener('change', (e) => {
            this.settings.accessibility.highContrast = e.target.checked;
            this.applyAccessibilitySettings();
        });
        
        document.getElementById('dyslexiaFont').addEventListener('change', (e) => {
            this.settings.accessibility.dyslexiaFont = e.target.checked;
            this.applyAccessibilitySettings();
        });
        
        document.getElementById('reduceMotion').addEventListener('change', (e) => {
            this.settings.accessibility.reduceMotion = e.target.checked;
            this.applyAccessibilitySettings();
        });
        
        document.getElementById('screenReader').addEventListener('change', (e) => {
            this.settings.accessibility.screenReader = e.target.checked;
            this.applyAccessibilitySettings();
        });
        
        document.getElementById('colorBlindMode').addEventListener('change', (e) => {
            this.settings.accessibility.colorBlindMode = e.target.value;
            this.applyAccessibilitySettings();
        });
        
        // Theme selection
        const themeRadios = document.querySelectorAll('input[name="colorTheme"]');
        themeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.settings.accessibility.colorTheme = e.target.value;
                this.applyAccessibilitySettings();
            });
        });
        
        // Notification settings
        document.getElementById('emailNotifications').addEventListener('change', (e) => {
            this.settings.notifications.email = e.target.checked;
        });
        
        document.getElementById('pushNotifications').addEventListener('change', (e) => {
            this.settings.notifications.push = e.target.checked;
        });
        
        document.getElementById('assignmentReminders').addEventListener('change', (e) => {
            this.settings.notifications.assignments = e.target.checked;
        });
        
        document.getElementById('classAlerts').addEventListener('change', (e) => {
            this.settings.notifications.classAlerts = e.target.checked;
        });
        
        document.getElementById('notificationFrequency').addEventListener('change', (e) => {
            this.settings.notifications.frequency = e.target.value;
        });
        
        document.getElementById('notificationSound').addEventListener('change', (e) => {
            this.settings.notifications.sound = e.target.checked;
        });
        
        // Privacy settings
        document.getElementById('dataCollection').addEventListener('change', (e) => {
            this.settings.privacy.dataCollection = e.target.checked;
        });
        
        document.getElementById('personalizedAds').addEventListener('change', (e) => {
            this.settings.privacy.personalizedAds = e.target.checked;
        });
        
        document.getElementById('autoSave').addEventListener('change', (e) => {
            this.settings.privacy.autoSave = e.target.checked;
        });
        
        document.getElementById('cloudBackup').addEventListener('change', (e) => {
            this.settings.privacy.cloudBackup = e.target.checked;
        });
        
        document.getElementById('shareProgress').addEventListener('change', (e) => {
            this.settings.privacy.shareProgress = e.target.checked;
        });
        
        document.getElementById('analytics').addEventListener('change', (e) => {
            this.settings.privacy.analytics = e.target.checked;
        });
        
        // General settings
        document.getElementById('language').addEventListener('change', (e) => {
            this.settings.general.language = e.target.value;
        });
        
        document.getElementById('timezone').addEventListener('change', (e) => {
            this.settings.general.timezone = e.target.value;
        });
        
        document.getElementById('dateFormat').addEventListener('change', (e) => {
            this.settings.general.dateFormat = e.target.value;
        });
        
        document.getElementById('autoLogout').addEventListener('change', (e) => {
            this.settings.general.autoLogout = parseInt(e.target.value);
        });
        
        document.getElementById('showTutorial').addEventListener('change', (e) => {
            this.settings.general.showTutorial = e.target.checked;
        });
        
        document.getElementById('backupFrequency').addEventListener('change', (e) => {
            this.settings.general.backupFrequency = e.target.value;
        });
    }
    
    applySettings() {
        this.applyAccessibilitySettings();
        this.applyNotificationSettings();
        this.applyPrivacySettings();
        this.applyGeneralSettings();
    }
    
    applyAccessibilitySettings() {
        const { fontSize, colorTheme, highContrast, colorBlindMode, dyslexiaFont, reduceMotion, screenReader } = this.settings.accessibility;
        
        // Apply font size
        const fontSizeMap = {
            'small': '14px',
            'medium': '16px',
            'large': '18px',
            'x-large': '20px'
        };
        document.documentElement.style.fontSize = fontSizeMap[fontSize] || '16px';
        
        // Apply color theme
        document.body.setAttribute('data-theme', colorTheme);
        
        // Apply high contrast
        if (highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
        
        // Apply dyslexia font
        if (dyslexiaFont) {
            document.body.classList.add('dyslexia-font');
            document.body.style.fontFamily = '"OpenDyslexic", "Comic Sans MS", sans-serif';
        } else {
            document.body.classList.remove('dyslexia-font');
            document.body.style.fontFamily = '';
        }
        
        // Apply reduce motion
        if (reduceMotion) {
            document.body.classList.add('reduce-motion');
        } else {
            document.body.classList.remove('reduce-motion');
        }
        
        // Apply color blind mode
        document.body.setAttribute('data-color-blind', colorBlindMode);
        
        // Apply screen reader optimizations
        if (screenReader) {
            document.body.setAttribute('aria-live', 'polite');
            document.body.setAttribute('role', 'document');
        } else {
            document.body.removeAttribute('aria-live');
            document.body.removeAttribute('role');
        }
        
        // Update UI indicators
        this.updateAccessibilityIndicators();
    }
    
    applyNotificationSettings() {
        // In a real app, this would configure notification services
        console.log('Notification settings applied:', this.settings.notifications);
    }
    
    applyPrivacySettings() {
        // In a real app, this would configure privacy services
        console.log('Privacy settings applied:', this.settings.privacy);
    }
    
    applyGeneralSettings() {
        // Apply language
        document.documentElement.lang = this.settings.general.language;
        
        // Apply timezone (would be used for date displays)
        console.log('General settings applied:', this.settings.general);
    }
    
    updateAccessibilityIndicators() {
        // Update font size indicator
        const fontSizeValue = document.getElementById('fontSizeValue');
        if (fontSizeValue) {
            fontSizeValue.textContent = this.settings.accessibility.fontSize.charAt(0).toUpperCase() + this.settings.accessibility.fontSize.slice(1);
        }
        
        // Update color blind mode indicator
        const colorBlindValue = document.getElementById('colorBlindValue');
        if (colorBlindValue) {
            const mode = this.settings.accessibility.colorBlindMode;
            colorBlindValue.textContent = mode === 'none' ? 'None' : 
                                         mode === 'protanopia' ? 'Red-Blind' :
                                         mode === 'deuteranopia' ? 'Green-Blind' :
                                         mode === 'tritanopia' ? 'Blue-Blind' : 'Monochrome';
        }
    }
    
    updateSummary() {
        const summaryElement = document.getElementById('settingsSummary');
        if (!summaryElement) return;
        
        const lastUpdated = new Date(this.settings.lastUpdated).toLocaleString();
        const enabledFeatures = [];
        
        // Count enabled accessibility features
        if (this.settings.accessibility.highContrast) enabledFeatures.push('High Contrast');
        if (this.settings.accessibility.dyslexiaFont) enabledFeatures.push('Dyslexia Font');
        if (this.settings.accessibility.reduceMotion) enabledFeatures.push('Reduced Motion');
        if (this.settings.accessibility.screenReader) enabledFeatures.push('Screen Reader');
        if (this.settings.accessibility.colorBlindMode !== 'none') enabledFeatures.push('Color Blind Mode');
        
        // Count enabled notifications
        let notificationCount = 0;
        if (this.settings.notifications.email) notificationCount++;
        if (this.settings.notifications.push) notificationCount++;
        if (this.settings.notifications.assignments) notificationCount++;
        if (this.settings.notifications.classAlerts) notificationCount++;
        
        summaryElement.innerHTML = `
            <div class="summary-item d-flex justify-content-between">
                <span><i class="fas fa-font"></i> Font Size</span>
                <span class="fw-bold">${this.settings.accessibility.fontSize.charAt(0).toUpperCase() + this.settings.accessibility.fontSize.slice(1)}</span>
            </div>
            <div class="summary-item d-flex justify-content-between">
                <span><i class="fas fa-palette"></i> Color Theme</span>
                <span class="fw-bold">${this.settings.accessibility.colorTheme.charAt(0).toUpperCase() + this.settings.accessibility.colorTheme.slice(1)}</span>
            </div>
            <div class="summary-item d-flex justify-content-between">
                <span><i class="fas fa-eye"></i> Accessibility Features</span>
                <span class="fw-bold">${enabledFeatures.length} active</span>
            </div>
            <div class="summary-item d-flex justify-content-between">
                <span><i class="fas fa-bell"></i> Notifications</span>
                <span class="fw-bold">${notificationCount} enabled</span>
            </div>
            <div class="summary-item d-flex justify-content-between">
                <span><i class="fas fa-shield-alt"></i> Privacy Settings</span>
                <span class="fw-bold">${this.settings.privacy.dataCollection ? 'Data sharing ON' : 'Data sharing OFF'}</span>
            </div>
            <div class="summary-item d-flex justify-content-between">
                <span><i class="fas fa-language"></i> Language</span>
                <span class="fw-bold">${this.getLanguageName(this.settings.general.language)}</span>
            </div>
            <div class="summary-item d-flex justify-content-between">
                <span><i class="fas fa-history"></i> Last Updated</span>
                <span class="fw-bold">${lastUpdated}</span>
            </div>
            <div class="summary-item d-flex justify-content-between">
                <span><i class="fas fa-database"></i> Data Backup</span>
                <span class="fw-bold">${this.settings.privacy.cloudBackup ? 'Cloud backup ON' : 'Local storage only'}</span>
            </div>
        `;
    }
    
    getLanguageName(code) {
        const languages = {
            'en': 'English',
            'bn': 'Bangla',
            'hi': 'Hindi',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'ar': 'Arabic'
        };
        return languages[code] || code.toUpperCase();
    }
    
    resetToDefaults() {
        if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
            // Clear settings from localStorage
            localStorage.removeItem('silentSpeakSettings');
            
            // Reset to default settings
            this.settings = new SettingsManager().settings;
            
            // Update UI
            this.initUI();
            this.applySettings();
            this.updateSummary();
            
            this.showToast('Settings reset to defaults', 'success');
        }
    }
    
    exportSettings() {
        const dataStr = JSON.stringify(this.settings, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `silent-speak-settings-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showToast('Settings exported successfully', 'success');
    }
    
    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedSettings = JSON.parse(event.target.result);
                    
                    // Validate imported settings
                    if (!importedSettings.accessibility || !importedSettings.notifications || !importedSettings.privacy) {
                        throw new Error('Invalid settings file format');
                    }
                    
                    // Merge imported settings with current settings
                    this.settings = { ...this.settings, ...importedSettings };
                    this.settings.lastUpdated = new Date().toISOString();
                    
                    // Save and apply
                    this.saveSettings();
                    this.initUI();
                    this.applySettings();
                    
                    this.showToast('Settings imported successfully', 'success');
                } catch (error) {
                    console.error('Error importing settings:', error);
                    this.showToast('Error importing settings: Invalid file format', 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    clearAllData() {
        if (confirm('Are you sure you want to clear all app data? This will delete all notes, files, and settings. This action cannot be undone.')) {
            try {
                // Clear all localStorage data
                localStorage.clear();
                
                // Reset settings to defaults
                this.settings = new SettingsManager().settings;
                
                // Update UI
                this.initUI();
                this.applySettings();
                this.updateSummary();
                
                this.showToast('All data cleared successfully', 'success');
                
                // Redirect to login page after a delay
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 2000);
            } catch (error) {
                console.error('Error clearing data:', error);
                this.showToast('Error clearing data', 'error');
            }
        }
    }
    
    showToast(message, type = 'info') {
        // Create alert element using DaisyUI classes
        const alert = document.createElement('div');
        const alertType = type === 'error' ? 'error' : type === 'success' ? 'success' : 'info';
        alert.className = `alert alert-${alertType} shadow-lg max-w-md mx-auto mb-4`;
        alert.setAttribute('role', 'alert');
        
        // Icon based on type
        const icon = type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle';
        
        alert.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${icon} mr-3"></i>
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
    
    getCurrentSettings() {
        return { ...this.settings };
    }
    
    updateSetting(category, key, value) {
        if (this.settings[category] && this.settings[category][key] !== undefined) {
            this.settings[category][key] = value;
            this.saveSettings();
            return true;
        }
        return false;
    }
}

// Global functions for HTML onclick handlers
function saveSettings() {
    if (window.settingsManager) {
        window.settingsManager.saveSettings();
    }
}

function resetAllSettings() {
    if (window.settingsManager) {
        window.settingsManager.resetToDefaults();
    }
}

function exportSettings() {
    if (window.settingsManager) {
        window.settingsManager.exportSettings();
    }
}

function importSettings() {
    if (window.settingsManager) {
        window.settingsManager.importSettings();
    }
}

function clearAllData() {
    if (window.settingsManager) {
        window.settingsManager.clearAllData();
    }
}

// Initialize settings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});