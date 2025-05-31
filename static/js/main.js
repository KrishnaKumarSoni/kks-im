// Theme Toggle Functionality
class ThemeToggle {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.toggleButton = document.getElementById('theme-toggle');
        this.moonIcon = document.querySelector('.moon-icon');
        this.sunIcon = document.querySelector('.sun-icon');
        
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
        
        // Icons are handled by CSS now, no need to manually toggle
    }

    toggle() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
}

// Initialize theme toggle when DOM is loaded
let themeToggle;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing theme toggle...');
    
    // Initialize theme toggle only
    themeToggle = new ThemeToggle();
}); 