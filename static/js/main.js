// Theme Toggle Functionality
class ThemeToggle {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.toggleButton = document.getElementById('theme-toggle');
        this.themeIcon = document.querySelector('.theme-icon');
        
        this.init();
    }

    init() {
        // Set initial theme
        this.setTheme(this.currentTheme);
        
        // Add event listener to toggle button
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => this.toggle());
        }
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update icon
        if (this.themeIcon) {
            this.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    toggle() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
}

// Air Quality Monitor JavaScript
class AirQualityMonitor {
    constructor() {
        this.currentLocation = { lat: 12.9716, lon: 77.5946 }; // Default to Bangalore
    }
}

// Initialize when DOM is loaded
let airQualityMonitor;
let themeToggle;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing components...');
    
    // Initialize theme toggle first
    themeToggle = new ThemeToggle();
    
    // Wait a bit to ensure all elements are rendered
    setTimeout(() => {
        const customDropdown = document.getElementById('customDropdown');
        console.log('Looking for customDropdown:', customDropdown);
        
        if (customDropdown) {
            console.log('Initializing air quality monitor...');
            airQualityMonitor = new AirQualityMonitor();
        } else {
            console.error('Air quality monitor elements not found in DOM');
            // List all elements with IDs for debugging
            const allElements = document.querySelectorAll('[id]');
            console.log('Available elements with IDs:', Array.from(allElements).map(el => el.id));
        }
    }, 100);
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (airQualityMonitor) {
        airQualityMonitor.destroy();
    }
}); 