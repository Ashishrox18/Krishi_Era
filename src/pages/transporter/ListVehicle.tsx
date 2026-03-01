import { useState, useRef, useEffect } from 'react'
import { Truck, MapPin, Package, DollarSign, Navigation, Loader } from 'lucide-react'
import { apiService } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const ListVehicle = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchingLocations, setSearchingLocations] = useState(false)
  const [fetchingLocation, setFetchingLocation] = useState(false)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [formData, setFormData] = useState({
    vehicleNumber: '',
    vehicleType: '',
    capacity: '',
    capacityUnit: 'tons',
    availableRegions: [] as string[],
    currentLocation: '',
    pricePerKm: '',
    features: [] as string[],
    driverName: '',
    driverContact: '',
    insuranceValid: true,
    pollutionCertValid: true,
    fitnessValid: true,
    description: ''
  })

  const vehicleTypes = [
    'Mini Truck (1-2 tons)',
    'Light Truck (2-5 tons)',
    'Medium Truck (5-10 tons)',
    'Heavy Truck (10-20 tons)',
    'Trailer (20+ tons)',
    'Refrigerated Truck',
    'Container Truck',
    'Flatbed Truck'
  ]

  const vehicleFeatures = [
    'GPS Tracking',
    'Temperature Control',
    'Live Monitoring',
    'Insurance Covered',
    'Experienced Driver',
    'Loading/Unloading Service',
    'Express Delivery',
    '24/7 Available'
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLocationSearch = (value: string) => {
    handleInputChange('currentLocation', value)
    
    if (value.length > 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      
      setSearchingLocations(true)
      searchTimeoutRef.current = setTimeout(() => {
        fetchLocationSuggestions(value)
      }, 500)
    } else {
      setShowSuggestions(false)
      setLocationSuggestions([])
      setSearchingLocations(false)
    }
  }

  const fetchLocationSuggestions = async (query: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'KrishiEra/1.0'
          }
        }
      )
      const data = await response.json()
      
      const suggestions = data.map((item: any) => {
        const address = item.address
        const parts = []
        
        if (address.city) parts.push(address.city)
        else if (address.town) parts.push(address.town)
        else if (address.village) parts.push(address.village)
        
        if (address.state) parts.push(address.state)
        
        return parts.join(', ')
      }).filter((loc: string) => loc.length > 0)
      
      setLocationSuggestions(suggestions)
      setShowSuggestions(suggestions.length > 0)
    } catch (error) {
      console.error('Error fetching location suggestions:', error)
      setLocationSuggestions([])
      setShowSuggestions(false)
    } finally {
      setSearchingLocations(false)
    }
  }

  const selectLocation = (location: string) => {
    handleInputChange('currentLocation', location)
    setShowSuggestions(false)
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setFetchingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'KrishiEra/1.0'
              }
            }
          )
          const data = await response.json()
          
          const city = data.address.city || data.address.town || data.address.village
          const state = data.address.state
          const locationString = state ? `${city}, ${state}` : city
          
          handleInputChange('currentLocation', locationString)
        } catch (error) {
          console.error('Error fetching location:', error)
          alert('Failed to fetch location details. Please enter manually.')
        } finally {
          setFetchingLocation(false)
        }
      },
      (error) => {
        setFetchingLocation(false)
        console.error('Error getting location:', error)
        alert('Unable to retrieve your location. Please enter manually.')
      }
    )
  }

  const addRegion = () => {
    if (formData.currentLocation && !formData.availableRegions.includes(formData.currentLocation)) {
      setFormData(prev => ({
        ...prev,
        availableRegions: [...prev.availableRegions, prev.currentLocation],
        currentLocation: ''
      }))
    }
  }

  const removeRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      availableRegions: prev.availableRegions.filter(r => r !== region)
    }))
  }

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.availableRegions.length === 0) {
      alert('Please add at least one available region')
      return
    }

    setLoading(true)
    try {
      await apiService.listVehicle(formData)
      alert('Vehicle listed successfully!')
      navigate('/transporter')
    } catch (error) {
      console.error('Failed to list vehicle:', error)
      alert('Failed to list vehicle. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationInputRef.current && !locationInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">List Your Vehicle</h1>
        <p className="text-gray-600 mt-1">Add your vehicle to start receiving transport requests</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Details */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Truck className="h-5 w-5 mr-2" />
            Vehicle Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Vehicle Number</label>
              <input
                type="text"
                value={formData.vehicleNumber}
                onChange={(e) => handleInputChange('vehicleNumber', e.target.value.toUpperCase())}
                className="input"
                placeholder="e.g., DL01AB1234"
                required
              />
            </div>

            <div>
              <label className="label">Vehicle Type</label>
              <select
                value={formData.vehicleType}
                onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                className="input"
                required
              >
                <option value="">Select vehicle type</option>
                {vehicleTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Capacity</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', e.target.value)}
                  className="input flex-1"
                  placeholder="Enter capacity"
                  required
                  min="0.1"
                  step="0.1"
                />
                <select
                  value={formData.capacityUnit}
                  onChange={(e) => handleInputChange('capacityUnit', e.target.value)}
                  className="input w-24"
                >
                  <option value="tons">Tons</option>
                  <option value="kg">KG</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Price per KM (₹)</label>
              <input
                type="number"
                value={formData.pricePerKm}
                onChange={(e) => handleInputChange('pricePerKm', e.target.value)}
                className="input"
                placeholder="Enter price per km"
                required
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Available Regions */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Available Regions
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">Add City/Region</label>
              <div className="relative" ref={locationInputRef}>
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                <input
                  type="text"
                  value={formData.currentLocation}
                  onChange={(e) => handleLocationSearch(e.target.value)}
                  className="input pl-10 pr-32"
                  placeholder="Search for city or region"
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
                  <button
                    type="button"
                    onClick={addRegion}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                
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
                Add all cities/regions where your vehicle is available for transport
              </p>
            </div>

            {formData.availableRegions.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Selected Regions:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.availableRegions.map((region, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {region}
                      <button
                        type="button"
                        onClick={() => removeRegion(region)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Vehicle Features
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {vehicleFeatures.map(feature => (
              <label
                key={feature}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.features.includes(feature)}
                  onChange={() => toggleFeature(feature)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{feature}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Driver Details */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Driver Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Driver Name</label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) => handleInputChange('driverName', e.target.value)}
                className="input"
                placeholder="Enter driver name"
                required
              />
            </div>

            <div>
              <label className="label">Driver Contact</label>
              <input
                type="tel"
                value={formData.driverContact}
                onChange={(e) => handleInputChange('driverContact', e.target.value)}
                className="input"
                placeholder="Enter contact number"
                required
                pattern="[0-9]{10}"
              />
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Certifications</h2>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.insuranceValid}
                onChange={(e) => handleInputChange('insuranceValid', e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Insurance Valid</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pollutionCertValid}
                onChange={(e) => handleInputChange('pollutionCertValid', e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Pollution Certificate Valid</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.fitnessValid}
                onChange={(e) => handleInputChange('fitnessValid', e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Fitness Certificate Valid</span>
            </label>
          </div>
        </div>

        {/* Additional Info */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
          
          <div>
            <label className="label">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="input"
              placeholder="Add any additional details about your vehicle..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" />
                Listing Vehicle...
              </>
            ) : (
              <>
                <Truck className="h-5 w-5 mr-2" />
                List Vehicle
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/transporter')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default ListVehicle
