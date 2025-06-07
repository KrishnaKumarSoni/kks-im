// Admin Ideas Management System
let allIdeas = [];
let allInvestments = {};
let allSteals = {};

// Load Overview Data
async function loadOverview() {
    const loading = document.getElementById('overview-loading');
    const content = document.getElementById('overview-content');
    
    loading.style.display = 'block';
    content.style.display = 'none';
    
    try {
        // Load all ideas
        const ideasSnapshot = await window.firebaseDb.collection('ideas').get();
        allIdeas = ideasSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Load investments and steals for each idea
        let totalInvestments = 0;
        let totalSteals = 0;
        let totalAmount = 0;
        
        for (const idea of allIdeas) {
            // Load investments
            const investmentsSnapshot = await window.firebaseDb
                .collection('ideas')
                .doc(idea.id)
                .collection('investments')
                .get();
            
            const investments = investmentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            allInvestments[idea.id] = investments;
            totalInvestments += investments.length;
            totalAmount += investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
            
            // Load steals
            const stealsSnapshot = await window.firebaseDb
                .collection('ideas')
                .doc(idea.id)
                .collection('steals')
                .get();
            
            const steals = stealsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            allSteals[idea.id] = steals;
            totalSteals += steals.length;
        }
        
        // Update stats
        document.getElementById('total-ideas').textContent = allIdeas.length;
        document.getElementById('total-investments').textContent = totalInvestments;
        document.getElementById('total-steals').textContent = totalSteals;
        document.getElementById('total-amount').textContent = `₹${totalAmount.toLocaleString()}`;
        
        // Show recent activity
        showRecentActivity();
        
        loading.style.display = 'none';
        content.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading overview:', error);
        loading.innerHTML = `
            <div class="error-message-admin">
                <span class="material-icons">error</span>
                Failed to load overview data: ${error.message}
            </div>
        `;
    }
}

// Show Recent Activity
function showRecentActivity() {
    const activityList = document.getElementById('recent-activity-list');
    const activities = [];
    
    // Add recent investments
    Object.keys(allInvestments).forEach(ideaId => {
        const idea = allIdeas.find(i => i.id === ideaId);
        allInvestments[ideaId].forEach(investment => {
            activities.push({
                type: 'investment',
                ideaTitle: idea?.title || 'Unknown',
                user: investment.name,
                amount: investment.amount,
                timestamp: investment.timestamp?.toDate() || new Date(investment.timestamp) || new Date()
            });
        });
    });
    
    // Add recent steals
    Object.keys(allSteals).forEach(ideaId => {
        const idea = allIdeas.find(i => i.id === ideaId);
        allSteals[ideaId].forEach(steal => {
            activities.push({
                type: 'steal',
                ideaTitle: idea?.title || 'Unknown',
                user: steal.name,
                timestamp: steal.timestamp?.toDate() || new Date(steal.timestamp) || new Date()
            });
        });
    });
    
    // Sort by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    // Show latest 10 activities
    const recentActivities = activities.slice(0, 10);
    
    if (recentActivities.length === 0) {
        activityList.innerHTML = '<p style="color: var(--md-sys-color-on-surface-variant); text-align: center; padding: 2rem;">No recent activity</p>';
        return;
    }
    
    activityList.innerHTML = recentActivities.map(activity => `
        <div class="activity-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--md-sys-color-surface-container-low); margin-bottom: 0.5rem; border: 1px solid var(--md-sys-color-outline-variant);">
            <div>
                <strong style="color: var(--md-sys-color-on-surface);">${escapeHtml(activity.user)}</strong>
                <span style="color: var(--md-sys-color-on-surface-variant);">
                    ${activity.type === 'investment' ? 'invested' : 'stole'} 
                    ${activity.type === 'investment' ? `₹${activity.amount?.toLocaleString()}` : 'idea'}
                </span>
                <em style="color: var(--md-sys-color-outline);">"${escapeHtml(activity.ideaTitle)}"</em>
            </div>
            <small style="color: var(--md-sys-color-outline);">${formatDate(activity.timestamp)}</small>
        </div>
    `).join('');
}

// Load Manage Panel
async function loadManagePanel() {
    const loading = document.getElementById('manage-loading');
    const content = document.getElementById('manage-content');
    
    loading.style.display = 'block';
    content.style.display = 'none';
    
    try {
        // Use existing data if available, otherwise load fresh
        if (allIdeas.length === 0) {
            await loadOverview();
        }
        
        const tableBody = document.getElementById('ideas-table-body');
        
        if (allIdeas.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: var(--md-sys-color-on-surface-variant);">
                        No ideas found
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = allIdeas.map(idea => {
                const investments = allInvestments[idea.id] || [];
                const steals = allSteals[idea.id] || [];
                const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
                
                return `
                    <tr>
                        <td class="idea-title-cell">${escapeHtml(idea.title || 'Untitled')}</td>
                        <td>${escapeHtml(idea.author || 'Anonymous')}</td>
                        <td>${escapeHtml(idea.category || 'Uncategorized')}</td>
                        <td class="stats-cell">
                            <span class="stat-badge">↑ ${idea.upvotes || 0}</span>
                            <span class="stat-badge">💰 ${investments.length}</span>
                            <span class="stat-badge">🎯 ${steals.length}</span>
                        </td>
                        <td>${formatDate(idea.timestamp?.toDate() || new Date(idea.timestamp) || new Date())}</td>
                        <td class="actions-cell">
                            <button class="action-btn-small" onclick="viewIdeaDetails('${idea.id}')" title="View Details">
                                <span class="material-icons" style="font-size: 16px;">visibility</span>
                            </button>
                            <button class="action-btn-small" onclick="editIdea('${idea.id}')" title="Edit">
                                <span class="material-icons" style="font-size: 16px;">edit</span>
                            </button>
                            <button class="action-btn-small delete" onclick="deleteIdea('${idea.id}')" title="Delete">
                                <span class="material-icons" style="font-size: 16px;">delete</span>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
        loading.style.display = 'none';
        content.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading manage panel:', error);
        loading.innerHTML = `
            <div class="error-message-admin">
                <span class="material-icons">error</span>
                Failed to load ideas: ${error.message}
            </div>
        `;
    }
}

// Add New Idea
document.getElementById('add-idea-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.querySelector('.submit-btn-admin');
    const messageDiv = document.getElementById('add-message');
    
    const formData = {
        title: document.getElementById('idea-title').value.trim(),
        category: document.getElementById('idea-category').value,
        description: document.getElementById('idea-description').value.trim(),
        author: document.getElementById('idea-author').value.trim(),
        tags: document.getElementById('idea-tags').value.trim()
    };
    
    // Validation
    if (!formData.title || !formData.category || !formData.description || !formData.author) {
        showMessage(messageDiv, 'error', 'Please fill in all required fields');
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="material-icons">hourglass_empty</span>Publishing...';
    
    try {
        // Create idea object
        const ideaData = {
            title: formData.title,
            description: formData.description,
            author: formData.author,
            category: formData.category,
            tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            upvotes: 0,
            views: 0,
            followers: 0,
            surveys: 0,
            investors: 0,
            steals: 0
        };
        
        // Add to Firestore
        const docRef = await window.firebaseDb.collection('ideas').add(ideaData);
        
        showMessage(messageDiv, 'success', `Idea "${formData.title}" published successfully!`);
        
        // Reset form
        document.getElementById('add-idea-form').reset();
        
        // Refresh data
        allIdeas = [];
        if (document.getElementById('manage-panel').classList.contains('active')) {
            loadManagePanel();
        }
        
    } catch (error) {
        console.error('Error adding idea:', error);
        showMessage(messageDiv, 'error', `Failed to publish idea: ${error.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-icons">publish</span>Publish Idea';
    }
});

// View Idea Details
async function viewIdeaDetails(ideaId) {
    const idea = allIdeas.find(i => i.id === ideaId);
    if (!idea) return;
    
    const investments = allInvestments[ideaId] || [];
    const steals = allSteals[ideaId] || [];
    
    const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    
    const modalHtml = `
        <div class="idea-detail-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 2rem;">
            <div style="background: var(--md-sys-color-surface); max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2rem; clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid var(--md-sys-color-outline-variant);">
                    <h2 style="font-family: 'Orbitron', monospace; color: var(--md-sys-color-on-surface); margin: 0;">${escapeHtml(idea.title)}</h2>
                    <button onclick="closeModal()" style="background: none; border: none; color: var(--md-sys-color-on-surface); cursor: pointer; font-size: 24px;">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <p><strong>Author:</strong> ${escapeHtml(idea.author)}</p>
                    <p><strong>Category:</strong> ${escapeHtml(idea.category)}</p>
                    <p><strong>Created:</strong> ${formatDate(idea.timestamp?.toDate() || new Date())}</p>
                    <p><strong>Description:</strong></p>
                    <div style="background: var(--md-sys-color-surface-container-low); padding: 1rem; margin-top: 0.5rem; border: 1px solid var(--md-sys-color-outline-variant);">
                        ${escapeHtml(idea.description)}
                    </div>
                    ${idea.tags && idea.tags.length > 0 ? `
                        <p><strong>Tags:</strong> ${idea.tags.map(tag => `<span style="background: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container); padding: 0.25rem 0.5rem; margin: 0.25rem; font-size: 0.8rem; border: 1px solid var(--md-sys-color-tertiary);">${escapeHtml(tag)}</span>`).join('')}</p>
                    ` : ''}
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <div>
                        <h3 style="font-family: 'Orbitron', monospace; color: var(--md-sys-color-primary); margin-bottom: 1rem;">INVESTMENTS (${investments.length})</h3>
                        <p style="margin-bottom: 1rem;"><strong>Total: ₹${totalInvested.toLocaleString()}</strong></p>
                        <div style="max-height: 200px; overflow-y: auto;">
                            ${investments.length > 0 ? investments.map(inv => `
                                <div style="background: var(--md-sys-color-surface-container-low); padding: 0.75rem; margin-bottom: 0.5rem; border: 1px solid var(--md-sys-color-outline-variant);">
                                    <strong>${escapeHtml(inv.name)}</strong><br>
                                    <small>₹${inv.amount?.toLocaleString()} • ${formatDate(inv.timestamp?.toDate() || new Date())}</small><br>
                                    <small>${escapeHtml(inv.email)}</small>
                                </div>
                            `).join('') : '<p style="color: var(--md-sys-color-on-surface-variant);">No investments yet</p>'}
                        </div>
                    </div>
                    
                    <div>
                        <h3 style="font-family: 'Orbitron', monospace; color: var(--md-sys-color-primary); margin-bottom: 1rem;">STEALS (${steals.length})</h3>
                        <div style="max-height: 200px; overflow-y: auto;">
                            ${steals.length > 0 ? steals.map(steal => `
                                <div style="background: var(--md-sys-color-surface-container-low); padding: 0.75rem; margin-bottom: 0.5rem; border: 1px solid var(--md-sys-color-outline-variant);">
                                    <strong>${escapeHtml(steal.name)}</strong><br>
                                    <small>${formatDate(steal.timestamp?.toDate() || new Date())}</small><br>
                                    <small>${escapeHtml(steal.email)}</small>
                                </div>
                            `).join('') : '<p style="color: var(--md-sys-color-on-surface-variant);">No steals yet</p>'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Close Modal
function closeModal() {
    const modal = document.querySelector('.idea-detail-modal');
    if (modal) {
        modal.remove();
    }
}

// Delete Idea
async function deleteIdea(ideaId) {
    const idea = allIdeas.find(i => i.id === ideaId);
    if (!idea) return;
    
    if (!confirm(`Are you sure you want to delete "${idea.title}"?\n\nThis will also delete all associated investments and steals. This action cannot be undone.`)) {
        return;
    }
    
    try {
        // Delete all subcollections first
        const batch = window.firebaseDb.batch();
        
        // Delete investments
        const investmentsSnapshot = await window.firebaseDb
            .collection('ideas')
            .doc(ideaId)
            .collection('investments')
            .get();
        
        investmentsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // Delete steals
        const stealsSnapshot = await window.firebaseDb
            .collection('ideas')
            .doc(ideaId)
            .collection('steals')
            .get();
        
        stealsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // Delete the idea document
        batch.delete(window.firebaseDb.collection('ideas').doc(ideaId));
        
        // Commit batch
        await batch.commit();
        
        alert(`Idea "${idea.title}" deleted successfully!`);
        
        // Refresh data
        allIdeas = [];
        allInvestments = {};
        allSteals = {};
        
        if (document.getElementById('overview-panel').classList.contains('active')) {
            loadOverview();
        } else if (document.getElementById('manage-panel').classList.contains('active')) {
            loadManagePanel();
        }
        
    } catch (error) {
        console.error('Error deleting idea:', error);
        alert(`Failed to delete idea: ${error.message}`);
    }
}

// Edit Idea (placeholder for future implementation)
function editIdea(ideaId) {
    alert('Edit functionality coming soon!');
}

// Utility Functions
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(date) {
    if (!date) return 'Unknown';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showMessage(container, type, message) {
    const className = type === 'success' ? 'success-message' : 'error-message-admin';
    const icon = type === 'success' ? 'check_circle' : 'error';
    
    container.innerHTML = `
        <div class="${className}">
            <span class="material-icons">${icon}</span>
            ${message}
        </div>
    `;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('idea-detail-modal')) {
        closeModal();
    }
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
}); 