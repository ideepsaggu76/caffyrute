// Image loader with caching for CaffyRute

class ImageLoader {
    constructor() {
        this.defaultImage = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&h=200&fit=crop';
        this.placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkxvYWRpbmcgaW1hZ2UuLi48L3RleHQ+PC9zdmc+';
        this.errorImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZWRlZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNjOTUxNTEiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
        this.imageCache = {};
        this.loadingPromises = {}; // Track loading promises to avoid duplicate loads
        this.cafePlaceholders = [
            'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop&q=80',
            'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&h=200&fit=crop&q=80',
            'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=300&h=200&fit=crop&q=80',
            'https://images.unsplash.com/photo-1513267048331-5611cad62e41?w=300&h=200&fit=crop&q=80',
            'https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?w=300&h=200&fit=crop&q=80'
        ];
        
        console.log('ImageLoader initialized');
    }

    // Get a random coffee placeholder image
    getRandomPlaceholder() {
        return this.cafePlaceholders[Math.floor(Math.random() * this.cafePlaceholders.length)];
    }

    // Get a specific cafe image by name and features
    getCafeImageUrl(cafeName, features = []) {
        // Generate a cafe-specific search query based on name and features
        let query = 'cafe coffee';
        
        if (cafeName) {
            // Extract meaningful terms from the cafe name
            const terms = cafeName.toLowerCase().split(' ').filter(word => 
                word.length > 2 && 
                !['cafe', 'coffee', 'the', 'and', 'restaurant', 'shop', 'bar'].includes(word)
            );
            
            if (terms.length > 0) {
                // Just use the first term to avoid too specific queries
                query = `cafe ${terms[0]}`;
            }
        }
        
        // Add a relevant feature to the query if available
        if (features && features.length > 0) {
            const relevantFeatures = features.filter(f => 
                ['coffee', 'bakery', 'breakfast', 'dessert', 'espresso'].includes(f.text.toLowerCase())
            );
            
            if (relevantFeatures.length > 0) {
                query += ` ${relevantFeatures[0].text.toLowerCase()}`;
            }
        }
        
        // Create a deterministic "random" index based on cafe name
        let index = 0;
        if (cafeName) {
            for (let i = 0; i < cafeName.length; i++) {
                index += cafeName.charCodeAt(i);
            }
            index = index % this.cafePlaceholders.length;
        } else {
            index = Math.floor(Math.random() * this.cafePlaceholders.length);
        }
        
        // Use the deterministic index to choose a placeholder
        const fallback = this.cafePlaceholders[index];
        
        // Try to get a more specific image using Unsplash source API
        return `https://source.unsplash.com/300x200/?${encodeURIComponent(query)}`;
    }

    // Load an image with caching
    loadImage(url, cafeName = null, features = []) {
        // If no URL or invalid URL, use a placeholder
        if (!url || url === 'undefined' || url === 'null') {
            return Promise.resolve(this.getCafeImageUrl(cafeName, features));
        }
        
        // Check memory cache first
        if (this.imageCache[url]) {
            return Promise.resolve(this.imageCache[url]);
        }
        
        // Check if we already have a promise for this URL
        if (this.loadingPromises[url]) {
            return this.loadingPromises[url];
        }
        
        // Check localStorage cache if available
        if (window.cacheManager) {
            const cachedImage = window.cacheManager.getCachedImage(url);
            if (cachedImage) {
                this.imageCache[url] = cachedImage;
                return Promise.resolve(cachedImage);
            }
        }
        
        // Create a new promise for loading the image
        const loadPromise = new Promise((resolve) => {
            const img = new Image();
            
            // Set a timeout to prevent hanging on load
            const timeout = setTimeout(() => {
                console.warn(`Image load timeout for: ${url}`);
                const fallbackUrl = this.getCafeImageUrl(cafeName, features);
                this.imageCache[url] = fallbackUrl;
                delete this.loadingPromises[url];
                resolve(fallbackUrl);
            }, 5000); // 5 seconds timeout
            
            img.onload = () => {
                clearTimeout(timeout);
                delete this.loadingPromises[url];
                this.imageCache[url] = url; // Cache the successful URL
                
                // Try to cache in localStorage if supported
                if (window.cacheManager) {
                    window.cacheManager.cacheImage(url, url);
                }
                
                resolve(url);
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                console.warn(`Failed to load image: ${url}`);
                const fallbackUrl = this.getCafeImageUrl(cafeName, features);
                this.imageCache[url] = fallbackUrl;
                delete this.loadingPromises[url];
                resolve(fallbackUrl);
            };
            
            img.src = url;
        });
        
        // Store the promise
        this.loadingPromises[url] = loadPromise;
        
        return loadPromise;
    }

    // Helper to apply images to DOM elements
    applyImageToElement(imgElement, url, cafeName = null, features = []) {
        if (!imgElement) return;
        
        // Set placeholder initially
        imgElement.src = this.placeholderImage;
        
        this.loadImage(url, cafeName, features)
            .then(resolvedUrl => {
                imgElement.src = resolvedUrl;
            })
            .catch(error => {
                console.error('Error loading image:', error);
                imgElement.src = this.errorImage;
            });
    }

    // Preload images for a set of cafes
    preloadCafeImages(cafes) {
        if (!cafes || !Array.isArray(cafes)) return;
        
        // Preload just the first image for each cafe
        cafes.forEach(cafe => {
            if (cafe && cafe.photos && cafe.photos.length > 0 && cafe.photos[0].url) {
                this.loadImage(cafe.photos[0].url, cafe.name, cafe.features)
                    .catch(err => console.warn('Error preloading cafe image:', err));
            }
        });
    }
}

// Initialize the image loader
const imageLoader = new ImageLoader();
