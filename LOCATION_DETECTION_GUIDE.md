# Location Detection for Weather - How It Works

## Overview

The Farmer Dashboard now automatically detects your location to show accurate local weather data.

## How Location Detection Works

### 1. **Browser Geolocation API** (Primary Method)

When you visit the Farmer Dashboard, the system:

1. **Requests Permission**: Browser asks "Allow location access?"
2. **Gets Coordinates**: If you allow, it gets your GPS coordinates (latitude/longitude)
3. **Fetches Weather**: Sends coordinates to Open-Meteo API for local weather
4. **Displays Data**: Shows weather for YOUR actual location

```
User visits dashboard
    ↓
Browser asks: "Allow location?"
    ↓
User clicks "Allow"
    ↓
Gets: latitude=19.0760, longitude=72.8777
    ↓
API call: /api/farmer/weather?latitude=19.0760&longitude=72.8777
    ↓
Shows weather for Mumbai (your location)
```

### 2. **Fallback to Default Location**

If location detection fails (user denies, browser doesn't support, timeout), it uses:
- **Default Location**: New Delhi, India (28.6139°N, 77.2090°E)

## Location Detection Flow

```javascript
// In FarmerDashboard.tsx
const loadWeather = async () => {
  if (navigator.geolocation) {
    // Try to get user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // SUCCESS: Use actual location
        const { latitude, longitude } = position.coords;
        apiService.getWeather(latitude, longitude);
      },
      (error) => {
        // DENIED/ERROR: Use default location
        apiService.getWeather(); // Uses New Delhi
      }
    );
  } else {
    // Browser doesn't support geolocation
    apiService.getWeather(); // Uses New Delhi
  }
};
```

## User Experience

### Scenario 1: User Allows Location ✅
```
1. Dashboard loads
2. Browser popup: "Allow location access?"
3. User clicks "Allow"
4. Loading: "Detecting location..."
5. Shows: Weather for [Your City]
6. Location badge shows: "📍 Mumbai" (or your city)
```

### Scenario 2: User Denies Location ❌
```
1. Dashboard loads
2. Browser popup: "Allow location access?"
3. User clicks "Block" or "Deny"
4. Console: "Location access denied, using default location"
5. Shows: Weather for New Delhi (default)
6. Location badge shows: "📍 Default Location"
```

### Scenario 3: Browser Doesn't Support Geolocation
```
1. Dashboard loads
2. No popup (old browser)
3. Console: "Geolocation not supported"
4. Shows: Weather for New Delhi (default)
```

## Privacy & Security

### What Data is Collected?
- **Coordinates Only**: Latitude and longitude
- **Not Stored**: Location is NOT saved to database
- **Session Only**: Used only for current weather request
- **No Tracking**: Not used for any other purpose

### Browser Permission
- **User Control**: You must explicitly allow location access
- **One-Time**: Permission can be revoked anytime
- **Site-Specific**: Permission is only for this website
- **Secure**: Only works on HTTPS (or localhost for development)

### How to Manage Permissions

**Chrome/Edge:**
1. Click the lock icon in address bar
2. Click "Site settings"
3. Find "Location" → Change to Allow/Block

**Firefox:**
1. Click the lock icon in address bar
2. Click "Connection secure"
3. Find "Location" → Change permission

**Safari:**
1. Safari menu → Settings → Websites
2. Click "Location"
3. Find your site → Change permission

## Technical Details

### Geolocation API Options
```javascript
navigator.geolocation.getCurrentPosition(
  successCallback,
  errorCallback,
  {
    timeout: 5000,              // 5 second timeout
    enableHighAccuracy: false,  // Faster, less battery
    maximumAge: 0               // Don't use cached location
  }
);
```

### Error Codes
- **PERMISSION_DENIED (1)**: User denied location access
- **POSITION_UNAVAILABLE (2)**: Location information unavailable
- **TIMEOUT (3)**: Request took too long (>5 seconds)

## Customization Options

### Change Default Location

Edit `backend/src/services/weather.service.ts`:

```typescript
async getDefaultWeather(): Promise<WeatherData> {
  // Change to your preferred default city
  return this.getWeather(
    19.0760,  // Mumbai latitude
    72.8777   // Mumbai longitude
  );
}
```

### Use City Name Instead

In `FarmerDashboard.tsx`:

```typescript
const loadWeather = async () => {
  // Use specific city
  const response = await apiService.getWeather(undefined, undefined, 'Bangalore');
  setWeather(response);
};
```

### Store User's Preferred Location

Future enhancement - save location in user profile:

```typescript
// Get from user profile
const userLocation = user.profile?.location;
if (userLocation) {
  const response = await apiService.getWeather(
    userLocation.latitude,
    userLocation.longitude
  );
}
```

## Debugging

### Check Console Logs

Open browser console (F12) and look for:

```
📍 Using user location: 19.0760, 72.8777
```
or
```
📍 Location access denied or unavailable, using default location
Geolocation error: User denied Geolocation
```

### Test Different Scenarios

**Test with location allowed:**
1. Visit dashboard
2. Allow location when prompted
3. Check weather shows your city

**Test with location denied:**
1. Block location in browser settings
2. Refresh dashboard
3. Check weather shows default location

**Test with specific city:**
```javascript
// Temporarily modify loadWeather() to test
const response = await apiService.getWeather(undefined, undefined, 'Delhi');
```

## Future Enhancements

- [ ] Save user's preferred location in profile
- [ ] Allow manual location selection
- [ ] Show multiple locations (for farmers with multiple farms)
- [ ] Add location search/autocomplete
- [ ] Cache location to avoid repeated permission requests
- [ ] Show weather for all farm locations
- [ ] Add "Use current location" button

## FAQ

**Q: Why does it ask for location permission?**  
A: To show accurate weather for YOUR area, not a generic location.

**Q: Is my location stored or tracked?**  
A: No, it's only used for the weather API call and not saved anywhere.

**Q: Can I use the app without sharing location?**  
A: Yes! Just deny the permission and it will use the default location (New Delhi).

**Q: How accurate is the location?**  
A: Typically accurate to within 10-100 meters, depending on your device and GPS signal.

**Q: Does it work on mobile?**  
A: Yes! Mobile devices usually have more accurate GPS than desktops.

**Q: Can I change the location manually?**  
A: Not yet, but this feature is planned for future updates.
