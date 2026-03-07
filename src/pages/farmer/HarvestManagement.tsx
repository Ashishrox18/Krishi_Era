import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, TrendingUp, AlertCircle, CheckCircle, Package, MapPin, DollarSign } from 'lucide-react';
import { apiService } from '../../services/api';

const HarvestManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'list-produce'>('overview');
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [selectedHarvest, setSelectedHarvest] = useState<any>(null);
  const [formData, setFormData] = useState({
    cropType: '',
    variety: '',
    quantity: '',
    quantityUnit: 'quintals',
    qualityGrade: 'A',
    pricePerUnit: '',
    location: '',
    availableFrom: new Date().toISOString().split('T')[0],
    description: '',
    images: [] as string[]
  });
  const harvests = [
    {
      crop: 'Wheat',
      area: '3 acres',
      status: 'ready',
      daysRemaining: 0,
      expectedYield: '9.6 tons',
      marketPrice: '₹25,000/ton',
      optimalWindow: '5 days',
      recommendation: 'Harvest immediately. Market prices are favorable.',
    },
    {
      crop: 'Rice',
      area: '5 acres',
      status: 'upcoming',
      daysRemaining: 45,
      expectedYield: '22.5 tons',
      marketPrice: '₹22,000/ton',
      optimalWindow: '7 days',
      recommendation: 'Monitor weather. Plan harvest for early morning.',
    },
    {
      crop: 'Cotton',
      area: '4 acres',
      status: 'growing',
      daysRemaining: 120,
      expectedYield: '11.2 tons',
      marketPrice: '₹75,000/ton',
      optimalWindow: '10 days',
      recommendation: 'Continue regular monitoring and pest control.',
    },
  ];

  const cropTypes = [
    'Wheat', 'Rice', 'Maize', 'Bajra', 'Jowar',
    'Cotton', 'Sugarcane', 'Potato', 'Onion', 'Tomato',
    'Soybean', 'Groundnut', 'Mustard', 'Sunflower', 'Chickpea',
    'Lentils', 'Green Gram', 'Black Gram', 'Barley', 'Millet'
  ];

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding to get address
          // Using OpenStreetMap's Nominatim API (free, no API key required)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            const address = data.address;
            
            // Build a readable location string
            const locationParts = [
              address.village || address.town || address.city || address.suburb,
              address.county || address.state_district,
              address.state
            ].filter(Boolean);
            
            const locationString = locationParts.join(', ');
            
            if (locationString) {
              updateField('location', locationString);
            } else {
              updateField('location', `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
          } else {
            // Fallback to coordinates if geocoding fails
            updateField('location', `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          // Fallback to coordinates
          updateField('location', `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to detect location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
        }
        
        alert(errorMessage);
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleListForSale = (harvest: any) => {
    setSelectedHarvest(harvest);
    
    // Extract quantity from expectedYield (e.g., "9.6 tons" -> 96 quintals)
    let quantity = '';
    let unit = 'quintals';
    if (harvest.expectedYield) {
      const yieldMatch = harvest.expectedYield.match(/([\d.]+)\s*(tons?|quintals?|kg)/i);
      if (yieldMatch) {
        const value = parseFloat(yieldMatch[1]);
        const yieldUnit = yieldMatch[2].toLowerCase();
        
        // Convert to quintals
        if (yieldUnit.startsWith('ton')) {
          quantity = (value * 10).toString(); // 1 ton = 10 quintals
        } else if (yieldUnit.startsWith('quintal')) {
          quantity = value.toString();
        } else if (yieldUnit.startsWith('kg')) {
          quantity = (value / 100).toString(); // 100 kg = 1 quintal
        }
      }
    }

    // Extract price from marketPrice (e.g., "₹25,000/ton" -> 2500 per quintal)
    let pricePerUnit = '';
    if (harvest.marketPrice) {
      const priceMatch = harvest.marketPrice.match(/₹?([\d,]+)\/?(ton|quintal|kg)?/i);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(/,/g, ''));
        const priceUnit = priceMatch[2]?.toLowerCase();
        
        // Convert to price per quintal
        if (priceUnit === 'ton') {
          pricePerUnit = (price / 10).toString(); // Price per ton to price per quintal
        } else if (priceUnit === 'kg') {
          pricePerUnit = (price * 100).toString(); // Price per kg to price per quintal
        } else {
          pricePerUnit = price.toString();
        }
      }
    }

    // Get user location from localStorage
    const userData = localStorage.getItem('user');
    let location = '';
    if (userData) {
      try {
        const user = JSON.parse(userData);
        location = user.location || user.address || '';
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }

    // Prefill form with harvest data
    setFormData({
      cropType: harvest.crop || '',
      variety: '',
      quantity: quantity,
      quantityUnit: unit,
      qualityGrade: 'A',
      pricePerUnit: pricePerUnit,
      location: location,
      availableFrom: new Date().toISOString().split('T')[0],
      description: `${harvest.crop} from ${harvest.area} farm. ${harvest.recommendation || ''}`,
      images: []
    });

    setActiveTab('list-produce');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cropType || !formData.quantity || !formData.pricePerUnit || !formData.location) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await apiService.createPurchaseRequest({
        cropType: formData.cropType,
        variety: formData.variety,
        quantity: parseFloat(formData.quantity),
        quantityUnit: formData.quantityUnit,
        qualityGrade: formData.qualityGrade,
        minimumPrice: parseFloat(formData.pricePerUnit),
        expectedPrice: parseFloat(formData.pricePerUnit),
        pickupLocation: formData.location,
        availableFrom: formData.availableFrom,
        description: formData.description
      });

      alert('Your produce has been listed successfully! Buyers can now see and quote on it.');
      setActiveTab('overview');
      setSelectedHarvest(null);
      // Reset form
      setFormData({
        cropType: '',
        variety: '',
        quantity: '',
        quantityUnit: 'quintals',
        qualityGrade: 'A',
        pricePerUnit: '',
        location: '',
        availableFrom: new Date().toISOString().split('T')[0],
        description: '',
        images: []
      });
    } catch (error: any) {
      console.error('List produce error:', error);
      alert(error.response?.data?.error || 'Failed to list produce. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Harvest Management</h1>
        <p className="text-gray-600 mt-1">AI-optimized harvest timing and market listing</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Harvest Overview
          </button>
          <button
            onClick={() => setActiveTab('list-produce')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list-produce'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            List Produce
          </button>
        </nav>
      </div>

      {/* Harvest Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <p className="text-sm text-gray-600">Ready to Harvest</p>
              <p className="text-3xl font-bold text-green-600">1</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Upcoming (30 days)</p>
              <p className="text-3xl font-bold text-blue-600">1</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Total Expected Yield</p>
              <p className="text-3xl font-bold text-gray-900">43.3 tons</p>
            </div>
          </div>

          <div className="space-y-4">
            {harvests.map((harvest) => (
              <div key={harvest.crop} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-semibold text-gray-900">{harvest.crop}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        harvest.status === 'ready' ? 'bg-green-100 text-green-800' :
                        harvest.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {harvest.status === 'ready' ? 'Ready to Harvest' :
                         harvest.status === 'upcoming' ? 'Upcoming' : 'Growing'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{harvest.area}</p>
                  </div>
                  {harvest.status === 'ready' && (
                    <button 
                      onClick={() => handleListForSale(harvest)}
                      className="btn-primary"
                    >
                      List for Sale
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600">Days Remaining</p>
                    <p className="text-lg font-semibold text-gray-900">{harvest.daysRemaining}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Expected Yield</p>
                    <p className="text-lg font-semibold text-gray-900">{harvest.expectedYield}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Market Price</p>
                    <p className="text-lg font-semibold text-gray-900">{harvest.marketPrice}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Optimal Window</p>
                    <p className="text-lg font-semibold text-gray-900">{harvest.optimalWindow}</p>
                  </div>
                </div>

                <div className={`p-3 rounded-lg flex items-start space-x-2 ${
                  harvest.status === 'ready' ? 'bg-green-50' : 'bg-blue-50'
                }`}>
                  {harvest.status === 'ready' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">AI Recommendation</p>
                    <p className="text-sm text-gray-700">{harvest.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* List Produce Tab */}
      {activeTab === 'list-produce' && (
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Package className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">List Your Produce</h2>
            <p className="text-gray-600 mt-2">Connect with buyers and get the best price for your harvest</p>
            {selectedHarvest && (
              <div className="mt-3 inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm text-blue-900">
                  Listing details prefilled from <span className="font-semibold">{selectedHarvest.crop}</span> harvest
                </span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg">
            <div className="p-6 space-y-6">
              {/* Crop Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Crop Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Crop Type *
                    </label>
                    <select
                      value={formData.cropType}
                      onChange={(e) => updateField('cropType', e.target.value)}
                      className="input-field"
                      required
                    >
                      <option value="">Select crop type</option>
                      {cropTypes.map(crop => (
                        <option key={crop} value={crop}>{crop}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variety (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.variety}
                      onChange={(e) => updateField('variety', e.target.value)}
                      className="input-field"
                      placeholder="e.g., Basmati, Desi"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => updateField('quantity', e.target.value)}
                      className="input-field"
                      placeholder="Enter quantity"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit
                    </label>
                    <select
                      value={formData.quantityUnit}
                      onChange={(e) => updateField('quantityUnit', e.target.value)}
                      className="input-field"
                    >
                      <option value="quintals">Quintals</option>
                      <option value="tons">Tons</option>
                      <option value="kg">Kilograms</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality Grade
                    </label>
                    <select
                      value={formData.qualityGrade}
                      onChange={(e) => updateField('qualityGrade', e.target.value)}
                      className="input-field"
                    >
                      <option value="A">Grade A (Premium)</option>
                      <option value="B">Grade B (Standard)</option>
                      <option value="C">Grade C (Basic)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Unit (₹) *
                    </label>
                    <input
                      type="number"
                      value={formData.pricePerUnit}
                      onChange={(e) => updateField('pricePerUnit', e.target.value)}
                      className="input-field"
                      placeholder="Enter price"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Location & Availability */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location & Availability</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Pickup Location *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => updateField('location', e.target.value)}
                        className="input-field flex-1"
                        placeholder="Village, District, State"
                        required
                      />
                      <button
                        type="button"
                        onClick={detectLocation}
                        disabled={detectingLocation}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                        title="Detect my location"
                      >
                        {detectingLocation ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span className="hidden sm:inline">Detecting...</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4" />
                            <span className="hidden sm:inline">Detect</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Click "Detect" to use your current location
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available From
                    </label>
                    <input
                      type="date"
                      value={formData.availableFrom}
                      onChange={(e) => updateField('availableFrom', e.target.value)}
                      className="input-field"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="input-field"
                  rows={4}
                  placeholder="Add any additional details about your produce..."
                />
              </div>

              {/* Price Summary */}
              {formData.quantity && formData.pricePerUnit && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Estimated Total Value</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{(parseFloat(formData.quantity) * parseFloat(formData.pricePerUnit)).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <DollarSign className="h-12 w-12 text-green-600 opacity-20" />
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('overview');
                  setSelectedHarvest(null);
                }}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Listing...' : 'List Produce'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default HarvestManagement
