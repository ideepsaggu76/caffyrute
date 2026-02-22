/**
 * GET /api/cafe-details
 *
 * Fetches detailed information about a specific cafe.
 *
 * Query params:
 *   placeId - Google Place ID (required)
 *   lat     - User latitude (optional, for distance calc)
 *   lng     - User longitude (optional, for distance calc)
 */

const { validatePlaceId, validateCoordinates } = require('./_lib/validate');
const { calculateDistance } = require('./_lib/haversine');
const { placeDetails, buildPhotoUrl } = require('./_lib/google-places');
const cache = require('./_lib/cache');

function formatDetails(place, userLat, userLng) {
    const placeLat = place.geometry?.location?.lat;
    const placeLng = place.geometry?.location?.lng;

    let distance = null;
    if (userLat != null && userLng != null) {
        distance = calculateDistance(userLat, userLng, placeLat, placeLng);
    }

    // Build photo URLs
    const photos = (place.photos || []).map((photo) => ({
        url: buildPhotoUrl(photo.photo_reference, 800),
        width: photo.width,
        height: photo.height,
    }));

    // Format reviews
    const reviews = (place.reviews || []).map((r) => ({
        author: r.author_name,
        rating: r.rating,
        text: r.text,
        time: r.relative_time_description,
        profilePhoto: r.profile_photo_url,
    }));

    // Format opening hours
    const openingHours = place.opening_hours?.weekday_text || [];

    return {
        id: place.place_id,
        name: place.name || 'Unknown Cafe',
        rating: place.rating || 0,
        reviewCount: place.user_ratings_total || 0,
        priceLevel: place.price_level !== undefined ? place.price_level : null,
        address: place.formatted_address || place.vicinity || '',
        location: { lat: placeLat, lng: placeLng },
        distance: distance,
        isOpen: place.opening_hours?.open_now ?? null,
        photos: photos,
        types: place.types || [],
        businessStatus: place.business_status || 'OPERATIONAL',
        website: place.website || null,
        phone: place.formatted_phone_number || null,
        reviews: reviews,
        openingHours: openingHours,
    };
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { placeId, lat, lng } = req.query;

        const placeIdResult = validatePlaceId(placeId);
        if (!placeIdResult.valid) {
            return res.status(400).json({ success: false, error: placeIdResult.error });
        }

        // Optional user location for distance
        let userLat = null;
        let userLng = null;
        if (lat && lng) {
            const coordResult = validateCoordinates(lat, lng);
            if (coordResult.valid) {
                userLat = coordResult.lat;
                userLng = coordResult.lng;
            }
        }

        // Check cache (1 hour TTL for details)
        const cacheKey = `details:${placeId}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            // Recalculate distance with current user location
            if (userLat != null && userLng != null) {
                cached.cafe.distance = calculateDistance(
                    userLat, userLng,
                    cached.cafe.location.lat, cached.cafe.location.lng
                );
            }
            return res.status(200).json(cached);
        }

        const place = await placeDetails(placeId);
        const cafe = formatDetails(place, userLat, userLng);

        const response = { success: true, cafe };

        // Cache for 1 hour
        cache.set(cacheKey, response, 60 * 60 * 1000);

        return res.status(200).json(response);
    } catch (error) {
        console.error('cafe-details error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch cafe details. Please try again.',
        });
    }
};
