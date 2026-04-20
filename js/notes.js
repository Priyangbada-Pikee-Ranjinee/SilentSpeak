class NotesSystem {
    constructor() {
        this.notes = [];
        this.files = [];
        this.currentNote = null;
        this.settings = {
            aiSummarize: true,
            aiFormat: true,
            aiSuggest: false,
            autoSave: true,
            syncInterval: 300000, // 5 minutes
            maxFileSize: 10, // MB
            defaultAccess: 'private'
        };
        
        this.categories = {
            'class': 'Class Notes',
            'assignment': 'Assignments',
            'meeting': 'Meeting Notes',
            'personal': 'Personal',
            'todo': 'To-Do List',
            'reference': 'Reference'
        };
        
        this.stats = {
            totalNotes: 0,
            totalFiles: 0,
            totalSize: 0, // MB
            usedStorage: 0, // MB
            freeStorage: 100 // MB
        };
    }
    
    /**
     * Initialize the notes system
     */
    async init() {
        this.loadSettings();
        this.loadNotes();
        this.loadFiles();
        this.loadStats();
        this.initUI();
        this.setupEventListeners();
        this.renderNotes();
        this.renderRecentFiles();
        this.updateStatsDisplay();
        
        console.log('NotesSystem initialized');
    }
    
    /**
     * Load settings from localStorage
     */
    loadSettings() {
        const saved = localStorage.getItem('notesSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        
        // Update UI elements
        ['aiSummarize', 'aiFormat', 'aiSuggest'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.checked = this.settings[id];
            }
        });
    }
    
    /**
     * Load notes from localStorage
     */
    loadNotes() {
        const saved = localStorage.getItem('userNotes');
        if (saved) {
            this.notes = JSON.parse(saved);
            this.stats.totalNotes = this.notes.length;
        } else {
            // Load demo notes
            this.loadDemoNotes();
        }
    }
    
    /**
     * Load demo notes for initial setup
     */
    loadDemoNotes() {
        this.notes = [
            {
                id: 1,
                title: 'Welcome to Silent Speak Notes',
                content: 'This is your first note. You can edit, delete, or create new notes.',
                category: 'class',
                tags: ['welcome', 'getting-started'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                wordCount: 15,
                favorite: false
            },
            {
                id: 2,
                title: 'Math Assignment - Algebra',
                content: 'Complete problems 1-20 on page 45. Due next Monday.',
                category: 'assignment',
                tags: ['math', 'algebra', 'homework'],
                createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                updatedAt: new Date(Date.now() - 86400000).toISOString(),
                wordCount: 8,
                favorite: true
            },
            {
                id: 3,
                title: 'Class Meeting Notes',
                content: 'Discussed upcoming project deadlines and group assignments.',
                category: 'meeting',
                tags: ['meeting', 'project', 'deadline'],
                createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                updatedAt: new Date(Date.now() - 172800000).toISOString(),
                wordCount: 6,
                favorite: false
            }
        ];
        this.saveNotes();
    }
    
    /**
     * Load files from localStorage
     */
    loadFiles() {
        const saved = localStorage.getItem('userFiles');
        if (saved) {
            this.files = JSON.parse(saved);
            this.stats.totalFiles = this.files.length;
            this.calculateStorage();
        } else {
            // Load demo files
            this.loadDemoFiles();
        }
    }
    
    /**
     * Load demo files for initial setup
     */
    loadDemoFiles() {
        this.files = [
            {
                id: 1,
                name: 'math_assignment.pdf',
                type: 'pdf',
                size: 2.4, // MB
                uploadedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                description: 'Math assignment on algebra',
                access: 'private',
                favorite: false
            },
            {
                id: 2,
                name: 'english_essay.docx',
                type: 'docx',
                size: 1.8, // MB
                uploadedAt: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
                description: 'Essay on Shakespeare',
                access: 'private',
                favorite: true
            }
        ];
        this.saveFiles();
        this.calculateStorage();
    }
    
    /**
     * Load statistics from localStorage
     */
    loadStats() {
        const saved = localStorage.getItem('notesStats');
        if (saved) {
            this.stats = JSON.parse(saved);
        }
    }
    
    /**
     * Initialize UI elements
     */
    initUI() {
        // Set up note editor
        const noteEditor = document.getElementById('noteEditor');
        if (noteEditor) {
            noteEditor.addEventListener('input', () => {
                this.updateWordCount();
            });
        }
        
        // Set up search and filter
        const searchInput = document.getElementById('searchNotes');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.filterNotes();
            });
        }
        
        const filterCategory = document.getElementById('filterCategory');
        if (filterCategory) {
            filterCategory.addEventListener('change', () => {
                this.filterNotes();
            });
        }
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // AI feature checkboxes
        ['aiSummarize', 'aiFormat', 'aiSuggest'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.settings[id] = e.target.checked;
                    this.saveSettings();
                });
            }
        });
        
        // File upload
        const fileUpload = document.getElementById('fileUpload');
        if (fileUpload) {
            fileUpload.addEventListener('change', (e) => {
                this.previewFiles(e.target.files);
            });
        }
    }
    
    /**
     * Save note to storage
     */
    saveNote() {
        const title = document.getElementById('noteTitle').value.trim();
        const content = document.getElementById('noteEditor').innerHTML;
        const category = document.getElementById('noteCategory').value;
        const tagsInput = document.getElementById('noteTags').value.trim();
        
        if (!title) {
            this.showToast('Please enter a note title', 'error');
            return;
        }
        
        if (content === '<p>Start typing your note here...</p><p>You can format text using the toolbar above.</p>' || !content.trim()) {
            this.showToast('Please enter note content', 'error');
            return;
        }
        
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        const wordCount = this.countWords(content);
        
        const note = {
            id: Date.now(),
            title,
            content,
            category,
            tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            wordCount,
            favorite: false
        };
        
        this.notes.unshift(note); // Add to beginning
        this.saveNotes();
        this.renderNotes();
        this.updateStatsDisplay();
        
        // Clear form
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteEditor').innerHTML = '<p>Start typing your note here...</p><p>You can format text using the toolbar above.</p>';
        document.getElementById('noteTags').value = '';
        
        this.showToast('Note saved successfully', 'success');
    }
    
    /**
     * Update word count for editor
     */
    updateWordCount() {
        const content = document.getElementById('noteEditor').innerText;
        const wordCount = this.countWords(content);
        // You could display this somewhere if needed
    }
    
    /**
     * Count words in text
     */
    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    
    /**
     * Save notes to localStorage
     */
    saveNotes() {
        localStorage.setItem('userNotes', JSON.stringify(this.notes));
        this.stats.totalNotes = this.notes.length;
        this.saveStats();
    }
    
    /**
     * Save files to localStorage
     */
    saveFiles() {
        localStorage.setItem('userFiles', JSON.stringify(this.files));
        this.stats.totalFiles = this.files.length;
        this.saveStats();
    }
    
    /**
     * Save settings to localStorage
     */
    saveSettings() {
        localStorage.setItem('notesSettings', JSON.stringify(this.settings));
    }
    
    /**
     * Save statistics to localStorage
     */
    saveStats() {
        localStorage.setItem('notesStats', JSON.stringify(this.stats));
    }
    
    /**
     * Render notes to the UI
     */
    renderNotes() {
        const notesList = document.getElementById('notesList');
        if (!notesList) return;
        
        if (this.notes.length === 0) {
            notesList.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-sticky-note fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No notes yet. Create your first note above!</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        this.notes.forEach(note => {
            const categoryName = this.categories[note.category] || note.category;
            const date = new Date(note.updatedAt).toLocaleDateString();
            const tagsHtml = note.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
            
            html += `
                <div class="note-item" data-note-id="${note.id}">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">
                                ${note.favorite ? '<i class="fas fa-star text-warning me-1"></i>' : ''}
                                ${this.escapeHtml(note.title)}
                            </h6>
                            <p class="text-muted mb-1">
                                <small><i class="fas fa-folder me-1"></i>${categoryName} • ${date} • ${note.wordCount} words</small>
                            </p>
                            <div class="note-preview mb-2">
                                ${this.truncateText(this.stripHtml(note.content), 100)}
                            </div>
                            <div class="tags">
                                ${tagsHtml}
                            </div>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" onclick="notesSystem.editNote(${note.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="notesSystem.deleteNote(${note.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        notesList.innerHTML = html;
    }
    
    /**
     * Upload files
     */
    uploadFiles() {
        const fileInput = document.getElementById('fileUpload');
        const description = document.getElementById('fileDescription').value.trim();
        const access = document.getElementById('fileAccess').value;
        
        if (!fileInput.files || fileInput.files.length === 0) {
            this.showToast('Please select files to upload', 'error');
            return;
        }
        
        const files = Array.from(fileInput.files);
        let totalSize = 0;
        
        // Check file sizes
        for (const file of files) {
            const sizeMB = file.size / (1024 * 1024);
            if (sizeMB > this.settings.maxFileSize) {
                this.showToast(`File ${file.name} exceeds ${this.settings.maxFileSize}MB limit`, 'error');
                return;
            }
            totalSize += sizeMB;
        }
        
        // Check storage space
        if (this.stats.usedStorage + totalSize > 100) {
            this.showToast('Not enough storage space', 'error');
            return;
        }
        
        // Show progress bar
        const progressBar = document.getElementById('uploadProgress');
        progressBar.classList.remove('d-none');
        const progress = progressBar.querySelector('.progress-bar');
        progress.style.width = '0%';
        
        // Simulate upload progress
        let progressValue = 0;
        const interval = setInterval(() => {
            progressValue += 10;
            progress.style.width = `${progressValue}%`;
            
            if (progressValue >= 100) {
                clearInterval(interval);
                
                // Add files to storage
                files.forEach(file => {
                    const fileType = this.getFileType(file.name);
                    const sizeMB = file.size / (1024 * 1024);
                    
                    const fileObj = {
                        id: Date.now() + Math.random(),
                        name: file.name,
                        type: fileType,
                        size: sizeMB,
                        uploadedAt: new Date().toISOString(),
                        description: description || 'No description',
                        access: access,
                        favorite: false
                    };
                    
                    this.files.unshift(fileObj);
                });
                
                this.saveFiles();
                this.calculateStorage();
                this.renderRecentFiles();
                this.updateStatsDisplay();
                
                // Reset form
                fileInput.value = '';
                document.getElementById('fileDescription').value = '';
                
                // Hide progress bar
                setTimeout(() => {
                    progressBar.classList.add('d-none');
                }, 1000);
                
                this.showToast(`${files.length} file(s) uploaded successfully`, 'success');
            }
        }, 100);
    }
    
    /**
     * Get file type from extension
     */
    getFileType(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        return extension;
    }
    
    /**
     * Preview files before upload
     */
    previewFiles(files) {
        // Could implement file preview functionality here
        console.log('Files selected:', files);
    }
    
    /**
     * Download a file
     */
    downloadFile(fileId) {
        const file = this.files.find(f => f.id === fileId);
        if (!file) {
            this.showToast('File not found', 'error');
            return;
        }
        
        // In a real app, this would download the actual file
        // For demo, we'll just show a message
        this.showToast(`Downloading ${file.name}...`, 'info');
        
        // Simulate download
        setTimeout(() => {
            this.showToast(`${file.name} downloaded successfully`, 'success');
        }, 1000);
    }
    
    /**
     * View all files
     */
    viewAllFiles() {
        this.showToast('Viewing all files', 'info');
        // In a real app, this would navigate to a files page
    }
    
    /**
     * Import from speech-to-text
     */
    importFromSpeech() {
        // Get transcript from speech-to-text
        const transcript = localStorage.getItem('latestTranscript');
        if (transcript) {
            document.getElementById('noteEditor').innerHTML = `<p>${transcript}</p>`;
            this.showToast('Transcript imported from Speech-to-Text', 'success');
        } else {
            this.showToast('No recent transcript found', 'warning');
        }
    }
    
    /**
     * Export all notes
     */
    exportAllNotes() {
        const exportData = {
            notes: this.notes,
            exportedAt: new Date().toISOString(),
            totalNotes: this.notes.length
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `silent-speak-notes-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showToast('All notes exported successfully', 'success');
    }
    
    /**
     * Backup notes to cloud
     */
    backupNotes() {
        this.showToast('Backing up notes to cloud...', 'info');
        
        // Simulate backup
        setTimeout(() => {
            localStorage.setItem('notesBackup', JSON.stringify(this.notes));
            this.showToast('Notes backed up successfully', 'success');
        }, 1500);
    }
    
    /**
     * Delete old notes
     */
    deleteOldNotes() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const oldNotes = this.notes.filter(note => new Date(note.updatedAt) < thirtyDaysAgo);
        
        if (oldNotes.length === 0) {
            this.showToast('No old notes found (older than 30 days)', 'info');
            return;
        }
        
        if (confirm(`Delete ${oldNotes.length} note(s) older than 30 days?`)) {
            this.notes = this.notes.filter(note => new Date(note.updatedAt) >= thirtyDaysAgo);
            this.saveNotes();
            this.renderNotes();
            this.updateStatsDisplay();
            this.showToast(`${oldNotes.length} old note(s) deleted`, 'success');
        }
    }
    
    /**
     * Clear editor
     */
    clearEditor() {
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteEditor').innerHTML = '<p>Start typing your note here...</p><p>You can format text using the toolbar above.</p>';
        document.getElementById('noteTags').value = '';
        this.currentNote = null;
        this.showToast('Editor cleared', 'info');
    }
    
    /**
     * Enhance note with AI
     */
    enhanceWithAI() {
        const content = document.getElementById('noteEditor').innerHTML;
        if (!content || content.includes('Start typing your note here')) {
            this.showToast('Please enter some content first', 'warning');
            return;
        }
        
        this.showToast('Enhancing note with AI...', 'info');
        
        // Simulate AI enhancement
        setTimeout(() => {
            // Simple enhancement: clean up HTML and add formatting
            let enhanced = content
                .replace(/\s+/g, ' ')
                .replace(/<p><\/p>/g, '')
                .trim();
            
            // Add paragraph breaks if missing
            if (!enhanced.includes('<p>')) {
                enhanced = `<p>${enhanced}</p>`;
            }
            
            document.getElementById('noteEditor').innerHTML = enhanced;
            this.showToast('Note enhanced with AI', 'success');
        }, 2000);
    }
    
    /**
     * Clear all data
     */
    clearAllData() {
        if (confirm('Are you sure you want to clear ALL notes and files? This cannot be undone.')) {
            this.notes = [];
            this.files = [];
            this.saveNotes();
            this.saveFiles();
            this.calculateStorage();
            this.renderNotes();
            this.renderRecentFiles();
            this.updateStatsDisplay();
            this.clearEditor();
            this.showToast('All data cleared', 'warning');
        }
    }
    
    /**
     * Format text in editor
     */
    formatText(command) {
        const editor = document.getElementById('noteEditor');
        if (!editor) return;
        
        document.execCommand(command, false, null);
        editor.focus();
    }
    
    /**
     * Utility: Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Utility: Strip HTML tags
     */
    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }
    
    /**
     * Utility: Truncate text
     */
    truncateText(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
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
function saveNote() {
    if (window.notesSystem) {
        window.notesSystem.saveNote();
    }
}

function clearEditor() {
    if (window.notesSystem) {
        window.notesSystem.clearEditor();
    }
}

function enhanceWithAI() {
    if (window.notesSystem) {
        window.notesSystem.enhanceWithAI();
    }
}

function uploadFiles() {
    if (window.notesSystem) {
        window.notesSystem.uploadFiles();
    }
}

function viewAllFiles() {
    if (window.notesSystem) {
        window.notesSystem.viewAllFiles();
    }
}

function importFromSpeech() {
    if (window.notesSystem) {
        window.notesSystem.importFromSpeech();
    }
}

function exportAllNotes() {
    if (window.notesSystem) {
        window.notesSystem.exportAllNotes();
    }
}

function backupNotes() {
    if (window.notesSystem) {
        window.notesSystem.backupNotes();
    }
}

function deleteOldNotes() {
    if (window.notesSystem) {
        window.notesSystem.deleteOldNotes();
    }
}

function clearAllData() {
    if (window.notesSystem) {
        window.notesSystem.clearAllData();
    }
}

function formatText(command) {
    if (window.notesSystem) {
        window.notesSystem.formatText(command);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.notesSystem = new NotesSystem();
    window.notesSystem.init();
});