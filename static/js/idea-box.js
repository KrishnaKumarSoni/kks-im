// Idea Box JavaScript
let ideas = [];
let currentSort = 'invested';
let ideasLoading, ideasContainer, ideasCount;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Idea Box page loaded');
    
    // Initialize DOM elements
    ideasLoading = document.getElementById('ideasLoading');
    ideasContainer = document.getElementById('ideasContainer');
    ideasCount = document.getElementById('ideasCount');
    
    // Check if Firebase is available
    if (window.firebaseDb) {
        console.log('Firebase connected');
        
        // Load ideas from Firebase
        loadIdeas();
        
        // Set up sorting controls
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', function() {
                currentSort = this.value;
                sortAndRenderIdeas();
            });
        }
        
        // Set up custom dropdown functionality
        setupCustomDropdown();
    } else {
        console.error('Firebase not connected');
        showError('Firebase connection failed');
    }
});

// Load ideas from Firebase
async function loadIdeas() {
    try {
        console.log('Loading ideas from Firebase...');
        
        // Set timeout for Firebase connection
        const timeoutId = setTimeout(() => {
            console.error('Firebase connection timeout');
            ideasLoading.style.display = 'none';
            showEmptyState('Connection timeout. Please refresh the page.');
        }, 10000); // 10 second timeout
        
        const ideasRef = window.firebaseDb.collection('ideas');
        ideasRef.onSnapshot((snapshot) => {
            clearTimeout(timeoutId); // Clear timeout on successful connection
            
            ideas = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                ideas.push({
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp || firebase.firestore.Timestamp.now()
                });
                
                // Debug log for steal counts
                if (data.steals && data.steals > 0) {
                    console.log(`Idea ${doc.id} has ${data.steals} steals in Firebase`);
                }
            });
            
            console.log(`Loaded ${ideas.length} ideas`);
            console.log('Ideas with steals:', ideas.filter(idea => idea.steals > 0).map(idea => ({ id: idea.id, steals: idea.steals })));
            sortAndRenderIdeas();
        }, (error) => {
            clearTimeout(timeoutId);
            console.error('Error loading ideas:', error);
            ideasLoading.style.display = 'none';
            showError('Failed to load ideas. Please check your connection.');
        });
    } catch (error) {
        console.error('Error setting up Firebase listener:', error);
        ideasLoading.style.display = 'none';
        showError('Firebase setup failed');
    }
}

// Sort and render ideas
function sortAndRenderIdeas() {
    if (ideas.length === 0) {
        ideasLoading.style.display = 'none';
        showEmptyState();
        return;
    }
    
    ideasLoading.style.display = 'none';
    
    // Debug: Log all localStorage steal-related keys
    console.log('localStorage steal keys:', Object.keys(localStorage).filter(key => key.includes('steal')));
    
    // Sort ideas
    let sortedIdeas = [...ideas];
    
    switch (currentSort) {
        case 'invested':
            sortedIdeas.sort((a, b) => (b.investors || 0) - (a.investors || 0));
            break;
        case 'newest':
            sortedIdeas.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
            break;
        case 'followed':
            sortedIdeas.sort((a, b) => (b.followers || 0) - (a.followers || 0));
            break;
        case 'stolen':
            sortedIdeas.sort((a, b) => (b.steals || 0) - (a.steals || 0));
            break;
        case 'surveyed':
            sortedIdeas.sort((a, b) => (b.surveys || 0) - (a.surveys || 0));
            break;
        case 'upvotes':
            sortedIdeas.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
            break;
        default:
            sortedIdeas.sort((a, b) => (b.investors || 0) - (a.investors || 0));
    }
    
    renderIdeas(sortedIdeas);
}

// Render ideas
function renderIdeas(ideasList) {
    // Always hide loading spinner when rendering
    ideasLoading.style.display = 'none';
    
    if (ideasList.length === 0) {
        showEmptyState();
        return;
    }
    
    ideasContainer.innerHTML = ideasList.map(idea => renderIdeaCard(idea)).join('');
    
    // Update ideas count
    if (ideasCount) {
        ideasCount.textContent = ideasList.length;
    }
    
    // Add event listeners
    addIdeaEventListeners();
}

// Render individual idea card
function renderIdeaCard(idea) {
    const featuredClass = idea.featured ? 'featured' : '';
    
    // Check if user has upvoted this idea
    const hasUpvoted = localStorage.getItem(`idea_upvote_${idea.id}`);
    
    // Check if user has stolen this idea - simplified boolean
    const hasStolen = localStorage.getItem(`idea_steal_${idea.id}`) === 'true';
    
    // Debug logging
    console.log(`Idea ${idea.id}: hasStolen = ${hasStolen}, localStorage value = ${localStorage.getItem(`idea_steal_${idea.id}`)}`);
    

    
    return `
        <div class="idea-card ${featuredClass}" data-idea-id="${idea.id}">
            <div class="idea-header">
                <h3 class="idea-title">${escapeHtml(idea.title || 'Untitled Idea')}</h3>
                <span class="idea-category">${escapeHtml(idea.category || 'General')}</span>
            </div>
            
            <div class="idea-description">${formatText(idea.description || 'No description provided.')}</div>
            
            <div class="idea-meta">
                <button class="upvote-btn ${hasUpvoted ? 'upvoted' : ''}" data-action="upvote" data-idea-id="${idea.id}">
                    <i class="material-icons">keyboard_arrow_up</i>
                    <span class="upvote-count">${idea.upvotes || 0}</span>
                </button>
            </div>
            
            <div class="idea-actions">
                <button class="action-btn invest" data-action="invest" data-idea-id="${idea.id}">
                    <i class="material-icons">trending_up</i>
                    <span class="action-label">Invest</span>
                </button>
                
                <button class="action-btn follow" data-action="follow" data-idea-id="${idea.id}">
                    <i class="material-icons">group_add</i>
                    <span class="action-label">Tag Along</span>
                </button>
                
                <button class="action-btn steal ${hasStolen ? 'stolen' : ''}" data-action="steal" data-idea-id="${idea.id}" ${hasStolen ? 'disabled' : ''}>
                    <i class="material-icons">${hasStolen ? 'done' : 'content_copy'}</i>
                    <span class="action-label">${hasStolen ? 'Stolen' : 'Steal'}</span>
                </button>
                
                <button class="action-btn survey" data-action="survey" data-idea-id="${idea.id}">
                    <i class="material-icons">poll</i>
                    <span class="action-label">Survey</span>
                </button>
            </div>
        </div>
    `;
}

// Add event listeners to idea cards
function addIdeaEventListeners() {
    // Add action button listeners
    document.querySelectorAll('.action-btn').forEach(button => {
        button.addEventListener('click', handleAction);
    });
    
    // Add upvote button listeners with proper state sync
    document.querySelectorAll('.upvote-btn').forEach(button => {
        button.addEventListener('click', handleUpvote);
        
        // Ensure visual state matches localStorage on render
        const ideaId = button.dataset.ideaId;
        const storageKey = `idea_upvote_${ideaId}`;
        const hasUpvoted = localStorage.getItem(storageKey);
        
        if (hasUpvoted) {
            button.classList.add('upvoted');
        } else {
            button.classList.remove('upvoted');
        }
    });
    

}

// Debug function to clear localStorage steal data
function clearStealData() {
    const stealKeys = Object.keys(localStorage).filter(key => key.includes('idea_steal'));
    stealKeys.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${stealKeys.length} steal-related localStorage keys:`, stealKeys);
    sortAndRenderIdeas(); // Re-render to update UI
}

// Make debug function available globally
window.clearStealData = clearStealData;

// Handle upvote button clicks
async function handleUpvote(event) {
    event.preventDefault();
    
    const button = event.currentTarget;
    const ideaId = button.dataset.ideaId;
    
    // Prevent multiple clicks
    if (button.disabled) return;
    button.disabled = true;
    
    try {
        const storageKey = `idea_upvote_${ideaId}`;
        const hasUpvoted = localStorage.getItem(storageKey);
        const countSpan = button.querySelector('.upvote-count');
        const currentCount = parseInt(countSpan.textContent) || 0;
        
        const ideaRef = window.firebaseDb.collection('ideas').doc(ideaId);
        
        if (hasUpvoted) {
            // Remove upvote
            await ideaRef.update({
                upvotes: firebase.firestore.FieldValue.increment(-1)
            });
            
            // Update localStorage and UI immediately
            localStorage.removeItem(storageKey);
            button.classList.remove('upvoted');
            countSpan.textContent = Math.max(0, currentCount - 1);
            
        } else {
            // Add upvote
            await ideaRef.update({
                upvotes: firebase.firestore.FieldValue.increment(1),
                views: firebase.firestore.FieldValue.increment(1)
            });
            
            // Update localStorage and UI immediately
            localStorage.setItem(storageKey, 'true');
            button.classList.add('upvoted');
            countSpan.textContent = currentCount + 1;
            
            // Show brief animation
            button.style.transform = 'scale(1.05)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);
        }
        
    } catch (error) {
        console.error('Error handling upvote:', error);
        alert('Failed to update upvote. Please try again.');
        
        // Reset UI state on error
        const storageKey = `idea_upvote_${ideaId}`;
        const hasUpvoted = localStorage.getItem(storageKey);
        const countSpan = button.querySelector('.upvote-count');
        
        if (hasUpvoted) {
            button.classList.add('upvoted');
        } else {
            button.classList.remove('upvoted');
        }
    }
    
    button.disabled = false;
}

// Handle action button clicks
async function handleAction(event) {
    event.preventDefault();
    
    const button = event.currentTarget;
    const action = button.dataset.action;
    const ideaId = button.dataset.ideaId;
    
    // Prevent multiple clicks
    if (button.disabled) return;
    button.disabled = true;
    
    // Special handling for steal action
    if (action === 'steal') {
        button.disabled = false;
        openStealModal(ideaId);
        return;
    }
    
    try {
        // Check if user has already performed this action
        const storageKey = `idea_${action}_${ideaId}`;
        if (localStorage.getItem(storageKey)) {
            alert(`You have already ${action === 'invest' ? 'invested in' : action === 'follow' ? 'tagged along with' : action === 'survey' ? 'surveyed' : 'performed this action on'} this idea!`);
            button.disabled = false;
            return;
        }
        
        // Update the count in Firebase
        const ideaRef = window.firebaseDb.collection('ideas').doc(ideaId);
        const actionField = getActionField(action);
        
        await ideaRef.update({
            [actionField]: firebase.firestore.FieldValue.increment(1),
            views: firebase.firestore.FieldValue.increment(1)
        });
        
        // Store in localStorage to prevent duplicate actions
        localStorage.setItem(storageKey, 'true');
        
        // Show feedback
        showActionFeedback(action, button);
        
    } catch (error) {
        console.error(`Error performing ${action}:`, error);
        alert(`Failed to ${action}. Please try again.`);
    }
    
    button.disabled = false;
}

// Get Firebase field name for action
function getActionField(action) {
    switch (action) {
        case 'invest': return 'investors';
        case 'follow': return 'followers';
        case 'steal': return 'steals';
        case 'survey': return 'surveys';
        case 'upvote': return 'upvotes';
        default: return 'views';
    }
}

// Show action feedback
function showActionFeedback(action, button) {
    const messages = {
        invest: 'Investment recorded! 💰',
        follow: 'You\'re now tagging along! 🚀',
        steal: 'Idea stolen successfully! 😈',
        survey: 'Survey vote recorded! 📊'
    };
    
    const originalText = button.innerHTML;
    button.innerHTML = `<i class="material-icons">check</i><span class="action-label">${messages[action]}</span>`;
    button.style.background = '#4CAF50';
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
    }, 2000);
}

// Setup custom dropdown functionality
function setupCustomDropdown() {
    const selectDisplay = document.getElementById('selectDisplay');
    const selectOptions = document.getElementById('selectOptions');
    const sortSelect = document.getElementById('sortSelect');
    const selectText = selectDisplay?.querySelector('.select-text');

    if (!selectDisplay || !selectOptions || !sortSelect) return;

    // Toggle dropdown
    selectDisplay.addEventListener('click', (e) => {
        e.stopPropagation();
        selectOptions.classList.toggle('show');
    });

    // Handle option selection
    selectOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('select-option')) {
            // Update selection
            document.querySelectorAll('.select-option').forEach(opt => opt.classList.remove('selected'));
            e.target.classList.add('selected');
            
            // Update display and hidden select
            selectText.textContent = e.target.textContent;
            sortSelect.value = e.target.dataset.value;
            
            // Trigger change event
            const changeEvent = new Event('change', { bubbles: true });
            sortSelect.dispatchEvent(changeEvent);
            
            // Close dropdown
            selectOptions.classList.remove('show');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        selectOptions.classList.remove('show');
    });
}

// Show empty state
function showEmptyState(message = null) {
    const defaultMessage = message || 'No innovative ideas yet. Be the first to share your breakthrough concept!';
    
    ideasContainer.innerHTML = `
        <div class="no-ideas-message">
            <div class="no-ideas-icon">💡</div>
            <h3>Innovation Awaits</h3>
            <p>${defaultMessage}</p>
        </div>
    `;
    
    if (ideasCount) {
        ideasCount.textContent = '0';
    }
}

// Show error message
function showError(message) {
    ideasContainer.innerHTML = `
        <div class="no-ideas-message">
            <div class="no-ideas-icon">⚠️</div>
            <h3>Connection Error</h3>
            <p>${message}</p>
        </div>
    `;
    
    if (ideasCount) {
        ideasCount.textContent = '--';
    }
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

// =================
// STEAL MODAL FUNCTIONALITY
// =================

function openStealModal(ideaId) {
    // Find the idea
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;
    
    // Check if already stolen - simple boolean check
    const hasStolen = localStorage.getItem(`idea_steal_${ideaId}`) === 'true';
    if (hasStolen) {
        alert('You have already stolen this idea!');
        return;
    }
    
    // Create modal HTML
    const modalHTML = createStealModalHTML(idea);
    
    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal with animation
    const modal = document.getElementById(`steal-modal-${ideaId}`);
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
    
    // Attach event listeners
    attachStealModalListeners(ideaId);
}

function createStealModalHTML(idea) {
    return `
        <div class="modal steal-modal" id="steal-modal-${idea.id}">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-header-content">
                        <div class="protocol-branding">
                            <span class="material-icons protocol-icon">shield</span>
                            <h2 class="modal-title">IDEA THEFT PROTOCOL</h2>
                            <span class="protocol-version">v2.1.7</span>
                        </div>
                        <button class="close-btn" data-idea-id="${idea.id}">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                </div>
                
                <div class="modal-body">
                    <div class="modal-content-scroll">
                        <div class="target-asset-preview">
                            <div class="asset-header">
                                <span class="material-icons">inventory_2</span>
                                <span class="asset-label">TARGET INTELLECTUAL ASSET</span>
                            </div>
                            <div class="asset-content">
                                <h3 class="asset-title">${escapeHtml(idea.title || 'UNTITLED_ASSET')}</h3>
                                <div class="asset-description">${formatText(idea.description || 'NO_DESCRIPTION_AVAILABLE')}</div>
                            </div>
                        </div>
                        
                        <div class="protocol-agreement" id="agreement-section-${idea.id}">
                            <div class="agreement-header">
                                <span class="material-icons">gavel</span>
                                <h3 class="agreement-title">PSYCHOLOGICAL LEVERAGE PROTOCOL</h3>
                            </div>
                            <div class="agreement-content">
                                <div class="clause-block">
                                    <span class="clause-number">01.</span>
                                    <p>I acknowledge intent to <strong>APPROPRIATE</strong> this intellectual asset for deployment within <strong>90 SOLAR CYCLES</strong>.</p>
                                </div>
                                <div class="clause-block">
                                    <span class="clause-number">02.</span>
                                    <p>I understand that <strong>PSYCHOLOGICAL LEVERAGE</strong> will be applied to ensure execution accountability.</p>
                                </div>
                                <div class="clause-block">
                                    <span class="clause-number">03.</span>
                                    <p>Failure to ship within the designated timeframe will result in <strong>PUBLIC DISCLOSURE</strong> of submitted leverage material.</p>
                                </div>
                                <div class="clause-block">
                                    <span class="clause-number">04.</span>
                                    <p>The system will <strong>AUTONOMOUSLY MONITOR</strong> execution progress and trigger disclosure protocols if necessary.</p>
                                </div>
                                <div class="warning-panel">
                                    <span class="material-icons">warning</span>
                                    <div class="warning-content">
                                        <strong>LEVERAGE MATRIX ALERT:</strong> Your submitted secret will be weaponized against procrastination.
                                    </div>
                                </div>
                                <div class="leverage-input">
                                    <div class="leverage-instruction">SUBMIT PSYCHOLOGICAL LEVERAGE MATERIAL</div>
                                    <div class="leverage-description">Enter your life's most embarrassing secret. This will remain confidential unless you fail to ship within 90 days.</div>
                                    <textarea 
                                        id="embarrassing-secret-${idea.id}" 
                                        class="leverage-textarea" 
                                        placeholder="THE SECRET THAT WOULD DESTROY YOUR REPUTATION IF REVEALED..."
                                        rows="4"
                                        required>
                                    </textarea>
                                    <div class="leverage-warning">
                                        <span class="material-icons">visibility</span>
                                        <span>This will be publicly broadcasted if you don't ship. We track everything.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="hunter-identity-matrix" id="identity-section-${idea.id}" style="display: none;">
                            <div class="identity-header">
                                <span class="material-icons">badge</span>
                                <h3 class="identity-title">HUNTER IDENTITY MATRIX</h3>
                            </div>
                            <div class="identity-form-grid">
                                <div class="form-cluster">
                                    <label class="form-label">
                                        <span class="material-icons">person</span>
                                        NAME
                                    </label>
                                    <input type="text" id="hunter-name-${idea.id}" class="form-input" required>
                                </div>
                                <div class="form-cluster">
                                    <label class="form-label">
                                        <span class="material-icons">link</span>
                                        LINKEDIN NEURAL LINK
                                    </label>
                                    <input type="url" id="hunter-linkedin-${idea.id}" class="form-input" value="https://linkedin.com/in/" required>
                                </div>
                                <div class="form-cluster">
                                    <label class="form-label">
                                        <span class="material-icons">alternate_email</span>
                                        EMAIL
                                    </label>
                                    <input type="email" id="hunter-email-${idea.id}" class="form-input" required>
                                </div>
                            </div>
                        </div>
                        
                        <div class="verification-matrix" id="verification-section-${idea.id}" style="display: none;">
                            <div class="verification-header">
                                <span class="material-icons">verified_user</span>
                                <h3 class="verification-title">NEURAL VERIFICATION MATRIX</h3>
                            </div>
                            <div class="verification-content">
                                <div class="otp-instruction">CHECK YOUR EMAIL FOR VERIFICATION LINK</div>
                                <div class="verification-waiting">
                                    <div class="verification-email-sent" id="verification-email-sent-${idea.id}">
                                        <span class="material-icons">mark_email_read</span>
                                        <span>VERIFICATION LINK TRANSMITTED</span>
                                    </div>
                                    <div class="verification-instructions">
                                        Click the verification link in your email to complete the theft protocol.
                                    </div>
                                </div>
                                <div class="verification-status" id="verification-status-${idea.id}">
                                    <span class="material-icons">schedule</span>
                                    <span>AWAITING EMAIL VERIFICATION</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <div class="footer-actions" id="footer-actions-${idea.id}">
                        <button class="action-btn secondary-action" onclick="closeStealModal('${idea.id}')">
                            <span class="material-icons">cancel</span>
                            <span>ABORT PROTOCOL</span>
                        </button>
                        <button class="action-btn primary-action" id="primary-action-${idea.id}" onclick="submitLeverage('${idea.id}')">
                            <span class="material-icons">psychology</span>
                            <span>SUBMIT LEVERAGE</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function attachStealModalListeners(ideaId) {
    const modal = document.getElementById(`steal-modal-${ideaId}`);
    if (!modal) return;
    
    // Close button
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => closeStealModal(ideaId));
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeStealModal(ideaId);
        }
    });
    
    // Escape key to close
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeStealModal(ideaId);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

function submitLeverage(ideaId) {
    const secretTextarea = document.getElementById(`embarrassing-secret-${ideaId}`);
    const secret = secretTextarea.value.trim();
    
    if (!secret || secret.length < 50) {
        showVerificationStatus(ideaId, 'error', 'LEVERAGE MATERIAL TOO BRIEF - MINIMUM 50 CHARACTERS');
        secretTextarea.focus();
        return;
    }
    
    // Store the secret temporarily
    window.leverageData = {
        secret: secret,
        ideaId: ideaId
    };
    
    // Move to identity section
    acceptPledge(ideaId);
}

function acceptPledge(ideaId) {
    const agreementSection = document.getElementById(`agreement-section-${ideaId}`);
    const identitySection = document.getElementById(`identity-section-${ideaId}`);
    
    agreementSection.style.display = 'none';
    identitySection.style.display = 'block';
    
    // Update footer action
    const primaryAction = document.getElementById(`primary-action-${ideaId}`);
    primaryAction.onclick = () => initiateVerification(ideaId);
    primaryAction.innerHTML = '<span class="material-icons">send</span><span>INITIATE VERIFICATION</span>';
    primaryAction.disabled = false;
}

function initiateVerification(ideaId) {
    const nameInput = document.getElementById(`hunter-name-${ideaId}`);
    const linkedinInput = document.getElementById(`hunter-linkedin-${ideaId}`);
    const emailInput = document.getElementById(`hunter-email-${ideaId}`);
    
    // Validate inputs
    if (!nameInput.value.trim()) {
        showVerificationStatus(ideaId, 'error', 'DESIGNATION REQUIRED');
        nameInput.focus();
        return;
    }
    
    if (!linkedinInput.value.trim() || !linkedinInput.value.includes('linkedin.com')) {
        showVerificationStatus(ideaId, 'error', 'VALID LINKEDIN NEURAL LINK REQUIRED');
        linkedinInput.focus();
        return;
    }
    
    if (!emailInput.value.trim() || !emailInput.value.includes('@')) {
        showVerificationStatus(ideaId, 'error', 'VALID COMMUNICATION ENDPOINT REQUIRED');
        emailInput.focus();
        return;
    }
    
    sendVerificationOTP(ideaId);
}

function showVerificationStatus(ideaId, type, message) {
    const statusElement = document.getElementById(`verification-status-${ideaId}`);
    if (!statusElement) return;
    
    const icons = {
        loading: 'sync',
        success: 'check_circle',
        error: 'error',
        waiting: 'schedule'
    };
    
    statusElement.innerHTML = `
        <span class="material-icons ${type}">${icons[type] || 'schedule'}</span>
        <span>${message}</span>
    `;
}

async function sendVerificationOTP(ideaId) {
    const nameInput = document.getElementById(`hunter-name-${ideaId}`);
    const linkedinInput = document.getElementById(`hunter-linkedin-${ideaId}`);
    const emailInput = document.getElementById(`hunter-email-${ideaId}`);
    const primaryAction = document.getElementById(`primary-action-${ideaId}`);
    
    primaryAction.disabled = true;
    primaryAction.innerHTML = '<span class="material-icons">sync</span><span>TRANSMITTING...</span>';
    
    try {
        // Store user data temporarily for later use
        window.stealUserData = {
            name: nameInput.value.trim(),
            linkedin: linkedinInput.value.trim(),
            email: emailInput.value.trim(),
            secret: window.leverageData.secret,
            ideaId: ideaId
        };
        
        // Send OTP request to backend
        const response = await fetch('/api/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: emailInput.value.trim(),
                ideaId: ideaId
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to send OTP');
        }
        
        // Show verification section
        const identitySection = document.getElementById(`identity-section-${ideaId}`);
        const verificationSection = document.getElementById(`verification-section-${ideaId}`);
        
        identitySection.style.display = 'none';
        verificationSection.style.display = 'block';
        
        // Update verification section for OTP input
        updateVerificationSectionForOTP(ideaId);
        
        // Update footer action
        primaryAction.onclick = () => verifyOTP(ideaId);
        primaryAction.innerHTML = '<span class="material-icons">verified_user</span><span>VERIFY OTP</span>';
        primaryAction.disabled = false;
        
        showVerificationStatus(ideaId, 'loading', 'OTP TRANSMITTED TO EMAIL');
        
    } catch (error) {
        console.error('Error sending OTP:', error);
        showVerificationStatus(ideaId, 'error', error.message || 'TRANSMISSION FAILED - RETRY REQUIRED');
        
        primaryAction.disabled = false;
        primaryAction.innerHTML = '<span class="material-icons">send</span><span>INITIATE VERIFICATION</span>';
    }
}

function updateVerificationSectionForOTP(ideaId) {
    const verificationContent = document.querySelector(`#verification-section-${ideaId} .verification-content`);
    
    verificationContent.innerHTML = `
        <div class="otp-instruction">ENTER 6-DIGIT VERIFICATION CODE</div>
        <div class="otp-input-container">
            <input type="text" id="otp-input-${ideaId}" class="otp-input" maxlength="6" placeholder="000000" autocomplete="off">
        </div>
        <div class="verification-instructions">
            Enter the 6-digit code sent to your email address.
        </div>
        <div class="verification-status" id="verification-status-${ideaId}">
            <span class="material-icons">schedule</span>
            <span>AWAITING OTP VERIFICATION</span>
        </div>
    `;
    
    // Focus on OTP input
    setTimeout(() => {
        const otpInput = document.getElementById(`otp-input-${ideaId}`);
        if (otpInput) {
            otpInput.focus();
            // Auto-format OTP input
            otpInput.addEventListener('input', function(e) {
                this.value = this.value.replace(/[^0-9]/g, '');
                if (this.value.length === 6) {
                    verifyOTP(ideaId);
                }
            });
        }
    }, 100);
}

async function verifyOTP(ideaId) {
    const otpInput = document.getElementById(`otp-input-${ideaId}`);
    const enteredOTP = otpInput.value.trim();
    
    if (!enteredOTP || enteredOTP.length !== 6) {
        showVerificationStatus(ideaId, 'error', 'INVALID OTP - 6 DIGITS REQUIRED');
        otpInput.focus();
        return;
    }
    
    try {
        // Get stored user data
        const userData = window.stealUserData;
        if (!userData) {
            showVerificationStatus(ideaId, 'error', 'SESSION EXPIRED - RESTART PROCESS');
            return;
        }
        
        showVerificationStatus(ideaId, 'loading', 'VERIFYING OTP...');
        
        // Verify OTP with backend
        const response = await fetch('/api/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: userData.email,
                ideaId: ideaId,
                otp: enteredOTP
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'OTP verification failed');
        }
        
        // OTP verified successfully
        showVerificationStatus(ideaId, 'success', 'OTP VERIFIED - EXECUTING THEFT');
        
        // Complete the steal
        await executeSteal(ideaId, {
            name: userData.name,
            linkedin: userData.linkedin,
            email: userData.email,
            secret: userData.secret
        });
        
        // Clean up
        delete window.stealUserData;
        
        setTimeout(() => {
            alert('LEVERAGE PROTOCOL EXECUTED\n\nYour secret is now weaponized. Ship within 90 days or face public humiliation.\n\nWe are watching. We will know.');
            closeStealModal(ideaId);
            
            // Re-render ideas to show the updated state
            sortAndRenderIdeas();
        }, 2000);
        
    } catch (error) {
        console.error('Error verifying OTP:', error);
        showVerificationStatus(ideaId, 'error', error.message || 'VERIFICATION FAILED');
        otpInput.focus();
        otpInput.select();
    }
}

async function resendVerificationEmail(ideaId) {
    await sendVerificationOTP(ideaId);
}

async function executeSteal(ideaId, stealData) {
    try {
        console.log('Starting executeSteal for idea:', ideaId);
        console.log('Firebase instance:', window.firebaseDb);
        
        // Add hunter identity to Firebase
        const ideaRef = window.firebaseDb.collection('ideas').doc(ideaId);
        
        console.log('Attempting to update Firebase steals count...');
        const updateResult = await ideaRef.update({
            steals: firebase.firestore.FieldValue.increment(1),
            views: firebase.firestore.FieldValue.increment(1)
        });
        console.log('Firebase steals update successful:', updateResult);
        
        // Add hunter identity as subcollection with leverage material
        console.log('Adding hunter identity to subcollection...');
        const subcollectionResult = await ideaRef.collection('hunter_identity').add({
            name: stealData.name,
            linkedin: stealData.linkedin,
            email: stealData.email,
            embarrassing_secret: stealData.secret,
            deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'verified',
            leverage_active: true
        });
        console.log('Hunter identity added to subcollection:', subcollectionResult.id);
        
        // Store simple boolean in localStorage to prevent duplicate steals
        localStorage.setItem(`idea_steal_${ideaId}`, 'true');
        
        // Store hunter data separately for display (include all needed data)
        localStorage.setItem(`idea_steal_data_${ideaId}`, JSON.stringify({
            name: stealData.name,
            linkedin: stealData.linkedin,
            email: stealData.email,
            timestamp: Date.now()
        }));
        
        console.log(`Steal executed successfully for idea ${ideaId}. LocalStorage set:`, {
            stolen: localStorage.getItem(`idea_steal_${ideaId}`),
            data: localStorage.getItem(`idea_steal_data_${ideaId}`)
        });
        
        // Verify the update by reading the document
        const docSnapshot = await ideaRef.get();
        if (docSnapshot.exists) {
            const data = docSnapshot.data();
            console.log(`Updated steals count in Firebase: ${data.steals || 0}`);
        }
        
    } catch (error) {
        console.error('Error executing steal:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
}

function closeStealModal(ideaId) {
    const modal = document.getElementById(`steal-modal-${ideaId}`);
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

 