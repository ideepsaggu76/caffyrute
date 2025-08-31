// Favorites Page Functionality
class FavoritesPage {
    constructor() {
        this.favoriteManager = favoriteManager;
        this.currentCafeToRemove = null;
        this.init();
    }

    init() {
        this.renderFavorites();
        this.setupEventListeners();
        this.updateStats();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-favorites');
        searchInput.addEventListener('input', () => {
            this.filterFavorites(searchInput.value);
        });

        // Sort functionality
        const sortSelect = document.getElementById('sort-favorites');
        sortSelect.addEventListener('change', () => {
            this.sortFavorites(sortSelect.value);
        });

        // Modal close functionality
        const closeModal = document.querySelector('.close-modal');
        closeModal.addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal when clicking outside
        const modal = document.getElementById('confirm-modal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    renderFavorites() {
        const favoritesList = document.getElementById('favorites-list');
        const emptyState = document.getElementById('empty-favorites');
        const favorites = this.favoriteManager.getFavorites();

        if (favorites.length === 0) {
            favoritesList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        favoritesList.style.display = 'flex';
        emptyState.style.display = 'none';

        favoritesList.innerHTML = favorites.map(favorite => 
            this.createFavoriteItemHTML(favorite)
        ).join('');

        // Add event listeners to remove buttons
        favoritesList.querySelectorAll('.remove-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cafeId = e.target.closest('.favorite-item').dataset.cafeId;
                this.showRemoveConfirmation(cafeId);
            });
        });
    }

    createFavoriteItemHTML(favorite) {
        const addedDate = new Date(favorite.addedAt).toLocaleDateString();
        const stars = this.generateStarsHTML(favorite.data.rating);
        
        return `
            <div class="favorite-item fade-in" data-cafe-id="${favorite.id}">
                <div class="favorite-image">
                    <img src="${favorite.data.image}" alt="${favorite.data.name}">
                </div>
                <div class="favorite-details">
                    <h3>${favorite.data.name}</h3>
                    <div class="favorite-rating">
                        <div class="stars">${stars}</div>
                        <span class="rating-text">${favorite.data.rating}</span>
                    </div>
                    <p class="favorite-description">${favorite.data.description}</p>
                    <div class="favorite-meta">
                        <span class="added-date">
                            <i class="fas fa-calendar-plus"></i>
                            Added on ${addedDate}
                        </span>
                        <span class="distance">${favorite.data.distance}</span>
                    </div>
                </div>
                <div class="favorite-actions">
                    <button class="remove-favorite" title="Remove from favorites">
                        <i class="fas fa-heart-broken"></i>
                    </button>
                    <button class="btn-secondary btn-small">View Details</button>
                    <button class="btn-primary btn-small">Get Directions</button>
                </div>
            </div>
        `;
    }

    generateStarsHTML(ratingText) {
        // Extract rating number from text like "4.5 (234 reviews)"
        const rating = parseFloat(ratingText.split(' ')[0]);
        let starsHTML = '';
        
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHTML += '<i class="fas fa-star"></i>';
            } else if (i - 0.5 <= rating) {
                starsHTML += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starsHTML += '<i class="far fa-star"></i>';
            }
        }
        
        return starsHTML;
    }

    updateStats() {
        const favorites = this.favoriteManager.getFavorites();
        const favoritesCount = document.getElementById('favorites-count');
        const recentlyAdded = document.getElementById('recently-added');

        favoritesCount.textContent = favorites.length;

        // Count favorites added in the last week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentCount = favorites.filter(fav => 
            new Date(fav.addedAt) > oneWeekAgo
        ).length;
        
        recentlyAdded.textContent = recentCount;
    }

    filterFavorites(searchTerm) {
        const favoriteItems = document.querySelectorAll('.favorite-item');
        const term = searchTerm.toLowerCase();

        favoriteItems.forEach(item => {
            const name = item.querySelector('h3').textContent.toLowerCase();
            const description = item.querySelector('.favorite-description').textContent.toLowerCase();
            
            if (name.includes(term) || description.includes(term)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    sortFavorites(sortBy) {
        const favorites = this.favoriteManager.getFavorites();
        
        switch (sortBy) {
            case 'recent':
                favorites.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
                break;
            case 'name':
                favorites.sort((a, b) => a.data.name.localeCompare(b.data.name));
                break;
            case 'rating':
                favorites.sort((a, b) => {
                    const ratingA = parseFloat(a.data.rating.split(' ')[0]);
                    const ratingB = parseFloat(b.data.rating.split(' ')[0]);
                    return ratingB - ratingA;
                });
                break;
        }

        // Update the favorites array in localStorage
        this.favoriteManager.favorites = favorites;
        this.favoriteManager.saveFavorites();
        
        // Re-render the list
        this.renderFavorites();
    }

    showRemoveConfirmation(cafeId) {
        this.currentCafeToRemove = cafeId;
        const modal = document.getElementById('confirm-modal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('confirm-modal');
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        this.currentCafeToRemove = null;
    }

    confirmRemove() {
        if (this.currentCafeToRemove) {
            const success = this.favoriteManager.removeFromFavorites(this.currentCafeToRemove);
            
            if (success) {
                showToast('💔 Café removed from favorites', 'error');
                this.renderFavorites();
                this.updateStats();
            }
            
            this.closeModal();
        }
    }
}

// Global functions for modal
function closeModal() {
    favoritesPage.closeModal();
}

function confirmRemove() {
    favoritesPage.confirmRemove();
}

// Initialize the favorites page
document.addEventListener('DOMContentLoaded', function() {
    window.favoritesPage = new FavoritesPage();
});

// Add CSS for small buttons
const additionalCSS = `
.btn-small {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    border-radius: 20px;
}
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);
