# Weather API Integration

## Overview

The Krishi Era platform now uses **Open-Meteo**, a free and open-source weather API that provides accurate weather data without requiring an API key.

## Features

✅ **Free & Open Source** - No API key required  
✅ **Real-time Weather** - Current temperature, humidity, wind speed, and conditions  
✅ **7-Day Forecast** - Daily temperature and rainfall predictions  
✅ **Location-based** - Supports coordinates and city names  
✅ **Fallback Support** - Gracefully handles API failures  

## API Documentation

- **Provider**: Open-Meteo
- **Website**: https://open-meteo.com/
- **Documentation**: https://open-meteo.com/en/docs
- **License**: CC BY 4.0 (Attribution required)

## Usage

### Backend API Endpoints

#### Get Weather by Coordinates
```bash
GET /api/farmer/weather?latitude=28.6139&longitude=77.2090
```

#### Get Weather by City
```bash
GET /api/farmer/weather?city=Delhi
```

#### Get Default Weather
```bash
GET /api/farmer/weather
```
(Defaults to New Delhi, India)

### Response Format

```json
{
  "current": {
    "temperature": 28,
    "humidity": 65,
    "windSpeed": 12,
    "conditions": "Partly Cloudy",
    "weatherCode": 2
  },
  "forecast": [
    {
      "day": "Mon",
      "temp": 28,
      "rainfall": 0,
      "weatherCode": 0
    }
  ],
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "city": "Delhi"
  }
}
```

## Weather Codes

Open-Meteo uses WMO Weather interpretation codes:

| Code | Description |
|------|-------------|
| 0 | Clear Sky |
| 1-3 | Mainly Clear to Overcast |
| 45, 48 | Fog |
| 51-55 | Drizzle |
| 61-65 | Rain (Slight to Heavy) |
| 71-77 | Snow |
| 80-82 | Rain Showers |
| 85-86 | Snow Showers |
| 95-99 | Thunderstorm |

## Frontend Integration

The farmer dashboard automatically fetches weather data on load. To customize the location:

```typescript
// In FarmerDashboard.tsx
const loadWeather = async () => {
  try {
    // Option 1: Use user's coordinates (if available)
    const response = await apiService.getWeather(latitude, longitude);
    
    // Option 2: Use city name
    const response = await apiService.getWeatherByCity('Mumbai');
    
    // Option 3: Use default location
    const response = await apiService.getWeather();
    
    setWeather(response);
  } catch (error) {
    console.error('Failed to load weather:', error);
  }
};
```

## Future Enhancements

- [ ] Add user location detection (browser geolocation API)
- [ ] Store user's preferred location in profile
- [ ] Add weather alerts for extreme conditions
- [ ] Integrate weather-based crop recommendations
- [ ] Add historical weather data analysis
- [ ] Support multiple locations for farmers with multiple farms

## Attribution

Weather data provided by [Open-Meteo.com](https://open-meteo.com/) under CC BY 4.0 license.

## Testing

Test the weather API:

```bash
# Test with coordinates
curl "http://localhost:3000/api/farmer/weather?latitude=28.6139&longitude=77.2090"

# Test with city
curl "http://localhost:3000/api/farmer/weather?city=Mumbai"

# Test default
curl "http://localhost:3000/api/farmer/weather"
```

## Troubleshooting

### Weather not loading?

1. Check backend console for errors
2. Verify internet connection
3. The API will fallback to mock data if Open-Meteo is unavailable
4. Check if the city name is spelled correctly

### Want to change default location?

Edit `Krishi_Era/backend/src/services/weather.service.ts`:

```typescript
async getDefaultWeather(): Promise<WeatherData> {
  // Change these coordinates to your preferred default location
  return this.getWeather(YOUR_LATITUDE, YOUR_LONGITUDE);
}
```

## Rate Limits

Open-Meteo is free and has generous rate limits:
- **10,000 API calls per day** for non-commercial use
- No API key required
- No registration needed

For commercial use or higher limits, consider their paid plans or self-hosting.
