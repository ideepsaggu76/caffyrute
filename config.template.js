// CaffyRute Configuration Template
// Copy this file as config.js and add your own API keys

// Configuration object for the application
const CONFIG = {
    // API Keys
    GOOGLE_MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY', // Replace with your actual API key
    
    // App Settings
    APP_NAME: 'CaffyRute',
    VERSION: '1.0.0',
    
    // Feature Flags
    ENABLE_CACHING: true,
    ENABLE_ANALYTICS: false
};

// Prevent direct modification of the config object
Object.freeze(CONFIG);
