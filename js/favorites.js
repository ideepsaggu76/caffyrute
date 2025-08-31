// Favorites Management
class FavoriteManager {
    constructor() {
        this.favorites = this.loadFavorites();
        this.initializeHeartButtons();
    }

    loadFavorites() {
        const saved = localStorage.getItem('caffyrute_favorites');
        return saved ? JSON.parse(saved) : [];
    }

    saveFavorites() {
        localStorage.setItem('caffyrute_favorites', JSON.stringify(this.favorites));
    }

    addToFavorites(cafeId, cafeData) {
        if (!this.isFavorite(cafeId)) {
            this.favorites.push({
                id: cafeId,
                data: cafeData,
                addedAt: new Date().toISOString()
            });
            this.saveFavorites();
            return true;
        }
        return false;
    }

    removeFromFavorites(cafeId) {
        const index = this.favorites.findIndex(fav => fav.id === cafeId);
        if (index > -1) {
            this.favorites.splice(index, 1);
            this.saveFavorites();
            return true;
        }
        return false;
    }

    isFavorite(cafeId) {
        return this.favorites.some(fav => fav.id === cafeId);
    }

    getFavorites() {
        return this.favorites;
    }

    initializeHeartButtons() {
        // Update heart button states on page load
        setTimeout(() => {
            document.querySelectorAll('.heart-btn').forEach(btn => {
                const onclickAttr = btn.getAttribute('onclick');
                if (onclickAttr) {
                    const cafeId = onclickAttr.match(/'([^']+)'/)[1];
                    this.updateHeartButton(btn, this.isFavorite(cafeId), false);
                }
            });
        }, 100);
    }

    updateHeartButton(button, isFavorited, animate = true) {
        const heartIcon = button.querySelector('i');
        
        if (isFavorited) {
            button.classList.add('favorited');
            if (heartIcon) {
                heartIcon.className = 'fas fa-heart';
            }
        } else {
            button.classList.remove('favorited');
            if (heartIcon) {
                heartIcon.className = 'far fa-heart';
            }
        }
    }
}

// Initialize favorite manager
const favoriteManager = new FavoriteManager();

// Toggle favorite function
function toggleFavorite(button, cafeId) {
    if (!button || !cafeId) {
        console.error('Missing button or cafeId for toggleFavorite:', button, cafeId);
        return;
    }

    // Find the cafe data
    let cafeData = null;
    
    // Get cafe from global array if possible
    if (window.caffyRuteApp && window.caffyRuteApp.cafes) {
        const cafe = window.caffyRuteApp.cafes.find(c => c.id === cafeId);
        if (cafe) {
            cafeData = {
                id: cafe.id,
                name: cafe.name,
                image: cafe.photos && cafe.photos.length > 0 ? cafe.photos[0].url : '',
                rating: cafe.rating || 0,
                reviewCount: cafe.reviewCount || 0,
                address: cafe.address || '',
                distance: cafe.distance || 0,
                status: cafe.isOpen === true ? 'Open' : (cafe.isOpen === false ? 'Closed' : 'Hours unknown')
            };
        }
    }
    
    // If we couldn't get the cafe data from the global array, try to extract it from the DOM
    if (!cafeData) {
        try {
            const cafeItem = button.closest('.cafe-item') || button.closest('.cafe-details-page');
            
            if (cafeItem) {
                // For cafe list item
                const name = cafeItem.querySelector('h3') ? cafeItem.querySelector('h3').textContent : 'Unknown Cafe';
                const imageEl = cafeItem.querySelector('img');
                const ratingEl = cafeItem.querySelector('.rating-text');
                const distanceEl = cafeItem.querySelector('.distance');
                
                cafeData = {
                    id: cafeId,
                    name: name,
                    image: imageEl ? imageEl.src : '',
                    rating: ratingEl ? ratingEl.textContent : '0 (0)',
                    distance: distanceEl ? distanceEl.textContent : '0 km',
                    address: '',
                    status: ''
                };
            } else if (document.getElementById('cafe-details-page')) {
                // For cafe details page
                const detailsPage = document.getElementById('cafe-details-page');
                const name = detailsPage.querySelector('h1') ? detailsPage.querySelector('h1').textContent : 'Unknown Cafe';
                const imageEl = detailsPage.querySelector('.cafe-details-header img');
                
                cafeData = {
                    id: cafeId,
                    name: name,
                    image: imageEl ? imageEl.src : '',
                    rating: '0 (0)',
                    distance: '0 km',
                    address: '',
                    status: ''
                };
            }
        } catch (error) {
            console.error('Error extracting cafe data from DOM:', error);
            // Create minimal data
            cafeData = { id: cafeId, name: 'Cafe', image: '' };
        }
    }

    if (favoriteManager.isFavorite(cafeId)) {
        // Remove from favorites
        favoriteManager.removeFromFavorites(cafeId);
        
        // Update UI
        const heartIcon = button.querySelector('i');
        if (heartIcon) {
            heartIcon.className = 'far fa-heart';
        }
        button.classList.remove('favorited');
        
        showToast('<i class="fas fa-heart-broken" style="color: #e91e63;"></i> Removed from favorites', 'error');
    } else {
        // Add to favorites
        favoriteManager.addToFavorites(cafeId, cafeData);
        
        // Update UI
        const heartIcon = button.querySelector('i');
        if (heartIcon) {
            heartIcon.className = 'fas fa-heart';
        }
        button.classList.add('favorited');
        
        showToast('<i class="fas fa-heart" style="color: #e91e63;"></i> Added to favorites!', 'success');
    }
}

// Toast notification function
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast || !toastMessage) return;
    
    // Clear any existing timeout
    if (window.toastTimeout) {
        clearTimeout(window.toastTimeout);
    }
    
    // Set message and type
    toastMessage.innerHTML = message;
    toast.className = `toast ${type}`;
    
    // Show toast
    toast.classList.add('show');
    
    // Hide after 3 seconds
    window.toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Export for use in other pages
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FavoriteManager, favoriteManager, showToast };
}
