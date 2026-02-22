/**
 * Input validation utilities for API endpoints.
 */

function validateCoordinates(lat, lng) {
    lat = parseFloat(lat);
    lng = parseFloat(lng);

    if (isNaN(lat) || isNaN(lng)) {
        return { valid: false, error: 'Latitude and longitude must be numbers' };
    }
    if (lat < -90 || lat > 90) {
        return { valid: false, error: 'Latitude must be between -90 and 90' };
    }
    if (lng < -180 || lng > 180) {
        return { valid: false, error: 'Longitude must be between -180 and 180' };
    }

    return { valid: true, lat, lng };
}

function validateRadius(radius) {
    radius = parseInt(radius, 10);

    if (isNaN(radius)) {
        return { valid: true, radius: 5000 }; // default 5km
    }
    if (radius < 100) {
        return { valid: false, error: 'Radius must be at least 100 meters' };
    }
    if (radius > 50000) {
        return { valid: false, error: 'Radius cannot exceed 50000 meters (50 km)' };
    }

    return { valid: true, radius };
}

function validatePlaceId(placeId) {
    if (!placeId || typeof placeId !== 'string') {
        return { valid: false, error: 'Place ID is required' };
    }
    // Google Place IDs are alphanumeric with dashes and underscores
    if (!/^[A-Za-z0-9_-]+$/.test(placeId)) {
        return { valid: false, error: 'Invalid Place ID format' };
    }

    return { valid: true, placeId };
}

function sanitizeString(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/[<>]/g, '') // strip angle brackets
        .trim()
        .slice(0, 500); // cap length
}

module.exports = { validateCoordinates, validateRadius, validatePlaceId, sanitizeString };
