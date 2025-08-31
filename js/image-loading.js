// Image loading logic for CaffyRute
document.addEventListener('DOMContentLoaded', () => {
    // Set up image loading events
    setupImageLoading();
    
    // Show cache notification if content was loaded from cache
    if (window.cacheManager && window.cacheManager.getCacheStats().cafes > 0) {
        showCacheNotification();
    }
});

// Sets up image loading observers for cafe images
function setupImageLoading() {
    // Use IntersectionObserver to load images when they come into view
    const imgObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const actualSrc = img.getAttribute('data-actual-src');
                
                if (actualSrc && actualSrc !== img.src) {
                    // Start loading the actual image
                    if (window.imageLoader) {
                        window.imageLoader.applyImageToElement(
                            img, 
                            actualSrc, 
                            img.alt,
                            []
                        );
                    } else {
                        img.src = actualSrc;
                    }
                    
                    // Add load event to remove loading animation
                    img.onload = () => {
                        img.classList.add('loaded');
                        const loader = img.parentElement.querySelector('.image-loader');
                        if (loader) {
                            loader.style.opacity = '0';
                        }
                    };
                }
                
                // Stop observing once loaded
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '100px', // Load images a bit before they come into view
        threshold: 0.1
    });
    
    // Start observing all cafe images
    function observeAllCafeImages() {
        document.querySelectorAll('.cafe-item img').forEach(img => {
            imgObserver.observe(img);
        });
    }
    
    // Initial observation
    observeAllCafeImages();
    
    // Re-observe after content changes
    const cafeList = document.querySelector('.cafe-list');
    if (cafeList) {
        // Use MutationObserver to detect when new cafe items are added
        const listObserver = new MutationObserver((mutations) => {
            let shouldCheckImages = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldCheckImages = true;
                }
            });
            
            if (shouldCheckImages) {
                setTimeout(observeAllCafeImages, 100);
            }
        });
        
        listObserver.observe(cafeList, {
            childList: true,
            subtree: false
        });
    }
}

// Shows a notification when content is loaded from cache
function showCacheNotification() {
    // Check if the notification already exists
    let notification = document.querySelector('.cache-notification');
    
    // Create if not exists
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'cache-notification';
        notification.innerHTML = '<i class="fas fa-database"></i> Using cached results';
        document.body.appendChild(notification);
    }
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
        
        // Hide after a few seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }, 1000);
}
