import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, TrendingUp, AlertCircle, CheckCircle, Package, MapPin, DollarSign, Sparkles, Lightbulb, Sprout, Trash2 } from 'lucide-react';
import { apiService } from '../../services/api';

const HarvestManagement = () => {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'planted-crops';
  const [activeTab, setActiveTab] = useState<'planted-crops' | 'harvest-ready' | 'listed-produce' | 'list-produce' | 'ai-strategy' | 'harvest-ready-form'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [selectedHarvest, setSelectedHarvest] = useState<any>(null);
  const [harvestReadyForm, setHarvestReadyForm] = useState<any>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [searchingLocations, setSearchingLocations] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Debug: Log when harvestReadyForm changes
  useEffect(() => {
    if (harvestReadyForm) {
      console.log('🔄 harvestReadyForm updated:', harvestReadyForm);
    }
  }, [harvestReadyForm]);
  
  // AI Strategy state
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategy, setStrategy] = useState<any>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [strategyForm, setStrategyForm] = useState({
    cropType: '',
    expectedYield: '',
    yieldUnit: 'quintals',
    harvestMonth: '',
    currentMarketPrice: '',
    storageAvailable: 'yes',
    location: ''
  });
  
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
  
  const [harvests, setHarvests] = useState<any[]>([]);
  const [loadingHarvests, setLoadingHarvests] = useState(false);
  const [deletingCropIds, setDeletingCropIds] = useState<Set<string>>(new Set());
  const [soldCrops, setSoldCrops] = useState<any[]>([]); // Store sold crops with sale info
  
  // Fetch crops/harvests on component mount
  useEffect(() => {
    fetchHarvests();
    fetchSoldCrops();
  }, []);
  
  // Close location dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };

    if (showLocationSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLocationSuggestions]);
  
  // Auto-refresh sold crops when on listed-produce tab
  useEffect(() => {
    if (activeTab === 'listed-produce') {
      fetchSoldCrops();
      const interval = setInterval(fetchSoldCrops, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [activeTab]);
  
  const fetchSoldCrops = async () => {
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
  
  const fetchHarvests = async () => {
    setLoadingHarvests(true);
    try {
      const response = await apiService.getCrops();
      const crops = response.crops || [];
      
      // Get user location for market prices
      const userData = localStorage.getItem('user');
      let userLocation = '';
      if (userData) {
        try {
          const user = JSON.parse(userData);
          userLocation = user.location || user.address || '';
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }
      
      // Transform crops into harvest format with market prices
      const transformedHarvests = await Promise.all(crops.map(async (crop: any) => {
        const plantingDate = new Date(crop.plantingDate);
        const harvestDate = new Date(plantingDate);
        harvestDate.setDate(harvestDate.getDate() + (crop.duration || 90));
        
        const daysRemaining = Math.ceil(
          (harvestDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        
        // Use the status from database if it exists, otherwise calculate it
        let status = crop.status || 'growing';
        if (!crop.status) {
          // Only calculate status if not explicitly set
          if (daysRemaining <= 0) status = 'ready';
          else if (daysRemaining <= 30) status = 'upcoming';
        }
        
        // Use actualYield if available (from harvest ready form), otherwise use expectedYield
        const yieldValue = crop.actualYield || crop.expectedYield;
        const yieldUnit = crop.yieldUnit || 'tons';
        const displayYield = yieldValue ? `${yieldValue} ${yieldUnit}` : 'N/A';
        
        // Get crop name (could be 'name' or 'cropType')
        const cropName = crop.name || crop.cropType || 'Unknown';
        
        // Fetch market price for this crop
        let marketPrice = '₹2,500/quintal'; // Default fallback
        if (cropName && cropName !== 'Unknown') {
          try {
            const priceResponse = await apiService.getMarketPrices(
              cropName,
              crop.storageLocation || userLocation || undefined
            );
            
            if (priceResponse && priceResponse.prices) {
              const cropKey = cropName.toLowerCase();
              if (priceResponse.prices[cropKey]) {
                const priceData = priceResponse.prices[cropKey];
                
                // Convert price to quintals
                let pricePerQuintal = priceData.current;
                const unit = priceData.unit?.toLowerCase() || 'quintal';
                
                if (unit === 'ton' || unit === 'tons') {
                  // 1 ton = 10 quintals, so divide by 10
                  pricePerQuintal = priceData.current / 10;
                } else if (unit === 'kg' || unit === 'kilogram') {
                  // 1 quintal = 100 kg, so multiply by 100
                  pricePerQuintal = priceData.current * 100;
                }
                // If already in quintals, use as is
                
                marketPrice = `₹${Math.round(pricePerQuintal).toLocaleString('en-IN')}/quintal`;
              }
            }
          } catch (error) {
            console.error(`Failed to fetch price for ${cropName}:`, error);
            // Keep default fallback price
          }
        }
        
        return {
          id: crop.id,
          crop: cropName,
          area: `${crop.area} acres`,
          status,
          daysRemaining: Math.max(0, daysRemaining),
          expectedYield: displayYield,
          marketPrice,
          recommendation: status === 'ready' 
            ? 'Harvest immediately. Market prices are favorable.' 
            : status === 'upcoming'
            ? 'Monitor weather. Plan harvest for early morning.'
            : 'Continue regular monitoring and pest control.',
          // Store original crop data for prefilling forms
          originalCrop: crop
        };
      }));
      
      setHarvests(transformedHarvests);
    } catch (error) {
      console.error('Failed to fetch crops:', error);
      // Keep empty array on error
    } finally {
      setLoadingHarvests(false);
    }
  };
  
  const handleDeleteCrop = async (cropId: string, cropName: string) => {
    if (!cropId) {
      alert('Cannot delete crop: Invalid crop ID');
      return;
    }
    
    // Prevent duplicate deletes
    if (deletingCropIds.has(cropId)) {
      console.log(`⚠️ Already deleting ${cropName}, skipping duplicate request`);
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${cropName}? This action cannot be undone.`)) {
      return;
    }
    
    // Mark as deleting
    setDeletingCropIds(prev => new Set(prev).add(cropId));
    
    try {
      console.log(`Deleting crop: ${cropName} (ID: ${cropId})`);
      
      // Immediately remove from UI for better UX
      setHarvests(prev => prev.filter(h => h.id !== cropId));
      
      // Delete from backend
      await apiService.deleteCrop(cropId);
      console.log(`✅ Crop deleted successfully`);
      
    } catch (error: any) {
      console.error('Failed to delete crop:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to delete crop: ${errorMsg}`);
      
      // Refresh to restore the crop if delete failed
      fetchHarvests();
    } finally {
      // Remove from deleting set
      setDeletingCropIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(cropId);
        return newSet;
      });
    }
  };

  const cropTypes = [
    'Wheat', 'Rice', 'Maize', 'Bajra', 'Jowar',
    'Cotton', 'Sugarcane', 'Potato', 'Onion', 'Tomato',
    'Soybean', 'Groundnut', 'Mustard', 'Sunflower', 'Chickpea',
    'Lentils', 'Green Gram', 'Black Gram', 'Barley', 'Millet'
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateStrategyField = (field: string, value: string) => {
    setStrategyForm(prev => ({ ...prev, [field]: value }));
    
    // Auto-fetch price when crop type changes (if price is empty)
    if (field === 'cropType' && value && !strategyForm.currentMarketPrice) {
      setTimeout(() => {
        fetchCurrentPriceForCrop(value);
      }, 500);
    }
    
    // Show location suggestions when typing with debounce
    if (field === 'location' && value.length > 2) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      setSearchingLocations(true);
      // Debounce search by 500ms
      searchTimeoutRef.current = setTimeout(() => {
        fetchLocationSuggestions(value);
      }, 500);
    } else if (field === 'location') {
      setShowLocationSuggestions(false);
      setLocationSuggestions([]);
      setSearchingLocations(false);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
  };

  const fetchLocationSuggestions = async (query: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'KrishiEra/1.0'
          }
        }
      );
      const data = await response.json();
      
      const suggestions = data.map((item: any) => {
        const address = item.address;
        const parts = [];
        
        if (address.village) parts.push(address.village);
        else if (address.town) parts.push(address.town);
        else if (address.city) parts.push(address.city);
        else if (address.municipality) parts.push(address.municipality);
        
        if (address.county && !parts.includes(address.county)) {
          parts.push(address.county);
        }
        
        if (address.state) parts.push(address.state);
        
        return parts.join(', ');
      }).filter((loc: string) => loc.length > 0);
      
      setLocationSuggestions(suggestions);
      setShowLocationSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    } finally {
      setSearchingLocations(false);
    }
  };

  const selectLocation = (location: string) => {
    updateStrategyField('location', location);
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
  };

  const fetchCurrentPriceForCrop = async (cropType: string) => {
    if (!cropType) return;

    try {
      console.log(`🔍 Auto-fetching price for ${cropType}...`);
      const response = await apiService.getMarketPrices(cropType, strategyForm.location || undefined);
      
      console.log('📦 API Response:', response);
      
      if (response.prices && response.prices[cropType.toLowerCase()]) {
        const priceData = response.prices[cropType.toLowerCase()];
        setStrategyForm(prev => ({
          ...prev,
          currentMarketPrice: priceData.current.toString()
        }));
        console.log(`✅ Auto-fetched price for ${cropType}: ₹${priceData.current}/${priceData.unit}`);
      } else {
        console.log(`⚠️ No price data found for ${cropType}`);
      }
    } catch (error) {
      console.error('❌ Auto-fetch price failed:', error);
      // Silently fail - user can manually fetch or enter
    }
  };

  const fetchCurrentPrice = async () => {
    if (!strategyForm.cropType) {
      alert('⚠️ Please select a crop type first');
      return;
    }

    setFetchingPrice(true);
    try {
      console.log(`🔍 Fetching price for ${strategyForm.cropType}...`);
      console.log(`📍 Location: ${strategyForm.location || 'Not specified'}`);
      
      // Ensure crop type is properly capitalized (first letter uppercase)
      const cropType = strategyForm.cropType.charAt(0).toUpperCase() + strategyForm.cropType.slice(1).toLowerCase();
      console.log(`📝 Normalized crop type: ${cropType}`);
      
      const response = await apiService.getMarketPrices(cropType, strategyForm.location || undefined);
      
      console.log('📦 Full API Response:', response);
      
      if (!response) {
        alert('❌ Failed to fetch price: No response from server. Please ensure backend is running.');
        return;
      }
      
      if (response && response.prices) {
        const cropKey = cropType.toLowerCase();
        console.log(`🔑 Looking for crop key: "${cropKey}"`);
        console.log(`📋 Available keys:`, Object.keys(response.prices));
        
        if (response.prices[cropKey]) {
          const priceData = response.prices[cropKey];
          console.log(`✅ Found price data:`, priceData);
          console.log(`💰 Price: ₹${priceData.current}/${priceData.unit}, Trend: ${priceData.trend} (${priceData.change})`);
          
          updateStrategyField('currentMarketPrice', priceData.current.toString());
          alert(`✅ Price fetched successfully!\n\n💰 ₹${priceData.current}/${priceData.unit}\n📈 Trend: ${priceData.trend} (${priceData.change})`);
        } else {
          console.log(`⚠️ No price data found for "${cropKey}"`);
          alert(`⚠️ No price data available for "${cropType}".\n\nAvailable crops: ${Object.keys(response.prices).join(', ')}`);
        }
      } else {
        console.log('⚠️ Invalid response format - no prices object:', response);
        alert('❌ Invalid response format from server. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch market price:', error);
      
      let errorMessage = 'Failed to fetch market price.';
      
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        errorMessage = '❌ Network Error: Cannot connect to backend server.\n\nPlease ensure:\n1. Backend server is running on port 3000\n2. You are logged in\n3. Your internet connection is active';
      } else if (error.response?.status === 401) {
        errorMessage = '❌ Authentication Error: Please log in again.';
      } else if (error.response?.status === 500) {
        errorMessage = '❌ Server Error: ' + (error.response?.data?.error || 'Internal server error');
      } else if (error.message) {
        errorMessage = `❌ Error: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setFetchingPrice(false);
    }
  };

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    setShowLocationSuggestions(false); // Close suggestions when detecting
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      console.log(`📍 Detected coordinates: ${latitude}, ${longitude}`);

      // Reverse geocode to get location name
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'KrishiEra/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get location details');
      }

      const data = await response.json();
      console.log('🗺️ Location data:', data);

      // Extract city/district and state
      const address = data.address || {};
      const city = address.city || address.town || address.village || address.county || address.state_district || '';
      const state = address.state || '';
      
      const locationString = city && state ? `${city}, ${state}` : state || city || 'Unknown Location';
      
      console.log(`✅ Detected location: ${locationString}`);
      updateStrategyField('location', locationString);
      
    } catch (error: any) {
      console.error('Location detection error:', error);
      if (error.code === 1) {
        alert('Location access denied. Please enable location permissions and try again.');
      } else if (error.code === 2) {
        alert('Location unavailable. Please check your device settings.');
      } else if (error.code === 3) {
        alert('Location request timeout. Please try again.');
      } else {
        alert('Failed to detect location. Please enter manually.');
      }
    } finally {
      setDetectingLocation(false);
    }
  };

  const getSellingStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!strategyForm.cropType || !strategyForm.expectedYield || !strategyForm.harvestMonth || !strategyForm.location) {
      alert('⚠️ Please fill all required fields including location');
      return;
    }

    setStrategyLoading(true);
    try {
      const response = await apiService.getAISellingStrategy({
        cropType: strategyForm.cropType,
        expectedYield: parseFloat(strategyForm.expectedYield),
        yieldUnit: strategyForm.yieldUnit,
        harvestMonth: strategyForm.harvestMonth,
        currentMarketPrice: strategyForm.currentMarketPrice ? parseFloat(strategyForm.currentMarketPrice) : null,
        storageAvailable: strategyForm.storageAvailable === 'yes',
        location: strategyForm.location
      });

      setStrategy(response);
    } catch (error: any) {
      console.error('AI Strategy error:', error);
      alert(error.response?.data?.error || 'Failed to get AI recommendations. Please try again.');
    } finally {
      setStrategyLoading(false);
    }
  };

  const resetStrategy = () => {
    setStrategy(null);
    setStrategyForm({
      cropType: '',
      expectedYield: '',
      yieldUnit: 'quintals',
      harvestMonth: '',
      currentMarketPrice: '',
      storageAvailable: 'yes',
      location: ''
    });
  };

  const detectLocationForListing = async () => {
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
                'Accept-Language': 'en',
                'User-Agent': 'KrishiConnect/1.0'
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
            console.warn('Geocoding API returned error:', response.status);
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
            errorMessage += 'Please allow location access in your browser settings. Click the location icon in your browser\'s address bar to enable.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Please check your device settings.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage += 'An unknown error occurred. Please enter your location manually.';
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
    
    const crop = harvest.originalCrop || {};
    
    // Use actualYield if available (from harvest ready form), otherwise default
    const yieldValue = crop.actualYield || 10;
    const yieldUnit = crop.yieldUnit || 'quintals';
    
    // Convert to quintals for the form
    let quantity = '';
    let unit = 'quintals';
    
    if (yieldUnit.toLowerCase().includes('ton')) {
      quantity = (parseFloat(yieldValue) * 10).toString(); // 1 ton = 10 quintals
      unit = 'quintals';
    } else if (yieldUnit.toLowerCase().includes('quintal')) {
      quantity = yieldValue.toString();
      unit = 'quintals';
    } else if (yieldUnit.toLowerCase().includes('kg')) {
      quantity = (parseFloat(yieldValue) / 100).toString(); // 100 kg = 1 quintal
      unit = 'quintals';
    } else {
      quantity = yieldValue.toString();
      unit = yieldUnit;
    }

    // Get user location from localStorage
    const userData = sessionStorage.getItem('user');
    let location = '';
    if (userData) {
      try {
        const user = JSON.parse(userData);
        location = user.location || user.address || '';
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }

    // Use storage location from harvest ready form if available
    const storageLocation = crop.storageLocation || location;

    // Prefill form with actual harvest data
    setFormData({
      cropType: harvest.crop || '',
      variety: crop.variety || '',
      quantity: quantity,
      quantityUnit: unit,
      qualityGrade: crop.qualityGrade || 'A',
      pricePerUnit: '', // Leave empty for user to fetch or enter
      location: storageLocation,
      availableFrom: crop.harvestDate || new Date().toISOString().split('T')[0],
      description: crop.notes || `${harvest.crop} from ${harvest.area} farm. ${harvest.recommendation || ''}`,
      images: []
    });

    setActiveTab('list-produce');
  };

  const handleAIStrategy = (harvest: any) => {
    setSelectedHarvest(harvest);
    
    const crop = harvest.originalCrop || {};
    
    // Use actualYield if available (from harvest ready form), otherwise use expectedYield
    const yieldValue = crop.actualYield || crop.expectedYield || 0;
    const yieldUnit = crop.yieldUnit || 'tons';
    
    // Keep the original unit for AI strategy
    let quantity = yieldValue.toString();
    let unit = yieldUnit;

    // Extract price from marketPrice
    let currentPrice = '';
    if (harvest.marketPrice) {
      const priceMatch = harvest.marketPrice.match(/₹?([\d,]+)/);
      if (priceMatch) {
        currentPrice = priceMatch[1].replace(/,/g, '');
      }
    }

    // Get user location
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

    // Use storage location from harvest ready form if available
    const storageLocation = crop.storageLocation || location;

    // Get harvest month from harvestDate if available, otherwise calculate
    let harvestMonth = '';
    if (crop.harvestDate) {
      const harvestDate = new Date(crop.harvestDate);
      harvestMonth = months[harvestDate.getMonth()];
    } else {
      const currentMonth = new Date().getMonth();
      const harvestMonthIndex = harvest.daysRemaining <= 30 ? currentMonth : (currentMonth + 1) % 12;
      harvestMonth = months[harvestMonthIndex];
    }

    // Prefill AI strategy form with actual crop data
    setStrategyForm({
      cropType: harvest.crop || '',
      expectedYield: quantity,
      yieldUnit: unit,
      harvestMonth: harvestMonth,
      currentMarketPrice: currentPrice,
      storageAvailable: crop.storageLocation ? 'yes' : 'yes', // Default to yes
      location: storageLocation
    });

    setActiveTab('ai-strategy');
  };

  const handleMarkHarvestReady = (harvest: any) => {
    const crop = harvest.originalCrop || {};
    
    console.log('🔍 Harvest object:', harvest);
    console.log('🔍 Original crop data:', crop);
    
    // Get user location for storage location default
    const userData = localStorage.getItem('user');
    let defaultLocation = '';
    if (userData) {
      try {
        const user = JSON.parse(userData);
        defaultLocation = user.location || user.address || '';
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    
    // Use crop name from database (crop.name is the actual field name in DB)
    const cropName = crop.name || harvest.crop || '';
    console.log('🌾 Crop name:', cropName);
    
    // Prefill the harvest ready form with crop data
    const formData = {
      id: harvest.id,
      cropType: cropName,
      variety: crop.variety || '',
      actualYield: crop.expectedYield ? crop.expectedYield.toString() : '10',
      yieldUnit: crop.yieldUnit || 'quintals',
      qualityGrade: crop.qualityGrade || 'A',
      harvestDate: new Date().toISOString().split('T')[0],
      storageLocation: crop.storageLocation || defaultLocation,
      notes: crop.notes || ''
    };
    
    console.log('📝 Form data to prefill:', formData);
    
    setHarvestReadyForm(formData);
    setActiveTab('harvest-ready-form');
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
        description: formData.description,
        cropId: selectedHarvest?.id // Pass the crop ID
      });

      // Update crop status to 'listed' if we have the crop ID
      if (selectedHarvest && selectedHarvest.id) {
        try {
          await apiService.updateCrop(selectedHarvest.id, {
            status: 'listed',
            listedDate: new Date().toISOString()
          });
        } catch (error) {
          console.error('Failed to update crop status:', error);
        }
      }

      alert('Your produce has been listed successfully! Buyers can now see and quote on it.');
      setActiveTab('listed-produce');
      setSelectedHarvest(null);
      fetchHarvests(); // Refresh to update the lists
      
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
            onClick={() => setActiveTab('planted-crops')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'planted-crops'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Planted Crops
          </button>
          <button
            onClick={() => setActiveTab('harvest-ready')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'harvest-ready'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Harvest Ready
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
          <button
            onClick={() => setActiveTab('ai-strategy')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'ai-strategy'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            AI Selling Strategy
          </button>
          <button
            onClick={() => setActiveTab('listed-produce')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'listed-produce'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Listed Produce
          </button>
        </nav>
      </div>

      {/* Planted Crops Tab */}
      {activeTab === 'planted-crops' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <p className="text-sm text-gray-600">Growing</p>
              <p className="text-3xl font-bold text-gray-600">
                {harvests.filter(h => h.status !== 'ready' && h.status !== 'listed' && h.status !== 'sold').length}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Total Planted</p>
              <p className="text-3xl font-bold text-gray-900">
                {harvests.filter(h => h.status !== 'ready' && h.status !== 'listed' && h.status !== 'sold').length}
              </p>
            </div>
          </div>

          {harvests.filter(h => h.status !== 'ready' && h.status !== 'listed' && h.status !== 'sold').length > 0 && (
            <>
              {/* Helper Info Card */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Crop Management Tip</h4>
                    <p className="text-sm text-gray-700">
                      When your crop is ready to harvest, click <span className="font-semibold text-blue-600">Mark Harvest Ready</span> to update harvest details and move it to the Harvest Ready tab.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {harvests.filter(h => h.status !== 'ready' && h.status !== 'listed' && h.status !== 'sold').map((harvest) => (
                  <div key={harvest.id || harvest.crop} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
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
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleMarkHarvestReady(harvest)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center text-sm font-medium shadow-sm hover:shadow-md"
                          title="Mark this crop as harvest ready"
                        >
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          <span className="hidden sm:inline">Mark Harvest Ready</span>
                          <span className="sm:hidden">Ready</span>
                        </button>
                        {harvest.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCrop(harvest.id, harvest.crop);
                            }}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center text-sm font-medium shadow-sm hover:shadow-md"
                            title="Delete this crop"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600">Expected Yield</p>
                        <p className="text-lg font-semibold text-gray-900">{harvest.expectedYield}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Market Price</p>
                        <p className="text-lg font-semibold text-gray-900">{harvest.marketPrice}</p>
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

          {/* Empty State */}
          {harvests.filter(h => h.status !== 'ready' && h.status !== 'listed' && h.status !== 'sold').length === 0 && !loadingHarvests && (
            <div className="card text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Planted Crops</h3>
              <p className="text-gray-600 mb-4">
                Start by planning your crops to see them here
              </p>
              <button
                onClick={() => window.location.href = '/farmer/crop-planning'}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Sprout className="h-5 w-5 mr-2" />
                Plan a Crop
              </button>
            </div>
          )}
        </>
      )}

      {/* Harvest Ready Tab */}
      {activeTab === 'harvest-ready' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <p className="text-sm text-gray-600">Ready to Sell</p>
              <p className="text-3xl font-bold text-green-600">
                {harvests.filter(h => h.status === 'ready').length}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Total Yield</p>
              <p className="text-3xl font-bold text-blue-600">
                {harvests.filter(h => h.status === 'ready').reduce((sum, h) => {
                  const match = h.expectedYield?.match(/([\d.]+)/);
                  return sum + (match ? parseFloat(match[1]) : 0);
                }, 0).toFixed(1)} quintals
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Estimated Value</p>
              <p className="text-3xl font-bold text-gray-900">
                ₹{harvests.filter(h => h.status === 'ready').reduce((sum, h) => {
                  const yieldMatch = h.expectedYield?.match(/([\d.]+)/);
                  const priceMatch = h.marketPrice?.match(/₹?([\d,]+)/);
                  const yield_ = yieldMatch ? parseFloat(yieldMatch[1]) : 0;
                  const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
                  return sum + (yield_ * price);
                }, 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {harvests.filter(h => h.status === 'ready').length > 0 && (
            <>
              {/* Helper Info Card */}
              <div className="bg-gradient-to-r from-orange-50 to-green-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Smart Selling Tip</h4>
                    <p className="text-sm text-gray-700">
                      Click <span className="font-semibold text-orange-600">AI Strategy</span> to get pricing recommendations before listing, 
                      or click <span className="font-semibold text-green-600">List for Sale</span> to list immediately.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {harvests.filter(h => h.status === 'ready').map((harvest) => (
                  <div key={harvest.id || harvest.crop} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-semibold text-gray-900">{harvest.crop}</h3>
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Ready to Harvest
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{harvest.area}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAIStrategy(harvest)}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center text-sm font-medium shadow-sm hover:shadow-md"
                          title="Get AI pricing strategy before listing"
                        >
                          <Sparkles className="h-4 w-4 mr-1.5" />
                          <span className="hidden sm:inline">AI Strategy</span>
                          <span className="sm:hidden">AI</span>
                        </button>
                        <button 
                          onClick={() => handleListForSale(harvest)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center text-sm font-medium shadow-sm hover:shadow-md"
                          title="List this harvest for sale"
                        >
                          <Package className="h-4 w-4 mr-1.5" />
                          <span className="hidden sm:inline">List for Sale</span>
                          <span className="sm:hidden">List</span>
                        </button>
                        {harvest.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCrop(harvest.id, harvest.crop);
                            }}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center text-sm font-medium shadow-sm hover:shadow-md"
                            title="Delete this crop"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600">Expected Yield</p>
                        <p className="text-lg font-semibold text-gray-900">{harvest.expectedYield}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Market Price</p>
                        <p className="text-lg font-semibold text-gray-900">{harvest.marketPrice}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg flex items-start space-x-2 bg-green-50">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
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

          {/* Empty State */}
          {harvests.filter(h => h.status === 'ready').length === 0 && !loadingHarvests && (
            <div className="card text-center py-12">
              <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Harvest Ready Crops</h3>
              <p className="text-gray-600 mb-4">
                Mark your planted crops as harvest ready when they're ready to sell
              </p>
              <button
                onClick={() => setActiveTab('planted-crops')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Sprout className="h-5 w-5 mr-2" />
                View Planted Crops
              </button>
            </div>
          )}
        </>
      )}

      {/* Listed Produce Tab */}
      {activeTab === 'listed-produce' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <p className="text-sm text-gray-600">Listed Items</p>
              <p className="text-3xl font-bold text-purple-600">
                {harvests.filter(h => h.status === 'listed').length}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Total Listed Quantity</p>
              <p className="text-3xl font-bold text-blue-600">
                {harvests.filter(h => h.status === 'listed').reduce((sum, h) => {
                  const match = h.expectedYield?.match(/([\d.]+)/);
                  return sum + (match ? parseFloat(match[1]) : 0);
                }, 0).toFixed(1)} quintals
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                ₹{soldCrops.reduce((sum, crop) => {
                  // Calculate actual revenue from sold crops
                  const quantity = crop.quantity || 0;
                  const price = crop.finalPrice || crop.currentBestOffer || 0;
                  return sum + (quantity * price);
                }, 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {harvests.filter(h => h.status === 'listed').length > 0 && (
            <>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Package className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Listed Produce</h4>
                    <p className="text-sm text-gray-700">
                      Your produce is now visible to buyers. You'll receive notifications when buyers send quotes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {harvests.filter(h => h.status === 'listed').map((harvest) => (
                  <div key={harvest.id || harvest.crop} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-semibold text-gray-900">{harvest.crop}</h3>
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            Listed for Sale
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{harvest.area}</p>
                      </div>
                      <div className="flex gap-2">
                        {harvest.id && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(`Remove ${harvest.crop} from listings?`)) {
                                try {
                                  await apiService.updateCrop(harvest.id, { status: 'ready' });
                                  fetchHarvests();
                                } catch (error) {
                                  console.error('Failed to unlist:', error);
                                  alert('Failed to remove listing');
                                }
                              }
                            }}
                            className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center text-sm font-medium shadow-sm hover:shadow-md"
                            title="Remove from listings"
                          >
                            Unlist
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600">Quantity</p>
                        <p className="text-lg font-semibold text-gray-900">{harvest.expectedYield}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Listed Price</p>
                        <p className="text-lg font-semibold text-gray-900">{harvest.marketPrice}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Quality</p>
                        <p className="text-lg font-semibold text-gray-900">Grade {harvest.originalCrop?.qualityGrade || 'A'}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg flex items-start space-x-2 bg-purple-50">
                      <Package className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Status</p>
                        <p className="text-sm text-gray-700">Waiting for buyer quotes</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Empty State */}
          {harvests.filter(h => h.status === 'listed').length === 0 && !loadingHarvests && (
            <div className="card text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Listed Produce</h3>
              <p className="text-gray-600 mb-4">
                List your harvest ready crops to connect with buyers
              </p>
              <button
                onClick={() => setActiveTab('harvest-ready')}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <Package className="h-5 w-5 mr-2" />
                View Harvest Ready Crops
              </button>
            </div>
          )}
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
                    <input
                      type="text"
                      value={formData.cropType}
                      onChange={(e) => updateField('cropType', e.target.value)}
                      className="input-field"
                      placeholder="Enter crop type"
                      required
                      list="crop-type-suggestions"
                    />
                    <datalist id="crop-type-suggestions">
                      {cropTypes.map(crop => (
                        <option key={crop} value={crop} />
                      ))}
                    </datalist>
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
                    <input
                      type="text"
                      value={formData.quantityUnit}
                      onChange={(e) => updateField('quantityUnit', e.target.value)}
                      className="input-field"
                      placeholder="e.g., quintals, tons, kg"
                      list="unit-suggestions-list"
                    />
                    <datalist id="unit-suggestions-list">
                      <option value="quintals" />
                      <option value="tons" />
                      <option value="kg" />
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality Grade
                    </label>
                    <input
                      type="text"
                      value={formData.qualityGrade}
                      onChange={(e) => updateField('qualityGrade', e.target.value)}
                      className="input-field"
                      placeholder="e.g., A, B, C"
                      list="quality-grade-suggestions"
                    />
                    <datalist id="quality-grade-suggestions">
                      <option value="A" />
                      <option value="B" />
                      <option value="C" />
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Unit (₹) *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.pricePerUnit}
                        onChange={(e) => updateField('pricePerUnit', e.target.value)}
                        className="input-field flex-1"
                        placeholder="Enter price"
                        required
                        min="0"
                        step="0.01"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!formData.cropType) {
                            alert('⚠️ Please select a crop type first');
                            return;
                          }
                          setFetchingPrice(true);
                          try {
                            console.log(`🔍 Fetching price for ${formData.cropType}...`);
                            const response = await apiService.getMarketPrices(
                              formData.cropType,
                              formData.location || undefined
                            );
                            
                            console.log('📦 API Response:', response);
                            
                            if (!response) {
                              alert('❌ Failed to fetch price: No response from server.\n\nPlease ensure backend is running on port 3000.');
                              return;
                            }
                            
                            if (response && response.prices) {
                              const cropKey = formData.cropType.toLowerCase();
                              if (response.prices[cropKey]) {
                                const priceData = response.prices[cropKey];
                                console.log(`✅ Price data:`, priceData);
                                
                                // Convert price to per quintal if needed
                                let pricePerQuintal = priceData.current;
                                if (priceData.unit.toLowerCase() === 'ton') {
                                  pricePerQuintal = priceData.current / 10;
                                } else if (priceData.unit.toLowerCase() === 'kg') {
                                  pricePerQuintal = priceData.current * 100;
                                }
                                
                                updateField('pricePerUnit', pricePerQuintal.toString());
                                alert(`✅ Price fetched successfully!\n\n💰 ₹${pricePerQuintal}/quintal\n📈 Trend: ${priceData.trend} (${priceData.change})`);
                              } else {
                                alert(`⚠️ No price data available for "${formData.cropType}".\n\nPlease enter price manually.`);
                              }
                            } else {
                              alert('❌ Invalid response format. Please try again.');
                            }
                          } catch (error: any) {
                            console.error('Failed to fetch price:', error);
                            
                            let errorMessage = 'Failed to fetch market price.';
                            
                            if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
                              errorMessage = '❌ Network Error: Cannot connect to backend.\n\nPlease ensure:\n1. Backend server is running (port 3000)\n2. You are logged in\n3. Internet connection is active';
                            } else if (error.response?.status === 401) {
                              errorMessage = '❌ Authentication Error: Please log in again.';
                            } else if (error.response?.status === 500) {
                              errorMessage = '❌ Server Error: ' + (error.response?.data?.error || 'Internal server error');
                            } else if (error.message) {
                              errorMessage = `❌ Error: ${error.message}`;
                            }
                            
                            alert(errorMessage + '\n\nYou can enter the price manually.');
                          } finally {
                            setFetchingPrice(false);
                          }
                        }}
                        disabled={fetchingPrice || !formData.cropType}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {fetchingPrice ? 'Fetching...' : 'Fetch Price'}
                      </button>
                    </div>
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
                        onClick={detectLocationForListing}
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
                  setActiveTab('harvest-ready');
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

      {/* AI Selling Strategy Tab */}
      {activeTab === 'ai-strategy' && (
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <Sparkles className="h-8 w-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">AI Selling Strategy</h2>
            <p className="text-gray-600 mt-2">Get smart recommendations on when and how much to sell for maximum profit</p>
            {selectedHarvest && (
              <div className="mt-3 inline-flex items-center px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-orange-600 mr-2" />
                <span className="text-sm text-orange-900">
                  Strategy form prefilled from <span className="font-semibold">{selectedHarvest.crop}</span> harvest
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Package className="h-6 w-6 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-900">Your Crop Details</h3>
              </div>

              <form onSubmit={getSellingStrategy} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Crop Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={strategyForm.cropType}
                    onChange={(e) => updateStrategyField('cropType', e.target.value)}
                    className="input-field"
                    placeholder="Enter crop type"
                    list="strategy-crop-suggestions"
                  />
                  <datalist id="strategy-crop-suggestions">
                    {cropTypes.map(crop => (
                      <option key={crop} value={crop} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Yield <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      value={strategyForm.expectedYield}
                      onChange={(e) => updateStrategyField('expectedYield', e.target.value)}
                      className="input-field flex-1"
                      placeholder="Enter quantity"
                      step="0.01"
                      min="0"
                    />
                    <input
                      type="text"
                      value={strategyForm.yieldUnit}
                      onChange={(e) => updateStrategyField('yieldUnit', e.target.value)}
                      className="input-field w-32"
                      placeholder="Unit"
                      list="strategy-unit-suggestions"
                    />
                    <datalist id="strategy-unit-suggestions">
                      <option value="quintals" />
                      <option value="tons" />
                      <option value="kg" />
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Harvest Month <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={strategyForm.harvestMonth}
                    onChange={(e) => updateStrategyField('harvestMonth', e.target.value)}
                    className="input-field"
                    placeholder="Enter harvest month"
                    list="strategy-month-suggestions"
                  />
                  <datalist id="strategy-month-suggestions">
                    {months.map(month => (
                      <option key={month} value={month} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Market Price (₹/{strategyForm.yieldUnit})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={strategyForm.currentMarketPrice}
                      onChange={(e) => updateStrategyField('currentMarketPrice', e.target.value)}
                      className="input-field flex-1"
                      placeholder="Enter price or fetch current"
                      step="0.01"
                      min="0"
                    />
                    <button
                      type="button"
                      onClick={fetchCurrentPrice}
                      disabled={fetchingPrice || !strategyForm.cropType}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                      title="Fetch current market price"
                    >
                      {fetchingPrice ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span className="hidden sm:inline">Fetching...</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4" />
                          <span className="hidden sm:inline">Fetch Price</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Click "Fetch Price" to get current market rate or leave empty for auto-fetch
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Storage Available?
                  </label>
                  <select
                    value={strategyForm.storageAvailable}
                    onChange={(e) => updateStrategyField('storageAvailable', e.target.value)}
                    className="input-field"
                  >
                    <option value="yes">Yes - I have storage</option>
                    <option value="no">No - Must sell immediately</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Location <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 relative">
                    <div className="flex-1 relative" ref={locationDropdownRef}>
                      <input
                        type="text"
                        required
                        value={strategyForm.location}
                        onChange={(e) => updateStrategyField('location', e.target.value)}
                        className="input-field w-full"
                        placeholder="e.g., Bangalore, Karnataka"
                        disabled={detectingLocation}
                      />
                      {searchingLocations && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        </div>
                      )}
                      {showLocationSuggestions && locationSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {locationSuggestions.map((location, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => selectLocation(location)}
                              className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-700">{location}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={detectingLocation}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                      title="Auto-detect your location"
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
                    📍 Type to search locations, click "Detect" to auto-fill, or enter manually
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={strategyLoading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {strategyLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Sparkles className="h-5 w-5 mr-2" />
                      Get AI Strategy
                    </span>
                  )}
                </button>
              </form>
            </div>

            {/* AI Strategy Results */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Lightbulb className="h-6 w-6 text-orange-600" />
                <h3 className="text-xl font-semibold text-gray-900">AI Recommendations</h3>
              </div>

              {!strategy ? (
                <div className="text-center py-12">
                  <div className="bg-white/50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                    <TrendingUp className="h-12 w-12 text-orange-400" />
                  </div>
                  <p className="text-gray-600 mb-2">Fill in your crop details</p>
                  <p className="text-sm text-gray-500">Get personalized selling strategy based on market trends and price predictions</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {/* Main Recommendation */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1 text-sm">Strategy Summary</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">{strategy.summary}</p>
                      </div>
                    </div>
                  </div>

                  {/* Sell Now vs Store Split */}
                  {strategy.sellNowPercentage !== undefined && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm">Recommended Split</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-700">Sell Immediately</span>
                            <span className="text-sm font-bold text-green-600">{strategy.sellNowPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${strategy.sellNowPercentage}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            ≈ {((parseFloat(strategyForm.expectedYield) * strategy.sellNowPercentage) / 100).toFixed(2)} {strategyForm.yieldUnit}
                          </p>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-700">Store for Later</span>
                            <span className="text-sm font-bold text-blue-600">{strategy.storeLaterPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${strategy.storeLaterPercentage}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            ≈ {((parseFloat(strategyForm.expectedYield) * strategy.storeLaterPercentage) / 100).toFixed(2)} {strategyForm.yieldUnit}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Price Predictions */}
                  {strategy.pricePredictions && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">Price Trend Forecast</h4>
                      <div className="space-y-2">
                        {strategy.pricePredictions.map((pred: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-700">{pred.period}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-semibold text-gray-900">₹{pred.price}/{strategyForm.yieldUnit}</span>
                              {pred.change && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  pred.change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {pred.change > 0 ? '+' : ''}{pred.change}%
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Profit Comparison */}
                  {strategy.profitComparison && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">Profit Comparison</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Sell All Now</span>
                          <span className="text-xs font-semibold text-gray-900">₹{strategy.profitComparison.sellAllNow?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Follow AI Strategy (Gross)</span>
                          <span className="text-xs font-semibold text-blue-600">₹{strategy.profitComparison.followStrategy?.toLocaleString()}</span>
                        </div>
                        {strategy.profitComparison.storageCost > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Less: Storage Cost</span>
                            <span className="text-xs font-semibold text-red-600">-₹{strategy.profitComparison.storageCost?.toLocaleString()}</span>
                          </div>
                        )}
                        {strategy.profitComparison.additionalProfit !== undefined && (
                          <div className="pt-2 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-700">Net Additional Profit</span>
                              <span className={`text-sm font-bold ${strategy.profitComparison.additionalProfit > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                                {strategy.profitComparison.additionalProfit > 0 ? '+' : ''}₹{strategy.profitComparison.additionalProfit?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Key Insights */}
                  {strategy.insights && strategy.insights.length > 0 && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">Key Insights</h4>
                      <ul className="space-y-1.5">
                        {strategy.insights.map((insight: string, idx: number) => (
                          <li key={idx} className="flex items-start space-x-2 text-xs text-gray-700">
                            <AlertCircle className="h-3 w-3 text-orange-500 flex-shrink-0 mt-0.5" />
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Confidence Score */}
                  {strategy.confidence && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">Confidence Score</span>
                        <span className="text-xs font-semibold text-gray-900">{strategy.confidence}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${strategy.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-2">
                    {/* Info message */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        💡 Click "List for Sale" to create a listing with {strategy.sellNowPercentage}% of your harvest ({((parseFloat(strategyForm.expectedYield) * strategy.sellNowPercentage) / 100).toFixed(1)} {strategyForm.yieldUnit}) at the recommended price.
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={resetStrategy}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                      >
                        Try Another Crop
                      </button>
                      <button
                        onClick={() => {
                          // Calculate the amount to sell now based on AI recommendation
                          const sellNowAmount = (parseFloat(strategyForm.expectedYield) * strategy.sellNowPercentage) / 100;
                          
                          // Get the current or predicted price
                          const recommendedPrice = strategy.pricePredictions && strategy.pricePredictions.length > 0 
                            ? strategy.pricePredictions[0].price 
                            : parseFloat(strategyForm.currentMarketPrice || '0');
                          
                          // Prefill the list produce form
                          setFormData({
                            cropType: strategyForm.cropType,
                            variety: '',
                            quantity: sellNowAmount.toFixed(2),
                            quantityUnit: strategyForm.yieldUnit,
                            qualityGrade: 'A',
                            pricePerUnit: recommendedPrice.toString(),
                            location: strategyForm.location || '',
                            availableFrom: new Date().toISOString().split('T')[0],
                            description: `${strategyForm.cropType} - Following AI selling strategy: Selling ${strategy.sellNowPercentage}% now. ${strategy.summary}`,
                            images: []
                          });
                          
                          // Switch to list produce tab
                          setActiveTab('list-produce');
                          setSelectedHarvest({
                            crop: strategyForm.cropType,
                            expectedYield: `${sellNowAmount.toFixed(2)} ${strategyForm.yieldUnit}`,
                            marketPrice: `₹${recommendedPrice}/${strategyForm.yieldUnit}`
                          });
                        }}
                        className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-1"
                      >
                        <Package className="h-4 w-4" />
                        List for Sale
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mark Harvest Ready Form */}
      {activeTab === 'harvest-ready-form' && harvestReadyForm && (
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Mark Crop as Harvest Ready</h2>
            <p className="text-gray-600 mt-2">Update the actual harvest details for {harvestReadyForm.cropType}</p>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              // Update the crop status to ready
              await apiService.updateCrop(harvestReadyForm.id, {
                status: 'ready',
                actualYield: parseFloat(harvestReadyForm.actualYield),
                yieldUnit: harvestReadyForm.yieldUnit,
                variety: harvestReadyForm.variety,
                qualityGrade: harvestReadyForm.qualityGrade,
                harvestDate: harvestReadyForm.harvestDate,
                storageLocation: harvestReadyForm.storageLocation,
                notes: harvestReadyForm.notes
              });

              alert('Crop marked as harvest ready successfully!');
              setActiveTab('harvest-ready');
              setHarvestReadyForm(null);
              fetchHarvests(); // Refresh the list
            } catch (error) {
              console.error('Update crop error:', error);
              alert('Failed to update crop. Please try again.');
            } finally {
              setLoading(false);
            }
          }} className="bg-white rounded-lg shadow-lg">
            <div className="p-6 space-y-6">
              {/* Crop Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Crop Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={harvestReadyForm.cropType}
                    disabled
                    className="input-field bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variety (Optional)
                  </label>
                  <input
                    type="text"
                    value={harvestReadyForm.variety}
                    onChange={(e) => setHarvestReadyForm({...harvestReadyForm, variety: e.target.value})}
                    className="input-field"
                    placeholder="e.g., Basmati, Hybrid"
                  />
                </div>
              </div>

              {/* Yield Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Yield <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={harvestReadyForm.actualYield}
                    onChange={(e) => setHarvestReadyForm({...harvestReadyForm, actualYield: e.target.value})}
                    className="input-field"
                    placeholder="Enter actual yield"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={harvestReadyForm.yieldUnit}
                    onChange={(e) => setHarvestReadyForm({...harvestReadyForm, yieldUnit: e.target.value})}
                    className="input-field"
                    placeholder="e.g., quintals, tons, kg"
                    list="unit-suggestions"
                  />
                  <datalist id="unit-suggestions">
                    <option value="quintals" />
                    <option value="tons" />
                    <option value="kg" />
                  </datalist>
                </div>
              </div>

              {/* Quality and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Grade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={harvestReadyForm.qualityGrade}
                    onChange={(e) => setHarvestReadyForm({...harvestReadyForm, qualityGrade: e.target.value})}
                    className="input-field"
                    placeholder="e.g., A, B, C"
                    list="grade-suggestions"
                  />
                  <datalist id="grade-suggestions">
                    <option value="A" />
                    <option value="B" />
                    <option value="C" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harvest Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={harvestReadyForm.harvestDate}
                    onChange={(e) => setHarvestReadyForm({...harvestReadyForm, harvestDate: e.target.value})}
                    className="input-field"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Storage Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Storage Location (Optional)
                </label>
                <input
                  type="text"
                  value={harvestReadyForm.storageLocation}
                  onChange={(e) => setHarvestReadyForm({...harvestReadyForm, storageLocation: e.target.value})}
                  className="input-field"
                  placeholder="Where is the harvest stored?"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={harvestReadyForm.notes}
                  onChange={(e) => setHarvestReadyForm({...harvestReadyForm, notes: e.target.value})}
                  className="input-field"
                  rows={3}
                  placeholder="Any additional notes about the harvest..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('planted-crops');
                  setHarvestReadyForm(null);
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
                {loading ? 'Updating...' : 'Mark as Ready'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default HarvestManagement

