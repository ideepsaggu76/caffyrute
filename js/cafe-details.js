// Adds additional methods to the CaffyRuteGoogleMaps class
CaffyRuteGoogleMaps.prototype.getAdditionalCafeDetails = function(cafe) {
    // This function can be used to fetch additional details about a café if needed
    // For now, it's a placeholder that could be expanded in the future
    if (!cafe.detailsLoaded) {
        console.log('Getting additional details for café:', cafe.name);
        
        // Mark as loaded to prevent duplicate requests
        cafe.detailsLoaded = true;
    }
    
    return cafe;
};

// Global functions for UI interactions
window.showCafeDetails = function(cafeId) {
    const cafe = window.caffyRuteApp.cafes.find(c => c.id === cafeId);
    if (cafe) {
        // Create and show detailed cafe page
        showCafeDetailPage(cafe);
    }
};

window.getDirections = function(lat, lng, name) {
    const destination = `${lat},${lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${name}`;
    window.open(url, '_blank');
};

function showCafeDetailPage(cafe) {
    // Get more details if needed
    window.caffyRuteApp.getAdditionalCafeDetails(cafe);
    
    // Create full-page detail view
    const detailsPage = document.createElement('div');
    detailsPage.className = 'cafe-details-page';
    detailsPage.id = 'cafe-details-page';
    
    // Get header image
    let headerImage = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&h=800&fit=crop&q=80';
    if (cafe.photos && cafe.photos.length > 0) {
        headerImage = cafe.photos[0].url.replace('400', '1200').replace('300', '800');
    }
    
    const stars = window.caffyRuteApp.generateStars(cafe.rating || 0);
    const priceSymbols = '$'.repeat(Math.max(1, cafe.priceLevel || 2));
    
    detailsPage.innerHTML = `
        <div class="cafe-details-header">
            <img src="${headerImage}" alt="${cafe.name}">
            <button class="cafe-details-back" onclick="closeCafeDetails()">
                <i class="fas fa-arrow-left"></i>
            </button>
            <div class="cafe-details-overlay">
                <h1>${cafe.name}</h1>
                <div class="cafe-details-rating">
                    <div class="stars">${stars}</div>
                    <span>${cafe.rating ? cafe.rating.toFixed(1) : 'N/A'} (${cafe.reviewCount || 0} reviews)</span>
                </div>
                <div class="cafe-details-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${(cafe.distance || 0).toFixed(1)} km away</span>
                    <span><i class="fas fa-dollar-sign"></i> ${priceSymbols}</span>
                    ${cafe.isOpen !== undefined ? 
                        `<span><i class="fas fa-clock"></i> ${cafe.isOpen ? 'Open now' : 'Closed'}</span>` : 
                        ''}
                </div>
            </div>
        </div>
        
        <div class="cafe-details-content">
            <div class="cafe-actions-bar">
                <button class="cafe-action-btn cafe-action-secondary" onclick="toggleFavorite(this, '${cafe.id}')">
                    <i class="far fa-heart"></i> Save
                </button>
                <button class="cafe-action-btn cafe-action-primary" onclick="window.getDirections(${cafe.location.lat}, ${cafe.location.lng}, '${cafe.name}')">
                    <i class="fas fa-directions"></i> Get Directions
                </button>
                ${cafe.website ? 
                    `<a href="${cafe.website}" target="_blank" class="cafe-action-btn cafe-action-secondary">
                        <i class="fas fa-globe"></i> Website
                    </a>` : ''}
            </div>
            
            <div class="cafe-info-grid">
                <div class="cafe-info-card">
                    <h3><i class="fas fa-info-circle"></i> About</h3>
                    <p>${cafe.address || 'Address not available'}</p>
                    ${cafe.phone ? `<p><i class="fas fa-phone"></i> ${cafe.phone}</p>` : ''}
                </div>
                
                <div class="cafe-info-card">
                    <h3><i class="fas fa-clock"></i> Hours</h3>
                    ${cafe.openingHours && cafe.openingHours.length > 0 ? 
                        `<ul class="cafe-hours-list">
                            ${cafe.openingHours.map(hours => `
                                <li>
                                    <span class="day">${hours.split(': ')[0]}</span>
                                    <span class="hours">${hours.split(': ')[1] || 'Hours not available'}</span>
                                </li>
                            `).join('')}
                        </ul>` : 
                        '<p>Hours information not available</p>'}
                </div>
            </div>
            
            ${cafe.photos && cafe.photos.length > 0 ? 
                `<div class="cafe-details-section">
                    <h2>Photos</h2>
                    <div class="cafe-photos-grid">
                        ${cafe.photos.map((photo, index) => `
                            <div class="cafe-photo" onclick="openPhotoLightbox(${index})">
                                <img src="${photo.url}" alt="${cafe.name} photo ${index + 1}" loading="lazy">
                            </div>
                        `).join('')}
                    </div>
                </div>` : ''}
            
            ${cafe.reviews && cafe.reviews.length > 0 ? 
                `<div class="cafe-details-section">
                    <h2>Reviews</h2>
                    <div class="reviews-list">
                        ${cafe.reviews.map(review => `
                            <div class="review-item">
                                <div class="review-header">
                                    <img src="${review.profilePhoto || 'https://via.placeholder.com/40'}" alt="${review.author}">
                                    <div class="review-author">
                                        <span class="review-author-name">${review.author}</span>
                                        <div class="review-stars">${window.caffyRuteApp.generateStars(review.rating)}</div>
                                    </div>
                                    <span class="review-time">${review.time}</span>
                                </div>
                                <p class="review-text">${review.text}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>` : ''}
        </div>
        
        <!-- Photo lightbox -->
        <div class="photo-lightbox" id="photo-lightbox">
            <div class="lightbox-content">
                <button class="lightbox-close" onclick="closeLightbox()">&times;</button>
                <img class="lightbox-img" id="lightbox-img" src="" alt="Cafe photo">
                <button class="lightbox-nav lightbox-prev" onclick="changePhoto(-1)"><i class="fas fa-chevron-left"></i></button>
                <button class="lightbox-nav lightbox-next" onclick="changePhoto(1)"><i class="fas fa-chevron-right"></i></button>
            </div>
        </div>
    `;
    
    // Append to body
    document.body.appendChild(detailsPage);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Setup global variables for lightbox
    window.currentCafe = cafe;
    window.currentPhotoIndex = 0;
}

// Close cafe details page
window.closeCafeDetails = function() {
    const detailsPage = document.getElementById('cafe-details-page');
    if (detailsPage) {
        detailsPage.remove();
    }
    document.body.style.overflow = '';
    window.currentCafe = null;
}

// Photo lightbox functions
window.openPhotoLightbox = function(index) {
    if (!window.currentCafe || !window.currentCafe.photos) return;
    
    const lightbox = document.getElementById('photo-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    
    window.currentPhotoIndex = index;
    lightboxImg.src = window.currentCafe.photos[index].url;
    lightbox.style.display = 'flex';
}

window.closeLightbox = function() {
    const lightbox = document.getElementById('photo-lightbox');
    lightbox.style.display = 'none';
}

window.changePhoto = function(direction) {
    if (!window.currentCafe || !window.currentCafe.photos) return;
    
    const photoCount = window.currentCafe.photos.length;
    window.currentPhotoIndex = (window.currentPhotoIndex + direction + photoCount) % photoCount;
    
    const lightboxImg = document.getElementById('lightbox-img');
    lightboxImg.src = window.currentCafe.photos[window.currentPhotoIndex].url;
}
