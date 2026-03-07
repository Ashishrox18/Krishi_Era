import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { 
  Sprout, Calendar, TrendingUp, 
  Cloud, Droplets, ThermometerSun, Wind, Package, MapPin,
  Warehouse, Truck, FileText, ShoppingCart, Lightbulb
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { apiService } from '../../services/api'
import { useTranslation } from 'react-i18next'

const FarmerDashboard = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [crops, setCrops] = useState<any[]>([]);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [cropTips, setCropTips] = useState<{[key: string]: string}>({});
  const [loadingTips, setLoadingTips] = useState(false);
  const [soldCrops, setSoldCrops] = useState<any[]>([]);

  useEffect(() => {
    // Get user from localStorage
    const userData = sessionStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    loadCrops();
    loadWeather();
    loadSoldCrops();
  }, []);

  const loadSoldCrops = async () => {
    try {
      // Fetch farmer's listings which includes finalized sales
      const response = await apiService.getMyPurchaseRequests();
      const listings = response.requests || [];
      
      // Filter for finalized/awarded listings (these are sold items)
      const finalizedListings = listings.filter((listing: any) => 
        listing.status === 'awarded' && listing.finalPrice
      );
      
      setSoldCrops(finalizedListings);
    } catch (error) {
      console.error('Failed to fetch sold crops:', error);
    }
  };

  // Auto-refresh sold crops every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadSoldCrops, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load AI tips when crops change
  useEffect(() => {
    if (crops.length > 0 && !loadingCrops) {
      loadCropTips();
    }
  }, [crops, loadingCrops]);

  const loadCropTips = async () => {
    const activeCropsFiltered = crops.filter(c => c.status !== 'ready' && c.status !== 'listed' && c.status !== 'sold');
    if (activeCropsFiltered.length === 0) return;

    setLoadingTips(true);
    const tips: {[key: string]: string} = {};

    // Comprehensive crop-specific tips database
    const cropTipsDatabase: {[key: string]: string} = {
      'Rice': 'Maintain 2-3 inches of standing water during vegetative stage. Apply nitrogen in 3 splits: basal, tillering, and panicle initiation. Watch for blast disease and stem borers.',
      'Wheat': 'Irrigate at crown root initiation (21 days), tillering (40 days), flowering (60 days), and grain filling (80 days). Apply nitrogen in 3 doses. Monitor for rust diseases and aphids.',
      'Cotton': 'Scout regularly for pink bollworm and whitefly. Maintain soil moisture during flowering and boll development. Apply potash for better fiber quality. Remove early squares to prevent pest buildup.',
      'Maize': 'Apply nitrogen at knee-high stage (30 days) and tasseling. Ensure adequate moisture during tasseling and silking for good pollination. Control fall armyworm with neem-based pesticides.',
      'Sugarcane': 'Maintain soil moisture throughout growth. Apply potash during grand growth phase (4-7 months) for better sugar content. Earthing up at 90-120 days protects roots and controls weeds.',
      'Potato': 'Hill up soil when plants are 6 inches tall to prevent greening. Irrigate every 7-10 days. Monitor for late blight in humid weather. Stop irrigation 10 days before harvest.',
      'Onion': 'Apply nitrogen in splits at 30 and 45 days. Stop irrigation 10-15 days before harvest for better storage. Cure bulbs in shade for 7-10 days before storage.',
      'Tomato': 'Stake plants at 15 days and prune suckers weekly. Apply calcium spray to prevent blossom end rot. Monitor for early blight and whitefly. Harvest when fruits show color break.',
      'Soybean': 'Inoculate seeds with Rhizobium culture before sowing. No nitrogen needed if properly inoculated. Control pod borers during flowering with neem oil. Harvest when 95% pods turn brown.',
      'Groundnut': 'Apply gypsum at 40-45 days (flowering stage) for better pod development. Maintain soil moisture during pegging and pod formation. Harvest when leaves turn yellow and pods show veining.',
      'Mustard': 'Irrigate at flowering (35 days) and pod formation (55 days). Apply sulfur for better oil content. Monitor for aphids and spray neem oil if population exceeds threshold.',
      'Chickpea': 'Avoid waterlogging - chickpea is sensitive to excess moisture. Apply phosphorus and potash at sowing. Spray boron at flowering for better pod set. Harvest when 80% pods turn brown.',
      'Sunflower': 'Irrigate at head formation and flowering stages. Apply boron spray at bud initiation for better seed filling. Protect heads from birds using nets. Harvest when back of head turns yellow.',
      'Bajra': 'Apply nitrogen in 2 splits: half at sowing, half at 30 days. Drought tolerant but needs moisture at flowering. Thin seedlings to 10-15 cm spacing for better yield.',
      'Jowar': 'Apply nitrogen at 30 days after sowing. Tolerates drought but needs moisture during grain filling. Control shoot fly with carbofuran at sowing. Harvest when grains harden.',
      'Bottle Gourd': 'Provide trellis support for vines. Hand pollinate flowers in early morning (6-8 AM) for better fruit set. Apply compost regularly. Harvest fruits when tender for better taste.',
      'Brinjal': 'Transplant 30-day seedlings at 60x45 cm spacing. Stake plants for support. Control fruit and shoot borer with pheromone traps. Harvest fruits when glossy and tender.',
      'Cabbage': 'Transplant at 4-5 leaf stage. Apply nitrogen in 3 splits. Maintain consistent moisture for head formation. Control diamond back moth with Bt spray. Harvest when heads are firm.',
      'Cauliflower': 'Blanch curds by tying leaves when curd is 5-7 cm diameter. Maintain consistent moisture. Apply boron to prevent hollow stem. Harvest when curds are compact and white.',
      'Carrot': 'Thin seedlings to 5 cm spacing at 3-4 leaf stage. Maintain consistent moisture for straight roots. Avoid fresh manure which causes forking. Harvest at 90-100 days.',
      'Chilli': 'Transplant 30-day seedlings. Apply calcium and boron for better fruit set. Control thrips and mites with neem oil. Harvest green or red based on market demand.',
      'Cucumber': 'Provide support for climbing varieties. Maintain consistent moisture. Apply potash for better fruit quality. Harvest fruits when tender, every 2-3 days.',
      'Peas': 'Inoculate seeds with Rhizobium. Provide support for climbing varieties. Irrigate at flowering and pod formation. Harvest green pods when fully developed but tender.',
      'Spinach': 'Sow in lines 20 cm apart. Apply nitrogen in 2-3 splits. Irrigate every 5-7 days. First harvest at 25-30 days, subsequent cuts every 15 days.',
      'Radish': 'Thin seedlings to 5 cm spacing. Maintain consistent moisture for tender roots. Avoid excess nitrogen which causes forking. Harvest at 30-40 days when roots are tender.',
    };

    try {
      // Get tips for up to 3 crops
      const cropsToFetch = activeCropsFiltered.slice(0, 3);
      
      for (const crop of cropsToFetch) {
        const cropName = crop.cropType || crop.name;
        
        // First try to get from database
        if (cropTipsDatabase[cropName]) {
          tips[cropName] = cropTipsDatabase[cropName];
        } else {
          // If not in database, try AI API
          try {
            const response = await apiService.getCropRecommendations({
              cropType: cropName,
              landSize: parseFloat(crop.area) || 1,
              soilType: crop.soilType || 'loam',
              season: 'current',
              location: user?.location || ''
            });

            if (response && response.recommendations && response.recommendations.length > 0) {
              const recommendation = response.recommendations[0];
              tips[cropName] = recommendation.careTips || recommendation.description || 
                cropTipsDatabase[cropName] || 
                `Apply balanced fertilizer and maintain proper irrigation for ${cropName}. Monitor regularly for pests and diseases.`;
            } else {
              tips[cropName] = `Apply balanced fertilizer and maintain proper irrigation for ${cropName}. Monitor regularly for pests and diseases.`;
            }
          } catch (error) {
            console.error(`Failed to get AI tips for ${cropName}:`, error);
            tips[cropName] = `Apply balanced fertilizer and maintain proper irrigation for ${cropName}. Monitor regularly for pests and diseases.`;
          }
        }
      }

      setCropTips(tips);
    } catch (error) {
      console.error('Failed to load crop tips:', error);
    } finally {
      setLoadingTips(false);
    }
  };

  const loadCrops = async () => {
    try {
      const response = await apiService.getCrops();
      const cropsWithDays = (response.crops || []).map((crop: any) => {
        // Calculate days to harvest
        const plantingDate = new Date(crop.plantingDate);
        const harvestDate = new Date(plantingDate);
        harvestDate.setDate(harvestDate.getDate() + (crop.duration || 90));
        
        const daysRemaining = Math.ceil(
          (harvestDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        
        return {
          ...crop,
          daysToHarvest: Math.max(0, daysRemaining)
        };
      });
      setCrops(cropsWithDays);
    } catch (error) {
      console.error('Failed to load crops:', error);
    } finally {
      setLoadingCrops(false);
    }
  };

  const loadWeather = async () => {
    try {
      // Try to get user's location from browser
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            // Success - use user's actual location
            const { latitude, longitude } = position.coords;
            console.log('📍 Using user location:', latitude, longitude);
            try {
              const response = await apiService.getWeather(latitude, longitude);
              setWeather(response);
            } catch (error) {
              console.error('Failed to load weather with location:', error);
              // Fallback to default location
              const response = await apiService.getWeather();
              setWeather(response);
            } finally {
              setLoadingWeather(false);
            }
          },
          async (error) => {
            // Location unavailable - try IP-based geolocation as fallback
            console.log('📍 GPS location unavailable, trying IP-based location...');
            try {
              // Try to get approximate location from IP
              const ipResponse = await fetch('https://ipapi.co/json/');
              if (ipResponse.ok) {
                const ipData = await ipResponse.json();
                console.log('📍 Using IP-based location:', ipData.city, ipData.country_name);
                const response = await apiService.getWeather(ipData.latitude, ipData.longitude);
                setWeather(response);
              } else {
                throw new Error('IP geolocation failed');
              }
            } catch (ipError) {
              // If IP geolocation also fails, use default
              console.log('📍 Using default location');
              const response = await apiService.getWeather();
              setWeather(response);
            } finally {
              setLoadingWeather(false);
            }
          },
          {
            timeout: 10000, // 10 second timeout
            enableHighAccuracy: false, // Faster, less battery
            maximumAge: 300000, // Accept cached position up to 5 minutes old
          }
        );
      } else {
        // Browser doesn't support geolocation - try IP-based
        console.log('📍 Geolocation not supported, trying IP-based location...');
        try {
          const ipResponse = await fetch('https://ipapi.co/json/');
          if (ipResponse.ok) {
            const ipData = await ipResponse.json();
            console.log('📍 Using IP-based location:', ipData.city, ipData.country_name);
            const response = await apiService.getWeather(ipData.latitude, ipData.longitude);
            setWeather(response);
          } else {
            throw new Error('IP geolocation failed');
          }
        } catch (error) {
          console.log('📍 Using default location');
          const response = await apiService.getWeather();
          setWeather(response);
        } finally {
          setLoadingWeather(false);
        }
      }
    } catch (error) {
      console.error('Failed to load weather:', error);
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

  // Calculate stats from real data (excluding harvest ready, listed, and sold crops)
  const activeCropsFiltered = crops.filter(c => c.status !== 'ready' && c.status !== 'listed' && c.status !== 'sold');
  
  const totalLand = activeCropsFiltered.reduce((sum, crop) => sum + (parseFloat(crop.area) || 0), 0);
  const activeCrops = activeCropsFiltered.length;
  const expectedYield = activeCropsFiltered.reduce((sum, crop) => sum + (crop.expectedYield || 0), 0);
  
  // Calculate actual revenue from sold crops (finalized sales)
  const actualRevenue = soldCrops.reduce((sum, crop) => {
    const quantity = crop.quantity || 0;
    const price = crop.finalPrice || crop.currentBestOffer || 0;
    return sum + (quantity * price);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <p className="text-gray-600 mt-1">{t('dashboard.welcomeBack')}, {user?.name || 'Farmer'}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('dashboard.totalLand')}</p>
              <p className="text-2xl font-bold text-gray-900">{totalLand.toFixed(1)} {t('dashboard.acres')}</p>
            </div>
            <Sprout className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('dashboard.activeCrops')}</p>
              <p className="text-2xl font-bold text-gray-900">{activeCrops}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('dashboard.expectedYield')}</p>
              <p className="text-2xl font-bold text-gray-900">{expectedYield.toFixed(0)} {t('dashboard.tons')}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('dashboard.totalRevenue')}</p>
              <p className="text-2xl font-bold text-green-600">₹{actualRevenue.toLocaleString('en-IN')}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
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
              <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.currentCrops')}</h2>
              <Link to="/farmer/harvest" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                {t('dashboard.viewAll')}
              </Link>
            </div>
            {loadingCrops ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-600 mt-2 text-sm">{t('common.loading')}</p>
              </div>
            ) : crops.filter(crop => crop.status !== 'ready' && crop.status !== 'listed' && crop.status !== 'sold').length === 0 ? (
              <div className="text-center py-8">
                <Sprout className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-3">
                  {crops.length === 0 ? t('dashboard.noCropsPlanted') : t('dashboard.allCropsHarvested')}
                </p>
                <Link
                  to="/farmer/crop-planning"
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
                >
                  {crops.length === 0 ? t('dashboard.planFirstCrop') : t('dashboard.planNewCrop')}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {crops.filter(crop => crop.status !== 'ready' && crop.status !== 'listed' && crop.status !== 'sold').slice(0, 3).map((crop) => (
                  <div key={crop.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Sprout className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{crop.cropType || crop.name}</h3>
                      <p className="text-sm text-gray-600">{crop.area} acres • {crop.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Farming Tips & News Section */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                {activeCropsFiltered.length > 0 ? t('dashboard.tipsForYourCrops') : t('dashboard.farmingTips')}
              </h2>
            </div>

            <div className="space-y-4">
              {/* Show crop-specific tips if crops are planted */}
              {activeCropsFiltered.length > 0 ? (
                <>
                  {loadingTips ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2 text-sm">{t('common.loadingTips')}</p>
                    </div>
                  ) : (
                    <>
                      {activeCropsFiltered.slice(0, 3).map((crop, index) => {
                        const cropName = crop.cropType || crop.name;
                        const tip = cropTips[cropName] || `Monitor ${cropName} regularly. Ensure proper irrigation, fertilization, and pest management for best results.`;
                        
                        return (
                          <div key={index} className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                            <div className="flex items-start space-x-3">
                              <Sprout className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">{cropName} {t('common.careTips')}</h3>
                                <p className="text-sm text-gray-700">{tip}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Water Management Tip */}
                      <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                        <div className="flex items-start space-x-3">
                          <Droplets className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">{t('tips.waterManagement')}</h3>
                            <p className="text-sm text-gray-700">
                              {t('tips.waterManagementDesc')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Default tips when no crops are planted */}
                  <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <Sprout className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{t('tips.optimalPlanting')}</h3>
                        <p className="text-sm text-gray-700">
                          {t('tips.optimalPlantingDesc')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <Droplets className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{t('tips.waterManagement')}</h3>
                        <p className="text-sm text-gray-700">
                          {t('tips.waterManagementDescLong')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <TrendingUp className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{t('tips.marketTrends')}</h3>
                        <p className="text-sm text-gray-700">
                          {t('tips.marketTrendsDesc')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <Warehouse className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{t('tips.postHarvestStorage')}</h3>
                        <p className="text-sm text-gray-700">
                          {t('tips.postHarvestStorageDesc')}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Government Scheme - Always show */}
              <div className="border border-gray-200 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{t('tips.governmentScheme')}</h3>
                    <p className="text-sm text-gray-700 mb-2">
                      {t('tips.governmentSchemeDesc')}
                    </p>
                    <p className="text-xs text-gray-500">{t('common.updatedDaysAgo', { days: 2 })}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Weather and Quick Actions */}
        <div className="space-y-6">
          {/* Weather Widget */}
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.weatherForecast')}</h2>
              {weather?.location && (
                <div className="flex items-center text-xs text-gray-500">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{weather.location.city || 'Your Location'}</span>
                </div>
              )}
            </div>
            {loadingWeather ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2 text-sm">{t('common.loading')}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <ThermometerSun className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-600">{t('dashboard.temperature')}</p>
                      <p className="font-semibold">{weather?.current?.temperature || 28}°C</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-600">{t('dashboard.humidity')}</p>
                      <p className="font-semibold">{weather?.current?.humidity || 65}%</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Wind className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-600">{t('dashboard.wind')}</p>
                      <p className="font-semibold">{weather?.current?.windSpeed || 12} km/h</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Cloud className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-600">{t('dashboard.conditions')}</p>
                      <p className="font-semibold">{weather?.current?.conditions || t('dashboard.partlyCloudy')}</p>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dashboard.quickActions')}</h2>
            <div className="space-y-3">
              {/* Primary Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/farmer/crop-planning"
                  className="p-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition text-center"
                >
                  <Sprout className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-sm font-semibold">{t('dashboard.planCrop')}</p>
                </Link>
                <Link
                  to="/farmer/harvest"
                  className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition text-center"
                >
                  <Package className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-sm font-semibold">{t('dashboard.manageHarvest')}</p>
                </Link>
              </div>

              {/* Secondary Actions */}
              <div className="space-y-2">
                <Link
                  to="/farmer/browse-procurement-requests"
                  className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition group"
                >
                  <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center mr-3">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{t('dashboard.browseBuyerRequests')}</p>
                    <p className="text-xs text-gray-600">{t('dashboard.findBuyers')}</p>
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
                    <p className="font-semibold text-gray-900 text-sm">{t('nav.warehouses')}</p>
                    <p className="text-xs text-gray-600">{t('dashboard.checkStorage')}</p>
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
                    <p className="font-semibold text-gray-900 text-sm">{t('nav.vehicles')}</p>
                    <p className="text-xs text-gray-600">{t('dashboard.bookTransport')}</p>
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

