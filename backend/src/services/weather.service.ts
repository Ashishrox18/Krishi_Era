import axios from 'axios';

/**
 * Weather Service using Open-Meteo API
 * Open-Meteo is a free, open-source weather API with no API key required
 * Documentation: https://open-meteo.com/
 */

interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    conditions: string;
    weatherCode: number;
  };
  forecast: Array<{
    day: string;
    temp: number;
    rainfall: number;
    weatherCode: number;
  }>;
  location: {
    latitude: number;
    longitude: number;
    city?: string;
  };
}

class WeatherService {
  private baseUrl = 'https://api.open-meteo.com/v1';

  /**
   * Get weather description from WMO weather code
   * https://open-meteo.com/en/docs
   */
  private getWeatherDescription(code: number): string {
    const weatherCodes: { [key: number]: string } = {
      0: 'Clear Sky',
      1: 'Mainly Clear',
      2: 'Partly Cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing Rime Fog',
      51: 'Light Drizzle',
      53: 'Moderate Drizzle',
      55: 'Dense Drizzle',
      61: 'Slight Rain',
      63: 'Moderate Rain',
      65: 'Heavy Rain',
      71: 'Slight Snow',
      73: 'Moderate Snow',
      75: 'Heavy Snow',
      77: 'Snow Grains',
      80: 'Slight Rain Showers',
      81: 'Moderate Rain Showers',
      82: 'Violent Rain Showers',
      85: 'Slight Snow Showers',
      86: 'Heavy Snow Showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with Slight Hail',
      99: 'Thunderstorm with Heavy Hail',
    };
    return weatherCodes[code] || 'Unknown';
  }

  /**
   * Get day name from date string
   */
  private getDayName(dateString: string): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const date = new Date(dateString);
    return days[date.getDay()];
  }

  /**
   * Get weather data for a location
   * @param latitude - Latitude of the location
   * @param longitude - Longitude of the location
   * @returns Weather data including current conditions and 7-day forecast
   */
  async getWeather(latitude: number, longitude: number): Promise<WeatherData> {
    try {
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          latitude,
          longitude,
          current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
          daily: 'temperature_2m_max,precipitation_sum,weather_code',
          timezone: 'auto',
          forecast_days: 7,
        },
      });

      const data = response.data;

      // Parse current weather
      const current = {
        temperature: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        weatherCode: data.current.weather_code,
        conditions: this.getWeatherDescription(data.current.weather_code),
      };

      // Parse 7-day forecast
      const forecast = data.daily.time.map((date: string, index: number) => ({
        day: this.getDayName(date),
        temp: Math.round(data.daily.temperature_2m_max[index]),
        rainfall: Math.round(data.daily.precipitation_sum[index]),
        weatherCode: data.daily.weather_code[index],
      }));

      // Perform reverse geocoding to get city name using Nominatim (OpenStreetMap)
      let cityName: string | undefined;
      try {
        const geoResponse = await axios.get('https://nominatim.openstreetmap.org/reverse', {
          params: {
            lat: latitude,
            lon: longitude,
            format: 'json',
            zoom: 10,
          },
          headers: {
            'User-Agent': 'FarmConnect-App/1.0',
          },
        });

        if (geoResponse.data && geoResponse.data.address) {
          // Try to get city, town, village, or county
          cityName = geoResponse.data.address.city || 
                     geoResponse.data.address.town || 
                     geoResponse.data.address.village ||
                     geoResponse.data.address.county ||
                     geoResponse.data.address.state;
        }
      } catch (geoError) {
        console.error('Reverse geocoding error:', geoError);
        // Continue without city name if geocoding fails
      }

      return {
        current,
        forecast,
        location: {
          latitude,
          longitude,
          city: cityName,
        },
      };
    } catch (error) {
      console.error('Weather API error:', error);
      throw new Error('Failed to fetch weather data');
    }
  }

  /**
   * Get weather for a city by name (requires geocoding first)
   * @param city - City name
   * @returns Weather data
   */
  async getWeatherByCity(city: string): Promise<WeatherData> {
    try {
      // Use Open-Meteo's geocoding API
      const geoResponse = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
        params: {
          name: city,
          count: 1,
          language: 'en',
          format: 'json',
        },
      });

      if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
        throw new Error('City not found');
      }

      const location = geoResponse.data.results[0];
      const weatherData = await this.getWeather(location.latitude, location.longitude);

      return {
        ...weatherData,
        location: {
          ...weatherData.location,
          city: location.name,
        },
      };
    } catch (error) {
      console.error('Weather by city error:', error);
      throw new Error('Failed to fetch weather data for city');
    }
  }

  /**
   * Get default weather (fallback to a default location if user location not available)
   * Default: New Delhi, India
   */
  async getDefaultWeather(): Promise<WeatherData> {
    // Default to New Delhi, India coordinates
    const weatherData = await this.getWeather(28.6139, 77.2090);
    return {
      ...weatherData,
      location: {
        ...weatherData.location,
        city: weatherData.location.city || 'New Delhi',
      },
    };
  }
}

export const weatherService = new WeatherService();
