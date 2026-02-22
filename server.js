/**
 * Local development server.
 * Wraps the Vercel serverless functions as Express routes
 * and serves static frontend files.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers (relaxed for local dev)
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    })
);

// CORS
app.use(cors());

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// Import serverless functions
const nearbyCafes = require('./api/nearby-cafes');
const cafeDetails = require('./api/cafe-details');
const geocodeHandler = require('./api/geocode');
const autocompleteHandler = require('./api/autocomplete');
const configHandler = require('./api/config');

// API routes
app.get('/api/nearby-cafes', nearbyCafes);
app.get('/api/cafe-details', cafeDetails);
app.get('/api/geocode', geocodeHandler);
app.get('/api/autocomplete', autocompleteHandler);
app.get('/api/config', configHandler);

// Serve static files (frontend)
app.use(express.static(path.join(__dirname), {
    extensions: ['html'],
}));

// Start server
app.listen(PORT, () => {
    console.log(`CaffyRute server running at http://localhost:${PORT}`);

    if (!process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_KEY === 'your_google_places_api_key_here') {
        console.warn('\nWARNING: GOOGLE_PLACES_API_KEY is not set.');
        console.warn('Copy .env.example to .env and add your API key.\n');
    }
});
