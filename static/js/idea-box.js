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
                
                // Debug log for steal status
                if (data.steals) {
                    console.log(`Idea ${doc.id} has been stolen: ${data.steals}`);
                }
            });
            
            console.log(`Loaded ${ideas.length} ideas`);
            console.log('Ideas with steals:', ideas.filter(idea => idea.steals).map(idea => ({ id: idea.id, steals: idea.steals })));
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
            sortedIdeas.sort((a, b) => (b.steals ? 1 : 0) - (a.steals ? 1 : 0));
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
    
    // Add click listeners to idea cards for detailed view
    document.querySelectorAll('.idea-card').forEach(card => {
        card.addEventListener('click', (event) => {
            // Don't open detail modal if clicking on action buttons or upvote
            if (event.target.closest('.action-btn') || event.target.closest('.upvote-btn')) {
                return;
            }
            
            const ideaId = card.dataset.ideaId;
            openIdeaDetailModal(ideaId);
        });
        
        // Add hover effect
        card.style.cursor = 'pointer';
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
    
    // Prevent multiple clicks - check all upvote buttons for this idea
    const allUpvoteButtons = document.querySelectorAll(`[data-action="upvote"][data-idea-id="${ideaId}"], .idea-detail-upvote-btn[data-idea-id="${ideaId}"]`);
    if (allUpvoteButtons.length && Array.from(allUpvoteButtons).some(btn => btn.disabled)) return;
    
    try {
        // Disable all upvote buttons for this idea during processing
        allUpvoteButtons.forEach(btn => btn.disabled = true);
        
        const storageKey = `idea_upvote_${ideaId}`;
        const hasUpvoted = localStorage.getItem(storageKey);
        
        const ideaRef = window.firebaseDb.collection('ideas').doc(ideaId);
        
        if (hasUpvoted) {
            // Remove upvote - Firebase first
            await ideaRef.update({
                upvotes: firebase.firestore.FieldValue.increment(-1)
            });
            
            // Update localStorage only after successful Firebase update
            localStorage.removeItem(storageKey);
            
        } else {
            // Add upvote - Firebase first
            await ideaRef.update({
                upvotes: firebase.firestore.FieldValue.increment(1),
                views: firebase.firestore.FieldValue.increment(1)
            });
            
            // Update localStorage only after successful Firebase update
            localStorage.setItem(storageKey, 'true');
            
            // Show brief animation
            button.style.transform = 'scale(1.05)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);
        }
        
        // Update UI for all upvote buttons after successful Firebase update
        updateUpvoteUI(ideaId);
        
    } catch (error) {
        console.error('Error handling upvote:', error);
        alert('Failed to update upvote. Please try again.');
        
        // Revert localStorage state on error
        const storageKey = `idea_upvote_${ideaId}`;
        const currentState = localStorage.getItem(storageKey);
        if (currentState) {
            localStorage.removeItem(storageKey);
        } else {
            localStorage.setItem(storageKey, 'true');
        }
        
        // Update UI to reflect current localStorage state
        updateUpvoteUI(ideaId);
        
    } finally {
        // Re-enable all upvote buttons
        allUpvoteButtons.forEach(btn => btn.disabled = false);
    }
}

// Update upvote UI for all buttons related to an idea
function updateUpvoteUI(ideaId) {
    const storageKey = `idea_upvote_${ideaId}`;
    const hasUpvoted = localStorage.getItem(storageKey);
    
    // Update all upvote buttons for this idea (card and modal)
    const allUpvoteButtons = document.querySelectorAll(`[data-action="upvote"][data-idea-id="${ideaId}"], .idea-detail-upvote-btn[data-idea-id="${ideaId}"]`);
    
    allUpvoteButtons.forEach(button => {
        button.classList.toggle('upvoted', hasUpvoted);
        
        // Update count from the current ideas data
        const idea = ideas.find(i => i.id === ideaId);
        if (idea) {
            const countSpan = button.querySelector('.upvote-count');
            if (countSpan) {
                countSpan.textContent = idea.upvotes || 0;
            }
        }
    });
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
        closeAnyOpenIdeaDetailModal();
        openStealModal(ideaId);
        return;
    }
    
    // Special handling for invest action
    if (action === 'invest') {
        button.disabled = false;
        closeAnyOpenIdeaDetailModal();
        openInvestModal(ideaId);
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
// INVESTMENT MODAL FUNCTIONALITY
// =================

const SHARES_PER_IDEA = 100;
const SHARE_PRICE = 500; // rupees
const MAX_PURCHASABLE_SHARES = 49;
const MIN_INVESTMENT = 500;
const MAX_INVESTMENT = 24000;
const UPI_ID = "9166900151@ptsbi";

function openInvestModal(ideaId) {
    // Find the idea
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;
    
    // Check if user has already invested
    const hasInvested = localStorage.getItem(`idea_invest_${ideaId}`) === 'true';
    if (hasInvested) {
        alert('You have already invested in this idea!');
        return;
    }
    
    // Load investment data and create modal
    loadInvestmentData(ideaId).then(investmentData => {
        const modalHTML = createInvestModalHTML(idea, investmentData);
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById(`invest-modal-${ideaId}`);
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
        
        attachInvestModalListeners(ideaId, investmentData);
    });
}

async function loadInvestmentData(ideaId) {
    try {
        const ideaRef = window.firebaseDb.collection('ideas').doc(ideaId);
        const investmentsRef = ideaRef.collection('investments');
        const snapshot = await investmentsRef.get();
        
        let totalInvestment = 0;
        let investors = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            totalInvestment += data.amount || 0;
            investors.push({
                id: doc.id,
                name: data.name,
                amount: data.amount,
                shares: data.shares,
                timestamp: data.timestamp
            });
        });
        
        const sharesOwned = Math.floor(totalInvestment / SHARE_PRICE);
        const availableShares = MAX_PURCHASABLE_SHARES - sharesOwned;
        const currentValuation = SHARES_PER_IDEA * SHARE_PRICE;
        
        return {
            totalInvestment,
            sharesOwned,
            availableShares: Math.max(0, availableShares),
            currentValuation,
            investors: investors.sort((a, b) => b.amount - a.amount)
        };
    } catch (error) {
        console.error('Error loading investment data:', error);
        return {
            totalInvestment: 0,
            sharesOwned: 0,
            availableShares: MAX_PURCHASABLE_SHARES,
            currentValuation: SHARES_PER_IDEA * SHARE_PRICE,
            investors: []
        };
    }
}

function createInvestModalHTML(idea, investmentData) {
    const availableInvestment = Math.min(MAX_INVESTMENT, investmentData.availableShares * SHARE_PRICE);
    
    return `
        <div class="modal invest-modal" id="invest-modal-${idea.id}">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-header-content">
                        <div class="protocol-branding">
                            <span class="material-icons protocol-icon">trending_up</span>
                            <h2 class="modal-title">INVESTMENT PROTOCOL</h2>
                            <span class="protocol-version">v1.0.0</span>
                        </div>
                        <button class="close-btn" data-idea-id="${idea.id}">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                </div>
                
                <div class="modal-body">
                    <div class="modal-navigation">
                        <button class="nav-tab active" data-page="cap-table">CAP TABLE</button>
                        <button class="nav-tab" data-page="terms">TERMS</button>
                        <button class="nav-tab" data-page="payment">PAYMENT</button>
                            </div>
                        <!-- Cap Table Page -->
                        <div class="modal-page active" id="cap-table-page-${idea.id}">
                            <div class="cap-table-section">
                            <div class="cap-table-header">
                                <span class="material-icons">pie_chart</span>
                                <h3 class="cap-table-title">CAPITALIZATION TABLE</h3>
                            </div>
                            <div class="valuation-metrics">
                                <div class="metric">
                                    <span class="metric-label">Current Valuation</span>
                                    <span class="metric-value">₹${investmentData.currentValuation.toLocaleString()}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Total Raised</span>
                                    <span class="metric-value">₹${investmentData.totalInvestment.toLocaleString()}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Shares Sold</span>
                                    <span class="metric-value">${investmentData.sharesOwned}/${MAX_PURCHASABLE_SHARES}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Available Shares</span>
                                    <span class="metric-value">${investmentData.availableShares}</span>
                                </div>
                                    <div class="metric">
                                        <span class="metric-label">Price Per Share</span>
                                        <span class="metric-value">₹${SHARE_PRICE.toLocaleString()}</span>
                                    </div>
                                    <div class="metric">
                                        <span class="metric-label">Market Cap</span>
                                        <span class="metric-value">₹${investmentData.currentValuation.toLocaleString()}</span>
                                    </div>
                            </div>
                            
                            ${investmentData.investors.length > 0 ? `
                                <div class="investors-list">
                                    <h4 class="investors-title">Current Investors</h4>
                                    ${investmentData.investors.slice(0, 5).map(investor => `
                                        <div class="investor-row">
                                            <span class="investor-name">${escapeHtml(investor.name)}</span>
                                            <span class="investor-details">${investor.shares} shares • ₹${investor.amount.toLocaleString()}</span>
                                        </div>
                                    `).join('')}
                                    ${investmentData.investors.length > 5 ? `<div class="more-investors">+${investmentData.investors.length - 5} more investors</div>` : ''}
                                </div>
                            ` : ''}
                            </div>
                        </div>
                        
                        <!-- Terms Page -->
                        <div class="modal-page" id="terms-page-${idea.id}">
                            <div class="legal-header">
                                <span class="material-icons">gavel</span>
                                <h3 class="legal-title">INVESTMENT TERMS & CONDITIONS</h3>
                            </div>
                            <div class="legal-content">
                                <div class="legal-section">
                                    <h4 class="legal-subtitle">Early-Stage Opportunity</h4>
                                    <p>This is your chance to own a very early piece of potentially groundbreaking ideas and support building cool, crazy things. You're backing raw concepts at their inception - before formal infrastructure, legal entities, or guaranteed execution paths exist.</p>
                                </div>
                                <div class="legal-section">
                                    <h4 class="legal-subtitle">What You're Actually Getting</h4>
                                    <p>By participating, you understand: (1) You're supporting experimental ideas in their conceptual stage; (2) This is a side project without established banking or legal infrastructure (yet); (3) Formal structures will be built around ideas that gain traction and show proof of viability; (4) Your early support gives you priority access and ownership when ideas mature into real ventures.</p>
                                </div>
                                <div class="legal-section">
                                    <h4 class="legal-subtitle">Risk & Reality Check</h4>
                                    <p>Be smart: (1) Only invest amounts you can completely afford to lose; (2) This is experimental - most ideas may never materialize; (3) You're betting on potential, not proven systems; (4) However, the few that work could offer extraordinary early-adopter advantages. Think of this as supporting innovation at its rawest, most exciting stage.</p>
                                </div>
                                <div class="legal-acknowledgment">
                                    <label class="legal-checkbox">
                                        <input type="checkbox" id="legal-agreement-${idea.id}" required>
                                        <span class="checkmark"></span>
                                        I have read, understood, and agree to all terms and conditions above
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Payment Page -->
                        <div class="modal-page" id="payment-page-${idea.id}">

                            
                            <div class="payment-panels">
                                <div class="payment-left-panel">
                                    <div class="qr-section">
                                        <h4 class="qr-title">Scan & Pay to Invest</h4>
                                        <div class="qr-code-container">
                                            <div id="qr-code-${idea.id}" class="qr-code"></div>
                                        </div>
                                    </div>
                                    
                                    <div class="transaction-section">
                                                                                    <div class="form-group">
                                                <input type="text" id="transaction-id-${idea.id}" class="form-input" placeholder="UPI Transaction ID" required>
                                            <div class="transaction-help">
                                                Enter transaction ID from your payment app
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="payment-right-panel">
                                    <div class="investor-form">
                                        <div class="form-grid">
                                            <div class="form-group">
                                                <input type="text" id="investor-name-${idea.id}" class="form-input" placeholder="Full Name" required>
                                            </div>
                                            <div class="form-group">
                                                <input type="email" id="investor-email-${idea.id}" class="form-input" placeholder="Email Address" required>
                                            </div>
                                            <div class="form-group">
                                                <input type="tel" id="investor-phone-${idea.id}" class="form-input" placeholder="Phone Number" required>
                                            </div>
                                            <div class="form-group">
                                                <input type="url" id="investor-linkedin-${idea.id}" class="form-input" placeholder="LinkedIn Profile">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <div class="footer-content">
                        <div class="footer-slider-container">
                            <div class="slider-track">
                                <input 
                                    type="range" 
                                    id="investment-slider-${idea.id}" 
                                    class="footer-investment-slider"
                                    min="${MIN_INVESTMENT}" 
                                    max="${MAX_INVESTMENT}" 
                                    value="${MIN_INVESTMENT}"
                                    step="500">
                                <div class="slider-amount" id="slider-amount-${idea.id}">₹${MIN_INVESTMENT.toLocaleString()}</div>
                            </div>
                        </div>
                        <div class="footer-actions">
                            <button class="action-btn primary-action" id="invest-btn-${idea.id}" onclick="handleInvestAction('${idea.id}')">
                            <span class="material-icons">payments</span>
                                <span>INVEST</span>
                        </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
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
    
    // Add embarrassing secret display below the identity form
    const identityFormGrid = identitySection.querySelector('.identity-form-grid');
    const secretData = window.leverageData?.secret || '';
    
    // Check if secret display already exists
    let secretDisplay = identitySection.querySelector('.embarrassing-secret-display');
    if (!secretDisplay && secretData) {
        secretDisplay = document.createElement('div');
        secretDisplay.className = 'embarrassing-secret-display';
        secretDisplay.innerHTML = `
            <div class="secret-header">
                <span class="material-icons">visibility</span>
                <span class="secret-label">YOUR SUBMITTED LEVERAGE MATERIAL</span>
            </div>
            <div class="secret-content">
                ${escapeHtml(secretData)}
            </div>
            <div class="secret-warning">
                <span class="material-icons">warning</span>
                <span>This will be publicly released if you fail to ship within 90 days</span>
            </div>
        `;
        identityFormGrid.parentNode.insertBefore(secretDisplay, identityFormGrid.nextSibling);
    }
    
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
        
        console.log('Attempting to update Firebase steals status...');
        const updateResult = await ideaRef.update({
            steals: true,
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
            console.log(`Updated steals status in Firebase: ${data.steals || false}`);
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

function attachInvestModalListeners(ideaId, investmentData) {
    const modal = document.getElementById(`invest-modal-${ideaId}`);
    if (!modal) return;
    
    // Close button
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => closeInvestModal(ideaId));
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeInvestModal(ideaId);
        }
    });
    
    // Escape key to close
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeInvestModal(ideaId);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Page navigation
    const navTabs = modal.querySelectorAll('.nav-tab');
    const pages = modal.querySelectorAll('.modal-page');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetPage = tab.dataset.page;
            const currentActiveTab = modal.querySelector('.nav-tab.active');
            const currentPage = currentActiveTab.dataset.page;
            
            // Validate if user can proceed to next step
            if (!canProceedToPage(currentPage, targetPage, ideaId)) {
                return;
            }
            
            // Remove active class from all tabs and pages
            navTabs.forEach(t => t.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding page
            tab.classList.add('active');
            const targetPageElement = modal.querySelector(`#${targetPage}-page-${ideaId}`);
            if (targetPageElement) {
                targetPageElement.classList.add('active');
            }
            
            // Update button text and slider state based on current page
            const investBtn = modal.querySelector(`#invest-btn-${ideaId}`);
            if (targetPage === 'cap-table') {
                investBtn.innerHTML = '<span class="material-icons">arrow_forward</span><span>NEXT</span>';
                unlockSlider();
            } else if (targetPage === 'terms') {
                investBtn.innerHTML = '<span class="material-icons">arrow_forward</span><span>PROCEED</span>';
                lockSlider();
            } else if (targetPage === 'payment') {
                investBtn.innerHTML = '<span class="material-icons">check_circle</span><span>COMPLETE</span>';
                lockSlider();
                // Generate QR code when payment page is shown
                const amount = parseInt(slider.value);
                generateUPIQR(ideaId, amount);
            }
        });
    });
    
    // Footer slider
    const slider = document.getElementById(`investment-slider-${ideaId}`);
    const sliderAmount = document.getElementById(`slider-amount-${ideaId}`);
    
    function updateSliderAmount() {
    const amount = parseInt(slider.value);
        const min = parseInt(slider.min);
        const max = parseInt(slider.max);
        const percentage = ((amount - min) / (max - min)) * 100;
        
        sliderAmount.textContent = `₹${amount.toLocaleString()}`;
        
        // Update slider overlay
        slider.style.setProperty('--slider-percentage', `${percentage}%`);
    
        // Update QR code if payment page is active
        const activeTab = modal.querySelector('.nav-tab.active');
        if (activeTab && activeTab.dataset.page === 'payment') {
    generateUPIQR(ideaId, amount);
        }
        
        // Payment amounts removed from UI
    }
    
    function lockSlider() {
        slider.disabled = true;
        slider.style.opacity = '0.7';
        slider.style.pointerEvents = 'none';
    }
    
    function unlockSlider() {
        slider.disabled = false;
        slider.style.opacity = '1';
        slider.style.pointerEvents = 'auto';
    }
    
    slider.addEventListener('input', updateSliderAmount);
    
    // Initialize slider amount position
    updateSliderAmount();
}

function canProceedToPage(currentPage, targetPage, ideaId) {
    // Always allow going backwards
    const pageOrder = ['cap-table', 'terms', 'payment'];
    const currentIndex = pageOrder.indexOf(currentPage);
    const targetIndex = pageOrder.indexOf(targetPage);
    
    if (targetIndex <= currentIndex) {
        return true;
    }
    
    // Validate forward progression
    if (currentPage === 'cap-table' && targetPage === 'terms') {
        // Can proceed from cap table to terms (no validation needed)
        return true;
    } else if (currentPage === 'terms' && targetPage === 'payment') {
        // Check if legal agreement is checked
        const legalCheckbox = document.getElementById(`legal-agreement-${ideaId}`);
        if (!legalCheckbox.checked) {
            alert('Please agree to the terms and conditions to proceed.');
            return false;
        }
        return true;
    }
    
    return false;
}

function handleInvestAction(ideaId) {
    const modal = document.getElementById(`invest-modal-${ideaId}`);
    const activeTab = modal.querySelector('.nav-tab.active');
    const currentPage = activeTab.dataset.page;
    
    if (currentPage === 'cap-table') {
        // Go to terms page
        const termsTab = modal.querySelector('[data-page="terms"]');
        termsTab.click();
    } else if (currentPage === 'terms') {
        // Check if legal agreement is checked
        const legalCheckbox = document.getElementById(`legal-agreement-${ideaId}`);
        if (!legalCheckbox.checked) {
            alert('Please agree to the terms and conditions to proceed.');
            return;
        }
        // Go to payment page
        const paymentTab = modal.querySelector('[data-page="payment"]');
        paymentTab.click();
    } else if (currentPage === 'payment') {
        // Submit investment
        submitInvestment(ideaId);
    }
}

// Legacy payment functions removed - now using tab-based navigation

function generateUPIQR(ideaId, amount) {
    const upiUrl = `upi://pay?pa=${UPI_ID}&am=${amount}&cu=INR&tn=Investment%20in%20Idea`;
    const qrContainer = document.getElementById(`qr-code-${ideaId}`);
    
    // Clear container first
    qrContainer.innerHTML = '<div style="text-align: center; padding: 20px;">Generating QR...</div>';
    
    try {
        // Use client-side QR generation
        const qr = qrcode(0, 'M');
        qr.addData(upiUrl);
        qr.make();
        
        // Create QR code as data URL
        const qrDataUrl = qr.createDataURL(4, 0);
        
        qrContainer.innerHTML = `<img src="${qrDataUrl}" alt="UPI Payment QR Code" style="width: 128px; height: 128px;">`;
    } catch (error) {
        console.error('QR generation failed:', error);
                showQRFallback(qrContainer, upiUrl);
    }
}

function showQRFallback(container, upiUrl) {
    container.innerHTML = `
        <div class="qr-fallback">
            <div class="qr-placeholder">QR Code</div>
            <div class="upi-url">${upiUrl}</div>
            <div style="margin-top: 0.5rem; font-size: 0.7rem; color: #666;">
                Copy this URL to your UPI app
            </div>
        </div>
    `;
}

async function submitInvestment(ideaId) {
    const name = document.getElementById(`investor-name-${ideaId}`).value.trim();
    const email = document.getElementById(`investor-email-${ideaId}`).value.trim();
    const phone = document.getElementById(`investor-phone-${ideaId}`).value.trim();
    const linkedin = document.getElementById(`investor-linkedin-${ideaId}`).value.trim();
    const transactionId = document.getElementById(`transaction-id-${ideaId}`).value.trim();
    const amount = parseInt(document.getElementById(`investment-slider-${ideaId}`).value);
    
    // Validation
    if (!name || !email || !phone || !transactionId) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (!isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    if (!isValidUPITransactionId(transactionId)) {
        alert('Please enter a valid UPI transaction ID');
        return;
    }
    
    const submitBtn = document.getElementById(`submit-investment-${ideaId}`);
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="material-icons">hourglass_empty</span><span>PROCESSING...</span>';
    
    try {
        const shares = amount / SHARE_PRICE;
        
        // Add investment to Firebase
        const ideaRef = window.firebaseDb.collection('ideas').doc(ideaId);
        const investmentData = {
            name,
            email,
            phone,
            linkedin: linkedin || null,
            amount,
            shares,
            transactionId,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'completed'
        };
        
        await ideaRef.collection('investments').add(investmentData);
        
        // Update idea investors count
        await ideaRef.update({
            investors: firebase.firestore.FieldValue.increment(1),
            views: firebase.firestore.FieldValue.increment(1)
        });
        
        // Store in localStorage
        localStorage.setItem(`idea_invest_${ideaId}`, 'true');
        localStorage.setItem(`idea_invest_data_${ideaId}`, JSON.stringify({
            name,
            amount,
            shares,
            timestamp: Date.now()
        }));
        
        alert(`Investment Successful!\n\nYou have invested ₹${amount.toLocaleString()} for ${shares} shares.\nTransaction ID: ${transactionId}`);
        closeInvestModal(ideaId);
        sortAndRenderIdeas();
        
    } catch (error) {
        console.error('Error submitting investment:', error);
        alert('Failed to process investment. Please try again.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-icons">check_circle</span><span>COMPLETE INVESTMENT</span>';
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidUPITransactionId(transactionId) {
    // UPI transaction IDs are typically 12 digits
    const upiRegex = /^\d{12}$/;
    return upiRegex.test(transactionId);
}

function closeInvestModal(ideaId) {
    const modal = document.getElementById(`invest-modal-${ideaId}`);
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
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

// Open idea detail modal
async function openIdeaDetailModal(ideaId) {
    try {
        // Get idea data from Firebase
        const ideaDoc = await window.firebaseDb.collection('ideas').doc(ideaId).get();
        if (!ideaDoc.exists) {
            throw new Error('Idea not found');
        }
        
        const idea = { id: ideaDoc.id, ...ideaDoc.data() };
        
        // Create and show modal
        const modalHTML = createIdeaDetailModalHTML(idea);
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Attach event listeners
        attachIdeaDetailModalListeners(ideaId);
        
        // Show modal with animation
        setTimeout(() => {
            const modal = document.getElementById(`idea-detail-modal-${ideaId}`);
            if (modal) {
                modal.classList.add('show');
                
                // Add subscription widget if available
                if (typeof subscriptionWidget !== 'undefined') {
                    subscriptionWidget.addToModal(modal, 'body');
                }
            }
        }, 10);
        
    } catch (error) {
        console.error('Error opening idea detail modal:', error);
        alert('Failed to load idea details. Please try again.');
    }
}

// Create idea detail modal HTML
function createIdeaDetailModalHTML(idea) {
    const hasUpvoted = localStorage.getItem(`idea_upvote_${idea.id}`);
    const hasStolen = localStorage.getItem(`idea_steal_${idea.id}`) === 'true';
    
    return `
        <div class="idea-detail-modal" id="idea-detail-modal-${idea.id}">
            <div class="modal-backdrop"></div>
            <div class="idea-detail-content">
                <div class="idea-detail-header">
                    <div class="idea-detail-header-content">
                        <div class="idea-detail-branding">
                            <span class="material-icons idea-detail-icon">lightbulb</span>
                            <div>
                                <h2 class="idea-detail-title">${escapeHtml(idea.title || 'Untitled Idea')}</h2>
                                <span class="idea-detail-category">${escapeHtml(idea.category || 'General')}</span>
                            </div>
                        </div>
                        <button class="idea-detail-close-btn" onclick="closeIdeaDetailModal('${idea.id}')">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                </div>
                
                <div class="idea-detail-body">
                    <div class="idea-detail-left-panel">
                        ${idea.imageUrl ? `
                            <div class="idea-detail-image">
                                <img src="${escapeHtml(idea.imageUrl)}" alt="${escapeHtml(idea.title)}" />
                            </div>
                        ` : ''}
                        
                        <div class="idea-detail-description">
                            <h3>Detailed Overview</h3>
                            <p>${formatText(idea.description || 'No description provided.')}</p>
                        </div>
                        
                        <div class="idea-detail-meta">
                            <div class="idea-detail-author">
                                <span class="material-icons">person</span>
                                <div>
                                    <strong>Created by</strong><br>
                                    <span>${escapeHtml(idea.author || 'Anonymous')}</span>
                                </div>
                            </div>
                            
                            <div class="idea-detail-timestamp">
                                <span class="material-icons">schedule</span>
                                <div>
                                    <strong>Published</strong><br>
                                    <span>${idea.createdAt ? new Date(idea.createdAt.toDate()).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    }) : 'Unknown date'}</span>
                                </div>
                            </div>
                            
                            <div class="idea-detail-views">
                                <span class="material-icons">visibility</span>
                                <div>
                                    <strong>Views</strong><br>
                                    <span>${(idea.views || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        
                        ${idea.tags && Array.isArray(idea.tags) && idea.tags.length > 0 ? `
                            <div class="idea-detail-tags">
                                <h4>Tags</h4>
                                <div class="idea-detail-tags-list">
                                    ${idea.tags.map(tag => `<span class="idea-detail-tag">${escapeHtml(tag)}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="idea-detail-right-panel">
                        <h3 class="idea-detail-metrics-title">Metrics</h3>
                        <div class="idea-detail-metrics-grid">
                            <div class="metric-card">
                                <div class="metric-card-content">
                                    <div class="metric-icon">
                                        <span class="material-icons">keyboard_arrow_up</span>
                                    </div>
                                    <div class="metric-details">
                                        <div class="metric-value">${(idea.upvotes || 0).toLocaleString()}</div>
                                        <div class="metric-label">Upvotes</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="metric-card">
                                <div class="metric-card-content">
                                    <div class="metric-icon">
                                        <span class="material-icons">trending_up</span>
                                    </div>
                                    <div class="metric-details">
                                        <div class="metric-value">${(idea.investors || 0).toLocaleString()}</div>
                                        <div class="metric-label">Investors</div>
                                    </div>
                                </div>
                            </div>
                            

                            <div class="metric-card">
                                <div class="metric-card-content">
                                    <div class="metric-icon">
                                        <span class="material-icons">poll</span>
                                    </div>
                                    <div class="metric-details">
                                        <div class="metric-value">${(idea.surveys || 0).toLocaleString()}</div>
                                        <div class="metric-label">Surveys</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="idea-detail-footer">
                    <div class="idea-detail-actions">
                        <button class="idea-detail-upvote-btn ${hasUpvoted ? 'upvoted' : ''}" data-action="upvote" data-idea-id="${idea.id}">
                            <span class="material-icons">keyboard_arrow_up</span>
                            <span class="upvote-count">${idea.upvotes || 0}</span>
                        </button>
                        
                        <button class="idea-detail-action-btn invest" data-action="invest" data-idea-id="${idea.id}">
                            <span class="material-icons">trending_up</span>
                            <span class="action-label">INVEST</span>
                        </button>
                        
                        <button class="idea-detail-action-btn follow" data-action="follow" data-idea-id="${idea.id}">
                            <span class="material-icons">group_add</span>
                            <span class="action-label">TAG ALONG</span>
                        </button>
                        
                        <button class="idea-detail-action-btn steal ${hasStolen ? 'stolen' : ''}" data-action="steal" data-idea-id="${idea.id}" ${hasStolen ? 'disabled' : ''}>
                            <span class="material-icons">${hasStolen ? 'done' : 'content_copy'}</span>
                            <span class="action-label">${hasStolen ? 'STOLEN' : 'STEAL'}</span>
                        </button>
                        
                        <button class="idea-detail-action-btn survey" data-action="survey" data-idea-id="${idea.id}">
                            <span class="material-icons">poll</span>
                            <span class="action-label">SURVEY</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Attach event listeners to idea detail modal
function attachIdeaDetailModalListeners(ideaId) {
    const modal = document.getElementById(`idea-detail-modal-${ideaId}`);
    if (!modal) return;
    
    // Close modal when clicking backdrop
    const backdrop = modal.querySelector('.modal-backdrop');
    backdrop.addEventListener('click', () => closeIdeaDetailModal(ideaId));
    
    // Handle escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeIdeaDetailModal(ideaId);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Add action button listeners
    modal.querySelectorAll('.idea-detail-action-btn').forEach(button => {
        button.addEventListener('click', handleAction);
    });
    
    // Add upvote button listener
    const upvoteBtn = modal.querySelector('.idea-detail-upvote-btn');
    if (upvoteBtn) {
        upvoteBtn.addEventListener('click', handleUpvote);
    }
}

// Close idea detail modal
function closeIdeaDetailModal(ideaId) {
    const modal = document.getElementById(`idea-detail-modal-${ideaId}`);
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Close any open idea detail modal
function closeAnyOpenIdeaDetailModal() {
    const openModal = document.querySelector('.idea-detail-modal.show');
    if (openModal) {
        openModal.classList.remove('show');
        setTimeout(() => {
            openModal.remove();
        }, 300);
    }
}

 