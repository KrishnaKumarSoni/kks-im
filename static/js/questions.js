// ===== QUESTIONS FUNCTIONALITY =====

class QuestionsManager {
    constructor() {
        this.db = window.firebaseDb;
        this.questionsContainer = document.getElementById('questionsContainer');
        this.questionsLoading = document.getElementById('questionsLoading');
        this.questionsCount = document.getElementById('questionsCount');
        this.sortSelect = document.getElementById('sortSelect');
        
        this.questions = [];
        this.answers = {};
        this.currentSort = 'newest';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadQuestions();
    }

    setupEventListeners() {
        // Sort change
        this.sortSelect.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.sortAndRenderQuestions();
        });
    }

    async loadQuestions() {
        try {
            this.showLoading(true);
            
            // Listen to questions collection
            this.db.collection('questions')
                .onSnapshot((snapshot) => {
                    this.questions = [];
                    snapshot.forEach((doc) => {
                        this.questions.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    
                    // Load answers for all questions
                    this.loadAnswersForQuestions();
                }, (error) => {
                    console.error('Error loading questions:', error);
                    this.showError('Failed to load questions. Please check your connection.');
                });

        } catch (error) {
            console.error('Error setting up questions listener:', error);
            this.showError('Failed to connect to questions. Please refresh the page.');
        }
    }

    async loadAnswersForQuestions() {
        try {
            // Load answers for all questions
            this.db.collection('answers')
                .onSnapshot((snapshot) => {
                    this.answers = {};
                    snapshot.forEach((doc) => {
                        const answer = { id: doc.id, ...doc.data() };
                        const questionId = answer.questionId;
                        
                        if (!this.answers[questionId]) {
                            this.answers[questionId] = [];
                        }
                        this.answers[questionId].push(answer);
                    });
                    
                    // Sort answers by timestamp for each question
                    Object.keys(this.answers).forEach(questionId => {
                        this.answers[questionId].sort((a, b) => {
                            // Put accepted answer first
                            if (a.isAccepted && !b.isAccepted) return -1;
                            if (!a.isAccepted && b.isAccepted) return 1;
                            // Then sort by upvotes, then by timestamp
                            if (a.upvotes !== b.upvotes) return b.upvotes - a.upvotes;
                            return b.timestamp?.seconds - a.timestamp?.seconds;
                        });
                    });
                    
                    this.sortAndRenderQuestions();
                });

        } catch (error) {
            console.error('Error loading answers:', error);
        }
    }

    sortAndRenderQuestions() {
        const sortedQuestions = [...this.questions];

        switch (this.currentSort) {
            case 'newest':
                sortedQuestions.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
                break;
            case 'oldest':
                sortedQuestions.sort((a, b) => a.timestamp?.seconds - b.timestamp?.seconds);
                break;
            case 'upvotes':
                sortedQuestions.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
                break;
            case 'answers':
                sortedQuestions.sort((a, b) => {
                    const aAnswers = this.answers[a.id]?.length || 0;
                    const bAnswers = this.answers[b.id]?.length || 0;
                    return bAnswers - aAnswers;
                });
                break;
            case 'unanswered':
                sortedQuestions.sort((a, b) => {
                    const aAnswers = this.answers[a.id]?.length || 0;
                    const bAnswers = this.answers[b.id]?.length || 0;
                    if (aAnswers === 0 && bAnswers > 0) return -1;
                    if (aAnswers > 0 && bAnswers === 0) return 1;
                    return b.timestamp?.seconds - a.timestamp?.seconds;
                });
                break;
        }

        this.renderQuestions(sortedQuestions);
        this.updateQuestionsCount();
        this.showLoading(false);
    }

    renderQuestions(questions) {
        if (questions.length === 0) {
            this.questionsContainer.innerHTML = `
                <div class="no-questions-message">
                    <div class="no-questions-icon">❓</div>
                    <h3>No Questions Yet</h3>
                    <p>Be the first to ask an engineering question and get expert answers from the community.</p>
                </div>
            `;
            return;
        }

        this.questionsContainer.innerHTML = questions.map(question => 
            this.renderQuestionCard(question)
        ).join('');

        // Setup event listeners for the rendered questions
        this.setupQuestionEventListeners();
    }

    renderQuestionCard(question) {
        const questionAnswers = this.answers[question.id] || [];
        const answerCount = questionAnswers.length;
        const hasAcceptedAnswer = questionAnswers.some(answer => answer.isAccepted);
        const status = hasAcceptedAnswer ? 'answered' : (answerCount > 0 ? 'discussed' : 'unanswered');
        
        const timeAgo = this.formatTimeAgo(question.timestamp);
        const isUpvoted = this.isQuestionUpvoted(question.id);

        return `
            <div class="question-card" data-question-id="${question.id}">
                <div class="question-header">
                    <div class="question-meta">
                        <span class="question-author">${question.author || 'Anonymous'}</span>
                        <span class="question-time">${timeAgo}</span>
                    </div>
                    <div class="question-status">
                        <span class="status-badge ${status}">${status.toUpperCase()}</span>
                        ${question.featured ? '<span class="featured-badge">FEATURED</span>' : ''}
                    </div>
                </div>
                
                <h2 class="question-title">${this.escapeHtml(question.title)}</h2>
                
                <div class="question-content">${this.formatContent(question.content)}</div>
                
                ${question.tags ? `
                    <div class="question-tags">
                        ${question.tags.map(tag => `<span class="question-tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="question-actions">
                    <div class="question-stats">
                        <div class="stat-item">
                            <span class="material-icons">thumb_up</span>
                            <span class="upvote-count">${question.upvotes || 0}</span>
                        </div>
                        <div class="stat-item">
                            <span class="material-icons">forum</span>
                            <span class="answer-count ${answerCount > 0 ? 'has-answers' : ''}">${answerCount}</span>
                        </div>
                    </div>
                    
                    <button class="comment-upvote-btn ${isUpvoted ? 'active' : ''}" data-question-id="${question.id}">
                        <span class="material-icons">thumb_up</span>
                        <span>Upvote</span>
                    </button>
                    
                    <button class="comment-upvote-btn" data-question-id="${question.id}">
                        <span class="material-icons">forum</span>
                        <span>Answers (${answerCount})</span>
                    </button>
                </div>
                
                <div class="answers-section" id="answers-${question.id}" style="display: none;">
                    <div class="answers-header">
                        <h3 class="answers-title">${answerCount} Answer${answerCount !== 1 ? 's' : ''}</h3>
                    </div>
                    
                    <div class="answer-form">
                        <textarea placeholder="Share your expertise and help solve this question..." data-question-id="${question.id}" class="answer-textarea"></textarea>
                        <div class="answer-form-meta">
                            <input type="text" placeholder="Your name (optional)" class="answer-author-input" data-question-id="${question.id}">
                            <button class="submit-answer-btn" data-question-id="${question.id}">Post Answer</button>
                        </div>
                    </div>
                    
                    <div class="answers-list">
                        ${questionAnswers.map(answer => this.renderAnswer(answer)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderAnswer(answer) {
        const timeAgo = this.formatTimeAgo(answer.timestamp);
        const isUpvoted = this.isAnswerUpvoted(answer.id);

        return `
            <div class="answer ${answer.isAccepted ? 'accepted' : ''}" data-answer-id="${answer.id}">
                <div class="answer-header">
                    <div class="answer-meta">
                        <span class="answer-author">${answer.author || 'Anonymous'}</span>
                        <span class="answer-time">${timeAgo}</span>
                    </div>
                    ${answer.isAccepted ? `
                        <div class="accepted-badge">
                            <span class="material-icons">check_circle</span>
                            ACCEPTED
                        </div>
                    ` : ''}
                </div>
                
                <div class="answer-content">${this.formatContent(answer.content)}</div>
                
                <div class="answer-actions">
                    <button class="answer-upvote-btn ${isUpvoted ? 'active' : ''}" data-answer-id="${answer.id}">
                        <span class="material-icons">thumb_up</span>
                        <span>${answer.upvotes || 0}</span>
                    </button>
                </div>
            </div>
        `;
    }

    setupQuestionEventListeners() {
        // Upvote questions
        document.querySelectorAll('.comment-upvote-btn[data-question-id]').forEach(btn => {
            if (btn.querySelector('.material-icons').textContent === 'thumb_up') {
                btn.addEventListener('click', (e) => {
                    const questionId = e.currentTarget.dataset.questionId;
                    this.toggleQuestionUpvote(questionId);
                });
            }
        });

        // Toggle answers
        document.querySelectorAll('.comment-upvote-btn[data-question-id]').forEach(btn => {
            if (btn.querySelector('.material-icons').textContent === 'forum') {
                btn.addEventListener('click', (e) => {
                    const questionId = e.currentTarget.dataset.questionId;
                    this.toggleAnswersSection(questionId);
                });
            }
        });

        // Submit answers
        document.querySelectorAll('.submit-answer-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const questionId = e.currentTarget.dataset.questionId;
                this.submitAnswer(questionId);
            });
        });

        // Upvote answers
        document.querySelectorAll('.answer-upvote-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const answerId = e.currentTarget.dataset.answerId;
                this.toggleAnswerUpvote(answerId);
            });
        });
    }

    async toggleQuestionUpvote(questionId) {
        try {
            const question = this.questions.find(q => q.id === questionId);
            if (!question) return;

            const upvoteKey = `question_upvote_${questionId}`;
            const hasUpvoted = localStorage.getItem(upvoteKey) === 'true';
            
            const newUpvotes = hasUpvoted ? 
                Math.max(0, (question.upvotes || 0) - 1) : 
                (question.upvotes || 0) + 1;

            await this.db.collection('questions').doc(questionId).update({
                upvotes: newUpvotes
            });

            localStorage.setItem(upvoteKey, hasUpvoted ? 'false' : 'true');
            this.showNotification(hasUpvoted ? 'Upvote removed' : 'Question upvoted');

        } catch (error) {
            console.error('Error upvoting question:', error);
            this.showNotification('Failed to upvote question', 'error');
        }
    }

    async toggleAnswerUpvote(answerId) {
        try {
            // Find the answer
            let targetAnswer = null;
            Object.values(this.answers).forEach(answerList => {
                const found = answerList.find(a => a.id === answerId);
                if (found) targetAnswer = found;
            });

            if (!targetAnswer) return;

            const upvoteKey = `answer_upvote_${answerId}`;
            const hasUpvoted = localStorage.getItem(upvoteKey) === 'true';
            
            const newUpvotes = hasUpvoted ? 
                Math.max(0, (targetAnswer.upvotes || 0) - 1) : 
                (targetAnswer.upvotes || 0) + 1;

            await this.db.collection('answers').doc(answerId).update({
                upvotes: newUpvotes
            });

            localStorage.setItem(upvoteKey, hasUpvoted ? 'false' : 'true');
            this.showNotification(hasUpvoted ? 'Upvote removed' : 'Answer upvoted');

        } catch (error) {
            console.error('Error upvoting answer:', error);
            this.showNotification('Failed to upvote answer', 'error');
        }
    }

    toggleAnswersSection(questionId) {
        const answersSection = document.getElementById(`answers-${questionId}`);
        const isVisible = answersSection.style.display !== 'none';
        
        answersSection.style.display = isVisible ? 'none' : 'block';
        
        // Update button text
        const btns = document.querySelectorAll(`[data-question-id="${questionId}"].comment-upvote-btn`);
        const btn = Array.from(btns).find(b => b.querySelector('.material-icons').textContent === 'forum');
        const answerCount = this.answers[questionId]?.length || 0;
        const icon = btn.querySelector('.material-icons');
        const text = btn.querySelector('span:last-child');
        
        if (isVisible) {
            icon.textContent = 'forum';
            text.textContent = `Answers (${answerCount})`;
        } else {
            icon.textContent = 'expand_less';
            text.textContent = 'Hide Answers';
        }
    }

    async submitAnswer(questionId) {
        try {
            const textarea = document.querySelector(`.answer-textarea[data-question-id="${questionId}"]`);
            const authorInput = document.querySelector(`.answer-author-input[data-question-id="${questionId}"]`);
            
            const content = textarea.value.trim();
            const author = authorInput.value.trim() || 'Anonymous';
            
            if (!content) {
                this.showNotification('Please enter your answer', 'error');
                return;
            }

            const answer = {
                questionId: questionId,
                content: content,
                author: author,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                upvotes: 0,
                isAccepted: false
            };

            await this.db.collection('answers').add(answer);

            // Clear form
            textarea.value = '';
            authorInput.value = '';
            
            this.showNotification('Answer posted successfully!');

        } catch (error) {
            console.error('Error submitting answer:', error);
            this.showNotification('Failed to post answer', 'error');
        }
    }

    isQuestionUpvoted(questionId) {
        return localStorage.getItem(`question_upvote_${questionId}`) === 'true';
    }

    isAnswerUpvoted(answerId) {
        return localStorage.getItem(`answer_upvote_${answerId}`) === 'true';
    }

    updateQuestionsCount() {
        this.questionsCount.textContent = this.questions.length;
    }

    showLoading(show) {
        this.questionsLoading.style.display = show ? 'flex' : 'none';
        this.questionsContainer.style.display = show ? 'none' : 'block';
    }

    showError(message) {
        this.questionsContainer.innerHTML = `
            <div class="error-message">
                <span class="material-icons">error</span>
                <span>${message}</span>
            </div>
        `;
        this.showLoading(false);
    }

    formatTimeAgo(timestamp) {
        if (!timestamp || !timestamp.seconds) return 'Just now';
        
        const now = Date.now();
        const time = timestamp.seconds * 1000;
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
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
        if (window.firebaseDb) {
            new QuestionsManager();
        } else {
            setTimeout(checkFirebase, 100);
        }
    };
    checkFirebase();
}); 