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
    
    // Initialize Google Maps functionality
    initializeGoogleMapsFeatures();
});

// Initialize Google Maps related features
function initializeGoogleMapsFeatures() {
    // Map toggle functionality
    const toggleMapBtn = document.getElementById('toggle-map');
    const mapContainer = document.getElementById('map-container');
    let mapVisible = false;
    
    if (toggleMapBtn && mapContainer) {
        toggleMapBtn.addEventListener('click', function() {
            mapVisible = !mapVisible;
            
            if (mapVisible) {
                mapContainer.classList.add('expanded');
                toggleMapBtn.innerHTML = '<i class="fas fa-list"></i> Show List';
            } else {
                mapContainer.classList.remove('expanded');
                toggleMapBtn.innerHTML = '<i class="fas fa-map"></i> Show Map';
            }
        });
    }
    
    // Sort functionality
    const sortSelect = document.getElementById('sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            if (window.caffyRuteApp && window.caffyRuteApp.cafes) {
                sortCafes(this.value);
            }
        });
    }
    
    // Radius filter functionality
    const radiusSelect = document.getElementById('radius');
    if (radiusSelect) {
        radiusSelect.addEventListener('change', function() {
            if (window.caffyRuteApp) {
                const radius = parseInt(this.value);
                window.caffyRuteApp.searchNearbyCafes(radius);
            }
        });
    }
    
    // Enhanced search functionality
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    function performSearch() {
        const query = searchInput.value.trim();
        if (query && window.caffyRuteApp) {
            document.getElementById('loading-cafes').style.display = 'flex';
            document.getElementById('cafe-list').style.display = 'none';
            window.caffyRuteApp.searchCafes(query);
        } else if (!query && window.caffyRuteApp) {
            // If empty search, show all nearby cafes
            window.caffyRuteApp.searchNearbyCafes();
        }
    }
    
    function sortCafes(sortBy) {
        if (!window.caffyRuteApp || !window.caffyRuteApp.cafes) return;
        
        const cafes = window.caffyRuteApp.cafes;
        
        switch (sortBy) {
            case 'rating':
                cafes.sort((a, b) => b.rating - a.rating);
                break;
            case 'distance':
                cafes.sort((a, b) => a.distance - b.distance);
                break;
            case 'price':
                cafes.sort((a, b) => a.priceLevel - b.priceLevel);
                break;
            case 'reviews':
                cafes.sort((a, b) => b.reviewCount - a.reviewCount);
                break;
        }
        
        window.caffyRuteApp.displayCafes();
    }
}

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

// Google Maps Integration Functions
function initGoogleMapsIntegration() {
    // Map toggle functionality
    const toggleMapBtn = document.getElementById('toggle-map');
    const mapContainer = document.querySelector('.map-container');
    
    if (toggleMapBtn && mapContainer) {
        toggleMapBtn.addEventListener('click', function() {
            if (mapContainer.classList.contains('expanded')) {
                mapContainer.classList.remove('expanded');
                this.innerHTML = '<i class="fas fa-map"></i> Show Map';
            } else {
                mapContainer.classList.add('expanded');
                this.innerHTML = '<i class="fas fa-map"></i> Hide Map';
                // Trigger map resize after animation
                setTimeout(() => {
                    if (window.caffyRuteApp && window.caffyRuteApp.map) {
                        google.maps.event.trigger(window.caffyRuteApp.map, 'resize');
                        if (window.caffyRuteApp.userLocation) {
                            window.caffyRuteApp.map.setCenter(window.caffyRuteApp.userLocation);
                        }
                    }
                }, 300);
            }
        });
    }

    // Enhanced view toggle to include map view
    const viewButtons = document.querySelectorAll('.view-btn[data-view="map"]');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const cafeList = document.querySelector('.cafe-list');
            if (mapContainer && cafeList) {
                mapContainer.style.display = 'block';
                mapContainer.classList.add('expanded');
                cafeList.style.display = 'none';
                
                // Update toggle button
                if (toggleMapBtn) {
                    toggleMapBtn.innerHTML = '<i class="fas fa-map"></i> Hide Map';
                }
                
                // Trigger map resize
                setTimeout(() => {
                    if (window.caffyRuteApp && window.caffyRuteApp.map) {
                        google.maps.event.trigger(window.caffyRuteApp.map, 'resize');
                        if (window.caffyRuteApp.userLocation) {
                            window.caffyRuteApp.map.setCenter(window.caffyRuteApp.userLocation);
                        }
                    }
                }, 100);
            }
        });
    });

    // Enhanced search functionality with Google Places
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput && searchBtn) {
        // Override existing search functionality
        searchBtn.removeEventListener('click', searchBtn.onclick);
        
        searchBtn.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query && window.caffyRuteApp) {
                window.caffyRuteApp.searchCafes(query);
                showToast('🔍 Searching for: ' + query, 'success');
            }
        });

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }

    // Enhanced filter functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.textContent.trim();
            if (window.caffyRuteApp) {
                window.caffyRuteApp.applyFilter(filter);
                showToast('🎯 Applied filter: ' + filter, 'success');
            }
        });
    });

    // Enhanced sort functionality
    const sortSelect = document.getElementById('sort');
    if (sortSelect) {
        // Remove existing event listener and add enhanced one
        const newSortSelect = sortSelect.cloneNode(true);
        sortSelect.parentNode.replaceChild(newSortSelect, sortSelect);
        
        newSortSelect.addEventListener('change', function() {
            const sortBy = this.value;
            if (window.caffyRuteApp) {
                window.caffyRuteApp.sortCafes(sortBy);
                showToast('📊 Sorted by: ' + sortBy, 'success');
            }
        });
    }

    // Radius filter functionality
    const radiusSelect = document.getElementById('radius');
    if (radiusSelect) {
        radiusSelect.addEventListener('change', function() {
            const radius = parseInt(this.value);
            if (window.caffyRuteApp) {
                window.caffyRuteApp.updateSearchRadius(radius);
                const kmValue = (radius / 1000).toFixed(1);
                showToast(`📍 Search radius: ${kmValue} km`, 'success');
            }
        });
    }
}

// Enhanced toast function for Google Maps integration
function showLocationToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (toast && toastMessage) {
        // Add location icon based on type
        let icon = '📍';
        if (type === 'error') icon = '❌';
        if (type === 'success') icon = '✅';
        if (type === 'loading') icon = '🔄';
        
        toastMessage.innerHTML = `${icon} ${message}`;
        toast.className = `toast show ${type}`;
        
        // Auto hide after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }
}

// Initialize Google Maps integration when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the integration after a short delay to ensure other scripts are loaded
    setTimeout(initGoogleMapsIntegration, 500);
});
