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
let allProfiles = [];
let filteredProfiles = [];

// DOM Elements
const profilesGrid = document.getElementById('profiles-grid');
const loadingSpinner = document.getElementById('loading-spinner');
const noProfiles = document.getElementById('no-profiles');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadProfiles();
});

// Load profiles from Firebase
async function loadProfiles() {
    try {
        showLoading(true);
        
        const snapshot = await db.collection('hire_them')
            .where('availability', '==', 'available')
            .get();
        
        allProfiles = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            allProfiles.push({
                id: doc.id,
                ...data
            });
        });
        
        // Sort by timestamp (most recent first) in JavaScript since we can't use orderBy with where
        allProfiles.sort((a, b) => {
            const aTime = a.timestamp?.toDate() || new Date(0);
            const bTime = b.timestamp?.toDate() || new Date(0);
            return bTime - aTime;
        });
        
        filteredProfiles = [...allProfiles];
        displayProfiles();
        
    } catch (error) {
        console.error('Error loading profiles:', error);
        showError('Failed to load profiles. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Display profiles in grid
function displayProfiles() {
    if (filteredProfiles.length === 0) {
        profilesGrid.style.display = 'none';
        noProfiles.style.display = 'block';
        return;
    }
    
    profilesGrid.style.display = 'grid';
    noProfiles.style.display = 'none';
    
    profilesGrid.innerHTML = filteredProfiles.map(profile => createProfileCard(profile)).join('');
}

// Create profile card HTML
function createProfileCard(profile) {
    const skillsHtml = (profile.skills || []).slice(0, 5).map(skill => 
        `<span class="skill-tag">${skill}</span>`
    ).join('');
    
    const linksHtml = createProfileLinks(profile);
    
    return `
        <div class="profile-wrapper ${profile.featured ? 'featured' : ''}">
            <div class="profile-card">
                <div class="profile-header">
                    <div class="profile-image">
                        ${profile.image_url ? 
                            `<img src="${profile.image_url}" alt="${profile.name}">` :
                            `<div class="default-avatar">${getInitials(profile.name)}</div>`
                        }
                    </div>
                    <div class="profile-info">
                        <h3 class="profile-name">${profile.name}</h3>
                        <p class="profile-title">${profile.title}</p>
                    </div>
                </div>
                
                <div class="profile-content">
                    <div class="superpower-section">
                        <h4 class="superpower-label">Superpower</h4>
                        <p class="superpower-text">${profile.superpower}</p>
                    </div>
                    
                    ${profile.skills && profile.skills.length > 0 ? `
                        <div class="skills-section">
                            <h4 class="skills-label">Skills</h4>
                            <div class="skills-grid">
                                ${skillsHtml}
                                ${profile.skills.length > 5 ? `<span class="skill-tag">+${profile.skills.length - 5}</span>` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${profile.location ? `
                        <div class="location-section">
                            <span class="material-icons">location_on</span>
                            <span class="location-text">${profile.location}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="profile-actions">
                    <div class="profile-social-links">
                        ${linksHtml}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Create profile links
function createProfileLinks(profile) {
    const links = [];
    
    if (profile.linkedin) {
        links.push(`<a href="${profile.linkedin}" target="_blank" class="profile-link linkedin" title="LinkedIn"></a>`);
    }
    
    if (profile.github) {
        links.push(`<a href="${profile.github}" target="_blank" class="profile-link github" title="GitHub"></a>`);
    }
    
    if (profile.portfolio) {
        links.push(`<a href="${profile.portfolio}" target="_blank" class="profile-link portfolio" title="Portfolio"></a>`);
    }
    
    if (profile.email) {
        links.push(`<a href="mailto:${profile.email}" class="profile-link email" title="Email"></a>`);
    }
    
    return links.join('');
}

// Get initials for default avatar
function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// Get availability class for styling
function getAvailabilityClass(availability) {
    switch (availability) {
        case 'available': return 'available';
        case 'busy': return 'busy';
        case 'unavailable': return 'unavailable';
        default: return 'unknown';
    }
}

// Get availability display text
function getAvailabilityText(availability) {
    switch (availability) {
        case 'available': return 'Available';
        case 'busy': return 'Busy';
        case 'unavailable': return 'Unavailable';
        default: return 'Unknown';
    }
}

// Show/hide loading spinner
function showLoading(show) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
}

// Show error message
function showError(message) {
    // Create error toast or use existing error display method
    console.error(message);
} 