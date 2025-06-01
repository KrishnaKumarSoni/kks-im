// Submit Idea JavaScript
let isSubmitting = false;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Submit Idea page loaded');
    
    // Initialize form elements
    const ideaForm = document.getElementById('ideaForm');
    const ideaTitle = document.getElementById('ideaTitle');
    const ideaDescription = document.getElementById('ideaDescription');
    const previewBtn = document.getElementById('previewBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    // Character counting
    setupCharacterCounting();
    
    // Form validation
    setupFormValidation();
    
    // Preview functionality
    if (previewBtn) {
        previewBtn.addEventListener('click', showPreview);
    }
    
    // Form submission
    if (ideaForm) {
        ideaForm.addEventListener('submit', handleSubmit);
    }
    
    // Modal functionality
    setupModals();
});

// Setup character counting
function setupCharacterCounting() {
    const ideaTitle = document.getElementById('ideaTitle');
    const ideaDescription = document.getElementById('ideaDescription');
    const titleCharCount = document.getElementById('titleCharCount');
    const descriptionCharCount = document.getElementById('descriptionCharCount');
    
    if (ideaTitle && titleCharCount) {
        ideaTitle.addEventListener('input', function() {
            const count = this.value.length;
            titleCharCount.textContent = `${count}/100`;
            titleCharCount.style.color = count > 90 ? '#f44336' : '';
        });
    }
    
    if (ideaDescription && descriptionCharCount) {
        ideaDescription.addEventListener('input', function() {
            const count = this.value.length;
            descriptionCharCount.textContent = `${count}/2000`;
            descriptionCharCount.style.color = count > 1900 ? '#f44336' : '';
        });
    }
}

// Setup form validation
function setupFormValidation() {
    const form = document.getElementById('ideaForm');
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

// Validate individual field
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    // Remove existing error styling
    field.classList.remove('error');
    
    // Check if field is required and empty
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Specific validation
    if (field.id === 'ideaTitle' && value.length > 100) {
        showFieldError(field, 'Title must be 100 characters or less');
        return false;
    }
    
    if (field.id === 'ideaDescription' && value.length > 2000) {
        showFieldError(field, 'Description must be 2000 characters or less');
        return false;
    }
    
    return true;
}

// Show field error
function showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.color = '#f44336';
    errorDiv.style.fontSize = '0.8rem';
    errorDiv.style.marginTop = '0.25rem';
    
    field.parentNode.appendChild(errorDiv);
}

// Clear field error
function clearFieldError(event) {
    const field = event.target;
    field.classList.remove('error');
    
    const errorMessage = field.parentNode.querySelector('.field-error');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// Show preview
function showPreview() {
    const title = document.getElementById('ideaTitle').value.trim();
    const description = document.getElementById('ideaDescription').value.trim();
    const author = document.getElementById('ideaAuthor').value.trim();
    const category = document.getElementById('ideaCategory').value;
    const tags = document.getElementById('ideaTags').value.trim();
    const featured = document.getElementById('ideaFeatured').checked;
    
    if (!title || !description || !author) {
        alert('Please fill in all required fields before previewing.');
        return;
    }
    
    const previewContent = document.getElementById('previewContent');
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    previewContent.innerHTML = `
        <div class="idea-card ${featured ? 'featured' : ''}" style="max-width: none; margin: 0;">
            <div class="idea-header">
                <h3 class="idea-title">${escapeHtml(title)}</h3>
                <span class="idea-category">${escapeHtml(category)}</span>
            </div>
            
            <div class="idea-description">${formatText(description)}</div>
            
            <div class="idea-meta">
                <span class="idea-author">by ${escapeHtml(author)}</span>
                <span class="idea-timestamp">Just now</span>
            </div>
            
            ${tagsArray.length > 0 ? `
                <div class="idea-tags">
                    ${tagsArray.map(tag => `<span class="idea-tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            
            <div class="idea-stats">
                <div class="stat-item">
                    <i class="material-icons">trending_up</i>
                    <span>0 invested</span>
                </div>
                <div class="stat-item">
                    <i class="material-icons">visibility</i>
                    <span>0 views</span>
                </div>
            </div>
            
            <div class="idea-actions">
                <button class="action-btn invest" disabled>
                    <i class="material-icons">trending_up</i>
                    <span class="action-count">0</span>
                    <span class="action-label">Invest</span>
                </button>
                
                <button class="action-btn follow" disabled>
                    <i class="material-icons">group_add</i>
                    <span class="action-count">0</span>
                    <span class="action-label">Tag Along</span>
                </button>
                
                <button class="action-btn steal" disabled>
                    <i class="material-icons">content_copy</i>
                    <span class="action-count">0</span>
                    <span class="action-label">Steal</span>
                </button>
                
                <button class="action-btn survey" disabled>
                    <i class="material-icons">poll</i>
                    <span class="action-count">0</span>
                    <span class="action-label">Survey</span>
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('previewModal').style.display = 'block';
}

// Handle form submission
async function handleSubmit(event) {
    event.preventDefault();
    
    if (isSubmitting) return;
    
    // Validate all fields
    const form = event.target;
    const requiredFields = form.querySelectorAll('input[required], textarea[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField({ target: field })) {
            isValid = false;
        }
    });
    
    if (!isValid) {
        alert('Please fix the errors before submitting.');
        return;
    }
    
    // Check Firebase connection
    if (!window.firebaseDb) {
        alert('Firebase connection not available. Please refresh the page and try again.');
        return;
    }
    
    isSubmitting = true;
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="material-icons">hourglass_empty</i> Launching...';
    submitBtn.disabled = true;
    
    try {
        // Collect form data
        const ideaData = {
            title: document.getElementById('ideaTitle').value.trim(),
            description: document.getElementById('ideaDescription').value.trim(),
            author: document.getElementById('ideaAuthor').value.trim(),
            category: document.getElementById('ideaCategory').value,
            tags: document.getElementById('ideaTags').value.trim(),
            featured: document.getElementById('ideaFeatured').checked,
            timestamp: firebase.firestore.Timestamp.now(),
            investors: 0,
            followers: 0,
            steals: 0,
            surveys: 0,
            views: 0
        };
        
        // Submit to Firebase
        await window.firebaseDb.collection('ideas').add(ideaData);
        
        console.log('Idea submitted successfully');
        showSuccessModal();
        resetForm();
        
    } catch (error) {
        console.error('Error submitting idea:', error);
        alert('Failed to submit idea. Please try again.');
    } finally {
        isSubmitting = false;
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Setup modals
function setupModals() {
    const previewModal = document.getElementById('previewModal');
    const successModal = document.getElementById('successModal');
    const closePreview = document.getElementById('closePreview');
    const submitAnother = document.getElementById('submitAnother');
    
    // Close preview modal
    if (closePreview) {
        closePreview.addEventListener('click', () => {
            previewModal.style.display = 'none';
        });
    }
    
    // Submit another idea
    if (submitAnother) {
        submitAnother.addEventListener('click', () => {
            successModal.style.display = 'none';
            resetForm();
        });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === previewModal) {
            previewModal.style.display = 'none';
        }
        if (event.target === successModal) {
            successModal.style.display = 'none';
        }
    });
}

// Show success modal
function showSuccessModal() {
    document.getElementById('successModal').style.display = 'block';
}

// Reset form
function resetForm() {
    const form = document.getElementById('ideaForm');
    form.reset();
    
    // Reset character counts
    document.getElementById('titleCharCount').textContent = '0/100';
    document.getElementById('descriptionCharCount').textContent = '0/2000';
    
    // Clear any error styling
    const errorFields = form.querySelectorAll('.error');
    errorFields.forEach(field => field.classList.remove('error'));
    
    const errorMessages = form.querySelectorAll('.field-error');
    errorMessages.forEach(msg => msg.remove());
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatText(text) {
    if (!text) return '';
    
    return escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
} 