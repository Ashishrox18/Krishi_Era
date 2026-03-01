import { useState, useEffect, useRef } from 'react'
import { Sprout, TrendingUp, Calendar, MapPin, AlertCircle, Loader, Navigation } from 'lucide-react'
import { apiService } from '../../services/api'

const CropPlanning = () => {
  const [formData, setFormData] = useState({
    landSize: '',
    soilType: '',
    location: '',
    waterAvailability: '',
    budget: '',
    season: ''
  });
  const [selectedCrop, setSelectedCrop] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [searchingLocations, setSearchingLocations] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiService.getAICropRecommendations({
        landSize: parseFloat(formData.landSize),
        soilType: formData.soilType,
        location: formData.location,
        waterAvailability: formData.waterAvailability,
        budget: parseFloat(formData.budget),
        season: formData.season
      });

      // Check if there's a budget error
      if (response.error) {
        setError(response.error.suggestion || response.error.message);
        setRecommendations([]);
        setInsights(null);
      } else {
        setRecommendations(response.recommendations || []);
        setInsights(response.insights || null);
      }
    } catch (err) {
      console.error('Failed to get recommendations:', err);
      setError('Failed to get AI recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Show location suggestions when typing with debounce
    if (field === 'location' && value.length > 2) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Set new timeout for debounced search
      setSearchingLocations(true);
      searchTimeoutRef.current = setTimeout(() => {
        fetchLocationSuggestions(value);
      }, 500); // Wait 500ms after user stops typing
    } else if (field === 'location') {
      setShowSuggestions(false);
      setLocationSuggestions([]);
      setSearchingLocations(false);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
  };

  const fetchLocationSuggestions = async (query: string) => {
    try {
      // Use OpenStreetMap Nominatim API to search for locations in India
      // This includes cities, towns, villages, and other settlements
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'KrishiEra/1.0'
          }
        }
      );
      const data = await response.json();
      
      // Format the results to show village/town/city, district, state
      const suggestions = data.map((item: any) => {
        const address = item.address;
        const parts = [];
        
        // Add village/town/city
        if (address.village) parts.push(address.village);
        else if (address.town) parts.push(address.town);
        else if (address.city) parts.push(address.city);
        else if (address.municipality) parts.push(address.municipality);
        
        // Add district if different from city/town
        if (address.county && !parts.includes(address.county)) {
          parts.push(address.county);
        }
        
        // Add state
        if (address.state) parts.push(address.state);
        
        return parts.join(', ');
      }).filter((loc: string) => loc.length > 0);
      
      setLocationSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      // Fallback to empty suggestions on error
      setLocationSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSearchingLocations(false);
    }
  };

  const selectLocation = (location: string) => {
    setFormData(prev => ({ ...prev, location }));
    setShowSuggestions(false);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use OpenStreetMap Nominatim API for reverse geocoding (free)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'KrishiEra/1.0'
              }
            }
          );
          const data = await response.json();
          
          // Extract city and state
          const city = data.address.city || data.address.town || data.address.village || data.address.county;
          const state = data.address.state;
          const locationString = state ? `${city}, ${state}` : city;
          
          setFormData(prev => ({ ...prev, location: locationString }));
        } catch (error) {
          console.error('Error fetching location:', error);
          alert('Failed to fetch location details. Please enter manually.');
        } finally {
          setFetchingLocation(false);
        }
      },
      (error) => {
        setFetchingLocation(false);
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location. Please enter manually.');
      }
    );
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationInputRef.current && !locationInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Cleanup timeout on unmount
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Crop Planning</h1>
        <p className="text-gray-600 mt-1">AI-powered recommendations for optimal crop selection</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Land Size (acres)</label>
                <input
                  type="number"
                  value={formData.landSize}
                  onChange={(e) => handleInputChange('landSize', e.target.value)}
                  className="input"
                  placeholder="Enter land size"
                  required
                  min="0.1"
                  step="0.1"
                />
              </div>

              <div>
                <label className="label">Soil Type</label>
                <select
                  value={formData.soilType}
                  onChange={(e) => handleInputChange('soilType', e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Select soil type</option>
                  <option value="clay">Clay</option>
                  <option value="loam">Loam</option>
                  <option value="sandy">Sandy</option>
                  <option value="silt">Silt</option>
                  <option value="peat">Peat</option>
                </select>
              </div>

              <div>
                <label className="label">Location</label>
                <div className="relative" ref={locationInputRef}>
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    onFocus={() => formData.location.length > 2 && fetchLocationSuggestions(formData.location)}
                    className="input pl-10 pr-20"
                    placeholder="Enter village, town, or city"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    {searchingLocations && (
                      <Loader className="h-4 w-4 animate-spin text-gray-400" />
                    )}
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={fetchingLocation}
                      className="text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                      title="Use current location"
                    >
                      {fetchingLocation ? (
                        <Loader className="h-5 w-5 animate-spin" />
                      ) : (
                        <Navigation className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  
                  {/* Location Suggestions Dropdown */}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {locationSuggestions.map((location, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectLocation(location)}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-900">{location}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Type to search for villages, towns, or cities across India
                </p>
              </div>

              <div>
                <label className="label">Water Availability</label>
                <select 
                  value={formData.waterAvailability}
                  onChange={(e) => handleInputChange('waterAvailability', e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Select availability</option>
                  <option value="abundant">Abundant</option>
                  <option value="moderate">Moderate</option>
                  <option value="limited">Limited</option>
                  <option value="scarce">Scarce</option>
                </select>
              </div>

              <div>
                <label className="label">Budget (₹)</label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  className="input"
                  placeholder="Enter available budget"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="label">Season (Optional)</label>
                <select 
                  value={formData.season}
                  onChange={(e) => handleInputChange('season', e.target.value)}
                  className="input"
                >
                  <option value="">Select season</option>
                  <option value="kharif">Kharif (Monsoon)</option>
                  <option value="rabi">Rabi (Winter)</option>
                  <option value="zaid">Zaid (Summer)</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full btn-primary flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    Analyzing...
                  </>
                ) : (
                  'Get AI Recommendations'
                )}
              </button>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">AI Analysis</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Our AI considers weather patterns, market demand, soil conditions, and historical data to provide personalized recommendations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Crop Recommendations</h2>
            <p className="text-sm text-gray-600 mb-4">
              {recommendations.length > 0 
                ? 'Based on your farm data and current market conditions' 
                : 'Fill in your farm details to get personalized recommendations'}
            </p>
          </div>

          {loading ? (
            <div className="card text-center py-12">
              <Loader className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
              <p className="text-gray-900 font-medium">Analyzing your farm data...</p>
              <p className="text-sm text-gray-600 mt-2">Our AI is considering soil type, water availability, market trends, and more</p>
            </div>
          ) : error ? (
            <div className="card text-center py-12">
              <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Budget Consideration</h3>
              <p className="text-gray-700 max-w-2xl mx-auto">{error}</p>
              <button 
                onClick={() => {
                  setError('');
                  setFormData(prev => ({ ...prev, budget: '' }));
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Adjust Budget
              </button>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="card text-center py-12">
              <Sprout className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recommendations Yet</h3>
              <p className="text-gray-600">
                Enter your farm details in the form to get AI-powered crop recommendations
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((crop, index) => (
                <div
                  key={index}
                  className={`card cursor-pointer transition-all hover:shadow-md ${
                    selectedCrop === crop.name ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => setSelectedCrop(crop.name)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Sprout className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{crop.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-600"
                                style={{ width: `${crop.suitability}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 ml-2">{crop.suitability}% match</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">{crop.revenue}</p>
                      <p className="text-sm text-gray-600">Expected revenue</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Expected Yield</p>
                      <p className="font-semibold text-gray-900">{crop.expectedYield}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Duration</p>
                      <p className="font-semibold text-gray-900">{crop.duration}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Water Need</p>
                      <p className="font-semibold text-gray-900">{crop.waterNeed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Market Demand</p>
                      <p className="font-semibold text-gray-900">{crop.marketDemand}</p>
                    </div>
                  </div>

                  {crop.reasoning && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <span className="font-medium">AI Insight:</span> {crop.reasoning}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      crop.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                      crop.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {crop.riskLevel} Risk
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Market Insights */}
          {insights && (
            <div className="card mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Market Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600 mb-2" />
                  <p className="text-sm text-gray-600">Price Trend</p>
                  <p className="text-lg font-semibold text-gray-900">{insights.priceTrend}</p>
                  <p className="text-xs text-gray-600 mt-1">{insights.priceTrendPercentage} in last 30 days</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600 mb-2" />
                  <p className="text-sm text-gray-600">Best Planting Time</p>
                  <p className="text-lg font-semibold text-gray-900">{insights.bestPlantingTime}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600 mb-2" />
                  <p className="text-sm text-gray-600">Demand Forecast</p>
                  <p className="text-lg font-semibold text-gray-900">{insights.demandForecast}</p>
                </div>
              </div>
              
              {insights.additionalTips && insights.additionalTips.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Additional Tips:</h3>
                  <ul className="space-y-1">
                    {insights.additionalTips.map((tip: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <span className="text-yellow-600 mr-2">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CropPlanning
