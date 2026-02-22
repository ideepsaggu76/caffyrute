/**
 * GET /api/config
 *
 * Returns client-side configuration (Maps API key from environment).
 * This allows the frontend to load without a local config.js file.
 */

require('dotenv').config();

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured on server' });
    }

    // Cache for 5 minutes - this rarely changes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.setHeader('Access-Control-Allow-Origin', '*');

    return res.status(200).json({
        GOOGLE_MAPS_API_KEY: apiKey,
        API_BASE_URL: '',
        APP_NAME: 'CaffyRute',
        VERSION: '2.0.0',
        ENABLE_CACHING: true,
        ENABLE_ANALYTICS: false
    });
};
