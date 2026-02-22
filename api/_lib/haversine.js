/**
 * Haversine formula for calculating great-circle distance
 * between two points on Earth.
 */

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two coordinates in kilometers.
 * Returns null for invalid inputs.
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
    lat1 = parseFloat(lat1);
    lng1 = parseFloat(lng1);
    lat2 = parseFloat(lat2);
    lng2 = parseFloat(lng2);

    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
        return null;
    }

    if (lat1 === lat2 && lng1 === lng2) {
        return 0.01; // 10 meters for same location
    }

    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (!isFinite(distance) || distance < 0) {
        return null;
    }

    return Math.round(distance * 100) / 100; // 2 decimal places
}

module.exports = { calculateDistance };
