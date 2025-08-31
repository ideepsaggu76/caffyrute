# Google Maps API Setup Guide for CaffyRute

## 🗝️ Getting Your Google Maps API Key

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click "Create Project" or select an existing project
4. Give your project a name (e.g., "CaffyRute")

### Step 2: Enable Required APIs
1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Enable these APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**

### Step 3: Create API Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy your API key (it will look like: `AIzaSyBvOkBsgcJlDdFI_8-_NZ8QZ8BQ5Q8...`)

### Step 4: Secure Your API Key (Recommended)
1. Click on your API key in the credentials list
2. Add HTTP referrers (websites) restrictions:
   - For local development: `http://localhost:8000/*`
   - For GitHub Pages: `https://ideepsaggu76.github.io/*`
   - For your custom domain: `https://yourdomain.com/*`

### Step 5: Add API Key to Your Project
1. Open `index.html` in your CaffyRute project
2. Find this line:
   ```javascript
   const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
   ```
3. Replace `'YOUR_GOOGLE_MAPS_API_KEY'` with your actual API key:
   ```javascript
   const GOOGLE_MAPS_API_KEY = 'AIzaSyBvOkBsgcJlDdFI_8-_NZ8QZ8BQ5Q8...';
   ```

## 💰 API Pricing & Limits

### Free Tier
Google provides a generous free tier:
- **$200 monthly credit** for new users
- **Maps JavaScript API**: $7 per 1,000 loads (28,571 free loads/month)
- **Places API**: $17 per 1,000 requests (11,764 free requests/month)

### For a typical café finder app:
- **Light usage** (< 1,000 users/month): Usually stays within free limits
- **Medium usage** (1,000-10,000 users/month): $5-50/month
- **Heavy usage** (10,000+ users/month): $50+/month

## 🔧 Features Enabled with Real API

Once you add your API key, CaffyRute will have:

### ✅ Real Café Data
- **Genuine café listings** from Google Places
- **Real ratings and reviews** from Google users
- **Actual opening hours** and contact information
- **Real-time business status** (open/closed)

### ✅ Accurate Information
- **Real addresses** and locations
- **Actual photos** from Google Street View and business owners
- **Verified phone numbers** and websites
- **Current business information**

### ✅ Interactive Map
- **User location detection**
- **Interactive Google Map** with café markers
- **Click-to-view details** info windows
- **Get directions** integration

### ✅ Smart Search & Filters
- **Location-based search** (1km, 3km, 5km, 10km radius)
- **Text search** for specific café names or types
- **Sort by**: Rating, Distance, Price, Review Count
- **Real-time filtering** based on café features

### ✅ Enhanced User Experience
- **Real distance calculations** from user location
- **Live business hours** and status
- **Detailed café modals** with photos, reviews, and info
- **Direct integration** with Google Maps for directions

## 🚀 Testing Your Setup

1. **Add your API key** to `index.html`
2. **Allow location access** when prompted
3. **Wait for cafés to load** (may take 5-10 seconds)
4. **Test features**:
   - Click "Show Map" to see interactive map
   - Try different search radius options
   - Search for specific café names
   - Click "View Details" on any café
   - Test "Get Directions" functionality

## 🔍 Troubleshooting

### Common Issues:

**1. "API Key Required" message**
- Make sure you replaced `YOUR_GOOGLE_MAPS_API_KEY` with your actual key
- Check that the key is within quotes

**2. "Loading cafés..." never finishes**
- Verify all required APIs are enabled in Google Cloud Console
- Check browser console for error messages
- Ensure location access is granted

**3. No cafés found**
- Try increasing search radius
- Check if you're in an area with café listings
- Verify location detection is working

**4. API quota exceeded**
- Monitor usage in Google Cloud Console
- Consider adding usage limits
- Upgrade billing if needed

## 📱 Mobile Testing

The app is fully responsive and works great on mobile:
- **Touch-friendly** map controls
- **Responsive café cards** and modals
- **Mobile-optimized** search and filters
- **Location-aware** on mobile devices

## 🔐 Security Best Practices

1. **Use HTTP referrer restrictions** on your API key
2. **Monitor usage** in Google Cloud Console
3. **Set daily quotas** to prevent unexpected charges
4. **Never commit API keys** to public repositories
5. **Use environment variables** for production

---

**Need Help?** 
- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [API Key Best Practices](https://developers.google.com/maps/api-key-best-practices)
