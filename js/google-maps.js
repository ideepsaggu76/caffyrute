// Google Maps API Integration for CaffyRute

class CaffyRuteGoogleMaps {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.map = null;
        this.service = null;
        this.userLocation = null;
        this.markers = [];
        this.cafes = [];
        this.currentSearchLocation = null;
        this.autocompleteService = null;
        this.placesService = null;
        this.geocoder = null;
        this.isInitialized = false;
        this.useCache = true; // Enable caching by default
        
        // Try to restore last location from cache
        if (window.cacheManager) {
            const lastLocation = window.cacheManager.getLastLocation();
            if (lastLocation) {
                console.log('Restored last location from cache:', lastLocation);
                this.userLocation = lastLocation;
            }
        }
        
        console.log('CaffyRuteGoogleMaps initialized with API key');
    }
    
    // Initialize after Google Maps API is loaded
    initializeServices() {
        if (window.google && window.google.maps) {
            try {
                this.autocompleteService = new google.maps.places.AutocompleteService();
                this.placesService = new google.maps.places.PlacesService(document.createElement('div'));
                this.geocoder = new google.maps.Geocoder();
                this.isInitialized = true;
                console.log('Google Maps services initialized successfully');
                
                // Initialize location search after services are ready
                this.initLocationSearch();
            } catch (error) {
                console.error('Error initializing Google Maps services:', error);
            }
        } else {
            console.warn('Google Maps API not yet loaded, will retry...');
            setTimeout(() => this.initializeServices(), 1000);
        }
    }
    
    // Initialize location search with autocomplete
    initLocationSearch() {
        console.log('Initializing unified search...');
        const unifiedSearch = document.getElementById('unified-search');
        const suggestionsContainer = document.getElementById('location-suggestions');
        
        if (!unifiedSearch || !suggestionsContainer) {
            console.warn('Unified search or suggestions container not found');
            return;
        }

        console.log('Unified search elements found, setting up event listeners');
        
        let searchTimeout;
        let selectedIndex = -1;
        
        // Input event handler with debouncing
        unifiedSearch.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            clearTimeout(searchTimeout);
            
            if (query.length < 2) {
                this.hideSuggestions();
                return;
            }
            
            searchTimeout = setTimeout(() => {
                this.searchLocationSuggestions(query, suggestionsContainer);
            }, 300);
        });
        
        // Focus event to show suggestions
        unifiedSearch.addEventListener('focus', () => {
            const query = unifiedSearch.value.trim();
            if (query.length >= 2) {
                this.searchLocationSuggestions(query, suggestionsContainer);
            }
        });
        
        // Keyboard navigation
        unifiedSearch.addEventListener('keydown', (e) => {
            const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item:not(.current-location-btn)');
            
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
                    this.highlightSuggestion(suggestions, selectedIndex);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    selectedIndex = Math.max(selectedIndex - 1, -1);
                    this.highlightSuggestion(suggestions, selectedIndex);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                        this.selectLocation(suggestions[selectedIndex]);
                    } else {
                        // If no suggestion selected, search directly
                        const query = unifiedSearch.value.trim();
                        if (query) {
                            console.log('Searching directly with unified search:', query);
                            this.unifiedSearch(query);
                            this.hideSuggestions();
                        }
                    }
                    break;
                case 'Escape':
                    this.hideSuggestions();
                    unifiedSearch.blur();
                    break;
            }
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!unifiedSearch.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                this.hideSuggestions();
            }
        });
        
        console.log('Unified search initialization completed');
    }
    
    // Search for location suggestions
    searchLocationSuggestions(query, container) {
        console.log('Searching for location:', query);
        
        // Clear previous suggestions
        container.innerHTML = '';
        
        // Show loading state
        container.innerHTML = '<div class="suggestion-loading">Searching locations...</div>';
        this.showSuggestions(container);
        
        // Check if Google Places API is available
        if (!window.google || !window.google.maps || !this.autocompleteService) {
            console.warn('Google Places API not available, using fallback suggestions');
            
            // Show fallback suggestions
            const fallbackSuggestions = [
                { description: query + ", India", place_id: "fallback1" },
                { description: query + " City, India", place_id: "fallback2" },
                { description: query + " District", place_id: "fallback3" }
            ];
            
            this.displayLocationSuggestions(fallbackSuggestions, container);
            return;
        }
        
        // Use Places Autocomplete API
        const request = {
            input: query,
            types: ['geocode', 'establishment'],
            componentRestrictions: { country: 'in' } // Focus on India
        };
        
        this.autocompleteService.getPlacePredictions(request, (predictions, status) => {
            console.log('Autocomplete predictions:', predictions, status);
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions && predictions.length) {
                this.displayLocationSuggestions(predictions, container);
            } else {
                // Show fallback suggestions if API fails
                container.innerHTML = '<div class="no-suggestions">No locations found</div>';
                
                // Add a basic suggestion with the query
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.setAttribute('data-query', query);
                
                suggestionItem.innerHTML = `
                    <i class="fas fa-search suggestion-icon"></i>
                    <div class="suggestion-content">
                        <div class="suggestion-main">${query}</div>
                        <div class="suggestion-secondary">Search for this location</div>
                    </div>
                `;
                
                suggestionItem.addEventListener('click', () => {
                    this.selectLocation(suggestionItem);
                });
                
                container.appendChild(suggestionItem);
            }
        });
    }
    
    // Display location suggestions
    displayLocationSuggestions(predictions, container) {
        container.innerHTML = '';
        
        // Add current location option first
        this.addCurrentLocationOption(container);
        
        predictions.slice(0, 5).forEach((prediction, index) => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.setAttribute('data-place-id', prediction.place_id);
            
            const mainText = prediction.structured_formatting ? 
                prediction.structured_formatting.main_text : 
                prediction.description.split(',')[0];
                
            const secondaryText = prediction.structured_formatting ? 
                prediction.structured_formatting.secondary_text : 
                prediction.description.split(',').slice(1).join(',');
            
            suggestionItem.innerHTML = `
                <i class="fas fa-map-marker-alt suggestion-icon"></i>
                <div class="suggestion-content">
                    <div class="suggestion-main">${mainText}</div>
                    <div class="suggestion-secondary">${secondaryText || ''}</div>
                </div>
            `;
            
            suggestionItem.addEventListener('click', () => {
                this.selectLocation(suggestionItem);
            });
            
            container.appendChild(suggestionItem);
        });
        
        this.showSuggestions(container);
    }
    
    // Show basic suggestions when Google Places API is not available
    showBasicSuggestions(query, container) {
        container.innerHTML = '';
        
        // Add current location option
        this.addCurrentLocationOption(container);
        
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.setAttribute('data-query', query);
        
        suggestionItem.innerHTML = `
            <i class="fas fa-search suggestion-icon"></i>
            <div class="suggestion-content">
                <div class="suggestion-main">${query}</div>
                <div class="suggestion-secondary">Search for this location</div>
            </div>
        `;
        
        suggestionItem.addEventListener('click', () => {
            this.selectLocation(suggestionItem);
        });
        
        container.appendChild(suggestionItem);
        this.showSuggestions(container);
    }
    
    // Add current location option
    addCurrentLocationOption(container) {
        const currentLocationBtn = document.createElement('button');
        currentLocationBtn.className = 'current-location-btn';
        currentLocationBtn.innerHTML = `
            <i class="fas fa-crosshairs"></i>
            <span>Use Current Location</span>
        `;
        
        currentLocationBtn.addEventListener('click', () => {
            this.useCurrentLocation();
        });
        
        container.appendChild(currentLocationBtn);
    }
    
    // Select a location from suggestions
    selectLocation(suggestionElement) {
        const unifiedSearch = document.getElementById('unified-search');
        const placeId = suggestionElement.getAttribute('data-place-id');
        const query = suggestionElement.getAttribute('data-query');
        
        if (placeId && this.placesService) {
            // Get place details using place ID
            this.placesService.getDetails({
                placeId: placeId,
                fields: ['geometry', 'formatted_address', 'name']
            }, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    const location = place.geometry.location;
                    unifiedSearch.value = place.formatted_address;
                    
                    // Directly trigger the search without requiring Enter
                    this.unifiedSearch(place.formatted_address);
                    
                    // Show toast notification
                    if (window.showToast) {
                        window.showToast('🔍 Searching cafés near ' + (place.name || place.formatted_address), 'success');
                    }
                }
            });
        } else if (query) {
            // Basic search for the query
            unifiedSearch.value = query;
            
            // Directly trigger the search without requiring Enter
            this.unifiedSearch(query);
            
            // Show toast notification
            if (window.showToast) {
                window.showToast('🔍 Searching for ' + query, 'success');
            }
        }
        
        this.hideSuggestions();
    }
    
    // Use current location
    useCurrentLocation() {
        // Show loading notification
        if (window.showToast) {
            window.showToast('📍 Getting your current location...', 'loading');
        }
        
        if (navigator.geolocation) {
            const unifiedSearch = document.getElementById('unified-search');
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    // Update the search input
                    if (unifiedSearch) {
                        unifiedSearch.value = 'Current Location';
                    }
                    
                    // Directly trigger a search with current location
                    this.currentSearchLocation = { lat, lng, address: 'Current Location' };
                    this.userLocation = { lat, lng };
                    
                    // Update map center if map exists
                    if (this.map) {
                        this.map.setCenter({ lat, lng });
                    }
                    
                    // Search for cafes at current location
                    this.searchNearbyCafes();
                    
                    this.hideSuggestions();
                    
                    // Show success notification
                    if (window.showToast) {
                        window.showToast('🔍 Searching cafés near your location', 'success');
                    }
                },
                (error) => {
                    // Update the search input
                    if (unifiedSearch) {
                        unifiedSearch.value = '';
                    }
                    
                    this.hideSuggestions();
                    this.showError('Unable to get current location. Please enter location manually.');
                    
                    // Show error notification
                    if (window.showToast) {
                        window.showToast('❌ Location access denied. Please enter location manually.', 'error');
                    }
                },
                { maximumAge: 60000, timeout: 10000, enableHighAccuracy: true }
            );
        } else {
            this.showError('Geolocation is not supported by this browser.');
            
            // Show error notification
            if (window.showToast) {
                window.showToast('❌ Your browser does not support geolocation.', 'error');
            }
        }
    }
    
    // Set search location and update cafes
    setSearchLocation(lat, lng, address) {
        this.currentSearchLocation = { lat, lng, address };
        this.userLocation = { lat, lng };
        
        // Update map center if map exists
        if (this.map) {
            this.map.setCenter({ lat, lng });
        }
        
        // Search for cafes at new location
        this.searchNearbyCafes();
    }
    
    // Search location by name using geocoding
    searchLocationByName(locationName) {
        if (!window.google || !window.google.maps) {
            this.showError('Google Maps is not loaded. Please check your connection.');
            return;
        }
        
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: locationName }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                this.setSearchLocation(
                    location.lat(), 
                    location.lng(), 
                    results[0].formatted_address
                );
            } else {
                this.showError('Location not found. Please try a different search term.');
            }
        });
    }
    
    // Highlight suggestion for keyboard navigation
    highlightSuggestion(suggestions, index) {
        suggestions.forEach((item, i) => {
            item.classList.toggle('highlighted', i === index);
        });
    }
    
    // Show suggestions dropdown
    showSuggestions(container) {
        container.classList.add('active');
    }
    
    // Hide suggestions dropdown
    hideSuggestions() {
        const container = document.getElementById('location-suggestions');
        if (container) {
            container.classList.remove('active');
        }
    }

    // Initialize Google Maps
    async initMap() {
        try {
            console.log('Initializing Google Maps...');
            
            if (!window.google || !window.google.maps) {
                console.error('Google Maps API not loaded');
                this.showError('Google Maps API failed to load. Please check your connection and API key.');
                this.hideLoading();
                return;
            }
            
            // Initialize services first
            this.initializeServices();
            
            // Show loading message
            this.showLoading('Getting your location and finding nearby cafés...');
            
            // Check for cached results first before getting location
            let cachedCafes = null;
            let cachedLocation = null;
            
            // Try to get cached location and results
            if (window.cacheManager && this.useCache) {
                cachedLocation = window.cacheManager.getLastLocation();
                if (cachedLocation) {
                    console.log('Using cached location:', cachedLocation);
                    // Use the cached location initially
                    this.userLocation = cachedLocation;
                    
                    // Try to get cached cafe results for this location
                    cachedCafes = window.cacheManager.getSearchResults(cachedLocation, 2000);
                    if (cachedCafes && cachedCafes.length > 0) {
                        console.log('Using cached cafes:', cachedCafes.length);
                    }
                }
            }
            
            // Get user's current location (in background, don't await)
            const locationPromise = this.getCurrentLocation();
            
            // Create map using cached location if available, or default location
            this.map = new google.maps.Map(document.getElementById('map'), {
                center: this.userLocation || { lat: 28.6139, lng: 77.2090 }, // Default to New Delhi if no cached location
                zoom: 15,
                styles: this.getMapStyles()
            });

            // Initialize Places service
            this.service = new google.maps.places.PlacesService(this.map);
            
            if (!this.service) {
                console.error('Failed to initialize Places service');
                this.showError('Google Maps Places service failed to initialize.');
                this.hideLoading();
                return;
            }
            
            // If we have cached cafes, show them immediately
            if (cachedCafes && cachedCafes.length > 0) {
                this.cafes = cachedCafes;
                this.sortCafesByDistance();
                this.addLocationMarker(this.userLocation);
                this.displayCafes();
                this.addMapMarkers();
                console.log('Displayed cached cafes immediately');
                
                // Still update location and refresh results in the background
                locationPromise.then(() => {
                    // Only search again if the location has changed significantly
                    if (!cachedLocation || 
                        this.calculateDistance(
                            cachedLocation.lat, 
                            cachedLocation.lng, 
                            this.userLocation.lat, 
                            this.userLocation.lng
                        ) > 0.5) { // If moved more than 0.5km
                        console.log('Location changed significantly, refreshing results');
                        this.searchNearbyCafes(1500);
                    }
                });
            } else {
                // No cached results, wait for location and then search
                await locationPromise;
                
                // Add marker for user's location
                this.addLocationMarker(this.userLocation);
                
                // Automatically search for nearby cafes on page load
                console.log('Starting automatic search for nearby cafes...');
                
                // Ensure we have a user location before searching
                if (!this.userLocation) {
                    console.warn('User location not set, using default location');
                    this.userLocation = { lat: 28.6139, lng: 77.2090 }; // Default to New Delhi
                }
                
                // Start search immediately - no need to wait
                this.searchNearbyCafes(1500);
            }
            
            console.log('Google Maps initialization completed');
            
        } catch (error) {
            console.error('Error initializing map:', error);
            this.showError('Unable to load map. Please check your internet connection.');
            this.hideLoading();
            this.displayCafes(); // Show "No cafes found" message
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

    // Search for nearby cafes using Google Places API with enhanced filtering
    searchNearbyCafes(radius = 5000, attemptCount = 0) { // Default 5km radius
        console.log('Searching for cafes with location:', this.userLocation, 'radius:', radius, 'attempt:', attemptCount + 1);
        
        // Validate user location first
        if (!this.userLocation) {
            console.error('Cannot search cafes: User location not set');
            this.showError('Your location is not available. Please enable location services or search for a specific location.');
            this.hideLoading();
            this.displayCafes(); // Show "No cafes found" message
            return;
        }
        
        // Save current location to cache
        if (window.cacheManager) {
            window.cacheManager.saveLastLocation(this.userLocation);
        }
        
        if (!this.service) {
            console.error('Places service not initialized');
            this.showError('Google Maps service is not initialized. Please reload the page.');
            this.hideLoading();
            this.displayCafes(); // Show "No cafes found" message
            return;
        }
        
        // Clear any existing timeout to ensure multiple searches don't overlap
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Try to get results from cache first if caching is enabled
        if (this.useCache && window.cacheManager && attemptCount === 0) {
            const cachedResults = window.cacheManager.getSearchResults(this.userLocation, radius);
            if (cachedResults && cachedResults.length > 0) {
                console.log('Using cached results for this location:', cachedResults.length, 'cafes');
                this.cafes = cachedResults;
                this.sortCafesByDistance(); // Re-sort based on current location
                this.displayCafes();
                this.addMapMarkers();
                return;
            } else {
                console.log('No cached results available, performing search');
            }
        }
        
        // Update loading message with radius information
        const loadingElement = document.getElementById('loading-cafes');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div class="loading-spinner"></div>
                <p>Finding cafés within ${(radius/1000).toFixed(1)} km of your location...</p>
            `;
            loadingElement.style.display = 'flex';
        }
        
        // Make sure cafe list is hidden while loading
        const cafeList = document.getElementById('cafe-list');
        if (cafeList) {
            cafeList.style.display = 'none';
        }
        
        // Update the radius selector to match the current search radius
        const radiusSelect = document.getElementById('radius');
        if (radiusSelect) {
            // Find the closest matching option
            const options = Array.from(radiusSelect.options);
            let bestMatch = options[0];
            let minDiff = Math.abs(parseInt(options[0].value) - radius);
            
            for (let i = 1; i < options.length; i++) {
                const diff = Math.abs(parseInt(options[i].value) - radius);
                if (diff < minDiff) {
                    minDiff = diff;
                    bestMatch = options[i];
                }
            }
            
            radiusSelect.value = bestMatch.value;
        }
        
        const request = {
            location: this.userLocation,
            radius: radius,
            type: ['cafe', 'restaurant', 'bakery'], // Focus on relevant types
            keyword: 'cafe coffee espresso tea', // Expanded keywords for better matches
            fields: [
                'place_id', 'name', 'geometry', 'rating', 'user_ratings_total',
                'price_level', 'photos', 'opening_hours', 'formatted_address',
                'types', 'business_status', 'vicinity'
            ],
            rankBy: google.maps.places.RankBy.PROMINENCE // Prioritize prominence over distance for more relevant results
        };

        console.log('Making Places API request:', request);
        
        // Show additional UI feedback
        const sectionHeader = document.querySelector('.section-header h2');
        if (sectionHeader) {
            sectionHeader.textContent = 'Finding cafés near you...';
        }

        try {
            this.service.nearbySearch(request, (results, status) => {
                console.log('Places API response status:', status);
                console.log('Places API response length:', results ? results.length : 0);
                
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    if (!results || results.length === 0) {
                        console.log('No results found, trying broader search...');
                        
                        // Try alternative search terms first
                        if (attemptCount === 0) {
                            this.searchWithAlternativeTerms(radius, attemptCount + 1);
                        } 
                        // Then try increasing radius if we haven't gone too far
                        else if (radius < 20000) { // Max 20 km radius
                            const newRadius = radius * 1.5; // Increase the radius by 50%
                            console.log(`Increasing search radius to ${newRadius}m`);
                            this.searchNearbyCafes(newRadius, attemptCount + 1);
                        } else {
                            console.log('Reached maximum search radius, using basic establishments search');
                            this.searchBasicEstablishments(radius);
                        }
                        return;
                    }
                    
                    // Log the first result to see what data we're getting
                    if (results.length > 0) {
                        console.log('First result example:', JSON.stringify({
                            name: results[0].name,
                            place_id: results[0].place_id,
                            types: results[0].types,
                            vicinity: results[0].vicinity
                        }));
                    }
                    
                    // Quick filter and process immediately
                    const filteredResults = this.quickFilterCafes(results);
                    console.log('Filtered results count:', filteredResults.length);
                    
                    if (filteredResults.length === 0 && radius < 20000) {
                        // If filtering removed all results, try larger radius
                        const newRadius = radius * 2;
                        console.log(`No cafes after filtering, increasing radius to ${newRadius}m`);
                        this.searchNearbyCafes(newRadius, attemptCount + 1);
                    } else if (filteredResults.length === 0) {
                        // If we've reached max radius and still no results after filtering
                        console.log('No cafes found after maximum radius search and filtering');
                        this.hideLoading();
                        this.cafes = [];
                        this.displayCafes(); // Show "No cafes found" message
                    } else {
                        this.processCafeResults(filteredResults);
                    }
                } else {
                    console.error('Places search failed:', status);
                    
                    if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS && radius < 20000) {
                        // Try larger radius if zero results
                        const newRadius = radius * 2;
                        console.log(`Zero results, increasing radius to ${newRadius}m`);
                        this.searchNearbyCafes(newRadius, attemptCount + 1);
                    } else if (attemptCount === 0) {
                        // Try alternative terms as fallback
                        this.searchWithAlternativeTerms(radius, attemptCount + 1);
                    } else {
                        console.log('All search attempts failed, showing no results message');
                        this.showError('Unable to find nearby cafes. Please try again.');
                        this.hideLoading();
                        this.cafes = [];
                        this.displayCafes(); // Will show "No cafes found" message
                    }
                }
            });
        } catch (error) {
            console.error('Error in nearbySearch:', error);
            this.showError('Error searching for cafes. Please try again.');
            this.hideLoading();
            this.cafes = [];
            this.displayCafes(); // Will show "No cafes found" message
        }
    }
    
    // Alternative search terms if main search fails
    searchWithAlternativeTerms(radius, attemptCount = 0) {
        console.log('Trying alternative search terms with radius:', radius, 'attempt:', attemptCount + 1);
        
        // Update loading message
        const loadingElement = document.getElementById('loading-cafes');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div class="loading-spinner"></div>
                <p>Trying alternative search terms within ${(radius/1000).toFixed(1)} km...</p>
            `;
        }
        const alternativeRequest = {
            location: this.userLocation,
            radius: radius,
            type: ['food', 'bakery', 'meal_takeaway'], // Broader search with more types
            keyword: 'cafe restaurant coffee espresso bakery',
        };

        try {
            this.service.nearbySearch(alternativeRequest, (results, status) => {
                console.log('Alternative search results status:', status);
                console.log('Alternative search results count:', results ? results.length : 0);
                
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                    const filteredResults = this.quickFilterCafes(results);
                    console.log('Alternative filtered results:', filteredResults.length);
                    
                    if (filteredResults.length > 0) {
                        this.processCafeResults(filteredResults);
                    } else if (radius < 20000) {
                        // If filtering removed all results, try larger radius
                        const newRadius = radius * 2;
                        console.log(`No cafes after alternative filtering, increasing radius to ${newRadius}m`);
                        this.searchNearbyCafes(newRadius, attemptCount + 1);
                    } else {
                        // If we've tried everything, use basic establishments search
                        this.searchBasicEstablishments(radius);
                    }
                } else {
                    // If still no results, try a broader search with larger radius
                    if (radius < 20000) {
                        const newRadius = radius * 2;
                        console.log(`No results with alternative terms, increasing radius to ${newRadius}m`);
                        this.searchNearbyCafes(newRadius, attemptCount + 1);
                    } else {
                        // If we've tried everything up to maximum radius, use basic establishments
                        this.searchBasicEstablishments(radius);
                    }
                }
            });
        } catch (error) {
            console.error('Error in alternative search:', error);
            if (radius < 20000) {
                const newRadius = radius * 2;
                this.searchNearbyCafes(newRadius, attemptCount + 1);
            } else {
                this.searchBasicEstablishments(radius);
            }
        }
    }
    
    // Most basic search - just establishments
    searchBasicEstablishments(radius) {
        console.log('Trying basic establishments search with radius:', radius);
        
        // Update loading message
        const loadingElement = document.getElementById('loading-cafes');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div class="loading-spinner"></div>
                <p>Searching for any establishments within ${(radius/1000).toFixed(1)} km...</p>
            `;
        }
        
        const basicRequest = {
            location: this.userLocation,
            radius: Math.max(radius, 20000), // Use at least 20km for last resort search
            type: ['establishment'],
            keyword: 'restaurant food drink cafe', // Add some keywords to help find relevant places
            rankBy: google.maps.places.RankBy.PROMINENCE // Sort by prominence to get popular places
        };

        try {
            this.service.nearbySearch(basicRequest, (results, status) => {
                console.log('Basic search results status:', status);
                console.log('Basic search results count:', results ? results.length : 0);
                
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                    // Show up to 15 establishments if nothing else works
                    const basicResults = results.slice(0, 15);
                    console.log('Using basic establishments:', basicResults.length);
                    
                    // Mark these results as fallback so UI can indicate they're not strictly cafes
                    basicResults.forEach(place => {
                        place.isFallbackResult = true;
                    });
                    
                    this.processCafeResults(basicResults);
                } else {
                    console.log('No establishments found even with basic search');
                    this.showError('No establishments found in your area. Try changing your location.');
                    this.hideLoading();
                    this.displayCafes(); // Will show "No cafes found" message
                }
            });
        } catch (error) {
            console.error('Error in basic search:', error);
            this.showError('Error searching for establishments. Please try again.');
            this.hideLoading();
            this.displayCafes(); // Will show "No cafes found" message
        }
    }

    // Quick filter for immediate results
    quickFilterCafes(results) {
        if (!results || results.length === 0) {
            console.log('No results to filter');
            return [];
        }
        
        console.log('All search results:', results.length);
        
        // Log the types of places we're finding to help with debugging
        const typeFrequency = {};
        results.forEach(place => {
            if (place.types) {
                place.types.forEach(type => {
                    typeFrequency[type] = (typeFrequency[type] || 0) + 1;
                });
            }
        });
        console.log('Types found in results:', typeFrequency);
        
        // Create a scoring system to prioritize more cafe-like establishments
        const scoredResults = results.map(place => {
            let score = 0;
            
            // Score based on types
            const types = place.types || [];
            if (types.includes('cafe')) score += 15;
            if (types.includes('restaurant')) score += 5;
            if (types.includes('bakery')) score += 10;
            if (types.includes('bar')) score += 4;
            if (types.includes('food')) score += 6;
            if (types.includes('store')) score += 3;
            if (types.includes('coffee')) score += 15; // Direct coffee type
            
            // Prefer places that are likely to serve coffee
            if (types.includes('meal_takeaway')) score += 4;
            if (types.includes('point_of_interest')) score += 2;
            
            // Penalize establishments less likely to be cafés
            if (types.includes('gas_station')) score -= 5;
            if (types.includes('lodging')) score -= 3;
            if (types.includes('grocery_or_supermarket')) score -= 2;
            
            // Check name for keywords
            const name = place.name.toLowerCase();
            if (name.includes('cafe') || name.includes('café')) score += 12;
            if (name.includes('coffee')) score += 12;
            if (name.includes('espresso')) score += 10;
            if (name.includes('bakery')) score += 8;
            if (name.includes('tea')) score += 7;
            
            // Look for coffee shop chains
            const knownChains = ['starbucks', 'costa', 'caffè nero', 'peet', 'dunkin', 'tim hortons'];
            for (const chain of knownChains) {
                if (name.includes(chain)) {
                    score += 15;
                    break;
                }
            }
            
            // Higher rating is better
            if (place.rating) score += Math.min(place.rating, 5);
            
            // More reviews is better
            if (place.user_ratings_total) {
                score += Math.min(place.user_ratings_total / 100, 5);
            }
            
            // Calculate distance
            if (this.userLocation && place.geometry && place.geometry.location) {
                const distance = this.calculateDistance(
                    this.userLocation.lat,
                    this.userLocation.lng,
                    place.geometry.location.lat(),
                    place.geometry.location.lng()
                );
                
                // Add the distance to the place object for later use
                place.distance = distance;
                
                // Add a small bonus for closer places
                score += Math.max(0, 5 - distance); // Up to 5 points for very close places
            }
            
            return { place, score };
        });
        
        // Sort by score (highest first)
        scoredResults.sort((a, b) => b.score - a.score);
        
        // Log the top 5 scored places for debugging
        console.log('Top 5 scored places:');
        scoredResults.slice(0, 5).forEach((item, index) => {
            console.log(`${index + 1}. ${item.place.name} - Score: ${item.score.toFixed(1)} - Types: ${item.place.types?.join(', ') || 'none'}`);
        });
        
        // Take the top 30 results
        const filteredResults = scoredResults.slice(0, 30).map(item => item.place);
        console.log('Filtered and scored results:', filteredResults.length);
        
        return filteredResults;
    }

    // Process cafe search results with optimized performance
    async processCafeResults(results) {
        console.log('Processing cafe results, count:', results ? results.length : 0);
        
        // Explicitly reset cafes array
        this.cafes = [];
        
        // Show loading state immediately
        this.showLoading('Processing café details...');
        
        if (!results || results.length === 0) {
            console.log('No results found in processCafeResults');
            this.hideLoading();
            this.displayCafes(); // This will now handle empty results
            return;
        }
        
        // Display results header right away
        const sectionHeader = document.querySelector('.section-header h2');
        if (sectionHeader) {
            sectionHeader.textContent = 'Cafés Near You';
        }
        
        // Limit results for processing (show top 30 results instead of 15)
        const limitedResults = results.slice(0, 30);
        console.log('Processing limited results:', limitedResults.length);
        
        // Process cafes in batches for better performance
        const batchSize = 5;
        const batches = [];
        
        for (let i = 0; i < limitedResults.length; i += batchSize) {
            batches.push(limitedResults.slice(i, i + batchSize));
        }
        
        try {
            // Process first batch immediately for quick display
            console.log('Processing first batch of cafes...');
            
            if (batches.length === 0 || !batches[0] || batches[0].length === 0) {
                console.error('No batches available for processing');
                this.hideLoading();
                this.displayCafes(); // Will show "No cafes found" message
                return;
            }
            
            const firstBatchPromises = batches[0].map(place => this.getPlaceDetailsQuick(place));
            console.log('Created promises for first batch, count:', firstBatchPromises.length);
            
            const firstBatch = await Promise.all(firstBatchPromises);
            console.log('First batch processed, results:', firstBatch.length);
            
            this.cafes = firstBatch.filter(cafe => cafe !== null);
            console.log('Valid cafes in first batch:', this.cafes.length);
            
            if (this.cafes.length > 0) {
                this.sortCafesByDistance();
                
                // Display first results immediately
                this.displayCafes();
                this.addMapMarkers();
                
                // Cache first batch of results
                if (window.cacheManager && this.useCache) {
                    window.cacheManager.cacheCafes(this.cafes);
                    window.cacheManager.cacheSearchResults(this.userLocation, radius, this.cafes);
                }
                
                // Update section header to show we're displaying nearby cafés
                const sectionHeader = document.querySelector('.section-header h2');
                if (sectionHeader) {
                    sectionHeader.textContent = 'Cafés Near You';
                }
            } else {
                console.log('No valid cafes in first batch');
                this.displayCafes(); // Will show "No cafes found" message
            }
            
            this.hideLoading();
            
            // Process remaining batches in background
            if (batches.length > 1) {
                console.log(`Processing remaining ${batches.length - 1} batches in background...`);
                this.processRemainingBatches(batches.slice(1));
            }
            
        } catch (error) {
            console.error('Error processing cafe results:', error);
            this.showError('Error loading cafe details. Please try again.');
            this.hideLoading();
            this.cafes = this.cafes || [];
            this.displayCafes(); // Will show "No cafes found" message if this.cafes is empty
        }
    }
    
    // Process remaining batches in background
    async processRemainingBatches(remainingBatches) {
        for (const batch of remainingBatches) {
            try {
                console.log('Processing next batch of cafes, size:', batch.length);
                const batchPromises = batch.map(place => this.getPlaceDetailsQuick(place));
                const batchResults = await Promise.all(batchPromises);
                
                const validCafes = batchResults.filter(cafe => cafe !== null);
                console.log('Valid cafes in this batch:', validCafes.length);
                
                if (validCafes.length > 0) {
                    this.cafes.push(...validCafes);
                    this.sortCafesByDistance();
                    
                    // Update display incrementally
                    this.displayCafes();
                    this.addMapMarkers();
                }
                
                // Small delay to prevent blocking UI
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error('Error processing batch:', error);
            }
        }
    }
    
    // Quick place details with essential info only
    getPlaceDetailsQuick(place) {
        return new Promise((resolve) => {
            try {
                if (!place || !place.place_id) {
                    console.error('Invalid place object:', place);
                    resolve(null);
                    return;
                }
                
                if (!place.geometry || !place.geometry.location) {
                    console.error('Place missing geometry:', place.name);
                    resolve(null);
                    return;
                }
                
                // Handle potential issues with photos
                let photoUrl = '';
                try {
                    if (place.photos && place.photos.length > 0) {
                        photoUrl = place.photos[0].getUrl({ maxWidth: 300, maxHeight: 200 });
                        console.log(`Successfully got photo URL for ${place.name}:`, photoUrl);
                    } else {
                        console.warn('No photos available for', place.name);
                        // Use high quality coffee-related image from Unsplash as fallback
                        photoUrl = `https://source.unsplash.com/300x200/?cafe,coffee,${encodeURIComponent(place.name)}`;
                    }
                } catch (photoError) {
                    console.warn('Error getting photo URL for', place.name, photoError);
                    // Use high quality coffee-related image from Unsplash as fallback
                    photoUrl = `https://source.unsplash.com/300x200/?cafe,coffee,${encodeURIComponent(place.name)}`;
                }
                
                // Get location coordinates safely
                let lat, lng;
                try {
                    lat = place.geometry.location.lat();
                    lng = place.geometry.location.lng();
                } catch (locError) {
                    console.warn('Error getting location for', place.name, locError);
                    // If we can't get the location, skip this place
                    resolve(null);
                    return;
                }
                
                // Check for opening hours
                let isOpen = null;
                try {
                    if (place.opening_hours) {
                        isOpen = place.opening_hours.isOpen();
                    }
                } catch (hoursError) {
                    console.warn('Error getting opening hours for', place.name, hoursError);
                }
                
                // Calculate distance between cafe and user location properly
                let distance = 0;
                try {
                    if (this.userLocation && this.userLocation.lat && this.userLocation.lng) {
                        // Get coordinates properly
                        const userLat = parseFloat(this.userLocation.lat);
                        const userLng = parseFloat(this.userLocation.lng);
                        const placeLat = parseFloat(lat);
                        const placeLng = parseFloat(lng);
                        
                        if (!isNaN(userLat) && !isNaN(userLng) && !isNaN(placeLat) && !isNaN(placeLng)) {
                            distance = this.calculateDistance(
                                userLat,
                                userLng,
                                placeLat,
                                placeLng
                            );
                            
                            // Ensure distance is a valid number with reasonable value
                            if (isNaN(distance) || !isFinite(distance) || distance < 0) {
                                console.warn('Invalid distance calculated for', place.name);
                                // Calculate simplified distance as fallback (just for comparison purposes)
                                const latDiff = Math.abs(userLat - placeLat);
                                const lngDiff = Math.abs(userLng - placeLng);
                                // Rough estimation (not accurate but better than nothing)
                                distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111.32;
                            }
                            
                            // Log distance for debugging
                            console.log(`Distance to ${place.name}: ${distance.toFixed(2)}km`);
                        }
                    }
                } catch (distError) {
                    console.error('Error calculating distance:', distError);
                    distance = 0;
                }
                
                // Use basic place data first for immediate display
                const basicCafe = {
                    id: place.place_id,
                    name: place.name || 'Unnamed Place',
                    rating: place.rating || 0,
                    reviewCount: place.user_ratings_total || 0,
                    priceLevel: place.price_level || 2,
                    address: place.vicinity || place.formatted_address || 'Address not available',
                    location: { lat, lng },
                    distance: distance,
                    isOpen: isOpen,
                    photos: photoUrl ? [{ url: photoUrl }] : [],
                    businessStatus: place.business_status,
                    types: place.types || [],
                    features: this.extractBasicFeatures(place),
                    // For tracking fallback results
                    isFallbackResult: place.isFallbackResult || false,
                    // These were missing in the original method
                    openingHours: [],
                    reviews: [],
                    // Placeholder for detailed data
                    detailsLoaded: false
                };
                
                resolve(basicCafe);
            } catch (error) {
                console.error('Error processing place details:', error, place);
                // Create a minimal cafe object with fallback values
                resolve({
                    id: place.place_id || 'unknown',
                    name: place.name || 'Café',
                    rating: 0,
                    reviewCount: 0,
                    priceLevel: 2,
                    address: 'Address not available',
                    location: {
                        lat: place.geometry ? place.geometry.location.lat() : this.userLocation.lat,
                        lng: place.geometry ? place.geometry.location.lng() : this.userLocation.lng
                    },
                    distance: 0,
                    isOpen: null,
                    photos: [],
                    features: [{ icon: 'fas fa-coffee', text: 'Coffee' }],
                    openingHours: [],
                    reviews: [],
                    detailsLoaded: false
                });
            }
        });
    }
    
    // Extract basic features quickly
    extractBasicFeatures(place) {
        const features = [];
        const types = place.types || [];
        
        // Quick feature detection based on place types
        if (types.includes('wifi')) {
            features.push({ icon: 'fas fa-wifi', text: 'WiFi' });
        }
        if (types.includes('wheelchair_accessible_entrance')) {
            features.push({ icon: 'fas fa-wheelchair', text: 'Accessible' });
        }
        if (place.price_level !== undefined) {
            const priceText = ['Free', '$', '$$', '$$$', '$$$$'][place.price_level] || '$$';
            features.push({ icon: 'fas fa-dollar-sign', text: priceText });
        }
        if (types.includes('meal_takeaway')) {
            features.push({ icon: 'fas fa-shopping-bag', text: 'Takeaway' });
        }
        
        return features;
    }
    
    // Optimized sorting by different criteria
    sortCafesByDistance() {
        console.log('Sorting cafés by distance...');
        if (!this.cafes || this.cafes.length === 0) {
            console.log('No cafes to sort by distance');
            return;
        }
        
        // Make sure all cafes have a distance calculated
        for (const cafe of this.cafes) {
            if (typeof cafe.distance !== 'number' || isNaN(cafe.distance) || cafe.distance === 0) {
                if (cafe.location && cafe.location.lat && cafe.location.lng && 
                    this.userLocation && this.userLocation.lat && this.userLocation.lng) {
                    
                    // Calculate distance with validated coordinates
                    const userLat = parseFloat(this.userLocation.lat);
                    const userLng = parseFloat(this.userLocation.lng);
                    const cafeLat = parseFloat(cafe.location.lat);
                    const cafeLng = parseFloat(cafe.location.lng);
                    
                    if (!isNaN(userLat) && !isNaN(userLng) && !isNaN(cafeLat) && !isNaN(cafeLng)) {
                        cafe.distance = this.calculateDistance(userLat, userLng, cafeLat, cafeLng);
                        console.log(`Calculated distance for ${cafe.name}: ${cafe.distance.toFixed(2)}km`);
                    } else {
                        console.warn(`Invalid coordinates for ${cafe.name}:`, 
                                    {userLat, userLng, cafeLat, cafeLng});
                        cafe.distance = 999; // Put at the end if coordinates are invalid
                    }
                } else {
                    console.warn(`Missing location data for ${cafe.name}`);
                    cafe.distance = 999; // Put at the end if missing location data
                }
            }
        }
        
        // Ensure all cafes have a valid distance value
        this.cafes.forEach(cafe => {
            if (isNaN(cafe.distance) || cafe.distance < 0) {
                cafe.distance = 999; // Default distance for invalid values
            }
        });
        
        // Sort by distance
        this.cafes.sort((a, b) => {
            // Primary sort by distance
            return (a.distance || 999) - (b.distance || 999);
        });
        
        console.log('Sorted cafes by distance:', this.cafes.map(c => `${c.name}: ${c.distance.toFixed(2)}km`).slice(0, 5));
    }
    
    // Sort cafes by specified criteria
    sortCafes(sortBy) {
        console.log('Sorting cafes by:', sortBy);
        
        if (!this.cafes || this.cafes.length === 0) {
            console.log('No cafes to sort');
            return;
        }
        
        switch (sortBy) {
            case 'rating':
                this.cafes.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'distance':
                this.sortCafesByDistance();
                break;
            case 'price':
                this.cafes.sort((a, b) => {
                    // Handle undefined or null price levels
                    const priceA = a.priceLevel !== undefined ? a.priceLevel : 2;
                    const priceB = b.priceLevel !== undefined ? b.priceLevel : 2;
                    return priceA - priceB;
                });
                break;
            case 'reviews':
                this.cafes.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
                break;
            default:
                // Default to distance sorting
                this.sortCafesByDistance();
        }
        
        // Update display after sorting
        this.displayCafes();
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

    // Calculate distance between two points using Haversine formula
    calculateDistance(lat1, lng1, lat2, lng2) {
        // Convert all inputs to numbers to ensure proper calculation
        lat1 = parseFloat(lat1);
        lng1 = parseFloat(lng1);
        lat2 = parseFloat(lat2);
        lng2 = parseFloat(lng2);
        
        // Validate inputs
        if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
            console.warn('Invalid coordinates for distance calculation:', {lat1, lng1, lat2, lng2});
            return 0;
        }
        
        // Check for same coordinates
        if (lat1 === lat2 && lng1 === lng2) {
            return 0.01; // Return a small value for same location (10m)
        }
        
        try {
            const R = 6371; // Earth's radius in kilometers
            const dLat = this.toRadians(lat2 - lat1);
            const dLng = this.toRadians(lng2 - lng1);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                    Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            
            // Calculate distance and ensure it's positive
            let distance = R * c;
            
            // Apply minimum distance for very close locations (to avoid 0.0 km display)
            if (distance < 0.01) {
                distance = 0.01;
            }
            
            return distance;
        } catch (e) {
            console.error('Error calculating distance:', e);
            return 0.1; // Fallback minimum distance
        }
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Optimized display cafes in the UI
    displayCafes() {
        console.log('Displaying cafes:', this.cafes ? this.cafes.length : 0);
        
        const cafeList = document.querySelector('.cafe-list');
        if (!cafeList) {
            console.error('Cafe list element not found');
            return;
        }
        
        // Hide loading indicator
        this.hideLoading();
        
        // Make sure cafe list is visible even if empty
        cafeList.style.display = 'block';

        // Handle empty results
        if (!this.cafes || this.cafes.length === 0) {
            console.log('No cafes to display, showing empty state');
            cafeList.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-coffee"></i>
                    <p>No cafés found in this area. Try changing your location or search terms.</p>
                    <button class="btn-secondary retry-search-btn">
                        <i class="fas fa-search"></i> Try with a larger radius
                    </button>
                </div>
            `;
            
            // Add event listener to the retry button
            const retryButton = cafeList.querySelector('.retry-search-btn');
            if (retryButton) {
                retryButton.addEventListener('click', () => {
                    // Try with a much larger radius (20km)
                    this.searchNearbyCafes(20000);
                });
            }
            
            // Update cafe count
            const cafeCount = document.querySelector('.cafe-count');
            if (cafeCount) {
                cafeCount.textContent = '0 cafés found';
            }
            
            return;
        }
        
        // Clear loading placeholder if exists
        const loadingPlaceholder = cafeList.querySelector('.loading-placeholder');
        if (loadingPlaceholder) {
            loadingPlaceholder.remove();
        }

        // Clear existing content
        cafeList.innerHTML = '';
        
        // Add a notice if showing fallback results
        const hasFallbackResults = this.cafes.some(cafe => cafe.isFallbackResult);
        if (hasFallbackResults) {
            const fallbackNotice = document.createElement('div');
            fallbackNotice.className = 'fallback-notice';
            fallbackNotice.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <p>Showing nearby establishments that may not be cafés.</p>
            `;
            cafeList.appendChild(fallbackNotice);
        }

        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        // Show more cafes initially (12 instead of 8)
        const visibleCafes = this.cafes.slice(0, 12);
        
        console.log('Rendering cafes:', visibleCafes.length);
        
        visibleCafes.forEach((cafe, index) => {
            try {
                const cafeElement = this.createOptimizedCafeElement(cafe, index);
                fragment.appendChild(cafeElement);
            } catch (error) {
                console.error('Error creating cafe element:', error);
            }
        });

        // Append to the list
        cafeList.appendChild(fragment);
        
        // Make sure cafe list is visible
        cafeList.style.display = 'grid';

        // Update cafe count
        const cafeCount = document.querySelector('.cafe-count');
        if (cafeCount) {
            cafeCount.textContent = `${this.cafes.length} cafés found`;
        }
        
        // Load remaining cafes progressively if there are more
        if (this.cafes.length > 12) {
            setTimeout(() => this.loadRemainingCafes(12), 200);
        }
    }

    // Load remaining cafes progressively
    loadRemainingCafes(startIndex) {
        const cafeList = document.querySelector('.cafe-list');
        if (!cafeList) return;

        const remainingCafes = this.cafes.slice(startIndex);
        const fragment = document.createDocumentFragment();
        
        remainingCafes.forEach((cafe, index) => {
            const cafeElement = this.createOptimizedCafeElement(cafe, startIndex + index);
            fragment.appendChild(cafeElement);
        });

        cafeList.appendChild(fragment);
    }

    // Create optimized cafe element for faster rendering
    createOptimizedCafeElement(cafe, index) {
        try {
            if (!cafe) {
                console.error('Invalid cafe data provided to createOptimizedCafeElement');
                return document.createElement('div'); // Return empty div as fallback
            }
            
            const cafeDiv = document.createElement('div');
            cafeDiv.className = cafe.isFallbackResult ? 'cafe-item fallback-result' : 'cafe-item';
            cafeDiv.setAttribute('data-cafe-id', cafe.id || `unknown-${index}`);
            
            // Use placeholder image initially
            let imageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkxvYWRpbmcgaW1hZ2UuLi48L3RleHQ+PC9zdmc+';
            
            // Prepare the URL for the actual image (will be loaded after element is created)
            let actualImageUrl = '';
            if (cafe.photos && cafe.photos.length > 0 && cafe.photos[0].url) {
                actualImageUrl = cafe.photos[0].url;
            } else if (window.imageLoader) {
                // Use the imageLoader to get a proper image
                actualImageUrl = window.imageLoader.getCafeImageUrl(cafe.name, cafe.features);
            } else {
                // Fallback if imageLoader is not available
                actualImageUrl = `https://source.unsplash.com/200x150/?cafe,${encodeURIComponent(cafe.name)}`;
            }
            
            const stars = this.generateStars(cafe.rating || 0);
            const priceSymbols = '$'.repeat(Math.max(1, cafe.priceLevel || 2));
            
            const statusClass = cafe.isOpen === true ? 'open' : (cafe.isOpen === false ? 'closed' : 'unknown');
            const statusText = cafe.isOpen === true ? 'Open' : (cafe.isOpen === false ? 'Closed' : 'Hours unknown');
            
            // Add a fallback badge if this is not a true cafe
            const fallbackBadge = cafe.isFallbackResult ? 
                `<div class="fallback-badge" title="This result may not be a café">
                    <i class="fas fa-store"></i>
                </div>` : '';
    
            // Check if this cafe is in favorites
            const isFavorite = window.favoriteManager && window.favoriteManager.isFavorite(cafe.id);
            const favoriteClass = isFavorite ? 'favorited' : '';
            const heartIconClass = isFavorite ? 'fas fa-heart' : 'far fa-heart';
    
            // Simplified, faster HTML structure
            cafeDiv.innerHTML = `
                <div class="cafe-image">
                    <img src="${imageUrl}" alt="${cafe.name}" loading="lazy" data-actual-src="${actualImageUrl}" class="cafe-photo">
                    ${fallbackBadge}
                    <div class="price-overlay">${priceSymbols}</div>
                    <div class="image-loader"></div>
                </div>
                <div class="cafe-details">
                    <h3>${cafe.name}</h3>
                    <div class="cafe-rating">
                        <div class="stars">${stars}</div>
                        <span class="rating-text">${(cafe.rating || 0).toFixed(1)} (${cafe.reviewCount || 0})</span>
                    </div>
                    <div class="cafe-meta">
                        <span class="distance"><i class="fas fa-map-marker-alt"></i> ${(cafe.distance > 0 ? cafe.distance : 0.1).toFixed(1)} km</span>
                        <span class="status ${statusClass}"><i class="fas fa-clock"></i> ${statusText}</span>
                        ${cafe.address ? `<span class="address-snippet"><i class="fas fa-location-dot"></i> ${cafe.address.split(',')[0]}</span>` : ''}
                    </div>
                    <div class="cafe-description" style="display:none;">Coffee Shop</div>
                    <div class="cafe-features" style="display:none;">
                        <span class="feature">Coffee</span>
                    </div>
                </div>
                <div class="cafe-actions">
                    <button class="heart-btn ${favoriteClass}" onclick="toggleFavorite(this, '${cafe.id || `unknown-${index}`}')">
                        <i class="${heartIconClass}"></i>
                    </button>
                    <button class="view-details-btn" onclick="window.showCafeDetails('${cafe.id}')">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                    <button class="btn-primary directions-btn" onclick="window.getDirections(${cafe.location.lat}, ${cafe.location.lng}, '${cafe.name}')">
                        <i class="fas fa-directions"></i> Go
                    </button>
                </div>
            `;
            
            // After the element is created, load the actual image if imageLoader is available
            if (window.imageLoader) {
                // Get the image element
                const imgElement = cafeDiv.querySelector('img.cafe-photo');
                if (imgElement) {
                    // Use the imageLoader to apply the image
                    window.imageLoader.applyImageToElement(imgElement, actualImageUrl, cafe.name, cafe.features);
                }
            }
    
            return cafeDiv;
        } catch (error) {
            console.error('Error creating cafe element:', error, cafe);
            // Create a minimal fallback element
            const fallbackDiv = document.createElement('div');
            fallbackDiv.className = 'cafe-item';
            fallbackDiv.innerHTML = `
                <div class="cafe-details">
                    <h3>${cafe ? cafe.name || 'Cafe' : 'Cafe'}</h3>
                    <p>Details unavailable</p>
                </div>
            `;
            return fallbackDiv;
        }
    }

    // Quick details modal for faster interaction
    showQuickDetails(cafeId) {
        const cafe = this.cafes.find(c => c.id === cafeId);
        if (!cafe) return;
        
        // Show quick modal immediately
        this.showQuickModal(cafe);
        
        // Load detailed info in background if not already loaded
        if (!cafe.detailsLoaded) {
            this.loadDetailedInfo(cafe);
        }
    }
    
    // Show quick modal with basic info
    showQuickModal(cafe) {
        const existingModal = document.getElementById('quick-cafe-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'quick-cafe-modal';
        modal.className = 'cafe-modal quick-modal';
        
        const imageUrl = cafe.photos.length > 0 ? cafe.photos[0].url : 
            'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=250&fit=crop';
        
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content quick-content">
                <div class="modal-header">
                    <h2>${cafe.name}</h2>
                    <button class="modal-close" onclick="this.closest('.cafe-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <img src="${imageUrl}" alt="${cafe.name}" class="quick-image">
                    <div class="quick-info">
                        <div class="rating">${this.generateStars(cafe.rating)} ${cafe.rating.toFixed(1)}</div>
                        <p><i class="fas fa-map-marker-alt"></i> ${cafe.distance.toFixed(1)} km away</p>
                        <p><i class="fas fa-dollar-sign"></i> ${this.getPriceLevel(cafe.priceLevel)}</p>
                        <p><i class="fas fa-clock"></i> ${cafe.isOpen === true ? 'Open' : cafe.isOpen === false ? 'Closed' : 'Hours unknown'}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="window.caffyRuteApp.getDirections(${cafe.location.lat}, ${cafe.location.lng})">
                        Get Directions
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    }
    
    // Get price level display
    getPriceLevel(level) {
        const levels = ['Free', '$', '$$', '$$$', '$$$$'];
        return levels[level] || '$$';
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
                <button class="btn-secondary" onclick="window.caffyRuteApp.showCafeDetails('${cafe.id}')">View Details</button>
                <button class="btn-primary" onclick="window.caffyRuteApp.getDirections(${cafe.location.lat}, ${cafe.location.lng}, '${cafe.name}')">Get Directions</button>
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
    
    // Show loading indicator
    showLoading(message = 'Finding the best cafés near you...') {
        try {
            const loadingElement = document.getElementById('loading-cafes');
            const cafeList = document.getElementById('cafe-list');
            
            if (loadingElement && cafeList) {
                loadingElement.innerHTML = `
                    <div class="loading-spinner"></div>
                    <p>${message}</p>
                `;
                loadingElement.style.display = 'flex';
                cafeList.style.display = 'none';
                console.log('Showing loading indicator:', message);
            } else {
                console.warn('Loading or cafe list elements not found');
            }
        } catch (error) {
            console.error('Error in showLoading:', error);
        }
    }
    
    // Hide loading indicator
    hideLoading() {
        try {
            const loadingElement = document.getElementById('loading-cafes');
            const cafeList = document.getElementById('cafe-list');
            
            if (loadingElement) {
                loadingElement.style.display = 'none';
                console.log('Hiding loading indicator');
            } else {
                console.warn('Loading element not found');
            }
            
            if (cafeList) {
                console.log('Setting cafe list display to visible');
                // Use block instead of grid to ensure consistent display
                cafeList.style.display = 'block';
            } else {
                console.warn('Cafe list element not found');
            }
        } catch (error) {
            console.error('Error in hideLoading:', error);
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
    
    // Unified search - first tries location search, then name search
    unifiedSearch(query) {
        console.log('Performing unified search for:', query);
        this.showLoading(`Searching for "${query}"...`);
        
        // First attempt: Try to geocode as a location
        this.geocoder.geocode({ address: query }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results.length > 0) {
                console.log('Location found, searching cafes nearby');
                const location = results[0].geometry.location;
                this.userLocation = location;
                
                // Update map center
                if (this.map) {
                    this.map.setCenter(location);
                    this.map.setZoom(14);
                }
                
                // Add marker for the location
                this.addLocationMarker(location);
                
                // Search for cafes near this location
                this.searchNearbyCafes();
                
                // Also search for cafes with the name matching the query
                this.searchCafesByName(query);
            } else {
                console.log('Not found as location, searching as cafe name');
                // Second attempt: Search for cafes with this name
                this.searchCafesByName(query);
            }
        });
    }
    
    // Search for cafes by name
    searchCafesByName(query) {
        if (!this.userLocation) {
            console.warn('User location not set for cafe name search');
            this.hideLoading();
            this.showError('Please allow location access or enter a specific location first.');
            return;
        }
        
        this.searchCafes(query);
    }
    
    // Add a marker for the selected location
    addLocationMarker(location) {
        // Clear existing location markers
        this.clearLocationMarkers();
        
        if (!this.map) return;
        
        // Create a marker for the location
        const marker = new google.maps.Marker({
            position: location,
            map: this.map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
            },
            animation: google.maps.Animation.DROP,
            title: 'Search Location'
        });
        
        // Store the marker
        this.locationMarker = marker;
        
        // Create a circle to show the search radius
        this.locationRadius = new google.maps.Circle({
            map: this.map,
            center: location,
            radius: 5000, // 5km initial radius
            strokeColor: '#4285F4',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#4285F4',
            fillOpacity: 0.1
        });
    }
    
    // Clear location markers
    clearLocationMarkers() {
        if (this.locationMarker) {
            this.locationMarker.setMap(null);
            this.locationMarker = null;
        }
        
        if (this.locationRadius) {
            this.locationRadius.setMap(null);
            this.locationRadius = null;
        }
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
