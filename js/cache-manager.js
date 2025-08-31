// Cache Manager for CaffyRute
// Handles caching of search results, cafe data, and user preferences

class CacheManager {
    constructor() {
        this.cachePrefix = 'caffyrute_';
        this.cacheVersion = 1;
        this.maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.maxCachedItems = 100; // Maximum number of cafes to cache
        this.initializeCache();
        console.log('CacheManager initialized');
    }

    initializeCache() {
        // Clean up old cache entries
        this.cleanupOldCache();
        
        // Initialize cache statistics
        const stats = this.getCacheStats();
        console.log('Cache stats:', stats);
    }

    cleanupOldCache() {
        // Remove old version cache items
        try {
            const oldVersion = localStorage.getItem(this.cachePrefix + 'version');
            if (!oldVersion || parseInt(oldVersion) < this.cacheVersion) {
                console.log('Upgrading cache from version', oldVersion, 'to', this.cacheVersion);
                // Clear old cache items (except favorites)
                this.clearCache(false);
                // Set new version
                localStorage.setItem(this.cachePrefix + 'version', this.cacheVersion);
            }
        } catch (e) {
            console.error('Error cleaning up old cache:', e);
        }
    }

    getCacheStats() {
        try {
            // Get all cache keys
            const keys = Object.keys(localStorage).filter(key => key.startsWith(this.cachePrefix));
            
            // Count types
            const stats = {
                total: keys.length,
                cafes: 0,
                images: 0,
                searches: 0,
                userPrefs: 0,
                other: 0
            };
            
            keys.forEach(key => {
                if (key.includes('_cafe_')) {
                    stats.cafes++;
                } else if (key.includes('_img_')) {
                    stats.images++;
                } else if (key.includes('_search_')) {
                    stats.searches++;
                } else if (key.includes('_prefs')) {
                    stats.userPrefs++;
                } else {
                    stats.other++;
                }
            });
            
            return stats;
        } catch (e) {
            console.error('Error getting cache stats:', e);
            return { error: e.message };
        }
    }

    clearCache(includeFavorites = false) {
        try {
            // Get all cache keys
            const allKeys = Object.keys(localStorage);
            
            // Filter for our cache keys
            const cacheKeys = allKeys.filter(key => 
                key.startsWith(this.cachePrefix) && 
                (includeFavorites || key !== this.cachePrefix + 'favorites')
            );
            
            // Remove them
            cacheKeys.forEach(key => localStorage.removeItem(key));
            console.log(`Cleared ${cacheKeys.length} cache items${includeFavorites ? ' including favorites' : ''}`);
            
            return true;
        } catch (e) {
            console.error('Error clearing cache:', e);
            return false;
        }
    }

    // Save cafe data to cache
    cacheCafe(cafe) {
        if (!cafe || !cafe.id) return false;
        
        try {
            const key = this.cachePrefix + 'cafe_' + cafe.id;
            const cacheItem = {
                data: cafe,
                timestamp: Date.now()
            };
            
            localStorage.setItem(key, JSON.stringify(cacheItem));
            return true;
        } catch (e) {
            console.error('Error caching cafe:', e);
            return false;
        }
    }

    // Cache multiple cafes at once
    cacheCafes(cafes) {
        if (!cafes || !Array.isArray(cafes)) return 0;
        
        let count = 0;
        cafes.forEach(cafe => {
            if (this.cacheCafe(cafe)) count++;
        });
        
        return count;
    }

    // Get cafe data from cache
    getCafe(cafeId) {
        if (!cafeId) return null;
        
        try {
            const key = this.cachePrefix + 'cafe_' + cafeId;
            const cached = localStorage.getItem(key);
            
            if (!cached) return null;
            
            const cacheItem = JSON.parse(cached);
            
            // Check if cache is still valid
            if (Date.now() - cacheItem.timestamp > this.maxCacheAge) {
                localStorage.removeItem(key);
                return null;
            }
            
            return cacheItem.data;
        } catch (e) {
            console.error('Error getting cached cafe:', e);
            return null;
        }
    }

    // Cache search results
    cacheSearchResults(location, radius, results) {
        if (!location || !results) return false;
        
        try {
            // Create a hash of the search parameters
            const searchHash = this.hashSearchParams(location, radius);
            const key = this.cachePrefix + 'search_' + searchHash;
            
            const cacheItem = {
                params: { location, radius },
                results: results.map(r => r.id), // Just store IDs to save space
                timestamp: Date.now()
            };
            
            localStorage.setItem(key, JSON.stringify(cacheItem));
            
            // Also cache individual cafe data
            this.cacheCafes(results);
            
            return true;
        } catch (e) {
            console.error('Error caching search results:', e);
            return false;
        }
    }

    // Get cached search results
    getSearchResults(location, radius) {
        if (!location) return null;
        
        try {
            // Create a hash of the search parameters
            const searchHash = this.hashSearchParams(location, radius);
            const key = this.cachePrefix + 'search_' + searchHash;
            
            const cached = localStorage.getItem(key);
            if (!cached) return null;
            
            const cacheItem = JSON.parse(cached);
            
            // Check if cache is still valid
            if (Date.now() - cacheItem.timestamp > this.maxCacheAge) {
                localStorage.removeItem(key);
                return null;
            }
            
            // Get the full cafe data for each ID
            const results = [];
            for (const id of cacheItem.results) {
                const cafe = this.getCafe(id);
                if (cafe) results.push(cafe);
            }
            
            return results.length > 0 ? results : null;
        } catch (e) {
            console.error('Error getting cached search results:', e);
            return null;
        }
    }

    // Cache image URL with base64 data
    cacheImage(imageUrl, imageData) {
        if (!imageUrl || !imageData) return false;
        
        try {
            // Create a hash of the URL
            const urlHash = this.hashString(imageUrl);
            const key = this.cachePrefix + 'img_' + urlHash;
            
            const cacheItem = {
                url: imageUrl,
                data: imageData,
                timestamp: Date.now()
            };
            
            localStorage.setItem(key, JSON.stringify(cacheItem));
            return true;
        } catch (e) {
            console.error('Error caching image:', e);
            return false;
        }
    }

    // Get cached image
    getCachedImage(imageUrl) {
        if (!imageUrl) return null;
        
        try {
            // Create a hash of the URL
            const urlHash = this.hashString(imageUrl);
            const key = this.cachePrefix + 'img_' + urlHash;
            
            const cached = localStorage.getItem(key);
            if (!cached) return null;
            
            const cacheItem = JSON.parse(cached);
            
            // Check if cache is still valid (keep images longer)
            if (Date.now() - cacheItem.timestamp > this.maxCacheAge * 2) {
                localStorage.removeItem(key);
                return null;
            }
            
            return cacheItem.data;
        } catch (e) {
            console.error('Error getting cached image:', e);
            return null;
        }
    }

    // Save user preferences
    saveUserPreferences(prefs) {
        try {
            const key = this.cachePrefix + 'user_prefs';
            localStorage.setItem(key, JSON.stringify(prefs));
            return true;
        } catch (e) {
            console.error('Error saving user preferences:', e);
            return false;
        }
    }

    // Get user preferences
    getUserPreferences() {
        try {
            const key = this.cachePrefix + 'user_prefs';
            const prefs = localStorage.getItem(key);
            return prefs ? JSON.parse(prefs) : null;
        } catch (e) {
            console.error('Error getting user preferences:', e);
            return null;
        }
    }

    // Save last user location
    saveLastLocation(location) {
        if (!location || !location.lat || !location.lng) return false;
        
        try {
            const key = this.cachePrefix + 'last_location';
            localStorage.setItem(key, JSON.stringify({
                lat: location.lat,
                lng: location.lng,
                timestamp: Date.now()
            }));
            return true;
        } catch (e) {
            console.error('Error saving last location:', e);
            return false;
        }
    }

    // Get last user location
    getLastLocation() {
        try {
            const key = this.cachePrefix + 'last_location';
            const location = localStorage.getItem(key);
            
            if (!location) return null;
            
            const locationData = JSON.parse(location);
            
            // Only use locations from the last day
            if (Date.now() - locationData.timestamp > 24 * 60 * 60 * 1000) {
                localStorage.removeItem(key);
                return null;
            }
            
            return { lat: locationData.lat, lng: locationData.lng };
        } catch (e) {
            console.error('Error getting last location:', e);
            return null;
        }
    }

    // Helper method to hash search parameters
    hashSearchParams(location, radius) {
        // Round coordinates to 3 decimal places (approx 100m accuracy)
        const lat = Math.round(parseFloat(location.lat) * 1000) / 1000;
        const lng = Math.round(parseFloat(location.lng) * 1000) / 1000;
        
        // Round radius to nearest 100m
        const rad = Math.round(parseInt(radius) / 100) * 100;
        
        // Create hash string
        const hashStr = `${lat}_${lng}_${rad}`;
        return this.hashString(hashStr);
    }

    // Simple string hash function
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    }

    // Save recent searches
    addRecentSearch(query, location) {
        try {
            const key = this.cachePrefix + 'recent_searches';
            let searches = [];
            
            const saved = localStorage.getItem(key);
            if (saved) {
                searches = JSON.parse(saved);
            }
            
            // Add new search to the beginning
            searches.unshift({
                query,
                location,
                timestamp: Date.now()
            });
            
            // Keep only the 10 most recent searches
            searches = searches.slice(0, 10);
            
            localStorage.setItem(key, JSON.stringify(searches));
            return true;
        } catch (e) {
            console.error('Error saving recent search:', e);
            return false;
        }
    }

    // Get recent searches
    getRecentSearches() {
        try {
            const key = this.cachePrefix + 'recent_searches';
            const saved = localStorage.getItem(key);
            
            if (!saved) return [];
            
            return JSON.parse(saved);
        } catch (e) {
            console.error('Error getting recent searches:', e);
            return [];
        }
    }
}

// Initialize cache manager
const cacheManager = new CacheManager();
