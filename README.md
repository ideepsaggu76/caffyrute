# CaffyRute - Find Perfect Cafés Near You

CaffyRute is a web application that helps users discover cafés near their location with real-time updates, smart filters, ratings, and reviews.

## Setup Instructions

### API Keys Configuration

For security reasons, API keys are not included in the repository. Follow these steps to set up your API keys:

1. Copy `config.template.js` to create a new file named `config.js`:
   ```
   cp config.template.js config.js
   ```

2. Edit `config.js` and replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual Google Maps API key.
   You can obtain a Google Maps API key from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

3. Make sure to enable the following APIs in your Google Cloud project:
   - Maps JavaScript API
   - Places API
   - Geocoding API

### Running the Application

To run the application locally:

1. Use a local server such as Python's built-in HTTP server:
   ```
   python -m http.server 8000
   ```
   or any other local development server of your choice.

2. Open your browser and navigate to `http://localhost:8000`.

## Features

- Location-based café search
- Filtering options (WiFi, Pet Friendly, 24/7)
- Café details with photos and reviews
- Favorites system for saving preferred cafés
- Local caching for improved performance

## Security Notes

- The `config.js` file containing API keys is listed in `.gitignore` and should never be committed to the repository.
- Always follow best practices for handling API keys and sensitive information.
- For production deployment, consider using environment variables and server-side API key handling.