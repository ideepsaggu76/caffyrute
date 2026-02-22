/**
 * GET /api/autocomplete
 *
 * Returns location autocomplete predictions.
 *
 * Query params:
 *   input - Search text (required, min 2 chars)
 *   types - Prediction types: geocode|establishment (default: geocode)
 */

const { sanitizeString } = require('./_lib/validate');
const { autocomplete } = require('./_lib/google-places');
const cache = require('./_lib/cache');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const input = sanitizeString(req.query.input);
        const types = req.query.types || 'geocode';

        if (!input || input.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Input is required (at least 2 characters)',
            });
        }

        // Check cache (2 min for autocomplete)
        const cacheKey = `autocomplete:${input.toLowerCase()}:${types}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.status(200).json(cached);
        }

        const predictions = await autocomplete(input, types);

        const response = {
            success: true,
            predictions,
        };

        cache.set(cacheKey, response, 2 * 60 * 1000);

        return res.status(200).json(response);
    } catch (error) {
        console.error('autocomplete error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to get suggestions. Please try again.',
        });
    }
};
