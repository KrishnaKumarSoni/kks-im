// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBlDkY_E1p6IyjgUPxZkxbs11YS61PaohE",
    authDomain: "krishnakumarsonidotcom.firebaseapp.com",
    projectId: "krishnakumarsonidotcom",
    storageBucket: "krishnakumarsonidotcom.firebasestorage.app",
    messagingSenderId: "533366455528",
    appId: "1:533366455528:web:39bf60d4f59ec1ddef1d5d",
    measurementId: "G-SH0LXV42TB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global variables
let skills = [];
let existingProfiles = [];
let currentEditId = null;

// DOM Elements
const profileForm = document.getElementById('profile-form');
const skillsInput = document.getElementById('skills-input');
const skillsContainer = document.getElementById('skills-container');
const profileImageUrlInput = document.getElementById('profile-image-url');
const imagePreview = document.getElementById('image-preview');
const previewImg = document.getElementById('preview-img');
const previewError = document.getElementById('preview-error');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const successMessage = document.getElementById('success-message');
const addAnotherBtn = document.getElementById('add-another');

// Existing profiles elements
const existingProfilesGrid = document.getElementById('existing-profiles-grid');
const existingLoading = document.getElementById('existing-loading');
const existingNoProfiles = document.getElementById('existing-no-profiles');
const totalProfilesSpan = document.getElementById('total-profiles');

// Edit modal elements
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const closeModalBtn = document.getElementById('close-modal');
const cancelEditBtn = document.getElementById('cancel-edit');
const deleteProfileBtn = document.getElementById('delete-profile');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadExistingProfiles();
});

// Setup event listeners
function setupEventListeners() {
    profileForm.addEventListener('submit', handleSubmit);
    skillsInput.addEventListener('keypress', handleSkillInput);
    profileImageUrlInput.addEventListener('input', handleImageUrlChange);
    cancelBtn.addEventListener('click', handleCancel);
    addAnotherBtn.addEventListener('click', resetForm);
    
    // Edit modal listeners
    closeModalBtn.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);
    editForm.addEventListener('submit', handleEditSubmit);
    deleteProfileBtn.addEventListener('click', handleDeleteProfile);
    
    // Close modal on outside click
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });
}

// Handle image URL change with preview
function handleImageUrlChange() {
    const url = profileImageUrlInput.value.trim();
    
    // Hide both preview and error initially
    imagePreview.style.display = 'none';
    previewError.style.display = 'none';
    
    if (!url) return;
    
    // Validate URL format
    if (!isValidURL(url)) {
        showImageError();
        return;
    }
    
    // Test if image loads
    const img = new Image();
    img.onload = function() {
        previewImg.src = url;
        imagePreview.style.display = 'flex';
        previewError.style.display = 'none';
    };
    img.onerror = function() {
        showImageError();
    };
    img.src = url;
}

// Show image error
function showImageError() {
    imagePreview.style.display = 'none';
    previewError.style.display = 'flex';
}

// Handle skill input
function handleSkillInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const skill = skillsInput.value.trim();
        
        if (skill && !skills.includes(skill)) {
            skills.push(skill);
            renderSkills();
            skillsInput.value = '';
        }
    }
}

// Render skills tags
function renderSkills() {
    skillsContainer.innerHTML = skills.map((skill, index) => `
        <div class="skill-tag">
            <span>${skill}</span>
            <button type="button" onclick="removeSkill(${index})" class="remove-skill">
                <span class="material-icons">close</span>
            </button>
        </div>
    `).join('');
}

// Remove skill
function removeSkill(index) {
    skills.splice(index, 1);
    renderSkills();
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
        setLoading(true);
        
        // Create profile data
        const profileData = {
            name: document.getElementById('name').value.trim(),
            title: document.getElementById('title').value.trim(),
            superpower: document.getElementById('superpower').value.trim(),
            location: document.getElementById('location').value.trim(),
            skills: skills,
            availability: document.getElementById('availability').value,
            linkedin: document.getElementById('linkedin').value.trim(),
            github: document.getElementById('github').value.trim(),
            portfolio: document.getElementById('portfolio').value.trim(),
            email: document.getElementById('email').value.trim(),
            image_url: profileImageUrlInput.value.trim() || null,
            featured: document.getElementById('featured').checked,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        };
        
        // Save to Firebase
        await db.collection('hire_them').add(profileData);
        
        showSuccess();
        loadExistingProfiles(); // Refresh existing profiles list
        
    } catch (error) {
        console.error('Error adding profile:', error);
        showError('Failed to add profile. Please try again.');
    } finally {
        setLoading(false);
    }
}

// Validate form
function validateForm() {
    const required = ['name', 'title', 'superpower', 'availability'];
    let isValid = true;
    
    required.forEach(field => {
        const input = document.getElementById(field);
        if (!input.value.trim()) {
            showFieldError(input, 'This field is required');
            isValid = false;
        } else {
            clearFieldError(input);
        }
    });
    
    // Validate email format if provided
    const emailInput = document.getElementById('email');
    if (emailInput.value && !isValidEmail(emailInput.value)) {
        showFieldError(emailInput, 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate URL formats if provided
    const urlFields = ['linkedin', 'github', 'portfolio'];
    urlFields.forEach(field => {
        const input = document.getElementById(field);
        if (input.value && !isValidURL(input.value)) {
            showFieldError(input, 'Please enter a valid URL');
            isValid = false;
        }
    });
    
    // Validate image URL if provided
    if (profileImageUrlInput.value && !isValidURL(profileImageUrlInput.value)) {
        showFieldError(profileImageUrlInput, 'Please enter a valid image URL');
        isValid = false;
    }
    
    return isValid;
}

// Show field error
function showFieldError(input, message) {
    clearFieldError(input);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    input.parentNode.appendChild(errorDiv);
    input.classList.add('error');
}

// Clear field error
function clearFieldError(input) {
    const existingError = input.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    input.classList.remove('error');
}

// Validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate URL
function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Set loading state
function setLoading(loading) {
    submitBtn.disabled = loading;
    
    if (loading) {
        submitBtn.innerHTML = `
            <div class="spinner"></div>
            Adding Profile...
        `;
    } else {
        submitBtn.innerHTML = `
            <span class="material-icons">person_add</span>
            Add Profile
        `;
    }
}

// Show success message
function showSuccess() {
    profileForm.style.display = 'none';
    successMessage.style.display = 'block';
}

// Show error message
function showError(message) {
    // Create better error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.innerHTML = `
        <div class="error-content">
            <span class="material-icons">error</span>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="close-error">×</button>
        </div>
    `;
    
    // Add styles for error toast
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--aqi-unhealthy);
        color: white;
        padding: 16px;
        border-radius: 4px;
        z-index: 1000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    errorDiv.querySelector('.error-content').style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    
    errorDiv.querySelector('.close-error').style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        margin-left: auto;
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

// Handle cancel button
function handleCancel() {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
        window.location.href = '/hire-them';
    }
}

// Reset form for adding another profile
function resetForm() {
    profileForm.reset();
    skills = [];
    renderSkills();
    
    // Reset image preview
    imagePreview.style.display = 'none';
    previewError.style.display = 'none';
    
    // Clear any field errors
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    document.querySelectorAll('.error').forEach(input => input.classList.remove('error'));
    
    // Show form and hide success message
    profileForm.style.display = 'block';
    successMessage.style.display = 'none';
    
    // Focus first input
    document.getElementById('name').focus();
}

// Load existing profiles
async function loadExistingProfiles() {
    try {
        existingLoading.style.display = 'flex';
        existingNoProfiles.style.display = 'none';
        existingProfilesGrid.style.display = 'none';
        
        const snapshot = await db.collection('hire_them')
            .where('availability', '==', 'available')
            .get();
        
        existingProfiles = [];
        snapshot.forEach(doc => {
            existingProfiles.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Sort by timestamp (most recent first) in JavaScript since we can't use orderBy with where
        existingProfiles.sort((a, b) => {
            const aTime = a.timestamp?.toDate() || new Date(0);
            const bTime = b.timestamp?.toDate() || new Date(0);
            return bTime - aTime;
        });
        
        if (existingProfiles.length === 0) {
            existingNoProfiles.style.display = 'block';
        } else {
            displayExistingProfiles();
        }
        
        totalProfilesSpan.textContent = existingProfiles.length;
        
    } catch (error) {
        console.error('Error loading existing profiles:', error);
        showError('Failed to load existing profiles. Please try again.');
    } finally {
        existingLoading.style.display = 'none';
    }
}

// Display existing profiles
function displayExistingProfiles() {
    existingProfilesGrid.innerHTML = existingProfiles.map(profile => createExistingProfileCard(profile)).join('');
    existingProfilesGrid.style.display = 'grid';
    
    // Add event listeners for edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const profileId = e.target.closest('.existing-profile-card').dataset.id;
            handleEditProfile(profileId);
        });
    });
}

// Create existing profile card HTML
function createExistingProfileCard(profile) {
    const skillsHtml = (profile.skills || []).slice(0, 4).map(skill => 
        `<span class="existing-skill-tag">${skill}</span>`
    ).join('');
    
    // Build social links
    const socialLinks = [];
    if (profile.linkedin) {
        socialLinks.push(`<a href="${profile.linkedin}" target="_blank" class="existing-social-link linkedin" title="LinkedIn"></a>`);
    }
    if (profile.github) {
        socialLinks.push(`<a href="${profile.github}" target="_blank" class="existing-social-link github" title="GitHub"></a>`);
    }
    if (profile.portfolio) {
        socialLinks.push(`<a href="${profile.portfolio}" target="_blank" class="existing-social-link portfolio" title="Portfolio"></a>`);
    }
    if (profile.email) {
        socialLinks.push(`<a href="mailto:${profile.email}" class="existing-social-link email" title="Email"></a>`);
    }
    
    return `
        <div class="existing-profile-card-wrapper">
            <div class="existing-profile-card" data-id="${profile.id}">
                <div class="existing-profile-header">
                    ${profile.image_url ? 
                        `<img src="${profile.image_url}" alt="${profile.name}" class="existing-profile-image">` :
                        `<div class="existing-profile-image" style="background: var(--md-sys-color-primary); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-family: 'Orbitron', monospace;">${getInitials(profile.name)}</div>`
                    }
                    <div class="existing-profile-info">
                        <h4>${profile.name}</h4>
                        <p>${profile.title}</p>
                    </div>
                </div>
                
                <div class="existing-profile-content">
                    <div class="existing-profile-superpower">"${profile.superpower}"</div>
                    
                    ${profile.skills && profile.skills.length > 0 ? `
                        <div class="existing-profile-skills">
                            ${skillsHtml}
                            ${profile.skills.length > 4 ? `<span class="existing-skill-tag">+${profile.skills.length - 4}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
                
                <div class="existing-profile-actions">
                    ${socialLinks.length > 0 ? `
                        <div class="existing-social-links">
                            ${socialLinks.join('')}
                        </div>
                    ` : '<div></div>'}
                    
                    <button class="btn-edit" data-id="${profile.id}">
                        <span class="material-icons">edit</span>
                        Edit
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Handle edit profile
function handleEditProfile(id) {
    currentEditId = id;
    const profile = existingProfiles.find(p => p.id === id);
    
    if (profile) {
        document.getElementById('edit-profile-id').value = id;
        document.getElementById('edit-name').value = profile.name || '';
        document.getElementById('edit-title').value = profile.title || '';
        document.getElementById('edit-superpower').value = profile.superpower || '';
        document.getElementById('edit-location').value = profile.location || '';
        document.getElementById('edit-availability').value = profile.availability || '';
        document.getElementById('edit-linkedin').value = profile.linkedin || '';
        document.getElementById('edit-github').value = profile.github || '';
        document.getElementById('edit-portfolio').value = profile.portfolio || '';
        document.getElementById('edit-email').value = profile.email || '';
        document.getElementById('edit-image-url').value = profile.image_url || '';
        document.getElementById('edit-featured').checked = profile.featured || false;
        document.getElementById('edit-skills').value = (profile.skills || []).join(', ');
        
        editModal.style.display = 'flex';
    }
}

// Handle edit form submission
async function handleEditSubmit(e) {
    e.preventDefault();
    
    if (!validateEditForm()) return;
    
    try {
        setEditLoading(true);
        
        // Parse skills from comma-separated string
        const skillsText = document.getElementById('edit-skills').value;
        const profileSkills = skillsText ? skillsText.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
        
        // Create updated profile data
        const updatedProfile = {
            name: document.getElementById('edit-name').value.trim(),
            title: document.getElementById('edit-title').value.trim(),
            superpower: document.getElementById('edit-superpower').value.trim(),
            location: document.getElementById('edit-location').value.trim(),
            skills: profileSkills,
            availability: document.getElementById('edit-availability').value,
            linkedin: document.getElementById('edit-linkedin').value.trim(),
            github: document.getElementById('edit-github').value.trim(),
            portfolio: document.getElementById('edit-portfolio').value.trim(),
            email: document.getElementById('edit-email').value.trim(),
            image_url: document.getElementById('edit-image-url').value.trim() || null,
            featured: document.getElementById('edit-featured').checked,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Update in Firebase
        await db.collection('hire_them').doc(currentEditId).update(updatedProfile);
        
        showSuccessToast('Profile updated successfully!');
        closeEditModal();
        loadExistingProfiles(); // Refresh the list
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('Failed to update profile. Please try again.');
    } finally {
        setEditLoading(false);
    }
}

// Validate edit form
function validateEditForm() {
    const required = ['edit-name', 'edit-title', 'edit-superpower', 'edit-availability'];
    let isValid = true;
    
    required.forEach(field => {
        const input = document.getElementById(field);
        if (!input.value.trim()) {
            showFieldError(input, 'This field is required');
            isValid = false;
        } else {
            clearFieldError(input);
        }
    });
    
    // Validate email format if provided
    const emailInput = document.getElementById('edit-email');
    if (emailInput.value && !isValidEmail(emailInput.value)) {
        showFieldError(emailInput, 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate URL formats if provided
    const urlFields = ['edit-linkedin', 'edit-github', 'edit-portfolio'];
    urlFields.forEach(field => {
        const input = document.getElementById(field);
        if (input.value && !isValidURL(input.value)) {
            showFieldError(input, 'Please enter a valid URL');
            isValid = false;
        }
    });
    
    // Validate image URL if provided
    if (document.getElementById('edit-image-url').value && !isValidURL(document.getElementById('edit-image-url').value)) {
        showFieldError(document.getElementById('edit-image-url'), 'Please enter a valid image URL');
        isValid = false;
    }
    
    return isValid;
}

// Handle delete profile
async function handleDeleteProfile() {
    if (confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
        try {
            setEditLoading(true);
            
            // Delete from Firebase
            await db.collection('hire_them').doc(currentEditId).delete();
            
            showSuccessToast('Profile deleted successfully!');
            closeEditModal();
            loadExistingProfiles(); // Refresh the list
            
        } catch (error) {
            console.error('Error deleting profile:', error);
            showError('Failed to delete profile. Please try again.');
        } finally {
            setEditLoading(false);
        }
    }
}

// Close edit modal
function closeEditModal() {
    editModal.style.display = 'none';
    currentEditId = null;
}

// Set loading state for edit modal
function setEditLoading(loading) {
    const saveBtn = document.getElementById('save-edit');
    const deleteBtn = document.getElementById('delete-profile');
    
    saveBtn.disabled = loading;
    deleteBtn.disabled = loading;
    
    if (loading) {
        saveBtn.innerHTML = `
            <div class="spinner"></div>
            Saving...
        `;
    } else {
        saveBtn.innerHTML = `
            <span class="material-icons">save</span>
            Save Changes
        `;
    }
}

// Show success toast
function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="material-icons">check_circle</span>
            <span>${message}</span>
        </div>
    `;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--aqi-good);
        color: white;
        padding: 16px;
        border-radius: 4px;
        z-index: 3000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    toast.querySelector('.toast-content').style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 3000);
}

// Helper functions
function getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
}

function getAvailabilityClass(availability) {
    switch (availability) {
        case 'available': return 'available';
        case 'busy': return 'busy';
        case 'unavailable': return 'unavailable';
        default: return 'unavailable';
    }
}

function getAvailabilityText(availability) {
    switch (availability) {
        case 'available': return 'Available';
        case 'busy': return 'Busy';
        case 'unavailable': return 'Unavailable';
        default: return 'Unknown';
    }
} 