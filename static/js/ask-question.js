// ===== ASK QUESTION FUNCTIONALITY =====

class QuestionPoster {
    constructor() {
        this.db = firebase.firestore();
        this.questionForm = document.getElementById('questionForm');
        this.previewModal = document.getElementById('previewModal');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCharacterCounters();
    }

    setupEventListeners() {
        // Form submission
        this.questionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitQuestion();
        });

        // Preview functionality
        document.getElementById('previewBtn').addEventListener('click', () => {
            this.showPreview();
        });

        document.getElementById('closePreview').addEventListener('click', () => {
            this.hidePreview();
        });

        document.getElementById('editQuestion').addEventListener('click', () => {
            this.hidePreview();
        });

        document.getElementById('submitFromPreview').addEventListener('click', () => {
            this.submitQuestion();
        });

        // Back button
        document.getElementById('backBtn').addEventListener('click', () => {
            window.location.href = '/questions';
        });

        // Modal close on background click
        this.previewModal.addEventListener('click', (e) => {
            if (e.target === this.previewModal) {
                this.hidePreview();
            }
        });

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.previewModal.style.display === 'block') {
                this.hidePreview();
            }
        });
    }

    setupCharacterCounters() {
        const titleInput = document.getElementById('questionTitle');
        const contentTextarea = document.getElementById('questionContent');
        const titleCount = document.getElementById('titleCount');
        const contentCount = document.getElementById('contentCount');

        titleInput.addEventListener('input', () => {
            const count = titleInput.value.length;
            titleCount.textContent = count;
            titleCount.parentElement.style.color = count > 180 ? '#FF8C42' : '';
        });

        contentTextarea.addEventListener('input', () => {
            const count = contentTextarea.value.length;
            contentCount.textContent = count;
            contentCount.parentElement.style.color = count > 4500 ? '#FF8C42' : '';
        });
    }

    async submitQuestion() {
        try {
            const formData = new FormData(this.questionForm);
            const title = formData.get('title').trim();
            const content = formData.get('content').trim();
            const author = formData.get('author').trim() || 'Anonymous';
            const tagsInput = formData.get('tags').trim();
            const featured = document.getElementById('featuredQuestion').checked;

            // Validation
            if (!title || !content) {
                this.showNotification('Please fill in all required fields', 'error');
                return;
            }

            if (title.length > 200) {
                this.showNotification('Title must be 200 characters or less', 'error');
                return;
            }

            if (content.length > 5000) {
                this.showNotification('Content must be 5000 characters or less', 'error');
                return;
            }

            // Process tags
            const tags = tagsInput ? 
                tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : 
                [];

            // Create question object
            const question = {
                title: title,
                content: content,
                author: author,
                tags: tags,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                upvotes: 0,
                featured: featured,
                status: 'active'
            };

            // Show loading
            this.setSubmitButtonLoading(true);

            // Submit to Firebase
            await this.db.collection('questions').add(question);

            this.showNotification('Question posted successfully!');
            
            // Reset form
            this.questionForm.reset();
            document.getElementById('titleCount').textContent = '0';
            document.getElementById('contentCount').textContent = '0';
            
            // Hide preview if open
            this.hidePreview();
            
            // Redirect after short delay
            setTimeout(() => {
                window.location.href = '/questions';
            }, 2000);

        } catch (error) {
            console.error('Error submitting question:', error);
            this.showNotification('Failed to post question. Please try again.', 'error');
        } finally {
            this.setSubmitButtonLoading(false);
        }
    }

    showPreview() {
        const title = document.getElementById('questionTitle').value.trim();
        const content = document.getElementById('questionContent').value.trim();
        const author = document.getElementById('questionAuthor').value.trim() || 'Anonymous';
        const tagsInput = document.getElementById('questionTags').value.trim();
        const featured = document.getElementById('featuredQuestion').checked;

        if (!title || !content) {
            this.showNotification('Please fill in title and content before previewing', 'error');
            return;
        }

        const tags = tagsInput ? 
            tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : 
            [];

        const previewContent = document.getElementById('previewContent');
        previewContent.innerHTML = this.renderQuestionPreview({
            title,
            content,
            author,
            tags,
            featured,
            timestamp: new Date()
        });

        this.previewModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hidePreview() {
        this.previewModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    renderQuestionPreview(question) {
        return `
            <div class="question-card preview">
                <div class="question-header">
                    <div class="question-meta">
                        <span class="question-author">${this.escapeHtml(question.author)}</span>
                        <span class="question-time">Just now</span>
                    </div>
                    <div class="question-status">
                        <span class="status-badge unanswered">UNANSWERED</span>
                        ${question.featured ? '<span class="featured-badge">FEATURED</span>' : ''}
                    </div>
                </div>
                
                <h2 class="question-title">${this.escapeHtml(question.title)}</h2>
                
                <div class="question-content">${this.formatContent(question.content)}</div>
                
                ${question.tags.length > 0 ? `
                    <div class="question-tags">
                        ${question.tags.map(tag => `<span class="question-tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="question-actions">
                    <div class="question-stats">
                        <div class="stat-item">
                            <span class="material-icons">thumb_up</span>
                            <span class="upvote-count">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="material-icons">forum</span>
                            <span class="answer-count">0</span>
                        </div>
                    </div>
                    
                    <button class="action-btn" disabled>
                        <span class="material-icons">thumb_up</span>
                        <span>Upvote</span>
                    </button>
                    
                    <button class="action-btn" disabled>
                        <span class="material-icons">forum</span>
                        <span>Answers (0)</span>
                    </button>
                </div>
            </div>
        `;
    }

    setSubmitButtonLoading(loading) {
        const submitBtn = document.getElementById('submitBtn');
        const submitFromPreviewBtn = document.getElementById('submitFromPreview');
        
        if (loading) {
            submitBtn.disabled = true;
            submitFromPreviewBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-icons">hourglass_empty</span><span>Posting...</span>';
            submitFromPreviewBtn.innerHTML = 'Posting...';
        } else {
            submitBtn.disabled = false;
            submitFromPreviewBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-icons">send</span><span>Ask Question</span>';
            submitFromPreviewBtn.innerHTML = 'Ask Question';
        }
    }

    formatContent(content) {
        if (!content) return '';
        
        // Basic markdown-like formatting
        return content
            .replace(/\n/g, '<br>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to be ready
    const checkFirebase = () => {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            new QuestionPoster();
        } else {
            setTimeout(checkFirebase, 100);
        }
    };
    checkFirebase();
}); 