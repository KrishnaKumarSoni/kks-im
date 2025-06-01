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
            });
            
            console.log(`Loaded ${ideas.length} ideas`);
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
    const timestamp = idea.timestamp ? idea.timestamp.toDate().toLocaleDateString() : 'Recently';
    const tags = idea.tags ? idea.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    const featuredClass = idea.featured ? 'featured' : '';
    
    return `
        <div class="idea-card ${featuredClass}" data-idea-id="${idea.id}">
            <div class="idea-header">
                <h3 class="idea-title">${escapeHtml(idea.title || 'Untitled Idea')}</h3>
                <span class="idea-category">${escapeHtml(idea.category || 'General')}</span>
            </div>
            
            <div class="idea-description">${formatText(idea.description || 'No description provided.')}</div>
            
            <div class="idea-meta">
                <span class="idea-author">by ${escapeHtml(idea.author || 'Anonymous')}</span>
                <span class="idea-timestamp">${timestamp}</span>
            </div>
            
            ${tags.length > 0 ? `
                <div class="idea-tags">
                    ${tags.map(tag => `<span class="idea-tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            
            <div class="idea-stats">
                <div class="stat-item">
                    <i class="material-icons">trending_up</i>
                    <span>${idea.investors || 0} invested</span>
                </div>
                <div class="stat-item">
                    <i class="material-icons">visibility</i>
                    <span>${idea.views || 0} views</span>
                </div>
            </div>
            
            <div class="idea-actions">
                <button class="action-btn invest" data-action="invest" data-idea-id="${idea.id}">
                    <i class="material-icons">trending_up</i>
                    <span class="action-count">${idea.investors || 0}</span>
                    <span class="action-label">Invest</span>
                </button>
                
                <button class="action-btn follow" data-action="follow" data-idea-id="${idea.id}">
                    <i class="material-icons">group_add</i>
                    <span class="action-count">${idea.followers || 0}</span>
                    <span class="action-label">Tag Along</span>
                </button>
                
                <button class="action-btn steal" data-action="steal" data-idea-id="${idea.id}">
                    <i class="material-icons">content_copy</i>
                    <span class="action-count">${idea.steals || 0}</span>
                    <span class="action-label">Steal</span>
                </button>
                
                <button class="action-btn survey" data-action="survey" data-idea-id="${idea.id}">
                    <i class="material-icons">poll</i>
                    <span class="action-count">${idea.surveys || 0}</span>
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
    
    try {
        // Check if user has already performed this action
        const storageKey = `idea_${action}_${ideaId}`;
        if (localStorage.getItem(storageKey)) {
            alert(`You have already ${action === 'invest' ? 'invested in' : action === 'follow' ? 'tagged along with' : action === 'steal' ? 'stolen' : 'surveyed'} this idea!`);
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