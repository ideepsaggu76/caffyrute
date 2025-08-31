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
