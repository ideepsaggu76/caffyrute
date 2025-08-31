// Main JavaScript functionality

// Touch device detection
function detectTouch() {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (hasTouch) {
        document.documentElement.classList.add('touch');
    } else {
        document.documentElement.classList.add('no-touch');
    }
}

// Initialize touch detection immediately
detectTouch();

// Loading Screen
window.addEventListener('load', function() {
    const loadingScreen = document.getElementById('loading-screen');
    
    // Hide loading screen after a minimum of 2 seconds
    setTimeout(() => {
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            
            // Remove from DOM after transition completes
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }
    }, 2000);
});

document.addEventListener('DOMContentLoaded', function() {
    // Initialize toast (ensure it's hidden)
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.remove('show');
        toast.style.opacity = '0';
        toast.style.visibility = 'hidden';
    }

    // Enhanced Mobile navigation toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const body = document.body;

    if (hamburger && navMenu) {
        // Toggle mobile menu
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (navMenu.classList.contains('active')) {
                body.style.overflow = 'hidden';
            } else {
                body.style.overflow = '';
            }
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                body.style.overflow = '';
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target) && navMenu.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                body.style.overflow = '';
            }
        });
        
        // Handle orientation change
        window.addEventListener('orientationchange', function() {
            if (navMenu.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                body.style.overflow = '';
            }
        });
        
        // Handle escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                body.style.overflow = '';
            }
        });
    }

    // Filter buttons functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Add filter functionality here when implementing search
            const filterType = this.textContent.trim();
            console.log('Filter selected:', filterType);
        });
    });

    // View toggle functionality
    const viewButtons = document.querySelectorAll('.view-btn');
    const cafeList = document.querySelector('.cafe-list');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            viewButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const view = this.getAttribute('data-view');
            if (view === 'grid') {
                cafeList.style.display = 'grid';
                cafeList.style.gridTemplateColumns = 'repeat(auto-fit, minmax(350px, 1fr))';
                cafeList.style.gap = '2rem';
                
                // Modify cafe items for grid view
                document.querySelectorAll('.cafe-item').forEach(item => {
                    item.style.flexDirection = 'column';
                    item.style.textAlign = 'center';
                    
                    const image = item.querySelector('.cafe-image');
                    if (image) {
                        image.style.width = '100%';
                        image.style.maxWidth = '300px';
                    }
                    
                    const actions = item.querySelector('.cafe-actions');
                    if (actions) {
                        actions.style.flexDirection = 'row';
                        actions.style.width = '100%';
                        actions.style.justifyContent = 'center';
                    }
                });
            } else {
                cafeList.style.display = 'flex';
                cafeList.style.flexDirection = 'column';
                cafeList.style.gridTemplateColumns = 'none';
                
                // Reset cafe items for list view
                document.querySelectorAll('.cafe-item').forEach(item => {
                    item.style.flexDirection = 'row';
                    item.style.textAlign = 'left';
                    
                    const image = item.querySelector('.cafe-image');
                    if (image) {
                        image.style.width = '200px';
                        image.style.maxWidth = 'none';
                    }
                    
                    const actions = item.querySelector('.cafe-actions');
                    if (actions) {
                        actions.style.flexDirection = 'column';
                        actions.style.width = 'auto';
                        actions.style.justifyContent = 'flex-start';
                    }
                });
            }
        });
    });

    // Search functionality (placeholder)
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query) {
                console.log('Searching for:', query);
                // Implement search functionality here
                showToast('🔍 Searching for: ' + query, 'success');
            }
        });

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }

    // Sort functionality
    const sortSelect = document.getElementById('sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortBy = this.value;
            console.log('Sorting by:', sortBy);
            // Implement sorting functionality here
            showToast('📊 Sorting by: ' + sortBy, 'success');
        });
    }

    // Smooth scrolling for anchor links
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

    // Form submission handling
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showToast('📧 Message sent successfully!', 'success');
            this.reset();
        });
    }

    // Add loading animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    });

    document.querySelectorAll('.cafe-item').forEach(item => {
        observer.observe(item);
    });
});

// Utility function to update page title and active nav
function updatePageNavigation(pageName) {
    // Update active navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.textContent.trim().toLowerCase() === pageName.toLowerCase()) {
            link.classList.add('active');
        }
    });
}
