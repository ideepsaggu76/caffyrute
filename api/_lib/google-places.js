/**
 * Server-side Google Places API wrapper using HTTP endpoints.
 */

const fetch = require('node-fetch');

const API_BASE = 'https://maps.googleapis.com/maps/api';

function getApiKey() {
    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key || key === 'your_google_places_api_key_here') {
        throw new Error('GOOGLE_PLACES_API_KEY environment variable is not set');
    }
    return key;
}

/**
 * Search for nearby places.
 * Returns raw Google API response results array.
 */
async function nearbySearch(lat, lng, radius, keyword = 'cafe coffee') {
    const key = getApiKey();
    const url = new URL(`${API_BASE}/place/nearbysearch/json`);
    url.searchParams.set('location', `${lat},${lng}`);
    url.searchParams.set('radius', String(radius));
    url.searchParams.set('type', 'cafe');
    url.searchParams.set('keyword', keyword);
    url.searchParams.set('key', key);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status === 'OK') {
        return { results: data.results, nextPageToken: data.next_page_token || null };
    }
    if (data.status === 'ZERO_RESULTS') {
        return { results: [], nextPageToken: null };
    }

    throw new Error(`Google Places API error: ${data.status} - ${data.error_message || ''}`);
}

/**
 * Get detailed place information.
 */
async function placeDetails(placeId) {
    const key = getApiKey();
    const fields = [
        'place_id', 'name', 'geometry', 'rating', 'user_ratings_total',
        'price_level', 'photos', 'opening_hours', 'formatted_address',
        'reviews', 'website', 'formatted_phone_number', 'types',
        'business_status', 'vicinity'
    ].join(',');

    const url = new URL(`${API_BASE}/place/details/json`);
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('fields', fields);
    url.searchParams.set('key', key);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status === 'OK') {
        return data.result;
    }

    throw new Error(`Google Places Details error: ${data.status} - ${data.error_message || ''}`);
}

/**
 * Geocode an address to coordinates.
 */
async function geocode(address) {
    const key = getApiKey();
    const url = new URL(`${API_BASE}/geocode/json`);
    url.searchParams.set('address', address);
    url.searchParams.set('key', key);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            formattedAddress: result.formatted_address,
        };
    }
    if (data.status === 'ZERO_RESULTS') {
        return null;
    }

    throw new Error(`Geocoding error: ${data.status} - ${data.error_message || ''}`);
}

/**
 * Get autocomplete predictions for a query.
 */
async function autocomplete(input, types = 'geocode') {
    const key = getApiKey();
    const url = new URL(`${API_BASE}/place/autocomplete/json`);
    url.searchParams.set('input', input);
    url.searchParams.set('types', types);
    url.searchParams.set('components', 'country:in');
    url.searchParams.set('key', key);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status === 'OK') {
        return data.predictions.map((p) => ({
            placeId: p.place_id,
            description: p.description,
            mainText: p.structured_formatting?.main_text || p.description,
            secondaryText: p.structured_formatting?.secondary_text || '',
        }));
    }
    if (data.status === 'ZERO_RESULTS') {
        return [];
    }

    throw new Error(`Autocomplete error: ${data.status} - ${data.error_message || ''}`);
}

/**
 * Build a proxied photo URL.
 * Keeps the API key server-side by routing through /api/photo.
 */
function buildPhotoUrl(photoReference, maxWidth = 400) {
    const key = getApiKey();
    return `${API_BASE}/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${key}`;
}

module.exports = { nearbySearch, placeDetails, geocode, autocomplete, buildPhotoUrl };
