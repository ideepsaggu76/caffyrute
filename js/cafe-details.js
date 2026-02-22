// Adds additional methods to the CaffyRuteGoogleMaps class
CaffyRuteGoogleMaps.prototype.getAdditionalCafeDetails = async function(cafe) {
    // This function fetches additional details about a café when needed
    if (cafe.detailsLoaded) return cafe;

    // Create a loading indicator
    const loadingDetails = document.createElement('div');
    loadingDetails.className = 'loading-details';
    loadingDetails.innerHTML = '<div class="loading-spinner"></div><p>Loading additional details...</p>';

    const detailsContent = document.querySelector('.cafe-details-content');
    if (detailsContent) {
        detailsContent.prepend(loadingDetails);
    }

    try {
        const apiBase = (window.CONFIG && window.CONFIG.API_BASE_URL) || '';
        let url = `${apiBase}/api/cafe-details?placeId=${cafe.id}`;
        if (this.userLocation) {
            url += `&lat=${this.userLocation.lat}&lng=${this.userLocation.lng}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        // Remove loading indicator
        const loadingEl = document.querySelector('.loading-details');
        if (loadingEl) loadingEl.remove();

        if (data.success && data.cafe) {
            const details = data.cafe;

            // Update cafe with additional details
            if (details.photos && details.photos.length > 0) {
                cafe.photos = details.photos;

                // Update header image
                const headerImg = document.querySelector('.cafe-details-header img');
                if (headerImg && cafe.photos.length > 0) {
                    headerImg.src = cafe.photos[0].url;
                }

                this.updateCafePhotosSection(cafe);
            }

            if (details.reviews && details.reviews.length > 0) {
                cafe.reviews = details.reviews;
                this.updateCafeReviewsSection(cafe);
            }

            if (details.openingHours && details.openingHours.length > 0) {
                cafe.openingHours = details.openingHours;
                this.updateCafeHoursSection(cafe);
            }

            if (details.website) cafe.website = details.website;
            if (details.phone) cafe.phone = details.phone;
            if (details.priceLevel !== null) cafe.priceLevel = details.priceLevel;
            if (details.rating) cafe.rating = details.rating;
            if (details.reviewCount) cafe.reviewCount = details.reviewCount;
            if (details.address) cafe.address = details.address;
            if (details.distance !== null) cafe.distance = details.distance;

            this.updateCafeInfoSection(cafe);
            cafe.detailsLoaded = true;
        }
    } catch (error) {
        console.error('Error fetching cafe details from API:', error);

        // Remove loading indicator
        const loadingEl = document.querySelector('.loading-details');
        if (loadingEl) loadingEl.remove();

        // Fallback to client-side Places API if available
        if (window.google && window.google.maps) {
            const service = new google.maps.places.PlacesService(document.createElement('div'));
            service.getDetails({
                placeId: cafe.id,
                fields: [
                    'photos', 'reviews', 'opening_hours', 'website',
                    'formatted_phone_number', 'price_level', 'rating',
                    'user_ratings_total', 'formatted_address'
                ]
            }, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                    if (place.photos && place.photos.length > 0) {
                        cafe.photos = place.photos.map(photo => ({
                            url: photo.getUrl({maxWidth: 800, maxHeight: 600})
                        }));
                        this.updateCafePhotosSection(cafe);
                    }
                    if (place.reviews && place.reviews.length > 0) {
                        cafe.reviews = place.reviews.map(review => ({
                            author: review.author_name,
                            rating: review.rating,
                            text: review.text,
                            time: review.relative_time_description,
                            profilePhoto: review.profile_photo_url
                        }));
                        this.updateCafeReviewsSection(cafe);
                    }
                    if (place.opening_hours && place.opening_hours.weekday_text) {
                        cafe.openingHours = place.opening_hours.weekday_text;
                        this.updateCafeHoursSection(cafe);
                    }
                    if (place.website) cafe.website = place.website;
                    if (place.formatted_phone_number) cafe.phone = place.formatted_phone_number;
                    this.updateCafeInfoSection(cafe);
                    cafe.detailsLoaded = true;
                }
            });
        }
    }

    return cafe;
};

// Helper methods to update cafe details sections
CaffyRuteGoogleMaps.prototype.updateCafePhotosSection = function(cafe) {
    if (!cafe.photos || cafe.photos.length === 0) return;
    
    const photosSection = document.querySelector('.cafe-photos-grid');
    if (!photosSection) return;
    
    // Clear existing photos
    photosSection.innerHTML = '';
    
    // Add all photos to the grid
    cafe.photos.forEach((photo, index) => {
        const photoDiv = document.createElement('div');
        photoDiv.className = 'cafe-photo';
        photoDiv.setAttribute('onclick', `openPhotoLightbox(${index})`);
        photoDiv.innerHTML = `<img src="${photo.url}" alt="${cafe.name} photo ${index + 1}" loading="lazy">`;
        photosSection.appendChild(photoDiv);
    });
    
    // Make sure the photos section is visible
    const photosSectionContainer = document.querySelector('.cafe-details-section:has(.cafe-photos-grid)');
    if (photosSectionContainer) {
        photosSectionContainer.style.display = 'block';
    }
};

CaffyRuteGoogleMaps.prototype.updateCafeReviewsSection = function(cafe) {
    console.log('Updating cafe reviews section', cafe.reviews);
    
    if (!cafe.reviews || cafe.reviews.length === 0) {
        console.log('No reviews available for cafe:', cafe.name);
        return;
    }
    
    const reviewsList = document.querySelector('.reviews-list');
    if (!reviewsList) {
        console.log('Reviews list element not found in DOM');
        return;
    }
    
    // Clear existing reviews
    reviewsList.innerHTML = '';
    
    // Add all reviews
    cafe.reviews.forEach(review => {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-item';
        reviewDiv.innerHTML = `
            <div class="review-header">
                <img src="${review.profilePhoto || 'https://via.placeholder.com/40'}" alt="${review.author}">
                <div class="review-author">
                    <span class="review-author-name">${review.author}</span>
                    <div class="review-stars">${window.caffyRuteApp.generateStars(review.rating)}</div>
                </div>
                <span class="review-time">${review.time}</span>
            </div>
            <p class="review-text">${review.text}</p>
        `;
        reviewsList.appendChild(reviewDiv);
    });
    
    // Make sure the reviews section is visible
    const reviewsSectionContainer = document.querySelector('.cafe-details-section:has(.reviews-list)');
    if (reviewsSectionContainer) {
        reviewsSectionContainer.style.display = 'block';
    }
};

CaffyRuteGoogleMaps.prototype.updateCafeHoursSection = function(cafe) {
    if (!cafe.openingHours || cafe.openingHours.length === 0) return;
    
    const hoursContainer = document.querySelector('.cafe-info-card:has(.cafe-hours-list)');
    if (!hoursContainer) return;
    
    // Update hours list
    const hoursList = document.createElement('ul');
    hoursList.className = 'cafe-hours-list';
    
    cafe.openingHours.forEach(hours => {
        const [day, timeText] = hours.split(': ');
        const hoursText = timeText || 'Hours not available';
        
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="day">${day}</span>
            <span class="hours">${hoursText}</span>
        `;
        hoursList.appendChild(li);
    });
    
    // Replace existing hours list
    const existingList = hoursContainer.querySelector('.cafe-hours-list');
    if (existingList) {
        hoursContainer.replaceChild(hoursList, existingList);
    } else {
        // Or append if it doesn't exist
        hoursContainer.querySelector('h3').insertAdjacentElement('afterend', hoursList);
    }
};

CaffyRuteGoogleMaps.prototype.updateCafeInfoSection = function(cafe) {
    const infoCard = document.querySelector('.cafe-info-card:first-child');
    if (!infoCard) return;
    
    // Update address
    const addressP = infoCard.querySelector('p');
    if (addressP) {
        addressP.textContent = cafe.address || 'Address not available';
    }
    
    // Update phone
    let phoneP = infoCard.querySelector('p:has(i.fa-phone)');
    if (cafe.phone) {
        if (!phoneP) {
            // Create phone element if it doesn't exist
            phoneP = document.createElement('p');
            phoneP.innerHTML = `<i class="fas fa-phone"></i> ${cafe.phone}`;
            infoCard.appendChild(phoneP);
        } else {
            // Update existing phone element
            phoneP.innerHTML = `<i class="fas fa-phone"></i> ${cafe.phone}`;
        }
    }
    
    // Update website in action buttons
    if (cafe.website) {
        const websiteBtn = document.querySelector('a.cafe-action-btn:has(i.fa-globe)');
        if (!websiteBtn) {
            // Create website button if it doesn't exist
            const actionsBar = document.querySelector('.cafe-actions-bar');
            if (actionsBar) {
                const websiteLink = document.createElement('a');
                websiteLink.href = cafe.website;
                websiteLink.target = '_blank';
                websiteLink.className = 'cafe-action-btn cafe-action-secondary';
                websiteLink.innerHTML = '<i class="fas fa-globe"></i> Website';
                actionsBar.appendChild(websiteLink);
            }
        } else {
            // Update existing website button
            websiteBtn.href = cafe.website;
        }
    }
    
    // Update header info
    const ratingSpan = document.querySelector('.cafe-details-rating span');
    if (ratingSpan) {
        ratingSpan.textContent = `${cafe.rating ? cafe.rating.toFixed(1) : 'N/A'} (${cafe.reviewCount || 0} reviews)`;
    }
    
    const starsDiv = document.querySelector('.cafe-details-rating .stars');
    if (starsDiv) {
        starsDiv.innerHTML = window.caffyRuteApp.generateStars(cafe.rating || 0);
    }
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
    // Create loading spinner
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner active';
    loadingSpinner.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loadingSpinner);
    
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
    
    // Check if this cafe is in favorites
    const isFavorite = window.favoriteManager && window.favoriteManager.isFavorite(cafe.id);
    const favoriteClass = isFavorite ? 'favorited' : '';
    const heartIconClass = isFavorite ? 'fas fa-heart' : 'far fa-heart';
    const favoriteText = isFavorite ? 'Saved' : 'Save';
    
    detailsPage.innerHTML = `
        <div class="cafe-details-header">
            <img src="${headerImage}" alt="${cafe.name}">
            <button class="cafe-details-back" aria-label="Back">
                <i class="fas fa-arrow-left"></i>
                <span class="sr-only">Back</span>
            </button>
            <div class="swipe-hint"></div>
            <div class="gesture-hint">Swipe right or double-tap to close</div>
            <div class="cafe-details-overlay">
                <h1>${cafe.name}</h1>
                <div class="cafe-details-rating">
                    <div class="stars">${stars}</div>
                    <span>${cafe.rating ? cafe.rating.toFixed(1) : 'N/A'} (${cafe.reviewCount || 0} reviews)</span>
                </div>
                <div class="cafe-details-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${cafe.distance !== null ? cafe.distance.toFixed(1) + ' km away' : 'Distance unknown'}</span>
                    <span><i class="fas fa-dollar-sign"></i> ${priceSymbols}</span>
                    ${cafe.isOpen !== undefined ? 
                        `<span><i class="fas fa-clock"></i> ${cafe.isOpen ? 'Open now' : 'Closed'}</span>` : 
                        ''}
                </div>
            </div>
        </div>
        
        <div class="cafe-details-content">
            <div class="cafe-actions-bar">
                <button class="cafe-action-btn cafe-action-secondary ${favoriteClass}" onclick="event.preventDefault(); event.stopPropagation(); toggleFavorite(this, '${cafe.id}'); return false;">
                    <i class="${heartIconClass}"></i> ${favoriteText}
                </button>
                <button class="cafe-action-btn cafe-action-primary" onclick="event.preventDefault(); event.stopPropagation(); window.getDirections(${cafe.location.lat}, ${cafe.location.lng}, '${cafe.name}');">
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
        
        <!-- Toast Notification for Detail Page -->
        <div id="toast" class="toast">
            <span id="toast-message"></span>
        </div>
    `;
    
    // Append to body
    document.body.appendChild(detailsPage);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Remove loading spinner after a small delay to ensure content is rendered
    setTimeout(() => {
        const loadingSpinner = document.querySelector('.loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.classList.remove('active');
            setTimeout(() => loadingSpinner.remove(), 300);
        }
    }, 500);
    
    // Setup global variables for lightbox
    window.currentCafe = cafe;
    window.currentPhotoIndex = 0;
    
    // Add event listener to back button
    const backButton = document.querySelector('.cafe-details-back');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.closeCafeDetails();
        });
    }
    
    // Add swipe gesture handling for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let touchStartTime = 0;
    let lastTapTime = 0;
    
    detailsPage.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        touchStartTime = new Date().getTime();
    }, { passive: true });
    
    detailsPage.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        
        // Check for double tap
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        
        if (tapLength < 300 && tapLength > 0) {
            // Double tap detected
            console.log('Double tap detected - closing details page');
            window.closeCafeDetails();
            e.preventDefault();
        } else {
            // Handle swipe gesture
            handleSwipeGesture();
        }
        
        lastTapTime = currentTime;
    }, { passive: true });
    
    function handleSwipeGesture() {
        const swipeDistanceX = touchEndX - touchStartX;
        const swipeDistanceY = Math.abs(touchEndY - touchStartY);
        const elapsedTime = new Date().getTime() - touchStartTime;
        
        // Parameters for a valid swipe
        const minSwipeDistance = 80; // Minimum distance required for a swipe (px)
        const maxSwipeTime = 500; // Maximum time allowed for a swipe (ms)
        const maxVerticalOffset = 100; // Maximum vertical movement allowed (px)
        
        // Check if swipe is mostly horizontal
        const isHorizontalSwipe = swipeDistanceY < maxVerticalOffset;
        
        // Detect right to left swipe (should not close)
        if (swipeDistanceX < -minSwipeDistance && isHorizontalSwipe && elapsedTime < maxSwipeTime) {
            console.log('Swiped left - ignoring');
            return;
        }
        
        // Detect left to right swipe (should close the details page)
        if (swipeDistanceX > minSwipeDistance && isHorizontalSwipe && elapsedTime < maxSwipeTime) {
            console.log('Swiped right - closing details page');
            window.closeCafeDetails();
        }
    }
}

// Close cafe details page
window.closeCafeDetails = function() {
    const detailsPage = document.getElementById('cafe-details-page');
    if (detailsPage) {
        // Add exit animation
        detailsPage.classList.add('closing');
        
        // Remove loading spinner if it exists
        const loadingSpinner = document.querySelector('.loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.classList.remove('active');
            setTimeout(() => loadingSpinner.remove(), 300);
        }
        
        // Remove element after animation completes
        setTimeout(() => {
            detailsPage.remove();
            document.body.style.overflow = '';
            window.currentCafe = null;
        }, 300);
    } else {
        document.body.style.overflow = '';
        window.currentCafe = null;
    }
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
