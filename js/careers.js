// Careers Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Notification toggle functionality
    let notificationsEnabled = localStorage.getItem('caffyrute_notifications') === 'true';
    updateNotificationButton();

    // Check if user has already enabled notifications
    function updateNotificationButton() {
        const button = document.querySelector('.btn-secondary');
        const text = document.getElementById('notification-text');
        
        if (notificationsEnabled) {
            button.classList.add('notification-enabled');
            text.textContent = 'Notifications On';
            button.querySelector('i').className = 'fas fa-bell';
        } else {
            button.classList.remove('notification-enabled');
            text.textContent = 'Notify Me';
            button.querySelector('i').className = 'far fa-bell';
        }
    }

    // Add smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add animation to role cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards for animation
    document.querySelectorAll('.culture-item, .role-card, .benefit-item').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Add hover effects to team member card
    const teamCard = document.querySelector('.team-member-card');
    if (teamCard) {
        teamCard.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });

        teamCard.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    }

    // Add click tracking for CTA buttons
    document.querySelectorAll('.cta-actions .btn-primary, .cta-actions .btn-secondary').forEach(button => {
        button.addEventListener('click', function() {
            const action = this.textContent.trim();
            console.log('CTA clicked:', action);
            
            // You can add analytics tracking here
            if (typeof gtag !== 'undefined') {
                gtag('event', 'click', {
                    event_category: 'careers',
                    event_label: action
                });
            }
        });
    });

    // Add form validation for future use
    const contactForms = document.querySelectorAll('form');
    contactForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            showToast('Thank you for your interest! We\'ll be in touch.', 'success');
        });
    });
});

// Global function for notification toggle
function toggleNotifications() {
    const isEnabled = localStorage.getItem('caffyrute_notifications') === 'true';
    
    if (isEnabled) {
        localStorage.setItem('caffyrute_notifications', 'false');
        showToast('🔔 Notifications disabled', 'error');
    } else {
        localStorage.setItem('caffyrute_notifications', 'true');
        showToast('🔔 You\'ll be notified when we have openings!', 'success');
    }
    
    // Update button appearance
    setTimeout(() => {
        location.reload();
    }, 1500);
}

// Enhanced toast function with career-specific styling
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Add keyboard navigation for better accessibility
document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
    }
});

document.addEventListener('mousedown', function(e) {
    document.body.classList.remove('keyboard-navigation');
});

// Add CSS for keyboard navigation
const keyboardCSS = `
.keyboard-navigation *:focus {
    outline: 2px solid var(--gold-accent) !important;
    outline-offset: 2px !important;
}
`;

const style = document.createElement('style');
style.textContent = keyboardCSS;
document.head.appendChild(style);
