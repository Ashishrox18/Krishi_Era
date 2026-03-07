import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { 
  Sprout, Calendar, TrendingUp, 
  Cloud, Droplets, ThermometerSun, Wind, Package, MapPin, DollarSign,
  Warehouse, Truck, FileText, ShoppingCart, Lightbulb
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { apiService } from '../../services/api'

const FarmerDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [recentListings, setRecentListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [crops, setCrops] = useState<any[]>([]);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    loadRecentListings();
    loadCrops();
    loadWeather();
  }, []);

  const loadRecentListings = async () => {
    try {
      const response = await apiService.getMyPurchaseRequests();
      // Get only the 3 most recent listings
      setRecentListings((response.requests || []).slice(0, 3));
    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoadingListings(false);
    }
  };

  const loadCrops = async () => {
    try {
      const response = await apiService.getCrops();
      setCrops(response.crops || []);
    } catch (error) {
      console.error('Failed to load crops:', error);
    } finally {
      setLoadingCrops(false);
    }
  };

  const loadWeather = async () => {
    try {
      const response = await apiService.getWeather();
      setWeather(response);
    } catch (error) {
      console.error('Failed to load weather:', error);
    } finally {
      setLoadingWeather(false);
    }
  };

  const weatherData = weather?.forecast || [
    { day: 'Mon', temp: 28, rainfall: 0 },
    { day: 'Tue', temp: 30, rainfall: 5 },
    { day: 'Wed', temp: 29, rainfall: 12 },
    { day: 'Thu', temp: 27, rainfall: 8 },
    { day: 'Fri', temp: 28, rainfall: 0 },
    { day: 'Sat', temp: 31, rainfall: 0 },
    { day: 'Sun', temp: 32, rainfall: 0 },
  ]

  // Calculate stats from real data
  const totalLand = crops.reduce((sum, crop) => sum + (parseFloat(crop.area) || 0), 0);
  const activeCrops = crops.filter(c => c.status === 'Growing' || c.status === 'Planted').length;
  const expectedYield = crops.reduce((sum, crop) => sum + (crop.expectedYield || 0), 0);
  const estimatedRevenue = crops.reduce((sum, crop) => sum + ((crop.expectedYield || 0) * (crop.estimatedPrice || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Farmer Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'Farmer'}</p>
        </div>
        <Link to="/farmer/crop-planning" className="btn-primary">
          Plan New Crop
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Land</p>
              <p className="text-2xl font-bold text-gray-900">{totalLand.toFixed(1)} acres</p>
            </div>
            <Sprout className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Crops</p>
              <p className="text-2xl font-bold text-gray-900">{activeCrops}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expected Yield</p>
              <p className="text-2xl font-bold text-gray-900">{expectedYield.toFixed(0)} tons</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Est. Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{(estimatedRevenue / 100000).toFixed(1)}L</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Crops and Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Crops */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Current Crops</h2>
              <Link to="/farmer/harvest" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All
              </Link>
            </div>
            {loadingCrops ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-600 mt-2 text-sm">Loading crops...</p>
              </div>
            ) : crops.length === 0 ? (
              <div className="text-center py-8">
                <Sprout className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-3">No crops planted yet</p>
                <Link
                  to="/farmer/crop-planning"
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
                >
                  Plan Your First Crop
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {crops.slice(0, 3).map((crop) => (
                  <div key={crop.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Sprout className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{crop.cropType || crop.name}</h3>
                        <p className="text-sm text-gray-600">{crop.area} acres • {crop.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{crop.daysToHarvest || 0} days</p>
                      <p className="text-sm text-gray-600">{crop.health || 'Good'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Listings Section */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Listings</h2>
              <Link to="/farmer/my-listings" className="text-green-600 hover:text-green-700 text-sm font-medium">
                View All →
              </Link>
            </div>

            {loadingListings ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-gray-600 mt-2 text-sm">Loading listings...</p>
              </div>
            ) : recentListings.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-3">No listings yet</p>
                <Link
                  to="/farmer/harvest"
                  className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  Create Your First Listing
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentListings.map((listing) => (
                  <div key={listing.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {listing.cropType} {listing.variety && `(${listing.variety})`}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            listing.status === 'open' ? 'bg-green-100 text-green-700' :
                            listing.status === 'negotiating' ? 'bg-yellow-100 text-yellow-700' :
                            listing.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {listing.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-1.5" />
                            <span>{listing.quantity} {listing.quantityUnit}</span>
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1.5" />
                            <span>₹{listing.minimumPrice}/{listing.quantityUnit}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1.5" />
                            <span className="truncate">{listing.pickupLocation}</span>
                          </div>
                        </div>

                        {listing.quotesCount > 0 && (
                          <div className="mt-2 text-sm">
                            <span className="text-green-600 font-medium">{listing.quotesCount} quotes received</span>
                            {listing.currentBestOffer > 0 && (
                              <span className="text-gray-600 ml-2">
                                • Best: ₹{listing.currentBestOffer}/{listing.quantityUnit}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <Link
                        to="/farmer/my-listings"
                        className="ml-4 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Weather and Quick Actions */}
        <div className="space-y-6">
          {/* Weather Widget */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Weather Forecast</h2>
            {loadingWeather ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2 text-sm">Loading weather...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <ThermometerSun className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-600">Temperature</p>
                      <p className="font-semibold">{weather?.current?.temperature || 28}°C</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-600">Humidity</p>
                      <p className="font-semibold">{weather?.current?.humidity || 65}%</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Wind className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-600">Wind</p>
                      <p className="font-semibold">{weather?.current?.windSpeed || 12} km/h</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Cloud className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-600">Conditions</p>
                      <p className="font-semibold">{weather?.current?.conditions || 'Partly Cloudy'}</p>
                    </div>
                  </div>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weatherData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="temp" stroke="#22c55e" strokeWidth={2} />
                      <Line type="monotone" dataKey="rainfall" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {/* Primary Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/farmer/crop-planning"
                  className="p-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition text-center"
                >
                  <Sprout className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-sm font-semibold">Plan Crop</p>
                </Link>
                <Link
                  to="/farmer/harvest"
                  className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition text-center"
                >
                  <Package className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-sm font-semibold">Manage Harvest</p>
                </Link>
              </div>

              {/* Secondary Actions */}
              <div className="space-y-2">
                <Link
                  to="/farmer/selling-strategy"
                  className="flex items-center p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition group"
                >
                  <div className="w-10 h-10 bg-orange-100 group-hover:bg-orange-200 rounded-lg flex items-center justify-center mr-3">
                    <Lightbulb className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">AI Selling Strategy</p>
                    <p className="text-xs text-gray-600">Get smart pricing insights</p>
                  </div>
                </Link>

                <Link
                  to="/farmer/browse-procurement-requests"
                  className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition group"
                >
                  <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center mr-3">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">Browse Buyer Requests</p>
                    <p className="text-xs text-gray-600">Find buyers for your produce</p>
                  </div>
                </Link>

                <Link
                  to="/warehouses"
                  className="flex items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition group"
                >
                  <div className="w-10 h-10 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center mr-3">
                    <Warehouse className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">Warehouses</p>
                    <p className="text-xs text-gray-600">Check storage availability</p>
                  </div>
                </Link>

                <Link
                  to="/vehicles"
                  className="flex items-center p-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition group"
                >
                  <div className="w-10 h-10 bg-amber-100 group-hover:bg-amber-200 rounded-lg flex items-center justify-center mr-3">
                    <Truck className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">Transport Vehicles</p>
                    <p className="text-xs text-gray-600">Book transport for delivery</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FarmerDashboard
