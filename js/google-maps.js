// Google Maps API Integration for CaffyRute
// API Key: AIzaSyAhJAse30TCMIK7-N9moQxk7akoW5nyB0I

class CaffyRuteGoogleMaps {
    constructor(apiKey = 'AIzaSyAhJAse30TCMIK7-N9moQxk7akoW5nyB0I') {
        this.apiKey = apiKey;
        this.map = null;
        this.service = null;
        this.userLocation = null;
        this.markers = [];
        this.cafes = [];
    }

    // Initialize Google Maps
    async initMap() {
        try {
            // Get user's current location
            await this.getCurrentLocation();
            
            // Create map
            this.map = new google.maps.Map(document.getElementById('map'), {
                center: this.userLocation,
                zoom: 15,
                styles: this.getMapStyles()
            });

            // Initialize Places service
            this.service = new google.maps.places.PlacesService(this.map);
            
            // Search for nearby cafes
            this.searchNearbyCafes();
            
        } catch (error) {
            console.error('Error initializing map:', error);
            this.showError('Unable to load map. Please check your internet connection.');
        }
    }

    // Get user's current location
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.userLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        resolve(this.userLocation);
                    },
                    (error) => {
                        // Fallback to default location (New York)
                        this.userLocation = { lat: 40.7128, lng: -74.0060 };
                        console.warn('Location access denied, using default location');
                        resolve(this.userLocation);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 300000
                    }
                );
            } else {
                // Fallback for browsers without geolocation
                this.userLocation = { lat: 40.7128, lng: -74.0060 };
                resolve(this.userLocation);
            }
        });
    }

    // Search for nearby cafes using Google Places API
    searchNearbyCafes(radius = 5000) {
        const request = {
            location: this.userLocation,
            radius: radius,
            type: ['cafe', 'bakery', 'restaurant'],
            keyword: 'coffee',
            fields: [
                'place_id', 'name', 'geometry', 'rating', 'user_ratings_total',
                'price_level', 'photos', 'opening_hours', 'formatted_address',
                'types', 'website', 'formatted_phone_number'
            ]
        };

        this.service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                this.processCafeResults(results);
            } else {
                console.error('Places search failed:', status);
                this.showError('Unable to find nearby cafes. Please try again.');
            }
        });
    }

    // Process cafe search results
    async processCafeResults(results) {
        this.cafes = [];
        const detailPromises = [];

        // Get detailed information for each cafe
        for (let i = 0; i < Math.min(results.length, 20); i++) {
            const place = results[i];
            detailPromises.push(this.getPlaceDetails(place.place_id));
        }

        try {
            const detailedResults = await Promise.all(detailPromises);
            this.cafes = detailedResults.filter(cafe => cafe !== null);
            
            // Sort by rating and distance
            this.cafes.sort((a, b) => {
                if (b.rating !== a.rating) {
                    return b.rating - a.rating;
                }
                return a.distance - b.distance;
            });

            this.displayCafes();
            this.addMapMarkers();
        } catch (error) {
            console.error('Error processing cafe results:', error);
        }
    }

    // Get detailed place information
    getPlaceDetails(placeId) {
        return new Promise((resolve) => {
            const request = {
                placeId: placeId,
                fields: [
                    'place_id', 'name', 'geometry', 'rating', 'user_ratings_total',
                    'price_level', 'photos', 'opening_hours', 'formatted_address',
                    'reviews', 'website', 'formatted_phone_number', 'types',
                    'business_status', 'current_opening_hours'
                ]
            };

            this.service.getDetails(request, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    const cafeData = this.formatCafeData(place);
                    resolve(cafeData);
                } else {
                    resolve(null);
                }
            });
        });
    }

    // Format cafe data for display
    formatCafeData(place) {
        const distance = this.calculateDistance(
            this.userLocation.lat,
            this.userLocation.lng,
            place.geometry.location.lat(),
            place.geometry.location.lng()
        );

        const isOpen = place.opening_hours ? place.opening_hours.isOpen() : null;
        const openingHours = place.current_opening_hours ? 
            place.current_opening_hours.weekday_text : 
            (place.opening_hours ? place.opening_hours.weekday_text : []);

        return {
            id: place.place_id,
            name: place.name,
            rating: place.rating || 0,
            reviewCount: place.user_ratings_total || 0,
            priceLevel: place.price_level || 2,
            address: place.formatted_address,
            location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            },
            distance: distance,
            isOpen: isOpen,
            openingHours: openingHours,
            photos: place.photos ? place.photos.slice(0, 3).map(photo => ({
                url: photo.getUrl({ maxWidth: 400, maxHeight: 300 }),
                attribution: photo.html_attributions[0] || ''
            })) : [],
            reviews: place.reviews ? place.reviews.slice(0, 3).map(review => ({
                author: review.author_name,
                rating: review.rating,
                text: review.text,
                time: review.relative_time_description,
                profilePhoto: review.profile_photo_url
            })) : [],
            website: place.website,
            phone: place.formatted_phone_number,
            types: place.types,
            businessStatus: place.business_status,
            features: this.extractFeatures(place)
        };
    }

    // Extract features from place types and other data
    extractFeatures(place) {
        const features = [];
        const types = place.types || [];
        
        // Common cafe features based on types and other data
        if (types.includes('wifi') || place.name.toLowerCase().includes('wifi')) {
            features.push({ icon: 'fas fa-wifi', text: 'WiFi' });
        }
        
        if (types.includes('pet_store') || place.name.toLowerCase().includes('pet')) {
            features.push({ icon: 'fas fa-paw', text: 'Pet Friendly' });
        }
        
        if (place.opening_hours && place.opening_hours.periods) {
            const periods = place.opening_hours.periods;
            const is24Hours = periods.some(period => !period.close);
            if (is24Hours) {
                features.push({ icon: 'fas fa-clock', text: '24/7 Open' });
            }
        }
        
        if (types.includes('meal_takeaway') || types.includes('restaurant')) {
            features.push({ icon: 'fas fa-utensils', text: 'Full Menu' });
        }
        
        if (types.includes('bakery')) {
            features.push({ icon: 'fas fa-birthday-cake', text: 'Fresh Pastries' });
        }

        // Add default WiFi if no specific features found
        if (features.length === 0) {
            features.push({ icon: 'fas fa-wifi', text: 'WiFi' });
        }

        return features;
    }

    // Calculate distance between two points
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Display cafes in the UI
    displayCafes() {
        const cafeList = document.querySelector('.cafe-list');
        if (!cafeList) return;

        cafeList.innerHTML = '';

        this.cafes.forEach((cafe, index) => {
            const cafeElement = this.createCafeElement(cafe, index);
            cafeList.appendChild(cafeElement);
        });

        // Update cafe count
        const cafeCount = document.querySelector('.cafe-count');
        if (cafeCount) {
            cafeCount.textContent = `${this.cafes.length} cafes found`;
        }
    }

    // Create cafe element HTML
    createCafeElement(cafe, index) {
        const cafeDiv = document.createElement('div');
        cafeDiv.className = 'cafe-item';
        cafeDiv.dataset.cafeId = cafe.id;

        const imageUrl = cafe.photos.length > 0 ? cafe.photos[0].url : 
                        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&h=200&fit=crop';

        const priceSymbols = '₹'.repeat(cafe.priceLevel || 2);
        const stars = this.generateStars(cafe.rating);
        const statusClass = cafe.isOpen === true ? 'open' : (cafe.isOpen === false ? 'closed' : 'unknown');
        const statusText = cafe.isOpen === true ? 'Open now' : 
                          (cafe.isOpen === false ? 'Closed' : 'Hours unknown');

        cafeDiv.innerHTML = `
            <div class="cafe-image">
                <img src="${imageUrl}" alt="${cafe.name}" loading="lazy">
            </div>
            <div class="cafe-details">
                <h3>${cafe.name}</h3>
                <div class="cafe-rating">
                    <div class="stars">${stars}</div>
                    <span class="rating-text">${cafe.rating.toFixed(1)} (${cafe.reviewCount} reviews)</span>
                </div>
                <p class="cafe-description">${this.generateDescription(cafe)}</p>
                <div class="cafe-features">
                    ${cafe.features.map(feature => 
                        `<span class="feature"><i class="${feature.icon}"></i> ${feature.text}</span>`
                    ).join('')}
                    <span class="feature"><i class="fas fa-dollar-sign"></i> ${priceSymbols}</span>
                </div>
                <div class="cafe-meta">
                    <span class="distance"><i class="fas fa-map-marker-alt"></i> ${cafe.distance.toFixed(1)} km away</span>
                    <span class="status ${statusClass}"><i class="fas fa-clock"></i> ${statusText}</span>
                </div>
            </div>
            <div class="cafe-actions">
                <button class="heart-btn" onclick="toggleFavorite(this, '${cafe.id}')">
                    <i class="far fa-heart"></i>
                </button>
                <button class="btn-secondary" onclick="showCafeDetails('${cafe.id}')">View Details</button>
                <button class="btn-primary" onclick="getDirections(${cafe.location.lat}, ${cafe.location.lng}, '${cafe.name}')">Get Directions</button>
            </div>
        `;

        return cafeDiv;
    }

    // Generate star rating HTML
    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let starsHTML = '';
        
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        }
        
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="far fa-star"></i>';
        }

        return starsHTML;
    }

    // Generate cafe description
    generateDescription(cafe) {
        const descriptions = [
            `${cafe.name} offers a great coffee experience with ${cafe.rating.toFixed(1)} star rating.`,
            `Popular local cafe with excellent reviews from ${cafe.reviewCount} customers.`,
            `Cozy atmosphere perfect for coffee lovers, located ${cafe.distance.toFixed(1)}km away.`,
            `Highly rated cafe serving quality coffee and delicious treats.`
        ];
        
        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }

    // Add markers to map
    addMapMarkers() {
        // Clear existing markers
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];

        // Add user location marker
        const userMarker = new google.maps.Marker({
            position: this.userLocation,
            map: this.map,
            title: 'Your Location',
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#4285F4">
                        <circle cx="12" cy="12" r="8" stroke="white" stroke-width="2"/>
                    </svg>
                `),
                scaledSize: new google.maps.Size(24, 24)
            }
        });

        // Add cafe markers
        this.cafes.forEach((cafe, index) => {
            const marker = new google.maps.Marker({
                position: cafe.location,
                map: this.map,
                title: cafe.name,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#6B4423">
                            <path d="M18.5 3H6c-1.1 0-2 .9-2 2v5.71c0 3.83 2.95 7.18 6.78 7.29 3.96.12 7.22-3.06 7.22-7v-5.71c0-1.1-.9-2-2-2zM16 10.81c0 2.76-2.24 5-5 5s-5-2.24-5-5V5h10v5.81z"/>
                            <path d="M17 11v3c0 2.21-1.79 4-4 4s-4-1.79-4-4v-3"/>
                        </svg>
                    `),
                    scaledSize: new google.maps.Size(32, 32)
                }
            });

            // Add info window
            const infoWindow = new google.maps.InfoWindow({
                content: this.createInfoWindowContent(cafe)
            });

            marker.addListener('click', () => {
                infoWindow.open(this.map, marker);
            });

            this.markers.push(marker);
        });
    }

    // Create info window content
    createInfoWindowContent(cafe) {
        const imageUrl = cafe.photos.length > 0 ? cafe.photos[0].url : '';
        const stars = this.generateStars(cafe.rating);

        return `
            <div class="info-window">
                ${imageUrl ? `<img src="${imageUrl}" alt="${cafe.name}" style="width: 200px; height: 120px; object-fit: cover; border-radius: 8px;">` : ''}
                <h3 style="margin: 8px 0; color: #6B4423;">${cafe.name}</h3>
                <div style="margin: 4px 0;">${stars} ${cafe.rating.toFixed(1)} (${cafe.reviewCount})</div>
                <p style="margin: 4px 0; color: #666; font-size: 12px;">${cafe.address}</p>
                <p style="margin: 4px 0; color: #666; font-size: 12px;">${cafe.distance.toFixed(1)} km away</p>
                <button onclick="getDirections(${cafe.location.lat}, ${cafe.location.lng}, '${cafe.name}')" 
                        style="background: #6B4423; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-top: 8px;">
                    Get Directions
                </button>
            </div>
        `;
    }

    // Custom map styles
    getMapStyles() {
        return [
            {
                featureType: 'poi.business',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'poi.park',
                elementType: 'labels',
                stylers: [{ visibility: 'on' }]
            }
        ];
    }

    // Show error message
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div style="background: #fee; border: 1px solid #fcc; padding: 1rem; border-radius: 8px; margin: 1rem; color: #c66;">
                <i class="fas fa-exclamation-triangle"></i> ${message}
            </div>
        `;
        
        const cafeList = document.querySelector('.cafe-list');
        if (cafeList) {
            cafeList.innerHTML = '';
            cafeList.appendChild(errorDiv);
        }
    }

    // Search cafes by query
    searchCafes(query) {
        const request = {
            location: this.userLocation,
            radius: 10000,
            query: `${query} cafe coffee`,
            fields: [
                'place_id', 'name', 'geometry', 'rating', 'user_ratings_total',
                'price_level', 'photos', 'opening_hours', 'formatted_address'
            ]
        };

        this.service.textSearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                this.processCafeResults(results);
            } else {
                this.showError('No cafes found matching your search.');
            }
        });
    }
}

// Global functions for UI interactions
window.showCafeDetails = function(cafeId) {
    const cafe = window.caffyRuteApp.cafes.find(c => c.id === cafeId);
    if (cafe) {
        // Create and show modal with cafe details
        showCafeModal(cafe);
    }
};

window.getDirections = function(lat, lng, name) {
    const destination = `${lat},${lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${name}`;
    window.open(url, '_blank');
};

function showCafeModal(cafe) {
    // Create modal HTML
    const modal = document.createElement('div');
    modal.className = 'cafe-modal-overlay';
    modal.innerHTML = `
        <div class="cafe-modal">
            <div class="cafe-modal-header">
                <h2>${cafe.name}</h2>
                <button class="close-modal" onclick="closeCafeModal()">&times;</button>
            </div>
            <div class="cafe-modal-content">
                ${cafe.photos.length > 0 ? `
                    <div class="cafe-images">
                        ${cafe.photos.map(photo => `
                            <img src="${photo.url}" alt="${cafe.name}" loading="lazy">
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="cafe-info">
                    <div class="rating-large">
                        <div class="stars">${window.caffyRuteApp.generateStars(cafe.rating)}</div>
                        <span>${cafe.rating.toFixed(1)} (${cafe.reviewCount} reviews)</span>
                    </div>
                    
                    <p><i class="fas fa-map-marker-alt"></i> ${cafe.address}</p>
                    <p><i class="fas fa-route"></i> ${cafe.distance.toFixed(1)} km away</p>
                    
                    ${cafe.phone ? `<p><i class="fas fa-phone"></i> ${cafe.phone}</p>` : ''}
                    ${cafe.website ? `<p><i class="fas fa-globe"></i> <a href="${cafe.website}" target="_blank">Visit Website</a></p>` : ''}
                    
                    <div class="opening-hours">
                        <h4>Opening Hours</h4>
                        ${cafe.openingHours.length > 0 ? 
                            cafe.openingHours.map(hours => `<p>${hours}</p>`).join('') :
                            '<p>Hours not available</p>'
                        }
                    </div>
                    
                    ${cafe.reviews.length > 0 ? `
                        <div class="reviews">
                            <h4>Recent Reviews</h4>
                            ${cafe.reviews.map(review => `
                                <div class="review">
                                    <div class="review-header">
                                        <img src="${review.profilePhoto || 'https://via.placeholder.com/40'}" alt="${review.author}">
                                        <div>
                                            <strong>${review.author}</strong>
                                            <div class="stars">${window.caffyRuteApp.generateStars(review.rating)}</div>
                                        </div>
                                        <span class="review-time">${review.time}</span>
                                    </div>
                                    <p>${review.text}</p>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="cafe-modal-actions">
                <button class="btn-primary" onclick="getDirections(${cafe.location.lat}, ${cafe.location.lng}, '${cafe.name}')">
                    Get Directions
                </button>
                <button class="btn-secondary" onclick="toggleFavorite(this, '${cafe.id}')">
                    Add to Favorites
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

window.closeCafeModal = function() {
    const modal = document.querySelector('.cafe-modal-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
};
