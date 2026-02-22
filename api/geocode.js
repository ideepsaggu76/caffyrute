/**
 * GET /api/geocode
 *
 * Converts an address to coordinates.
 *
 * Query params:
 *   address - Address or place name to geocode (required)
 */

const { sanitizeString } = require('./_lib/validate');
const { geocode } = require('./_lib/google-places');
const cache = require('./_lib/cache');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const address = sanitizeString(req.query.address);

        if (!address || address.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Address is required (at least 2 characters)',
            });
        }

        // Check cache (30 min for geocoding)
        const cacheKey = `geocode:${address.toLowerCase()}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.status(200).json(cached);
        }

        const result = await geocode(address);

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'No location found for the given address',
            });
        }

        const response = {
            success: true,
            ...result,
        };

        cache.set(cacheKey, response, 30 * 60 * 1000);

        return res.status(200).json(response);
    } catch (error) {
        console.error('geocode error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to geocode address. Please try again.',
        });
    }
};
