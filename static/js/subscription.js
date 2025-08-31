// Email Subscription Widget
class SubscriptionWidget {
    constructor() {
        this.isSubscribing = false;
        this.init();
    }

    init() {
        // Disabled auto-show floating widget
        // Can be enabled if needed later
    }

    isAlreadySubscribed() {
        return localStorage.getItem('kks_subscribed') === 'true';
    }

    markAsSubscribed() {
        localStorage.setItem('kks_subscribed', 'true');
    }

    createSubscriptionWidget(options = {}) {
        const {
            title = "Subscribe for Updates",
            description = "",
            className = "",
            showIcon = false,
            inline = true,
            placeholder = "your@email.com"
        } = options;

        const widgetId = 'subscription-widget-' + Date.now();
        
        return `
            <div class="subscription-widget ${className}" id="${widgetId}">
                <div class="subscription-content">
                    ${showIcon ? `
                        <div class="subscription-icon">
                            <span class="material-icons">notifications_active</span>
                        </div>
                    ` : ''}
                    
                    ${title ? `<h3 class="subscription-title">${title}</h3>` : ''}
                    ${description ? `<p class="subscription-description">${description}</p>` : ''}
                    
                    <form class="subscription-form ${inline ? 'inline' : ''}" data-widget-id="${widgetId}">
                        <input 
                            type="email" 
                            class="subscription-input" 
                            placeholder="${placeholder}"
                            required
                            autocomplete="email"
                        >
                        <button type="submit" class="subscription-button">
                            Subscribe
                        </button>
                    </form>
                    
                    <div class="subscription-loading">
                        <div class="loading-spinner"></div>
                        <span>Subscribing...</span>
                    </div>
                    
                    <div class="subscription-message"></div>
                </div>
            </div>
        `;
    }

    createMiniSubscriptionWidget() {
        return this.createSubscriptionWidget({
            title: "Get Notified",
            description: "New posts & ideas delivered to your inbox",
            className: "mini-subscription",
            showIcon: false,
            inline: true,
            placeholder: "your@email.com"
        });
    }

    createFloatingWidget() {
        const widgetId = 'floating-subscription-widget';
        
        return `
            <div class="subscription-widget floating-subscription" id="${widgetId}">
                <button class="close-floating" onclick="subscriptionWidget.hideFloatingWidget()">
                    <span class="material-icons">close</span>
                </button>
                
                <div class="subscription-content">
                    <div class="subscription-icon">
                        <span class="material-icons">rocket_launch</span>
                    </div>
                    
                    <h3 class="subscription-title">Don't Miss Out!</h3>
                    <p class="subscription-description">
                        Get the latest engineering insights and breakthrough startup ideas delivered to your inbox
                    </p>
                    
                    <form class="subscription-form" data-widget-id="${widgetId}">
                        <input 
                            type="email" 
                            class="subscription-input" 
                            placeholder="Enter your email address"
                            required
                            autocomplete="email"
                        >
                        <button type="submit" class="subscription-button">
                            <span class="material-icons">notifications_active</span>
                            Subscribe Now
                        </button>
                    </form>
                    
                    <div class="subscription-loading">
                        <div class="loading-spinner"></div>
                        <span>Subscribing...</span>
                    </div>
                    
                    <div class="subscription-message"></div>
                </div>
            </div>
        `;
    }

    showFloatingWidget() {
        if (document.getElementById('floating-subscription-widget')) {
            return; // Already showing
        }

        document.body.insertAdjacentHTML('beforeend', this.createFloatingWidget());
        this.attachEventListeners('floating-subscription-widget');
        
        // Animate in
        setTimeout(() => {
            const widget = document.getElementById('floating-subscription-widget');
            if (widget) {
                widget.classList.add('show');
            }
        }, 100);

        // Auto-hide after 30 seconds if no interaction
        setTimeout(() => {
            if (!this.isAlreadySubscribed()) {
                this.hideFloatingWidget();
            }
        }, 30000);
    }

    hideFloatingWidget() {
        const widget = document.getElementById('floating-subscription-widget');
        if (widget) {
            widget.classList.remove('show');
            setTimeout(() => {
                widget.remove();
            }, 300);
        }
    }

    attachEventListeners(widgetId) {
        const widget = document.getElementById(widgetId);
        if (!widget) return;

        const form = widget.querySelector('.subscription-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubscription(e, widgetId));
        }
    }

    async handleSubscription(event, widgetId) {
        event.preventDefault();
        
        if (this.isSubscribing) return;
        
        const widget = document.getElementById(widgetId);
        const form = widget.querySelector('.subscription-form');
        const input = widget.querySelector('.subscription-input');
        const button = widget.querySelector('.subscription-button');
        const loading = widget.querySelector('.subscription-loading');
        const message = widget.querySelector('.subscription-message');
        
        const email = input.value.trim();
        
        if (!email || !this.isValidEmail(email)) {
            this.showMessage(message, 'Please enter a valid email address', 'error');
            return;
        }

        // Show loading state
        this.isSubscribing = true;
        button.disabled = true;
        loading.classList.add('show');
        message.classList.remove('show');

        try {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage(message, '🎉 Successfully subscribed! Check your email for confirmation.', 'success');
                this.markAsSubscribed();
                input.value = '';
                
                // Hide floating widget after success
                if (widgetId === 'floating-subscription-widget') {
                    setTimeout(() => this.hideFloatingWidget(), 3000);
                }
                
                // Track subscription event
                this.trackSubscription(email);
                
            } else {
                this.showMessage(message, data.error || 'Subscription failed. Please try again.', 'error');
            }

        } catch (error) {
            console.error('Subscription error:', error);
            this.showMessage(message, 'Network error. Please check your connection and try again.', 'error');
        } finally {
            this.isSubscribing = false;
            button.disabled = false;
            loading.classList.remove('show');
        }
    }

    showMessage(messageElement, text, type) {
        messageElement.textContent = text;
        messageElement.className = `subscription-message ${type} show`;
        
        // Auto-hide error messages after 5 seconds
        if (type === 'error') {
            setTimeout(() => {
                messageElement.classList.remove('show');
            }, 5000);
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    trackSubscription(email) {
        try {
            // Track with analytics if available
            if (typeof gtag !== 'undefined') {
                gtag('event', 'subscribe', {
                    'event_category': 'engagement',
                    'event_label': 'email_subscription'
                });
            }
            
            console.log(`Email subscription tracked: ${email.substring(0, 3)}***`);
        } catch (error) {
            console.log('Analytics tracking failed:', error);
        }
    }

    // Initialize widgets when DOM is ready
    initializeWidgets() {
        // Find all subscription widget containers and initialize them
        document.querySelectorAll('[data-subscription-widget]').forEach(container => {
            const options = {
                title: container.dataset.title,
                description: container.dataset.description,
                className: container.dataset.className || '',
                inline: container.dataset.inline === 'true'
            };
            
            container.innerHTML = this.createSubscriptionWidget(options);
            
            // Get the generated widget ID and attach listeners
            const widget = container.querySelector('.subscription-widget');
            if (widget) {
                this.attachEventListeners(widget.id);
            }
        });
    }

    // Add subscription widget to modal
    addToModal(modalElement, position = 'footer') {
        if (this.isAlreadySubscribed()) return;

        const widget = this.createSubscriptionWidget({
            title: "Subscribe for Updates",
            description: "",
            className: "modal-subscription",
            inline: true
        });

        if (position === 'footer') {
            const footer = modalElement.querySelector('.modal-footer');
            if (footer) {
                footer.insertAdjacentHTML('beforeend', `<div class="modal-subscription">${widget}</div>`);
            }
        } else if (position === 'body') {
            const body = modalElement.querySelector('.modal-body .modal-content-scroll');
            if (body) {
                body.insertAdjacentHTML('beforeend', widget);
            }
        }

        // Attach event listeners to the newly added widget
        const newWidget = modalElement.querySelector('.subscription-widget');
        if (newWidget) {
            this.attachEventListeners(newWidget.id);
        }
    }

    // Add subscription widget to page content
    addToPage(containerSelector, options = {}) {
        const container = document.querySelector(containerSelector);
        if (!container || this.isAlreadySubscribed()) return;

        const widget = this.createSubscriptionWidget({
            title: "Get KKS Updates",
            description: "Stay informed about new engineering posts and innovative startup ideas",
            className: "page-subscription",
            inline: true,
            ...options
        });

        container.insertAdjacentHTML('beforeend', widget);

        // Attach event listeners
        const newWidget = container.querySelector('.subscription-widget');
        if (newWidget) {
            this.attachEventListeners(newWidget.id);
        }
    }
}

// Global instance
const subscriptionWidget = new SubscriptionWidget();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    subscriptionWidget.initializeWidgets();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubscriptionWidget;
}