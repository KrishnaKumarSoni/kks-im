// ===== CONCEPTS JS =====

// Global state
let concepts = [];
let comments = {};
let currentSort = 'newest';
let userVotes = JSON.parse(localStorage.getItem('conceptVotes') || '{}');
let userCommentVotes = JSON.parse(localStorage.getItem('commentVotes') || '{}');

// DOM elements
const conceptsContainer = document.getElementById('conceptsContainer');
const conceptsLoading = document.getElementById('conceptsLoading');
const conceptsCount = document.getElementById('conceptsCount');
const sortSelect = document.getElementById('sortSelect');

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Concepts page loaded');
    
    // Check Firebase connection
    if (window.firebaseDb) {
        console.log('Firebase connected');
        loadConcepts();
        
        // Set up sorting
        if (sortSelect) {
            sortSelect.addEventListener('change', function() {
                currentSort = this.value;
                sortAndRenderConcepts();
            });
        }
        
        // Set up custom dropdown functionality
        setupCustomDropdown();
    } else {
        console.error('Firebase not connected');
        showError('Firebase connection failed');
    }
});

// Load concepts from Firebase
async function loadConcepts() {
    try {
        console.log('Loading concepts from Firebase...');
        
        // Set timeout for Firebase connection
        const timeoutId = setTimeout(() => {
            console.error('Firebase connection timeout');
            conceptsLoading.style.display = 'none';
            showEmptyState('Connection timeout. Please refresh the page.');
        }, 10000); // 10 second timeout
        
        // Load user votes from localStorage
        userVotes = JSON.parse(localStorage.getItem('conceptVotes') || '{}');
        userCommentVotes = JSON.parse(localStorage.getItem('commentVotes') || '{}');
        
        const conceptsRef = window.firebaseDb.collection('concepts');
        conceptsRef.onSnapshot((snapshot) => {
            clearTimeout(timeoutId); // Clear timeout on successful connection
            
            concepts = [];
            snapshot.forEach((doc) => {
                const conceptData = doc.data();
                concepts.push({
                    id: doc.id,
                    ...conceptData,
                    timestamp: conceptData.timestamp || firebase.firestore.Timestamp.now()
                });
            });
            
            console.log(`Loaded ${concepts.length} concepts`);
            
            // Load comments for all concepts
            loadComments();
            
            // Sort and render
            sortAndRenderConcepts();
            updateConceptsCount();
        }, (error) => {
            clearTimeout(timeoutId);
            console.error('Firebase error:', error);
            conceptsLoading.style.display = 'none';
            
            if (error.code === 'permission-denied') {
                showEmptyState('Permission denied. Please check Firebase security rules.');
            } else {
                showEmptyState('Failed to load concepts. Please try again.');
            }
        });
        
    } catch (error) {
        console.error('Error loading concepts:', error);
        conceptsLoading.style.display = 'none';
        showEmptyState('Failed to load concepts');
    }
}

// Load comments for concepts
async function loadComments() {
    try {
        const commentsRef = window.firebaseDb.collection('comments');
        commentsRef.onSnapshot((snapshot) => {
            comments = {};
            snapshot.forEach((doc) => {
                const commentData = doc.data();
                const conceptId = commentData.conceptId;
                
                if (!comments[conceptId]) {
                    comments[conceptId] = [];
                }
                
                comments[conceptId].push({
                    id: doc.id,
                    ...commentData,
                    timestamp: commentData.timestamp || firebase.firestore.Timestamp.now()
                });
            });
            
            // Sort comments by timestamp (oldest first)
            Object.keys(comments).forEach(conceptId => {
                comments[conceptId].sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
            });
            
            console.log('Comments loaded');
            sortAndRenderConcepts(); // Re-render with comments
        });
        
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

// Sort and render concepts
function sortAndRenderConcepts() {
    if (concepts.length === 0) {
        conceptsLoading.style.display = 'none';
        showEmptyState();
        return;
    }
    
    conceptsLoading.style.display = 'none';
    
    // Sort concepts
    let sortedConcepts = [...concepts];
    
    switch (currentSort) {
        case 'newest':
            sortedConcepts.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
            break;
        case 'oldest':
            sortedConcepts.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
            break;
        case 'upvotes':
            sortedConcepts.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
            break;
        case 'comments':
            sortedConcepts.sort((a, b) => {
                const aCommentCount = comments[a.id]?.length || 0;
                const bCommentCount = comments[b.id]?.length || 0;
                return bCommentCount - aCommentCount;
            });
            break;
    }
    
    // Render concepts
    renderConcepts(sortedConcepts);
}

// Render concepts
function renderConcepts(conceptsList) {
    // Always hide loading spinner when rendering
    conceptsLoading.style.display = 'none';
    
    if (conceptsList.length === 0) {
        showEmptyState();
        return;
    }
    
    conceptsContainer.innerHTML = conceptsList.map(concept => renderConceptCard(concept)).join('');
    
    // Add event listeners
    addConceptEventListeners();
}

// Render individual concept card
function renderConceptCard(concept) {
    const conceptComments = comments[concept.id] || [];
    const upvotes = concept.upvotes || 0;
    const commentCount = conceptComments.length;
    const hasUserVoted = userVotes[concept.id] === true;
    
    // Format timestamp
    const timeAgo = formatTimeAgo(concept.timestamp.toDate());
    
    // Format tags
    const tags = concept.tags ? concept.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    return `
        <div class="concept-card" data-concept-id="${concept.id}">
            <div class="concept-header">
                <div class="concept-meta">
                    <span class="concept-author">${escapeHtml(concept.author)}</span>
                    <span class="concept-time">${timeAgo}</span>
                </div>
            </div>
            
            <h3 class="concept-title">${escapeHtml(concept.title)}</h3>
            
            <div class="concept-content">
                ${formatContent(concept.content)}
            </div>
            
            ${tags.length > 0 ? `
                <div class="concept-tags">
                    ${tags.map(tag => `<span class="concept-tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            
            <div class="concept-actions">
                <div class="concept-stats">
                    <div class="stat-item">
                        <i class="material-icons">thumb_up</i>
                        <span class="upvote-count">${upvotes}</span>
                    </div>
                    <div class="stat-item">
                        <i class="material-icons">comment</i>
                        <span class="comment-count ${commentCount > 0 ? 'has-comments' : ''}">${commentCount}</span>
                    </div>
                </div>
                
                <button class="comment-upvote-btn ${hasUserVoted ? 'active' : ''}" data-action="upvote" data-concept-id="${concept.id}">
                    <i class="material-icons">thumb_up</i>
                    ${hasUserVoted ? 'Upvoted' : 'Upvote'}
                </button>
                
                <button class="comment-upvote-btn" data-action="toggle-comments" data-concept-id="${concept.id}">
                    <i class="material-icons">comment</i>
                    ${commentCount > 0 ? 'View Comments' : 'Add Comment'}
                </button>
            </div>
            
            <div class="comments-section" id="comments-${concept.id}" style="display: none;">
                <div class="comments-header">
                    <h4 class="comments-title">Discussion (${commentCount})</h4>
                </div>
                
                <div class="comment-form">
                    <textarea placeholder="Share your thoughts on this concept..." data-concept-id="${concept.id}"></textarea>
                    <div class="comment-form-meta">
                        <input type="text" placeholder="Your name" data-concept-id="${concept.id}">
                        <button class="submit-comment-btn" data-concept-id="${concept.id}">Post Comment</button>
                    </div>
                </div>
                
                <div class="comments-list">
                    ${conceptComments.map(comment => renderComment(comment)).join('')}
                </div>
            </div>
        </div>
    `;
}

// Render individual comment
function renderComment(comment) {
    const upvotes = comment.upvotes || 0;
    const hasUserVoted = userCommentVotes[comment.id] === true;
    const timeAgo = formatTimeAgo(comment.timestamp.toDate());
    
    return `
        <div class="comment" data-comment-id="${comment.id}">
            <div class="comment-header">
                <div class="comment-meta">
                    <span class="comment-author">${escapeHtml(comment.author)}</span>
                    <span class="comment-time">${timeAgo}</span>
                </div>
            </div>
            
            <div class="comment-content">
                ${formatContent(comment.content)}
            </div>
            
            <div class="comment-actions">
                <button class="comment-upvote-btn ${hasUserVoted ? 'active' : ''}" data-action="upvote-comment" data-comment-id="${comment.id}">
                    <i class="material-icons">thumb_up</i>
                    <span>${upvotes}</span>
                </button>
            </div>
        </div>
    `;
}

// Add event listeners to concept cards
function addConceptEventListeners() {
    // Concept upvote buttons
    document.querySelectorAll('[data-action="upvote"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const conceptId = this.dataset.conceptId;
            upvoteConcept(conceptId);
        });
    });
    
    // Toggle comments buttons
    document.querySelectorAll('[data-action="toggle-comments"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const conceptId = this.dataset.conceptId;
            toggleComments(conceptId);
        });
    });
    
    // Submit comment buttons
    document.querySelectorAll('.submit-comment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const conceptId = this.dataset.conceptId;
            submitComment(conceptId);
        });
    });
    
    // Comment upvote buttons
    document.querySelectorAll('[data-action="upvote-comment"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const commentId = this.dataset.commentId;
            upvoteComment(commentId);
        });
    });
}

// Upvote concept
async function upvoteConcept(conceptId) {
    // Prevent multiple rapid clicks
    const buttons = document.querySelectorAll(`[data-action="upvote"][data-concept-id="${conceptId}"]`);
    if (buttons.length && buttons[0].disabled) return;
    
    try {
        // Disable buttons during processing
        buttons.forEach(btn => btn.disabled = true);
        
        const hasVoted = userVotes[conceptId] === true;
        
        if (hasVoted) {
            // Remove upvote
            await window.firebaseDb.collection('concepts').doc(conceptId).update({
                upvotes: firebase.firestore.FieldValue.increment(-1)
            });
            
            delete userVotes[conceptId];
        } else {
            // Add upvote
            await window.firebaseDb.collection('concepts').doc(conceptId).update({
                upvotes: firebase.firestore.FieldValue.increment(1)
            });
            
            userVotes[conceptId] = true;
        }
        
        // Save to localStorage only after successful Firebase update
        localStorage.setItem('conceptVotes', JSON.stringify(userVotes));
        
        // Update UI to reflect current state
        updateUpvoteUI(conceptId);
        
    } catch (error) {
        console.error('Error upvoting concept:', error);
        showError('Failed to upvote concept');
        
        // Revert state on error
        if (userVotes[conceptId] === true) {
            delete userVotes[conceptId];
        } else {
            userVotes[conceptId] = true;
        }
        updateUpvoteUI(conceptId);
    } finally {
        // Re-enable buttons
        buttons.forEach(btn => btn.disabled = false);
    }
}

// Toggle comments section
function toggleComments(conceptId) {
    const commentsSection = document.getElementById(`comments-${conceptId}`);
    if (commentsSection) {
        commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
    }
}

// Submit comment
async function submitComment(conceptId) {
    try {
        const commentsSection = document.getElementById(`comments-${conceptId}`);
        const textarea = commentsSection.querySelector('textarea');
        const nameInput = commentsSection.querySelector('input[type="text"]');
        
        const content = textarea.value.trim();
        const author = nameInput.value.trim();
        
        if (!content || !author) {
            showError('Please fill in all fields');
            return;
        }
        
        // Add comment to Firebase
        await window.firebaseDb.collection('comments').add({
            conceptId: conceptId,
            content: content,
            author: author,
            upvotes: 0,
            timestamp: firebase.firestore.Timestamp.now()
        });
        
        // Clear form
        textarea.value = '';
        nameInput.value = '';
        
        console.log('Comment submitted successfully');
        
    } catch (error) {
        console.error('Error submitting comment:', error);
        showError('Failed to submit comment');
    }
}

// Upvote comment
async function upvoteComment(commentId) {
    try {
        const hasVoted = userCommentVotes[commentId] === true;
        
        if (hasVoted) {
            // Remove upvote
            await window.firebaseDb.collection('comments').doc(commentId).update({
                upvotes: firebase.firestore.FieldValue.increment(-1)
            });
            
            delete userCommentVotes[commentId];
        } else {
            // Add upvote
            await window.firebaseDb.collection('comments').doc(commentId).update({
                upvotes: firebase.firestore.FieldValue.increment(1)
            });
            
            userCommentVotes[commentId] = true;
        }
        
        // Save to localStorage
        localStorage.setItem('commentVotes', JSON.stringify(userCommentVotes));
        
    } catch (error) {
        console.error('Error upvoting comment:', error);
        showError('Failed to upvote comment');
    }
}

// Update upvote UI
function updateUpvoteUI(conceptId) {
    const buttons = document.querySelectorAll(`[data-action="upvote"][data-concept-id="${conceptId}"]`);
    const hasVoted = userVotes[conceptId] === true;
    
    buttons.forEach(btn => {
        btn.classList.toggle('active', hasVoted);
        btn.innerHTML = `<i class="material-icons">thumb_up</i>${hasVoted ? 'Upvoted' : 'Upvote'}`;
        
        // Update the upvote count in the stats section
        const conceptCard = btn.closest('.concept-card');
        if (conceptCard) {
            const upvoteCountSpan = conceptCard.querySelector('.upvote-count');
            if (upvoteCountSpan) {
                const concept = concepts.find(c => c.id === conceptId);
                if (concept) {
                    upvoteCountSpan.textContent = concept.upvotes || 0;
                }
            }
        }
    });
}

// Update concepts count
function updateConceptsCount() {
    if (conceptsCount) {
        conceptsCount.textContent = concepts.length;
    }
}

// Utility functions
function formatTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
}

function formatContent(content) {
    if (!content) return '';
    
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    console.error(message);
    // You could add a toast notification here
}

// Setup custom dropdown functionality
function setupCustomDropdown() {
    const selectDisplay = document.getElementById('selectDisplay');
    const selectOptions = document.getElementById('selectOptions');
    const sortSelect = document.getElementById('sortSelect');
    const selectText = selectDisplay?.querySelector('.select-text');

    if (!selectDisplay || !selectOptions || !sortSelect || !selectText) {
        console.log('Custom dropdown elements not found');
        return;
    }

    // Toggle dropdown
    selectDisplay.addEventListener('click', (e) => {
        e.stopPropagation();
        selectDisplay.classList.toggle('active');
        selectOptions.classList.toggle('show');
    });

    // Handle option selection
    selectOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('select-option')) {
            // Remove previous selection
            document.querySelectorAll('.select-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selection to clicked option
            e.target.classList.add('selected');
            
            // Update display text
            selectText.textContent = e.target.textContent;
            
            // Update hidden select value
            sortSelect.value = e.target.dataset.value;
            
            // Trigger change event on hidden select for compatibility
            sortSelect.dispatchEvent(new Event('change'));
            
            // Close dropdown
            selectDisplay.classList.remove('active');
            selectOptions.classList.remove('show');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!selectDisplay.contains(e.target) && !selectOptions.contains(e.target)) {
            selectDisplay.classList.remove('active');
            selectOptions.classList.remove('show');
        }
    });

    // Close dropdown on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            selectDisplay.classList.remove('active');
            selectOptions.classList.remove('show');
        }
    });
}

// Show empty state
function showEmptyState(message = null) {
    const defaultMessage = message || 'No engineering concepts yet. Be the first to share your insights!';
    
    conceptsContainer.innerHTML = `
        <div class="no-concepts-message">
            <div class="no-concepts-icon">💡</div>
            <h3>No Concepts Yet</h3>
            <p>${defaultMessage}</p>
            ${!message ? '<a href="/concepts/share" class="btn-primary" style="margin-top: 1rem; display: inline-block; padding: 12px 24px; text-decoration: none;">Share First Concept</a>' : ''}
        </div>
    `;
} 