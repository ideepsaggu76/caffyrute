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
    const heartIcon = button.querySelector('i');
    const cafeItem = button.closest('.cafe-item');
    
    // Extract cafe data
    const cafeData = {
        name: cafeItem.querySelector('h3').textContent,
        image: cafeItem.querySelector('.cafe-image img').src,
        rating: cafeItem.querySelector('.rating-text').textContent,
        description: cafeItem.querySelector('.cafe-description').textContent,
        features: Array.from(cafeItem.querySelectorAll('.feature')).map(f => f.textContent.trim()),
        distance: cafeItem.querySelector('.distance').textContent,
        status: cafeItem.querySelector('.status').textContent
    };

    if (favoriteManager.isFavorite(cafeId)) {
        // Remove from favorites
        favoriteManager.removeFromFavorites(cafeId);
        button.classList.remove('favorited');
        heartIcon.className = 'far fa-heart';
        showToast('<i class="fas fa-heart-broken" style="color: #e91e63;"></i> Removed from favorites', 'error');
    } else {
        // Add to favorites
        favoriteManager.addToFavorites(cafeId, cafeData);
        button.classList.add('favorited');
        heartIcon.className = 'fas fa-heart';
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
