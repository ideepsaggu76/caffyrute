/**
 * GET /api/nearby-cafes
 *
 * Searches for cafes near a given location with server-side
 * distance calculation, filtering, and sorting.
 *
 * Query params:
 *   lat       - Latitude (required)
 *   lng       - Longitude (required)
 *   radius    - Search radius in meters (default: 5000)
 *   sort      - Sort by: distance|rating|price|reviews (default: distance)
 *   minRating - Minimum rating filter (default: 0)
 *   maxPrice  - Maximum price level 1-4 (default: 4)
 */

const { validateCoordinates, validateRadius } = require('./_lib/validate');
const { calculateDistance } = require('./_lib/haversine');
const { nearbySearch, buildPhotoUrl } = require('./_lib/google-places');
const cache = require('./_lib/cache');

// Cafe-relevance scoring (mirrors frontend quickFilterCafes logic)
function scoreCafe(place) {
    let score = 0;
    const types = place.types || [];
    const name = (place.name || '').toLowerCase();

    // Type scoring
    if (types.includes('cafe')) score += 15;
    if (types.includes('coffee_shop')) score += 15;
    if (types.includes('bakery')) score += 10;
    if (types.includes('restaurant')) score += 5;

    // Penalize non-cafe types
    if (types.includes('gas_station')) score -= 20;
    if (types.includes('lodging')) score -= 15;
    if (types.includes('car_repair')) score -= 20;

    // Name scoring
    const cafeWords = ['cafe', 'café', 'coffee', 'espresso', 'brew', 'roast', 'latte', 'cappuccino', 'tea', 'chai'];
    for (const word of cafeWords) {
        if (name.includes(word)) { score += 10; break; }
    }

    // Brand detection
    const brands = ['starbucks', 'costa', 'blue tokai', 'third wave', 'barista', 'chaayos', 'cafe coffee day'];
    for (const brand of brands) {
        if (name.includes(brand)) { score += 15; break; }
    }

    // Rating bonus
    if (place.rating >= 4.5) score += 10;
    else if (place.rating >= 4.0) score += 5;

    // Review count bonus
    if ((place.user_ratings_total || 0) > 100) score += 5;

    return score;
}

function formatCafe(place, userLat, userLng) {
    const placeLat = place.geometry?.location?.lat;
    const placeLng = place.geometry?.location?.lng;
    const distance = calculateDistance(userLat, userLng, placeLat, placeLng);

    // Build photo URLs from photo_reference
    const photos = (place.photos || []).slice(0, 3).map((photo) => ({
        url: buildPhotoUrl(photo.photo_reference, 400),
        width: photo.width,
        height: photo.height,
    }));

    return {
        id: place.place_id,
        name: place.name || 'Unknown Cafe',
        rating: place.rating || 0,
        reviewCount: place.user_ratings_total || 0,
        priceLevel: place.price_level !== undefined ? place.price_level : null,
        address: place.vicinity || place.formatted_address || '',
        location: { lat: placeLat, lng: placeLng },
        distance: distance,
        isOpen: place.opening_hours?.open_now ?? null,
        photos: photos,
        types: place.types || [],
        businessStatus: place.business_status || 'OPERATIONAL',
        relevanceScore: scoreCafe(place),
    };
}

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { lat, lng, radius: rawRadius, sort = 'distance', minRating = '0', maxPrice = '4' } = req.query;

        // Validate inputs
        const coordResult = validateCoordinates(lat, lng);
        if (!coordResult.valid) {
            return res.status(400).json({ success: false, error: coordResult.error });
        }

        const radiusResult = validateRadius(rawRadius);
        if (!radiusResult.valid) {
            return res.status(400).json({ success: false, error: radiusResult.error });
        }

        const userLat = coordResult.lat;
        const userLng = coordResult.lng;
        const radius = radiusResult.radius;
        const radiusKm = radius / 1000;

        // Check cache
        const cacheKey = cache.searchKey(userLat, userLng, radius);
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.status(200).json(cached);
        }

        // Call Google Places API
        const { results } = await nearbySearch(userLat, userLng, radius);

        // Format, calculate distances, and score
        let cafes = results.map((place) => formatCafe(place, userLat, userLng));

        // Filter: only cafes with positive relevance score
        cafes = cafes.filter((c) => c.relevanceScore > 0);

        // Post-filter: remove cafes outside the requested radius
        cafes = cafes.filter((c) => {
            if (c.distance === null) return false;
            return c.distance <= radiusKm;
        });

        // Apply rating filter
        const minRatingNum = parseFloat(minRating) || 0;
        if (minRatingNum > 0) {
            cafes = cafes.filter((c) => c.rating >= minRatingNum);
        }

        // Apply price filter
        const maxPriceNum = parseInt(maxPrice, 10) || 4;
        if (maxPriceNum < 4) {
            cafes = cafes.filter((c) => c.priceLevel === null || c.priceLevel <= maxPriceNum);
        }

        // Sort
        switch (sort) {
            case 'rating':
                cafes.sort((a, b) => b.rating - a.rating);
                break;
            case 'price':
                cafes.sort((a, b) => (a.priceLevel ?? 2) - (b.priceLevel ?? 2));
                break;
            case 'reviews':
                cafes.sort((a, b) => b.reviewCount - a.reviewCount);
                break;
            case 'distance':
            default:
                cafes.sort((a, b) => {
                    if (a.distance === null && b.distance === null) return 0;
                    if (a.distance === null) return 1;
                    if (b.distance === null) return -1;
                    return a.distance - b.distance;
                });
                break;
        }

        const response = {
            success: true,
            count: cafes.length,
            userLocation: { lat: userLat, lng: userLng },
            radius: radius,
            cafes: cafes,
        };

        // Cache for 5 minutes
        cache.set(cacheKey, response);

        return res.status(200).json(response);
    } catch (error) {
        console.error('nearby-cafes error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to search for cafes. Please try again.',
        });
    }
};
