// ===== SHARE CONCEPT JS =====

// DOM elements
const conceptForm = document.getElementById('conceptForm');
const conceptTitle = document.getElementById('conceptTitle');
const conceptContent = document.getElementById('conceptContent');
const conceptAuthor = document.getElementById('conceptAuthor');
const conceptTags = document.getElementById('conceptTags');
const conceptFeatured = document.getElementById('conceptFeatured');
const titleCharCount = document.getElementById('titleCharCount');
const contentCharCount = document.getElementById('contentCharCount');
const previewBtn = document.getElementById('previewBtn');
const submitBtn = document.getElementById('submitBtn');
const previewModal = document.getElementById('previewModal');
const successModal = document.getElementById('successModal');
const closePreview = document.getElementById('closePreview');
const shareAnother = document.getElementById('shareAnother');
const previewContent = document.getElementById('previewContent');

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Share concept page loaded');
    
    // Set up character counting
    setupCharacterCounting();
    
    // Set up form submission
    setupFormSubmission();
    
    // Set up preview functionality
    setupPreviewFunctionality();
    
    // Set up modal functionality
    setupModalFunctionality();
});

// Character counting functionality
function setupCharacterCounting() {
    // Title character count
    conceptTitle.addEventListener('input', function() {
        const count = this.value.length;
        titleCharCount.textContent = `${count}/200`;
        
        if (count > 180) {
            titleCharCount.style.color = '#F44336';
        } else if (count > 150) {
            titleCharCount.style.color = '#FF8C42';
        } else {
            titleCharCount.style.color = '';
        }
    });
    
    // Content character count
    conceptContent.addEventListener('input', function() {
        const count = this.value.length;
        contentCharCount.textContent = `${count}/5000`;
        
        if (count > 4500) {
            contentCharCount.style.color = '#F44336';
        } else if (count > 4000) {
            contentCharCount.style.color = '#FF8C42';
        } else {
            contentCharCount.style.color = '';
        }
    });
}

// Form submission functionality
function setupFormSubmission() {
    conceptForm.addEventListener('submit', function(e) {
        e.preventDefault();
        submitConcept();
    });
}

// Preview functionality
function setupPreviewFunctionality() {
    previewBtn.addEventListener('click', function() {
        showPreview();
    });
}

// Modal functionality
function setupModalFunctionality() {
    // Close preview modal
    closePreview.addEventListener('click', function() {
        previewModal.style.display = 'none';
    });
    
    // Share another concept
    shareAnother.addEventListener('click', function() {
        successModal.style.display = 'none';
        resetForm();
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === previewModal) {
            previewModal.style.display = 'none';
        }
        if (e.target === successModal) {
            successModal.style.display = 'none';
        }
    });
    
    // Close modals on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            previewModal.style.display = 'none';
            successModal.style.display = 'none';
        }
    });
}

// Show preview modal
function showPreview() {
    const title = conceptTitle.value.trim();
    const content = conceptContent.value.trim();
    const author = conceptAuthor.value.trim();
    const tags = conceptTags.value.trim();
    const featured = conceptFeatured.checked;
    
    if (!title || !content || !author) {
        showError('Please fill in all required fields before previewing');
        return;
    }
    
    // Format tags
    const tagsList = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    // Generate preview HTML
    const previewHtml = `
        <div class="concept-card">
            <div class="concept-header">
                <div class="concept-meta">
                    <span class="concept-author">${escapeHtml(author)}</span>
                    <span class="concept-time">Just now</span>
                </div>
                ${featured ? '<div class="featured-badge">Featured</div>' : ''}
            </div>
            
            <h3 class="concept-title">${escapeHtml(title)}</h3>
            
            <div class="concept-content">
                ${formatContent(content)}
            </div>
            
            ${tagsList.length > 0 ? `
                <div class="concept-tags">
                    ${tagsList.map(tag => `<span class="concept-tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            
            <div class="concept-actions">
                <div class="concept-stats">
                    <div class="stat-item">
                        <i class="material-icons">thumb_up</i>
                        <span class="upvote-count">0</span>
                    </div>
                    <div class="stat-item">
                        <i class="material-icons">comment</i>
                        <span class="comment-count">0</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    previewContent.innerHTML = previewHtml;
    previewModal.style.display = 'flex';
}

// Submit concept to Firebase
async function submitConcept() {
    try {
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="material-icons">hourglass_empty</i> Sharing...';
        
        // Get form values
        const title = conceptTitle.value.trim();
        const content = conceptContent.value.trim();
        const author = conceptAuthor.value.trim();
        const tags = conceptTags.value.trim();
        const featured = conceptFeatured.checked;
        
        // Validate required fields
        if (!title || !content || !author) {
            showError('Please fill in all required fields');
            return;
        }
        
        // Validate field lengths
        if (title.length > 200) {
            showError('Title must be 200 characters or less');
            return;
        }
        
        if (content.length > 5000) {
            showError('Content must be 5000 characters or less');
            return;
        }
        
        // Check Firebase connection
        if (!window.firebaseDb) {
            showError('Firebase connection not available');
            return;
        }
        
        // Prepare concept data
        const conceptData = {
            title: title,
            content: content,
            author: author,
            tags: tags,
            featured: featured,
            upvotes: 0,
            timestamp: firebase.firestore.Timestamp.now()
        };
        
        // Submit to Firebase
        console.log('Submitting concept to Firebase:', conceptData);
        
        const docRef = await window.firebaseDb.collection('concepts').add(conceptData);
        
        console.log('Concept submitted successfully with ID:', docRef.id);
        
        // Show success modal
        successModal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error submitting concept:', error);
        showError('Failed to submit concept. Please try again.');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="material-icons">share</i> Share Concept';
    }
}

// Reset form
function resetForm() {
    conceptForm.reset();
    titleCharCount.textContent = '0/200';
    contentCharCount.textContent = '0/5000';
    titleCharCount.style.color = '';
    contentCharCount.style.color = '';
}

// Utility functions
function formatContent(content) {
    if (!content) return '';
    
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    console.error(message);
    alert(message); // Simple alert for now - could be improved with toast notifications
} 